"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

/* Entrada da abertura.

   Regra que veio de defeito real: o conteúdo NUNCA parte de opacidade zero.
   Em aba oculta, pré-render ou painel embutido o quadro não anda, o tween
   não avança e o texto ficaria invisível para sempre. Aqui só o `y` é
   animado, então o pior caso é o texto nascer 20px fora do lugar. */
export function EntradaAbertura({ children }: { children: React.ReactNode }) {
  const raiz = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      /* Só arma DENTRO de um quadro. Se o `requestAnimationFrame` nunca
         dispara, o `from` nem chega a ser aplicado e o conteúdo fica onde
         nasceu. Armar fora do quadro é o que deixa página em branco. */
      requestAnimationFrame(() => {
        gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
          gsap
            .timeline({ defaults: { ease: "power3.out" } })
            .from("[data-entra='titulo']", { y: 26, duration: 0.65 })
            .from("[data-entra='linha']", { y: 18, duration: 0.55 }, "-=0.45")
            .from("[data-entra='frentes']", { y: 14, duration: 0.5 }, "-=0.42")
            .from("[data-entra='busca']", { y: 24, duration: 0.6 }, "-=0.40")
            .from("[data-entra='ficha']", { y: 20, duration: 0.55 }, "-=0.38");
        });
      });
    },
    { scope: raiz },
  );

  return (
    <div ref={raiz} className="contents">
      {children}
    </div>
  );
}

/* Revelação por rolagem, por MEDIÇÃO.

   🔴 Este bloco já falhou de dois jeitos diferentes, e por isso agora não
   depende de nada que possa não rodar:

   1. com ScrollTrigger, o gatilho não disparou no painel embutido e as
      dezesseis seções da home ficaram TODAS em opacidade zero, o que é
      infinitamente pior do que não ter animação;
   2. com IntersectionObserver, existe contexto em que o observador nunca
      entrega entrada (miniatura, pré-render), e o efeito é o mesmo.

   A regra virou: esconder é a EXCEÇÃO, e só acontece depois de o código
   confirmar que existe viewport de verdade. Quem revela é `scroll` mais
   `getBoundingClientRect`, que é evento do navegador com medida síncrona,
   sem quadro, sem observador e sem cache de posição. Se nada disso rodar,
   o conteúdo simplesmente já está visível. */
export function Revela({
  children,
  className,
  /* `id` para poder linkar a seção e para o `#ancora` funcionar em teste de
     rolagem: sem isso não há como fotografar uma faixa específica da página
     em navegador sem interface. */
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const no = raiz.current;
    if (!no) return;
    let cancelado = false;
    let desligar = () => {};

    /* 🔴 Esconder acontece DENTRO de um quadro, e essa é a trava que resolve
       tudo de uma vez.

       Se `requestAnimationFrame` não dispara, o ambiente também não vai
       rodar transição de CSS (medido: no painel embutido o quadro, o
       temporizador e a transição estão todos congelados). Nesse caso o
       callback abaixo nunca roda, nada recebe o estado escondido, e a página
       aparece inteira. Quando o quadro roda, o compositor está vivo e a
       revelação anima normalmente.

       Foi por não ter essa trava que as dezesseis seções da home ficaram
       todas em opacidade zero. */
    requestAnimationFrame(() => {
      if (cancelado) return;
      const alt = window.innerHeight;
      // Sem viewport não se esconde nada: em altura zero nada voltaria.
      if (!alt || alt < 200) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const alvos = Array.from(no.querySelectorAll<HTMLElement>("[data-revela]"));
      if (!alvos.length) return;

      /* Esconde primeiro, SEM transição, e só depois liga a animação. A
         leitura de `offsetHeight` entre as duas coisas força o navegador a
         aplicar o estado escondido antes de saber que ele é animável: sem
         isso, o que está na tela aparece e depois desaparece. */
      alvos.forEach((el) => (el.dataset.oculto = "1"));
      void no.offsetHeight;
      alvos.forEach((el) => (el.dataset.anima = "1"));

      let pendentes = alvos.length;
      const checar = () => {
        const h = window.innerHeight;
        for (const el of alvos) {
          if (el.dataset.oculto !== "1") continue;
          const r = el.getBoundingClientRect();
          // Entrou em 92% da tela e ainda não passou por cima: revela.
          if (r.top < h * 0.92 && r.bottom > 0) {
            el.dataset.oculto = "0";
            pendentes--;
          }
        }
        if (pendentes <= 0) desligar();
      };

      desligar = () => {
        window.removeEventListener("scroll", checar);
        window.removeEventListener("resize", checar);
      };

      /* Quem revela é `scroll` mais `getBoundingClientRect`: evento do
         navegador com medida síncrona, sem observador e sem cache de
         posição, então funciona com conteúdo que cresce depois (imagem,
         fonte) e não depende de refresh nenhum. A primeira medição é agora,
         para o que já está na tela não esperar rolagem. */
      checar();
      window.addEventListener("scroll", checar, { passive: true });
      window.addEventListener("resize", checar);
    });

    return () => {
      cancelado = true;
      desligar();
    };
  }, []);

  return (
    <div ref={raiz} id={id} className={className}>
      {children}
    </div>
  );
}
