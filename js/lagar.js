// ---------------------------------------------------------------------
// O LAGAR (Nível 8, "Quinta de Portas Abertas") — as tarefas "Pisar as uvas" e "Pôr a mesa da vindima".
//
// Uma vez por dia (dia em Lisboa, como a Estrada e o Proteger), gasta
// LAGAR_CONFIG.custoUvas uvas e dá LAGAR_CONFIG.reputacao de Reputação.
// Sem uvas que cheguem, o ecrã explica o que falta (o botão fica apagado):
// nunca bloqueia mais nada. O capítulo 8 (ver js/capitulos.js) conta
// state.lagar.dias, os dias DIFERENTES em que se pisou.
//
// state.lagar (ver defaultState() em js/state.js):
//   ultimoDia  'AAAA-MM-DD' (Lisboa) do último dia em que pisou; null = nunca
//   dias       quantos dias diferentes já pisou (só sobe)
//   mesaDia    'AAAA-MM-DD' (Lisboa) da última "mesa da vindima"; null = nunca (cada tarefa tem o seu dia)
//
// "Pôr a mesa da vindima": uma vez por dia, gasta LAGAR_CONFIG.mesa.bens da Despensa (só sobe "entregues";
// "recebidos", que o capítulo 7 lê, nunca muda) e dá LAGAR_CONFIG.mesa.reputacao. A regra está em
// despensaMesaVindima (js/despensa.js): este ficheiro só a chama, no clique, e lê quantos bens há.
//
// As regras (lagarPodePisar, lagarPisar) são puras: o dia chega por
// argumento, nada lê o relógio nem sorteia, nada grava (quem chama grava).
// Para mudar os valores: só LAGAR_CONFIG (se mudares os bens, muda também o texto "lagar.mesaPedido").
// ---------------------------------------------------------------------

const LAGAR_CONFIG = {
  custoUvas: 30,
  reputacao: 5,
  // A mesa da vindima: 1 de cada um dos 3 bens de origem do capítulo 7 (ver CAPITULOS_CONFIG), +12 de Reputação
  // (3 bens a 25 uvas cada = 75 uvas por 12 de Reputação, quase o mesmo preço por ponto do "Pisar as uvas").
  mesa: {
    bens: [{ bem: 'queijo_azeitao', n: 1 }, { bem: 'sal_sado', n: 1 }, { bem: 'mel_sesimbra', n: 1 }],
    reputacao: 12,
    imagem: 'assets/ecras/yoshi_cat_festa.jpg' // fundo do ecrã depois de pôr a mesa
  }
};

const LAGAR_DIA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function lagarInteiro(n) {
  return typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= Number.MAX_SAFE_INTEGER ? n : 0;
}

// Repara state.lagar em memória (uma nuvem ou um save estranho podem trazer null ou outro tipo).
function lagarEstado(estado) {
  let l = estado.lagar;
  if (!l || typeof l !== 'object' || Array.isArray(l)) l = estado.lagar = { ultimoDia: null, dias: 0, mesaDia: null };
  if (typeof l.ultimoDia !== 'string' || !LAGAR_DIA_REGEX.test(l.ultimoDia)) l.ultimoDia = null;
  l.dias = lagarInteiro(l.dias);
  if (typeof l.mesaDia !== 'string' || !LAGAR_DIA_REGEX.test(l.mesaDia)) l.mesaDia = null;
  return l;
}

// Só lê. Devolve { ok, motivo, faltam }:
//   motivo null | 'estado_invalido' | 'dia_invalido' | 'dia_anterior' | 'ja_hoje' | 'faltam_uvas'
// "faltam" = uvas que faltam (só com 'faltam_uvas'). Nunca altera o estado.
function lagarPodePisar(estado, dia) {
  const recusa = function (motivo, faltam) { return { ok: false, motivo: motivo, faltam: faltam || 0 }; };
  if (!estado || typeof estado !== 'object') return recusa('estado_invalido');
  if (typeof dia !== 'string' || !LAGAR_DIA_REGEX.test(dia)) return recusa('dia_invalido');
  const l = estado.lagar;
  const ultimo = l && typeof l === 'object' && typeof l.ultimoDia === 'string' && LAGAR_DIA_REGEX.test(l.ultimoDia) ? l.ultimoDia : null;
  if (ultimo !== null && dia < ultimo) return recusa('dia_anterior');
  if (ultimo !== null && dia === ultimo) return recusa('ja_hoje');
  const uvas = typeof estado.uvas === 'number' && Number.isFinite(estado.uvas) ? estado.uvas : 0;
  if (uvas < LAGAR_CONFIG.custoUvas) return recusa('faltam_uvas', Math.ceil(LAGAR_CONFIG.custoUvas - uvas));
  return { ok: true, motivo: null, faltam: 0 };
}

// Pisa as uvas do dia "dia". Valida tudo antes de alterar (lagarPodePisar); recusar nunca altera nada.
// Se ok: gasta custoUvas uvas, soma a Reputação, marca ultimoDia e soma 1 a dias.
// Devolve { ok, motivo, uvasGastas, reputacaoGanha }. Não grava e não verifica a subida de nível
// (isso é feito por verificarSubidaNivel() ao entrar na Quinta, como com qualquer outra Reputação).
function lagarPisar(estado, dia) {
  const p = lagarPodePisar(estado, dia);
  if (!p.ok) return { ok: false, motivo: p.motivo, uvasGastas: 0, reputacaoGanha: 0 };
  const l = lagarEstado(estado);
  estado.uvas -= LAGAR_CONFIG.custoUvas;
  estado.reputacao = (typeof estado.reputacao === 'number' && Number.isFinite(estado.reputacao) ? estado.reputacao : 0) + LAGAR_CONFIG.reputacao;
  l.ultimoDia = dia;
  l.dias += 1;
  return { ok: true, motivo: null, uvasGastas: LAGAR_CONFIG.custoUvas, reputacaoGanha: LAGAR_CONFIG.reputacao };
}

// ---------------------------------------------------------------------
// ECRÃ E LINHA DA QUINTA
// ---------------------------------------------------------------------

// Só em memória: o que se fez neste ecrã desde que se entrou, para mostrar o agradecimento.
let lagarResultado = null; // { pisar: { uvas, rep } ou null, mesa: { rep } ou null } ou null
let lagarOcupado = false;

function lagarDiaDeHoje() {
  return diaLisboaDeHoje();
}

// Linha no cartão da Quinta, só com o ecrã desbloqueado (como a da Estrada).
function atualizarLinhaLagarQuinta() {
  const container = document.getElementById('lagar-linha-container');
  if (!container) return;
  if (typeof ecraDesbloqueado !== 'function' || !ecraDesbloqueado('lagar')) { container.innerHTML = ''; return; }
  container.innerHTML =
    '<div class="mini-bloco">' +
      '<button type="button" class="visita-linha" onclick="goTo(\'lagar\')">' + t('lagar.linha') + '</button>' +
    '</div>';
}

// O que o ecrã diz por baixo do botão (só lê).
function lagarTextoEstado(p, dia) {
  if (p.motivo === 'ja_hoje') return t('lagar.jaHoje');
  if (p.motivo === 'faltam_uvas') return t('lagar.faltam').replace('{faltam}', p.faltam).replace('{tem}', Math.floor(state.uvas));
  if (p.motivo === 'dia_anterior') return t('lagar.relogio');
  return '';
}

// Só lê. O estado da mesa da vindima neste dia: { ok, motivo, faltam } com
//   motivo null | 'dia_anterior' | 'ja_hoje' | 'faltam_bens'  e  faltam = ids dos bens que faltam na Despensa.
// Não altera nada (a regra a sério, que gasta, é despensaMesaVindima em js/despensa.js).
function lagarMesaEstado(estado, dia) {
  const ultima = estado && estado.lagar && typeof estado.lagar === 'object' && typeof estado.lagar.mesaDia === 'string' && LAGAR_DIA_REGEX.test(estado.lagar.mesaDia) ? estado.lagar.mesaDia : null;
  if (ultima !== null && dia < ultima) return { ok: false, motivo: 'dia_anterior', faltam: [] };
  if (ultima !== null && dia === ultima) return { ok: false, motivo: 'ja_hoje', faltam: [] };
  const faltam = LAGAR_CONFIG.mesa.bens.filter(function (b) { return despensaQuantos(estado, b.bem) < b.n; }).map(function (b) { return b.bem; });
  if (faltam.length > 0) return { ok: false, motivo: 'faltam_bens', faltam: faltam };
  return { ok: true, motivo: null, faltam: [] };
}

function lagarTextoMesa(m) {
  if (m.motivo === 'ja_hoje') return t('lagar.mesaJaHoje');
  if (m.motivo === 'dia_anterior') return t('lagar.relogio');
  if (m.motivo === 'faltam_bens') {
    const nomes = m.faltam.map(function (id) { return estradaNomeBem(id); }).join(', ');
    return t('lagar.mesaFalta').replace('{bens}', nomes) + ' ' + t('lagar.mesaOnde');
  }
  return '';
}

function lagarDesenhar() {
  const container = document.getElementById('lagar-container');
  if (!container) return;
  const dia = lagarDiaDeHoje();
  const p = lagarPodePisar(state, dia);
  const m = lagarMesaEstado(state, dia);
  const dias = lagarInteiro(state.lagar && state.lagar.dias);
  const r = lagarResultado || {};
  // Com o resultado à vista, a linha "já fizeste hoje" é redundante.
  const estadoTexto = r.pisar ? '' : lagarTextoEstado(p, dia);
  const mesaTexto = r.mesa ? '' : lagarTextoMesa(m);

  container.innerHTML =
    '<div class="topcard">' +
      '<p class="mini-title" data-i18n="lagar.title"></p>' +
      '<p class="mini-sub">' + t('lagar.dias').replace('{n}', dias) + '</p>' +
    '</div>' +
    '<div class="action-panel lagar-painel">' +
      '<div class="lagar-info">' +
        '<p>' + t('lagar.desc').replace('{n}', LAGAR_CONFIG.custoUvas).replace('{rep}', LAGAR_CONFIG.reputacao) + '</p>' +
        (r.pisar ? '<p class="lagar-ok">' + t('lagar.ok').replace('{n}', r.pisar.uvas).replace('{rep}', r.pisar.rep) + '</p>' : '') +
        (estadoTexto ? '<p>' + estadoTexto + '</p>' : '') +
      '</div>' +
      '<button type="button" class="btn-pill pill-main lagar-botao" onclick="lagarPisarClique()"' + (p.ok ? '' : ' disabled') + '>' +
        t('lagar.btn').replace('{n}', LAGAR_CONFIG.custoUvas) + '</button>' +
      '<div class="lagar-info">' +
        '<p>' + t('lagar.mesaDesc').replace('{pedido}', t('lagar.mesaPedido')).replace('{rep}', LAGAR_CONFIG.mesa.reputacao) + '</p>' +
        (r.mesa ? '<p class="lagar-ok">' + t('lagar.mesaOk').replace('{rep}', r.mesa.rep) + '</p>' : '') +
        (mesaTexto ? '<p>' + mesaTexto + '</p>' : '') +
      '</div>' +
      '<button type="button" class="btn-pill pill-main lagar-botao-mesa" onclick="lagarMesaClique()"' + (m.ok ? '' : ' disabled') + '>' +
        t('lagar.mesaBtn') + '</button>' +
      '<button type="button" class="btn-ghost" onclick="voltarEcraAnterior()" data-i18n="nav.voltar"></button>' +
    '</div>';

  // Fundo: o do Lagar (ver FUNDO_DOS_ECRAS em js/main.js); depois de pôr a mesa, a foto da festa.
  if (r.mesa) definirFundo('foto', LAGAR_CONFIG.mesa.imagem);

  atualizarDialogo('', '');
  applyTranslations();
}

// Ao entrar no ecrã (ver goTo() em js/main.js): esquece o resultado da visita anterior.
function renderLagar() {
  lagarResultado = null;
  lagarDesenhar();
}

// O ÚNICO sítio que pisa e grava. Toque no botão: desativa-o logo (clique duplo), pisa (lagarPisar) e,
// se correu bem, grava UMA vez e atualiza a barra de cima. Se recusou, não grava.
function lagarPisarClique() {
  if (lagarOcupado) return;
  lagarOcupado = true;
  try {
    const botao = document.querySelector('.lagar-botao');
    if (botao) botao.disabled = true;
    const r = lagarPisar(state, lagarDiaDeHoje());
    if (r.ok) {
      saveState(state);
      updateStatsDisplays();
      lagarResultado = Object.assign({}, lagarResultado, { pisar: { uvas: r.uvasGastas, rep: r.reputacaoGanha } });
      if (typeof vibrar === 'function') vibrar('sucesso');
      if (typeof tocarSom === 'function') tocarSom('objetivoCumprido');
    }
  } finally {
    lagarOcupado = false;
  }
  lagarDesenhar();
}

// O ÚNICO sítio que põe a mesa e grava (a regra é despensaMesaVindima, em js/despensa.js). Toque no botão:
// desativa-o logo (clique duplo), põe a mesa e, se correu bem, grava UMA vez e atualiza a barra de cima.
// Se recusou, não grava.
function lagarMesaClique() {
  if (lagarOcupado) return;
  lagarOcupado = true;
  try {
    const botao = document.querySelector('.lagar-botao-mesa');
    if (botao) botao.disabled = true;
    const r = despensaMesaVindima(state, lagarDiaDeHoje(), { bens: LAGAR_CONFIG.mesa.bens, reputacao: LAGAR_CONFIG.mesa.reputacao });
    if (r.ok) {
      saveState(state);
      updateStatsDisplays();
      lagarResultado = Object.assign({}, lagarResultado, { mesa: { rep: r.reputacaoGanha } });
      if (typeof vibrar === 'function') vibrar('sucesso');
      if (typeof tocarSom === 'function') tocarSom('objetivoCumprido');
    }
  } finally {
    lagarOcupado = false;
  }
  lagarDesenhar();
}
