#!/usr/bin/env node
// Verifica as conquistas ganhas (permanentes): state.conquistasGanhas (js/state.js), conquistasRegistarGanhas() e a regra
// "feita = ganha OU cumprida" (js/conquistas.js), a medalha «Guardião» (js/explorar.js) e a união entre aparelhos
// (nuvemJuntarConquistas() e os ramos de nuvemTratarLeitura()/nuvemAplicarReleitura(), js/nuvem.js).
// Só LÊ js/, corre-os num ambiente simulado (vm) com uma nuvem falsa em memória: nunca toca em browser, Telegram nem conta real.
//
//   (a) defaultState() tem o campo e um save antigo sem ele funciona
//   (b) uma conquista cumprida fica registada e continua feita depois de o progresso "baixar" (o «Sábio» e o «Guardião»
//       com uma entrada nova na Enciclopédia; as garrafas a descer)
//   (c) uma conquista não cumprida não é registada
//   (d) o registo é idempotente (não grava duas vezes) e só grava quando há algo novo
//   (e) a união na nuvem nos dois ramos (local ganha e nuvem ganha) e na releitura: cada aparelho fica com tudo, só grava se mudou
//   (f) entradas estragadas (null, números, listas, false, '__proto__', chaves compridas) não rebentam nem entram
//   (g) desbloquear uma entrada da Enciclopédia chama o registo; o registo também corre ao arrancar (com a nuvem já
//       sincronizada, nunca antes) e depois de uma releitura que adote a nuvem; o Perfil e as Conquistas chamam-no ao desenhar
// No fim corre mutações: estraga os js/ de propósito e confirma que este teste dá por isso.
//
// Uso: node scripts/verificar-conquistas-ganhas.js
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const LER = function (n) { return fs.readFileSync(path.join(RAIZ, 'js', n + '.js'), 'utf8'); };
const FONTES = { state: LER('state'), nuvem: LER('nuvem'), explorar: LER('explorar'), niveis: LER('niveis'), capitulos: LER('capitulos'), conquistas: LER('conquistas') };
const PERFIL_JS = LER('perfil');
const CHAVE = 'yoshicat_quinta_state_v2';
const MIN = 60000;

// Nuvem falsa (CloudStorage) em memória. modo: 'ok' | 'erro' | 'pausa'.
function nuvemFalsa() {
  const dados = {};
  const f = { dados: dados, modo: 'ok', escritas: 0, presas: [] };
  function responde(cb, erro, valor) {
    if (f.modo === 'erro') { cb(new Error('avaria')); return; }
    if (f.modo === 'pausa') { f.presas.push(function () { cb(erro, valor); }); return; }
    cb(erro, valor);
  }
  f.getItem = function (k, cb) { responde(cb, null, Object.prototype.hasOwnProperty.call(dados, k) ? dados[k] : ''); };
  f.getItems = function (ks, cb) {
    const r = {};
    ks.forEach(function (k) { r[k] = Object.prototype.hasOwnProperty.call(dados, k) ? dados[k] : ''; });
    responde(cb, null, r);
  };
  f.setItem = function (k, v, cb) { f.escritas++; dados[k] = v; if (cb) cb(null, true); };
  f.soltar = function () { const p = f.presas; f.presas = []; p.forEach(function (fn) { fn(); }); };
  f.guardar = function (estado, em) {
    dados.yc_state_meta = JSON.stringify({ partes: 1, atualizadoEm: em });
    dados.yc_state_parte_0 = JSON.stringify(estado);
  };
  f.estado = function () { return JSON.parse(dados.yc_state_parte_0); };
  return f;
}

// Abre o "jogo" (os js/ dados) num ambiente simulado, com relógio e visibilidade controlados.
// opcoes.nuvem: nuvem falsa (sem ela: fora do Telegram, só localStorage).
function abrir(fontes, ls, relogio, nuvem) {
  const visib = [];
  const temporizadores = [];
  let proximoId = 1;
  const html = { innerHTML: '' };
  const doc = {
    addEventListener: function (tipo, fn) { if (tipo === 'visibilitychange') visib.push(fn); },
    querySelectorAll: function () { return []; },
    querySelector: function () { return null; },
    getElementById: function () { return html; },
    visibilityState: 'visible'
  };
  const sandbox = {
    console: { log() {}, warn() {}, error() {} },
    localStorage: {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(ls, k) ? ls[k] : null; },
      setItem: function (k, v) { ls[k] = String(v); },
      removeItem: function (k) { delete ls[k]; }
    },
    location: { search: '' },
    URLSearchParams: URLSearchParams,
    document: doc,
    setTimeout: function (fn, ms) { const id = proximoId++; temporizadores.push({ id: id, em: relogio.t + (ms || 0), fn: fn }); return id; },
    clearTimeout: function (id) { const i = temporizadores.findIndex(function (x) { return x.id === id; }); if (i !== -1) temporizadores.splice(i, 1); },
    applyTranslations: function () {},
    atualizarDialogo: function () {},
    t: function (k) { return k; },
    currentLang: 'pt',
    Date: class extends Date { static now() { return relogio.t; } }
  };
  sandbox.window = sandbox;
  sandbox.window.addEventListener = function () {};
  sandbox.Telegram = { WebApp: nuvem ? { initDataUnsafe: { a: 1 }, CloudStorage: nuvem } : {} };
  const ctx = vm.createContext(sandbox);
  ['state', 'nuvem', 'explorar', 'niveis', 'capitulos', 'conquistas'].forEach(function (n) { vm.runInContext(fontes[n], ctx, { filename: n + '.js' }); });
  // conta as gravações no aparelho (saveState)
  vm.runInContext('var SAVES = 0; (function () { const o = saveState; saveState = function (s) { SAVES++; return o(s); }; })();', ctx);
  const g = {
    ev: function (c) { return vm.runInContext(c, ctx); },
    json: function (c) { return JSON.parse(vm.runInContext('JSON.stringify(' + c + ')', ctx)); },
    html: html,
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
    },
    evento: function (estado) { doc.visibilityState = estado; visib.slice().forEach(function (fn) { fn(); }); },
    ciclo: function (ms) { g.evento('hidden'); g.avancar(ms); g.evento('visible'); },
    ganhas: function () { return g.json('state.conquistasGanhas'); }
  };
  return g;
}

function J(x) { return JSON.stringify(x); }
const CLAVES = function (o) { return Object.keys(o).sort().join(); };
// Todas as entradas da Enciclopédia desbloqueadas (ids), lidos do próprio jogo.
function todasAsEntradas(g) { return g.json('ENCYCLOPEDIA_ENTRIES.pt.map(function (e) { return e.id; })'); }

function jogoSemNuvem(fontes, estado) {
  const ls = {};
  if (estado) ls[CHAVE] = J(estado);
  return { g: abrir(fontes, ls, { t: 1000000 }, null), ls: ls };
}

function correr(fontes, perfilJs) {
  const falhas = [];
  function ok(cond, msg) { if (!cond) falhas.push(msg); }
  const em = 500000;

  // ---------------------------------------------------------------- (a) o campo e os saves antigos
  {
    const x = jogoSemNuvem(fontes, null);
    ok(J(x.g.json('defaultState().conquistasGanhas')) === '{}', '(a) defaultState() devia ter conquistasGanhas: {}');
    ok(J(x.g.json('mergeDeep(defaultState(), { reputacao: 7, garrafas: 2 }).conquistasGanhas')) === '{}', '(a) um save antigo sem o campo devia ganhar {}');
    const antigo = jogoSemNuvem(fontes, { reputacao: 7, ultimaGravacaoEm: em });
    ok(J(antigo.g.json('state.conquistasGanhas')) === '{}' && antigo.g.ev('state.reputacao') === 7, '(a) um save antigo devia abrir com o campo vazio e o resto igual');
    ok(jogoSemNuvem(fontes, { garrafas: 2, ultimaGravacaoEm: em }).g.ev('conquistasCumpridas()') >= 1, '(a) com um save antigo as conquistas continuam a contar pelo progresso');
    const comCampo = jogoSemNuvem(fontes, { conquistasGanhas: { primeira_garrafa: true } });
    ok(comCampo.g.ev('conquistaFeita(CONQUISTAS_CONFIG[0])') === true, '(a) um save com o campo devia usá-lo');
  }

  // ---------------------------------------------------------------- (b) ganha fica ganha
  {
    const x = jogoSemNuvem(fontes, { garrafas: 1, reputacao: 0, ultimaGravacaoEm: em });
    const g = x.g;
    g.ev('state.encyclopedia.unlocked = ' + J(todasAsEntradas(g)) + ';');
    ok(g.ev('conquistasRegistarGanhas()') === true, '(b) devia registar o que está cumprido');
    const ganhas = g.ganhas();
    ok(ganhas.primeira_garrafa === true && ganhas.sabio === true && ganhas.curioso === true && ganhas.guardiao === true, '(b) devia registar primeira_garrafa, curioso, sabio e guardiao: ' + J(ganhas));
    ok(Object.keys(ganhas).every(function (k) { return ganhas[k] === true; }), '(b) o mapa só tem true');
    const cumpridasAntes = g.ev('conquistasCumpridas()');
    // a Enciclopédia ganha uma entrada nova (nas 3 línguas) e a medalha e o «Sábio» deixavam de estar cumpridos
    g.ev("['pt', 'en', 'es'].forEach(function (l) { ENCYCLOPEDIA_ENTRIES[l].push({ id: 'nova', manual: true, titulo: 'N', texto: 'N' }); });");
    const sabio = function () { return g.ev('conquistaFeita(CONQUISTAS_CONFIG.filter(function (c) { return c.id === "sabio"; })[0])'); };
    ok(g.ev('tituloEspecialCumprido()') === false, '(b) com a entrada nova a medalha já não está cumprida agora');
    ok(g.ev('CONQUISTAS_CONFIG.filter(function (c) { return c.id === "sabio"; })[0].cumprida()') === false, '(b) com a entrada nova o «Sábio» já não está cumprido agora');
    ok(sabio() === true, '(b) mas o «Sábio» continua feito (já estava ganho)');
    ok(g.ev('tituloEspecialDesbloqueado()') === true, '(b) e a medalha «Guardião» continua desbloqueada');
    ok(g.ev('conquistasCumpridas()') === cumpridasAntes, '(b) o n / total não desce');
    // as garrafas "descem" (progresso baixa)
    g.ev('state.garrafas = 0;');
    ok(g.ev('conquistaFeita(CONQUISTAS_CONFIG[0])') === true, '(b) a primeira garrafa continua feita com o progresso a baixar');
    // o ecrã de Conquistas mostra-as como cumpridas
    g.ev('renderConquistas();');
    const cartoes = g.html.innerHTML.split('<div class="encyclopedia-card').slice(1);
    ok(cartoes.length === g.ev('CONQUISTAS_CONFIG.length') && cartoes.filter(function (c) { return c.indexOf(' locked') === 0; }).length === g.ev('CONQUISTAS_CONFIG.length') - cumpridasAntes, '(b) o ecrã das Conquistas devia mostrar como cumpridas as ganhas (' + cartoes.filter(function (c) { return c.indexOf(' locked') === 0; }).length + ' por fazer)');
    ok(g.html.innerHTML.indexOf(cumpridasAntes + ' / ' + g.ev('CONQUISTAS_CONFIG.length')) !== -1, '(b) o resumo n / total do ecrã devia manter ' + cumpridasAntes);
    ok(g.ev('conquistasResumo()') === cumpridasAntes + ' / ' + g.ev('CONQUISTAS_CONFIG.length'), '(b) conquistasResumo() devia manter o n');
    // gravado no aparelho
    ok(JSON.parse(x.ls[CHAVE]).conquistasGanhas.sabio === true, '(b) o registo devia ficar gravado no aparelho');
  }

  // ---------------------------------------------------------------- (c) a não cumprida não se regista
  {
    const x = jogoSemNuvem(fontes, { garrafas: 1, ultimaGravacaoEm: em });
    const g = x.g;
    g.ev('conquistasRegistarGanhas()');
    const ganhas = g.ganhas();
    ok(ganhas.primeira_garrafa === true, '(c) a primeira garrafa está cumprida e devia ficar registada');
    ok(!('cinco_garrafas' in ganhas) && !('sabio' in ganhas) && !('guardiao' in ganhas) && !('dez_garrafas' in ganhas), '(c) o que não está cumprido não devia ficar registado: ' + J(ganhas));
    ok(g.ev('conquistaFeita(CONQUISTAS_CONFIG.filter(function (c) { return c.id === "cinco_garrafas"; })[0])') === false, '(c) cinco_garrafas não está feita');
    ok(g.ev('tituloEspecialDesbloqueado()') === false, '(c) a medalha não está desbloqueada');
    // ainda por registar (ex.: o registo ainda não correu): cumprida agora conta na mesma
    const g2 = jogoSemNuvem(fontes, { garrafas: 1, ultimaGravacaoEm: em }).g;
    g2.ev('state.conquistasGanhas = {}; state.encyclopedia.unlocked = ' + J(todasAsEntradas(g2)) + ';');
    ok(g2.ev('conquistaFeita(CONQUISTAS_CONFIG[0])') === true && g2.ev('conquistasCumpridas()') >= 3, '(c) o que está cumprido agora conta mesmo sem estar registado');
    ok(g2.ev('tituloEspecialDesbloqueado()') === true, '(c) a medalha com todas as entradas conta mesmo sem estar registada');
    const vazio = jogoSemNuvem(fontes, { ultimaGravacaoEm: em });
    ok(vazio.g.ev('conquistasRegistarGanhas()') === false && J(vazio.g.ganhas()) === '{}', '(c) sem nada cumprido não se regista nada');
  }

  // ---------------------------------------------------------------- (d) idempotente
  {
    const x = jogoSemNuvem(fontes, { ultimaGravacaoEm: em });
    const g = x.g;
    g.ev('state.garrafas = 5;');
    const s0 = g.ev('SAVES');
    ok(g.ev('conquistasRegistarGanhas()') === true && g.ev('SAVES') === s0 + 1, '(d) a 1.ª chamada com novidades devia gravar uma vez, gravou ' + (g.ev('SAVES') - s0));
    ok(g.ev('conquistasRegistarGanhas()') === false && g.ev('conquistasRegistarGanhas()') === false && g.ev('SAVES') === s0 + 1, '(d) chamar outra vez não devia gravar');
    g.ev('state.garrafas = 10;');
    ok(g.ev('conquistasRegistarGanhas()') === true && g.ev('SAVES') === s0 + 2 && g.ganhas().dez_garrafas === true, '(d) uma conquista nova devia gravar mais uma vez');
    ok(g.ev('conquistasRegistarGanhas()') === false && g.ev('SAVES') === s0 + 2, '(d) e outra vez sem novidades não grava');
  }

  // ---------------------------------------------------------------- (e) união entre aparelhos
  const uniao = function (nome, localEstado, nuvemEstado, esperado, opcoes) {
    opcoes = opcoes || {};
    const nuvem = nuvemFalsa();
    nuvem.guardar(localEstado, localEstado.ultimaGravacaoEm); // à abertura a nuvem é igual ao local
    const ls = {}; ls[CHAVE] = J(localEstado);
    const relogio = { t: 2000000 };
    const g = abrir(fontes, ls, relogio, nuvem);
    g.avancar(2000);
    return { g: g, nuvem: nuvem, ls: ls, relogio: relogio };
  };
  {
    // ramo "local ganha": o local é mais recente, a nuvem tem outra conquista
    const nuvem = nuvemFalsa();
    nuvem.guardar({ reputacao: 0, ultimaGravacaoEm: em, conquistasGanhas: { teste_b: true } }, em);
    const ls = {}; ls[CHAVE] = J({ reputacao: 0, ultimaGravacaoEm: em + 1000, conquistasGanhas: { teste_a: true } });
    const g = abrir(fontes, ls, { t: 2000000 }, nuvem);
    g.avancar(2000);
    ok(g.ev('arranque.ganhou') === 'local', '(e) devia ganhar o local, ganhou ' + g.ev('arranque.ganhou'));
    ok(CLAVES(g.ganhas()) === 'teste_a,teste_b', '(e) ramo local: o aparelho devia ficar com as duas: ' + J(g.ganhas()));
    ok(CLAVES(nuvem.estado().conquistasGanhas) === 'teste_a,teste_b', '(e) ramo local: a nuvem devia ficar com as duas: ' + J(nuvem.estado().conquistasGanhas));
  }
  {
    // ramo "nuvem ganha": a nuvem é mais recente, o local tem outra conquista
    const nuvem = nuvemFalsa();
    nuvem.guardar({ reputacao: 50, ultimaGravacaoEm: em + 5000, conquistasGanhas: { teste_b: true } }, em + 5000);
    const ls = {}; ls[CHAVE] = J({ reputacao: 0, ultimaGravacaoEm: em, conquistasGanhas: { teste_a: true } });
    const g = abrir(fontes, ls, { t: 2000000 }, nuvem);
    g.avancar(2000);
    ok(g.ev('arranque.ganhou') === 'nuvem', '(e) devia ganhar a nuvem, ganhou ' + g.ev('arranque.ganhou'));
    ok(g.ev('state.reputacao') === 50, '(e) ramo nuvem: devia adotar a nuvem');
    ok(CLAVES(g.ganhas()) === 'teste_a,teste_b', '(e) ramo nuvem: o aparelho devia ficar com as duas: ' + J(g.ganhas()));
    ok(CLAVES(JSON.parse(ls[CHAVE]).conquistasGanhas) === 'teste_a,teste_b', '(e) ramo nuvem: o localStorage devia ficar com as duas');
  }
  {
    // só grava na nuvem quando algo mudou: estados iguais. Ao abrir, niveis.js e capitulos.js gravam logo (gravações de
    // arranque, que fazem o jogo reenviar uma vez), por isso compara-se com um controlo igual mas sem conquistas ganhas.
    const completo = jogoSemNuvem(fontes, null).g.json('defaultState()'); // estado completo (sem campos em falta que a junção normalizasse)
    const abrirIgual = function (ganhasLocal, ganhasNuvem) {
      const nuvem = nuvemFalsa();
      nuvem.guardar(Object.assign({}, completo, { ultimaGravacaoEm: em, conquistasGanhas: ganhasNuvem }), em);
      const ls = {}; ls[CHAVE] = J(Object.assign({}, completo, { ultimaGravacaoEm: em, conquistasGanhas: ganhasLocal }));
      const g = abrir(fontes, ls, { t: 2000000 }, nuvem);
      g.avancar(2000);
      return nuvem.escritas;
    };
    const controlo = abrirIgual({}, {});
    ok(abrirIgual({ teste_b: true, teste_a: true }, { teste_a: true, teste_b: true }) === controlo, '(e) conquistas iguais (mesmo noutra ordem) não deviam provocar gravações na nuvem a mais do que o controlo sem conquistas (' + controlo + ')');
    ok(abrirIgual({ teste_a: true }, { teste_a: true }) === controlo, '(e) uma conquista igual dos dois lados não devia provocar gravações a mais');
  }
  {
    // releitura: dois aparelhos com uma conquista cada, nos dois ramos
    ['local', 'nuvem'].forEach(function (ramo) {
      const nuvem = nuvemFalsa();
      const estadoLocal = { reputacao: 0, ultimaGravacaoEm: em, conquistasGanhas: { teste_a: true } };
      nuvem.guardar(estadoLocal, em);
      const ls = {}; ls[CHAVE] = J(estadoLocal);
      const relogio = { t: 2000000 };
      const g = abrir(fontes, ls, relogio, nuvem);
      g.avancar(2000);
      // o outro aparelho grava
      const outro = ramo === 'local' ? { reputacao: 0, ultimaGravacaoEm: em - 100, conquistasGanhas: { teste_b: true } } : { reputacao: 40, ultimaGravacaoEm: em + 9000, conquistasGanhas: { teste_b: true } };
      nuvem.guardar(outro, outro.ultimaGravacaoEm);
      nuvem.escritas = 0;
      g.ciclo(MIN * 3);
      ok(CLAVES(g.ganhas()) === 'teste_a,teste_b', '(e) releitura (' + ramo + '): o aparelho devia ficar com as duas: ' + J(g.ganhas()));
      if (ramo === 'local') ok(CLAVES(nuvem.estado().conquistasGanhas) === 'teste_a,teste_b', '(e) releitura (local): a nuvem devia ficar com as duas: ' + J(nuvem.estado().conquistasGanhas));
      else ok(g.ev('state.reputacao') === 40, '(e) releitura (nuvem): devia adotar a nuvem');
      // repetir sem novidades: não grava
      nuvem.guardar(nuvem.estado(), JSON.parse(nuvem.dados.yc_state_meta).atualizadoEm);
      const esc = nuvem.escritas;
      g.ciclo(MIN * 3);
      ok(nuvem.escritas === esc || ramo === 'nuvem' && nuvem.escritas === esc, '(e) releitura (' + ramo + '): sem novidades não devia gravar, gravou ' + (nuvem.escritas - esc));
    });
  }

  // ---------------------------------------------------------------- (f) entradas estragadas
  {
    const x = jogoSemNuvem(fontes, null);
    const g = x.g;
    const lixo = [null, undefined, 5, 'texto', true, [], ['a', 'b'], { a: false }, { a: 1 }, { a: 'true' }, { a: null }, { a: {} }, { a: [true] },
      JSON.parse('{"__proto__":true,"ok":true}'), JSON.parse('{"__proto__":{"x":true}}'), { '': true, valida: true }, (function () { const o = {}; o['k'.repeat(65)] = true; o['k'.repeat(64)] = true; return o; })()];
    let rebentou = null;
    lixo.forEach(function (a, ia) {
      lixo.forEach(function (b, ib) {
        try {
          const lit = function (v) { return v === undefined ? 'undefined' : 'JSON.parse(' + J(J(v)) + ')'; };
          const r = g.json('nuvemJuntarConquistas(' + lit(a) + ', ' + lit(b) + ')');
          ok(r && typeof r === 'object' && !Array.isArray(r) && Object.keys(r).every(function (k) { return r[k] === true && k.length >= 1 && k.length <= 64 && k !== '__proto__'; }), '(f) lixo ' + ia + '/' + ib + ': só chaves válidas com true');
          const r2 = g.json('nuvemJuntarConquistas(' + lit(b) + ', ' + lit(a) + ')');
          ok(J(r) === J(r2), '(f) lixo ' + ia + '/' + ib + ': o resultado depende da ordem dos argumentos');
        } catch (e) { rebentou = rebentou || ('lixo ' + ia + '/' + ib + ': ' + e.message); }
      });
    });
    ok(rebentou === null, '(f) entradas estragadas não deviam rebentar: ' + rebentou);
    const r = g.json('nuvemJuntarConquistas({ a: true, b: false, c: 1, d: "true", e: null, f: [], g: true }, { g: true, h: true, "": true })');
    ok(J(g.json('nuvemJuntarConquistas([true, true], { length: true })')) === '{"length":true}' && J(g.json('nuvemJuntarConquistas([true, true], null)')) === '{}', '(f) listas não contam (as chaves "0", "1" não entram)');
    ok(J(r) === '{"a":true,"g":true,"h":true}', '(f) só entram as chaves com true exatamente (por ordem): ' + J(r));
    ok(g.ev('Object.keys(nuvemJuntarConquistas(JSON.parse(\'{"__proto__":true}\'), null)).length') === 0 && g.ev('({}).x === undefined && ({}).true === undefined'), "(f) '__proto__' não entra nem altera protótipos");
    ok(J(g.json('nuvemJuntarConquistas({ b: true, a: true }, { c: true })')) === J({ a: true, b: true, c: true }), '(f) chaves por ordem');
    ok(g.ev('(function () { const a = { x: true }; const b = { y: true }; const r = nuvemJuntarConquistas(a, b); return r !== a && r !== b && JSON.stringify(a) === \'{"x":true}\' && JSON.stringify(b) === \'{"y":true}\' && nuvemJuntarConquistas(a, null) !== a; })()'), '(f) devolve sempre um objeto novo e não altera os argumentos');
    ok(g.ev('Object.keys(nuvemJuntarConquistas("k".repeat(64) ? { ["k".repeat(64)]: true } : null, null)).length') === 1 && g.ev('Object.keys(nuvemJuntarConquistas({ ["k".repeat(65)]: true }, null)).length') === 0, '(f) 64 caracteres entram e 65 não');
    // lixo no meio de um jogo: a nuvem com um mapa estragado e o local com outro
    [{ conquistasGanhas: [1, 2] }, { conquistasGanhas: 'x' }, { conquistasGanhas: { a: false, b: 1, c: null } }, { conquistasGanhas: null }].forEach(function (estragado, i) {
      try {
        const nuvem = nuvemFalsa();
        nuvem.guardar(Object.assign({ reputacao: 0, ultimaGravacaoEm: em + 5000 }, estragado), em + 5000);
        const ls = {}; ls[CHAVE] = J({ reputacao: 0, ultimaGravacaoEm: em, conquistasGanhas: { teste_a: true } });
        const jg = abrir(fontes, ls, { t: 2000000 }, nuvem);
        jg.avancar(2000);
        ok(J(jg.ganhas()) === '{"teste_a":true}', '(f) nuvem estragada ' + i + ': o aparelho devia ficar só com a sua conquista: ' + J(jg.ganhas()));
      } catch (e) { ok(false, '(f) nuvem estragada ' + i + ' rebentou: ' + e.message); }
    });
    // o local estragado
    [5, 'x', [true], null, { a: 1 }].forEach(function (mapa, i) {
      try {
        const jg = jogoSemNuvem(fontes, { garrafas: 1, ultimaGravacaoEm: em }).g;
        jg.ev('state.conquistasGanhas = ' + J(mapa) + ';');
        jg.ev('conquistasRegistarGanhas()');
        ok(jg.ganhas().primeira_garrafa === true && jg.ev('conquistaFeita(CONQUISTAS_CONFIG[0])') === true, '(f) mapa local estragado ' + i + ': o registo devia repor um mapa válido');
        jg.ev('state.conquistasGanhas = ' + J(mapa) + '; renderConquistas(); conquistasResumo(); tituloEspecialDesbloqueado();');
      } catch (e) { ok(false, '(f) mapa local estragado ' + i + ' rebentou: ' + e.message); }
    });
  }

  // ---------------------------------------------------------------- (g) quando se regista
  {
    // desbloquear a última entrada regista logo o «Sábio» e o «Guardião» (sem abrir o Perfil)
    const x = jogoSemNuvem(fontes, { ultimaGravacaoEm: em });
    const g = x.g;
    const todas = todasAsEntradas(g);
    g.ev('state.encyclopedia.unlocked = ' + J(todas.slice(0, -1)) + ';');
    g.ev('conquistasRegistarGanhas();');
    ok(g.ganhas().sabio !== true && g.ganhas().guardiao !== true, '(g) com uma entrada por abrir não há «Sábio» nem «Guardião»');
    const s0 = g.ev('SAVES');
    g.ev('desbloquearEntradaEnciclopedia(' + J(todas[todas.length - 1]) + ');');
    ok(g.ganhas().sabio === true && g.ganhas().guardiao === true, '(g) ao desbloquear a última entrada devia registar o «Sábio» e o «Guardião»: ' + J(g.ganhas()));
    ok(g.ev('SAVES') === s0 + 1, '(g) e gravar uma vez, gravou ' + (g.ev('SAVES') - s0));
    g.ev('desbloquearEntradaEnciclopedia(' + J(todas[0]) + ');'); // já desbloqueada: nada
    ok(g.ev('SAVES') === s0 + 1, '(g) desbloquear uma já aberta não grava');
    ok(JSON.parse(x.ls[CHAVE]).conquistasGanhas.guardiao === true, '(g) o «Guardião» ficou gravado no aparelho');
    // o Perfil regista ao desenhar (ver perfil.js)
    ok(/function renderPerfil\(\) \{\n[^\n]*\n[^\n]*conquistasRegistarGanhas\(\)/.test(perfilJs), '(g) renderPerfil() devia chamar conquistasRegistarGanhas() ao desenhar');
    // o ecrã de Conquistas regista ao desenhar
    const y = jogoSemNuvem(fontes, { garrafas: 1, ultimaGravacaoEm: em }).g;
    y.ev('delete state.conquistasGanhas.primeira_garrafa; renderConquistas();');
    ok(y.ganhas().primeira_garrafa === true, '(g) renderConquistas() devia registar o que está cumprido');
  }
  {
    // ao arrancar sem nuvem (fora do Telegram): regista logo
    const x = jogoSemNuvem(fontes, { garrafas: 1, ultimaGravacaoEm: em });
    ok(x.g.ganhas().primeira_garrafa === true, '(g) ao arrancar sem nuvem devia registar já o que está cumprido: ' + J(x.g.ganhas()));
  }
  {
    // ao arrancar com nuvem: só depois de a nuvem responder; nunca antes
    const nuvem = nuvemFalsa();
    nuvem.guardar({ garrafas: 1, ultimaGravacaoEm: em }, em);
    nuvem.modo = 'pausa';
    const ls = {}; ls[CHAVE] = J({ garrafas: 1, ultimaGravacaoEm: em });
    const g = abrir(fontes, ls, { t: 2000000 }, nuvem);
    ok(J(g.ganhas()) === '{}', '(g) antes de a nuvem responder não devia registar nada: ' + J(g.ganhas()));
    nuvem.modo = 'ok';
    nuvem.soltar();
    ok(g.ganhas().primeira_garrafa === true, '(g) depois de a nuvem responder devia registar: ' + J(g.ganhas()));
  }
  {
    // nuvem com erro: não responde, não regista
    const nuvem = nuvemFalsa();
    nuvem.guardar({ garrafas: 1, ultimaGravacaoEm: em }, em);
    nuvem.modo = 'erro';
    const ls = {}; ls[CHAVE] = J({ garrafas: 1, ultimaGravacaoEm: em });
    const g = abrir(fontes, ls, { t: 2000000 }, nuvem);
    g.avancar(20000);
    ok(g.ev('arranque.respondeu') === false && J(g.ganhas()) === '{}', '(g) com a nuvem em erro (sem resposta) não devia registar: ' + J(g.ganhas()));
  }
  {
    // ao arrancar a adotar uma nuvem em que o «Sábio» e o «Guardião» estão cumpridos: ficam registados sem abrir nada
    const nuvem = nuvemFalsa();
    const g0 = jogoSemNuvem(fontes, null).g;
    const todas = todasAsEntradas(g0);
    nuvem.guardar({ reputacao: 10, ultimaGravacaoEm: em + 5000, encyclopedia: { unlocked: todas } }, em + 5000);
    const ls = {}; ls[CHAVE] = J({ reputacao: 0, ultimaGravacaoEm: em });
    const g = abrir(fontes, ls, { t: 2000000 }, nuvem);
    g.avancar(2000);
    ok(g.ganhas().sabio === true && g.ganhas().guardiao === true, '(g) ao adotar a nuvem ao abrir devia registar o «Sábio» e o «Guardião»: ' + J(g.ganhas()));
  }
  {
    // depois de uma releitura que adote a nuvem
    const nuvem = nuvemFalsa();
    const g0 = jogoSemNuvem(fontes, null).g;
    const todas = todasAsEntradas(g0);
    nuvem.guardar({ reputacao: 0, ultimaGravacaoEm: em }, em);
    const ls = {}; ls[CHAVE] = J({ reputacao: 0, ultimaGravacaoEm: em });
    const g = abrir(fontes, ls, { t: 2000000 }, nuvem);
    g.avancar(2000);
    nuvem.guardar({ reputacao: 10, ultimaGravacaoEm: em + 5000, encyclopedia: { unlocked: todas } }, em + 5000);
    g.ciclo(MIN * 3);
    ok(g.ev('state.reputacao') === 10, '(g) a releitura devia adotar a nuvem');
    ok(g.ganhas().sabio === true && g.ganhas().guardiao === true, '(g) depois de uma releitura que adota a nuvem devia registar o «Sábio» e o «Guardião»: ' + J(g.ganhas()));
  }
  return falhas;
}

// ---------------------------------------------------------------- corrida a sério
const falhasReais = correr(FONTES, PERFIL_JS);
falhasReais.slice(0, 40).forEach(function (m) { console.log('FALHA: ' + m); });
if (falhasReais.length > 40) console.log('... e mais ' + (falhasReais.length - 40) + ' falhas');
let falhou = falhasReais.length;

// ---------------------------------------------------------------- mutações
// Cada mutação: [nome, ficheiro, [[texto, substituto, n-ésima ocorrência (opcional, 1 = a primeira; sem n = todas)], ...]]
function aplicar(src, de, para, n) {
  if (src.split(de).length < 2) return null;
  if (n === undefined) return src.split(de).join(para);
  const partes = src.split(de);
  if (partes.length - 1 < n) return null;
  return partes.slice(0, n).join(de) + para + partes.slice(n).join(de);
}
const MUTACOES = [
  ['não registar nada', 'conquistas', [['if (novas.length === 0) return false;', 'return false;']]],
  ['registar a conquista não cumprida', 'conquistas', [['return !conquistaRegistada(c.id) && conquistaCumpridaAgora(c);', 'return !conquistaRegistada(c.id);']]],
  ['tirar a regra "ganha OU cumprida" (só cumprida)', 'conquistas', [['return conquistaRegistada(c.id) || conquistaCumpridaAgora(c);', 'return conquistaCumpridaAgora(c);']]],
  ['tirar a regra "ganha OU cumprida" (só ganha)', 'conquistas', [['return conquistaRegistada(c.id) || conquistaCumpridaAgora(c);', 'return conquistaRegistada(c.id);']]],
  ['conquistasCumpridas() volta a calcular só pelo progresso', 'conquistas', [['return CONQUISTAS_CONFIG.filter(conquistaFeita).length;', 'return CONQUISTAS_CONFIG.filter(conquistaCumpridaAgora).length;']]],
  ['o ecrã das Conquistas volta a calcular só pelo progresso', 'conquistas', [['const feita = conquistaFeita(c);', 'const feita = conquistaCumpridaAgora(c);']]],
  ['o ecrã das Conquistas não regista', 'conquistas', [["  conquistasRegistarGanhas();\n  const cardsHtml", '  const cardsHtml']]],
  ['a medalha deixa de usar o mapa', 'explorar', [["return (!!ganhas && typeof ganhas === 'object' && ganhas.guardiao === true) || tituloEspecialCumprido();", 'return tituloEspecialCumprido();']]],
  ['a medalha só usa o mapa', 'explorar', [["return (!!ganhas && typeof ganhas === 'object' && ganhas.guardiao === true) || tituloEspecialCumprido();", "return !!ganhas && ganhas.guardiao === true;"]]],
  ['não registar a medalha', 'conquistas', [['if (medalha) novas.push(CONQUISTAS_ID_MEDALHA);', '']]],
  ['registar a medalha sem estar cumprida', 'conquistas', [['if (medalha) novas.push(CONQUISTAS_ID_MEDALHA);', 'novas.push(CONQUISTAS_ID_MEDALHA);']]],
  ['gravar sempre ao registar (mesmo sem novidades)', 'conquistas', [['if (novas.length === 0) return false;', 'if (novas.length === 0) { if (typeof saveState === "function") saveState(state); return false; }']]],
  ['gravar duas vezes ao registar', 'conquistas', [['if (typeof saveState === \'function\') saveState(state);\n  return true;', "if (typeof saveState === 'function') { saveState(state); saveState(state); }\n  return true;"]]],
  ['não chamar o registo ao desbloquear uma entrada', 'explorar', [["if (typeof conquistasRegistarGanhas === 'function') conquistasRegistarGanhas();", '']]],
  ['o Perfil não regista ao desenhar', 'perfil', [["  if (typeof conquistasRegistarGanhas === 'function') conquistasRegistarGanhas(); // conquistas e medalha já ganhas ficam registadas\n", '']]],
  ['não registar ao arrancar (sem nuvem)', 'conquistas', [["if (typeof arranque !== 'undefined' && arranque.respondeu) conquistasRegistarGanhas();\n", '']]],
  ['registar ao arrancar antes de a nuvem responder', 'conquistas', [["// Sem nuvem (ou se ela já respondeu antes de este ficheiro carregar): regista já.\nif (typeof arranque !== 'undefined' && arranque.respondeu) conquistasRegistarGanhas();", '// Sem nuvem.\nconquistasRegistarGanhas();']]],
  ['não registar depois de a nuvem decidir ao abrir', 'conquistas', [["['nuvemTratarLeitura', 'nuvemAplicarReleitura'].forEach", "['nuvemAplicarReleitura'].forEach"]]],
  ['não registar depois de uma releitura', 'conquistas', [["['nuvemTratarLeitura', 'nuvemAplicarReleitura'].forEach", "['nuvemTratarLeitura'].forEach"]]],
  ['registar mesmo com a nuvem sem resposta', 'conquistas', [["    if (typeof arranque !== 'undefined' && arranque.respondeu) conquistasRegistarGanhas();\n    return r;", '    conquistasRegistarGanhas();\n    return r;']]],
  ['não juntar no ramo local ao abrir', 'nuvem', [['state.conquistasGanhas = conquistasJuntas;\n      state.capitulos = juntos;', 'state.capitulos = juntos;', 1]]],
  ['não juntar no ramo nuvem ao abrir', 'nuvem', [['  state.conquistasGanhas = nuvemJuntarConquistas(state.conquistasGanhas, estadoLocalAntes.conquistasGanhas);\n', '', 1]]],
  ['não juntar no ramo local da releitura', 'nuvem', [['state.conquistasGanhas = conquistasJuntas;\n      state.capitulos = juntos;', 'state.capitulos = juntos;', 2]]],
  ['não juntar no ramo nuvem da releitura', 'nuvem', [['  state.conquistasGanhas = nuvemJuntarConquistas(state.conquistasGanhas, estadoLocalAntes.conquistasGanhas);\n', '', 2]]],
  ['o ramo local ao abrir não conta as conquistas no "mudou"', 'nuvem', [[" ||\n      JSON.stringify(conquistasJuntas) !== JSON.stringify(nuvemJuntarConquistas(state.conquistasGanhas, null));", ';', 1]]],
  ['o ramo local da releitura não conta as conquistas no "mudou"', 'nuvem', [[" ||\n      JSON.stringify(conquistasJuntas) !== JSON.stringify(nuvemJuntarConquistas(state.conquistasGanhas, null));", ';', 2]]],
  ['o "mudou" compara sem pôr as chaves por ordem (grava de mais)', 'nuvem', [['JSON.stringify(nuvemJuntarConquistas(state.conquistasGanhas, null));', 'JSON.stringify(state.conquistasGanhas);']]],
  ['aceitar false (e outros valores) na união', 'nuvem', [["m[k] === true) ids[k] = true;", "typeof m[k] === 'boolean') ids[k] = true;"]]],
  ['aceitar o texto "true" na união', 'nuvem', [["m[k] === true) ids[k] = true;", "String(m[k]) === 'true') ids[k] = true;"]]],
  ['aceitar chaves compridas', 'nuvem', [['k.length >= 1 && k.length <= 64 && k', 'k.length >= 1 && k']]],
  ['aceitar a chave vazia', 'nuvem', [['k.length >= 1 && k.length <= 64', 'k.length <= 64']]],
  ['aceitar listas na união', 'nuvem', [["if (!m || typeof m !== 'object' || Array.isArray(m)) return;\n    Object.keys(m).forEach(function (k) {\n      if (k.length", "if (!m || typeof m !== 'object') return;\n    Object.keys(m).forEach(function (k) {\n      if (k.length"]]],
  ['a união depende da ordem (sem ordenar as chaves)', 'nuvem', [['Object.keys(ids).sort().forEach', 'Object.keys(ids).forEach']]],
  ['a união devolve o mesmo objeto do primeiro argumento', 'nuvem', [['  const r = {};\n  Object.keys(ids).sort()', '  const r = (a && typeof a === \'object\' && !Array.isArray(a)) ? a : {};\n  Object.keys(ids).sort()']]],
  ['a união só leva o primeiro lado', 'nuvem', [['[a, b].forEach(function (m) {', '[a].forEach(function (m) {']]],
  ['o defaultState perde o campo novo', 'state', [['    conquistasGanhas: {},\n', '']]]
];
let apanhadas = 0;
MUTACOES.forEach(function (m) {
  const fontes = Object.assign({}, FONTES);
  let perfil = PERFIL_JS;
  let src = m[1] === 'perfil' ? PERFIL_JS : FONTES[m[1]];
  for (let i = 0; i < m[2].length; i++) {
    src = aplicar(src, m[2][i][0], m[2][i][1], m[2][i][2]);
    if (src === null) { console.log('FALHA: mutação impossível (texto não encontrado em ' + m[1] + '.js): ' + m[0] + ' -> ' + m[2][i][0].slice(0, 60)); falhou++; return; }
  }
  if (m[1] === 'perfil') perfil = src; else fontes[m[1]] = src;
  let f;
  try { f = correr(fontes, perfil); } catch (e) { f = ['rebentou: ' + e.message]; }
  if (f.length === 0) { console.log('FALHA: mutação não apanhada: ' + m[0]); falhou++; } else apanhadas++;
});

console.log(falhou === 0 ? 'OK (' + apanhadas + ' mutações apanhadas)' : falhou + ' FALHA(S)');
process.exit(falhou === 0 ? 0 : 1);
