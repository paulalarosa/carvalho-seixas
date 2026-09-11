/* As regiões atendidas, lidas de `BAIRROS` em `src/lib/imoveis.ts`, na ordem
   em que ele as declara. Fica num módulo só porque duas coisas precisam da
   mesma lista sem se falarem: quem DESENHA o cartão da marca e quem CONFERE,
   no build, se o cartão desenhado ainda corresponde. */
import { readFile } from "node:fs/promises";

export async function regioesAtendidas() {
  const fonte = await readFile("src/lib/imoveis.ts", "utf8");
  const lista = [...fonte.matchAll(/^\s{4}chave: "([^"]+)",/gm)].map((m) => m[1]);
  if (lista.length < 2) throw new Error("não achei as regiões em BAIRROS");
  return lista;
}
