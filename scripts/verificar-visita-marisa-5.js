#!/usr/bin/env node
// A primeira visita vinda de dados/ (dados/visitas.js): marisa_5.
// Prova: está no jogo com a pasta dados/; é possível na fase quedaFolha com nível 4 ou mais, e NÃO noutra fase
// nem abaixo do nível 4; o texto sai nas 3 línguas.
// Uso: node scripts/verificar-visita-marisa-5.js   (JS_DIR=pasta corre sobre outra versão dos js/)
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const path = require('path');
const { abrirJogo } = require('./_jogo-vm');

const JS_DIR = process.env.JS_DIR || path.join(__dirname, '..', 'js');
let falhas = 0;
function ok(cond, msg) { if (!cond) { falhas++; console.log('FALHA: ' + msg); } }

const g = abrirJogo({ jsDir: JS_DIR });
const ev = g.ev;
const ctx = function (nivel, fase) { return JSON.stringify({ nivel: nivel, estacao: 'outono', fase: fase, festaAtiva: false, caveAberta: false, garrafaDias: null }); };
const possivel = function (nivel, fase) { return ev('visitaCondicaoOk(visitaPorId("marisa_5"), ' + ctx(nivel, fase) + ')'); };

ok(ev('visitaPorId("marisa_5") !== null'), 'marisa_5 devia existir no jogo (vem de dados/visitas.js)');
ok(ev('visitaPorId("marisa_5").personagem') === 'marisa' && ev('visitaPorId("marisa_5").reputacao') === 1, 'marisa_5: personagem marisa, reputação 1');
ok(ev('JSON.stringify(visitaPorId("marisa_5").condicao)') === '{"tipo":"fase","valores":["quedaFolha"]}', 'marisa_5: condição fase quedaFolha');

// Possível só na quedaFolha com nível >= 4.
[4, 5, 10].forEach(function (n) { ok(possivel(n, 'quedaFolha') === true, 'devia ser possível na quedaFolha com nível ' + n); });
[1, 2, 3].forEach(function (n) { ok(possivel(n, 'quedaFolha') === false, 'NÃO devia ser possível abaixo do nível 4 (nível ' + n + ')'); });
['repouso', 'vindima', 'fimVindima', 'pintor', 'floracao', null].forEach(function (f) {
  ok(possivel(4, f) === false, 'NÃO devia ser possível na fase ' + f);
  ok(possivel(10, f) === false, 'NÃO devia ser possível na fase ' + f + ' (nível 10)');
});

// Aparece (ou não) na escolha do dia: com a marisa_5 como única nova na quedaFolha vê-se que sai em algum dia;
// fora da quedaFolha ou abaixo do nível 4 nunca sai.
function saiu(nivel, fase) {
  for (let n = 0; n < 60; n++) {
    const dia = '2026-11-' + String(1 + n % 28).padStart(2, '0') + '#' + n;
    if (ev('(escolherVisitaDoDia([], ' + ctx(nivel, fase) + ', ' + JSON.stringify(dia) + ').visita || {}).id') === 'marisa_5') return true;
  }
  return false;
}
ok(saiu(4, 'quedaFolha') === true, 'na quedaFolha com nível 4 devia sair em algum dia');
ok(saiu(4, 'repouso') === false, 'noutra fase nunca devia sair');
ok(saiu(3, 'quedaFolha') === false, 'abaixo do nível 4 nunca devia sair');

// Texto nas 3 línguas, com o pedido.
const TEXTOS = {
  pt: 'Depois da vindima, a vinha parece uma sala depois da festa: folhas por todo o lado e ninguém com vontade de arrumar. Eu arrumo.',
  en: 'After the harvest, the vineyard looks like a room after a party: leaves everywhere and nobody feeling like tidying up. I tidy up.',
  es: 'Después de la vendimia, la viña parece una sala después de la fiesta: hojas por todas partes y nadie con ganas de recoger. Yo recojo.'
};
['pt', 'en', 'es'].forEach(function (l) {
  ok(ev('visitaPorId("marisa_5").texto.' + l) === TEXTOS[l], 'texto ' + l + ' diferente do pedido');
  ok(ev('(function () { currentLang = ' + JSON.stringify(l) + '; return visitaFalaDe(visitaPorId("marisa_5")).texto; })()') === TEXTOS[l], 'a fala devia sair em ' + l);
});

if (falhas) { console.log(falhas + ' falha(s)'); process.exit(1); }
console.log('OK');
