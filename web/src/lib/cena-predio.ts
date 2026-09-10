import * as THREE from "three";
import * as p from "@/lib/cena3d";

/* Carvalho & Seixas · o prédio que abre.

   Um prédio carioca de cinco pavimentos visto da calçada. Conforme a página
   rola, a câmera sobe até um apartamento do terceiro andar, a parede da
   frente daquele apartamento GIRA como uma porta, a luz de dentro acende, e
   a câmera entra na sala.

   Por que assim, e não um vídeo: o mesmo modelo serve a três leituras da
   marca (de fora, na abertura, e por dentro), pesa poucos milhares de
   triângulos, e responde ao ritmo de quem rola em vez de tocar sozinho.

   A cena NÃO se anima sozinha: quem manda no tempo é `irPara(t)`, com `t`
   de 0 a 1. Quem chama é o ScrollTrigger, no componente. Isso mantém o
   módulo sem dependência de rolagem e testável fora do navegador. */

export type CenaPredio = {
  medir: () => void;
  parar: () => void;
  irPara: (t: number) => void;
};

const LUZ = 0xffb455;

/* Percurso da câmera. Cada trecho é um par de posições, e o `t` global é
   repartido entre eles. Guardar o percurso como dado, e não como sequência
   de `if`, deixa o ajuste de enquadramento a uma linha de distância. */
type Passo = { t: number; de: THREE.Vector3; para: THREE.Vector3 };
function passo(t: number, de: number[], para: number[]): Passo {
  return { t, de: new THREE.Vector3(...de), para: new THREE.Vector3(...para) };
}

const PERCURSO: Passo[] = [
  /* Começa no meio da rua, olhando a quadra em diagonal: é o quadro que lê
     como CIDADE, com as fachadas geminadas correndo para a direita, o
     asfalto no primeiro plano e o morro no fundo. O prédio da cena fica à
     direita do centro, que é onde o texto da abertura não está. */
  passo(0.0, [-88, 20, 56], [18, 24, 8]), // no meio da rua, quadra em fuga
  passo(0.3, [-28, 25, 50], [2, 30, 9]), // aproxima do prédio e sobe
  passo(0.52, [6, 30.5, 32], [0, 30.5, 4]), // de frente para a parede que abre
  passo(0.74, [1.5, 31, 14], [0, 29.5, -1]), // na soleira
  /* O fim para NO VÃO, não no meio da sala: medido, a 7 de profundidade a
     câmera passava do sofá e o quadro virava abajur e mesa de canto. */
  passo(1.0, [2.2, 31.2, 9.8], [-1.4, 28.4, -2]), // dentro, virado para o sofá
];

function interpolar(t: number, quais: "de" | "para") {
  const v = new THREE.Vector3();
  for (let i = 0; i < PERCURSO.length - 1; i++) {
    const a = PERCURSO[i];
    const b = PERCURSO[i + 1];
    if (t <= b.t || i === PERCURSO.length - 2) {
      const bruto = (t - a.t) / (b.t - a.t);
      const k = Math.min(1, Math.max(0, bruto));
      /* Suavização em cada trecho: sem ela a câmera muda de direção com
         um tranco visível na emenda entre dois pontos do percurso. */
      const suave = k * k * (3 - 2 * k);
      return v.lerpVectors(a[quais], b[quais], suave);
    }
  }
  return v.copy(PERCURSO[0][quais]);
}

/** Regra de três com corte nas pontas: converte `t` global em 0..1 local. */
function faixa(t: number, ini: number, fim: number) {
  return Math.min(1, Math.max(0, (t - ini) / (fim - ini)));
}

export function montarPredio(alvo: HTMLElement): CenaPredio | null {
  const largura = alvo.clientWidth || 960;
  const alturaPx = alvo.clientHeight || 540;

  const cena = new THREE.Scene();
  cena.fog = new THREE.Fog(0x102a4c, 150, 460);
  const camera = new THREE.PerspectiveCamera(38, largura / alturaPx, 0.5, 500);

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
  } catch {
    return null;
  }
  /* Teto de 1,5 e não 2: numa tela retina a cena cobre o quadro inteiro, e
     o dobro de pixel por lado é o quádruplo de trabalho por quadro. A
     diferença visual numa cena de sombreamento chapado é quase nula. */
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(largura, alturaPx, false);
  if ("outputColorSpace" in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  /* A sombra NÃO se recalcula a cada quadro. Ela só muda quando a parede
     gira, e é isso que o laço abaixo controla: cena parada, zero trabalho
     de sombra. Auto-atualização ligada numa cena estática é o desperdício
     mais caro e mais invisível de três.js. */
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  alvo.appendChild(renderer.domElement);

  const grupo = new THREE.Group();
  cena.add(grupo);

  // ---------------------------------------------------------- materiais
  const mParede = p.mat(0xd8d0bb, 0.95);
  const mDetalhe = p.mat(0xc3baa3, 0.9);
  const mSoco = p.mat(0x2c3038, 0.9);
  const mMetal = p.mat(0xc9a24c, 0.42, 0.55);
  const mPiso = p.mat(0x8a7458, 0.9);
  const mTapete = p.mat(0x1d4468, 0.98);
  const mEstofado = p.mat(0x24486f, 0.95);
  const mFolha = p.mat(0x123a34, 0.95, 0, true);

  const L = 30;
  const P = 18;
  const TERREO = 8;
  const PISO = 9;
  const H = TERREO + PISO * 4;

  /* 🔴 O prédio é uma CASCA, não um bloco maciço, e a fachada tem um VÃO
     recortado na geometria.

     Na primeira montagem a parede girava e não revelava nada: atrás dela
     continuava a caixa sólida do prédio. Sem furo não há interior, por mais
     que a folha abra. `Shape` com `holes` faz o recorte numa peça só, e a
     casca (fundo, laterais, laje e cobertura) fecha o volume sem encher o
     miolo, que é onde a sala mora. */
  function fachadaComVao(
    larg: number,
    alt: number,
    esp: number,
    vao: { x: number; y: number; l: number; a: number },
    material: THREE.Material,
  ) {
    const forma = new THREE.Shape();
    forma.moveTo(-larg / 2, 0);
    forma.lineTo(larg / 2, 0);
    forma.lineTo(larg / 2, alt);
    forma.lineTo(-larg / 2, alt);
    forma.lineTo(-larg / 2, 0);
    const furo = new THREE.Path();
    furo.moveTo(vao.x - vao.l / 2, vao.y);
    furo.lineTo(vao.x + vao.l / 2, vao.y);
    furo.lineTo(vao.x + vao.l / 2, vao.y + vao.a);
    furo.lineTo(vao.x - vao.l / 2, vao.y + vao.a);
    furo.lineTo(vao.x - vao.l / 2, vao.y);
    forma.holes.push(furo);
    const m = new THREE.Mesh(
      new THREE.ExtrudeGeometry(forma, { depth: esp, bevelEnabled: false }),
      material,
    );
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  // ------------------------------------------------------------- prédio
  const fachada = fachadaComVao(
    L,
    H,
    0.6,
    { x: 0, y: TERREO + PISO * 2, l: 10, a: PISO },
    mParede,
  );
  fachada.position.set(0, 0, P / 2 - 0.6);
  grupo.add(fachada);
  grupo.add(p.caixa(L, H, 0.6, mParede, 0, H / 2, -P / 2)); // fundo
  grupo.add(p.caixa(0.6, H, P, mParede, -L / 2, H / 2, 0)); // lateral
  grupo.add(p.caixa(0.6, H, P, mParede, L / 2, H / 2, 0)); // lateral
  grupo.add(p.caixa(L, 0.6, P, mParede, 0, H, 0)); // cobertura
  grupo.add(p.caixa(L + 0.6, TERREO, P + 0.6, p.mat(0x1a2c46, 0.85), 0, TERREO / 2, 0));
  grupo.add(p.caixa(L + 1, 1.8, P + 1, mDetalhe, 0, H + 0.9, 0));
  const cx = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 3.4, 14), mDetalhe);
  cx.position.set(L / 4, H + 3.4, 0);
  cx.castShadow = true;
  grupo.add(cx);

  // Térreo: vitrine acesa e toldo listrado, que é o que faz prédio de rua.
  const mVitrine = new THREE.MeshStandardMaterial({
    color: 0x14243a,
    emissive: LUZ,
    emissiveIntensity: 0.45,
    roughness: 0.2,
  });
  grupo.add(p.caixa(18, 4.4, 0.4, mVitrine, -4, 3.4, P / 2 + 0.2));
  grupo.add(p.caixa(3.4, 5.6, 0.4, p.mat(0x243b5c, 0.6, 0.1), 10, 2.8, P / 2 + 0.2));
  for (let i = 0; i < 9; i++) {
    grupo.add(
      p.caixa(2.2, 0.35, 3, i % 2 ? mParede : mSoco, -13 + i * 2.4, 6.6, P / 2 + 1.5),
    );
  }

  /* Janelas dos andares. A do apartamento escolhido não entra aqui: ela vai
     na parede que gira, senão a janela ficaria parada no ar quando abrisse. */
  const ESCOLHIDO = { andar: 2, coluna: 1 }; // terceiro pavimento, meio
  const colunas = [-10, 0, 10];
  for (let a = 0; a < 4; a++) {
    for (let c = 0; c < colunas.length; c++) {
      if (a === ESCOLHIDO.andar && c === ESCOLHIDO.coluna) continue;
      const y = TERREO + PISO * a + PISO / 2;
      const j = p.janela(6, 4.6, c === 1 ? 0.9 : 0.45 + a * 0.12, mDetalhe);
      j.position.set(colunas[c], y, P / 2 + 0.05);
      grupo.add(j);
      const laje = p.caixa(7.6, 0.4, 1.6, mDetalhe, colunas[c], y - 2.8, P / 2 + 0.7);
      grupo.add(laje);
      const gr = p.grade(7, 1.5, mMetal);
      gr.position.set(colunas[c], y - 2.6, P / 2 + 1.3);
      grupo.add(gr);
    }
  }

  // --------------------------------------------------- o apartamento
  const yBase = TERREO + PISO * ESCOLHIDO.andar; // 26
  const yMeio = yBase + PISO / 2; // 30.5
  const LARG = 10;
  const FUND = 13;
  const zFrente = P / 2; // 9

  /* A sala é um volume aberto para a frente, embutido no prédio. Sem as
     paredes laterais e o teto a câmera entraria num vão sem escala. */
  const sala = new THREE.Group();
  sala.add(p.caixa(LARG, 0.4, FUND, mPiso, 0, yBase + 0.2, zFrente - FUND / 2));
  sala.add(p.caixa(LARG, 0.4, FUND, mParede, 0, yBase + PISO - 0.6, zFrente - FUND / 2));
  sala.add(p.caixa(0.4, PISO, FUND, mParede, -LARG / 2, yMeio, zFrente - FUND / 2));
  sala.add(p.caixa(0.4, PISO, FUND, mParede, LARG / 2, yMeio, zFrente - FUND / 2));
  sala.add(p.caixa(LARG, PISO, 0.4, mParede, 0, yMeio, zFrente - FUND));

  // Janela do fundo: é ela que dá profundidade quando a câmera entra.
  /* Rugosidade alta de propósito: com material liso as duas luzes da sala
     apareciam refletidas como duas bolas brancas no vidro da janela. */
  const mCeu = new THREE.MeshStandardMaterial({
    color: 0x2a3d55,
    emissive: 0x7ea8d4,
    emissiveIntensity: 0.55,
    roughness: 0.92,
    metalness: 0,
  });
  sala.add(p.caixa(5.4, 3.6, 0.2, mCeu, -1.5, yBase + 4.6, zFrente - FUND + 0.15));
  sala.add(p.caixa(6, 0.3, 0.5, mDetalhe, -1.5, yBase + 2.7, zFrente - FUND + 0.4));

  // Sofá, mesa, tapete, luminária e planta.
  sala.add(p.caixa(6, 0.7, 2.4, mEstofado, -1, yBase + 0.75, zFrente - 3.4));
  sala.add(p.caixa(6, 1.5, 0.6, mEstofado, -1, yBase + 1.3, zFrente - 2.4));
  sala.add(p.caixa(2.6, 0.6, 2, mEstofado, -3.4, yBase + 1.2, zFrente - 3.6));
  sala.add(p.caixa(7.4, 0.06, 4.6, mTapete, -1, yBase + 0.42, zFrente - 6));
  sala.add(p.caixa(2.6, 0.25, 1.4, mPiso, -1, yBase + 1.3, zFrente - 6.2));
  sala.add(p.caixa(0.2, 1.1, 0.2, mSoco, -1.8, yBase + 0.8, zFrente - 6.2));
  sala.add(p.caixa(0.2, 1.1, 0.2, mSoco, -0.2, yBase + 0.8, zFrente - 6.2));

  const arv = p.folhagem(1.1, mFolha);
  arv.position.set(3.4, yBase + 0.6, zFrente - 9);
  sala.add(arv);
  sala.add(p.caixa(1.2, 1.2, 1.2, mDetalhe, 3.4, yBase + 1, zFrente - 9));

  const abajur = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 1.2, 1.4, 12),
    p.mat(0xf0e6d2, 0.9),
  );
  abajur.position.set(-4.4, yBase + 3.4, zFrente - 9.4);
  sala.add(abajur);
  sala.add(p.caixa(0.18, 2.6, 0.18, mSoco, -4.4, yBase + 2, zFrente - 9.4));
  grupo.add(sala);

  /* Luz de dentro. Começa apagada e acende junto com a abertura: é a
     recompensa da rolagem, e é o que separa "buraco na parede" de "casa". */
  /* Luz MOTIVADA: o ponto de luz mora dentro do abajur, não flutuando no
     meio do ar. Ponto solto perto de parede deixa uma bolha redonda visível
     na parede, e foi assim que apareceu no primeiro teste. */
  const luzSala = new THREE.PointLight(LUZ, 0, 34, 2);
  luzSala.position.set(-4.4, yBase + 3.6, zFrente - 9.4);
  grupo.add(luzSala);
  /* Preenchimento frio vindo da janela do fundo, longe da parede para não
     virar mancha. É o que impede o canto oposto de fechar em preto. */
  const luzApoio = new THREE.PointLight(0xbcd6f2, 0, 26, 2);
  luzApoio.position.set(-1, yBase + 5, zFrente - 7.5);
  grupo.add(luzApoio);

  /* A parede que gira. O nó fica na DOBRADIÇA (borda esquerda do vão) e a
     parede entra deslocada meia largura: girar um objeto pelo próprio
     centro faria a parede atravessar o prédio em vez de abrir. */
  const dobradica = new THREE.Group();
  dobradica.position.set(-LARG / 2, yMeio, zFrente + 0.2);
  const folha = new THREE.Group();
  folha.position.set(LARG / 2, 0, 0);
  folha.add(p.caixa(LARG, PISO, 0.5, mParede, 0, 0, 0));
  const janelaFolha = p.janela(6, 4.6, 1.15, mDetalhe);
  janelaFolha.position.set(0, 0, 0.3);
  folha.add(janelaFolha);
  dobradica.add(folha);
  grupo.add(dobradica);

  // Sacada do apartamento: fica de fora da folha, senão giraria junto.
  grupo.add(p.caixa(11.6, 0.4, 1.8, mDetalhe, 0, yBase + 0.1, zFrente + 0.9));
  const gradeApto = p.grade(11, 1.6, mMetal);
  gradeApto.position.set(0, yBase + 0.3, zFrente + 1.6);
  grupo.add(gradeApto);

  // =========================================================== A QUADRA
  /* Calçada de pedra portuguesa nos dois lados e a fita de asfalto no meio.
     A guia (o degrau da calçada) é o que separa rua de calçada no olho: sem
     ela o asfalto parece um tapete pintado no chão. */
  const piso = new THREE.Mesh(
    new THREE.PlaneGeometry(620, 460),
    new THREE.MeshStandardMaterial({
      map: p.pisoDaCalcada(renderer.capabilities.getMaxAnisotropy()),
      roughness: 0.95,
    }),
  );
  piso.rotation.x = -Math.PI / 2;
  piso.receiveShadow = true;
  grupo.add(piso);

  const Z_GUIA_PERTO = 26;
  const Z_GUIA_LONGE = 62;
  const mAsfalto = p.mat(0x1b2130, 0.92);
  const rua = new THREE.Mesh(
    new THREE.PlaneGeometry(620, Z_GUIA_LONGE - Z_GUIA_PERTO),
    mAsfalto,
  );
  rua.rotation.x = -Math.PI / 2;
  rua.position.set(0, 0.04, (Z_GUIA_PERTO + Z_GUIA_LONGE) / 2);
  rua.receiveShadow = true;
  grupo.add(rua);

  const mGuia = p.mat(0xb9b1a0, 0.9);
  [Z_GUIA_PERTO, Z_GUIA_LONGE].forEach((z) => {
    grupo.add(p.caixa(620, 0.7, 1.2, mGuia, 0, 0.35, z));
  });

  // Faixa central tracejada: dá a direção da rua e o senso de comprimento.
  const mFaixa = p.mat(0xd8d0bb, 0.9);
  for (let x = -280; x < 280; x += 24) {
    grupo.add(p.caixa(11, 0.06, 0.9, mFaixa, x, 0.09, (Z_GUIA_PERTO + Z_GUIA_LONGE) / 2));
  }

  /* Fachadas vizinhas. Três texturas de canvas compartilhadas: um prédio
     inteiro sai numa chamada de desenho, e a variação vem de largura,
     altura e de qual das três ele usa. */
  const PELES = [
    p.fachada(7, 12, 0.42),
    p.fachada(6, 10, 0.3),
    p.fachada(8, 14, 0.5),
  ];
  const mPeles = PELES.map(
    (tex) =>
      new THREE.MeshStandardMaterial({
        map: tex,
        emissive: 0xffffff,
        emissiveMap: tex,
        emissiveIntensity: 0.75,
        roughness: 0.85,
      }),
  );
  const mPlatibanda = p.mat(0xb3aa97, 0.9);
  const mTerreo = p.mat(0x172a45, 0.85);

  /* `frente` diz para que lado a fachada olha: +1 é o nosso lado da rua,
     -1 é o de lá, que aparece girado meia volta. */
  function vizinho(x: number, larg: number, alt: number, pele: number, frente: number) {
    const g = new THREE.Group();
    const fundura = 20;
    g.add(p.caixa(larg, alt, fundura, mPeles[pele % mPeles.length], 0, alt / 2, 0));
    g.add(p.caixa(larg + 0.8, 1.6, fundura + 0.8, mPlatibanda, 0, alt + 0.8, 0));
    // Térreo mais escuro: na rua o primeiro pavimento quase nunca é igual
    // ao resto, e é isso que impede a fachada de virar carimbo repetido.
    g.add(p.caixa(larg + 0.5, 6, fundura + 0.5, mTerreo, 0, 3, 0));
    g.position.set(x, 0, frente > 0 ? 0 : Z_GUIA_LONGE + 12);
    if (frente < 0) g.rotation.y = Math.PI;
    grupo.add(g);
    return g;
  }

  // Do nosso lado, geminadas com o prédio da cena: sem vão entre elas.
  const DIREITA = [
    [22, 38, 0],
    [16, 52, 1],
    [26, 30, 2],
    [18, 46, 1],
    [24, 34, 0],
  ] as const;
  let borda = L / 2;
  DIREITA.forEach(([larg, alt, pele]) => {
    vizinho(borda + larg / 2, larg, alt, pele, 1);
    borda += larg;
  });
  const ESQUERDA = [
    [20, 34, 2],
    [26, 48, 0],
    [18, 40, 1],
  ] as const;
  borda = -L / 2;
  ESQUERDA.forEach(([larg, alt, pele]) => {
    vizinho(borda - larg / 2, larg, alt, pele, 1);
    borda -= larg;
  });

  // O outro lado da rua fecha o corredor. Sem ele a rua vira estrada.
  const LADO_DE_LA = [
    [-96, 28, 44, 1],
    [-68, 24, 32, 2],
    [-44, 30, 50, 0],
    [-10, 26, 36, 1],
    [20, 32, 46, 2],
    [56, 24, 30, 0],
    [86, 28, 40, 1],
  ] as const;
  LADO_DE_LA.forEach(([x, larg, alt, pele]) => vizinho(x, larg, alt, pele, -1));

  /* Poste, árvore e carro: é o que dá escala humana. Sem nada de tamanho
     conhecido na cena, um prédio de quatro andares e um de vinte parecem
     iguais. A luz do poste é emissiva, não é luz de verdade: mais uma luz
     por poste custaria caro e não muda o quadro. */
  const mPoste = p.mat(0x2b3038, 0.7, 0.3);
  const mLampada = new THREE.MeshStandardMaterial({
    color: 0xffe6b8,
    emissive: 0xffb455,
    emissiveIntensity: 1.5,
    roughness: 0.4,
  });
  [-46, -8, 34, 72].forEach((x) => {
    const poste = new THREE.Group();
    poste.add(p.caixa(0.7, 16, 0.7, mPoste, 0, 8, 0));
    poste.add(p.caixa(3.4, 0.5, 0.6, mPoste, 1.5, 16, 0));
    poste.add(p.caixa(1.5, 0.45, 0.9, mLampada, 2.5, 15.6, 0));
    poste.position.set(x, 0, Z_GUIA_PERTO - 3);
    grupo.add(poste);
  });

  const mCarro = p.mat(0x24486f, 0.5, 0.3);
  const mVidroCarro = p.mat(0x0e1c30, 0.25, 0.5);
  const mLanterna = new THREE.MeshStandardMaterial({
    color: 0x8a2b22,
    emissive: 0xff5a3c,
    emissiveIntensity: 1.6,
    roughness: 0.4,
  });
  const mRoda = p.mat(0x14161c, 0.9);
  function carro(x: number, giro: number) {
    const c = new THREE.Group();
    c.add(p.caixa(11, 2.4, 4.6, mCarro, 0, 2.2, 0));
    c.add(p.caixa(6.4, 2.2, 4.2, mVidroCarro, -0.6, 4.2, 0));
    c.add(p.caixa(0.4, 0.7, 3.4, mLanterna, 5.5, 2.6, 0));
    [-3.4, 3.4].forEach((dx) =>
      [-2.3, 2.3].forEach((dz) => {
        const r = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.8, 10), mRoda);
        r.rotation.x = Math.PI / 2;
        r.position.set(dx, 1.1, dz);
        r.castShadow = true;
        c.add(r);
      }),
    );
    c.position.set(x, 0, Z_GUIA_PERTO + 6);
    c.rotation.y = giro;
    grupo.add(c);
  }
  carro(-30, 0);
  carro(46, Math.PI);

  const mTronco = p.mat(0x2a2118, 0.95);
  [-58, 12, 60].forEach((x) => {
    const arv = p.arvore(17, mFolha, mTronco);
    arv.position.set(x, 0, Z_GUIA_PERTO - 7);
    grupo.add(arv);
  });

  /* Fundo: silhueta de quadra distante e o morro. É o que impede o céu de
     encostar no telhado dos vizinhos e entregar que a cidade acaba ali. */
  const mLonge = p.mat(0x14304f, 0.95);
  for (let i = 0; i < 16; i++) {
    const larg = 20 + ((i * 37) % 26);
    const alt = 26 + ((i * 53) % 44);
    grupo.add(p.caixa(larg, alt, 16, mLonge, -300 + i * 40, alt / 2, -120 - ((i * 29) % 60)));
  }
  const mMorro = p.mat(0x0f2947, 0.98, 0, true);
  [
    [-150, 120, 74, -260],
    [40, 170, 96, -300],
    [190, 130, 64, -250],
  ].forEach(([x, larg, alt, z]) => {
    const m = new THREE.Mesh(new THREE.ConeGeometry(larg, alt, 5), mMorro);
    m.position.set(x, alt / 2 - 8, z);
    m.rotation.y = x;
    grupo.add(m);
  });

  // ------------------------------------------------------------- luzes
  cena.add(new THREE.HemisphereLight(0x7ba0cd, 0x0a1a30, 0.36));
  const chave = new THREE.DirectionalLight(0xffc98a, 1.3);
  chave.position.set(-80, 60, 46);
  chave.castShadow = true;
  /* O mapa cresceu junto com a cena: cobrindo 240 unidades num mapa de
     1024 cada texel virava 4 unidades, e a fachada ficava coberta de
     manchas escuras em vez de sombra. 2048 sobre 120 dá pouco mais de
     0,1 unidade por texel, e o custo só aparece quando a cena se move,
     porque o mapa não se atualiza com a cena parada. */
  chave.shadow.mapSize.set(2048, 2048);
  chave.shadow.normalBias = 0.6;
  const d = 120;
  chave.shadow.camera.left = -d;
  chave.shadow.camera.right = d;
  chave.shadow.camera.top = d;
  chave.shadow.camera.bottom = -d;
  chave.shadow.camera.far = 300;
  chave.shadow.bias = -0.0012;
  cena.add(chave);
  const contra = new THREE.DirectionalLight(0x8fb4e2, 0.45);
  contra.position.set(50, 34, -80);
  cena.add(contra);

  // ------------------------------------------------------------ tempo
  let alvoT = 0;
  let t = 0;
  let rodando = true;
  let req = 0;

  function aplicar(v: number) {
    camera.position.copy(interpolar(v, "de"));
    camera.lookAt(interpolar(v, "para"));

    // A parede abre entre 34% e 62% da rolagem.
    const abre = faixa(v, 0.34, 0.62);
    folha.parent!.rotation.y = -abre * 1.95;

    // A luz de dentro entra um pouco depois da fresta aparecer.
    const acende = faixa(v, 0.38, 0.7);
    luzSala.intensity = acende * 46;
    luzApoio.intensity = acende * 12;
    janelaFolha.userData.vidro.emissiveIntensity = 1.15 + acende * 0.8;

    /* Neblina fecha quando a câmera entra: dentro da sala o prédio vizinho
       e a calçada não deveriam mais aparecer pelo vão. */
    (cena.fog as THREE.Fog).near = 150 - faixa(v, 0.7, 1) * 120;
  }
  aplicar(0);

  /* 🔴 Só desenha quando algo mudou.

     A cena da abertura fica PARADA a maior parte do tempo: enquanto a
     pessoa lê o título, nada se move. Desenhar 60 quadros por segundo de
     uma imagem idêntica é o que fazia a página travar junto com o resto.
     Aqui o laço continua vivo (é ele que ouve a rolagem), mas a chamada de
     desenho e o recálculo de sombra só acontecem enquanto `t` caminha. */
  const PARADO = 0.0004;

  function quadro() {
    req = requestAnimationFrame(quadro);
    if (!rodando) return;
    const resta = alvoT - t;
    if (Math.abs(resta) < PARADO) return;
    // Amortecimento: a rolagem chega em degraus, e sem isso a câmera pula.
    t += resta * 0.12;
    aplicar(t);
    renderer.shadowMap.needsUpdate = true;
    renderer.render(cena, camera);
  }
  req = requestAnimationFrame(quadro);

  function medir() {
    const l = alvo.clientWidth;
    const a = alvo.clientHeight;
    if (!l || !a) return;
    camera.aspect = l / a;
    camera.updateProjectionMatrix();
    renderer.setSize(l, a, false);
    // Sem este desenho, redimensionar com a cena parada deixaria o quadro
    // antigo esticado na tela nova.
    renderer.shadowMap.needsUpdate = true;
    renderer.render(cena, camera);
  }
  window.addEventListener("resize", medir);

  let observador: IntersectionObserver | null = null;
  if ("IntersectionObserver" in window) {
    observador = new IntersectionObserver((es) => (rodando = es[0].isIntersecting), {
      threshold: 0.02,
    });
    observador.observe(alvo);
  }

  /* Desmontar de verdade: sem `dispose()` mais `forceContextLoss()` o
     contexto WebGL fica vivo, e o navegador segura cerca de dezesseis. Com
     Strict Mode e HMR o teto chega rápido, e a partir dali a cena some sem
     erro nenhum no console. */
  function parar() {
    cancelAnimationFrame(req);
    window.removeEventListener("resize", medir);
    observador?.disconnect();
    cena.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose?.();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose?.();
    });
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  }

  return {
    medir,
    parar,
    irPara: (v: number) => {
      alvoT = Math.min(1, Math.max(0, v));
    },
  };
}
