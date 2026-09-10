import { notFound } from "next/navigation";
import Link from "next/link";
import { MessageCircle, ShieldCheck, ArrowRight, Check } from "lucide-react";
import { Galeria } from "@/components/galeria";
import { CartaoImovel } from "@/components/cartao-imovel";
import { Painel } from "@/components/painel";
import { IMOVEIS, BAIRROS, moeda, linkZap } from "@/lib/imoveis";
import { SITE, NOME, metaDaPagina } from "@/lib/site";

export function generateStaticParams() {
  return IMOVEIS.map((im) => ({ codigo: im.codigo }));
}

export async function generateMetadata({ params }: PageProps<"/imoveis/[codigo]">) {
  const { codigo } = await params;
  const im = IMOVEIS.find((x) => x.codigo === codigo);
  if (!im) return { title: "Imóvel" };
  /* Barra no fim: `trailingSlash` está ligado, e canônico que aponta para
     endereço sem barra aponta para uma página que não existe. */
  return metaDaPagina({
    titulo: `${im.titulo} · ${im.bairro}`,
    descricao: im.resumo,
    caminho: `/imoveis/${im.codigo}`,
  });
}

/* O que a gente confere antes da proposta. Não é lista de serviço
   genérica: é a etapa que essa imobiliária faz e que o anúncio de portal
   não faz, escrita como conteúdo da página. Nenhum prazo e nenhuma
   alíquota aqui, porque isso depende de confirmação delas. */
const CONFERIDO = [
  "Matrícula atualizada, com a cadeia de proprietários",
  "Ônus, penhora e ação contra o vendedor",
  "Dívida de condomínio e obra em rateio",
  "IPTU e taxas em aberto",
  "Regularidade da planta na Prefeitura",
];

/* Rótulo em cima, valor embaixo, e valor que não existe é travessão, nunca
   um número plausível: ficha com número inventado parece ficha preenchida. */
function Item({
  rotulo,
  valor,
  grande,
  fio,
}: {
  rotulo: string;
  valor: string | number | null;
  /** Corpo de leitura, para a fita de especificação da ficha. */
  grande?: boolean;
  /** Fio à esquerda: separa as colunas da fita sem precisar de caixa. */
  fio?: boolean;
}) {
  const vazio = valor === null || valor === undefined || valor === "";
  return (
    <div
      className={`flex flex-col gap-1 ${
        fio ? "sm:border-l sm:border-azul-500/10 sm:pl-6" : ""
      }`}
    >
      <dt className="rotulo text-neutro-600">{rotulo}</dt>
      <dd
        className={`num ${grande ? "text-2xl font-semibold" : ""} ${
          vazio ? "text-neutro-500" : "text-azul-500"
        }`}
      >
        {vazio ? "—" : valor}
      </dd>
    </div>
  );
}

export default async function PaginaImovel({ params }: PageProps<"/imoveis/[codigo]">) {
  const { codigo } = await params;
  const im = IMOVEIS.find((x) => x.codigo === codigo);
  if (!im) notFound();
  const parecidos = IMOVEIS.filter(
    (x) => x.regiao === im.regiao && x.codigo !== im.codigo,
  ).slice(0, 3);
  /* O texto do bairro é conteúdo que já existe: reaproveitar aqui evita
     escrever de novo e mantém a página do bairro como fonte única. */
  const bairro = BAIRROS.find((b) => b.chave === im.regiao);

  /* Anúncio em dado estruturado: preço, área, quartos e bairro. É assim que
     o imóvel aparece na busca com a ficha, e não como parágrafo solto. */
  const dados = {
    "@context": "https://schema.org",
    "@type": "Residence",
    name: im.titulo,
    description: im.resumo,
    url: `${SITE}/imoveis/${im.codigo}`,
    numberOfRooms: im.quartos || undefined,
    numberOfBathroomsTotal: im.banheiros || undefined,
    floorSize: { "@type": "QuantitativeValue", value: im.area, unitCode: "MTK" },
    address: {
      "@type": "PostalAddress",
      addressLocality: im.bairro,
      addressRegion: "RJ",
      addressCountry: "BR",
    },
    offers: {
      "@type": "Offer",
      price: im.preco,
      priceCurrency: "BRL",
      availability: im.fechado
        ? "https://schema.org/SoldOut"
        : "https://schema.org/InStock",
      seller: { "@type": "RealEstateAgent", name: NOME },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(dados).replace(/</g, "\u003c"),
        }}
      />
      {/* A imagem passa a IDENTIFICAR o imóvel: selo e localização em cima,
          título e preço embaixo. Quem chega por link compartilhado sabe o
          que está vendo sem rolar a página. */}
      <Galeria
        im={im}
        capa={
          <>
            <div className="flex flex-wrap items-center gap-2">
              {im.fechado && (
                <span className="tinta rotulo rounded-full px-3 py-1.5">Vendido</span>
              )}
              {im.selos.map((s) => (
                <span key={s} className="tinta rotulo rounded-full px-3 py-1.5">
                  {s}
                </span>
              ))}
            </div>
            <div className="max-w-[46rem]">
              {/* Região só quando ela ACRESCENTA: na Tijuca o bairro e a
                  região têm o mesmo nome, e "Tijuca · Tijuca" lê como
                  defeito de dado. */}
              <span className="rotulo text-ouro-300">
                {im.bairro}
                {im.bairro !== im.regiao ? ` · ${im.regiao}` : ""} · {im.codigo}
              </span>
              <h1 className="mt-2 font-display text-[clamp(1.7rem,4vw,3.1rem)] leading-[1.05] text-creme">
                {im.titulo}
              </h1>
              <span className="num mt-3 block font-display text-2xl font-bold text-creme sm:text-3xl">
                {moeda(im.preco)}
                {im.porNoite && <span className="text-lg"> / noite</span>}
              </span>
            </div>
          </>
        }
      />

      {/* Fita de especificação: número grande com fio entre as colunas. É a
          primeira coisa que quem procura imóvel compara, e estava dentro de
          uma lista de definição no meio da página. */}
      <dl className="trilho mt-10 grid grid-cols-2 gap-y-8 border-y border-azul-500/12 py-8 sm:grid-cols-3 lg:grid-cols-6">
        {(
          [
            ["Área útil", `${im.area} m²`],
            ["Quartos", im.quartos || null],
            ["Suítes", im.suites || null],
            ["Banheiros", im.banheiros || null],
            ["Vagas", im.vagas || null],
            ["Andar", im.andar],
          ] as const
        ).map(([rotulo, valor], i) => (
          <Item key={rotulo} rotulo={rotulo} valor={valor} grande fio={i > 0} />
        ))}
      </dl>

      <div className="trilho secao grid items-start gap-12 lg:grid-cols-[1.55fr_1fr]">
        <div>
          <p className="max-w-[62ch] text-[clamp(1.05rem,1.5vw,1.35rem)] leading-relaxed text-neutro-600">
            {im.resumo}
          </p>

          <h2 className="mt-14 text-2xl">O que a gente confere antes da proposta</h2>
          <ul className="mt-7 grid gap-x-10 gap-y-4 sm:grid-cols-2">
            {CONFERIDO.map((linha) => (
              <li key={linha} className="flex gap-3 border-t border-azul-500/10 pt-4">
                <Check className="mt-0.5 size-4 shrink-0 text-ouro-texto" aria-hidden />
                <span className="text-neutro-600">{linha}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-[58ch] text-sm text-neutro-500">
            O resultado sai por escrito, antes de qualquer sinal. Se aparecer
            pendência, você fica sabendo antes de decidir.
          </p>

          {bairro && (
            <>
              <h2 className="mt-14 text-2xl">Sobre o {bairro.nome}</h2>
              <p className="mt-5 max-w-[62ch] text-neutro-600">{bairro.texto}</p>
              <Link
                href={`/bairros/${encodeURIComponent(bairro.chave)}/`}
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-azul-500/20 px-5 py-2.5 text-sm font-semibold text-azul-500 transition-colors hover:bg-azul-500/6"
              >
                Ver o {bairro.nome} <ArrowRight className="size-4" aria-hidden />
              </Link>
            </>
          )}
        </div>

        {/* A coluna de preço acompanha a rolagem: é a ação da página. */}
        <Painel className="sticky top-28 p-8">
          <span className="font-display text-4xl font-bold text-azul-500">
            {moeda(im.preco)}
            {im.porNoite && <span className="text-lg"> / noite</span>}
          </span>
          <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <div className="flex items-baseline gap-2">
              <dt className="text-neutro-600">Condomínio</dt>
              <dd className="num text-grafite">{moeda(im.condominio || null)}</dd>
            </div>
            <div className="flex items-baseline gap-2">
              <dt className="text-neutro-600">IPTU</dt>
              <dd className="num text-grafite">{moeda(im.iptu)}</dd>
            </div>
          </dl>

          <a
            href={linkZap(im)}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-azul-500 px-6 py-4 font-semibold text-creme shadow-[var(--shadow-flutua-2)] transition-transform duration-300 hover:-translate-y-0.5"
          >
            <MessageCircle className="size-5" aria-hidden /> Falar sobre este imóvel
          </a>
          <p className="mt-3 flex items-center gap-2 text-sm text-neutro-600">
            <span className="size-2 rounded-full bg-[#1F6B4A]" aria-hidden />
            Resposta em minutos, das 9h às 19h.
          </p>

          <p className="num mt-6 text-sm text-neutro-500">
            Código {im.codigo}
            {im.ano ? ` · Ano ${im.ano}` : ""}
          </p>

          <div className="mt-7 flex gap-3 rounded-2xl border-l-4 border-l-azul-400 bg-azul-50 p-5 text-sm">
            <ShieldCheck className="size-5 shrink-0 text-azul-500" aria-hidden />
            <span>
              <b className="block text-azul-500">
                Condomínio e IPTU informados pelo proprietário.
              </b>
              A gente confere na documentação antes da proposta.
            </span>
          </div>
        </Painel>
      </div>

      {parecidos.length > 0 && (
        <div className="trilho pb-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-3xl">Também em {im.regiao}</h2>
            <Link
              href={`/imoveis?regiao=${encodeURIComponent(im.regiao)}`}
              className="inline-flex items-center gap-2 rounded-full border border-azul-500/15 px-5 py-2.5 text-sm font-semibold text-azul-500 transition-colors hover:bg-azul-500/6"
            >
              Ver todos <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {parecidos.map((p) => (
              <CartaoImovel key={p.codigo} im={p} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
