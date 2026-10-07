// ---------------------------------------------------------------------
// ESTRADA — vizinhos e bens (Nível 7 "Vizinhos e Estrada"): PR 1, SÓ DADOS E TEXTOS.
//
// Dados lidos por js/estrada.js (ecrã só de leitura) e por js/despensa.js (regras das
// trocas, PR 5A: ainda sem ecrã que as chame), como js/visitas.js é lido pela Quinta.
//
// Três vizinhos (a Dona Amélia, o Sr. Joaquim e o Tomás), cada um com 3 falas
// e 1 fala de troca; e três bens, um por vizinho. Os textos são pt/en/es.
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
// A Dona Amélia pede uvas ou sal; o Sr. Joaquim e o Tomás pedem sempre uvas. (O bagaço está em pausa.)
const ESTRADA_PEDIDOS = {
  dona_amelia: ['uvas', 'sal_sado'],
  sr_joaquim: ['uvas'],
  tomas: ['uvas']
};
