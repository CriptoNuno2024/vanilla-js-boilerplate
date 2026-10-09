#!/usr/bin/env node
// Nível 8 "Quinta de Portas Abertas" e O Lagar (tarefa "Pisar as uvas"): NIVEIS_CONFIG (js/niveis.js), a tranca do ecrã
// "lagar", o capítulo 8 (js/capitulos.js), state.lagar (js/state.js) e as regras puras de js/lagar.js. Corre state.js,
// i18n.js, niveis.js, capitulos.js e lagar.js REAIS num ambiente simulado (vm), sem browser nem conta real.
//
// Os textos nas 3 línguas e a história do nível 8 são verificados por scripts/verificar-niveis.js.
//
// Uso: node scripts/verificar-nivel8.js
// LAGAR_JS=caminho  corre sobre outra versão de js/lagar.js (provas negativas).
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const LAGAR_JS = process.env.LAGAR_JS || path.join(RAIZ, 'js', 'lagar.js');
let falhas = 0;
function ok(cond, msg) { if (!cond) { falhas++; console.log('FALHA: ' + msg); } }

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
    setTimeout: function () { return 1; }, clearTimeout: function () {}, Image: function () {}, Date: Date
  };
  sb.window = sb;
  sb.Telegram = { WebApp: {} };
  const cx = vm.createContext(sb);
  vm.runInContext(fs.readFileSync(path.join(RAIZ, 'js', 'state.js'), 'utf8'), cx, { filename: 'state.js' });
  vm.runInContext(fs.readFileSync(path.join(RAIZ, 'js', 'i18n.js'), 'utf8'), cx, { filename: 'i18n.js' });
  vm.runInContext(`
    var FALAS = [];
    function mostrarFalas(f, quem) { FALAS.push({ f: f, quem: quem }); }
    function vibrar() {} function tocarSom() {} function updateStatsDisplays() {}
    function localeAtual() { return 'pt-PT'; }
    function diaLisboaDeHoje() { return '2026-10-09'; }
  `, cx);
  ['niveis.js', 'capitulos.js'].forEach(function (f) {
    vm.runInContext(fs.readFileSync(path.join(RAIZ, 'js', f), 'utf8'), cx, { filename: f });
  });
  vm.runInContext(fs.readFileSync(LAGAR_JS, 'utf8'), cx, { filename: 'lagar.js' });
  const g = { cx: cx, guardado: guardado };
  g.ev = function (c) { return vm.runInContext(c, cx); };
  g.json = function (c) { return JSON.parse(vm.runInContext('JSON.stringify(' + c + ')', cx)); };
  return g;
}

const SETE = { cap1: true, cap2: true, cap3: true, cap4: true, cap5: true, cap6: true, cap7: true };
const saveNivel8 = function (extra) {
  return Object.assign({ reputacao: 1500, uvas: 100, ultimaGravacaoEm: 1, acesso: { jogadorAntigo: false, introMostrada: true }, niveis: { nivelMostrado: 7, garrafasAoNivel6: 0 },
    capitulos: { iniciado: true, celebradosMigrado: true, concluidos: Object.assign({}, SETE), celebrados: Object.assign({}, SETE) } }, extra || {});
};

// 1. Nível 8 (já não é o último): limiar 1500, nome, tranca do ecrã "lagar", a Estrada fica no nível 7.
{
  const g = abrir();
  ok(g.ev('NIVEIS_CONFIG.length') >= 8, 'devia haver pelo menos 8 níveis (o 9 está em scripts/verificar-camara.js)');
  ok(JSON.stringify(g.json('NIVEIS_CONFIG.slice(0, 8).map(function (n) { return n.min; })')) === '[0,15,50,120,300,600,1000,1500]', 'limiares 0, 15, 50, 120, 300, 600, 1000, 1500');
  ok(g.ev('NIVEIS_CONFIG[7].nomeKey') === 'nivel.nome.8', 'nomeKey do nível 8');
  [[999, 6], [1000, 7], [1499, 7], [1500, 8], [2099, 8]].forEach(function (p) {
    ok(g.ev('nivelPelaReputacao(' + p[0] + ')') === p[1], 'Reputação ' + p[0] + ' devia dar nível ' + p[1]);
  });
  ok(g.ev('NIVEL_NECESSARIO_POR_ECRA.lagar') === 8 && g.ev('NIVEL_NECESSARIO_POR_ECRA.estrada') === 7, 'lagar: 8 e a estrada continua no 7');
  ok(g.ev("state.acesso.jogadorAntigo = false; state.reputacao = 1499; ecraDesbloqueado('lagar')") === false, 'o Lagar devia estar trancado no nível 7 (jogador novo)');
  ok(g.ev("state.reputacao = 1500; ecraDesbloqueado('lagar')") === true, 'o Lagar devia abrir no nível 8');
  ok(g.ev("state.reputacao = 1499; ecraDesbloqueado('estrada')") === true, 'a Estrada continua aberta no nível 7');
  ok(g.ev("state.reputacao = 300; state.acesso.jogadorAntigo = true; ecraDesbloqueado('lagar')") === true, 'um jogador antigo nunca perde nem fica sem acesso (tabela ignorada)');
  const t = g.ev("mostrarMensagemTrancada = mostrarMensagemTrancada; 1");
  ok(t === 1, 'mostrarMensagemTrancada existe');
}

// 2. state.lagar: valor por omissão seguro (jogo novo, save antigo, nuvem sem o campo) e nada mais muda.
{
  const novo = abrir();
  ok(JSON.stringify(novo.json('state.lagar')) === '{"ultimoDia":null,"dias":0,"mesaDia":null,"assaltoDia":null}', 'jogo novo: lagar { ultimoDia: null, dias: 0 }');
  const antigoSave = { uvas: 77, gotas: 5, reputacao: 1234, garrafas: 3, despensa: { recebidos: { sal_sado: 2 }, entregues: {}, primeiraTroca: {}, hoje: { dia: null, feitas: {} } }, tempo: { arcoirisDia: '2026-10-01' } };
  const g = abrir(antigoSave);
  ok(JSON.stringify(g.json('state.lagar')) === '{"ultimoDia":null,"dias":0,"mesaDia":null,"assaltoDia":null}', 'save antigo sem lagar ganha o valor por omissão');
  ok(g.ev('state.uvas') === 77 && g.ev('state.reputacao') === 1234 && g.ev('state.garrafas') === 3 && g.ev('state.despensa.recebidos.sal_sado') === 2 && g.ev('state.tempo.arcoirisDia') === "2026-10-01", 'o resto do save antigo fica igual');
  // Estado vindo da nuvem (mergeDeep, como em nuvemTratarLeitura): sem o campo ganha-o; com o campo mantém-no.
  ok(JSON.stringify(g.json('mergeDeep(defaultState(), { reputacao: 5 }).lagar')) === '{"ultimoDia":null,"dias":0,"mesaDia":null,"assaltoDia":null}', 'estado da nuvem sem lagar ganha o valor por omissão');
  ok(JSON.stringify(g.json('mergeDeep(defaultState(), { lagar: { ultimoDia: "2026-10-08", dias: 2 } }).lagar')) === '{"ultimoDia":"2026-10-08","dias":2,"mesaDia":null,"assaltoDia":null}', 'estado da nuvem com lagar (sem mesaDia) mantém-no e ganha mesaDia null');
  // Valores estranhos são reparados só ao pisar; ler nunca estoira.
  g.ev('state.lagar = null; state.uvas = 100');
  ok(g.json("lagarPodePisar(state, '2026-10-09')").ok === true, 'lagar null: pode pisar (nunca estoira)');
  ok(g.json("lagarPisar(state, '2026-10-09')").ok === true && g.ev('state.lagar.dias') === 1 && g.ev('state.lagar.ultimoDia') === "2026-10-09", 'lagar null: repara-se e conta 1 dia');
  g.ev("state.lagar = { ultimoDia: 'lixo', dias: 'x' }; state.uvas = 100");
  ok(g.json("lagarPisar(state, '2026-10-09')").ok === true && g.ev('state.lagar.dias') === 1, 'valores inválidos: dias volta a 0 e conta 1');
}

// 3. As regras puras: custo, prémio, uma vez por dia, dias diferentes, recusas sem alterar nada.
{
  const g = abrir(saveNivel8({ uvas: 100, reputacao: 1500 }));
  ok(g.ev('LAGAR_CONFIG.custoUvas') === 30 && g.ev('LAGAR_CONFIG.reputacao') === 5, 'custo 30 uvas e +5 de Reputação');
  const antes = g.ev('JSON.stringify(state)');
  const r = g.json("lagarPisar(state, '2026-10-09')");
  ok(r.ok && r.uvasGastas === 30 && r.reputacaoGanha === 5, 'pisar: ' + JSON.stringify(r));
  ok(g.ev('state.uvas') === 70 && g.ev('state.reputacao') === 1505 && g.ev('state.lagar.dias') === 1 && g.ev('state.lagar.ultimoDia') === "2026-10-09", 'pisar: 70 uvas, 1505 de Reputação, 1 dia');
  const depois = JSON.parse(g.ev('JSON.stringify(state)'));
  const igual = JSON.parse(antes); igual.uvas = 70; igual.reputacao = 1505; igual.lagar = { ultimoDia: '2026-10-09', dias: 1, mesaDia: null, assaltoDia: null };
  ok(JSON.stringify(depois) === JSON.stringify(igual), 'pisar só mexe em uvas, Reputação e lagar');
  // Segunda vez no mesmo dia: recusada, nada muda.
  const a = g.ev('JSON.stringify(state)');
  const r2 = g.json("lagarPisar(state, '2026-10-09')");
  ok(!r2.ok && r2.motivo === 'ja_hoje' && g.ev('JSON.stringify(state)') === a, 'mesmo dia: recusado (ja_hoje) sem alterar nada');
  ok(g.json("lagarPodePisar(state, '2026-10-09')").motivo === 'ja_hoje', 'lagarPodePisar diz ja_hoje');
  // Relógio atrás: recusado.
  const r3 = g.json("lagarPisar(state, '2026-10-08')");
  ok(!r3.ok && r3.motivo === 'dia_anterior' && g.ev('JSON.stringify(state)') === a, 'dia anterior: recusado sem alterar nada');
  // Dia seguinte: conta outro dia.
  ok(g.json("lagarPisar(state, '2026-10-10')").ok && g.ev('state.lagar.dias') === 2 && g.ev('state.uvas') === 40, 'dia seguinte: 2 dias e 40 uvas');
  // Sem uvas que cheguem: explica o que falta, sem alterar nada.
  g.ev('state.uvas = 29');
  const b = g.ev('JSON.stringify(state)');
  const p = g.json("lagarPodePisar(state, '2026-10-11')");
  ok(!p.ok && p.motivo === 'faltam_uvas' && p.faltam === 1, '29 uvas: falta 1: ' + JSON.stringify(p));
  ok(!g.json("lagarPisar(state, '2026-10-11')").ok && g.ev('JSON.stringify(state)') === b, 'sem uvas que cheguem: recusado sem alterar nada');
  g.ev('state.uvas = 0'); ok(g.json("lagarPodePisar(state, '2026-10-11')").faltam === 30, '0 uvas: faltam 30');
  g.ev('state.uvas = 30'); ok(g.json("lagarPodePisar(state, '2026-10-11')").ok === true, 'exatamente 30 uvas chega');
  // Entradas inválidas.
  ok(g.json('lagarPisar(null, "2026-10-11")').motivo === 'estado_invalido', 'estado null');
  ok(g.json("lagarPisar(state, 'ontem')").motivo === 'dia_invalido' && g.json('lagarPisar(state, 5)').motivo === 'dia_invalido', 'dia inválido');
  // Pureza (as regras, antes do ecrã): sem relógio nem sorteio nem gravação.
  const fonte = fs.readFileSync(LAGAR_JS, 'utf8');
  const regras = fonte.slice(0, fonte.indexOf('// ECRÃ E LINHA DA QUINTA'));
  ok(regras.length > 500 && !/Date\.now|Math\.random|new Date|saveState|localStorage/.test(regras.replace(/\/\/.*$/gm, '')), 'as regras do Lagar são puras (sem relógio, sorteio nem gravação)');
}

// 4. Capítulo 8: conta dias DIFERENTES; nunca trava o nível; celebração; modo de teste 1 a 8.
{
  const g = abrir(saveNivel8({ uvas: 500 }));
  ok(g.ev('CAPITULOS_CONFIG.length') >= 8 && g.ev('CAPITULOS_CONFIG[7].id') === 'cap8' && g.ev('CAPITULOS_CONFIG[7].nivel') === 8, 'devia haver o cap8 no nível 8');
  ok(JSON.stringify(g.json('CAPITULOS_CONFIG[7].criterio')) === JSON.stringify([{ tipo: 'numero', caminho: 'lagar.dias', alvo: 3 }]), 'critério do cap8');
  const lido = function () { return g.json('capitulosLerCriterio(CAPITULOS_CONFIG[7])'); };
  let r = lido(); ok(r.atual === 0 && r.total === 3 && r.cumprido === false, 'sem pisar: 0 / 3');
  g.ev("lagarPisar(state, '2026-10-09')"); g.ev("lagarPisar(state, '2026-10-09')");
  r = lido(); ok(r.atual === 1 && !r.cumprido, 'pisar duas vezes no mesmo dia conta 1 / 3');
  g.ev("lagarPisar(state, '2026-10-10')");
  r = lido(); ok(r.atual === 2 && !r.cumprido, '2 dias: 2 / 3');
  ok(g.ev('capitulosAvaliarCelebracao()') === false, 'com 2 dias não há celebração do cap8');
  g.ev("lagarPisar(state, '2026-10-11')");
  r = lido(); ok(r.atual === 3 && r.cumprido === true, '3 dias diferentes cumprem o cap8');
  ok(g.ev('capitulosAvaliarCelebracao()') === true, 'com 3 dias devia celebrar o cap8');
  ok(g.ev('FALAS[0].f[0]') === g.ev('TRANSLATIONS.pt["capitulo.cap8.conclusao"]'), 'a celebração mostra a conclusão do cap8');
  // Nunca trava o nível: com o cap8 por fazer, 1500 é nível 8; concluído não sobe sozinho.
  ok(abrir(saveNivel8()).ev('nivelPelaReputacao(state.reputacao)') === 8, 'o cap8 por fazer não trava o nível 8');
  const h = abrir(saveNivel8({ reputacao: 1499 })); h.ev('state.capitulos.concluidos.cap8 = true');
  ok(h.ev('nivelPelaReputacao(state.reputacao)') === 7, 'o cap8 concluído não sobe o nível sozinho');
  // Quem já tinha o cap7 e nenhum Lagar não perde nada nem ganha o cap8 sem pisar.
  const v = abrir(saveNivel8()); v.ev('capitulosAvaliarEmSilencio()');
  ok(v.ev('state.capitulos.concluidos.cap8') === undefined && v.ev('state.capitulos.concluidos.cap7') === true, 'sem pisar, o cap8 não se marca; o cap7 fica');
  // ?capitulo=8 passa; 10 e 0 não (o 9 passou a existir, ver verificar-camara.js).
  ok((abrir(null, '?capitulo=8').json('capitulosParametrosTeste()') || {}).id === 'cap8', '?capitulo=8 é válido');
  ok((abrir(null, '?capitulo=cap8').json('capitulosParametrosTeste()') || {}).id === 'cap8', '?capitulo=cap8 é válido');
  ok(abrir(null, '?capitulo=10').json('capitulosParametrosTeste()') === null && abrir(null, '?capitulo=0').json('capitulosParametrosTeste()') === null, '?capitulo=10 e 0 não são válidos');
}

// 5. Textos do Lagar nas 3 línguas, e a ligação ao jogo (index.html, fundo, ficheiros).
{
  const g = abrir();
  ['lagar.title', 'lagar.linha', 'lagar.desc', 'lagar.btn', 'lagar.faltam', 'lagar.jaHoje', 'lagar.dias', 'lagar.ok', 'lagar.relogio'].forEach(function (k) {
    ['pt', 'en', 'es'].forEach(function (l) {
      const v = g.ev('TRANSLATIONS.' + l + '["' + k + '"]');
      ok(typeof v === 'string' && v.trim() !== '', 'falta a chave ' + k + ' em ' + l);
    });
  });
  ['{n}', '{rep}'].forEach(function (m) { ['pt', 'en', 'es'].forEach(function (l) { ok(g.ev('TRANSLATIONS.' + l + '["lagar.desc"]').indexOf(m) !== -1, 'lagar.desc sem ' + m + ' em ' + l); }); });
  ['pt', 'en', 'es'].forEach(function (l) { ok(g.ev('TRANSLATIONS.' + l + '["lagar.faltam"]').indexOf('{faltam}') !== -1, 'lagar.faltam sem {faltam} em ' + l); });
  ok(g.ev('TRANSLATIONS.pt["nivel.nome.8"]') === 'Quinta de Portas Abertas' && g.ev('TRANSLATIONS.en["nivel.nome.8"]') === 'Open Doors Quinta' && g.ev('TRANSLATIONS.es["nivel.nome.8"]') === 'Quinta de Puertas Abiertas', 'os 3 nomes do nível 8');
  ok(g.ev('TRANSLATIONS.pt["historia.nivel8.1"]').indexOf('portas abertas') !== -1 && g.ev('TRANSLATIONS.pt["historia.nivel8.3"]') === 'Abriu: o Lagar.', 'história PT do nível 8');
  ok(g.ev('TRANSLATIONS.pt["capitulo.cap8.conclusao"]').length <= 90, 'conclusão do cap8 com 90 caracteres no máximo');
  const html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
  ok(/id="screen-lagar"/.test(html) && /id="lagar-container"/.test(html) && /id="lagar-linha-container"/.test(html), 'index.html tem o ecrã e a linha do Lagar');
  ok(/#screen-lagar\.content/.test(html), 'index.html tem #screen-lagar.content na lista do jogo-cheio');
  const iEstrada = html.indexOf('<script src="js/estrada.js'), iLagar = html.indexOf('<script src="js/lagar.js'), iMain = html.indexOf('<script src="js/main.js');
  ok(iEstrada > 0 && iLagar > iEstrada && iMain > iLagar, 'js/lagar.js carrega depois de estrada.js e antes de main.js');
  const main = fs.readFileSync(path.join(RAIZ, 'js', 'main.js'), 'utf8');
  ok(/lagar:\s*\{\s*src:\s*'assets\/ecras\/festa_vindima_todos_juntos\.jpg'/.test(main) && /lagar:\s*'quinta'/.test(main) && /renderLagar\(\)/.test(main) && /atualizarLinhaLagarQuinta/.test(main), 'main.js liga o Lagar (fundo, barra, render e linha da Quinta)');
  ok(fs.existsSync(path.join(RAIZ, 'assets', 'ecras', 'festa_vindima_todos_juntos.jpg')), 'a imagem de fundo existe');
}

console.log(falhas === 0 ? 'OK' : falhas + ' FALHA(S)');
process.exit(falhas === 0 ? 0 : 1);
