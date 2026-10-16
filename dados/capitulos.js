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

dadosAcrescentar('capitulos', {
  id: 'cap14',
  nivel: 14,
  criterio: [{ tipo: 'temIds', caminho: 'encyclopedia.unlocked', ids: ['azeitao_queijo', 'azeitao_adega', 'azeitao_palacio'] }],
  titulo: { pt: 'Queijo, Vinho e Palácios', en: 'Cheese, Wine and Palaces', es: 'Queso, Vino y Palacios' },
  objetivo: {
    pt: 'Descobre as 3 histórias de Azeitão na Enciclopédia.',
    en: 'Discover the 3 stories about Azeitão in the Encyclopedia.',
    es: 'Descubre las 3 historias de Azeitão en la Enciclopedia.'
  },
  conclusao: {
    pt: 'Queijo, vinho e palácios: Azeitão tem sabor a história. E agora também faz parte da nossa.',
    en: 'Cheese, wine and palaces: Azeitão tastes of history. And now it is part of ours too.',
    es: 'Queso, vino y palacios: Azeitão sabe a historia. Y ahora también forma parte de la nuestra.'
  }
});

dadosAcrescentar('capitulos', {
  id: 'cap15',
  nivel: 15,
  criterio: [{ tipo: 'temIds', caminho: 'encyclopedia.unlocked', ids: ['sesimbra_castelo', 'sesimbra_vila', 'sesimbra_espichel'] }],
  titulo: { pt: 'Entre o Castelo e o Mar', en: 'Between the Castle and the Sea', es: 'Entre el Castillo y el Mar' },
  objetivo: {
    pt: 'Descobre as 3 histórias de Sesimbra na Enciclopédia.',
    en: 'Discover the 3 stories about Sesimbra in the Encyclopedia.',
    es: 'Descubre las 3 historias de Sesimbra en la Enciclopedia.'
  },
  conclusao: {
    pt: 'Do castelo à baía e do cabo ao horizonte: Sesimbra já é nossa, e o caminho continua.',
    en: 'From the castle to the bay and from the cape to the horizon: Sesimbra is ours now, and the road goes on.',
    es: 'Del castillo a la bahía y del cabo al horizonte: Sesimbra ya es nuestra, y el camino continúa.'
  }
});

dadosAcrescentar('capitulos', {
  id: 'cap16',
  nivel: 16,
  criterio: [{ tipo: 'temIds', caminho: 'encyclopedia.unlocked', ids: ['setubal_forte', 'setubal_roxo', 'setubal_familias'] }],
  titulo: { pt: 'A Uva que Voltou', en: 'The Grape That Came Back', es: 'La Uva que Volvió' },
  objetivo: {
    pt: 'Descobre as 3 histórias de Setúbal na Enciclopédia.',
    en: 'Discover the 3 stories about Setúbal in the Encyclopedia.',
    es: 'Descubre las 3 historias de Setúbal en la Enciclopedia.'
  },
  conclusao: {
    pt: 'Do forte à uva que voltou: Setúbal já é nossa, e há mais caminho pela frente.',
    en: 'From the fort to the grape that came back: Setúbal is ours now, and there is more road ahead.',
    es: 'Del fuerte a la uva que volvió: Setúbal ya es nuestra, y queda más camino por delante.'
  }
});
