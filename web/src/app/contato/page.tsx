import { MessageCircle } from "lucide-react";
import { CabecaPagina } from "@/components/cabeca-pagina";
import { Painel } from "@/components/painel";
import { Midia } from "@/components/midia";
import { FormContato } from "@/components/form-contato";
import { linkZap } from "@/lib/imoveis";
import { ENDERECO, HORARIO, SOCIAS, TELEFONE, metaDaPagina } from "@/lib/site";

export const metadata = metaDaPagina({
  titulo: "Falar com a gente",
  descricao:
    "Fale direto com uma das sócias, no WhatsApp único da empresa. Das 9h às 19h, de segunda a sexta, no Centro do Rio.",
  caminho: "/contato",
});

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
              {/* 🔴 Era a BALANÇA da justiça, embaixo de um rótulo que diz
                  "corretora e avaliadora": o ícone contradizia o rótulo e
                  dizia escritório de advocacia, que é o que a cliente pediu
                  para não enfatizar. Monograma diz a pessoa, e não a
                  profissão errada. */}
              <span className="grid size-14 shrink-0 place-items-center rounded-full bg-azul-50 font-display text-2xl font-bold text-azul-500">
                {s.inicial}
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
      <div className="trilho pb-8">
        {/* Painel largo com parágrafo curto deixava a direita vazia de novo:
            o horário sobe para a mesma linha, na ponta. */}
        <Painel
          variante="claro"
          className="borda-viva grid gap-6 p-8 md:grid-cols-[1fr_auto] md:items-center"
        >
          <div>
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
                O número único da empresa está sendo definido. Até ele entrar
                no ar, o recado pelo formulário abaixo chega às duas.
              </p>
            )}
          </div>
          <p className="flex items-center gap-2 text-sm text-neutro-600 md:justify-self-end">
            <span className="size-2 rounded-full bg-[#1F6B4A]" aria-hidden />
            {HORARIO}
          </p>
        </Painel>
      </div>

      {/* 🔴 O formulário ocupava uma coluna e a METADE DIREITA da página
          ficava vazia até o rodapé. Agora o escritório ocupa esse lado, com
          o endereço dentro da imagem, que é o padrão da ficha do imóvel. */}
      <div className="trilho secao grid gap-12 pb-8 lg:grid-cols-[1.15fr_1fr] lg:items-start">
        <div>
          <h2 className="text-3xl">Ou deixe recado</h2>
          <p className="mt-3 mb-10 text-lg text-neutro-600">
            O WhatsApp é mais rápido. O formulário é para quem não usa.
          </p>
          <FormContato />
        </div>

        <aside className="lg:sticky lg:top-28">
          <div className="relative isolate flex min-h-[22rem] flex-col justify-end overflow-hidden rounded-[2rem] p-7 shadow-[var(--shadow-flutua-3)]">
            <div aria-hidden className="absolute inset-0 -z-20">
              <Midia
                cena="predio"
                semente="escritorio-centro"
                rotulo="Ilustração da marca: o escritório no Centro"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10"
              style={{
                background:
                  "linear-gradient(to top, rgba(9,22,42,.92) 12%, rgba(9,22,42,.5) 52%, rgba(9,22,42,.1) 100%)",
              }}
            />
            <span className="rotulo text-ouro-300">Onde ficamos</span>
            <address className="mt-2 not-italic text-[1.15rem] leading-relaxed text-creme">
              {ENDERECO.rua}
              <br />
              {ENDERECO.complemento} · {ENDERECO.bairro}
              <br />
              {ENDERECO.cidade}/{ENDERECO.estado} · {ENDERECO.cep}
            </address>
          </div>
        </aside>
      </div>
    </>
  );
}
