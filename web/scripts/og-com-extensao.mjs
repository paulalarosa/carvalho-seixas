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
import { readdir, copyFile, stat } from "node:fs/promises";
import { join } from "node:path";

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

await varrer(RAIZ);
console.log(`imagens de compartilhamento com extensão: ${feitos}`);
