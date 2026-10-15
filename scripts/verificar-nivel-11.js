#!/usr/bin/env node
// O NÍVEL 11 REAL, «Moscatel da Arrábida», que vive só como dados (dados/niveis.js, historias.js, enciclopedia.js, capitulos.js):
// o nível (3650 de Reputação), a história de 4 falas (a 1.ª com a foto assets/ecras/arrabida_colina.jpg, SEM som), as 3 histórias da
// Arrábida na Enciclopédia (nível mínimo 11) e o capítulo 11 «A Serra e o Mar» (critério temIds nessas 3). Corre o jogo REAL
// (js/ e dados/) no ambiente simulado (módulo vm, scripts/_jogo-vm.js), em pt, en e es, e só LÊ: nada fica gravado.
//
// Prova:
//  (a) 3650 dá o nível 11 e 3649 ainda o 10; o nome do nível;
//  (b) a subida ao 11 mostra as 4 falas (textos exatos), com a foto da fala 1 que existe, e nenhuma com som;
//  (c) a história do 11 não aparece ao subir ao 10 nem ficando no 10;
//  (d) as 3 entradas não existem para o nível 10 e existem no 11 (textos exatos); no nível 11 o Explorar entrega as 3 antes de qualquer outra;
//  (e) o capítulo 11 só está ativo no nível 11 e cumpre-se, e celebra uma só vez, com as 3 desbloqueadas;
//  (f) no nível 10, com o capítulo 10 cumprido, o cartão aponta para o capítulo do nível 11;
//  (g) nenhum NaN, undefined ou null; ecrãs trancados e jogador antigo certos com 11 níveis; o modo de teste ?capitulo=11;
//  (h) o estado guardado só tem ids e o jogo carrega bem se o pacote deixasse de existir (e não repete nada se voltar);
//  (i) o jogo de origem (níveis 1 a 10, as 32 histórias de hoje) fica igual.
//
// Uso: node scripts/verificar-nivel-11.js
// JS_DIR=pasta  DADOS_DIR=pasta  correm sobre outra versão dos js/ ou dos dados/ (para provar que o teste apanha o que se estraga).
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
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
const NOME = { pt: 'Moscatel da Arrábida', en: 'Arrábida Moscatel', es: 'Moscatel de la Arrábida' };
const FOTO = 'assets/ecras/arrabida_colina.jpg';
const FALAS = [
  {
    pt: 'Já ninguém fala só da Quinta: fala-se da terra inteira. Do alto da colina, o YoshiCat olha a Serra da Arrábida ao longe, com o mar do outro lado.',
    en: 'Nobody talks only about the Quinta anymore: people talk about the whole land. From the top of the hill, YoshiCat gazes at the Serra da Arrábida in the distance, with the sea on the other side.',
    es: 'Ya nadie habla solo de la Quinta: se habla de toda la tierra. Desde lo alto de la colina, YoshiCat mira la Sierra de la Arrábida a lo lejos, con el mar al otro lado.'
  },
  {
    pt: 'A serra guarda mato mediterrânico, pinhais, grutas e um mar cheio de vida. Tem mais de 1400 espécies de plantas: cerca de 40% de toda a flora de Portugal.',
    en: "The sierra holds Mediterranean scrubland, pine forests, caves and a sea full of life. It has over 1,400 plant species: about 40% of all of Portugal's flora.",
    es: 'La sierra guarda matorral mediterráneo, pinares, cuevas y un mar lleno de vida. Tiene más de 1400 especies de plantas: cerca del 40% de toda la flora de Portugal.'
  },
  {
    pt: 'Em setembro de 2025, a UNESCO fez da Arrábida uma Reserva da Biosfera. E é aqui, entre a serra e o mar, que também nasce o Moscatel de Setúbal.',
    en: 'In September 2025, UNESCO made the Arrábida a Biosphere Reserve. And it is here, between the sierra and the sea, that Moscatel de Setúbal is also born.',
    es: 'En septiembre de 2025, la UNESCO hizo de la Arrábida una Reserva de la Biosfera. Y es aquí, entre la sierra y el mar, donde también nace el Moscatel de Setúbal.'
  },
  {
    pt: 'Abriu: novas histórias da Arrábida na Enciclopédia.',
    en: 'Unlocked: new stories about the Arrábida in the Encyclopedia.',
    es: 'Se abrió: nuevas historias de la Arrábida en la Enciclopedia.'
  }
];
const IDS = ['arrabida_biosfera', 'arrabida_plantas', 'arrabida_mar'];
const ENC = {
  arrabida_biosfera: {
    titulo: { pt: 'A Arrábida, Reserva da Biosfera', en: 'The Arrábida, a Biosphere Reserve', es: 'La Arrábida, Reserva de la Biosfera' },
    texto: {
      pt: 'A 27 de setembro de 2025, a UNESCO reconheceu a Arrábida como Reserva da Biosfera, a 13.ª de Portugal. O pedido foi feito pelos municípios de Setúbal, Palmela e Sesimbra, com o ICNF.',
      en: "On 27 September 2025, UNESCO recognised the Arrábida as a Biosphere Reserve, the 13th in Portugal. The application was made by the municipalities of Setúbal, Palmela and Sesimbra, together with the ICNF (Portugal's nature conservation institute).",
      es: 'El 27 de septiembre de 2025, la UNESCO reconoció la Arrábida como Reserva de la Biosfera, la 13.ª de Portugal. La candidatura la presentaron los municipios de Setúbal, Palmela y Sesimbra, junto con el ICNF (el instituto de conservación de la naturaleza de Portugal).'
    }
  },
  arrabida_plantas: {
    titulo: { pt: 'Um Jardim de 1400 Plantas', en: 'A Garden of 1,400 Plants', es: 'Un Jardín de 1400 Plantas' },
    texto: {
      pt: 'Na Arrábida vivem mais de 1400 espécies de plantas, cerca de 40% da flora de Portugal. Setenta delas são raras ou endémicas.',
      en: "Over 1,400 plant species live in the Arrábida, about 40% of Portugal's flora. Seventy of them are rare or endemic.",
      es: 'En la Arrábida viven más de 1400 especies de plantas, cerca del 40% de la flora de Portugal. Setenta de ellas son raras o endémicas.'
    }
  },
  arrabida_mar: {
    titulo: { pt: 'Da Serra ao Mar', en: 'From Sierra to Sea', es: 'De la Sierra al Mar' },
    texto: {
      pt: 'A reserva junta a serra e o mar: cerca de 200 espécies de vertebrados e mais de 2000 espécies marinhas. A pesca artesanal, a oliveira e o Moscatel de Setúbal fazem parte desta paisagem.',
      en: 'The reserve joins sierra and sea: about 200 vertebrate species and over 2,000 marine species. Artisanal fishing, the olive tree and Moscatel de Setúbal are part of this landscape.',
      es: 'La reserva une sierra y mar: unas 200 especies de vertebrados y más de 2000 especies marinas. La pesca artesanal, el olivo y el Moscatel de Setúbal forman parte de este paisaje.'
    }
  }
};
const CAP = {
  titulo: { pt: 'A Serra e o Mar', en: 'The Sierra and the Sea', es: 'La Sierra y el Mar' },
  objetivo: { pt: 'Descobre as 3 histórias da Arrábida na Enciclopédia.', en: 'Discover the 3 stories about the Arrábida in the Encyclopedia.', es: 'Descubre las 3 historias de la Arrábida en la Enciclopedia.' },
  conclusao: { pt: 'Serra, mar e vinha na mesma paisagem. A Arrábida já faz parte da nossa história.', en: 'Sierra, sea and vineyard in the same landscape. The Arrábida is now part of our story.', es: 'Sierra, mar y viña en el mismo paisaje. La Arrábida ya forma parte de nuestra historia.' }
};
const LIMIARES = [0, 15, 50, 120, 300, 600, 1000, 1500, 2100, 2800, 3650];
const REP_10 = 3649, REP_11 = 3650;
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
// Reputação, nível já mostrado, capítulos de origem concluídos (cap1 a cap10) e a Enciclopédia à escolha.
function preparar(g, rep, nivelMostrado, abertas, comCapitulosFeitos) {
  g.ev(`
    state.acesso.jogadorAntigo = false; state.reputacao = ${rep}; state.niveis.nivelMostrado = ${nivelMostrado};
    state.encyclopedia.unlocked = ${js(abertas || [])}; state.conhecimento = 0;
    state.capitulos.iniciado = true; state.capitulos.celebradosMigrado = true;
    CAPITULOS_CONFIG.forEach(function (c) { if (c.nivel <= 10) { state.capitulos.concluidos[c.id] = ${comCapitulosFeitos === false ? 'false' : 'true'}; state.capitulos.celebrados[c.id] = ${comCapitulosFeitos === false ? 'false' : 'true'}; } });
    delete state.capitulos.concluidos.cap11; delete state.capitulos.celebrados.cap11;
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

// =====================================================================
// (i) O jogo de origem fica igual; o pacote é só o que se espera
// =====================================================================
{
  const base = abrir({ dadosDir: null });
  const g = abrir();
  ok(g.avisos.length === 0, '(i) carregar o jogo com dados/ não devia avisar nada: ' + g.avisos);
  // Os níveis seguintes (12, ...) também vivem em dados/ e têm os seus testes: aqui só se exige que os 11 primeiros sejam estes.
  ok(g.ev('NIVEIS_CONFIG.length') >= 11 && g.ev('CAPITULOS_CONFIG.length') >= 11 && Object.keys(g.ev('HISTORIA_NIVEIS')).join().indexOf('2,3,4,5,6,7,8,9,10,11') === 0, '(i) pelo menos 11 níveis, 11 capítulos e histórias dos níveis 2 a 11');
  ok(g.ev('JSON.stringify(NIVEIS_CONFIG.slice(0, 10))') === base.ev('JSON.stringify(NIVEIS_CONFIG)'), '(i) os níveis 1 a 10 ficam iguais');
  ok(g.ev('JSON.stringify(CAPITULOS_CONFIG.slice(0, 10))') === base.ev('JSON.stringify(CAPITULOS_CONFIG)'), '(i) os capítulos 1 a 10 ficam iguais');
  ok(g.ev('JSON.stringify([2,3,4,5,6,7,8,9,10].map(function (n) { return HISTORIA_NIVEIS[n]; }))') === base.ev('JSON.stringify([2,3,4,5,6,7,8,9,10].map(function (n) { return HISTORIA_NIVEIS[n]; }))'), '(i) as histórias dos níveis 2 a 10 ficam iguais');
  ok(g.ev('JSON.stringify(ENCYCLOPEDIA_ENTRIES.pt.slice(0, 32))') === base.ev('JSON.stringify(ENCYCLOPEDIA_ENTRIES.pt)') && g.ev('ENCYCLOPEDIA_ENTRIES.pt.length') >= 35, '(i) as 32 entradas de hoje ficam iguais e as 3 da Arrábida vêm a seguir');
  ok(g.ev('NIVEL_NECESSARIO_POR_ECRA.roxo') === 10 && g.ev('Math.max.apply(null, Object.keys(NIVEL_NECESSARIO_POR_ECRA).map(function (k) { return NIVEL_NECESSARIO_POR_ECRA[k]; }))') === 10, '(i) nenhum ecrã novo: o mais alto continua a abrir no nível 10');
  ok(g.ev('NIVEIS_CONFIG[10].id') === 'nivel_11' && g.ev('NIVEIS_CONFIG[10].min') === 3650 && g.ev('CAPITULOS_CONFIG[10].id') === 'cap11' && g.ev('CAPITULOS_CONFIG[10].nivel') === 11, '(i) nivel_11 (3650) e cap11 (nível 11)');
  ok(JSON.stringify(g.ev('DADOS_ACRESCENTADOS.enciclopedia.slice(0, 3).map(function (e) { return e.id; })')) === JSON.stringify(IDS) && JSON.stringify(g.ev('ENCYCLOPEDIA_ENTRIES.pt.slice(32, 35).map(function (e) { return e.id; })')) === JSON.stringify(IDS), '(i) as 3 entradas, por esta ordem, logo a seguir às 32 de hoje: ' + IDS);
  ok(g.ev('JSON.stringify(CAPITULOS_CONFIG[10].criterio)') === js([{ tipo: 'temIds', caminho: 'encyclopedia.unlocked', ids: IDS }]), '(i) o critério do cap11 é temIds nos 3 ids: ' + g.ev('JSON.stringify(CAPITULOS_CONFIG[10].criterio)'));
  ok(fs.existsSync(path.join(RAIZ, FOTO)), '(i) a foto da fala 1 existe em ' + FOTO);
  ok(!fs.existsSync(path.join(RAIZ, 'arrabida_colina.jpg')), '(i) não devia haver cópia da foto na raiz do repositório');
  ok(g.ev('HISTORIA_NIVEIS[11].length') === 4, '(i) a história do 11 tem 4 falas');
}

LINGUAS.forEach(function (l) {
  const L = ' [' + l + ']';

  // ===================================================================
  // (a) O nível
  // ===================================================================
  {
    const g = abrir(); lingua(g, l);
    ok(g.ev('nivelPelaReputacao(3649)') === 10 && g.ev('nivelPelaReputacao(3650)') === 11 && g.ev('nivelPelaReputacao(3651)') === 11 && g.ev('nivelPelaReputacao(2800)') === 10, '(a) 3649 dá o nível 10 e 3650 dá o 11' + L);
    ok(g.ev('nivelNome(NIVEIS_CONFIG[10])') === NOME[l], '(a) o nome do nível 11 é «' + NOME[l] + '»' + L + ': ' + g.ev('nivelNome(NIVEIS_CONFIG[10])'));
  }

  // ===================================================================
  // (b) e (c) A história: a subida ao 11 mostra as 4 falas; a do 11 não aparece ao subir ao 10
  // ===================================================================
  {
    const g = abrir(); lingua(g, l);
    // ao 10: só a história do nível 10
    preparar(g, 2800, 9);
    ok(g.ev('verificarSubidaNivel()') === true && g.ev('FALAS.length') === 1 && g.ev('FALAS[0].m.length') === 3, '(c) subir ao 10 mostra as 3 falas do nível 10' + L);
    const f10 = g.ev('JSON.stringify(FALAS)');
    ok(FALAS.every(function (f) { return f10.indexOf(f[l].slice(0, 30)) === -1; }) && f10.indexOf('arrabida_colina') === -1, '(c) a história do 11 não aparece ao subir ao 10' + L);
    // a ficar no 10 (3649) com o 10 já mostrado: nada
    preparar(g, REP_10, 10);
    ok(g.ev('verificarSubidaNivel()') === false && g.ev('FALAS.length') === 0, '(c) com 3649 (nível 10) não se mostra a história do 11' + L);
    // ao 11
    preparar(g, REP_11, 10);
    ok(g.ev('verificarSubidaNivel()') === true, '(b) subir ao 11 devolve true' + L);
    ok(g.ev('state.niveis.nivelMostrado') === 11, '(b) o nível mostrado passa a 11' + L);
    ok(g.ev('FALAS.length') === 1 && g.ev('FALAS[0].n') === 'YoshiCat' && g.ev('FALAS[0].m.length') === 4, '(b) uma só fila de 4 falas, do YoshiCat' + L);
    const falas = g.ev('JSON.parse(JSON.stringify(FALAS[0].m))');
    falas.forEach(function (f, i) { ok(f.texto === FALAS[i][l], '(b) fala ' + (i + 1) + ' com o texto exato em ' + l + ': ' + f.texto); });
    ok(falas[0].foto === FOTO && fs.existsSync(path.join(RAIZ, falas[0].foto)), '(b) a fala 1 leva a foto ' + FOTO + ' e ela existe' + L);
    ok(falas.slice(1).every(function (f) { return f.foto === undefined; }), '(b) as falas 2 a 4 não levam foto' + L);
    ok(falas.every(function (f) { return f.som === undefined; }), '(b) nenhuma fala leva som (o som pedido não é seguro: ver o relatório)' + L);
    limpo(js(falas), '(b) falas' + L);
    // 1 -> 11 de uma vez: as 4 do 11 vão no fim
    g.ev('FALAS.length = 0; mostrarHistoriaSubidaNivel(1, 11);');
    const todas = g.ev('JSON.parse(JSON.stringify(FALAS[0].m))');
    ok(todas.length === 27 + 4 && todas[27].texto === FALAS[0][l] && todas[30].texto === FALAS[3][l], '(b) de 1 a 11 vêm as 27 falas de 2 a 10 e as 4 do 11 no fim' + L);
  }

  // ===================================================================
  // (d) As 3 entradas: nada no nível 10; no 11 existem e o Explorar entrega-as primeiro
  // ===================================================================
  {
    const g = abrir(); lingua(g, l);
    preparar(g, REP_10, 10);
    ok(g.ev('encyclopediaEntries().length') === 32 && IDS.every(function (id) { return g.ev('encyclopediaEntries().some(function (e) { return e.id === ' + js(id) + '; })') === false; }), '(d) no nível 10 só há as 32 entradas de hoje' + L);
    g.ev('renderEnciclopedia();');
    let h = html(g, 'enciclopedia-container');
    ok((h.match(/encyclopedia-card/g) || []).length === 32 && h.indexOf('0 / 32') !== -1, '(d) nível 10: a Enciclopédia tem 32 cartões, nenhum da Arrábida' + L);
    ok(IDS.every(function (id) { return h.indexOf(esc(ENC[id].titulo[l])) === -1; }), '(d) nível 10: nenhum título da Arrábida' + L);
    ok(IDS.every(function (id) { return g.ev('desbloquearEntradaEnciclopedia(' + js(id) + ')') === null; }) && idsAbertos(g).length === 0, '(d) nível 10: não se desbloqueiam, por ação nenhuma' + L);
    semente(g, 11);
    for (let i = 0; i < 80; i++) g.ev('enterExplorar();');
    ok(IDS.every(function (id) { return idsAbertos(g).indexOf(id) === -1; }), '(d) nível 10: o Explorar nunca as entrega (80 cliques)' + L);

    // nível 11: existem, com os textos exatos
    preparar(g, REP_11, 11);
    ok(g.ev('encyclopediaEntries().length') === 35, '(d) nível 11: 35 entradas' + L);
    IDS.forEach(function (id) {
      const e = g.ev('encyclopediaEntries().filter(function (e) { return e.id === ' + js(id) + '; })[0]');
      ok(e && e.titulo === ENC[id].titulo[l] && e.texto === ENC[id].texto[l] && e.nivelMinimo === 11 && e.imagem === undefined, '(d) ' + id + ': título e texto exatos, nível mínimo 11, sem imagem' + L);
    });
    g.ev('renderEnciclopedia();');
    h = html(g, 'enciclopedia-container');
    ok((h.match(/encyclopedia-card/g) || []).length === 35 && h.indexOf('0 / 35') !== -1, '(d) nível 11: a Enciclopédia tem 35 cartões (as 3 novas bloqueadas) e 0 / 35' + L);
    preparar(g, REP_11, 11, IDS);
    g.ev('renderEnciclopedia();');
    h = html(g, 'enciclopedia-container');
    ok(IDS.every(function (id) { return h.indexOf('<h3>' + esc(ENC[id].titulo[l]) + '</h3>') !== -1 && h.indexOf('<p>' + esc(ENC[id].texto[l]) + '</p>') !== -1; }), '(d) nível 11: abertas, mostram o título e o texto (escapados)' + L);
    ok(h.indexOf('3 / 35') !== -1 && h.indexOf('<img') === -1, '(d) nível 11: 3 / 35 e sem imagens' + L);
    limpo(h, '(d) Enciclopédia' + L);
  }
  {
    // O Explorar entrega as 3 antes de qualquer outra (várias sementes), mesmo com quase tudo o resto por abrir.
    for (let s = 1; s <= 25; s++) {
      const g = abrir(); lingua(g, l);
      preparar(g, REP_11, 11); semente(g, s * 7 + (l === 'pt' ? 0 : l === 'en' ? 1 : 2));
      const saidas = [];
      for (let i = 0; i < 6; i++) { g.ev('enterExplorar();'); const a = idsAbertos(g); saidas.push(a[a.length - 1]); }
      ok(saidas.slice(0, 3).slice().sort().join() === IDS.slice().sort().join(), '(d) semente ' + s + L + ': as 3 primeiras entregas são as 3 da Arrábida: ' + saidas.slice(0, 3));
      ok(saidas.slice(3).every(function (id) { return IDS.indexOf(id) === -1; }) && new Set(saidas).size === 6, '(d) semente ' + s + L + ': depois só as outras, sem repetir');
    }
  }

  // ===================================================================
  // (e) e (f) O capítulo 11
  // ===================================================================
  {
    const g = abrir(); lingua(g, l);
    const ui = g.ev("cStr('ui')");
    // (f) nível 10 com os capítulos 1 a 10 cumpridos: o cartão aponta para o capítulo do nível 11
    preparar(g, REP_10, 10);
    g.ev('atualizarCapituloQuinta();');
    const c10 = html(g, 'capitulo-container');
    ok(c10.indexOf(ui.proximo.replace('{n}', 11)) !== -1 && c10.indexOf(ui.todos) === -1, '(f) nível 10 com o cap10 cumprido: «' + ui.proximo.replace('{n}', 11) + '», não «' + ui.todos + '»' + L + ': ' + c10);
    ok(c10.indexOf(esc(CAP.titulo[l])) === -1, '(f) nível 10: o capítulo 11 ainda não está ativo (título escondido)' + L);
    limpo(c10, '(f) cartão do capítulo no nível 10' + L);
    // (e) nível 11: ativo
    preparar(g, REP_11, 11);
    g.ev('atualizarCapituloQuinta();');
    let c11 = html(g, 'capitulo-container');
    ok(c11.indexOf(esc(CAP.titulo[l])) !== -1 && c11.indexOf(esc(CAP.objetivo[l])) !== -1 && c11.indexOf('0 / 3') !== -1, '(e) nível 11: o cartão mostra o título, o objetivo e 0 / 3' + L + ': ' + c11);
    limpo(c11, '(e) cartão do capítulo no nível 11' + L);
    ok(g.ev("cStr('cap11').titulo") === CAP.titulo[l] && g.ev("cStr('cap11').objetivo") === CAP.objetivo[l], '(e) título e objetivo do cap11 exatos' + L);
    preparar(g, REP_11, 11, [IDS[1]]);
    g.ev('atualizarCapituloQuinta();');
    ok(html(g, 'capitulo-container').indexOf('1 / 3') !== -1, '(e) com 1 das 3: 1 / 3' + L);
    ok(g.ev('capitulosAvaliarCelebracao()') === false && g.ev('FALAS.length') === 0, '(e) com 1 das 3 não celebra' + L);
    g.ev('state.encyclopedia.unlocked.push(' + js(IDS[0]) + ');');
    g.ev('atualizarCapituloQuinta();');
    ok(html(g, 'capitulo-container').indexOf('2 / 3') !== -1 && g.ev('capitulosAvaliarCelebracao()') === false, '(e) com 2 das 3: 2 / 3, não celebra' + L);
    // com as 3: celebra uma só vez, com a conclusão exata
    g.ev('state.encyclopedia.unlocked.push(' + js(IDS[2]) + ');');
    ok(g.ev('capitulosAvaliarCelebracao()') === true, '(e) com as 3 celebra' + L);
    ok(g.ev('FALAS.length') === 1 && g.ev('FALAS[0].m[0]') === CAP.conclusao[l], '(e) a conclusão exata em ' + l + L + ': ' + g.ev('FALAS[0].m[0]'));
    ok(g.ev('capitulosAvaliarCelebracao()') === true && g.ev('FALAS.length') === 1 && g.ev('TIMEOUTS.length') === 1, '(e) com a festa pendente não agenda outra' + L);
    g.ev('TIMEOUTS[0]();');
    ok(g.ev('state.capitulos.concluidos.cap11') === true && g.ev('state.capitulos.celebrados.cap11') === true, '(e) depois da confirmação fica concluído e celebrado' + L);
    ok(g.ev('capitulosAvaliarCelebracao()') === false && g.ev('FALAS.length') === 1, '(e) só celebra uma vez' + L);
    g.ev('atualizarCapituloQuinta();');
    // Cumprido o cap11: «todos cumpridos» se não há mais capítulos; senão aponta para o seguinte (o cap12 em dados/ é do nível 12).
    const seguinte = g.ev("CAPITULOS_CONFIG.filter(function (c) { return state.capitulos.concluidos[c.id] !== true; }).map(function (c) { return c.nivel; })[0]");
    const cartaoFim = html(g, 'capitulo-container');
    ok(seguinte === undefined ? cartaoFim.indexOf(ui.todos) !== -1 : cartaoFim.indexOf(ui.proximo.replace('{n}', seguinte)) !== -1, '(e) cumprido o cap11, o cartão diz ' + (seguinte === undefined ? 'que estão todos cumpridos' : 'o próximo capítulo no nível ' + seguinte) + L + ': ' + cartaoFim);
    // Pelo Explorar de ponta a ponta: as 3 saem e o capítulo cumpre-se
    const g2 = abrir(); lingua(g2, l);
    preparar(g2, REP_11, 11); semente(g2, 99);
    for (let i = 0; i < 3; i++) g2.ev('enterExplorar();');
    ok(g2.ev('capitulosAvaliarCelebracao()') === true, '(e) 3 cliques no Explorar chegam para cumprir o capítulo 11' + L);
  }

  // ===================================================================
  // (g) Sem NaN/undefined/null; ecrãs trancados e jogador antigo com 11 níveis
  // ===================================================================
  {
    const g = abrir(); lingua(g, l);
    const ecras = Object.keys(g.ev('NIVEL_NECESSARIO_POR_ECRA'));
    [0, 1, 14, 15, 49, 50, 119, 120, 2799, 2800, 2900, 3649, 3650, 3651, 4000].forEach(function (rep) {
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
      if (n < 11) {
        const prox = LIMIARES[n];
        const pct = Math.round(Math.min(rep, prox) / prox * 100);
        ok(h.indexOf('width:' + pct + '%') !== -1 && h.indexOf(Math.min(rep, prox) + ' / ' + prox) !== -1, '(g) a barra está a ' + pct + '% (' + Math.min(rep, prox) + ' / ' + prox + ') com ' + onde + ': ' + h);
        if (n === 10) ok(h.indexOf(esc(NOME[l])) !== -1, '(g) no nível 10 o cartão mostra o próximo nível «' + NOME[l] + '»' + L);
      } else {
        ok(h.indexOf(esc(NOME[l])) !== -1, '(g) no nível 11 o cartão mostra «' + NOME[l] + '» com ' + onde + ': ' + h);
        // Com um nível 12 em dados/ a barra vai até ao seu limiar; sem ele o 11 é o máximo e a barra está cheia.
        const prox11 = g.ev('NIVEIS_CONFIG.length > 11 ? NIVEIS_CONFIG[11].min : null');
        if (prox11 === null) ok(h.indexOf('width:100%') !== -1 && h.indexOf(g.ev("t('nivel.maximo')")) !== -1, '(g) sem nível 12, o 11 é o máximo e a barra está cheia com ' + onde + ': ' + h);
        else ok(h.indexOf('width:' + Math.round(Math.min(rep, prox11) / prox11 * 100) + '%') !== -1 && h.indexOf(rep + ' / ' + prox11) !== -1, '(g) no nível 11 a barra vai até ao nível seguinte (' + prox11 + ') com ' + onde + ': ' + h);
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
      if (n < 11) ok(g.ev('encyclopediaEntries().length') === 32, '(g) jogador antigo abaixo do 11: continua sem as 3 da Arrábida com ' + onde);
      g.ev('state.acesso.jogadorAntigo = false;');
    });
    // Mensagem de ecrã trancado no nível 10: o nome do nível 11 não aparece (nenhum ecrã o pede).
    // O modo de teste ?capitulo=11 mostra a celebração do cap11 (e continua a aceitar 1 a 10).
    const t11 = abrir(); lingua(t11, l);
    t11.ev("location.search = '?capitulo=11';");
    ok((t11.ev('capitulosParametrosTeste()') || {}).id === 'cap11', '(g) ?capitulo=11 é válido' + L);
    t11.ev("location.search = '?capitulo=cap11';");
    ok((t11.ev('capitulosParametrosTeste()') || {}).id === 'cap11', '(g) ?capitulo=cap11 é válido' + L);
    [1, 5, 10].forEach(function (n) { t11.ev("location.search = '?capitulo=" + n + "';"); ok((t11.ev('capitulosParametrosTeste()') || {}).id === 'cap' + n, '(g) ?capitulo=' + n + ' continua válido' + L); });
    ['99', '0', '011', '1a', '100', 'cap_11', ''].forEach(function (v) { t11.ev("location.search = '?capitulo=" + v + "';"); ok(t11.ev('capitulosParametrosTeste()') === null, '(g) ?capitulo=' + v + ' não é válido' + L); });
    t11.ev("location.search = '?capitulo=11';");
    preparar(t11, 100, 1);
    ok(t11.ev('capitulosCelebracaoDeTeste()') === true && t11.ev('FALAS[FALAS.length - 1].m[0]') === CAP.conclusao[l], '(g) o modo de teste ?capitulo=11 mostra a conclusão do cap11' + L);
  }
});

// =====================================================================
// (h) O estado guardado só tem ids; o jogo carrega bem sem o pacote; e se voltar nada se repete
// =====================================================================
{
  const a = abrir(); lingua(a, 'pt');
  preparar(a, REP_11, 10);
  a.ev('verificarSubidaNivel();');
  semente(a, 5);
  for (let i = 0; i < 3; i++) a.ev('enterExplorar();');
  a.ev('capitulosAvaliarCelebracao(); TIMEOUTS.forEach(function (f) { f(); }); saveState(state);');
  const salvo = a.guardado.yoshicat_quinta_state_v2;
  ok(typeof salvo === 'string' && salvo.length > 100, '(h) o jogo A gravou o estado');
  const estado = JSON.parse(salvo);
  ok(IDS.every(function (id) { return estado.encyclopedia.unlocked.indexOf(id) !== -1; }) && estado.niveis.nivelMostrado === 11 && estado.capitulos.concluidos.cap11 === true && estado.capitulos.celebrados.cap11 === true, '(h) o estado guarda os 3 ids, o nível mostrado 11 e o cap11 concluído e celebrado');
  const textos = [].concat(LINGUAS.map(function (l) { return NOME[l]; }), FALAS.map(function (f) { return f.pt; }), FALAS.map(function (f) { return f.en; }), FALAS.map(function (f) { return f.es; }));
  IDS.forEach(function (id) { LINGUAS.forEach(function (l) { textos.push(ENC[id].titulo[l], ENC[id].texto[l]); }); });
  LINGUAS.forEach(function (l) { textos.push(CAP.titulo[l], CAP.objetivo[l], CAP.conclusao[l]); });
  ok(textos.every(function (t) { return salvo.indexOf(t) === -1; }), '(h) o estado guardado não leva nenhum texto do pacote (só ids)');
  ok(salvo.indexOf('arrabida_colina') === -1 && salvo.indexOf('nivelMinimo') === -1, '(h) nem a foto nem o nível mínimo');

  // Jogo B: o pacote deixou de existir (o jogo de origem de 10 níveis).
  const b = abrir({ dadosDir: null, estadoGuardado: salvo });
  lingua(b, 'pt');
  b.ev('state.reputacao = ' + (REP_11 + 50) + ';');
  let erro = null;
  try { b.ev('atualizarCartaoNivelQuinta(); atualizarResumoQuinta(); atualizarCapituloQuinta(); renderEnciclopedia(); enterExplorar();'); } catch (e) { erro = e.message; }
  ok(erro === null, '(h) o jogo B (sem o pacote) desenha o cartão do nível, do capítulo, a Enciclopédia e o Explorar sem erro: ' + erro);
  const hb = html(b, 'nivel-container') + html(b, 'capitulo-container') + html(b, 'enciclopedia-container') + html(b, 'explorar-container') + b.el('quinta-resumo-linha').textContent;
  limpo(hb, '(h) jogo B');
  ok(b.ev('nivelPelaReputacao(state.reputacao)') === 10 && html(b, 'nivel-container').indexOf(b.ev("t('nivel.maximo')")) !== -1, '(h) sem o pacote o jogador é do nível 10 (o máximo) e continua a jogar');
  ok(IDS.every(function (id) { return b.ev('state.encyclopedia.unlocked.indexOf(' + js(id) + ')') !== -1; }) && b.ev('state.capitulos.concluidos.cap11') === true, '(h) os ids soltos continuam guardados (nunca se apagam)');
  ok(b.ev('encyclopediaContarDesbloqueadas()') <= 32 && html(b, 'enciclopedia-container').indexOf('/ 32') !== -1, '(h) sem o pacote os ids soltos não contam nos totais (x / 32)');
  b.ev('state.reputacao += 10; saveState(state);');
  ok(b.ev('verificarSubidaNivel()') === false && b.ev('state.reputacao') === REP_11 + 60, '(h) o jogador B continua a ganhar Reputação sem subir');
  ['proteger', 'garrafa', 'explorar', 'colecao', 'estrada', 'lagar', 'camara', 'roxo', 'loja'].forEach(function (e) { ok(b.ev("ecraDesbloqueado('" + e + "')") === true, '(h) jogo B: o ecrã ' + e + ' aberto'); });

  // Jogo C: o pacote volta com o mesmo estado. Nada se repete.
  const c = abrir({ estadoGuardado: salvo }); lingua(c, 'pt');
  ok(c.ev('NIVEIS_CONFIG.length') >= 11 && c.ev('nivelPelaReputacao(state.reputacao)') === 11, '(h) com o pacote de volta, o jogador é outra vez do nível 11');
  ok(c.ev('verificarSubidaNivel()') === false && c.ev('FALAS.length') === 0, '(h) a história do 11 não se repete');
  ok(c.ev('capitulosAvaliarCelebracao()') === false, '(h) o capítulo 11 não celebra outra vez');
  ok(IDS.every(function (id) { return c.ev('desbloquearEntradaEnciclopedia(' + js(id) + ')') === null; }), '(h) as 3 já abertas não se abrem outra vez');
  c.ev('renderEnciclopedia();');
  ok(html(c, 'enciclopedia-container').indexOf('<h3>' + esc(ENC.arrabida_mar.titulo.pt) + '</h3>') !== -1, '(h) com o pacote de volta, as histórias aparecem abertas');
}

if (falhas) { console.log(falhas + ' falha(s)'); process.exit(1); }
console.log('OK');
