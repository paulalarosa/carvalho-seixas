import { MessageCircle, Scale } from "lucide-react";
import { CabecaPagina } from "@/components/cabeca-pagina";
import { Painel } from "@/components/painel";
import { FormContato } from "@/components/form-contato";
import { linkZap } from "@/lib/imoveis";
import { ENDERECO, SOCIAS } from "@/lib/site";

export const metadata = {
  title: "Falar com a gente · Carvalho & Seixas",
  description:
    "Fale direto com uma das sócias. Das 9h às 19h, de segunda a sábado.",
};

export default function PaginaContato() {
  return (
    <>
      <CabecaPagina
        titulo="Falar com a gente"
        linha="Você fala direto com uma das duas. Sem atendente e sem fila."
        trilha={[{ href: "/", texto: "Início" }, { texto: "Contato" }]}
      />

      <div className="campo-luz trilho secao relative grid gap-6 md:grid-cols-2">
        {SOCIAS.map((s) => (
          <Painel key={s.sobrenome} className="borda-viva h-full p-8">
            <div className="flex items-center gap-4">
              <span className="grid size-14 place-items-center rounded-full bg-azul-50 text-azul-500">
                <Scale className="size-6" aria-hidden />
              </span>
              <span>
                <span className="rotulo block text-ouro-texto">
                  Sócia · corretora e avaliadora
                </span>
                <span className="font-display text-2xl font-bold text-azul-500">
                  {s.nome}
                </span>
                <span className="num mt-1 block text-sm text-neutro-500">
                  {s.creci} · {s.cnai}
                </span>
              </span>
            </div>
            <p className="mt-5 text-neutro-600">{s.linha}</p>
            <a
              href={linkZap()}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-azul-500 px-6 py-3.5 font-semibold text-creme shadow-[var(--shadow-flutua-1)] transition-transform duration-300 hover:-translate-y-0.5"
            >
              <MessageCircle className="size-5" aria-hidden /> Falar no WhatsApp
            </a>
            <p className="mt-3 flex items-center gap-2 text-sm text-neutro-600">
              <span className="size-2 rounded-full bg-[#1F6B4A]" aria-hidden />
              Das 9h às 19h, de segunda a sábado.
            </p>
          </Painel>
        ))}
      </div>

      <div className="trilho pb-8">
        <h2 className="text-3xl">Ou deixe recado</h2>
        <p className="mt-3 mb-10 text-lg text-neutro-600">
          O WhatsApp é mais rápido. O formulário é para quem não usa.
        </p>
        <FormContato />
      </div>
    </>
  );
}
