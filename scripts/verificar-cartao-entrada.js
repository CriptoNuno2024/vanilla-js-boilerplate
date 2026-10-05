#!/usr/bin/env node
// Teste puro do cartão "Nova entrada!" (cartaoNovaEntradaVisivel() em
// js/niveis.js): abaixo do Nível 4 não há cartão; no Nível 4 ou mais há;
// o jogador antigo vê sempre o cartão. Só LÊ js/ num ambiente simulado
// (módulo vm), sem browser e sem alterar nada.
//
// Uso: node scripts/verificar-cartao-entrada.js
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const FICHEIROS = ['state.js', 'i18n.js', 'niveis.js'];

function carregarJogo() {
  const guardado = {};
  const sandbox = {
    console: { log() {}, warn() {}, error() {} },
    localStorage: {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(guardado, k) ? guardado[k] : null; },
      setItem: function (k, v) { guardado[k] = String(v); },
      removeItem: function (k) { delete guardado[k]; }
    },
    location: { search: '' },
    URLSearchParams: URLSearchParams,
    document: { querySelectorAll: function () { return []; }, getElementById: function () { return null; } },
    setTimeout: function () {},
    Image: function () {},
    Date: Date
  };
  sandbox.window = sandbox;
  sandbox.Telegram = { WebApp: {} };
  const ctx = vm.createContext(sandbox);
  FICHEIROS.forEach(function (f) {
    vm.runInContext(fs.readFileSync(path.join(RAIZ, 'js', f), 'utf8'), ctx, { filename: 'js/' + f });
  });
  return ctx;
}

const falhas = [];
function verificar(descricao, esperado, obtido) {
  if (esperado !== obtido) falhas.push(descricao + ': esperado ' + esperado + ', obtido ' + obtido);
}

function main() {
  const ctx = carregarJogo();
  const entrada = { id: 'poda', titulo: 'A Poda da Vinha' };
  const nivelMin = vm.runInContext('NIVEIS_CONFIG.map(function (n) { return n.min; })', ctx);
  const rep4 = nivelMin[3]; // Reputação mínima do Nível 4

  function cartao(reputacao, jogadorAntigo, e) {
    ctx.__rep = reputacao;
    ctx.__antigo = jogadorAntigo;
    ctx.__e = e;
    return vm.runInContext(
      'state.reputacao = __rep; state.acesso.jogadorAntigo = __antigo; cartaoNovaEntradaVisivel(__e)', ctx);
  }

  verificar('Nível 1 (0 Reputação), jogador novo', false, cartao(0, false, entrada));
  verificar('Nível 3 (' + (rep4 - 1) + ' Reputação), jogador novo', false, cartao(rep4 - 1, false, entrada));
  verificar('jogadorAntigo ainda por decidir (null), Nível 3', false, cartao(rep4 - 1, null, entrada));
  verificar('Nível 4 (' + rep4 + ' Reputação), jogador novo', true, cartao(rep4, false, entrada));
  verificar('Nível 6 (' + nivelMin[5] + ' Reputação), jogador novo', true, cartao(nivelMin[5], false, entrada));
  verificar('jogador antigo, Nível 1', true, cartao(0, true, entrada));
  verificar('sem entrada (null), Nível 4', false, cartao(rep4, false, null));
  verificar('sem entrada (undefined), jogador antigo', false, cartao(0, true, undefined));

  if (falhas.length > 0) {
    console.log('FALHOU:\n- ' + falhas.join('\n- '));
    process.exit(1);
  }
  console.log('OK');
}

main();
