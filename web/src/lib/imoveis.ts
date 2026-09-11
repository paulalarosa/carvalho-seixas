import type { NomeCena } from "@/components/cenas";
import { TELEFONE } from "@/lib/site";

/* Carvalho & Seixas · portfólio de exemplo.
   Nenhum imóvel aqui é real. Este arquivo é o que a manutenção mensal edita:
   sem banco e sem CRM, a carteira é um módulo TypeScript. A contagem viva
   dos filtros é derivada daqui, e o tipo abaixo é o contrato: faltando campo
   obrigatório, a página nem compila, que é melhor do que publicar torto. */

/* 🔴 LOCAÇÃO NÃO EXISTE nesta imobiliária: elas trabalham compra, venda,
   temporada e avaliação. O tipo é o que segura isso: com "alugar" fora da
   união, qualquer imóvel ou filtro que tente usar aluguel não compila. */
export type Finalidade = "comprar" | "temporada";
export type Regiao = "Centro" | "Tijuca" | "Grajaú" | "Zona Sul";

export type Imovel = {
  codigo: string;
  cena: NomeCena;
  titulo: string;
  bairro: string;
  regiao: Regiao;
  finalidade: Finalidade;
  preco: number;
  condominio: number | null;
  iptu: number | null;
  quartos: number;
  suites: number;
  banheiros: number;
  vagas: number;
  area: number;
  andar: string | null;
  ano: number | null;
  selos: string[];
  destaque: boolean;
  resumo: string;
  fechado?: boolean;
  porNoite?: boolean;
  /** Quando a foto da cliente chegar, é só preencher: a cena sai e a foto entra. */
  foto?: string;
  fotos?: string[];
  alt?: string;
};

export const IMOVEIS: Imovel[] = [
  {
    codigo: "CS-0142",
    cena: "predio",
    titulo: "Apartamento na Conde de Bonfim",
    bairro: "Tijuca",
    regiao: "Tijuca",
    finalidade: "comprar",
    preco: 780000,
    condominio: 890,
    iptu: 210,
    quartos: 2,
    suites: 1,
    banheiros: 2,
    vagas: 1,
    area: 78,
    andar: "7º",
    ano: null,
    selos: ["Exclusivo"],
    destaque: true,
    resumo:
      "Sala com dois ambientes, cozinha reformada e varanda voltada para o Maracanã. Prédio com portaria 24 horas, a 400 metros do metrô Uruguai.",
  },
  {
    codigo: "CS-0207",
    cena: "predio",
    titulo: "Studio a duas quadras do metrô",
    bairro: "Botafogo",
    regiao: "Zona Sul",
    finalidade: "temporada",
    preco: 320,
    porNoite: true,
    condominio: 640,
    iptu: null,
    quartos: 1,
    suites: 0,
    banheiros: 1,
    vagas: 0,
    area: 32,
    andar: "11º",
    ano: 2019,
    selos: ["Novo", "Temporada"],
    destaque: true,
    resumo:
      "Planta inteligente, mobiliado, com academia e lavanderia no prédio. Diária mínima de cinco noites, enxoval incluso.",
  },
  {
    codigo: "CS-0088",
    cena: "comercial",
    titulo: "Sala comercial reformada",
    bairro: "Centro",
    regiao: "Centro",
    finalidade: "comprar",
    preco: 320000,
    condominio: 1100,
    iptu: 380,
    quartos: 0,
    suites: 0,
    banheiros: 1,
    vagas: 0,
    area: 41,
    andar: "14º",
    ano: 1978,
    selos: ["Vendido"],
    destaque: false,
    fechado: true,
    resumo:
      "Andar alto na Avenida Rio Branco, com vista para a baía. Documentação conferida e condomínio em dia.",
  },
  {
    codigo: "CS-0311",
    cena: "casa",
    titulo: "Casa de vila na Muda",
    bairro: "Tijuca",
    regiao: "Tijuca",
    finalidade: "comprar",
    preco: 1150000,
    condominio: 0,
    iptu: 340,
    quartos: 3,
    suites: 1,
    banheiros: 3,
    vagas: 2,
    area: 164,
    andar: null,
    ano: 1962,
    selos: ["Exclusivo"],
    destaque: true,
    resumo:
      "Três quartos, quintal com árvore frutífera e garagem para dois carros. Vila fechada com oito casas e portão eletrônico.",
  },
  {
    codigo: "CS-0356",
    cena: "vista",
    titulo: "Cobertura duplex no Flamengo",
    bairro: "Flamengo",
    regiao: "Zona Sul",
    finalidade: "comprar",
    preco: 2380000,
    condominio: 2100,
    iptu: 920,
    quartos: 3,
    suites: 2,
    banheiros: 4,
    vagas: 2,
    area: 212,
    andar: "12º",
    ano: 1994,
    selos: [],
    destaque: true,
    resumo:
      "Terraço com churrasqueira e vista para o aterro. Reformada em 2024, com esquadrias novas e ar-condicionado em todos os quartos.",
  },
  {
    codigo: "CS-0402",
    cena: "interior",
    titulo: "Conjugado no Largo do Machado",
    bairro: "Catete",
    regiao: "Zona Sul",
    finalidade: "comprar",
    preco: 295000,
    condominio: 520,
    iptu: 95,
    quartos: 1,
    suites: 0,
    banheiros: 1,
    vagas: 0,
    area: 28,
    andar: "5º",
    ano: 1968,
    selos: [],
    destaque: false,
    resumo:
      "Reformado, com armários planejados. Prédio em frente à praça, com metrô e feira na esquina.",
  },
  {
    codigo: "CS-0455",
    cena: "comercial",
    titulo: "Loja de rua na Haddock Lobo",
    bairro: "Tijuca",
    regiao: "Tijuca",
    finalidade: "comprar",
    preco: 1180000,
    condominio: 0,
    iptu: 610,
    quartos: 0,
    suites: 0,
    banheiros: 2,
    vagas: 0,
    area: 120,
    andar: null,
    ano: null,
    selos: [],
    destaque: false,
    resumo:
      "Ponto com fluxo alto, vitrine de seis metros e mezanino. Escritura e matrícula conferidas, sem pendência de IPTU.",
  },
  {
    codigo: "CS-0490",
    cena: "interior",
    titulo: "Apartamento de época na Glória",
    bairro: "Glória",
    regiao: "Centro",
    finalidade: "comprar",
    preco: 640000,
    condominio: 780,
    iptu: 280,
    quartos: 2,
    suites: 0,
    banheiros: 1,
    vagas: 0,
    area: 92,
    andar: "3º",
    ano: 1938,
    selos: ["Novo"],
    destaque: false,
    resumo:
      "Pé-direito alto, tacos originais e janelas de guilhotina. Prédio tombado, com obra de fachada já quitada.",
  },
  {
    codigo: "CS-0512",
    cena: "predio",
    titulo: "Dois quartos no Grajaú",
    bairro: "Grajaú",
    regiao: "Grajaú",
    finalidade: "comprar",
    preco: 530000,
    condominio: 610,
    iptu: 180,
    quartos: 2,
    suites: 0,
    banheiros: 1,
    vagas: 1,
    area: 68,
    andar: "2º",
    ano: 1985,
    selos: [],
    destaque: false,
    resumo:
      "Sala ampla, dependência reversível e vaga escriturada. Rua tranquila, a cinco minutos da praça.",
  },
  {
    codigo: "CS-0533",
    cena: "vista",
    titulo: "Frente para a praia em Copacabana",
    bairro: "Copacabana",
    regiao: "Zona Sul",
    finalidade: "temporada",
    preco: 890,
    condominio: 0,
    iptu: null,
    quartos: 2,
    suites: 1,
    banheiros: 2,
    vagas: 0,
    area: 86,
    andar: "9º",
    ano: 1971,
    selos: ["Temporada"],
    destaque: true,
    porNoite: true,
    resumo:
      "Vista frontal para o mar, dois quartos e diária mínima de três noites. Enxoval e limpeza inclusos.",
  },
];

export type Bairro = {
  nome: string;
  chave: Regiao;
  cena: NomeCena;
  linha: string;
  texto: string;
};

export const BAIRROS: Bairro[] = [
  {
    nome: "Centro",
    chave: "Centro",
    cena: "predio",
    linha: "O escritório fica aqui, e é daqui que sai a papelada.",
    texto:
      "Aqui ficam os cartórios e a Prefeitura. Metro quadrado com história, e condomínio que costuma surpreender: a gente abre a planilha antes da proposta.",
  },
  {
    nome: "Tijuca",
    chave: "Tijuca",
    cena: "casa",
    linha: "Bairro de família, com metrô e a floresta ali em cima.",
    texto:
      "Casa de vila, prédio dos anos 60 e lançamento na mesma rua. Entre a Conde de Bonfim e a Muda o preço muda muito, e essa diferença é metade da negociação.",
  },
  {
    nome: "Grajaú",
    chave: "Grajaú",
    cena: "casa",
    linha: "Vizinho da Tijuca, com rua arborizada e casa de vila.",
    texto:
      "Quem procura espaço pelo mesmo dinheiro da Tijuca acaba aqui. Prédio de poucos andares e casa de vila convivem na mesma quadra, e a diferença entre elas está na documentação, não no anúncio.",
  },
  {
    nome: "Zona Sul",
    chave: "Zona Sul",
    cena: "vista",
    linha: "Do Flamengo a Copacabana, incluindo temporada.",
    texto:
      "O investidor entra pela temporada, o morador entra pelo metrô. São duas contas, e a gente faz as duas antes de indicar.",
  },
];

/* 🔴 As regiões dos filtros saem DAQUI, e não de uma lista escrita à mão em
   cada componente. Era assim antes, e quando o Grajaú entrou os dois
   seletores continuaram oferecendo três regiões: o imóvel do Grajaú existia
   na carteira e não aparecia em filtro nenhum. */
export const REGIOES: Regiao[] = BAIRROS.map((b) => b.chave);

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export function moeda(v: number | null | undefined) {
  return v === null || v === undefined ? "—" : BRL.format(v);
}

/* A mensagem já vai preenchida com o código. Sem isso a corretora precisa
   perguntar de qual imóvel se trata, e a resposta atrasa. */
/* 🔴 Sem número, NÃO devolve link de WhatsApp. `wa.me/` sem destinatário
   abre o aplicativo numa tela de "número inválido", e a pessoa sai
   acreditando que falou com a imobiliária. Enquanto o número único da
   empresa não é definido, o destino é a página de contato. Assim que
   `TELEFONE` for preenchido em `lib/site.ts`, todos os botões do site
   passam a abrir a conversa com a mensagem pronta. */
export function linkZap(im?: Imovel) {
  if (!TELEFONE) return "/contato/";
  const texto = im
    ? `Olá! Vi o imóvel ${im.codigo}, ${im.titulo}, no site e queria saber mais.`
    : "Olá! Vim pelo site.";
  const numero = TELEFONE.replace(/\D/g, "");
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

/* Retrato numérico de uma região, DERIVADO da carteira: quantos imóveis,
   faixa de preço e área mediana. Número derivado não envelhece, porque se
   a carteira muda a frase muda sozinha, e é o oposto de "4.500 clientes
   satisfeitos" escrito à mão numa tela de portfólio.

   Mediana, não média: uma cobertura de 300 m² no meio de conjugados puxa a
   média para um número que não descreve nada. */
export function retratoDaRegiao(regiao: Regiao) {
  const lista = IMOVEIS.filter((im) => im.regiao === regiao && !im.porNoite);
  if (!lista.length) return null;
  const precos = lista.map((im) => im.preco).sort((a, b) => a - b);
  const areas = lista.map((im) => im.area).sort((a, b) => a - b);
  return {
    quantos: lista.length,
    menor: precos[0],
    maior: precos[precos.length - 1],
    areaMediana: areas[Math.floor(areas.length / 2)],
  };
}

export function contar(regiao?: Regiao | null, finalidade?: Finalidade | null) {
  return IMOVEIS.filter(
    (im) =>
      (!regiao || im.regiao === regiao) &&
      (!finalidade || im.finalidade === finalidade),
  ).length;
}
