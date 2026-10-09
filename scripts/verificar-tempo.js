#!/usr/bin/env node
// Relógio errado (carimbos no futuro e data a voltar atrás). Corre os ficheiros REAIS do jogo
// (state.js, tempo.js, vinha.js, garrafa.js, ronda.js, objetivos.js, proteger.js, visitas.js) num ambiente
// simulado (vm) com um relógio que o teste controla, sem browser nem conta real.
//
// A. Um carimbo guardado MAIOR do que "agora" conta como "agora" (carimboCorrigirFuturo em
//    js/tempo.js): cooldowns da Vinha, do Prensar e do Alambique, início do lote e diasDescansadosNaCave, Ronda do
//    Chizo. Só carimbos no futuro são corrigidos (ficam com "agora"); os normais nunca são tocados.
// B. Os objetivos do dia (e o bónus), o limite de 2 vitórias com prémio do Proteger e a visita do dia só se
//    repõem quando o dia de Lisboa de hoje é MAIOR do que o guardado (diaLisboaMudou, texto AAAA-MM-DD).
//
// Depois de passar, aplica "mutações" (estraga cada regra de propósito) e confirma que o teste as apanha.
//
// Uso: node scripts/verificar-tempo.js
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
// O aparelho está noutro fuso (Nova Zelândia, UTC+13 em novembro): o dia do aparelho adianta-se ao de Lisboa.
process.env.TZ = 'Pacific/Auckland';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const FICHEIROS = ['state.js', 'estacoes.js', 'tempo.js', 'festas.js', 'niveis.js', 'vinha.js', 'garrafa.js', 'ronda.js', 'objetivos.js', 'assaltos.js', 'proteger.js', 'visitas.js'];
const FONTES = {};
FICHEIROS.forEach(function (f) { FONTES[f] = fs.readFileSync(path.join(RAIZ, 'js', f), 'utf8'); });
const INDEX = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');

const MIN = 60 * 1000, H = 60 * MIN, DIA = 24 * H;
// Outubro de 2026 em Lisboa = UTC+1. d(9, '10:00') = dia 9 às 10:00 de Lisboa.
function d(dia, hhmm) { return Date.parse('2026-10-' + (dia < 10 ? '0' : '') + dia + 'T' + hhmm + ':00+01:00'); }

function suite(fontes) {
  const falhas = [];
  function ok(cond, msg) { if (!cond) falhas.push(msg); }

  // Ambiente com relógio controlado: Date.now() e new Date() leem relogio.t.
  function abrir(inicioMs, guardadoInicial, pesquisa) {
    const relogio = { t: inicioMs };
    const guardado = {};
    if (guardadoInicial) guardado.yoshicat_quinta_state_v2 = JSON.stringify(guardadoInicial);
    class Relogio extends Date {
      constructor(...a) { if (a.length === 0) super(relogio.t); else super(...a); }
      static now() { return relogio.t; }
    }
    const sb = {
      console: { log() {}, warn() {}, error() {} },
      localStorage: {
        getItem: function (k) { return Object.prototype.hasOwnProperty.call(guardado, k) ? guardado[k] : null; },
        setItem: function (k, v) { guardado[k] = String(v); },
        removeItem: function (k) { delete guardado[k]; }
      },
      location: { search: pesquisa || '' }, URLSearchParams: URLSearchParams, Intl: Intl,
      document: { querySelectorAll: function () { return []; }, getElementById: function () { return null; }, querySelector: function () { return null; }, addEventListener: function () {} },
      setTimeout: function () { return 1; }, clearTimeout: function () {}, Image: function () {}, Date: Relogio
    };
    sb.window = sb;
    sb.addEventListener = function () {};
    sb.Telegram = { WebApp: {} };
    const cx = vm.createContext(sb);
    vm.runInContext(`
      var SAVES = 0;
      function t(k) { return k; }
      function randInt(a) { return a; }
      function mostrarFalas() {} function vibrar() {} function tocarSom() {} function updateStatsDisplays() {}
      function reposicionarFlutuantes() {} function atualizarCartaoObjetivosQuinta() {}
      function localeAtual() { return 'pt-PT'; }
      function faseRealAtual() { return 'repouso'; }
      function festaAtual() { return null; } function festaJaFezTarefaHoje() { return true; }
      function jaFezTarefaTempoHoje() { return true; } function ecraDesbloqueado() { return false; }
      function encyclopediaEntries() { return [{ id: 'x', texto: 'curiosidade' }]; }
      function entradasBloqueadas() { return []; } function caveReservaAberta() { return true; }
      function garrafaQueMaisDescansou() { return 2; }
      function marcarObjetivoCumpridoTeste() {}
    `, cx);
    ['state.js', 'estacoes.js', 'tempo.js', 'festas.js', 'niveis.js', 'vinha.js', 'garrafa.js', 'ronda.js'].forEach(function (f) {
      vm.runInContext(fontes[f], cx, { filename: f });
    });
    vm.runInContext(`
      function vitoriasProtegerComPremioRestantesHojeStub() { return 0; }
      var _saveReal = saveState; saveState = function (s) { SAVES++; return _saveReal(s); };
    `, cx);
    // objetivos.js chama garantirObjetivosDoDia() ao carregar; o resto depende dele.
    ['objetivos.js', 'assaltos.js', 'proteger.js', 'visitas.js'].forEach(function (f) {
      vm.runInContext(fontes[f], cx, { filename: f });
    });
    vm.runInContext('renderAdega = function () {};', cx);
    const g = { cx: cx, relogio: relogio, guardado: guardado };
    g.ev = function (c) { return vm.runInContext(c, cx); };
    g.json = function (c) { return JSON.parse(vm.runInContext('JSON.stringify(' + c + ')', cx)); };
    g.ir = function (ms) { relogio.t = ms; };
    return g;
  }

  // Estado de um jogador a sério: nível 5 (Reputação 372), jogador antigo, com o que for preciso por cima.
  function jogador(agora, extra) {
    const g = abrir(agora);
    g.ev('state.reputacao = 372; state.uvas = 773; state.gotas = 10;');
    if (extra) g.ev('Object.assign(state, ' + JSON.stringify(extra) + ');');
    return g;
  }

  // ---------------- Regras puras ----------------
  {
    const g = abrir(d(9, '10:00'));
    g.ev('var o = { a: 5, b: 20, c: 10, d: 0, e: "abc", f: null }');
    ok(g.ev("carimboCorrigirFuturo(o, 'a', 10)") === 5 && g.ev('o.a') === 5, 'carimbo no passado fica igual');
    ok(g.ev("carimboCorrigirFuturo(o, 'b', 10)") === 10 && g.ev('o.b') === 10, 'carimbo no futuro passa a agora');
    ok(g.ev("carimboCorrigirFuturo(o, 'c', 10)") === 10 && g.ev('o.c') === 10, 'carimbo igual a agora fica igual');
    ok(g.ev("carimboCorrigirFuturo(o, 'd', 10)") === 0 && g.ev("carimboCorrigirFuturo(o, 'e', 10)") === 'abc' && g.ev('o.e') === 'abc' && g.ev("carimboCorrigirFuturo(o, 'f', 10)") === null, 'zero e valores que não são números ficam como estão');
    ok(g.ev("carimboCorrigirFuturo(o, 'x', 10)") === undefined && g.ev('carimboCorrigirFuturo(null, "a", 10)') === undefined, 'chave em falta ou objeto inválido: não rebenta');
    const mudou = function (h, s) { return g.ev('diaLisboaMudou(' + JSON.stringify(h) + ', ' + JSON.stringify(s) + ')'); };
    ok(mudou('2026-10-10', '2026-10-09') === true, 'dia seguinte repõe');
    ok(mudou('2026-10-09', '2026-10-09') === false, 'dia igual NÃO repõe (reposição por engano)');
    ok(mudou('2026-10-08', '2026-10-09') === false, 'dia anterior NÃO repõe (data atrás)');
    ok(mudou('2026-11-01', '2026-10-31') === true && mudou('2027-01-01', '2026-12-31') === true, 'mudança de mês e de ano repõe');
    ok(mudou('2026-10-09', null) === true && mudou('2026-10-09', undefined) === true && mudou('2026-10-09', '') === true && mudou('2026-10-09', 'lixo') === true && mudou('2026-10-09', 20261009) === true, 'dia guardado em falta ou inválido repõe (save antigo)');
    ok(mudou('', '2026-10-09') === false && mudou(null, null) === false, 'hoje inválido nunca repõe');
    ok(g.ev("diaLisboaEfetivo('2026-10-09', '2026-10-10')") === '2026-10-10' && g.ev("diaLisboaEfetivo('2026-10-09', '2026-10-08')") === '2026-10-09' && g.ev("diaLisboaEfetivo('2026-10-09', null)") === '2026-10-09' && g.ev("diaLisboaEfetivo('2026-10-09', 'lixo')") === '2026-10-09', 'dia efetivo: o guardado se for posterior, senão hoje');
    ok(g.ev("diaLisboaEfetivo('2026-10-09', '2026-10-11')") === '2026-10-11' && g.ev("diaLisboaEfetivo('2026-10-09', '2026-10-12')") === '2026-10-09' && g.ev("diaLisboaEfetivo('2026-10-31', '2026-11-02')") === '2026-11-02' && g.ev("diaLisboaEfetivo('2026-10-31', '2026-11-03')") === '2026-10-31', 'dia efetivo: até 2 dias à frente mantém-se (também entre meses), 3 dias à frente conta como hoje');
    ok(mudou('2026-10-09', '2026-10-11') === false && mudou('2026-10-09', '2026-10-12') === true, 'teto: guardado 2 dias à frente não repõe, 3 dias à frente repõe');
    ok(mudou('2026-12-30', '2027-01-01') === false && mudou('2026-12-30', '2027-01-02') === true && mudou('2028-02-28', '2028-03-01') === false && mudou('2028-02-27', '2028-03-01') === true, 'teto: contas de dias certas na virada de ano e em ano bissexto');
    ok(mudou('2026-10-09', '2026-13-45') === true && mudou('2026-10-09', '9/10/2026') === true && mudou('2026-10-09', '2026-1-9') === true && mudou('2026-10-09', {}) === true && mudou('2026-10-09', []) === true, 'valor antigo em formato estranho conta como dia diferente, sem rebentar');
    ok(g.ev("diasEntreDiasLisboa('2026-10-09', '2026-10-12')") === 3 && g.ev("diasEntreDiasLisboa('2026-10-12', '2026-10-09')") === -3 && g.ev("diasEntreDiasLisboa('x', '2026-10-09')") === null, 'diasEntreDiasLisboa: diferença em dias e null se inválido');
  }

  // ---------------- A. Vinha: cooldowns ----------------
  {
    const agora = d(9, '10:00');
    const g = jogador(agora);
    const cd = g.ev('COOLDOWN_MS.regar');
    ok(cd > 0, 'regar tem cooldown');
    g.ev('state.vinha.cooldowns.regar = ' + (agora - H));
    ok(g.ev("tempoRestanteVinha('regar')") === cd - H, 'cooldown normal (1 h passada) mantém-se: faltam ' + (cd - H) + ', deu ' + g.ev("tempoRestanteVinha('regar')"));
    g.ev('state.vinha.cooldowns.regar = ' + (agora + 30 * DIA));
    ok(g.ev("tempoRestanteVinha('regar')") === cd, 'carimbo 30 dias no futuro: espera o cooldown normal (' + cd + '), deu ' + g.ev("tempoRestanteVinha('regar')"));
    ok(g.ev('state.vinha.cooldowns.regar') === agora, 'o carimbo no futuro foi corrigido para agora (e só ele)');
    g.ev('state.vinha.cooldowns.colher = ' + (agora - 2 * H) + ';'); g.ev("tempoRestanteVinha('colher')");
    ok(g.ev('state.vinha.cooldowns.colher') === agora - 2 * H, 'um carimbo normal nunca é tocado');
    g.ir(agora + cd - MIN);
    ok(g.ev("tempoRestanteVinha('regar')") === MIN, 'a contar a partir de agora: 1 min antes do fim falta 1 min');
    g.ir(agora + cd);
    ok(g.ev("tempoRestanteVinha('regar')") === 0, 'passado o cooldown normal desbloqueia (não fica bloqueado)');
    g.ev('state.vinha.cooldowns.regar = 0');
    ok(g.ev("tempoRestanteVinha('regar')") === 0, 'sem carimbo: 0');
    g.ev("delete state.vinha.cooldowns.regar");
    ok(g.ev("tempoRestanteVinha('regar')") === 0, 'save antigo sem a chave: 0');
  }

  // ---------------- A. Adega: Prensar e Alambique ----------------
  ['prensar', 'alambique'].forEach(function (acao) {
    const agora = d(9, '10:00');
    const g = jogador(agora);
    const cd = g.ev("ADEGA_COOLDOWN_MS['" + acao + "']");
    g.ev("state.adega.cooldowns['" + acao + "'] = " + (agora - 30 * MIN));
    ok(g.ev("tempoRestanteAdega('" + acao + "')") === cd - 30 * MIN, acao + ': cooldown normal mantém-se');
    g.ev("state.adega.cooldowns['" + acao + "'] = " + (agora + 10 * DIA));
    ok(g.ev("tempoRestanteAdega('" + acao + "')") === cd, acao + ': carimbo no futuro espera só o cooldown normal, deu ' + g.ev("tempoRestanteAdega('" + acao + "')"));
    ok(g.ev("state.adega.cooldowns['" + acao + "']") === agora, acao + ': carimbo futuro corrigido para agora');
    g.ir(agora + cd);
    ok(g.ev("tempoRestanteAdega('" + acao + "')") === 0, acao + ': desbloqueia passado o cooldown normal');
  });

  // ---------------- A. Lote na Cave ----------------
  {
    const agora = d(9, '10:00');
    const g = jogador(agora);
    ok(g.ev('diasDescansadosNaCave()') === 0, 'sem lote: 0 dias');
    g.ev('state.adega.lote = { iniciadoEm: ' + (agora - 3 * DIA) + ' };');
    ok(g.ev('diasDescansadosNaCave()') === 3, 'lote normal: 3 dias');
    g.ev('state.adega.lote = { iniciadoEm: ' + (agora + 5 * DIA) + ' };');
    ok(g.ev('diasDescansadosNaCave()') === 0, 'lote com início no futuro: 0 dias (nunca negativos), deu ' + g.ev('diasDescansadosNaCave()'));
    ok(g.ev('state.adega.lote.iniciadoEm') === agora, 'o início do lote no futuro foi corrigido para agora');
    g.ir(agora + 2 * DIA);
    ok(g.ev('diasDescansadosNaCave()') === 2, 'o lote recomeça a contar a partir de agora: +2 dias → 2');
    ok(g.ev('Math.floor(diasDescansadosNaCave()) >= REGRAS_DESCANSO_CAVE.diasMinimos') === (2 >= g.ev('REGRAS_DESCANSO_CAVE.diasMinimos')), 'o mínimo de dias para engarrafar usa os dias lidos');
    // Voltar ao normal: o lote não fica bloqueado para sempre.
    g.ir(agora + g.ev('REGRAS_DESCANSO_CAVE.diasMinimos') * DIA);
    ok(g.ev('Math.floor(diasDescansadosNaCave()) >= REGRAS_DESCANSO_CAVE.diasMinimos'), 'passados os dias normais a partir de agora, o lote pode engarrafar');
    // Modo de teste ?dias=
    const t1 = abrir(agora, null, '?dias=9');
    t1.ev('state.adega.lote = { iniciadoEm: ' + (agora + 5 * DIA) + ' };');
    ok(t1.ev('diasDescansadosNaCave()') === 9, '?dias=9 continua a forçar os dias com lote');
    const t2 = abrir(agora, null, '?dias=9');
    ok(t2.ev('diasDescansadosNaCave()') === 0, '?dias= sem lote continua a dar 0');
  }

  // ---------------- A. Ronda do Chizo ----------------
  {
    const agora = d(9, '10:00');
    const g = jogador(agora);
    g.ev('garantirObjetivosDoDia();');
    const dur = g.ev('RONDA_CHIZO_CONFIG.duracaoMs');
    const espera = g.ev('RONDA_CHIZO_CONFIG.esperaEntreRondasMs');
    // Ronda normal que já acabou: volta.
    g.ev('state.objetivos.ronda = { feitas: 0, saidaEm: ' + (agora - dur - MIN) + ', fimEm: ' + (agora - MIN) + ', ultimoFimEm: null };');
    ok(g.ev('rondaChizoFase(Date.now())') === 'volta', 'ronda normal acabada: volta');
    g.ev('state.objetivos.ronda = { feitas: 0, saidaEm: ' + (agora - MIN) + ', fimEm: ' + (agora - MIN + dur) + ', ultimoFimEm: null };');
    ok(g.ev('rondaChizoFase(Date.now())') === 'fora', 'ronda normal a meio: fora');
    // Saída no futuro: conta como agora e dura o tempo normal.
    const sFut = agora + 1.5 * DIA;
    g.ev('state.objetivos.ronda = { feitas: 0, saidaEm: ' + sFut + ', fimEm: ' + (sFut + dur) + ', ultimoFimEm: null };');
    ok(g.ev('rondaChizoFase(Date.now())') === 'fora', 'ronda com saída no futuro: fora');
    g.ir(agora + dur - MIN);
    ok(g.ev('rondaChizoFase(Date.now())') === 'fora', 'ronda com saída no futuro: ainda fora 1 min antes do tempo normal');
    g.ir(agora + dur);
    ok(g.ev('rondaChizoFase(Date.now())') === 'volta', 'ronda com saída no futuro: volta passado o tempo normal (não fica bloqueada)');
    ok(g.ev('state.objetivos.ronda.saidaEm') === agora && g.ev('state.objetivos.ronda.fimEm') === agora + dur, 'ronda: saída futura corrigida para agora, mesma duração');
    // Espera entre rondas
    g.ir(agora);
    g.ev('state.objetivos.ronda = { feitas: 1, saidaEm: null, fimEm: null, ultimoFimEm: ' + (agora + 1.5 * DIA) + ' };');
    ok(g.ev('rondaChizoFase(Date.now())') === 'espera', 'fim da última ronda no futuro: espera');
    g.ir(agora + espera);
    ok(g.ev('rondaChizoFase(Date.now())') === 'pedido', 'fim da última ronda no futuro: passada a espera normal pede outra');
    g.ir(agora);
    g.ev('state.objetivos.ronda = { feitas: 1, saidaEm: null, fimEm: null, ultimoFimEm: ' + (agora - espera - MIN) + ' };');
    ok(g.ev('rondaChizoFase(Date.now())') === 'pedido', 'espera normal já cumprida: pedido');
  }

  // ---------------- B. Objetivos do dia e bónus ----------------
  {
    const hoje = d(9, '10:00');
    const g = jogador(hoje);
    ok(g.ev('state.objetivos.dia') === '2026-10-09' && g.ev('state.objetivos.lista.length') > 0, 'jogo novo: objetivos gerados para hoje');
    // Dia guardado = amanhã (relógio esteve adiantado), já com tudo cumprido e bónus dado.
    g.ev("state.objetivos.dia = '2026-10-10'; state.objetivos.lista = state.objetivos.lista.map(function (o) { return { id: o.id, cumprido: true }; }); state.objetivos.bonusDiaDado = true; state.objetivos.selosTotal = 4;");
    const antes = JSON.stringify(g.json('state.objetivos'));
    g.ev('garantirObjetivosDoDia();');
    ok(JSON.stringify(g.json('state.objetivos')) === antes, 'data atrás: os objetivos do dia guardado mantêm-se (nada se repõe)');
    const rep = g.ev('state.reputacao');
    g.ev("marcarObjetivoCumprido('vinha_compostagem'); marcarObjetivoCumprido('proteger_vencer');");
    ok(g.ev('state.reputacao') === rep && g.ev('state.objetivos.selosTotal') === 4, 'data atrás: o bónus não se repete (Reputação e selos iguais)');
    // Voltar a abrir várias vezes com a data atrás: continua igual
    for (let i = 0; i < 3; i++) g.ev('garantirObjetivosDoDia(); atualizarResumoQuinta();');
    ok(JSON.stringify(g.json('state.objetivos')) === antes, 'data atrás, várias aberturas: continua igual');
    // Dia igual: não repõe
    g.ir(d(10, '09:00'));
    g.ev('garantirObjetivosDoDia();');
    ok(JSON.stringify(g.json('state.objetivos')) === antes, 'dia igual ao guardado não repõe');
    // Dia seguinte: repõe
    g.ir(d(11, '00:30'));
    g.ev('garantirObjetivosDoDia();');
    ok(g.ev('state.objetivos.dia') === '2026-10-11' && g.ev('state.objetivos.bonusDiaDado') === false && g.json('state.objetivos.lista').every(function (o) { return o.cumprido === false; }), 'dia seguinte repõe (objetivos novos, bónus por dar)');
    ok(g.ev('state.objetivos.selosTotal') === 4, 'os selos já ganhos nunca descem');
    // Save antigo/estranho
    ['null', "''", "'lixo'", '123', 'undefined'].forEach(function (v) {
      const a = jogador(hoje);
      a.ev('state.objetivos.dia = ' + v + '; state.objetivos.bonusDiaDado = true;');
      a.ev('garantirObjetivosDoDia();');
      ok(a.ev('state.objetivos.dia') === '2026-10-09' && a.ev('state.objetivos.bonusDiaDado') === false, 'dia guardado ' + v + ' repõe para hoje');
    });
    // Um dia antes do guardado, num mês/ano diferente
    const b = jogador(d(9, '10:00'));
    b.ev("state.objetivos.dia = '2026-10-11'; state.objetivos.bonusDiaDado = true;");
    b.ev('garantirObjetivosDoDia();');
    ok(b.ev('state.objetivos.dia') === '2026-10-11' && b.ev('state.objetivos.bonusDiaDado') === true, 'teto: dia guardado 2 dias à frente mantém-se');
    b.ev("state.objetivos.dia = '2026-10-12';");
    b.ev('garantirObjetivosDoDia();');
    ok(b.ev('state.objetivos.dia') === '2026-10-09' && b.ev('state.objetivos.bonusDiaDado') === false, 'teto: dia guardado 3 dias à frente repõe para hoje');
    b.ev("state.objetivos.dia = '2027-01-02'; state.objetivos.bonusDiaDado = true;");
    b.ev('garantirObjetivosDoDia();');
    ok(b.ev('state.objetivos.dia') === '2026-10-09', 'teto: dia guardado noutro ano (muito à frente) repõe');
  }

  // ---------------- B. Proteger: 2 vitórias com prémio por dia ----------------
  {
    const g = jogador(d(9, '10:00'));
    g.ev("state.proteger.diaVitoriasLisboa = '2026-10-10'; state.proteger.vitoriasComPremioHoje = 2;");
    ok(g.ev('vitoriasProtegerComPremioRestantesHoje()') === 0, 'data atrás: limite do Proteger não é reposto (restam 0), deu ' + g.ev('vitoriasProtegerComPremioRestantesHoje()'));
    ok(g.ev('state.proteger.diaVitoriasLisboa') === '2026-10-10' && g.ev('state.proteger.vitoriasComPremioHoje') === 2, 'data atrás: estado do Proteger inalterado');
    g.ir(d(10, '11:00'));
    ok(g.ev('vitoriasProtegerComPremioRestantesHoje()') === 0 && g.ev('state.proteger.vitoriasComPremioHoje') === 2, 'dia igual: limite mantém-se (reposição por engano)');
    g.ir(d(11, '00:10'));
    ok(g.ev('vitoriasProtegerComPremioRestantesHoje()') === 2 && g.ev("state.proteger.diaVitoriasLisboa") === '2026-10-11', 'dia seguinte: repõe as 2 vitórias');
    const n = jogador(d(9, '10:00'));
    ok(n.ev('vitoriasProtegerComPremioRestantesHoje()') === 2 && n.ev('state.proteger.diaVitoriasLisboa') === '2026-10-09', 'jogo novo (dia null): 2 vitórias disponíveis e dia gravado');
    const a = jogador(d(9, '10:00'));
    a.ev("delete state.proteger.diaVitoriasLisboa; delete state.proteger.vitoriasComPremioHoje;");
    ok(a.ev('vitoriasProtegerComPremioRestantesHoje()') === 2, 'save antigo sem os campos: 2 vitórias disponíveis');
  }

  // ---------------- B. Visitas do dia ----------------
  {
    const g = jogador(d(9, '10:00'));
    g.ev('state.reputacao = 372;');
    const r0 = g.json('visitaDeHoje()');
    ok(!!r0.visita, 'nível 5: há (ou não) visita hoje — cenário precisa de visita; dia 2026-10-09');
    if (r0.visita) {
      const id = r0.visita.id;
      // Já feita num dia guardado posterior
      g.ev("state.visitas.hoje = { dia: '2026-10-10', id: " + JSON.stringify(id) + ", feita: true }; state.visitas.feitas[" + JSON.stringify(id) + "] = '2026-10-10';");
      const antes = JSON.stringify(g.json('state.visitas'));
      const rep = g.ev('state.reputacao');
      const r = g.json('visitaDeHoje()');
      ok(r.visita && r.visita.id === id && r.feita === true, 'data atrás: a visita do dia guardado mantém-se e continua feita');
      ok(g.json('visitaFazerHoje()').ok === false && g.ev('state.reputacao') === rep, 'data atrás: a visita já feita não volta a pagar');
      ok(JSON.stringify(g.json('state.visitas')) === antes, 'data atrás: state.visitas inalterado');
      // Dia igual
      g.ir(d(10, '09:00'));
      ok(g.json('visitaFazerHoje()').ok === false && JSON.stringify(g.json('state.visitas')) === antes, 'dia igual: continua feita e inalterada');
      // Dia seguinte: visita nova possível, e feita volta a false
      g.ir(d(11, '09:00'));
      g.json('visitaDeHoje()');
      const h = g.json('state.visitas.hoje');
      ok(h === null || (h.dia === '2026-10-11' && h.feita === false), 'dia seguinte: a visita do dia repõe-se (dia novo, por fazer)');
      // Visita por fazer guardada para dia posterior: não é trocada nem paga duas vezes
      const g2 = jogador(d(9, '10:00'));
      g2.ev("state.visitas.hoje = { dia: '2026-10-10', id: " + JSON.stringify(id) + ", feita: false };");
      const rr = g2.json('visitaDeHoje()');
      ok(rr.visita && rr.visita.id === id && g2.ev('state.visitas.hoje.dia') === '2026-10-10', 'data atrás: visita por fazer do dia guardado mantém-se');
      const pago = g2.json('visitaFazerHoje()');
      ok(pago.ok === true && g2.ev('state.visitas.hoje.dia') === '2026-10-10' && g2.ev('state.visitas.hoje.feita') === true, 'data atrás: fazer a visita regista no dia guardado (não recua o dia)');
      ok(g2.json('visitaFazerHoje()').ok === false, 'data atrás: segunda vez não paga');
    }
    // Save antigo sem state.visitas continua a funcionar
    const v = jogador(d(9, '10:00'));
    v.ev('delete state.visitas;');
    ok(!!v.ev('typeof visitaDeHoje()'), 'save sem state.visitas não rebenta');
  }

  // ---------------- Fluxo completo: adianta o relógio, joga, volta ao normal ----------------
  {
    const real = d(9, '10:00');
    const g = jogador(real);
    g.ir(real + 20 * DIA); // relógio adiantado 20 dias
    g.ev("garantirObjetivosDoDia(); registarCooldownVinha('regar'); registarCooldownAdega('prensar'); state.adega.lote = { iniciadoEm: Date.now() };");
    g.ev("marcarObjetivoCumprido('vinha_compostagem');");
    g.ev('garantirDiaProtegerAtualizado(); state.proteger.vitoriasComPremioHoje = 2;');
    g.ev('visitaDeHoje();');
    g.ir(real); // volta ao normal
    g.ev('garantirObjetivosDoDia();');
    ok(g.ev("tempoRestanteVinha('regar')") <= g.ev('COOLDOWN_MS.regar'), 'depois de voltar: o cooldown da Vinha não passa do normal');
    ok(g.ev("tempoRestanteAdega('prensar')") <= g.ev("ADEGA_COOLDOWN_MS.prensar"), 'depois de voltar: o cooldown do Prensar não passa do normal');
    ok(g.ev('diasDescansadosNaCave()') === 0, 'depois de voltar: o lote conta 0 dias e não negativos');
    g.ir(real + g.ev('COOLDOWN_MS.regar') + g.ev("ADEGA_COOLDOWN_MS.prensar"));
    ok(g.ev("tempoRestanteVinha('regar')") === 0 && g.ev("tempoRestanteAdega('prensar')") === 0, 'esperando o normal, tudo desbloqueia');
    ok(g.ev('state.objetivos.dia') === '2026-10-09', 'depois de voltar de 20 dias à frente: os objetivos repõem-se (teto de 2 dias)');
    ok(g.ev('state.proteger.diaVitoriasLisboa') === '2026-10-09' && g.ev('state.proteger.vitoriasComPremioHoje') === 0, 'depois de voltar de 20 dias à frente: o limite do Proteger repõe-se');
  }

  // ---------------- C. Dia, mês e ano de Lisboa (o aparelho está em Auckland, UTC+13) ----------------
  {
    const A = Date.parse('2026-11-07T20:00:00Z');   // Lisboa 7 nov 20:00; aparelho 8 nov 09:00
    const B = Date.parse('2026-11-14T20:00:00Z');   // Lisboa 14 nov; aparelho 15 nov
    const g = jogador(A);
    ok(g.ev('new Date().getDate()') === 8 && g.ev('diaLisboaDeHoje()') === '2026-11-07', 'ambiente: aparelho um dia à frente de Lisboa');
    ok(g.ev('festaAtivaPelaDataReal()') === null && g.ev('festaAtual()') === null, 'festa: dia 7 em Lisboa (8 no aparelho) NÃO está aberta');
    g.ir(B);
    ok(g.ev('festaAtual() && festaAtual().id') === 'saomartinho', 'festa: dia 14 em Lisboa (15 no aparelho) ainda está aberta');
    g.ir(Date.parse('2026-11-11T20:00:00Z'));
    ok(g.ev('estaNoDiaGrandeFesta(festaAtual())') === true, 'dia grande: 11 em Lisboa');
    g.ir(Date.parse('2026-11-10T20:00:00Z'));
    ok(g.ev('estaNoDiaGrandeFesta(festaAtual())') === false, 'dia grande: 10 em Lisboa (11 no aparelho) não é o dia grande');
    // Estação pelo mês de Lisboa
    g.ir(Date.parse('2026-11-30T20:00:00Z')); // Lisboa 30 nov, aparelho 1 dez
    ok(g.ev('estacaoAtual()') === 'outono' && g.ev('mesAtual()') === 10, 'estação: 30 nov em Lisboa é outono (novembro), deu ' + g.ev('estacaoAtual()'));
    g.ir(Date.parse('2026-11-30T23:30:00Z')); ok(g.ev('mesAtual()') === 10, 'estação: Lisboa ainda é novembro às 23:30');
    g.ir(Date.parse('2026-12-01T00:30:00Z')); ok(g.ev('mesAtual()') === 11 && g.ev('estacaoAtual()') === 'inverno', 'estação: 1 dez em Lisboa é inverno');
    ok(g.ev('idInvernoAtual()') === '2026-2027', 'ano do inverno: dezembro de 2026 é 2026-2027');
    g.ir(Date.parse('2026-11-30T20:00:00Z'));
    ok(g.ev('idInvernoAtual()') === '2025-2026', 'ano do inverno vem do mês de Lisboa (novembro), não do aparelho (dezembro)');
    g.ir(Date.parse('2026-12-31T20:00:00Z')); // Lisboa 31 dez 2026, aparelho 1 jan 2027
    ok(g.ev('idInvernoAtual()') === '2026-2027', 'ano do inverno: 31 dez em Lisboa usa o ano de Lisboa (2026), deu ' + g.ev('idInvernoAtual()'));
    // ?estacao= continua a forçar
    const e = abrir(A, null, '?estacao=verao');
    ok(e.ev('estacaoAtual()') === 'verao' && e.ev('mesAtual()') === 5, '?estacao=verao continua a forçar o mês');
    const f = abrir(A, null, '?festa=saomartinho&dia=11');
    ok(f.ev('festaAtual().id') === 'saomartinho' && f.ev('estaNoDiaGrandeFesta(festaAtual())') === true, '?festa=&dia= continua a forçar a festa e o dia grande');
    // Tarefa da festa: uma vez por dia de Lisboa
    const h = jogador(Date.parse('2026-11-08T10:00:00Z')); // Lisboa 8 nov 10:00; aparelho 8 nov 23:00
    ok(h.ev("festaJaFezTarefaHoje('saomartinho', 'castanhas')") === false, 'tarefa da festa: ainda não feita');
    h.ev("festaRegistarTarefaHoje('saomartinho', 'castanhas')");
    h.ir(Date.parse('2026-11-08T12:00:00Z'));          // Lisboa ainda 8 nov; o aparelho já passou para 9
    ok(h.ev('new Date().getDate()') === 9, 'ambiente: o aparelho já está no dia 9');
    ok(h.ev("festaJaFezTarefaHoje('saomartinho', 'castanhas')") === true, 'tarefa da festa NÃO repete na mesma data de Lisboa (mesmo com o aparelho noutro dia)');
    h.ir(Date.parse('2026-11-09T00:30:00Z'));
    ok(h.ev("festaJaFezTarefaHoje('saomartinho', 'castanhas')") === false, 'tarefa da festa volta no dia seguinte de Lisboa');
    // Tarefas do tempo (chuva, Estacas, Proteger do Frio) e arco-íris
    h.ir(Date.parse('2026-11-08T10:00:00Z'));
    h.ev("registarTarefaTempoHoje('chuvaRegouDia')");
    h.ir(Date.parse('2026-11-08T12:00:00Z'));
    ok(h.ev("jaFezTarefaTempoHoje('chuvaRegouDia')") === true, 'tarefa do tempo não repete na mesma data de Lisboa');
    h.ev("tempoAtual = function () { return { disponivel: true, ceu: 'sol' }; }; arcoIrisCondicoes = function () { return true; }; definirFundo = function () {};");
    const g0 = h.ev('state.gotas');
    h.ir(Date.parse('2026-11-08T10:00:00Z')); h.ev('arcoIrisAvaliar()');
    h.ir(Date.parse('2026-11-08T12:00:00Z')); const volta = h.ev('arcoIrisAvaliar()');
    ok(volta === false && h.ev('state.gotas') === g0 + h.ev('TEMPO_CONFIG.arcoIris.gotas'), 'arco-íris: pago uma só vez na mesma data de Lisboa (aparelho já noutro dia)');
    ok(h.ev('state.tempo.arcoirisDia') === '2026-11-08', 'arco-íris: guarda o dia de Lisboa');
    h.ir(Date.parse('2026-11-09T00:30:00Z')); h.ev('arcoIrisAvaliar()');
    ok(h.ev('state.gotas') === g0 + 2 * h.ev('TEMPO_CONFIG.arcoIris.gotas'), 'arco-íris: volta no dia seguinte de Lisboa');
    // Valores antigos / estranhos: lêem-se sem erro e contam como dia diferente
    ['null', "''", "'8/11/2026'", "'lixo'", '20261108', '{}', '[]', 'true'].forEach(function (v) {
      const k = jogador(Date.parse('2026-11-08T10:00:00Z'));
      k.ev('state.tempo.arcoirisDia = ' + v + '; state.tempo.chuvaRegouDia = ' + v + "; state.festas.tarefasDia['saomartinho_castanhas'] = " + v + ';');
      let fez, tarefa, festa;
      try { fez = k.ev("jaFezTarefaTempoHoje('chuvaRegouDia')"); festa = k.ev("festaJaFezTarefaHoje('saomartinho', 'castanhas')"); k.ev("tempoAtual = function () { return { disponivel: true, ceu: 'sol' }; }; arcoIrisCondicoes = function () { return true; }; definirFundo = function () {}; arcoIrisAvaliar()"); tarefa = k.ev('state.tempo.arcoirisDia'); } catch (err) { fez = 'ERRO ' + err.message; }
      ok(fez === false && festa === false && tarefa === '2026-11-08', 'valor antigo ' + v + ' conta como dia diferente, sem rebentar (deu ' + fez + '/' + festa + '/' + tarefa + ')');
    });
    // Ninguém usa já o dia do aparelho
    ok(!/diaLocalDeHoje/.test(Object.keys(fontes).map(function (k) { return fontes[k]; }).join('\n')), 'diaLocalDeHoje já não existe nem é usada');
  }

  // ---------------- Ligações: tempo.js carrega antes de quem usa as regras ----------------
  {
    const pos = function (f) { return INDEX.indexOf('<script src="js/' + f + '.js'); };
    ['vinha', 'garrafa', 'ronda', 'objetivos', 'proteger', 'visitas'].forEach(function (f) {
      ok(pos('tempo') !== -1 && pos(f) !== -1 && pos('tempo') < pos(f), 'index.html: tempo.js antes de ' + f + '.js');
    });
  }

  return falhas;
}

// 1. Ficheiros reais.
let falhas = suite(FONTES);

// 2. Mutações: cada uma estraga uma regra e o teste tem de a apanhar.
function mutar(ficheiro, de, para) {
  if (FONTES[ficheiro].indexOf(de) === -1) { falhas.push('mutação impossível (texto não encontrado em ' + ficheiro + '): ' + de); return null; }
  const f = Object.assign({}, FONTES);
  f[ficheiro] = FONTES[ficheiro].split(de).join(para);
  return f;
}
const MUTACOES = [
  ['cooldown da Vinha: carimbo no futuro a bloquear', 'vinha.js', 'carimboCorrigirFuturo(state.vinha.cooldowns, actionKey, agora)', 'state.vinha.cooldowns[actionKey]'],
  ['cooldown do Prensar/Alambique: carimbo no futuro a bloquear', 'garrafa.js', 'carimboCorrigirFuturo(state.adega.cooldowns, acao, agora)', 'state.adega.cooldowns[acao]'],
  ['lote: carimbo no futuro (dias negativos)', 'garrafa.js', "Math.max(0, agora - carimboCorrigirFuturo(state.adega.lote, 'iniciadoEm', agora))", '(agora - state.adega.lote.iniciadoEm)'],
  ['Ronda: saída no futuro a bloquear', 'ronda.js', 'if (r.saidaEm > agora && Number.isFinite(r.fimEm)) {', 'if (false) {'],
  ['Ronda: espera com fim no futuro a bloquear', 'ronda.js', "carimboCorrigirFuturo(r, 'ultimoFimEm', agora)", '(r.ultimoFimEm)'],
  ['regra pura: carimbo futuro não corrigido', 'tempo.js', 'obj[chave] = agora;', ''],
  ['regra pura: carimbo normal também mexido', 'tempo.js', '!(n > agora)', 'false'],
  ['bónus repetido ao voltar a data atrás (objetivos repõem com !==)', 'objetivos.js', 'if (diaLisboaMudou(diaLisboaDeHoje(), state.objetivos.dia)) {', 'if (state.objetivos.dia !== diaLisboaDeHoje()) {'],
  ['limite do Proteger reposto ao voltar a data atrás', 'proteger.js', 'if (diaLisboaMudou(hoje, state.proteger.diaVitoriasLisboa)) {', 'if (state.proteger.diaVitoriasLisboa !== hoje) {'],
  ['dia igual a repor por engano (dif < 0 passa a <= 0)', 'tempo.js', 'return dif < 0 || dif > DIAS_FUTURO_MAXIMO;', 'return dif <= 0 || dif > DIAS_FUTURO_MAXIMO;'],
  ['teto de 2 dias retirado (repor)', 'tempo.js', 'return dif < 0 || dif > DIAS_FUTURO_MAXIMO;', 'return dif < 0;'],
  ['teto de 2 dias errado (3 dias não repõe)', 'tempo.js', 'var DIAS_FUTURO_MAXIMO = 2;', 'var DIAS_FUTURO_MAXIMO = 3;'],
  ['teto retirado no dia efetivo', 'tempo.js', 'dif > 0 && dif <= DIAS_FUTURO_MAXIMO ? guardado : hoje', 'dif > 0 ? guardado : hoje'],
  ['dia guardado inválido deixa de repor', 'tempo.js', 'if (dif === null) return true;', 'if (dif === null) return false;'],
  ['dia entre datas sem virada de mês', 'tempo.js', 'Date.UTC(pb.ano, pb.mes, pb.dia) - Date.UTC(pa.ano, pa.mes, pa.dia)', 'pb.dia - pa.dia'],
  ['visita do dia reposta ao voltar a data atrás', 'visitas.js', 'const hoje = visitaDiaEfetivo();', 'const hoje = diaLisboaDeHoje();'],
  ['visita paga no dia de hoje em vez do guardado', 'visitas.js', 'const dia = visitaDiaEfetivo();', 'const dia = diaLisboaDeHoje();'],
  ['dia efetivo ignora o guardado posterior', 'tempo.js', 'dif > 0 && dif <= DIAS_FUTURO_MAXIMO ? guardado : hoje', 'hoje'],
  ['festa pelo dia do aparelho', 'festas.js', 'if (p) return { mes: p.mes, dia: p.dia };', ''],
  ['estação pelo mês do aparelho', 'estacoes.js', 'return p ? p.mes : new Date().getMonth();', 'return new Date().getMonth();'],
  ['ano do inverno pelo aparelho', 'vinha.js', 'const ano = p ? p.ano : new Date().getFullYear();', 'const ano = new Date().getFullYear();'],
  ['tarefa da festa pelo dia do aparelho', 'festas.js', "state.festas.tarefasDia[chaveTarefaFesta(festaId, tarefa)] === diaLisboaDeHoje()", "state.festas.tarefasDia[chaveTarefaFesta(festaId, tarefa)] === (function () { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })()"],
  ['tarefa do tempo pelo dia do aparelho', 'vinha.js', 'return state.tempo[campo] === diaLisboaDeHoje();', "return state.tempo[campo] === (function () { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })();"],
  ['arco-íris pelo dia do aparelho', 'tempo.js', 'state.tempo.arcoirisDia === diaLisboaDeHoje()', "state.tempo.arcoirisDia === (function () { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })()"]
];
MUTACOES.forEach(function (m) {
  const f = mutar(m[1], m[2], m[3]);
  if (!f) return;
  let apanhada;
  try { apanhada = suite(f).length > 0; } catch (e) { apanhada = true; }
  if (!apanhada) falhas.push('MUTAÇÃO NÃO APANHADA: ' + m[0]);
});

if (falhas.length) {
  falhas.forEach(function (m) { console.log('FALHA: ' + m); });
  console.log(falhas.length + ' falha(s)');
  process.exit(1);
}
console.log('OK (' + MUTACOES.length + ' mutações apanhadas)');
