import type { Metadata } from "next";
import { Josefin_Sans, Source_Sans_3, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Topo } from "@/components/topo";
import { Rodape } from "@/components/rodape";
import { SpriteCenas } from "@/components/cenas";
import { SITE, NOME, DESCRICAO, ENDERECO, SOCIAS } from "@/lib/site";

/* Josefin Sans é a fonte do logo, medida no arquivo `.ai`: o nome está em
   700 e a palavra "Imóveis" em 600, com entreletra zero. Source Sans 3 é o
   corpo, e o IBM Plex Mono só aparece em número. */
const josefin = Josefin_Sans({
  variable: "--font-josefin",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const source = Source_Sans_3({
  variable: "--font-source",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

const plex = IBM_Plex_Mono({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["500"],
  display: "swap",
});

export const metadata: Metadata = {
  /* `metadataBase` é o que faz link canônico, sitemap e imagem de
     compartilhamento saírem com endereço absoluto. Sem ele o build reclama
     de caminho relativo, e com domínio inventado sairia tudo errado. */
  metadataBase: new URL(SITE),
  title: {
    default: `${NOME} · Rio de Janeiro`,
    template: `%s · ${NOME}`,
  },
  description: DESCRICAO,
  alternates: { canonical: "/" },
  openGraph: {
    title: NOME,
    description:
      "Quem mostra o imóvel é quem lê a matrícula. Centro, Tijuca e Zona Sul.",
    url: "/",
    siteName: NOME,
    locale: "pt_BR",
    type: "website",
  },
  robots: { index: true, follow: true },
};

/* Dados estruturados da imobiliária. É o que faz a busca entender que aqui
   tem um negócio, com área de atuação e não só páginas de texto.

   🔴 `telephone`, `address` e os registros NÃO entram enquanto não vierem da
   cliente: dado estruturado errado é pior que dado ausente, porque a busca
   passa a mostrar o errado com confiança. */
const DADOS = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  name: NOME,
  description: DESCRICAO,
  url: SITE,
  areaServed: [
    { "@type": "Place", name: "Centro, Rio de Janeiro" },
    { "@type": "Place", name: "Tijuca, Rio de Janeiro" },
    { "@type": "Place", name: "Zona Sul, Rio de Janeiro" },
  ],
  address: {
    "@type": "PostalAddress",
    streetAddress: `${ENDERECO.rua}, ${ENDERECO.complemento}`,
    addressLocality: ENDERECO.cidade,
    addressRegion: ENDERECO.estado,
    postalCode: ENDERECO.cep,
    addressCountry: "BR",
  },
  /* Cada sócia com o registro que dá para conferir no conselho. É o campo
     que a busca usa para casar o negócio com a pessoa. */
  employee: SOCIAS.map((s) => ({
    "@type": "RealEstateAgent",
    name: s.nome,
    identifier: [s.creci, s.cnai],
  })),
  knowsLanguage: "pt-BR",
  slogan: "Aqui seu sonho vira patrimônio.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${josefin.variable} ${source.variable} ${plex.variable} h-full antialiased grao`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(DADOS).replace(/</g, "\u003c"),
          }}
        />
        <SpriteCenas />
        <Topo />
        <main id="conteudo" className="flex-1">
          {children}
        </main>
        <Rodape />
      </body>
    </html>
  );
}
