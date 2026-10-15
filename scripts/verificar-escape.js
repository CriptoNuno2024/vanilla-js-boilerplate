#!/usr/bin/env node
// Os textos de conteúdo (nome de nível, título e objetivo de capítulo, texto de objetivo) que vão para
// HTML montado por concatenação (innerHTML) passam por escaparHtml() (js/i18n.js), para que um texto
// vindo de dados/ com <b>, &, aspas ou <script> nunca parta o cartão. O que vai para textContent
// (balões de fala: histórias, visitas, subida de nível, celebração de capítulo) já é seguro e NÃO se
// escapa. Corre o jogo real em vm (scripts/_jogo-vm.js); os textos de teste só vivem aí, não ficam no jogo.
//
// Uso: node scripts/verificar-escape.js
// JS_DIR=pasta  corre sobre outra versão dos js/ (para provar que os testes apanham a falta do escape).
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const { abrirJogo } = require('./_jogo-vm');

const RAIZ = path.join(__dirname, '..');
const JS_DIR = process.env.JS_DIR || path.join(RAIZ, 'js');
let falhas = 0;
function ok(cond, msg) { if (!cond) { falhas++; console.log('FALHA: ' + msg); } }

// Um texto de teste com tudo o que pode partir um cartão.
const MAU = '<b>negrito</b> & "aspas" \'simples\' <script>alert(1)</script> <img src=x onerror=alert(2)>';
const MAU_ESCAPADO = '&lt;b&gt;negrito&lt;/b&gt; &amp; &quot;aspas&quot; &#39;simples&#39; &lt;script&gt;alert(1)&lt;/script&gt; &lt;img src=x onerror=alert(2)&gt;';
const TEXTO_MAU = { pt: MAU, en: MAU, es: MAU };

// Sem a pasta dados/: o teste acrescenta o seu nível 11 de teste (3600); o nível 11 real vem de dados/ (3650) e tem o seu teste.
const jogo = abrirJogo({ jsDir: JS_DIR, dadosDir: null });
const ev = jogo.ev;
function js(o) { return JSON.stringify(o); }
// O HTML não pode ter tags a sério vindas do texto de teste.
function semTagsDeTeste(html, onde) {
  ok(html.indexOf('<b>') === -1 && html.indexOf('</b>') === -1, onde + ': o HTML tem um <b> a sério: ' + html);
  ok(html.indexOf('<script') === -1 && html.indexOf('</script') === -1, onde + ': o HTML tem um <script> a sério');
  ok(html.indexOf('<img') === -1 && html.indexOf('onerror=alert(2)>') === -1, onde + ': o HTML tem um <img> a sério');
  ok(html.indexOf(MAU_ESCAPADO) !== -1, onde + ': o texto devia aparecer escapado, uma só vez: ' + html);
  ok(html.indexOf('&amp;amp;') === -1 && html.indexOf('&amp;lt;') === -1, onde + ': o texto foi escapado duas vezes');
}

// ----- 0. escaparHtml() -----
{
  ok(ev('escaparHtml(' + js(MAU) + ')') === MAU_ESCAPADO, 'escaparHtml devia trocar & < > " \' pelas entidades');
  ok(ev('escaparHtml("Rega a Vinha.")') === 'Rega a Vinha.', 'escaparHtml não devia mexer num texto normal');
  ok(ev('escaparHtml("Dig the Vineyard\'s soil.")') === 'Dig the Vineyard&#39;s soil.', 'a plica passa a entidade (aparece igual no ecrã)');
  ok(ev('escaparHtml(5)') === '5' && ev('escaparHtml("")') === '', 'escaparHtml devia aceitar números e texto vazio');
}

// ----- 1. Objetivo: cartão "Hoje na Quinta" (innerHTML) -----
{
  ok(ev('OBJETIVOS_GRUPO_C.push({ id: "teste_html", texto: ' + js(TEXTO_MAU) + ' })') > 0, 'objetivo de teste');
  ev("state.objetivos.dia = diaLisboaDeHoje(); state.objetivos.lista = [{ id: 'teste_html', cumprido: false }, { id: 'vinha_regar', cumprido: true }];");
  ['pt', 'en', 'es'].forEach(function (l) {
    ev("currentLang = '" + l + "'; atualizarCartaoObjetivosQuinta();");
    const html = jogo.el('objetivos-container').innerHTML;
    semTagsDeTeste(html, 'cartão do objetivo (' + l + ')');
    ok(html.indexOf(ev("escaparHtml(TRANSLATIONS['" + l + "']['objetivo.vinha_regar'])")) !== -1, 'o objetivo normal (' + l + ') devia aparecer no cartão');
  });
}

// ----- 2. Capítulo: cartão do capítulo (innerHTML), via dadosAcrescentar -----
{
  const cap = { id: 'cap_html', nivel: 1, criterio: [{ tipo: 'numero', caminho: 'garrafas', alvo: 99 }], titulo: TEXTO_MAU, objetivo: TEXTO_MAU, conclusao: TEXTO_MAU };
  ok(ev('dadosAcrescentar("capitulos", ' + js(cap) + ')') === true, 'o capítulo de teste devia entrar');
  // Os capítulos de origem ficam concluídos, para o de teste ser o do cartão.
  ev('state.reputacao = 0; CAPITULOS_CONFIG.forEach(function (c) { if (c.id !== "cap_html") state.capitulos.concluidos[c.id] = true; });');
  ['pt', 'en', 'es'].forEach(function (l) {
    ev("currentLang = '" + l + "'; atualizarCapituloQuinta();");
    const html = jogo.el('capitulo-container').innerHTML;
    ok(html.indexOf('<p class="mini-bloco-titulo">') !== -1 && html.indexOf('objetivo-linha') !== -1, 'o cartão do capítulo (' + l + ') devia mostrar título e objetivo');
    semTagsDeTeste(html, 'cartão do capítulo (' + l + ')');
    // o título e o objetivo aparecem os dois escapados
    ok(html.split(MAU_ESCAPADO).length - 1 === 2, 'o cartão do capítulo (' + l + ') devia ter o título e o objetivo escapados');
  });
  // A conclusão vai para o balão (textContent): chega CRUA, sem escape.
  ok(ev("(function () { currentLang = 'pt'; return capituloConclusao('cap_html'); })()") === MAU, 'a conclusão do capítulo (balão, textContent) não devia ser escapada');
}

// ----- 3. Nível: cartão do nível (innerHTML) e mensagens (textContent) -----
{
  ok(ev('dadosAcrescentar("niveis", { id: "nivel_html", min: 3600, nome: ' + js(TEXTO_MAU) + ' })') === true, 'o nível de teste devia entrar');
  // Próximo nível (no nível 10, o seguinte é o de teste) e nível atual (reputação 3600).
  ev("currentLang = 'pt'; state.reputacao = 2900; atualizarCartaoNivelQuinta();");
  semTagsDeTeste(jogo.el('nivel-container').innerHTML, 'cartão do nível (próximo nível)');
  ev("state.reputacao = 3600; atualizarCartaoNivelQuinta();");
  semTagsDeTeste(jogo.el('nivel-container').innerHTML, 'cartão do nível (nível atual)');
  // Subida de nível e ecrã trancado vão para mostrarFalas (textContent): o nome chega CRU.
  ev("var FALAS_VISTAS = []; mostrarFalas = function (f) { FALAS_VISTAS.push(f); };");
  ev("mostrarMensagemTrancada('roxo'); ");
  ev("NIVEL_NECESSARIO_POR_ECRA.ecra_teste = 11; mostrarMensagemTrancada('ecra_teste');");
  ok(ev('FALAS_VISTAS[FALAS_VISTAS.length - 1]').indexOf(MAU) !== -1, 'a mensagem de ecrã trancado (balão) devia ter o nome cru, sem escape');
}

// ----- 4. História e visita: vão para o balão (textContent): chegam CRUAS -----
{
  const historia = { id: 'historia_html', nivel: 12, falas: [{ texto: TEXTO_MAU }] };
  ok(ev('dadosAcrescentar("historias", ' + js(historia) + ')') === true, 'a história de teste devia entrar');
  ok(ev('traduzirFalasHistoria(HISTORIA_NIVEIS[12])[0].texto') === MAU, 'a fala da história (balão) devia chegar crua, sem escape');
  const visita = { id: 'valentim_html', personagem: 'valentim', reputacao: 1, condicao: null, texto: TEXTO_MAU };
  ok(ev('dadosAcrescentar("visitas", ' + js(visita) + ')') === true, 'a visita de teste devia entrar');
  ok(ev("(function () { currentLang = 'pt'; return visitaFalaDe(visitaPorId('valentim_html')).texto; })()") === MAU, 'o texto da visita (balão) devia chegar cru, sem escape');
  // A linha da visita no cartão (innerHTML) usa só o nome da personagem do i18n: o texto da visita não entra no HTML.
  ev("visitaParaLinha = function () { return { visita: visitaPorId('valentim_html'), feita: false }; }; atualizarLinhaVisitaQuinta();");
  const html = jogo.el('visita-container').innerHTML;
  ok(html.indexOf('<b>') === -1 && html.indexOf('<script') === -1 && html.indexOf('negrito') === -1, 'o cartão da visita não devia levar o texto da visita');
}

// ----- 5. Os balões (mostrarFalas em js/main.js) usam textContent, nunca innerHTML -----
{
  const main = fs.readFileSync(path.join(JS_DIR, 'main.js'), 'utf8');
  const a = main.indexOf('function mostrarFalaAtual()');
  const corpo = main.slice(a, main.indexOf('\n}\n', a));
  ok(a !== -1 && /msgEl\.textContent\s*=\s*textoDaFala\(entrada\)/.test(corpo), 'o texto do balão devia ir para msgEl.textContent');
  ok(!/(msgEl|nomeEl)\.innerHTML/.test(corpo), 'o balão não devia usar innerHTML');
}

if (falhas) { console.log(falhas + ' falha(s)'); process.exit(1); }
console.log('OK');
