#!/usr/bin/env node
// Texto dos objetivos diários "Hoje na Quinta" (js/objetivos.js) e defesa contra ids sem dados:
// 1) os 18 objetivos (pools A e B e os 5 do Grupo C) têm texto nas 3 línguas, na própria entrada
//    ({ pt, en, es }) OU na chave 'objetivo.<id>' de js/i18n.js, e o texto mostrado é o mesmo de sempre;
// 2) um id guardado em state.objetivos.lista que já não tem dados (nem texto na entrada nem chave no
//    i18n.js) não aparece no cartão e não bloqueia o bónus dos 3 (nada é apagado do estado).
// Corre o state.js, o i18n.js, o niveis.js e o objetivos.js REAIS num ambiente simulado (vm), sem browser
// nem conta real (nada é gravado).
//
// Uso: node scripts/verificar-objetivos.js
// OBJETIVOS_JS=caminho  I18N_JS=caminho  corre sobre outra versão desses ficheiros (para provar que os
//   testes apanham um texto em falta, ex.: sem o "es" de um objetivo).
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const OBJETIVOS_JS = process.env.OBJETIVOS_JS || path.join(RAIZ, 'js', 'objetivos.js');
const I18N_JS = process.env.I18N_JS || path.join(RAIZ, 'js', 'i18n.js');
const LINGUAS = ['pt', 'en', 'es'];
const IDS_ESPERADOS = [
  'vinha_cavar', 'vinha_plantar', 'vinha_ervas', 'vinha_regar', 'vinha_adubar', 'vinha_compostagem', 'vinha_colher',
  'adega_prensar', 'adega_alambique', 'adega_fortificar', 'adega_engarrafar',
  'proteger_vencer', 'explorar_descobrir',
  'festa_tarefa', 'tempo_chuva', 'tempo_vento', 'tempo_frio', 'tempo_vigiar'
];
let falhas = 0;
function ok(cond, msg) { if (!cond) { falhas++; console.log('FALHA: ' + msg); } }
function temTexto(v) { return typeof v === 'string' && v.trim() !== ''; }

function abrir() {
  const guardado = {};
  const elementos = {};
  function el(id) { return elementos[id] || (elementos[id] = { hidden: true, textContent: '', innerHTML: '', id: id }); }
  const sb = {
    console: { log() {}, warn() {}, error() {} },
    localStorage: {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(guardado, k) ? guardado[k] : null; },
      setItem: function (k, v) { guardado[k] = String(v); },
      removeItem: function (k) { delete guardado[k]; }
    },
    location: { search: '' },
    URLSearchParams: URLSearchParams,
    Intl: Intl,
    document: {
      addEventListener: function () {}, querySelectorAll: function () { return []; },
      querySelector: function () { return null; }, getElementById: el
    },
    setTimeout: function () {}, clearTimeout: function () {},
    Date: Date
  };
  sb.window = sb;
  sb.window.addEventListener = function () {};
  sb.Telegram = { WebApp: {} };
  const cx = vm.createContext(sb);
  require('./_regras-tempo').injetarRegrasTempo(cx);
  function carregar(ficheiro, nome) { vm.runInContext(fs.readFileSync(ficheiro, 'utf8'), cx, { filename: nome }); }
  carregar(path.join(RAIZ, 'js', 'state.js'), 'state.js');
  carregar(I18N_JS, 'i18n.js');
  carregar(path.join(RAIZ, 'js', 'niveis.js'), 'niveis.js');
  vm.runInContext(`
    var SOM = 0;
    function diaLisboaDeHoje() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
    function randInt(a, b) { return a; }
    function mostrarFalas() {} function reposicionarFlutuantes() {}
    function vibrar() {} function tocarSom() { SOM++; } function updateStatsDisplays() {}
    function ecraDesbloqueado() { return false; }
    function festaAtual() { return null; } function festaTemTarefaPorFazerHoje() { return false; }
    function tempoAtual() { return { disponivel: false }; } function jaFezTarefaTempoHoje() { return true; }
    function vigiarSinalAgora() { return null; } function vigiarJaFezHoje() { return true; }
    function estacaoAtual() { return 'outono'; }
    var VINHA_BONUS_ESTACAO = {}; var RESIDUOS_POR_COMPOSTAGEM = 99;
    function vitoriasProtegerComPremioRestantesHoje() { return 0; } function entradasBloqueadas() { return []; }
    function alambiquePodeDestilar() { return false; } function diasDescansadosNaCave() { return 0; }
    var ADEGA_CUSTO_UVAS_PRENSAR = 99, ADEGA_CUSTO_GOTAS_FORTIFICAR = 99, ADEGA_CUSTO_AGUARDENTE_FORTIFICAR = 99;
    var REGRAS_DESCANSO_CAVE = { diasMinimos: 99 };
  `, cx);
  carregar(OBJETIVOS_JS, 'objetivos.js');
  return { cx: cx, ev: function (c) { return vm.runInContext(c, cx); }, el: el };
}

const g = abrir();
const texto = function (l, id) { return g.ev("(function () { currentLang = '" + l + "'; return objetivoTexto('" + id + "'); })()"); };

// ----- 1. Os 18 objetivos têm texto nas 3 línguas -----
{
  const ids = g.ev("OBJETIVOS_POOL_A.concat(OBJETIVOS_POOL_B).concat(OBJETIVOS_GRUPO_C).map(function (o) { return o.id; })");
  ok(ids.length === IDS_ESPERADOS.length && IDS_ESPERADOS.every(function (id) { return ids.indexOf(id) !== -1; }),
    'os ids dos objetivos não são os 18 esperados: ' + ids);
  IDS_ESPERADOS.forEach(function (id) {
    LINGUAS.forEach(function (l) {
      const naEntrada = g.ev("(function () { var e = objetivoEntrada('" + id + "'); return e && e.texto ? e.texto['" + l + "'] : null; })()");
      const noI18n = g.ev("TRANSLATIONS['" + l + "']['objetivo." + id + "']");
      ok(temTexto(naEntrada) || temTexto(noI18n), id + ': falta o texto em ' + l + ' (nem na entrada nem na chave objetivo.' + id + ')');
      // O texto mostrado é o da entrada, se existir, senão o do i18n.js (como sempre).
      ok(texto(l, id) === (temTexto(naEntrada) ? naEntrada : noI18n), id + ': objetivoTexto devia dar o texto de ' + l);
      ok(g.ev("objetivoTemDados('" + id + "')") === true, id + ': devia ter dados');
    });
  });
}

// ----- 2. Texto só na entrada (sem chave no i18n.js) -----
{
  g.ev("OBJETIVOS_POOL_B.push({ id: 'so_na_entrada', texto: { pt: 'Olá', en: 'Hello', es: 'Hola' } })");
  ok(g.ev("objetivoTemDados('so_na_entrada')") === true, 'texto só na entrada: devia ter dados');
  ok(texto('en', 'so_na_entrada') === 'Hello' && texto('es', 'so_na_entrada') === 'Hola' && texto('pt', 'so_na_entrada') === 'Olá', 'texto só na entrada: devia dar o da língua');
  g.ev('OBJETIVOS_POOL_B.pop()');
  ok(g.ev("objetivoEntrada('so_na_entrada')") === null, 'a entrada de teste devia ter saído');
}

// ----- 3. Um id sem dados: não aparece no cartão e não bloqueia o bónus dos 3 -----
{
  g.ev("currentLang = 'pt'");
  ok(g.ev("objetivoTemDados('id_que_ja_nao_existe')") === false, 'um id desconhecido não devia ter dados');
  g.ev(`
    state.objetivos.dia = diaLisboaDeHoje(); state.objetivos.bonusDiaDado = false;
    state.objetivos.lista = [
      { id: 'vinha_regar', cumprido: false },
      { id: 'id_que_ja_nao_existe', cumprido: false },
      { id: 'vinha_colher', cumprido: false }
    ];
    state.reputacao = 100; var SELOS0 = state.objetivos.selosTotal;
  `);
  g.ev('atualizarCartaoObjetivosQuinta(); atualizarResumoQuinta();');
  const html = g.el('objetivos-container').innerHTML;
  ok(html.indexOf('objetivo.') === -1 && html.indexOf('id_que_ja_nao_existe') === -1, 'o cartão não devia mostrar o id sem dados: ' + html);
  ok(html.indexOf(g.ev("TRANSLATIONS.pt['objetivo.vinha_regar']")) !== -1 && html.indexOf(g.ev("TRANSLATIONS.pt['objetivo.vinha_colher']")) !== -1, 'o cartão devia mostrar os 2 objetivos com dados');
  ok(g.el('quinta-resumo-linha').textContent.indexOf('0/2') !== -1, 'o resumo devia dizer 0/2: ' + g.el('quinta-resumo-linha').textContent);
  g.ev("marcarObjetivoCumprido('vinha_regar')");
  ok(g.ev('state.reputacao') === 102 && g.ev('state.objetivos.bonusDiaDado') === false, 'com 1 de 2 feito: +2 e ainda sem bónus');
  g.ev("marcarObjetivoCumprido('vinha_colher')");
  ok(g.ev('state.reputacao') === 109, 'os 2 com dados feitos: +2 +2 +5 (bónus), deu ' + g.ev('state.reputacao'));
  ok(g.ev('state.objetivos.bonusDiaDado') === true && g.ev('state.objetivos.selosTotal') === g.ev('SELOS0') + 1, 'devia ter dado o bónus e +1 selo');
  ok(g.ev('state.objetivos.lista.length') === 3 && g.ev("state.objetivos.lista[1].id") === 'id_que_ja_nao_existe', 'o id sem dados NÃO se apaga do estado');
  ok(g.el('quinta-resumo-linha').textContent.indexOf('2/2') !== -1, 'o resumo devia dizer 2/2: ' + g.el('quinta-resumo-linha').textContent);
}

// ----- 4. Sem ids desconhecidos tudo se conta como antes (3 de 3) -----
{
  g.ev(`
    state.objetivos.bonusDiaDado = false; state.reputacao = 100;
    state.objetivos.lista = [ { id: 'vinha_regar', cumprido: false }, { id: 'proteger_vencer', cumprido: false }, { id: 'tempo_chuva', cumprido: false } ];
  `);
  g.ev("marcarObjetivoCumprido('vinha_regar'); marcarObjetivoCumprido('proteger_vencer');");
  ok(g.ev('state.objetivos.bonusDiaDado') === false && g.ev('state.reputacao') === 104, 'com 2 de 3: sem bónus');
  g.ev("marcarObjetivoCumprido('tempo_chuva')");
  ok(g.ev('state.objetivos.bonusDiaDado') === true && g.ev('state.reputacao') === 111, 'com 3 de 3: +2 +2 +2 +5');
}

if (falhas) { console.log(falhas + ' falha(s)'); process.exit(1); }
console.log('OK');
