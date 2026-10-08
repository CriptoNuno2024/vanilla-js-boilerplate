// ---------------------------------------------------------------------
// RONDA DO CHIZO — pedido do dia, só pontos (sem dinheiro nem tokens).
//
// Ao entrar na Quinta (nível 3 ou mais), o YoshiCat pede ao Chizo para ver
// se está tudo bem. O Chizo "sai em ronda" 30 minutos reais; na visita
// seguinte à Quinta, depois desses 30 min, conta UMA curiosidade (um texto
// já existente da Enciclopédia) e o jogador dá-lhe "meia taça" de ração
// (grátis): +2 Reputação e +2 gotas. Duas rondas por dia; a 2.ª só 4 horas
// depois de a 1.ª terminar. Sem castigos: quem não fizer não perde nada.
//
// O estado vive em state.objetivos.ronda, que se repõe com os objetivos à
// meia-noite de Lisboa (ver gerarObjetivosDoDia() em js/objetivos.js), MAS uma
// ronda que ficou a meio (Chizo ainda fora) passa para o dia novo, para quem
// abre o jogo só uma vez por dia também receber (ver rondaChizoReporDia()).
// Chamada em goTo('quinta') (js/main.js), só se nenhuma história de nível
// nem festa de capítulo apareceu nessa visita.
//
// Depois da meia taça o Chizo dá também a PISTA do dia dos porcos (só texto,
// ver js/assaltos.js).
//
// Teste (não escreve nada no estado): ?pedido=chizo mostra o pedido e
// ?pedido=chizo-volta mostra o regresso com a curiosidade; nesse modo o
// botão mostra o agradecimento e a pista (índice 0), também sem gravar.
// ?pista=vinha|adega|cave|nevoeiro|trovoada força o alvo da pista.
// ---------------------------------------------------------------------

const RONDA_CHIZO_CONFIG = {
  nivelMinimo: 3,
  duracaoMs: 30 * 60 * 1000,                // o Chizo fica 30 min em ronda
  esperaEntreRondasMs: 4 * 60 * 60 * 1000,  // 2.ª ronda: 4 h depois de a 1.ª terminar
  rondasPorDia: 2,
  recompensaReputacao: 2,
  recompensaGotas: 2,
  falante: 'Chizo'
};

// Ação do botão do cartão neste momento: 'mandar', 'meiaTaca' ou 'teste'.
let _rondaAcaoAtual = null;

function rondaChizoEstado() {
  garantirObjetivosDoDia();
  if (!state.objetivos.ronda || typeof state.objetivos.ronda !== 'object') {
    state.objetivos.ronda = { feitas: 0, saidaEm: null, fimEm: null, ultimoFimEm: null };
  }
  return state.objetivos.ronda;
}

// Quantas rondas já deram meia taça HOJE. Só lê (nunca grava, ao contrário de
// rondaChizoEstado(), que pode repor o dia); 0 se o dia não bate ou faltar algo.
function rondaChizoFeitasHoje() {
  try {
    const o = state.objetivos;
    if (!o || o.dia !== diaLisboaDeHoje() || !o.ronda || typeof o.ronda !== 'object') return 0;
    return Number.isFinite(o.ronda.feitas) && o.ronda.feitas > 0 ? o.ronda.feitas : 0;
  } catch (e) { return 0; }
}

// Estado da ronda para o dia novo (função pura, chamada por gerarObjetivosDoDia()
// em js/objetivos.js). feitas e ultimoFimEm repõem-se; saidaEm/fimEm só se
// mantêm se houver uma ronda a meio e válida: números finitos, fimEm depois de
// saidaEm, no máximo duracaoMs depois, não mais de 2 dias à frente de "agora"
// (relógio atrás: a fase fica "fora") nem há mais de 30 dias. Senão repõe-se tudo, como
// antes. Pagar limpa saidaEm, por isso a mesma ronda nunca paga duas vezes, e
// vários dias sem abrir deixam sempre uma só ronda pendente.
function rondaChizoReporDia(anterior, agora) {
  const nova = { feitas: 0, saidaEm: null, fimEm: null, ultimoFimEm: null };
  try {
    const a = anterior;
    if (!a || typeof a !== 'object') return nova;
    const dur = RONDA_CHIZO_CONFIG.duracaoMs;
    const maxIdadeMs = 30 * 24 * 60 * 60 * 1000;
    const maxFuturoMs = 2 * 24 * 60 * 60 * 1000;
    if (!Number.isFinite(a.saidaEm) || !Number.isFinite(a.fimEm) || !Number.isFinite(agora)) return nova;
    if (a.fimEm <= a.saidaEm || a.fimEm - a.saidaEm > dur) return nova;
    if (a.fimEm - agora > maxFuturoMs || agora - a.fimEm > maxIdadeMs) return nova;
    nova.saidaEm = a.saidaEm;
    nova.fimEm = a.fimEm;
  } catch (e) { /* dados estranhos: repõe-se */ }
  return nova;
}

// 'fora' (em ronda), 'volta' (já pode regressar), 'espera' (2.ª ronda ainda
// não), 'fim' (as duas feitas) ou 'pedido' (há uma ronda para pedir).
function rondaChizoFase(agora) {
  const r = rondaChizoEstado();
  if (typeof r.saidaEm === 'number') return agora >= r.fimEm ? 'volta' : 'fora';
  if (r.feitas >= RONDA_CHIZO_CONFIG.rondasPorDia) return 'fim';
  if (r.feitas >= 1 && agora < (r.ultimoFimEm || 0) + RONDA_CHIZO_CONFIG.esperaEntreRondasMs) return 'espera';
  return 'pedido';
}

// Mês (1 a 12) de um dia "YYYY-MM-DD" (o de diaLisboaDeHoje()); 0 se inválido.
function rondaChizoMesDoDia(dia) {
  const m = parseInt(String(dia).slice(5, 7), 10);
  return m >= 1 && m <= 12 ? m : 0;
}

// Candidatas à curiosidade: entradas que não são "manual" nem de estação e,
// se tiverem o campo opcional "meses" (ver js/explorar.js), só no(s) seu(s)
// mês(es). Função pura. Nunca devolve vazio havendo entradas: se o filtro
// por mês esvaziar a lista, ignora-se o campo "meses".
function rondaChizoCandidatas(entradas, mes) {
  const base = entradas.filter(function (e) { return !e.manual && !e.estacao; });
  const daEpoca = base.filter(function (e) { return !Array.isArray(e.meses) || e.meses.indexOf(mes) !== -1; });
  return daEpoca.length > 0 ? daEpoca : base;
}

// Escolha estável para o mesmo dia e a mesma ronda (semente = dia + índice).
// Função pura: o mês vem do próprio dia "YYYY-MM-DD".
function rondaChizoEscolher(entradas, dia, indice) {
  const lista = rondaChizoCandidatas(entradas, rondaChizoMesDoDia(dia));
  if (lista.length === 0) return '';
  const semente = dia + '#' + indice;
  let h = 0;
  for (let i = 0; i < semente.length; i++) h = (h * 31 + semente.charCodeAt(i)) >>> 0;
  return lista[h % lista.length].texto;
}

// Curiosidade: o texto de uma entrada da Enciclopédia, respeitando a época do
// ano (dia de Lisboa, o mesmo da semente). Estável para o mesmo dia e ronda.
function rondaChizoCuriosidade(indice) {
  return rondaChizoEscolher(encyclopediaEntries(), diaLisboaDeHoje(), indice);
}

function rondaChizoMostrarCartao(titulo, botao, acao) {
  const cartao = document.getElementById('app-pedido');
  if (!cartao) return;
  document.getElementById('pedido-label').textContent = t('ronda.label');
  document.getElementById('pedido-titulo').textContent = titulo;
  document.getElementById('pedido-botao').textContent = botao;
  _rondaAcaoAtual = acao;
  cartao.hidden = false;
  reposicionarFlutuantes();
}

function rondaChizoEsconderCartao() {
  const cartao = document.getElementById('app-pedido');
  if (cartao) cartao.hidden = true;
  _rondaAcaoAtual = null;
  reposicionarFlutuantes();
}

function rondaChizoMostrarPedido(acao) {
  mostrarFalas([t('ronda.pedido')], 'YoshiCat');
  rondaChizoMostrarCartao(t('ronda.tituloPedido'), t('ronda.btnMandar'), acao);
}

function rondaChizoMostrarVolta(indice, acao) {
  mostrarFalas([t('ronda.ponte') + ' ' + rondaChizoCuriosidade(indice)], RONDA_CHIZO_CONFIG.falante);
  rondaChizoMostrarCartao(t('ronda.tituloVolta'), t('ronda.btnMeiaTaca'), acao);
}

// Devolve true se mostrou o pedido ou o regresso nesta visita.
function rondaChizoAvaliar() {
  if (nivelPelaReputacao(state.reputacao) < RONDA_CHIZO_CONFIG.nivelMinimo) return false;
  const fase = rondaChizoFase(Date.now());
  if (fase === 'pedido') { rondaChizoMostrarPedido('mandar'); return true; }
  if (fase === 'volta') { rondaChizoMostrarVolta(rondaChizoEstado().feitas, 'meiaTaca'); return true; }
  return false; // 'fora', 'espera' ou 'fim': nada de novo
}

function rondaChizoMandar() {
  if (rondaChizoFase(Date.now()) !== 'pedido') { rondaChizoEsconderCartao(); return; }
  const r = rondaChizoEstado();
  const agora = Date.now();
  r.saidaEm = agora;
  r.fimEm = agora + RONDA_CHIZO_CONFIG.duracaoMs;
  saveState(state);
  rondaChizoEsconderCartao();
  mostrarFalas([t('ronda.saiu')], 'YoshiCat');
}

// Falas do agradecimento: [obrigado, pista do dia]. indice = nº da ronda
// ANTES de somar (0 ou 1). A pista só entra se js/assaltos.js existir e o
// texto estiver traduzido; senão fica só o agradecimento.
function rondaChizoFalasObrigado(indice) {
  const cfg = RONDA_CHIZO_CONFIG;
  const falas = [t('ronda.obrigado').replace('{rep}', cfg.recompensaReputacao).replace('{gotas}', cfg.recompensaGotas)];
  try {
    if (typeof alvoDosPorcosDoDia === 'function' && typeof textoDaPista === 'function') {
      const chave = textoDaPista(alvoDosPorcosDoDia(indice), indice);
      const pista = t(chave);
      if (pista && pista !== chave) falas.push(pista);
    }
  } catch (e) { /* sem pista, só o agradecimento */ }
  return falas;
}

function rondaChizoDarMeiaTaca() {
  if (rondaChizoFase(Date.now()) !== 'volta') { rondaChizoEsconderCartao(); return; } // só dá uma vez
  const r = rondaChizoEstado();
  const cfg = RONDA_CHIZO_CONFIG;
  const indice = r.feitas; // antes de somar: 0 na 1.ª ronda, 1 na 2.ª
  state.reputacao += cfg.recompensaReputacao;
  state.gotas += cfg.recompensaGotas;
  r.feitas += 1;
  r.ultimoFimEm = r.fimEm;
  r.saidaEm = null;
  r.fimEm = null;
  saveState(state);
  rondaChizoEsconderCartao();
  mostrarFalas(rondaChizoFalasObrigado(indice), cfg.falante);
  vibrar('sucesso');
  tocarSom('objetivoCumprido');
  updateStatsDisplays();
  if (typeof atualizarCartaoNivelQuinta === 'function') atualizarCartaoNivelQuinta();
  if (typeof atualizarResumoQuinta === 'function') atualizarResumoQuinta();
}

// Botão do cartão (onclick no index.html).
function rondaChizoBotao() {
  if (_rondaAcaoAtual === 'mandar') rondaChizoMandar();
  else if (_rondaAcaoAtual === 'meiaTaca') rondaChizoDarMeiaTaca();
  else { // modo de teste: agradecimento e pista (índice 0), sem escrever nada
    rondaChizoEsconderCartao();
    mostrarFalas(rondaChizoFalasObrigado(0), RONDA_CHIZO_CONFIG.falante);
  }
}

// Modo de teste: ?pedido=chizo ou ?pedido=chizo-volta. NÃO ESCREVE NADA.
function rondaChizoTeste() {
  let valor;
  try { valor = new URLSearchParams(location.search).get('pedido'); } catch (e) { return false; }
  if (valor === 'chizo') { rondaChizoMostrarPedido('teste'); return true; }
  if (valor === 'chizo-volta') { rondaChizoMostrarVolta(0, 'teste'); return true; }
  return false;
}
