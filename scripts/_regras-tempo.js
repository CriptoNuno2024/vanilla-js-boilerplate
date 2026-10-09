// Auxiliar dos verificar-*.js (não é um teste): carrega num contexto vm SÓ as regras
// puras do relógio de js/tempo.js (carimboCorrigirFuturo, diaLisboaMudou, diaLisboaEfetivo),
// para os testes que simulam o jogo sem carregar o tempo.js inteiro.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function regrasDoRelogio(ficheiro) {
  const src = fs.readFileSync(ficheiro || path.join(__dirname, '..', 'js', 'tempo.js'), 'utf8');
  const a = src.indexOf('// >>> regras-relogio');
  const b = src.indexOf('// <<< regras-relogio');
  if (a === -1 || b === -1 || b < a) throw new Error('js/tempo.js sem o bloco regras-relogio');
  return src.slice(a, b);
}

function injetarRegrasTempo(cx, ficheiro) {
  vm.runInContext(regrasDoRelogio(ficheiro), cx, { filename: 'regras-relogio' });
}

module.exports = { regrasDoRelogio, injetarRegrasTempo };
