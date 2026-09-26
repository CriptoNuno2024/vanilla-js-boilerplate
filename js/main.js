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
//   'foto'     — uma imagem da história, passada em src. O 3º argumento
//                (pos) é opcional e diz que parte da foto mostrar quando
//                é preciso cortar (ex: 'right top' põe o corte à
//                direita); sem ele, corta ao centro.
function definirFundo(modo, src, pos) {
  const fundo = document.getElementById('fundo');
  const imagem = (modo === 'foto' && src) ? 'url("' + src + '")' : '';
  const nitido = fundo.querySelector('.fundo-nitido');
  const posicao = (modo === 'foto' && pos) ? pos : '';

  fundo.className = 'modo-' + modo;
  fundo.querySelectorAll('div').forEach(function (camada) {
    if (camada.style.backgroundImage !== imagem) camada.style.backgroundImage = imagem;
  });
  if (nitido.style.backgroundPosition !== posicao) nitido.style.backgroundPosition = posicao;
}

// Foto de fundo de cada ecrã. null = ainda sem foto própria, usa a
// paisagem da capa. Para dar uma foto a um ecrã, põe aqui { src, pos }
// (pos é opcional — ver definirFundo acima).
// Vinha, Criar Garrafa e Proteger não estão aqui: têm mais do que um
// estado (ação/fase, minijogo, vitória/derrota) e escolhem a sua
// própria foto quando desenham, em vez de teres uma só por ecrã.
const FUNDO_DOS_ECRAS = {
  quinta: { src: 'assets/ecras/menu_quinta.jpg', pos: 'right top' },
  explorar: { src: 'assets/ecras/explorar_trator.jpg' },
  enciclopedia: { src: 'assets/ecras/enciclopedia_yoshi_cat_2.jpg' },
  perfil: { src: 'assets/ecras/yoshi_cat_varanda.jpg' },
  lingua: null
};

function goTo(screen) {
  document.querySelectorAll('.screen').forEach(function (s) { s.classList.remove('active'); });
  document.getElementById('screen-' + screen).classList.add('active');
  document.body.classList.toggle('tela-home', screen === 'home');
  const fundoEcra = FUNDO_DOS_ECRAS[screen];
  if (screen === 'home') definirFundo('capa');
  else if (fundoEcra) definirFundo('foto', fundoEcra.src, fundoEcra.pos);
  else if (screen in FUNDO_DOS_ECRAS) definirFundo('paisagem');
  updateStatsDisplays();
  applyTranslations();
  atualizarLinhaEstacaoQuinta();
  atualizarLinhaTempoQuinta();
  atualizarFaixaFesta();
  if (screen === 'quinta') garantirTempoAtualizado().then(function () {
    atualizarLinhaTempoQuinta();
    atualizarFaixaFesta();
  });

  if (screen === 'vinha') enterVinha();
  if (screen === 'proteger') startProteger();
  if (screen === 'garrafa') renderGarrafaScreen();
  if (screen === 'explorar') enterExplorar();
  if (screen === 'enciclopedia') renderEnciclopedia();
  if (screen === 'perfil') renderPerfil();
  if (screen === 'lingua') renderLinguaScreen();
  if (screen === 'festa') enterFesta();
}

updateStatsDisplays();
applyTranslations();
