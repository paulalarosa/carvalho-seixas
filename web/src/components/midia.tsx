import Image from "next/image";
import { Cena, type NomeCena } from "@/components/cenas";

/* O ENCAIXE. Proporção e recorte moram no elemento que envolve; aqui mora só
   a decisão entre fotografia e ilustração da marca.

   Enquanto a cliente não manda as fotos, entra a `<Cena>`. Quando mandar,
   basta preencher `foto` no arquivo de dados: a mesma chamada passa a
   devolver `<Image>` e o layout não muda em nada, porque as duas preenchem
   o encaixe do mesmo jeito.

   As regras de carregamento ficam aqui e não dependem de ninguém lembrar:
   `prioridade` só é verdadeiro na primeira imagem da página (o LCP), e
   marcar duas como prioritárias anula o ganho das duas.

   Proporções para pedir à cliente: cartão 16:11, topo da ficha 21:9 (4:3 no
   celular), bairro 16:10, retrato de sócia 4:5. AVIF com JPEG de reserva, e
   a primeira foto de cada imóvel sendo a melhor, porque é ela que aparece
   no cartão. */
export function Midia({
  foto,
  alt,
  cena,
  rotulo,
  className,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  prioridade = false,
}: {
  foto?: string;
  alt?: string;
  cena: NomeCena;
  rotulo: string;
  className?: string;
  sizes?: string;
  prioridade?: boolean;
}) {
  if (foto) {
    return (
      <Image
        src={foto}
        alt={alt ?? rotulo}
        fill
        sizes={sizes}
        priority={prioridade}
        loading={prioridade ? undefined : "lazy"}
        className={`bg-neutro-200 object-cover ${className ?? ""}`}
      />
    );
  }
  return <Cena nome={cena} rotulo={rotulo} className={`size-full ${className ?? ""}`} />;
}
