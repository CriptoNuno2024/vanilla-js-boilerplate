#!/usr/bin/env node
// "Pôr a mesa da vindima" (nível 8, ecrã O Lagar): a regra pura despensaMesaVindima (js/despensa.js), os valores em
// LAGAR_CONFIG.mesa (js/lagar.js), state.lagar.mesaDia (js/state.js) e a ligação ao ecrã. Corre state.js, i18n.js,
// niveis.js, capitulos.js, estrada-dados.js, despensa.js e lagar.js REAIS num ambiente simulado (vm), sem browser nem conta real.
//
// Uso: node scripts/verificar-mesa.js
// DESPENSA_JS=caminho  corre sobre outra versão de js/despensa.js (provas negativas).
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const DESPENSA_JS = process.env.DESPENSA_JS || path.join(RAIZ, 'js', 'despensa.js');
let falhas = 0;
function ok(cond, msg) { if (!cond) { falhas++; console.log('FALHA: ' + msg); } }
const ler = function (f) { return fs.readFileSync(f, 'utf8'); };

// Mesmo ambiente do verificar-nivel8.js, com a Estrada e a Despensa. "puro" proíbe Math.random e Date.now depois de tudo carregado.
function abrir(guardadoInicial, puro) {
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
    document: { querySelectorAll: function () { return []; }, getElementById: function () { return null; }, querySelector: function () { return null; }, addEventListener: function () {} },
    setTimeout: function () { return 1; }, clearTimeout: function () {}, Image: function () {}, Date: (function () { class D extends Date {} return D; })() // própria de cada ambiente: proibir Date.now num não afeta os outros
  };
  sb.window = sb;
  sb.Telegram = { WebApp: {} };
  const cx = vm.createContext(sb);
  vm.runInContext(ler(path.join(RAIZ, 'js', 'state.js')), cx, { filename: 'state.js' });
  vm.runInContext(ler(path.join(RAIZ, 'js', 'i18n.js')), cx, { filename: 'i18n.js' });
  vm.runInContext(`
    var FALAS = [];
    function mostrarFalas(f, quem) { FALAS.push({ f: f, quem: quem }); }
    function vibrar() {} function tocarSom() {} function updateStatsDisplays() {}
    function localeAtual() { return 'pt-PT'; }
    function diaLisboaDeHoje() { return '2026-10-09'; }
    function estradaNomeBem(id) { return 'nome:' + id; }
  `, cx);
  ['niveis.js', 'capitulos.js', 'estrada-dados.js'].forEach(function (f) { vm.runInContext(ler(path.join(RAIZ, 'js', f)), cx, { filename: f }); });
  vm.runInContext(ler(DESPENSA_JS), cx, { filename: 'despensa.js' });
  vm.runInContext(ler(path.join(RAIZ, 'js', 'lagar.js')), cx, { filename: 'lagar.js' });
  if (puro) vm.runInContext('Math.random = function () { throw new Error("Math.random proibido"); }; Date.now = function () { throw new Error("Date.now proibido"); };', cx);
  const g = { cx: cx };
  g.ev = function (c) { return vm.runInContext(c, cx); };
  g.json = function (c) { return JSON.parse(vm.runInContext('JSON.stringify(' + c + ')', cx)); };
  g.estado = function () { return vm.runInContext('JSON.stringify(state)', cx); };
  return g;
}

const BENS = ['queijo_azeitao', 'sal_sado', 'mel_sesimbra'];
const RECEITA = "{ bens: LAGAR_CONFIG.mesa.bens, reputacao: LAGAR_CONFIG.mesa.reputacao }";
const cheia = function (n) {
  const r = {}; BENS.forEach(function (b) { r[b] = n; });
  return { reputacao: 1500, uvas: 100, ultimaGravacaoEm: 1, acesso: { jogadorAntigo: false, introMostrada: true }, despensa: { recebidos: r, entregues: {}, primeiraTroca: { queijo_azeitao: '2026-10-01', sal_sado: '2026-10-01', mel_sesimbra: '2026-10-01' }, hoje: { dia: null, feitas: {} } } };
};
const mesa = function (g, dia, receita) { return g.json('despensaMesaVindima(state, ' + JSON.stringify(dia) + ', ' + (receita || RECEITA) + ')'); };

// 1. Os valores: os 3 bens de origem do capítulo 7 (pelos ids), +12, a imagem pedida.
{
  const g = abrir();
  ok(JSON.stringify(g.json('LAGAR_CONFIG.mesa.bens')) === JSON.stringify(BENS.map(function (b) { return { bem: b, n: 1 }; })), 'a mesa gasta 1 queijo, 1 sal e 1 mel');
  ok(JSON.stringify(g.json("CAPITULOS_CONFIG.filter(function (c) { return c.id === 'cap7'; })[0].criterio[0].chaves")) === JSON.stringify(BENS), 'são os 3 bens de origem do capítulo 7');
  ok(g.ev('LAGAR_CONFIG.mesa.reputacao') === 12, '+12 de Reputação');
  ok(g.ev('LAGAR_CONFIG.mesa.imagem') === 'assets/ecras/yoshi_cat_festa.jpg' && fs.existsSync(path.join(RAIZ, 'assets', 'ecras', 'yoshi_cat_festa.jpg')), 'imagem do resultado da mesa');
  ok(g.ev('BENS_OK = LAGAR_CONFIG.mesa.bens.every(function (b) { return despensaBemExiste(b.bem); })') === true, 'os bens da mesa existem em ESTRADA_BENS');
}

// 2. Despensa cheia: gasta 1 de cada (só "entregues"), +12, marca o dia, mais nada muda; "recebidos" e o capítulo 7 ficam como estavam.
{
  const g = abrir(cheia(2), true);
  const antes = JSON.parse(g.estado());
  const recebidosAntes = JSON.stringify(g.json('state.despensa.recebidos'));
  ok(g.ev("capituloEstaCumprido(CAPITULOS_CONFIG.filter(function (c) { return c.id === 'cap7'; })[0])") === true, 'premissa: com 2 de cada, o cap7 está cumprido');
  const r = mesa(g, '2026-10-09');
  ok(r.ok === true && r.motivo === null && r.reputacaoGanha === 12 && r.faltam.length === 0 && r.gastos.length === 3, 'mesa: ' + JSON.stringify(r));
  ok(JSON.stringify(g.json('state.despensa.recebidos')) === recebidosAntes, '"recebidos" nunca muda');
  ok(JSON.stringify(g.json('state.despensa.entregues')) === JSON.stringify({ queijo_azeitao: 1, sal_sado: 1, mel_sesimbra: 1 }), '"entregues" sobe 1 de cada');
  ok(BENS.every(function (b) { return g.ev("despensaQuantos(state, '" + b + "')") === 1; }), 'ficam 1 de cada na Despensa');
  ok(g.ev('state.reputacao') === 1512 && g.ev('state.lagar.mesaDia') === '2026-10-09', '1512 de Reputação e mesaDia marcado');
  const depois = JSON.parse(g.estado());
  const esperado = JSON.parse(JSON.stringify(antes));
  esperado.despensa.entregues = { queijo_azeitao: 1, sal_sado: 1, mel_sesimbra: 1 };
  esperado.reputacao = 1512; esperado.lagar = { ultimoDia: null, dias: 0, mesaDia: '2026-10-09' };
  ok(JSON.stringify(depois) === JSON.stringify(esperado), 'só mudam entregues, Reputação e lagar.mesaDia (nem uvas, nem ultimoDia, nem dias, nem primeiraTroca, nem hoje)');
  // Uma vez por dia: a 2.ª no mesmo dia é recusada sem alterar nada, mesmo com stock.
  const a = g.estado();
  const r2 = mesa(g, '2026-10-09');
  ok(!r2.ok && r2.motivo === 'ja_hoje' && g.estado() === a, 'mesmo dia: recusado (ja_hoje) sem alterar nada');
  // Relógio atrás: recusado.
  const r3 = mesa(g, '2026-10-08');
  ok(!r3.ok && r3.motivo === 'dia_anterior' && g.estado() === a, 'dia anterior: recusado sem alterar nada');
  // Dia seguinte, com o último de cada: gasta tudo, a Despensa fica a 0, e o capítulo 7 continua cumprido.
  const r4 = mesa(g, '2026-10-10');
  ok(r4.ok && BENS.every(function (b) { return g.ev("despensaQuantos(state, '" + b + "')") === 0; }), 'dia seguinte gasta o último de cada: Despensa a 0');
  ok(JSON.stringify(g.json('state.despensa.recebidos')) === recebidosAntes && g.ev("capituloEstaCumprido(CAPITULOS_CONFIG.filter(function (c) { return c.id === 'cap7'; })[0])") === true, 'o capítulo 7 continua cumprido com a Despensa a 0');
  // Sem stock no dia seguinte: recusa e diz que faltam os 3.
  const r5 = mesa(g, '2026-10-11');
  ok(!r5.ok && r5.motivo === 'faltam_bens' && JSON.stringify(r5.faltam) === JSON.stringify(BENS), 'Despensa vazia: faltam os 3 bens');
}

// 3. Bens em falta: diz quais, não altera nada (nem repara o estado).
{
  BENS.forEach(function (falta) {
    const g = abrir(cheia(1));
    g.ev("state.despensa.entregues." + falta + " = 1"); // fica com 0 desse bem
    const antes = g.estado();
    const r = mesa(g, '2026-10-09');
    ok(!r.ok && r.motivo === 'faltam_bens' && JSON.stringify(r.faltam) === JSON.stringify([falta]) && r.reputacaoGanha === 0, 'falta só ' + falta + ': ' + JSON.stringify(r));
    ok(g.estado() === antes, 'faltar ' + falta + ' não altera nada (nem os outros bens)');
    const e = g.json('lagarMesaEstado(state, "2026-10-09")');
    ok(!e.ok && e.motivo === 'faltam_bens' && JSON.stringify(e.faltam) === JSON.stringify([falta]), 'o ecrã (lagarMesaEstado) também diz que falta ' + falta);
  });
  const g = abrir(cheia(1));
  g.ev('state.despensa = null');
  const antes = g.estado();
  const r = mesa(g, '2026-10-09');
  ok(!r.ok && r.motivo === 'faltam_bens' && r.faltam.length === 3 && g.estado() === antes, 'state.despensa null: faltam os 3, sem rebentar e sem alterar nada');
  // O ecrã com tudo certo.
  const h = abrir(cheia(1));
  ok(h.json('lagarMesaEstado(state, "2026-10-09")').ok === true, 'lagarMesaEstado: ok com a Despensa cheia');
  mesa(h, '2026-10-09');
  ok(h.json('lagarMesaEstado(state, "2026-10-09")').motivo === 'ja_hoje', 'lagarMesaEstado: ja_hoje depois de pôr a mesa');
}

// 4. Independente do "Pisar as uvas": cada tarefa tem o seu dia, nos dois sentidos.
{
  const g = abrir(cheia(3));
  ok(g.json("lagarPisar(state, '2026-10-09')").ok === true, 'pisar hoje');
  ok(mesa(g, '2026-10-09').ok === true, 'a mesa do mesmo dia não é bloqueada por já ter pisado');
  ok(g.ev('state.lagar.ultimoDia') === '2026-10-09' && g.ev('state.lagar.dias') === 1 && g.ev('state.lagar.mesaDia') === '2026-10-09', 'cada tarefa guarda o seu dia');
  const h = abrir(cheia(3));
  ok(mesa(h, '2026-10-09').ok === true && h.json("lagarPisar(state, '2026-10-09')").ok === true, 'pisar não é bloqueado por já ter posto a mesa');
  ok(h.ev('state.lagar.dias') === 1, 'pôr a mesa não conta como dia de lagar (o cap8 só conta pisar)');
}

// 5. Receita e entradas inválidas: recusa sem alterar nada.
{
  const g = abrir(cheia(2));
  const a = g.estado();
  [
    ['null', 'null'], ['vazia', '{ bens: [], reputacao: 12 }'], ['n = 0', "{ bens: [{ bem: 'sal_sado', n: 0 }], reputacao: 12 }"],
    ['n fração', "{ bens: [{ bem: 'sal_sado', n: 1.5 }], reputacao: 12 }"], ['bem que não existe', "{ bens: [{ bem: 'ouro', n: 1 }], reputacao: 12 }"],
    ['bem repetido', "{ bens: [{ bem: 'sal_sado', n: 1 }, { bem: 'sal_sado', n: 1 }], reputacao: 12 }"],
    ['Reputação negativa', "{ bens: [{ bem: 'sal_sado', n: 1 }], reputacao: -1 }"], ['Reputação fração', "{ bens: [{ bem: 'sal_sado', n: 1 }], reputacao: 1.5 }"]
  ].forEach(function (c) {
    const r = mesa(g, '2026-10-09', c[1]);
    ok(!r.ok && r.motivo === 'receita_invalida' && g.estado() === a, 'receita inválida (' + c[0] + '): ' + JSON.stringify(r));
  });
  ok(g.json("despensaMesaVindima(null, '2026-10-09', " + RECEITA + ')').motivo === 'estado_invalido', 'estado null');
  ok(g.json("despensaMesaVindima(state, 'ontem', " + RECEITA + ')').motivo === 'dia_invalido' && g.json('despensaMesaVindima(state, 5, ' + RECEITA + ')').motivo === 'dia_invalido', 'dia inválido');
  ok(g.estado() === a, 'nenhuma recusa alterou o estado');
  // Receita com 2 unidades de um bem e só 1 em stock: falta.
  const h = abrir(cheia(1));
  const antes = h.estado();
  const r = mesa(h, '2026-10-09', "{ bens: [{ bem: 'sal_sado', n: 2 }, { bem: 'mel_sesimbra', n: 1 }], reputacao: 12 }");
  ok(!r.ok && r.motivo === 'faltam_bens' && JSON.stringify(r.faltam) === JSON.stringify(['sal_sado']) && h.estado() === antes, 'n = 2 com 1 em stock: falta só o sal e nada se gasta (nem o mel)');
}

// 6. state.lagar sem o campo / estranho: não rebenta e não perde nada.
{
  const g = abrir(cheia(1));
  g.ev('state.lagar = null');
  ok(mesa(g, '2026-10-09').ok === true && JSON.stringify(g.json('state.lagar')) === '{"ultimoDia":null,"dias":0,"mesaDia":"2026-10-09"}', 'state.lagar null: recria-se com mesaDia');
  const h = abrir(cheia(1));
  h.ev("state.lagar = { ultimoDia: '2026-10-05', dias: 2 }"); // save do PR anterior, sem mesaDia
  ok(mesa(h, '2026-10-09').ok === true && JSON.stringify(h.json('state.lagar')) === '{"ultimoDia":"2026-10-05","dias":2,"mesaDia":"2026-10-09"}', 'lagar sem mesaDia: mantém ultimoDia e dias');
  // Save antigo e nuvem: mesaDia por omissão null, o resto fica.
  const velho = abrir({ reputacao: 1600, uvas: 5, lagar: { ultimoDia: '2026-10-05', dias: 2 } });
  ok(JSON.stringify(velho.json('state.lagar')) === '{"ultimoDia":"2026-10-05","dias":2,"mesaDia":null}' && velho.ev('state.reputacao') === 1600 && velho.ev('state.uvas') === 5, 'save do PR anterior ganha mesaDia null e o resto fica');
  ok(JSON.stringify(velho.json('mergeDeep(defaultState(), { reputacao: 5 }).lagar')) === '{"ultimoDia":null,"dias":0,"mesaDia":null}', 'estado da nuvem sem lagar ganha o valor por omissão');
  ok(JSON.stringify(velho.json('mergeDeep(defaultState(), { lagar: { mesaDia: "2026-10-01" } }).lagar')) === '{"ultimoDia":null,"dias":0,"mesaDia":"2026-10-01"}', 'estado da nuvem com mesaDia mantém-no');
  // Valor estranho em mesaDia: conta como nunca.
  const e = abrir(cheia(1)); e.ev("state.lagar.mesaDia = 12345");
  ok(mesa(e, '2026-10-09').ok === true, 'mesaDia inválido conta como nunca');
}

// 7. Textos nas 3 línguas (PT exatamente como decidido) e ligação ao ecrã.
{
  const g = abrir();
  const PT = { 'lagar.mesaBtn': 'Pôr a mesa da vindima', 'lagar.mesaPedido': '1 queijo, 1 sal e 1 mel', 'lagar.mesaOk': 'A mesa está posta e ninguém sai de barriga vazia. +{rep} de Reputação.',
    'lagar.mesaFalta': 'Falta na Despensa: {bens}.', 'lagar.mesaJaHoje': 'Já puseste a mesa hoje. Volta amanhã.' };
  Object.keys(PT).forEach(function (k) { ok(g.ev('TRANSLATIONS.pt["' + k + '"]') === PT[k], 'texto PT de ' + k); });
  ['lagar.mesaBtn', 'lagar.mesaPedido', 'lagar.mesaDesc', 'lagar.mesaOk', 'lagar.mesaFalta', 'lagar.mesaOnde', 'lagar.mesaJaHoje'].forEach(function (k) {
    ['pt', 'en', 'es'].forEach(function (l) { const v = g.ev('TRANSLATIONS.' + l + '["' + k + '"]'); ok(typeof v === 'string' && v.trim() !== '', 'falta ' + k + ' em ' + l); });
  });
  [['lagar.mesaDesc', ['{pedido}', '{rep}']], ['lagar.mesaOk', ['{rep}']], ['lagar.mesaFalta', ['{bens}']]].forEach(function (c) {
    ['pt', 'en', 'es'].forEach(function (l) { c[1].forEach(function (m) { ok(g.ev('TRANSLATIONS.' + l + '["' + c[0] + '"]').indexOf(m) !== -1, c[0] + ' sem ' + m + ' em ' + l); }); });
  });
  ok(!/Quinta/.test('') && ['en', 'es'].every(function (l) { return g.ev('TRANSLATIONS.' + l + '["lagar.mesaBtn"]').indexOf('Quinta') === -1; }), 'sem "Quinta" onde não precisa');
  const src = ler(path.join(RAIZ, 'js', 'lagar.js')).split('\n').filter(function (l) { return !/^\s*\/\//.test(l); }).join('\n');
  const clique = src.slice(src.indexOf('function lagarMesaClique()'));
  ok((src.match(/despensaMesaVindima\(/g) || []).length === 1 && clique.indexOf('despensaMesaVindima(') !== -1 && clique.indexOf('saveState(state)') !== -1, 'só o clique (lagarMesaClique) chama despensaMesaVindima e grava');
  ok(!/despensaRegistar|despensaTrocar|despensaOferecer|despensaEstado|state\.despensa|ESTRADA_/.test(src), 'lagar.js não mexe nos dados da Despensa nem da Estrada (só despensaQuantos e a regra despensaMesaVindima)');
  ok(/definirFundo\('foto', LAGAR_CONFIG\.mesa\.imagem\)/.test(src), 'depois de pôr a mesa, o fundo é a foto da festa');
  const html = ler(path.join(RAIZ, 'index.html'));
  const pos = function (f) { return html.indexOf('<script src="js/' + f + '?v='); };
  ok(pos('despensa.js') !== -1 && pos('despensa.js') < pos('estrada.js') && pos('estrada.js') < pos('lagar.js') && pos('lagar.js') < pos('main.js'), 'ordem de carga: despensa.js, estrada.js, lagar.js, main.js');
  const desp = ler(DESPENSA_JS).replace(/\/\/.*$/gm, '');
  const corpo = desp.slice(desp.indexOf('function despensaMesaVindima('));
  ok(!/Math\.random|Date\.now|new Date|saveState|localStorage/.test(corpo), 'despensaMesaVindima é pura (sem relógio, sorteio nem gravação)');
  ok(!/\.recebidos\s*(\[[^\]]*\])?\s*(=|\+=|-=|\+\+|--)(?!=)/.test(corpo.slice(0, corpo.indexOf('\n}\n') + 3)), 'despensaMesaVindima nunca escreve em recebidos');
}

console.log(falhas === 0 ? 'OK' : falhas + ' FALHA(S)');
process.exit(falhas === 0 ? 0 : 1);
