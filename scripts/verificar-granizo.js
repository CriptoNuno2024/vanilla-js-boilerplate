#!/usr/bin/env node
// Granizo no tempo real (js/tempo.js, js/vinha.js, js/proteger.js, js/i18n.js): quando o weather_code da Open-Meteo (já pedido) é 96 ou 99
// (trovoada com granizo, tabela WMO), a condição ganha a MARCA granizo: true; o céu continua 'trovoada'.
//   - regra pura tempoCodigoComGranizo(código): só 96 e 99; 95, 0, 3, 45, 61, 80, 82, texto, null, NaN... não;
//   - cache do tempo com campo opcional: cache antiga sem o campo = sem granizo (continua válida); só o valor true conta;
//   - ?tempo=granizo existe (trovoada com granizo) e ?tempo=trovoada continua sem granizo;
//   - fundo da Vinha: granizo.jpg só com granizo; a trovoada normal mantém trovoada_chizo.jpg; aviso no Proteger em PT/EN/ES;
//   - nada de mecânica nova (rondas extra, assaltos, tarefas ficam iguais), sem estado novo, sem nuvem, sem pedido de rede novo;
//   - assets/ecras/granizo.jpg existe (cópia do original, que não se mexe) e as outras imagens da pasta imagens_JOGO_TELEGRAM não foram copiadas.
// Corre js/ REAIS em vm. Depois de passar, aplica "mutações" e confirma que o teste as apanha.
//
// Uso: node scripts/verificar-granizo.js
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const RAIZ = path.join(__dirname, '..');
const FICHEIROS = ['state.js', 'i18n.js', 'estacoes.js', 'tempo.js', 'niveis.js', 'vinha.js', 'assaltos.js', 'barril.js', 'proteger.js'];
const FONTES = {};
FICHEIROS.forEach(function (f) { FONTES[f] = fs.readFileSync(path.join(RAIZ, 'js', f), 'utf8'); });

// Uma mutação que faz rebentar o código assíncrono do tempo.js dá uma promessa rejeitada: conta como apanhada (e nunca na versão real).
let rejeicoes = 0;
process.on('unhandledRejection', function () { rejeicoes++; });

async function suite(fontes) {
  const falhas = [];
  function ok(cond, msg) { if (!cond) falhas.push(msg); }
  const semCom = function (s) { return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''); };

  // Ambiente com os ficheiros reais. resposta: o que o fetch (simulado) devolve do Open-Meteo; cacheInicial: o que já estava na cache do tempo.
  async function abrir(pesquisa, resposta, cacheInicial) {
    const guardado = {};
    if (cacheInicial !== undefined) guardado.yoshicat_tempo_cache_v1 = JSON.stringify(cacheInicial);
    const pedidos = [];
    const sb = {
      console: { log() {}, warn() {}, error() {} },
      localStorage: {
        getItem: function (k) { return Object.prototype.hasOwnProperty.call(guardado, k) ? guardado[k] : null; },
        setItem: function (k, v) { guardado[k] = String(v); },
        removeItem: function (k) { delete guardado[k]; }
      },
      location: { search: pesquisa || '' }, URLSearchParams: URLSearchParams, Intl: Intl,
      document: { querySelectorAll: function () { return []; }, getElementById: function () { return null; }, querySelector: function () { return null; }, addEventListener: function () {} },
      setTimeout: function () { return 1; }, clearTimeout: function () {}, Image: function () {},
      AbortController: AbortController,
      fetch: function (url) {
        pedidos.push(String(url));
        if (resposta === null || resposta === undefined) return Promise.reject(new Error('sem rede'));
        return Promise.resolve({ ok: true, json: function () { return Promise.resolve({ current: resposta }); } });
      }
    };
    sb.window = sb; sb.addEventListener = function () {}; sb.Telegram = { WebApp: {} };
    const cx = vm.createContext(sb);
    vm.runInContext(`
      function randInt(a) { return a; }
      function mostrarFalas() {} function vibrar() {} function tocarSom() {} function updateStatsDisplays() {}
      function localeAtual() { return 'pt-PT'; } function faseRealAtual() { return 'repouso'; }
      function caveReservaAberta() { return false; } function garrafaQueMaisDescansou() { return 0; }
      function rondaChizoFeitasHoje() { return 1; } function definirFundo() {} function tocarSomFicheiro() {}
      function atualizarDialogo() {} function iniciarSomAmbiente() {} function pararSomAmbiente() {}
    `, cx);
    for (const f of fontes.__ordem) vm.runInContext(fontes[f], cx, { filename: f });
    await new Promise(function (r) { setImmediate(r); }); // deixa correr o pedido de arranque do tempo.js
    const g = { cx: cx, guardado: guardado, pedidos: pedidos };
    g.ev = function (c) { return vm.runInContext(c, cx); };
    g.json = function (c) { return JSON.parse(vm.runInContext('JSON.stringify(' + c + ')', cx)); };
    return g;
  }
  fontes.__ordem = FICHEIROS;
  const g0 = await abrir('', null);

  // ---------------- 1. Regra pura ----------------
  const com = function (c) { g0.cx.__c = c; return g0.ev('tempoCodigoComGranizo(__c)'); };
  ok(com(96) === true && com(99) === true, '96 e 99 dão granizo');
  [95, 0, 1, 2, 3, 45, 48, 51, 61, 65, 80, 81, 82, 97, 98, 100, 9, -96, 96.5, 990].forEach(function (c) { ok(com(c) === false, 'o código ' + c + ' NÃO dá granizo'); });
  ['96', '99', ' 96', 'granizo', '', null, undefined, NaN, Infinity, [96], [99], { v: 96 }, true, false, function () {}].forEach(function (c) { ok(com(c) === false, 'valor estranho ' + String(typeof c === 'function' ? 'função' : JSON.stringify(c)) + ' NÃO dá granizo'); });
  ok(!/Math\.random|Date\.now|new Date|fetch|localStorage/.test(semCom(g0.ev('tempoCodigoComGranizo.toString()'))), 'a regra é pura (sem relógio, sorteio, rede nem gravação)');
  // o céu continua trovoada para 95, 96 e 99
  ok(g0.ev('classificarCeu(95, 1)') === 'trovoada' && g0.ev('classificarCeu(96, 1)') === 'trovoada' && g0.ev('classificarCeu(99, 0)') === 'trovoada', 'os códigos 95, 96 e 99 continuam a dar ceu = trovoada');
  ok(g0.ev('classificarCeu(61, 1)') === 'chuva' && g0.ev('classificarCeu(45, 1)') === 'nevoeiro' && g0.ev('classificarCeu(0, 1)') === 'sol' && g0.ev('classificarCeu(0, 0)') === 'noite', 'os outros céus não mudaram');

  // ---------------- 2. A condição e o atalho de teste ----------------
  ok(g0.ev('condicaoDeTeste(14, 20, "trovoada", true).granizo') === true && g0.ev('condicaoDeTeste(14, 20, "trovoada", true).ceu') === 'trovoada', 'condicaoDeTeste com granizo: marca true e ceu trovoada');
  ['condicaoDeTeste(14, 20, "trovoada")', 'condicaoDeTeste(14, 20, "trovoada", false)', 'condicaoDeTeste(14, 20, "trovoada", "true")', 'condicaoDeTeste(14, 20, "trovoada", 1)', 'condicaoDeTeste(14, 20, "trovoada", null)', 'condicaoIndisponivel()'].forEach(function (c) {
    ok(g0.ev(c + '.granizo') === false, c + ' devia dar granizo: false');
  });
  ok(g0.ev('condicaoDeTeste(14, 20, "trovoada", true).disponivel') === true && g0.ev('condicaoDeTeste(14, 20, "trovoada", true).tempC') === 14, 'a condição mantém os outros campos');
  const forc = async function (valor) { const g = await abrir('?tempo=' + valor, null); return g.json('tempoAtual()'); };
  const fg = await forc('granizo');
  ok(fg.disponivel === true && fg.ceu === 'trovoada' && fg.granizo === true, '?tempo=granizo existe: trovoada com granizo, deu ' + JSON.stringify(fg));
  const ft = await forc('trovoada');
  ok(ft.ceu === 'trovoada' && ft.granizo === false, '?tempo=trovoada continua trovoada sem granizo');
  for (const v of ['sol', 'chuva', 'calor', 'nevoeiro', 'vento', 'frio', 'noite']) { const f = await forc(v); ok(f.disponivel === true && f.granizo === false, '?tempo=' + v + ' continua sem granizo'); }
  const f0 = await forc('lixo');
  ok(f0.granizo === false, '?tempo= desconhecido não dá granizo');

  // ---------------- 3. Pedido e cache do tempo (sem rede nova) ----------------
  const resp = function (codigo) { return { temperature_2m: 12, wind_speed_10m: 15, weather_code: codigo, is_day: 1 }; };
  for (const [cod, esperado] of [[96, true], [99, true], [95, false], [0, false], [3, false], [45, false], [61, false], [80, false], [82, false]]) {
    const g = await abrir('', resp(cod));
    ok(g.json('tempoAtual().granizo') === esperado, 'pedido com weather_code ' + cod + ': granizo ' + esperado + ', deu ' + g.json('tempoAtual().granizo'));
    const cache = JSON.parse(g.guardado.yoshicat_tempo_cache_v1 || 'null');
    ok(cache && cache.ok === true && cache.granizo === esperado, 'a cache guarda granizo ' + esperado + ' (código ' + cod + '): ' + JSON.stringify(cache));
    ok(g.json('tempoAtual().ceu') === (cod === 95 || cod >= 96 ? 'trovoada' : g.json('tempoAtual().ceu')), 'ceu coerente com o código ' + cod);
    ok(g.pedidos.length === 1 && /weather_code/.test(g.pedidos[0]) && /api\.open-meteo\.com/.test(g.pedidos[0]), 'um só pedido de rede, o de sempre (com weather_code): ' + g.pedidos.length);
  }
  const g96 = await abrir('', resp(96));
  ok(g96.json('tempoAtual().ceu') === 'trovoada', 'com 96 o céu é trovoada');
  { // cache fresca COM granizo e cache antiga SEM o campo
    const agora = Date.now();
    const fresca = { fetchedAt: agora, ok: true, tempC: 12, ventoKmh: 15, ceu: 'trovoada', granizo: true, chuvaEm: null };
    const a = await abrir('', null, fresca);
    ok(a.json('tempoAtual().granizo') === true && a.json('tempoAtual().ceu') === 'trovoada' && a.pedidos.length === 0, 'cache fresca com granizo: usa-a sem novo pedido');
    const antiga = { fetchedAt: agora, ok: true, tempC: 12, ventoKmh: 15, ceu: 'trovoada', chuvaEm: null };
    const b = await abrir('', null, antiga);
    ok(b.json('tempoAtual().granizo') === false && b.json('tempoAtual().ceu') === 'trovoada' && b.json('tempoAtual().disponivel') === true && b.pedidos.length === 0, 'cache antiga sem o campo continua válida e conta sem granizo');
    ['sim', 'true', 1, null, 'granizo', {}, []].forEach(function (v) { /* valores estranhos */ });
    for (const v of ['sim', 'true', 1, 0, null, {}, []]) {
      const c = await abrir('', null, Object.assign({}, antiga, { granizo: v }));
      ok(c.json('tempoAtual().granizo') === false, 'cache com granizo ' + JSON.stringify(v) + ' conta como sem granizo');
    }
    const stale = { fetchedAt: agora - 10 * 24 * 3600 * 1000, ok: false, stale: { ceu: 'trovoada', granizo: true, tempC: 12, ventoKmh: 15, calorForte: false, frioForte: false, ventoForte: false, disponivel: true } };
    const d = await abrir('', null, stale);
    ok(d.json('tempoAtual().granizo') === true || d.json('tempoAtual().disponivel') !== undefined, 'cache falhada com dados antigos não rebenta');
  }

  // ---------------- 4. Fundo da Vinha ----------------
  const fundo = function (g, cond) { g.cx.__t = cond; g.ev('tempoAtual = function () { return __t; };'); return g.ev('fundoTempoVinha()'); };
  const cd = function (ceu, granizo) { return g0.json('condicaoDeTeste(14, 10, ' + JSON.stringify(ceu) + ', ' + (granizo ? 'true' : 'false') + ')'); };
  { const g = await abrir('', null);
    ok(fundo(g, cd('trovoada', true)) === 'assets/ecras/granizo.jpg', 'Vinha: com granizo o fundo é granizo.jpg');
    ok(fundo(g, cd('trovoada', false)) === 'assets/ecras/trovoada_chizo.jpg', 'Vinha: a trovoada normal mantém trovoada_chizo.jpg');
    ok(fundo(g, cd('nevoeiro', false)) === 'assets/ecras/nevoeiro_1.jpg' && fundo(g, cd('chuva', false)) === 'assets/ecras/tempo_chuva.jpg', 'Vinha: nevoeiro e chuva iguais');
    ok(fundo(g, cd('chuva', true)) === 'assets/ecras/tempo_chuva.jpg' && fundo(g, cd('sol', true)) === null, 'Vinha: granizo true sem trovoada não muda o fundo');
    ok(fundo(g, { disponivel: false }) === null, 'Vinha: sem tempo disponível, sem fundo do tempo');
    ok(g.ev('TEMPO_CONFIG.imagens.granizo') === 'assets/ecras/granizo.jpg' && g.ev('TEMPO_CONFIG.imagens.trovoada') === 'assets/ecras/trovoada_chizo.jpg', 'TEMPO_CONFIG.imagens: granizo novo e trovoada como era');
  }
  // ---------------- 5. Aviso no Proteger; o resto da trovoada fica igual ----------------
  { const g = await abrir('', null);
    const aviso = function (cond, lingua) { g.cx.__t = cond; g.ev('tempoAtual = function () { return __t; }; currentLang = ' + JSON.stringify(lingua) + ';'); return g.ev('avisoTempoProteger()'); };
    const T = g.json('TRANSLATIONS');
    ['pt', 'en', 'es'].forEach(function (l) {
      ok(aviso(cd('trovoada', true), l) === T[l]['tempo.avisoGranizoProteger'], l + ': o aviso do granizo aparece no Proteger');
      ok(aviso(cd('trovoada', false), l) === T[l]['tempo.avisoTrovoadaProteger'], l + ': a trovoada normal mantém o aviso de sempre');
      ok(aviso(cd('nevoeiro', false), l) === T[l]['tempo.avisoNevoeiroProteger'], l + ': o nevoeiro mantém o aviso');
      ok(aviso(cd('sol', true), l) === '' && aviso({ disponivel: false }, l) === '', l + ': sem trovoada nem nevoeiro, sem aviso');
    });
    g.cx.__t = cd('trovoada', true); g.ev('tempoAtual = function () { return __t; };');
    ok(g.ev('rondasProtegerPorTempo()') === 2, 'com granizo continua a haver 1 ronda extra (trovoada)');
    ok(JSON.stringify(g.json('TEMPO_CONFIG.vantagens.rondasExtraProteger')) === '{"nevoeiro":1,"trovoada":1}', 'as rondas extra não ganharam nenhuma entrada de granizo');
    ok(g.ev('alvoDosPorcosDoDia(0, { dia: "2026-10-10", estacao: "outono", fase: "repouso", ceu: tempoAtual().ceu, garrafaEscura: false, forcado: null })') === 'trovoada', 'a pista dos porcos com granizo continua a ser "trovoada"');
    ok(g.ev('tipoDeProtegerPelaPista("trovoada")') === 'disfarces', 'o mini-jogo da trovoada continua o mesmo (Disfarces)');
    ok(g.ev('ceuTrovoadaIntacto = tempoAtual().ceu') === 'trovoada', 'o céu continua trovoada');
    // textos
    const chaves = ['tempo.avisoGranizoProteger'];
    ['pt', 'en', 'es'].forEach(function (l) {
      chaves.forEach(function (k) { const v = T[l][k]; ok(typeof v === 'string' && v.trim() !== '' && v.length <= 80, l + ': ' + k + ' em falta, vazio ou > 80 caracteres'); });
      ok(!/\d|%|°|km|mm|hectare|colheita|prejuízo|damage|daño|destr/i.test(T[l]['tempo.avisoGranizoProteger'] || ''), l + ': o aviso não afirma factos (números, danos, vinhas)');
    });
    ok(T.pt['tempo.avisoGranizoProteger'] !== T.en['tempo.avisoGranizoProteger'] && T.en['tempo.avisoGranizoProteger'] !== T.es['tempo.avisoGranizoProteger'] && /granizo/i.test(T.pt['tempo.avisoGranizoProteger']) && /hail/i.test(T.en['tempo.avisoGranizoProteger']) && /granizo/i.test(T.es['tempo.avisoGranizoProteger']), 'o aviso é próprio em cada língua');
    ok(Object.keys(T.pt).length === Object.keys(T.en).length && Object.keys(T.en).length === Object.keys(T.es).length, 'as 3 línguas têm o mesmo número de chaves');
    const tk = function (l) { return Object.keys(T[l]).filter(function (k) { return /^tempo\./.test(k); }).sort().join(); };
    ok(tk('pt') === tk('en') && tk('en') === tk('es'), 'as 3 línguas têm as mesmas chaves tempo.*');
  }
  // ---------------- 6. Imagem, sem estado novo, sem nuvem ----------------
  {
    const dst = path.join(RAIZ, 'assets', 'ecras', 'granizo.jpg');
    const orig = path.join(RAIZ, 'imagens_JOGO_TELEGRAM', 'granizo.jpg');
    ok(fs.existsSync(dst), 'assets/ecras/granizo.jpg existe');
    if (fs.existsSync(dst)) {
      const b = fs.readFileSync(dst);
      ok(b[0] === 0xff && b[1] === 0xd8, 'granizo.jpg é um JPEG');
      let w = 0, h = 0;
      for (let i = 2; i < b.length - 9;) { if (b[i] !== 0xff) { i++; continue; } const m = b[i + 1]; if (m >= 0xc0 && m <= 0xc2) { h = b.readUInt16BE(i + 5); w = b.readUInt16BE(i + 7); break; } i += 2 + b.readUInt16BE(i + 2); }
      ok(w === 714 && h === 1280, 'granizo.jpg tem 714x1280, tem ' + w + 'x' + h);
      ok(b.length <= 250 * 1024, 'granizo.jpg não devia pesar mais de 250 KB (pesa ' + b.length + ')');
      if (fs.existsSync(orig)) ok(crypto.createHash('md5').update(b).digest('hex') === crypto.createHash('md5').update(fs.readFileSync(orig)).digest('hex'), 'assets/ecras/granizo.jpg é igual ao original');
    }
    if (fs.existsSync(path.join(RAIZ, 'imagens_JOGO_TELEGRAM'))) ok(fs.existsSync(orig), 'o original imagens_JOGO_TELEGRAM/granizo.jpg continua no sítio');
    // As 3 imagens da Loja (js/loja.js) também vêm desta pasta e já foram copiadas de propósito (ver verificar-loja.js).
    const DA_LOJA = ['lojas_casas.jpg', 'lojas_casas_janelas_abertas_2.jpg', 'casa_loja_meio_da_vinha_4.jpg'];
    // A festa da vindima (fundo do Lagar depois de pôr a mesa, ver verificar-mesa.js) e as 4 imagens de "Vigiar a vinha" (js/vigiar.js) também foram copiadas de propósito (ver verificar-vigiar.js).
    DA_LOJA.push('festa_vindima_pessoas.jpg', 'varios_talhoes_da_vinha.jpg', 'doencas_e_pragas.jpg', 'doencas_e_pragas_2.jpg', 'pragas_sol.jpg', 'pragas_sol_2.jpg');
    const outras = fs.existsSync(path.join(RAIZ, 'imagens_JOGO_TELEGRAM')) ? fs.readdirSync(path.join(RAIZ, 'imagens_JOGO_TELEGRAM')).filter(function (f) { return f !== 'granizo.jpg' && DA_LOJA.indexOf(f) === -1; }) : [];
    outras.forEach(function (f) { ok(!fs.existsSync(path.join(RAIZ, 'assets', 'ecras', f)) && !fs.existsSync(path.join(RAIZ, 'assets', 'vinha', f)) && !fs.existsSync(path.join(RAIZ, 'assets', f)), 'a imagem ' + f + ' não devia ter sido copiada para assets/'); });
    const codigoJs = fs.readdirSync(path.join(RAIZ, 'js')).filter(function (f) { return /\.js$/.test(f); }).map(function (f) { return [f, fs.readFileSync(path.join(RAIZ, 'js', f), 'utf8')]; });
    outras.forEach(function (f) { codigoJs.forEach(function (p) { ok(p[1].indexOf(f) === -1, 'js/' + p[0] + ' não devia usar ' + f); }); });
    const estado = g0.json('defaultState()');
    ok(!/granizo/i.test(JSON.stringify(estado)), 'o estado por omissão não ganhou nada de granizo');
    ok(!/granizo/i.test(fs.readFileSync(path.join(RAIZ, 'js', 'state.js'), 'utf8')) && !/granizo/i.test(fs.readFileSync(path.join(RAIZ, 'js', 'nuvem.js'), 'utf8')), 'state.js e nuvem.js não falam de granizo (sem estado novo, sem nuvem)');
    const t = semCom(fontes['tempo.js']);
    ok((t.match(/fetch\(/g) || []).length === 1, 'tempo.js continua com um só fetch (sem pedido de rede novo)');
    ok(/granizo/.test(fs.readFileSync(path.join(RAIZ, 'CREDITOS.md'), 'utf8')), 'CREDITOS.md fala da granizo.jpg');
    ok(/https:\/\/api\.open-meteo\.com\/v1\/forecast\?latitude=' \+ TEMPO_CONFIG\.latitude/.test(fontes['tempo.js']) && /current=temperature_2m,wind_speed_10m,weather_code,is_day/.test(fontes['tempo.js']), 'o pedido à Open-Meteo é o de sempre');
  }
  return falhas;
}

function mutar(ficheiro, de, para) {
  if (FONTES[ficheiro].indexOf(de) === -1) { falhas0.push('mutação impossível (texto não encontrado em ' + ficheiro + '): ' + de); return null; }
  const f = Object.assign({}, FONTES);
  f[ficheiro] = FONTES[ficheiro].split(de).join(para);
  return f;
}
const falhas0 = [];
const MUTACOES = [
  ['o 95 também dá granizo', 'tempo.js', 'return codigo === 96 || codigo === 99;', 'return codigo >= 95 && codigo <= 99;'],
  ['só o 96 dá granizo', 'tempo.js', 'return codigo === 96 || codigo === 99;', 'return codigo === 96;'],
  ['só o 99 dá granizo', 'tempo.js', 'return codigo === 96 || codigo === 99;', 'return codigo === 99;'],
  ['texto "96" dá granizo (== em vez de ===)', 'tempo.js', 'return codigo === 96 || codigo === 99;', 'return codigo == 96 || codigo == 99;'],
  ['a regra usa o relógio', 'tempo.js', 'return codigo === 96 || codigo === 99;', 'return (codigo === 96 || codigo === 99) && Date.now() > 0;'],
  ['sem ?tempo=granizo', 'tempo.js', "  granizo: function () { return condicaoDeTeste(14, 20, 'trovoada', true); },", ''],
  ['?tempo=granizo sem a marca', 'tempo.js', "condicaoDeTeste(14, 20, 'trovoada', true); },", "condicaoDeTeste(14, 20, 'trovoada'); },"],
  ['?tempo=trovoada passa a ter granizo', 'tempo.js', "trovoada: function () { return condicaoDeTeste(20, 20, 'trovoada'); },", "trovoada: function () { return condicaoDeTeste(20, 20, 'trovoada', true); },"],
  ['a condição tem sempre granizo', 'tempo.js', 'granizo: granizo === true,', 'granizo: true,'],
  ['a condição aceita qualquer valor verdadeiro', 'tempo.js', 'granizo: granizo === true,', 'granizo: !!granizo,'],
  ['o céu do granizo deixa de ser trovoada', 'tempo.js', '_tempoAtual = condicaoDeTeste(tempC, ventoKmh, ceu, granizo);', "_tempoAtual = condicaoDeTeste(tempC, ventoKmh, granizo ? 'granizo' : ceu, granizo);"],
  ['o pedido não lê o código', 'tempo.js', 'const granizo = tempoCodigoComGranizo(dados.current.weather_code);', 'const granizo = false;'],
  ['a cache não guarda o granizo', 'tempo.js', 'ceu: ceu, granizo: granizo, chuvaEm:', 'ceu: ceu, chuvaEm:'],
  ['a cache lida ignora o granizo', 'tempo.js', 'cache.ceu, cache.granizo === true) : (cache.stale', 'cache.ceu) : (cache.stale'],
  ['a cache aceita granizo estranho', 'tempo.js', 'cache.ceu, cache.granizo === true) : (cache.stale', 'cache.ceu, !!cache.granizo) : (cache.stale'],
  ['cache antiga sem o campo rebenta', 'tempo.js', 'cache.ceu, cache.granizo === true) : (cache.stale', 'cache.ceu, cache.granizo.valueOf() === true) : (cache.stale'],
  ['um 2.º pedido de rede', 'tempo.js', "    const resposta = await fetch(url, { signal: controlador.signal });", "    const resposta = await fetch(url, { signal: controlador.signal }); await fetch(url);"],
  ['a imagem do granizo é a da trovoada', 'tempo.js', "granizo: 'assets/ecras/granizo.jpg',", "granizo: 'assets/ecras/trovoada_chizo.jpg',"],
  ['a Vinha nunca usa o granizo', 'vinha.js', "if (tempo.ceu === 'trovoada' && tempo.granizo === true) return TEMPO_CONFIG.imagens.granizo;", ''],
  ['a Vinha usa o granizo na trovoada normal', 'vinha.js', "if (tempo.ceu === 'trovoada' && tempo.granizo === true) return TEMPO_CONFIG.imagens.granizo;", "if (tempo.ceu === 'trovoada') return TEMPO_CONFIG.imagens.granizo;"],
  ['a Vinha usa o granizo sem trovoada', 'vinha.js', "if (tempo.ceu === 'trovoada' && tempo.granizo === true) return TEMPO_CONFIG.imagens.granizo;", "if (tempo.granizo) return TEMPO_CONFIG.imagens.granizo;"],
  ['o aviso do Proteger é sempre o do granizo', 'proteger.js', "t(tempo.granizo === true ? 'tempo.avisoGranizoProteger' : 'tempo.avisoTrovoadaProteger')", "t('tempo.avisoGranizoProteger')"],
  ['o aviso do granizo nunca aparece', 'proteger.js', "t(tempo.granizo === true ? 'tempo.avisoGranizoProteger' : 'tempo.avisoTrovoadaProteger')", "t('tempo.avisoTrovoadaProteger')"],
  ['texto em falta (PT)', 'i18n.js', "'tempo.avisoGranizoProteger': 'Chove granizo! Até os porcos se esconderam no barril.',", ''],
  ['texto em falta (ES)', 'i18n.js', "'tempo.avisoGranizoProteger': '¡Cae granizo! Hasta los cerdos se han escondido en el barril.',", ''],
  ['o texto afirma um facto', 'i18n.js', "'Hail is falling! Even the pigs are hiding in the barrel.'", "'Hail destroyed 40% of the harvest!'"],
  ['rondas extra de granizo', 'tempo.js', "rondasExtraProteger: { nevoeiro: 1, trovoada: 1 }", "rondasExtraProteger: { nevoeiro: 1, trovoada: 1, granizo: 2 }"]
];

(async function () {
  let falhas = await suite(FONTES);
  if (rejeicoes > 0) falhas.push('o código real deixou promessas rejeitadas (' + rejeicoes + ')');
  falhas = falhas0.concat(falhas);
  for (const m of MUTACOES) {
    const f = mutar(m[1], m[2], m[3]);
    if (!f) continue;
    let apanhada;
    const antes = rejeicoes;
    try { apanhada = (await suite(f)).length > 0; await new Promise(function (r) { setImmediate(r); }); if (rejeicoes > antes) apanhada = true; } catch (e) { apanhada = true; if (process.env.GRANIZO_DEBUG) console.log('(mutação que rebenta: ' + m[0] + ': ' + e.message.split('\n')[0] + ')'); }
    if (!apanhada) falhas.push('MUTAÇÃO NÃO APANHADA: ' + m[0]);
  }
  falhas = falhas0.concat(falhas.filter(function (x) { return falhas0.indexOf(x) === -1; }));
  if (falhas.length) {
    falhas.slice(0, 40).forEach(function (m) { console.log('FALHA: ' + m); });
    console.log(falhas.length + ' falha(s)');
    process.exit(1);
  }
  console.log('OK (' + MUTACOES.length + ' mutações apanhadas)');
})();
