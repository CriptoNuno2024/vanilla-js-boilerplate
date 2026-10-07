#!/usr/bin/env node
// Estado e funções da Despensa da Estrada (PR 3): state.despensa em js/state.js e
// despensaQuantos / despensaRegistarTroca em js/despensa.js. Corre o state.js, o
// estrada-dados.js e o despensa.js REAIS num ambiente simulado (vm), sem browser nem conta
// real. Confirma também que o despensa.js é puro (sem Math.random nem Date.now) e que nada
// no jogo o usa ainda.
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
const VAZIA = { recebidos: {}, primeiraTroca: {}, hoje: { dia: null, feitas: {} } };

// 1. Campo por omissão, save antigo e estado da nuvem.
{
  const g = abrir();
  ok(J(clone(g.ev('defaultState().despensa'))) === J(VAZIA), 'defaultState devia ter despensa = ' + J(VAZIA));
  ok(J(clone(g.ev('state.despensa'))) === J(VAZIA), 'um jogo novo devia começar com a despensa vazia');

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
  comDespensa.despensa = { recebidos: { queijo_azeitao: 2 }, primeiraTroca: { queijo_azeitao: '2026-10-01' }, hoje: { dia: '2026-10-05', feitas: { dona_amelia: true } } };
  const b = abrir(comDespensa);
  ok(J(clone(b.ev('state.despensa'))) === J(comDespensa.despensa), 'um save com despensa devia carregar igual');
  // Despensa parcial (só recebidos): o resto completa-se por omissão.
  const parcial = clone(antigo); parcial.despensa = { recebidos: { sal_sado: 1 } };
  const p = abrir(parcial);
  ok(J(clone(p.ev('state.despensa'))) === J({ recebidos: { sal_sado: 1 }, primeiraTroca: {}, hoje: { dia: null, feitas: {} } }), 'despensa parcial devia completar-se por omissão');

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
  ok(Object.keys(e.despensa).sort().join() === 'hoje,primeiraTroca,recebidos', 'a despensa não devia ganhar campos novos');

  // Sem teto diário de trocas (é do PR 5): 3 vizinhos no mesmo dia já foi aceite acima; mais um dia e mais 3.
  ['dona_amelia:queijo_azeitao', 'sr_joaquim:sal_sado', 'tomas:mel_sesimbra'].forEach(function (p) {
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
  const primeiras = {};
  let semente = 7;
  for (let n = 0; n < 400; n++) {
    semente = (semente * 1103515245 + 12345) % 2147483648;
    const dia = '2026-11-' + String(1 + Math.floor(n / 10)).padStart(2, '0');
    const par = pares[semente % 3];
    const r = trocar(e, par[0], par[1], dia);
    ok(r.ok === true || r.motivo === 'ja_hoje', 'só devia haver ok ou ja_hoje: ' + J(r));
    if (r.ok) aceites[par[1]]++;
    pares.forEach(function (p) {
      const q = quantos(e, p[1]);
      ok(Number.isInteger(q) && q >= 0, 'quantos devia ser um inteiro >= 0');
      ok(q >= ultimo[p[1]], 'o estado só sobe (' + p[1] + ')');
      ultimo[p[1]] = q;
    });
    Object.keys(e.despensa.primeiraTroca).forEach(function (b) {
      if (primeiras[b] === undefined) primeiras[b] = e.despensa.primeiraTroca[b];
      ok(primeiras[b] === e.despensa.primeiraTroca[b], 'primeiraTroca de ' + b + ' nunca devia mudar');
    });
  }
  pares.forEach(function (p) { ok(quantos(e, p[1]) === aceites[p[1]], 'os recebidos de ' + p[1] + ' devem ser iguais às trocas aceites: ' + quantos(e, p[1]) + ' vs ' + aceites[p[1]]); });
  ok(aceites.queijo_azeitao + aceites.sal_sado + aceites.mel_sesimbra > 0, 'devia ter havido trocas aceites');
}

// 6. Estado estranho (nuvem ou save antigo): repara-se sem rebentar e nunca fica negativo nem fracionado.
{
  [null, 'x', 5, [], { recebidos: [] }, { recebidos: { queijo_azeitao: -4, sal_sado: 2.5, mel_sesimbra: 'a' }, primeiraTroca: [], hoje: 'x' }, { hoje: { dia: '2026-10-07', feitas: [] } }].forEach(function (d) {
    const e = { despensa: d };
    let r; try { r = trocar(e, 'dona_amelia', 'queijo_azeitao', '2026-10-07'); } catch (x) { r = 'ERRO ' + x.message; }
    ok(r && r.ok === true, 'despensa estranha ' + J(d) + ' devia ser reparada e aceitar a troca: ' + J(r));
    ok(quantos(e, 'queijo_azeitao') === 1, 'depois de reparada devia ter 1 queijo (' + J(d) + ')');
    ['queijo_azeitao', 'sal_sado', 'mel_sesimbra'].forEach(function (b) {
      const q = e.despensa.recebidos[b];
      ok(q === undefined || (Number.isInteger(q) && q >= 0), 'recebidos de ' + b + ' devia ser um inteiro >= 0 (' + J(d) + ')');
    });
  });
}

// 7. Pureza: sem Math.random nem Date.now (o vm acima já os proíbe) e sem gravar.
{
  const src = ler(DESPENSA_JS);
  ok(!/Math\.random|Date\.now|new Date|saveState|localStorage/.test(src.replace(/\/\/.*$/gm, '')), 'despensa.js não devia usar Math.random, Date.now, new Date, saveState nem localStorage');
  ok(!/state\.(reputacao|uvas|gotas|garrafas)|marcarObjetivo|nuvem/i.test(src.replace(/\/\/.*$/gm, '')), 'despensa.js não devia tocar em Reputação, uvas, gotas, garrafas, objetivos nem nuvem');
}

// 8. Nada no jogo usa a despensa (só state.js e o próprio despensa.js).
if (!process.env.DESPENSA_JS) {
  const html = ler(path.join(RAIZ, 'index.html'));
  ok(!/despensa/i.test(html), 'index.html não devia carregar nem referir a despensa');
  fs.readdirSync(path.join(RAIZ, 'js')).filter(function (f) { return /\.js$/.test(f) && f !== 'state.js' && f !== 'despensa.js'; }).forEach(function (f) {
    const codigo = ler(path.join(RAIZ, 'js', f)).split('\n').filter(function (l) { return !/^\s*\/\//.test(l); }).join('\n');
    ok(!/despensa/i.test(codigo), 'js/' + f + ' não devia usar a despensa neste PR');
  });
  const stateSrc = ler(path.join(RAIZ, 'js', 'state.js')).split('\n').filter(function (l) { return !/^\s*\/\//.test(l); }).join('\n');
  ok((stateSrc.match(/despensa/gi) || []).length === 1, 'state.js só devia ter o campo despensa em defaultState()');
}

console.log(falhas === 0 ? 'OK' : falhas + ' FALHA(S)');
process.exit(falhas === 0 ? 0 : 1);
