#!/usr/bin/env node
// Ronda do Chizo que ficou a meio ao mudar o dia (rondaChizoReporDia em js/ronda.js,
// gerarObjetivosDoDia em js/objetivos.js): quem abre o jogo só uma vez por dia recebe a
// meia taça na 1.ª visita do dia seguinte, UMA vez, sem pontos a mais. Corre o state.js,
// o niveis.js, o ronda.js, o objetivos.js e o nuvem.js REAIS num ambiente simulado (vm),
// sem browser nem conta real (nada é gravado).
//
// Uso: node scripts/verificar-ronda-pendente.js
// RONDA_JS=caminho  OBJETIVOS_JS=caminho  corre sobre outra versão desses ficheiros (para
//   provar que os testes apanham a regra estragada).
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const RONDA_JS = process.env.RONDA_JS || path.join(RAIZ, 'js', 'ronda.js');
const OBJETIVOS_JS = process.env.OBJETIVOS_JS || path.join(RAIZ, 'js', 'objetivos.js');
let falhas = 0;
function ok(cond, msg) { if (!cond) { falhas++; console.log('FALHA: ' + msg); } }

const MIN = 60 * 1000, H = 60 * MIN, DIA = 24 * H;
// Outubro de 2026 em Lisboa = UTC+1. d(8, '10:00') = dia 8 às 10:00 de Lisboa.
function d(dia, hhmm) { return Date.parse('2026-10-' + (dia < 10 ? '0' : '') + dia + 'T' + hhmm + ':00+01:00'); }

function finalizar() {
  if (falhas) { console.log(falhas + ' falha(s)'); process.exit(1); }
  console.log('OK');
}

function abrir(inicioMs, estadoGuardado) {
  const relogio = { t: inicioMs };
  const guardado = {};
  if (estadoGuardado) guardado.yoshicat_quinta_state_v2 = JSON.stringify(estadoGuardado);
  const elementos = {};
  function el(id) {
    return elementos[id] || (elementos[id] = { hidden: true, textContent: '', id: id });
  }
  const sb = {
    console: { log() {}, warn() {}, error() {} },
    localStorage: {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(guardado, k) ? guardado[k] : null; },
      setItem: function (k, v) { guardado[k] = String(v); },
      removeItem: function (k) { delete guardado[k]; }
    },
    location: { search: '' },
    URLSearchParams: URLSearchParams,
    Intl: Intl,
    document: {
      addEventListener: function () {}, querySelectorAll: function () { return []; },
      querySelector: function () { return null; }, getElementById: el
    },
    setTimeout: function () {}, clearTimeout: function () {},
    applyTranslations: function () {},
    Date: class extends Date { constructor(...a) { if (a.length) super(...a); else super(relogio.t); } static now() { return relogio.t; } }
  };
  sb.window = sb;
  sb.window.addEventListener = function () {};
  sb.Telegram = { WebApp: {} };
  const cx = vm.createContext(sb);
  require('./_regras-tempo').injetarRegrasTempo(cx);
  function carregar(ficheiro, nome) { vm.runInContext(fs.readFileSync(ficheiro, 'utf8'), cx, { filename: nome }); }
  carregar(path.join(RAIZ, 'js', 'state.js'), 'state.js');
  carregar(path.join(RAIZ, 'js', 'niveis.js'), 'niveis.js');
  vm.runInContext(`
    var FALAS = [], SOM = 0;
    function t(k) { return k; }
    function diaLisboaDeHoje() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
    function randInt(a, b) { return a; }
    function mostrarFalas(f) { FALAS.push(f); }
    function reposicionarFlutuantes() {}
    function vibrar() {} function tocarSom() { SOM++; } function updateStatsDisplays() {}
    function encyclopediaEntries() { return [{ id: 'x', texto: 'curiosidade' }]; }
    function ecraDesbloqueado() { return false; }
    function festaAtual() { return null; } function festaJaFezTarefaHoje() { return true; }
    function tempoAtual() { return { disponivel: false }; } function jaFezTarefaTempoHoje() { return true; }
    function estacaoAtual() { return 'outono'; }
    var VINHA_BONUS_ESTACAO = {}; var RESIDUOS_POR_COMPOSTAGEM = 99;
    function vitoriasProtegerComPremioRestantesHoje() { return 0; } function entradasBloqueadas() { return []; }
    function atualizarCartaoObjetivosQuinta() {}
  `, cx);
  carregar(RONDA_JS, 'ronda.js');          // antes do objetivos.js, como no index.html
  carregar(OBJETIVOS_JS, 'objetivos.js');  // gera os objetivos logo ao carregar
  const j = { cx: cx, relogio: relogio, guardado: guardado };
  j.ev = function (c) { return vm.runInContext(c, cx); };
  j.ir = function (ms) { relogio.t = ms; };
  // Entrar na Quinta: dia novo (se for caso) e depois o pedido/regresso da Ronda.
  j.visita = function (ms) {
    relogio.t = ms;
    j.ev('FALAS.length = 0; rondaChizoEsconderCartao(); garantirObjetivosDoDia();');
    j.ev('rondaChizoAvaliar()');
    return j.ev('_rondaAcaoAtual'); // null, 'mandar' ou 'meiaTaca'
  };
  j.botao = function () { j.ev('rondaChizoBotao()'); };
  j.rep = function () { return j.ev('state.reputacao'); };
  j.gotas = function () { return j.ev('state.gotas'); };
  j.uvas = function () { return j.ev('state.uvas'); };
  j.ronda = function () { return JSON.parse(j.ev('JSON.stringify(state.objetivos.ronda)')); };
  j.fase = function () { return j.ev('rondaChizoFase(Date.now())'); };
  return j;
}

// Jogo parecido com o do jogador: nível 5, jogador antigo, 773 uvas, ~372 de Reputação.
function jogador(inicioMs) {
  const j = abrir(inicioMs);
  j.ev('state.reputacao = 372; state.uvas = 773; state.gotas = 10;');
  return j;
}

// ----- 1. Abre às 10:00 do dia 8, manda; às 10:00 do dia 9 paga UMA vez -----
{
  const j = jogador(d(8, '10:00'));
  ok(j.visita(d(8, '10:00')) === 'mandar', '1: dia 8 devia mostrar o pedido');
  j.botao();
  ok(typeof j.ronda().saidaEm === 'number', '1: mandar devia deixar saidaEm');
  ok(j.visita(d(9, '10:00')) === 'meiaTaca', '1: dia 9 devia mostrar o regresso (fase volta), mas deu ' + j.fase());
  const rep0 = j.rep(), g0 = j.gotas(), uv0 = j.uvas();
  j.botao();
  ok(j.rep() === rep0 + 2 && j.gotas() === g0 + 2, '1: devia pagar +2 Reputação e +2 gotas: ' + (j.rep() - rep0) + '/' + (j.gotas() - g0));
  ok(j.uvas() === uv0, '1: as uvas não podem mudar');
  ok(j.ronda().feitas === 1 && j.ronda().saidaEm === null, '1: conta como a 1.ª ronda do dia e limpa a saída');
  j.botao(); j.ev('rondaChizoDarMeiaTaca()'); j.ev('rondaChizoDarMeiaTaca()');
  ok(j.rep() === rep0 + 2 && j.gotas() === g0 + 2, '1: não pode pagar duas vezes a mesma ronda');
  ok(j.visita(d(9, '10:05')) === 'mandar', '1: depois de pagar, ao voltar à Quinta fica livre para mandar outra');
}

// ----- 2. Manda às 23:50 e volta às 00:30 do dia seguinte: paga; as 4 h mantêm-se -----
{
  const j = jogador(d(8, '23:50'));
  ok(j.visita(d(8, '23:50')) === 'mandar', '2: devia mostrar o pedido às 23:50');
  j.botao();
  ok(j.visita(d(8, '23:55')) === null, '2: às 23:55 o Chizo ainda está fora');
  const rep0 = j.rep();
  ok(j.visita(d(9, '00:30')) === 'meiaTaca', '2: às 00:30 do dia 9 devia pagar (volta)');
  j.botao();
  ok(j.rep() === rep0 + 2, '2: devia pagar +2');
  ok(j.visita(d(9, '03:00')) === null && j.fase() === 'espera', '2: às 03:00 devia estar em espera (4 h depois do fim às 00:20), fase ' + j.fase());
  ok(j.visita(d(9, '04:30')) === 'mandar', '2: às 04:30 já se pode mandar outra');
}

// ----- 3. Uma visita por dia durante 3 dias seguidos (re-entrar na Quinta para mandar) -----
{
  const j = jogador(d(8, '10:00'));
  const rep0 = j.rep(), g0 = j.gotas(), uv0 = j.uvas();
  const pagamentos = [];
  [8, 9, 10, 11].forEach(function (dia) {
    const a = j.visita(d(dia, '10:00'));
    if (a === 'meiaTaca') { const r = j.rep(); j.botao(); pagamentos.push(dia + ':+' + (j.rep() - r)); }
    const b = j.visita(d(dia, '10:01')); // sai da Quinta e volta a entrar
    if (b === 'mandar') j.botao();
    ok(b === 'mandar', '3: dia ' + dia + ' devia ficar livre para mandar (deu ' + b + ')');
  });
  ok(pagamentos.join(' ') === '9:+2 10:+2 11:+2', '3: cada ronda paga na visita do dia seguinte, deu: ' + pagamentos.join(' '));
  ok(j.rep() === rep0 + 6 && j.gotas() === g0 + 6, '3: 3 pagamentos = +6 Reputação e +6 gotas');
  ok(j.uvas() === uv0, '3: as uvas não podem mudar');
}

// ----- 4. Relógio a recuar antes de pagar: não paga, fase "fora" -----
{
  const j = jogador(d(8, '22:00'));
  j.visita(d(8, '22:00')); j.botao();
  const rep0 = j.rep();
  ok(j.visita(d(7, '22:10')) === null, '4: com o relógio no dia anterior não devia aparecer nada');
  ok(j.fase() === 'fora', '4: a fase devia ser "fora", deu ' + j.fase());
  j.ev('rondaChizoDarMeiaTaca()');
  ok(j.rep() === rep0, '4: relógio atrás não pode pagar');
  ok(j.ronda().saidaEm !== null, '4: a ronda pendente devia continuar');
  ok(j.visita(d(8, '22:31')) === 'meiaTaca', '4: com o relógio certo devia poder pagar, fase ' + j.fase());
  j.botao();
  ok(j.rep() === rep0 + 2, '4: depois de voltar ao relógio certo paga uma vez');
}

// ----- 5. Depois de pagar, relógio a recuar: não paga outra vez -----
{
  const j = jogador(d(8, '10:00'));
  j.visita(d(8, '10:00')); j.botao();
  j.visita(d(9, '10:00')); j.botao();
  const rep = j.rep();
  [d(9, '08:00'), d(8, '12:00'), d(7, '10:00'), d(9, '10:30')].forEach(function (ms) {
    j.visita(ms); j.ev('rondaChizoDarMeiaTaca()'); j.ev('rondaChizoDarMeiaTaca()');
    ok(j.rep() === rep, '5: relógio atrás (' + new Date(ms).toISOString() + ') pagou outra vez a mesma ronda');
  });
}

// ----- 6. Dados inválidos ou antigos demais: repõe-se como antes (função pura + gerar o dia) -----
{
  const j = abrir(d(9, '10:00'));
  if (typeof j.cx.rondaChizoReporDia !== 'function') { ok(false, '6: falta rondaChizoReporDia()'); finalizar(); }
  const rep = function (a) { return JSON.stringify(j.cx.rondaChizoReporDia(a, d(9, '10:00'))); };
  const VAZIA = JSON.stringify({ feitas: 0, saidaEm: null, fimEm: null, ultimoFimEm: null });
  const S = d(8, '10:00'), F = S + 30 * MIN;
  ok(rep({ feitas: 1, saidaEm: S, fimEm: F, ultimoFimEm: 5 }) === JSON.stringify({ feitas: 0, saidaEm: S, fimEm: F, ultimoFimEm: null }), '6: ronda válida devia manter só saidaEm/fimEm');
  [
    ['null', null], ['sem objeto', 5], ['strings', { saidaEm: '1', fimEm: '2' }], ['NaN', { saidaEm: NaN, fimEm: F }],
    ['Infinity', { saidaEm: S, fimEm: Infinity }], ['só saidaEm', { saidaEm: S, fimEm: null }],
    ['fim antes da saída', { saidaEm: S, fimEm: S - 1 }], ['fim igual à saída', { saidaEm: S, fimEm: S }],
    ['duração maior que 30 min', { saidaEm: S, fimEm: S + 31 * MIN }],
    ['antiga demais (31 dias)', { saidaEm: d(9, '10:00') - 32 * DIA, fimEm: d(9, '10:00') - 32 * DIA + 30 * MIN }],
    ['muito no futuro (3 dias)', { saidaEm: d(12, '10:00'), fimEm: d(12, '10:00') + 30 * MIN }]
  ].forEach(function (c) { ok(rep(c[1]) === VAZIA, '6: "' + c[0] + '" devia repor tudo'); });
  ok(j.cx.rondaChizoReporDia({ saidaEm: S, fimEm: F }, NaN).saidaEm === null, '6: agora inválido devia repor');
  // Pelo caminho real: gravar uma ronda estragada e mudar de dia.
  const k = jogador(d(8, '10:00'));
  k.visita(d(8, '10:00'));
  k.ev('state.objetivos.ronda = { feitas: 1, saidaEm: "x", fimEm: 7, ultimoFimEm: 3 }');
  ok(k.visita(d(9, '10:00')) === 'mandar' && k.ronda().feitas === 0 && k.ronda().saidaEm === null, '6: ronda estragada devia ser reposta no dia novo');
  // Estado antigo sem o campo "ronda".
  const m = jogador(d(8, '10:00'));
  m.ev('delete state.objetivos.ronda');
  ok(m.visita(d(9, '10:00')) === 'mandar', '6: sem campo ronda devia repor e mostrar o pedido');
}

// ----- 7. Vários dias sem abrir: só um pagamento -----
{
  const j = jogador(d(8, '10:00'));
  j.visita(d(8, '10:00')); j.botao();
  const rep0 = j.rep();
  ok(j.visita(d(14, '10:00')) === 'meiaTaca', '7: 6 dias depois ainda devia haver a ronda pendente');
  j.botao();
  ok(j.rep() === rep0 + 2, '7: só +2');
  j.ev('rondaChizoDarMeiaTaca()');
  ok(j.rep() === rep0 + 2, '7: não devia haver mais nenhum pagamento');
  ok(j.ronda().feitas === 1, '7: conta como 1 ronda do dia');
}

// ----- 8. Limite de 2 por dia e intervalo de 4 h -----
{
  const j = jogador(d(8, '10:00'));
  j.visita(d(8, '10:00')); j.botao();
  const rep0 = j.rep();
  j.visita(d(9, '10:00')); j.botao();                      // 1.ª do dia 9 (a de ontem)
  ok(j.visita(d(9, '10:01')) === 'mandar', '8: devia poder mandar a 2.ª do dia');
  j.botao();
  ok(j.visita(d(9, '10:20')) === null && j.fase() === 'fora', '8: às 10:20 ainda fora');
  ok(j.visita(d(9, '10:40')) === 'meiaTaca', '8: às 10:40 devia regressar');
  j.botao();
  ok(j.rep() === rep0 + 4, '8: duas rondas no dia 9 = +4 (' + (j.rep() - rep0) + ')');
  ok(j.visita(d(9, '23:00')) === null && j.fase() === 'fim', '8: depois de duas, fim do dia, fase ' + j.fase());
  j.ev('rondaChizoMandar()');
  ok(j.ronda().saidaEm === null, '8: não se pode mandar uma 3.ª');
  // 4 h entre rondas: manda às 10:00, paga às 10:40 (fim às 10:30) -> espera até 14:30.
  const k = jogador(d(10, '10:00'));
  k.visita(d(10, '10:00')); k.botao();
  k.visita(d(10, '10:40')); k.botao();
  ok(k.visita(d(10, '14:29')) === null && k.fase() === 'espera', '8: às 14:29 ainda em espera');
  ok(k.visita(d(10, '14:31')) === 'mandar', '8: às 14:31 já pode mandar');
}

// ----- 9. Caminho da nuvem: o estado de ontem chega de outro aparelho e o dia vira -----
{
  const j = jogador(d(9, '10:00'));
  const ontem = JSON.parse(j.ev('JSON.stringify(state)'));
  ontem.objetivos = { dia: '2026-10-08', lista: [{ id: 'vinha_cavar', cumprido: true }], bonusDiaDado: false, selosTotal: 4,
    ronda: { feitas: 1, saidaEm: d(8, '23:50'), fimEm: d(8, '23:50') + 30 * MIN, ultimoFimEm: d(8, '10:30') } };
  ontem.reputacao = 400; ontem.ultimaGravacaoEm = d(8, '23:51');
  // Telegram "nuvem" só para o nuvem.js carregar; nuvemTratarLeitura() é a que adota o estado.
  j.cx.Telegram.WebApp = {};
  carregarNuvem(j);
  j.ev('arranque.localEm = 1; arranque.localRep = 0;');
  j.cx.__nuvem = ontem;
  j.ev("nuvemTratarLeitura(__nuvem, 'ok', false)");
  ok(j.ev("arranque.ganhou").indexOf('nuvem') === 0, '9: o estado da nuvem devia ter sido adotado, ganhou=' + j.ev('arranque.ganhou'));
  const r = j.ronda();
  ok(j.ev('state.objetivos.dia') === '2026-10-09', '9: o dia devia ter virado para 2026-10-09');
  ok(r.feitas === 0 && r.ultimoFimEm === null && r.saidaEm === d(8, '23:50'), '9: a ronda pendente devia passar ao dia novo: ' + JSON.stringify(r));
  ok(j.fase() === 'volta', '9: devia ficar na fase "volta", deu ' + j.fase());
  const rep0 = j.rep();
  j.visita(d(9, '10:00')); j.botao();
  ok(j.rep() === rep0 + 2, '9: paga +2 uma só vez');
}
function carregarNuvem(j) {
  vm.runInContext(fs.readFileSync(path.join(RAIZ, 'js', 'nuvem.js'), 'utf8'), j.cx, { filename: 'nuvem.js' });
}

// ----- 10. Antes do nível 3 a Ronda não aparece (como antes) -----
{
  const j = abrir(d(8, '10:00'));
  j.ev('state.reputacao = 10');
  ok(j.visita(d(8, '10:00')) === null, '10: nível 1 não devia mostrar a Ronda');
}

// ----- 11. index.html: ronda.js carrega antes de objetivos.js (este chama o ajudante ao carregar) -----
{
  const html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
  const a = html.indexOf('src="js/ronda.js'), b = html.indexOf('src="js/objetivos.js');
  ok(a !== -1 && b !== -1 && a < b, '11: js/ronda.js tem de vir antes de js/objetivos.js no index.html');
}

finalizar();
