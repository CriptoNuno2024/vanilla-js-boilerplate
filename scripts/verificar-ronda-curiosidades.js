#!/usr/bin/env node
// Teste puro das curiosidades da Ronda do Chizo por época do ano
// (rondaChizoCandidatas / rondaChizoEscolher em js/ronda.js, campo "meses"
// em js/explorar.js): em outubro a 'poda' nunca é escolhida e a 'vindima'
// pode ser; em janeiro o contrário; nos outros meses nenhuma das duas; e a
// lista de candidatas nunca fica vazia. Só LÊ js/ num ambiente simulado (vm).
//
// Uso: node scripts/verificar-ronda-curiosidades.js
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const ctx = vm.createContext({ console: console });
vm.runInContext('var currentLang = "pt";', ctx);
['explorar.js', 'ronda.js'].forEach(function (f) {
  vm.runInContext(fs.readFileSync(path.join(RAIZ, 'js', f), 'utf8'), ctx, { filename: 'js/' + f });
});

const falhas = [];
function ok(cond, msg) { if (!cond) falhas.push(msg); }

const LINGUAS = ['pt', 'en', 'es'];
const MESES = { poda: [11, 12, 1, 2, 3], vindima: [9, 10] };
const pad = function (n) { return (n < 10 ? '0' : '') + n; };

// O campo "meses" é igual nas 3 línguas e só existe em poda e vindima.
LINGUAS.forEach(function (l) {
  ctx.__l = l;
  const entradas = vm.runInContext('ENCYCLOPEDIA_ENTRIES[__l]', ctx);
  entradas.forEach(function (e) {
    if (MESES[e.id]) ok(JSON.stringify(e.meses) === JSON.stringify(MESES[e.id]), l + ': meses de ' + e.id + ' errados');
    else ok(e.meses === undefined, l + ': ' + e.id + ' não devia ter "meses"');
  });
});

LINGUAS.forEach(function (l) {
  ctx.__l = l;
  const entradas = vm.runInContext('ENCYCLOPEDIA_ENTRIES[__l]', ctx);
  const texto = function (id) { return entradas.filter(function (e) { return e.id === id; })[0].texto; };
  for (let mes = 1; mes <= 12; mes++) {
    ctx.__m = mes; ctx.__e = entradas;
    const cand = vm.runInContext('rondaChizoCandidatas(__e, __m)', ctx);
    ok(cand.length > 0, l + ' mês ' + mes + ': sem candidatas');
    const ids = cand.map(function (e) { return e.id; });
    ['poda', 'vindima'].forEach(function (id) {
      ok((ids.indexOf(id) !== -1) === (MESES[id].indexOf(mes) !== -1), l + ' mês ' + mes + ': ' + id + ' nas candidatas = ' + (ids.indexOf(id) !== -1));
    });
    // Escolhas ao longo de 4 anos de dias deste mês, 2 rondas por dia.
    const vistos = { poda: 0, vindima: 0 };
    for (let ano = 2026; ano < 2030; ano++) for (let d = 1; d <= 28; d++) for (let i = 0; i < 2; i++) {
      ctx.__d = ano + '-' + pad(mes) + '-' + pad(d); ctx.__i = i;
      const t = vm.runInContext('rondaChizoEscolher(__e, __d, __i)', ctx);
      ok(t !== '', l + ' ' + ctx.__d + ': escolha vazia');
      ok(t === vm.runInContext('rondaChizoEscolher(__e, __d, __i)', ctx), l + ' ' + ctx.__d + ': escolha instável');
      if (t === texto('poda')) vistos.poda++;
      if (t === texto('vindima')) vistos.vindima++;
    }
    const podaPode = MESES.poda.indexOf(mes) !== -1, vindimaPode = MESES.vindima.indexOf(mes) !== -1;
    ok(podaPode || vistos.poda === 0, l + ' mês ' + mes + ': a poda foi escolhida fora de época');
    ok(vindimaPode || vistos.vindima === 0, l + ' mês ' + mes + ': a vindima foi escolhida fora de época');
    if (l === 'pt' && (mes === 10 || mes === 1)) {
      ok(mes === 10 ? vistos.vindima > 0 : vistos.poda > 0, 'mês ' + mes + ': a entrada da época nunca saiu');
    }
  }
});

// Nunca vazio: se tudo tiver "meses" fora de época, ignora-se o campo.
ctx.__e = [{ id: 'x', meses: [1], texto: 'a' }];
ok(vm.runInContext('rondaChizoCandidatas(__e, 6).length', ctx) === 1, 'lista só sazonal fora de época devia manter 1 candidata');
ok(vm.runInContext('rondaChizoEscolher([], "2026-10-05", 0)', ctx) === '', 'sem entradas devia dar texto vazio');

if (falhas.length) { console.log(falhas.join('\n')); process.exit(1); }
console.log('OK');
