import Link from "next/link";
import { BedDouble, Bath, Car, Maximize } from "lucide-react";
import { Midia } from "@/components/midia";
import { moeda, type Imovel } from "@/lib/imoveis";
import { cn } from "@/lib/utils";

/* O cartão é redondo e flutuante, e o vidro dele mora só nas etiquetas, que
   ficam SOBRE a imagem, que é onde existe profundidade para refratar.

   🔴 As etiquetas usam a receita TINGIDA, não a clara: medido no primeiro
   corte, "EXCLUSIVO" em creme sobre vidro claro em cima da parte clara da
   ilustração ficava ilegível. Vidro sobre imagem precisa de tinta. */
export function CartaoImovel({
  im,
  variante = "padrao",
}: {
  im: Imovel;
  variante?: "padrao" | "largo" | "fila";
}) {
  const fila = variante === "fila";
  const largo = variante === "largo";

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-[2rem] bg-card",
        "shadow-[var(--shadow-flutua-1)] transition-[transform,box-shadow] duration-500 ease-[var(--ease-saida)]",
        "hover:-translate-y-1.5 hover:shadow-[var(--shadow-flutua-3)]",
        "borda-viva focus-within:-translate-y-1.5",
        fila && "grid grid-cols-[minmax(0,13rem)_minmax(0,1fr)] items-stretch",
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden",
          fila ? "h-full" : largo ? "aspect-[4/3]" : "aspect-[16/11]",
        )}
      >
        <Midia
          foto={im.foto}
          alt={im.alt}
          cena={im.cena}
          rotulo={`Ilustração da marca: ${im.titulo}`}
          sizes={
            largo
              ? "(max-width: 1024px) 100vw, 50vw"
              : fila
                ? "14rem"
                : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          }
          className="transition-transform duration-700 ease-[var(--ease-saida)] group-hover:scale-[1.06]"
        />

        {im.selos.length > 0 && (
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            {im.selos.map((s) => (
              <span
                key={s}
                className="tinta rotulo rounded-full px-3 py-1.5"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
          <span className="tinta rounded-full px-4 py-2 font-display text-lg font-bold">
            {moeda(im.preco)}
            {im.porNoite && <span className="text-sm font-semibold"> / noite</span>}
          </span>
          {/* Na fila o encaixe tem 13rem: preço e bairro juntos não cabem,
              e o bairro já aparece na ficha. Fica só o preço. */}
          {!fila && (
            <span className="tinta rotulo rounded-full px-3 py-1.5">
              {im.bairro}
            </span>
          )}
        </div>
      </div>

      <div className={cn("flex flex-col gap-4 p-8", fila && "p-6")}>
        <h3
          className={cn(
            "font-display font-semibold leading-tight",
            largo ? "text-3xl" : "text-xl",
          )}
        >
          <Link
            href={`/imoveis/${im.codigo}`}
            className="after:absolute after:inset-0 focus-visible:outline-none"
          >
            {im.titulo}
          </Link>
        </h3>

        <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-neutro-600">
          <div className="flex items-baseline gap-1.5">
            <dt className="sr-only">Condomínio</dt>
            <span aria-hidden>Cond.</span>
            <dd className="num text-grafite">{moeda(im.condominio || null)}</dd>
          </div>
          <div className="flex items-baseline gap-1.5">
            <dt className="sr-only">IPTU</dt>
            <span aria-hidden>IPTU</span>
            <dd className="num text-grafite">{moeda(im.iptu)}</dd>
          </div>
        </dl>

        <ul className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-neutro-600">
          {im.quartos > 0 && (
            <li className="flex items-center gap-2">
              <BedDouble className="size-4 text-azul-400" aria-hidden />
              <span className="num text-grafite">{im.quartos}</span>
              {im.quartos > 1 ? "quartos" : "quarto"}
            </li>
          )}
          <li className="flex items-center gap-2">
            <Bath className="size-4 text-azul-400" aria-hidden />
            <span className="num text-grafite">{im.suites || im.banheiros}</span>
            {im.suites ? (im.suites > 1 ? "suítes" : "suíte") : "banheiro"}
          </li>
          {im.vagas > 0 && (
            <li className="flex items-center gap-2">
              <Car className="size-4 text-azul-400" aria-hidden />
              <span className="num text-grafite">{im.vagas}</span>
              {im.vagas > 1 ? "vagas" : "vaga"}
            </li>
          )}
          <li className="flex items-center gap-2">
            <Maximize className="size-4 text-azul-400" aria-hidden />
            <span className="num text-grafite">{im.area}</span> m²
          </li>
        </ul>
      </div>
    </article>
  );
}
