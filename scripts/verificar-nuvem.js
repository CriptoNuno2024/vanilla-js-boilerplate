#!/usr/bin/env node
// Verifica a hora de gravação (ultimaGravacaoEm) no arranque: gravações de
// arranque não a mudam, uma ação do jogador muda, e o comparador de
// nuvemSincronizarAoAbrir() (js/nuvem.js) continua a escolher bem. Só LÊ js/,
// corre-os num ambiente simulado (vm) com uma nuvem falsa em memória: nunca
// toca em browser, Telegram nem conta real.
//
// Uso: node scripts/verificar-nuvem.js [caminho/alternativo/state.js]
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const STATE_JS = process.argv[2] || path.join(RAIZ, 'js', 'state.js');
const NUVEM_JS = path.join(RAIZ, 'js', 'nuvem.js');

let falhas = 0;
function ok(cond, msg) { if (!cond) { falhas++; console.log('FALHA: ' + msg); } }

// Nuvem falsa (CloudStorage): modo 'ok', 'erro' (devolve erro) ou 'silencio'
// (nunca responde). Cada pedido de escrita fica registado em .escritas.
function nuvemFalsa(inicial) {
  const dados = Object.assign({}, inicial);
  const f = { modo: 'ok', dados: dados, escritas: 0, leituras: 0, vaziasPrimeiras: 0 };
  function responde(cb, erro, valor) {
    if (f.modo === 'silencio') return;
    if (f.modo === 'erro') { cb(new Error('avaria')); return; }
    cb(erro, valor);
  }
  f.getItem = function (k, cb) {
    if (k === 'yc_state_meta') {
      f.leituras++;
      if (f.vaziasPrimeiras > 0 && f.modo === 'ok') { f.vaziasPrimeiras--; cb(null, ''); return; } // vazio passageiro
    }
    responde(cb, null, Object.prototype.hasOwnProperty.call(dados, k) ? dados[k] : '');
  };
  f.getItems = function (ks, cb) {
    const r = {};
    ks.forEach(function (k) { r[k] = Object.prototype.hasOwnProperty.call(dados, k) ? dados[k] : ''; });
    responde(cb, null, r);
  };
  f.setItem = function (k, v, cb) { f.escritas++; dados[k] = v; if (cb) responde(cb, null, true); };
  return f;
}

function guardarNaNuvem(nuvem, estado, em) {
  const texto = JSON.stringify(estado);
  nuvem.dados.yc_state_meta = JSON.stringify({ partes: 1, atualizadoEm: em });
  nuvem.dados.yc_state_parte_0 = texto;
}

// Abre o "jogo": localStorage guardado (partilhado entre sessões do teste),
// relógio controlado, e opcionalmente o nuvem.js com a nuvem falsa.
function abrir(localStorageDados, relogio, nuvem, comNuvemJs) {
  const pointer = [];
  const ouvintes = {};
  const temporizadores = [];
  let proximoId = 1;
  const sandbox = {
    console: { log() {}, warn() {}, error() {} },
    localStorage: {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(localStorageDados, k) ? localStorageDados[k] : null; },
      setItem: function (k, v) { localStorageDados[k] = String(v); },
      removeItem: function (k) { delete localStorageDados[k]; }
    },
    location: { search: '' },
    URLSearchParams: URLSearchParams,
    document: {
      addEventListener: function (tipo, fn) {
        if (tipo === 'pointerdown') pointer.push(fn);
        (ouvintes[tipo] = ouvintes[tipo] || []).push(fn);
      },
      querySelectorAll: function () { return []; },
      querySelector: function () { return null; },
      getElementById: function () { return null; },
      visibilityState: 'visible'
    },
    setTimeout: function (fn, ms) { const id = proximoId++; temporizadores.push({ id: id, em: relogio.t + (ms || 0), fn: fn }); return id; },
    clearTimeout: function (id) { const i = temporizadores.findIndex(function (x) { return x.id === id; }); if (i !== -1) temporizadores.splice(i, 1); },
    applyTranslations: function () {},
    t: function (k) { return k; },
    Date: class extends Date { static now() { return relogio.t; } }
  };
  sandbox.window = sandbox;
  sandbox.window.addEventListener = function () {};
  sandbox.Telegram = { WebApp: nuvem ? { initDataUnsafe: { a: 1 }, CloudStorage: nuvem } : {} };
  const ctx = vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(STATE_JS, 'utf8'), ctx, { filename: 'state.js' });
  if (comNuvemJs) vm.runInContext(fs.readFileSync(NUVEM_JS, 'utf8'), ctx, { filename: 'nuvem.js' });
  return {
    ctx: ctx,
    ev: function (codigo) { return vm.runInContext(codigo, ctx); },
    tocar: function () { pointer.forEach(function (fn) { fn(); }); },
    // Avança o relógio e dispara os temporizadores que vencem, por ordem.
    avancar: function (ms) {
      const alvo = relogio.t + ms;
      for (;;) {
        temporizadores.sort(function (a, b) { return a.em - b.em; });
        if (!temporizadores.length || temporizadores[0].em > alvo) break;
        const x = temporizadores.shift();
        relogio.t = Math.max(relogio.t, x.em);
        x.fn();
      }
      relogio.t = alvo;
    },
    pendentes: function () { return temporizadores.length; },
    visivel: function () { (ouvintes.visibilitychange || []).forEach(function (fn) { fn(); }); },
    estatus: function () {
      vm.runInContext('var _r = null; nuvemLerEstado(function (e, s) { _r = s; });', ctx);
      return vm.runInContext('_r', ctx);
    }
  };
}

function estadoGuardado(dados) { return JSON.parse(dados.yoshicat_quinta_state_v2); }

// (a) estado velho: a gravação de arranque guarda o conteúdo mas NÃO muda o carimbo.
{
  const ls = { yoshicat_quinta_state_v2: JSON.stringify({ reputacao: 50, ultimaGravacaoEm: 1000 }) };
  const j = abrir(ls, { t: 9000 });
  j.ev("state.objetivos.dia = '2026-10-05'; saveState(state);"); // como objetivos.js:147 ao abrir
  ok(j.ev('state.ultimaGravacaoEm') === 1000, '(a) o carimbo mudou numa gravação de arranque');
  const g = estadoGuardado(ls);
  ok(g.ultimaGravacaoEm === 1000, '(a) o carimbo guardado mudou');
  ok(g.objetivos.dia === '2026-10-05' && g.reputacao === 50, '(a) o conteúdo não foi guardado');
  ok(j.ev('arranque.localEm') === 1000, '(a) arranque.localEm devia ser 1000');
}

// (b) depois de um toque, a gravação carimba "agora".
{
  const ls = { yoshicat_quinta_state_v2: JSON.stringify({ reputacao: 50, ultimaGravacaoEm: 1000 }) };
  const j = abrir(ls, { t: 9000 });
  j.tocar();
  j.ev('state.gotas += 1; saveState(state);');
  ok(j.ev('state.ultimaGravacaoEm') === 9000, '(b) o carimbo não mudou depois de um toque');
  ok(estadoGuardado(ls).ultimaGravacaoEm === 9000, '(b) o carimbo guardado não mudou');
}

// (c) carimbo 0 (jogador antigo sem carimbo) continua a carimbar, sem toque.
{
  const ls = { yoshicat_quinta_state_v2: JSON.stringify({ reputacao: 50, ultimaGravacaoEm: 0 }) };
  const j = abrir(ls, { t: 9000 });
  j.ev('saveState(state);');
  ok(j.ev('state.ultimaGravacaoEm') === 9000, '(c) carimbo 0 devia carimbar');
}

// (d) cenário de 04/10, até onde dá sem mexer em nuvem.js: um aparelho com estado
// velho abre, grava no arranque, a nuvem não responde; na abertura seguinte a nuvem
// (jogada noutro aparelho) responde e deve ganhar, não ser sobreposta.
{
  const bom = { reputacao: 80, uvas: 5, ultimaGravacaoEm: 5000 };
  const ls = { yoshicat_quinta_state_v2: JSON.stringify({ reputacao: 50, ultimaGravacaoEm: 1000 }) };
  const nuvem = nuvemFalsa({});
  guardarNaNuvem(nuvem, bom, 5000);

  nuvem.modo = 'silencio'; // abertura 1: arranque grava, a nuvem não responde
  const a1 = abrir(ls, { t: 9000 }, nuvem, true);
  a1.ev("saveState(state);");
  ok(nuvem.escritas === 0, '(d) abertura 1: algo foi enviado à nuvem sem leitura');
  ok(a1.ev('state.ultimaGravacaoEm') === 1000, '(d) abertura 1: o carimbo mudou');

  nuvem.modo = 'ok'; // abertura 2: a nuvem responde
  const a2 = abrir(ls, { t: 20000 }, nuvem, true);
  ok(a2.ev('arranque.localEm') === 1000, '(d) abertura 2: o carimbo local devia continuar velho');
  ok(a2.ev("arranque.ganhou") === 'nuvem', '(d) a nuvem devia ganhar, ganhou: ' + a2.ev('arranque.ganhou'));
  ok(a2.ev('state.reputacao') === 80, '(d) a reputação devia voltar a 80');
  ok(estadoGuardado(ls).reputacao === 80, '(d) o localStorage devia ficar com a nuvem');
}

// (d2) o local é mesmo mais recente: ganha e a nuvem é alinhada (o carimbo enviado é o
// da última ação real, não o de agora).
{
  const ls = { yoshicat_quinta_state_v2: JSON.stringify({ reputacao: 90, ultimaGravacaoEm: 7000 }) };
  const nuvem = nuvemFalsa({});
  guardarNaNuvem(nuvem, { reputacao: 80, ultimaGravacaoEm: 5000 }, 5000);
  const j = abrir(ls, { t: 20000 }, nuvem, true);
  ok(j.ev('arranque.ganhou') === 'local', '(d2) o local devia ganhar, ganhou: ' + j.ev('arranque.ganhou'));
  ok(j.ev('state.reputacao') === 90, '(d2) a reputação local devia manter-se');
}

// (d3) sem toque e depois de a nuvem ser adotada, o carimbo fica o da nuvem (não "agora").
{
  const ls = { yoshicat_quinta_state_v2: JSON.stringify({ reputacao: 10, ultimaGravacaoEm: 1000 }) };
  const nuvem = nuvemFalsa({});
  guardarNaNuvem(nuvem, { reputacao: 80, ultimaGravacaoEm: 5000 }, 5000);
  const j = abrir(ls, { t: 20000 }, nuvem, true);
  j.ev('saveState(state);');
  ok(j.ev('state.ultimaGravacaoEm') === 5000, '(d3) o carimbo adotado da nuvem mudou sem toque');
}

const dadosLocais = function (rep, em, extra) { return { yoshicat_quinta_state_v2: JSON.stringify(Object.assign({ reputacao: rep, ultimaGravacaoEm: em }, extra || {})) }; };

// (1) getItem com erro: nenhum setItem, estado igual, nada enviado mesmo após uma ação real.
{
  const ls = dadosLocais(50, 1000);
  const nuvem = nuvemFalsa({ yc_state_meta: JSON.stringify({ partes: 1, atualizadoEm: 5000 }), yc_state_parte_0: JSON.stringify({ reputacao: 80 }) });
  nuvem.modo = 'erro';
  const antes = JSON.stringify(nuvem.dados);
  const j = abrir(ls, { t: 9000 }, nuvem, true);
  ok(j.ev('arranque.nuvemErro') === true, '(1) devia estar em erro');
  ok(j.ev('arranque.respondeu') === false, '(1) respondeu não devia ficar true');
  ok(j.ev('nuvemPodeEnviar()') === false, '(1) não devia poder enviar');
  j.tocar();
  j.ev('state.gotas += 3; saveState(state);'); // ação real
  j.avancar(2000);
  ok(nuvem.escritas === 0, '(1) escreveu na nuvem depois de um erro');
  ok(JSON.stringify(nuvem.dados) === antes, '(1) a nuvem mudou');
  ok(j.ev('state.reputacao') === 50 && j.ev('state.gotas') === 3, '(1) o estado local mudou sem ação');
  ok(estadoGuardado(ls).gotas === 3, '(1) a ação real devia ficar gravada no aparelho');
  // reler: 15 s, 60 s, 5 min (máximo 3), e ao voltar a ficar visível
  const lei = function () { return nuvem.leituras; };
  ok(lei() === 1, '(1) leituras iniciais: ' + lei());
  j.avancar(12000); ok(lei() === 1, '(1) releu cedo demais');
  j.avancar(1500);  ok(lei() === 2, '(1) devia reler aos 15 s: ' + lei());
  j.avancar(60000); ok(lei() === 3, '(1) devia reler aos 60 s: ' + lei());
  j.avancar(300000); ok(lei() === 4, '(1) devia reler aos 5 min: ' + lei());
  j.avancar(3600000); ok(lei() === 4, '(1) não devia reler mais de 3 vezes');
  j.visivel(); ok(lei() === 5, '(1) devia reler ao voltar a ficar visível: ' + lei());
  ok(nuvem.escritas === 0, '(1) escreveu na nuvem durante as releituras');
  ok(j.ev('arranque.nuvemEstatus') === 'erro', '(1) estatuto devia ser erro');
  // sem resposta nenhuma (nunca responde): passados 8 s também é erro, sem enviar
  const nuvem2 = nuvemFalsa({}); nuvem2.modo = 'silencio';
  const j2 = abrir(dadosLocais(50, 1000), { t: 9000 }, nuvem2, true);
  j2.tocar(); j2.ev('saveState(state);'); j2.avancar(9000);
  ok(nuvem2.escritas === 0 && j2.ev('arranque.nuvemErro') === true, '(1) sem resposta devia contar como erro, sem enviar às cegas');
}

// (2) meta vazio com progresso local: só copia depois da 2.ª leitura (10 s depois).
{
  const ls = dadosLocais(50, 1000);
  const nuvem = nuvemFalsa({});
  const j = abrir(ls, { t: 9000 }, nuvem, true);
  ok(nuvem.escritas === 0 && j.ev('arranque.respondeu') === false, '(2) copiou à 1.ª leitura');
  j.avancar(9000); ok(nuvem.escritas === 0, '(2) copiou antes dos 10 s');
  j.avancar(1500);
  ok(nuvem.leituras >= 2, '(2) devia ter feito a 2.ª leitura: ' + nuvem.leituras); // (a verificação da gravação também lê o meta)
  ok(nuvem.escritas > 0 && !!nuvem.dados.yc_state_meta, '(2) devia copiar o local depois de confirmar o vazio');
  ok(j.ev('arranque.respondeu') === true, '(2) devia ficar liberto depois de confirmar');
}

// (2b) vazio passageiro: a 2.ª leitura já traz dados melhores, que ganham; nada é sobreposto.
{
  const ls = dadosLocais(50, 1000);
  const nuvem = nuvemFalsa({});
  guardarNaNuvem(nuvem, { reputacao: 80, ultimaGravacaoEm: 5000 }, 5000);
  nuvem.vaziasPrimeiras = 1;
  const j = abrir(ls, { t: 9000 }, nuvem, true);
  ok(nuvem.escritas === 0, '(2b) escreveu na 1.ª leitura vazia');
  j.avancar(10500);
  ok(nuvem.escritas === 0, '(2b) escreveu por cima da nuvem boa');
  ok(j.ev('state.reputacao') === 80, '(2b) a nuvem boa devia ganhar');
}

// (3) meta ok com parte vazia ou JSON truncado, meta sem partes, meta mau: é erro (e meta '' é vazio).
{
  const casos = [
    ['parte vazia', { yc_state_meta: JSON.stringify({ partes: 2, atualizadoEm: 5000 }), yc_state_parte_0: '{"reputacao":80,', yc_state_parte_1: '' }],
    ['parte em falta', { yc_state_meta: JSON.stringify({ partes: 2, atualizadoEm: 5000 }), yc_state_parte_0: '{"reputacao":80}' }],
    ['JSON truncado', { yc_state_meta: JSON.stringify({ partes: 1, atualizadoEm: 5000 }), yc_state_parte_0: '{"reputacao": 8' }],
    ['meta sem partes', { yc_state_meta: JSON.stringify({ atualizadoEm: 5000 }) }],
    ['meta JSON mau', { yc_state_meta: '{nao-json' }]
  ];
  casos.forEach(function (c) {
    const ls = dadosLocais(50, 1000);
    const nuvem = nuvemFalsa(c[1]);
    const j = abrir(ls, { t: 9000 }, nuvem, true);
    ok(j.estatus() === 'erro', '(3) ' + c[0] + ': devia ser erro, deu ' + j.estatus());
    ok(nuvem.escritas === 0, '(3) ' + c[0] + ': escreveu na nuvem');
    ok(j.ev('state.reputacao') === 50, '(3) ' + c[0] + ': trocou o estado');
    ok(j.ev('arranque.nuvemErro') === true, '(3) ' + c[0] + ': nuvemErro devia estar ligado');
  });
  const jv = abrir(dadosLocais(0, 0), { t: 9000 }, nuvemFalsa({}), true);
  ok(jv.estatus() === 'vazio', '(3) meta vazio devia ser vazio');
  const nb = nuvemFalsa({}); guardarNaNuvem(nb, { reputacao: 1 }, 5000);
  ok(abrir(dadosLocais(0, 0), { t: 9000 }, nb, true).estatus() === 'ok', '(3) meta e partes boas devia ser ok');
}

// (4) erro e depois sucesso: aplica a regra normal.
{
  // nuvem melhor
  let nuvem = nuvemFalsa({}); guardarNaNuvem(nuvem, { reputacao: 80, ultimaGravacaoEm: 5000 }, 5000);
  nuvem.modo = 'erro';
  let j = abrir(dadosLocais(50, 1000), { t: 9000 }, nuvem, true);
  ok(j.ev('state.reputacao') === 50, '(4) estado devia ficar local durante o erro');
  nuvem.modo = 'ok'; j.avancar(15500);
  ok(j.ev('arranque.respondeu') === true && j.ev('arranque.nuvemErro') === false, '(4) devia ficar liberto depois do sucesso');
  ok(j.ev('arranque.ganhou') === 'nuvem' && j.ev('state.reputacao') === 80, '(4) a nuvem devia ganhar: ' + j.ev('arranque.ganhou'));
  // local mais recente (carimbo e reputação)
  nuvem = nuvemFalsa({}); guardarNaNuvem(nuvem, { reputacao: 80, ultimaGravacaoEm: 5000 }, 5000);
  nuvem.modo = 'erro';
  j = abrir(dadosLocais(90, 7000), { t: 9000 }, nuvem, true);
  nuvem.modo = 'ok'; j.avancar(15500);
  ok(j.ev('arranque.ganhou') === 'local' && j.ev('state.reputacao') === 90, '(4) o local devia ganhar: ' + j.ev('arranque.ganhou'));
  ok(nuvem.escritas > 0 && JSON.parse(nuvem.dados.yc_state_parte_0).reputacao === 90, '(4) a nuvem devia ser alinhada com o local');
}

// (5) Reputação da nuvem maior: a nuvem ganha mesmo com o carimbo local mais recente (capítulos unidos).
{
  const nuvem = nuvemFalsa({});
  guardarNaNuvem(nuvem, { reputacao: 80, ultimaGravacaoEm: 5000, capitulos: { iniciado: true, concluidos: { cap2: true }, celebrados: { cap2: true }, celebradosMigrado: true } }, 5000);
  const ls = dadosLocais(50, 9000, { capitulos: { iniciado: true, concluidos: { cap1: true }, celebrados: { cap1: true }, celebradosMigrado: true } });
  const j = abrir(ls, { t: 20000 }, nuvem, true);
  ok(j.ev('arranque.ganhou') === 'nuvem (mais reputação)', '(5) devia ganhar a nuvem por reputação: ' + j.ev('arranque.ganhou'));
  ok(j.ev('state.reputacao') === 80, '(5) reputação devia ser 80');
  ok(j.ev('state.capitulos.concluidos.cap1') === true && j.ev('state.capitulos.concluidos.cap2') === true, '(5) os capítulos deviam juntar-se');
  // reputação igual e local mais recente: ganha o local
  const nuvem2 = nuvemFalsa({}); guardarNaNuvem(nuvem2, { reputacao: 50, ultimaGravacaoEm: 5000 }, 5000);
  const j2 = abrir(dadosLocais(50, 9000), { t: 20000 }, nuvem2, true);
  ok(j2.ev('arranque.ganhou') === 'local', '(5) com reputação igual o carimbo local devia ganhar');
}

// (6) cenário de 04/10 completo: aparelho velho, a nuvem falha ou responde vazia, o jogador
// joga um pouco, e só depois a nuvem (com o progresso do outro aparelho) responde bem.
{
  // 6a: erro + ação real; depois a nuvem boa responde. Antes: o local (carimbo novo) ganhava e a nuvem recuava.
  let nuvem = nuvemFalsa({}); guardarNaNuvem(nuvem, { reputacao: 80, uvas: 9, ultimaGravacaoEm: 5000 }, 5000);
  const antes = JSON.stringify(nuvem.dados);
  nuvem.modo = 'erro';
  let j = abrir(dadosLocais(50, 1000), { t: 9000 }, nuvem, true);
  j.ev('saveState(state);'); // gravação de arranque (objetivos do dia)
  j.tocar(); j.ev('state.reputacao += 2; saveState(state);'); // ação real: 52, carimbo "agora"
  j.avancar(10000);
  ok(JSON.stringify(nuvem.dados) === antes, '(6a) a nuvem mudou durante o erro');
  nuvem.modo = 'ok'; j.avancar(10000);
  ok(JSON.stringify(JSON.parse(nuvem.dados.yc_state_parte_0)) === JSON.stringify({ reputacao: 80, uvas: 9, ultimaGravacaoEm: 5000 }), '(6a) a nuvem boa foi sobreposta');
  ok(j.ev('state.reputacao') === 80, '(6a) a Reputação devia voltar a 80, está ' + j.ev('state.reputacao'));
  // 6b: a nuvem responde "vazio" uma vez (passageiro) com progresso local: não é copiado de imediato.
  nuvem = nuvemFalsa({}); guardarNaNuvem(nuvem, { reputacao: 80, uvas: 9, ultimaGravacaoEm: 5000 }, 5000);
  nuvem.vaziasPrimeiras = 1;
  j = abrir(dadosLocais(50, 1000), { t: 9000 }, nuvem, true);
  j.tocar(); j.ev('state.reputacao += 2; saveState(state);');
  ok(nuvem.escritas === 0, '(6b) o local foi enviado com a nuvem "vazia"');
  j.avancar(11000);
  ok(j.ev('state.reputacao') === 80 && nuvem.escritas === 0, '(6b) a nuvem boa devia ganhar sem ser sobreposta');
}

// (7) conta nova sem progresso local: sem esperas, e a 1.ª ação real é enviada normalmente.
{
  const nuvem = nuvemFalsa({});
  const j = abrir({}, { t: 9000 }, nuvem, true);
  ok(j.ev('arranque.respondeu') === true && j.ev('nuvemPodeEnviar()') === true, '(7) devia ficar liberto logo');
  ok(j.pendentes() === 0, '(7) não devia haver temporizadores à espera: ' + j.pendentes());
  ok(nuvem.leituras === 1 && nuvem.escritas === 0, '(7) só uma leitura e nada escrito');
  j.tocar(); j.ev('state.gotas = 1; saveState(state);'); j.avancar(1000);
  ok(nuvem.escritas > 0, '(7) a 1.ª ação real devia ser enviada');
}

// (8) conta antiga (sem state.proteger.isco) recebe o default null; um isco gravado mantém-se.
{
  const antiga = abrir({ yoshicat_quinta_state_v2: JSON.stringify({ reputacao: 50, ultimaGravacaoEm: 1000, proteger: { diaVitoriasLisboa: '2026-10-04', vitoriasComPremioHoje: 1 } }) }, { t: 9000 });
  ok(antiga.ev('state.proteger.isco') === null, '(8) conta antiga devia receber isco = null');
  ok(antiga.ev('state.proteger.vitoriasComPremioHoje') === 1, '(8) os campos antigos do Proteger deviam manter-se');
  ok(abrir({}, { t: 9000 }).ev('state.proteger.isco') === null, '(8) conta nova devia ter isco = null');
  const comIsco = abrir({ yoshicat_quinta_state_v2: JSON.stringify({ reputacao: 50, ultimaGravacaoEm: 1000, proteger: { isco: { dia: '2026-10-05', indice: 0, alvo: 'cave' } } }) }, { t: 9000 });
  ok(comIsco.ev("state.proteger.isco.alvo") === 'cave' && comIsco.ev('state.proteger.isco.indice') === 0, '(8) o isco gravado devia manter-se');
  // Estado da nuvem antigo (sem isco) adotado: recebe o default.
  const nuvem = nuvemFalsa({}); guardarNaNuvem(nuvem, { reputacao: 80, ultimaGravacaoEm: 5000, proteger: { vitoriasComPremioHoje: 2 } }, 5000);
  const j = abrir(dadosLocais(10, 1000), { t: 9000 }, nuvem, true);
  ok(j.ev('state.reputacao') === 80 && j.ev('state.proteger.isco') === null, '(8) estado da nuvem sem isco devia receber o default');
}

// (9) Caderno dos Fygmos (state.caderno.paginas): a junção é por UNIÃO e nunca perde páginas.
{
  const cap = { iniciado: true, concluidos: { cap1: true }, celebrados: { cap1: true }, celebradosMigrado: true };
  // Nuvem com mais Reputação (ganha a nuvem): local A + nuvem B = A e B.
  let nuvem = nuvemFalsa({});
  guardarNaNuvem(nuvem, { reputacao: 80, ultimaGravacaoEm: 5000, caderno: { paginas: { cave_1: '2026-10-02' } } }, 5000);
  let j = abrir(dadosLocais(50, 9000, { capitulos: cap, caderno: { paginas: { vinha_1: '2026-10-01' } } }), { t: 20000 }, nuvem, true);
  ok(j.ev('arranque.ganhou') === 'nuvem (mais reputação)', '(9a) devia ganhar a nuvem: ' + j.ev('arranque.ganhou'));
  ok(j.ev("state.caderno.paginas.vinha_1") === '2026-10-01' && j.ev("state.caderno.paginas.cave_1") === '2026-10-02', '(9a) as páginas A e B deviam juntar-se');
  ok(j.ev("Object.keys(state.caderno.paginas).length") === 2, '(9a) só devia haver 2 páginas');
  ok(j.ev("JSON.stringify(Object.keys(state.capitulos).sort())") === JSON.stringify(['celebrados', 'celebradosMigrado', 'concluidos', 'iniciado']) && j.ev('state.capitulos.concluidos.cap1') === true,
    '(9a) os capítulos não deviam ser tocados pelo caderno');

  // O local ganha e a nuvem tem páginas que o local não tem: união, e é enviada à nuvem.
  nuvem = nuvemFalsa({});
  guardarNaNuvem(nuvem, { reputacao: 40, ultimaGravacaoEm: 5000, caderno: { paginas: { adega_1: '2026-10-03', trovoada_rara: '2026-10-04' } } }, 5000);
  j = abrir(dadosLocais(50, 5000, { caderno: { paginas: { vinha_1: '2026-10-01' } } }), { t: 20000 }, nuvem, true);
  ok(j.ev('arranque.ganhou') === 'local', '(9b) devia ganhar o local: ' + j.ev('arranque.ganhou'));
  ok(j.ev("Object.keys(state.caderno.paginas).sort().join()") === 'adega_1,trovoada_rara,vinha_1', '(9b) devia ser a união: ' + j.ev("Object.keys(state.caderno.paginas).join()"));
  ok(nuvem.escritas > 0 && Object.keys(JSON.parse(nuvem.dados.yc_state_parte_0).caderno.paginas).length === 3, '(9b) a nuvem devia receber as 3 páginas');

  // Sem novidades (mesmas páginas dos dois lados, carimbos iguais): "mudou" não pode dar falso positivo.
  nuvem = nuvemFalsa({});
  guardarNaNuvem(nuvem, { reputacao: 50, ultimaGravacaoEm: 5000, caderno: { paginas: { vinha_1: '2026-10-01', adega_2: '2026-10-02' } } }, 5000);
  j = abrir(dadosLocais(50, 5000, { caderno: { paginas: { adega_2: '2026-10-02', vinha_1: '2026-10-01' } } }), { t: 20000 }, nuvem, true);
  ok(j.ev('arranque.ganhou') === 'local' && nuvem.escritas === 0, '(9c) sem novidades não devia haver escrita (' + nuvem.escritas + ')');

  // Mesma página com 2 datas: fica a mais antiga, venha de que lado vier.
  nuvem = nuvemFalsa({});
  guardarNaNuvem(nuvem, { reputacao: 80, ultimaGravacaoEm: 5000, caderno: { paginas: { vinha_1: '2026-10-05' } } }, 5000);
  j = abrir(dadosLocais(50, 9000, { caderno: { paginas: { vinha_1: '2026-10-03' } } }), { t: 20000 }, nuvem, true);
  ok(j.ev('state.caderno.paginas.vinha_1') === '2026-10-03', '(9d) devia ficar a data mais antiga (local)');
  nuvem = nuvemFalsa({});
  guardarNaNuvem(nuvem, { reputacao: 80, ultimaGravacaoEm: 5000, caderno: { paginas: { vinha_1: '2026-10-02' } } }, 5000);
  j = abrir(dadosLocais(50, 9000, { caderno: { paginas: { vinha_1: '2026-10-03' } } }), { t: 20000 }, nuvem, true);
  ok(j.ev('state.caderno.paginas.vinha_1') === '2026-10-02', '(9d) devia ficar a data mais antiga (nuvem)');

  // Save antigo sem 'caderno' (local e nuvem): não rebenta e fica o default.
  nuvem = nuvemFalsa({}); guardarNaNuvem(nuvem, { reputacao: 80, ultimaGravacaoEm: 5000 }, 5000);
  j = abrir(dadosLocais(50, 9000), { t: 20000 }, nuvem, true);
  ok(j.ev("JSON.stringify(state.caderno)") === '{"paginas":{}}', '(9e) save antigo devia ter caderno vazio: ' + j.ev("JSON.stringify(state.caderno)"));
  ok(abrir({}, { t: 9000 }).ev("JSON.stringify(state.caderno)") === '{"paginas":{}}', '(9e) conta nova devia ter caderno vazio');

  // Função pura: tipos errados ignoram-se, entradas boas ficam, nada é alterado nos argumentos.
  j = abrir({}, { t: 9000 }, nuvemFalsa({}), true);
  const f = function (a, b) { return j.ev('JSON.stringify(nuvemJuntarCaderno(' + JSON.stringify(a) + ',' + JSON.stringify(b) + '))'); };
  const vazio = '{"paginas":{}}';
  ok(f(null, undefined) === vazio && f('x', 5) === vazio && f([], {}) === vazio, '(9f) lados que não são objetos dão caderno vazio');
  ok(f({ paginas: [1, 2] }, { paginas: 'lixo' }) === vazio, '(9f) paginas que não é objeto ignora-se');
  ok(f({ paginas: { a: 5, b: 'lixo', c: '2026-01-02', d: null, e: '2026-13' } }, null) === '{"paginas":{"c":"2026-01-02"}}', '(9f) entradas com tipo ou data erradas ignoram-se: ' + f({ paginas: { a: 5, b: 'lixo', c: '2026-01-02', d: null, e: '2026-13' } }, null));
  ok(j.ev('Object.keys(nuvemJuntarCaderno(JSON.parse(\'{"paginas":{"__proto__":"2026-01-01"}}\'), null).paginas).length') === 0, '(9f) a chave __proto__ devia ignorar-se');
  ok(j.ev("({}).caderno === undefined && ({}).vinha_1 === undefined"), '(9f) o protótipo não devia ser alterado');
  const a = { paginas: { x1: '2026-10-02' } }; const b = { paginas: { y1: '2026-10-01' } };
  j.ev('var _a = ' + JSON.stringify(a) + ', _b = ' + JSON.stringify(b) + '; nuvemJuntarCaderno(_a, _b);');
  ok(j.ev('JSON.stringify(_a)') === JSON.stringify(a) && j.ev('JSON.stringify(_b)') === JSON.stringify(b), '(9f) os argumentos não deviam ser alterados');
}

console.log(falhas === 0 ? 'OK' : falhas + ' FALHA(S)');
process.exit(falhas === 0 ? 0 : 1);
