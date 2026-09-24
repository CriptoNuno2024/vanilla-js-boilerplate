// ---------------------------------------------------------------------
// CRIAR GARRAFA (100 Gotas = 1 Garrafa, +30 Reputação)
//
// Mesma economia de antes, mas agora com uma pequena sequência
// narrativa (prensar -> mexer o mosto -> barril -> engarrafar) antes de
// mostrar o resultado. A foto de cada passo aparece como fundo.
// ---------------------------------------------------------------------

// Os textos de cada passo estão em i18n.js (garrafa.passo1 .. passo4).
const GARRAFA_NARRATIVA = [
  { textoKey: 'garrafa.passo1', foto: 'assets/vinha/prensar.jpg' },
  { textoKey: 'garrafa.passo2', foto: 'assets/vinha/mexer_mosto.jpg' },
  { textoKey: 'garrafa.passo3', foto: 'assets/vinha/barril_dourado.jpg' },
  { textoKey: 'garrafa.passo4', foto: 'assets/vinha/engarrafar.jpg' }
];

let garrafaPasso = -1;

function preCarregarFotosGarrafa() {
  GARRAFA_NARRATIVA.forEach(function (passo) { new Image().src = passo.foto; });
}

function renderGarrafaScreen() {
  garrafaPasso = -1;
  preCarregarFotosGarrafa();
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

  definirFundo('foto', GARRAFA_NARRATIVA[0].foto);
  applyTranslations();
}

function iniciarCriacaoGarrafa() {
  if (state.gotas < 100) {
    showMessage(t('garrafa.msgGotasInsuficientes'));
    return;
  }
  garrafaPasso = 0;
  renderGarrafaNarrativa();
}

function renderGarrafaNarrativa() {
  const container = document.getElementById('garrafa-container');
  const passo = GARRAFA_NARRATIVA[garrafaPasso];
  container.innerHTML =
    '<h2 data-i18n="garrafa.title"></h2>' +
    '<div class="story-box" data-i18n="' + passo.textoKey + '"></div>' +
    '<button class="btn btn-primary" onclick="avancarNarrativaGarrafa()" data-i18n="garrafa.btnSeguinte"></button>';
  definirFundo('foto', passo.foto);
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
  state.ultimaGarrafaData = new Date().toLocaleDateString(localeAtual());
  saveState(state);
  updateStatsDisplays();

  const container = document.getElementById('garrafa-container');
  container.innerHTML =
    '<h2 data-i18n="garrafa.resultadoTitulo"></h2>' +
    '<p class="game-question">+1 <span data-i18n="stat.garrafas"></span>, +30 <span data-i18n="stat.reputacao"></span></p>' +
    '<button class="btn btn-primary" onclick="renderGarrafaIdle()" data-i18n="garrafa.btnContinuar"></button>';

  definirFundo('foto', GARRAFA_NARRATIVA[GARRAFA_NARRATIVA.length - 1].foto);
  applyTranslations();
}
