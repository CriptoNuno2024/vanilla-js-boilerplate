#!/usr/bin/env node
// Sons de animais (só ficheiros que JÁ existem em assets/sons; nenhum ficheiro novo). Corre os js/ REAIS em vm.
//   Chizo a ladrar (chizo_ladrar.mp3, volume 0,7, como no Proteger) só onde o texto o diz:
//     - Ronda do Chizo, regresso: a fala começa com "Wuf." (ronda.ponte). O pedido e o "Mandar o Chizo" não têm nada.
//     - Lagar, vitória a defender a mesa (lagar.assaltoVitoria: "O Chizo ladra"), em vez do "ding" (um só som).
//     - Castanhas ganhas (castanhasVitoria: "ladra"): é o som da ação em vez do "ding"; se o "ding" do objetivo do dia
//       vai tocar, o ladrar fica calado. Perder continua em silêncio. As outras tarefas das festas (Consoada, Bolo-Rei,
//       Ovos...) não ladram: o texto de sucesso não o diz.
//   Engarrafar: se o "ding" do objetivo do dia toca, garrafa_engarrafar.mp3 não toca; sem objetivo, toca.
//   Nunca dois sons; o "Som" do Perfil manda; porco_grunhir.mp3 só toca no Proteger (nenhum texto do Lagar ou das festas o pede).
// Depois ESTRAGA as regras de propósito (mutantes). Uso: node scripts/verificar-sons-animais.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const LER = function (f) { return fs.readFileSync(path.join(RAIZ, f), 'utf8'); };
const FICHEIROS = ['state.js', 'estacoes.js', 'tempo.js', 'festas.js', 'niveis.js', 'vinha.js', 'alambique.js', 'garrafa.js', 'ronda.js', 'explorar.js',
  'estrada-dados.js', 'despensa.js', 'visitas.js', 'estrada.js', 'lagar.js', 'objetivos.js', 'som.js'];
const FONTES = {};
FICHEIROS.forEach(function (f) { FONTES[f] = LER('js/' + f); });
const AGORA = Date.parse('2026-10-09T10:00:00+01:00');
const DIA = '2026-10-09';
const LADRAR = ['assets/sons/chizo_ladrar.mp3', 0.7];
const ENGARRAFAR = ['assets/sons/garrafa_engarrafar.mp3', 0.7];

function suite(fontes) {
  const falhas = [];
  function ok(cond, msg) { if (!cond) falhas.push(msg); }

  function abrir() {
    const relogio = { t: AGORA };
    class Relogio extends Date {
      constructor(...a) { if (a.length === 0) super(relogio.t); else super(...a); }
      static now() { return relogio.t; }
    }
    const el = function () { return { innerHTML: '', textContent: '', hidden: false, style: { setProperty() {} }, classList: { add() {}, remove() {}, toggle() {} } }; };
    const sb = {
      console: { log() {}, warn() {}, error() {} },
      localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
      location: { search: '' }, URLSearchParams: URLSearchParams, Intl: Intl,
      document: {
        hidden: false, querySelectorAll: function () { return []; }, querySelector: function () { return null; },
        addEventListener: function () {}, getElementById: el
      },
      setTimeout: function () { return 1; }, clearTimeout: function () {}, Image: function () {}, Date: Relogio
    };
    sb.window = sb; sb.addEventListener = function () {}; sb.Telegram = { WebApp: {} };
    sb.AudioContext = function () {
      const node = function () { return { connect() {}, start() {}, stop() {}, frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} }, gain: { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, cancelScheduledValues() {} }, Q: { setValueAtTime() {} }, type: '' }; };
      const ctx = {
        state: 'suspended', currentTime: 0, sampleRate: 8000, destination: {},
        resume: function () { ctx.state = 'running'; return Promise.resolve(); }, suspend: function () { ctx.state = 'suspended'; return Promise.resolve(); },
        createGain: node, createBiquadFilter: node, createOscillator: node, createBufferSource: node,
        createBuffer: function (c, n) { return { getChannelData: function () { return new Float32Array(n); } }; }
      };
      return ctx;
    };
    const cx = vm.createContext(sb);
    vm.runInContext(`
      var DINGS = [], FICH = [];
      function t(k) { return k; }
      function mostrarFalas() {} function applyTranslations() {} function restaurarFundoDoEcraAtual() {} function vibrar() {} function updateStatsDisplays() {}
      function reposicionarFlutuantes() {} function atualizarCartaoObjetivosQuinta() {}
      function localeAtual() { return 'pt-PT'; }
      function faseRealAtual() { return 'repouso'; }
      function jaFezTarefaTempoHoje() { return false; } function registarTarefaTempoHoje() {}
      function entradasBloqueadas() { return []; } function caveReservaAberta() { return true; }
      function garrafaQueMaisDescansou() { return 2; }
      function mostrarNovaEntrada() {} function atualizarDialogo() {} function definirFundo() {}
      function atualizarCartaoNivelQuinta() {} function atualizarResumoQuinta() {} function atualizarLinhaVisitaQuinta() {}
      var currentLang = 'pt'; function goTo() {}
    `, cx);
    FICHEIROS.forEach(function (f) {
      if (f === 'objetivos.js') vm.runInContext('function ecraDesbloqueado() { return true; } function vitoriasProtegerComPremioRestantesHoje() { return 1; }', cx);
      vm.runInContext(fontes[f], cx, { filename: f });
    });
    vm.runInContext(`
      // Os sons que se ouvem: efeitos (tocarSom REAL) e ficheiros (tocarSomFicheiro REAL, só se o "Som" deixa tocar).
      var _tocarReal = tocarSom;
      tocarSom = function (nome) { if (somPodeTocar() && SOM_EFEITOS[nome]) DINGS.push(nome); return _tocarReal(nome); };
      tocarSomFicheiro = function (c, v) { if (somPodeTocar()) FICH.push([c, v]); };
      renderAdega = function () {}; renderFestaHub = function () {}; renderEngarrafar = function () {};
      estradaDesenhar = function () {}; lagarDesenhar = function () {};
      function randInt(a) { return a; }
      function diaLisboaDeHoje() { return '${DIA}'; }
      state = defaultState(); state.som = true;
      somCriarContextoSePreciso(); somCtx.resume();
    `, cx);
    const g = { cx: cx };
    g.ev = function (c) { return vm.runInContext(c, cx); };
    g.json = function (c) { return JSON.parse(vm.runInContext('JSON.stringify(' + c + ')', cx)); };
    g.limpar = function () { g.ev('DINGS = []; FICH = [];'); };
    g.efeitos = function () { return g.json('DINGS'); };
    g.ficheiros = function () { return g.json('FICH'); };
    g.objetivos = function (ids) {
      if (ids.length === 0) ids = ['objetivo_que_nenhuma_acao_cumpre'];
      g.ev('garantirObjetivosDoDia(); state.objetivos.lista = ' + JSON.stringify(ids.map(function (id) { return { id: id, cumprido: false }; })) + '; state.objetivos.bonusDiaDado = false;');
    };
    g.cumprido = function (id) { return g.ev('state.objetivos.lista.filter(function (o) { return o.id === "' + id + '"; })[0].cumprido === true'); };
    return g;
  }
  const jogador = function () {
    const g = abrir();
    g.ev('state.reputacao = 1200; state.uvas = 500; state.gotas = 200; state.garrafas = 4;');
    g.ev('state.adega = Object.assign(state.adega, { bagaco: 9, aguardente: 4, bagaceira: 2, cooldowns: {}, lote: null, historico: [] });');
    g.objetivos([]);
    return g;
  };
  const igual = function (a, b) { return JSON.stringify(a) === JSON.stringify(b); };
  const nada = function (g, msg) { ok(igual(g.efeitos(), []) && igual(g.ficheiros(), []), msg + ': devia ficar em silêncio, tocou ' + JSON.stringify([g.efeitos(), g.ficheiros()])); };
  const so = function (g, efeitos, ficheiros, msg) {
    ok(igual(g.efeitos(), efeitos) && igual(g.ficheiros(), ficheiros), msg + ': devia tocar ' + JSON.stringify([efeitos, ficheiros]) + ', tocou ' + JSON.stringify([g.efeitos(), g.ficheiros()]));
  };

  // ---------------- 1. Ronda do Chizo ----------------
  { // Regresso: "Wuf." (ronda.ponte) -> ladra, uma vez, a 0,7
    const g = jogador();
    g.limpar(); g.ev("rondaChizoMostrarVolta(0, 'teste')");
    so(g, [], [LADRAR], 'Ronda, regresso');
    g.ev('state.som = false;'); g.limpar(); g.ev("rondaChizoMostrarVolta(0, 'teste')");
    nada(g, 'Ronda, regresso com o Som desligado');
  }
  { // Pedido e "Mandar o Chizo": o texto não fala de ladrar
    const g = jogador();
    g.limpar(); g.ev("rondaChizoMostrarPedido('mandar')");
    nada(g, 'Ronda, pedido');
    g.limpar(); g.ev("rondaChizoMandar()");
    nada(g, 'Ronda, Mandar o Chizo');
  }
  { // Meia taça: continua só o "ding" (a fala é o agradecimento + a pista), sem ladrar
    const g = jogador();
    g.ev("var r = rondaChizoEstado(); r.saidaEm = " + (AGORA - 3600000) + "; r.fimEm = " + (AGORA - 1800000) + ";");
    g.limpar(); g.ev("rondaChizoDarMeiaTaca()");
    so(g, ['objetivoCumprido'], [], 'Ronda, meia taça');
  }
  { // Os textos: o regresso começa com "Wuf."/"Woof."/"Guau." nas 3 línguas
    const i18n = LER('js/i18n.js');
    ok(/'ronda\.ponte': 'Wuf\./.test(i18n) && /'ronda\.ponte': 'Woof\./.test(i18n) && /'ronda\.ponte': 'Guau\./.test(i18n), 'ronda.ponte devia começar por Wuf/Woof/Guau');
    ok(/'lagar\.assaltoVitoria': 'O Chizo ladra/.test(i18n) && /'lagar\.assaltoVitoria': 'Chizo barks/.test(i18n) && /'lagar\.assaltoVitoria': 'El Chizo ladra/.test(i18n), 'lagar.assaltoVitoria devia dizer que o Chizo ladra');
    const f = LER('js/festas.js');
    ok(/castanhasVitoria: 'O Chizo acorda a tempo e ladra!/.test(f) && /castanhasVitoria: 'Chizo wakes up just in time and barks!/.test(f) && /castanhasVitoria: '¡El Chizo se despierta a tiempo y ladra!/.test(f), 'castanhasVitoria devia dizer que o Chizo ladra');
  }

  // ---------------- 2. Lagar: defender a mesa ----------------
  const lagarAssalto = function (g, vence) {
    g.ev('state.lagar.mesaDia = "' + DIA + '"; state.lagar.assaltoDia = null;');
    g.ev('lagarAssaltoIniciar()');
    const certa = g.ev('lagarAssaltoCenaAtual.correta');
    g.limpar();
    g.ev('lagarAssaltoResponder(' + (vence ? certa : (certa === 0 ? 1 : 0)) + ')');
  };
  { const g = jogador(); lagarAssalto(g, true); so(g, [], [LADRAR], 'Lagar, vitória (ladra em vez do ding)'); }
  { const g = jogador(); lagarAssalto(g, false); nada(g, 'Lagar, derrota'); }
  { const g = jogador(); g.ev('state.som = false;'); lagarAssalto(g, true); nada(g, 'Lagar, vitória com o Som desligado'); }
  { const g = jogador(); lagarAssalto(g, true); g.limpar(); g.ev('lagarAssaltoResponder(0)'); nada(g, 'Lagar, 2.º toque na mesma cena'); }

  // ---------------- 3. Festas ----------------
  const festa = function (id) { return 'FESTAS_CONFIG.filter(function (f) { return f.id === "' + id + '"; })[0]'; };
  const castanhasJogar = function (g, vence) {
    g.ev('iniciarCastanhas(' + festa('saomartinho') + ')');
    const certa = g.ev('fStr("saomartinho").castanhasCenas[castanhasCenaIndex].correta');
    g.limpar();
    g.ev('responderCastanha(' + (vence ? certa : (certa === 0 ? 1 : 0)) + ')');
  };
  { const g = jogador(); castanhasJogar(g, true); so(g, [], [LADRAR], 'Castanhas ganhas sem objetivo'); }
  { const g = jogador(); g.objetivos(['festa_tarefa']); castanhasJogar(g, true);
    so(g, ['objetivoCumprido'], [], 'Castanhas ganhas com objetivo do dia (só o ding, o ladrar cala-se)'); ok(g.cumprido('festa_tarefa'), 'Castanhas: o objetivo devia contar'); }
  { const g = jogador(); castanhasJogar(g, false); nada(g, 'Castanhas falhadas'); }
  { const g = jogador(); g.objetivos(['festa_tarefa']); castanhasJogar(g, false); nada(g, 'Castanhas falhadas com objetivo'); ok(g.cumprido('festa_tarefa'), 'Castanhas falhadas: o objetivo conta na mesma'); }
  { const g = jogador(); g.ev('state.som = false;'); castanhasJogar(g, true); nada(g, 'Castanhas ganhas com o Som desligado'); }
  // As outras tarefas não ladram (o texto de sucesso não o diz): Consoada, Bolo-Rei, Ovos, Jeropiga, Prova.
  { const g = jogador(); g.limpar(); g.ev('iniciarTarefaFesta("consoada")'.replace('iniciarTarefaFesta("consoada")', 'festaTarefaSimples(' + festa('natal') + ', festaTarefa(' + festa('natal') + ', "consoada"))'));
    so(g, ['objetivoCumprido'], [], 'Consoada (sem ladrar)'); }
  [['natal', 'boloRei'], ['pascoa', 'ovos'], ['carnaval', 'quemEstaMascarado']].forEach(function (c) {
    const g = jogador();
    g.ev('festaIniciarCenaDoDia(' + festa(c[0]) + ', festaTarefa(' + festa(c[0]) + ', "' + c[1] + '"))');
    g.limpar(); g.ev('festaResponderCenaDoDia(festaCenaAtual.cena.correta)');
    so(g, ['objetivoCumprido'], [], c[1] + ' ganho (sem ladrar)');
  });
  { const g = jogador(); g.limpar(); g.ev('fazerJeropiga(' + festa('saomartinho') + ')'); so(g, ['objetivoCumprido'], [], 'Jeropiga (sem ladrar)'); }
  { const g = jogador(); g.ev('state.adega.lote = { iniciadoEm: ' + AGORA + ' };'); g.limpar(); g.ev('provarVinhoNovo(' + festa('saomartinho') + ')'); so(g, ['objetivoCumprido'], [], 'Prova (sem ladrar)'); }

  // ---------------- 4. Engarrafar ----------------
  const engarrafar = function (g, dias) {
    g.ev('state.adega.lote = { iniciadoEm: ' + (AGORA - dias * 86400000) + ' }; adegaGarrafaFeita = null;');
    g.limpar(); g.ev('engarrafarAgora()');
  };
  { const g = jogador(); engarrafar(g, 2); so(g, [], [ENGARRAFAR], 'Engarrafar sem objetivo (toca o ficheiro)'); ok(g.ev('state.garrafas') === 5, 'Engarrafar devia dar a garrafa'); }
  { const g = jogador(); g.objetivos(['adega_engarrafar']); engarrafar(g, 2); so(g, ['objetivoCumprido'], [], 'Engarrafar com objetivo (só o ding)'); ok(g.cumprido('adega_engarrafar'), 'Engarrafar: o objetivo devia contar'); }
  { const g = jogador(); g.objetivos(['adega_prensar']); engarrafar(g, 2); so(g, [], [ENGARRAFAR], 'Engarrafar com outro objetivo do dia (toca o ficheiro)'); }
  { const g = jogador(); engarrafar(g, 0.5); nada(g, 'Engarrafar ainda sem 1 dia'); }
  { const g = jogador(); g.ev('state.som = false;'); engarrafar(g, 2); nada(g, 'Engarrafar com o Som desligado'); }
  { // O "ding" de uma ação anterior da Adega não cala o engarrafar seguinte
    const g = jogador(); g.objetivos(['adega_prensar']); g.ev("executarAcaoAdega('prensar')"); ok(g.cumprido('adega_prensar'), 'Prensar devia cumprir o objetivo');
    engarrafar(g, 2); so(g, [], [ENGARRAFAR], 'Engarrafar depois de um ding de outra ação'); }

  // ---------------- 5. Porco e ficheiros ----------------
  ['festas.js', 'lagar.js', 'ronda.js'].forEach(function (f) {
    ok(!/porco_grunhir/.test(fontes[f]), 'js/' + f + ' não devia usar porco_grunhir.mp3 (nenhum texto o pede)');
  });
  ok(fs.readdirSync(path.join(RAIZ, 'assets/sons')).length === 14, 'assets/sons devia continuar com os 14 ficheiros de sempre');
  ok(/const SOM_CHIZO_LADRAR = 'assets\/sons\/chizo_ladrar\.mp3'/.test(fontes['som.js']) && /SOM_CHIZO_LADRAR_VOLUME = 0\.7/.test(fontes['som.js']), 'o ladrar devia ser chizo_ladrar.mp3 a 0,7');
  return falhas;
}

let falhou = 0;
const base = suite(FONTES);
base.forEach(function (m) { console.log('FALHA: ' + m); falhou++; });

// ---------------- Mutantes ----------------
const M = function (f, a, b, nome) { return { f: f, a: a, b: b, nome: nome }; };
const MUTANTES = [
  M('ronda.js', "  if (typeof tocarSomChizoLadrar === 'function') tocarSomChizoLadrar();\n  mostrarFalas([t('ronda.ponte')", "  mostrarFalas([t('ronda.ponte')", 'Regresso da ronda sem ladrar'),
  M('ronda.js', "function rondaChizoMostrarPedido(acao) {\n", "function rondaChizoMostrarPedido(acao) {\n  tocarSomChizoLadrar();\n", 'Pedido da ronda ladra'),
  M('ronda.js', "  mostrarFalas([t('ronda.saiu')], 'YoshiCat');", "  tocarSomChizoLadrar();\n  mostrarFalas([t('ronda.saiu')], 'YoshiCat');", 'Mandar o Chizo ladra'),
  M('ronda.js', "  vibrar('sucesso');\n  tocarSom('objetivoCumprido');", "  vibrar('sucesso');\n  tocarSom('objetivoCumprido');\n  tocarSomChizoLadrar();", 'Meia taça ladra por cima do ding'),
  M('lagar.js', "if (r.venceu && typeof tocarSomChizoLadrar === 'function') tocarSomChizoLadrar();", "", 'Lagar vitória sem som'),
  M('lagar.js', "if (r.venceu && typeof tocarSomChizoLadrar === 'function') tocarSomChizoLadrar();", "if (typeof tocarSomChizoLadrar === 'function') tocarSomChizoLadrar();", 'Lagar ladra ao perder'),
  M('lagar.js', "if (r.venceu && typeof tocarSomChizoLadrar === 'function') tocarSomChizoLadrar();", "if (r.venceu && typeof tocarSomChizoLadrar === 'function') tocarSomChizoLadrar();\n      if (r.venceu) tocarSom('objetivoCumprido');", 'Lagar ladra e toca o ding (dois sons)'),
  M('lagar.js', "if (r.venceu && typeof tocarSomChizoLadrar === 'function') tocarSomChizoLadrar();", "if (r.venceu && typeof tocarSom === 'function') tocarSom('objetivoCumprido');", 'Lagar volta ao ding'),
  M('festas.js', "if (ladra && typeof tocarSomChizoLadrar === 'function') tocarSomChizoLadrar();\n  else tocarSom('objetivoCumprido');", "tocarSom('objetivoCumprido');", 'Castanhas sem ladrar'),
  M('festas.js', "if (!ok || ding) return;", "if (!ok) return;", 'Castanhas ladram por cima do ding do objetivo'),
  M('festas.js', "if (!ok || ding) return;", "if (ding) return;", 'Festas tocam ao falhar'),
  M('festas.js', "  festaSomTarefa(venceu, venceu);", "  festaSomTarefa(venceu, false);", 'Castanhas ganhas só com o ding'),
  M('festas.js', "  festaSomTarefa(true);\n  saveState(state);\n  updateStatsDisplays();\n  festaMostrarResultado(festa, tarefa,\n    S[tarefa.id + 'Sucesso']", "  festaSomTarefa(true, true);\n  saveState(state);\n  updateStatsDisplays();\n  festaMostrarResultado(festa, tarefa,\n    S[tarefa.id + 'Sucesso']", 'Consoada e doces ladram'),
  M('festas.js', "  festaSomTarefa(r.venceu);", "  festaSomTarefa(r.venceu, r.venceu);", 'Bolo-Rei, Ovos e Mascarados ladram'),
  M('festas.js', "  festaSomTarefa(true);\n\n  const novaEntrada = desbloquearEntradaEnciclopedia('jeropiga');", "  festaSomTarefa(true, true);\n\n  const novaEntrada = desbloquearEntradaEnciclopedia('jeropiga');", 'Jeropiga ladra'),
  M('festas.js', "  castanhasVitoria", "  tocarSomFicheiro('assets/sons/porco_grunhir.mp3', 0.7); castanhasVitoria", 'Festas com o porco a grunhir'),
  M('garrafa.js', "if (!adegaDingTocou) tocarSomFicheiro(", "if (true) tocarSomFicheiro(", 'Engarrafar toca o ficheiro por cima do ding'),
  M('garrafa.js', "if (!adegaDingTocou) tocarSomFicheiro(", "if (adegaDingTocou) tocarSomFicheiro(", 'Engarrafar só toca com ding'),
  M('garrafa.js', "  adegaDingTocou = dingAdega;\n", "", 'Engarrafar não guarda se houve ding'),
  M('garrafa.js', "  if (!adegaDingTocou) tocarSomFicheiro(GARRAFA_SOM_ENGARRAFAR, GARRAFA_ENGARRAFAR_VOLUME); // um só som: com o \"ding\" do objetivo, o ficheiro cala-se\n", "", 'Engarrafar sem som'),
  M('som.js', "SOM_CHIZO_LADRAR_VOLUME = 0.7;", "SOM_CHIZO_LADRAR_VOLUME = 1;", 'Ladrar com o volume errado'),
  M('som.js', "SOM_CHIZO_LADRAR = 'assets/sons/chizo_ladrar.mp3'", "SOM_CHIZO_LADRAR = 'assets/sons/porco_grunhir.mp3'", 'Ladrar com o ficheiro errado'),
  M('som.js', "  tocarSomFicheiro(SOM_CHIZO_LADRAR, SOM_CHIZO_LADRAR_VOLUME);\n}", "  tocarSomFicheiro(SOM_CHIZO_LADRAR, SOM_CHIZO_LADRAR_VOLUME);\n  tocarSomFicheiro(SOM_CHIZO_LADRAR, SOM_CHIZO_LADRAR_VOLUME);\n}", 'Ladrar duas vezes')
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
