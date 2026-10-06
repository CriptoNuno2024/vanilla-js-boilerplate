#!/usr/bin/env node
// Capítulo 6 "A Coleção" (js/capitulos.js) e "nota" da chegada ao nível 6 (state.niveis.garrafasAoNivel6) e as funções puras
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
  ['niveis.js', 'garrafa.js', 'capitulos.js'].forEach(function (f) {
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

// --- Capítulo 6 "A Coleção": critério coresColecao, "x / 4" ---
(function () {
  const cap6 = "CAPITULOS_CONFIG.filter(function (c) { return c.id === 'cap6'; })[0]";
  const lido = function (g) { return JSON.parse(g.ev('JSON.stringify(capitulosLerCriterio(' + cap6 + '))')); };
  const com = function (nota, hist, extra) {
    return abrir(Object.assign({ reputacao: 700, niveis: { nivelMostrado: 6, garrafasAoNivel6: nota }, adega: { historico: hist } }, extra || {}));
  };
  const todas = [h(1), h(2), h(3), h(4)];

  [0, 1, 2, 3, 4].forEach(function (n) {
    const r = lido(com(0, todas.slice(0, n)));
    ok(r.atual === n && r.total === 4, n + ' cor(es): progresso ' + n + ' / 4 (deu ' + r.atual + ' / ' + r.total + ')');
    ok(r.cumprido === (n === 4), n + ' cor(es): cumprido só com as 4');
  });
  ok(lido(com(0, [h(1), h(1), h(1)])).atual === 1, 'a mesma cor repetida conta uma vez');
  ok(lido(com(0, [h(9), h(4)])).atual === 1, '4 ou mais dias são todos Cobre');

  const nulo = lido(com(null, todas));
  ok(nulo.atual === 0 && nulo.total === 4 && !nulo.cumprido, 'nota null: 0 / 4 mesmo com 4 cores no historico');
  const antes = lido(com(4, todas));
  ok(antes.atual === 0 && !antes.cumprido, 'garrafas feitas antes da nota não contam');
  ok(lido(com(2, todas)).atual === 2, 'só contam as garrafas a partir da nota (2 cores)');
  ok(lido(com(0, [h(1), h(0, { festa: 'saomartinho' }), h(3, { festa: 'saomartinho' })])).atual === 1, 'garrafa de festa não conta');

  // Capítulo 6 já concluído continua concluído, mesmo sem cores e sem nota.
  const fechado = abrir({ reputacao: 700, niveis: { nivelMostrado: 6 },
    capitulos: { iniciado: true, celebradosMigrado: true, concluidos: { cap6: true }, celebrados: { cap6: true } } });
  ok(fechado.ev('state.capitulos.concluidos.cap6') === true && fechado.ev('state.capitulos.celebrados.cap6') === true, 'cap6 concluído e celebrado mantém-se');
  ok(fechado.ev('capituloEstaCumprido(' + cap6 + ')') === true, 'cap6 já concluído continua cumprido com 0 cores');
  ok(fechado.ev('capitulosAvaliarCelebracao()') === false, 'cap6 já celebrado não volta a celebrar');
  // Um cap6 por fechar, mesmo com a Enciclopédia toda descoberta, segue o critério novo.
  const aberto = abrir({ reputacao: 700, niveis: { nivelMostrado: 6 }, encyclopedia: { unlocked: Array.from({ length: 60 }, function (_, i) { return 'e' + i; }) } });
  ok(aberto.ev('capituloEstaCumprido(' + cap6 + ')') === false, 'cap6 por fechar: a Enciclopédia já não o fecha');
  ok(aberto.ev('state.capitulos.concluidos.cap6') !== true, 'cap6 por fechar não é marcado na migração silenciosa');

  // Textos (PT, EN, ES).
  const g = abrir();
  ['pt', 'en', 'es'].forEach(function (l) {
    const s = g.ev('CAPITULOS_STRINGS.' + l + '.cap6');
    ok(s && s.titulo && s.objetivo, l + ': cap6 tem título e objetivo');
  });
  ok(g.ev('CAPITULOS_STRINGS.pt.cap6.titulo') === 'A Coleção', 'PT: título');
  ok(g.ev('CAPITULOS_STRINGS.en.cap6.titulo') === 'The Collection', 'EN: título');
  ok(g.ev('CAPITULOS_STRINGS.es.cap6.titulo') === 'La Colección', 'ES: título');
})();

if (falhas) { console.log(falhas + ' falha(s)'); process.exit(1); }
console.log('OK');
