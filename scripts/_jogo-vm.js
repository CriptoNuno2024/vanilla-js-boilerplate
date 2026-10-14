// Auxiliar dos verificar-*.js (não é um teste): abre o jogo REAL (state, i18n, niveis, personagens,
// historia, capitulos, objetivos, visitas, e depois js/dados.js e a pasta dados/) num ambiente simulado
// (módulo vm), sem browser nem conta real, pela mesma ordem do index.html. Nada é gravado.
//
// abrirJogo({ jsDir, dadosDir, aoAvisar })
//   jsDir     pasta dos js/ (por omissão a do projeto)
//   dadosDir  pasta dos dados/ (por omissão a do projeto); null = não carrega os ficheiros de dados
//   aoAvisar  função chamada com cada console.warn do jogo
// Devolve { cx, ev(expressão) }.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const FICHEIROS_DE_DADOS = ['visitas.js', 'niveis.js', 'historias.js', 'capitulos.js', 'objetivos.js'];

function abrirJogo(opcoes) {
  const o = opcoes || {};
  const jsDir = o.jsDir || path.join(RAIZ, 'js');
  const dadosDir = o.dadosDir === undefined ? path.join(RAIZ, 'dados') : o.dadosDir;
  const guardado = {};
  const elementos = {};
  function el(id) { return elementos[id] || (elementos[id] = { hidden: true, textContent: '', innerHTML: '', id: id }); }
  const sb = {
    console: { log() {}, warn: function (m) { if (o.aoAvisar) o.aoAvisar(String(m)); }, error() {} },
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
    Image: function () {},
    Date: Date
  };
  sb.window = sb;
  sb.window.addEventListener = function () {};
  sb.Telegram = { WebApp: {} };
  const cx = vm.createContext(sb);
  require('./_regras-tempo').injetarRegrasTempo(cx);
  function carregar(ficheiro, nome) { vm.runInContext(fs.readFileSync(ficheiro, 'utf8'), cx, { filename: nome }); }
  ['state.js', 'i18n.js', 'niveis.js', 'personagens.js'].forEach(function (f) { carregar(path.join(jsDir, f), 'js/' + f); });
  // Funções e constantes que o objetivos.js usa ao carregar (aqui só interessam os dados).
  vm.runInContext(`
    function diaLisboaDeHoje() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
    function randInt(a, b) { return a; }
    function mostrarFalas() {} function reposicionarFlutuantes() {}
    function vibrar() {} function tocarSom() {} function updateStatsDisplays() {}
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
  ['historia.js', 'capitulos.js', 'objetivos.js', 'visitas.js'].forEach(function (f) { carregar(path.join(jsDir, f), 'js/' + f); });
  // js/dados.js e os ficheiros de dados/ vêm depois das listas (como no index.html); uma pasta de js/
  // antiga (cópia) pode não ter o dados.js.
  if (fs.existsSync(path.join(jsDir, 'dados.js'))) {
    carregar(path.join(jsDir, 'dados.js'), 'js/dados.js');
    if (dadosDir !== null) {
      FICHEIROS_DE_DADOS.forEach(function (f) {
        const caminho = path.join(dadosDir, f);
        if (fs.existsSync(caminho)) carregar(caminho, 'dados/' + f);
      });
    }
  }
  return { cx: cx, ev: function (c) { return vm.runInContext(c, cx); } };
}

module.exports = { abrirJogo, FICHEIROS_DE_DADOS };
