"use client";

import { useState } from "react";
import { Check, Link2, Printer, Share2 } from "lucide-react";

/* Compartilhar a ficha, que é como corretora trabalha: o imóvel viaja por
   link no WhatsApp, não por visita ao site.

   Três caminhos, e cada um existe por um motivo:
   - COMPARTILHAR do sistema, quando o aparelho tem (é o gesto do celular,
     e leva para qualquer aplicativo, inclusive o WhatsApp);
   - COPIAR o endereço, que é o que funciona no computador;
   - IMPRIMIR, porque quem visita imóvel leva papel, e a folha impressa
     sai formatada pela regra de impressão do site.

   🔴 O estado do botão não pode mentir: "Copiado" só aparece depois de a
   escrita na área de transferência dar certo, e volta sozinho. Em contexto
   sem permissão a mensagem diz para copiar da barra de endereço, em vez de
   fingir que copiou. */
export function Compartilhar({ titulo }: { titulo: string }) {
  const [copiado, setCopiado] = useState<"nao" | "sim" | "falhou">("nao");

  const podeCompartilhar =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function copiar() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiado("sim");
      setTimeout(() => setCopiado("nao"), 2400);
    } catch {
      setCopiado("falhou");
    }
  }

  async function compartilhar() {
    try {
      await navigator.share({ title: titulo, url: window.location.href });
    } catch {
      /* Cancelar o compartilhamento não é erro: é a pessoa desistindo. */
    }
  }

  const botao =
    "inline-flex items-center gap-2 rounded-full border border-azul-500/20 px-4 py-2.5 text-sm font-semibold text-azul-500 transition-colors hover:bg-azul-500/6";

  return (
    <div className="mt-6 flex flex-wrap items-center gap-2" data-sem-impressao>
      {podeCompartilhar && (
        <button type="button" onClick={compartilhar} className={botao}>
          <Share2 className="size-4" aria-hidden /> Compartilhar
        </button>
      )}
      <button type="button" onClick={copiar} className={botao}>
        {copiado === "sim" ? (
          <>
            <Check className="size-4" aria-hidden /> Endereço copiado
          </>
        ) : (
          <>
            <Link2 className="size-4" aria-hidden /> Copiar o endereço
          </>
        )}
      </button>
      <button type="button" onClick={() => window.print()} className={botao}>
        <Printer className="size-4" aria-hidden /> Imprimir ou salvar em PDF
      </button>
      {copiado === "falhou" && (
        <span role="status" className="text-sm text-neutro-600">
          O navegador não deixou copiar. O endereço está na barra de cima.
        </span>
      )}
    </div>
  );
}
