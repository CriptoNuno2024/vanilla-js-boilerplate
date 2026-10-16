#!/usr/bin/env node
// O NÍVEL 18 REAL, «Moscatel da Comporta» (Parte 2, A Terra, o arroz do Sado), que vive só como dados (dados/niveis.js, historias.js, enciclopedia.js e
// capitulos.js): o nível (11050 de Reputação), a história de 4 falas (a 1.ª com a foto assets/ecras/yoshi_nos_arrozais.jpg e a 3.ª com assets/ecras/yoshi_a_mesa.jpg, SEM som), as 3
// histórias do arroz do Sado na Enciclopédia (nível mínimo 18, sem imagem) e o capítulo 18 «O Arroz da Nossa Mesa» (critério temIds nessas 3).
// Só traz os textos e números do nível: a prova em si está no auxiliar scripts/_pacote-nivel.js. Textos escritos aqui, à parte (não lidos de dados/).
//
// Uso: node scripts/verificar-nivel-18.js
// JS_DIR=pasta  DADOS_DIR=pasta  correm sobre outra versão dos js/ ou dos dados/ (para provar que o teste apanha o que se estraga).
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const { correr } = require('./_pacote-nivel');

correr({
  nivel: 18,
  limiares: [0, 15, 50, 120, 300, 600, 1000, 1500, 2100, 2800, 3650, 4550, 5500, 6500, 7550, 8650, 9850, 11050],
  nome: { pt: 'Moscatel da Comporta', en: 'Comporta Moscatel', es: 'Moscatel de Comporta' },
  nomeAnt: { pt: 'Moscatel de Alcácer', en: 'Alcácer Moscatel', es: 'Moscatel de Alcácer' },
  foto: 'assets/ecras/yoshi_nos_arrozais.jpg',
  fotoRaiz: 'yoshi_nos_arrozais.jpg',
  fotosExtra: { 3: 'assets/ecras/yoshi_a_mesa.jpg' }, // a fala 3 também leva foto (as falas 2 e 4 não)
  falas: [
    {
      pt: 'Chegámos à Comporta, entre o mar e o Sado. Aqui a água desenha os campos de arroz.',
      en: "We've arrived in Comporta, between the sea and the Sado. Here the water draws the rice fields.",
      es: 'Hemos llegado a la Comporta, entre el mar y el Sado. Aquí el agua dibuja los campos de arroz.'
    },
    {
      pt: 'O arroz cultiva-se em terrenos planos, regados por alagamento. Em Portugal, sobretudo no Sado, no Tejo e no Mondego.',
      en: 'Rice grows on flat land, watered by flooding. In Portugal, mostly along the Sado, the Tagus and the Mondego.',
      es: 'El arroz se cultiva en terrenos llanos, regados por inundación. En Portugal, sobre todo en el Sado, el Tajo y el Mondego.'
    },
    {
      pt: 'Cuidados pelos produtores do vale do Sado, estes campos dão o arroz da nossa mesa. E nós comemos mais arroz do que qualquer outro país europeu.',
      en: 'Looked after by the growers of the Sado valley, these fields give us the rice on our table. And we eat more rice than any other European country.',
      es: 'Cuidados por los productores del valle del Sado, estos campos dan el arroz de nuestra mesa. Y comemos más arroz que cualquier otro país europeo.'
    },
    {
      pt: 'Arroz de marisco, de tamboril ou malandro: cada prato pode guardar um bocadinho do Sado.',
      en: 'Seafood rice, monkfish rice or arroz malandro: every dish can hold a little bit of the Sado.',
      es: 'Arroz de marisco, de rape o malandro: cada plato puede guardar un poquito del Sado.'
    }
  ],
  ids: ['arroz_arrozais', 'arroz_carolino', 'arroz_consumo'],
  enc: {
    arroz_arrozais: {
      titulo: { pt: 'Os arrozais do Sado', en: "The Sado's Rice Paddies", es: 'Los arrozales del Sado' },
      texto: {
        pt: 'O arroz cultiva-se em campos planos, regados por alagamento. Em Portugal há três grandes zonas: os estuários do Sado, do Tejo e do Mondego.',
        en: 'Rice grows on flat fields, watered by flooding. In Portugal there are three main areas: the Sado, Tagus and Mondego estuaries.',
        es: 'El arroz se cultiva en campos llanos, regados por inundación. En Portugal hay tres grandes zonas: los estuarios del Sado, del Tajo y del Mondego.'
      }
    },
    arroz_carolino: {
      titulo: { pt: 'O arroz carolino', en: 'Carolino Rice', es: 'El arroz carolino' },
      texto: {
        pt: 'O carolino é um arroz português de grão redondo, muito usado na cozinha tradicional porque absorve bem os sabores. Faz o arroz de marisco, o de tamboril e o malandro.',
        en: 'Carolino is a Portuguese round-grain rice, widely used in traditional cooking because it absorbs flavours well. It makes seafood rice, monkfish rice and arroz malandro.',
        es: 'El carolino es un arroz portugués de grano redondo, muy usado en la cocina tradicional porque absorbe bien los sabores. Con él se hacen el arroz de marisco, el de rape y el malandro.'
      }
    },
    arroz_consumo: {
      titulo: { pt: 'Maiores comedores de arroz', en: "Europe's Biggest Rice Eaters", es: 'Los mayores comedores de arroz de Europa' },
      texto: {
        pt: 'Portugal é o país europeu que mais arroz come por pessoa, muito acima de qualquer outro.',
        en: 'Portugal is the European country that eats the most rice per person, far more than any other.',
        es: 'Portugal es el país europeo que más arroz come por persona, muy por encima de cualquier otro.'
      }
    }
  },
  cap: {
    titulo: { pt: 'O Arroz da Nossa Mesa', en: 'The Rice on Our Table', es: 'El Arroz de Nuestra Mesa' },
    objetivo: { pt: 'Descobre as 3 histórias do arroz do Sado na Enciclopédia.', en: "Discover the 3 stories about the Sado's rice in the Encyclopedia.", es: 'Descubre las 3 historias del arroz del Sado en la Enciclopedia.' },
    conclusao: { pt: 'Dos arrozais à nossa mesa: a Comporta já é nossa, e o caminho continua.', en: 'From the paddies to our table: Comporta is ours now, and the road goes on.', es: 'De los arrozales a nuestra mesa: la Comporta ya es nuestra, y el camino continúa.' }
  },
  // As entradas dos pacotes anteriores, por grupo de nivelMinimo (11, 12, 13, 14, 15, 16, 17).
  grupos: [
    ['arrabida_biosfera', 'arrabida_plantas', 'arrabida_mar'],
    ['sado_reserva', 'sado_golfinhos', 'sado_troia'],
    ['palmela_castelo', 'palmela_capelo', 'palmela_castelao'],
    ['azeitao_queijo', 'azeitao_adega', 'azeitao_palacio'],
    ['sesimbra_castelo', 'sesimbra_vila', 'sesimbra_espichel'],
    ['setubal_forte', 'setubal_roxo', 'setubal_familias'],
    ['sal_alcacer', 'sal_setubal', 'sal_redura']
  ]
});
