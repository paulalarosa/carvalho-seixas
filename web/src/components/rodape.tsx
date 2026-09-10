import Link from "next/link";
/* O lucide tirou as marcas do pacote, entao o Instagram entra pelo
   arroba: e sinal de perfil e nao finge ser o logo de terceiro. */
import { MessageCircle, Mail, AtSign, Home, Scale } from "lucide-react";
import { Simbolo } from "@/components/marca";
import { Assinatura } from "@/components/assinatura";

/* Registro profissional em painel próprio, e VAZIO enquanto os números não
   chegam. Selo de confiança desenhado não prova nada; número de registro
   prova, porque dá para conferir. Placeholder plausível aqui seria mentira. */
function Registro({ rotulo, icone }: { rotulo: string; icone: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/12 bg-white/6 px-4 py-3">
      <span className="text-ouro-300" aria-hidden>
        {icone}
      </span>
      <span>
        <span className="rotulo block text-azul-200">{rotulo}</span>
        <span className="num text-creme/50">—</span>
      </span>
    </div>
  );
}

export function Rodape() {
  return (
    <footer className="relative mt-24 overflow-hidden bg-azul-800 text-creme">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(50% 60% at 12% 0%, rgba(201,162,76,.16), transparent 70%), radial-gradient(46% 60% at 88% 10%, rgba(118,148,189,.2), transparent 72%)",
        }}
      />
      <div className="trilho relative grid gap-12 py-20 md:grid-cols-[1.4fr_1fr_1fr_1.1fr]">
        <div>
          {/* Lockup principal: símbolo à esquerda e o nome em três linhas,
              com o espaço lateral de meia largura do símbolo, que é a regra
              de respiro medida no arquivo da marca. */}
          <div className="flex items-center gap-[0.5em] text-[1.4rem]">
            <Simbolo className="h-[4.2em] w-auto" azul="var(--color-creme)" />
            <Assinatura cores={{ nome: "text-creme", categoria: "text-ouro-300" }} />
          </div>
          <p className="mt-6 font-display text-2xl font-semibold text-creme">
            Aqui seu sonho vira patrimônio.
          </p>
          <p className="mt-4 max-w-[30ch] text-azul-200">
            Centro, Tijuca e Zona Sul. Das 9h às 19h, de segunda a sábado.
          </p>
        </div>

        <nav aria-label="Navegar">
          <h3 className="rotulo mb-5 text-ouro-300">Navegar</h3>
          <ul className="space-y-2 text-azul-200">
            {[
              ["/imoveis", "Imóveis"],
              ["/bairros", "Bairros"],
              ["/juridico", "Área jurídica"],
              ["/contato", "Contato"],
            ].map(([href, texto]) => (
              <li key={href}>
                <Link href={href} className="transition-colors hover:text-creme">
                  {texto}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h3 className="rotulo mb-5 text-ouro-300">Falar</h3>
          <ul className="space-y-2 text-azul-200">
            <li>
              <Link href="/contato" className="flex items-center gap-2 transition-colors hover:text-creme">
                <MessageCircle className="size-4" aria-hidden /> WhatsApp
              </Link>
            </li>
            <li>
              <Link href="/contato" className="flex items-center gap-2 transition-colors hover:text-creme">
                <Mail className="size-4" aria-hidden /> E-mail
              </Link>
            </li>
            <li>
              <Link href="/contato" className="flex items-center gap-2 transition-colors hover:text-creme">
                <AtSign className="size-4" aria-hidden /> Instagram
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="rotulo mb-5 text-ouro-300">Registro</h3>
          <div className="space-y-3">
            <Registro rotulo="CRECI" icone={<Home className="size-4" />} />
            <Registro rotulo="OAB" icone={<Scale className="size-4" />} />
          </div>
        </div>
      </div>

      <div className="trilho relative flex flex-wrap gap-x-8 gap-y-3 border-t border-white/12 py-7 text-sm text-azul-200">
        <span>Carvalho &amp; Seixas Imóveis · Rio de Janeiro</span>
        <span>
          Protótipo de layout. Imóveis, preços, depoimentos e imagens são exemplos.
        </span>
      </div>
    </footer>
  );
}
