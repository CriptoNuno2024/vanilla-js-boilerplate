#!/usr/bin/env node
// "Seguir o barril" (js/barril.js + a cena em js/proteger.js): o mini-jogo do Proteger quando a pista do dia é a
// Adega. Os porcos trocam os 3 barris de sítio e o jogador segue o do aguardente.
//
//  1. Regra pura (js/barril.js, real, em vm): a mesma semente dá sempre a mesma sequência, há sempre um e só um
//     barril certo, as trocas ficam entre as posições 0 e 2, cada troca mexe em 2 posições diferentes, a 1.ª mexe
//     no barril marcado, nunca há a mesma troca seguida, 3 ou 4 trocas; acertar na posição final vence e errar
//     perde (calculado pelas trocas, nunca pelo campo "final"); sem Math.random nem Date.now.
//  2. Ligação: pista Adega -> 'barril' (os outros alvos não mudam); a cena (js/proteger.js real, com os temporizadores
//     simulados): 3 barris tocáveis, o marcado só no início, as trocas acabam, só se toca no fim, toque duplo conta
//     uma vez, o resultado é o da regra (não o do desenho), "reduzir movimento" mantém a lógica, sair do ecrã
//     cancela tudo e a derrota/vitória passam por finishProteger (mesmas regras de prémio).
//  3. Textos novos em PT/EN/ES (js/i18n.js), sem ficheiros de som novos, index.html carrega barril.js antes do proteger.js.
//
// Depois de passar, aplica "mutações" (estraga cada regra de propósito) e confirma que o teste as apanha.
//
// Uso: node scripts/verificar-barril.js
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const FICHEIROS = ['barril.js', 'assaltos.js', 'proteger.js', 'i18n.js'];
const FONTES = {};
FICHEIROS.forEach(function (f) { FONTES[f] = fs.readFileSync(path.join(RAIZ, 'js', f), 'utf8'); });
const INDEX = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');

function suite(fontes) {
  const falhas = [];
  function ok(cond, msg) { if (!cond) falhas.push(msg); }
  const sem_comentarios = function (s) { return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''); };

  // ---------------- 1. Regra pura ----------------
  const pura = vm.createContext({});
  vm.runInContext(fontes['barril.js'], pura, { filename: 'barril.js' });
  const seq = function (s, n) { return JSON.parse(vm.runInContext('JSON.stringify(barrilSequencia(' + JSON.stringify(s) + (n === undefined ? '' : ', ' + JSON.stringify(n)) + '))', pura)); };
  const acertou = function (q, p) { pura.q = q; pura.p = p; return vm.runInContext('barrilAcertou(q, p)', pura); };
  // Reimplementação independente (o teste não confia na regra).
  const finalDe = function (marcado, trocas) {
    let p = marcado;
    trocas.forEach(function (t) { if (p === t[0]) p = t[1]; else if (p === t[1]) p = t[0]; });
    return p;
  };

  const dia = '2026-10-09';
  const marcados = {}, totais = {}, finais = {};
  for (let i = 0; i < 600; i++) {
    const semente = dia + '#barril#' + (1 + i % 3) + '#' + i;
    const s = seq(semente);
    ok(JSON.stringify(s) === JSON.stringify(seq(semente)), 'mesma semente devia dar a mesma sequência: ' + semente);
    ok(Number.isInteger(s.marcado) && s.marcado >= 0 && s.marcado <= 2, 'marcado fora de 0 a 2: ' + semente);
    ok(Array.isArray(s.trocas) && (s.trocas.length === 3 || s.trocas.length === 4), 'devia ter 3 ou 4 trocas: ' + semente + ' deu ' + (s.trocas && s.trocas.length));
    let atual = s.marcado;
    s.trocas.forEach(function (t, k) {
      ok(Array.isArray(t) && t.length === 2 && Number.isInteger(t[0]) && Number.isInteger(t[1]) && t[0] >= 0 && t[1] <= 2 && t[0] < t[1], 'troca inválida (posições 0 a 2, a < b): ' + JSON.stringify(t) + ' em ' + semente);
      if (k === 0) ok(t[0] === atual || t[1] === atual, 'a 1.ª troca devia mexer no barril marcado: ' + semente);
      if (k > 0) ok(!(t[0] === s.trocas[k - 1][0] && t[1] === s.trocas[k - 1][1]), 'mesma troca seguida (cancela-se): ' + semente);
      if (atual === t[0]) atual = t[1]; else if (atual === t[1]) atual = t[0];
    });
    ok(s.final === finalDe(s.marcado, s.trocas) && s.final === atual, 'final não bate com as trocas: ' + semente);
    ok(s.final >= 0 && s.final <= 2, 'final fora de 0 a 2: ' + semente);
    // Um e só um barril certo
    const certos = [0, 1, 2].filter(function (p) { return acertou(s, p); });
    ok(certos.length === 1 && certos[0] === finalDe(s.marcado, s.trocas), 'devia haver um e só um barril certo (a posição final): ' + semente + ' deu ' + JSON.stringify(certos));
    marcados[s.marcado] = 1; totais[s.trocas.length] = 1; finais[s.final] = 1;
  }
  ok(Object.keys(marcados).length === 3 && Object.keys(finais).length === 3, 'ao longo de muitas sementes o marcado e o final deviam variar pelas 3 posições');
  ok(Object.keys(totais).length === 2, 'ao longo de muitas sementes deviam sair sequências de 3 e de 4 trocas');
  // Trocas pedidas
  [1, 2, 5, 8].forEach(function (n) { ok(seq('x' + n, n).trocas.length === n, 'trocas pedidas (' + n + ') devia respeitar'); });
  [0, 9, 2.5, '3', null].forEach(function (n) { const l = seq('y', n).trocas.length; ok(l === 3 || l === 4, 'número de trocas inválido (' + n + ') devia cair no normal, deu ' + l); });
  // Toques inválidos e dados adulterados
  const s0 = seq('abc');
  [-1, 3, 1.5, '1', null, undefined, NaN, {}, [], true].forEach(function (p) { ok(acertou(s0, p) === false, 'toque inválido devia perder: ' + JSON.stringify(p)); });
  [null, undefined, 0, 'x', [], {}].forEach(function (q) { ok(acertou(q, 0) === false, 'sequência inválida devia perder'); });
  { // o campo "final" adulterado é ignorado
    const t = JSON.parse(JSON.stringify(s0)); t.final = (s0.final + 1) % 3;
    ok(acertou(t, s0.final) === true && acertou(t, t.final) === false, 'o resultado devia vir das trocas, não do campo "final"');
    const u = JSON.parse(JSON.stringify(s0)); u.marcado = 7;
    ok([0, 1, 2].every(function (p) { return acertou(u, p) === false; }), 'marcado inválido devia perder sempre');
  }
  ok(!/Math\.random|Date\.now|new Date/.test(sem_comentarios(fontes['barril.js'])), 'barril.js não pode usar Math.random nem Date.now');

  // ---------------- 2. Ligação e cena ----------------
  const asc = vm.createContext({});
  vm.runInContext(fontes['assaltos.js'], asc, { filename: 'assaltos.js' });
  const tipo = function (a) { asc.a = a; return vm.runInContext('tipoDeProtegerPelaPista(a)', asc); };
  ok(tipo('adega') === 'barril', 'pista adega devia levar ao "barril", deu ' + tipo('adega'));
  ok(tipo('cave') === 'fechadura' && tipo('vinha') === 'disfarces' && tipo('trovoada') === 'disfarces' && tipo('nevoeiro') === 'chizo', 'os outros alvos não podem mudar');
  [undefined, null, '', 'porco', 42].forEach(function (a) { ok(tipo(a) === null, 'alvo desconhecido devia dar null: ' + a); });

  function abrir(opcoes) {
    const o = Object.assign({ search: '?pista=adega', reduzir: false, rondaExtra: false }, opcoes);
    const reg = { html: '', timers: [], sons: [], falas: [], resultados: [], elementos: {}, saves: 0 };
    function elemento(id) {
      return reg.elementos[id] || (reg.elementos[id] = {
        id: id, disabled: true, textContent: '', attrs: {}, vars: {}, classes: new Set(),
        style: { setProperty: function (k, v) { reg.elementos[id].vars[k] = v; } },
        setAttribute: function (k, v) { reg.elementos[id].attrs[k] = v; },
        classList: { remove: function (c) { reg.elementos[id].classes.delete(c); }, add: function (c) { reg.elementos[id].classes.add(c); }, contains: function (c) { return reg.elementos[id].classes.has(c); } }
      });
    }
    const sb = {
      console: { log() {}, warn() {}, error() {} },
      URLSearchParams: URLSearchParams,
      location: { search: o.search },
      window: null,
      document: { getElementById: function (id) {
        if (id === 'proteger-container') return { set innerHTML(v) { reg.html = v; reg.elementos = {}; [0, 1, 2].forEach(function (i) { const e = elemento('barril-' + i); e.disabled = /id="barril-' + i + '"[^>]* disabled/.test(v) || / disabled /.test(v); e.classes = new Set(new RegExp('id="barril-' + i + '" class="barril-btn marcado"').test(v) ? ['marcado'] : []); }); }, get innerHTML() { return reg.html; } };
        return elemento(id);
      } },
      state: { adega: { bagaco: 3 }, proteger: { isco: null, vitoriasComPremioHoje: 0, diaVitoriasLisboa: '2026-10-09' } },
      saveState: function () { reg.saves++; },
      t: function (k) { return k; },
      randInt: function (a, b) { return a; },
      diaLisboaDeHoje: function () { return '2026-10-09'; },
      estacaoAtual: function () { return 'primavera'; },
      faseRealAtual: function () { return 'repouso'; },
      tempoAtual: function () { return { disponivel: false }; },
      caveReservaAberta: function () { return false; },
      garrafaQueMaisDescansou: function () { return 0; },
      rondaChizoFeitasHoje: function () { return 1; },
      definirFundo: function (m, src) { reg.fundo = src; }, tocarSomFicheiro: function () {}, vibrar: function () {},
      tocarSom: function (n) { reg.sons.push(n); },
      atualizarDialogo: function (m) { reg.falas.push([m]); },
      mostrarFalas: function (m) { reg.falas.push(Array.isArray(m) ? m : [m]); },
      localeAtual: function () { return 'pt-PT'; },
      TEMPO_CONFIG: { vantagens: { rondasExtraProteger: { nevoeiro: 1, trovoada: 1 } } },
      currentLang: 'pt',
      setTimeout: function (fn, ms) { reg.timers.push({ fn: fn, ms: ms, ativo: true }); return reg.timers.length; },
      clearTimeout: function (id) { if (reg.timers[id - 1]) reg.timers[id - 1].ativo = false; }
    };
    sb.window = sb;
    sb.matchMedia = function () { return { matches: !!o.reduzir }; };
    const cx = vm.createContext(sb);
    require('./_regras-tempo').injetarRegrasTempo(cx);
    ['barril.js', 'assaltos.js', 'proteger.js'].forEach(function (f) { vm.runInContext(fontes[f], cx, { filename: f }); });
    // Em vez do ecrã de resultado, regista o que finishProteger recebe (os prémios têm os seus próprios testes).
    vm.runInContext('var __fim = []; finishProteger = function (v, m) { __fim.push([v, m]); };', cx);
    const g = { cx: cx, reg: reg };
    g.ev = function (c) { return vm.runInContext(c, cx); };
    g.json = function (c) { return JSON.parse(vm.runInContext('JSON.stringify(' + c + ')', cx)); };
    // Corre os temporizadores um a um até não haver mais; devolve o total de ms simulados.
    g.correrTudo = function () {
      let total = 0, guarda = 0;
      while (guarda++ < 50) {
        const t = reg.timers.find(function (x) { return x.ativo; });
        if (!t) break;
        t.ativo = false; total += t.ms; t.fn();
      }
      return total;
    };
    g.resultados = function () { return g.json('__fim'); };
    return g;
  }

  {
    const g = abrir({});
    g.ev('startProteger()');
    ok(g.reg.html.indexOf('protegerIscoResponder') !== -1, 'com bagaço o passo do isco vem primeiro (a adega agora leva a um minijogo)');
    g.ev('protegerIscoResponder(false)');
    ok(/id="barril-0"/.test(g.reg.html) && /id="barril-1"/.test(g.reg.html) && /id="barril-2"/.test(g.reg.html), 'pista adega devia mostrar os 3 barris');
    ok(g.ev('ultimoTipoProteger') === 'barril', 'o tipo da ronda devia ser barril');
    ok(g.reg.fundo === 'assets/vinha/barril.jpg', 'fundo da cena devia ser a imagem de barril já existente, deu ' + g.reg.fundo);
    ok(g.json('[0,1,2].map(function (i) { return document.getElementById("barril-" + i).disabled; })').every(Boolean), 'os barris começam sem poder ser tocados');
    ok(g.ev('barrilFase') === 'marca' && g.ev('barrilSeq.marcado') >= 0, 'começa na fase da marca');
    const marcado = g.ev('barrilSeq.marcado');
    ok(g.reg.html.indexOf('id="barril-' + marcado + '" class="barril-btn marcado"') !== -1 && (g.reg.html.match(/barril-btn marcado/g) || []).length === 1, 'só o barril marcado aparece marcado');
    ok(g.reg.timers.length === 1 && g.reg.timers[0].ms === 1500, 'a marca dura ~1,5 s (BARRIL_CONFIG.marcaMs)');
    g.ev('barrilEscolher(0)');
    ok(g.resultados().length === 0, 'tocar durante a marca não devia contar');
    // 1.º temporizador: acaba a marca e começa a 1.ª troca
    const t1 = g.reg.timers[0]; t1.ativo = false; t1.fn();
    ok(!g.reg.elementos['barril-' + marcado].classes.has('marcado'), 'a marca some quando as trocas começam');
    ok(g.ev('barrilFase') === 'troca', 'fase de trocas');
    g.ev('barrilEscolher(1)');
    ok(g.resultados().length === 0, 'tocar durante as trocas não devia contar');
    const trocas = g.json('barrilSeq.trocas');
    const total = g.correrTudo();
    ok(g.ev('barrilFase') === 'escolha', 'as trocas acabam e passa à escolha (a animação termina)');
    ok(total <= 5000, 'a animação devia acabar em poucos segundos, deu ' + total + ' ms');
    ok(g.reg.sons.filter(function (s) { return s === 'cavar'; }).length === trocas.length && g.reg.sons.every(function (s) { return s === 'cavar'; }), 'um som por troca, só efeitos que o som.js já gera (cavar)');
    ok(g.json('[0,1,2].map(function (i) { return document.getElementById("barril-" + i).disabled; })').every(function (d) { return d === false; }), 'os barris passam a poder ser tocados');
    const slots = g.json('barrilSlots');
    ok(slots.slice().sort().join() === '0,1,2', 'cada posição tem um só barril: ' + JSON.stringify(slots));
    [0, 1, 2].forEach(function (id) { ok(g.reg.elementos['barril-' + id].vars['--slot'] === slots[id], 'o desenho (--slot) tem de bater com o estado do barril ' + id); });
    const certo = g.json('barrilSeq.final');
    const idCerto = slots.indexOf(certo);
    ok(slots[g.ev('barrilSeq.marcado')] === certo, 'o barril marcado está na posição final');
    g.ev('barrilEscolher(' + idCerto + ')');
    g.ev('barrilEscolher(' + idCerto + ')'); g.ev('barrilEscolher(' + ((idCerto + 1) % 3) + ')');
    ok(g.resultados().length === 1 && g.resultados()[0][0] === true && g.resultados()[0][1] === 'proteger.barrilVitoria', 'tocar no barril certo = vitória (e só conta uma vez, mesmo com toque duplo): ' + JSON.stringify(g.resultados()));
  }
  // Derrota: cada um dos 2 barris errados
  [1, 2].forEach(function (desvio) {
    const g = abrir({}); g.ev('startProteger()'); g.ev('protegerIscoResponder(false)'); g.correrTudo();
    const slots = g.json('barrilSlots'), certo = g.json('barrilSeq.final');
    const idErrado = slots.indexOf((certo + desvio) % 3);
    g.ev('barrilEscolher(' + idErrado + ')');
    ok(g.resultados().length === 1 && g.resultados()[0][0] === false && g.resultados()[0][1] === 'proteger.barrilDerrota', 'tocar num barril errado = derrota: ' + JSON.stringify(g.resultados()));
  });
  // Reduzir movimento: a mesma lógica, pausas curtas
  {
    const g = abrir({ reduzir: true }); g.ev('startProteger()'); g.ev('protegerIscoResponder(false)');
    ok(g.ev('barrilReduzMovimento()') === true, 'deteta prefers-reduced-motion');
    g.correrTudo();
    const slots = g.json('barrilSlots'), certo = g.json('barrilSeq.final');
    ok(g.ev('barrilFase') === 'escolha' && g.ev('barrilAcertou(barrilSeq, ' + certo + ')') === true && slots[g.ev('barrilSeq.marcado')] === certo, 'com reduzir movimento a lógica é a mesma');
    ok(g.reg.timers.slice(1).every(function (t) { return t.ms < 500; }), 'com reduzir movimento as pausas são curtas');
    g.ev('barrilEscolher(' + slots.indexOf(certo) + ')');
    ok(g.resultados().length === 1 && g.resultados()[0][0] === true, 'reduzir movimento: o toque certo vence');
  }
  // O desenho nunca decide: se o estado visual (barrilSlots) estiver errado, vale a regra (posição tocada contra as trocas)
  {
    const g = abrir({}); g.ev('startProteger()'); g.ev('protegerIscoResponder(false)'); g.correrTudo();
    const certo = g.json('barrilSeq.final');
    g.ev('barrilSlots = [0, 1, 2]'); // desenho "adulterado": cada barril na sua posição
    g.ev('barrilEscolher(' + certo + ')');
    ok(g.resultados()[0][0] === true, 'o resultado vem da posição tocada contra as trocas');
  }
  // Sair do ecrã cancela tudo
  {
    const g = abrir({}); g.ev('startProteger()'); g.ev('protegerIscoResponder(false)');
    g.ev('pararTemporizadorProteger()');
    ok(g.reg.timers.every(function (t) { return !t.ativo; }) && g.ev('barrilFase') === 'parado', 'sair do ecrã devia cancelar os temporizadores');
    g.reg.timers.forEach(function (t) { t.fn(); }); // um temporizador que já estava a caminho
    ok(g.ev('barrilFase') === 'parado' && g.resultados().length === 0, 'um temporizador atrasado não devia fazer nada depois de sair');
    g.ev('barrilEscolher(0)');
    ok(g.resultados().length === 0, 'não se toca depois de sair');
  }
  // Tentar outra vez: nova cena e sem temporizadores velhos
  {
    const g = abrir({}); g.ev('startProteger()'); g.ev('protegerIscoResponder(false)');
    const velhos = g.reg.timers.length;
    g.ev('startProteger()'); g.ev('protegerIscoResponder(false)');
    ok(g.reg.timers.slice(0, velhos).every(function (t) { return !t.ativo; }), 'recomeçar cancela os temporizadores da cena anterior');
  }
  // A semente vem de quem chama: dia de Lisboa + ronda + um número que muda a cada tentativa (tentar outra vez não repete a sequência)
  {
    const g = abrir({}); g.ev('var __n = 0; randInt = function () { return ++__n; };');
    const s1 = g.ev('barrilSementeAtual()'), s2 = g.ev('barrilSementeAtual()');
    ok(/^2026-10-09#barril#1#\d+$/.test(s1) && s1 !== s2, 'a semente devia ser dia + ronda + número que muda: ' + s1 + ' / ' + s2);
  }
  // Os outros alvos não usam a cena nova
  ['cave', 'vinha', 'nevoeiro', 'trovoada'].forEach(function (a) {
    const g = abrir({ search: '?pista=' + a }); g.ev('startProteger()'); g.ev('protegerIscoResponder(false)');
    ok(g.reg.html.indexOf('barril-0') === -1 && g.ev('ultimoTipoProteger') !== 'barril', 'pista ' + a + ' não devia usar o Seguir o barril');
    g.ev('pararTemporizadorProteger()');
  });
  // Sem pista o sorteio de sempre nunca dá o barril
  {
    const g = abrir({ search: '' });
    g.ev('rondaChizoFeitasHoje = function () { return 0; }');
    let viu = false;
    for (let i = 0; i < 40; i++) { g.ev('startProteger()'); if (g.ev('ultimoTipoProteger') === 'barril') viu = true; g.ev('pararTemporizadorProteger()'); }
    ok(!viu, 'sem pista o sorteio não devia dar o barril');
  }

  // ---------------- 3. Textos, sons e ligações ----------------
  {
    const cx = vm.createContext({ console: { log() {}, warn() {}, error() {} }, localStorage: { getItem: function () { return null; }, setItem: function () {} }, document: { querySelectorAll: function () { return []; }, getElementById: function () { return null; }, documentElement: {} }, navigator: { language: 'pt-PT' }, state: {}, location: { search: '' }, URLSearchParams: URLSearchParams });
    cx.window = cx;
    let T = null;
    try { vm.runInContext(fontes['i18n.js'], cx, { filename: 'i18n.js' }); T = vm.runInContext('JSON.parse(JSON.stringify(TRANSLATIONS))', cx); } catch (e) { falhas.push('não consegui carregar js/i18n.js: ' + e.message); }
    if (T) {
      const chaves = ['barrilSubtitulo', 'barrilIntro', 'barrilMarca', 'barrilSegue', 'barrilEscolhe', 'barrilNome', 'barrilVitoria', 'barrilDerrota'];
      ['pt', 'en', 'es'].forEach(function (l) {
        chaves.forEach(function (k) { const v = T[l]['proteger.' + k]; ok(typeof v === 'string' && v.trim() !== '' && v.length <= 110, l + ': proteger.' + k + ' em falta, vazio ou > 110 caracteres'); });
      });
      chaves.forEach(function (k) { ok(T.pt['proteger.' + k] !== T.en['proteger.' + k] && T.en['proteger.' + k] !== T.es['proteger.' + k] && T.pt['proteger.' + k] !== T.es['proteger.' + k] || k === 'barrilNome' && T.pt['proteger.' + k] !== T.en['proteger.' + k], 'proteger.' + k + ': as 3 línguas deviam ter textos próprios'); });
      const prefixo = function (l) { return Object.keys(T[l]).filter(function (k) { return /^proteger\.barril/.test(k); }).sort().join(); };
      ok(prefixo('pt') === prefixo('en') && prefixo('en') === prefixo('es'), 'as 3 línguas devem ter exatamente as mesmas chaves proteger.barril*');
    }
    // As frases de derrota sobre o barril (adega) continuam em PT/EN/ES e são as do alvo adega.
    const pc = vm.createContext({}); pc.window = pc;
    const pstr = fontes['proteger.js'].slice(fontes['proteger.js'].indexOf('const PROTEGER_STRINGS'), fontes['proteger.js'].indexOf('function pStr()'));
    try {
      vm.runInContext(pstr, pc);
      ['pt', 'en', 'es'].forEach(function (l) {
        const f = vm.runInContext('PROTEGER_STRINGS.' + l + '.derrotaPista.adega', pc);
        ok(Array.isArray(f) && f.length === 2 && f.every(function (x) { return /barr[ie]l|barrel/i.test(x); }), l + ': as 2 frases de derrota da adega sobre o barril têm de se manter');
      });
    } catch (e) { falhas.push('PROTEGER_STRINGS: ' + e.message); }
  }
  {
    const cod = sem_comentarios(fontes['proteger.js'] + fontes['barril.js']);
    ok(!/prado_grilos_ras/.test(cod), 'não usar o prado_grilos_ras.mp3');
    ok(!/sons\/[a-z_0-9]*barril|barril[a-z_0-9]*\.mp3/i.test(cod), 'sem ficheiros de som novos para o barril');
    ok((cod.match(/tocarSomFicheiro\(/g) || []).length === 2, 'o número de sons de ficheiro do Proteger não devia mudar (porco e cão)');
    ok(fs.readdirSync(path.join(RAIZ, 'assets', 'sons')).length === 12, 'assets/sons não devia ter ficheiros novos');
    const a = INDEX.indexOf('<script src="js/barril.js'), b = INDEX.indexOf('<script src="js/proteger.js'), c = INDEX.indexOf('<script src="js/assaltos.js');
    ok(a !== -1 && b !== -1 && a < b && c < b, 'index.html: barril.js (e assaltos.js) antes do proteger.js');
  }
  return falhas;
}

let falhas = suite(FONTES);

function mutar(ficheiro, de, para) {
  if (FONTES[ficheiro].indexOf(de) === -1) { falhas.push('mutação impossível (texto não encontrado em ' + ficheiro + '): ' + de); return null; }
  const f = Object.assign({}, FONTES);
  f[ficheiro] = FONTES[ficheiro].split(de).join(para);
  return f;
}
const MUTACOES = [
  ['posição final ignora as trocas', 'barril.js', 'return { marcado: marcado, trocas: lista, final: barrilPosicaoFinal(marcado, lista) };', 'return { marcado: marcado, trocas: lista, final: marcado };'],
  ['troca não aplica o segundo sentido', 'barril.js', 'else if (p === t[1]) p = t[0];', ''],
  ['acertou: dá vitória sempre', 'barril.js', 'return toque === barrilPosicaoFinal(sequencia.marcado, sequencia.trocas);', 'return true;'],
  ['acertou: dá derrota sempre', 'barril.js', 'return toque === barrilPosicaoFinal(sequencia.marcado, sequencia.trocas);', 'return false;'],
  ['acertou: confia no campo final', 'barril.js', 'return toque === barrilPosicaoFinal(sequencia.marcado, sequencia.trocas);', 'return toque === sequencia.final;'],
  ['trocas fora de 0 a 2 (4 posições)', 'barril.js', 'posicoes: 3,', 'posicoes: 4,'],
  ['troca de uma posição com ela própria', 'barril.js', 'b = (a + 1 + (rnd() % (n - 1))) % n;\n      }', 'b = a;\n      }'],
  ['1.ª troca não mexe no marcado', 'barril.js', 'a = atual;\n        b = (atual + 1 + (rnd() % (n - 1))) % n; // uma das outras duas posições', 'a = (atual + 1) % n;\n        b = (atual + 2) % n;'],
  ['mesma troca seguida permitida', 'barril.js', '} while (anterior && Math.min(a, b) === anterior[0] && Math.max(a, b) === anterior[1]);', '} while (false);'],
  ['só 2 trocas', 'barril.js', 'trocasMin: 3,', 'trocasMin: 2,'],
  ['regra usa Math.random', 'barril.js', 'const rnd = barrilGerador(semente);', 'const rnd = function () { return Math.floor(Math.random() * 4294967295); };'],
  ['regra não determinística (mistura o relógio)', 'barril.js', 'const texto = String(semente);', 'const texto = String(semente) + Date.now();'],
  ['pista adega não leva ao barril', 'assaltos.js', "if (alvo === 'adega') return 'barril';", ''],
  ['pista cave passa a levar ao barril', 'assaltos.js', "if (alvo === 'cave') return 'fechadura';", "if (alvo === 'cave') return 'barril';"],
  ['a ronda não usa a cena do barril', 'proteger.js', "else if (tipo === 'barril') renderBarril();", ''],
  ['o tipo barril não é aceite pela pista', 'proteger.js', "|| tipo === 'barril') ? tipo : null;", ") ? tipo : null;"],
  ['o resultado vem do desenho e não da regra', 'proteger.js', 'const venceu = barrilAcertou(barrilSeq, barrilSlots[id]);', 'const venceu = id === barrilSeq.marcado;'],
  ['tocar durante as trocas conta', 'proteger.js', "if (barrilFase !== 'escolha' || !barrilSeq) return;", 'if (!barrilSeq) return;'],
  ['toque duplo conta duas vezes', 'proteger.js', "  barrilFase = 'fim';\n  const venceu", '  const venceu'],
  ['a marca nunca some', 'proteger.js', "if (marcado) marcado.classList.remove('marcado');", ''],
  ['as trocas não acabam', 'proteger.js', 'if (i >= barrilSeq.trocas.length) { barrilEsperarToque(); return; }', 'if (i >= barrilSeq.trocas.length + 100) { barrilEsperarToque(); return; }'],
  ['sair do ecrã não cancela', 'proteger.js', "if (typeof barrilParar === 'function') barrilParar();", ''],
  ['temporizador velho continua a agir', 'proteger.js', 'if (minha === barrilSessao) fn();', 'fn();'],
  ['reduzir movimento deixa de mexer na lógica (não troca)', 'proteger.js', "barrilReduzMovimento() ? 300 : BARRIL_CONFIG.trocaMs + BARRIL_CONFIG.pausaMs", "barrilReduzMovimento() ? 9000 : BARRIL_CONFIG.trocaMs + BARRIL_CONFIG.pausaMs"],
  ['sem som de troca', 'proteger.js', "tocarSom('cavar');", ''],
  ['som novo por ficheiro', 'proteger.js', "tocarSom('cavar');", "tocarSomFicheiro('assets/sons/prado_grilos_ras.mp3', 0.5);"],
  ['semente com Math.random dentro da regra de jogo (sem dia)', 'proteger.js', "diaLisboaDeHoje() + '#barril#' + protegerRondaAtual + '#' + randInt(0, 999999)", "'x'"],
  ['texto em falta (PT)', 'i18n.js', "'proteger.barrilMarca': 'Este é o do aguardente',", ''],
  ['texto em falta (ES)', 'i18n.js', "'proteger.barrilSegue': '¡Ahora síguelo!',", '']
];
MUTACOES.forEach(function (m) {
  const f = mutar(m[1], m[2], m[3]);
  if (!f) return;
  let apanhada;
  try { apanhada = suite(f).length > 0; } catch (e) { apanhada = true; }
  if (!apanhada) falhas.push('MUTAÇÃO NÃO APANHADA: ' + m[0]);
});

if (falhas.length) {
  falhas.slice(0, 40).forEach(function (m) { console.log('FALHA: ' + m); });
  console.log(falhas.length + ' falha(s)');
  process.exit(1);
}
console.log('OK (' + MUTACOES.length + ' mutações apanhadas)');
