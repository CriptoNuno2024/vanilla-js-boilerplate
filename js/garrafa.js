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
  // <= aos dias reais de descanso (4 dias ou mais usa sempre os +60).
  reputacaoPorDias: [
    { dias: 1, reputacao: 30 },
    { dias: 2, reputacao: 40 },
    { dias: 3, reputacao: 50 },
    { dias: 4, reputacao: 60 }
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

// ---------------------------------------------------------------------
// COR DA GARRAFA — vem dos dias de descanso (nada é gravado: lê-se o
// diasDescanso que já existe em state.adega.historico). 1 dia = Jovem,
// 2 = Dourado, 3 = Âmbar, 4 ou mais = Cobre. Dias em falta ou inválidos
// usam a Jovem. Reutilizável (ex.: pela prateleira da Coleção): devolve
// { imagem, nomeKey, dias }, com dias = null se o valor não era válido.
// ---------------------------------------------------------------------
const GARRAFAS_POR_DIAS = [
  { dias: 1, imagem: 'assets/garrafas/garrafa_1_jovem.jpg', nomeKey: 'adega.garrafaJovem' },
  { dias: 2, imagem: 'assets/garrafas/garrafa_2_dourado.jpg', nomeKey: 'adega.garrafaDourado' },
  { dias: 3, imagem: 'assets/garrafas/garrafa_3_ambar.jpg', nomeKey: 'adega.garrafaAmbar' },
  { dias: 4, imagem: 'assets/garrafas/garrafa_4_cobre.jpg', nomeKey: 'adega.garrafaCobre' }
];

function garrafaPorDias(dias) {
  const n = Number(dias);
  const valido = dias !== null && dias !== undefined && Number.isFinite(n) && n >= 1;
  const d = valido ? Math.floor(n) : null;
  let escolhida = GARRAFAS_POR_DIAS[0];
  if (valido) {
    GARRAFAS_POR_DIAS.forEach(function (g) { if (d >= g.dias) escolhida = g; });
  }
  return { imagem: escolhida.imagem, nomeKey: escolhida.nomeKey, dias: d };
}

// "Âmbar · 3 dias" — o nome e os dias aparecem sempre juntos, porque o
// Dourado e o Âmbar quase não se distinguem num ecrã pequeno.
function garrafaLegenda(g) {
  const dias = g.dias === null ? '' :
    ' · ' + t(g.dias === 1 ? 'adega.garrafaDiasUm' : 'adega.garrafaDias').replace('{n}', g.dias);
  return t(g.nomeKey) + dias;
}

// Garrafa acabada de engarrafar (só em memória): preenchida por
// executarAcaoAdega('engarrafar') e lida pela página da garrafa (ver
// renderEngarrafar() abaixo) para mostrar o resultado.
let adegaGarrafaFeita = null;

// ---------------------------------------------------------------------
// ESTADO DO LOTE PARA A PÁGINA DA GARRAFA — função pura (não lê o
// state nem o relógio), por isso fácil de testar. Recebe os dias de
// descanso (fracionários, ver diasDescansadosNaCave()); valores
// negativos ou inválidos (ex.: relógio do aparelho errado) contam como 0.
// Devolve:
//   diasCompletos  dias inteiros de descanso
//   atual          garrafaPorDias(diasCompletos), ou null antes de 1 dia
//   proxima        { dias, imagem, nomeKey } da próxima cor, ou null na última (Cobre)
//   msAteProxima   milissegundos até à próxima cor (0 na última)
//   fracao         0 a 1, progresso entre a cor anterior e a próxima (1 na última)
// ---------------------------------------------------------------------
const DIA_MS = 24 * 60 * 60 * 1000;

function estadoGarrafaLote(diasDescanso) {
  const n = Number(diasDescanso);
  const dias = Number.isFinite(n) && n > 0 ? n : 0;
  const diasCompletos = Math.floor(dias);
  let proxima = null;
  let anterior = 0;
  for (let i = 0; i < GARRAFAS_POR_DIAS.length; i++) {
    if (GARRAFAS_POR_DIAS[i].dias > dias) { proxima = GARRAFAS_POR_DIAS[i]; break; }
    anterior = GARRAFAS_POR_DIAS[i].dias;
  }
  return {
    diasCompletos: diasCompletos,
    atual: diasCompletos >= 1 ? garrafaPorDias(diasCompletos) : null,
    proxima: proxima,
    msAteProxima: proxima ? Math.round((proxima.dias - dias) * DIA_MS) : 0,
    fracao: proxima ? (dias - anterior) / (proxima.dias - anterior) : 1
  };
}

// "5 h 20 min", "2 d 3 h", "12 min" — arredonda para cima, para nunca
// mostrar "0 min" antes de a hora chegar.
function formatarFaltaGarrafa(ms) {
  const totalMin = Math.max(1, Math.ceil(ms / 60000));
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  if (d > 0) return d + ' d' + (h > 0 ? ' ' + h + ' h' : '');
  if (h > 0) return h + ' h' + (m > 0 ? ' ' + m + ' min' : '');
  return m + ' min';
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
  adegaGarrafaFeita = null;
  adegaCartaoAberto = false;
  preCarregarFotoAdega('prensar');
  preCarregarFotoAdega('alambique');
  renderAdega();
}

function botaoAdega(acao, i18nKey, bloqueado, sufixoExtra, aoClicar) {
  const restante = tempoRestanteAdega(acao);
  const emCooldown = restante > 0;
  const desabilitado = emCooldown || !!bloqueado;
  const sufixoCooldown = emCooldown ? (RELOGIO_PASTILHA_SVG + ' (' + formatarTempoVinha(restante) + ')') : (sufixoExtra || '');
  if (!desabilitado) preCarregarFotoAdega(acao);
  return '<button class="btn-pill" ' + (desabilitado ? 'disabled' : '') +
    ' onclick="' + (aoClicar || 'executarAcaoAdega(\'' + acao + '\')') + '">' +
    '<span data-i18n="' + i18nKey + '"></span><span class="cooldown-suffix">' + sufixoCooldown + '</span>' +
    '</button>';
}

// ---------------------------------------------------------------------
// CAVE DE RESERVA — vitrine só de leitura, aberta no Nível 5 (nada é
// gravado nem premiado). Mesmo teste que ecraDesbloqueado() em
// js/niveis.js: um jogador antigo (state.acesso.jogadorAntigo) tem tudo
// aberto. A Reserva Especial é a que a Fechadura do Proteger defende.
// ---------------------------------------------------------------------
const CAVE_RESERVA_NIVEL = 5;
const CAVE_RESERVA_FOTO = 'assets/vinha/barril_dourado.jpg';

function caveReservaAberta() {
  return !!state.acesso.jogadorAntigo || nivelPelaReputacao(state.reputacao) >= CAVE_RESERVA_NIVEL;
}

// Maior diasDescanso do histórico, ou null se não houver dados (nada inventado).
function garrafaQueMaisDescansou() {
  const h = state.adega && state.adega.historico;
  if (!Array.isArray(h)) return null;
  let maior = null;
  h.forEach(function (e) {
    const d = e && Number(e.diasDescanso);
    if (Number.isFinite(d) && d >= 1 && (maior === null || d > maior)) maior = d;
  });
  return maior === null ? null : Math.floor(maior);
}

// Prateleira da Coleção (Nível 6) — só leitura, calculada a partir de
// state.adega.historico (nada é gravado). As garrafas de festa (Edição São
// Martinho) contam à parte; as outras, por dias de descanso: 1, 2, 3 ou mais.
// Entradas sem campos (garrafas antigas) são ignoradas.
const COLECAO_COR_POR_NOME = {
  'adega.garrafaJovem': 'jovem', 'adega.garrafaDourado': 'dourado',
  'adega.garrafaAmbar': 'ambar', 'adega.garrafaCobre': 'cobre'
};

function colecaoVisivel() {
  return !!state.acesso.jogadorAntigo || nivelPelaReputacao(state.reputacao) >= 6;
}

function contarColecao() {
  const h = state.adega && state.adega.historico;
  const c = { saoMartinho: 0, dias1: 0, dias2: 0, dias3: 0 };
  if (!Array.isArray(h)) return c;
  h.forEach(function (e) {
    if (!e || typeof e !== 'object') return;
    if (e.festa) { c.saoMartinho++; return; }
    const d = Number(e.diasDescanso);
    if (e.diasDescanso === null || e.diasDescanso === undefined || !Number.isFinite(d)) return;
    if (d === 1) c.dias1++;
    else if (d === 2) c.dias2++;
    else if (d >= 3) c.dias3++;
  });
  return c;
}

// Coleção do capítulo 6 (só leitura, sem ecrã): as garrafas feitas a partir
// do nível 6, isto é, do historico desde a posição guardada em
// state.niveis.garrafasAoNivel6. Vazia enquanto o campo for null.
function colecaoGarrafasNovas(estado) {
  const n = estado && estado.niveis ? estado.niveis.garrafasAoNivel6 : null;
  const h = estado && estado.adega && estado.adega.historico;
  if (typeof n !== 'number' || !Number.isFinite(n) || !Array.isArray(h)) return [];
  return h.slice(Math.max(0, n));
}

// Cores (jovem, dourado, ambar, cobre) já feitas entre essas garrafas, pelos
// dias de descanso (garrafaPorDias). Garrafas de festa (jeropiga) não contam.
function colecaoCoresFeitas(estado) {
  const cores = { jovem: false, dourado: false, ambar: false, cobre: false };
  const nomes = COLECAO_COR_POR_NOME;
  colecaoGarrafasNovas(estado).forEach(function (e) {
    if (!e || typeof e !== 'object' || e.festa) return;
    const g = garrafaPorDias(e.diasDescanso);
    if (g.dias === null) return; // sem dias válidos: não conta
    cores[nomes[g.nomeKey]] = true;
  });
  return cores;
}

// Botão de entrada no ecrã "A Coleção" (Nível 6): no cartão da Adega (Cave de Reserva).
function colecaoBotaoEntradaHtml() {
  if (!colecaoVisivel()) return '';
  return '<button type="button" class="btn-ghost colecao-entrada" onclick="goTo(\'colecao\')" data-i18n="colecao.btn"></button>';
}

// "x / 4" do ecrã e do cartão do Perfil: cores feitas desde o nível 6.
function colecaoResumo() {
  const cores = colecaoCoresFeitas(state);
  return GARRAFAS_POR_DIAS.filter(function (g) { return cores[COLECAO_COR_POR_NOME[g.nomeKey]]; }).length + ' / ' + GARRAFAS_POR_DIAS.length;
}

// Ecrã "A Coleção" (só leitura, Nível 6; ver ecraDesbloqueado('colecao') em js/niveis.js):
// grelha 2x2 com as 4 cores; as que ainda não foram feitas aparecem apagadas.
// Ao entrar no ecrã (ver goTo() em js/main.js): esquece o resultado da arrumação anterior.
function renderColecao() {
  if (typeof colecaoResultado !== 'undefined') colecaoResultado = null;
  renderColecaoDesenhar();
}

function renderColecaoDesenhar() {
  const container = document.getElementById('colecao-container');
  const cores = colecaoCoresFeitas(state);
  const celulas = GARRAFAS_POR_DIAS.map(function (g) {
    const feita = !!cores[COLECAO_COR_POR_NOME[g.nomeKey]];
    return '<div class="colecao-cor' + (feita ? '' : ' por-fazer') + '">' +
      '<img src="' + g.imagem + '" alt="" decoding="async">' +
      '<p class="colecao-nome"><span>' + t(g.nomeKey) + '</span>' + (feita ? '<span class="colecao-visto" aria-hidden="true">✓</span>' : '') + '</p>' +
    '</div>';
  }).join('');

  container.innerHTML =
    '<div class="topcard">' +
      '<p class="mini-title" data-i18n="colecao.title"></p>' +
      '<p class="mini-sub">' + colecaoResumo() + '</p>' +
    '</div>' +
    '<div class="colecao-painel">' + celulas + '</div>' +
    '<div class="action-panel">' +
      '<button type="button" class="btn-ghost" onclick="goTo(\'garrafas\')" data-i18n="garrafas.btn"></button>' +
      // Tarefa do dia "Arrumar a Coleção" (nível 6; ver js/reserva.js), por cima do "Voltar"
      (typeof colecaoTarefaBotaoHtml === 'function' ? colecaoTarefaBotaoHtml() : '') +
      '<button type="button" class="btn-pill pill-main pill-grande" onclick="voltarEcraAnterior()" data-i18n="nav.voltar"></button>' +
    '</div>';

  // Depois de arrumar: a garrafa de fundo e o agradecimento (ver colecaoArrumarClique() em js/reserva.js).
  if (typeof colecaoResultado !== 'undefined' && colecaoResultado) {
    definirFundo('foto', COLECAO_TAREFA_CONFIG.imagemResultado);
    atualizarDialogo(t('colecao.arrumarOk').replace('{rep}', colecaoResultado.rep), 'YoshiCat');
  } else {
    atualizarDialogo('', '');
  }
  applyTranslations();
}

// Ecrã "As Garrafas" (Nível 6; ver ecraDesbloqueado('garrafas') em js/niveis.js): lista só de
// leitura de TODAS as garrafas de state.adega.historico, a mais recente primeiro. Nada é gravado.
// Número = posição no historico (1.ª = 1); a de festa não leva número, leva a etiqueta da edição.
// Ano lido do fim do texto da data; sem ano ou sem estação válidos, a linha sai sem eles.
const GARRAFAS_ESTACOES = ['inverno', 'primavera', 'verao', 'outono'];

function garrafasLinhas() {
  const h = state.adega && state.adega.historico;
  if (!Array.isArray(h)) return [];
  const linhas = [];
  h.forEach(function (e, i) {
    if (!e || typeof e !== 'object') return;
    const partes = [];
    if (e.festa) {
      partes.push(t('adega.colecaoSaoMartinho').replace(/\s*[:：]?\s*\{n\}\s*$/, ''));
    } else {
      const g = garrafaPorDias(e.diasDescanso);
      if (g.dias === null) return; // garrafa antiga, sem dias válidos: ignorada
      partes.push(String(i + 1), t(g.nomeKey), t(g.dias === 1 ? 'adega.garrafaDiasUm' : 'adega.garrafaDias').replace('{n}', g.dias));
    }
    if (GARRAFAS_ESTACOES.indexOf(e.estacao) !== -1) partes.push(t('estacao.' + e.estacao));
    const ano = typeof e.data === 'string' ? e.data.match(/(\d{4})\s*$/) : null;
    if (ano) partes.push(ano[1]);
    linhas.push(partes);
  });
  return linhas.reverse();
}

function renderGarrafas() {
  const container = document.getElementById('garrafas-container');
  const linhas = garrafasLinhas();
  const corpo = linhas.length
    ? linhas.map(function (p) {
        return '<div class="encyclopedia-card garrafa-linha">' + p.map(cadernoEscapar).join(' · ') + '</div>';
      }).join('')
    : '<p class="info-text">' + t('adega.colecaoVazia') + '</p>';

  container.innerHTML =
    '<div class="topcard">' +
      '<p class="mini-title" data-i18n="garrafas.title"></p>' +
    '</div>' +
    '<div class="scroll-panel garrafas-lista">' + corpo + '</div>' +
    '<div class="action-panel">' +
      '<button type="button" class="btn-pill pill-main pill-grande" onclick="voltarEcraAnterior()" data-i18n="nav.voltar"></button>' +
    '</div>';

  atualizarDialogo('', '');
  applyTranslations();
}

function reservaHtml() {
  if (!caveReservaAberta()) return '';
  const dias = state.garrafas > 0 ? garrafaQueMaisDescansou() : null;
  let linha = '';
  if (state.garrafas <= 0) {
    linha = '<p class="phase-progress" data-i18n="perfil.semGarrafas"></p>';
  } else if (dias !== null) {
    linha = '<p class="phase-progress">' +
      t(dias === 1 ? 'adega.reservaMaisDescansouUm' : 'adega.reservaMaisDescansou').replace('{n}', dias) + '</p>';
  }
  // Com garrafas feitas, a foto é a da que mais descansou (mesma classe e tamanho
  // do barril; o ponto de foco desce para o rótulo, nas fotos de 512x512); sem
  // nenhuma, fica o barril de sempre.
  const g = dias !== null ? garrafaPorDias(dias) : null;
  const fotoHtml = g
    ? '<img class="reserva-foto" src="' + g.imagem + '" alt="' + garrafaLegenda(g) + '" style="object-position: center 69%">'
    : '<img class="reserva-foto" src="' + CAVE_RESERVA_FOTO + '" alt="">';
  return '<div class="reserva-bloco">' +
    fotoHtml +
    colecaoBotaoEntradaHtml() +
    // Tarefa do dia "Visitar a Reserva" (nível 5; ver js/reserva.js): o botão logo a seguir, o texto no fim
    (typeof reservaBotaoHtml === 'function' ? reservaBotaoHtml() : '') +
    '<p class="mini-bloco-titulo" data-i18n="adega.reservaTitulo"></p>' +
    '<p class="phase-desc" data-i18n="adega.reservaTexto1"></p>' +
    '<p class="phase-desc" data-i18n="adega.reservaTexto2"></p>' +
    linha +
    (typeof reservaDescHtml === 'function' ? reservaDescHtml() : '') +
  '</div>';
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
    // Ainda a descansar: o botão só abre a página do lote, por isso diz "Ver o lote (falta 14h)".
    const sufixoEngarrafar = pronto ? '' : (' (' + t('adega.loteFalta').replace('{tempo}', formatarDiasAdega(REGRAS_DESCANSO_CAVE.diasMinimos - dias)) + ')');

    if (adegaCartaoAberto) {
      corpoHtml = '<div class="cartao-corpo">' +
        '<p class="phase-desc" data-i18n="garrafa.passo3"></p>' +
        '<p class="phase-progress">' + t('adega.caveDescansado').replace('{tempo}', formatarDiasAdega(dias)) + '</p>' +
        '<p class="phase-progress">' + t('adega.caveReputacaoPrevista').replace('{valor}', repPrevista) + '</p>' +
        reservaHtml() +
      '</div>';
    }
    // Sempre tocável: abre a página da garrafa (a espera trata-se lá).
    botoesHtml += botaoAdega('engarrafar', pronto ? 'adega.btnEngarrafar' : 'adega.btnVerLote', false, sufixoEngarrafar, "goTo('engarrafar')");
  } else {
    if (adegaCartaoAberto) {
      corpoHtml = '<div class="cartao-corpo"><p class="phase-desc" data-i18n="garrafa.descricao"></p>' + reservaHtml() + '</div>';
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
  adegaGarrafaFeita = null;
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
    tocarSom('prensar');
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
    // Se esta garrafa fez chegar ao nível 6, ela já conta para a Coleção:
    // guarda-se o tamanho ANTES de entrar (ver carimbarGarrafasAoNivel6, js/niveis.js).
    if (nivelPelaReputacao(state.reputacao) >= 6) carimbarGarrafasAoNivel6(a.historico.length);
    state.ultimaGarrafaData = new Date().toLocaleDateString(localeAtual());
    a.historico.push({ data: state.ultimaGarrafaData, estacao: estacaoAtual(), diasDescanso: diasCompletos });
    a.lote = null;
    adegaGarrafaFeita = garrafaPorDias(diasCompletos);
    adegaMensagemAtual = t('garrafa.passo4') + ' ' + t('adega.resultadoEngarrafar').replace('{rep}', repGanha);
    adegaNovaEntrada = desbloquearEntradaEnciclopedia('curtimenta');
    adegaFotoAtual = ADEGA_FOTOS.engarrafar;
  } else {
    return;
  }

  if (typeof marcarObjetivoCumprido === 'function') marcarObjetivoCumprido('adega_' + acao);
  saveState(state);
  updateStatsDisplays();
  renderAdega();
}

// Opacidade (0 a 1) da foto da cor SEGUINTE por cima da atual: igual à
// fração da barra. Sem foto atual (antes de 1 dia) ou sem seguinte (a
// Cobre, última) não há fusão: 0. Função pura, recebe o resultado de
// estadoGarrafaLote().
function opacidadeFusaoGarrafa(est) {
  if (!est || !est.atual || !est.proxima) return 0;
  const f = Number(est.fracao);
  return Number.isFinite(f) ? Math.min(1, Math.max(0, f)) : 0;
}

// Onde fica o CORPO da garrafa em cada foto (caixa em % da imagem, medida
// nos píxeis das 4 fotos de 512x512: esq/dir = bordas do vidro, topo = a
// superfície do líquido, base = fundo da garrafa; rotulo = faixa vertical
// do rótulo, lida à vista numa grelha de 10%, igual nas 4 fotos). As 4 fotos
// têm a mesma composição (diferença de 1 px). Foto que não esteja aqui usa o
// valor seguro.
const GARRAFAS_CORPO = {
  'assets/garrafas/garrafa_1_jovem.jpg':   { esq: 40.0, dir: 57.6, topo: 39.8, base: 89.4, rotulo: [49.5, 81] },
  'assets/garrafas/garrafa_2_dourado.jpg': { esq: 40.0, dir: 57.2, topo: 39.8, base: 89.6, rotulo: [49.5, 81] },
  'assets/garrafas/garrafa_3_ambar.jpg':   { esq: 40.2, dir: 57.4, topo: 39.8, base: 89.3, rotulo: [49.5, 81] },
  'assets/garrafas/garrafa_4_cobre.jpg':   { esq: 40.2, dir: 57.4, topo: 39.8, base: 89.5, rotulo: [49.5, 81] }
};
const GARRAFA_CORPO_SEGURO = { esq: 41, dir: 57, topo: 41, base: 88, rotulo: [50, 81] };

// 7 bolhas pequenas: x = posição dentro do corpo (%), s = tamanho (% da
// largura do corpo), d = segundos por subida, a = atraso inicial (s, negativo
// no CSS para já irem a meio caminho). Só aspeto, fixas (sem aleatório).
const GARRAFA_BOLHAS = [
  { x: 16, s: 12, d: 9, a: 0 },   { x: 44, s: 14, d: 11, a: 2.5 }, { x: 76, s: 10, d: 8, a: 5 },
  { x: 30, s: 13, d: 12, a: 7 },  { x: 60, s: 12, d: 10, a: 1 },   { x: 86, s: 10, d: 9.5, a: 4 },
  { x: 50, s: 9, d: 13, a: 8.5 }
];

function bolhasGarrafaHtml(imagem) {
  const c = GARRAFAS_CORPO[imagem] || GARRAFA_CORPO_SEGURO;
  // Um pouco para dentro do vidro e abaixo da superfície do líquido. O
  // rótulo fica À FRENTE do líquido, por isso uma máscara esconde as bolhas
  // enquanto passam atrás dele (aparecem por cima e por baixo do rótulo).
  const topo = c.topo + 3;
  const altura = c.base - c.topo - 4.5;
  const a = Math.max(0, Math.min(100, (c.rotulo[0] - topo) / altura * 100)).toFixed(1);
  const b = Math.max(0, Math.min(100, (c.rotulo[1] - topo) / altura * 100)).toFixed(1);
  const mascara = 'linear-gradient(to bottom,#000 0,#000 ' + a + '%,transparent ' + a + '%,transparent ' + b + '%,#000 ' + b + '%,#000 100%)';
  const caixa = 'left:' + (c.esq + 2) + '%;top:' + topo + '%;width:' + (c.dir - c.esq - 4.5) + '%;height:' + altura + '%;' +
    '-webkit-mask-image:' + mascara + ';mask-image:' + mascara;
  return '<div class="garrafa-bolhas" style="' + caixa + '" aria-hidden="true">' +
    GARRAFA_BOLHAS.map(function (b) {
      return '<span class="bolha" style="left:' + b.x + '%;--s:' + b.s + ';animation-duration:' + b.d + 's;animation-delay:-' + b.a + 's"></span>';
    }).join('') +
  '</div>';
}

// ---------------------------------------------------------------------
// PÁGINA DA GARRAFA (ecrã "engarrafar", aberto pelo botão Engarrafar da
// Adega quando há lote). Mostra a garrafa com a cor do dia, a barra até
// à cor seguinte e a Reputação prevista; "Engarrafar agora" só está
// ativo a partir de 1 dia e chama a lógica que já existe
// (executarAcaoAdega('engarrafar')). O resultado aparece nesta página.
// Sem estado novo: tudo se calcula a partir de state.adega.lote.
// ---------------------------------------------------------------------
const ENGARRAFAR_RELOGIO_MS = 30 * 1000;

// Sons da página (ver js/som.js). O ambiente (borbulhar de fermentação)
// só começa quando já há foto (1 dia ou mais), entra e sai em fundo, e é
// bem mais baixo do que a chuva; o som de engarrafar (vinho a cair + tilintar)
// é pedido ao abrir a página, para não haver atraso no toque.
const GARRAFA_SOM_AMBIENTE = 'assets/sons/garrafa_ambiente.mp3';
const GARRAFA_SOM_ENGARRAFAR = 'assets/sons/garrafa_engarrafar.mp3';
const GARRAFA_AMBIENTE_VOLUME = 0.2;
const GARRAFA_AMBIENTE_FADE = { entrarS: 1.2, sairS: 0.8 };
const GARRAFA_ENGARRAFAR_VOLUME = 0.7;
let engarrafarTimerId = null;
let engarrafarResultado = null;   // { garrafa, rep } depois de engarrafar, senão null
let engarrafarDiasMostrados = -1; // diasCompletos desenhados, para saber quando redesenhar

// Pára sempre que se sai do ecrã (ver LIMPEZA_AO_SAIR_POR_ECRA, em
// js/main.js) e quando a app fica escondida (ver visibilitychange abaixo).
function pararRelogioEngarrafar() {
  if (engarrafarTimerId) {
    clearInterval(engarrafarTimerId);
    engarrafarTimerId = null;
  }
  marcarBolhasEngarrafar(false);
}

function iniciarRelogioEngarrafar() {
  pararRelogioEngarrafar();
  engarrafarTimerId = setInterval(atualizarEngarrafar, ENGARRAFAR_RELOGIO_MS);
  marcarBolhasEngarrafar(true);
}

// As bolhas só correm enquanto o relógio corre (página aberta e app
// visível): "viva" liga o animation-play-state no CSS.
function marcarBolhasEngarrafar(ligadas) {
  const painel = document.querySelector('#engarrafar-container .garrafa-pagina');
  if (painel) painel.classList.toggle('viva', !!ligadas);
}

// A foto e o resto têm de caber sem barra de deslizar: o CSS precisa da
// altura do painel de botões (que varia) para saber a altura que sobra.
function ajustarAlturaEngarrafar() {
  const painel = document.querySelector('#engarrafar-container .garrafa-pagina');
  const acao = document.querySelector('#engarrafar-container .action-panel');
  if (painel && acao) painel.style.setProperty('--engarrafar-acao', Math.ceil(acao.getBoundingClientRect().height) + 'px');
}
window.addEventListener('resize', function () { if (engarrafarEcraAtivo()) ajustarAlturaEngarrafar(); });

function engarrafarEcraAtivo() {
  const ecra = document.getElementById('screen-engarrafar');
  return !!ecra && ecra.classList.contains('active');
}

function enterEngarrafar() {
  engarrafarResultado = null;
  if (!state.adega.lote) {
    // Sem lote não há nada a mostrar aqui.
    goTo('garrafa', { semHistorico: true });
    return;
  }
  renderEngarrafar();
  iniciarRelogioEngarrafar();
  iniciarAmbienteEngarrafar();
  // Com "Som" ligado e o áudio já desbloqueado, pede já o som de engarrafar.
  if (typeof somPodeTocar === 'function' && somPodeTocar()) somCarregarFicheiro(GARRAFA_SOM_ENGARRAFAR);
}

// Ambiente só com foto (1 dia ou mais). Idempotente: chamar outra vez (ex.:
// ao mudar de dia com a página aberta) não o reinicia. Pára em goTo() ao
// sair, e em engarrafarAgora().
function iniciarAmbienteEngarrafar() {
  if (typeof iniciarSomAmbiente !== 'function') return;
  if (!estadoGarrafaLote(diasDescansadosNaCave()).atual) return;
  iniciarSomAmbiente(GARRAFA_SOM_AMBIENTE, GARRAFA_AMBIENTE_VOLUME, GARRAFA_AMBIENTE_FADE);
}

function textoProximaCorGarrafa(est) {
  if (!est.proxima) return t('adega.paginaUltimaCor');
  return t('adega.paginaProxima')
    .replace('{nome}', t(est.proxima.nomeKey))
    .replace('{tempo}', formatarFaltaGarrafa(est.msAteProxima));
}

function sufixoFaltaEngarrafar(dias) {
  const ms = Math.round((REGRAS_DESCANSO_CAVE.diasMinimos - dias) * DIA_MS);
  return ms > 0 ? ' ' + t('adega.paginaFaltaSufixo').replace('{tempo}', formatarFaltaGarrafa(ms)) : '';
}

function renderEngarrafar() {
  const container = document.getElementById('engarrafar-container');
  if (!container) return;
  let corpoHtml = '';
  let botoesHtml = '';
  let fundo = ADEGA_FOTOS.cave;

  if (engarrafarResultado) {
    fundo = ADEGA_FOTOS.engarrafar;
    corpoHtml =
      garrafaGrandeHtml(engarrafarResultado.garrafa, null) +
      '<p class="phase-desc">' + t('garrafa.passo4') + '</p>' +
      '<p class="phase-progress">' + t('adega.resultadoEngarrafar').replace('{rep}', engarrafarResultado.rep) + '</p>';
    botoesHtml = '<button type="button" class="btn-pill pill-main pill-grande" onclick="voltarEcraAnterior()" data-i18n="nav.voltar"></button>';
  } else {
    const dias = diasDescansadosNaCave();
    const est = estadoGarrafaLote(dias);
    const pronto = est.diasCompletos >= REGRAS_DESCANSO_CAVE.diasMinimos;
    engarrafarDiasMostrados = est.diasCompletos;
    corpoHtml =
      (est.atual ? garrafaGrandeHtml(est.atual, est) : '<p class="phase-desc" data-i18n="adega.paginaAindaDescansa"></p>') +
      '<div class="nivel-barra"><div class="nivel-barra-cheio" id="engarrafar-barra" style="width:' + Math.round(est.fracao * 100) + '%"></div></div>' +
      '<p class="phase-progress" id="engarrafar-proxima">' + textoProximaCorGarrafa(est) + '</p>' +
      (pronto ? '<p class="phase-progress">' + t('adega.caveReputacaoPrevista').replace('{valor}', reputacaoDaCave(est.diasCompletos)) + '</p>' : '');
    botoesHtml =
      '<button type="button" class="btn-pill pill-main pill-grande" id="engarrafar-agora" data-sem-vibracao ' + (pronto ? '' : 'disabled ') + 'onclick="engarrafarAgora()">' +
        '<span data-i18n="adega.paginaBtnAgora"></span><span class="cooldown-suffix" id="engarrafar-falta">' + (pronto ? '' : sufixoFaltaEngarrafar(dias)) + '</span>' +
      '</button>' +
      '<button type="button" class="btn-pill" onclick="voltarEcraAnterior()" data-i18n="nav.voltar"></button>';
  }

  container.innerHTML =
    '<div class="topcard"><p class="mini-title" data-i18n="adega.paginaTitulo"></p></div>' +
    '<div class="scroll-panel garrafa-pagina' + (engarrafarResultado ? ' resultado' : '') + (engarrafarTimerId ? ' viva' : '') + '">' + corpoHtml + '</div>' +
    '<div class="action-panel">' + botoesHtml + '</div>';

  definirFundo('foto', fundo, ADEGA_FOTO_POS[fundo]);
  applyTranslations();
  ajustarAlturaEngarrafar();
  reposicionarFlutuantes();
}

// est (resultado de estadoGarrafaLote) só vem na página do lote: com ele a
// foto da cor seguinte (se existir) funde-se por cima e há bolhas. A foto
// seguinte só entra na página aqui, quando existe, por isso nada é
// pré-carregado no arranque. Sem est (resultado): só a foto e a legenda.
function garrafaGrandeHtml(g, est) {
  const seguinte = est && est.proxima
    ? '<img class="garrafa-grande-foto garrafa-fusao" id="engarrafar-fusao" src="' + est.proxima.imagem + '" alt="" style="opacity:' + opacidadeFusaoGarrafa(est) + '">'
    : '';
  return '<div class="garrafa-grande">' +
    '<img class="garrafa-grande-foto" src="' + g.imagem + '" alt="">' +
    seguinte +
    (est ? bolhasGarrafaHtml(g.imagem) : '') +
    '<p class="garrafa-grande-legenda">' + garrafaLegenda(g) + '</p>' +
  '</div>';
}

// Chamado pelo relógio: só redesenha tudo quando muda o dia completo
// (nova cor ou passou de 1 dia); entre dois dias só mexe na barra e nos tempos.
function atualizarEngarrafar() {
  if (!engarrafarEcraAtivo() || engarrafarResultado) { pararRelogioEngarrafar(); return; }
  if (!state.adega.lote) { pararRelogioEngarrafar(); renderEngarrafar(); return; }
  const dias = diasDescansadosNaCave();
  const est = estadoGarrafaLote(dias);
  if (est.diasCompletos !== engarrafarDiasMostrados) { renderEngarrafar(); iniciarAmbienteEngarrafar(); return; }
  const barra = document.getElementById('engarrafar-barra');
  if (barra) barra.style.width = Math.round(est.fracao * 100) + '%';
  const fusao = document.getElementById('engarrafar-fusao');
  if (fusao) fusao.style.opacity = opacidadeFusaoGarrafa(est);
  const prox = document.getElementById('engarrafar-proxima');
  if (prox) prox.textContent = textoProximaCorGarrafa(est);
  const falta = document.getElementById('engarrafar-falta');
  if (falta && est.diasCompletos < REGRAS_DESCANSO_CAVE.diasMinimos) falta.textContent = sufixoFaltaEngarrafar(dias);
}

function engarrafarAgora() {
  const a = state.adega;
  if (!a.lote || Math.floor(diasDescansadosNaCave()) < REGRAS_DESCANSO_CAVE.diasMinimos) {
    renderEngarrafar(); // ainda não está pronto: não faz nada
    return;
  }
  const repAntes = state.reputacao;
  executarAcaoAdega('engarrafar'); // a lógica de sempre (garrafa, Reputação, histórico, objetivo)
  if (a.lote || !adegaGarrafaFeita) { renderEngarrafar(); return; }
  engarrafarResultado = { garrafa: adegaGarrafaFeita, rep: state.reputacao - repAntes };
  pararRelogioEngarrafar();
  pararSomAmbiente();                                        // o ambiente sai em fundo
  tocarSomFicheiro(GARRAFA_SOM_ENGARRAFAR, GARRAFA_ENGARRAFAR_VOLUME);
  vibrar('sucesso');                                         // (o botão não faz a vibração leve: data-sem-vibracao)
  renderEngarrafar();
  // O resultado já está escrito nesta página: esconde o balão (o cartão de
  // "nova entrada" da Enciclopédia, se houver, mantém-se).
  atualizarDialogo('', '');
  reposicionarFlutuantes();
}

// App escondida (ex.: o jogador muda de aplicação): o relógio pára; ao
// voltar, a página redesenha-se logo (os dias podem ter passado) e o relógio recomeça.
document.addEventListener('visibilitychange', function () {
  if (!engarrafarEcraAtivo() || engarrafarResultado) return;
  if (document.hidden) { pararRelogioEngarrafar(); return; }
  enterEngarrafar();
});
