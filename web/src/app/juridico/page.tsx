import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { CabecaPagina } from "@/components/cabeca-pagina";
import { Painel } from "@/components/painel";

export const metadata = {
  title: "A compra, do começo ao registro · Carvalho & Seixas",
  description:
    "As quatro etapas da compra de um imóvel no Rio, por quem confere a documentação antes da proposta: visita, documentação, contrato e registro.",
};

const ETAPAS = [
  {
    n: "01",
    titulo: "Visita e proposta",
    texto:
      "A visita é com uma das sócias. A proposta sai por escrito, nunca só por mensagem.",
  },
  {
    n: "02",
    titulo: "Levantamento de documentos",
    texto:
      "Matrícula, certidões, condomínio e IPTU. É aqui que aparece o que trava a venda, e vem antes de qualquer sinal.",
  },
  {
    n: "03",
    titulo: "Contrato",
    texto:
      "Redigido pelas sócias. Você lê com elas antes de assinar, cláusula por cláusula.",
  },
  {
    n: "04",
    titulo: "Escritura e registro",
    texto:
      "Escritura no cartório de notas, registro no de imóveis. Só aí o imóvel é seu.",
  },
];

export default function PaginaJuridico() {
  return (
    <>
      <CabecaPagina
        titulo="A compra, do começo ao registro"
        linha="Entenda o processo antes de precisar dele."
        trilha={[{ href: "/", texto: "Início" }, { texto: "Jurídico" }]}
      />

      <div className="campo-luz trilho secao relative grid gap-12 lg:grid-cols-[22rem_1fr]">
        <div>
          <h2 className="text-3xl">Quatro etapas</h2>
          <p className="mt-4 text-neutro-600">
            A compra só termina no registro. Antes disso o imóvel não é seu, e essa
            é a frase que mais economiza dinheiro.
          </p>
          {/* Prazo não vai para a tela sem regra confirmada. */}
          <Painel className="mt-8 border-l-4 border-l-ouro-500 p-6">
            <b className="block font-semibold text-azul-500">
              Prazo depende do caso.
            </b>
            <span className="mt-1 block text-sm text-neutro-600">
              Inventário, financiamento e tombamento mudam o prazo. O do seu caso a
              gente diz na primeira conversa.
            </span>
          </Painel>
        </div>

        <ol className="space-y-5">
          {ETAPAS.map((e) => (
            <li key={e.n}>
              <Painel className="borda-viva flex gap-6 p-8">
                <span className="num shrink-0 rounded-full bg-azul-500 px-4 py-3 text-creme">
                  {e.n}
                </span>
                <span>
                  <h3 className="font-display text-xl">{e.titulo}</h3>
                  <p className="mt-2 text-neutro-600">{e.texto}</p>
                </span>
              </Painel>
            </li>
          ))}
        </ol>
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
