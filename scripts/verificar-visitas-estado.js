#!/usr/bin/env node
// Estado e pagamento das Visitas (PR 2): state.visitas em js/state.js e visitaContextoAtual,
// visitaEmModoTeste, visitaDeHoje, visitaFazerHoje em js/visitas.js. Corre o state.js, o
// niveis.js e o visitas.js REAIS num ambiente simulado (vm), sem browser nem conta real.
//
// Uso: node scripts/verificar-visitas-estado.js
// VISITAS_JS=caminho  corre sobre outra versão de js/visitas.js (para provar que os testes
//   apanham a falta do pagamento único ou do modo de teste).
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const VISITAS_JS = process.env.VISITAS_JS || path.join(RAIZ, 'js', 'visitas.js');
let falhas = 0;
function ok(cond, msg) { if (!cond) { falhas++; console.log('FALHA: ' + msg); } }

// Jogo simulado. o.guardado = JSON de um save antigo (ou null); o.leituras = valores das leituras.
function abrir(o) {
  o = o || {};
  const guardado = {};
  if (o.guardado) guardado.yoshicat_quinta_state_v2 = JSON.stringify(o.guardado);
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
    setTimeout: function () {}, Image: function () {}, Date: Date,
    DIA: '2026-10-05',
    LEITURAS: Object.assign({ estacao: 'inverno', fase: 'repouso', festa: true, cave: true, garrafa: 2 }, o.leituras || {})
  };
  sb.window = sb;
  sb.Telegram = { WebApp: {} };
  const cx = vm.createContext(sb);
  require('./_regras-tempo').injetarRegrasTempo(cx);
  ['state.js', 'niveis.js'].forEach(function (f) { vm.runInContext(fs.readFileSync(path.join(RAIZ, 'js', f), 'utf8'), cx, { filename: f }); });
  vm.runInContext(`
    var SAVES = 0, MODO = null;
    var _saveReal = saveState;
    saveState = function (s) { SAVES++; return _saveReal(s); };
    function diaLisboaDeHoje() { return DIA; }
    function estacaoAtual() { if (LEITURAS.estacao === 'ERRO') throw new Error('x'); return LEITURAS.estacao; }
    function faseRealAtual() { if (LEITURAS.fase === 'ERRO') throw new Error('x'); return LEITURAS.fase; }
    function festaAtual() { if (LEITURAS.festa === 'ERRO') throw new Error('x'); return LEITURAS.festa ? { id: 'saomartinho' } : null; }
    function caveReservaAberta() { if (LEITURAS.cave === 'ERRO') throw new Error('x'); return LEITURAS.cave; }
    function garrafaQueMaisDescansou() { if (LEITURAS.garrafa === 'ERRO') throw new Error('x'); return LEITURAS.garrafa; }
  `, cx);
  vm.runInContext(fs.readFileSync(VISITAS_JS, 'utf8'), cx, { filename: 'visitas.js' });
  const g = { cx: cx, guardado: guardado };
  g.ev = function (c) { return vm.runInContext(c, cx); };
  g.json = function (excluir) {
    const s = JSON.parse(JSON.stringify(g.ev('state')));
    (excluir || []).forEach(function (k) { delete s[k]; });
    return JSON.stringify(s);
  };
  g.dia = function (d) { sb.DIA = d; };
  g.pesquisa = function (q) { sb.location.search = q; };
  g.leituras = function (l) { Object.assign(sb.LEITURAS, l); };
  g.rep = function (n) { g.ev('state.reputacao = ' + n); };
  return g;
}
const REP_NIVEL_4 = 120; // NIVEIS_CONFIG: o nível 4 começa em 120 de Reputação

// 1. state.visitas: valor por omissão e contas antigas.
{
  const g = abrir();
  ok(JSON.stringify(g.ev('defaultState().visitas')) === '{"feitas":{},"hoje":null}', 'defaultState devia ter visitas = { feitas: {}, hoje: null }');
  // Conta antiga (sem visitas) carrega e funciona.
  const antiga = JSON.parse(g.json(['visitas']));
  antiga.reputacao = 150; antiga.ultimaGravacaoEm = 1;
  const a = abrir({ guardado: antiga });
  ok(JSON.stringify(a.ev('state.visitas')) === '{"feitas":{},"hoje":null}', 'conta antiga devia ficar com state.visitas por omissão (mergeDeep)');
  ok(a.ev('state.reputacao') === 150, 'a conta antiga devia manter a Reputação');
  ok(a.ev('visitaDeHoje().visita') !== null, 'a conta antiga devia poder ter visita (nível >= 4)');
  // Save com visitas gravado: mantém-se tal e qual.
  const comVisitas = JSON.parse(JSON.stringify(antiga));
  comVisitas.visitas = { feitas: { valentim_4: '2026-10-01' }, hoje: { dia: '2026-10-04', id: 'valentim_4', feita: true } };
  const b = abrir({ guardado: comVisitas });
  ok(JSON.stringify(b.ev('state.visitas')) === JSON.stringify(comVisitas.visitas), 'um save com visitas devia carregar igual');
  // Como a nuvem adota o estado (mergeDeep(defaultState(), estadoNuvem)): sem campo -> omissão; null/estranho -> reparado, sem rebentar.
  ok(JSON.stringify(b.ev('mergeDeep(defaultState(), { reputacao: 5 }).visitas')) === '{"feitas":{},"hoje":null}', 'estado da nuvem sem visitas devia ficar com omissão');
  const c = abrir({ guardado: Object.assign({}, antiga, { visitas: null }) });
  ok(c.ev('state.visitas') === null, 'premissa: um valor null guardado passa pelo mergeDeep');
  let r; try { r = c.ev('visitaDeHoje()'); } catch (e) { r = 'ERRO ' + e.message; }
  ok(r && r !== null && typeof r === 'object' && r.visita, 'state.visitas null devia ser reparado em vez de rebentar: ' + JSON.stringify(r));
  ok(c.ev('state.visitas.hoje.id') === r.visita.id, 'depois de reparado devia guardar a visita de hoje');
  const d = abrir({ guardado: Object.assign({}, antiga, { visitas: { feitas: [], hoje: 'x' } }) });
  ok(d.ev('visitaDeHoje().visita') !== null && d.ev('Array.isArray(state.visitas.feitas)') === false && d.ev('typeof state.visitas.hoje') === 'object', 'feitas/hoje com tipo errado deviam ser reparados');
}

// 2. Contexto atual: leituras e falhas isoladas.
{
  const g = abrir(); g.rep(REP_NIVEL_4);
  ok(JSON.stringify(g.ev('visitaContextoAtual()')) === JSON.stringify({ nivel: 4, estacao: 'inverno', fase: 'repouso', festaAtiva: true, caveAberta: true, garrafaDias: 2 }), 'contexto errado: ' + JSON.stringify(g.ev('visitaContextoAtual()')));
  g.leituras({ festa: false, cave: false, garrafa: null, estacao: 'primavera', fase: 'choro' });
  ok(JSON.stringify(g.ev('visitaContextoAtual()')) === JSON.stringify({ nivel: 4, estacao: 'primavera', fase: 'choro', festaAtiva: false, caveAberta: false, garrafaDias: null }), 'contexto sem festa/cave/garrafa errado');
  g.leituras({ estacao: 'ERRO', fase: 'ERRO', festa: 'ERRO', cave: 'ERRO', garrafa: 'ERRO' });
  let c; try { c = g.ev('visitaContextoAtual()'); } catch (e) { c = 'ERRO'; }
  ok(c && c.estacao === null && c.fase === null && c.festaAtiva === false && c.caveAberta === false && c.garrafaDias === null && c.nivel === 4, 'leituras que falham deviam dar nulo/falso sem rebentar: ' + JSON.stringify(c));
  ok(g.ev('(function(){ var s = state; state = undefined; try { return visitaContextoAtual().nivel; } finally { state = s; } })()') === null, 'sem state o nível devia ficar nulo');
}

// 3. Modo de teste: qualquer parâmetro conhecido.
{
  const g = abrir();
  ['estacao', 'festa', 'dia', 'dias', 'pista', 'tempo', 'pedido', 'capitulo', 'falante', 'garrafaescura', 'nuvem', 'demora', 'convites', 'visita'].forEach(function (p) {
    g.pesquisa('?' + p + '=x'); ok(g.ev('visitaEmModoTeste()') === true, '?' + p + '= devia ser modo de teste');
  });
  g.pesquisa('?a=1&estacao=inverno'); ok(g.ev('visitaEmModoTeste()') === true, 'parâmetro de teste junto de outros');
  ['', '?x=1', '?utm_source=a', '?estacaoX=1'].forEach(function (q) { g.pesquisa(q); ok(g.ev('visitaEmModoTeste()') === false, '"' + q + '" não devia ser modo de teste'); });
}

// 4. Nível < 4 nunca guarda visita; dia a dia; estabilidade; pagamento único; modo de teste.
{
  const g = abrir(); g.rep(REP_NIVEL_4 - 1);
  ok(g.ev('nivelPelaReputacao(state.reputacao)') === 3, 'premissa: ' + (REP_NIVEL_4 - 1) + ' de Reputação é nível 3');
  for (let n = 1; n <= 40; n++) {
    g.dia('2026-11-' + String(n % 28 + 1).padStart(2, '0'));
    ok(g.ev('visitaDeHoje().visita') === null && g.ev('visitaFazerHoje().ok') === false, 'nível < 4 nunca devia ter visita nem pagar');
  }
  ok(g.ev('SAVES') === 0 && g.ev('state.visitas.hoje') === null && g.ev('state.reputacao') === REP_NIVEL_4 - 1, 'nível < 4 não devia gravar nada');
}
{
  // Dia que tem visita (1 em 4 não tem): procura-se um.
  const g = abrir(); g.rep(REP_NIVEL_4);
  const dias = []; for (let n = 1; n <= 28; n++) dias.push('2026-10-' + String(n).padStart(2, '0'));
  const comVisita = dias.filter(function (d) { g.dia(d); g.ev('state.visitas.hoje = null'); return g.ev('escolherVisitaDoDia({}, visitaContextoAtual(), DIA).visita') !== null; });
  ok(comVisita.length >= 15, 'devia haver dias com visita');
  g.ev('SAVES = 0; state.visitas = { feitas: {}, hoje: null }');

  // O dia muda e a visita de hoje repõe-se.
  g.dia(comVisita[0]);
  const v1 = g.ev('visitaDeHoje()');
  ok(v1.visita && v1.feita === false, 'devia dar a visita de hoje, por fazer');
  ok(g.ev('state.visitas.hoje.dia') === comVisita[0] && g.ev('state.visitas.hoje.id') === v1.visita.id && g.ev('state.visitas.hoje.feita') === false, 'devia guardar hoje = { dia, id, feita: false }');
  ok(g.ev('SAVES') === 1, 'guardar a visita de hoje devia fazer 1 saveState, fez ' + g.ev('SAVES'));
  g.ev('visitaDeHoje()'); ok(g.ev('SAVES') === 1, 'voltar a perguntar não devia gravar de novo');
  // A visita de hoje não muda se o contexto mudar a meio do dia.
  g.leituras({ estacao: 'verao', fase: 'pintor', festa: false, cave: false, garrafa: null });
  ok(g.ev('visitaDeHoje().visita.id') === v1.visita.id, 'a visita de hoje não devia mudar com o contexto');
  g.leituras({ estacao: 'inverno', fase: 'repouso', festa: true, cave: true, garrafa: 2 });
  // Pagamento: UMA vez (toque duplo) e exatamente reputacao.
  const antes = g.json(['visitas', 'reputacao', 'ultimaGravacaoEm']);
  const rep0 = g.ev('state.reputacao'); g.ev('SAVES = 0');
  const f1 = g.ev('visitaFazerHoje()'), f2 = g.ev('visitaFazerHoje()');
  ok(f1.ok === true && f1.visita.id === v1.visita.id && f2.ok === false, 'a 1.ª devia pagar e a 2.ª (toque duplo) não: ' + JSON.stringify([f1.ok, f2.ok]));
  ok(g.ev('state.reputacao') === rep0 + v1.visita.reputacao, 'a Reputação devia subir exatamente ' + v1.visita.reputacao + ', subiu ' + (g.ev('state.reputacao') - rep0));
  ok(g.ev('SAVES') === 1, 'o pagamento devia fazer UM só saveState, fez ' + g.ev('SAVES'));
  ok(g.ev('state.visitas.hoje.feita') === true && g.ev('state.visitas.feitas["' + v1.visita.id + '"]') === comVisita[0], 'devia marcar feita e registar a data em feitas');
  ok(g.ev('visitaDeHoje().feita') === true, 'visitaDeHoje devia dizer feita');
  ok(g.json(['visitas', 'reputacao', 'ultimaGravacaoEm']) === antes, 'o resto do estado devia ficar igual (excluindo visitas, reputacao e o carimbo ultimaGravacaoEm de saveState)');
  ok(JSON.parse(g.guardado.yoshicat_quinta_state_v2).visitas.hoje.feita === true, 'devia ficar gravado no localStorage');
  // Outro dia: repõe-se.
  g.dia(comVisita[1]); g.ev('SAVES = 0');
  const v2 = g.ev('visitaDeHoje()');
  ok(v2.visita && v2.feita === false && g.ev('state.visitas.hoje.dia') === comVisita[1], 'noutro dia devia repor-se a visita de hoje');
  ok(v2.visita.id !== v1.visita.id, 'não devia repetir a visita já feita enquanto há outras possíveis');
}

// 5. Modo de teste: calcula e devolve, mas não grava nem paga.
{
  const g = abrir(); g.rep(REP_NIVEL_4);
  let n = 0, v;
  while (n < 28) { g.dia('2026-10-' + String(++n).padStart(2, '0')); g.pesquisa('?estacao=inverno'); v = g.ev('visitaDeHoje()'); if (v.visita) break; }
  ok(v.visita, 'em modo de teste devia devolver a visita');
  ok(g.ev('SAVES') === 0 && g.ev('state.visitas.hoje') === null, 'em modo de teste não devia gravar');
  const rep0 = g.ev('state.reputacao');
  const f = g.ev('visitaFazerHoje()');
  ok(f.ok === false && g.ev('state.reputacao') === rep0 && g.ev('SAVES') === 0 && Object.keys(g.ev('state.visitas.feitas')).length === 0, 'em modo de teste não devia pagar nem gravar');
  // Com a visita já guardada (dia normal), o modo de teste também não paga.
  g.pesquisa(''); g.ev('visitaDeHoje()'); g.pesquisa('?visita=1'); g.ev('SAVES = 0');
  ok(g.ev('visitaFazerHoje().ok') === false && g.ev('state.reputacao') === rep0 && g.ev('SAVES') === 0, 'visita guardada + modo de teste: sem pagar');
}

// 6. Sem repetir até esgotar as possíveis; ciclo depois; a Reputação só sobe.
{
  const g = abrir(); g.rep(REP_NIVEL_4);
  const possiveis = g.ev("VISITAS.filter(function (v) { return visitaCondicaoOk(v, visitaContextoAtual()); }).map(function (v) { return v.id; })");
  ok(possiveis.length === 7, 'o contexto devia ter 7 possíveis, tem ' + possiveis.length);
  const feitas = []; let ultimaRep = g.ev('state.reputacao'), soma = 0;
  for (let n = 0; n < 200 && feitas.length < possiveis.length; n++) {
    g.dia(new Date(Date.UTC(2026, 9, 1 + n)).toISOString().slice(0, 10));
    const r = g.ev('visitaFazerHoje()');
    if (!r.ok) continue;
    ok(feitas.indexOf(r.visita.id) === -1, 'repetiu ' + r.visita.id + ' antes de esgotar: ' + feitas);
    feitas.push(r.visita.id); soma += r.visita.reputacao;
    ok(g.ev('state.reputacao') >= ultimaRep, 'a Reputação só devia subir'); ultimaRep = g.ev('state.reputacao');
  }
  ok(new Set(feitas).size === possiveis.length, 'devia ter feito as ' + possiveis.length + ' possíveis distintas: ' + feitas);
  ok(g.ev('state.reputacao') === REP_NIVEL_4 + soma, 'a Reputação devia ser a inicial + a soma das visitas');
  // Esgotadas: o ciclo volta a oferecer (e a pagar), sempre dentro do contexto.
  let ciclo = 0;
  for (let n = 300; n < 340; n++) {
    g.dia(new Date(Date.UTC(2026, 9, 1 + n)).toISOString().slice(0, 10));
    const r = g.ev('visitaFazerHoje()');
    if (r.ok) { ciclo++; ok(possiveis.indexOf(r.visita.id) !== -1, 'o ciclo ofereceu fora do contexto'); }
  }
  ok(ciclo > 15, 'esgotadas as possíveis devia haver ciclo (' + ciclo + '/40)');
}

console.log(falhas === 0 ? 'OK' : falhas + ' FALHA(S)');
process.exit(falhas === 0 ? 0 : 1);
