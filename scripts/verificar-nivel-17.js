#!/usr/bin/env node
// O NÍVEL 17 REAL, «Moscatel de Alcácer» (Parte 2, A Terra, o sal do Sado), que vive só como dados (dados/niveis.js, historias.js, enciclopedia.js e
// capitulos.js): o nível (9850 de Reputação), a história de 4 falas (a 1.ª com a foto assets/ecras/sado_por_do_sol.png e a 3.ª com assets/ecras/sado_navio.jpg, SEM som), as 3
// histórias do sal do Sado na Enciclopédia (nível mínimo 17, sem imagem) e o capítulo 17 «O Sal que Navegou» (critério temIds nessas 3).
// Só traz os textos e números do nível: a prova em si está no auxiliar scripts/_pacote-nivel.js. Textos escritos aqui, à parte (não lidos de dados/).
//
// Uso: node scripts/verificar-nivel-17.js
// JS_DIR=pasta  DADOS_DIR=pasta  correm sobre outra versão dos js/ ou dos dados/ (para provar que o teste apanha o que se estraga).
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const { correr } = require('./_pacote-nivel');

correr({
  nivel: 17,
  limiares: [0, 15, 50, 120, 300, 600, 1000, 1500, 2100, 2800, 3650, 4550, 5500, 6500, 7550, 8650, 9850],
  nome: { pt: 'Moscatel de Alcácer', en: 'Alcácer Moscatel', es: 'Moscatel de Alcácer' },
  nomeAnt: { pt: 'Moscatel de Setúbal', en: 'Setúbal Moscatel', es: 'Moscatel de Setúbal' },
  foto: 'assets/ecras/sado_por_do_sol.png',
  fotoRaiz: 'sado_por_do_sol.png',
  fotosExtra: { 3: 'assets/ecras/sado_navio.jpg' }, // a fala 3 também leva foto (as falas 2 e 4 não); uma é PNG e a outra JPG
  falas: [
    {
      pt: 'Voltámos ao Sado, agora às salinas. Aqui o sol, o vento e a água fazem o sal.',
      en: "We're back on the Sado, now at the salt pans. Here the sun, the wind and the water make the salt.",
      es: 'Volvimos al Sado, ahora a las salinas. Aquí el sol, el viento y el agua hacen la sal.'
    },
    {
      pt: 'Foi com sal que Setúbal ganhou fama. Nos séculos XVI e XVII, era o maior centro de sal do país.',
      en: "Salt made Setúbal famous. In the 16th and 17th centuries, it was the country's biggest salt centre.",
      es: 'Con la sal Setúbal ganó fama. En los siglos XVI y XVII, era el mayor centro de sal del país.'
    },
    {
      pt: 'Navios do Norte da Europa vinham buscá-lo, e os salineiros colhiam-no na redura.',
      en: 'Ships from Northern Europe came to fetch it, and the salt workers gathered it at the redura.',
      es: 'Barcos del norte de Europa venían a buscarla, y los salineros la recogían en la redura.'
    },
    {
      pt: 'Hoje há menos salinas, mas ainda se faz sal no estuário do Sado.',
      en: 'Today there are fewer salt pans, but salt is still made in the Sado estuary.',
      es: 'Hoy hay menos salinas, pero todavía se hace sal en el estuario del Sado.'
    }
  ],
  ids: ['sal_alcacer', 'sal_setubal', 'sal_redura'],
  enc: {
    sal_alcacer: {
      titulo: { pt: 'Alcácer do Sal', en: 'Alcácer do Sal', es: 'Alcácer do Sal' },
      texto: {
        pt: 'Os romanos chamavam-lhe Salacia. Com os árabes passou a Alcácer e, mais tarde, a Alcácer do Sal, por ter sido um grande centro de produção de sal.',
        en: 'The Romans called it Salacia. Under the Arabs it became Alcácer and, later, Alcácer do Sal, because it was a great salt-producing centre.',
        es: 'Los romanos la llamaban Salacia. Con los árabes pasó a Alcácer y, más tarde, a Alcácer do Sal, por haber sido un gran centro de producción de sal.'
      }
    },
    sal_setubal: {
      titulo: { pt: 'O sal de Setúbal', en: "Setúbal's Salt", es: 'La sal de Setúbal' },
      texto: {
        pt: 'Nos séculos XVI e XVII, Setúbal foi o principal centro de produção e exportação de sal do país, sobretudo para o Norte da Europa. No fim do século XVII havia navios holandeses a carregar sal no seu porto.',
        en: "In the 16th and 17th centuries, Setúbal was the country's main salt-producing and exporting centre, mainly to Northern Europe. At the end of the 17th century, Dutch ships were loading salt in its port.",
        es: 'En los siglos XVI y XVII, Setúbal fue el principal centro de producción y exportación de sal del país, sobre todo hacia el norte de Europa. A finales del siglo XVII había barcos holandeses cargando sal en su puerto.'
      }
    },
    sal_redura: {
      titulo: { pt: 'A redura', en: 'The Redura', es: 'La redura' },
      texto: {
        pt: 'A colheita do sal chama-se redura. No século XIX, as salinas do Sado foram perdendo para as do Tejo, mas ainda hoje se faz sal tradicional no estuário do Sado.',
        en: 'The salt harvest is called the redura. In the 19th century, the Sado salt pans lost ground to those of the Tagus, but traditional salt is still made in the Sado estuary today.',
        es: 'La cosecha de la sal se llama redura. En el siglo XIX, las salinas del Sado fueron perdiendo frente a las del Tajo, pero todavía hoy se hace sal tradicional en el estuario del Sado.'
      }
    }
  },
  cap: {
    titulo: { pt: 'O Sal que Navegou', en: 'The Salt That Sailed', es: 'La Sal que Navegó' },
    objetivo: { pt: 'Descobre as 3 histórias do sal do Sado na Enciclopédia.', en: "Discover the 3 stories about the Sado's salt in the Encyclopedia.", es: 'Descubre las 3 historias de la sal del Sado en la Enciclopedia.' },
    conclusao: { pt: 'Do sal ao navio e do navio à mesa: o Sado já é nosso, e a viagem continua.', en: 'From salt to ship and from ship to table: the Sado is ours now, and the voyage goes on.', es: 'De la sal al barco y del barco a la mesa: el Sado ya es nuestro, y el viaje continúa.' }
  },
  // As entradas dos pacotes anteriores, por grupo de nivelMinimo (11, 12, 13, 14, 15, 16).
  grupos: [
    ['arrabida_biosfera', 'arrabida_plantas', 'arrabida_mar'],
    ['sado_reserva', 'sado_golfinhos', 'sado_troia'],
    ['palmela_castelo', 'palmela_capelo', 'palmela_castelao'],
    ['azeitao_queijo', 'azeitao_adega', 'azeitao_palacio'],
    ['sesimbra_castelo', 'sesimbra_vila', 'sesimbra_espichel'],
    ['setubal_forte', 'setubal_roxo', 'setubal_familias']
  ]
});
