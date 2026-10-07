// ---------------------------------------------------------------------
// ESTRADA — vizinhos e bens (Nível 7 "Vizinhos e Estrada"): PR 1, SÓ DADOS E TEXTOS.
//
// Este ficheiro NÃO está carregado no index.html e nada o usa: ao jogador
// não muda nada. Fica pronto para os PRs seguintes (estado da Despensa,
// ecrã, trocas), que o vão ler como js/visitas.js é lido pela Quinta.
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
// "cara": caminho previsto da cara de cada vizinho. "caraPendente: true"
// = o ficheiro ainda NÃO existe (ver PERSONAGENS_CARAS em js/personagens.js
// quando as caras chegarem).
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
    cara: 'assets/personagens/vizinho_amelia.jpg',
    caraPendente: true,
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
          pt: 'Dizem que foi um senhor da Beira que trouxe as ovelhas, com saudades da Serra da Estrela.',
          en: 'They say a gentleman from the Beira brought the sheep, homesick for the Serra da Estrela.',
          es: 'Dicen que fue un señor de la Beira quien trajo las ovejas, con morriña de la Sierra de la Estrela.'
        },
        fonte: ['agroportal_988711']
      },
      {
        id: 'dona_amelia_3',
        texto: {
          pt: 'Pasta amanteigada e um picante no fim. Quem prova, volta.',
          en: 'A buttery paste with a little kick at the end. Whoever tastes it comes back.',
          es: 'Pasta mantecosa y un picante al final. Quien lo prueba, vuelve.'
        },
        fonte: ['kiwa_queijos_dop']
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
    caraPendente: true,
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
    caraPendente: true,
    bem: 'mel_sesimbra',
    falas: [
      {
        id: 'tomas_1',
        // A lista de plantas (alecrim, tomilho, orégãos, murta, esteva, rosmaninho) NÃO
        // foi confirmada nesta fonte: a ficha do Zimbramel só refere "plantas e produtos".
        // A confirmar antes do --final.
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

// PROPOSTA DE TROCA — PROVISÓRIA E SEM USO: números só para discutir, nenhum
// código a lê. Podem mudar por completo nos PRs das trocas.
//   custoUvas              cerca de 40 uvas por bem
//   custoMinimoUvas        nunca abaixo das 10 uvas do Prensar (ADEGA_CUSTO_UVAS_PRENSAR)
//   trocasPorVizinhoPorDia 1 troca por vizinho por dia (dia de Lisboa)
//   reputacaoPrimeiraTroca +2 de Reputação só na 1.ª troca de cada bem
//   sem gotas, sem castigos, sem dinheiro
const ESTRADA_TROCA_PROVISORIA = {
  provisoria: true,
  custoUvas: 40,
  custoMinimoUvas: 10,
  trocasPorVizinhoPorDia: 1,
  reputacaoPrimeiraTroca: 2
};
