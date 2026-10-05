#!/usr/bin/env node
// Verifica o Caderno dos Fygmos (js/caderno.js): dados e escolherPaginaCaderno().
// Só LÊ js/ e corre-o num ambiente simulado (vm); nunca toca em browser, Telegram nem conta real.
//
// Uso: node scripts/verificar-caderno.js [--final]
//   (sem --final) aceita os textos provisórios "[por escrever]";
//   --final       FALHA se ainda restar "[por escrever]" (usar antes de ligar o Caderno ao jogo).
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const FINAL = process.argv.indexOf('--final') !== -1;
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'caderno.js'), 'utf8'), ctx, { filename: 'caderno.js' });
const run = function (c) { return vm.runInContext(c, ctx); };
const PAGINAS = run('CADERNO_PAGINAS');
const escolher = ctx.escolherPaginaCaderno;
const ALVOS = ['vinha', 'adega', 'cave', 'nevoeiro', 'trovoada'];
const AUTOR = { vinha: 'Fygmo', adega: 'Fygmo', cave: 'Fygmo2', nevoeiro: 'Fygmo2', trovoada: 'Fygmo' };

let falhas = 0;
function ok(cond, msg) { if (!cond) { falhas++; console.log('FALHA: ' + msg); } }
const dia = function (n) { return '2026-' + String(1 + Math.floor(n / 28) % 12).padStart(2, '0') + '-' + String(1 + n % 28).padStart(2, '0'); };

// ----- Dados: 15 páginas, ids únicos, autores, raridades, 3 línguas -----
{
  ok(PAGINAS.length === 15, 'devia haver 15 páginas, há ' + PAGINAS.length);
  const ids = PAGINAS.map(function (p) { return p.id; });
  ok(new Set(ids).size === ids.length, 'ids repetidos');
  ALVOS.forEach(function (a) {
    const doAlvo = PAGINAS.filter(function (p) { return p.alvo === a; });
    ok(doAlvo.length === 3, a + ': devia ter 3 páginas, tem ' + doAlvo.length);
    ok(doAlvo.filter(function (p) { return p.raridade === 'comum'; }).length === 2, a + ': devia ter 2 comuns');
    ok(doAlvo.filter(function (p) { return p.raridade === 'rara'; }).length === 1, a + ': devia ter 1 rara');
    ok(doAlvo.every(function (p) { return p.autor === AUTOR[a]; }), a + ': autor devia ser ' + AUTOR[a]);
    ok(doAlvo.map(function (p) { return p.id; }).sort().join() === [a + '_1', a + '_2', a + '_rara'].sort().join(), a + ': ids fora do padrão: ' + doAlvo.map(function (p) { return p.id; }));
  });
  ok(PAGINAS.every(function (p) { return ALVOS.indexOf(p.alvo) !== -1 && (p.raridade === 'comum' || p.raridade === 'rara') && (p.autor === 'Fygmo' || p.autor === 'Fygmo2'); }), 'alvo, raridade ou autor inválido');
  // Paridade das línguas: todas as páginas têm pt, en e es, com titulo e corpo não vazios.
  PAGINAS.forEach(function (p) {
    ['pt', 'en', 'es'].forEach(function (l) {
      const t = p[l];
      ok(t && typeof t.titulo === 'string' && t.titulo.trim() !== '' && typeof t.corpo === 'string' && t.corpo.trim() !== '', p.id + ' (' + l + '): titulo/corpo em falta ou vazios');
    });
    ok(Object.keys(p).sort().join() === ['alvo', 'autor', 'en', 'es', 'id', 'pt', 'raridade'].sort().join(), p.id + ': campos inesperados: ' + Object.keys(p));
  });
  // Os alvos do Caderno são os mesmos da pista dos porcos.
  const assaltos = vm.createContext({ URLSearchParams: URLSearchParams, location: { search: '' } });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'assaltos.js'), 'utf8'), assaltos);
  ok(JSON.stringify(vm.runInContext('ASSALTOS_ALVOS', assaltos)) === JSON.stringify(run('CADERNO_ALVOS')), 'CADERNO_ALVOS devia ser igual a ASSALTOS_ALVOS');
  // --final: nenhum texto pode ficar por escrever.
  const porEscrever = [];
  PAGINAS.forEach(function (p) { ['pt', 'en', 'es'].forEach(function (l) {
    if (String(p[l].titulo).indexOf('[por escrever]') !== -1 || String(p[l].corpo).indexOf('[por escrever]') !== -1) porEscrever.push(p.id + '/' + l);
  }); });
  if (FINAL) ok(porEscrever.length === 0, '--final: ainda há ' + porEscrever.length + ' textos "[por escrever]" (ex.: ' + porEscrever.slice(0, 3).join(', ') + ')');
  else console.log('(modo normal: ' + porEscrever.length + ' de ' + PAGINAS.length * 3 + ' textos ainda "[por escrever]")');
}

// ----- Escolha estável: o mesmo dia e índice dão sempre a mesma página -----
{
  for (let n = 0; n < 60; n++) {
    ALVOS.forEach(function (a) {
      [0, 1].forEach(function (i) {
        const r1 = escolher(a, [], dia(n), i, false, true);
        const r2 = escolher(a, [], dia(n), i, false, true);
        const r3 = escolher(a, {}, dia(n), i, false, true);
        ok(r1.pagina && r1.pagina === r2.pagina && r1.pagina === r3.pagina && r1.completo === false, 'escolha instável em ' + a + ' ' + dia(n) + ' #' + i);
        ok(r1.pagina.alvo === a, 'página de outro alvo: ' + r1.pagina.id + ' para ' + a);
      });
    });
  }
}

// ----- Não repete até haver todas as do alvo; completo devolve null -----
{
  ALVOS.forEach(function (a) {
    const tenho = [];
    for (let n = 0; n < 3; n++) {
      const r = escolher(a, tenho, dia(7 + n), 0, n === 1, true);
      ok(r.pagina && tenho.indexOf(r.pagina.id) === -1, a + ': repetiu ' + (r.pagina && r.pagina.id) + ' com ' + tenho);
      tenho.push(r.pagina.id);
    }
    ok(tenho.length === 3 && new Set(tenho).size === 3, a + ': devia ter dado as 3 páginas distintas: ' + tenho);
    const fim = escolher(a, tenho, dia(40), 0, true, true);
    ok(fim.pagina === null && fim.completo === true, a + ': com todas devia dar { null, completo: true }');
  });
  // O mapa do estado (idPagina -> data) também serve, e ids de outros alvos não contam.
  const mapa = { vinha_1: '2026-10-01', adega_1: '2026-10-02' };
  const r = escolher('vinha', mapa, dia(3), 0, false, true);
  ok(r.pagina && r.pagina.id !== 'vinha_1' && r.pagina.alvo === 'vinha', 'o mapa do estado devia ser aceite');
  ok(escolher('adega', mapa, dia(3), 0, false, true).pagina.id !== 'adega_1', 'adega_1 já tida não devia sair');
  // Faltando só uma do tipo escolhido, dá a outra (só a rara por ganhar: sai mesmo sem calhar rara).
  let soRara = 0;
  for (let n = 0; n < 40; n++) { const q = escolher('vinha', ['vinha_1', 'vinha_2'], dia(n), 0, false, true); if (q.pagina && q.pagina.id === 'vinha_rara') soRara++; }
  ok(soRara === 40, 'só faltando a rara, devia dar sempre a rara (' + soRara + '/40)');
  let soComum = 0;
  for (let n = 0; n < 40; n++) { const q = escolher('vinha', ['vinha_rara'], dia(n), 1, true, true); if (q.pagina && q.pagina.raridade === 'comum') soComum++; }
  ok(soComum === 40, 'sem raras por ganhar, devia dar sempre comum (' + soComum + '/40)');
}

// ----- Cave só com caveAberta; alvos desconhecidos -----
{
  const fechada = escolher('cave', [], dia(1), 0, true, false);
  ok(fechada.pagina === null && fechada.completo === false, 'cave fechada: devia dar { null, completo: false }');
  ok(escolher('cave', [], dia(1), 0, true, undefined).pagina === null, 'cave sem caveAberta: nada');
  ok(escolher('cave', [], dia(1), 0, true, true).pagina.alvo === 'cave', 'cave aberta: devia dar página da cave');
  ALVOS.filter(function (a) { return a !== 'cave'; }).forEach(function (a) {
    ok(escolher(a, [], dia(1), 0, false, false).pagina !== null, a + ': não depende da cave');
  });
  ['porco', '', null, undefined].forEach(function (a) {
    const r = escolher(a, [], dia(1), 0, false, true);
    ok(r.pagina === null && r.completo === false, 'alvo desconhecido (' + a + ') devia dar { null, completo: false }');
  });
  // cave fechada com cave já ganha antes: continua a não dar nada (e não é "completo").
  ok(escolher('cave', ['cave_1', 'cave_2', 'cave_rara'], dia(1), 0, false, false).completo === false, 'cave fechada nunca é "completo"');
}

// ----- O isco aumenta a chance de rara (contada em muitos dias) -----
{
  const N = 4000;
  let semIsco = 0, comIsco = 0;
  for (let n = 0; n < N; n++) {
    const d = '2027-' + String(1 + Math.floor(n / 28) % 12).padStart(2, '0') + '-' + String(1 + n % 28).padStart(2, '0') + '#' + n;
    if (escolher('adega', [], d, 0, false, true).pagina.raridade === 'rara') semIsco++;
    if (escolher('adega', [], d, 0, true, true).pagina.raridade === 'rara') comIsco++;
  }
  const pSem = semIsco / N, pCom = comIsco / N;
  ok(pCom > pSem, 'o isco devia dar mais raras: ' + pCom + ' vs ' + pSem);
  ok(Math.abs(pSem - 0.15) < 0.03, 'sem isco devia rondar 15% de raras: ' + pSem);
  ok(Math.abs(pCom - 0.40) < 0.03, 'com isco devia rondar 40% de raras: ' + pCom);
  // Com o mesmo dia e índice, quem rara sem isco também rara com isco (40 > 15 no mesmo hash).
  let incoerente = 0;
  for (let n = 0; n < N; n++) {
    const d = 'dia' + n;
    if (escolher('adega', [], d, 0, false, true).pagina.raridade === 'rara' && escolher('adega', [], d, 0, true, true).pagina.raridade !== 'rara') incoerente++;
  }
  ok(incoerente === 0, 'o isco nunca devia tirar uma rara que já sairia sem isco (' + incoerente + ')');
  // Dias diferentes ou índices diferentes podem dar páginas diferentes (não é sempre a mesma).
  const vistas = new Set();
  for (let n = 0; n < 200; n++) vistas.add(escolher('trovoada', [], dia(n), n % 2, false, true).pagina.id);
  ok(vistas.size === 3, 'em muitos dias devia sair mais do que uma página (' + vistas.size + ')');
}

console.log(falhas === 0 ? 'OK' : falhas + ' FALHA(S)');
process.exit(falhas === 0 ? 0 : 1);
