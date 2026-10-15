// Ficheiro de dados — ver dados/LEIAME.md. Cada entrada acrescenta-se com dadosAcrescentar('enciclopedia', { ... }) (js/dados.js).
// Aqui vão as HISTÓRIAS NOVAS DA ENCICLOPÉDIA: { id, titulo: { pt, en, es }, texto: { pt, en, es }, nivelMinimo (inteiro >= 1),
// imagem (opcional, caminho que exista em assets/), meses (opcional), estacao (opcional), manual (opcional, true) }.
// A entrada só existe para o jogador a partir do nível "nivelMinimo" e, depois, sai primeiro no Explorar (prioridade). O id não pode repetir nenhum id da Enciclopédia.

// Nível 11, "Moscatel da Arrábida": as 3 histórias que o capítulo 11 (dados/capitulos.js) pede. Sem imagem.
dadosAcrescentar('enciclopedia', {
  id: 'arrabida_biosfera',
  nivelMinimo: 11,
  titulo: { pt: 'A Arrábida, Reserva da Biosfera', en: 'The Arrábida, a Biosphere Reserve', es: 'La Arrábida, Reserva de la Biosfera' },
  texto: {
    pt: 'A 27 de setembro de 2025, a UNESCO reconheceu a Arrábida como Reserva da Biosfera, a 13.ª de Portugal. O pedido foi feito pelos municípios de Setúbal, Palmela e Sesimbra, com o ICNF.',
    en: "On 27 September 2025, UNESCO recognised the Arrábida as a Biosphere Reserve, the 13th in Portugal. The application was made by the municipalities of Setúbal, Palmela and Sesimbra, together with the ICNF (Portugal's nature conservation institute).",
    es: 'El 27 de septiembre de 2025, la UNESCO reconoció la Arrábida como Reserva de la Biosfera, la 13.ª de Portugal. La candidatura la presentaron los municipios de Setúbal, Palmela y Sesimbra, junto con el ICNF (el instituto de conservación de la naturaleza de Portugal).'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'arrabida_plantas',
  nivelMinimo: 11,
  titulo: { pt: 'Um Jardim de 1400 Plantas', en: 'A Garden of 1,400 Plants', es: 'Un Jardín de 1400 Plantas' },
  texto: {
    pt: 'Na Arrábida vivem mais de 1400 espécies de plantas, cerca de 40% da flora de Portugal. Setenta delas são raras ou endémicas.',
    en: "Over 1,400 plant species live in the Arrábida, about 40% of Portugal's flora. Seventy of them are rare or endemic.",
    es: 'En la Arrábida viven más de 1400 especies de plantas, cerca del 40% de la flora de Portugal. Setenta de ellas son raras o endémicas.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'arrabida_mar',
  nivelMinimo: 11,
  titulo: { pt: 'Da Serra ao Mar', en: 'From Sierra to Sea', es: 'De la Sierra al Mar' },
  texto: {
    pt: 'A reserva junta a serra e o mar: cerca de 200 espécies de vertebrados e mais de 2000 espécies marinhas. A pesca artesanal, a oliveira e o Moscatel de Setúbal fazem parte desta paisagem.',
    en: 'The reserve joins sierra and sea: about 200 vertebrate species and over 2,000 marine species. Artisanal fishing, the olive tree and Moscatel de Setúbal are part of this landscape.',
    es: 'La reserva une sierra y mar: unas 200 especies de vertebrados y más de 2000 especies marinas. La pesca artesanal, el olivo y el Moscatel de Setúbal forman parte de este paisaje.'
  }
});
