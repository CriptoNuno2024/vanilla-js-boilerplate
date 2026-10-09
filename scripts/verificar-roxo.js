#!/usr/bin/env node
// Nível 10 "Moscatel Roxo" (o último) e A Cepa Roxa (tarefa "Brindar com o Moscatel Roxo"): NIVEIS_CONFIG (js/niveis.js), a tranca do
// ecrã "roxo", o capítulo 10 (js/capitulos.js), state.roxo (js/state.js), as regras puras de js/roxo.js, os textos nas 3 línguas e a
// ligação ao jogo. É ESTE script que fixa os 10 níveis (os outros dizem "pelo menos N"). Corre state.js, i18n.js, niveis.js,
// capitulos.js, historia.js e roxo.js REAIS num ambiente simulado (vm), sem browser nem conta real.
//
// Uso: node scripts/verificar-roxo.js
// ROXO_JS=caminho  corre sobre outra versão de js/roxo.js (provas negativas).
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const ROXO_JS = process.env.ROXO_JS || path.join(RAIZ, 'js', 'roxo.js');
let falhas = 0;
function ok(cond, msg) { if (!cond) { falhas++; console.log('FALHA: ' + msg); } }
const ler = function (f) { return fs.readFileSync(f, 'utf8'); };

function abrir(guardadoInicial, search) {
  const guardado = {};
  if (guardadoInicial) guardado.yoshicat_quinta_state_v2 = JSON.stringify(guardadoInicial);
  const sb = {
    console: { log() {}, warn() {}, error() {} },
    localStorage: {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(guardado, k) ? guardado[k] : null; },
      setItem: function (k, v) { guardado[k] = String(v); },
      removeItem: function (k) { delete guardado[k]; }
    },
    location: { search: search || '' },
    URLSearchParams: URLSearchParams,
    document: { querySelectorAll: function () { return []; }, getElementById: function () { return null; }, querySelector: function () { return null; }, addEventListener: function () {} },
    setTimeout: function () { return 1; }, clearTimeout: function () {}, Image: function () {}, Date: (function () { class D extends Date {} return D; })()
  };
  sb.window = sb;
  sb.Telegram = { WebApp: {} };
  const cx = vm.createContext(sb);
  vm.runInContext(ler(path.join(RAIZ, 'js', 'state.js')), cx, { filename: 'state.js' });
  vm.runInContext(ler(path.join(RAIZ, 'js', 'i18n.js')), cx, { filename: 'i18n.js' });
  vm.runInContext(`
    var FALAS = [];
    function mostrarFalas(f, quem) { FALAS.push({ f: f, quem: quem }); }
    function vibrar() {} function tocarSom() {} function updateStatsDisplays() {}
    function localeAtual() { return 'pt-PT'; }
    function diaLisboaDeHoje() { return '2026-10-09'; }
  `, cx);
  ['niveis.js', 'capitulos.js', 'historia.js'].forEach(function (f) { vm.runInContext(ler(path.join(RAIZ, 'js', f)), cx, { filename: f }); });
  vm.runInContext(ler(ROXO_JS), cx, { filename: 'roxo.js' });
  const g = { cx: cx };
  g.ev = function (c) { return vm.runInContext(c, cx); };
  g.json = function (c) { return JSON.parse(vm.runInContext('JSON.stringify(' + c + ')', cx)); };
  g.estado = function () { return vm.runInContext('JSON.stringify(state)', cx); };
  g.puro = function () { vm.runInContext('Math.random = function () { throw new Error("Math.random proibido"); }; Date.now = function () { throw new Error("Date.now proibido"); };', cx); };
  return g;
}

const NOVE = { cap1: true, cap2: true, cap3: true, cap4: true, cap5: true, cap6: true, cap7: true, cap8: true, cap9: true };
const saveNivel10 = function (extra) {
  return Object.assign({ reputacao: 2800, uvas: 100, gotas: 7, garrafas: 12, ultimaGravacaoEm: 1, acesso: { jogadorAntigo: false, introMostrada: true }, niveis: { nivelMostrado: 9, garrafasAoNivel6: 0 },
    capitulos: { iniciado: true, celebradosMigrado: true, concluidos: Object.assign({}, NOVE), celebrados: Object.assign({}, NOVE) },
    despensa: { recebidos: { queijo_azeitao: 2 }, entregues: { queijo_azeitao: 1 }, primeiraTroca: {}, hoje: { dia: null, feitas: {} } },
    lagar: { ultimoDia: '2026-10-08', dias: 3, mesaDia: '2026-10-08', assaltoDia: null },
    camara: { provaDia: '2026-10-08', dias: 3 } }, extra || {});
};

// 1. Nível 10 (o último): 10 níveis, limiar 2800, nome nas 3 línguas, tranca do ecrã "roxo".
{
  const g = abrir();
  ok(g.ev('NIVEIS_CONFIG.length') === 10, 'devia haver exatamente 10 níveis');
  ok(JSON.stringify(g.json('NIVEIS_CONFIG.map(function (n) { return n.min; })')) === '[0,15,50,120,300,600,1000,1500,2100,2800]', 'limiares 0, 15, 50, 120, 300, 600, 1000, 1500, 2100, 2800');
  ok(g.ev('NIVEIS_CONFIG[9].nomeKey') === 'nivel.nome.10', 'nomeKey do nível 10');
  [[2099, 8], [2100, 9], [2799, 9], [2800, 10], [99999, 10]].forEach(function (p) { ok(g.ev('nivelPelaReputacao(' + p[0] + ')') === p[1], 'Reputação ' + p[0] + ' devia dar nível ' + p[1]); });
  ok(g.ev('NIVEL_NECESSARIO_POR_ECRA.roxo') === 10 && g.ev('NIVEL_NECESSARIO_POR_ECRA.camara') === 9 && g.ev('NIVEL_NECESSARIO_POR_ECRA.lagar') === 8, 'roxo: 10, a câmara continua no 9 e o lagar no 8');
  const n = g.ev('Math.max.apply(null, Object.keys(NIVEL_NECESSARIO_POR_ECRA).map(function (k) { return NIVEL_NECESSARIO_POR_ECRA[k]; }))');
  ok(n === g.ev('NIVEIS_CONFIG.length'), 'o ecrã mais alto exige o último nível (10)');
  ok(g.ev("state.acesso.jogadorAntigo = false; state.reputacao = 2799; ecraDesbloqueado('roxo')") === false, 'a Cepa Roxa devia estar trancada no nível 9 (jogador novo)');
  ok(g.ev("state.reputacao = 2800; ecraDesbloqueado('roxo')") === true, 'a Cepa Roxa devia abrir no nível 10');
  ok(g.ev("state.reputacao = 2799; ecraDesbloqueado('camara')") === true, 'a Câmara continua aberta no nível 9');
  ok(g.ev("state.reputacao = 300; state.acesso.jogadorAntigo = true; ecraDesbloqueado('roxo')") === true, 'um jogador antigo abre a Cepa Roxa antes do nível 10 (como o Lagar e a Câmara)');
  ['pt', 'en', 'es'].forEach(function (l) { ok(g.ev('TRANSLATIONS.' + l + '["nivel.nome.10"]') === 'Moscatel Roxo', 'o nível 10 chama-se "Moscatel Roxo" em ' + l); });
  // É o último: a barra enche e diz "nível máximo".
  ok(g.ev('NIVEIS_CONFIG[nivelPelaReputacao(2800)] === undefined'), 'no nível 10 já não há nível seguinte (aparece "nível máximo")');
  ok(g.ev('NIVEIS_CONFIG[nivelPelaReputacao(2799)] !== undefined'), 'no nível 9 ainda há nível seguinte');
}

// 2. História do nível 10: 3 falas com as 3 imagens pedidas, todas já existentes; textos nas 3 línguas; tom de conclusão.
{
  const g = abrir();
  const H = g.json('HISTORIA_NIVEIS[10]');
  ok(Array.isArray(H) && H.length === 3 && H.map(function (f) { return f.chave; }).join() === 'historia.nivel10.1,historia.nivel10.2,historia.nivel10.3', '3 falas do nível 10');
  ok(H.map(function (f) { return f.foto; }).join() === 'assets/ecras/cimo_da_colina_apontar.jpg,assets/mapa/mapa_quinta.jpg,assets/ecras/perfil_yoshi_cat_e_chizo.jpg', 'imagens da história: cimo_da_colina_apontar, mapa_quinta, perfil_yoshi_cat_e_chizo');
  H.forEach(function (f) { ok(fs.existsSync(path.join(RAIZ, f.foto)), 'a imagem existe: ' + f.foto); });
  ['pt', 'en', 'es'].forEach(function (l) { H.forEach(function (f) { const v = g.ev('TRANSLATIONS.' + l + '["' + f.chave + '"]'); ok(typeof v === 'string' && v.trim() !== '', 'falta ' + f.chave + ' em ' + l); }); });
  ok(/Câmara de Provadores/.test(g.ev('TRANSLATIONS.pt["historia.nivel10.1"]')) && /Moscatel Roxo/.test(g.ev('TRANSLATIONS.pt["historia.nivel10.2"]')) && /Setúbal/.test(g.ev('TRANSLATIONS.pt["historia.nivel10.2"]')), 'a história fala da Câmara de Provadores e do Moscatel Roxo, a casta rara de Setúbal');
  ok(/Obrigado/.test(g.ev('TRANSLATIONS.pt["historia.nivel10.3"]')) && /Thank you/.test(g.ev('TRANSLATIONS.en["historia.nivel10.3"]')) && /Gracias/.test(g.ev('TRANSLATIONS.es["historia.nivel10.3"]')), 'a história fecha com um agradecimento (tom de conclusão) nas 3 línguas');
  const h = abrir(saveNivel10());
  h.ev('mostrarHistoriaSubidaNivel(9, 10)');
  ok(h.ev('FALAS.length') === 1 && h.json('FALAS[0].f').length === 3 && h.json('FALAS[0].f')[2].foto === 'assets/ecras/perfil_yoshi_cat_e_chizo.jpg', 'subir do 9 ao 10 mostra só as 3 falas do nível 10');
}

// 3. state.roxo: por omissão null/0 (jogo novo, save antigo, nuvem), reparado se vier estranho, e nada mais muda.
{
  ok(JSON.stringify(abrir().json('state.roxo')) === '{"brindeDia":null,"dias":0}', 'jogo novo: roxo { brindeDia: null, dias: 0 }');
  const g = abrir({ reputacao: 2900, uvas: 9, garrafas: 14, camara: { provaDia: '2026-10-05', dias: 3 }, lagar: { ultimoDia: '2026-10-05', dias: 3, mesaDia: '2026-10-06', assaltoDia: '2026-10-06' } });
  ok(JSON.stringify(g.json('state.roxo')) === '{"brindeDia":null,"dias":0}', 'save do PR anterior (sem roxo) ganha o valor por omissão');
  ok(g.ev('state.reputacao') === 2900 && g.ev('state.garrafas') === 14 && JSON.stringify(g.json('state.camara')) === '{"provaDia":"2026-10-05","dias":3}' && JSON.stringify(g.json('state.lagar')) === '{"ultimoDia":"2026-10-05","dias":3,"mesaDia":"2026-10-06","assaltoDia":"2026-10-06"}', 'o resto do save (Câmara e Lagar incluídos) fica igual');
  ok(JSON.stringify(g.json('mergeDeep(defaultState(), { reputacao: 5 }).roxo')) === '{"brindeDia":null,"dias":0}', 'estado da nuvem sem roxo ganha o valor por omissão');
  ok(JSON.stringify(g.json('mergeDeep(defaultState(), { roxo: { dias: 2 } }).roxo')) === '{"brindeDia":null,"dias":2}', 'estado da nuvem com roxo parcial mantém o que traz e ganha o resto');
  [['null', 'state.roxo = null'], ['texto', "state.roxo = 'x'"], ['lista', 'state.roxo = []'], ['dia inválido', "state.roxo = { brindeDia: 12345, dias: 'x' }"], ['dias negativos', "state.roxo = { brindeDia: null, dias: -4 }"], ['dias fração', "state.roxo = { brindeDia: null, dias: 1.5 }"]].forEach(function (c) {
    const e = abrir(saveNivel10()); e.ev(c[1]);
    ok(e.json("roxoPodeBrindar(state, '2026-10-09')").ok === true, 'estado estranho (' + c[0] + '): pode brindar, sem rebentar');
    ok(e.json("roxoBrindar(state, '2026-10-09')").ok === true && e.ev('state.roxo.dias') === 1 && e.ev('state.roxo.brindeDia') === '2026-10-09', 'estado estranho (' + c[0] + '): repara-se e conta 1 dia');
  });
}

// 4. As regras: +15, uma vez por dia, exige 10 garrafas, não gasta nada, recusar não altera nada.
{
  const g = abrir(saveNivel10());
  g.puro();
  ok(g.ev('ROXO_CONFIG.reputacao') === 15 && g.ev('ROXO_CONFIG.garrafasMinimas') === 10, '+15 de Reputação e 10 garrafas');
  const antes = JSON.parse(g.estado());
  const r = g.json("roxoBrindar(state, '2026-10-09')");
  ok(r.ok && r.reputacaoGanha === 15 && r.motivo === null, 'brindar: ' + JSON.stringify(r));
  const esperado = JSON.parse(JSON.stringify(antes)); esperado.reputacao = 2815; esperado.roxo = { brindeDia: '2026-10-09', dias: 1 };
  ok(g.estado() === JSON.stringify(esperado), 'brindar só mexe na Reputação (+15) e em roxo: nem garrafas, nem uvas, nem gotas, nem Despensa, nem Lagar, nem Câmara, nem capítulos');
  ok(g.ev('state.garrafas') === 12, 'as garrafas não se gastam (continuam 12)');
  const a = g.estado();
  const r2 = g.json("roxoBrindar(state, '2026-10-09')");
  ok(!r2.ok && r2.motivo === 'ja_hoje' && r2.reputacaoGanha === 0 && g.estado() === a, 'mesmo dia: recusado (ja_hoje) sem alterar nada');
  ok(g.json("roxoPodeBrindar(state, '2026-10-09')").motivo === 'ja_hoje', 'roxoPodeBrindar diz ja_hoje');
  const r3 = g.json("roxoBrindar(state, '2026-10-08')");
  ok(!r3.ok && r3.motivo === 'dia_anterior' && g.estado() === a, 'dia anterior: recusado sem alterar nada');
  ok(g.json("roxoBrindar(state, '2026-10-10')").ok && g.json("roxoBrindar(state, '2026-10-11')").ok && g.ev('state.roxo.dias') === 3 && g.ev('state.reputacao') === 2845, '3 dias diferentes: dias 3 e +45 de Reputação');
  // Garrafas a menos: diz quantas faltam, não altera nada.
  [[9, 1], [5, 5], [0, 10]].forEach(function (c) {
    const s = abrir(saveNivel10({ garrafas: c[0] }));
    const b = s.estado();
    const p = s.json("roxoPodeBrindar(state, '2026-10-09')");
    ok(!p.ok && p.motivo === 'faltam_garrafas' && p.faltam === c[1] && p.tem === c[0], c[0] + ' garrafas: faltam ' + c[1] + ': ' + JSON.stringify(p));
    ok(!s.json("roxoBrindar(state, '2026-10-09')").ok && s.estado() === b, c[0] + ' garrafas: recusado sem alterar nada');
  });
  const t = abrir(saveNivel10({ garrafas: 10 })); ok(t.json("roxoPodeBrindar(state, '2026-10-09')").ok === true, 'exatamente 10 garrafas chega');
  [['null', 'null'], ['texto', '"12"'], ['fração', '9.5'], ['negativo', '-2']].forEach(function (c) {
    const e = abrir(saveNivel10()); e.ev('state.garrafas = ' + c[1]);
    ok(e.json("roxoPodeBrindar(state, '2026-10-09')").motivo === 'faltam_garrafas', 'garrafas inválidas (' + c[0] + ') contam como 0');
  });
  ok(g.json("roxoBrindar(null, '2026-10-12')").motivo === 'estado_invalido', 'estado null');
  ok(g.json("roxoBrindar(state, 'ontem')").motivo === 'dia_invalido' && g.json('roxoBrindar(state, 5)').motivo === 'dia_invalido', 'dia inválido');
  const k = abrir(saveNivel10()); k.ev('state.reputacao = "x"');
  ok(k.json("roxoBrindar(state, '2026-10-09')").ok === true && k.ev('state.reputacao') === 15, 'Reputação inválida conta como 0 e soma +15');
  // Pureza: sem relógio nem sorteio nem gravação (as regras, antes do ecrã).
  const fonte = ler(ROXO_JS);
  const regras = fonte.slice(0, fonte.indexOf('// ECRÃ E LINHA DA QUINTA')).replace(/\/\/.*$/gm, '');
  ok(regras.length > 500 && !/Date\.now|Math\.random|new Date|saveState|localStorage/.test(regras), 'as regras do Roxo são puras (sem relógio, sorteio nem gravação)');
  ok(!/(state|estado)\.(garrafas|uvas|gotas|despensa|lagar|camara)\s*(-=|\+=|=[^=])/.test(regras), 'as regras não escrevem em garrafas, uvas, gotas, Despensa, Lagar nem Câmara');
}

// 5. Capítulo 10: conta dias DIFERENTES; nunca trava o nível; celebração; ?capitulo=1 a 10.
{
  const g = abrir(saveNivel10());
  ok(g.ev('CAPITULOS_CONFIG.length') === 10 && g.ev('CAPITULOS_CONFIG[9].id') === 'cap10' && g.ev('CAPITULOS_CONFIG[9].nivel') === 10, 'devia haver exatamente 10 capítulos, o último o cap10 no nível 10');
  ok(JSON.stringify(g.json('CAPITULOS_CONFIG[9].criterio')) === JSON.stringify([{ tipo: 'numero', caminho: 'roxo.dias', alvo: 3 }]), 'critério do cap10');
  const lido = function () { return g.json('capitulosLerCriterio(CAPITULOS_CONFIG[9])'); };
  let r = lido(); ok(r.atual === 0 && r.total === 3 && !r.cumprido, 'sem brindar: 0 / 3');
  g.ev("roxoBrindar(state, '2026-10-09')"); g.ev("roxoBrindar(state, '2026-10-09')");
  r = lido(); ok(r.atual === 1 && !r.cumprido, 'brindar duas vezes no mesmo dia conta 1 / 3');
  g.ev("roxoBrindar(state, '2026-10-10')");
  r = lido(); ok(r.atual === 2 && !r.cumprido, '2 dias: 2 / 3');
  ok(g.ev('capitulosAvaliarCelebracao()') === false, 'com 2 dias não há celebração do cap10');
  g.ev("roxoBrindar(state, '2026-10-11')");
  r = lido(); ok(r.atual === 3 && r.cumprido === true, '3 dias diferentes cumprem o cap10');
  ok(g.ev('capitulosAvaliarCelebracao()') === true && g.ev('FALAS[0].f[0]') === g.ev('TRANSLATIONS.pt["capitulo.cap10.conclusao"]'), 'com 3 dias celebra o cap10 com a sua conclusão');
  ok(abrir(saveNivel10()).ev('nivelPelaReputacao(state.reputacao)') === 10, 'o cap10 por fazer não trava o nível 10');
  const h = abrir(saveNivel10({ reputacao: 2799 })); h.ev('state.capitulos.concluidos.cap10 = true');
  ok(h.ev('nivelPelaReputacao(state.reputacao)') === 9, 'o cap10 concluído não sobe o nível sozinho');
  const v = abrir(saveNivel10()); v.ev('capitulosAvaliarEmSilencio()');
  ok(v.ev('state.capitulos.concluidos.cap10') === undefined && v.ev('state.capitulos.concluidos.cap9') === true, 'sem brindar, o cap10 não se marca; o cap9 fica');
  ok(g.ev('CAPITULOS_CONFIG[8].criterio[0].caminho') === 'camara.dias' && g.ev('CAPITULOS_CONFIG[7].criterio[0].caminho') === 'lagar.dias', 'o cap9 e o cap8 continuam a ler camara.dias e lagar.dias');
  [1, 9, 10].forEach(function (n) { ok((abrir(null, '?capitulo=' + n).json('capitulosParametrosTeste()') || {}).id === 'cap' + n, '?capitulo=' + n + ' é válido'); });
  ok((abrir(null, '?capitulo=cap10').json('capitulosParametrosTeste()') || {}).id === 'cap10', '?capitulo=cap10 é válido');
  ['11', '0', '100', '1a'].forEach(function (n) { ok(abrir(null, '?capitulo=' + n).json('capitulosParametrosTeste()') === null, '?capitulo=' + n + ' não é válido'); });
}

// 6. Textos do capítulo e da Cepa Roxa nas 3 línguas; ligação ao jogo; imagens que já existem; comentários.
{
  const g = abrir();
  ['pt', 'en', 'es'].forEach(function (l) {
    const s = g.json('CAPITULOS_STRINGS.' + l + '.cap10');
    ok(s && typeof s.titulo === 'string' && s.titulo.trim() !== '' && typeof s.objetivo === 'string' && s.objetivo.trim() !== '', 'título e objetivo do cap10 em ' + l);
    const c = g.ev('TRANSLATIONS.' + l + '["capitulo.cap10.conclusao"]');
    ok(typeof c === 'string' && c.trim() !== '' && c.length <= 90, 'conclusão do cap10 em ' + l + ' com 90 caracteres no máximo');
    ['roxo.title', 'roxo.linha', 'roxo.desc', 'roxo.btn', 'roxo.faltam', 'roxo.jaHoje', 'roxo.dias', 'roxo.ok', 'roxo.fala', 'roxo.relogio'].forEach(function (k) {
      const v = g.ev('TRANSLATIONS.' + l + '["' + k + '"]');
      ok(typeof v === 'string' && v.trim() !== '', 'falta ' + k + ' em ' + l);
    });
    ok(g.ev('TRANSLATIONS.' + l + '["roxo.desc"]').indexOf('{rep}') !== -1 && g.ev('TRANSLATIONS.' + l + '["roxo.desc"]').indexOf('{n}') !== -1 && g.ev('TRANSLATIONS.' + l + '["roxo.ok"]').indexOf('{rep}') !== -1 && g.ev('TRANSLATIONS.' + l + '["roxo.dias"]').indexOf('{n}') !== -1 && g.ev('TRANSLATIONS.' + l + '["roxo.faltam"]').indexOf('{n}') !== -1 && g.ev('TRANSLATIONS.' + l + '["roxo.faltam"]').indexOf('{tem}') !== -1, 'marcadores {rep}, {n} e {tem} em ' + l);
  });
  ok(g.ev('TRANSLATIONS.pt["roxo.title"]') === 'A Cepa Roxa' && g.ev('TRANSLATIONS.en["roxo.title"]') === 'The Purple Vine' && g.ev('TRANSLATIONS.es["roxo.title"]') === 'La Cepa Morada', 'os 3 nomes do ecrã');
  ok(g.ev('TRANSLATIONS.pt["roxo.btn"]') === 'Brindar com o Moscatel Roxo', 'botão PT: Brindar com o Moscatel Roxo');
  const src = ler(ROXO_JS).split('\n').filter(function (l) { return !/^\s*\/\//.test(l); }).join('\n');
  ok(!/despensa|ESTRADA_|marcarObjetivo|nuvem/i.test(src), 'roxo.js não mexe na Despensa, na Estrada, nos objetivos nem na nuvem');
  const clique = src.slice(src.indexOf('function roxoBrindarClique()'));
  ok((src.match(/roxoBrindar\(/g) || []).length === 2 && clique.indexOf('roxoBrindar(') !== -1 && clique.indexOf('saveState(state)') !== -1 && (src.match(/saveState\(/g) || []).length === 1, 'só o clique (roxoBrindarClique) brinda e grava');
  ok(g.ev('ROXO_CONFIG.imagemResultado') === 'assets/garrafas/garrafa_3_ambar.jpg' && fs.existsSync(path.join(RAIZ, 'assets/garrafas/garrafa_3_ambar.jpg')), 'imagem do resultado existe');
  const main = ler(path.join(RAIZ, 'js', 'main.js'));
  ok(/roxo:\s*\{\s*src:\s*'assets\/ecras\/poda_vinha\.jpg'/.test(main) && fs.existsSync(path.join(RAIZ, 'assets/ecras/poda_vinha.jpg')) && /roxo:\s*'quinta'/.test(main) && /renderRoxo\(\)/.test(main) && /atualizarLinhaRoxoQuinta/.test(main), 'main.js liga a Cepa Roxa (fundo poda_vinha, barra, render e linha da Quinta)');
  ok(/atualizarLinhaRoxoQuinta/.test(ler(path.join(RAIZ, 'js', 'niveis.js'))), 'o cartão do nível refaz a linha da Cepa Roxa');
  const html = ler(path.join(RAIZ, 'index.html'));
  ok(/id="screen-roxo"/.test(html) && /id="roxo-container"/.test(html) && /id="roxo-linha-container"/.test(html) && /#screen-roxo\.content/.test(html), 'index.html tem o ecrã, a linha e a classe do jogo-cheio');
  const pos = function (f) { return html.indexOf('<script src="js/' + f + '?v='); };
  ok(pos('camara.js') > 0 && pos('roxo.js') > pos('camara.js') && pos('roxo.js') < pos('main.js'), 'ordem de carga: camara.js, roxo.js, main.js');
  ok(/\.roxo-botao:disabled/.test(html), 'index.html tem o estilo do botão');
  ['niveis.js', 'capitulos.js', 'historia.js', 'visitas.js'].forEach(function (f) { ok(!/\b(1|2) a (8|9)\b/.test(ler(path.join(RAIZ, 'js', f))), 'js/' + f + ' ainda diz "1 a 8", "1 a 9" ou "2 a 9"'); });
  const st = ler(path.join(RAIZ, 'js', 'state.js'));
  ok(/roxo:\s*\{/.test(st) && /A Cepa Roxa \(Nível 10[\s\S]{0,500}NÃO se junta na nuvem/.test(st), 'state.js documenta que state.roxo não se junta na nuvem');
}

console.log(falhas === 0 ? 'OK' : falhas + ' FALHA(S)');
process.exit(falhas === 0 ? 0 : 1);
