#!/usr/bin/env node
// O NÍVEL 20 REAL, «Moscatel do Poeta» (Parte 2, A Terra, Bocage, o poeta de Setúbal), que vive só como dados (dados/niveis.js, historias.js, enciclopedia.js e
// capitulos.js): o nível (13750 de Reputação), a história de 4 falas (a 1.ª com a foto assets/ecras/casa_bocage.jpg e a 3.ª com assets/ecras/yoshicat_chizo_no_cais_de_setubal.jpg, SEM som), as 3
// histórias de Bocage na Enciclopédia (nível mínimo 20, sem imagem) e o capítulo 20 «O Poeta que Partiu» (critério temIds nessas 3).
// Só traz os textos e números do nível: a prova em si está no auxiliar scripts/_pacote-nivel.js. Textos escritos aqui, à parte (não lidos de dados/).
//
// Uso: node scripts/verificar-nivel-20.js
// JS_DIR=pasta  DADOS_DIR=pasta  correm sobre outra versão dos js/ ou dos dados/ (para provar que o teste apanha o que se estraga).
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const { correr } = require('./_pacote-nivel');

correr({
  nivel: 20,
  limiares: [0, 15, 50, 120, 300, 600, 1000, 1500, 2100, 2800, 3650, 4550, 5500, 6500, 7550, 8650, 9850, 11050, 12350, 13750],
  nome: { pt: 'Moscatel do Poeta', en: "Poet's Moscatel", es: 'Moscatel del Poeta' },
  nomeAnt: { pt: 'Moscatel do Montado', en: 'Montado Moscatel', es: 'Moscatel del Montado' },
  foto: 'assets/ecras/casa_bocage.jpg',
  fotoRaiz: 'casa_bocage.jpg',
  fotosExtra: { 3: 'assets/ecras/yoshicat_chizo_no_cais_de_setubal.jpg' }, // a fala 3 também leva foto (as falas 2 e 4 não)
  falas: [
    {
      pt: 'Hoje o Chizo trouxe-me ao centro de Setúbal, à Casa Bocage. Tem uma biblioteca só sobre um poeta.',
      en: 'Today Chizo brought me to the centre of Setúbal, to Casa Bocage. It has a library about just one poet.',
      es: 'Hoy Chizo me ha traído al centro de Setúbal, a la Casa Bocage. Tiene una biblioteca solo sobre un poeta.'
    },
    {
      pt: 'Chamava-se Manuel Maria Barbosa du Bocage e nasceu em Setúbal a 15 de setembro de 1765. Ainda hoje é feriado na cidade.',
      en: 'His name was Manuel Maria Barbosa du Bocage and he was born in Setúbal on 15 September 1765. It is still a holiday in the city.',
      es: 'Se llamaba Manuel Maria Barbosa du Bocage y nació en Setúbal el 15 de septiembre de 1765. Todavía hoy es fiesta en la ciudad.'
    },
    {
      pt: 'Aos 16 anos saiu daqui para estudar em Lisboa, e a vida levou-o até Macau.',
      en: 'At 16 he left here to study in Lisbon, and life took him as far as Macau.',
      es: 'A los 16 años salió de aquí para estudiar en Lisboa, y la vida lo llevó hasta Macao.'
    },
    {
      pt: 'A Quinta fica cá, Chizo, mas o caminho sai de Setúbal. Vamos ver até onde vai?',
      en: 'The Quinta stays here, Chizo, but the road leaves Setúbal. Shall we see how far it goes?',
      es: 'La Quinta se queda aquí, Chizo, pero el camino sale de Setúbal. ¿Vemos hasta dónde llega?'
    }
  ],
  ids: ['bocage_poeta', 'bocage_casa', 'bocage_dia'],
  enc: {
    bocage_poeta: {
      titulo: { pt: 'Bocage, o poeta de Setúbal', en: 'Bocage, the Poet of Setúbal', es: 'Bocage, el poeta de Setúbal' },
      texto: {
        pt: 'Manuel Maria Barbosa du Bocage nasceu em Setúbal em 1765. Saiu de casa aos 16 anos para estudar em Lisboa e tornou-se um dos grandes sonetistas da língua portuguesa. Morreu em Lisboa em 1805.',
        en: 'Manuel Maria Barbosa du Bocage was born in Setúbal in 1765. He left home at 16 to study in Lisbon and became one of the great sonnet writers of the Portuguese language. He died in Lisbon in 1805.',
        es: 'Manuel Maria Barbosa du Bocage nació en Setúbal en 1765. Salió de casa a los 16 años para estudiar en Lisboa y se convirtió en uno de los grandes sonetistas de la lengua portuguesa. Murió en Lisboa en 1805.'
      }
    },
    bocage_casa: {
      titulo: { pt: 'A Casa Bocage', en: 'Casa Bocage', es: 'La Casa Bocage' },
      texto: {
        pt: 'Em Setúbal, a Casa Bocage é uma casa-museu com uma biblioteca sobre a vida e a obra do poeta e com o arquivo fotográfico da cidade.',
        en: "In Setúbal, Casa Bocage is a house-museum with a library on the poet's life and work and the city's photographic archive.",
        es: 'En Setúbal, la Casa Bocage es una casa-museo con una biblioteca sobre la vida y la obra del poeta y el archivo fotográfico de la ciudad.'
      }
    },
    bocage_dia: {
      titulo: { pt: '15 de setembro', en: '15 September', es: '15 de septiembre' },
      texto: {
        pt: '15 de setembro é o dia do nascimento de Bocage e feriado municipal em Setúbal.',
        en: '15 September is the day Bocage was born and a municipal holiday in Setúbal.',
        es: 'El 15 de septiembre es el día del nacimiento de Bocage y fiesta municipal en Setúbal.'
      }
    }
  },
  cap: {
    titulo: { pt: 'O Poeta que Partiu', en: 'The Poet Who Set Out', es: 'El Poeta que Partió' },
    objetivo: { pt: 'Descobre as 3 histórias de Bocage na Enciclopédia.', en: 'Discover the 3 stories about Bocage in the Encyclopedia.', es: 'Descubre las 3 historias de Bocage en la Enciclopedia.' },
    conclusao: { pt: 'De Setúbal para o mundo: o poeta partiu, e o nosso caminho também continua.', en: 'From Setúbal to the world: the poet set out, and our road goes on too.', es: 'De Setúbal al mundo: el poeta partió, y nuestro camino también continúa.' }
  },
  // As entradas dos pacotes anteriores, por grupo de nivelMinimo (11, 12, 13, 14, 15, 16, 17, 18, 19).
  grupos: [
    ['arrabida_biosfera', 'arrabida_plantas', 'arrabida_mar'],
    ['sado_reserva', 'sado_golfinhos', 'sado_troia'],
    ['palmela_castelo', 'palmela_capelo', 'palmela_castelao'],
    ['azeitao_queijo', 'azeitao_adega', 'azeitao_palacio'],
    ['sesimbra_castelo', 'sesimbra_vila', 'sesimbra_espichel'],
    ['setubal_forte', 'setubal_roxo', 'setubal_familias'],
    ['sal_alcacer', 'sal_setubal', 'sal_redura'],
    ['arroz_arrozais', 'arroz_carolino', 'arroz_consumo'],
    ['sobreiro_cortica', 'sobreiro_assobiador', 'sobreiro_rolha']
  ]
});
