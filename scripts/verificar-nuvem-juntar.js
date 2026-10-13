#!/usr/bin/env node
// Verifica a junção das áreas "leves" do progresso na nuvem (nuvemJuntarLeves() e o uso que nuvemTratarLeitura() faz dela,
// js/nuvem.js): state.despensa, state.visitas, state.lagar, state.camara, state.roxo, state.loja, state.reserva e state.colecao.
// Só LÊ js/, corre-os num ambiente simulado (vm) com uma nuvem falsa em memória: nunca toca em browser, Telegram nem conta real.
//
//   (a) nada desce nem recua em nenhum campo (datas só avançam, contadores e mapas só sobem, primeiraTroca só recua no tempo)
//   (b) juntar A com B dá o mesmo que B com A nos campos "só-sobe" (visitas.hoje com o mesmo dia e ids diferentes fica com o do "base",
//       por regra) e juntar duas vezes não muda nada
//   (c) dois aparelhos: o A fez o Lagar e 2 trocas; o B (mais antigo e gravado depois) fez a Loja e 1 visita, nos dois ramos
//       (local ganha / nuvem ganha); no fim cada aparelho tem tudo
//   (d) entradas estragadas (null, números, textos, listas, '__proto__') não rebentam e não alteram os argumentos
//   regras pontuais (loja, despensa.hoje, visitas.hoje com bagaceiraDia, recebidos menos entregues) e "só grava quando mudou"
// No fim corre mutações: estraga js/nuvem.js de propósito e confirma que este teste dá por isso.
//
// Uso: node scripts/verificar-nuvem-juntar.js
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const STATE_JS = fs.readFileSync(path.join(RAIZ, 'js', 'state.js'), 'utf8');
const NUVEM_JS = fs.readFileSync(path.join(RAIZ, 'js', 'nuvem.js'), 'utf8');
const AREAS = ['despensa', 'visitas', 'lagar', 'camara', 'roxo', 'loja', 'reserva', 'colecao'];

// Nuvem falsa (CloudStorage) em memória, como em verificar-nuvem.js.
function nuvemFalsa(inicial) {
  const dados = Object.assign({}, inicial);
  const f = { dados: dados, escritas: 0 };
  f.getItem = function (k, cb) { cb(null, Object.prototype.hasOwnProperty.call(dados, k) ? dados[k] : ''); };
  f.getItems = function (ks, cb) {
    const r = {};
    ks.forEach(function (k) { r[k] = Object.prototype.hasOwnProperty.call(dados, k) ? dados[k] : ''; });
    cb(null, r);
  };
  f.setItem = function (k, v, cb) { f.escritas++; dados[k] = v; if (cb) cb(null, true); };
  return f;
}

function guardarNaNuvem(nuvem, estado, em) {
  nuvem.dados.yc_state_meta = JSON.stringify({ partes: 1, atualizadoEm: em });
  nuvem.dados.yc_state_parte_0 = JSON.stringify(estado);
}

// Abre o "jogo" (state.js e a fonte de nuvem.js dada) num ambiente simulado, com relógio controlado.
function abrir(fonteNuvem, localStorageDados, relogio, nuvem) {
  const pointer = [];
  const temporizadores = [];
  let proximoId = 1;
  const sandbox = {
    console: { log() {}, warn() {}, error() {} },
    localStorage: {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(localStorageDados, k) ? localStorageDados[k] : null; },
      setItem: function (k, v) { localStorageDados[k] = String(v); },
      removeItem: function (k) { delete localStorageDados[k]; }
    },
    location: { search: '' },
    URLSearchParams: URLSearchParams,
    document: {
      addEventListener: function (tipo, fn) { if (tipo === 'pointerdown') pointer.push(fn); },
      querySelectorAll: function () { return []; },
      querySelector: function () { return null; },
      getElementById: function () { return null; },
      visibilityState: 'visible'
    },
    setTimeout: function (fn, ms) { const id = proximoId++; temporizadores.push({ id: id, em: relogio.t + (ms || 0), fn: fn }); return id; },
    clearTimeout: function (id) { const i = temporizadores.findIndex(function (x) { return x.id === id; }); if (i !== -1) temporizadores.splice(i, 1); },
    applyTranslations: function () {},
    t: function (k) { return k; },
    Date: class extends Date { static now() { return relogio.t; } }
  };
  sandbox.window = sandbox;
  sandbox.window.addEventListener = function () {};
  sandbox.Telegram = { WebApp: nuvem ? { initDataUnsafe: { a: 1 }, CloudStorage: nuvem } : {} };
  const ctx = vm.createContext(sandbox);
  vm.runInContext(STATE_JS, ctx, { filename: 'state.js' });
  vm.runInContext(fonteNuvem, ctx, { filename: 'nuvem.js' });
  return {
    ev: function (codigo) { return vm.runInContext(codigo, ctx); },
    tocar: function () { pointer.forEach(function (fn) { fn(); }); },
    avancar: function (ms) {
      const alvo = relogio.t + ms;
      for (;;) {
        temporizadores.sort(function (a, b) { return a.em - b.em; });
        if (!temporizadores.length || temporizadores[0].em > alvo) break;
        const x = temporizadores.shift();
        relogio.t = Math.max(relogio.t, x.em);
        x.fn();
      }
      relogio.t = alvo;
    }
  };
}

function J(x) { return JSON.stringify(x); }
// JSON com as chaves por ordem (para comparar sem depender da ordem de inserção).
function canon(x) {
  if (Array.isArray(x)) return x.map(canon);
  if (x && typeof x === 'object') { const r = {}; Object.keys(x).sort().forEach(function (k) { r[k] = canon(x[k]); }); return r; }
  return x;
}
function C(x) { return JSON.stringify(canon(x)); }
const DATA = /^\d{4}-\d{2}-\d{2}$/;

// Gerador pseudo-aleatório fixo (LCG), para os mesmos casos em todas as corridas.
function gerador(semente) {
  let s = semente >>> 0;
  return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}

// Um estado "bom" aleatório (só as áreas leves), com entregues <= recebidos por bem (a regra de cada aparelho).
function estadoAleatorio(rnd) {
  const dias = ['2026-10-01', '2026-10-02', '2026-10-05', '2026-10-09', '2026-10-10', '2026-10-11'];
  const dia = function () { return rnd() < 0.2 ? null : dias[Math.floor(rnd() * dias.length)]; };
  const n = function () { return Math.floor(rnd() * 6); };
  const bens = ['queijo_azeitao', 'choco_sado', 'mel_arrabida'];
  const viz = ['sr_armindo', 'dona_rosa', 'tio_joao'];
  const recebidos = {}, entregues = {}, primeiraTroca = {}, feitas = {}, vFeitas = {};
  bens.forEach(function (b) {
    if (rnd() < 0.7) { const r = n(); recebidos[b] = r; entregues[b] = Math.floor(rnd() * (r + 1)); }
    if (rnd() < 0.5) primeiraTroca[b] = dias[Math.floor(rnd() * dias.length)];
  });
  const diaDespensa = dia();
  viz.forEach(function (v) { if (diaDespensa !== null && rnd() < 0.4) feitas[v] = true; }); // sem dia não há trocas feitas hoje
  ['valentim', 'marisa', 'henrique'].forEach(function (v) { if (rnd() < 0.5) vFeitas[v] = dias[Math.floor(rnd() * dias.length)]; });
  const vd = dia();
  const hoje = (vd === null || rnd() < 0.2) ? null : { dia: vd, id: ['valentim', 'marisa'][Math.floor(rnd() * 2)], feita: rnd() < 0.5 };
  if (hoje && rnd() < 0.4) hoje.bagaceiraDia = hoje.dia;
  return {
    despensa: { recebidos: recebidos, entregues: entregues, primeiraTroca: primeiraTroca, hoje: { dia: diaDespensa, feitas: feitas } },
    visitas: { feitas: vFeitas, hoje: hoje },
    lagar: { ultimoDia: dia(), dias: n(), mesaDia: dia(), assaltoDia: dia() },
    camara: { provaDia: dia(), dias: n() },
    roxo: { brindeDia: dia(), dias: n() },
    loja: { dia: dia(), vendasHoje: n() },
    reserva: { visitaDia: dia() },
    colecao: { arrumouDia: dia() }
  };
}

function correr(fonteNuvem) {
  const falhas = [];
  function ok(cond, msg) { if (!cond) falhas.push(msg); }

  const j = abrir(fonteNuvem, {}, { t: 9000 }, nuvemFalsa({}));
  const juntar = function (a, b) { return JSON.parse(j.ev('JSON.stringify(nuvemJuntarLeves(' + J(a) + ',' + J(b) + '))')); };
  const defeito = JSON.parse(j.ev('JSON.stringify(defaultState())'));
  const vazio = {}; AREAS.forEach(function (k) { vazio[k] = defeito[k]; });

  // ---------------------------------------------------------------- (a) e (b): casos aleatórios
  const rnd = gerador(20261013);
  const mais = function (x, y) { return y === null || (x !== null && x >= y); }; // x >= y, com null o mais antigo
  for (let i = 0; i < 300; i++) {
    const A = estadoAleatorio(rnd), B = estadoAleatorio(rnd);
    const R = juntar(A, B), R2 = juntar(B, A);
    const q = 'caso ' + i + ': ';
    // forma: as mesmas áreas e chaves que o defaultState()
    ok(AREAS.every(function (k) { return Object.keys(R[k]).join() === Object.keys(defeito[k]).join(); }), q + 'a forma devia ser a do defaultState()');
    // (a) datas simples: a mais recente, nunca recuam
    [['lagar', 'ultimoDia'], ['lagar', 'mesaDia'], ['lagar', 'assaltoDia'], ['camara', 'provaDia'], ['roxo', 'brindeDia'], ['reserva', 'visitaDia'], ['colecao', 'arrumouDia']].forEach(function (p) {
      ok(mais(R[p[0]][p[1]], A[p[0]][p[1]]) && mais(R[p[0]][p[1]], B[p[0]][p[1]]), q + p.join('.') + ' recuou');
      ok(R[p[0]][p[1]] === [A[p[0]][p[1]], B[p[0]][p[1]]].filter(function (x) { return x !== null; }).sort().pop() || (A[p[0]][p[1]] === null && B[p[0]][p[1]] === null && R[p[0]][p[1]] === null), q + p.join('.') + ' devia ser a mais recente');
    });
    // contadores: o maior
    [['lagar', 'dias'], ['camara', 'dias'], ['roxo', 'dias']].forEach(function (p) {
      ok(R[p[0]][p[1]] === Math.max(A[p[0]][p[1]], B[p[0]][p[1]]), q + p.join('.') + ' devia ser o maior');
    });
    // loja: o dia não recua e, no mesmo dia, vendasHoje fica o maior
    ok(R.loja.dia === null ? (A.loja.dia === null && B.loja.dia === null) : mais(R.loja.dia, A.loja.dia) && mais(R.loja.dia, B.loja.dia), q + 'loja.dia recuou');
    if (A.loja.dia === B.loja.dia) ok(R.loja.vendasHoje === Math.max(A.loja.vendasHoje, B.loja.vendasHoje), q + 'no mesmo dia vendasHoje devia ser o maior');
    // despensa: mapas só sobem; primeiraTroca só recua; recebidos - entregues >= 0
    ['recebidos', 'entregues'].forEach(function (m) {
      [A, B].forEach(function (S) { Object.keys(S.despensa[m]).forEach(function (b) { ok(R.despensa[m][b] >= S.despensa[m][b], q + 'despensa.' + m + '.' + b + ' desceu'); }); });
    });
    Object.keys(R.despensa.recebidos).forEach(function (b) { ok((R.despensa.recebidos[b] || 0) - (R.despensa.entregues[b] || 0) >= 0, q + 'recebidos menos entregues ficou negativo em ' + b); });
    [A, B].forEach(function (S) { Object.keys(S.despensa.primeiraTroca).forEach(function (b) { ok(R.despensa.primeiraTroca[b] <= S.despensa.primeiraTroca[b], q + 'primeiraTroca.' + b + ' avançou'); }); });
    [A, B].forEach(function (S) { Object.keys(S.visitas.feitas).forEach(function (v) { ok(R.visitas.feitas[v] >= S.visitas.feitas[v], q + 'visitas.feitas.' + v + ' recuou'); }); });
    // despensa.hoje: o dia não recua; no mesmo dia, as feitas só crescem
    ok(mais(R.despensa.hoje.dia, A.despensa.hoje.dia) && mais(R.despensa.hoje.dia, B.despensa.hoje.dia), q + 'despensa.hoje.dia recuou');
    [A, B].forEach(function (S) {
      if (S.despensa.hoje.dia !== null && S.despensa.hoje.dia === R.despensa.hoje.dia) Object.keys(S.despensa.hoje.feitas).forEach(function (v) { ok(R.despensa.hoje.feitas[v] === true, q + 'despensa.hoje.feitas.' + v + ' perdeu-se'); });
    });
    // visitas.hoje: o dia não recua; no mesmo dia e id, feita e bagaceiraDia não descem
    [A, B].forEach(function (S) {
      if (S.visitas.hoje) {
        ok(R.visitas.hoje !== null && R.visitas.hoje.dia >= S.visitas.hoje.dia, q + 'visitas.hoje.dia recuou');
        if (R.visitas.hoje && R.visitas.hoje.dia === S.visitas.hoje.dia && R.visitas.hoje.id === S.visitas.hoje.id) {
          ok(!S.visitas.hoje.feita || R.visitas.hoje.feita === true, q + 'visitas.hoje.feita desceu');
          ok(!S.visitas.hoje.bagaceiraDia || R.visitas.hoje.bagaceiraDia === S.visitas.hoje.bagaceiraDia, q + 'o copo de bagaceira de hoje perdeu-se');
        }
      }
    });
    // (b) comutativa, menos visitas.hoje com o mesmo dia e ids diferentes (fica o do "base", por regra)
    const ha = A.visitas.hoje, hb = B.visitas.hoje;
    const dependeDaOrdem = ha && hb && ha.dia === hb.dia && ha.id !== hb.id;
    const semHoje = function (r) { const c = JSON.parse(J(r)); if (dependeDaOrdem) c.visitas.hoje = 'x'; return c; };
    ok(C(semHoje(R)) === C(semHoje(R2)), q + 'juntar A com B devia dar o mesmo que B com A');
    if (dependeDaOrdem) ok(J(R.visitas.hoje) === J(normalizarHoje(ha)) && J(R2.visitas.hoje) === J(normalizarHoje(hb)), q + 'no mesmo dia com ids diferentes devia ficar o do base');
    // (b) idempotente
    ok(J(juntar(R, B)) === J(R) && J(juntar(R, A)) === J(R) && J(juntar(R, R)) === J(R), q + 'juntar outra vez não devia mudar nada');
    ok(C(juntar(A, A)) === C(A), q + 'juntar um estado com ele próprio devia dar o mesmo estado');
  }
  function normalizarHoje(h) { const r = { dia: h.dia, id: h.id, feita: h.feita === true }; if (h.bagaceiraDia) r.bagaceiraDia = h.bagaceiraDia; return r; }

  // ---------------------------------------------------------------- regras pontuais
  const L = function (extra) { return Object.assign({}, vazio, extra); };
  // loja
  ok(J(juntar(L({ loja: { dia: '2026-10-10', vendasHoje: 3 } }), L({ loja: { dia: '2026-10-11', vendasHoje: 1 } })).loja) === '{"dia":"2026-10-11","vendasHoje":1}', 'loja: o dia mais recente ganha, mesmo com menos vendas');
  ok(J(juntar(L({ loja: { dia: '2026-10-11', vendasHoje: 1 } }), L({ loja: { dia: '2026-10-11', vendasHoje: 3 } })).loja) === '{"dia":"2026-10-11","vendasHoje":3}', 'loja: no mesmo dia fica o maior vendasHoje');
  ok(J(juntar(L({ loja: { dia: null, vendasHoje: 0 } }), L({ loja: { dia: '2026-10-11', vendasHoje: 2 } })).loja) === '{"dia":"2026-10-11","vendasHoje":2}', 'loja: com um dia null fica o outro');
  ok(J(juntar(L({ loja: { dia: '2026-10-11', vendasHoje: 2 } }), vazio).loja) === '{"dia":"2026-10-11","vendasHoje":2}', 'loja: o outro lado vazio não apaga');
  // despensa.hoje
  ok(J(juntar(L({ despensa: { recebidos: {}, entregues: {}, primeiraTroca: {}, hoje: { dia: '2026-10-11', feitas: { a: true } } } }), L({ despensa: { recebidos: {}, entregues: {}, primeiraTroca: {}, hoje: { dia: '2026-10-11', feitas: { b: true, c: false } } } })).despensa.hoje) === '{"dia":"2026-10-11","feitas":{"a":true,"b":true}}', 'despensa.hoje: no mesmo dia as feitas unem-se (só os true)');
  ok(J(juntar(L({ despensa: { recebidos: {}, entregues: {}, primeiraTroca: {}, hoje: { dia: '2026-10-10', feitas: { a: true } } } }), L({ despensa: { recebidos: {}, entregues: {}, primeiraTroca: {}, hoje: { dia: '2026-10-11', feitas: { b: true } } } })).despensa.hoje) === '{"dia":"2026-10-11","feitas":{"b":true}}', 'despensa.hoje: o dia mais recente ganha com as suas feitas');
  // visitas.hoje
  const VH = function (h) { return juntar(L({ visitas: { feitas: {}, hoje: h[0] } }), L({ visitas: { feitas: {}, hoje: h[1] } })).visitas.hoje; };
  ok(J(VH([null, { dia: '2026-10-11', id: 'marisa', feita: true }])) === '{"dia":"2026-10-11","id":"marisa","feita":true}', 'visitas.hoje: com um null fica o outro');
  ok(J(VH([{ dia: '2026-10-11', id: 'marisa', feita: false }, { dia: '2026-10-10', id: 'valentim', feita: true }])) === '{"dia":"2026-10-11","id":"marisa","feita":false}', 'visitas.hoje: o dia mais recente ganha');
  ok(J(VH([{ dia: '2026-10-11', id: 'marisa', feita: false }, { dia: '2026-10-11', id: 'marisa', feita: true }])) === '{"dia":"2026-10-11","id":"marisa","feita":true}', 'visitas.hoje: mesmo dia e id, feita = true se algum for true');
  ok(J(VH([{ dia: '2026-10-11', id: 'marisa', feita: true }, { dia: '2026-10-11', id: 'valentim', feita: false }])) === '{"dia":"2026-10-11","id":"marisa","feita":true}', 'visitas.hoje: mesmo dia, ids diferentes: fica o do base');
  ok(J(VH([{ dia: '2026-10-11', id: 'valentim', feita: false }, { dia: '2026-10-11', id: 'marisa', feita: true }])) === '{"dia":"2026-10-11","id":"valentim","feita":false}', 'visitas.hoje: mesmo dia, ids diferentes: fica o do base (ao contrário)');
  ok(J(VH([{ dia: '2026-10-11', id: 'marisa', feita: true }, { dia: '2026-10-11', id: 'marisa', feita: true, bagaceiraDia: '2026-10-11' }])) === '{"dia":"2026-10-11","id":"marisa","feita":true,"bagaceiraDia":"2026-10-11"}', 'visitas.hoje: o copo de bagaceira já oferecido noutro aparelho não se perde');
  ok(J(VH([{ dia: '2026-10-11', id: 'marisa', feita: true, bagaceiraDia: '2026-10-11' }, { dia: '2026-10-11', id: 'marisa', feita: true }])) === '{"dia":"2026-10-11","id":"marisa","feita":true,"bagaceiraDia":"2026-10-11"}', 'visitas.hoje: o copo de bagaceira do base também fica');
  // primeiraTroca: a mais antiga; visitas.feitas: a mais recente; recebidos/entregues: o maior, com união das chaves
  const D = juntar(L({ despensa: { recebidos: { a: 2, b: 1 }, entregues: { a: 1 }, primeiraTroca: { a: '2026-10-05' }, hoje: { dia: null, feitas: {} } }, visitas: { feitas: { v: '2026-10-05' }, hoje: null } }),
    L({ despensa: { recebidos: { a: 1, c: 4 }, entregues: { a: 1, c: 2 }, primeiraTroca: { a: '2026-10-03', c: '2026-10-09' }, hoje: { dia: null, feitas: {} } }, visitas: { feitas: { v: '2026-10-09', w: '2026-10-01' }, hoje: null } }));
  ok(J(D.despensa.recebidos) === '{"a":2,"b":1,"c":4}' && J(D.despensa.entregues) === '{"a":1,"c":2}', 'despensa: recebidos e entregues, o maior por bem, com a união das chaves: ' + J(D.despensa));
  ok(J(D.despensa.primeiraTroca) === '{"a":"2026-10-03","c":"2026-10-09"}', 'despensa.primeiraTroca: a data mais antiga por bem: ' + J(D.despensa.primeiraTroca));
  ok(J(D.visitas.feitas) === '{"v":"2026-10-09","w":"2026-10-01"}', 'visitas.feitas: a data mais recente por id: ' + J(D.visitas.feitas));

  // ---------------------------------------------------------------- (d) entradas estragadas
  const lixo = [null, undefined, 5, 'texto', [], [1, 2], true, {}, { despensa: 5, visitas: 'x', lagar: [], camara: null, roxo: 7, loja: 'x', reserva: [1], colecao: true },
    { despensa: { recebidos: [1], entregues: 'x', primeiraTroca: 5, hoje: 'x' }, visitas: { feitas: [], hoje: 'x' }, lagar: { ultimoDia: 20261010, dias: '3', mesaDia: '2026-1-1', assaltoDia: {} }, camara: { provaDia: [], dias: -2 }, roxo: { brindeDia: 'ontem', dias: 1.5 }, loja: { dia: 7, vendasHoje: 'x' }, reserva: { visitaDia: null }, colecao: { arrumouDia: '2026-13-45x' } },
    JSON.parse('{"despensa":{"recebidos":{"__proto__":{"x":1},"a":"y","b":-1,"c":1e999,"d":3},"entregues":{"__proto__":5},"primeiraTroca":{"__proto__":"2026-01-01","a":"nope"},"hoje":{"dia":"2026-10-10","feitas":{"__proto__":true,"x":true}}},"visitas":{"feitas":{"__proto__":"2026-01-01"},"hoje":{"dia":"2026-10-10","id":"__proto__","feita":true}}}')];
  let rebentou = null;
  lixo.forEach(function (a, ia) {
    lixo.forEach(function (b, ib) {
      try {
        const lit = function (x) { return x === undefined ? 'undefined' : 'JSON.parse(' + J(J(x)) + ')'; };
        const r = JSON.parse(j.ev('JSON.stringify(nuvemJuntarLeves(' + lit(a) + ', ' + lit(b) + '))'));
        ok(AREAS.every(function (k) { return Object.keys(r[k]).join() === Object.keys(defeito[k]).join(); }), 'lixo ' + ia + '/' + ib + ': a forma devia ser a do defaultState()');
      } catch (e) { rebentou = rebentou || ('lixo ' + ia + '/' + ib + ': ' + e.message); }
    });
  });
  ok(rebentou === null, 'entradas estragadas não deviam rebentar: ' + rebentou);
  ok(C(juntar(null, 5)) === C(vazio) && C(juntar('x', [])) === C(vazio), 'dois lados sem objetos dão o estado vazio');
  ok(J(juntar(lixo[lixo.length - 1], lixo[lixo.length - 1]).despensa.recebidos) === '{"d":3}', 'valores inválidos (texto, negativo, Infinity) ignoram-se e o válido fica: ' + J(juntar(lixo[lixo.length - 1], null).despensa.recebidos));
  // uma data só vale com o formato AAAA-MM-DD (um texto qualquer não ganha às datas boas por ser "maior")
  ok(juntar({ lagar: { ultimoDia: 'zzzz' } }, { lagar: { ultimoDia: '2026-10-01' } }).lagar.ultimoDia === '2026-10-01' && juntar({ lagar: { ultimoDia: '2026-1-1' } }, null).lagar.ultimoDia === null && juntar({ visitas: { feitas: { v: 'zzzz' } } }, { visitas: { feitas: { v: '2026-10-01' } } }).visitas.feitas.v === '2026-10-01', 'datas fora do formato AAAA-MM-DD ignoram-se');
  ok(juntar(lixo[lixo.length - 1], null).visitas.hoje === null, 'visitas.hoje com id "__proto__" ignora-se');
  ok(j.ev('({}).x === undefined && Object.getPrototypeOf(nuvemJuntarLeves(JSON.parse(\'{"despensa":{"recebidos":{"__proto__":{"x":1}}}}\'), null).despensa.recebidos) === Object.prototype'), "'__proto__' não devia alterar nenhum protótipo");
  // os argumentos não são alterados
  const pa = estadoAleatorio(gerador(1)), pb = estadoAleatorio(gerador(2));
  j.ev('var _pa = ' + J(pa) + ', _pb = ' + J(pb) + '; nuvemJuntarLeves(_pa, _pb);');
  ok(j.ev('JSON.stringify(_pa)') === J(pa) && j.ev('JSON.stringify(_pb)') === J(pb), 'os argumentos não deviam ser alterados');

  // ---------------------------------------------------------------- (c) dois aparelhos, nos dois ramos
  const base = function (rep, em, extra) { return Object.assign({ reputacao: rep, ultimaGravacaoEm: em }, extra); };
  const feitoA = { // aparelho A: o Lagar e 2 trocas
    lagar: { ultimoDia: '2026-10-10', dias: 3, mesaDia: '2026-10-10', assaltoDia: '2026-10-09' },
    despensa: { recebidos: { queijo_azeitao: 1, choco_sado: 1 }, entregues: {}, primeiraTroca: { queijo_azeitao: '2026-10-08', choco_sado: '2026-10-10' }, hoje: { dia: '2026-10-10', feitas: { sr_armindo: true, dona_rosa: true } } }
  };
  const feitoB = { // aparelho B: a Loja e 1 visita
    loja: { dia: '2026-10-11', vendasHoje: 2 },
    visitas: { feitas: { valentim: '2026-10-11' }, hoje: { dia: '2026-10-11', id: 'valentim', feita: true } }
  };
  const tudo = function (e) { return J({ lagar: e.lagar, despensa: e.despensa, loja: e.loja, visitas: e.visitas }); };
  const esperado = (function () { const e = {}; AREAS.forEach(function (k) { e[k] = defeito[k]; }); return Object.assign(e, feitoA, feitoB); })();
  const verTudo = function (g, quem) {
    const e = JSON.parse(g.ev('JSON.stringify(state)'));
    ok(tudo(e) === tudo(esperado), quem + ' devia ter tudo (Lagar, 2 trocas, Loja e 1 visita), tem: ' + tudo(e));
  };
  ['local', 'nuvem'].forEach(function (ramo) {
    const nuvem = nuvemFalsa({});
    // A jogou e gravou na nuvem às 5000.
    guardarNaNuvem(nuvem, base(100, 5000, feitoA), 5000);
    // B: local ganha = carimbo 9000 (e a mesma Reputação); nuvem ganha = carimbo 1000 (mais antigo), com a mesma Reputação.
    const emB = ramo === 'local' ? 9000 : 1000;
    const lsB = { yoshicat_quinta_state_v2: J(base(100, emB, feitoB)) };
    const gB = abrir(fonteNuvem, lsB, { t: 20000 }, nuvem);
    gB.avancar(2000);
    ok(gB.ev('arranque.ganhou') === ramo || gB.ev('arranque.ganhou').indexOf(ramo) === 0, 'ramo ' + ramo + ': devia ganhar o ' + ramo + ', ganhou: ' + gB.ev('arranque.ganhou'));
    verTudo(gB, 'ramo ' + ramo + ': o aparelho B');
    if (ramo === 'nuvem') ok(tudo(JSON.parse(lsB.yoshicat_quinta_state_v2)) === tudo(esperado), 'ramo nuvem: o localStorage do B devia ter tudo');
    if (ramo === 'nuvem') { gB.ev('nuvemGuardarEstado(state)'); gB.avancar(2000); } // o B joga e grava: a nuvem passa a ter tudo
    ok(tudo(JSON.parse(nuvem.dados.yc_state_parte_0)) === tudo(esperado), 'ramo ' + ramo + ': a nuvem devia ficar com tudo');
    // O A volta a abrir com o seu estado antigo e lê a nuvem: também fica com tudo.
    const lsA = { yoshicat_quinta_state_v2: J(base(100, 5000, feitoA)) };
    const gA = abrir(fonteNuvem, lsA, { t: 40000 }, nuvem);
    gA.avancar(2000);
    verTudo(gA, 'ramo ' + ramo + ': o aparelho A');
  });

  // ---------------------------------------------------------------- só grava quando mudou
  {
    const igual = base(100, 5000, Object.assign({}, feitoA, feitoB));
    const nuvem = nuvemFalsa({});
    guardarNaNuvem(nuvem, igual, 5000);
    const g = abrir(fonteNuvem, { yoshicat_quinta_state_v2: J(igual) }, { t: 20000 }, nuvem);
    g.avancar(2000);
    ok(nuvem.escritas === 0, 'estados iguais: não devia gravar nada na nuvem, gravou ' + nuvem.escritas + ' vezes');
    // O local tem menos que a nuvem (mais antigo ou não): grava uma vez a juntar.
    const nuvem2 = nuvemFalsa({});
    guardarNaNuvem(nuvem2, base(100, 5000, feitoA), 5000);
    const g2 = abrir(fonteNuvem, { yoshicat_quinta_state_v2: J(base(100, 5000, feitoB)) }, { t: 20000 }, nuvem2);
    g2.avancar(2000);
    ok(nuvem2.escritas > 0, 'o local tinha menos que a nuvem: devia gravar a junção');
  }
  return falhas;
}

// ---------------------------------------------------------------- corrida a sério
const falhasReais = correr(NUVEM_JS);
falhasReais.slice(0, 40).forEach(function (m) { console.log('FALHA: ' + m); });
if (falhasReais.length > 40) console.log('... e mais ' + (falhasReais.length - 40) + ' falhas');
let falhou = falhasReais.length;

// ---------------------------------------------------------------- mutações: estragar nuvem.js de propósito
const MUTACOES = [
  ['o contador lagar.dias desce', 'dias: Math.max(nuvemLevesInteiro(la.dias), nuvemLevesInteiro(lb.dias))', 'dias: Math.min(nuvemLevesInteiro(la.dias), nuvemLevesInteiro(lb.dias))'],
  ['as datas simples ficam com a mais antiga', 'return y > x ? y : x;', 'return y < x ? y : x;'],
  ['primeiraTroca fica com a mais recente', 'return y < x ? y : x;', 'return y > x ? y : x;'],
  ['recebidos/entregues ficam com o menor', "return Math.max(ok1 ? p : 0, ok2 ? q : 0);", "return Math.min(ok1 ? p : 0, ok2 ? q : 0);"],
  ['a data deixa de ser validada', "return (typeof x === 'string' && /^\\d{4}-\\d{2}-\\d{2}$/.test(x)) ? x : null;", "return (typeof x === 'string') ? x : null;"],
  ['o copo de bagaceira perde-se', 'if (bag !== null) h.bagaceiraDia = bag;', ''],
  ['visitas.hoje: feita só do base', 'feita: x.feita || y.feita', 'feita: x.feita'],
  ['visitas.hoje: ids diferentes ficam com o do outro', "if (x.id !== y.id) return x;", "if (x.id !== y.id) return y;"],
  ['visitas.hoje: o dia mais antigo ganha', 'if (y.dia > x.dia) return y;', 'if (y.dia < x.dia) return y;'],
  ['despensa.hoje: ganha o dia mais antigo', 'if (dx > dy) return { dia: dx, feitas: nuvemLevesFeitas(x.feitas) };', 'if (dx < dy) return { dia: dx, feitas: nuvemLevesFeitas(x.feitas) };'],
  ['loja: no mesmo dia fica o menor', "else loja = { dia: lojaDa, vendasHoje: Math.max(nuvemLevesInteiro(oa.vendasHoje), nuvemLevesInteiro(ob.vendasHoje)) };", "else loja = { dia: lojaDa, vendasHoje: Math.min(nuvemLevesInteiro(oa.vendasHoje), nuvemLevesInteiro(ob.vendasHoje)) };"],
  ['o ramo "nuvem ganha" não junta as áreas', 'NUVEM_LEVES_AREAS.forEach(function (k) { state[k] = levesJuntas[k]; });', ''],
  ['o ramo "local ganha" não junta as áreas', 'NUVEM_LEVES_AREAS.forEach(function (k) { state[k] = leves[k]; });', ''],
  ['o ramo "local ganha" não conta as áreas no "mudou"', 'NUVEM_LEVES_AREAS.some(function (k) { return JSON.stringify(leves[k]) !== JSON.stringify(state[k]); })', 'false'],
  ['o ramo "local ganha" grava sempre', 'if (localEm > nuvemEm || mudou || havia)', 'if (true)'],
  ['a junção usa só o estado de base', 'const leves = nuvemJuntarLeves(state, estadoNuvem);', 'const leves = nuvemJuntarLeves(state, state);'],
  ['as feitas da despensa ficam todas (também as false)', "if (k !== '__proto__' && m[k] === true) r[k] = true;", "if (k !== '__proto__') r[k] = m[k];"],
  ['a Loja ignora o dia mais recente', 'else if (lojaDb > lojaDa) loja = { dia: lojaDb, vendasHoje: nuvemLevesInteiro(ob.vendasHoje) };', 'else if (lojaDb > lojaDa) loja = { dia: lojaDa, vendasHoje: nuvemLevesInteiro(oa.vendasHoje) };']
];
let apanhadas = 0;
MUTACOES.forEach(function (m) {
  const partes = NUVEM_JS.split(m[1]);
  if (partes.length < 2) { console.log('FALHA: mutação impossível (texto não encontrado em nuvem.js): ' + m[0]); falhou++; return; }
  const f = correr(partes.join(m[2]));
  if (f.length === 0) { console.log('FALHA: mutação não apanhada: ' + m[0]); falhou++; } else apanhadas++;
});

console.log(falhou === 0 ? 'OK (' + apanhadas + ' mutações apanhadas)' : falhou + ' FALHA(S)');
process.exit(falhou === 0 ? 0 : 1);
