#!/usr/bin/env node
// ENSAIO GERAL: um pacote completo vindo de dadosAcrescentar (nível 11 + história do nível 11 + capítulo do
// nível 11) passa por todo o jogo sem partir nada. SÓ EM TESTE: o pacote vive no ambiente simulado (módulo vm,
// scripts/_jogo-vm.js); nada fica no jogo nem em dados/ (o teste confirma que dados/ só tem comentários).
// Os textos do pacote trazem <b>, &, aspas e plicas, para testar o escape (js/i18n.js: escaparHtml).
//
// Prova, nas 3 línguas: (a) subir ao nível 11 mostra a história nova; (b) a história do nível 11 não aparece para o
// nível 10; (c) os cartões do nível e do capítulo mostram os textos escapados; (d) o capítulo só está ativo no cartão
// depois do nível 11 e celebra uma só vez; (e) ecrãs trancados, jogador antigo, próximo nível e barra de progresso
// funcionam com 11 níveis (sem NaN nem undefined); (f) o estado guardado só tem ids e carrega bem se o pacote deixar
// de existir.
//
// Problemas encontrados no jogo NÃO se corrigem aqui: ficam em "Observações" (não falham), com o motivo.
//
// Uso: node scripts/verificar-piloto-nivel.js
// JS_DIR=pasta  corre sobre outra versão dos js/ (para provar que o teste apanha o que se estraga).
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const { abrirJogo, FICHEIROS_DE_DADOS } = require('./_jogo-vm');

const RAIZ = path.join(__dirname, '..');
const JS_DIR = process.env.JS_DIR || path.join(RAIZ, 'js');
const LINGUAS = ['pt', 'en', 'es'];
let falhas = 0;
function ok(cond, msg) { if (!cond) { falhas++; console.log('FALHA: ' + msg); } }
const observacoes = [];
// Algo que o jogo faz e que talvez não fosse o ideal: não falha, fica no relatório.
function observar(ideal, msg) { if (!ideal) observacoes.push(msg); }

// ----- O pacote de teste -----
function TXT(base) {
  const t = {};
  LINGUAS.forEach(function (l) { t[l] = base + ' <b>11</b> & "aspas" d\'ouro [' + l + ']'; });
  return t;
}
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
const NOME = TXT('Nível Piloto');
const FALAS = [TXT('Fala um'), TXT('Fala dois'), TXT('Fala três')];
const PACOTE = {
  nivel: { id: 'nivel_piloto_11', min: 3600, nome: NOME },
  historia: {
    id: 'historia_piloto_11', nivel: 11,
    falas: [{ texto: FALAS[0], foto: 'assets/mapa/mapa_quinta.jpg', som: 'assets/sons/chizo_ladrar.mp3' }, { texto: FALAS[1] }, { texto: FALAS[2] }]
  },
  capitulo: {
    id: 'cap_piloto_11', nivel: 11, criterio: [{ tipo: 'numero', caminho: 'garrafas', alvo: 5 }],
    titulo: TXT('Título piloto'), objetivo: TXT('Objetivo piloto'), conclusao: TXT('Conclusão piloto')
  }
};
const LIMIARES = [0, 15, 50, 120, 300, 600, 1000, 1500, 2100, 2800, 3600]; // os 10 níveis de hoje + o 11 do pacote
const ECRA_PILOTO = 'ecra_piloto'; // um ecrã inventado que pede o nível 11 (só dentro do vm)

function js(o) { return JSON.stringify(o); }
function nivelEsperado(rep) { let n = 1; LIMIARES.forEach(function (m, i) { if (rep >= m) n = i + 1; }); return n; }

// Abre o jogo, instala o pacote (ou parte dele) e liga os ganchos de teste.
function abrir(opcoes) {
  const o = opcoes || {};
  const avisos = [];
  const g = abrirJogo({ jsDir: JS_DIR, dadosDir: null, ecraReal: true, estadoGuardado: o.estadoGuardado, aoAvisar: function (m) { avisos.push(m); } });
  g.avisos = avisos;
  g.ev(`
    var FALAS = []; var dialogoFila = []; var TIMEOUTS = [];
    mostrarFalas = function (m, n) { var l = Array.isArray(m) ? m : [m]; FALAS.push({ m: l, n: n }); dialogoFila = l; document.getElementById('app-dialogue').hidden = false; };
    setTimeout = function (f) { TIMEOUTS.push(f); return TIMEOUTS.length; };
    clearTimeout = function () {};
    document.querySelector = function () { return { id: 'screen-quinta' }; };
  `);
  const instalar = o.instalar || ['nivel', 'historia', 'capitulo'];
  if (instalar.indexOf('nivel') !== -1) ok(g.ev('dadosAcrescentar("niveis", ' + js(PACOTE.nivel) + ')') === true, 'o nível do pacote devia entrar');
  if (instalar.indexOf('historia') !== -1) ok(g.ev('dadosAcrescentar("historias", ' + js(PACOTE.historia) + ')') === true, 'a história do pacote devia entrar');
  if (instalar.indexOf('capitulo') !== -1) ok(g.ev('dadosAcrescentar("capitulos", ' + js(PACOTE.capitulo) + ')') === true, 'o capítulo do pacote devia entrar');
  g.ev('NIVEL_NECESSARIO_POR_ECRA.' + ECRA_PILOTO + ' = 11;');
  return g;
}
// Reputação, nível já mostrado e capítulos de origem concluídos (para o do pacote ser o do cartão).
function preparar(g, rep, nivelMostrado) {
  g.ev(`
    state.acesso.jogadorAntigo = false; state.reputacao = ${rep}; state.niveis.nivelMostrado = ${nivelMostrado};
    state.capitulos.iniciado = true; state.capitulos.celebradosMigrado = true;
    CAPITULOS_CONFIG.forEach(function (c) { if (c.id !== 'cap_piloto_11') { state.capitulos.concluidos[c.id] = true; state.capitulos.celebrados[c.id] = true; } });
    FALAS.length = 0;
  `);
}
function lingua(g, l) { g.ev("currentLang = '" + l + "';"); }
function html(g, id) { return g.el(id).innerHTML; }
function limpo(texto, onde) {
  ok(!/NaN|undefined|null|Infinity/.test(texto), onde + ': tem NaN, undefined, null ou Infinity: ' + texto.slice(0, 200));
}
function semTagsDoPacote(h, onde) {
  ok(h.indexOf('<b>') === -1 && h.indexOf('</b>') === -1, onde + ': o HTML tem um <b> a sério: ' + h.slice(0, 200));
}

// =====================================================================
// 0. Ponto de partida: dados/ vazio e o jogo sem pacote tem 10 níveis
// =====================================================================
{
  const g = abrirJogo({ jsDir: JS_DIR });
  ok(g.ev('NIVEIS_CONFIG.length') === 10 && g.ev('CAPITULOS_CONFIG.length') === 10 && Object.keys(g.ev('HISTORIA_NIVEIS')).join() === '2,3,4,5,6,7,8,9,10', 'o jogo (com a pasta dados/) devia ter 10 níveis, 10 capítulos e as histórias dos níveis 2 a 10');
  ok(g.ev('DADOS_ACRESCENTADOS.niveis.length + DADOS_ACRESCENTADOS.historias.length + DADOS_ACRESCENTADOS.capitulos.length') === 0, 'dados/ devia estar sem entradas');
  FICHEIROS_DE_DADOS.forEach(function (f) {
    const codigo = fs.readFileSync(path.join(RAIZ, 'dados', f), 'utf8').replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();
    ok(codigo === '', 'dados/' + f + ' devia ter só comentários (sem entradas), tem: ' + codigo.slice(0, 60));
  });
  ['assets/mapa/mapa_quinta.jpg', 'assets/sons/chizo_ladrar.mp3'].forEach(function (f) { ok(fs.existsSync(path.join(RAIZ, f)), 'o ficheiro do pacote ' + f + ' devia existir'); });
}

LINGUAS.forEach(function (l) {
  const L = ' [' + l + ']';

  // ===================================================================
  // (a) e (b) Subir ao nível 11 mostra a história nova; o nível 10 não a mostra
  // ===================================================================
  {
    const g = abrir(); lingua(g, l);
    ok(g.ev('NIVEIS_CONFIG.length') === 11 && g.ev('nivelPelaReputacao(3599)') === 10 && g.ev('nivelPelaReputacao(3600)') === 11, 'com o pacote devia haver 11 níveis, o 11 a partir de 3600' + L);

    // subir do 9 ao 10: só a história do 10 (nada do pacote)
    preparar(g, 2800, 9);
    ok(g.ev('verificarSubidaNivel()') === true, 'subir ao nível 10 devia devolver true' + L);
    const falas10 = g.ev('JSON.stringify(FALAS)');
    ok(falas10.indexOf('Fala um') === -1 && falas10.indexOf('Piloto') === -1, 'a história do nível 11 não devia aparecer ao subir ao nível 10' + L);
    ok(g.ev('FALAS.length') === 1 && g.ev('FALAS[0].m.length') === 3, 'ao subir ao 10 devia mostrar as 3 falas do nível 10' + L);

    // ficar no 10 não mostra nada
    g.ev('FALAS.length = 0;');
    ok(g.ev('verificarSubidaNivel()') === false && g.ev('FALAS.length') === 0, 'sem subir de nível não devia mostrar história' + L);
    ok(g.ev('mostrarHistoriaSubidaNivel(9, 10); FALAS.length') === 1 && g.ev('JSON.stringify(FALAS)').indexOf('Fala um') === -1, 'a história de 9 para 10 não devia ter falas do pacote' + L);

    // subir do 10 ao 11: a história do pacote, traduzida
    preparar(g, 3600, 10);
    ok(g.ev('verificarSubidaNivel()') === true, 'subir ao nível 11 devia devolver true' + L);
    ok(g.ev('state.niveis.nivelMostrado') === 11, 'o nível mostrado devia passar a 11' + L);
    ok(g.ev('FALAS.length') === 1 && g.ev('FALAS[0].n') === 'YoshiCat', 'devia mostrar uma só fila de falas (do YoshiCat)' + L);
    const falas = g.ev('JSON.parse(JSON.stringify(FALAS[0].m))');
    ok(falas.length === 3, 'o nível 11 devia mostrar as 3 falas do pacote' + L);
    falas.forEach(function (f, i) {
      ok(f.texto === FALAS[i][l], 'fala ' + (i + 1) + ' devia vir do pacote em ' + l + ', crua (balão, textContent): ' + f.texto);
    });
    ok(falas[0].foto === 'assets/mapa/mapa_quinta.jpg' && falas[0].som === 'assets/sons/chizo_ladrar.mp3', 'a 1.ª fala devia levar a foto e o som' + L);
    ok(falas[1].foto === undefined && falas[2].som === undefined, 'as outras falas não levam foto nem som' + L);

    // saltar do 1 ao 11 de uma vez: as histórias de 2 a 11, por ordem, com a do pacote no fim
    g.ev('FALAS.length = 0; mostrarHistoriaSubidaNivel(1, 11);');
    const todas = g.ev('JSON.parse(JSON.stringify(FALAS[0].m))');
    ok(todas.length === 30 && todas[27].texto === FALAS[0][l] && todas[29].texto === FALAS[2][l], 'de 1 a 11 devia dar 27 falas dos níveis 2 a 10 e as 3 do pacote no fim' + L);

    // o nome do nível novo na mensagem de um ecrã trancado (balão: texto cru)
    preparar(g, 2900, 10);
    g.ev("mostrarMensagemTrancada('" + ECRA_PILOTO + "');");
    const trancada = g.ev('FALAS[FALAS.length - 1].m[0]');
    ok(trancada.indexOf(NOME[l]) !== -1, 'a mensagem de ecrã trancado devia levar o nome do nível 11 em ' + l + ': ' + trancada);
    ok(trancada.indexOf('700') !== -1 && trancada.indexOf('11') !== -1, 'a mensagem devia dizer o nível 11 e faltarem 700' + L + ': ' + trancada);
    limpo(trancada, 'mensagem de ecrã trancado' + L);
  }

  // ===================================================================
  // (c) Cartões do nível e do capítulo: textos escapados
  // ===================================================================
  {
    const g = abrir(); lingua(g, l);
    // no nível 10 o próximo nível é o do pacote
    preparar(g, 2900, 10);
    g.ev('atualizarCartaoNivelQuinta(); atualizarCapituloQuinta();');
    const n10 = html(g, 'nivel-container');
    ok(n10.indexOf(esc(NOME[l])) !== -1, 'o cartão do nível 10 devia mostrar o nome do próximo nível escapado' + L + ': ' + n10);
    semTagsDoPacote(n10, 'cartão do nível 10' + L);
    // no nível 11 é o nível atual, e já não há próximo
    preparar(g, 3600, 11);
    g.ev('atualizarCartaoNivelQuinta(); atualizarCapituloQuinta();');
    const n11 = html(g, 'nivel-container');
    ok(n11.indexOf(esc(NOME[l])) !== -1 && n11.indexOf('width:100%') !== -1, 'o cartão do nível 11 devia mostrar o nome escapado e a barra cheia' + L + ': ' + n11);
    semTagsDoPacote(n11, 'cartão do nível 11' + L);
    ok(n11.indexOf(g.ev("t('nivel.maximo')")) !== -1, 'no nível 11 (o último) devia dizer que é o nível máximo' + L);
    limpo(n11, 'cartão do nível 11' + L);
    const c11 = html(g, 'capitulo-container');
    ok(c11.split(esc(PACOTE.capitulo.titulo[l])).length === 2 && c11.split(esc(PACOTE.capitulo.objetivo[l])).length === 2, 'o cartão do capítulo devia mostrar título e objetivo escapados, uma vez cada' + L + ': ' + c11);
    semTagsDoPacote(c11, 'cartão do capítulo' + L);
    ok(c11.indexOf('0 / 5') !== -1, 'o cartão do capítulo devia mostrar o progresso 0 / 5' + L + ': ' + c11);
    limpo(c11, 'cartão do capítulo' + L);
    // o nome do pacote não vai escapado para um balão
    ok(g.ev('nivelNome(NIVEIS_CONFIG[10])') === NOME[l], 'nivelNome devia dar o nome cru (o escape é só no HTML)' + L);
  }

  // ===================================================================
  // (d) O capítulo do nível 11: ativo só depois do nível 11; celebra uma só vez
  // ===================================================================
  {
    const g = abrir(); lingua(g, l);
    const ui = g.ev("cStr('ui')");

    // nível 10: o cartão mostra o "próximo capítulo no nível 11", não o título do pacote
    preparar(g, 2900, 10);
    g.ev('atualizarCapituloQuinta();');
    const c10 = html(g, 'capitulo-container');
    ok(c10.indexOf(esc(ui.proximo.replace('{n}', 11))) !== -1 || c10.indexOf(ui.proximo.replace('{n}', 11)) !== -1, 'no nível 10 o cartão devia dizer o próximo capítulo no nível 11' + L + ': ' + c10);
    ok(c10.indexOf(PACOTE.capitulo.titulo[l].slice(0, 12)) === -1, 'no nível 10 o capítulo do pacote ainda não devia estar ativo' + L);
    limpo(c10, 'cartão do capítulo no nível 10' + L);

    // nível 11 sem o critério: o cartão mostra o capítulo; nada para celebrar
    preparar(g, 3600, 11);
    g.ev('state.garrafas = 2; atualizarCapituloQuinta();');
    ok(html(g, 'capitulo-container').indexOf('2 / 5') !== -1, 'a 2 garrafas o cartão devia dizer 2 / 5' + L);
    ok(g.ev('capitulosAvaliarCelebracao()') === false && g.ev('FALAS.length') === 0, 'sem cumprir o critério não devia celebrar' + L);

    // cumpre o critério: celebra uma vez, com a conclusão em ' + l
    g.ev('state.garrafas = 5;');
    ok(g.ev('capitulosAvaliarCelebracao()') === true, 'cumprido o critério devia celebrar' + L);
    ok(g.ev('FALAS.length') === 1 && g.ev('FALAS[0].m[0]') === PACOTE.capitulo.conclusao[l], 'a celebração devia mostrar a conclusão do pacote em ' + l + ', crua' + L);
    ok(g.ev('capitulosAvaliarCelebracao()') === true && g.ev('FALAS.length') === 1, 'com uma festa pendente não devia agendar outra' + L);
    ok(g.ev('TIMEOUTS.length') === 1, 'devia haver uma só confirmação à espera' + L);
    g.ev('TIMEOUTS[0]();'); // o balão ficou visível: confirma
    ok(g.ev('state.capitulos.concluidos.cap_piloto_11') === true && g.ev('state.capitulos.celebrados.cap_piloto_11') === true, 'depois da confirmação devia ficar concluído e celebrado' + L);
    ok(g.ev('capitulosAvaliarCelebracao()') === false && g.ev('FALAS.length') === 1, 'o capítulo só celebra uma vez' + L);
    g.ev('atualizarCapituloQuinta();');
    ok(html(g, 'capitulo-container').indexOf(ui.todos) !== -1, 'cumpridos todos, o cartão devia dizer que estão todos cumpridos' + L + ': ' + html(g, 'capitulo-container'));
  }

  // ===================================================================
  // (e) Ecrãs trancados, jogador antigo, próximo nível e barra de progresso com 11 níveis
  // ===================================================================
  {
    const g = abrir(); lingua(g, l);
    const ecras = Object.keys(g.ev('NIVEL_NECESSARIO_POR_ECRA'));
    ok(ecras.length >= 14 && ecras.indexOf(ECRA_PILOTO) !== -1, 'devia haver os ecrãs trancados de hoje e o de teste' + L);
    [0, 1, 14, 15, 49, 50, 119, 120, 2799, 2800, 2899, 3599, 3600, 3601, 99999].forEach(function (rep) {
      const n = nivelEsperado(rep);
      const onde = 'reputação ' + rep + L;
      preparar(g, rep, n);
      ok(g.ev('nivelPelaReputacao(state.reputacao)') === n, 'o nível devia ser ' + n + ' com ' + onde);
      g.ev('atualizarCartaoNivelQuinta(); atualizarResumoQuinta(); atualizarCapituloQuinta();');
      const h = html(g, 'nivel-container');
      limpo(h, 'cartão do nível, ' + onde);
      limpo(html(g, 'capitulo-container'), 'cartão do capítulo, ' + onde);
      limpo(g.el('quinta-resumo-linha').textContent, 'resumo, ' + onde);
      ok(h.indexOf(g.ev("t('nivel.label')") + ' ' + n + ' · ') !== -1, 'o cartão devia dizer o nível ' + n + ' com ' + onde + ': ' + h);
      if (n < 11) {
        const prox = LIMIARES[n];
        const pct = Math.round(Math.min(rep, prox) / prox * 100);
        ok(h.indexOf('width:' + pct + '%') !== -1, 'a barra devia estar a ' + pct + '% com ' + onde + ': ' + h);
        ok(h.indexOf(Math.min(rep, prox) + ' / ' + prox) !== -1, 'devia mostrar ' + Math.min(rep, prox) + ' / ' + prox + ' com ' + onde);
      } else {
        ok(h.indexOf('width:100%') !== -1, 'no nível 11 a barra devia estar cheia com ' + onde);
      }
      // ecrãs: abertos se o nível chega, trancados senão; jogador antigo abre tudo
      ecras.forEach(function (e) {
        const preciso = g.ev('NIVEL_NECESSARIO_POR_ECRA.' + e);
        ok(g.ev("ecraDesbloqueado('" + e + "')") === (n >= preciso), 'o ecrã ' + e + ' (nível ' + preciso + ') devia estar ' + (n >= preciso ? 'aberto' : 'trancado') + ' com ' + onde);
        if (n < preciso) {
          g.ev('FALAS.length = 0; mostrarMensagemTrancada(' + js(e) + ');');
          const msg = g.ev('FALAS[0].m[0]');
          limpo(msg, 'mensagem do ecrã ' + e + ' trancado, ' + onde);
          ok(msg.indexOf(String(Math.max(0, LIMIARES[preciso - 1] - rep))) !== -1, 'a mensagem do ecrã ' + e + ' devia dizer quanto falta com ' + onde + ': ' + msg);
        }
      });
      g.ev('state.acesso.jogadorAntigo = true;');
      ecras.forEach(function (e) { ok(g.ev("ecraDesbloqueado('" + e + "')") === true, 'jogador antigo: o ecrã ' + e + ' devia estar aberto com ' + onde); });
      g.ev('state.acesso.jogadorAntigo = false;');
    });
  }
});

// =====================================================================
// (f) O estado guardado só tem ids e continua a carregar se o pacote deixar de existir
// =====================================================================
{
  // Jogo A: com o pacote, sobe ao 11, cumpre o capítulo e grava.
  const a = abrir(); lingua(a, 'pt');
  preparar(a, 3600, 10);
  ok(a.ev('verificarSubidaNivel()') === true, 'jogo A: devia subir ao 11');
  a.ev('state.garrafas = 5; capitulosAvaliarCelebracao(); TIMEOUTS[0](); saveState(state);');
  const salvo = a.guardado.yoshicat_quinta_state_v2;
  ok(typeof salvo === 'string' && salvo.length > 100, 'jogo A: devia ter gravado o estado');
  const estado = JSON.parse(salvo);
  ok(estado.niveis.nivelMostrado === 11 && estado.capitulos.concluidos.cap_piloto_11 === true && estado.capitulos.celebrados.cap_piloto_11 === true, 'jogo A: o estado devia ter o nível 11 e o capítulo como ids');
  const textos = [];
  [NOME, FALAS[0], FALAS[1], FALAS[2], PACOTE.capitulo.titulo, PACOTE.capitulo.objetivo, PACOTE.capitulo.conclusao].forEach(function (t) { LINGUAS.forEach(function (x) { textos.push(t[x]); }); });
  ok(textos.every(function (t) { return salvo.indexOf(t) === -1; }), 'o estado guardado não devia levar nenhum texto do pacote (só ids)');
  ok(salvo.indexOf('mapa_quinta') === -1 && salvo.indexOf('chizo_ladrar') === -1, 'o estado guardado não devia levar a foto nem o som do pacote');

  // Jogo B: o mesmo estado, SEM o pacote.
  const b = abrirJogo({ jsDir: JS_DIR, dadosDir: null, ecraReal: true, estadoGuardado: salvo });
  b.ev("var FALAS = []; mostrarFalas = function (m, n) { FALAS.push({ m: Array.isArray(m) ? m : [m], n: n }); };");
  ok(b.ev('NIVEIS_CONFIG.length') === 10 && b.ev('state.reputacao') === 3600, 'jogo B: devia abrir sem o pacote, com 10 níveis e a Reputação guardada');
  ok(b.ev('nivelPelaReputacao(state.reputacao)') === 10, 'jogo B: o nível devia ser o 10 (o mais alto que existe), não o 11');
  let semErro = true;
  try {
    b.ev('verificarSubidaNivel(); atualizarCartaoNivelQuinta(); atualizarResumoQuinta(); atualizarCapituloQuinta(); capitulosAvaliarEmSilencio(); capitulosAvaliarCelebracao(); garantirObjetivosDoDia(); atualizarCartaoObjetivosQuinta();');
  } catch (e) { semErro = false; ok(false, 'jogo B: rebentou: ' + e.message); }
  ok(semErro, 'jogo B: os cartões e as avaliações deviam correr sem erro');
  ok(b.ev('verificarSubidaNivel()') === false && b.ev('FALAS.length') === 0, 'jogo B: não devia mostrar subida de nível nem história');
  const hb = b.el('nivel-container').innerHTML;
  limpo(hb, 'jogo B: cartão do nível');
  ok(hb.indexOf(b.ev("t('nivel.label')") + ' 10 · ') !== -1 && hb.indexOf(b.ev("t('nivel.maximo')")) !== -1, 'jogo B: o cartão devia mostrar o nível 10 (máximo): ' + hb);
  limpo(b.el('capitulo-container').innerHTML, 'jogo B: cartão do capítulo');
  ok(b.ev('state.capitulos.concluidos.cap_piloto_11') === true, 'jogo B: o id do capítulo desaparecido não devia ser apagado do estado');
  b.ev('state.reputacao += 50; saveState(state);');
  ok(b.ev('verificarSubidaNivel()') === false && b.ev('state.reputacao') === 3650, 'jogo B: o jogador devia continuar a jogar e a ganhar Reputação');
  ['proteger', 'garrafa', 'explorar', 'colecao', 'estrada', 'lagar', 'camara', 'roxo'].forEach(function (e) { ok(b.ev("ecraDesbloqueado('" + e + "')") === true, 'jogo B: o ecrã ' + e + ' devia estar aberto'); });
  observar(b.ev('state.niveis.nivelMostrado') <= b.ev('NIVEIS_CONFIG.length'),
    'Sem o pacote, o estado guardado fica com niveis.nivelMostrado = ' + b.ev('state.niveis.nivelMostrado') + ' (o jogo só tem ' + b.ev('NIVEIS_CONFIG.length') + ' níveis). Nada parte e o jogador não fica preso, mas, se mais tarde entrar OUTRO nível 11, a sua história não aparece a quem já o "viu" (js/niveis.js: verificarSubidaNivel compara com nivelMostrado e nunca o baixa).');

  // Jogo C: o pacote volta. Nada se repete.
  const c = abrir({ estadoGuardado: salvo }); lingua(c, 'pt');
  ok(c.ev('NIVEIS_CONFIG.length') === 11 && c.ev('nivelPelaReputacao(state.reputacao)') === 11, 'jogo C: com o pacote de volta devia voltar a haver nível 11');
  ok(c.ev('verificarSubidaNivel()') === false && c.ev('FALAS.length') === 0, 'jogo C: a história do nível 11 não devia repetir-se');
  ok(c.ev('capitulosAvaliarCelebracao()') === false, 'jogo C: o capítulo já celebrado não devia celebrar outra vez');
  c.ev('atualizarCartaoNivelQuinta(); atualizarCapituloQuinta();');
  ok(c.el('nivel-container').innerHTML.indexOf(esc(NOME.pt)) !== -1, 'jogo C: o cartão devia mostrar o nível 11 do pacote');
}

// =====================================================================
// Observações: coisas do jogo que o ensaio mostrou (não falham; não se corrigem aqui)
// =====================================================================
{
  // Subir a um nível SEM história: nenhuma mensagem (o ramo "nivel.subiuMsg" só corre sem historia.js).
  const g = abrir({ instalar: ['nivel', 'capitulo'] }); lingua(g, 'pt');
  preparar(g, 3600, 10);
  ok(g.ev('verificarSubidaNivel()') === true, 'sem história do nível 11 a subida devia funcionar na mesma');
  observar(g.ev('FALAS.length') > 0,
    'Subir a um nível que não tem história (HISTORIA_NIVEIS) não mostra nenhuma mensagem: js/niveis.js verificarSubidaNivel só usa a mensagem "nivel.subiuMsg" quando NÃO existe a função mostrarHistoriaSubidaNivel, e js/historia.js sai sem mostrar nada quando o nível não tem falas. O nível novo aparece só no cartão. Por isso um nível novo deve trazer sempre a sua história (o validador já o exige).');

  // Modo de teste dos capítulos: só cap1 a cap10.
  g.ev("location.search = '?capitulo=11';");
  observar(g.ev('capitulosParametrosTeste()') !== null,
    'O modo de teste ?capitulo=N (js/capitulos.js capitulosParametrosTeste) só aceita 1 a 10 (a expressão regular tem o 10 escrito), por isso não dá para ver a celebração do capítulo 11. Ids como cap_piloto_11 também não casam.');

  // A celebração não olha ao nível.
  const h = abrir(); lingua(h, 'pt');
  preparar(h, 2900, 10);
  h.ev('state.garrafas = 5;');
  observar(h.ev('capitulosAvaliarCelebracao()') === false,
    'A celebração de um capítulo não olha ao nível: no nível 10, com o critério do capítulo 11 já cumprido, js/capitulos.js capitulosAvaliarCelebracao celebra-o na mesma (só o cartão respeita o nível). É igual para os capítulos de hoje; a migração silenciosa ao abrir o jogo evita o caso dos que já estavam cumpridos.');
}

if (observacoes.length > 0) {
  console.log('Observações (não falham):');
  observacoes.forEach(function (o) { console.log(' - ' + o); });
}
if (falhas) { console.log(falhas + ' falha(s)'); process.exit(1); }
console.log('OK');
