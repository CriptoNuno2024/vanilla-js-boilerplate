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
//   'paisagem' — parte de cima da capa: céu, lua, casa e vinha (sem o YoshiCat)
//   'foto'     — uma imagem da história, passada em src
function definirFundo(modo, src) {
  const fundo = document.getElementById('fundo');
  const imagem = (modo === 'foto' && src) ? 'url("' + src + '")' : '';

  fundo.className = 'modo-' + modo;
  fundo.querySelectorAll('div').forEach(function (camada) {
    if (camada.style.backgroundImage !== imagem) camada.style.backgroundImage = imagem;
  });
}

// Foto de fundo de cada ecrã. null = ainda sem foto própria, usa a
// paisagem da capa. Para dar uma foto a um ecrã, põe aqui o caminho
// (ex: 'assets/ecras/proteger.jpg').
// Vinha e Criar Garrafa não estão aqui: escolhem a foto quando desenham.
const FUNDO_DOS_ECRAS = {
  quinta: null,
  proteger: null,
  explorar: null,
  enciclopedia: null,
  perfil: null,
  lingua: null
};

function goTo(screen) {
  document.querySelectorAll('.screen').forEach(function (s) { s.classList.remove('active'); });
  document.getElementById('screen-' + screen).classList.add('active');
  document.body.classList.toggle('tela-home', screen === 'home');
  if (screen === 'home') definirFundo('capa');
  else if (FUNDO_DOS_ECRAS[screen]) definirFundo('foto', FUNDO_DOS_ECRAS[screen]);
  else if (screen in FUNDO_DOS_ECRAS) definirFundo('paisagem');
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
