// ---------------------------------------------------------------------
// PERFIL — pontos atuais, galeria de garrafas e título especial
// ---------------------------------------------------------------------

// Convite de amigos (botão "Convidar amigos" no Perfil): escondido por defeito.
// Aparece se CONVITES_ATIVOS for true ou se o endereço tiver ?convites=teste.
const CONVITES_ATIVOS = false;
const LINK_CONVITE = 'https://t.me/YoshiCatQuintaBot';

function convitesVisiveis() {
  return CONVITES_ATIVOS || new URLSearchParams(location.search).get('convites') === 'teste';
}

// Ícones simples de traço (substituem os emojis 🍇💧⭐🍾📖🏅).
const PERFIL_ICONES = {
  uvas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><circle cx="9" cy="16" r="3"></circle><circle cx="15" cy="18" r="3"></circle><circle cx="11" cy="11" r="3"></circle><circle cx="17" cy="12.5" r="3"></circle><path d="M12 5v3.5"></path><path d="M12 5c1.4-1.3 3-1.8 4.6-1.6"></path></svg>',
  gotas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><path d="M12 3c3.4 4.6 6.8 8.5 6.8 12.3a6.8 6.8 0 1 1-13.6 0C5.2 11.5 8.6 7.6 12 3z"></path></svg>',
  reputacao: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><path d="M12 3l2.9 6.1 6.6.9-4.8 4.6 1.1 6.6L12 18l-5.8 3.2 1.1-6.6-4.8-4.6 6.6-.9z"></path></svg>',
  garrafas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><path d="M10 2h4v3.8l1.8 2.7c.4.6.7 1.4.7 2.2V20a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2V10.7c0-.8.2-1.6.7-2.2L10 5.8V2z"></path><path d="M10 11.5h4"></path></svg>',
  conhecimento: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><path d="M4 5.5c2.2-1.2 5.3-1.2 8 0v13c-2.7-1.2-5.8-1.2-8 0v-13z"></path><path d="M20 5.5c-2.2-1.2-5.3-1.2-8 0v13c2.7-1.2 5.8-1.2 8 0v-13z"></path></svg>'
};

const PERFIL_MEDALHA_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><circle cx="12" cy="9" r="5"></circle><path d="M9 13l-1.5 8L12 18l4.5 3-1.5-8"></path></svg>';

const PERFIL_GARRAFA_PEQUENA_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M10 2h4v3.8l1.8 2.7c.4.6.7 1.4.7 2.2V20a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2V10.7c0-.8.2-1.6.7-2.2L10 5.8V2z"></path><path d="M10 11.5h4"></path></svg>';

function perfilCard(icone, value, i18nKey) {
  return '<div class="profile-card"><div class="stat-icon">' + icone + '</div><div class="stat-value">' + value +
    '</div><div class="stat-label" data-i18n="' + i18nKey + '"></div></div>';
}

function renderGaleriaGarrafas() {
  const max = Math.min(state.garrafas, 12);
  let html = '';
  for (let i = 0; i < max; i++) html += '<span>' + PERFIL_GARRAFA_PEQUENA_SVG + '</span>';
  if (state.garrafas > 12) html += '<span>+' + (state.garrafas - 12) + '</span>';
  return html;
}

function renderPerfil() {
  const container = document.getElementById('perfil-container');

  const tituloHtml = tituloEspecialDesbloqueado()
    ? '<div class="badge-title">' + PERFIL_MEDALHA_SVG + ' <span data-i18n="perfil.titulo.guardiao"></span></div>'
    : '';

  const garrafasInfoHtml = state.garrafas > 0
    ? '<p class="info-text">' + state.garrafas + ' — <span data-i18n="perfil.ultimaLabel"></span>: ' + state.ultimaGarrafaData + '</p>'
    : '<p class="info-text" data-i18n="perfil.semGarrafas"></p>';

  const convidarHtml = convitesVisiveis()
    ? '<button type="button" class="btn-ghost" onclick="convidarAmigos()" data-i18n="perfil.btnConvidar"></button>'
    : '';

  container.innerHTML =
    '<div class="topcard"><p class="mini-title" data-i18n="perfil.title"></p></div>' +
    '<div class="scroll-panel">' +
      '<div class="profile-grid">' +
        perfilCard(PERFIL_ICONES.uvas, state.uvas, 'stat.uvas') +
        perfilCard(PERFIL_ICONES.gotas, state.gotas, 'stat.gotas') +
        perfilCard(PERFIL_ICONES.reputacao, state.reputacao, 'stat.reputacao') +
        perfilCard(PERFIL_ICONES.garrafas, state.garrafas, 'stat.garrafas') +
        perfilCard(PERFIL_ICONES.conhecimento, state.conhecimento, 'stat.conhecimento') +
      '</div>' +
      tituloHtml +
      '<h2 data-i18n="perfil.galeriaTitulo"></h2>' +
      garrafasInfoHtml +
      '<div class="bottle-gallery">' + renderGaleriaGarrafas() + '</div>' +
      '<p class="info-text">' +
        '<label><input type="checkbox" id="perfil-vibracao-check" onchange="alternarVibracao(this.checked)"> ' +
        '<span data-i18n="perfil.vibracao"></span></label>' +
      '</p>' +
      '<p class="info-text">' +
        '<label><input type="checkbox" id="perfil-som-check" onchange="alternarSom(this.checked)"> ' +
        '<span data-i18n="perfil.som"></span></label>' +
      '</p>' +
    '</div>' +
    '<div class="action-panel">' +
      convidarHtml +
      '<button type="button" class="btn-pill pill-main pill-grande" onclick="goTo(\'enciclopedia\')" data-i18n="perfil.btnEnciclopedia"></button>' +
      '<button type="button" class="btn-ghost" onclick="goTo(\'home\')" data-i18n="perfil.btnSairInicio"></button>' +
    '</div>';

  const checkVibracao = document.getElementById('perfil-vibracao-check');
  if (checkVibracao) checkVibracao.checked = state.vibracao;
  const checkSom = document.getElementById('perfil-som-check');
  if (checkSom) checkSom.checked = state.som;

  atualizarDialogo('', '');
  applyTranslations();
}

function alternarVibracao(ligada) {
  state.vibracao = ligada;
  saveState(state);
}

function alternarSom(ligada) {
  state.som = ligada;
  saveState(state);
  somAplicarInterruptor(ligada);
}

// Abre a partilha do Telegram com o link do jogo. Não lê contactos, não guarda
// nada e não faz pedidos de rede: é só o Telegram a abrir o seu próprio ecrã.
function convidarAmigos() {
  const dentroDoTelegram = tg.initDataUnsafe && Object.keys(tg.initDataUnsafe).length > 0;
  if (dentroDoTelegram && typeof tg.isVersionAtLeast === 'function' && tg.isVersionAtLeast('6.1')) {
    tg.openTelegramLink('https://t.me/share/url?url=' + encodeURIComponent(LINK_CONVITE) +
      '&text=' + encodeURIComponent(t('convite.texto')));
  } else {
    showMessage(t('convite.texto') + '\n\n' + t('convite.fora') + '\n' + LINK_CONVITE);
  }
}
