// Ficheiro de dados — ver dados/LEIAME.md. Cada entrada acrescenta-se com dadosAcrescentar('niveis', { ... }) (js/dados.js).
// Aqui vão os NÍVEIS novos: { id, min (maior que o do último nível), nome: { pt, en, es } }.
// Um nível novo traz sempre o pacote completo: este nível, a sua história (dados/historias.js) e o seu capítulo (dados/capitulos.js).

dadosAcrescentar('niveis', {
  id: 'nivel_11',
  min: 3650,
  nome: { pt: 'Moscatel da Arrábida', en: 'Arrábida Moscatel', es: 'Moscatel de la Arrábida' }
});

dadosAcrescentar('niveis', {
  id: 'nivel_12',
  min: 4550,
  nome: { pt: 'Moscatel do Sado', en: 'Sado Moscatel', es: 'Moscatel del Sado' }
});

dadosAcrescentar('niveis', {
  id: 'nivel_13',
  min: 5500,
  nome: { pt: 'Moscatel de Palmela', en: 'Palmela Moscatel', es: 'Moscatel de Palmela' }
});

dadosAcrescentar('niveis', {
  id: 'nivel_14',
  min: 6500,
  nome: { pt: 'Moscatel de Azeitão', en: 'Azeitão Moscatel', es: 'Moscatel de Azeitão' }
});
