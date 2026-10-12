#!/usr/bin/env node
// "Escutar à porta da Cave" (js/proteger.js): passo antes do isco e da Fechadura, só na 1.ª ronda da visita e só com o
// alvo do dia na Cave. "Entrar já" segue sem som nem texto; "Encostar o ouvido" toca cave_passos e cave_porta (só com o
// "Som" ligado), mostra uma fala do Chizo (1 de 3, escolhida pelo dia de Lisboa) e segue. Corre js/proteger.js REAL num
// ambiente simulado (vm), e compara a Fechadura, o isco e o Caderno com a versão de js/proteger.js que está em
// origin/master antes deste passo (git), para provar que ficam iguais. Os sons são ficheiros em assets/sons.
//
// Depois de passar, o script ESTRAGA as regras de propósito (mutantes) e confirma que cada estrago faz falhar pelo menos
// uma verificação: se um mutante passar, o script falha.
//
// Uso: node scripts/verificar-escutar-porta.js
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const ler = function (f) { return fs.readFileSync(path.join(RAIZ, f), 'utf8'); };
const NOVO = ler('js/proteger.js');
let ANTES = null;
try { ANTES = execFileSync('git', ['show', 'b2ea33f:js/proteger.js'], { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { ANTES = null; }
// O js/proteger.js de b2ea33f tem os textos antigos da Fechadura (opções erradas e vitória). Pôr-lhe os de agora, para a comparação
// continuar a provar só o que interessa: o passo novo não mexe na Fechadura (os textos reescritos em tom adulto não contam).
const TEXTOS_FECHADURA = [
  ["'Ir embora e voltar amanhã'", "'Deixar uma luz acesa e esperar que ele desista'"],
  ["'Fechar os olhos e esperar que passe'", "'Esperar que ele abra a porta para o apanhar com as mãos na massa'"],
  ["'Chamar o Fygmo pelo nome, a rir'", "'Descer devagar para os apanhar de surpresa'"],
  ["'Deixar-lhe uma nota simpática'", "'Prender a porta com uma cadeira, por dentro'"],
  ["'Ignorar e voltar a dormir'", "'Ignorar: com tantas trancas, ele não entra'"],
  ["'Walk away and come back tomorrow'", "'Leave a light on and wait for him to give up'"],
  ["'Close your eyes and hope it passes'", "'Wait for him to open the door and catch him red-handed'"],
  ["\"Call out Fygmo's name, laughing\"", "'Creep down slowly to take them by surprise'"],
  ["'Leave him a friendly note'", "'Wedge the door shut with a chair, from the inside'"],
  ["'Ignore it and go back to sleep'", "\"Ignore it: with that many bolts, he won't get in\""],
  ["'Irte y volver mañana'", "'Dejar una luz encendida y esperar a que desista'"],
  ["'Cerrar los ojos y esperar que pase'", "'Esperar a que abra la puerta para pillarlo con las manos en la masa'"],
  ["'Llamar al Fygmo por su nombre, riendo'", "'Bajar despacio para pillarlos por sorpresa'"],
  ["'Dejarle una nota simpática'", "'Atrancar la puerta con una silla, por dentro'"],
  ["'Ignorarlo y volver a dormir'", "'Ignorarlo: con tantos cerrojos, no entra'"],
  ["'O Fygmo2 desiste, guarda o monóculo e foge pela vinha fora — a adega está a salvo.'", "'O Fygmo2 guarda o monóculo com a dignidade possível e retira-se pela vinha. A adega fica a salvo.'"],
  ["'O Fygmo2 desiste, guarda o monóculo e foge pela vinha fora — a Reserva Especial está a salvo.'", "'O Fygmo2 guarda o monóculo com a dignidade possível e retira-se pela vinha. A Reserva Especial fica a salvo.'"],
  ["'Fygmo2 gives up, puts away his monocle and flees across the vineyard — the winery is safe.'", "'Fygmo2 pockets his monocle with what dignity he can muster and withdraws through the vineyard. The winery stays safe.'"],
  ["'Fygmo2 gives up, puts away his monocle and flees across the vineyard — the Special Reserve is safe.'", "'Fygmo2 pockets his monocle with what dignity he can muster and withdraws through the vineyard. The Special Reserve stays safe.'"],
  ["'El Fygmo2 se rinde, guarda el monóculo y huye por el viñedo — la bodega está a salvo.'", "'El Fygmo2 guarda el monóculo con la dignidad que le queda y se retira por el viñedo. La bodega queda a salvo.'"],
  ["'El Fygmo2 se rinde, guarda el monóculo y huye por el viñedo — la Reserva Especial está a salvo.'", "'El Fygmo2 guarda el monóculo con la dignidad que le queda y se retira por el viñedo. La Reserva Especial queda a salvo.'"]
];
if (ANTES) TEXTOS_FECHADURA.forEach(function (par) { ANTES = ANTES.split(par[0]).join(par[1]); });
const HOJE = '2026-12-10';

function abrir(src, opcoes) {
  const o = Object.assign({ feitas: 1, bagaco: 3, isco: null, search: '', estacao: 'inverno', ceu: null, garrafa: true, som: true, dia: HOJE, lang: 'pt' }, opcoes);
  const reg = { falas: [], sons: [], saves: 0, html: '', botoes: [], timers: [] };
  const sb = {
    console: { log() {}, warn() {}, error() {} },
    URLSearchParams: URLSearchParams,
    location: { search: o.search },
    document: {
      getElementById: function () { return { set innerHTML(v) { reg.html = v; reg.botoes = (v.match(/escutar-botao/g) || []).map(function () { return { disabled: false }; }); }, get innerHTML() { return reg.html; } }; },
      querySelectorAll: function () { return reg.botoes; }
    },
    state: { som: o.som, adega: { bagaco: o.bagaco }, proteger: { isco: o.isco, vitoriasComPremioHoje: 0, diaVitoriasLisboa: o.dia } },
    saveState: function () { reg.saves++; },
    t: function (k) { return k; },
    randInt: function (a) { return a; },
    diaLisboaDeHoje: function () { return sb.__dia; },
    __dia: o.dia,
    estacaoAtual: function () { return o.estacao; },
    faseRealAtual: function () { return 'repouso'; },
    tempoAtual: function () { return o.ceu ? { disponivel: true, ceu: o.ceu } : { disponivel: false }; },
    caveReservaAberta: function () { return o.garrafa; },
    garrafaQueMaisDescansou: function () { return 3; },
    garrafaPorDias: function () { return { imagem: 'x', nomeKey: 'adega.garrafaAmbar' }; },
    rondaChizoFeitasHoje: function () { return o.feitas; },
    definirFundo: function (modo, src2) { reg.fundo = src2; },
    tocarSomFicheiro: function (caminho, volume) { reg.sons.push([caminho, volume]); },
    vibrar() {}, tocarSom() {},
    atualizarDialogo: function (m, nome) { reg.falas.push({ f: [m], nome: nome }); },
    mostrarFalas: function (m, nome) { reg.falas.push({ f: Array.isArray(m) ? m : [m], nome: nome }); },
    localeAtual: function () { return 'pt-PT'; },
    TEMPO_CONFIG: { vantagens: { rondasExtraProteger: { nevoeiro: 1, trovoada: 1 } } },
    currentLang: o.lang,
    setTimeout: function (fn, ms) { reg.timers.push({ fn: fn, ms: ms, vivo: true }); return reg.timers.length; },
    clearTimeout: function (id) { if (reg.timers[id - 1]) reg.timers[id - 1].vivo = false; }
  };
  sb.window = sb;
  const cx = vm.createContext(sb);
  require('./_regras-tempo').injetarRegrasTempo(cx);
  ['assaltos.js', 'barril.js'].forEach(function (f) { vm.runInContext(ler('js/' + f), cx, { filename: f }); });
  vm.runInContext(src, cx, { filename: 'proteger.js' });
  return { cx: cx, reg: reg, sb: sb, ev: function (c) { return vm.runInContext(c, cx); },
    // corre os temporizadores vivos, por ordem de tempo
    correrTimers: function () { reg.timers.filter(function (t) { return t.vivo; }).sort(function (a, b) { return a.ms - b.ms; }).forEach(function (t) { if (t.vivo) { t.vivo = false; t.fn(); } }); } };
}

function correrTestes(src) {
  const falhas = [];
  const ok = function (cond, msg) { if (!cond) falhas.push(msg); };
  const temEscutar = function (g) { return g.reg.html.indexOf('protegerEscutarEncostar') !== -1; };

  // 1. Aparece só com alvo Cave e 1.ª ronda.
  let g = abrir(src, { search: '?pista=cave' }); g.ev('startProteger()');
  ok(temEscutar(g) && g.reg.html.indexOf('protegerEscutarEntrar') !== -1, '?pista=cave devia mostrar o passo com os dois botões');
  ok(g.reg.html.indexOf('btn-choice') !== -1 && g.reg.html.indexOf('choice-stack') !== -1 && g.reg.html.indexOf('class="topcard"') !== -1, 'o passo devia ter o estilo do isco (btn-choice, choice-stack, topcard)');
  ok(g.reg.fundo === 'assets/ecras/cave_de_inverno.jpg', 'o fundo devia ser cave_de_inverno.jpg: ' + g.reg.fundo);
  ok(g.reg.html.indexOf('protegerIscoResponder') === -1 && g.ev('ultimoTipoProteger') === null, 'o passo vem antes do isco e da Fechadura');
  ok(g.reg.sons.length === 0, 'só aparecer não devia tocar nada');
  ok(g.ev('state.adega.bagaco') === 3 && g.reg.saves === 0, 'aparecer não devia gastar nem gravar nada');
  ['vinha', 'adega', 'nevoeiro', 'trovoada'].forEach(function (alvo) {
    const h = abrir(src, { search: '?pista=' + alvo }); h.ev('startProteger()');
    ok(!temEscutar(h), '?pista=' + alvo + ' não devia mostrar o passo');
  });
  g = abrir(src, { search: '?pista=cave', feitas: 0 }); g.ev('startProteger()');
  ok(temEscutar(g), 'com ?pista= o alvo é forçado (índice 0), o passo aparece');
  // Alvo ao vivo: um dia de inverno com garrafa escura em que a pista seja a Cave, e os que não são.
  let diaCave = null, diaAdega = null;
  for (let i = 0; i < 40 && (!diaCave || !diaAdega); i++) {
    const d = new Date(Date.UTC(2026, 11, 1 + i)).toISOString().slice(0, 10);
    const x = abrir(src, { dia: d }); const alvo = x.ev('alvoDosPorcosDoDia(0)');
    if (alvo === 'cave' && !diaCave) diaCave = d; if (alvo === 'adega' && !diaAdega) diaAdega = d;
  }
  ok(diaCave && diaAdega, 'devia haver dias de Cave e de Adega em dezembro');
  g = abrir(src, { dia: diaCave }); g.ev('startProteger()');
  ok(temEscutar(g), 'alvo ao vivo Cave (1.ª ronda) devia mostrar o passo');
  g = abrir(src, { dia: diaCave, feitas: 0 }); g.ev('startProteger()');
  ok(!temEscutar(g), 'sem pista (nenhuma Ronda feita) não devia mostrar o passo');
  g = abrir(src, { dia: diaAdega }); g.ev('startProteger()');
  ok(!temEscutar(g), 'alvo ao vivo Adega não devia mostrar o passo');
  ['nevoeiro', 'trovoada'].forEach(function (ceu) {
    const h = abrir(src, { dia: diaCave, ceu: ceu }); h.ev('startProteger()');
    ok(!temEscutar(h), 'com ' + ceu + ' ao vivo (vence a Cave) não devia mostrar o passo');
  });
  // 2.ª ronda da visita (startProteger(true)) e protegerRondaAtual 2: nunca.
  g = abrir(src, { search: '?pista=cave' }); g.ev('startProteger()'); g.ev('protegerEscutarEntrar()');
  g.ev('startProteger(true)');
  ok(!temEscutar(g), 'na 2.ª ronda (continuando) não devia mostrar o passo');
  g = abrir(src, { search: '?pista=cave' }); g.ev('protegerRondaAtual = 2');
  ok(g.ev('protegerEscutarAgora()') === false, 'protegerRondaAtual 2: o passo não se aplica');
  // Isco já posto de outro alvo (a pista vinha) não faz aparecer.
  g = abrir(src, { isco: { dia: HOJE, indice: 0, alvo: 'vinha' } }); g.ev('startProteger()');
  ok(!temEscutar(g), 'isco fixado na vinha não devia mostrar o passo');

  // 2. "Entrar já": segue direto, sem som nem texto.
  g = abrir(src, { search: '?pista=cave' }); g.ev('startProteger()');
  const falasAntes = g.reg.falas.length; g.reg.sons.length = 0;
  g.ev('protegerEscutarEntrar()');
  ok(g.reg.html.indexOf('protegerIscoResponder(true)') !== -1, '"Entrar já" com bagaço devia ir ao passo do isco');
  ok(g.reg.sons.filter(function (s) { return /cave_/.test(s[0]); }).length === 0, '"Entrar já" não devia tocar os sons da porta');
  ok(!g.reg.falas.slice(falasAntes).some(function (x) { return x.nome === 'Chizo'; }), '"Entrar já" não devia mostrar fala do Chizo');
  ok(g.reg.timers.length === 0, '"Entrar já" não devia agendar nada');
  g = abrir(src, { search: '?pista=cave', bagaco: 0 }); g.ev('startProteger()'); g.ev('protegerEscutarEntrar()');
  ok(g.ev('ultimoTipoProteger') === 'fechadura', '"Entrar já" sem bagaço devia ir direto à Fechadura');
  g.ev('protegerEscutarEntrar()'); g.ev('protegerEscutarEncostar()');
  ok(g.reg.sons.filter(function (s) { return /cave_/.test(s[0]); }).length === 0, 'depois de seguir, tocar outra vez no passo não faz nada');

  // 3. "Encostar o ouvido": com Som toca os dois sons, mostra a fala do Chizo e segue; botões desativados.
  g = abrir(src, { search: '?pista=cave' }); g.ev('startProteger()'); g.reg.sons.length = 0;
  g.ev('protegerEscutarEncostar()');
  const cave = g.reg.sons.filter(function (s) { return /cave_/.test(s[0]); });
  ok(cave.length === 1 && cave[0][0] === 'assets/sons/cave_passos.mp3' && cave[0][1] === 0.8, 'devia tocar primeiro os passos a 0,8: ' + JSON.stringify(g.reg.sons));
  ok(g.reg.botoes.length === 2 && g.reg.botoes.every(function (b) { return b.disabled; }), 'os dois botões deviam ficar desativados durante o som');
  const fala = g.reg.falas[g.reg.falas.length - 1];
  const falasPt = g.ev('PROTEGER_STRINGS.pt.escutarFalas');
  ok(fala.nome === 'Chizo' && falasPt.indexOf(fala.f[0]) !== -1, 'devia mostrar uma das falas, com o nome Chizo: ' + JSON.stringify(fala));
  ok(g.reg.html.indexOf('protegerIscoResponder') === -1, 'não devia seguir antes de acabar o som');
  g.ev('protegerEscutarEncostar()'); g.ev('protegerEscutarEntrar()');
  ok(g.reg.sons.filter(function (s) { return /cave_/.test(s[0]); }).length === 1 && g.reg.html.indexOf('protegerIscoResponder') === -1, 'toques duplos não deviam repetir nem saltar o som');
  const t0 = g.reg.timers.filter(function (t) { return t.vivo; }).map(function (t) { return t.ms; }).sort(function (a, b) { return a - b; });
  ok(t0.length === 2 && t0[0] >= 3500 && t0[1] >= t0[0] + 3300, 'a porta devia entrar logo a seguir aos passos (3,5 s) e seguir depois dela: ' + JSON.stringify(t0));
  g.correrTimers();
  const todos = g.reg.sons.filter(function (s) { return /cave_/.test(s[0]); });
  ok(todos.length === 2 && todos[1][0] === 'assets/sons/cave_porta.mp3' && todos[1][1] === 0.8, 'depois dos passos devia tocar a porta a 0,8: ' + JSON.stringify(todos));
  ok(g.reg.html.indexOf('protegerIscoResponder(true)') !== -1, 'depois do som devia seguir para o passo do isco');
  // Sem Som: nenhum som, mas a fala e o seguir mantêm-se.
  g = abrir(src, { search: '?pista=cave', som: false, bagaco: 0 }); g.ev('startProteger()'); g.reg.sons.length = 0;
  g.ev('protegerEscutarEncostar()');
  ok(g.reg.sons.length === 0, 'com o Som desligado não devia tocar nada: ' + JSON.stringify(g.reg.sons));
  ok(g.reg.falas[g.reg.falas.length - 1].nome === 'Chizo', 'com o Som desligado a fala aparece na mesma');
  g.correrTimers();
  ok(g.ev('ultimoTipoProteger') === 'fechadura', 'com o Som desligado também segue (para a Fechadura)');
  // Sair do Proteger a meio cancela tudo.
  g = abrir(src, { search: '?pista=cave', bagaco: 0 }); g.ev('startProteger()'); g.ev('protegerEscutarEncostar()');
  g.ev('pararTemporizadorProteger()'); g.correrTimers();
  ok(g.ev('ultimoTipoProteger') === null, 'sair do ecrã a meio não devia continuar a ronda sozinho');
  // Sem custo nem prémio nem estado.
  g = abrir(src, { search: '?pista=cave', bagaco: 0 }); g.ev('startProteger()'); const estado0 = JSON.stringify(g.ev('state'));
  g.ev('protegerEscutarEncostar()'); g.correrTimers(); g.reg.saves = 0;
  ok(JSON.stringify(g.ev('state')) === estado0 && g.reg.saves === 0, 'o passo não devia alterar o estado nem gravar');

  // 4. As 3 falas em PT, EN, ES; escolha estável por dia; sem Math.random; sem "despensa".
  ['pt', 'en', 'es'].forEach(function (l) {
    const f = g.ev('PROTEGER_STRINGS.' + l + '.escutarFalas');
    ok(Array.isArray(f) && f.length === 3 && f.every(function (x) { return typeof x === 'string' && x.length > 30; }), l + ': devia ter 3 falas');
    ok(new Set(f).size === 3, l + ': as 3 falas devem ser diferentes');
    ok(f.every(function (x) { return /Fygmo2/.test(x); }), l + ': cada fala diz que é o Fygmo2');
    ['escutarSubtitulo', 'escutarPergunta', 'escutarEncostar', 'escutarEntrar'].forEach(function (k) {
      const v = g.ev('PROTEGER_STRINGS.' + l + '.' + k); ok(typeof v === 'string' && v.length > 3, l + ': falta ' + k);
    });
    const tudo = (f.join(' ') + ' ' + ['escutarSubtitulo', 'escutarPergunta', 'escutarEncostar', 'escutarEntrar'].map(function (k) { return g.ev('PROTEGER_STRINGS.' + l + '.' + k); }).join(' ')).toLowerCase();
    ok(tudo.indexOf('despensa') === -1 && tudo.indexOf('pantry') === -1 && tudo.indexOf('despensa') === -1, l + ': os textos não devem falar da despensa');
    ok(!/opç|opci|option|corret|certa|right answer|correct/.test(tudo), l + ': a fala não devia falar da opção certa');
  });
  const idx = function (d) { return g.ev('escutarPortaFalaDoDia("' + d + '", 3)'); };
  ok(idx(HOJE) === idx(HOJE) && idx('2026-12-11') === idx('2026-12-11'), 'o mesmo dia devia dar sempre a mesma fala');
  const vistas = new Set(); for (let i = 0; i < 60; i++) vistas.add(idx(new Date(Date.UTC(2026, 11, 1 + i)).toISOString().slice(0, 10)));
  ok(vistas.size === 3, 'em 60 dias deviam sair as 3 falas, saíram ' + Array.from(vistas));
  ok(g.ev('escutarPortaFalaDoDia("x", 0)') === 0 && g.ev('escutarPortaFalaDoDia(null, 3)') === 0, 'valores inválidos dão 0');
  // A fala mostrada é a do dia, na língua certa.
  ['pt', 'en', 'es'].forEach(function (l) {
    const h = abrir(src, { search: '?pista=cave', lang: l }); h.ev('startProteger()'); h.ev('protegerEscutarEncostar()');
    const fs_ = h.ev('PROTEGER_STRINGS.' + l + '.escutarFalas');
    ok(h.reg.falas[h.reg.falas.length - 1].f[0] === fs_[h.ev('escutarPortaFalaDoDia("' + HOJE + '", 3)')], l + ': devia mostrar a fala do dia');
  });
  const iEsc = src.indexOf('// ESCUTAR À PORTA DA CAVE'), jEsc = src.indexOf('function escolherTipoProteger');
  const codigo = src.slice(iEsc, jEsc).replace(/\/\/[^\n]*/g, '');
  ok(codigo.indexOf('Math.random') === -1 && codigo.indexOf('randInt') === -1 && codigo.indexOf('Date.now') === -1, 'o passo não usa Math.random, randInt nem Date.now');
  ok(!/state\.(reputacao|gotas|uvas)|saveState|despensa/i.test(codigo), 'o passo não mexe em Reputação, Gotas, Uvas, estado gravado nem Despensa');

  // 6. Fechadura, isco e Caderno iguais a antes (com "Entrar já", contra o js/proteger.js de antes do passo).
  if (ANTES) {
    const resumo = function (g2, desde) {
      return JSON.stringify([g2.reg.html, g2.ev('ultimoTipoProteger'), g2.ev('currentFechaduraIndex'), g2.reg.saves, g2.ev('state.adega.bagaco'),
        g2.ev('state.proteger.isco'), g2.ev('protegerCaderno'), g2.ev('protegerIscoNaRonda'), g2.ev('protegerPorcoIsco'),
        g2.reg.falas.slice(desde).map(function (x) { return x.f; })]);
    };
    const cenarios = [
      { search: '?pista=cave' }, { search: '?pista=cave', bagaco: 0 }, { search: '?pista=cave', feitas: 2 },
      { isco: { dia: HOJE, indice: 0, alvo: 'cave' } }, { isco: { dia: HOJE, indice: 0, alvo: 'cave' }, ceu: 'trovoada' }, { search: '?pista=cave', garrafa: false }
    ];
    cenarios.forEach(function (c, i) {
      [[], ['protegerIscoResponder(true)'], ['protegerIscoResponder(false)']].forEach(function (passos) {
        const velho = abrir(ANTES, c); velho.ev('startProteger()');
        const novo = abrir(src, c); novo.ev('startProteger()');
        const desde = novo.reg.falas.length;
        if (temEscutar(novo)) novo.ev('protegerEscutarEntrar()');
        passos.forEach(function (p) { if (velho.reg.html.indexOf('protegerIscoResponder') !== -1) { velho.ev(p); novo.ev(p); } });
        ok(resumo(velho, 0) === resumo(novo, desde),
          'cenário ' + i + ' ' + JSON.stringify(passos) + ': depois de "Entrar já" devia ficar igual a antes');
      });
    });
    // Alvos sem o passo: o arranque é idêntico, linha a linha.
    ['vinha', 'adega', 'nevoeiro', 'trovoada'].forEach(function (alvo) {
      const velho = abrir(ANTES, { search: '?pista=' + alvo }); velho.ev('startProteger()');
      const novo = abrir(src, { search: '?pista=' + alvo }); novo.ev('startProteger()');
      ok(resumo(velho, 0) === resumo(novo, 0), '?pista=' + alvo + ': devia arrancar igual a antes');
    });
  }
  return falhas;
}

let falhou = 0;
const base = correrTestes(NOVO);
base.forEach(function (m) { console.log('FALHA: ' + m); falhou++; });

// 5. Os sons: existem e cada um tem menos de 60 KB; os originais já não estão na raiz.
['assets/sons/cave_passos.mp3', 'assets/sons/cave_porta.mp3'].forEach(function (f) {
  const p = path.join(RAIZ, f);
  if (!fs.existsSync(p)) { console.log('FALHA: falta ' + f); falhou++; return; }
  const n = fs.statSync(p).size;
  if (!(n > 5000 && n < 60 * 1024)) { console.log('FALHA: ' + f + ' tem ' + n + ' bytes (devia ter menos de 60 KB e não estar vazio)'); falhou++; }
});
['2_Footsteps.mp3', 'DOORCreak.mp3'].forEach(function (f) {
  if (fs.existsSync(path.join(RAIZ, f))) { console.log('FALHA: ' + f + ' devia ter saído da raiz'); falhou++; }
});
if (!/cave_passos/.test(ler('CREDITOS.md')) || !/BigSoundBank/.test(ler('CREDITOS.md')) || !/Axeline/.test(ler('CREDITOS.md'))) { console.log('FALHA: CREDITOS.md devia dizer a origem dos sons da porta'); falhou++; }
if (ANTES === null) { console.log('FALHA: não consegui ler js/proteger.js de b2ea33f (git) para comparar'); falhou++; }

// Mutantes.
const MUTANTES = [
  ['aparece com qualquer alvo', "=== 'cave';\n  } catch (e) { return false; }\n}\n\nfunction protegerEscutarParar", "!== 'xxx';\n  } catch (e) { return false; }\n}\n\nfunction protegerEscutarParar"],
  ['aparece na 2.ª ronda', "if (protegerRondaAtual !== 1 || typeof alvoParaProteger", "if (typeof alvoParaProteger"],
  ['aparece sem pista', "if (indice === null) return false;\n    const isco = protegerEmModoTeste()", "const isco = protegerEmModoTeste()"],
  ['não vem antes do isco', "protegerEscutarParar();\n    if (protegerEscutarAgora()) { renderEscutarPorta(); return; }\n    protegerIscoOuRonda();", "protegerEscutarParar();\n    protegerIscoOuRonda();"],
  ['Entrar já toca som', "  protegerEscutarParar();\n  protegerIscoOuRonda();\n}", "  protegerEscutarParar();\n  tocarSomFicheiro(ESCUTAR_SOM_PASSOS, ESCUTAR_VOLUME);\n  protegerIscoOuRonda();\n}"],
  ['Entrar já não segue', "  protegerEscutarParar();\n  protegerIscoOuRonda();\n}", "  protegerEscutarParar();\n}"],
  ['toca sem o Som ligado', 'const comSom = !!state.som;', 'const comSom = true;'],
  ['volume 1', 'const ESCUTAR_VOLUME = 0.8;', 'const ESCUTAR_VOLUME = 1;'],
  ['só passos', "protegerEscutarAgendar(ESCUTAR_PASSOS_MS, function () { tocarSomFicheiro(ESCUTAR_SOM_PORTA, ESCUTAR_VOLUME); });", ''],
  ['porta antes dos passos', "tocarSomFicheiro(ESCUTAR_SOM_PASSOS, ESCUTAR_VOLUME);\n    protegerEscutarAgendar", "tocarSomFicheiro(ESCUTAR_SOM_PORTA, ESCUTAR_VOLUME);\n    protegerEscutarAgendar"],
  ['botões ficam ativos', "b.disabled = true;", "b.disabled = false;"],
  ['toque duplo repete o som', "function protegerEscutarEncostar() {\n  if (!protegerEscutarPendente) return; // toque duplo", "function protegerEscutarEncostar() {"],
  ['fala sem nome do Chizo', "falas[escutarPortaFalaDoDia(diaLisboaDeHoje(), falas.length)]], 'Chizo');", "falas[escutarPortaFalaDoDia(diaLisboaDeHoje(), falas.length)]], 'YoshiCat');"],
  ['não segue depois do som', "    protegerEscutarTimers = [];\n    protegerIscoOuRonda();\n  });", "    protegerEscutarTimers = [];\n  });"],
  ['fala escolhida ao acaso', "falas[escutarPortaFalaDoDia(diaLisboaDeHoje(), falas.length)]", "falas[Math.floor(Math.random() * falas.length)]"],
  ['hash sem o dia', "const semente = dia + '#escutar#porta';", "const semente = '#escutar#porta';"],
  ['fala menciona a despensa', "O Fygmo2 devia saber que eu ouço tudo", "O Fygmo2 devia saber que eu ouço tudo, até na despensa"],
  ['fala diz a opção certa', "Não convence nem um cão.", "Não convence nem um cão; a opção certa é a primeira."],
  ['sair não cancela', "function pararTemporizadorProteger() {\n  protegerEscutarParar();\n", "function pararTemporizadorProteger() {\n"],
  ['passo grava', "  protegerEscutarPendente = false;\n  document.querySelectorAll('.escutar-botao')", "  protegerEscutarPendente = false; saveState(state);\n  document.querySelectorAll('.escutar-botao')"],
  ['fundo errado', "const PROTEGER_FUNDO_ESCUTAR = 'assets/ecras/cave_de_inverno.jpg';", "const PROTEGER_FUNDO_ESCUTAR = 'assets/ecras/adega_juntos.jpg';"],
  ['fala em falta (ES)', "Pasitos de quien cree que nadie lo oye. Fygmo2 debería saber que lo oigo todo, hasta el monóculo limpiándose en la manga.", ""],
  ['o isco passa a vir antes e muda', "function protegerIscoOuRonda() {\n  const indiceIsco = protegerIscoPerguntarAgora();\n  if (indiceIsco !== null) { renderIscoPergunta(indiceIsco); return; }\n  iniciarRondaProteger();", "function protegerIscoOuRonda() {\n  const indiceIsco = null;\n  if (indiceIsco !== null) { renderIscoPergunta(indiceIsco); return; }\n  iniciarRondaProteger();"]
];
MUTANTES.forEach(function (m) {
  if (NOVO.split(m[1]).length < 2) { console.log('FALHA: mutante "' + m[0] + '": a âncora já não existe em js/proteger.js'); falhou++; return; }
  const mutado = NOVO.replace(m[1], function () { return m[2]; });
  let r;
  try { r = correrTestes(mutado); } catch (e) { r = ['rebentou: ' + e.message]; }
  if (r.length === 0) { console.log('FALHA: o mutante "' + m[0] + '" passou nos testes'); falhou++; }
});

console.log(falhou === 0 ? 'OK (' + MUTANTES.length + ' mutações apanhadas)' : falhou + ' FALHA(S)');
process.exit(falhou === 0 ? 0 : 1);
