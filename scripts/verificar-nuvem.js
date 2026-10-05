#!/usr/bin/env node
// Verifica a hora de gravação (ultimaGravacaoEm) no arranque: gravações de
// arranque não a mudam, uma ação do jogador muda, e o comparador de
// nuvemSincronizarAoAbrir() (js/nuvem.js) continua a escolher bem. Só LÊ js/,
// corre-os num ambiente simulado (vm) com uma nuvem falsa em memória: nunca
// toca em browser, Telegram nem conta real.
//
// Uso: node scripts/verificar-nuvem.js [caminho/alternativo/state.js]
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const STATE_JS = process.argv[2] || path.join(RAIZ, 'js', 'state.js');
const NUVEM_JS = path.join(RAIZ, 'js', 'nuvem.js');

let falhas = 0;
function ok(cond, msg) { if (!cond) { falhas++; console.log('FALHA: ' + msg); } }

// Nuvem falsa (CloudStorage): modo 'ok', 'erro' (devolve erro) ou 'silencio'
// (nunca responde). Cada pedido de escrita fica registado em .escritas.
function nuvemFalsa(inicial) {
  const dados = Object.assign({}, inicial);
  const f = { modo: 'ok', dados: dados, escritas: 0 };
  function responde(cb, erro, valor) {
    if (f.modo === 'silencio') return;
    if (f.modo === 'erro') { cb(new Error('avaria')); return; }
    cb(erro, valor);
  }
  f.getItem = function (k, cb) { responde(cb, null, Object.prototype.hasOwnProperty.call(dados, k) ? dados[k] : ''); };
  f.getItems = function (ks, cb) {
    const r = {};
    ks.forEach(function (k) { r[k] = Object.prototype.hasOwnProperty.call(dados, k) ? dados[k] : ''; });
    responde(cb, null, r);
  };
  f.setItem = function (k, v, cb) { f.escritas++; dados[k] = v; if (cb) responde(cb, null, true); };
  return f;
}

function guardarNaNuvem(nuvem, estado, em) {
  const texto = JSON.stringify(estado);
  nuvem.dados.yc_state_meta = JSON.stringify({ partes: 1, atualizadoEm: em });
  nuvem.dados.yc_state_parte_0 = texto;
}

// Abre o "jogo": localStorage guardado (partilhado entre sessões do teste),
// relógio controlado, e opcionalmente o nuvem.js com a nuvem falsa.
function abrir(localStorageDados, relogio, nuvem, comNuvemJs) {
  const pointer = [];
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
    setTimeout: function () { return 1; },
    clearTimeout: function () {},
    applyTranslations: function () {},
    t: function (k) { return k; },
    Date: class extends Date { static now() { return relogio.t; } }
  };
  sandbox.window = sandbox;
  sandbox.window.addEventListener = function () {};
  sandbox.Telegram = { WebApp: nuvem ? { initDataUnsafe: { a: 1 }, CloudStorage: nuvem } : {} };
  const ctx = vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(STATE_JS, 'utf8'), ctx, { filename: 'state.js' });
  if (comNuvemJs) vm.runInContext(fs.readFileSync(NUVEM_JS, 'utf8'), ctx, { filename: 'nuvem.js' });
  return {
    ctx: ctx,
    ev: function (codigo) { return vm.runInContext(codigo, ctx); },
    tocar: function () { pointer.forEach(function (fn) { fn(); }); }
  };
}

function estadoGuardado(dados) { return JSON.parse(dados.yoshicat_quinta_state_v2); }

// (a) estado velho: a gravação de arranque guarda o conteúdo mas NÃO muda o carimbo.
{
  const ls = { yoshicat_quinta_state_v2: JSON.stringify({ reputacao: 50, ultimaGravacaoEm: 1000 }) };
  const j = abrir(ls, { t: 9000 });
  j.ev("state.objetivos.dia = '2026-10-05'; saveState(state);"); // como objetivos.js:147 ao abrir
  ok(j.ev('state.ultimaGravacaoEm') === 1000, '(a) o carimbo mudou numa gravação de arranque');
  const g = estadoGuardado(ls);
  ok(g.ultimaGravacaoEm === 1000, '(a) o carimbo guardado mudou');
  ok(g.objetivos.dia === '2026-10-05' && g.reputacao === 50, '(a) o conteúdo não foi guardado');
  ok(j.ev('arranque.localEm') === 1000, '(a) arranque.localEm devia ser 1000');
}

// (b) depois de um toque, a gravação carimba "agora".
{
  const ls = { yoshicat_quinta_state_v2: JSON.stringify({ reputacao: 50, ultimaGravacaoEm: 1000 }) };
  const j = abrir(ls, { t: 9000 });
  j.tocar();
  j.ev('state.gotas += 1; saveState(state);');
  ok(j.ev('state.ultimaGravacaoEm') === 9000, '(b) o carimbo não mudou depois de um toque');
  ok(estadoGuardado(ls).ultimaGravacaoEm === 9000, '(b) o carimbo guardado não mudou');
}

// (c) carimbo 0 (jogador antigo sem carimbo) continua a carimbar, sem toque.
{
  const ls = { yoshicat_quinta_state_v2: JSON.stringify({ reputacao: 50, ultimaGravacaoEm: 0 }) };
  const j = abrir(ls, { t: 9000 });
  j.ev('saveState(state);');
  ok(j.ev('state.ultimaGravacaoEm') === 9000, '(c) carimbo 0 devia carimbar');
}

// (d) cenário de 04/10, até onde dá sem mexer em nuvem.js: um aparelho com estado
// velho abre, grava no arranque, a nuvem não responde; na abertura seguinte a nuvem
// (jogada noutro aparelho) responde e deve ganhar, não ser sobreposta.
{
  const bom = { reputacao: 80, uvas: 5, ultimaGravacaoEm: 5000 };
  const ls = { yoshicat_quinta_state_v2: JSON.stringify({ reputacao: 50, ultimaGravacaoEm: 1000 }) };
  const nuvem = nuvemFalsa({});
  guardarNaNuvem(nuvem, bom, 5000);

  nuvem.modo = 'silencio'; // abertura 1: arranque grava, a nuvem não responde
  const a1 = abrir(ls, { t: 9000 }, nuvem, true);
  a1.ev("saveState(state);");
  ok(nuvem.escritas === 0, '(d) abertura 1: algo foi enviado à nuvem sem leitura');
  ok(a1.ev('state.ultimaGravacaoEm') === 1000, '(d) abertura 1: o carimbo mudou');

  nuvem.modo = 'ok'; // abertura 2: a nuvem responde
  const a2 = abrir(ls, { t: 20000 }, nuvem, true);
  ok(a2.ev('arranque.localEm') === 1000, '(d) abertura 2: o carimbo local devia continuar velho');
  ok(a2.ev("arranque.ganhou") === 'nuvem', '(d) a nuvem devia ganhar, ganhou: ' + a2.ev('arranque.ganhou'));
  ok(a2.ev('state.reputacao') === 80, '(d) a reputação devia voltar a 80');
  ok(estadoGuardado(ls).reputacao === 80, '(d) o localStorage devia ficar com a nuvem');
}

// (d2) o local é mesmo mais recente: ganha e a nuvem é alinhada (o carimbo enviado é o
// da última ação real, não o de agora).
{
  const ls = { yoshicat_quinta_state_v2: JSON.stringify({ reputacao: 90, ultimaGravacaoEm: 7000 }) };
  const nuvem = nuvemFalsa({});
  guardarNaNuvem(nuvem, { reputacao: 80, ultimaGravacaoEm: 5000 }, 5000);
  const j = abrir(ls, { t: 20000 }, nuvem, true);
  ok(j.ev('arranque.ganhou') === 'local', '(d2) o local devia ganhar, ganhou: ' + j.ev('arranque.ganhou'));
  ok(j.ev('state.reputacao') === 90, '(d2) a reputação local devia manter-se');
}

// (d3) sem toque e depois de a nuvem ser adotada, o carimbo fica o da nuvem (não "agora").
{
  const ls = { yoshicat_quinta_state_v2: JSON.stringify({ reputacao: 10, ultimaGravacaoEm: 1000 }) };
  const nuvem = nuvemFalsa({});
  guardarNaNuvem(nuvem, { reputacao: 80, ultimaGravacaoEm: 5000 }, 5000);
  const j = abrir(ls, { t: 20000 }, nuvem, true);
  j.ev('saveState(state);');
  ok(j.ev('state.ultimaGravacaoEm') === 5000, '(d3) o carimbo adotado da nuvem mudou sem toque');
}

console.log(falhas === 0 ? 'OK' : falhas + ' FALHA(S)');
process.exit(falhas === 0 ? 0 : 1);
