#!/usr/bin/env node
// O NÍVEL 15 REAL, «Moscatel de Sesimbra» (Parte 2, A Terra), que vive só como dados (dados/niveis.js, historias.js, enciclopedia.js e
// capitulos.js): o nível (7550 de Reputação), a história de 4 falas (a 1.ª com a foto assets/ecras/sesimbra_vila.jpg, SEM som), as 3
// histórias de Sesimbra na Enciclopédia (nível mínimo 15, sem imagem) e o capítulo 15 «Entre o Castelo e o Mar» (critério temIds nessas 3).
// Só traz os textos e números do nível: a prova em si está no auxiliar scripts/_pacote-nivel.js. Textos escritos aqui, à parte (não lidos de dados/).
//
// Uso: node scripts/verificar-nivel-15.js
// JS_DIR=pasta  DADOS_DIR=pasta  correm sobre outra versão dos js/ ou dos dados/ (para provar que o teste apanha o que se estraga).
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const { correr } = require('./_pacote-nivel');

correr({
  nivel: 15,
  limiares: [0, 15, 50, 120, 300, 600, 1000, 1500, 2100, 2800, 3650, 4550, 5500, 6500, 7550],
  nome: { pt: 'Moscatel de Sesimbra', en: 'Sesimbra Moscatel', es: 'Moscatel de Sesimbra' },
  nomeAnt: { pt: 'Moscatel de Azeitão', en: 'Azeitão Moscatel', es: 'Moscatel de Azeitão' },
  foto: 'assets/ecras/sesimbra_vila.jpg',
  fotoRaiz: 'sesimbra_vila.jpg',
  falas: [
    {
      pt: 'Chegámos a Sesimbra. Lá em cima, o castelo olha o mar desde que os mouros o ergueram.',
      en: "We've arrived in Sesimbra. Up there, the castle has watched over the sea since the Moors built it.",
      es: 'Hemos llegado a Sesimbra. Allá arriba, el castillo mira al mar desde que lo levantaron los moros.'
    },
    {
      pt: 'D. Afonso Henriques tomou-o em 1165. Durante séculos, a vila viveu toda lá dentro, entre muralhas.',
      en: 'Afonso Henriques took it in 1165. For centuries, the whole town lived up there, inside the walls.',
      es: 'Afonso Henriques lo tomó en 1165. Durante siglos, la villa vivió toda allí dentro, entre murallas.'
    },
    {
      pt: 'Mas o mar chamava. A partir do século XV, as pessoas desceram até à baía para pescar e construir barcos.',
      en: 'But the sea was calling. From the 15th century on, people came down to the bay to fish and build boats.',
      es: 'Pero el mar llamaba. A partir del siglo XV, la gente bajó hasta la bahía para pescar y construir barcos.'
    },
    {
      pt: 'E ainda hoje há quem parta de madrugada. A vila mudou de sítio, mas nunca deixou o mar.',
      en: 'And still today some set out before dawn. The town changed place, but it never left the sea.',
      es: 'Y aún hoy hay quien sale de madrugada. La villa cambió de sitio, pero nunca dejó el mar.'
    }
  ],
  ids: ['sesimbra_castelo', 'sesimbra_vila', 'sesimbra_espichel'],
  enc: {
    sesimbra_castelo: {
      titulo: { pt: 'Castelo de Sesimbra', en: 'Sesimbra Castle', es: 'Castillo de Sesimbra' },
      texto: {
        pt: 'Fortificação de origem islâmica, conquistada em 1165 por D. Afonso Henriques e entregue mais tarde à Ordem de Santiago.',
        en: 'A fortress of Islamic origin, taken in 1165 by Afonso Henriques and later handed over to the Order of Santiago.',
        es: 'Fortaleza de origen islámico, conquistada en 1165 por Afonso Henriques y entregada más tarde a la Orden de Santiago.'
      }
    },
    sesimbra_vila: {
      titulo: { pt: 'A vila desce ao mar', en: 'The town comes down to the sea', es: 'La villa baja al mar' },
      texto: {
        pt: 'A partir do século XV, a pesca e a construção naval levaram os habitantes do castelo para a baía, onde nasceu a vila de hoje.',
        en: "From the 15th century on, fishing and shipbuilding drew the people of the castle down to the bay, where today's town was born.",
        es: 'A partir del siglo XV, la pesca y la construcción naval llevaron a los habitantes del castillo hasta la bahía, donde nació la villa de hoy.'
      }
    },
    sesimbra_espichel: {
      titulo: { pt: 'Cabo Espichel', en: 'Cape Espichel', es: 'Cabo Espichel' },
      texto: {
        pt: 'O culto à Senhora do Cabo remonta a 1410. A igreja atual foi construída entre 1701 e 1707.',
        en: 'Worship of Our Lady of the Cape dates back to 1410. The present church was built between 1701 and 1707.',
        es: 'El culto a Nuestra Señora del Cabo se remonta a 1410. La iglesia actual se construyó entre 1701 y 1707.'
      }
    }
  },
  cap: {
    titulo: { pt: 'Entre o Castelo e o Mar', en: 'Between the Castle and the Sea', es: 'Entre el Castillo y el Mar' },
    objetivo: { pt: 'Descobre as 3 histórias de Sesimbra na Enciclopédia.', en: 'Discover the 3 stories about Sesimbra in the Encyclopedia.', es: 'Descubre las 3 historias de Sesimbra en la Enciclopedia.' },
    conclusao: { pt: 'Do castelo à baía e do cabo ao horizonte: Sesimbra já é nossa, e o caminho continua.', en: 'From the castle to the bay and from the cape to the horizon: Sesimbra is ours now, and the road goes on.', es: 'Del castillo a la bahía y del cabo al horizonte: Sesimbra ya es nuestra, y el camino continúa.' }
  },
  // As entradas dos pacotes anteriores, por grupo de nivelMinimo (11, 12, 13, 14).
  grupos: [
    ['arrabida_biosfera', 'arrabida_plantas', 'arrabida_mar'],
    ['sado_reserva', 'sado_golfinhos', 'sado_troia'],
    ['palmela_castelo', 'palmela_capelo', 'palmela_castelao'],
    ['azeitao_queijo', 'azeitao_adega', 'azeitao_palacio']
  ]
});
