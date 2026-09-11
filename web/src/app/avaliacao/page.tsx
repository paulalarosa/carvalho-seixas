import Link from "next/link";
import { ClipboardCheck, MessageCircle, Ruler, ScrollText } from "lucide-react";
import { CabecaPagina } from "@/components/cabeca-pagina";
import { Painel } from "@/components/painel";
import { SOCIAS, metaDaPagina } from "@/lib/site";

export const metadata = metaDaPagina({
  titulo: "Avaliação de imóvel",
  descricao:
    "Parecer de valor assinado por avaliadora cadastrada no CNAI, no Rio de Janeiro. Para definir preço de venda, inventário, partilha e garantia bancária.",
  caminho: "/avaliacao",
});

/* Página própria porque avaliação é SERVIÇO, e serviço que só existe como
   parágrafo dentro de outra página não é encontrado nem citado. É também o
   que o CNAI habilita, e quase nenhuma imobiliária pequena mostra.

   🔴 Sem prazo e sem preço: os dois dependem do caso e de confirmação
   delas, e número inventado aqui é o tipo de coisa que vira problema
   depois de contratada. */
const QUANDO = [
  {
    titulo: "Definir o preço de venda",
    texto:
      "Anúncio caro encalha e anúncio barato deixa dinheiro na mesa. O valor sai de imóvel comparável de verdade, não de estimativa de portaria.",
  },
  {
    titulo: "Inventário e partilha",
    texto:
      "Divisão entre herdeiros e divórcio precisam de um valor defensável, porque é ele que decide quanto cada um leva.",
  },
  {
    titulo: "Garantia e financiamento",
    texto: "Quando o banco ou a outra parte exige parecer técnico assinado.",
  },
  {
    titulo: "Decisão de comprar",
    texto:
      "Antes da proposta, saber se o preço pedido está dentro do que a região pratica.",
  },
];

const COMO = [
  {
    n: "01",
    Ic: Ruler,
    titulo: "Visita técnica",
    texto:
      "Medição, estado de conservação, posição no prédio, iluminação e o que valoriza ou tira valor.",
  },
  {
    n: "02",
    Ic: ClipboardCheck,
    titulo: "Comparáveis",
    texto:
      "Levantamento de imóveis semelhantes na mesma região, com ajuste por área, andar, vaga e conservação.",
  },
  {
    n: "03",
    Ic: ScrollText,
    titulo: "Parecer assinado",
    texto:
      "Documento com metodologia, fotos e fundamentação, assinado por avaliadora com CNAI.",
  },
];

export default function PaginaAvaliacao() {
  return (
    <>
      <CabecaPagina
        titulo="Avaliação de imóvel"
        linha="Quanto vale, com parecer assinado por quem tem cadastro para assinar."
        cena="casa"
        semente="avaliacao"
        trilha={[{ href: "/", texto: "Início" }, { texto: "Avaliação" }]}
      />

      <div className="campo-luz trilho secao relative grid gap-12 lg:grid-cols-[24rem_1fr]">
        <div>
          <h2 className="text-3xl">Quem assina</h2>
          <p className="mt-4 text-neutro-600">
            As duas sócias são avaliadoras cadastradas no CNAI, e é esse cadastro
            que permite emitir parecer de valor. O número dá para conferir.
          </p>
          <div className="mt-7 space-y-3">
            {SOCIAS.map((s) => (
              <div
                key={s.sobrenome}
                className="rounded-2xl border border-azul-500/10 bg-neutro-100 px-5 py-4"
              >
                <span className="block font-display text-lg font-semibold text-azul-500">
                  {s.nome}
                </span>
                <span className="num mt-1 block text-sm text-neutro-600">
                  {s.cnai} · {s.creci}
                </span>
              </div>
            ))}
          </div>
          {/* Nem prazo nem valor na tela: os dois dependem do caso. */}
          <Painel className="mt-8 border-l-4 border-l-ouro-500 p-6">
            <b className="block font-semibold text-azul-500">
              Prazo e valor, combinados antes.
            </b>
            <span className="mt-1 block text-sm text-neutro-600">
              Dependem do tipo do imóvel e da finalidade do parecer. A gente diz
              na primeira conversa, antes de começar.
            </span>
          </Painel>
        </div>

        <div>
          <h2 className="text-3xl">Quando você precisa</h2>
          <ul className="mt-8 grid gap-x-10 gap-y-7 sm:grid-cols-2">
            {QUANDO.map((q) => (
              <li key={q.titulo} className="border-t border-azul-500/12 pt-5">
                <h3 className="font-display text-xl leading-tight">{q.titulo}</h3>
                <p className="mt-2 text-neutro-600">{q.texto}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="secao relative bg-azul-800 text-creme">
        <div className="trilho">
          <h2 className="text-[clamp(1.7rem,3vw,2.5rem)] text-creme">Como funciona</h2>
          <div className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
            {COMO.map(({ n, Ic, titulo, texto }) => (
              <div key={n} className="border-t border-white/20 pt-6">
                <span className="num text-sm text-ouro-300">{n}</span>
                <Ic className="mt-4 size-6 text-ouro-300" aria-hidden />
                <h3 className="mt-3 font-display text-xl text-creme">{titulo}</h3>
                <p className="mt-2 max-w-[34ch] text-azul-200">{texto}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="trilho secao pb-8">
        <div className="ilha relative isolate overflow-hidden bg-azul-500 text-center text-creme">
          <h2 className="text-3xl text-creme">Precisa de um valor defensável?</h2>
          <p className="mx-auto mt-4 max-w-[46ch] text-azul-200">
            Diga o imóvel e para que serve o parecer. A gente responde com prazo e
            valor antes de começar.
          </p>
          <Link
            href="/contato"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-ouro-500 px-7 py-4 font-semibold text-azul-700 shadow-[var(--shadow-flutua-2)] transition-transform duration-300 hover:-translate-y-0.5"
          >
            <MessageCircle className="size-5" aria-hidden /> Pedir uma avaliação
          </Link>
        </div>
      </div>
    </>
  );
}
