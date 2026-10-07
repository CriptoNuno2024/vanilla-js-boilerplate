#!/usr/bin/env node
// Verifica os dados da Estrada (js/estrada-dados.js): 3 vizinhos, falas, bens, fontes e a
// proposta de troca provisória. Só LÊ o ficheiro e corre-o num ambiente simulado (vm), onde
// Math.random e Date.now ficam proibidos. Só exige que a cara exista em disco quando
// caraPendente é false (se for true, o ficheiro pode faltar) e confirma que o ficheiro ainda não é carregado por nada (PR 1: só dados).
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
  '\n;this.VIZINHOS = ESTRADA_VIZINHOS; this.BENS = ESTRADA_BENS; this.FONTES = ESTRADA_FONTES; this.TROCA = ESTRADA_TROCA_PROVISORIA;', ctx, { filename: 'estrada-dados.js' });
const VIZINHOS = ctx.VIZINHOS;
const BENS = ctx.BENS;
const FONTES = ctx.FONTES;
const TROCA = ctx.TROCA;

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

// ----- Proposta de troca provisória (sem uso) -----
{
  ok(TROCA.provisoria === true, 'a troca devia estar marcada como provisória');
  ok(Number.isInteger(TROCA.custoUvas) && TROCA.custoUvas >= 30 && TROCA.custoUvas <= 50, 'o custo devia rondar as 40 uvas: ' + TROCA.custoUvas);
  ok(Number.isInteger(TROCA.custoUvas) && TROCA.custoUvas >= 10, 'o custo nunca devia ser abaixo das 10 uvas do Prensar');
  ok(TROCA.uvasMinimasDepoisDaTroca === 10, 'o jogador devia ficar sempre com pelo menos 10 uvas depois de trocar (uvasMinimasDepoisDaTroca: 10)');
  ok(TROCA.trocasPorVizinhoPorDia === 1, 'devia ser 1 troca por vizinho por dia');
  ok(TROCA.reputacaoPrimeiraTroca === 2, 'devia ser +2 de Reputação só na 1.ª troca de cada bem');
  ok(Object.keys(TROCA).sort().join() === ['custoUvas', 'provisoria', 'reputacaoPrimeiraTroca', 'trocasPorVizinhoPorDia', 'uvasMinimasDepoisDaTroca'].sort().join(),
    'a troca não devia ter outros campos (sem gotas, sem dinheiro): ' + Object.keys(TROCA));
}

// ----- Sem uso: nada carrega nem lê este ficheiro (PR 1 é só dados) -----
if (!process.env.ESTRADA_JS) {
  const html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
  ok(html.indexOf('estrada-dados') === -1, 'index.html não devia carregar js/estrada-dados.js neste PR');
  fs.readdirSync(path.join(RAIZ, 'js')).filter(function (f) { return /\.js$/.test(f) && f !== 'estrada-dados.js'; }).forEach(function (f) {
    const src = fs.readFileSync(path.join(RAIZ, 'js', f), 'utf8');
    ok(!/ESTRADA_(VIZINHOS|BENS|FONTES|TROCA_PROVISORIA)/.test(src), 'js/' + f + ' não devia usar os dados da Estrada neste PR');
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
