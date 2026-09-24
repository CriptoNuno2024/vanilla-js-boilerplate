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

// Fundo do jogo (ver #fundo no index.html):
//   'capa'     — ecrã inicial, capa inteira
//   'paisagem' — capa escurecida, só com céu, casa e vinha (sem o YoshiCat)
//   'foto'     — uma imagem da história, passada em src
function definirFundo(modo, src) {
  const fundo = document.getElementById('fundo');
  const nitido = fundo.querySelector('.fundo-nitido');
  const imagem = (modo === 'foto' && src) ? 'url("' + src + '")' : '';

  fundo.className = 'modo-' + modo;
  if (nitido.style.backgroundImage !== imagem) nitido.style.backgroundImage = imagem;
}

// Vinha e Criar Garrafa escolhem a sua própria foto de fundo quando desenham.
const ECRAS_COM_FOTO = ['vinha', 'garrafa'];

function goTo(screen) {
  document.querySelectorAll('.screen').forEach(function (s) { s.classList.remove('active'); });
  document.getElementById('screen-' + screen).classList.add('active');
  document.body.classList.toggle('tela-home', screen === 'home');
  if (screen === 'home') definirFundo('capa');
  else if (ECRAS_COM_FOTO.indexOf(screen) === -1) definirFundo('paisagem');
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
