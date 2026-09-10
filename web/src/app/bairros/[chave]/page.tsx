import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CabecaPagina } from "@/components/cabeca-pagina";
import { CartaoImovel } from "@/components/cartao-imovel";
import { Midia } from "@/components/midia";
import { BAIRROS, IMOVEIS, moeda, retratoDaRegiao } from "@/lib/imoveis";
import { metaDaPagina } from "@/lib/site";

/* Rota estática: são três recortes conhecidos, então saem prontos no build
   e não custam servidor. `params` é Promise desde o Next 15. */
export function generateStaticParams() {
  return BAIRROS.map((b) => ({ chave: b.chave }));
}

/* 🔴 As quatro páginas de bairro saíam com o título e a descrição PADRÃO
   da home, porque não havia metadado nenhum aqui. Página de bairro é
   exatamente o que uma imobiliária quer que a busca local encontre, e as
   quatro estavam competindo entre si com o mesmo texto. O número vem da
   carteira, então a descrição também não envelhece. */
export async function generateMetadata({ params }: PageProps<"/bairros/[chave]">) {
  const { chave } = await params;
  const b = BAIRROS.find((x) => x.chave === decodeURIComponent(chave));
  if (!b) return {};
  const retrato = retratoDaRegiao(b.chave);
  const quantos = retrato
    ? `${retrato.quantos} ${retrato.quantos === 1 ? "imóvel" : "imóveis"} na carteira. `
    : "";
  return metaDaPagina({
    titulo: `Imóveis em ${b.nome}`,
    descricao: `${quantos}${b.linha} ${b.texto}`.slice(0, 300),
    caminho: `/bairros/${encodeURIComponent(b.chave)}`,
  });
}

export default async function PaginaBairro({ params }: PageProps<"/bairros/[chave]">) {
  const { chave } = await params;
  const b = BAIRROS.find((x) => x.chave === decodeURIComponent(chave));
  if (!b) notFound();
  const lista = IMOVEIS.filter((im) => im.regiao === b.chave);
  const retrato = retratoDaRegiao(b.chave);

  return (
    <>
      <CabecaPagina
        titulo={b.nome}
        linha={b.linha}
        trilha={[
          { href: "/", texto: "Início" },
          { href: "/bairros", texto: "Bairros" },
          { texto: b.nome },
        ]}
      />

      <div className="trilho secao grid items-center gap-12 lg:grid-cols-[1fr_1fr]">
        <p className="max-w-[62ch] text-lg leading-relaxed text-neutro-600">{b.texto}</p>
        <div className="relative aspect-[16/10] overflow-hidden rounded-[2.5rem] shadow-[var(--shadow-flutua-3)]">
          <Midia
            cena={b.cena}
            rotulo={`Ilustração da marca: ${b.nome}`}
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
      </div>

      {/* Fita de números do bairro, tirada da carteira. A página falava do
          bairro sem dizer nada mensurável, e é o número que faz a diferença
          entre texto de bairro e texto de corretora. */}
      {retrato && (
        <dl className="trilho grid grid-cols-2 gap-y-8 border-y border-azul-500/12 py-8 sm:grid-cols-3">
          {[
            ["Na carteira", `${retrato.quantos} ${retrato.quantos === 1 ? "imóvel" : "imóveis"}`],
            ["Faixa de preço", `${moeda(retrato.menor)} a ${moeda(retrato.maior)}`],
            ["Área mediana", `${retrato.areaMediana} m²`],
          ].map(([rotulo, valor], i) => (
            <div
              key={rotulo}
              className={`flex flex-col gap-1 ${
                i > 0 ? "sm:border-l sm:border-azul-500/10 sm:pl-6" : ""
              }`}
            >
              <dt className="rotulo text-neutro-600">{rotulo}</dt>
              <dd className="num text-xl font-semibold text-azul-500">{valor}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="trilho secao pb-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-3xl">Imóveis em {b.nome}</h2>
          <Link
            href={`/imoveis?regiao=${encodeURIComponent(b.chave)}`}
            className="inline-flex items-center gap-2 rounded-full border border-azul-500/15 px-5 py-2.5 text-sm font-semibold text-azul-500 transition-colors hover:bg-azul-500/6"
          >
            Ver na carteira <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((im) => (
            <CartaoImovel key={im.codigo} im={im} />
          ))}
        </div>
      </div>
    </>
  );
}
