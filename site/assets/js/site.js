/* Carvalho & Seixas · comportamento do site.
   Rotas por hash com estado interno de reserva, filtro com contagem viva
   calculada no navegador, transição da foto do cartão para a ficha com Flip,
   cabeçalho que troca de pele na rolagem, e as entradas em lote.
   Tudo decorativo passa por gsap.matchMedia e morre em prefers-reduced-motion.
   Nada de conteúdo esperando rolagem para existir. */
(function () {
  'use strict';

  var IMOVEIS = window.CS_IMOVEIS || [];
  var BAIRROS = window.CS_BAIRROS || [];
  var temGsap = !!window.gsap;
  var temFlip = !!(window.gsap && window.Flip);
  var temST = !!(window.gsap && window.ScrollTrigger);
  if (temST) gsap.registerPlugin(ScrollTrigger);
  if (temFlip) gsap.registerPlugin(Flip);

  document.documentElement.classList.add('js');

  /* A entrada por rolagem só é armada quando existe viewport de verdade.
     Em miniatura, pré-render ou painel embutido a altura da janela é zero,
     nada intersecta nunca, e sem esta trava a página ficaria em branco.
     Sem o atributo, `.cs-revelar` nasce visível e não há o que dar errado. */
  function podeAnimarEntrada() { return window.innerHeight > 200; }
  if (podeAnimarEntrada()) document.documentElement.setAttribute('data-anima', '1');

  /* Conta quadros. Em aba oculta, pré-render ou painel embutido o
     requestAnimationFrame não dispara, o ticker do GSAP não anda e tudo que
     entrasse com opacidade zero ficaria invisível para sempre. As travas
     abaixo só agem quando o quadro comprovadamente não rodou. */
  var quadros = 0;
  if (temGsap) gsap.ticker.add(function () { quadros++; });
  function quadroParado() { return quadros < 3; }

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  function preco(im) {
    return brl.format(im.preco) + (im.porNoite ? ' <small>/ noite</small>' : '');
  }
  function ou(v) { return (v === null || v === undefined || v === '') ? null : v; }
  function dinheiro(v) { return (v === null || v === undefined) ? '—' : brl.format(v); }

  var ic = function (n, c) {
    return '<svg class="' + (c || 'cs-icone') + '" aria-hidden="true"><use href="#ic-' + n + '"></use></svg>';
  };

  /* --------------------------------------------------------- imagem
     Enquanto não há fotografia da cliente, cada imóvel recebe uma CENA
     desenhada em CSS. É ilustração assumida, não foto falsa.

     Quando as fotos chegarem, basta pôr `foto` e `alt` no arquivo de dados:
     a mesma função passa a devolver <img> e o layout não muda em nada.
     As regras de carregamento já estão aqui e não dependem de lembrar:
     a primeira imagem da tela leva fetchpriority alto e NÃO entra em
     carregamento tardio, porque é ela o LCP. Todas as outras entram. */
  var CENAS = ['predio', 'interior', 'vista', 'casa', 'comercial'];

  /* A cena é um desenho da marca em SVG, não um degradê imitando foto:
     degradê repetido em caixa pequena vira xadrez e entrega a página. O
     símbolo já recorta como fotografia, então o encaixe não muda. */
  function cena(variante, rotulo, extra) {
    return '<svg class="cena midia cena--' + (variante || 'predio') + (extra ? ' ' + extra : '') +
      '" role="img" aria-label="' + (rotulo || 'Ilustração da marca') + '">' +
      '<use href="#cena-' + (variante || 'predio') + '"></use></svg>';
  }

  function foto(src, alt, principal, w, h) {
    return '<img class="foto midia" src="' + src + '" alt="' + (alt || '') + '"' +
      ' width="' + (w || 1200) + '" height="' + (h || 800) + '" decoding="async"' +
      (principal ? ' fetchpriority="high"' : ' loading="lazy"') + '>';
  }

  /* `principal` só é verdadeiro na foto de topo da ficha e na primeira
     imagem da abertura. Marcar duas imagens como principais anula o ganho. */
  function cenaDe(im, principal) {
    if (im.foto) return foto(im.foto, im.alt || im.titulo, principal);
    return cena(im.cena, 'Ilustração de exemplo: ' + im.titulo);
  }
  function cenaBairro(b) {
    if (b.foto) return foto(b.foto, b.alt || ('Vista de ' + b.nome), false, 1600, 1000);
    return cena(b.cena, 'Ilustração de exemplo: ' + b.nome);
  }

  /* ---------------------------------------------------- estado da busca */
  var estado = { regiao: null, finalidade: null };
  var caminhoAtual = '#/';

  function lerURL(hash) {
    var p = new URLSearchParams((hash || '').split('?')[1] || '');
    estado.regiao = p.get('regiao') || null;
    estado.finalidade = p.get('finalidade') || null;
  }
  function espelhar(novo) {
    caminhoAtual = novo;
    try { if (location.hash !== novo) history.replaceState(null, '', novo); }
    catch (e) { /* barra de endereço travada: seguimos pelo estado interno */ }
  }
  function escreverURL() {
    var p = new URLSearchParams();
    if (estado.regiao) p.set('regiao', estado.regiao);
    if (estado.finalidade) p.set('finalidade', estado.finalidade);
    var q = p.toString();
    espelhar('#/imoveis' + (q ? '?' + q : ''));
  }
  function irPara(novo) { espelhar(novo); rota(novo); }
  function filtrar(lista) {
    return lista.filter(function (im) {
      if (estado.regiao && im.regiao !== estado.regiao) return false;
      if (estado.finalidade && im.finalidade !== estado.finalidade) return false;
      return true;
    });
  }

  /* ---------------------------------------------------------- cartões */
  function atributos(im) {
    var a = [];
    if (im.quartos) a.push([ 'quarto', im.quartos, im.quartos > 1 ? 'quartos' : 'quarto' ]);
    if (im.suites) a.push([ 'banho', im.suites, im.suites > 1 ? 'suítes' : 'suíte' ]);
    else if (im.banheiros) a.push([ 'banho', im.banheiros, im.banheiros > 1 ? 'banheiros' : 'banheiro' ]);
    if (im.vagas) a.push([ 'vaga', im.vagas, im.vagas > 1 ? 'vagas' : 'vaga' ]);
    a.push([ 'area', im.area, 'm²' ]);
    return a.map(function (t) {
      return '<span class="cs-imovel__atributo">' + ic(t[0], 'cs-icone cs-icone--p') +
        '<b>' + t[1] + '</b> ' + t[2] + '</span>';
    }).join('');
  }

  /* `variante` entra como modificador do cartao: 'largo' para o primeiro
     destaque, 'fila' para os que vao empilhados ao lado. Sem isso a home
     volta a ser tres caixas iguais, que e o desenho que a gente esta
     tirando da pagina. */
  function cartao(im, variante) {
    /* `map(cartao)` passa o indice no segundo argumento, e o indice viraria
       classe: `cs-imovel--1`. Aceitar so texto deixa o cartao seguro em
       qualquer `map`, que e como as listagens chamam. */
    if (typeof variante !== 'string') variante = null;
    var selos = (im.selos || []).map(function (s) {
      return '<span class="cs-selo cs-selo--sobre-foto">' + s + '</span>';
    }).join('');
    return '<article class="cs-imovel cs-revelar' +
      (variante ? ' cs-imovel--' + variante : '') + '" data-codigo="' + im.codigo + '">' +
      '<div class="cs-imovel__midia">' + cenaDe(im) +
        (selos ? '<div class="cs-imovel__selos">' + selos + '</div>' : '') +
      '</div>' +
      '<div class="cs-imovel__corpo">' +
        '<span class="cs-imovel__bairro">' + im.bairro + '</span>' +
        '<h3 class="cs-imovel__titulo"><a class="cs-imovel__link" href="#/imovel/' + im.codigo + '">' + im.titulo + '</a></h3>' +
        '<div class="cs-preco"><span class="cs-preco__valor">' + preco(im) + '</span>' +
          '<dl class="cs-preco__extras">' +
            '<div class="cs-preco__extra"><dt>Cond.</dt><dd>' + dinheiro(im.condominio || null) + '</dd></div>' +
            '<div class="cs-preco__extra"><dt>IPTU</dt><dd>' + dinheiro(im.iptu) + '</dd></div>' +
          '</dl></div>' +
        '<div class="cs-imovel__atributos">' + atributos(im) + '</div>' +
      '</div>' +
      '<div class="cs-imovel__pe"><span class="cs-imovel__codigo">' + im.codigo + '</span>' +
        (im.fechado
          ? '<a class="cs-botao cs-botao--p cs-botao--contorno" href="#/imoveis">Ver parecidos</a>'
          : '<a class="cs-botao cs-botao--p" href="' + zap(im) + '">' + ic('whatsapp', 'cs-icone cs-icone--p') + ' Falar</a>') +
      '</div></article>';
  }

  /* A mensagem já vai preenchida com o código. Sem isso a corretora
     precisa perguntar de qual imóvel se trata, e a resposta atrasa. */
  function zap(im) {
    return 'https://wa.me/?text=' + encodeURIComponent(
      'Olá! Vi o imóvel ' + im.codigo + ', ' + im.titulo + ', no site e queria saber mais.');
  }

  function cartaoBairro(b) {
    var n = IMOVEIS.filter(function (i) { return i.regiao === b.chave; }).length;
    return '<a class="cs-bairro cs-revelar" href="#/bairro/' + encodeURIComponent(b.chave) + '">' +
      cenaBairro(b) +
      '<h3 class="cs-bairro__nome">' + b.nome + '</h3>' +
      '<span class="cs-bairro__conta">' + n + ' ' + (n === 1 ? 'imóvel' : 'imóveis') + '</span>' +
      '<span class="cs-bairro__linha">' + b.linha + '</span></a>';
  }

  /* --------------------------------------------------------- vitrine */
  function contar(chave, valor) {
    var alt = { regiao: estado.regiao, finalidade: estado.finalidade };
    alt[chave] = valor;
    return IMOVEIS.filter(function (im) {
      if (alt.regiao && im.regiao !== alt.regiao) return false;
      if (alt.finalidade && im.finalidade !== alt.finalidade) return false;
      return true;
    }).length;
  }
  function pastilha(chave, valor, rotulo) {
    var ativa = estado[chave] === valor;
    var n = contar(chave, valor);
    return '<button class="cs-pastilha" type="button" data-filtro="' + chave + '" data-valor="' + valor +
      '" aria-pressed="' + ativa + '"' + (n === 0 && !ativa ? ' disabled' : '') + '>' +
      rotulo + ' <span class="cs-pastilha__conta">' + n + '</span></button>';
  }

  function pintarVitrine() {
    var barra = $('#filtros');
    if (!barra) return;
    var regioes = ['Centro', 'Tijuca', 'Zona Sul'];
    var fins = [['comprar', 'Comprar'], ['alugar', 'Alugar'], ['temporada', 'Temporada']];
    var lista = filtrar(IMOVEIS);

    barra.innerHTML =
      '<span class="cs-filtros__rotulo">Bairro</span>' +
      '<div class="cs-filtros__grupo">' + regioes.map(function (r) { return pastilha('regiao', r, r); }).join('') + '</div>' +
      '<span class="cs-filtros__rotulo" style="margin-left:var(--e-5)">Finalidade</span>' +
      '<div class="cs-filtros__grupo">' + fins.map(function (f) { return pastilha('finalidade', f[0], f[1]); }).join('') + '</div>' +
      '<div class="cs-filtros__fim">' +
        '<span class="cs-filtros__resultado"><b>' + lista.length + '</b> ' + (lista.length === 1 ? 'imóvel' : 'imóveis') + '</span>' +
        (estado.regiao || estado.finalidade
          ? '<button class="cs-botao cs-botao--fantasma cs-botao--p" type="button" id="limpar">Limpar</button>' : '') +
      '</div>';

    var grade = $('#grade');
    grade.innerHTML = lista.length
      ? '<div class="grade-imoveis">' + lista.map(cartao).join('') + '</div>'
      : '<div class="cs-vazio"><span class="cs-icone-caixa cs-icone-caixa--g">' + ic('lupa', 'cs-icone cs-icone--g') + '</span>' +
        '<h3>Nenhum imóvel com esses filtros</h3>' +
        '<p>Ainda não temos esse recorte na carteira. Conte o que você procura e a gente avisa quando entrar.</p>' +
        '<div class="cs-vazio__acoes">' +
          '<a class="cs-botao" href="#/contato">' + ic('whatsapp') + ' Contar o que procuro</a>' +
          '<button class="cs-botao cs-botao--contorno" type="button" id="limpar2">Limpar filtros</button>' +
        '</div></div>';
    revelar(grade);
  }

  document.addEventListener('click', function (e) {
    var p = e.target.closest('[data-filtro]');
    if (p) {
      var c = p.dataset.filtro, v = p.dataset.valor;
      estado[c] = estado[c] === v ? null : v;
      escreverURL(); pintarVitrine(); return;
    }
    if (e.target.closest('#limpar') || e.target.closest('#limpar2')) {
      estado.regiao = null; estado.finalidade = null;
      escreverURL(); pintarVitrine();
    }
  });

  /* busca da abertura */
  document.addEventListener('submit', function (e) {
    var f = e.target.closest('#busca-hero');
    if (!f) return;
    e.preventDefault();
    estado.regiao = $('#busca-regiao', f).value || null;
    estado.finalidade = $('#busca-finalidade', f).value || null;
    var p = new URLSearchParams();
    if (estado.regiao) p.set('regiao', estado.regiao);
    if (estado.finalidade) p.set('finalidade', estado.finalidade);
    var q = p.toString();
    irPara('#/imoveis' + (q ? '?' + q : ''));
  });

  /* ----------------------------------------------------------- ficha */
  /* A galeria mostra o ROTEIRO do imóvel: enquanto não há fotografia, só as
     cenas que fazem sentido para aquele imóvel, e o contador diz quantas
     são. Doze fotos de exemplo é mentira que o cliente descobre na primeira
     seta, e some do lado dele quando as fotos reais chegarem em número
     diferente. Quando `fotos` existir no arquivo de dados, é ele que manda. */
  var galIdx = 0, galN = 1, galRoteiro = ['predio'];

  function roteiroDaGaleria(im) {
    if (im.fotos && im.fotos.length) return im.fotos.slice();
    if (im.foto) return [im.foto];
    var lista = [im.cena || 'predio'];
    if (im.cena !== 'interior') lista.push('interior');
    if (im.cena !== 'vista' && im.cena !== 'comercial') lista.push('vista');
    return lista;
  }
  function ehFoto(entrada) { return entrada.indexOf('/') >= 0 || entrada.indexOf('.') >= 0; }
  function quadroDaGaleria(entrada, rotulo, principal) {
    return ehFoto(entrada) ? foto(entrada, rotulo, principal) : cena(entrada, rotulo);
  }

  function pintarFicha(codigo) {
    var alvo = $('#ficha');
    if (!alvo) return;
    var im = IMOVEIS.filter(function (x) { return x.codigo === codigo; })[0];
    if (!im) {
      alvo.innerHTML = '<div class="trilho" style="padding-top:9rem"><div class="cs-vazio">' +
        '<h3>Imóvel não encontrado</h3><p>Confira o código ou volte para a vitrine.</p>' +
        '<div class="cs-vazio__acoes"><a class="cs-botao" href="#/imoveis">Ver a vitrine</a></div></div></div>';
      return;
    }
    galIdx = 0;

    galRoteiro = roteiroDaGaleria(im);
    galN = galRoteiro.length;
    galIdx = 0;
    var tiras = galRoteiro.map(function (entrada, i) {
      return '<button class="cs-galeria__tira" type="button" data-tira="' + i + '"' +
        (i === 0 ? ' aria-current="true"' : '') + ' aria-label="Imagem ' + (i + 1) + '">' +
        quadroDaGaleria(entrada, 'Miniatura ' + (i + 1), false) + '</button>';
    }).join('');

    var parecidos = IMOVEIS.filter(function (x) {
      return x.regiao === im.regiao && x.codigo !== im.codigo;
    }).slice(0, 3);

    alvo.innerHTML =
      '<div class="ficha-galeria"><div class="cs-galeria"><div class="cs-galeria__palco" id="palco">' +
        quadroDaGaleria(galRoteiro[0], im.alt || im.titulo, true) +
        '<div class="cs-galeria__nav">' +
          '<button class="cs-botao-icone cs-botao-icone--claro" type="button" data-gal="-1" aria-label="Foto anterior">' + ic('seta-esquerda') + '</button>' +
          '<button class="cs-botao-icone cs-botao-icone--claro" type="button" data-gal="1" aria-label="Próxima foto">' + ic('seta-direita') + '</button>' +
        '</div><span class="cs-galeria__conta" id="galconta">1 / ' + galN + '</span>' +
      '</div></div></div>' +

      '<div class="trilho">' +
        '<nav class="cs-trilha" aria-label="Você está aqui" style="margin-top:var(--e-6)">' +
          '<a href="#/">Início</a>' + ic('chevron-direita') +
          '<a href="#/imoveis">Imóveis</a>' + ic('chevron-direita') +
          '<a href="#/bairro/' + encodeURIComponent(im.regiao) + '">' + im.bairro + '</a>' + ic('chevron-direita') +
          '<span aria-current="page">' + im.codigo + '</span></nav>' +

        '<div class="ficha-topo">' +
          '<div>' +
            '<span class="cs-imovel__bairro">' + im.bairro + '</span>' +
            '<h1 style="margin-top:var(--e-3)">' + im.titulo + '</h1>' +
            '<p class="ficha-resumo">' + im.resumo + '</p>' +
            '<div class="cs-galeria__tiras" style="margin-top:var(--e-8)">' + tiras + '</div>' +
            '<h2 class="bloco" style="margin-top:var(--e-10)">A ficha</h2>' +
            '<dl class="cs-ficha" style="margin-top:var(--e-7)">' +
              item('Área útil', im.area + ' m²') + item('Quartos', ou(im.quartos)) +
              item('Suítes', ou(im.suites)) + item('Banheiros', ou(im.banheiros)) +
              item('Vagas', ou(im.vagas)) + item('Andar', ou(im.andar)) +
              item('Ano', ou(im.ano)) + item('Código', im.codigo) +
            '</dl>' +
          '</div>' +

          '<aside class="ficha-lado">' +
            '<div class="cs-cartao cs-cartao--elevado"><div class="cs-cartao__corpo">' +
              '<div class="cs-preco"><span class="cs-preco__valor">' + preco(im) + '</span>' +
                '<dl class="cs-preco__extras">' +
                  '<div class="cs-preco__extra"><dt>Condomínio</dt><dd>' + dinheiro(im.condominio || null) + '</dd></div>' +
                  '<div class="cs-preco__extra"><dt>IPTU</dt><dd>' + dinheiro(im.iptu) + '</dd></div>' +
                '</dl></div>' +
              '<div class="cs-zap" style="margin-top:var(--e-7)">' +
                '<a class="cs-botao cs-botao--g cs-botao--cheio" href="' + zap(im) + '">' + ic('whatsapp') + ' Falar sobre este imóvel</a>' +
                '<span class="cs-zap__aviso"><span class="cs-zap__ponto"></span> Costumamos responder em poucos minutos, das 9h às 19h.</span>' +
              '</div>' +
            '</div></div>' +
            '<div class="cs-nota">' + ic('info') + '<div><b>Condomínio e IPTU informados pelo proprietário.</b>A gente confere na documentação antes da proposta.</div></div>' +
          '</aside>' +
        '</div>' +
      '</div>' +

      '<div class="faixa faixa--creme bloco"><div class="trilho"><div class="duas-col">' +
        '<div class="cs-simulador">' +
          '<div><h2>Quanto custa além do preço</h2><p class="sub">Sobre ' + brl.format(im.preco) + ', no Rio de Janeiro.</p></div>' +
          '<dl class="cs-simulador__linhas" style="margin-top:var(--e-7)">' +
            '<div class="cs-simulador__linha"><dt>ITBI</dt><dd>—</dd></div>' +
            '<div class="cs-simulador__linha"><dt>Escritura</dt><dd>—</dd></div>' +
            '<div class="cs-simulador__linha"><dt>Registro</dt><dd>—</dd></div>' +
          '</dl>' +
          '<dl class="cs-simulador__total"><dt>Total estimado</dt><dd>—</dd></dl>' +
          '<p class="cs-simulador__conferido">Alíquotas aguardando confirmação das sócias.</p>' +
        '</div>' +
        '<div><h2>O entorno</h2>' +
          '<div class="cs-mapa" style="margin-top:var(--e-7)">' +
            '<div class="mapa-exemplo" role="img" aria-label="Mapa ilustrativo do entorno"></div>' +
            '<span class="cs-mapa__pino">' + ic('mapa', 'cs-icone cs-icone--g') + '</span>' +
            '<div class="cs-mapa__pe">' + ic('info', 'cs-icone cs-icone--p') + ' ' + im.bairro + ' · mapa ilustrativo</div>' +
          '</div></div>' +
      '</div></div></div>' +

      (parecidos.length ? '<div class="faixa"><div class="trilho">' +
        '<div class="cs-titulo-secao"><div class="cs-titulo-secao__linha"><h2>Também em ' + im.regiao + '</h2></div></div>' +
        '<div class="grade-imoveis">' + parecidos.map(cartao).join('') + '</div>' +
      '</div></div>' : '') +

      '<div class="cs-barra-fixa">' +
        '<div><span class="cs-barra-fixa__rotulo">' + im.codigo + '</span><span class="cs-barra-fixa__preco">' + brl.format(im.preco) + '</span></div>' +
        '<a class="cs-botao" href="' + zap(im) + '">' + ic('whatsapp') + ' Falar sobre este imóvel</a></div>';

    revelar(alvo);

    function item(r, v) {
      var vazio = (v === null || v === undefined);
      return '<div class="cs-ficha__item"><dt class="cs-ficha__rotulo">' + r + '</dt>' +
        '<dd class="cs-ficha__valor' + (vazio ? ' cs-ficha__valor--vazio' : '') + '">' + (vazio ? '—' : v) + '</dd></div>';
    }
  }

  function trocarCena(el, variante) {
    if (!el) return;
    CENAS.forEach(function (c) { el.classList.remove('cena--' + c); });
    el.classList.add('cena--' + variante);
    /* O desenho vem do símbolo, não da classe. Trocar só a classe deixava a
       galeria parada na mesma cena, com as setas respondendo e a imagem não. */
    var u = el.querySelector('use');
    if (u) u.setAttribute('href', '#cena-' + variante);
  }

  document.addEventListener('click', function (e) {
    var g = e.target.closest('[data-gal]');
    if (g) { galIdx = (galIdx + parseInt(g.dataset.gal, 10) + galN) % galN; mostrarFoto(); return; }
    var t = e.target.closest('[data-tira]');
    if (t) { galIdx = parseInt(t.dataset.tira, 10); mostrarFoto(); }
  });
  document.addEventListener('keydown', function (e) {
    if (!$('#palco')) return;
    if (e.key === 'ArrowRight') { galIdx = (galIdx + 1) % galN; mostrarFoto(); }
    if (e.key === 'ArrowLeft') { galIdx = (galIdx - 1 + galN) % galN; mostrarFoto(); }
  });

  function mostrarFoto() {
    var entrada = galRoteiro[galIdx % galRoteiro.length];
    var palco = $('#palco .cena');
    if (!palco && ehFoto(entrada)) {
      var img = $('#palco .foto');
      if (img) img.src = entrada;
    }
    trocarCena(palco, entrada);
    var c = $('#galconta');
    if (c) c.textContent = (galIdx + 1) + ' / ' + galN;
    $$('[data-tira]').forEach(function (b) {
      if (parseInt(b.dataset.tira, 10) === galIdx) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
    });
    if (temGsap && palco) gsap.fromTo(palco, { opacity: .5 }, { opacity: 1, duration: .3, ease: 'power2.out' });
  }

  /* ------------------------------------------------- bairro editorial */
  function pintarBairro(chave) {
    var alvo = $('#bairro');
    if (!alvo) return;
    var b = BAIRROS.filter(function (x) { return x.chave === chave; })[0] || BAIRROS[0];
    var lista = IMOVEIS.filter(function (im) { return im.regiao === b.chave; });
    alvo.innerHTML =
      '<header class="bairro-hero">' + cenaBairro(b) +
        '<div class="trilho">' +
          '<nav class="cs-trilha" aria-label="Você está aqui" style="margin-bottom:var(--e-7)">' +
            '<a href="#/">Início</a>' + ic('chevron-direita') +
            '<a href="#/bairros">Bairros</a>' + ic('chevron-direita') +
            '<span aria-current="page">' + b.nome + '</span></nav>' +
          '<h1>' + b.nome + '</h1><p>' + b.linha + '</p>' +
        '</div></header>' +
      '<div class="faixa"><div class="trilho"><div class="bairro-texto"><p>' + b.texto + '</p></div></div></div>' +
      '<div class="faixa faixa--creme"><div class="trilho">' +
        '<div class="cs-titulo-secao"><div class="cs-titulo-secao__linha"><h2>Imóveis em ' + b.nome + '</h2>' +
          '<a class="cs-botao cs-botao--fantasma cs-botao--p cs-titulo-secao__acao" href="#/imoveis?regiao=' +
          encodeURIComponent(b.chave) + '">Ver na vitrine ' + ic('seta-direita', 'cs-icone cs-icone--p') + '</a>' +
        '</div></div>' +
        '<div class="grade-imoveis">' + lista.map(cartao).join('') + '</div></div></div>';
    revelar(alvo);
  }

  /* ------------------------------------------------------------ rotas */
  function rota(forcado) {
    var hash = forcado || location.hash || caminhoAtual || '#/';
    caminhoAtual = hash;
    lerURL(hash);
    var partes = (hash.split('?')[0] || '#/').replace('#', '').split('/').filter(Boolean);
    var nome = partes[0] || 'home';
    var arg = partes[1] ? decodeURIComponent(partes[1]) : null;
    var mapa = { home: 'home', imoveis: 'imoveis', imovel: 'imovel', bairros: 'bairros',
                 bairro: 'bairro', juridico: 'juridico', contato: 'contato' };
    var tela = mapa[nome] || 'home';

    $$('[data-tela]').forEach(function (s) { s.hidden = s.dataset.tela !== tela; });
    $$('[data-nav]').forEach(function (a) {
      if (a.dataset.nav === tela) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    if (tela === 'imoveis') pintarVitrine();
    if (tela === 'imovel') pintarFicha(arg);
    if (tela === 'bairro') pintarBairro(arg);

    window.scrollTo(0, 0);
    peleDoTopo();
    if (temST) ScrollTrigger.refresh();

    var alvo = $('[data-tela="' + tela + '"]');
    if (temGsap && alvo) gsap.fromTo(alvo, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .38, ease: 'power2.out' });
    revelar(alvo);
    /* A abertura mostra UMA casa de perto; a pagina de bairros mostra a rua
       com os tres volumes, e la o clique escolhe o recorte. */
    if (tela === 'bairros') acordarCena('cena', 'rua');
    if (tela === 'home') acordarCena('cena-hero', 'casa');
  }
  window.addEventListener('hashchange', function () { rota(); });

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#/"]');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault();
    irPara(a.getAttribute('href'));
  });

  /* ------------------------------------------ cabeçalho na rolagem */
  /* Transparente enquanto a abertura está atrás dele, sólido depois.
     Sem isso o menu some sobre a foto e reaparece sobre o creme. */
  var topo = null;
  function peleDoTopo() {
    topo = topo || $('.topo-site');
    if (!topo) return;
    var hero = $('[data-tela]:not([hidden]) .hero, [data-tela]:not([hidden]) .bairro-hero, [data-tela]:not([hidden]) .cabeca-pagina, [data-tela]:not([hidden]) .ficha-galeria');
    var limite = hero ? hero.getBoundingClientRect().bottom - 80 : 0;
    var escuro = !!hero && limite > 0;
    topo.setAttribute('data-sobre-hero', escuro ? 'true' : 'false');
    topo.setAttribute('data-fixo', escuro ? 'false' : 'true');
  }
  window.addEventListener('scroll', peleDoTopo, { passive: true });
  window.addEventListener('resize', peleDoTopo);

  /* ------------------------------------ entrada por rolagem, em lote */
  /* IntersectionObserver mais transição de CSS. Sem ticker, sem
     ScrollTrigger: o gatilho é evento do navegador, e o desenho é do
     compositor. É a parte do site que menos pode falhar, porque falhar
     aqui significa página em branco. */
  var observador = null;
  function observar() {
    if (observador || !('IntersectionObserver' in window)) return observador;
    observador = new IntersectionObserver(function (entradas) {
      var lote = entradas.filter(function (e) { return e.isIntersecting; });
      lote.forEach(function (e, i) {
        e.target.style.transitionDelay = (i * 60) + 'ms';
        e.target.setAttribute('data-visivel', '1');
        observador.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    return observador;
  }

  function revelar(escopo) {
    if (!escopo) return;
    var alvos = $$('.cs-revelar', escopo).filter(function (el) {
      if (el.dataset.revelado) return false;
      var tela = el.closest('[data-tela]');
      return !tela || !tela.hidden;
    });
    if (!alvos.length) return;
    alvos.forEach(function (el) { el.dataset.revelado = '1'; });
    var obs = podeAnimarEntrada() ? observar() : null;
    if (!obs) {
      alvos.forEach(function (el) { el.setAttribute('data-visivel', '1'); });
      return;
    }
    alvos.forEach(function (el) { obs.observe(el); });
  }

  /* ------------------------------------------------ etapas ancoradas */
  function etapasAncoradas() {
    if (!temST) return;
    gsap.matchMedia().add('(min-width: 940px) and (prefers-reduced-motion: no-preference)', function () {
      var secao = $('#etapas-ancora');
      if (!secao) return;
      var itens = $$('.cs-etapa', secao);
      if (!itens.length) return;
      gsap.set(itens, { opacity: .3 });
      gsap.set(itens[0], { opacity: 1 });
      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: secao, start: 'top 16%', end: '+=' + (itens.length * 240),
          pin: true, scrub: .6, invalidateOnRefresh: true
        }
      });
      itens.forEach(function (el, i) {
        if (!i) return;
        tl.to(itens[i - 1], { opacity: .3, duration: .4 }).to(el, { opacity: 1, duration: .4 }, '<');
      });
    });
  }

  /* ------------------------------------------------------- cena 3D */
  var cenas3d = {};
  function acordarCena(id, modo) {
    if (cenas3d[id] || !window.CSCena) return;
    var alvo = document.getElementById(id);
    if (!alvo) return;
    var c = window.CSCena.montar(alvo, function (chave) {
      irPara('#/bairro/' + encodeURIComponent(chave));
    }, { modo: modo });
    if (c) {
      cenas3d[id] = c;
      var caixa = alvo.closest('.hero, .cs-cena') || alvo;
      caixa.setAttribute('data-pronta', 'true');
      requestAnimationFrame(c.medir);
    }
  }

  /* -------------------------------------------------------- consenso */
  document.addEventListener('submit', function (e) {
    var f = e.target.closest('#form-contato');
    if (!f) return;
    e.preventDefault();
    var ok = $('#consentimento', f), erro = $('#erro-consentimento', f);
    if (!ok.checked) { erro.hidden = false; ok.focus(); return; }
    erro.hidden = true;
    var aviso = $('#aviso-enviado');
    aviso.hidden = false;
    if (temGsap) gsap.fromTo(aviso, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .3, ease: 'power2.out' });
  });

  /* ------------------------------------------------------- abertura */
  function abertura() {
    if (!temGsap) return;
    gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', function () {
      /* Título, texto e busca entram só por deslocamento, sem opacidade.
         Se o ticker do quadro não andar (aba oculta, pré-render, aparelho
         travado) o pior caso é o conteúdo 18px fora de lugar, e não invisível.
         Opacidade zero fica só na marca, que é decorativa e repete o topo. */
      var tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('.hero__titulo', { y: 24, duration: .62 })
        .from('.hero__linha', { y: 18, duration: .55 }, '-=.44')
        .from('.hero__frentes', { y: 14, duration: .5 }, '-=.42')
        .from('.balcao', { y: 22, duration: .6 }, '-=.40');
      /* Trava: se em 1,6s a linha do tempo não andou, assume o fim. */
      setTimeout(function () {
        if (quadroParado() && tl.progress() < 1) tl.progress(1);
      }, 1600);
    });
  }

  /* --------------------------------------- a foto não recarrega, cresce */
  document.addEventListener('click', function (e) {
    if (!temFlip) return;
    var link = e.target.closest('.cs-imovel__link');
    if (!link) return;
    var origem = $('.midia', link.closest('.cs-imovel'));
    if (!origem) return;
    var estadoFlip = Flip.getState(origem);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var destino = $('#palco .midia');
        if (!destino) return;
        Flip.fit(destino, estadoFlip, { scale: true });
        gsap.to(destino, {
          x: 0, y: 0, scaleX: 1, scaleY: 1, duration: .62, ease: 'expo.out',
          clearProps: 'transform,translate,rotate,scale'
        });
        /* Rede de segurança: animação que falha não pode deixar a foto torta. */
        setTimeout(function () {
          if (!destino.isConnected) return;
          gsap.killTweensOf(destino);
          ['transform', 'translate', 'rotate', 'scale'].forEach(function (p) {
            destino.style.removeProperty(p);
          });
        }, 900);
      });
    });
  }, true);

  window.CS_CARTAO = cartao;
  window.CS_BAIRRO_CARTAO = cartaoBairro;
  window.CS_REVELAR = revelar;

  function iniciar() {
    rota();
    abertura();
    etapasAncoradas();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
