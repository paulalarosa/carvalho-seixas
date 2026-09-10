/* Carvalho & Seixas · portfólio de exemplo.
   Nenhum imóvel aqui é real. Este arquivo é o que a manutenção mensal edita:
   sem banco, sem CRM. A contagem viva dos filtros é calculada daqui, no navegador. */
window.CS_IMOVEIS = [
  { codigo:'CS-0142', cena:'predio', titulo:'Apartamento na Conde de Bonfim', bairro:'Tijuca', regiao:'Tijuca',
    finalidade:'comprar', preco:780000, condominio:890, iptu:210,
    quartos:2, suites:1, banheiros:2, vagas:1, area:78, andar:'7º', ano:null,
    selos:['Exclusivo'], destaque:true,
    resumo:'Sala com dois ambientes, cozinha reformada e varanda voltada para o Maracanã. Prédio com portaria 24 horas, a 400 metros do metrô Uruguai.' },

  { codigo:'CS-0207', cena:'predio', titulo:'Studio a duas quadras do metrô', bairro:'Botafogo', regiao:'Zona Sul',
    finalidade:'alugar', preco:4200, condominio:640, iptu:null,
    quartos:1, suites:0, banheiros:1, vagas:0, area:32, andar:'11º', ano:2019,
    selos:['Novo','Temporada'], destaque:true,
    resumo:'Planta inteligente, mobiliado, com academia e lavanderia no prédio. Aceita temporada a partir de trinta dias.' },

  { codigo:'CS-0088', cena:'comercial', titulo:'Sala comercial reformada', bairro:'Centro', regiao:'Centro',
    finalidade:'comprar', preco:320000, condominio:1100, iptu:380,
    quartos:0, suites:0, banheiros:1, vagas:0, area:41, andar:'14º', ano:1978,
    selos:['Vendido'], destaque:false, fechado:true,
    resumo:'Andar alto na Avenida Rio Branco, com vista para a baía. Documentação conferida e condomínio em dia.' },

  { codigo:'CS-0311', cena:'casa', titulo:'Casa de vila na Muda', bairro:'Tijuca', regiao:'Tijuca',
    finalidade:'comprar', preco:1150000, condominio:0, iptu:340,
    quartos:3, suites:1, banheiros:3, vagas:2, area:164, andar:null, ano:1962,
    selos:['Exclusivo'], destaque:true,
    resumo:'Três quartos, quintal com árvore frutífera e garagem para dois carros. Vila fechada com oito casas e portão eletrônico.' },

  { codigo:'CS-0356', cena:'vista', titulo:'Cobertura duplex no Flamengo', bairro:'Flamengo', regiao:'Zona Sul',
    finalidade:'comprar', preco:2380000, condominio:2100, iptu:920,
    quartos:3, suites:2, banheiros:4, vagas:2, area:212, andar:'12º', ano:1994,
    selos:[], destaque:true,
    resumo:'Terraço com churrasqueira e vista para o aterro. Reformada em 2024, com esquadrias novas e ar-condicionado em todos os quartos.' },

  { codigo:'CS-0402', cena:'interior', titulo:'Conjugado no Largo do Machado', bairro:'Catete', regiao:'Zona Sul',
    finalidade:'alugar', preco:2350, condominio:520, iptu:95,
    quartos:1, suites:0, banheiros:1, vagas:0, area:28, andar:'5º', ano:1968,
    selos:[], destaque:false,
    resumo:'Reformado, com armários planejados. Prédio em frente à praça, com metrô e feira na esquina.' },

  { codigo:'CS-0455', cena:'comercial', titulo:'Loja de rua na Haddock Lobo', bairro:'Tijuca', regiao:'Tijuca',
    finalidade:'alugar', preco:8900, condominio:0, iptu:610,
    quartos:0, suites:0, banheiros:2, vagas:0, area:120, andar:null, ano:null,
    selos:[], destaque:false,
    resumo:'Ponto com fluxo alto, vitrine de seis metros e mezanino. Contrato com garantia por seguro-fiança.' },

  { codigo:'CS-0490', cena:'interior', titulo:'Apartamento de época na Glória', bairro:'Glória', regiao:'Centro',
    finalidade:'comprar', preco:640000, condominio:780, iptu:280,
    quartos:2, suites:0, banheiros:1, vagas:0, area:92, andar:'3º', ano:1938,
    selos:['Novo'], destaque:false,
    resumo:'Pé-direito alto, tacos originais e janelas de guilhotina. Prédio tombado, com obra de fachada já quitada.' },

  { codigo:'CS-0512', cena:'predio', titulo:'Dois quartos no Grajaú', bairro:'Grajaú', regiao:'Tijuca',
    finalidade:'comprar', preco:530000, condominio:610, iptu:180,
    quartos:2, suites:0, banheiros:1, vagas:1, area:68, andar:'2º', ano:1985,
    selos:[], destaque:false,
    resumo:'Sala ampla, dependência reversível e vaga escriturada. Rua tranquila, a cinco minutos da praça.' },

  { codigo:'CS-0533', cena:'vista', titulo:'Frente para a praia em Copacabana', bairro:'Copacabana', regiao:'Zona Sul',
    finalidade:'temporada', preco:890, condominio:0, iptu:null,
    quartos:2, suites:1, banheiros:2, vagas:0, area:86, andar:'9º', ano:1971,
    selos:['Temporada'], destaque:true, porNoite:true,
    resumo:'Vista frontal para o mar, dois quartos e diária mínima de três noites. Enxoval e limpeza inclusos.' }
];

window.CS_BAIRROS = [
  { nome:'Centro', chave:'Centro', cena:'predio',
    linha:'O escritório fica aqui, e é daqui que sai a papelada.',
    texto:'O Centro concentra os cartórios, a Prefeitura e a Junta Comercial. Quem compra aqui compra metro quadrado com história e um custo de condomínio que costuma surpreender, por isso a gente sempre abre a planilha antes da proposta.' },
  { nome:'Tijuca', chave:'Tijuca', cena:'casa',
    linha:'Bairro de família, com metrô e a floresta ali em cima.',
    texto:'A Tijuca é o bairro que mais aparece na nossa carteira. Casa de vila, prédio dos anos 60 e lançamento convivem na mesma rua, e o preço muda bastante entre a Conde de Bonfim e a Muda. Conhecer essa diferença é metade da negociação.' },
  { nome:'Zona Sul', chave:'Zona Sul', cena:'vista',
    linha:'Do Flamengo a Copacabana, incluindo temporada.',
    texto:'Na Zona Sul o investidor entra pela locação por temporada e o morador entra pelo metrô. São duas contas diferentes, e a gente faz as duas antes de indicar um imóvel.' }
];
