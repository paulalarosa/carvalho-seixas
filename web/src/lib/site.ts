/* Endereço público do site.

   🔴 Fica em variável de ambiente porque o domínio ainda NÃO foi decidido, e
   inventar um domínio aqui produziria link canônico errado, sitemap errado e
   imagem de compartilhamento apontando para o nada. Antes de publicar:
   `NEXT_PUBLIC_SITE_URL=https://dominio-real` no ambiente de build. */
export const SITE =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";

export const NOME = "Carvalho & Seixas Imóveis";
export const DESCRICAO =
  "Imobiliária de duas sócias no Rio, advogadas e corretoras. Compra, venda e locação no Centro, na Tijuca e na Zona Sul, com a documentação conferida antes da proposta.";
