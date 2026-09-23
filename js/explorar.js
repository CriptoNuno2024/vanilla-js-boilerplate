// ---------------------------------------------------------------------
// EXPLORAR + ENCICLOPÉDIA DO MOSCATEL
//
// Cada clique em "Explorar" (a partir da Quinta) desbloqueia UMA
// entrada nova, escolhida ao acaso entre as que faltam. As entradas
// desbloqueadas ficam guardadas para sempre e visíveis na Enciclopédia.
// ---------------------------------------------------------------------

const ENCYCLOPEDIA_ENTRIES = [
  {
    id: 'origem',
    titulo: 'As Origens do Moscatel',
    texto: 'Dizem os mais velhos da Quinta que o Moscatel de Setúbal nasceu há mais de 500 anos, quando os primeiros bacelos de Moscatel Graúdo chegaram à península vindos de terras distantes.'
  },
  {
    id: 'terroir',
    titulo: 'A Terra da Arrábida',
    texto: 'A vinha da Quinta cresce em solos de argila e calcário, virada a poente — a mesma exposição que torna os Moscatéis de Setúbal tão doces e aromáticos.'
  },
  {
    id: 'secagem',
    titulo: 'O Sol Antes do Lagar',
    texto: 'Depois da vindima, os cachos mais generosos ficam a secar ao sol, concentrando o açúcar antes de seguirem para o lagar. É esse cuidado que dá ao Moscatel o seu perfume inconfundível.'
  },
  {
    id: 'estagio',
    titulo: 'O Estágio em Cascos de Carvalho',
    texto: 'O segredo de um bom Moscatel está na paciência: o vinho repousa em cascos de carvalho durante anos, ganhando notas de mel, frutos secos e passas à medida que envelhece.'
  },
  {
    id: 'reconhecimento',
    titulo: 'Um Vinho Reconhecido no Mundo',
    texto: 'Setúbal é uma das poucas regiões do mundo reconhecida pela qualidade excecional dos seus vinhos moscatel, ao lado de nomes como o Rütherglen australiano.'
  },
  {
    id: 'protecao',
    titulo: 'Cuidar da Vinha Todos os Dias',
    texto: 'YoshiCat aprendeu com os antigos vinhateiros que proteger a vinha é tão importante como colhê-la — sem cuidado diário, nem a melhor terra dá bom vinho.'
  },
  {
    id: 'vindima',
    titulo: 'A Vindima Manual',
    texto: 'Na Região Demarcada de Setúbal, a vindima é ainda feita à mão: os cachos são cortados um a um e colocados em cestos, para chegarem inteiros e intactos ao lagar.'
  },
  {
    id: 'poda',
    titulo: 'A Poda da Vinha',
    texto: 'No inverno, com a videira em repouso, faz-se a poda: corta-se os ramos em excesso para concentrar a força da planta nos cachos que vão nascer na próxima estação.'
  },
  {
    id: 'aguardente',
    titulo: 'A Aguardente Vínica',
    texto: 'A fortificação do Moscatel é feita juntando aguardente vínica ao mosto em fermentação. O álcool interrompe o processo e preserva o açúcar natural da uva, dando ao vinho o seu característico doçor.'
  },
  {
    id: 'regiao',
    titulo: 'A Região Demarcada de Setúbal',
    texto: 'A Região Demarcada de Setúbal é uma das mais antigas do mundo com denominação de origem, criada para proteger e garantir a autenticidade dos vinhos produzidos nesta península.'
  }
];

function entradasBloqueadas() {
  return ENCYCLOPEDIA_ENTRIES.filter(function (e) {
    return state.encyclopedia.unlocked.indexOf(e.id) === -1;
  });
}

function tituloEspecialDesbloqueado() {
  return state.encyclopedia.unlocked.length >= ENCYCLOPEDIA_ENTRIES.length;
}

function enterExplorar() {
  const container = document.getElementById('explorar-container');
  const bloqueadas = entradasBloqueadas();

  if (bloqueadas.length === 0) {
    container.innerHTML =
      '<h2 data-i18n="explorar.title"></h2>' +
      '<div class="story-box" data-i18n="explorar.tudoDesbloqueado"></div>' +
      '<button class="btn btn-primary" onclick="goTo(\'enciclopedia\')" data-i18n="explorar.btnVerEnciclopedia"></button>';
    applyTranslations();
    return;
  }

  const nova = bloqueadas[randInt(0, bloqueadas.length - 1)];
  state.encyclopedia.unlocked.push(nova.id);
  state.conhecimento += 1;
  saveState(state);
  updateStatsDisplays();

  container.innerHTML =
    '<h2 data-i18n="explorar.title"></h2>' +
    '<p class="game-subtitle" data-i18n="explorar.subtitleNova"></p>' +
    '<div class="story-box"><strong>' + nova.titulo + '</strong><br><br>' + nova.texto + '</div>' +
    '<button class="btn btn-primary" onclick="goTo(\'enciclopedia\')" data-i18n="explorar.btnVerEnciclopedia"></button>';

  applyTranslations();
}

function renderEnciclopedia() {
  const container = document.getElementById('enciclopedia-container');

  const cardsHtml = ENCYCLOPEDIA_ENTRIES.map(function (e) {
    const desbloqueada = state.encyclopedia.unlocked.indexOf(e.id) !== -1;
    if (desbloqueada) {
      return '<div class="encyclopedia-card"><h3>' + e.titulo + '</h3><p>' + e.texto + '</p></div>';
    }
    return '<div class="encyclopedia-card locked"><h3>???</h3><p data-i18n="enciclopedia.bloqueado"></p></div>';
  }).join('');

  container.innerHTML =
    '<h2 data-i18n="enciclopedia.title"></h2>' +
    '<p class="info-text">' + state.encyclopedia.unlocked.length + ' / ' + ENCYCLOPEDIA_ENTRIES.length + '</p>' +
    '<div class="encyclopedia-grid">' + cardsHtml + '</div>';

  applyTranslations();
}
