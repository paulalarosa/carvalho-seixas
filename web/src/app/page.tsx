import Link from "next/link";
import { ArrowRight, MessageCircle, Quote } from "lucide-react";
import { PredioScroll } from "@/components/predio-scroll";
import { Busca } from "@/components/busca";
import { CartaoImovel } from "@/components/cartao-imovel";
import { Painel } from "@/components/painel";
import { Cena } from "@/components/cenas";
import { Midia } from "@/components/midia";
import { EntradaAbertura, Revela } from "@/components/entrada";
import { IMOVEIS, BAIRROS, IMOVEIS as TODOS } from "@/lib/imoveis";
import { SOCIAS } from "@/lib/site";

const FATOS = [
  {
    n: "01",
    titulo: "Você lê a matrícula antes de fazer proposta",
    texto: "Certidões, dívida de condomínio e IPTU conferidos antes de qualquer sinal.",
  },
  {
    n: "02",
    titulo: "Quem te atende assina o contrato",
    texto: "As duas têm CRECI e CNAI. Você não é passado para outro setor.",
  },
  {
    n: "03",
    titulo: "A resposta chega no mesmo dia",
    texto: "No WhatsApp da Carvalho ou da Seixas. Sem atendente e sem fila.",
  },
];

export default function Home() {
  const destaques = IMOVEIS.filter((im) => im.destaque);

  return (
    <>
      {/* ===================================================== ABERTURA
          Sequência de rolagem: o prédio de fora, a parede do apartamento
          girando, e a câmera entrando na sala. O painel de vidro só existe
          porque tem cidade atrás dele para refratar. */}
      <PredioScroll>
        <EntradaAbertura>
          <Painel variante="escuro" className="max-w-3xl rounded-[2.5rem] p-8 sm:p-12">
            <h1
              data-entra="titulo"
              className="max-w-[19ch] font-display text-[clamp(1.9rem,min(5.2vw,6.4svh),4.25rem)] leading-[1.03] text-creme"
            >
              Quem mostra o imóvel é quem lê a matrícula.
            </h1>
            <p
              data-entra="linha"
              className="mt-4 max-w-[46ch] text-base leading-relaxed text-azul-200 sm:mt-6 sm:text-lg"
            >
              Duas sócias <b className="font-semibold text-creme">corretoras e
              avaliadoras</b>. A mesma pessoa cuida da visita, da papelada e do
              contrato.
            </p>
            <p
              data-entra="frentes"
              className="rotulo mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/18 pt-4 text-azul-200 sm:mt-8 sm:pt-6"
            >
              <b className="text-creme">{IMOVEIS.length} imóveis</b>
              <b className="text-creme">Centro</b>
              <b className="text-creme">Tijuca</b>
              <b className="text-creme">Zona Sul</b>
            </p>
          </Painel>

          <div data-entra="busca" className="mt-4 max-w-3xl sm:mt-6">
            <Busca />
          </div>
        </EntradaAbertura>
      </PredioScroll>

      {/* ======================================================== FATOS */}
      <Revela className="campo-luz trilho secao-alta relative">
        <h2 className="max-w-[22ch] text-[clamp(1.8rem,3.4vw,2.75rem)]">
          O que acontece antes de você assinar
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {FATOS.map((f) => (
            <Painel
              key={f.n}
              data-revela
              className="borda-viva flex h-full flex-col gap-4 p-8"
            >
              <span className="num text-sm text-ouro-texto">{f.n}</span>
              <h3 className="font-display text-xl leading-tight">{f.titulo}</h3>
              <p className="text-neutro-600">{f.texto}</p>
            </Painel>
          ))}
        </div>
      </Revela>

      {/* ==================================================== DESTAQUES */}
      <Revela className="trilho secao">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-[clamp(1.8rem,3.4vw,2.75rem)]">Imóveis em destaque</h2>
            <p className="mt-3 text-lg text-neutro-600">
              Escolhidos por elas, com documentação conferida.
            </p>
          </div>
          <Link
            href="/imoveis"
            className="inline-flex items-center gap-2 rounded-full border border-azul-500/15 px-5 py-2.5 text-sm font-semibold text-azul-500 transition-colors hover:bg-azul-500/6"
          >
            Ver os {IMOVEIS.length} imóveis
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div data-revela>
            <CartaoImovel im={destaques[0]} variante="largo" />
          </div>
          <div className="grid gap-6">
            {destaques.slice(1, 3).map((im) => (
              <div key={im.codigo} data-revela className="h-full">
                <CartaoImovel im={im} variante="fila" />
              </div>
            ))}
          </div>
        </div>
      </Revela>

      {/* ====================================================== BAIRROS */}
      <Revela className="trilho secao">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-[clamp(1.8rem,3.4vw,2.75rem)]">Onde a gente atua</h2>
            <p className="mt-3 text-lg text-neutro-600">
              Três mercados diferentes, três contas diferentes.
            </p>
          </div>
          <Link
            href="/bairros"
            className="inline-flex items-center gap-2 rounded-full border border-azul-500/15 px-5 py-2.5 text-sm font-semibold text-azul-500 transition-colors hover:bg-azul-500/6"
          >
            Ver a rua em 3D
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {BAIRROS.map((b) => {
            const n = TODOS.filter((im) => im.regiao === b.chave).length;
            return (
              <Link
                key={b.chave}
                href={`/bairros/${encodeURIComponent(b.chave)}`}
                data-revela
                className="group relative isolate flex min-h-[24rem] flex-col justify-end overflow-hidden rounded-[2rem] p-6 shadow-[var(--shadow-flutua-2)] transition-transform duration-500 ease-[var(--ease-saida)] hover:-translate-y-1.5"
              >
                <Cena
                  nome={b.cena}
                  rotulo={`Ilustração da marca: ${b.nome}`}
                  className="absolute inset-0 -z-20 size-full object-cover transition-transform duration-700 ease-[var(--ease-saida)] group-hover:scale-105"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 -z-10 bg-gradient-to-t from-azul-900/85 via-azul-900/25 to-transparent"
                />
                <div className="tinta rounded-[1.5rem] p-5">
                  <h3 className="font-display text-2xl font-bold text-creme">
                    {b.nome}
                  </h3>
                  <span className="num mt-1 block text-sm text-ouro-300">
                    {n} {n === 1 ? "imóvel" : "imóveis"}
                  </span>
                  <p className="mt-3 text-sm text-azul-200">{b.linha}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </Revela>

      {/* ======================================================== SPLIT */}
      <Revela className="trilho secao">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.05fr]">
          <div data-revela>
            <h2 className="text-[clamp(1.8rem,3.4vw,2.75rem)]">
              O problema quase nunca aparece na visita. Aparece na matrícula.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-neutro-600">
              O que trava uma compra não se vê andando pelo apartamento:
              </p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {[
                  "Inventário em aberto",
                  "Penhora na matrícula",
                  "Dívida de condomínio",
                  "Obra sem averbação",
                ].map((r) => (
                  <li
                    key={r}
                    className="rounded-full border border-azul-500/15 bg-white px-4 py-2 text-sm font-semibold text-azul-500"
                  >
                    {r}
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-lg leading-relaxed text-neutro-600">
                A gente levanta tudo isso antes da proposta. Quem descobre depois
                perde o sinal, e às vezes o imóvel.
              </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/juridico"
                className="inline-flex items-center gap-2 rounded-full bg-azul-500 px-6 py-3 font-semibold text-creme shadow-[var(--shadow-flutua-2)] transition-transform duration-300 hover:-translate-y-0.5"
              >
                Ver as 4 etapas
              </Link>
              <Link
                href="/contato"
                className="inline-flex items-center gap-2 rounded-full border border-azul-500/20 px-6 py-3 font-semibold text-azul-500 transition-colors hover:bg-azul-500/6"
              >
                Tirar uma dúvida
              </Link>
            </div>
          </div>
          <div
            data-revela
            className="relative aspect-[16/11] overflow-hidden rounded-[2.5rem] shadow-[var(--shadow-flutua-3)]"
          >
            <Midia
              cena="interior"
              rotulo="Ilustração da marca: sala com janela"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </Revela>

      {/* =================================================== DEPOIMENTO */}
      <Revela className="trilho secao">
        <div
          data-revela
          className="ilha relative isolate overflow-hidden bg-azul-500"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(40% 60% at 15% 10%, rgba(201,162,76,.28), transparent 70%), radial-gradient(45% 65% at 85% 90%, rgba(118,148,189,.3), transparent 72%)",
            }}
          />
          <figure className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:items-end">
            <div>
              <Quote className="mb-6 size-10 text-ouro-400" aria-hidden />
              <blockquote className="font-display text-[clamp(1.5rem,2.9vw,2.35rem)] font-semibold leading-tight text-creme">
                Comprei sem entender nada de escritura. Elas explicaram o que eu
                estava assinando, linha por linha.
              </blockquote>
            </div>
            <figcaption className="border-t border-white/20 pt-5 text-sm text-azul-200">
              Depoimento de cliente. Nome e foto entram quando ela autorizar.
            </figcaption>
          </figure>
        </div>
      </Revela>

      {/* ======================================================= SÓCIAS */}
      <Revela className="campo-luz trilho secao relative">
        <h2 className="text-[clamp(1.8rem,3.4vw,2.75rem)]">Quem atende você</h2>
        <p className="mt-3 text-lg text-neutro-600">
          Você fala direto com uma das duas.
        </p>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1fr_.85fr]">
          {SOCIAS.map((s) => (
            <div
              key={s.nome}
              data-revela
              className="flex flex-col gap-5"
            >
              {/* Retrato que ainda não existe: painel com a inicial e a
                  especificação da foto que falta. Foto de banco no lugar de
                  uma sócia seria a mentira mais fácil de perceber. */}
              <div className="relative isolate flex aspect-4/5 items-center justify-center overflow-hidden rounded-[2rem] bg-azul-500 shadow-[var(--shadow-flutua-2)]">
                <span
                  aria-hidden
                  className="font-display text-[9rem] font-bold leading-none text-creme/15"
                >
                  {s.inicial}
                </span>
                <span className="rotulo absolute inset-x-6 bottom-6 border-t border-white/20 pt-4 text-ouro-300">
                  Retrato da sócia entra aqui · foto vertical 4:5
                </span>
              </div>
              <div>
                <span className="rotulo block text-ouro-texto">
                  Sócia · corretora e avaliadora
                </span>
                <span className="font-display text-3xl font-bold text-azul-500">
                  {s.nome}
                </span>
                <span className="num mt-2 block text-sm text-neutro-500">
                  {s.creci} · {s.cnai}
                </span>
              </div>
              <p className="text-neutro-600">{s.linha}</p>
              <Link
                href="/contato"
                className="inline-flex w-fit items-center gap-2 rounded-full border border-azul-500/20 px-5 py-2.5 text-sm font-semibold text-azul-500 transition-colors hover:bg-azul-500/6"
              >
                <MessageCircle className="size-4" aria-hidden />
                Falar com a {s.sobrenome}
              </Link>
            </div>
          ))}

          <Painel data-revela className="h-fit p-8">
            <h3 className="font-display text-xl">Registro profissional</h3>
            <p className="mt-3 text-neutro-600">
              Número dá para conferir no conselho. Selo desenhado, não.
            </p>
            <div className="mt-6 space-y-3">
              {SOCIAS.map((s) => (
                <div
                  key={s.sobrenome}
                  className="rounded-2xl border border-azul-500/10 bg-neutro-100 px-4 py-3"
                >
                  <span className="rotulo text-neutro-600">{s.sobrenome}</span>
                  <span className="num mt-1 block text-sm text-neutro-500">
                    {s.creci}
                  </span>
                  <span className="num block text-sm text-neutro-500">
                    {s.cnai}
                  </span>
                </div>
              ))}
            </div>
          </Painel>
        </div>
      </Revela>

      {/* ====================================================== CHAMADA */}
      <Revela className="trilho secao">
        <div
          data-revela
          className="ilha relative isolate overflow-hidden bg-azul-700 text-creme"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(45% 70% at 80% 20%, rgba(201,162,76,.3), transparent 70%), radial-gradient(50% 70% at 10% 90%, rgba(118,148,189,.28), transparent 72%)",
            }}
          />
          <div className="grid items-end gap-10 lg:grid-cols-[1fr_auto]">
            <div>
              <h2 className="max-w-[24ch] text-[clamp(1.9rem,4vw,3rem)] text-creme">
                Diga o bairro, os quartos e o valor.
              </h2>
              <p className="mt-5 max-w-[46ch] text-azul-200">
                Resposta no mesmo dia, com o que temos e com o que não temos.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/contato"
                className="inline-flex items-center gap-2 rounded-full bg-ouro-500 px-7 py-4 font-semibold text-azul-700 shadow-[var(--shadow-flutua-2)] transition-transform duration-300 hover:-translate-y-0.5 hover:bg-ouro-400"
              >
                <MessageCircle className="size-5" aria-hidden />
                Falar no WhatsApp
              </Link>
              <Link
                href="/imoveis"
                className="vidro inline-flex items-center gap-2 rounded-full px-7 py-4 font-semibold text-creme transition-transform duration-300 hover:-translate-y-0.5"
              >
                Ver os imóveis
              </Link>
            </div>
          </div>
        </div>
      </Revela>
    </>
  );
}
