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

// Nível 12, «Moscatel do Sado»: as 3 histórias que o capítulo 12 (dados/capitulos.js) pede. Sem imagem.
dadosAcrescentar('enciclopedia', {
  id: 'sado_reserva',
  nivelMinimo: 12,
  titulo: { pt: 'Uma Reserva Entre o Rio e o Mar', en: 'A Reserve Between River and Sea', es: 'Una Reserva Entre el Río y el Mar' },
  texto: {
    pt: 'A Reserva Natural do Estuário do Sado foi criada em 1980. A 8 de maio de 1996, foi reconhecida como zona húmida de importância internacional (Ramsar).',
    en: 'The Sado Estuary Nature Reserve was created in 1980. On 8 May 1996, it was recognised as a wetland of international importance (Ramsar).',
    es: 'La Reserva Natural del Estuario del Sado se creó en 1980. El 8 de mayo de 1996 fue reconocida como humedal de importancia internacional (Ramsar).'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'sado_golfinhos',
  nivelMinimo: 12,
  titulo: { pt: 'Os Golfinhos do Sado', en: 'The Dolphins of the Sado', es: 'Los Delfines del Sado' },
  texto: {
    pt: 'No estuário vive uma comunidade residente de golfinhos-roazes, que ali fica todo o ano. É acompanhada por cientistas desde pelo menos 1981.',
    en: 'A resident community of bottlenose dolphins lives in the estuary all year round. Scientists have followed it since at least 1981.',
    es: 'En el estuario vive una comunidad residente de delfines mulares, que permanece allí todo el año. Los científicos la siguen desde al menos 1981.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'sado_troia',
  nivelMinimo: 12,
  titulo: { pt: 'O Peixe Salgado de Tróia', en: 'The Salted Fish of Tróia', es: 'El Pescado Salado de Tróia' },
  texto: {
    pt: 'Em Tróia, mesmo em frente a Setúbal, os romanos preparavam peixe salgado e garum, um molho de peixe. O local foi ocupado até ao século VI.',
    en: 'At Tróia, right across from Setúbal, the Romans prepared salted fish and garum, a fish sauce. The site was occupied until the 6th century.',
    es: 'En Tróia, justo frente a Setúbal, los romanos preparaban pescado salado y garum, una salsa de pescado. El lugar estuvo ocupado hasta el siglo VI.'
  }
});

// Nível 13, «Moscatel de Palmela»: as 3 histórias que o capítulo 13 (dados/capitulos.js) pede. Sem imagem.
dadosAcrescentar('enciclopedia', {
  id: 'palmela_castelo',
  nivelMinimo: 13,
  titulo: { pt: 'O Castelo de Palmela', en: 'Palmela Castle', es: 'El Castillo de Palmela' },
  texto: {
    pt: 'O castelo de Palmela foi tomado aos mouros no século XII e entregue depois à Ordem de Santiago. O antigo convento é hoje uma pousada.',
    en: 'Palmela castle was taken from the Moors in the 12th century and later given to the Order of Santiago. The old convent is now an inn.',
    es: 'El castillo de Palmela fue tomado a los moros en el siglo XII y entregado después a la Orden de Santiago. El antiguo convento es hoy una posada.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'palmela_capelo',
  nivelMinimo: 13,
  titulo: { pt: 'Hermenegildo Capelo', en: 'Hermenegildo Capelo', es: 'Hermenegildo Capelo' },
  texto: {
    pt: 'Hermenegildo Capelo nasceu em Palmela, em 1841. Foi explorador e, com Roberto Ivens, atravessou África de Angola a Moçambique.',
    en: 'Hermenegildo Capelo was born in Palmela in 1841. He was an explorer and, with Roberto Ivens, crossed Africa from Angola to Mozambique.',
    es: 'Hermenegildo Capelo nació en Palmela en 1841. Fue explorador y, con Roberto Ivens, atravesó África de Angola a Mozambique.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'palmela_castelao',
  nivelMinimo: 13,
  titulo: { pt: 'O Castelão de Palmela', en: 'The Castelão of Palmela', es: 'El Castelão de Palmela' },
  texto: {
    pt: 'Os vinhos tintos da DOC Palmela, reconhecida em 2009, levam pelo menos 67% de uva Castelão.',
    en: 'Red wines of the Palmela DOC, recognised in 2009, contain at least 67% Castelão grapes.',
    es: 'Los vinos tintos de la DOC Palmela, reconocida en 2009, llevan al menos un 67% de uva Castelão.'
  }
});
