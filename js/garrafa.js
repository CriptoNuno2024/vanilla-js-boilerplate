// ---------------------------------------------------------------------
// CRIAR GARRAFA (100 Gotas = 1 Garrafa, +30 Reputação)
//
// Mesma economia de antes, mas agora com uma pequena sequência
// narrativa (fermentação interrompida -> maceração pelicular ->
// engarrafamento) antes de mostrar o resultado.
// ---------------------------------------------------------------------

const GARRAFA_NARRATIVA = [
  'A fermentação da uva Moscatel é interrompida com aguardente vínica, preservando o açúcar natural e a doçura característica.',
  'As películas das uvas permanecem em contacto com o mosto — a maceração pelicular liberta os aromas florais e frutados intensos do Moscatel.',
  'O vinho é finalmente engarrafado, pronto para continuar a evoluir e revelar todo o seu carácter.'
];

let garrafaPasso = -1;

function renderGarrafaScreen() {
  garrafaPasso = -1;
  renderGarrafaIdle();
}

function renderGarrafaIdle() {
  const pct = Math.min(100, Math.round((state.gotas / 100) * 100));
  const container = document.getElementById('garrafa-container');

  container.innerHTML =
    '<h2 data-i18n="garrafa.title"></h2>' +
    '<p class="info-text" data-i18n="garrafa.descricao"></p>' +
    '<div class="progress-bar-outer"><div class="progress-bar-inner" style="width:' + pct + '%"></div></div>' +
    '<p class="info-text">' + state.gotas + ' / 100 <span data-i18n="stat.gotas"></span></p>' +
    '<button class="btn btn-primary" ' + (state.gotas < 100 ? 'disabled' : '') +
    ' onclick="iniciarCriacaoGarrafa()" data-i18n="garrafa.btnCriar"></button>';

  applyTranslations();
}

function iniciarCriacaoGarrafa() {
  if (state.gotas < 100) {
    showMessage('Ainda não tens Gotas de Moscatel suficientes. Precisas de 100.');
    return;
  }
  garrafaPasso = 0;
  renderGarrafaNarrativa();
}

function renderGarrafaNarrativa() {
  const container = document.getElementById('garrafa-container');
  container.innerHTML =
    '<h2 data-i18n="garrafa.title"></h2>' +
    '<div class="story-box">' + GARRAFA_NARRATIVA[garrafaPasso] + '</div>' +
    '<button class="btn btn-primary" onclick="avancarNarrativaGarrafa()" data-i18n="garrafa.btnSeguinte"></button>';
  applyTranslations();
}

function avancarNarrativaGarrafa() {
  garrafaPasso += 1;
  if (garrafaPasso < GARRAFA_NARRATIVA.length) {
    renderGarrafaNarrativa();
  } else {
    finalizarCriacaoGarrafa();
  }
}

function finalizarCriacaoGarrafa() {
  state.gotas -= 100;
  state.garrafas += 1;
  state.reputacao += 30;
  state.ultimaGarrafaData = new Date().toLocaleDateString('pt-PT');
  saveState(state);
  updateStatsDisplays();

  const container = document.getElementById('garrafa-container');
  container.innerHTML =
    '<h2 data-i18n="garrafa.resultadoTitulo"></h2>' +
    '<p class="game-question">+1 <span data-i18n="stat.garrafas"></span>, +30 <span data-i18n="stat.reputacao"></span></p>' +
    '<button class="btn btn-primary" onclick="renderGarrafaIdle()" data-i18n="garrafa.btnContinuar"></button>';

  applyTranslations();
}
