#!/usr/bin/env node
// O NÍVEL 16 REAL, «Moscatel de Setúbal» (Parte 2, A Terra), que vive só como dados (dados/niveis.js, historias.js, enciclopedia.js e
// capitulos.js): o nível (8650 de Reputação), a história de 4 falas (a 1.ª com a foto assets/ecras/yoshicat_sado_mirar.jpg e a 3.ª com assets/ecras/yoshicat_binoculos_sado.jpg, SEM som), as 3
// histórias de Setúbal na Enciclopédia (nível mínimo 16, sem imagem) e o capítulo 16 «A Uva que Voltou» (critério temIds nessas 3).
// Só traz os textos e números do nível: a prova em si está no auxiliar scripts/_pacote-nivel.js. Textos escritos aqui, à parte (não lidos de dados/).
//
// Uso: node scripts/verificar-nivel-16.js
// JS_DIR=pasta  DADOS_DIR=pasta  correm sobre outra versão dos js/ ou dos dados/ (para provar que o teste apanha o que se estraga).
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const { correr } = require('./_pacote-nivel');

correr({
  nivel: 16,
  limiares: [0, 15, 50, 120, 300, 600, 1000, 1500, 2100, 2800, 3650, 4550, 5500, 6500, 7550, 8650],
  nome: { pt: 'Moscatel de Setúbal', en: 'Setúbal Moscatel', es: 'Moscatel de Setúbal' },
  nomeAnt: { pt: 'Moscatel de Sesimbra', en: 'Sesimbra Moscatel', es: 'Moscatel de Sesimbra' },
  foto: 'assets/ecras/yoshicat_sado_mirar.jpg',
  fotoRaiz: 'yoshicat_sado_mirar.jpg',
  fotosExtra: { 3: 'assets/ecras/yoshicat_binoculos_sado.jpg' }, // a fala 3 também leva foto (as falas 2 e 4 não)
  falas: [
    {
      pt: 'Chegámos a Setúbal. Do alto do forte vê-se o rio Sado e, ao fundo, a península de Tróia.',
      en: "We've arrived in Setúbal. From the top of the fort you can see the Sado river and, far off, the Tróia peninsula.",
      es: 'Hemos llegado a Setúbal. Desde lo alto del fuerte se ven el río Sado y, al fondo, la península de Tróia.'
    },
    {
      pt: 'O Forte de São Filipe foi construído no século XVI, no tempo de Filipe II de Espanha, para defender a cidade dos piratas.',
      en: 'São Filipe Fort was built in the 16th century, in the time of Philip II of Spain, to defend the city from pirates.',
      es: 'El Fuerte de São Filipe se construyó en el siglo XVI, en tiempos de Felipe II de España, para defender la ciudad de los piratas.'
    },
    {
      pt: 'Cá em baixo, os produtores da península ajudaram a salvar uma uva rara que esteve quase a desaparecer: o Moscatel Roxo.',
      en: 'Down below, the growers of the peninsula helped save a rare grape that was almost lost: the Moscatel Roxo.',
      es: 'Allá abajo, los productores de la península ayudaron a salvar una uva rara que casi desapareció: la Moscatel Roxo.'
    },
    {
      pt: 'Hoje volta a dar vinhos premiados. Há coisas que quase se perdem, mas a terra guarda.',
      en: 'Today it makes award-winning wines again. Some things almost get lost, but the land keeps them.',
      es: 'Hoy vuelve a dar vinos premiados. Hay cosas que casi se pierden, pero la tierra las guarda.'
    }
  ],
  ids: ['setubal_forte', 'setubal_roxo', 'setubal_familias'],
  enc: {
    setubal_forte: {
      titulo: { pt: 'Forte de São Filipe', en: 'São Filipe Fort', es: 'Fuerte de São Filipe' },
      texto: {
        pt: 'Fortaleza do século XVI, construída no tempo de Filipe II de Espanha, que também foi rei de Portugal, para defender Setúbal dos piratas. Domina o estuário do Sado.',
        en: 'A 16th-century fortress, built in the time of Philip II of Spain, who was also king of Portugal, to defend Setúbal from pirates. It overlooks the Sado estuary.',
        es: 'Fortaleza del siglo XVI, construida en tiempos de Felipe II de España, que también fue rey de Portugal, para defender Setúbal de los piratas. Domina el estuario del Sado.'
      }
    },
    setubal_roxo: {
      titulo: { pt: 'A uva que quase se perdeu', en: 'The Grape That Was Almost Lost', es: 'La uva que casi se perdió' },
      texto: {
        pt: 'O Moscatel Roxo é uma casta rara, de uvas rosadas, usada há muito nos vinhos de Setúbal. Chegou a estar perto da extinção, mas foi replantada e volta a dar moscatéis premiados.',
        en: "Moscatel Roxo is a rare grape with pink berries, used for a long time in Setúbal's wines. It came close to extinction, but it was replanted and is again making award-winning moscatels.",
        es: 'La Moscatel Roxo es una variedad rara, de uvas rosadas, usada desde hace mucho en los vinos de Setúbal. Estuvo cerca de la extinción, pero se replantó y vuelve a dar moscateles premiados.'
      }
    },
    setubal_familias: {
      titulo: { pt: 'Famílias do Moscatel', en: 'Moscatel Families', es: 'Familias del Moscatel' },
      texto: {
        pt: 'Na Península de Setúbal há produtores familiares que fazem moscatéis há mais de cem anos. A Venâncio da Costa Lima, por exemplo, produz-os desde 1914.',
        en: 'On the Setúbal Peninsula there are family producers who have been making moscatel for over a hundred years. Venâncio da Costa Lima, for example, has produced it since 1914.',
        es: 'En la Península de Setúbal hay productores familiares que elaboran moscatel desde hace más de cien años. Venâncio da Costa Lima, por ejemplo, lo produce desde 1914.'
      }
    }
  },
  cap: {
    titulo: { pt: 'A Uva que Voltou', en: 'The Grape That Came Back', es: 'La Uva que Volvió' },
    objetivo: { pt: 'Descobre as 3 histórias de Setúbal na Enciclopédia.', en: 'Discover the 3 stories about Setúbal in the Encyclopedia.', es: 'Descubre las 3 historias de Setúbal en la Enciclopedia.' },
    conclusao: { pt: 'Do forte à uva que voltou: Setúbal já é nossa, e há mais caminho pela frente.', en: 'From the fort to the grape that came back: Setúbal is ours now, and there is more road ahead.', es: 'Del fuerte a la uva que volvió: Setúbal ya es nuestra, y queda más camino por delante.' }
  },
  // As entradas dos pacotes anteriores, por grupo de nivelMinimo (11, 12, 13, 14, 15).
  grupos: [
    ['arrabida_biosfera', 'arrabida_plantas', 'arrabida_mar'],
    ['sado_reserva', 'sado_golfinhos', 'sado_troia'],
    ['palmela_castelo', 'palmela_capelo', 'palmela_castelao'],
    ['azeitao_queijo', 'azeitao_adega', 'azeitao_palacio'],
    ['sesimbra_castelo', 'sesimbra_vila', 'sesimbra_espichel']
  ]
});
