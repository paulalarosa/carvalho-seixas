"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { contar, type Finalidade, type Regiao } from "@/lib/imoveis";
import { cn } from "@/lib/utils";

const REGIOES: Regiao[] = ["Centro", "Tijuca", "Zona Sul"];
/* O `Select.Value` do base-ui mostra o VALOR selecionado, não o texto do
   item: sem este mapa o campo aparecia escrito "todos" e "todas". */
const ROTULOS: Record<string, string> = {
  todos: "Todos os bairros",
  todas: "Comprar ou alugar",
  Centro: "Centro",
  Tijuca: "Tijuca",
  "Zona Sul": "Zona Sul",
  comprar: "Comprar",
  alugar: "Alugar",
  temporada: "Temporada",
};
const FINALIDADES: { valor: Finalidade; texto: string }[] = [
  { valor: "comprar", texto: "Comprar" },
  { valor: "alugar", texto: "Alugar" },
  { valor: "temporada", texto: "Temporada" },
];

/* A contagem ao lado de cada opção é calculada da carteira, não escrita à
   mão: se a cliente tirar um imóvel do arquivo de dados, o número acompanha.
   Número em mono e tabular, que é a regra da marca. */
export function Busca({ variante = "escuro" }: { variante?: "claro" | "escuro" }) {
  const router = useRouter();
  const [regiao, setRegiao] = useState<string>("todos");
  const [finalidade, setFinalidade] = useState<string>("todas");
  const escuro = variante === "escuro";

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (regiao !== "todos") p.set("regiao", regiao);
    if (finalidade !== "todas") p.set("finalidade", finalidade);
    const q = p.toString();
    router.push(`/imoveis${q ? `?${q}` : ""}`);
  }

  const gatilho = cn(
    "h-auto w-full justify-between border-0 bg-transparent px-0 py-0 font-display text-lg font-semibold shadow-none",
    "focus-visible:ring-0 focus-visible:border-0 dark:bg-transparent",
    escuro ? "text-creme" : "text-azul-500",
  );

  return (
    <form
      onSubmit={enviar}
      className={cn(
        "grid gap-px overflow-hidden rounded-[1.75rem] sm:grid-cols-[1fr_1fr_auto]",
        escuro ? "vidro" : "vidro-claro",
      )}
    >
      <label className="flex flex-col gap-1 px-6 py-4">
        <span className={cn("rotulo", escuro ? "text-azul-200" : "text-neutro-600")}>
          Bairro
        </span>
        <Select value={regiao} onValueChange={(v) => setRegiao(v ?? "todos")}>
          <SelectTrigger className={gatilho} aria-label="Bairro">
            <SelectValue>{(v) => ROTULOS[String(v)] ?? String(v)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os bairros</SelectItem>
            {REGIOES.map((r) => (
              <SelectItem key={r} value={r}>
                {r} <span className="num ml-1 opacity-60">{contar(r, null)}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <label
        className={cn(
          "flex flex-col gap-1 px-6 py-4",
          escuro ? "sm:border-l sm:border-white/15" : "sm:border-l sm:border-azul-500/10",
        )}
      >
        <span className={cn("rotulo", escuro ? "text-azul-200" : "text-neutro-600")}>
          Finalidade
        </span>
        <Select value={finalidade} onValueChange={(v) => setFinalidade(v ?? "todas")}>
          <SelectTrigger className={gatilho} aria-label="Finalidade">
            <SelectValue>{(v) => ROTULOS[String(v)] ?? String(v)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Comprar ou alugar</SelectItem>
            {FINALIDADES.map((f) => (
              <SelectItem key={f.valor} value={f.valor}>
                {f.texto}{" "}
                <span className="num ml-1 opacity-60">{contar(null, f.valor)}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <div className="p-2">
        <button
          type="submit"
          className={cn(
            "inline-flex h-full w-full items-center justify-center gap-2 rounded-[1.4rem] px-8 py-4",
            "bg-ouro-500 font-semibold text-azul-700 shadow-[var(--shadow-flutua-2)]",
            "transition-transform duration-300 ease-[var(--ease-saida)] hover:-translate-y-0.5 hover:bg-ouro-400",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ouro-500",
          )}
        >
          <Search className="size-4" aria-hidden />
          Ver imóveis
        </button>
      </div>
    </form>
  );
}
