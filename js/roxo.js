// ---------------------------------------------------------------------
// A CEPA ROXA (Nível 10, "Moscatel Roxo") — a tarefa "Brindar com o Moscatel Roxo".
//
// Uma vez por dia (dia em Lisboa, como a Câmara, o Lagar e a Estrada), com pelo menos ROXO_CONFIG.garrafasMinimas garrafas
// feitas (state.garrafas), brinda-se com o Moscatel Roxo, a casta rara de Setúbal, e ganham-se ROXO_CONFIG.reputacao de
// Reputação. Não gasta nada: nem garrafas, nem uvas, nem gotas, nem a Despensa (as garrafas só se contam, nunca se tiram).
// Sem garrafas que cheguem, o ecrã diz quantas faltam (o botão fica apagado): nunca bloqueia mais nada. O capítulo 10
// (ver js/capitulos.js) conta state.roxo.dias, os dias DIFERENTES em que se brindou.
//
// state.roxo (ver defaultState() em js/state.js):
//   brindeDia  'AAAA-MM-DD' (Lisboa) do último brinde; null = nunca
//   dias       quantos dias diferentes já brindou (só sobe)
//
// As regras (roxoPodeBrindar, roxoBrindar) são puras: o dia chega por argumento, nada lê o relógio nem sorteia, nada
// grava (quem chama grava). Para mudar os valores: só ROXO_CONFIG.
// ---------------------------------------------------------------------

const ROXO_CONFIG = {
  reputacao: 15,         // a última tarefa do jogo: um pouco acima das outras (Câmara +8, mesa da vindima +12)
  garrafasMinimas: 10,   // garrafas feitas (state.garrafas) que é preciso ter; nunca se gastam (a conquista "Dez garrafas")
  // Imagens que já existem. O fundo do ecrã está em FUNDO_DOS_ECRAS (js/main.js); esta é a do resultado do brinde.
  imagemResultado: 'assets/garrafas/garrafa_3_ambar.jpg'
};

const ROXO_DIA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function roxoInteiro(n) {
  return typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= Number.MAX_SAFE_INTEGER ? n : 0;
}

// Repara state.roxo em memória (uma nuvem ou um save estranho podem trazer null ou outro tipo).
function roxoEstado(estado) {
  let r = estado.roxo;
  if (!r || typeof r !== 'object' || Array.isArray(r)) r = estado.roxo = { brindeDia: null, dias: 0 };
  if (typeof r.brindeDia !== 'string' || !ROXO_DIA_REGEX.test(r.brindeDia)) r.brindeDia = null;
  r.dias = roxoInteiro(r.dias);
  return r;
}

// Só lê. Devolve { ok, motivo, faltam, tem }:
//   motivo null | 'estado_invalido' | 'dia_invalido' | 'dia_anterior' | 'ja_hoje' | 'faltam_garrafas'
// "faltam" = garrafas que faltam e "tem" = as que tem (só com 'faltam_garrafas'). Nunca altera o estado.
function roxoPodeBrindar(estado, dia) {
  const recusa = function (motivo, faltam, tem) { return { ok: false, motivo: motivo, faltam: faltam || 0, tem: tem || 0 }; };
  if (!estado || typeof estado !== 'object') return recusa('estado_invalido');
  if (typeof dia !== 'string' || !ROXO_DIA_REGEX.test(dia)) return recusa('dia_invalido');
  const r = estado.roxo;
  const ultimo = r && typeof r === 'object' && typeof r.brindeDia === 'string' && ROXO_DIA_REGEX.test(r.brindeDia) ? r.brindeDia : null;
  if (ultimo !== null && dia < ultimo) return recusa('dia_anterior');
  if (ultimo !== null && dia === ultimo) return recusa('ja_hoje');
  const garrafas = roxoInteiro(estado.garrafas);
  if (garrafas < ROXO_CONFIG.garrafasMinimas) return recusa('faltam_garrafas', ROXO_CONFIG.garrafasMinimas - garrafas, garrafas);
  return { ok: true, motivo: null, faltam: 0, tem: garrafas };
}

// Brinda no dia "dia". Valida tudo antes de alterar (roxoPodeBrindar); recusar nunca altera nada.
// Se ok: soma a Reputação, marca brindeDia e soma 1 a dias. Não toca em mais nada (garrafas, uvas, gotas, Despensa).
// Devolve { ok, motivo, reputacaoGanha }. Não grava e não verifica a subida de nível (isso é feito por
// verificarSubidaNivel() ao entrar na Quinta, como com qualquer outra Reputação).
function roxoBrindar(estado, dia) {
  const p = roxoPodeBrindar(estado, dia);
  if (!p.ok) return { ok: false, motivo: p.motivo, reputacaoGanha: 0 };
  const r = roxoEstado(estado);
  estado.reputacao = (typeof estado.reputacao === 'number' && Number.isFinite(estado.reputacao) ? estado.reputacao : 0) + ROXO_CONFIG.reputacao;
  r.brindeDia = dia;
  r.dias += 1;
  return { ok: true, motivo: null, reputacaoGanha: ROXO_CONFIG.reputacao };
}

// ---------------------------------------------------------------------
// ECRÃ E LINHA DA QUINTA
// ---------------------------------------------------------------------

// Só em memória: o resultado de hoje, para mostrar o agradecimento até se sair do ecrã.
let roxoResultado = null; // { rep } ou null
let roxoOcupado = false;

function roxoDiaDeHoje() {
  return diaLisboaDeHoje();
}

// Linha no cartão da Quinta, só com o ecrã desbloqueado (como a da Câmara).
function atualizarLinhaRoxoQuinta() {
  const container = document.getElementById('roxo-linha-container');
  if (!container) return;
  if (typeof ecraDesbloqueado !== 'function' || !ecraDesbloqueado('roxo')) { container.innerHTML = ''; return; }
  container.innerHTML =
    '<div class="mini-bloco">' +
      '<button type="button" class="visita-linha" onclick="goTo(\'roxo\')">' + t('roxo.linha') + '</button>' +
    '</div>';
}

// O que o ecrã diz por baixo da descrição (só lê).
function roxoTextoEstado(p) {
  if (p.motivo === 'ja_hoje') return t('roxo.jaHoje');
  if (p.motivo === 'faltam_garrafas') return t('roxo.faltam').replace('{n}', p.faltam).replace('{tem}', p.tem);
  if (p.motivo === 'dia_anterior') return t('roxo.relogio');
  return '';
}

function roxoDesenhar() {
  const container = document.getElementById('roxo-container');
  if (!container) return;
  const p = roxoPodeBrindar(state, roxoDiaDeHoje());
  const dias = roxoInteiro(state.roxo && state.roxo.dias);
  // Com o resultado à vista, a linha "já brindaste hoje" é redundante.
  const estadoTexto = roxoResultado ? '' : roxoTextoEstado(p);

  container.innerHTML =
    '<div class="topcard">' +
      '<p class="mini-title" data-i18n="roxo.title"></p>' +
      '<p class="mini-sub">' + t('roxo.dias').replace('{n}', dias) + '</p>' +
    '</div>' +
    '<div class="action-panel roxo-painel">' +
      '<div class="roxo-info">' +
        '<p>' + t('roxo.desc').replace('{n}', ROXO_CONFIG.garrafasMinimas).replace('{rep}', ROXO_CONFIG.reputacao) + '</p>' +
        (roxoResultado ? '<p class="roxo-ok">' + t('roxo.ok').replace('{rep}', roxoResultado.rep) + '</p>' : '') +
        (estadoTexto ? '<p>' + estadoTexto + '</p>' : '') +
      '</div>' +
      '<button type="button" class="btn-pill pill-main roxo-botao" onclick="roxoBrindarClique()"' + (p.ok ? '' : ' disabled') + '>' +
        t('roxo.btn') + '</button>' +
      '<button type="button" class="btn-ghost" onclick="voltarEcraAnterior()" data-i18n="nav.voltar"></button>' +
    '</div>';

  // Fundo: o da Cepa Roxa (ver FUNDO_DOS_ECRAS em js/main.js); depois de brindar, a garrafa.
  if (roxoResultado) definirFundo('foto', ROXO_CONFIG.imagemResultado);

  // Depois de brindar fala o YoshiCat; senão o balão fica escondido.
  if (roxoResultado) atualizarDialogo(t('roxo.fala'), 'YoshiCat');
  else atualizarDialogo('', '');
  applyTranslations();
}

// Ao entrar no ecrã (ver goTo() em js/main.js): esquece o resultado da visita anterior.
function renderRoxo() {
  roxoResultado = null;
  roxoDesenhar();
}

// O ÚNICO sítio que brinda e grava. Toque no botão: desativa-o logo (clique duplo), brinda (roxoBrindar) e, se
// correu bem, grava UMA vez e atualiza a barra de cima. Se recusou, não grava.
function roxoBrindarClique() {
  if (roxoOcupado) return;
  roxoOcupado = true;
  try {
    const botao = document.querySelector('.roxo-botao');
    if (botao) botao.disabled = true;
    const r = roxoBrindar(state, roxoDiaDeHoje());
    if (r.ok) {
      saveState(state);
      updateStatsDisplays();
      roxoResultado = { rep: r.reputacaoGanha };
      if (typeof vibrar === 'function') vibrar('sucesso');
      if (typeof tocarSom === 'function') tocarSom('objetivoCumprido');
    }
  } finally {
    roxoOcupado = false;
  }
  roxoDesenhar();
}
