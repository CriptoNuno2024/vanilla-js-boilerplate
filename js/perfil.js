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
  conquistas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><circle cx="12" cy="9" r="5"></circle><path d="M9 13l-1.5 8L12 18l4.5 3-1.5-8"></path></svg>',
  caderno: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><path d="M6 3h11a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6z"></path><path d="M6 3v18"></path><path d="M9.5 8h5"></path><path d="M9.5 12h5"></path></svg>',
  conhecimento: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" width="26" height="26"><path d="M4 5.5c2.2-1.2 5.3-1.2 8 0v13c-2.7-1.2-5.8-1.2-8 0v-13z"></path><path d="M20 5.5c-2.2-1.2-5.3-1.2-8 0v13c2.7-1.2 5.8-1.2 8 0v-13z"></path></svg>'
};

const PERFIL_MEDALHA_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><circle cx="12" cy="9" r="5"></circle><path d="M9 13l-1.5 8L12 18l4.5 3-1.5-8"></path></svg>';

const PERFIL_GARRAFA_PEQUENA_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M10 2h4v3.8l1.8 2.7c.4.6.7 1.4.7 2.2V20a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2V10.7c0-.8.2-1.6.7-2.2L10 5.8V2z"></path><path d="M10 11.5h4"></path></svg>';

// Cartão "A Coleção x / 4": só a partir do nível 6 (colecaoVisivel, js/garrafa.js).
function colecaoCartaoPerfil() {
  if (typeof colecaoVisivel !== 'function' || !colecaoVisivel()) return '';
  return perfilCard(PERFIL_ICONES.garrafas, colecaoResumo(), 'colecao.title',
    ' role="button" tabindex="0" onclick="goTo(\'colecao\')" onkeydown="if (event.key === \'Enter\') goTo(\'colecao\')"');
}

function perfilCard(icone, value, i18nKey, atributos) {
  return '<div class="profile-card"' + (atributos || '') + '><div class="stat-icon">' + icone + '</div><div class="stat-value">' + value +
    '</div><div class="stat-label" data-i18n="' + i18nKey + '"></div></div>';
}

// Cartão "Caderno n / 15": só aparece com o Caderno aberto (nível 3, ou jogador
// antigo — ver ecraDesbloqueado em js/niveis.js); abaixo disso nem se vê.
function cadernoCartaoPerfil() {
  if (typeof cadernoResumo !== 'function' || typeof ecraDesbloqueado !== 'function' || !ecraDesbloqueado('caderno')) return '';
  return perfilCard(PERFIL_ICONES.caderno, cadernoResumo(), 'perfil.caderno',
    ' role="button" tabindex="0" onclick="goTo(\'caderno\')" onkeydown="if (event.key === \'Enter\') goTo(\'caderno\')"');
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
        perfilCard(PERFIL_ICONES.conquistas, conquistasResumo(), 'perfil.conquistas',
          ' role="button" tabindex="0" onclick="goTo(\'conquistas\')" onkeydown="if (event.key === \'Enter\') goTo(\'conquistas\')"') +
        cadernoCartaoPerfil() +
        colecaoCartaoPerfil() +
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
      '<p class="info-text nuvem-estado" id="perfil-nuvem-estado"></p>' +
      '<p class="info-text" id="perfil-apagar-aviso" data-i18n="perfil.apagarAviso" hidden></p>' +
    '</div>' +
    '<div class="action-panel">' +
      convidarHtml +
      '<button type="button" class="btn-pill pill-main pill-grande" onclick="goTo(\'enciclopedia\')" data-i18n="perfil.btnEnciclopedia"></button>' +
      '<button type="button" class="btn-ghost" onclick="perfilPedirApagar()" data-i18n="perfil.btnApagar"></button>' +
      '<button type="button" class="btn-ghost" onclick="goTo(\'home\')" data-i18n="perfil.btnSairInicio"></button>' +
    '</div>';

  const checkVibracao = document.getElementById('perfil-vibracao-check');
  if (checkVibracao) checkVibracao.checked = state.vibracao;
  const checkSom = document.getElementById('perfil-som-check');
  if (checkSom) checkSom.checked = state.som;

  atualizarDialogo('', '');
  applyTranslations();
  if (typeof nuvemAtualizarLinhaPerfil === 'function') nuvemAtualizarLinhaPerfil();
  perfilLigarIndicadorScroll();
}

// ---------------------------------------------------------------------
// INDICADOR DE "HÁ MAIS POR BAIXO" no cartão do Perfil (só aspeto):
// o painel acaba sempre por cima do painel de ações (nunca por baixo
// dele) e um esbatido dourado no fundo (CSS, "#perfil-container
// .scroll-panel::after") mostra que se pode deslizar; a classe "fim"
// apaga-o quando se chega ao fim. Nada aqui toca no estado.
// ---------------------------------------------------------------------
function perfilAtualizarPainel() {
  const sp = document.querySelector('#perfil-container .scroll-panel');
  const ap = document.querySelector('#perfil-container .action-panel');
  if (!sp) return;
  if (ap) {
    const folga = ap.getBoundingClientRect().top - sp.getBoundingClientRect().top - 8;
    if (folga > 120) sp.style.maxHeight = Math.floor(folga) + 'px';
  }
  sp.classList.toggle('fim', sp.scrollTop + sp.clientHeight >= sp.scrollHeight - 4);
}

function perfilLigarIndicadorScroll() {
  const sp = document.querySelector('#perfil-container .scroll-panel');
  if (!sp) return;
  sp.addEventListener('scroll', perfilAtualizarPainel, { passive: true });
  // Texto que muda depois (nuvem, aviso de apagar, língua) muda a altura.
  if (typeof MutationObserver === 'function') {
    new MutationObserver(perfilAtualizarPainel).observe(sp, { childList: true, subtree: true, characterData: true, attributes: true });
  }
  perfilAtualizarPainel();
}

window.addEventListener('resize', perfilAtualizarPainel);

function alternarVibracao(ligada) {
  state.vibracao = ligada;
  saveState(state);
}

function alternarSom(ligada) {
  state.som = ligada;
  saveState(state);
  somAplicarInterruptor(ligada);
}

// ---------------------------------------------------------------------
// APAGAR O MEU PROGRESSO — confirmação em dois toques (1.º: botão do
// Perfil; 2.º: "Apagar tudo"). Só o 2.º apaga. Ver nuvemApagarTudo() em
// js/nuvem.js (nuvem primeiro; se falhar, não se apaga nada).
// ---------------------------------------------------------------------

function perfilPedirApagar() {
  const aviso = document.getElementById('perfil-apagar-aviso');
  const painel = document.querySelector('#perfil-container .action-panel');
  if (!aviso || !painel) return;
  aviso.hidden = false;
  painel.innerHTML =
    '<button type="button" id="perfil-apagar-cancelar" class="btn-pill pill-main pill-grande" onclick="renderPerfil()" data-i18n="perfil.apagarCancelar"></button>' +
    '<button type="button" id="perfil-apagar-confirmar" class="btn-ghost" onclick="perfilApagarTudo()" data-i18n="perfil.apagarConfirmar"></button>';
  applyTranslations();
  aviso.scrollIntoView({ block: 'nearest' });
}

function perfilApagarBotoes(ativos) {
  ['perfil-apagar-cancelar', 'perfil-apagar-confirmar'].forEach(function (id) {
    const b = document.getElementById(id);
    if (b) { b.disabled = !ativos; b.style.opacity = ativos ? '' : '0.5'; }
  });
}

function perfilApagarTudo() {
  if (apagando) return;
  // Trava tudo o que grava, ANTES de apagar.
  apagando = true;
  nuvemCancelarGravacaoPendente();
  if (typeof pararRelogioVinha === 'function') pararRelogioVinha();
  perfilApagarBotoes(false);
  const aviso = document.getElementById('perfil-apagar-aviso');
  if (aviso) aviso.textContent = t('perfil.apagarA');

  nuvemApagarTudo(function (ok) {
    if (!ok) {
      // Falhou ou não respondeu: não se apagou nada, nem no aparelho.
      apagando = false;
      if (aviso) aviso.textContent = t('perfil.apagarAviso');
      perfilApagarBotoes(true);
      showMessage(t('perfil.apagarFalha'));
      return;
    }
    // Nuvem apagada (ou inexistente): só as duas chaves conhecidas.
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TEMPO_CACHE_KEY);
    } catch (e) { /* sem acesso ao localStorage: nada mais a apagar */ }
    if (aviso) aviso.textContent = t('perfil.apagarFeito');
    // "apagando" fica ligado: nada volta a gravar antes do reload.
    setTimeout(function () { location.reload(); }, 600);
  });
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

// ---------------------------------------------------------------------
// FOTO DO TELEGRAM NO BOTÃO DO PERFIL (.profile-btn na barra de topo) —
// SÓ MOSTRA, nunca guarda: lê apenas tg.initDataUnsafe.user.photo_url (nenhum
// outro campo do utilizador) e o endereço fica numa variável local e no src
// da imagem — não vai para o state, localStorage, nuvem, logs nem bot.
// A reserva é a cara do YoshiCat (js/personagens.js), que aparece logo; a
// foto do Telegram só a substitui depois de carregar. Se não houver foto, o
// endereço for inválido, a foto falhar ou o jogo abrir fora do Telegram,
// fica a cara; se esta também falhar, fica o desenho (SVG) de sempre. O
// botão é HTML estático (index.html): nada o redesenha.
// ---------------------------------------------------------------------
function fotoTelegramEnderecoValido(endereco) {
  try {
    const u = new URL(endereco);
    if (u.protocol !== 'https:') return false;
    return ['t.me', 'telegram.org'].some(function (d) {
      return u.hostname === d || u.hostname.endsWith('.' + d);
    });
  } catch (e) {
    return false;
  }
}

// Mostra "src" no botão (substituindo a imagem que lá estiver) só depois
// de carregar: nunca há imagem partida nem botão vazio.
function perfilBotaoMostrarImagem(botao, src, aoCarregar) {
  const img = new Image();
  img.className = 'profile-foto';
  img.alt = '';
  img.referrerPolicy = 'no-referrer';
  img.onload = function () {
    if (aoCarregar && !aoCarregar()) return;
    botao.querySelectorAll('img.profile-foto').forEach(function (antiga) { botao.removeChild(antiga); });
    const desenho = botao.querySelector('svg');
    if (desenho) desenho.style.display = 'none';
    botao.appendChild(img);
  };
  img.src = src;
}

function fotoTelegramNoBotao() {
  try {
    const botao = document.querySelector('.profile-btn');
    if (!botao) return;
    let temFotoTelegram = false;

    // Reserva: a cara do YoshiCat (nunca sobrepõe a foto do Telegram).
    const cara = typeof caraDoPersonagem === 'function' ? caraDoPersonagem('YoshiCat') : null;
    if (cara) perfilBotaoMostrarImagem(botao, cara, function () { return !temFotoTelegram; });

    const utilizador = tg && tg.initDataUnsafe && tg.initDataUnsafe.user;
    const endereco = utilizador && utilizador.photo_url;
    if (typeof endereco !== 'string' || !fotoTelegramEnderecoValido(endereco)) return;
    perfilBotaoMostrarImagem(botao, endereco, function () { temFotoTelegram = true; return true; });
  } catch (e) { /* sem imagem: fica o desenho de sempre */ }
}
fotoTelegramNoBotao();
