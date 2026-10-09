#!/usr/bin/env node
// Ofertas a uma visita da Quinta (PR 5C): despensaOferecer e despensaBemParaOferecer (js/despensa.js), os dados de
// js/estrada-dados.js, o botão "Oferecer" no cartão da Quinta (estradaOfertaHtml e estradaOferecerClique, js/estrada.js)
// e a ligação à linha da visita (atualizarLinhaVisitaQuinta, js/visitas.js). Corre os ficheiros REAIS num ambiente
// simulado (vm), sem browser nem conta real. Nada é gravado.
//
// Depois de passar com o código real, o script ESTRAGA as regras de propósito (mutantes) e confirma que cada estrago faz
// falhar pelo menos uma verificação: se um mutante passar, o script falha.
//
// Uso: node scripts/verificar-ofertas.js
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const ler = function (f) { return fs.readFileSync(path.join(RAIZ, f), 'utf8'); };
const FONTES = { despensa: ler('js/despensa.js'), dados: ler('js/estrada-dados.js'), ecra: ler('js/estrada.js'), visitas: ler('js/visitas.js') };
const J = function (o) { return JSON.stringify(o); };
const clone = function (o) { return JSON.parse(JSON.stringify(o)); };

function correrTestes(src) {
  const falhas = [];
  const ok = function (cond, msg) { if (!cond) falhas.push(msg); };

  const gravacoes = [];
  const elementos = {};
  const el = function (id) { return elementos[id] || (elementos[id] = { innerHTML: '' }); };
  const sb = {
    console: { log() {}, warn() {}, error() {} },
    localStorage: { getItem: function () { return null; }, setItem: function (k) { gravacoes.push(k); }, removeItem: function (k) { gravacoes.push(k); } },
    location: { search: '' }, URLSearchParams: URLSearchParams, Date: Date, setTimeout: function () {}, Image: function () {},
    document: { querySelectorAll: function () { return []; }, querySelector: function () { return (sb.__botao = { disabled: false }); }, getElementById: el, addEventListener: function () {} },
    Telegram: { WebApp: {} }
  };
  sb.window = sb;
  sb.addEventListener = function () {};
  const cx = vm.createContext(sb);
  require('./_regras-tempo').injetarRegrasTempo(cx);
  const correr = function (codigo, nome) { return vm.runInContext(codigo, cx, { filename: nome || 'x' }); };
  correr(ler('js/state.js'), 'state.js');
  correr(ler('js/i18n.js'), 'i18n.js');
  correr(`
    var FALAS = [];
    function mostrarFalas(f, quem) { FALAS.push({ f: f, quem: quem }); }
    function vibrar() {} function tocarSom() {}
    function estacaoAtual() { return 'inverno'; } function faseRealAtual() { return 'repouso'; }
    function festaAtual() { return null; } function caveReservaAberta() { return false; } function garrafaQueMaisDescansou() { return null; }
    function localeAtual() { return 'pt-PT'; }
    function marcarObjetivoCumprido() {} function desbloquearEntradaEnciclopedia() { return null; }
    function formatarTempoVinha() { return ''; } function randInt(a) { return a; }
    var DIAS_FORCADOS = 0;
    function atualizarDialogo() {} function atualizarResumoQuinta() {}
    var __dia = '2026-10-20';
    function diaLisboaDeHoje() { return __dia; }
  `, 'stubs');
  ['niveis.js', 'garrafa.js', 'capitulos.js', 'conquistas.js', 'caderno.js'].forEach(function (f) { correr(ler('js/' + f), f); });
  correr(src.dados, 'estrada-dados.js');
  correr(src.despensa, 'despensa.js');
  correr(src.visitas, 'visitas.js');
  correr(src.ecra, 'estrada.js');
  correr('renderAdega = function () {}', 'stub2');

  // Espiões: gravações, barra de cima.
  correr('var __saves = 0, __barras = 0, __ofertas = 0; var __sv = saveState; saveState = function (s) { __saves++; return __sv(s); }; ' +
    'var __ub = updateStatsDisplays; updateStatsDisplays = function () { __barras++; return __ub(); }; ' +
    'var __of = despensaOferecer; despensaOferecer = function () { __ofertas++; return __of.apply(this, arguments); };', 'spies');
  const N = function (nome) { return correr(nome); };
  const oferecer = function (estado, dia) { cx.__e = estado; cx.__d = dia; return clone(correr('__of(__e, __d)', 'o')); };
  const bemPara = function (estado) { cx.__e = estado; return correr('despensaBemParaOferecer(__e)', 'b'); };
  const quantos = function (estado, bem) { cx.__e = estado; cx.__b = bem; return correr('despensaQuantos(__e, __b)', 'q'); };
  const base = function (rec, extra) {
    return Object.assign({
      uvas: 773, reputacao: 370, garrafas: 4, gotas: 3,
      adega: { historico: [{ data: 'x', estacao: 'inverno', diasDescanso: 2 }, { data: 'x', estacao: 'verao', diasDescanso: 3 }] },
      despensa: { recebidos: rec || {}, entregues: {}, primeiraTroca: {}, hoje: { dia: null, feitas: {} } }
    }, extra || {});
  };
  const D1 = '2026-10-20', D2 = '2026-10-21';
  const recusada = function (nome, estado, dia, motivo) {
    const antes = J(estado);
    const r = oferecer(estado, dia);
    ok(r.ok === false && r.motivo === motivo && r.bem === null && r.reputacaoGanha === 0, nome + ': devia recusar com "' + motivo + '": ' + J(r));
    ok(J(estado) === antes, nome + ': recusar não devia alterar nada');
  };

  // 0. Dados.
  ok(N('ESTRADA_OFERTA.reputacao') === 1 && N('ESTRADA_OFERTA.porDia') === 1 && J(N('ESTRADA_OFERTA.ordemEmpate')) === '["queijo_azeitao","mel_sesimbra","sal_sado","choco_sado"]', 'regras da oferta: +1, 1 por dia, empate queijo, mel, sal, choco');
  ok(N('Object.prototype.hasOwnProperty.call(defaultState().despensa, "ofertaDia")') === false, 'state.js não devia ter ofertaDia (o campo em falta conta "nunca ofereceu")');

  // 1. +1 só uma vez por dia.
  {
    const e = base({ queijo_azeitao: 2, sal_sado: 1 });
    const r = oferecer(e, D1);
    ok(r.ok && r.bem === 'queijo_azeitao' && r.reputacaoGanha === 1 && r.motivo === null, 'oferta ok: ' + J(r));
    ok(e.reputacao === 371 && e.despensa.ofertaDia === D1 && e.despensa.entregues.queijo_azeitao === 1 && quantos(e, 'queijo_azeitao') === 1, '+1 de Reputação, queijo -1 (via entregues) e ofertaDia = hoje');
    recusada('segunda oferta no mesmo dia', e, D1, 'ja_ofereceu');
    const r2 = oferecer(e, D2);
    ok(r2.ok && e.reputacao === 372, 'no dia seguinte volta a poder oferecer (+1)');
    // 10 dias seguidos: +1 por dia, nunca mais.
    const f = base({ queijo_azeitao: 3, mel_sesimbra: 3, sal_sado: 3 }); let rep = 0;
    for (let i = 0; i < 9; i++) { const dia = new Date(Date.UTC(2026, 9, 20 + i)).toISOString().slice(0, 10); const a = oferecer(f, dia); rep += a.reputacaoGanha; oferecer(f, dia); oferecer(f, dia); }
    ok(rep === 9 && f.reputacao === 379, '9 dias, 9 ofertas, +9 de Reputação (mesmo a tentar 3 vezes por dia): ' + f.reputacao);
    ok(quantos(f, 'queijo_azeitao') + quantos(f, 'mel_sesimbra') + quantos(f, 'sal_sado') === 0, 'os 9 bens saíram da Despensa');
    const g = base({ queijo_azeitao: 1 });
    ok(oferecer(g, D1).ok, 'oferta ao fim de uma troca'); // marca guardada
  }

  // 2. Sem bem: recusa e não altera nada (incluindo estados estranhos: recusar não repara nada).
  {
    recusada('sem bens', base({}), D1, 'sem_bens');
    recusada('bens a 0 (recebidos = entregues)', Object.assign(base({ queijo_azeitao: 2 }), { despensa: { recebidos: { queijo_azeitao: 2 }, entregues: { queijo_azeitao: 2 }, primeiraTroca: {}, hoje: { dia: null, feitas: {} } } }), D1, 'sem_bens');
    const nula = base({}); nula.despensa = null; recusada('despensa nula', nula, D1, 'sem_bens');
    const estranha = base({}); estranha.despensa = { recebidos: { queijo_azeitao: -2 }, entregues: 'x', hoje: 'x' }; recusada('despensa estranha', estranha, D1, 'sem_bens');
    const semCampo = base({}); delete semCampo.despensa; recusada('sem despensa', semCampo, D1, 'sem_bens');
  }

  // 3. Relógio atrás e dia inválido.
  {
    const e = base({ queijo_azeitao: 3 });
    oferecer(e, D2);
    recusada('relógio atrás', e, D1, 'ja_ofereceu');
    recusada('mesmo dia', e, D2, 'ja_ofereceu');
    ['ontem', '2026-1-1', '', null, undefined, 20261020, '2026-10-20T10:00'].forEach(function (d) { recusada('dia inválido ' + String(d), base({ queijo_azeitao: 1 }), d, 'dia_invalido'); });
    recusada('estado inválido', null, D1, 'estado_invalido');
    ok(oferecer('x', D1).motivo === 'estado_invalido', 'estado que não é objeto');
    // ofertaDia inválido conta "nunca ofereceu".
    ['x', 5, null, '2026-13', {}].forEach(function (v) { const s = base({ queijo_azeitao: 1 }); s.despensa.ofertaDia = v; ok(oferecer(s, D1).ok === true, 'ofertaDia inválido (' + J(v) + ') conta como nunca ofereceu'); });
  }

  // 4. Empate: queijo, depois mel, depois sal, depois choco; e o de que há mais.
  {
    const q = function (rec) { return bemPara(base(rec)); };
    ok(q({ queijo_azeitao: 1, mel_sesimbra: 1, sal_sado: 1 }) === 'queijo_azeitao', 'empate a 3: queijo');
    ok(q({ mel_sesimbra: 1, sal_sado: 1 }) === 'mel_sesimbra', 'empate mel/sal: mel');
    ok(q({ sal_sado: 1 }) === 'sal_sado', 'só sal: sal');
    ok(q({ queijo_azeitao: 1, sal_sado: 2 }) === 'sal_sado', 'sal 2, queijo 1: o de que há mais (sal)');
    ok(q({ queijo_azeitao: 1, mel_sesimbra: 2, sal_sado: 2 }) === 'mel_sesimbra', 'mel 2, sal 2, queijo 1: empate mel/sal: mel');
    ok(q({ queijo_azeitao: 3, mel_sesimbra: 3, sal_sado: 3 }) === 'queijo_azeitao', 'empate a 3 bens iguais: queijo');
    ok(q({ queijo_azeitao: 1, mel_sesimbra: 1, sal_sado: 1, choco_sado: 1 }) === 'queijo_azeitao', 'empate a 4: queijo');
    ok(q({ sal_sado: 1, choco_sado: 1 }) === 'sal_sado', 'empate sal/choco: sal (o choco vem depois dos 3 originais)');
    ok(q({ choco_sado: 1 }) === 'choco_sado', 'só choco: choco');
    ok(q({ queijo_azeitao: 1, sal_sado: 1, choco_sado: 2 }) === 'choco_sado', 'choco 2, queijo 1, sal 1: o de que há mais (choco)');
    ok(q({}) === null, 'sem bens: nenhum');
    // Com entregues: o que conta é recebidos menos entregues.
    const e = base({ queijo_azeitao: 3, mel_sesimbra: 1 }); e.despensa.entregues = { queijo_azeitao: 3 };
    ok(bemPara(e) === 'mel_sesimbra', 'queijo todo entregue: passa para o mel');
    // Sequência real: a oferta gasta o bem escolhido, por dias.
    const s = base({ queijo_azeitao: 1, mel_sesimbra: 1, sal_sado: 1, choco_sado: 1 });
    const bens = [D1, D2, '2026-10-22', '2026-10-23'].map(function (d) { return oferecer(s, d).bem; });
    ok(J(bens) === '["queijo_azeitao","mel_sesimbra","sal_sado","choco_sado"]', 'ofertas em dias seguidos com empate: queijo, mel, sal, choco: ' + J(bens));
  }

  // 5. Garrafas, historico, recebidos, primeiraTroca e capítulo 7 ficam iguais; a oferta é independente das trocas.
  {
    const e = base({ queijo_azeitao: 2, mel_sesimbra: 1, sal_sado: 1 }); e.despensa.primeiraTroca = { queijo_azeitao: '2026-10-01', mel_sesimbra: '2026-10-01', sal_sado: '2026-10-01' };
    const antes = clone(e);
    oferecer(e, D1);
    ok(e.garrafas === antes.garrafas && J(e.adega) === J(antes.adega) && J(e.despensa.recebidos) === J(antes.despensa.recebidos) && J(e.despensa.primeiraTroca) === J(antes.despensa.primeiraTroca) && e.uvas === antes.uvas && e.gotas === antes.gotas && J(e.despensa.hoje) === J(antes.despensa.hoje), 'a oferta não mexe em garrafas, historico, recebidos, primeiraTroca, hoje, uvas nem gotas');
    ok(e.despensa.garrafasDadas === undefined, 'a oferta não mexe em garrafasDadas');
    // Capítulo 7: oferecer tudo não o descumpre nem o cumpre.
    correr('state = mergeDeep(defaultState(), ' + J({ uvas: 773, reputacao: 370, garrafas: 4, acesso: { jogadorAntigo: true }, despensa: { recebidos: { queijo_azeitao: 1, sal_sado: 1 } } }) + ');', 's');
    const lido = function () { return JSON.parse(correr('JSON.stringify(capitulosLerCriterio(CAPITULOS_CONFIG[6]))', 'c')); };
    ok(lido().atual === 2 && lido().cumprido === false, 'premissa: 2 bens recebidos, cap7 por cumprir');
    cx.__d = D1; correr('despensaOferecer(state, __d)', 'o'); cx.__d = D2; correr('despensaOferecer(state, __d)', 'o');
    ok(lido().atual === 2 && lido().cumprido === false && correr('state.despensa.recebidos.queijo_azeitao', 'c') === 1, 'oferecer não muda o capítulo 7 (recebidos iguais)');
    correr('state.despensa.recebidos.mel_sesimbra = 1', 'c');
    ok(lido().cumprido === true, 'com 3 bens recebidos o cap7 cumpre-se (e oferecer os bens não o desfaz)');
    cx.__d = '2026-10-23'; correr('despensaOferecer(state, __d)', 'o');
    ok(lido().cumprido === true, 'oferecer o 3.º bem não desfaz o cap7');
    // A marca da oferta e a das trocas são independentes (despensaRegistarTroca/despensaEstado não a apagam).
    const f = base({ queijo_azeitao: 1 }, { uvas: 500 });
    oferecer(f, D1);
    cx.__e = f; cx.__d = D1; correr('despensaTrocar(__e, "tomas", __d)', 't');
    ok(f.despensa.ofertaDia === D1 && f.despensa.recebidos.mel_sesimbra === 1, 'uma troca depois da oferta não apaga ofertaDia');
  }

  // 6. A ARMADILHA: tocar na visita (visitaFazerHoje reescreve state.visitas.hoje) depois de oferecer não apaga a marca.
  {
    correr('state = mergeDeep(defaultState(), ' + J({ uvas: 773, reputacao: 370, garrafas: 4, acesso: { jogadorAntigo: true }, niveis: { nivelMostrado: 5 },
      despensa: { recebidos: { queijo_azeitao: 2 } }, visitas: { feitas: {}, hoje: { dia: D1, id: 'valentim_4', feita: false } } }) + '); __dia = ' + J(D1) + ';', 's');
    correr('despensaOferecer(state, __dia)', 'o');
    ok(correr('state.despensa.ofertaDia', 'c') === D1, 'a marca da oferta fica em state.despensa.ofertaDia');
    const v = JSON.parse(correr('JSON.stringify(visitaFazerHoje())', 'v'));
    ok(v.ok === true && correr('state.visitas.hoje.feita', 'c') === true, 'premissa: tocar na visita reescreve state.visitas.hoje');
    ok(correr('state.despensa.ofertaDia', 'c') === D1 && J(correr('JSON.parse(JSON.stringify(despensaOferecer(state, __dia)))', 'o')) === J({ ok: false, motivo: 'ja_ofereceu', bem: null, reputacaoGanha: 0 }), 'depois de tocar na visita a marca sobrevive e a 2.ª oferta é recusada');
    ok(!/oferta/i.test(JSON.stringify(correr('state.visitas', 'c'))), 'nada da oferta em state.visitas');
  }

  // 7. O cartão da Quinta: o desenho nunca grava; só aparece nas condições certas.
  {
    const prep = function (opcoes) {
      const o = Object.assign({ rec: { queijo_azeitao: 1, sal_sado: 1 }, antigo: true, reputacao: 370, visita: 'feita', dia: D1, lang: 'pt', ofertaDia: null }, opcoes || {});
      const despensa = { recebidos: o.rec, entregues: {}, primeiraTroca: {}, hoje: { dia: null, feitas: {} } };
      if (o.ofertaDia) despensa.ofertaDia = o.ofertaDia;
      const visitas = o.visita === 'nenhuma' ? { feitas: {}, hoje: null } : { feitas: {}, hoje: { dia: o.dia, id: 'valentim_4', feita: o.visita === 'feita' } };
      correr('state = mergeDeep(defaultState(), ' + J({ uvas: 773, reputacao: o.reputacao, garrafas: 4, acesso: { jogadorAntigo: o.antigo, introMostrada: true }, niveis: { nivelMostrado: 5 }, despensa: despensa, visitas: visitas }) +
        '); __dia = ' + J(o.dia) + '; currentLang = ' + J(o.lang) + '; estradaOfertaResultado = null; __saves = 0; __barras = 0; __ofertas = 0; ', 'prep');
      gravacoes.length = 0;
    };
    const linha = function () { correr('atualizarLinhaVisitaQuinta()', 'l'); return el('visita-container').innerHTML; };
    const estado = function () { return correr('JSON.stringify(state)', 'e'); };

    prep();
    const antes = estado();
    let h = linha();
    ok(h.indexOf('Oferecer Queijo de Azeitão') !== -1 && h.indexOf('oferta-botao') !== -1, 'visita tocada e com bens: botão "Oferecer Queijo de Azeitão"');
    ok(N('__saves') === 0 && N('__barras') === 0 && N('__ofertas') === 0 && gravacoes.length === 0 && estado() === antes, 'desenhar a linha da visita com o botão não grava, não oferece e não mexe no estado');
    // Sem a visita tocada: sem botão.
    prep({ visita: 'naoTocada' }); h = linha(); ok(h.indexOf('oferta-') === -1 && h.indexOf('visita-linha') !== -1, 'visita ainda não tocada: sem botão de oferta');
    // Sem visita hoje (dia sem visita pelo hash): nada.
    let diaSem = null; for (let i = 0; i < 40 && !diaSem; i++) { const d = new Date(Date.UTC(2026, 10, 1 + i)).toISOString().slice(0, 10); if (correr('visitasHash(' + J(d) + ' + "#visita#dia") % VISITAS_UM_DIA_EM_N', 'h') === 0) diaSem = d; }
    prep({ visita: 'nenhuma', dia: diaSem }); h = linha(); ok(diaSem && h === '', 'sem visita hoje: a linha fica vazia (sem botão): ' + h.slice(0, 60));
    // Sem bens: nada (só a linha da visita).
    prep({ rec: {} }); h = linha(); ok(h.indexOf('oferta-') === -1 && h.indexOf('visita-linha') !== -1, 'visita tocada sem bens: não mostra nada da oferta');
    // Estrada trancada (jogador novo, nível 5): nada.
    prep({ antigo: false }); h = linha(); ok(h.indexOf('oferta-') === -1, 'Estrada trancada (jogador novo, nível 5): sem botão');
    prep({ antigo: false, reputacao: 1000 }); h = linha(); ok(h.indexOf('oferta-botao') !== -1, 'jogador novo no nível 7: com botão');
    // Já ofereceu hoje: só a linha "Já ofereceste hoje" (também com o relógio atrás da última oferta).
    prep({ ofertaDia: D1 }); h = linha(); ok(h.indexOf('Já ofereceste hoje') !== -1 && h.indexOf('oferta-botao') === -1, 'oferta de hoje feita: só "Já ofereceste hoje"');
    prep({ ofertaDia: '2026-10-25' }); h = linha(); ok(h.indexOf('Já ofereceste hoje') !== -1 && h.indexOf('oferta-botao') === -1, 'relógio atrás da última oferta: só "Já ofereceste hoje"');
    prep({ ofertaDia: D1, rec: {} }); h = linha(); ok(h.indexOf('Já ofereceste hoje') !== -1, 'já ofereceu e ficou sem bens: continua a dizer "Já ofereceste hoje"');
    prep({ ofertaDia: '2026-10-19' }); h = linha(); ok(h.indexOf('oferta-botao') !== -1, 'a última oferta foi ontem: o botão volta');
    // Línguas.
    [['en', 'Give Azeitão cheese'], ['es', 'Ofrecer Queso de Azeitão']].forEach(function (p) { prep({ lang: p[0] }); ok(linha().indexOf(p[1]) !== -1, p[0] + ': botão "' + p[1] + '"'); });

    // Clique: oferece, grava UMA vez, atualiza a barra, mostra o agradecimento.
    prep();
    const rep0 = N('state.reputacao'), antesFixos = correr('JSON.stringify({ g: state.garrafas, h: state.adega.historico, r: state.despensa.recebidos })', 'f');
    linha();
    correr('estradaOferecerClique()', 'c');
    h = el('visita-container').innerHTML;
    ok(N('__saves') === 1 && N('__barras') === 1 && N('__ofertas') === 1, 'o clique oferece, grava UMA vez e atualiza a barra de cima');
    ok(sb.__botao && sb.__botao.disabled === true, 'o clique apaga o botão logo (clique duplo)');
    ok(N('state.reputacao') === rep0 + 1 && N('state.despensa.entregues.queijo_azeitao') === 1 && N('state.despensa.ofertaDia') === D1, 'o clique: +1 de Reputação, queijo -1 via entregues, ofertaDia');
    ok(correr('JSON.stringify({ g: state.garrafas, h: state.adega.historico, r: state.despensa.recebidos })', 'f') === antesFixos, 'o clique não mexe em garrafas, historico nem recebidos');
    ok(h.indexOf('Ofereceste Queijo de Azeitão ao Sr. Valentim') !== -1 && h.indexOf('+1 de Reputação') !== -1 && h.indexOf(N('ESTRADA_OFERTA_FALAS.valentim.queijo_azeitao.texto.pt')) !== -1 && h.indexOf('oferta-botao') === -1, 'depois de oferecer: "Ofereceste Queijo de Azeitão ao Sr. Valentim", "+1 de Reputação" e a fala do Valentim para o queijo');
    // Clique duplo / segunda oferta no mesmo dia: recusada, nada grava nem muda.
    const dep = estado();
    correr('estradaOferecerClique()', 'c');
    ok(N('__saves') === 1 && estado() === dep, 'a 2.ª oferta no mesmo dia é recusada: não grava e o estado não muda');
    // Mudar de língua a meio: o agradecimento acompanha a língua.
    correr('currentLang = "en"; atualizarLinhaVisitaQuinta();', 'l'); h = el('visita-container').innerHTML;
    ok(h.indexOf('You offered Azeitão cheese to Mr. Valentim') !== -1 && h.indexOf('+1 Reputation') !== -1 && h.indexOf(N('ESTRADA_OFERTA_FALAS.valentim.queijo_azeitao.texto.en')) !== -1, 'mudar de língua a meio: o agradecimento passa para inglês');
    correr('currentLang = "es"; atualizarLinhaVisitaQuinta();', 'l'); h = el('visita-container').innerHTML;
    ok(h.indexOf('Ofreciste Queso de Azeitão al Sr. Valentim') !== -1, 'e para espanhol');
    // Dia seguinte: volta o botão (o do bem que ficou: o sal).
    correr('currentLang = "pt"; __dia = ' + J(D2) + '; state.visitas.hoje = { dia: ' + J(D2) + ', id: "valentim_4", feita: true }; atualizarLinhaVisitaQuinta();', 'l'); h = el('visita-container').innerHTML;
    ok(h.indexOf('Oferecer Sal do Sado') !== -1 && h.indexOf('Ofereceste') === -1, 'no dia seguinte volta o botão (agora o sal)');
    // Relógio atrás: recusa e não grava.
    const sv = N('__saves'); correr('__dia = ' + J(D1) + '; state.visitas.hoje = { dia: ' + J(D1) + ', id: "valentim_4", feita: true }; atualizarLinhaVisitaQuinta();', 'l');
    ok(el('visita-container').innerHTML.indexOf('oferta-botao') === -1, 'relógio atrás: sem botão');
    const antesR = estado(); correr('estradaOferecerClique()', 'c'); ok(N('__saves') === sv && estado() === antesR, 'relógio atrás: forçar o clique não grava nem muda');
    // Clique sem a visita tocada, sem bens ou sem a Estrada: não faz nada.
    prep({ visita: 'naoTocada' }); correr('estradaOferecerClique()', 'c'); ok(N('__saves') === 0 && N('__ofertas') === 0 && N('state.reputacao') === 370, 'clique sem a visita tocada: não faz nada');
    prep({ rec: {} }); correr('estradaOferecerClique()', 'c'); ok(N('__saves') === 0 && N('state.reputacao') === 370, 'clique sem bens: não grava');
    // As 9 falas aparecem (3 visitas x 3 bens) com o nome certo.
    [['valentim', 'valentim_4', 'ao Sr. Valentim'], ['marisa', 'marisa_4', 'à Marisa'], ['henrique', 'henrique_3', 'ao Dr. Henrique']].forEach(function (vv) {
      ['queijo_azeitao', 'sal_sado', 'mel_sesimbra'].forEach(function (bem) {
        const rec = {}; rec[bem] = 1;
        prep({ rec: rec });
        correr('state.visitas.hoje.id = ' + J(vv[1]) + '; atualizarLinhaVisitaQuinta(); estradaOferecerClique();', 'c');
        const hh = el('visita-container').innerHTML;
        ok(hh.indexOf(vv[2]) !== -1 && hh.indexOf(N('ESTRADA_OFERTA_FALAS.' + vv[0] + '.' + bem + '.texto.pt').replace(/&/g, '&amp;')) !== -1, vv[0] + '/' + bem + ': mostra ' + vv[2] + ' e a fala especial');
      });
    });
  }

  // 8. Fontes: só o clique de js/estrada.js chama despensaOferecer; a marca não vai para visitas nem para state.js.
  {
    const semCom = function (f) { return f.split('\n').filter(function (l) { return !/^\s*\/\//.test(l); }).join('\n'); };
    const vis = semCom(src.visitas);
    ok(!/despensa|ofertaDia|ESTRADA_/.test(vis), 'js/visitas.js só chama estradaOfertaHtml (nada da despensa nem da marca da oferta)');
    ok(vis.indexOf('estradaOfertaHtml') !== -1, 'js/visitas.js devia chamar estradaOfertaHtml');
    const des = semCom(src.despensa);
    ok(!/saveState|localStorage|nuvem|marcarObjetivo|historico|gotas|Math\.random|Date\.now|new Date|state\./.test(des), 'despensa.js: sem gravar, nuvem, objetivos, historico, gotas, relógio nem "state." global');
    ok(!/\.garrafas\s*(-=|\+=|=[^=])/.test(des), 'despensa.js nunca escreve em garrafas');
    ok(!/ofertaDia/.test(semCom(ler('js/state.js'))), 'state.js não devia ter ofertaDia');
    fs.readdirSync(path.join(RAIZ, 'js')).filter(function (f) { return /\.js$/.test(f) && f !== 'despensa.js' && f !== 'estrada.js'; }).forEach(function (f) {
      ok(!/despensaOferecer|despensaBemParaOferecer/.test(semCom(ler('js/' + f))), 'js/' + f + ' não devia chamar as ofertas');
    });
    const puro = vm.createContext({});
    vm.runInContext('Math.random = function () { throw new Error("Math.random proibido"); }; Date.now = function () { throw new Error("Date.now proibido"); };', puro);
    vm.runInContext(src.dados, puro); vm.runInContext(src.despensa, puro);
    let erro = null;
    try { puro.__e = base({ queijo_azeitao: 2 }); vm.runInContext('despensaOferecer(__e, "2026-10-20"); despensaBemParaOferecer(__e);', puro); } catch (e) { erro = e.message; }
    ok(erro === null, 'as ofertas não podem usar Math.random nem Date.now: ' + erro);
  }
  return falhas;
}

let falhou = 0;
const reais = correrTestes(FONTES);
reais.forEach(function (m) { console.log('FALHA: ' + m); });
falhou += reais.length;

// ----- Provas negativas: estragar a regra de propósito tem de fazer o script falhar -----
const MUTANTES = [
  ['sem a regra "1 oferta por dia"', 'despensa', 'ultima !== null && ultima >= dia', 'false'],
  ['relógio atrás deixa oferecer (>= passa a ===)', 'despensa', 'ultima !== null && ultima >= dia', 'ultima !== null && ultima === dia'],
  ['+2 de Reputação em vez de +1', 'dados', 'ESTRADA_OFERTA_REPUTACAO = 1', 'ESTRADA_OFERTA_REPUTACAO = 2'],
  ['valida "sem bens" depois de alterar', 'despensa', "  const bem = despensaBemParaOferecer(estado);\n  if (bem === null) return recusa('sem_bens');\n\n  const e = despensaEstado(estado);", "  const e = despensaEstado(estado);\n  const bem = despensaBemParaOferecer(estado);\n  if (bem === null) return recusa('sem_bens');\n"],
  ['empate na ordem inversa', 'dados', "ordemEmpate: ['queijo_azeitao', 'mel_sesimbra', 'sal_sado', 'choco_sado']", "ordemEmpate: ['choco_sado', 'sal_sado', 'mel_sesimbra', 'queijo_azeitao']"],
  ['choco fora da ordem de empate', 'dados', "ordemEmpate: ['queijo_azeitao', 'mel_sesimbra', 'sal_sado', 'choco_sado']", "ordemEmpate: ['queijo_azeitao', 'mel_sesimbra', 'sal_sado']"],
  ['escolhe o bem de que há menos', 'despensa', 'return b.n - a.n || a.pos - b.pos;', 'return a.n - b.n || a.pos - b.pos;'],
  ['oferecer desce os recebidos (mexe no capítulo 7)', 'despensa', 'const r = despensaRegistarEntrega(estado, bem, 1);', 'const r = { ok: true }; e.recebidos[bem] = despensaInteiroValido(e.recebidos[bem]) - 1;'],
  ['oferecer desce state.garrafas', 'despensa', 'e.ofertaDia = dia;', 'e.ofertaDia = dia; estado.garrafas = estado.garrafas - 1;'],
  ['oferecer mexe no historico', 'despensa', 'e.ofertaDia = dia;', 'e.ofertaDia = dia; estado.adega.historico.pop();'],
  ['a oferta não regista o dia', 'despensa', 'e.ofertaDia = dia;', ''],
  ['a marca vai para state.visitas.hoje (a armadilha)', 'despensa', 'e.ofertaDia = dia;', 'estado.visitas = estado.visitas || {}; estado.visitas.hoje = { dia: dia, oferta: true };'],
  ['o desenho do botão grava', 'ecra', 'function estradaOfertaHtml() {', 'function estradaOfertaHtml() { saveState(state);'],
  ['o desenho oferece', 'ecra', "  const bem = despensaBemParaOferecer(state);\n  if (bem === null) return '';", "  despensaOferecer(state, dia);\n  const bem = despensaBemParaOferecer(state);\n  if (bem === null) return '';"],
  ['o clique não grava', 'ecra', '        saveState(state);\n        updateStatsDisplays();\n        estradaOfertaResultado', '        updateStatsDisplays();\n        estradaOfertaResultado'],
  ['o clique grava duas vezes', 'ecra', '        saveState(state);\n        updateStatsDisplays();\n        estradaOfertaResultado', '        saveState(state); saveState(state);\n        updateStatsDisplays();\n        estradaOfertaResultado'],
  ['o clique não atualiza a barra de cima', 'ecra', '        saveState(state);\n        updateStatsDisplays();\n        estradaOfertaResultado', '        saveState(state);\n        estradaOfertaResultado'],
  ['o clique não apaga o botão', 'ecra', "    if (botao) botao.disabled = true;\n    const visita = estradaVisitaTocadaHoje();", '    const visita = estradaVisitaTocadaHoje();'],
  ['recusar também grava', 'ecra', '        estradaOfertaResultado = { dia: dia, personagem: visita.personagem, bem: r.bem, reputacaoGanha: r.reputacaoGanha };\n      }', '        estradaOfertaResultado = { dia: dia, personagem: visita.personagem, bem: r.bem, reputacaoGanha: r.reputacaoGanha };\n      } else { saveState(state); }'],
  ['o botão aparece sem a visita tocada', 'ecra', 'r.feita !== true || ', ''],
  ['o botão aparece com a Estrada trancada', 'ecra', "if (typeof ecraDesbloqueado !== 'function' || !ecraDesbloqueado('estrada')) return '';\n  const visita", 'const visita'],
  ['o botão aparece sem bens', 'ecra', "  if (bem === null) return '';\n  return '<div class=\"mini-bloco\"><button", "  return '<div class=\"mini-bloco\"><button"],
  ['sem a linha "Já ofereceste hoje"', 'ecra', "if (ultima !== null && ultima >= dia) return '<div class=\"mini-bloco\"><p class=\"oferta-linha\">' + t('oferta.jaHoje') + '</p></div>';", ''],
  ['sem a fala especial', 'ecra', "(fala ? '<p class=\"oferta-fala\">«' + cadernoEscapar(estradaTexto(fala.texto)) + '»</p>' : '')", "''"],
  ['a linha da visita já não liga a oferta', 'visitas', "typeof estradaOfertaHtml === 'function' ? estradaOfertaHtml() : ''", "''"]
];
MUTANTES.forEach(function (m) {
  const nome = m[0], onde = m[1], de = m[2], para = m[3];
  if (FONTES[onde].indexOf(de) === -1) { console.log('FALHA: mutante "' + nome + '" não se aplicou (o texto mudou?): ' + de.slice(0, 70)); falhou++; return; }
  const src = Object.assign({}, FONTES); src[onde] = FONTES[onde].split(de).join(para);
  let f;
  try { f = correrTestes(src); } catch (e) { f = ['erro: ' + e.message]; }
  if (f.length === 0) { console.log('FALHA: o mutante "' + nome + '" passou nas verificações (as verificações não apanham este estrago)'); falhou++; }
});

console.log(falhou === 0 ? 'OK (' + MUTANTES.length + ' mutantes apanhados)' : falhou + ' FALHA(S)');
process.exit(falhou === 0 ? 0 : 1);
