#!/usr/bin/env node
// Pequenos usos para recursos que sobravam (PR "economia"): (1) a Compostagem da Vinha aceita 3 Bagaço em vez de 3 Resíduos;
// (2) a prova da Câmara soma +1 de Reputação por cada 5 de Conhecimento (máximo +4); (3) prémio ÚNICO de +10 de Reputação ao
// completar as 15 páginas do Caderno; (4) textos do Conhecimento no Perfil e dos selos. Corre js/ REAIS num ambiente simulado
// (vm), sem browser nem conta real.
//
// Uso: node scripts/verificar-economia.js
// VINHA_JS, CAMARA_JS, CADERNO_JS = caminho  correm sobre outra versão desse ficheiro (provas negativas).
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const JS = function (f) { return path.join(RAIZ, 'js', f); };
const VINHA_JS = process.env.VINHA_JS || JS('vinha.js');
const CAMARA_JS = process.env.CAMARA_JS || JS('camara.js');
const CADERNO_JS = process.env.CADERNO_JS || JS('caderno.js');
let falhas = 0;
function ok(cond, msg) { if (!cond) { falhas++; console.log('FALHA: ' + msg); } }
const ler = function (f) { return fs.readFileSync(f, 'utf8'); };

function ambiente(extra, ficheiros, guardadoInicial) {
  const guardado = {};
  if (guardadoInicial) guardado.yoshicat_quinta_state_v2 = JSON.stringify(guardadoInicial);
  const sb = Object.assign({
    console: { log() {}, warn() {}, error() {} },
    localStorage: {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(guardado, k) ? guardado[k] : null; },
      setItem: function (k, v) { guardado[k] = String(v); }, removeItem: function (k) { delete guardado[k]; }
    },
    location: { search: '' }, URLSearchParams: URLSearchParams,
    document: { querySelectorAll: function () { return []; }, getElementById: function () { return null; }, querySelector: function () { return null; }, addEventListener: function () {} },
    setTimeout: function () { return 1; }, clearTimeout: function () {}, Image: function () {}, Date: (function () { class D extends Date {} return D; })()
  }, extra || {});
  sb.window = sb;
  sb.Telegram = { WebApp: {} };
  const cx = vm.createContext(sb);
  require('./_regras-tempo').injetarRegrasTempo(cx);
  ficheiros.forEach(function (f) { vm.runInContext(ler(f.startsWith('/') ? f : JS(f)), cx, { filename: path.basename(f) }); });
  const g = { cx: cx };
  g.ev = function (c) { return vm.runInContext(c, cx); };
  g.json = function (c) { return JSON.parse(vm.runInContext('JSON.stringify(' + c + ')', cx)); };
  g.estado = function () { return vm.runInContext('JSON.stringify(state)', cx); };
  return g;
}
const base = function (f, guardado) {
  return ambiente(null, ['state.js', 'i18n.js'].concat(f), guardado);
};

// 1. Compostagem: 3 Resíduos OU 3 Bagaço, o mesmo adubo; o Bagaço continua a servir ao Alambique e ao isco.
{
  const g = ambiente({ estacaoAtual: function () { return 'verao'; }, diaLisboaDeHoje: function () { return '2026-08-10'; } }, ['state.js', 'i18n.js', 'estacoes.js', 'tempo.js', VINHA_JS]);
  ok(g.ev('RESIDUOS_POR_COMPOSTAGEM') === 3 && g.ev('BAGACO_POR_COMPOSTAGEM') === 3, '3 Resíduos ou 3 Bagaço');
  const c = function (v, a, adubo) { g.ev('var _v = ' + JSON.stringify(v) + ', _a = ' + JSON.stringify(a) + ';'); const r = g.json('vinhaCompostar(_v, _a, ' + adubo + ')'); return { r: r, v: g.json('_v'), a: g.json('_a') }; };
  let x = c({ residuos: 3, adubo: 0 }, { bagaco: 5 }, 1);
  ok(x.r.ok && x.r.fonte === 'residuos' && x.v.residuos === 0 && x.v.adubo === 1 && x.a.bagaco === 5, '3 Resíduos: gasta Resíduos, +1 adubo, o Bagaço fica: ' + JSON.stringify(x));
  x = c({ residuos: 1, adubo: 2 }, { bagaco: 3 }, 1);
  ok(x.r.ok && x.r.fonte === 'bagaco' && x.v.residuos === 1 && x.v.adubo === 3 && x.a.bagaco === 0, '3 Bagaço: gasta Bagaço, +1 adubo (o mesmo), os Resíduos ficam: ' + JSON.stringify(x));
  x = c({ residuos: 1, adubo: 0 }, { bagaco: 3 }, 2);
  ok(x.r.ok && x.v.adubo === 2, 'no outono (adubo 2) as duas formas dão o mesmo: 2');
  x = c({ residuos: 4, adubo: 0 }, { bagaco: 9 }, 1);
  ok(x.r.fonte === 'residuos' && x.a.bagaco === 9 && x.v.residuos === 1, 'com as duas, gasta primeiro os Resíduos (o Bagaço guarda-se para a Adega)');
  [[2, 2], [0, 0], [2, 0], [0, 2]].forEach(function (p) {
    x = c({ residuos: p[0], adubo: 7 }, { bagaco: p[1] }, 1);
    ok(!x.r.ok && x.r.fonte === null && x.v.residuos === p[0] && x.v.adubo === 7 && x.a.bagaco === p[1], 'Resíduos ' + p[0] + ' e Bagaço ' + p[1] + ': recusa sem alterar nada');
  });
  x = c({ residuos: 0, adubo: 0 }, null, 1);
  ok(!x.r.ok && x.v.adubo === 0, 'sem state.adega: recusa sem rebentar');
  ok(g.ev('compostagemFonte("x", undefined)') === null && g.ev('compostagemFonte(NaN, 5)') === 'bagaco' && g.ev('compostagemFonte(5, NaN)') === 'residuos', 'valores inválidos não contam');
  // Textos e ligação: explica as duas formas nas 3 línguas; o Bagaço continua a servir ao Alambique e ao isco.
  ['pt', 'en', 'es'].forEach(function (l) {
    ['vinha.msgFaltamResiduos', 'vinha.dica.compostagem', 'vinha.dica.compostagem.inverno'].forEach(function (k) {
      const v = g.ev('TRANSLATIONS.' + l + '["' + k + '"]');
      ok(/3/.test(v) && /(Bagaço|Pomace|Orujo)/.test(v), k + ' em ' + l + ' devia dizer que servem 3 Resíduos ou 3 Bagaço: ' + v);
    });
  });
  const vinha = ler(VINHA_JS);
  ok(/botaoVinha\('compostagem', 'vinha\.pillCompostar', compostagemFonte\(/.test(vinha), 'o botão Compostar só fica apagado sem Resíduos nem Bagaço');
  ok(/adega\.recursoBagaco/.test(vinha), 'o cartão da Vinha mostra o Bagaço');
  const alambique = ler(JS('alambique.js')), proteger = ler(JS('proteger.js'));
  ok(/bagacoBagaceira: 3/.test(alambique) && /a\.bagaco = bagaco - ALAMBIQUE_CONFIG\.bagacoBagaceira/.test(alambique) && /state\.adega\.bagaco -= 1/.test(proteger), 'o Bagaço continua a servir ao Alambique (3, "Destilar bagaço") e ao isco (1)');
}

// 2. Câmara: +1 de Reputação por cada 5 de Conhecimento, no máximo +4; só soma, nunca gasta.
{
  const g = base([CAMARA_JS], null);
  g.ev('function diaLisboaDeHoje() { return "2026-10-09"; }');
  ok(g.ev('CAMARA_CONFIG.conhecimentoPorPasso') === 5 && g.ev('CAMARA_CONFIG.bonusPorPasso') === 1 && g.ev('CAMARA_CONFIG.bonusMaximo') === 4 && g.ev('CAMARA_CONFIG.reputacao') === 8, 'valores em CAMARA_CONFIG: base 8, +1 por 5, máximo +4');
  [[0, 0], [4, 0], [5, 1], [9, 1], [10, 2], [14, 2], [15, 3], [19, 3], [20, 4], [21, 4], [100, 4], [23, 4]].forEach(function (p) {
    const r = g.json('camaraRecompensa({ conhecimento: ' + p[0] + ' })');
    ok(r.bonus === p[1] && r.total === 8 + p[1] && r.base === 8, 'Conhecimento ' + p[0] + ' devia dar +' + p[1] + ' (total ' + (8 + p[1]) + '): ' + JSON.stringify(r));
  });
  ['null', '"x"', '-5', '2.5', 'undefined', 'NaN'].forEach(function (v) { ok(g.json('camaraRecompensa({ conhecimento: ' + v + ' })').bonus === 0, 'Conhecimento inválido (' + v + ') conta 0'); });
  ok(g.json('camaraRecompensa(null)').total === 8, 'sem estado: só a base');
  const mk = function (k) { return 'var s1 = { reputacao: 100, garrafas: 2, conhecimento: ' + k + ', uvas: 7, gotas: 3, camara: { provaDia: null, dias: 0 } };'; };
  g.ev(mk(12));
  const r = g.json("camaraProvar(s1, '2026-10-09')");
  ok(r.ok && r.reputacaoGanha === 10 && r.bonus === 2 && g.ev('s1.reputacao') === 110, 'Conhecimento 12: +8 e +2 = +10: ' + JSON.stringify(r));
  ok(g.ev('s1.conhecimento') === 12 && g.ev('s1.garrafas') === 2 && g.ev('s1.uvas') === 7 && g.ev('s1.gotas') === 3, 'o Conhecimento (e o resto) nunca se gasta');
  g.ev(mk(500)); ok(g.json("camaraProvar(s1, '2026-10-09')").reputacaoGanha === 12 && g.ev('s1.reputacao') === 112, 'Conhecimento 500: o teto é +12 (8 + 4)');
  g.ev(mk(0)); ok(g.json("camaraProvar(s1, '2026-10-09')").reputacaoGanha === 8, 'Conhecimento 0: +8 como antes');
  g.ev(mk(20)); g.ev("camaraProvar(s1, '2026-10-09')"); const a = g.ev('JSON.stringify(s1)');
  ok(!g.json("camaraProvar(s1, '2026-10-09')").ok && g.ev('JSON.stringify(s1)') === a, 'continua a ser uma vez por dia (recusa sem alterar nada)');
  // O texto usa {min} duas vezes: o ecrã tem de trocar todas (sem sobrar nenhum {marcador} à vista).
  ['pt', 'en', 'es'].forEach(function (l) {
    const d = g.ev('TRANSLATIONS.' + l + '["camara.desc"]');
    const src = ler(CAMARA_JS);
    const n = (d.match(/\{min\}/g) || []).length;
    ok(n < 2 || /\.replace\(\/\\\{min\\\}\/g,/.test(src), 'camara.desc usa {min} ' + n + ' vezes em ' + l + ': o ecrã tem de os trocar a todos (replace global)');
  });
  ['pt', 'en', 'es'].forEach(function (l) {
    const d = g.ev('TRANSLATIONS.' + l + '["camara.desc"]'), o = g.ev('TRANSLATIONS.' + l + '["camara.okBonus"]');
    ok(['{min}', '{max}', '{passo}'].every(function (m) { return d.indexOf(m) !== -1; }), 'camara.desc diz o total que se pode ganhar em ' + l);
    ok(['{rep}', '{bonus}'].every(function (m) { return o.indexOf(m) !== -1; }), 'camara.okBonus em ' + l);
  });
}

// 3. Caderno: prémio ÚNICO de +10 ao completar as 15 páginas; "já dado" fora do alcance de um segundo prémio, também na nuvem.
{
  const g = base([CADERNO_JS]);
  const ids = g.json('CADERNO_PAGINAS.map(function (p) { return p.id; })');
  ok(ids.length === 15 && g.ev('CADERNO_PREMIO_REPUTACAO') === 10, '15 páginas e prémio de +10');
  const st = function (n, extra) { const p = {}; ids.slice(0, n).forEach(function (id) { p[id] = '2026-10-01'; }); return Object.assign({ reputacao: 50, uvas: 9, caderno: { paginas: p } }, extra || {}); };
  const run = function (estado) { g.ev('var _e = ' + JSON.stringify(estado) + ';'); return { r: g.json('cadernoPremioCompleto(_e)'), e: g.json('_e') }; };
  let x = run(st(14));
  ok(!x.r.ok && x.r.motivo === 'incompleto' && x.e.reputacao === 50 && x.e.caderno.premioCompleto === undefined, '14 páginas: sem prémio, nada muda');
  x = run(st(15));
  ok(x.r.ok && x.r.reputacaoGanha === 10 && x.e.reputacao === 60 && x.e.caderno.premioCompleto === true && x.e.uvas === 9 && JSON.stringify(x.e.caderno.paginas) === JSON.stringify(st(15).caderno.paginas), '15 páginas: +10 e marca premioCompleto; mais nada muda: ' + JSON.stringify(x.r));
  g.ev('var _f = ' + JSON.stringify(x.e) + ';');
  const antes = g.ev('JSON.stringify(_f)');
  const r2 = g.json('cadernoPremioCompleto(_f)');
  ok(!r2.ok && r2.motivo === 'ja_dado' && r2.reputacaoGanha === 0 && g.ev('JSON.stringify(_f)') === antes, 'o prémio não se repete (ja_dado) e não altera nada');
  x = run(st(15, { caderno: undefined })); ok(!x.r.ok, 'sem caderno: sem prémio, sem rebentar');
  ['null', '"x"', '[]', '{}', '{ "paginas": null }', '{ "paginas": [] }', '{ "paginas": "x" }'].forEach(function (c) {
    x = run({ reputacao: 5, caderno: JSON.parse(c) });
    ok(!x.r.ok && x.e.reputacao === 5, 'caderno estranho (' + c + '): sem prémio e sem rebentar');
  });
  ok(g.json('cadernoPremioCompleto(null)').motivo === 'estado_invalido' && g.json('cadernoPremioCompleto("x")').motivo === 'estado_invalido', 'estado inválido');
  x = run({ reputacao: 'x', caderno: st(15).caderno }); ok(x.r.ok && x.e.reputacao === 10, 'Reputação inválida conta 0');
  // Páginas desconhecidas não contam; só as 15 reais.
  const extra = st(14); extra.caderno.paginas.id_desconhecido = '2026-10-01';
  x = run(extra); ok(!x.r.ok, '14 reais + 1 desconhecida: sem prémio');
  // Pureza: sem relógio, sorteio nem gravação.
  const corpo = ler(CADERNO_JS).replace(/\/\/.*$/gm, '');
  const fn = corpo.slice(corpo.indexOf('function cadernoPremioCompleto'), corpo.indexOf('function cadernoPremioCompleto') + 900);
  ok(!/Date\.now|Math\.random|new Date|saveState|localStorage/.test(fn.slice(0, fn.indexOf('\n}\n'))), 'cadernoPremioCompleto é pura (sem relógio, sorteio nem gravação)');
  // A nuvem junta "já dado" por união (nunca se perde, nunca se paga duas vezes); sem o campo, o resultado é o de sempre.
  const nuvem = ler(JS('nuvem.js'));
  const ini = nuvem.indexOf('function nuvemJuntarCaderno'); const fim = nuvem.indexOf('\n}\n', ini) + 3;
  const h = ambiente(null, []);
  vm.runInContext(nuvem.slice(ini, fim), h.cx);
  const j = function (a, b) { return h.json('nuvemJuntarCaderno(' + JSON.stringify(a) + ',' + JSON.stringify(b) + ')'); };
  ok(JSON.stringify(j({ paginas: { a: '2026-10-01' } }, { paginas: {} })) === '{"paginas":{"a":"2026-10-01"}}', 'sem premioCompleto o resultado é o de sempre');
  ok(j({ paginas: {}, premioCompleto: true }, { paginas: {} }).premioCompleto === true && j({ paginas: {} }, { paginas: {}, premioCompleto: true }).premioCompleto === true, 'premioCompleto de qualquer lado fica true na junção');
  ok(j({ paginas: {}, premioCompleto: false }, { paginas: {}, premioCompleto: 'sim' }).premioCompleto === undefined, 'só true conta (false ou lixo ignoram-se)');
}

// 4. O prémio dentro do Proteger: na vitória que completa as 15 páginas, uma só vez, no mesmo saveState; fala com a frase do prémio.
{
  const HOJE = '2026-10-05';
  const abrirP = function (paginasN, extra) {
    const reg = { falas: [], saves: 0 };
    const g = ambiente({
      state: undefined,
      saveState: function () { reg.saves++; }, t: function (k) { return k; }, randInt: function (a) { return a; },
      diaLisboaDeHoje: function () { return HOJE; }, estacaoAtual: function () { return 'inverno'; }, faseRealAtual: function () { return 'repouso'; },
      tempoAtual: function () { return { disponivel: false }; }, caveReservaAberta: function () { return true; }, ecraDesbloqueado: function () { return true; },
      garrafaQueMaisDescansou: function () { return 3; }, garrafaPorDias: function () { return { imagem: 'x', nomeKey: 'adega.garrafaAmbar' }; },
      rondaChizoFeitasHoje: function () { return 1; }, marcarObjetivoCumprido: function () {}, updateStatsDisplays: function () {},
      definirFundo() {}, tocarSomFicheiro() {}, vibrar() {}, tocarSom() {},
      atualizarDialogo: function (m) { reg.falas.push([m]); }, mostrarFalas: function (m) { reg.falas.push(Array.isArray(m) ? m : [m]); },
      localeAtual: function () { return 'pt-PT'; }, TEMPO_CONFIG: { vantagens: { rondasExtraProteger: { nevoeiro: 1, trovoada: 1 } } }, currentLang: 'pt',
      document: { getElementById: function () { return { set innerHTML(v) {}, get innerHTML() { return ''; } }; }, querySelectorAll: function () { return []; } }
    }, ['assaltos.js', CADERNO_JS, 'barril.js', process.env.PROTEGER_JS || 'proteger.js']);
    const todos = g.json('CADERNO_PAGINAS.map(function (p) { return p.id; })');
    const faltam = (extra && extra.faltam) || 0; // quantas páginas faltam (as da vinha, as primeiras a sair)
    const pag = {}; todos.filter(function (id) { return !/^vinha_/.test(id); }).forEach(function (id) { pag[id] = '2026-10-01'; });
    const vinhaIds = todos.filter(function (id) { return /^vinha_/.test(id); });
    vinhaIds.slice(0, vinhaIds.length - faltam).forEach(function (id) { pag[id] = '2026-10-01'; });
    g.ev('var state = ' + JSON.stringify({ uvas: 0, gotas: 0, reputacao: 100, conhecimento: 5, adega: { bagaco: 3 }, acesso: { jogadorAntigo: false },
      proteger: { isco: { dia: HOJE, indice: 0, alvo: 'vinha' }, vitoriasComPremioHoje: 0, diaVitoriasLisboa: HOJE }, objetivos: { dia: HOJE, feitos: {} }, caderno: Object.assign({ paginas: pag }, (extra && extra.premioDado) ? { premioCompleto: true } : {}) }) + ';');
    g.reg = reg; g.vinhaN = vinhaIds.length;
    g.ganha = function () { g.ev('startProteger()'); g.ev("finishProteger(true, 'ganhou')"); };
    g.nPag = function () { return Object.keys(g.json('state.caderno.paginas')).length; };
    g.todasFalas = function () { return reg.falas.reduce(function (a, f) { return a.concat(f); }, []).filter(function (x) { return typeof x === 'string'; }); };
    return g;
  };
  // Falta 1 página (da vinha): a vitória dá a 15.ª e o prémio.
  let g = abrirP(0, { faltam: 1 });
  ok(g.nPag() === 14, 'premissa: 14 páginas antes da vitória (' + g.nPag() + ')');
  const repAntes = g.ev('state.reputacao');
  g.ganha();
  const premioRep = g.ev('state.reputacao') - repAntes;
  ok(g.nPag() === 15 && g.ev('state.caderno.premioCompleto') === true, 'a vitória dá a 15.ª página e marca o prémio como dado');
  ok(g.ev('state.reputacao') >= repAntes + 10 + 2 && premioRep >= 12 && premioRep <= 15, 'Reputação: o prémio de sempre (2 a 5) mais +10: +' + premioRep);
  ok(g.reg.saves === 1, 'o prémio grava-se no MESMO saveState da vitória (saves = ' + g.reg.saves + ')');
  const falas = g.todasFalas();
  ok(falas.some(function (x) { return /Os porcos já não têm papéis para perder/.test(x); }) && falas.some(function (x) { return /Caderno completo! \+10 de Reputação/.test(x); }) && falas.some(function (x) { return /Página nova no Caderno/.test(x); }), 'mostra a página nova, "Os porcos já não têm papéis para perder." e a frase do prémio: ' + JSON.stringify(falas));
  // Outra vitória: nunca repete o prémio.
  const rep2 = g.ev('state.reputacao');
  g.ev("state.proteger.vitoriasComPremioHoje = 0");
  g.ganha();
  ok(g.ev('state.reputacao') - rep2 <= 5 && g.ev('state.reputacao') - rep2 >= 2, 'a vitória seguinte não repete o +10: +' + (g.ev('state.reputacao') - rep2));
  // Quem já tinha as 15 (save antigo): recebe o prémio na primeira vitória com pista, uma só vez.
  g = abrirP(0, {});
  ok(g.nPag() === 15, 'premissa: 15 páginas (save antigo)');
  const r0 = g.ev('state.reputacao'); g.ganha();
  ok(g.ev('state.reputacao') - r0 >= 12 && g.ev('state.caderno.premioCompleto') === true && g.nPag() === 15, 'save antigo com as 15: recebe o prémio de +10 na 1.ª vitória (sem nova página)');
  ok(g.todasFalas().some(function (x) { return /Caderno completo! \+10/.test(x); }) && !g.todasFalas().some(function (x) { return /Página nova no Caderno/.test(x); }), 'e a fala é a do prémio, sem "página nova"');
  // Prémio já dado: nunca mais.
  g = abrirP(0, { premioDado: true });
  const r3 = g.ev('state.reputacao'); g.ganha();
  ok(g.ev('state.reputacao') - r3 <= 5 && !g.todasFalas().some(function (x) { return /Caderno completo! \+10/.test(x); }), 'com o prémio já dado, nunca mais');
  // Sem prémio com treino (sem prémio de vitória) nem derrota.
  g = abrirP(0, { faltam: 1 });
  g.ev('state.proteger.vitoriasComPremioHoje = 2'); const r4 = g.ev('state.reputacao'); g.ganha();
  ok(g.ev('state.reputacao') === r4 && g.nPag() === 14, 'em treino (sem prémio) não há página nem prémio');
  g = abrirP(0, { faltam: 1 }); g.ev('startProteger()'); g.ev("finishProteger(false, 'perdeu')");
  ok(g.nPag() === 14 && g.reg.saves === 0, 'perder não dá página nem prémio');
}

// 5. Textos: Conhecimento no Perfil, selos, e o prémio do Caderno nas 3 línguas.
{
  const g = base(['caderno.js']);
  const T = function (l, k) { return g.ev('TRANSLATIONS.' + l + '["' + k + '"]'); };
  ok(T('pt', 'perfil.conhecimentoNota') === 'Conhecimento: as entradas da Enciclopédia que descobriste.', 'nota do Conhecimento (PT)');
  ['en', 'es'].forEach(function (l) { ok(/\S/.test(T(l, 'perfil.conhecimentoNota')) && T(l, 'perfil.conhecimentoNota') !== T('pt', 'perfil.conhecimentoNota'), 'nota do Conhecimento em ' + l); });
  ok(/data-i18n="perfil\.conhecimentoNota"/.test(ler(JS('perfil.js'))), 'o Perfil mostra a nota do Conhecimento');
  ['pt', 'en', 'es'].forEach(function (l) {
    const b = T(l, 'objetivos.bonusLinha');
    ok(b.indexOf('{bonus}') !== -1 && !/(do dia|daily|del día)/.test(b), 'objetivos.bonusLinha em ' + l + ' só diz o que acontece (sem "do dia"): ' + b);
  });
  ok(T('pt', 'objetivos.bonusLinha') === 'Completar os 3 dá +{bonus} Reputação e soma 1 aos teus selos.', 'texto PT dos selos');
  const prot = ler(JS('proteger.js'));
  ok((prot.match(/cadernoPremio: '/g) || []).length === 3 && /Caderno completo! \+\{rep\} de Reputação\./.test(prot) && /Notebook complete! \+\{rep\} Reputation\./.test(prot) && /¡Cuaderno completo! \+\{rep\} de Reputación\./.test(prot), 'frase do prémio do Caderno nas 3 línguas');
  const st = ler(JS('state.js'));
  ok(/premioCompleto: só existe \(true\)/.test(st), 'state.js documenta premioCompleto');
}

console.log(falhas === 0 ? 'OK' : falhas + ' FALHA(S)');
process.exit(falhas === 0 ? 0 : 1);
