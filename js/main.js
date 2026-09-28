// ---------------------------------------------------------------------
// ARRANQUE + NAVEGAÇÃO ENTRE ECRÃS
// ---------------------------------------------------------------------

// tg (window.Telegram.WebApp) é criado em js/state.js, que carrega
// primeiro — para js/nuvem.js também lhe poder aceder.
tg.ready();
tg.expand();

// Fora do Telegram (ou num cliente antigo) tg.isVersionAtLeast pode nem
// existir — daí a verificação dupla em todo este bloco. Isto nunca deve
// mudar nada no navegador normal, onde o jogo continua como antes.
if (typeof tg.isVersionAtLeast === 'function' && tg.isVersionAtLeast('7.7') && typeof tg.disableVerticalSwipes === 'function') {
  tg.disableVerticalSwipes();
}

// ---------------------------------------------------------------------
// VIBRAÇÃO (HapticFeedback) — leve ao tocar nos botões principais,
// "sucesso"/"erro" no resultado dos minijogos (ver js/proteger.js).
// Respeita sempre o interruptor "Vibração" do Perfil (state.vibracao,
// ligado por omissão — ver js/state.js e js/perfil.js) e nunca falha
// fora do Telegram ou num cliente sem HapticFeedback.
// ---------------------------------------------------------------------
function vibrar(tipo) {
  if (!state.vibracao) return;
  if (typeof tg.isVersionAtLeast !== 'function' || !tg.isVersionAtLeast('6.1') || !tg.HapticFeedback) return;
  if (tipo === 'sucesso') tg.HapticFeedback.notificationOccurred('success');
  else if (tipo === 'erro') tg.HapticFeedback.notificationOccurred('error');
  else tg.HapticFeedback.impactOccurred('light');
}

// Vibração leve ao tocar nos botões principais do jogo — delegado num
// único listener em vez de tocar em cada ecrã. Não apanha os botões da
// barra de baixo/topo de propósito (dar feedback a cada troca de ecrã
// seria demasiado); só nas ações dentro dos ecrãs.
document.addEventListener('click', function (e) {
  if (e.target.closest('.btn-pill, .btn-choice, .btn-tile, .btn, .btn-ghost')) vibrar('leve');
}, true);

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

// Ecrãs que não têm o novo aspeto (topo/navegação/cartão) — a capa e a
// escolha de língua ficam como sempre estiveram.
const ECRAS_SEM_CHROME = ['home', 'lingua'];

// Cada ecrã "acende" o botão da barra de baixo que lhe corresponde. Os
// que não têm botão próprio (ex: a Enciclopédia é lida a partir do
// Explorar ou do Perfil; a Festa é lida a partir da Quinta) acendem o
// botão do ecrã de onde normalmente se chega lá.
const NAV_ATIVO_POR_ECRA = {
  vinha: 'vinha',
  proteger: 'proteger',
  quinta: 'quinta',
  garrafa: 'garrafa',
  explorar: 'explorar',
  enciclopedia: 'explorar',
  festa: 'quinta'
};

// "Limpeza ao sair" por ecrã — um minijogo com temporizador (ex: o
// Chizo, em js/proteger.js) define uma função global de nome
// conhecido; goTo() chama-a sempre que se SAI desse ecrã, para nenhum
// temporizador continuar a correr escondido depois de se mudar de
// ecrã pela barra de baixo (ver goTo() mais abaixo). Os nomes são só
// referenciados aqui — resolvidos no momento da chamada, por isso não
// importa que js/proteger.js carregue antes deste ficheiro.
const LIMPEZA_AO_SAIR_POR_ECRA = {
  proteger: function () {
    if (typeof pararTemporizadorProteger === 'function') pararTemporizadorProteger();
  },
  vinha: function () {
    if (typeof pararRelogioVinha === 'function') pararRelogioVinha();
  }
};

// Ativa o novo aspeto (topo, navegação de baixo — ver ".app-chrome" no
// <style> do index.html) em qualquer ecrã do jogo, exceto a capa e a
// escolha de língua.
function atualizarChromeNovoAspeto(screen) {
  document.body.classList.toggle('jogo-cheio', ECRAS_SEM_CHROME.indexOf(screen) === -1);
  const navAtivo = NAV_ATIVO_POR_ECRA[screen] || null;
  document.querySelectorAll('#app-bottomnav .nav-btn').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.screen === navAtivo);
  });
  // Por omissão o balão e o cartão de "nova entrada" ficam escondidos ao
  // mudar de ecrã; quem tiver algo para mostrar volta a chamar
  // atualizarDialogo()/mostrarNovaEntrada() a seguir.
  dialogoFila = [];
  dialogoIndice = 0;
  const bolha = document.getElementById('app-dialogue');
  if (bolha) bolha.hidden = true;
  const cartaoNovaEntrada = document.getElementById('app-unlock');
  if (cartaoNovaEntrada) cartaoNovaEntrada.hidden = true;
}

// ---------------------------------------------------------------------
// PILHA FLUTUANTE POR CIMA DA NAVEGAÇÃO — genérico, usado por todos os
// ecrãs do jogo. De baixo para cima: painel de ações (fila de
// pastilhas, grelha, lista de escolhas, botão grande...), depois o
// cartão de "nova entrada" (ver mostrarNovaEntrada()) e por fim o
// balão de fala (ver atualizarDialogo()). Cada peça só entra na conta
// se estiver mesmo visível, e cada uma mede a anterior para se
// empilhar sem se sobrepor, seja qual for a altura de cada ecrã.
// ---------------------------------------------------------------------
function reposicionarFlutuantes() {
  const ecraAtivo = document.querySelector('.screen.active');
  const painelAcao = ecraAtivo && (ecraAtivo.querySelector('.pill-scroll-wrap') || ecraAtivo.querySelector('.action-panel'));
  const alturaAcao = painelAcao ? Math.round(painelAcao.getBoundingClientRect().height) : 0;
  const baseAcao = alturaAcao > 0 ? alturaAcao + 8 : 0;

  const cartaoNovaEntrada = document.getElementById('app-unlock');
  let baseBalao = baseAcao;
  if (cartaoNovaEntrada) {
    cartaoNovaEntrada.style.setProperty('--pilha-abaixo', baseAcao + 'px');
    if (!cartaoNovaEntrada.hidden) {
      baseBalao = baseAcao + Math.round(cartaoNovaEntrada.getBoundingClientRect().height) + 8;
    }
  }

  const bolha = document.getElementById('app-dialogue');
  if (bolha) bolha.style.setProperty('--balao-extra', baseBalao + 'px');
}

// ---------------------------------------------------------------------
// BALÃO DE FALA — fila de mensagens, sem temporizador nenhum: cada
// mensagem fica no ecrã até o jogador TOCAR no ecrã (na imagem ou no
// balão) para ver a seguinte. Uma seta pequena e a piscar no balão
// avisa que há mais para ler; desaparece na última mensagem.
//
// EXCEÇÃO: dentro de minijogos com tempo (ex: "Não acordes o Chizo",
// em js/proteger.js), quem chama volta a usar mostrarFalas() com uma
// única mensagem a cada passo do relógio — isso já substitui a
// mensagem no ecrã na hora, sem esperar por nenhum toque, porque o
// código do minijogo é que decide quando mudar, não o jogador.
// ---------------------------------------------------------------------
let dialogoFila = [];
let dialogoIndice = 0;
let dialogoNomeAtual = 'YoshiCat';

function mostrarFalaAtual() {
  const bolha = document.getElementById('app-dialogue');
  const nomeEl = document.getElementById('dialogue-name');
  const msgEl = document.getElementById('dialogue-msg');
  const setaEl = document.getElementById('dialogue-next');
  if (!bolha || !nomeEl || !msgEl) return;

  if (dialogoFila.length === 0) {
    bolha.hidden = true;
    msgEl.textContent = '';
    return;
  }

  nomeEl.textContent = dialogoNomeAtual;
  msgEl.textContent = dialogoFila[dialogoIndice];
  bolha.hidden = false;
  if (setaEl) setaEl.classList.toggle('oculto', dialogoIndice >= dialogoFila.length - 1);
  reposicionarFlutuantes();
}

// Toca no ecrã (imagem de fundo ou balão) para avançar para a próxima
// mensagem da fila — nunca nos botões de ação nem nas barras de
// cima/baixo, que ficam por cima destas camadas e têm os seus
// próprios onclick.
function avancarFala() {
  if (dialogoIndice < dialogoFila.length - 1) {
    dialogoIndice++;
    mostrarFalaAtual();
  }
}

// mensagens pode ser uma frase só ou uma lista de frases (a fila).
// Entradas vazias são ignoradas. Chamar sem mensagens (ou só com
// vazias) esconde o balão.
function mostrarFalas(mensagens, nome) {
  const lista = (Array.isArray(mensagens) ? mensagens : [mensagens]).filter(function (m) { return !!m; });
  dialogoFila = lista;
  dialogoIndice = 0;
  dialogoNomeAtual = nome || 'YoshiCat';
  mostrarFalaAtual();
}

// Mantido pelo nome antigo (usado em quase todos os ecrãs) — uma só
// mensagem, mostrada já.
function atualizarDialogo(mensagem, nome) {
  mostrarFalas(mensagem, nome);
}

// Cartão de "nova entrada desbloqueada" — genérico, usado por Explorar,
// Vinha, Adega e Festa. Recebe a entrada da Enciclopédia (ver
// desbloquearEntradaEnciclopedia() em js/explorar.js) ou null/undefined
// para esconder. Só mostra o título — o texto completo fica só na
// Enciclopédia, um toque de distância através da pastilha "Ler".
function mostrarNovaEntrada(entrada) {
  const cartao = document.getElementById('app-unlock');
  const tituloEl = document.getElementById('unlock-titulo');
  if (!cartao || !tituloEl) return;

  if (!entrada) {
    cartao.hidden = true;
    reposicionarFlutuantes();
    return;
  }

  tituloEl.textContent = entrada.titulo;
  cartao.hidden = false;
  reposicionarFlutuantes();
}

// ---------------------------------------------------------------------
// FILA DE BOTÕES-PASTILHA COM SETAS DOS DOIS LADOS — genérico, usado
// pela Vinha (ver js/vinha.js) e pronto para ser reutilizado por outros
// ecrãs mais tarde. Só trata do aspeto (construir o HTML da fila e
// mostrar/esconder as setas/esbatidos); quem chama decide os botões.
// ---------------------------------------------------------------------

// Constrói o HTML de uma fila de pastilhas com seta+esbatido dos dois
// lados. idContentor é o id que a faixa que desliza (.pill-scroll) vai
// ter; botoesHtml são os <button class="btn-pill">...</button> já
// prontos; ariaI18nKey é a chave de tradução usada nas duas setas.
function construirFilaPastilhas(idContentor, botoesHtml, ariaI18nKey) {
  return '<div class="pill-scroll-wrap">' +
    '<button type="button" class="pill-arrow-btn pill-arrow-left oculto" data-i18n-aria="' + ariaI18nKey + '" aria-label="Ver mais trabalhos" onclick="deslizarPastilhas(\'' + idContentor + '\', -160)">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M15 5l-7 7 7 7"></path></svg>' +
    '</button>' +
    '<div class="pill-fade pill-fade-left oculto" aria-hidden="true"></div>' +
    '<div class="pill-scroll" id="' + idContentor + '">' + botoesHtml + '</div>' +
    '<div class="pill-fade pill-fade-right" aria-hidden="true"></div>' +
    '<button type="button" class="pill-arrow-btn pill-arrow-right" data-i18n-aria="' + ariaI18nKey + '" aria-label="Ver mais trabalhos" onclick="deslizarPastilhas(\'' + idContentor + '\', 160)">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M9 5l7 7-7 7"></path></svg>' +
    '</button>' +
  '</div>';
}

// Desliza a fila (arrastar com o dedo continua a funcionar sozinho,
// isto é só para quando se toca numa das setas).
function deslizarPastilhas(idContentor, quantidade) {
  const el = document.getElementById(idContentor);
  if (el) el.scrollBy({ left: quantidade, behavior: 'smooth' });
}

// Todas as filas de pastilhas atualmente na página (id -> o seu
// ResizeObserver), para as poder recalcular todas de uma vez quando algo
// que afeta a largura do texto muda e não é a própria fila a mudar de
// tamanho (ex: as fontes acabam de carregar, ou a língua muda).
const FILA_PASTILHAS_OBSERVERS = new Map();

// Decide, para uma fila, se cabe tudo ou se é preciso mostrar a seta de
// cada lado — com uma tolerância pequena (1px) para que um resto de
// conteúdo por poucos píxeis já conte como "há mais para ver". Também
// aumenta a margem desse lado (ver --pastilhas-margem-esq/dir no
// index.html) enquanto a seta está visível, para o botão não ficar
// escondido por baixo dela no fim do deslize.
function atualizarSetasDaFila(idContentor) {
  const fila = document.getElementById(idContentor);
  if (!fila) {
    const antigo = FILA_PASTILHAS_OBSERVERS.get(idContentor);
    if (antigo) { antigo.disconnect(); FILA_PASTILHAS_OBSERVERS.delete(idContentor); }
    return;
  }
  const contentor = fila.closest('.pill-scroll-wrap');
  if (!contentor) return;
  const setaEsq = contentor.querySelector('.pill-arrow-left');
  const setaDir = contentor.querySelector('.pill-arrow-right');
  const esbatidoEsq = contentor.querySelector('.pill-fade-left');
  const esbatidoDir = contentor.querySelector('.pill-fade-right');
  const folga = 1;

  const podeEsq = fila.scrollLeft > folga;
  const podeDir = fila.scrollWidth - fila.clientWidth - fila.scrollLeft > folga;

  if (setaEsq) setaEsq.classList.toggle('oculto', !podeEsq);
  if (esbatidoEsq) esbatidoEsq.classList.toggle('oculto', !podeEsq);
  if (setaDir) setaDir.classList.toggle('oculto', !podeDir);
  if (esbatidoDir) esbatidoDir.classList.toggle('oculto', !podeDir);

  fila.style.setProperty('--pastilhas-margem-esq', podeEsq ? '56px' : '12px');
  fila.style.setProperty('--pastilhas-margem-dir', podeDir ? '56px' : '12px');
}

// Recalcula TODAS as filas de pastilhas da página — usado quando algo
// global muda a largura do texto (fontes a acabar de carregar, língua
// trocada), em vez de cada ecrã ter de se lembrar disto sozinho.
function atualizarTodasAsFilasDePastilhas() {
  FILA_PASTILHAS_OBSERVERS.forEach(function (_observador, idContentor) {
    atualizarSetasDaFila(idContentor);
  });
}

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(atualizarTodasAsFilasDePastilhas);
}

window.addEventListener('resize', atualizarTodasAsFilasDePastilhas);
window.addEventListener('orientationchange', atualizarTodasAsFilasDePastilhas);

// Liga a fila às suas próprias setas/esbatidos: mostra a da esquerda só
// depois de já ter deslizado para a direita, e esconde a da direita ao
// chegar ao fim. Volta a calcular sempre que a fila muda de tamanho
// (ResizeObserver — apanha rotação/redimensionamento da janela) e ainda
// uma vez ao ligar. Chamar depois de pôr a fila no DOM (ver renderVinha()).
function configurarFilaPastilhas(idContentor) {
  const fila = document.getElementById(idContentor);
  if (!fila) return;

  const antigo = FILA_PASTILHAS_OBSERVERS.get(idContentor);
  if (antigo) antigo.disconnect();

  if (window.ResizeObserver) {
    const observador = new ResizeObserver(function () { atualizarSetasDaFila(idContentor); });
    observador.observe(fila);
    FILA_PASTILHAS_OBSERVERS.set(idContentor, observador);
  } else {
    FILA_PASTILHAS_OBSERVERS.set(idContentor, { disconnect: function () {} });
  }

  fila.addEventListener('scroll', function () { atualizarSetasDaFila(idContentor); });
  atualizarSetasDaFila(idContentor);
}

// Os 5 ecrãs da barra de baixo — ao entrar num deles a pilha de "veio
// de..." (ver historicoEcras abaixo) é limpa e o BackButton do Telegram
// esconde-se, porque já não há "voltar" nenhum a fazer.
const ECRAS_PRINCIPAIS_BARRA = ['vinha', 'proteger', 'quinta', 'garrafa', 'explorar'];

// Pilha de ecrãs "de onde se veio", usada só pelo BackButton do
// Telegram (ver atualizarBotaoVoltarTelegram()/voltarEcraAnterior()
// abaixo). Cada goTo() para um ecrã que não seja um dos 5 principais
// empilha o ecrã anterior; voltarEcraAnterior() desempilha e chama
// goTo() outra vez — por isso passa sempre por LIMPEZA_AO_SAIR_POR_ECRA
// como qualquer outra navegação, sem regra especial nenhuma.
let historicoEcras = [];

function goTo(screen, opcoes) {
  opcoes = opcoes || {};
  // Ecrã de onde se está a sair — antes de trocar nada, cancela
  // qualquer temporizador de minijogo que esse ecrã tenha registado
  // (ver registarLimpezaAoSair()). Sair a meio de um minijogo conta
  // como desistir: sem penalização, só pára o relógio.
  const ecraAnterior = document.querySelector('.screen.active');
  const idAnterior = ecraAnterior ? ecraAnterior.id.replace(/^screen-/, '') : null;
  if (idAnterior && idAnterior !== screen && LIMPEZA_AO_SAIR_POR_ECRA[idAnterior]) {
    LIMPEZA_AO_SAIR_POR_ECRA[idAnterior]();
  }

  if (ECRAS_PRINCIPAIS_BARRA.indexOf(screen) !== -1 || ECRAS_SEM_CHROME.indexOf(screen) !== -1) {
    historicoEcras = [];
  } else if (!opcoes.semHistorico && idAnterior && idAnterior !== screen) {
    historicoEcras.push(idAnterior);
  }

  document.querySelectorAll('.screen').forEach(function (s) { s.classList.remove('active'); });
  document.getElementById('screen-' + screen).classList.add('active');
  document.body.classList.toggle('tela-home', screen === 'home');
  atualizarChromeNovoAspeto(screen);
  const fundoEcra = FUNDO_DOS_ECRAS[screen];
  if (screen === 'home') definirFundo('capa');
  else if (fundoEcra) definirFundo('foto', fundoEcra.src, fundoEcra.pos);
  else if (screen in FUNDO_DOS_ECRAS) definirFundo('paisagem');
  updateStatsDisplays();
  applyTranslations();
  atualizarLinhaEstacaoQuinta();
  atualizarLinhaTempoQuinta();
  atualizarFaixaFesta();
  if (screen === 'quinta') {
    if (typeof atualizarCartaoNivelQuinta === 'function') atualizarCartaoNivelQuinta();
    if (typeof atualizarCartaoObjetivosQuinta === 'function') atualizarCartaoObjetivosQuinta();
    if (typeof verificarSubidaNivel === 'function') verificarSubidaNivel();
    garantirTempoAtualizado().then(function () {
      atualizarLinhaTempoQuinta();
      atualizarFaixaFesta();
    });
  }

  if (screen === 'vinha') enterVinha();
  if (screen === 'proteger') startProteger();
  if (screen === 'garrafa') renderGarrafaScreen();
  if (screen === 'explorar') enterExplorar();
  if (screen === 'enciclopedia') renderEnciclopedia();
  if (screen === 'perfil') renderPerfil();
  if (screen === 'lingua') renderLinguaScreen();
  if (screen === 'festa') enterFesta();

  atualizarBotaoVoltarTelegram();
}

// ---------------------------------------------------------------------
// BOTÃO VOLTAR DO TELEGRAM (BackButton) — escondido nos 5 ecrãs
// principais da barra de baixo e na capa/escolha de língua (que já têm
// o seu próprio botão "Voltar"); visível em todos os outros (Perfil,
// Enciclopédia, Festa, ...), e sempre volta ao ecrã de onde se veio
// (ver historicoEcras acima).
// ---------------------------------------------------------------------
function atualizarBotaoVoltarTelegram() {
  if (typeof tg.isVersionAtLeast !== 'function' || !tg.isVersionAtLeast('6.1') || !tg.BackButton) return;
  if (historicoEcras.length > 0) tg.BackButton.show();
  else tg.BackButton.hide();
}

function voltarEcraAnterior() {
  const anterior = historicoEcras.pop();
  goTo(anterior || 'quinta', { semHistorico: true });
}

if (typeof tg.isVersionAtLeast === 'function' && tg.isVersionAtLeast('6.1') && tg.BackButton) {
  tg.BackButton.onClick(voltarEcraAnterior);
}

updateStatsDisplays();
applyTranslations();
