#!/usr/bin/env node
// Vigiar a vinha (js/vigiar.js): doenças e pragas só como "sinal" e aprendizagem, sem perdas nem custos.
//   - vigiarSinal(tempo, estação, agora): 'mildio' (chuva ou nevoeiro agora, ou chuva vista nas últimas 24 h), 'oidio' (calor forte sem isso) ou null;
//     inverno, estação estranha, tempo indisponível ou estranho dão null; o míldio ganha ao oídio;
//   - uma vigia por dia (state.tempo.vigiarDia, dia de Lisboa); data atrás NÃO repõe; mais de 2 dias à frente repõe (diaLisboaMudou/diaLisboaEfetivo);
//   - fichas da Enciclopédia (manual: true): "O Míldio" e "O Oídio" na 1.ª vigia com esse sinal, "A Eutipiose" na 3.ª vigia em dias diferentes (state.tempo.vigiarDias, só sobe);
//   - não dá cuidado, uvas nem nada: só a ficha e o objetivo do dia tempo_vigiar; estado reparado em memória; só o clique grava (um saveState) e ignora o duplo clique;
//   - botão na Vinha só com sinal ("já vigiaste hoje" depois), fundo do sinal e variante _2 depois de vigiar, aviso do YoshiCat;
//   - textos PT/EN/ES com as mesmas chaves, sem "estragou"/"morreu", sem números nem tratamentos; as 4 imagens são cópia exata das originais (que ficam);
//   - nuvem, tempo.js (nenhum pedido novo), Proteger e Compostagem intactos.
// Corre js/ REAIS em vm com um relógio controlado. Depois de passar, aplica "mutações" e confirma que o teste as apanha.
//
// Uso: node scripts/verificar-vigiar.js   (VIGIAR_DEBUG=1 diz se alguma mutação rebenta em vez de falhar)
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const RAIZ = path.join(__dirname, '..');
const FICHEIROS = ['state.js', 'i18n.js', 'estacoes.js', 'tempo.js', 'niveis.js', 'festas.js', 'vigiar.js', 'vinha.js', 'explorar.js', 'objetivos.js'];
const FONTES = {};
FICHEIROS.concat(['nuvem.js', 'proteger.js']).forEach(function (f) { FONTES[f] = fs.readFileSync(path.join(RAIZ, 'js', f), 'utf8'); });
FONTES['index.html'] = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');

const IMG = {
  mildio: { sinal: 'assets/ecras/doencas_e_pragas.jpg', depois: 'assets/ecras/doencas_e_pragas_2.jpg' },
  oidio: { sinal: 'assets/ecras/pragas_sol.jpg', depois: 'assets/ecras/pragas_sol_2.jpg' }
};
const HORA = 3600 * 1000;

function suite(fontes) {
  const falhas = [];
  function ok(cond, msg) { if (!cond) falhas.push(msg); }
  const semCom = function (s) { return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''); };

  function abrir(pesquisa, agoraMs, cacheTempo) {
    const relogio = { t: agoraMs === undefined ? Date.parse('2026-10-09T12:00:00Z') : agoraMs };
    const guardado = {};
    if (cacheTempo !== undefined) guardado.yoshicat_tempo_cache_v1 = JSON.stringify(cacheTempo);
    const gravacoes = [];
    const elementos = {};
    const mkEl = function (id) { return { id: id, innerHTML: '', classList: { add() {}, remove() {}, toggle() {} }, querySelectorAll: function () { return []; }, querySelector: function () { return null; }, setAttribute() {}, style: {} }; };
    const el = function (id) { return elementos[id] || (elementos[id] = mkEl(id)); };
    class Relogio extends Date {
      constructor(...a) { if (a.length === 0) super(relogio.t); else super(...a); }
      static now() { return relogio.t; }
    }
    const sb = {
      console: { log() {}, warn() {}, error() {} },
      localStorage: {
        getItem: function (k) { return Object.prototype.hasOwnProperty.call(guardado, k) ? guardado[k] : null; },
        setItem: function (k, v) { guardado[k] = String(v); gravacoes.push(k); },
        removeItem: function (k) { delete guardado[k]; }
      },
      location: { search: pesquisa || '' }, URLSearchParams: URLSearchParams, Intl: Intl, Date: Relogio, setTimeout: function () { return 1; }, clearTimeout: function () {}, Image: function () {},
      document: { querySelectorAll: function () { return []; }, querySelector: function () { return null; }, getElementById: el, addEventListener: function () {} },
      Telegram: { WebApp: {} }
    };
    sb.window = sb; sb.addEventListener = function () {};
    const cx = vm.createContext(sb);
    vm.runInContext(`
      this.__fundos = []; this.__falas = []; this.__sons = []; this.__novas = [];
      function mostrarFalas() {} function vibrar() {} function tocarSom(n) { __sons.push(n); } function updateStatsDisplays() {}
      function definirFundo(m, src) { __fundos.push(src); } function atualizarDialogo(m) { __falas.push(m); }
      function construirFilaPastilhas(id, html) { return html; } function configurarFilaPastilhas() {} function mostrarNovaEntrada(e) { __novas.push(e ? e.id : null); }
      function iniciarSomAmbiente() {} function pararSomAmbiente() {} function tocarSomFicheiro() {}
      function caveReservaAberta() { return false; } function garrafaQueMaisDescansou() { return 0; } function rondaChizoFeitasHoje() { return 1; }
      function atualizarAmbienteChuva() {} function tocarTrovaoSeTrovoada() {} function atualizarCartaoObjetivosQuinta() {} function atualizarCapituloQuinta() {} function atualizarResumoQuinta() {}
    `, cx);
    FICHEIROS.forEach(function (f) { vm.runInContext(fontes[f], cx, { filename: 'js/' + f }); });
    vm.runInContext('state = defaultState();', cx);
    const g = { cx: cx, gravacoes: gravacoes, relogio: relogio, el: el, guardado: guardado };
    g.ev = function (c) { return vm.runInContext(c, cx); };
    g.json = function (c) { return JSON.parse(vm.runInContext('JSON.stringify(' + c + ')', cx)); };
    g.ir = function (ms) { relogio.t = ms; };
    return g;
  }
  const g0 = abrir('');
  const copia = function (x) { return JSON.parse(JSON.stringify(x)); };
  const D = '2026-10-09', D1 = '2026-10-10', D2 = '2026-10-11', D3 = '2026-10-12', ANT = '2026-10-08', ANT3 = '2026-10-06';
  const AGORA = Date.parse('2026-10-09T12:00:00Z');
  const cond = function (o) { return Object.assign({ disponivel: true, ceu: 'sol', granizo: false, tempC: 20, ventoKmh: 10, calorForte: false, frioForte: false, ventoForte: false, chuvaEm: null }, o); };
  const sinal = function (t, est, agora) { g0.cx.__t = t; g0.cx.__e = est; g0.cx.__a = agora === undefined ? AGORA : agora; return g0.ev('vigiarSinal(__t, __e, __a)'); };
  const base = function (extra) { return Object.assign({ uvas: 50, gotas: 30, garrafas: 4, reputacao: 100, conhecimento: 3, encyclopedia: { unlocked: [] }, vinha: { fase: 'crescendo', pontosCuidado: 2, residuos: 1, adubo: 1 }, tempo: { vigiarDia: null, vigiarDias: 0 } }, extra || {}); };
  const vig = function (estado, tempo, est, dia, agora) { g0.cx.__s = estado; g0.cx.__t = tempo; g0.cx.__e = est; g0.cx.__d = dia; g0.cx.__a = agora === undefined ? AGORA : agora; const r = g0.json('vigiar(__s, __t, __e, __d, __a)'); return { r: r, e: JSON.parse(JSON.stringify(g0.cx.__s)) }; };
  const pode = function (estado, tempo, est, dia) { g0.cx.__s = estado; g0.cx.__t = tempo; g0.cx.__e = est; g0.cx.__d = dia; g0.cx.__a = AGORA; return g0.json('vigiarPodeVigiar(__s, __t, __e, __d, __a)'); };

  // ---------------- 1. O sinal ----------------
  ['primavera', 'verao', 'outono'].forEach(function (est) {
    ok(sinal(cond({ ceu: 'chuva' }), est) === 'mildio', est + ': chuva dá míldio');
    ok(sinal(cond({ ceu: 'nevoeiro' }), est) === 'mildio', est + ': nevoeiro dá míldio');
    ok(sinal(cond({ ceu: 'sol', calorForte: true }), est) === 'oidio', est + ': calor forte sem chuva dá oídio');
    ok(sinal(cond({ ceu: 'chuva', calorForte: true }), est) === 'mildio', est + ': chuva e calor: o míldio ganha ao oídio');
    ok(sinal(cond({ ceu: 'sol', calorForte: true, chuvaEm: AGORA - HORA }), est) === 'mildio', est + ': calor mas com chuva há 1 h: o míldio ganha');
    ok(sinal(cond({ ceu: 'sol' }), est) === null, est + ': sol normal não dá sinal');
    ok(sinal(cond({ ceu: 'noite' }), est) === null, est + ': noite sem calor não dá sinal');
    ok(sinal(cond({ ceu: 'trovoada' }), est) === null && sinal(cond({ ceu: 'trovoada', granizo: true }), est) === null, est + ': trovoada sozinha não dá sinal');
    ok(sinal(cond({ ceu: 'trovoada', calorForte: true }), est) === 'oidio', est + ': trovoada com calor forte conta como calor (oídio)');
  });
  ok(sinal(cond({ ceu: 'sol', chuvaEm: AGORA - 23 * HORA }), 'outono') === 'mildio', 'chuva vista há 23 h dá míldio');
  ok(sinal(cond({ ceu: 'sol', chuvaEm: AGORA - 24 * HORA }), 'outono') === 'mildio', 'chuva vista há exatamente 24 h ainda dá míldio');
  ok(sinal(cond({ ceu: 'sol', chuvaEm: AGORA - 24 * HORA - 1 }), 'outono') === null, 'chuva vista há mais de 24 h não dá sinal');
  ok(sinal(cond({ ceu: 'sol', chuvaEm: AGORA }), 'outono') === 'mildio', 'chuva vista agora mesmo dá míldio');
  ok(sinal(cond({ ceu: 'sol', chuvaEm: AGORA + HORA }), 'outono') === null, 'chuva "no futuro" (relógio atrás) não conta');
  [NaN, Infinity, -Infinity, 'ontem', '1', String(AGORA - HORA), [AGORA - HORA], {}, [], true, undefined, null].forEach(function (c) { ok(sinal(cond({ ceu: 'sol', chuvaEm: c }), 'outono') === null, 'chuvaEm estranho ' + JSON.stringify(c) + ' não conta'); });
  ok(sinal(cond({ ceu: 'sol', chuvaEm: AGORA - HORA }), 'outono', 'x') === null && sinal(cond({ ceu: 'sol', chuvaEm: AGORA - HORA }), 'outono', NaN) === null, 'sem "agora" válido a chuva vista não conta');
  ['chuva', 'nevoeiro'].forEach(function (c) { ok(sinal(cond({ ceu: c }), 'inverno') === null, 'inverno com ' + c + ': sem sinal'); });
  ok(sinal(cond({ calorForte: true }), 'inverno') === null && sinal(cond({ chuvaEm: AGORA - HORA }), 'inverno') === null, 'inverno com calor ou chuva vista: sem sinal');
  ['xpto', '', null, undefined, 3, 'Outono', 'OUTONO', {}].forEach(function (e) { ok(sinal(cond({ ceu: 'chuva' }), e) === null, 'estação estranha ' + JSON.stringify(e) + ': sem sinal'); });
  [null, undefined, 0, 'chuva', [], { disponivel: false, ceu: 'chuva' }, { ceu: 'chuva' }, { disponivel: 'true', ceu: 'chuva' }, { disponivel: 1, ceu: 'chuva' }, { disponivel: true }, { disponivel: true, calorForte: 'true' }, { disponivel: true, calorForte: 1 }].forEach(function (t) {
    ok(sinal(t, 'outono') === null, 'tempo indisponível ou estranho ' + JSON.stringify(t) + ': sem sinal');
  });
  ok(sinal(cond({ ceu: 'CHUVA' }), 'outono') === null && sinal(cond({ ceu: ['chuva'] }), 'outono') === null, 'céu com outra grafia ou tipo não conta');
  { // a regra não altera o tempo que recebe
    const t0 = cond({ ceu: 'chuva', chuvaEm: AGORA - HORA }); const antes = JSON.stringify(t0); sinal(t0, 'outono');
    ok(JSON.stringify(g0.cx.__t) === antes, 'vigiarSinal não altera o tempo');
  }

  // ---------------- 2. Vigiar: efeitos ----------------
  {
    const e0 = base();
    const { r, e } = vig(copia(e0), cond({ ceu: 'chuva' }), 'outono', D);
    ok(r.ok === true && r.sinal === 'mildio' && r.dias === 1 && JSON.stringify(r.fichas) === '["mildio"]', 'vigiar com míldio: ok, 1.º dia, ficha do míldio (' + JSON.stringify(r) + ')');
    ok(e.tempo.vigiarDia === D && e.tempo.vigiarDias === 1, 'vigiar regista o dia e sobe o contador');
    const sem = function (x) { const c = copia(x); delete c.tempo.vigiarDia; delete c.tempo.vigiarDias; return JSON.stringify(c); };
    ok(sem(e) === sem(e0), 'vigiar não mexe em mais nada (uvas, Gotas, garrafas, Reputação, cuidado, adubo, resíduos, fase, Enciclopédia)');
    const o = vig(copia(e0), cond({ ceu: 'sol', calorForte: true }), 'verao', D).r;
    ok(o.ok && o.sinal === 'oidio' && JSON.stringify(o.fichas) === '["oidio"]', 'vigiar com oídio dá a ficha do oídio');
    const ja = vig(base({ encyclopedia: { unlocked: ['mildio'] } }), cond({ ceu: 'chuva' }), 'outono', D).r;
    ok(ja.ok && ja.fichas.length === 0, 'com a ficha do míldio já aberta, não a repete');
    const ja2 = vig(base({ encyclopedia: { unlocked: ['oidio'] } }), cond({ ceu: 'chuva' }), 'outono', D).r;
    ok(JSON.stringify(ja2.fichas) === '["mildio"]', 'ter a do oídio não impede a do míldio');
    const sem2 = vig(base({ encyclopedia: undefined }), cond({ ceu: 'chuva' }), 'outono', D).r;
    ok(sem2.ok && JSON.stringify(sem2.fichas) === '["mildio"]', 'sem lista da Enciclopédia não rebenta');
  }
  // recusas: nada se altera
  {
    const e0 = base({ tempo: { vigiarDia: D, vigiarDias: 2, frioDia: 'x' } });
    const rec = function (estado, tempo, est, dia, motivo, nome) {
      const antes = JSON.stringify(estado); const { r, e } = vig(estado, tempo, est, dia);
      ok(r.ok === false && r.motivo === motivo && r.fichas.length === 0 && JSON.stringify(e) === antes, nome + ': recusa (' + motivo + ') sem alterar nada, deu ' + JSON.stringify(r));
    };
    rec(copia(e0), cond({ ceu: 'chuva' }), 'outono', D, 'ja_hoje', 'já vigiou hoje');
    rec(base(), cond({ ceu: 'sol' }), 'outono', D, 'sem_sinal', 'sem sinal');
    rec(base(), cond({ ceu: 'chuva' }), 'inverno', D, 'sem_sinal', 'inverno');
    rec(base(), { disponivel: false }, 'outono', D, 'sem_sinal', 'tempo indisponível');
    rec(base(), cond({ ceu: 'chuva' }), 'outono', 'lixo', 'dia_invalido', 'dia inválido');
    rec(base(), cond({ ceu: 'chuva' }), 'outono', '2026-13-45', 'dia_invalido', 'dia impossível');
    rec(base(), cond({ ceu: 'chuva' }), 'outono', null, 'dia_invalido', 'dia nulo');
    rec(base({ tempo: 'estragado' }), cond({ ceu: 'sol' }), 'outono', D, 'sem_sinal', 'estado estranho sem sinal');
    g0.cx.__s = null; ok(g0.json('vigiar(__s, __t, "outono", "' + D + '", 0)').ok === false && g0.json('vigiarPodeVigiar(null, {}, "outono", "' + D + '", 0)').motivo === 'estado_invalido', 'estado nulo: recusa sem rebentar');
    ok(pode(base(), cond({ ceu: 'chuva' }), 'outono', D).ok === true && pode(copia(e0), cond({ ceu: 'chuva' }), 'outono', D).motivo === 'ja_hoje', 'vigiarPodeVigiar diz sim e já hoje');
    const e1 = copia(base()); pode(e1, cond({ ceu: 'chuva' }), 'outono', D); ok(JSON.stringify(e1) === JSON.stringify(base()), 'vigiarPodeVigiar só lê');
  }

  // ---------------- 3. Uma vez por dia e relógio ----------------
  {
    let e = base(); const t = cond({ ceu: 'chuva' });
    let x = vig(e, t, 'outono', D); ok(x.r.ok, '1.ª vigia do dia');
    x = vig(x.e, t, 'outono', D); ok(!x.r.ok && x.r.motivo === 'ja_hoje' && x.e.tempo.vigiarDias === 1, 'a 2.ª no mesmo dia é recusada e não sobe o contador');
    x = vig(x.e, t, 'outono', D1); ok(x.r.ok && x.e.tempo.vigiarDia === D1 && x.e.tempo.vigiarDias === 2, 'no dia seguinte volta a poder vigiar');
    x = vig(x.e, t, 'outono', D); ok(!x.r.ok && x.r.motivo === 'ja_hoje' && x.e.tempo.vigiarDia === D1, 'data do aparelho atrás (1 dia): continua "já vigiaste hoje" e o dia guardado não recua');
    x = vig(x.e, t, 'outono', ANT); ok(!x.r.ok && x.r.motivo === 'ja_hoje' && x.e.tempo.vigiarDia === D1 && x.e.tempo.vigiarDias === 2, 'data atrás 2 dias (o limite): continua recusada');
    x = vig(x.e, t, 'outono', ANT3); ok(x.r.ok && x.e.tempo.vigiarDia === ANT3 && x.e.tempo.vigiarDias === 3, 'data atrás mais de 2 dias repõe (e o dia efetivo passa a ser o de hoje)');
    // relógio atrás e à frente: sem vigias grátis
    let y = vig(base(), t, 'outono', D3); ok(y.r.ok && y.e.tempo.vigiarDia === D3, 'relógio à frente: vigia normal');
    y = vig(y.e, t, 'outono', D); ok(y.r.ok && y.e.tempo.vigiarDia === D, 'depois de vigiar com o relógio 3 dias à frente, voltar 3 dias atrás repõe (mais de 2 dias, regra dos PRs de relógio)');
  }
  {
    // tabela com o dia guardado: igual, 1, 2, 3 dias à frente, 1 dia atrás, lixo
    const casos = [[D, D, 'ja_hoje'], [D1, D, 'ja_hoje'], [D2, D, 'ja_hoje'], [D3, D, null], [ANT, D, null], [null, D, null], ['lixo', D, null], [5, D, null], ['', D, null]];
    casos.forEach(function (c) {
      const r = pode(base({ tempo: { vigiarDia: c[0], vigiarDias: 0 } }), cond({ ceu: 'chuva' }), 'outono', c[1]);
      ok((c[2] === null ? r.ok === true : r.motivo === c[2]), 'dia guardado ' + JSON.stringify(c[0]) + ' com hoje ' + c[1] + ' -> ' + (c[2] || 'pode') + ' (deu ' + JSON.stringify(r) + ')');
    });
  }

  // ---------------- 4. O contador e a eutipiose ----------------
  {
    let x = vig(base(), cond({ ceu: 'chuva' }), 'outono', D);
    ok(JSON.stringify(x.r.fichas) === '["mildio"]', 'dia 1: só a ficha do míldio');
    x.e.encyclopedia.unlocked = ['mildio'];
    x = vig(x.e, cond({ ceu: 'sol', calorForte: true }), 'outono', D1);
    ok(JSON.stringify(x.r.fichas) === '["oidio"]' && x.r.dias === 2, 'dia 2: ficha do oídio, ainda sem eutipiose');
    x.e.encyclopedia.unlocked = ['mildio', 'oidio'];
    x = vig(x.e, cond({ ceu: 'chuva' }), 'outono', D2);
    ok(x.r.dias === 3 && JSON.stringify(x.r.fichas) === '["eutipiose"]', 'dia 3: ficha da eutipiose (3.ª vigia em dias diferentes)');
    x.e.encyclopedia.unlocked.push('eutipiose');
    x = vig(x.e, cond({ ceu: 'chuva' }), 'outono', D3);
    ok(x.r.dias === 4 && x.r.fichas.length === 0, 'dia 4: o contador continua a subir e a ficha não se repete');
    const meio = vig(base({ tempo: { vigiarDia: D, vigiarDias: 2 }, encyclopedia: { unlocked: ['mildio', 'oidio'] } }), cond({ ceu: 'chuva' }), 'outono', D1);
    ok(JSON.stringify(meio.r.fichas) === '["eutipiose"]', 'com 2 vigias guardadas, a próxima dá a eutipiose');
    const tres = vig(base({ tempo: { vigiarDia: ANT, vigiarDias: 7 }, encyclopedia: { unlocked: ['mildio'] } }), cond({ ceu: 'sol', calorForte: true }), 'outono', D);
    ok(JSON.stringify(tres.r.fichas) === '["oidio","eutipiose"]', 'se a eutipiose ficou por abrir (contador alto), abre-se com a próxima vigia');
    const dois = vig(base({ tempo: { vigiarDia: D, vigiarDias: 1 } }), cond({ ceu: 'chuva' }), 'outono', D);
    ok(!dois.r.ok && dois.e.tempo.vigiarDias === 1, 'duas vigias no mesmo dia não contam como dois dias');
  }

  // ---------------- 5. Estado estragado: repara em memória ----------------
  [[undefined], [null], ['x'], [[]], [42], [{ vigiarDia: 'lixo', vigiarDias: -2 }], [{ vigiarDia: 5, vigiarDias: 'x' }], [{ vigiarDia: null, vigiarDias: 1.5 }], [{ vigiarDia: '', vigiarDias: NaN }], [{ vigiarDia: '2026-13-45', vigiarDias: null }], [{ frioDia: D }]].forEach(function (c) {
    const e0 = base(); if (c[0] === undefined) delete e0.tempo; else e0.tempo = c[0];
    const p = pode(copia(e0), cond({ ceu: 'chuva' }), 'outono', D);
    ok(p.ok === true, 'tempo ' + JSON.stringify(c[0]) + ': pode vigiar, sem rebentar (' + JSON.stringify(p) + ')');
    const { r, e } = vig(copia(e0), cond({ ceu: 'chuva' }), 'outono', D);
    ok(r.ok && e.tempo && e.tempo.vigiarDia === D && e.tempo.vigiarDias === 1, 'tempo ' + JSON.stringify(c[0]) + ': a vigia repara para { vigiarDia: hoje, vigiarDias: 1 }, ficou ' + JSON.stringify(e.tempo));
  });
  {
    const { e } = vig(base({ tempo: { vigiarDia: D1, vigiarDias: 2, frioDia: 'x', estacasDia: 'y' } }), cond({ ceu: 'chuva' }), 'outono', D3);
    ok(e.tempo.frioDia === 'x' && e.tempo.estacasDia === 'y', 'vigiar não mexe nos outros campos de state.tempo');
    const { e: e2 } = vig(base({ tempo: { vigiarDia: D, vigiarDias: Number.MAX_SAFE_INTEGER } }), cond({ ceu: 'chuva' }), 'outono', D1);
    ok(e2.tempo.vigiarDias === Number.MAX_SAFE_INTEGER, 'o contador nunca passa do inteiro seguro');
  }

  // ---------------- 6. Imagens ----------------
  ['mildio', 'oidio'].forEach(function (s) {
    g0.cx.__s = s;
    ok(g0.ev('vigiarImagem(__s, false)') === IMG[s].sinal && g0.ev('vigiarImagem(__s, true)') === IMG[s].depois, s + ': imagem do sinal e variante _2 depois de vigiar');
  });
  [null, undefined, 'x', 'MILDIO', 3].forEach(function (s) { g0.cx.__s = s; ok(g0.ev('vigiarImagem(__s, false)') === null && g0.ev('vigiarImagem(__s, true)') === null, 'sem sinal válido (' + JSON.stringify(s) + ') não há imagem'); });

  // ---------------- 7. A Vinha: botão, fundo, aviso ----------------
  const preparar = function (g, extra) { g.ev('state.reputacao = 100; state.vinha.fase = "crescendo"; state.objetivos.dia = diaLisboaDeHoje(); state.objetivos.lista = ' + (extra || '[]') + ';'); };
  {
    const g = abrir('?tempo=chuva'); preparar(g);
    g.ev('renderVinha()');
    let h = g.el('vinha-container').innerHTML;
    ok(/onclick="executarAcaoVinha\('vigiar'\)"/.test(h) && h.indexOf('data-i18n="vigiar.btn"') !== -1, 'com chuva a Vinha tem o botão "Vigiar a vinha"');
    ok(!/executarAcaoVinha\('vigiar'\)"[^>]*disabled|disabled[^>]*executarAcaoVinha\('vigiar'\)/.test(h), 'o botão está ativo antes de vigiar');
    ok(h.indexOf('vinha.pillProtegerFrio') === -1, 'sem frio não há o botão do frio (só o de vigiar)');
    ok(g.json('__fundos').pop() === IMG.mildio.sinal, 'com sinal de míldio o fundo da Vinha é doencas_e_pragas.jpg');
    ok(g.json('__falas').pop() === 'Há humidade no ar: é um bom dia para vigiar as folhas da vinha e arejá-la. Toca em «Vigiar a vinha».', 'o YoshiCat avisa do sinal (míldio)');
    const grav = g.gravacoes.length; const antes = g.ev('JSON.stringify(state)');
    g.ev('renderVinha()'); ok(g.gravacoes.length === grav && g.ev('JSON.stringify(state)') === antes, 'desenhar a Vinha não altera nem grava');
    const rep0 = g.ev('state.reputacao'), uvas0 = g.ev('state.uvas'), cuid0 = g.ev('state.vinha.pontosCuidado'), conh0 = g.ev('state.conhecimento');
    g.ev('executarAcaoVinha("vigiar")');
    h = g.el('vinha-container').innerHTML;
    ok(g.gravacoes.length === grav + 1, 'o clique grava uma só vez (' + (g.gravacoes.length - grav) + ')');
    ok(g.ev('state.tempo.vigiarDia') === D && g.ev('state.tempo.vigiarDias') === 1, 'o clique regista a vigia de hoje');
    ok(g.json('state.encyclopedia.unlocked').indexOf('mildio') !== -1 && g.ev('state.conhecimento') === conh0 + 1, 'o clique abre a ficha do míldio na Enciclopédia (+1 conhecimento, como as outras fichas)');
    ok(g.ev('state.reputacao') === rep0 && g.ev('state.uvas') === uvas0 && g.ev('state.vinha.pontosCuidado') === cuid0, 'sem objetivo de hoje: nada de Reputação, uvas nem cuidado');
    ok(g.json('__fundos').pop() === IMG.mildio.depois, 'depois de vigiar, o fundo é a variante _2 (doencas_e_pragas_2.jpg)');
    ok(g.json('__novas').pop() === 'mildio', 'aparece a notícia da ficha nova');
    const fala = g.json('__falas').pop();
    ok(fala.indexOf('manchas amarelas') !== -1 && fala.indexOf('Vigiaste a vinha e ganhaste uma ficha nova na Enciclopédia: O Míldio.') !== -1, 'a fala e o resultado dizem a ficha nova (' + fala + ')');
    ok(/disabled/.test(h.slice(h.indexOf("executarAcaoVinha('vigiar')") - 80, h.indexOf("executarAcaoVinha('vigiar')") + 400)) && h.indexOf('vigiar.jaHoje') === -1, 'depois de vigiar o botão fica apagado');
    // duplo clique
    const g1 = g.gravacoes.length; const est = g.ev('JSON.stringify(state)'); const falasAntes = g.json('__falas').length;
    g.ev('executarAcaoVinha("vigiar")');
    ok(g.gravacoes.length === g1 && g.ev('JSON.stringify(state)') === est && g.json('__falas').length === falasAntes, 'duplo clique (no mesmo instante): ignorado por completo (sem gravar, sem alterar, sem mudar a fala)');
    g.ir(g.relogio.t + 600); g.ev('executarAcaoVinha("vigiar")');
    ok(g.gravacoes.length === g1 && g.ev('state.tempo.vigiarDias') === 1 && g.json('__falas').pop() === 'já vigiaste hoje', 'um toque depois do intervalo: "já vigiaste hoje", sem gravar nem contar');
    ok(g.json('__fundos').pop() !== IMG.mildio.sinal, 'já vigiado hoje, o fundo do sinal já não aparece');
    g.ev('vinhaMensagemAtual = ""; renderVinha();');
    ok(g.json('__falas').pop() === '', 'já vigiado hoje, o YoshiCat já não repete o aviso do sinal');
  }
  {
    const g = abrir('?tempo=calor'); preparar(g);
    g.ev('renderVinha()');
    ok(/executarAcaoVinha\('vigiar'\)/.test(g.el('vinha-container').innerHTML), 'com calor forte a Vinha tem o botão "Vigiar a vinha"');
    ok(g.json('__fundos').pop() === IMG.oidio.sinal, 'com sinal de oídio o fundo é pragas_sol.jpg');
    ok(g.json('__falas').pop().indexOf('quente e seco') !== -1, 'o aviso do oídio fala de tempo quente e seco');
    g.ev('executarAcaoVinha("vigiar")');
    ok(g.json('__fundos').pop() === IMG.oidio.depois && g.json('state.encyclopedia.unlocked').indexOf('oidio') !== -1, 'depois de vigiar: pragas_sol_2.jpg e a ficha do oídio');
    ok(g.json('__falas').pop().indexOf('pó') !== -1, 'a fala do oídio fala do pó branco');
  }
  ['sol', 'noite', 'trovoada', 'granizo', 'vento', 'frio'].forEach(function (tt) {
    const g = abrir('?tempo=' + tt); preparar(g); g.ev('renderVinha()');
    ok(!/executarAcaoVinha\('vigiar'\)/.test(g.el('vinha-container').innerHTML), '?tempo=' + tt + ': sem sinal, sem botão (a Vinha fica como estava)');
  });
  {
    const g = abrir('?tempo=nevoeiro'); preparar(g); g.ev('renderVinha()');
    ok(/executarAcaoVinha\('vigiar'\)/.test(g.el('vinha-container').innerHTML), 'com nevoeiro há o botão de vigiar');
  }
  {
    const g = abrir('?tempo=chuva&estacao=inverno'); preparar(g); g.ev('renderVinha()');
    ok(!/executarAcaoVinha\('vigiar'\)/.test(g.el('vinha-container').innerHTML) && g.json('__fundos').pop() !== IMG.mildio.sinal, 'no inverno não há botão nem fundo do sinal');
    g.ev('executarAcaoVinha("vigiar")'); ok(g.gravacoes.length === 0 && g.ev('state.tempo.vigiarDias') === 0, 'no inverno, forçar o clique não faz nada nem grava');
  }
  {
    // chuva vista há 3 h na cache do tempo (sem chuva agora): míldio; antiga: nada
    const cacheBoa = { fetchedAt: AGORA - 60000, ok: true, tempC: 18, ventoKmh: 5, ceu: 'sol', granizo: false, chuvaEm: AGORA - 3 * HORA };
    const g = abrir('', AGORA, cacheBoa); g.ev('_tempoAtual = condicaoDeTeste(18, 5, "sol", false)'); preparar(g);
    ok(g.ev('vigiarSinalAgora()') === 'mildio', 'chuva na cache há 3 h: sinal de míldio mesmo com sol agora');
    const cacheVelha = Object.assign({}, cacheBoa, { chuvaEm: AGORA - 30 * HORA });
    const g2 = abrir('', AGORA, cacheVelha); g2.ev('_tempoAtual = condicaoDeTeste(18, 5, "sol", false)');
    ok(g2.ev('vigiarSinalAgora()') === null, 'chuva na cache há 30 h: sem sinal');
    const g3 = abrir('', AGORA, '{lixo'); g3.guardado.yoshicat_tempo_cache_v1 = '{lixo'; g3.ev('_tempoAtual = condicaoDeTeste(33, 5, "sol", false)');
    ok(g3.ev('vigiarSinalAgora()') === 'oidio', 'cache do tempo estragada: não rebenta e o calor dá oídio');
    const g4 = abrir(''); ok(g4.ev('vigiarSinalAgora()') === null && g4.ev('vigiarAviso()') === '' && g4.ev('vigiarFundoSinal()') === null, 'tempo indisponível: sem sinal, sem aviso, sem fundo');
  }
  { // frio/vento/trovoada com chuva vista na cache: a Vinha mantém o seu fundo raro
    const cache = { fetchedAt: AGORA - 60000, ok: true, tempC: 1, ventoKmh: 5, ceu: 'sol', granizo: false, chuvaEm: AGORA - HORA };
    const g = abrir('', AGORA, cache); g.ev('_tempoAtual = condicaoDeTeste(1, 5, "sol", false)'); preparar(g); g.ev('renderVinha()');
    ok(g.json('__fundos').pop() === 'assets/ecras/yoshi_cat_e_chizo_geada.jpg', 'frio forte com chuva vista: o fundo continua o do frio');
    const gt = abrir('?tempo=trovoada'); preparar(gt); gt.ev('renderVinha()'); ok(gt.json('__fundos').pop() === 'assets/ecras/trovoada_chizo.jpg', 'trovoada: o fundo continua o da trovoada');
  }
  { // a ficha da eutipiose pelo clique, em 3 dias
    const g = abrir('?tempo=chuva'); preparar(g);
    ['2026-10-09T12:00:00Z', '2026-10-10T12:00:00Z', '2026-10-11T12:00:00Z'].forEach(function (d, i) {
      g.ir(Date.parse(d)); preparar(g); g.ev('executarAcaoVinha("vigiar")');
      const u = g.json('state.encyclopedia.unlocked');
      ok(i < 2 ? u.indexOf('eutipiose') === -1 : u.indexOf('eutipiose') !== -1, 'pelo clique, dia ' + (i + 1) + ': eutipiose ' + (i < 2 ? 'ainda fechada' : 'aberta') + ' (' + u.join(',') + ')');
    });
    ok(g.ev('state.tempo.vigiarDias') === 3 && g.json('__novas').pop() === 'eutipiose', 'à 3.ª vigia aparece a notícia da eutipiose');
  }

  // ---------------- 8. O objetivo do dia ----------------
  {
    const g = abrir('?tempo=chuva'); preparar(g);
    ok(g.json('candidatosGrupoC()').indexOf('tempo_vigiar') !== -1, 'com sinal e por vigiar, tempo_vigiar é candidato do Grupo C');
    const antes = g.json('candidatosGrupoC()'); ok(antes.indexOf('tempo_vigiar') > antes.indexOf('tempo_chuva') || antes.indexOf('tempo_chuva') === -1, 'vem depois do objetivo da chuva (como tempo_frio vem depois dos outros do tempo)');
    g.ev('state.objetivos.lista = [{ id: "tempo_vigiar", cumprido: false }, { id: "vinha_regar", cumprido: false }, { id: "proteger_vencer", cumprido: false }];');
    const rep0 = g.ev('state.reputacao'); const uvasAntes = g.ev('state.uvas'); g.ev('executarAcaoVinha("vigiar")');
    ok(g.json('state.objetivos.lista')[0].cumprido === true && g.ev('state.reputacao') === rep0 + 2, 'vigiar cumpre o objetivo tempo_vigiar e paga os mesmos 2 pontos do tempo_frio');
    ok(g.ev('OBJETIVO_RECOMPENSA_PONTOS') === 2, 'a recompensa do objetivo é a de sempre (2)');
    ok(g.json('candidatosGrupoC()').indexOf('tempo_vigiar') === -1, 'depois de vigiar, tempo_vigiar já não é candidato');
    ok(g.ev('state.uvas') === uvasAntes, 'o objetivo não dá uvas');
    const gs = abrir('?tempo=sol'); preparar(gs); ok(gs.json('candidatosGrupoC()').indexOf('tempo_vigiar') === -1, 'sem sinal não há o objetivo');
    const gi = abrir('?tempo=chuva&estacao=inverno'); preparar(gi); ok(gi.json('candidatosGrupoC()').indexOf('tempo_vigiar') === -1, 'no inverno não há o objetivo');
    const gn = abrir(''); preparar(gn); ok(gn.json('candidatosGrupoC()').indexOf('tempo_vigiar') === -1, 'tempo indisponível: sem objetivo');
  }

  // ---------------- 9. Estado e nuvem ----------------
  {
    const d = g0.json('defaultState().tempo');
    ok(d.vigiarDia === null && d.vigiarDias === 0 && d.frioDia === null && d.estacasDia === null, 'o estado por omissão tem vigiarDia (null) e vigiarDias (0), e os campos antigos de state.tempo');
    g0.cx.__sv = { tempo: { frioDia: D, chuvaRegouDia: D } };
    const m = g0.json('mergeDeep(defaultState(), __sv).tempo');
    ok(m.vigiarDia === null && m.vigiarDias === 0 && m.frioDia === D, 'um save antigo (sem os campos) ganha-os sem perder nada');
    const nuvem = semCom(fontes['nuvem.js']);
    ok(!/vigiar/.test(nuvem) && !/\.tempo\b/.test(nuvem), 'nuvem.js não foi tocado nem junta state.tempo');
    ok(!/vigiar/i.test(semCom(fontes['proteger.js'])), 'proteger.js não foi tocado');
    const tp = semCom(fontes['tempo.js']);
    ok(!/vigiar/i.test(tp) && (tp.match(/fetch\(/g) || []).length === 1 && /current=temperature_2m,wind_speed_10m,weather_code,is_day/.test(fontes['tempo.js']), 'tempo.js não foi tocado: um só pedido de rede, sem humidade');
    const vinha = semCom(fontes['vinha.js']);
    ok(/function vinhaCompostar[\s\S]*?v\.adubo \+= adubo;/.test(vinha) && !/vigiar[\s\S]{0,40}compost|compost[\s\S]{0,40}vigiar/i.test(vinha), 'a Compostagem não foi tocada');
  }

  // ---------------- 10. Textos ----------------
  {
    const T = g0.json('TRANSLATIONS');
    const chaves = Object.keys(T.pt).filter(function (k) { return /^vigiar\./.test(k); });
    ok(chaves.length === 8, 'há 8 chaves vigiar.* em PT (' + chaves.length + ')');
    const lk = function (l) { return Object.keys(T[l]).filter(function (k) { return /^vigiar\./.test(k); }).sort().join(','); };
    ok(lk('pt') === lk('en') && lk('en') === lk('es'), 'as 3 línguas têm as mesmas chaves vigiar.*');
    ['pt', 'en', 'es'].forEach(function (l) {
      ok(typeof T[l]['objetivo.tempo_vigiar'] === 'string' && T[l]['objetivo.tempo_vigiar'].length > 5, l + ': tem o texto do objetivo tempo_vigiar');
      chaves.forEach(function (k) { ok(typeof T[l][k] === 'string' && T[l][k].length > 3, l + ': ' + k + ' não está vazia'); });
    });
    ok(Object.keys(T.pt).length === Object.keys(T.en).length && Object.keys(T.en).length === Object.keys(T.es).length, 'as 3 línguas têm o mesmo número de chaves');
    chaves.forEach(function (k) { ok(new Set(['pt', 'en', 'es'].map(function (l) { return T[l][k]; })).size === 3, k + ' é diferente em cada língua'); });
    ['aviso.mildio', 'aviso.oidio', 'fala.mildio', 'fala.oidio', 'resultado', 'resultadoFicha'].forEach(function (k) { ok(['pt', 'en', 'es'].every(function (l) { return T[l]['vigiar.' + k].length > 20; }), 'vigiar.' + k + ' tem texto a sério nas 3 línguas'); });
    ok(['pt', 'en', 'es'].every(function (l) { return T[l]['vigiar.resultadoFicha'].indexOf('{ficha}') !== -1; }), 'o resultado com ficha leva {ficha} nas 3 línguas');
    // fichas
    const E = g0.json('ENCYCLOPEDIA_ENTRIES');
    const proibido = /estragou|estragad|morreu|morrer|morte|\bdied\b|\bdead\b|\bdeath\b|ruined|destroyed|murió|muerto|muerte|arruinad|calda|bordalesa|bordeaux|fungicid|copper|cobre|\d/i;
    ['pt', 'en', 'es'].forEach(function (l) {
      ['mildio', 'oidio', 'eutipiose'].forEach(function (id) {
        const e = E[l].filter(function (x) { return x.id === id; })[0];
        ok(!!e && e.manual === true && typeof e.titulo === 'string' && e.titulo.length > 3 && typeof e.texto === 'string' && e.texto.length > 60, l + ': ficha ' + id + ' existe, é manual e tem título e texto');
        if (e) { ok(!proibido.test(e.titulo + ' ' + e.texto), l + ': ficha ' + id + ' sem "estragou/morreu", tratamentos nem números'); ok(!/Setúbal|Arrábida|Azeitão/.test(e.texto), l + ': ficha ' + id + ' sem factos locais'); }
      });
      ok(E[l].length === E.pt.length, l + ': a Enciclopédia tem o mesmo número de entradas que PT');
    });
    const ids = function (l) { return E[l].map(function (x) { return x.id; }).sort().join(','); };
    ok(ids('pt') === ids('en') && ids('en') === ids('es'), 'as 3 línguas têm as mesmas entradas na Enciclopédia');
    const pt = function (id) { return E.pt.filter(function (x) { return x.id === id; })[0].texto; };
    ok(/fungo/.test(pt('mildio')) && /humidade/.test(pt('mildio')) && /manchas amarelas/.test(pt('mildio')) && /óleo/.test(pt('mildio')), 'ficha do míldio: fungo, humidade, manchas amarelas «de óleo»');
    ok(/fungo/.test(pt('oidio')) && /pó/.test(pt('oidio')) && /seco e quente/.test(pt('oidio')) && /cachos/.test(pt('oidio')), 'ficha do oídio: fungo, «pó» branco nas folhas e cachos, tempo seco e quente');
    ok(/lenho/.test(pt('eutipiose')) && /troncos/.test(pt('eutipiose')) && /braços/.test(pt('eutipiose')), 'ficha da eutipiose: doença do lenho, troncos e braços');
    const alvo = ['mildio', 'oidio', 'eutipiose'];
    ok(alvo.every(function (id) { return !g0.json('entradasBloqueadas()').some(function (x) { return x.id === id; }); }), 'as fichas são manuais: o Explorar nunca as sorteia');
    const todos = ['pt', 'en', 'es'].map(function (l) { return chaves.map(function (k) { return T[l][k]; }).join(' '); }).join(' ');
    ok(!proibido.test(todos.replace(/\{ficha\}/g, '')), 'os textos vigiar.* não dizem "estragou/morreu", não falam de tratamentos nem trazem números');
    ok(!/Setúbal/.test(todos), 'os textos vigiar.* não afirmam nada sobre Setúbal');
  }

  // ---------------- 11. Ligações, regras puras, imagens ----------------
  {
    const html = fontes['index.html'];
    const pos = function (f) { return html.indexOf('<script src="js/' + f + '.js'); };
    ok(pos('vigiar') > pos('tempo') && pos('vigiar') > pos('estacoes') && pos('vigiar') < pos('vinha') && pos('vigiar') < pos('objetivos') && pos('vigiar') < pos('main'), 'index.html: vigiar.js depois do tempo.js e das estações, antes da vinha.js, dos objetivos e do main.js');
    ok(/js\/vigiar\.js\?v=\d+/.test(html), 'vigiar.js leva ?v=');
    const V = semCom(fs.readFileSync(path.join(RAIZ, 'js', 'vigiar.js'), 'utf8'));
    const regras = ['vigiarSinal', 'vigiarChuvaRecente', 'vigiarEstado', 'vigiarFeitoHoje', 'vigiarPodeVigiar', 'vigiar', 'vigiarImagem', 'vigiarInteiro', 'vigiarDiaValido'].map(function (f) { return g0.ev(f + '.toString()'); }).join('\n');
    ok(!/Math\.random|Date\.now|new Date|saveState|localStorage|document\.|tempoAtual|estacaoAtual|diaLisboaDeHoje|state\b/.test(regras), 'as regras de vigiar são puras (sem relógio, sorteio, gravação, DOM nem estado global)');
    ok((V.match(/saveState\(/g) || []).length === 1 && /function vigiarExecutar[\s\S]*saveState\(state\)/.test(V), 'só o clique (vigiarExecutar) grava, uma vez');
    ok((V.match(/Date\.now\(/g) || []).length === 2 && /function vigiarSinalAgora[\s\S]*Date\.now\(\)[\s\S]*function vigiarExecutar[\s\S]*Date\.now\(\)/.test(V), 'os únicos Date.now são o de "agora" para o sinal e o do duplo clique');
    ok(!/Math\.random|randInt/.test(V), 'vigiar.js não sorteia');
    ok(!/state\.(uvas|gotas|garrafas|reputacao)\s*(-=|\+=|=[^=])|pontosCuidado|\.adubo|\.residuos|\.bagaco/.test(V), 'vigiar.js não mexe em uvas, Gotas, garrafas, Reputação, cuidado, adubo, resíduos nem Bagaço');
    const vi = semCom(fontes['vinha.js']);
    ok(/vigiarJaFezHoje\(\), t\('vigiar\.jaHoje'\)/.test(vi) && /actionKey === 'vigiar'/.test(vi), 'vinha.js: botão e ação ligados');
    const orig = path.join(RAIZ, 'imagens_JOGO_TELEGRAM');
    ['doencas_e_pragas.jpg', 'doencas_e_pragas_2.jpg', 'pragas_sol.jpg', 'pragas_sol_2.jpg'].forEach(function (f) {
      const dst = path.join(RAIZ, 'assets', 'ecras', f);
      ok(fs.existsSync(dst), 'assets/ecras/' + f + ' existe');
      if (fs.existsSync(dst)) {
        const b = fs.readFileSync(dst);
        ok(b[0] === 0xff && b[1] === 0xd8, f + ' é um JPEG');
        let w = 0, hh = 0;
        for (let i = 2; i < b.length - 9;) { if (b[i] !== 0xff) { i++; continue; } const m = b[i + 1]; if (m >= 0xc0 && m <= 0xc2) { hh = b.readUInt16BE(i + 5); w = b.readUInt16BE(i + 7); break; } i += 2 + b.readUInt16BE(i + 2); }
        ok(w === 714 && hh === 1280, f + ' tem 714x1280, tem ' + w + 'x' + hh);
        ok(b.length <= 250 * 1024, f + ' não devia pesar mais de 250 KB (pesa ' + b.length + ')');
        if (fs.existsSync(path.join(orig, f))) ok(crypto.createHash('md5').update(b).digest('hex') === crypto.createHash('md5').update(fs.readFileSync(path.join(orig, f))).digest('hex'), f + ' é cópia exata do original');
      }
      if (fs.existsSync(orig)) ok(fs.existsSync(path.join(orig, f)), 'o original imagens_JOGO_TELEGRAM/' + f + ' continua no sítio');
    });
    const cfg = g0.json('VIGIAR_CONFIG.imagens');
    ok(JSON.stringify(cfg) === JSON.stringify(IMG), 'VIGIAR_CONFIG aponta para as 4 imagens certas');
    const creditos = fs.readFileSync(path.join(RAIZ, 'CREDITOS.md'), 'utf8');
    ['doencas_e_pragas.jpg', 'doencas_e_pragas_2.jpg', 'pragas_sol.jpg', 'pragas_sol_2.jpg'].forEach(function (f) { ok(new RegExp('\\| `assets/ecras/' + f.replace(/\./g, '\\.') + '` \\|[^\\n]*origem a confirmar pelo Nuno').test(creditos), 'CREDITOS.md lista ' + f + ' (origem a confirmar pelo Nuno)'); });
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
  ['o míldio não conta a chuva', 'vigiar.js', "tempo.ceu === 'chuva' || tempo.ceu === 'nevoeiro' ||", "tempo.ceu === 'nevoeiro' ||"],
  ['o míldio não conta o nevoeiro', 'vigiar.js', "tempo.ceu === 'chuva' || tempo.ceu === 'nevoeiro' ||", "tempo.ceu === 'chuva' ||"],
  ['a chuva vista não conta', 'vigiar.js', ' || vigiarChuvaRecente(tempo.chuvaEm, agora)', ''],
  ['a janela da chuva é de 48 h', 'vigiar.js', 'janelaChuvaMs: 24 * 60 * 60 * 1000', 'janelaChuvaMs: 48 * 60 * 60 * 1000'],
  ['a janela da chuva é de 12 h', 'vigiar.js', 'janelaChuvaMs: 24 * 60 * 60 * 1000', 'janelaChuvaMs: 12 * 60 * 60 * 1000'],
  ['a janela exclui as 24 h exatas', 'vigiar.js', 'idade >= 0 && idade <= VIGIAR_CONFIG.janelaChuvaMs', 'idade >= 0 && idade < VIGIAR_CONFIG.janelaChuvaMs'],
  ['chuva no futuro conta', 'vigiar.js', 'return idade >= 0 && idade <=', 'return idade <='],
  ['chuvaEm texto conta', 'vigiar.js', "if (typeof chuvaEm !== 'number' || typeof agora !== 'number' || !Number.isFinite(chuvaEm) || !Number.isFinite(agora)) return false;", 'if (!chuvaEm || !agora) return false;'],
  ['o oídio não precisa de calor', 'vigiar.js', 'if (tempo.calorForte === true) return', 'if (true) return'],
  ['calor "truthy" conta', 'vigiar.js', 'if (tempo.calorForte === true) return', 'if (tempo.calorForte) return'],
  ['o oídio ganha ao míldio', 'vigiar.js', "  if (tempo.ceu === 'chuva' || tempo.ceu === 'nevoeiro' || vigiarChuvaRecente(tempo.chuvaEm, agora)) return 'mildio';\n  if (tempo.calorForte === true) return 'oidio';", "  if (tempo.calorForte === true) return 'oidio';\n  if (tempo.ceu === 'chuva' || tempo.ceu === 'nevoeiro' || vigiarChuvaRecente(tempo.chuvaEm, agora)) return 'mildio';"],
  ['o inverno também dá sinal', 'vigiar.js', "estacoes: ['primavera', 'verao', 'outono'],", "estacoes: ['primavera', 'verao', 'outono', 'inverno'],"],
  ['a primavera não dá sinal', 'vigiar.js', "estacoes: ['primavera', 'verao', 'outono'],", "estacoes: ['verao', 'outono'],"],
  ['estação estranha dá sinal', 'vigiar.js', "if (VIGIAR_CONFIG.estacoes.indexOf(estacao) === -1) return null; // inverno, ou estação estranha", "if (estacao === 'inverno') return null;"],
  ['tempo indisponível dá sinal', 'vigiar.js', "if (!tempo || typeof tempo !== 'object' || tempo.disponivel !== true) return null;", "if (!tempo || typeof tempo !== 'object') return null;"],
  ['tempo "disponivel" texto conta', 'vigiar.js', "tempo.disponivel !== true) return null;", "!tempo.disponivel) return null;"],
  ['tempo nulo rebenta', 'vigiar.js', "if (!tempo || typeof tempo !== 'object' || tempo.disponivel !== true) return null;", "if (tempo.disponivel !== true) return null;"],
  ['sem sinal também vigia', 'vigiar.js', "  if (sinal === null) return recusa('sem_sinal');\n", ''],
  ['pode vigiar várias vezes por dia', 'vigiar.js', "  if (vigiarFeitoHoje(estado, hoje)) return recusa('ja_hoje', sinal);\n", ''],
  ['o dia só conta se for igual (data atrás repõe)', 'vigiar.js', 'return !diaLisboaMudou(hoje, t.vigiarDia);', 'return t.vigiarDia === hoje;'],
  ['sem teto de 2 dias à frente', 'vigiar.js', 'return !diaLisboaMudou(hoje, t.vigiarDia);', 'return t.vigiarDia >= hoje;'],
  ['dia inválido aceite', 'vigiar.js', "  if (!vigiarDiaValido(hoje)) return recusa('dia_invalido');\n", ''],
  ['o contador não sobe', 'vigiar.js', 't.vigiarDias = Math.min(Number.MAX_SAFE_INTEGER, t.vigiarDias + 1);', ''],
  ['o contador sobe de 2 em 2', 'vigiar.js', 't.vigiarDias + 1);', 't.vigiarDias + 2);'],
  ['o contador passa do inteiro seguro', 'vigiar.js', 't.vigiarDias = Math.min(Number.MAX_SAFE_INTEGER, t.vigiarDias + 1);', 't.vigiarDias = t.vigiarDias + 1;'],
  ['a eutipiose abre à 2.ª vigia', 'vigiar.js', 'vigiasParaEutipiose: 3,', 'vigiasParaEutipiose: 2,'],
  ['a eutipiose abre à 4.ª vigia', 'vigiar.js', 'vigiasParaEutipiose: 3,', 'vigiasParaEutipiose: 4,'],
  ['a eutipiose só à 3.ª exata', 'vigiar.js', 't.vigiarDias >= VIGIAR_CONFIG.vigiasParaEutipiose', 't.vigiarDias === VIGIAR_CONFIG.vigiasParaEutipiose'],
  ['a eutipiose repete-se', 'vigiar.js', ' && abertas.indexOf(F.eutipiose) === -1', ''],
  ['a ficha do sinal repete-se', 'vigiar.js', 'if (abertas.indexOf(F[p.sinal]) === -1) fichas.push(F[p.sinal]);', 'fichas.push(F[p.sinal]);'],
  ['a ficha do míldio é a do oídio', 'vigiar.js', "fichas: { mildio: 'mildio', oidio: 'oidio', eutipiose: 'eutipiose' }", "fichas: { mildio: 'oidio', oidio: 'oidio', eutipiose: 'eutipiose' }"],
  ['o campo não é reparado', 'vigiar.js', "  if (!vigiarDiaValido(t.vigiarDia)) t.vigiarDia = null;\n  t.vigiarDias = vigiarInteiro(t.vigiarDias);\n", ''],
  ['contador negativo aceite', 'vigiar.js', "return typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= Number.MAX_SAFE_INTEGER ? n : 0;", "return typeof n === 'number' && Number.isInteger(n) ? n : 0;"],
  ['state.tempo estranho não se repara', 'vigiar.js', "if (!t || typeof t !== 'object' || Array.isArray(t)) t = estado.tempo = {};", ''],
  ['recusar altera o estado', 'vigiar.js', "  if (!p.ok) return { ok: false,", "  vigiarEstado(estado); if (!p.ok) return { ok: false,"],
  ['vigiar dá cuidado', 'vigiar.js', '  t.vigiarDias = Math.min(', '  if (estado.vinha) estado.vinha.pontosCuidado += 1;\n  t.vigiarDias = Math.min('],
  ['vigiar dá uvas', 'vigiar.js', '  t.vigiarDias = Math.min(', '  estado.uvas += 1;\n  t.vigiarDias = Math.min('],
  ['vigiar custa uvas', 'vigiar.js', '  t.vigiarDias = Math.min(', '  estado.uvas -= 1;\n  t.vigiarDias = Math.min('],
  ['vigiar dá Reputação', 'vigiar.js', '  t.vigiarDias = Math.min(', '  estado.reputacao += 3;\n  t.vigiarDias = Math.min('],
  ['míldio com a imagem do oídio', 'vigiar.js', "mildio: { sinal: 'assets/ecras/doencas_e_pragas.jpg'", "mildio: { sinal: 'assets/ecras/pragas_sol.jpg'"],
  ['depois de vigiar a mesma imagem', 'vigiar.js', "depois: 'assets/ecras/pragas_sol_2.jpg'", "depois: 'assets/ecras/pragas_sol.jpg'"],
  ['a imagem não distingue o "depois"', 'vigiar.js', 'return i ? (feito ? i.depois : i.sinal) : null;', 'return i ? i.sinal : null;'],
  ['sinal inválido tem imagem', 'vigiar.js', "VIGIAR_CONFIG.imagens[sinal === 'mildio' || sinal === 'oidio' ? sinal : '']", "VIGIAR_CONFIG.imagens[sinal] || VIGIAR_CONFIG.imagens.mildio"],
  ['a regra usa o relógio', 'vigiar.js', 'function vigiarFeitoHoje(estado, hoje) {', 'function vigiarFeitoHoje(estado, hoje) {\n  void Date.now();'],
  ['a regra sorteia', 'vigiar.js', 'function vigiarImagem(sinal, feito) {', 'function vigiarImagem(sinal, feito) {\n  void Math.random();'],
  ['sem duplo clique', 'vigiar.js', 'if (agora - vigiarUltimoCliqueMs < VIGIAR_ENTRE_CLIQUES_MS) return;', ''],
  ['o clique grava duas vezes', 'vigiar.js', '    saveState(state);\n    updateStatsDisplays();', '    saveState(state); saveState(state);\n    updateStatsDisplays();'],
  ['o clique grava mesmo recusando', 'vigiar.js', "    if (!r.ok) {\n", "    if (!r.ok) {\n      saveState(state);\n"],
  ['o clique não grava', 'vigiar.js', '    saveState(state);\n    updateStatsDisplays();', '    updateStatsDisplays();'],
  ['o clique não desbloqueia a ficha', 'vigiar.js', 'const entrada = desbloquearEntradaEnciclopedia(id);', 'const entrada = null;'],
  ['o clique não cumpre o objetivo', 'vigiar.js', "marcarObjetivoCumprido('tempo_vigiar');", ''],
  ['o clique cumpre outro objetivo', 'vigiar.js', "marcarObjetivoCumprido('tempo_vigiar');", "marcarObjetivoCumprido('tempo_frio');"],
  ['o clique mostra sempre a imagem do sinal', 'vigiar.js', 'vinhaFotoAtual = vigiarImagem(r.sinal, true);', 'vinhaFotoAtual = vigiarImagem(r.sinal, false);'],
  ['"já vigiaste hoje" não aparece', 'vigiar.js', "if (r.motivo === 'ja_hoje') vinhaMensagemAtual = t('vigiar.jaHoje');", ''],
  ['o clique vigia sem sinal (usa o estado do tempo antigo)', 'vigiar.js', 'const r = vigiar(state, vigiarTempoAgora(), estacaoAtual(), diaLisboaDeHoje(), agora);', "const r = vigiar(state, { disponivel: true, ceu: 'chuva' }, 'outono', diaLisboaDeHoje(), agora);"],
  ['o sinal de agora ignora a chuva da cache', 'vigiar.js', 'return Object.assign({}, tempoAtual(), { chuvaEm: chuvaEm });', 'return Object.assign({}, tempoAtual());'],
  ['cache estragada rebenta', 'vigiar.js', "  try { chuvaEm = chuvaEmDaCache(carregarTempoCache()); } catch (e) { chuvaEm = null; }", "  chuvaEm = chuvaEmDaCache(JSON.parse(localStorage.getItem('yoshicat_tempo_cache_v1')));"],
  ['o aviso aparece depois de vigiar', 'vigiar.js', "return s !== null && !vigiarJaFezHoje() ? t('vigiar.aviso.' + s) : '';", "return s !== null ? t('vigiar.aviso.' + s) : '';"],
  ['o fundo do sinal tapa a trovoada', 'vigiar.js', "if (tempo.ceu === 'trovoada' || tempo.ventoForte || tempo.frioForte) return null;", ''],
  ['o fundo do sinal tapa o frio', 'vigiar.js', "if (tempo.ceu === 'trovoada' || tempo.ventoForte || tempo.frioForte) return null;", "if (tempo.ceu === 'trovoada' || tempo.ventoForte) return null;"],
  ['o fundo do sinal fica depois de vigiar', 'vigiar.js', "return s !== null && !vigiarJaFezHoje() ? vigiarImagem(s, false) : null;", "return s !== null ? vigiarImagem(s, false) : null;"],
  ['a Vinha não usa o fundo do sinal', 'vinha.js', 'vinhaFotoAtual || vigiarFundoSinal() ||', 'vinhaFotoAtual ||'],
  ['a Vinha não mostra o aviso', 'vinha.js', "atualizarDialogo(vinhaMensagemAtual || vigiarAviso(), 'YoshiCat');", "atualizarDialogo(vinhaMensagemAtual, 'YoshiCat');"],
  ['o botão aparece sem sinal', 'vinha.js', 'if (vigiarSinalAgora() !== null) {\n    botoesHtml += botaoVinha(', 'if (true) {\n    botoesHtml += botaoVinha('],
  ['o botão não fica apagado depois de vigiar', 'vinha.js', "botaoVinha('vigiar', 'vigiar.btn', vigiarJaFezHoje(), t('vigiar.jaHoje'))", "botaoVinha('vigiar', 'vigiar.btn', false, t('vigiar.jaHoje'))"],
  ['a ação vigiar não está ligada', 'vinha.js', "  } else if (actionKey === 'vigiar') {\n    vigiarExecutar(); // grava e desenha por si; não custa nada nem dá cuidado\n    return;\n", ''],
  ['o objetivo aparece sem sinal', 'objetivos.js', 'if (vigiarSinalAgora() !== null && !vigiarJaFezHoje()) {', 'if (!vigiarJaFezHoje()) {'],
  ['o objetivo repete-se depois de vigiar', 'objetivos.js', 'if (vigiarSinalAgora() !== null && !vigiarJaFezHoje()) {', 'if (vigiarSinalAgora() !== null) {'],
  ['o objetivo não existe', 'objetivos.js', "lista.push('tempo_vigiar');", ''],
  ['o estado por omissão perde o campo', 'state.js', '      vigiarDia: null,\n      vigiarDias: 0\n', '      vigiarDia: null\n'],
  ['o estado por omissão perde o contador', 'state.js', '      vigiarDia: null,\n      vigiarDias: 0\n', '      vigiarDias: 0\n'],
  ['a nuvem junta o tempo', 'nuvem.js', 'function ', 'function vigiarX() {} function '],
  ['texto em falta (EN)', 'i18n.js', "    'vigiar.btn': 'Watch the vineyard',\n", ''],
  ['texto em falta (ES)', 'i18n.js', "    'vigiar.btn': 'Vigilar el viñedo',\n", ''],
  ['objetivo sem texto (PT)', 'i18n.js', "    'objetivo.tempo_vigiar': 'Vigia a Vinha: o tempo de hoje dá um sinal.',\n", ''],
  ['texto diz "estragou"', 'i18n.js', "'Vigiaste a vinha com atenção. Nada se perdeu: só aprendeste mais.'", "'Vigiaste a vinha com atenção. Nada estragou: só aprendeste mais.'"],
  ['texto fala de calda bordalesa', 'i18n.js', "Arejar a vinha ajuda.',\n    'vigiar.fala.oidio'", "Usa calda bordalesa.',\n    'vigiar.fala.oidio'"],
  ['texto com um número', 'i18n.js', "'Vigiaste a vinha com atenção. Nada se perdeu: só aprendeste mais.'", "'Vigiaste a vinha com atenção. Nada se perdeu: aprendeste 100% mais.'"],
  ['texto afirma um facto de Setúbal', 'i18n.js', "'Há humidade no ar: é um bom dia", "'Em Setúbal há míldio: é um bom dia"],
  ['ficha do míldio sem humidade', 'explorar.js', 'Gosta de humidade e deixa nas folhas manchas amarelas, «de óleo».', 'Deixa nas folhas manchas amarelas, «de óleo».'],
  ['ficha do oídio sem tempo seco e quente', 'explorar.js', 'aparece com tempo seco e quente.', 'aparece de vez em quando.'],
  ['ficha da eutipiose sem troncos', 'explorar.js', 'ataca os troncos e os braços da videira.', 'ataca a videira.'],
  ['ficha da eutipiose deixa de ser manual', 'explorar.js', "{ id: 'eutipiose', manual: true, titulo: 'A Eutipiose'", "{ id: 'eutipiose', titulo: 'A Eutipiose'"],
  ['ficha do oídio em falta (ES)', 'explorar.js', "{ id: 'oidio', manual: true, titulo: 'El Oídio'", "{ id: 'oidioX', manual: true, titulo: 'El Oídio'"],
  ['a ficha do míldio morre (texto)', 'explorar.js', "Por isso é um bom hábito vigiar a vinha depois da chuva ou do nevoeiro, e arejá-la ajuda.", "Por isso a vinha morreu muitas vezes."],
  ['vigiar.js sai do index.html', 'index.html', '  <script src="js/vigiar.js?v=1"></script>\n', ''],
  ['vigiar.js depois da vinha.js', 'index.html', '  <script src="js/vigiar.js?v=1"></script>\n  <script src="js/vinha.js?v=56"></script>\n', '  <script src="js/vinha.js?v=56"></script>\n  <script src="js/vigiar.js?v=1"></script>\n'],
  ['vigiar.js sem ?v=', 'index.html', 'js/vigiar.js?v=1', 'js/vigiar.js'],
  ['o tempo.js ganha um pedido', 'tempo.js', 'const TEMPO_CACHE_KEY', "const _x = () => fetch('/x'); const TEMPO_CACHE_KEY"]
];
MUTACOES.forEach(function (m) {
  const f = mutar(m[1], m[2], m[3]);
  if (!f) return;
  let apanhada;
  try { apanhada = suite(f).length > 0; } catch (e) { apanhada = true; if (process.env.VIGIAR_DEBUG) console.log('(mutação que rebenta: ' + m[0] + ': ' + e.message.split('\n')[0] + ')'); }
  if (!apanhada) falhas.push('MUTAÇÃO NÃO APANHADA: ' + m[0]);
});

if (falhas.length) {
  falhas.slice(0, 60).forEach(function (m) { console.log('FALHA: ' + m); });
  console.log(falhas.length + ' falha(s)');
  process.exit(1);
}
console.log('OK (' + MUTACOES.length + ' mutações apanhadas)');
