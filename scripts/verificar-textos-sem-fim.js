#!/usr/bin/env node
// O JOGO NUNCA ACABA (decisão do Nuno): nenhum texto pode soar a despedida. Quem chega ao último nível definido
// (hoje o 20) não vê frases de fim, vê frases que prometem mais. Este teste fixa, em pt, en e es, os 3 textos que
// aparecem quando já não há mais nada definido:
//   · nivel.maximo               (cartão do Nível, sem nível seguinte; js/i18n.js)
//   · cStr('ui').todos           (cartão do Capítulo, todos cumpridos; js/capitulos.js)
//   · explorar.tudoDesbloqueado  (Enciclopédia, tudo aberto; js/i18n.js)
// Prova: (a) cada um é EXATAMENTE o texto combinado; (b) nenhum traz palavras de fim («máximo», «atingido», «maximum»,
// «reached», «alcanzado», «completed», «terminaste»...); (c) todos prometem mais («mais», «more», «más», «vêm», «coming»,
// «vienen»); (d) os cartões reais mostram esses textos (nível 20 sem nível seguinte, todos os capítulos cumpridos, tudo
// desbloqueado na Enciclopédia) e nenhum dos textos antigos.
//
// Uso: node scripts/verificar-textos-sem-fim.js
// JS_DIR=pasta  corre sobre outra versão dos js/ (para provar que o teste apanha o que se estraga).
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const path = require('path');
const { abrirJogo } = require('./_jogo-vm');

const RAIZ = path.join(__dirname, '..');
const JS_DIR = process.env.JS_DIR || path.join(RAIZ, 'js');
const LINGUAS = ['pt', 'en', 'es'];
let falhas = 0;
function ok(cond, msg) { if (!cond) { falhas++; console.log('FALHA: ' + msg); } }
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }

// Os textos combinados.
const NOVOS = {
  nivel: {
    pt: 'Há mais níveis a caminho!',
    en: 'More levels are on the way!',
    es: '¡Hay más niveles en camino!'
  },
  capitulos: {
    pt: 'Todos os capítulos de agora cumpridos. Vêm aí mais!',
    en: 'All the chapters so far are done. More are coming!',
    es: 'Todos los capítulos de ahora cumplidos. ¡Vienen más!'
  },
  enciclopedia: {
    pt: 'Já desbloqueaste todo o conhecimento de agora sobre o Moscatel de Setúbal. Vêm aí mais histórias!',
    en: 'You have unlocked all the Moscatel de Setúbal knowledge so far. More stories are coming!',
    es: 'Ya has desbloqueado todo el conocimiento de ahora sobre el Moscatel de Setúbal. ¡Vienen más historias!'
  }
};

// Os textos de fim que não podem voltar (e as palavras que os denunciam).
const ANTIGOS = [
  'Nível máximo atingido!', 'Maximum level reached!', '¡Nivel máximo alcanzado!',
  'Todos os capítulos cumpridos', 'All chapters completed', 'Todos los capítulos cumplidos',
  'Já desbloqueaste todo o conhecimento sobre o Moscatel de Setúbal!',
  "You've unlocked all the knowledge about Setúbal Moscatel!",
  '¡Ya has desbloqueado todo el conocimiento sobre el Moscatel de Setúbal!'
];
const PALAVRAS_DE_FIM = /m[aá]xim[oa]|maximum|atingid|reached|alcanzad|completed|terminaste|terminado|acabou|acabaste|you finished|has terminado|fim d[oa]|the end|game over|despedid|goodbye|adeus|adiós/i;
const PROMETE_MAIS = { pt: /\bmais\b|\bvêm\b/i, en: /\bmore\b/i, es: /\bmás\b|\bvienen\b/i };

function abrir() {
  return abrirJogo({ jsDir: JS_DIR, explorar: true, ecraReal: true }); // ecraReal: o cartão da Enciclopédia só aparece com o ecrã aberto
}
function lingua(g, l) { g.ev("currentLang = '" + l + "';"); }

const g = abrir();
LINGUAS.forEach(function (l) {
  lingua(g, l);
  const L = ' (' + l + ')';
  const textos = {
    nivel: g.ev("t('nivel.maximo')"),
    capitulos: g.ev("cStr('ui').todos"),
    enciclopedia: g.ev("t('explorar.tudoDesbloqueado')")
  };
  Object.keys(NOVOS).forEach(function (k) {
    ok(textos[k] === NOVOS[k][l], '(a) o texto «' + k + '» devia ser «' + NOVOS[k][l] + '» e é «' + textos[k] + '»' + L);
    ok(!PALAVRAS_DE_FIM.test(textos[k]), '(b) o texto «' + k + '» soa a fim: «' + textos[k] + '»' + L);
    ok(PROMETE_MAIS[l].test(textos[k]), '(c) o texto «' + k + '» devia prometer mais: «' + textos[k] + '»' + L);
    ok(ANTIGOS.indexOf(textos[k]) === -1, '(b) voltou um texto de fim antigo: «' + textos[k] + '»' + L);
  });
});

// (d) Os cartões reais, com o jogador no último nível definido.
LINGUAS.forEach(function (l) {
  const h = abrir();
  lingua(h, l);
  const L = ' (' + l + ')';
  const ultimo = h.ev('NIVEIS_CONFIG.length');
  const minUltimo = h.ev('NIVEIS_CONFIG[NIVEIS_CONFIG.length - 1].min');
  h.ev('state.reputacao = ' + minUltimo + ';');
  h.ev('atualizarCartaoNivelQuinta();');
  const cartaoNivel = h.el('nivel-container').innerHTML;
  ok(h.ev('nivelPelaReputacao(state.reputacao)') === ultimo, '(d) o jogador devia estar no último nível (' + ultimo + ')' + L);
  ok(cartaoNivel.indexOf(esc(NOVOS.nivel[l])) !== -1 && cartaoNivel.indexOf('width:100%') !== -1, '(d) o cartão do Nível sem nível seguinte devia dizer «' + NOVOS.nivel[l] + '»' + L + ': ' + cartaoNivel);
  ANTIGOS.forEach(function (a) { ok(cartaoNivel.indexOf(esc(a)) === -1, '(d) o cartão do Nível traz um texto de fim antigo: «' + a + '»' + L); });

  // Todos os capítulos cumpridos: o estado marca-os todos como concluídos.
  h.ev("CAPITULOS_CONFIG.forEach(function (c) { state.capitulos.concluidos[c.id] = true; state.capitulos.celebrados[c.id] = true; });");
  h.ev('atualizarCapituloQuinta();');
  const cartaoCap = h.el('capitulo-container').innerHTML;
  ok(cartaoCap.indexOf(esc(NOVOS.capitulos[l])) !== -1, '(d) o cartão do Capítulo, com todos cumpridos, devia dizer «' + NOVOS.capitulos[l] + '»' + L + ': ' + cartaoCap);
  ANTIGOS.forEach(function (a) { ok(cartaoCap.indexOf(esc(a)) === -1, '(d) o cartão do Capítulo traz um texto de fim antigo: «' + a + '»' + L); });

  // Enciclopédia com tudo desbloqueado.
  h.ev("state.encyclopedia.unlocked = encyclopediaEntries().map(function (e) { return e.id; });");
  // O que o ecrã da Enciclopédia chama fora de js/explorar.js não existe no ambiente simulado.
  h.ev('function mostrarNovaEntrada() {} function atualizarDialogo() {} function definirFundo() {} function reposicionarFlutuantes() {} function vibrar() {} function tocarSom() {} function updateStatsDisplays() {} function mostrarFalas() {}');
  h.ev('enterExplorar();');
  const explorar = h.el('explorar-container').innerHTML;
  ok(explorar.indexOf(esc(NOVOS.enciclopedia[l])) !== -1, '(d) a Enciclopédia, com tudo desbloqueado, devia dizer «' + NOVOS.enciclopedia[l] + '»' + L);
  ANTIGOS.forEach(function (a) { ok(explorar.indexOf(esc(a)) === -1, '(d) a Enciclopédia traz um texto de fim antigo: «' + a + '»' + L); });
});

if (falhas) { console.log(falhas + ' falha(s)'); process.exit(1); }
console.log('OK');
