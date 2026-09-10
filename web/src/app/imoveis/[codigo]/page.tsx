import { notFound } from "next/navigation";
import Link from "next/link";
import { MessageCircle, ShieldCheck, ArrowRight } from "lucide-react";
import { Galeria } from "@/components/galeria";
import { CartaoImovel } from "@/components/cartao-imovel";
import { Painel } from "@/components/painel";
import { IMOVEIS, moeda, linkZap } from "@/lib/imoveis";
import { SITE, NOME } from "@/lib/site";

export function generateStaticParams() {
  return IMOVEIS.map((im) => ({ codigo: im.codigo }));
}

export async function generateMetadata({ params }: PageProps<"/imoveis/[codigo]">) {
  const { codigo } = await params;
  const im = IMOVEIS.find((x) => x.codigo === codigo);
  return {
    title: im ? `${im.titulo} · ${im.bairro}` : "Imóvel",
    description: im?.resumo,
    alternates: { canonical: `/imoveis/${codigo}` },
  };
}

/* Rótulo em cima, valor embaixo, e valor que não existe é travessão, nunca
   um número plausível: ficha com número inventado parece ficha preenchida. */
function Item({ rotulo, valor }: { rotulo: string; valor: string | number | null }) {
  const vazio = valor === null || valor === undefined || valor === "";
  return (
    <div className="flex flex-col gap-1">
      <dt className="rotulo text-neutro-600">{rotulo}</dt>
      <dd className={`num ${vazio ? "text-neutro-500" : "text-azul-500"}`}>
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
      <Galeria im={im} />

      <div className="trilho secao grid items-start gap-12 lg:grid-cols-[1.55fr_1fr]">
        <div>
          <span className="rotulo text-ouro-texto">{im.bairro}</span>
          <h1 className="mt-3 text-[clamp(1.8rem,3.2vw,2.6rem)]">{im.titulo}</h1>
          <p className="mt-6 max-w-[62ch] text-lg leading-relaxed text-neutro-600">
            {im.resumo}
          </p>

          <h2 className="mt-14 text-2xl">A ficha</h2>
          <dl className="mt-7 grid grid-cols-2 gap-7 sm:grid-cols-4">
            <Item rotulo="Área útil" valor={`${im.area} m²`} />
            <Item rotulo="Quartos" valor={im.quartos || null} />
            <Item rotulo="Suítes" valor={im.suites || null} />
            <Item rotulo="Banheiros" valor={im.banheiros || null} />
            <Item rotulo="Vagas" valor={im.vagas || null} />
            <Item rotulo="Andar" valor={im.andar} />
            <Item rotulo="Ano" valor={im.ano} />
            <Item rotulo="Código" valor={im.codigo} />
          </dl>
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
