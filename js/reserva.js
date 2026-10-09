// ---------------------------------------------------------------------
// PEQUENAS TAREFAS DIÁRIAS DOS NÍVEIS 5 E 6 — "Visitar a Reserva" (Cave de Reserva, nível 5) e "Arrumar a Coleção"
// (ecrã A Coleção, nível 6). No molde da Câmara (js/camara.js): uma vez por dia (dia em Lisboa), não gastam nada e dão
// um prémio pequeno de Reputação. Sem garrafas ou cores o botão fica apagado e o ecrã diz o que falta: nunca bloqueia
// mais nada.
//
//   Visitar a Reserva  — exige RESERVA_CONFIG.garrafasMinimas garrafa feita (state.garrafas); +RESERVA_CONFIG.reputacao.
//   Arrumar a Coleção  — exige COLECAO_TAREFA_CONFIG.coresMinimas cor já feita na Coleção (colecaoCoresFeitas() em
//                        js/garrafa.js, que só conta as garrafas feitas desde o nível 6); +COLECAO_TAREFA_CONFIG.reputacao.
//
// state.reserva = { visitaDia }   'AAAA-MM-DD' (Lisboa) da última visita; null = nunca
// state.colecao = { arrumouDia }  'AAAA-MM-DD' (Lisboa) da última arrumação; null = nunca
// (ver defaultState() em js/state.js; NÃO se juntam na nuvem, como state.camara e state.lagar).
//
// As regras são puras: o dia (e o número de cores) chega por argumento, nada lê o relógio nem sorteia, nada grava (quem
// chama grava, uma só vez, no clique). Não tocam nos capítulos 5 e 6 (que só leem adega.historico e a Coleção), no prémio
// da Reserva Especial nem em state.niveis.garrafasAoNivel6. Para mudar os valores: só as duas constantes abaixo.
// ---------------------------------------------------------------------

const RESERVA_CONFIG = {
  reputacao: 3,
  garrafasMinimas: 1,   // garrafas feitas (state.garrafas) que é preciso ter; nunca se gastam
  imagemResultado: 'assets/ecras/yoshi_cat_adega_balde.jpg'
};

const COLECAO_TAREFA_CONFIG = {
  reputacao: 4,
  coresMinimas: 1,      // cores já feitas na Coleção (de 4) que é preciso ter; nada se gasta
  imagemResultado: 'assets/garrafas/garrafa_4_cobre.jpg'
};

const RESERVA_DIA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function reservaInteiro(n) {
  return typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= Number.MAX_SAFE_INTEGER ? n : 0;
}

function reservaDiaValido(d) {
  return typeof d === 'string' && RESERVA_DIA_REGEX.test(d) ? d : null;
}

function reservaSomar(estado, n) {
  estado.reputacao = (typeof estado.reputacao === 'number' && Number.isFinite(estado.reputacao) ? estado.reputacao : 0) + n;
}

// Repara state.reserva / state.colecao em memória (uma nuvem ou um save estranho podem trazer null ou outro tipo).
function reservaEstado(estado) {
  let r = estado.reserva;
  if (!r || typeof r !== 'object' || Array.isArray(r)) r = estado.reserva = { visitaDia: null };
  r.visitaDia = reservaDiaValido(r.visitaDia);
  return r;
}

function colecaoTarefaEstado(estado) {
  let c = estado.colecao;
  if (!c || typeof c !== 'object' || Array.isArray(c)) c = estado.colecao = { arrumouDia: null };
  c.arrumouDia = reservaDiaValido(c.arrumouDia);
  return c;
}

// Só lê. Devolve { ok, motivo, faltam }:
//   motivo null | 'estado_invalido' | 'dia_invalido' | 'dia_anterior' | 'ja_hoje' | 'sem_garrafas'
function reservaPodeVisitar(estado, dia) {
  const recusa = function (motivo, faltam) { return { ok: false, motivo: motivo, faltam: faltam || 0 }; };
  if (!estado || typeof estado !== 'object') return recusa('estado_invalido');
  if (reservaDiaValido(dia) === null) return recusa('dia_invalido');
  const ultimo = reservaDiaValido(estado.reserva && typeof estado.reserva === 'object' ? estado.reserva.visitaDia : null);
  if (ultimo !== null && dia < ultimo) return recusa('dia_anterior');
  if (ultimo !== null && dia === ultimo) return recusa('ja_hoje');
  const garrafas = reservaInteiro(estado.garrafas);
  if (garrafas < RESERVA_CONFIG.garrafasMinimas) return recusa('sem_garrafas', RESERVA_CONFIG.garrafasMinimas - garrafas);
  return { ok: true, motivo: null, faltam: 0 };
}

// Visita a Reserva no dia "dia". Valida tudo antes de alterar; recusar nunca altera nada. Se ok: soma a Reputação e
// marca visitaDia. Não toca em mais nada (garrafas, uvas, gotas, historico). Devolve { ok, motivo, reputacaoGanha }. Não grava.
function reservaVisitar(estado, dia) {
  const p = reservaPodeVisitar(estado, dia);
  if (!p.ok) return { ok: false, motivo: p.motivo, reputacaoGanha: 0 };
  const r = reservaEstado(estado);
  reservaSomar(estado, RESERVA_CONFIG.reputacao);
  r.visitaDia = dia;
  return { ok: true, motivo: null, reputacaoGanha: RESERVA_CONFIG.reputacao };
}

// Só lê. "cores" = quantas das 4 cores da Coleção já estão feitas (o chamador conta-as com colecaoCoresFeitas()).
//   motivo null | 'estado_invalido' | 'dia_invalido' | 'dia_anterior' | 'ja_hoje' | 'sem_cores'
function colecaoPodeArrumar(estado, dia, cores) {
  const recusa = function (motivo) { return { ok: false, motivo: motivo }; };
  if (!estado || typeof estado !== 'object') return recusa('estado_invalido');
  if (reservaDiaValido(dia) === null) return recusa('dia_invalido');
  const ultimo = reservaDiaValido(estado.colecao && typeof estado.colecao === 'object' ? estado.colecao.arrumouDia : null);
  if (ultimo !== null && dia < ultimo) return recusa('dia_anterior');
  if (ultimo !== null && dia === ultimo) return recusa('ja_hoje');
  if (reservaInteiro(cores) < COLECAO_TAREFA_CONFIG.coresMinimas) return recusa('sem_cores');
  return { ok: true, motivo: null };
}

// Arruma a Coleção no dia "dia". Valida tudo antes de alterar; recusar nunca altera nada. Se ok: soma a Reputação e
// marca arrumouDia. Não toca em mais nada (garrafas, uvas, gotas, historico, garrafasAoNivel6). Não grava.
function colecaoArrumar(estado, dia, cores) {
  const p = colecaoPodeArrumar(estado, dia, cores);
  if (!p.ok) return { ok: false, motivo: p.motivo, reputacaoGanha: 0 };
  const c = colecaoTarefaEstado(estado);
  reservaSomar(estado, COLECAO_TAREFA_CONFIG.reputacao);
  c.arrumouDia = dia;
  return { ok: true, motivo: null, reputacaoGanha: COLECAO_TAREFA_CONFIG.reputacao };
}

// ---------------------------------------------------------------------
// ECRÃS (o botão da Cave de Reserva está dentro de reservaHtml() em js/garrafa.js; o da Coleção em renderColecao())
// ---------------------------------------------------------------------

let reservaOcupado = false;
let colecaoArrumarOcupado = false;
let colecaoResultado = null; // { rep } ou null: só em memória, esquece-se ao entrar no ecrã (ver renderColecao())

function reservaDiaDeHoje() {
  return diaLisboaDeHoje();
}

function colecaoContarCores() {
  const c = colecaoCoresFeitas(state);
  return Object.keys(c).filter(function (k) { return c[k] === true; }).length;
}

// O botão da tarefa dentro da Cave de Reserva (logo a seguir a "Ver a Coleção", para se ver sem deslizar o cartão): se
// estiver apagado, diz ao lado o que falta. Só lê, não grava.
function reservaBotaoHtml() {
  const p = reservaPodeVisitar(state, reservaDiaDeHoje());
  let motivo = '';
  if (p.motivo === 'sem_garrafas') motivo = t('reserva.semGarrafas');
  else if (p.motivo === 'ja_hoje') motivo = t('reserva.jaHoje');
  else if (p.motivo === 'dia_anterior') motivo = t('reserva.relogio');
  return '<button type="button" class="btn-pill pill-main reserva-visita-botao" onclick="reservaVisitarClique()"' + (p.ok ? '' : ' disabled') + '>' +
    '<span>' + t('reserva.btn') + '</span>' + (motivo ? '<span class="cooldown-suffix"> (' + motivo + ')</span>' : '') + '</button>';
}

// O texto da tarefa, no fim do bloco da Reserva (o que ganha e quando).
function reservaDescHtml() {
  return '<p class="phase-desc">' + t('reserva.desc').replace('{rep}', RESERVA_CONFIG.reputacao) + '</p>';
}

// O ÚNICO sítio que regista a visita e grava. Toque no botão: desativa-o logo (clique duplo), visita (reservaVisitar) e,
// se correu bem, grava UMA vez, atualiza a barra de cima e mostra o agradecimento e a imagem no ecrã da Adega.
function reservaVisitarClique() {
  if (reservaOcupado) return;
  reservaOcupado = true;
  try {
    const botao = document.querySelector('.reserva-visita-botao');
    if (botao) botao.disabled = true;
    const r = reservaVisitar(state, reservaDiaDeHoje());
    if (r.ok) {
      saveState(state);
      updateStatsDisplays();
      adegaFotoAtual = RESERVA_CONFIG.imagemResultado;
      adegaMensagemAtual = t('reserva.ok').replace('{rep}', r.reputacaoGanha);
      if (typeof vibrar === 'function') vibrar('sucesso');
      if (typeof tocarSom === 'function') tocarSom('objetivoCumprido');
    }
  } finally {
    reservaOcupado = false;
  }
  renderAdega();
}

// O botão da tarefa no ecrã da Coleção (só lê): rótulo e, se apagado, o que falta ao lado.
function colecaoTarefaBotaoHtml() {
  const p = colecaoPodeArrumar(state, reservaDiaDeHoje(), colecaoContarCores());
  let motivo = '';
  if (p.motivo === 'sem_cores') motivo = t('colecao.arrumarSemCores');
  else if (p.motivo === 'ja_hoje') motivo = t('colecao.arrumarJaHoje');
  else if (p.motivo === 'dia_anterior') motivo = t('colecao.arrumarRelogio');
  return '<button type="button" class="btn-pill colecao-arrumar-botao" onclick="colecaoArrumarClique()"' + (p.ok ? '' : ' disabled') + '>' +
    '<span>' + t('colecao.arrumarBtn') + '</span>' + (motivo ? '<span class="cooldown-suffix"> (' + motivo + ')</span>' : '') + '</button>';
}

// O ÚNICO sítio que arruma e grava (só uma vez, clique duplo protegido). Se recusou, não grava.
function colecaoArrumarClique() {
  if (colecaoArrumarOcupado) return;
  colecaoArrumarOcupado = true;
  try {
    const botao = document.querySelector('.colecao-arrumar-botao');
    if (botao) botao.disabled = true;
    const r = colecaoArrumar(state, reservaDiaDeHoje(), colecaoContarCores());
    if (r.ok) {
      saveState(state);
      updateStatsDisplays();
      colecaoResultado = { rep: r.reputacaoGanha };
      if (typeof vibrar === 'function') vibrar('sucesso');
      if (typeof tocarSom === 'function') tocarSom('objetivoCumprido');
    }
  } finally {
    colecaoArrumarOcupado = false;
  }
  renderColecaoDesenhar();
}
