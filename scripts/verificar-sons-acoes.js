#!/usr/bin/env node
// Sons das ações (só efeitos que já existem em SOM_EFEITOS, js/som.js; sem ficheiros novos):
//   Plantar = cavar, Ervas = colher, Adubar = cavar, Compostar = prensar, Podar = colher (js/vinha.js, SOM_ACAO_VINHA);
//   Destilar vinho e bagaço = regar, Fortificar = prensar, Prensar = prensar (js/garrafa.js, SOM_ACAO_ADEGA);
//   Estrada Trocar e Oferecer = objetivoCumprido (js/estrada.js); tarefas das festas = objetivoCumprido só ao ACERTAR (js/festas.js).
// Regras: só toca quando a ação resulta (recusada = silêncio); nunca dois sons juntos (se o "ding" do objetivo do dia vai
// tocar, a ação não toca o seu); falhar uma cena das festas não toca nada (nem o "ding", mas o objetivo conta na mesma);
// o interruptor "Som" do Perfil manda (js/som.js real com um AudioContext simulado); cada toque tenta lançar o áudio
// enquanto ele não está a correr (1.º toque). Corre os js/ REAIS em vm. Depois, ESTRAGA as regras de propósito (mutantes).
//
// Uso: node scripts/verificar-sons-acoes.js
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const LER = function (f) { return fs.readFileSync(path.join(RAIZ, f), 'utf8'); };
const FICHEIROS = ['state.js', 'estacoes.js', 'tempo.js', 'festas.js', 'niveis.js', 'vinha.js', 'alambique.js', 'garrafa.js', 'ronda.js', 'explorar.js',
  'estrada-dados.js', 'despensa.js', 'visitas.js', 'estrada.js', 'objetivos.js', 'som.js'];
const FONTES = {};
FICHEIROS.forEach(function (f) { FONTES[f] = LER('js/' + f); });
const AGORA = Date.parse('2026-10-09T10:00:00+01:00');
const DIA = '2026-10-09';

function suite(fontes) {
  const falhas = [];
  function ok(cond, msg) { if (!cond) falhas.push(msg); }

  // Ambiente com os ficheiros reais. tocarSom() é o REAL (js/som.js) com um AudioContext simulado que conta os sons.
  function abrir(estado) {
    const relogio = { t: AGORA };
    class Relogio extends Date {
      constructor(...a) { if (a.length === 0) super(relogio.t); else super(...a); }
      static now() { return relogio.t; }
    }
    const ouvintes = {};
    const sb = {
      console: { log() {}, warn() {}, error() {} },
      localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
      location: { search: '' }, URLSearchParams: URLSearchParams, Intl: Intl,
      document: {
        hidden: false, querySelectorAll: function () { return []; }, querySelector: function () { return null; },
        addEventListener: function (ev, fn) { (ouvintes[ev] = ouvintes[ev] || []).push(fn); },
        getElementById: function () { return { innerHTML: '', style: {}, classList: { add() {}, remove() {}, toggle() {} } }; }
      },
      setTimeout: function () { return 1; }, clearTimeout: function () {}, Image: function () {}, Date: Relogio, ouvintes: ouvintes
    };
    sb.window = sb; sb.addEventListener = function () {}; sb.Telegram = { WebApp: {} };
    // Contexto de áudio de mentira: cada oscilador ou ruído criado conta como "um som a tocar".
    sb.AudioContext = function () {
      const node = function () { return { connect() {}, start() {}, stop() {}, frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} }, gain: { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, Q: { setValueAtTime() {} }, type: '' }; };
      const ctx = {
        state: 'suspended', currentTime: 0, sampleRate: 8000, destination: {}, resumes: 0, oscs: 0, ruidos: 0,
        resume: function () { ctx.resumes++; ctx.state = 'running'; return Promise.resolve(); }, suspend: function () { ctx.state = 'suspended'; return Promise.resolve(); },
        createGain: node, createBiquadFilter: node,
        createOscillator: function () { ctx.oscs++; return node(); },
        createBuffer: function (c, n) { ctx.ruidos++; return { getChannelData: function () { return new Float32Array(n); } }; },
        createBufferSource: node
      };
      sb.__ctx = ctx;
      return ctx;
    };
    const cx = vm.createContext(sb);
    vm.runInContext(`
      var SAVES = 0, SONS = [];
      function t(k) { return k; }
      function randInt(a) { return a; }
      function mostrarFalas() {} function vibrar() {} function updateStatsDisplays() {}
      function reposicionarFlutuantes() {} function atualizarCartaoObjetivosQuinta() {}
      function localeAtual() { return 'pt-PT'; }
      function faseRealAtual() { return 'repouso'; }
      function jaFezTarefaTempoHoje() { return false; } function registarTarefaTempoHoje() {}
      function entradasBloqueadas() { return []; } function caveReservaAberta() { return true; }
      function garrafaQueMaisDescansou() { return 2; }
      function mostrarNovaEntrada() {} function atualizarDialogo() {} function definirFundo() {}
      function pararSomAmbiente() {} function iniciarSomAmbiente() {} function tocarSomFicheiro() {}
      function atualizarCartaoNivelQuinta() {} function atualizarResumoQuinta() {} function atualizarLinhaVisitaQuinta() {}
      var currentLang = 'pt'; function goTo() {}
    `, cx);
    FICHEIROS.forEach(function (f) {
      if (f === 'objetivos.js') vm.runInContext('function ecraDesbloqueado() { return true; } function vitoriasProtegerComPremioRestantesHoje() { return 1; }', cx);
      vm.runInContext(fontes[f], cx, { filename: f });
    });
    vm.runInContext(`
      var _saveReal = saveState; saveState = function (s) { SAVES++; return _saveReal(s); };
      // Os sons que se ouvem: cada nome que tocarSom() REAL deixou chegar ao contexto de áudio.
      var _efeitos = SOM_EFEITOS; var _tocarReal = tocarSom;
      tocarSom = function (nome) { if (somPodeTocar() && SOM_EFEITOS[nome]) SONS.push(nome); return _tocarReal(nome); };
      renderVinha = function () {}; renderAdega = function () {}; renderFestaHub = function () {}; renderFestaHub = function () {};
      renderEstrada = function () {}; estradaDesenhar = function () {};
      function randInt(a) { return a; } // determinista (o state.js define um ao acaso)
      function diaLisboaDeHoje() { return '${DIA}'; }
      state = defaultState(); state.som = true;
    `, cx);
    // O contexto de áudio existe e está a correr (como depois do 1.º toque).
    vm.runInContext('somCriarContextoSePreciso(); somCtx.resume();', cx);
    const g = { cx: cx, relogio: relogio, sb: sb };
    g.ev = function (c) { return vm.runInContext(c, cx); };
    g.json = function (c) { return JSON.parse(vm.runInContext('JSON.stringify(' + c + ')', cx)); };
    g.sons = function () { return g.json('SONS'); };
    g.limpar = function () { g.ev('SONS = []; SAVES = 0;'); };
    // Objetivos de hoje: só os dados ids (todos por cumprir).
    g.objetivos = function (ids) {
      if (ids.length === 0) ids = ['objetivo_que_nenhuma_acao_cumpre']; // uma lista vazia seria regenerada ao acaso
      g.ev('garantirObjetivosDoDia(); state.objetivos.lista = ' + JSON.stringify(ids.map(function (id) { return { id: id, cumprido: false }; })) + '; state.objetivos.bonusDiaDado = false;');
    };
    g.cumprido = function (id) { return g.ev('state.objetivos.lista.filter(function (o) { return o.id === "' + id + '"; })[0].cumprido === true'); };
    g.preparar = function (extra) { g.ev(extra || ''); };
    return g;
  }
  function jogador(vinha, adega) {
    const g = abrir();
    g.ev('state.reputacao = 1200; state.uvas = 773; state.gotas = 150; state.garrafas = 4;');
    g.ev('state.vinha = Object.assign(state.vinha, ' + JSON.stringify(Object.assign({ fase: 'preparar', pontosCuidado: 0, residuos: 5, adubo: 1, cooldowns: {} }, vinha || {})) + ');');
    g.ev('state.adega = Object.assign({ bagaco: 9, aguardente: 4, bagaceira: 2, cooldowns: {}, lote: null, historico: [] }, ' + JSON.stringify(adega || {}) + ');');
    g.objetivos([]);
    return g;
  }
  const acao = function (g, nome, setup) { g.ev(setup || ''); g.limpar(); g.ev("executarAcaoVinha('" + nome + "')"); return g.sons(); };
  const adega = function (g, nome) { g.limpar(); g.ev("executarAcaoAdega('" + nome + "')"); return g.sons(); };
  const igual = function (a, b) { return JSON.stringify(a) === JSON.stringify(b); };

  // ---------------- 1. Vinha: cada ação com o seu som ----------------
  const VINHA = [
    ['cavar', { fase: 'preparar' }, 'cavar'], ['plantar', { fase: 'preparada' }, 'cavar'], ['ervas', { fase: 'preparada' }, 'colher'],
    ['ervas', { fase: 'crescendo' }, 'colher'], ['regar', { fase: 'crescendo' }, 'regar'], ['adubar', { fase: 'crescendo', adubo: 1 }, 'cavar'],
    ['compostagem', { fase: 'preparar', residuos: 5 }, 'prensar'], ['colher', { fase: 'pronta', pontosCuidado: 4 }, 'colher']
  ];
  VINHA.forEach(function (c) {
    const g = jogador(c[1]);
    const s = acao(g, c[0]);
    ok(igual(s, [c[2]]), c[0] + ' (' + c[1].fase + ') devia tocar só ' + c[2] + ', tocou ' + JSON.stringify(s));
    ok(g.ev('SAVES') >= 1, c[0] + ': devia ter resultado (gravar)');
  });
  { // Podar: só no inverno, 1 por inverno; não é objetivo do dia.
    const g = jogador({ fase: 'crescendo' });
    g.ev("estacaoAtual = function () { return 'inverno'; };");
    const s = acao(g, 'podar');
    ok(igual(s, ['colher']), 'podar devia tocar só colher, tocou ' + JSON.stringify(s));
    ok(igual(acao(g, 'podar'), []), 'podar outra vez no mesmo inverno (recusado): silêncio');
    const h = jogador({ fase: 'crescendo' }); h.ev("estacaoAtual = function () { return 'verao'; };");
    ok(igual(acao(h, 'podar'), []), 'podar fora do inverno: silêncio');
    const k = jogador({ fase: 'preparar' }); k.ev("estacaoAtual = function () { return 'inverno'; };");
    ok(igual(acao(k, 'podar'), []), 'podar sem nada plantado (mensagem): silêncio');
  }
  { // Ações recusadas: silêncio e nada gravado.
    const recusas = [
      ['plantar', { fase: 'preparar' }], ['ervas', { fase: 'preparar' }], ['regar', { fase: 'preparada' }], ['adubar', { fase: 'crescendo', adubo: 0 }],
      ['adubar', { fase: 'preparar', adubo: 1 }], ['compostagem', { fase: 'preparar', residuos: 0 }], ['colher', { fase: 'crescendo' }], ['cavar', { fase: 'crescendo' }]
    ];
    recusas.forEach(function (c) {
      const g = jogador(Object.assign({ residuos: 0 }, c[1]), { bagaco: 0 });
      const s = acao(g, c[0]);
      ok(igual(s, []), c[0] + ' recusado (' + JSON.stringify(c[1]) + '): devia ficar em silêncio, tocou ' + JSON.stringify(s));
      ok(g.ev('SAVES') === 0, c[0] + ' recusado: não devia gravar');
    });
    // Cooldown: a 2.ª vez seguida é recusada, em silêncio.
    const g = jogador({ fase: 'preparar' });
    ok(igual(acao(g, 'cavar'), ['cavar']), 'cavar a 1.ª vez toca');
    const w = jogador({ fase: 'preparada' });
    ok(igual(acao(w, 'ervas'), ['colher']), 'ervas a 1.ª vez toca');
    ok(igual(acao(w, 'ervas'), []), 'ervas em cooldown (2 h): silêncio');
  }

  // ---------------- 2. Vinha: nunca dois sons (o "ding" do objetivo vence) ----------------
  VINHA.forEach(function (c) {
    const idObj = c[0] === 'compostagem' ? 'vinha_compostagem' : 'vinha_' + c[0];
    const g = jogador(c[1]);
    g.objetivos([idObj]);
    const s = acao(g, c[0]);
    ok(igual(s, ['objetivoCumprido']), c[0] + ' com objetivo do dia por cumprir: só o "ding", tocou ' + JSON.stringify(s));
    ok(g.cumprido(idObj), c[0] + ': o objetivo devia ficar cumprido');
    // Na 2.ª vez (objetivo já cumprido) volta o som da ação.
    g.ev("state.vinha.cooldowns = {}; state.vinha.fase = " + JSON.stringify(c[1].fase) + "; state.vinha.pontosCuidado = " + (c[1].pontosCuidado || 0) + "; state.vinha.adubo = 1; state.vinha.residuos = 5;");
    const s2 = acao(g, c[0]);
    ok(igual(s2, [c[2]]), c[0] + ' com o objetivo já cumprido: devia tocar o som da ação (' + c[2] + '), tocou ' + JSON.stringify(s2));
  });
  { // Objetivo de outra ação não cala esta.
    const g = jogador({ fase: 'preparada' }); g.objetivos(['vinha_regar']);
    ok(igual(acao(g, 'ervas'), ['colher']), 'objetivo de outra ação não devia calar as ervas');
  }

  // ---------------- 3. Adega ----------------
  {
    const casos = [
      ['prensar', {}, {}, 'prensar'], ['destilarVinho', {}, {}, 'regar'], ['destilarBagaco', {}, { bagaco: 9 }, 'regar'],
      ['fortificar', {}, { aguardente: 4 }, 'prensar']
    ];
    casos.forEach(function (c) {
      const g = jogador({}, c[2]);
      const s = adega(g, c[0]);
      ok(igual(s, [c[3]]), c[0] + ' devia tocar só ' + c[3] + ', tocou ' + JSON.stringify(s));
      ok(g.ev('SAVES') >= 1, c[0] + ': devia ter resultado (gravar)');
      const idObj = c[0] === 'destilarVinho' || c[0] === 'destilarBagaco' ? 'adega_alambique' : 'adega_' + c[0];
      const h = jogador({}, c[2]); h.objetivos([idObj]);
      ok(igual(adega(h, c[0]), ['objetivoCumprido']) && h.cumprido(idObj), c[0] + ' com o objetivo do dia: só o "ding"');
    });
    // Recusadas: silêncio.
    const sem = jogador({}, { bagaco: 0, aguardente: 0 }); sem.ev('state.uvas = 0; state.gotas = 0;');
    ['prensar', 'destilarVinho', 'destilarBagaco', 'fortificar'].forEach(function (a) {
      ok(igual(adega(sem, a), []), a + ' sem recursos: silêncio');
    });
    ok(sem.ev('SAVES') === 0, 'recusas da Adega: não gravam');
    const lote = jogador({}, { lote: { iniciadoEm: AGORA } });
    ok(igual(adega(lote, 'fortificar'), []), 'fortificar com um lote já a descansar: silêncio');
    // Cooldown do alambique: a 2.ª destilação seguida é recusada.
    const c2 = jogador({}, {}); adega(c2, 'destilarVinho');
    ok(igual(adega(c2, 'destilarVinho'), []), 'destilar em cooldown: silêncio');
    const c3 = jogador({}, {}); adega(c3, 'prensar');
    ok(igual(adega(c3, 'prensar'), []), 'prensar em cooldown: silêncio');
  }

  // ---------------- 4. Estrada ----------------
  {
    const g = jogador({}, {});
    g.ev("state.reputacao = 1200; state.uvas = 500;");
    g.limpar(); g.ev("estradaTrocarClique('dona_amelia')");
    ok(igual(g.sons(), ['objetivoCumprido']), 'Estrada, Trocar: devia tocar objetivoCumprido, tocou ' + JSON.stringify(g.sons()));
    g.limpar(); g.ev("estradaTrocarClique('dona_amelia')");
    ok(igual(g.sons(), []), 'Estrada, Trocar outra vez no mesmo dia (recusado): silêncio');
    const p = jogador({}, { bagaceira: 0 }); p.ev('state.uvas = 0; state.garrafas = 0;'); p.limpar(); p.ev("estradaTrocarClique('sr_joaquim')");
    ok(igual(p.sons(), []), 'Estrada, Trocar sem uvas (recusado): silêncio');
    ok(p.ev('SAVES') === 0, 'Estrada recusada: não grava');
    // Oferecer a uma visita (precisa da visita de hoje tocada e de um bem na Despensa).
    const o = jogador({}, {});
    o.ev("state.reputacao = 1200; state.visitas = { feitas: {}, hoje: { dia: '" + DIA + "', id: 'valentim_4', feita: true } }; state.despensa.recebidos = { queijo_azeitao: 2 };");
    o.limpar(); o.ev('estradaOferecerClique()');
    ok(igual(o.sons(), ['objetivoCumprido']), 'Estrada, Oferecer: devia tocar objetivoCumprido, tocou ' + JSON.stringify(o.sons()));
    o.limpar(); o.ev('estradaOferecerClique()');
    ok(igual(o.sons(), []), 'Estrada, Oferecer 2.ª vez no dia (recusado): silêncio');
    const q = jogador({}, {});
    q.ev("state.reputacao = 1200; state.visitas = { feitas: {}, hoje: { dia: '" + DIA + "', id: 'valentim_4', feita: true } };");
    q.limpar(); q.ev('estradaOferecerClique()');
    ok(igual(q.sons(), []), 'Estrada, Oferecer sem bens (recusado): silêncio');
  }

  // ---------------- 5. Festas: só ao acertar ----------------
  const festa = function (g, id) { g.ev("festaAtual = function () { return FESTAS_CONFIG.filter(function (f) { return f.id === '" + id + "'; })[0]; }; estaNoDiaGrandeFesta = function () { return false; };"); };
  const tarefa = function (g, id) { g.limpar(); g.ev("iniciarTarefaFesta('" + id + "')"); };
  {
    // Cenas: castanhas (a cena 0 tem a opção 0 certa, randInt de teste dá 0), ovos (cena do dia).
    const g = jogador({}, {}); festa(g, 'saomartinho'); g.objetivos([]);
    tarefa(g, 'castanhas'); ok(igual(g.sons(), []), 'abrir a cena das castanhas não toca nada');
    const correta = function (x) { return x.ev('FESTAS_STRINGS.saomartinho.pt.castanhasCenas[castanhasCenaIndex].correta'); };
    const certa = correta(g);
    g.limpar(); g.ev('responderCastanha(' + certa + ')');
    ok(igual(g.sons(), ['objetivoCumprido']), 'castanhas, acertar: devia tocar objetivoCumprido, tocou ' + JSON.stringify(g.sons()));
    const e = jogador({}, {}); festa(e, 'saomartinho'); e.objetivos([]);
    tarefa(e, 'castanhas'); e.limpar(); e.ev('responderCastanha(' + ((certa + 1) % 3) + ')');
    ok(igual(e.sons(), []), 'castanhas, falhar: não devia tocar nada, tocou ' + JSON.stringify(e.sons()));
    // Com o objetivo "festa_tarefa" de hoje: acertar = um só ding; falhar = nada, mas o objetivo conta.
    const h = jogador({}, {}); festa(h, 'saomartinho'); h.objetivos(['festa_tarefa']);
    tarefa(h, 'castanhas'); h.limpar(); h.ev('responderCastanha(' + certa + ')');
    ok(igual(h.sons(), ['objetivoCumprido']) && h.cumprido('festa_tarefa'), 'castanhas acertar com objetivo do dia: um só som e objetivo cumprido, tocou ' + JSON.stringify(h.sons()));
    const f = jogador({}, {}); festa(f, 'saomartinho'); f.objetivos(['festa_tarefa']);
    tarefa(f, 'castanhas'); f.limpar(); f.ev('responderCastanha(' + ((certa + 1) % 3) + ')');
    ok(igual(f.sons(), []), 'castanhas falhar com objetivo do dia: nem o "ding", tocou ' + JSON.stringify(f.sons()));
    ok(f.cumprido('festa_tarefa'), 'castanhas falhar: o objetivo do dia conta na mesma');
  }
  [['natal', 'boloRei'], ['carnaval', 'quemEstaMascarado'], ['pascoa', 'ovos']].forEach(function (par) {
    const ganha = function (obj) {
      const g = jogador({}, {}); festa(g, par[0]); g.objetivos(obj);
      tarefa(g, par[1]);
      const certa = g.ev('festaCenaAtual.cena.correta');
      g.limpar(); g.ev('festaResponderCenaDoDia(' + certa + ')');
      return g;
    };
    const perde = function (obj) {
      const g = jogador({}, {}); festa(g, par[0]); g.objetivos(obj);
      tarefa(g, par[1]);
      const certa = g.ev('festaCenaAtual.cena.correta');
      g.limpar(); g.ev('festaResponderCenaDoDia(' + ((certa + 1) % 3) + ')');
      return g;
    };
    let g = ganha([]);
    ok(igual(g.sons(), ['objetivoCumprido']), par[1] + ', acertar: devia tocar objetivoCumprido, tocou ' + JSON.stringify(g.sons()));
    g = perde([]);
    ok(igual(g.sons(), []), par[1] + ', falhar: não devia tocar nada, tocou ' + JSON.stringify(g.sons()));
    g = ganha(['festa_tarefa']);
    ok(igual(g.sons(), ['objetivoCumprido']) && g.cumprido('festa_tarefa'), par[1] + ', acertar com objetivo do dia: um só som');
    g = perde(['festa_tarefa']);
    ok(igual(g.sons(), []) && g.cumprido('festa_tarefa'), par[1] + ', falhar com objetivo do dia: sem som e o objetivo conta na mesma');
    // Já feita hoje: a cena nem abre e nada toca.
    const h = jogador({}, {}); festa(h, par[0]); tarefa(h, par[1]); h.ev('festaResponderCenaDoDia(' + h.ev('festaCenaAtual.cena.correta') + ')');
    h.limpar(); h.ev("iniciarTarefaFesta('" + par[1] + "')");
    ok(igual(h.sons(), []), par[1] + ' já feita hoje: silêncio');
  });
  {
    // Tarefas simples: consoada/doces, folar/amêndoas, corso/fantasias, jeropiga e prova.
    [['natal', 'consoada', ''], ['natal', 'doces', ''], ['carnaval', 'corso', ''], ['carnaval', 'fantasias', ''], ['pascoa', 'folar', ''], ['pascoa', 'amendoas', '']].forEach(function (c) {
      const g = jogador({}, {}); festa(g, c[0]); tarefa(g, c[1]);
      ok(igual(g.sons(), ['objetivoCumprido']), c[1] + ': devia tocar objetivoCumprido, tocou ' + JSON.stringify(g.sons()));
      tarefa(g, c[1]);
      ok(igual(g.sons(), []), c[1] + ' outra vez no mesmo dia (recusado): silêncio');
      const h = jogador({}, {}); festa(h, c[0]); h.objetivos(['festa_tarefa']); tarefa(h, c[1]);
      ok(igual(h.sons(), ['objetivoCumprido']) && h.cumprido('festa_tarefa'), c[1] + ' com objetivo do dia: um só som');
    });
    ['doces', 'fantasias', 'amendoas'].forEach(function (id) {
      const par = id === 'doces' ? 'natal' : id === 'fantasias' ? 'carnaval' : 'pascoa';
      const g = jogador({}, {}); g.ev('state.gotas = 0;'); festa(g, par); tarefa(g, id);
      ok(igual(g.sons(), []), id + ' sem Gotas (recusado): silêncio');
    });
    let g = jogador({}, { bagaceira: 2 }); festa(g, 'saomartinho'); tarefa(g, 'jeropiga');
    ok(igual(g.sons(), ['objetivoCumprido']), 'jeropiga: devia tocar objetivoCumprido, tocou ' + JSON.stringify(g.sons()));
    g = jogador({}, { bagaceira: 0, aguardente: 0 }); festa(g, 'saomartinho'); tarefa(g, 'jeropiga');
    ok(igual(g.sons(), []), 'jeropiga sem aguardente (recusado): silêncio');
    g = jogador({}, { lote: { iniciadoEm: AGORA } }); festa(g, 'saomartinho'); tarefa(g, 'prova');
    ok(igual(g.sons(), ['objetivoCumprido']), 'prova do vinho novo: devia tocar objetivoCumprido, tocou ' + JSON.stringify(g.sons()));
    g = jogador({}, { lote: null }); festa(g, 'saomartinho'); tarefa(g, 'prova');
    ok(igual(g.sons(), []), 'prova sem vinho a descansar (recusado): silêncio');
  }

  // ---------------- 6. O "Som" do Perfil manda (tocarSom real) ----------------
  {
    const g = jogador({ fase: 'preparada' }, {});
    g.ev('state.som = false;');
    const antes = g.sb.__ctx.oscs + g.sb.__ctx.ruidos;
    acao(g, 'ervas'); g.ev('state.vinha.cooldowns = {}; state.vinha.fase = "preparada";'); acao(g, 'plantar');
    ok(g.sb.__ctx.oscs + g.sb.__ctx.ruidos === antes, 'com o "Som" desligado nenhuma ação devia tocar nada');
    ok(g.sons().length === 0, 'com o "Som" desligado nenhum som chega ao áudio');
    g.ev('state.som = true; state.vinha.cooldowns = {}; state.vinha.fase = "preparada";');
    acao(g, 'ervas');
    ok(g.sb.__ctx.oscs + g.sb.__ctx.ruidos > antes, 'com o "Som" ligado a ação toca (o contexto de áudio recebe o efeito)');
  }

  // ---------------- 7. Nunca dois sons por ação, no código ----------------
  {
    const sem = function (s) { return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''); };
    const vinha = sem(fontes['vinha.js']);
    ok(!/tocarSom\('(colher|cavar|regar)'\)/.test(vinha), 'vinha.js: nenhum tocarSom solto (só via SOM_ACAO_VINHA depois do objetivo)');
    ok((vinha.match(/marcarObjetivoCumprido\(/g) || []).length >= 3, 'vinha.js ainda marca os objetivos');
    ok(/SOM_ACAO_VINHA\.podar/.test(vinha), 'a Poda toca o som de SOM_ACAO_VINHA');
    const gar = sem(fontes['garrafa.js']);
    ok(!/tocarSom\('prensar'\)/.test(gar), 'garrafa.js: nenhum tocarSom solto');
    ok(!/tocarSom\(/.test(sem(fontes['festas.js']).replace(/tocarSom\('objetivoCumprido'\)/, '')), 'festas.js: só o objetivoCumprido, num único sítio (festaSomTarefa)');
    ok(/Array\.isArray|=== true/.test(fontes['objetivos.js']) || /return !semSom/.test(fontes['objetivos.js']), 'marcarObjetivoCumprido devolve se tocou o "ding"');
    // Sem sons novos: só nomes que existem em SOM_EFEITOS e nenhum ficheiro novo em assets/sons.
    const nomes = (vinha + gar + sem(fontes['estrada.js']) + sem(fontes['festas.js'])).match(/(?:SOM_ACAO_[A-Z]+\.\w+|tocarSom\('\w+'\))/g) || [];
    ok(nomes.length > 0, 'devia haver chamadas de som');
    const g = abrir();
    const efeitos = g.json('Object.keys(SOM_EFEITOS)');
    const usados = [];
    (fontes['vinha.js'] + fontes['garrafa.js']).replace(/(?:SOM_ACAO_(?:VINHA|ADEGA) = \{)([^}]*)\}/g, function (m, corpo) { corpo.replace(/:\s*'(\w+)'/g, function (m2, n) { usados.push(n); }); return m; });
    ok(usados.length >= 10 && usados.every(function (n) { return efeitos.indexOf(n) !== -1; }), 'todos os sons das ações existem em SOM_EFEITOS: ' + usados.join(','));
    ok(fs.readdirSync(path.join(RAIZ, 'assets', 'sons')).length === 14, 'assets/sons não devia ter ficheiros novos (14 como antes)');
  }

  // ---------------- 8. 1.º toque: o áudio lança-se em cada toque enquanto não corre ----------------
  {
    const g = abrir();
    g.ev('somCtx = null; somGainMestre = null;'); // como antes do 1.º toque: sem contexto
    const eventos = Object.keys(g.sb.ouvintes);
    ['pointerdown', 'pointerup', 'touchend', 'click'].forEach(function (ev) {
      ok(eventos.indexOf(ev) !== -1, 'o desbloqueio devia escutar o evento ' + ev);
    });
    // Toque com o dedo: o 'pointerdown' cria o contexto, mas o navegador deixa-o parado até ao 'pointerup'/'click'.
    const FabricaOriginal = g.sb.AudioContext;
    g.sb.AudioContext = function () {
      const c = new FabricaOriginal();
      // Com o dedo, o 'pointerdown' ainda não é um gesto: resume() não faz nada até haver gesto (g.sb.__gesto).
      c.resume = function () { c.resumes++; if (g.sb.__gesto) c.state = 'running'; return Promise.resolve(); };
      g.sb.__ctx = c;
      return c;
    };
    g.ev('state.som = true;');
    const disparar = function (ev) { (g.sb.ouvintes[ev] || []).forEach(function (fn) { fn({}); }); };
    disparar('pointerdown');
    ok(g.ev('somCtx') !== null && g.ev("somCtx.state") !== 'running', 'o pointerdown cria o contexto e (com o dedo) ele fica parado');
    ok(g.ev('somPodeTocar()') === true, 'com o contexto criado somPodeTocar é verdadeiro mas o som só se ouve com o contexto a correr');
    g.sb.__gesto = true;       // chega o 'pointerup' / 'click': agora conta como gesto
    disparar('click');
    ok(g.ev("somCtx.state") === 'running', 'o toque seguinte (click) devia pôr o áudio a correr (o 1.º som já se ouve)');
    const n = g.ev('somCtx.resumes'); disparar('click'); disparar('pointerdown');
    ok(g.ev('somCtx.resumes') === n, 'com o áudio a correr, tocar mais não volta a mexer nele');
    // Som desligado: o toque não cria nem lança nada.
    const h = abrir(); h.ev('somCtx = null; somGainMestre = null; state.som = false;');
    (h.sb.ouvintes.pointerdown || []).forEach(function (fn) { fn({}); });
    ok(h.ev('somCtx') === null, 'com o "Som" desligado o toque não cria o contexto');
  }
  return falhas;
}

let falhou = 0;
const base = suite(FONTES);
base.forEach(function (m) { console.log('FALHA: ' + m); falhou++; });

// ---------------- Mutantes ----------------
const M = function (f, a, b, nome) { return { f: f, a: a, b: b, nome: nome }; };
const MUTANTES = [
  M('vinha.js', "plantar: 'cavar'", "plantar: 'colher'", 'Plantar com o som errado'),
  M('vinha.js', "ervas: 'colher'", "ervas: 'cavar'", 'Ervas com o som errado'),
  M('vinha.js', "adubar: 'cavar'", "adubar: 'regar'", 'Adubar com o som errado'),
  M('vinha.js', "compostagem: 'prensar'", "compostagem: 'cavar'", 'Compostar com o som errado'),
  M('vinha.js', "podar: 'colher'", "podar: 'prensar'", 'Podar com o som errado'),
  M('vinha.js', "tocarSom(SOM_ACAO_VINHA.podar);", "", 'Podar sem som'),
  M('vinha.js', "regar: 'regar'", "regar: 'colher'", 'Regar com o som errado'),
  M('vinha.js', "if (!dingAcao && SOM_ACAO_VINHA[actionKey]) tocarSom(SOM_ACAO_VINHA[actionKey]);", "if (SOM_ACAO_VINHA[actionKey]) tocarSom(SOM_ACAO_VINHA[actionKey]);", 'Vinha toca o som da ação por cima do ding'),
  M('vinha.js', "if (!dingColher) tocarSom(SOM_ACAO_VINHA.colher);", "tocarSom(SOM_ACAO_VINHA.colher);", 'Colher toca por cima do ding'),
  M('vinha.js', "if (!dingAcao && SOM_ACAO_VINHA[actionKey]) tocarSom(SOM_ACAO_VINHA[actionKey]);", "", 'Vinha sem som nenhum'),
  M('vinha.js', "  registarCooldownVinha(actionKey);\n  // Só aqui,", "  tocarSom('cavar');\n  registarCooldownVinha(actionKey);\n  // Só aqui,", 'Vinha toca antes de saber se resultou'),
  M('garrafa.js', "destilarVinho: 'regar'", "destilarVinho: 'prensar'", 'Destilar vinho com o som errado'),
  M('garrafa.js', "destilarBagaco: 'regar'", "destilarBagaco: 'cavar'", 'Destilar bagaço com o som errado'),
  M('garrafa.js', "fortificar: 'prensar'", "fortificar: 'regar'", 'Fortificar com o som errado'),
  M('garrafa.js', "prensar: 'prensar'", "prensar: 'colher'", 'Prensar com o som errado'),
  M('garrafa.js', "if (!dingAdega && SOM_ACAO_ADEGA[acao]) tocarSom(SOM_ACAO_ADEGA[acao]);", "if (SOM_ACAO_ADEGA[acao]) tocarSom(SOM_ACAO_ADEGA[acao]);", 'Adega toca por cima do ding'),
  M('garrafa.js', "if (!dingAdega && SOM_ACAO_ADEGA[acao]) tocarSom(SOM_ACAO_ADEGA[acao]);", "", 'Adega sem som'),
  M('estrada.js', "      tocarSom('objetivoCumprido'); // a troca", "      // a troca", 'Estrada Trocar sem som'),
  M('estrada.js', "        tocarSom('objetivoCumprido'); // a oferta", "        // a oferta", 'Estrada Oferecer sem som'),
  M('estrada.js', "      tocarSom('objetivoCumprido'); // a troca não é objetivo do dia: não há outro \"ding\"\n      estradaResultado", "      estradaResultado", 'Estrada Trocar sem som (2)'),
  M('festas.js', "if (ok && !ding) tocarSom('objetivoCumprido');", "if (!ding) tocarSom('objetivoCumprido');", 'Festas tocam ao falhar'),
  M('festas.js', "{ semSom: !ok }", "{}", 'Festas: falhar deixa o ding do objetivo'),
  M('festas.js', "if (ok && !ding) tocarSom('objetivoCumprido');", "if (ok) tocarSom('objetivoCumprido');", 'Festas tocam por cima do ding'),
  M('festas.js', "if (ok && !ding) tocarSom('objetivoCumprido');", "", 'Festas sem som'),
  M('festas.js', "  festaSomTarefa(venceu);", "  festaSomTarefa(true);", 'Castanhas tocam ao falhar'),
  M('festas.js', "  festaSomTarefa(r.venceu);", "  festaSomTarefa(true);", 'Cenas do dia tocam ao falhar'),
  M('objetivos.js', "  return !semSom;\n}", "  return false;\n}", 'marcarObjetivoCumprido nunca avisa do ding'),
  M('objetivos.js', "if (!semSom) tocarSom('objetivoCumprido');", "tocarSom('objetivoCumprido');", 'ding mesmo com semSom'),
  M('som.js', "['pointerdown', 'pointerup', 'touchend', 'click']", "['pointerdown']", '1.º toque: só o pointerdown'),
  M('som.js', "somCtx.state !== 'running') somCtx.resume();\n}\n['pointerdown'", "somCtx.state === 'xx') somCtx.resume();\n}\n['pointerdown'", '1.º toque: nunca retoma'),
  M('som.js', "  if (!state.som) return;\n  somCriarContextoSePreciso();\n  if (somCtx && somCtx.state !== 'running')", "  somCriarContextoSePreciso();\n  if (somCtx && somCtx.state !== 'running')", 'desbloqueio ignora o "Som" desligado')
];
MUTANTES.forEach(function (m) {
  const src = FONTES[m.f];
  if (src.split(m.a).length < 2) { console.log('FALHA: mutante "' + m.nome + '": a âncora já não existe em js/' + m.f); falhou++; return; }
  const fontes = Object.assign({}, FONTES); fontes[m.f] = src.replace(m.a, function () { return m.b; });
  let r;
  try { r = suite(fontes); } catch (e) { r = ['rebentou: ' + e.message]; }
  if (r.length === 0) { console.log('FALHA: o mutante "' + m.nome + '" passou nos testes'); falhou++; }
});

console.log(falhou === 0 ? 'OK (' + MUTANTES.length + ' mutações apanhadas)' : falhou + ' FALHA(S)');
process.exit(falhou === 0 ? 0 : 1);
