import * as THREE from "three";

/* Carvalho & Seixas · texturas da cena, desenhadas em canvas.

   Por que procedural e não arquivo de imagem: nada para baixar, nada para
   versionar, e a paleta sai dos tokens da marca em vez de sair de uma foto
   qualquer. Cada função devolve o conjunto que o material precisa.

   🔴 O que tira o aspecto de plástico não é a cor: é o RELEVO e a
   RUGOSIDADE variando. Superfície com rugosidade constante devolve a luz
   igual em cada ponto, e é isso que o olho lê como "liso demais". Por isso
   quase toda função aqui devolve `map` + `bumpMap` + `roughnessMap`. */

export type Pele = {
  map: THREE.Texture;
  bumpMap?: THREE.Texture;
  roughnessMap?: THREE.Texture;
  /* Mapa de EMISSÃO separado do mapa de cor. 🔴 Usar a mesma textura nos
     dois fazia a parede inteira brilhar junto com as janelas, e a fachada
     saía branca de concreto em vez de reboco no fim da tarde. Aqui só a
     janela acesa é clara; todo o resto é preto e não emite nada. */
  emissiveMap?: THREE.Texture;
};

function tela(l: number, a: number) {
  const c = document.createElement("canvas");
  c.width = l;
  c.height = a;
  return { c, x: c.getContext("2d")! };
}

function daTela(c: HTMLCanvasElement, rx: number, ry: number, nitidez: number) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.anisotropy = nitidez;
  return t;
}

/** Ruído em pontos: a base de tudo que não deve parecer plástico. */
function chuvisco(x: CanvasRenderingContext2D, l: number, a: number, n: number, alfa: number, claro: boolean) {
  for (let i = 0; i < n; i++) {
    const r = Math.random() * 1.8 + 0.3;
    x.fillStyle = claro
      ? `rgba(255,255,255,${alfa * Math.random()})`
      : `rgba(0,0,0,${alfa * Math.random()})`;
    x.beginPath();
    x.arc(Math.random() * l, Math.random() * a, r, 0, 6.283);
    x.fill();
  }
}

/* ------------------------------------------------------------- REBOCO
   Parede de prédio carioca: massa corrida com manchas, e sujeira que desce
   com a chuva. A sujeira na base é o detalhe que mais convence, porque
   prédio limpo dos pés à cobertura só existe em maquete. */
export function reboco(cor: string, nitidez: number, sujeira = 0.55): Pele {
  const L = 512;
  const A = 512;
  const { c, x } = tela(L, A);
  x.fillStyle = cor;
  x.fillRect(0, 0, L, A);

  /* Manchas largas de tonalidade.

     🔴 Os dois círculos do gradiente precisam do MESMO centro. Com centros
     diferentes o Canvas não desenha borrão: desenha um cone, de aresta
     reta. Vinte e seis cones em cada parede era o que fazia o reboco
     parecer malha de polígono, e eu perdi tempo culpando o relevo. */
  for (let i = 0; i < 26; i++) {
    const mx = Math.random() * L;
    const my = Math.random() * A;
    const g = x.createRadialGradient(mx, my, 4, mx, my, 60 + Math.random() * 120);
    g.addColorStop(0, `rgba(0,0,0,${0.05 + Math.random() * 0.05})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, L, A);
  }
  chuvisco(x, L, A, 5200, 0.18, false);
  chuvisco(x, L, A, 2600, 0.14, true);

  // escorrido de chuva: risco vertical fino, mais forte embaixo
  x.globalAlpha = 0.5 * sujeira;
  for (let i = 0; i < 40; i++) {
    const px = Math.random() * L;
    const alt = 60 + Math.random() * 300;
    const g = x.createLinearGradient(0, A - alt, 0, A);
    g.addColorStop(0, "rgba(40,36,28,0)");
    g.addColorStop(1, "rgba(40,36,28,.5)");
    x.fillStyle = g;
    x.fillRect(px, A - alt, 1 + Math.random() * 2.4, alt);
  }
  x.globalAlpha = 1;

  // relevo: o mesmo chuvisco em cinza serve de mapa de relevo
  const rel = tela(L, A);
  rel.x.fillStyle = "#808080";
  rel.x.fillRect(0, 0, L, A);
  chuvisco(rel.x, L, A, 7000, 0.5, true);
  chuvisco(rel.x, L, A, 7000, 0.5, false);

  // rugosidade: manchas mais lisas onde a chuva bateu
  const rug = tela(L, A);
  rug.x.fillStyle = "#c8c8c8";
  rug.x.fillRect(0, 0, L, A);
  for (let i = 0; i < 18; i++) {
    const rx0 = Math.random() * L;
    const ry0 = Math.random() * A;
    const g = rug.x.createRadialGradient(rx0, ry0, 6, rx0, ry0, 40 + Math.random() * 90);
    g.addColorStop(0, "rgba(90,90,90,.7)");
    g.addColorStop(1, "rgba(90,90,90,0)");
    rug.x.fillStyle = g;
    rug.x.fillRect(0, 0, L, A);
  }

  return {
    map: daTela(c, 1, 1, nitidez),
    bumpMap: daTela(rel.c, 1, 1, nitidez),
    roughnessMap: daTela(rug.c, 1, 1, nitidez),
  };
}

/* ------------------------------------------------------------ ASFALTO
   Brita aparente, remendo e mancha de óleo. Asfalto de cor chapada é o que
   mais denuncia cena de teste. */
export function asfalto(nitidez: number): Pele {
  const L = 512;
  const { c, x } = tela(L, L);
  x.fillStyle = "#20242e";
  x.fillRect(0, 0, L, L);
  for (let i = 0; i < 9000; i++) {
    const v = 30 + Math.random() * 70;
    x.fillStyle = `rgba(${v},${v + 4},${v + 10},${0.25 + Math.random() * 0.5})`;
    x.fillRect(Math.random() * L, Math.random() * L, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
  // remendos
  for (let i = 0; i < 5; i++) {
    x.fillStyle = `rgba(12,14,20,${0.25 + Math.random() * 0.25})`;
    x.beginPath();
    x.ellipse(Math.random() * L, Math.random() * L, 30 + Math.random() * 70, 20 + Math.random() * 50, Math.random() * 3, 0, 6.283);
    x.fill();
  }
  const rug = tela(L, L);
  rug.x.fillStyle = "#b4b4b4";
  rug.x.fillRect(0, 0, L, L);
  chuvisco(rug.x, L, L, 9000, 0.6, false);
  for (let i = 0; i < 5; i++) {
    rug.x.fillStyle = "rgba(60,60,60,.5)";
    rug.x.beginPath();
    rug.x.ellipse(Math.random() * L, Math.random() * L, 40 + Math.random() * 60, 24 + Math.random() * 40, 0, 0, 6.283);
    rug.x.fill();
  }
  const rel = tela(L, L);
  rel.x.fillStyle = "#7f7f7f";
  rel.x.fillRect(0, 0, L, L);
  chuvisco(rel.x, L, L, 12000, 0.7, true);
  chuvisco(rel.x, L, L, 12000, 0.7, false);
  return {
    map: daTela(c, 14, 3, nitidez),
    bumpMap: daTela(rel.c, 14, 3, nitidez),
    roughnessMap: daTela(rug.c, 14, 3, nitidez),
  };
}

/** Concreto de guia, laje e platibanda: mais claro, poro mais grosso. */
export function concreto(nitidez: number): Pele {
  const L = 256;
  const { c, x } = tela(L, L);
  x.fillStyle = "#b9b2a2";
  x.fillRect(0, 0, L, L);
  chuvisco(x, L, L, 4000, 0.2, false);
  chuvisco(x, L, L, 2000, 0.22, true);
  for (let i = 0; i < 10; i++) {
    x.fillStyle = `rgba(70,64,54,${0.05 + Math.random() * 0.08})`;
    x.fillRect(0, Math.random() * L, L, 2 + Math.random() * 8);
  }
  const rel = tela(L, L);
  rel.x.fillStyle = "#808080";
  rel.x.fillRect(0, 0, L, L);
  chuvisco(rel.x, L, L, 5000, 0.55, true);
  chuvisco(rel.x, L, L, 5000, 0.55, false);
  return { map: daTela(c, 4, 4, nitidez), bumpMap: daTela(rel.c, 4, 4, nitidez) };
}

/* --------------------------------------------------------- FACHADA
   A fachada dos vizinhos é textura, não geometria: um prédio inteiro sai
   numa chamada de desenho. O que a faz parecer construída:
   - faixa de laje entre os pavimentos, com sombra por baixo;
   - vão recuado, com caixilho claro e sombra no topo do vão;
   - janela ACESA em três temperaturas (quente, fria de televisão, apagada);
   - aparelho de ar-condicionado em algumas janelas;
   - escorrido de sujeira embaixo de cada peitoril. */
export function fachadaRica(
  colunas: number,
  linhas: number,
  acesas: number,
  nitidez: number,
  base = "#8d8577",
): Pele {
  const COL = 64;
  const LIN = 56;
  const L = colunas * COL;
  const A = linhas * LIN;
  const { c, x } = tela(L, A);
  // Segunda tela: só a luz. Fundo preto não emite.
  const luz = tela(L, A);
  luz.x.fillStyle = "#000000";
  luz.x.fillRect(0, 0, L, A);

  x.fillStyle = base;
  x.fillRect(0, 0, L, A);
  chuvisco(x, L, A, L * A * 0.012, 0.07, false);
  chuvisco(x, L, A, L * A * 0.012, 0.07, true);

  for (let j = 0; j < linhas; j++) {
    const y = j * LIN;
    // laje: faixa clara com sombra por baixo
    x.fillStyle = "rgba(255,255,255,.16)";
    x.fillRect(0, y + LIN - 9, L, 5);
    x.fillStyle = "rgba(0,0,0,.18)";
    x.fillRect(0, y + LIN - 4, L, 4);

    for (let i = 0; i < colunas; i++) {
      /* 🔴 Vão LARGO. Com 10 de recuo de cada lado o pano de vidro ficava
         pequeno no meio de muita parede, que é exatamente a proporção de
         prédio popular. Apartamento caro é o contrário: quase todo o
         módulo é esquadria, e o cheio é uma faixa fina de peitoril. */
      const px = i * COL + 4;
      const py = y + 5;
      const lj = COL - 8;
      const aj = LIN - 15;

      // vão recuado
      x.fillStyle = "rgba(0,0,0,.35)";
      x.fillRect(px - 2, py - 2, lj + 4, aj + 4);

      const sorte = Math.random();
      let vidro = "#16263b";
      if (sorte < acesas * 0.62) vidro = "#ffd79a";
      else if (sorte < acesas) vidro = "#cfe6f5";
      x.fillStyle = vidro;
      x.fillRect(px, py, lj, aj);
      if (vidro !== "#16263b") {
        // A janela apagada fica de fora do mapa de emissão.
        luz.x.fillStyle = vidro;
        luz.x.fillRect(px, py, lj, aj);
      }

      // sombra do topo do vão, que é o que dá profundidade ao buraco
      const g = x.createLinearGradient(0, py, 0, py + aj * 0.5);
      g.addColorStop(0, "rgba(0,0,0,.45)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      x.fillStyle = g;
      x.fillRect(px, py, lj, aj * 0.5);

      /* Caixilho PRETO E FINO. O claro e grosso engorda o vão e é o que
         mais empurra a fachada para o padrão popular; o preto some contra
         o vidro e deixa o pano ser o assunto. */
      x.strokeStyle = "rgba(26,28,34,.9)";
      x.lineWidth = 1;
      x.strokeRect(px, py, lj, aj);
      x.beginPath();
      x.moveTo(px + lj / 2, py);
      x.lineTo(px + lj / 2, py + aj);
      x.stroke();

      /* Guarda-corpo de vidro na frente da varanda: faixa clara
         translúcida com o corrimão fino em cima. 🔴 Aqui morreram o
         ar-condicionado pendurado e o escorrido de sujeira sob o peitoril,
         que eram os dois sinais de padrão popular que sobravam. */
      x.fillStyle = "rgba(206,220,216,.2)";
      x.fillRect(px, py + aj * 0.52, lj, aj * 0.48);
      x.fillStyle = "rgba(240,236,226,.55)";
      x.fillRect(px, py + aj * 0.5, lj, 2);
      x.fillStyle = "rgba(30,30,34,.5)";
      x.fillRect(px - 2, py + aj, lj + 4, 2);
    }
  }

  // Sombra suave na base, não sujeira: prédio caro tem lavagem de fachada.
  const sg = x.createLinearGradient(0, A * 0.8, 0, A);
  sg.addColorStop(0, "rgba(30,34,44,0)");
  sg.addColorStop(1, "rgba(30,34,44,.16)");
  x.fillStyle = sg;
  x.fillRect(0, A * 0.72, L, A * 0.28);

  const rug = tela(L, A);
  rug.x.fillStyle = "#c0c0c0";
  rug.x.fillRect(0, 0, L, A);
  chuvisco(rug.x, L, A, L * A * 0.03, 0.5, false);

  return {
    map: daTela(c, 1, 1, nitidez),
    roughnessMap: daTela(rug.c, 1, 1, nitidez),
    emissiveMap: daTela(luz.c, 1, 1, nitidez),
  };
}

/** Toldo de lona listrada: creme e azul da marca, com costura no meio. */
export function lona(nitidez: number): Pele {
  const L = 256;
  const { c, x } = tela(L, 64);
  for (let i = 0; i < 8; i++) {
    x.fillStyle = i % 2 ? "#e8e1cf" : "#1d3f69";
    x.fillRect((i * L) / 8, 0, L / 8, 64);
  }
  x.fillStyle = "rgba(0,0,0,.18)";
  x.fillRect(0, 56, L, 8);
  chuvisco(x, L, 64, 1400, 0.14, false);
  const rel = tela(L, 64);
  rel.x.fillStyle = "#8c8c8c";
  rel.x.fillRect(0, 0, L, 64);
  for (let i = 0; i < 8; i++) {
    rel.x.fillStyle = i % 2 ? "#a8a8a8" : "#6e6e6e";
    rel.x.fillRect((i * L) / 8, 0, L / 8, 64);
  }
  return { map: daTela(c, 1, 1, nitidez), bumpMap: daTela(rel.c, 1, 1, nitidez) };
}

/** Aplica uma pele num material padrão, com relevo e rugosidade na medida. */
/* --------------------------------------------------------------- PEDRA
   Revestimento de fachada de padrão alto: placa de pedra clara assentada
   em fileiras, com JUNTA aparente e veio fino. A junta é o que separa
   pedra de reboco no olho, e é ela que diz "revestimento", não "pintura".
   Sujeira quase zero: prédio caro tem manutenção, e o escorrido de chuva
   que eu tinha posto era o sinal mais forte de padrão popular. */
export function pedra(cor: string, nitidez: number): Pele {
  const L = 512;
  const A = 512;
  const { c, x } = tela(L, A);
  const FILA = 8;
  const alt = A / FILA;
  x.fillStyle = cor;
  x.fillRect(0, 0, L, A);

  for (let f = 0; f < FILA; f++) {
    // Cada placa com um tom levemente diferente: pedra natural nunca sai
    // igual da serra, e placa toda igual lê como plástico.
    const placas = 3 + (f % 2);
    for (let i = 0; i < placas; i++) {
      const larg = L / placas;
      const t = 0.03 + Math.random() * 0.05;
      x.fillStyle = `rgba(${Math.random() > 0.5 ? "255,255,255" : "40,34,26"},${t})`;
      x.fillRect(i * larg, f * alt, larg, alt);
      // veio: risco claro quase horizontal
      for (let v = 0; v < 5; v++) {
        x.fillStyle = "rgba(255,255,255,.05)";
        x.fillRect(
          i * larg + Math.random() * larg * 0.4,
          f * alt + 4 + Math.random() * (alt - 8),
          larg * (0.2 + Math.random() * 0.5),
          1,
        );
      }
      // junta vertical
      // Junta discreta: com a junta forte a placa lê como tijolo.
      x.fillStyle = "rgba(96,90,78,.22)";
      x.fillRect(i * larg - 1, f * alt, 2, alt);
    }
    // junta horizontal, com o fio de luz em cima
    x.fillStyle = "rgba(96,90,78,.26)";
    x.fillRect(0, f * alt - 1, L, 2);
    x.fillStyle = "rgba(255,255,255,.07)";
    x.fillRect(0, f * alt + 1, L, 1);
  }
  chuvisco(x, L, A, 2600, 0.05, true);

  const rel = tela(L, A);
  rel.x.fillStyle = "#8a8a8a";
  rel.x.fillRect(0, 0, L, A);
  rel.x.fillStyle = "#3c3c3c";
  for (let f = 0; f <= FILA; f++) rel.x.fillRect(0, f * alt - 1, L, 2);
  chuvisco(rel.x, L, A, 6000, 0.16, true);

  return {
    map: daTela(c, 1, 1, nitidez),
    bumpMap: daTela(rel.c, 1, 1, nitidez),
  };
}

/* ---------------------------------------------------------- CREPÚSCULO
   O céu visto pela janela do fundo. Retângulo azul claro chapado põe
   meio-dia dentro de uma cena de fim de tarde, e é dissonância que o olho
   percebe antes da razão. Degradê com o quente embaixo, onde o sol acabou
   de descer. */
export function crepusculo(): THREE.Texture {
  const L = 64;
  const A = 256;
  const { c, x } = tela(L, A);
  const g = x.createLinearGradient(0, 0, 0, A);
  g.addColorStop(0, "#12294a");
  g.addColorStop(0.42, "#2f5a86");
  g.addColorStop(0.78, "#8a7ea0");
  g.addColorStop(1, "#e0a468");
  x.fillStyle = g;
  x.fillRect(0, 0, L, A);
  return daTela(c, 1, 1, 4);
}

/* ----------------------------------------------------------- PINTURA
   Parede de dentro. 🔴 Não é o reboco de fachada com menos sujeira: o
   chuvisco de pontos escuros, que na rua vira granulado de massa, a três
   metros do olho lê como mofo. Pintura tem variação larga de rolo e grão
   fino claro, e nada mais. */
export function pintura(cor: string, nitidez: number): Pele {
  const L = 512;
  const { c, x } = tela(L, L);
  x.fillStyle = cor;
  x.fillRect(0, 0, L, L);
  for (let i = 0; i < 14; i++) {
    const mx = Math.random() * L;
    const my = Math.random() * L;
    const g = x.createRadialGradient(mx, my, 10, mx, my, 120 + Math.random() * 160);
    g.addColorStop(0, `rgba(0,0,0,${0.012 + Math.random() * 0.018})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, L, L);
  }
  chuvisco(x, L, L, 5000, 0.05, true);

  const rel = tela(L, L);
  rel.x.fillStyle = "#808080";
  rel.x.fillRect(0, 0, L, L);
  chuvisco(rel.x, L, L, 9000, 0.22, true);
  chuvisco(rel.x, L, L, 9000, 0.22, false);

  return { map: daTela(c, 1, 1, nitidez), bumpMap: daTela(rel.c, 1, 1, nitidez) };
}

/* -------------------------------------------------------------- TÁBUA
   Piso de madeira. O que faz leitura de tábua não é a cor: é a JUNTA
   escura entre as peças, o desencontro das pontas de uma fileira para a
   outra e o veio correndo no sentido do comprimento. Piso de cor chapada é
   o segundo pior chão depois do cinza liso. */
export function tabua(nitidez: number, rx = 2, ry = 3): Pele {
  const L = 512;
  const A = 512;
  const { c, x } = tela(L, A);
  const FILEIRAS = 7;
  const alt = A / FILEIRAS;
  const tons = ["#8a6a45", "#7d5f3c", "#93724c", "#775a39", "#8f6f4a"];
  for (let f = 0; f < FILEIRAS; f++) {
    let px = -Math.random() * L * 0.6;
    while (px < L) {
      const larg = L * (0.45 + Math.random() * 0.5);
      x.fillStyle = tons[Math.floor(Math.random() * tons.length)];
      x.fillRect(px, f * alt, larg - 2, alt - 2);
      // veio: risco fino no sentido do comprimento
      for (let i = 0; i < 26; i++) {
        x.fillStyle = `rgba(58,42,26,${0.05 + Math.random() * 0.12})`;
        const y = f * alt + 2 + Math.random() * (alt - 6);
        x.fillRect(px + Math.random() * larg * 0.3, y, larg * (0.3 + Math.random() * 0.6), 1);
      }
      px += larg;
    }
  }
  // junta: escurece o vão entre tábuas e entre fileiras
  x.fillStyle = "rgba(30,20,12,.55)";
  for (let f = 0; f <= FILEIRAS; f++) x.fillRect(0, f * alt - 1, L, 2);
  chuvisco(x, L, A, 3000, 0.1, false);

  const rel = tela(L, A);
  rel.x.fillStyle = "#8c8c8c";
  rel.x.fillRect(0, 0, L, A);
  rel.x.fillStyle = "#4a4a4a";
  for (let f = 0; f <= FILEIRAS; f++) rel.x.fillRect(0, f * alt - 1, L, 2);
  chuvisco(rel.x, L, A, 5000, 0.3, true);

  return {
    map: daTela(c, rx, ry, nitidez),
    bumpMap: daTela(rel.c, rx, ry, nitidez),
  };
}

/* ------------------------------------------------------------- TECIDO
   Estofado e tapete. Trama fina em duas direções mais mancha larga de
   sombra: é o mínimo para pano não parecer plástico fosco. */
export function tecido(cor: string, nitidez: number, r = 3): Pele {
  const L = 256;
  const { c, x } = tela(L, L);
  x.fillStyle = cor;
  x.fillRect(0, 0, L, L);
  x.strokeStyle = "rgba(0,0,0,.09)";
  x.lineWidth = 1;
  for (let i = 0; i < L; i += 3) {
    x.beginPath();
    x.moveTo(i, 0);
    x.lineTo(i, L);
    x.stroke();
  }
  x.strokeStyle = "rgba(255,255,255,.06)";
  for (let i = 0; i < L; i += 3) {
    x.beginPath();
    x.moveTo(0, i);
    x.lineTo(L, i);
    x.stroke();
  }
  for (let i = 0; i < 10; i++) {
    const mx = Math.random() * L;
    const my = Math.random() * L;
    const g = x.createRadialGradient(mx, my, 4, mx, my, 40 + Math.random() * 60);
    g.addColorStop(0, "rgba(0,0,0,.09)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, L, L);
  }
  chuvisco(x, L, L, 2200, 0.07, true);

  const rel = tela(L, L);
  rel.x.fillStyle = "#808080";
  rel.x.fillRect(0, 0, L, L);
  chuvisco(rel.x, L, L, 6000, 0.45, true);
  chuvisco(rel.x, L, L, 6000, 0.45, false);

  return { map: daTela(c, r, r, nitidez), bumpMap: daTela(rel.c, r, r, nitidez) };
}

/* ------------------------------------------------------------- JANELA
   Vidro de cor chapada é o que mais denuncia render, e aceso é pior: o
   mapeamento de tom estoura o retângulo e sobra uma placa creme. Janela
   acesa de verdade tem miolo claro perto da lâmpada, cortina de um lado e
   sombra de móvel na base. Um cartão desenhado de 256x192 resolve, e o
   mesmo desenho serve de mapa de emissão: assim o brilho segue o desenho
   em vez de acender o vidro inteiro por igual. */
export function janelaAcesa(variacao: number): THREE.Texture {
  const L = 256;
  const A = 192;
  const { c, x } = tela(L, A);
  const lado = variacao % 2 ? 0.34 : 0.66;
  x.fillStyle = "#4a3a24";
  x.fillRect(0, 0, L, A);
  const cx = L * lado;
  const cy = A * 0.32;
  const g = x.createRadialGradient(cx, cy, 6, cx, cy, A * (0.95 + variacao * 0.1));
  g.addColorStop(0, "#fff2d4");
  g.addColorStop(0.4, "#f2d29a");
  g.addColorStop(1, "#8d6a3c");
  x.fillStyle = g;
  x.fillRect(0, 0, L, A);

  // Cortina: pano claro de um lado, com a dobra em faixa vertical.
  const cort = variacao % 2 ? 0 : L * 0.62;
  x.fillStyle = "rgba(255,246,226,.5)";
  x.fillRect(cort, 0, L * 0.38, A);
  x.fillStyle = "rgba(120,96,60,.16)";
  for (let i = 0; i < 7; i++) {
    x.fillRect(cort + i * (L * 0.055) + 3, 0, 3, A);
  }

  // Sombra de móvel na base e travessa do caixilho por dentro.
  x.fillStyle = "rgba(46,34,20,.55)";
  x.fillRect(0, A * 0.78, L, A * 0.22);
  x.fillStyle = "rgba(30,22,12,.5)";
  x.fillRect(L * 0.06, A * 0.62, L * 0.3, A * 0.2);
  chuvisco(x, L, A, 900, 0.08, false);
  return daTela(c, 1, 1, 4);
}

/* Janela apagada não é buraco preto: é vidro refletindo o céu do fim da
   tarde, mais claro em cima. Sem isso a fachada fica com cara de fita
   perfurada. */
export function janelaApagada(): THREE.Texture {
  const L = 128;
  const A = 128;
  const { c, x } = tela(L, A);
  const g = x.createLinearGradient(0, 0, 0, A);
  g.addColorStop(0, "#3e5a7c");
  g.addColorStop(0.45, "#1d2c42");
  g.addColorStop(1, "#111a29");
  x.fillStyle = g;
  x.fillRect(0, 0, L, A);
  x.fillStyle = "rgba(255,255,255,.05)";
  x.beginPath();
  x.moveTo(0, A * 0.62);
  x.lineTo(L, A * 0.2);
  x.lineTo(L, A * 0.34);
  x.lineTo(0, A * 0.78);
  x.fill();
  return daTela(c, 1, 1, 4);
}

export function vestir(
  material: THREE.MeshStandardMaterial,
  pele: Pele,
  relevo = 0.22,
) {
  pele.map.colorSpace = THREE.SRGBColorSpace;
  material.map = pele.map;
  if (pele.bumpMap) {
    material.bumpMap = pele.bumpMap;
    material.bumpScale = relevo;
  }
  if (pele.roughnessMap) material.roughnessMap = pele.roughnessMap;
  if (pele.emissiveMap) {
    pele.emissiveMap.colorSpace = THREE.SRGBColorSpace;
    material.emissiveMap = pele.emissiveMap;
    material.emissive = new THREE.Color(0xffffff);
  }
  material.needsUpdate = true;
  return material;
}
