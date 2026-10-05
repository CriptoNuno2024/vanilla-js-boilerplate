#!/usr/bin/env node
// Teste do PR C do Caderno dos Fygmos: a página aparece na vitória do Proteger
// (finishProteger / protegerDarPaginaCaderno em js/proteger.js, cadernoDarPaginaDaVitoria
// em js/caderno.js). Corre js/ num ambiente simulado (vm), sem browser nem conta real.
//
// Uso: node scripts/verificar-caderno-vitoria.js
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const HOJE = '2026-10-05';
let falhas = 0;
function ok(cond, msg) { if (!cond) { falhas++; console.log('FALHA: ' + msg); } }

// Jogo simulado. Opções: feitas (rondas do Chizo hoje), isco (registo do isco), search,
// ceu, nivel (>= 3 abre o Caderno), antigo, garrafa (Cave aberta), vitorias (prémios já dados hoje), paginas.
function abrir(opcoes) {
  const o = Object.assign({ feitas: 1, isco: { dia: HOJE, indice: 0, alvo: 'vinha' }, search: '', ceu: null, nivel: 3,
    antigo: false, garrafa: true, vitorias: 0, paginas: {}, lang: 'pt' }, opcoes);
  const reg = { falas: [], saves: 0, html: '' };
  const sb = {
    console: { log() {}, warn() {}, error() {} },
    URLSearchParams: URLSearchParams,
    location: { search: o.search },
    document: { getElementById: function () { return { set innerHTML(v) { reg.html = v; }, get innerHTML() { return reg.html; } }; } },
    state: {
      uvas: 0, gotas: 0, reputacao: 0, conhecimento: 5, adega: { bagaco: 3 }, acesso: { jogadorAntigo: o.antigo },
      proteger: { isco: o.isco, vitoriasComPremioHoje: o.vitorias, diaVitoriasLisboa: HOJE },
      objetivos: { dia: HOJE, feitos: {} }, caderno: { paginas: JSON.parse(JSON.stringify(o.paginas)) }
    },
    saveState: function () { reg.saves++; },
    t: function (k) { return k; },
    randInt: function (a) { return a; },
    diaLisboaDeHoje: function () { return HOJE; },
    estacaoAtual: function () { return 'inverno'; },
    faseRealAtual: function () { return 'repouso'; },
    tempoAtual: function () { return o.ceu ? { disponivel: true, ceu: o.ceu } : { disponivel: false }; },
    caveReservaAberta: function () { return o.garrafa; },
    ecraDesbloqueado: function () { return o.antigo || o.nivel >= 3; },
    garrafaQueMaisDescansou: function () { return 3; },
    garrafaPorDias: function () { return { imagem: 'x', nomeKey: 'adega.garrafaAmbar' }; },
    rondaChizoFeitasHoje: function () { return o.feitas; },
    marcarObjetivoCumprido: function () {}, updateStatsDisplays: function () {},
    definirFundo() {}, tocarSomFicheiro() {}, vibrar() {}, tocarSom() {},
    atualizarDialogo: function (m) { reg.falas.push([m]); },
    mostrarFalas: function (m) { reg.falas.push(Array.isArray(m) ? m : [m]); },
    localeAtual: function () { return 'pt-PT'; },
    TEMPO_CONFIG: { vantagens: { rondasExtraProteger: { nevoeiro: 1, trovoada: 1 } } },
    currentLang: o.lang, setTimeout: function () { return 1; }, clearTimeout: function () {}
  };
  sb.window = sb;
  const cx = vm.createContext(sb);
  ['assaltos.js', 'caderno.js', 'proteger.js'].forEach(function (f) { vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), cx, { filename: f }); });
  const g = { reg: reg, ev: function (c) { return vm.runInContext(c, cx); } };
  g.paginas = function () { return g.ev('state.caderno.paginas'); };
  g.ids = function () { return Object.keys(g.paginas()).sort(); };
  g.falaCaderno = function () { return reg.falas.some(function (f) { return f.some(function (x) { return typeof x === 'string' && /Caderno/.test(x); }); }); };
  g.falaCompleto = function () { return reg.falas.some(function (f) { return f.some(function (x) { return typeof x === 'string' && /papéis para perder/.test(x); }); }); };
  g.visita = function () { g.ev('startProteger()'); };            // abre o Proteger (ronda 1)
  g.ganha = function () { g.ev("finishProteger(true, 'ganhou')"); };
  return g;
}
const todas = function (g) { return JSON.stringify(g.ev('state')); };

// 1. Vitória com prémio na ronda 1, com pista (isco da vinha): 1 página, data de Lisboa, fala no sítio certo.
{
  const g = abrir({}); g.visita(); g.ganha();
  const ids = g.ids();
  ok(ids.length === 1 && /^vinha_/.test(ids[0]), 'devia dar 1 página da vinha, deu ' + ids);
  ok(g.paginas()[ids[0]] === HOJE, 'a data devia ser ' + HOJE + ', é ' + g.paginas()[ids[0]]);
  ok(g.falaCaderno(), 'devia mostrar a fala "Página nova no Caderno (Perfil)."');
  const falas = g.reg.falas[g.reg.falas.length - 1];
  const iCad = falas.findIndex(function (x) { return typeof x === 'string' && /Caderno/.test(x); });
  const iPremio = falas.findIndex(function (x) { return typeof x === 'string' && /^\+/.test(x); });
  ok(iCad >= 1 && iPremio === iCad + 1, 'a fala do Caderno devia vir mesmo antes do prémio: ' + JSON.stringify(falas));
  ok(g.ev('state.uvas') > 0 && g.ev('state.proteger.vitoriasComPremioHoje') === 1, 'o prémio de sempre devia manter-se');
  ok(g.reg.saves === 1, 'a página grava-se no MESMO saveState da vitória (saves = ' + g.reg.saves + ')');
  // Mesma vitória repetida (toque duplo): não dá 2 páginas nem muda a data.
  g.ganha();
  ok(g.ids().length === 1 && g.paginas()[ids[0]] === HOJE, 'a vitória repetida não devia dar 2.ª página');
}

// 2. Nova visita dá a página seguinte da mesma pista; a 1.ª não muda; no máximo 2 por dia.
{
  const g = abrir({}); g.visita(); g.ganha();
  const primeira = g.ids()[0];
  g.paginas()[primeira] = '2026-10-01'; // data antiga: não pode mudar
  g.visita(); g.ganha();
  ok(g.ids().length === 2 && g.paginas()[primeira] === '2026-10-01', 'a 2.ª visita devia dar outra página sem mexer na 1.ª: ' + g.ids());
  g.visita(); g.ganha(); // 3.ª vitória: já sem prémio (treino)
  ok(g.ids().length === 2, 'no máximo 2 páginas por dia (limite de 2 vitórias com prémio), há ' + g.ids().length);
  ok(g.ev('state.proteger.vitoriasComPremioHoje') === 2, 'o limite de prémios devia continuar a 2');
}

// 3. Sem página: treino (sem prémio), perda, ?pista=, nível < 3, sem pista, adega, Cave fechada.
{
  let g = abrir({ vitorias: 2 }); g.visita(); g.ganha();
  ok(g.ids().length === 0 && !g.falaCaderno() && !g.falaCompleto(), 'treino (sem prémio) não devia dar página');
  g = abrir({}); g.visita(); g.ev("finishProteger(false, 'perdeu')");
  ok(g.ids().length === 0 && g.reg.saves === 0 && !g.falaCaderno(), 'perder não devia dar página nem gravar');
  g = abrir({ search: '?pista=vinha', feitas: 0, isco: null }); g.visita(); g.ev('protegerIscoResponder(true)'); g.ganha();
  ok(g.ids().length === 0 && !g.falaCaderno() && g.ev('state.proteger.isco') === null, '?pista= (teste) nunca devia gravar página');
  g = abrir({ nivel: 2 }); g.visita(); g.ganha();
  ok(g.ids().length === 0 && !g.falaCaderno(), 'nível < 3 não devia dar página');
  g = abrir({ nivel: 2, antigo: true }); g.visita(); g.ganha();
  ok(g.ids().length === 1, 'jogador antigo tem o Caderno aberto (ecraDesbloqueado) e devia ter página');
  g = abrir({ feitas: 0, isco: null }); g.visita(); g.ganha();
  ok(g.ids().length === 0 && !g.falaCaderno() && !g.falaCompleto(), 'sem pista do Chizo hoje não devia dar página');
  g = abrir({ isco: { dia: HOJE, indice: 0, alvo: 'adega' } }); g.visita(); g.ganha();
  ok(g.ids().length === 0 && !g.falaCaderno() && !g.falaCompleto(), 'alvo adega (sem minijogo) não devia dar página');
  g = abrir({ isco: { dia: HOJE, indice: 0, alvo: 'cave' }, garrafa: false }); g.visita(); g.ganha();
  ok(g.ids().length === 0 && !g.falaCaderno() && !g.falaCompleto(), 'Cave fechada não devia dar página da cave');
  g = abrir({ isco: { dia: HOJE, indice: 0, alvo: 'cave' }, garrafa: true }); g.visita(); g.ganha();
  ok(g.ids().length === 1 && /^cave_/.test(g.ids()[0]), 'Cave aberta devia dar página da cave');
}

// 4. Rondas extra do tempo: só a 1.ª ronda dá página, com o alvo e o isco CAPTURADOS na ronda 1.
{
  const g = abrir({ ceu: 'nevoeiro', isco: { dia: HOJE, indice: 0, alvo: 'vinha' } }); g.visita();
  ok(g.ev('protegerRondasTotal') === 2, 'com nevoeiro devia haver 2 rondas');
  ok(g.ev('protegerCaderno && protegerCaderno.alvo') === 'vinha' && g.ev('protegerCaderno.isco') === true, 'a ronda 1 devia capturar alvo (vinha, o do isco) e isco');
  g.ganha(); // ronda 1 -> arranca a 2.ª
  ok(g.ev('protegerRondaAtual') === 2 && g.ids().length === 1 && /^vinha_/.test(g.ids()[0]), 'a ronda 1 devia dar a página da vinha (alvo capturado), deu ' + g.ids());
  ok(g.ev('protegerIscoNaRonda') === false, 'na ronda extra o isco já não vale (é por isso que se captura na 1.ª)');
  g.ganha(); // ronda 2 (extra)
  ok(g.ids().length === 1, 'a ronda extra não devia dar 2.ª página, há ' + g.ids().length);
  // Ronda extra sozinha, sem captura: nada.
  const h = abrir({}); h.ev('protegerRondaAtual = 2; protegerRondasTotal = 2; startProteger(true);'); h.ganha();
  ok(h.ids().length === 0, 'uma ronda extra sem captura não devia dar página');
}

// 5. Alvo completo: fala engraçada, sem página nova e sem mexer nas existentes.
{
  const antes = { vinha_1: '2026-09-01', vinha_2: '2026-09-02', vinha_rara: '2026-09-03' };
  const g = abrir({ paginas: antes }); g.visita(); g.ganha();
  ok(g.falaCompleto() && !g.falaCaderno(), 'alvo completo devia dar a fala "Os porcos já não têm papéis para perder."');
  ok(JSON.stringify(g.paginas()) === JSON.stringify(antes), 'alvo completo não devia mudar as páginas');
}

// 6. A gravação só toca em state.caderno.paginas (e nos prémios de sempre).
{
  const g = abrir({});
  const antes = JSON.parse(todas(g));
  g.visita(); g.ganha();
  const depois = JSON.parse(todas(g));
  ['uvas', 'gotas', 'reputacao', 'proteger'].forEach(function (k) { delete antes[k]; delete depois[k]; });
  ok(Object.keys(depois.caderno.paginas).length === 1, 'só devia haver 1 página gravada');
  delete antes.caderno; delete depois.caderno;
  ok(JSON.stringify(antes) === JSON.stringify(depois), 'o resto do estado não devia mudar');
}

// 7. Textos das falas: PT, EN e ES, até 60 caracteres, diferentes de língua para língua.
{
  const vistos = {};
  ['pt', 'en', 'es'].forEach(function (l) {
    const g = abrir({ lang: l });
    const p = g.ev('pStr().cadernoPagina'), c = g.ev('pStr().cadernoCompleto');
    ok(typeof p === 'string' && p.length > 0 && p.length <= 60, l + ': cadernoPagina inválida (' + p + ')');
    ok(typeof c === 'string' && c.length > 0 && c.length <= 60, l + ': cadernoCompleto inválida (' + c + ')');
    vistos[p] = vistos[c] = 1;
  });
  ok(Object.keys(vistos).length === 6, 'as 6 falas deviam ser todas diferentes');
}

console.log(falhas === 0 ? 'OK' : falhas + ' FALHA(S)');
process.exit(falhas === 0 ? 0 : 1);
