import Link from "next/link";
import {
  ArrowRight,
  DoorOpen,
  FileSearch,
  MessageCircle,
  ScrollText,
  Stamp,
} from "lucide-react";
import { CabecaPagina } from "@/components/cabeca-pagina";
import { Painel } from "@/components/painel";
import { metaDaPagina } from "@/lib/site";

export const metadata = metaDaPagina({
  titulo: "A compra, do começo ao registro",
  descricao:
    "As quatro etapas da compra de um imóvel no Rio, por quem confere a documentação antes da proposta: visita, documentação, contrato e registro. E avaliação de imóvel com avaliadora cadastrada no CNAI.",
  caminho: "/juridico",
});

/* Avaliação é serviço que se CONTRATA, não característica de imóvel, então
   tem bloco próprio e não entra na vitrine. É também o que o CNAI habilita,
   e quase nenhuma imobiliária pequena mostra isso. */
const AVALIACAO = [
  "Definir preço de venda com base em imóvel comparável, não em achismo de portaria.",
  "Inventário, divórcio e partilha, quando o valor precisa estar defensável.",
  "Garantia bancária e financiamento, quando o banco pede parecer técnico.",
];

const ETAPAS = [
  {
    n: "01",
    Ic: DoorOpen,
    titulo: "Visita e proposta",
    texto:
      "A visita é com uma das sócias. A proposta sai por escrito, nunca só por mensagem.",
  },
  {
    n: "02",
    Ic: FileSearch,
    titulo: "Levantamento de documentos",
    texto:
      "Matrícula, certidões, condomínio e IPTU. É aqui que aparece o que trava a venda, e vem antes de qualquer sinal.",
  },
  {
    n: "03",
    Ic: ScrollText,
    titulo: "Contrato",
    texto:
      "Redigido pelas sócias. Você lê com elas antes de assinar, cláusula por cláusula.",
  },
  {
    n: "04",
    Ic: Stamp,
    titulo: "Escritura e registro",
    texto: "Escritura no cartório de notas, registro no de imóveis. Só aí o imóvel é seu.",
  },
];

/* 🔴 A página era quatro caixas brancas enormes boiando no off-white, com
   muito ar e nenhuma imagem da abertura ao rodapé. As referências que a
   cliente mandou pedem o contrário: tipografia grande com interface quase
   invisível, e serviço numa faixa escura. O padrão certo já existia no
   site, na /avaliacao: etapa numerada com fio fino sobre azul. Aqui a
   página passa a usar o mesmo, e as caixas somem. */
export default function PaginaJuridico() {
  return (
    <>
      <CabecaPagina
        titulo="A compra, do começo ao registro"
        linha="Entenda o processo antes de precisar dele."
        cena="predio"
        semente="juridico"
        trilha={[{ href: "/", texto: "Início" }, { texto: "Jurídico" }]}
      />

      <div className="secao relative mt-12 bg-azul-800 text-creme">
        <div className="trilho">
          <div className="grid gap-6 lg:grid-cols-[1fr_26rem] lg:items-end">
            <h2 className="text-[clamp(1.8rem,3.4vw,2.8rem)] text-creme">
              Quatro etapas
            </h2>
            <p className="max-w-[42ch] text-azul-200">
              A compra só termina no registro. Antes disso o imóvel não é seu, e
              essa é a frase que mais economiza dinheiro.
            </p>
          </div>

          <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {ETAPAS.map(({ n, Ic, titulo, texto }) => (
              <li key={n} className="border-t border-white/20 pt-6">
                <span className="num text-sm text-ouro-300">{n}</span>
                <Ic className="mt-4 size-6 text-ouro-300" aria-hidden />
                <h3 className="mt-3 font-display text-xl text-creme">{titulo}</h3>
                <p className="mt-2 max-w-[34ch] text-azul-200">{texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="campo-luz trilho secao relative grid gap-12 lg:grid-cols-[24rem_1fr]">
        <div>
          <h2 className="text-3xl">Avaliação de imóvel</h2>
          <p className="mt-4 text-neutro-600">
            As duas são avaliadoras cadastradas no CNAI, e é isso que permite
            emitir parecer de valor. Serviço à parte da venda, com valor
            combinado antes.
          </p>
          <p className="mt-4 text-sm text-neutro-500">
            As sócias também são advogadas. É de onde vem a ordem do processo
            aqui: documento antes de proposta, e não o contrário.
          </p>
          <Link
            href="/avaliacao"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-azul-500/20 px-5 py-2.5 text-sm font-semibold text-azul-500 transition-colors hover:bg-azul-500/6"
          >
            Como funciona a avaliação <ArrowRight className="size-4" aria-hidden />
          </Link>

          {/* Prazo não vai para a tela sem regra confirmada. */}
          <Painel className="mt-8 border-l-4 border-l-ouro-500 p-6">
            <b className="block font-semibold text-azul-500">
              Prazo depende do caso.
            </b>
            <span className="mt-1 block text-sm text-neutro-600">
              Inventário, financiamento e tombamento mudam o prazo. O do seu caso
              a gente diz na primeira conversa.
            </span>
          </Painel>
        </div>

        <ul className="grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:self-start">
          {AVALIACAO.map((linha) => (
            <li key={linha} className="border-t border-azul-500/12 pt-5">
              <p className="text-[1.05rem] leading-relaxed text-neutro-600">{linha}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="trilho pb-8">
        <div className="ilha relative isolate overflow-hidden bg-azul-500 text-center text-creme">
          <h2 className="text-3xl text-creme">Dúvida sobre um caso específico?</h2>
          <p className="mx-auto mt-4 max-w-[46ch] text-azul-200">
            Manda a situação no WhatsApp. Resposta rápida é de graça, no mesmo dia.
          </p>
          <Link
            href="/contato"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-ouro-500 px-7 py-4 font-semibold text-azul-700 shadow-[var(--shadow-flutua-2)] transition-transform duration-300 hover:-translate-y-0.5"
          >
            <MessageCircle className="size-5" aria-hidden /> Falar com uma sócia
          </Link>
        </div>
      </div>
    </>
  );
}
