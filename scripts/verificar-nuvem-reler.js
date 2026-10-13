#!/usr/bin/env node
// Verifica a releitura da nuvem ao voltar à app (nuvemRelerAoVoltar() / nuvemReler() / nuvemAplicarReleitura(), js/nuvem.js).
// Só LÊ js/, corre-os num ambiente simulado (vm) com uma nuvem falsa em memória: nunca toca em browser, Telegram nem conta real.
//
//   (a) menos de 2 min escondida: não lê
//   (b) 2 min ou mais: lê uma vez e não em duplicado (evento repetido, leitura ainda por responder, nova leitura antes de 2 min)
//   (c) nuvem mais recente: adota-a e junta, sem perder nada do local (capítulos, caderno e áreas leves)
//   (d) nuvem mais antiga: o local fica e a nuvem é alinhada (uma gravação)
//   (e) 'erro' e 'vazio': nada muda, nada é gravado
//   (f) apagando = true: nada (antes de ler e com a resposta a chegar depois)
//   (g) gravação pendente: é enviada antes de ler; resposta que chega com gravação por enviar não é aplicada
//   (h) repetir a releitura sem novidades não grava
//   (i) entradas estragadas não rebentam
//   (j) ecrãs a meio de uma ação (Lagar, Garrafa, ...): não troca o estado e tenta na volta seguinte (sem esperar outros 2 min)
//   (k) a resposta que chega depois de a app voltar a esconder ignora-se
// No fim corre mutações: estraga js/nuvem.js de propósito e confirma que este teste dá por isso.
//
// Uso: node scripts/verificar-nuvem-reler.js
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const STATE_JS = fs.readFileSync(path.join(RAIZ, 'js', 'state.js'), 'utf8');
const NUVEM_JS = fs.readFileSync(path.join(RAIZ, 'js', 'nuvem.js'), 'utf8');
const AREAS = ['despensa', 'visitas', 'lagar', 'camara', 'roxo', 'loja', 'reserva', 'colecao'];
const CHAVE = 'yoshicat_quinta_state_v2';
const MIN = 60000;

// Nuvem falsa (CloudStorage) em memória. modo: 'ok' | 'erro' | 'vazio' | 'pausa' (guarda as respostas até soltar()).
function nuvemFalsa() {
  const dados = {};
  const f = { dados: dados, modo: 'ok', escritas: 0, eventos: [], presas: [] };
  function responde(cb, erro, valor) {
    if (f.modo === 'erro') { cb(new Error('avaria')); return; }
    if (f.modo === 'pausa') { f.presas.push(function () { cb(erro, valor); }); return; }
    cb(erro, valor);
  }
  f.getItem = function (k, cb) {
    f.eventos.push('get');
    if (f.modo === 'vazio' && k === 'yc_state_meta') { cb(null, ''); return; }
    responde(cb, null, Object.prototype.hasOwnProperty.call(dados, k) ? dados[k] : '');
  };
  f.getItems = function (ks, cb) {
    f.eventos.push('get');
    const r = {};
    ks.forEach(function (k) { r[k] = Object.prototype.hasOwnProperty.call(dados, k) ? dados[k] : ''; });
    responde(cb, null, r);
  };
  f.setItem = function (k, v, cb) { f.escritas++; f.eventos.push('set'); dados[k] = v; if (cb) cb(null, true); };
  f.soltar = function () { const p = f.presas; f.presas = []; p.forEach(function (fn) { fn(); }); };
  return f;
}

function guardarNaNuvem(nuvem, estado, em) {
  nuvem.dados.yc_state_meta = JSON.stringify({ partes: 1, atualizadoEm: em });
  nuvem.dados.yc_state_parte_0 = JSON.stringify(estado);
}

// Abre o "jogo" (state.js e a fonte de nuvem.js dada) num ambiente simulado, com relógio e visibilidade controlados.
function abrir(fonteNuvem, localStorageDados, relogio, nuvem, ecra) {
  const pointer = [];
  const visib = [];
  const temporizadores = [];
  let proximoId = 1;
  const doc = {
    addEventListener: function (tipo, fn) {
      if (tipo === 'pointerdown') pointer.push(fn);
      if (tipo === 'visibilitychange') visib.push(fn);
    },
    querySelectorAll: function () { return []; },
    querySelector: function (sel) { return sel === '.screen.active' && doc.ecra ? { id: 'screen-' + doc.ecra } : null; },
    getElementById: function () { return null; },
    visibilityState: 'visible',
    ecra: ecra === undefined ? 'quinta' : ecra
  };
  const sandbox = {
    console: { log() {}, warn() {}, error() {} },
    localStorage: {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(localStorageDados, k) ? localStorageDados[k] : null; },
      setItem: function (k, v) { localStorageDados[k] = String(v); },
      removeItem: function (k) { delete localStorageDados[k]; }
    },
    location: { search: '' },
    URLSearchParams: URLSearchParams,
    document: doc,
    setTimeout: function (fn, ms) { const id = proximoId++; temporizadores.push({ id: id, em: relogio.t + (ms || 0), fn: fn }); return id; },
    clearTimeout: function (id) { const i = temporizadores.findIndex(function (x) { return x.id === id; }); if (i !== -1) temporizadores.splice(i, 1); },
    applyTranslations: function () {},
    t: function (k) { return k; },
    Date: class extends Date { static now() { return relogio.t; } }
  };
  sandbox.window = sandbox;
  sandbox.window.addEventListener = function () {};
  sandbox.Telegram = { WebApp: { initDataUnsafe: { a: 1 }, CloudStorage: nuvem } };
  const ctx = vm.createContext(sandbox);
  vm.runInContext(STATE_JS, ctx, { filename: 'state.js' });
  vm.runInContext(fonteNuvem, ctx, { filename: 'nuvem.js' });
  // Conta as leituras da releitura (nuvemLerEstado) e as chamadas a nuvemAtualizarEcraAposSync.
  vm.runInContext('var _lerN = 0; (function () { const o = nuvemLerEstado; nuvemLerEstado = function (cb) { _lerN++; return o(cb); }; })();', ctx);
  const g = {
    doc: doc,
    ev: function (codigo) { return vm.runInContext(codigo, ctx); },
    tocar: function () { pointer.forEach(function (fn) { fn(); }); },
    estado: function () { return JSON.parse(vm.runInContext('JSON.stringify(state)', ctx)); },
    leituras: function () { return vm.runInContext('_lerN', ctx); },
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
    evento: function (estado) { doc.visibilityState = estado; visib.slice().forEach(function (fn) { fn(); }); },
    // esconde, espera ms e volta
    ciclo: function (ms) { g.evento('hidden'); g.avancar(ms); g.evento('visible'); }
  };
  return g;
}

function J(x) { return JSON.stringify(x); }
const base = function (rep, em, extra) { return Object.assign({ reputacao: rep, ultimaGravacaoEm: em }, extra); };

// Um jogo aberto e já sincronizado (a leitura da abertura respondeu) com o local; depois a nuvem passa a ter nuvemEstado (outro aparelho a gravar).
function jogo(fonte, localEstado, nuvemEstado, ecra) {
  const nuvem = nuvemFalsa();
  guardarNaNuvem(nuvem, localEstado, localEstado.ultimaGravacaoEm); // à abertura a nuvem é igual ao local: nada a decidir
  const ls = {}; ls[CHAVE] = J(localEstado);
  const relogio = { t: 1000000 };
  const g = abrir(fonte, ls, relogio, nuvem, ecra);
  g.avancar(2000); // leitura da abertura
  guardarNaNuvem(nuvem, nuvemEstado, nuvemEstado.ultimaGravacaoEm); // e só agora o outro aparelho grava
  nuvem.escritas = 0;
  return { g: g, nuvem: nuvem, ls: ls, relogio: relogio };
}

function correr(fonte) {
  const falhas = [];
  function ok(cond, msg) { if (!cond) falhas.push(msg); }

  const lagarA = { ultimoDia: '2026-10-10', dias: 3, mesaDia: '2026-10-10', assaltoDia: '2026-10-09' };
  const lojaB = { dia: '2026-10-11', vendasHoje: 2 };
  const em = 500000; // carimbos (ms) anteriores ao relógio do jogo

  // ---------------------------------------------------------------- (a) menos de 2 min escondida: não lê
  {
    const x = jogo(fonte, base(100, em, {}), base(100, em, {}));
    const n0 = x.g.leituras();
    ok(x.g.ev('arranque.respondeu') === true, '(a) a abertura devia ter sincronizado');
    x.g.ciclo(MIN * 2 - 1);
    ok(x.g.leituras() === n0, '(a) 1 ms antes dos 2 min escondida não devia ler');
    x.g.ciclo(30000);
    ok(x.g.leituras() === n0, '(a) 30 s escondida não devia ler');
    // visível sem nunca ter ficado escondida
    x.g.evento('visible');
    ok(x.g.leituras() === n0, '(a) visible sem hidden antes não devia ler');
  }

  // ---------------------------------------------------------------- (b) 2 min ou mais: lê uma vez, não em duplicado
  {
    const x = jogo(fonte, base(100, em, {}), base(100, em, {}));
    const n0 = x.g.leituras();
    x.g.ciclo(MIN * 2);
    ok(x.g.leituras() === n0 + 1, '(b) com 2 min escondida devia ler uma vez, leu ' + (x.g.leituras() - n0));
    x.g.evento('visible'); // o mesmo "visible" a chegar duas vezes
    x.g.evento('visible');
    ok(x.g.leituras() === n0 + 1, '(b) "visible" repetido não devia voltar a ler');
    x.g.ciclo(MIN); // 1 min escondida: não
    ok(x.g.leituras() === n0 + 1, '(b) 1 min depois da leitura não devia ler outra vez');
    x.g.ciclo(MIN * 5);
    ok(x.g.leituras() === n0 + 2, '(b) 5 min depois devia ler outra vez, uma só');
  }
  {
    // leitura ainda por responder: um segundo "visible" não abre outra
    const x = jogo(fonte, base(100, em, {}), base(100, em, {}));
    const n0 = x.g.leituras();
    x.nuvem.modo = 'pausa';
    x.g.ciclo(MIN * 3);
    ok(x.g.leituras() === n0 + 1, '(b) a leitura devia ter começado');
    x.g.evento('visible');
    x.g.evento('visible');
    ok(x.g.leituras() === n0 + 1, '(b) com uma leitura por responder não devia abrir outra');
    x.nuvem.modo = 'ok';
    x.nuvem.soltar();
  }
  {
    // leitura que ficou sem resposta (desiste aos 8 s): não repete antes de passarem 2 min
    const x = jogo(fonte, base(100, em, {}), base(100, em, {}));
    const n0 = x.g.leituras();
    x.nuvem.modo = 'pausa';
    x.g.ciclo(MIN * 3);      // começa a leitura (nunca responde)
    x.g.evento('hidden');
    x.g.avancar(MIN * 2);    // desiste aos 8 s; passam-se mais de 2 min escondida, mas <2 min desde que desistiu
    x.g.evento('visible');
    ok(x.g.leituras() === n0 + 1, '(b) menos de 2 min depois da última leitura não devia ler outra vez, leu ' + (x.g.leituras() - n0));
  }

  // ---------------------------------------------------------------- (c) nuvem mais recente: adota e junta
  {
    const local = base(100, em, {
      lagar: lagarA,
      capitulos: { iniciado: true, concluidos: { cap1: true }, celebrados: { cap1: true }, celebradosMigrado: true },
      caderno: { paginas: { pag_local: '2026-10-01' } }
    });
    const nuvemEstado = base(150, em + 100000, { loja: lojaB, capitulos: { iniciado: true, concluidos: { cap2: true }, celebrados: {}, celebradosMigrado: false } });
    const x = jogo(fonte, local, nuvemEstado);
    x.g.ciclo(MIN * 3);
    const e = x.g.estado();
    ok(e.reputacao === 150, '(c) devia adotar a nuvem mais recente (Reputação 150), tem ' + e.reputacao);
    ok(e.ultimaGravacaoEm === em + 100000, '(c) devia ficar com o carimbo da nuvem');
    ok(J(e.lagar) === J(lagarA), '(c) o Lagar local devia ficar: ' + J(e.lagar));
    ok(J(e.loja) === J(lojaB), '(c) a Loja da nuvem devia vir: ' + J(e.loja));
    ok(e.capitulos.concluidos.cap1 === true && e.capitulos.concluidos.cap2 === true, '(c) os capítulos juntam-se por união: ' + J(e.capitulos));
    const ls = JSON.parse(x.ls[CHAVE]);
    ok(ls.reputacao === 150 && J(ls.lagar) === J(lagarA), '(c) o localStorage devia ficar com o estado adotado e juntado');
    ok(x.g.ev('arranque.respondeu') === true, '(c) arranque.respondeu devia continuar true');
  }
  {
    // a nuvem tem mais Reputação mas um carimbo mais antigo: também ganha
    const x = jogo(fonte, base(100, em, { lagar: lagarA }), base(130, em - 10000, { loja: lojaB }));
    x.g.ciclo(MIN * 3);
    const e = x.g.estado();
    ok(e.reputacao === 130 && J(e.lagar) === J(lagarA) && J(e.loja) === J(lojaB), '(c) com mais Reputação a nuvem ganha e o local não se perde: ' + J({ r: e.reputacao, l: e.lagar, lo: e.loja }));
  }

  // ---------------------------------------------------------------- (d) nuvem mais antiga: o local fica e a nuvem é alinhada
  {
    const local = base(200, em + 100000, { lagar: lagarA });
    const nuvemEstado = base(100, em, { loja: lojaB });
    const x = jogo(fonte, local, nuvemEstado);
    const esc0 = x.nuvem.escritas;
    x.g.ciclo(MIN * 3);
    const e = x.g.estado();
    ok(e.reputacao === 200 && e.ultimaGravacaoEm === em + 100000, '(d) o local mais recente devia ficar: ' + e.reputacao);
    ok(J(e.lagar) === J(lagarA) && J(e.loja) === J(lojaB), '(d) o local fica e junta o que a nuvem tinha a mais: ' + J({ l: e.lagar, lo: e.loja }));
    ok(x.nuvem.escritas > esc0, '(d) a nuvem devia ser alinhada com o local');
    const naNuvem = JSON.parse(x.nuvem.dados.yc_state_parte_0);
    ok(naNuvem.reputacao === 200 && J(naNuvem.loja) === J(lojaB) && J(naNuvem.lagar) === J(lagarA), '(d) a nuvem devia ficar com o local já juntado');
  }

  {
    // só o carimbo do local é mais recente (nada a juntar): a nuvem é alinhada na mesma
    const x = jogo(fonte, base(100, em + 100000, { lagar: lagarA }), base(100, em, { lagar: lagarA }));
    x.g.ciclo(MIN * 3);
    ok(x.nuvem.escritas > 0 && JSON.parse(x.nuvem.dados.yc_state_parte_0).ultimaGravacaoEm === em + 100000 || JSON.parse(x.nuvem.dados.yc_state_meta).atualizadoEm === em + 100000, '(d) só com o carimbo mais recente a nuvem devia ser alinhada');
  }

  // ---------------------------------------------------------------- (e) erro e vazio: nada muda, nada é gravado
  ['erro', 'vazio'].forEach(function (modo) {
    const x = jogo(fonte, base(100, em, { lagar: lagarA }), base(150, em + 100000, { loja: lojaB }));
    const antes = J(x.g.estado()), lsAntes = x.ls[CHAVE], dadosAntes = J(x.nuvem.dados);
    x.nuvem.modo = modo === 'erro' ? 'erro' : 'vazio';
    const esc0 = x.nuvem.escritas, n0 = x.g.leituras();
    x.g.ciclo(MIN * 3);
    ok(x.g.leituras() === n0 + 1, '(e) ' + modo + ': devia ter tentado ler');
    ok(J(x.g.estado()) === antes, '(e) ' + modo + ': o estado não devia mudar');
    ok(x.ls[CHAVE] === lsAntes, '(e) ' + modo + ': o localStorage não devia mudar');
    ok(x.nuvem.escritas === esc0 && J(x.nuvem.dados) === dadosAntes, '(e) ' + modo + ': não devia gravar nada na nuvem');
    ok(x.g.ev('arranque.nuvemErro') === false && x.g.ev('arranque.respondeu') === true && x.g.ev('arranque.adiada') === false, '(e) ' + modo + ': não devia marcar erro nem mexer no arranque');
    ok(x.g.ev('_nuvemTimerReleitura') === null, '(e) ' + modo + ': não devia agendar releituras');
    x.g.avancar(MIN * 10);
    ok(x.nuvem.escritas === esc0 && x.g.leituras() === n0 + 1, '(e) ' + modo + ': não devia haver temporizadores a gravar ou a ler');
    // com a nuvem de volta, a leitura seguinte (2 min depois) já adota
    x.nuvem.modo = 'ok';
    x.g.ciclo(MIN * 3);
    ok(x.g.estado().reputacao === 150, '(e) ' + modo + ': depois de a nuvem voltar, a releitura seguinte devia adotá-la');
  });

  // ---------------------------------------------------------------- (f) apagando = true: nada
  {
    const x = jogo(fonte, base(100, em, {}), base(150, em + 100000, { loja: lojaB }));
    const antes = J(x.g.estado()), lsAntes = x.ls[CHAVE];
    x.g.ev('apagando = true');
    const n0 = x.g.leituras();
    x.g.ciclo(MIN * 3);
    ok(x.g.leituras() === n0, '(f) a apagar: não devia ler');
    ok(J(x.g.estado()) === antes && x.ls[CHAVE] === lsAntes, '(f) a apagar: nada devia mudar');
  }
  {
    // a resposta chega já com apagando = true
    const x = jogo(fonte, base(100, em, {}), base(150, em + 100000, { loja: lojaB }));
    const antes = J(x.g.estado()), lsAntes = x.ls[CHAVE];
    x.nuvem.modo = 'pausa';
    x.g.ciclo(MIN * 3);
    x.g.ev('apagando = true');
    x.nuvem.modo = 'ok';
    x.nuvem.soltar();
    ok(J(x.g.estado()) === antes && x.ls[CHAVE] === lsAntes, '(f) resposta com apagando = true: devia ignorar-se');
    ok(x.nuvem.escritas === 0, '(f) resposta com apagando = true: não devia gravar');
  }

  // ---------------------------------------------------------------- (g) gravação pendente: enviada antes de ler
  {
    const x = jogo(fonte, base(100, em, {}), base(100, em, {}));
    x.g.evento('hidden');
    x.g.avancar(MIN * 3);
    x.g.doc.visibilityState = 'visible';
    x.g.tocar();
    x.g.ev('state.reputacao = 120; saveState(state);'); // grava já no aparelho e deixa a da nuvem por enviar (800 ms)
    ok(x.g.ev('_nuvemTimerGravacao !== null'), '(g) devia haver uma gravação pendente');
    x.nuvem.eventos.length = 0;
    const n0 = x.g.leituras(), esc0 = x.nuvem.escritas;
    x.g.evento('visible');
    ok(x.nuvem.escritas > esc0 && x.nuvem.eventos[0] === 'set', '(g) a gravação pendente devia ser enviada primeiro: ' + x.nuvem.eventos.join(','));
    ok(x.g.leituras() === n0, '(g) nessa volta não devia ler (a gravação ainda decorre ou acabou de sair)');
    ok(JSON.parse(x.nuvem.dados.yc_state_parte_0).reputacao === 120, '(g) a nuvem devia ter a gravação pendente');
    // na volta seguinte, mesmo curta, lê (tinha ficado adiada)
    x.g.ciclo(5000);
    ok(x.g.leituras() === n0 + 1, '(g) na volta seguinte devia ler, mesmo sem 2 min escondida, leu ' + (x.g.leituras() - n0));
  }
  {
    // a resposta chega, mas entretanto há uma gravação por enviar: não troca o estado
    const nuvemEstado = base(150, em + 100000, { loja: lojaB });
    const x = jogo(fonte, base(100, em, {}), nuvemEstado);
    x.nuvem.modo = 'pausa';
    x.g.ciclo(MIN * 3);
    x.g.tocar();
    x.g.ev('state.reputacao = 101; saveState(state);'); // a meio da leitura o jogador faz algo
    x.nuvem.modo = 'ok';
    x.nuvem.soltar();
    ok(x.g.estado().reputacao === 101, '(g) com uma gravação por enviar não devia trocar o estado, tem ' + x.g.estado().reputacao);
    x.g.avancar(2000); // a gravação sai
    ok(JSON.parse(x.nuvem.dados.yc_state_parte_0).reputacao === 101 || x.nuvem.escritas > 0, '(g) a gravação pendente devia sair');
  }

  // ---------------------------------------------------------------- (h) repetir sem novidades não grava
  {
    const igual = base(100, em, { lagar: lagarA, loja: lojaB });
    const x = jogo(fonte, igual, igual);
    const esc0 = x.nuvem.escritas;
    x.g.ciclo(MIN * 3);
    x.g.ciclo(MIN * 3);
    x.g.ciclo(MIN * 3);
    ok(x.g.leituras() === 3, '(h) devia ter lido 3 vezes, leu ' + x.g.leituras());
    ok(x.nuvem.escritas === esc0, '(h) sem novidades não devia gravar nada, gravou ' + (x.nuvem.escritas - esc0) + ' vezes');
    ok(J(x.g.estado().lagar) === J(lagarA), '(h) o estado devia ficar igual');
  }
  {
    // depois de adotar, as releituras seguintes também não gravam
    const x = jogo(fonte, base(100, em, { lagar: lagarA }), base(150, em + 100000, { loja: lojaB }));
    x.g.ciclo(MIN * 3);
    const esc0 = x.nuvem.escritas;
    x.g.ciclo(MIN * 3);
    x.g.ciclo(MIN * 3);
    ok(x.nuvem.escritas === esc0, '(h) depois de adotar, reler sem novidades não devia gravar, gravou ' + (x.nuvem.escritas - esc0) + ' vezes');
  }

  // ---------------------------------------------------------------- (i) entradas estragadas não rebentam
  {
    const lixos = [
      { reputacao: 'muita', ultimaGravacaoEm: 'ontem' },
      { reputacao: null, capitulos: 5, caderno: 'x', despensa: [], visitas: 7, lagar: 'x', loja: null },
      { reputacao: 150, ultimaGravacaoEm: em + 100000, capitulos: { concluidos: [1, 2], celebrados: 'x' }, caderno: { paginas: 5 }, camara: [], roxo: 'x', colecao: 9 },
      { reputacao: 90, ultimaGravacaoEm: em - 1, despensa: { recebidos: { a: 'x', b: -3 }, hoje: 'x' }, visitas: { feitas: [], hoje: { dia: 5 } } },
      JSON.parse('{"reputacao":120,"ultimaGravacaoEm":' + (em + 5) + ',"__proto__":{"x":1},"despensa":{"recebidos":{"__proto__":9}}}')
    ];
    lixos.forEach(function (lixo, i) {
      try {
        const x = jogo(fonte, base(100, em, { lagar: lagarA }), base(100, em, {}));
        guardarNaNuvem(x.nuvem, lixo, lixo.ultimaGravacaoEm);
        x.g.ciclo(MIN * 3);
        const e = x.g.estado();
        ok(typeof e === 'object' && e !== null && AREAS.every(function (k) { return e[k] && typeof e[k] === 'object'; }), '(i) lixo ' + i + ': o estado devia continuar completo');
        ok(({}).x === undefined, '(i) lixo ' + i + ': Object.prototype alterado');
        // um nuvemLerEstado a devolver lixo diretamente (sem passar pela validação do JSON)
        x.g.ev('(function () { const o = nuvemLerEstado; nuvemLerEstado = function (cb) { cb(5, "ok"); }; })();');
        x.g.ciclo(MIN * 3);
        x.g.ev('(function () { const o = nuvemLerEstado; nuvemLerEstado = function (cb) { cb(null, "ok"); }; })();');
        x.g.ciclo(MIN * 3);
        x.g.ev('(function () { nuvemLerEstado = function (cb) { cb([1], "ok"); }; })();');
        x.g.ciclo(MIN * 3);
        x.g.ev('(function () { nuvemLerEstado = function (cb) { cb(undefined, undefined); }; })();');
        x.g.ciclo(MIN * 3);
      } catch (err) { ok(false, '(i) lixo ' + i + ' rebentou: ' + err.message); }
    });
    // o estado local estragado também não rebenta
    try {
      const x = jogo(fonte, base(100, em, {}), base(150, em + 100000, { loja: lojaB }));
      x.g.ev('state.capitulos = null; state.caderno = 5; state.lagar = "x"; state.despensa = null;');
      x.g.ciclo(MIN * 3);
      ok(x.g.estado().reputacao === 150, '(i) com o local estragado a nuvem mais recente devia ser adotada');
    } catch (err) { ok(false, '(i) local estragado rebentou: ' + err.message); }
  }

  // ---------------------------------------------------------------- (j) ecrãs a meio de uma ação
  ['lagar', 'garrafa', 'engarrafar', 'camara', 'roxo', 'loja', 'vinha', 'proteger', 'estrada', 'colecao', 'explorar', 'festa', 'garrafas', 'conquistas', 'lingua'].forEach(function (ecra) {
    const x = jogo(fonte, base(100, em, { lagar: lagarA }), base(150, em + 100000, { loja: lojaB }), ecra);
    const antes = J(x.g.estado()), lsAntes = x.ls[CHAVE];
    x.g.ciclo(MIN * 3);
    ok(J(x.g.estado()) === antes && x.ls[CHAVE] === lsAntes, '(j) no ecrã ' + ecra + ' não devia trocar o estado');
    x.g.doc.ecra = 'quinta'; // sai do ecrã para a Quinta; a volta seguinte, mesmo curta, aplica
    x.g.ciclo(5000);
    ok(x.g.estado().reputacao === 150 && J(x.g.estado().lagar) === J(lagarA), '(j) ' + ecra + ': na volta seguinte (já na Quinta) devia aplicar');
  });
  ['home', 'quinta', 'perfil', 'enciclopedia', 'caderno'].forEach(function (ecra) {
    const x = jogo(fonte, base(100, em, {}), base(150, em + 100000, { loja: lojaB }), ecra);
    x.g.ciclo(MIN * 3);
    ok(x.g.estado().reputacao === 150, '(j) no ecrã ' + ecra + ' devia aplicar');
  });
  {
    // a leitura começa na Quinta e o jogador entra no Lagar antes da resposta
    const x = jogo(fonte, base(100, em, {}), base(150, em + 100000, { loja: lojaB }));
    x.nuvem.modo = 'pausa';
    x.g.ciclo(MIN * 3);
    x.g.doc.ecra = 'lagar';
    x.nuvem.modo = 'ok';
    x.nuvem.soltar();
    ok(x.g.estado().reputacao === 100, '(j) resposta com o Lagar ativo não devia trocar o estado');
  }

  // ---------------------------------------------------------------- (k) resposta depois de voltar a esconder
  {
    const x = jogo(fonte, base(100, em, {}), base(150, em + 100000, { loja: lojaB }));
    const antes = J(x.g.estado());
    x.nuvem.modo = 'pausa';
    x.g.ciclo(MIN * 3);
    x.g.evento('hidden');
    x.nuvem.modo = 'ok';
    x.nuvem.soltar();
    ok(J(x.g.estado()) === antes, '(k) resposta depois de voltar a esconder devia ignorar-se');
  }

  // ---------------------------------------------------------------- sem nuvem / abertura ainda sem resposta
  {
    const x = jogo(fonte, base(100, em, {}), base(150, em + 100000, {}));
    x.g.ev('arranque.respondeu = false');
    const n0 = x.g.leituras();
    x.g.ciclo(MIN * 3);
    ok(x.g.leituras() === n0, 'com arranque.respondeu = false não devia reler');
  }
  return falhas;
}

// ---------------------------------------------------------------- corrida a sério
const falhasReais = correr(NUVEM_JS);
falhasReais.slice(0, 40).forEach(function (m) { console.log('FALHA: ' + m); });
if (falhasReais.length > 40) console.log('... e mais ' + (falhasReais.length - 40) + ' falhas');
let falhou = falhasReais.length;

// ---------------------------------------------------------------- mutações: estragar nuvem.js de propósito
// Cada mutação é uma lista de [texto, substituto]; todas têm de aparecer em nuvem.js.
const MUTACOES = [
  ['tirar o limite de 2 min escondida', [['(desde !== null && agora - desde >= NUVEM_RELER_ESCONDIDA_MS)', '(desde !== null)']]],
  ['limite de escondida de 2 min passa a 1 min', [['const NUVEM_RELER_ESCONDIDA_MS = 120000;', 'const NUVEM_RELER_ESCONDIDA_MS = 60000;']]],
  ['tirar o limite de 2 min desde a última releitura', [['if (desdeUltima >= 0 && desdeUltima < NUVEM_RELER_ENTRE_MS) return;', '']]],
  ['tratar o erro (e o vazio) como nuvem vazia: grava o local', [["if (estatus !== 'ok' || !estadoNuvem || typeof estadoNuvem !== 'object') {\n      _nuvemUltimaReleitura = Date.now();", "if (estatus !== 'ok' || !estadoNuvem || typeof estadoNuvem !== 'object') {\n      nuvemGuardarEstado(state);\n      _nuvemUltimaReleitura = Date.now();"]]],
  ['o erro marca erro no arranque e agenda releitura', [["if (estatus !== 'ok' || !estadoNuvem || typeof estadoNuvem !== 'object') {\n      _nuvemUltimaReleitura = Date.now();", "if (estatus !== 'ok' || !estadoNuvem || typeof estadoNuvem !== 'object') {\n      if (estatus === 'erro') { arranque.nuvemErro = true; nuvemAgendarReleitura(); }\n      _nuvemUltimaReleitura = Date.now();"]]],
  ['não ignorar apagando (resposta)', [['if (apagando || volta !== _nuvemRelerVoltas', 'if (volta !== _nuvemRelerVoltas']]],
  ['não ignorar apagando (ao voltar)', [['if (apagando || !arranque.respondeu || _nuvemALer || _nuvemRelerEmCurso || !nuvemStorage()) return;', 'if (!arranque.respondeu || _nuvemALer || _nuvemRelerEmCurso || !nuvemStorage()) return;'], ['function nuvemReler() {\n  if (apagando || ', 'function nuvemReler() {\n  if (']]],
  ['adotar a nuvem mais antiga', [['(localEm >= nuvemEm && !nuvemTemMaisReputacao) {\n    const juntos', '(localEm <= nuvemEm && !nuvemTemMaisReputacao) {\n    const juntos']]],
  ['a nuvem mais antiga não alinha a nuvem', [['if (localEm > nuvemEm || mudou) nuvemGuardarEstado(state); // alinha', 'if (mudou) nuvemGuardarEstado(state); // alinha']]],
  ['gravar sempre ao reler', [['if (localEm > nuvemEm || mudou) nuvemGuardarEstado(state); // alinha', 'nuvemGuardarEstado(state); // alinha']]],
  ['ler em duplicado (sem guardas de leitura em curso nem reposição do instante escondido)', [['|| _nuvemRelerEmCurso || !nuvemStorage()) return;', '|| !nuvemStorage()) return;'], ['if (apagando || !arranque.respondeu || _nuvemALer || _nuvemRelerEmCurso) return;\n  const volta', 'if (apagando || !arranque.respondeu || _nuvemALer) return;\n  const volta'], ['  const desde = _nuvemEscondidaDesde;\n  _nuvemEscondidaDesde = null;', '  const desde = _nuvemEscondidaDesde;'], ['if (desdeUltima >= 0 && desdeUltima < NUVEM_RELER_ENTRE_MS) return;', '']]],
  ['ler com uma gravação pendente (sem a enviar antes)', [['if (_nuvemTimerGravacao || _nuvemEstadoPendente || nuvemGravacaoEmCurso()) {\n    nuvemGravarJa();', 'if (false) {\n    nuvemGravarJa();']]],
  ['aplicar com uma gravação por enviar', [['return !_nuvemTimerGravacao && !_nuvemEstadoPendente && !nuvemGravacaoEmCurso() && nuvemEcraSeguroParaReler();', 'return nuvemEcraSeguroParaReler();']]],
  ['aplicar em qualquer ecrã', [['return NUVEM_RELER_ECRAS_SEGUROS.indexOf(String(ativo.id).replace(/^screen-/, \'\')) !== -1;', 'return true;']]],
  ['não tentar na volta seguinte (esquecer o adiamento)', [['if (!nuvemRelerPodeAplicar()) { _nuvemRelerAdiada = true; return; }', 'if (!nuvemRelerPodeAplicar()) { _nuvemUltimaReleitura = Date.now(); return; }']]],
  ['aplicar uma resposta que chega depois de voltar a esconder', [["|| document.visibilityState === 'hidden') return;", ') return;'], ['volta !== _nuvemRelerVoltas', 'false']]],
  ['a nuvem que ganha não junta as áreas leves', [['const levesJuntas = nuvemJuntarLeves(state, estadoLocalAntes);\n  NUVEM_LEVES_AREAS.forEach(function (k) { state[k] = levesJuntas[k]; });\n  localStorage', 'localStorage']]],
  ['a nuvem que ganha não junta os capítulos', [['state.capitulos = nuvemJuntarCapitulos(capitulosLocais, state.capitulos);\n  state.caderno = nuvemJuntarCaderno(cadernoLocal, state.caderno);\n  const levesJuntas', 'const levesJuntas']]],
  ['reler mesmo sem a abertura ter respondido', [['if (apagando || !arranque.respondeu || _nuvemALer || _nuvemRelerEmCurso || !nuvemStorage()) return;', 'if (apagando || _nuvemALer || _nuvemRelerEmCurso || !nuvemStorage()) return;'], ['function nuvemReler() {\n  if (apagando || !arranque.respondeu || ', 'function nuvemReler() {\n  if (apagando || ']]]
];
let apanhadas = 0;
MUTACOES.forEach(function (m) {
  let fonte = NUVEM_JS;
  for (let i = 0; i < m[1].length; i++) {
    if (fonte.split(m[1][i][0]).length < 2) { console.log('FALHA: mutação impossível (texto não encontrado em nuvem.js): ' + m[0] + ' -> ' + m[1][i][0].slice(0, 60)); falhou++; return; }
    fonte = fonte.split(m[1][i][0]).join(m[1][i][1]);
  }
  const f = correr(fonte);
  if (f.length === 0) { console.log('FALHA: mutação não apanhada: ' + m[0]); falhou++; } else apanhadas++;
});

console.log(falhou === 0 ? 'OK (' + apanhadas + ' mutações apanhadas)' : falhou + ' FALHA(S)');
process.exit(falhou === 0 ? 0 : 1);
