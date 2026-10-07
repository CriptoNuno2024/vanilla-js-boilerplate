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
  fs.readdirSync(path.join(RAIZ, 'js')).filter(function (f) { return /\.js$/.test(f) && f !== 'despensa.js'; }).forEach(function (f) {
    ok(!/despensaRegistarTroca|despensaRegistarEntrega|despensaTrocar/.test(semComentarios(fs.readFileSync(path.join(RAIZ, 'js', f), 'utf8'))), 'js/' + f + ' não devia chamar despensaRegistarTroca, despensaRegistarEntrega nem despensaTrocar');
  });
  const ecra = semComentarios(fs.readFileSync(path.join(RAIZ, 'js', 'estrada.js'), 'utf8'));
  ok(!/saveState|localStorage|nuvem|marcarObjetivo|despensaEstado|ESTRADA_TROCA|ESTRADA_PEDIDOS|despensaPedidoDoDia|despensaGarrafasDisponiveis/.test(ecra), 'estrada.js não devia gravar, usar a nuvem, objetivos, despensaEstado nem as regras das trocas');
  ok(!/state\.(reputacao|uvas|gotas|garrafas|despensa)|reputacao|uvas/i.test(ecra), 'estrada.js não devia tocar em Reputação, uvas, gotas, garrafas nem na despensa (só despensaQuantos)');
  ok(!/Math\.random|Date\.now|new Date/.test(ecra), 'estrada.js não devia usar Math.random, Date.now nem new Date');

  // Comportamento: desenha o ecrã com o estado REAL de um save, sem alterar nada nem gravar.
  const gravacoes = [];
  const elementos = {};
  const el = function (id) { return elementos[id] || (elementos[id] = { innerHTML: '' }); };
  const sb = {
    console: { log() {}, warn() {}, error() {} },
    localStorage: { getItem: function () { return null; }, setItem: function (k) { gravacoes.push(k); }, removeItem: function (k) { gravacoes.push(k); } },
    location: { search: '' }, URLSearchParams: URLSearchParams, Date: Date, setTimeout: function () {}, Image: function () {},
    document: { querySelectorAll: function () { return []; }, getElementById: el, addEventListener: function () {} },
    Telegram: { WebApp: {} }
  };
  sb.window = sb;
  const cx = vm.createContext(sb);
  ['state.js', 'i18n.js', 'niveis.js', 'caderno.js', 'estrada-dados.js', 'despensa.js', 'estrada.js'].forEach(function (f) {
    vm.runInContext(fs.readFileSync(path.join(RAIZ, 'js', f), 'utf8'), cx, { filename: 'js/' + f });
  });
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
    ok(/>\s*$/.test(h) && h.indexOf('estrada-aviso') !== -1, 'o ecrã devia ter o aviso "Em breve: as trocas"');
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
  ok(chaves('pt').length === 5, 'devia haver 5 chaves estrada.* em pt: ' + chaves('pt'));
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
}

// ----- "[por escrever]" -----
{
  const porEscrever = textos.filter(function (t) { return t.texto.indexOf(MARCA) !== -1; }).map(function (t) { return t.onde; });
  if (FINAL) ok(porEscrever.length === 0, '--final: ainda há ' + porEscrever.length + ' textos "[por escrever]" (ex.: ' + porEscrever.slice(0, 3).join(', ') + ')');
  else console.log('(modo normal: ' + porEscrever.length + ' de ' + textos.length + ' textos ainda "[por escrever]")');
}

console.log(falhas === 0 ? 'OK' : falhas + ' FALHA(S)');
process.exit(falhas === 0 ? 0 : 1);
