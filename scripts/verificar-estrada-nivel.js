#!/usr/bin/env node
// O NÍVEL MÍNIMO DOS VIZINHOS DA ESTRADA ("nivelMinimo" em js/estrada-dados.js). Um vizinho só existe para o jogador quando o nível
// dele chega a esse mínimo; sem o campo vale 7 (o nível em que a Estrada abre). Os 4 primeiros vizinhos têm 7 e a Dona Natália (pasteleira
// de Azeitão, a torta de Azeitão) tem 14.
//
// Parte 1, com um vizinho de TESTE de nivelMinimo 15 que vive só dentro do ambiente simulado (nunca no jogo), a um jogador de nível 14 e
// a outro de nível 15:
//   (a) abaixo do nível do vizinho: não aparece no ecrã, não pede (nunca sal nem bagaceira), não troca (recusa «nivel_insuficiente»,
//       mesmo chamando a função diretamente, sem alterar NADA) e não conta (teto de trocas por dia, bens, prateleira, oferta às visitas,
//       receitas, e o estado que os critérios dos capítulos leem fica igual);
//   (b) ao nível dele aparece, pede, troca e conta;
//   (c) com os vizinhos de nível 7 o jogo fica exatamente igual abaixo do nível 14 (ecrã em pt, en e es e uma sequência de trocas e
//       ofertas, comparado com o jogo SEM a Dona Natália), e a partir do 14 os cartões dos 4 vizinhos de nível 7 não mudam;
//   (d) o campo: ausente ou null = 7; um valor que não seja um inteiro >= 1 deixa o vizinho fechado;
//   (e) o pedido do dia de cada vizinho só depende do dia e do id dele (acrescentar vizinhos não muda os dos que já existem).
// Parte 2, a Dona Natália (real, nível 14), em pt, en e es:
//   (a) a um jogador de nível 13 não aparece, não pede, não troca e a torta de Azeitão não conta;
//   (b) ao nível 14 aparece, troca (1.ª troca +2 de Reputação, paga como as outras) e a torta conta para a oferta às visitas;
//   (c) estrada_dona_natalia.jpg e vizinha_natalia.jpg existem como JPG e não há nenhum PNG da Dona Natália nem da torta no repositório,
//       nem cópias na raiz;
//   (d) com os 4 vizinhos de nível 7, abaixo do nível 14, o jogo fica exatamente igual (é a prova (c) da parte 1).
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
const REAIS = ['dona_amelia', 'sr_joaquim', 'tomas', 'sr_armindo']; // os 4 vizinhos de nível 7
const NATALIA = 'dona_natalia'; // a Dona Natália, nível 14

// ---------------------------------------------------------------------
// (0) O jogo de hoje: 4 vizinhos de nível 7, a Dona Natália (nível 14), e o vizinho de teste não está no jogo.
// ---------------------------------------------------------------------
{
  const g = abrir();
  ok(JSON.stringify(g.json('ESTRADA_VIZINHOS.map(function (v) { return [v.id, v.nivelMinimo]; })')) === JSON.stringify(REAIS.map(function (id) { return [id, 7]; }).concat([[NATALIA, 14]])), 'os 4 primeiros vizinhos devem ter nivelMinimo 7 e a Dona Natália 14');
  ok(g.ev('ESTRADA_NIVEL_MINIMO_PADRAO') === 7, 'o nível mínimo por defeito devia ser 7');
  ok(g.ev("ESTRADA_VIZINHOS.some(function (v) { return v.id === 'vizinho_teste'; })") === false && g.ev("ESTRADA_BENS.some(function (b) { return b.id === 'bem_teste'; })") === false, 'o vizinho de teste não devia estar no jogo');
  ok(g.ev('NIVEIS_CONFIG.length') >= 14, 'o teste precisa dos níveis 11 a 14 (dados/niveis.js)');
}

// ---------------------------------------------------------------------
// (a) Um jogador de nível 14 não vê, não pede, não troca e não conta o vizinho de teste de nível 15.
// ---------------------------------------------------------------------
{
  const g = abrir();
  injetarVizinhoTeste(g, 15);
  ok(g.ev('despensaVizinhoNivelMinimo(despensaVizinhoPorId("vizinho_teste"))') === 15, 'o vizinho de teste devia ter nivelMinimo 15');

  jogador(g, { nivel: 14 });
  ok(g.ev('nivelPelaReputacao(state.reputacao)') === 14, 'o jogador devia ser do nível 14');
  ok(g.ev('despensaVizinhoDisponivel(state, despensaVizinhoPorId("vizinho_teste"))') === false, 'nível 14: o vizinho de teste de nível 15 não devia estar disponível');
  REAIS.forEach(function (id) { ok(g.ev('despensaVizinhoDisponivel(state, despensaVizinhoPorId("' + id + '"))') === true, 'nível 14: ' + id + ' devia estar disponível'); });

  // Não aparece.
  LINGUAS.forEach(function (l) {
    const h = g.desenhar(l, D1);
    ok((h.match(/estrada-botao"/g) || []).length === 5, 'nível 14 (' + l + '): o ecrã devia ter só os 5 botões de trocar (os 4 de nível 7 e a Dona Natália)');
    ok(h.indexOf(esc(NOME_TESTE[l])) === -1 && h.indexOf('vizinho_armindo.jpg') !== -1 && h.indexOf('data-vizinho="vizinho_teste"') === -1, 'nível 14 (' + l + '): o vizinho de teste de nível 15 não devia aparecer no ecrã');
    ok(h.indexOf('Bem de Teste') === -1 && h.indexOf('Test Good') === -1 && h.indexOf('Bien de Prueba') === -1, 'nível 14 (' + l + '): o bem do vizinho de teste de nível 15 não devia aparecer no ecrã');
  });

  // Não pede: nunca sal nem bagaceira, em nenhum dia (sem o estado, o pedido seguiria ESTRADA_PEDIDOS e algum dia seria sal ou bagaceira).
  ok(DIAS.some(function (d) { return g.ev('despensaPedidoDoDia("vizinho_teste", "' + d + '")') !== 'uvas'; }), 'premissa: sem o estado, o vizinho de teste pede sal ou bagaceira em algum dia');
  ok(DIAS.every(function (d) { return g.ev('despensaPedidoDoDia("vizinho_teste", "' + d + '", state)') === 'uvas'; }), 'nível 14: o vizinho de teste de nível 15 não devia pedir sal nem bagaceira em nenhum dia');

  // Não troca, mesmo chamando as funções diretamente, e nada muda.
  const antes = g.ev('JSON.stringify(state)');
  DIAS.slice(0, 5).forEach(function (d) {
    const r = g.json('despensaTrocar(state, "vizinho_teste", "' + d + '")');
    ok(r.ok === false && r.motivo === 'nivel_insuficiente' && r.pagou === null && r.uvasGastas === 0 && r.reputacaoGanha === 0 && r.primeiraVez === false, 'nível 14: despensaTrocar devia recusar com «nivel_insuficiente» sem cobrar nada: ' + JSON.stringify(r));
  });
  // A ordem das recusas: «nivel_insuficiente» vem logo a seguir a «id_invalido», antes de qualquer outra (dia, teto, prateleira).
  const diaMau = g.json('despensaTrocar(state, "vizinho_teste", "xx")');
  ok(diaMau.ok === false && diaMau.motivo === 'nivel_insuficiente', 'nível 14: com um dia inválido a recusa devia ser «nivel_insuficiente» (vem antes de «dia_invalido»): ' + JSON.stringify(diaMau));
  jogador(g, { nivel: 14, despensa: { recebidos: { bem_teste: 3 }, entregues: {}, primeiraTroca: { bem_teste: D1 }, hoje: { dia: D1, feitas: { vizinho_teste: true, dona_amelia: true, sr_joaquim: true, tomas: true } } } });
  const ordem = g.json('despensaTrocar(state, "vizinho_teste", "' + D1 + '")');
  ok(ordem.ok === false && ordem.motivo === 'nivel_insuficiente', 'nível 14: com «ja_hoje», teto e prateleira cheia a recusa devia ser «nivel_insuficiente»: ' + JSON.stringify(ordem));
  jogador(g, { nivel: 14 });
  const reg = g.json('despensaRegistarTroca(state, "vizinho_teste", "bem_teste", "' + D1 + '")');
  ok(reg.ok === false && reg.motivo === 'nivel_insuficiente', 'nível 14: despensaRegistarTroca chamada diretamente devia recusar com «nivel_insuficiente»: ' + JSON.stringify(reg));
  ok(g.ev('JSON.stringify(state)') === antes, 'nível 14: as recusas não deviam alterar nada (nem reparar o estado)');
  // O clique também recusa, sem gravar.
  g.ev('estradaTrocarClique("vizinho_teste")');
  ok(g.ev('JSON.stringify(state)') === antes && g.gravacoes.length === 0, 'nível 14: o clique no vizinho de teste de nível 15 não devia gravar nem alterar nada');

  // Não conta: o teto de 3 trocas por dia (marcas de um vizinho que ainda não existe para o jogador não somam).
  jogador(g, { nivel: 14, despensa: { recebidos: {}, entregues: {}, primeiraTroca: {}, hoje: { dia: D1, feitas: { vizinho_teste: true, dona_amelia: true, sr_joaquim: true } } } });
  const cartao = g.json('estradaEstadoCartao(state, despensaVizinhoPorId("tomas"), "' + D1 + '")');
  const troca = g.json('despensaTrocar(state, "tomas", "' + D1 + '")');
  ok(cartao.motivo === null && troca.ok === true, 'nível 14: a marca do vizinho de teste de nível 15 não devia contar para o teto de 3 por dia (cartão: ' + JSON.stringify(cartao) + '; troca: ' + JSON.stringify(troca) + ')');
  // ... e as dos vizinhos que existem continuam a contar (2 + esta = 3: a 4.ª recusa).
  const quarta = g.json('despensaTrocar(state, "sr_armindo", "' + D1 + '")');
  ok(quarta.ok === false && quarta.motivo === 'teto_dia', 'nível 14: com 3 trocas de vizinhos que existem o teto devia recusar a 4.ª: ' + JSON.stringify(quarta));

  // Não conta: bens, prateleira, oferta às visitas e receitas.
  jogador(g, { nivel: 14, despensa: { recebidos: { bem_teste: 3, queijo_azeitao: 1 }, entregues: {}, primeiraTroca: { bem_teste: D1 }, hoje: { dia: null, feitas: {} } } });
  ok(g.ev('despensaQuantos(state, "bem_teste")') === 0 && g.ev('despensaQuantos(state, "queijo_azeitao")') === 1, 'nível 14: o bem do vizinho de teste de nível 15 devia contar 0 (e o queijo 1)');
  ok(g.ev('despensaBemParaOferecer(state)') === 'queijo_azeitao', 'nível 14: a oferta às visitas não devia escolher o bem do vizinho de teste de nível 15');
  jogador(g, { nivel: 14, despensa: { recebidos: { bem_teste: 3 }, entregues: {}, primeiraTroca: { bem_teste: D1 }, hoje: { dia: null, feitas: {} } } });
  ok(g.ev('despensaBemParaOferecer(state)') === null, 'nível 14: só com o bem do vizinho de teste de nível 15, não há nada para oferecer');
  const antesOferta = g.ev('JSON.stringify(state)');
  const of = g.json('despensaOferecer(state, "' + D1 + '")');
  ok(of.ok === false && of.motivo === 'sem_bens' && g.ev('JSON.stringify(state)') === antesOferta, 'nível 14: oferecer só com esse bem devia recusar («sem_bens») sem alterar nada: ' + JSON.stringify(of));
  const mesa = g.json('despensaMesaVindima(state, "' + D1 + '", { bens: [{ bem: "bem_teste", n: 1 }], reputacao: 5 })');
  ok(mesa.ok === false && mesa.motivo === 'faltam_bens' && g.ev('JSON.stringify(state)') === antesOferta, 'nível 14: uma receita com esse bem devia recusar («faltam_bens») sem alterar nada: ' + JSON.stringify(mesa));
  const entrega = g.json('despensaRegistarEntrega(state, "bem_teste", 1)');
  ok(entrega.ok === false && entrega.motivo === 'sem_stock' && g.ev('JSON.stringify(state)') === antesOferta, 'nível 14: entregar esse bem devia recusar («sem_stock») sem alterar nada: ' + JSON.stringify(entrega));
}

// ---------------------------------------------------------------------
// (b) Ao nível 15 o vizinho de teste aparece, pede, troca e conta.
// ---------------------------------------------------------------------
{
  const g = abrir();
  injetarVizinhoTeste(g, 15);
  jogador(g, { nivel: 15 });
  ok(g.ev('despensaVizinhoDisponivel(state, despensaVizinhoPorId("vizinho_teste"))') === true, 'nível 15: o vizinho de nível 15 devia estar disponível');
  LINGUAS.forEach(function (l) {
    const h = g.desenhar(l, D1);
    ok((h.match(/estrada-botao"/g) || []).length === 6, 'nível 15 (' + l + '): o ecrã devia ter 6 botões de trocar');
    ok(h.indexOf(esc(NOME_TESTE[l])) !== -1 && h.indexOf('data-vizinho="vizinho_teste"') !== -1, 'nível 15 (' + l + '): o vizinho de nível 15 devia aparecer no ecrã');
  });
  const pedidos = DIAS.map(function (d) { return g.ev('despensaPedidoDoDia("vizinho_teste", "' + d + '", state)'); });
  ok(pedidos.indexOf('sal_sado') !== -1 && pedidos.indexOf('bagaceira') !== -1, 'nível 15: o vizinho de nível 15 devia pedir sal e bagaceira em alguns dias');

  // Troca (pelo clique: grava uma vez) e conta.
  g.ev('estradaTrocarClique("vizinho_teste")');
  ok(g.ev('despensaQuantos(state, "bem_teste")') === 1 && g.ev('state.despensa.recebidos.bem_teste') === 1, 'nível 15: a troca devia dar o bem de teste');
  ok(g.ev('state.despensa.hoje.feitas.vizinho_teste') === true && g.gravacoes.length >= 1, 'nível 15: a troca devia ficar registada e gravada');
  ok(g.ev('despensaBemParaOferecer(state)') === 'bem_teste', 'nível 15: o bem do vizinho de nível 15 conta para a oferta às visitas');
  // Conta para o teto: 2 de vizinhos reais + a do vizinho de teste = 3, e a 4.ª recusa.
  ok(g.json('despensaTrocar(state, "dona_amelia", "' + D1 + '")').ok === true && g.json('despensaTrocar(state, "sr_joaquim", "' + D1 + '")').ok === true, 'nível 15: mais 2 trocas no mesmo dia');
  const quarta = g.json('despensaTrocar(state, "tomas", "' + D1 + '")');
  ok(quarta.ok === false && quarta.motivo === 'teto_dia', 'nível 15: a troca do vizinho de nível 15 devia contar para o teto de 3 por dia: ' + JSON.stringify(quarta));
  // Conta para a prateleira (3 de cada bem): com 3 do bem de teste, mais uma não se cobra.
  jogador(g, { nivel: 15, despensa: { recebidos: { bem_teste: 3 }, entregues: {}, primeiraTroca: { bem_teste: DIAS[0] }, hoje: { dia: null, feitas: {} } } });
  const cheia = g.json('despensaTrocar(state, "vizinho_teste", "' + DIAS[1] + '")');
  ok(cheia.ok === false && cheia.motivo === 'prateleira_cheia', 'nível 15: com 3 do bem de teste a prateleira devia estar cheia: ' + JSON.stringify(cheia));
}

// ---------------------------------------------------------------------
// (c) Abaixo do nível 14 o jogo fica exatamente igual ao de antes da Dona Natália: o mesmo ecrã e a mesma sequência de trocas e ofertas.
// ---------------------------------------------------------------------
{
  // Todos abaixo do nível 14 (a Estrada abre no 7; um jogador antigo abre-a sem nível).
  const variantes = [
    { nome: 'jogador novo no nível 7', nivel: 7 }, { nome: 'jogador novo no nível 10', nivel: 10 }, { nome: 'jogador novo no nível 13', nivel: 13 },
    { nome: 'jogador antigo com 0 de Reputação', antigo: true, reputacao: 0 }, { nome: 'jogador antigo com 300 de Reputação', antigo: true, reputacao: 300 },
    { nome: 'jogador antigo no nível 7', antigo: true, nivel: 7 }, { nome: 'jogador antigo no nível 13', antigo: true, nivel: 13 }
  ];
  // O jogo como era antes da Dona Natália: sem ela nem a torta de Azeitão.
  const semNatalia = function (g) {
    g.ev("ESTRADA_VIZINHOS.splice(ESTRADA_VIZINHOS.findIndex(function (x) { return x.id === 'dona_natalia'; }), 1);" +
         "ESTRADA_BENS.splice(ESTRADA_BENS.findIndex(function (x) { return x.id === 'torta_azeitao'; }), 1);");
  };
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
    const real = abrir(), antes = abrir();
    semNatalia(antes);
    jogador(real, v); jogador(antes, v);
    LINGUAS.forEach(function (l) {
      const a = real.desenhar(l, D1), b = antes.desenhar(l, D1);
      ok(a === b && (a.match(/estrada-botao"/g) || []).length === 4 && a.indexOf('data-vizinho="dona_natalia"') === -1, v.nome + ' (' + l + '): o ecrã da Estrada devia ser exatamente o de sempre, com os 4 vizinhos de nível 7');
    });
    ok(JSON.stringify(sequencia(real)) === JSON.stringify(sequencia(antes)), v.nome + ': a sequência de trocas e ofertas devia dar exatamente o mesmo que sem a Dona Natália');
    ok(REAIS.every(function (id) { return real.ev('despensaVizinhoDisponivel(state, despensaVizinhoPorId("' + id + '"))') === true; }), v.nome + ': os 4 vizinhos de nível 7 deviam estar disponíveis');
    ok(real.ev('despensaVizinhoDisponivel(state, despensaVizinhoPorId("dona_natalia"))') === false, v.nome + ': a Dona Natália (nível 14) não devia estar disponível');
  });
  // A partir do nível 14 há 5 cartões, e os 4 de nível 7 ficam como eram (o cartão da Dona Natália é o único a mais).
  [14, 20].forEach(function (nivel) {
    const real = abrir(), antes = abrir();
    semNatalia(antes);
    jogador(real, { nivel: nivel }); jogador(antes, { nivel: nivel });
    LINGUAS.forEach(function (l) {
      const a = real.desenhar(l, D1), b = antes.desenhar(l, D1);
      const i = a.indexOf('data-vizinho="dona_natalia"');
      const ini = a.lastIndexOf('<div class="estrada-cartao">', i);
      let fim = a.indexOf('<div class="estrada-cartao">', i); if (fim === -1) fim = a.indexOf('<p class="estrada-aviso">', i);
      ok(i !== -1 && (a.match(/estrada-botao"/g) || []).length === 5, 'nível ' + nivel + ' (' + l + '): o ecrã devia ter 5 cartões, com a Dona Natália');
      ok(i !== -1 && a.slice(0, ini) + a.slice(fim) === b, 'nível ' + nivel + ' (' + l + '): sem o cartão da Dona Natália o ecrã devia ser exatamente o de sempre');
    });
  });
  // Um jogador novo abaixo do nível 7 não tem a Estrada (e por isso também não tem os vizinhos).
  const g = abrir();
  jogador(g, { nivel: 6 });
  ok(g.ev("ecraDesbloqueado('estrada')") === false && REAIS.every(function (id) { return g.ev('despensaVizinhoDisponivel(state, despensaVizinhoPorId("' + id + '"))') === false; }), 'um jogador novo no nível 6 não tem a Estrada nem os vizinhos de nível 7');
  jogador(g, { nivel: 7 });
  ok(g.ev("ecraDesbloqueado('estrada')") === true, 'no nível 7 a Estrada abre');
  // Um vizinho de nível mais alto continua fechado a um jogador antigo, que só abre os de origem (nível 7 ou menos).
  const h2 = abrir();
  injetarVizinhoTeste(h2, 15);
  jogador(h2, { antigo: true, nivel: 8 });
  ok(h2.ev('despensaVizinhoDisponivel(state, despensaVizinhoPorId("vizinho_teste"))') === false && h2.ev('despensaVizinhoDisponivel(state, despensaVizinhoPorId("dona_natalia"))') === false && h2.ev('despensaVizinhoDisponivel(state, despensaVizinhoPorId("dona_amelia"))') === true, 'um jogador antigo de nível 8 não devia ver os vizinhos de nível 14 e 15, mas continua a ver os de nível 7');
  jogador(h2, { antigo: true, nivel: 14 });
  ok(h2.ev('despensaVizinhoDisponivel(state, despensaVizinhoPorId("dona_natalia"))') === true, 'um jogador antigo de nível 14 devia ver a Dona Natália');
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
  injetarVizinhoTeste(g, 15);
  ok(pedidosDe(REAIS) === antes, 'acrescentar um vizinho não devia mudar os pedidos dos que já existem');
  g.ev('ESTRADA_VIZINHOS.reverse();');
  ok(pedidosDe(REAIS) === antes, 'a ordem da lista de vizinhos não devia mudar os pedidos');
  g.ev('ESTRADA_VIZINHOS.reverse();');
  // A Dona Natália (sem entrada em ESTRADA_PEDIDOS) pede sempre uvas, com ou sem o estado.
  jogador(g, { nivel: 14 });
  ok(DIAS.every(function (d) { return g.ev('despensaPedidoDoDia("dona_natalia", "' + d + '")') === 'uvas' && g.ev('despensaPedidoDoDia("dona_natalia", "' + d + '", state)') === 'uvas'; }) && g.ev('ESTRADA_PEDIDOS.dona_natalia') === undefined, 'a Dona Natália (sem pedidos) devia pedir sempre uvas');
  // A conta: o hash de (dia + ":" + id) escolhe da lista de pedidos desse vizinho (js/despensa.js), sem usar mais nada.
  const fonte = fs.readFileSync(path.join(JS_DIR, 'despensa.js'), 'utf8');
  const corpo = /function despensaPedidoDoDia\([^)]*\) \{[\s\S]*?\n\}\n/.exec(fonte);
  ok(corpo && /despensaHash\(dia \+ ':' \+ v\.id\) % lista\.length/.test(corpo[0]) && !/ESTRADA_VIZINHOS/.test(corpo[0]), 'o pedido do dia devia sair só de despensaHash(dia + ":" + id) % lista.length, sem olhar para a lista de vizinhos');
  // Os pedidos de hoje (valores fixos): acrescentar o nivelMinimo não os mexeu.
  const armindo = DIAS.slice(0, 12).map(function (d) { return g.ev('despensaPedidoDoDia("sr_armindo", "' + d + '")'); });
  ok(armindo.every(function (p) { return ['uvas', 'sal_sado', 'bagaceira'].indexOf(p) !== -1; }) && g.ev('JSON.stringify(ESTRADA_PEDIDOS.sr_armindo)') === '["uvas","sal_sado","bagaceira"]', 'os pedidos do Sr. Armindo continuam a ser uvas, sal ou bagaceira');
}

// ---------------------------------------------------------------------
// Parte 2. A Dona Natália (pasteleira de Azeitão, nível 14, a torta de Azeitão).
// ---------------------------------------------------------------------
{
  const NOME = { pt: 'Dona Natália', en: 'Dona Natália', es: 'Dona Natália' };
  const PAPEL = { pt: 'pasteleira de Azeitão', en: 'Azeitão pastry cook', es: 'pastelera de Azeitão' };
  const TORTA = { pt: 'Torta de Azeitão', en: 'Azeitão roll cake', es: 'Torta de Azeitão' };
  const SEM_NATALIA = function (h, l) { return h.indexOf(NOME[l]) === -1 && h.indexOf('vizinha_natalia.jpg') === -1 && h.indexOf('data-vizinho="dona_natalia"') === -1 && h.indexOf(esc(PAPEL[l])) === -1; };

  // (a) Um jogador de nível 13 não a vê, não pede, não troca e a torta não conta.
  {
    const g = abrir();
    jogador(g, { nivel: 13 });
    ok(g.ev('nivelPelaReputacao(state.reputacao)') === 13, 'Natália: o jogador devia ser do nível 13');
    ok(g.ev('despensaVizinhoDisponivel(state, despensaVizinhoPorId("dona_natalia"))') === false, 'Natália (nível 13): não devia estar disponível');
    LINGUAS.forEach(function (l) {
      const h = g.desenhar(l, D1);
      ok((h.match(/estrada-botao"/g) || []).length === 4 && SEM_NATALIA(h, l), 'Natália (nível 13, ' + l + '): não devia aparecer no ecrã, que continua com os 4 vizinhos');
      ok(h.indexOf(esc(TORTA[l])) === -1 && h.indexOf('estrada_dona_natalia.jpg') === -1, 'Natália (nível 13, ' + l + '): a torta de Azeitão e a cena dela não deviam aparecer');
    });
    ok(DIAS.every(function (d) { return g.ev('despensaPedidoDoDia("dona_natalia", "' + d + '", state)') === 'uvas'; }), 'Natália (nível 13): não devia pedir sal nem bagaceira');
    const antes = g.ev('JSON.stringify(state)');
    const r = g.json('despensaTrocar(state, "dona_natalia", "' + D1 + '")');
    ok(r.ok === false && r.motivo === 'nivel_insuficiente' && r.bem === 'torta_azeitao' && r.uvasGastas === 0 && r.reputacaoGanha === 0, 'Natália (nível 13): a troca devia recusar com «nivel_insuficiente»: ' + JSON.stringify(r));
    const reg = g.json('despensaRegistarTroca(state, "dona_natalia", "torta_azeitao", "' + D1 + '")');
    ok(reg.ok === false && reg.motivo === 'nivel_insuficiente' && g.ev('JSON.stringify(state)') === antes, 'Natália (nível 13): chamar despensaRegistarTroca diretamente devia recusar sem alterar nada: ' + JSON.stringify(reg));
    g.ev('estradaTrocarClique("dona_natalia")');
    ok(g.ev('JSON.stringify(state)') === antes && g.gravacoes.length === 0, 'Natália (nível 13): o clique não devia gravar nem alterar nada');
    // A torta não conta: bem (0), oferta às visitas, prateleira, receitas e o teto de trocas.
    jogador(g, { nivel: 13, despensa: { recebidos: { torta_azeitao: 3, queijo_azeitao: 1 }, entregues: {}, primeiraTroca: { torta_azeitao: D1 }, hoje: { dia: D1, feitas: { dona_natalia: true, dona_amelia: true, sr_joaquim: true } } } });
    ok(g.ev('despensaQuantos(state, "torta_azeitao")') === 0 && g.ev('despensaQuantos(state, "queijo_azeitao")') === 1, 'Natália (nível 13): a torta devia contar 0 (e o queijo 1)');
    ok(g.ev('despensaBemParaOferecer(state)') === 'queijo_azeitao', 'Natália (nível 13): a oferta às visitas não devia escolher a torta');
    const quarta = g.json('despensaTrocar(state, "tomas", "' + D1 + '")');
    ok(quarta.ok === true, 'Natália (nível 13): a marca dela não devia contar para o teto de 3 trocas por dia: ' + JSON.stringify(quarta));
    jogador(g, { nivel: 13, despensa: { recebidos: { torta_azeitao: 3 }, entregues: {}, primeiraTroca: { torta_azeitao: D1 }, hoje: { dia: null, feitas: {} } } });
    const antesOferta = g.ev('JSON.stringify(state)');
    const of = g.json('despensaOferecer(state, "' + D1 + '")');
    const mesa = g.json('despensaMesaVindima(state, "' + D1 + '", { bens: [{ bem: "torta_azeitao", n: 1 }], reputacao: 5 })');
    ok(of.ok === false && of.motivo === 'sem_bens' && mesa.ok === false && mesa.motivo === 'faltam_bens' && g.ev('JSON.stringify(state)') === antesOferta, 'Natália (nível 13): só com a torta não há nada para oferecer nem para uma receita: ' + JSON.stringify([of, mesa]));
  }

  // (b) Ao nível 14 vê-a, troca (1.ª troca +2 de Reputação, paga como as outras) e a torta conta para a oferta às visitas.
  {
    const g = abrir();
    jogador(g, { nivel: 14 });
    ok(g.ev('despensaVizinhoDisponivel(state, despensaVizinhoPorId("dona_natalia"))') === true, 'Natália (nível 14): devia estar disponível');
    LINGUAS.forEach(function (l) {
      const h = g.desenhar(l, D1);
      ok((h.match(/estrada-botao"/g) || []).length === 5 && h.indexOf(NOME[l]) !== -1 && h.indexOf(esc(PAPEL[l])) !== -1, 'Natália (nível 14, ' + l + '): devia aparecer no ecrã, com o nome e o papel');
      ok(h.indexOf('assets/personagens/vizinha_natalia.jpg') !== -1 && h.indexOf('assets/ecras/estrada_dona_natalia.jpg') !== -1 && h.indexOf('object-position: center 28%') !== -1, 'Natália (nível 14, ' + l + '): devia mostrar a cara e a cena por defeito (y 28%)');
      ok(h.indexOf(esc(TORTA[l])) !== -1, 'Natália (nível 14, ' + l + '): devia mostrar a torta de Azeitão');
    });
    // 1.ª troca com uma garrafa para levar: paga com a garrafa e dá +2 de Reputação.
    const rep0 = g.ev('state.reputacao');
    const r1 = g.json('despensaTrocar(state, "dona_natalia", "' + D1 + '")');
    ok(r1.ok === true && r1.pagou === 'garrafa' && r1.primeiraVez === true && r1.reputacaoGanha === 2 && r1.bem === 'torta_azeitao' && r1.uvasGastas === 0, 'Natália (nível 14): a 1.ª troca devia pagar-se com 1 garrafa e dar +2: ' + JSON.stringify(r1));
    ok(g.ev('state.reputacao') === rep0 + 2 && g.ev('state.despensa.recebidos.torta_azeitao') === 1 && g.ev('despensaQuantos(state, "torta_azeitao")') === 1 && g.ev('state.despensa.garrafasDadas') === 1, 'Natália (nível 14): +2 de Reputação, 1 torta e 1 garrafa dada');
    // Trocas seguintes: 25 uvas e sem Reputação (pede sempre uvas).
    const uvas0 = g.ev('state.uvas'), rep1 = g.ev('state.reputacao');
    const r2 = g.json('despensaTrocar(state, "dona_natalia", "' + DIAS[1] + '")');
    ok(r2.ok === true && r2.pagou === 'uvas' && r2.uvasGastas === 25 && r2.primeiraVez === false && r2.reputacaoGanha === 0 && g.ev('state.uvas') === uvas0 - 25 && g.ev('state.reputacao') === rep1, 'Natália (nível 14): as trocas seguintes pagam-se com 25 uvas, sem Reputação: ' + JSON.stringify(r2));
    // Sem garrafas, a 1.ª troca também se paga com 25 uvas, como as outras.
    jogador(g, { nivel: 14, garrafas: 0, uvas: 100 });
    const r3 = g.json('despensaTrocar(state, "dona_natalia", "' + D1 + '")');
    ok(r3.ok === true && r3.pagou === 'uvas' && r3.uvasGastas === 25 && r3.reputacaoGanha === 2 && g.ev('state.uvas') === 75, 'Natália (nível 14): sem garrafas a 1.ª troca paga-se com 25 uvas e dá +2: ' + JSON.stringify(r3));
    // Pelo clique (grava uma vez) e a torta conta para a oferta às visitas.
    jogador(g, { nivel: 14 });
    g.ev('estradaTrocarClique("dona_natalia")');
    ok(g.ev('state.despensa.recebidos.torta_azeitao') === 1 && g.gravacoes.length >= 1, 'Natália (nível 14): o clique devia trocar e gravar');
    ok(g.ev('despensaBemParaOferecer(state)') === 'torta_azeitao', 'Natália (nível 14): a torta conta para a oferta às visitas (é o único bem)');
    const of = g.json('despensaOferecer(state, "' + D1 + '")');
    ok(of.ok === true && of.bem === 'torta_azeitao' && of.reputacaoGanha === 1 && g.ev('despensaQuantos(state, "torta_azeitao")') === 0 && g.ev('state.despensa.entregues.torta_azeitao') === 1, 'Natália (nível 14): oferecer a torta a uma visita devia dar +1 e gastá-la: ' + JSON.stringify(of));
    // Empate: o bem da lista de empate (choco) vem antes da torta, que está fora dela e vem a seguir.
    jogador(g, { nivel: 14, despensa: { recebidos: { choco_sado: 1, torta_azeitao: 1 }, entregues: {}, primeiraTroca: {}, hoje: { dia: null, feitas: {} } } });
    ok(g.ev('despensaBemParaOferecer(state)') === 'choco_sado', 'oferta: com 1 choco e 1 torta, o empate devia dar o choco (a torta vem a seguir)');
    jogador(g, { nivel: 14, despensa: { recebidos: { choco_sado: 1, torta_azeitao: 2 }, entregues: {}, primeiraTroca: {}, hoje: { dia: null, feitas: {} } } });
    ok(g.ev('despensaBemParaOferecer(state)') === 'torta_azeitao', 'oferta: com mais tortas do que chocos devia oferecer a torta');
    // A oferta às visitas funciona sem frase especial (sem entrada em ESTRADA_OFERTA_FALAS para a torta).
    ok(g.ev('Object.keys(ESTRADA_OFERTA_FALAS).every(function (p) { return ESTRADA_OFERTA_FALAS[p].torta_azeitao === undefined; })') === true, 'a torta de Azeitão não tem frases de oferta (a oferta funciona na mesma)');
  }

  // (c) As imagens: estrada_dona_natalia.jpg e vizinha_natalia.jpg existem como JPG; nenhum PNG da Dona Natália nem da torta; sem cópias na raiz.
  {
    const jpg = function (caminho) {
      const f = path.join(RAIZ, caminho);
      if (!fs.existsSync(f)) return null;
      const b = fs.readFileSync(f);
      if (b.length < 4 || b[0] !== 0xFF || b[1] !== 0xD8 || b[2] !== 0xFF) return { jpg: false };
      // Largura e altura no primeiro bloco SOF (SOF0 a SOF3, SOF5 a SOF7, SOF9 a SOF11, SOF13 a SOF15).
      let i = 2;
      while (i + 9 < b.length) {
        if (b[i] !== 0xFF) { i++; continue; }
        const m = b[i + 1];
        if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) return { jpg: true, altura: b.readUInt16BE(i + 5), largura: b.readUInt16BE(i + 7), kb: b.length / 1024 };
        i += 2 + b.readUInt16BE(i + 2);
      }
      return { jpg: true, kb: b.length / 1024 };
    };
    const cena = jpg('assets/ecras/estrada_dona_natalia.jpg'), cara = jpg('assets/personagens/vizinha_natalia.jpg');
    ok(cena && cena.jpg === true && cena.largura === 640 && cena.altura >= 300 && cena.kb < 250, 'assets/ecras/estrada_dona_natalia.jpg devia existir como JPG (640 de largura, leve): ' + JSON.stringify(cena));
    ok(cara && cara.jpg === true && cara.largura === 128 && cara.altura === 128 && cara.kb < 20, 'assets/personagens/vizinha_natalia.jpg devia existir como JPG de 128x128 (como as dos outros vizinhos): ' + JSON.stringify(cara));
    // Percorre o repositório (sem .git nem node_modules).
    const todos = [];
    const andar = function (dir) {
      fs.readdirSync(dir, { withFileTypes: true }).forEach(function (e) {
        if (e.name === '.git' || e.name === 'node_modules') return;
        const f = path.join(dir, e.name);
        if (e.isDirectory()) andar(f); else todos.push(path.relative(RAIZ, f));
      });
    };
    andar(RAIZ);
    const dela = todos.filter(function (f) { return /natalia|natália|torta|balcao_torta/i.test(path.basename(f)); });
    ok(dela.filter(function (f) { return /\.png$/i.test(f); }).length === 0, 'não devia haver nenhum PNG da Dona Natália nem da torta: ' + dela.filter(function (f) { return /\.png$/i.test(f); }).join(', '));
    ok(dela.filter(function (f) { return f.indexOf(path.sep) === -1; }).length === 0, 'não devia haver cópias da Dona Natália nem da torta na raiz: ' + dela.filter(function (f) { return f.indexOf(path.sep) === -1; }).join(', '));
    ok(dela.slice().sort().join() === ['assets/ecras/estrada_dona_natalia.jpg', 'assets/personagens/vizinha_natalia.jpg'].join(), 'só deviam existir os 2 JPG da Dona Natália (nomes sem acentos): ' + dela.join(', '));
  }
}

if (falhas) { console.log(falhas + ' falha(s)'); process.exit(1); }
console.log('OK');
