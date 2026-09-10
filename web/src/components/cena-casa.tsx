"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Cena } from "@/lib/cena3d";

/* Monta a cena de three.js num elemento de verdade, dentro de efeito.

   Por que não react-three-fiber: o `<Canvas>` do R3F só inicializa depois
   que um `ResizeObserver` entrega tamanho maior que zero, e existe contexto
   embutido (painel de pré-visualização, miniatura) onde esse observador
   nunca dispara. Ali o canvas fica parado em 300x150 e nada avisa. A cena
   aqui é imperativa, mede com `getBoundingClientRect` e tem reserva pintada
   por baixo, então o pior caso é a página mostrar o degradê e seguir.

   A reserva é o que aparece no primeiro quadro e é ela o LCP. A tela 3D só
   ganha opacidade quando termina de montar. */
export function CenaCasa({
  modo = "casa",
  className,
}: {
  modo?: "casa" | "rua";
  className?: string;
}) {
  const caixa = useRef<HTMLDivElement>(null);
  const [pronta, setPronta] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const alvo = caixa.current;
    if (!alvo) return;
    /* Pacote do three carregado sob demanda: a página de bairros não deve
       pagar o peso dele no primeiro byte. */
    let vivo = true;
    let cena: Cena | null = null;
    import("@/lib/cena3d")
      .then(({ montarCena }) => {
        if (!vivo) return;
        cena = montarCena(
          alvo,
          (chave) => router.push(`/bairros/${encodeURIComponent(chave)}`),
          { modo },
        );
        if (cena) {
          setPronta(true);
          requestAnimationFrame(cena.medir);
        }
      })
      /* Falha de contexto WebGL é silenciosa por natureza. Sem este log, a
         cena some e não há nada para investigar. */
      .catch((e) => console.error("cena3d falhou:", e));

    /* `parar()` já cancela o quadro, solta a geometria e devolve o contexto
       WebGL. Remover o canvas por fora deixaria o contexto vivo. */
    return () => {
      vivo = false;
      cena?.parar();
    };
  }, [modo, router]);

  return (
    <div
      ref={caixa}
      aria-hidden
      data-pronta={pronta}
      className={`absolute inset-0 transition-opacity duration-1000 ease-[var(--ease-saida)] ${
        pronta ? "opacity-100" : "opacity-0"
      } ${className ?? ""}`}
    />
  );
}
