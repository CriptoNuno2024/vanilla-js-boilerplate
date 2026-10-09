#!/usr/bin/env node
// Nível 9 "Câmara de Provadores" e A Câmara (tarefa "Provar com o Dr. Henrique"): NIVEIS_CONFIG (js/niveis.js), a tranca do ecrã
// "camara", o capítulo 9 (js/capitulos.js), state.camara (js/state.js), as regras puras de js/camara.js, os textos nas 3 línguas e
// a ligação ao jogo. Corre state.js, i18n.js, niveis.js, capitulos.js, historia.js e camara.js REAIS num ambiente simulado (vm),
// sem browser nem conta real.
//
// Uso: node scripts/verificar-camara.js
// CAMARA_JS=caminho  corre sobre outra versão de js/camara.js (provas negativas).
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const CAMARA_JS = process.env.CAMARA_JS || path.join(RAIZ, 'js', 'camara.js');
let falhas = 0;
function ok(cond, msg) { if (!cond) { falhas++; console.log('FALHA: ' + msg); } }
const ler = function (f) { return fs.readFileSync(f, 'utf8'); };

function abrir(guardadoInicial, search, puro) {
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
  vm.runInContext(ler(CAMARA_JS), cx, { filename: 'camara.js' });
  if (puro) vm.runInContext('Math.random = function () { throw new Error("Math.random proibido"); }; Date.now = function () { throw new Error("Date.now proibido"); };', cx);
  const g = { cx: cx };
  g.ev = function (c) { return vm.runInContext(c, cx); };
  g.json = function (c) { return JSON.parse(vm.runInContext('JSON.stringify(' + c + ')', cx)); };
  g.estado = function () { return vm.runInContext('JSON.stringify(state)', cx); };
  return g;
}

const OITO = { cap1: true, cap2: true, cap3: true, cap4: true, cap5: true, cap6: true, cap7: true, cap8: true };
const saveNivel9 = function (extra) {
  return Object.assign({ reputacao: 2100, uvas: 100, gotas: 7, garrafas: 3, ultimaGravacaoEm: 1, acesso: { jogadorAntigo: false, introMostrada: true }, niveis: { nivelMostrado: 8, garrafasAoNivel6: 0 },
    capitulos: { iniciado: true, celebradosMigrado: true, concluidos: Object.assign({}, OITO), celebrados: Object.assign({}, OITO) },
    despensa: { recebidos: { queijo_azeitao: 2 }, entregues: { queijo_azeitao: 1 }, primeiraTroca: {}, hoje: { dia: null, feitas: {} } },
    lagar: { ultimoDia: '2026-10-08', dias: 3, mesaDia: '2026-10-08', assaltoDia: null } }, extra || {});
};

// 1. Nível 9: limiar 2100, nome nas 3 línguas, tranca do ecrã "camara", o Lagar continua no 8.
{
  const g = abrir();
  ok(g.ev('NIVEIS_CONFIG.length') >= 9, 'devia haver pelo menos 9 níveis (o 10 está em scripts/verificar-roxo.js)');
  ok(JSON.stringify(g.json('NIVEIS_CONFIG.slice(0, 9).map(function (n) { return n.min; })')) === '[0,15,50,120,300,600,1000,1500,2100]', 'limiares até 1500, 2100');
  ok(g.ev('NIVEIS_CONFIG[8].nomeKey') === 'nivel.nome.9', 'nomeKey do nível 9');
  [[1500, 8], [2099, 8], [2100, 9], [2799, 9]].forEach(function (p) { ok(g.ev('nivelPelaReputacao(' + p[0] + ')') === p[1], 'Reputação ' + p[0] + ' devia dar nível ' + p[1]); });
  ok(g.ev('NIVEL_NECESSARIO_POR_ECRA.camara') === 9 && g.ev('NIVEL_NECESSARIO_POR_ECRA.lagar') === 8, 'camara: 9 e o lagar continua no 8');
  ok(g.ev("state.acesso.jogadorAntigo = false; state.reputacao = 2099; ecraDesbloqueado('camara')") === false, 'a Câmara devia estar trancada no nível 8 (jogador novo)');
  ok(g.ev("state.reputacao = 2100; ecraDesbloqueado('camara')") === true, 'a Câmara devia abrir no nível 9');
  ok(g.ev("state.reputacao = 2099; ecraDesbloqueado('lagar')") === true, 'o Lagar continua aberto no nível 8');
  ok(g.ev("state.reputacao = 300; state.acesso.jogadorAntigo = true; ecraDesbloqueado('camara')") === true, 'um jogador antigo abre a Câmara antes do nível 9 (como o Lagar)');
  ok(g.ev('TRANSLATIONS.pt["nivel.nome.9"]') === 'Câmara de Provadores' && g.ev('TRANSLATIONS.en["nivel.nome.9"]') === 'Tasting Chamber' && g.ev('TRANSLATIONS.es["nivel.nome.9"]') === 'Cámara de Catadores', 'os 3 nomes do nível 9');
  // O nível 9 já não é o último: há o nível 10 (ver verificar-roxo.js).
  ok(g.ev('NIVEIS_CONFIG[8].min') === 2100 && g.ev('NIVEIS_CONFIG.length') >= 10, 'depois do nível 9 há o nível 10');
}

// 2. História do nível 9: 3 falas com as 3 imagens pedidas, todas já existentes; textos nas 3 línguas.
{
  const g = abrir();
  const H = g.json('HISTORIA_NIVEIS[9]');
  ok(Array.isArray(H) && H.length === 3 && H.map(function (f) { return f.chave; }).join() === 'historia.nivel9.1,historia.nivel9.2,historia.nivel9.3', '3 falas do nível 9');
  ok(H.map(function (f) { return f.foto; }).join() === 'assets/vinha/barril_dourado.jpg,assets/ecras/sao_martinho_prova.jpg,assets/ecras/yoshi_cat_fala_das_uvas.jpg', 'imagens da história: barril_dourado, sao_martinho_prova, yoshi_cat_fala_das_uvas');
  H.forEach(function (f) { ok(fs.existsSync(path.join(RAIZ, f.foto)), 'a imagem existe: ' + f.foto); });
  ['pt', 'en', 'es'].forEach(function (l) { H.forEach(function (f) { const v = g.ev('TRANSLATIONS.' + l + '["' + f.chave + '"]'); ok(typeof v === 'string' && v.trim() !== '', 'falta ' + f.chave + ' em ' + l); }); });
  ok(/Dr\. Henrique/.test(g.ev('TRANSLATIONS.pt["historia.nivel9.1"]')) && /Câmara/.test(g.ev('TRANSLATIONS.pt["historia.nivel9.2"]')), 'a história fala do Dr. Henrique e da Câmara');
  // Subir 8 -> 9 mostra a história do 9 (e só essa).
  const h = abrir(saveNivel9());
  h.ev('state.niveis.nivelMostrado = 8; verificarSubidaNivel = verificarSubidaNivel;');
  h.ev("mostrarHistoriaSubidaNivel(8, 9)");
  ok(h.ev('FALAS.length') === 1 && h.json('FALAS[0].f').length === 3 && h.json('FALAS[0].f')[2].foto === 'assets/ecras/yoshi_cat_fala_das_uvas.jpg', 'subir do 8 ao 9 mostra só as 3 falas do nível 9');
}

// 3. state.camara: por omissão null/0 (jogo novo, save antigo, nuvem), reparado se vier estranho, e nada mais muda.
{
  ok(JSON.stringify(abrir().json('state.camara')) === '{"provaDia":null,"dias":0}', 'jogo novo: camara { provaDia: null, dias: 0 }');
  const g = abrir({ reputacao: 2200, uvas: 9, garrafas: 4, lagar: { ultimoDia: '2026-10-05', dias: 3, mesaDia: '2026-10-06', assaltoDia: '2026-10-06' } });
  ok(JSON.stringify(g.json('state.camara')) === '{"provaDia":null,"dias":0}', 'save do PR anterior (sem camara) ganha o valor por omissão');
  ok(g.ev('state.reputacao') === 2200 && g.ev('state.uvas') === 9 && g.ev('state.garrafas') === 4 && JSON.stringify(g.json('state.lagar')) === '{"ultimoDia":"2026-10-05","dias":3,"mesaDia":"2026-10-06","assaltoDia":"2026-10-06"}', 'o resto do save (incluindo o Lagar) fica igual');
  ok(JSON.stringify(g.json('mergeDeep(defaultState(), { reputacao: 5 }).camara')) === '{"provaDia":null,"dias":0}', 'estado da nuvem sem camara ganha o valor por omissão');
  ok(JSON.stringify(g.json('mergeDeep(defaultState(), { camara: { dias: 2 } }).camara')) === '{"provaDia":null,"dias":2}', 'estado da nuvem com camara parcial mantém o que traz e ganha o resto');
  // Valores estranhos: contam como "nunca" e são reparados ao provar.
  [['null', 'state.camara = null'], ['texto', "state.camara = 'x'"], ['lista', 'state.camara = []'], ['dia inválido', "state.camara = { provaDia: 12345, dias: 'x' }"], ['dias negativos', "state.camara = { provaDia: null, dias: -4 }"], ['dias fração', "state.camara = { provaDia: null, dias: 1.5 }"]].forEach(function (c) {
    const e = abrir(saveNivel9()); e.ev(c[1]);
    ok(e.json("camaraPodeProvar(state, '2026-10-09')").ok === true, 'estado estranho (' + c[0] + '): pode provar, sem rebentar');
    ok(e.json("camaraProvar(state, '2026-10-09')").ok === true && e.ev('state.camara.dias') === 1 && e.ev('state.camara.provaDia') === '2026-10-09', 'estado estranho (' + c[0] + '): repara-se e conta 1 dia');
  });
}

// 4. As regras: +8, uma vez por dia, exige 1 garrafa, não gasta nada, recusar não altera nada.
{
  const g = abrir(saveNivel9(), null, true);
  ok(g.ev('CAMARA_CONFIG.reputacao') === 8 && g.ev('CAMARA_CONFIG.garrafasMinimas') === 1, '+8 de Reputação e 1 garrafa');
  const antes = JSON.parse(g.estado());
  const r = g.json("camaraProvar(state, '2026-10-09')");
  ok(r.ok && r.reputacaoGanha === 8 && r.motivo === null, 'provar: ' + JSON.stringify(r));
  const esperado = JSON.parse(JSON.stringify(antes)); esperado.reputacao = 2108; esperado.camara = { provaDia: '2026-10-09', dias: 1 };
  ok(g.estado() === JSON.stringify(esperado), 'provar só mexe na Reputação (+8) e em camara: nem garrafas, nem uvas, nem gotas, nem Despensa, nem Lagar, nem capítulos');
  ok(g.ev('state.garrafas') === 3, 'as garrafas não se gastam (continuam 3)');
  // Uma vez por dia.
  const a = g.estado();
  const r2 = g.json("camaraProvar(state, '2026-10-09')");
  ok(!r2.ok && r2.motivo === 'ja_hoje' && r2.reputacaoGanha === 0 && g.estado() === a, 'mesmo dia: recusado (ja_hoje) sem alterar nada');
  ok(g.json("camaraPodeProvar(state, '2026-10-09')").motivo === 'ja_hoje', 'camaraPodeProvar diz ja_hoje');
  // Relógio atrás.
  const r3 = g.json("camaraProvar(state, '2026-10-08')");
  ok(!r3.ok && r3.motivo === 'dia_anterior' && g.estado() === a, 'dia anterior: recusado sem alterar nada');
  // Dias diferentes contam; 3 dias seguidos = 3.
  ok(g.json("camaraProvar(state, '2026-10-10')").ok && g.json("camaraProvar(state, '2026-10-11')").ok && g.ev('state.camara.dias') === 3 && g.ev('state.reputacao') === 2124, '3 dias diferentes: dias 3 e +24 de Reputação');
  // Sem garrafas: explica o que falta, não altera nada.
  const s = abrir(saveNivel9({ garrafas: 0 }));
  const b = s.estado();
  const p = s.json("camaraPodeProvar(state, '2026-10-09')");
  ok(!p.ok && p.motivo === 'sem_garrafas' && p.faltam === 1, 'sem garrafas: falta 1: ' + JSON.stringify(p));
  ok(!s.json("camaraProvar(state, '2026-10-09')").ok && s.estado() === b, 'sem garrafas: recusado sem alterar nada');
  s.ev('state.garrafas = 1'); ok(s.json("camaraPodeProvar(state, '2026-10-09')").ok === true, 'exatamente 1 garrafa chega');
  [['null', 'null'], ['texto', '"3"'], ['fração', '0.5'], ['negativo', '-2']].forEach(function (c) {
    const e = abrir(saveNivel9()); e.ev('state.garrafas = ' + c[1]);
    ok(e.json("camaraPodeProvar(state, '2026-10-09')").motivo === 'sem_garrafas', 'garrafas inválidas (' + c[0] + ') contam como 0');
  });
  // Entradas inválidas.
  ok(g.json("camaraProvar(null, '2026-10-11')").motivo === 'estado_invalido', 'estado null');
  ok(g.json("camaraProvar(state, 'ontem')").motivo === 'dia_invalido' && g.json('camaraProvar(state, 5)').motivo === 'dia_invalido', 'dia inválido');
  const k = abrir(saveNivel9()); k.ev('state.reputacao = "x"');
  ok(k.json("camaraProvar(state, '2026-10-09')").ok === true && k.ev('state.reputacao') === 8, 'Reputação inválida conta como 0 e soma +8');
  // Pureza: sem relógio nem sorteio nem gravação (as regras, antes do ecrã).
  const fonte = ler(CAMARA_JS);
  const regras = fonte.slice(0, fonte.indexOf('// ECRÃ E LINHA DA QUINTA')).replace(/\/\/.*$/gm, '');
  ok(regras.length > 500 && !/Date\.now|Math\.random|new Date|saveState|localStorage/.test(regras), 'as regras da Câmara são puras (sem relógio, sorteio nem gravação)');
  ok(!/state\.(garrafas|uvas|gotas|despensa|lagar|capitulos)\s*(-=|\+=|=[^=])/.test(regras) && !/estado\.(garrafas|uvas|gotas|despensa|lagar)\s*(-=|\+=|=[^=])/.test(regras), 'as regras não escrevem em garrafas, uvas, gotas, Despensa nem Lagar');
}

// 5. Capítulo 9: conta dias DIFERENTES; nunca trava o nível; celebração; ?capitulo=9.
{
  const g = abrir(saveNivel9({ reputacao: 2100 }));
  ok(g.ev('CAPITULOS_CONFIG.length') >= 9 && g.ev('CAPITULOS_CONFIG[8].id') === 'cap9' && g.ev('CAPITULOS_CONFIG[8].nivel') === 9, 'devia haver o cap9 no nível 9');
  ok(JSON.stringify(g.json('CAPITULOS_CONFIG[8].criterio')) === JSON.stringify([{ tipo: 'numero', caminho: 'camara.dias', alvo: 3 }]), 'critério do cap9');
  const lido = function () { return g.json('capitulosLerCriterio(CAPITULOS_CONFIG[8])'); };
  let r = lido(); ok(r.atual === 0 && r.total === 3 && !r.cumprido, 'sem provar: 0 / 3');
  g.ev("camaraProvar(state, '2026-10-09')"); g.ev("camaraProvar(state, '2026-10-09')");
  r = lido(); ok(r.atual === 1 && !r.cumprido, 'provar duas vezes no mesmo dia conta 1 / 3');
  g.ev("camaraProvar(state, '2026-10-10')");
  r = lido(); ok(r.atual === 2 && !r.cumprido, '2 dias: 2 / 3');
  ok(g.ev('capitulosAvaliarCelebracao()') === false, 'com 2 dias não há celebração do cap9');
  g.ev("camaraProvar(state, '2026-10-11')");
  r = lido(); ok(r.atual === 3 && r.cumprido === true, '3 dias diferentes cumprem o cap9');
  ok(g.ev('capitulosAvaliarCelebracao()') === true && g.ev('FALAS[0].f[0]') === g.ev('TRANSLATIONS.pt["capitulo.cap9.conclusao"]'), 'com 3 dias celebra o cap9 com a sua conclusão');
  // Nunca trava o nível; concluído não sobe sozinho; o cap8 não é afetado.
  ok(abrir(saveNivel9()).ev('nivelPelaReputacao(state.reputacao)') === 9, 'o cap9 por fazer não trava o nível 9');
  const h = abrir(saveNivel9({ reputacao: 2099 })); h.ev('state.capitulos.concluidos.cap9 = true');
  ok(h.ev('nivelPelaReputacao(state.reputacao)') === 8, 'o cap9 concluído não sobe o nível sozinho');
  const v = abrir(saveNivel9()); v.ev('capitulosAvaliarEmSilencio()');
  ok(v.ev('state.capitulos.concluidos.cap9') === undefined && v.ev('state.capitulos.concluidos.cap8') === true, 'sem provar, o cap9 não se marca; o cap8 fica');
  // O cap8 conta pisar no Lagar e continua a não contar provas (e vice-versa): campos diferentes.
  ok(g.ev('state.lagar.dias') === 3 && g.ev('CAPITULOS_CONFIG[7].criterio[0].caminho') === 'lagar.dias', 'o cap8 continua a ler lagar.dias');
  // ?capitulo=1 a 9 passam; 11 e 0 não (o 10 passou a existir, ver verificar-roxo.js).
  [1, 8, 9].forEach(function (n) { ok((abrir(null, '?capitulo=' + n).json('capitulosParametrosTeste()') || {}).id === 'cap' + n, '?capitulo=' + n + ' é válido'); });
  ok((abrir(null, '?capitulo=cap9').json('capitulosParametrosTeste()') || {}).id === 'cap9', '?capitulo=cap9 é válido');
  ok(abrir(null, '?capitulo=11').json('capitulosParametrosTeste()') === null && abrir(null, '?capitulo=0').json('capitulosParametrosTeste()') === null, '?capitulo=11 e 0 não são válidos');
}

// 6. Textos do capítulo e da Câmara nas 3 línguas; ligação ao jogo; imagens que já existem.
{
  const g = abrir();
  ['pt', 'en', 'es'].forEach(function (l) {
    const s = g.json('CAPITULOS_STRINGS.' + l + '.cap9');
    ok(s && typeof s.titulo === 'string' && s.titulo.trim() !== '' && typeof s.objetivo === 'string' && s.objetivo.trim() !== '', 'título e objetivo do cap9 em ' + l);
    const c = g.ev('TRANSLATIONS.' + l + '["capitulo.cap9.conclusao"]');
    ok(typeof c === 'string' && c.trim() !== '' && c.length <= 90, 'conclusão do cap9 em ' + l + ' com 90 caracteres no máximo');
    ['camara.title', 'camara.linha', 'camara.desc', 'camara.btn', 'camara.semGarrafas', 'camara.jaHoje', 'camara.dias', 'camara.ok', 'camara.fala', 'camara.relogio'].forEach(function (k) {
      const v = g.ev('TRANSLATIONS.' + l + '["' + k + '"]');
      ok(typeof v === 'string' && v.trim() !== '', 'falta ' + k + ' em ' + l);
    });
    ok(g.ev('TRANSLATIONS.' + l + '["camara.desc"]').indexOf('{rep}') !== -1 && g.ev('TRANSLATIONS.' + l + '["camara.ok"]').indexOf('{rep}') !== -1 && g.ev('TRANSLATIONS.' + l + '["camara.dias"]').indexOf('{n}') !== -1, 'marcadores {rep} e {n} em ' + l);
  });
  ok(g.ev('TRANSLATIONS.pt["camara.btn"]') === 'Provar com o Dr. Henrique', 'botão PT: Provar com o Dr. Henrique');
  const src = ler(CAMARA_JS).split('\n').filter(function (l) { return !/^\s*\/\//.test(l); }).join('\n');
  ok(!/despensa|ESTRADA_|marcarObjetivo|nuvem/i.test(src), 'camara.js não mexe na Despensa, na Estrada, nos objetivos nem na nuvem');
  const clique = src.slice(src.indexOf('function camaraProvarClique()'));
  ok((src.match(/camaraProvar\(/g) || []).length === 2 && clique.indexOf('camaraProvar(') !== -1 && clique.indexOf('saveState(state)') !== -1 && (src.match(/saveState\(/g) || []).length === 1, 'só o clique (camaraProvarClique) prova e grava');
  ok(/personagem: 'henrique'/.test(src) && fs.existsSync(path.join(RAIZ, 'assets', 'personagens', 'henrique.jpg')), 'depois de provar fala o Dr. Henrique, com a cara dele (assets/personagens/henrique.jpg)');
  ok(g.ev('CAMARA_CONFIG.imagemResultado') === 'assets/garrafas/garrafa_4_cobre.jpg' && fs.existsSync(path.join(RAIZ, 'assets/garrafas/garrafa_4_cobre.jpg')), 'imagem do resultado existe');
  const main = ler(path.join(RAIZ, 'js', 'main.js'));
  ok(/camara:\s*\{\s*src:\s*'assets\/vinha\/barril_dourado\.jpg'/.test(main) && fs.existsSync(path.join(RAIZ, 'assets/vinha/barril_dourado.jpg')) && /camara:\s*'quinta'/.test(main) && /renderCamara\(\)/.test(main) && /atualizarLinhaCamaraQuinta/.test(main), 'main.js liga a Câmara (fundo barril_dourado, barra, render e linha da Quinta)');
  const niv = ler(path.join(RAIZ, 'js', 'niveis.js'));
  ok(/atualizarLinhaCamaraQuinta/.test(niv), 'o cartão do nível refaz a linha da Câmara');
  const html = ler(path.join(RAIZ, 'index.html'));
  ok(/id="screen-camara"/.test(html) && /id="camara-container"/.test(html) && /id="camara-linha-container"/.test(html) && /#screen-camara\.content/.test(html), 'index.html tem o ecrã, a linha e a classe do jogo-cheio');
  const pos = function (f) { return html.indexOf('<script src="js/' + f + '?v='); };
  ok(pos('lagar.js') > 0 && pos('camara.js') > pos('lagar.js') && pos('camara.js') < pos('main.js'), 'ordem de carga: lagar.js, camara.js, main.js');
  ok(/\.camara-botao:disabled/.test(html), 'index.html tem o estilo do botão');
  // Comentários desatualizados: nada diz "1 a 8" nos ficheiros do nível.
  ['niveis.js', 'capitulos.js', 'historia.js', 'visitas.js'].forEach(function (f) { ok(!/\b(1|2) a (8|9)\b/.test(ler(path.join(RAIZ, 'js', f))), 'js/' + f + ' ainda diz "1 a 8", "1 a 9" ou "2 a 9"'); });
  // O comentário de state.js diz que não se junta na nuvem.
  const st = ler(path.join(RAIZ, 'js', 'state.js'));
  ok(/camara:\s*\{/.test(st) && /A Câmara \(Nível 9[\s\S]{0,400}NÃO se junta na nuvem/.test(st), 'state.js documenta que state.camara não se junta na nuvem');
}

console.log(falhas === 0 ? 'OK' : falhas + ' FALHA(S)');
process.exit(falhas === 0 ? 0 : 1);
