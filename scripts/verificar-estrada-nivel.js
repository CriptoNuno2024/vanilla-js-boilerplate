#!/usr/bin/env node
// O NÍVEL MÍNIMO DOS VIZINHOS DA ESTRADA ("nivelMinimo" em js/estrada-dados.js). Um vizinho só existe para o jogador quando o nível
// dele chega a esse mínimo; sem o campo vale 7 (o nível em que a Estrada abre). Os 4 vizinhos de hoje têm 7.
//
// Prova, com um vizinho de TESTE de nivelMinimo 14 que vive só dentro do ambiente simulado (nunca no jogo):
//   (a) a um jogador de nível 13: o vizinho não aparece no ecrã, não pede (nunca sal nem bagaceira), não troca (recusa «nivel_insuficiente»,
//       mesmo chamando a função diretamente, sem alterar NADA) e não conta (teto de trocas por dia, bens, prateleira, oferta às visitas,
//       receitas, e o estado que os critérios dos capítulos leem fica igual);
//   (b) ao nível 14 aparece, pede, troca e conta;
//   (c) com os 4 vizinhos de hoje o jogo fica exatamente igual (ecrã em pt, en e es e uma sequência de trocas e ofertas) para quem tem a
//       Estrada aberta (nível 7 ou mais, ou jogador antigo), comparado com o mesmo jogo sem nenhum filtro de nível;
//   (d) o campo: ausente ou null = 7; um valor que não seja um inteiro >= 1 deixa o vizinho fechado;
//   (e) o pedido do dia de cada vizinho só depende do dia e do id dele (acrescentar vizinhos não muda os dos que já existem).
// Só LÊ os ficheiros de js/ e de dados/niveis.js e corre-os num ambiente simulado (vm), sem browser nem conta real.
//
// Uso: node scripts/verificar-estrada-nivel.js
// JS_DIR=pasta  corre sobre outra versão dos js/ (para provar que o teste apanha o que se estraga).
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const JS_DIR = process.env.JS_DIR || path.join(RAIZ, 'js');
const LINGUAS = ['pt', 'en', 'es'];
let falhas = 0;
function ok(cond, msg) { if (!cond) { falhas++; console.log('FALHA: ' + msg); } }
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }

// Os dias de teste: 60 dias seguidos a partir de 2026-10-01 (dias de Lisboa 'AAAA-MM-DD').
const DIAS = [];
for (let i = 0; i < 60; i++) DIAS.push(new Date(Date.UTC(2026, 9, 1 + i)).toISOString().slice(0, 10));
const D1 = DIAS[0];

// Abre o jogo (só os ficheiros que a Estrada usa, mais os níveis 11 em diante vindos de dados/niveis.js).
function abrir() {
  const gravacoes = [];
  const elementos = {};
  const el = function (id) { return elementos[id] || (elementos[id] = { innerHTML: '' }); };
  const sb = {
    console: { log() {}, warn() {}, error() {} },
    localStorage: { getItem: function () { return null; }, setItem: function (k) { gravacoes.push(k); }, removeItem: function (k) { gravacoes.push(k); } },
    location: { search: '' }, URLSearchParams: URLSearchParams, Date: Date, setTimeout: function () {}, Image: function () {},
    document: { querySelectorAll: function () { return []; }, querySelector: function () { return { disabled: false }; }, getElementById: el, addEventListener: function () {} },
    Telegram: { WebApp: {} }
  };
  sb.window = sb;
  const cx = vm.createContext(sb);
  ['state.js', 'i18n.js', 'niveis.js', 'caderno.js', 'estrada-dados.js', 'despensa.js', 'estrada.js', 'dados.js'].forEach(function (f) {
    vm.runInContext(fs.readFileSync(path.join(JS_DIR, f), 'utf8'), cx, { filename: 'js/' + f });
  });
  vm.runInContext(fs.readFileSync(path.join(RAIZ, 'dados', 'niveis.js'), 'utf8'), cx, { filename: 'dados/niveis.js' });
  vm.runInContext('this.diaLisboaDeHoje = function () { return __dia; }; this.atualizarDialogo = function () {}; this.__dia = "' + D1 + '"; this.tocarSom = function () {}; this.updateStatsDisplays = function () {};', cx);
  const g = {
    cx: cx, gravacoes: gravacoes,
    ev: function (codigo) { return vm.runInContext(codigo, cx); },
    json: function (codigo) { return JSON.parse(vm.runInContext('JSON.stringify(' + codigo + ')', cx)); },
    desenhar: function (lingua, dia) {
      vm.runInContext('currentLang = ' + JSON.stringify(lingua) + '; __dia = ' + JSON.stringify(dia) + '; renderEstrada();', cx);
      return el('estrada-container').innerHTML;
    }
  };
  return g;
}

// Põe um jogador no estado: "nivel" (1 a 20, pela Reputação mínima desse nível) e jogador antigo ou novo; o resto é igual para todos.
function jogador(g, opcoes) {
  const o = Object.assign({ nivel: 7, reputacao: null, antigo: false, despensa: null, garrafas: 4, uvas: 1000 }, opcoes || {});
  const rep = o.reputacao !== null ? o.reputacao : g.ev('NIVEIS_CONFIG[' + (o.nivel - 1) + '].min');
  const estado = {
    uvas: o.uvas, reputacao: rep, garrafas: o.garrafas, acesso: { jogadorAntigo: o.antigo },
    adega: { historico: [{ data: 'x', estacao: 'inverno', diasDescanso: 2 }], bagaceira: 2 }
  };
  if (o.despensa) estado.despensa = o.despensa;
  g.ev('state = mergeDeep(defaultState(), ' + JSON.stringify(estado) + '); estradaResultado = null;');
  g.gravacoes.length = 0;
}

// O vizinho de TESTE (nivelMinimo 14, dá um bem de teste) e o seu bem: só dentro do ambiente simulado.
function injetarVizinhoTeste(g, nivelMinimo) {
  const campo = nivelMinimo === undefined ? '' : 'nivelMinimo: ' + JSON.stringify(nivelMinimo) + ', ';
  g.ev(
    "ESTRADA_BENS.push({ id: 'bem_teste', nome: { pt: 'Bem de Teste', en: 'Test Good', es: 'Bien de Prueba' }, descricao: { pt: 'x', en: 'x', es: 'x' }, fonte: [] });" +
    "ESTRADA_VIZINHOS.push({ id: 'vizinho_teste', " + campo + "nome: { pt: 'Vizinho de Teste', en: 'Test Neighbour', es: 'Vecino de Prueba' }, papel: { pt: 'papel de teste', en: 'test role', es: 'papel de prueba' }," +
    " cara: 'assets/personagens/vizinho_armindo.jpg', caraPendente: false, bem: 'bem_teste'," +
    " falas: [{ id: 'vizinho_teste_1', texto: { pt: 'fala de teste', en: 'test line', es: 'frase de prueba' }, semFacto: true }]," +
    " troca: { texto: { pt: 'troca de teste', en: 'test swap', es: 'trueque de prueba' }, semFacto: true } });" +
    "ESTRADA_PEDIDOS.vizinho_teste = ['sal_sado', 'bagaceira'];");
}
const NOME_TESTE = { pt: 'Vizinho de Teste', en: 'Test Neighbour', es: 'Vecino de Prueba' };
const REAIS = ['dona_amelia', 'sr_joaquim', 'tomas', 'sr_armindo'];

// ---------------------------------------------------------------------
// (0) O jogo de hoje: 4 vizinhos, todos de nível 7, e o vizinho de teste não está no jogo.
// ---------------------------------------------------------------------
{
  const g = abrir();
  ok(JSON.stringify(g.json('ESTRADA_VIZINHOS.map(function (v) { return [v.id, v.nivelMinimo]; })')) === JSON.stringify(REAIS.map(function (id) { return [id, 7]; })), 'os 4 vizinhos de hoje devem ter nivelMinimo 7');
  ok(g.ev('ESTRADA_NIVEL_MINIMO_PADRAO') === 7, 'o nível mínimo por defeito devia ser 7');
  ok(g.ev("ESTRADA_VIZINHOS.some(function (v) { return v.id === 'vizinho_teste'; })") === false && g.ev("ESTRADA_BENS.some(function (b) { return b.id === 'bem_teste'; })") === false, 'o vizinho de teste não devia estar no jogo');
  ok(g.ev('NIVEIS_CONFIG.length') >= 14, 'o teste precisa dos níveis 11 a 14 (dados/niveis.js)');
}

// ---------------------------------------------------------------------
// (a) Um jogador de nível 13 não vê, não pede, não troca e não conta o vizinho de nível 14.
// ---------------------------------------------------------------------
{
  const g = abrir();
  injetarVizinhoTeste(g, 14);
  ok(g.ev('despensaVizinhoNivelMinimo(despensaVizinhoPorId("vizinho_teste"))') === 14, 'o vizinho de teste devia ter nivelMinimo 14');

  jogador(g, { nivel: 13 });
  ok(g.ev('nivelPelaReputacao(state.reputacao)') === 13, 'o jogador devia ser do nível 13');
  ok(g.ev('despensaVizinhoDisponivel(state, despensaVizinhoPorId("vizinho_teste"))') === false, 'nível 13: o vizinho de nível 14 não devia estar disponível');
  REAIS.forEach(function (id) { ok(g.ev('despensaVizinhoDisponivel(state, despensaVizinhoPorId("' + id + '"))') === true, 'nível 13: ' + id + ' devia estar disponível'); });

  // Não aparece.
  LINGUAS.forEach(function (l) {
    const h = g.desenhar(l, D1);
    ok((h.match(/estrada-botao"/g) || []).length === 4, 'nível 13 (' + l + '): o ecrã devia ter só os 4 botões de trocar');
    ok(h.indexOf(esc(NOME_TESTE[l])) === -1 && h.indexOf('vizinho_armindo.jpg') !== -1 && h.indexOf('data-vizinho="vizinho_teste"') === -1, 'nível 13 (' + l + '): o vizinho de nível 14 não devia aparecer no ecrã');
    ok(h.indexOf('Bem de Teste') === -1 && h.indexOf('Test Good') === -1 && h.indexOf('Bien de Prueba') === -1, 'nível 13 (' + l + '): o bem do vizinho de nível 14 não devia aparecer no ecrã');
  });

  // Não pede: nunca sal nem bagaceira, em nenhum dia (sem o estado, o pedido seguiria ESTRADA_PEDIDOS e algum dia seria sal ou bagaceira).
  ok(DIAS.some(function (d) { return g.ev('despensaPedidoDoDia("vizinho_teste", "' + d + '")') !== 'uvas'; }), 'premissa: sem o estado, o vizinho de teste pede sal ou bagaceira em algum dia');
  ok(DIAS.every(function (d) { return g.ev('despensaPedidoDoDia("vizinho_teste", "' + d + '", state)') === 'uvas'; }), 'nível 13: o vizinho de nível 14 não devia pedir sal nem bagaceira em nenhum dia');

  // Não troca, mesmo chamando as funções diretamente, e nada muda.
  const antes = g.ev('JSON.stringify(state)');
  DIAS.slice(0, 5).forEach(function (d) {
    const r = g.json('despensaTrocar(state, "vizinho_teste", "' + d + '")');
    ok(r.ok === false && r.motivo === 'nivel_insuficiente' && r.pagou === null && r.uvasGastas === 0 && r.reputacaoGanha === 0 && r.primeiraVez === false, 'nível 13: despensaTrocar devia recusar com «nivel_insuficiente» sem cobrar nada: ' + JSON.stringify(r));
  });
  // A ordem das recusas: «nivel_insuficiente» vem logo a seguir a «id_invalido», antes de qualquer outra (dia, teto, prateleira).
  const diaMau = g.json('despensaTrocar(state, "vizinho_teste", "xx")');
  ok(diaMau.ok === false && diaMau.motivo === 'nivel_insuficiente', 'nível 13: com um dia inválido a recusa devia ser «nivel_insuficiente» (vem antes de «dia_invalido»): ' + JSON.stringify(diaMau));
  jogador(g, { nivel: 13, despensa: { recebidos: { bem_teste: 3 }, entregues: {}, primeiraTroca: { bem_teste: D1 }, hoje: { dia: D1, feitas: { vizinho_teste: true, dona_amelia: true, sr_joaquim: true, tomas: true } } } });
  const ordem = g.json('despensaTrocar(state, "vizinho_teste", "' + D1 + '")');
  ok(ordem.ok === false && ordem.motivo === 'nivel_insuficiente', 'nível 13: com «ja_hoje», teto e prateleira cheia a recusa devia ser «nivel_insuficiente»: ' + JSON.stringify(ordem));
  jogador(g, { nivel: 13 });
  const reg = g.json('despensaRegistarTroca(state, "vizinho_teste", "bem_teste", "' + D1 + '")');
  ok(reg.ok === false && reg.motivo === 'nivel_insuficiente', 'nível 13: despensaRegistarTroca chamada diretamente devia recusar com «nivel_insuficiente»: ' + JSON.stringify(reg));
  ok(g.ev('JSON.stringify(state)') === antes, 'nível 13: as recusas não deviam alterar nada (nem reparar o estado)');
  // O clique também recusa, sem gravar.
  g.ev('estradaTrocarClique("vizinho_teste")');
  ok(g.ev('JSON.stringify(state)') === antes && g.gravacoes.length === 0, 'nível 13: o clique no vizinho de nível 14 não devia gravar nem alterar nada');

  // Não conta: o teto de 3 trocas por dia (marcas de um vizinho que ainda não existe para o jogador não somam).
  jogador(g, { nivel: 13, despensa: { recebidos: {}, entregues: {}, primeiraTroca: {}, hoje: { dia: D1, feitas: { vizinho_teste: true, dona_amelia: true, sr_joaquim: true } } } });
  const cartao = g.json('estradaEstadoCartao(state, despensaVizinhoPorId("tomas"), "' + D1 + '")');
  const troca = g.json('despensaTrocar(state, "tomas", "' + D1 + '")');
  ok(cartao.motivo === null && troca.ok === true, 'nível 13: a marca do vizinho de nível 14 não devia contar para o teto de 3 por dia (cartão: ' + JSON.stringify(cartao) + '; troca: ' + JSON.stringify(troca) + ')');
  // ... e as dos vizinhos que existem continuam a contar (2 + esta = 3: a 4.ª recusa).
  const quarta = g.json('despensaTrocar(state, "sr_armindo", "' + D1 + '")');
  ok(quarta.ok === false && quarta.motivo === 'teto_dia', 'nível 13: com 3 trocas de vizinhos que existem o teto devia recusar a 4.ª: ' + JSON.stringify(quarta));

  // Não conta: bens, prateleira, oferta às visitas e receitas.
  jogador(g, { nivel: 13, despensa: { recebidos: { bem_teste: 3, queijo_azeitao: 1 }, entregues: {}, primeiraTroca: { bem_teste: D1 }, hoje: { dia: null, feitas: {} } } });
  ok(g.ev('despensaQuantos(state, "bem_teste")') === 0 && g.ev('despensaQuantos(state, "queijo_azeitao")') === 1, 'nível 13: o bem do vizinho de nível 14 devia contar 0 (e o queijo 1)');
  ok(g.ev('despensaBemParaOferecer(state)') === 'queijo_azeitao', 'nível 13: a oferta às visitas não devia escolher o bem do vizinho de nível 14');
  jogador(g, { nivel: 13, despensa: { recebidos: { bem_teste: 3 }, entregues: {}, primeiraTroca: { bem_teste: D1 }, hoje: { dia: null, feitas: {} } } });
  ok(g.ev('despensaBemParaOferecer(state)') === null, 'nível 13: só com o bem do vizinho de nível 14, não há nada para oferecer');
  const antesOferta = g.ev('JSON.stringify(state)');
  const of = g.json('despensaOferecer(state, "' + D1 + '")');
  ok(of.ok === false && of.motivo === 'sem_bens' && g.ev('JSON.stringify(state)') === antesOferta, 'nível 13: oferecer só com esse bem devia recusar («sem_bens») sem alterar nada: ' + JSON.stringify(of));
  const mesa = g.json('despensaMesaVindima(state, "' + D1 + '", { bens: [{ bem: "bem_teste", n: 1 }], reputacao: 5 })');
  ok(mesa.ok === false && mesa.motivo === 'faltam_bens' && g.ev('JSON.stringify(state)') === antesOferta, 'nível 13: uma receita com esse bem devia recusar («faltam_bens») sem alterar nada: ' + JSON.stringify(mesa));
  const entrega = g.json('despensaRegistarEntrega(state, "bem_teste", 1)');
  ok(entrega.ok === false && entrega.motivo === 'sem_stock' && g.ev('JSON.stringify(state)') === antesOferta, 'nível 13: entregar esse bem devia recusar («sem_stock») sem alterar nada: ' + JSON.stringify(entrega));
}

// ---------------------------------------------------------------------
// (b) Ao nível 14 o vizinho aparece, pede, troca e conta.
// ---------------------------------------------------------------------
{
  const g = abrir();
  injetarVizinhoTeste(g, 14);
  jogador(g, { nivel: 14 });
  ok(g.ev('despensaVizinhoDisponivel(state, despensaVizinhoPorId("vizinho_teste"))') === true, 'nível 14: o vizinho de nível 14 devia estar disponível');
  LINGUAS.forEach(function (l) {
    const h = g.desenhar(l, D1);
    ok((h.match(/estrada-botao"/g) || []).length === 5, 'nível 14 (' + l + '): o ecrã devia ter 5 botões de trocar');
    ok(h.indexOf(esc(NOME_TESTE[l])) !== -1 && h.indexOf('data-vizinho="vizinho_teste"') !== -1, 'nível 14 (' + l + '): o vizinho de nível 14 devia aparecer no ecrã');
  });
  const pedidos = DIAS.map(function (d) { return g.ev('despensaPedidoDoDia("vizinho_teste", "' + d + '", state)'); });
  ok(pedidos.indexOf('sal_sado') !== -1 && pedidos.indexOf('bagaceira') !== -1, 'nível 14: o vizinho de nível 14 devia pedir sal e bagaceira em alguns dias');

  // Troca (pelo clique: grava uma vez) e conta.
  g.ev('estradaTrocarClique("vizinho_teste")');
  ok(g.ev('despensaQuantos(state, "bem_teste")') === 1 && g.ev('state.despensa.recebidos.bem_teste') === 1, 'nível 14: a troca devia dar o bem de teste');
  ok(g.ev('state.despensa.hoje.feitas.vizinho_teste') === true && g.gravacoes.length >= 1, 'nível 14: a troca devia ficar registada e gravada');
  ok(g.ev('despensaBemParaOferecer(state)') === 'bem_teste', 'nível 14: o bem do vizinho de nível 14 conta para a oferta às visitas');
  // Conta para o teto: 2 de vizinhos reais + a do vizinho de teste = 3, e a 4.ª recusa.
  ok(g.json('despensaTrocar(state, "dona_amelia", "' + D1 + '")').ok === true && g.json('despensaTrocar(state, "sr_joaquim", "' + D1 + '")').ok === true, 'nível 14: mais 2 trocas no mesmo dia');
  const quarta = g.json('despensaTrocar(state, "tomas", "' + D1 + '")');
  ok(quarta.ok === false && quarta.motivo === 'teto_dia', 'nível 14: a troca do vizinho de nível 14 devia contar para o teto de 3 por dia: ' + JSON.stringify(quarta));
  // Conta para a prateleira (3 de cada bem): com 3 do bem de teste, mais uma não se cobra.
  jogador(g, { nivel: 14, despensa: { recebidos: { bem_teste: 3 }, entregues: {}, primeiraTroca: { bem_teste: DIAS[0] }, hoje: { dia: null, feitas: {} } } });
  const cheia = g.json('despensaTrocar(state, "vizinho_teste", "' + DIAS[1] + '")');
  ok(cheia.ok === false && cheia.motivo === 'prateleira_cheia', 'nível 14: com 3 do bem de teste a prateleira devia estar cheia: ' + JSON.stringify(cheia));
}

// ---------------------------------------------------------------------
// (c) Com os 4 vizinhos de hoje o jogo fica exatamente igual: o mesmo ecrã e a mesma sequência de trocas e ofertas que sem filtro nenhum.
// ---------------------------------------------------------------------
{
  const variantes = [
    { nome: 'jogador novo no nível 7', nivel: 7 }, { nome: 'jogador novo no nível 10', nivel: 10 }, { nome: 'jogador novo no nível 14', nivel: 14 },
    { nome: 'jogador novo no nível 20', nivel: 20 },
    { nome: 'jogador antigo com 0 de Reputação', antigo: true, reputacao: 0 }, { nome: 'jogador antigo com 300 de Reputação', antigo: true, reputacao: 300 },
    { nome: 'jogador antigo no nível 7', antigo: true, nivel: 7 }
  ];
  // Uma sequência de trocas e ofertas em 4 dias, a devolver tudo o que o jogo respondeu (resultados, cartões e estado a cada passo).
  const sequencia = function (g) {
    return g.json(
      '(function () {' +
      ' var passos = []; var dias = ' + JSON.stringify(DIAS.slice(0, 4)) + '; var ids = ' + JSON.stringify(REAIS) + ';' +
      ' dias.forEach(function (dia) {' +
      '   ids.concat(["dona_amelia"]).forEach(function (id) {' +
      '     var cartao = estradaEstadoCartao(state, despensaVizinhoPorId(id), dia);' +
      '     var pedido = despensaPedidoDoDia(despensaVizinhoPorId(id), dia, state);' +
      '     var r = despensaTrocar(state, id, dia);' +
      '     passos.push([cartao, pedido, r, JSON.stringify(state)]);' +
      '   });' +
      '   passos.push([despensaBemParaOferecer(state), despensaOferecer(state, dia), JSON.stringify(state)]);' +
      ' });' +
      ' return passos; })()');
  };
  variantes.forEach(function (v) {
    const real = abrir(), livre = abrir();
    // «livre» é o mesmo jogo sem nenhum filtro de nível (como antes do nivelMinimo).
    livre.ev('despensaVizinhoDisponivel = function () { return true; };');
    jogador(real, v); jogador(livre, v);
    LINGUAS.forEach(function (l) {
      const a = real.desenhar(l, D1), b = livre.desenhar(l, D1);
      ok(a === b && (a.match(/estrada-botao"/g) || []).length === 4, v.nome + ' (' + l + '): o ecrã da Estrada devia ser exatamente o de sempre, com os 4 vizinhos');
    });
    ok(JSON.stringify(sequencia(real)) === JSON.stringify(sequencia(livre)), v.nome + ': a sequência de trocas e ofertas devia dar exatamente o mesmo que sem filtro de nível');
    ok(REAIS.every(function (id) { return real.ev('despensaVizinhoDisponivel(state, despensaVizinhoPorId("' + id + '"))') === true; }), v.nome + ': os 4 vizinhos de hoje deviam estar disponíveis');
  });
  // Um jogador novo abaixo do nível 7 não tem a Estrada (e por isso também não tem os vizinhos).
  const g = abrir();
  jogador(g, { nivel: 6 });
  ok(g.ev("ecraDesbloqueado('estrada')") === false && REAIS.every(function (id) { return g.ev('despensaVizinhoDisponivel(state, despensaVizinhoPorId("' + id + '"))') === false; }), 'um jogador novo no nível 6 não tem a Estrada nem os vizinhos de nível 7');
  jogador(g, { nivel: 7 });
  ok(g.ev("ecraDesbloqueado('estrada')") === true, 'no nível 7 a Estrada abre');
  // Um vizinho de nível mais alto continua fechado a um jogador antigo, que só abre os de origem sem nível.
  const h2 = abrir();
  injetarVizinhoTeste(h2, 14);
  jogador(h2, { antigo: true, nivel: 8 });
  ok(h2.ev('despensaVizinhoDisponivel(state, despensaVizinhoPorId("vizinho_teste"))') === false && h2.ev('despensaVizinhoDisponivel(state, despensaVizinhoPorId("dona_amelia"))') === true, 'um jogador antigo de nível 8 não devia ver o vizinho de nível 14, mas continua a ver os de nível 7');
}

// ---------------------------------------------------------------------
// (d) O campo "nivelMinimo": ausente ou null = 7; um valor que não seja um inteiro >= 1 deixa o vizinho fechado.
// ---------------------------------------------------------------------
{
  const g = abrir();
  const nivelMin = function (literal) { return g.ev('despensaVizinhoNivelMinimo(' + literal + ')'); };
  ok(nivelMin('{ id: "x" }') === 7 && nivelMin('{ id: "x", nivelMinimo: null }') === 7, 'sem o campo (ou null) o nível mínimo devia ser 7');
  ok(nivelMin('{ id: "x", nivelMinimo: 1 }') === 1 && nivelMin('{ id: "x", nivelMinimo: 19 }') === 19, 'um inteiro >= 1 vale por si');
  ['"14"', '0', '-3', '7.5', 'NaN', 'true', '[]', '{}'].forEach(function (lit) {
    ok(nivelMin('{ id: "x", nivelMinimo: ' + lit + ' }') === Infinity, 'o valor ' + lit + ' não é um inteiro >= 1: o vizinho devia ficar fechado');
  });
  ok(nivelMin('null') === Infinity && nivelMin('"texto"') === Infinity, 'sem vizinho válido o nível mínimo é infinito (fechado)');
  // Sem o campo (como um vizinho de hoje antes desta mudança): vale 7, mesmo para quem tem nível muito alto e para um jogador de nível 6.
  const h = abrir();
  injetarVizinhoTeste(h); // sem nivelMinimo
  jogador(h, { nivel: 6 });
  ok(h.ev('despensaVizinhoDisponivel(state, despensaVizinhoPorId("vizinho_teste"))') === false, 'sem o campo, um jogador novo de nível 6 não devia ter o vizinho');
  jogador(h, { nivel: 7 });
  ok(h.ev('despensaVizinhoDisponivel(state, despensaVizinhoPorId("vizinho_teste"))') === true, 'sem o campo, no nível 7 o vizinho devia estar disponível');
  // Um valor inválido deixa-o fechado mesmo para o nível mais alto.
  const i = abrir();
  injetarVizinhoTeste(i, '14');
  jogador(i, { nivel: 20 });
  ok(i.ev('despensaVizinhoDisponivel(state, despensaVizinhoPorId("vizinho_teste"))') === false, 'nivelMinimo "14" (texto) devia deixar o vizinho fechado, mesmo no nível 20');
  ok(i.json('despensaTrocar(state, "vizinho_teste", "' + D1 + '")').motivo === 'nivel_insuficiente', 'nivelMinimo inválido: a troca devia recusar com «nivel_insuficiente»');
}

// ---------------------------------------------------------------------
// (e) O pedido do dia de cada vizinho só depende do dia e do id dele: acrescentar vizinhos não muda os pedidos dos que já existem.
// ---------------------------------------------------------------------
{
  const g = abrir();
  const pedidosDe = function (ids) { return JSON.stringify(ids.map(function (id) { return DIAS.map(function (d) { return g.ev('despensaPedidoDoDia("' + id + '", "' + d + '")'); }); })); };
  const antes = pedidosDe(REAIS);
  injetarVizinhoTeste(g, 14);
  ok(pedidosDe(REAIS) === antes, 'acrescentar um vizinho não devia mudar os pedidos dos que já existem');
  g.ev('ESTRADA_VIZINHOS.reverse();');
  ok(pedidosDe(REAIS) === antes, 'a ordem da lista de vizinhos não devia mudar os pedidos');
  g.ev('ESTRADA_VIZINHOS.reverse();');
  // A conta: o hash de (dia + ":" + id) escolhe da lista de pedidos desse vizinho (js/despensa.js), sem usar mais nada.
  const fonte = fs.readFileSync(path.join(JS_DIR, 'despensa.js'), 'utf8');
  const corpo = /function despensaPedidoDoDia\([^)]*\) \{[\s\S]*?\n\}\n/.exec(fonte);
  ok(corpo && /despensaHash\(dia \+ ':' \+ v\.id\) % lista\.length/.test(corpo[0]) && !/ESTRADA_VIZINHOS/.test(corpo[0]), 'o pedido do dia devia sair só de despensaHash(dia + ":" + id) % lista.length, sem olhar para a lista de vizinhos');
  // Os pedidos de hoje (valores fixos): acrescentar o nivelMinimo não os mexeu.
  const armindo = DIAS.slice(0, 12).map(function (d) { return g.ev('despensaPedidoDoDia("sr_armindo", "' + d + '")'); });
  ok(armindo.every(function (p) { return ['uvas', 'sal_sado', 'bagaceira'].indexOf(p) !== -1; }) && g.ev('JSON.stringify(ESTRADA_PEDIDOS.sr_armindo)') === '["uvas","sal_sado","bagaceira"]', 'os pedidos do Sr. Armindo continuam a ser uvas, sal ou bagaceira');
}

if (falhas) { console.log(falhas + ' falha(s)'); process.exit(1); }
console.log('OK');
