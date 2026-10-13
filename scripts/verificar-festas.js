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
// G. Carnaval: data móvel (sábado a terça), mesmas regras e valores do Natal, textos, imagens, 2026 a 2035.
// I. Cenas de 3 opções (São Martinho, Natal, Carnaval e Páscoa): a certa nunca é a mais comprida, as 3 opções diferem no máximo 20% em PT, EN e ES e a posição da certa varia.
// H. Páscoa: data móvel (Sexta-feira Santa a Domingo de Páscoa), mesmas regras e valores do Carnaval, textos, cenas, imagens, 2026 a 2035.
// F. Datas móveis: Páscoa (2 métodos independentes), somar dias, janela móvel (Carnaval de teste), e as festas
//    de datas fixas iguais a antes em todos os dias de 13 anos.
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
      var SAVES = 0, FUNDO = null, DIALOGO = null, CAIXA_LOG = [], ENTRADAS = [], AVISOS = [], OBJETIVOS = [], currentLang = 'pt';
      function t(k) { return k; }
      function randInt(a) { return a; }
      function localeAtual() { return 'pt-PT'; }
      function definirFundo(m, src) { FUNDO = src; }
      function atualizarDialogo(msg) { DIALOGO = msg; }
      function updateStatsDisplays() {} function vibrar() {} function tocarSom() {}
      function mostrarNovaEntrada(e) { if (e) AVISOS.push(e.id); } function construirFilaPastilhas(id, html) { return html; }
      function marcarPastilhaPrincipal() {} function configurarFilaPastilhas() {} function goTo() {}
      function desbloquearEntradaEnciclopedia(id) { ENTRADAS.push(id); return { id: id }; }
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
      ok(n.entradaEnciclopedia === 'consoada', 'Natal: abre a entrada consoada ao entrar na festa');
      ok(n.tarefas.map(function (x) { return x.entradaEnciclopedia; }).join() === ',,boloRei', 'Natal: só a tarefa do bolo-rei abre uma entrada (boloRei); consoada e doces não');
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
      const d = '2026-' + String(m).padStart(2, '0') + '-' + String(dia).padStart(2, '0');
      if (g.ev('FESTAS_CONFIG.filter(function (f) { return festaAbertaNoDia(f, ' + JSON.stringify(d) + '); }).length') > 1) sobrepostas++;
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
    ok(n.json('ENTRADAS').join() === 'boloRei' && n.json('AVISOS').join() === 'boloRei', 'ecrã: responder à cena do bolo-rei (mesmo errando) abre a entrada boloRei e mostra o aviso de entrada nova: ' + n.json('ENTRADAS').join() + ' / ' + n.json('AVISOS').join());
    n.ev('festaResponderCenaDoDia(' + cena.correta + ')');
    ok(n.ev('state.reputacao') === 389 && n.ev('SAVES') === 3, 'ecrã: toque duplo na mesma cena não paga nem grava outra vez');
    ok(n.json('ENTRADAS').join() === 'boloRei' && n.json('AVISOS').join() === 'boloRei', 'ecrã: toque duplo na mesma cena não abre a entrada outra vez');
    n.ev("iniciarTarefaFesta('boloRei')");
    ok(n.ev('festaCenaAtual') === null, 'ecrã: bolo-rei já tentado hoje não abre outra cena');
    n.ir(lis(12, 23));
    n.ev("iniciarTarefaFesta('boloRei')");
    const cena2 = n.json('festaCenaAtual.cena');
    n.ev('festaResponderCenaDoDia(' + cena2.correta + ')');
    ok(n.ev('state.reputacao') === 395 && n.ev('SAVES') === 4, 'ecrã: no dia seguinte volta, e acertar dá +6');
    ok(n.json('OBJETIVOS').length === 4 && n.json('ENTRADAS').every(function (x) { return x === 'boloRei'; }), 'ecrã: cada tarefa conta para o objetivo do dia e a consoada e os doces não abrem entradas');
    n.ev('enterFesta()');
    ok(n.json('ENTRADAS').indexOf('consoada') !== -1 && n.json('ENTRADAS').indexOf('lendaSaoMartinho') === -1 && n.json('ENTRADAS').slice(-1)[0] === 'consoada', 'enterFesta no Natal abre a consoada (e não a lenda de São Martinho)');
    ok(n.json('AVISOS').slice(-1)[0] === 'consoada', 'enterFesta no Natal mostra o aviso de entrada nova da consoada');
    {
      // acertar à primeira também abre o bolo-rei (ganhe ou perca); a consoada e os doces não abrem nada
      const v = abrir(lis(12, 22), '?festa=natal');
      v.ev("iniciarTarefaFesta('consoada')"); v.ev("iniciarTarefaFesta('doces')");
      ok(v.json('ENTRADAS').length === 0, 'Natal: fazer a consoada e os doces não abre entradas');
      v.ev("iniciarTarefaFesta('boloRei')");
      ok(v.json('ENTRADAS').length === 0, 'Natal: abrir a cena do bolo-rei ainda não abre a entrada');
      v.ev('festaResponderCenaDoDia(' + v.json('festaCenaAtual.cena.correta') + ')');
      ok(v.json('ENTRADAS').join() === 'boloRei' && v.json('AVISOS').join() === 'boloRei', 'Natal: acertar na cena do bolo-rei abre a entrada boloRei com o aviso');
      v.ev("iniciarTarefaFesta('boloRei')"); // já feito hoje: não abre cena nem entrada
      ok(v.json('ENTRADAS').join() === 'boloRei', 'Natal: bolo-rei já feito hoje não abre a entrada outra vez');
    }
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


  // ---------------- C2. Regras puras do Carnaval (as mesmas do Natal) ----------------
  {
    const g = abrir(lis(2, 14));
    g.ev("var CARNAVAL = FESTAS_CONFIG.filter(function (f) { return f.id === 'carnaval'; })[0]; var T = function (id) { return festaTarefa(CARNAVAL, id); };");
    g.ev('function res(e, id, hoje, op) { return festaResolverTarefa(e, CARNAVAL, T(id), hoje, op); }');
    const r = function (estadoJs, id, hoje, op) { return g.ev('(function () { var e = ' + estadoJs + '; var x = res(e, "' + id + '", ' + JSON.stringify(hoje) + ', ' + JSON.stringify(op || {}) + '); return JSON.stringify({ x: x, e: e }); })()'); };
    const E = '{ gotas: 100, uvas: 7, reputacao: 372, festas: { tarefasDia: {} } }';
    const R = function (estadoJs, id, hoje, op) { return JSON.parse(r(estadoJs, id, hoje, op)); };

    let o = R(E, 'corso', '2026-12-22');
    ok(o.x.ok && o.x.rep === 5 && o.e.reputacao === 377 && o.e.gotas === 100 && o.e.uvas === 7 && o.e.festas.tarefasDia.carnaval_corso === '2026-12-22', 'corso: +5, sem custo (Gotas e Uvas iguais), marca o dia');
    o = R(E, 'corso', '2026-12-25', { diaGrande: true });
    ok(o.x.rep === 10 && o.e.reputacao === 382, 'corso no dia grande: a dobrar (+10)');
    const FEITA = '{ gotas: 100, uvas: 7, reputacao: 372, festas: { tarefasDia: { carnaval_corso: "2026-12-22", carnaval_fantasias: "2026-12-22", carnaval_quemEstaMascarado: "2026-12-22" } } }';
    ['corso', 'fantasias', 'quemEstaMascarado'].forEach(function (id) {
      o = R(FEITA, id, '2026-12-22', { venceu: true });
      ok(!o.x.ok && o.x.motivo === 'ja_hoje' && o.e.reputacao === 372 && o.e.gotas === 100, id + ': 1 vez por dia (segunda vez recusa e não muda nada)');
      o = R(FEITA, id, '2026-12-23', { venceu: true });
      ok(o.x.ok, id + ': volta no dia seguinte');
    });
    // data do aparelho atrás
    ['2026-12-21', '2026-12-20'].forEach(function (d) { o = R(FEITA, 'corso', d); ok(o.x.motivo === 'ja_hoje', 'data atrás (' + d + ', até 2 dias): a tarefa não se repete'); });
    o = R(FEITA, 'corso', '2026-12-19'); ok(o.x.ok, 'data atrás 3 dias (acima do teto): repõe');

    // fantasias: Gotas, nunca Uvas
    o = R(E, 'fantasias', '2026-12-22');
    ok(o.x.ok && o.x.gotasGastas === 30 && o.e.gotas === 70 && o.e.uvas === 7 && o.e.reputacao === 384 && o.e.festas.tarefasDia.carnaval_fantasias === '2026-12-22', 'fantasias: gastam 30 Gotas, 0 Uvas, dão +12');
    o = R('{ gotas: 100, uvas: 0, reputacao: 372, festas: { tarefasDia: {} } }', 'fantasias', '2026-12-22');
    ok(o.x.ok && o.e.uvas === 0, 'fantasias: funcionam com 0 Uvas');
    o = R(E, 'fantasias', '2026-12-25', { diaGrande: true });
    ok(o.e.gotas === 70 && o.e.reputacao === 396, 'fantasias no dia grande: o prémio dobra (+24) mas o custo não (30)');
    o = R('{ gotas: 30, uvas: 7, reputacao: 372, festas: { tarefasDia: {} } }', 'fantasias', '2026-12-22');
    ok(o.x.ok && o.e.gotas === 0, 'fantasias: com exatamente 30 Gotas faz-se');
    o = R('{ gotas: 29, uvas: 7, reputacao: 372, festas: { tarefasDia: {} } }', 'fantasias', '2026-12-22');
    ok(!o.x.ok && o.x.motivo === 'faltam_gotas' && o.e.gotas === 29 && o.e.reputacao === 372 && !o.e.festas.tarefasDia.carnaval_fantasias, 'fantasias: com 29 Gotas não gasta, não paga e não marca o dia');
    o = R('{ uvas: 7, reputacao: 372, festas: { tarefasDia: {} } }', 'fantasias', '2026-12-22');
    ok(!o.x.ok && o.x.motivo === 'faltam_gotas' && o.e.reputacao === 372, 'fantasias: sem campo de Gotas conta como 0');

    // quem está mascarado: acertar paga, falhar não custa nada mas gasta a tentativa do dia
    o = R(E, 'quemEstaMascarado', '2026-12-22', { venceu: true });
    ok(o.x.ok && o.x.venceu && o.x.rep === 6 && o.e.reputacao === 378 && o.e.gotas === 100 && o.e.uvas === 7, 'quem está mascarado certo: +6, sem custo');
    o = R(E, 'quemEstaMascarado', '2026-12-25', { venceu: true, diaGrande: true });
    ok(o.e.reputacao === 384, 'quem está mascarado certo no dia grande: +12');
    o = R(E, 'quemEstaMascarado', '2026-12-22', { venceu: false });
    ok(o.x.ok && !o.x.venceu && o.x.rep === 0 && o.e.reputacao === 372 && o.e.gotas === 100 && o.e.uvas === 7 && o.e.festas.tarefasDia.carnaval_quemEstaMascarado === '2026-12-22', 'quem está mascarado errado: não custa nada (Reputação, Gotas e Uvas iguais) e marca a tentativa do dia');
    o = R(E, 'quemEstaMascarado', '2026-12-22', { venceu: false, diaGrande: true });
    ok(o.e.reputacao === 372, 'quem está mascarado errado no dia grande: continua sem custar nada');
    ['x', 1, null, undefined].forEach(function (v) {
      o = R(E, 'quemEstaMascarado', '2026-12-22', { venceu: v });
      ok(!o.x.ok && o.x.motivo === 'resultado_invalido' && o.e.reputacao === 372 && !o.e.festas.tarefasDia.carnaval_quemEstaMascarado, 'quem está mascarado: resultado ' + JSON.stringify(v) + ' recusa sem mexer em nada');
    });

    // entradas inválidas
    ok(g.ev("festaResolverTarefa(null, CARNAVAL, T('corso'), '2026-12-22', {}).motivo") === 'estado_invalido', 'estado inválido recusa');
    ['', null, 'lixo', '2026-13-45'].forEach(function (d) {
      ok(g.ev('festaResolverTarefa(' + E + ', CARNAVAL, T("corso"), ' + JSON.stringify(d) + ', {}).motivo') === 'dia_invalido', 'dia ' + JSON.stringify(d) + ' recusa');
    });
    ok(g.ev("festaResolverTarefa(" + E + ", CARNAVAL, { id: 'x', regra: 'castanhas', premio: {} }, '2026-12-22', {}).motivo") === 'tarefa_invalida', 'uma regra do ecrã (não pura) recusa');
    ok(g.ev("festaResolverTarefa(" + E + ", CARNAVAL, null, '2026-12-22', {}).motivo") === 'tarefa_invalida', 'tarefa em falta recusa');
    // estado reparado em memória (nuvem ou save estranho)
    o = R('{ gotas: 100, reputacao: 372, festas: null }', 'corso', '2026-12-22');
    ok(o.x.ok && o.e.festas.tarefasDia.carnaval_corso === '2026-12-22', 'state.festas a null repara-se em memória');
    o = R('{ gotas: "abc", reputacao: "x", festas: { tarefasDia: [] } }', 'corso', '2026-12-22');
    ok(o.x.ok && o.e.reputacao === 5, 'Reputação inválida conta como 0, sem rebentar');

    // objetivo do dia lê a configuração
    g.ev("state.festas.tarefasDia = {};");
    ok(g.ev('festaTemTarefaPorFazerHoje(CARNAVAL)') === true, 'objetivo do dia: com nada feito há tarefa por fazer');
    g.ev("festaRegistarFez(state, 'carnaval', 'corso', diaLisboaDeHoje()); festaRegistarFez(state, 'carnaval', 'fantasias', diaLisboaDeHoje());");
    ok(g.ev('festaTemTarefaPorFazerHoje(CARNAVAL)') === true, 'objetivo do dia: com 2 de 3 feitas ainda há uma por fazer');
    g.ev("festaRegistarFez(state, 'carnaval', 'quemEstaMascarado', diaLisboaDeHoje());");
    ok(g.ev('festaTemTarefaPorFazerHoje(CARNAVAL)') === false, 'objetivo do dia: com as 3 do Carnaval feitas já não há');
    ok(g.ev("festaTemTarefaPorFazerHoje(FESTAS_CONFIG[0])") === true, 'objetivo do dia: as do Carnaval não contam para o São Martinho');
    ok(g.ev('festaTemTarefaPorFazerHoje(null)') === false, 'objetivo do dia: sem festa não há tarefas');
    const objetivosJs = fontes['objetivos.js'];
    ok(/festaTemTarefaPorFazerHoje\(festa\)/.test(objetivosJs) && !/'castanhas'|'jeropiga'|'prova'/.test(objetivosJs.slice(objetivosJs.indexOf('function candidatosGrupoC'), objetivosJs.indexOf('function candidatosGrupoC') + 1200)), 'objetivos.js lê as tarefas da configuração, sem nomes escritos à mão');

    // Fluxo no ecrã (Carnaval): um toque, uma gravação, uma vez por dia
    const n = abrir(lis(2, 14), '?festa=carnaval');
    n.ev('state.reputacao = 372; state.gotas = 100; state.uvas = 7;');
    n.ev("iniciarTarefaFesta('fantasias')");
    ok(n.ev('state.gotas') === 70 && n.ev('state.uvas') === 7 && n.ev('state.reputacao') === 384 && n.ev('SAVES') === 1 && n.ev('FUNDO') === 'assets/ecras/carnaval_festa.jpg', 'ecrã: fantasias gastam 30 Gotas, dão +12, uma gravação, imagem da festa');
    n.ev("iniciarTarefaFesta('fantasias')");
    ok(n.ev('state.gotas') === 70 && n.ev('state.reputacao') === 384 && n.ev('SAVES') === 1 && n.ev('festaMensagemAtual') === n.ev('FESTAS_STRINGS.carnaval.pt.fantasiasJaFeitaHoje'), 'ecrã: fantasias uma só vez por dia, com a mensagem de já feita');
    n.ev("iniciarTarefaFesta('corso')");
    ok(n.ev('state.reputacao') === 389 && n.ev('SAVES') === 2, 'ecrã: corso +5');
    n.ev('state.gotas = 10;'); n.ev('state.festas.tarefasDia.carnaval_fantasias = null;');
    n.ev("iniciarTarefaFesta('fantasias')");
    ok(n.ev('state.gotas') === 10 && n.ev('state.reputacao') === 389 && n.ev('SAVES') === 2 && n.ev('festaMensagemAtual') === n.ev('FESTAS_STRINGS.carnaval.pt.fantasiasFalta'), 'ecrã: fantasias com 10 Gotas avisam sem gastar nem gravar');
    // quem está mascarado
    n.ev("iniciarTarefaFesta('quemEstaMascarado')");
    const cena = n.json('festaCenaAtual.cena');
    ok(cena && cena.opcoes.length === 3, 'ecrã: o quem está mascarado mostra uma cena de 3 opções');
    const errada = (cena.correta + 1) % 3;
    n.ev('festaResponderCenaDoDia(' + errada + ')');
    ok(n.ev('state.reputacao') === 389 && n.ev('state.gotas') === 10 && n.ev('SAVES') === 3 && n.ev("festaJaFezTarefaHoje('carnaval', 'quemEstaMascarado')") === true, 'ecrã: quem está mascarado errado não custa nada e gasta a tentativa do dia');
    ok(n.json('ENTRADAS').join() === 'caretos' && n.json('AVISOS').join() === 'caretos', 'ecrã: responder à cena do quem está mascarado (mesmo errando) abre a entrada caretos e mostra o aviso de entrada nova: ' + n.json('ENTRADAS').join() + ' / ' + n.json('AVISOS').join());
    n.ev('festaResponderCenaDoDia(' + cena.correta + ')');
    ok(n.ev('state.reputacao') === 389 && n.ev('SAVES') === 3, 'ecrã: toque duplo na mesma cena não paga nem grava outra vez');
    ok(n.json('ENTRADAS').join() === 'caretos' && n.json('AVISOS').join() === 'caretos', 'ecrã: toque duplo na mesma cena do Carnaval não abre a entrada outra vez');
    n.ev("iniciarTarefaFesta('quemEstaMascarado')");
    ok(n.ev('festaCenaAtual') === null, 'ecrã: quem está mascarado já tentado hoje não abre outra cena');
    n.ir(lis(2, 15));
    n.ev("iniciarTarefaFesta('quemEstaMascarado')");
    const cena2 = n.json('festaCenaAtual.cena');
    n.ev('festaResponderCenaDoDia(' + cena2.correta + ')');
    ok(n.ev('state.reputacao') === 395 && n.ev('SAVES') === 4, 'ecrã: no dia seguinte volta, e acertar dá +6');
    ok(n.json('OBJETIVOS').length === 4 && n.json('ENTRADAS').every(function (x) { return x === 'caretos'; }), 'ecrã: cada tarefa conta para o objetivo do dia e o corso e as fantasias não abrem entradas');
    n.ev('enterFesta()');
    ok(n.json('ENTRADAS').slice(-1)[0] === 'entrudo' && n.json('ENTRADAS').indexOf('lendaSaoMartinho') === -1, 'enterFesta no Carnaval abre o entrudo (e não a lenda de São Martinho)');
    ok(n.json('AVISOS').slice(-1)[0] === 'entrudo', 'enterFesta no Carnaval mostra o aviso de entrada nova do entrudo');
    {
      // ganhar e perder a cena dos caretos; corso e fantasias não abrem nada
      const v = abrir(lis(2, 15), '?festa=carnaval');
      v.ev("iniciarTarefaFesta('corso')"); v.ev("iniciarTarefaFesta('fantasias')");
      ok(v.json('ENTRADAS').length === 0, 'Carnaval: fazer o corso e as fantasias não abre entradas');
      v.ev("iniciarTarefaFesta('quemEstaMascarado')");
      ok(v.json('ENTRADAS').length === 0, 'Carnaval: abrir a cena do quem está mascarado ainda não abre a entrada');
      v.ev('festaResponderCenaDoDia(' + v.json('festaCenaAtual.cena.correta') + ')');
      ok(v.json('ENTRADAS').join() === 'caretos' && v.json('AVISOS').join() === 'caretos', 'Carnaval: acertar na cena abre a entrada caretos com o aviso');
      v.ev("iniciarTarefaFesta('quemEstaMascarado')");
      ok(v.json('ENTRADAS').join() === 'caretos', 'Carnaval: cena já feita hoje não abre a entrada outra vez');
    }
    n.ev('renderFestaHub()');
    const html = n.ev('caixa.innerHTML');
    ok(/iniciarTarefaFesta\('corso'\)/.test(html) && /iniciarTarefaFesta\('fantasias'\)/.test(html) && /iniciarTarefaFesta\('quemEstaMascarado'\)/.test(html) && !/castanhas|jeropiga|prova/.test(html), 'hub do Carnaval: os 3 botões do Carnaval e nenhum do São Martinho');
    ok(n.ev('FUNDO') === 'assets/ecras/carnaval_festa.jpg', 'hub do Carnaval: imagem da festa fora do dia grande');
    const gd = abrir(lis(2, 17), '?festa=carnaval&dia=17');
    gd.ev('state.reputacao = 372; state.gotas = 100;');
    gd.ev('renderFestaHub()');
    ok(gd.ev('FUNDO') === 'assets/ecras/carnaval_dia_grande.jpg' && gd.ev('caixa.innerHTML').indexOf(gd.ev('FESTAS_STRINGS.carnaval.pt.diaGrandeAviso')) !== -1, 'hub do Carnaval no dia grande: imagem do dia 25 e aviso');
    gd.ev("iniciarTarefaFesta('fantasias')");
    ok(gd.ev('state.reputacao') === 396 && gd.ev('state.gotas') === 70, 'ecrã: no dia grande os fantasias dão +24 e custam 30');
    // sol num dia de Carnaval não faz aparecer o aviso do "verão de São Martinho"
    gd.ev("tempoAtual = function () { return { disponivel: true, ceu: 'sol' }; }; renderFestaHub();");
    ok(gd.ev('caixa.innerHTML').indexOf('undefined') === -1, 'hub do Carnaval com sol: nada de "undefined" (o verão é só do São Martinho)');
  }

  // ---------------- D2. Cena de quem está mascarado: fixa por dia ----------------
  {
    const g = abrir(lis(2, 14));
    const c = function (dia, n) { return g.ev("festaCenaDoDia('carnaval', 'quemEstaMascarado', " + JSON.stringify(dia) + ', ' + JSON.stringify(n === undefined ? 3 : n) + ')'); };
    const dias = ['2026-02-14', '2026-02-15', '2026-02-16', '2026-02-17', '2027-02-06', '2027-02-07', '2027-02-08', '2027-02-09'];
    dias.forEach(function (d) { ok(c(d) === c(d) && c(d) >= 0 && c(d) <= 2, d + ': a cena é a mesma o dia todo e vem de 0 a 2'); });
    ok(new Set(dias.map(function (d) { return c(d); })).size >= 2, 'nos 8 dias de Carnaval de 2026 e 2027 não sai sempre a mesma cena');
    ok(c('2026-12-22', 0) === 0 && c('2026-12-22', -1) === 0 && c('2026-12-22', 1.5) === 0 && c(null) === 0, 'n inválido ou dia inválido: cena 0, sem rebentar');
    const a = abrir(lis(2, 14, '08:00')), b = abrir(lis(2, 14, '22:00'));
    ok(a.ev("festaCenaDoDia('carnaval', 'quemEstaMascarado', diaLisboaDeHoje(), 3)") === b.ev("festaCenaDoDia('carnaval', 'quemEstaMascarado', diaLisboaDeHoje(), 3)"), 'a cena não depende da hora, só do dia de Lisboa');
    ok(g.ev("festaCenaDoDia('carnaval', 'quemEstaMascarado', '2026-12-22', 3)") !== undefined && g.ev("festaCenaDoDia('carnaval', 'outra', '2026-12-22', 1000)") !== g.ev("festaCenaDoDia('carnaval', 'quemEstaMascarado', '2026-12-22', 1000)"), 'a semente inclui a tarefa');
    const fonte = fontes['festas.js'];
    const regras = fonte.slice(fonte.indexOf('// TAREFAS "UMA VEZ POR DIA"'), fonte.indexOf('// TEXTOS (PT / EN / ES)'));
    ok(!/Math\.random|Date\.now|new Date|randInt/.test(regras), 'as regras puras (relógio e Carnaval) não lêem o relógio nem sorteiam');
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
    // a Enciclopédia tem as entradas de Natal (consoada e boloRei), uma por língua, e nenhuma "natal" (texto e forma: verificar-enciclopedia-natal.js)
    const explorar = fs.readFileSync(path.join(RAIZ, 'js', 'explorar.js'), 'utf8');
    ok((explorar.match(/id: 'consoada'/g) || []).length === 3 && (explorar.match(/id: 'boloRei'/g) || []).length === 3 && !/id: 'natal/i.test(explorar), 'a Enciclopédia tem a consoada e o boloRei nas 3 línguas');
    // Natal não mexe em js/nuvem.js nem no state.js (a forma de state.festas é a de antes)
    ok(g.json('Object.keys(defaultState().festas)').join() === 'tarefasDia', 'state.festas continua a ter só tarefasDia');
  }


  // ---------------- F. Datas móveis ----------------
  {
    const g = abrir(lis(1, 15));
    const PASCOA = { 2026: '2026-04-05', 2027: '2027-03-28', 2028: '2028-04-16', 2029: '2029-04-01', 2030: '2030-04-21', 2031: '2031-04-13', 2032: '2032-03-28', 2033: '2033-04-17', 2034: '2034-04-09', 2035: '2035-03-25' };
    const fmt = function (t) { const d = new Date(t); return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0'); };
    // 2.º método, independente (Gauss, com as correções gregorianas e as duas exceções): 22 de março + d + e dias
    const gauss = function (y) {
      const k = Math.floor(y / 100), p = Math.floor((13 + 8 * k) / 25), q = Math.floor(k / 4);
      const M = (15 - p + k - q) % 30, N = (4 + k - q) % 7, a = y % 19, b = y % 4, c = y % 7;
      const d = (19 * a + M) % 30, e = (2 * b + 4 * c + 6 * d + N) % 7;
      let dias = d + e;
      if (d === 29 && e === 6) dias = 28;  // 19 de abril
      else if (d === 28 && e === 6 && a > 10) dias = 27; // 18 de abril
      return fmt(Date.UTC(y, 2, 22) + dias * 86400000);
    };
    Object.keys(PASCOA).forEach(function (y) {
      ok(g.ev('pascoaDoAno(' + y + ')') === PASCOA[y], 'Páscoa ' + y + ' (jogo): devia ser ' + PASCOA[y] + ', deu ' + g.ev('pascoaDoAno(' + y + ')'));
      ok(gauss(Number(y)) === PASCOA[y], 'Páscoa ' + y + ' (2.º método, Gauss): devia ser ' + PASCOA[y] + ', deu ' + gauss(Number(y)));
    });
    // os dois métodos coincidem em todos os anos de 1583 a 4099 (e é sempre domingo, entre 22/03 e 25/04)
    let difere = 0, naoDomingo = 0, fora = 0;
    for (let y = 1583; y <= 4099; y++) {
      const a = g.ev('pascoaDoAno(' + y + ')'), b = gauss(y);
      if (a !== b) difere++;
      const t = Date.UTC(Number(a.slice(0, 4)), Number(a.slice(5, 7)) - 1, Number(a.slice(8, 10)));
      if (new Date(t).getUTCDay() !== 0) naoDomingo++;
      const mmdd = a.slice(5);
      if (mmdd < '03-22' || mmdd > '04-25') fora++;
    }
    ok(difere === 0, 'Páscoa: os dois métodos coincidem de 1583 a 4099 (' + difere + ' diferenças)');
    ok(naoDomingo === 0 && fora === 0, 'Páscoa: sempre ao domingo e entre 22/03 e 25/04 (' + naoDomingo + ' não domingos, ' + fora + ' fora do intervalo)');
    ok(g.ev('pascoaDoAno(1583)') === gauss(1583) && g.ev('pascoaDoAno(1818)') === '1818-03-22' && g.ev('pascoaDoAno(1943)') === '1943-04-25' && g.ev('pascoaDoAno(2000)') === '2000-04-23' && g.ev('pascoaDoAno(1954)') === '1954-04-18', 'Páscoa: os dois extremos (22/03 em 1818, 25/04 em 1943) e 2000 e 1954 (a exceção de 18 de abril)');
    [1582, 0, -5, 10000, 2026.5, '2026', null, undefined, NaN].forEach(function (a) {
      ok(g.ev('pascoaDoAno(' + (a === undefined ? 'undefined' : JSON.stringify(a) === 'null' && Number.isNaN(a) ? 'NaN' : JSON.stringify(a)) + ')') === null, 'Páscoa: ano inválido ' + String(a) + ' dá null');
    });

    // somar dias
    const som = function (d, n) { return g.ev('diaSomarDias(' + JSON.stringify(d) + ', ' + JSON.stringify(n) + ')'); };
    ok(som('2028-02-28', 1) === '2028-02-29' && som('2028-02-28', 2) === '2028-03-01' && som('2027-02-28', 1) === '2027-03-01' && som('2028-02-29', 366) === '2029-03-01', 'somar dias: fevereiro e ano bissexto');
    ok(som('2026-12-31', 1) === '2027-01-01' && som('2027-01-01', -1) === '2026-12-31' && som('2026-01-31', 1) === '2026-02-01' && som('2026-03-01', -1) === '2026-02-28' && som('2026-04-30', 1) === '2026-05-01', 'somar dias: viragem de mês e de ano');
    ok(som('2027-03-28', -47) === '2027-02-09' && som('2026-04-05', -47) === '2026-02-17' && som('2028-04-16', -47) === '2028-02-29' && som('2026-04-05', 0) === '2026-04-05' && som('2026-04-05', -2) === '2026-04-03' && som('2026-04-05', 1) === '2026-04-06', 'somar dias: Páscoa menos 47 (Carnaval), menos 2 e mais 1');
    ok(som('2026-03-28', 2) === '2026-03-30' && som('2026-03-29', 1) === '2026-03-30' && som('2026-10-24', 2) === '2026-10-26' && som('2026-04-04', 1) === '2026-04-05' && som('2026-04-05', 1) === '2026-04-06' && som('2026-09-26', 1) === '2026-09-27' && som('2026-09-27', 1) === '2026-09-28', 'somar dias: não é afetado pela mudança de hora (Lisboa e o fuso do aparelho, Nova Zelândia)');
    ok(som('2026-02-30', 1) === null && som('lixo', 1) === null && som('', 1) === null && som(null, 1) === null && som('2026-04-05', 1.5) === null && som('2026-04-05', '1') === null && som('2026-04-05', null) === null && som('9999-12-31', 1) === null && som('1000-01-01', -1) === null, 'somar dias: dia ou n inválidos dão null (e fora de 4 algarismos também)');
    let contasMal = 0;
    for (const n of [-400, -50, -47, -2, -1, 0, 1, 2, 50, 365, 366, 800]) {
      for (let k = 0; k < 400; k++) {
        const d = fmt(Date.UTC(2026, 0, 1) + k * 86400000 * 3);
        const r = som(d, n);
        if (g.ev('diasEntreDiasLisboa(' + JSON.stringify(d) + ', ' + JSON.stringify(r) + ')') !== n) contasMal++;
      }
    }
    ok(contasMal === 0, 'somar dias: coincide com diasEntreDiasLisboa (js/tempo.js) em 4800 contas (' + contasMal + ' erradas)');

    // janela móvel: uma festa de TESTE só nestes testes, com deslocamentos diferentes dos do Carnaval real (-2 a +1, dia grande a 0:
    // da Sexta-feira Santa à Segunda de Páscoa), para provar o motor sem depender da configuração do jogo
    const f = abrir(lis(1, 15));
    f.ev("FESTAS_CONFIG.push({ id: 'festaMovelTeste', movel: { base: 'pascoa', inicioDias: -2, fimDias: 1, diaGrandeDias: 0 }, tarefas: [], recompensas: { multiplicadorDiaGrande: 2 } }); var CT = FESTAS_CONFIG[FESTAS_CONFIG.length - 1];");
    const JAN = {}; Object.keys(PASCOA).forEach(function (y) { const t = Date.UTC(Number(y), Number(PASCOA[y].slice(5, 7)) - 1, Number(PASCOA[y].slice(8, 10))); JAN[y] = [fmt(t - 2 * 86400000), fmt(t + 86400000), PASCOA[y]]; });
    Object.keys(JAN).forEach(function (y) {
      const j = f.json('festaJanela(CT, ' + y + ')');
      ok(j && j.inicio === JAN[y][0] && j.fim === JAN[y][1] && j.diaGrande === JAN[y][2], 'Festa móvel de teste ' + y + ': de ' + JAN[y][0] + ' a ' + JAN[y][1] + ', dia grande no domingo de Páscoa ' + JAN[y][2] + '; deu ' + JSON.stringify(j));
      const dow = function (d) { return new Date(Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8, 10)))).getUTCDay(); };
      ok(dow(JAN[y][0]) === 5 && dow(JAN[y][1]) === 1 && dow(JAN[y][2]) === 0, 'Festa móvel de teste ' + y + ': começa a uma sexta, acaba a uma segunda e o dia grande é o domingo');
    });
    // janelas do Carnaval real (Páscoa -50 a -47) calculadas aqui a partir da tabela da Páscoa
    const JC = {}; Object.keys(PASCOA).forEach(function (y) { const t = Date.UTC(Number(y), Number(PASCOA[y].slice(5, 7)) - 1, Number(PASCOA[y].slice(8, 10))); JC[y] = [fmt(t - 50 * 86400000), fmt(t - 47 * 86400000)]; });
    // todos os dias de 2026 a 2035: abre só dentro da janela, dia grande só no domingo
    let aberturaMal = 0, grandeMal = 0, fora1 = 0;
    for (let y = 2026; y <= 2035; y++) {
      const dias = (y % 4 === 0) ? 366 : 365;
      for (let k = 0; k < dias; k++) {
        const d = fmt(Date.UTC(y, 0, 1) + k * 86400000);
        const dentro = d >= JAN[y][0] && d <= JAN[y][1];
        if (f.ev('festaAbertaNoDia(CT, ' + JSON.stringify(d) + ')') !== dentro) aberturaMal++;
        if (f.ev('festaDiaGrandeNoDia(CT, ' + JSON.stringify(d) + ')') !== (d === JAN[y][2])) grandeMal++;
        const viaMotor = f.ev('(festaAtivaPelaDataReal(' + JSON.stringify(d) + ') || {}).id || null');
        const esperado = dentro ? (d <= JAN[y][2] ? 'pascoa' : 'festaMovelTeste') : (d >= JC[y][0] && d <= JC[y][1] ? 'carnaval' : d >= y + '-11-08' && d <= y + '-11-14' ? 'saomartinho' : (d >= y + '-12-20' && d <= y + '-12-26' ? 'natal' : null));
        if (viaMotor !== esperado) fora1++;
      }
    }
    ok(aberturaMal === 0, 'Festa móvel de teste (Sexta-feira Santa a Segunda de Páscoa): abre exatamente dentro da janela em todos os dias de 2026 a 2035 (' + aberturaMal + ' erros)');
    ok(grandeMal === 0, 'Festa móvel de teste (Sexta-feira Santa a Segunda de Páscoa): o dia grande é só a terça em todos os dias de 2026 a 2035 (' + grandeMal + ' erros)');
    ok(fora1 === 0, 'o motor (festaAtivaPelaDataReal com o dia) escolhe a festa certa em todos os dias de 2026 a 2035: Páscoa (Sexta-feira Santa a domingo, que vem antes na lista), festa móvel de teste (só a segunda-feira), Carnaval, São Martinho, Natal ou nenhuma (' + fora1 + ' erros)');
    const abre = function (d) { return f.ev('festaAbertaNoDia(CT, ' + JSON.stringify(d) + ')'); };
    ok(abre('2027-03-25') === false && abre('2027-03-26') === true && abre('2027-03-29') === true && abre('2027-03-30') === false, '2027: abre a 26/03 (sexta) e fecha a 29/03 (segunda)');
    ok(abre('2026-04-02') === false && abre('2026-04-03') === true && abre('2026-04-06') === true && abre('2026-04-07') === false, '2026: abre a 03/04 (sexta) e fecha a 06/04 (segunda)');
    ok(abre('2028-04-13') === false && abre('2028-04-14') === true && abre('2028-04-17') === true && abre('2028-04-18') === false && f.ev("festaDiaGrandeNoDia(CT, '2028-04-16')") === true && f.ev("festaDiaGrandeNoDia(CT, '2028-04-17')") === false, '2028 (bissexto): abre a 14/04, o dia grande é 16/04, fecha a 17/04');
    ok(abre('2029-03-29') === false && abre('2029-03-30') === true && abre('2029-03-31') === true && abre('2029-04-01') === true && abre('2029-04-02') === true && abre('2029-04-03') === false, '2029: a janela passa a viragem de março para abril sem partir (30/03 a 02/04)');
    ok(abre('2026-12-31') === false && abre('2027-01-01') === false && abre('2027-01-31') === false, 'viragem de ano: sem festa de teste a 31/12 nem em janeiro');
    ok(abre('2027-03-28') === true && abre('2026-03-28') === false && abre('2028-03-28') === false, 'a janela é a do ano do dia (a de 2027 não abre em 2026 nem 2028)');
    ['', null, undefined, 'lixo', '2027-02-30', '2027-13-01', 20270209, {}, '2027-03-27x', '2027-03-2', '2027-03-28 ', '2026-04-04x', '2026-04-05 '].forEach(function (d) {
      ok(f.ev('festaAbertaNoDia(CT, ' + (d === undefined ? 'undefined' : JSON.stringify(d)) + ')') === false && f.ev('festaDiaGrandeNoDia(CT, ' + (d === undefined ? 'undefined' : JSON.stringify(d)) + ')') === false && f.ev('festaAtivaPelaDataReal(' + (d === undefined ? '"x"' : JSON.stringify(d)) + ')') === null, 'dia inválido ' + String(d) + ': nenhuma festa, sem rebentar');
    });
    // configurações estranhas não rebentam nem abrem nada
    ok(f.ev("festaJanela({ movel: { base: 'natal', inicioDias: 0, fimDias: 0, diaGrandeDias: 0 } }, 2027)") === null && f.ev("festaJanela({ movel: { base: 'pascoa', inicioDias: 'x', fimDias: 0, diaGrandeDias: 0 } }, 2027)") === null && f.ev("festaJanela({ movel: { base: 'pascoa', inicioDias: 0, fimDias: 0 } }, 2027)") === null && f.ev("festaJanela({ movel: { base: 'pascoa', inicioDias: 0, fimDias: 0, diaGrandeDias: 0 } }, 1500)") === null && f.ev('festaJanela(null, 2027)') === null && f.ev("festaJanela({ inicio: { mes: 1, dia: 30 }, fim: { mes: 1, dia: 30 }, diaGrande: { mes: 1, dia: 30 } }, 2027)") === null, 'configuração móvel ou fixa inválida: sem janela (null), a festa nunca abre');
    ok(f.ev("festaJanela({ movel: { base: 'pascoa', inicioDias: 0, fimDias: 1, diaGrandeDias: 0 } }, 2027)").inicio === '2027-03-28', 'a janela móvel com a base na própria Páscoa (0 dias) é a Páscoa');

    // o dia por omissão é o de Lisboa de hoje (o aparelho está adiantado em relação a Lisboa)
    const h = abrir(Date.parse('2027-03-27T20:00:00Z')); // Lisboa 27/03/2027 20:00; aparelho (Nova Zelândia) já a 28/03
    h.ev("FESTAS_CONFIG.push({ id: 'festaMovelTeste', movel: { base: 'pascoa', inicioDias: -2, fimDias: 1, diaGrandeDias: 0 }, tarefas: [], recompensas: { multiplicadorDiaGrande: 2 } });");
    ok(h.ev('new Date().getDate()') === 28 && h.ev('diaLisboaDeHoje()') === '2027-03-27', 'ambiente: aparelho um dia à frente de Lisboa');
    ok(h.ev('festaAtivaPelaDataReal().id') === 'pascoa' && h.ev('festaAtual().id') === 'pascoa' && h.ev('estaNoDiaGrandeFesta(festaAtual())') === false, 'sem argumento: usa o dia de Lisboa (27/03: Páscoa aberta, ainda não é o domingo de Páscoa)');
    h.ir(Date.parse('2027-03-28T20:00:00Z'));
    ok(h.ev('estaNoDiaGrandeFesta(festaAtual())') === true, 'sem argumento: 28/03 em Lisboa é o dia grande');
    h.ir(Date.parse('2027-03-29T23:30:00Z'));
    ok(h.ev('festaAtivaPelaDataReal()') === null && h.ev("festaAtual('2027-03-27').id") === 'pascoa', 'sem argumento: 30/03 (00:30 em Lisboa) fechada; com argumento, festaAtual(dia) olha para esse dia');
    ok(h.ev("estaNoDiaGrandeFesta(festaAtual('2027-03-28'), '2027-03-28')") === true && h.ev("estaNoDiaGrandeFesta(festaAtual('2027-03-28'), '2027-03-27')") === false, 'estaNoDiaGrandeFesta(festa, dia) usa o dia que recebe');

    // atalhos: ?festa= e ?dia= continuam como estão (com a festa de teste móvel também)
    const a = abrir(Date.parse('2027-03-20T12:00:00Z'), '?festa=festaMovelTeste&dia=28');
    a.ev("FESTAS_CONFIG.push({ id: 'festaMovelTeste', movel: { base: 'pascoa', inicioDias: -2, fimDias: 1, diaGrandeDias: 0 }, tarefas: [], recompensas: { multiplicadorDiaGrande: 2 } });");
    ok(a.ev('festaAtual().id') === 'festaMovelTeste' && a.ev('estaNoDiaGrandeFesta(festaAtual())') === true, '?festa=festaMovelTeste&dia=28 (fora da janela, em março de 2027): força a festa e o dia grande');
    const b = abrir(Date.parse('2027-03-20T12:00:00Z'), '?festa=festaMovelTeste&dia=27');
    b.ev("FESTAS_CONFIG.push({ id: 'festaMovelTeste', movel: { base: 'pascoa', inicioDias: -2, fimDias: 1, diaGrandeDias: 0 }, tarefas: [], recompensas: { multiplicadorDiaGrande: 2 } });");
    ok(b.ev('estaNoDiaGrandeFesta(festaAtual())') === false, '?festa=festaMovelTeste&dia=27: não é o dia grande');
    const c = abrir(lis(5, 1), '?festa=natal&dia=25');
    ok(c.ev('estaNoDiaGrandeFesta(festaAtual())') === true && c.ev("estaNoDiaGrandeFesta(festaAtual(), '2026-01-01')") === true, '?festa=natal&dia=25 continua igual (o dia do endereço manda, seja qual for o dia)');
    const c3 = abrir(lis(12, 25), '?festa=natal');
    ok(c3.ev('festaAtual().id') === 'natal' && c3.ev('estaNoDiaGrandeFesta(festaAtual())') === false, '?festa=natal sem ?dia= (mesmo a 25/12 em Lisboa): força a festa mas não o dia grande, como antes');
    const c2 = abrir(lis(5, 1), '?festa=saomartinho&dia=11');
    ok(c2.ev('estaNoDiaGrandeFesta(festaAtual())') === true, '?festa=saomartinho&dia=11 continua igual');

    // São Martinho e Natal: os mesmos resultados de antes em todos os dias de 2024 a 2036 (inclui 4 anos bissextos)
    let sm = 0, nat = 0, grande = 0, aberto = 0, total = 0;
    for (let y = 2024; y <= 2036; y++) {
      const dias = (y % 4 === 0) ? 366 : 365;
      for (let k = 0; k < dias; k++) {
        const d = fmt(Date.UTC(y, 0, 1) + k * 86400000);
        const mmdd = d.slice(5);
        const pg = gauss(y), tp = Date.UTC(y, Number(pg.slice(5, 7)) - 1, Number(pg.slice(8, 10)));
        const emCarnaval = d >= fmt(tp - 50 * 86400000) && d <= fmt(tp - 47 * 86400000);
        const emPascoa = d >= fmt(tp - 2 * 86400000) && d <= fmt(tp);
        const esperado = emCarnaval ? 'carnaval' : emPascoa ? 'pascoa' : (mmdd >= '11-08' && mmdd <= '11-14') ? 'saomartinho' : ((mmdd >= '12-20' && mmdd <= '12-26') ? 'natal' : null);
        const obtido = g.ev('(festaAtivaPelaDataReal(' + JSON.stringify(d) + ') || {}).id || null');
        total++;
        if (obtido !== esperado) aberto++;
        const esperaGrande = mmdd === '11-11' || mmdd === '12-25';
        const festaDoDia = g.ev('festaAtivaPelaDataReal(' + JSON.stringify(d) + ') !== null') && esperado !== 'carnaval' && esperado !== 'pascoa';
        const obtidoGrande = festaDoDia && g.ev('estaNoDiaGrandeFesta(festaAtivaPelaDataReal(' + JSON.stringify(d) + '), ' + JSON.stringify(d) + ')');
        if (obtidoGrande !== (esperaGrande && festaDoDia)) grande++;
        if (esperado === 'saomartinho' && obtido !== 'saomartinho') sm++;
        if (esperado === 'natal' && obtido !== 'natal') nat++;
      }
    }
    ok(total === 4749 && aberto === 0 && sm === 0 && nat === 0, 'São Martinho (8 a 14/11) e Natal (20 a 26/12) abrem exatamente como antes, e o Carnaval e a Páscoa só nas suas janelas, em todos os ' + total + ' dias de 2024 a 2036 (' + aberto + ' diferenças)');
    ok(grande === 0, 'São Martinho e Natal: o dia grande é exatamente 11/11 e 25/12 em todos os dias de 2024 a 2036 (' + grande + ' diferenças)');
    const bordas = ['2026-11-07', '2026-11-08', '2026-11-11', '2026-11-14', '2026-11-15', '2026-12-19', '2026-12-20', '2026-12-25', '2026-12-26', '2026-12-27', '2028-11-08', '2028-12-26'];
    ok(JSON.stringify(bordas.map(function (d) { return g.ev('(festaAtivaPelaDataReal(' + JSON.stringify(d) + ') || {}).id || null'); })) === JSON.stringify([null, 'saomartinho', 'saomartinho', 'saomartinho', null, null, 'natal', 'natal', 'natal', null, 'saomartinho', 'natal']), 'São Martinho e Natal: dias de fronteira (dia antes, primeiro, grande, último, dia depois)');
    ok(g.json('FESTAS_CONFIG.map(function (x) { return x.id; })').join() === 'saomartinho,natal,carnaval,pascoa' && g.json("FESTAS_CONFIG.map(function (x) { return !!x.movel; })").join() === 'false,false,true,true', 'o jogo tem o São Martinho e o Natal (datas fixas) e o Carnaval e a Páscoa (datas móveis, a Páscoa por último)');

    // as regras de datas são puras: nada de relógio do aparelho
    const fonte = fontes['festas.js'];
    const bloco = fonte.slice(fonte.indexOf('// DATAS: REGRAS PURAS'), fonte.indexOf('// ?festa=saomartinho'));
    ok(!/Math\.random|Date\.now|new Date\(\)|getDate\(|getMonth\(|getFullYear\(|getDay\(|getHours\(|diaLisboaDeHoje/.test(bloco.slice(0, bloco.indexOf('// DETEÇÃO DA FESTA PELA DATA REAL'))), 'as regras puras de datas não lêem o relógio nem usam getters locais');
    ok(/Date\.UTC/.test(bloco) && /getUTCFullYear/.test(bloco), 'as contas de dias usam Date.UTC');
  }


  // ---------------- G. Carnaval ----------------
  {
    const g = abrir(lis(2, 10));
    const cv = g.json("FESTAS_CONFIG.filter(function (f) { return f.id === 'carnaval'; })[0]");
    ok(!!cv, 'Carnaval: existe em FESTAS_CONFIG');
    if (cv) {
      ok(JSON.stringify(cv.movel) === '{"base":"pascoa","inicioDias":-50,"fimDias":-47,"diaGrandeDias":-47}', 'Carnaval: data móvel a partir da Páscoa (-50 a -47, dia grande -47)');
      ok(cv.inicio === undefined && cv.fim === undefined && cv.diaGrande === undefined, 'Carnaval: sem datas fixas (só a data móvel)');
      ok(cv.recompensas.multiplicadorDiaGrande === 2 && cv.entradaEnciclopedia === 'entrudo', 'Carnaval: dia grande a dobrar e abre a entrada entrudo ao entrar');
      ok(cv.tarefas.map(function (x) { return x.entradaEnciclopedia; }).join() === ',,caretos', 'Carnaval: só a tarefa quemEstaMascarado abre uma entrada (caretos); corso e fantasias não');
      ok(JSON.stringify(cv.tarefas.map(function (x) { return x.id; })) === '["corso","fantasias","quemEstaMascarado"]' && cv.tarefas.every(function (x) { return x.onde === 'festa'; }), 'Carnaval: corso, fantasias e quemEstaMascarado, todas no ecrã da festa');
      ok(cv.tarefas.map(function (x) { return x.regra; }).join() === 'oferta,gastar_gotas,cena_do_dia', 'Carnaval: regras do Natal (oferta, gastar_gotas, cena_do_dia), nenhuma nova');
      ok(JSON.stringify(cv.tarefas[0].premio) === '{"reputacao":5}' && JSON.stringify(cv.tarefas[1].premio) === '{"custoGotas":30,"reputacao":12}' && JSON.stringify(cv.tarefas[2].premio) === '{"reputacao":6}', 'Carnaval: corso +5 (sem custo), fantasias 30 Gotas e +12, quem está mascarado +6');
      ok(JSON.stringify(cv.tarefas).indexOf('uvas') === -1 && JSON.stringify(cv.tarefas).indexOf('Uvas') === -1, 'Carnaval: nenhuma tarefa tem custo nem prémio em Uvas');
      ok(g.json("FESTAS_CONFIG.filter(function (f) { return f.id === 'natal'; })[0].tarefas.map(function (x) { return [x.regra, JSON.stringify(x.premio)].join(); })").join('|') === cv.tarefas.map(function (x) { return [x.regra, JSON.stringify(x.premio)].join(); }).join('|'), 'Carnaval: as mesmas regras e valores do Natal');
      ok(cv.imagens.faixa === 'assets/ecras/carnaval_festa.jpg' && cv.imagens.diaGrande === 'assets/ecras/carnaval_dia_grande.jpg' && cv.imagens.corso === cv.imagens.faixa && cv.imagens.fantasias === cv.imagens.faixa && cv.imagens.quemEstaMascarado === cv.imagens.faixa, 'Carnaval: uma imagem para a faixa e as tarefas e outra (com gente) para o dia grande');
      const dim = function (f) { // largura e altura de um JPEG (marcador SOF)
        const b = fs.readFileSync(f); let i = 2;
        while (i < b.length) { if (b[i] !== 0xFF) { i++; continue; } const m = b[i + 1]; if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)]; i += 2 + b.readUInt16BE(i + 2); }
        return null;
      };
      Object.keys(cv.imagens).forEach(function (k) {
        const f = path.join(RAIZ, cv.imagens[k]);
        ok(fs.existsSync(f), 'Carnaval: a imagem ' + k + ' existe (' + cv.imagens[k] + ')');
        if (fs.existsSync(f)) {
          ok(fs.statSync(f).size < 256000, 'Carnaval: ' + cv.imagens[k] + ' tem de pesar menos de 256 000 bytes (pesa ' + fs.statSync(f).size + ')');
          ok(JSON.stringify(dim(f)) === '[714,1280]', 'Carnaval: ' + cv.imagens[k] + ' mantém 714x1280');
        }
      });
      ok(fs.statSync(path.join(RAIZ, cv.imagens.diaGrande)).size <= 245000, 'Carnaval: a imagem do dia grande ficou com margem (até 245 000 bytes)');
      const orig1 = path.join(RAIZ, 'imagens_JOGO_TELEGRAM', 'carnaval_patio_vindima_1.jpg'), orig2 = path.join(RAIZ, 'imagens_JOGO_TELEGRAM', 'carnaval_patio_vindimas_2_personagens.jpg');
      ok(fs.readFileSync(path.join(RAIZ, cv.imagens.faixa)).equals(fs.readFileSync(orig1)), 'carnaval_festa.jpg é cópia exata de carnaval_patio_vindima_1.jpg');
      ok(fs.statSync(path.join(RAIZ, cv.imagens.diaGrande)).size < fs.statSync(orig2).size && JSON.stringify(dim(orig2)) === '[714,1280]', 'carnaval_dia_grande.jpg é a versão comprimida (mais pequena) de carnaval_patio_vindimas_2_personagens.jpg');
      ['carnaval_festa.jpg', 'carnaval_dia_grande.jpg'].forEach(function (f) {
        const linha = CREDITOS.split('\n').filter(function (l) { return l.indexOf('assets/ecras/' + f) !== -1; })[0];
        ok(!!linha && linha.indexOf('origem a confirmar pelo Nuno') !== -1, 'CREDITOS.md devia listar ' + f + ' com "origem a confirmar pelo Nuno"');
      });
    }

    // janelas de 2026 a 2035 (as datas que o PR das datas móveis já confirma, e as outras calculadas pela Páscoa)
    const JAN = { 2026: ['2026-02-14', '2026-02-17'], 2027: ['2027-02-06', '2027-02-09'], 2028: ['2028-02-26', '2028-02-29'], 2029: ['2029-02-10', '2029-02-13'], 2030: ['2030-03-02', '2030-03-05'], 2031: ['2031-02-22', '2031-02-25'], 2032: ['2032-02-07', '2032-02-10'], 2033: ['2033-02-26', '2033-03-01'], 2034: ['2034-02-18', '2034-02-21'], 2035: ['2035-02-03', '2035-02-06'] };
    const fmtc = function (t) { const d = new Date(t); return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0'); };
    const dowc = function (d) { return new Date(Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8, 10)))).getUTCDay(); };
    g.ev("var CARNAVAL = FESTAS_CONFIG.filter(function (f) { return f.id === 'carnaval'; })[0];");
    Object.keys(JAN).forEach(function (y) {
      const j = g.json('festaJanela(CARNAVAL, ' + y + ')');
      ok(j && j.inicio === JAN[y][0] && j.fim === JAN[y][1] && j.diaGrande === JAN[y][1], 'Carnaval ' + y + ': de ' + JAN[y][0] + ' a ' + JAN[y][1] + ', dia grande no último; deu ' + JSON.stringify(j));
      ok(dowc(JAN[y][0]) === 6 && dowc(JAN[y][1]) === 2, 'Carnaval ' + y + ': de sábado a terça-feira');
    });
    let abMal = 0, grMal = 0, idMal = 0;
    for (let y = 2026; y <= 2035; y++) {
      const dias = (y % 4 === 0) ? 366 : 365;
      for (let k = 0; k < dias; k++) {
        const d = fmtc(Date.UTC(y, 0, 1) + k * 86400000);
        const dentro = d >= JAN[y][0] && d <= JAN[y][1];
        if (g.ev('festaAbertaNoDia(CARNAVAL, ' + JSON.stringify(d) + ')') !== dentro) abMal++;
        if (g.ev('festaDiaGrandeNoDia(CARNAVAL, ' + JSON.stringify(d) + ')') !== (d === JAN[y][1])) grMal++;
        if ((g.ev('(festaAtivaPelaDataReal(' + JSON.stringify(d) + ') || {}).id || null') === 'carnaval') !== dentro) idMal++;
      }
    }
    ok(abMal === 0 && grMal === 0 && idMal === 0, 'Carnaval: só abre dentro da janela e o dia grande é só a terça-feira, em todos os dias de 2026 a 2035 (' + abMal + '/' + grMal + '/' + idMal + ' erros)');
    const ab = function (d) { return g.ev('festaAbertaNoDia(CARNAVAL, ' + JSON.stringify(d) + ')'); };
    ok(ab('2026-02-13') === false && ab('2026-02-14') === true && ab('2026-02-17') === true && ab('2026-02-18') === false, '2026: abre a 14/02 e fecha a 17/02');
    ok(ab('2027-02-05') === false && ab('2027-02-06') === true && ab('2027-02-09') === true && ab('2027-02-10') === false, '2027: abre a 06/02 e fecha a 09/02');
    ok(ab('2028-02-25') === false && ab('2028-02-26') === true && ab('2028-02-28') === true && ab('2028-02-29') === true && ab('2028-03-01') === false && g.ev("festaDiaGrandeNoDia(CARNAVAL, '2028-02-29')") === true && g.ev("festaDiaGrandeNoDia(CARNAVAL, '2028-02-28')") === false, '2028 (bissexto): abre a 26/02, o dia grande é 29/02, fecha a 01/03');
    ok(ab('2029-02-09') === false && ab('2029-02-10') === true && ab('2029-02-13') === true && ab('2029-02-14') === false, '2029: abre a 10/02 e fecha a 13/02');
    ok(ab('2030-02-28') === false && ab('2030-03-01') === false && ab('2030-03-02') === true && ab('2030-03-05') === true && ab('2030-03-06') === false, '2030: abre a 02/03 e fecha a 05/03 (viragem de fevereiro para março)');
    ok(ab('2033-02-28') === true && ab('2033-03-01') === true && g.ev("festaDiaGrandeNoDia(CARNAVAL, '2033-03-01')") === true, '2033: a janela passa de fevereiro para março sem partir (26/02 a 01/03)');
    ok(['2026-12-31', '2027-01-01', '2026-11-11', '2026-12-25', '2026-04-05', '2027-03-28'].every(function (d) { return ab(d) === false; }), 'Carnaval: fechado na viragem de ano, no São Martinho, no Natal e na Páscoa');
    // pelo dia de Lisboa de hoje (o aparelho está adiantado)
    const dl = function (iso) { return abrir(Date.parse(iso)); };
    ok(dl('2026-02-13T23:30:00Z').ev('new Date().getDate()') === 14 && dl('2026-02-13T23:30:00Z').ev('festaAtivaPelaDataReal()') === null, '13/02 às 23:30 em Lisboa (o aparelho já está a 14): fechado');
    ok(dl('2026-02-14T00:30:00Z').ev('festaAtual().id') === 'carnaval' && dl('2026-02-14T00:30:00Z').ev('estaNoDiaGrandeFesta(festaAtual())') === false, '14/02 às 00:30 em Lisboa: aberto, ainda sem dia grande');
    ok(dl('2026-02-17T12:00:00Z').ev('estaNoDiaGrandeFesta(festaAtual())') === true, '17/02/2026: dia grande');
    ok(dl('2026-02-17T23:30:00Z').ev('festaAtual().id') === 'carnaval' && dl('2026-02-18T00:30:00Z').ev('festaAtivaPelaDataReal()') === null, '17/02 às 23:30 ainda aberto; 18/02 às 00:30 em Lisboa fechado');
    // atalhos ?festa=carnaval e ?festa=carnaval&dia=N (usa o ano de hoje)
    const a1 = abrir(lis(6, 1), '?festa=carnaval');
    ok(a1.ev('festaAtual().id') === 'carnaval' && a1.ev('estaNoDiaGrandeFesta(festaAtual())') === false, '?festa=carnaval força a festa, sem dia grande');
    const a2 = abrir(lis(6, 1), '?festa=carnaval&dia=17');
    ok(a2.ev('estaNoDiaGrandeFesta(festaAtual())') === true, '?festa=carnaval&dia=17 em 2026: dia grande');
    const a3 = abrir(lis(6, 1), '?festa=carnaval&dia=16');
    ok(a3.ev('estaNoDiaGrandeFesta(festaAtual())') === false, '?festa=carnaval&dia=16 em 2026: não é o dia grande');
    const a4 = abrir(Date.parse('2027-06-01T12:00:00Z'), '?festa=carnaval&dia=9');
    ok(a4.ev('estaNoDiaGrandeFesta(festaAtual())') === true, '?festa=carnaval&dia=9 em 2027: o atalho usa o ano de hoje (terça é 09/02)');

    // textos: as mesmas chaves do Natal, em PT, EN e ES, sem restos de outras festas
    const TXT = g.json('FESTAS_STRINGS');
    const norm = function (k) { return k.replace(/consoada|corso/i, 'T1').replace(/doces|fantasias/i, 'T2').replace(/boloRei|quemEstaMascarado/i, 'T3'); };
    const chavesNatal = Object.keys(TXT.natal.pt).map(norm).sort().join();
    ['pt', 'en', 'es'].forEach(function (l) {
      const S = TXT.carnaval && TXT.carnaval[l];
      ok(!!S, 'Carnaval: faltam textos em ' + l);
      if (!S) return;
      ok(Object.keys(S).map(norm).sort().join() === chavesNatal, 'Carnaval ' + l + ': as mesmas chaves de texto do Natal');
      Object.keys(S).forEach(function (k) { if (k.indexOf('Cenas') === -1) ok(typeof S[k] === 'string' && S[k].trim() !== '', 'Carnaval ' + l + ': falta o texto ' + k); });
      cv.tarefas.forEach(function (tf) { ok(typeof S[tf.btn] === 'string' && S[tf.btn] !== '', 'Carnaval ' + l + ': falta o botão ' + tf.btn); });
      const cenas = S.quemEstaMascaradoCenas;
      ok(Array.isArray(cenas) && cenas.length === 3, 'Carnaval ' + l + ': 3 cenas');
      (cenas || []).forEach(function (c, i) {
        ok(typeof c.situacao === 'string' && c.situacao !== '' && c.opcoes.length === 3 && new Set(c.opcoes).size === 3 && c.opcoes.every(function (o) { return typeof o === 'string' && o !== ''; }), 'Carnaval ' + l + ': cena ' + (i + 1) + ' completa, com 3 opções diferentes');
        ok(c.correta === TXT.carnaval.pt.quemEstaMascaradoCenas[i].correta && c.correta >= 0 && c.correta <= 2, 'Carnaval ' + l + ': cena ' + (i + 1) + ' com a mesma opção certa em PT/EN/ES');
      });
      const junto = JSON.stringify(S).replace(/"correta":\d/g, '').replace(/Fygmo2/g, 'Fygmo');
      ok(!/[0-9]/.test(junto) && junto.indexOf('undefined') === -1, 'Carnaval ' + l + ': textos sem números nem datas');
      ok(!/natal|christmas|navidad|bolo-rei|consoada|rabanada|filh[óo]s|martinho|martin|castanha|chestnut|casta[ñn]a|jeropiga|entrudo/i.test(junto), 'Carnaval ' + l + ': sem restos do Natal nem do São Martinho (e sem "Entrudo")');
    });
    ok(JSON.stringify(TXT.carnaval.pt.quemEstaMascaradoCenas.map(function (c) { return c.correta; })) === '[1,2,0]', 'Carnaval: a opção certa é a 2.ª, a 3.ª e a 1.ª');
    ok(/corso/i.test(JSON.stringify(TXT.carnaval.pt)) && /máscara/i.test(JSON.stringify(TXT.carnaval.pt)) && /fantasias/i.test(JSON.stringify(TXT.carnaval.pt)) && /confetes/i.test(JSON.stringify(TXT.carnaval.pt)), 'PT: fala do corso, das máscaras, das fantasias e dos confetes');
    ok(!/\b(você|vocês|fixe|bué)\b/i.test(JSON.stringify(TXT.carnaval.pt)), 'PT de Portugal: sem "você" nem brasileirismos óbvios');
    ok(!/carnaval|carnival/i.test(JSON.stringify(TXT.natal)) && !/carnaval|carnival/i.test(JSON.stringify(TXT.saomartinho)), 'os textos do Natal e do São Martinho não mencionam o Carnaval');
  }

  // ---------------- H. Páscoa ----------------
  {
    const g = abrir(lis(4, 3));
    const PASC = { 2026: '2026-04-05', 2027: '2027-03-28', 2028: '2028-04-16', 2029: '2029-04-01', 2030: '2030-04-21', 2031: '2031-04-13', 2032: '2032-03-28', 2033: '2033-04-17', 2034: '2034-04-09', 2035: '2035-03-25' };
    const fmtp = function (t) { const d = new Date(t); return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0'); };
    const dowp = function (d) { return new Date(Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8, 10)))).getUTCDay(); };
    const dimp = function (f) { // largura e altura de um JPEG (marcador SOF)
      const b = fs.readFileSync(f); let i = 2;
      while (i < b.length) { if (b[i] !== 0xFF) { i++; continue; } const m = b[i + 1]; if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)]; i += 2 + b.readUInt16BE(i + 2); }
      return null;
    };
    const pa = g.json("FESTAS_CONFIG.filter(function (f) { return f.id === 'pascoa'; })[0]");
    const ca = g.json("FESTAS_CONFIG.filter(function (f) { return f.id === 'carnaval'; })[0]");
    ok(!!pa, 'Páscoa: existe em FESTAS_CONFIG');
    ok(g.json('FESTAS_CONFIG.map(function (x) { return x.id; })').indexOf('pascoa') === 3, 'Páscoa: vem depois do Carnaval (4.ª festa)');
    if (pa) {
      ok(JSON.stringify(pa.movel) === '{"base":"pascoa","inicioDias":-2,"fimDias":0,"diaGrandeDias":0}', 'Páscoa: data móvel (Páscoa -2 a 0, dia grande 0)');
      ok(pa.inicio === undefined && pa.fim === undefined && pa.diaGrande === undefined, 'Páscoa: sem datas fixas (só a data móvel)');
      ok(pa.recompensas.multiplicadorDiaGrande === 2 && pa.entradaEnciclopedia === undefined, 'Páscoa: dia grande a dobrar e nenhuma entrada da Enciclopédia');
      ok(JSON.stringify(pa.tarefas.map(function (x) { return x.id; })) === '["folar","amendoas","ovos"]' && pa.tarefas.every(function (x) { return x.onde === 'festa'; }), 'Páscoa: folar, amendoas e ovos, todas no ecrã da festa');
      ok(pa.tarefas.map(function (x) { return x.regra; }).join() === 'oferta,gastar_gotas,cena_do_dia', 'Páscoa: regras do Natal e do Carnaval (oferta, gastar_gotas, cena_do_dia), nenhuma nova');
      ok(JSON.stringify(pa.tarefas[0].premio) === '{"reputacao":5}' && JSON.stringify(pa.tarefas[1].premio) === '{"custoGotas":30,"reputacao":12}' && JSON.stringify(pa.tarefas[2].premio) === '{"reputacao":6}', 'Páscoa: folar +5 (sem custo), amêndoas 30 Gotas e +12, ovos +6');
      ok(JSON.stringify(pa.tarefas).indexOf('uvas') === -1 && JSON.stringify(pa.tarefas).indexOf('Uvas') === -1, 'Páscoa: nenhuma tarefa tem custo nem prémio em Uvas');
      ok(ca.tarefas.map(function (x) { return [x.regra, JSON.stringify(x.premio)].join(); }).join('|') === pa.tarefas.map(function (x) { return [x.regra, JSON.stringify(x.premio)].join(); }).join('|'), 'Páscoa: as mesmas regras e valores do Carnaval');
      ok(pa.imagens.faixa === 'assets/ecras/pascoa_festa.jpg' && pa.imagens.diaGrande === 'assets/ecras/pascoa_dia_grande.jpg' && pa.imagens.folar === pa.imagens.faixa && pa.imagens.amendoas === pa.imagens.faixa && pa.imagens.ovos === pa.imagens.faixa, 'Páscoa: uma imagem para a faixa e as tarefas e outra para o dia grande');
      Object.keys(pa.imagens).forEach(function (k) {
        const f = path.join(RAIZ, pa.imagens[k]);
        ok(fs.existsSync(f), 'Páscoa: a imagem ' + k + ' existe (' + pa.imagens[k] + ')');
        if (fs.existsSync(f)) {
          ok(fs.statSync(f).size <= LIMITE_IMAGEM, 'Páscoa: ' + pa.imagens[k] + ' pesa no máximo 250 KB (pesa ' + fs.statSync(f).size + ' bytes)');
          ok(JSON.stringify(dimp(f)) === '[714,1280]', 'Páscoa: ' + pa.imagens[k] + ' tem 714x1280');
        }
      });
      ok(fs.statSync(path.join(RAIZ, pa.imagens.diaGrande)).size <= 240 * 1024, 'Páscoa: a imagem do dia grande pesa no máximo 240 KB');
      const o1 = path.join(RAIZ, 'imagens_JOGO_TELEGRAM', 'pascoa_festa.jpg'), o2 = path.join(RAIZ, 'imagens_JOGO_TELEGRAM', 'pascoa_dia_grande.jpg');
      ok(fs.existsSync(o1) && fs.existsSync(o2) && JSON.stringify(dimp(o1)) === '[768,1376]' && JSON.stringify(dimp(o2)) === '[800,1305]', 'Páscoa: os originais estão em imagens_JOGO_TELEGRAM (768x1376 e 800x1305)');
      ok(!fs.existsSync(path.join(RAIZ, 'pascoa_festa.jpg')) && !fs.existsSync(path.join(RAIZ, 'pascoa_dia_grande.jpg')), 'Páscoa: a raiz já não tem os dois originais');
      ['pascoa_festa.jpg', 'pascoa_dia_grande.jpg'].forEach(function (f) {
        const linha = CREDITOS.split('\n').filter(function (l) { return l.indexOf('assets/ecras/' + f) !== -1; })[0];
        ok(!!linha && linha.indexOf('origem a confirmar pelo Nuno') !== -1, 'CREDITOS.md devia listar ' + f + ' com "origem a confirmar pelo Nuno"');
      });
    }

    // janelas de 2026 a 2035: Sexta-feira Santa a Domingo de Páscoa, dia grande no domingo
    const JP = {}; Object.keys(PASC).forEach(function (y) { const t = Date.UTC(Number(y), Number(PASC[y].slice(5, 7)) - 1, Number(PASC[y].slice(8, 10))); JP[y] = [fmtp(t - 2 * 86400000), PASC[y]]; });
    g.ev("var PASCOA_F = FESTAS_CONFIG.filter(function (f) { return f.id === 'pascoa'; })[0];");
    Object.keys(JP).forEach(function (y) {
      const j = g.json('festaJanela(PASCOA_F, ' + y + ')');
      ok(j && j.inicio === JP[y][0] && j.fim === JP[y][1] && j.diaGrande === JP[y][1], 'Páscoa ' + y + ': de ' + JP[y][0] + ' a ' + JP[y][1] + ', dia grande no último; deu ' + JSON.stringify(j));
      ok(dowp(JP[y][0]) === 5 && dowp(JP[y][1]) === 0, 'Páscoa ' + y + ': de sexta-feira a domingo');
    });
    let abP = 0, grP = 0, idP = 0;
    for (let y = 2026; y <= 2035; y++) {
      const dias = (y % 4 === 0) ? 366 : 365;
      for (let k = 0; k < dias; k++) {
        const d = fmtp(Date.UTC(y, 0, 1) + k * 86400000);
        const dentro = d >= JP[y][0] && d <= JP[y][1];
        if (g.ev('festaAbertaNoDia(PASCOA_F, ' + JSON.stringify(d) + ')') !== dentro) abP++;
        if (g.ev('festaDiaGrandeNoDia(PASCOA_F, ' + JSON.stringify(d) + ')') !== (d === JP[y][1])) grP++;
        if ((g.ev('(festaAtivaPelaDataReal(' + JSON.stringify(d) + ') || {}).id || null') === 'pascoa') !== dentro) idP++;
      }
    }
    ok(abP === 0 && grP === 0 && idP === 0, 'Páscoa: só abre dentro da janela e o dia grande é só o domingo, em todos os dias de 2026 a 2035 (' + abP + '/' + grP + '/' + idP + ' erros)');
    const abP2 = function (d) { return g.ev('festaAbertaNoDia(PASCOA_F, ' + JSON.stringify(d) + ')'); };
    ok(abP2('2026-04-02') === false && abP2('2026-04-03') === true && abP2('2026-04-05') === true && abP2('2026-04-06') === false, '2026: abre a 03/04 (sexta) e fecha a 05/04 (domingo)');
    ok(abP2('2027-03-25') === false && abP2('2027-03-26') === true && abP2('2027-03-28') === true && abP2('2027-03-29') === false, '2027: abre a 26/03 e fecha a 28/03');
    ok(abP2('2028-04-13') === false && abP2('2028-04-14') === true && abP2('2028-04-16') === true && abP2('2028-04-17') === false && g.ev("festaDiaGrandeNoDia(PASCOA_F, '2028-04-16')") === true && g.ev("festaDiaGrandeNoDia(PASCOA_F, '2028-04-15')") === false, '2028 (bissexto): abre a 14/04, o dia grande é 16/04, fecha a 16/04');
    ok(abP2('2029-03-29') === false && abP2('2029-03-30') === true && abP2('2029-03-31') === true && abP2('2029-04-01') === true && abP2('2029-04-02') === false, '2029: a janela passa de março para abril sem partir (30/03 a 01/04)');
    ok(['2026-12-31', '2027-01-01', '2026-11-11', '2026-12-25', '2026-02-17', '2027-02-09'].every(function (d) { return abP2(d) === false; }), 'Páscoa: fechada na viragem de ano, no São Martinho, no Natal e no Carnaval');
    const dlp = function (iso) { return abrir(Date.parse(iso)); };
    ok(dlp('2026-04-02T22:30:00Z').ev('festaAtivaPelaDataReal()') === null && dlp('2026-04-02T23:30:00Z').ev('festaAtual().id') === 'pascoa' && dlp('2026-04-02T23:30:00Z').ev('estaNoDiaGrandeFesta(festaAtual())') === false, '02/04 às 23:30 UTC (03/04 00:30 em Lisboa, hora de verão): aberta, ainda sem dia grande');
    ok(dlp('2026-04-05T12:00:00Z').ev('estaNoDiaGrandeFesta(festaAtual())') === true, '05/04/2026: dia grande');
    ok(dlp('2026-04-05T22:30:00Z').ev('festaAtual().id') === 'pascoa' && dlp('2026-04-05T23:30:00Z').ev('festaAtivaPelaDataReal()') === null, '05/04 às 23:30 em Lisboa ainda aberta; 06/04 às 00:30 em Lisboa fechada');
    const pa1 = abrir(lis(6, 1), '?festa=pascoa');
    ok(pa1.ev('festaAtual().id') === 'pascoa' && pa1.ev('estaNoDiaGrandeFesta(festaAtual())') === false, '?festa=pascoa força a festa, sem dia grande');
    ok(abrir(lis(6, 1), '?festa=pascoa&dia=5').ev('estaNoDiaGrandeFesta(festaAtual())') === true, '?festa=pascoa&dia=5 em 2026: dia grande (o domingo de Páscoa é 05/04)');
    ok(abrir(lis(6, 1), '?festa=pascoa&dia=4').ev('estaNoDiaGrandeFesta(festaAtual())') === false, '?festa=pascoa&dia=4 em 2026: não é o dia grande');
    ok(abrir(Date.parse('2027-06-01T12:00:00Z'), '?festa=pascoa&dia=28').ev('estaNoDiaGrandeFesta(festaAtual())') === true, '?festa=pascoa&dia=28 em 2027: o atalho usa o ano de hoje (domingo de Páscoa é 28/03)');

    // regras puras e valores (as mesmas do Carnaval)
    g.ev("var TP = function (id) { return festaTarefa(PASCOA_F, id); };");
    const E = '{ gotas: 100, uvas: 7, reputacao: 372, festas: { tarefasDia: {} } }';
    const res = function (id, op, estado) { return g.json('(function () { var e = ' + (estado || E) + '; var x = festaResolverTarefa(e, PASCOA_F, TP(' + JSON.stringify(id) + '), "2026-04-03", ' + JSON.stringify(op || {}) + '); return { x: x, e: e }; })()'); };
    let o = res('folar');
    ok(o.x.ok && o.x.rep === 5 && o.e.reputacao === 377 && o.e.gotas === 100 && o.e.uvas === 7 && o.e.festas.tarefasDia.pascoa_folar === '2026-04-03', 'folar: +5, sem custo (nem Gotas nem Uvas), marca o dia');
    o = res('folar', { diaGrande: true });
    ok(o.x.rep === 10 && o.e.reputacao === 382, 'folar no dia grande: +10');
    o = res('amendoas');
    ok(o.x.ok && o.x.gotasGastas === 30 && o.x.rep === 12 && o.e.gotas === 70 && o.e.uvas === 7 && o.e.reputacao === 384, 'amêndoas: gastam 30 Gotas (nunca Uvas) e dão +12');
    o = res('amendoas', { diaGrande: true });
    ok(o.x.rep === 24 && o.e.gotas === 70 && o.e.reputacao === 396, 'amêndoas no dia grande: +24 e continuam a gastar só 30 Gotas');
    o = res('amendoas', {}, '{ gotas: 29, uvas: 7, reputacao: 372, festas: { tarefasDia: {} } }');
    ok(!o.x.ok && o.x.motivo === 'faltam_gotas' && o.e.gotas === 29 && o.e.reputacao === 372 && !o.e.festas.tarefasDia.pascoa_amendoas, 'amêndoas com 29 Gotas: não gasta, não paga e não marca o dia');
    o = res('ovos', { venceu: true });
    ok(o.x.ok && o.x.venceu && o.x.rep === 6 && o.e.reputacao === 378 && o.e.gotas === 100 && o.e.uvas === 7, 'ovos acertados: +6, sem custo');
    o = res('ovos', { venceu: true, diaGrande: true });
    ok(o.x.rep === 12 && o.e.reputacao === 384, 'ovos acertados no dia grande: +12');
    o = res('ovos', { venceu: false });
    ok(o.x.ok && !o.x.venceu && o.x.rep === 0 && o.e.reputacao === 372 && o.e.gotas === 100 && o.e.uvas === 7 && o.e.festas.tarefasDia.pascoa_ovos === '2026-04-03', 'ovos falhados: não custa nada e gasta a tentativa do dia');
    o = res('ovos', {});
    ok(!o.x.ok && o.x.motivo === 'resultado_invalido' && !o.e.festas.tarefasDia.pascoa_ovos, 'ovos sem resultado: recusa e não marca o dia');
    o = res('folar', {}, '{ gotas: 100, uvas: 7, reputacao: 372, festas: { tarefasDia: { pascoa_folar: "2026-04-03" } } }');
    ok(!o.x.ok && o.x.motivo === 'ja_hoje' && o.e.reputacao === 372, 'folar já feito hoje: recusa');
    g.ev('state.festas.tarefasDia = {};');
    ok(g.ev('festaTemTarefaPorFazerHoje(PASCOA_F)') === true && g.ev("festaTemTarefaPorFazerHoje(FESTAS_CONFIG.filter(function (f) { return f.id === 'carnaval'; })[0])") === true, 'objetivo do dia: com nada feito há tarefa por fazer (Páscoa e Carnaval)');
    g.ev("festaRegistarFez(state, 'pascoa', 'folar', diaLisboaDeHoje()); festaRegistarFez(state, 'pascoa', 'amendoas', diaLisboaDeHoje()); festaRegistarFez(state, 'pascoa', 'ovos', diaLisboaDeHoje());");
    ok(g.ev('festaTemTarefaPorFazerHoje(PASCOA_F)') === false && g.ev("festaTemTarefaPorFazerHoje(FESTAS_CONFIG.filter(function (f) { return f.id === 'carnaval'; })[0])") === true, 'objetivo do dia: com as 3 da Páscoa feitas já não há, e as da Páscoa não contam para o Carnaval');

    // fluxo no ecrã (como o do Carnaval): um toque, uma gravação, uma vez por dia
    const n = abrir(lis(4, 3), '?festa=pascoa');
    n.ev('state.reputacao = 372; state.gotas = 100; state.uvas = 7;');
    n.ev("iniciarTarefaFesta('amendoas')");
    ok(n.ev('state.gotas') === 70 && n.ev('state.uvas') === 7 && n.ev('state.reputacao') === 384 && n.ev('SAVES') === 1 && n.ev('FUNDO') === 'assets/ecras/pascoa_festa.jpg', 'ecrã: amêndoas gastam 30 Gotas, dão +12, uma gravação, imagem da festa');
    n.ev("iniciarTarefaFesta('amendoas')");
    ok(n.ev('state.gotas') === 70 && n.ev('state.reputacao') === 384 && n.ev('SAVES') === 1 && n.ev('festaMensagemAtual') === n.ev('FESTAS_STRINGS.pascoa.pt.amendoasJaFeitaHoje'), 'ecrã: amêndoas uma só vez por dia, com a mensagem de já feita');
    n.ev("iniciarTarefaFesta('folar')");
    ok(n.ev('state.reputacao') === 389 && n.ev('SAVES') === 2 && n.ev('state.gotas') === 70, 'ecrã: folar +5');
    n.ev('state.gotas = 10;'); n.ev('state.festas.tarefasDia.pascoa_amendoas = null;');
    n.ev("iniciarTarefaFesta('amendoas')");
    ok(n.ev('state.gotas') === 10 && n.ev('state.reputacao') === 389 && n.ev('SAVES') === 2 && n.ev('festaMensagemAtual') === n.ev('FESTAS_STRINGS.pascoa.pt.amendoasFalta'), 'ecrã: amêndoas com 10 Gotas avisam sem gastar nem gravar');
    n.ev("iniciarTarefaFesta('ovos')");
    const cenaO = n.json('festaCenaAtual.cena');
    ok(cenaO && cenaO.opcoes.length === 3, 'ecrã: os ovos mostram uma cena de 3 opções');
    n.ev('festaResponderCenaDoDia(' + ((cenaO.correta + 1) % 3) + ')');
    ok(n.ev('state.reputacao') === 389 && n.ev('state.gotas') === 10 && n.ev('SAVES') === 3 && n.ev("festaJaFezTarefaHoje('pascoa', 'ovos')") === true, 'ecrã: ovos errados não custam nada e gastam a tentativa do dia');
    n.ev('festaResponderCenaDoDia(' + cenaO.correta + ')');
    ok(n.ev('state.reputacao') === 389 && n.ev('SAVES') === 3, 'ecrã: toque duplo na mesma cena não paga nem grava outra vez');
    n.ev("iniciarTarefaFesta('ovos')");
    ok(n.ev('festaCenaAtual') === null, 'ecrã: ovos já tentados hoje não abrem outra cena');
    n.ir(lis(4, 4));
    n.ev("iniciarTarefaFesta('ovos')");
    n.ev('festaResponderCenaDoDia(festaCenaAtual.cena.correta)');
    ok(n.ev('state.reputacao') === 395 && n.ev('SAVES') === 4, 'ecrã: no dia seguinte volta, e acertar dá +6');
    ok(n.json('OBJETIVOS').length === 4 && n.json('ENTRADAS').length === 0, 'ecrã: cada tarefa conta para o objetivo do dia e a Páscoa não abre nada na Enciclopédia');
    n.ev('enterFesta()');
    ok(n.json('ENTRADAS').length === 0, 'enterFesta na Páscoa não abre a lenda de São Martinho');
    n.ev('renderFestaHub()');
    const hp = n.ev('caixa.innerHTML');
    ok(/iniciarTarefaFesta\('folar'\)/.test(hp) && /iniciarTarefaFesta\('amendoas'\)/.test(hp) && /iniciarTarefaFesta\('ovos'\)/.test(hp) && !/castanhas|jeropiga|prova|corso|fantasias|quemEstaMascarado/.test(hp), 'hub da Páscoa: os 3 botões da Páscoa e nenhum de outra festa');
    ok(n.ev('FUNDO') === 'assets/ecras/pascoa_festa.jpg', 'hub da Páscoa: imagem da festa fora do dia grande');
    const gdp = abrir(lis(4, 5), '?festa=pascoa&dia=5');
    gdp.ev('state.reputacao = 372; state.gotas = 100;');
    gdp.ev('renderFestaHub()');
    ok(gdp.ev('FUNDO') === 'assets/ecras/pascoa_dia_grande.jpg' && gdp.ev('caixa.innerHTML').indexOf(gdp.ev('FESTAS_STRINGS.pascoa.pt.diaGrandeAviso')) !== -1, 'hub da Páscoa no dia grande: imagem do dia grande e o aviso');
    gdp.ev("iniciarTarefaFesta('folar')"); gdp.ev("iniciarTarefaFesta('amendoas')"); gdp.ev("iniciarTarefaFesta('ovos')"); gdp.ev('festaResponderCenaDoDia(festaCenaAtual.cena.correta)');
    ok(gdp.ev('state.reputacao') === 372 + 10 + 24 + 12 && gdp.ev('state.gotas') === 70 && gdp.ev('SAVES') === 3, 'ecrã no dia grande: folar +10, amêndoas +24 (30 Gotas) e ovos +12, uma gravação cada');
    const sol = abrir(lis(4, 5), '?festa=pascoa&dia=5');
    sol.ev("function tempoAtual() { return { disponivel: true, ceu: 'sol' }; }; renderFestaHub();");
    ok(sol.ev('caixa.innerHTML').indexOf('undefined') === -1, 'hub da Páscoa com sol: nada de "undefined" (o verão é só do São Martinho)');

    // cenas estáveis por dia
    const cP = function (dia) { return g.ev("festaCenaDoDia('pascoa', 'ovos', " + JSON.stringify(dia) + ', 3)'); };
    const diasP = ['2026-04-03', '2026-04-04', '2026-04-05', '2027-03-26', '2027-03-27', '2027-03-28'];
    ok(diasP.every(function (d) { return cP(d) >= 0 && cP(d) <= 2 && cP(d) === cP(d); }) && new Set(diasP.map(cP)).size >= 2, 'a cena dos ovos é estável no dia e nos 6 dias de Páscoa de 2026 e 2027 não sai sempre a mesma');

    // textos: as mesmas chaves do Natal (com os nomes das tarefas trocados), em PT, EN e ES
    const TXT = g.json('FESTAS_STRINGS');
    const norm = function (k) { return k.replace(/consoada|folar/i, 'T1').replace(/doces|amendoas/i, 'T2').replace(/boloRei|ovos/i, 'T3'); };
    const chavesNatal = Object.keys(TXT.natal.pt).map(norm).sort().join();
    ['pt', 'en', 'es'].forEach(function (l) {
      const S = TXT.pascoa && TXT.pascoa[l];
      ok(!!S, 'Páscoa: faltam textos em ' + l);
      if (!S) return;
      ok(Object.keys(S).map(norm).sort().join() === chavesNatal, 'Páscoa ' + l + ': as mesmas chaves de texto do Natal');
      Object.keys(S).forEach(function (k) { if (k.indexOf('Cenas') === -1) ok(typeof S[k] === 'string' && S[k].trim() !== '', 'Páscoa ' + l + ': falta o texto ' + k); });
      pa.tarefas.forEach(function (tf) { ok(typeof S[tf.btn] === 'string' && S[tf.btn] !== '', 'Páscoa ' + l + ': falta o botão ' + tf.btn); });
      const cenas = S.ovosCenas;
      ok(Array.isArray(cenas) && cenas.length === 3, 'Páscoa ' + l + ': 3 cenas');
      (cenas || []).forEach(function (c, i) {
        ok(typeof c.situacao === 'string' && c.situacao !== '' && c.opcoes.length === 3 && new Set(c.opcoes).size === 3 && c.opcoes.every(function (op) { return typeof op === 'string' && op !== ''; }), 'Páscoa ' + l + ': cena ' + (i + 1) + ' completa, com 3 opções diferentes');
        ok(c.correta === TXT.pascoa.pt.ovosCenas[i].correta && c.correta >= 0 && c.correta <= 2, 'Páscoa ' + l + ': cena ' + (i + 1) + ' com a mesma opção certa em PT/EN/ES');
        const len = c.opcoes.map(function (op) { return op.length; });
        ok(len[c.correta] < Math.max.apply(null, len), 'Páscoa ' + l + ': cena ' + (i + 1) + ': a opção certa NÃO é a mais comprida (' + len.join('/') + ')');
        ok(Math.max.apply(null, len) - Math.min.apply(null, len) <= 0.2 * Math.max.apply(null, len), 'Páscoa ' + l + ': cena ' + (i + 1) + ': as 3 opções têm comprimento parecido (' + len.join('/') + ')');
      });
      const junto = JSON.stringify(S).replace(/"correta":\d/g, '').replace(/Fygmo2/g, 'Fygmo');
      ok(!/[0-9]/.test(junto) && junto.indexOf('undefined') === -1, 'Páscoa ' + l + ': textos sem números nem datas');
      ok(!/natal|christmas|navidad|bolo-rei|consoada|carnaval|carnival|corso|entrudo|martinho|martin|castanha|chestnut|casta[ñn]a|jeropiga/i.test(junto), 'Páscoa ' + l + ': sem restos do Natal, do Carnaval nem do São Martinho');
    });
    ok(JSON.stringify(TXT.pascoa.pt.ovosCenas.map(function (c) { return c.correta; })) === '[1,2,0]' && new Set(TXT.pascoa.pt.ovosCenas.map(function (c) { return c.correta; })).size === 3, 'Páscoa: a opção certa é a 2.ª, a 3.ª e a 1.ª (varia entre as 3 cenas)');
    ok(/folar/i.test(JSON.stringify(TXT.pascoa.pt)) && /amêndoas/i.test(JSON.stringify(TXT.pascoa.pt)) && /ovo/i.test(JSON.stringify(TXT.pascoa.pt)), 'PT: fala do folar, das amêndoas e do ovo');
    ok(!/\b(você|vocês|fixe|bué)\b/i.test(JSON.stringify(TXT.pascoa.pt)), 'PT de Portugal: sem "você" nem brasileirismos óbvios');
    ok(!/páscoa|pascua|easter/i.test(JSON.stringify(TXT.natal)) && !/páscoa|pascua|easter/i.test(JSON.stringify(TXT.saomartinho)) && !/páscoa|pascua|easter/i.test(JSON.stringify(TXT.carnaval)), 'os textos do Natal, do São Martinho e do Carnaval não mencionam a Páscoa');
  }

  // ---------------- I. Cenas de 3 opções equilibradas (todas as festas) ----------------
  {
    const g = abrir(lis(11, 10));
    const TXT = g.json('FESTAS_STRINGS');
    const CENAS = [['saomartinho', 'castanhasCenas', 'São Martinho'], ['natal', 'boloReiCenas', 'Natal'], ['carnaval', 'quemEstaMascaradoCenas', 'Carnaval'], ['pascoa', 'ovosCenas', 'Páscoa']];
    CENAS.forEach(function (fc) {
      const festa = fc[0], chave = fc[1], nome = fc[2];
      const pt = TXT[festa] && TXT[festa].pt && TXT[festa].pt[chave];
      ok(Array.isArray(pt) && pt.length >= 3, nome + ': tem pelo menos 3 cenas de opções');
      if (!Array.isArray(pt)) return;
      ['pt', 'en', 'es'].forEach(function (l) {
        const cenas = TXT[festa][l][chave];
        ok(Array.isArray(cenas) && cenas.length === pt.length, nome + ' ' + l + ': o mesmo número de cenas que em PT');
        (cenas || []).forEach(function (c, i) {
          const quem = nome + ' ' + l + ' cena ' + (i + 1);
          ok(c.opcoes.length === 3 && new Set(c.opcoes).size === 3 && c.opcoes.every(function (o) { return typeof o === 'string' && o.trim() !== ''; }), quem + ': 3 opções diferentes e com texto');
          ok(c.correta === pt[i].correta && c.correta >= 0 && c.correta <= 2, quem + ': a mesma opção certa em PT/EN/ES');
          const len = c.opcoes.map(function (o) { return o.length; });
          ok(len[c.correta] < Math.max.apply(null, len), quem + ': a opção certa NÃO é a mais comprida (' + len.join('/') + ')');
          ok(Math.max.apply(null, len) - Math.min.apply(null, len) <= 0.2 * Math.max.apply(null, len), quem + ': as 3 opções diferem no máximo 20% (' + len.join('/') + ')');
        });
      });
      const certas = pt.map(function (c) { return c.correta; });
      ok(new Set(certas).size >= Math.min(3, pt.length), nome + ': a posição da certa varia entre as cenas (' + certas.join(',') + ')');
    });
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
  ['Cenas: no Carnaval a certa volta a ser a mais comprida (PT, cena 1)', 'festas.js', "'Reconhecer o Fygmo pelas orelhas e mandar largar os doces'", "'Reconhecer o Fygmo pelas orelhas e pedir-lhe, com bons modos, que deixe os doces em paz'"],
  ['Cenas: no Natal as opções voltam a ficar desiguais (PT, cena 2)', 'festas.js', "'Pôr o bolo em cima do armário, onde a cadeira não chega'", "'Pôr o bolo no armário'"],
  ['Cenas: no São Martinho a certa volta a ser a mais comprida (PT, cena 1)', 'festas.js', "'Tapar o assador com a tampa antes que chegue'", "'Tapar o assador com a tampa de ferro, bem apertada, antes que ele chegue'"],
  ['Cenas: no Natal a certa deixa de ser a mesma nas línguas (PT, cena 2)', 'festas.js', "'Afastar a cadeira devagar, com ele ainda lá em cima'], correta: 0", "'Afastar a cadeira devagar, com ele ainda lá em cima'], correta: 1"],
  ['Cenas: no São Martinho duas opções ficam iguais (EN, cena 4)', 'festas.js', "'Put a big net all the way around the roaster'", "'Shoo only the sparrows, they make the most noise'"],
  ['Páscoa: a janela começa na quinta-feira', 'festas.js', "movel: { base: 'pascoa', inicioDias: -2, fimDias: 0, diaGrandeDias: 0 }", "movel: { base: 'pascoa', inicioDias: -3, fimDias: 0, diaGrandeDias: 0 }"],
  ['Páscoa: o dia grande passa para sábado', 'festas.js', "movel: { base: 'pascoa', inicioDias: -2, fimDias: 0, diaGrandeDias: 0 }", "movel: { base: 'pascoa', inicioDias: -2, fimDias: 0, diaGrandeDias: -1 }"],
  ['Páscoa: o folar passa a dar +6', 'festas.js', "{ id: 'folar', onde: 'festa', regra: 'oferta', btn: 'btnFolar',\n        premio: { reputacao: 5 } }", "{ id: 'folar', onde: 'festa', regra: 'oferta', btn: 'btnFolar',\n        premio: { reputacao: 6 } }"],
  ['Páscoa: as amêndoas gastam Uvas', 'festas.js', "{ id: 'amendoas', onde: 'festa', regra: 'gastar_gotas', btn: 'btnAmendoas',\n        premio: { custoGotas: 30, reputacao: 12 } }", "{ id: 'amendoas', onde: 'festa', regra: 'gastar_gotas', btn: 'btnAmendoas',\n        premio: { custoGotas: 30, custoUvas: 5, reputacao: 12 } }"],
  ['Páscoa: a imagem do dia grande não existe', 'festas.js', "diaGrande: 'assets/ecras/pascoa_dia_grande.jpg'", "diaGrande: 'assets/ecras/pascoa_dia_grande_x.jpg'"],
  ['Páscoa: falta a tradução do aviso do dia grande em ES', 'festas.js', "diaGrandeAviso: '¡Hoy es Domingo de Pascua! Los premios cuentan el doble.',\n", ""],
  ['Páscoa: a pergunta certa passa a ser a mais comprida (PT, cena 1)', 'festas.js', "'No alto da prateleira, atrás dos tachos de cobre'", "'No alto da prateleira, atrás dos tachos de cobre da cozinha de casa'"],
  ['Páscoa: o texto da vitória fala do Carnaval', 'festas.js', "ovosVitoria: 'Ovo encontrado.", "ovosVitoria: 'Ovo encontrado, que Carnaval!"],
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
  ['Natal deixa de abrir a consoada', 'festas.js', "    entradaEnciclopedia: 'consoada',\n", ''],
  ['Natal abre a entrada errada ao entrar', 'festas.js', "    entradaEnciclopedia: 'consoada',\n", "    entradaEnciclopedia: 'boloRei',\n"],
  ['o bolo-rei deixa de abrir a sua entrada', 'festas.js', " entradaEnciclopedia: 'boloRei',", ''],
  ['o bolo-rei abre a entrada errada', 'festas.js', " entradaEnciclopedia: 'boloRei',", " entradaEnciclopedia: 'consoada',"],
  ['o bolo-rei só abre a entrada se acertar', 'festas.js', 'const novaEntrada = tarefa.entradaEnciclopedia ? ', 'const novaEntrada = (tarefa.entradaEnciclopedia && r.venceu) ? '],
  ['o bolo-rei não mostra o aviso de entrada nova', 'festas.js', 'if (novaEntrada) mostrarNovaEntrada(novaEntrada);', ''],
  ['toda a cena do dia abre a entrada do bolo-rei', 'festas.js', 'const novaEntrada = tarefa.entradaEnciclopedia ? desbloquearEntradaEnciclopedia(tarefa.entradaEnciclopedia) : null;', "const novaEntrada = desbloquearEntradaEnciclopedia('boloRei');"],
  ['o bolo-rei abre a entrada ao abrir a cena', 'festas.js', "  festaCenaAtual = { festa: festa, tarefa: tarefa, cena: cena };\n", "  festaCenaAtual = { festa: festa, tarefa: tarefa, cena: cena };\n  desbloquearEntradaEnciclopedia('boloRei');\n"],
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
  ['Páscoa: constante do algoritmo errada (451 passa a 452: erra em 5 anos de 1583 a 4099)', 'festas.js', 'const m = Math.floor((a + 11 * h + 22 * l) / 451);', 'const m = Math.floor((a + 11 * h + 22 * l) / 452);'],
  ['Páscoa: sem a correção do século', 'festas.js', 'const h = (19 * a + b - d - g + 15) % 30;', 'const h = (19 * a + 15) % 30;'],
  ['Páscoa: dia errado por 1', 'festas.js', 'const dia = ((h + l - 7 * m + 114) % 31) + 1;', 'const dia = ((h + l - 7 * m + 114) % 31) + 2;'],
  ['Páscoa: mês errado', 'festas.js', 'const mes = Math.floor((h + l - 7 * m + 114) / 31);', 'const mes = Math.floor((h + l - 7 * m + 114) / 31) + 1;'],
  ['Páscoa: aceita anos antes do calendário gregoriano', 'festas.js', 'ano < 1583 || ano > 9999', 'ano < 1000 || ano > 9999'],
  ['somar dias em hora local (a mudança de hora estraga)', 'festas.js', 'const r = new Date(Date.UTC(p.ano, p.mes, p.dia) + n * 86400000);\n  return festaFormatarDia(r.getUTCFullYear(), r.getUTCMonth() + 1, r.getUTCDate());', 'const r = new Date(new Date(p.ano, p.mes, p.dia).getTime() + n * 86400000);\n  return festaFormatarDia(r.getFullYear(), r.getMonth() + 1, r.getDate());'],
  ['somar dias com o mês errado (mês 0 a 11 sem +1)', 'festas.js', 'r.getUTCMonth() + 1, r.getUTCDate());', 'r.getUTCMonth(), r.getUTCDate());'],
  ['somar dias não valida o dia', 'festas.js', 'if (p === null || !Number.isInteger(n)) return null;', 'if (!Number.isInteger(n)) return null;'],
  ['somar dias aceita n decimal', 'festas.js', 'if (p === null || !Number.isInteger(n)) return null;', 'if (p === null || typeof n !== \'number\') return null;'],
  ['dia formatado sem zeros à esquerda', 'festas.js', "String(dia).padStart(2, '0');\n}", "String(dia);\n}"],
  ['janela móvel: início usa o fim', 'festas.js', 'inicio: diaSomarDias(pascoa, m.inicioDias)', 'inicio: diaSomarDias(pascoa, m.fimDias)'],
  ['janela móvel: dia grande usa o início', 'festas.js', 'diaGrande: diaSomarDias(pascoa, m.diaGrandeDias)', 'diaGrande: diaSomarDias(pascoa, m.inicioDias)'],
  ['janela móvel: fim menos um dia', 'festas.js', 'fim: diaSomarDias(pascoa, m.fimDias),', 'fim: diaSomarDias(pascoa, m.fimDias - 1),'],
  ['janela móvel: base desconhecida aceite', 'festas.js', "if (m.base !== 'pascoa') return null;", ''],
  ['janela móvel: sempre a Páscoa de 2026', 'festas.js', 'const pascoa = pascoaDoAno(ano);', 'const pascoa = pascoaDoAno(2026);'],
  ['janela fixa: mês sem +1 (janeiro = 0)', 'festas.js', 'festaFormatarDia(ano, o.mes + 1, o.dia)', 'festaFormatarDia(ano, o.mes, o.dia)'],
  ['janela fixa: datas que não existem aceites', 'festas.js', "if (diaLisboaPartes(j[k]) === null) j[k] = null;", ''],
  ['festa aberta: fim exclusivo', 'festas.js', 'return j !== null && dia >= j.inicio && dia <= j.fim;', 'return j !== null && dia >= j.inicio && dia < j.fim;'],
  ['festa aberta: início exclusivo', 'festas.js', 'return j !== null && dia >= j.inicio && dia <= j.fim;', 'return j !== null && dia > j.inicio && dia <= j.fim;'],
  ['festa aberta: dia inválido aceite', 'festas.js', 'if (p === null) return false;\n  const j = festaJanela(festa, p.ano);\n  return j !== null && dia >= j.inicio', 'const j = festaJanela(festa, p ? p.ano : 2026);\n  return j !== null && dia >= j.inicio'],
  ['dia grande: qualquer dia da janela', 'festas.js', 'return j !== null && dia === j.diaGrande;', 'return j !== null && dia >= j.inicio && dia <= j.fim;'],
  ['festa aberta pelo ano errado', 'festas.js', 'const j = festaJanela(festa, p.ano);\n  return j !== null && dia >= j.inicio', 'const j = festaJanela(festa, p.ano + 1);\n  return j !== null && dia >= j.inicio'],
  ['hoje pelo dia do aparelho (festaDiaDeHoje)', 'festas.js', 'function festaDiaDeHoje() {\n  return diaLisboaDeHoje();', "function festaDiaDeHoje() {\n  return (function () { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })();"],
  ['festaAtivaPelaDataReal ignora o dia que recebe', 'festas.js', 'const d = dia === undefined ? festaDiaDeHoje() : dia;', 'const d = festaDiaDeHoje();'],
  ['festaAtual ignora o dia que recebe', 'festas.js', 'return festaForcadaNoEndereco() || festaAtivaPelaDataReal(dia);', 'return festaForcadaNoEndereco() || festaAtivaPelaDataReal();'],
  ['estaNoDiaGrandeFesta ignora o dia que recebe', 'festas.js', 'const hoje = dia === undefined ? festaDiaDeHoje() : dia;\n  if (festaForcadaNoEndereco()) {', 'const hoje = festaDiaDeHoje();\n  if (festaForcadaNoEndereco()) {'],
  ['atalho ?dia= compara com o dia errado', 'festas.js', 'diaForcado === grande.dia;', 'diaForcado === grande.dia + 1;'],
  ['atalho ?festa= sem ?dia= dá dia grande', 'festas.js', 'return diaForcado !== null && grande !== null && diaForcado === grande.dia;', 'return grande !== null && (diaForcado === null || diaForcado === grande.dia);'],
  ['festaDiaGrandeNoDia usa o mês só', 'festas.js', 'return j !== null && dia === j.diaGrande;', 'return j !== null && dia.slice(5, 7) === j.diaGrande.slice(5, 7);'],
  ['Natal passa a abrir a 19', 'festas.js', 'inicio: { mes: 11, dia: 20 }', 'inicio: { mes: 11, dia: 19 }'],
  ['São Martinho fecha a 15', 'festas.js', 'fim: { mes: 10, dia: 14 }', 'fim: { mes: 10, dia: 15 }'],
  ['São Martinho com dia grande a 12', 'festas.js', 'diaGrande: { mes: 10, dia: 11 }', 'diaGrande: { mes: 10, dia: 12 }'],
  ['Páscoa acrescentada ao jogo', 'festas.js', "  {\n    id: 'natal',", "  { id: 'pascoa', movel: { base: 'pascoa', inicioDias: -2, fimDias: 1, diaGrandeDias: 0 }, tarefas: [], recompensas: { multiplicadorDiaGrande: 2 } },\n  {\n    id: 'natal',"],
  ['Carnaval começa um dia depois', 'festas.js', 'movel: { base: \'pascoa\', inicioDias: -50,', 'movel: { base: \'pascoa\', inicioDias: -49,'],
  ['Carnaval acaba um dia antes', 'festas.js', 'fimDias: -47, diaGrandeDias: -47 },\n    imagens', 'fimDias: -48, diaGrandeDias: -47 },\n    imagens'],
  ['dia grande do Carnaval no sábado', 'festas.js', 'fimDias: -47, diaGrandeDias: -47 },\n    imagens', 'fimDias: -47, diaGrandeDias: -50 },\n    imagens'],
  ['Carnaval com a base errada', 'festas.js', "movel: { base: 'pascoa', inicioDias: -50", "movel: { base: 'natal', inicioDias: -50"],
  ['Carnaval com datas fixas em vez da móvel', 'festas.js', "    movel: { base: 'pascoa', inicioDias: -50, fimDias: -47, diaGrandeDias: -47 },\n    imagens", "    movel: { base: 'pascoa', inicioDias: -50, fimDias: -47, diaGrandeDias: -47 }, inicio: { mes: 1, dia: 14 }, fim: { mes: 1, dia: 17 }, diaGrande: { mes: 1, dia: 17 },\n    imagens"],
  ['corso passa a custar Gotas', 'festas.js', "regra: 'oferta', btn: 'btnCorso'", "regra: 'gastar_gotas', btn: 'btnCorso'"],
  ['corso paga 6', 'festas.js', "btn: 'btnCorso',\n        premio: { reputacao: 5 }", "btn: 'btnCorso',\n        premio: { reputacao: 6 }"],
  ['fantasias custam 40 Gotas', 'festas.js', "btn: 'btnFantasias',\n        premio: { custoGotas: 30,", "btn: 'btnFantasias',\n        premio: { custoGotas: 40,"],
  ['fantasias pagam 13', 'festas.js', "btn: 'btnFantasias',\n        premio: { custoGotas: 30, reputacao: 12 }", "btn: 'btnFantasias',\n        premio: { custoGotas: 30, reputacao: 13 }"],
  ['quem está mascarado paga 7', 'festas.js', "entradaEnciclopedia: 'caretos',\n        premio: { reputacao: 6 }", "entradaEnciclopedia: 'caretos',\n        premio: { reputacao: 7 }"],
  ['quem está mascarado deixa de ser a cena do dia', 'festas.js', "regra: 'cena_do_dia', btn: 'btnQuemEstaMascarado'", "regra: 'oferta', btn: 'btnQuemEstaMascarado'"],
  ['tarefa do Carnaval fora do ecrã da festa', 'festas.js', "{ id: 'corso', onde: 'festa'", "{ id: 'corso', onde: 'outro'"],
  ['Carnaval abre a lenda de São Martinho', 'festas.js', "    entradaEnciclopedia: 'entrudo',\n", "    entradaEnciclopedia: 'lendaSaoMartinho',\n"],
  ['Carnaval deixa de abrir o entrudo', 'festas.js', "    entradaEnciclopedia: 'entrudo',\n", ''],
  ['Carnaval abre a entrada errada ao entrar', 'festas.js', "    entradaEnciclopedia: 'entrudo',\n", "    entradaEnciclopedia: 'caretos',\n"],
  ['os caretos deixam de abrir', 'festas.js', " entradaEnciclopedia: 'caretos',", ''],
  ['os caretos abrem a entrada errada', 'festas.js', " entradaEnciclopedia: 'caretos',", " entradaEnciclopedia: 'entrudo',"],
  ['a Páscoa passa a abrir uma entrada', 'festas.js', "    id: 'pascoa',\n", "    id: 'pascoa',\n    entradaEnciclopedia: 'entrudo',\n"],
  ['o corso passa a abrir uma entrada', 'festas.js', "{ id: 'corso', onde: 'festa', regra: 'oferta', btn: 'btnCorso',", "{ id: 'corso', onde: 'festa', regra: 'oferta', btn: 'btnCorso', entradaEnciclopedia: 'caretos',"],
  ['Carnaval sem dia grande a dobrar', 'festas.js', "recompensas: {\n      multiplicadorDiaGrande: 2\n    }\n  }\n];", "recompensas: {\n      multiplicadorDiaGrande: 1\n    }\n  }\n];"],
  ['imagem do dia grande do Carnaval = a da festa', 'festas.js', "diaGrande: 'assets/ecras/carnaval_dia_grande.jpg'", "diaGrande: 'assets/ecras/carnaval_festa.jpg'"],
  ['imagem da festa do Carnaval = a do dia grande', 'festas.js', "faixa: 'assets/ecras/carnaval_festa.jpg',", "faixa: 'assets/ecras/carnaval_dia_grande.jpg',"],
  ['imagem do corso que não existe', 'festas.js', "corso: 'assets/ecras/carnaval_festa.jpg'", "corso: 'assets/ecras/carnaval_corso.jpg'"],
  ['PT do Carnaval sem o texto de falta de Gotas', 'festas.js', "      fantasiasFalta: 'Ainda faltam Gotas para as fantasias. Junta mais e volta cá.',\n", ''],
  ['EN do Carnaval sem o texto do corso', 'festas.js', "      corsoSucesso: \"The corso parades", "      corsoSucessoX: \"The corso parades"],
  ['ES do Carnaval sem o aviso do dia grande', 'festas.js', "      diaGrandeAviso: '¡Hoy es martes de Carnaval! Los premios cuentan el doble.',\n", ''],
  ['cena do Carnaval com a opção certa trocada', 'festas.js', "convidá-los a desfilar à vista'], correta: 2 }", "convidá-los a desfilar à vista'], correta: 1 }"],
  ['cena do Carnaval em ES sem 3 opções diferentes', 'festas.js', "'Elogiar el disfraz y dejar que se sirva, que estamos en Carnaval'], correta: 1 }", "'Saludarlo con mucha ceremonia y ofrecerle un sitio en la mesa'], correta: 1 }"],
  ['resto do Natal no texto do Carnaval', 'festas.js', 'carros enfeitados, música e confetes', 'rabanadas a dourar, música e confetes'],
  ['Entrudo no texto do Carnaval', 'festas.js', "subtitulo: 'Uns dias de Carnaval, com o dia grande na terça-feira.'", "subtitulo: 'Uns dias de Entrudo, com o dia grande na terça-feira.'"],
  ['número no texto do Carnaval', 'festas.js', "subtitulo: 'Uns dias de Carnaval, com o dia grande na terça-feira.'", "subtitulo: 'Uns 4 dias de Carnaval, com o dia grande na terça-feira.'"],
  ['Carnaval mencionado no texto do Natal', 'festas.js', "faixa: 'É Natal na Quinta!'", "faixa: 'É Natal (e Carnaval) na Quinta!'"],
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
