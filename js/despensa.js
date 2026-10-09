// ---------------------------------------------------------------------
// DESPENSA DA ESTRADA — funções sobre state.despensa (Nível 7, PR 3 e PR 5A).
//
// PR 5A: regras e contas das trocas (despensaTrocar). PR 5C: oferecer um bem a uma visita
// (despensaOferecer). Sem gotas, sem castigos (recusar não tira nada) e sem gravar: quem chama grava.
//
// state.despensa (ver defaultState() em js/state.js):
//   recebidos      { idBem: n }        unidades já recebidas (só sobe)
//   entregues      { idBem: n }        unidades já entregues (só sobe)
//   primeiraTroca  { idBem: 'AAAA-MM-DD' }  dia (Lisboa) da 1.ª troca desse bem
//   hoje           { dia, feitas: { idVizinho: true } }  vizinhos com quem já trocou hoje
//   ofertaDia      'AAAA-MM-DD' (PR 5C)   dia (Lisboa) da última oferta a uma visita; sem o campo, nunca ofereceu.
//                                      NÃO fica em state.visitas.hoje (visitaFazerHoje reescreve esse objeto).
//   garrafasDadas  n (PR 5A)           garrafas dadas nas "provas" (só sobe). Não está no defaultState:
//                                      um save sem o campo conta 0 e o mergeDeep e a despensaEstado
//                                      mantêm-no/reparam-no. NUNCA se mexe em state.garrafas nem em
//                                      state.adega.historico: as garrafas disponíveis são
//                                      state.garrafas - garrafasDadas (ver despensaGarrafasDisponiveis).
//
// O que o jogador tem de um bem é recebidos menos entregues (nunca abaixo de 0).
//
// Os dados dos vizinhos, dos bens e as regras das trocas vêm de js/estrada-dados.js
// (ESTRADA_VIZINHOS, ESTRADA_BENS, ESTRADA_TROCA, ESTRADA_PEDIDOS). O dia chega sempre por
// argumento, 'AAAA-MM-DD' no calendário de Lisboa, como o devolve diaLisboaDeHoje() (js/tempo.js) e
// como js/visitas.js o usa: nada aqui lê o relógio nem sorteia (sem Date.now nem Math.random).
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

// ---------------------------------------------------------------------
// TROCAS (PR 5A). Só regras e contas: nenhum ecrã chama isto ainda.
// ---------------------------------------------------------------------

// Mesmo tipo de hash do cadernoHash() (js/caderno.js) e do visitasHash() (js/visitas.js).
function despensaHash(semente) {
  let h = 0;
  for (let i = 0; i < semente.length; i++) h = (h * 31 + semente.charCodeAt(i)) >>> 0;
  return h;
}

// Garrafas que o jogador ainda pode dar: state.garrafas menos as já dadas, nunca abaixo de 0.
// Só lê (nunca altera o estado, nem state.garrafas nem o historico).
function despensaGarrafasDisponiveis(estado) {
  if (!estado || typeof estado !== 'object') return 0;
  const d = estado.despensa;
  const dadas = (d && typeof d === 'object') ? despensaInteiroValido(d.garrafasDadas) : 0;
  return Math.max(0, despensaInteiroValido(estado.garrafas) - dadas);
}

// O que o vizinho pede neste dia: 'uvas', 'sal_sado' ou 'bagaceira' (ver ESTRADA_PEDIDOS: a Dona Amélia varia entre uvas e sal e o Sr. Armindo
// entre uvas, sal e bagaceira).
// Escolhido pelo hash de (dia + ':' + id do vizinho): igual nas 3 línguas e estável o dia todo.
// Sem vizinho, sem lista de pedidos ou com um dia inválido, pede 'uvas'.
function despensaPedidoDoDia(vizinho, dia) {
  const v = typeof vizinho === 'string' ? despensaVizinhoPorId(vizinho) : vizinho;
  if (!v || typeof v.id !== 'string' || typeof dia !== 'string' || !DESPENSA_DIA_REGEX.test(dia)) return 'uvas';
  const lista = typeof ESTRADA_PEDIDOS !== 'undefined' && despensaTemChave(ESTRADA_PEDIDOS, v.id) ? ESTRADA_PEDIDOS[v.id] : null;
  if (!Array.isArray(lista) || lista.length === 0) return 'uvas';
  return lista[despensaHash(dia + ':' + v.id) % lista.length];
}

// Bagaceiras que o jogador tem (adega.bagaceira do estado, ver js/alambique.js), só lendo: valores estranhos (negativos, em falta, texto) contam
// como 0 e nada se repara aqui. Sem js/alambique.js carregado conta 0 (o pedido cai nas uvas).
function despensaBagaceiras(estado) {
  const a = estado && typeof estado === 'object' ? estado.adega : null;
  if (!a || typeof a !== 'object' || Array.isArray(a) || typeof alambiqueNumero !== 'function') return 0;
  return alambiqueNumero(a.bagaceira);
}

// O último dia (Lisboa) registado, só lendo: o maior entre hoje.dia e as datas de primeiraTroca.
// null se nunca houve nenhuma troca.
function despensaUltimoDiaRegistado(estado) {
  const d = estado && estado.despensa;
  if (!d || typeof d !== 'object') return null;
  let ultimo = null;
  const ver = function (dia) {
    if (typeof dia === 'string' && DESPENSA_DIA_REGEX.test(dia) && (ultimo === null || dia > ultimo)) ultimo = dia;
  };
  if (d.hoje && typeof d.hoje === 'object') ver(d.hoje.dia);
  if (d.primeiraTroca && typeof d.primeiraTroca === 'object') Object.keys(d.primeiraTroca).forEach(function (k) { ver(d.primeiraTroca[k]); });
  return ultimo;
}

// Faz uma troca do dia "dia" com o vizinho "vizinhoId", tudo de uma vez. Devolve
//   { ok, motivo, pagou: 'garrafa' | 'uvas' | 'sal' | 'bagaceira' | null, uvasGastas, bem, reputacaoGanha, primeiraVez }
//
// VALIDA TUDO antes de alterar QUALQUER coisa, por esta ordem (o 1.º que falhar é o motivo):
//   'estado_invalido'  o estado não é um objeto
//   'id_invalido'      o vizinho não existe
//   'dia_invalido'     o dia não é 'AAAA-MM-DD'
//   'dia_anterior'     o dia é anterior ao último dia registado (relógio atrás)
//   'ja_hoje'          já trocou hoje com este vizinho
//   'teto_dia'         já fez ESTRADA_TROCA.trocasPorDiaTeto trocas hoje (no total)
//   'prateleira_cheia' já tem ESTRADA_TROCA.prateleiraMaxima desse bem (não cobra nada)
//   'faltam_uvas'      tem de pagar em uvas e ficaria com menos de uvasMinimasDepoisDaTroca
// Recusar NUNCA altera nada (nem repara o estado). Pagamento:
//   1.ª troca desse bem (primeiraTroca[bem] ainda não existe), a "prova": 1 garrafa disponível se houver
//     (sobe despensa.garrafasDadas; state.garrafas e state.adega.historico ficam como estão), senão
//     custoUvas uvas; dá +reputacaoPrimeiraTroca de Reputação, só nesta vez.
//   trocas seguintes: se o pedido do dia (despensaPedidoDoDia) é 'sal_sado' e tem 1 sal na Despensa,
//     paga com 1 sal (despensaRegistarEntrega); se é 'bagaceira' e tem 1 Bagaceira (adega.bagaceira do estado), paga com 1 bagaceira
//     (a Despensa não muda); senão custoUvas uvas. Sem Reputação.
// Só depois de validar altera: o pagamento, o bem recebido, hoje, primeiraTroca e a Reputação.
// Não grava (quem chamar é que grava, uma vez, no fim) e não verifica a subida de nível (isso é
// feito por verificarSubidaNivel() ao entrar na Quinta, como com qualquer outra Reputação).
function despensaTrocar(estado, vizinhoId, dia) {
  const T = ESTRADA_TROCA;
  const recusa = function (motivo, bem) {
    return { ok: false, motivo: motivo, pagou: null, uvasGastas: 0, bem: bem || null, reputacaoGanha: 0, primeiraVez: false };
  };
  if (!estado || typeof estado !== 'object') return recusa('estado_invalido');
  const vizinho = despensaVizinhoPorId(vizinhoId);
  if (!vizinho || !despensaBemExiste(vizinho.bem)) return recusa('id_invalido');
  const bem = vizinho.bem;
  if (typeof dia !== 'string' || !DESPENSA_DIA_REGEX.test(dia)) return recusa('dia_invalido', bem);
  const ultimo = despensaUltimoDiaRegistado(estado);
  if (ultimo !== null && dia < ultimo) return recusa('dia_anterior', bem);

  // Trocas de hoje (só se o dia registado for este mesmo dia).
  const d = estado.despensa && typeof estado.despensa === 'object' ? estado.despensa : null;
  const h = d && d.hoje && typeof d.hoje === 'object' && d.hoje.dia === dia && d.hoje.feitas && typeof d.hoje.feitas === 'object' && !Array.isArray(d.hoje.feitas) ? d.hoje.feitas : {};
  if (despensaTemChave(h, vizinhoId)) return recusa('ja_hoje', bem);
  if (Object.keys(h).length >= T.trocasPorDiaTeto) return recusa('teto_dia', bem);
  if (despensaQuantos(estado, bem) >= T.prateleiraMaxima) return recusa('prateleira_cheia', bem);

  const primeiraVez = !(d && despensaTemChave(d.primeiraTroca, bem) && DESPENSA_DIA_REGEX.test(String(d.primeiraTroca[bem])));
  let pagou;
  if (primeiraVez && despensaGarrafasDisponiveis(estado) >= 1) pagou = 'garrafa';
  else if (!primeiraVez && despensaPedidoDoDia(vizinho, dia) === 'sal_sado' && despensaQuantos(estado, 'sal_sado') >= 1) pagou = 'sal';
  else if (!primeiraVez && despensaPedidoDoDia(vizinho, dia) === 'bagaceira' && despensaBagaceiras(estado) >= 1) pagou = 'bagaceira';
  else pagou = 'uvas';
  const uvas = typeof estado.uvas === 'number' && Number.isFinite(estado.uvas) ? estado.uvas : 0;
  if (pagou === 'uvas' && uvas - T.custoUvas < T.uvasMinimasDepoisDaTroca) return recusa('faltam_uvas', bem);

  // Tudo validado: altera. O bem recebido, hoje e primeiraTroca ficam a cargo de despensaRegistarTroca
  // (que repete as suas validações e, depois das de cima, não pode falhar).
  const r = despensaRegistarTroca(estado, vizinhoId, bem, dia);
  if (!r.ok) return recusa(r.motivo, bem);
  let uvasGastas = 0;
  if (pagou === 'garrafa') {
    const e = despensaEstado(estado);
    e.garrafasDadas = despensaInteiroValido(e.garrafasDadas) + 1;
  } else if (pagou === 'sal') {
    despensaRegistarEntrega(estado, 'sal_sado', 1);
  } else if (pagou === 'bagaceira') {
    const adega = alambiqueEstado(estado); // repara a bagaceira em memória e gasta 1 (só aqui, depois de validar tudo)
    adega.bagaceira -= 1;
  } else {
    estado.uvas = uvas - T.custoUvas;
    uvasGastas = T.custoUvas;
  }
  let reputacaoGanha = 0;
  if (primeiraVez) {
    reputacaoGanha = T.reputacaoPrimeiraTroca;
    estado.reputacao = (typeof estado.reputacao === 'number' && Number.isFinite(estado.reputacao) ? estado.reputacao : 0) + reputacaoGanha;
  }
  return { ok: true, motivo: null, pagou: pagou, uvasGastas: uvasGastas, bem: bem, reputacaoGanha: reputacaoGanha, primeiraVez: primeiraVez };
}

// ---------------------------------------------------------------------
// OFERTAS A UMA VISITA (PR 5C). Só regras e contas; o botão está em js/estrada.js.
// ---------------------------------------------------------------------

// O bem que se oferece: o de que há mais na Despensa (despensaQuantos); em caso de empate, pela ordem de
// ESTRADA_OFERTA.ordemEmpate (e, para bens fora dessa lista, pela ordem de ESTRADA_BENS). null se não houver
// nenhum. Só lê.
function despensaBemParaOferecer(estado) {
  if (typeof ESTRADA_BENS === 'undefined') return null;
  const ordem = ESTRADA_OFERTA.ordemEmpate;
  const lista = ESTRADA_BENS.map(function (b, i) {
    const pos = ordem.indexOf(b.id);
    return { id: b.id, n: despensaQuantos(estado, b.id), pos: pos === -1 ? ordem.length + i : pos };
  }).filter(function (x) { return x.n >= 1; });
  if (lista.length === 0) return null;
  lista.sort(function (a, b) { return b.n - a.n || a.pos - b.pos; });
  return lista[0].id;
}

// O dia (Lisboa) da última oferta, só lendo; null se nunca houve (ou se o campo for inválido).
function despensaOfertaDia(estado) {
  const d = estado && estado.despensa;
  const dia = d && typeof d === 'object' ? d.ofertaDia : null;
  return typeof dia === 'string' && DESPENSA_DIA_REGEX.test(dia) ? dia : null;
}

// Oferece 1 bem a uma visita no dia "dia". Devolve { ok, motivo, bem, reputacaoGanha }.
// VALIDA TUDO antes de alterar QUALQUER coisa, por esta ordem:
//   'estado_invalido'  o estado não é um objeto
//   'dia_invalido'     o dia não é 'AAAA-MM-DD'
//   'ja_ofereceu'      ofertaDia >= dia (já ofereceu hoje, ou o relógio está atrás da última oferta)
//   'sem_bens'         não há nenhum bem na Despensa
// Recusar NUNCA altera nada. Se ok: gasta 1 do bem escolhido (despensaRegistarEntrega: só sobe "entregues";
// "recebidos" e por isso o capítulo 7 não mudam), regista ofertaDia = dia e soma +ESTRADA_OFERTA.reputacao de
// Reputação (estado.reputacao += n, como as outras fontes). Não grava, não toca em garrafas nem no historico.
function despensaOferecer(estado, dia) {
  const recusa = function (motivo) { return { ok: false, motivo: motivo, bem: null, reputacaoGanha: 0 }; };
  if (!estado || typeof estado !== 'object') return recusa('estado_invalido');
  if (typeof dia !== 'string' || !DESPENSA_DIA_REGEX.test(dia)) return recusa('dia_invalido');
  const ultima = despensaOfertaDia(estado);
  if (ultima !== null && ultima >= dia) return recusa('ja_ofereceu');
  const bem = despensaBemParaOferecer(estado);
  if (bem === null) return recusa('sem_bens');

  const e = despensaEstado(estado);
  const r = despensaRegistarEntrega(estado, bem, 1);
  if (!r.ok) return recusa('sem_bens');
  e.ofertaDia = dia;
  const rep = ESTRADA_OFERTA.reputacao;
  estado.reputacao = (typeof estado.reputacao === 'number' && Number.isFinite(estado.reputacao) ? estado.reputacao : 0) + rep;
  return { ok: true, motivo: null, bem: bem, reputacaoGanha: rep };
}

// ---------------------------------------------------------------------
// MESA DA VINDIMA (Nível 8, tarefa do ecrã "O Lagar", ver js/lagar.js). Só regras e contas; o botão está em js/lagar.js.
// ---------------------------------------------------------------------

// O dia (Lisboa) da última mesa posta, só lendo (state.lagar.mesaDia); null se nunca houve (ou se o campo for inválido).
function despensaMesaDia(estado) {
  const l = estado && estado.lagar;
  const dia = l && typeof l === 'object' ? l.mesaDia : null;
  return typeof dia === 'string' && DESPENSA_DIA_REGEX.test(dia) ? dia : null;
}

// A receita é { bens: [{ bem: idDoBem, n: inteiro > 0 }, ...], reputacao: inteiro >= 0 }: lista não vazia, cada bem existe
// em ESTRADA_BENS e não se repete. Só lê.
function despensaReceitaValida(receita) {
  if (!receita || typeof receita !== 'object' || !Array.isArray(receita.bens) || receita.bens.length === 0) return false;
  if (!Number.isInteger(receita.reputacao) || receita.reputacao < 0) return false;
  const vistos = {};
  for (let i = 0; i < receita.bens.length; i++) {
    const b = receita.bens[i];
    if (!b || typeof b !== 'object' || !despensaBemExiste(b.bem) || !Number.isInteger(b.n) || b.n <= 0) return false;
    if (despensaTemChave(vistos, b.bem)) return false;
    vistos[b.bem] = true;
  }
  return true;
}

// Põe a mesa da vindima no dia "dia". Devolve { ok, motivo, faltam, reputacaoGanha, gastos }.
// VALIDA TUDO antes de alterar QUALQUER coisa, por esta ordem:
//   'estado_invalido'  o estado não é um objeto
//   'dia_invalido'     o dia não é 'AAAA-MM-DD'
//   'receita_invalida' a receita não tem a forma certa (ver despensaReceitaValida)
//   'dia_anterior'     o dia é anterior ao da última mesa (relógio atrás)
//   'ja_hoje'          mesaDia === dia (uma vez por dia; independente do "Pisar as uvas")
//   'faltam_bens'      falta stock de algum bem: "faltam" é a lista dos ids que faltam (despensaQuantos < n)
// Recusar NUNCA altera nada. Se ok: gasta n de cada bem (despensaRegistarEntrega: só sobe "entregues"; "recebidos" e por
// isso o capítulo 7 não mudam), regista state.lagar.mesaDia = dia e soma receita.reputacao de Reputação
// (estado.reputacao += n, como as outras fontes). Não grava (quem chamar é que grava, uma vez, no fim).
function despensaMesaVindima(estado, dia, receita) {
  const recusa = function (motivo, faltam) { return { ok: false, motivo: motivo, faltam: faltam || [], reputacaoGanha: 0, gastos: [] }; };
  if (!estado || typeof estado !== 'object') return recusa('estado_invalido');
  if (typeof dia !== 'string' || !DESPENSA_DIA_REGEX.test(dia)) return recusa('dia_invalido');
  if (!despensaReceitaValida(receita)) return recusa('receita_invalida');
  const ultima = despensaMesaDia(estado);
  if (ultima !== null && dia < ultima) return recusa('dia_anterior');
  if (ultima !== null && dia === ultima) return recusa('ja_hoje');
  const faltam = receita.bens.filter(function (b) { return despensaQuantos(estado, b.bem) < b.n; }).map(function (b) { return b.bem; });
  if (faltam.length > 0) return recusa('faltam_bens', faltam);

  // Tudo validado (e os bens da receita são todos diferentes): gasta cada um e só depois marca o dia e paga.
  const gastos = [];
  for (let i = 0; i < receita.bens.length; i++) {
    const b = receita.bens[i];
    const r = despensaRegistarEntrega(estado, b.bem, b.n);
    if (!r.ok) return recusa('faltam_bens', [b.bem]);
    gastos.push({ bem: b.bem, n: b.n });
  }
  if (!estado.lagar || typeof estado.lagar !== 'object' || Array.isArray(estado.lagar)) estado.lagar = { ultimoDia: null, dias: 0, mesaDia: null, assaltoDia: null };
  estado.lagar.mesaDia = dia;
  estado.reputacao = (typeof estado.reputacao === 'number' && Number.isFinite(estado.reputacao) ? estado.reputacao : 0) + receita.reputacao;
  return { ok: true, motivo: null, faltam: [], reputacaoGanha: receita.reputacao, gastos: gastos };
}
