#!/usr/bin/env node
// O NÍVEL 14 REAL, «Moscatel de Azeitão» (Parte 2, A Terra), que vive só como dados (dados/niveis.js, historias.js, enciclopedia.js e
// capitulos.js): o nível (6500 de Reputação), a história de 4 falas (a 1.ª com a foto assets/ecras/azeitao_vila.jpg, SEM som), as 3
// histórias de Azeitão na Enciclopédia (nível mínimo 14, sem imagem) e o capítulo 14 «Queijo, Vinho e Palácios» (critério temIds nessas 3).
// Mesmo molde de scripts/verificar-nivel-13.js, agora no auxiliar scripts/_pacote-nivel.js (que recebe os textos e números deste nível).
// Textos escritos aqui, à parte (não lidos de dados/).
//
// Uso: node scripts/verificar-nivel-14.js
// JS_DIR=pasta  DADOS_DIR=pasta  correm sobre outra versão dos js/ ou dos dados/ (para provar que o teste apanha o que se estraga).
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const { correr } = require('./_pacote-nivel');

correr({
  nivel: 14,
  limiares: [0, 15, 50, 120, 300, 600, 1000, 1500, 2100, 2800, 3650, 4550, 5500, 6500],
  nome: { pt: 'Moscatel de Azeitão', en: 'Azeitão Moscatel', es: 'Moscatel de Azeitão' },
  nomeAnt: { pt: 'Moscatel de Palmela', en: 'Palmela Moscatel', es: 'Moscatel de Palmela' },
  foto: 'assets/ecras/azeitao_vila.jpg',
  fotoRaiz: 'azeitao_vila.jpg',
  falas: [
    {
      pt: 'Ao pé da Serra da Arrábida fica Azeitão, terra de queijo, vinho e palácios. O YoshiCat vem ver como se vive e se trabalha por aqui.',
      en: 'At the foot of the Serra da Arrábida lies Azeitão, a land of cheese, wine and palaces. YoshiCat comes to see how people live and work here.',
      es: 'Al pie de la Sierra de la Arrábida está Azeitão, tierra de queso, vino y palacios. YoshiCat viene a ver cómo se vive y se trabaja por aquí.'
    },
    {
      pt: 'O Queijo de Azeitão é feito com leite de ovelha, na Península de Setúbal. Tem pasta mole e amanteigada, e o nome está protegido: é DOP.',
      en: "Azeitão Cheese is made with sheep's milk on the Setúbal Peninsula. It has a soft, buttery paste, and its name is protected: it is a PDO.",
      es: 'El Queso de Azeitão se hace con leche de oveja, en la Península de Setúbal. Tiene pasta blanda y mantecosa, y su nombre está protegido: es DOP.'
    },
    {
      pt: 'Em Azeitão há uma casa de vinhos fundada em 1834. Nas suas adegas ainda descansam moscatéis com mais de cem anos.',
      en: 'In Azeitão there is a wine house founded in 1834. In its cellars, Moscatel wines over a hundred years old still rest.',
      es: 'En Azeitão hay una casa de vinos fundada en 1834. En sus bodegas todavía reposan moscateles de más de cien años.'
    },
    {
      pt: 'Abriu: novas histórias de Azeitão na Enciclopédia.',
      en: 'Unlocked: new stories about Azeitão in the Encyclopedia.',
      es: 'Se abrió: nuevas historias de Azeitão en la Enciclopedia.'
    }
  ],
  ids: ['azeitao_queijo', 'azeitao_adega', 'azeitao_palacio'],
  enc: {
    azeitao_queijo: {
      titulo: { pt: 'O Queijo de Azeitão', en: 'Azeitão Cheese', es: 'El Queso de Azeitão' },
      texto: {
        pt: 'O Queijo de Azeitão é feito com leite de ovelha em Palmela, Sesimbra e Setúbal. Tem pasta mole e amanteigada e é DOP, ou seja, tem nome protegido.',
        en: "Azeitão Cheese is made with sheep's milk in Palmela, Sesimbra and Setúbal. It has a soft, buttery paste and is a PDO, which means its name is protected.",
        es: 'El Queso de Azeitão se hace con leche de oveja en Palmela, Sesimbra y Setúbal. Tiene pasta blanda y mantecosa y es DOP, es decir, su nombre está protegido.'
      }
    },
    azeitao_adega: {
      titulo: { pt: 'Uma Adega de 1834', en: 'A Cellar from 1834', es: 'Una Bodega de 1834' },
      texto: {
        pt: 'Em Vila Nogueira de Azeitão, a casa José Maria da Fonseca foi fundada em 1834. Nas suas adegas ainda descansam moscatéis com mais de cem anos.',
        en: 'In Vila Nogueira de Azeitão, the house of José Maria da Fonseca was founded in 1834. In its cellars, Moscatel wines over a hundred years old still rest.',
        es: 'En Vila Nogueira de Azeitão, la casa José Maria da Fonseca se fundó en 1834. En sus bodegas todavía reposan moscateles de más de cien años.'
      }
    },
    azeitao_palacio: {
      titulo: { pt: 'O Palácio dos Duques de Aveiro', en: 'The Palace of the Dukes of Aveiro', es: 'El Palacio de los Duques de Aveiro' },
      texto: {
        pt: 'Em Vila Nogueira de Azeitão fica o Palácio dos Duques de Aveiro. É um palácio renascentista, no chamado estilo chão português.',
        en: 'In Vila Nogueira de Azeitão stands the Palace of the Dukes of Aveiro. It is a Renaissance palace, in the so-called "plain Portuguese" style.',
        es: 'En Vila Nogueira de Azeitão se encuentra el Palacio de los Duques de Aveiro. Es un palacio renacentista, en el llamado estilo "chão" portugués.'
      }
    }
  },
  cap: {
    titulo: { pt: 'Queijo, Vinho e Palácios', en: 'Cheese, Wine and Palaces', es: 'Queso, Vino y Palacios' },
    objetivo: { pt: 'Descobre as 3 histórias de Azeitão na Enciclopédia.', en: 'Discover the 3 stories about Azeitão in the Encyclopedia.', es: 'Descubre las 3 historias de Azeitão en la Enciclopedia.' },
    conclusao: { pt: 'Queijo, vinho e palácios: Azeitão tem sabor a história. E agora também faz parte da nossa.', en: 'Cheese, wine and palaces: Azeitão tastes of history. And now it is part of ours too.', es: 'Queso, vino y palacios: Azeitão sabe a historia. Y ahora también forma parte de la nuestra.' }
  },
  // As entradas dos pacotes anteriores, por grupo de nivelMinimo (11, 12, 13).
  grupos: [
    ['arrabida_biosfera', 'arrabida_plantas', 'arrabida_mar'],
    ['sado_reserva', 'sado_golfinhos', 'sado_troia'],
    ['palmela_castelo', 'palmela_capelo', 'palmela_castelao']
  ]
});
