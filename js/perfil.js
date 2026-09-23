// ---------------------------------------------------------------------
// PERFIL — pontos atuais, galeria de garrafas e título especial
// ---------------------------------------------------------------------

function perfilCard(icon, value, i18nKey) {
  return '<div class="profile-card"><div class="stat-icon">' + icon + '</div><div class="stat-value">' + value +
    '</div><div class="stat-label" data-i18n="' + i18nKey + '"></div></div>';
}

function renderGaleriaGarrafas() {
  const max = Math.min(state.garrafas, 12);
  let html = '';
  for (let i = 0; i < max; i++) html += '<span>🍾</span>';
  if (state.garrafas > 12) html += '<span>+' + (state.garrafas - 12) + '</span>';
  return html;
}

function renderPerfil() {
  const container = document.getElementById('perfil-container');

  const tituloHtml = tituloEspecialDesbloqueado()
    ? '<div class="badge-title">🏅 <span data-i18n="perfil.titulo.guardiao"></span></div>'
    : '';

  const garrafasInfoHtml = state.garrafas > 0
    ? '<p class="info-text">' + state.garrafas + ' — <span data-i18n="perfil.ultimaLabel"></span>: ' + state.ultimaGarrafaData + '</p>'
    : '<p class="info-text" data-i18n="perfil.semGarrafas"></p>';

  container.innerHTML =
    '<div class="profile-grid">' +
      perfilCard('🍇', state.uvas, 'stat.uvas') +
      perfilCard('💧', state.gotas, 'stat.gotas') +
      perfilCard('⭐', state.reputacao, 'stat.reputacao') +
      perfilCard('🍾', state.garrafas, 'stat.garrafas') +
      perfilCard('📖', state.conhecimento, 'stat.conhecimento') +
    '</div>' +
    tituloHtml +
    '<h2 data-i18n="perfil.galeriaTitulo"></h2>' +
    garrafasInfoHtml +
    '<div class="bottle-gallery">' + renderGaleriaGarrafas() + '</div>' +
    '<button class="btn btn-secondary" onclick="goTo(\'enciclopedia\')" data-i18n="perfil.btnEnciclopedia"></button>';

  applyTranslations();
}
