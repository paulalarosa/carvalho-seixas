import Link from "next/link";
import { CabecaPagina } from "@/components/cabeca-pagina";
import { CenaCasa } from "@/components/cena-casa";
import { Cena } from "@/components/cenas";
import { BAIRROS, IMOVEIS } from "@/lib/imoveis";
import { metaDaPagina } from "@/lib/site";

export const metadata = metaDaPagina({
  titulo: "Onde a gente atua",
  descricao:
    "Centro, Tijuca, Grajaú e Zona Sul: quatro mercados diferentes, quatro contas diferentes.",
  caminho: "/bairros",
});

export default function PaginaBairros() {
  return (
    <>
      <CabecaPagina
        titulo="Onde a gente atua"
        linha="Clique no bairro que você procura."
        trilha={[{ href: "/", texto: "Início" }, { texto: "Bairros" }]}
      />

      {/* A rua em 3D: um volume por recorte, clicável. O 3D aqui tem função,
          é o índice da página, e não enfeite de fundo. */}
      <div className="trilho mt-10">
        <div className="relative isolate aspect-[21/9] overflow-hidden rounded-[2.5rem] bg-azul-800 shadow-[var(--shadow-flutua-3)]">
          <div
            aria-hidden
            className="absolute inset-0 -z-10"
            style={{ background: "linear-gradient(168deg,#14345c,#0a1d38)" }}
          />
          <CenaCasa modo="rua" />
        </div>
        <p className="mt-3 text-sm text-neutro-600">
          Ilustração da marca. Não é imóvel da carteira.
        </p>
      </div>

      <div className="trilho secao grid gap-6 md:grid-cols-3">
        {BAIRROS.map((b) => {
          const n = IMOVEIS.filter((im) => im.regiao === b.chave).length;
          return (
            <Link
              key={b.chave}
              href={`/bairros/${encodeURIComponent(b.chave)}`}
              className="group relative isolate flex min-h-[24rem] flex-col justify-end overflow-hidden rounded-[2rem] p-6 shadow-[var(--shadow-flutua-2)] transition-transform duration-500 ease-[var(--ease-saida)] hover:-translate-y-1.5"
            >
              <Cena
                nome={b.cena}
                rotulo={`Ilustração da marca: ${b.nome}`}
                className="absolute inset-0 -z-20 size-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div
                aria-hidden
                className="absolute inset-0 -z-10 bg-gradient-to-t from-azul-900/85 via-azul-900/25 to-transparent"
              />
              <div className="tinta rounded-[1.5rem] p-5">
                <h2 className="font-display text-2xl font-bold text-creme">{b.nome}</h2>
                <span className="num mt-1 block text-sm text-ouro-300">
                  {n} {n === 1 ? "imóvel" : "imóveis"}
                </span>
                <p className="mt-3 text-sm text-azul-200">{b.linha}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
