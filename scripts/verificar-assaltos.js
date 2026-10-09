// Verifica a pista dos porcos (js/assaltos.js) com leituras simuladas.
// Uso: node scripts/verificar-assaltos.js   (sai com código 1 se algo falhar)
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ctx = { URLSearchParams: URLSearchParams, location: { search: '' } };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'assaltos.js'), 'utf8'), ctx);
const { alvoDosPorcosDoDia, textoDaPista, tipoDeProtegerPelaPista, iscoDoDia, iscoAlvoFixado, iscoPerguntar, alvoParaProteger, porcoDoAlvo } = ctx;

let falhas = 0;
function ok(cond, msg) { if (!cond) { falhas++; console.log('FALHA: ' + msg); } }

function dias(n) { // n dias seguidos a partir de 2026-09-01 (UTC)
  const lista = [];
  for (let i = 0; i < n; i++) lista.push(new Date(Date.UTC(2026, 8, 1 + i)).toISOString().slice(0, 10));
  return lista;
}

const CENARIOS = [
  ['inverno sem garrafa', { estacao: 'inverno', fase: 'repouso' }],
  ['inverno com garrafa', { estacao: 'inverno', fase: 'repouso', garrafaEscura: true }],
  ['primavera', { estacao: 'primavera', fase: 'floracao' }],
  ['primavera com garrafa', { estacao: 'primavera', fase: 'floracao', garrafaEscura: true }],
  ['verao', { estacao: 'verao', fase: 'pintor' }],
  ['verao com garrafa', { estacao: 'verao', fase: 'pintor', garrafaEscura: true }],
  ['outono setembro', { estacao: 'outono', fase: 'vindima' }],
  ['outono outubro', { estacao: 'outono', fase: 'fimVindima' }],
  ['outono novembro', { estacao: 'outono', fase: 'quedaFolha' }],
  ['outono outubro com garrafa', { estacao: 'outono', fase: 'fimVindima', garrafaEscura: true }],
  ['trovoada', { estacao: 'verao', fase: 'pintor', ceu: 'trovoada', garrafaEscura: true }],
  ['nevoeiro', { estacao: 'outono', fase: 'vindima', ceu: 'nevoeiro' }],
  ['tempo indisponivel', { estacao: 'inverno', fase: 'repouso', garrafaEscura: true, ceu: null }],
  ['tudo em falta', {}]
];

CENARIOS.forEach(function (c) {
  const dist = {};
  let diferentes = 0;
  dias(60).forEach(function (dia) {
    const l = Object.assign({ dia: dia, estacao: null, fase: null, ceu: null, garrafaEscura: false, forcado: null }, c[1]);
    const a0 = alvoDosPorcosDoDia(0, l), a1 = alvoDosPorcosDoDia(1, l);
    ok(a0 === alvoDosPorcosDoDia(0, l) && a1 === alvoDosPorcosDoDia(1, l), c[0] + ': não é estável em ' + dia);
    ok(textoDaPista(a0, 0, l) === textoDaPista(a0, 0, l), c[0] + ': texto não estável');
    if (a0 !== a1) diferentes++;
    [a0, a1].forEach(function (a) {
      dist[a] = (dist[a] || 0) + 1;
      if (a === 'cave') ok(!!l.garrafaEscura && !l.ceu, c[0] + ': cave sem garrafa escura');
      if (a === 'vinha') ok(l.estacao === 'verao' || (l.estacao === 'outono' && (l.fase === 'vindima' || l.fase === 'fimVindima')), c[0] + ': vinha fora de época');
      if (l.ceu === 'trovoada' || l.ceu === 'nevoeiro') ok(a === l.ceu, c[0] + ': o tempo não venceu');
    });
  });
  console.log(c[0].padEnd(28) + JSON.stringify(dist) + '  indices diferentes no mesmo dia: ' + diferentes + '/60');
  if (!c[1].ceu && c[1].estacao) ok(diferentes > 0 || Object.keys(dist).length === 1, c[0] + ': índices nunca diferem');
});

// Variantes: ambas (1 e 2) aparecem e a chave tem o formato certo.
const variantes = {};
dias(60).forEach(function (dia) {
  const k = textoDaPista('adega', 0, { dia: dia });
  ok(/^ronda\.pista\.adega\.[12]$/.test(k), 'chave inválida ' + k);
  variantes[k] = 1;
});
ok(Object.keys(variantes).length === 2, 'as duas variantes devem aparecer em 60 dias');

// Variante com o mesmo alvo nas 2 rondas do dia: nunca a mesma frase.
dias(60).forEach(function (dia) {
  ok(textoDaPista('adega', 0, { dia: dia }) !== textoDaPista('adega', 1, { dia: dia }), 'frase repetida nas 2 rondas em ' + dia);
});

// Alvo -> minijogo do Proteger (null = sorteio de hoje).
const TIPOS = { cave: 'fechadura', vinha: 'disfarces', nevoeiro: 'chizo', trovoada: 'disfarces', adega: null };
Object.keys(TIPOS).forEach(function (a) { ok(tipoDeProtegerPelaPista(a) === TIPOS[a], 'tipo errado para ' + a); });
['porco', '', undefined, null, 42].forEach(function (v) { ok(tipoDeProtegerPelaPista(v) === null, 'valor inválido deve dar null: ' + v); });

// Alvo forçado pelo endereço (não escreve nada) e valor inválido ignorado.
ctx.location.search = '?pista=cave';
ok(alvoDosPorcosDoDia(0) === 'cave', '?pista=cave deve forçar a cave');
ctx.location.search = '?pista=porco';
ok(alvoDosPorcosDoDia(0) === 'adega', '?pista inválida deve cair para adega (sem globais)');

// ----- ISCO (funções puras) -----
const HOJE = '2026-10-05', OUTRO_DIA = '2026-10-04';
const lIsco = function (extra) { return Object.assign({ dia: HOJE, estacao: 'inverno', fase: 'repouso', ceu: null, garrafaEscura: false, forcado: null }, extra || {}); };
{
  // Precedência: ?pista= > isco fixado > cálculo ao vivo.
  const isco = { dia: HOJE, indice: 0, alvo: 'cave' };
  ok(alvoParaProteger(0, isco, HOJE, lIsco({ forcado: 'vinha' })) === 'vinha', 'o ?pista= devia vencer o isco');
  ok(alvoParaProteger(0, isco, HOJE, lIsco()) === 'cave', 'o isco fixado devia vencer o cálculo ao vivo (sem garrafa escura a cave não sairia ao vivo)');
  ok(alvoParaProteger(0, null, HOJE, lIsco()) === alvoDosPorcosDoDia(0, lIsco()), 'sem isco devia dar o cálculo ao vivo');
  // O isco fixa o alvo mesmo que o tempo mude depois: ao vivo seria trovoada.
  ok(alvoParaProteger(0, { dia: HOJE, indice: 0, alvo: 'adega' }, HOJE, lIsco({ ceu: 'trovoada' })) === 'adega', 'o isco devia fixar o alvo mesmo com o tempo a mudar');
  ok(alvoParaProteger(0, null, HOJE, lIsco({ ceu: 'trovoada' })) === 'trovoada', 'sem isco, a trovoada ao vivo devia valer');
  // Isco de outro dia ou outro índice é ignorado.
  ok(alvoParaProteger(0, { dia: OUTRO_DIA, indice: 0, alvo: 'cave' }, HOJE, lIsco()) === 'adega', 'isco de outro dia devia ser ignorado');
  ok(alvoParaProteger(1, { dia: HOJE, indice: 0, alvo: 'cave' }, HOJE, lIsco()) === alvoDosPorcosDoDia(1, lIsco()), 'isco de outro índice devia ser ignorado');
  ok(iscoAlvoFixado({ dia: HOJE, indice: 0, alvo: null }, HOJE, 0) === null, 'recusa não fixa alvo');
  ok(iscoAlvoFixado({ dia: HOJE, indice: 0, alvo: 'porco' }, HOJE, 0) === null, 'alvo inválido não fixa');
  ok(iscoAlvoFixado('lixo', HOJE, 0) === null && iscoAlvoFixado(undefined, HOJE, 0) === null, 'registo inválido não fixa');
  // Perguntar: só com pista, com bagaço e sem registo deste dia e índice.
  ok(iscoPerguntar(null, HOJE, 0, 3) === true, 'devia perguntar: pista, bagaço, sem registo');
  ok(iscoPerguntar(null, HOJE, 0, 0) === false, 'sem bagaço, sem passo');
  ok(iscoPerguntar(null, HOJE, null, 3) === false && iscoPerguntar(null, HOJE, 2, 3) === false, 'sem pista, sem passo');
  ok(iscoPerguntar({ dia: HOJE, indice: 0, alvo: null }, HOJE, 0, 3) === false, 'a recusa não devia perguntar outra vez');
  ok(iscoPerguntar({ dia: HOJE, indice: 0, alvo: 'cave' }, HOJE, 0, 3) === false, 'o isco posto não devia perguntar outra vez');
  ok(iscoPerguntar({ dia: OUTRO_DIA, indice: 0, alvo: 'cave' }, HOJE, 0, 3) === true, 'o registo de outro dia não devia impedir a pergunta');
  ok(iscoPerguntar({ dia: HOJE, indice: 0, alvo: 'cave' }, HOJE, 1, 3) === true, 'a 2.ª pista (índice 1) devia perguntar de novo');
  // Porco do alvo.
  ok(porcoDoAlvo('cave') === 'Fygmo2' && porcoDoAlvo('vinha') === 'Fygmo', 'porco da cave e da vinha');
  ok(porcoDoAlvo('adega') === null && porcoDoAlvo('nevoeiro') === null && porcoDoAlvo('trovoada') === null && porcoDoAlvo(null) === null, 'sem porco nos outros alvos');
}

// ----- ISCO no fluxo do Proteger (js/proteger.js a correr em vm, com o jogo simulado) -----
function abrirProteger(opcoes) {
  const o = Object.assign({ feitas: 1, bagaco: 3, isco: null, search: '', estacao: 'inverno', ceu: null, garrafa: true }, opcoes);
  const reg = { falas: [], saves: 0, html: '' };
  const sb = {
    console: { log() {}, warn() {}, error() {} },
    URLSearchParams: URLSearchParams,
    location: { search: o.search },
    document: { getElementById: function () { return { set innerHTML(v) { reg.html = v; }, get innerHTML() { return reg.html; } }; } },
    state: { adega: { bagaco: o.bagaco }, proteger: { isco: o.isco, vitoriasComPremioHoje: 0, diaVitoriasLisboa: HOJE } },
    saveState: function () { reg.saves++; },
    t: function (k) { return k; },
    randInt: function (a, b) { return a; },
    diaLisboaDeHoje: function () { return HOJE; },
    estacaoAtual: function () { return o.estacao; },
    faseRealAtual: function () { return 'repouso'; },
    tempoAtual: function () { return o.ceu ? { disponivel: true, ceu: o.ceu } : { disponivel: false }; },
    caveReservaAberta: function () { return o.garrafa; },
    garrafaQueMaisDescansou: function () { return 3; },
    garrafaPorDias: function () { return { imagem: 'x', nomeKey: 'adega.garrafaAmbar' }; },
    rondaChizoFeitasHoje: function () { return o.feitas; },
    definirFundo() {}, tocarSomFicheiro() {}, vibrar() {}, tocarSom() {},
    atualizarDialogo: function (m) { reg.falas.push([m]); },
    mostrarFalas: function (m) { reg.falas.push(Array.isArray(m) ? m : [m]); },
    localeAtual: function () { return 'pt-PT'; },
    TEMPO_CONFIG: { vantagens: { rondasExtraProteger: { nevoeiro: 1, trovoada: 1 } } },
    currentLang: 'pt', setTimeout: function () { return 1; }, clearTimeout: function () {}
  };
  sb.window = sb;
  const cx = vm.createContext(sb);
  require('./_regras-tempo').injetarRegrasTempo(cx);
  ['assaltos.js', 'proteger.js'].forEach(function (f) { vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), cx, { filename: f }); });
  return { cx: cx, reg: reg, ev: function (c) { return vm.runInContext(c, cx); } };
}
{
  // Sem bagaço, sem passo (vai direto ao minijogo); sem pista, sem passo.
  let g = abrirProteger({ bagaco: 0 }); g.ev('startProteger()');
  ok(g.reg.html.indexOf('protegerIscoResponder') === -1, 'sem bagaço não devia haver passo do isco');
  g = abrirProteger({ feitas: 0 }); g.ev('startProteger()');
  ok(g.reg.html.indexOf('protegerIscoResponder') === -1, 'sem pista não devia haver passo do isco');

  // Só se pergunta quando a pista leva a um minijogo: adega = sem passo e sem gastar bagaço.
  g = abrirProteger({ search: '?pista=adega' }); g.ev('startProteger()');
  ok(g.reg.html.indexOf('protegerIscoResponder') === -1, '?pista=adega não devia mostrar o passo do isco');
  ok(g.ev('state.adega.bagaco') === 3 && g.reg.saves === 0, 'adega: não devia gastar nem gravar nada');
  ['cave', 'vinha', 'nevoeiro', 'trovoada'].forEach(function (alvo) {
    g = abrirProteger({ search: '?pista=' + alvo }); g.ev('startProteger()');
    ok(g.reg.html.indexOf('protegerIscoResponder(true)') !== -1, alvo + ' devia perguntar (com bagaço)');
    ok(g.ev('state.adega.bagaco') === 3, alvo + ': a pergunta não devia gastar bagaço');
  });
  // Alvo ao vivo 'adega' (sem ?pista=): primavera, sem garrafa escura e sem tempo especial
  // dão SEMPRE 'adega'; então não há passo e não se gasta bagaço.
  g = abrirProteger({ ceu: null, estacao: 'primavera', garrafa: false }); g.ev('startProteger()');
  ok(g.ev('alvoParaProteger(0, null, diaLisboaDeHoje())') === 'adega', 'com leituras fixas o alvo ao vivo devia ser adega, deu ' + g.ev('alvoParaProteger(0, null, diaLisboaDeHoje())'));
  ok(g.reg.html.indexOf('protegerIscoResponder') === -1, 'alvo adega ao vivo não devia perguntar');
  ok(g.ev('state.adega.bagaco') === 3 && g.reg.saves === 0, 'alvo adega ao vivo: não devia gastar nem gravar nada');

  // Com pista e bagaço: pergunta e NADA se gasta até tocar numa pílula.
  g = abrirProteger({}); g.ev('startProteger()');
  ok(g.reg.html.indexOf('protegerIscoResponder(true)') !== -1 && g.reg.html.indexOf('protegerIscoResponder(false)') !== -1, 'devia mostrar as duas pílulas');
  ok(g.ev('state.adega.bagaco') === 3 && g.reg.saves === 0, 'a pergunta não devia gastar nem gravar nada');

  // "Pôr isco": -1 bagaço e registo { dia, indice, alvo } num só saveState; toque duplo não gasta 2 vezes.
  g.ev('protegerIscoResponder(true)'); g.ev('protegerIscoResponder(true)');
  ok(g.ev('state.adega.bagaco') === 2, 'devia gastar exatamente 1 bagaço, ficou ' + g.ev('state.adega.bagaco'));
  ok(g.reg.saves === 1, 'devia gravar uma só vez, gravou ' + g.reg.saves);
  const reg0 = g.ev('state.proteger.isco');
  ok(reg0 && reg0.dia === HOJE && reg0.indice === 0 && reg0.alvo === g.ev('alvoDosPorcosDoDia(0)'), 'registo do isco errado: ' + JSON.stringify(reg0));
  // Reabrir o Proteger na mesma pista: não volta a perguntar.
  g.ev('startProteger()');
  ok(g.reg.html.indexOf('protegerIscoResponder') === -1, 'não devia voltar a perguntar com isco posto');

  // "Seguir sem isco": grava alvo null, não gasta, não volta a perguntar.
  g = abrirProteger({}); g.ev('startProteger()'); g.ev('protegerIscoResponder(false)');
  ok(g.ev('state.adega.bagaco') === 3, 'recusar não devia gastar bagaço');
  ok(g.ev('state.proteger.isco.alvo') === null && g.ev('state.proteger.isco.indice') === 0, 'a recusa devia gravar alvo null');
  g.ev('startProteger()');
  ok(g.reg.html.indexOf('protegerIscoResponder') === -1, 'a recusa não devia perguntar outra vez');

  // Isco de outro dia ou de outro índice: ignorado (pergunta de novo).
  g = abrirProteger({ isco: { dia: OUTRO_DIA, indice: 0, alvo: 'cave' } }); g.ev('startProteger()');
  ok(g.reg.html.indexOf('protegerIscoResponder') !== -1, 'isco de outro dia devia ser ignorado');
  g = abrirProteger({ feitas: 2, isco: { dia: HOJE, indice: 0, alvo: 'cave' } }); g.ev('startProteger()');
  ok(g.reg.html.indexOf('protegerIscoResponder') !== -1, 'isco do índice 0 devia ser ignorado na 2.ª pista (índice 1)');

  // Efeito: isco da cave -> Fechadura com cena do Fygmo2 (mesmo que ao vivo fosse trovoada) e o balão nomeia-o.
  g = abrirProteger({ isco: { dia: HOJE, indice: 0, alvo: 'cave' }, ceu: 'trovoada' }); g.ev('startProteger()');
  ok(g.ev('ultimoTipoProteger') === 'fechadura', 'isco da cave devia dar a Fechadura, deu ' + g.ev('ultimoTipoProteger'));
  ok([0, 1, 3].indexOf(g.ev('currentFechaduraIndex')) !== -1, 'a cena devia ser do Fygmo2');
  ok(g.reg.falas.some(function (f) { return f.length === 2 && /Fygmo2/.test(f[0]); }), 'o balão devia nomear o Fygmo2');
  // Isco da vinha -> Disfarces com o Fygmo.
  g = abrirProteger({ isco: { dia: HOJE, indice: 0, alvo: 'vinha' } }); g.ev('startProteger()');
  ok(g.ev('ultimoTipoProteger') === 'disfarces' && g.ev('currentDisfarcePorco') === 'Fygmo', 'isco da vinha devia dar Disfarces com o Fygmo');
  // Isco de nevoeiro -> Chizo, sem porco nomeado.
  g = abrirProteger({ isco: { dia: HOJE, indice: 0, alvo: 'nevoeiro' }, estacao: 'verao' }); g.ev('startProteger()');
  ok(g.ev('ultimoTipoProteger') === 'chizo', 'isco de nevoeiro devia dar o Chizo (até no verão), deu ' + g.ev('ultimoTipoProteger'));
  ok(g.ev('protegerPorcoIsco') === null, 'nevoeiro não nomeia nenhum porco');
  // Isco de trovoada -> Disfarces (o Chizo tem medo), sem porco nomeado.
  g = abrirProteger({ isco: { dia: HOJE, indice: 0, alvo: 'trovoada' }, estacao: 'verao' }); g.ev('startProteger()');
  ok(g.ev('ultimoTipoProteger') === 'disfarces', 'isco de trovoada devia dar Disfarces (até no verão), deu ' + g.ev('ultimoTipoProteger'));
  ok(g.ev('protegerPorcoIsco') === null, 'trovoada não nomeia nenhum porco');
  // ?pista= no endereço: trovoada abre Disfarces e nevoeiro abre o Chizo.
  g = abrirProteger({ search: '?pista=trovoada', feitas: 0, estacao: 'verao' }); g.ev('startProteger()'); g.ev('protegerIscoResponder(false)');
  ok(g.ev('ultimoTipoProteger') === 'disfarces', '?pista=trovoada devia abrir Disfarces, deu ' + g.ev('ultimoTipoProteger'));
  g = abrirProteger({ search: '?pista=nevoeiro', feitas: 0, estacao: 'inverno' }); g.ev('startProteger()'); g.ev('protegerIscoResponder(false)');
  ok(g.ev('ultimoTipoProteger') === 'chizo', '?pista=nevoeiro devia abrir o Chizo, deu ' + g.ev('ultimoTipoProteger'));
  // Rondas extra do tempo: o isco só vale na 1.ª ronda.
  g = abrirProteger({ isco: { dia: HOJE, indice: 0, alvo: 'vinha' } }); g.ev("protegerRondaAtual = 2; startProteger(true);");
  ok(g.ev('protegerIscoNaRonda') === false && g.ev('protegerPorcoIsco') === null, 'o isco não devia valer nas rondas extra');

  // Modo de teste (?pista=): mostra o passo mas não grava nem gasta nada; ?pista= vence o isco.
  g = abrirProteger({ search: '?pista=cave', feitas: 0, estacao: 'verao', garrafa: false }); g.ev('startProteger()');
  ok(g.reg.html.indexOf('protegerIscoResponder') !== -1, 'em teste (?pista=) devia mostrar o passo');
  g.ev('protegerIscoResponder(true)');
  ok(g.ev('state.adega.bagaco') === 3 && g.reg.saves === 0 && g.ev('state.proteger.isco') === null, 'em teste não devia gastar nem gravar');
  ok(g.ev('ultimoTipoProteger') === 'fechadura' && g.ev('protegerPorcoIsco') === 'Fygmo2', 'em teste ?pista=cave + isco: Fechadura com o Fygmo2');
  g = abrirProteger({ search: '?pista=vinha', isco: { dia: HOJE, indice: 0, alvo: 'cave' } }); g.ev('startProteger()');
  ok(g.ev('alvoParaProteger(0, state.proteger.isco, diaLisboaDeHoje())') === 'vinha', '?pista= devia vencer o isco gravado');
}

console.log(falhas === 0 ? 'OK' : falhas + ' FALHA(S)');
process.exit(falhas === 0 ? 0 : 1);
