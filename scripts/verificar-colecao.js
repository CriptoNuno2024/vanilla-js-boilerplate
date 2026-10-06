#!/usr/bin/env node
// "Nota" da chegada ao nível 6 (state.niveis.garrafasAoNivel6) e as funções puras
// colecaoGarrafasNovas / colecaoCoresFeitas. Corre state.js, niveis.js e garrafa.js
// REAIS num ambiente simulado (vm), sem browser nem conta real.
//
// Uso: node scripts/verificar-colecao.js
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
let falhas = 0;
function ok(cond, msg) { if (!cond) { falhas++; console.log('FALHA: ' + msg); } }

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
  sb.addEventListener = function () {};
  sb.Telegram = { WebApp: {} };
  const cx = vm.createContext(sb);
  vm.runInContext(fs.readFileSync(path.join(RAIZ, 'js', 'state.js'), 'utf8'), cx, { filename: 'state.js' });
  // Stubs do que vive noutros ficheiros (só o que estas funções tocam).
  vm.runInContext(`
    function t(k) { return k; }
    function mostrarFalas() {} function vibrar() {} function tocarSom() {}
    function estacaoAtual() { return 'inverno'; }
    function localeAtual() { return 'pt-PT'; }
    function marcarObjetivoCumprido() {} function updateStatsDisplays() {}
    function desbloquearEntradaEnciclopedia() { return null; }
    function formatarTempoVinha() { return ''; } function randInt(a) { return a; }
    var DIAS_FORCADOS = 0;
  `, cx);
  ['niveis.js', 'garrafa.js'].forEach(function (f) {
    vm.runInContext(fs.readFileSync(path.join(RAIZ, 'js', f), 'utf8'), cx, { filename: f });
  });
  vm.runInContext('renderAdega = function () {}', cx); // só desenha: fora deste teste
  return { cx: cx, guardado: guardado, ev: function (c) { return vm.runInContext(c, cx); } };
}

const h = function (dias, extra) { return Object.assign({ data: 'x', estacao: 'inverno', diasDescanso: dias }, extra || {}); };

// --- Campo: null por omissão e na migração ---
(function () {
  const g = abrir();
  ok(g.ev('state.niveis.garrafasAoNivel6') === null, 'estado novo: garrafasAoNivel6 é null');
  const m = abrir({ reputacao: 20, niveis: { nivelMostrado: 2 }, adega: { historico: [h(1)] } });
  ok(m.ev('state.niveis.garrafasAoNivel6') === null, 'migração (save sem o campo): null');
  ok(m.ev('state.niveis.nivelMostrado') === 2, 'migração mantém nivelMostrado');
  const m2 = abrir({ reputacao: 700, niveis: { nivelMostrado: 6, garrafasAoNivel6: 3 } });
  ok(m2.ev('state.niveis.garrafasAoNivel6') === 3, 'save com o campo mantém o valor');
})();

// --- Entrar na Quinta (verificarSubidaNivel) ---
(function () {
  const g = abrir({ reputacao: 20, niveis: { nivelMostrado: 2 }, adega: { historico: [h(1), h(2)] } });
  g.ev('verificarSubidaNivel()');
  ok(g.ev('state.niveis.garrafasAoNivel6') === null, 'Quinta no nível 2: não carimba');

  const a = abrir({ reputacao: 700, niveis: { nivelMostrado: 6 }, adega: { historico: [h(1), h(2), h(3), h(1, { festa: 'saomartinho' })] } });
  ok(a.ev('verificarSubidaNivel()') === false, 'já no nível 6: não há subida');
  ok(a.ev('state.niveis.garrafasAoNivel6') === 4, 'já no nível 6 sem nota: carimba o tamanho atual (4)');
  ok(JSON.parse(a.guardado.yoshicat_quinta_state_v2).niveis.garrafasAoNivel6 === 4, 'o carimbo foi gravado');
  a.ev('state.adega.historico.push({ diasDescanso: 2 }); verificarSubidaNivel()');
  ok(a.ev('state.niveis.garrafasAoNivel6') === 4, 'o carimbo nunca muda depois de escrito');
  a.ev('state.reputacao += 5000; verificarSubidaNivel()');
  ok(a.ev('state.niveis.garrafasAoNivel6') === 4, 'nem com mais Reputação');

  const b = abrir({ reputacao: 650, niveis: { nivelMostrado: 5 }, adega: { historico: [h(1)] } });
  b.ev('verificarSubidaNivel()');
  ok(b.ev('state.niveis.garrafasAoNivel6') === 1, 'subida real 5 -> 6 na Quinta: carimba 1');

  const z = abrir({ reputacao: 700, niveis: { nivelMostrado: 6, garrafasAoNivel6: 0 }, adega: { historico: [h(1)] } });
  z.ev('verificarSubidaNivel()');
  ok(z.ev('state.niveis.garrafasAoNivel6') === 0, 'o valor 0 é um carimbo válido, não se reescreve');
})();

// --- Engarrafar ---
function engarrafar(rep, historico, nota) {
  const g = abrir({
    reputacao: rep, niveis: { nivelMostrado: 5, garrafasAoNivel6: nota === undefined ? null : nota },
    adega: { historico: historico, lote: { iniciadoEm: 0 } }
  });
  g.ev('diasDescansadosNaCave = function () { return 4.5; }; tempoRestanteAdega = function () { return 0; }');
  g.ev("executarAcaoAdega('engarrafar')");
  return g;
}
(function () {
  // 4 dias de descanso em inverno = 25 + 10? lê-se a Reputação ganha do próprio estado.
  const antes = abrir().ev('reputacaoDaCave(4)');
  ok(antes > 0, 'a Cave dá Reputação (' + antes + ')');
  const g = engarrafar(600 - antes, [h(1), h(2)]);
  ok(g.ev('state.reputacao') >= 600, 'a garrafa fez chegar ao nível 6');
  ok(g.ev('state.niveis.garrafasAoNivel6') === 2, 'Engarrafar que chega ao nível 6: guarda o tamanho ANTES (2)');
  ok(g.ev('state.adega.historico.length') === 3, 'a garrafa entrou no historico');
  ok(g.ev('colecaoGarrafasNovas(state).length') === 1, 'e conta para a Coleção (1 garrafa)');
  ok(g.ev("colecaoCoresFeitas(state).cobre") === true, 'a garrafa de 4 dias é Cobre');

  const n = engarrafar(100, [h(1)]);
  ok(n.ev('state.niveis.garrafasAoNivel6') === null, 'Engarrafar sem chegar ao nível 6: não carimba');

  const j = engarrafar(600 - antes, [h(1), h(2)], 1);
  ok(j.ev('state.niveis.garrafasAoNivel6') === 1, 'Engarrafar com nota já escrita: não muda');
})();

// --- Funções puras ---
(function () {
  const g = abrir();
  const est = function (nota, hist) { return { niveis: { garrafasAoNivel6: nota }, adega: { historico: hist } }; };
  const cores = function (e) { return JSON.stringify(g.ev('colecaoCoresFeitas(' + JSON.stringify(e) + ')')); };
  const lista = function (e) { return g.ev('colecaoGarrafasNovas(' + JSON.stringify(e) + ').length'); };
  const nada = JSON.stringify({ jovem: false, dourado: false, ambar: false, cobre: false });

  ok(lista(est(null, [h(1), h(2)])) === 0, 'campo null: lista vazia');
  ok(cores(est(null, [h(1), h(4)])) === nada, 'campo null: nenhuma cor');
  ok(lista(est(1, [h(1), h(2), h(3)])) === 2, 'a lista começa na posição guardada');
  ok(lista(est(0, [h(1), h(2)])) === 2, 'posição 0: todas');
  ok(lista(est(5, [h(1)])) === 0, 'posição além do fim: vazia');
  ok(lista({ niveis: {}, adega: {} }) === 0 && lista({}) === 0, 'estado incompleto: vazia, sem erro');
  [[1, 'jovem'], [2, 'dourado'], [3, 'ambar'], [4, 'cobre'], [9, 'cobre']].forEach(function (p) {
    const esperado = { jovem: false, dourado: false, ambar: false, cobre: false };
    esperado[p[1]] = true;
    ok(cores(est(0, [h(p[0])])) === JSON.stringify(esperado), p[0] + ' dia(s) = ' + p[1]);
  });
  ok(cores(est(0, [h(0, { festa: 'saomartinho' })])) === nada, 'jeropiga (festa, 0 dias) não conta');
  ok(cores(est(0, [h(3, { festa: 'saomartinho' })])) === nada, 'garrafa de festa nunca conta, mesmo com dias');
  ok(cores(est(0, [h(null), h(undefined), h('x'), null])) === nada, 'entradas sem dias válidos não contam');
  ok(cores(est(1, [h(4), h(1)])) === JSON.stringify({ jovem: true, dourado: false, ambar: false, cobre: false }), 'garrafas antes da posição ficam de fora');
})();

if (falhas) { console.log(falhas + ' falha(s)'); process.exit(1); }
console.log('OK');
