// ---------------------------------------------------------------------
// O LAGAR (Nível 8, "Quinta de Portas Abertas") — a tarefa "Pisar as uvas".
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
//
// As regras (lagarPodePisar, lagarPisar) são puras: o dia chega por
// argumento, nada lê o relógio nem sorteia, nada grava (quem chama grava).
// Para mudar os valores: só LAGAR_CONFIG.
// ---------------------------------------------------------------------

const LAGAR_CONFIG = {
  custoUvas: 30,
  reputacao: 5
};

const LAGAR_DIA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function lagarInteiro(n) {
  return typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= Number.MAX_SAFE_INTEGER ? n : 0;
}

// Repara state.lagar em memória (uma nuvem ou um save estranho podem trazer null ou outro tipo).
function lagarEstado(estado) {
  let l = estado.lagar;
  if (!l || typeof l !== 'object' || Array.isArray(l)) l = estado.lagar = { ultimoDia: null, dias: 0 };
  if (typeof l.ultimoDia !== 'string' || !LAGAR_DIA_REGEX.test(l.ultimoDia)) l.ultimoDia = null;
  l.dias = lagarInteiro(l.dias);
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

// Só em memória: o resultado de hoje, para mostrar o agradecimento até se sair do ecrã.
let lagarResultado = null; // { uvas, rep } ou null
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

function lagarDesenhar() {
  const container = document.getElementById('lagar-container');
  if (!container) return;
  const dia = lagarDiaDeHoje();
  const p = lagarPodePisar(state, dia);
  const dias = lagarInteiro(state.lagar && state.lagar.dias);
  const estadoTexto = lagarTextoEstado(p, dia);

  container.innerHTML =
    '<div class="topcard">' +
      '<p class="mini-title" data-i18n="lagar.title"></p>' +
      '<p class="mini-sub">' + t('lagar.dias').replace('{n}', dias) + '</p>' +
    '</div>' +
    '<div class="action-panel">' +
      '<div class="lagar-info">' +
        '<p>' + t('lagar.desc').replace('{n}', LAGAR_CONFIG.custoUvas).replace('{rep}', LAGAR_CONFIG.reputacao) + '</p>' +
        (lagarResultado ? '<p class="lagar-ok">' + t('lagar.ok').replace('{n}', lagarResultado.uvas).replace('{rep}', lagarResultado.rep) + '</p>' : '') +
        (estadoTexto ? '<p>' + estadoTexto + '</p>' : '') +
      '</div>' +
      '<button type="button" class="btn-pill pill-main pill-grande lagar-botao" onclick="lagarPisarClique()"' + (p.ok ? '' : ' disabled') + '>' +
        t('lagar.btn').replace('{n}', LAGAR_CONFIG.custoUvas) + '</button>' +
      '<button type="button" class="btn-ghost" onclick="voltarEcraAnterior()" data-i18n="nav.voltar"></button>' +
    '</div>';

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
      lagarResultado = { uvas: r.uvasGastas, rep: r.reputacaoGanha };
      if (typeof vibrar === 'function') vibrar('sucesso');
      if (typeof tocarSom === 'function') tocarSom('objetivoCumprido');
    }
  } finally {
    lagarOcupado = false;
  }
  lagarDesenhar();
}
