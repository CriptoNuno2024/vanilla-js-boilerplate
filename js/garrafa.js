// ---------------------------------------------------------------------
// A ADEGA — o processo real do Moscatel de Setúbal
//
//   Prensar (Uvas -> Gotas de Moscatel + Bagaço)
//     -> Alambique (Bagaço -> Aguardente)
//     -> Fortificar (100 Gotas + 1 Aguardente -> um lote a descansar)
//     -> Cave (o lote descansa em tempo real; um lote de cada vez)
//     -> Engarrafar (+1 Garrafa, +Reputação conforme os dias de descanso)
//
// Prensar e Alambique podem ser usados livremente, mesmo com um lote a
// descansar na Cave — só juntam material para o lote seguinte.
// ---------------------------------------------------------------------

// ===================================================================
// REGRAS DO DESCANSO NA CAVE — "Opção A".
// Tudo o que rege o descanso está só aqui: para trocar para outra
// opção (ex: até 7 dias, com risco dos porcos), muda só este bloco —
// o resto do código nunca tem estes números espalhados.
// ===================================================================
const REGRAS_DESCANSO_CAVE = {
  diasMinimos: 1,
  // Ordenado por dias crescente. Aplica-se o ÚLTIMO cujo "dias" seja
  // <= aos dias reais de descanso (3 dias ou mais usa sempre os +50).
  reputacaoPorDias: [
    { dias: 1, reputacao: 30 },
    { dias: 2, reputacao: 40 },
    { dias: 3, reputacao: 50 }
  ],
  // No inverno o vinho descansa melhor.
  bonusInvernoReputacao: 10
};

function reputacaoDaCave(diasDescansados) {
  const tabela = REGRAS_DESCANSO_CAVE.reputacaoPorDias;
  let valor = 0;
  for (let i = 0; i < tabela.length; i++) {
    if (diasDescansados >= tabela[i].dias) valor = tabela[i].reputacao;
  }
  if (estacaoAtual() === 'inverno') valor += REGRAS_DESCANSO_CAVE.bonusInvernoReputacao;
  return valor;
}

// Custos e produção de cada passo. O bagaço é feito para chegar à
// vontade: com o que o Prensar dá por cada uso, um jogador normal
// nunca fica preso à espera de bagaço para o Alambique.
const ADEGA_CUSTO_UVAS_PRENSAR = 10;
const ADEGA_CUSTO_BAGACO_ALAMBIQUE = 3;
const ADEGA_CUSTO_GOTAS_FORTIFICAR = 100;
const ADEGA_CUSTO_AGUARDENTE_FORTIFICAR = 1;

const ADEGA_COOLDOWN_MS = {
  prensar: 2 * 60 * 60 * 1000,   // 2h
  alambique: 3 * 60 * 60 * 1000  // 3h
};

// Fotos de fundo de cada passo.
const ADEGA_FOTOS = {
  prensar: 'assets/vinha/prensar.jpg',
  alambique: 'assets/ecras/bagaco.jpg',
  fortificar: 'assets/vinha/mexer_mosto.jpg',
  cave: 'assets/ecras/cave_de_inverno.jpg',
  engarrafar: 'assets/vinha/engarrafar.jpg'
};

// Ponto de foco (background-position) para as fotos onde o corte
// automático ao centro tapava a cabeça do YoshiCat — só aspeto, a
// foto em si não muda. As que não estão aqui continuam ao centro.
const ADEGA_FOTO_POS = {};
ADEGA_FOTO_POS[ADEGA_FOTOS.prensar] = 'center 15%';
ADEGA_FOTO_POS[ADEGA_FOTOS.alambique] = 'center 10%';

let adegaMensagemAtual = '';
let adegaNovaEntrada = null;
let adegaFotoAtual = null;

// Estado do cartão pequeno do topo (aberto/fechado) — só aspeto, mesmo
// padrão da Vinha (ver alternarCartaoVinha() em js/vinha.js).
let adegaCartaoAberto = false;

function alternarCartaoAdega() {
  adegaCartaoAberto = !adegaCartaoAberto;
  renderAdega();
}

// Ícones simples de traço para o Bagaço e a Aguardente (substituem os
// emojis 🟤 e 🥃).
const ADEGA_BAGACO_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><circle cx="9" cy="10" r="2.2"></circle><circle cx="15" cy="10" r="2.2"></circle><circle cx="12" cy="15.5" r="2.2"></circle></svg>';
const ADEGA_AGUARDENTE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M9.5 3h5"></path><path d="M10.5 3v6.5L5.8 18a2 2 0 0 0 1.7 3h9a2 2 0 0 0 1.7-3l-4.7-8.5V3"></path></svg>';

function preCarregarFotoAdega(chave) {
  if (ADEGA_FOTOS[chave]) new Image().src = ADEGA_FOTOS[chave];
}

// Para testar: acrescenta ?dias=3 ao endereço para simular que um lote
// já descansou 3 dias, em vez de esperares o tempo real. Só se aplica
// quando já existe mesmo um lote a descansar (state.adega.lote).
function diasForcadosNoEndereco() {
  const valor = new URLSearchParams(location.search).get('dias');
  if (valor === null) return null;
  const n = Number(valor);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

// Dias de descanso do lote atual (pode ser fracionário, ex: 1.25 dias).
function diasDescansadosNaCave() {
  if (!state.adega.lote) return 0;
  const forcado = diasForcadosNoEndereco();
  if (forcado !== null) return forcado;
  return (Date.now() - state.adega.lote.iniciadoEm) / (24 * 60 * 60 * 1000);
}

function formatarDiasAdega(diasFracionarios) {
  const totalMin = Math.max(0, Math.round(diasFracionarios * 24 * 60));
  const dias = Math.floor(totalMin / (24 * 60));
  const horas = Math.floor((totalMin % (24 * 60)) / 60);
  if (dias > 0) return dias + 'd' + (horas > 0 ? ' ' + horas + 'h' : '');
  if (horas > 0) return horas + 'h';
  return (totalMin % 60) + 'm';
}

function tempoRestanteAdega(acao) {
  const ultima = state.adega.cooldowns[acao];
  if (!ultima) return 0;
  const cd = ADEGA_COOLDOWN_MS[acao] || 0;
  return Math.max(0, cd - (Date.now() - ultima));
}

function registarCooldownAdega(acao) {
  state.adega.cooldowns[acao] = Date.now();
}

function renderGarrafaScreen() {
  adegaMensagemAtual = '';
  adegaNovaEntrada = null;
  adegaFotoAtual = null;
  adegaCartaoAberto = false;
  preCarregarFotoAdega('prensar');
  preCarregarFotoAdega('alambique');
  renderAdega();
}

function botaoAdega(acao, i18nKey, bloqueado, sufixoExtra) {
  const restante = tempoRestanteAdega(acao);
  const emCooldown = restante > 0;
  const desabilitado = emCooldown || !!bloqueado;
  const sufixoCooldown = emCooldown ? (RELOGIO_PASTILHA_SVG + ' (' + formatarTempoVinha(restante) + ')') : (sufixoExtra || '');
  if (!desabilitado) preCarregarFotoAdega(acao);
  return '<button class="btn-pill" ' + (desabilitado ? 'disabled' : '') +
    ' onclick="executarAcaoAdega(\'' + acao + '\')">' +
    '<span data-i18n="' + i18nKey + '"></span><span class="cooldown-suffix">' + sufixoCooldown + '</span>' +
    '</button>';
}

function renderAdega() {
  const container = document.getElementById('garrafa-container');
  const a = state.adega;
  const temLote = !!a.lote;

  let botoesHtml = '';
  botoesHtml += botaoAdega('prensar', 'adega.btnPrensar', state.uvas < ADEGA_CUSTO_UVAS_PRENSAR);
  botoesHtml += botaoAdega('alambique', 'adega.btnAlambique', a.bagaco < ADEGA_CUSTO_BAGACO_ALAMBIQUE);

  let corpoHtml = '';
  if (temLote) {
    const dias = diasDescansadosNaCave();
    const diasCompletos = Math.floor(dias);
    const pronto = diasCompletos >= REGRAS_DESCANSO_CAVE.diasMinimos;
    const repPrevista = reputacaoDaCave(diasCompletos);
    const sufixoEngarrafar = pronto ? '' : (' (' + formatarDiasAdega(REGRAS_DESCANSO_CAVE.diasMinimos - dias) + ')');

    if (adegaCartaoAberto) {
      corpoHtml = '<div class="cartao-corpo">' +
        '<p class="phase-desc" data-i18n="garrafa.passo3"></p>' +
        '<p class="phase-progress">' + t('adega.caveDescansado').replace('{tempo}', formatarDiasAdega(dias)) + '</p>' +
        '<p class="phase-progress">' + t('adega.caveReputacaoPrevista').replace('{valor}', repPrevista) + '</p>' +
      '</div>';
    }
    botoesHtml += botaoAdega('engarrafar', 'adega.btnEngarrafar', !pronto, sufixoEngarrafar);
  } else {
    if (adegaCartaoAberto) {
      corpoHtml = '<div class="cartao-corpo"><p class="phase-desc" data-i18n="garrafa.descricao"></p></div>';
    }
    botoesHtml += botaoAdega('fortificar', 'adega.btnFortificar',
      state.gotas < ADEGA_CUSTO_GOTAS_FORTIFICAR || a.aguardente < ADEGA_CUSTO_AGUARDENTE_FORTIFICAR);
  }

  const cartaoHtml =
    '<div class="topcard' + (adegaCartaoAberto ? ' aberto' : '') + '">' +
      '<button type="button" class="topcard-header" onclick="alternarCartaoAdega()" aria-expanded="' + adegaCartaoAberto + '">' +
        '<span class="cartao-textos">' +
          '<span class="mini-title" data-i18n="garrafa.title"></span>' +
          '<span class="chrome-mini-stats">' +
            '<span class="resource-item">' + ADEGA_BAGACO_SVG + ' <span data-i18n="adega.recursoBagaco"></span> ' + a.bagaco + '</span>' +
            '<span class="resource-item">' + ADEGA_AGUARDENTE_SVG + ' <span data-i18n="adega.recursoAguardente"></span> ' + a.aguardente + '</span>' +
          '</span>' +
        '</span>' +
        '<svg class="cartao-seta" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M6 9l6 6 6-6"></path></svg>' +
      '</button>' +
      corpoHtml +
    '</div>';

  container.innerHTML =
    cartaoHtml +
    construirFilaPastilhas('adega-pill-scroll', botoesHtml, 'vinha.verMaisTarefas');

  const fotoFundoAdega = adegaFotoAtual || (temLote ? ADEGA_FOTOS.cave : ADEGA_FOTOS.prensar);
  definirFundo('foto', fotoFundoAdega, ADEGA_FOTO_POS[fotoFundoAdega]);

  marcarPastilhaPrincipal(container);
  configurarFilaPastilhas('adega-pill-scroll');
  mostrarNovaEntrada(adegaNovaEntrada);
  atualizarDialogo(adegaMensagemAtual, 'YoshiCat');
  applyTranslations();
}

function executarAcaoAdega(acao) {
  adegaFotoAtual = null;
  adegaNovaEntrada = null;
  const a = state.adega;

  if (tempoRestanteAdega(acao) > 0) {
    adegaMensagemAtual = t('vinha.msgCooldown').replace('{tempo}', formatarTempoVinha(tempoRestanteAdega(acao)));
    renderAdega();
    return;
  }

  if (acao === 'prensar') {
    if (state.uvas < ADEGA_CUSTO_UVAS_PRENSAR) {
      adegaMensagemAtual = t('adega.msgFaltaUvasPrensar').replace('{n}', ADEGA_CUSTO_UVAS_PRENSAR);
      renderAdega();
      return;
    }
    state.uvas -= ADEGA_CUSTO_UVAS_PRENSAR;
    const gotasGanhas = randInt(8, 12);
    const bagacoGanho = randInt(2, 4);
    state.gotas += gotasGanhas;
    a.bagaco += bagacoGanho;
    registarCooldownAdega('prensar');
    adegaMensagemAtual = t('garrafa.passo1') + ' ' +
      t('adega.resultadoPrensar').replace('{gotas}', gotasGanhas).replace('{bagaco}', bagacoGanho);
    adegaFotoAtual = ADEGA_FOTOS.prensar;
  } else if (acao === 'alambique') {
    if (a.bagaco < ADEGA_CUSTO_BAGACO_ALAMBIQUE) {
      adegaMensagemAtual = t('adega.msgFaltaBagacoAlambique').replace('{n}', ADEGA_CUSTO_BAGACO_ALAMBIQUE);
      renderAdega();
      return;
    }
    a.bagaco -= ADEGA_CUSTO_BAGACO_ALAMBIQUE;
    a.aguardente += 1;
    registarCooldownAdega('alambique');
    adegaMensagemAtual = t('adega.flavorAlambique') + ' ' + t('adega.resultadoAlambique');
    adegaNovaEntrada = desbloquearEntradaEnciclopedia('bagacoAlambique');
    adegaFotoAtual = ADEGA_FOTOS.alambique;
  } else if (acao === 'fortificar') {
    if (a.lote) {
      adegaMensagemAtual = t('adega.msgJaHaLote');
      renderAdega();
      return;
    }
    if (state.gotas < ADEGA_CUSTO_GOTAS_FORTIFICAR || a.aguardente < ADEGA_CUSTO_AGUARDENTE_FORTIFICAR) {
      adegaMensagemAtual = t('adega.msgFaltaFortificar');
      renderAdega();
      return;
    }
    state.gotas -= ADEGA_CUSTO_GOTAS_FORTIFICAR;
    a.aguardente -= ADEGA_CUSTO_AGUARDENTE_FORTIFICAR;
    a.lote = { iniciadoEm: Date.now() };
    adegaMensagemAtual = t('garrafa.passo2') + ' ' + t('adega.resultadoFortificar');
    adegaNovaEntrada = desbloquearEntradaEnciclopedia('aguardenteAdega');
    adegaFotoAtual = ADEGA_FOTOS.fortificar;
  } else if (acao === 'engarrafar') {
    if (!a.lote) return;
    const diasCompletos = Math.floor(diasDescansadosNaCave());
    if (diasCompletos < REGRAS_DESCANSO_CAVE.diasMinimos) {
      adegaMensagemAtual = t('adega.msgAindaNaoPode').replace('{dias}', REGRAS_DESCANSO_CAVE.diasMinimos);
      renderAdega();
      return;
    }
    const repGanha = reputacaoDaCave(diasCompletos);
    state.garrafas += 1;
    state.reputacao += repGanha;
    state.ultimaGarrafaData = new Date().toLocaleDateString(localeAtual());
    a.historico.push({ data: state.ultimaGarrafaData, estacao: estacaoAtual(), diasDescanso: diasCompletos });
    a.lote = null;
    adegaMensagemAtual = t('garrafa.passo4') + ' ' + t('adega.resultadoEngarrafar').replace('{rep}', repGanha);
    adegaNovaEntrada = desbloquearEntradaEnciclopedia('curtimenta');
    adegaFotoAtual = ADEGA_FOTOS.engarrafar;
    tocarSom('engarrafarPop');
  } else {
    return;
  }

  if (typeof marcarObjetivoCumprido === 'function') marcarObjetivoCumprido('adega_' + acao);
  saveState(state);
  updateStatsDisplays();
  renderAdega();
}
