/* Carvalho & Seixas · cena da casa.
   Um sobrado carioca ao fim da tarde, com a luz acesa dentro. Não é um imóvel
   real da carteira: é a assinatura da casa, modelada para ficar no lugar da
   fotografia que ainda não existe.

   Duas montagens saem do mesmo construtor:
   - `casa` (abertura): um sobrado de perto, luz de varanda acesa;
   - `rua` (bairros): três volumes lado a lado, um por recorte, clicáveis.

   Regras que valem sempre:
   - a imagem de reserva já está no lugar e é ela o LCP; a tela só aparece pronta;
   - em prefers-reduced-motion a cena nem inicia;
   - fora de vista o laço para, para não gastar bateria à toa. */
(function () {
  'use strict';

  var CREME = 0xd8d0bb, CREME_ESCURO = 0xc3baa3, GRAFITE = 0x33333a,
      OURO = 0xc9a24c, LUZ = 0xffb455, FOLHA = 0x123a34, ASFALTO = 0x1b2130;

  /* Preenchido por montar() antes de qualquer construtor rodar. Guardar a
     referência num só lugar evita repetir window.THREE em cada peça. */
  var THREE = null;

  function mat(cor, rug, met, chapado) {
    return new THREE.MeshStandardMaterial({
      color: cor, roughness: rug === undefined ? .85 : rug,
      metalness: met || 0, flatShading: !!chapado
    });
  }

  /* Caixa com origem no centro. Quase tudo na casa é caixa: parede, friso,
     laje e barra de grade. O que não é caixa está nas funções abaixo. */
  function caixa(l, a, p, material, x, y, z) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(l, a, p), material);
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }

  /* ---------------------------------------------------------- telhado
     Telha ondulada de verdade: o perfil é uma senoide amostrada e extrudada
     no sentido da água. Caixa inclinada lê como rampa de concreto, e é o que
     mais denuncia cena montada às pressas. */
  function agua(largura, comprimento, material) {
    var n = Math.max(8, Math.round(largura / 1.25)), amp = .24, esp = .3;
    var f = new THREE.Shape(), i, t, passo = largura / (n * 6);
    f.moveTo(-largura / 2, 0);
    for (i = 0; i <= n * 6; i++) {
      t = -largura / 2 + i * passo;
      f.lineTo(t, amp * (1 - Math.cos((i / 6) * Math.PI * 2)) / 2);
    }
    f.lineTo(largura / 2, -esp);
    f.lineTo(-largura / 2, -esp);
    var g = new THREE.ExtrudeGeometry(f, { depth: comprimento, bevelEnabled: false, steps: 1 });
    g.translate(0, 0, -comprimento / 2);
    var m = new THREE.Mesh(g, material);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }

  function telhado(largura, fundura, alturaParede, altura, matTelha, matOitao) {
    var g = new THREE.Group();
    var beiral = 1.3, L = largura + beiral * 2, P = fundura / 2 + beiral;
    var incl = Math.atan2(altura, P);
    var comp = Math.sqrt(altura * altura + P * P);

    /* A agua sai da extrusao ja deitada: comprimento em Z, onda em Y. Basta
       inclinar em X para descer da cumeeira ao beiral. A de tras e a mesma
       peca dentro de um no girado meia volta, o que mantem a onda para cima
       e a normal para fora sem espelhar escala. */
    var frente = agua(L, comp, matTelha);
    frente.rotation.x = incl;
    frente.position.set(0, alturaParede + altura / 2, P / 2);
    g.add(frente);

    var fundo = new THREE.Group();
    var tras = agua(L, comp, matTelha);
    tras.rotation.x = incl;
    tras.position.set(0, alturaParede + altura / 2, P / 2);
    fundo.rotation.y = Math.PI;
    fundo.add(tras);
    g.add(fundo);

    // Cumeeira: sem ela as duas águas se encontram numa fenda.
    g.add(caixa(L + .2, .5, 1.5, matTelha, 0, alturaParede + altura + .12, 0));

    /* Oitão: o triângulo de parede que fecha a ponta. É ele que dá o
       contorno de casa quando a vista é de três quartos. */
    [1, -1].forEach(function (lado) {
      var t = new THREE.Shape();
      t.moveTo(-fundura / 2, 0); t.lineTo(fundura / 2, 0); t.lineTo(0, altura);
      var m = new THREE.Mesh(new THREE.ExtrudeGeometry(t, { depth: .5, bevelEnabled: false }), matOitao);
      m.rotation.y = Math.PI / 2;
      m.position.set(lado * largura / 2, alturaParede, 0);
      m.castShadow = true; m.receiveShadow = true;
      g.add(m);
    });
    return g;
  }

  /* ----------------------------------------------------------- janela
     Caixilho, cruzeta, peitoril e vidro com luz por dentro. O vidro é
     emissivo em vez de refletir mapa de ambiente: a cena roda no aparelho
     do cliente, e o custo tem de ficar perto de zero. */
  function janela(l, a, brilho, matCaixilho) {
    var g = new THREE.Group(), e = .28;
    var vidro = new THREE.MeshStandardMaterial({
      color: 0x14243a, emissive: LUZ, emissiveIntensity: brilho * 1.45, roughness: .18, metalness: .1
    });
    var v = new THREE.Mesh(new THREE.PlaneGeometry(l - e * 2, a - e * 2), vidro);
    v.position.z = -.06;
    g.add(v);
    g.add(caixa(l, e, .34, matCaixilho, 0, a / 2 - e / 2, 0));
    g.add(caixa(l, e, .34, matCaixilho, 0, -a / 2 + e / 2, 0));
    g.add(caixa(e, a, .34, matCaixilho, -l / 2 + e / 2, 0, 0));
    g.add(caixa(e, a, .34, matCaixilho, l / 2 - e / 2, 0, 0));
    g.add(caixa(.16, a - e * 2, .26, matCaixilho, 0, 0, 0));
    g.add(caixa(l - e * 2, .14, .26, matCaixilho, 0, 0, 0));
    g.add(caixa(l + .7, .3, .8, matCaixilho, 0, -a / 2 - .15, .24));
    g.userData.vidro = vidro;
    return g;
  }

  /* Grade de barra vertical: sacada, varanda e portão usam a mesma. */
  function grade(largura, altura, matBarra, passo) {
    var g = new THREE.Group(), n = Math.max(2, Math.round(largura / (passo || 1.15))), i, x;
    for (i = 0; i <= n; i++) {
      x = -largura / 2 + (largura / n) * i;
      g.add(caixa(.12, altura, .12, matBarra, x, altura / 2, 0));
    }
    g.add(caixa(largura, .14, .2, matBarra, 0, altura, 0));
    g.add(caixa(largura, .14, .2, matBarra, 0, .1, 0));
    return g;
  }

  /* Arbusto e árvore: ao fim da tarde a folhagem é silhueta, então a cor sai
     do próprio azul da marca. Três volumes deslocados, sombreamento chapado. */
  function folhagem(raio, matFolha) {
    var g = new THREE.Group(), i, b, r;
    for (i = 0; i < 3; i++) {
      r = raio * (.68 + i * .16);
      b = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), matFolha);
      b.position.set((i - 1) * raio * .5, raio * (.5 + i * .3), (i % 2 ? .3 : -.3) * raio);
      b.rotation.set(i, i * 2, 0);
      b.castShadow = true;
      g.add(b);
    }
    return g;
  }

  function arvore(altura, matFolha, matTronco) {
    var g = new THREE.Group();
    var tr = new THREE.Mesh(new THREE.CylinderGeometry(.24, .42, altura * .55, 6), matTronco);
    tr.position.y = altura * .275; tr.castShadow = true;
    g.add(tr);
    var copa = folhagem(altura * .3, matFolha);
    copa.position.y = altura * .5;
    g.add(copa);
    return g;
  }

  /* -------------------------------------------------- calçada e rua
     Pedra portuguesa desenhada em canvas: é o piso do Rio, e é o detalhe que
     situa a cena sem precisar de fotografia. */
  function pisoDaCalcada(nitidez) {
    var c = document.createElement('canvas');
    c.width = c.height = 128;
    var x = c.getContext('2d'), i, j;
    x.fillStyle = '#d9d2c2'; x.fillRect(0, 0, 128, 128);
    x.strokeStyle = '#6b6e77'; x.lineWidth = 8; x.lineCap = 'round';
    for (j = -1; j < 3; j++) {
      x.beginPath();
      for (i = 0; i <= 128; i += 4) {
        x[i ? 'lineTo' : 'moveTo'](i, j * 48 + 24 + Math.sin(i / 128 * Math.PI * 2) * 15);
      }
      x.stroke();
    }
    var t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(124, 31);
    t.anisotropy = nitidez || 1;
    if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding;
    return t;
  }

  /* Fachada de prédio em canvas: a grade de janela vira mapa de cor e de luz
     ao mesmo tempo, então uma janela acesa custa zero geometria. */
  function fachada(colunas, linhas, acesas) {
    var c = document.createElement('canvas'), lin = 22, col = 26;
    c.width = colunas * col; c.height = linhas * lin;
    var x = c.getContext('2d'), i, j, luz;
    x.fillStyle = '#16304f'; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = '#0f2440';
    for (j = 0; j < linhas; j++) x.fillRect(0, j * lin + lin - 4, c.width, 3);
    for (j = 0; j < linhas; j++) {
      for (i = 0; i < colunas; i++) {
        luz = Math.random() < acesas;
        x.fillStyle = luz ? '#ffca77' : '#0c1d33';
        x.fillRect(i * col + 5, j * lin + 4, col - 10, lin - 11);
      }
    }
    var t = new THREE.CanvasTexture(c);
    if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding;
    return t;
  }

  /* ============================================================== CASA */
  function sobrado() {
    var g = new THREE.Group();
    var mParede = mat(CREME, .95), mDetalhe = mat(CREME_ESCURO, .9),
        mTelha = mat(GRAFITE, .78, .06, true), mMetal = mat(OURO, .42, .55),
        mSoco = mat(0x2c3038, .9), mPorta = mat(0x243b5c, .6, .1);
    var L = 26, P = 16, H = 13.2, jan = [];

    g.add(caixa(L, H, P, mParede, 0, H / 2, 0));                 // corpo
    g.add(caixa(L + .5, 1.7, P + .5, mSoco, 0, .85, 0));         // soco
    g.add(caixa(L + .35, .6, P + .35, mDetalhe, 0, 6.6, 0));     // friso entre pisos
    g.add(telhado(L, P, H, 5.4, mTelha, mDetalhe));

    function naFrente(no, x, y) { no.position.set(x, y, P / 2 + .04); g.add(no); jan.push(no); }

    naFrente(janela(3.4, 3.6, .8, mDetalhe), 7.4, 4.4);
    [-6.6, 6.6].forEach(function (x, i) {
      naFrente(janela(3.6, 4.2, i ? 1.05 : .55, mDetalhe), x, 9.6);
      var sac = grade(4.6, 1.5, mMetal);
      sac.position.set(x, 7.2, P / 2 + .5);
      g.add(sac);
      g.add(caixa(5.2, .34, 1.2, mDetalhe, x, 7.1, P / 2 + .55));
    });

    // Lateral: duas janelas, para o volume não ficar cego de perfil.
    [3.2, -3.6].forEach(function (z, i) {
      var j = janela(2.6, 3.4, i ? .35 : .75, mDetalhe);
      j.rotation.y = -Math.PI / 2;
      j.position.set(-L / 2 - .04, i ? 9.6 : 4.4, z);
      g.add(j); jan.push(j);
    });

    /* Varanda: é ela que cria a sombra funda na frente. Casa sem alpendre lê
       como bloco, e bloco não convida. */
    var vL = 9.4, vP = 5, v = new THREE.Group();
    v.add(caixa(vL, .7, vP, mDetalhe, 0, .35, 0));
    v.add(caixa(vL + .8, .5, vP + .5, mDetalhe, 0, 6.9, 0));
    [-1, 1].forEach(function (s) {
      var col = new THREE.Mesh(new THREE.CylinderGeometry(.42, .5, 6.6, 12), mParede);
      col.position.set(s * (vL / 2 - .6), 3.6, vP / 2 - .5);
      col.castShadow = true;
      v.add(col);
      var gr = grade(vL / 2 - 1.8, 1.4, mMetal);
      gr.position.set(s * (vL / 4 + .55), .7, vP / 2 - .3);
      v.add(gr);
    });
    v.add(caixa(2.6, 5.2, .3, mPorta, 0, 3.3, -vP / 2 + .2));
    v.position.set(-4.2, 0, P / 2 + vP / 2 - .3);
    g.add(v);

    /* Luz de varanda: é o único ponto de luz da cena, e é o que faz a casa
       parecer habitada em vez de maquete. */
    var lamp = new THREE.PointLight(LUZ, 1.35, 26, 2);
    lamp.position.set(-4.2, 6.2, P / 2 + 3.2);
    g.add(lamp);

    // Muro, pilar e portão de barra.
    var mz = P / 2 + 12;
    [-1, 1].forEach(function (s) {
      g.add(caixa(9, 2.4, .8, mParede, s * 10.5, 1.2, mz));
      g.add(caixa(1.4, 3.4, 1.4, mDetalhe, s * 6.2, 1.7, mz));
      g.add(caixa(1.4, 3.4, 1.4, mDetalhe, s * 14.8, 1.7, mz));
    });
    var pt = grade(11.6, 3, mMetal, .82);
    pt.position.set(0, 0, mz);
    g.add(pt);

    // Jardim.
    var arv = arvore(13, mat(FOLHA, .95, 0, true), mat(0x2a2118, .95));
    arv.position.set(-19.5, 0, P / 2 + 7);
    g.add(arv);
    [[9.5, P / 2 + 5.5, 1.5], [12.8, P / 2 + 4.2, 1.1], [-13.5, P / 2 + 4, 1.3]].forEach(function (a) {
      var b = folhagem(a[2], mat(FOLHA, .95, 0, true));
      b.position.set(a[0], 0, a[1]);
      g.add(b);
    });

    g.userData.janelas = jan;
    g.userData.altura = H + 5.4;
    return g;
  }

  /* ============================================================ PRÉDIO */
  function predio(andares, largura, fundura, acesas) {
    var g = new THREE.Group();
    var H = andares * 3.2;
    var tex = fachada(Math.round(largura / 3), andares, acesas);
    var mFach = new THREE.MeshStandardMaterial({
      map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: .85, roughness: .8
    });
    g.add(caixa(largura, H, fundura, mFach, 0, H / 2 + 4.4, 0));
    // Térreo de loja, platibanda e caixa d'água: é o que faz prédio carioca.
    g.add(caixa(largura + .6, 4.4, fundura + .6, mat(0x1a2c46, .85), 0, 2.2, 0));
    g.add(caixa(largura + .9, 1.6, fundura + .9, mat(CREME_ESCURO, .9), 0, H + 5.2, 0));
    var cx = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 3, 14), mat(CREME_ESCURO, .9));
    cx.position.set(largura / 4, H + 7.5, 0);
    cx.castShadow = true;
    g.add(cx);
    var mVitrine = new THREE.MeshStandardMaterial({
      color: 0x2a3d55, emissive: LUZ, emissiveIntensity: .7, roughness: .2
    });
    [-1, 1].forEach(function (s) {
      g.add(caixa(largura / 3, 3, .3, mVitrine, s * largura / 4, 2.4, fundura / 2 + .16));
    });
    g.userData.fachada = mFach;
    g.userData.altura = H + 8;
    return g;
  }

  /* Torre com sacada em laje: silhueta de orla, sem virar outro bloco. */
  function torre(andares, largura, fundura, acesas) {
    var g = predio(andares, largura, fundura, acesas), i, gr;
    for (i = 2; i < andares; i += 2) {
      g.add(caixa(largura + 1.4, .34, 2.4, mat(CREME_ESCURO, .9), 0, 4.4 + i * 3.2, fundura / 2 + .9));
      gr = grade(largura + 1.2, 1.1, mat(OURO, .45, .5), 1.3);
      gr.position.set(0, 4.4 + i * 3.2 + .2, fundura / 2 + 2);
      g.add(gr);
    }
    return g;
  }

  /* Placa de nome: sprite de canvas. Em cena clicável o rótulo não pode ficar
     só no cursor, senão no toque ninguém descobre que dá para clicar. */
  function placa(texto) {
    var c = document.createElement('canvas');
    c.width = 512; c.height = 128;
    var x = c.getContext('2d');
    x.font = '600 62px "Josefin Sans", system-ui, sans-serif';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = '#f3efe4';
    x.fillText(texto, 256, 52);
    x.fillStyle = '#c9a24c';
    x.fillRect(196, 98, 120, 5);
    var t = new THREE.CanvasTexture(c);
    if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding;
    var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
    s.scale.set(24, 6, 1);
    return s;
  }

  /* =========================================================== MONTAGEM */
  function montar(alvo, aoEscolher, op) {
    if (!window.THREE) return null;
    THREE = window.THREE;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;

    op = op || {};
    var rua = op.modo === 'rua';
    var largura = alvo.clientWidth || 960, alturaPx = alvo.clientHeight || 420;

    var cena = new THREE.Scene();
    cena.fog = new THREE.Fog(0x102a4c, rua ? 140 : 80, rua ? 300 : 190);

    var camera = new THREE.PerspectiveCamera(rua ? 32 : 30, largura / alturaPx, .5, 600);

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch (e) { return null; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(largura, alturaPx, false);
    if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    alvo.appendChild(renderer.domElement);

    var grupo = new THREE.Group();
    cena.add(grupo);

    /* Calçada e rua. O carro passa longe: aqui a rua é só a faixa escura que
       dá o corte na frente do terreno. */
    var piso = new THREE.Mesh(
      new THREE.PlaneGeometry(620, 460),
      new THREE.MeshStandardMaterial({ map: pisoDaCalcada(renderer.capabilities.getMaxAnisotropy()), roughness: .95 })
    );
    piso.rotation.x = -Math.PI / 2;
    piso.receiveShadow = true;
    grupo.add(piso);

    /* Faixa de asfalto so na rua: na abertura a camera fica baixa e a faixa
       entrava como cunha escura na frente da casa, lendo como sombra torta. */
    if (rua) {
      var asfalto = new THREE.Mesh(new THREE.PlaneGeometry(520, 60), mat(ASFALTO, .92));
      asfalto.rotation.x = -Math.PI / 2;
      asfalto.position.set(0, .03, 56);
      asfalto.receiveShadow = true;
      grupo.add(asfalto);
    }

    var escolhiveis = [];
    if (rua) {
      [{ chave: 'Centro', x: -42, no: predio(9, 19, 15, .46) },
       { chave: 'Tijuca', x: 2, no: sobrado() },
       { chave: 'Zona Sul', x: 45, no: torre(11, 15, 14, .42) }
      ].forEach(function (v) {
        var no = new THREE.Group();
        no.add(v.no);
        var p = placa(v.chave);
        p.position.set(0, v.no.userData.altura + 7, 8);
        no.add(p);
        no.position.set(v.x, 0, v.chave === 'Tijuca' ? -2 : 0);
        no.userData = { chave: v.chave, no: v.no, placa: p, y: 0 };
        grupo.add(no);
        escolhiveis.push(no);
      });
      camera.position.set(-4, 33, 122);
      camera.lookAt(2, 20, 4);
    } else {
      var casa = sobrado();
      casa.position.set(6, 0, -10);
      grupo.add(casa);
      camera.position.set(38, 15, 88);
      camera.lookAt(-10, 12, 0);
    }

    /* Luz de fim de tarde: chave dourada rasante à esquerda, contraluz fria
       para separar a silhueta do céu, e a lâmpada da varanda por dentro.
       A chave é a única que projeta sombra: uma basta para assentar o volume
       no chão, e é a sombra que tira a cena da aparência de adesivo. */
    cena.add(new THREE.HemisphereLight(0x7ba0cd, 0x0a1a30, .34));
    var chave = new THREE.DirectionalLight(0xffc98a, 1.02);
    chave.position.set(-84, 46, 20);
    chave.castShadow = true;
    chave.shadow.mapSize.set(1024, 1024);
    var d = rua ? 130 : 64;
    chave.shadow.camera.left = -d; chave.shadow.camera.right = d;
    chave.shadow.camera.top = d; chave.shadow.camera.bottom = -d;
    chave.shadow.camera.far = 320;
    chave.shadow.bias = -.0012;
    cena.add(chave);
    var contra = new THREE.DirectionalLight(0x8fb4e2, .42);
    contra.position.set(48, 32, -90);
    cena.add(contra);

    /* Interação: paralaxe leve no ponteiro. Na rua, o volume sob o cursor
       sobe e acende; o clique leva ao recorte. */
    var alvoRotY = 0, alvoRotX = 0, rotY = 0, rotX = 0;
    var raio = new THREE.Raycaster(), ponteiro = new THREE.Vector2(-2, -2), sobre = null;

    alvo.addEventListener('pointermove', function (ev) {
      var r = alvo.getBoundingClientRect();
      ponteiro.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
      ponteiro.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
      alvoRotY = ponteiro.x * (rua ? .10 : .13);
      alvoRotX = -ponteiro.y * .02;
    });
    alvo.addEventListener('pointerleave', function () {
      ponteiro.set(-2, -2); alvoRotY = 0; alvoRotX = 0; alvo.style.cursor = '';
    });
    alvo.addEventListener('click', function () {
      if (sobre && aoEscolher) aoEscolher(sobre.userData.chave);
    });

    var rodando = true, giro = 0, req = 0;

    function quadro() {
      req = requestAnimationFrame(quadro);
      if (!rodando) return;
      giro += .0011;
      rotY += (alvoRotY - rotY) * .06;
      rotX += (alvoRotX - rotX) * .06;
      grupo.rotation.y = Math.sin(giro) * (rua ? .05 : .085) + rotY;
      grupo.rotation.x = rotX;

      if (ponteiro.x > -1.5 && escolhiveis.length) {
        raio.setFromCamera(ponteiro, camera);
        var hits = raio.intersectObjects(escolhiveis, true), novo = null, o;
        if (hits.length) {
          o = hits[0].object;
          while (o && escolhiveis.indexOf(o) < 0) o = o.parent;
          novo = o;
        }
        if (novo !== sobre) { sobre = novo; alvo.style.cursor = sobre ? 'pointer' : ''; }
      }
      escolhiveis.forEach(function (c) {
        c.userData.y += ((c === sobre ? 2.4 : 0) - c.userData.y) * .12;
        c.position.y = c.userData.y;
        c.userData.placa.material.opacity = c === sobre ? 1 : .6;
        if (c.userData.no.userData.fachada) {
          c.userData.no.userData.fachada.emissiveIntensity = c === sobre ? 1.15 : .85;
        }
      });

      renderer.render(cena, camera);
    }
    req = requestAnimationFrame(quadro);

    function medir() {
      var l = alvo.clientWidth, a = alvo.clientHeight;
      if (!l || !a) return;
      camera.aspect = l / a; camera.updateProjectionMatrix();
      renderer.setSize(l, a, false);
    }
    window.addEventListener('resize', medir);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { rodando = es[0].isIntersecting; },
        { threshold: .05 }).observe(alvo);
    }

    alvo.setAttribute('data-pronta', 'true');
    return { medir: medir, parar: function () { cancelAnimationFrame(req); } };
  }

  window.CSCena = { montar: montar };
})();
