import type { NextConfig } from "next";

/* Publicação no GitHub Pages.

   Pages serve ARQUIVO ESTÁTICO: não existe servidor Node, então o site sai
   por `output: "export"`. Duas consequências que precisam de configuração:

   1. o otimizador de imagem do Next roda no servidor, e sem servidor ele
      não existe. `unoptimized` faz o `<Image>` servir o arquivo direto,
      mantendo `sizes` e `loading` (que são do navegador);
   2. página de projeto mora em `usuario.github.io/REPO`, então todo caminho
      absoluto precisa do prefixo do repositório. Vem por variável de
      ambiente para o desenvolvimento continuar na raiz.

   `NEXT_PUBLIC_BASE_PATH` é definido no fluxo de publicação. */
const prefixo = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath: prefixo,
  assetPrefix: prefixo || undefined,
  images: { unoptimized: true },
  // Pages não faz reescrita de URL: com barra no fim, cada rota vira uma
  // pasta com `index.html` e o link direto funciona sem servidor.
  trailingSlash: true,
};

export default nextConfig;
