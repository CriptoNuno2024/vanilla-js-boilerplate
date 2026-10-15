#!/usr/bin/env node
// O NÍVEL 13 REAL, «Moscatel de Palmela» (Parte 2, A Terra), que vive só como dados (dados/niveis.js, historias.js, enciclopedia.js e
// capitulos.js): o nível (5500 de Reputação), a história de 4 falas (a 1.ª com a foto assets/ecras/palmela_castelo.jpg, SEM som), as 3
// histórias de Palmela na Enciclopédia (nível mínimo 13, sem imagem) e o capítulo 13 «Do Castelo ao Mundo» (critério temIds nessas 3).
// Corre o jogo REAL (js/ e dados/) no ambiente simulado (módulo vm, scripts/_jogo-vm.js), em pt, en e es, e só LÊ: nada fica gravado.
// Mesmo molde de scripts/verificar-nivel-12.js (e do 11), tolerante a níveis seguintes.
//
// Prova:
//  (a) 5500 dá o nível 13 e 5499 ainda o 12; o nome do nível;
//  (b) a subida ao 13 mostra as 4 falas (textos exatos), com a foto da fala 1 que existe, e nenhuma com som;
//  (c) a história do 13 não aparece ao subir ao 12 nem ficando no 12;
//  (d) as 3 entradas não existem para o nível 12 e existem no 13 (textos exatos, nível mínimo 13, sem imagem); no 13 o Explorar entrega
//      as de Palmela e as da Arrábida e do Sado ainda por abrir (os três grupos de nivelMinimo) antes de qualquer outra, e no 12 nunca as de Palmela;
//  (e) o capítulo 13 só está ativo no nível 13 e cumpre-se, e celebra uma só vez, com as 3 desbloqueadas;
//  (f) no nível 12 com o capítulo 12 cumprido o cartão aponta para o capítulo do nível 13;
//  (g) nenhum NaN, undefined ou null; ecrãs trancados e jogador antigo certos com 13 níveis; o modo de teste ?capitulo=13;
//  (h) o estado guardado só tem ids e o jogo carrega bem se o pacote do nível 13 deixasse de existir (e não repete nada se voltar);
//  (i) o jogo até ao nível 12 (níveis 1 a 12, capítulos 1 a 12, histórias 2 a 12, as 32 de origem, a Arrábida e o Sado) fica igual.
//
// Uso: node scripts/verificar-nivel-13.js
// JS_DIR=pasta  DADOS_DIR=pasta  correm sobre outra versão dos js/ ou dos dados/ (para provar que o teste apanha o que se estraga).
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { abrirJogo } = require('./_jogo-vm');

const RAIZ = path.join(__dirname, '..');
const JS_DIR = process.env.JS_DIR || path.join(RAIZ, 'js');
const DADOS_DIR = process.env.DADOS_DIR || path.join(RAIZ, 'dados');
const LINGUAS = ['pt', 'en', 'es'];
let falhas = 0;
function ok(cond, msg) { if (!cond) { falhas++; console.log('FALHA: ' + msg); } }
function js(o) { return JSON.stringify(o); }
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }

// ----- O pacote, tal como foi pedido (escrito à parte, não lido de dados/) -----
const NOME = { pt: 'Moscatel de Palmela', en: 'Palmela Moscatel', es: 'Moscatel de Palmela' };
const NOME_ANT = { pt: 'Moscatel do Sado', en: 'Sado Moscatel', es: 'Moscatel del Sado' };
const FOTO = 'assets/ecras/palmela_castelo.jpg';
const FALAS = [
  {
    pt: 'Do alto do castelo de Palmela vê-se a terra toda: vinhas e mar. O YoshiCat sobe a colina para ver até onde chega a sua Quinta.',
    en: 'From the top of Palmela castle you can see the whole land: vineyards and sea. YoshiCat climbs the hill to see how far his Quinta reaches.',
    es: 'Desde lo alto del castillo de Palmela se ve toda la tierra: viñedos y mar. YoshiCat sube la colina para ver hasta dónde llega su Quinta.'
  },
  {
    pt: 'O castelo foi tomado aos mouros no século XII. Mais tarde foi entregue à Ordem de Santiago, no tempo de D. Sancho I. Hoje, o antigo convento é uma pousada.',
    en: 'The castle was taken from the Moors in the 12th century. Later it was given to the Order of Santiago, in the time of King Sancho I. Today, the old convent is an inn.',
    es: 'El castillo fue tomado a los moros en el siglo XII. Más tarde fue entregado a la Orden de Santiago, en tiempos de Sancho I. Hoy, el antiguo convento es una posada.'
  },
  {
    pt: 'Palmela é também terra de gente que foi longe. Hermenegildo Capelo nasceu aqui em 1841 e atravessou África, de Angola a Moçambique, com Roberto Ivens.',
    en: 'Palmela is also a land of people who went far. Hermenegildo Capelo was born here in 1841 and crossed Africa, from Angola to Mozambique, with Roberto Ivens.',
    es: 'Palmela es también tierra de gente que llegó lejos. Hermenegildo Capelo nació aquí en 1841 y atravesó África, de Angola a Mozambique, con Roberto Ivens.'
  },
  {
    pt: 'Abriu: novas histórias de Palmela na Enciclopédia.',
    en: 'Unlocked: new stories about Palmela in the Encyclopedia.',
    es: 'Se abrió: nuevas historias de Palmela en la Enciclopedia.'
  }
];
const IDS = ['palmela_castelo', 'palmela_capelo', 'palmela_castelao'];
const IDS_11 = ['arrabida_biosfera', 'arrabida_plantas', 'arrabida_mar'];
const IDS_12 = ['sado_reserva', 'sado_golfinhos', 'sado_troia'];
const ENC = {
  palmela_castelo: {
    titulo: { pt: 'O Castelo de Palmela', en: 'Palmela Castle', es: 'El Castillo de Palmela' },
    texto: {
      pt: 'O castelo de Palmela foi tomado aos mouros no século XII e entregue depois à Ordem de Santiago. O antigo convento é hoje uma pousada.',
      en: 'Palmela castle was taken from the Moors in the 12th century and later given to the Order of Santiago. The old convent is now an inn.',
      es: 'El castillo de Palmela fue tomado a los moros en el siglo XII y entregado después a la Orden de Santiago. El antiguo convento es hoy una posada.'
    }
  },
  palmela_capelo: {
    titulo: { pt: 'Hermenegildo Capelo', en: 'Hermenegildo Capelo', es: 'Hermenegildo Capelo' },
    texto: {
      pt: 'Hermenegildo Capelo nasceu em Palmela, em 1841. Foi explorador e, com Roberto Ivens, atravessou África de Angola a Moçambique.',
      en: 'Hermenegildo Capelo was born in Palmela in 1841. He was an explorer and, with Roberto Ivens, crossed Africa from Angola to Mozambique.',
      es: 'Hermenegildo Capelo nació en Palmela en 1841. Fue explorador y, con Roberto Ivens, atravesó África de Angola a Mozambique.'
    }
  },
  palmela_castelao: {
    titulo: { pt: 'O Castelão de Palmela', en: 'The Castelão of Palmela', es: 'El Castelão de Palmela' },
    texto: {
      pt: 'Os vinhos tintos da DOC Palmela, reconhecida em 2009, levam pelo menos 67% de uva Castelão.',
      en: 'Red wines of the Palmela DOC, recognised in 2009, contain at least 67% Castelão grapes.',
      es: 'Los vinos tintos de la DOC Palmela, reconocida en 2009, llevan al menos un 67% de uva Castelão.'
    }
  }
};
const CAP = {
  titulo: { pt: 'Do Castelo ao Mundo', en: 'From the Castle to the World', es: 'Del Castillo al Mundo' },
  objetivo: { pt: 'Descobre as 3 histórias de Palmela na Enciclopédia.', en: 'Discover the 3 stories about Palmela in the Encyclopedia.', es: 'Descubre las 3 historias de Palmela en la Enciclopedia.' },
  conclusao: { pt: 'Castelo, exploradores e vinha: Palmela já faz parte da nossa história.', en: 'Castle, explorers and vineyards: Palmela is now part of our story.', es: 'Castillo, exploradores y viñedos: Palmela ya forma parte de nuestra historia.' }
};
const LIMIARES = [0, 15, 50, 120, 300, 600, 1000, 1500, 2100, 2800, 3650, 4550, 5500];
const REP_12 = 5499, REP_13 = 5500;
function nivelEsperado(rep) { let n = 1; LIMIARES.forEach(function (m, i) { if (rep >= m) n = i + 1; }); return n; }

// Abre o jogo REAL com a pasta dados/ (ou outra) e os ganchos de teste.
function abrir(opcoes) {
  const o = opcoes || {};
  const avisos = [];
  const g = abrirJogo({ jsDir: JS_DIR, dadosDir: o.dadosDir === undefined ? DADOS_DIR : o.dadosDir, explorar: true, ecraReal: true, estadoGuardado: o.estadoGuardado, aoAvisar: function (m) { avisos.push(m); } });
  g.avisos = avisos;
  g.ev(`
    var FALAS = []; var dialogoFila = []; var TIMEOUTS = [];
    mostrarFalas = function (m, n) { var l = Array.isArray(m) ? m : [m]; FALAS.push({ m: l, n: n }); dialogoFila = l; document.getElementById('app-dialogue').hidden = false; };
    setTimeout = function (f) { TIMEOUTS.push(f); return TIMEOUTS.length; };
    clearTimeout = function () {};
    document.querySelector = function () { return { id: 'screen-quinta' }; };
    function mostrarNovaEntrada() {} function atualizarDialogo() {}
    function faseRealAtual() { return 'repouso'; }
  `);
  return g;
}
// Reputação, nível já mostrado, capítulos concluídos (cap1 a cap(ate)) e a Enciclopédia à escolha. Por omissão cap1 a cap12 feitos.
function preparar(g, rep, nivelMostrado, abertas, ate) {
  g.ev(`
    state.acesso.jogadorAntigo = false; state.reputacao = ${rep}; state.niveis.nivelMostrado = ${nivelMostrado};
    state.encyclopedia.unlocked = ${js(abertas || [])}; state.conhecimento = 0;
    state.capitulos.iniciado = true; state.capitulos.celebradosMigrado = true;
    CAPITULOS_CONFIG.forEach(function (c) { var feito = c.nivel <= ${ate === undefined ? 12 : ate}; state.capitulos.concluidos[c.id] = feito; state.capitulos.celebrados[c.id] = feito; });
    delete state.capitulos.concluidos.cap13; delete state.capitulos.celebrados.cap13;
    FALAS.length = 0; TIMEOUTS.length = 0;
  `);
}
function lingua(g, l) { g.ev("currentLang = '" + l + "';"); }
function html(g, id) { return g.el(id).innerHTML; }
function limpo(texto, onde) { ok(!/NaN|undefined|null|Infinity/.test(texto), onde + ': tem NaN, undefined, null ou Infinity: ' + String(texto).slice(0, 200)); }
function semente(g, s) {
  g.ev(`
    var _rng = (function (a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })(${s});
    randInt = function (a, b) { return a + Math.floor(_rng() * (b - a + 1)); };
  `);
}
function idsAbertos(g) { return g.ev('state.encyclopedia.unlocked.slice()'); }
// Uma cópia da pasta dados/ SEM os pacotes do nível "desde" para cima (simula um pacote que deixou de existir, e os seguintes
// também): corta as chamadas nivel_N, historia_N e capN com N >= desde e as entradas de enciclopédia com nivelMinimo >= desde.
function dadosSem(desde) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nivel13-'));
  fs.readdirSync(DADOS_DIR).filter(function (f) { return /\.js$/.test(f); }).forEach(function (f) {
    const partes = fs.readFileSync(path.join(DADOS_DIR, f), 'utf8').split(/\n(?=dadosAcrescentar\()/);
    const ficam = partes.filter(function (p) {
      if (p.indexOf('dadosAcrescentar(') !== 0) return true;
      const id = /\bid: '([a-z0-9_]+)'/.exec(p);
      const porId = id && /^(?:nivel_|historia_|cap)(\d+)$/.exec(id[1]);
      if (porId && Number(porId[1]) >= desde) return false;
      const nm = /\bnivelMinimo: (\d+)/.exec(p);
      return !(nm && Number(nm[1]) >= desde);
    });
    fs.writeFileSync(path.join(dir, f), ficam.join('\n'));
  });
  return dir;
}

// =====================================================================
// (i) O jogo até ao nível 12 fica igual; o pacote é só o que se espera
// =====================================================================
{
  const base = abrir({ dadosDir: null });
  const sem13 = abrir({ dadosDir: dadosSem(13) });
  const g = abrir();
  ok(g.avisos.length === 0, '(i) carregar o jogo com dados/ não devia avisar nada: ' + g.avisos);
  ok(g.ev('NIVEIS_CONFIG.length') >= 13 && g.ev('CAPITULOS_CONFIG.length') >= 13 && Object.keys(g.ev('HISTORIA_NIVEIS')).join().indexOf('2,3,4,5,6,7,8,9,10,11,12,13') === 0, '(i) pelo menos 13 níveis, 13 capítulos e histórias dos níveis 2 a 13');
  ok(sem13.ev('NIVEIS_CONFIG.length') === 12 && sem13.ev('CAPITULOS_CONFIG.length') === 12 && sem13.ev('ENCYCLOPEDIA_ENTRIES.pt.length') === 38, '(i) preparação: sem o pacote do 13 o jogo tem 12 níveis, 12 capítulos e 38 entradas');
  // Níveis 1 a 12, capítulos 1 a 12, histórias 2 a 12 e as 38 entradas: iguais ao jogo sem o pacote do nível 13.
  ok(g.ev('JSON.stringify(NIVEIS_CONFIG.slice(0, 12))') === sem13.ev('JSON.stringify(NIVEIS_CONFIG)'), '(i) os níveis 1 a 12 ficam iguais');
  ok(g.ev('JSON.stringify(CAPITULOS_CONFIG.slice(0, 12))') === sem13.ev('JSON.stringify(CAPITULOS_CONFIG)'), '(i) os capítulos 1 a 12 ficam iguais');
  ok(g.ev('JSON.stringify([2,3,4,5,6,7,8,9,10,11,12].map(function (n) { return HISTORIA_NIVEIS[n]; }))') === sem13.ev('JSON.stringify([2,3,4,5,6,7,8,9,10,11,12].map(function (n) { return HISTORIA_NIVEIS[n]; }))'), '(i) as histórias dos níveis 2 a 12 ficam iguais');
  LINGUAS.forEach(function (l) {
    ok(g.ev('JSON.stringify(ENCYCLOPEDIA_ENTRIES.' + l + '.slice(0, 38))') === sem13.ev('JSON.stringify(ENCYCLOPEDIA_ENTRIES.' + l + ')'), '(i) as 32 entradas de hoje, a Arrábida e o Sado ficam iguais (' + l + ')');
  });
  ok(g.ev('JSON.stringify(ENCYCLOPEDIA_ENTRIES.pt.slice(0, 32))') === base.ev('JSON.stringify(ENCYCLOPEDIA_ENTRIES.pt)'), '(i) as 32 entradas de origem ficam iguais ao jogo sem dados/');
  ok(g.ev('Math.max.apply(null, Object.keys(NIVEL_NECESSARIO_POR_ECRA).map(function (k) { return NIVEL_NECESSARIO_POR_ECRA[k]; }))') === 10, '(i) nenhum ecrã novo: o mais alto continua a abrir no nível 10');
  ok(g.ev('NIVEIS_CONFIG[12].id') === 'nivel_13' && g.ev('NIVEIS_CONFIG[12].min') === 5500 && g.ev('CAPITULOS_CONFIG[12].id') === 'cap13' && g.ev('CAPITULOS_CONFIG[12].nivel') === 13, '(i) nivel_13 (5500) e cap13 (nível 13)');
  ok(JSON.stringify(g.ev('DADOS_ACRESCENTADOS.enciclopedia.map(function (e) { return e.id; })').slice(6, 9)) === JSON.stringify(IDS) && JSON.stringify(g.ev('ENCYCLOPEDIA_ENTRIES.pt.slice(38, 41).map(function (e) { return e.id; })')) === JSON.stringify(IDS), '(i) as 3 entradas de Palmela, por esta ordem, logo a seguir às da Arrábida e do Sado: ' + IDS);
  ok(g.ev('JSON.stringify(CAPITULOS_CONFIG[12].criterio)') === js([{ tipo: 'temIds', caminho: 'encyclopedia.unlocked', ids: IDS }]), '(i) o critério do cap13 é temIds nos 3 ids: ' + g.ev('JSON.stringify(CAPITULOS_CONFIG[12].criterio)'));
  ok(fs.existsSync(path.join(RAIZ, FOTO)), '(i) a foto da fala 1 existe em ' + FOTO);
  ok(!fs.existsSync(path.join(RAIZ, 'palmela_castelo.jpg')), '(i) não devia haver cópia da foto na raiz do repositório');
  ok(g.ev('HISTORIA_NIVEIS[13].length') === 4, '(i) a história do 13 tem 4 falas');
}

LINGUAS.forEach(function (l) {
  const L = ' [' + l + ']';

  // ===================================================================
  // (a) O nível
  // ===================================================================
  {
    const g = abrir(); lingua(g, l);
    ok(g.ev('nivelPelaReputacao(5499)') === 12 && g.ev('nivelPelaReputacao(5500)') === 13 && g.ev('nivelPelaReputacao(5501)') === 13 && g.ev('nivelPelaReputacao(4550)') === 12, '(a) 5499 dá o nível 12 e 5500 dá o 13' + L);
    ok(g.ev('nivelNome(NIVEIS_CONFIG[12])') === NOME[l], '(a) o nome do nível 13 é «' + NOME[l] + '»' + L + ': ' + g.ev('nivelNome(NIVEIS_CONFIG[12])'));
  }

  // ===================================================================
  // (b) e (c) A história: a subida ao 13 mostra as 4 falas; a do 13 não aparece ao subir ao 12
  // ===================================================================
  {
    const g = abrir(); lingua(g, l);
    preparar(g, 4550, 11);
    ok(g.ev('verificarSubidaNivel()') === true && g.ev('FALAS.length') === 1 && g.ev('FALAS[0].m.length') === 4, '(c) subir ao 12 mostra as 4 falas do nível 12' + L);
    const f12 = g.ev('JSON.stringify(FALAS)');
    ok(FALAS.every(function (f) { return f12.indexOf(f[l]) === -1; }) && f12.indexOf('palmela_castelo') === -1, '(c) a história do 13 não aparece ao subir ao 12' + L);
    preparar(g, REP_12, 12);
    ok(g.ev('verificarSubidaNivel()') === false && g.ev('FALAS.length') === 0, '(c) com 5499 (nível 12) não se mostra a história do 13' + L);
    preparar(g, REP_13, 12);
    ok(g.ev('verificarSubidaNivel()') === true, '(b) subir ao 13 devolve true' + L);
    ok(g.ev('state.niveis.nivelMostrado') === 13, '(b) o nível mostrado passa a 13' + L);
    ok(g.ev('FALAS.length') === 1 && g.ev('FALAS[0].n') === 'YoshiCat' && g.ev('FALAS[0].m.length') === 4, '(b) uma só fila de 4 falas, do YoshiCat' + L);
    const falas = g.ev('JSON.parse(JSON.stringify(FALAS[0].m))');
    falas.forEach(function (f, i) { ok(f.texto === FALAS[i][l], '(b) fala ' + (i + 1) + ' com o texto exato em ' + l + ': ' + f.texto); });
    ok(falas[0].foto === FOTO && fs.existsSync(path.join(RAIZ, falas[0].foto)), '(b) a fala 1 leva a foto ' + FOTO + ' e ela existe' + L);
    ok(falas.slice(1).every(function (f) { return f.foto === undefined; }), '(b) as falas 2 a 4 não levam foto' + L);
    ok(falas.every(function (f) { return f.som === undefined; }), '(b) nenhuma fala leva som (as falas não têm volume)' + L);
    limpo(js(falas), '(b) falas' + L);
    g.ev('FALAS.length = 0; mostrarHistoriaSubidaNivel(1, 13);');
    const todas = g.ev('JSON.parse(JSON.stringify(FALAS[0].m))');
    ok(todas.length === 27 + 4 + 4 + 4 && todas[35].texto === FALAS[0][l] && todas[38].texto === FALAS[3][l], '(b) de 1 a 13 vêm as 27 falas de 2 a 10, as 4 do 11, as 4 do 12 e as 4 do 13 no fim' + L);
  }

  // ===================================================================
  // (d) As 3 entradas: nada no nível 12; no 13 existem e o Explorar entrega-as primeiro (com os três grupos de nivelMinimo)
  // ===================================================================
  {
    const g = abrir(); lingua(g, l);
    preparar(g, REP_12, 12);
    ok(g.ev('encyclopediaEntries().length') === 38 && IDS.every(function (id) { return g.ev('encyclopediaEntries().some(function (e) { return e.id === ' + js(id) + '; })') === false; }), '(d) no nível 12 só há as 32 de hoje, a Arrábida e o Sado (38)' + L);
    g.ev('renderEnciclopedia();');
    let h = html(g, 'enciclopedia-container');
    ok((h.match(/encyclopedia-card/g) || []).length === 38 && h.indexOf('0 / 38') !== -1, '(d) nível 12: a Enciclopédia tem 38 cartões, nenhum de Palmela' + L);
    ok(IDS.every(function (id) { return h.indexOf(esc(ENC[id].titulo[l])) === -1; }), '(d) nível 12: nenhum título de Palmela' + L);
    ok(IDS.every(function (id) { return g.ev('desbloquearEntradaEnciclopedia(' + js(id) + ')') === null; }) && idsAbertos(g).length === 0, '(d) nível 12: não se desbloqueiam, por ação nenhuma' + L);
    semente(g, 11);
    for (let i = 0; i < 80; i++) g.ev('enterExplorar();');
    ok(IDS.every(function (id) { return idsAbertos(g).indexOf(id) === -1; }), '(d) nível 12: o Explorar nunca as entrega (80 cliques)' + L);
    ok(IDS_11.concat(IDS_12).every(function (id) { return idsAbertos(g).indexOf(id) !== -1; }), '(d) nível 12: mas entrega as da Arrábida e do Sado' + L);

    // nível 13: existem, com os textos exatos
    preparar(g, REP_13, 13);
    ok(g.ev('encyclopediaEntries().length') === 41, '(d) nível 13: 41 entradas' + L);
    IDS.forEach(function (id) {
      const e = g.ev('encyclopediaEntries().filter(function (e) { return e.id === ' + js(id) + '; })[0]');
      ok(e && e.titulo === ENC[id].titulo[l] && e.texto === ENC[id].texto[l] && e.nivelMinimo === 13 && e.imagem === undefined, '(d) ' + id + ': título e texto exatos, nível mínimo 13, sem imagem' + L);
    });
    g.ev('renderEnciclopedia();');
    h = html(g, 'enciclopedia-container');
    ok((h.match(/encyclopedia-card/g) || []).length === 41 && h.indexOf('0 / 41') !== -1, '(d) nível 13: a Enciclopédia tem 41 cartões (as 3 novas bloqueadas) e 0 / 41' + L);
    preparar(g, REP_13, 13, IDS);
    g.ev('renderEnciclopedia();');
    h = html(g, 'enciclopedia-container');
    ok(IDS.every(function (id) { return h.indexOf('<h3>' + esc(ENC[id].titulo[l]) + '</h3>') !== -1 && h.indexOf('<p>' + esc(ENC[id].texto[l]) + '</p>') !== -1; }), '(d) nível 13: abertas, mostram o título e o texto (escapados)' + L);
    ok(h.indexOf('3 / 41') !== -1 && h.indexOf('<img') === -1, '(d) nível 13: 3 / 41 e sem imagens' + L);
    limpo(h, '(d) Enciclopédia' + L);
  }
  {
    // Três grupos de nivelMinimo (11, 12 e 13): no nível 13 as da Arrábida e do Sado ainda por abrir e as de Palmela contam todas como
    // disponíveis e saem as 9 (por qualquer ordem) antes de qualquer outra.
    for (let s = 1; s <= 25; s++) {
      const g = abrir(); lingua(g, l);
      preparar(g, REP_13, 13); semente(g, s * 7 + (l === 'pt' ? 0 : l === 'en' ? 1 : 2));
      const saidas = [];
      for (let i = 0; i < 12; i++) { g.ev('enterExplorar();'); const a = idsAbertos(g); saidas.push(a[a.length - 1]); }
      const nove = IDS_11.concat(IDS_12, IDS);
      ok(saidas.slice(0, 9).slice().sort().join() === nove.slice().sort().join(), '(d) semente ' + s + L + ': as 9 primeiras entregas são as 9 com nivelMinimo: ' + saidas.slice(0, 9));
      ok(saidas.slice(9).every(function (id) { return nove.indexOf(id) === -1; }) && new Set(saidas).size === 12, '(d) semente ' + s + L + ': depois só as outras, sem repetir');
    }
    // Com a Arrábida aberta, as 6 primeiras são as do Sado e de Palmela; com a Arrábida e o Sado abertos, as 3 primeiras são as de Palmela.
    for (let s = 1; s <= 10; s++) {
      const g = abrir(); lingua(g, l);
      preparar(g, REP_13, 13, IDS_11); semente(g, s * 13);
      const saidas = [];
      for (let i = 0; i < 8; i++) { g.ev('enterExplorar();'); const a = idsAbertos(g); saidas.push(a[a.length - 1]); }
      ok(saidas.slice(0, 6).slice().sort().join() === IDS_12.concat(IDS).sort().join() && saidas.slice(6).every(function (id) { return IDS.indexOf(id) === -1 && IDS_12.indexOf(id) === -1 && IDS_11.indexOf(id) === -1; }), '(d) semente ' + s + L + ': com a Arrábida aberta, as 6 primeiras são as do Sado e de Palmela: ' + saidas);
      const g2 = abrir(); lingua(g2, l);
      preparar(g2, REP_13, 13, IDS_11.concat(IDS_12)); semente(g2, s * 17);
      const s2 = [];
      for (let i = 0; i < 5; i++) { g2.ev('enterExplorar();'); const a = idsAbertos(g2); s2.push(a[a.length - 1]); }
      ok(s2.slice(0, 3).slice().sort().join() === IDS.slice().sort().join() && s2.slice(3).every(function (id) { return IDS.indexOf(id) === -1; }), '(d) semente ' + s + L + ': com a Arrábida e o Sado abertos, as 3 primeiras são as de Palmela: ' + s2);
    }
  }

  // ===================================================================
  // (e) e (f) O capítulo 13
  // ===================================================================
  {
    const g = abrir(); lingua(g, l);
    const ui = g.ev("cStr('ui')");
    // (f) nível 12 com os capítulos 1 a 12 cumpridos: o cartão aponta para o capítulo do nível 13
    preparar(g, REP_12, 12);
    g.ev('atualizarCapituloQuinta();');
    const c12 = html(g, 'capitulo-container');
    ok(c12.indexOf(ui.proximo.replace('{n}', 13)) !== -1 && c12.indexOf(ui.todos) === -1, '(f) nível 12 com o cap12 cumprido: «' + ui.proximo.replace('{n}', 13) + '», não «' + ui.todos + '»' + L + ': ' + c12);
    ok(c12.indexOf(esc(CAP.titulo[l])) === -1, '(f) nível 12: o capítulo 13 ainda não está ativo (título escondido)' + L);
    limpo(c12, '(f) cartão do capítulo no nível 12' + L);
    // (e) nível 13: ativo
    preparar(g, REP_13, 13);
    g.ev('atualizarCapituloQuinta();');
    const c13 = html(g, 'capitulo-container');
    ok(c13.indexOf(esc(CAP.titulo[l])) !== -1 && c13.indexOf(esc(CAP.objetivo[l])) !== -1 && c13.indexOf('0 / 3') !== -1, '(e) nível 13: o cartão mostra o título, o objetivo e 0 / 3' + L + ': ' + c13);
    limpo(c13, '(e) cartão do capítulo no nível 13' + L);
    ok(g.ev("cStr('cap13').titulo") === CAP.titulo[l] && g.ev("cStr('cap13').objetivo") === CAP.objetivo[l], '(e) título e objetivo do cap13 exatos' + L);
    // com o cap12 por cumprir, o cartão continua no cap12 (o primeiro por cumprir)
    preparar(g, REP_13, 13, [], 11);
    g.ev('atualizarCapituloQuinta();');
    const cartaoAntes = html(g, 'capitulo-container');
    ok(cartaoAntes.indexOf(ui.rotulo + ' 12 · ') !== -1 && cartaoAntes.indexOf(esc(CAP.titulo[l])) === -1, '(e) com o cap12 por cumprir, o cartão mostra o cap12 (e não o cap13)' + L + ': ' + cartaoAntes);
    preparar(g, REP_13, 13, [IDS[1]]);
    g.ev('atualizarCapituloQuinta();');
    ok(html(g, 'capitulo-container').indexOf('1 / 3') !== -1, '(e) com 1 das 3: 1 / 3' + L);
    ok(g.ev('capitulosAvaliarCelebracao()') === false && g.ev('FALAS.length') === 0, '(e) com 1 das 3 não celebra' + L);
    g.ev('state.encyclopedia.unlocked.push(' + js(IDS[0]) + ');');
    g.ev('atualizarCapituloQuinta();');
    ok(html(g, 'capitulo-container').indexOf('2 / 3') !== -1 && g.ev('capitulosAvaliarCelebracao()') === false, '(e) com 2 das 3: 2 / 3, não celebra' + L);
    g.ev('state.encyclopedia.unlocked.push(' + js(IDS[2]) + ');');
    ok(g.ev('capitulosAvaliarCelebracao()') === true, '(e) com as 3 celebra' + L);
    ok(g.ev('FALAS.length') === 1 && g.ev('FALAS[0].m[0]') === CAP.conclusao[l], '(e) a conclusão exata em ' + l + L + ': ' + g.ev('FALAS[0].m[0]'));
    ok(g.ev('capitulosAvaliarCelebracao()') === true && g.ev('FALAS.length') === 1 && g.ev('TIMEOUTS.length') === 1, '(e) com a festa pendente não agenda outra' + L);
    g.ev('TIMEOUTS[0]();');
    ok(g.ev('state.capitulos.concluidos.cap13') === true && g.ev('state.capitulos.celebrados.cap13') === true, '(e) depois da confirmação fica concluído e celebrado' + L);
    ok(g.ev('capitulosAvaliarCelebracao()') === false && g.ev('FALAS.length') === 1, '(e) só celebra uma vez' + L);
    g.ev('atualizarCapituloQuinta();');
    const seguinte = g.ev("CAPITULOS_CONFIG.filter(function (c) { return state.capitulos.concluidos[c.id] !== true; }).map(function (c) { return c.nivel; })[0]");
    const cartaoFim = html(g, 'capitulo-container');
    ok(seguinte === undefined ? cartaoFim.indexOf(ui.todos) !== -1 : cartaoFim.indexOf(ui.proximo.replace('{n}', seguinte)) !== -1, '(e) cumprido o cap13, o cartão diz ' + (seguinte === undefined ? 'que estão todos cumpridos' : 'o próximo capítulo no nível ' + seguinte) + L + ': ' + cartaoFim);
    // Pelo Explorar de ponta a ponta, com a Arrábida e o Sado já abertos: 3 cliques cumprem o capítulo 13
    const g2 = abrir(); lingua(g2, l);
    preparar(g2, REP_13, 13, IDS_11.concat(IDS_12)); semente(g2, 99);
    for (let i = 0; i < 3; i++) g2.ev('enterExplorar();');
    ok(g2.ev('capitulosAvaliarCelebracao()') === true && g2.ev('FALAS[0].m[0]') === CAP.conclusao[l], '(e) 3 cliques no Explorar chegam para cumprir o capítulo 13' + L);
  }

  // ===================================================================
  // (g) Sem NaN/undefined/null; ecrãs trancados e jogador antigo com 13 níveis
  // ===================================================================
  {
    const g = abrir(); lingua(g, l);
    const ecras = Object.keys(g.ev('NIVEL_NECESSARIO_POR_ECRA'));
    [0, 1, 14, 15, 49, 50, 119, 120, 2799, 2800, 2900, 3649, 3650, 3651, 4000, 4549, 4550, 4551, 5000, 5499, 5500, 5501, 6000].forEach(function (rep) {
      const n = nivelEsperado(rep);
      const onde = 'reputação ' + rep + L;
      preparar(g, rep, n);
      ok(g.ev('nivelPelaReputacao(state.reputacao)') === n, '(g) o nível devia ser ' + n + ' com ' + onde);
      g.ev('atualizarCartaoNivelQuinta(); atualizarResumoQuinta(); atualizarCapituloQuinta();');
      const h = html(g, 'nivel-container');
      limpo(h, '(g) cartão do nível, ' + onde);
      limpo(html(g, 'capitulo-container'), '(g) cartão do capítulo, ' + onde);
      limpo(g.el('quinta-resumo-linha').textContent, '(g) resumo, ' + onde);
      ok(h.indexOf(g.ev("t('nivel.label')") + ' ' + n + ' · ') !== -1, '(g) o cartão diz o nível ' + n + ' com ' + onde + ': ' + h);
      if (n < 13) {
        const prox = LIMIARES[n];
        const pct = Math.round(Math.min(rep, prox) / prox * 100);
        ok(h.indexOf('width:' + pct + '%') !== -1 && h.indexOf(Math.min(rep, prox) + ' / ' + prox) !== -1, '(g) a barra está a ' + pct + '% (' + Math.min(rep, prox) + ' / ' + prox + ') com ' + onde + ': ' + h);
        if (n === 12) ok(h.indexOf(esc(NOME_ANT[l])) !== -1, '(g) no nível 12 o cartão mostra o seu nome «' + NOME_ANT[l] + '»' + L);
      } else {
        ok(h.indexOf(esc(NOME[l])) !== -1, '(g) no nível 13 o cartão mostra «' + NOME[l] + '» com ' + onde + ': ' + h);
        // Com um nível 14 em dados/ a barra vai até ao seu limiar; sem ele o 13 é o máximo e a barra está cheia.
        const prox13 = g.ev('NIVEIS_CONFIG.length > 13 ? NIVEIS_CONFIG[13].min : null');
        if (prox13 === null) ok(h.indexOf('width:100%') !== -1 && h.indexOf(g.ev("t('nivel.maximo')")) !== -1, '(g) sem nível 14, o 13 é o máximo e a barra está cheia com ' + onde + ': ' + h);
        else ok(h.indexOf('width:' + Math.round(Math.min(rep, prox13) / prox13 * 100) + '%') !== -1 && h.indexOf(rep + ' / ' + prox13) !== -1, '(g) no nível 13 a barra vai até ao nível seguinte (' + prox13 + ') com ' + onde + ': ' + h);
      }
      ecras.forEach(function (e) {
        const preciso = g.ev('NIVEL_NECESSARIO_POR_ECRA.' + e);
        ok(g.ev("ecraDesbloqueado('" + e + "')") === (n >= preciso), '(g) o ecrã ' + e + ' (nível ' + preciso + ') devia estar ' + (n >= preciso ? 'aberto' : 'trancado') + ' com ' + onde);
        if (n < preciso) {
          g.ev('FALAS.length = 0; mostrarMensagemTrancada(' + js(e) + ');');
          const msg = g.ev('FALAS[0].m[0]');
          limpo(msg, '(g) mensagem do ecrã ' + e + ' trancado, ' + onde);
          ok(msg.indexOf(String(LIMIARES[preciso - 1] - rep)) !== -1, '(g) a mensagem do ecrã ' + e + ' diz quanto falta com ' + onde + ': ' + msg);
        }
      });
      g.ev('state.acesso.jogadorAntigo = true;');
      ecras.forEach(function (e) { ok(g.ev("ecraDesbloqueado('" + e + "')") === true, '(g) jogador antigo: o ecrã ' + e + ' aberto com ' + onde); });
      // O jogador antigo não salta o nível mínimo das histórias novas.
      if (n < 13) ok(g.ev('encyclopediaEntries().length') === (n < 11 ? 32 : n < 12 ? 35 : 38), '(g) jogador antigo abaixo do 13: continua sem as 3 de Palmela com ' + onde);
      g.ev('state.acesso.jogadorAntigo = false;');
    });
    // O modo de teste ?capitulo=13 mostra a celebração do cap13 (e continua a aceitar 1 a 12).
    const t13 = abrir(); lingua(t13, l);
    ['13', 'cap13'].forEach(function (v) { t13.ev("location.search = '?capitulo=" + v + "';"); ok((t13.ev('capitulosParametrosTeste()') || {}).id === 'cap13', '(g) ?capitulo=' + v + ' é válido' + L); });
    [1, 5, 10, 11, 12].forEach(function (n) { t13.ev("location.search = '?capitulo=" + n + "';"); ok((t13.ev('capitulosParametrosTeste()') || {}).id === 'cap' + n, '(g) ?capitulo=' + n + ' continua válido' + L); });
    ['99', '0', '013', '1a', '100', 'cap_13', ''].forEach(function (v) { t13.ev("location.search = '?capitulo=" + v + "';"); ok(t13.ev('capitulosParametrosTeste()') === null, '(g) ?capitulo=' + v + ' não é válido' + L); });
    t13.ev("location.search = '?capitulo=13';");
    preparar(t13, 100, 1);
    ok(t13.ev('capitulosCelebracaoDeTeste()') === true && t13.ev('FALAS[FALAS.length - 1].m[0]') === CAP.conclusao[l], '(g) o modo de teste ?capitulo=13 mostra a conclusão do cap13' + L);
  }
});

// =====================================================================
// (h) O estado guardado só tem ids; o jogo carrega bem sem o pacote do 13; e se voltar nada se repete
// =====================================================================
{
  const a = abrir(); lingua(a, 'pt');
  preparar(a, REP_13, 12, IDS_11.concat(IDS_12));
  a.ev('verificarSubidaNivel();');
  semente(a, 5);
  for (let i = 0; i < 3; i++) a.ev('enterExplorar();');
  a.ev('capitulosAvaliarCelebracao(); TIMEOUTS.forEach(function (f) { f(); }); saveState(state);');
  const salvo = a.guardado.yoshicat_quinta_state_v2;
  ok(typeof salvo === 'string' && salvo.length > 100, '(h) o jogo A gravou o estado');
  const estado = JSON.parse(salvo);
  ok(IDS.every(function (id) { return estado.encyclopedia.unlocked.indexOf(id) !== -1; }) && estado.niveis.nivelMostrado === 13 && estado.capitulos.concluidos.cap13 === true && estado.capitulos.celebrados.cap13 === true, '(h) o estado guarda os 3 ids, o nível mostrado 13 e o cap13 concluído e celebrado');
  const textos = [].concat(LINGUAS.map(function (l) { return NOME[l]; }), FALAS.map(function (f) { return f.pt; }), FALAS.map(function (f) { return f.en; }), FALAS.map(function (f) { return f.es; }));
  IDS.forEach(function (id) { LINGUAS.forEach(function (l) { textos.push(ENC[id].titulo[l], ENC[id].texto[l]); }); });
  LINGUAS.forEach(function (l) { textos.push(CAP.titulo[l], CAP.objetivo[l], CAP.conclusao[l]); });
  ok(textos.every(function (t) { return salvo.indexOf(t) === -1; }), '(h) o estado guardado não leva nenhum texto do pacote (só ids)');
  ok(salvo.indexOf('palmela_castelo.jpg') === -1 && salvo.indexOf('nivelMinimo') === -1, '(h) nem a foto nem o nível mínimo');

  // Jogo B: o pacote do nível 13 deixou de existir (os níveis 11 e 12 ficam).
  const b = abrir({ dadosDir: dadosSem(13), estadoGuardado: salvo });
  lingua(b, 'pt');
  b.ev('state.reputacao = ' + (REP_13 + 50) + ';');
  let erro = null;
  try { b.ev('atualizarCartaoNivelQuinta(); atualizarResumoQuinta(); atualizarCapituloQuinta(); renderEnciclopedia(); enterExplorar();'); } catch (e) { erro = e.message; }
  ok(erro === null, '(h) o jogo B (sem o pacote do 13) desenha o cartão do nível, do capítulo, a Enciclopédia e o Explorar sem erro: ' + erro);
  const hb = html(b, 'nivel-container') + html(b, 'capitulo-container') + html(b, 'enciclopedia-container') + html(b, 'explorar-container') + b.el('quinta-resumo-linha').textContent;
  limpo(hb, '(h) jogo B');
  ok(b.ev('nivelPelaReputacao(state.reputacao)') === 12 && html(b, 'nivel-container').indexOf(b.ev("t('nivel.maximo')")) !== -1, '(h) sem o pacote do 13 o jogador é do nível 12 (o máximo) e continua a jogar');
  ok(IDS.every(function (id) { return b.ev('state.encyclopedia.unlocked.indexOf(' + js(id) + ')') !== -1; }) && b.ev('state.capitulos.concluidos.cap13') === true, '(h) os ids soltos continuam guardados (nunca se apagam)');
  ok(html(b, 'enciclopedia-container').indexOf('/ 38') !== -1 && IDS.every(function (id) { return b.ev('encyclopediaEntries().some(function (e) { return e.id === ' + js(id) + '; })') === false; }), '(h) sem o pacote do 13 os ids soltos não contam nos totais (x / 38)');
  b.ev('state.reputacao += 10; saveState(state);');
  ok(b.ev('verificarSubidaNivel()') === false && b.ev('state.reputacao') === REP_13 + 60, '(h) o jogador B continua a ganhar Reputação sem subir');
  ['proteger', 'garrafa', 'explorar', 'colecao', 'estrada', 'lagar', 'camara', 'roxo', 'loja'].forEach(function (e) { ok(b.ev("ecraDesbloqueado('" + e + "')") === true, '(h) jogo B: o ecrã ' + e + ' aberto'); });

  // Jogo C: o pacote volta com o mesmo estado. Nada se repete.
  const c = abrir({ estadoGuardado: salvo }); lingua(c, 'pt');
  ok(c.ev('NIVEIS_CONFIG.length') >= 13 && c.ev('nivelPelaReputacao(state.reputacao)') === 13, '(h) com o pacote de volta, o jogador é outra vez do nível 13');
  ok(c.ev('verificarSubidaNivel()') === false && c.ev('FALAS.length') === 0, '(h) a história do 13 não se repete');
  ok(c.ev('capitulosAvaliarCelebracao()') === false, '(h) o capítulo 13 não celebra outra vez');
  ok(IDS.every(function (id) { return c.ev('desbloquearEntradaEnciclopedia(' + js(id) + ')') === null; }), '(h) as 3 já abertas não se abrem outra vez');
  c.ev('renderEnciclopedia();');
  ok(html(c, 'enciclopedia-container').indexOf('<h3>' + esc(ENC.palmela_castelao.titulo.pt) + '</h3>') !== -1, '(h) com o pacote de volta, as histórias aparecem abertas');
}

if (falhas) { console.log(falhas + ' falha(s)'); process.exit(1); }
console.log('OK');
