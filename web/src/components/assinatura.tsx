import { cn } from "@/lib/utils";

/* A assinatura, medida no arquivo `.ai` da marca.

   O arquivo traz DOIS lockups oficiais, e os dois valem:

   EMPILHADO (principal, o que a Paula escolheu)
     "Carvalho" / "& Seixas" / "Imóveis", alinhados à esquerda ao lado do
     símbolo. Medidas do `.ai`, em múltiplos do tamanho de "Carvalho":
       · "Seixas" é 1,081 maior que "Carvalho" (36,0 sobre 33,3, e 41,14
         sobre 38,05 na outra instância: a proporção se repete);
       · "Imóveis" é 0,72;
       · a linha 2 desce 1,297 e "Imóveis" desce mais 1,171.

   EM LINHA (reduzido, para barra estreita)
     "Carvalho & Seixas" seguido de "Imóveis" com 0,325em de espaço.

   🔴 O 0,325em é ESPAÇO ENTRE AS PALAVRAS, não entreletra. Eu tinha aplicado
   como `letter-spacing` e em caixa alta, e nenhuma das duas coisas está no
   arquivo: no original "Imóveis" é caixa baixa e tem entreletra zero.

   O ouro aqui é o ouro da marca, não o `ouro-texto`: isto é a marca, não
   texto corrido. A regra de contraste de texto pequeno continua valendo
   para todo o resto da página. */

type Cores = { nome?: string; categoria?: string };

export function Assinatura({
  className,
  cores,
}: {
  className?: string;
  cores?: Cores;
}) {
  const nome = cores?.nome ?? "text-azul-500";
  const categoria = cores?.categoria ?? "text-ouro-500";
  return (
    <span className={cn("inline-flex flex-col font-display leading-none", className)}>
      <span className={cn("font-bold tracking-[-0.01em]", nome)}>Carvalho</span>
      <span className={cn("font-bold tracking-[-0.01em] mt-[0.297em]", nome)}>
        &amp; <span style={{ fontSize: "1.081em" }}>Seixas</span>
      </span>
      <span
        className={cn("mt-[0.24em] font-semibold", categoria)}
        style={{ fontSize: "0.72em" }}
      >
        Imóveis
      </span>
    </span>
  );
}

/** Versão em linha, para a barra do topo e outros lugares de pouca altura. */
export function AssinaturaLinha({
  className,
  cores,
}: {
  className?: string;
  cores?: Cores;
}) {
  const nome = cores?.nome ?? "text-azul-500";
  const categoria = cores?.categoria ?? "text-ouro-500";
  return (
    <span className={cn("inline-flex items-baseline font-display leading-none", className)}>
      <span className={cn("font-bold tracking-[-0.01em]", nome)}>Carvalho &amp; Seixas</span>
      <span
        className={cn("ml-[0.325em] font-semibold", categoria)}
        style={{ fontSize: "0.72em" }}
      >
        Imóveis
      </span>
    </span>
  );
}
