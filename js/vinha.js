// ---------------------------------------------------------------------
// A VINHA — ciclo de trabalho agrícola
//
// Fases: preparar -> preparada -> crescendo -> pronta -> (Colher) -> preparar
// Cada ação tem um pequeno cooldown próprio, e "Compostagem" está
// sempre disponível (transforma Resíduos Orgânicos em Adubo Orgânico).
// ---------------------------------------------------------------------

const PONTOS_CUIDADO_NECESSARIOS = 5;
const RESIDUOS_POR_COMPOSTAGEM = 3;

const COOLDOWN_MS = {
  cavar: 0,
  plantar: 0,
  colher: 0,
  ervas: 2 * 60 * 60 * 1000,      // 2h
  regar: 3 * 60 * 60 * 1000,      // 3h
  adubar: 4 * 60 * 60 * 1000,     // 4h
  compostagem: 3 * 60 * 60 * 1000 // 3h
};

const VINHA_FASES = {
  preparar: { nomeKey: 'vinha.fase.preparar.nome', descKey: 'vinha.fase.preparar.desc' },
  preparada: { nomeKey: 'vinha.fase.preparada.nome', descKey: 'vinha.fase.preparada.desc' },
  crescendo: { nomeKey: 'vinha.fase.crescendo.nome', descKey: 'vinha.fase.crescendo.desc' },
  pronta: { nomeKey: 'vinha.fase.pronta.nome', descKey: 'vinha.fase.pronta.desc' }
};

// Foto de fundo depois de cada ação.
const VINHA_FOTOS = {
  cavar: 'assets/vinha/cavar_2.jpg',
  plantar: 'assets/vinha/plantar.jpg',
  ervas: 'assets/vinha/eliminarervasdaninhas_2.jpg',
  regar: 'assets/vinha/regar.jpg',
  adubar: 'assets/vinha/adubar_2.jpg',
  compostagem: 'assets/vinha/compostagem_1.jpg',
  colher: 'assets/vinha/colher.jpg',
  podar: 'assets/ecras/inverno_poda.jpg',
  repararEstacas: TEMPO_CONFIG.imagens.repararEstacas,
  protegerFrio: TEMPO_CONFIG.imagens.protegerFrio
};

// Ponto de foco (background-position) para as fotos onde o corte
// automático ao centro tapava a cabeça do YoshiCat — só aspeto, a
// foto em si não muda. As que não estão aqui continuam ao centro.
const VINHA_FOTO_POS = {};
VINHA_FOTO_POS[VINHA_FOTOS.plantar] = 'center 15%';
VINHA_FOTO_POS[VINHA_FOTOS.regar] = 'center 15%';
VINHA_FOTO_POS[TEMPO_CONFIG.imagens.calor] = 'center 10%';

// Fundo quando ainda não se fez nenhuma ação: depende da fase da vinha.
const VINHA_FUNDO_POR_FASE = {
  preparar: 'cavar',
  preparada: 'plantar',
  crescendo: 'regar',
  pronta: 'colher'
};

// -----------------------------------------------------------------
// ESTAÇÕES DO ANO (ver js/estacoes.js) — vantagens moderadas, nunca
// bloqueiam nada. Cada estação dá um empurrão de cerca de +50% à
// ação mais própria dela.
// -----------------------------------------------------------------
const VINHA_MULTIPLICADOR_BONUS = 1.5;

const VINHA_BONUS_ESTACAO = {
  primavera: ['plantar', 'ervas'],
  verao: ['regar'],
  outono: ['colher'],
  inverno: ['compostagem']
};

function acaoTemBonusEstacao(actionKey) {
  const acoes = VINHA_BONUS_ESTACAO[estacaoAtual()];
  return !!(acoes && acoes.indexOf(actionKey) !== -1);
}

// Etiqueta simples junto ao botão, ex: "(+50% uvas e reputação)"
const VINHA_BONUS_LABEL_KEY = {
  plantar: 'vinha.bonusCuidado',
  ervas: 'vinha.bonusCuidado',
  regar: 'vinha.bonusCuidado',
  compostagem: 'vinha.bonusAdubo',
  colher: 'vinha.bonusColheita'
};

// A "dica" (frase de sabor) de cada ação com bónus ganha uma versão
// própria da estação; fora dessa estação mantém a frase de sempre
// (ver vinha.dica.* em js/i18n.js).
const VINHA_DICA_SAZONAL_KEY = {
  primavera: { plantar: 'vinha.dica.plantar.primavera', ervas: 'vinha.dica.ervas.primavera' },
  verao: { regar: 'vinha.dica.regar.verao' },
  outono: { colher: 'vinha.dica.colher.outono' },
  inverno: { compostagem: 'vinha.dica.compostagem.inverno' }
};

function dicaVinha(actionKey) {
  const porEstacao = VINHA_DICA_SAZONAL_KEY[estacaoAtual()];
  const key = porEstacao && porEstacao[actionKey];
  return t(key || ('vinha.dica.' + actionKey));
}

// ===================================================================
// REGRAS DA PODA — tarefa extra, só no inverno, que nunca bloqueia as
// outras tarefas da Vinha. Tudo o que a rege está só aqui: para mudar
// a estação, a percentagem do bónus ou a regra de "uma vez por
// inverno", muda só este bloco.
// ===================================================================
const REGRAS_PODA = {
  estacao: 'inverno',
  bonusVindima: 0.25 // +25% de uvas na PRÓXIMA vindima (Colher) depois de podar
};

// Identifica o inverno atual de forma que dezembro de um ano e
// janeiro/fevereiro do ano seguinte contem como o MESMO inverno
// (ex: "2026-2027"). Usa sempre o ano real do telemóvel, mesmo quando
// a estação é forçada por ?estacao= para testar.
function idInvernoAtual() {
  const mes = mesAtual();
  const ano = new Date().getFullYear();
  const anoInicio = mes === 11 ? ano : ano - 1;
  return anoInicio + '-' + (anoInicio + 1);
}

function jaPodouEsteInverno() {
  return state.vinha.invernoPodado === idInvernoAtual();
}

// -----------------------------------------------------------------
// TEMPO REAL DE SETÚBAL (ver js/tempo.js) — vantagens e tarefas extra
// suaves, nunca bloqueiam nada nem tiram nada a quem não as fizer.
// Os números (limites, percentagens, imagens) estão todos em
// TEMPO_CONFIG, em js/tempo.js.
// -----------------------------------------------------------------

function jaFezTarefaTempoHoje(campo) {
  return state.tempo[campo] === diaLocalDeHoje();
}

function registarTarefaTempoHoje(campo) {
  state.tempo[campo] = diaLocalDeHoje();
}

// Fundo da Vinha ligado ao tempo, quando ainda não há foto de nenhuma
// ação (ver renderVinha). Ordem de prioridade: as condições mais raras
// primeiro, para não ficarem escondidas por um "sol" comum.
function fundoTempoVinha() {
  const tempo = tempoAtual();
  if (!tempo.disponivel) return null;
  if (tempo.ceu === 'trovoada') return TEMPO_CONFIG.imagens.trovoada;
  if (tempo.ceu === 'nevoeiro') return TEMPO_CONFIG.imagens.nevoeiro;
  if (tempo.ventoForte) return TEMPO_CONFIG.imagens.vento;
  if (tempo.calorForte) return TEMPO_CONFIG.imagens.calor;
  if (tempo.ceu === 'chuva') return TEMPO_CONFIG.imagens.chuva;
  return null;
}

// Chuva: uma vez por dia, com chuva real em Setúbal, a vinha ganha
// cuidado sozinha (sem gastar o Regar), só enquanto está a crescer.
function aplicarChuvaAutomatica() {
  const tempo = tempoAtual();
  const v = state.vinha;
  if (tempo.ceu !== 'chuva' || v.fase !== 'crescendo' || jaFezTarefaTempoHoje('chuvaRegouDia')) return;

  registarTarefaTempoHoje('chuvaRegouDia');
  v.pontosCuidado += 1;
  if (v.pontosCuidado >= PONTOS_CUIDADO_NECESSARIOS) v.fase = 'pronta';
  vinhaMensagemAtual = t('tempo.msgChuvaRegou');
  vinhaFotoAtual = TEMPO_CONFIG.imagens.chuva;
  if (typeof marcarObjetivoCumprido === 'function') marcarObjetivoCumprido('tempo_chuva');
  saveState(state);
  updateStatsDisplays();
}

let vinhaMensagemAtual = '';
let vinhaNovaEntrada = null;
let vinhaFotoAtual = null;

// Estado do cartão pequeno do topo (aberto/fechado) — só aspeto, ver
// renderVinha() e alternarCartaoVinha() mais abaixo.
let vinhaCartaoAberto = false;

function alternarCartaoVinha() {
  vinhaCartaoAberto = !vinhaCartaoAberto;
  renderVinha();
}

// Pré-carrega só a foto de uma ação que está visível, para não descarregar
// as 7 fotos de uma vez no telemóvel.
function preCarregarFotoVinha(actionKey) {
  if (VINHA_FOTOS[actionKey]) new Image().src = VINHA_FOTOS[actionKey];
}

function tempoRestanteVinha(actionKey) {
  const ultima = state.vinha.cooldowns[actionKey];
  if (!ultima) return 0;
  const cd = COOLDOWN_MS[actionKey] || 0;
  return Math.max(0, cd - (Date.now() - ultima));
}

function formatarTempoVinha(ms) {
  const totalMin = Math.ceil(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? (h + 'h ' + m + 'm') : (m + 'm');
}

function registarCooldownVinha(actionKey) {
  state.vinha.cooldowns[actionKey] = Date.now();
}

// Relógio dos botões da Vinha: enquanto o jogador está neste ecrã,
// volta a desenhar a fila de botões a cada minuto, para os tempos de
// espera ("3h 0m"...) descerem sozinhos e o botão ficar disponível
// assim que chega a zero, sem ser preciso sair e voltar a entrar.
// Pára sempre que se sai do ecrã (ver LIMPEZA_AO_SAIR_POR_ECRA, em
// js/main.js) para nunca ficar a correr escondido.
let vinhaTimerId = null;

function pararRelogioVinha() {
  if (vinhaTimerId) {
    clearInterval(vinhaTimerId);
    vinhaTimerId = null;
  }
}

function iniciarRelogioVinha() {
  pararRelogioVinha();
  vinhaTimerId = setInterval(renderVinha, 60 * 1000);
}

function enterVinha() {
  vinhaMensagemAtual = '';
  vinhaNovaEntrada = null;
  vinhaFotoAtual = null;
  vinhaCartaoAberto = false;
  aplicarChuvaAutomatica();
  renderVinha();
  iniciarRelogioVinha();
}

// sufixoBloqueado: texto a mostrar quando bloqueado por bloqueadoExtra
// (sem cooldown), ex: "(já feita)" na Poda depois de usada.
// Aspeto: cada trabalho é agora um botão-pastilha (ver .btn-pill no
// index.html); a classe pill-main/pill-off é decidida à parte, depois
// de todos os botões estarem no DOM (ver marcarPastilhaPrincipal()).
const RELOGIO_PASTILHA_SVG = '<svg class="pill-clock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="11" height="11"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg>';

function botaoVinha(actionKey, i18nKey, bloqueadoExtra, sufixoBloqueado) {
  const restante = tempoRestanteVinha(actionKey);
  const bloqueado = restante > 0 || !!bloqueadoExtra;
  const sufixo = restante > 0 ? (RELOGIO_PASTILHA_SVG + ' (' + formatarTempoVinha(restante) + ')') :
    (bloqueadoExtra && sufixoBloqueado ? (' (' + sufixoBloqueado + ')') : '');
  const temBonusTempo = actionKey === 'regar' && tempoAtual().calorForte;
  const bonusHtml = (acaoTemBonusEstacao(actionKey) || temBonusTempo)
    ? ' <span class="bonus-suffix">' + t(VINHA_BONUS_LABEL_KEY[actionKey]) + '</span>'
    : '';
  if (!bloqueado) preCarregarFotoVinha(actionKey);
  return '<button class="btn-pill" ' + (bloqueado ? 'disabled' : '') +
    ' onclick="executarAcaoVinha(\'' + actionKey + '\')">' +
    '<span data-i18n="' + i18nKey + '"></span><span class="cooldown-suffix">' + sufixo + '</span>' + bonusHtml +
    '</button>';
}

// O primeiro botão disponível (não bloqueado) da fila fica em destaque
// a dourado (pill-main); os restantes, disponíveis ou não, ficam escuros.
function marcarPastilhaPrincipal(container) {
  const pastilhas = container.querySelectorAll('.pill-scroll .btn-pill');
  let jaMarcou = false;
  pastilhas.forEach(function (btn) {
    if (!btn.disabled && !jaMarcou) {
      btn.classList.add('pill-main');
      jaMarcou = true;
    } else if (btn.disabled) {
      btn.classList.add('pill-off');
    }
  });
}

function renderVinha() {
  const container = document.getElementById('vinha-container');
  const v = state.vinha;
  const faseInfo = VINHA_FASES[v.fase];
  let botoesHtml = '';

  if (v.fase === 'preparar') {
    botoesHtml += botaoVinha('cavar', 'vinha.pillCavar');
  } else if (v.fase === 'preparada') {
    botoesHtml += botaoVinha('ervas', 'vinha.pillErvas');
    botoesHtml += botaoVinha('plantar', 'vinha.pillPlantar');
  } else if (v.fase === 'crescendo') {
    botoesHtml += botaoVinha('regar', 'vinha.pillRegar');
    botoesHtml += botaoVinha('adubar', 'vinha.pillAdubar', v.adubo < 1);
    botoesHtml += botaoVinha('ervas', 'vinha.pillErvas');
  } else if (v.fase === 'pronta') {
    botoesHtml += botaoVinha('colher', 'vinha.pillColher');
  }

  // Compostagem: sempre disponível, independente da fase da vinha.
  botoesHtml += botaoVinha('compostagem', 'vinha.pillCompostar', v.residuos < RESIDUOS_POR_COMPOSTAGEM);

  // Poda: tarefa extra, só aparece no inverno, uma vez por inverno (ver
  // REGRAS_PODA). Fica ativa mesmo antes de a vinha estar plantada —
  // se ainda não estiver, executarAcaoVinha mostra a mensagem a explicar.
  if (estacaoAtual() === REGRAS_PODA.estacao) {
    botoesHtml += botaoVinha('podar', 'vinha.pillPodar', jaPodouEsteInverno(), t('vinha.podaJaFeita'));
  }

  // Tarefas extra do tempo real de Setúbal: só aparecem quando o tempo
  // está mesmo assim (vento forte / frio forte), uma vez por dia.
  const tempo = tempoAtual();
  if (tempo.ventoForte) {
    botoesHtml += botaoVinha('repararEstacas', 'vinha.pillRepararEstacas', jaFezTarefaTempoHoje('estacasDia'), t('vinha.tarefaFeitaHoje'));
  }
  if (tempo.frioForte) {
    botoesHtml += botaoVinha('protegerFrio', 'vinha.pillProtegerFrio', jaFezTarefaTempoHoje('frioDia'), t('vinha.tarefaFeitaHoje'));
  }

  const cuidadoHtml = (v.fase === 'crescendo' || v.fase === 'pronta')
    ? '<span class="mini-sub"><span data-i18n="vinha.cuidadoLabel"></span>: ' + v.pontosCuidado + ' / ' + PONTOS_CUIDADO_NECESSARIOS + '</span>'
    : '';
  const bonusPodaHtml = v.bonusPoda
    ? '<p class="phase-progress">' + t('vinha.bonusPodaAtivo').replace('{pct}', Math.round(REGRAS_PODA.bonusVindima * 100)) + '</p>'
    : '';

  // Cartão pequeno do topo, encostado ao canto superior esquerdo — só
  // "A Vinha · Setembro", "Fase: X" e "Cuidado: n/5" ficam sempre
  // visíveis; o resto (descrição, fase real, recursos) só aparece
  // quando se toca no cartão (ver alternarCartaoVinha() e .topcard no
  // index.html — é um componente genérico, não só da Vinha).
  const corpoHtml = vinhaCartaoAberto
    ? '<div class="cartao-corpo">' +
        '<p class="phase-desc" data-i18n="' + faseInfo.descKey + '"></p>' +
        bonusPodaHtml +
        '<p class="phase-desc-real">' + t('vinha.faseRealLabel') + ' ' + t('vinha.faseReal.' + faseRealAtual()) + '</p>' +
        '<div class="chrome-mini-stats">' +
          '<div class="resource-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M4 20c8 0 15-6 15-15-9 0-15 7-15 15z"></path><path d="M9 15l7-7"></path></svg> ' + v.residuos + ' <span data-i18n="vinha.recursoResiduos"></span></div>' +
          '<div class="resource-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M12 21c0-5 0-9 0-12"></path><path d="M12 9c0-3-2-5-5-5 0 3 2 5 5 5z"></path><path d="M12 13c0-3 2-5 5-5 0 3-2 5-5 5z"></path></svg> ' + v.adubo + ' <span data-i18n="vinha.recursoAdubo"></span></div>' +
        '</div>' +
      '</div>'
    : '';

  const miniCardHtml =
    '<button type="button" class="topcard-header" onclick="alternarCartaoVinha()" aria-expanded="' + vinhaCartaoAberto + '">' +
      '<span class="cartao-textos">' +
        '<span class="mini-title"><span data-i18n="vinha.title"></span> · ' + nomeMesAtual() + '</span>' +
        '<span class="mini-sub"><span data-i18n="vinha.faseLabel"></span>: ' + t('vinha.faseCurta.' + v.fase) + '</span>' +
        cuidadoHtml +
      '</span>' +
      '<svg class="cartao-seta" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M6 9l6 6 6-6"></path></svg>' +
    '</button>' +
    corpoHtml;

  container.innerHTML =
    '<div class="topcard' + (vinhaCartaoAberto ? ' aberto' : '') + '">' + miniCardHtml + '</div>' +
    construirFilaPastilhas('vinha-pill-scroll', botoesHtml, 'vinha.verMaisTarefas');

  const fotoFundoVinha = vinhaFotoAtual || fundoTempoVinha() || VINHA_FOTOS[VINHA_FUNDO_POR_FASE[v.fase]];
  definirFundo('foto', fotoFundoVinha, VINHA_FOTO_POS[fotoFundoVinha]);

  marcarPastilhaPrincipal(container);
  configurarFilaPastilhas('vinha-pill-scroll');
  mostrarNovaEntrada(vinhaNovaEntrada);
  atualizarDialogo(vinhaMensagemAtual, 'YoshiCat');
  applyTranslations();
}

// "Primeiros Passos" — a primeira vez de sempre que cada ação da Vinha
// tem sucesso dá um pequeno prémio extra de Reputação, para um jogador
// novo chegar cedo aos primeiros níveis (ver Áreas por Nível em
// js/niveis.js). +4 (não +3): garante o Nível 2 (15) já na primeira
// visita com as 4 ações sempre possíveis nessa altura (Cavar, Plantar,
// Ervas, Regar — 4×4=16), sem depender de sorte nos Resíduos da ação
// "Ervas". Cada ação só dá este prémio uma vez, para sempre.
const VINHA_PRIMEIRO_PASSO_PONTOS = 4;

function premiarPrimeiroPasso(actionKey) {
  if (state.vinha.primeirosPassos[actionKey]) return '';
  state.vinha.primeirosPassos[actionKey] = true;
  state.reputacao += VINHA_PRIMEIRO_PASSO_PONTOS;
  return ' ' + t('vinha.primeiroPassoMsg').replace('{n}', VINHA_PRIMEIRO_PASSO_PONTOS);
}

// Se esta ação fez o jogador subir de nível, junta um aviso curto a
// dizer para voltar à Quinta ver a história (ver js/historia.js) — sem
// isto, quem nunca voltasse à Quinta nunca chegaria a ver essa história.
function sufixoSeSubiuNivel(nivelAntes) {
  if (typeof nivelPelaReputacao !== 'function') return '';
  return nivelPelaReputacao(state.reputacao) > nivelAntes ? ' ' + t('vinha.subiuNivelAviso') : '';
}

function executarAcaoVinha(actionKey) {
  const nivelAntes = typeof nivelPelaReputacao === 'function' ? nivelPelaReputacao(state.reputacao) : 0;
  vinhaFotoAtual = null;
  vinhaNovaEntrada = null;

  if (tempoRestanteVinha(actionKey) > 0) {
    vinhaMensagemAtual = t('vinha.msgCooldown').replace('{tempo}', formatarTempoVinha(tempoRestanteVinha(actionKey)));
    renderVinha();
    return;
  }

  const v = state.vinha;

  if (actionKey === 'cavar') {
    if (v.fase !== 'preparar') return;
    v.fase = 'preparada';
  } else if (actionKey === 'plantar') {
    if (v.fase !== 'preparada') return;
    v.fase = 'crescendo';
    // Na primavera, plantar dá um pequeno impulso de cuidado à partida.
    v.pontosCuidado = acaoTemBonusEstacao('plantar') ? 1 : 0;
  } else if (actionKey === 'ervas') {
    if (v.fase !== 'preparada' && v.fase !== 'crescendo') return;
    if (v.fase === 'crescendo') v.pontosCuidado += acaoTemBonusEstacao('ervas') ? 2 : 1;
    v.residuos += randInt(1, 3);
  } else if (actionKey === 'regar') {
    if (v.fase !== 'crescendo') return;
    const cuidadoBaseRegar = acaoTemBonusEstacao('regar') ? 2 : 1;
    v.pontosCuidado += tempoAtual().calorForte
      ? Math.round(cuidadoBaseRegar * TEMPO_CONFIG.vantagens.calorMultiplicadorRegar)
      : cuidadoBaseRegar;
  } else if (actionKey === 'adubar') {
    if (v.fase !== 'crescendo') return;
    if (v.adubo < 1) {
      vinhaMensagemAtual = t('vinha.msgPrecisaAdubo');
      renderVinha();
      return;
    }
    v.adubo -= 1;
    v.pontosCuidado += 2;
  } else if (actionKey === 'compostagem') {
    if (v.residuos < RESIDUOS_POR_COMPOSTAGEM) {
      vinhaMensagemAtual = t('vinha.msgFaltamResiduos');
      renderVinha();
      return;
    }
    v.residuos -= RESIDUOS_POR_COMPOSTAGEM;
    v.adubo += acaoTemBonusEstacao('compostagem') ? 2 : 1;
  } else if (actionKey === 'colher') {
    if (v.fase !== 'pronta') return;
    // O bónus do outono e o bónus da poda juntam-se (somam-se as
    // percentagens): outono sozinho = 1.5x, poda sozinha = 1.25x,
    // os dois juntos = 1.75x.
    const bonusOutono = acaoTemBonusEstacao('colher') ? (VINHA_MULTIPLICADOR_BONUS - 1) : 0;
    const bonusPoda = v.bonusPoda ? REGRAS_PODA.bonusVindima : 0;
    const multiplicador = 1 + bonusOutono + bonusPoda;
    const uvasBase = Math.max(1, 12 + v.pontosCuidado * 4 + randInt(-2, 2));
    const uvasGanhas = Math.round(uvasBase * multiplicador);
    const repGanha = bonusOutono > 0 ? randInt(2, 5) : 0;
    state.uvas += uvasGanhas;
    state.reputacao += repGanha;
    v.residuos += randInt(3, 5);
    v.fase = 'preparar';
    v.pontosCuidado = 0;
    v.bonusPoda = false; // o bónus da poda gasta-se nesta vindima
    registarCooldownVinha(actionKey);
    let sufixoColheita = ' (+' + uvasGanhas + ' ' + t('stat.uvas');
    if (repGanha > 0) sufixoColheita += ', +' + repGanha + ' ' + t('stat.reputacao');
    sufixoColheita += ')';
    if (typeof marcarObjetivoCumprido === 'function') marcarObjetivoCumprido('vinha_colher');
    vinhaMensagemAtual = dicaVinha('colher') + sufixoColheita + premiarPrimeiroPasso('colher') + sufixoSeSubiuNivel(nivelAntes);
    vinhaFotoAtual = VINHA_FOTOS.colher;
    saveState(state);
    updateStatsDisplays();
    renderVinha();
    return;
  } else if (actionKey === 'podar') {
    if (estacaoAtual() !== REGRAS_PODA.estacao || jaPodouEsteInverno()) return;
    if (v.fase !== 'crescendo' && v.fase !== 'pronta') {
      vinhaMensagemAtual = t('vinha.msgPodaPrecisaPlantada');
      renderVinha();
      return;
    }
    v.invernoPodado = idInvernoAtual();
    v.bonusPoda = true;
    vinhaMensagemAtual = t('vinha.bonusPodaAtivo').replace('{pct}', Math.round(REGRAS_PODA.bonusVindima * 100));
    vinhaNovaEntrada = desbloquearEntradaEnciclopedia('poda');
    vinhaFotoAtual = VINHA_FOTOS.podar;
    saveState(state);
    updateStatsDisplays();
    renderVinha();
    return;
  } else if (actionKey === 'repararEstacas' || actionKey === 'protegerFrio') {
    const ehEstacas = actionKey === 'repararEstacas';
    const tempo = tempoAtual();
    const campoDia = ehEstacas ? 'estacasDia' : 'frioDia';
    if (!(ehEstacas ? tempo.ventoForte : tempo.frioForte) || jaFezTarefaTempoHoje(campoDia)) return;

    registarTarefaTempoHoje(campoDia);
    const repGanha = randInt(1, 3);
    let cuidadoGanho = 0;
    if (v.fase === 'crescendo') {
      cuidadoGanho = 1;
      v.pontosCuidado += cuidadoGanho;
      if (v.pontosCuidado >= PONTOS_CUIDADO_NECESSARIOS) v.fase = 'pronta';
    }
    state.reputacao += repGanha;
    let sufixoTarefaTempo = ' (+' + repGanha + ' ' + t('stat.reputacao');
    if (cuidadoGanho > 0) sufixoTarefaTempo += ', +' + cuidadoGanho + ' ' + t('vinha.cuidadoLabel');
    sufixoTarefaTempo += ')';
    if (typeof marcarObjetivoCumprido === 'function') marcarObjetivoCumprido(ehEstacas ? 'tempo_vento' : 'tempo_frio');
    vinhaMensagemAtual = t(ehEstacas ? 'vinha.msgRepararEstacas' : 'vinha.msgProtegerFrio') + sufixoTarefaTempo + sufixoSeSubiuNivel(nivelAntes);
    vinhaFotoAtual = VINHA_FOTOS[actionKey];
    saveState(state);
    updateStatsDisplays();
    renderVinha();
    return;
  } else {
    return;
  }

  if (v.fase === 'crescendo' && v.pontosCuidado >= PONTOS_CUIDADO_NECESSARIOS) {
    v.fase = 'pronta';
  }

  registarCooldownVinha(actionKey);
  if (typeof marcarObjetivoCumprido === 'function') marcarObjetivoCumprido('vinha_' + actionKey);
  vinhaMensagemAtual = dicaVinha(actionKey) + premiarPrimeiroPasso(actionKey) + sufixoSeSubiuNivel(nivelAntes);
  vinhaFotoAtual = VINHA_FOTOS[actionKey] || null;
  saveState(state);
  updateStatsDisplays();
  renderVinha();
}
