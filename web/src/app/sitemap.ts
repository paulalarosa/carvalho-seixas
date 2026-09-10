import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { BAIRROS, IMOVEIS } from "@/lib/imoveis";

/* Sitemap derivado dos MESMOS dados que geram as páginas: entrou imóvel no
   arquivo, entrou no sitemap. Lista escrita à mão é lista que envelhece. */
/* Com `output: export` não existe servidor para decidir nada em tempo de
   requisição: a rota tem de ser declarada estática, senão o build para. */
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const agora = new Date();
  const fixas = ["", "/imoveis", "/bairros", "/juridico", "/contato"].map((r) => ({
    url: `${SITE}${r}`,
    lastModified: agora,
    changeFrequency: "monthly" as const,
    priority: r === "" ? 1 : 0.8,
  }));
  const imoveis = IMOVEIS.map((im) => ({
    url: `${SITE}/imoveis/${im.codigo}`,
    lastModified: agora,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));
  const bairros = BAIRROS.map((b) => ({
    url: `${SITE}/bairros/${encodeURIComponent(b.chave)}`,
    lastModified: agora,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  return [...fixas, ...imoveis, ...bairros];
}
