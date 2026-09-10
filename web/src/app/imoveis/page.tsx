import { Suspense } from "react";
import { CabecaPagina } from "@/components/cabeca-pagina";
import { Vitrine } from "@/components/vitrine";
import { metaDaPagina } from "@/lib/site";

export const metadata = metaDaPagina({
  titulo: "A carteira",
  descricao:
    "Imóveis para comprar e por temporada no Centro, na Tijuca, no Grajaú e na Zona Sul do Rio, com documentação conferida antes da proposta.",
  caminho: "/imoveis",
});

export default function PaginaImoveis() {
  return (
    <>
      <CabecaPagina
        titulo="A carteira"
        linha="Documentação conferida antes de entrar na lista."
        trilha={[{ href: "/", texto: "Início" }, { texto: "Imóveis" }]}
      />
      {/* `useSearchParams` precisa de fronteira de suspense: sem ela a página
          inteira vira dinâmica e perde a geração estática. */}
      <Suspense fallback={<div className="trilho py-24 text-neutro-600">Carregando a carteira…</div>}>
        <Vitrine />
      </Suspense>
    </>
  );
}
