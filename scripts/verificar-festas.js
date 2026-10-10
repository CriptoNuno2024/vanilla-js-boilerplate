#!/usr/bin/env node
// Motor das Festas: tarefas por festa na configuração, São Martinho igual ao que era e Natal.
// Corre js/state.js, tempo.js, festas.js e niveis.js REAIS num ambiente simulado (vm), com relógio
// controlado e o aparelho noutro fuso (o dia vem sempre de Lisboa).
//
// A. São Martinho: mesmos ids, datas e valores de antes (castanhas, jeropiga, prova), mesmo comportamento.
// B. Natal: 20 a 26/12, dia grande 25/12, nível 4, 3 tarefas (consoada, doces, bolo-rei), valores, imagens ≤ 250 KB.
// C. Regras puras (festaResolverTarefa): sem custo em Uvas, perder não custa nada, 1 vez por dia, relógio atrás.
// D. Cena do bolo-rei: fixa por dia (sem sorteio), igual em qualquer aparelho.
// E. Textos em PT, EN e ES completos e sem números; objetivos.js lê a configuração; Enciclopédia só no São Martinho.
//
// Depois de passar, aplica "mutações" (estraga cada regra de propósito) e confirma que o teste as apanha.
// Uso: node scripts/verificar-festas.js     Sai com 0 se estiver tudo OK e 1 se alguma verificação falhar.
process.env.TZ = 'Pacific/Auckland';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const FICHEIROS = ['state.js', 'tempo.js', 'festas.js', 'niveis.js', 'objetivos.js'];
const FONTES = {};
FICHEIROS.forEach(function (f) { FONTES[f] = fs.readFileSync(path.join(RAIZ, 'js', f), 'utf8'); });
const CREDITOS = fs.readFileSync(path.join(RAIZ, 'CREDITOS.md'), 'utf8');
const LIMITE_IMAGEM = 250 * 1024;

// Lisboa em dezembro e novembro = UTC+0: a meia-noite de Lisboa é a meia-noite UTC.
function lis(mes, dia, hhmm) { return Date.parse('2026-' + String(mes).padStart(2, '0') + '-' + String(dia).padStart(2, '0') + 'T' + (hhmm || '12:00') + ':00Z'); }

function suite(fontes) {
  const falhas = [];
  function ok(cond, msg) { if (!cond) falhas.push(msg); }

  function abrir(inicioMs, pesquisa) {
    const relogio = { t: inicioMs };
    const guardado = {};
    class Relogio extends Date {
      constructor(...a) { if (a.length === 0) super(relogio.t); else super(...a); }
      static now() { return relogio.t; }
    }
    const caixa = { innerHTML: '' };
    const sb = {
      console: { log() {}, warn() {}, error() {} },
      localStorage: {
        getItem: function (k) { return Object.prototype.hasOwnProperty.call(guardado, k) ? guardado[k] : null; },
        setItem: function (k, v) { guardado[k] = String(v); },
        removeItem: function (k) { delete guardado[k]; }
      },
      location: { search: pesquisa || '' }, URLSearchParams: URLSearchParams, Intl: Intl,
      document: { querySelectorAll: function () { return []; }, getElementById: function () { return caixa; }, querySelector: function () { return null; }, addEventListener: function () {} },
      setTimeout: function () { return 1; }, clearTimeout: function () {}, Image: function () {}, Date: Relogio, caixa: caixa
    };
    sb.window = sb;
    sb.addEventListener = function () {};
    sb.Telegram = { WebApp: {} };
    const cx = vm.createContext(sb);
    vm.runInContext(`
      var SAVES = 0, FUNDO = null, DIALOGO = null, CAIXA_LOG = [], ENTRADAS = [], OBJETIVOS = [], currentLang = 'pt';
      function t(k) { return k; }
      function randInt(a) { return a; }
      function localeAtual() { return 'pt-PT'; }
      function definirFundo(m, src) { FUNDO = src; }
      function atualizarDialogo(msg) { DIALOGO = msg; }
      function updateStatsDisplays() {} function vibrar() {} function tocarSom() {}
      function mostrarNovaEntrada() {} function construirFilaPastilhas(id, html) { return html; }
      function marcarPastilhaPrincipal() {} function configurarFilaPastilhas() {} function goTo() {}
      function desbloquearEntradaEnciclopedia(id) { ENTRADAS.push(id); return null; }
      function marcarObjetivoCumprido(id) { OBJETIVOS.push(id); }
      function estacaoAtual() { return 'inverno'; }
      function tempoAtual() { return { disponivel: false }; }
      function alambiqueTemParaJeropiga() { return false; } function alambiqueGastarParaJeropiga() {}
    `, cx);
    ['state.js', 'tempo.js', 'festas.js', 'niveis.js'].forEach(function (f) { vm.runInContext(fontes[f], cx, { filename: f }); });
    vm.runInContext('randInt = function (a) { return a; };', cx); // o state.js define o sorteio a sério: aqui fica sempre o mínimo
    vm.runInContext('var _saveReal = saveState; saveState = function (s) { SAVES++; return _saveReal(s); };', cx);
    const g = { cx: cx, relogio: relogio };
    g.ev = function (c) { return vm.runInContext(c, cx); };
    g.json = function (c) { return JSON.parse(vm.runInContext('JSON.stringify(' + c + ')', cx)); };
    g.ir = function (ms) { relogio.t = ms; };
    return g;
  }

  // ---------------- A. São Martinho: igual ao que era ----------------
  {
    const g = abrir(lis(11, 10));
    const sm = g.json("FESTAS_CONFIG.filter(function (f) { return f.id === 'saomartinho'; })[0]");
    ok(sm && sm.inicio.mes === 10 && sm.inicio.dia === 8 && sm.fim.mes === 10 && sm.fim.dia === 14 && sm.diaGrande.mes === 10 && sm.diaGrande.dia === 11, 'São Martinho: 8 a 14 de novembro, dia grande 11');
    ok(sm.recompensas.multiplicadorDiaGrande === 2, 'São Martinho: dia grande a dobrar');
    ok(sm.entradaEnciclopedia === 'lendaSaoMartinho', 'São Martinho: abre a entrada lendaSaoMartinho ao entrar');
    ok(JSON.stringify(sm.tarefas.map(function (x) { return x.id; })) === '["castanhas","jeropiga","prova"]', 'São Martinho: as mesmas 3 tarefas, pela mesma ordem');
    ok(sm.tarefas.every(function (x) { return x.onde === 'festa'; }), 'São Martinho: as 3 tarefas são do ecrã da festa');
    const p = function (id) { return sm.tarefas.filter(function (x) { return x.id === id; })[0].premio; };
    ok(JSON.stringify(p('castanhas')) === JSON.stringify({ uvasMin: 6, uvasMax: 12, gotasMin: 6, gotasMax: 12, repMin: 3, repMax: 6, bonusVerao: 1.5 }), 'São Martinho: castanhas 6-12 Uvas, 6-12 Gotas, 3-6 Reputação, verão x1,5');
    ok(JSON.stringify(p('jeropiga')) === JSON.stringify({ custoGotas: 50, custoAguardente: 1, reputacao: 25 }), 'São Martinho: jeropiga 50 Gotas, 1 Aguardente, +25 Reputação');
    ok(JSON.stringify(p('prova')) === JSON.stringify({ reputacao: 8 }), 'São Martinho: prova +8 Reputação');
    ok(sm.tarefas.map(function (x) { return x.regra; }).join() === 'cena_sorteada,jeropiga,prova', 'São Martinho: regras castanhas/jeropiga/prova');
    ['diaGrande', 'faixa', 'castanhasRoubo', 'castanhasVitoria', 'castanhasFuga', 'jeropiga', 'prova', 'verao'].forEach(function (k) {
      ok(sm.imagens[k] && fs.existsSync(path.join(RAIZ, sm.imagens[k])), 'São Martinho: imagem ' + k + ' existe');
    });

    // Fluxo no ecrã: castanhas (cena 0, certa = 0 com o randInt de teste), a dobrar no dia grande
    const s = abrir(lis(11, 11), '?festa=saomartinho&dia=11');
    s.ev("state.reputacao = 372; state.uvas = 100; state.gotas = 100; state.festas.tarefasDia = {};");
    s.ev("iniciarTarefaFesta('castanhas')");
    s.ev('responderCastanha(FESTAS_STRINGS.saomartinho.pt.castanhasCenas[castanhasCenaIndex].correta)');
    ok(s.ev('state.uvas') === 112 && s.ev('state.gotas') === 112 && s.ev('state.reputacao') === 378, 'São Martinho: castanhas certas no dia grande dão 6+6+3 a dobrar, deu ' + s.ev('state.uvas') + '/' + s.ev('state.gotas') + '/' + s.ev('state.reputacao'));
    ok(s.ev("festaJaFezTarefaHoje('saomartinho', 'castanhas')") === true && s.ev('SAVES') === 1, 'São Martinho: castanhas feitas hoje, uma gravação');
    s.ev("iniciarTarefaFesta('castanhas')");
    ok(s.ev('state.reputacao') === 378 && s.ev('SAVES') === 1, 'São Martinho: castanhas não repetem no mesmo dia');
    // prova: precisa de lote; sem lote não paga nem marca
    s.ev("iniciarTarefaFesta('prova')");
    ok(s.ev('state.reputacao') === 378 && s.ev("festaJaFezTarefaHoje('saomartinho', 'prova')") === false && s.ev('festaMensagemAtual') === s.ev('FESTAS_STRINGS.saomartinho.pt.provaSemVinho'), 'São Martinho: prova sem lote não paga nem marca');
    s.ev('state.adega.lote = { iniciadoEm: 1 };');
    s.ev("iniciarTarefaFesta('prova')");
    ok(s.ev('state.reputacao') === 394 && s.ev("festaJaFezTarefaHoje('saomartinho', 'prova')") === true, 'São Martinho: prova com lote dá +8 a dobrar (16) no dia grande, deu ' + s.ev('state.reputacao'));
    ok(s.json('OBJETIVOS').join() === 'festa_tarefa,festa_tarefa', 'São Martinho: cada tarefa feita conta para o objetivo do dia');
    ok(s.json('ENTRADAS').join() === 'magusto', 'só as castanhas abrem o magusto (a lenda só abre ao entrar na festa)');
    s.ev('enterFesta()');
    ok(s.json('ENTRADAS').join() === 'magusto,lendaSaoMartinho', 'São Martinho: enterFesta abre a lendaSaoMartinho');
    // O botão de cada tarefa vem da configuração
    s.ev('renderFestaHub()');
    const html = s.ev('caixa.innerHTML');
    ok(/iniciarTarefaFesta\('castanhas'\)/.test(html) && /iniciarTarefaFesta\('jeropiga'\)/.test(html) && /iniciarTarefaFesta\('prova'\)/.test(html), 'São Martinho: o hub mostra os 3 botões');
    ok(FESTAS_TEXTO_BTN_SM(s), 'São Martinho: os botões têm os mesmos textos de sempre');
  }
  function FESTAS_TEXTO_BTN_SM(s) {
    const S = s.json('FESTAS_STRINGS.saomartinho.pt');
    return S.btnCastanhas === 'Assar Castanhas' && S.btnJeropiga === 'Fazer Jeropiga' && S.btnProva === 'Provar o Vinho Novo';
  }

  // ---------------- B. Natal: configuração ----------------
  {
    const g = abrir(lis(12, 21));
    const n = g.json("FESTAS_CONFIG.filter(function (f) { return f.id === 'natal'; })[0]");
    ok(!!n, 'Natal: existe em FESTAS_CONFIG');
    if (n) {
      ok(n.inicio.mes === 11 && n.inicio.dia === 20 && n.fim.mes === 11 && n.fim.dia === 26 && n.diaGrande.mes === 11 && n.diaGrande.dia === 25, 'Natal: 20 a 26 de dezembro, dia grande 25');
      ok(n.recompensas.multiplicadorDiaGrande === 2, 'Natal: dia grande a dobrar, como o São Martinho');
      ok(n.entradaEnciclopedia === undefined, 'Natal: não abre nenhuma entrada da Enciclopédia');
      ok(JSON.stringify(n.tarefas.map(function (x) { return x.id; })) === '["consoada","doces","boloRei"]' && n.tarefas.every(function (x) { return x.onde === 'festa'; }), 'Natal: consoada, doces e bolo-rei, todas no ecrã da festa');
      ok(n.tarefas.map(function (x) { return x.regra; }).join() === 'oferta,gastar_gotas,cena_do_dia', 'Natal: regras oferta, gastar_gotas, cena_do_dia');
      ok(JSON.stringify(n.tarefas[0].premio) === '{"reputacao":5}', 'Natal: consoada +5 Reputação, sem custo nem bem');
      ok(JSON.stringify(n.tarefas[1].premio) === '{"custoGotas":30,"reputacao":12}', 'Natal: doces gastam 30 Gotas e dão +12 Reputação');
      ok(JSON.stringify(n.tarefas[2].premio) === '{"reputacao":6}', 'Natal: bolo-rei +6 Reputação');
      ok(JSON.stringify(n.tarefas).indexOf('uvas') === -1 && JSON.stringify(n.tarefas).indexOf('Uvas') === -1, 'Natal: nenhuma tarefa tem custo nem prémio em Uvas');
      ok(n.imagens.faixa === 'assets/ecras/natal_festa.jpg' && n.imagens.diaGrande === 'assets/ecras/natal_dia25.jpg', 'Natal: imagem da festa e imagem do dia grande');
      Object.keys(n.imagens).forEach(function (k) {
        const f = path.join(RAIZ, n.imagens[k]);
        ok(fs.existsSync(f), 'Natal: a imagem ' + k + ' existe (' + n.imagens[k] + ')');
        if (fs.existsSync(f)) ok(fs.statSync(f).size <= LIMITE_IMAGEM, 'Natal: ' + n.imagens[k] + ' não devia pesar mais de 250 KB (pesa ' + fs.statSync(f).size + ')');
      });
      ['natal_festa.jpg', 'natal_dia25.jpg'].forEach(function (f) { ok(CREDITOS.indexOf('assets/ecras/' + f) !== -1, 'CREDITOS.md devia listar ' + f); });
      const a = fs.readFileSync(path.join(RAIZ, 'assets', 'ecras', 'natal_dia25.jpg')), b = fs.readFileSync(path.join(RAIZ, 'imagens_JOGO_TELEGRAM', 'natal_patio_de_vindima.jpg'));
      ok(a.equals(b), 'natal_dia25.jpg é cópia exata de natal_patio_de_vindima.jpg');
      const c = fs.readFileSync(path.join(RAIZ, 'assets', 'ecras', 'natal_festa.jpg')), d = fs.readFileSync(path.join(RAIZ, 'imagens_JOGO_TELEGRAM', 'natal_patio_vindimas_2.jpg'));
      ok(c.equals(d), 'natal_festa.jpg é cópia exata de natal_patio_vindimas_2.jpg');
    }
    ok(g.ev('NIVEL_NECESSARIO_POR_ECRA.festa') === 4, 'nível mínimo das festas continua a ser 4');
  }

  // ---------------- janelas: sem sobreposição, pelo dia de Lisboa ----------------
  {
    const g = abrir(lis(12, 19));
    const quem = function () { return g.ev('(festaAtivaPelaDataReal() || {}).id || null'); };
    ok(quem() === null, '19/12: nenhuma festa');
    g.ir(lis(12, 20, '00:30')); ok(quem() === 'natal', '20/12 (Lisboa): Natal abre');
    g.ir(lis(12, 25)); ok(quem() === 'natal' && g.ev('estaNoDiaGrandeFesta(festaAtual())') === true, '25/12: Natal e dia grande');
    g.ir(lis(12, 24)); ok(g.ev('estaNoDiaGrandeFesta(festaAtual())') === false, '24/12: ainda não é o dia grande');
    g.ir(lis(12, 26, '23:30')); ok(quem() === 'natal', '26/12 às 23:30 de Lisboa: Natal ainda aberto');
    g.ir(lis(12, 27, '00:30')); ok(quem() === null, '27/12 (Lisboa): Natal fechou');
    g.ir(lis(12, 19, '23:30')); ok(g.ev('new Date().getDate()') === 20 && quem() === null, 'o aparelho já está a 20/12 mas em Lisboa ainda é 19: Natal fechado');
    g.ir(lis(11, 8)); ok(quem() === 'saomartinho', '8/11: São Martinho');
    let sobrepostas = 0;
    for (let m = 1; m <= 12; m++) for (let dia = 1; dia <= 28; dia++) {
      const v = g.ev('FESTAS_CONFIG.filter(function (f) { var h = ' + (m - 1) + ' * 100 + ' + dia + '; return h >= valorDataFesta(f.inicio) && h <= valorDataFesta(f.fim); }).length');
      if (v > 1) sobrepostas++;
    }
    ok(sobrepostas === 0, 'nenhum dia tem duas festas abertas');
    const e = abrir(lis(10, 10), '?festa=natal');
    ok(e.ev('festaAtual().id') === 'natal' && e.ev('estaNoDiaGrandeFesta(festaAtual())') === false, '?festa=natal força o Natal (sem dia grande)');
    const f = abrir(lis(10, 10), '?festa=natal&dia=25');
    ok(f.ev('festaAtual().id') === 'natal' && f.ev('estaNoDiaGrandeFesta(festaAtual())') === true, '?festa=natal&dia=25 força o dia grande');
    const h = abrir(lis(10, 10), '?festa=saomartinho&dia=11');
    ok(h.ev('festaAtual().id') === 'saomartinho' && h.ev('estaNoDiaGrandeFesta(festaAtual())') === true, '?festa=saomartinho&dia=11 continua a forçar o dia grande');
  }

  // ---------------- C. Regras puras ----------------
  {
    const g = abrir(lis(12, 22));
    g.ev("var NATAL = FESTAS_CONFIG.filter(function (f) { return f.id === 'natal'; })[0]; var T = function (id) { return festaTarefa(NATAL, id); };");
    g.ev('function res(e, id, hoje, op) { return festaResolverTarefa(e, NATAL, T(id), hoje, op); }');
    const r = function (estadoJs, id, hoje, op) { return g.ev('(function () { var e = ' + estadoJs + '; var x = res(e, "' + id + '", ' + JSON.stringify(hoje) + ', ' + JSON.stringify(op || {}) + '); return JSON.stringify({ x: x, e: e }); })()'); };
    const E = '{ gotas: 100, uvas: 7, reputacao: 372, festas: { tarefasDia: {} } }';
    const R = function (estadoJs, id, hoje, op) { return JSON.parse(r(estadoJs, id, hoje, op)); };

    let o = R(E, 'consoada', '2026-12-22');
    ok(o.x.ok && o.x.rep === 5 && o.e.reputacao === 377 && o.e.gotas === 100 && o.e.uvas === 7 && o.e.festas.tarefasDia.natal_consoada === '2026-12-22', 'consoada: +5, sem custo (Gotas e Uvas iguais), marca o dia');
    o = R(E, 'consoada', '2026-12-25', { diaGrande: true });
    ok(o.x.rep === 10 && o.e.reputacao === 382, 'consoada no dia grande: a dobrar (+10)');
    const FEITA = '{ gotas: 100, uvas: 7, reputacao: 372, festas: { tarefasDia: { natal_consoada: "2026-12-22", natal_doces: "2026-12-22", natal_boloRei: "2026-12-22" } } }';
    ['consoada', 'doces', 'boloRei'].forEach(function (id) {
      o = R(FEITA, id, '2026-12-22', { venceu: true });
      ok(!o.x.ok && o.x.motivo === 'ja_hoje' && o.e.reputacao === 372 && o.e.gotas === 100, id + ': 1 vez por dia (segunda vez recusa e não muda nada)');
      o = R(FEITA, id, '2026-12-23', { venceu: true });
      ok(o.x.ok, id + ': volta no dia seguinte');
    });
    // data do aparelho atrás
    ['2026-12-21', '2026-12-20'].forEach(function (d) { o = R(FEITA, 'consoada', d); ok(o.x.motivo === 'ja_hoje', 'data atrás (' + d + ', até 2 dias): a tarefa não se repete'); });
    o = R(FEITA, 'consoada', '2026-12-19'); ok(o.x.ok, 'data atrás 3 dias (acima do teto): repõe');

    // doces: Gotas, nunca Uvas
    o = R(E, 'doces', '2026-12-22');
    ok(o.x.ok && o.x.gotasGastas === 30 && o.e.gotas === 70 && o.e.uvas === 7 && o.e.reputacao === 384 && o.e.festas.tarefasDia.natal_doces === '2026-12-22', 'doces: gastam 30 Gotas, 0 Uvas, dão +12');
    o = R('{ gotas: 100, uvas: 0, reputacao: 372, festas: { tarefasDia: {} } }', 'doces', '2026-12-22');
    ok(o.x.ok && o.e.uvas === 0, 'doces: funcionam com 0 Uvas');
    o = R(E, 'doces', '2026-12-25', { diaGrande: true });
    ok(o.e.gotas === 70 && o.e.reputacao === 396, 'doces no dia grande: o prémio dobra (+24) mas o custo não (30)');
    o = R('{ gotas: 30, uvas: 7, reputacao: 372, festas: { tarefasDia: {} } }', 'doces', '2026-12-22');
    ok(o.x.ok && o.e.gotas === 0, 'doces: com exatamente 30 Gotas faz-se');
    o = R('{ gotas: 29, uvas: 7, reputacao: 372, festas: { tarefasDia: {} } }', 'doces', '2026-12-22');
    ok(!o.x.ok && o.x.motivo === 'faltam_gotas' && o.e.gotas === 29 && o.e.reputacao === 372 && !o.e.festas.tarefasDia.natal_doces, 'doces: com 29 Gotas não gasta, não paga e não marca o dia');
    o = R('{ uvas: 7, reputacao: 372, festas: { tarefasDia: {} } }', 'doces', '2026-12-22');
    ok(!o.x.ok && o.x.motivo === 'faltam_gotas' && o.e.reputacao === 372, 'doces: sem campo de Gotas conta como 0');

    // bolo-rei: acertar paga, falhar não custa nada mas gasta a tentativa do dia
    o = R(E, 'boloRei', '2026-12-22', { venceu: true });
    ok(o.x.ok && o.x.venceu && o.x.rep === 6 && o.e.reputacao === 378 && o.e.gotas === 100 && o.e.uvas === 7, 'bolo-rei certo: +6, sem custo');
    o = R(E, 'boloRei', '2026-12-25', { venceu: true, diaGrande: true });
    ok(o.e.reputacao === 384, 'bolo-rei certo no dia grande: +12');
    o = R(E, 'boloRei', '2026-12-22', { venceu: false });
    ok(o.x.ok && !o.x.venceu && o.x.rep === 0 && o.e.reputacao === 372 && o.e.gotas === 100 && o.e.uvas === 7 && o.e.festas.tarefasDia.natal_boloRei === '2026-12-22', 'bolo-rei errado: não custa nada (Reputação, Gotas e Uvas iguais) e marca a tentativa do dia');
    o = R(E, 'boloRei', '2026-12-22', { venceu: false, diaGrande: true });
    ok(o.e.reputacao === 372, 'bolo-rei errado no dia grande: continua sem custar nada');
    ['x', 1, null, undefined].forEach(function (v) {
      o = R(E, 'boloRei', '2026-12-22', { venceu: v });
      ok(!o.x.ok && o.x.motivo === 'resultado_invalido' && o.e.reputacao === 372 && !o.e.festas.tarefasDia.natal_boloRei, 'bolo-rei: resultado ' + JSON.stringify(v) + ' recusa sem mexer em nada');
    });

    // entradas inválidas
    ok(g.ev("festaResolverTarefa(null, NATAL, T('consoada'), '2026-12-22', {}).motivo") === 'estado_invalido', 'estado inválido recusa');
    ['', null, 'lixo', '2026-13-45'].forEach(function (d) {
      ok(g.ev('festaResolverTarefa(' + E + ', NATAL, T("consoada"), ' + JSON.stringify(d) + ', {}).motivo') === 'dia_invalido', 'dia ' + JSON.stringify(d) + ' recusa');
    });
    ok(g.ev("festaResolverTarefa(" + E + ", NATAL, { id: 'x', regra: 'castanhas', premio: {} }, '2026-12-22', {}).motivo") === 'tarefa_invalida', 'uma regra do ecrã (não pura) recusa');
    ok(g.ev("festaResolverTarefa(" + E + ", NATAL, null, '2026-12-22', {}).motivo") === 'tarefa_invalida', 'tarefa em falta recusa');
    // estado reparado em memória (nuvem ou save estranho)
    o = R('{ gotas: 100, reputacao: 372, festas: null }', 'consoada', '2026-12-22');
    ok(o.x.ok && o.e.festas.tarefasDia.natal_consoada === '2026-12-22', 'state.festas a null repara-se em memória');
    o = R('{ gotas: "abc", reputacao: "x", festas: { tarefasDia: [] } }', 'consoada', '2026-12-22');
    ok(o.x.ok && o.e.reputacao === 5, 'Reputação inválida conta como 0, sem rebentar');

    // objetivo do dia lê a configuração
    g.ev("state.festas.tarefasDia = {};");
    ok(g.ev('festaTemTarefaPorFazerHoje(NATAL)') === true, 'objetivo do dia: com nada feito há tarefa por fazer');
    g.ev("festaRegistarFez(state, 'natal', 'consoada', diaLisboaDeHoje()); festaRegistarFez(state, 'natal', 'doces', diaLisboaDeHoje());");
    ok(g.ev('festaTemTarefaPorFazerHoje(NATAL)') === true, 'objetivo do dia: com 2 de 3 feitas ainda há uma por fazer');
    g.ev("festaRegistarFez(state, 'natal', 'boloRei', diaLisboaDeHoje());");
    ok(g.ev('festaTemTarefaPorFazerHoje(NATAL)') === false, 'objetivo do dia: com as 3 do Natal feitas já não há');
    ok(g.ev("festaTemTarefaPorFazerHoje(FESTAS_CONFIG[0])") === true, 'objetivo do dia: as do Natal não contam para o São Martinho');
    ok(g.ev('festaTemTarefaPorFazerHoje(null)') === false, 'objetivo do dia: sem festa não há tarefas');
    const objetivosJs = fontes['objetivos.js'];
    ok(/festaTemTarefaPorFazerHoje\(festa\)/.test(objetivosJs) && !/'castanhas'|'jeropiga'|'prova'/.test(objetivosJs.slice(objetivosJs.indexOf('function candidatosGrupoC'), objetivosJs.indexOf('function candidatosGrupoC') + 1200)), 'objetivos.js lê as tarefas da configuração, sem nomes escritos à mão');

    // Fluxo no ecrã (Natal): um toque, uma gravação, uma vez por dia
    const n = abrir(lis(12, 22), '?festa=natal');
    n.ev('state.reputacao = 372; state.gotas = 100; state.uvas = 7;');
    n.ev("iniciarTarefaFesta('doces')");
    ok(n.ev('state.gotas') === 70 && n.ev('state.uvas') === 7 && n.ev('state.reputacao') === 384 && n.ev('SAVES') === 1 && n.ev('FUNDO') === 'assets/ecras/natal_festa.jpg', 'ecrã: doces gastam 30 Gotas, dão +12, uma gravação, imagem da festa');
    n.ev("iniciarTarefaFesta('doces')");
    ok(n.ev('state.gotas') === 70 && n.ev('state.reputacao') === 384 && n.ev('SAVES') === 1 && n.ev('festaMensagemAtual') === n.ev('FESTAS_STRINGS.natal.pt.docesJaFeitaHoje'), 'ecrã: doces uma só vez por dia, com a mensagem de já feita');
    n.ev("iniciarTarefaFesta('consoada')");
    ok(n.ev('state.reputacao') === 389 && n.ev('SAVES') === 2, 'ecrã: consoada +5');
    n.ev('state.gotas = 10;'); n.ev('state.festas.tarefasDia.natal_doces = null;');
    n.ev("iniciarTarefaFesta('doces')");
    ok(n.ev('state.gotas') === 10 && n.ev('state.reputacao') === 389 && n.ev('SAVES') === 2 && n.ev('festaMensagemAtual') === n.ev('FESTAS_STRINGS.natal.pt.docesFalta'), 'ecrã: doces com 10 Gotas avisam sem gastar nem gravar');
    // bolo-rei
    n.ev("iniciarTarefaFesta('boloRei')");
    const cena = n.json('festaCenaAtual.cena');
    ok(cena && cena.opcoes.length === 3, 'ecrã: o bolo-rei mostra uma cena de 3 opções');
    const errada = (cena.correta + 1) % 3;
    n.ev('festaResponderCenaDoDia(' + errada + ')');
    ok(n.ev('state.reputacao') === 389 && n.ev('state.gotas') === 10 && n.ev('SAVES') === 3 && n.ev("festaJaFezTarefaHoje('natal', 'boloRei')") === true, 'ecrã: bolo-rei errado não custa nada e gasta a tentativa do dia');
    n.ev('festaResponderCenaDoDia(' + cena.correta + ')');
    ok(n.ev('state.reputacao') === 389 && n.ev('SAVES') === 3, 'ecrã: toque duplo na mesma cena não paga nem grava outra vez');
    n.ev("iniciarTarefaFesta('boloRei')");
    ok(n.ev('festaCenaAtual') === null, 'ecrã: bolo-rei já tentado hoje não abre outra cena');
    n.ir(lis(12, 23));
    n.ev("iniciarTarefaFesta('boloRei')");
    const cena2 = n.json('festaCenaAtual.cena');
    n.ev('festaResponderCenaDoDia(' + cena2.correta + ')');
    ok(n.ev('state.reputacao') === 395 && n.ev('SAVES') === 4, 'ecrã: no dia seguinte volta, e acertar dá +6');
    ok(n.json('OBJETIVOS').length === 4 && n.json('ENTRADAS').length === 0, 'ecrã: cada tarefa conta para o objetivo do dia e o Natal não abre nada na Enciclopédia');
    n.ev('enterFesta()');
    ok(n.json('ENTRADAS').length === 0, 'enterFesta no Natal não abre a lenda de São Martinho');
    n.ev('renderFestaHub()');
    const html = n.ev('caixa.innerHTML');
    ok(/iniciarTarefaFesta\('consoada'\)/.test(html) && /iniciarTarefaFesta\('doces'\)/.test(html) && /iniciarTarefaFesta\('boloRei'\)/.test(html) && !/castanhas|jeropiga|prova/.test(html), 'hub do Natal: os 3 botões do Natal e nenhum do São Martinho');
    ok(n.ev('FUNDO') === 'assets/ecras/natal_festa.jpg', 'hub do Natal: imagem da festa fora do dia grande');
    const gd = abrir(lis(12, 25), '?festa=natal&dia=25');
    gd.ev('state.reputacao = 372; state.gotas = 100;');
    gd.ev('renderFestaHub()');
    ok(gd.ev('FUNDO') === 'assets/ecras/natal_dia25.jpg' && gd.ev('caixa.innerHTML').indexOf(gd.ev('FESTAS_STRINGS.natal.pt.diaGrandeAviso')) !== -1, 'hub do Natal no dia grande: imagem do dia 25 e aviso');
    gd.ev("iniciarTarefaFesta('doces')");
    ok(gd.ev('state.reputacao') === 396 && gd.ev('state.gotas') === 70, 'ecrã: no dia grande os doces dão +24 e custam 30');
    // sol num dia de Natal não faz aparecer o aviso do "verão de São Martinho"
    gd.ev("tempoAtual = function () { return { disponivel: true, ceu: 'sol' }; }; renderFestaHub();");
    ok(gd.ev('caixa.innerHTML').indexOf('undefined') === -1, 'hub do Natal com sol: nada de "undefined" (o verão é só do São Martinho)');
  }

  // ---------------- D. Cena do bolo-rei: fixa por dia ----------------
  {
    const g = abrir(lis(12, 22));
    const c = function (dia, n) { return g.ev("festaCenaDoDia('natal', 'boloRei', " + JSON.stringify(dia) + ', ' + JSON.stringify(n === undefined ? 3 : n) + ')'); };
    const dias = ['2026-12-20', '2026-12-21', '2026-12-22', '2026-12-23', '2026-12-24', '2026-12-25', '2026-12-26'];
    dias.forEach(function (d) { ok(c(d) === c(d) && c(d) >= 0 && c(d) <= 2, d + ': a cena é a mesma o dia todo e vem de 0 a 2'); });
    ok(new Set(dias.map(function (d) { return c(d); })).size >= 2, 'nos 7 dias do Natal não sai sempre a mesma cena');
    ok(c('2026-12-22', 0) === 0 && c('2026-12-22', -1) === 0 && c('2026-12-22', 1.5) === 0 && c(null) === 0, 'n inválido ou dia inválido: cena 0, sem rebentar');
    const a = abrir(lis(12, 22, '08:00')), b = abrir(lis(12, 22, '22:00'));
    ok(a.ev("festaCenaDoDia('natal', 'boloRei', diaLisboaDeHoje(), 3)") === b.ev("festaCenaDoDia('natal', 'boloRei', diaLisboaDeHoje(), 3)"), 'a cena não depende da hora, só do dia de Lisboa');
    ok(g.ev("festaCenaDoDia('natal', 'boloRei', '2026-12-22', 3)") !== undefined && g.ev("festaCenaDoDia('natal', 'outra', '2026-12-22', 1000)") !== g.ev("festaCenaDoDia('natal', 'boloRei', '2026-12-22', 1000)"), 'a semente inclui a tarefa');
    const fonte = fontes['festas.js'];
    const regras = fonte.slice(fonte.indexOf('// TAREFAS "UMA VEZ POR DIA"'), fonte.indexOf('// TEXTOS (PT / EN / ES)'));
    ok(!/Math\.random|Date\.now|new Date|randInt/.test(regras), 'as regras puras (relógio e Natal) não lêem o relógio nem sorteiam');
  }

  // ---------------- E. Textos ----------------
  {
    const g = abrir(lis(12, 22));
    const TXT = g.json('FESTAS_STRINGS');
    const chavesEscalares = ['faixa', 'titulo', 'subtitulo', 'diaGrandeAviso', 'tarefaFeitaHoje', 'btnConsoada', 'btnDoces', 'btnBoloRei', 'btnVoltar',
      'consoadaTitulo', 'consoadaJaFeitaHoje', 'consoadaSucesso', 'docesTitulo', 'docesJaFeitaHoje', 'docesFalta', 'docesSucesso',
      'boloReiTitulo', 'boloReiSubtitulo', 'boloReiJaFeitaHoje', 'boloReiVitoria', 'boloReiDerrota'];
    ['pt', 'en', 'es'].forEach(function (l) {
      const S = TXT.natal[l];
      ok(!!S, 'Natal: faltam textos em ' + l);
      if (!S) return;
      chavesEscalares.forEach(function (k) { ok(typeof S[k] === 'string' && S[k].trim() !== '', 'Natal ' + l + ': falta o texto ' + k); });
      ok(Array.isArray(S.boloReiCenas) && S.boloReiCenas.length === 3, 'Natal ' + l + ': 3 cenas do bolo-rei');
      (S.boloReiCenas || []).forEach(function (c, i) {
        ok(typeof c.situacao === 'string' && c.situacao !== '' && c.opcoes.length === 3 && c.opcoes.every(function (o) { return typeof o === 'string' && o !== ''; }) && c.correta === TXT.natal.pt.boloReiCenas[i].correta && c.correta >= 0 && c.correta <= 2, 'Natal ' + l + ': cena ' + (i + 1) + ' completa e com a mesma opção certa em PT/EN/ES');
        ok(new Set(c.opcoes).size === 3, 'Natal ' + l + ': cena ' + (i + 1) + ' tem 3 opções diferentes');
      });
      ok(JSON.stringify(S).indexOf('undefined') === -1 && !/[0-9]/.test(JSON.stringify(S).replace(/"correta":\d/g, '').replace(/Fygmo2/g, 'Fygmo')), 'Natal ' + l + ': textos sem números nem datas');
    });
    ok(new Set(TXT.natal.pt.boloReiCenas.map(function (c) { return c.correta; })).size === 3, 'bolo-rei: a opção certa não é sempre a mesma posição (1, 0 e 2)');
    ok(/consoada/i.test(JSON.stringify(TXT.natal.pt)) && /bolo-rei/i.test(JSON.stringify(TXT.natal.pt)) && /rabanadas/i.test(JSON.stringify(TXT.natal.pt)) && /filhós/i.test(JSON.stringify(TXT.natal.pt)), 'PT: fala da consoada, do bolo-rei, das rabanadas e das filhós');
    ok(!/\b(você|vocês|fixe|bué)\b/i.test(JSON.stringify(TXT.natal.pt)), 'PT de Portugal: sem "você" nem brasileirismos óbvios');
    // todos os botões da configuração têm texto nas 3 línguas
    const cfg = g.json('FESTAS_CONFIG');
    cfg.forEach(function (f) {
      f.tarefas.forEach(function (tf) {
        ['pt', 'en', 'es'].forEach(function (l) { ok(typeof TXT[f.id][l][tf.btn] === 'string' && TXT[f.id][l][tf.btn] !== '', f.id + ' ' + l + ': falta o texto do botão ' + tf.btn); });
      });
    });
    // São Martinho: os textos não mudaram (amostra)
    ok(TXT.saomartinho.pt.btnCastanhas === 'Assar Castanhas' && TXT.saomartinho.en.btnProva === 'Taste the New Wine' && TXT.saomartinho.es.btnJeropiga === 'Hacer Jeropiga' && TXT.saomartinho.pt.faixa === 'É São Martinho na Quinta!', 'São Martinho: textos iguais aos de antes');
    // sem entradas novas na Enciclopédia neste PR
    const explorar = fs.readFileSync(path.join(RAIZ, 'js', 'explorar.js'), 'utf8');
    ok(!/id: 'natal|id: 'consoada|id: 'boloRei/i.test(explorar), 'a Enciclopédia não ganhou entradas de Natal');
    // Natal não mexe em js/nuvem.js nem no state.js (a forma de state.festas é a de antes)
    ok(g.json('Object.keys(defaultState().festas)').join() === 'tarefasDia', 'state.festas continua a ter só tarefasDia');
  }

  return falhas;
}

const falhas = suite(FONTES);

function mutar(ficheiro, de, para) {
  if (FONTES[ficheiro].indexOf(de) === -1) { falhas.push('mutação impossível (texto não encontrado em ' + ficheiro + '): ' + de); return null; }
  const f = Object.assign({}, FONTES);
  f[ficheiro] = FONTES[ficheiro].split(de).join(para);
  return f;
}
const MUTACOES = [
  ['doces passam a custar 40 Gotas', 'festas.js', 'premio: { custoGotas: 30, reputacao: 12 }', 'premio: { custoGotas: 40, reputacao: 12 }'],
  ['doces gastam também Uvas', 'festas.js', 'gotasGastas = p.custoGotas;', 'gotasGastas = p.custoGotas; estado.uvas -= 5;'],
  ['doces gastam sem ter Gotas', 'festas.js', 'if (gotas < p.custoGotas) return recusa(\'faltam_gotas\');', ''],
  ['doces marcam o dia mesmo sem Gotas', 'festas.js', 'if (gotas < p.custoGotas) return recusa(\'faltam_gotas\');', 'if (gotas < p.custoGotas) { festaRegistarFez(estado, festa.id, tarefa.id, hoje); return recusa(\'faltam_gotas\'); }'],
  ['bolo-rei errado custa Reputação', 'festas.js', 'const rep = venceu ? p.reputacao * mult : 0;', 'const rep = venceu ? p.reputacao * mult : -p.reputacao;'],
  ['bolo-rei errado não gasta a tentativa', 'festas.js', 'festaRegistarFez(estado, festa.id, tarefa.id, hoje);\n  return { ok: true', 'if (venceu) festaRegistarFez(estado, festa.id, tarefa.id, hoje);\n  return { ok: true'],
  ['dia grande não dobra', 'festas.js', "const mult = op.diaGrande === true ? festa.recompensas.multiplicadorDiaGrande : 1;", 'const mult = 1;'],
  ['dia grande dobra também o custo dos doces', 'festas.js', 'gotasGastas = p.custoGotas;', 'gotasGastas = p.custoGotas * mult;'],
  ['tarefa repete no mesmo dia', 'festas.js', "if (festaJaFez(estado, festa.id, tarefa.id, hoje)) return recusa('ja_hoje');", ''],
  ['cena do bolo-rei sorteada', 'festas.js', 'return h % n;', 'return Math.floor(Math.random() * n);'],
  ['cena do bolo-rei sempre a primeira', 'festas.js', 'return h % n;', 'return 0;'],
  ['cena sem a semente da tarefa', 'festas.js', "const semente = dia + '#' + festaId + '#' + tarefaId;", "const semente = dia + '#' + festaId;"],
  ['resultado inválido aceite', 'festas.js', "if (op.venceu !== true && op.venceu !== false) return recusa('resultado_invalido');", ''],
  ['regra não pura aceite', 'festas.js', "FESTAS_REGRAS_PURAS.indexOf(tarefa.regra) === -1", 'false'],
  ['Natal abre a lenda de São Martinho', 'festas.js', 'if (festa.entradaEnciclopedia) {', 'if (true) {'],
  ['aviso do verão de São Martinho no Natal', 'festas.js', "if (ehVerao && S.veraoAviso)", 'if (ehVerao)'],
  ['objetivo do dia: basta uma tarefa feita para sair', 'festas.js', 'return festaTarefas(festa).some(function (x) { return !festaJaFezTarefaHoje(festa.id, x.id); });', 'return festaTarefas(festa).every(function (x) { return !festaJaFezTarefaHoje(festa.id, x.id); });'],
  ['objetivos.js volta aos nomes escritos à mão', 'objetivos.js', 'festaTemTarefaPorFazerHoje(festa)', "(!festaJaFezTarefaHoje(festa.id, 'castanhas') || !festaJaFezTarefaHoje(festa.id, 'jeropiga') || !festaJaFezTarefaHoje(festa.id, 'prova'))"],
  ['dia grande do Natal a 24', 'festas.js', 'diaGrande: { mes: 11, dia: 25 }', 'diaGrande: { mes: 11, dia: 24 }'],
  ['Natal fecha a 25', 'festas.js', 'fim: { mes: 11, dia: 26 }', 'fim: { mes: 11, dia: 25 }'],
  ['Natal abre a 21', 'festas.js', 'inicio: { mes: 11, dia: 20 }', 'inicio: { mes: 11, dia: 21 }'],
  ['imagem do dia 25 trocada', 'festas.js', "diaGrande: 'assets/ecras/natal_dia25.jpg'", "diaGrande: 'assets/ecras/natal_festa.jpg'"],
  ['consoada passa a custar Gotas', 'festas.js', "regra: 'oferta', btn: 'btnConsoada'", "regra: 'gastar_gotas', btn: 'btnConsoada'"],
  ['castanhas sem o bónus do verão na configuração', 'festas.js', 'repMax: 6, bonusVerao: 1.5', 'repMax: 6, bonusVerao: 1'],
  ['castanhas lêem o prémio do sítio errado', 'festas.js', "const r = festaTarefa(festa, 'castanhas').premio;", "const r = festaTarefa(festa, 'prova').premio;"],
  ['prova paga outro valor', 'festas.js', "premio: { reputacao: 8 } }", "premio: { reputacao: 9 } }"],
  ['jeropiga paga outro valor', 'festas.js', 'reputacao: 25 } }', 'reputacao: 26 } }'],
  ['botão da tarefa sem o texto da configuração', 'festas.js', 'S[tarefa.btn]', 'S.btnProva']
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
