#!/usr/bin/env node
// Regras e contas das trocas da Estrada (PR 5A): despensaTrocar, despensaPedidoDoDia e
// despensaGarrafasDisponiveis em js/despensa.js, com as regras de js/estrada-dados.js. Corre o
// state.js, niveis.js, garrafa.js, capitulos.js, conquistas.js, estrada-dados.js e despensa.js REAIS num
// ambiente simulado (vm), sem browser nem conta real. Nada é gravado.
//
// Depois de passar com o código real, o script ESTRAGA as regras de propósito (mutantes) e confirma que
// cada estrago faz falhar pelo menos uma verificação: se um mutante passar, o script falha.
//
// Uso: node scripts/verificar-trocas.js
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const ler = function (f) { return fs.readFileSync(path.join(RAIZ, f), 'utf8'); };
const SRC_DESPENSA = ler('js/despensa.js');
const SRC_DADOS = ler('js/estrada-dados.js');

const J = function (o) { return JSON.stringify(o); };
const clone = function (o) { return JSON.parse(JSON.stringify(o)); };

// Corre todas as verificações com estas versões dos ficheiros; devolve a lista de falhas.
function correrTestes(srcDespensa, srcDados) {
  const falhas = [];
  const ok = function (cond, msg) { if (!cond) falhas.push(msg); };

  // Jogo simulado: state.js e os outros REAIS (e stubs só do que vive noutros ficheiros).
  const guardado = {};
  const sb = {
    console: { log() {}, warn() {}, error() {} },
    localStorage: {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(guardado, k) ? guardado[k] : null; },
      setItem: function (k, v) { guardado[k] = String(v); },
      removeItem: function (k) { delete guardado[k]; }
    },
    location: { search: '' }, URLSearchParams: URLSearchParams,
    document: { querySelectorAll: function () { return []; }, getElementById: function () { return null; }, addEventListener: function () {} },
    setTimeout: function () {}, Image: function () {}, Date: Date
  };
  sb.window = sb;
  sb.addEventListener = function () {};
  sb.Telegram = { WebApp: {} };
  const cx = vm.createContext(sb);
  const correr = function (codigo, nome) { return vm.runInContext(codigo, cx, { filename: nome }); };
  correr(ler('js/state.js'), 'state.js');
  correr(`
    function t(k) { return k; }
    var FALAS = [];
    function mostrarFalas(f, quem) { FALAS.push({ f: f, quem: quem }); }
    function vibrar() {} function tocarSom() {} function updateStatsDisplays() {}
    function estacaoAtual() { return 'inverno'; }
    function localeAtual() { return 'pt-PT'; }
    function marcarObjetivoCumprido() {}
    function desbloquearEntradaEnciclopedia() { return null; }
    function formatarTempoVinha() { return ''; } function randInt(a) { return a; }
    var DIAS_FORCADOS = 0;
    var currentLang = 'pt';
  `, 'stubs');
  ['niveis.js', 'garrafa.js', 'capitulos.js', 'conquistas.js'].forEach(function (f) { correr(ler('js/' + f), f); });
  correr(srcDados, 'estrada-dados.js');
  correr(srcDespensa, 'despensa.js');
  correr('renderAdega = function () {}', 'stub2');

  // Ferramentas.
  const trocar = function (estado, viz, dia) { cx.__e = estado; cx.__v = viz; cx.__d = dia; return clone(correr('despensaTrocar(__e, __v, __d)', 't')); };
  const pedido = function (viz, dia) { cx.__v = viz; cx.__d = dia; return correr('despensaPedidoDoDia(typeof __v === "string" ? despensaVizinhoPorId(__v) : __v, __d)', 'p'); };
  const disponiveis = function (estado) { cx.__e = estado; return correr('despensaGarrafasDisponiveis(__e)', 'd'); };
  const quantos = function (estado, bem) { cx.__e = estado; cx.__b = bem; return correr('despensaQuantos(__e, __b)', 'q'); };
  const base = function (extra) {
    return Object.assign({
      uvas: 100, reputacao: 0, garrafas: 0, gotas: 7,
      adega: { historico: [{ data: 'x', estacao: 'inverno', diasDescanso: 2 }] },
      despensa: { recebidos: {}, entregues: {}, primeiraTroca: {}, hoje: { dia: null, feitas: {} } }
    }, extra || {});
  };
  const D1 = '2026-10-08', D2 = '2026-10-09', D3 = '2026-10-10', D4 = '2026-10-11';
  const AM = 'dona_amelia', JO = 'sr_joaquim', TO = 'tomas';
  const BEM = { dona_amelia: 'queijo_azeitao', sr_joaquim: 'sal_sado', tomas: 'mel_sesimbra' };
  const diasDe = function (n) { const r = []; for (let i = 0; i < n; i++) { r.push(new Date(Date.UTC(2026, 9, 8 + i)).toISOString().slice(0, 10)); } return r; };
  // Recusa: o motivo certo e NADA alterado.
  const recusada = function (nome, estado, viz, dia, motivo) {
    const antes = J(estado);
    const r = trocar(estado, viz, dia);
    ok(r.ok === false && r.motivo === motivo, nome + ': devia recusar com "' + motivo + '": ' + J(r));
    ok(J(estado) === antes, nome + ': recusar não devia alterar nada');
    ok(r.pagou === null && r.uvasGastas === 0 && r.reputacaoGanha === 0 && r.primeiraVez === false, nome + ': a recusa não paga nem dá nada: ' + J(r));
  };

  // 0. Regras e campo novo.
  ok(correr('ESTRADA_TROCA.custoUvas', 'x') === 25 && correr('ESTRADA_TROCA.uvasMinimasDepoisDaTroca', 'x') === 10 &&
    correr('ESTRADA_TROCA.prateleiraMaxima', 'x') === 3 && correr('ESTRADA_TROCA.trocasPorDiaTeto', 'x') === 3 && correr('ESTRADA_TROCA.reputacaoPrimeiraTroca', 'x') === 2,
    'regras: 25 uvas, piso 10, prateleira 3, teto 3, +2');
  ok(correr('Object.prototype.hasOwnProperty.call(defaultState().despensa, "garrafasDadas")', 'x') === false, 'state.js não devia ter garrafasDadas (o campo em falta conta 0)');
  ok(disponiveis(base({ garrafas: 3 })) === 3, 'save sem garrafasDadas: todas as garrafas estão disponíveis');
  ok(disponiveis(base({ garrafas: 3, despensa: { garrafasDadas: 2 } })) === 1, '3 garrafas e 2 dadas: 1 disponível');
  ok(disponiveis(base({ garrafas: 1, despensa: { garrafasDadas: 5 } })) === 0, 'garrafas disponíveis nunca abaixo de 0');
  [undefined, null, -3, 1.5, 'x', NaN].forEach(function (g) {
    ok(disponiveis(base({ garrafas: 2, despensa: { garrafasDadas: g } })) === 2, 'garrafasDadas inválido (' + String(g) + ') conta 0');
    ok(disponiveis(base({ garrafas: g })) === 0, 'garrafas inválido (' + String(g) + ') conta 0');
  });
  ok(disponiveis(null) === 0 && disponiveis(undefined) === 0 && disponiveis({}) === 0, 'estado vazio: 0 garrafas disponíveis');
  { const e = base({ garrafas: 4 }); const a = J(e); disponiveis(e); ok(J(e) === a, 'despensaGarrafasDisponiveis só lê'); }

  // 1. Prova com garrafa: gasta a garrafa disponível, nunca state.garrafas nem o historico.
  {
    const e = base({ garrafas: 2, uvas: 100 });
    const r = trocar(e, AM, D1);
    ok(r.ok === true && r.pagou === 'garrafa' && r.uvasGastas === 0 && r.bem === 'queijo_azeitao' && r.reputacaoGanha === 2 && r.primeiraVez === true, 'prova com garrafa: ' + J(r));
    ok(e.garrafas === 2 && J(e.adega) === J(base().adega), 'a prova NÃO devia mexer em state.garrafas nem no historico');
    ok(e.despensa.garrafasDadas === 1 && disponiveis(e) === 1, 'a prova sobe garrafasDadas para 1 (disponíveis 1)');
    ok(e.uvas === 100 && e.gotas === 7, 'a prova com garrafa não gasta uvas nem gotas');
    ok(e.reputacao === 2, '+2 de Reputação na prova');
    ok(quantos(e, 'queijo_azeitao') === 1 && e.despensa.primeiraTroca.queijo_azeitao === D1 && e.despensa.hoje.dia === D1 && e.despensa.hoje.feitas[AM] === true, 'bem recebido, primeiraTroca e hoje registados');
    // Sem mais garrafas, a próxima prova paga em uvas.
    trocar(e, JO, D1);
    ok(disponiveis(e) === 0 && e.despensa.garrafasDadas === 2, 'a 2.ª prova gasta a 2.ª garrafa');
    const r3 = trocar(e, TO, D1);
    ok(r3.pagou === 'uvas' && r3.uvasGastas === 25 && e.uvas === 75, 'sem garrafas disponíveis a prova paga 25 uvas: ' + J(r3));
  }

  // 2. Prova sem garrafa: 25 uvas (nunca fica encravado).
  {
    const e = base({ garrafas: 0, uvas: 60 });
    const r = trocar(e, JO, D1);
    ok(r.ok && r.pagou === 'uvas' && r.uvasGastas === 25 && e.uvas === 35 && r.reputacaoGanha === 2 && e.reputacao === 2 && r.primeiraVez, 'prova sem garrafa: 25 uvas e +2: ' + J(r));
    ok(e.despensa.garrafasDadas === undefined, 'pagar em uvas não cria garrafasDadas');
  }

  // 3. Piso de 10: 34 recusa, 35 aceita (e fica com 10).
  {
    const e34 = base({ uvas: 34 });
    recusada('piso (34 uvas)', e34, AM, D1, 'faltam_uvas');
    ok(e34.uvas === 34, '34 uvas ficam 34');
    const e35 = base({ uvas: 35 });
    const r = trocar(e35, AM, D1);
    ok(r.ok && r.pagou === 'uvas' && e35.uvas === 10, '35 uvas aceita e fica com 10: ' + J(r));
    // A prova com garrafa não tem piso (não gasta uvas).
    const g0 = base({ uvas: 0, garrafas: 1 });
    ok(trocar(g0, AM, D1).ok === true && g0.uvas === 0, 'a prova com garrafa funciona mesmo com 0 uvas');
    // Troca repetida: também tem piso.
    const rep = base({ uvas: 34, despensa: { recebidos: { queijo_azeitao: 1 }, primeiraTroca: { queijo_azeitao: D1 }, hoje: { dia: D1, feitas: { [AM]: true } } } });
    recusada('piso (repetida, 34)', rep, AM, D2, 'faltam_uvas');
    // Uvas inválidas contam 0.
    [undefined, null, 'x', NaN, -5].forEach(function (u) { recusada('uvas ' + String(u), base({ uvas: u }), AM, D1, 'faltam_uvas'); });
  }

  // 4. 1 por vizinho por dia; clique duplo.
  {
    const e = base({ uvas: 200 });
    ok(trocar(e, AM, D1).ok, 'a 1.ª troca do dia');
    recusada('1 por vizinho', e, AM, D1, 'ja_hoje');
    // Outro vizinho, mesmo dia: pode.
    ok(trocar(e, JO, D1).ok, 'outro vizinho no mesmo dia pode');
    // Novo dia: volta a poder.
    ok(trocar(e, AM, D2).ok, 'no dia seguinte volta a poder trocar com o mesmo vizinho');
    // Clique duplo: a 2.ª tentativa é recusada e o estado fica igual ao da 1.ª.
    const c = base({ uvas: 200, garrafas: 1 });
    const r1 = trocar(c, TO, D1);
    const depois1 = J(c);
    const r2 = trocar(c, TO, D1);
    ok(r1.ok === true && r2.ok === false && r2.motivo === 'ja_hoje' && J(c) === depois1, 'clique duplo: a 2.ª tentativa é recusada e o estado fica igual');
  }

  // 5. Teto de 3 por dia (com um 4.º vizinho de teste).
  {
    correr(`
      ESTRADA_BENS.push({ id: 'bem_teste', nome: { pt: 'x', en: 'x', es: 'x' }, descricao: { pt: 'x', en: 'x', es: 'x' }, fonte: ['zimbramel'] });
      ESTRADA_VIZINHOS.push({ id: 'vizinho_teste', nome: { pt: 'x', en: 'x', es: 'x' }, papel: { pt: 'x', en: 'x', es: 'x' }, cara: 'x', caraPendente: true, bem: 'bem_teste', falas: [], troca: { texto: { pt: 'x', en: 'x', es: 'x' }, semFacto: true } });
    `, 'vizinho_teste');
    const e = base({ uvas: 500 });
    ok(trocar(e, AM, D1).ok && trocar(e, JO, D1).ok && trocar(e, TO, D1).ok, 'as 3 primeiras trocas do dia');
    recusada('teto de 3 (4.º vizinho)', e, 'vizinho_teste', D1, 'teto_dia');
    ok(quantos(e, 'bem_teste') === 0, 'a recusa por teto não dá o bem');
    // No dia seguinte o teto repõe-se.
    ok(trocar(e, 'vizinho_teste', D2).ok, 'no dia seguinte o teto repõe-se');
    // A ordem: com o teto atingido e a prateleira também cheia, o motivo é o teto (vem primeiro).
    const f = base({ uvas: 500, despensa: { recebidos: { bem_teste: 3 }, primeiraTroca: { bem_teste: D1 }, hoje: { dia: D1, feitas: { [AM]: true, [JO]: true, [TO]: true } } } });
    recusada('teto antes da prateleira', f, 'vizinho_teste', D1, 'teto_dia');
  }

  // 6. Dia anterior ao último registado.
  {
    const e = base({ uvas: 300 });
    ok(trocar(e, AM, D2).ok, 'troca no dia 2');
    recusada('dia anterior (hoje.dia)', e, JO, D1, 'dia_anterior');
    recusada('dia anterior, mesmo vizinho', e, AM, D1, 'dia_anterior');
    ok(trocar(e, JO, D2).ok === true, 'o próprio dia registado continua a aceitar trocas');
    ok(trocar(e, TO, D3).ok === true, 'um dia posterior aceita');
    // A data da primeiraTroca também conta, mesmo que hoje esteja desatualizado.
    const p = base({ despensa: { recebidos: { queijo_azeitao: 1 }, primeiraTroca: { queijo_azeitao: D3 }, hoje: { dia: null, feitas: {} } } });
    recusada('dia anterior (primeiraTroca)', p, JO, D2, 'dia_anterior');
    // Sem trocas anteriores, qualquer dia válido serve.
    ok(trocar(base({ uvas: 100 }), AM, '2020-01-01').ok === true, 'sem trocas anteriores aceita qualquer dia válido');
  }

  // 7. +2 só na 1.ª vez de cada bem, e total +6.
  {
    const e = base({ uvas: 2000 });
    const dias = diasDe(10);
    let rep = 0, trocas = 0;
    dias.forEach(function (d, i) {
      [AM, JO, TO].forEach(function (v) {
        const antes = e.reputacao;
        const r = trocar(e, v, d);
        if (r.ok) { trocas++; rep += r.reputacaoGanha; ok(e.reputacao - antes === r.reputacaoGanha, 'a Reputação sobe exatamente o que a troca diz'); }
        else {
          ok(r.motivo === 'prateleira_cheia', 'neste cenário só a prateleira cheia recusa: ' + J(r));
          ok(e.reputacao - antes === 0, 'recusar não dá Reputação');
        }
      });
      // Esvazia a prateleira de vez em quando para haver mais trocas repetidas (entregar não mexe na Reputação).
      if (i % 3 === 2) [ 'queijo_azeitao', 'sal_sado', 'mel_sesimbra' ].forEach(function (b) { cx.__e = e; cx.__b = b; correr('despensaRegistarEntrega(__e, __b, despensaQuantos(__e, __b))', 'e'); });
    });
    ok(e.reputacao === 6 && rep === 6, 'Reputação extra total devia ser +6 (2 x 3 bens): ' + e.reputacao);
    ok(trocas > 9, 'houve trocas repetidas (' + trocas + ') e nenhuma deu Reputação');
    ok(Object.keys(e.despensa.primeiraTroca).length === 3, '3 bens com primeiraTroca');
    // Repetida: sem Reputação e paga 25.
    const f = base({ uvas: 100 });
    trocar(f, AM, D1);
    const uv = f.uvas, rp = f.reputacao;
    const r = trocar(f, AM, D2);
    ok(r.ok && r.primeiraVez === false && r.reputacaoGanha === 0 && f.reputacao === rp && f.uvas === uv - 25 && r.pagou === 'uvas', 'repetida: sem Reputação, 25 uvas: ' + J(r));
  }

  // 8. Prateleira cheia: recusa sem cobrar, sem Reputação e sem gastar a troca do dia.
  {
    const e = base({ uvas: 500, garrafas: 3 });
    const dias = diasDe(4);
    trocar(e, AM, dias[0]); trocar(e, AM, dias[1]); trocar(e, AM, dias[2]);
    ok(quantos(e, 'queijo_azeitao') === 3, 'premissa: 3 queijos');
    recusada('prateleira cheia', e, AM, dias[3], 'prateleira_cheia');
    ok(e.despensa.hoje.dia === dias[2] && !Object.prototype.hasOwnProperty.call(e.despensa.hoje.feitas, 'tomas'), 'a recusa não gasta a troca do dia (hoje fica no último dia registado)');
    // Depois de entregar 1, volta a poder trocar nesse mesmo dia (a recusa não gastou a troca).
    cx.__e = e; correr('despensaRegistarEntrega(__e, "queijo_azeitao", 1)', 'e');
    const r = trocar(e, AM, dias[3]);
    ok(r.ok === true && quantos(e, 'queijo_azeitao') === 3, 'com espaço na prateleira, a troca do mesmo dia funciona');
    // Prova com garrafa também não cobra a garrafa com a prateleira cheia: bem com 3 e sem primeiraTroca.
    const f = base({ garrafas: 1, uvas: 200, despensa: { recebidos: { sal_sado: 3 }, hoje: { dia: null, feitas: {} } } });
    recusada('prateleira cheia na prova', f, JO, D1, 'prateleira_cheia');
    ok(f.despensa.garrafasDadas === undefined && f.garrafas === 1, 'a prova recusada não gasta a garrafa');
  }

  // 9. Pedido do sal (só em trocas repetidas).
  {
    const dias = diasDe(120);
    const diaSal = dias.filter(function (d) { return pedido(AM, d) === 'sal_sado'; });
    const diaUvas = dias.filter(function (d) { return pedido(AM, d) === 'uvas'; });
    ok(diaSal.length > 20 && diaUvas.length > 20, 'a Dona Amélia pede sal e uvas em dias diferentes (' + diaSal.length + ' / ' + diaUvas.length + ')');
    ok(dias.every(function (d) { return pedido(AM, d) === 'uvas' || pedido(AM, d) === 'sal_sado'; }), 'a Dona Amélia só pede uvas ou sal');
    ok(dias.every(function (d) { return pedido(JO, d) === 'uvas' && pedido(TO, d) === 'uvas'; }), 'o Sr. Joaquim e o Tomás pedem sempre uvas');
    ok(pedido('nao_existe', D1) === 'uvas' && pedido(null, D1) === 'uvas' && pedido(AM, 'hoje') === 'uvas' && pedido(AM, undefined) === 'uvas', 'pedido inválido: uvas');
    const rep = function (extra) { return base(Object.assign({ uvas: 100, despensa: { recebidos: { queijo_azeitao: 1 }, primeiraTroca: { queijo_azeitao: '2026-01-01' }, hoje: { dia: null, feitas: {} } } }, extra || {})); };
    // Pede sal e tem 1 sal: paga com sal, não gasta uvas.
    const comSal = rep({ despensa: { recebidos: { queijo_azeitao: 1, sal_sado: 2 }, entregues: { sal_sado: 1 }, primeiraTroca: { queijo_azeitao: '2026-01-01', sal_sado: '2026-01-01' }, hoje: { dia: null, feitas: {} } } });
    const r = trocar(comSal, AM, diaSal[0]);
    ok(r.ok && r.pagou === 'sal' && r.uvasGastas === 0 && comSal.uvas === 100, 'pede sal e tem sal: paga com 1 sal e não gasta uvas: ' + J(r));
    ok(quantos(comSal, 'sal_sado') === 0 && comSal.despensa.entregues.sal_sado === 2, 'o sal sai da Despensa (entregues sobe)');
    ok(r.reputacaoGanha === 0 && comSal.reputacao === 0, 'a troca repetida com sal não dá Reputação');
    // Pede sal e não tem sal: paga as 25 uvas.
    const semSal = rep();
    const r2 = trocar(semSal, AM, diaSal[0]);
    ok(r2.ok && r2.pagou === 'uvas' && r2.uvasGastas === 25 && semSal.uvas === 75, 'pede sal e não tem: paga 25 uvas: ' + J(r2));
    // Pede uvas e tem sal: paga uvas e guarda o sal.
    const tem = rep({ despensa: { recebidos: { queijo_azeitao: 1, sal_sado: 1 }, primeiraTroca: { queijo_azeitao: '2026-01-01', sal_sado: '2026-01-01' }, hoje: { dia: null, feitas: {} } } });
    const r3 = trocar(tem, AM, diaUvas[0]);
    ok(r3.ok && r3.pagou === 'uvas' && quantos(tem, 'sal_sado') === 1, 'pede uvas: paga uvas e guarda o sal');
    // Pede sal, tem sal mas a 1.ª troca de queijo é a prova: não usa o sal.
    const prova = base({ uvas: 100, despensa: { recebidos: { sal_sado: 1 }, primeiraTroca: { sal_sado: '2026-01-01' }, hoje: { dia: null, feitas: {} } } });
    const r4 = trocar(prova, AM, diaSal[0]);
    ok(r4.ok && r4.primeiraVez && r4.pagou === 'uvas' && quantos(prova, 'sal_sado') === 1, 'na prova o pedido do sal não conta: ' + J(r4));
    // Pedido sem uvas suficientes e sem sal: recusa.
    recusada('pede sal, sem sal nem uvas', rep({ uvas: 20 }), AM, diaSal[0], 'faltam_uvas');
    // Com sal, o piso das uvas não conta (não gasta uvas).
    const pobre = rep({ uvas: 0, despensa: { recebidos: { queijo_azeitao: 1, sal_sado: 1 }, primeiraTroca: { queijo_azeitao: '2026-01-01', sal_sado: '2026-01-01' }, hoje: { dia: null, feitas: {} } } });
    ok(trocar(pobre, AM, diaSal[0]).pagou === 'sal', 'com sal pedido paga-se mesmo sem uvas');
  }

  // 10. Pedido do dia: igual nas 3 línguas, estável no dia e a mudar ao longo dos dias.
  {
    const dias = diasDe(60);
    const porLingua = ['pt', 'en', 'es'].map(function (l) { correr('currentLang = ' + J(l), 'l'); return dias.map(function (d) { return pedido(AM, d); }).join(); });
    correr("currentLang = 'pt'", 'l');
    ok(porLingua[0] === porLingua[1] && porLingua[1] === porLingua[2], 'o pedido do dia devia ser igual nas 3 línguas');
    ok(pedido(AM, D1) === pedido(AM, D1), 'o pedido é o mesmo o dia todo');
    ok(new Set(dias.map(function (d) { return pedido(AM, d); })).size === 2, 'o pedido muda ao longo dos dias');
    let mudancas = 0; for (let i = 1; i < dias.length; i++) if (pedido(AM, dias[i]) !== pedido(AM, dias[i - 1])) mudancas++;
    ok(mudancas >= 10, 'o pedido troca várias vezes em 60 dias (' + mudancas + ')');
  }

  // 11. Ordem das validações (o 1.º que falhar é o motivo) e recusas sem alterar nada.
  {
    recusada('estado inválido', null, AM, D1, 'estado_invalido');
    ok(trocar('x', AM, D1).motivo === 'estado_invalido' && trocar(undefined, AM, D1).motivo === 'estado_invalido', 'estado que não é objeto');
    recusada('id inválido', base(), 'ninguem', D1, 'id_invalido');
    recusada('id inválido antes do dia inválido', base(), 'ninguem', 'ontem', 'id_invalido');
    recusada('id __proto__', base(), '__proto__', D1, 'id_invalido');
    ['ontem', '2026-1-1', '', null, undefined, 20261008, '2026-10-08T10:00'].forEach(function (d) { recusada('dia inválido ' + String(d), base(), AM, d, 'dia_invalido'); });
    // dia_anterior antes de ja_hoje, ja_hoje antes de teto, teto antes de prateleira, prateleira antes de faltam_uvas.
    const hojeD2 = { dia: D2, feitas: { [AM]: true, [JO]: true, [TO]: true } };
    recusada('dia anterior antes de já hoje', base({ despensa: { hoje: hojeD2, recebidos: {}, primeiraTroca: {} } }), AM, D1, 'dia_anterior');
    recusada('já hoje antes do teto', base({ despensa: { hoje: hojeD2, recebidos: {}, primeiraTroca: {} } }), AM, D2, 'ja_hoje');
    recusada('prateleira antes das uvas', base({ uvas: 0, despensa: { recebidos: { queijo_azeitao: 3 }, primeiraTroca: { queijo_azeitao: D1 }, hoje: { dia: null, feitas: {} } } }), AM, D2, 'prateleira_cheia');
    // Recusar não repara o estado: uma despensa estranha fica tal como está.
    const estranho = base({ uvas: 5 }); estranho.despensa = { recebidos: { queijo_azeitao: -2 }, hoje: 'x' };
    recusada('despensa estranha', estranho, AM, D1, 'faltam_uvas');
    const nula = base({ uvas: 5 }); nula.despensa = null;
    recusada('despensa nula', nula, AM, D1, 'faltam_uvas');
    // Com uma despensa estranha mas válida para trocar, a troca repara e funciona.
    const reparar = base({ uvas: 100 }); reparar.despensa = null;
    ok(trocar(reparar, AM, D1).ok && reparar.despensa.recebidos.queijo_azeitao === 1, 'com a despensa nula a troca repara o estado e funciona');
  }

  // 12. Capítulo 7: 3 bens diferentes cumprem; 3 trocas ao mesmo vizinho não.
  {
    correr('state = mergeDeep(defaultState(), { uvas: 1000, acesso: { jogadorAntigo: true } });', 's');
    const lido = function () { return JSON.parse(correr('JSON.stringify(capitulosLerCriterio(CAPITULOS_CONFIG[6]))', 'c')); };
    ok(lido().atual === 0 && correr('capituloEstaCumprido(CAPITULOS_CONFIG[6])', 'c') === false, 'sem trocas o cap7 não se cumpre');
    [D1, D2, D3].forEach(function (d) { cx.__d = d; correr('despensaTrocar(state, "dona_amelia", __d)', 't'); });
    ok(correr('state.despensa.recebidos.queijo_azeitao', 'c') === 3 && lido().atual === 1 && lido().cumprido === false && correr('capituloEstaCumprido(CAPITULOS_CONFIG[6])', 'c') === false, '3 trocas ao mesmo vizinho NÃO cumprem o cap7: ' + J(lido()));
    cx.__d = D3; correr('despensaTrocar(state, "sr_joaquim", __d)', 't');
    ok(lido().atual === 2 && lido().cumprido === false, '2 bens: 2 / 3');
    cx.__d = D3; correr('despensaTrocar(state, "tomas", __d)', 't');
    ok(lido().atual === 3 && lido().cumprido === true && correr('capituloEstaCumprido(CAPITULOS_CONFIG[6])', 'c') === true, '3 bens diferentes cumprem o cap7: ' + J(lido()));
    // Prateleira cheia ou entregar não tira o capítulo.
    correr('despensaRegistarEntrega(state, "queijo_azeitao", 3)', 'e');
    ok(lido().cumprido === true, 'entregar tudo não descumpre o cap7');
    // Um 4.º bem (só em memória, neste teste) não substitui o mel: queijo + sal + bem de teste não cumpre.
    correr('state = mergeDeep(defaultState(), { uvas: 1000, acesso: { jogadorAntigo: true }, despensa: { recebidos: { queijo_azeitao: 1, sal_sado: 1, bem_teste: 1 } } });', 's4');
    ok(lido().atual === 2 && lido().cumprido === false && correr('capituloEstaCumprido(CAPITULOS_CONFIG[6])', 'c') === false, 'queijo + sal + 4.º bem NÃO cumprem o cap7: ' + J(lido()));
    correr('state.despensa.recebidos.mel_sesimbra = 1;', 's5');
    ok(lido().atual === 3 && lido().cumprido === true, 'com o mel também cumpre');
  }

  // 13. Conquistas, A Coleção, As Garrafas e capítulos 5 e 6 não mudam depois de uma prova.
  {
    const historico = [
      { data: 'x', estacao: 'inverno', diasDescanso: 1 }, { data: 'x', estacao: 'primavera', diasDescanso: 2 },
      { data: 'x', estacao: 'verao', diasDescanso: 3 }, { data: 'x', estacao: 'outono', diasDescanso: 4 },
      { data: 'x', estacao: 'inverno', diasDescanso: 0, festa: 'saomartinho' }
    ];
    correr('state = mergeDeep(defaultState(), ' + J({
      uvas: 100, reputacao: 700, garrafas: 12, acesso: { jogadorAntigo: true }, niveis: { nivelMostrado: 6, garrafasAoNivel6: 0 },
      adega: { historico: historico, bagaco: 4, aguardente: 1 }
    }) + ');', 's');
    const foto = function () {
      return J(JSON.parse(correr(`JSON.stringify({
        garrafas: state.garrafas, historico: state.adega.historico, ultimaGarrafaData: state.ultimaGarrafaData,
        conquistas: CONQUISTAS_CONFIG.filter(function (c) { return c.id !== 'boa_vizinhanca'; }).map(function (c) { return [c.id, c.cumprida()]; }),
        colecao: contarColecao(), cores: colecaoCoresFeitas(state), nCores: colecaoResumo(),
        maisDescansou: garrafaQueMaisDescansou(), linhas: typeof garrafasLinhas === 'function' ? garrafasLinhas() : null,
        cap5: capitulosLerCriterio(CAPITULOS_CONFIG[4]), cap6: capitulosLerCriterio(CAPITULOS_CONFIG[5]),
        cap5ok: capituloEstaCumprido(CAPITULOS_CONFIG[4]), cap6ok: capituloEstaCumprido(CAPITULOS_CONFIG[5]),
        adega: { bagaco: state.adega.bagaco, aguardente: state.adega.aguardente }
      })`, 'f')));
    };
    const antes = foto();
    ok(correr('state.garrafas', 'g') === 12, 'premissa: 12 garrafas');
    cx.__d = D1;
    const r = clone(correr('despensaTrocar(state, "dona_amelia", __d)', 't'));
    ok(r.ok && r.pagou === 'garrafa', 'a prova com garrafa foi feita: ' + J(r));
    ok(foto() === antes, 'conquistas de garrafas, A Coleção, As Garrafas, Cave de Reserva e capítulos 5 e 6 ficam IGUAIS depois de uma prova');
    ok(correr('state.garrafas', 'g') === 12 && correr('state.despensa.garrafasDadas', 'g') === 1, 'state.garrafas 12 e garrafasDadas 1');
    // Dar as 3 garrafas das provas também não mexe em nada disto.
    cx.__d = D2; correr('despensaTrocar(state, "sr_joaquim", __d)', 't'); correr('despensaTrocar(state, "tomas", __d)', 't');
    ok(foto() === antes && correr('state.despensa.garrafasDadas', 'g') === 3, 'depois das 3 provas tudo continua igual (garrafasDadas 3)');
  }

  // 14. Pureza: sem relógio nem sorteio, sem gravar, sem tocar no que não deve (código sem comentários).
  {
    const puro = vm.createContext({});
    vm.runInContext('Math.random = function () { throw new Error("Math.random proibido"); }; Date.now = function () { throw new Error("Date.now proibido"); };', puro);
    vm.runInContext(srcDados, puro, { filename: 'estrada-dados.js' });
    vm.runInContext(srcDespensa, puro, { filename: 'despensa.js' });
    let erro = null;
    try {
      puro.__e = base({ uvas: 100, garrafas: 1 });
      vm.runInContext('despensaTrocar(__e, "dona_amelia", "2026-10-08"); despensaTrocar(__e, "dona_amelia", "2026-10-09"); despensaPedidoDoDia("dona_amelia", "2026-10-08"); despensaGarrafasDisponiveis(__e);', puro);
    } catch (e) { erro = e.message; }
    ok(erro === null, 'as trocas não podem usar Math.random nem Date.now: ' + erro);
    const codigo = srcDespensa.replace(/\/\/.*$/gm, '');
    ok(!/saveState|localStorage|nuvem|marcarObjetivo|historico|gotas|Math\.random|Date\.now|new Date/.test(codigo), 'despensa.js não devia gravar, usar a nuvem, objetivos, o historico, gotas nem relógio');
    ok(!/state\./.test(codigo), 'despensa.js só trabalha sobre o estado recebido por argumento (nunca "state." global)');
    ok(!/\.garrafas\s*(-=|\+=|=[^=])/.test(codigo), 'despensa.js nunca escreve em garrafas');
  }

  return falhas;
}

// ----- Código real -----
let falhou = 0;
const reais = correrTestes(SRC_DESPENSA, SRC_DADOS);
reais.forEach(function (m) { console.log('FALHA: ' + m); });
falhou += reais.length;

// Só o clique do ecrã (js/estrada.js, ver verificar-estrada.js) chama as trocas; mais nada no jogo.
{
  const html = ler('index.html');
  if (/despensaTrocar|despensaPedidoDoDia|despensaGarrafasDisponiveis/.test(html)) { console.log('FALHA: index.html não devia chamar as trocas'); falhou++; }
  fs.readdirSync(path.join(RAIZ, 'js')).filter(function (f) { return /\.js$/.test(f) && f !== 'despensa.js' && f !== 'estrada.js'; }).forEach(function (f) {
    const codigo = ler('js/' + f).split('\n').filter(function (l) { return !/^\s*\/\//.test(l); }).join('\n');
    if (/despensaTrocar|despensaPedidoDoDia|despensaGarrafasDisponiveis/.test(codigo)) { console.log('FALHA: js/' + f + ' não devia chamar as trocas (só o clique de js/estrada.js)'); falhou++; }
  });
}

// ----- Provas negativas: estragar a regra de propósito tem de fazer o script falhar -----
const MUTANTES = [
  ['sem o piso de 10 uvas', 'despensa', 'uvas - T.custoUvas < T.uvasMinimasDepoisDaTroca', 'false'],
  ['piso a 9 em vez de 10', 'dados', 'ESTRADA_TROCA_UVAS_MINIMAS_DEPOIS = 10', 'ESTRADA_TROCA_UVAS_MINIMAS_DEPOIS = 9'],
  ['custo 40 em vez de 25', 'dados', 'ESTRADA_TROCA_CUSTO_UVAS = 25', 'ESTRADA_TROCA_CUSTO_UVAS = 40'],
  ['sem recusar dias anteriores', 'despensa', 'dia < ultimo', 'false'],
  ['sem 1 troca por vizinho por dia', 'despensa', 'if (despensaTemChave(h, vizinhoId)) return recusa', 'if (false) return recusa'],
  ['sem o teto de 3 por dia', 'despensa', 'Object.keys(h).length >= T.trocasPorDiaTeto', 'false'],
  ['sem a prateleira de 3', 'despensa', 'despensaQuantos(estado, bem) >= T.prateleiraMaxima', 'false'],
  ['Reputação em todas as trocas', 'despensa', 'if (primeiraVez) {\n    reputacaoGanha', 'if (true) {\n    reputacaoGanha'],
  ['+3 em vez de +2', 'dados', 'ESTRADA_TROCA_REPUTACAO_PRIMEIRA = 2', 'ESTRADA_TROCA_REPUTACAO_PRIMEIRA = 3'],
  ['a prova nunca usa garrafa', 'despensa', 'primeiraVez && despensaGarrafasDisponiveis(estado) >= 1', 'false'],
  ['a prova desce state.garrafas', 'despensa', 'e.garrafasDadas = despensaInteiroValido(e.garrafasDadas) + 1;', 'e.garrafasDadas = despensaInteiroValido(e.garrafasDadas) + 1; estado.garrafas = estado.garrafas - 1;'],
  ['a prova mexe no historico', 'despensa', 'e.garrafasDadas = despensaInteiroValido(e.garrafasDadas) + 1;', 'e.garrafasDadas = despensaInteiroValido(e.garrafasDadas) + 1; estado.adega.historico.pop();'],
  ['o pedido do sal nunca paga com sal', 'despensa', "despensaQuantos(estado, 'sal_sado') >= 1) pagou = 'sal'", "false) pagou = 'sal'"],
  ['o sal paga mas também cobra uvas', 'despensa', "despensaRegistarEntrega(estado, 'sal_sado', 1);", "despensaRegistarEntrega(estado, 'sal_sado', 1); estado.uvas = uvas - T.custoUvas;"],
  ['recusar por prateleira cheia cobra uvas', 'despensa', "return recusa('prateleira_cheia', bem);", "{ estado.uvas = estado.uvas - T.custoUvas; return recusa('prateleira_cheia', bem); }"],
  ['recusar por falta de uvas gasta a troca do dia', 'despensa', "return recusa('faltam_uvas', bem);", "{ despensaEstado(estado).hoje = { dia: dia, feitas: { [vizinhoId]: true } }; return recusa('faltam_uvas', bem); }"],
  ['pedido do dia sempre igual', 'despensa', 'despensaHash(dia + \':\' + v.id)', 'despensaHash(v.id)'],
  ['pedido do dia depende da língua', 'despensa', 'despensaHash(dia + \':\' + v.id)', "despensaHash(dia + ':' + v.id + (typeof currentLang !== 'undefined' ? currentLang : ''))"],
  ['o Tomás passa a pedir sal', 'dados', "tomas: ['uvas']", "tomas: ['uvas', 'sal_sado']"],
  ['o Joaquim passa a pedir bagaço', 'dados', "sr_joaquim: ['uvas']", "sr_joaquim: ['uvas', 'bagaco']"],
  ['a prateleira ignora o que já se entregou', 'despensa', 'despensaQuantos(estado, bem) >= T.prateleiraMaxima', 'despensaInteiroValido(estado.despensa && estado.despensa.recebidos && estado.despensa.recebidos[bem]) >= T.prateleiraMaxima'],
  ['grava com saveState', 'despensa', 'return { ok: true, motivo: null, pagou: pagou', 'saveState(estado); return { ok: true, motivo: null, pagou: pagou']
];
MUTANTES.forEach(function (m) {
  const nome = m[0], onde = m[1], de = m[2], para = m[3];
  const fonte = onde === 'despensa' ? SRC_DESPENSA : SRC_DADOS;
  if (fonte.indexOf(de) === -1) { console.log('FALHA: mutante "' + nome + '" não se aplicou (o texto mudou?): ' + de.slice(0, 60)); falhou++; return; }
  const mutado = fonte.split(de).join(para);
  let falhas;
  try { falhas = correrTestes(onde === 'despensa' ? mutado : SRC_DESPENSA, onde === 'dados' ? mutado : SRC_DADOS); }
  catch (e) { falhas = ['erro: ' + e.message]; }
  if (falhas.length === 0) { console.log('FALHA: o mutante "' + nome + '" passou nas verificações (as verificações não apanham este estrago)'); falhou++; }
});

console.log(falhou === 0 ? 'OK (' + MUTANTES.length + ' mutantes apanhados)' : falhou + ' FALHA(S)');
process.exit(falhou === 0 ? 0 : 1);
