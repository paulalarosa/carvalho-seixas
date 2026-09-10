"use client";

import { useState } from "react";
import { AlertTriangle, Check, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Painel } from "@/components/painel";
import { TELEFONE } from "@/lib/site";

/* O consentimento é trava, não enfeite: sem ele marcado o envio não passa, e
   o erro aparece junto do campo. O WhatsApp continua sendo o caminho rápido;
   este formulário existe para quem não usa. */
type Erros = { nome?: string; contato?: string; consentimento?: string };

/* Validação no envio, não a cada tecla: acusar erro enquanto a pessoa ainda
   está digitando o nome é o jeito mais rápido de irritar quem quer falar
   com você. Depois do primeiro envio, o erro some assim que o campo fica
   válido, que aí sim a correção é imediata. */
function validar(nome: string, contato: string, ok: boolean): Erros {
  const e: Erros = {};
  if (nome.trim().length < 2) e.nome = "Diga como a gente te chama.";
  const digitos = contato.replace(/\D/g, "").length;
  const pareceEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contato.trim());
  if (!contato.trim()) e.contato = "Sem isto a gente não tem como responder.";
  else if (!pareceEmail && digitos < 10)
    e.contato = "Escreva um e-mail ou um WhatsApp com DDD.";
  if (!ok) e.consentimento = "Precisa autorizar o contato para a gente poder responder.";
  return e;
}

export function FormContato() {
  const [nome, setNome] = useState("");
  const [contato, setContato] = useState("");
  const [ok, setOk] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erros, setErros] = useState<Erros>({});
  const [tentou, setTentou] = useState(false);
  const [enviado, setEnviado] = useState(false);

  function revalidar(n = nome, c = contato, k = ok) {
    if (!tentou) return;
    setErros(validar(n, c, k));
  }

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setTentou(true);
    const achados = validar(nome, contato, ok);
    setErros(achados);
    if (Object.keys(achados).length) {
      /* Foco no primeiro campo com problema: sem isso, em formulário longo
         a pessoa fica olhando o botão sem entender o que faltou. */
      const alvo = document.querySelector<HTMLElement>("[aria-invalid='true']");
      alvo?.focus();
      return;
    }
    setEnviado(true);

    /* 🔴 Entregar de verdade, com o que existe. O site é estático e não há
       CRM, então não há para onde POSTAR. Mas o canal delas é WhatsApp:
       montar a mensagem e abrir a conversa entrega o recado sem servidor
       nenhum, e a pessoa só confirma no aplicativo.

       Sem número cadastrado isto não roda, e o aviso abaixo diz a verdade
       em vez de fingir envio. */
    if (TELEFONE) {
      const texto = [
        `Olá! Sou ${nome.trim()}.`,
        `Meu contato: ${contato.trim()}.`,
        mensagem.trim() ? `O que procuro: ${mensagem.trim()}` : "",
        "(enviado pelo formulário do site)",
      ]
        .filter(Boolean)
        .join("\n");
      window.open(
        `https://wa.me/${TELEFONE.replace(/\D/g, "")}?text=${encodeURIComponent(texto)}`,
        "_blank",
        "noopener,noreferrer",
      );
    }
  }

  return (
    <form onSubmit={enviar} className="flex max-w-2xl flex-col gap-6" noValidate>
      <label className="flex flex-col gap-2">
        <span className="font-semibold text-azul-500">Nome</span>
        <Input
          name="nome"
          autoComplete="name"
          value={nome}
          onChange={(e) => {
            setNome(e.target.value);
            revalidar(e.target.value);
          }}
          aria-invalid={!!erros.nome}
          aria-describedby={erros.nome ? "erro-nome" : undefined}
          className="rounded-2xl"
        />
        {erros.nome && (
          <span id="erro-nome" className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="size-4" aria-hidden /> {erros.nome}
          </span>
        )}
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-semibold text-azul-500">WhatsApp ou e-mail</span>
        <Input
          name="contato"
          inputMode="text"
          autoComplete="tel email"
          value={contato}
          onChange={(e) => {
            setContato(e.target.value);
            revalidar(undefined, e.target.value);
          }}
          aria-invalid={!!erros.contato}
          aria-describedby={erros.contato ? "erro-contato" : "dica-contato"}
          className="rounded-2xl"
        />
        {erros.contato ? (
          <span id="erro-contato" className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="size-4" aria-hidden /> {erros.contato}
          </span>
        ) : (
          <span id="dica-contato" className="text-sm text-neutro-600">
            É por aqui que a gente responde.
          </span>
        )}
      </label>

      <label className="flex flex-col gap-2">
        <span className="font-semibold text-azul-500">
          O que você procura{" "}
          <span className="font-normal text-neutro-500">· opcional</span>
        </span>
        <Textarea
          name="mensagem"
          rows={4}
          className="rounded-2xl"
          placeholder="Bairro, número de quartos, faixa de valor, prazo."
          value={mensagem}
          onChange={(e) => setMensagem(e.target.value)}
        />
      </label>

      <label className="flex cursor-pointer items-start gap-3 text-sm text-neutro-600">
        <Checkbox
          checked={ok}
          onCheckedChange={(v) => {
            setOk(v === true);
            revalidar(undefined, undefined, v === true);
          }}
          aria-invalid={!!erros.consentimento}
          className="mt-0.5"
        />
        <span>
          Autorizo o contato sobre este pedido. Os dados são usados só para
          responder, não vão para lista de disparo e podem ser apagados quando eu
          pedir.
        </span>
      </label>

      {erros.consentimento && (
        <p className="flex items-center gap-2 text-sm text-destructive" role="alert">
          <AlertTriangle className="size-4" aria-hidden />
          {erros.consentimento}
        </p>
      )}

      <Painel className="flex gap-3 border-l-4 border-l-ouro-500 p-5 text-sm">
        <ShieldCheck className="size-5 shrink-0 text-ouro-texto" aria-hidden />
        <span>
          <b className="block text-azul-500">Não peça documento por aqui.</b>
          Comprovante de renda, RG e certidão a gente recebe em canal próprio, no
          momento certo do processo.
        </span>
      </Painel>

      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-full bg-azul-500 px-7 py-3.5 font-semibold text-creme shadow-[var(--shadow-flutua-2)] transition-transform duration-300 hover:-translate-y-0.5"
        >
          Enviar recado
        </button>
      </div>

      {enviado && (
        <p
          className="flex items-center gap-3 rounded-2xl bg-azul-500 px-5 py-4 text-creme"
          role="status"
          aria-live="polite"
        >
          <Check className="size-5 text-ouro-300" aria-hidden />
          {TELEFONE
            ? "Recado pronto no WhatsApp. Confirme o envio na conversa que abriu."
            : "Recado montado. Falta o número único da empresa entrar no ar para ele ser entregue."}
        </p>
      )}
    </form>
  );
}
