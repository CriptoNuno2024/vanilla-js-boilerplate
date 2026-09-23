// ---------------------------------------------------------------------
// ARRANQUE + NAVEGAÇÃO ENTRE ECRÃS
// ---------------------------------------------------------------------

const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

function showMessage(msg) {
  const dentroDoTelegram = tg.initDataUnsafe && Object.keys(tg.initDataUnsafe).length > 0;
  if (dentroDoTelegram) {
    tg.showAlert(msg);
  } else {
    alert(msg);
  }
}

function goTo(screen) {
  document.querySelectorAll('.screen').forEach(function (s) { s.classList.remove('active'); });
  document.getElementById('screen-' + screen).classList.add('active');
  updateStatsDisplays();
  applyTranslations();

  if (screen === 'vinha') enterVinha();
  if (screen === 'proteger') startProteger();
  if (screen === 'garrafa') renderGarrafaScreen();
  if (screen === 'explorar') enterExplorar();
  if (screen === 'enciclopedia') renderEnciclopedia();
  if (screen === 'perfil') renderPerfil();
  if (screen === 'lingua') renderLinguaScreen();
}

updateStatsDisplays();
applyTranslations();
