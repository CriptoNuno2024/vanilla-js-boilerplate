#!/usr/bin/env node
// Verifica os dados da Estrada (js/estrada-dados.js): 3 vizinhos, falas, bens, fontes e a
// regras das trocas (PR 5A) e pedidos. Só LÊ o ficheiro e corre-o num ambiente simulado (vm), onde
// Math.random e Date.now ficam proibidos. Só exige que a cara exista em disco quando
// caraPendente é false (se for true, o ficheiro pode faltar) e confirma que o ecrã (js/estrada.js) é só de leitura: carregado no index.html, sem gravar, sem cobrar uvas, sem Reputação e sem registar trocas.
//
// Uso: node scripts/verificar-estrada.js [--final]
//   (sem --final) aceita os textos provisórios "[por escrever]";
//   --final       FALHA se ainda restar "[por escrever]".
// ESTRADA_JS=caminho  corre o teste sobre outra versão do ficheiro.
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const FINAL = process.argv.indexOf('--final') !== -1;
const FICHEIRO = process.env.ESTRADA_JS || path.join(RAIZ, 'js', 'estrada-dados.js');
const LINGUAS = ['pt', 'en', 'es'];
const MARCA = '[por escrever]';

const ctx = vm.createContext({});
vm.runInContext('Math.random = function () { throw new Error("Math.random proibido"); }; Date.now = function () { throw new Error("Date.now proibido"); };', ctx);
vm.runInContext(fs.readFileSync(FICHEIRO, 'utf8') +
  '\n;this.VIZINHOS = ESTRADA_VIZINHOS; this.BENS = ESTRADA_BENS; this.FONTES = ESTRADA_FONTES; this.TROCA = ESTRADA_TROCA; this.PEDIDOS = ESTRADA_PEDIDOS;', ctx, { filename: 'estrada-dados.js' });
const VIZINHOS = ctx.VIZINHOS;
const BENS = ctx.BENS;
const FONTES = ctx.FONTES;
const TROCA = ctx.TROCA;
const PEDIDOS = ctx.PEDIDOS;

let falhas = 0;
function ok(cond, msg) { if (!cond) { falhas++; console.log('FALHA: ' + msg); } }
const temTexto = function (s) { return typeof s === 'string' && s.trim() !== ''; };

// Decidido à parte (não lido do ficheiro).
const ESPERADO = {
  dona_amelia: { bem: 'queijo_azeitao', cara: 'assets/personagens/vizinha_amelia.jpg' },
  sr_joaquim: { bem: 'sal_sado', cara: 'assets/personagens/vizinho_joaquim.jpg' },
  tomas: { bem: 'mel_sesimbra', cara: 'assets/personagens/vizinho_tomas.jpg' }
};
const NOMES_BENS = {
  queijo_azeitao: { en: 'Azeitão cheese', es: 'Queso de Azeitão' },
  sal_sado: { en: 'Sado salt', es: 'Sal del Sado' },
  mel_sesimbra: { en: 'Sesimbra honey', es: 'Miel de Sesimbra' }
};
// Só estes endereços foram aprovados como fontes.
const URLS_APROVADOS = [
  'https://www.agroportal.pt/tudo-sobre-o-queijo-de-azeitao-dop/',
  'https://www.agroportal.pt/?p=988711',
  'https://www.kiwa.com/pt/pt/servicos/certificacao/queijos-dop-certificacao/',
  'https://www.viralagenda.com/pt/events/1821332/zimbramel-feira-do-mel-da-peninsula-de-setubal'
];

const textos = []; // { onde, texto } para contar os "[por escrever]"

function textosEmTresLinguas(objeto, onde) {
  ok(objeto && typeof objeto === 'object', onde + ': em falta');
  LINGUAS.forEach(function (l) {
    const t = objeto && objeto[l];
    ok(temTexto(t), onde + ' (' + l + '): texto em falta ou vazio');
    if (temTexto(t)) textos.push({ onde: onde + '/' + l, texto: t });
  });
  ok(Object.keys(objeto || {}).sort().join() === 'en,es,pt', onde + ': línguas inesperadas: ' + Object.keys(objeto || {}));
}

// Uma fala (ou bem) com facto precisa de fonte; sem facto, "semFacto: true" e mais nada.
function verificarFonte(item, onde, obrigatoria) {
  const temFonte = item.fonte !== undefined;
  const semFacto = item.semFacto === true;
  ok(!(temFonte && semFacto), onde + ': não pode ter "fonte" e "semFacto" ao mesmo tempo');
  ok(temFonte || semFacto, onde + ': falta "fonte" (ou "semFacto: true" se for só humor)');
  if (obrigatoria) ok(temFonte, onde + ': precisa de "fonte"');
  if (item.semFacto !== undefined) ok(item.semFacto === true, onde + ': "semFacto" só pode ser true');
  if (temFonte) {
    ok(Array.isArray(item.fonte) && item.fonte.length > 0, onde + ': "fonte" devia ser uma lista não vazia de ids');
    (Array.isArray(item.fonte) ? item.fonte : []).forEach(function (id) {
      ok(Object.prototype.hasOwnProperty.call(FONTES, id), onde + ': fonte desconhecida "' + id + '"');
    });
  }
}

// ----- Fontes autorizadas -----
{
  const ids = Object.keys(FONTES);
  ok(ids.length > 0, 'ESTRADA_FONTES vazio');
  ids.forEach(function (id) {
    const f = FONTES[id];
    ok(temTexto(f.titulo), 'fonte ' + id + ': título em falta');
    if (f.url !== undefined) ok(URLS_APROVADOS.indexOf(f.url) !== -1, 'fonte ' + id + ': endereço não aprovado: ' + f.url);
    ok(Object.keys(f).every(function (k) { return k === 'titulo' || k === 'url'; }), 'fonte ' + id + ': campos inesperados: ' + Object.keys(f));
  });
  URLS_APROVADOS.forEach(function (u) {
    ok(ids.some(function (id) { return FONTES[id].url === u; }), 'o endereço aprovado ' + u + ' devia estar em ESTRADA_FONTES');
  });
}

// ----- Vizinhos -----
{
  ok(VIZINHOS.length === 3 && VIZINHOS.map(function (v) { return v.id; }).join() === 'dona_amelia,sr_joaquim,tomas', 'devia haver 3 vizinhos: dona_amelia, sr_joaquim, tomas');
  const falasIds = [];
  VIZINHOS.forEach(function (v) {
    const esp = ESPERADO[v.id] || {};
    textosEmTresLinguas(v.nome, v.id + ': nome');
    textosEmTresLinguas(v.papel, v.id + ': papel');
    ok(v.cara === esp.cara, v.id + ': cara devia ser ' + esp.cara + ', é ' + v.cara);
    ok(typeof v.caraPendente === 'boolean', v.id + ': caraPendente devia ser true ou false');
    // Cara pendente: o ficheiro pode não existir. Cara não pendente: tem de existir em disco.
    if (v.caraPendente === false) ok(typeof v.cara === 'string' && fs.existsSync(path.join(RAIZ, v.cara)), v.id + ': caraPendente é false mas o ficheiro não existe: ' + v.cara);
    ok(v.bem === esp.bem, v.id + ': bem devia ser ' + esp.bem + ', é ' + v.bem);
    ok(Array.isArray(v.falas) && v.falas.length === 3, v.id + ': devia ter 3 falas');
    (v.falas || []).forEach(function (f, i) {
      const onde = v.id + ' fala ' + (i + 1);
      ok(f.id === v.id + '_' + (i + 1) || f.id === 'tomas_' + (i + 1), onde + ': id fora do padrão: ' + f.id);
      falasIds.push(f.id);
      textosEmTresLinguas(f.texto, onde);
      verificarFonte(f, onde, false);
      ok(Object.keys(f).every(function (k) { return ['id', 'texto', 'fonte', 'semFacto'].indexOf(k) !== -1; }), onde + ': campos inesperados: ' + Object.keys(f));
    });
    ok(v.troca && typeof v.troca === 'object', v.id + ': fala de troca em falta');
    if (v.troca) {
      textosEmTresLinguas(v.troca.texto, v.id + ' troca');
      verificarFonte(v.troca, v.id + ' troca', false);
    }
    ok(Object.keys(v).sort().join() === ['bem', 'cara', 'caraPendente', 'falas', 'id', 'nome', 'papel', 'troca'].sort().join(), v.id + ': campos inesperados: ' + Object.keys(v));
  });
  ok(new Set(falasIds).size === falasIds.length, 'ids de falas repetidos');
}

// ----- Bens -----
{
  ok(BENS.length === 3 && BENS.map(function (b) { return b.id; }).join() === 'queijo_azeitao,sal_sado,mel_sesimbra', 'devia haver 3 bens: queijo_azeitao, sal_sado, mel_sesimbra');
  BENS.forEach(function (b) {
    textosEmTresLinguas(b.nome, b.id + ': nome');
    textosEmTresLinguas(b.descricao, b.id + ': descrição');
    const esp = NOMES_BENS[b.id] || {};
    ok(b.nome.en === esp.en, b.id + ': nome EN devia ser "' + esp.en + '", é "' + b.nome.en + '"');
    ok(b.nome.es === esp.es, b.id + ': nome ES devia ser "' + esp.es + '", é "' + b.nome.es + '"');
    LINGUAS.forEach(function (l) {
      ok(!temTexto(b.descricao[l]) || (b.descricao[l].match(/[.!?]/g) || []).length <= 1, b.id + ' (' + l + '): a descrição devia ser 1 frase');
    });
    verificarFonte(b, b.id, true);
    ok(Object.keys(b).sort().join() === ['descricao', 'fonte', 'id', 'nome'].sort().join(), b.id + ': campos inesperados: ' + Object.keys(b));
    ok(VIZINHOS.filter(function (v) { return v.bem === b.id; }).length === 1, b.id + ': devia pertencer a exatamente 1 vizinho');
  });
}

// ----- Regras das trocas e pedidos (PR 5A: só dados; as contas estão em js/despensa.js) -----
{
  ok(TROCA.provisoria === undefined, 'as regras das trocas já não são provisórias (sem o campo "provisoria")');
  ok(TROCA.custoUvas === 25, 'o custo devia ser 25 uvas: ' + TROCA.custoUvas);
  ok(TROCA.uvasMinimasDepoisDaTroca === 10, 'o jogador devia ficar sempre com pelo menos 10 uvas depois de trocar (uvasMinimasDepoisDaTroca: 10)');
  ok(TROCA.prateleiraMaxima === 3, 'a prateleira devia ter no máximo 3 de cada bem');
  ok(TROCA.trocasPorDiaTeto === 3, 'o teto devia ser 3 trocas por dia');
  ok(TROCA.trocasPorVizinhoPorDia === 1, 'devia ser 1 troca por vizinho por dia');
  ok(TROCA.reputacaoPrimeiraTroca === 2, 'devia ser +2 de Reputação só na 1.ª troca de cada bem');
  ok(TROCA.custoUvas >= TROCA.uvasMinimasDepoisDaTroca, 'o custo nunca devia ser abaixo das 10 uvas do Prensar');
  ok(Object.keys(TROCA).sort().join() === ['custoUvas', 'prateleiraMaxima', 'reputacaoPrimeiraTroca', 'trocasPorDiaTeto', 'trocasPorVizinhoPorDia', 'uvasMinimasDepoisDaTroca'].sort().join(),
    'a troca não devia ter outros campos (sem gotas, sem dinheiro): ' + Object.keys(TROCA));
  ok(PEDIDOS && Object.keys(PEDIDOS).sort().join() === 'dona_amelia,sr_joaquim,tomas', 'ESTRADA_PEDIDOS devia ter os 3 vizinhos');
  ok(JSON.stringify(PEDIDOS.dona_amelia) === '["uvas","sal_sado"]', 'a Dona Amélia devia pedir uvas ou sal (o bagaço está em pausa)');
  ok(JSON.stringify(PEDIDOS.sr_joaquim) === '["uvas"]' && JSON.stringify(PEDIDOS.tomas) === '["uvas"]', 'o Sr. Joaquim e o Tomás pedem sempre uvas');
}

// ----- Carregado e só de leitura (PR 4: ecrã "A Estrada"; sem trocas, sem custos, sem Reputação) -----
if (!process.env.ESTRADA_JS) {
  const html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
  const posicao = function (f) { return html.search(new RegExp('<script src="js/' + f + '\\?v=\\d+"></script>')); };
  ok(posicao('estrada-dados.js') !== -1, 'index.html devia carregar js/estrada-dados.js (com ?v=)');
  ok(posicao('despensa.js') !== -1, 'index.html devia carregar js/despensa.js (com ?v=)');
  ok(posicao('estrada.js') !== -1, 'index.html devia carregar js/estrada.js (com ?v=)');
  ok(posicao('estrada-dados.js') < posicao('despensa.js') && posicao('despensa.js') < posicao('estrada.js') && posicao('estrada.js') < posicao('main.js'),
    'ordem de carga: estrada-dados.js, despensa.js, estrada.js, main.js');

  // Quem pode usar os dados da Estrada: o próprio ficheiro, despensa.js e o ecrã (estrada.js).
  const semComentarios = function (src) { return src.split('\n').filter(function (l) { return !/^\s*\/\//.test(l); }).join('\n'); };
  fs.readdirSync(path.join(RAIZ, 'js')).filter(function (f) { return /\.js$/.test(f) && ['estrada-dados.js', 'despensa.js', 'estrada.js'].indexOf(f) === -1; }).forEach(function (f) {
    const src = fs.readFileSync(path.join(RAIZ, 'js', f), 'utf8');
    ok(!/ESTRADA_(VIZINHOS|BENS|FONTES|TROCA|PEDIDOS)/.test(src), 'js/' + f + ' não devia usar os dados da Estrada');
  });

  // Só de leitura: nenhum ficheiro do jogo regista trocas ou entregas, e o ecrã não grava, não cobra
  // uvas, não dá Reputação e não usa as regras das trocas.
  fs.readdirSync(path.join(RAIZ, 'js')).filter(function (f) { return /\.js$/.test(f) && f !== 'despensa.js' && f !== 'estrada.js'; }).forEach(function (f) {
    ok(!/despensaRegistarTroca|despensaRegistarEntrega|despensaTrocar/.test(semComentarios(fs.readFileSync(path.join(RAIZ, 'js', f), 'utf8'))), 'js/' + f + ' não devia chamar despensaRegistarTroca, despensaRegistarEntrega nem despensaTrocar');
  });
  const ECRA_REAL = fs.readFileSync(path.join(RAIZ, 'js', 'estrada.js'), 'utf8');
  const CHAVES_ESPERADAS = ['estrada.btnGarrafa', 'estrada.btnSal', 'estrada.btnUvas', 'estrada.da', 'estrada.erro', 'estrada.faltamUvas', 'estrada.garrafasLevar',
    'estrada.jaHoje', 'estrada.levouGarrafa', 'estrada.linha', 'estrada.naDespensa', 'estrada.pagouSal', 'estrada.pagouUvas', 'estrada.pedeSalNao', 'estrada.pedeSalTem',
    'estrada.prateleira', 'estrada.recebeste', 'estrada.relogio', 'estrada.repPrimeira', 'estrada.tetoDia', 'estrada.title'].sort();

  // Verificações do ecrã (js/estrada.js) sobre uma versão do ficheiro; devolve as falhas. Corre com o código real e
  // com versões estragadas de propósito (mutantes) no fim: cada estrago tem de fazer falhar alguma verificação.
  const verificarEcra = function (srcEcra) {
    const falhasEcra = [];
    const ok = function (cond, msg) { if (!cond) falhasEcra.push(msg); };
    const ecra = semComentarios(srcEcra);
    // Só o clique troca e grava: despensaTrocar e saveState aparecem uma vez cada, dentro de estradaTrocarClique.
    const m = /function estradaTrocarClique\([^)]*\) \{[\s\S]*?\n\}\n/.exec(ecra);
    const corpoClique = m ? m[0] : '';
    const fora = m ? ecra.replace(corpoClique, '') : ecra;
    ok(!!m, 'devia existir estradaTrocarClique');
    ok((ecra.match(/despensaTrocar\(/g) || []).length === 1 && corpoClique.indexOf('despensaTrocar(') !== -1 && fora.indexOf('despensaTrocar') === -1, 'só o clique (estradaTrocarClique) pode chamar despensaTrocar');
    ok((ecra.match(/saveState\(/g) || []).length === 1 && corpoClique.indexOf('saveState(') !== -1 && fora.indexOf('saveState') === -1, 'só o clique (estradaTrocarClique) pode chamar saveState, uma vez');
    ok(!/localStorage|nuvem|marcarObjetivo|despensaEstado|despensaRegistar|ESTRADA_PEDIDOS/.test(ecra), 'estrada.js não devia usar localStorage, a nuvem, objetivos, despensaEstado, despensaRegistar* nem ESTRADA_PEDIDOS');
    ok(!/\b(state|estado)\.(uvas|reputacao|garrafas|gotas|despensa|adega)[\w.\[\]'"]*\s*(=[^=]|[-+*\/]=|\+\+|--)/.test(ecra), 'estrada.js não devia escrever em uvas, Reputação, garrafas, gotas, despensa nem adega (quem altera é despensaTrocar)');
    ok(!/Math\.random|Date\.now|new Date/.test(ecra), 'estrada.js não devia usar Math.random, Date.now nem new Date');
    ok(!/updateStatsDisplays/.test(fora), 'a barra de cima só se atualiza no clique');

  // Comportamento: desenha o ecrã com o estado REAL de um save, sem alterar nada nem gravar.
  const gravacoes = [];
  const elementos = {};
  const el = function (id) { return elementos[id] || (elementos[id] = { innerHTML: '' }); };
  const sb = {
    console: { log() {}, warn() {}, error() {} },
    localStorage: { getItem: function () { return null; }, setItem: function (k) { gravacoes.push(k); }, removeItem: function (k) { gravacoes.push(k); } },
    location: { search: '' }, URLSearchParams: URLSearchParams, Date: Date, setTimeout: function () {}, Image: function () {},
    document: { querySelectorAll: function () { return []; }, querySelector: function () { return (sb.__botao = { disabled: false }); }, getElementById: el, addEventListener: function () {} },
    Telegram: { WebApp: {} }
  };
  sb.window = sb;
  const cx = vm.createContext(sb);
  ['state.js', 'i18n.js', 'niveis.js', 'caderno.js', 'estrada-dados.js', 'despensa.js'].forEach(function (f) {
    vm.runInContext(fs.readFileSync(path.join(RAIZ, 'js', f), 'utf8'), cx, { filename: 'js/' + f });
  });
  vm.runInContext(srcEcra, cx, { filename: 'js/estrada.js' });
  vm.runInContext('this.diaLisboaDeHoje = function () { return __dia; }; this.atualizarDialogo = function () {}; this.__dia = "2026-10-07";', cx);
  const desenhar = function (lingua, dia) {
    vm.runInContext('currentLang = ' + JSON.stringify(lingua) + '; __dia = ' + JSON.stringify(dia) + '; renderEstrada();', cx);
    return el('estrada-container').innerHTML;
  };
  vm.runInContext('state.despensa.recebidos = { queijo_azeitao: 3 }; state.despensa.entregues = { queijo_azeitao: 1 };', cx);
  const com = vm.runInContext('JSON.stringify(state)', cx);
  const falasVistas = {};
  LINGUAS.forEach(function (l) {
    const h = desenhar(l, '2026-10-07');
    ok((h.match(/class="btn-pill pill-main estrada-botao"/g) || []).length === 3, 'o ecrã (' + l + ') devia ter 3 botões de trocar');
    VIZINHOS.forEach(function (v) {
      ok(h.indexOf(v.nome[l]) !== -1, 'o ecrã (' + l + ') devia mostrar o nome de ' + v.id);
      ok(h.indexOf(v.papel[l]) !== -1, 'o ecrã (' + l + ') devia mostrar o papel de ' + v.id);
      ok(h.indexOf(v.cara) !== -1, 'o ecrã (' + l + ') devia mostrar a cara de ' + v.id);
      const bem = BENS.filter(function (b) { return b.id === v.bem; })[0];
      ok(h.indexOf(bem.nome[l]) !== -1, 'o ecrã (' + l + ') devia mostrar o bem de ' + v.id);
      const falas = v.falas.filter(function (f) { return f.fonte || f.semFacto === true; });
      ok(falas.filter(function (f) { return h.indexOf(f.texto[l].replace(/'/g, '&#39;')) !== -1 || h.indexOf(f.texto[l]) !== -1; }).length === 1, 'o ecrã (' + l + ') devia mostrar exatamente 1 fala de ' + v.id);
      ok(v.falas.concat([v.troca]).every(function (f) { return f === v.troca ? h.indexOf(f.texto[l]) === -1 : true; }), 'o ecrã não devia mostrar falas de troca');
    });
    ok(h.indexOf('estrada-aviso') !== -1 && /estrada-aviso">[^<]*: \d+<\/p>/.test(h), 'o ecrã devia acabar com "Garrafas para levar: n"');
    ok(!/Em breve|Coming soon|Muy pronto|emBreve/.test(h), 'o aviso "Em breve: as trocas" saiu');
  });
  // "Na Despensa: n" lê recebidos - entregues (queijo 2) e 0 nos outros.
  const hpt = desenhar('pt', '2026-10-07');
  ok((hpt.match(/Na Despensa: 2/g) || []).length === 1 && (hpt.match(/Na Despensa: 0/g) || []).length === 2, 'Na Despensa devia ser 2, 0 e 0');
  // Fala do dia: estável no mesmo dia e a rodar de um dia para o outro.
  ok(desenhar('pt', '2026-10-07') === desenhar('pt', '2026-10-07'), 'a fala do dia devia ser a mesma o dia todo');
  for (let d = 1; d <= 28; d++) {
    const h = desenhar('pt', '2026-11-' + (d < 10 ? '0' : '') + d);
    VIZINHOS.forEach(function (v) { v.falas.forEach(function (f) { if (h.indexOf(f.texto.pt) !== -1) falasVistas[f.id] = true; }); });
  }
  VIZINHOS.forEach(function (v) { ok(v.falas.filter(function (f) { return falasVistas[f.id]; }).length >= 2, v.id + ': a fala devia mudar ao longo dos dias'); });
  ok(vm.runInContext('JSON.stringify(state)', cx) === com, 'desenhar o ecrã não devia alterar o estado');
  ok(gravacoes.length === 0, 'desenhar o ecrã não devia gravar nada (localStorage): ' + gravacoes);
  // Textos da interface: as mesmas chaves estrada.* em pt, en e es, todas com texto.
  const T = vm.runInContext('TRANSLATIONS', cx);
  const chaves = function (l) { return Object.keys(T[l]).filter(function (k) { return k.indexOf('estrada.') === 0; }).sort(); };
  ok(chaves('pt').join() === CHAVES_ESPERADAS.join(), 'chaves estrada.* em pt: ' + chaves('pt'));
  LINGUAS.forEach(function (l) {
    ok(chaves(l).join() === chaves('pt').join(), 'as chaves estrada.* de ' + l + ' devem ser as mesmas de pt');
    chaves(l).forEach(function (k) { ok(temTexto(T[l][k]), 'estrada.* (' + l + ') ' + k + ' sem texto'); });
  });
  // A linha da Quinta: só com o ecrã desbloqueado.
  const linha = function (extra) {
    vm.runInContext('state.acesso.jogadorAntigo = false; state.reputacao = 300; ' + extra + '; atualizarLinhaEstradaQuinta();', cx);
    return el('estrada-linha-container').innerHTML;
  };
  vm.runInContext('state.reputacao = 0;', cx);
  ok(linha('') === '', 'no nível 5 (jogador novo) a linha da Quinta não devia aparecer');
  ok(linha('state.reputacao = 999') === '', 'no nível 6 (jogador novo) a linha da Quinta não devia aparecer');
  ok(linha('state.reputacao = 1000').indexOf("goTo('estrada')") !== -1, 'no nível 7 a linha da Quinta devia aparecer');
  vm.runInContext('state.acesso.jogadorAntigo = true; state.reputacao = 300; atualizarLinhaEstradaQuinta();', cx);
  ok(el('estrada-linha-container').innerHTML.indexOf("goTo('estrada')") !== -1, 'um jogador antigo devia ver a linha da Quinta já no nível 5');
  ok(gravacoes.length === 0, 'a linha da Quinta não devia gravar nada');

  // ----- Clique: grava UMA vez, só se a troca correr bem; o desenho nunca grava -----
  vm.runInContext('this.__saves = 0; this.__trocas = 0; this.__barras = 0; ' +
    'var __saveReal = saveState; saveState = function (s) { __saves++; return __saveReal(s); }; ' +
    'var __trocaReal = despensaTrocar; despensaTrocar = function () { __trocas++; return __trocaReal.apply(this, arguments); }; ' +
    'var __barraReal = updateStatsDisplays; updateStatsDisplays = function () { __barras++; return __barraReal(); };', cx);
  const lerN = function (nome) { return vm.runInContext(nome, cx); };
  const montar = function (extra) {
    vm.runInContext('state = mergeDeep(defaultState(), ' + JSON.stringify(Object.assign({ uvas: 773, reputacao: 368, garrafas: 4, acesso: { jogadorAntigo: true },
      adega: { historico: [{ data: 'x', estacao: 'inverno', diasDescanso: 2 }, { data: 'x', estacao: 'verao', diasDescanso: 3 }] } }, extra || {})) + '); __saves = 0; __trocas = 0; __barras = 0; estradaResultado = null; __dia = "2026-10-20"; currentLang = "pt";', cx);
    gravacoes.length = 0;
  };
  const estadoJ = function () { return vm.runInContext('JSON.stringify(state)', cx); };
  const clicar = function (id) { vm.runInContext('estradaTrocarClique(' + JSON.stringify(id) + ')', cx); return el('estrada-container').innerHTML; };
  montar();
  let h0 = desenhar('pt', '2026-10-20');
  const antesD = estadoJ();
  ok(lerN('__saves') === 0 && lerN('__trocas') === 0 && lerN('__barras') === 0 && gravacoes.length === 0 && estadoJ() === antesD, 'desenhar o ecrã não grava, não troca e não mexe no estado');
  ok((h0.match(/Levar uma garrafa/g) || []).length === 3 && h0.indexOf(' disabled') === -1 && h0.indexOf('Garrafas para levar: 4') !== -1, 'com garrafas, as 3 provas oferecem "Levar uma garrafa" (sem botões apagados) e "Garrafas para levar: 4"');
  // 1.ª troca com a Dona Amélia: prova com garrafa.
  const histAntes = vm.runInContext('JSON.stringify(state.adega.historico)', cx);
  let h1 = clicar('dona_amelia');
  ok(lerN('__saves') === 1 && lerN('__trocas') === 1 && lerN('__barras') === 1, 'o clique troca, grava UMA vez e atualiza a barra de cima uma vez');
  ok(sb.__botao && sb.__botao.disabled === true, 'o clique apaga o botão logo (clique duplo)');
  ok(lerN('state.garrafas') === 4 && vm.runInContext('JSON.stringify(state.adega.historico)', cx) === histAntes && lerN('state.despensa.garrafasDadas') === 1, 'a prova não mexe em state.garrafas nem no historico; garrafasDadas 1');
  ok(lerN('state.reputacao') === 370 && lerN('state.uvas') === 773, 'prova com garrafa: +2 de Reputação e sem gastar uvas');
  ok(h1.indexOf('Recebeste: Queijo de Azeitão') !== -1 && h1.indexOf('+2 de Reputação (1.ª vez)') !== -1 && h1.indexOf('Levaste uma garrafa de Moscatel') !== -1 && h1.indexOf(VIZINHOS[0].troca.texto.pt) !== -1, 'o cartão mostra o que recebeu, +2, a garrafa e a fala de troca');
  ok(h1.indexOf('Garrafas para levar: 3') !== -1 && h1.indexOf('Já trocaste hoje com este vizinho') !== -1, 'depois da prova: 3 garrafas para levar e a Amélia diz que já trocou hoje');
  ok(!/Moscatel (de|do|da) /.test(h1) && !/garrafa de Moscatel (do|de|da) (queijo|sal|mel)/i.test(h1), 'não afirma qual Moscatel vai com qual produto');
  // Segunda tentativa no mesmo dia: recusada, nada grava nem muda.
  const dep1 = estadoJ();
  clicar('dona_amelia');
  ok(lerN('__saves') === 1 && estadoJ() === dep1, 'repetir no mesmo dia é recusado: não grava e o estado não muda');
  // Mudar de língua a meio: o resultado acompanha a língua (guardam-se códigos, não textos).
  clicar('sr_joaquim');
  vm.runInContext('currentLang = "en"; estradaDesenhar();', cx);
  const hEn = el('estrada-container').innerHTML;
  ok(hEn.indexOf('You received: Sado salt') !== -1 && hEn.indexOf('You took a bottle of Moscatel') !== -1 && hEn.indexOf('Recebeste') === -1, 'mudar de língua a meio: o resultado passa para inglês');
  // Entrar outra vez no ecrã esquece o resultado.
  vm.runInContext('currentLang = "pt"; renderEstrada();', cx);
  ok(el('estrada-container').innerHTML.indexOf('Recebeste:') === -1, 'ao entrar no ecrã o resultado antigo desaparece');
  // Repetição no dia seguinte: 25 uvas e sem Reputação.
  vm.runInContext('__dia = "2026-10-21";', cx);
  const repAntes = lerN('state.reputacao'), uvAntes = lerN('state.uvas');
  const h2 = clicar('dona_amelia');
  ok(lerN('state.uvas') === uvAntes - 25 && lerN('state.reputacao') === repAntes && h2.indexOf('Pagaste 25 uvas') !== -1 && h2.indexOf('(1.ª vez)') === -1, 'repetição no dia seguinte: 25 uvas e sem Reputação');
  ok(lerN('__saves') === 3, 'cada troca ok gravou uma vez (3 trocas, 3 gravações)');
  // Recusada por relógio atrás: não grava.
  const gravN = lerN('__saves'); vm.runInContext('__dia = "2026-10-10";', cx);
  const antesR = estadoJ();
  const hR = clicar('tomas');
  ok(lerN('__saves') === gravN && estadoJ() === antesR && hR.indexOf('O relógio do aparelho está atrás. Tenta mais tarde.') !== -1, 'relógio atrás: recusa sem gravar e com a linha do relógio');
  // 33 uvas e sem garrafas: faltam uvas.
  montar({ uvas: 33, garrafas: 0 });
  const hU = desenhar('pt', '2026-10-20');
  ok((hU.match(/Trocar por 25 uvas/g) || []).length === 3 && (hU.match(/ disabled/g) || []).length === 3 && (hU.match(/Precisas de 35 uvas/g) || []).length === 3, '33 uvas sem garrafas: 3 botões apagados com "Precisas de 35 uvas"');
  montar({ uvas: 35, garrafas: 0 });
  ok(desenhar('pt', '2026-10-20').indexOf(' disabled') === -1, '35 uvas: botões ativos');

  // ----- O estado do cartão (calculado só a ler) devolve o mesmo que despensaTrocar -----
  {
    const dias = ['2026-10-19', '2026-10-20', '2026-10-21'];
    const ev = function (expr) { return vm.runInContext(expr, cx); };
    ev("ESTRADA_BENS.push({ id: 'bem_teste', nome: { pt: 'x', en: 'x', es: 'x' } }); ESTRADA_VIZINHOS.push({ id: 'vizinho_teste', nome: { pt: 'x', en: 'x', es: 'x' }, papel: { pt: 'x', en: 'x', es: 'x' }, cara: 'x', caraPendente: true, bem: 'bem_teste', falas: [] });");
    const idsViz = JSON.parse(ev('JSON.stringify(ESTRADA_VIZINHOS.map(function (v) { return v.id; }))'));
    let casos = 0, difs = 0;
    const hojes = [{ dia: null, feitas: {} }, { dia: '2026-10-20', feitas: { dona_amelia: true } }, { dia: '2026-10-20', feitas: { dona_amelia: true, sr_joaquim: true, tomas: true } }, { dia: '2026-10-21', feitas: {} }];
    [0, 34, 35, 773].forEach(function (uvas) { [0, 1, 4].forEach(function (garr) { [{}, { queijo_azeitao: 3 }, { sal_sado: 1 }, { sal_sado: 3, queijo_azeitao: 1 }, { bem_teste: 3 }].forEach(function (rec) { [{}, { queijo_azeitao: '2026-10-01', sal_sado: '2026-10-01', mel_sesimbra: '2026-10-01' }, { sal_sado: '2026-10-01' }].forEach(function (prim) { hojes.forEach(function (hoje) {
      dias.concat(['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04']).forEach(function (dia) {
        idsViz.forEach(function (vid) {
          const estado = { uvas: uvas, reputacao: 0, garrafas: garr, adega: { historico: [] }, despensa: { recebidos: rec, entregues: {}, primeiraTroca: prim, hoje: hoje } };
          cx.__est = JSON.parse(JSON.stringify(estado)); cx.__viz = vid; cx.__dia2 = dia;
          const card = JSON.parse(ev('JSON.stringify(estradaEstadoCartao(__est, despensaVizinhoPorId(__viz), __dia2))'));
          const real = JSON.parse(ev('JSON.stringify(despensaTrocar(__est, __viz, __dia2))'));
          casos++;
          if ((card.motivo === null) !== (real.ok === true) || (real.ok ? real.pagou !== card.acao : real.motivo !== card.motivo)) {
            difs++; if (difs <= 3) ok(false, 'o estado do cartão difere de despensaTrocar: ' + JSON.stringify({ uvas: uvas, garr: garr, rec: rec, prim: prim, hoje: hoje, dia: dia, v: vid, card: card, real: real }));
          }
        });
      });
    }); }); }); }); });
    ok(casos > 1500 && difs === 0, 'o estado do cartão devia coincidir com despensaTrocar em todos os casos (' + casos + ' casos, ' + difs + ' diferenças)');
    // Calculá-lo não altera nada.
    cx.__est = { uvas: 5, despensa: null }; const a0 = JSON.stringify(cx.__est); ev('estradaEstadoCartao(__est, ESTRADA_VIZINHOS[0], "2026-10-20")');
    ok(JSON.stringify(cx.__est) === a0, 'calcular o estado do cartão não altera o estado');
  }
    return falhasEcra;
  };

  verificarEcra(ECRA_REAL).forEach(function (m) { ok(false, m); });

  // Provas negativas: estragar o ecrã de propósito tem de fazer o script falhar.
  [
    ['o desenho grava', 'function estradaDesenhar() {', 'function estradaDesenhar() { saveState(state);'],
    ['o desenho troca', 'const e = estradaEstadoCartao(state, v, dia);', 'const e = estradaEstadoCartao(state, v, dia); despensaTrocar(state, v.id, dia);'],
    ['o desenho escreve no localStorage', 'function estradaDiaDeHoje() {', "function estradaDiaDeHoje() { localStorage.setItem('x', '1');"],
    ['o clique não grava', '      saveState(state);\n      updateStatsDisplays();', '      updateStatsDisplays();'],
    ['o clique grava duas vezes', '      saveState(state);\n      updateStatsDisplays();', '      saveState(state); saveState(state);\n      updateStatsDisplays();'],
    ['recusar também grava', '    } else {\n      // Recusada', '    } else {\n      saveState(state);\n      // Recusada'],
    ['a barra de cima não se atualiza', '      updateStatsDisplays();\n', ''],
    ['o clique não apaga o botão', "    if (botao) botao.disabled = true;\n", ''],
    ['o estado do cartão ignora o piso', 'uvas - T.custoUvas < T.uvasMinimasDepoisDaTroca', 'uvas - T.custoUvas < 0'],
    ['o estado do cartão ignora a prateleira', 'despensaQuantos(estado, v.bem) >= T.prateleiraMaxima', 'false'],
    ['o estado do cartão ignora o relógio atrás', 'ultimo !== null && dia < ultimo', 'false'],
    ['o estado do cartão ignora o teto', 'Object.keys(feitas).length >= T.trocasPorDiaTeto', 'false'],
    ['o ecrã volta a dizer "Em breve"', "t('estrada.garrafasLevar').replace('{n}', despensaGarrafasDisponiveis(state))", "'Em breve: as trocas'"],
    ['a Reputação aparece em todas as trocas', "(r.primeiraVez ? '<p>' + t('estrada.repPrimeira')", "(true ? '<p>' + t('estrada.repPrimeira')"],
    ['o resultado não se esquece ao entrar', 'function renderEstrada() {\n  estradaResultado = null;', 'function renderEstrada() {']
  ].forEach(function (mt) {
    if (ECRA_REAL.indexOf(mt[1]) === -1) { ok(false, 'mutante do ecrã "' + mt[0] + '" não se aplicou: ' + mt[1].slice(0, 50)); return; }
    let r;
    try { r = verificarEcra(ECRA_REAL.split(mt[1]).join(mt[2])); } catch (e) { r = ['erro: ' + e.message]; }
    ok(r.length > 0, 'o mutante do ecrã "' + mt[0] + '" passou nas verificações');
  });
}

// ----- "[por escrever]" -----
{
  const porEscrever = textos.filter(function (t) { return t.texto.indexOf(MARCA) !== -1; }).map(function (t) { return t.onde; });
  if (FINAL) ok(porEscrever.length === 0, '--final: ainda há ' + porEscrever.length + ' textos "[por escrever]" (ex.: ' + porEscrever.slice(0, 3).join(', ') + ')');
  else console.log('(modo normal: ' + porEscrever.length + ' de ' + textos.length + ' textos ainda "[por escrever]")');
}

console.log(falhas === 0 ? 'OK' : falhas + ' FALHA(S)');
process.exit(falhas === 0 ? 0 : 1);
