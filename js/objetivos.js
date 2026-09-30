// ---------------------------------------------------------------------
// "HOJE NA QUINTA" — 3 objetivos diários, renovados à meia-noite de
// Lisboa (ver diaLisboaDeHoje() em js/tempo.js, independente do fuso
// horário do telemóvel do jogador).
//
// Cada objetivo cumprido dá +2 Reputação. Cumprir os 3 no mesmo dia dá
// +5 Reputação extra e +1 "selo do dia" — os selos nunca se perdem,
// mesmo que um dia fique incompleto.
//
// Nunca se escolhe um objetivo impossível hoje: cada candidato só entra
// no sorteio se a sua condição (elegivel()) for verdadeira NESTE
// MOMENTO. Os "cooldowns" próprios de cada ação (ex: Regar 3h) não
// entram nessa condição — como o mais longo do jogo é 4h, uma ação
// elegível pela fase/recursos fica sempre disponível ainda dentro do
// mesmo dia.
// ---------------------------------------------------------------------

// Recompensas fixas — usadas tanto para somar a Reputação como para
// mostrar "+2"/o texto do bónus no cartão (ver atualizarCartaoObjetivosQuinta()).
const OBJETIVO_RECOMPENSA_PONTOS = 2;
const OBJETIVO_BONUS_TRIO_PONTOS = 5;

// --- GRUPO A — Vinha ou Adega (Objetivo 1) -----------------------------
const OBJETIVOS_POOL_A = [
  { id: 'vinha_cavar', elegivel: function () { return state.vinha.fase === 'preparar'; } },
  { id: 'vinha_plantar', elegivel: function () { return state.vinha.fase === 'preparada'; } },
  { id: 'vinha_ervas', elegivel: function () { return state.vinha.fase === 'preparada' || state.vinha.fase === 'crescendo'; } },
  { id: 'vinha_regar', elegivel: function () { return state.vinha.fase === 'crescendo'; } },
  { id: 'vinha_adubar', elegivel: function () { return state.vinha.fase === 'crescendo' && state.vinha.adubo >= 1; } },
  { id: 'vinha_compostagem', elegivel: function () { return state.vinha.residuos >= RESIDUOS_POR_COMPOSTAGEM; } },
  { id: 'vinha_colher', elegivel: function () { return state.vinha.fase === 'pronta'; } },
  { id: 'adega_prensar', elegivel: function () { return ecraDesbloqueado('garrafa') && state.uvas >= ADEGA_CUSTO_UVAS_PRENSAR; } },
  { id: 'adega_alambique', elegivel: function () { return ecraDesbloqueado('garrafa') && state.adega.bagaco >= ADEGA_CUSTO_BAGACO_ALAMBIQUE; } },
  {
    id: 'adega_fortificar',
    elegivel: function () {
      return ecraDesbloqueado('garrafa') && !state.adega.lote && state.gotas >= ADEGA_CUSTO_GOTAS_FORTIFICAR && state.adega.aguardente >= ADEGA_CUSTO_AGUARDENTE_FORTIFICAR;
    }
  },
  {
    id: 'adega_engarrafar',
    elegivel: function () {
      return ecraDesbloqueado('garrafa') && !!state.adega.lote && Math.floor(diasDescansadosNaCave()) >= REGRAS_DESCANSO_CAVE.diasMinimos;
    }
  }
];

// --- GRUPO B — Ação (Objetivo 2) ---------------------------------------
// (ecraDesbloqueado() ver js/niveis.js — jogadores antigos ignoram-no
// sempre, ver state.acesso.jogadorAntigo em js/state.js)
const OBJETIVOS_POOL_B = [
  { id: 'proteger_vencer', elegivel: function () { return ecraDesbloqueado('proteger') && vitoriasProtegerComPremioRestantesHoje() > 0; } },
  { id: 'explorar_descobrir', elegivel: function () { return ecraDesbloqueado('explorar') && entradasBloqueadas().length > 0; } }
];

// --- GRUPO C — "Do dia": festa > tempo real > bónus de estação --------
// Devolve uma lista de ids candidatos, já por ordem de prioridade (o
// bónus de estação reaproveita os ids do Grupo A, em vez de ter texto
// próprio — se essa ação já tiver sido escolhida para outro objetivo do
// dia, gerarObjetivosDoDia() salta para o candidato seguinte).
function candidatosGrupoC() {
  const lista = [];

  const festa = festaAtual();
  if (festa && ecraDesbloqueado('festa') && (
    !festaJaFezTarefaHoje(festa.id, 'castanhas') ||
    !festaJaFezTarefaHoje(festa.id, 'jeropiga') ||
    !festaJaFezTarefaHoje(festa.id, 'prova')
  )) {
    lista.push('festa_tarefa');
  }

  const tempo = tempoAtual();
  if (tempo.disponivel) {
    if (tempo.ceu === 'chuva' && state.vinha.fase === 'crescendo' && !jaFezTarefaTempoHoje('chuvaRegouDia')) {
      lista.push('tempo_chuva');
    }
    if (tempo.ventoForte && !jaFezTarefaTempoHoje('estacasDia')) {
      lista.push('tempo_vento');
    }
    if (tempo.frioForte && !jaFezTarefaTempoHoje('frioDia')) {
      lista.push('tempo_frio');
    }
  }

  const acoesComBonus = VINHA_BONUS_ESTACAO[estacaoAtual()] || [];
  for (let i = 0; i < acoesComBonus.length; i++) {
    const idAcao = 'vinha_' + acoesComBonus[i];
    const candidato = OBJETIVOS_POOL_A.filter(function (o) { return o.id === idAcao; })[0];
    if (candidato && candidato.elegivel()) lista.push(idAcao);
  }

  return lista;
}

// --- ESCOLHA DOS 3 OBJETIVOS DO DIA -------------------------------------

// Escolhe até 3 objetivos SEM REPETIR nenhum id — um jogador ainda com
// pouca coisa aberta (ver Áreas por Nível em js/niveis.js) pode ter uma
// bolsa elegível muito pequena (ex.: Nível 1 só tem a Vinha); nesse caso
// fica só com 1 ou 2 objetivos nesse dia, em vez de mostrar a mesma
// ação repetida 2 ou 3 vezes no cartão "Hoje na Quinta".
function gerarObjetivosDoDia() {
  const escolhidos = [];
  function adicionar(id) {
    if (id && escolhidos.indexOf(id) === -1) escolhidos.push(id);
  }

  const elegiveisA = OBJETIVOS_POOL_A.filter(function (o) { return o.elegivel(); }).map(function (o) { return o.id; });
  const elegiveisB = OBJETIVOS_POOL_B.filter(function (o) { return o.elegivel(); }).map(function (o) { return o.id; });

  // Objetivo 1 — Vinha ou Adega.
  if (elegiveisA.length > 0) adicionar(elegiveisA[randInt(0, elegiveisA.length - 1)]);

  // Objetivo 2 — Ação (Proteger ou Explorar), sem repetir o Objetivo 1;
  // sem nenhuma disponível, tenta outra da Vinha/Adega ainda não usada.
  const candidatosB = elegiveisB.filter(function (id) { return escolhidos.indexOf(id) === -1; });
  if (candidatosB.length > 0) {
    adicionar(candidatosB[randInt(0, candidatosB.length - 1)]);
  } else {
    const alt = elegiveisA.filter(function (id) { return escolhidos.indexOf(id) === -1; });
    if (alt.length > 0) adicionar(alt[randInt(0, alt.length - 1)]);
  }

  // Objetivo 3 — "Do dia" (festa > tempo real > bónus de estação), sem
  // repetir os já escolhidos; sem nenhum candidato, tenta qualquer outro
  // dos Grupos A/B ainda não usado.
  const candidatosC = candidatosGrupoC().filter(function (id) { return escolhidos.indexOf(id) === -1; });
  if (candidatosC.length > 0) {
    adicionar(candidatosC[0]);
  } else {
    const alt = elegiveisA.concat(elegiveisB).filter(function (id) { return escolhidos.indexOf(id) === -1; });
    if (alt.length > 0) adicionar(alt[randInt(0, alt.length - 1)]);
  }

  // Fallback de segurança: nunca fica sem nenhum objetivo (a Vinha nunca
  // está trancada, e "Compostagem" está sempre disponível como ação).
  if (escolhidos.length === 0) escolhidos.push('vinha_compostagem');

  state.objetivos.dia = diaLisboaDeHoje();
  state.objetivos.lista = escolhidos.map(function (id) { return { id: id, cumprido: false }; });
  state.objetivos.bonusDiaDado = false;
  // Jogador ainda sem qualquer gravação nem progresso (ex.: logo depois de
  // "Apagar o meu progresso"): os objetivos ficam só em memória e gravam-se
  // com a 1.ª ação real, para não criar estado novo na nuvem só por abrir.
  if (state.ultimaGravacaoEm || temProgressoExistente()) saveState(state);
}

// Chamada logo ao abrir o jogo (ver fundo deste ficheiro) E sempre que
// se entra na Quinta ou se marca um objetivo — assim um dia novo é
// detetado mesmo que o jogo fique aberto a passar da meia-noite.
function garantirObjetivosDoDia() {
  if (state.objetivos.dia !== diaLisboaDeHoje()) {
    gerarObjetivosDoDia();
  }
}

// Chamada pelas outras partes do jogo (Vinha, Adega, Proteger, Explorar,
// Festas) sempre que o jogador faz algo que pode contar para um
// objetivo de hoje. Não faz nada se esse id não estiver na lista de
// hoje, ou já estiver cumprido.
function marcarObjetivoCumprido(id) {
  garantirObjetivosDoDia();
  const lista = state.objetivos.lista;
  let mudouAlgo = false;

  for (let i = 0; i < lista.length; i++) {
    if (lista[i].id === id && !lista[i].cumprido) {
      lista[i].cumprido = true;
      state.reputacao += OBJETIVO_RECOMPENSA_PONTOS;
      mudouAlgo = true;
    }
  }
  if (!mudouAlgo) return;

  const todosCumpridos = lista.every(function (o) { return o.cumprido; });
  if (todosCumpridos && !state.objetivos.bonusDiaDado) {
    state.objetivos.bonusDiaDado = true;
    state.reputacao += OBJETIVO_BONUS_TRIO_PONTOS;
    state.objetivos.selosTotal += 1;
  }

  vibrar('sucesso');
  tocarSom('objetivoCumprido');
  saveState(state);
  updateStatsDisplays();
  atualizarCartaoObjetivosQuinta();
  if (typeof atualizarCapituloQuinta === 'function') atualizarCapituloQuinta();
  if (typeof atualizarResumoQuinta === 'function') atualizarResumoQuinta();
}

// Cartão "Hoje na Quinta", dentro do topcard da Quinta (ver
// #objetivos-container em index.html).
function atualizarCartaoObjetivosQuinta() {
  garantirObjetivosDoDia();
  const container = document.getElementById('objetivos-container');
  if (!container) return;

  const linhasHtml = state.objetivos.lista.map(function (o) {
    return '<p class="objetivo-linha' + (o.cumprido ? ' feito' : '') + '">' +
      (o.cumprido ? '✓ ' : '· ') + t('objetivo.' + o.id) +
      ' <span class="objetivo-premio">(+' + OBJETIVO_RECOMPENSA_PONTOS + ')</span>' +
    '</p>';
  }).join('');

  container.innerHTML =
    '<div class="mini-bloco">' +
      '<p class="mini-bloco-titulo">' + t('objetivos.titulo') + '</p>' +
      linhasHtml +
      '<p class="mini-sub objetivo-bonus-linha">' +
        t('objetivos.bonusLinha').replace('{bonus}', OBJETIVO_BONUS_TRIO_PONTOS) +
      '</p>' +
      '<p class="mini-sub">' + t('objetivos.selosLabel') + ' ' + state.objetivos.selosTotal + '</p>' +
    '</div>';
}

// Linha do cartão do topo da Quinta ENCOLHIDO, ex: "Nível 2 · Hoje 1/3"
// (ver #quinta-resumo-linha em index.html e alternarCartaoQuinta() em
// js/main.js) — combina o nível (js/niveis.js) com os objetivos.
function atualizarResumoQuinta() {
  const el = document.getElementById('quinta-resumo-linha');
  if (!el) return;
  garantirObjetivosDoDia();
  const nivelAtual = nivelPelaReputacao(state.reputacao);
  const feitos = state.objetivos.lista.filter(function (o) { return o.cumprido; }).length;
  el.textContent = t('nivel.label') + ' ' + nivelAtual + ' · ' +
    t('objetivos.resumoLabel') + ' ' + feitos + '/' + state.objetivos.lista.length;
}

// Gera os objetivos do dia logo ao abrir o jogo (não só ao entrar na
// Quinta), para uma ação feita antes de lá passar também contar.
garantirObjetivosDoDia();
