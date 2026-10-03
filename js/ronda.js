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
// meia-noite de Lisboa (ver gerarObjetivosDoDia() em js/objetivos.js).
// Chamada em goTo('quinta') (js/main.js), só se nenhuma história de nível
// nem festa de capítulo apareceu nessa visita.
//
// Teste (não escreve nada no estado): ?pedido=chizo mostra o pedido e
// ?pedido=chizo-volta mostra o regresso com a curiosidade.
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

// 'fora' (em ronda), 'volta' (já pode regressar), 'espera' (2.ª ronda ainda
// não), 'fim' (as duas feitas) ou 'pedido' (há uma ronda para pedir).
function rondaChizoFase(agora) {
  const r = rondaChizoEstado();
  if (typeof r.saidaEm === 'number') return agora >= r.fimEm ? 'volta' : 'fora';
  if (r.feitas >= RONDA_CHIZO_CONFIG.rondasPorDia) return 'fim';
  if (r.feitas >= 1 && agora < (r.ultimoFimEm || 0) + RONDA_CHIZO_CONFIG.esperaEntreRondasMs) return 'espera';
  return 'pedido';
}

// Curiosidade: o texto de uma entrada da Enciclopédia (só as que não são
// "manual" nem de estação, todas curtas). Escolha estável para o mesmo dia e
// a mesma ronda, para não mudar se o jogador voltar a abrir a Quinta.
function rondaChizoCuriosidade(indice) {
  const lista = encyclopediaEntries().filter(function (e) { return !e.manual && !e.estacao; });
  if (lista.length === 0) return '';
  const semente = diaLisboaDeHoje() + '#' + indice;
  let h = 0;
  for (let i = 0; i < semente.length; i++) h = (h * 31 + semente.charCodeAt(i)) >>> 0;
  return lista[h % lista.length].texto;
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

function rondaChizoDarMeiaTaca() {
  if (rondaChizoFase(Date.now()) !== 'volta') { rondaChizoEsconderCartao(); return; } // só dá uma vez
  const r = rondaChizoEstado();
  const cfg = RONDA_CHIZO_CONFIG;
  state.reputacao += cfg.recompensaReputacao;
  state.gotas += cfg.recompensaGotas;
  r.feitas += 1;
  r.ultimoFimEm = r.fimEm;
  r.saidaEm = null;
  r.fimEm = null;
  saveState(state);
  rondaChizoEsconderCartao();
  mostrarFalas([t('ronda.obrigado').replace('{rep}', cfg.recompensaReputacao).replace('{gotas}', cfg.recompensaGotas)], cfg.falante);
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
  else rondaChizoEsconderCartao(); // modo de teste: só fecha, sem escrever nada
}

// Modo de teste: ?pedido=chizo ou ?pedido=chizo-volta. NÃO ESCREVE NADA.
function rondaChizoTeste() {
  let valor;
  try { valor = new URLSearchParams(location.search).get('pedido'); } catch (e) { return false; }
  if (valor === 'chizo') { rondaChizoMostrarPedido('teste'); return true; }
  if (valor === 'chizo-volta') { rondaChizoMostrarVolta(0, 'teste'); return true; }
  return false;
}
