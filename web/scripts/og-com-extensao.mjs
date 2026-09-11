/* Dá extensão .png às imagens de compartilhamento geradas.

   🔴 O Next exporta a rota de imagem como um arquivo SEM EXTENSÃO
   (`out/imoveis/CS-0142/opengraph-image`). Hospedagem estática decide o
   tipo do conteúdo pela extensão: no GitHub Pages esse arquivo sai como
   `application/octet-stream`, e WhatsApp, LinkedIn e Facebook descartam
   imagem que não vem como imagem. O cartão do imóvel simplesmente não
   apareceria.

   Aqui cada arquivo ganha uma cópia com `.png`, e o endereço com extensão
   é o que as páginas declaram no metadado. Roda depois do build, junto
   dele, para não depender de ninguém lembrar. */
import { readdir, copyFile, stat, readFile } from "node:fs/promises";
import { join } from "node:path";
import { regioesAtendidas } from "./regioes.mjs";

/* 🔴 O cartão da marca é uma IMAGEM, e imagem não compila: quando o Grajaú
   entrou nas regiões atendidas, o cartão continuou dizendo três regiões e o
   build passou feliz. O carimbo que `cartao-marca.mjs` deixa é conferido
   aqui, para o build parar em vez de publicar a arte velha. */
async function conferirCartao() {
  const esperado = (await regioesAtendidas()).join(" · ");
  const carimbo = await readFile("scripts/cartao-marca.carimbo", "utf8").catch(
    () => "",
  );
  if (carimbo.trim() !== esperado) {
    throw new Error(
      `O cartão da marca está desatualizado.\n` +
        `  desenhado: ${carimbo.trim() || "(sem carimbo)"}\n` +
        `  atual:     ${esperado}\n` +
        `  conserto:  node scripts/cartao-marca.mjs`,
    );
  }
}

const RAIZ = "out";
let feitos = 0;

async function varrer(dir) {
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const caminho = join(dir, item.name);
    if (item.isDirectory()) {
      await varrer(caminho);
    } else if (item.name === "opengraph-image" || item.name === "twitter-image") {
      const info = await stat(caminho);
      if (info.size > 0) {
        await copyFile(caminho, `${caminho}.png`);
        feitos++;
      }
    }
  }
}

await conferirCartao();
await varrer(RAIZ);
console.log(`imagens de compartilhamento com extensão: ${feitos}`);
