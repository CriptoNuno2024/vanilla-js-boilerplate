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

const VINHA_FLAVOR = {
  cavar: 'Revolver a terra areja as raízes e prepara o solo para uma nova plantação.',
  plantar: 'Os novos bacelos de Moscatel Graúdo são plantados com cuidado, em filas viradas a poente.',
  ervas: 'As ervas daninhas competem pela água e pelos nutrientes que a videira precisa.',
  regar: 'A vinha da Arrábida agradece a água nas tardes mais quentes de verão.',
  adubar: 'O adubo orgânico devolve à terra o que a vinha consumiu na estação anterior.',
  compostagem: 'Os resíduos da poda e das ervas arrancadas transformam-se, com tempo, em adubo rico para a vinha.',
  colher: 'A vindima é feita à mão, cacho a cacho, para não danificar os bagos maduros de Moscatel.'
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
  colher: 'assets/vinha/colher.jpg'
};

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
// (essa continua só em português, como já era o caso).
const VINHA_DICA_SAZONAL_KEY = {
  primavera: { plantar: 'vinha.dica.plantar.primavera', ervas: 'vinha.dica.ervas.primavera' },
  verao: { regar: 'vinha.dica.regar.verao' },
  outono: { colher: 'vinha.dica.colher.outono' },
  inverno: { compostagem: 'vinha.dica.compostagem.inverno' }
};

function dicaVinha(actionKey) {
  const porEstacao = VINHA_DICA_SAZONAL_KEY[estacaoAtual()];
  const key = porEstacao && porEstacao[actionKey];
  return key ? t(key) : (VINHA_FLAVOR[actionKey] || '');
}

let vinhaMensagemAtual = '';
let vinhaFotoAtual = null;

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

function enterVinha() {
  vinhaMensagemAtual = '';
  vinhaFotoAtual = null;
  renderVinha();
}

function botaoVinha(actionKey, i18nKey, bloqueadoExtra) {
  const restante = tempoRestanteVinha(actionKey);
  const bloqueado = restante > 0 || !!bloqueadoExtra;
  const sufixo = restante > 0 ? (' (' + formatarTempoVinha(restante) + ')') : '';
  const bonusHtml = acaoTemBonusEstacao(actionKey)
    ? ' <span class="bonus-suffix">' + t(VINHA_BONUS_LABEL_KEY[actionKey]) + '</span>'
    : '';
  if (!bloqueado) preCarregarFotoVinha(actionKey);
  return '<button class="btn btn-primary" ' + (bloqueado ? 'disabled' : '') +
    ' onclick="executarAcaoVinha(\'' + actionKey + '\')">' +
    '<span data-i18n="' + i18nKey + '"></span><span class="cooldown-suffix">' + sufixo + '</span>' + bonusHtml +
    '</button>';
}

function renderVinha() {
  const container = document.getElementById('vinha-container');
  const v = state.vinha;
  const faseInfo = VINHA_FASES[v.fase];
  let botoesHtml = '';

  if (v.fase === 'preparar') {
    botoesHtml += botaoVinha('cavar', 'vinha.btnCavar');
  } else if (v.fase === 'preparada') {
    botoesHtml += botaoVinha('ervas', 'vinha.btnErvas');
    botoesHtml += botaoVinha('plantar', 'vinha.btnPlantar');
  } else if (v.fase === 'crescendo') {
    botoesHtml += botaoVinha('regar', 'vinha.btnRegar');
    botoesHtml += botaoVinha('adubar', 'vinha.btnAdubar', v.adubo < 1);
    botoesHtml += botaoVinha('ervas', 'vinha.btnErvas');
  } else if (v.fase === 'pronta') {
    botoesHtml += botaoVinha('colher', 'vinha.btnColher');
  }

  // Compostagem: sempre disponível, independente da fase da vinha.
  botoesHtml += botaoVinha('compostagem', 'vinha.btnCompostar', v.residuos < RESIDUOS_POR_COMPOSTAGEM);

  const progressoHtml = (v.fase === 'crescendo' || v.fase === 'pronta')
    ? '<p class="phase-progress"><span data-i18n="vinha.cuidadoLabel"></span>: ' + v.pontosCuidado + ' / ' + PONTOS_CUIDADO_NECESSARIOS + '</p>'
    : '';

  container.innerHTML =
    '<h2 data-i18n="vinha.title"></h2>' +
    '<div class="phase-card">' +
      '<p class="phase-nome" data-i18n="' + faseInfo.nomeKey + '"></p>' +
      '<p class="phase-desc" data-i18n="' + faseInfo.descKey + '"></p>' +
      progressoHtml +
    '</div>' +
    '<div class="phase-card">' +
      '<p class="phase-nome" data-i18n="vinha.faseRealLabel"></p>' +
      '<p class="phase-desc">' + t('vinha.faseReal.' + faseRealAtual()) + '</p>' +
    '</div>' +
    '<div class="stats-bar">' +
      '<div class="stat-item"><span class="stat-icon">🍂</span><span class="stat-value">' + v.residuos + '</span><span class="stat-label" data-i18n="vinha.recursoResiduos"></span></div>' +
      '<div class="stat-item"><span class="stat-icon">🌿</span><span class="stat-value">' + v.adubo + '</span><span class="stat-label" data-i18n="vinha.recursoAdubo"></span></div>' +
    '</div>' +
    '<p class="game-result">' + vinhaMensagemAtual + '</p>' +
    '<div class="action-list">' + botoesHtml + '</div>';

  definirFundo('foto', vinhaFotoAtual || VINHA_FOTOS[VINHA_FUNDO_POR_FASE[v.fase]]);

  applyTranslations();
}

function executarAcaoVinha(actionKey) {
  vinhaFotoAtual = null;

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
    v.pontosCuidado += acaoTemBonusEstacao('regar') ? 2 : 1;
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
    const bonusColheita = acaoTemBonusEstacao('colher');
    const uvasBase = Math.max(1, 12 + v.pontosCuidado * 4 + randInt(-2, 2));
    const uvasGanhas = bonusColheita ? Math.round(uvasBase * VINHA_MULTIPLICADOR_BONUS) : uvasBase;
    const repGanha = bonusColheita ? randInt(2, 5) : 0;
    state.uvas += uvasGanhas;
    state.reputacao += repGanha;
    v.residuos += randInt(3, 5);
    v.fase = 'preparar';
    v.pontosCuidado = 0;
    registarCooldownVinha(actionKey);
    let sufixoColheita = ' (+' + uvasGanhas + ' ' + t('stat.uvas');
    if (repGanha > 0) sufixoColheita += ', +' + repGanha + ' ' + t('stat.reputacao');
    sufixoColheita += ')';
    vinhaMensagemAtual = dicaVinha('colher') + sufixoColheita;
    vinhaFotoAtual = VINHA_FOTOS.colher;
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
  vinhaMensagemAtual = dicaVinha(actionKey);
  vinhaFotoAtual = VINHA_FOTOS[actionKey] || null;
  saveState(state);
  updateStatsDisplays();
  renderVinha();
}
