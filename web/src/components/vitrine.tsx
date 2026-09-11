"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { MessageCircle, X } from "lucide-react";
import { CartaoImovel } from "@/components/cartao-imovel";
import { Painel } from "@/components/painel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IMOVEIS,
  REGIOES,
  linkZap,
  type Finalidade,
  type Imovel,
  type Regiao,
} from "@/lib/imoveis";
import { cn } from "@/lib/utils";

const FINALIDADES: [Finalidade, string][] = [
  ["comprar", "Comprar"],
  ["temporada", "Temporada"],
];

/* Ordem fica na URL junto com o filtro: assim o link que a sócia manda no
   WhatsApp abre exatamente a lista que ela viu. */
const ORDENS: Record<string, { rotulo: string; cmp: (a: Imovel, b: Imovel) => number }> = {
  selecionados: {
    rotulo: "Selecionados",
    cmp: (a, b) => Number(b.destaque) - Number(a.destaque),
  },
  "preco-asc": { rotulo: "Menor preço", cmp: (a, b) => a.preco - b.preco },
  "preco-desc": { rotulo: "Maior preço", cmp: (a, b) => b.preco - a.preco },
  "area-desc": { rotulo: "Maior área", cmp: (a, b) => b.area - a.area },
};

export function Vitrine() {
  const params = useSearchParams();
  const router = useRouter();
  const regiao = params.get("regiao") as Regiao | null;
  const finalidade = params.get("finalidade") as Finalidade | null;
  const ordem = params.get("ordem") && ORDENS[params.get("ordem")!] ? params.get("ordem")! : "selecionados";

  const lista = IMOVEIS.filter(
    (im) =>
      (!regiao || im.regiao === regiao) &&
      (!finalidade || im.finalidade === finalidade),
  ).sort(ORDENS[ordem].cmp);

  /* Contagem VIVA: cada pastilha mostra quantos sobram se ela for ligada,
     considerando o outro filtro já ligado. Pastilha que levaria a zero nasce
     desabilitada, então ninguém clica para achar lista vazia. */
  function contarCom(chave: "regiao" | "finalidade", valor: string) {
    const alt = { regiao: regiao as string | null, finalidade: finalidade as string | null };
    alt[chave] = valor;
    return IMOVEIS.filter(
      (im) =>
        (!alt.regiao || im.regiao === alt.regiao) &&
        (!alt.finalidade || im.finalidade === alt.finalidade),
    ).length;
  }

  function mexer(mudanca: Record<string, string | null>) {
    const p = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(mudanca)) {
      if (v === null) p.delete(k);
      else p.set(k, v);
    }
    const q = p.toString();
    router.replace(`/imoveis${q ? `?${q}` : ""}`, { scroll: false });
  }

  const pastilha = (chave: "regiao" | "finalidade", valor: string, texto: string) => {
    const ativa = (chave === "regiao" ? regiao : finalidade) === valor;
    const n = contarCom(chave, valor);
    return (
      <button
        key={valor}
        type="button"
        onClick={() => mexer({ [chave]: ativa ? null : valor })}
        aria-pressed={ativa}
        disabled={n === 0 && !ativa}
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ouro-500",
          "disabled:cursor-not-allowed disabled:opacity-40",
          ativa
            ? "bg-azul-500 text-creme shadow-[var(--shadow-flutua-1)]"
            : "border border-azul-500/15 text-azul-500 hover:bg-azul-500/6",
        )}
      >
        {texto}
        <span className={cn("num text-xs", ativa ? "text-azul-200" : "text-neutro-500")}>
          {n}
        </span>
      </button>
    );
  };

  return (
    <>
      {/* A barra fica grudada no topo enquanto a lista rola: filtro que sai
          de vista obriga a rolar de volta para trocar de bairro. */}
      <div className="sticky top-20 z-30 mt-10">
        <div className="trilho">
          <div className="vidro-claro flex flex-wrap items-center gap-x-3 gap-y-3 rounded-[1.75rem] px-5 py-3">
            <span className="rotulo text-neutro-600">Bairro</span>
            {REGIOES.map((r) => pastilha("regiao", r, r))}
            <span className="rotulo ml-2 text-neutro-600">Finalidade</span>
            {FINALIDADES.map(([v, t]) => pastilha("finalidade", v, t))}

            <div className="ml-auto flex items-center gap-3">
              <label className="flex items-center gap-2">
                <span className="rotulo text-neutro-600">Ordem</span>
                <Select value={ordem} onValueChange={(v) => mexer({ ordem: v ?? "selecionados" })}>
                  <SelectTrigger
                    aria-label="Ordenar a lista"
                    className="h-9 rounded-full border-azul-500/15 bg-transparent px-4 text-sm font-semibold text-azul-500 shadow-none"
                  >
                    <SelectValue>{(v) => ORDENS[String(v)]?.rotulo}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ORDENS).map(([k, o]) => (
                      <SelectItem key={k} value={k}>
                        {o.rotulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              {/* `aria-live`: quem usa leitor de tela precisa ouvir que a
                  lista mudou, senão o filtro parece não ter feito nada. */}
              <span aria-live="polite" className="text-sm text-neutro-600">
                <b className="num text-azul-500">{lista.length}</b>{" "}
                {lista.length === 1 ? "imóvel" : "imóveis"}
              </span>

              {(regiao || finalidade || ordem !== "selecionados") && (
                <button
                  type="button"
                  onClick={() => router.replace("/imoveis", { scroll: false })}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-azul-500 transition-colors hover:bg-azul-500/6"
                >
                  <X className="size-3.5" aria-hidden /> Limpar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="trilho py-12">
        {lista.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {lista.map((im) => (
              <CartaoImovel key={im.codigo} im={im} />
            ))}
          </div>
        ) : (
          /* Beco sem saída não existe: quando o filtro não acha nada, a saída
             é falar com as sócias, que é o que a pessoa faria de qualquer
             jeito. Carteira curta é o normal aqui, não é erro. */
          <Painel className="mx-auto max-w-xl p-10 text-center">
            <h2 className="text-2xl">Nenhum imóvel com esses filtros</h2>
            <p className="mt-4 text-neutro-600">
              Diga o que você procura. A gente avisa quando entrar, ou procura
              fora da carteira.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => router.replace("/imoveis", { scroll: false })}
                className="rounded-full border border-azul-500/20 px-6 py-3 font-semibold text-azul-500 transition-colors hover:bg-azul-500/6"
              >
                Limpar filtros
              </button>
              <a
                href={linkZap()}
                className="inline-flex items-center gap-2 rounded-full bg-azul-500 px-6 py-3 font-semibold text-creme shadow-[var(--shadow-flutua-2)] transition-transform duration-300 hover:-translate-y-0.5"
              >
                <MessageCircle className="size-5" aria-hidden /> Dizer o que procuro
              </a>
            </div>
          </Painel>
        )}
      </div>
    </>
  );
}
