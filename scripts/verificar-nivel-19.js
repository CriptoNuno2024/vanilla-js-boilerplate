#!/usr/bin/env node
// O NÍVEL 19 REAL, «Moscatel do Montado» (Parte 2, A Terra, o sobreiro e a cortiça), que vive só como dados (dados/niveis.js, historias.js, enciclopedia.js e
// capitulos.js): o nível (12350 de Reputação), a história de 4 falas (a 1.ª com a foto assets/ecras/yoshi_no_montado.jpg e a 3.ª com assets/ecras/yoshi_sobreiro.jpg, SEM som), as 3
// histórias do sobreiro e da cortiça na Enciclopédia (nível mínimo 19, sem imagem) e o capítulo 19 «A Casca que Volta» (critério temIds nessas 3).
// Só traz os textos e números do nível: a prova em si está no auxiliar scripts/_pacote-nivel.js. Textos escritos aqui, à parte (não lidos de dados/).
//
// Uso: node scripts/verificar-nivel-19.js
// JS_DIR=pasta  DADOS_DIR=pasta  correm sobre outra versão dos js/ ou dos dados/ (para provar que o teste apanha o que se estraga).
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const { correr } = require('./_pacote-nivel');

correr({
  nivel: 19,
  limiares: [0, 15, 50, 120, 300, 600, 1000, 1500, 2100, 2800, 3650, 4550, 5500, 6500, 7550, 8650, 9850, 11050, 12350],
  nome: { pt: 'Moscatel do Montado', en: 'Montado Moscatel', es: 'Moscatel del Montado' },
  nomeAnt: { pt: 'Moscatel da Comporta', en: 'Comporta Moscatel', es: 'Moscatel de Comporta' },
  foto: 'assets/ecras/yoshi_no_montado.jpg',
  fotoRaiz: 'yoshi_no_montado.jpg',
  fotosExtra: { 3: 'assets/ecras/yoshi_sobreiro.jpg' }, // a fala 3 também leva foto (as falas 2 e 4 não)
  falas: [
    {
      pt: 'Entrámos no montado, a floresta de sobreiros do sul. Portugal é o maior produtor de cortiça do mundo.',
      en: "We've entered the montado, the cork oak forest of the south. Portugal is the world's biggest cork producer.",
      es: 'Hemos entrado en el montado, el bosque de alcornoques del sur. Portugal es el mayor productor de corcho del mundo.'
    },
    {
      pt: 'O sobreiro é a árvore nacional. Tira-se-lhe a casca de nove em nove anos, e ele continua a crescer.',
      en: 'The cork oak is the national tree. Its bark is taken every nine years, and it keeps on growing.',
      es: 'El alcornoque es el árbol nacional. Se le quita la corteza cada nueve años, y sigue creciendo.'
    },
    {
      pt: 'Em Águas de Moura vive o Assobiador, o sobreiro mais produtivo do mundo: numa colheita deu cortiça para 100 mil rolhas.',
      en: "In Águas de Moura lives the Assobiador, the world's most productive cork oak: in one harvest it gave enough cork for 100,000 stoppers.",
      es: 'En Águas de Moura vive el Assobiador, el alcornoque más productivo del mundo: en una cosecha dio corcho para 100 000 tapones.'
    },
    {
      pt: 'É dessas rolhas que vivem tantas garrafas de vinho. Até a rolha de um Moscatel pode ter nascido aqui.',
      en: "So many wine bottles depend on those stoppers. Even a Moscatel's stopper may have been born here.",
      es: 'De esos tapones dependen tantas botellas de vino. Hasta el tapón de un Moscatel puede haber nacido aquí.'
    }
  ],
  ids: ['sobreiro_cortica', 'sobreiro_assobiador', 'sobreiro_rolha'],
  enc: {
    sobreiro_cortica: {
      titulo: { pt: 'O sobreiro e a cortiça', en: 'The Cork Oak and Cork', es: 'El alcornoque y el corcho' },
      texto: {
        pt: 'O sobreiro é a Árvore Nacional de Portugal desde 2011 e é protegido por lei. A cortiça só se tira pela primeira vez aos 25 anos e depois de nove em nove anos, sem matar a árvore.',
        en: "The cork oak has been Portugal's National Tree since 2011 and is protected by law. Cork can only be taken for the first time at 25 years old and then every nine years, without killing the tree.",
        es: 'El alcornoque es el Árbol Nacional de Portugal desde 2011 y está protegido por ley. El corcho solo se extrae por primera vez a los 25 años y después cada nueve años, sin matar al árbol.'
      }
    },
    sobreiro_assobiador: {
      titulo: { pt: 'O Assobiador', en: 'The Assobiador', es: 'El Assobiador' },
      texto: {
        pt: 'Em Águas de Moura, em Palmela, vive o Assobiador, o sobreiro mais produtivo do mundo. Numa só colheita deu cortiça para 100 mil rolhas.',
        en: "In Águas de Moura, in Palmela, lives the Assobiador, the world's most productive cork oak. In a single harvest it gave enough cork for 100,000 stoppers.",
        es: 'En Águas de Moura, en Palmela, vive el Assobiador, el alcornoque más productivo del mundo. En una sola cosecha dio corcho para 100 000 tapones.'
      }
    },
    sobreiro_rolha: {
      titulo: { pt: 'A rolha', en: 'The Stopper', es: 'El tapón' },
      texto: {
        pt: 'A cortiça fecha a maioria das garrafas de vinho do mundo, e as rolhas são mais de 70% do que Portugal exporta em cortiça.',
        en: "Cork seals most of the world's wine bottles, and stoppers make up over 70% of what Portugal exports in cork.",
        es: 'El corcho cierra la mayoría de las botellas de vino del mundo, y los tapones son más del 70 % de lo que Portugal exporta en corcho.'
      }
    }
  },
  cap: {
    titulo: { pt: 'A Casca que Volta', en: 'The Bark That Grows Back', es: 'La Corteza que Vuelve' },
    objetivo: { pt: 'Descobre as 3 histórias do sobreiro e da cortiça na Enciclopédia.', en: 'Discover the 3 stories about the cork oak and cork in the Encyclopedia.', es: 'Descubre las 3 historias del alcornoque y el corcho en la Enciclopedia.' },
    conclusao: { pt: 'Do montado à rolha: o sobreiro já é nosso, e o caminho continua.', en: 'From the montado to the stopper: the cork oak is ours now, and the road goes on.', es: 'Del montado al tapón: el alcornoque ya es nuestro, y el camino continúa.' }
  },
  // As entradas dos pacotes anteriores, por grupo de nivelMinimo (11, 12, 13, 14, 15, 16, 17, 18).
  grupos: [
    ['arrabida_biosfera', 'arrabida_plantas', 'arrabida_mar'],
    ['sado_reserva', 'sado_golfinhos', 'sado_troia'],
    ['palmela_castelo', 'palmela_capelo', 'palmela_castelao'],
    ['azeitao_queijo', 'azeitao_adega', 'azeitao_palacio'],
    ['sesimbra_castelo', 'sesimbra_vila', 'sesimbra_espichel'],
    ['setubal_forte', 'setubal_roxo', 'setubal_familias'],
    ['sal_alcacer', 'sal_setubal', 'sal_redura'],
    ['arroz_arrozais', 'arroz_carolino', 'arroz_consumo']
  ]
});
