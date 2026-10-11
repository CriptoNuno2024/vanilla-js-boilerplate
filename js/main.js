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

// >>> cliques-botoes (scripts/verificar-clique-botoes.js carrega só este bloco)
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
// único listener em vez de tocar em cada ecrã. Não apanha os botões do topo
// (Perfil); só nas ações dentro dos ecrãs. Um botão com o atributo
// data-sem-vibracao fica de fora (faz a sua própria vibração, ex.: Engarrafar).
//
// O MESMO listener dá o clique suave (som "clique", js/som.js), nos mesmos botões e, ao contrário da vibração, também na
// barra de baixo (.nav-btn), e com a mesma exceção data-sem-vibracao. É um só ouvinte do documento e um só clique por toque
// (closest() devolve um único botão, mesmo que o toque caia num ícone ou num botão dentro de outro). Um botão cuja ação toca
// um som seu NÃO dá clique: tocarCliqueSeNadaTocou() espera que a ação corra e só toca se nenhum som foi pedido (por isso não
// há lista de botões nem atributo a manter: o "ding" do objetivo, as ações da Vinha e da Adega, Trocar, as festas, subir de
// nível, o ecrã trancado... ficam sozinhos sem clique, e uma ação silenciosa ou recusada ainda dá o seu clique).
// Botão desativado não dá clique (nem vibração, que o browser já não lhe entrega o toque).
document.addEventListener('click', function (e) {
  if (!e.target || typeof e.target.closest !== 'function') return;
  if (e.target.closest('[data-sem-vibracao]')) return;
  const botao = e.target.closest('.btn-pill, .btn-choice, .btn-tile, .btn, .btn-ghost');
  const barra = e.target.closest('.nav-btn');
  if (botao) vibrar('leve');
  const clicado = botao || barra;
  if (clicado && !clicado.disabled && typeof tocarCliqueSeNadaTocou === 'function') tocarCliqueSeNadaTocou();
}, true);
// <<< cliques-botoes

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
// size (opcional): normalmente cada foto preenche a caixa toda,
// cortando o que sobra ("cover" — ver CSS). Só a imagem dos "disfarces
// de uva" no Proteger (ver PROTEGER_FUNDOS em js/proteger.js) usa
// size: 'contain', porque o YoshiCat e o porco ficam demasiado perto
// das pontas para um corte ao centro os mostrar aos dois — a foto
// desfocada por trás (a mesma imagem) preenche o que sobra dos lados.
function definirFundo(modo, src, pos, size) {
  const fundo = document.getElementById('fundo');
  const imagem = (modo === 'foto' && src) ? 'url("' + src + '")' : '';
  const nitido = fundo.querySelector('.fundo-nitido');
  const posicao = (modo === 'foto' && pos) ? pos : '';
  const tamanho = (modo === 'foto' && size) ? size : '';

  fundo.className = 'modo-' + modo;
  fundo.querySelectorAll('div').forEach(function (camada) {
    if (camada.style.backgroundImage !== imagem) camada.style.backgroundImage = imagem;
  });
  if (nitido.style.backgroundPosition !== posicao) nitido.style.backgroundPosition = posicao;
  if (nitido.style.backgroundSize !== tamanho) nitido.style.backgroundSize = tamanho;
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
  caderno: { src: 'assets/ecras/fygmos_fazem_das_suas.jpg' },
  perfil: { src: 'assets/ecras/yoshi_cat_varanda.jpg' },
  lagar: { src: 'assets/ecras/festa_vindima_todos_juntos.jpg' },
  camara: { src: 'assets/vinha/barril_dourado.jpg' },
  roxo: { src: 'assets/ecras/yoshi_cat_festa_vindima.jpg' },
  // A Loja escolhe o fundo pelo tempo quando desenha (ver fundoTempoLoja() em js/loja.js); esta é a de reserva (sol).
  loja: { src: 'assets/ecras/casa_loja_meio_da_vinha_4.jpg' },
  conquistas: { src: 'assets/ecras/livro_conquistas.jpg' },
  lingua: null
};

// Ecrãs que não têm o novo aspeto (topo/navegação/cartão) — a capa e a
// escolha de língua ficam como sempre estiveram.
const ECRAS_SEM_CHROME = ['home', 'lingua'];

// Cada ecrã "acende" o botão da barra de baixo que lhe corresponde. Os
// que não têm botão próprio (ex: a Enciclopédia é lida a partir do
// Explorar ou do Perfil; a Festa é lida a partir da Quinta; a Estrada, a
// Loja, o Lagar, a Câmara e a Cepa Roxa abrem-se pelos cartões do Explorar)
// acendem o botão do ecrã de onde normalmente se chega lá.
const NAV_ATIVO_POR_ECRA = {
  vinha: 'vinha',
  proteger: 'proteger',
  quinta: 'quinta',
  garrafa: 'garrafa',
  engarrafar: 'garrafa',
  explorar: 'explorar',
  enciclopedia: 'explorar',
  caderno: 'quinta',
  colecao: 'garrafa',
  garrafas: 'garrafa',
  festa: 'quinta',
  estrada: 'explorar',
  lagar: 'explorar',
  camara: 'explorar',
  roxo: 'explorar',
  loja: 'explorar'
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
  },
  engarrafar: function () {
    if (typeof pararRelogioEngarrafar === 'function') pararRelogioEngarrafar();
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
  const cartaoPedido = document.getElementById('app-pedido');
  if (cartaoPedido) cartaoPedido.hidden = true;
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
  // Cartão do pedido do dia (js/ronda.js): ocupa o mesmo lugar que o de "nova entrada".
  const cartaoPedido = document.getElementById('app-pedido');
  if (cartaoPedido) {
    cartaoPedido.style.setProperty('--pilha-abaixo', baseAcao + 'px');
    if (!cartaoPedido.hidden) {
      baseBalao = baseAcao + Math.round(cartaoPedido.getBoundingClientRect().height) + 8;
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
// true quando a fila atual é uma história com foto própria (ver
// js/historia.js) — nesse caso, ao tocar depois da última fala, o fundo
// volta ao normal do ecrã atual (ver avancarFala() e
// restaurarFundoDoEcraAtual() abaixo) em vez de ficar preso na foto.
let dialogoComFotoPropria = false;

// Cada entrada da fila pode ser só texto (como sempre foi) ou um objeto
// { texto, foto, pos } — usado pela história (ver js/historia.js) para
// trocar a foto de fundo em falas certas, sem afetar nenhuma das
// chamadas antigas, que continuam a passar só texto. Pode ainda ter
// falante (nome de PERSONAGENS_CARAS): essa fala mostra esse nome e essa
// cara; sem falante, vale o nome da fila (o 2.º argumento de mostrarFalas). Com
// personagem (id de PERSONAGENS_CARAS_POR_ID, ex.: 'valentim') a cara vem desse id e o
// nome mostrado continua a ser o da fila.
function textoDaFala(entrada) {
  return (entrada && typeof entrada === 'object') ? entrada.texto : entrada;
}

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

  const entrada = dialogoFila[dialogoIndice];
  if (entrada && typeof entrada === 'object' && entrada.foto) {
    definirFundo('foto', entrada.foto, entrada.pos);
  }
  // Som ligado a uma fala em concreto (ver js/som.js e js/historia.js,
  // ex.: o Chizo a ladrar quando aparece à porta na história do Nível 2).
  if (entrada && typeof entrada === 'object' && entrada.som) {
    tocarSomFicheiro(entrada.som);
  }

  const falante = (entrada && typeof entrada === 'object' && entrada.falante) ? entrada.falante : dialogoNomeAtual;
  nomeEl.textContent = falante;
  if (typeof mostrarCaraNoBalao === 'function') mostrarCaraNoBalao(falante, (entrada && typeof entrada === 'object') ? entrada.personagem : undefined);
  msgEl.textContent = textoDaFala(entrada);
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
    return;
  }
  // Já estava na última fala: se era uma história com foto própria,
  // este toque fecha-a e devolve o fundo ao normal do ecrã atual.
  if (dialogoComFotoPropria) {
    dialogoComFotoPropria = false;
    restaurarFundoDoEcraAtual();
    mostrarFalas([]);
  }
}

// mensagens pode ser uma frase só, uma lista de frases, ou (só a
// história, ver js/historia.js) uma lista de { texto, foto, pos }.
// Entradas vazias são ignoradas. Chamar sem mensagens (ou só com
// vazias) esconde o balão.
function mostrarFalas(mensagens, nome) {
  const lista = (Array.isArray(mensagens) ? mensagens : [mensagens]).filter(function (m) { return !!textoDaFala(m); });
  dialogoFila = lista;
  dialogoIndice = 0;
  dialogoNomeAtual = nome || 'YoshiCat';
  dialogoComFotoPropria = lista.some(function (m) { return m && typeof m === 'object' && m.foto; });
  mostrarFalaAtual();
}

// Mantido pelo nome antigo (usado em quase todos os ecrãs) — uma só
// mensagem, mostrada já.
function atualizarDialogo(mensagem, nome) {
  mostrarFalas(mensagem, nome);
}

let _entradaComSom = null; // id da última entrada para a qual já tocou o som

// Cartão de "nova entrada desbloqueada" — genérico, usado por Explorar,
// Vinha, Adega e Festa. Recebe a entrada da Enciclopédia (ver
// desbloquearEntradaEnciclopedia() em js/explorar.js) ou null/undefined
// para esconder. Também esconde (e não toca som) enquanto a Enciclopédia
// não estiver aberta — ver cartaoNovaEntradaVisivel() em js/niveis.js.
// Só mostra o título — o texto completo fica só na Enciclopédia, um toque
// de distância através da pastilha "Ler".
function mostrarNovaEntrada(entrada) {
  const cartao = document.getElementById('app-unlock');
  const tituloEl = document.getElementById('unlock-titulo');
  if (!cartao || !tituloEl) return;

  if (!cartaoNovaEntradaVisivel(entrada)) {
    cartao.hidden = true;
    reposicionarFlutuantes();
    return;
  }

  tituloEl.textContent = entrada.titulo;
  // Som só quando a entrada aparece pela 1.ª vez (cada uma desbloqueia-se uma
  // só vez); voltar a desenhar o mesmo cartão (ex.: ao refazer o ecrã) não repete.
  if (entrada.id !== undefined && entrada.id !== _entradaComSom) {
    _entradaComSom = entrada.id;
    tocarSom('novaEntrada');
  }
  cartao.hidden = false;
  reposicionarFlutuantes();
}

// >>> fila-pastilhas (scripts/verificar-fila-objetivo.js carrega só este bloco)
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
  filaGuardarPosicao(idContentor); // quem redesenha a fila não a manda de volta ao princípio (ver filaGuardarPosicao)
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

  fila.addEventListener('scroll', function () {
    atualizarSetasDaFila(idContentor);
    FILA_PASTILHAS_POSICAO[idContentor] = fila.scrollLeft; // a posição que o jogador deixou
  });
  atualizarSetasDaFila(idContentor);

  // No frame seguinte (quem desenha põe os textos dos botões DEPOIS de chamar esta função, por isso só então a fila tem a largura
  // verdadeira): num redesenho (um clique, o relógio, voltar de uma tarefa) a fila fica onde o jogador a deixou; num ecrã
  // acabado de abrir desliza até ao botão do objetivo do dia, se estiver escondido (só uma vez).
  fila._filaPendente = true;
  filaAgendarAjuste(idContentor);
}

// ---------------------------------------------------------------------
// A FILA DESLIZA ATÉ AO BOTÃO DO OBJETIVO DO DIA — só ao ABRIR o ecrã (goTo() chama filaPrepararAbertura()). Se o botão a que
// o objetivo de hoje se refere (mapa em js/objetivos.js: objetivosBotoesDoEcra) não estiver INTEIRO à vista (escondido,
// cortado ou tapado por uma seta), a fila desliza até o mostrar; se já está, não mexe. Depois disso, qualquer redesenho (um
// clique, o relógio...) devolve a fila à posição que o jogador deixou (FILA_PASTILHAS_POSICAO), no frame seguinte. Com "reduzir movimento" não há
// animação. Só mexe no scroll da fila: não muda botões, ordem, textos nem regras.
// ---------------------------------------------------------------------

// Posição (scrollLeft) que o jogador deixou em cada fila, por id da fila.
const FILA_PASTILHAS_POSICAO = {};
// Filas (por id) que ainda vão deslizar ao objetivo, porque o ecrã acabou de abrir.
const FILAS_PARA_ABRIR = new Set();
const FILA_ECRA_POR_ID = { 'vinha-pill-scroll': 'vinha', 'adega-pill-scroll': 'garrafa', 'festa-pill-scroll': 'festa' };
const FILA_FOLGA_PX = 8; // folga entre o botão e a seta/borda quando a fila desliza

// Chamado por goTo() antes de desenhar o ecrã: esquece as posições e marca a fila do ecrã (se tiver) para deslizar ao objetivo.
function filaPrepararAbertura(ecra) {
  Object.keys(FILA_PASTILHAS_POSICAO).forEach(function (k) { delete FILA_PASTILHAS_POSICAO[k]; });
  FILAS_PARA_ABRIR.clear();
  Object.keys(FILA_ECRA_POR_ID).forEach(function (id) { if (FILA_ECRA_POR_ID[id] === ecra) FILAS_PARA_ABRIR.add(id); });
}

// Antes de uma fila ser substituída por outra igual: guarda onde estava (só se está desenhada e já ajustada, e o ecrã não acabou
// de abrir, em que a fila antiga é a da visita anterior).
function filaGuardarPosicao(idContentor) {
  if (FILAS_PARA_ABRIR.has(idContentor)) return;
  const velha = document.getElementById(idContentor);
  // Uma fila acabada de desenhar, ainda por ajustar (_filaPendente), está no princípio: não é a posição do jogador.
  if (velha && !velha._filaPendente && velha.clientWidth > 0) FILA_PASTILHAS_POSICAO[idContentor] = velha.scrollLeft;
}

// Repõe uma posição guardada (scrollLeft) sem animação. No princípio da fila (seta da esquerda escondida) fica no 0 de sempre;
// senão põe já os espaçadores das pontas a 56 px (o que têm quando as setas estão à vista) e o scroll certo, e as setas acertam o resto.
function filaPosicionarSemAnimar(fila, scroll) {
  fila.style.scrollBehavior = 'auto';
  if (scroll <= 1) {
    fila.scrollLeft = 0;
  } else {
    fila.style.setProperty('--pastilhas-margem-esq', '56px');
    fila.style.setProperty('--pastilhas-margem-dir', '56px');
    fila.scrollLeft = scroll;
  }
  atualizarSetasDaFila(fila.id);
  fila.style.scrollBehavior = '';
}

function filaMovimentoReduzido() {
  try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; }
}

// PURA. Quantos px é preciso deslizar para o botão (btnEsq..btnDir) ficar INTEIRO dentro da janela livre (limEsq..limDir):
// 0 se já está inteiro à vista, positivo para a direita, negativo para a esquerda, null se o botão é mais largo do que a janela
// (nunca ficaria inteiro: não se mexe).
function filaPassoParaMostrar(limEsq, limDir, btnEsq, btnDir) {
  if (btnDir - btnEsq > limDir - limEsq) return null;
  if (btnDir > limDir + 0.5) return btnDir - limDir + FILA_FOLGA_PX;
  if (btnEsq < limEsq - 0.5) return btnEsq - limEsq - FILA_FOLGA_PX;
  return 0;
}

// A janela livre da fila: a própria fila menos as setas que estão visíveis (cobrem as pontas).
function filaLimites(fila) {
  const fr = fila.getBoundingClientRect();
  const wrap = fila.closest('.pill-scroll-wrap');
  let esq = fr.left, dir = fr.right;
  const setaEsq = wrap && wrap.querySelector('.pill-arrow-left');
  const setaDir = wrap && wrap.querySelector('.pill-arrow-right');
  if (setaEsq && !setaEsq.classList.contains('oculto')) esq = Math.max(esq, setaEsq.getBoundingClientRect().right);
  if (setaDir && !setaDir.classList.contains('oculto')) dir = Math.min(dir, setaDir.getBoundingClientRect().left);
  return { esq: esq, dir: dir };
}

function filaBotaoInteiro(fila, btn) {
  const lim = filaLimites(fila);
  const r = btn.getBoundingClientRect();
  return filaPassoParaMostrar(lim.esq, lim.dir, r.left, r.right) === 0;
}

// Os espaçadores das pontas da fila crescem (12 -> 56 px) quando as setas aparecem (ver atualizarSetasDaFila): antes de deslizar
// põe já os dois a 56 px, compensando o scroll do lado esquerdo para o conteúdo não saltar, para que o fim da animação seja o
// mesmo que o cálculo do destino previu.
function filaPrepararMargens(fila) {
  const antes = parseFloat(fila.style.getPropertyValue('--pastilhas-margem-esq')) || 12;
  fila.style.scrollBehavior = 'auto';
  fila.style.setProperty('--pastilhas-margem-esq', '56px');
  fila.style.setProperty('--pastilhas-margem-dir', '56px');
  fila.scrollLeft = fila.scrollLeft + (56 - antes);
  fila.style.scrollBehavior = '';
}

// Desliza a fila até o botão ficar inteiro à vista. Calcula primeiro o destino (sem animação, e volta ao sítio) e só desliza se
// o botão ficar mesmo inteiro; devolve true se deslizou.
function filaDeslizarParaBotao(fila, btn) {
  const id = fila.id;
  const original = fila.scrollLeft;
  let destino = original;
  let inteiro = false;
  let noFim = false;
  fila.style.scrollBehavior = 'auto';
  try {
    for (let i = 0; i < 6; i++) {
      atualizarSetasDaFila(id);
      const lim = filaLimites(fila);
      const r = btn.getBoundingClientRect();
      const d = filaPassoParaMostrar(lim.esq, lim.dir, r.left, r.right);
      if (d === null) break;
      if (d === 0) { inteiro = true; break; }
      const antes = fila.scrollLeft;
      fila.scrollLeft = antes + d;
      if (fila.scrollLeft === antes) break; // chegou ao fim da fila
    }
    atualizarSetasDaFila(id);
    destino = fila.scrollLeft;
    if (!inteiro) inteiro = filaBotaoInteiro(fila, btn);
    noFim = destino >= fila.scrollWidth - fila.clientWidth - 1;
    fila.scrollLeft = original;
    atualizarSetasDaFila(id);
  } finally {
    fila.style.scrollBehavior = '';
  }
  if (!inteiro || destino === original) return false;
  filaPrepararMargens(fila);
  // No fim da fila vai-se até onde der (com os espaçadores a 56 px; ao chegar a seta da direita some e o espaçador encolhe).
  const alvo = noFim ? fila.scrollWidth - fila.clientWidth : destino;
  if (filaMovimentoReduzido()) {
    fila.style.scrollBehavior = 'auto';
    fila.scrollLeft = alvo;
    fila.style.scrollBehavior = '';
  } else {
    fila.scrollTo({ left: alvo, behavior: 'smooth' });
  }
  atualizarSetasDaFila(id);
  return true;
}

// Escolhe o botão do objetivo de hoje neste ecrã e desliza até ele se não estiver inteiro à vista. Para o primeiro objetivo
// pendente (por ordem) cujos botões (os que se podem usar) não estão à vista; se algum dos botões desse objetivo já está
// inteiro à vista (ex.: Destilar vinho ou Destilar bagaço), não mexe.
function filaDeslizarAoObjetivo(fila) {
  if (!fila || !(fila.clientWidth > 0)) return false;
  const ecra = FILA_ECRA_POR_ID[fila.id];
  if (!ecra || typeof objetivosBotoesDoEcra !== 'function') return false;
  const pedidos = objetivosBotoesDoEcra(state, ecra, diaLisboaDeHoje());
  const botoes = Array.prototype.slice.call(fila.querySelectorAll('.btn-pill'));
  for (let i = 0; i < pedidos.length; i++) {
    const todos = pedidos[i].acoes.indexOf('*') !== -1;
    const alvos = botoes.filter(function (b) {
      const acao = b.getAttribute('data-acao');
      return !b.disabled && acao !== null && (todos || pedidos[i].acoes.indexOf(acao) !== -1);
    });
    if (alvos.length === 0) continue;
    if (alvos.some(function (b) { return filaBotaoInteiro(fila, b); })) continue;
    if (filaDeslizarParaBotao(fila, alvos[0])) return true;
  }
  return false;
}

// Só depois de o ecrã estar desenhado (um frame, antes de pintar): com os textos dos botões já postos as medidas são as de verdade.
// Ecrã acabado de abrir: desliza ao objetivo (uma só vez). Redesenho: repõe a posição que o jogador deixou.
function filaAgendarAjuste(idContentor) {
  const fazer = function () {
    const fila = document.getElementById(idContentor);
    if (!fila) return;
    fila._filaPendente = false;
    if (FILAS_PARA_ABRIR.has(idContentor)) {
      FILAS_PARA_ABRIR.delete(idContentor);
      filaDeslizarAoObjetivo(fila);
    } else if (FILA_PASTILHAS_POSICAO[idContentor] !== undefined) {
      filaPosicionarSemAnimar(fila, FILA_PASTILHAS_POSICAO[idContentor]);
    }
  };
  if (window.requestAnimationFrame) window.requestAnimationFrame(fazer); else setTimeout(fazer, 0);
}
// <<< fila-pastilhas

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

// Cartão do topo da Quinta: encolhe/estica como o da Vinha/Adega (ver
// alternarCartaoVinha() em js/vinha.js), só que aqui o corpo fica
// sempre no HTML (ver #screen-quinta em index.html) e é uma classe CSS
// (".topcard.aberto", ver index.html) que o mostra ou esconde — porque
// o corpo é preenchido por vários ficheiros diferentes (estação, tempo,
// festa, nível, objetivos), não por um render único como na Vinha.
// Começa sempre encolhido (ver goTo() acima, que repõe isto a cada
// entrada na Quinta).
let quintaCartaoAberto = false;

function alternarCartaoQuinta() {
  quintaCartaoAberto = !quintaCartaoAberto;
  atualizarAspetoCartaoQuinta();
}

function atualizarAspetoCartaoQuinta() {
  const topcard = document.getElementById('quinta-topcard');
  if (!topcard) return;
  topcard.classList.toggle('aberto', quintaCartaoAberto);
  const header = topcard.querySelector('.topcard-header');
  if (header) header.setAttribute('aria-expanded', quintaCartaoAberto);
  if (typeof atualizarResumoQuinta === 'function') atualizarResumoQuinta();
}

// Aplica o fundo "normal" do ecrã atualmente ativo — usado por goTo() ao
// mudar de ecrã, e também por avancarFala() (ver acima) para devolver o
// fundo ao normal depois de uma história com foto própria terminar. Não
// cobre os ecrãs com fundo dinâmico próprio (Vinha, Adega, Proteger) —
// esses já tratam do seu fundo sempre que renderizam, e a história nunca
// corre lá (só na Quinta, por agora).
function restaurarFundoDoEcraAtual() {
  const ativo = document.querySelector('.screen.active');
  const screen = ativo ? ativo.id.replace(/^screen-/, '') : null;
  const fundoEcra = FUNDO_DOS_ECRAS[screen];
  if (screen === 'home') definirFundo('capa');
  else if (fundoEcra) definirFundo('foto', fundoEcra.src, fundoEcra.pos);
  else if (screen in FUNDO_DOS_ECRAS) definirFundo('paisagem');
}

// Cadeado na barra de baixo: acrescenta a classe "trancado" aos botões
// cujo ecrã ainda não está aberto (ver ecraDesbloqueado() em
// js/niveis.js) — só se atualiza ao mudar de ecrã, tal como o resto do
// cartão da Quinta (estação, tempo, ...).
function atualizarNavBloqueios() {
  if (typeof ecraDesbloqueado !== 'function') return;
  document.querySelectorAll('#app-bottomnav .nav-btn').forEach(function (btn) {
    const screen = btn.dataset.screen;
    btn.classList.toggle('trancado', !ecraDesbloqueado(screen));
  });
}

function goTo(screen, opcoes) {
  opcoes = opcoes || {};

  // Ecrã ainda trancado (ver ecraDesbloqueado() em js/niveis.js): mostra
  // a mensagem no balão do ecrã atual e não navega — jogadores antigos
  // (ver state.acesso.jogadorAntigo) nunca caem aqui.
  if (typeof ecraDesbloqueado === 'function' && !ecraDesbloqueado(screen)) {
    if (typeof mostrarMensagemTrancada === 'function') mostrarMensagemTrancada(screen);
    return;
  }

  // Ecrã de onde se está a sair — antes de trocar nada, cancela
  // qualquer temporizador de minijogo que esse ecrã tenha registado
  // (ver registarLimpezaAoSair()). Sair a meio de um minijogo conta
  // como desistir: sem penalização, só pára o relógio.
  const ecraAnterior = document.querySelector('.screen.active');
  const idAnterior = ecraAnterior ? ecraAnterior.id.replace(/^screen-/, '') : null;
  if (idAnterior && idAnterior !== screen && LIMPEZA_AO_SAIR_POR_ECRA[idAnterior]) {
    LIMPEZA_AO_SAIR_POR_ECRA[idAnterior]();
  }

  // Som de ambiente em ciclo (ex.: chuva — ver js/som.js): para sempre
  // ao mudar de ecrã; se o próximo ecrã precisar de ambiente, é ele que
  // o volta a ligar.
  if (idAnterior && idAnterior !== screen) pararSomAmbiente();

  if (ECRAS_PRINCIPAIS_BARRA.indexOf(screen) !== -1 || ECRAS_SEM_CHROME.indexOf(screen) !== -1) {
    historicoEcras = [];
  } else if (!opcoes.semHistorico && idAnterior && idAnterior !== screen) {
    historicoEcras.push(idAnterior);
  }

  document.querySelectorAll('.screen').forEach(function (s) { s.classList.remove('active'); });
  document.getElementById('screen-' + screen).classList.add('active');
  document.body.classList.toggle('tela-home', screen === 'home');
  // Festa de capítulo ainda por confirmar: sair do ecrã cancela-a (ver js/capitulos.js).
  if (typeof capitulosCancelarCelebracaoPendente === 'function') capitulosCancelarCelebracaoPendente();
  atualizarChromeNovoAspeto(screen);
  restaurarFundoDoEcraAtual();
  updateStatsDisplays();
  applyTranslations();
  atualizarLinhaEstacaoQuinta();
  atualizarLinhaTempoQuinta();
  atualizarFaixaFesta();
  if (screen === 'quinta') {
    quintaCartaoAberto = false;
    if (typeof atualizarCartaoNivelQuinta === 'function') atualizarCartaoNivelQuinta();
    if (typeof atualizarCapituloQuinta === 'function') atualizarCapituloQuinta();
    if (typeof atualizarCartaoObjetivosQuinta === 'function') atualizarCartaoObjetivosQuinta();
    if (typeof atualizarLinhaVisitaQuinta === 'function') atualizarLinhaVisitaQuinta();
    if (typeof atualizarResumoQuinta === 'function') atualizarResumoQuinta();
    atualizarAspetoCartaoQuinta();
    let mostrouHistoria = false;
    if (typeof mostrarHistoriaIntro === 'function' && mostrarHistoriaIntro()) mostrouHistoria = true;
    if (typeof verificarSubidaNivel === 'function' && verificarSubidaNivel()) mostrouHistoria = true;
    // Celebração de capítulo: só se nenhuma história acabou de aparecer
    // (senão espera pela visita seguinte). Ver js/capitulos.js.
    // Modo de teste (?capitulo=N): mostra a celebração sem escrever nada e,
    // nessa visita, dispensa a celebração a sério. Ver js/capitulos.js.
    let mostrouFesta = false;
    if (typeof capitulosCelebracaoDeTeste === 'function' && capitulosCelebracaoDeTeste()) {
      mostrouFesta = true; // só teste
    } else if (!mostrouHistoria && typeof capitulosAvaliarCelebracao === 'function') {
      mostrouFesta = capitulosAvaliarCelebracao();
    }
    // Ronda do Chizo (pedido do dia): só se nenhuma história nem festa de
    // capítulo apareceu nesta visita. Modo de teste (?pedido=chizo): ver js/ronda.js.
    if (typeof rondaChizoTeste === 'function' && rondaChizoTeste()) {
      // só teste
    } else if (!mostrouHistoria && !mostrouFesta && typeof rondaChizoAvaliar === 'function') {
      rondaChizoAvaliar();
    }
    garantirTempoAtualizado().then(function () {
      atualizarLinhaTempoQuinta();
      atualizarFaixaFesta();
      atualizarAmbienteExterior();
      tocarTrovaoSeTrovoada();
      if (document.getElementById('screen-quinta').classList.contains('active')) arcoIrisAvaliar();
    });
  }

  filaPrepararAbertura(screen); // a fila de botões (Vinha, Adega, Festa) desliza ao objetivo do dia só ao abrir o ecrã
  if (screen === 'vinha') enterVinha();
  if (screen === 'proteger') startProteger();
  if (screen === 'garrafa') renderGarrafaScreen();
  if (screen === 'engarrafar') enterEngarrafar();
  if (screen === 'explorar') enterExplorar();
  if (screen === 'enciclopedia') renderEnciclopedia();
  if (screen === 'perfil') renderPerfil();
  if (screen === 'conquistas') renderConquistas();
  if (screen === 'caderno') renderCaderno();
  if (screen === 'colecao') renderColecao();
  if (screen === 'estrada') renderEstrada();
  if (screen === 'lagar') renderLagar();
  if (screen === 'camara') renderCamara();
  if (screen === 'roxo') renderRoxo();
  if (screen === 'loja') renderLoja();
  if (screen === 'garrafas') renderGarrafas();
  if (screen === 'lingua') renderLinguaScreen();
  if (screen === 'festa') enterFesta();

  atualizarNavBloqueios();
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
