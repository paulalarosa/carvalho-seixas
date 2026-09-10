import { MessageCircle, Scale } from "lucide-react";
import { CabecaPagina } from "@/components/cabeca-pagina";
import { Painel } from "@/components/painel";
import { FormContato } from "@/components/form-contato";
import { linkZap } from "@/lib/imoveis";
import { ENDERECO, HORARIO, SOCIAS, TELEFONE } from "@/lib/site";

export const metadata = {
  title: "Falar com a gente · Carvalho & Seixas",
  description:
    "Fale direto com uma das sócias. Das 9h às 19h, de segunda a sexta.",
};

export default function PaginaContato() {
  return (
    <>
      <CabecaPagina
        titulo="Falar com a gente"
        linha="Você fala direto com uma das duas. Sem atendente e sem fila."
        trilha={[{ href: "/", texto: "Início" }, { texto: "Contato" }]}
      />

      <div className="campo-luz trilho secao relative grid gap-6 md:grid-cols-2">
        {SOCIAS.map((s) => (
          <Painel key={s.sobrenome} className="borda-viva h-full p-8">
            <div className="flex items-center gap-4">
              <span className="grid size-14 place-items-center rounded-full bg-azul-50 text-azul-500">
                <Scale className="size-6" aria-hidden />
              </span>
              <span>
                <span className="rotulo block text-ouro-texto">
                  Sócia · corretora e avaliadora
                </span>
                <span className="font-display text-2xl font-bold text-azul-500">
                  {s.nome}
                </span>
                <span className="num mt-1 block text-sm text-neutro-500">
                  {s.creci} · {s.cnai}
                </span>
              </span>
            </div>
            <p className="mt-5 text-neutro-600">{s.linha}</p>
          </Painel>
        ))}
      </div>

      {/* Canal único da empresa. Enquanto o número não existe, o painel diz
          isso: botão que abre o WhatsApp sem destinatário faz a pessoa
          acreditar que falou com alguém. */}
      <div className="trilho grid gap-6 pb-8 md:grid-cols-[1.2fr_1fr]">
        <Painel variante="claro" className="borda-viva p-8">
          <h2 className="font-display text-2xl">Um canal, as duas atendem</h2>
          {TELEFONE ? (
            <>
              <p className="mt-3 text-neutro-600">
                Mesmo número para compra, venda, temporada e avaliação.
              </p>
              <a
                href={linkZap()}
                className="mt-6 flex w-fit items-center gap-2 rounded-full bg-azul-500 px-7 py-3.5 font-semibold text-creme shadow-[var(--shadow-flutua-1)] transition-transform duration-300 hover:-translate-y-0.5"
              >
                <MessageCircle className="size-5" aria-hidden /> Falar no WhatsApp
              </a>
              <p className="num mt-4 text-neutro-600">{TELEFONE}</p>
            </>
          ) : (
            <p className="mt-3 max-w-[52ch] text-neutro-600">
              O número único da empresa está sendo definido. Até ele entrar no
              ar, o recado pelo formulário abaixo chega às duas.
            </p>
          )}
          <p className="mt-6 flex items-center gap-2 text-sm text-neutro-600">
            <span className="size-2 rounded-full bg-[#1F6B4A]" aria-hidden />
            {HORARIO}
          </p>
        </Painel>

        <Painel variante="claro" className="borda-viva p-8">
          <h2 className="font-display text-2xl">Onde ficamos</h2>
          <address className="mt-3 not-italic leading-relaxed text-neutro-600">
            {ENDERECO.rua}
            <br />
            {ENDERECO.complemento} · {ENDERECO.bairro}
            <br />
            {ENDERECO.cidade}/{ENDERECO.estado} · {ENDERECO.cep}
          </address>
        </Painel>
      </div>

      <div className="trilho pb-8">
        <h2 className="text-3xl">Ou deixe recado</h2>
        <p className="mt-3 mb-10 text-lg text-neutro-600">
          O WhatsApp é mais rápido. O formulário é para quem não usa.
        </p>
        <FormContato />
      </div>
    </>
  );
}
