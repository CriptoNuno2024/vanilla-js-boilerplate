#!/usr/bin/env node
// Assalto especial dos porcos no Lagar ("Defender a mesa", nível 8): as regras puras lagarAssaltoEstado,
// lagarAssaltoCena e lagarAssaltoResolver (js/lagar.js), os valores em LAGAR_CONFIG.assalto, state.lagar.assaltoDia
// (js/state.js), os textos nas 3 línguas, as imagens (todas já existentes) e a ligação ao ecrã. Corre state.js, i18n.js,
// niveis.js, capitulos.js, estrada-dados.js, despensa.js e lagar.js REAIS num ambiente simulado (vm), sem browser nem conta real.
//
// Uso: node scripts/verificar-assalto-lagar.js
// LAGAR_JS=caminho  corre sobre outra versão de js/lagar.js (provas negativas).
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const LAGAR_JS = process.env.LAGAR_JS || path.join(RAIZ, 'js', 'lagar.js');
let falhas = 0;
function ok(cond, msg) { if (!cond) { falhas++; console.log('FALHA: ' + msg); } }
const ler = function (f) { return fs.readFileSync(f, 'utf8'); };

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
    setTimeout: function () { return 1; }, clearTimeout: function () {}, Image: function () {}, Date: (function () { class D extends Date {} return D; })()
  };
  sb.window = sb;
  sb.Telegram = { WebApp: {} };
  const cx = vm.createContext(sb);
  vm.runInContext(ler(path.join(RAIZ, 'js', 'state.js')), cx, { filename: 'state.js' });
  vm.runInContext(ler(path.join(RAIZ, 'js', 'i18n.js')), cx, { filename: 'i18n.js' });
  vm.runInContext(`
    function mostrarFalas() {} function vibrar() {} function tocarSom() {} function updateStatsDisplays() {}
    function localeAtual() { return 'pt-PT'; }
    function diaLisboaDeHoje() { return '2026-10-09'; }
    function estradaNomeBem(id) { return id; }
  `, cx);
  ['niveis.js', 'capitulos.js', 'estrada-dados.js', 'despensa.js'].forEach(function (f) { vm.runInContext(ler(path.join(RAIZ, 'js', f)), cx, { filename: f }); });
  vm.runInContext(ler(LAGAR_JS), cx, { filename: 'lagar.js' });
  if (puro) vm.runInContext('Math.random = function () { throw new Error("Math.random proibido"); }; Date.now = function () { throw new Error("Date.now proibido"); };', cx);
  const g = { cx: cx };
  g.ev = function (c) { return vm.runInContext(c, cx); };
  g.json = function (c) { return JSON.parse(vm.runInContext('JSON.stringify(' + c + ')', cx)); };
  g.estado = function () { return vm.runInContext('JSON.stringify(state)', cx); };
  return g;
}

const SETE = { cap1: true, cap2: true, cap3: true, cap4: true, cap5: true, cap6: true, cap7: true };
const base = function (extra) {
  return Object.assign({ reputacao: 1600, uvas: 100, gotas: 7, ultimaGravacaoEm: 1, acesso: { jogadorAntigo: false, introMostrada: true }, niveis: { nivelMostrado: 8, garrafasAoNivel6: 0 },
    capitulos: { iniciado: true, celebradosMigrado: true, concluidos: Object.assign({}, SETE), celebrados: Object.assign({}, SETE) },
    despensa: { recebidos: { queijo_azeitao: 2, sal_sado: 2, mel_sesimbra: 2 }, entregues: { queijo_azeitao: 1 }, primeiraTroca: {}, hoje: { dia: null, feitas: {} } },
    lagar: { ultimoDia: '2026-10-08', dias: 2, mesaDia: '2026-10-09', assaltoDia: null } }, extra || {});
};

// 1. Valores, textos e imagens.
{
  const g = abrir();
  const A = g.json('LAGAR_CONFIG.assalto');
  ok(A.reputacao === 3, 'prémio pequeno: +3 de Reputação');
  ok(Array.isArray(A.cenas) && A.cenas.length === 3 && A.cenas.every(function (c) { return Number.isInteger(c.correta) && c.correta >= 0 && c.correta <= 2; }), '3 cenas, cada uma com a opção certa entre 0 e 2');
  ok(new Set(A.cenas.map(function (c) { return c.chave; })).size === 3, 'as 3 cenas têm chaves diferentes');
  ['pt', 'en', 'es'].forEach(function (l) {
    A.cenas.forEach(function (c) {
      ['sit', 'op1', 'op2', 'op3'].forEach(function (k) {
        const v = g.ev('TRANSLATIONS.' + l + '["' + c.chave + '.' + k + '"]');
        ok(typeof v === 'string' && v.trim() !== '', 'falta ' + c.chave + '.' + k + ' em ' + l);
      });
    });
    ['assaltoBtn', 'assaltoDesc', 'assaltoJaHoje', 'assaltoTitulo', 'assaltoSub', 'assaltoVitoria', 'assaltoDerrota'].forEach(function (k) {
      const v = g.ev('TRANSLATIONS.' + l + '["lagar.' + k + '"]');
      ok(typeof v === 'string' && v.trim() !== '', 'falta lagar.' + k + ' em ' + l);
    });
    ok(g.ev('TRANSLATIONS.' + l + '["lagar.assaltoDesc"]').indexOf('{rep}') !== -1 && g.ev('TRANSLATIONS.' + l + '["lagar.assaltoVitoria"]').indexOf('{rep}') !== -1, '{rep} nos textos do prémio em ' + l);
    ok(g.ev('TRANSLATIONS.' + l + '["lagar.assaltoDerrota"]').indexOf('{rep}') === -1, 'a derrota não fala de Reputação em ' + l);
  });
  // Imagens: só ficheiros que já existem em assets/ecras.
  Object.keys(A.imagens).forEach(function (k) {
    ok(/^assets\/ecras\/[a-z0-9_]+\.jpg$/.test(A.imagens[k]) && fs.existsSync(path.join(RAIZ, A.imagens[k])), 'a imagem "' + k + '" existe em assets/ecras: ' + A.imagens[k]);
  });
}

// 2. state.lagar.assaltoDia: por omissão null (jogo novo, save do PR anterior, nuvem); nada se perde.
{
  ok(JSON.stringify(abrir().json('state.lagar')) === '{"ultimoDia":null,"dias":0,"mesaDia":null,"assaltoDia":null}', 'jogo novo: assaltoDia null');
  const g = abrir({ reputacao: 1700, uvas: 9, lagar: { ultimoDia: '2026-10-05', dias: 2, mesaDia: '2026-10-06' } });
  ok(JSON.stringify(g.json('state.lagar')) === '{"ultimoDia":"2026-10-05","dias":2,"mesaDia":"2026-10-06","assaltoDia":null}', 'save do PR anterior ganha assaltoDia null e mantém o resto');
  ok(g.ev('state.reputacao') === 1700 && g.ev('state.uvas') === 9, 'o resto do save fica igual');
  ok(JSON.stringify(g.json('mergeDeep(defaultState(), { reputacao: 5 }).lagar')) === '{"ultimoDia":null,"dias":0,"mesaDia":null,"assaltoDia":null}', 'estado da nuvem sem lagar ganha o valor por omissão');
  ok(g.json('mergeDeep(defaultState(), { lagar: { assaltoDia: "2026-10-01" } }).lagar').assaltoDia === '2026-10-01', 'estado da nuvem com assaltoDia mantém-no');
  // Valores estranhos contam como "nunca" e são reparados ao registar.
  const e = abrir(base()); e.ev("state.lagar.assaltoDia = 12345");
  ok(e.json("lagarAssaltoEstado(state, '2026-10-09')").ok === true, 'assaltoDia inválido conta como nunca');
  ok(e.json("lagarAssaltoResolver(state, '2026-10-09', true)").ok === true && e.ev('state.lagar.assaltoDia') === '2026-10-09', 'assaltoDia inválido repara-se ao registar');
}

// 3. As regras: só depois de pôr a mesa, uma vez por dia, ganhar dá +3, perder não custa nada; nada mais muda.
{
  const g = abrir(base(), true);
  ok(g.json("lagarAssaltoEstado(state, '2026-10-09')").ok === true, 'com a mesa de hoje posta, o assalto pode vir');
  const antes = JSON.parse(g.estado());
  const r = g.json("lagarAssaltoResolver(state, '2026-10-09', true)");
  ok(r.ok && r.venceu === true && r.reputacaoGanha === 3 && r.motivo === null, 'ganhar: ' + JSON.stringify(r));
  const depois = JSON.parse(g.estado());
  const esperado = JSON.parse(JSON.stringify(antes)); esperado.reputacao = 1603; esperado.lagar.assaltoDia = '2026-10-09';
  ok(JSON.stringify(depois) === JSON.stringify(esperado), 'ganhar só mexe na Reputação (+3) e em lagar.assaltoDia: nem uvas, nem gotas, nem Despensa, nem capítulos, nem os outros dias');
  // Uma vez por dia.
  const a = g.estado();
  const r2 = g.json("lagarAssaltoResolver(state, '2026-10-09', true)");
  ok(!r2.ok && r2.motivo === 'ja_hoje' && r2.reputacaoGanha === 0 && g.estado() === a, 'mesmo dia: recusado (ja_hoje) sem alterar nada');
  ok(g.json("lagarAssaltoEstado(state, '2026-10-09')").motivo === 'ja_hoje', 'lagarAssaltoEstado diz ja_hoje');
  // Relógio atrás.
  const r3 = g.json("lagarAssaltoResolver(state, '2026-10-08', true)");
  ok(!r3.ok && r3.motivo === 'dia_anterior' && g.estado() === a, 'dia anterior: recusado sem alterar nada');
  // Dia seguinte sem mesa nova: não há assalto; com a mesa posta nesse dia, volta.
  ok(g.json("lagarAssaltoEstado(state, '2026-10-10')").motivo === 'sem_mesa', 'dia seguinte sem mesa: sem_mesa');
  g.ev("state.lagar.mesaDia = '2026-10-10'");
  ok(g.json("lagarAssaltoEstado(state, '2026-10-10')").ok === true, 'dia seguinte com a mesa posta: pode vir outra vez');

  // Perder: não custa nada (só gasta a tentativa do dia).
  const p = abrir(base(), true);
  const antesP = JSON.parse(p.estado());
  const rp = p.json("lagarAssaltoResolver(state, '2026-10-09', false)");
  ok(rp.ok && rp.venceu === false && rp.reputacaoGanha === 0, 'perder: ' + JSON.stringify(rp));
  const esperadoP = JSON.parse(JSON.stringify(antesP)); esperadoP.lagar.assaltoDia = '2026-10-09';
  ok(p.estado() === JSON.stringify(esperadoP), 'perder só marca assaltoDia: a Reputação, as uvas, a Despensa e os capítulos ficam como estavam');
  ok(p.json("lagarAssaltoResolver(state, '2026-10-09', true)").motivo === 'ja_hoje', 'depois de perder, não há 2.ª tentativa no mesmo dia');
}

// 4. Sem mesa, entradas inválidas: recusa sem alterar nada.
{
  const g = abrir(base({ lagar: { ultimoDia: null, dias: 0, mesaDia: null, assaltoDia: null } }));
  const a = g.estado();
  const r = g.json("lagarAssaltoResolver(state, '2026-10-09', true)");
  ok(!r.ok && r.motivo === 'sem_mesa' && r.reputacaoGanha === 0 && g.estado() === a, 'sem mesa: recusado (sem_mesa) sem alterar nada');
  g.ev("state.lagar.mesaDia = '2026-10-08'");
  ok(g.json("lagarAssaltoEstado(state, '2026-10-09')").motivo === 'sem_mesa', 'a mesa de ontem não conta');
  const h = abrir(base());
  const b = h.estado();
  ok(h.json("lagarAssaltoResolver(state, '2026-10-09', 'sim')").motivo === 'resultado_invalido' && h.json("lagarAssaltoResolver(state, '2026-10-09', 1)").motivo === 'resultado_invalido' && h.json("lagarAssaltoResolver(state, '2026-10-09')").motivo === 'resultado_invalido', 'resultado que não é true/false recusado');
  ok(h.json("lagarAssaltoResolver(null, '2026-10-09', true)").motivo === 'estado_invalido', 'estado null');
  ok(h.json("lagarAssaltoResolver(state, 'ontem', true)").motivo === 'dia_invalido' && h.json('lagarAssaltoResolver(state, 5, true)').motivo === 'dia_invalido', 'dia inválido');
  ok(h.estado() === b, 'nenhuma recusa alterou o estado');
  h.ev('state.lagar = null');
  ok(h.json("lagarAssaltoEstado(state, '2026-10-09')").motivo === 'sem_mesa', 'state.lagar null: sem_mesa, sem rebentar');
  const k = abrir(base()); k.ev('state.reputacao = "x"');
  ok(k.json("lagarAssaltoResolver(state, '2026-10-09', true)").ok === true && k.ev('state.reputacao') === 3, 'Reputação inválida conta como 0 e soma +3');
}

// 5. A cena do dia: pura, estável, dentro do intervalo, e todas saem ao longo dos dias.
{
  const g = abrir(null, true);
  const dias = [];
  for (let d = 1; d <= 60; d++) dias.push('2026-' + String(Math.floor((d - 1) / 28) + 10).padStart(2, '0') + '-' + String(((d - 1) % 28) + 1).padStart(2, '0'));
  const vistas = {};
  dias.forEach(function (dia) {
    const c = g.ev("lagarAssaltoCena('" + dia + "', 3)");
    ok(Number.isInteger(c) && c >= 0 && c <= 2, 'cena fora do intervalo em ' + dia);
    ok(g.ev("lagarAssaltoCena('" + dia + "', 3)") === c, 'a cena de ' + dia + ' devia ser estável');
    vistas[c] = true;
  });
  ok(Object.keys(vistas).length === 3, 'ao longo de 60 dias saem as 3 cenas');
  ok(g.ev("lagarAssaltoCena('2026-10-09', 0)") === 0 && g.ev("lagarAssaltoCena(5, 3)") === 0, 'n ou dia inválidos dão 0, sem rebentar');
}

// 6. Ligação ao ecrã e pureza do código.
{
  const src = ler(LAGAR_JS).split('\n').filter(function (l) { return !/^\s*\/\//.test(l); }).join('\n');
  const regras = src.slice(0, src.indexOf('function atualizarLinhaLagarQuinta'));
  ok(regras.indexOf('lagarAssaltoResolver') !== -1 && !/Date\.now|Math\.random|new Date|saveState|localStorage/.test(regras), 'as regras (incluindo o assalto) são puras: sem relógio, sorteio nem gravação');
  const resp = src.slice(src.indexOf('function lagarAssaltoResponder('), src.indexOf('function lagarAssaltoVoltar('));
  ok((src.match(/lagarAssaltoResolver\(/g) || []).length === 2 && resp.indexOf('lagarAssaltoResolver(') !== -1 && resp.indexOf('saveState(state)') !== -1, 'só lagarAssaltoResponder chama a regra de registo e grava');
  ok(/lagarAssaltoCenaAtual = null;[\s\S]*lagarAssaltoResolver/.test(resp), 'a cena fica gasta antes de resolver (toque duplo não paga duas vezes)');
  ok(!/despensaRegistar|despensaTrocar|despensaOferecer|despensaEstado|state\.despensa|ESTRADA_|capitulos|marcarObjetivo|state\.uvas|state\.gotas/.test(resp + regras.slice(regras.indexOf('function lagarAssaltoEstado'), regras.indexOf('function atualizarLinhaLagarQuinta'))), 'o assalto não mexe em uvas, gotas, Despensa, capítulos nem objetivos');
  ok(!/startProteger|finishProteger|renderProteger|protegerRonda|state\.proteger/.test(src), 'o assalto não usa o Proteger (nem o seu estado)');
  const html = ler(path.join(RAIZ, 'index.html'));
  const pos = function (f) { return html.indexOf('<script src="js/' + f + '?v='); };
  ok(pos('lagar.js') > pos('estrada.js') && pos('lagar.js') < pos('main.js'), 'ordem de carga: estrada.js, lagar.js, main.js');
  ok(/\.lagar-botao-assalto:disabled/.test(html), 'index.html tem o estilo do botão do assalto');
  // Nenhum ficheiro novo em assets: as imagens do assalto já existiam no repositório antes deste PR (ver git).
}

console.log(falhas === 0 ? 'OK' : falhas + ' FALHA(S)');
process.exit(falhas === 0 ? 0 : 1);
