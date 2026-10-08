#!/usr/bin/env node
// Nível 7 "Quinta Estimada" (nível, história, capítulo 7 e conquistas; as regras das trocas existem mas só scripts as chamam):
// NIVEIS_CONFIG (js/niveis.js), cap7 (js/capitulos.js) e as conquistas "Quinta completa" e
// "Boa vizinhança" (js/conquistas.js). Corre state.js, niveis.js, capitulos.js, conquistas.js,
// estrada-dados.js e despensa.js REAIS num ambiente simulado (vm), sem browser nem conta real.
//
// Os textos nas 3 línguas e a história do nível 7 são verificados por scripts/verificar-niveis.js.
//
// Uso: node scripts/verificar-nivel7.js
// CAPITULOS_JS=caminho  corre sobre outra versão de js/capitulos.js (para provar que os testes apanham o critério antigo,
//   que só contava chaves e deixava um 4.º bem substituir o mel).
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const CAPITULOS_JS = process.env.CAPITULOS_JS || path.join(RAIZ, 'js', 'capitulos.js');
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
    document: { querySelectorAll: function () { return []; }, getElementById: function () { return null; }, querySelector: function () { return null; }, addEventListener: function () {} },
    setTimeout: function () { return 1; }, clearTimeout: function () {}, Image: function () {}, Date: Date
  };
  sb.window = sb;
  sb.Telegram = { WebApp: {} };
  const cx = vm.createContext(sb);
  vm.runInContext(fs.readFileSync(path.join(RAIZ, 'js', 'state.js'), 'utf8'), cx, { filename: 'state.js' });
  vm.runInContext(`
    function t(k) { return k; }
    var FALAS = [];
    function mostrarFalas(f, quem) { FALAS.push({ f: f, quem: quem }); }
    function vibrar() {} function tocarSom() {} function updateStatsDisplays() {}
    function localeAtual() { return 'pt-PT'; }
    var currentLang = 'pt';
  `, cx);
  ['niveis.js', 'capitulos.js', 'conquistas.js', 'estrada-dados.js', 'despensa.js'].forEach(function (f) {
    vm.runInContext(fs.readFileSync(f === 'capitulos.js' ? CAPITULOS_JS : path.join(RAIZ, 'js', f), 'utf8'), cx, { filename: f });
  });
  const g = { cx: cx, guardado: guardado };
  g.ev = function (c) { return vm.runInContext(c, cx); };
  g.conq = function (id) { return g.ev("CONQUISTAS_CONFIG.filter(function (c) { return c.id === '" + id + "'; })[0].cumprida()"); };
  return g;
}

const SEIS = { cap1: true, cap2: true, cap3: true, cap4: true, cap5: true, cap6: true };
const savePossuiNivel6 = function (extra) {
  return Object.assign({ reputacao: 700, ultimaGravacaoEm: 1, acesso: { jogadorAntigo: true, introMostrada: true }, niveis: { nivelMostrado: 6, garrafasAoNivel6: 0 },
    capitulos: { iniciado: true, celebradosMigrado: true, concluidos: Object.assign({}, SEIS), celebrados: Object.assign({}, SEIS) } }, extra || {});
};

// 1. Nível 7: limiar 1000, sem tranca de ecrã nova, o resto igual.
{
  const g = abrir();
  ok(g.ev('NIVEIS_CONFIG.length') === 7, 'devia haver 7 níveis');
  ok(JSON.stringify(g.ev('NIVEIS_CONFIG.map(function (n) { return n.min; })')) === '[0,15,50,120,300,600,1000]', 'limiares 0, 15, 50, 120, 300, 600, 1000');
  ok(g.ev('NIVEIS_CONFIG[6].nomeKey') === 'nivel.nome.7', 'nomeKey do nível 7');
  [[0, 1], [14, 1], [15, 2], [49, 2], [50, 3], [119, 3], [120, 4], [299, 4], [300, 5], [599, 5], [600, 6], [999, 6], [1000, 7], [5000, 7]].forEach(function (p) {
    ok(g.ev('nivelPelaReputacao(' + p[0] + ')') === p[1], 'Reputação ' + p[0] + ' devia dar nível ' + p[1]);
  });
  ok(JSON.stringify(g.ev('Object.keys(NIVEL_NECESSARIO_POR_ECRA).map(function (k) { return k + ":" + NIVEL_NECESSARIO_POR_ECRA[k]; })')) ===
    JSON.stringify(['proteger:2', 'garrafa:3', 'caderno:3', 'explorar:4', 'enciclopedia:4', 'festa:4', 'colecao:6', 'garrafas:6', 'estrada:7']), 'só a Estrada (nível 7) é tranca nova');
  ok(g.ev("typeof ecraDesbloqueado('estrada')") === 'boolean', 'ecraDesbloqueado("estrada") devia dar true ou false');
  ok(g.ev("state.acesso.jogadorAntigo = false; state.reputacao = 300; ecraDesbloqueado('estrada')") === false, 'a Estrada devia estar trancada no nível 5 (jogador novo)');
  ok(g.ev("state.reputacao = 999; ecraDesbloqueado('estrada')") === false, 'a Estrada devia estar trancada no nível 6 (jogador novo)');
  ok(g.ev("state.reputacao = 1000; ecraDesbloqueado('estrada')") === true, 'a Estrada devia abrir no nível 7');
  ok(g.ev("state.reputacao = 300; state.acesso.jogadorAntigo = true; ecraDesbloqueado('estrada')") === true, 'um jogador antigo devia ver a Estrada já no nível 5');
}

// 2. Capítulo 7: dado, critério (queijo, sal e mel em despensa.recebidos, pelos ids) e leitura sem estoirar.
{
  const g = abrir(savePossuiNivel6());
  ok(g.ev('CAPITULOS_CONFIG.length') === 7 && g.ev("CAPITULOS_CONFIG[6].id") === 'cap7' && g.ev('CAPITULOS_CONFIG[6].nivel') === 7, 'devia haver o cap7 no nível 7');
  ok(JSON.stringify(g.ev('CAPITULOS_CONFIG[6].criterio')) === JSON.stringify([{ tipo: 'temChaves', caminho: 'despensa.recebidos', chaves: ['queijo_azeitao', 'sal_sado', 'mel_sesimbra'] }]), 'critério do cap7');
  // Os ids do critério são os ids REAIS dos 3 bens de origem em ESTRADA_BENS.
  // (A Estrada tem 4 bens: o choco do Sado não faz parte do capítulo 7.)
  ok(JSON.stringify(g.ev('CAPITULOS_CONFIG[6].criterio[0].chaves')) === JSON.stringify(['queijo_azeitao', 'sal_sado', 'mel_sesimbra']) &&
    g.ev('CAPITULOS_CONFIG[6].criterio[0].chaves.every(function (k) { return ESTRADA_BENS.some(function (b) { return b.id === k; }); })') === true &&
    g.ev("ESTRADA_BENS.some(function (b) { return b.id === 'choco_sado'; }) && CAPITULOS_CONFIG[6].criterio[0].chaves.indexOf('choco_sado') === -1") === true, 'os ids do cap7 têm de ser os 3 bens de origem (queijo, sal e mel), todos em ESTRADA_BENS, sem o choco');
  const cap7 = "CAPITULOS_CONFIG[6]";
  const lido = function () { return JSON.parse(g.ev('JSON.stringify(capitulosLerCriterio(' + cap7 + '))')); };
  let r = lido();
  ok(r.atual === 0 && r.total === 3 && r.cumprido === false, 'despensa vazia: 0 / 3 por cumprir: ' + JSON.stringify(r));
  ok(g.ev('capituloEstaCumprido(' + cap7 + ')') === false, 'cap7 por cumprir com a despensa vazia');
  g.ev("despensaRegistarTroca(state, 'dona_amelia', 'queijo_azeitao', '2026-10-08')");
  r = lido(); ok(r.atual === 1 && r.cumprido === false, '1 bem: 1 / 3');
  g.ev("despensaRegistarTroca(state, 'sr_joaquim', 'sal_sado', '2026-10-08')");
  r = lido(); ok(r.atual === 2 && r.cumprido === false, '2 bens: 2 / 3');
  // Entregar tudo não tira o capítulo: recebidos nunca desce.
  g.ev("despensaRegistarEntrega(state, 'queijo_azeitao', 1)");
  r = lido(); ok(r.atual === 2, 'depois de entregar, os recebidos continuam');
  g.ev("despensaRegistarTroca(state, 'tomas', 'mel_sesimbra', '2026-10-08')");
  r = lido(); ok(r.atual === 3 && r.total === 3 && r.cumprido === true, '3 bens: 3 / 3 cumprido: ' + JSON.stringify(r));
  ok(g.ev('capituloEstaCumprido(' + cap7 + ')') === true, 'cap7 cumprido com os 3 bens recebidos');
  // Um 4.º bem NÃO substitui o mel (prova negativa; o bem de teste só existe em memória, neste teste).
  {
    const k = abrir(savePossuiNivel6());
    const lk = function () { return JSON.parse(k.ev('JSON.stringify(capitulosLerCriterio(CAPITULOS_CONFIG[6]))')); };
    k.ev("state.despensa.recebidos = { queijo_azeitao: 1, sal_sado: 1, bem_teste: 1 }");
    let x = lk(); ok(x.atual === 2 && x.total === 3 && x.cumprido === false, 'queijo + sal + 4.º bem: NÃO cumpre (2 / 3): ' + JSON.stringify(x));
    ok(k.ev('capituloEstaCumprido(CAPITULOS_CONFIG[6])') === false, 'cap7 por cumprir com queijo, sal e um 4.º bem');
    k.ev("state.despensa.recebidos = { queijo_azeitao: 1, sal_sado: 1, bem_teste: 1, outro_teste: 1, mel_sesimbra: 1 }");
    x = lk(); ok(x.atual === 3 && x.cumprido === true, 'queijo + sal + mel (com outros bens de teste) cumpre: ' + JSON.stringify(x));
    k.ev("state.despensa.recebidos = { queijo_azeitao: 1, sal_sado: 1, mel_sesimbra: 0 }");
    x = lk(); ok(x.atual === 2 && x.cumprido === false, 'uma chave com valor 0 não conta: ' + JSON.stringify(x));
    k.ev("state.despensa.recebidos = { queijo_azeitao: 1, sal_sado: 1, mel_sesimbra: '1' }");
    x = lk(); ok(x.atual === 2 && x.cumprido === false, 'uma chave com valor que não é número não conta: ' + JSON.stringify(x));
    k.ev("state.despensa.recebidos = { queijo_azeitao: 1, sal_sado: 1, mel_sesimbra: -1 }");
    x = lk(); ok(x.atual === 2, 'uma chave com valor negativo não conta');
    // Lista de chaves vazia ou inválida nunca se cumpre.
    ['[]', 'undefined', '"x"'].forEach(function (l) {
      const r = JSON.parse(k.ev("JSON.stringify(capitulosLerAlternativa({ tipo: 'temChaves', caminho: 'despensa.recebidos', chaves: " + l + " }))"));
      ok(r.cumprido === false, 'temChaves com chaves ' + l + ' nunca devia cumprir: ' + JSON.stringify(r));
    });
    // Quem já concluiu o cap7 não perde nada (concluidos é permanente), mesmo com a despensa vazia ou com outro critério.
    const c = abrir(savePossuiNivel6({ capitulos: { iniciado: true, celebradosMigrado: true, concluidos: Object.assign({ cap7: true }, SEIS), celebrados: Object.assign({ cap7: true }, SEIS) } }));
    ok(c.ev('state.despensa.recebidos && Object.keys(state.despensa.recebidos).length') === 0, 'premissa: despensa vazia');
    ok(c.ev('capituloEstaCumprido(CAPITULOS_CONFIG[6])') === true, 'cap7 já concluído continua cumprido com a despensa vazia');
    c.ev('capitulosAvaliarEmSilencio()');
    ok(c.ev('state.capitulos.concluidos.cap7') === true && c.conq('boa_vizinhanca') === true, 'cap7 concluído e "Boa vizinhança" continuam depois da avaliação');
  }
  // Estados estranhos: sem despensa, despensa null, recebidos com tipo errado: nunca rebenta.
  [undefined, null, 5, { recebidos: null }, { recebidos: [] }, { recebidos: 'x' }].forEach(function (d) {
    const h = abrir(savePossuiNivel6());
    h.ev('state.despensa = ' + (d === undefined ? 'undefined' : JSON.stringify(d)));
    let x; try { x = JSON.parse(h.ev('JSON.stringify(capitulosLerCriterio(CAPITULOS_CONFIG[6]))')); h.ev('atualizarCapituloQuinta()'); } catch (e) { x = 'ERRO ' + e.message; }
    ok(x && x.atual === 0 && x.total === 3 && x.cumprido === false, 'despensa ' + JSON.stringify(d) + ' devia dar 0 / 3 sem rebentar: ' + JSON.stringify(x));
  });
}

// 2b. Capítulo 7 com as trocas a sério (despensaTrocar, PR 5A): 3 bens diferentes cumprem; 3 trocas ao mesmo vizinho não.
{
  const g = abrir(savePossuiNivel6({ uvas: 1000 }));
  const lido = function () { return JSON.parse(g.ev('JSON.stringify(capitulosLerCriterio(CAPITULOS_CONFIG[6]))')); };
  ['2026-10-08', '2026-10-09', '2026-10-10'].forEach(function (d) { g.ev("despensaTrocar(state, 'dona_amelia', '" + d + "')"); });
  ok(g.ev('state.despensa.recebidos.queijo_azeitao') === 3 && lido().atual === 1 && lido().cumprido === false, '3 trocas ao mesmo vizinho dão 1 bem: o cap7 não se cumpre');
  g.ev("despensaTrocar(state, 'sr_joaquim', '2026-10-10')");
  ok(lido().atual === 2 && lido().cumprido === false, '2 bens: 2 / 3');
  g.ev("despensaTrocar(state, 'tomas', '2026-10-10')");
  ok(lido().atual === 3 && lido().cumprido === true, '3 bens diferentes cumprem o cap7');
}

// 3. O capítulo 7 nunca trava a subida de nível (os níveis só dependem da Reputação).
{
  const g = abrir(savePossuiNivel6({ reputacao: 1000, niveis: { nivelMostrado: 6, garrafasAoNivel6: 0 } }));
  ok(g.ev('nivelPelaReputacao(state.reputacao)') === 7, 'com 1000 de Reputação e o cap7 por fazer devia ser nível 7');
  const h = abrir(savePossuiNivel6());
  h.ev('state.capitulos.concluidos.cap7 = true');
  ok(h.ev('nivelPelaReputacao(state.reputacao)') === 6, 'o cap7 concluído não sobe o nível sozinho');
  // Celebração do cap7 (balão do YoshiCat) só quando o critério se cumpre.
  const c = abrir(savePossuiNivel6({ reputacao: 1000 }));
  ok(c.ev('capitulosAvaliarCelebracao()') === false, 'sem o critério não há celebração do cap7');
  c.ev("despensaRegistarTroca(state, 'dona_amelia', 'queijo_azeitao', '2026-10-08'); despensaRegistarTroca(state, 'sr_joaquim', 'sal_sado', '2026-10-08'); despensaRegistarTroca(state, 'tomas', 'mel_sesimbra', '2026-10-08');");
  ok(c.ev('capitulosAvaliarCelebracao()') === true, 'com os 3 bens devia celebrar o cap7');
  ok(c.ev("FALAS[0].f[0]") === 'capitulo.cap7.conclusao', 'a celebração devia mostrar a conclusão do cap7');
  ok(c.ev('FALAS[0].quem') === 'YoshiCat', 'o cap7 fala o YoshiCat');
}

// 4. Conquistas: "Quinta completa" não se perde; "Boa vizinhança" liga ao cap7; total 14.
{
  const g = abrir(savePossuiNivel6());
  ok(g.ev('CONQUISTAS_CONFIG.length') === 14, 'devia haver 14 conquistas, há ' + g.ev('CONQUISTAS_CONFIG.length'));
  // Premissa: com a regra antiga (comparar com CAPITULOS_CONFIG.length = 7) quem tinha os 6 perdia-a.
  ok(g.ev('conquistasCapitulosConcluidos() >= CAPITULOS_CONFIG.length') === false, 'premissa: a regra antiga perderia a "Quinta completa" com 7 capítulos');
  ok(g.conq('quinta_completa') === true, '"Quinta completa" devia continuar cumprida com os 6 capítulos feitos e o 7 por fazer');
  ok(g.conq('boa_vizinhanca') === false, '"Boa vizinhança" devia estar por cumprir');
  const antes = g.ev('conquistasCumpridas()');
  // Cap7 concluído: cumpre a "Boa vizinhança".
  g.ev('state.capitulos.concluidos.cap7 = true');
  ok(g.conq('boa_vizinhanca') === true, '"Boa vizinhança" devia cumprir-se com o cap7 concluído');
  ok(g.conq('quinta_completa') === true, '"Quinta completa" continua cumprida');
  ok(g.ev('conquistasCumpridas()') === antes + 1, 'o n / total devia subir 1');
  ok(/ \/ 14$/.test(g.ev('conquistasResumo()')), 'o resumo devia terminar em "/ 14": ' + g.ev('conquistasResumo()'));
  // Só 5 dos 6 antigos: não cumpre; o cap7 sozinho não substitui um dos antigos.
  const h = abrir(savePossuiNivel6());
  h.ev('delete state.capitulos.concluidos.cap6; state.capitulos.concluidos.cap7 = true');
  ok(h.conq('quinta_completa') === false, 'com o cap6 em falta (e o cap7 feito) a "Quinta completa" não devia cumprir-se');
  // Sem capítulos concluídos: nada cumprido; sem state.capitulos: não rebenta.
  const n = abrir();
  ok(n.conq('quinta_completa') === false && n.conq('boa_vizinhanca') === false, 'jogo novo: nada cumprido');
  n.ev('state.capitulos = null');
  let x; try { x = [n.conq('quinta_completa'), n.conq('boa_vizinhanca')]; } catch (e) { x = 'ERRO ' + e.message; }
  ok(JSON.stringify(x) === '[false,false]', 'sem state.capitulos não devia rebentar: ' + JSON.stringify(x));
  // "Meio caminho" e "Casa do Moscatel" ficam como estavam.
  ok(g.conq('meio_caminho') === true && g.conq('casa_do_moscatel') === true, '"Meio caminho" e "Casa do Moscatel" ficam iguais');
}

console.log(falhas === 0 ? 'OK' : falhas + ' FALHA(S)');
process.exit(falhas === 0 ? 0 : 1);
