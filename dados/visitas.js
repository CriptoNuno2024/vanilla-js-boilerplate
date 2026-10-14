// Ficheiro de dados — ver dados/LEIAME.md. Cada entrada acrescenta-se com dadosAcrescentar('visitas', { ... }) (js/dados.js).
// Aqui vão as VISITAS novas: { id, personagem, reputacao (1 a 3), condicao (ou null), texto: { pt, en, es } }.
// A personagem tem de existir em VISITAS_PERSONAGENS (js/visitas.js).

dadosAcrescentar('visitas', {
  id: 'marisa_5',
  personagem: 'marisa',
  reputacao: 1,
  condicao: { tipo: 'fase', valores: ['quedaFolha'] },
  texto: {
    pt: 'Depois da vindima, a vinha parece uma sala depois da festa: folhas por todo o lado e ninguém com vontade de arrumar. Eu arrumo.',
    en: 'After the harvest, the vineyard looks like a room after a party: leaves everywhere and nobody feeling like tidying up. I tidy up.',
    es: 'Después de la vendimia, la viña parece una sala después de la fiesta: hojas por todas partes y nadie con ganas de recoger. Yo recojo.'
  }
});
