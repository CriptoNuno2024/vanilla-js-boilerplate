#!/usr/bin/env node
// A garrafa da Câmara e da Coleção a seguir a cor do jogador (js/garrafa.js: garrafaImagemDaCamara e
// colecaoImagemMaisEscura; js/camara.js e js/reserva.js já não têm o cobre fixo). Corre state.js, niveis.js, alambique.js,
// garrafa.js, reserva.js e camara.js REAIS num ambiente simulado (vm), sem browser nem conta real.
//
// A. Câmara: depois de provar o fundo é a garrafa que mais descansou (cada uma das 4 cores); sem nenhuma garrafa com cor
//    (só jeropiga, histórico vazio, state.garrafas > 0 com histórico vazio) o fundo NÃO muda (nem Jovem de reserva).
// B. Coleção: depois de "Arrumar a Coleção" o fundo é a cor MAIS ESCURA entre as cores feitas desde o nível 6 (as do "x / 4"):
//    cada cor, todas as combinações (ordem Jovem, Dourado, Âmbar, Cobre), cobre feito ANTES do nível 6 não aparece, festa não conta.
// C. Funções puras (o estado de entrada não muda, nem congelado), sem relógio nem sorteio; garrafaQueMaisDescansou() sem
//    argumento dá o mesmo de antes (Reserva, Proteger, Visitas); o Roxo e a Reserva continuam como estavam.
//
// Depois de passar, aplica "mutações" (estraga cada regra de propósito) e confirma que o teste as apanha.
// Uso: node scripts/verificar-garrafa-cor.js     Sai com 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const FICHEIROS = ['state.js', 'niveis.js', 'alambique.js', 'garrafa.js', 'reserva.js', 'camara.js'];
const FONTES = {};
['roxo.js'].concat(FICHEIROS).forEach(function (f) { FONTES[f] = fs.readFileSync(path.join(RAIZ, 'js', f), 'utf8'); });

const IMG = { jovem: 'assets/garrafas/garrafa_1_jovem.jpg', dourado: 'assets/garrafas/garrafa_2_dourado.jpg', ambar: 'assets/garrafas/garrafa_3_ambar.jpg', cobre: 'assets/garrafas/garrafa_4_cobre.jpg' };
const COR_POR_DIAS = function (d) { return d >= 4 ? 'cobre' : d === 3 ? 'ambar' : d === 2 ? 'dourado' : 'jovem'; };
const h = function (dias, extra) { return Object.assign({ data: 'x', estacao: 'inverno', diasDescanso: dias }, extra || {}); };

function suite(fontes) {
  const falhas = [];
  function ok(cond, msg) { if (!cond) falhas.push(msg); }

  function abrir() {
    const guardado = {};
    const caixa = { innerHTML: '' };
    const sb = {
      console: { log() {}, warn() {}, error() {} },
      localStorage: {
        getItem: function (k) { return Object.prototype.hasOwnProperty.call(guardado, k) ? guardado[k] : null; },
        setItem: function (k, v) { guardado[k] = String(v); },
        removeItem: function (k) { delete guardado[k]; }
      },
      location: { search: '' }, URLSearchParams: URLSearchParams,
      document: { querySelectorAll: function () { return []; }, getElementById: function () { return caixa; }, querySelector: function () { return null; }, addEventListener: function () {} },
      setTimeout: function () { return 1; }, clearTimeout: function () {}, Image: function () {}, Date: Date, caixa: caixa
    };
    sb.window = sb;
    sb.addEventListener = function () {};
    sb.Telegram = { WebApp: {} };
    const cx = vm.createContext(sb);
    vm.runInContext(fontes['state.js'], cx, { filename: 'state.js' });
    vm.runInContext(`
      var FUNDOS = [], DIALOGOS = [];
      function t(k) { return k; }
      function definirFundo(modo, src) { FUNDOS.push(src); }
      function atualizarDialogo(msg) { DIALOGOS.push(msg); }
      function mostrarFalas() {} function applyTranslations() {} function vibrar() {} function tocarSom() {}
      function updateStatsDisplays() {} function estacaoAtual() { return 'inverno'; } function localeAtual() { return 'pt-PT'; }
      function marcarObjetivoCumprido() {} function desbloquearEntradaEnciclopedia() { return null; }
      function formatarTempoVinha() { return ''; } function randInt(a) { return a; }
      function diaLisboaDeHoje() { return '2026-10-10'; }
      function atualizarCartaoObjetivosQuinta() {} function atualizarResumoQuinta() {} function atualizarCapituloQuinta() {}
    `, cx);
    ['niveis.js', 'alambique.js', 'garrafa.js', 'reserva.js', 'camara.js'].forEach(function (f) { vm.runInContext(fontes[f], cx, { filename: f }); });
    vm.runInContext('renderAdega = function () {};', cx);
    const g = { cx: cx };
    g.ev = function (c) { return vm.runInContext(c, cx); };
    g.json = function (c) { return JSON.parse(vm.runInContext('JSON.stringify(' + c + ')', cx)); };
    // Põe o estado de um jogador de nível alto (jogador antigo: tudo aberto) com o histórico e a nota do nível 6.
    g.pr = function (historico, nota, garrafas) {
      g.ev('state.reputacao = 3000; state.acesso.jogadorAntigo = true; state.adega.historico = ' + JSON.stringify(historico) +
        '; state.niveis.garrafasAoNivel6 = ' + JSON.stringify(nota === undefined ? 0 : nota) + '; state.garrafas = ' + (garrafas === undefined ? historico.length : garrafas) +
        '; state.camara = { provaDia: null, dias: 0 }; state.colecao = { arrumouDia: null }; FUNDOS.length = 0; DIALOGOS.length = 0; camaraResultado = null; colecaoResultado = null;');
    };
    return g;
  }

  const fundoCamara = function (g, hist, garrafas) { g.pr(hist, 0, garrafas); g.ev('camaraProvarClique()'); return g.json('FUNDOS'); };
  const fundoColecao = function (g, hist, nota) { g.pr(hist, nota); g.ev('colecaoArrumarClique()'); return g.json('FUNDOS'); };

  // ---------------- A. Câmara ----------------
  {
    const g = abrir();
    // antes de provar, o fundo não muda (o do ecrã é o barril dourado, em main.js)
    g.pr([h(4)], 0); g.ev('renderCamara()');
    ok(g.json('FUNDOS').length === 0, 'Câmara: antes de provar o fundo não é mexido (fica o barril dourado)');
    [[[h(1)], 'jovem'], [[h(2)], 'dourado'], [[h(3)], 'ambar'], [[h(4)], 'cobre'], [[h(9)], 'cobre']].forEach(function (c) {
      const f = fundoCamara(g, c[0]);
      ok(JSON.stringify(f) === JSON.stringify([IMG[c[1]]]), 'Câmara com ' + c[0][0].diasDescanso + ' dias: a garrafa ' + c[1] + ' (deu ' + JSON.stringify(f) + ')');
      ok(g.ev('state.camara.dias') === 1, 'Câmara: provou (o prémio não depende da cor)');
    });
    [[[h(1), h(3), h(2)], 'ambar'], [[h(4), h(1)], 'cobre'], [[h(2), h(1), h(2)], 'dourado'], [[h(3.9)], 'ambar'], [[h(2.7)], 'dourado'], [[h(0, { festa: 'saomartinho' }), h(2)], 'dourado'], [[h(1), h(0, { festa: 'saomartinho' })], 'jovem']].forEach(function (c, i) {
      const f = fundoCamara(g, c[0]);
      ok(JSON.stringify(f) === JSON.stringify([IMG[c[1]]]), 'Câmara, caso misto ' + (i + 1) + ': a que mais descansou (' + c[1] + '), deu ' + JSON.stringify(f));
    });
    // sem nenhuma cor: o fundo fica como estava (e a prova faz-se na mesma)
    const semCor = [
      ['só jeropiga', [h(0, { festa: 'saomartinho' })], undefined],
      ['só jeropiga (várias)', [h(0, { festa: 'saomartinho' }), h(0, { festa: 'saomartinho' })], undefined],
      ['histórico vazio e state.garrafas = 3', [], 3],
      ['garrafas sem dias guardados', [{ data: 'x', estacao: 'inverno' }, h(null), h('x'), h(-1), h(0)], 5]
    ];
    semCor.forEach(function (c) {
      const f = fundoCamara(g, c[1], c[2]);
      ok(f.length === 0, 'Câmara sem cor (' + c[0] + '): o fundo não muda (deu ' + JSON.stringify(f) + ')');
      ok(g.ev('state.camara.dias') === 1, 'Câmara sem cor (' + c[0] + '): continua a poder provar');
    });
    g.pr([], 0, 3); g.ev('state.adega.historico = null;'); g.ev('camaraProvarClique()');
    ok(g.json('FUNDOS').length === 0 && g.ev('state.camara.dias') === 1, 'Câmara com histórico null: não rebenta, o fundo não muda');
    g.pr([], 0, 3); g.ev('delete state.adega;'); g.ev('camaraProvarClique()');
    ok(g.json('FUNDOS').length === 0, 'Câmara sem state.adega: não rebenta, o fundo não muda');
    ok(!FUNDOS_TEM_JOVEM(g), 'Câmara: a Jovem nunca é usada como imagem de reserva');
  }
  function FUNDOS_TEM_JOVEM(g) { return g.json('FUNDOS').indexOf(IMG.jovem) !== -1; }

  // ---------------- B. Coleção ----------------
  {
    const g = abrir();
    [[[h(1)], 'jovem'], [[h(2)], 'dourado'], [[h(3)], 'ambar'], [[h(4)], 'cobre'], [[h(7)], 'cobre']].forEach(function (c) {
      const f = fundoColecao(g, c[0], 0);
      ok(JSON.stringify(f) === JSON.stringify([IMG[c[1]]]), 'Coleção só com ' + c[1] + ': o fundo é a garrafa ' + c[1] + ' (deu ' + JSON.stringify(f) + ')');
      ok(g.ev('colecaoResumo()') === '1 / 4', 'Coleção só com ' + c[1] + ': a grelha diz 1 / 4');
    });
    // todas as combinações das 4 cores: o fundo é a mais escura que existe, e bate com o "x / 4"
    const ordem = ['jovem', 'dourado', 'ambar', 'cobre'], diasDe = { jovem: 1, dourado: 2, ambar: 3, cobre: 4 };
    let combMal = 0, resumoMal = 0;
    for (let m = 1; m < 16; m++) {
      const cores = ordem.filter(function (_, i) { return (m >> i) & 1; });
      // por ordens diferentes no histórico (a mais escura nem sempre é a última)
      [cores, cores.slice().reverse()].forEach(function (lista) {
        const f = fundoColecao(g, lista.map(function (c) { return h(diasDe[c]); }), 0);
        const escura = cores[cores.length - 1];
        if (JSON.stringify(f) !== JSON.stringify([IMG[escura]])) combMal++;
        if (g.ev('colecaoResumo()') !== cores.length + ' / 4') resumoMal++;
      });
    }
    ok(combMal === 0, 'Coleção: em todas as 15 combinações de cores (e nas duas ordens) o fundo é a cor mais escura (' + combMal + ' erros)');
    ok(resumoMal === 0, 'Coleção: o "x / 4" do ecrã bate com as cores usadas (' + resumoMal + ' erros)');
    // só contam as garrafas feitas desde o nível 6
    ok(JSON.stringify(fundoColecao(g, [h(4), h(1)], 1)) === JSON.stringify([IMG.jovem]), 'Coleção: o cobre feito ANTES do nível 6 não aparece (só a Jovem feita depois)');
    ok(JSON.stringify(fundoColecao(g, [h(4), h(3), h(1)], 2)) === JSON.stringify([IMG.jovem]), 'Coleção: com 2 garrafas antes do nível 6 só conta a última');
    ok(JSON.stringify(fundoColecao(g, [h(2), h(4), h(1)], 1)) === JSON.stringify([IMG.cobre]), 'Coleção: o cobre feito depois do nível 6 aparece (mesmo que a última seja a Jovem)');
    // sem nenhuma cor da Coleção: o fundo não muda (mesmo com cobre no histórico, feito antes)
    [['cobre só antes do nível 6', [h(4)], 1], ['nota null (nível 6 ainda não chegou)', [h(4), h(3)], null], ['histórico vazio', [], 0], ['só jeropiga', [h(0, { festa: 'saomartinho' }), h(3, { festa: 'saomartinho' })], 0], ['dias inválidos', [h(null), h('x'), h(-1), h(0), { data: 'x' }], 0]].forEach(function (c) {
      g.pr(c[1], c[2]);
      g.ev('colecaoResultado = { rep: 4 }; renderColecaoDesenhar();'); // o que "não deve acontecer": o resultado à vista sem cor
      ok(g.json('FUNDOS').length === 0, 'Coleção sem cor (' + c[0] + '): o fundo fica como estava (deu ' + JSON.stringify(g.json('FUNDOS')) + ')');
      ok(g.json('DIALOGOS').some(function (d) { return typeof d === 'string' && d.indexOf('colecao.arrumarOk') !== -1; }), 'Coleção sem cor (' + c[0] + '): o agradecimento aparece na mesma');
    });
    // a garrafa de festa não conta
    ok(JSON.stringify(fundoColecao(g, [h(1), h(3, { festa: 'saomartinho' })], 0)) === JSON.stringify([IMG.jovem]), 'Coleção: a garrafa de festa não conta (só a Jovem)');
    // sem cor da Coleção o botão nem deixa arrumar (por isso o resultado só aparece com pelo menos 1 cor)
    g.pr([h(4)], 1); g.ev('colecaoArrumarClique()');
    ok(g.json('FUNDOS').length === 0 && g.ev('state.colecao.arrumouDia') === null, 'Coleção: sem cor da Coleção não arruma, não grava e não muda o fundo');
    // antes de arrumar o fundo não é mexido
    g.pr([h(3)], 0); g.ev('renderColecao()');
    ok(g.json('FUNDOS').length === 0, 'Coleção: antes de arrumar o fundo não é mexido');
  }

  // ---------------- C. Funções puras e o que não muda ----------------
  {
    const g = abrir();
    const estados = [
      [h(1), h(2)], [h(4), h(1), h(0, { festa: 'saomartinho' })], [], [h(0, { festa: 'saomartinho' })], [h(null), h('x'), { data: 'y' }], [h(2.5), h(3)]
    ];
    estados.forEach(function (hist, i) {
      g.pr(hist, i % 3);
      const antes = g.ev('JSON.stringify(state)');
      g.ev('garrafaImagemDaCamara(state); colecaoImagemMaisEscura(state); garrafaQueMaisDescansou(state);');
      ok(g.ev('JSON.stringify(state)') === antes, 'funções puras: o estado ' + (i + 1) + ' não mudou depois de as chamar');
    });
    // estado congelado: não escrevem nem rebentam
    g.pr([h(1), h(3)], 0);
    const rebentou = g.ev(`(function () {
      function gelar(o) { Object.freeze(o); Object.keys(o).forEach(function (k) { if (o[k] && typeof o[k] === 'object') gelar(o[k]); }); return o; }
      var e = gelar(JSON.parse(JSON.stringify(state)));
      'use strict';
      try { return [garrafaImagemDaCamara(e), colecaoImagemMaisEscura(e)].join('|'); } catch (x) { return 'ERRO ' + x.message; }
    })()`);
    ok(rebentou === IMG.ambar + '|' + IMG.ambar, 'funções puras: com o estado congelado dão a imagem certa sem escrever nada (deu ' + rebentou + ')');
    // lêem o estado que recebem, não o do jogo
    g.pr([h(4)], 0);
    ok(g.ev("garrafaImagemDaCamara({ adega: { historico: [{ diasDescanso: 1 }] } })") === IMG.jovem, 'garrafaImagemDaCamara lê o estado do argumento (não o do jogo)');
    ok(g.ev("colecaoImagemMaisEscura({ adega: { historico: [{ diasDescanso: 2 }] }, niveis: { garrafasAoNivel6: 0 } })") === IMG.dourado, 'colecaoImagemMaisEscura lê o estado do argumento (não o do jogo)');
    ok(g.ev('garrafaImagemDaCamara()') === null && g.ev('garrafaImagemDaCamara(null)') === null && g.ev('garrafaImagemDaCamara({})') === null && g.ev('garrafaImagemDaCamara({ adega: { historico: "x" } })') === null, 'garrafaImagemDaCamara: sem estado, estado null, vazio ou inválido dá null (e nunca lê o do jogo)');
    ok(g.ev('colecaoImagemMaisEscura()') === null && g.ev('colecaoImagemMaisEscura(null)') === null && g.ev('colecaoImagemMaisEscura({})') === null && g.ev("colecaoImagemMaisEscura({ adega: { historico: [{ diasDescanso: 3 }] } })") === null && g.ev("colecaoImagemMaisEscura({ adega: { historico: [{ diasDescanso: 3 }] }, niveis: { garrafasAoNivel6: null } })") === null, 'colecaoImagemMaisEscura: sem estado, vazio, ou sem a nota do nível 6 dá null');
    // não lêem o relógio nem sorteiam
    const fonte = fontes['garrafa.js'];
    const a = fonte.indexOf('function garrafaImagemDaCamara'), b = fonte.indexOf('function colecaoImagemMaisEscura');
    const corpo = fonte.slice(a, a + 400) + fonte.slice(b, b + 500);
    ok(!/Math\.random|Date\.now|new Date|randInt|saveState|localStorage|state\./.test(corpo.replace(/\/\/.*$/gm, '')), 'as duas funções não lêem o relógio, não sorteiam, não gravam nem tocam no state do jogo');
    // garrafaQueMaisDescansou() sem argumento dá o mesmo de antes (Reserva, Proteger, Visitas)
    const antiga = function (hist) { // a regra de antes, escrita à parte
      if (!Array.isArray(hist)) return null;
      let maior = null;
      hist.forEach(function (e) { const d = e && Number(e.diasDescanso); if (Number.isFinite(d) && d >= 1 && (maior === null || d > maior)) maior = d; });
      return maior === null ? null : Math.floor(maior);
    };
    let difere = 0;
    [[], [h(1)], [h(1), h(4), h(2)], [h(0, { festa: 'saomartinho' })], [h(3.9), h(2)], [h(null), h('x'), { data: 'y' }, null, 5], [h('3')], [h(-2), h(0)]].forEach(function (hist) {
      g.pr(hist, 0);
      if (g.ev('garrafaQueMaisDescansou()') !== antiga(hist) || g.ev('garrafaQueMaisDescansou(state)') !== antiga(hist)) difere++;
    });
    g.ev('state.adega.historico = "x";'); if (g.ev('garrafaQueMaisDescansou()') !== null) difere++;
    ok(difere === 0, 'garrafaQueMaisDescansou() (Reserva, Proteger, Visitas) dá o mesmo de antes em todos os casos (' + difere + ' diferenças)');
    // a Reserva da Adega (bloco com a foto) continua a seguir a cor que mais descansou
    g.pr([h(2), h(3)], 0, 2);
    ok(g.ev('reservaHtml()').indexOf(IMG.ambar) !== -1, 'a Reserva da Adega continua a mostrar a garrafa que mais descansou');
    g.pr([], 0, 0);
    ok(g.ev('reservaHtml()').indexOf('barril_dourado') !== -1, 'a Reserva da Adega sem garrafas continua a mostrar o barril');
    // o que fica como estava
    const roxo = fontes['roxo.js'];
    ok(/imagemResultado: 'assets\/garrafas\/garrafa_3_ambar\.jpg'/.test(roxo), 'o Moscatel Roxo continua com a garrafa âmbar fixa');
    ok(g.ev('RESERVA_CONFIG.imagemResultado') === 'assets/ecras/yoshi_cat_adega_balde.jpg', 'Visitar a Reserva continua com a imagem do balde');
    ok(g.ev('CAMARA_CONFIG.imagemResultado') === undefined && g.ev('COLECAO_TAREFA_CONFIG.imagemResultado') === undefined, 'as duas configurações já não têm imagem de resultado');
    ['camara.js', 'reserva.js'].forEach(function (f) { ok(!/garrafa_4_cobre/.test(fontes[f]), f + ' já não tem o cobre escrito'); });
    ok((fontes['garrafa.js'].match(/garrafa_4_cobre/g) || []).length === 2, 'garrafa.js só tem o cobre nas 2 tabelas das cores (nenhum "cobre por omissão" escondido)');
    // capítulos 5 e 6 (critérios), Reserva e prémios: a Câmara e a Coleção dão o mesmo prémio de antes
    g.pr([h(2)], 0, 1); g.ev('state.reputacao = 3000; state.conhecimento = 0; camaraProvarClique();');
    ok(g.ev('state.reputacao') === 3008, 'a Câmara paga o mesmo de antes (+8, sem Conhecimento), seja qual for a cor');
    g.pr([h(0, { festa: 'saomartinho' })], 0, 1); g.ev('state.reputacao = 3000; state.conhecimento = 0; camaraProvarClique();');
    ok(g.ev('state.reputacao') === 3008, 'a Câmara paga o mesmo de antes (+8) mesmo sem nenhuma cor')
    g.pr([h(2)], 0, 1); g.ev('state.reputacao = 3000; colecaoArrumarClique();');
    ok(g.ev('state.reputacao') === 3004, 'a Coleção paga o mesmo de antes (+4)');
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
  ['Câmara: a que menos descansou', 'garrafa.js', '(maior === null || d > maior)) maior = d;', '(maior === null || d < maior)) maior = d;'],
  ['Câmara: a Jovem como imagem de reserva', 'garrafa.js', 'return dias === null ? null : garrafaPorDias(dias).imagem;', 'return dias === null ? GARRAFAS_POR_DIAS[0].imagem : garrafaPorDias(dias).imagem;'],
  ['Câmara: garrafas de festa (0 dias) contam', 'garrafa.js', 'if (Number.isFinite(d) && d >= 1 && (maior', 'if (Number.isFinite(d) && d >= 0 && (maior'],
  ['Câmara: troca o fundo mesmo sem imagem', 'camara.js', "if (imagem) definirFundo('foto', imagem);", "definirFundo('foto', imagem);"],
  ['Câmara: cobre fixo outra vez', 'camara.js', 'const imagem = garrafaImagemDaCamara(state);', "const imagem = 'assets/garrafas/garrafa_4_cobre.jpg';"],
  ['Câmara: troca o fundo antes de provar', 'camara.js', "if (camaraResultado && typeof garrafaImagemDaCamara === 'function') {", "if (typeof garrafaImagemDaCamara === 'function') {"],
  ['Câmara: lê o state do jogo e não o argumento', 'garrafa.js', 'garrafaQueMaisDescansou(estado === undefined ? null : estado);', 'garrafaQueMaisDescansou();'],
  ['garrafaQueMaisDescansou ignora o argumento', 'garrafa.js', 'const e0 = estado === undefined ? state : estado;', 'const e0 = state;'],
  ['garrafaQueMaisDescansou sem argumento deixa de ler o jogo', 'garrafa.js', 'const e0 = estado === undefined ? state : estado;', 'const e0 = estado;'],
  ['Câmara: sem estado lê o do jogo', 'garrafa.js', 'garrafaQueMaisDescansou(estado === undefined ? null : estado);', 'garrafaQueMaisDescansou(estado);'],
  ['Coleção: a cor mais clara em vez da mais escura', 'garrafa.js', 'for (let i = GARRAFAS_POR_DIAS.length - 1; i >= 0; i--) {', 'for (let i = 0; i < GARRAFAS_POR_DIAS.length; i++) {'],
  ['Coleção: conta as garrafas de antes do nível 6', 'garrafa.js', 'return h.slice(Math.max(0, n));', 'return h.slice(0);'],
  ['Coleção: a garrafa de festa conta', 'garrafa.js', "if (!e || typeof e !== 'object' || e.festa) return;\n    const g = garrafaPorDias(e.diasDescanso);", "if (!e || typeof e !== 'object') return;\n    const g = garrafaPorDias(e.diasDescanso);"],
  ['Coleção: cobre fixo outra vez', 'garrafa.js', 'const imagem = colecaoImagemMaisEscura(state);', "const imagem = 'assets/garrafas/garrafa_4_cobre.jpg';"],
  ['Coleção: troca o fundo mesmo sem imagem', 'garrafa.js', "if (imagem) definirFundo('foto', imagem);", "definirFundo('foto', imagem);"],
  ['Coleção: o Âmbar passa por Cobre na tabela', 'garrafa.js', "'adega.garrafaAmbar': 'ambar'", "'adega.garrafaAmbar': 'cobre'"],
  ['Coleção: o Dourado passa por Jovem na tabela', 'garrafa.js', "'adega.garrafaDourado': 'dourado'", "'adega.garrafaDourado': 'jovem'"],
  ['Coleção: a função escreve no estado', 'garrafa.js', 'const cores = colecaoCoresFeitas(estado);\n  for (let i = GARRAFAS_POR_DIAS.length - 1', 'const cores = colecaoCoresFeitas(estado); estado.uvas = 0;\n  for (let i = GARRAFAS_POR_DIAS.length - 1'],
  ['Câmara: a função escreve no estado', 'garrafa.js', 'const dias = garrafaQueMaisDescansou(estado === undefined ? null : estado); // sem estado não lê o do jogo: null', 'const dias = garrafaQueMaisDescansou(estado === undefined ? null : estado); if (estado) estado.garrafas = 0;'],
  ['Coleção: sorteia', 'garrafa.js', 'const cores = colecaoCoresFeitas(estado);\n  for (let i = GARRAFAS_POR_DIAS.length - 1', 'const cores = colecaoCoresFeitas(estado); Math.random();\n  for (let i = GARRAFAS_POR_DIAS.length - 1'],
  ['Câmara volta a ter o cobre na configuração', 'camara.js', "  garrafasMinimas: 1    // garrafas feitas", "  garrafasMinimas: 1, imagemResultado: 'assets/garrafas/garrafa_4_cobre.jpg' // garrafas feitas"],
  ['Coleção volta a ter o cobre na configuração', 'reserva.js', "  coresMinimas: 1       // cores já feitas", "  coresMinimas: 1, imagemResultado: 'assets/garrafas/garrafa_4_cobre.jpg' // cores já feitas"],
  ['Roxo deixa de ter a âmbar fixa', 'roxo.js', "imagemResultado: 'assets/garrafas/garrafa_3_ambar.jpg'", "imagemResultado: 'assets/garrafas/garrafa_4_cobre.jpg'"],
  ['Reserva da Adega com a cor errada', 'garrafa.js', 'const g = dias !== null ? garrafaPorDias(dias) : null;', 'const g = dias !== null ? garrafaPorDias(1) : null;']
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
