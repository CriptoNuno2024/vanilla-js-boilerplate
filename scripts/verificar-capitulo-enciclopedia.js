#!/usr/bin/env node
// Ligar um capítulo à Enciclopédia (PR 6 da pasta de dados): o critério de capítulo "temIds" e a prioridade das
// histórias com nivelMinimo no sorteio do Explorar. As entradas de teste vivem só no ambiente simulado (módulo vm,
// scripts/_jogo-vm.js) ou em pastas temporárias; nada fica no jogo nem em dados/.
//
// Prova:
//  (a) temIds: cumprido só com TODOS os ids; progresso x / n certo; caminho em falta, lista vazia, ids maus ou tipo
//      errado não rebentam (e não cumprem); celebra uma só vez; a avaliação silenciosa também o lê;
//  (b) prioridade: num jogador de nível 11, o Explorar entrega primeiro as entradas com nivelMinimo e só depois as
//      outras; num jogador de nível 4 nunca as entrega; uma entrada fora da época não bloqueia o sorteio das outras;
//  (c) sem entradas com nivelMinimo o sorteio é IDÊNTICO ao de sempre: um só randInt(0, n - 1) sobre a mesma lista
//      (comparado em muitas sementes, línguas, estações e estados);
//  (d) o validador (scripts/verificar-dados.js) aceita o critério temIds bem escrito e rejeita ids em falta ou mal escritos.
//
// Uso: node scripts/verificar-capitulo-enciclopedia.js
// JS_DIR=pasta  corre sobre outra versão dos js/ (para provar que o teste apanha o que se estraga).
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');
const { abrirJogo } = require('./_jogo-vm');

const RAIZ = path.join(__dirname, '..');
const JS_DIR = process.env.JS_DIR || path.join(RAIZ, 'js');
const LINGUAS = ['pt', 'en', 'es'];
const REP_NIVEL_4 = 120;
const REP_NIVEL_11 = 3600;
const IDS3 = ['arrabida_t1', 'arrabida_t2', 'arrabida_t3'];

let falhas = 0;
function ok(cond, msg) { if (!cond) { falhas++; console.log('FALHA: ' + msg); } }
function js(o) { return JSON.stringify(o); }
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
function T3(base) { const t = {}; LINGUAS.forEach(function (l) { t[l] = base + ' [' + l + ']'; }); return t; }

// Abre o jogo REAL com a Enciclopédia, o nível 11 de teste, as entradas e o capítulo 11 de teste (só no vm).
function abrir(opcoes) {
  const o = opcoes || {};
  const g = abrirJogo({ jsDir: JS_DIR, dadosDir: null, explorar: true, ecraReal: true, estadoGuardado: o.estadoGuardado });
  g.ev(`
    var FALAS = []; var TIMEOUTS = []; var dialogoFila = [];
    mostrarFalas = function (m, n) { var l = Array.isArray(m) ? m : [m]; FALAS.push({ m: l, n: n }); dialogoFila = l; document.getElementById('app-dialogue').hidden = false; };
    setTimeout = function (f) { TIMEOUTS.push(f); return TIMEOUTS.length; };
    clearTimeout = function () {};
    function mostrarNovaEntrada() {} function atualizarDialogo() {}
    function faseRealAtual() { return 'repouso'; }
    document.querySelector = function () { return { id: 'screen-quinta' }; };
  `);
  ok(g.ev('dadosAcrescentar("niveis", ' + js({ id: 'nivel_t11', min: REP_NIVEL_11, nome: T3('Nível teste') }) + ')') === true, 'o nível 11 de teste devia entrar');
  if (o.semEntradas !== true) {
    IDS3.forEach(function (id, i) {
      ok(g.ev('dadosAcrescentar("enciclopedia", ' + js({ id: id, titulo: T3('Arrábida ' + (i + 1)), texto: T3('Texto ' + (i + 1)), nivelMinimo: 11 }) + ')') === true, 'a entrada ' + id + ' devia entrar');
    });
  }
  ok(g.ev('dadosAcrescentar("capitulos", ' + js({
    id: 'cap_arrabida_t', nivel: 11, criterio: [{ tipo: 'temIds', caminho: 'encyclopedia.unlocked', ids: IDS3 }],
    titulo: T3('Descobre as 3 histórias'), objetivo: T3('Lê as 3 histórias da Arrábida'), conclusao: T3('Conseguiste')
  }) + ')') === true, 'o capítulo de teste (temIds) devia entrar');
  return g;
}
function jogador(g, rep, unlocked) {
  g.ev(`
    state.acesso.jogadorAntigo = false; state.reputacao = ${rep}; state.niveis.nivelMostrado = nivelPelaReputacao(${rep});
    state.encyclopedia.unlocked = ${js(unlocked || [])}; state.conhecimento = 0;
    state.capitulos.iniciado = true; state.capitulos.celebradosMigrado = true;
    CAPITULOS_CONFIG.forEach(function (c) { if (c.id !== 'cap_arrabida_t') { state.capitulos.concluidos[c.id] = true; state.capitulos.celebrados[c.id] = true; } });
    delete state.capitulos.concluidos.cap_arrabida_t; delete state.capitulos.celebrados.cap_arrabida_t;
    FALAS.length = 0; TIMEOUTS.length = 0;
  `);
}
function abrirTodas(g) { g.ev('state.encyclopedia.unlocked = encyclopediaEntries().map(function (e) { return e.id; });'); }
function lingua(g, l) { g.ev("currentLang = '" + l + "';"); }
function html(g, id) { return g.el(id).innerHTML; }
// Gerador pseudo-aleatório com semente (mulberry32), instalado como randInt do jogo no vm.
function semente(g, s) {
  g.ev(`
    var _rng = (function (a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })(${s});
    var _chamadas = [];
    randInt = function (a, b) { _chamadas.push([a, b]); return a + Math.floor(_rng() * (b - a + 1)); };
  `);
}

// =====================================================================
// (a) O critério temIds
// =====================================================================
{
  const g = abrir();
  const A = function (c) { return g.ev('JSON.parse(JSON.stringify(capitulosLerAlternativa(' + js(c) + ')))'); };
  const crit = function (extra) { return Object.assign({ tipo: 'temIds', caminho: 'encyclopedia.unlocked', ids: IDS3 }, extra || {}); };
  jogador(g, REP_NIVEL_11, []);
  g.ev('state.encyclopedia.unlocked = [];');
  let r = A(crit());
  ok(r.atual === 0 && r.total === 3 && r.cumprido === false, '(a) sem ids: 0 / 3, não cumprido: ' + js(r));
  g.ev('state.encyclopedia.unlocked = ["origem", "arrabida_t2"];');
  r = A(crit());
  ok(r.atual === 1 && r.total === 3 && r.cumprido === false, '(a) 1 dos 3 (com outros ids à mistura): 1 / 3: ' + js(r));
  g.ev('state.encyclopedia.unlocked = ["arrabida_t3", "arrabida_t1"];');
  r = A(crit());
  ok(r.atual === 2 && r.total === 3 && r.cumprido === false, '(a) 2 dos 3: 2 / 3, não cumprido: ' + js(r));
  g.ev('state.encyclopedia.unlocked = ["arrabida_t3", "terroir", "arrabida_t1", "arrabida_t2"];');
  r = A(crit());
  ok(r.atual === 3 && r.total === 3 && r.cumprido === true, '(a) os 3 (por qualquer ordem, com outros ids): cumprido: ' + js(r));
  // Só conta o que é igual: parecido não chega.
  g.ev('state.encyclopedia.unlocked = ["Arrabida_t1", "arrabida_t1 ", "arrabida_t2", "arrabida_t3"];');
  ok(A(crit()).cumprido === false, '(a) ids parecidos (maiúscula, espaço) não contam');
  // Ids repetidos na lista do critério contam uma vez.
  g.ev('state.encyclopedia.unlocked = ["a", "b"];');
  r = A(crit({ ids: ['a', 'a', 'b'] }));
  ok(r.total === 2 && r.atual === 2 && r.cumprido === true, '(a) ids repetidos no critério contam uma vez (total 2): ' + js(r));
  // Outro caminho (qualquer lista no estado).
  g.ev('state.vinha.listaTeste = ["x", "y"];');
  ok(A({ tipo: 'temIds', caminho: 'vinha.listaTeste', ids: ['x', 'y'] }).cumprido === true, '(a) outro caminho com uma lista também serve');

  // Defensivo: nada rebenta, nada se cumpre.
  g.ev('state.encyclopedia.unlocked = ["arrabida_t1", "arrabida_t2", "arrabida_t3"];');
  const maus = [
    ['caminho em falta', crit({ caminho: 'encyclopedia.naoExiste' })],
    ['caminho que nem começa no estado', crit({ caminho: 'nada.disto.existe' })],
    ['caminho vazio', crit({ caminho: '' })],
    ['sem caminho', { tipo: 'temIds', ids: IDS3 }],
    ['caminho que é um objeto', crit({ caminho: 'vinha' })],
    ['caminho que é um número', crit({ caminho: 'reputacao' })],
    ['caminho que é um texto', crit({ caminho: 'acesso.versaoTeste' })],
    ['caminho que é null', crit({ caminho: 'ultimaGarrafaData' })],
    ['ids vazio', crit({ ids: [] })],
    ['sem ids', { tipo: 'temIds', caminho: 'encyclopedia.unlocked' }],
    ['ids que não é lista', crit({ ids: 'arrabida_t1' })],
    ['ids com um número', crit({ ids: ['arrabida_t1', 7] })],
    ['ids com um texto vazio', crit({ ids: ['arrabida_t1', ''] })],
    ['ids com null', crit({ ids: [null] })],
    ['ids que é um objeto', crit({ ids: { a: 1 } })]
  ];
  g.ev('state.acesso.versaoTeste = "texto";');
  maus.forEach(function (m) {
    let res;
    try { res = A(m[1]); } catch (e) { ok(false, '(a) ' + m[0] + ': lançou erro (' + e.message + ')'); return; }
    ok(res.cumprido === false && res.atual === 0, '(a) ' + m[0] + ': não devia cumprir: ' + js(res));
  });
  // Lista de ids certa mas caminho de outro tipo: o total fica certo (3) e o progresso 0.
  ['vinha', 'reputacao', 'acesso.versaoTeste'].forEach(function (cam) {
    const res = A(crit({ caminho: cam }));
    ok(res.total === 3 && res.atual === 0 && res.cumprido === false, '(a) caminho "' + cam + '" de outro tipo: 0 / 3: ' + js(res));
  });
  // Dentro de um capítulo (capitulosLerCriterio): alternativa temIds ao lado de outra.
  const dois = { id: 'x', nivel: 1, criterio: [{ tipo: 'numero', caminho: 'garrafas', alvo: 99 }, crit()] };
  g.ev('state.garrafas = 0; state.encyclopedia.unlocked = ["arrabida_t1"];');
  r = g.ev('JSON.parse(JSON.stringify(capitulosLerCriterio(' + js(dois) + ')))');
  ok(r.atual === 1 && r.total === 3 && r.cumprido === false, '(a) com duas alternativas mostra a mais adiantada (1 / 3): ' + js(r));

  // O cartão do capítulo, nas 3 línguas: progresso x / n e texto escapado.
  LINGUAS.forEach(function (l) {
    lingua(g, l);
    const ui = g.ev("cStr('ui')");
    jogador(g, REP_NIVEL_11, ['origem']);
    g.ev('atualizarCapituloQuinta();');
    let h = html(g, 'capitulo-container');
    ok(h.indexOf('0 / 3') !== -1 && h.indexOf(esc('Descobre as 3 histórias [' + l + ']')) !== -1, '(a) ' + l + ': o cartão devia mostrar 0 / 3 e o título: ' + h);
    jogador(g, REP_NIVEL_11, ['arrabida_t1', 'arrabida_t3']);
    g.ev('atualizarCapituloQuinta();');
    h = html(g, 'capitulo-container');
    ok(h.indexOf('2 / 3') !== -1, '(a) ' + l + ': o cartão devia mostrar 2 / 3: ' + h);
    ok(!/NaN|undefined|null|Infinity/.test(h), '(a) ' + l + ': cartão sem NaN, undefined, null nem Infinity');
    // Nível 10: o cartão ainda não mostra o capítulo 11.
    jogador(g, 2900, []);
    g.ev('atualizarCapituloQuinta();');
    ok(html(g, 'capitulo-container').indexOf(ui.proximo.replace('{n}', 11)) !== -1, '(a) ' + l + ': no nível 10 o cartão diz o próximo capítulo no nível 11');
  });

  // Celebração: uma só vez.
  lingua(g, 'pt');
  jogador(g, REP_NIVEL_11, ['arrabida_t1', 'arrabida_t2']);
  ok(g.ev('capitulosAvaliarCelebracao()') === false && g.ev('FALAS.length') === 0, '(a) com 2 dos 3 não celebra');
  g.ev('state.encyclopedia.unlocked.push("arrabida_t3");');
  ok(g.ev('capitulosAvaliarCelebracao()') === true && g.ev('FALAS.length') === 1 && g.ev('FALAS[0].m[0]') === 'Conseguiste [pt]', '(a) com os 3 celebra, com a conclusão');
  ok(g.ev('capitulosAvaliarCelebracao()') === true && g.ev('FALAS.length') === 1 && g.ev('TIMEOUTS.length') === 1, '(a) com a festa pendente não agenda outra');
  g.ev('TIMEOUTS[0]();');
  ok(g.ev('state.capitulos.concluidos.cap_arrabida_t') === true && g.ev('state.capitulos.celebrados.cap_arrabida_t') === true, '(a) depois da confirmação fica concluído e celebrado');
  ok(g.ev('capitulosAvaliarCelebracao()') === false && g.ev('FALAS.length') === 1, '(a) celebra uma só vez');

  // Avaliação silenciosa (migração): um capítulo com temIds já cumprido fica concluído e celebrado, sem balão.
  jogador(g, REP_NIVEL_11, IDS3.concat(['origem']));
  g.ev('state.capitulos.iniciado = false; state.capitulos.celebradosMigrado = false; capitulosAvaliarEmSilencio();');
  ok(g.ev('state.capitulos.concluidos.cap_arrabida_t') === true && g.ev('state.capitulos.celebrados.cap_arrabida_t') === true && g.ev('FALAS.length') === 0, '(a) a avaliação silenciosa lê o temIds: concluído e celebrado, sem balão');
  ok(g.ev('capitulosAvaliarCelebracao()') === false, '(a) e depois não celebra');
  jogador(g, REP_NIVEL_11, ['arrabida_t1']);
  g.ev('state.capitulos.iniciado = false; state.capitulos.celebradosMigrado = false; capitulosAvaliarEmSilencio();');
  ok(g.ev('state.capitulos.concluidos.cap_arrabida_t') !== true, '(a) a avaliação silenciosa não marca um temIds por cumprir');
}

// =====================================================================
// (b) Prioridade das histórias com nivelMinimo no sorteio
// =====================================================================
{
  // Nível 11, nada aberto: as 3 (+1) novas saem primeiro, em qualquer ordem, e só depois as outras.
  for (let s = 1; s <= 40; s++) {
    const g = abrir();
    g.ev('dadosAcrescentar("enciclopedia", ' + js({ id: 'cultura_t4', titulo: T3('Cultura'), texto: T3('Texto'), nivelMinimo: 11 }) + ')');
    jogador(g, REP_NIVEL_11, []); lingua(g, 'pt'); semente(g, s);
    const saidas = [];
    for (let i = 0; i < 8; i++) {
      g.ev('enterExplorar();');
      const abertas = g.ev('state.encyclopedia.unlocked.slice()');
      saidas.push(abertas[abertas.length - 1]);
    }
    const novas = ['arrabida_t1', 'arrabida_t2', 'arrabida_t3', 'cultura_t4'];
    ok(saidas.slice(0, 4).slice().sort().join() === novas.slice().sort().join(), '(b) semente ' + s + ': as 4 primeiras entregas deviam ser as 4 com nivelMinimo: ' + saidas.slice(0, 4));
    ok(saidas.slice(4).every(function (id) { return novas.indexOf(id) === -1; }), '(b) semente ' + s + ': depois só as outras: ' + saidas.slice(4));
    ok(new Set(saidas).size === 8, '(b) semente ' + s + ': nenhuma repetida');
  }
  // Uma já aberta (por outro caminho) não volta a sair; as outras duas ainda têm prioridade.
  {
    const g = abrir(); jogador(g, REP_NIVEL_11, ['arrabida_t2']); lingua(g, 'pt'); semente(g, 7);
    const dados = [];
    for (let i = 0; i < 3; i++) { g.ev('enterExplorar();'); const a = g.ev('state.encyclopedia.unlocked.slice()'); dados.push(a[a.length - 1]); }
    ok(dados.slice(0, 2).sort().join() === 'arrabida_t1,arrabida_t3' && dados[2] !== 'arrabida_t2' && IDS3.indexOf(dados[2]) === -1, '(b) a já aberta não sai outra vez e as outras duas vêm primeiro: ' + dados);
  }
  // Nível 4: nunca as entrega (muitos cliques, várias sementes), mesmo que o jogador abra tudo o resto.
  for (let s = 1; s <= 12; s++) {
    const g = abrir(); jogador(g, REP_NIVEL_4, []); lingua(g, 'pt'); semente(g, s);
    for (let i = 0; i < 60; i++) g.ev('enterExplorar();');
    const abertas = g.ev('state.encyclopedia.unlocked.slice()');
    ok(IDS3.every(function (id) { return abertas.indexOf(id) === -1; }), '(b) nível 4, semente ' + s + ': nunca devia entregar as de nível 11');
    ok(g.ev('entradasBloqueadas().length') === 0 && abertas.length >= 10, '(b) nível 4, semente ' + s + ': abre tudo o que o sorteio dá (as de hoje desta época) e para (' + abertas.length + ')');
  }
  // Nível 11 com tudo aberto menos as novas: continua a dar as novas; com tudo aberto, a mensagem de «todo o conhecimento».
  {
    const g = abrir(); jogador(g, REP_NIVEL_11, []); lingua(g, 'pt'); semente(g, 3);
    for (let i = 0; i < 40; i++) g.ev('enterExplorar();');
    const abertas11 = g.ev('state.encyclopedia.unlocked.slice()');
    ok(g.ev('entradasBloqueadas().length') === 0 && IDS3.every(function (id) { return abertas11.indexOf(id) !== -1; }), '(b) nível 11: abriu as 3 novas e todas as que o sorteio dá nesta época');
    // Ainda há entradas manuais (só por ação): o aviso é o da época, não o de «todo o conhecimento».
    ok(html(g, 'explorar-container').indexOf(esc(g.ev("t('explorar.nadaNestaEstacao')"))) !== -1, '(b) nível 11: sem mais nada para sortear diz que não há mais nesta época');
    abrirTodas(g);
    g.ev('enterExplorar();');
    ok(html(g, 'explorar-container').indexOf(esc(g.ev("t('explorar.tudoDesbloqueado')"))) !== -1 && html(g, 'explorar-container').indexOf('35 / 35') !== -1, '(b) nível 11: com tudo aberto diz «todo o conhecimento» (35 / 35)');
  }
  // Fora da época: uma entrada nova de inverno não bloqueia o sorteio das outras; em inverno tem prioridade.
  {
    const g = abrir({ semEntradas: true });
    g.ev('dadosAcrescentar("enciclopedia", ' + js({ id: 'inverno_t', titulo: T3('Inverno'), texto: T3('Texto'), nivelMinimo: 11, estacao: 'inverno' }) + ')');
    jogador(g, REP_NIVEL_11, []); lingua(g, 'pt'); semente(g, 5);
    g.ev("estacaoAtual = function () { return 'outono'; };");
    for (let i = 0; i < 5; i++) g.ev('enterExplorar();');
    const fora = g.ev('state.encyclopedia.unlocked.slice()');
    ok(fora.length === 5 && fora.indexOf('inverno_t') === -1, '(b) fora da época a entrada de inverno não sai e as outras continuam a sair: ' + fora);
    g.ev("estacaoAtual = function () { return 'inverno'; };");
    g.ev('enterExplorar();');
    const dentro = g.ev('state.encyclopedia.unlocked.slice()');
    ok(dentro[dentro.length - 1] === 'inverno_t', '(b) em inverno a entrada de inverno tem prioridade: ' + dentro);
  }
  // Entradas manuais com nivelMinimo não entram no sorteio (só por ação), por isso não têm prioridade.
  {
    const g = abrir({ semEntradas: true });
    g.ev('dadosAcrescentar("enciclopedia", ' + js({ id: 'manual_t', titulo: T3('Manual'), texto: T3('Texto'), nivelMinimo: 11, manual: true }) + ')');
    jogador(g, REP_NIVEL_11, []); lingua(g, 'pt'); semente(g, 9);
    for (let i = 0; i < 6; i++) g.ev('enterExplorar();');
    ok(g.ev('state.encyclopedia.unlocked.indexOf("manual_t")') === -1, '(b) uma entrada manual nunca sai do Explorar');
    ok(g.ev("desbloquearEntradaEnciclopedia('manual_t') && state.encyclopedia.unlocked.indexOf('manual_t') !== -1"), '(b) mas desbloqueia-se por uma ação, ao nível 11');
  }
}

// =====================================================================
// (c) Sem nivelMinimo o sorteio é o de sempre
// =====================================================================
{
  const ESTACOES = ['inverno', 'primavera', 'verao', 'outono'];
  const REPS = [0, REP_NIVEL_4, 2900, REP_NIVEL_11];
  let comparacoes = 0;
  for (let s = 1; s <= 300; s++) {
    const g = abrir({ semEntradas: true });
    const l = LINGUAS[s % 3];
    const rep = REPS[s % 4];
    lingua(g, l);
    g.ev("estacaoAtual = function () { return " + js(ESTACOES[s % 4]) + "; }; faseRealAtual = function () { return " + js(s % 2 ? 'vindima' : 'repouso') + "; };");
    // Um estado inicial qualquer: um subconjunto das 32 entradas aberto (decidido pela semente).
    jogador(g, rep, []);
    g.ev(`(function () { var a = ${s} * 2654435761 % 4294967296; var ids = ENCYCLOPEDIA_ENTRIES.pt.map(function (e) { return e.id; });
      ids.forEach(function (id, i) { a = (a * 1103515245 + 12345) % 2147483648; if (a % 5 < ${s % 5}) state.encyclopedia.unlocked.push(id); }); })();`);
    semente(g, s);
    const bloqueadas = g.ev('entradasBloqueadas().map(function (e) { return e.id; })');
    g.ev('_chamadas.length = 0;');
    g.ev('enterExplorar();');
    const chamadas = g.ev('_chamadas.slice()');
    if (bloqueadas.length === 0) {
      ok(g.ev('state.encyclopedia.unlocked.length') >= 0, '(c) sem entradas por abrir não sorteia');
      continue;
    }
    // O pick é o 1.º randInt de enterExplorar: exatamente (0, n - 1) sobre a lista de sempre.
    ok(chamadas.length >= 1 && chamadas[0][0] === 0 && chamadas[0][1] === bloqueadas.length - 1, '(c) semente ' + s + ': o sorteio devia ser randInt(0, ' + (bloqueadas.length - 1) + '), foi ' + js(chamadas[0]));
    // E a entrada escolhida é a que o mesmo valor aleatório escolhia na lista de sempre.
    const g2 = abrir({ semEntradas: true });
    semente(g2, s);
    const esperado = bloqueadas[g2.ev('randInt(0, ' + (bloqueadas.length - 1) + ')')];
    const abertas = g.ev('state.encyclopedia.unlocked.slice()');
    ok(abertas[abertas.length - 1] === esperado, '(c) semente ' + s + ': devia sair ' + esperado + ' e saiu ' + abertas[abertas.length - 1]);
    comparacoes++;
  }
  ok(comparacoes >= 280, '(c) comparou ' + comparacoes + ' sorteios (esperava quase todos)');
}

// =====================================================================
// (d) O validador e o critério temIds
// =====================================================================
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cap-enc-'));
  function correr(jsDir, dadosDir) {
    const r = cp.spawnSync(process.execPath, [path.join(__dirname, 'verificar-dados.js')], { env: Object.assign({}, process.env, { JS_DIR: jsDir, DADOS_DIR: dadosDir }), encoding: 'utf8' });
    return { codigo: r.status, saida: (r.stdout || '') + (r.stderr || '') };
  }
  function copiar(origem, destino) { fs.cpSync(origem, destino, { recursive: true }); }

  // (d1) Uma cópia dos js/ em que o capítulo 10 usa temIds: o validador lê o critério tal como o jogo o tem.
  const ORIGINAL = "{ id: 'cap10', nivel: 10, criterio: [{ tipo: 'numero', caminho: 'roxo.dias', alvo: 3 }] }";
  function comCriterio(nome, criterio) {
    const dir = path.join(tmp, 'js-' + nome);
    copiar(JS_DIR, dir);
    const p = path.join(dir, 'capitulos.js');
    const s = fs.readFileSync(p, 'utf8');
    if (s.indexOf(ORIGINAL) === -1) throw new Error('o capítulo 10 mudou: ajusta este teste');
    fs.writeFileSync(p, s.replace(ORIGINAL, "{ id: 'cap10', nivel: 10, criterio: [" + criterio + "] }"));
    return dir;
  }
  const DADOS_VAZIOS = path.join(RAIZ, 'dados');
  const bom = correr(comCriterio('bom', "{ tipo: 'temIds', caminho: 'encyclopedia.unlocked', ids: ['origem', 'terroir', 'quedaFolha'] }"), DADOS_VAZIOS);
  ok(bom.codigo === 0, '(d) um temIds bem escrito (ids que existem, com maiúsculas de hoje) devia passar: ' + bom.saida.slice(-300));
  const maus = [
    ['ids que não existem na Enciclopédia', "{ tipo: 'temIds', caminho: 'encyclopedia.unlocked', ids: ['origem', 'nao_existe'] }", 'não é de nenhuma entrada'],
    ['ids vazio', "{ tipo: 'temIds', caminho: 'encyclopedia.unlocked', ids: [] }", 'temIds precisa'],
    ['sem ids', "{ tipo: 'temIds', caminho: 'encyclopedia.unlocked' }", 'temIds precisa'],
    ['ids mal escritos (espaço)', "{ tipo: 'temIds', caminho: 'encyclopedia.unlocked', ids: ['origem', 'com espaco'] }", 'temIds precisa'],
    ['ids mal escritos (hífen)', "{ tipo: 'temIds', caminho: 'encyclopedia.unlocked', ids: ['origem', 'a-b'] }", 'temIds precisa'],
    ['ids com um número', "{ tipo: 'temIds', caminho: 'encyclopedia.unlocked', ids: ['origem', 7] }", 'temIds precisa'],
    ['ids repetidos', "{ tipo: 'temIds', caminho: 'encyclopedia.unlocked', ids: ['origem', 'origem'] }", 'repetido'],
    ['ids que não é lista', "{ tipo: 'temIds', caminho: 'encyclopedia.unlocked', ids: 'origem' }", 'temIds precisa'],
    ['sem caminho', "{ tipo: 'temIds', ids: ['origem'] }", 'falta o caminho'],
    ['caminho que não existe no estado', "{ tipo: 'temIds', caminho: 'nada.disto', ids: ['origem'] }", 'não existe no estado']
  ];
  maus.forEach(function (m, i) {
    const r = correr(comCriterio('mau' + i, m[1]), DADOS_VAZIOS);
    ok(r.codigo === 1 && r.saida.indexOf(m[2]) !== -1, '(d) ' + m[0] + ': o validador devia recusar (' + m[2] + '): código ' + r.codigo + ' ' + r.saida.slice(-250));
  });
  // Sem o tipo na lista do validador, um temIds seria «tipo desconhecido».
  const sem = fs.readFileSync(path.join(__dirname, 'verificar-dados.js'), 'utf8');
  ok(/TIPOS_CRITERIO = \[[^\]]*'temIds'/.test(sem), '(d) o validador conhece o tipo temIds (TIPOS_CRITERIO)');

  // (d2) Pelo caminho dos dados: um pacote de nível 11 numa pasta dados/ de teste (nível + história + capítulo temIds + 3 entradas).
  function pacote(nome, criterio, entradas) {
    const dir = path.join(tmp, 'dados-' + nome);
    copiar(DADOS_VAZIOS, dir);
    // A pasta dados/ real já tem o pacote do nível 11 (Moscatel da Arrábida): a cópia de teste fica só com os comentários dos
    // ficheiros do pacote, para o pacote de TESTE (nível, história, capítulo e 3 entradas) ser o único nível 11.
    ['niveis.js', 'historias.js', 'capitulos.js', 'enciclopedia.js'].forEach(function (f) {
      const linhas = fs.readFileSync(path.join(dir, f), 'utf8').split('\n').filter(function (l) { return /^\s*\/\//.test(l); });
      fs.writeFileSync(path.join(dir, f), linhas.join('\n') + '\n');
    });
    fs.appendFileSync(path.join(dir, 'niveis.js'), "\ndadosAcrescentar('niveis', { id: 'nivel_t11', min: 3600, nome: { pt: 'a', en: 'b', es: 'c' } });\n");
    fs.appendFileSync(path.join(dir, 'historias.js'), "\ndadosAcrescentar('historias', { id: 'historia_t11', nivel: 11, falas: [{ texto: { pt: 'a', en: 'b', es: 'c' } }] });\n");
    fs.appendFileSync(path.join(dir, 'capitulos.js'), "\ndadosAcrescentar('capitulos', { id: 'cap_t11', nivel: 11, criterio: [" + criterio + "], titulo: { pt: 'a', en: 'b', es: 'c' }, objetivo: { pt: 'a', en: 'b', es: 'c' }, conclusao: { pt: 'a', en: 'b', es: 'c' } });\n");
    entradas.forEach(function (id) {
      fs.appendFileSync(path.join(dir, 'enciclopedia.js'), "\ndadosAcrescentar('enciclopedia', { id: '" + id + "', titulo: { pt: 'a', en: 'b', es: 'c' }, texto: { pt: 'a', en: 'b', es: 'c' }, nivelMinimo: 11 });\n");
    });
    return dir;
  }
  const C3 = "{ tipo: 'temIds', caminho: 'encyclopedia.unlocked', ids: ['arr_a', 'arr_b', 'arr_c'] }";
  const pBom = correr(JS_DIR, pacote('bom', C3, ['arr_a', 'arr_b', 'arr_c']));
  ok(pBom.codigo === 0 && pBom.saida.indexOf('7 entradas vindas de dados/') !== -1, '(d) o pacote completo (nível, história, capítulo temIds e 3 entradas) devia passar: ' + pBom.saida.slice(-300));
  const pBomEstrito = cp.spawnSync(process.execPath, [path.join(__dirname, 'verificar-dados.js'), '--estrito'], { env: Object.assign({}, process.env, { JS_DIR: JS_DIR, DADOS_DIR: path.join(tmp, 'dados-bom') }), encoding: 'utf8' });
  ok(pBomEstrito.status === 0, '(d) e em modo estrito também');
  const pFalta = correr(JS_DIR, pacote('falta', C3, ['arr_a', 'arr_b']));
  ok(pFalta.codigo === 1 && pFalta.saida.indexOf('"arr_c" não é de nenhuma entrada da Enciclopédia') !== -1, '(d) um id do capítulo sem entrada devia falhar: ' + pFalta.saida.slice(-250));
  const pMal = correr(JS_DIR, pacote('mal', "{ tipo: 'temIds', caminho: 'encyclopedia.unlocked', ids: ['arr_a', 'com espaco'] }", ['arr_a']));
  ok(pMal.codigo === 1, '(d) um capítulo com ids mal escritos é ignorado pelo jogo e o pacote falha (falta o capítulo do nível 11): ' + pMal.saida.slice(-250));
  // O jogo ignora o capítulo mau com um aviso, sem erro.
  const avisos = [];
  const gm = abrirJogo({ jsDir: JS_DIR, dadosDir: path.join(tmp, 'dados-mal'), explorar: true, aoAvisar: function (m) { avisos.push(m); } });
  ok(gm.ev('CAPITULOS_CONFIG.some(function (c) { return c.id === "cap_t11"; })') === false && avisos.some(function (a) { return a.indexOf('cap_t11') !== -1 && a.indexOf('temIds') !== -1; }), '(d) o jogo ignora o capítulo com ids mal escritos e avisa: ' + avisos);
  const gb = abrirJogo({ jsDir: JS_DIR, dadosDir: path.join(tmp, 'dados-bom'), explorar: true });
  ok(gb.ev('CAPITULOS_CONFIG.some(function (c) { return c.id === "cap_t11"; })') === true, '(d) o jogo aceita o capítulo temIds bem escrito');
  {
    const g = abrir({ semEntradas: true });
    const r = g.ev('dadosAcrescentar("capitulos", ' + js({ id: 'cap_mau_t', nivel: 11, criterio: [{ tipo: 'temIds', caminho: 'encyclopedia.unlocked' }], titulo: T3('a'), objetivo: T3('a'), conclusao: T3('a') }) + ')');
    ok(r === false, '(d) sem a lista de ids o jogo recusa o capítulo');
  }
  [['ids repetidos', ['a', 'a']], ['ids vazio', []], ['ids com número', ['a', 3]], ['ids com espaço', ['a b']], ['ids com hífen', ['a-b']]].forEach(function (m) {
    const g = abrir({ semEntradas: true });
    const r = g.ev('dadosAcrescentar("capitulos", ' + js({ id: 'cap_mau_t', nivel: 11, criterio: [{ tipo: 'temIds', caminho: 'encyclopedia.unlocked', ids: m[1] }], titulo: T3('a'), objetivo: T3('a'), conclusao: T3('a') }) + ')');
    ok(r === false, '(d) ' + m[0] + ': o jogo devia recusar o capítulo');
  });
  fs.rmSync(tmp, { recursive: true, force: true });
}

if (falhas) { console.log(falhas + ' falha(s)'); process.exit(1); }
console.log('OK');
