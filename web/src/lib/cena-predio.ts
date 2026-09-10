import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import * as p from "@/lib/cena3d";
import * as tex from "@/lib/texturas";

/* Carvalho & Seixas · a rua que abre.

   Uma quadra carioca no fim da tarde. Conforme a página rola, a câmera sai
   do meio da rua, sobe até um apartamento do terceiro andar, a parede da
   frente daquele apartamento GIRA como uma porta, a luz acende e a câmera
   entra na sala.

   O que faz a cena NÃO parecer lisa, em ordem de importância:

   1. **rugosidade e relevo variando** (`texturas.ts`). Superfície com
      rugosidade constante devolve a luz igual em cada ponto, e é isso que o
      olho lê como plástico;
   2. **sujeira onde a chuva escorre** e na base das paredes. Prédio limpo
      dos pés à cobertura só existe em maquete;
   3. **entulho de cobertura**: caixa d'água, antena, cano, casa de máquina.
      É o que dá silhueta recortada em vez de bloco;
   4. **escala humana**: poste, fiação, lixeira, ponto de ônibus, semáforo e
      carro. Sem nada de tamanho conhecido, prédio de quatro andares e de
      vinte parecem iguais;
   5. **mapeamento de tom fotográfico e brilho nas luzes**, que é o que
      transforma janela acesa em LUZ e não em retângulo amarelo.

   Na parte da câmera a cena não se anima sozinha: quem manda no tempo é
   `irPara(t)`. Quem tem vida própria é o carro, e é por causa dele que o
   laço desenha enquanto a abertura está visível, com teto de 30 quadros. */

export type CenaPredio = {
  medir: () => void;
  parar: () => void;
  /* `agora` salta sem amortecimento. A rolagem nunca usa isso; serve para
     fotografar uma fase exata, porque com amortecimento o quadro sai numa
     posição intermediária e a prova mente. */
  irPara: (t: number, agora?: boolean) => void;
};

const LUZ = 0xffb455;

type Passo = { t: number; de: THREE.Vector3; para: THREE.Vector3 };
function passo(t: number, de: number[], para: number[]): Passo {
  return { t, de: new THREE.Vector3(...de), para: new THREE.Vector3(...para) };
}

/* Percurso da câmera como DADO, não como sequência de `if`: ajustar
   enquadramento fica a uma linha de distância. */
const PERCURSO: Passo[] = [
  passo(0.0, [-88, 20, 56], [18, 24, 8]), // no meio da rua, quadra em fuga
  passo(0.3, [-28, 25, 50], [2, 30, 9]), // aproxima do prédio e sobe
  passo(0.52, [6, 30.5, 32], [0, 30.5, 4]), // de frente para a parede que abre
  passo(0.74, [1.8, 31.2, 13.2], [-0.6, 30.6, 0]), // na soleira
  /* O fim para NO VÃO, não no meio da sala: medido, a 7 de profundidade a
     câmera passava do sofá e o quadro virava abajur e mesa de canto. */
  // Dentro da sala, na altura dos olhos: o prêmio do rolamento é a SALA,
  // e antes a câmera parava no plano da janela olhando para o piso.
  passo(1.0, [3.6, 31.7, 10.2], [-1.4, 29.5, -2]),
];

function interpolar(t: number, quais: "de" | "para") {
  const v = new THREE.Vector3();
  for (let i = 0; i < PERCURSO.length - 1; i++) {
    const a = PERCURSO[i];
    const b = PERCURSO[i + 1];
    if (t <= b.t || i === PERCURSO.length - 2) {
      const k = Math.min(1, Math.max(0, (t - a.t) / (b.t - a.t)));
      // Suavização por trecho: sem ela a emenda entre dois pontos dá tranco.
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
  /* Alcance grande: com 460 o morro do outro lado da baía nascia apagado.
     A cor é a do HORIZONTE, não um azul qualquer: neblina de cor diferente
     do céu vira uma mancha visível onde a cidade some. */
  cena.fog = new THREE.Fog(0x2b3a58, 220, 1100);
  /* 🔴 O plano distante era 600, e por isso a cúpula do céu (raio 1200) e
     o morro do outro lado da baía simplesmente não desenhavam: ficavam
     inteiros atrás do corte da câmera, sem erro nenhum no console. */
  const camera = new THREE.PerspectiveCamera(38, largura / alturaPx, 0.5, 2600);

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(largura, alturaPx, false);
  /* Mapeamento de tom fotográfico: em vez de cortar o branco, a luz forte
     rola para o branco como em filme. É metade da diferença entre "render
     de teste" e "imagem". */
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  /* A sombra só se recalcula quando a parede gira. Auto-atualização numa
     cena praticamente estática é o desperdício mais invisível do three. */
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  alvo.appendChild(renderer.domElement);

  /* Brilho nas fontes de luz.

     🔴 A dose é o que decide entre "luz" e "névoa". No primeiro teste,
     emissão em 1,5 com limiar em 0,78 fez o brilho pegar a fachada inteira
     e a rua virou um lençol quente. Limiar em 0,92 deixa passar só o miolo
     da janela acesa, da lâmpada e do farol. */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(cena, camera));
  composer.addPass(
    new UnrealBloomPass(new THREE.Vector2(largura, alturaPx), 0.34, 0.42, 0.92),
  );
  composer.addPass(new OutputPass());

  const grupo = new THREE.Group();
  cena.add(grupo);

  const nitidez = renderer.capabilities.getMaxAnisotropy();
  const descartaveis: THREE.Texture[] = [];
  function guardar(pele: tex.Pele) {
    descartaveis.push(pele.map);
    if (pele.bumpMap) descartaveis.push(pele.bumpMap);
    if (pele.roughnessMap) descartaveis.push(pele.roughnessMap);
    return pele;
  }

  // ---------------------------------------------------- peles e materiais
  /* 🔴 PEDRA, não reboco. O reboco manchado com escorrido de chuva é o
     acabamento de prédio antigo de rua movimentada, e nenhuma cor salva
     essa leitura. Placa de pedra clara com junta aparente é o que a Zona
     Sul usa, e é o item que muda mais o padrão do quadro. */
  const mParede = tex.vestir(p.mat(0xffffff, 0.72), guardar(tex.pedra("#ded8cb", nitidez)), 0.16);
  const mDetalhe = tex.vestir(p.mat(0xffffff, 0.8), guardar(tex.pedra("#cfc9bb", nitidez)), 0.12);
  const mAsfalto = tex.vestir(p.mat(0xffffff, 0.95), guardar(tex.asfalto(nitidez)), 0.14);
  /* Esquadria preta fina. Caixilho branco e grosso engorda a janela e
     empurra o prédio para o padrão popular; alumínio preto some contra o
     vidro e deixa o pano de vidro ser o assunto. */
  const mEsquadria = p.mat(0x22242a, 0.34, 0.55);
  /* Pano de vidro de hall e de esquadria grande, com luz quente atrás.
     Declarado aqui porque a cobertura e os vizinhos usam antes do térreo,
     e `const` dentro do bloco de baixo estoura na zona morta em tempo de
     execução, sem o TypeScript acusar nada. */
  const mHall = new THREE.MeshStandardMaterial({
    color: 0x1d2c40,
    emissive: 0xffd9a6,
    emissiveIntensity: 0.62,
    roughness: 0.1,
    metalness: 0.3,
  });
  /* Guarda-corpo de vidro: laminado esverdeado, quase transparente. É o
     substituto direto da grade de ferro, e é o detalhe que mais diz
     "apartamento caro" numa sacada. */
  const mVidroGuarda = new THREE.MeshStandardMaterial({
    color: 0xbcd4d0,
    transparent: true,
    opacity: 0.24,
    roughness: 0.06,
    metalness: 0.2,
  });
  /* 🔴 Dentro de casa não existe escorrido de chuva. A sala usava o
     reboco de FACHADA, com sujeira de base e risco de chuva descendo pela
     parede: era o detalhe que mais entregava cena montada às pressas.
     Pintura lisa é o mesmo gerador com sujeira quase zero. */
  const mPintura = tex.vestir(
    p.mat(0xffffff, 0.94),
    guardar(tex.pintura("#e7dfd0", nitidez)),
    0.1,
  );
  const mTeto = tex.vestir(
    p.mat(0xffffff, 0.96),
    guardar(tex.pintura("#f2ece1", nitidez)),
    0.06,
  );
  const mSoco = p.mat(0x2c3038, 0.9);
  const mMetal = p.mat(0xc9a24c, 0.42, 0.55);
  const mFerro = p.mat(0x2b3038, 0.6, 0.35);
  const mPiso = tex.vestir(p.mat(0xffffff, 0.62), guardar(tex.tabua(nitidez)), 0.18);
  const mTapete = tex.vestir(
    p.mat(0xffffff, 0.98),
    guardar(tex.tecido("#1d4468", nitidez, 2)),
    0.1,
  );
  /* Sala de padrão: sofá de linho claro, almofada azul da marca. Sofá
     azul-escuro no meio de tapete azul-escuro fazia mancha só. */
  const mEstofado = tex.vestir(
    p.mat(0xffffff, 0.96),
    guardar(tex.tecido("#c6bda9", nitidez, 4)),
    0.14,
  );
  const mAlmofada = tex.vestir(
    p.mat(0xffffff, 0.96),
    guardar(tex.tecido("#1d3f69", nitidez, 6)),
    0.14,
  );
  const mCortinaSala = tex.vestir(
    p.mat(0xffffff, 0.97),
    guardar(tex.tecido("#e4d9c2", nitidez, 5)),
    0.1,
  );
  const mFolha = p.mat(0x123a34, 0.95, 0, true);
  const mTronco = p.mat(0x2a2118, 0.95);

  const L = 30;
  const P = 18;
  const TERREO = 8;
  const PISO = 9;
  const H = TERREO + PISO * 4;

  /* 🔴 O prédio é uma CASCA e a fachada tem um VÃO recortado na geometria.
     Na primeira montagem a parede girava e não revelava nada, porque atrás
     dela continuava a caixa sólida. `Shape` com `holes` faz o furo numa
     peça só. */
  type Vao = { x: number; y: number; l: number; a: number };
  function fachadaComVao(
    larg: number,
    alt: number,
    esp: number,
    vaos: Vao[],
    material: THREE.Material,
  ) {
    const forma = new THREE.Shape();
    forma.moveTo(-larg / 2, 0);
    forma.lineTo(larg / 2, 0);
    forma.lineTo(larg / 2, alt);
    forma.lineTo(-larg / 2, alt);
    forma.lineTo(-larg / 2, 0);
    vaos.forEach((vao) => {
      const furo = new THREE.Path();
      furo.moveTo(vao.x - vao.l / 2, vao.y);
      furo.lineTo(vao.x + vao.l / 2, vao.y);
      furo.lineTo(vao.x + vao.l / 2, vao.y + vao.a);
      furo.lineTo(vao.x - vao.l / 2, vao.y + vao.a);
      furo.lineTo(vao.x - vao.l / 2, vao.y);
      forma.holes.push(furo);
    });
    const g = new THREE.ExtrudeGeometry(forma, { depth: esp, bevelEnabled: false });
    /* A extrusão não traz coordenada de textura útil: sem recalcular, o
       reboco aparece esticado numa direção só.

       🔴 O ladrilho tem de ter tamanho fixo EM UNIDADES DE MUNDO. Quando
       eu repetia "4 por 6 vezes o tamanho da peça", a fachada de 30x44
       ficava com ladrilho de 7,5 e a folha de 10x9 com ladrilho de 2,5:
       mesma textura, grão diferente, e a parede que gira aparecia como
       painel remendado no meio do prédio. */
    const LADRILHO = 7.5;
    g.computeBoundingBox();
    const cx = g.boundingBox!;
    const pos = g.attributes.position;
    const uv: number[] = [];
    for (let i = 0; i < pos.count; i++) {
      uv.push(
        (pos.getX(i) - cx.min.x) / LADRILHO,
        (pos.getY(i) - cx.min.y) / LADRILHO,
      );
    }
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    const m = new THREE.Mesh(g, material);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  // =================================================== O PRÉDIO DA CENA
  /* Quem está acesa, por andar e coluna. Prédio com todas as janelas
     iguais é carimbo: rua de verdade tem apartamento apagado no meio de
     dois acesos, e é essa irregularidade que faz o prédio ter moradores.
     0 é apagada, 1 é sala com luz de teto. */
  const ESCOLHIDO = { andar: 2, coluna: 1 };
  const COLUNAS = [-10, 0, 10];
  const ACESAS = [0.8, 0, 0.45, 0, 1, 0.3, 0.55, 0, 0.9, 0.35, 0, 0.7];
  const JAN_L = 8.6;
  const JAN_A = 6.2;
  const JANELAS: { x: number; y: number; acesa: number; sacada: boolean }[] = [];
  for (let a = 0; a < 4; a++) {
    for (let c = 0; c < COLUNAS.length; c++) {
      if (a === ESCOLHIDO.andar && c === ESCOLHIDO.coluna) continue;
      JANELAS.push({
        x: COLUNAS[c],
        y: TERREO + PISO * a + PISO / 2,
        acesa: ACESAS[a * 3 + c],
        // Sacada na coluna do meio e nos andares ímpares das pontas:
        // sacada em tudo é a mesma repetição, só em relevo.
        sacada: c === 1 || a % 2 === 1,
      });
    }
  }

  const fachada = fachadaComVao(
    L,
    H,
    0.6,
    [
      { x: 0, y: TERREO + PISO * 2, l: 10, a: PISO },
      ...JANELAS.map((j) => ({ x: j.x, y: j.y - JAN_A / 2, l: JAN_L, a: JAN_A })),
    ],
    mParede,
  );
  fachada.position.set(0, 0, P / 2 - 0.6);
  grupo.add(fachada);
  grupo.add(p.caixa(L, H, 0.6, mParede, 0, H / 2, -P / 2));
  grupo.add(p.caixa(0.6, H, P, mParede, -L / 2, H / 2, 0));
  grupo.add(p.caixa(0.6, H, P, mParede, L / 2, H / 2, 0));
  grupo.add(p.caixa(L, 0.6, P, mDetalhe, 0, H, 0));
  grupo.add(p.caixa(L + 0.6, TERREO, P + 0.6, p.mat(0x1a2c46, 0.85), 0, TERREO / 2, 0));
  grupo.add(p.caixa(L + 1, 1.8, P + 1, mDetalhe, 0, H + 0.9, 0));

  /* Cobertura. 🔴 Caixa d'água aparente, antena de TV e prumada no
     telhado é exatamente a silhueta que o olho lê como padrão popular.
     Cobertura de padrão alto tem o contrário: um volume recuado com
     esquadria grande, pergolado de madeira e platibanda limpa. A silhueta
     continua quebrada, que era o ponto, mas agora quebra para cima. */
  function coberturaNobre(x: number, z: number, larg: number, alt: number) {
    const volume = larg * 0.52;
    grupo.add(p.caixa(volume, 7, 12, mParede, x - larg * 0.12, alt + 3.5, z - 3));
    grupo.add(p.caixa(volume * 0.7, 4.4, 0.3, mHall, x - larg * 0.12, alt + 3, z + 3.1));
    // Pergolado: viga mestra e as ripas por cima do terraço.
    const zp = z + 7;
    [-volume / 2, volume / 2].forEach((dx) => {
      grupo.add(p.caixa(0.5, 5, 0.5, mDetalhe, x - larg * 0.12 + dx, alt + 2.5, zp));
    });
    grupo.add(p.caixa(volume + 1.4, 0.4, 0.5, mDetalhe, x - larg * 0.12, alt + 5.2, zp));
    for (let i = 0; i < 7; i++) {
      grupo.add(
        p.caixa(0.3, 0.24, 5.4, mDetalhe, x - larg * 0.12 - volume / 2 + i * (volume / 6), alt + 5.4, zp - 2.4),
      );
    }
    // Jardineira na borda: verde na cobertura é assinatura de padrão.
    grupo.add(p.caixa(larg * 0.34, 1.1, 2.2, mDetalhe, x + larg * 0.3, alt + 0.9, z + 6));
    [0, 1, 2].forEach((i) => {
      const f = p.folhagem(1.5, mFolha);
      f.position.set(x + larg * 0.22 + i * 2.4, alt + 2, z + 6);
      grupo.add(f);
    });
  }
  coberturaNobre(0, 0, L, H + 1.8);

  /* 🔴 Térreo de PORTARIA, não de loja. Vitrine com toldo de lona
     listrada é comércio de rua, e era o que puxava o prédio para baixo no
     primeiro plano. Padrão alto no Rio é: marquise em laje, pano de vidro
     do hall com luz quente atrás, coluna de pedra e jardim com muro baixo
     na frente. */
  grupo.add(p.caixa(20, 6.4, 0.3, mHall, -2, 3.5, P / 2 + 0.15));
  // Montantes do pano de vidro do hall, de pé duplo.
  [-11.6, -6, -0.4, 5.2, 7.6].forEach((x) => {
    grupo.add(p.caixa(0.24, 6.4, 0.5, mEsquadria, x, 3.5, P / 2 + 0.35));
  });
  // Marquise: laje fina em balanço, com luminária embutida por baixo.
  grupo.add(p.caixa(24, 0.6, 7.4, mDetalhe, -2, 7.3, P / 2 + 3.4));
  grupo.add(p.caixa(0.8, 7, 0.8, mDetalhe, 8.4, 3.5, P / 2 + 6.2));
  const mSpot = new THREE.MeshStandardMaterial({
    color: 0xfff2d8,
    emissive: 0xffd9a6,
    emissiveIntensity: 1.5,
    roughness: 0.4,
  });
  [-12, -6, 0, 6].forEach((x) => {
    grupo.add(p.caixa(1.5, 0.12, 1.5, mSpot, x, 6.95, P / 2 + 3.4));
  });
  const luzHall = new THREE.PointLight(0xffd9a6, 60, 40, 2);
  luzHall.position.set(-3, 6, P / 2 + 4.5);
  grupo.add(luzHall);

  /* 🔴 Janela DENTRO do vão, não em cima da parede.

     Antes cada janela era um quadro colado em z = P/2 + 0,05: à distância
     enganava, mas com a câmera a poucos metros do reboco lia como
     decalque, porque não havia espessura nem peitoril fazendo sombra.
     Agora o vão é recortado na fachada, o fundo do nicho sela o furo, o
     vidro recua meia unidade e o caixilho fica na boca. Os 0,6 de reboco
     (uns 20 cm) passam a projetar a sombra da própria abertura, que é o
     sinal que o olho usa para saber que a parede tem massa. */
  const Z_FACE = P / 2;
  const mNicho = p.mat(0x0a1120, 0.95);
  /* Guarda-corpo de vidro: pano laminado, sapata embutida e corrimão fino
     de metal em cima. Três peças, e é o que substitui a grade de ferro em
     toda a cena. */
  function guardaCorpo(larg: number, x: number, y: number, z: number) {
    grupo.add(p.caixa(larg, 1.35, 0.1, mVidroGuarda, x, y + 0.7, z));
    grupo.add(p.caixa(larg, 0.14, 0.3, mMetal, x, y + 1.4, z));
    grupo.add(p.caixa(larg, 0.2, 0.4, mDetalhe, x, y + 0.1, z));
  }
  /* O vidro usa o cartão desenhado como cor E como emissão: o brilho
     segue o desenho, então a luz sai de onde está a lâmpada em vez de
     acender o retângulo todo. Emissão baixa de propósito, porque acima de
     ~0,8 o mapeamento de tom estoura tudo para o mesmo creme. */
  const peleApagada = tex.janelaApagada();
  descartaveis.push(peleApagada);
  const mVidroApagado = new THREE.MeshStandardMaterial({
    map: peleApagada,
    roughness: 0.12,
    metalness: 0.5,
  });
  const VIDROS_ACESOS = [0, 1, 2].map((v) => {
    const pele = tex.janelaAcesa(v);
    pele.colorSpace = THREE.SRGBColorSpace;
    descartaveis.push(pele);
    return new THREE.MeshStandardMaterial({
      map: pele,
      emissive: 0xffffff,
      emissiveMap: pele,
      emissiveIntensity: 0.5 + v * 0.12,
      roughness: 0.2,
    });
  });

  JANELAS.forEach(({ x, y, acesa, sacada }) => {
    // Fundo do nicho: sem ele o furo mostra o vazio da casca.
    grupo.add(p.caixa(JAN_L + 1, JAN_A + 1, 1.4, mNicho, x, y, Z_FACE - 1.3));
    const vidro = new THREE.Mesh(
      new THREE.PlaneGeometry(JAN_L - 0.3, JAN_A - 0.3),
      acesa > 0
        ? VIDROS_ACESOS[acesa > 0.75 ? 2 : acesa > 0.4 ? 1 : 0]
        : mVidroApagado,
    );
    vidro.position.set(x, y, Z_FACE - 0.45);
    grupo.add(vidro);

    // Esquadria fina e preta, com montante único: pano de vidro de duas
    // folhas de correr, que é o que fecha varanda de padrão alto.
    const e = 0.18;
    const zc = Z_FACE - 0.13;
    grupo.add(p.caixa(JAN_L, e, 0.3, mEsquadria, x, y + JAN_A / 2 - e / 2, zc));
    grupo.add(p.caixa(JAN_L, e, 0.3, mEsquadria, x, y - JAN_A / 2 + e / 2, zc));
    grupo.add(p.caixa(e, JAN_A, 0.3, mEsquadria, x - JAN_L / 2 + e / 2, y, zc));
    grupo.add(p.caixa(e, JAN_A, 0.3, mEsquadria, x + JAN_L / 2 - e / 2, y, zc));
    grupo.add(p.caixa(0.12, JAN_A - e * 2, 0.26, mEsquadria, x, y, zc));

    if (sacada) {
      // Varanda funda, laje com pingadeira e guarda-corpo de vidro.
      grupo.add(
        p.caixa(JAN_L + 1.6, 0.5, 2.9, mDetalhe, x, y - JAN_A / 2 - 0.25, Z_FACE + 1.45),
      );
      guardaCorpo(JAN_L + 1.6, x, y - JAN_A / 2, Z_FACE + 2.85);
    } else {
      // Sem varanda, sobra o peitoril de pedra na frente do vidro.
      grupo.add(
        p.caixa(JAN_L + 0.6, 0.3, 0.9, mDetalhe, x, y - JAN_A / 2 - 0.15, Z_FACE + 0.25),
      );
      guardaCorpo(JAN_L, x, y - JAN_A / 2, Z_FACE + 0.6);
    }
  });

  /* Faixa de laje entre os andares, e aleta vertical de pedra nas quinas.

     🔴 Aqui morreu o TUBO DE QUEDA aparente. Tubo descendo pela frente do
     prédio é obra antiga: em prédio de padrão a prumada vai embutida, e
     deixar o tubo à mostra era um dos sinais mais fortes de padrão
     popular. No lugar dele, a aleta, que dá sombra vertical e ritmo. */
  for (let a = 1; a <= 4; a++) {
    grupo.add(p.caixa(L + 0.6, 0.55, 0.7, mDetalhe, 0, TERREO + PISO * a, Z_FACE + 0.2));
  }
  [-(L / 2 - 0.9), L / 2 - 0.9].forEach((x) => {
    grupo.add(
      p.caixa(0.5, H - TERREO, 1.1, mDetalhe, x, TERREO + (H - TERREO) / 2, Z_FACE + 0.5),
    );
  });

  // ----------------------------------------------------- o apartamento
  const yBase = TERREO + PISO * ESCOLHIDO.andar;
  const yMeio = yBase + PISO / 2;
  const LARG = 10;
  const FUND = 13;
  const zFrente = P / 2;

  const sala = new THREE.Group();
  sala.add(p.caixa(LARG, 0.4, FUND, mPiso, 0, yBase + 0.2, zFrente - FUND / 2));
  sala.add(p.caixa(LARG, 0.4, FUND, mTeto, 0, yBase + PISO - 0.6, zFrente - FUND / 2));
  sala.add(p.caixa(0.4, PISO, FUND, mPintura, -LARG / 2, yMeio, zFrente - FUND / 2));
  sala.add(p.caixa(0.4, PISO, FUND, mPintura, LARG / 2, yMeio, zFrente - FUND / 2));
  sala.add(p.caixa(LARG, PISO, 0.4, mPintura, 0, yMeio, zFrente - FUND));

  /* Rodapé. Parede encostando no chão sem rodapé é a assinatura de
     maquete: na vida real existe a peça que esconde a junta. */
  const yRodape = yBase + 0.65;
  sala.add(p.caixa(LARG, 0.7, 0.2, mSoco, 0, yRodape, zFrente - FUND + 0.3));
  [-LARG / 2 + 0.3, LARG / 2 - 0.3].forEach((x) => {
    sala.add(p.caixa(0.2, 0.7, FUND, mSoco, x, yRodape, zFrente - FUND / 2));
  });

  /* Rugosidade alta na janela do fundo: com material liso as luzes da sala
     apareciam refletidas como duas bolas brancas no vidro. */
  const peleCeu = tex.crepusculo();
  peleCeu.colorSpace = THREE.SRGBColorSpace;
  descartaveis.push(peleCeu);
  const mCeu = new THREE.MeshStandardMaterial({
    map: peleCeu,
    emissive: 0xffffff,
    emissiveMap: peleCeu,
    emissiveIntensity: 0.42,
    roughness: 0.92,
  });
  sala.add(p.caixa(5.4, 3.6, 0.2, mCeu, -1.5, yBase + 4.6, zFrente - FUND + 0.15));
  sala.add(p.caixa(6, 0.3, 0.5, mDetalhe, -1.5, yBase + 2.7, zFrente - FUND + 0.4));
  // Caixilho da janela do fundo e cortina de um lado só: cortina fechada
  // nos dois lados tapa a única saída de luz natural do quadro.
  [-4.3, 1.3].forEach((x) => {
    sala.add(p.caixa(0.24, 3.9, 0.3, mDetalhe, x, yBase + 4.6, zFrente - FUND + 0.35));
  });
  sala.add(p.caixa(0.24, 0.3, 0.3, mDetalhe, -1.5, yBase + 6.5, zFrente - FUND + 0.35));
  sala.add(p.caixa(1.9, 5.4, 0.18, mCortinaSala, 2.6, yBase + 3.9, zFrente - FUND + 0.5));
  sala.add(p.caixa(4.6, 0.16, 0.16, mDetalhe, 0.6, yBase + 6.7, zFrente - FUND + 0.5));

  sala.add(p.caixa(6, 0.7, 2.4, mEstofado, -1, yBase + 0.75, zFrente - 3.4));
  sala.add(p.caixa(6, 1.5, 0.6, mEstofado, -1, yBase + 1.3, zFrente - 2.4));
  sala.add(p.caixa(2.6, 0.6, 2, mEstofado, -3.4, yBase + 1.2, zFrente - 3.6));
  sala.add(p.caixa(1.2, 0.6, 2, mEstofado, 1.4, yBase + 1.2, zFrente - 3.6));
  // Almofadas: as duas em dourado da marca, uma torta. Almofada alinhada
  // com esquadro é a coisa mais improvável que existe numa sala usada.
  const alm1 = p.caixa(1.4, 1.4, 0.45, mAlmofada, -2.2, yBase + 1.6, zFrente - 2.9);
  alm1.rotation.z = 0.16;
  sala.add(alm1);
  const alm2 = p.caixa(1.3, 1.3, 0.45, mAlmofada, 0.3, yBase + 1.55, zFrente - 2.95);
  alm2.rotation.z = -0.1;
  sala.add(alm2);
  sala.add(p.caixa(7.4, 0.06, 4.6, mTapete, -1, yBase + 0.42, zFrente - 6));
  sala.add(p.caixa(2.6, 0.25, 1.4, mPiso, -1, yBase + 1.3, zFrente - 6.2));
  sala.add(p.caixa(0.2, 1.1, 0.2, mSoco, -1.8, yBase + 0.8, zFrente - 6.2));
  sala.add(p.caixa(0.2, 1.1, 0.2, mSoco, -0.2, yBase + 0.8, zFrente - 6.2));
  // Estante e quadro: parede vazia é o que mais entrega interior de teste.
  sala.add(p.caixa(0.4, 3.2, 3.4, mPiso, LARG / 2 - 0.5, yBase + 1.8, zFrente - 8.5));
  /* Quadro com moldura escura e miolo fosco. Painel branco liso na parede
     lê como recorte de papel, não como quadro. */
  sala.add(p.caixa(0.16, 2.2, 2.9, mSoco, -LARG / 2 + 0.32, yBase + 5, zFrente - 5));
  sala.add(p.caixa(0.1, 1.7, 2.4, p.mat(0x35507a, 0.96), -LARG / 2 + 0.42, yBase + 5, zFrente - 5));

  const planta = p.folhagem(1.1, mFolha);
  planta.position.set(3.4, yBase + 0.6, zFrente - 9);
  sala.add(planta);
  sala.add(p.caixa(1.2, 1.2, 1.2, mDetalhe, 3.4, yBase + 1, zFrente - 9));

  const abajur = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 1.2, 1.4, 12),
    p.mat(0xf0e6d2, 0.9),
  );
  abajur.position.set(-4.4, yBase + 3.4, zFrente - 9.4);
  sala.add(abajur);
  sala.add(p.caixa(0.18, 2.6, 0.18, mSoco, -4.4, yBase + 2, zFrente - 9.4));
  grupo.add(sala);

  /* Luz MOTIVADA: o ponto mora dentro do abajur. Ponto solto perto de
     parede deixa uma bolha redonda visível, e foi assim que apareceu no
     primeiro teste. */
  const luzSala = new THREE.PointLight(LUZ, 0, 34, 2);
  luzSala.position.set(-4.4, yBase + 3.6, zFrente - 9.4);
  grupo.add(luzSala);
  const luzApoio = new THREE.PointLight(0xbcd6f2, 0, 26, 2);
  luzApoio.position.set(-1, yBase + 5, zFrente - 7.5);
  grupo.add(luzApoio);

  /* A parede que gira. O nó fica na DOBRADIÇA e a folha entra deslocada
     meia largura: girar pelo centro faria a parede atravessar o prédio. */
  /* A folha encaixa DENTRO do vão, com a face externa no mesmo plano do
     reboco. Antes ela ficava 0,2 à frente, e de perto lia como painel
     colado na fachada em vez de parede da sala. */
  const dobradica = new THREE.Group();
  dobradica.position.set(-LARG / 2, yMeio, zFrente - 0.25);
  const folha = new THREE.Group();
  folha.position.set(LARG / 2, 0, 0);
  /* A folha também é parede com vão recortado: fechada, tem de ler igual
     às vizinhas; aberta, é uma parede com janela, não uma placa. */
  const folhaParede = fachadaComVao(
    LARG,
    PISO,
    0.5,
    [{ x: 0, y: PISO / 2 - JAN_A / 2, l: JAN_L, a: JAN_A }],
    mParede,
  );
  folhaParede.position.set(0, -PISO / 2, -0.25);
  folha.add(folhaParede);
  const janelaFolha = p.janela(JAN_L, JAN_A, 0.4, mDetalhe);
  janelaFolha.position.set(0, 0, 0);
  /* O vidro da folha usa o mesmo cartão desenhado das outras: era o único
     retângulo laranja chapado sobrando na fachada. */
  const peleFolha = tex.janelaAcesa(1);
  peleFolha.colorSpace = THREE.SRGBColorSpace;
  descartaveis.push(peleFolha);
  const mVidroFolha = new THREE.MeshStandardMaterial({
    map: peleFolha,
    emissive: 0xffffff,
    emissiveMap: peleFolha,
    emissiveIntensity: 0.4,
    roughness: 0.2,
  });
  const vidroAntigo = janelaFolha.userData.vidro as THREE.Material;
  janelaFolha.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.material === vidroAntigo) m.material = mVidroFolha;
  });
  vidroAntigo.dispose();
  janelaFolha.userData.vidro = mVidroFolha;
  folha.add(janelaFolha);
  dobradica.add(folha);
  grupo.add(dobradica);

  grupo.add(p.caixa(11.6, 0.5, 3, mDetalhe, 0, yBase + 0.15, zFrente + 1.5));
  guardaCorpo(11.6, 0, yBase + 0.4, zFrente + 2.9);

  // ============================================================ A QUADRA
  const pisoCalcada = p.pisoDaCalcada(nitidez);
  descartaveis.push(pisoCalcada);
  const piso = new THREE.Mesh(
    new THREE.PlaneGeometry(620, 460),
    new THREE.MeshStandardMaterial({ map: pisoCalcada, roughness: 0.95 }),
  );
  piso.rotation.x = -Math.PI / 2;
  piso.receiveShadow = true;
  grupo.add(piso);

  const Z_GUIA_PERTO = 26;
  const Z_GUIA_LONGE = 62;
  const Z_MEIO = (Z_GUIA_PERTO + Z_GUIA_LONGE) / 2;

  const rua = new THREE.Mesh(
    new THREE.PlaneGeometry(620, Z_GUIA_LONGE - Z_GUIA_PERTO),
    mAsfalto,
  );
  rua.rotation.x = -Math.PI / 2;
  rua.position.set(0, 0.04, Z_MEIO);
  rua.receiveShadow = true;
  grupo.add(rua);

  // A guia é o degrau da calçada: sem ela o asfalto parece tapete pintado.
  [Z_GUIA_PERTO, Z_GUIA_LONGE].forEach((z) => {
    grupo.add(p.caixa(620, 0.7, 1.2, mDetalhe, 0, 0.35, z));
  });

  const mFaixa = p.mat(0xd8d0bb, 0.9);
  for (let x = -300; x < 300; x += 24) {
    grupo.add(p.caixa(11, 0.06, 0.9, mFaixa, x, 0.09, Z_MEIO));
  }
  const bueiro = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.12, 16), mFerro);
  bueiro.position.set(-18, 0.1, Z_GUIA_PERTO + 5);
  grupo.add(bueiro);
  grupo.add(p.caixa(2.2, 0.1, 1.6, mFerro, 38, 0.1, Z_GUIA_PERTO + 4));

  /* Fachadas vizinhas: TRÊS texturas compartilhadas, então um prédio
     inteiro sai numa chamada de desenho. A variação vem de largura, altura
     e de qual das três ele usa. */
  /* Menos colunas, vãos maiores. Sete módulos estreitos por fachada
     davam grade de janela pequena, que é fachada de escritório;
     apartamento tem quatro ou cinco panos largos por andar. */
  /* Menos colunas e menos linhas. Sete módulos estreitos por doze andares
     davam grade de janela pequena, que é fachada de escritório: no prédio
     da cena um andar tem 9 unidades, então a fachada vizinha precisa de
     uma linha a cada 8 ou 9, não a cada 5. */
  const PELES = [
    guardar(tex.fachadaRica(5, 7, 0.42, nitidez, "#d9d3c6")),
    guardar(tex.fachadaRica(4, 6, 0.3, nitidez, "#cdcfc9")),
    guardar(tex.fachadaRica(6, 8, 0.5, nitidez, "#e2dbcc")),
  ];
  /* A emissão vem do mapa de LUZ que a textura devolve, não do mapa de
     cor: assim só a janela acesa brilha, e é ela que o brilho do
     pós-processamento pega. */
  const mPeles = PELES.map((pele) =>
    tex.vestir(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissiveIntensity: 0.5,
        roughness: 0.9,
      }),
      pele,
      0.18,
    ),
  );

  function vizinho(x: number, larg: number, alt: number, pele: number, frente: number) {
    const g = new THREE.Group();
    const fundura = 20;
    g.add(p.caixa(larg, alt, fundura, mPeles[pele % mPeles.length], 0, alt / 2, 0));
    g.add(p.caixa(larg + 0.8, 1.6, fundura + 0.8, mDetalhe, 0, alt + 0.8, 0));
    /* Térreo diferente do resto, como na rua: aqui é embasamento de pedra
       escura com o hall aceso atrás, não laje pintada. */
    g.add(p.caixa(larg + 0.5, 6, fundura + 0.5, p.mat(0x3b3a36, 0.8), 0, 3, 0));
    g.add(p.caixa(larg * 0.55, 4.2, 0.3, mHall, 0, 3.2, fundura / 2 + 0.4));
    g.add(p.caixa(larg + 2.2, 0.5, 4.4, mDetalhe, 0, 6.6, fundura / 2 + 2));
    g.position.set(x, 0, frente > 0 ? 0 : Z_GUIA_LONGE + 12);
    if (frente < 0) g.rotation.y = Math.PI;
    grupo.add(g);
  }

  /* Mais alto e mais esguio que antes: prédio baixo e largo com janela
     pequena é conjunto popular, torre esguia com pano de vidro é Zona Sul.
     A altura desigual continua, porque quadra com prédios da mesma altura
     é maquete. */
  const DIREITA = [
    [20, 56, 0],
    [15, 74, 1],
    [23, 48, 2],
    [17, 66, 1],
    [21, 52, 0],
  ] as const;
  let borda = L / 2;
  DIREITA.forEach(([larg, alt, pele], i) => {
    const cx = borda + larg / 2;
    vizinho(cx, larg, alt, pele, 1);
    if (i % 2 === 0) coberturaNobre(cx, 0, larg, alt + 1.6);
    borda += larg;
  });
  const ESQUERDA = [
    [19, 50, 2],
    [24, 70, 0],
    [17, 58, 1],
  ] as const;
  borda = -L / 2;
  ESQUERDA.forEach(([larg, alt, pele], i) => {
    const cx = borda - larg / 2;
    vizinho(cx, larg, alt, pele, 1);
    if (i === 1) coberturaNobre(cx, 0, larg, alt + 1.6);
    borda -= larg;
  });

  // O outro lado da rua fecha o corredor. Sem ele a rua vira estrada.
  const LADO_DE_LA = [
    [-96, 26, 62, 1],
    [-68, 22, 46, 2],
    [-44, 28, 72, 0],
    [-10, 24, 52, 1],
    [20, 30, 66, 2],
    [56, 22, 44, 0],
    [86, 26, 58, 1],
  ] as const;
  LADO_DE_LA.forEach(([x, larg, alt, pele]) => vizinho(x, larg, alt, pele, -1));
  grupo.add(p.caixa(0.6, H + 2, P, mParede, -L / 2 - 0.3, (H + 2) / 2, 0));

  /* Poste, fiação, semáforo, lixeira, parada e árvore: escala humana. Dois
     postes ganham luz de verdade, e é ela que faz a poça de luz na
     calçada; nos outros a lâmpada é só emissiva, porque uma luz por poste
     custaria caro e não mudaria o quadro. */
  const mLampada = new THREE.MeshStandardMaterial({
    color: 0xffe6b8,
    emissive: 0xffb455,
    emissiveIntensity: 2.2,
    roughness: 0.4,
  });
  const POSTES = [-46, -8, 34, 72];
  POSTES.forEach((x, i) => {
    const poste = new THREE.Group();
    poste.add(p.caixa(0.7, 16, 0.7, mFerro, 0, 8, 0));
    poste.add(p.caixa(3.4, 0.5, 0.6, mFerro, 1.5, 16, 0));
    poste.add(p.caixa(1.5, 0.45, 0.9, mLampada, 2.5, 15.6, 0));
    poste.position.set(x, 0, Z_GUIA_PERTO - 3);
    grupo.add(poste);
    if (i === 1 || i === 2) {
      const l = new THREE.PointLight(0xffc98a, 90, 46, 2);
      l.position.set(x + 2.5, 15, Z_GUIA_PERTO - 3);
      grupo.add(l);
    }
  });

  const semaforo = new THREE.Group();
  semaforo.add(p.caixa(0.6, 12, 0.6, mFerro, 0, 6, 0));
  semaforo.add(p.caixa(1.6, 4, 1.2, mFerro, 0, 12.5, 0));
  semaforo.add(
    p.caixa(
      0.9,
      0.9,
      0.3,
      new THREE.MeshStandardMaterial({
        color: 0x5a1a14,
        emissive: 0xff4a2a,
        emissiveIntensity: 2,
        roughness: 0.4,
      }),
      0,
      13.6,
      0.7,
    ),
  );
  semaforo.add(p.caixa(0.9, 0.9, 0.3, p.mat(0x2a2a20, 0.7), 0, 12.5, 0.7));
  semaforo.add(p.caixa(0.9, 0.9, 0.3, p.mat(0x1e2a1e, 0.7), 0, 11.4, 0.7));
  semaforo.position.set(-64, 0, Z_GUIA_PERTO - 2);
  grupo.add(semaforo);

  /* 🔴 Saíram a LIXEIRA e a PARADA DE ÔNIBUS. Não são feias: são de outro
     programa. Ponto de ônibus na porta e cesto de lixo no primeiro plano
     dizem via de passagem movimentada, e o que a rua tem de dizer aqui é
     rua residencial de padrão. Entram no lugar o jardim com muro baixo de
     pedra e a palmeira, que é a assinatura da Zona Sul. */
  function jardim(x: number, larg: number) {
    grupo.add(p.caixa(larg, 1.5, 5, mDetalhe, x, 0.75, Z_GUIA_PERTO - 9));
    grupo.add(p.caixa(larg + 0.6, 0.3, 5.6, mParede, x, 1.6, Z_GUIA_PERTO - 9));
    for (let i = 0; i < 4; i++) {
      const f = p.folhagem(1.6, mFolha);
      f.position.set(x - larg / 2 + 3 + i * (larg / 4), 2, Z_GUIA_PERTO - 9);
      grupo.add(f);
    }
  }
  jardim(-26, 22);
  jardim(30, 18);

  /* Palmeira. 🔴 A folha PENDE, e é isso que faz a silhueta: na primeira
     tentativa cada folha era uma tábua reta saindo do topo, e a copa
     inteira virou estrela de papelão. Três segmentos por folha, cada um
     mais inclinado e mais estreito que o anterior, resolvem com nove
     caixas por folha e nenhuma matemática nova. */
  function palmeira(x: number, z: number, alt: number) {
    const g = new THREE.Group();
    const tronco = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.8, alt, 8),
      mTronco,
    );
    tronco.position.y = alt / 2;
    tronco.castShadow = true;
    g.add(tronco);
    // Anéis: a cicatriz de folha caída, que é o que dá textura ao tronco.
    for (let i = 0; i < 7; i++) {
      const e = 1.5 - i * 0.07;
      g.add(p.caixa(e, 0.2, e, mTronco, 0, alt * 0.3 + i * (alt * 0.095), 0));
    }
    const N = 9;
    for (let i = 0; i < N; i++) {
      const eixo = new THREE.Group();
      eixo.rotation.y = (i / N) * Math.PI * 2;
      const queda = 0.2 + (i % 3) * 0.13;
      let px = 1;
      let py = alt + 0.5;
      for (let k = 0; k < 3; k++) {
        const comp = 3.6 - k * 0.6;
        const ang = queda * (k + 1);
        const seg = p.caixa(comp, 0.16, 1.6 - k * 0.42, mFolha, px + comp / 2, py, 0);
        seg.rotation.z = -ang;
        eixo.add(seg);
        px += comp * Math.cos(ang);
        py -= comp * Math.sin(ang) + 0.08;
      }
      g.add(eixo);
    }
    g.position.set(x, 0, z);
    grupo.add(g);
  }
  palmeira(-58, Z_GUIA_PERTO - 7, 22);
  palmeira(8, Z_GUIA_PERTO - 7, 26);
  palmeira(62, Z_GUIA_PERTO - 7, 20);

  [-40, 46].forEach((x) => {
    const arv = p.arvore(15, mFolha, mTronco);
    arv.position.set(x, 0, Z_GUIA_PERTO - 7);
    grupo.add(arv);
  });

  // -------------------------------------------------------------- carros
  const mVidroCarro = p.mat(0x0e1c30, 0.2, 0.6);
  const mLanterna = new THREE.MeshStandardMaterial({
    color: 0x8a2b22,
    emissive: 0xff5a3c,
    emissiveIntensity: 1.8,
    roughness: 0.4,
  });
  const mFarol = new THREE.MeshStandardMaterial({
    color: 0xfff4dc,
    emissive: 0xfff0cf,
    emissiveIntensity: 2.6,
    roughness: 0.3,
  });
  const mRoda = p.mat(0x14161c, 0.9);

  function carro(cor: THREE.Material, comFarol: boolean) {
    const c = new THREE.Group();
    c.add(p.caixa(11, 2.4, 4.6, cor, 0, 2.2, 0));
    c.add(p.caixa(6.4, 2.2, 4.2, mVidroCarro, -0.6, 4.2, 0));
    c.add(p.caixa(6.6, 0.4, 4.4, cor, -0.6, 5.3, 0));
    [-2, 2].forEach((dz) => {
      c.add(p.caixa(0.4, 0.7, 1.2, mLanterna, 5.5, 2.6, dz));
      if (comFarol) c.add(p.caixa(0.4, 0.8, 1.4, mFarol, -5.5, 2.6, dz));
    });
    [-3.4, 3.4].forEach((dx) =>
      [-2.3, 2.3].forEach((dz) => {
        const r = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.8, 10), mRoda);
        r.rotation.x = Math.PI / 2;
        r.position.set(dx, 1.1, dz);
        c.add(r);
      }),
    );
    /* Carro NÃO projeta sombra: o mapa de sombra está congelado e o carro
       se move, então a sombra dele ficaria grudada no asfalto. */
    c.traverse((o) => ((o as THREE.Mesh).castShadow = false));
    return c;
  }

  const estacionado = carro(p.mat(0x7d2f28, 0.42, 0.45), false);
  estacionado.position.set(46, 0, Z_GUIA_PERTO + 6);
  estacionado.rotation.y = Math.PI;
  grupo.add(estacionado);

  /* O carro que passa. Anda no sentido +x na pista de cá, com farol e
     lanterna acesos, e reaparece do outro lado. É a única coisa da cena com
     vida própria, e é por causa dele que o laço desenha enquanto a abertura
     está visível. */
  const andando = carro(p.mat(0x24486f, 0.42, 0.45), true);
  andando.rotation.y = Math.PI;
  grupo.add(andando);
  const luzFarol = new THREE.PointLight(0xfff0cf, 26, 30, 2);
  grupo.add(luzFarol);

  const X_INICIO = -220;
  const X_FIM = 220;
  const VELOCIDADE = 26; // unidades por segundo
  let xCarro = -40;

  /* ===================================================== O RIO AO FUNDO

     A rua terminava em neblina, e três cones de cinco lados faziam de
     morro atrás do quarteirão. Cone é montanha genérica, e atrás do
     quarteirão ninguém vê. O que identifica a cidade é o que fica NA
     DIREÇÃO EM QUE A CÂMERA OLHA em t=0: a rua desembocando na baía, com o
     morro do outro lado e o Cristo aceso no alto.

     Escala: um andar tem 9 unidades, uns 3 metros. O Pão de Açúcar tem 396
     metros, e por isso ele domina o fim da avenida como domina de verdade
     em Botafogo. */
  /* Cúpula do céu, FORA da neblina: ela é o fundo, não pode ser apagada
     por ele. Escrita de dentro (BackSide) e sem escrever profundidade,
     então nada nela atrapalha o resto da cena. */
  const peleCeu2 = tex.ceuDaTarde();
  peleCeu2.colorSpace = THREE.SRGBColorSpace;
  descartaveis.push(peleCeu2);
  const cupula = new THREE.Mesh(
    new THREE.SphereGeometry(1200, 24, 16),
    new THREE.MeshBasicMaterial({
      map: peleCeu2,
      side: THREE.BackSide,
      fog: false,
      depthWrite: false,
    }),
  );
  cupula.position.y = -120;
  grupo.add(cupula);

  const mLonge = p.mat(0x14304f, 0.95);
  for (let i = 0; i < 12; i++) {
    const larg = 20 + ((i * 37) % 26);
    const alt = 26 + ((i * 53) % 44);
    grupo.add(p.caixa(larg, alt, 16, mLonge, -300 + i * 34, alt / 2, -120 - ((i * 29) % 60)));
  }

  // A baía. Começa onde o quarteirão acaba, e some no horizonte.
  const mAgua = new THREE.MeshStandardMaterial({
    color: 0x0d2038,
    roughness: 0.16,
    metalness: 0.5,
  });
  const baia = new THREE.Mesh(new THREE.PlaneGeometry(1500, 1100), mAgua);
  baia.rotation.x = -Math.PI / 2;
  baia.position.set(760, -0.8, -120);
  grupo.add(baia);

  /* Morro carioca: domo de lado quase vertical, não cone. Esfera achatada
     enterrada até a linha da água é o que reproduz aquele contorno. */
  /* Mais claro que o céu do alto e mais escuro que o horizonte: é assim
     que a pedra aparece no fim da tarde, e é o contraste que desenha o
     contorno do Pão de Açúcar. */
  const mMorro = p.mat(0x24344e, 0.98, 0, true);
  /* Fora da neblina: a mais de mil unidades ela apagaria o morro inteiro.
     A perspectiva atmosférica aqui é feita na COR, que é o que o pintor
     faz e o que dá para controlar. */
  mMorro.fog = false;
  function morro(x: number, z: number, raio: number, alt: number, esticar = 1) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(raio, 22, 16), mMorro);
    m.scale.set(esticar, alt / raio, 0.86);
    m.position.set(x, -0.34 * alt, z);
    grupo.add(m);
    // O topo é calculado, não repetido na mão: foi assim que o Cristo
    // acabou 30 unidades dentro da pedra na primeira tentativa.
    return { peca: m, topo: m.position.y + alt };
  }
  morro(1194, 105, 105, 170, 1.05); // Pão de Açúcar, na ponta da enseada
  morro(1085, 172, 66, 92, 1.25); // Morro da Urca, na frente e mais baixo
  morro(1750, -420, 280, 150, 1.7); // a serra do outro lado da baía
  /* O Corcovado fica no VÃO DA RUA, não atrás do quarteirão: de trás do
     prédio ninguém vê, e o Cristo é justamente o que identifica a cidade
     sozinho. */
  /* 🔴 Posição resolvida pela PROJEÇÃO, não por tentativa. O Cristo sumia
     em toda tentativa, e não era tamanho nem brilho: com o morro em
     (700,-430) o cume caía em x=556 da tela, atrás da fileira de prédios
     da esquerda. O céu aberto no fim da rua começa em x=960; resolvendo a
     projeção ao contrário para o cume cair em (1060, 300) a 980 de
     distância, ele tem de ficar em (930, 131, -63), que dá 200 de altura
     de morro. */
  const corcovado = morro(930, -63, 110, 200, 0.95);

  /* O Cristo, aceso. À noite ele é um ponto de luz em forma de cruz, e é o
     item que identifica a cidade sozinho. Emissivo forte de propósito: é
     ele que o brilho do pós-processamento tem de pegar. */
  const mCristo = new THREE.MeshStandardMaterial({
    color: 0xf2ece1,
    emissive: 0xfff3da,
    /* Dose baixa: em 1,35 o brilho do pós-processamento fazia um halo de
       lâmpada em volta dele. O Cristo é iluminado por refletor, não é
       fonte de luz. */
    emissiveIntensity: 0.62,
    roughness: 0.6,
    fog: false,
  });
  const cristo = new THREE.Group();
  cristo.add(p.caixa(10, 48, 10, mCristo, 0, 24, 0));
  cristo.add(p.caixa(54, 9, 9, mCristo, 0, 38, 0));
  const cabeca = new THREE.Mesh(new THREE.SphereGeometry(6.2, 10, 8), mCristo);
  cabeca.position.y = 51;
  cristo.add(cabeca);
  cristo.add(p.caixa(22, 7, 22, p.mat(0x1b3049, 0.95), 0, -3, 0));
  cristo.position.set(corcovado.peca.position.x, corcovado.topo - 6, corcovado.peca.position.z);
  cristo.rotation.y = -0.5;
  grupo.add(cristo);

  // --------------------------------------------------------------- luzes
  cena.add(new THREE.HemisphereLight(0x7ba0cd, 0x0a1a30, 0.42));
  const chave = new THREE.DirectionalLight(0xffc98a, 1.5);
  chave.position.set(-80, 60, 46);
  chave.castShadow = true;
  /* O mapa cresceu junto com a cena: cobrindo 240 unidades num mapa de
     1024, cada texel virava 4 unidades e a fachada ficava coberta de
     manchas em vez de sombra. */
  /* 2048 cobrindo 240 unidades dava 0,12 unidade por texel: de longe
     passava, mas com a câmera a poucos metros do reboco a sombra virava
     dente de serra e mancha triangular na parede toda. 4096 numa área
     menor dá 0,05, e o desvio de normal cai junto, porque era ele que
     soltava a sombra do objeto. Custa um mapa só, e ele só se refaz
     quando a parede gira. */
  chave.shadow.mapSize.set(4096, 4096);
  chave.shadow.normalBias = 0.09;
  const d = 105;
  chave.shadow.camera.left = -d;
  chave.shadow.camera.right = d;
  chave.shadow.camera.top = d;
  chave.shadow.camera.bottom = -d;
  chave.shadow.camera.far = 320;
  chave.shadow.bias = -0.0004;
  cena.add(chave);
  const contra = new THREE.DirectionalLight(0x8fb4e2, 0.5);
  contra.position.set(50, 34, -80);
  cena.add(contra);

  // ---------------------------------------------------------------- tempo
  let alvoT = 0;
  let t = 0;
  let rodando = true;
  let req = 0;
  let ultimo = 0;
  const PARADO = 0.0004;
  const QUADRO = 1000 / 30; // teto de 30 quadros por segundo

  let abreFeito = -1;
  function aplicar(v: number) {
    camera.position.copy(interpolar(v, "de"));
    camera.lookAt(interpolar(v, "para"));

    /* 🔴 O mapa de sombra depende do SOL e da geometria, nunca da câmera.
       A única coisa que se move nesta cena é a folha da parede, então é só
       aqui que ele precisa ser refeito. Antes ele se refazia a cada quadro
       de rolagem, e com 4096 de mapa isso é exatamente o desperdício que
       fez a página travar na primeira versão. */
    const abre = faixa(v, 0.34, 0.62);
    if (abre !== abreFeito) {
      folha.parent!.rotation.y = -abre * 1.95;
      renderer.shadowMap.needsUpdate = true;
      abreFeito = abre;
    }

    const acende = faixa(v, 0.38, 0.7);
    luzSala.intensity = acende * 46;
    luzApoio.intensity = acende * 12;
    janelaFolha.userData.vidro.emissiveIntensity = 0.4 + acende * 0.45;

    // Dentro da sala a neblina fecha: o vizinho não deve aparecer pelo vão.
    (cena.fog as THREE.Fog).near = 220 - faixa(v, 0.7, 1) * 190;
  }

  function moverCarro(dt: number) {
    xCarro += VELOCIDADE * dt;
    if (xCarro > X_FIM) xCarro = X_INICIO;
    andando.position.set(xCarro, 0, Z_GUIA_PERTO + 7);
    luzFarol.position.set(xCarro - 6, 3, Z_GUIA_PERTO + 7);
  }

  aplicar(0);
  moverCarro(0);
  composer.render();

  function quadro(agora: number) {
    req = requestAnimationFrame(quadro);
    if (!rodando) return;
    if (agora - ultimo < QUADRO) return;
    const dt = ultimo ? Math.min(0.1, (agora - ultimo) / 1000) : 0.033;
    ultimo = agora;

    moverCarro(dt);

    const resta = alvoT - t;
    if (Math.abs(resta) > PARADO) {
      // Amortecimento: a rolagem chega em degraus, e sem isso a câmera pula.
      t += resta * 0.18;
      aplicar(t);
    }
    composer.render();
  }
  req = requestAnimationFrame(quadro);

  function medir() {
    const l = alvo.clientWidth;
    const a = alvo.clientHeight;
    if (!l || !a) return;
    camera.aspect = l / a;
    camera.updateProjectionMatrix();
    renderer.setSize(l, a, false);
    composer.setSize(l, a);
    renderer.shadowMap.needsUpdate = true;
    composer.render();
  }
  window.addEventListener("resize", medir);

  let observador: IntersectionObserver | null = null;
  if ("IntersectionObserver" in window) {
    observador = new IntersectionObserver((es) => (rodando = es[0].isIntersecting), {
      threshold: 0.02,
    });
    observador.observe(alvo);
  }

  /* Desmontar de verdade. Sem `dispose()` mais `forceContextLoss()` o
     contexto WebGL fica vivo, e o navegador segura cerca de dezesseis: com
     Strict Mode e recarga a quente o teto chega rápido, e a partir dali a
     cena some sem erro nenhum no console. */
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
    descartaveis.forEach((tx) => tx.dispose());
    composer.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  }

  return {
    medir,
    parar,
    irPara: (v: number, agora?: boolean) => {
      alvoT = Math.min(1, Math.max(0, v));
      if (agora) {
        t = alvoT;
        aplicar(t);
        composer.render();
      }
    },
  };
}
