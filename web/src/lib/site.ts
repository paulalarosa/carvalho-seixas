/* Endereço público do site.

   🔴 Fica em variável de ambiente porque o domínio ainda NÃO foi decidido, e
   inventar um domínio aqui produziria link canônico errado, sitemap errado e
   imagem de compartilhamento apontando para o nada. Antes de publicar:
   `NEXT_PUBLIC_SITE_URL=https://dominio-real` no ambiente de build. */
export const SITE =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";

export const NOME = "Carvalho & Seixas Imóveis";
export const DESCRICAO =
  "Imobiliária de duas sócias no Rio, corretoras com CRECI e avaliadoras com CNAI. Compra, venda e locação no Centro, na Tijuca e na Zona Sul, com a documentação conferida antes da proposta.";

/* As sócias, com registro conferível.

   🔴 CPF NÃO ENTRA AQUI. Ela mandou os dois CPFs para o contrato, e
   contrato é uma coisa, página indexada é outra: CPF em site público é
   dado pessoal exposto sem necessidade nenhuma, porque não é ele que prova
   habilitação. Quem prova é o CRECI, que qualquer pessoa confere no site
   do conselho, e o CNAI, que é o cadastro de avaliadora. */
export const SOCIAS = [
  {
    inicial: "C",
    sobrenome: "Carvalho",
    nome: "Débora de Almeida Carvalho",
    creci: "CRECI/RJ 92.984",
    cnai: "CNAI 53.073",
    linha: "Tijuca e Grajaú. Cuida dos contratos.",
  },
  {
    inicial: "S",
    sobrenome: "Seixas",
    nome: "Alessandra Soverchi de Seixas",
    creci: "CRECI/RJ 92.989",
    cnai: "CNAI 53.072",
    linha: "Centro e Zona Sul. Cuida da temporada.",
  },
] as const;

/* Endereço do escritório. Uma linha só, porque é assim que se lê num
   rodapé, e desmembrado para o JSON-LD, que é o que a busca local usa. */
export const ENDERECO = {
  rua: "Av. Franklin Roosevelt, 39",
  complemento: "sala 1402",
  bairro: "Centro",
  cidade: "Rio de Janeiro",
  estado: "RJ",
  cep: "20021-120",
  linha: "Av. Franklin Roosevelt, 39 · sala 1402 · Centro · Rio de Janeiro/RJ · 20021-120",
};
