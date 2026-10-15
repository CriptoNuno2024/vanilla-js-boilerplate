// Ficheiro de dados — ver dados/LEIAME.md. Cada entrada acrescenta-se com dadosAcrescentar('capitulos', { ... }) (js/dados.js).
// Aqui vão os CAPÍTULOS novos: { id, nivel, criterio: [ ... ], titulo, objetivo, conclusao: { pt, en, es }, falante }.
// O critério lê um caminho que já existe no estado do jogo.

dadosAcrescentar('capitulos', {
  id: 'cap11',
  nivel: 11,
  criterio: [{ tipo: 'temIds', caminho: 'encyclopedia.unlocked', ids: ['arrabida_biosfera', 'arrabida_plantas', 'arrabida_mar'] }],
  titulo: { pt: 'A Serra e o Mar', en: 'The Sierra and the Sea', es: 'La Sierra y el Mar' },
  objetivo: {
    pt: 'Descobre as 3 histórias da Arrábida na Enciclopédia.',
    en: 'Discover the 3 stories about the Arrábida in the Encyclopedia.',
    es: 'Descubre las 3 historias de la Arrábida en la Enciclopedia.'
  },
  conclusao: {
    pt: 'Serra, mar e vinha na mesma paisagem. A Arrábida já faz parte da nossa história.',
    en: 'Sierra, sea and vineyard in the same landscape. The Arrábida is now part of our story.',
    es: 'Sierra, mar y viña en el mismo paisaje. La Arrábida ya forma parte de nuestra historia.'
  }
});

dadosAcrescentar('capitulos', {
  id: 'cap12',
  nivel: 12,
  criterio: [{ tipo: 'temIds', caminho: 'encyclopedia.unlocked', ids: ['sado_reserva', 'sado_golfinhos', 'sado_troia'] }],
  titulo: { pt: 'O Rio e os Golfinhos', en: 'The River and the Dolphins', es: 'El Río y los Delfines' },
  objetivo: {
    pt: 'Descobre as 3 histórias do Sado na Enciclopédia.',
    en: 'Discover the 3 stories about the Sado in the Encyclopedia.',
    es: 'Descubre las 3 historias del Sado en la Enciclopedia.'
  },
  conclusao: {
    pt: 'O rio, o peixe e os golfinhos contam a mesma história. O Sado já faz parte da nossa.',
    en: 'The river, the fish and the dolphins tell the same story. The Sado is now part of ours.',
    es: 'El río, el pescado y los delfines cuentan la misma historia. El Sado ya forma parte de la nuestra.'
  }
});

dadosAcrescentar('capitulos', {
  id: 'cap13',
  nivel: 13,
  criterio: [{ tipo: 'temIds', caminho: 'encyclopedia.unlocked', ids: ['palmela_castelo', 'palmela_capelo', 'palmela_castelao'] }],
  titulo: { pt: 'Do Castelo ao Mundo', en: 'From the Castle to the World', es: 'Del Castillo al Mundo' },
  objetivo: {
    pt: 'Descobre as 3 histórias de Palmela na Enciclopédia.',
    en: 'Discover the 3 stories about Palmela in the Encyclopedia.',
    es: 'Descubre las 3 historias de Palmela en la Enciclopedia.'
  },
  conclusao: {
    pt: 'Castelo, exploradores e vinha: Palmela já faz parte da nossa história.',
    en: 'Castle, explorers and vineyards: Palmela is now part of our story.',
    es: 'Castillo, exploradores y viñedos: Palmela ya forma parte de nuestra historia.'
  }
});
