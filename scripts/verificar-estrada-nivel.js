#!/usr/bin/env node
// O NÍVEL MÍNIMO DOS VIZINHOS DA ESTRADA ("nivelMinimo" em js/estrada-dados.js). Um vizinho só existe para o jogador quando o nível
// dele chega a esse mínimo; sem o campo vale 7 (o nível em que a Estrada abre). Os 4 primeiros vizinhos têm 7 e a Dona Natália (pasteleira
// de Azeitão, a torta de Azeitão) tem 14.
//
// Parte 1, com um vizinho de TESTE de nivelMinimo 19 que vive só dentro do ambiente simulado (nunca no jogo), a um jogador de nível 18 e
// a outro de nível 19:
//   (a) abaixo do nível do vizinho: não aparece no ecrã, não pede (nunca sal nem bagaceira), não troca (recusa «nivel_insuficiente»,
//       mesmo chamando a função diretamente, sem alterar NADA) e não conta (teto de trocas por dia, bens, prateleira, oferta às visitas,
//       receitas, e o estado que os critérios dos capítulos leem fica igual);
//   (b) ao nível dele aparece, pede, troca e conta;
//   (c) o jogo fica exatamente igual abaixo do nível de cada vizinho real: o ecrã (pt, en e es) e uma sequência de trocas e ofertas, comparados
//       com o jogo SEM os vizinhos de nível mais alto (4 vizinhos abaixo do nível 14, 5 do 14 ao 16, 6 no 17, 7 a partir do 18), e a partir do 18 os
//       cartões dos que já existiam não mudam;
//   (d) o campo: ausente ou null = 7; um valor que não seja um inteiro >= 1 deixa o vizinho fechado;
//   (e) o pedido do dia de cada vizinho só depende do dia e do id dele (acrescentar vizinhos não muda os dos que já existem).
// Partes 2, 3 e 4, a Dona Natália (nível 14, a torta de Azeitão), o Sr. Albano (nível 17, o pinhão de Alcácer) e a Dona Fernanda (nível 18, o arroz
// do Sado), todos reais, em pt, en e es:
//   (a) a um jogador do nível anterior (13, 16 e 17) não aparece, não pede, não troca e o bem dele não conta;
//   (b) ao nível dele aparece (nome, papel, cara, cena por defeito, bem), troca (1.ª troca +2 de Reputação, paga como as outras) e o bem
//       conta para a oferta às visitas;
//   (c) a cena (estrada_<id>.jpg, 640 de largura) e a cara (128x128) existem como JPG, sem nenhum PNG, cópias na raiz, nem nomes com acento ou vírgula;
//   (d) abaixo do nível dele o jogo fica exatamente igual (é a prova (c) da parte 1).
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

// O vizinho de TESTE (com o nivelMinimo que se pedir, dá um bem de teste) e o seu bem: só dentro do ambiente simulado.
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
const ALBANO = 'sr_albano'; // o Sr. Albano, nível 17
const FERNANDA = 'dona_fernanda'; // a Dona Fernanda, nível 18

// ---------------------------------------------------------------------
// (0) O jogo de hoje: 4 vizinhos de nível 7, a Dona Natália (nível 14), o Sr. Albano (nível 17), a Dona Fernanda (nível 18), e o vizinho de teste não está no jogo.
// ---------------------------------------------------------------------
{
  const g = abrir();
  ok(JSON.stringify(g.json('ESTRADA_VIZINHOS.map(function (v) { return [v.id, v.nivelMinimo]; })')) === JSON.stringify(REAIS.map(function (id) { return [id, 7]; }).concat([[NATALIA, 14], [ALBANO, 17], [FERNANDA, 18]])), 'os 4 primeiros vizinhos devem ter nivelMinimo 7, a Dona Natália 14, o Sr. Albano 17 e a Dona Fernanda 18');
  ok(g.ev('ESTRADA_NIVEL_MINIMO_PADRAO') === 7, 'o nível mínimo por defeito devia ser 7');
  ok(g.ev("ESTRADA_VIZINHOS.some(function (v) { return v.id === 'vizinho_teste'; })") === false && g.ev("ESTRADA_BENS.some(function (b) { return b.id === 'bem_teste'; })") === false, 'o vizinho de teste não devia estar no jogo');
  ok(g.ev('NIVEIS_CONFIG.length') >= 14, 'o teste precisa dos níveis 11 a 14 (dados/niveis.js)');
}

// ---------------------------------------------------------------------
// (a) Um jogador de nível 18 não vê, não pede, não troca e não conta o vizinho de teste de nível 19.
// ---------------------------------------------------------------------
{
  const g = abrir();
  injetarVizinhoTeste(g, 19);
  ok(g.ev('despensaVizinhoNivelMinimo(despensaVizinhoPorId("vizinho_teste"))') === 19, 'o vizinho de teste devia ter nivelMinimo 18');

  jogador(g, { nivel: 18 });
  ok(g.ev('nivelPelaReputacao(state.reputacao)') === 18, 'o jogador devia ser do nível 18');
  ok(g.ev('despensaVizinhoDisponivel(state, despensaVizinhoPorId("vizinho_teste"))') === false, 'nível 18: o vizinho de teste de nível 19 não devia estar disponível');
  REAIS.forEach(function (id) { ok(g.ev('despensaVizinhoDisponivel(state, despensaVizinhoPorId("' + id + '"))') === true, 'nível 18: ' + id + ' devia estar disponível'); });

  // Não aparece.
  LINGUAS.forEach(function (l) {
    const h = g.desenhar(l, D1);
    ok((h.match(/estrada-botao"/g) || []).length === 7, 'nível 18 (' + l + '): o ecrã devia ter só os 7 botões de trocar (os 4 de nível 7, a Dona Natália, o Sr. Albano e a Dona Fernanda)');
    ok(h.indexOf(esc(NOME_TESTE[l])) === -1 && h.indexOf('vizinho_armindo.jpg') !== -1 && h.indexOf('data-vizinho="vizinho_teste"') === -1, 'nível 18 (' + l + '): o vizinho de teste de nível 19 não devia aparecer no ecrã');
    ok(h.indexOf('Bem de Teste') === -1 && h.indexOf('Test Good') === -1 && h.indexOf('Bien de Prueba') === -1, 'nível 18 (' + l + '): o bem do vizinho de teste de nível 19 não devia aparecer no ecrã');
  });

  // Não pede: nunca sal nem bagaceira, em nenhum dia (sem o estado, o pedido seguiria ESTRADA_PEDIDOS e algum dia seria sal ou bagaceira).
  ok(DIAS.some(function (d) { return g.ev('despensaPedidoDoDia("vizinho_teste", "' + d + '")') !== 'uvas'; }), 'premissa: sem o estado, o vizinho de teste pede sal ou bagaceira em algum dia');
  ok(DIAS.every(function (d) { return g.ev('despensaPedidoDoDia("vizinho_teste", "' + d + '", state)') === 'uvas'; }), 'nível 18: o vizinho de teste de nível 19 não devia pedir sal nem bagaceira em nenhum dia');

  // Não troca, mesmo chamando as funções diretamente, e nada muda.
  const antes = g.ev('JSON.stringify(state)');
  DIAS.slice(0, 5).forEach(function (d) {
    const r = g.json('despensaTrocar(state, "vizinho_teste", "' + d + '")');
    ok(r.ok === false && r.motivo === 'nivel_insuficiente' && r.pagou === null && r.uvasGastas === 0 && r.reputacaoGanha === 0 && r.primeiraVez === false, 'nível 18: despensaTrocar devia recusar com «nivel_insuficiente» sem cobrar nada: ' + JSON.stringify(r));
  });
  // A ordem das recusas: «nivel_insuficiente» vem logo a seguir a «id_invalido», antes de qualquer outra (dia, teto, prateleira).
  const diaMau = g.json('despensaTrocar(state, "vizinho_teste", "xx")');
  ok(diaMau.ok === false && diaMau.motivo === 'nivel_insuficiente', 'nível 18: com um dia inválido a recusa devia ser «nivel_insuficiente» (vem antes de «dia_invalido»): ' + JSON.stringify(diaMau));
  jogador(g, { nivel: 18, despensa: { recebidos: { bem_teste: 3 }, entregues: {}, primeiraTroca: { bem_teste: D1 }, hoje: { dia: D1, feitas: { vizinho_teste: true, dona_amelia: true, sr_joaquim: true, tomas: true } } } });
  const ordem = g.json('despensaTrocar(state, "vizinho_teste", "' + D1 + '")');
  ok(ordem.ok === false && ordem.motivo === 'nivel_insuficiente', 'nível 18: com «ja_hoje», teto e prateleira cheia a recusa devia ser «nivel_insuficiente»: ' + JSON.stringify(ordem));
  jogador(g, { nivel: 18 });
  const reg = g.json('despensaRegistarTroca(state, "vizinho_teste", "bem_teste", "' + D1 + '")');
  ok(reg.ok === false && reg.motivo === 'nivel_insuficiente', 'nível 18: despensaRegistarTroca chamada diretamente devia recusar com «nivel_insuficiente»: ' + JSON.stringify(reg));
  ok(g.ev('JSON.stringify(state)') === antes, 'nível 18: as recusas não deviam alterar nada (nem reparar o estado)');
  // O clique também recusa, sem gravar.
  g.ev('estradaTrocarClique("vizinho_teste")');
  ok(g.ev('JSON.stringify(state)') === antes && g.gravacoes.length === 0, 'nível 18: o clique no vizinho de teste de nível 19 não devia gravar nem alterar nada');

  // Não conta: o teto de 3 trocas por dia (marcas de um vizinho que ainda não existe para o jogador não somam).
  jogador(g, { nivel: 18, despensa: { recebidos: {}, entregues: {}, primeiraTroca: {}, hoje: { dia: D1, feitas: { vizinho_teste: true, dona_amelia: true, sr_joaquim: true } } } });
  const cartao = g.json('estradaEstadoCartao(state, despensaVizinhoPorId("tomas"), "' + D1 + '")');
  const troca = g.json('despensaTrocar(state, "tomas", "' + D1 + '")');
  ok(cartao.motivo === null && troca.ok === true, 'nível 18: a marca do vizinho de teste de nível 19 não devia contar para o teto de 3 por dia (cartão: ' + JSON.stringify(cartao) + '; troca: ' + JSON.stringify(troca) + ')');
  // ... e as dos vizinhos que existem continuam a contar (2 + esta = 3: a 4.ª recusa).
  const quarta = g.json('despensaTrocar(state, "sr_armindo", "' + D1 + '")');
  ok(quarta.ok === false && quarta.motivo === 'teto_dia', 'nível 18: com 3 trocas de vizinhos que existem o teto devia recusar a 4.ª: ' + JSON.stringify(quarta));

  // Não conta: bens, prateleira, oferta às visitas e receitas.
  jogador(g, { nivel: 18, despensa: { recebidos: { bem_teste: 3, queijo_azeitao: 1 }, entregues: {}, primeiraTroca: { bem_teste: D1 }, hoje: { dia: null, feitas: {} } } });
  ok(g.ev('despensaQuantos(state, "bem_teste")') === 0 && g.ev('despensaQuantos(state, "queijo_azeitao")') === 1, 'nível 18: o bem do vizinho de teste de nível 19 devia contar 0 (e o queijo 1)');
  ok(g.ev('despensaBemParaOferecer(state)') === 'queijo_azeitao', 'nível 18: a oferta às visitas não devia escolher o bem do vizinho de teste de nível 19');
  jogador(g, { nivel: 18, despensa: { recebidos: { bem_teste: 3 }, entregues: {}, primeiraTroca: { bem_teste: D1 }, hoje: { dia: null, feitas: {} } } });
  ok(g.ev('despensaBemParaOferecer(state)') === null, 'nível 18: só com o bem do vizinho de teste de nível 19, não há nada para oferecer');
  const antesOferta = g.ev('JSON.stringify(state)');
  const of = g.json('despensaOferecer(state, "' + D1 + '")');
  ok(of.ok === false && of.motivo === 'sem_bens' && g.ev('JSON.stringify(state)') === antesOferta, 'nível 18: oferecer só com esse bem devia recusar («sem_bens») sem alterar nada: ' + JSON.stringify(of));
  const mesa = g.json('despensaMesaVindima(state, "' + D1 + '", { bens: [{ bem: "bem_teste", n: 1 }], reputacao: 5 })');
  ok(mesa.ok === false && mesa.motivo === 'faltam_bens' && g.ev('JSON.stringify(state)') === antesOferta, 'nível 18: uma receita com esse bem devia recusar («faltam_bens») sem alterar nada: ' + JSON.stringify(mesa));
  const entrega = g.json('despensaRegistarEntrega(state, "bem_teste", 1)');
  ok(entrega.ok === false && entrega.motivo === 'sem_stock' && g.ev('JSON.stringify(state)') === antesOferta, 'nível 18: entregar esse bem devia recusar («sem_stock») sem alterar nada: ' + JSON.stringify(entrega));
}

// ---------------------------------------------------------------------
// (b) Ao nível 19 o vizinho de teste aparece, pede, troca e conta.
// ---------------------------------------------------------------------
{
  const g = abrir();
  injetarVizinhoTeste(g, 19);
  jogador(g, { nivel: 19 });
  ok(g.ev('despensaVizinhoDisponivel(state, despensaVizinhoPorId("vizinho_teste"))') === true, 'nível 19: o vizinho de nível 19 devia estar disponível');
  LINGUAS.forEach(function (l) {
    const h = g.desenhar(l, D1);
    ok((h.match(/estrada-botao"/g) || []).length === 8, 'nível 19 (' + l + '): o ecrã devia ter 8 botões de trocar');
    ok(h.indexOf(esc(NOME_TESTE[l])) !== -1 && h.indexOf('data-vizinho="vizinho_teste"') !== -1, 'nível 19 (' + l + '): o vizinho de nível 19 devia aparecer no ecrã');
  });
  const pedidos = DIAS.map(function (d) { return g.ev('despensaPedidoDoDia("vizinho_teste", "' + d + '", state)'); });
  ok(pedidos.indexOf('sal_sado') !== -1 && pedidos.indexOf('bagaceira') !== -1, 'nível 19: o vizinho de nível 19 devia pedir sal e bagaceira em alguns dias');

  // Troca (pelo clique: grava uma vez) e conta.
  g.ev('estradaTrocarClique("vizinho_teste")');
  ok(g.ev('despensaQuantos(state, "bem_teste")') === 1 && g.ev('state.despensa.recebidos.bem_teste') === 1, 'nível 19: a troca devia dar o bem de teste');
  ok(g.ev('state.despensa.hoje.feitas.vizinho_teste') === true && g.gravacoes.length >= 1, 'nível 19: a troca devia ficar registada e gravada');
  ok(g.ev('despensaBemParaOferecer(state)') === 'bem_teste', 'nível 19: o bem do vizinho de nível 19 conta para a oferta às visitas');
  // Conta para o teto: 2 de vizinhos reais + a do vizinho de teste = 3, e a 4.ª recusa.
  ok(g.json('despensaTrocar(state, "dona_amelia", "' + D1 + '")').ok === true && g.json('despensaTrocar(state, "sr_joaquim", "' + D1 + '")').ok === true, 'nível 19: mais 2 trocas no mesmo dia');
  const quarta = g.json('despensaTrocar(state, "tomas", "' + D1 + '")');
  ok(quarta.ok === false && quarta.motivo === 'teto_dia', 'nível 19: a troca do vizinho de nível 19 devia contar para o teto de 3 por dia: ' + JSON.stringify(quarta));
  // Conta para a prateleira (3 de cada bem): com 3 do bem de teste, mais uma não se cobra.
  jogador(g, { nivel: 19, despensa: { recebidos: { bem_teste: 3 }, entregues: {}, primeiraTroca: { bem_teste: DIAS[0] }, hoje: { dia: null, feitas: {} } } });
  const cheia = g.json('despensaTrocar(state, "vizinho_teste", "' + DIAS[1] + '")');
  ok(cheia.ok === false && cheia.motivo === 'prateleira_cheia', 'nível 19: com 3 do bem de teste a prateleira devia estar cheia: ' + JSON.stringify(cheia));
}

// ---------------------------------------------------------------------
// (c) Abaixo do nível de cada vizinho real o jogo fica exatamente igual: o mesmo ecrã e a mesma sequência de trocas e ofertas.
// ---------------------------------------------------------------------
{
  // O jogo sem alguns vizinhos (e os bens deles): como era antes de existirem.
  const sem = function (g, ids) {
    ids.forEach(function (id) {
      g.ev("var __bem = despensaVizinhoPorId('" + id + "').bem; ESTRADA_VIZINHOS.splice(ESTRADA_VIZINHOS.findIndex(function (x) { return x.id === '" + id + "'; }), 1);" +
           "ESTRADA_BENS.splice(ESTRADA_BENS.findIndex(function (x) { return x.id === __bem; }), 1);");
    });
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
  // Cada grupo: os jogadores, os vizinhos que ainda não existem para eles, e quantos cartões o ecrã deve ter.
  const grupos = [
    { nome: 'abaixo do nível 14', fechados: [NATALIA, ALBANO, FERNANDA], cartoes: 4, jogadores: [
      { nome: 'jogador novo no nível 7', nivel: 7 }, { nome: 'jogador novo no nível 10', nivel: 10 }, { nome: 'jogador novo no nível 13', nivel: 13 },
      { nome: 'jogador antigo com 0 de Reputação', antigo: true, reputacao: 0 }, { nome: 'jogador antigo com 300 de Reputação', antigo: true, reputacao: 300 },
      { nome: 'jogador antigo no nível 7', antigo: true, nivel: 7 }, { nome: 'jogador antigo no nível 13', antigo: true, nivel: 13 } ] },
    { nome: 'do nível 14 ao 16', fechados: [ALBANO, FERNANDA], cartoes: 5, jogadores: [
      { nome: 'jogador novo no nível 14', nivel: 14 }, { nome: 'jogador novo no nível 16', nivel: 16 }, { nome: 'jogador antigo no nível 14', antigo: true, nivel: 14 },
      { nome: 'jogador antigo no nível 16', antigo: true, nivel: 16 } ] },
    { nome: 'no nível 17', fechados: [FERNANDA], cartoes: 6, jogadores: [
      { nome: 'jogador novo no nível 17', nivel: 17 }, { nome: 'jogador antigo no nível 17', antigo: true, nivel: 17 } ] }
  ];
  grupos.forEach(function (grupo) {
    grupo.jogadores.forEach(function (v) {
      const real = abrir(), antes = abrir();
      sem(antes, grupo.fechados);
      jogador(real, v); jogador(antes, v);
      LINGUAS.forEach(function (l) {
        const a = real.desenhar(l, D1), b = antes.desenhar(l, D1);
        ok(a === b && (a.match(/estrada-botao"/g) || []).length === grupo.cartoes && grupo.fechados.every(function (id) { return a.indexOf('data-vizinho="' + id + '"') === -1; }), v.nome + ' (' + l + '): o ecrã da Estrada devia ser exatamente o de sempre, com ' + grupo.cartoes + ' vizinhos');
      });
      ok(JSON.stringify(sequencia(real)) === JSON.stringify(sequencia(antes)), v.nome + ': a sequência de trocas e ofertas devia dar exatamente o mesmo que sem os vizinhos de nível mais alto');
      ok(REAIS.every(function (id) { return real.ev('despensaVizinhoDisponivel(state, despensaVizinhoPorId("' + id + '"))') === true; }), v.nome + ': os 4 vizinhos de nível 7 deviam estar disponíveis');
      grupo.fechados.forEach(function (id) { ok(real.ev('despensaVizinhoDisponivel(state, despensaVizinhoPorId("' + id + '"))') === false, v.nome + ': ' + id + ' não devia estar disponível'); });
    });
  });
  // Do nível 18 em diante há 7 cartões, e os que já existiam ficam como eram (os cartões da Dona Natália, do Sr. Albano e da Dona Fernanda são os únicos a mais).
  [18, 20].forEach(function (nivel) {
    const real = abrir(), antes = abrir();
    sem(antes, [NATALIA, ALBANO, FERNANDA]);
    jogador(real, { nivel: nivel }); jogador(antes, { nivel: nivel });
    LINGUAS.forEach(function (l) {
      const a = real.desenhar(l, D1), b = antes.desenhar(l, D1);
      let html = a;
      [NATALIA, ALBANO, FERNANDA].forEach(function (id) {
        const i = html.indexOf('data-vizinho="' + id + '"');
        const ini = html.lastIndexOf('<div class="estrada-cartao">', i);
        let fim = html.indexOf('<div class="estrada-cartao">', i); if (fim === -1) fim = html.indexOf('<p class="estrada-aviso">', i);
        ok(i !== -1, 'nível ' + nivel + ' (' + l + '): ' + id + ' devia aparecer');
        if (i !== -1) html = html.slice(0, ini) + html.slice(fim);
      });
      ok((a.match(/estrada-botao"/g) || []).length === 7, 'nível ' + nivel + ' (' + l + '): o ecrã devia ter 7 cartões');
      ok(html === b, 'nível ' + nivel + ' (' + l + '): sem os cartões da Dona Natália, do Sr. Albano e da Dona Fernanda o ecrã devia ser exatamente o de sempre');
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
  injetarVizinhoTeste(h2, 19);
  const disp = function (id) { return h2.ev('despensaVizinhoDisponivel(state, despensaVizinhoPorId("' + id + '"))'); };
  jogador(h2, { antigo: true, nivel: 8 });
  ok(disp('vizinho_teste') === false && disp(NATALIA) === false && disp(ALBANO) === false && disp(FERNANDA) === false && disp('dona_amelia') === true, 'um jogador antigo de nível 8 não devia ver os vizinhos de nível 14, 17, 18 e 19, mas continua a ver os de nível 7');
  jogador(h2, { antigo: true, nivel: 14 });
  ok(disp(NATALIA) === true && disp(ALBANO) === false, 'um jogador antigo de nível 14 devia ver a Dona Natália, mas não o Sr. Albano');
  jogador(h2, { antigo: true, nivel: 17 });
  ok(disp(ALBANO) === true && disp(FERNANDA) === false, 'um jogador antigo de nível 17 devia ver o Sr. Albano, mas não a Dona Fernanda');
  jogador(h2, { antigo: true, nivel: 18 });
  ok(disp(FERNANDA) === true && disp('vizinho_teste') === false, 'um jogador antigo de nível 18 devia ver a Dona Fernanda');
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
  injetarVizinhoTeste(g, 19);
  ok(pedidosDe(REAIS) === antes, 'acrescentar um vizinho não devia mudar os pedidos dos que já existem');
  g.ev('ESTRADA_VIZINHOS.reverse();');
  ok(pedidosDe(REAIS) === antes, 'a ordem da lista de vizinhos não devia mudar os pedidos');
  g.ev('ESTRADA_VIZINHOS.reverse();');
  // A Dona Natália, o Sr. Albano e a Dona Fernanda (sem entrada em ESTRADA_PEDIDOS) pedem sempre uvas, com ou sem o estado.
  jogador(g, { nivel: 20 });
  [NATALIA, ALBANO, FERNANDA].forEach(function (id) {
    ok(DIAS.every(function (d) { return g.ev('despensaPedidoDoDia("' + id + '", "' + d + '")') === 'uvas' && g.ev('despensaPedidoDoDia("' + id + '", "' + d + '", state)') === 'uvas'; }) && g.ev('ESTRADA_PEDIDOS.' + id) === undefined, id + ' (sem pedidos) devia pedir sempre uvas');
  });
  // A conta: o hash de (dia + ":" + id) escolhe da lista de pedidos desse vizinho (js/despensa.js), sem usar mais nada.
  const fonte = fs.readFileSync(path.join(JS_DIR, 'despensa.js'), 'utf8');
  const corpo = /function despensaPedidoDoDia\([^)]*\) \{[\s\S]*?\n\}\n/.exec(fonte);
  ok(corpo && /despensaHash\(dia \+ ':' \+ v\.id\) % lista\.length/.test(corpo[0]) && !/ESTRADA_VIZINHOS/.test(corpo[0]), 'o pedido do dia devia sair só de despensaHash(dia + ":" + id) % lista.length, sem olhar para a lista de vizinhos');
  // Os pedidos de hoje (valores fixos): acrescentar o nivelMinimo não os mexeu.
  const armindo = DIAS.slice(0, 12).map(function (d) { return g.ev('despensaPedidoDoDia("sr_armindo", "' + d + '")'); });
  ok(armindo.every(function (p) { return ['uvas', 'sal_sado', 'bagaceira'].indexOf(p) !== -1; }) && g.ev('JSON.stringify(ESTRADA_PEDIDOS.sr_armindo)') === '["uvas","sal_sado","bagaceira"]', 'os pedidos do Sr. Armindo continuam a ser uvas, sal ou bagaceira');
}

// ---------------------------------------------------------------------
// Partes 2, 3 e 4. Os vizinhos reais de nível mais alto: a Dona Natália (nível 14, a torta de Azeitão), o Sr. Albano (nível 17, o pinhão de Alcácer) e a Dona Fernanda (nível 18, o arroz do Sado).
// ---------------------------------------------------------------------
function provasDoVizinho(c) {
  const SEM = function (h, l) { return h.indexOf(c.nome[l]) === -1 && h.indexOf(path.basename(c.cara)) === -1 && h.indexOf('data-vizinho="' + c.id + '"') === -1 && h.indexOf(esc(c.papel[l])) === -1; };
  const abaixo = c.nivel - 1;

  // (a) Um jogador do nível anterior não o vê, não pede, não troca e o bem dele não conta.
  {
    const g = abrir();
    jogador(g, { nivel: abaixo });
    ok(g.ev('nivelPelaReputacao(state.reputacao)') === abaixo, c.etiqueta + ': o jogador devia ser do nível ' + abaixo);
    ok(g.ev('despensaVizinhoDisponivel(state, despensaVizinhoPorId("' + c.id + '"))') === false, c.etiqueta + ' (nível ' + abaixo + '): não devia estar disponível');
    LINGUAS.forEach(function (l) {
      const h = g.desenhar(l, D1);
      ok((h.match(/estrada-botao"/g) || []).length === c.botoesAbaixo && SEM(h, l), c.etiqueta + ' (nível ' + abaixo + ', ' + l + '): não devia aparecer no ecrã, que devia ter ' + c.botoesAbaixo + ' vizinhos');
      ok(h.indexOf(esc(c.bemNome[l])) === -1 && h.indexOf(path.basename(c.cena)) === -1, c.etiqueta + ' (nível ' + abaixo + ', ' + l + '): o bem e a cena dele não deviam aparecer');
    });
    ok(DIAS.every(function (d) { return g.ev('despensaPedidoDoDia("' + c.id + '", "' + d + '", state)') === 'uvas'; }), c.etiqueta + ' (nível ' + abaixo + '): não devia pedir sal nem bagaceira');
    const antes = g.ev('JSON.stringify(state)');
    const r = g.json('despensaTrocar(state, "' + c.id + '", "' + D1 + '")');
    ok(r.ok === false && r.motivo === 'nivel_insuficiente' && r.bem === c.bemId && r.uvasGastas === 0 && r.reputacaoGanha === 0, c.etiqueta + ' (nível ' + abaixo + '): a troca devia recusar com «nivel_insuficiente»: ' + JSON.stringify(r));
    const reg = g.json('despensaRegistarTroca(state, "' + c.id + '", "' + c.bemId + '", "' + D1 + '")');
    ok(reg.ok === false && reg.motivo === 'nivel_insuficiente' && g.ev('JSON.stringify(state)') === antes, c.etiqueta + ' (nível ' + abaixo + '): chamar despensaRegistarTroca diretamente devia recusar sem alterar nada: ' + JSON.stringify(reg));
    g.ev('estradaTrocarClique("' + c.id + '")');
    ok(g.ev('JSON.stringify(state)') === antes && g.gravacoes.length === 0, c.etiqueta + ' (nível ' + abaixo + '): o clique não devia gravar nem alterar nada');
    // O bem não conta: quantidade (0), oferta às visitas, receitas e o teto de trocas por dia.
    const feitas = {}; feitas[c.id] = true; feitas.dona_amelia = true; feitas.sr_joaquim = true;
    const rec = {}; rec[c.bemId] = 3; rec.queijo_azeitao = 1; const prim = {}; prim[c.bemId] = D1;
    jogador(g, { nivel: abaixo, despensa: { recebidos: rec, entregues: {}, primeiraTroca: prim, hoje: { dia: D1, feitas: feitas } } });
    ok(g.ev('despensaQuantos(state, "' + c.bemId + '")') === 0 && g.ev('despensaQuantos(state, "queijo_azeitao")') === 1, c.etiqueta + ' (nível ' + abaixo + '): o bem dele devia contar 0 (e o queijo 1)');
    ok(g.ev('despensaBemParaOferecer(state)') === 'queijo_azeitao', c.etiqueta + ' (nível ' + abaixo + '): a oferta às visitas não devia escolher o bem dele');
    const quarta = g.json('despensaTrocar(state, "tomas", "' + D1 + '")');
    ok(quarta.ok === true, c.etiqueta + ' (nível ' + abaixo + '): a marca dele não devia contar para o teto de 3 trocas por dia: ' + JSON.stringify(quarta));
    const so = {}; so[c.bemId] = 3;
    jogador(g, { nivel: abaixo, despensa: { recebidos: so, entregues: {}, primeiraTroca: prim, hoje: { dia: null, feitas: {} } } });
    const antesOferta = g.ev('JSON.stringify(state)');
    const of = g.json('despensaOferecer(state, "' + D1 + '")');
    const mesa = g.json('despensaMesaVindima(state, "' + D1 + '", { bens: [{ bem: "' + c.bemId + '", n: 1 }], reputacao: 5 })');
    ok(of.ok === false && of.motivo === 'sem_bens' && mesa.ok === false && mesa.motivo === 'faltam_bens' && g.ev('JSON.stringify(state)') === antesOferta, c.etiqueta + ' (nível ' + abaixo + '): só com o bem dele não há nada para oferecer nem para uma receita: ' + JSON.stringify([of, mesa]));
  }

  // (b) Ao nível dele vê-o, troca (1.ª troca +2 de Reputação, paga como as outras) e o bem conta para a oferta às visitas.
  {
    const g = abrir();
    jogador(g, { nivel: c.nivel });
    ok(g.ev('despensaVizinhoDisponivel(state, despensaVizinhoPorId("' + c.id + '"))') === true, c.etiqueta + ' (nível ' + c.nivel + '): devia estar disponível');
    LINGUAS.forEach(function (l) {
      const h = g.desenhar(l, D1);
      ok((h.match(/estrada-botao"/g) || []).length === c.botoesNoNivel && h.indexOf(c.nome[l]) !== -1 && h.indexOf(esc(c.papel[l])) !== -1, c.etiqueta + ' (nível ' + c.nivel + ', ' + l + '): devia aparecer no ecrã (' + c.botoesNoNivel + ' vizinhos), com o nome e o papel');
      ok(h.indexOf(c.cara) !== -1 && h.indexOf(c.cena) !== -1 && h.indexOf('object-position: center 28%') !== -1, c.etiqueta + ' (nível ' + c.nivel + ', ' + l + '): devia mostrar a cara e a cena por defeito (y 28%)');
      ok(h.indexOf(esc(c.bemNome[l])) !== -1, c.etiqueta + ' (nível ' + c.nivel + ', ' + l + '): devia mostrar o bem dele');
    });
    // 1.ª troca com uma garrafa para levar: paga com a garrafa e dá +2 de Reputação.
    const rep0 = g.ev('state.reputacao');
    const r1 = g.json('despensaTrocar(state, "' + c.id + '", "' + D1 + '")');
    ok(r1.ok === true && r1.pagou === 'garrafa' && r1.primeiraVez === true && r1.reputacaoGanha === 2 && r1.bem === c.bemId && r1.uvasGastas === 0, c.etiqueta + ': a 1.ª troca devia pagar-se com 1 garrafa e dar +2: ' + JSON.stringify(r1));
    ok(g.ev('state.reputacao') === rep0 + 2 && g.ev('state.despensa.recebidos.' + c.bemId) === 1 && g.ev('despensaQuantos(state, "' + c.bemId + '")') === 1 && g.ev('state.despensa.garrafasDadas') === 1, c.etiqueta + ': +2 de Reputação, 1 unidade do bem e 1 garrafa dada');
    // Trocas seguintes: 25 uvas e sem Reputação (pede sempre uvas).
    const uvas0 = g.ev('state.uvas'), rep1 = g.ev('state.reputacao');
    const r2 = g.json('despensaTrocar(state, "' + c.id + '", "' + DIAS[1] + '")');
    ok(r2.ok === true && r2.pagou === 'uvas' && r2.uvasGastas === 25 && r2.primeiraVez === false && r2.reputacaoGanha === 0 && g.ev('state.uvas') === uvas0 - 25 && g.ev('state.reputacao') === rep1, c.etiqueta + ': as trocas seguintes pagam-se com 25 uvas, sem Reputação: ' + JSON.stringify(r2));
    // Sem garrafas, a 1.ª troca também se paga com 25 uvas, como as outras.
    jogador(g, { nivel: c.nivel, garrafas: 0, uvas: 100 });
    const r3 = g.json('despensaTrocar(state, "' + c.id + '", "' + D1 + '")');
    ok(r3.ok === true && r3.pagou === 'uvas' && r3.uvasGastas === 25 && r3.reputacaoGanha === 2 && g.ev('state.uvas') === 75, c.etiqueta + ': sem garrafas a 1.ª troca paga-se com 25 uvas e dá +2: ' + JSON.stringify(r3));
    // Pelo clique (grava uma vez) e o bem conta para a oferta às visitas.
    jogador(g, { nivel: c.nivel });
    g.ev('estradaTrocarClique("' + c.id + '")');
    ok(g.ev('state.despensa.recebidos.' + c.bemId) === 1 && g.gravacoes.length >= 1, c.etiqueta + ': o clique devia trocar e gravar');
    ok(g.ev('despensaBemParaOferecer(state)') === c.bemId, c.etiqueta + ': o bem conta para a oferta às visitas (é o único)');
    const of = g.json('despensaOferecer(state, "' + D1 + '")');
    ok(of.ok === true && of.bem === c.bemId && of.reputacaoGanha === 1 && g.ev('despensaQuantos(state, "' + c.bemId + '")') === 0 && g.ev('state.despensa.entregues.' + c.bemId) === 1, c.etiqueta + ': oferecer o bem a uma visita devia dar +1 e gastá-lo: ' + JSON.stringify(of));
    // Empate: o bem da lista de empate (choco) vem antes; o dele, fora da lista, vem a seguir.
    const e1 = { choco_sado: 1 }; e1[c.bemId] = 1; const e2 = { choco_sado: 1 }; e2[c.bemId] = 2;
    jogador(g, { nivel: c.nivel, despensa: { recebidos: e1, entregues: {}, primeiraTroca: {}, hoje: { dia: null, feitas: {} } } });
    ok(g.ev('despensaBemParaOferecer(state)') === 'choco_sado', 'oferta: com 1 choco e 1 ' + c.bemId + ', o empate devia dar o choco (o bem dele vem a seguir)');
    jogador(g, { nivel: c.nivel, despensa: { recebidos: e2, entregues: {}, primeiraTroca: {}, hoje: { dia: null, feitas: {} } } });
    ok(g.ev('despensaBemParaOferecer(state)') === c.bemId, 'oferta: com mais unidades de ' + c.bemId + ' do que de choco devia oferecer o dele');
    // A oferta às visitas funciona sem frase especial (sem entrada em ESTRADA_OFERTA_FALAS para este bem).
    ok(g.ev('Object.keys(ESTRADA_OFERTA_FALAS).every(function (p) { return ESTRADA_OFERTA_FALAS[p].' + c.bemId + ' === undefined; })') === true, c.bemId + ' não tem frases de oferta (a oferta funciona na mesma)');
  }

  // (c) As imagens: a cena e a cara existem como JPG; nenhum PNG; sem cópias na raiz; sem acentos nem vírgulas nos nomes.
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
    const cena = jpg(c.cena), cara = jpg(c.cara);
    ok(cena && cena.jpg === true && cena.largura === 640 && cena.altura >= 300 && cena.kb < 250, c.cena + ' devia existir como JPG (640 de largura, leve): ' + JSON.stringify(cena));
    ok(cara && cara.jpg === true && cara.largura === 128 && cara.altura === 128 && cara.kb < 20, c.cara + ' devia existir como JPG de 128x128 (como as dos outros vizinhos): ' + JSON.stringify(cara));
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
    const dele = todos.filter(function (f) { return c.ficheirosRegex.test(path.basename(f)); });
    ok(dele.filter(function (f) { return /\.png$/i.test(f); }).length === 0, c.etiqueta + ': não devia haver nenhum PNG dele nem do bem: ' + dele.filter(function (f) { return /\.png$/i.test(f); }).join(', '));
    ok(dele.filter(function (f) { return f.indexOf(path.sep) === -1; }).length === 0, c.etiqueta + ': não devia haver cópias dele nem do bem na raiz: ' + dele.filter(function (f) { return f.indexOf(path.sep) === -1; }).join(', '));
    ok(dele.slice().sort().join() === [c.cena, c.cara].sort().join(), c.etiqueta + ': só deviam existir os 2 JPG dele (nomes sem acentos nem vírgulas): ' + dele.join(', '));
    ok(todos.filter(function (f) { return /,/.test(path.basename(f)); }).length === 0, 'nenhum ficheiro do repositório devia ter vírgula no nome: ' + todos.filter(function (f) { return /,/.test(path.basename(f)); }).join(', '));
  }
}

provasDoVizinho({
  etiqueta: 'Natália', id: NATALIA, nivel: 14, botoesAbaixo: 4, botoesNoNivel: 5, bemId: 'torta_azeitao',
  nome: { pt: 'Dona Natália', en: 'Dona Natália', es: 'Dona Natália' },
  papel: { pt: 'pasteleira de Azeitão', en: 'Azeitão pastry cook', es: 'pastelera de Azeitão' },
  bemNome: { pt: 'Torta de Azeitão', en: 'Azeitão roll cake', es: 'Torta de Azeitão' },
  cara: 'assets/personagens/vizinha_natalia.jpg', cena: 'assets/ecras/estrada_dona_natalia.jpg', ficheirosRegex: /natalia|natália|torta|balcao_torta/i
});
provasDoVizinho({
  etiqueta: 'Albano', id: ALBANO, nivel: 17, botoesAbaixo: 5, botoesNoNivel: 6, bemId: 'pinhao_alcacer',
  nome: { pt: 'Sr. Albano', en: 'Mr. Albano', es: 'Sr. Albano' },
  papel: { pt: 'apanhador de pinha de Alcácer', en: 'Alcácer pine cone picker', es: 'recolector de piñas de Alcácer' },
  bemNome: { pt: 'Pinhão de Alcácer', en: 'Alcácer pine nuts', es: 'Piñones de Alcácer' },
  cara: 'assets/personagens/vizinho_albano.jpg', cena: 'assets/ecras/estrada_sr_albano.jpg', ficheirosRegex: /albano|pinhal|pinhao|pinhão|pinha/i
});
provasDoVizinho({
  etiqueta: 'Fernanda', id: FERNANDA, nivel: 18, botoesAbaixo: 6, botoesNoNivel: 7, bemId: 'arroz_sado',
  nome: { pt: 'Dona Fernanda', en: 'Dona Fernanda', es: 'Dona Fernanda' },
  papel: { pt: 'arrozeira da Comporta', en: 'Comporta rice farmer', es: 'arrocera de la Comporta' },
  bemNome: { pt: 'Arroz Carolino do Sado', en: 'Sado carolino rice', es: 'Arroz carolino del Sado' },
  cara: 'assets/personagens/vizinha_fernanda.jpg', cena: 'assets/ecras/estrada_dona_fernanda.jpg',
  // Só os ficheiros dela e do bem (não apanha yoshi_nos_arrozais.jpg, a imagem do nível 18, nem as arrozal_*.jpg de imagens_JOGO_TELEGRAM).
  ficheirosRegex: /fernanda|arrozal_da_comporta|arroz_sado/i
});

if (falhas) { console.log(falhas + ' falha(s)'); process.exit(1); }
console.log('OK');
