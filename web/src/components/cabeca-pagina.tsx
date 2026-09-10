import Link from "next/link";
import { ChevronRight } from "lucide-react";

/* Cabeça das páginas internas: ilha azul arredondada, flutuando dentro do
   trilho em vez de faixa colada nas bordas. É o que mantém a direção
   arredondada também fora da home. */
export function CabecaPagina({
  titulo,
  linha,
  trilha,
}: {
  titulo: string;
  linha: string;
  trilha: { href?: string; texto: string }[];
}) {
  return (
    <div className="trilho" style={{ paddingTop: "calc(var(--altura-topo) + 1.75rem)" }}>
      <div className="ilha relative isolate overflow-hidden bg-azul-500 text-creme">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(42% 65% at 88% 12%, rgba(201,162,76,.26), transparent 70%), radial-gradient(46% 70% at 6% 95%, rgba(118,148,189,.3), transparent 72%)",
          }}
        />
        <nav aria-label="Você está aqui" className="mb-7 flex flex-wrap items-center gap-2 text-sm">
          {trilha.map((t, i) => (
            <span key={t.texto} className="flex items-center gap-2">
              {i > 0 && <ChevronRight className="size-3.5 text-azul-300" aria-hidden />}
              {t.href ? (
                <Link href={t.href} className="text-azul-200 transition-colors hover:text-creme">
                  {t.texto}
                </Link>
              ) : (
                <span aria-current="page" className="text-creme">
                  {t.texto}
                </span>
              )}
            </span>
          ))}
        </nav>
        <div className="grid items-end gap-6 lg:grid-cols-[1fr_26rem]">
          <h1 className="text-[clamp(2.2rem,4.6vw,3.4rem)] text-creme">{titulo}</h1>
          <p className="text-lg text-azul-200">{linha}</p>
        </div>
      </div>
    </div>
  );
}
