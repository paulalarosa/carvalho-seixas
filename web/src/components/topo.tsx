"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MessageCircle, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Simbolo } from "@/components/marca";
import { Assinatura, AssinaturaLinha } from "@/components/assinatura";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/imoveis", texto: "Imóveis" },
  { href: "/bairros", texto: "Bairros" },
  { href: "/avaliacao", texto: "Avaliação" },
  { href: "/juridico", texto: "Jurídico" },
  { href: "/contato", texto: "Contato" },
];

/* Barra que flutua destacada do topo, em vez de colar na borda da tela.

   Sobre a abertura ela usa a receita TINGIDA, e não a clara: atrás dela
   passa a fachada iluminada do prédio, e medido no enquadramento de tela
   baixa os links em azul claro sobre vidro claro ficavam ilegíveis quando a
   parte clara da cena entrava. Vidro sobre imagem precisa de tinta, igual
   à etiqueta de preço no cartão. Depois da rolagem vira vidro claro,
   porque aí atrás é o off-white. */
export function Topo() {
  const caminho = usePathname();
  const [rolou, setRolou] = useState(false);
  const [menu, setMenu] = useState(false);
  const sobreCena = caminho === "/" && !rolou;

  useEffect(() => {
    const medir = () => setRolou(window.scrollY > 120);
    medir();
    window.addEventListener("scroll", medir, { passive: true });
    return () => window.removeEventListener("scroll", medir);
  }, []);

  // Trocar de página fecha o menu: gaveta aberta sobre a página nova é o
  // defeito clássico de menu em rota do lado do cliente.
  useEffect(() => setMenu(false), [caminho]);

  return (
    <header className="fixed inset-x-0 top-0 z-60 pt-3 sm:pt-4">
      {/* Primeiro alvo do Tab: sem ele, quem navega por teclado atravessa o
          menu inteiro em toda página antes de chegar ao conteúdo. */}
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-6 focus:top-6 focus:z-70 focus:rounded-full focus:bg-azul-500 focus:px-5 focus:py-3 focus:font-semibold focus:text-creme"
      >
        Pular para o conteúdo
      </a>

      <div
        className={cn(
          "trilho flex items-center gap-4 rounded-full py-2 pl-4 pr-2 sm:pl-6 sm:gap-8",
          "transition-[background-color,box-shadow,border-color] duration-500 ease-[var(--ease-saida)]",
          sobreCena ? "vidro-tinta" : "vidro-claro",
        )}
      >
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Simbolo
            className="h-8 w-auto"
            azul={sobreCena ? "var(--color-creme)" : "var(--color-azul-500)"}
          />
          <AssinaturaLinha
            className="hidden text-[1.06rem] sm:inline-flex"
            cores={{
              nome: sobreCena ? "text-creme" : "text-azul-500",
              categoria: sobreCena ? "text-ouro-300" : "text-ouro-500",
            }}
          />
        </Link>

        <nav aria-label="Principal" className="ml-auto hidden items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const atual = caminho.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={atual ? "page" : undefined}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-300",
                  sobreCena
                    ? "text-creme/85 hover:bg-white/14 hover:text-creme"
                    : "text-neutro-600 hover:bg-azul-500/6 hover:text-azul-500",
                  atual &&
                    (sobreCena
                      ? "bg-white/16 text-creme"
                      : "bg-azul-500/8 text-azul-500"),
                )}
              >
                {l.texto}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/contato"
          className={cn(
            "ml-auto inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold md:ml-0",
            "shadow-[var(--shadow-flutua-1)] transition-transform duration-300 hover:-translate-y-0.5",
            sobreCena
              ? "bg-ouro-500 text-azul-700 hover:bg-ouro-400"
              : "bg-azul-500 text-creme hover:bg-azul-600",
          )}
        >
          <MessageCircle className="size-4" aria-hidden />
          Falar
        </Link>

        {/* No celular o menu inteiro ficava de fora: só existia o botão de
            falar, e as quatro páginas não tinham como ser alcançadas. */}
        <Sheet open={menu} onOpenChange={setMenu}>
          <SheetTrigger
            aria-label="Abrir menu"
            className={cn(
              "grid size-11 shrink-0 place-items-center rounded-full transition-colors md:hidden",
              sobreCena
                ? "text-creme hover:bg-white/10"
                : "text-azul-500 hover:bg-azul-500/8",
            )}
          >
            <Menu className="size-5" aria-hidden />
          </SheetTrigger>
          <SheetContent side="right" className="w-[min(20rem,86vw)] p-8">
            <SheetTitle className="sr-only">Navegação</SheetTitle>
            <div className="mt-6 flex items-center gap-3.5">
              <Simbolo className="h-14 w-auto" />
              <Assinatura className="text-[1.15rem]" />
            </div>
            <nav aria-label="Principal" className="mt-10 flex flex-col gap-1">
              {/* Fechar no clique, e não só na troca de rota: tocar no link
                  da página em que já se está não muda a rota, e a gaveta
                  ficaria aberta sem nada ter acontecido. */}
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenu(false)}
                  aria-current={caminho.startsWith(l.href) ? "page" : undefined}
                  className={cn(
                    "rounded-2xl px-5 py-4 font-display text-2xl font-semibold transition-colors",
                    caminho.startsWith(l.href)
                      ? "bg-azul-500/8 text-azul-500"
                      : "text-neutro-700 hover:bg-azul-500/6",
                  )}
                >
                  {l.texto}
                </Link>
              ))}
            </nav>
            <p className="mt-10 border-t border-azul-500/10 pt-6 text-sm text-neutro-600">
              Atendimento das sócias, das 9h às 19h, de segunda a sexta.
            </p>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
