import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Painel } from "@/components/painel";
import { Simbolo } from "@/components/marca";

export const metadata = { title: "Página não encontrada · Carvalho & Seixas" };

/* Erro 404 na marca, e com saída. Página de erro padrão do framework num
   site de imobiliária parece site quebrado, e quem chega aqui geralmente
   veio de um link de imóvel que já saiu da carteira. */
export default function NaoEncontrada() {
  return (
    <div className="trilho flex min-h-[70svh] items-center justify-center py-32">
      <Painel className="max-w-xl p-12 text-center">
        <Simbolo className="mx-auto h-14 w-auto" />
        <h1 className="mt-8 text-3xl">Esta página não existe mais</h1>
        <p className="mt-4 text-neutro-600">
          Talvez o imóvel já tenha sido vendido. A carteira continua aqui.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link
            href="/imoveis"
            className="rounded-full bg-azul-500 px-6 py-3 font-semibold text-creme shadow-[var(--shadow-flutua-2)] transition-transform duration-300 hover:-translate-y-0.5"
          >
            Ver a carteira
          </Link>
          <Link
            href="/contato"
            className="inline-flex items-center gap-2 rounded-full border border-azul-500/20 px-6 py-3 font-semibold text-azul-500 transition-colors hover:bg-azul-500/6"
          >
            <MessageCircle className="size-5" aria-hidden /> Falar com uma sócia
          </Link>
        </div>
      </Painel>
    </div>
  );
}
