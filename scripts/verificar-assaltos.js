// Verifica a pista dos porcos (js/assaltos.js) com leituras simuladas.
// Uso: node scripts/verificar-assaltos.js   (sai com código 1 se algo falhar)
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ctx = { URLSearchParams: URLSearchParams, location: { search: '' } };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'assaltos.js'), 'utf8'), ctx);
const { alvoDosPorcosDoDia, textoDaPista, tipoDeProtegerPelaPista } = ctx;

let falhas = 0;
function ok(cond, msg) { if (!cond) { falhas++; console.log('FALHA: ' + msg); } }

function dias(n) { // n dias seguidos a partir de 2026-09-01 (UTC)
  const lista = [];
  for (let i = 0; i < n; i++) lista.push(new Date(Date.UTC(2026, 8, 1 + i)).toISOString().slice(0, 10));
  return lista;
}

const CENARIOS = [
  ['inverno sem garrafa', { estacao: 'inverno', fase: 'repouso' }],
  ['inverno com garrafa', { estacao: 'inverno', fase: 'repouso', garrafaEscura: true }],
  ['primavera', { estacao: 'primavera', fase: 'floracao' }],
  ['primavera com garrafa', { estacao: 'primavera', fase: 'floracao', garrafaEscura: true }],
  ['verao', { estacao: 'verao', fase: 'pintor' }],
  ['verao com garrafa', { estacao: 'verao', fase: 'pintor', garrafaEscura: true }],
  ['outono setembro', { estacao: 'outono', fase: 'vindima' }],
  ['outono outubro', { estacao: 'outono', fase: 'fimVindima' }],
  ['outono novembro', { estacao: 'outono', fase: 'quedaFolha' }],
  ['outono outubro com garrafa', { estacao: 'outono', fase: 'fimVindima', garrafaEscura: true }],
  ['trovoada', { estacao: 'verao', fase: 'pintor', ceu: 'trovoada', garrafaEscura: true }],
  ['nevoeiro', { estacao: 'outono', fase: 'vindima', ceu: 'nevoeiro' }],
  ['tempo indisponivel', { estacao: 'inverno', fase: 'repouso', garrafaEscura: true, ceu: null }],
  ['tudo em falta', {}]
];

CENARIOS.forEach(function (c) {
  const dist = {};
  let diferentes = 0;
  dias(60).forEach(function (dia) {
    const l = Object.assign({ dia: dia, estacao: null, fase: null, ceu: null, garrafaEscura: false, forcado: null }, c[1]);
    const a0 = alvoDosPorcosDoDia(0, l), a1 = alvoDosPorcosDoDia(1, l);
    ok(a0 === alvoDosPorcosDoDia(0, l) && a1 === alvoDosPorcosDoDia(1, l), c[0] + ': não é estável em ' + dia);
    ok(textoDaPista(a0, 0, l) === textoDaPista(a0, 0, l), c[0] + ': texto não estável');
    if (a0 !== a1) diferentes++;
    [a0, a1].forEach(function (a) {
      dist[a] = (dist[a] || 0) + 1;
      if (a === 'cave') ok(!!l.garrafaEscura && !l.ceu, c[0] + ': cave sem garrafa escura');
      if (a === 'vinha') ok(l.estacao === 'verao' || (l.estacao === 'outono' && (l.fase === 'vindima' || l.fase === 'fimVindima')), c[0] + ': vinha fora de época');
      if (l.ceu === 'trovoada' || l.ceu === 'nevoeiro') ok(a === l.ceu, c[0] + ': o tempo não venceu');
    });
  });
  console.log(c[0].padEnd(28) + JSON.stringify(dist) + '  indices diferentes no mesmo dia: ' + diferentes + '/60');
  if (!c[1].ceu && c[1].estacao) ok(diferentes > 0 || Object.keys(dist).length === 1, c[0] + ': índices nunca diferem');
});

// Variantes: ambas (1 e 2) aparecem e a chave tem o formato certo.
const variantes = {};
dias(60).forEach(function (dia) {
  const k = textoDaPista('adega', 0, { dia: dia });
  ok(/^ronda\.pista\.adega\.[12]$/.test(k), 'chave inválida ' + k);
  variantes[k] = 1;
});
ok(Object.keys(variantes).length === 2, 'as duas variantes devem aparecer em 60 dias');

// Variante com o mesmo alvo nas 2 rondas do dia: nunca a mesma frase.
dias(60).forEach(function (dia) {
  ok(textoDaPista('adega', 0, { dia: dia }) !== textoDaPista('adega', 1, { dia: dia }), 'frase repetida nas 2 rondas em ' + dia);
});

// Alvo -> minijogo do Proteger (null = sorteio de hoje).
const TIPOS = { cave: 'fechadura', vinha: 'disfarces', nevoeiro: 'chizo', trovoada: 'chizo', adega: null };
Object.keys(TIPOS).forEach(function (a) { ok(tipoDeProtegerPelaPista(a) === TIPOS[a], 'tipo errado para ' + a); });
['porco', '', undefined, null, 42].forEach(function (v) { ok(tipoDeProtegerPelaPista(v) === null, 'valor inválido deve dar null: ' + v); });

// Alvo forçado pelo endereço (não escreve nada) e valor inválido ignorado.
ctx.location.search = '?pista=cave';
ok(alvoDosPorcosDoDia(0) === 'cave', '?pista=cave deve forçar a cave');
ctx.location.search = '?pista=porco';
ok(alvoDosPorcosDoDia(0) === 'adega', '?pista inválida deve cair para adega (sem globais)');

console.log(falhas === 0 ? 'OK' : falhas + ' FALHA(S)');
process.exit(falhas === 0 ? 0 : 1);
