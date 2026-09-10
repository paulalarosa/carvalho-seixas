"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ChevronDown } from "lucide-react";
import type { CenaPredio } from "@/lib/cena-predio";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Abaixo disso a sequência não roda: telefone não deve gastar bateria e
 *  três telas de rolagem com 3D para chegar na busca é pedágio, não abertura. */
const LARGURA_MINIMA = 768;

/* A abertura é uma sequência de rolagem: o prédio visto da calçada, a parede
   do apartamento girando, e a câmera entrando na sala.

   Decisões que valem explicar:

   - O trecho tem TRÊS telas de altura e o visual fica `sticky` dentro dele.
     `sticky` é CSS: não depende de `pin` do ScrollTrigger, não insere
     espaçador no DOM e não quebra se a hidratação atrasar. O ScrollTrigger
     aqui só LÊ o progresso.
   - 🔴 A altura extra só existe quando a sequência EXISTE. Sem a trava, em
     `prefers-reduced-motion` e no celular a pessoa rolava três telas de nada
     acontecendo até chegar ao conteúdo, que é um defeito pior do que não ter
     animação nenhuma.
   - O conteúdo de texto nasce visível e só ganha animação depois que a cena
     confirma que montou. Se o quadro nunca roda (aba oculta, pré-render,
     miniatura), o pior caso é a sequência não acontecer, nunca um título
     invisível. */
export function PredioScroll({ children }: { children: React.ReactNode }) {
  const trecho = useRef<HTMLDivElement>(null);
  const caixa = useRef<HTMLDivElement>(null);
  const [sequencia, setSequencia] = useState(false);
  const cena = useRef<CenaPredio | null>(null);

  useEffect(() => {
    const alvo = caixa.current;
    if (!alvo) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.innerWidth < LARGURA_MINIMA) return;

    /* 🔴 `import()` DENTRO do efeito e DEPOIS das travas: o three.js passa de
       400 kB, e assim quem está no celular ou pediu menos movimento nunca
       baixa o pacote. Import no topo do arquivo colocaria esse peso no
       primeiro carregamento de todo mundo. */
    let vivo = true;
    let c: CenaPredio | null = null;
    import("@/lib/cena-predio")
      .then(({ montarPredio }) => {
        if (!vivo) return;
        c = montarPredio(alvo);
        cena.current = c;
        if (c) {
          setSequencia(true);
          requestAnimationFrame(c.medir);
        }
      })
      .catch((e) => console.error("cena do prédio falhou:", e));

    return () => {
      vivo = false;
      c?.parar();
      cena.current = null;
    };
  }, []);

  useGSAP(
    () => {
      if (!sequencia) return;
      /* A altura do trecho muda quando a sequência liga, e o ScrollTrigger
         guarda as medidas em cache: sem o refresh ele calcularia o progresso
         pela altura antiga e a cena terminaria antes da rolagem. */
      ScrollTrigger.refresh();
      const st = ScrollTrigger.create({
        trigger: trecho.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => cena.current?.irPara(self.progress),
      });
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: trecho.current,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
        },
      });
      /* O texto sai de cena quando a câmera entra na sala: a essa altura o
         título já foi lido, e manter painel sobre a sala esconde justamente
         o que a sequência foi buscar. */
      tl.to("[data-cena='texto']", { opacity: 1, duration: 0.72 })
        .to("[data-cena='texto']", { opacity: 0, y: -30, duration: 0.14 })
        .to("[data-cena='dentro']", { opacity: 1, y: 0, duration: 0.14 }, "<");
      return () => st.kill();
    },
    { scope: trecho, dependencies: [sequencia] },
  );

  return (
    <section ref={trecho} className={sequencia ? "relative h-[300vh]" : "relative"}>
      <div
        className={
          sequencia
            ? "sticky top-0 h-svh overflow-hidden bg-azul-800"
            : "relative min-h-[min(44rem,86svh)] overflow-hidden bg-azul-800"
        }
      >
        {/* Reserva: é ela que aparece no primeiro quadro e é ela o LCP. */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(38% 46% at 68% 52%, rgba(255,180,85,.28), transparent 70%), radial-gradient(60% 34% at 40% 98%, #b9ad93, transparent 72%), linear-gradient(168deg,#14345c,#0a1d38)",
          }}
        />
        <div
          ref={caixa}
          aria-hidden
          className={`absolute inset-0 transition-opacity duration-1000 ease-[var(--ease-saida)] ${
            sequencia ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(96deg, rgba(9,22,42,.92) 0%, rgba(9,22,42,.7) 34%, rgba(9,22,42,.02) 62%), linear-gradient(to top, rgba(9,22,42,.7), transparent 46%)",
          }}
        />

        <div className="trilho relative flex h-full flex-col justify-end pb-10 sm:pb-14"
             style={{ paddingTop: "calc(var(--altura-topo) + 1.25rem)" }}>
          <div data-cena="texto">{children}</div>

          {/* Aviso de que existe sequência. Sem ele, quem chega não sabe que
              a página tem o que mostrar antes da lista de imóveis. */}
          {sequencia && (
            <span
              data-cena="texto-rolar"
              className="rotulo pointer-events-none absolute bottom-6 right-0 flex items-center gap-2 text-azul-200"
            >
              Role para entrar
              <ChevronDown className="size-4 animate-bounce" aria-hidden />
            </span>
          )}

          {/* O slogan da marca fecha a sequência, já dentro do apartamento.
              É o uso "em abertura" que o brandbook prevê, e aqui ele chega
              depois de a página ter mostrado o que promete. */}
          <p
            data-cena="dentro"
            className="vidro pointer-events-none absolute bottom-14 left-1/2 max-w-lg -translate-x-1/2 translate-y-4 rounded-3xl px-8 py-6 text-center font-display text-2xl font-semibold text-creme opacity-0 sm:text-3xl"
          >
            Aqui seu sonho vira patrimônio.
          </p>
        </div>
      </div>
    </section>
  );
}
