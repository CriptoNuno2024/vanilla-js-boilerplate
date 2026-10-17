// ---------------------------------------------------------------------
// ESTRADA — vizinhos e bens (Nível 7 "Vizinhos e Estrada"): PR 1, SÓ DADOS E TEXTOS.
//
// Dados lidos por js/estrada.js (o ecrã A Estrada, onde se trocam os bens) e por js/despensa.js (regras
// das trocas e das ofertas), como js/visitas.js é lido pela Quinta.
//
// Sete vizinhos (a Dona Amélia, o Sr. Joaquim, o Tomás e o Sr. Armindo, de nível 7, a Dona Natália, de nível 14, o Sr. Albano, de
// nível 17, e a Dona Fernanda, de nível 18), cada um com 3 falas e 1 fala de troca; e sete bens, um por vizinho. Os textos são pt/en/es.
//
// "nivelMinimo": o nível do jogador (js/niveis.js) a partir do qual o vizinho existe: abaixo dele não aparece na Estrada,
// não pede, não troca e não conta para nenhum cálculo (ver despensaVizinhoDisponivel em js/despensa.js). Sem o campo vale
// ESTRADA_NIVEL_MINIMO_PADRAO (7, o nível em que a Estrada abre); um valor que não seja um inteiro >= 1 deixa o vizinho fechado.
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

// O nível mínimo de um vizinho que não traga "nivelMinimo": o nível em que a Estrada abre (NIVEL_NECESSARIO_POR_ECRA.estrada).
const ESTRADA_NIVEL_MINIMO_PADRAO = 7;

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
  },
  e_konomista_torta: {
    titulo: 'e-konomista — Torta de Azeitão',
    url: 'https://www.e-konomista.pt/torta-de-azeitao/'
  },
  destination_eat_drink_torta: {
    titulo: 'Destination Eat Drink — Torta de Azeitão',
    url: 'https://destinationeatdrink.com/torta-de-azeitao/'
  },
  fodors_azeitao: {
    titulo: 'Fodor\'s — Vila Nogueira de Azeitão (restaurants)',
    url: 'https://cdn.fodors.com/world/europe/portugal/side-trips-from-lisbon/places/the-setubal-peninsula/vila-nogueira-de-azeitao/restaurants'
  },
  agroportal_pinhao: {
    titulo: 'Agroportal — O pinhão',
    url: 'https://bo.agroportal.pt/?p=738578'
  },
  agroportal_pinheiro_manso: {
    titulo: 'Agroportal — Pinheiro-manso e alterações climáticas: uma perspetiva ecofisiológica',
    url: 'https://www.agroportal.pt/pinheiro-manso-e-alteracoes-climaticas-uma-perspetiva-ecofisiologica'
  },
  agroportal_pinhao_alcacer: {
    titulo: 'Agroportal — Já estivemos melhor da pinha: o percurso acidentado do pinhão',
    url: 'https://bo.agroportal.pt/ja-estivemos-melhor-da-pinha-o-percurso-acidentado-do-pinhao'
  },
  ipb_pinhao: {
    titulo: 'Instituto Politécnico de Bragança — Pine nuts authenticity in the Portuguese market',
    url: 'https://bibliotecadigital.ipb.pt/entities/publication/c87a89f1-b7e4-4720-9439-9e3c9e70b33f/full'
  },
  oppla_pinha: {
    titulo: 'OPPLA — Manual cone harvesting of Pinus pinea in Portugal',
    url: 'https://oppla.eu/casestudy/20602'
  },
  agroportal_arroz_alcacer: {
    titulo: 'Agroportal — Alcácer do Sal: concelho que mais arroz produz tem feira dedicada ao sector',
    url: 'https://www.agroportal.pt/?p=763922'
  },
  uevora_arroz: {
    titulo: 'Universidade de Évora — A cultura do arroz em Portugal',
    url: 'https://rdpc.uevora.pt/bitstream/10174/15309/1/A%20cultura%20do%20arroz%20em%20Portugal.pdf'
  },
  visitportugal_museu_arroz: {
    titulo: 'Visit Portugal — Espaço Museológico Museu do Arroz',
    url: 'https://www.visitportugal.com/pt-pt/content/espaco-museologico-museu-do-arroz'
  },
  catavino_arroz: {
    titulo: 'Catavino — Portugal\'s Arroz Carolino: The Native Rice of Portuguese Gastronomy',
    url: 'https://catavino.net/portuguese-rice-arroz-carolino/'
  },
  iniav_arroz: {
    titulo: 'INIAV — Melhoramento do arroz carolino',
    url: 'https://projects.iniav.pt/redagrotec/images/Projetos/melhoramento_plantas/PA18653.pdf'
  },
  observador_arroz: {
    titulo: 'Observador — Portugueses comem 16 kg de arroz branco por ano, acima da média da UE',
    url: 'https://observador.pt/2023/03/13/portugueses-comem-16-kg-de-arroz-branco-por-ano-acima-da-media-da-uniao-europeia/'
  }
};

const ESTRADA_VIZINHOS = [
  {
    id: 'dona_amelia',
    nivelMinimo: 7,
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
    nivelMinimo: 7,
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
    nivelMinimo: 7,
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
    nivelMinimo: 7,
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
  },
  {
    id: 'dona_natalia',
    nivelMinimo: 14,
    nome: { pt: 'Dona Natália', en: 'Dona Natália', es: 'Dona Natália' },
    papel: { pt: 'pasteleira de Azeitão', en: 'Azeitão pastry cook', es: 'pastelera de Azeitão' },
    cara: 'assets/personagens/vizinha_natalia.jpg',
    caraPendente: false,
    bem: 'torta_azeitao',
    falas: [
      {
        id: 'dona_natalia_1',
        texto: {
          pt: 'A torta de Azeitão é um bolo fino, enrolado com doce de ovos e polvilhado com canela.',
          en: 'Torta de Azeitão is a thin sponge, rolled up with egg custard and dusted with cinnamon.',
          es: 'La torta de Azeitão es un bizcocho fino, enrollado con dulce de huevo y espolvoreado con canela.'
        },
        fonte: ['e_konomista_torta', 'fodors_azeitao']
      },
      {
        id: 'dona_natalia_2',
        texto: {
          pt: 'Diz-se que nasceu aqui, em Azeitão, numa família de pasteleiros, no fim do século XIX.',
          en: 'They say it was born right here in Azeitão, in a family of pastry makers, at the end of the 19th century.',
          es: 'Dicen que nació aquí, en Azeitão, en una familia de pasteleros, a finales del siglo XIX.'
        },
        fonte: ['e_konomista_torta', 'destination_eat_drink_torta']
      },
      {
        id: 'dona_natalia_3',
        texto: {
          pt: 'Com um cálice de Moscatel ao lado, nem se fala!',
          en: "With a glass of Moscatel beside it, you can't beat it!",
          es: '¡Con una copita de Moscatel al lado, no hay nada igual!'
        },
        semFacto: true
      }
    ],
    troca: {
      texto: {
        pt: 'Leva lá uma torta, vizinho! Fresquinha, ainda a cheirar a canela.',
        en: 'Take a torta, neighbour! Fresh, still smelling of cinnamon.',
        es: '¡Llévate una torta, vecino! Fresquita, todavía huele a canela.'
      },
      semFacto: true
    }
  },
  {
    id: 'sr_albano',
    nivelMinimo: 17,
    nome: { pt: 'Sr. Albano', en: 'Mr. Albano', es: 'Sr. Albano' },
    papel: { pt: 'apanhador de pinha de Alcácer', en: 'Alcácer pine cone picker', es: 'recolector de piñas de Alcácer' },
    cara: 'assets/personagens/vizinho_albano.jpg',
    caraPendente: false,
    bem: 'pinhao_alcacer',
    falas: [
      {
        id: 'sr_albano_1',
        texto: {
          pt: 'O pinhão é a semente do pinheiro-manso: cada pinha guarda-o lá dentro.',
          en: 'The pine nut is the seed of the stone pine: each cone keeps it inside.',
          es: 'El piñón es la semilla del pino piñonero: cada piña lo guarda dentro.'
        },
        fonte: ['agroportal_pinhao', 'ipb_pinhao']
      },
      {
        id: 'sr_albano_2',
        texto: {
          pt: 'Aqui em Alcácer dizem que esta terra é o «solar do pinhão».',
          en: "Here in Alcácer they say this land is the 'home of the pine nut'.",
          es: "Aquí en Alcácer dicen que esta tierra es el 'solar del piñón'."
        },
        fonte: ['agroportal_pinheiro_manso', 'agroportal_pinhao_alcacer']
      },
      {
        id: 'sr_albano_3',
        texto: {
          pt: 'Ainda há quem apanhe a pinha à mão, subindo às árvores com ferramentas próprias.',
          en: 'There are still people who pick the cones by hand, climbing the trees with special tools.',
          es: 'Todavía hay quien recoge las piñas a mano, subiendo a los árboles con herramientas propias.'
        },
        fonte: ['oppla_pinha', 'agroportal_pinhao']
      }
    ],
    troca: {
      texto: {
        pt: 'Leva lá uns pinhões, vizinho! Fresquinhos, acabados de sair da pinha.',
        en: 'Take some pine nuts, neighbour! Fresh, straight out of the cone.',
        es: '¡Llévate unos piñones, vecino! Frescos, recién salidos de la piña.'
      },
      semFacto: true
    }
  },
  {
    id: 'dona_fernanda',
    nivelMinimo: 18,
    nome: { pt: 'Dona Fernanda', en: 'Dona Fernanda', es: 'Dona Fernanda' },
    papel: { pt: 'arrozeira da Comporta', en: 'Comporta rice farmer', es: 'arrocera de la Comporta' },
    cara: 'assets/personagens/vizinha_fernanda.jpg',
    caraPendente: false,
    bem: 'arroz_sado',
    falas: [
      {
        id: 'dona_fernanda_1',
        texto: {
          pt: 'O arroz cresce com os pés na água: os arrozais ficam alagados, junto ao estuário do Sado.',
          en: 'Rice grows with its feet in the water: the paddies are flooded, right by the Sado estuary.',
          es: 'El arroz crece con los pies en el agua: los arrozales están inundados, junto al estuario del Sado.'
        },
        fonte: ['agroportal_arroz_alcacer', 'uevora_arroz']
      },
      {
        id: 'dona_fernanda_2',
        texto: {
          pt: 'Aqui na Comporta, a antiga fábrica de descasque é hoje o Museu do Arroz.',
          en: 'Here in Comporta, the old rice-hulling factory is now the Rice Museum.',
          es: 'Aquí en la Comporta, la antigua fábrica de descascarillado es hoy el Museo del Arroz.'
        },
        fonte: ['visitportugal_museu_arroz', 'catavino_arroz']
      },
      {
        id: 'dona_fernanda_3',
        texto: {
          pt: 'Os portugueses são os maiores comedores de arroz da Europa!',
          en: 'The Portuguese eat more rice per person than anyone else in Europe!',
          es: '¡Los portugueses son los que más arroz comen de toda Europa!'
        },
        fonte: ['iniav_arroz', 'observador_arroz']
      }
    ],
    troca: {
      texto: {
        pt: 'Leva lá um pacote de arroz, vizinho! Do bom carolino do Sado.',
        en: 'Take a bag of rice, neighbour! Good Sado carolino.',
        es: '¡Llévate un paquete de arroz, vecino! Del buen carolino del Sado.'
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
  },
  {
    id: 'torta_azeitao',
    nome: { pt: 'Torta de Azeitão', en: 'Azeitão roll cake', es: 'Torta de Azeitão' },
    descricao: {
      pt: 'Bolo fino enrolado, com doce de ovos e canela.',
      en: 'A thin sponge roll with egg custard and cinnamon.',
      es: 'Bizcocho fino enrollado con dulce de huevo y canela.'
    },
    fonte: ['e_konomista_torta', 'fodors_azeitao']
  },
  {
    id: 'pinhao_alcacer',
    nome: { pt: 'Pinhão de Alcácer', en: 'Alcácer pine nuts', es: 'Piñones de Alcácer' },
    descricao: {
      pt: 'A semente do pinheiro-manso, tirada da pinha.',
      en: 'The seed of the stone pine, taken from the cone.',
      es: 'La semilla del pino piñonero, sacada de la piña.'
    },
    fonte: ['agroportal_pinhao', 'ipb_pinhao']
  },
  {
    id: 'arroz_sado',
    nome: { pt: 'Arroz Carolino do Sado', en: 'Sado carolino rice', es: 'Arroz carolino del Sado' },
    descricao: {
      pt: 'Arroz carolino, cultivado em arrozais alagados junto ao estuário do Sado.',
      en: 'Carolino rice, grown in flooded paddies beside the Sado estuary.',
      es: 'Arroz carolino, cultivado en arrozales inundados junto al estuario del Sado.'
    },
    fonte: ['uevora_arroz', 'agroportal_arroz_alcacer']
  }
];

// REGRAS DAS TROCAS (as contas estão em js/despensa.js e o ecrã é js/estrada.js).
// Tudo o que rege as trocas está só aqui, com nomes claros.
//   custoUvas                 uvas pagas por uma troca (a 1.ª troca de cada bem, a "prova", paga com
//                             1 garrafa disponível se houver; senão com estas uvas)
//   uvasMinimasDepoisDaTroca  o jogador nunca fica com menos de 10 uvas depois de pagar em uvas
//                             (só troca com custoUvas + este piso = 35 ou mais), para poder usar o Prensar
//   prateleiraMaxima          no máximo 3 de cada bem na Despensa; com 3 não se cobra nada
//   trocasPorDiaTeto          teto de trocas por dia, somando os vizinhos que já existem para o jogador (nivelMinimo; dia de Lisboa)
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
//   'bagaceira' paga com 1 Bagaceira (state.adega.bagaceira, ver js/alambique.js); se o jogador não tiver nenhuma, paga as uvas
// A Dona Amélia pede uvas ou sal; o Sr. Armindo pede uvas, sal ou bagaceira; o Sr. Joaquim, o Tomás, a Dona Natália, o Sr. Albano e a Dona
// Fernanda pedem sempre uvas (sem entrada aqui, um vizinho pede uvas).
// (O pedido do dia sai do mesmo hash de sempre, por isso mudar o nº de pedidos do Sr. Armindo muda os dias em que pede cada um.)
const ESTRADA_PEDIDOS = {
  dona_amelia: ['uvas', 'sal_sado'],
  sr_joaquim: ['uvas'],
  tomas: ['uvas'],
  sr_armindo: ['uvas', 'sal_sado', 'bagaceira']
};

// Fala do pedido (só humor, sem factos: "semFacto: true", como as falas de troca): mostra-se no cartão do vizinho nos dias em que
// o pedido do dia é esse bem e o botão está ativo.
const ESTRADA_PEDIDO_FALAS = {
  bagaceira: {
    semFacto: true,
    texto: {
      pt: 'Tens aí uma bagaceira, vizinho? Com ela, a troca fica combinada.',
      en: 'Got a pomace spirit there, neighbour? With that, we have a deal.',
      es: '¿Tienes por ahí un aguardiente de orujo, vecino? Con eso, trato hecho.'
    }
  }
};

// OFERTAS A UMA VISITA (PR 5C): oferecer 1 bem da Despensa a uma visita da Quinta (js/visitas.js).
//   reputacao   +1 de Reputação por oferta
//   porDia      no máximo 1 oferta por dia (dia de Lisboa; a marca é state.despensa.ofertaDia)
//   ordemEmpate o bem oferecido é o de que há mais; em caso de empate, por esta ordem (um bem fora da lista, como a torta de
//               Azeitão, o pinhão de Alcácer e o arroz do Sado, vem a seguir aos da lista, pela ordem de ESTRADA_BENS: ver despensaBemParaOferecer em js/despensa.js)
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
