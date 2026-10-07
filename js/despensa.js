// ---------------------------------------------------------------------
// DESPENSA DA ESTRADA — funções puras sobre state.despensa (Nível 7, PR 3).
//
// Este ficheiro NÃO está carregado no index.html e nada o usa: ao jogador
// não muda nada. Sem ecrã, sem nível 7, sem custos (uvas), sem Reputação e
// sem o teto diário de trocas — isso fica para o PR das trocas.
//
// state.despensa (ver defaultState() em js/state.js):
//   recebidos      { idBem: n }        unidades já recebidas (só sobe)
//   entregues      { idBem: n }        unidades já entregues (só sobe)
//   primeiraTroca  { idBem: 'AAAA-MM-DD' }  dia (Lisboa) da 1.ª troca desse bem
//   hoje           { dia, feitas: { idVizinho: true } }  vizinhos com quem já trocou hoje
//
// O que o jogador tem de um bem é recebidos menos entregues (nunca abaixo de 0).
//
// Os dados dos vizinhos e dos bens vêm de js/estrada-dados.js (ESTRADA_VIZINHOS,
// ESTRADA_BENS). O dia chega sempre por argumento, 'AAAA-MM-DD' no calendário de
// Lisboa, como o devolve diaLisboaDeHoje() (js/tempo.js) e como js/visitas.js o usa:
// nada aqui lê o relógio nem sorteia (sem Date.now nem Math.random).
// ---------------------------------------------------------------------

const DESPENSA_DIA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function despensaTemChave(objeto, chave) {
  return !!objeto && typeof objeto === 'object' && Object.prototype.hasOwnProperty.call(objeto, chave);
}

// Inteiro >= 0 (qualquer outra coisa, incluindo negativos, fracionados e texto, conta como 0).
function despensaInteiroValido(n) {
  return typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= Number.MAX_SAFE_INTEGER ? n : 0;
}

function despensaVizinhoPorId(id) {
  if (typeof id !== 'string' || typeof ESTRADA_VIZINHOS === 'undefined') return null;
  return ESTRADA_VIZINHOS.filter(function (v) { return v.id === id; })[0] || null;
}

function despensaBemExiste(id) {
  if (typeof id !== 'string' || typeof ESTRADA_BENS === 'undefined') return false;
  return ESTRADA_BENS.some(function (b) { return b.id === id; });
}

// Quantas unidades do bem tem: recebidos menos entregues, nunca abaixo de 0 (0 se nunca
// recebeu, se o id não existe ou se um valor guardado não é um inteiro >= 0). Só lê: nunca
// altera o estado.
function despensaQuantos(estado, bemId) {
  if (!despensaBemExiste(bemId)) return 0;
  const d = estado && estado.despensa;
  if (!d || typeof d !== 'object') return 0;
  const recebidos = despensaTemChave(d.recebidos, bemId) ? despensaInteiroValido(d.recebidos[bemId]) : 0;
  const entregues = despensaTemChave(d.entregues, bemId) ? despensaInteiroValido(d.entregues[bemId]) : 0;
  return Math.max(0, recebidos - entregues);
}

// state.despensa com a forma certa (uma nuvem ou um save estranho podem trazer null ou
// outro tipo): repara só em memória e devolve-o. Valores inválidos de recebidos viram 0.
function despensaEstado(estado) {
  let d = estado.despensa;
  if (!d || typeof d !== 'object' || Array.isArray(d)) d = estado.despensa = {};
  if (!d.recebidos || typeof d.recebidos !== 'object' || Array.isArray(d.recebidos)) d.recebidos = {};
  Object.keys(d.recebidos).forEach(function (k) { d.recebidos[k] = despensaInteiroValido(d.recebidos[k]); });
  if (!d.entregues || typeof d.entregues !== 'object' || Array.isArray(d.entregues)) d.entregues = {};
  Object.keys(d.entregues).forEach(function (k) { d.entregues[k] = despensaInteiroValido(d.entregues[k]); });
  if (!d.primeiraTroca || typeof d.primeiraTroca !== 'object' || Array.isArray(d.primeiraTroca)) d.primeiraTroca = {};
  if (!d.hoje || typeof d.hoje !== 'object' || Array.isArray(d.hoje)) d.hoje = { dia: null, feitas: {} };
  if (!d.hoje.feitas || typeof d.hoje.feitas !== 'object' || Array.isArray(d.hoje.feitas)) d.hoje.feitas = {};
  return d;
}

// Regista uma troca do dia "diaLisboa" com o vizinho "vizinhoId", que dá o seu bem "bemId".
//   - ids que não existem, ou um bem que não é o do vizinho: { ok: false, motivo: 'id_invalido' }
//   - dia que não seja 'AAAA-MM-DD':                          { ok: false, motivo: 'dia_invalido' }
//   - já trocou hoje com esse vizinho:                        { ok: false, motivo: 'ja_hoje' }
//   - senão soma 1 a recebidos[bemId], regista primeiraTroca[bemId] se ainda não havia,
//     marca o vizinho em hoje.feitas e devolve { ok: true, primeiraVez: true/false }.
// Se o dia mudou, hoje reinicia-se sozinho (dia novo, feitas vazias) antes de verificar.
// Nos casos inválidos não mexe em nada. Não cobra uvas, não dá Reputação, não grava
// (quem chamar é que grava) e não aplica nenhum teto diário de trocas.
function despensaRegistarTroca(estado, vizinhoId, bemId, diaLisboa) {
  const vizinho = despensaVizinhoPorId(vizinhoId);
  if (!vizinho || !despensaBemExiste(bemId) || vizinho.bem !== bemId) return { ok: false, motivo: 'id_invalido' };
  if (typeof diaLisboa !== 'string' || !DESPENSA_DIA_REGEX.test(diaLisboa)) return { ok: false, motivo: 'dia_invalido' };
  if (!estado || typeof estado !== 'object') return { ok: false, motivo: 'id_invalido' };

  const d = despensaEstado(estado);
  if (d.hoje.dia !== diaLisboa) d.hoje = { dia: diaLisboa, feitas: {} };
  if (despensaTemChave(d.hoje.feitas, vizinhoId)) return { ok: false, motivo: 'ja_hoje' };

  const antes = despensaInteiroValido(d.recebidos[bemId]);
  d.recebidos[bemId] = antes < Number.MAX_SAFE_INTEGER ? antes + 1 : antes;
  const primeiraVez = !(despensaTemChave(d.primeiraTroca, bemId) && DESPENSA_DIA_REGEX.test(String(d.primeiraTroca[bemId])));
  if (primeiraVez) d.primeiraTroca[bemId] = diaLisboa;
  d.hoje.feitas[vizinhoId] = true;
  return { ok: true, primeiraVez: primeiraVez };
}

// Regista a entrega de "n" unidades do bem "bemId" (tira-as da despensa).
//   - o bem não existe em ESTRADA_BENS:     { ok: false, motivo: 'id_invalido' }
//   - n não é um inteiro maior que 0:       { ok: false, motivo: 'n_invalido' }
//   - tem menos de n unidades:              { ok: false, motivo: 'sem_stock' }
//   - senão soma n a entregues[bemId] e devolve { ok: true }.
// Nos casos recusados não mexe em nada. Não paga nada em troca (sem uvas, sem Reputação)
// e não grava: quem chamar é que grava.
function despensaRegistarEntrega(estado, bemId, n) {
  if (!despensaBemExiste(bemId)) return { ok: false, motivo: 'id_invalido' };
  if (typeof n !== 'number' || !Number.isInteger(n) || n <= 0 || n > Number.MAX_SAFE_INTEGER) return { ok: false, motivo: 'n_invalido' };
  if (despensaQuantos(estado, bemId) < n) return { ok: false, motivo: 'sem_stock' };

  const d = despensaEstado(estado);
  d.entregues[bemId] = despensaInteiroValido(d.entregues[bemId]) + n;
  return { ok: true };
}
