#!/usr/bin/env node
// O Alambique com dois produtos (js/alambique.js, js/garrafa.js, js/festas.js, js/objetivos.js, js/i18n.js):
//   Destilar vinho   10 Gotas   -> +1 Aguardente vínica (state.adega.aguardente)
//   Destilar bagaço   3 Bagaço  -> +1 Bagaceira (state.adega.bagaceira, campo novo)
// Cooldown 'alambique' (3 h) PARTILHADO; sem uvas; Fortificar só com vínica; a jeropiga aceita bagaceira ou vínica
// (primeiro a bagaceira); o objetivo "Usa o Alambique" nunca fica impossível.
//
// Corre os ficheiros REAIS num ambiente simulado (vm) com um relógio controlado, sem browser nem conta real.
// Depois de passar, aplica "mutações" (estraga cada regra de propósito) e confirma que o teste as apanha.
//
// Uso: node scripts/verificar-alambique.js
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const FICHEIROS = ['state.js', 'estacoes.js', 'tempo.js', 'festas.js', 'niveis.js', 'vinha.js', 'alambique.js', 'garrafa.js', 'ronda.js', 'objetivos.js', 'i18n.js', 'explorar.js', 'capitulos.js'];
const FONTES = {};
FICHEIROS.forEach(function (f) { FONTES[f] = fs.readFileSync(path.join(RAIZ, 'js', f), 'utf8'); });
const INDEX = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');

const MIN = 60 * 1000, H = 60 * MIN;
const AGORA = Date.parse('2026-10-09T10:00:00+01:00');
const CD = 3 * H;

function suite(fontes) {
  const falhas = [];
  function ok(cond, msg) { if (!cond) falhas.push(msg); }
  const sem_comentarios = function (s) { return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''); };

  // ---------------- Ambiente com os ficheiros reais ----------------
  function abrir(guardadoInicial) {
    const relogio = { t: AGORA };
    const guardado = {};
    if (guardadoInicial) guardado.yoshicat_quinta_state_v2 = JSON.stringify(guardadoInicial);
    class Relogio extends Date {
      constructor(...a) { if (a.length === 0) super(relogio.t); else super(...a); }
      static now() { return relogio.t; }
    }
    const reg = { html: '', falas: [] };
    const sb = {
      console: { log() {}, warn() {}, error() {} },
      localStorage: {
        getItem: function (k) { return Object.prototype.hasOwnProperty.call(guardado, k) ? guardado[k] : null; },
        setItem: function (k, v) { guardado[k] = String(v); },
        removeItem: function (k) { delete guardado[k]; }
      },
      location: { search: '' }, URLSearchParams: URLSearchParams, Intl: Intl,
      document: { querySelectorAll: function () { return []; }, querySelector: function () { return null; }, addEventListener: function () {},
        getElementById: function (id) { return id === 'festa-container' ? { set innerHTML(v) { reg.html = v; }, get innerHTML() { return reg.html; } } : null; } },
      setTimeout: function () { return 1; }, clearTimeout: function () {}, Image: function () {}, Date: Relogio
    };
    sb.window = sb;
    sb.addEventListener = function () {};
    sb.Telegram = { WebApp: {} };
    const cx = vm.createContext(sb);
    vm.runInContext(`
      var SAVES = 0, OBJ = [];
      function t(k) { return k; }
      function randInt(a) { return a; }
      function mostrarFalas() {} function vibrar() {} function tocarSom() {} function updateStatsDisplays() {}
      function reposicionarFlutuantes() {} function atualizarCartaoObjetivosQuinta() {}
      function localeAtual() { return 'pt-PT'; }
      function faseRealAtual() { return 'repouso'; }
      function festaAtual() { return null; }
      function jaFezTarefaTempoHoje() { return true; }
      function entradasBloqueadas() { return []; } function caveReservaAberta() { return true; }
      function garrafaQueMaisDescansou() { return 2; }
      function renderFestaHub() {} function mostrarNovaEntrada() {} function atualizarDialogo() {} function definirFundo() {}
      var currentLang = 'pt'; function goTo() {}
    `, cx);
    ['state.js', 'estacoes.js', 'tempo.js', 'festas.js', 'niveis.js', 'vinha.js', 'alambique.js', 'garrafa.js', 'ronda.js', 'explorar.js'].forEach(function (f) { vm.runInContext(fontes[f], cx, { filename: f }); });
    vm.runInContext('function ecraDesbloqueado() { return true; } function vitoriasProtegerComPremioRestantesHoje() { return 1; }', cx);
    vm.runInContext(fontes['objetivos.js'], cx, { filename: 'objetivos.js' });
    vm.runInContext(`
      var _saveReal = saveState; saveState = function (s) { SAVES++; return _saveReal(s); };
      var _marcar = marcarObjetivoCumprido; marcarObjetivoCumprido = function (id) { OBJ.push(id); };
      renderAdega = function () {}; renderFestaHub = function () {}; mostrarNovaEntrada = function () {}; goTo = function () {};
    `, cx);
    const g = { cx: cx, relogio: relogio, reg: reg };
    g.ev = function (c) { return vm.runInContext(c, cx); };
    g.json = function (c) { return JSON.parse(vm.runInContext('JSON.stringify(' + c + ')', cx)); };
    g.ir = function (ms) { relogio.t = ms; };
    return g;
  }
  function jogador(extra) {
    const g = abrir(null);
    g.ev('state.reputacao = 372; state.uvas = 773; state.gotas = 120;');
    g.ev('state.adega = Object.assign({ bagaco: 9, aguardente: 4, bagaceira: 2, cooldowns: {}, lote: null, historico: [] }, ' + JSON.stringify(extra || {}) + ');');
    return g;
  }
  const estadoPuro = function (o) { return Object.assign({ gotas: 120, uvas: 773, adega: Object.assign({ bagaco: 9, aguardente: 4, bagaceira: 2, cooldowns: {} }, o || {}) }, {}); };

  // ---------------- 1. Regras puras (js/alambique.js real) ----------------
  const pura = vm.createContext({});
  vm.runInContext(fontes['alambique.js'], pura, { filename: 'alambique.js' });
  const run = function (est, tipo, agora, cd) {
    pura.e = est; pura.tipo = tipo; pura.a = agora; pura.cd = cd === undefined ? CD : cd;
    return JSON.parse(JSON.stringify(vm.runInContext('alambiqueDestilar(e, tipo, a, cd)', pura)));
  };
  const copia = function (x) { return JSON.parse(JSON.stringify(x)); };

  { // Destilar vinho
    const e = estadoPuro();
    const r = run(e, 'vinho', AGORA);
    ok(r.ok === true && r.produto === 'vinica' && r.motivo === null, 'destilar vinho devia dar certo, deu ' + JSON.stringify(r));
    ok(e.gotas === 110 && e.adega.aguardente === 5, 'destilar vinho: -10 Gotas e +1 Aguardente vínica, ficou gotas ' + e.gotas + ' aguardente ' + e.adega.aguardente);
    ok(e.adega.bagaco === 9 && e.adega.bagaceira === 2 && e.uvas === 773, 'destilar vinho não mexe no Bagaço, na Bagaceira nem nas Uvas');
    ok(e.adega.cooldowns.alambique === AGORA, 'destilar vinho regista o cooldown "alambique"');
  }
  { // Destilar bagaço
    const e = estadoPuro();
    const r = run(e, 'bagaco', AGORA);
    ok(r.ok === true && r.produto === 'bagaceira', 'destilar bagaço devia dar certo');
    ok(e.adega.bagaco === 6 && e.adega.bagaceira === 3, 'destilar bagaço: -3 Bagaço e +1 Bagaceira, ficou ' + e.adega.bagaco + '/' + e.adega.bagaceira);
    ok(e.gotas === 120 && e.adega.aguardente === 4 && e.uvas === 773, 'destilar bagaço não mexe nas Gotas, na Aguardente vínica nem nas Uvas');
    ok(e.adega.cooldowns.alambique === AGORA, 'destilar bagaço regista o cooldown "alambique"');
  }
  { // Limites exatos
    ok(run(estadoPuro({ bagaco: 3 }), 'bagaco', AGORA).ok === true, '3 Bagaço chegam');
    let e = estadoPuro({ bagaco: 2 }); const a = copia(e);
    ok(run(e, 'bagaco', AGORA).motivo === 'faltam_bagaco' && JSON.stringify(e) === JSON.stringify(a), '2 Bagaço: falta bagaço e nada muda (nem o cooldown)');
    const e2 = estadoPuro(); e2.gotas = 10;
    ok(run(e2, 'vinho', AGORA).ok === true && e2.gotas === 0, '10 Gotas chegam');
    const e3 = estadoPuro(); e3.gotas = 9; const b = copia(e3);
    ok(run(e3, 'vinho', AGORA).motivo === 'faltam_gotas' && JSON.stringify(e3) === JSON.stringify(b), '9 Gotas: faltam Gotas e nada muda (nem o cooldown)');
    ok(e3.adega.cooldowns.alambique === undefined, 'sem recursos não se regista cooldown');
  }
  { // Cooldown partilhado
    let e = estadoPuro();
    ok(run(e, 'vinho', AGORA).ok, 'primeiro: vinho');
    let r = run(e, 'bagaco', AGORA + 1 * H);
    ok(r.ok === false && r.motivo === 'cooldown' && r.restanteMs === 2 * H, 'depois do vinho, o bagaço espera o MESMO cooldown (faltam 2 h), deu ' + JSON.stringify(r));
    r = run(e, 'vinho', AGORA + 1 * H);
    ok(r.motivo === 'cooldown', 'depois do vinho, o vinho também espera');
    ok(run(e, 'bagaco', AGORA + CD - MIN).motivo === 'cooldown', '1 min antes do fim ainda espera');
    ok(run(e, 'bagaco', AGORA + CD).ok === true, 'passado o cooldown (3 h) já se pode');
    e = estadoPuro(); run(e, 'bagaco', AGORA);
    ok(run(e, 'vinho', AGORA + 1 * H).motivo === 'cooldown', 'depois do bagaço, o vinho espera o MESMO cooldown');
    // Carimbo no futuro (relógio errado) conta como "agora"
    e = estadoPuro({ cooldowns: { alambique: AGORA + 30 * 24 * H } });
    r = run(e, 'bagaco', AGORA);
    ok(r.motivo === 'cooldown' && r.restanteMs === CD, 'carimbo no futuro conta como agora (espera só 3 h), deu ' + JSON.stringify(r));
    // Cooldown antigo
    e = estadoPuro({ cooldowns: { alambique: AGORA - CD - 1 } });
    ok(run(e, 'vinho', AGORA).ok === true, 'cooldown antigo já passou');
    // Prensar não partilha com o Alambique
    e = estadoPuro({ cooldowns: { prensar: AGORA } });
    ok(run(e, 'vinho', AGORA).ok === true, 'o cooldown do Prensar não trava o Alambique');
  }
  { // Duplo clique: o 2.º no mesmo instante não gasta nada
    const e = estadoPuro();
    run(e, 'vinho', AGORA);
    const depois = copia(e);
    const r = run(e, 'vinho', AGORA);
    ok(r.ok === false && r.motivo === 'cooldown' && JSON.stringify(e) === JSON.stringify(depois), 'duplo clique: o segundo não gasta nem soma');
    const e2 = estadoPuro(); run(e2, 'bagaco', AGORA); const d2 = copia(e2);
    ok(run(e2, 'bagaco', AGORA).ok === false && JSON.stringify(e2) === JSON.stringify(d2), 'duplo clique no bagaço: o segundo não gasta nem soma');
  }
  { // Campo bagaceira reparado
    [[undefined, 0], [-3, 0], [NaN, 0], ['x', 0], [null, 0], [Infinity, 0], [2.7, 2], [5, 5], [{}, 0], [[], 0]].forEach(function (p) {
      pura.estado = { adega: { bagaceira: p[0] } };
      vm.runInContext('alambiqueEstado(estado)', pura);
      ok(pura.estado.adega.bagaceira === p[1], 'bagaceira ' + JSON.stringify(p[0]) + ' devia passar a ' + p[1] + ', ficou ' + pura.estado.adega.bagaceira);
    });
    const e = estadoPuro({ bagaceira: 'lixo' });
    ok(run(e, 'bagaco', AGORA).ok === true && e.adega.bagaceira === 1, 'com bagaceira estranha, destilar bagaço repara e soma 1 (0 -> 1)');
    const n = estadoPuro({ bagaceira: -7 });
    run(n, 'bagaco', AGORA);
    ok(n.adega.bagaceira === 1, 'bagaceira negativa conta como 0 e fica 1');
    pura.e2 = null; ok(vm.runInContext('alambiqueEstado(e2)', pura) === null, 'estado null: não rebenta');
    pura.e3 = {}; ok(vm.runInContext('alambiqueEstado(e3)', pura) === null, 'sem adega: não rebenta');
  }
  { // Entradas inválidas: recusa sem alterar nada
    const base = estadoPuro(); const ref = JSON.stringify(base);
    [['lixo', AGORA, CD], [undefined, AGORA, CD], ['vinho', NaN, CD], ['vinho', AGORA, NaN], ['vinho', AGORA, -1], ['vinho', undefined, CD], ['bagaco', 'x', CD]].forEach(function (c) {
      const e = copia(base);
      const r = run(e, c[0], c[1], c[2]);
      ok(r.ok === false && JSON.stringify(e) === ref, 'entrada inválida ' + JSON.stringify(c) + ' devia recusar sem alterar');
    });
    ok(run(null, 'vinho', AGORA).motivo === 'estado_invalido' && run({}, 'vinho', AGORA).motivo === 'estado_invalido' && run({ adega: [] }, 'bagaco', AGORA).motivo === 'estado_invalido', 'estado inválido recusa');
  }
  { // Jeropiga: gasta primeiro a bagaceira, depois a vínica; falha sem nenhuma
    const g = function (e, n) { pura.e = e; pura.n = n; return JSON.parse(JSON.stringify(vm.runInContext('alambiqueGastarParaJeropiga(e, n)', pura))); };
    let e = { adega: { bagaceira: 2, aguardente: 5 } };
    ok(JSON.stringify(g(e, 1)) === '{"ok":true,"fonte":"bagaceira"}' && e.adega.bagaceira === 1 && e.adega.aguardente === 5, 'jeropiga com as duas: gasta a bagaceira primeiro');
    g(e, 1);
    ok(e.adega.bagaceira === 0 && e.adega.aguardente === 5, 'gasta a segunda bagaceira');
    ok(JSON.stringify(g(e, 1)) === '{"ok":true,"fonte":"vinica"}' && e.adega.aguardente === 4 && e.adega.bagaceira === 0, 'sem bagaceira, gasta a vínica');
    e = { adega: { bagaceira: 0, aguardente: 0 } }; const ref = JSON.stringify(e);
    ok(g(e, 1).ok === false && JSON.stringify(e) === ref, 'sem nenhuma: falha e nada muda');
    e = { adega: { bagaceira: 'x', aguardente: -1 } };
    ok(g(e, 1).ok === false, 'valores estranhos contam como 0');
    e = { adega: { bagaceira: 0, aguardente: 3 } };
    ok(g(e, 0).fonte === 'vinica' && e.adega.aguardente === 2, 'pedido inválido (0) conta como 1');
    pura.t1 = { adega: { bagaceira: 1, aguardente: 0 } }; pura.t2 = { adega: { bagaceira: 0, aguardente: 1 } }; pura.t3 = { adega: { bagaceira: 0, aguardente: 0 } };
    ok(vm.runInContext('alambiqueTemParaJeropiga(t1, 1) && alambiqueTemParaJeropiga(t2, 1) && !alambiqueTemParaJeropiga(t3, 1)', pura), 'alambiqueTemParaJeropiga concorda com a regra');
  }
  { // Pode destilar (objetivo nunca impossível)
    const p = function (bagaco, gotas) { pura.s = { gotas: gotas, adega: { bagaco: bagaco } }; return vm.runInContext('alambiquePodeDestilar(s)', pura); };
    ok(p(3, 0) && p(0, 10) && p(5, 50) && !p(2, 9) && !p(0, 0), 'pode destilar com Bagaço >= 3 OU Gotas >= 10');
    // para cada combinação, "pode" é verdade sse alguma destilação dá certo
    let todas = true;
    for (let b = 0; b <= 5; b++) for (let gt = 0; gt <= 12; gt++) {
      const um = run(estadoPuro({ bagaco: b, aguardente: 0, bagaceira: 0 }), 'bagaco', AGORA).ok || (function () { const e = estadoPuro({ bagaco: b }); e.gotas = gt; return run(e, 'vinho', AGORA).ok; })();
      const e1 = estadoPuro({ bagaco: b }); e1.gotas = gt;
      const alguma = run(copia(e1), 'bagaco', AGORA).ok || run(copia(e1), 'vinho', AGORA).ok;
      if (p(b, gt) !== alguma) todas = false;
      void um;
    }
    ok(todas, 'alambiquePodeDestilar bate com "alguma destilação dá certo" em todas as combinações de Bagaço 0 a 5 e Gotas 0 a 12');
  }
  ok(!/Math\.random|Date\.now|new Date|saveState|localStorage/.test(sem_comentarios(fontes['alambique.js'])), 'alambique.js é puro: sem Math.random, Date.now, gravação');

  // ---------------- 2. Na Adega (garrafa.js real) ----------------
  { // Destilar vinho no jogo
    const g = jogador();
    g.ev("executarAcaoAdega('destilarVinho')");
    const s = g.json('({ gotas: state.gotas, vin: state.adega.aguardente, bag: state.adega.bagaceira, bagaco: state.adega.bagaco, cd: state.adega.cooldowns.alambique, uvas: state.uvas })');
    ok(s.gotas === 110 && s.vin === 5 && s.bag === 2 && s.bagaco === 9 && s.uvas === 773 && s.cd === AGORA, 'Adega: Destilar vinho gasta 10 Gotas e dá 1 vínica: ' + JSON.stringify(s));
    ok(g.ev('SAVES') === 1 && g.json('OBJ').join() === 'adega_alambique', 'Adega: grava uma vez e conta para o objetivo adega_alambique');
    ok(g.ev('adegaMensagemAtual') === 'adega.flavorDestilarVinho adega.resultadoDestilarVinho', 'Adega: mensagem do vinho: ' + g.ev('adegaMensagemAtual'));
    ok(g.ev('adegaFotoAtual') === 'assets/ecras/alambique.jpg', 'Adega: foto do vinho é alambique.jpg, deu ' + g.ev('adegaFotoAtual'));
    ok(g.json('state.encyclopedia.unlocked').indexOf('bagacoAlambique') === -1, 'Destilar vinho NÃO desbloqueia a entrada do bagaço');
    g.ev("executarAcaoAdega('destilarBagaco')");
    ok(g.json('state.adega.bagaco') === 9 && g.ev('SAVES') === 1 && g.ev('adegaMensagemAtual').indexOf('vinha.msgCooldown') === 0 || g.ev('adegaMensagemAtual') === 'vinha.msgCooldown', 'Adega: logo a seguir o outro botão espera o cooldown partilhado, sem gastar nem gravar');
    ok(g.ev("botaoAdega('destilarBagaco', 'k', false)").indexOf('disabled') !== -1 && g.ev("botaoAdega('destilarVinho', 'k', false)").indexOf('disabled') !== -1, 'os dois botões ficam apagados durante o cooldown');
    g.ir(AGORA + CD);
    ok(g.ev("botaoAdega('destilarBagaco', 'k', false)").indexOf('disabled') === -1, 'e acendem passadas 3 h');
  }
  { // Destilar bagaço no jogo
    const g = jogador();
    g.ev("executarAcaoAdega('destilarBagaco')");
    const s = g.json('({ gotas: state.gotas, vin: state.adega.aguardente, bag: state.adega.bagaceira, bagaco: state.adega.bagaco, uvas: state.uvas, conhecimento: state.conhecimento })');
    ok(s.gotas === 120 && s.vin === 4 && s.bag === 3 && s.bagaco === 6 && s.uvas === 773, 'Adega: Destilar bagaço gasta 3 Bagaço e dá 1 bagaceira: ' + JSON.stringify(s));
    ok(g.json('OBJ').join() === 'adega_alambique', 'Adega: o bagaço também conta para adega_alambique');
    ok(g.ev('adegaMensagemAtual') === 'adega.flavorDestilarBagaco adega.resultadoDestilarBagaco' && g.ev('adegaFotoAtual') === 'assets/ecras/bagaco.jpg', 'Adega: mensagem e foto do bagaço (bagaco.jpg)');
    ok(g.json('state.encyclopedia.unlocked').indexOf('bagacoAlambique') !== -1 && s.conhecimento === 1, 'Destilar bagaço desbloqueia a entrada bagacoAlambique (+1 Conhecimento)');
    g.ir(AGORA + CD); g.ev("executarAcaoAdega('destilarBagaco')");
    ok(g.json('state.encyclopedia.unlocked').filter(function (x) { return x === 'bagacoAlambique'; }).length === 1 && g.ev('state.conhecimento') === 1, 'a entrada desbloqueia-se uma só vez');
  }
  { // Relógio errado no jogo: carimbo no futuro conta como agora e desbloqueia passadas 3 h
    const g = jogador({ cooldowns: { alambique: AGORA + 30 * 24 * H } });
    g.ev("executarAcaoAdega('destilarBagaco')");
    ok(g.ev('state.adega.bagaco') === 9 && g.ev('state.adega.cooldowns.alambique') === AGORA, 'carimbo no futuro: espera e fica corrigido para agora');
    g.ir(AGORA + CD); g.ev("executarAcaoAdega('destilarBagaco')");
    ok(g.ev('state.adega.bagaco') === 6 && g.ev('state.adega.bagaceira') === 3, 'e passadas 3 h destila (não fica bloqueado)');
  }
  { // Sem recursos no jogo: mensagens, sem gravar
    const g = jogador({ bagaco: 2 }); g.ev('state.gotas = 9;');
    g.ev("executarAcaoAdega('destilarVinho')");
    ok(g.ev('adegaMensagemAtual') === 'adega.msgFaltaGotasDestilar' && g.ev('SAVES') === 0 && g.json('OBJ').length === 0 && g.ev('state.gotas') === 9, 'sem Gotas: mensagem de falta, nada gravado');
    g.ev("executarAcaoAdega('destilarBagaco')");
    ok(g.ev('adegaMensagemAtual') === 'adega.msgFaltaBagacoAlambique' && g.ev('SAVES') === 0 && g.ev('state.adega.bagaco') === 2 && g.ev('state.adega.cooldowns.alambique') === undefined, 'sem Bagaço: mensagem de falta, nada gravado, sem cooldown');
    const b = jogador(); b.ev("executarAcaoAdega('destilarVinho')"); const antes = b.ev('SAVES');
    b.ev("executarAcaoAdega('destilarVinho')");
    ok(b.ev('SAVES') === antes && b.ev('state.gotas') === 110, 'duplo clique no jogo: o segundo não grava nem gasta');
  }
  { // Campo bagaceira reparado no jogo
    const g = jogador({ bagaceira: 'lixo' });
    g.ev("executarAcaoAdega('destilarBagaco')");
    ok(g.ev('state.adega.bagaceira') === 1, 'no jogo: bagaceira estranha é reparada ao destilar');
    const h = jogador({ bagaceira: -4 }); h.ev('alambiqueEstado(state)');
    ok(h.ev('state.adega.bagaceira') === 0, 'no jogo: bagaceira negativa passa a 0');
  }
  { // Fortificar só com vínica
    const g = jogador({ aguardente: 0, bagaceira: 5 });
    g.ev("executarAcaoAdega('fortificar')");
    ok(g.ev('state.adega.lote') === null && g.ev('adegaMensagemAtual') === 'adega.msgFaltaFortificar' && g.ev('state.adega.bagaceira') === 5 && g.ev('state.gotas') === 120, 'Fortificar não aceita bagaceira: sem vínica não fortifica');
    const h = jogador({ aguardente: 1, bagaceira: 5 });
    h.ev("executarAcaoAdega('fortificar')");
    ok(h.ev('state.adega.lote') !== null && h.ev('state.adega.aguardente') === 0 && h.ev('state.adega.bagaceira') === 5 && h.ev('state.gotas') === 20, 'Fortificar gasta 100 Gotas e 1 vínica (a bagaceira fica)');
    ok(h.json('state.encyclopedia.unlocked').indexOf('aguardenteAdega') !== -1, 'Fortificar continua a desbloquear a entrada aguardenteAdega');
    ok(h.ev('ADEGA_CUSTO_GOTAS_FORTIFICAR') === 100 && h.ev('ADEGA_CUSTO_AGUARDENTE_FORTIFICAR') === 1, 'o custo do Fortificar não mudou (100 Gotas e 1)');
  }
  { // Jeropiga na festa
    const festa = 'FESTAS_CONFIG[0]';
    const g1 = jogador({ bagaceira: 2, aguardente: 3 }); g1.ev('state.gotas = 60;');
    g1.ev('fazerJeropiga(' + festa + ')');
    ok(g1.ev('state.adega.bagaceira') === 1 && g1.ev('state.adega.aguardente') === 3 && g1.ev('state.gotas') === 10 && g1.ev('state.garrafas') === 1, 'jeropiga gasta a bagaceira primeiro (50 Gotas, mesmo prémio e garrafa)');
    const rep1 = g1.ev('state.reputacao') - 372;
    ok(rep1 === g1.ev(festa + '.recompensas.jeropiga.reputacao') * (g1.ev('estaNoDiaGrandeFesta(' + festa + ')') ? 2 : 1), 'o prémio da jeropiga não mudou (+25, a dobrar no dia grande), deu ' + rep1);
    const g2 = jogador({ bagaceira: 0, aguardente: 3 }); g2.ev('state.gotas = 60;');
    g2.ev('fazerJeropiga(' + festa + ')');
    ok(g2.ev('state.adega.bagaceira') === 0 && g2.ev('state.adega.aguardente') === 2 && g2.ev('state.gotas') === 10, 'sem bagaceira, a jeropiga gasta a vínica');
    const g3 = jogador({ bagaceira: 0, aguardente: 0 }); g3.ev('state.gotas = 60;');
    g3.ev('fazerJeropiga(' + festa + ')');
    ok(g3.ev('festaMensagemAtual') === g3.ev('fStr("saomartinho").jeropigaFalta') && g3.ev('state.gotas') === 60 && g3.ev('state.garrafas') === 0 && g3.ev('SAVES') === 0, 'sem nenhuma, a jeropiga falha sem gastar nem gravar');
    const g4 = jogador({ bagaceira: 1, aguardente: 0 }); g4.ev('state.gotas = 49;');
    g4.ev('fazerJeropiga(' + festa + ')');
    ok(g4.ev('state.adega.bagaceira') === 1 && g4.ev('state.gotas') === 49, 'com bagaceira mas só 49 Gotas: falha sem gastar');
    const g5 = jogador({ bagaceira: 1, aguardente: 0 }); g5.ev('state.gotas = 50;');
    g5.ev('fazerJeropiga(' + festa + ')');
    ok(g5.ev('state.adega.bagaceira') === 0 && g5.ev('state.garrafas') === 1, 'só com bagaceira (e 50 Gotas) a jeropiga faz-se');
    ok(g1.ev('festaJaFezTarefaHoje("saomartinho", "jeropiga")') === true, 'a jeropiga continua a ser uma vez por dia');
  }
  { // Objetivos: nunca impossíveis
    const g = jogador();
    const elegivel = function (id) { return g.ev("OBJETIVOS_POOL_A.concat(OBJETIVOS_POOL_B).filter(function (o) { return o.id === '" + id + "'; })[0].elegivel()"); };
    const pesos = [[0, 0, false], [2, 9, false], [3, 0, true], [0, 10, true], [9, 120, true]];
    pesos.forEach(function (p) {
      g.ev('state.adega.bagaco = ' + p[0] + '; state.gotas = ' + p[1] + ';');
      ok(elegivel('adega_alambique') === p[2], 'adega_alambique com Bagaço ' + p[0] + ' e Gotas ' + p[1] + ' devia ser ' + p[2]);
    });
    // se está elegível, alguma destilação dá mesmo certo (nunca impossível)
    let impossivel = false;
    for (let b = 0; b <= 6; b++) for (let gt = 0; gt <= 12; gt++) {
      g.ev('state.adega.bagaco = ' + b + '; state.gotas = ' + gt + '; state.adega.cooldowns = {}; state.adega.lote = null;');
      if (!elegivel('adega_alambique')) continue;
      g.ev("executarAcaoAdega(state.adega.bagaco >= 3 ? 'destilarBagaco' : 'destilarVinho')");
      const gastou = g.ev('state.adega.cooldowns.alambique') === AGORA;
      if (!gastou) impossivel = true;
    }
    ok(!impossivel, 'adega_alambique elegível nunca é impossível (alguma destilação resulta sempre)');
    // adega_fortificar segue como estava
    g.ev('state.adega.lote = null; state.adega.aguardente = 1; state.gotas = 100;');
    ok(elegivel('adega_fortificar') === true, 'adega_fortificar elegível com 100 Gotas e 1 vínica');
    g.ev('state.adega.aguardente = 0; state.adega.bagaceira = 9;');
    ok(elegivel('adega_fortificar') === false, 'adega_fortificar não conta a bagaceira');
    // todos os objetivos elegíveis têm texto nas 3 línguas e os ids de Adega usados existem
    ok(/'adega_alambique'/.test(fontes['objetivos.js']) && /alambiquePodeDestilar\(state\)/.test(fontes['objetivos.js']), 'objetivos.js usa alambiquePodeDestilar');
  }

  // ---------------- 3. Estado, jogos antigos, nuvem ----------------
  {
    const g = abrir(null);
    ok(g.ev('defaultState().adega.bagaceira') === 0 && g.ev('defaultState().adega.aguardente') === 0, 'defaultState: aguardente e bagaceira a 0');
    // save antigo (sem bagaceira) e estado vindo da nuvem (mergeDeep)
    const antigo = abrir({ reputacao: 500, adega: { bagaco: 7, aguardente: 12, cooldowns: { alambique: 5 }, lote: null, historico: [] } });
    ok(antigo.ev('state.adega.aguardente') === 12 && antigo.ev('state.adega.bagaco') === 7 && antigo.ev('state.adega.bagaceira') === 0 && antigo.ev('state.adega.cooldowns.alambique') === 5, 'save antigo: a aguardente (12) fica igual e passa a vínica, bagaceira começa a 0, cooldown e bagaço intactos');
    const nuvem = g.json('mergeDeep(defaultState(), { reputacao: 900, adega: { aguardente: 6, bagaco: 1 } })');
    ok(nuvem.adega.aguardente === 6 && nuvem.adega.bagaceira === 0 && nuvem.adega.bagaco === 1, 'estado da nuvem sem o campo: o mergeDeep acrescenta bagaceira = 0');
    // versão antiga a abrir um estado com bagaceira: o mergeDeep dela mantém o campo (não o apaga)
    const velho = g.json('mergeDeep({ adega: { bagaco: 0, aguardente: 0, cooldowns: {}, lote: null, historico: [] } }, { adega: { bagaco: 3, aguardente: 2, bagaceira: 4 } })');
    ok(velho.adega.bagaceira === 4 && velho.adega.aguardente === 2, 'versão antiga: o campo bagaceira não se perde ao ler/gravar');
    ok(!/bagaceira/.test(fs.readFileSync(path.join(RAIZ, 'js', 'nuvem.js'), 'utf8')), 'nuvem.js não foi tocado (nenhuma junta fala da bagaceira)');
  }
  {
    const E = vm.createContext({ console: { log() {}, warn() {}, error() {} }, document: { querySelectorAll: function () { return []; }, getElementById: function () { return null; } }, state: { lang: 'pt' }, localStorage: { getItem: function () { return null; }, setItem: function () {} }, navigator: { language: 'pt-PT' }, location: { search: '' }, URLSearchParams: URLSearchParams });
    E.window = E;
    let ok1 = true;
    try { vm.runInContext(fontes['explorar.js'], E, { filename: 'explorar.js' }); } catch (e) { ok1 = false; falhas.push('explorar.js: ' + e.message); }
    if (ok1) {
      ['pt', 'en', 'es'].forEach(function (l) {
        const ids = vm.runInContext('ENCYCLOPEDIA_ENTRIES.' + l + '.map(function (e) { return e.id; })', E);
        ['bagacoAlambique', 'aguardenteAdega', 'aguardente', 'jeropiga', 'curtimenta'].forEach(function (id) { ok(ids.indexOf(id) !== -1, 'Enciclopédia ' + l + ': o id ' + id + ' tem de continuar a existir'); });
        const livres = vm.runInContext('ENCYCLOPEDIA_ENTRIES.' + l + '.filter(function (e) { return !e.manual; }).length', E);
        ok(livres >= 6, 'capítulo 4 continua alcançável sem as entradas da Adega: ' + livres + ' entradas livres no Explorar (' + l + ')');
      });
    }
    ok(/id: 'cap4'[^}]*encyclopedia\.unlocked[^}]*alvo: 6/.test(fontes['capitulos.js']), 'o capítulo 4 continua a pedir 6 entradas');
  }

  // ---------------- 4. Textos (i18n.js) ----------------
  {
    const cx = vm.createContext({ console: { log() {}, warn() {}, error() {} }, localStorage: { getItem: function () { return null; }, setItem: function () {} }, document: { querySelectorAll: function () { return []; }, getElementById: function () { return null; }, documentElement: {} }, navigator: { language: 'pt-PT' }, location: { search: '' }, URLSearchParams: URLSearchParams, state: {} });
    cx.window = cx;
    let T = null;
    try { vm.runInContext(fontes['i18n.js'], cx, { filename: 'i18n.js' }); T = vm.runInContext('JSON.parse(JSON.stringify(TRANSLATIONS))', cx); } catch (e) { falhas.push('não consegui carregar js/i18n.js: ' + e.message); }
    if (T) {
      const novas = ['adega.btnDestilarVinho', 'adega.btnDestilarBagaco', 'adega.flavorDestilarVinho', 'adega.flavorDestilarBagaco', 'adega.resultadoDestilarVinho', 'adega.resultadoDestilarBagaco', 'adega.msgFaltaGotasDestilar', 'adega.msgFaltaBagacoAlambique', 'adega.recursoBagaceira', 'adega.recursoAguardente', 'adega.msgFaltaFortificar'];
      ['pt', 'en', 'es'].forEach(function (l) {
        novas.forEach(function (k) { ok(typeof T[l][k] === 'string' && T[l][k].trim() !== '', l + ': falta o texto ' + k); });
        ['adega.msgFaltaGotasDestilar', 'adega.msgFaltaBagacoAlambique'].forEach(function (k) { ok(/\{n\}/.test(T[l][k] || ''), l + ': ' + k + ' tem de ter {n}'); });
        ['adega.btnAlambique', 'adega.flavorAlambique', 'adega.resultadoAlambique'].forEach(function (k) { ok(T[l][k] === undefined, l + ': a chave antiga ' + k + ' já não devia existir'); });
      });
      const adegaKeys = function (l) { return Object.keys(T[l]).filter(function (k) { return /^adega\./.test(k); }).sort().join(); };
      ok(adegaKeys('pt') === adegaKeys('en') && adegaKeys('en') === adegaKeys('es'), 'as 3 línguas têm exatamente as mesmas chaves adega.*');
      ok(Object.keys(T.pt).length === Object.keys(T.en).length && Object.keys(T.en).length === Object.keys(T.es).length, 'as 3 línguas têm o mesmo número de chaves');
      ok(T.pt['adega.btnDestilarVinho'] === 'Destilar vinho' && T.pt['adega.btnDestilarBagaco'] === 'Destilar bagaço', 'PT: botões');
      ok(T.en['adega.btnDestilarVinho'] === 'Distil wine' && T.en['adega.btnDestilarBagaco'] === 'Distil pomace', 'EN: botões');
      ok(T.es['adega.btnDestilarVinho'] === 'Destilar vino' && T.es['adega.btnDestilarBagaco'] === 'Destilar orujo', 'ES: botões');
      ok(T.pt['adega.flavorDestilarVinho'] === 'O vinho vai ao alambique e sai aguardente vínica, a alma do Moscatel.' && T.pt['adega.flavorDestilarBagaco'] === 'O bagaço vai ao alambique e sai bagaceira.', 'PT: sabores exatamente como decidido');
      ok(T.pt['adega.resultadoDestilarVinho'] === '+1 Aguardente vínica' && T.pt['adega.resultadoDestilarBagaco'] === '+1 Bagaceira', 'PT: resultados');
      ok(T.pt['adega.recursoAguardente'] === 'Vínica' && T.pt['adega.recursoBagaceira'] === 'Bagaceira', 'PT: rótulos dos contadores');
      ok(/wine spirit/i.test(T.en['adega.resultadoDestilarVinho']) && /pomace spirit/i.test(T.en['adega.resultadoDestilarBagaco']) && /wine spirit/i.test(T.en['adega.flavorDestilarVinho']) && /pomace spirit/i.test(T.en['adega.flavorDestilarBagaco']), 'EN: "wine spirit" e "pomace spirit"');
      ok(/aguardiente vínico/i.test(T.es['adega.resultadoDestilarVinho']) && /aguardiente de orujo/i.test(T.es['adega.resultadoDestilarBagaco']) && /aguardiente vínico/i.test(T.es['adega.flavorDestilarVinho']) && /aguardiente de orujo/i.test(T.es['adega.flavorDestilarBagaco']), 'ES: "aguardiente vínico" e "aguardiente de orujo"');
      ok(/vínica/.test(T.pt['adega.msgFaltaFortificar']) && /Wine spirit/.test(T.en['adega.msgFaltaFortificar']) && /vínico/.test(T.es['adega.msgFaltaFortificar']), 'o texto do Fortificar pede a aguardente vínica nas 3 línguas');
      ok(!/aguardente|aguardiente|brandy|spirit/i.test(T.pt['adega.flavorDestilarBagaco'].replace(/bagaceira/i, '')) , 'o sabor do bagaço já não diz que o bagaço dá aguardente vínica');
      // texto da jeropiga (festas.js)
      const fx = vm.createContext({}); fx.window = fx;
      const fstr = fontes['festas.js'];
      const blocos = ['pt', 'en', 'es'].map(function (l) { const m = new RegExp(l + ": \\{[\\s\\S]*?jeropigaFalta: ((?:'[^']*')|(?:\"[^\"]*\"))").exec(fstr); return m ? m[1] : ''; });
      ok(blocos.every(function (b) { return b !== ''; }), 'as 3 línguas têm jeropigaFalta');
      ok(blocos.every(function (b) { return !/Bagaço|Pomace|Orujo/.test(b); }), 'jeropigaFalta já não manda destilar "Bagaço"/"Pomace"/"Orujo"');
      // Frases que continuam certas ficam como estavam
      ok(/aguardente vínica/.test(T.pt['garrafa.passo2']) && /aguardente é a alma do Moscatel/.test(fontes['explorar.js'] + fs.readFileSync(path.join(RAIZ, 'js', 'caderno.js'), 'utf8')), 'garrafa.passo2 e o Caderno adega_2 não mudaram');
    }
  }

  // ---------------- 5. Ligações ----------------
  {
    const pos = function (f) { return INDEX.indexOf('<script src="js/' + f + '.js'); };
    ok(pos('alambique') !== -1 && pos('alambique') < pos('garrafa'), 'index.html: alambique.js antes do garrafa.js');
    ok(/#garrafa-container \.chrome-mini-stats \{ flex-wrap: wrap/.test(INDEX), 'index.html: os 3 contadores da Adega podem passar à linha de baixo');
    const garrafa = sem_comentarios(fontes['garrafa.js']);
    ok(/destilarVinho: 'assets\/ecras\/alambique\.jpg'/.test(garrafa) && /destilarBagaco: 'assets\/ecras\/bagaco\.jpg'/.test(garrafa), 'imagens: vinho = alambique.jpg, bagaço = bagaco.jpg (sem ficheiros novos)');
    ok(/adega\.recursoBagaceira/.test(garrafa) && /adega\.recursoAguardente/.test(garrafa) && /adega\.recursoBagaco/.test(garrafa), 'o cartão da Adega mostra os 3 contadores');
    const ramo = garrafa.slice(garrafa.indexOf("acao === 'destilarVinho' || acao === 'destilarBagaco') {"), garrafa.indexOf("acao === 'fortificar'"));
    ok(ramo.length > 100 && !/uvas/i.test(ramo), 'o ramo do Alambique não mexe em Uvas');
  }
  return falhas;
}

let falhas = suite(FONTES);

function mutar(ficheiro, de, para) {
  if (FONTES[ficheiro].indexOf(de) === -1) { falhas.push('mutação impossível (texto não encontrado em ' + ficheiro + '): ' + de); return null; }
  const f = Object.assign({}, FONTES);
  f[ficheiro] = FONTES[ficheiro].split(de).join(para);
  return f;
}
const MUTACOES = [
  ['vinho custa 9 Gotas', 'alambique.js', 'gotasVinho: 10,', 'gotasVinho: 9,'],
  ['bagaço custa 2', 'alambique.js', 'bagacoBagaceira: 3', 'bagacoBagaceira: 2'],
  ['vinho dá bagaceira', 'alambique.js', 'a.aguardente = alambiqueNumero(a.aguardente) + 1;', 'a.bagaceira += 1;'],
  ['bagaço dá vínica', 'alambique.js', 'a.bagaceira += 1;\n  }', 'a.aguardente = alambiqueNumero(a.aguardente) + 1;\n  }'],
  ['vinho não gasta Gotas', 'alambique.js', 'estado.gotas = gotas - ALAMBIQUE_CONFIG.gotasVinho;', ''],
  ['vinho gasta uvas', 'alambique.js', 'estado.gotas = gotas - ALAMBIQUE_CONFIG.gotasVinho;', 'estado.gotas = gotas - ALAMBIQUE_CONFIG.gotasVinho; estado.uvas -= 1;'],
  ['sem cooldown partilhado (cada um o seu)', 'alambique.js', 'a.cooldowns.alambique = agora;', "a.cooldowns['alambique_' + tipo] = agora;"],
  ['não regista o cooldown', 'alambique.js', 'a.cooldowns.alambique = agora;', ''],
  ['ignora o cooldown (duplo clique gasta duas vezes)', 'alambique.js', "if (restante > 0) return recusa('cooldown', { restanteMs: restante });", ''],
  ['grava o cooldown mesmo sem recursos', 'alambique.js', "if (gotas < ALAMBIQUE_CONFIG.gotasVinho) return recusa('faltam_gotas');", "if (gotas < ALAMBIQUE_CONFIG.gotasVinho) { a.cooldowns = { alambique: agora }; return recusa('faltam_gotas'); }"],
  ['gasta antes de verificar o bagaço', 'alambique.js', "if (bagaco < ALAMBIQUE_CONFIG.bagacoBagaceira) return recusa('faltam_bagaco');", "a.bagaco = bagaco - ALAMBIQUE_CONFIG.bagacoBagaceira; if (bagaco < ALAMBIQUE_CONFIG.bagacoBagaceira) return recusa('faltam_bagaco');"],
  ['carimbo no futuro bloqueia para sempre', 'alambique.js', 'agora - Math.min(ultima, agora)', 'agora - ultima'],
  ['bagaceira estranha não é reparada', 'alambique.js', 'a.bagaceira = alambiqueNumero(a.bagaceira);', ''],
  ['bagaceira negativa aceite', 'alambique.js', 'return typeof n === \'number\' && Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;', 'return typeof n === \'number\' && Number.isFinite(n) ? Math.floor(n) : 0;'],
  ['jeropiga gasta a vínica primeiro', 'alambique.js', "if (a.bagaceira >= pedido) { a.bagaceira -= pedido; return { ok: true, fonte: 'bagaceira' }; }\n  const vinica = alambiqueNumero(a.aguardente);\n  if (vinica >= pedido) { a.aguardente = vinica - pedido; return { ok: true, fonte: 'vinica' }; }", "const vinica = alambiqueNumero(a.aguardente);\n  if (vinica >= pedido) { a.aguardente = vinica - pedido; return { ok: true, fonte: 'vinica' }; }\n  if (a.bagaceira >= pedido) { a.bagaceira -= pedido; return { ok: true, fonte: 'bagaceira' }; }"],
  ['jeropiga não aceita bagaceira', 'alambique.js', "if (a.bagaceira >= pedido) { a.bagaceira -= pedido; return { ok: true, fonte: 'bagaceira' }; }", ''],
  ['jeropiga só aceita bagaceira', 'alambique.js', "if (vinica >= pedido) { a.aguardente = vinica - pedido; return { ok: true, fonte: 'vinica' }; }", ''],
  ['o objetivo só conta o bagaço', 'alambique.js', ' || alambiqueNumero(estado.gotas) >= ALAMBIQUE_CONFIG.gotasVinho;', ';'],
  ['o objetivo só conta as Gotas', 'alambique.js', 'return alambiqueNumero(a.bagaco) >= ALAMBIQUE_CONFIG.bagacoBagaceira || ', 'return '],
  ['Fortificar aceita a bagaceira', 'garrafa.js', "if (state.gotas < ADEGA_CUSTO_GOTAS_FORTIFICAR || a.aguardente < ADEGA_CUSTO_AGUARDENTE_FORTIFICAR) {\n      adegaMensagemAtual", "if (state.gotas < ADEGA_CUSTO_GOTAS_FORTIFICAR || a.aguardente + a.bagaceira < ADEGA_CUSTO_AGUARDENTE_FORTIFICAR) {\n      adegaMensagemAtual"],
  ['Fortificar gasta bagaceira', 'garrafa.js', 'a.aguardente -= ADEGA_CUSTO_AGUARDENTE_FORTIFICAR;', 'a.bagaceira -= ADEGA_CUSTO_AGUARDENTE_FORTIFICAR;'],
  ['Fortificar custa 2 vínicas', 'garrafa.js', 'const ADEGA_CUSTO_AGUARDENTE_FORTIFICAR = 1;', 'const ADEGA_CUSTO_AGUARDENTE_FORTIFICAR = 2;'],
  ['o botão do bagaço usa o cooldown do vinho à parte', 'garrafa.js', "const ADEGA_CHAVE_COOLDOWN = { destilarVinho: 'alambique', destilarBagaco: 'alambique' };", "const ADEGA_CHAVE_COOLDOWN = { destilarVinho: 'alambique', destilarBagaco: 'destilarBagaco' };"],
  ['o vinho desbloqueia a entrada do bagaço', 'garrafa.js', "adegaMensagemAtual = t('adega.flavorDestilarVinho') + ' ' + t('adega.resultadoDestilarVinho');", "adegaMensagemAtual = t('adega.flavorDestilarVinho') + ' ' + t('adega.resultadoDestilarVinho'); adegaNovaEntrada = desbloquearEntradaEnciclopedia('bagacoAlambique');"],
  ['o bagaço não desbloqueia a entrada', 'garrafa.js', "adegaNovaEntrada = desbloquearEntradaEnciclopedia('bagacoAlambique'); // só o bagaço", "// só o bagaço"],
  ['só o bagaço conta para o objetivo', 'garrafa.js', "acao === 'destilarVinho' || acao === 'destilarBagaco' ? 'adega_alambique' : 'adega_' + acao", "acao === 'destilarBagaco' ? 'adega_alambique' : 'adega_' + acao"],
  ['foto do vinho errada', 'garrafa.js', "destilarVinho: 'assets/ecras/alambique.jpg',", "destilarVinho: 'assets/ecras/bagaco.jpg',"],
  ['sem contador da bagaceira', 'garrafa.js', "' <span data-i18n=\"adega.recursoBagaceira\"></span> ' + a.bagaceira + '</span>' +", "'' +"],
  ['jeropiga gasta só a vínica', 'festas.js', 'alambiqueGastarParaJeropiga(state, custo.custoAguardente);', 'state.adega.aguardente -= custo.custoAguardente;'],
  ['jeropiga exige a vínica', 'festas.js', '!alambiqueTemParaJeropiga(state, custo.custoAguardente)', 'state.adega.aguardente < custo.custoAguardente'],
  ['jeropiga custa 40 Gotas', 'festas.js', 'jeropiga: { custoGotas: 50,', 'jeropiga: { custoGotas: 40,'],
  ['o texto da jeropiga ainda manda destilar bagaço', 'festas.js', 'Prensa mais Uvas e destila mais no Alambique.', 'Prensa mais Uvas e destila mais Bagaço no Alambique.'],
  ['objetivo só com bagaço', 'objetivos.js', 'alambiquePodeDestilar(state)', 'state.adega.bagaco >= 3'],
  ['texto em falta (EN)', 'i18n.js', "'adega.btnDestilarVinho': 'Distil wine',", ''],
  ['chave antiga do Alambique ainda existe', 'i18n.js', "'adega.btnDestilarBagaco': 'Destilar bagaço',", "'adega.btnDestilarBagaco': 'Destilar bagaço',\n    'adega.btnAlambique': 'Alambique',"],
  ['rótulo ES errado', 'i18n.js', "'adega.btnDestilarBagaco': 'Destilar orujo',", "'adega.btnDestilarBagaco': 'Destilar bagaço',"]
];
MUTACOES.forEach(function (m) {
  const f = mutar(m[1], m[2], m[3]);
  if (!f) return;
  let apanhada;
  try { apanhada = suite(f).length > 0; } catch (e) { apanhada = true; if (process.env.ALAMBIQUE_DEBUG) console.log('(mutação que rebenta: ' + m[0] + ': ' + e.message.split('\n')[0] + ')'); }
  if (!apanhada) falhas.push('MUTAÇÃO NÃO APANHADA: ' + m[0]);
});

if (falhas.length) {
  falhas.slice(0, 40).forEach(function (m) { console.log('FALHA: ' + m); });
  console.log(falhas.length + ' falha(s)');
  process.exit(1);
}
console.log('OK (' + MUTACOES.length + ' mutações apanhadas)');
