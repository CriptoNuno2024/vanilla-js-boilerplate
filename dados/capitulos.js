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
