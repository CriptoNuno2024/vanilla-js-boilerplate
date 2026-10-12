#!/usr/bin/env node
// Sons de animais (só ficheiros que JÁ existem em assets/sons; nenhum ficheiro novo). Corre os js/ REAIS em vm.
//   Chizo a ladrar (chizo_ladrar.mp3, volume 0,7, como no Proteger) só onde o texto o diz:
//     - Ronda do Chizo, regresso: a fala começa com "Wuf." (ronda.ponte). O pedido e o "Mandar o Chizo" não têm nada.
//     - Lagar, vitória a defender a mesa (lagar.assaltoVitoria: "O Chizo ladra"), em vez do "ding" (um só som).
//     - Castanhas ganhas (castanhasVitoria: "ladra"): é o som da ação em vez do "ding"; se o "ding" do objetivo do dia
//       vai tocar, o ladrar fica calado. Perder continua em silêncio. As outras tarefas das festas (Consoada, Bolo-Rei,
//       Ovos...) não ladram: o texto de sucesso não o diz.
//   São Martinho (js/festas.js, FESTA_SONS): fogueira.mp3 em ciclo, como ambiente, só durante a cena das castanhas (pára ao responder, ao voltar ao menu e
//     ao sair do ecrã; nunca choca com o ambiente do tempo, que só toca na Quinta e na Vinha); nas castanhas ganhas em que a opção certa é assobiar (2.ª e 4.ª
//     cenas, em PT, EN e ES) toca assobio_chizo.mp3 e SÓ QUANDO ACABA (evento ended) o Chizo ladra; nas outras ganhas ladra logo; falhar, nada; com o «ding»
//     do objetivo do dia, só o «ding». Prova do Vinho Novo: tilintar_copos.mp3 só com vinho na Cave (em vez do «ding» genérico, nunca por cima do do objetivo).
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
      var DINGS = [], FICH = [], ACABAR = [], AMB = [], PRE = [];
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
      tocarSomFicheiro = function (c, v, aoAcabar) { if (somPodeTocar()) { FICH.push([c, v]); if (aoAcabar) ACABAR.push(aoAcabar); } };
      // Ambiente: só se regista (iniciar com o «Som» ligado, parar); pré-carga: só se regista o que se pede.
      iniciarSomAmbiente = function (c, v, fade) { if (state.som) AMB.push(['ini', c, v, fade || null]); };
      pararSomAmbiente = function () { AMB.push(['par']); };
      somCarregarFicheiro = function (c) { PRE.push(c); return Promise.resolve(null); };
      var _renderFestaHubReal = renderFestaHub; renderAdega = function () {}; renderFestaHub = function () {}; renderEngarrafar = function () {};
      estradaDesenhar = function () {}; lagarDesenhar = function () {};
      function randInt(a) { return a; }
      function diaLisboaDeHoje() { return '${DIA}'; }
      state = defaultState(); state.som = true;
      somCriarContextoSePreciso(); somCtx.resume();
    `, cx);
    const g = { cx: cx };
    g.ev = function (c) { return vm.runInContext(c, cx); };
    g.json = function (c) { return JSON.parse(vm.runInContext('JSON.stringify(' + c + ')', cx)); };
    g.limpar = function () { g.ev('DINGS = []; FICH = []; ACABAR = []; AMB = []; PRE = [];'); };
    g.efeitos = function () { return g.json('DINGS'); };
    g.ficheiros = function () { return g.json('FICH'); };
    g.ambiente = function () { return g.json('AMB'); };
    g.acabar = function () { g.ev('ACABAR.length ? ACABAR.shift()() : null'); };
    g.pendentes = function () { return g.ev('ACABAR.length'); };
    g.objetivos = function (ids) {
      if (ids.length === 0) ids = ['objetivo_que_nenhuma_acao_cumpre'];
      g.ev('garantirObjetivosDoDia(); state.objetivos.lista = ' + JSON.stringify(ids.map(function (id) { return { id: id, cumprido: false }; })) + '; state.objetivos.bonusDiaDado = false;');
    };
    g.cumprido = function (id) { return g.ev('state.objetivos.lista.filter(function (o) { return o.id === "' + id + '"; })[0].cumprido === true'); };
    return g;
  }
  // Só o som.js REAL (e o state.js) com fontes de áudio de mentira: para provar que o aoAcabar corre no evento 'ended' do ficheiro.
  function abrirSom() {
    const fontesAudio = [];
    const sb = {
      console: { log() {}, warn() {}, error() {} }, localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
      location: { search: '' }, URLSearchParams: URLSearchParams, Intl: Intl,
      document: { hidden: false, addEventListener: function () {}, querySelector: function () { return null; }, querySelectorAll: function () { return []; }, getElementById: function () { return null; } },
      setTimeout: function () { return 1; }, clearTimeout: function () {}, Image: function () {}
    };
    sb.window = sb; sb.addEventListener = function () {}; sb.Telegram = { WebApp: {} };
    sb.AudioContext = function () {
      const p = function () { return { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, cancelScheduledValues() {} }; };
      const node = function () { return { connect() {}, start() {}, stop() {}, frequency: p(), gain: p(), type: '' }; };
      return { state: 'running', currentTime: 0, sampleRate: 8000, destination: {}, resume: function () { return Promise.resolve(); }, suspend: function () { return Promise.resolve(); },
        createGain: node, createBiquadFilter: node, createOscillator: node, createBuffer: function (c, n) { return { getChannelData: function () { return new Float32Array(n); } }; },
        createBufferSource: function () { const f = { buffer: null, comecou: false, onended: null, connect() {}, start() { f.comecou = true; }, stop() {} }; fontesAudio.push(f); return f; } };
    };
    const cx = vm.createContext(sb);
    ['state.js', 'som.js'].forEach(function (n) { vm.runInContext(fontes[n], cx, { filename: n }); });
    // O carregamento do ficheiro é um "thenable" síncrono, que se pode atrasar (ATRASAR) e dar sem ficheiro (NULO).
    vm.runInContext(`var NULO = false, ATRASAR = false, PEND = [];
      somCarregarFicheiro = function (c) { var r = { then: function (f) { var d = function () { f(NULO ? null : { caminho: c }); }; if (ATRASAR) PEND.push(d); else d(); return r; } }; return r; };
      state.som = true; somCriarContextoSePreciso();`, cx);
    const m = { chamadas: [], nulo: false, cb: null };
    m.ev = function (c) { return vm.runInContext(c, cx); };
    m.fontes = function () { return fontesAudio.filter(function (f) { return f.comecou; }); };
    m.tocar = function (caminho, aoAcabar) {
      m.ev('NULO = ' + m.nulo + '; ATRASAR = ' + (!!m.cb) + ';');
      sb.__cb = aoAcabar;
      m.ev("tocarSomFicheiro('" + caminho + "', 0.5, __cb)");
      if (m.cb) { m.cb(); m.ev('PEND.splice(0).forEach(function (d) { d(); })'); }
      return { fontes: m.fontes() };
    };
    return m;
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
  // As outras tarefas não ladram (o texto de sucesso não o diz): Consoada, Bolo-Rei, Ovos, Jeropiga.
  { const g = jogador(); g.limpar(); g.ev('iniciarTarefaFesta("consoada")'.replace('iniciarTarefaFesta("consoada")', 'festaTarefaSimples(' + festa('natal') + ', festaTarefa(' + festa('natal') + ', "consoada"))'));
    so(g, ['objetivoCumprido'], [], 'Consoada (sem ladrar)'); }
  [['natal', 'boloRei'], ['pascoa', 'ovos'], ['carnaval', 'quemEstaMascarado']].forEach(function (c) {
    const g = jogador();
    g.ev('festaIniciarCenaDoDia(' + festa(c[0]) + ', festaTarefa(' + festa(c[0]) + ', "' + c[1] + '"))');
    g.limpar(); g.ev('festaResponderCenaDoDia(festaCenaAtual.cena.correta)');
    so(g, ['objetivoCumprido'], [], c[1] + ' ganho (sem ladrar)');
  });
  { const g = jogador(); g.limpar(); g.ev('fazerJeropiga(' + festa('saomartinho') + ')'); so(g, ['objetivoCumprido'], [], 'Jeropiga (sem ladrar)'); }
  { const g = jogador(); g.ev('state.adega.lote = { iniciadoEm: ' + AGORA + ' };'); g.limpar(); g.ev('provarVinhoNovo(' + festa('saomartinho') + ')'); so(g, [], [['assets/sons/tilintar_copos.mp3', 0.6]], 'Prova (o tilintar, sem ladrar)'); }

  // ---------------- 3b. São Martinho: fogueira, assobio + ladrar, tilintar ----------------
  const SM = festa('saomartinho');
  const ASSOBIO = ['assets/sons/assobio_chizo.mp3', 0.7], TILINTAR = ['assets/sons/tilintar_copos.mp3', 0.6];
  const FOGUEIRA = ['ini', 'assets/sons/fogueira.mp3', 0.35, { entrarS: 1.5, sairS: 1.0 }];
  // Joga a cena k das castanhas: abre (fogueira), escolhe a opção certa (ou uma errada) e devolve o que ficou a tocar.
  const cena = function (g, k, vence) {
    g.ev('iniciarCastanhas(' + SM + '); castanhasCenaIndex = ' + k + ';');
    const certa = g.ev('fStr("saomartinho").castanhasCenas[' + k + '].correta');
    const aberta = g.ambiente();
    g.limpar();
    g.ev('responderCastanha(' + (vence ? certa : (certa + 1) % 3) + ')');
    return aberta;
  };
  { // A fogueira liga ao abrir a cena e pára ao responder; o assobio e o ladrar nunca ao mesmo tempo
    for (let k = 0; k < 4; k++) {
      const assobia = k === 1 || k === 3;
      const g = jogador(); const aberta = cena(g, k, true);
      ok(igual(aberta, [FOGUEIRA]), 'cena ' + k + ': ao abrir devia ligar a fogueira (0,35, fade 1,5/1,0), ligou ' + JSON.stringify(aberta));
      ok(igual(g.ambiente(), [['par']]), 'cena ' + k + ': ao mostrar o resultado a fogueira devia parar, fez ' + JSON.stringify(g.ambiente()));
      if (assobia) {
        ok(igual(g.efeitos(), []) && igual(g.ficheiros(), [ASSOBIO]) && g.pendentes() === 1, 'cena ' + k + ' (opção certa = assobiar): só o assobio, o ladrar à espera; tocou ' + JSON.stringify(g.ficheiros()));
        g.acabar();
        ok(igual(g.ficheiros(), [ASSOBIO, LADRAR]), 'cena ' + k + ': quando o assobio acaba o Chizo ladra, por esta ordem: ' + JSON.stringify(g.ficheiros()));
      } else {
        ok(igual(g.efeitos(), []) && igual(g.ficheiros(), [LADRAR]) && g.pendentes() === 0, 'cena ' + k + ' (sem assobio): só o ladrar, logo; tocou ' + JSON.stringify(g.ficheiros()));
      }
      const e = jogador(); cena(e, k, false);
      nada(e, 'cena ' + k + ' falhada (inclui a opção errada de assobiar)'); ok(e.pendentes() === 0, 'cena ' + k + ' falhada: nada à espera');
      const h = jogador(); h.objetivos(['festa_tarefa']); cena(h, k, true);
      so(h, ['objetivoCumprido'], [], 'cena ' + k + ' com objetivo do dia: só o ding'); ok(h.pendentes() === 0, 'cena ' + k + ' com ding: nem assobio nem ladrar');
      const m = jogador(); m.ev('state.som = false;'); const am = cena(m, k, true);
      nada(m, 'cena ' + k + ' com o Som desligado'); ok(igual(am, []), 'cena ' + k + ' com o Som desligado: sem fogueira');
    }
    // Saiu do ecrã da festa enquanto o assobio tocava: o ladrar não toca
    const g = jogador();
    const p = jogador(); cena(p, 3, true); p.ev("document.querySelector = function () { return { id: 'screen-quinta' }; };"); const antes = p.ficheiros().length; p.acabar();
    ok(p.ficheiros().length === antes, 'se já se saiu da festa, o ladrar depois do assobio não toca');
    // Conferência pelos textos das 3 línguas: as cenas de assobiar são as 2.ª e a 4.ª (pela opção CERTA)
    const L = { pt: /assobi/i, en: /whistl/i, es: /silb/i };
    Object.keys(L).forEach(function (lg) {
      const n = g.ev('FESTAS_STRINGS.saomartinho.' + lg + '.castanhasCenas.length');
      const cert = []; for (let k = 0; k < n; k++) { if (L[lg].test(g.ev('(function (c) { return c.opcoes[c.correta]; })(FESTAS_STRINGS.saomartinho.' + lg + '.castanhasCenas[' + k + '])'))) cert.push(k); }
      ok(igual(cert, g.json('FESTA_SONS.assobioCenas')), lg + ': as cenas em que a opção certa é assobiar são ' + JSON.stringify(cert) + ' e FESTA_SONS.assobioCenas é ' + JSON.stringify(g.json('FESTA_SONS.assobioCenas')));
      // A única opção de assobiar ERRADA é na 1.ª cena (fica em silêncio)
      const erradas = []; for (let k = 0; k < n; k++) { for (let o = 0; o < 3; o++) { if (o !== g.ev('FESTAS_STRINGS.saomartinho.' + lg + '.castanhasCenas[' + k + '].correta') && L[lg].test(g.ev('FESTAS_STRINGS.saomartinho.' + lg + '.castanhasCenas[' + k + '].opcoes[' + o + ']'))) erradas.push([k, o]); } }
      ok(igual(erradas, [[0, 2]]), lg + ': a opção errada de assobiar devia ser só a da 1.ª cena (índice 2), é ' + JSON.stringify(erradas));
    });
  }
  { // A fogueira: nunca fora das castanhas; pára ao voltar ao menu; cena já feita hoje não liga
    const g = jogador(); g.ev('iniciarCastanhas(' + SM + ')'); g.limpar(); g.ev('_renderFestaHubReal()');
    ok(igual(g.ambiente(), [['par']]), 'voltar ao menu da festa devia parar a fogueira, fez ' + JSON.stringify(g.ambiente()));
    const f = jogador(); f.ev('iniciarCastanhas(' + SM + '); castanhasCenaIndex = 0; responderCastanha(0);'); f.limpar(); f.ev('iniciarCastanhas(' + SM + ')');
    ok(!f.ambiente().some(function (a) { return a[0] === 'ini'; }), 'castanhas já feitas hoje: a fogueira não devia ligar');
    const c = jogador(); c.limpar(); c.ev('festaTarefaSimples(' + festa('natal') + ', festaTarefa(' + festa('natal') + ', "consoada"))');
    ok(!c.ambiente().some(function (a) { return a[0] === 'ini'; }), 'a Consoada não devia ligar a fogueira');
    const j = jogador(); j.limpar(); j.ev('fazerJeropiga(' + SM + ')'); ok(!j.ambiente().some(function (a) { return a[0] === 'ini'; }), 'a Jeropiga não devia ligar a fogueira');
    // Não choca com o ambiente do tempo: este só liga na Quinta e na Vinha
    const t = jogador(); t.ev("_tempoAtual = condicaoDeTeste(20, 45, 'sol'); document.querySelector = function () { return { id: 'screen-festa' }; }; atualizarAmbienteExterior();");
    ok(t.ambiente().length === 0, 'o ambiente do tempo não devia ligar no ecrã da festa, ligou ' + JSON.stringify(t.ambiente()));
    ok(/SOM_TEMPO_ECRAS_EXTERIORES = \['screen-quinta', 'screen-vinha'\]/.test(fontes['tempo.js']), 'o tempo só toca na Quinta e na Vinha');
  }
  { // Prova do Vinho Novo: o tilintar só com vinho, nunca por cima do ding
    const g = jogador(); g.ev('state.adega.lote = { iniciadoEm: ' + AGORA + ' };'); g.limpar(); g.ev('provarVinhoNovo(' + SM + ')');
    so(g, [], [TILINTAR], 'Prova com vinho: só o tilintar (0,6)');
    const h = jogador(); h.objetivos(['festa_tarefa']); h.ev('state.adega.lote = { iniciadoEm: ' + AGORA + ' };'); h.limpar(); h.ev('provarVinhoNovo(' + SM + ')');
    so(h, ['objetivoCumprido'], [], 'Prova com o objetivo do dia: só o ding'); ok(h.cumprido('festa_tarefa'), 'Prova: o objetivo devia contar');
    const s = jogador(); s.limpar(); s.ev('provarVinhoNovo(' + SM + ')'); nada(s, 'Prova sem vinho na Cave'); 
    const r = jogador(); r.ev('state.adega.lote = { iniciadoEm: ' + AGORA + ' };'); r.ev('provarVinhoNovo(' + SM + ')'); r.limpar(); r.ev('provarVinhoNovo(' + SM + ')'); nada(r, 'Prova já feita hoje');
    const m = jogador(); m.ev('state.som = false; state.adega.lote = { iniciadoEm: ' + AGORA + ' };'); m.limpar(); m.ev('provarVinhoNovo(' + SM + ')'); nada(m, 'Prova com o Som desligado');
  }
  { // Pré-carga ao entrar na festa de São Martinho (só com o Som a poder tocar); as outras festas não pedem nada
    const g = jogador(); g.ev("festaAtual = function () { return " + SM + "; }; enterFesta();");
    ok(igual(g.json('PRE').slice().sort(), ['assets/sons/assobio_chizo.mp3', 'assets/sons/chizo_ladrar.mp3', 'assets/sons/tilintar_copos.mp3']), 'entrar na festa devia pedir o assobio, o tilintar e o ladrar, pediu ' + JSON.stringify(g.json('PRE')));
    const n = jogador(); n.ev("festaAtual = function () { return " + festa('natal') + "; }; enterFesta();"); ok(igual(n.json('PRE'), []), 'a festa de Natal não pede estes sons');
    const m = jogador(); m.ev("state.som = false; festaAtual = function () { return " + SM + "; }; enterFesta();"); ok(igual(m.json('PRE'), []), 'com o Som desligado não se pede nada');
  }
  { // O mecanismo (som.js real): o ladrar só vem do 'ended' do assobio; sem ficheiro segue logo; sem Som não segue
    const mini = abrirSom();
    const r = mini.tocar('assets/sons/a.mp3', function () { mini.chamadas.push('depois'); });
    ok(r.fontes.length === 1 && typeof r.fontes[0].onended === 'function', 'tocarSomFicheiro devia ligar o aoAcabar ao evento ended da fonte');
    ok(!mini.chamadas.length, 'o aoAcabar não devia correr antes de o som acabar');
    r.fontes[0].onended(); ok(igual(mini.chamadas, ['depois']), 'o aoAcabar devia correr quando o som acaba');
    const sem = abrirSom(); sem.nulo = true; sem.tocar('assets/sons/a.mp3', function () { sem.chamadas.push('seguiu'); });
    ok(igual(sem.chamadas, ['seguiu']), 'se o ficheiro não carregar, a sequência segue logo');
    const mudo = abrirSom(); mudo.ev('state.som = false;'); mudo.tocar('assets/sons/a.mp3', function () { mudo.chamadas.push('x'); });
    ok(!mudo.chamadas.length && mudo.fontes().length === 0, 'com o Som desligado nada toca nem segue');
    const mid = abrirSom(); mid.cb = function () { mid.ev('state.som = false;'); }; mid.tocar('assets/sons/a.mp3', function () { mid.chamadas.push('x'); });
    ok(!mid.chamadas.length && mid.fontes().length === 0, 'se o Som for desligado antes de o ficheiro carregar, nada toca nem segue');
    const sem2 = abrirSom(); sem2.tocar('assets/sons/a.mp3'); ok(sem2.fontes().length === 1 && sem2.fontes()[0].onended === null, 'sem aoAcabar não há ended');
  }

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
  ok(fs.readdirSync(path.join(RAIZ, 'assets/sons')).length === 23, 'assets/sons devia ter 23 ficheiros (os 14 de sempre, os 5 dos gestos os 3 de São Martinho e a prensa)');
  { // Os 3 sons de São Martinho: existem, MP3 mono a 64 kbps, com a duração e o peso certos; os originais saíram da pasta principal
    const cab = function (buf) {
      let i = 0;
      if (buf.slice(0, 3).toString('latin1') === 'ID3') i = 10 + (((buf[6] & 0x7f) << 21) | ((buf[7] & 0x7f) << 14) | ((buf[8] & 0x7f) << 7) | (buf[9] & 0x7f));
      for (; i < buf.length - 4; i++) {
        if (buf[i] === 0xff && (buf[i + 1] & 0xe0) === 0xe0) {
          const v = (buf[i + 1] >> 3) & 3, c = (buf[i + 1] >> 1) & 3, b = buf[i + 2] >> 4;
          if (v !== 3 || c !== 1 || b === 0 || b === 15) continue;
          return { mono: ((buf[i + 3] >> 6) & 3) === 3, kbps: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320][b] };
        }
      }
      return null;
    };
    const SMF = { 'fogueira.mp3': [23.5, 24.5, 200000], 'assobio_chizo.mp3': [0.6, 0.9, 8000], 'tilintar_copos.mp3': [0.7, 0.95, 8500] };
    Object.keys(SMF).forEach(function (n) {
      const p = path.join(RAIZ, 'assets', 'sons', n);
      ok(fs.existsSync(p), n + ' devia existir');
      if (!fs.existsSync(p)) return;
      const b = fs.readFileSync(p), h = cab(b), seg = b.length / 8000;
      ok(h && h.mono && h.kbps === 64, n + ' devia ser MP3 mono a 64 kbps, é ' + JSON.stringify(h));
      ok(seg >= SMF[n][0] && seg <= SMF[n][1], n + ' devia durar ' + SMF[n][0] + ' a ' + SMF[n][1] + ' s, dura ' + seg.toFixed(2));
      ok(b.length <= SMF[n][2], n + ' devia pesar no máximo ' + SMF[n][2] + ' bytes, pesa ' + b.length);
    });
    ['big_branching_fire', 'assobiar_chamar_chizo'].forEach(function (n) { ok(!fs.existsSync(path.join(RAIZ, n + '.mp3')), 'o original ' + n + '.mp3 devia ter saído da pasta principal'); });
    ok(/goTo[\s\S]*?if \(idAnterior && idAnterior !== screen\) pararSomAmbiente\(\);/.test(fontes['main.js'] || LER('js/main.js')), 'goTo devia continuar a parar o ambiente ao sair de um ecrã');
    ok(!/atualizarAmbienteExterior/.test(fontes['festas.js']), 'a festa não liga o ambiente do tempo');
  }
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
  M('festas.js', "  } else if (typeof tocarSomChizoLadrar === 'function') {\n    tocarSomChizoLadrar();\n  }\n}", "  }\n}", 'Castanhas ganhas sem assobio não ladram'),
  M('festas.js', "if (!ok || ding) return;", "if (!ok) return;", 'Castanhas ladram por cima do ding do objetivo'),
  M('festas.js', "if (!ok || ding) return;", "if (ding) return;", 'Festas tocam ao falhar'),
  M('festas.js', "festaSomTarefa(venceu, venceu ? function () { festaSomCastanhasVitoria(castanhasCenaIndex); } : null);", "festaSomTarefa(venceu, null);", 'Castanhas ganhas só com o ding'),
  M('festas.js', "festaSomTarefa(venceu, venceu ? function () { festaSomCastanhasVitoria(castanhasCenaIndex); } : null);", "festaSomTarefa(true, function () { festaSomCastanhasVitoria(castanhasCenaIndex); });", 'Castanhas falhadas tocam'),
  M('festas.js', "  if (typeof tocarAcao === 'function') tocarAcao();\n  else tocarSom('objetivoCumprido');", "  if (typeof tocarAcao === 'function') tocarAcao();\n  tocarSom('objetivoCumprido');", 'O som da ação e o ding genérico juntos'),
  M('festas.js', "  festaSomTarefa(true);\n  saveState(state);\n  updateStatsDisplays();\n  festaMostrarResultado(festa, tarefa,\n    S[tarefa.id + 'Sucesso']", "  festaSomTarefa(true, function () { tocarSomChizoLadrar(); });\n  saveState(state);\n  updateStatsDisplays();\n  festaMostrarResultado(festa, tarefa,\n    S[tarefa.id + 'Sucesso']", 'Consoada e doces ladram'),
  M('festas.js', "  festaSomTarefa(r.venceu);", "  festaSomTarefa(r.venceu, function () { tocarSomChizoLadrar(); });", 'Bolo-Rei, Ovos e Mascarados ladram'),
  M('festas.js', "  festaSomTarefa(true);\n\n  const novaEntrada = desbloquearEntradaEnciclopedia('jeropiga');", "  festaSomTarefa(true, function () { tocarSomChizoLadrar(); });\n\n  const novaEntrada = desbloquearEntradaEnciclopedia('jeropiga');", 'Jeropiga ladra'),
  M('festas.js', "  castanhasVitoria", "  tocarSomFicheiro('assets/sons/porco_grunhir.mp3', 0.7); castanhasVitoria", 'Festas com o porco a grunhir'),
  // Assobio e ladrar
  M('festas.js', "assobioCenas: [1, 3]", "assobioCenas: [0, 1, 3]", 'Assobio também na cena em que assobiar é a opção errada'),
  M('festas.js', "assobioCenas: [1, 3]", "assobioCenas: [1]", 'Assobio só numa cena'),
  M('festas.js', "assobioCenas: [1, 3]", "assobioCenas: [3]", 'Assobio na cena errada'),
  M('festas.js', "assobioCenas: [1, 3]", "assobioCenas: []", 'Sem assobio'),
  M('festas.js', "FESTA_SONS.assobio.volume, festaLadrarSeAindaAqui);", "FESTA_SONS.assobio.volume); festaLadrarSeAindaAqui();", 'O ladrar começa em cima do assobio'),
  M('festas.js', "FESTA_SONS.assobio.volume, festaLadrarSeAindaAqui);", "FESTA_SONS.assobio.volume);", 'O Chizo nunca ladra depois do assobio'),
  M('festas.js', "  if (festaEcraAtivo() && typeof tocarSomChizoLadrar === 'function') tocarSomChizoLadrar();", "  if (typeof tocarSomChizoLadrar === 'function') tocarSomChizoLadrar();", 'O Chizo ladra mesmo depois de sair da festa'),
  M('festas.js', "assobio: { ficheiro: 'assets/sons/assobio_chizo.mp3', volume: 0.7 }", "assobio: { ficheiro: 'assets/sons/assobio_chizo.mp3', volume: 1 }", 'Assobio com o volume errado'),
  M('festas.js', "assobio: { ficheiro: 'assets/sons/assobio_chizo.mp3'", "assobio: { ficheiro: 'assets/sons/tilintar_copos.mp3'", 'Assobio com o ficheiro errado'),
  // Fogueira
  M('festas.js', "  festaIniciarFogueira(); // o Assador a crepitar, só durante a cena\n", "", 'A fogueira nunca liga'),
  M('festas.js', "  festaPararFogueira(); // o resultado final: a fogueira sai em fundo\n", "", 'A fogueira não pára no resultado'),
  M('festas.js', "  festaPararFogueira(); // voltar ao menu da festa: a fogueira das castanhas acaba\n", "", 'A fogueira não pára ao voltar ao menu'),
  M('festas.js', "fogueira: { ficheiro: 'assets/sons/fogueira.mp3', volume: 0.35, fade: { entrarS: 1.5, sairS: 1.0 } }", "fogueira: { ficheiro: 'assets/sons/fogueira.mp3', volume: 0.35 }", 'Fogueira sem fade'),
  M('festas.js', "volume: 0.35, fade", "volume: 1, fade", 'Fogueira alta'),
  M('festas.js', "fogueira: { ficheiro: 'assets/sons/fogueira.mp3'", "fogueira: { ficheiro: 'assets/sons/cave_porta.mp3'", 'Fogueira com o ficheiro errado'),
  M('festas.js', "  festaSomTarefa(true);\n  saveState(state);\n  updateStatsDisplays();\n  festaMostrarResultado(festa, tarefa,\n    S[tarefa.id + 'Sucesso']", "  festaIniciarFogueira();\n  festaSomTarefa(true);\n  saveState(state);\n  updateStatsDisplays();\n  festaMostrarResultado(festa, tarefa,\n    S[tarefa.id + 'Sucesso']", 'A fogueira liga na Consoada'),
  M('tempo.js', "['screen-quinta', 'screen-vinha']", "['screen-quinta', 'screen-vinha', 'screen-festa']", 'O ambiente do tempo liga na festa'),
  // Prova
  M('festas.js', "festaSomTarefa(true, festaSomProva);", "festaSomTarefa(true);", 'Prova só com o ding genérico'),
  M('festas.js', "    festaMensagemAtual = S.provaSemVinho;\n", "    festaMensagemAtual = S.provaSemVinho;\n    festaSomProva();\n", 'Prova toca sem vinho'),
  M('festas.js', "tilintar: { ficheiro: 'assets/sons/tilintar_copos.mp3', volume: 0.6 }", "tilintar: { ficheiro: 'assets/sons/tilintar_copos.mp3', volume: 1 }", 'Tilintar com o volume errado'),
  M('festas.js', "tilintar: { ficheiro: 'assets/sons/tilintar_copos.mp3'", "tilintar: { ficheiro: 'assets/sons/assobio_chizo.mp3'", 'Tilintar com o ficheiro errado'),
  // Pré-carga
  M('festas.js', "  renderFestaHub();\n  festaPreCarregarSons(festa);\n", "  renderFestaHub();\n", 'Não pré-carrega ao entrar na festa'),
  M('festas.js', "if (!festa || festa.id !== 'saomartinho') return;", "if (!festa) return;", 'Pré-carrega em todas as festas'),
  M('festas.js', "if (typeof somPodeTocar !== 'function' || !somPodeTocar() || typeof somCarregarFicheiro !== 'function') return;", "if (typeof somCarregarFicheiro !== 'function') return;", 'Pré-carrega com o Som desligado'),
  // som.js
  M('som.js', "    if (aoAcabar) fonte.onended = aoAcabar;\n", "", 'O aoAcabar nunca corre'),
  M('som.js', "    if (!buffer) { if (aoAcabar) aoAcabar(); return; }", "    if (!buffer) return;", 'Sem ficheiro a sequência não segue'),
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
