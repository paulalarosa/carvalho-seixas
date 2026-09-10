import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/* 🔴 A prévia no GitHub Pages sai FORA do índice de propósito.

   O protótipo tem imóveis, preços e depoimento de exemplo. Indexado, ele
   competiria com o site de verdade quando o domínio da cliente entrar no
   ar, e pior: alguém poderia achar um imóvel que não existe. Quando o
   domínio real for configurado em `NEXT_PUBLIC_SITE_URL`, a liberação
   volta sozinha. */
const previa = SITE.includes("github.io") || SITE.includes("localhost");

/* Com `output: export` não existe servidor para decidir nada em tempo de
   requisição: a rota tem de ser declarada estática, senão o build para. */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: previa
      ? [{ userAgent: "*", disallow: "/" }]
      : [{ userAgent: "*", allow: "/" }],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
