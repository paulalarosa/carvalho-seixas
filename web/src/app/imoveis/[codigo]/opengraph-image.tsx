import { ImageResponse } from "next/og";
import { IMOVEIS, moeda } from "@/lib/imoveis";
import { MARCA } from "@/lib/site";

/* Imagem de compartilhamento POR IMÓVEL.

   Antes todo link do site compartilhava a mesma arte, então mandar um
   apartamento no WhatsApp mostrava o cartão genérico da imobiliária: quem
   recebia não sabia qual imóvel era antes de abrir. Como corretora
   trabalha mandando link, essa é a peça que mais aparece fora do site.

   Sai no build, uma por imóvel, porque a exportação é estática. Sem fonte
   embutida de propósito: `ImageResponse` precisaria do arquivo da fonte, e
   o desenho aguenta bem a sans do sistema, com a marca vindo do bloco de
   cor e do fio dourado. */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Imóvel na Carvalho & Seixas Imóveis";

export function generateStaticParams() {
  return IMOVEIS.map((im) => ({ codigo: im.codigo }));
}

export default async function Imagem({ params }: PageProps<"/imoveis/[codigo]">) {
  const { codigo } = await params;
  const im = IMOVEIS.find((x) => x.codigo === codigo);

  const AZUL = "#163864";
  const CREME = "#F3EFE4";
  const OURO = "#C9A24C";

  const ficha = im
    ? [
        `${im.area} m²`,
        im.quartos ? `${im.quartos} ${im.quartos === 1 ? "quarto" : "quartos"}` : null,
        im.suites ? `${im.suites} ${im.suites === 1 ? "suíte" : "suítes"}` : null,
        im.vagas ? `${im.vagas} ${im.vagas === 1 ? "vaga" : "vagas"}` : null,
      ].filter(Boolean)
    : [];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: AZUL,
          padding: 72,
          color: CREME,
          fontSize: 32,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 56, height: 8, background: OURO }} />
          <div style={{ display: "flex", fontSize: 26, letterSpacing: 4, textTransform: "uppercase" }}>
            {im ? `${im.bairro} · ${im.codigo}` : MARCA}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", fontSize: 74, lineHeight: 1.05, fontWeight: 700, maxWidth: 980 }}>
            {im ? im.titulo : "Quem mostra o imóvel é quem lê a matrícula."}
          </div>
          {im && (
            <div style={{ display: "flex", alignItems: "baseline", gap: 26 }}>
              {/* 🔴 Texto montado ANTES: o Satori exige `display` explícito em
                  div com mais de um filho, e duas expressões seguidas viram
                  dois nós de texto. O build inteiro para por causa disso. */}
              <div style={{ display: "flex", fontSize: 58, fontWeight: 700, color: OURO }}>
                {`${moeda(im.preco)}${im.porNoite ? " / noite" : ""}`}
              </div>
              <div style={{ display: "flex", fontSize: 30, opacity: 0.82 }}>{ficha.join(" · ")}</div>
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            borderTop: `2px solid rgba(243,239,228,.24)`,
            paddingTop: 26,
          }}
        >
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700 }}>{MARCA} Imóveis</div>
          <div style={{ display: "flex", fontSize: 26, opacity: 0.78 }}>
            Documentação conferida antes da proposta
          </div>
        </div>
      </div>
    ),
    size,
  );
}
