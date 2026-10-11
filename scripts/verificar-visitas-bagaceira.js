#!/usr/bin/env node
// Um copo de bagaceira à visita (js/visitas.js: visitaBagaceiraPode, visitaBagaceiraOferecer, visitaBagaceiraHtml,
// visitaBagaceiraClique e as falas VISITAS_BAGACEIRA_FALAS; textos em js/i18n.js). Corre o state.js, i18n.js, niveis.js,
// alambique.js e visitas.js REAIS num ambiente simulado (vm), sem browser nem conta real. Nada é gravado de verdade.
//
// Depois de passar com o código real, o script ESTRAGA as regras de propósito (mutantes) e confirma que cada estrago faz
// falhar pelo menos uma verificação: se um mutante passar, o script falha.
//
// Uso: node scripts/verificar-visitas-bagaceira.js
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const ler = function (f) { return fs.readFileSync(path.join(RAIZ, f), 'utf8'); };
const VISITAS_SRC = ler('js/visitas.js');
const REP_NIVEL_3 = 50, REP_NIVEL_4 = 120, REP_NIVEL_7 = 600;

function correrTestes(visitasSrc) {
  const falhas = [];
  const ok = function (cond, msg) { if (!cond) falhas.push(msg); };

  const gravacoes = [];
  const elementos = {};
  const sb = {
    console: { log() {}, warn() {}, error() {} },
    localStorage: { getItem: function () { return null; }, setItem: function (k) { gravacoes.push(k); }, removeItem: function () {} },
    location: { search: '' }, URLSearchParams: URLSearchParams, Date: Date, setTimeout: function () {}, Image: function () {},
    document: { querySelectorAll: function () { return []; }, querySelector: function () { return null; }, getElementById: function (id) { return elementos[id] || (elementos[id] = { innerHTML: '' }); }, addEventListener: function () {} },
    Telegram: { WebApp: {} }
  };
  sb.window = sb;
  const cx = vm.createContext(sb);
  require('./_regras-tempo').injetarRegrasTempo(cx);
  const correr = function (codigo, nome) { return vm.runInContext(codigo, cx, { filename: nome || 'x' }); };
  correr(ler('js/state.js'), 'state.js');
  correr(ler('js/i18n.js'), 'i18n.js');
  correr(`
    var FALAS = [], SONS = 0, VIBRACOES = 0;
    function mostrarFalas(f, quem) { FALAS.push({ f: f, quem: quem }); }
    function vibrar() { VIBRACOES++; } function tocarSom() { SONS++; }
    function estacaoAtual() { return 'inverno'; } function faseRealAtual() { return 'repouso'; }
    function festaAtual() { return null; } function caveReservaAberta() { return false; } function garrafaQueMaisDescansou() { return null; }
    function cadernoEscapar(s) { return String(s); }
    function atualizarCartaoNivelQuinta() {} function atualizarResumoQuinta() {}
    var __dia = '2026-10-20';
    function diaLisboaDeHoje() { return __dia; }
  `, 'stubs');
  ['niveis.js', 'alambique.js'].forEach(function (f) { correr(ler('js/' + f), f); });
  correr(visitasSrc, 'visitas.js');
  correr('var __saves = 0, __barras = 0; var __sv = saveState; saveState = function (s) { __saves++; return __sv(s); }; ' +
    'var __ub = typeof updateStatsDisplays === "function" ? updateStatsDisplays : function () {}; updateStatsDisplays = function () { __barras++; };', 'spies');

  const N = function (c) { return correr(c); };
  const dia = function (d) { correr('__dia = "' + d + '"'); };
  const pesquisa = function (q) { sb.location.search = q; };
  // Novo jogo: Reputação, bagaceira e (opcional) a visita de hoje já tocada.
  const jogo = function (rep, bagaceira, tocada) {
    correr('state = defaultState(); state.reputacao = ' + rep + '; state.adega.bagaceira = ' + bagaceira + '; __saves = 0; __barras = 0; SONS = 0; FALAS = []; visitaBagaceiraResultado = null;', 'jogo');
    pesquisa('');
  };
  // Põe uma visita (valentim_4 é sem condição) como a de hoje. tocada=false: escolhida mas por tocar.
  const visitaHoje = function (d, id, tocada) {
    correr('visitasEstado().hoje = { dia: "' + d + '", id: "' + id + '", feita: ' + (tocada ? 'true' : 'false') + ' }');
  };
  const html = function () { return N('visitaBagaceiraHtml()'); };
  const rep = function () { return N('state.reputacao'); };
  const bag = function () { return N('state.adega.bagaceira'); };

  const D1 = '2026-10-20', D2 = '2026-10-21';
  const PERS = { valentim_4: 'valentim', marisa_4: 'marisa', henrique_3: 'henrique' };

  // 1. Nível 3: não aparece, mesmo com a visita marcada e bagaceira.
  jogo(REP_NIVEL_3, 5); dia(D1); visitaHoje(D1, 'valentim_4', true);
  ok(N('nivelPelaReputacao(state.reputacao)') === 3, 'a Reputação de teste devia dar nível 3');
  ok(html() === '', 'nível 3 não devia mostrar o copo: ' + html());
  ok(N('visitaBagaceiraPode(state, "' + D1 + '").motivo') === 'nivel', 'nível 3: motivo "nivel"');
  let r = N('visitaBagaceiraOferecer(state, "' + D1 + '")');
  ok(r.ok === false && bag() === 5 && rep() === REP_NIVEL_3, 'nível 3: oferecer não devia gastar nem pagar');

  // 2. Nível 4 sem tocar na linha: não aparece.
  jogo(REP_NIVEL_4, 5); dia(D1); visitaHoje(D1, 'valentim_4', false);
  ok(html() === '', 'sem tocar na visita não devia mostrar o copo');
  ok(N('visitaBagaceiraPode(state, "' + D1 + '").motivo') === 'nao_tocada', 'sem tocar: motivo "nao_tocada"');
  r = N('visitaBagaceiraOferecer(state, "' + D1 + '")');
  ok(r.ok === false && bag() === 5 && rep() === REP_NIVEL_4, 'sem tocar: oferecer não devia gastar nem pagar');
  // Sem visita nenhuma hoje, ou visita de outro dia.
  jogo(REP_NIVEL_4, 5); dia(D1);
  ok(html() === '' && N('visitaBagaceiraPode(state, "' + D1 + '").motivo') === 'sem_visita', 'sem visita de hoje: nada');
  visitaHoje('2026-10-19', 'valentim_4', true);
  ok(N('visitaBagaceiraPode(state, "' + D1 + '").motivo') === 'sem_visita', 'visita de outro dia: não conta');

  // 3. Sem bagaceira: botão desativado + frase do Alambique, sem gastar nada.
  jogo(REP_NIVEL_4, 0); dia(D1); visitaHoje(D1, 'valentim_4', true);
  let h = html();
  ok(/oferta-botao" disabled/.test(h) && h.indexOf('onclick') === -1, 'sem bagaceira: botão desativado e sem onclick: ' + h);
  ok(h.indexOf('Alambique') !== -1 && h.indexOf('Destilar bagaço') !== -1, 'sem bagaceira: a frase diz onde se faz');
  const uvas0 = N('state.uvas'), gotas0 = N('state.gotas');
  N('visitaBagaceiraClique()');
  ok(bag() === 0 && rep() === REP_NIVEL_4 && N('__saves') === 0 && N('state.uvas') === uvas0 && N('state.gotas') === gotas0, 'sem bagaceira: clicar não gasta nem grava nada (nem Uvas nem Gotas)');
  ok(N('state.visitas.hoje.bagaceiraDia') === undefined, 'sem bagaceira: o dia não fica marcado');
  ['-3', 'NaN', '"x"', 'null', '0.5'].forEach(function (v) {
    correr('state.adega.bagaceira = ' + v);
    ok(N('visitaBagaceiraPode(state, "' + D1 + '").motivo') === 'sem_bagaceira', 'bagaceira estranha (' + v + ') conta como 0');
  });

  // 4. Com bagaceira: gasta 1, +1 Reputação, marca o dia, grava UMA vez, mostra a fala.
  for (const id of Object.keys(PERS)) {
    jogo(REP_NIVEL_4, 3); dia(D1); visitaHoje(D1, id, true);
    h = html();
    ok(/onclick="visitaBagaceiraClique\(\)"/.test(h) && h.indexOf('disabled') === -1, id + ': botão ativo');
    const antes = JSON.stringify(N('state.visitas.feitas'));
    N('visitaBagaceiraClique()');
    ok(bag() === 2, id + ': devia gastar exatamente 1 bagaceira, ficou ' + bag());
    ok(rep() === REP_NIVEL_4 + 1, id + ': devia dar +1 de Reputação, ficou ' + rep());
    ok(N('state.visitas.hoje.bagaceiraDia') === D1 && N('state.visitas.hoje.feita') === true && N('state.visitas.hoje.id') === id, id + ': devia marcar o dia sem estragar a visita');
    ok(JSON.stringify(N('state.visitas.feitas')) === antes, id + ': não devia mexer em visitas.feitas');
    ok(N('__saves') === 1, id + ': devia gravar UMA vez, gravou ' + N('__saves'));
    ok(N('__barras') >= 1 && N('SONS') === 1, id + ': devia atualizar a barra e tocar o som');
    ok(N('Object.keys(state.visitas).sort().join()') === 'feitas,hoje', id + ': sem campo novo em state.visitas');
    // Agradecimento da personagem certa, nas 3 línguas.
    ['pt', 'en', 'es'].forEach(function (l) {
      correr('currentLang = "' + l + '"');
      const fala = N('VISITAS_BAGACEIRA_FALAS["' + PERS[id] + '"]["' + l + '"]');
      ok(typeof fala === 'string' && fala.length > 15 && fala.indexOf('[por escrever]') === -1, id + '/' + l + ': falta a fala');
      const res = html();
      ok(res.indexOf(fala) !== -1 && res.indexOf('+1') !== -1 && res.indexOf('onclick') === -1, id + '/' + l + ': o resultado devia mostrar a fala e +1, sem botão');
      const sem = N('t("bagaceira.sem")'), btn = N('t("bagaceira.btn")'), ja = N('t("bagaceira.jaHoje")'), of = N('t("bagaceira.ofereceste")');
      ok([[sem, 'bagaceira.sem'], [btn, 'bagaceira.btn'], [ja, 'bagaceira.jaHoje'], [of, 'bagaceira.ofereceste']].every(function (x) { return x[0] !== x[1] && x[0].length > 5; }), l + ': faltam chaves de texto');
    });
    correr('currentLang = "pt"');
  }
  // As três falas são diferentes entre si e não há fala para o Chizo.
  ['pt', 'en', 'es'].forEach(function (l) {
    const f = ['valentim', 'marisa', 'henrique'].map(function (p) { return N('VISITAS_BAGACEIRA_FALAS["' + p + '"]["' + l + '"]'); });
    ok(new Set(f).size === 3, l + ': as três falas deviam ser diferentes');
  });
  ok(N('Object.keys(VISITAS_BAGACEIRA_FALAS).sort().join()') === 'henrique,marisa,valentim', 'só as três visitas têm fala (o Chizo nunca recebe)');
  // Texto sem afirmações proibidas (aquece, digestão, depois da refeição).
  ['pt', 'en', 'es'].forEach(function (l) {
    ['valentim', 'marisa', 'henrique'].forEach(function (p) {
      const f = N('VISITAS_BAGACEIRA_FALAS["' + p + '"]["' + l + '"]').toLowerCase();
      ok(!/aquece|digest|refei|warm|digest|meal|calienta|comida/.test(f), p + '/' + l + ': a fala não devia afirmar costumes nem efeitos');
    });
  });

  // 5. Segundo copo no mesmo dia: recusado (mesmo com bagaceira e outra visita igual), clique duplo incluído.
  jogo(REP_NIVEL_4, 5); dia(D1); visitaHoje(D1, 'marisa_4', true);
  N('visitaBagaceiraClique()'); N('visitaBagaceiraClique()'); N('visitaBagaceiraClique()');
  ok(bag() === 4 && rep() === REP_NIVEL_4 + 1 && N('__saves') === 1, 'três cliques no mesmo dia: só 1 copo (bagaceira ' + bag() + ', rep ' + rep() + ')');
  r = N('visitaBagaceiraOferecer(state, "' + D1 + '")');
  ok(r.ok === false && r.motivo === 'ja_hoje' && bag() === 4 && rep() === REP_NIVEL_4 + 1, 'segundo copo recusado com "ja_hoje" sem alterar nada');
  // Depois de recarregar (resultado em memória perdido): aparece a linha "já ofereceste", sem botão.
  correr('visitaBagaceiraResultado = null');
  h = html();
  ok(h.indexOf('oferta-linha') !== -1 && h.indexOf('<button') === -1 && h.indexOf(N('t("bagaceira.jaHoje")')) !== -1, 'depois de oferecer: só a linha "já ofereceste hoje": ' + h);
  // Tocar outra vez na linha da visita (visitaFazerHoje) não apaga a marca.
  N('visitaFazerHoje()');
  ok(N('state.visitas.hoje.bagaceiraDia') === D1, 'tocar de novo na visita não devia apagar a marca do copo');
  // O limite é por dia, não por visita: a marca vale mesmo trocando a visita guardada do dia.
  correr('state.visitas.hoje.id = "henrique_3"');
  ok(N('visitaBagaceiraPode(state, "' + D1 + '").motivo') === 'ja_hoje', 'o limite é de 1 copo por dia no total, não por visita');

  // 6. Dia seguinte: volta a funcionar (a visita nova substitui "hoje" e a marca desaparece).
  dia(D2);
  correr('visitasEstado().hoje = { dia: "' + D2 + '", id: "henrique_3", feita: true }');
  ok(N('visitaBagaceiraPode(state, "' + D2 + '").ok') === true, 'no dia seguinte devia poder voltar a oferecer');
  N('visitaBagaceiraClique()');
  ok(bag() === 3 && rep() === REP_NIVEL_4 + 2 && N('state.visitas.hoje.bagaceiraDia') === D2, 'dia seguinte: 2.º copo (bagaceira 3, +1 de Reputação)');
  // Relógio atrás: o dia efetivo não recua e não deixa oferecer outra vez.
  dia(D1);
  N('visitaBagaceiraClique()');
  ok(bag() === 3 && rep() === REP_NIVEL_4 + 2, 'com o relógio atrás não devia oferecer outra vez');
  // A visita de hoje que só se escolhe de dia novo (visitaDeHoje) repõe a marca por omissão.
  jogo(REP_NIVEL_4, 5); dia(D1); visitaHoje(D1, 'valentim_4', true); correr('state.visitas.hoje.bagaceiraDia = "' + D1 + '"');
  correr('state.visitas.hoje = { dia: "2026-10-22", id: "valentim_4", feita: false }');
  ok(N('visitaBagaceiraPode(state, "2026-10-22").motivo') === 'nao_tocada', 'dia novo: visita nova por tocar, sem marca antiga');

  // 7. Modo de teste: não mostra nem grava.
  jogo(REP_NIVEL_4, 5); dia(D1); visitaHoje(D1, 'valentim_4', true);
  pesquisa('?estacao=inverno');
  ok(html() === '', 'modo de teste não devia mostrar o copo');
  N('visitaBagaceiraClique()');
  ok(bag() === 5 && rep() === REP_NIVEL_4 && N('__saves') === 0, 'modo de teste: clicar não gasta nem grava');
  pesquisa('');

  // 8. Convive com o "Oferecer" da Despensa (nível 7): cada um com o seu limite; a Despensa não é usada.
  jogo(REP_NIVEL_7, 5); dia(D1); visitaHoje(D1, 'valentim_4', true);
  N('visitaBagaceiraClique()');
  ok(N('state.despensa.ofertaDia') === undefined && JSON.stringify(N('state.despensa.entregues')) === '{}', 'o copo não toca na Despensa');
  ok(rep() === REP_NIVEL_7 + 1, 'nível 7: copo dá +1');
  const fonteVis = visitasSrc.slice(visitasSrc.indexOf('const VISITAS_BAGACEIRA_REPUTACAO'), visitasSrc.indexOf('// LINHA NO CARTÃO DA QUINTA'));
  ok(!/despensa|estrada/i.test(fonteVis.replace(/\/\/[^\n]*/g, '')), 'o código do copo não devia usar a Despensa nem a Estrada');
  // A linha da Quinta junta o copo ao resto.
  jogo(REP_NIVEL_4, 2); dia(D1); visitaHoje(D1, 'valentim_4', true);
  N('atualizarLinhaVisitaQuinta()');
  ok(elementos['visita-container'] && elementos['visita-container'].innerHTML.indexOf('visitaBagaceiraClique') !== -1, 'a linha da Quinta devia incluir o botão do copo');

  // 9. Estado estranho não rebenta.
  jogo(REP_NIVEL_4, 2);
  ['null', '{}', '[]', '"x"', '{ hoje: 5 }'].forEach(function (v) {
    correr('state.visitas = ' + v);
    let erro = null; try { N('visitaBagaceiraPode(state, "' + D1 + '")'); N('visitaBagaceiraOferecer(state, "' + D1 + '")'); } catch (e) { erro = e; }
    ok(erro === null, 'state.visitas = ' + v + ' não devia rebentar');
  });
  ok(N('visitaBagaceiraPode(null, "' + D1 + '").ok') === false && N('visitaBagaceiraPode({}, 5).ok') === false, 'estado/dia inválidos recusam');

  return falhas;
}

let falhou = 0;
const base = correrTestes(VISITAS_SRC);
base.forEach(function (m) { console.log('FALHA: ' + m); falhou++; });

// Mutantes: cada estrago tem de fazer falhar pelo menos uma verificação.
const MUTANTES = [
  ['nível mínimo ignorado', "if (!(nivel >= VISITAS_NIVEL_MINIMO)) return recusa('nivel');", "if (false) return recusa('nivel');"],
  ['não exige ter tocado na visita', "if (h.feita !== true) return recusa('nao_tocada');", ''],
  ['limite diário ignorado', "if (h.bagaceiraDia === dia) return", "if (false) return"],
  ['não exige bagaceira', "alambiqueNumero(a.bagaceira) < 1", "false"],
  ['não gasta a bagaceira', 'alambiqueEstado(estado).bagaceira -= 1;', ''],
  ['gasta 2 bagaceiras', 'alambiqueEstado(estado).bagaceira -= 1;', 'alambiqueEstado(estado).bagaceira -= 2;'],
  ['não dá Reputação', ': 0) + VISITAS_BAGACEIRA_REPUTACAO;', ': 0) + 0;'],
  ['dá 2 de Reputação', 'const VISITAS_BAGACEIRA_REPUTACAO = 1;', 'const VISITAS_BAGACEIRA_REPUTACAO = 2;'],
  ['não marca o dia', 'estado.visitas.hoje.bagaceiraDia = dia;', ''],
  ['marca o dia errado', 'estado.visitas.hoje.bagaceiraDia = dia;', 'estado.visitas.hoje.bagaceiraDia = "2000-01-01";'],
  ['visita de outro dia aceite', "h.dia !== dia) return recusa('sem_visita');", "false) return recusa('sem_visita');"],
  ['grava duas vezes', 'saveState(state);\n      visitaBagaceiraResultado', 'saveState(state); saveState(state);\n      visitaBagaceiraResultado'],
  ['modo de teste grava', 'if (!visitaEmModoTeste()) {\n    const dia = visitaDiaEfetivo();', 'if (true) {\n    const dia = visitaDiaEfetivo();'],
  ['modo de teste mostra', "function visitaBagaceiraHtml() {\n  if (visitaEmModoTeste()) return '';", 'function visitaBagaceiraHtml() {\n  if (false) return \'\';'],
  ['sem bagaceira o botão fica ativo', 'class="btn-pill pill-main oferta-botao" disabled>', 'class="btn-pill pill-main oferta-botao" onclick="visitaBagaceiraClique()">'],
  ['sem a frase do Alambique', "'<p class=\"oferta-linha\">' + t('bagaceira.sem') + '</p></div>'", "'</div>'"],
  ['sem a linha de já ofereceu', "if (p.motivo === 'ja_hoje') return", "if (false) return"],
  ['sem fala no resultado', "(fala ? '<p class=\"oferta-fala\">«' + cadernoEscapar(fala[currentLang] || fala.pt) + '»</p>' : '')", "''"],
  ['não liga à linha da Quinta', "(function () { try { return visitaBagaceiraHtml(); } catch (e) { return ''; } })();", "'';"],
  ['fala do Chizo', "  henrique: {", "  chizo: { pt: 'a', en: 'a', es: 'a' },\n  henrique: {"],
  ['fala em falta (ES Marisa)', "es: '¿Para mí? ¡Qué amable! Un brindis por el viñedo y luego, a trabajar.'", "es: ''"],
  ['fala diz que aquece', 'Aprovo os três.', 'Aquece e ajuda a digestão.'],
  ['usa a Despensa', "estado.visitas.hoje.bagaceiraDia = dia;", "estado.visitas.hoje.bagaceiraDia = dia; despensaOferecer(estado, dia);"],
  ['o limite passa a ser por visita', "if (h.bagaceiraDia === dia) return", "if (h.bagaceiraDia === dia + h.id) return"]
];
MUTANTES.forEach(function (m) {
  const nome = m[0];
  if (VISITAS_SRC.split(m[1]).length < 2) { console.log('FALHA: mutante "' + nome + '": a âncora já não existe em js/visitas.js'); falhou++; return; }
  const mutado = VISITAS_SRC.replace(m[1], function () { return m[2]; });
  let fs_ = [];
  try { fs_ = correrTestes(mutado); } catch (e) { fs_ = ['rebentou: ' + e.message]; }
  if (fs_.length === 0) { console.log('FALHA: o mutante "' + nome + '" passou nos testes'); falhou++; }
});

console.log(falhou === 0 ? 'OK (' + MUTANTES.length + ' mutações apanhadas)' : falhou + ' FALHA(S)');
process.exit(falhou === 0 ? 0 : 1);
