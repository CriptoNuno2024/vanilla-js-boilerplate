#!/usr/bin/env node
// Tarefas diárias dos níveis 5 e 6 (js/reserva.js): "Visitar a Reserva" (Cave de Reserva: 1 garrafa feita, +3, uma vez por
// dia, não gasta nada) e "Arrumar a Coleção" (ecrã A Coleção: 1 cor já feita na Coleção, +4, uma vez por dia, não gasta nada).
// Corre js/ REAIS num ambiente simulado (vm), sem browser nem conta real.
//
// Uso: node scripts/verificar-reserva-colecao.js
// RESERVA_JS=caminho  corre sobre outra versão de js/reserva.js (provas negativas).
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const RESERVA_JS = process.env.RESERVA_JS || path.join(RAIZ, 'js', 'reserva.js');
let falhas = 0;
function ok(cond, msg) { if (!cond) { falhas++; console.log('FALHA: ' + msg); } }
const ler = function (f) { return fs.readFileSync(f, 'utf8'); };

function abrir(guardadoInicial, ficheiros) {
  const guardado = {};
  if (guardadoInicial) guardado.yoshicat_quinta_state_v2 = JSON.stringify(guardadoInicial);
  const sb = {
    console: { log() {}, warn() {}, error() {} },
    localStorage: {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(guardado, k) ? guardado[k] : null; },
      setItem: function (k, v) { guardado[k] = String(v); }, removeItem: function (k) { delete guardado[k]; }
    },
    location: { search: '' }, URLSearchParams: URLSearchParams,
    document: { querySelectorAll: function () { return []; }, getElementById: function () { return null; }, querySelector: function () { return null; }, addEventListener: function () {} },
    addEventListener: function () {}, innerHeight: 640, innerWidth: 360, setInterval: function () { return 1; }, clearInterval: function () {}, requestAnimationFrame: function () { return 1; }, setTimeout: function () { return 1; }, clearTimeout: function () {}, Image: function () {}, Date: (function () { class D extends Date {} return D; })()
  };
  sb.window = sb;
  sb.Telegram = { WebApp: {} };
  const cx = vm.createContext(sb);
  vm.runInContext(ler(path.join(RAIZ, 'js', 'state.js')), cx, { filename: 'state.js' });
  vm.runInContext(ler(path.join(RAIZ, 'js', 'i18n.js')), cx, { filename: 'i18n.js' });
  vm.runInContext('function diaLisboaDeHoje() { return "2026-10-09"; } function t(k) { return k; }', cx);
  (ficheiros || []).forEach(function (f) { vm.runInContext(ler(f.startsWith('/') ? f : path.join(RAIZ, 'js', f)), cx, { filename: path.basename(f) }); });
  vm.runInContext(ler(RESERVA_JS), cx, { filename: 'reserva.js' });
  const g = { cx: cx };
  g.ev = function (c) { return vm.runInContext(c, cx); };
  g.json = function (c) { return JSON.parse(vm.runInContext('JSON.stringify(' + c + ')', cx)); };
  g.estado = function () { return vm.runInContext('JSON.stringify(state)', cx); };
  g.puro = function () { vm.runInContext('Math.random = function () { throw new Error("Math.random proibido"); }; Date.now = function () { throw new Error("Date.now proibido"); };', cx); };
  return g;
}
const DIA = '2026-10-09';

// 1. Valores e campos novos.
{
  const g = abrir();
  ok(g.ev('RESERVA_CONFIG.reputacao') === 3 && g.ev('RESERVA_CONFIG.garrafasMinimas') === 1, 'Reserva: +3 e 1 garrafa');
  ok(g.ev('COLECAO_TAREFA_CONFIG.reputacao') === 4 && g.ev('COLECAO_TAREFA_CONFIG.coresMinimas') === 1, 'Coleção: +4 e 1 cor');
  ok(JSON.stringify(g.json('state.reserva')) === '{"visitaDia":null}' && JSON.stringify(g.json('state.colecao')) === '{"arrumouDia":null}', 'jogo novo: state.reserva { visitaDia: null } e state.colecao { arrumouDia: null }');
  // Save antigo e estado da nuvem: ganham os campos por omissão e o resto fica.
  const v = abrir({ reputacao: 800, garrafas: 4, uvas: 9, adega: { bagaco: 2, aguardente: 0, cooldowns: {}, lote: null, historico: [{ diasDescanso: 4 }] }, niveis: { nivelMostrado: 6, garrafasAoNivel6: 1 } });
  ok(JSON.stringify(v.json('state.reserva')) === '{"visitaDia":null}' && JSON.stringify(v.json('state.colecao')) === '{"arrumouDia":null}', 'save antigo ganha os 2 campos');
  ok(v.ev('state.reputacao') === 800 && v.ev('state.garrafas') === 4 && v.ev('state.niveis.garrafasAoNivel6') === 1 && v.ev('state.adega.historico.length') === 1, 'o resto do save fica igual');
  ok(JSON.stringify(v.json('mergeDeep(defaultState(), { reputacao: 5 }).reserva')) === '{"visitaDia":null}' && v.json('mergeDeep(defaultState(), { colecao: { arrumouDia: "2026-10-01" } }).colecao').arrumouDia === '2026-10-01', 'estado da nuvem sem os campos ganha-os; com eles mantém-nos');
  const st = ler(path.join(RAIZ, 'js', 'state.js'));
  ok(/Pequenas tarefas diárias dos níveis 5 e 6[\s\S]{0,500}NÃO se juntam na nuvem/.test(st), 'state.js documenta que state.reserva e state.colecao não se juntam na nuvem');
}

// 2. Visitar a Reserva: 1 garrafa, +3, uma vez por dia, não gasta nada, recusar não altera nada.
{
  const mk = function (extra) { return Object.assign({ reputacao: 400, uvas: 50, gotas: 9, garrafas: 2, adega: { bagaco: 1, aguardente: 0, cooldowns: {}, lote: null, historico: [{ diasDescanso: 3 }, { diasDescanso: 4 }] }, niveis: { nivelMostrado: 5, garrafasAoNivel6: null }, acesso: { jogadorAntigo: false } }, extra || {}); };
  const g = abrir(mk()); g.puro();
  const antes = JSON.parse(g.estado());
  const r = g.json("reservaVisitar(state, '" + DIA + "')");
  ok(r.ok && r.reputacaoGanha === 3 && r.motivo === null, 'visitar: ' + JSON.stringify(r));
  const esperado = JSON.parse(JSON.stringify(antes)); esperado.reputacao = 403; esperado.reserva = { visitaDia: DIA };
  ok(g.estado() === JSON.stringify(esperado), 'visitar só mexe na Reputação (+3) e em state.reserva (nem garrafas, uvas, gotas, historico, níveis, colecao)');
  ok(g.ev('state.garrafas') === 2 && g.ev('state.adega.historico.length') === 2 && g.ev('state.niveis.garrafasAoNivel6') === null, 'não gasta garrafas nem toca no historico nem em garrafasAoNivel6');
  const a = g.estado();
  const r2 = g.json("reservaVisitar(state, '" + DIA + "')");
  ok(!r2.ok && r2.motivo === 'ja_hoje' && r2.reputacaoGanha === 0 && g.estado() === a, 'mesmo dia: recusado (ja_hoje) sem alterar nada');
  const r3 = g.json("reservaVisitar(state, '2026-10-08')");
  ok(!r3.ok && r3.motivo === 'dia_anterior' && g.estado() === a, 'dia anterior: recusado sem alterar nada');
  ok(g.json("reservaVisitar(state, '2026-10-10')").ok && g.ev('state.reputacao') === 406, 'dia seguinte: outra visita (+3)');
  // Sem garrafa: recusa, diz que falta 1, não altera nada.
  const s = abrir(mk({ garrafas: 0 })); const b = s.estado();
  const p = s.json("reservaPodeVisitar(state, '" + DIA + "')");
  ok(!p.ok && p.motivo === 'sem_garrafas' && p.faltam === 1, 'sem garrafas: falta 1: ' + JSON.stringify(p));
  ok(!s.json("reservaVisitar(state, '" + DIA + "')").ok && s.estado() === b, 'sem garrafas: recusado sem alterar nada');
  [['null', 'null'], ['texto', '"3"'], ['fração', '0.5'], ['negativo', '-2']].forEach(function (c) {
    const e = abrir(mk()); e.ev('state.garrafas = ' + c[1]);
    ok(e.json("reservaPodeVisitar(state, '" + DIA + "')").motivo === 'sem_garrafas', 'garrafas inválidas (' + c[0] + ') contam como 0');
  });
  abrir(mk({ garrafas: 1 })).json("reservaPodeVisitar(state, '" + DIA + "')").ok === true || ok(false, 'exatamente 1 garrafa chega');
  // Estados estranhos: reparam-se, sem rebentar.
  [['null', 'state.reserva = null'], ['texto', "state.reserva = 'x'"], ['lista', 'state.reserva = []'], ['dia inválido', 'state.reserva = { visitaDia: 12345 }'], ['dia mal formado', "state.reserva = { visitaDia: 'ontem' }"]].forEach(function (c) {
    const e = abrir(mk()); e.ev(c[1]);
    ok(e.json("reservaPodeVisitar(state, '" + DIA + "')").ok === true && e.json("reservaVisitar(state, '" + DIA + "')").ok === true && e.ev('state.reserva.visitaDia') === DIA && e.ev('state.reputacao') === 403, 'estado estranho (' + c[0] + '): repara-se e conta');
  });
  ok(g.json("reservaVisitar(null, '" + DIA + "')").motivo === 'estado_invalido' && g.json("reservaVisitar(state, 'ontem')").motivo === 'dia_invalido' && g.json('reservaVisitar(state, 5)').motivo === 'dia_invalido', 'estado e dia inválidos');
  const k = abrir(mk()); k.ev('state.reputacao = "x"');
  ok(k.json("reservaVisitar(state, '" + DIA + "')").ok && k.ev('state.reputacao') === 3, 'Reputação inválida conta como 0');
}

// 3. Arrumar a Coleção: 1 cor, +4, uma vez por dia, não gasta nada, só conta as cores desde o nível 6.
{
  const mk = function (extra) { return Object.assign({ reputacao: 700, uvas: 50, gotas: 9, garrafas: 3, adega: { bagaco: 1, aguardente: 0, cooldowns: {}, lote: null, historico: [{ diasDescanso: 2 }, { diasDescanso: 1 }, { diasDescanso: 4 }] }, niveis: { nivelMostrado: 6, garrafasAoNivel6: 1 }, acesso: { jogadorAntigo: false } }, extra || {}); };
  // Com garrafa.js real: as cores vêm de colecaoCoresFeitas (só as feitas desde o nível 6, isto é, a partir da posição garrafasAoNivel6).
  const g = abrir(mk(), ['garrafa.js']); g.puro();
  const contar = function (x) { return x.ev('colecaoContarCores()'); };
  ok(contar(g) === 2, 'premissa: com garrafasAoNivel6 = 1 só contam as 2 últimas garrafas (jovem e cobre): ' + contar(g));
  const antes = JSON.parse(g.estado());
  const r = g.json("colecaoArrumar(state, '" + DIA + "', colecaoContarCores())");
  ok(r.ok && r.reputacaoGanha === 4 && r.motivo === null, 'arrumar: ' + JSON.stringify(r));
  const esperado = JSON.parse(JSON.stringify(antes)); esperado.reputacao = 704; esperado.colecao = { arrumouDia: DIA };
  ok(g.estado() === JSON.stringify(esperado), 'arrumar só mexe na Reputação (+4) e em state.colecao (nem garrafas, uvas, gotas, historico, garrafasAoNivel6, reserva)');
  const a = g.estado();
  const r2 = g.json("colecaoArrumar(state, '" + DIA + "', 2)");
  ok(!r2.ok && r2.motivo === 'ja_hoje' && r2.reputacaoGanha === 0 && g.estado() === a, 'mesmo dia: recusado (ja_hoje) sem alterar nada');
  const r3 = g.json("colecaoArrumar(state, '2026-10-08', 2)");
  ok(!r3.ok && r3.motivo === 'dia_anterior' && g.estado() === a, 'dia anterior: recusado sem alterar nada');
  ok(g.json("colecaoArrumar(state, '2026-10-10', 2)").ok && g.ev('state.reputacao') === 708, 'dia seguinte: outra arrumação (+4)');
  // Sem cores: as garrafas anteriores ao nível 6 não contam; recusa sem alterar nada.
  const s = abrir(mk({ niveis: { nivelMostrado: 6, garrafasAoNivel6: 3 } }), ['garrafa.js']); const b = s.estado();
  ok(contar(s) === 0, 'premissa: garrafasAoNivel6 = 3 -> nenhuma cor desde o nível 6');
  const p = s.json("colecaoPodeArrumar(state, '" + DIA + "', colecaoContarCores())");
  ok(!p.ok && p.motivo === 'sem_cores', 'sem cores: ' + JSON.stringify(p));
  ok(!s.json("colecaoArrumar(state, '" + DIA + "', colecaoContarCores())").ok && s.estado() === b, 'sem cores: recusado sem alterar nada');
  const n = abrir(mk({ niveis: { nivelMostrado: 6, garrafasAoNivel6: null } }), ['garrafa.js']);
  ok(contar(n) === 0 && !n.json("colecaoPodeArrumar(state, '" + DIA + "', colecaoContarCores())").ok, 'garrafasAoNivel6 null (ainda não chegou ao nível 6, ou jogador antigo sem nota): sem cores, recusa');
  const f = abrir(mk({ adega: { bagaco: 0, aguardente: 0, cooldowns: {}, lote: null, historico: [{ festa: 'saomartinho', diasDescanso: 0 }] }, niveis: { nivelMostrado: 6, garrafasAoNivel6: 0 } }), ['garrafa.js']);
  ok(contar(f) === 0, 'as garrafas de festa não contam como cor');
  [[1, true], [4, true], [0, false], [-1, false], [0.5, false]].forEach(function (c) { ok(s.json("colecaoPodeArrumar(state, '" + DIA + "', " + c[0] + ")").ok === c[1], 'cores = ' + c[0] + (c[1] ? ' chega' : ' não chega')); });
  ['null', '"3"', 'undefined', 'NaN'].forEach(function (c) { ok(s.json("colecaoPodeArrumar(state, '" + DIA + "', " + c + ")").motivo === 'sem_cores', 'cores inválidas (' + c + ') contam como 0'); });
  [['null', 'state.colecao = null'], ['texto', "state.colecao = 'x'"], ['lista', 'state.colecao = []'], ['dia inválido', 'state.colecao = { arrumouDia: 99 }'], ['dia mal formado', "state.colecao = { arrumouDia: '9/10' }"]].forEach(function (c) {
    const e = abrir(mk()); e.ev(c[1]);
    ok(e.json("colecaoPodeArrumar(state, '" + DIA + "', 2)").ok === true && e.json("colecaoArrumar(state, '" + DIA + "', 2)").ok === true && e.ev('state.colecao.arrumouDia') === DIA && e.ev('state.reputacao') === 704, 'estado estranho (' + c[0] + '): repara-se e conta');
  });
  ok(g.json("colecaoArrumar(null, '" + DIA + "', 2)").motivo === 'estado_invalido' && g.json("colecaoArrumar(state, 'x', 2)").motivo === 'dia_invalido', 'estado e dia inválidos');
  // Independentes: visitar a Reserva e arrumar a Coleção no mesmo dia, nos dois sentidos.
  const i = abrir(mk(), ['garrafa.js']);
  ok(i.json("reservaVisitar(state, '" + DIA + "')").ok && i.json("colecaoArrumar(state, '" + DIA + "', 2)").ok && i.ev('state.reputacao') === 707, 'as duas tarefas são independentes (+3 e +4 no mesmo dia)');
}

// 4. Não toca nos capítulos 5 e 6 nem no prémio da Reserva Especial; só o clique grava; puro; textos; ligação ao jogo.
{
  const g = abrir(null, ['niveis.js', 'capitulos.js']);
  ok(JSON.stringify(g.json("CAPITULOS_CONFIG.filter(function (c) { return c.id === 'cap5'; })[0].criterio")) === JSON.stringify([{ tipo: 'algumaEntrada', caminho: 'adega.historico', campo: 'diasDescanso', alvo: 3 }]), 'o critério do cap5 não mudou');
  ok(JSON.stringify(g.json("CAPITULOS_CONFIG.filter(function (c) { return c.id === 'cap6'; })[0].criterio")) === JSON.stringify([{ tipo: 'coresColecao', alvo: 4 }]), 'o critério do cap6 não mudou');
  const gar = ler(path.join(RAIZ, 'js', 'garrafa.js'));
  ok(/\{ dias: 4, reputacao: 60 \}/.test(gar) && /bonusInvernoReputacao: 10/.test(gar), 'o prémio da Reserva Especial (+60 aos 4 dias, +10 no inverno) não mudou');
  const src = ler(RESERVA_JS).split('\n').filter(function (l) { return !/^\s*\/\//.test(l); }).map(function (l) { return l.replace(/\s\/\/.*$/, ''); }).join('\n');
  const regras = src.slice(0, src.indexOf('function reservaDiaDeHoje'));
  ok(regras.length > 800 && !/Date\.now|Math\.random|new Date|saveState|localStorage/.test(regras), 'as regras são puras (sem relógio, sorteio nem gravação)');
  ok(!/garrafasAoNivel6|historico|state\.garrafas|estado\.garrafas\s*(-=|\+=|=[^=])|despensa|nuvem/i.test(regras.replace(/estado\.garrafas\)/g, '')), 'as regras não escrevem em garrafas, historico nem garrafasAoNivel6');
  ok((src.match(/saveState\(/g) || []).length === 2 && /function reservaVisitarClique[\s\S]*saveState\(state\)[\s\S]*function colecaoTarefaBotaoHtml/.test(src) && /function colecaoArrumarClique[\s\S]*saveState\(state\)/.test(src), 'só os 2 cliques gravam (um saveState em cada)');
  ok(/if \(reservaOcupado\) return;/.test(src) && /if \(colecaoArrumarOcupado\) return;/.test(src), 'clique duplo protegido nos dois botões');
  ['pt', 'en', 'es'].forEach(function (l) {
    ['reserva.btn', 'reserva.desc', 'reserva.semGarrafas', 'reserva.jaHoje', 'reserva.ok', 'reserva.relogio', 'colecao.arrumarBtn', 'colecao.arrumarSemCores', 'colecao.arrumarJaHoje', 'colecao.arrumarRelogio', 'colecao.arrumarOk'].forEach(function (k) {
      const v = g.ev('TRANSLATIONS.' + l + '["' + k + '"]'); ok(typeof v === 'string' && v.trim() !== '', 'falta ' + k + ' em ' + l);
    });
    ok(g.ev('TRANSLATIONS.' + l + '["reserva.desc"]').indexOf('{rep}') !== -1 && g.ev('TRANSLATIONS.' + l + '["reserva.ok"]').indexOf('{rep}') !== -1 && g.ev('TRANSLATIONS.' + l + '["colecao.arrumarOk"]').indexOf('{rep}') !== -1, 'marcador {rep} em ' + l);
  });
  ok(g.ev('RESERVA_CONFIG.imagemResultado') === 'assets/ecras/yoshi_cat_adega_balde.jpg' && fs.existsSync(path.join(RAIZ, 'assets/ecras/yoshi_cat_adega_balde.jpg')), 'imagem da Reserva existe');
  ok(g.ev('COLECAO_TAREFA_CONFIG.imagemResultado') === 'assets/garrafas/garrafa_4_cobre.jpg' && fs.existsSync(path.join(RAIZ, 'assets/garrafas/garrafa_4_cobre.jpg')), 'imagem da Coleção existe');
  ok(/reservaBotaoHtml\(\)/.test(gar) && /reservaDescHtml\(\)/.test(gar) && /colecaoTarefaBotaoHtml\(\)/.test(gar) && /renderColecaoDesenhar/.test(gar), 'garrafa.js liga os dois botões (Reserva e Coleção)');
  const html = ler(path.join(RAIZ, 'index.html'));
  const pos = function (f) { return html.indexOf('<script src="js/' + f + '?v='); };
  ok(pos('garrafa.js') > 0 && pos('reserva.js') > pos('garrafa.js') && pos('reserva.js') < pos('main.js'), 'ordem de carga: garrafa.js, reserva.js, main.js');
  ok(/colecao-painel \{[^}]*44px \+ 8px \+ 44px \+ 8px \+ 52px/.test(html.replace(/\n/g, ' ')) || /bottom: calc\(var\(--nav-altura\) \+ 8px \+ 44px \+ 8px \+ 44px \+ 8px \+ 52px/.test(html), 'o painel da Coleção deixa espaço para o 3.º botão');
  ok(/\.reserva-visita-botao:disabled/.test(html) && /\.colecao-arrumar-botao:disabled/.test(html), 'estilo dos botões apagados');
}

console.log(falhas === 0 ? 'OK' : falhas + ' FALHA(S)');
process.exit(falhas === 0 ? 0 : 1);
