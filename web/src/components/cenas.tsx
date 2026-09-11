/* Ilustração da marca no lugar da fotografia que ainda não chegou.

   🔴 Antes eram cinco desenhos FIXOS num sprite, chamados por `<use>`. Com
   dez imóveis e cinco desenhos, cada figura aparecia duas ou três vezes, e
   duas idênticas caíam lado a lado na mesma fileira da carteira: era o sinal
   mais forte de que o conteúdo não era real. Agora cada cena é desenhada a
   partir de uma semente, que é o código do imóvel: hora do dia, número de
   andares, ritmo das janelas acesas, altura dos morros, listras do toldo e o
   lado da porta saem daí. Dois prédios não saem iguais.

   🔴 O sorteio é DETERMINÍSTICO, e isso não é detalhe: o mesmo imóvel
   precisa ter sempre o mesmo desenho (senão a lista pisca a cada visita), e
   o servidor e o navegador precisam desenhar igual (senão a hidratação
   acusa diferença e o React descarta a página inteira).

   🔴 As cores saem SÓ da paleta. A variação de hora escolhe entre tons que
   já existem no tema; girar matiz daria variedade e tiraria o desenho da
   marca.

   Quando a foto real chegar, `foto` no arquivo de dados vence e a `<Cena>`
   nem chega a ser chamada. */

export type NomeCena = "predio" | "casa" | "interior" | "vista" | "comercial";

/* xorshift de 32 bits semeado por FNV-1a. Escrito à mão porque
   `Math.random()` daria desenho diferente a cada quadro e a cada máquina. */
function sorteio(semente: string) {
  let h = 2166136261;
  for (let i = 0; i < semente.length; i++) {
    h ^= semente.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  function bruto() {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return (h >>> 0) / 4294967296;
  }
  return {
    entre: (a: number, b: number) => a + Math.floor(bruto() * (b - a + 1)),
    chance: (p: number) => bruto() < p,
    um: <T,>(lista: readonly T[]) => lista[Math.floor(bruto() * lista.length)],
    fracao: bruto,
  };
}

type Sorte = ReturnType<typeof sorteio>;

const cor = (nome: string) => `var(--color-${nome})`;

/* A hora do dia, em papéis e não em cores soltas: quem desenha pede "massa"
   ou "luz" e não precisa saber qual tom do tema entra em cada hora. */
type Hora = {
  ceu: string;
  morro: string;
  massa: string;
  topo: string;
  parede: string;
  vao: string;
  luz: string;
  rua: string;
  vizinho: string;
  acesa: number;
  sol: boolean;
  noite: boolean;
  /* Peso do sorteio. 🔴 Noite é a hora mais bonita e a que menos pode
     dominar: com as três horas igualmente prováveis, cinco dos seis
     primeiros cartões saíram escuros e a carteira inteira perdeu o
     off-white da marca. Dia e tarde carregam a página; noite tempera. */
  peso: number;
};

const HORAS: Hora[] = [
  {
    ceu: cor("azul-100"),
    morro: cor("azul-300"),
    massa: cor("azul-600"),
    topo: cor("azul-700"),
    parede: cor("azul-500"),
    vao: cor("azul-800"),
    luz: cor("ouro-300"),
    rua: cor("azul-700"),
    vizinho: cor("azul-400"),
    acesa: 0.14,
    sol: true,
    noite: false,
    peso: 42,
  },
  {
    ceu: cor("azul-200"),
    morro: cor("azul-300"),
    massa: cor("azul-600"),
    topo: cor("azul-700"),
    parede: cor("azul-600"),
    vao: cor("azul-800"),
    luz: cor("ouro-300"),
    rua: cor("azul-800"),
    vizinho: cor("azul-400"),
    acesa: 0.36,
    sol: true,
    noite: false,
    peso: 40,
  },
  {
    ceu: cor("azul-800"),
    morro: cor("azul-900"),
    massa: cor("azul-600"),
    topo: cor("azul-700"),
    parede: cor("azul-700"),
    vao: cor("azul-900"),
    luz: cor("ouro-200"),
    rua: cor("azul-900"),
    vizinho: cor("azul-500"),
    acesa: 0.66,
    sol: false,
    noite: true,
    peso: 18,
  },
];

function horaSorteada(s: Sorte) {
  const total = HORAS.reduce((soma, h) => soma + h.peso, 0);
  let ponto = s.fracao() * total;
  for (const h of HORAS) {
    ponto -= h.peso;
    if (ponto < 0) return h;
  }
  return HORAS[0];
}

/* Os morros ao fundo: é o que faz a cena ser do Rio e não de uma cidade
   qualquer, e é também o que mais muda de um desenho para o outro. */
function morros(s: Sorte, h: Hora, base: number, L: number) {
  const quantos = s.entre(2, 3) + (L > 520 ? 2 : 0);
  const peças = [];
  for (let i = 0; i < quantos; i++) {
    const meio = s.entre(20, L - 20);
    const larg = s.entre(60, 130);
    const alt = s.entre(34, 76);
    peças.push(
      <path
        key={`morro-${i}`}
        d={`M${meio - larg} ${base} L${meio} ${base - alt} L${meio + larg} ${base} Z`}
        fill={h.morro}
      />,
    );
  }
  return peças;
}

function predio(s: Sorte, h: Hora, L: number) {
  const cx = L / 2;
  const andares = s.entre(3, 5);
  const colunas = s.entre(4, 6);
  const ALTURA_ANDAR = 46;
  const base = 222;
  const topo = base - andares * ALTURA_ANDAR;
  const vao = (212 - (colunas - 1) * 14) / colunas;
  const portaX = cx - 60 + s.entre(-54, 54);
  const toldo = s.um([cor("ouro-200"), cor("creme"), cor("ouro-300")]);
  const vizE = s.entre(90, 140);
  const vizD = s.entre(100, 150);

  const janelas = [];
  for (let a = 0; a < andares; a++) {
    for (let c = 0; c < colunas; c++) {
      const acesa = s.chance(h.acesa);
      janelas.push(
        <rect
          key={`j-${a}-${c}`}
          x={cx - 106 + c * (vao + 14)}
          y={topo + a * ALTURA_ANDAR + 14}
          width={vao}
          height={26}
          fill={acesa ? h.luz : h.vao}
          opacity={acesa ? 0.92 : 1}
        />,
      );
    }
  }

  return (
    <>
      <rect width={L} height="275" fill={h.ceu} />
      {morros(s, h, 140, L)}
      {/* Vizinhança repetida até a borda: em faixa panorâmica o prédio
          aparece dentro de uma rua, e não sozinho num campo azul. */}
      {Array.from({ length: Math.ceil(cx / 92) }, (_, i) => {
        const alt = 78 + ((i * 37) % 62);
        return (
          <g key={`viz-${i}`} fill={h.vizinho}>
            <rect x={cx - 182 - i * 92} y={255 - alt} width="46" height={alt} />
            <rect x={cx + 136 + i * 92} y={237 - alt} width="52" height={alt + 18} />
          </g>
        );
      })}
      <rect x={cx - 182} y={255 - vizE} width="46" height={vizE} fill={h.vizinho} />
      <rect x={cx + 136} y={255 - vizD} width="52" height={vizD} fill={h.vizinho} />
      <rect x={cx - 126} y={topo} width="252" height={base - topo} fill={h.massa} />
      <rect x={cx - 126} y={topo} width="252" height="9" fill={h.topo} />
      {janelas}
      <g stroke={h.vizinho} strokeWidth="2" opacity=".55">
        {Array.from({ length: andares - 1 }, (_, a) => (
          <path
            key={`fio-${a}`}
            d={`M${cx - 114} ${topo + (a + 1) * ALTURA_ANDAR + 4}h228`}
          />
        ))}
      </g>
      <rect x={cx - 126} y={base} width="252" height="33" fill={h.topo} />
      <rect x={portaX} y={base + 6} width="54" height="27" fill={toldo} opacity=".9" />
      <rect y="255" width={L} height="20" fill={h.rua} />
    </>
  );
}

function casa(s: Sorte, h: Hora, L: number) {
  const cx = L / 2;
  const cume = s.entre(50, 76);
  const largura = s.entre(160, 196);
  const x0 = cx - largura / 2;
  const acesaEsquerda = s.chance(0.5);
  const arvores = s.entre(1, 3);
  const janelaY = s.entre(140, 152);

  return (
    <>
      <rect width={L} height="275" fill={h.ceu} />
      {morros(s, h, 152, L)}
      <rect y="150" width={L} height="125" fill={h.rua} />
      <rect x={x0} y="118" width={largura} height="112" fill={cor("neutro-100")} />
      <path d={`M${x0 - 12} 120 L${cx} ${cume} L${x0 + largura + 12} 120 Z`} fill={h.massa} />
      <rect x={x0 - 16} y="116" width={largura + 32} height="8" fill={h.topo} />
      <rect x={cx - 14} y="168" width="30" height="62" fill={h.massa} />
      <rect
        x={x0 + 20}
        y={janelaY}
        width="38"
        height="32"
        fill={acesaEsquerda ? h.luz : cor("azul-500")}
      />
      <rect
        x={x0 + largura - 58}
        y={janelaY}
        width="38"
        height="32"
        fill={acesaEsquerda ? cor("azul-500") : h.luz}
      />
      <g stroke={h.topo} strokeWidth="3">
        <path
          d={`M${x0 + 39} ${janelaY}v32M${x0 + 20} ${janelaY + 16}h38M${x0 + largura - 39} ${janelaY}v32M${x0 + largura - 58} ${janelaY + 16}h38`}
        />
      </g>
      <rect x={x0} y="222" width={largura} height="8" fill={h.massa} />
      <g stroke={cor("ouro-500")} strokeWidth="3">
        {Array.from({ length: Math.ceil(L / 14) }, (_, i) => (
          <path key={`poste-${i}`} d={`M${8 + i * 14} 232v26`} />
        ))}
        <path d={`M0 234h${L}M0 256h${L}`} />
      </g>
      {Array.from({ length: arvores }, (_, i) => {
        const x = i === 0 ? cx - s.entre(120, 152) : cx + s.entre(100, 150);
        const r = s.entre(18, 34);
        return (
          /* 🔴 A copa era `azul-800` sobre um chão `azul-700`: a árvore
             estava desenhada e simplesmente não aparecia. Silhueta pede o
             tom da massa, que é mais claro que o chão em qualquer hora. */
          <g key={`arv-${i}`}>
            <rect x={x - 4} y={258 - r * 2} width="9" height={r * 2} fill={h.topo} />
            <circle cx={x} cy={252 - r * 2} r={r} fill={h.massa} />
            <circle cx={x + r * 0.7} cy={258 - r * 1.4} r={r * 0.62} fill={h.massa} />
          </g>
        );
      })}
      <rect y="258" width={L} height="17" fill={cor("azul-800")} />
    </>
  );
}

function interior(s: Sorte, h: Hora, L: number) {
  const cx = L / 2;
  const colunas = s.entre(2, 3);
  const linhas = s.entre(2, 3);
  /* Dois formatos de janela, e não só duas posições: com a janela sempre
     no mesmo retângulo, duas salas seguidas liam como a mesma sala. */
  const janelao = s.chance(0.5);
  /* O tom da parede também sorteia: duas salas com a mesma parede e a
     mesma janela liam como a mesma sala mesmo com móvel diferente. */
  const parede = s.um([h.parede, h.massa, h.topo]);
  const jx = cx + (janelao ? s.entre(-30, -4) : s.entre(6, 32));
  const jl = janelao ? s.entre(170, 200) : s.entre(112, 136);
  const jy = janelao ? 38 : s.entre(46, 60);
  const jh = janelao ? 150 : s.entre(112, 132);
  const sofa = s.entre(120, 150);
  const pendente = s.chance(0.7);
  const tapete = s.chance(0.6);

  return (
    <>
      <rect width={L} height="275" fill={parede} />
      <path d={`M0 232 L${L} 208 L${L} 275 L0 275 Z`} fill={cor("azul-800")} />
      <rect x={jx} y={jy} width={jl} height={jh + 16} fill={cor("azul-500")} />
      <rect x={jx + 8} y={jy + 8} width={jl - 16} height={jh} fill={h.luz} />
      <g stroke={cor("azul-500")} strokeWidth="6">
        {Array.from({ length: colunas - 1 }, (_, i) => (
          <path
            key={`cv-${i}`}
            d={`M${jx + 8 + ((jl - 16) / colunas) * (i + 1)} ${jy + 8}v${jh}`}
          />
        ))}
        {Array.from({ length: linhas - 1 }, (_, i) => (
          <path
            key={`ch-${i}`}
            d={`M${jx + 8} ${jy + 8 + (jh / linhas) * (i + 1)}h${jl - 16}`}
          />
        ))}
      </g>
      {/* A mancha de luz no chão sai da janela, então acompanha onde ela
          está: janela deslocada com luz parada lê como erro de desenho. */}
      <path
        d={`M${jx + 8} ${jy + jh} L${jx + jl - 8} ${jy + jh} L${jx + jl - 74} 262 L${jx - 118} 262 Z`}
        fill={cor("ouro-100")}
        opacity=".16"
      />
      <rect x={jx - 16} y={jy + jh + 8} width={jl + 16} height="9" fill={h.topo} />
      {tapete && (
        <rect
          x={cx - 170}
          y="236"
          width="200"
          height="18"
          rx="9"
          fill={cor("azul-700")}
          opacity=".7"
        />
      )}
      <rect x={cx - 160} y="176" width={sofa} height="52" rx="4" fill={h.topo} />
      <rect x={cx - 166} y="150" width={sofa + 12} height="34" rx="6" fill={cor("azul-500")} />
      <rect
        x={cx - 148}
        y="156"
        width="50"
        height="24"
        rx="3"
        fill={cor("azul-400")}
        opacity=".55"
      />
      <rect
        x={cx - 148 + sofa / 2}
        y="156"
        width="50"
        height="24"
        rx="3"
        fill={cor("azul-400")}
        opacity=".35"
      />
      <rect x={cx - 156} y="228" width="10" height="16" fill={cor("azul-800")} />
      <rect x={cx - 174 + sofa} y="228" width="10" height="16" fill={cor("azul-800")} />
      {pendente && (
        <>
          <path d={`M${cx - 12} 0v58`} stroke={h.topo} strokeWidth="4" />
          <path d={`M${cx - 34} 58h44l-10 22h-24z`} fill={h.topo} />
          <circle cx={cx - 12} cy="86" r="9" fill={h.luz} />
        </>
      )}
      <rect x={cx + 166} y="196" width="8" height="42" fill={cor("azul-800")} />
      <circle cx={cx + 170} cy="188" r={s.entre(16, 26)} fill={h.topo} />
    </>
  );
}

function vista(s: Sorte, h: Hora, L: number) {
  const quantos = s.entre(3, 4) + (L > 520 ? 2 : 0);
  const astroX = s.entre(Math.round(L * 0.58), L - 50);
  const astroR = h.sol ? s.entre(20, 30) : s.entre(12, 18);
  const passo = s.entre(40, 56);
  const morrosDoMar = [];
  for (let i = 0; i < quantos; i++) {
    const meio = s.entre(40, L - 60);
    const larg = s.entre(44, 92);
    const alt = s.entre(38, 80);
    morrosDoMar.push(
      <path
        key={`pao-${i}`}
        d={`M${meio - larg} 156 C${meio - larg * 0.5} ${156 - alt * 1.3} ${meio + larg * 0.5} ${156 - alt * 1.3} ${meio + larg} 156 Z`}
        fill={i % 2 === 0 ? cor("azul-600") : cor("azul-500")}
      />,
    );
  }

  return (
    <>
      <rect width={L} height="275" fill={h.ceu} />
      <circle cx={astroX} cy={s.entre(48, 80)} r={astroR} fill={h.luz} />
      {morrosDoMar}
      <rect y="156" width={L} height="119" fill={h.noite ? cor("azul-700") : cor("azul-500")} />
      <g stroke={h.morro} strokeWidth="3" fill="none" opacity=".7">
        {Array.from({ length: Math.round((L / 400) * 9) }, (_, i) => {
          const y = 176 + (i % 3) * 18;
          const x = s.entre(10, L - 80);
          return <path key={`onda-${i}`} d={`M${x} ${y}h${s.entre(44, 74)}`} />;
        })}
      </g>
      <rect y="234" width={L} height="41" fill={cor("azul-800")} />
      <rect y="228" width={L} height="8" fill={cor("ouro-500")} />
      <g stroke={cor("ouro-500")} strokeWidth="4">
        {Array.from({ length: Math.ceil(L / passo) }, (_, i) => (
          <path key={`calc-${i}`} d={`M${14 + i * passo} 236v39`} />
        ))}
      </g>
    </>
  );
}

function comercial(s: Sorte, h: Hora, L: number) {
  /* `e` é a borda esquerda da fachada, que tem 332 de largura fixa. */
  const e = L / 2 - 166;
  const janelasAlto = s.entre(3, 5);
  const acesa = s.entre(0, janelasAlto - 1);
  const listras = s.entre(4, 6);
  const portaEsquerda = s.chance(0.5);
  const vitrine = s.entre(170, 210);
  const larguraJanela = (300 - (janelasAlto - 1) * 24) / janelasAlto;

  return (
    <>
      <rect width={L} height="275" fill={h.ceu} />
      <rect x={e} y="20" width="332" height="96" fill={h.massa} />
      {Array.from({ length: janelasAlto }, (_, i) => (
        <rect
          key={`ja-${i}`}
          x={e + 16 + i * (larguraJanela + 24)}
          y="44"
          width={larguraJanela}
          height="34"
          fill={i === acesa ? h.luz : h.vao}
          opacity={i === acesa ? 0.85 : 1}
        />
      ))}
      <path
        d={`M${e - 12} 116 L${e + 344} 116 L${e + 326} 152 L${e + 6} 152 Z`}
        fill={cor("creme")}
      />
      <g fill={h.massa}>
        {Array.from({ length: listras }, (_, i) => {
          const larg = 356 / (listras * 2);
          const x = e - 12 + i * larg * 2;
          return <path key={`lis-${i}`} d={`M${x} 116 L${x + larg} 116 L${x + larg - 16} 152 L${x - 16} 152 Z`} />;
        })}
      </g>
      <rect x={e} y="152" width="332" height="14" fill={h.topo} />
      <rect x={e} y="166" width="332" height="76" fill={h.massa} />
      <rect
        x={portaEsquerda ? e + 18 : e + 314 - vitrine}
        y="178"
        width={vitrine}
        height="64"
        fill={h.luz}
        opacity=".92"
      />
      <g stroke={h.massa} strokeWidth="6">
        <path
          d={`M${(portaEsquerda ? e + 18 : e + 314 - vitrine) + vitrine / 3} 178v64M${(portaEsquerda ? e + 18 : e + 314 - vitrine) + (vitrine / 3) * 2} 178v64`}
        />
      </g>
      <rect
        x={portaEsquerda ? e + 38 + vitrine : e + 18}
        y="178"
        width={332 - vitrine - 56}
        height="64"
        fill={cor("azul-500")}
      />
      <rect y="242" width={L} height="33" fill={h.noite ? cor("azul-800") : cor("azul-300")} />
      <g stroke={cor("azul-500")} strokeWidth="4" fill="none" opacity=".8">
        <path d={`M-4 258q24-16 48 0${"t48 0".repeat(Math.ceil(L / 48))}`} />
      </g>
    </>
  );
}

const DESENHOS: Record<NomeCena, (s: Sorte, h: Hora, L: number) => React.ReactNode> = {
  predio,
  casa,
  interior,
  vista,
  comercial,
};

export function Cena({
  nome,
  rotulo,
  /* Sem semente a cena é sempre a mesma, o que serve para peça única (a
     abertura de um bairro, por exemplo). Em lista, passar o código do
     imóvel é o que impede dois cartões iguais. */
  semente,
  /* 🔴 Onde o corte se apoia. O desenho é 1,45:1 e a cabeça de página é
     3,7:1: recortando pelo MEIO sobra a barriga da fachada, que lê como
     padronagem e não como prédio. Ancorado na BASE aparece a marquise, a
     entrada e a rua, que é o que faz o desenho ter pé no chão. */
  ancora = "meio",
  /* Largura do desenho. 🔴 O desenho é 1,45:1 e a cabeça de página é
     3,7:1: com a mesma largura o recorte amplia a barriga da fachada e o
     prédio vira padronagem. Em `panorama` a cena desenha mais cidade em
     volta, em vez de aproximar. */
  panorama = false,
  className,
}: {
  nome: NomeCena;
  rotulo: string;
  semente?: string;
  ancora?: "meio" | "base";
  panorama?: boolean;
  className?: string;
}) {
  const s = sorteio(`${nome}|${semente ?? ""}`);
  const hora = horaSorteada(s);
  /* Espelhar e reenquadrar custam nada e mudam muito: mesmo com a mesma
     hora e o mesmo número de andares, o desenho deixa de parecer cópia. */
  const espelho = s.chance(0.5);
  const z = s.entre(0, 14);
  const L = panorama ? 1040 : 400;

  return (
    <svg
      role="img"
      aria-label={rotulo}
      viewBox={`${z} ${z * 0.6875} ${L - z * 2} ${275 - z * 1.375}`}
      preserveAspectRatio={ancora === "base" ? "xMidYMax slice" : "xMidYMid slice"}
      className={`overflow-hidden ${className ?? ""}`}
    >
      <g transform={espelho ? `translate(${L},0) scale(-1,1)` : undefined}>
        {DESENHOS[nome](s, hora, L)}
      </g>
    </svg>
  );
}
