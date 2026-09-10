import { cn } from "@/lib/utils";

/* Painel. A escolha entre as duas receitas não é gosto:

   `escuro` é vidro DE VERDADE, para painel sobre cena (a casa 3D, foto,
   faixa azul): atrás dele existe profundidade para refratar.
   `claro` NÃO é vidro. Sobre o off-white não há o que desfocar, e cada
   `backdrop-filter` custa uma passada de composição. Medido: eram 29 numa
   página, a maioria sem ganho visual nenhum. Aqui é superfície sólida com
   fio e sombra, que é o que o olho lê como painel de qualquer jeito. */
export function Painel({
  variante = "claro",
  className,
  children,
  ...resto
}: React.ComponentProps<"div"> & { variante?: "claro" | "escuro" }) {
  return (
    <div
      className={cn(
        "rounded-3xl",
        variante === "escuro"
          ? "vidro text-creme"
          : "border border-azul-500/10 bg-white/85 shadow-[var(--shadow-flutua-2)]",
        className,
      )}
      {...resto}
    >
      {children}
    </div>
  );
}
