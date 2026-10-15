#!/usr/bin/env node
// O NÍVEL 12 REAL, «Moscatel do Sado» (Parte 2, A Terra), que vive só como dados (dados/niveis.js, historias.js, enciclopedia.js e
// capitulos.js): o nível (4550 de Reputação), a história de 4 falas (a 1.ª com a foto assets/ecras/sado_estuario.jpg, SEM som), as 3
// histórias do Sado na Enciclopédia (nível mínimo 12, sem imagem) e o capítulo 12 «O Rio e os Golfinhos» (critério temIds nessas 3).
// Corre o jogo REAL (js/ e dados/) no ambiente simulado (módulo vm, scripts/_jogo-vm.js), em pt, en e es, e só LÊ: nada fica gravado.
// Mesmo molde de scripts/verificar-nivel-11.js.
//
// Prova:
//  (a) 4550 dá o nível 12 e 4549 ainda o 11; o nome do nível;
//  (b) a subida ao 12 mostra as 4 falas (textos exatos), com a foto da fala 1 que existe, e nenhuma com som;
//  (c) a história do 12 não aparece ao subir ao 11 nem ficando no 11;
//  (d) as 3 entradas não existem para o nível 11 e existem no 12 (textos exatos, nível mínimo 12, sem imagem); no 12 o Explorar entrega
//      as do Sado e as da Arrábida ainda por abrir (os dois grupos de nivelMinimo) antes de qualquer outra, e no 11 nunca as do Sado;
//  (e) o capítulo 12 só está ativo no nível 12 e cumpre-se, e celebra uma só vez, com as 3 desbloqueadas;
//  (f) no nível 11 com o capítulo 11 cumprido o cartão aponta para o capítulo do nível 12;
//  (g) nenhum NaN, undefined ou null; ecrãs trancados e jogador antigo certos com 12 níveis; o modo de teste ?capitulo=12;
//  (h) o estado guardado só tem ids e o jogo carrega bem se o pacote do nível 12 deixasse de existir (e não repete nada se voltar);
//  (i) o jogo até ao nível 11 (níveis 1 a 11, capítulos 1 a 11, histórias 2 a 11, as 32 de origem e as 3 da Arrábida) fica igual.
//
// Uso: node scripts/verificar-nivel-12.js
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
const NOME = { pt: 'Moscatel do Sado', en: 'Sado Moscatel', es: 'Moscatel del Sado' };
const NOME_11 = { pt: 'Moscatel da Arrábida', en: 'Arrábida Moscatel', es: 'Moscatel de la Arrábida' };
const FOTO = 'assets/ecras/sado_estuario.jpg';
const FALAS = [
  {
    pt: 'Do alto da colina, vê-se o rio Sado a abrir-se para o mar. A Quinta já é conhecida, mas o YoshiCat quer ir mais longe: descer até à água.',
    en: 'From the top of the hill, you can see the Sado river opening out to the sea. The Quinta is already well known, but YoshiCat wants to go further: down to the water.',
    es: 'Desde lo alto de la colina se ve el río Sado abriéndose al mar. La Quinta ya es conocida, pero YoshiCat quiere ir más lejos: bajar hasta el agua.'
  },
  {
    pt: 'O estuário do Sado é Reserva Natural desde 1980. Em 1996 passou a Zona Húmida de Importância Internacional (Convenção de Ramsar), e recebe flamingos.',
    en: 'The Sado estuary has been a Nature Reserve since 1980. In 1996 it became a Wetland of International Importance (Ramsar Convention), and it is visited by flamingos.',
    es: 'El estuario del Sado es Reserva Natural desde 1980. En 1996 pasó a ser Humedal de Importancia Internacional (Convenio de Ramsar), y recibe flamencos.'
  },
  {
    pt: 'Aqui vive uma pequena comunidade de golfinhos que fica no estuário todo o ano. Os cientistas acompanham-nos há mais de 40 anos.',
    en: 'A small community of dolphins lives here, staying in the estuary all year round. Scientists have followed them for over 40 years.',
    es: 'Aquí vive una pequeña comunidad de delfines que permanece en el estuario todo el año. Los científicos los siguen desde hace más de 40 años.'
  },
  {
    pt: 'Abriu: novas histórias do Sado na Enciclopédia.',
    en: 'Unlocked: new stories about the Sado in the Encyclopedia.',
    es: 'Se abrió: nuevas historias del Sado en la Enciclopedia.'
  }
];
const IDS = ['sado_reserva', 'sado_golfinhos', 'sado_troia'];
const IDS_11 = ['arrabida_biosfera', 'arrabida_plantas', 'arrabida_mar'];
const ENC = {
  sado_reserva: {
    titulo: { pt: 'Uma Reserva Entre o Rio e o Mar', en: 'A Reserve Between River and Sea', es: 'Una Reserva Entre el Río y el Mar' },
    texto: {
      pt: 'A Reserva Natural do Estuário do Sado foi criada em 1980. A 8 de maio de 1996, foi reconhecida como zona húmida de importância internacional (Ramsar).',
      en: 'The Sado Estuary Nature Reserve was created in 1980. On 8 May 1996, it was recognised as a wetland of international importance (Ramsar).',
      es: 'La Reserva Natural del Estuario del Sado se creó en 1980. El 8 de mayo de 1996 fue reconocida como humedal de importancia internacional (Ramsar).'
    }
  },
  sado_golfinhos: {
    titulo: { pt: 'Os Golfinhos do Sado', en: 'The Dolphins of the Sado', es: 'Los Delfines del Sado' },
    texto: {
      pt: 'No estuário vive uma comunidade residente de golfinhos-roazes, que ali fica todo o ano. É acompanhada por cientistas desde pelo menos 1981.',
      en: 'A resident community of bottlenose dolphins lives in the estuary all year round. Scientists have followed it since at least 1981.',
      es: 'En el estuario vive una comunidad residente de delfines mulares, que permanece allí todo el año. Los científicos la siguen desde al menos 1981.'
    }
  },
  sado_troia: {
    titulo: { pt: 'O Peixe Salgado de Tróia', en: 'The Salted Fish of Tróia', es: 'El Pescado Salado de Tróia' },
    texto: {
      pt: 'Em Tróia, mesmo em frente a Setúbal, os romanos preparavam peixe salgado e garum, um molho de peixe. O local foi ocupado até ao século VI.',
      en: 'At Tróia, right across from Setúbal, the Romans prepared salted fish and garum, a fish sauce. The site was occupied until the 6th century.',
      es: 'En Tróia, justo frente a Setúbal, los romanos preparaban pescado salado y garum, una salsa de pescado. El lugar estuvo ocupado hasta el siglo VI.'
    }
  }
};
const CAP = {
  titulo: { pt: 'O Rio e os Golfinhos', en: 'The River and the Dolphins', es: 'El Río y los Delfines' },
  objetivo: { pt: 'Descobre as 3 histórias do Sado na Enciclopédia.', en: 'Discover the 3 stories about the Sado in the Encyclopedia.', es: 'Descubre las 3 historias del Sado en la Enciclopedia.' },
  conclusao: { pt: 'O rio, o peixe e os golfinhos contam a mesma história. O Sado já faz parte da nossa.', en: 'The river, the fish and the dolphins tell the same story. The Sado is now part of ours.', es: 'El río, el pescado y los delfines cuentan la misma historia. El Sado ya forma parte de la nuestra.' }
};
const LIMIARES = [0, 15, 50, 120, 300, 600, 1000, 1500, 2100, 2800, 3650, 4550];
const REP_11 = 4549, REP_12 = 4550;
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
// Reputação, nível já mostrado, capítulos concluídos (cap1 a cap(ate)) e a Enciclopédia à escolha. Por omissão cap1 a cap11 feitos.
function preparar(g, rep, nivelMostrado, abertas, ate) {
  g.ev(`
    state.acesso.jogadorAntigo = false; state.reputacao = ${rep}; state.niveis.nivelMostrado = ${nivelMostrado};
    state.encyclopedia.unlocked = ${js(abertas || [])}; state.conhecimento = 0;
    state.capitulos.iniciado = true; state.capitulos.celebradosMigrado = true;
    CAPITULOS_CONFIG.forEach(function (c) { var feito = c.nivel <= ${ate === undefined ? 11 : ate}; state.capitulos.concluidos[c.id] = feito; state.capitulos.celebrados[c.id] = feito; });
    delete state.capitulos.concluidos.cap12; delete state.capitulos.celebrados.cap12;
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
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nivel12-'));
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
// (i) O jogo até ao nível 11 fica igual; o pacote é só o que se espera
// =====================================================================
{
  const base = abrir({ dadosDir: null });
  const sem12 = abrir({ dadosDir: dadosSem(12) });
  const g = abrir();
  ok(g.avisos.length === 0, '(i) carregar o jogo com dados/ não devia avisar nada: ' + g.avisos);
  ok(g.ev('NIVEIS_CONFIG.length') >= 12 && g.ev('CAPITULOS_CONFIG.length') >= 12 && Object.keys(g.ev('HISTORIA_NIVEIS')).join().indexOf('2,3,4,5,6,7,8,9,10,11,12') === 0, '(i) pelo menos 12 níveis, 12 capítulos e histórias dos níveis 2 a 12');
  ok(sem12.ev('NIVEIS_CONFIG.length') === 11 && sem12.ev('CAPITULOS_CONFIG.length') === 11 && sem12.ev('ENCYCLOPEDIA_ENTRIES.pt.length') === 35, '(i) preparação: sem o pacote do 12 o jogo tem 11 níveis, 11 capítulos e 35 entradas');
  // Níveis 1 a 11, capítulos 1 a 11, histórias 2 a 11 e as 35 entradas: iguais ao jogo sem o pacote do nível 12.
  ok(g.ev('JSON.stringify(NIVEIS_CONFIG.slice(0, 11))') === sem12.ev('JSON.stringify(NIVEIS_CONFIG)'), '(i) os níveis 1 a 11 ficam iguais');
  ok(g.ev('JSON.stringify(CAPITULOS_CONFIG.slice(0, 11))') === sem12.ev('JSON.stringify(CAPITULOS_CONFIG)'), '(i) os capítulos 1 a 11 ficam iguais');
  ok(g.ev('JSON.stringify([2,3,4,5,6,7,8,9,10,11].map(function (n) { return HISTORIA_NIVEIS[n]; }))') === sem12.ev('JSON.stringify([2,3,4,5,6,7,8,9,10,11].map(function (n) { return HISTORIA_NIVEIS[n]; }))'), '(i) as histórias dos níveis 2 a 11 ficam iguais');
  LINGUAS.forEach(function (l) {
    ok(g.ev('JSON.stringify(ENCYCLOPEDIA_ENTRIES.' + l + '.slice(0, 35))') === sem12.ev('JSON.stringify(ENCYCLOPEDIA_ENTRIES.' + l + ')'), '(i) as 32 entradas de hoje e as 3 da Arrábida ficam iguais (' + l + ')');
  });
  ok(g.ev('JSON.stringify(ENCYCLOPEDIA_ENTRIES.pt.slice(0, 32))') === base.ev('JSON.stringify(ENCYCLOPEDIA_ENTRIES.pt)'), '(i) as 32 entradas de origem ficam iguais ao jogo sem dados/');
  ok(g.ev('Math.max.apply(null, Object.keys(NIVEL_NECESSARIO_POR_ECRA).map(function (k) { return NIVEL_NECESSARIO_POR_ECRA[k]; }))') === 10, '(i) nenhum ecrã novo: o mais alto continua a abrir no nível 10');
  ok(g.ev('NIVEIS_CONFIG[11].id') === 'nivel_12' && g.ev('NIVEIS_CONFIG[11].min') === 4550 && g.ev('CAPITULOS_CONFIG[11].id') === 'cap12' && g.ev('CAPITULOS_CONFIG[11].nivel') === 12, '(i) nivel_12 (4550) e cap12 (nível 12)');
  ok(JSON.stringify(g.ev('DADOS_ACRESCENTADOS.enciclopedia.map(function (e) { return e.id; })').slice(3, 6)) === JSON.stringify(IDS) && JSON.stringify(g.ev('ENCYCLOPEDIA_ENTRIES.pt.slice(35, 38).map(function (e) { return e.id; })')) === JSON.stringify(IDS), '(i) as 3 entradas do Sado, por esta ordem, logo a seguir às 3 da Arrábida: ' + IDS);
  ok(g.ev('JSON.stringify(CAPITULOS_CONFIG[11].criterio)') === js([{ tipo: 'temIds', caminho: 'encyclopedia.unlocked', ids: IDS }]), '(i) o critério do cap12 é temIds nos 3 ids: ' + g.ev('JSON.stringify(CAPITULOS_CONFIG[11].criterio)'));
  ok(fs.existsSync(path.join(RAIZ, FOTO)), '(i) a foto da fala 1 existe em ' + FOTO);
  ok(!fs.existsSync(path.join(RAIZ, 'sado_estuario.jpg')), '(i) não devia haver cópia da foto na raiz do repositório');
  ok(g.ev('HISTORIA_NIVEIS[12].length') === 4, '(i) a história do 12 tem 4 falas');
}

LINGUAS.forEach(function (l) {
  const L = ' [' + l + ']';

  // ===================================================================
  // (a) O nível
  // ===================================================================
  {
    const g = abrir(); lingua(g, l);
    ok(g.ev('nivelPelaReputacao(4549)') === 11 && g.ev('nivelPelaReputacao(4550)') === 12 && g.ev('nivelPelaReputacao(4551)') === 12 && g.ev('nivelPelaReputacao(3650)') === 11, '(a) 4549 dá o nível 11 e 4550 dá o 12' + L);
    ok(g.ev('nivelNome(NIVEIS_CONFIG[11])') === NOME[l], '(a) o nome do nível 12 é «' + NOME[l] + '»' + L + ': ' + g.ev('nivelNome(NIVEIS_CONFIG[11])'));
  }

  // ===================================================================
  // (b) e (c) A história: a subida ao 12 mostra as 4 falas; a do 12 não aparece ao subir ao 11
  // ===================================================================
  {
    const g = abrir(); lingua(g, l);
    preparar(g, 3650, 10);
    ok(g.ev('verificarSubidaNivel()') === true && g.ev('FALAS.length') === 1 && g.ev('FALAS[0].m.length') === 4, '(c) subir ao 11 mostra as 4 falas do nível 11' + L);
    const f11 = g.ev('JSON.stringify(FALAS)');
    ok(FALAS.every(function (f) { return f11.indexOf(f[l]) === -1; }) && f11.indexOf('sado_estuario') === -1, '(c) a história do 12 não aparece ao subir ao 11' + L);
    preparar(g, REP_11, 11);
    ok(g.ev('verificarSubidaNivel()') === false && g.ev('FALAS.length') === 0, '(c) com 4549 (nível 11) não se mostra a história do 12' + L);
    preparar(g, REP_12, 11);
    ok(g.ev('verificarSubidaNivel()') === true, '(b) subir ao 12 devolve true' + L);
    ok(g.ev('state.niveis.nivelMostrado') === 12, '(b) o nível mostrado passa a 12' + L);
    ok(g.ev('FALAS.length') === 1 && g.ev('FALAS[0].n') === 'YoshiCat' && g.ev('FALAS[0].m.length') === 4, '(b) uma só fila de 4 falas, do YoshiCat' + L);
    const falas = g.ev('JSON.parse(JSON.stringify(FALAS[0].m))');
    falas.forEach(function (f, i) { ok(f.texto === FALAS[i][l], '(b) fala ' + (i + 1) + ' com o texto exato em ' + l + ': ' + f.texto); });
    ok(falas[0].foto === FOTO && fs.existsSync(path.join(RAIZ, falas[0].foto)), '(b) a fala 1 leva a foto ' + FOTO + ' e ela existe' + L);
    ok(falas.slice(1).every(function (f) { return f.foto === undefined; }), '(b) as falas 2 a 4 não levam foto' + L);
    ok(falas.every(function (f) { return f.som === undefined; }), '(b) nenhuma fala leva som (as falas não têm volume)' + L);
    limpo(js(falas), '(b) falas' + L);
    g.ev('FALAS.length = 0; mostrarHistoriaSubidaNivel(1, 12);');
    const todas = g.ev('JSON.parse(JSON.stringify(FALAS[0].m))');
    ok(todas.length === 27 + 4 + 4 && todas[31].texto === FALAS[0][l] && todas[34].texto === FALAS[3][l], '(b) de 1 a 12 vêm as 27 falas de 2 a 10, as 4 do 11 e as 4 do 12 no fim' + L);
  }

  // ===================================================================
  // (d) As 3 entradas: nada no nível 11; no 12 existem e o Explorar entrega-as primeiro (com os dois grupos de nivelMinimo)
  // ===================================================================
  {
    const g = abrir(); lingua(g, l);
    preparar(g, REP_11, 11);
    ok(g.ev('encyclopediaEntries().length') === 35 && IDS.every(function (id) { return g.ev('encyclopediaEntries().some(function (e) { return e.id === ' + js(id) + '; })') === false; }), '(d) no nível 11 só há as 32 de hoje e as 3 da Arrábida (35)' + L);
    g.ev('renderEnciclopedia();');
    let h = html(g, 'enciclopedia-container');
    ok((h.match(/encyclopedia-card/g) || []).length === 35 && h.indexOf('0 / 35') !== -1, '(d) nível 11: a Enciclopédia tem 35 cartões, nenhum do Sado' + L);
    ok(IDS.every(function (id) { return h.indexOf(esc(ENC[id].titulo[l])) === -1; }), '(d) nível 11: nenhum título do Sado' + L);
    ok(IDS.every(function (id) { return g.ev('desbloquearEntradaEnciclopedia(' + js(id) + ')') === null; }) && idsAbertos(g).length === 0, '(d) nível 11: não se desbloqueiam, por ação nenhuma' + L);
    semente(g, 11);
    for (let i = 0; i < 80; i++) g.ev('enterExplorar();');
    ok(IDS.every(function (id) { return idsAbertos(g).indexOf(id) === -1; }), '(d) nível 11: o Explorar nunca as entrega (80 cliques)' + L);
    ok(IDS_11.every(function (id) { return idsAbertos(g).indexOf(id) !== -1; }), '(d) nível 11: mas entrega as 3 da Arrábida' + L);

    // nível 12: existem, com os textos exatos
    preparar(g, REP_12, 12);
    ok(g.ev('encyclopediaEntries().length') === 38, '(d) nível 12: 38 entradas' + L);
    IDS.forEach(function (id) {
      const e = g.ev('encyclopediaEntries().filter(function (e) { return e.id === ' + js(id) + '; })[0]');
      ok(e && e.titulo === ENC[id].titulo[l] && e.texto === ENC[id].texto[l] && e.nivelMinimo === 12 && e.imagem === undefined, '(d) ' + id + ': título e texto exatos, nível mínimo 12, sem imagem' + L);
    });
    g.ev('renderEnciclopedia();');
    h = html(g, 'enciclopedia-container');
    ok((h.match(/encyclopedia-card/g) || []).length === 38 && h.indexOf('0 / 38') !== -1, '(d) nível 12: a Enciclopédia tem 38 cartões (as 3 novas bloqueadas) e 0 / 38' + L);
    preparar(g, REP_12, 12, IDS);
    g.ev('renderEnciclopedia();');
    h = html(g, 'enciclopedia-container');
    ok(IDS.every(function (id) { return h.indexOf('<h3>' + esc(ENC[id].titulo[l]) + '</h3>') !== -1 && h.indexOf('<p>' + esc(ENC[id].texto[l]) + '</p>') !== -1; }), '(d) nível 12: abertas, mostram o título e o texto (escapados)' + L);
    ok(h.indexOf('3 / 38') !== -1 && h.indexOf('<img') === -1, '(d) nível 12: 3 / 38 e sem imagens' + L);
    limpo(h, '(d) Enciclopédia' + L);
  }
  {
    // Dois grupos de nivelMinimo (11 e 12): no nível 12 as da Arrábida ainda por abrir e as do Sado contam as duas como disponíveis e
    // saem todas (as 6, por qualquer ordem) antes de qualquer outra.
    for (let s = 1; s <= 25; s++) {
      const g = abrir(); lingua(g, l);
      preparar(g, REP_12, 12); semente(g, s * 7 + (l === 'pt' ? 0 : l === 'en' ? 1 : 2));
      const saidas = [];
      for (let i = 0; i < 9; i++) { g.ev('enterExplorar();'); const a = idsAbertos(g); saidas.push(a[a.length - 1]); }
      ok(saidas.slice(0, 6).slice().sort().join() === IDS_11.concat(IDS).sort().join(), '(d) semente ' + s + L + ': as 6 primeiras entregas são as 3 da Arrábida e as 3 do Sado: ' + saidas.slice(0, 6));
      ok(saidas.slice(6).every(function (id) { return IDS.indexOf(id) === -1 && IDS_11.indexOf(id) === -1; }) && new Set(saidas).size === 9, '(d) semente ' + s + L + ': depois só as outras, sem repetir');
    }
    // Com a Arrábida já aberta, as 3 primeiras entregas são as do Sado.
    for (let s = 1; s <= 10; s++) {
      const g = abrir(); lingua(g, l);
      preparar(g, REP_12, 12, IDS_11); semente(g, s * 13);
      const saidas = [];
      for (let i = 0; i < 5; i++) { g.ev('enterExplorar();'); const a = idsAbertos(g); saidas.push(a[a.length - 1]); }
      ok(saidas.slice(0, 3).slice().sort().join() === IDS.slice().sort().join() && saidas.slice(3).every(function (id) { return IDS.indexOf(id) === -1 && IDS_11.indexOf(id) === -1; }), '(d) semente ' + s + L + ': com a Arrábida aberta, as 3 primeiras são as do Sado: ' + saidas);
    }
  }

  // ===================================================================
  // (e) e (f) O capítulo 12
  // ===================================================================
  {
    const g = abrir(); lingua(g, l);
    const ui = g.ev("cStr('ui')");
    // (f) nível 11 com os capítulos 1 a 11 cumpridos: o cartão aponta para o capítulo do nível 12
    preparar(g, REP_11, 11);
    g.ev('atualizarCapituloQuinta();');
    const c11 = html(g, 'capitulo-container');
    ok(c11.indexOf(ui.proximo.replace('{n}', 12)) !== -1 && c11.indexOf(ui.todos) === -1, '(f) nível 11 com o cap11 cumprido: «' + ui.proximo.replace('{n}', 12) + '», não «' + ui.todos + '»' + L + ': ' + c11);
    ok(c11.indexOf(esc(CAP.titulo[l])) === -1, '(f) nível 11: o capítulo 12 ainda não está ativo (título escondido)' + L);
    limpo(c11, '(f) cartão do capítulo no nível 11' + L);
    // (e) nível 12: ativo
    preparar(g, REP_12, 12);
    g.ev('atualizarCapituloQuinta();');
    let c12 = html(g, 'capitulo-container');
    ok(c12.indexOf(esc(CAP.titulo[l])) !== -1 && c12.indexOf(esc(CAP.objetivo[l])) !== -1 && c12.indexOf('0 / 3') !== -1, '(e) nível 12: o cartão mostra o título, o objetivo e 0 / 3' + L + ': ' + c12);
    limpo(c12, '(e) cartão do capítulo no nível 12' + L);
    ok(g.ev("cStr('cap12').titulo") === CAP.titulo[l] && g.ev("cStr('cap12').objetivo") === CAP.objetivo[l], '(e) título e objetivo do cap12 exatos' + L);
    // com o cap11 por cumprir, o cartão continua no cap11 (o primeiro por cumprir) mas o cap12 já conta as suas 3
    preparar(g, REP_12, 12, [], 10);
    g.ev('atualizarCapituloQuinta();');
    const cartaoAntes = html(g, 'capitulo-container');
    ok(cartaoAntes.indexOf(ui.rotulo + ' 11 · ') !== -1 && cartaoAntes.indexOf(esc(CAP.titulo[l])) === -1, '(e) com o cap11 por cumprir, o cartão mostra o cap11 (e não o cap12)' + L + ': ' + cartaoAntes);
    preparar(g, REP_12, 12, [IDS[1]]);
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
    ok(g.ev('state.capitulos.concluidos.cap12') === true && g.ev('state.capitulos.celebrados.cap12') === true, '(e) depois da confirmação fica concluído e celebrado' + L);
    ok(g.ev('capitulosAvaliarCelebracao()') === false && g.ev('FALAS.length') === 1, '(e) só celebra uma vez' + L);
    g.ev('atualizarCapituloQuinta();');
    const seguinte = g.ev("CAPITULOS_CONFIG.filter(function (c) { return state.capitulos.concluidos[c.id] !== true; }).map(function (c) { return c.nivel; })[0]");
    const cartaoFim = html(g, 'capitulo-container');
    ok(seguinte === undefined ? cartaoFim.indexOf(ui.todos) !== -1 : cartaoFim.indexOf(ui.proximo.replace('{n}', seguinte)) !== -1, '(e) cumprido o cap12, o cartão diz ' + (seguinte === undefined ? 'que estão todos cumpridos' : 'o próximo capítulo no nível ' + seguinte) + L + ': ' + cartaoFim);
    // Pelo Explorar de ponta a ponta, com a Arrábida já aberta: 3 cliques cumprem o capítulo 12
    const g2 = abrir(); lingua(g2, l);
    preparar(g2, REP_12, 12, IDS_11); semente(g2, 99);
    for (let i = 0; i < 3; i++) g2.ev('enterExplorar();');
    ok(g2.ev('capitulosAvaliarCelebracao()') === true && g2.ev('FALAS[0].m[0]') === CAP.conclusao[l], '(e) 3 cliques no Explorar chegam para cumprir o capítulo 12' + L);
  }

  // ===================================================================
  // (g) Sem NaN/undefined/null; ecrãs trancados e jogador antigo com 12 níveis
  // ===================================================================
  {
    const g = abrir(); lingua(g, l);
    const ecras = Object.keys(g.ev('NIVEL_NECESSARIO_POR_ECRA'));
    [0, 1, 14, 15, 49, 50, 119, 120, 2799, 2800, 2900, 3649, 3650, 3651, 4000, 4549, 4550, 4551, 5000].forEach(function (rep) {
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
      if (n < 12) {
        const prox = LIMIARES[n];
        const pct = Math.round(Math.min(rep, prox) / prox * 100);
        ok(h.indexOf('width:' + pct + '%') !== -1 && h.indexOf(Math.min(rep, prox) + ' / ' + prox) !== -1, '(g) a barra está a ' + pct + '% (' + Math.min(rep, prox) + ' / ' + prox + ') com ' + onde + ': ' + h);
        if (n === 11) ok(h.indexOf(esc(NOME_11[l])) !== -1, '(g) no nível 11 o cartão mostra o seu nome «' + NOME_11[l] + '»' + L);
      } else {
        ok(h.indexOf(esc(NOME[l])) !== -1, '(g) no nível 12 o cartão mostra «' + NOME[l] + '» com ' + onde + ': ' + h);
        // Com um nível 13 em dados/ a barra vai até ao seu limiar; sem ele o 12 é o máximo e a barra está cheia.
        const prox12 = g.ev('NIVEIS_CONFIG.length > 12 ? NIVEIS_CONFIG[12].min : null');
        if (prox12 === null) ok(h.indexOf('width:100%') !== -1 && h.indexOf(g.ev("t('nivel.maximo')")) !== -1, '(g) sem nível 13, o 12 é o máximo e a barra está cheia com ' + onde + ': ' + h);
        else ok(h.indexOf('width:' + Math.round(Math.min(rep, prox12) / prox12 * 100) + '%') !== -1 && h.indexOf(rep + ' / ' + prox12) !== -1, '(g) no nível 12 a barra vai até ao nível seguinte (' + prox12 + ') com ' + onde + ': ' + h);
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
      if (n < 12) ok(g.ev('encyclopediaEntries().length') === (n < 11 ? 32 : 35), '(g) jogador antigo abaixo do 12: continua sem as 3 do Sado com ' + onde);
      g.ev('state.acesso.jogadorAntigo = false;');
    });
    // O modo de teste ?capitulo=12 mostra a celebração do cap12 (e continua a aceitar 1 a 11).
    const t12 = abrir(); lingua(t12, l);
    ['12', 'cap12'].forEach(function (v) { t12.ev("location.search = '?capitulo=" + v + "';"); ok((t12.ev('capitulosParametrosTeste()') || {}).id === 'cap12', '(g) ?capitulo=' + v + ' é válido' + L); });
    [1, 5, 10, 11].forEach(function (n) { t12.ev("location.search = '?capitulo=" + n + "';"); ok((t12.ev('capitulosParametrosTeste()') || {}).id === 'cap' + n, '(g) ?capitulo=' + n + ' continua válido' + L); });
    ['99', '0', '012', '1a', '100', 'cap_12', ''].forEach(function (v) { t12.ev("location.search = '?capitulo=" + v + "';"); ok(t12.ev('capitulosParametrosTeste()') === null, '(g) ?capitulo=' + v + ' não é válido' + L); });
    t12.ev("location.search = '?capitulo=12';");
    preparar(t12, 100, 1);
    ok(t12.ev('capitulosCelebracaoDeTeste()') === true && t12.ev('FALAS[FALAS.length - 1].m[0]') === CAP.conclusao[l], '(g) o modo de teste ?capitulo=12 mostra a conclusão do cap12' + L);
  }
});

// =====================================================================
// (h) O estado guardado só tem ids; o jogo carrega bem sem o pacote do 12; e se voltar nada se repete
// =====================================================================
{
  const a = abrir(); lingua(a, 'pt');
  preparar(a, REP_12, 11, IDS_11);
  a.ev('verificarSubidaNivel();');
  semente(a, 5);
  for (let i = 0; i < 3; i++) a.ev('enterExplorar();');
  a.ev('capitulosAvaliarCelebracao(); TIMEOUTS.forEach(function (f) { f(); }); saveState(state);');
  const salvo = a.guardado.yoshicat_quinta_state_v2;
  ok(typeof salvo === 'string' && salvo.length > 100, '(h) o jogo A gravou o estado');
  const estado = JSON.parse(salvo);
  ok(IDS.every(function (id) { return estado.encyclopedia.unlocked.indexOf(id) !== -1; }) && estado.niveis.nivelMostrado === 12 && estado.capitulos.concluidos.cap12 === true && estado.capitulos.celebrados.cap12 === true, '(h) o estado guarda os 3 ids, o nível mostrado 12 e o cap12 concluído e celebrado');
  const textos = [].concat(LINGUAS.map(function (l) { return NOME[l]; }), FALAS.map(function (f) { return f.pt; }), FALAS.map(function (f) { return f.en; }), FALAS.map(function (f) { return f.es; }));
  IDS.forEach(function (id) { LINGUAS.forEach(function (l) { textos.push(ENC[id].titulo[l], ENC[id].texto[l]); }); });
  LINGUAS.forEach(function (l) { textos.push(CAP.titulo[l], CAP.objetivo[l], CAP.conclusao[l]); });
  ok(textos.every(function (t) { return salvo.indexOf(t) === -1; }), '(h) o estado guardado não leva nenhum texto do pacote (só ids)');
  ok(salvo.indexOf('sado_estuario') === -1 && salvo.indexOf('nivelMinimo') === -1, '(h) nem a foto nem o nível mínimo');

  // Jogo B: o pacote do nível 12 deixou de existir (o nível 11 e a Arrábida ficam).
  const b = abrir({ dadosDir: dadosSem(12), estadoGuardado: salvo });
  lingua(b, 'pt');
  b.ev('state.reputacao = ' + (REP_12 + 50) + ';');
  let erro = null;
  try { b.ev('atualizarCartaoNivelQuinta(); atualizarResumoQuinta(); atualizarCapituloQuinta(); renderEnciclopedia(); enterExplorar();'); } catch (e) { erro = e.message; }
  ok(erro === null, '(h) o jogo B (sem o pacote do 12) desenha o cartão do nível, do capítulo, a Enciclopédia e o Explorar sem erro: ' + erro);
  const hb = html(b, 'nivel-container') + html(b, 'capitulo-container') + html(b, 'enciclopedia-container') + html(b, 'explorar-container') + b.el('quinta-resumo-linha').textContent;
  limpo(hb, '(h) jogo B');
  ok(b.ev('nivelPelaReputacao(state.reputacao)') === 11 && html(b, 'nivel-container').indexOf(b.ev("t('nivel.maximo')")) !== -1, '(h) sem o pacote do 12 o jogador é do nível 11 (o máximo) e continua a jogar');
  ok(IDS.every(function (id) { return b.ev('state.encyclopedia.unlocked.indexOf(' + js(id) + ')') !== -1; }) && b.ev('state.capitulos.concluidos.cap12') === true, '(h) os ids soltos continuam guardados (nunca se apagam)');
  ok(html(b, 'enciclopedia-container').indexOf('/ 35') !== -1 && IDS.every(function (id) { return b.ev('encyclopediaEntries().some(function (e) { return e.id === ' + js(id) + '; })') === false; }), '(h) sem o pacote do 12 os ids soltos não contam nos totais (x / 35)');
  b.ev('state.reputacao += 10; saveState(state);');
  ok(b.ev('verificarSubidaNivel()') === false && b.ev('state.reputacao') === REP_12 + 60, '(h) o jogador B continua a ganhar Reputação sem subir');
  ['proteger', 'garrafa', 'explorar', 'colecao', 'estrada', 'lagar', 'camara', 'roxo', 'loja'].forEach(function (e) { ok(b.ev("ecraDesbloqueado('" + e + "')") === true, '(h) jogo B: o ecrã ' + e + ' aberto'); });

  // Jogo C: o pacote volta com o mesmo estado. Nada se repete.
  const c = abrir({ estadoGuardado: salvo }); lingua(c, 'pt');
  ok(c.ev('NIVEIS_CONFIG.length') >= 12 && c.ev('nivelPelaReputacao(state.reputacao)') === 12, '(h) com o pacote de volta, o jogador é outra vez do nível 12');
  ok(c.ev('verificarSubidaNivel()') === false && c.ev('FALAS.length') === 0, '(h) a história do 12 não se repete');
  ok(c.ev('capitulosAvaliarCelebracao()') === false, '(h) o capítulo 12 não celebra outra vez');
  ok(IDS.every(function (id) { return c.ev('desbloquearEntradaEnciclopedia(' + js(id) + ')') === null; }), '(h) as 3 já abertas não se abrem outra vez');
  c.ev('renderEnciclopedia();');
  ok(html(c, 'enciclopedia-container').indexOf('<h3>' + esc(ENC.sado_troia.titulo.pt) + '</h3>') !== -1, '(h) com o pacote de volta, as histórias aparecem abertas');
}

if (falhas) { console.log(falhas + ' falha(s)'); process.exit(1); }
console.log('OK');
