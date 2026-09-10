import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CabecaPagina } from "@/components/cabeca-pagina";
import { CartaoImovel } from "@/components/cartao-imovel";
import { Midia } from "@/components/midia";
import { BAIRROS, IMOVEIS } from "@/lib/imoveis";

/* Rota estática: são três recortes conhecidos, então saem prontos no build
   e não custam servidor. `params` é Promise desde o Next 15. */
export function generateStaticParams() {
  return BAIRROS.map((b) => ({ chave: b.chave }));
}

export default async function PaginaBairro({ params }: PageProps<"/bairros/[chave]">) {
  const { chave } = await params;
  const b = BAIRROS.find((x) => x.chave === decodeURIComponent(chave));
  if (!b) notFound();
  const lista = IMOVEIS.filter((im) => im.regiao === b.chave);

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

      <div className="trilho pb-8">
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
