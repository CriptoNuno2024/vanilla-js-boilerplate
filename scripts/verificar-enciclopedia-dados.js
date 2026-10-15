#!/usr/bin/env node
// Histórias novas da Enciclopédia por dados: dadosAcrescentar('enciclopedia', { ... }) (js/dados.js) com NÍVEL MÍNIMO.
// As entradas de teste vivem só no ambiente simulado (módulo vm, scripts/_jogo-vm.js); nada fica no jogo.
//
// Prova:
//  (a) uma entrada com nivelMinimo 11 não aparece nem se desbloqueia a um jogador de nível 4 (sorteio do Explorar,
//      desbloqueio por ação, Enciclopédia, totais) e aparece e desbloqueia ao nível 11; um jogador antigo não a vê antes;
//  (b) a mensagem de «todo o conhecimento desbloqueado» e os totais (Guardião, Sábio) só contam as entradas disponíveis;
//  (c) entradas mal escritas são ignoradas, sem erro e sem mudar nada; nunca se substitui uma que existe; só se copiam
//      os campos conhecidos; entra nas 3 línguas;
//  (d) título e texto com <b>, &, aspas e <script> saem escapados (uma só vez) na Enciclopédia e no Explorar;
//  (e) o estado guardado só tem ids e carrega bem se a entrada deixar de existir (o id solto não conta);
//  (f) as entradas de hoje ficam idênticas às da master (impressão digital) e dados/ não traz nenhuma de enciclopédia.
//
// Uso: node scripts/verificar-enciclopedia-dados.js
// JS_DIR=pasta  corre sobre outra versão dos js/ (para provar que o teste apanha o que se estraga).
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');
const { abrirJogo } = require('./_jogo-vm');

const RAIZ = path.join(__dirname, '..');
const JS_DIR = process.env.JS_DIR || path.join(RAIZ, 'js');
const LINGUAS = ['pt', 'en', 'es'];
// sha256 do JSON de ENCYCLOPEDIA_ENTRIES da master antes desta funcionalidade (32 histórias nas 3 línguas).
const IMPRESSAO_DIGITAL_DE_HOJE = 'e71b7142d637f685998eadac5f5de2c4ee8090313173d6fe0631aecb5e96a4ea';
const REP_NIVEL_4 = 120;
const REP_NIVEL_11 = 3600;

let falhas = 0;
function ok(cond, msg) { if (!cond) { falhas++; console.log('FALHA: ' + msg); } }
function js(o) { return JSON.stringify(o); }
// O Explorar (js/explorar.js: explorarEscapar) escapa & < > e aspas duplas; a plica fica (é segura no texto de um elemento).
function escExplorar(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
function T3(base) { const t = {}; LINGUAS.forEach(function (l) { t[l] = base + ' [' + l + ']'; }); return t; }

// Abre o jogo REAL com a Enciclopédia e um nível 11 de teste (só no vm). dadosDir: null = sem a pasta dados/.
function abrir(opcoes) {
  const o = opcoes || {};
  const avisos = [];
  const g = abrirJogo({ jsDir: JS_DIR, dadosDir: o.dadosDir === undefined ? null : o.dadosDir, explorar: true, ecraReal: true, estadoGuardado: o.estadoGuardado, aoAvisar: function (m) { avisos.push(m); } });
  g.avisos = avisos;
  // Ganchos que vivem no main.js (não carregado aqui) e a época de teste.
  g.ev(`
    function mostrarNovaEntrada() {} function atualizarDialogo() {}
    function faseRealAtual() { return 'repouso'; }
    function randInt(a, b) { return a; }
  `);
  // O conquistas.js (Sábio, total da Enciclopédia) não está no ambiente base.
  vm.runInContext(fs.readFileSync(path.join(JS_DIR, 'conquistas.js'), 'utf8'), g.cx, { filename: 'js/conquistas.js' });
  if (o.nivel11 !== false) ok(g.ev('dadosAcrescentar("niveis", ' + js({ id: 'nivel_t11', min: REP_NIVEL_11, nome: T3('Nível teste') }) + ')') === true, 'o nível 11 de teste devia entrar');
  return g;
}
function jogador(g, rep, antigo) {
  g.ev('state.acesso.jogadorAntigo = ' + (antigo ? 'true' : 'false') + '; state.reputacao = ' + rep + '; state.encyclopedia.unlocked = []; state.conhecimento = 0;');
}
function lingua(g, l) { g.ev("currentLang = '" + l + "';"); }
function entradaTeste(extra) {
  return Object.assign({ id: 'cultura_t11', titulo: T3('Cultura de teste'), texto: T3('Texto de teste'), nivelMinimo: 11 }, extra || {});
}
// Desbloqueia no estado todas as entradas disponíveis para o nível atual, menos a(s) pedida(s).
function abrirTodasMenos(g, excecoes) {
  g.ev('state.encyclopedia.unlocked = encyclopediaEntries().map(function (e) { return e.id; }).filter(function (i) { return ' + js(excecoes) + '.indexOf(i) === -1; });');
}
function estadoDasListas(g) { return g.ev('JSON.stringify(ENCYCLOPEDIA_ENTRIES)'); }

// =====================================================================
// (f) O conteúdo de hoje ficou igual; dados/ não traz entradas de enciclopédia
// =====================================================================
{
  const g = abrir({ nivel11: false });
  const lista = estadoDasListas(g);
  ok(crypto.createHash('sha256').update(lista).digest('hex') === IMPRESSAO_DIGITAL_DE_HOJE, '(f) as entradas de hoje (ENCYCLOPEDIA_ENTRIES) devem ser idênticas às da master');
  ok(g.ev('ENCYCLOPEDIA_ENTRIES.pt.length') === 32 && g.ev('ENCYCLOPEDIA_ENTRIES.en.length') === 32 && g.ev('ENCYCLOPEDIA_ENTRIES.es.length') === 32, '(f) 32 histórias em cada língua');
  ok(g.ev('ENCYCLOPEDIA_ENTRIES.pt.some(function (e) { return e.nivelMinimo !== undefined; })') === false, '(f) nenhuma entrada de hoje tem nivelMinimo');
  ['pt', 'en', 'es'].forEach(function (l) {
    lingua(g, l);
    ok(g.ev('encyclopediaEntries() === ENCYCLOPEDIA_ENTRIES.' + l) === true, '(f) sem nivelMinimo, a lista do jogo é exatamente a de hoje (' + l + ')');
  });
  const real = abrir({ dadosDir: path.join(RAIZ, 'dados'), nivel11: false });
  ok(real.avisos.length === 0, '(f) carregar o jogo com dados/ não devia avisar nada: ' + real.avisos);
  ok(real.ev('DADOS_ACRESCENTADOS.enciclopedia.length') === 0, '(f) dados/ não devia trazer nenhuma entrada de enciclopédia');
  ok(estadoDasListas(real) === lista, '(f) com a pasta dados/ as listas da enciclopédia ficam iguais');
  const codigo = fs.readFileSync(path.join(RAIZ, 'dados', 'enciclopedia.js'), 'utf8').replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();
  ok(codigo === '', '(f) dados/enciclopedia.js devia ter só comentários, tem: ' + codigo.slice(0, 60));
}

// =====================================================================
// (a) Nível mínimo: sorteio, desbloqueio, Enciclopédia, totais
// =====================================================================
{
  const g = abrir();
  ok(g.ev('dadosAcrescentar("enciclopedia", ' + js(entradaTeste()) + ')') === true, '(a) a entrada de teste devia entrar');
  LINGUAS.forEach(function (l) {
    const e = g.ev('ENCYCLOPEDIA_ENTRIES.' + l + '[ENCYCLOPEDIA_ENTRIES.' + l + '.length - 1]');
    ok(e.id === 'cultura_t11' && e.titulo === 'Cultura de teste [' + l + ']' && e.texto === 'Texto de teste [' + l + ']' && e.nivelMinimo === 11, '(a) a entrada devia estar nas 3 línguas, cada uma com o seu texto (' + l + ')');
  });
  ok(g.ev('DADOS_ACRESCENTADOS.enciclopedia.length') === 1, '(a) DADOS_ACRESCENTADOS devia registar a entrada');

  // Nível 4.
  jogador(g, REP_NIVEL_4, false); lingua(g, 'pt');
  ok(g.ev('nivelPelaReputacao(state.reputacao)') === 4, '(a) o jogador devia estar no nível 4');
  ok(g.ev('encyclopediaEntries().length') === 32, '(a) nível 4: a lista do jogo devia ter só as 32 de hoje');
  ok(g.ev("entradasBloqueadas().some(function (e) { return e.id === 'cultura_t11'; })") === false, '(a) nível 4: não devia entrar no sorteio');
  ok(g.ev("desbloquearEntradaEnciclopedia('cultura_t11')") === null && g.ev('state.encyclopedia.unlocked.length') === 0 && g.ev('state.conhecimento') === 0, '(a) nível 4: não se devia desbloquear por uma ação (nem somar Conhecimento)');
  g.ev('renderEnciclopedia();');
  let h = g.el('enciclopedia-container').innerHTML;
  ok(h.indexOf('Cultura de teste') === -1 && (h.match(/encyclopedia-card/g) || []).length === 32 && h.indexOf('0 / 32') !== -1, '(a) nível 4: a Enciclopédia não devia mostrar a entrada (nem como cartão bloqueado): 32 cartões');
  for (let i = 0; i < 80; i++) g.ev('enterExplorar();');
  ok(g.ev("state.encyclopedia.unlocked.indexOf('cultura_t11')") === -1, '(a) nível 4: o Explorar nunca devia desbloqueá-la');
  // Um jogador antigo (tudo aberto por ecrã) NÃO ultrapassa o nível mínimo.
  jogador(g, 0, true);
  ok(g.ev("ecraDesbloqueado('enciclopedia')") === true && g.ev("entradasBloqueadas().some(function (e) { return e.id === 'cultura_t11'; })") === false && g.ev("desbloquearEntradaEnciclopedia('cultura_t11')") === null, '(a) jogador antigo: continua a não ver a entrada antes do nível 11');

  // Nível 11.
  jogador(g, REP_NIVEL_11, false);
  ok(g.ev('nivelPelaReputacao(state.reputacao)') === 11, '(a) o jogador devia estar no nível 11');
  ok(g.ev('encyclopediaEntries().length') === 33, '(a) nível 11: a lista do jogo devia ter 33');
  ok(g.ev("entradasBloqueadas().some(function (e) { return e.id === 'cultura_t11'; })") === true, '(a) nível 11: devia entrar no sorteio');
  g.ev('renderEnciclopedia();');
  h = g.el('enciclopedia-container').innerHTML;
  ok((h.match(/encyclopedia-card/g) || []).length === 33 && h.indexOf('0 / 33') !== -1, '(a) nível 11: a Enciclopédia devia ter 33 cartões (a nova bloqueada, como as outras)');
  abrirTodasMenos(g, ['cultura_t11']);
  g.ev('enterExplorar();');
  ok(g.ev("state.encyclopedia.unlocked.indexOf('cultura_t11') !== -1") && g.ev('state.conhecimento') === 1, '(a) nível 11: o Explorar devia desbloqueá-la');
  g.ev('renderEnciclopedia();');
  h = g.el('enciclopedia-container').innerHTML;
  ok(h.indexOf('Cultura de teste [pt]') !== -1 && h.indexOf('Texto de teste [pt]') !== -1 && h.indexOf('33 / 33') !== -1, '(a) nível 11: depois de desbloqueada, a Enciclopédia mostra-a (33 / 33)');
  jogador(g, REP_NIVEL_11, false);
  const nova = g.ev("desbloquearEntradaEnciclopedia('cultura_t11')");
  ok(nova && nova.id === 'cultura_t11' && nova.titulo === 'Cultura de teste [pt]', '(a) nível 11: a ação devia desbloqueá-la e devolver a entrada na língua atual');
  // Um jogador antigo no nível 11 também a tem.
  jogador(g, REP_NIVEL_11, true);
  ok(g.ev("entradasBloqueadas().some(function (e) { return e.id === 'cultura_t11'; })") === true, '(a) jogador antigo no nível 11: também a vê');
  // As entradas de hoje continuam com o seu comportamento: manual e estação nunca saem do sorteio.
  jogador(g, REP_NIVEL_11, false);
  ok(g.ev("entradasBloqueadas().every(function (e) { return !e.manual; })"), '(a) as entradas manuais continuam fora do sorteio');
  // A entrada nova também pode ser manual e/ou de estação (os campos de hoje).
  ok(g.ev('dadosAcrescentar("enciclopedia", ' + js(entradaTeste({ id: 'cultura_manual_t', manual: true, estacao: 'inverno', meses: [1, 2] })) + ')') === true, '(a) manual, estacao e meses opcionais devem entrar');
  ok(g.ev("entradasBloqueadas().some(function (e) { return e.id === 'cultura_manual_t'; })") === false, '(a) a entrada nova manual não entra no sorteio');
}

// =====================================================================
// (b) «Todo o conhecimento desbloqueado» e os totais só contam o que está disponível
// =====================================================================
{
  const g = abrir();
  g.ev('dadosAcrescentar("enciclopedia", ' + js(entradaTeste()) + ')');
  const MSG = g.ev("t('explorar.tudoDesbloqueado')");
  // Nível 4 com as 32 de hoje abertas: já sabe tudo o que existe PARA ELE.
  jogador(g, REP_NIVEL_4, false); lingua(g, 'pt');
  abrirTodasMenos(g, []);
  ok(g.ev('state.encyclopedia.unlocked.length') === 32, '(b) preparação: 32 abertas');
  g.ev('enterExplorar();');
  let h = g.el('explorar-container').innerHTML;
  ok(h.indexOf(esc(MSG)) !== -1 && h.indexOf('32 / 32') !== -1, '(b) nível 4: a mensagem de «todo o conhecimento» devia sair, com 32 / 32, sem contar a entrada do nível 11');
  ok(g.ev('tituloEspecialCumprido()') === true, '(b) nível 4: o Guardião conta só as disponíveis (32 de 32)');
  ok(g.ev('conquistasTotalEnciclopedia()') === 32 && g.ev('CONQUISTAS_CONFIG.filter(function (c) { return c.id === "sabio"; })[0].cumprida()') === true, '(b) nível 4: o Sábio conta só as disponíveis (32)');
  ok(g.ev("capitulosResolverAlvo('totalEnciclopedia')") === 32, '(b) nível 4: o alvo totalEnciclopedia conta 32');
  // Nível 11 com as mesmas 32: já falta uma.
  g.ev('state.reputacao = ' + REP_NIVEL_11 + ';');
  g.ev('enterExplorar();');
  ok(g.ev("state.encyclopedia.unlocked.indexOf('cultura_t11') !== -1"), '(b) nível 11: com 32 abertas, o Explorar devia dar a que falta');
  jogador(g, REP_NIVEL_11, false);
  abrirTodasMenos(g, ['cultura_t11']);
  ok(g.ev('tituloEspecialCumprido()') === false && g.ev('conquistasTotalEnciclopedia()') === 33 && g.ev('CONQUISTAS_CONFIG.filter(function (c) { return c.id === "sabio"; })[0].cumprida()') === false, '(b) nível 11: com 32 de 33 o Guardião e o Sábio ainda não valem');
  ok(g.ev("capitulosResolverAlvo('totalEnciclopedia')") === 33, '(b) nível 11: o alvo totalEnciclopedia conta 33');
  g.ev('state.encyclopedia.unlocked.push("cultura_t11");');
  ok(g.ev('tituloEspecialCumprido()') === true, '(b) nível 11: com as 33 o Guardião vale');
  // A medalha já ganha antes não se perde com entradas novas.
  jogador(g, REP_NIVEL_11, false);
  g.ev('state.conquistasGanhas = { guardiao: true };');
  ok(g.ev('tituloEspecialDesbloqueado()') === true, '(b) quem já tinha o Guardião continua a tê-lo');
}

// =====================================================================
// (c) Entradas mal escritas são ignoradas, sem erro, sem mudar nada
// =====================================================================
{
  const g = abrir();
  const antes = estadoDasListas(g);
  function ignorada(entrada, porque, tipo) {
    const a = estadoDasListas(g);
    const n = g.avisos.length;
    let r;
    try { r = g.ev('dadosAcrescentar(' + js(tipo || 'enciclopedia') + ', ' + js(entrada) + ')'); } catch (e) { ok(false, '(c) ' + porque + ': lançou erro (' + e.message + ')'); return; }
    ok(r === false, '(c) ' + porque + ': devia devolver false');
    ok(g.avisos.length === n + 1 && g.avisos[n].indexOf('[dados]') === 0, '(c) ' + porque + ': devia fazer um console.warn');
    ok(estadoDasListas(g) === a, '(c) ' + porque + ': não devia mudar nada');
  }
  const base = entradaTeste;
  ignorada(Object.assign(base(), { id: 'origem' }), 'id igual a uma entrada de hoje');
  ignorada(Object.assign(base(), { id: 'vindimasMaisCedo' }), 'id (com maiúsculas) igual a uma entrada de hoje');
  ignorada(Object.assign(base(), { id: 'Cultura-T' }), 'id mal formado (maiúscula e hífen)');
  ignorada(Object.assign(base(), { id: 'camelCase' }), 'id com maiúsculas');
  ignorada(Object.assign(base(), { id: 'com espaco' }), 'id com espaço');
  ignorada(Object.assign(base(), { id: '' }), 'id vazio');
  ignorada(Object.assign(base(), { id: undefined }), 'sem id');
  ignorada(Object.assign(base(), { titulo: { pt: 'a', en: 'b' } }), 'título sem es');
  ignorada(Object.assign(base(), { titulo: undefined }), 'sem título');
  ignorada(Object.assign(base(), { texto: { pt: 'a', en: ' ', es: 'c' } }), 'texto com uma língua vazia');
  ignorada(Object.assign(base(), { texto: 'só um texto' }), 'texto que não é { pt, en, es }');
  ignorada(Object.assign(base(), { nivelMinimo: undefined }), 'sem nivelMinimo');
  ignorada(Object.assign(base(), { nivelMinimo: 0 }), 'nivelMinimo 0');
  ignorada(Object.assign(base(), { nivelMinimo: -3 }), 'nivelMinimo negativo');
  ignorada(Object.assign(base(), { nivelMinimo: '11' }), 'nivelMinimo em texto');
  ignorada(Object.assign(base(), { nivelMinimo: 2.5 }), 'nivelMinimo que não é inteiro');
  ignorada(Object.assign(base(), { imagem: 'http://exemplo.pt/a.jpg' }), 'imagem de fora');
  ignorada(Object.assign(base(), { imagem: 'javascript:alert(1)' }), 'imagem javascript:');
  ignorada(Object.assign(base(), { imagem: 'assets/../js/state.js' }), 'imagem com ..');
  ignorada(Object.assign(base(), { imagem: 'assets/ecras/a.jpg" onerror="x' }), 'imagem com aspas');
  ignorada(Object.assign(base(), { imagem: 'imagens/a.jpg' }), 'imagem fora de assets/');
  ignorada(Object.assign(base(), { imagem: 7 }), 'imagem que não é texto');
  ignorada(Object.assign(base(), { meses: [13] }), 'mês 13');
  ignorada(Object.assign(base(), { meses: [] }), 'meses vazio');
  ignorada(Object.assign(base(), { meses: 'janeiro' }), 'meses que não é lista');
  ignorada(Object.assign(base(), { estacao: 'monção' }), 'estação que não existe');
  ignorada(Object.assign(base(), { manual: false }), 'manual que não é true');
  ignorada('uma entrada solta', 'entrada que não é objeto');
  ignorada(null, 'entrada null');
  ignorada([base()], 'entrada que é uma lista');
  // Id que existe só numa língua (a lista em en tem um id que as outras não têm): continua a ser recusado.
  g.ev("ENCYCLOPEDIA_ENTRIES.en.push({ id: 'so_em_en_t', titulo: 'x', texto: 'y' });");
  const comExtra = estadoDasListas(g);
  const n = g.avisos.length;
  ok(g.ev('dadosAcrescentar("enciclopedia", ' + js(base({ id: 'so_em_en_t' })) + ')') === false && g.avisos.length === n + 1 && estadoDasListas(g) === comExtra, '(c) um id que já existe em QUALQUER língua é recusado');
  g.ev("ENCYCLOPEDIA_ENTRIES.en.pop();");
  ok(estadoDasListas(g) === antes, '(c) preparação: listas de volta ao início');
  // Uma boa entra uma só vez; repetir não a substitui; só copia os campos que conhece.
  const boa = base({ id: 'boa_t', perigo: '<script>', extra: { a: 1 }, imagem: 'assets/ecras/enciclopedia_magusto.jpg', meses: [3, 4], estacao: 'primavera', manual: true });
  ok(g.ev('dadosAcrescentar("enciclopedia", ' + js(boa) + ')') === true, '(c) a entrada boa devia entrar');
  LINGUAS.forEach(function (l) {
    const e = g.ev('ENCYCLOPEDIA_ENTRIES.' + l + '[ENCYCLOPEDIA_ENTRIES.' + l + '.length - 1]');
    ok(Object.keys(e).sort().join() === 'estacao,id,imagem,manual,meses,nivelMinimo,texto,titulo', '(c) só devia copiar os campos que conhece (' + l + '): ' + Object.keys(e).join());
  });
  const apos = estadoDasListas(g);
  ignorada(Object.assign(base({ id: 'boa_t' }), { titulo: T3('Outro título') }), 'id repetido (já acrescentado)');
  ok(estadoDasListas(g) === apos, '(c) repetir o id não devia substituir a entrada');
  ignorada(base(), 'tipo desconhecido', 'enciclopedias');
  // Sem a lista no jogo (ordem dos scripts errada): ignorada, sem erro.
  const sem = abrirJogo({ jsDir: JS_DIR, dadosDir: null });
  const antesSem = sem.ev('typeof ENCYCLOPEDIA_ENTRIES');
  ok(antesSem === 'undefined', '(c) preparação: sem explorar.js não há ENCYCLOPEDIA_ENTRIES');
  let rs;
  try { rs = sem.ev('dadosAcrescentar("enciclopedia", ' + js(base()) + ')'); } catch (e) { ok(false, '(c) sem a lista lançou erro'); }
  ok(rs === false, '(c) sem a lista de entradas devia ser ignorada');
}

// =====================================================================
// (d) Escape: o ecrã nunca parte
// =====================================================================
{
  const PERIGO = { pt: 'Título <b>pt</b> & "aspas" d\'ouro <script>alert(1)</script>', en: 'Title <b>en</b> & "quotes" d\'or <script>alert(1)</script>', es: 'Título <b>es</b> & "comillas" d\'oro <script>alert(1)</script>' };
  const TEXTO = { pt: 'Texto <i>pt</i> & <img src=x onerror=alert(1)> "q" \'p\' <script>alert(2)</script>', en: 'Text <i>en</i> & <img src=x onerror=alert(1)> "q" \'p\' <script>alert(2)</script>', es: 'Texto <i>es</i> & <img src=x onerror=alert(1)> "q" \'p\' <script>alert(2)</script>' };
  const g = abrir();
  ok(g.ev('dadosAcrescentar("enciclopedia", ' + js({ id: 'perigo_t', titulo: PERIGO, texto: TEXTO, nivelMinimo: 11, imagem: 'assets/ecras/enciclopedia_magusto.jpg' }) + ')') === true, '(d) a entrada de teste devia entrar (o validador do jogo aceita < > &; é o verificar-dados.js que os recusa)');
  ok(fs.existsSync(path.join(RAIZ, 'assets/ecras/enciclopedia_magusto.jpg')), '(d) preparação: a imagem de teste existe');
  LINGUAS.forEach(function (l) {
    jogador(g, REP_NIVEL_11, false); lingua(g, l);
    abrirTodasMenos(g, []);
    g.ev('renderEnciclopedia();');
    const h = g.el('enciclopedia-container').innerHTML;
    ok(h.indexOf('<script') === -1 && h.indexOf('<b>') === -1 && h.indexOf('<i>') === -1 && h.indexOf('<img src=x') === -1, '(d) ' + l + ': sem <script>, <b>, <i> nem <img src=x> a sério');
    ok(h.indexOf('<h3>' + esc(PERIGO[l]) + '</h3>') !== -1 && h.indexOf('<p>' + esc(TEXTO[l]) + '</p>') !== -1, '(d) ' + l + ': o título e o texto saem escapados, uma só vez');
    ok(h.indexOf('&amp;amp;') === -1 && h.indexOf('&amp;lt;') === -1 && h.indexOf('&amp;quot;') === -1 && h.indexOf('&amp;#39;') === -1, '(d) ' + l + ': nada escapado duas vezes');
    ok(h.indexOf('<img src="assets/ecras/enciclopedia_magusto.jpg" alt="">') !== -1, '(d) ' + l + ': a imagem sai como sempre');
    // Defesa a mais: mesmo que uma imagem com aspas chegasse à lista (o dadosAcrescentar recusa-a), a Enciclopédia escapa-a.
    g.ev(`ENCYCLOPEDIA_ENTRIES.${l}.push({ id: 'imagem_t', titulo: 'T', texto: 'X', imagem: 'assets/a.jpg" onerror="alert(1)', nivelMinimo: 1 }); state.encyclopedia.unlocked.push('imagem_t'); renderEnciclopedia();`);
    const hi = g.el('enciclopedia-container').innerHTML;
    ok(hi.indexOf('onerror="alert(1)') === -1 && hi.indexOf('src="assets/a.jpg&quot; onerror=&quot;alert(1)"') !== -1, '(d) ' + l + ': a imagem com aspas sai escapada e não abre um atributo novo');
    g.ev(`ENCYCLOPEDIA_ENTRIES.${l}.pop(); state.encyclopedia.unlocked.pop();`);
    // O Explorar: a entrada nova no cartão da Enciclopédia.
    jogador(g, REP_NIVEL_11, false);
    abrirTodasMenos(g, ['perigo_t']);
    g.ev('enterExplorar();');
    const x = g.el('explorar-container').innerHTML;
    ok(x.indexOf('<script') === -1 && x.indexOf('<b>') === -1 && x.indexOf(escExplorar(PERIGO[l])) !== -1 && x.indexOf('&amp;amp;') === -1, '(d) ' + l + ': o cartão da Enciclopédia no Explorar escapa o título, uma só vez');
  });
}

// =====================================================================
// (e) O estado guardado só tem ids, e carrega se a entrada deixar de existir
// =====================================================================
{
  const g = abrir();
  g.ev('dadosAcrescentar("enciclopedia", ' + js(entradaTeste({ titulo: T3('Titulo secreto'), texto: T3('Texto secreto') })) + ')');
  jogador(g, REP_NIVEL_11, false); lingua(g, 'pt');
  abrirTodasMenos(g, ['cultura_t11']);
  g.ev('enterExplorar();'); // desbloqueia e grava
  const salvo = g.guardado.yoshicat_quinta_state_v2;
  ok(typeof salvo === 'string' && salvo.length > 100, '(e) devia ter gravado o estado');
  const estado = JSON.parse(salvo);
  ok(estado.encyclopedia.unlocked.indexOf('cultura_t11') !== -1, '(e) o estado guarda o id da entrada');
  ok(salvo.indexOf('Titulo secreto') === -1 && salvo.indexOf('Texto secreto') === -1, '(e) o estado não guarda nenhum texto da entrada (só ids)');
  ok(salvo.indexOf('nivelMinimo') === -1, '(e) o estado não guarda o nivelMinimo');

  // Jogo B: a entrada deixou de existir (nem o nível 11 do teste: o jogo de origem). O jogador tinha o id dela e
  // 31 das 32 de hoje (falta a «origem»): a contar só os ids que existem são 31; a contar todos os ids seriam 32.
  estado.encyclopedia.unlocked = estado.encyclopedia.unlocked.filter(function (i) { return i !== 'origem'; });
  ok(estado.encyclopedia.unlocked.length === 32 && estado.encyclopedia.unlocked.indexOf('cultura_t11') !== -1, '(e) preparação: 31 de hoje + o id solto');
  const b = abrir({ estadoGuardado: JSON.stringify(estado), nivel11: false }); lingua(b, 'pt');
  ok(b.ev("state.encyclopedia.unlocked.indexOf('cultura_t11') !== -1"), '(e) o id solto continua guardado (nunca se apaga)');
  let erro = null;
  try { b.ev('renderEnciclopedia();'); } catch (e) { erro = e.message; }
  ok(erro === null, '(e) o jogo devia carregar e desenhar a Enciclopédia sem erro: ' + erro);
  const hb = b.el('enciclopedia-container').innerHTML;
  ok(!/NaN|undefined|null/.test(hb), '(e) sem NaN, undefined nem null no ecrã: ' + hb.slice(0, 200));
  ok(b.ev('encyclopediaContarDesbloqueadas()') === 31, '(e) o id solto não conta nos totais (31 das de hoje)');
  ok(b.el('enciclopedia-container').innerHTML.indexOf('31 / 32') !== -1, '(e) a Enciclopédia mostra 31 / 32, sem inflar');
  ok(b.ev('tituloEspecialCumprido()') === false, '(e) com o id solto, o Guardião não vale por engano (falta uma de hoje)');
  // O Explorar do jogo B desenha sem erro e ainda dá a que falta.
  try { b.ev('enterExplorar();'); } catch (e) { ok(false, '(e) o Explorar devia desenhar sem erro: ' + e.message); }
  ok(!/NaN|undefined|null/.test(b.el('explorar-container').innerHTML), '(e) o Explorar sem NaN, undefined nem null');
  ok(b.ev('encyclopediaContarDesbloqueadas()') === 32 && b.ev("state.encyclopedia.unlocked.indexOf('origem')") !== -1, '(e) o Explorar devia continuar a dar as que faltam');

  // Jogo C: a entrada volta. Nada se repete.
  const c = abrir({ estadoGuardado: JSON.stringify(estado) }); lingua(c, 'pt');
  c.ev('dadosAcrescentar("enciclopedia", ' + js(entradaTeste({ titulo: T3('Titulo secreto'), texto: T3('Texto secreto') })) + ')');
  c.ev('renderEnciclopedia();');
  ok(c.el('enciclopedia-container').innerHTML.indexOf('Titulo secreto [pt]') !== -1, '(e) com a entrada de volta, aparece desbloqueada');
  ok(c.ev("desbloquearEntradaEnciclopedia('cultura_t11')") === null, '(e) já desbloqueada: não se desbloqueia outra vez');
}

if (falhas) { console.log(falhas + ' falha(s)'); process.exit(1); }
console.log('OK');
