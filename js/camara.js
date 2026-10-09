// ---------------------------------------------------------------------
// A CÂMARA (Nível 9, "Câmara de Provadores") — a tarefa "Provar com o Dr. Henrique".
//
// Uma vez por dia (dia em Lisboa, como o Lagar e a Estrada), com pelo menos CAMARA_CONFIG.garrafasMinimas garrafa feita
// (state.garrafas), o Dr. Henrique prova um dos vinhos da Quinta e dá CAMARA_CONFIG.reputacao de Reputação. Não gasta
// nada: nem garrafas, nem uvas, nem gotas, nem a Despensa (as garrafas só se contam, nunca se tiram). Sem garrafas, o ecrã
// diz o que falta (o botão fica apagado): nunca bloqueia mais nada. O capítulo 9 (ver js/capitulos.js) conta
// state.camara.dias, os dias DIFERENTES em que se provou.
//
// state.camara (ver defaultState() em js/state.js):
//   provaDia  'AAAA-MM-DD' (Lisboa) da última prova; null = nunca
//   dias      quantos dias diferentes já provou (só sobe)
//
// As regras (camaraPodeProvar, camaraProvar) são puras: o dia chega por argumento, nada lê o relógio nem sorteia, nada
// grava (quem chama grava). Para mudar os valores: só CAMARA_CONFIG.
//
// Conhecimento (as entradas da Enciclopédia descobertas, state.conhecimento): soma +bonusPorPasso de Reputação por cada
// conhecimentoPorPasso de Conhecimento, no máximo bonusMaximo. Só soma: nunca gasta nem bloqueia nada.
// ---------------------------------------------------------------------

const CAMARA_CONFIG = {
  reputacao: 8,         // o mesmo de "Provar o Vinho Novo" (festa de São Martinho)
  conhecimentoPorPasso: 5, // cada 5 de Conhecimento...
  bonusPorPasso: 1,        // ...dão +1 de Reputação...
  bonusMaximo: 4,          // ...até +4 (Conhecimento 20 ou mais). Total: de +8 a +12
  garrafasMinimas: 1,   // garrafas feitas (state.garrafas) que é preciso ter; nunca se gastam
  // Imagens que já existem. O fundo do ecrã está em FUNDO_DOS_ECRAS (js/main.js); esta é a do resultado da prova.
  imagemResultado: 'assets/garrafas/garrafa_4_cobre.jpg'
};

const CAMARA_DIA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function camaraInteiro(n) {
  return typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= Number.MAX_SAFE_INTEGER ? n : 0;
}

// Repara state.camara em memória (uma nuvem ou um save estranho podem trazer null ou outro tipo).
function camaraEstado(estado) {
  let c = estado.camara;
  if (!c || typeof c !== 'object' || Array.isArray(c)) c = estado.camara = { provaDia: null, dias: 0 };
  if (typeof c.provaDia !== 'string' || !CAMARA_DIA_REGEX.test(c.provaDia)) c.provaDia = null;
  c.dias = camaraInteiro(c.dias);
  return c;
}

// Só lê. Devolve { ok, motivo, faltam }:
//   motivo null | 'estado_invalido' | 'dia_invalido' | 'dia_anterior' | 'ja_hoje' | 'sem_garrafas'
// "faltam" = garrafas que faltam (só com 'sem_garrafas'). Nunca altera o estado.
function camaraPodeProvar(estado, dia) {
  const recusa = function (motivo, faltam) { return { ok: false, motivo: motivo, faltam: faltam || 0 }; };
  if (!estado || typeof estado !== 'object') return recusa('estado_invalido');
  if (typeof dia !== 'string' || !CAMARA_DIA_REGEX.test(dia)) return recusa('dia_invalido');
  const c = estado.camara;
  const ultimo = c && typeof c === 'object' && typeof c.provaDia === 'string' && CAMARA_DIA_REGEX.test(c.provaDia) ? c.provaDia : null;
  if (ultimo !== null && dia < ultimo) return recusa('dia_anterior');
  if (ultimo !== null && dia === ultimo) return recusa('ja_hoje');
  const garrafas = camaraInteiro(estado.garrafas);
  if (garrafas < CAMARA_CONFIG.garrafasMinimas) return recusa('sem_garrafas', CAMARA_CONFIG.garrafasMinimas - garrafas);
  return { ok: true, motivo: null, faltam: 0 };
}

// O que a prova dá a este estado: { base, bonus, total }. O bónus vem do Conhecimento (inteiro >= 0; inválido conta 0).
function camaraRecompensa(estado) {
  const k = camaraInteiro(estado && estado.conhecimento);
  const passos = Math.floor(k / CAMARA_CONFIG.conhecimentoPorPasso);
  const bonus = Math.min(CAMARA_CONFIG.bonusMaximo, passos * CAMARA_CONFIG.bonusPorPasso);
  return { base: CAMARA_CONFIG.reputacao, bonus: bonus, total: CAMARA_CONFIG.reputacao + bonus };
}

// Prova no dia "dia". Valida tudo antes de alterar (camaraPodeProvar); recusar nunca altera nada.
// Se ok: soma a Reputação (a base mais o bónus do Conhecimento), marca provaDia e soma 1 a dias. Não toca em mais nada
// (garrafas, uvas, gotas, Despensa, Conhecimento).
// Devolve { ok, motivo, reputacaoGanha, bonus }. Não grava e não verifica a subida de nível (isso é feito por
// verificarSubidaNivel() ao entrar na Quinta, como com qualquer outra Reputação).
function camaraProvar(estado, dia) {
  const p = camaraPodeProvar(estado, dia);
  if (!p.ok) return { ok: false, motivo: p.motivo, reputacaoGanha: 0, bonus: 0 };
  const c = camaraEstado(estado);
  const r = camaraRecompensa(estado);
  estado.reputacao = (typeof estado.reputacao === 'number' && Number.isFinite(estado.reputacao) ? estado.reputacao : 0) + r.total;
  c.provaDia = dia;
  c.dias += 1;
  return { ok: true, motivo: null, reputacaoGanha: r.total, bonus: r.bonus };
}

// ---------------------------------------------------------------------
// ECRÃ E LINHA DA QUINTA
// ---------------------------------------------------------------------

// Só em memória: o resultado de hoje, para mostrar o agradecimento até se sair do ecrã.
let camaraResultado = null; // { rep } ou null
let camaraOcupado = false;

function camaraDiaDeHoje() {
  return diaLisboaDeHoje();
}

// Linha no cartão da Quinta, só com o ecrã desbloqueado (como a do Lagar).
function atualizarLinhaCamaraQuinta() {
  const container = document.getElementById('camara-linha-container');
  if (!container) return;
  if (typeof ecraDesbloqueado !== 'function' || !ecraDesbloqueado('camara')) { container.innerHTML = ''; return; }
  container.innerHTML =
    '<div class="mini-bloco">' +
      '<button type="button" class="visita-linha" onclick="goTo(\'camara\')">' + t('camara.linha') + '</button>' +
    '</div>';
}

// O que o ecrã diz por baixo da descrição (só lê).
function camaraTextoEstado(p) {
  if (p.motivo === 'ja_hoje') return t('camara.jaHoje');
  if (p.motivo === 'sem_garrafas') return t('camara.semGarrafas');
  if (p.motivo === 'dia_anterior') return t('camara.relogio');
  return '';
}

function camaraDesenhar() {
  const container = document.getElementById('camara-container');
  if (!container) return;
  const p = camaraPodeProvar(state, camaraDiaDeHoje());
  const dias = camaraInteiro(state.camara && state.camara.dias);
  // Com o resultado à vista, a linha "já provaste hoje" é redundante.
  const estadoTexto = camaraResultado ? '' : camaraTextoEstado(p);

  container.innerHTML =
    '<div class="topcard">' +
      '<p class="mini-title" data-i18n="camara.title"></p>' +
      '<p class="mini-sub">' + t('camara.dias').replace('{n}', dias) + '</p>' +
    '</div>' +
    '<div class="action-panel camara-painel">' +
      '<div class="camara-info">' +
        '<p>' + t('camara.desc').replace(/\{min\}/g, CAMARA_CONFIG.reputacao).replace('{max}', CAMARA_CONFIG.reputacao + CAMARA_CONFIG.bonusMaximo).replace('{passo}', CAMARA_CONFIG.conhecimentoPorPasso) + '</p>' +
        (camaraResultado ? '<p class="camara-ok">' + t(camaraResultado.bonus > 0 ? 'camara.okBonus' : 'camara.ok').replace('{rep}', camaraResultado.rep).replace('{bonus}', camaraResultado.bonus) + '</p>' : '') +
        (estadoTexto ? '<p>' + estadoTexto + '</p>' : '') +
      '</div>' +
      '<button type="button" class="btn-pill pill-main camara-botao" onclick="camaraProvarClique()"' + (p.ok ? '' : ' disabled') + '>' +
        t('camara.btn') + '</button>' +
      '<button type="button" class="btn-ghost" onclick="voltarEcraAnterior()" data-i18n="nav.voltar"></button>' +
    '</div>';

  // Fundo: o da Câmara (ver FUNDO_DOS_ECRAS em js/main.js); depois de provar, a garrafa.
  if (camaraResultado) definirFundo('foto', CAMARA_CONFIG.imagemResultado);

  // Depois de provar, fala o Dr. Henrique (com a cara dele); senão o balão fica escondido.
  if (camaraResultado) {
    mostrarFalas([{ texto: t('camara.fala'), falante: 'Dr. Henrique', personagem: 'henrique' }], 'Dr. Henrique');
  } else {
    atualizarDialogo('', '');
  }
  applyTranslations();
}

// Ao entrar no ecrã (ver goTo() em js/main.js): esquece o resultado da visita anterior.
function renderCamara() {
  camaraResultado = null;
  camaraDesenhar();
}

// O ÚNICO sítio que prova e grava. Toque no botão: desativa-o logo (clique duplo), prova (camaraProvar) e, se
// correu bem, grava UMA vez e atualiza a barra de cima. Se recusou, não grava.
function camaraProvarClique() {
  if (camaraOcupado) return;
  camaraOcupado = true;
  try {
    const botao = document.querySelector('.camara-botao');
    if (botao) botao.disabled = true;
    const r = camaraProvar(state, camaraDiaDeHoje());
    if (r.ok) {
      saveState(state);
      updateStatsDisplays();
      camaraResultado = { rep: r.reputacaoGanha, bonus: r.bonus };
      if (typeof vibrar === 'function') vibrar('sucesso');
      if (typeof tocarSom === 'function') tocarSom('objetivoCumprido');
    }
  } finally {
    camaraOcupado = false;
  }
  camaraDesenhar();
}
