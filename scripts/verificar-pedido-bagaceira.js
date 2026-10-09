#!/usr/bin/env node
// A bagaceira paga pedidos na Estrada: o Sr. Armindo (pescador do Sado) passa a poder pedir 1 bagaceira
// (state.adega.bagaceira, ver js/alambique.js). Pedido do dia = o mesmo hash de sempre sobre ['uvas', 'sal_sado', 'bagaceira'].
//   - com bagaceira: a troca repetida paga-se com 1 bagaceira (a Despensa e as uvas ficam como estão);
//   - sem bagaceira: paga as 25 uvas como hoje (nunca fica bloqueado);
//   - a prova da 1.ª troca, os limites (1 por vizinho por dia, 3 por dia, 3 de cada bem, ficam 10 uvas) e os outros vizinhos não mudam;
//   - recusar nunca altera nada; o cartão mostra a linha do pedido, o botão e a fala (só humor) em PT/EN/ES.
// Corre js/ REAIS em vm (state.js, i18n.js, niveis.js, caderno.js, estrada-dados.js, alambique.js, despensa.js, estrada.js), sem browser
// nem conta real. Depois de passar, aplica "mutações" e confirma que o teste as apanha.
//
// Uso: node scripts/verificar-pedido-bagaceira.js
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const FICHEIROS = ['state.js', 'i18n.js', 'niveis.js', 'caderno.js', 'estrada-dados.js', 'alambique.js', 'despensa.js', 'estrada.js'];
const FONTES = {};
FICHEIROS.forEach(function (f) { FONTES[f] = fs.readFileSync(path.join(RAIZ, 'js', f), 'utf8'); });

function suite(fontes) {
  const falhas = [];
  function ok(cond, msg) { if (!cond) falhas.push(msg); }
  const semCom = function (s) { return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''); };

  function abrir() {
    const gravacoes = [];
    const elementos = {};
    const el = function (id) { return elementos[id] || (elementos[id] = { innerHTML: '' }); };
    const sb = {
      console: { log() {}, warn() {}, error() {} },
      localStorage: { getItem: function () { return null; }, setItem: function (k) { gravacoes.push(k); }, removeItem: function () {} },
      location: { search: '' }, URLSearchParams: URLSearchParams, Date: Date, setTimeout: function () {}, Image: function () {},
      document: { querySelectorAll: function () { return []; }, querySelector: function () { return { disabled: false }; }, getElementById: el, addEventListener: function () {} },
      Telegram: { WebApp: {} }
    };
    sb.window = sb;
    const cx = vm.createContext(sb);
    FICHEIROS.slice(0, 7).forEach(function (f) { vm.runInContext(fontes[f], cx, { filename: 'js/' + f }); });
    vm.runInContext(fontes['estrada.js'], cx, { filename: 'js/estrada.js' });
    vm.runInContext('this.diaLisboaDeHoje = function () { return __dia; }; this.atualizarDialogo = function () {}; this.updateStatsDisplays = function () {}; this.__dia = "2026-10-07";', cx);
    const g = { cx: cx, gravacoes: gravacoes };
    g.ev = function (c) { return vm.runInContext(c, cx); };
    g.json = function (c) { return JSON.parse(vm.runInContext('JSON.stringify(' + c + ')', cx)); };
    g.desenhar = function (lingua, dia) { vm.runInContext('currentLang = ' + JSON.stringify(lingua) + '; __dia = ' + JSON.stringify(dia) + '; renderEstrada();', cx); return el('estrada-container').innerHTML; };
    return g;
  }
  const g0 = abrir();

  // ---------------- Dias: o pedido do Sr. Armindo ----------------
  const pedido = function (viz, dia) { return g0.ev('despensaPedidoDoDia(' + JSON.stringify(viz) + ', ' + JSON.stringify(dia) + ')'); };
  const dias = [];
  for (let m = 1; m <= 4; m++) for (let d = 1; d <= 28; d++) dias.push('2026-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0'));
  const conta = { uvas: 0, sal_sado: 0, bagaceira: 0, outro: 0 };
  dias.forEach(function (d) { const p = pedido('sr_armindo', d); conta[p in conta ? p : 'outro']++; });
  ok(conta.uvas > 15 && conta.sal_sado > 15 && conta.bagaceira > 15 && conta.outro === 0, 'o Sr. Armindo pede uvas, sal e bagaceira em dias diferentes: ' + JSON.stringify(conta));
  ok(dias.every(function (d) { return pedido('sr_armindo', d) === pedido('sr_armindo', d); }), 'o pedido do dia é determinístico (o mesmo dia dá o mesmo pedido)');
  ok(dias.every(function (d) { return pedido('dona_amelia', d) === 'uvas' || pedido('dona_amelia', d) === 'sal_sado'; }), 'a Dona Amélia só pede uvas ou sal');
  ok(dias.every(function (d) { return pedido('sr_joaquim', d) === 'uvas' && pedido('tomas', d) === 'uvas'; }), 'o Sr. Joaquim e o Tomás pedem sempre uvas');
  ok(g0.ev('JSON.stringify(ESTRADA_PEDIDOS)') === '{"dona_amelia":["uvas","sal_sado"],"sr_joaquim":["uvas"],"tomas":["uvas"],"sr_armindo":["uvas","sal_sado","bagaceira"]}', 'ESTRADA_PEDIDOS: só o Sr. Armindo ganha a bagaceira');
  const DIA_B = dias.filter(function (d) { return pedido('sr_armindo', d) === 'bagaceira'; })[0];
  const DIA_B2 = dias.filter(function (d) { return pedido('sr_armindo', d) === 'bagaceira' && d !== DIA_B; })[3];
  const DIA_U = dias.filter(function (d) { return pedido('sr_armindo', d) === 'uvas'; })[0];
  const DIA_S = dias.filter(function (d) { return pedido('sr_armindo', d) === 'sal_sado'; })[0];
  const ANT = '2026-01-01';

  // Estado de um jogador com o choco já provado (troca repetida).
  const base = function (extra) {
    return Object.assign({
      uvas: 100, reputacao: 50, garrafas: 0, gotas: 5,
      adega: { bagaco: 7, aguardente: 2, bagaceira: 2, cooldowns: {}, lote: null, historico: [] },
      despensa: { recebidos: { choco_sado: 1 }, entregues: {}, primeiraTroca: { choco_sado: ANT }, hoje: { dia: null, feitas: {} } }
    }, extra || {});
  };
  const trocar = function (estado, viz, dia) {
    g0.cx.__e = estado;
    const r = g0.json('despensaTrocar(__e, ' + JSON.stringify(viz) + ', ' + JSON.stringify(dia) + ')');
    return JSON.parse(JSON.stringify({ r: r, e: g0.json('__e') }));
  };
  const copia = function (x) { return JSON.parse(JSON.stringify(x)); };
  const quantos = function (e, bem) { g0.cx.__e = e; return g0.ev('despensaQuantos(__e, ' + JSON.stringify(bem) + ')'); };

  // ---------------- 1. Com bagaceira: paga com 1 bagaceira ----------------
  {
    const e0 = base();
    const { r, e } = trocar(copia(e0), 'sr_armindo', DIA_B);
    ok(r.ok === true && r.pagou === 'bagaceira' && r.uvasGastas === 0 && r.bem === 'choco_sado' && r.primeiraVez === false && r.reputacaoGanha === 0, 'com bagaceira: paga com a bagaceira: ' + JSON.stringify(r));
    ok(e.adega.bagaceira === 1 && e.uvas === 100 && e.reputacao === 50, 'gasta 1 bagaceira e nenhuma uva nem Reputação');
    ok(quantos(e, 'choco_sado') === 2 && JSON.stringify(e.despensa.entregues) === '{}' && e.despensa.hoje.dia === DIA_B && e.despensa.hoje.feitas.sr_armindo === true, 'recebe o choco, a Despensa não gasta nada (entregues vazio) e marca a troca de hoje');
    ok(e.adega.bagaco === 7 && e.adega.aguardente === 2 && e.gotas === 5 && e.garrafas === 0, 'não mexe no Bagaço, na vínica, nas Gotas nem nas garrafas');
    // duplo clique: a 2.ª no mesmo dia é recusada e nada muda
    const dep = copia(e);
    const seg = trocar(copia(e), 'sr_armindo', DIA_B);
    ok(seg.r.ok === false && seg.r.motivo === 'ja_hoje' && JSON.stringify(seg.e) === JSON.stringify(dep), 'duplo clique: a segunda troca é recusada (ja_hoje) sem gastar outra bagaceira');
    // com poucas uvas, a bagaceira nunca deixa bloqueado
    const pobre = base({ uvas: 5 });
    const p = trocar(pobre, 'sr_armindo', DIA_B);
    ok(p.r.ok === true && p.r.pagou === 'bagaceira' && p.e.uvas === 5, 'com poucas uvas e 1 bagaceira, a troca faz-se (paga a bagaceira)');
  }
  // ---------------- 2. Sem bagaceira: 25 uvas, a bagaceira intacta ----------------
  [[0, 0], [undefined, undefined], [-3, -3], ['x', 'x'], [null, null], [0.5, 0.5], ['3', '3'], [[], []], [{}, {}], [true, true]].forEach(function (p) {
    const e0 = base(); if (p[0] === undefined) delete e0.adega.bagaceira; else e0.adega.bagaceira = p[0];
    const { r, e } = trocar(copia(e0), 'sr_armindo', DIA_B);
    ok(r.ok === true && r.pagou === 'uvas' && r.uvasGastas === 25 && e.uvas === 75, 'bagaceira ' + JSON.stringify(p[0]) + ': paga 25 uvas, deu ' + JSON.stringify(r));
    ok(JSON.stringify(e.adega.bagaceira) === JSON.stringify(p[1]) || (p[1] === undefined && e.adega.bagaceira === undefined), 'bagaceira ' + JSON.stringify(p[0]) + ': não se toca quando se paga em uvas');
    ok(quantos(e, 'choco_sado') === 2, 'recebe o choco na mesma');
  });
  { // sem adega
    const e0 = base(); delete e0.adega;
    const { r, e } = trocar(e0, 'sr_armindo', DIA_B);
    ok(r.ok === true && r.pagou === 'uvas' && e.uvas === 75 && e.adega === undefined, 'sem state.adega: paga 25 uvas sem criar nada');
    const sem = base({ uvas: 30 }); sem.adega.bagaceira = 0;
    const f = trocar(sem, 'sr_armindo', DIA_B);
    ok(f.r.ok === false && f.r.motivo === 'faltam_uvas', 'sem bagaceira e com 30 uvas: faltam uvas (como hoje)');
  }
  { // bagaceira fracionária reparada: 2.7 conta 2 e fica 1
    const e0 = base(); e0.adega.bagaceira = 2.7;
    const { r, e } = trocar(e0, 'sr_armindo', DIA_B);
    ok(r.pagou === 'bagaceira' && e.adega.bagaceira === 1, 'bagaceira 2.7 é reparada para 2 e gasta 1 (fica 1), ficou ' + e.adega.bagaceira);
  }
  // ---------------- 3. Recusar nunca altera nada (nem gasta a bagaceira) ----------------
  {
    const recusa = function (nome, e0, viz, dia, motivo) {
      const antes = JSON.stringify(e0);
      const { r, e } = trocar(copia(e0), viz, dia);
      ok(r.ok === false && r.motivo === motivo && JSON.stringify(e) === antes, nome + ': devia recusar (' + motivo + ') sem alterar nada, deu ' + JSON.stringify(r));
    };
    recusa('prateleira cheia', base({ despensa: { recebidos: { choco_sado: 3 }, entregues: {}, primeiraTroca: { choco_sado: ANT }, hoje: { dia: null, feitas: {} } } }), 'sr_armindo', DIA_B, 'prateleira_cheia');
    recusa('já trocou hoje', base({ despensa: { recebidos: { choco_sado: 1 }, entregues: {}, primeiraTroca: { choco_sado: ANT }, hoje: { dia: DIA_B, feitas: { sr_armindo: true } } } }), 'sr_armindo', DIA_B, 'ja_hoje');
    recusa('teto de 3 por dia', base({ despensa: { recebidos: { choco_sado: 1 }, entregues: {}, primeiraTroca: { choco_sado: ANT }, hoje: { dia: DIA_B, feitas: { dona_amelia: true, sr_joaquim: true, tomas: true } } } }), 'sr_armindo', DIA_B, 'teto_dia');
    recusa('relógio atrás', base({ despensa: { recebidos: { choco_sado: 1 }, entregues: {}, primeiraTroca: { choco_sado: ANT }, hoje: { dia: '2026-12-30', feitas: {} } } }), 'sr_armindo', DIA_B, 'dia_anterior');
    recusa('dia inválido', base(), 'sr_armindo', 'lixo', 'dia_invalido');
    recusa('vizinho inválido', base(), 'ninguem', DIA_B, 'id_invalido');
    ok(trocar(null, 'sr_armindo', DIA_B).r.motivo === 'estado_invalido', 'estado inválido recusa');
  }
  // ---------------- 4. A prova da 1.ª troca de cada bem não muda ----------------
  {
    const e0 = base({ despensa: { recebidos: {}, entregues: {}, primeiraTroca: {}, hoje: { dia: null, feitas: {} } } });
    const a = trocar(copia(e0), 'sr_armindo', DIA_B);
    ok(a.r.ok && a.r.primeiraVez === true && a.r.pagou === 'uvas' && a.r.uvasGastas === 25 && a.r.reputacaoGanha === 2 && a.e.adega.bagaceira === 2, 'a prova (1.ª troca) paga 25 uvas, dá +2 e NÃO gasta bagaceira');
    const comGarrafa = copia(e0); comGarrafa.garrafas = 1;
    const b = trocar(comGarrafa, 'sr_armindo', DIA_B);
    ok(b.r.pagou === 'garrafa' && b.e.despensa.garrafasDadas === 1 && b.e.adega.bagaceira === 2 && b.e.uvas === 100, 'a prova com garrafa leva a garrafa e NÃO gasta bagaceira');
  }
  // ---------------- 5. Os outros vizinhos e os outros pedidos ----------------
  {
    // sal continua a pagar-se com sal (Dona Amélia e Sr. Armindo)
    const DIA_SAL_AM = dias.filter(function (d) { return pedido('dona_amelia', d) === 'sal_sado'; })[0];
    const comSal = base({ despensa: { recebidos: { queijo_azeitao: 1, sal_sado: 2, choco_sado: 1 }, entregues: {}, primeiraTroca: { queijo_azeitao: ANT, sal_sado: ANT, choco_sado: ANT }, hoje: { dia: null, feitas: {} } } });
    const am = trocar(copia(comSal), 'dona_amelia', DIA_SAL_AM);
    ok(am.r.pagou === 'sal' && am.e.adega.bagaceira === 2 && am.e.despensa.entregues.sal_sado === 1, 'a Dona Amélia continua a pagar-se com sal e a bagaceira não se toca');
    const ar = trocar(copia(comSal), 'sr_armindo', DIA_S);
    ok(ar.r.pagou === 'sal' && ar.e.adega.bagaceira === 2, 'num dia de sal, o Sr. Armindo paga-se com sal e a bagaceira não se toca');
    const au = trocar(copia(base()), 'sr_armindo', DIA_U);
    ok(au.r.pagou === 'uvas' && au.r.uvasGastas === 25 && au.e.adega.bagaceira === 2, 'num dia de uvas, o Sr. Armindo paga 25 uvas e a bagaceira não se toca');
    // nenhum outro vizinho aceita bagaceira, mesmo com 2 no bolso
    let usou = false;
    dias.slice(0, 60).forEach(function (d, i) {
      ['dona_amelia', 'sr_joaquim', 'tomas'].forEach(function (v) {
        const bem = { dona_amelia: 'queijo_azeitao', sr_joaquim: 'sal_sado', tomas: 'mel_sesimbra' }[v];
        const rec = {}; rec[bem] = 1; const prim = {}; prim[bem] = ANT;
        const x = trocar(base({ despensa: { recebidos: rec, entregues: {}, primeiraTroca: prim, hoje: { dia: null, feitas: {} } } }), v, d);
        if (x.r.pagou === 'bagaceira' || x.e.adega.bagaceira !== 2) usou = true;
      });
    });
    ok(!usou, 'a Dona Amélia, o Sr. Joaquim e o Tomás nunca aceitam bagaceira');
    // limites: prateleira, 1 por dia por vizinho e teto de 3 mantêm-se com o pedido de bagaceira (ver recusas acima)
    ok(g0.ev('ESTRADA_TROCA.custoUvas') === 25 && g0.ev('ESTRADA_TROCA.uvasMinimasDepoisDaTroca') === 10 && g0.ev('ESTRADA_TROCA.prateleiraMaxima') === 3 && g0.ev('ESTRADA_TROCA.trocasPorDiaTeto') === 3 && g0.ev('ESTRADA_TROCA.trocasPorVizinhoPorDia') === 1 && g0.ev('ESTRADA_TROCA.reputacaoPrimeiraTroca') === 2, 'os limites das trocas não mudaram');
  }
  // ---------------- 6. Duas trocas de bagaceira em dias seguidos gastam uma de cada vez ----------------
  {
    let e = base(); e.adega.bagaceira = 2;
    const a = trocar(e, 'sr_armindo', DIA_B);
    const b = trocar(a.e, 'sr_armindo', DIA_B2);
    ok(a.r.pagou === 'bagaceira' && b.r.ok && b.r.pagou === 'bagaceira' && b.e.adega.bagaceira === 0 && quantos(b.e, 'choco_sado') === 3, 'dois dias de bagaceira gastam 1 de cada vez');
    const c = trocar(b.e, 'sr_armindo', dias.filter(function (d) { return pedido('sr_armindo', d) === 'bagaceira' && d > DIA_B2; })[0]);
    ok(c.r.ok === false && c.r.motivo === 'prateleira_cheia', 'com 3 chocos já não troca (prateleira cheia) e não gasta bagaceira');
  }
  ok(!/Math\.random|Date\.now|new Date/.test(semCom(fontes['despensa.js'])), 'despensa.js não usa Math.random, Date.now nem new Date');

  // ---------------- 7. O cartão da Estrada ----------------
  {
    const comB = abrir(); comB.ev('state.uvas = 100; state.despensa.recebidos = { choco_sado: 1 }; state.despensa.primeiraTroca = { choco_sado: "2026-01-01" }; state.adega.bagaceira = 2;');
    const semB = abrir(); semB.ev('state.uvas = 100; state.despensa.recebidos = { choco_sado: 1 }; state.despensa.primeiraTroca = { choco_sado: "2026-01-01" }; state.adega.bagaceira = 0;');
    const antes = comB.ev('JSON.stringify(state)');
    const L = {
      pt: { btn: 'Trocar por 1 bagaceira', tem: 'Hoje aceita 1 bagaceira (ou 25 uvas)', nao: 'Hoje aceita bagaceira ou 25 uvas', uvas: 'Trocar por 25 uvas', fala: 'Tens aí uma bagaceira, vizinho? Com ela, a troca fica combinada.', pagou: 'Pagaste 1 bagaceira' },
      en: { btn: 'Swap for 1 pomace spirit', tem: 'Today 1 pomace spirit is accepted (or 25 grapes)', nao: 'Today pomace spirit or 25 grapes are accepted', uvas: 'Swap for 25 grapes', fala: 'Got a pomace spirit there, neighbour? With that, we have a deal.', pagou: 'You paid 1 pomace spirit' },
      es: { btn: 'Cambiar por 1 aguardiente de orujo', tem: 'Hoy acepta 1 aguardiente de orujo (o 25 uvas)', nao: 'Hoy acepta aguardiente de orujo o 25 uvas', uvas: 'Cambiar por 25 uvas', fala: '¿Tienes por ahí un aguardiente de orujo, vecino? Con eso, trato hecho.', pagou: 'Pagaste 1 aguardiente de orujo' }
    };
    ['pt', 'en', 'es'].forEach(function (l) {
      const h = comB.desenhar(l, DIA_B);
      ok(h.indexOf(L[l].btn) !== -1 && h.indexOf(L[l].tem) !== -1 && h.indexOf(L[l].fala) !== -1, l + ': no dia de bagaceira, com bagaceira, o cartão mostra o botão, a linha do pedido e a fala');
      const s = semB.desenhar(l, DIA_B);
      ok(s.indexOf(L[l].btn) === -1 && s.indexOf(L[l].nao) !== -1 && s.indexOf(L[l].fala) !== -1 && s.indexOf(L[l].uvas) !== -1, l + ': sem bagaceira, o cartão mostra "ou 25 uvas", o botão das 25 uvas e a fala');
      const u = comB.desenhar(l, DIA_U);
      ok(u.indexOf(L[l].btn) === -1 && u.indexOf(L[l].fala) === -1 && u.indexOf(L[l].tem) === -1, l + ': num dia sem pedido de bagaceira, nada da bagaceira aparece');
    });
    ok(comB.ev('JSON.stringify(state)') === antes && comB.gravacoes.length === 0, 'desenhar o cartão não altera o estado nem grava');
    const est = comB.json('estradaEstadoCartao(state, ESTRADA_VIZINHOS[3], ' + JSON.stringify(DIA_B) + ')');
    ok(est.acao === 'bagaceira' && est.motivo === null && est.pedido === 'bagaceira', 'estradaEstadoCartao: ação bagaceira, botão ativo');
    ok(semB.json('estradaEstadoCartao(state, ESTRADA_VIZINHOS[3], ' + JSON.stringify(DIA_B) + ')').acao === 'uvas', 'sem bagaceira a ação é uvas');
    // clique: gasta, grava uma vez, mostra "Pagaste 1 bagaceira"; segundo clique no mesmo dia não faz nada
    comB.ev('__dia = ' + JSON.stringify(DIA_B) + ';');
    const g0n = comB.gravacoes.length;
    comB.ev('estradaTrocarClique("sr_armindo")');
    const h2 = comB.desenhar('pt', DIA_B);
    const g1n = comB.gravacoes.length;
    ok(comB.ev('state.adega.bagaceira') === 1 && g1n > g0n, 'clique: gasta 1 bagaceira e grava');
    comB.ev('estradaTrocarClique("sr_armindo")');
    ok(comB.ev('state.adega.bagaceira') === 1 && comB.gravacoes.length === g1n, 'segundo clique no mesmo dia: não gasta nem grava');
    comB.ev('estradaResultado = { vizinho: "sr_armindo", pagou: "bagaceira", uvasGastas: 0, bem: "choco_sado", reputacaoGanha: 0, primeiraVez: false }; void 0;');
    ['pt', 'en', 'es'].forEach(function (l) {
      comB.ev('currentLang = ' + JSON.stringify(l) + '; estradaDesenhar();');
      ok(comB.ev('document.getElementById("estrada-container").innerHTML').indexOf(L[l].pagou) !== -1, l + ': o resultado diz "' + L[l].pagou + '"');
    });
    void h2;
  }
  // ---------------- 8. Textos ----------------
  {
    const T = g0.json('TRANSLATIONS');
    const chaves = ['estrada.btnBagaceira', 'estrada.pedeBagaceiraTem', 'estrada.pedeBagaceiraNao', 'estrada.pagouBagaceira'];
    ['pt', 'en', 'es'].forEach(function (l) {
      chaves.forEach(function (k) { ok(typeof T[l][k] === 'string' && T[l][k].trim() !== '', l + ': falta ' + k); });
      ok(/\{n\}/.test(T[l]['estrada.pedeBagaceiraTem']) && /\{n\}/.test(T[l]['estrada.pedeBagaceiraNao']), l + ': as linhas do pedido têm {n}');
    });
    ok(Object.keys(T.pt).length === Object.keys(T.en).length && Object.keys(T.en).length === Object.keys(T.es).length, 'as 3 línguas têm o mesmo número de chaves');
    const estr = function (l) { return Object.keys(T[l]).filter(function (k) { return /^estrada\./.test(k); }).sort().join(); };
    ok(estr('pt') === estr('en') && estr('en') === estr('es'), 'as 3 línguas têm as mesmas chaves estrada.*');
    ok(/pomace spirit/.test(T.en['estrada.btnBagaceira']) && /aguardiente de orujo/.test(T.es['estrada.btnBagaceira']) && /bagaceira/.test(T.pt['estrada.btnBagaceira']), 'PT "bagaceira", EN "pomace spirit", ES "aguardiente de orujo"');
    const F = g0.json('ESTRADA_PEDIDO_FALAS');
    ok(F.bagaceira && F.bagaceira.semFacto === true && !F.bagaceira.fonte, 'a fala do pedido é só humor (semFacto: true, sem fonte)');
    ['pt', 'en', 'es'].forEach(function (l) {
      const x = F.bagaceira.texto[l];
      ok(typeof x === 'string' && x.length > 10 && x.length <= 110, l + ': fala do pedido existe e é curta');
      ok(!/\d|%|século|century|siglo|região|region|Setúbal|Sado|tradicional|traditional/i.test(x), l + ': a fala do pedido não afirma factos (números, região, tradição)');
    });
    ok(new Set(['pt', 'en', 'es'].map(function (l) { return F.bagaceira.texto[l]; })).size === 3, 'a fala é diferente nas 3 línguas');
    const dados = fontes['estrada-dados.js'];
    ok(!/está em pausa/.test(dados) && /bagaceira/.test(dados.slice(dados.indexOf('const ESTRADA_PEDIDOS') - 700, dados.indexOf('const ESTRADA_PEDIDOS'))), 'o comentário "O bagaço está em pausa" saiu (diz que a bagaceira paga o pedido do Sr. Armindo)');
  }
  // ---------------- 9. Sem estado novo, nuvem intacta ----------------
  {
    ok(g0.ev('Object.keys(defaultState().despensa).sort().join()') === 'entregues,hoje,primeiraTroca,recebidos', 'a Despensa não ganhou campos');
    ok(g0.ev('defaultState().adega.bagaceira') === 0, 'a bagaceira continua a ser o campo de sempre (0 por omissão)');
    ok(!/bagaceira|despensa/.test(fs.readFileSync(path.join(RAIZ, 'js', 'nuvem.js'), 'utf8')), 'nuvem.js não foi tocado');
  }
  return falhas;
}

let falhas = suite(FONTES);

function mutar(ficheiro, de, para) {
  if (FONTES[ficheiro].indexOf(de) === -1) { falhas.push('mutação impossível (texto não encontrado em ' + ficheiro + '): ' + de); return null; }
  const f = Object.assign({}, FONTES);
  f[ficheiro] = FONTES[ficheiro].split(de).join(para);
  return f;
}
const MUTACOES = [
  ['o Sr. Armindo deixa de pedir bagaceira', 'estrada-dados.js', "sr_armindo: ['uvas', 'sal_sado', 'bagaceira']", "sr_armindo: ['uvas', 'sal_sado']"],
  ['a Dona Amélia também pede bagaceira', 'estrada-dados.js', "dona_amelia: ['uvas', 'sal_sado'],", "dona_amelia: ['uvas', 'sal_sado', 'bagaceira'],"],
  ['o Tomás pede bagaceira', 'estrada-dados.js', "tomas: ['uvas'],", "tomas: ['uvas', 'bagaceira'],"],
  ['a bagaceira nunca paga (sempre uvas)', 'despensa.js', "despensaBagaceiras(estado) >= 1) pagou = 'bagaceira';", "despensaBagaceiras(estado) >= 99) pagou = 'bagaceira';"],
  ['paga com bagaceira mesmo na prova da 1.ª troca', 'despensa.js', "if (primeiraVez && despensaGarrafasDisponiveis(estado) >= 1) pagou = 'garrafa';", "if (primeiraVez && despensaBagaceiras(estado) >= 1 && despensaPedidoDoDia(vizinho, dia) === 'bagaceira') pagou = 'bagaceira';\n  else if (primeiraVez && despensaGarrafasDisponiveis(estado) >= 1) pagou = 'garrafa';"],
  ['não gasta a bagaceira', 'despensa.js', 'adega.bagaceira -= 1;', ''],
  ['gasta 2 bagaceiras', 'despensa.js', 'adega.bagaceira -= 1;', 'adega.bagaceira -= 2;'],
  ['gasta também uvas', 'despensa.js', 'adega.bagaceira -= 1;', 'adega.bagaceira -= 1; estado.uvas -= ESTRADA_TROCA.custoUvas;'],
  ['gasta do stock da Despensa', 'despensa.js', 'adega.bagaceira -= 1;', 'adega.bagaceira -= 1; despensaRegistarEntrega(estado, bem, 1);'],
  ['gasta a bagaceira antes de validar (recusar altera)', 'despensa.js', '  let pagou;', "  let pagou;\n  if (despensaBagaceiras(estado) >= 1 && despensaPedidoDoDia(vizinho, dia) === 'bagaceira') alambiqueEstado(estado).bagaceira -= 1;"],
  ['a bagaceira estranha não é reparada (negativa fica negativa)', 'despensa.js', 'const adega = alambiqueEstado(estado);', 'const adega = estado.adega;'],
  ['lê a bagaceira sem a sanear (negativa conta)', 'despensa.js', 'return alambiqueNumero(a.bagaceira);', 'return Number(a.bagaceira) || 0;'],
  ['o pedido de bagaceira exige uvas', 'despensa.js', "if (pagou === 'uvas' && uvas - T.custoUvas < T.uvasMinimasDepoisDaTroca) return recusa('faltam_uvas', bem);", "if (uvas - T.custoUvas < T.uvasMinimasDepoisDaTroca) return recusa('faltam_uvas', bem);"],
  ['o pedido do dia usa Math.random', 'despensa.js', 'return lista[despensaHash(dia + \':\' + v.id) % lista.length];', 'return lista[Math.floor(Math.random() * lista.length)];'],
  ['o cartão não mostra o botão da bagaceira', 'estrada.js', "else if (!primeiraVez && pedido === 'bagaceira' && despensaBagaceiras(estado) >= 1) acao = 'bagaceira';", ''],
  ['o cartão não mostra a linha do pedido', 'estrada.js', "if (!e.primeiraVez && e.pedido === 'bagaceira' && !e.motivo) {", "if (false) {"],
  ['o cartão não mostra a fala', 'estrada.js', "(falaPedido ? '<p class=\"estrada-fala\">«' + cadernoEscapar(estradaTexto(falaPedido.texto)) + '»</p>' : '')", "''"],
  ['o resultado não diz que pagou bagaceira', 'estrada.js', "else if (r.pagou === 'bagaceira') pagamento = t('estrada.pagouBagaceira');", ''],
  ['texto em falta (EN)', 'i18n.js', "'estrada.btnBagaceira': 'Swap for 1 pomace spirit',", ''],
  ['rótulo ES sem "orujo"', 'i18n.js', "'estrada.btnBagaceira': 'Cambiar por 1 aguardiente de orujo',", "'estrada.btnBagaceira': 'Cambiar por 1 aguardiente',"],
  ['a fala afirma um facto', 'estrada-dados.js', "pt: 'Tens aí uma bagaceira, vizinho? Com ela, a troca fica combinada.',", "pt: 'Tens aí uma bagaceira? No Sado, desde 1900, esta é a melhor.',"],
  ['a fala deixa de ser semFacto', 'estrada-dados.js', "  bagaceira: {\n    semFacto: true,", "  bagaceira: {\n    semFacto: false,"],
  ['o comentário do bagaço em pausa volta', 'estrada-dados.js', '// A Dona Amélia pede uvas ou sal; o Sr. Armindo pede', '// (O bagaço está em pausa.) A Dona Amélia pede uvas ou sal; o Sr. Armindo pede']
];
MUTACOES.forEach(function (m) {
  const f = mutar(m[1], m[2], m[3]);
  if (!f) return;
  let apanhada;
  try { apanhada = suite(f).length > 0; } catch (e) { apanhada = true; if (process.env.PEDIDO_DEBUG) console.log('(mutação que rebenta: ' + m[0] + ': ' + e.message.split('\n')[0] + ')'); }
  if (!apanhada) falhas.push('MUTAÇÃO NÃO APANHADA: ' + m[0]);
});

if (falhas.length) {
  falhas.slice(0, 40).forEach(function (m) { console.log('FALHA: ' + m); });
  console.log(falhas.length + ' falha(s)');
  process.exit(1);
}
console.log('OK (' + MUTACOES.length + ' mutações apanhadas)');
