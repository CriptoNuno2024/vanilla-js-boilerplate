#!/usr/bin/env node
// Verifica as Visitas à Quinta (js/visitas.js): dados, visitaCondicaoOk() e
// escolherVisitaDoDia(). Só LÊ o ficheiro e corre-o num ambiente simulado (vm), onde
// Math.random e Date.now ficam proibidos: as funções têm de ser puras.
//
// Uso: node scripts/verificar-visitas.js [--final]
//   (sem --final) aceita os textos provisórios "[por escrever]";
//   --final       FALHA se ainda restar "[por escrever]".
// VISITAS_JS=caminho  corre o teste sobre outra versão do ficheiro (para provar que
//   os testes apanham a falta da regra do nível 4 ou das condições).
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const FINAL = process.argv.indexOf('--final') !== -1;
const FICHEIRO = process.env.VISITAS_JS || path.join(__dirname, '..', 'js', 'visitas.js');
const ctx = vm.createContext({});
vm.runInContext('Math.random = function () { throw new Error("Math.random proibido"); }; Date.now = function () { throw new Error("Date.now proibido"); };', ctx);
vm.runInContext(fs.readFileSync(FICHEIRO, 'utf8') + '\n;this.VISITAS = VISITAS; this.PERSONAGENS = VISITAS_PERSONAGENS;', ctx, { filename: 'visitas.js' });
const VISITAS = ctx.VISITAS;
const PERSONAGENS = ctx.PERSONAGENS;
const condOk = ctx.visitaCondicaoOk;
const escolher = ctx.escolherVisitaDoDia;

let falhas = 0;
function ok(cond, msg) { if (!cond) { falhas++; console.log('FALHA: ' + msg); } }
const dia = function (n) { return '2026-' + String(1 + Math.floor(n / 28) % 12).padStart(2, '0') + '-' + String(1 + n % 28).padStart(2, '0'); };

// Condições esperadas, escritas à parte (não lidas do ficheiro).
const ESPERADO = {
  valentim_1: [2, 'estacao=inverno'], valentim_2: [1, 'estacao=primavera'], valentim_3: [3, 'fase=vindima|fimVindima'], valentim_4: [1, 'nenhuma'],
  marisa_1: [2, 'fase=vindima|fimVindima'], marisa_2: [1, 'fase=vindima|fimVindima'], marisa_3: [1, 'estacao=primavera'], marisa_4: [2, 'nenhuma'],
  henrique_1: [2, 'festa'], henrique_2: [3, 'garrafa'], henrique_3: [1, 'nenhuma'], henrique_4: [2, 'cave']
};
// Verdadeiro se o contexto cumpre a condição esperada da visita (independente do código).
function esperadoOk(id, c) {
  const e = ESPERADO[id][1];
  if (c.nivel < 4) return false;
  if (e === 'nenhuma') return true;
  if (e.indexOf('estacao=') === 0) return c.estacao === e.slice(8);
  if (e.indexOf('fase=') === 0) return e.slice(5).split('|').indexOf(c.fase) !== -1;
  if (e === 'festa') return c.festaAtiva === true;
  if (e === 'garrafa') return typeof c.garrafaDias === 'number' && c.garrafaDias >= 1;
  if (e === 'cave') return c.caveAberta === true;
  return false;
}

// ----- Dados -----
{
  ok(PERSONAGENS.length === 3 && PERSONAGENS.map(function (p) { return p.id; }).join() === 'valentim,marisa,henrique', 'devia haver 3 personagens: valentim, marisa, henrique');
  PERSONAGENS.forEach(function (p) {
    ['pt', 'en', 'es'].forEach(function (l) {
      ok(p.nome && typeof p.nome[l] === 'string' && p.nome[l].trim() !== '', p.id + ': nome ' + l + ' em falta');
      ok(p.papel && typeof p.papel[l] === 'string' && p.papel[l].trim() !== '', p.id + ': papel ' + l + ' em falta');
    });
  });
  ok(VISITAS.length === 12, 'devia haver 12 visitas, há ' + VISITAS.length);
  const ids = VISITAS.map(function (v) { return v.id; });
  ok(new Set(ids).size === ids.length, 'ids repetidos');
  ok(ids.slice().sort().join() === Object.keys(ESPERADO).sort().join(), 'ids fora do padrão: ' + ids);
  PERSONAGENS.forEach(function (p) {
    ok(VISITAS.filter(function (v) { return v.personagem === p.id; }).length === 4, p.id + ': devia ter 4 visitas');
  });
  VISITAS.forEach(function (v) {
    ok(PERSONAGENS.some(function (p) { return p.id === v.personagem; }), v.id + ': personagem desconhecida');
    ok(v.id.indexOf(v.personagem + '_') === 0, v.id + ': o id devia começar pela personagem');
    ok(Number.isInteger(v.reputacao) && v.reputacao >= 1 && v.reputacao <= 3, v.id + ': reputação devia ser 1 a 3');
    ok(ESPERADO[v.id] && v.reputacao === ESPERADO[v.id][0], v.id + ': reputação diferente da decidida');
    ['pt', 'en', 'es'].forEach(function (l) { ok(typeof v.texto[l] === 'string' && v.texto[l].trim() !== '', v.id + ' (' + l + '): texto em falta ou vazio'); });
    ok(Object.keys(v).sort().join() === ['condicao', 'id', 'personagem', 'reputacao', 'texto'].sort().join(), v.id + ': campos inesperados: ' + Object.keys(v));
  });
  const porEscrever = [];
  VISITAS.forEach(function (v) { ['pt', 'en', 'es'].forEach(function (l) { if (String(v.texto[l]).indexOf('[por escrever]') !== -1) porEscrever.push(v.id + '/' + l); }); });
  if (FINAL) ok(porEscrever.length === 0, '--final: ainda há ' + porEscrever.length + ' textos "[por escrever]" (ex.: ' + porEscrever.slice(0, 3).join(', ') + ')');
  else console.log('(modo normal: ' + porEscrever.length + ' de ' + VISITAS.length * 3 + ' textos ainda "[por escrever]")');
}

// ----- Contextos: estações e fases reais (como em js/estacoes.js), festa, Cave, garrafa -----
const MESES = [
  ['inverno', 'repouso'], ['inverno', 'repouso'], ['primavera', 'choro'], ['primavera', 'rebentacao'], ['primavera', 'floracao'], ['verao', 'vingamento'],
  ['verao', 'pintor'], ['verao', 'pintor'], ['outono', 'vindima'], ['outono', 'fimVindima'], ['outono', 'quedaFolha'], ['inverno', 'repouso']
];
const CONTEXTOS = [];
[4, 5, 6].forEach(function (nivel) {
  MESES.forEach(function (m) {
    [false, true].forEach(function (festaAtiva) {
      [false, true].forEach(function (caveAberta) {
        [null, 1, 3].forEach(function (garrafaDias) {
          CONTEXTOS.push({ nivel: nivel, estacao: m[0], fase: m[1], festaAtiva: festaAtiva, caveAberta: caveAberta, garrafaDias: garrafaDias });
        });
      });
    });
  });
});

// ----- Abaixo do nível 4 nunca há visita -----
{
  [1, 2, 3, 0, -1, undefined, null].forEach(function (nivel) {
    CONTEXTOS.slice(0, 40).forEach(function (c) {
      const c2 = Object.assign({}, c, { nivel: nivel });
      VISITAS.forEach(function (v) { ok(condOk(v, c2) === false, v.id + ' devia ser falso com nível ' + nivel); });
      for (let n = 0; n < 30; n++) ok(escolher([], c2, dia(n)).visita === null, 'nível ' + nivel + ' nunca devia ter visita (' + dia(n) + ')');
    });
  });
  ok(condOk(VISITAS.filter(function (v) { return v.id === 'valentim_4'; })[0], { nivel: 4 }) === true, 'no nível 4 a visita sem condição devia ser possível');
  ok(escolher([], null, dia(1)).visita === null && escolher([], undefined, dia(1)).visita === null, 'sem contexto não há visita');
}

// ----- visitaCondicaoOk bate com as condições decididas, em todos os contextos -----
{
  CONTEXTOS.forEach(function (c) {
    VISITAS.forEach(function (v) { ok(condOk(v, c) === esperadoOk(v.id, c), v.id + ': condição errada em ' + JSON.stringify(c)); });
  });
}

// ----- 60 dias x contexto: respeita as condições, no máximo 1 por dia, estável -----
{
  CONTEXTOS.forEach(function (c) {
    for (let n = 0; n < 60; n++) {
      const r = escolher([], c, dia(n));
      ok(Object.keys(r).join() === 'visita', 'o resultado devia ter só { visita }');
      const r2 = escolher([], c, dia(n));
      const r3 = escolher({}, c, dia(n));
      ok(r.visita === r2.visita && r.visita === r3.visita, 'escolha instável em ' + dia(n));
      if (r.visita) {
        ok(esperadoOk(r.visita.id, c), r.visita.id + ' fora do contexto ' + JSON.stringify(c) + ' em ' + dia(n));
        ok(r.visita.reputacao >= 1 && r.visita.reputacao <= 3, r.visita.id + ': reputação fora de 1 a 3');
      }
    }
  });
  // De vindima em janeiro e festa sem festa: nunca.
  const jan = { nivel: 5, estacao: 'inverno', fase: 'repouso', festaAtiva: false, caveAberta: true, garrafaDias: null };
  for (let n = 0; n < 200; n++) {
    const v = escolher([], jan, dia(n)).visita;
    ok(!v || ['valentim_1', 'valentim_4', 'marisa_4', 'henrique_3', 'henrique_4'].indexOf(v.id) !== -1, 'em janeiro só podia sair uma das possíveis, saiu ' + (v && v.id));
  }
}

// ----- Preferência pelas com condição; sem repetir até esgotar; ciclo -----
{
  // Inverno, sem festa, sem Cave, sem garrafa: com condição só valentim_1; sem condição: valentim_4, marisa_4, henrique_3.
  const inv = { nivel: 4, estacao: 'inverno', fase: 'repouso', festaAtiva: false, caveAberta: false, garrafaDias: null };
  for (let n = 0; n < 120; n++) {
    const v = escolher([], inv, dia(n)).visita;
    ok(!v || v.id === 'valentim_1', 'com uma visita com condição possível devia preferir-se essa, saiu ' + (v && v.id));
  }
  // Sem a de condição já feita: passam as sem condição.
  const vistos = {};
  for (let n = 0; n < 200; n++) { const v = escolher(['valentim_1'], inv, dia(n)).visita; if (v) vistos[v.id] = 1; }
  ok(Object.keys(vistos).sort().join() === 'henrique_3,marisa_4,valentim_4', 'feita a de condição, deviam sair as sem condição: ' + Object.keys(vistos));

  // Sem repetir até esgotar as possíveis (contexto com 5 possíveis: 2 com condição, 3 sem), depois ciclo.
  const ctxM = { nivel: 4, estacao: 'inverno', fase: 'repouso', festaAtiva: true, caveAberta: false, garrafaDias: null };
  const possiveis = VISITAS.filter(function (v) { return esperadoOk(v.id, ctxM); }).map(function (v) { return v.id; });
  ok(possiveis.length === 5, 'o contexto de teste devia ter 5 possíveis, tem ' + possiveis.length);
  const feitas = [];
  let n = 0;
  while (feitas.length < possiveis.length && n < 400) {
    const v = escolher(feitas, ctxM, dia(n++)).visita;
    if (!v) continue;
    ok(feitas.indexOf(v.id) === -1, 'repetiu ' + v.id + ' antes de esgotar as possíveis (' + feitas + ')');
    feitas.push(v.id);
  }
  ok(feitas.length === possiveis.length && new Set(feitas).size === possiveis.length, 'devia ter dado as ' + possiveis.length + ' possíveis distintas: ' + feitas);
  // As com condição saem antes das sem condição.
  const comCond = feitas.slice(0, 2).sort().join();
  ok(comCond === 'henrique_1,valentim_1', 'as com condição (festa, inverno) deviam sair primeiro: ' + feitas);
  // Esgotadas: volta a oferecer as possíveis (ciclo), nunca fora do contexto.
  let ciclo = 0;
  for (let k = 0; k < 120; k++) {
    const v = escolher(feitas, ctxM, dia(k)).visita;
    if (v) { ciclo++; ok(possiveis.indexOf(v.id) !== -1, 'o ciclo ofereceu fora do contexto: ' + v.id); }
  }
  ok(ciclo > 60, 'esgotadas as possíveis devia haver ciclo em vez de nada (' + ciclo + '/120)');
  // Mapa do estado também serve como feitasIds.
  const mapa = { valentim_1: '2026-10-01', henrique_1: '2026-10-02' };
  for (let k = 0; k < 100; k++) { const v = escolher(mapa, ctxM, dia(k)).visita; ok(!v || (v.id !== 'valentim_1' && v.id !== 'henrique_1'), 'o mapa de feitas devia ser aceite'); }
}

// ----- Ciclo: tudo feito escolhe a feita há mais tempo, nunca a de ontem -----
{
  // Inverno, sem festa, Cave nem garrafa: possíveis valentim_1 (com condição) e os 3 sem condição.
  const inv = { nivel: 4, estacao: 'inverno', fase: 'repouso', festaAtiva: false, caveAberta: false, garrafaDias: null };
  const possiveis = ['valentim_1', 'valentim_4', 'marisa_4', 'henrique_3'];
  const datas = { valentim_1: '2026-01-04', valentim_4: '2026-01-01', marisa_4: '2026-01-03', henrique_3: '2026-01-02' };
  // A mais antiga é sempre a escolhida (o hash do dia só desempata), mesmo havendo uma só com condição.
  for (let n = 0; n < 60; n++) {
    const v = escolher(datas, inv, '2026-02-' + String(1 + n % 28).padStart(2, '0')).visita;
    ok(!v || v.id === 'valentim_4', 'tudo feito devia dar a feita há mais tempo (valentim_4), saiu ' + (v && v.id));
  }
  // 40 dias seguidos, atualizando as datas como o jogo (visitaFazerHoje): nunca igual à do dia anterior,
  // e todas as possíveis rodam.
  const feitas = Object.assign({}, datas);
  let anterior = null;
  const usadas = {};
  let comVisita = 0;
  for (let n = 0; n < 40; n++) {
    const d = '2026-03-' + String(1 + n % 28).padStart(2, '0');
    const dd = n < 28 ? d : '2026-04-' + String(n - 27).padStart(2, '0');
    const v = escolher(feitas, inv, dd).visita;
    if (!v) { anterior = null; continue; } // dia sem visita: nada muda
    comVisita++;
    ok(possiveis.indexOf(v.id) !== -1, 'o ciclo ofereceu fora do contexto: ' + v.id);
    ok(anterior === null || v.id !== anterior, 'repetiu a visita do dia anterior (' + v.id + ' em ' + dd + ')');
    feitas[v.id] = dd;
    usadas[v.id] = 1;
    anterior = v.id;
  }
  ok(comVisita >= 20, 'devia haver visitas na maioria dos dias (' + comVisita + '/40)');
  ok(Object.keys(usadas).length === possiveis.length, 'o ciclo devia rodar por todas as possíveis: ' + Object.keys(usadas));
  // Sem datas (lista de ids) também funciona e nunca sai fora das possíveis.
  for (let n = 0; n < 40; n++) { const v = escolher(possiveis, inv, dia(n)).visita; ok(!v || possiveis.indexOf(v.id) !== -1, 'lista sem datas: fora do contexto'); }
}

// ----- Proporção de dias sem visita perto de 1 em 4 -----
{
  const c = { nivel: 5, estacao: 'outono', fase: 'vindima', festaAtiva: true, caveAberta: true, garrafaDias: 2 };
  const N = 4000;
  let sem = 0;
  for (let n = 0; n < N; n++) {
    const d = '2027-' + String(1 + Math.floor(n / 28) % 12).padStart(2, '0') + '-' + String(1 + n % 28).padStart(2, '0') + '#' + n;
    if (escolher([], c, d).visita === null) sem++;
  }
  const p = sem / N;
  ok(Math.abs(p - 0.25) < 0.03, 'a proporção de dias sem visita devia rondar 25%: ' + p);
  // Em dias reais seguidos (um ano) também.
  let semAno = 0;
  for (let n = 0; n < 365; n++) {
    const d = new Date(Date.UTC(2026, 0, 1 + n)).toISOString().slice(0, 10);
    if (escolher([], c, d).visita === null) semAno++;
  }
  ok(semAno / 365 > 0.17 && semAno / 365 < 0.33, 'num ano devia rondar 1 em 4 dias sem visita: ' + semAno + '/365');
  // A decisão do dia não depende do que já foi feito.
  for (let n = 0; n < 60; n++) ok((escolher([], c, dia(n)).visita === null) === (escolher(['valentim_4', 'marisa_4'], c, dia(n)).visita === null), 'o dia sem visita não devia depender das feitas (' + dia(n) + ')');
}

console.log(falhas === 0 ? 'OK' : falhas + ' FALHA(S)');
process.exit(falhas === 0 ? 0 : 1);
