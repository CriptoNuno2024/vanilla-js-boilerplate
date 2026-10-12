#!/usr/bin/env node
// Clique suave dos botões (efeito `clique` de js/som.js, sintetizado, sem ficheiros novos).
//   - Toca nos mesmos botões que vibram (.btn-pill, .btn-choice, .btn-tile, .btn, .btn-ghost) e na barra de baixo (.nav-btn),
//     um só por toque (um ouvinte; ícone ou botão dentro de outro = um clique), nunca num botão desativado, nem nos botões do
//     topo (Perfil), nem nos que têm data-sem-vibracao (mesma exceção da vibração). A barra de baixo continua sem vibração.
//   - UM SÓ SOM: o clique só toca se a ação do botão não pediu nenhum som (tocarSom ou tocarSomFicheiro) durante o toque.
//     Não há lista de botões: as ações com som próprio (Vinha, Adega, Engarrafar, Trocar, festas, ding do objetivo, subir de
//     nível, ecrã trancado, regresso do Chizo...) ficam sem clique sozinhas; as silenciosas ou recusadas dão o clique.
//   - "Som" desligado = nada (nem se agenda); funciona sem Telegram (a vibração é à parte).
//   - O efeito: menos de 40 ms, sem tom agudo, e no máximo metade do nível do "ding" objetivoCumprido.
// Corre js/som.js e os js/ das ações REAIS e o bloco `cliques-botoes` de js/main.js em vm, com um AudioContext simulado.
// Depois ESTRAGA as regras de propósito (mutantes). Uso: node scripts/verificar-clique-botoes.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const LER = function (f) { return fs.readFileSync(path.join(RAIZ, f), 'utf8'); };
const FICHEIROS = ['state.js', 'estacoes.js', 'tempo.js', 'festas.js', 'niveis.js', 'vinha.js', 'alambique.js', 'garrafa.js', 'ronda.js', 'explorar.js',
  'estrada-dados.js', 'despensa.js', 'visitas.js', 'estrada.js', 'lagar.js', 'roxo.js', 'objetivos.js', 'som.js'];
const FONTES = {};
FICHEIROS.concat(['main.js']).forEach(function (f) { FONTES[f] = LER('js/' + f); });
const HTML = LER('index.html');
const AGORA = Date.parse('2026-10-09T10:00:00+01:00');
const DIA = '2026-10-09';

function bloco(main) {
  const a = main.indexOf('// >>> cliques-botoes'), b = main.indexOf('// <<< cliques-botoes');
  return a === -1 || b === -1 ? '' : main.slice(a, b);
}

// Elemento de mentira com closest() para os seletores simples que o jogo usa (.classe, [atributo], tag).
function el(classes, opcoes) {
  const o = opcoes || {};
  const e = { classes: classes || [], attrs: o.attrs || {}, disabled: !!o.disabled, parent: o.parent || null, tag: o.tag || 'button' };
  const casa = function (n, s) {
    if (s.charAt(0) === '.') return n.classes.indexOf(s.slice(1)) !== -1;
    if (s.charAt(0) === '[') return Object.prototype.hasOwnProperty.call(n.attrs, s.slice(1, -1));
    return n.tag === s;
  };
  e.closest = function (sel) {
    const alts = sel.split(',').map(function (s) { return s.trim(); });
    for (let n = e; n; n = n.parent) { if (alts.some(function (a) { return casa(n, a); })) return n; }
    return null;
  };
  return e;
}

async function suite(fontes) {
  const falhas = [];
  function ok(cond, msg) { if (!cond) falhas.push(msg); }
  const igual = function (a, b) { return JSON.stringify(a) === JSON.stringify(b); };

  function abrir() {
    const relogio = { t: AGORA };
    class Relogio extends Date {
      constructor(...a) { if (a.length === 0) super(relogio.t); else super(...a); }
      static now() { return relogio.t; }
    }
    const ouvintes = {}, temporizadores = [], hap = [];
    const rec = { gains: [], oscs: [], filtros: [], n: 0 };
    const sb = {
      __agendados: 0,
      console: { log() {}, warn() {}, error() {} },
      localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
      location: { search: '' }, URLSearchParams: URLSearchParams, Intl: Intl,
      document: {
        hidden: false, querySelectorAll: function () { return []; }, querySelector: function () { return null; },
        addEventListener: function (ev, fn) { (ouvintes[ev] = ouvintes[ev] || []).push(fn); },
        getElementById: function () { return { innerHTML: '', style: {}, classList: { add() {}, remove() {}, toggle() {} } }; }
      },
      setTimeout: function (fn) { temporizadores.push(fn); sb.__agendados++; return temporizadores.length; }, clearTimeout: function () {}, Image: function () {}, Date: Relogio
    };
    sb.window = sb; sb.addEventListener = function () {};
    sb.Telegram = { WebApp: { isVersionAtLeast: function () { return true; }, HapticFeedback: {
      impactOccurred: function (x) { hap.push(x); }, notificationOccurred: function (x) { hap.push(x); } } } };
    // Contexto de áudio de mentira que regista as automações (para medir o efeito: duração, nível, frequências).
    sb.AudioContext = function () {
      const param = function (lista, id) {
        return { value: 1, setValueAtTime: function (v, t) { lista.push({ id: id, v: v, t: t }); },
          linearRampToValueAtTime: function (v, t) { lista.push({ id: id, v: v, t: t }); },
          exponentialRampToValueAtTime: function (v, t) { lista.push({ id: id, v: v, t: t }); }, cancelScheduledValues() {} };
      };
      return {
        state: 'running', currentTime: 0, sampleRate: 8000, destination: {},
        resume: function () { return Promise.resolve(); }, suspend: function () { return Promise.resolve(); },
        createGain: function () { return { connect() {}, gain: param(rec.gains, rec.n++) }; },
        createOscillator: function () { return { connect() {}, start() {}, stop() {}, type: '', frequency: param(rec.oscs, rec.n++) }; },
        createBiquadFilter: function () { return { connect() {}, type: '', frequency: param(rec.filtros, rec.n++), Q: param([], rec.n++) }; },
        createBufferSource: function () { return { connect() {}, start() {}, stop() {}, buffer: null, loop: false }; },
        createBuffer: function (c, n) { return { getChannelData: function () { return new Float32Array(n); } }; }
      };
    };
    const cx = vm.createContext(sb);
    vm.runInContext(`
      var SONS = [], FICH = [], SAVES = 0;
      function t(k) { return k; }
      function mostrarFalas() {} function applyTranslations() {} function restaurarFundoDoEcraAtual() {} function updateStatsDisplays() {}
      function reposicionarFlutuantes() {} function atualizarCartaoObjetivosQuinta() {}
      function localeAtual() { return 'pt-PT'; }
      function faseRealAtual() { return 'repouso'; }
      function jaFezTarefaTempoHoje() { return false; } function registarTarefaTempoHoje() {}
      function entradasBloqueadas() { return []; } function caveReservaAberta() { return true; }
      function garrafaQueMaisDescansou() { return 2; }
      function mostrarNovaEntrada() {} function atualizarDialogo() {} function definirFundo() {}
      function pararSomAmbiente() {} function iniciarSomAmbiente() {}
      function atualizarCartaoNivelQuinta() {} function atualizarResumoQuinta() {} function atualizarLinhaVisitaQuinta() {}
      var currentLang = 'pt'; function goTo() {}
    `, cx);
    FICHEIROS.forEach(function (f) {
      if (f === 'objetivos.js') vm.runInContext('function ecraDesbloqueado() { return true; } function vitoriasProtegerComPremioRestantesHoje() { return 1; }', cx);
      vm.runInContext(fontes[f], cx, { filename: f });
    });
    // O bloco real de js/main.js: vibrar() e o ouvinte do clique dos botões.
    vm.runInContext(bloco(fontes['main.js']), cx, { filename: 'main.js' });
    vm.runInContext(`
      var _tocarReal = tocarSom;
      tocarSom = function (nome) { if (somPodeTocar() && SOM_EFEITOS[nome]) SONS.push(nome); return _tocarReal(nome); };
      somCarregarFicheiro = function (c) { FICH.push(c); return Promise.resolve({ caminho: c }); };
      var _saveReal = saveState; saveState = function (s) { SAVES++; return _saveReal(s); };
      renderAdega = function () {}; renderFestaHub = function () {}; renderEngarrafar = function () {}; renderVinha = function () {};
      estradaDesenhar = function () {}; lagarDesenhar = function () {}; renderEstrada = function () {}; roxoDesenhar = function () {};
      function randInt(a) { return a; }
      function diaLisboaDeHoje() { return '${DIA}'; }
      state = defaultState(); state.som = true;
      somCriarContextoSePreciso(); somCtx.resume();
    `, cx);
    const g = { cx: cx, ouvintes: ouvintes, temporizadores: temporizadores, haptica: hap, rec: rec, agendados: function () { return sb.__agendados; } };
    g.ev = function (c) { return vm.runInContext(c, cx); };
    g.json = function (c) { return JSON.parse(vm.runInContext('JSON.stringify(' + c + ')', cx)); };
    g.limpar = function () { g.ev('SONS = []; FICH = []; SAVES = 0;'); hap.length = 0; };
    g.sons = function () { return g.json('SONS'); };
    g.ficheiros = function () { return g.json('FICH'); };
    g.objetivos = function (ids) {
      if (ids.length === 0) ids = ['objetivo_que_nenhuma_acao_cumpre'];
      g.ev('garantirObjetivosDoDia(); state.objetivos.lista = ' + JSON.stringify(ids.map(function (id) { return { id: id, cumprido: false }; })) + '; state.objetivos.bonusDiaDado = false;');
    };
    // Um toque: o navegador chama os ouvintes de captura do clique, depois a ação do botão, e só no fim os temporizadores.
    g.tocar = function (alvo, acao) {
      g.limpar();
      (ouvintes.click || []).slice().forEach(function (fn) { fn({ target: alvo }); });
      if (acao) acao();
      while (temporizadores.length) temporizadores.shift()();
      return { sons: g.sons(), ficheiros: g.ficheiros(), haptica: hap.slice() };
    };
    return g;
  }
  const CLIQUE = ['clique'];
  const jogador = function () {
    const g = abrir();
    g.ev('state.reputacao = 1200; state.uvas = 500; state.gotas = 200; state.garrafas = 4;');
    g.ev('state.vinha = Object.assign(state.vinha, { fase: "preparar", pontosCuidado: 0, residuos: 5, adubo: 1, cooldowns: {} });');
    g.ev('state.adega = Object.assign(state.adega, { bagaco: 9, aguardente: 4, bagaceira: 2, cooldowns: {}, lote: null, historico: [] });');
    g.objetivos([]);
    return g;
  };
  const botao = function (cls, o) { return el(cls || ['btn-pill'], o); };

  // ---------------- 1. Quais elementos dão clique (um só por toque) ----------------
  { const g = abrir();
    ['btn-pill', 'btn-choice', 'btn-tile', 'btn', 'btn-ghost'].forEach(function (c) {
      const r = g.tocar(botao([c]));
      ok(igual(r.sons, CLIQUE) && igual(r.haptica, ['light']), '.' + c + ': devia dar 1 clique e 1 vibração leve, deu ' + JSON.stringify(r));
    });
    const nav = g.tocar(botao(['nav-btn']));
    ok(igual(nav.sons, CLIQUE) && igual(nav.haptica, []), 'barra de baixo: 1 clique e nenhuma vibração (como sempre), deu ' + JSON.stringify(nav));
    const icone = el([], { tag: 'svg', parent: botao(['nav-btn']) });
    ok(igual(g.tocar(icone).sons, CLIQUE), 'toque no ícone da barra de baixo: 1 clique');
    const texto = el([], { tag: 'span', parent: botao(['btn-pill', 'pill-main']) });
    const rt = g.tocar(texto);
    ok(igual(rt.sons, CLIQUE) && igual(rt.haptica, ['light']), 'toque no texto de um botão: 1 clique e 1 vibração, deu ' + JSON.stringify(rt));
    const dentro = botao(['btn-ghost'], { parent: botao(['btn-pill']) });
    const rd = g.tocar(dentro);
    ok(igual(rd.sons, CLIQUE) && igual(rd.haptica, ['light']), 'botão dentro de outro: 1 clique e 1 vibração, deu ' + JSON.stringify(rd));
    const navFilho = el([], { tag: 'span', parent: botao(['nav-btn'], { parent: botao(['btn-pill']) }) });
    ok(igual(g.tocar(navFilho).sons, CLIQUE), 'barra de baixo dentro de um botão: 1 clique, não 2');
    // Fora da lista: botões do topo e outros
    ['profile-btn', 'topcard-header', 'pill-arrow-btn', 'barril-btn', 'visita-linha'].forEach(function (c) {
      ok(igual(g.tocar(botao([c])).sons, []), '.' + c + ' não é dos botões com clique');
    });
    // Exceção da vibração
    const sem = botao(['btn-pill'], { attrs: { 'data-sem-vibracao': '' } });
    const rs = g.tocar(sem);
    ok(igual(rs.sons, []) && igual(rs.haptica, []), 'data-sem-vibracao: nem clique nem vibração, deu ' + JSON.stringify(rs));
    ok(igual(g.tocar(el([], { tag: 'span', parent: sem })).sons, []), 'dentro de data-sem-vibracao: nada');
    // Desativado
    const dis = botao(['btn-pill'], { disabled: true });
    ok(igual(g.tocar(dis).sons, []), 'botão desativado: sem clique');
    ok(igual(g.tocar(el([], { tag: 'span', parent: dis })).sons, []), 'toque dentro de um botão desativado: sem clique');
    // Dois toques = dois cliques
    ok(igual(g.tocar(botao()).sons, CLIQUE) && igual(g.tocar(botao()).sons, CLIQUE), 'cada toque dá o seu clique');
    ok(igual(g.tocar({}).sons, []) && igual(g.tocar(null).sons, []), 'alvos estranhos não rebentam nem dão clique');
  }

  // ---------------- 2. Um só som: a ação com som próprio cala o clique ----------------
  { const g = abrir();
    let r = g.tocar(botao(), function () { g.ev("tocarSom('cavar')"); });
    ok(igual(r.sons, ['cavar']), 'ação com efeito: só o efeito, deu ' + JSON.stringify(r.sons));
    r = g.tocar(botao(['nav-btn']), function () { g.ev("tocarSomFicheiro('assets/sons/chizo_ladrar.mp3', 0.7)"); });
    ok(igual(r.sons, []) && igual(r.ficheiros.length, 1), 'ação com ficheiro: só o ficheiro, sem clique, deu ' + JSON.stringify(r));
    r = g.tocar(botao()); ok(igual(r.sons, CLIQUE), 'o som de um toque anterior não cala o seguinte');
    r = g.tocar(botao(), function () {}); ok(igual(r.sons, CLIQUE), 'ação silenciosa: clique');
    g.ev('state.som = false;');
    r = g.tocar(botao(), function () { g.ev("tocarSom('cavar')"); });
    ok(igual(r.sons, []) && igual(r.ficheiros, []), '"Som" desligado: nada toca');
    r = g.tocar(botao(['nav-btn'])); ok(igual(r.sons, []), '"Som" desligado: sem clique na barra');
    const antesAgendados = g.agendados();
    g.tocar(botao(['nav-btn']));
    ok(g.agendados() === antesAgendados, '"Som" desligado: nem se agenda o clique');
    g.ev('state.som = true;');
    r = g.tocar(botao()); ok(igual(r.sons, CLIQUE), 'voltar a ligar o Som: o clique volta');
  }

  // ---------------- 3. As ações reais ----------------
  // Vinha: cada ação com o seu som (e o clique calado)
  // 'f:nome.mp3' = som real de assets/sons (ficheiro), senão o nome do efeito.
  const VINHA = [
    ['cavar', { fase: 'preparar' }, 'f:cavar_pa.mp3'], ['plantar', { fase: 'preparada' }, 'f:cavar_pa.mp3'], ['ervas', { fase: 'crescendo' }, 'colher'],
    ['regar', { fase: 'crescendo' }, 'f:rega.mp3'], ['adubar', { fase: 'crescendo', adubo: 1 }, 'f:cavar_pa.mp3'],
    ['compostagem', { fase: 'preparar', residuos: 5 }, 'f:folhas_secas.mp3'], ['colher', { fase: 'pronta', pontosCuidado: 4 }, 'f:tesoura_podar.mp3']
  ];
  const somDaVinha = function (r, esperado) {
    return esperado.indexOf('f:') === 0
      ? igual(r.sons, []) && igual(r.ficheiros, ['assets/sons/' + esperado.slice(2)])
      : igual(r.sons, [esperado]) && igual(r.ficheiros, []);
  };
  VINHA.forEach(function (c) {
    const g = jogador(); g.ev('state.vinha = Object.assign(state.vinha, ' + JSON.stringify(c[1]) + ');');
    const r = g.tocar(botao(['btn-pill']), function () { g.ev("executarAcaoVinha('" + c[0] + "')"); });
    ok(somDaVinha(r, c[2]), 'Vinha ' + c[0] + ': só ' + c[2] + ' (sem clique), deu ' + JSON.stringify(r));
  });
  { const g = jogador(); g.ev("estacaoAtual = function () { return 'inverno'; }; state.vinha.fase = 'crescendo';");
    const r = g.tocar(botao(), function () { g.ev("executarAcaoVinha('podar')"); }); ok(somDaVinha(r, 'f:tesoura_podar.mp3'), 'Vinha podar: só a tesoura, deu ' + JSON.stringify(r)); }
  { // Reparar estacas não tem som próprio: clique; com o objetivo do dia, só o "ding"
    const g = jogador(); g.ev('_tempoAtual = condicaoDeTeste(18, 45, "sol");');
    const r = g.tocar(botao(), function () { g.ev("executarAcaoVinha('repararEstacas')"); });
    ok(igual(r.sons, CLIQUE), 'Reparar estacas (silenciosa): clique, deu ' + JSON.stringify(r.sons));
    const h = jogador(); h.ev('_tempoAtual = condicaoDeTeste(18, 45, "sol");'); h.objetivos(['tempo_vento']);
    const r2 = h.tocar(botao(), function () { h.ev("executarAcaoVinha('repararEstacas')"); });
    ok(igual(r2.sons, ['objetivoCumprido']), 'Reparar estacas com objetivo: só o ding, deu ' + JSON.stringify(r2.sons));
    const k = jogador(); k.objetivos(['vinha_cavar']); k.ev('state.vinha.fase = "preparar";');
    const r3 = k.tocar(botao(), function () { k.ev("executarAcaoVinha('cavar')"); });
    ok(igual(r3.sons, ['objetivoCumprido']), 'Cavar com objetivo: só o ding, deu ' + JSON.stringify(r3.sons));
  }
  // Adega e Alambique
  [['prensar', 'prensar'], ['destilarVinho', 'regar'], ['destilarBagaco', 'regar'], ['fortificar', 'prensar']].forEach(function (c) {
    const g = jogador(); const r = g.tocar(botao(), function () { g.ev("executarAcaoAdega('" + c[0] + "')"); });
    if (c[0] === 'prensar') ok(igual(r.sons, []) && r.ficheiros.length === 1 && /prensa\.mp3/.test(JSON.stringify(r.ficheiros)), 'Adega prensar: só o ficheiro da prensa, sem clique, deu ' + JSON.stringify(r));
    else ok(igual(r.sons, [c[1]]), 'Adega ' + c[0] + ': só ' + c[1] + ', deu ' + JSON.stringify(r.sons));
  });
  { // Ver o lote / Voltar: silenciosos, clique
    const g = jogador(); ok(igual(g.tocar(botao(), function () { g.ev("goTo('engarrafar')"); }).sons, CLIQUE), 'Ver o lote: clique');
    // Engarrafar agora: ficheiro (data-sem-vibracao) sem objetivo; com objetivo, o ding
    const e = jogador(); e.ev('state.adega.lote = { iniciadoEm: ' + (AGORA - 2 * 86400000) + ' };');
    const re = e.tocar(botao(['btn-pill'], { attrs: { 'data-sem-vibracao': '' } }), function () { e.ev('engarrafarAgora()'); });
    ok(igual(re.sons, []) && re.ficheiros.length === 1, 'Engarrafar agora: só o ficheiro, deu ' + JSON.stringify(re));
    const d = jogador(); d.objetivos(['adega_engarrafar']); d.ev('state.adega.lote = { iniciadoEm: ' + (AGORA - 2 * 86400000) + ' };');
    const rd = d.tocar(botao(['btn-pill'], { attrs: { 'data-sem-vibracao': '' } }), function () { d.ev('engarrafarAgora()'); });
    ok(igual(rd.sons, ['objetivoCumprido']) && rd.ficheiros.length === 0, 'Engarrafar agora com objetivo: só o ding, deu ' + JSON.stringify(rd));
  }
  { // Estrada: Trocar e Oferecer
    const g = jogador(); g.ev("state.reputacao = 1200; state.uvas = 500;");
    const r = g.tocar(botao(), function () { g.ev("estradaTrocarClique('dona_amelia')"); });
    ok(igual(r.sons, ['objetivoCumprido']), 'Estrada, Trocar: só o ding, deu ' + JSON.stringify(r.sons));
    const o = jogador(); o.ev("state.visitas = { feitas: {}, hoje: { dia: '" + DIA + "', id: 'valentim_4', feita: true } }; state.despensa.recebidos = { queijo_azeitao: 2 };");
    const ro = o.tocar(botao(), function () { o.ev('estradaOferecerClique()'); });
    ok(igual(ro.sons, ['objetivoCumprido']), 'Estrada, Oferecer: só o ding, deu ' + JSON.stringify(ro.sons));
  }
  { // Festas
    const g = jogador(); g.ev("festaAtual = function () { return FESTAS_CONFIG.filter(function (f) { return f.id === 'natal'; })[0]; };");
    const r = g.tocar(botao(), function () { g.ev("iniciarTarefaFesta('consoada')"); });
    ok(igual(r.sons, ['objetivoCumprido']), 'Festa, Consoada: só o ding, deu ' + JSON.stringify(r.sons));
    const c = jogador(); c.ev("festaAtual = function () { return FESTAS_CONFIG.filter(function (f) { return f.id === 'saomartinho'; })[0]; };");
    ok(igual(c.tocar(botao(), function () { c.ev("iniciarTarefaFesta('castanhas')"); }).sons, CLIQUE), 'Castanhas, abrir a cena (silenciosa): clique');
    const certa = c.ev('fStr("saomartinho").castanhasCenas[castanhasCenaIndex].correta');
    const rc = c.tocar(botao(['btn-choice']), function () { c.ev('responderCastanha(' + certa + ')'); });
    ok(igual(rc.sons, []) && rc.ficheiros.length === 1, 'Castanhas, acertar: só o ladrar, deu ' + JSON.stringify(rc));
    const f = jogador(); f.ev("festaAtual = function () { return FESTAS_CONFIG.filter(function (f) { return f.id === 'saomartinho'; })[0]; }; iniciarTarefaFesta('castanhas');");
    const rf = f.tocar(botao(['btn-choice']), function () { f.ev('responderCastanha(' + ((certa + 1) % 3) + ')'); });
    ok(igual(rf.sons, CLIQUE) && rf.ficheiros.length === 0, 'Castanhas, falhar: só o clique do botão (o resultado continua em silêncio), deu ' + JSON.stringify(rf));
    // Cena de assobiar (2.ª): o assobio é um ficheiro, por isso o clique cala-se (e o ladrar fica à espera do fim do assobio)
    const w = jogador(); w.ev("festaAtual = function () { return FESTAS_CONFIG.filter(function (f) { return f.id === 'saomartinho'; })[0]; }; iniciarTarefaFesta('castanhas'); castanhasCenaIndex = 1;");
    const rw = w.tocar(botao(['btn-choice']), function () { w.ev('responderCastanha(1)'); });
    ok(igual(rw.sons, []) && igual(rw.ficheiros, ['assets/sons/assobio_chizo.mp3']), 'Castanhas, cena de assobiar: só o assobio (sem clique), deu ' + JSON.stringify(rw));
    // Prova do Vinho Novo com vinho: o tilintar cala o clique; sem vinho (silenciosa) só dá o clique
    const p = jogador(); p.ev("festaAtual = function () { return FESTAS_CONFIG.filter(function (f) { return f.id === 'saomartinho'; })[0]; }; state.adega.lote = { iniciadoEm: " + AGORA + " };");
    const rp = p.tocar(botao(), function () { p.ev("iniciarTarefaFesta('prova')"); });
    ok(igual(rp.sons, []) && igual(rp.ficheiros, ['assets/sons/tilintar_copos.mp3']), 'Prova com vinho: só o tilintar (sem clique), deu ' + JSON.stringify(rp));
    const q = jogador(); q.ev("festaAtual = function () { return FESTAS_CONFIG.filter(function (f) { return f.id === 'saomartinho'; })[0]; };");
    const rq = q.tocar(botao(), function () { q.ev("iniciarTarefaFesta('prova')"); });
    ok(igual(rq.sons, CLIQUE) && rq.ficheiros.length === 0, 'Prova sem vinho (silenciosa): só o clique, deu ' + JSON.stringify(rq));
  }
  { // Ronda do Chizo: Mandar não tem som (clique); meia taça tem o ding; o regresso (ao entrar na Quinta) ladra
    const g = jogador(); g.ev("rondaChizoMostrarPedido('mandar')");
    ok(igual(g.tocar(botao(), function () { g.ev('rondaChizoBotao()'); }).sons, CLIQUE), 'Mandar o Chizo (silencioso): clique');
    const m = jogador(); m.ev("var r = rondaChizoEstado(); r.saidaEm = " + (AGORA - 3600000) + "; r.fimEm = " + (AGORA - 1800000) + "; rondaChizoMostrarVolta(0, 'meiaTaca');");
    m.limpar();
    const rm = m.tocar(botao(), function () { m.ev('rondaChizoBotao()'); });
    ok(igual(rm.sons, ['objetivoCumprido']), 'Meia taça: só o ding, deu ' + JSON.stringify(rm.sons));
    const v = jogador();
    const rv = v.tocar(botao(['nav-btn']), function () { v.ev("rondaChizoMostrarVolta(0, 'teste')"); });
    ok(igual(rv.sons, []) && rv.ficheiros.length === 1, 'Barra de baixo, regresso do Chizo: só o ladrar, deu ' + JSON.stringify(rv));
  }
  { // Barra de baixo: ecrã trancado (ecraTrancado), subir de nível (subiuNivel) e navegação simples (clique)
    const g = jogador(); g.ev('state.reputacao = 0; state.acesso.jogadorAntigo = false;');
    const rt = g.tocar(botao(['nav-btn', 'trancado']), function () { g.ev("mostrarMensagemTrancada('proteger')"); });
    ok(igual(rt.sons, ['ecraTrancado']), 'Cadeado: só o ecraTrancado, sem clique, deu ' + JSON.stringify(rt.sons));
    const n = jogador(); n.ev('state.niveis.nivelMostrado = 1; state.reputacao = 20;');
    const rn = n.tocar(botao(['nav-btn', 'nav-btn-home']), function () { n.ev('verificarSubidaNivel()'); });
    ok(igual(rn.sons, ['subiuNivel']), 'Subir de nível ao entrar na Quinta: só o subiuNivel, deu ' + JSON.stringify(rn.sons));
    const p = jogador(); p.ev('state.niveis.nivelMostrado = 7;'); const rp = p.tocar(botao(['nav-btn']), function () { p.ev('verificarSubidaNivel()'); }); ok(igual(rp.sons, CLIQUE), 'Navegar sem nada novo: clique, deu ' + JSON.stringify(rp.sons));
  }
  { // Lagar: pisar (ding) e defender a mesa (ladrar a ganhar, clique a falhar)
    const g = jogador(); const r = g.tocar(botao(), function () { g.ev('lagarPisarClique()'); });
    ok(igual(r.sons, ['objetivoCumprido']), 'Lagar, pisar: só o ding, deu ' + JSON.stringify(r.sons));
    const w = jogador(); w.ev('state.lagar.mesaDia = "' + DIA + '"; lagarAssaltoIniciar();');
    const certa = w.ev('lagarAssaltoCenaAtual.correta');
    const rw = w.tocar(botao(['btn-choice']), function () { w.ev('lagarAssaltoResponder(' + certa + ')'); });
    ok(igual(rw.sons, []) && rw.ficheiros.length === 1, 'Lagar, defender a mesa a ganhar: só o ladrar, deu ' + JSON.stringify(rw));
  }
  { // Cepa Roxa: brindar toca a rolha (ficheiro, conta como som: sem clique e sem o «ding»); o botão desativado não dá clique
    const g = jogador(); g.ev('state.reputacao = 3000; state.garrafas = 12;');
    const r = g.tocar(botao(), function () { g.ev('roxoBrindarClique()'); });
    ok(igual(r.sons, []) && igual(r.ficheiros, ['assets/sons/rolha.mp3']), 'Cepa Roxa, brindar: só a rolha (sem ding nem clique), deu ' + JSON.stringify(r));
    ok(igual(g.tocar(botao([], { disabled: true }), function () { g.ev('roxoBrindarClique()'); }).sons, []), 'Cepa Roxa, botão desativado: sem clique');
    const h = jogador(); h.ev('state.reputacao = 3000; state.garrafas = 3;');
    const rh = h.tocar(botao(), function () { h.ev('roxoBrindarClique()'); });
    ok(igual(rh.sons, CLIQUE) && igual(rh.ficheiros, []), 'Cepa Roxa, brinde recusado (silencioso): só o clique do botão, deu ' + JSON.stringify(rh));
  }
  { // "Som" desligado nas ações reais: nada, nem clique
    const g = jogador(); g.ev('state.som = false; state.vinha.fase = "preparar";');
    const r = g.tocar(botao(), function () { g.ev("executarAcaoVinha('cavar')"); });
    ok(igual(r.sons, []) && igual(r.ficheiros, []), 'Som desligado: nada toca');
    const s = jogador(); s.ev('state.som = false;'); ok(igual(s.tocar(botao(['nav-btn'])).sons, []), 'Som desligado: a barra de baixo fica muda');
  }

  // ---------------- 4. O efeito: curto, baixo e seco ----------------
  { const g = abrir();
    const medir = function (nome) {
      g.rec.gains.length = 0; g.rec.oscs.length = 0; g.rec.filtros.length = 0;
      g.ev("SOM_EFEITOS['" + nome + "']()");
      const porNo = {}; let dur = 0;
      g.rec.gains.forEach(function (e) { porNo[e.id] = Math.max(porNo[e.id] || 0, e.v); dur = Math.max(dur, e.t); });
      const pico = Object.keys(porNo).reduce(function (s, k) { return s + porNo[k]; }, 0);
      return { dur: dur, pico: pico, osc: g.rec.oscs.map(function (e) { return e.v; }), filtro: g.rec.filtros.map(function (e) { return e.v; }) };
    };
    const ding = medir('objetivoCumprido'), clique = medir('clique');
    ok(Math.abs(ding.pico - 0.2) < 1e-9, 'o ding de referência devia ter pico 0,2, tem ' + ding.pico);
    ok(clique.dur > 0 && clique.dur < 0.04, 'o clique devia durar menos de 40 ms, dura ' + (clique.dur * 1000).toFixed(0) + ' ms');
    ok(clique.pico > 0 && clique.pico <= ding.pico / 2, 'o clique devia ter no máximo metade do nível do ding (' + ding.pico + '), tem ' + clique.pico);
    ok(clique.osc.length > 0 && clique.osc.every(function (f) { return f <= 400; }), 'o corpo do clique devia ser grave (até 400 Hz), tem ' + JSON.stringify(clique.osc));
    ok(clique.filtro.length > 0 && clique.filtro.every(function (f) { return f <= 3000; }), 'o estalo devia ser seco (filtro até 3 kHz), tem ' + JSON.stringify(clique.filtro));
  }

  // ---------------- 5. Código e HTML ----------------
  const b = bloco(fontes['main.js']);
  ok(b.length > 0, 'js/main.js devia ter o bloco cliques-botoes');
  ok((b.match(/document\.addEventListener\('click'/g) || []).length === 1, 'o bloco devia ter um só ouvinte de clique');
  ok(/if \(typeof ecraDesbloqueado === 'function' && !ecraDesbloqueado\(screen\)\) \{\s*if \(typeof mostrarMensagemTrancada === 'function'\) mostrarMensagemTrancada\(screen\);\s*return;/.test(fontes['main.js']), 'goTo devia continuar a mostrar a mensagem do cadeado (ecraTrancado) sem navegar');
  const nav = HTML.match(/<nav id="app-bottomnav"[\s\S]*?<\/nav>/);
  ok(nav && (nav[0].match(/<button type="button" class="nav-btn/g) || []).length === 5 && !/btn-pill|btn-ghost|btn-choice|btn-tile/.test(nav[0]), 'a barra de baixo devia ter 5 botões .nav-btn, sem outras classes de botão');
  ok(/data-sem-vibracao/.test(fontes['garrafa.js']), 'Engarrafar continua com data-sem-vibracao');
  return falhas;
}

(async function () {
  let falhou = 0;
  const base = await suite(FONTES);
  base.forEach(function (m) { console.log('FALHA: ' + m); falhou++; });

  const M = function (f, a, b, nome) { return { f: f, a: a, b: b, nome: nome }; };
  const MUTANTES = [
    M('main.js', "const clicado = botao || barra;", "const clicado = botao;", 'Barra de baixo sem clique'),
    M('main.js', "  if (e.target.closest('[data-sem-vibracao]')) return;\n", "", 'data-sem-vibracao dá clique e vibração'),
    M('main.js', "if (clicado && !clicado.disabled && ", "if (clicado && ", 'Botão desativado dá clique'),
    M('main.js', "  if (botao) vibrar('leve');", "  if (botao || barra) vibrar('leve');", 'Barra de baixo vibra'),
    M('main.js', "  const botao = e.target.closest('.btn-pill, .btn-choice, .btn-tile, .btn, .btn-ghost');", "  const botao = e.target.matches('.btn-pill, .btn-choice, .btn-tile, .btn, .btn-ghost') ? e.target : null;", 'Só o próprio elemento (ícone sem clique)'),
    M('main.js', "'.btn-pill, .btn-choice, .btn-tile, .btn, .btn-ghost');\n  const barra", "'.btn-pill, .btn-choice, .btn-tile, .btn');\n  const barra", '.btn-ghost sem clique'),
    M('main.js', "'.btn-pill, .btn-choice, .btn-tile, .btn, .btn-ghost');\n  const barra", "'.btn-pill, .btn-choice, .btn-tile, .btn, .btn-ghost, .profile-btn');\n  const barra", 'Botão Perfil com clique'),
    M('main.js', "}, true);\n// <<< cliques-botoes", "}, true);\ndocument.addEventListener('click', function (e) { if (e.target.closest('.nav-btn')) tocarCliqueSeNadaTocou(); }, true);\n// <<< cliques-botoes", 'Dois cliques na barra de baixo'),
    M('som.js', "    if (somToques === antes) tocarSom('clique');", "    tocarSom('clique');", 'Clique mesmo com som da ação'),
    M('som.js', "  setTimeout(function () {\n    if (somToques === antes) tocarSom('clique');\n  }, 0);", "  if (somToques === antes) tocarSom('clique');", 'Decide antes de a ação correr'),
    M('som.js', "  if (efeito) { somToques++; efeito(); }", "  if (efeito) { efeito(); }", 'Efeitos não contam como som'),
    M('som.js', "  somToques++;\n  somCarregarFicheiro", "  somCarregarFicheiro", 'Ficheiros não contam como som'),
    M('som.js', "  if (!state.som) return;\n  const antes = somToques;", "  const antes = somToques;", 'Agenda o clique com o Som desligado'),
    M('som.js', "somTocarRuidoFiltrado(0, 0.03, 'bandpass', 2400, 900, 0.03, false);\n    somTocarTom(190, 0, 0.03, 'sine', 0.03);", "somTocarRuidoFiltrado(0, 0.12, 'bandpass', 2400, 900, 0.03, false);\n    somTocarTom(190, 0, 0.12, 'sine', 0.03);", 'Clique de 120 ms'),
    M('som.js', "2400, 900, 0.03, false);", "2400, 900, 0.2, false);", 'Clique alto'),
    M('som.js', "somTocarTom(190, 0, 0.03, 'sine', 0.03);", "somTocarTom(1760, 0, 0.03, 'sine', 0.03);", 'Clique com beep agudo'),
    M('som.js', "'bandpass', 2400, 900,", "'bandpass', 9000, 6000,", 'Clique agudo (ruído de 9 kHz)'),
    M('som.js', "  clique: function () {", "  cliqueX: function () {", 'Efeito clique inexistente'),
    M('roxo.js', "tocarSomDaAcao(SOM_ROXO_BRINDE); // só a rolha", "tocarSom('objetivoCumprido'); // só a rolha", 'Brindar volta ao ding'),
    M('roxo.js', "tocarSomDaAcao(SOM_ROXO_BRINDE); // só a rolha", "tocarSomDaAcao(SOM_ROXO_BRINDE); tocarSom('objetivoCumprido'); // só a rolha", 'Brindar toca a rolha e o ding')
  ];
  for (const m of MUTANTES) {
    const src = FONTES[m.f];
    if (src.split(m.a).length < 2) { console.log('FALHA: mutante "' + m.nome + '": a âncora já não existe em js/' + m.f); falhou++; continue; }
    const fontes = Object.assign({}, FONTES); fontes[m.f] = src.replace(m.a, function () { return m.b; });
    let r;
    try { r = await suite(fontes); } catch (e) { r = ['rebentou: ' + e.message]; }
    if (r.length === 0) { console.log('FALHA: o mutante "' + m.nome + '" passou nos testes'); falhou++; }
  }

  console.log(falhou === 0 ? 'OK (' + MUTANTES.length + ' mutações apanhadas)' : falhou + ' FALHA(S)');
  process.exit(falhou === 0 ? 0 : 1);
})();
