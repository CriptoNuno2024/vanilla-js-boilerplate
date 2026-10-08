#!/usr/bin/env node
// Estado e funções da Despensa da Estrada (PR 3): state.despensa em js/state.js e
// despensaQuantos / despensaRegistarTroca em js/despensa.js. Corre o state.js, o
// estrada-dados.js e o despensa.js REAIS num ambiente simulado (vm), sem browser nem conta
// real. Confirma também que o despensa.js é puro (sem Math.random nem Date.now) e que no
// jogo só é carregado e lido (despensaQuantos no ecrã da Estrada): sem trocas, sem entregas.
//
// Uso: node scripts/verificar-despensa.js
// DESPENSA_JS=caminho  corre sobre outra versão de js/despensa.js (para provar que os testes
//   apanham a falta da regra "1 troca por vizinho por dia", do reinício do dia ou da pureza).
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const DESPENSA_JS = process.env.DESPENSA_JS || path.join(RAIZ, 'js', 'despensa.js');
const ler = function (f) { return fs.readFileSync(f, 'utf8'); };
let falhas = 0;
function ok(cond, msg) { if (!cond) { falhas++; console.log('FALHA: ' + msg); } }

// Jogo simulado com o state.js REAL. guardadoInicial = save antigo (ou undefined).
function abrir(guardadoInicial) {
  const guardado = {};
  if (guardadoInicial) guardado.yoshicat_quinta_state_v2 = JSON.stringify(guardadoInicial);
  const sb = {
    console: { log() {}, warn() {}, error() {} },
    localStorage: {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(guardado, k) ? guardado[k] : null; },
      setItem: function (k, v) { guardado[k] = String(v); },
      removeItem: function (k) { delete guardado[k]; }
    },
    location: { search: '' },
    URLSearchParams: URLSearchParams,
    document: { querySelectorAll: function () { return []; }, getElementById: function () { return null; }, addEventListener: function () {} },
    setTimeout: function () {}, Image: function () {}, Date: Date
  };
  sb.window = sb;
  sb.Telegram = { WebApp: {} };
  const cx = vm.createContext(sb);
  vm.runInContext(ler(path.join(RAIZ, 'js', 'state.js')), cx, { filename: 'state.js' });
  const g = { cx: cx, guardado: guardado };
  g.ev = function (c) { return vm.runInContext(c, cx); };
  return g;
}

// Ambiente PURO: só estrada-dados.js e despensa.js, com Math.random e Date.now proibidos.
const PURO = vm.createContext({});
vm.runInContext('Math.random = function () { throw new Error("Math.random proibido"); }; Date.now = function () { throw new Error("Date.now proibido"); };', PURO);
vm.runInContext(ler(path.join(RAIZ, 'js', 'estrada-dados.js')), PURO, { filename: 'estrada-dados.js' });
vm.runInContext(ler(DESPENSA_JS), PURO, { filename: 'despensa.js' });
PURO.__estado = null;
const quantos = function (estado, bem) { PURO.__e = estado; PURO.__b = bem; return vm.runInContext('despensaQuantos(__e, __b)', PURO); };
const trocar = function (estado, viz, bem, dia) {
  PURO.__e = estado; PURO.__v = viz; PURO.__b = bem; PURO.__d = dia;
  return JSON.parse(JSON.stringify(vm.runInContext('despensaRegistarTroca(__e, __v, __b, __d)', PURO)));
};
const J = function (o) { return JSON.stringify(o); };
const clone = function (o) { return JSON.parse(JSON.stringify(o)); };
const VAZIA = { recebidos: {}, entregues: {}, primeiraTroca: {}, hoje: { dia: null, feitas: {} } };
const entregar = function (estado, bem, n) { PURO.__e = estado; PURO.__b = bem; PURO.__n = n; return JSON.parse(JSON.stringify(vm.runInContext('despensaRegistarEntrega(__e, __b, __n)', PURO))); };

// 1. Campo por omissão, save antigo e estado da nuvem.
{
  const g = abrir();
  ok(J(clone(g.ev('defaultState().despensa'))) === J(VAZIA), 'defaultState devia ter despensa = ' + J(VAZIA));
  ok(J(clone(g.ev('state.despensa'))) === J(VAZIA), 'um jogo novo devia começar com a despensa vazia');
  ok(J(Object.keys(clone(g.ev('state.despensa')))) === J(['recebidos', 'entregues', 'primeiraTroca', 'hoje']), 'a despensa devia ter os campos recebidos, entregues, primeiraTroca e hoje');

  // Save antigo (sem o campo): ganha-o vazio e mantém o resto.
  const antigo = clone(g.ev('state')); delete antigo.despensa;
  antigo.reputacao = 150; antigo.uvas = 99; antigo.ultimaGravacaoEm = 1;
  const a = abrir(antigo);
  ok(J(clone(a.ev('state.despensa'))) === J(VAZIA), 'save antigo devia ficar com a despensa vazia (mergeDeep)');
  ok(a.ev('state.reputacao') === 150 && a.ev('state.uvas') === 99, 'o save antigo devia manter o resto do progresso');
  const semDespensa = clone(a.ev('state')); delete semDespensa.despensa;
  ok(J(semDespensa) === J(antigo), 'além da despensa, o save antigo devia carregar igual');

  // Save com despensa: mantém-se tal e qual.
  const comDespensa = clone(antigo);
  comDespensa.despensa = { recebidos: { queijo_azeitao: 2 }, entregues: { queijo_azeitao: 1 }, primeiraTroca: { queijo_azeitao: '2026-10-01' }, hoje: { dia: '2026-10-05', feitas: { dona_amelia: true } } };
  const b = abrir(comDespensa);
  ok(J(clone(b.ev('state.despensa'))) === J(comDespensa.despensa), 'um save com despensa devia carregar igual');
  // Despensa parcial (só recebidos): o resto completa-se por omissão.
  const parcial = clone(antigo); parcial.despensa = { recebidos: { sal_sado: 1 } };
  const p = abrir(parcial);
  ok(J(clone(p.ev('state.despensa'))) === J({ recebidos: { sal_sado: 1 }, entregues: {}, primeiraTroca: {}, hoje: { dia: null, feitas: {} } }), 'despensa parcial devia completar-se por omissão');
  // Save da versão anterior da despensa (sem "entregues"): ganha entregues vazio e mantém o resto.
  const semEntregues = clone(antigo);
  semEntregues.despensa = { recebidos: { queijo_azeitao: 2 }, primeiraTroca: { queijo_azeitao: '2026-10-01' }, hoje: { dia: '2026-10-05', feitas: { dona_amelia: true } } };
  const q = abrir(semEntregues);
  ok(J(clone(q.ev('state.despensa'))) === J({ recebidos: { queijo_azeitao: 2 }, entregues: {}, primeiraTroca: { queijo_azeitao: '2026-10-01' }, hoje: { dia: '2026-10-05', feitas: { dona_amelia: true } } }), 'save com despensa sem "entregues" devia ganhar entregues vazio e manter o resto');
  ok(J(clone(g.ev('mergeDeep(defaultState(), { despensa: { recebidos: { sal_sado: 4 } } }).despensa.entregues'))) === '{}', 'estado da nuvem sem "entregues" devia ficar com entregues vazio');

  // Como a nuvem adota o estado: mergeDeep(defaultState(), estadoNuvem), sem migração.
  ok(J(clone(g.ev('mergeDeep(defaultState(), { reputacao: 5 }).despensa'))) === J(VAZIA), 'estado da nuvem sem despensa devia ficar com a despensa vazia');
  ok(J(clone(g.ev('mergeDeep(defaultState(), { despensa: { recebidos: { mel_sesimbra: 3 } } }).despensa.recebidos'))) === J({ mel_sesimbra: 3 }), 'estado da nuvem com despensa devia manter os recebidos');

  // "Apagar o meu progresso" remove a chave do estado: o jogo volta a abrir com a despensa vazia.
  const perfil = ler(path.join(RAIZ, 'js', 'perfil.js'));
  ok(/localStorage\.removeItem\(STORAGE_KEY\)/.test(perfil) && /nuvemApagarTudo\(/.test(perfil), 'perfilApagarTudo devia apagar o estado inteiro (STORAGE_KEY e a nuvem)');
  const c = abrir(comDespensa);
  c.ev('localStorage.removeItem("yoshicat_quinta_state_v2")');
  ok(J(clone(c.ev('loadState().despensa'))) === J(VAZIA), 'depois de apagar o estado, o jogo devia abrir com a despensa vazia');
}

// 2. despensaQuantos.
{
  ok(quantos(clone({ despensa: VAZIA }), 'queijo_azeitao') === 0, 'quantos sem trocas devia ser 0');
  ok(quantos({}, 'queijo_azeitao') === 0 && quantos(null, 'queijo_azeitao') === 0 && quantos(undefined, 'sal_sado') === 0, 'quantos com estado vazio ou sem despensa devia ser 0');
  const e = { despensa: { recebidos: { queijo_azeitao: 3, sal_sado: -2, mel_sesimbra: 1.5, outro: 7 }, primeiraTroca: {}, hoje: { dia: null, feitas: {} } } };
  ok(quantos(e, 'queijo_azeitao') === 3, 'quantos devia devolver os recebidos');
  ok(quantos(e, 'sal_sado') === 0, 'um valor negativo devia contar 0');
  ok(quantos(e, 'mel_sesimbra') === 0, 'um valor fracionado devia contar 0');
  ok(quantos(e, 'outro') === 0 && quantos(e, 'nao_existe') === 0 && quantos(e, null) === 0 && quantos(e, '__proto__') === 0 && quantos(e, 'constructor') === 0, 'ids que não existem devia dar 0');
  const antes = J(e); quantos(e, 'queijo_azeitao');
  ok(J(e) === antes, 'quantos nunca devia alterar o estado');
  // recebidos menos entregues, nunca abaixo de 0.
  const f = { despensa: { recebidos: { queijo_azeitao: 5, sal_sado: 2, mel_sesimbra: 3 }, entregues: { queijo_azeitao: 2, sal_sado: 9, mel_sesimbra: -4 }, primeiraTroca: {}, hoje: { dia: null, feitas: {} } } };
  ok(quantos(f, 'queijo_azeitao') === 3, 'quantos devia ser recebidos menos entregues (5 - 2 = 3)');
  ok(quantos(f, 'sal_sado') === 0, 'entregues acima de recebidos nunca devia dar abaixo de 0');
  ok(quantos(f, 'mel_sesimbra') === 3, 'um entregues negativo devia contar 0');
  ok(quantos({ despensa: { recebidos: { sal_sado: 2 }, entregues: { sal_sado: 1.5 } } }, 'sal_sado') === 2, 'um entregues fracionado devia contar 0');
  ok(quantos({ despensa: { recebidos: { sal_sado: 2 } } }, 'sal_sado') === 2, 'sem entregues devia contar tudo o que recebeu');
  ok(quantos({ despensa: { recebidos: { sal_sado: 2 }, entregues: [] } }, 'sal_sado') === 2, 'entregues com o tipo errado devia contar 0');
}

// 2b. despensaRegistarEntrega: com stock, sem stock, n inválido, bem inválido.
{
  const e = { despensa: clone(VAZIA), reputacao: 10, uvas: 100, gotas: 5 };
  trocar(e, 'dona_amelia', 'queijo_azeitao', '2026-10-07'); trocar(e, 'dona_amelia', 'queijo_azeitao', '2026-10-08'); trocar(e, 'dona_amelia', 'queijo_azeitao', '2026-10-09');
  ok(quantos(e, 'queijo_azeitao') === 3, 'premissa: 3 queijos');
  // Com stock.
  ok(J(entregar(e, 'queijo_azeitao', 1)) === J({ ok: true }), 'entregar 1 com stock devia dar { ok: true }');
  ok(quantos(e, 'queijo_azeitao') === 2 && e.despensa.entregues.queijo_azeitao === 1 && e.despensa.recebidos.queijo_azeitao === 3, 'depois de entregar 1: tem 2, entregues 1, recebidos 3');
  ok(J(entregar(e, 'queijo_azeitao', 2)) === J({ ok: true }), 'entregar tudo o que tem (n = stock) devia ser aceite');
  ok(quantos(e, 'queijo_azeitao') === 0 && e.despensa.entregues.queijo_azeitao === 3, 'depois de entregar tudo: tem 0, entregues 3');
  // Sem stock: recusado e nada muda.
  let antes = J(e);
  ok(J(entregar(e, 'queijo_azeitao', 1)) === J({ ok: false, motivo: 'sem_stock' }), 'entregar sem stock devia dar sem_stock');
  ok(J(entregar(e, 'sal_sado', 1)) === J({ ok: false, motivo: 'sem_stock' }), 'entregar um bem que nunca recebeu devia dar sem_stock');
  ok(J(e) === antes, 'a entrega sem stock não devia mudar nada');
  trocar(e, 'sr_joaquim', 'sal_sado', '2026-10-09'); // 1 sal
  antes = J(e);
  ok(J(entregar(e, 'sal_sado', 2)) === J({ ok: false, motivo: 'sem_stock' }), 'entregar mais do que tem devia dar sem_stock (2 com 1)');
  ok(J(e) === antes, 'entregar mais do que tem não devia mudar nada');
  // n inválido: 0, negativo, fração, texto, etc. (mesmo havendo stock).
  [0, -1, -5, 0.5, 1.5, 2.0000001, NaN, Infinity, -Infinity, '1', '', null, undefined, true, [], {}, 1e300].forEach(function (n) {
    const r = entregar(e, 'sal_sado', n);
    ok(r.ok === false && r.motivo === 'n_invalido', 'n = ' + String(n) + ' devia dar n_invalido: ' + J(r));
    ok(J(e) === antes, 'n = ' + String(n) + ' não devia mudar nada');
  });
  // Bem que não existe.
  ['nao_existe', '__proto__', 'constructor', 'toString', '', null, undefined, 42, {}, 'Queijo_Azeitao'].forEach(function (b) {
    const r = entregar(e, b, 1);
    ok(J(r) === J({ ok: false, motivo: 'id_invalido' }), 'bem ' + J(b) + ' devia dar id_invalido: ' + J(r));
    ok(J(e) === antes, 'bem ' + J(b) + ' não devia mudar nada');
  });
  // Sem estado: recusa sem rebentar.
  [null, undefined, {}, { despensa: null }].forEach(function (x) {
    let r; try { r = entregar(x, 'sal_sado', 1); } catch (err) { r = 'ERRO ' + err.message; }
    ok(r && r.ok === false && r.motivo === 'sem_stock', 'estado ' + J(x) + ' devia dar sem_stock: ' + J(r));
  });
  // Entregar não mexe em mais nada (nem Reputação, uvas, gotas, recebidos, primeiraTroca, hoje).
  const g2 = { despensa: clone(VAZIA), reputacao: 10, uvas: 100, gotas: 5 };
  trocar(g2, 'tomas', 'mel_sesimbra', '2026-10-07');
  const base = clone(g2);
  ok(entregar(g2, 'mel_sesimbra', 1).ok === true, 'entregar o mel devia ser aceite');
  ok(g2.reputacao === 10 && g2.uvas === 100 && g2.gotas === 5, 'entregar nunca devia mexer em Reputação, uvas nem gotas');
  ok(J(g2.despensa.recebidos) === J(base.despensa.recebidos) && J(g2.despensa.primeiraTroca) === J(base.despensa.primeiraTroca) && J(g2.despensa.hoje) === J(base.despensa.hoje), 'entregar só devia mexer em entregues');
  ok(Object.keys(g2).sort().join() === 'despensa,gotas,reputacao,uvas', 'entregar não devia acrescentar campos');
  // Depois de entregar, a troca do dia seguinte continua a somar.
  ok(trocar(g2, 'tomas', 'mel_sesimbra', '2026-10-08').ok === true && quantos(g2, 'mel_sesimbra') === 1, 'depois de entregar, trocar outra vez devia somar');
}

// 3. despensaRegistarTroca: 1.ª troca, mesmo vizinho, outro vizinho, dia novo.
{
  const e = { despensa: clone(VAZIA), reputacao: 10, uvas: 100, gotas: 5 };
  const r1 = trocar(e, 'dona_amelia', 'queijo_azeitao', '2026-10-07');
  ok(J(r1) === J({ ok: true, primeiraVez: true }), '1.ª troca devia dar { ok: true, primeiraVez: true }: ' + J(r1));
  ok(quantos(e, 'queijo_azeitao') === 1, 'depois da 1.ª troca devia haver 1 queijo');
  ok(e.despensa.primeiraTroca.queijo_azeitao === '2026-10-07', 'primeiraTroca devia ser o dia da troca');
  ok(e.despensa.hoje.dia === '2026-10-07' && J(clone(e.despensa.hoje.feitas)) === J({ dona_amelia: true }), 'hoje devia ficar com o dia e o vizinho');

  const antes = J(e);
  const r2 = trocar(e, 'dona_amelia', 'queijo_azeitao', '2026-10-07');
  ok(J(r2) === J({ ok: false, motivo: 'ja_hoje' }), '2.ª troca no mesmo dia com o mesmo vizinho devia ser recusada: ' + J(r2));
  ok(J(e) === antes, 'a troca recusada (ja_hoje) não devia mudar nada');

  const r3 = trocar(e, 'sr_joaquim', 'sal_sado', '2026-10-07');
  ok(J(r3) === J({ ok: true, primeiraVez: true }), 'outro vizinho no mesmo dia devia ser aceite: ' + J(r3));
  ok(quantos(e, 'sal_sado') === 1 && quantos(e, 'queijo_azeitao') === 1, 'cada bem devia ter 1');
  ok(J(clone(e.despensa.hoje.feitas)) === J({ dona_amelia: true, sr_joaquim: true }), 'hoje devia ter os dois vizinhos');
  ok(J(trocar(e, 'tomas', 'mel_sesimbra', '2026-10-07')) === J({ ok: true, primeiraVez: true }), 'o terceiro vizinho no mesmo dia também');

  // Dia novo: hoje reinicia-se sozinho; já não é a 1.ª vez; primeiraTroca não muda.
  const r4 = trocar(e, 'dona_amelia', 'queijo_azeitao', '2026-10-08');
  ok(J(r4) === J({ ok: true, primeiraVez: false }), 'no dia seguinte devia ser aceite e já não ser a 1.ª vez: ' + J(r4));
  ok(quantos(e, 'queijo_azeitao') === 2, 'devia haver 2 queijos');
  ok(e.despensa.primeiraTroca.queijo_azeitao === '2026-10-07', 'primeiraTroca nunca devia mudar depois de escrita');
  ok(e.despensa.hoje.dia === '2026-10-08' && J(clone(e.despensa.hoje.feitas)) === J({ dona_amelia: true }), 'dia novo devia reiniciar hoje (só o vizinho de hoje)');
  ok(e.reputacao === 10 && e.uvas === 100 && e.gotas === 5, 'trocar nunca devia mexer em Reputação, uvas nem gotas');
  ok(Object.keys(e).sort().join() === 'despensa,gotas,reputacao,uvas', 'trocar não devia acrescentar campos fora da despensa');
  ok(Object.keys(e.despensa).sort().join() === 'entregues,hoje,primeiraTroca,recebidos', 'a despensa não devia ganhar campos novos');
  ok(J(clone(e.despensa.entregues)) === '{}', 'trocar nunca devia mexer em entregues');

  // Sem teto diário de trocas (é do PR 5): 3 vizinhos no mesmo dia já foi aceite acima; mais um dia e mais 4 (com o Sr. Armindo).
  ['dona_amelia:queijo_azeitao', 'sr_joaquim:sal_sado', 'tomas:mel_sesimbra', 'sr_armindo:choco_sado'].forEach(function (p) {
    const x = p.split(':');
    ok(trocar(e, x[0], x[1], '2026-10-09').ok === true, 'sem teto diário: ' + x[0] + ' devia ser aceite no dia novo');
  });
}

// 4. Ids inválidos e dia inválido: recusados sem alterar nada (nem o dia).
{
  const e = { despensa: { recebidos: { queijo_azeitao: 1 }, primeiraTroca: { queijo_azeitao: '2026-10-01' }, hoje: { dia: '2026-10-05', feitas: { tomas: true } } } };
  const antes = J(e);
  [
    ['nao_existe', 'queijo_azeitao'], ['dona_amelia', 'nao_existe'], ['dona_amelia', 'sal_sado'], ['sr_joaquim', 'queijo_azeitao'], ['tomas', 'queijo_azeitao'],
    ['__proto__', 'queijo_azeitao'], ['dona_amelia', '__proto__'], ['constructor', 'constructor'], ['toString', 'toString'],
    [null, 'queijo_azeitao'], ['dona_amelia', null], [undefined, undefined], [42, 'queijo_azeitao'], [{}, {}], ['', ''], ['Dona_Amelia', 'queijo_azeitao']
  ].forEach(function (p) {
    const r = trocar(e, p[0], p[1], '2026-10-06');
    ok(J(r) === J({ ok: false, motivo: 'id_invalido' }), 'ids ' + J(p) + ' devia dar id_invalido: ' + J(r));
    ok(J(e) === antes, 'ids ' + J(p) + ' não devia alterar o estado');
  });
  ['2026-1-6', '06/10/2026', '', null, undefined, 20261006, '2026-10-06T10:00:00', 'hoje'].forEach(function (d) {
    const r = trocar(e, 'dona_amelia', 'queijo_azeitao', d);
    ok(J(r) === J({ ok: false, motivo: 'dia_invalido' }), 'dia ' + J(d) + ' devia dar dia_invalido: ' + J(r));
    ok(J(e) === antes, 'dia ' + J(d) + ' não devia alterar o estado');
  });
  ok(J(trocar(null, 'dona_amelia', 'queijo_azeitao', '2026-10-06')) === J({ ok: false, motivo: 'id_invalido' }) || J(trocar(null, 'dona_amelia', 'queijo_azeitao', '2026-10-06')).indexOf('"ok":false') !== -1, 'sem estado devia recusar, sem rebentar');
}

// 5. O estado só sobe: 400 trocas, 40 dias, todos os vizinhos, repetidas.
{
  const e = { despensa: clone(VAZIA) };
  const pares = [['dona_amelia', 'queijo_azeitao'], ['sr_joaquim', 'sal_sado'], ['tomas', 'mel_sesimbra']];
  let aceites = { queijo_azeitao: 0, sal_sado: 0, mel_sesimbra: 0 };
  let ultimo = { queijo_azeitao: 0, sal_sado: 0, mel_sesimbra: 0 };
  const entregues = { queijo_azeitao: 0, sal_sado: 0, mel_sesimbra: 0 };
  const ultimoEntregue = { queijo_azeitao: 0, sal_sado: 0, mel_sesimbra: 0 };
  const primeiras = {};
  let semente = 7;
  for (let n = 0; n < 400; n++) {
    semente = (semente * 1103515245 + 12345) % 2147483648;
    const dia = '2026-11-' + String(1 + Math.floor(n / 10)).padStart(2, '0');
    const par = pares[semente % 3];
    const r = trocar(e, par[0], par[1], dia);
    ok(r.ok === true || r.motivo === 'ja_hoje', 'só devia haver ok ou ja_hoje: ' + J(r));
    if (r.ok) aceites[par[1]]++;
    if (n % 3 === 0) { // entregas pelo meio: com e sem stock
      const eb = par[1]; const tinha = quantos(e, eb); const pedido = 1 + (semente % 3);
      const re = entregar(e, eb, pedido);
      ok(re.ok === (tinha >= pedido), 'a entrega de ' + pedido + ' com ' + tinha + ' devia ser ' + (tinha >= pedido) + ': ' + J(re));
      if (re.ok) entregues[eb] += pedido;
      ok(quantos(e, eb) === (tinha >= pedido ? tinha - pedido : tinha), 'a quantidade depois da entrega devia bater certo');
      ok((e.despensa.entregues[eb] || 0) >= ultimoEntregue[eb], 'entregues só sobe (' + eb + ')');
      ultimoEntregue[eb] = e.despensa.entregues[eb] || 0;
    }
    pares.forEach(function (p) {
      const q = quantos(e, p[1]);
      ok(Number.isInteger(q) && q >= 0, 'quantos devia ser um inteiro >= 0');
      ok((e.despensa.recebidos[p[1]] || 0) >= ultimo[p[1]], 'os recebidos só sobem (' + p[1] + ')');
      ultimo[p[1]] = e.despensa.recebidos[p[1]] || 0;
    });
    Object.keys(e.despensa.primeiraTroca).forEach(function (b) {
      if (primeiras[b] === undefined) primeiras[b] = e.despensa.primeiraTroca[b];
      ok(primeiras[b] === e.despensa.primeiraTroca[b], 'primeiraTroca de ' + b + ' nunca devia mudar');
    });
  }
  pares.forEach(function (p) {
    ok((e.despensa.recebidos[p[1]] || 0) === aceites[p[1]], 'os recebidos de ' + p[1] + ' devem ser iguais às trocas aceites: ' + e.despensa.recebidos[p[1]] + ' vs ' + aceites[p[1]]);
    ok((e.despensa.entregues[p[1]] || 0) === entregues[p[1]], 'as entregues de ' + p[1] + ' devem ser iguais às entregas aceites');
    ok(quantos(e, p[1]) === aceites[p[1]] - entregues[p[1]] && quantos(e, p[1]) >= 0, 'a quantidade de ' + p[1] + ' devia ser trocas menos entregas, nunca abaixo de 0');
  });
  ok(aceites.queijo_azeitao + aceites.sal_sado + aceites.mel_sesimbra > 0, 'devia ter havido trocas aceites');
}

// 6. Estado estranho (nuvem ou save antigo): repara-se sem rebentar e nunca fica negativo nem fracionado.
{
  [null, 'x', 5, [], { recebidos: [] }, { recebidos: { queijo_azeitao: -4, sal_sado: 2.5, mel_sesimbra: 'a' }, primeiraTroca: [], hoje: 'x' }, { hoje: { dia: '2026-10-07', feitas: [] } }, { entregues: [] }, { recebidos: { queijo_azeitao: 1 }, entregues: { queijo_azeitao: -7, sal_sado: 'x' } }].forEach(function (d) {
    const e = { despensa: d };
    const tinha = quantos(clone(e), 'queijo_azeitao'); // o que tinha antes (lido sem reparar)
    let r; try { r = trocar(e, 'dona_amelia', 'queijo_azeitao', '2026-10-07'); } catch (x) { r = 'ERRO ' + x.message; }
    ok(r && r.ok === true, 'despensa estranha ' + J(d) + ' devia ser reparada e aceitar a troca: ' + J(r));
    ok(quantos(e, 'queijo_azeitao') === tinha + 1, 'depois de reparada devia ter mais 1 queijo (' + tinha + ' + 1): ' + quantos(e, 'queijo_azeitao'));
    ['queijo_azeitao', 'sal_sado', 'mel_sesimbra'].forEach(function (b) {
      const q = e.despensa.recebidos[b];
      ok(q === undefined || (Number.isInteger(q) && q >= 0), 'recebidos de ' + b + ' devia ser um inteiro >= 0 (' + J(d) + ')');
      const en = e.despensa.entregues[b];
      ok(en === undefined || (Number.isInteger(en) && en >= 0), 'entregues de ' + b + ' devia ser um inteiro >= 0 (' + J(d) + ')');
    });
  });
}

// 7. Pureza: sem Math.random nem Date.now (o vm acima já os proíbe) e sem gravar.
{
  const src = ler(DESPENSA_JS);
  ok(!/Math\.random|Date\.now|new Date|saveState|localStorage/.test(src.replace(/\/\/.*$/gm, '')), 'despensa.js não devia usar Math.random, Date.now, new Date, saveState nem localStorage');
  ok(!/state\.(reputacao|uvas|gotas|garrafas)|gotas|marcarObjetivo|nuvem|historico/i.test(src.replace(/\/\/.*$/gm, '')), 'despensa.js não devia tocar em gotas, objetivos, nuvem nem no historico (as uvas e a Reputação só mudam em despensaTrocar, sobre o estado recebido; ver verificar-trocas.js)');
}

// 8. Carregada, mas só de leitura (PR 4: ecrã "A Estrada"): despensa.js está no index.html e o
//    único uso no jogo é despensaQuantos em js/estrada.js; ninguém regista trocas nem entregas.
if (!process.env.DESPENSA_JS) {
  const html = ler(path.join(RAIZ, 'index.html'));
  ok(/<script src="js\/despensa\.js\?v=\d+"><\/script>/.test(html), 'index.html devia carregar js/despensa.js (com ?v=)');
  ok(/<script src="js\/estrada-dados\.js\?v=\d+"><\/script>/.test(html), 'index.html devia carregar js/estrada-dados.js (com ?v=)');
  const pos = function (f) { return html.indexOf('<script src="js/' + f + '?v='); };
  ok(pos('despensa.js') !== -1 && pos('despensa.js') < pos('estrada.js') && pos('estrada.js') < pos('main.js'), 'despensa.js devia carregar antes de estrada.js e main.js');
  // Permitido: js/capitulos.js só LÊ o caminho 'despensa.recebidos' como dado do critério do capítulo 7,
  // os textos (js/i18n.js, js/capitulos.js) dizem "Despensa" com maiúscula, e js/estrada.js só chama despensaQuantos.
  const PERMITIDOS_TEXTO = ['capitulos.js', 'i18n.js'];
  fs.readdirSync(path.join(RAIZ, 'js')).filter(function (f) { return /\.js$/.test(f) && f !== 'state.js' && f !== 'despensa.js'; }).forEach(function (f) {
    let codigo = ler(path.join(RAIZ, 'js', f)).split('\n').filter(function (l) { return !/^\s*\/\//.test(l); }).join('\n');
    if (PERMITIDOS_TEXTO.indexOf(f) !== -1) codigo = codigo.replace(/'despensa\.recebidos'/g, '').replace(/Despensa/g, '');
    if (f === 'estrada.js') {
      // O ecrã (PR 5B) usa a despensa: lê para mostrar e, no clique, chama despensaTrocar (ver verificar-estrada.js).
      ok(!/despensaRegistarTroca|despensaRegistarEntrega|despensaEstado/.test(codigo), 'js/estrada.js não devia usar despensaRegistarTroca, despensaRegistarEntrega nem despensaEstado (só despensaTrocar, no clique)');
      return;
    }
    ok(!/despensa/i.test(codigo), 'js/' + f + ' não devia usar a despensa (só o caminho \'despensa.recebidos\' em capitulos.js e a palavra "Despensa" nos textos)');
    ok(!/despensaRegistarTroca|despensaRegistarEntrega|despensaTrocar/.test(codigo), 'js/' + f + ' não devia registar trocas nem entregas (só despensa.js e o clique de js/estrada.js)');
  });
  const stateSrc = ler(path.join(RAIZ, 'js', 'state.js')).split('\n').filter(function (l) { return !/^\s*\/\//.test(l); }).join('\n');
  ok((stateSrc.match(/despensa/gi) || []).length === 1, 'state.js só devia ter o campo despensa em defaultState()');
}

console.log(falhas === 0 ? 'OK' : falhas + ' FALHA(S)');
process.exit(falhas === 0 ? 0 : 1);
