// ---------------------------------------------------------------------
// ESTRADA — vizinhos e bens (Nível 7 "Vizinhos e Estrada"): PR 1, SÓ DADOS E TEXTOS.
//
// Dados lidos por js/estrada.js (ecrã só de leitura) e por js/despensa.js (regras das
// trocas, PR 5A: ainda sem ecrã que as chame), como js/visitas.js é lido pela Quinta.
//
// Quatro vizinhos (a Dona Amélia, o Sr. Joaquim, o Tomás e o Sr. Armindo), cada um com 3 falas
// e 1 fala de troca; e quatro bens, um por vizinho. Os textos são pt/en/es.
// Os de EN e ES foram escritos a partir do PT e NÃO foram revistos por um
// falante nativo.
//
// FACTOS REAIS SÓ COM FONTE: cada fala tem "fonte" (lista de ids de
// ESTRADA_FONTES) ou "semFacto: true" (só humor ou fala de troca). Cada bem
// tem "fonte". Não se acrescentam fontes que não estejam em ESTRADA_FONTES.
// Um texto provisório escreve-se "[por escrever]" (em pt, en e es);
// `node scripts/verificar-estrada.js --final` falha enquanto restar essa marca.
//
// "cara": caminho da cara de cada vizinho (128 x 128, como as de js/personagens.js).
// "caraPendente: false" = o ficheiro existe; "true" = ainda não existe. As caras
// ainda NÃO estão em PERSONAGENS_CARAS (js/personagens.js): isso fica para um PR seguinte.
// ---------------------------------------------------------------------

const ESTRADA_POR_ESCREVER = '[por escrever]';

// As únicas fontes autorizadas. "url" só existe quando há um endereço aprovado.
const ESTRADA_FONTES = {
  agroportal_dop: {
    titulo: 'Agroportal — Tudo sobre o Queijo de Azeitão DOP',
    url: 'https://www.agroportal.pt/tudo-sobre-o-queijo-de-azeitao-dop/'
  },
  agroportal_988711: {
    titulo: 'Agroportal — Queijo de Azeitão (ovelhas da Beira no século XIX, flor de cardo, área de Palmela, Sesimbra e Setúbal)',
    url: 'https://www.agroportal.pt/?p=988711'
  },
  kiwa_queijos_dop: {
    titulo: 'Kiwa — Queijos DOP (pasta do queijo)',
    url: 'https://www.kiwa.com/pt/pt/servicos/certificacao/queijos-dop-certificacao/'
  },
  infopedia_estuario_sado: {
    titulo: 'Infopedia — artigo "Reserva Natural do Estuário do Sado" (fama do sal de Setúbal, sem sais magnesianos, salinas entre a Mitrena e o Pontal)'
  },
  infopedia_alcacer_do_sal: {
    titulo: 'Infopedia — artigo "Alcácer do Sal" (o nome vem do sal)'
  },
  zimbramel: {
    titulo: 'Viral Agenda — Zimbramel, Feira do Mel da Península de Setúbal (criada em 1999, em Sesimbra; plantas e produtos)',
    url: 'https://www.viralagenda.com/pt/events/1821332/zimbramel-feira-do-mel-da-peninsula-de-setubal'
  },
  turismo_lisboa_choco: {
    titulo: 'Visit Lisboa — Choco Frito de Setúbal (o prato mais famoso de Setúbal, o choco frito)',
    url: 'https://www.visitlisboa.com/pt-pt/locais/choco-frito-de-setubal'
  },
  deco_choco_frito: {
    titulo: 'DECO Proteste — Choco frito de Setúbal: os melhores restaurantes (choco do Sado pequeno, mais rijo; muitas vezes congelado nos restaurantes)',
    url: 'https://www.deco.proteste.pt/familia-consumo/ferias-lazer/noticias/choco-frito-setubal-melhores-restaurantes-ricardo-dias-felner'
  },
  awards35_sado: {
    titulo: '35 Awards 2021 — Portugal (pescadores do Sado, na zona de Possanco; poucos e envelhecidos, o estuário ainda dá de comer)',
    url: 'https://35awards.com/winners2021/country/PT/'
  },
  ancient_history_troia: {
    titulo: 'Ancient History Sites — Roman Ruins of Troia (Tróia, em frente a Setúbal; séculos I a VI; salga de peixe)',
    url: 'https://www.ancient-history-sites.com/sites/roman-ruins-of-troia/'
  }
};

const ESTRADA_VIZINHOS = [
  {
    id: 'dona_amelia',
    nome: { pt: 'Dona Amélia', en: 'Dona Amélia', es: 'Dona Amélia' },
    papel: { pt: 'queijeira de Azeitão', en: 'Azeitão cheesemaker', es: 'quesera de Azeitão' },
    cara: 'assets/personagens/vizinha_amelia.jpg',
    caraPendente: false,
    bem: 'queijo_azeitao',
    falas: [
      {
        id: 'dona_amelia_1',
        texto: {
          pt: 'Leite de ovelha e flor de cardo, que nasce sozinha no monte. O resto é paciência.',
          en: 'Sheep\'s milk and thistle flower, which grows wild on the hillside. The rest is patience.',
          es: 'Leche de oveja y flor de cardo, que nace sola en el monte. Lo demás es paciencia.'
        },
        fonte: ['agroportal_dop', 'agroportal_988711']
      },
      {
        id: 'dona_amelia_2',
        texto: {
          pt: 'Dizem que foi um senhor da Beira que trouxe as ovelhas, com saudades da sua terra.',
          en: 'They say a gentleman from the Beira brought the sheep, homesick for his homeland.',
          es: 'Dicen que fue un señor de la Beira quien trajo las ovejas, con morriña de su tierra.'
        },
        fonte: ['agroportal_988711', 'agroportal_dop']
      },
      {
        id: 'dona_amelia_3',
        texto: {
          pt: 'Pasta amanteigada e um picante no fim. Quem prova, volta.',
          en: 'A buttery paste with a little kick at the end. Whoever tastes it comes back.',
          es: 'Pasta mantecosa y un picante al final. Quien lo prueba, vuelve.'
        },
        fonte: ['kiwa_queijos_dop', 'agroportal_dop']
      }
    ],
    troca: {
      texto: {
        pt: 'Queijo por uvas da Quinta? Combinado.',
        en: 'Cheese for Quinta grapes? Deal.',
        es: '¿Queso por uvas de la Quinta? Trato hecho.'
      },
      semFacto: true
    }
  },
  {
    id: 'sr_joaquim',
    nome: { pt: 'Sr. Joaquim', en: 'Mr. Joaquim', es: 'Sr. Joaquim' },
    papel: { pt: 'salineiro do Sado', en: 'Sado salt worker', es: 'salinero del Sado' },
    cara: 'assets/personagens/vizinho_joaquim.jpg',
    caraPendente: false,
    bem: 'sal_sado',
    falas: [
      {
        id: 'sr_joaquim_1',
        texto: {
          pt: 'O sal de Setúbal sempre teve fama de ser dos melhores. Dizem que é por lhe faltarem os sais magnesianos.',
          en: 'Setúbal salt has always had a reputation as one of the best. They say it is because it lacks magnesium salts.',
          es: 'La sal de Setúbal siempre ha tenido fama de ser de las mejores. Dicen que es porque le faltan las sales magnésicas.'
        },
        fonte: ['infopedia_estuario_sado']
      },
      {
        id: 'sr_joaquim_2',
        texto: {
          pt: 'As salinas ainda ocupam as margens do Sado, da Mitrena ao Pontal. Trabalho de sol e paciência.',
          en: 'The salt pans still line the banks of the Sado, from Mitrena to Pontal. Work of sun and patience.',
          es: 'Las salinas todavía ocupan las orillas del Sado, de Mitrena a Pontal. Trabajo de sol y paciencia.'
        },
        fonte: ['infopedia_estuario_sado']
      },
      {
        id: 'sr_joaquim_3',
        texto: {
          pt: 'Alcácer do Sal tem o sal no nome. Foi outrora um grande centro produtor.',
          en: 'Alcácer do Sal has salt in its name. It was once a major production centre.',
          es: 'Alcácer do Sal lleva la sal en el nombre. Fue en otro tiempo un gran centro productor.'
        },
        fonte: ['infopedia_alcacer_do_sal']
      }
    ],
    troca: {
      texto: {
        pt: 'Sal por uvas? Há troca.',
        en: 'Salt for grapes? It\'s a trade.',
        es: '¿Sal por uvas? Hay trato.'
      },
      semFacto: true
    }
  },
  {
    id: 'tomas',
    nome: { pt: 'Tomás', en: 'Tomás', es: 'Tomás' },
    papel: { pt: 'apicultor de Sesimbra', en: 'Sesimbra beekeeper', es: 'apicultor de Sesimbra' },
    cara: 'assets/personagens/vizinho_tomas.jpg',
    caraPendente: false,
    bem: 'mel_sesimbra',
    falas: [
      {
        id: 'tomas_1',
        // Lista de plantas confirmada na página da Zimbramel (Viral Agenda) pelo Claude.ai a 07/10/2026.
        texto: {
          pt: 'O mel daqui sabe ao que as abelhas encontram: alecrim, tomilho, orégãos, murta, esteva e rosmaninho.',
          en: 'The honey here tastes of whatever the bees find: rosemary, thyme, oregano, myrtle, rockrose and lavender.',
          es: 'La miel de aquí sabe a lo que encuentran las abejas: romero, tomillo, orégano, mirto, jara y cantueso.'
        },
        fonte: ['zimbramel']
      },
      {
        id: 'tomas_2',
        texto: {
          pt: 'Em Sesimbra há uma feira do mel desde 1999, a Zimbramel. Há cera, favos e doçaria.',
          en: 'In Sesimbra there has been a honey fair since 1999, the Zimbramel. There is wax, honeycomb and sweets.',
          es: 'En Sesimbra hay una feria de la miel desde 1999, la Zimbramel. Hay cera, panales y dulces.'
        },
        fonte: ['zimbramel']
      },
      {
        id: 'tomas_3',
        texto: {
          pt: 'Abelhas e videiras entendem-se bem, cada qual na sua flor.',
          en: 'Bees and vines get along well, each on its own flower.',
          es: 'Abejas y viñas se entienden bien, cada cual en su flor.'
        },
        semFacto: true
      }
    ],
    troca: {
      texto: {
        pt: 'Mel por uvas? Combinado. Mas não conte às abelhas.',
        en: 'Honey for grapes? Deal. But don\'t tell the bees.',
        es: '¿Miel por uvas? Trato hecho. Pero no se lo cuente a las abejas.'
      },
      semFacto: true
    }
  },
  {
    id: 'sr_armindo',
    nome: { pt: 'Sr. Armindo', en: 'Mr. Armindo', es: 'Sr. Armindo' },
    papel: { pt: 'pescador do Sado', en: 'Sado fisherman', es: 'pescador del Sado' },
    cara: 'assets/personagens/vizinho_armindo.jpg',
    caraPendente: false,
    bem: 'choco_sado',
    falas: [
      {
        id: 'sr_armindo_1',
        texto: {
          pt: 'Bom dia, vizinho. Pesco no Sado desde miúdo, cá pelos lados do Possanco. Já somos poucos e de cabelo branco, mas o estuário ainda dá de comer a muita gente.',
          en: 'Good morning, neighbour. I\'ve fished the Sado since I was a boy, around Possanco. There are few of us left, and white-haired, but the estuary still feeds many people.',
          es: 'Buenos días, vecino. Pesco en el Sado desde niño, por los lados de Possanco. Quedamos pocos y de pelo blanco, pero el estuario aún da de comer a mucha gente.'
        },
        fonte: ['awards35_sado']
      },
      {
        id: 'sr_armindo_2',
        texto: {
          pt: 'O choco do Sado é pequeno e pede mais mastigação do que o que se vê por aí. Mas é daqui. Nos restaurantes, muitas vezes já vem congelado.',
          en: 'Sado cuttlefish is small and takes more chewing than the kind you see around. But it\'s ours. In restaurants, it often comes frozen.',
          es: 'El choco del Sado es pequeño y pide más masticación que el que se ve por ahí. Pero es de aquí. En los restaurantes, muchas veces ya viene congelado.'
        },
        fonte: ['deco_choco_frito', 'turismo_lisboa_choco']
      },
      {
        id: 'sr_armindo_3',
        texto: {
          pt: 'Para guardar o peixe não há nada como o sal. Em Tróia, em frente a Setúbal, já os romanos salgavam peixe. Se me trouxeres sal do Sr. Joaquim, agradeço.',
          en: 'Nothing keeps fish like salt. At Tróia, across from Setúbal, the Romans were already salting fish. If you bring me salt from Mr. Joaquim, I\'d be grateful.',
          es: 'Para conservar el pescado no hay nada como la sal. En Tróia, frente a Setúbal, ya los romanos salaban pescado. Si me traes sal del Sr. Joaquim, te lo agradezco.'
        },
        fonte: ['ancient_history_troia']
      }
    ],
    troca: {
      texto: {
        pt: 'Um choco do Sado por umas uvas? Pequeno, mas é nosso.',
        en: 'A Sado cuttlefish for some grapes? Small, but ours.',
        es: '¿Un choco del Sado por unas uvas? Pequeño, pero nuestro.'
      },
      semFacto: true
    }
  }
];

const ESTRADA_BENS = [
  {
    id: 'queijo_azeitao',
    nome: { pt: 'Queijo de Azeitão', en: 'Azeitão cheese', es: 'Queso de Azeitão' },
    descricao: {
      pt: 'Queijo de ovelha de pasta amanteigada, feito com flor de cardo na região de Palmela, Sesimbra e Setúbal.',
      en: 'A sheep\'s milk cheese with a buttery paste, made with thistle flower in the Palmela, Sesimbra and Setúbal area.',
      es: 'Queso de oveja de pasta mantecosa, hecho con flor de cardo en la zona de Palmela, Sesimbra y Setúbal.'
    },
    fonte: ['agroportal_dop', 'agroportal_988711', 'kiwa_queijos_dop']
  },
  {
    id: 'sal_sado',
    nome: { pt: 'Sal do Sado', en: 'Sado salt', es: 'Sal del Sado' },
    descricao: {
      pt: 'Sal das salinas do estuário do Sado, entre a Mitrena e o Pontal.',
      en: 'Salt from the salt pans of the Sado estuary, between Mitrena and Pontal.',
      es: 'Sal de las salinas del estuario del Sado, entre Mitrena y Pontal.'
    },
    fonte: ['infopedia_estuario_sado']
  },
  {
    id: 'mel_sesimbra',
    nome: { pt: 'Mel de Sesimbra', en: 'Sesimbra honey', es: 'Miel de Sesimbra' },
    descricao: {
      pt: 'Mel da Península de Setúbal, que tem feira própria em Sesimbra, a Zimbramel.',
      en: 'Honey from the Setúbal Peninsula, which has its own fair in Sesimbra, the Zimbramel.',
      es: 'Miel de la Península de Setúbal, que tiene feria propia en Sesimbra, la Zimbramel.'
    },
    fonte: ['zimbramel']
  },
  {
    id: 'choco_sado',
    nome: { pt: 'Choco do Sado', en: 'Sado cuttlefish', es: 'Choco del Sado' },
    descricao: {
      pt: 'Choco pescado no estuário do Sado, ligado ao prato mais famoso de Setúbal: o choco frito.',
      en: 'Cuttlefish fished in the Sado estuary, tied to Setúbal\'s most famous dish: choco frito.',
      es: 'Choco pescado en el estuario del Sado, ligado al plato más famoso de Setúbal: el choco frito.'
    },
    fonte: ['turismo_lisboa_choco']
  }
];

// REGRAS DAS TROCAS (PR 5A: só regras e contas em js/despensa.js; nenhum ecrã as chama ainda).
// Tudo o que rege as trocas está só aqui, com nomes claros.
//   custoUvas                 uvas pagas por uma troca (a 1.ª troca de cada bem, a "prova", paga com
//                             1 garrafa disponível se houver; senão com estas uvas)
//   uvasMinimasDepoisDaTroca  o jogador nunca fica com menos de 10 uvas depois de pagar em uvas
//                             (só troca com custoUvas + este piso = 35 ou mais), para poder usar o Prensar
//   prateleiraMaxima          no máximo 3 de cada bem na Despensa; com 3 não se cobra nada
//   trocasPorDiaTeto          teto de trocas por dia, somando todos os vizinhos (dia de Lisboa)
//   trocasPorVizinhoPorDia    1 troca por vizinho por dia
//   reputacaoPrimeiraTroca    +2 de Reputação só na 1.ª troca de cada bem (nunca nas repetidas)
// Sem gotas e sem castigos: uma troca recusada não tira nada.
const ESTRADA_TROCA_CUSTO_UVAS = 25;
const ESTRADA_TROCA_UVAS_MINIMAS_DEPOIS = 10;
const ESTRADA_TROCA_PRATELEIRA_MAXIMA = 3;
const ESTRADA_TROCA_TETO_POR_DIA = 3;
const ESTRADA_TROCA_POR_VIZINHO_POR_DIA = 1;
const ESTRADA_TROCA_REPUTACAO_PRIMEIRA = 2;

const ESTRADA_TROCA = {
  custoUvas: ESTRADA_TROCA_CUSTO_UVAS,
  uvasMinimasDepoisDaTroca: ESTRADA_TROCA_UVAS_MINIMAS_DEPOIS,
  prateleiraMaxima: ESTRADA_TROCA_PRATELEIRA_MAXIMA,
  trocasPorDiaTeto: ESTRADA_TROCA_TETO_POR_DIA,
  trocasPorVizinhoPorDia: ESTRADA_TROCA_POR_VIZINHO_POR_DIA,
  reputacaoPrimeiraTroca: ESTRADA_TROCA_REPUTACAO_PRIMEIRA
};

// PEDIDO DO DIA (só nas trocas repetidas): o que cada vizinho pode pedir em vez das uvas. O dia
// escolhe, pelo hash de (dia + ':' + id do vizinho), um destes pedidos; é igual nas 3 línguas.
//   'uvas'     paga as uvas do costume (custoUvas)
//   'sal_sado' paga com 1 sal da Despensa; se o jogador não tiver sal, paga as uvas
// A Dona Amélia e o Sr. Armindo pedem uvas ou sal; o Sr. Joaquim e o Tomás pedem sempre uvas. (O bagaço está em pausa.)
const ESTRADA_PEDIDOS = {
  dona_amelia: ['uvas', 'sal_sado'],
  sr_joaquim: ['uvas'],
  tomas: ['uvas'],
  sr_armindo: ['uvas', 'sal_sado']
};

// OFERTAS A UMA VISITA (PR 5C): oferecer 1 bem da Despensa a uma visita da Quinta (js/visitas.js).
//   reputacao   +1 de Reputação por oferta
//   porDia      no máximo 1 oferta por dia (dia de Lisboa; a marca é state.despensa.ofertaDia)
//   ordemEmpate o bem oferecido é o de que há mais; em caso de empate, por esta ordem
const ESTRADA_OFERTA_REPUTACAO = 1;
const ESTRADA_OFERTA_POR_DIA = 1;
const ESTRADA_OFERTA = {
  reputacao: ESTRADA_OFERTA_REPUTACAO,
  porDia: ESTRADA_OFERTA_POR_DIA,
  ordemEmpate: ['queijo_azeitao', 'mel_sesimbra', 'sal_sado', 'choco_sado']
};

// Fala especial de cada visita (id de VISITAS_PERSONAGENS) para cada bem oferecido: só gratidão, curiosidade e
// carinho, sem factos (por isso "semFacto: true", como as outras falas de humor). Sem dizer qual Moscatel vai com
// qual produto.
const ESTRADA_OFERTA_FALAS = {
  valentim: {
    queijo_azeitao: { semFacto: true, texto: {
      pt: 'Queijo para um velho enólogo? Aceito e agradeço. Hoje o almoço vai ser bom.',
      en: 'Cheese for an old winemaker? I accept, and I thank you. Lunch will be good today.',
      es: '¿Queso para un viejo enólogo? Lo acepto y te lo agradezco. Hoy el almuerzo será bueno.' } },
    sal_sado: { semFacto: true, texto: {
      pt: 'Sal! Até a conversa fica com mais sabor. Obrigado, há prendas que sabem bem só de as receber.',
      en: 'Salt! Even the conversation tastes better. Thank you, some gifts feel good just to receive.',
      es: '¡Sal! Hasta la conversación tiene más sabor. Gracias, hay regalos que saben bien solo de recibirlos.' } },
    mel_sesimbra: { semFacto: true, texto: {
      pt: 'Mel para mim? Vou guardá-lo para as manhãs frias. Obrigado, de coração.',
      en: 'Honey for me? I\'ll keep it for the cold mornings. Thank you, from the heart.',
      es: '¿Miel para mí? La guardaré para las mañanas frías. Gracias, de corazón.' } },
    choco_sado: { semFacto: true, texto: {
      pt: 'Choco do Sado, pequeno, rijo e honesto. Como eu. Obrigado.',
      en: 'Sado cuttlefish, small, tough and honest. Like me. Thank you.',
      es: 'Choco del Sado, pequeño, duro y honesto. Como yo. Gracias.' } }
  },
  marisa: {
    queijo_azeitao: { semFacto: true, texto: {
      pt: 'Queijo! Salvaste-me o almoço. E o Sr. Valentim não precisa de saber.',
      en: 'Cheese! You saved my lunch. And Mr. Valentim doesn\'t need to know.',
      es: '¡Queso! Me has salvado el almuerzo. Y el Sr. Valentim no tiene por qué enterarse.' } },
    sal_sado: { semFacto: true, texto: {
      pt: 'Sal! Pouco glamour, muita gratidão. A marmita de amanhã agradece.',
      en: 'Salt! Not much glamour, a lot of gratitude. Tomorrow\'s lunchbox says thanks.',
      es: '¡Sal! Poco glamur, mucha gratitud. La fiambrera de mañana te lo agradece.' } },
    mel_sesimbra: { semFacto: true, texto: {
      pt: 'Mel! Vou pô-lo no pão e fingir que é domingo. Obrigada, a sério.',
      en: 'Honey! I\'ll put it on my bread and pretend it\'s Sunday. Thank you, truly.',
      es: '¡Miel! La pondré en el pan y fingiré que es domingo. Gracias, de verdad.' } },
    choco_sado: { semFacto: true, texto: {
      pt: 'Choco para o almoço? Até o Sr. Valentim vai calar-se. Obrigada.',
      en: 'Cuttlefish for lunch? Even Mr. Valentim will go quiet. Thank you.',
      es: '¿Choco para el almuerzo? Hasta el Sr. Valentim se callará. Gracias.' } }
  },
  henrique: {
    queijo_azeitao: { semFacto: true, texto: {
      pt: 'Queijo oferecido sem eu pedir: a melhor maneira de me conquistar. Obrigado, com todo o rigor do meu paladar.',
      en: 'Cheese offered without my asking: the best way to win me over. Thank you, with all the rigour of my palate.',
      es: 'Queso ofrecido sin pedirlo: la mejor manera de conquistarme. Gracias, con todo el rigor de mi paladar.' } },
    sal_sado: { semFacto: true, texto: {
      pt: 'Sal: o mais humilde dos presentes e o mais indispensável. Aceito com elegância.',
      en: 'Salt: the humblest of gifts and the most indispensable. I accept with elegance.',
      es: 'Sal: el más humilde de los regalos y el más indispensable. Lo acepto con elegancia.' } },
    mel_sesimbra: { semFacto: true, texto: {
      pt: 'Mel! Vou prová-lo devagar e com a seriedade que merece. Obrigado, é um gesto muito amável.',
      en: 'Honey! I will taste it slowly and with the seriousness it deserves. Thank you, that is a very kind gesture.',
      es: '¡Miel! La probaré despacio y con la seriedad que merece. Gracias, es un gesto muy amable.' } },
    choco_sado: { semFacto: true, texto: {
      pt: 'Um choco do Sado! Que presente tão maritimamente elegante. Aceito, com gratidão.',
      en: 'A Sado cuttlefish! What an elegantly maritime gift. I accept, with gratitude.',
      es: '¡Un choco del Sado! Qué regalo tan marítimamente elegante. Lo acepto, con gratitud.' } }
  }
};
