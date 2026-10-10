#!/usr/bin/env node
// A Loja da Quinta (js/loja.js, Nível 7): vender bagaceira por Reputação, até 3 por dia, com fundo pelo tempo (como a Vinha).
//   - lojaVender gasta 1 bagaceira (state.adega.bagaceira) e dá +1 de Reputação; sem bagaceira recusa sem alterar nada; no máximo 3 por dia;
//   - o dia seguinte repõe as vendas; a data do aparelho atrás NÃO repõe; mais de 2 dias à frente repõe (diaLisboaMudou/diaLisboaEfetivo);
//   - state.loja reparado em memória (negativo, texto, em falta); só o clique grava (um saveState) e ignora o duplo clique; recusar não grava;
//   - fundo: granizo ou trovoada -> lojas_casas_janelas_abertas_2, chuva -> lojas_casas, o resto e tempo indisponível -> casa_loja_meio_da_vinha_4;
//   - abre no nível 7 (o da Estrada), jogador antigo abre; nada de uvas, moeda nova, compras, garrafas nem Bagaço; nuvem intacta;
//   - textos PT/EN/ES com as mesmas chaves; as 3 imagens são cópia exata das originais (que ficam), a 4.ª não se copia.
// Corre js/ REAIS em vm com um relógio controlado. Depois de passar, aplica "mutações" e confirma que o teste as apanha.
//
// Uso: node scripts/verificar-loja.js
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const RAIZ = path.join(__dirname, '..');
const FICHEIROS = ['state.js', 'i18n.js', 'niveis.js', 'estacoes.js', 'tempo.js', 'alambique.js', 'loja.js'];
const FONTES = {};
FICHEIROS.concat(['main.js', 'estrada.js']).forEach(function (f) { FONTES[f] = fs.readFileSync(path.join(RAIZ, 'js', f), 'utf8'); });
FONTES['index.html'] = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');

const FUNDOS = { sol: 'assets/ecras/casa_loja_meio_da_vinha_4.jpg', chuva: 'assets/ecras/lojas_casas.jpg', trovoada: 'assets/ecras/lojas_casas_janelas_abertas_2.jpg' };

function suite(fontes) {
  const falhas = [];
  function ok(cond, msg) { if (!cond) falhas.push(msg); }
  const semCom = function (s) { return s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''); };

  function abrir(pesquisa, agoraMs) {
    const relogio = { t: agoraMs === undefined ? Date.parse('2026-10-09T12:00:00Z') : agoraMs };
    const gravacoes = [];
    const elementos = {};
    const el = function (id) { return elementos[id] || (elementos[id] = { innerHTML: '', id: id }); };
    class Relogio extends Date {
      constructor(...a) { if (a.length === 0) super(relogio.t); else super(...a); }
      static now() { return relogio.t; }
    }
    const reg = { fundos: [], falas: [], sons: [], botao: { disabled: false } };
    const sb = {
      console: { log() {}, warn() {}, error() {} },
      localStorage: { getItem: function () { return null; }, setItem: function (k) { gravacoes.push(k); }, removeItem: function () {} },
      location: { search: pesquisa || '' }, URLSearchParams: URLSearchParams, Intl: Intl, Date: Relogio, setTimeout: function () {}, Image: function () {},
      document: { querySelectorAll: function () { return []; }, querySelector: function () { return reg.botao; }, getElementById: el, addEventListener: function () {} },
      Telegram: { WebApp: {} }
    };
    sb.window = sb; sb.addEventListener = function () {};
    const cx = vm.createContext(sb);
    FICHEIROS.forEach(function (f) { vm.runInContext(fontes[f], cx, { filename: 'js/' + f }); });
    vm.runInContext(`
      this.definirFundo = function (m, src) { __fundos.push(src); };
      this.atualizarDialogo = function (m) { __falas.push(m); };
      this.updateStatsDisplays = function () {}; this.vibrar = function () {}; this.tocarSom = function (n) { __sons.push(n); };
      this.mostrarFalas = function () {}; this.voltarEcraAnterior = function () {};
      this.__fundos = []; this.__falas = []; this.__sons = [];
    `, cx);
    const g = { cx: cx, gravacoes: gravacoes, relogio: relogio, el: el, reg: reg };
    g.ev = function (c) { return vm.runInContext(c, cx); };
    g.json = function (c) { return JSON.parse(vm.runInContext('JSON.stringify(' + c + ')', cx)); };
    g.ir = function (ms) { relogio.t = ms; };
    return g;
  }
  const g0 = abrir('');
  const base = function (extra) {
    return Object.assign({
      uvas: 50, gotas: 30, garrafas: 4, reputacao: 100, conhecimento: 3,
      adega: { bagaco: 9, aguardente: 4, bagaceira: 5, cooldowns: {}, lote: null, historico: [] },
      loja: { dia: null, vendasHoje: 0 }
    }, extra || {});
  };
  const copia = function (x) { return JSON.parse(JSON.stringify(x)); };
  const vender = function (estado, dia) { g0.cx.__e = estado; const r = g0.json('lojaVender(__e, ' + JSON.stringify(dia) + ')'); return { r: r, e: JSON.parse(JSON.stringify(g0.cx.__e)) }; };
  const pode = function (estado, dia) { g0.cx.__e = estado; return g0.json('lojaPodeVender(__e, ' + JSON.stringify(dia) + ')'); };
  const D = '2026-10-09', D1 = '2026-10-10', D2 = '2026-10-11', D3 = '2026-10-12', ANT = '2026-10-08';

  // ---------------- 1. Vender ----------------
  {
    const e0 = base();
    const { r, e } = vender(copia(e0), D);
    ok(r.ok === true && r.motivo === null && r.reputacaoGanha === 1 && r.vendasHoje === 1 && r.restam === 2, 'vender: ok, +1 Reputação, 1 venda, restam 2: ' + JSON.stringify(r));
    ok(e.adega.bagaceira === 4 && e.reputacao === 101, 'vender gasta 1 bagaceira e dá +1 de Reputação');
    ok(e.loja.dia === D && e.loja.vendasHoje === 1, 'regista o dia e a venda');
    ok(e.uvas === 50 && e.gotas === 30 && e.garrafas === 4 && e.adega.bagaco === 9 && e.adega.aguardente === 4 && e.conhecimento === 3, 'não toca em uvas, Gotas, garrafas, Bagaço, aguardente vínica nem Conhecimento');
    ok(g0.ev('LOJA_CONFIG.vendasPorDia') === 3 && g0.ev('LOJA_CONFIG.reputacaoPorBagaceira') === 1, 'LOJA_CONFIG: 3 por dia, +1');
    const p = pode(copia(e0), D);
    ok(p.ok === true && p.vendasHoje === 0 && p.limite === 3 && p.bagaceiras === 5, 'lojaPodeVender só lê: ok, 0 vendas, limite 3, 5 bagaceiras');
    ok(JSON.stringify(e0) === JSON.stringify(base()), 'lojaPodeVender não alterou o estado');
  }
  // ---------------- 2. Sem bagaceira: recusa sem alterar ----------------
  [0, undefined, -3, 'x', null, NaN, {}, [], '5', 0.5].forEach(function (v) {
    const e0 = base(); if (v === undefined) delete e0.adega.bagaceira; else e0.adega.bagaceira = v;
    const antes = JSON.stringify(e0);
    const { r, e } = vender(JSON.parse(antes), D);
    ok(r.ok === false && r.motivo === 'sem_bagaceira' && JSON.stringify(e) === antes, 'bagaceira ' + JSON.stringify(v) + ': recusa (sem_bagaceira) sem alterar nada, deu ' + JSON.stringify(r));
  });
  { const e0 = base(); delete e0.adega; const antes = JSON.stringify(e0); const { r, e } = vender(JSON.parse(antes), D); ok(r.motivo === 'sem_bagaceira' && JSON.stringify(e) === antes, 'sem adega: recusa sem alterar'); }
  { const e0 = base(); e0.adega.bagaceira = 2.7; const { r, e } = vender(e0, D); ok(r.ok && e.adega.bagaceira === 1, 'bagaceira 2.7 conta 2: a venda deixa 1, ficou ' + e.adega.bagaceira); }
  // entradas inválidas
  [['lixo'], [undefined], [null], ['2026-13-45'], ['2026-1-9'], [20261009]].forEach(function (c) {
    const e0 = base(); const antes = JSON.stringify(e0);
    const { r, e } = vender(JSON.parse(antes), c[0]);
    ok(r.ok === false && r.motivo === 'dia_invalido' && JSON.stringify(e) === antes, 'dia ' + JSON.stringify(c[0]) + ' inválido: recusa sem alterar');
  });
  ok(vender(null, D).r.motivo === 'estado_invalido' && vender([], D).r.ok === false, 'estado inválido recusa');
  // ---------------- 3. Limite de 3 por dia ----------------
  {
    let e = base(); e.adega.bagaceira = 10;
    const a = vender(e, D), b = vender(a.e, D), c = vender(b.e, D);
    ok(a.r.ok && b.r.ok && c.r.ok && c.e.adega.bagaceira === 7 && c.e.reputacao === 103 && c.e.loja.vendasHoje === 3 && c.r.restam === 0, 'três vendas no mesmo dia: 7 bagaceiras, +3 de Reputação, restam 0');
    const antes = JSON.stringify(c.e);
    const d = vender(JSON.parse(antes), D);
    ok(d.r.ok === false && d.r.motivo === 'limite' && JSON.stringify(d.e) === antes, 'a 4.ª venda do dia é recusada (limite) sem alterar nada');
    ok(pode(JSON.parse(antes), D).motivo === 'limite', 'lojaPodeVender diz limite');
    // limite tem prioridade sobre sem bagaceira
    const z = JSON.parse(antes); z.adega.bagaceira = 0;
    ok(pode(z, D).motivo === 'limite', 'no limite e sem bagaceira, diz limite');
    // ---------------- 4. O dia seguinte repõe ----------------
    const dia2 = vender(JSON.parse(antes), D1);
    ok(dia2.r.ok && dia2.e.loja.dia === D1 && dia2.e.loja.vendasHoje === 1 && dia2.e.adega.bagaceira === 6, 'no dia seguinte as vendas repõem-se (1 venda nova)');
    ['2026-10-31|2026-11-01', '2026-12-31|2027-01-01', '2028-02-28|2028-02-29'].forEach(function (p) {
      const [h0, h1] = p.split('|'); const x = base(); x.adega.bagaceira = 5; x.loja = { dia: h0, vendasHoje: 3 };
      ok(vender(x, h1).r.ok === true, 'virada ' + h0 + ' -> ' + h1 + ' repõe');
    });
    // ---------------- 5. Data atrás e teto de 2 dias ----------------
    const futuro = function (dia, vendas) { const x = base(); x.adega.bagaceira = 10; x.loja = { dia: dia, vendasHoje: vendas }; return x; };
    const atras1 = futuro(D1, 3); const ref1 = JSON.stringify(atras1);
    const r1 = vender(JSON.parse(ref1), D);
    ok(r1.r.ok === false && r1.r.motivo === 'limite' && JSON.stringify(r1.e) === ref1, 'data atrás (guardado 1 dia à frente, 3 vendas): NÃO repõe, continua no limite');
    const r2 = vender(futuro(D1, 1), D);
    ok(r2.r.ok === true && r2.e.loja.dia === D1 && r2.e.loja.vendasHoje === 2, 'data atrás com 1 venda: soma 2 e o dia guardado não recua (' + r2.e.loja.dia + ')');
    ok(vender(futuro(D2, 3), D).r.motivo === 'limite', '2 dias à frente ainda não repõe');
    const r3 = vender(futuro(D3, 3), D);
    ok(r3.r.ok === true && r3.e.loja.dia === D && r3.e.loja.vendasHoje === 1, 'mais de 2 dias à frente repõe (o dia passa a hoje, 1 venda): ' + JSON.stringify(r3.e.loja));
    ok(vender(futuro('2027-01-02', 3), D).r.ok === true, 'um ano à frente repõe');
    // dia igual não repõe por engano
    ok(vender(futuro(D, 3), D).r.motivo === 'limite', 'o mesmo dia não repõe por engano');
    // dia anterior repõe (dia novo)
    ok(vender(futuro(ANT, 3), D).r.ok === true, 'dia guardado anterior a hoje repõe');
  }
  // ---------------- 6. state.loja reparado ----------------
  [[null], ['x'], [[]], [42], [{ dia: 'lixo', vendasHoje: -2 }], [{ dia: null, vendasHoje: 'x' }], [{ dia: D, vendasHoje: 1.5 }], [{ dia: D, vendasHoje: -1 }], [{}], [undefined]].forEach(function (c) {
    const e0 = base(); if (c[0] === undefined) delete e0.loja; else e0.loja = c[0];
    const p = pode(copia(e0), D);
    ok(p.ok === true && p.vendasHoje === 0, 'loja ' + JSON.stringify(c[0]) + ': conta 0 vendas, sem rebentar (' + JSON.stringify(p) + ')');
    const { r, e } = vender(copia(e0), D);
    ok(r.ok === true && e.loja && e.loja.dia === D && e.loja.vendasHoje === 1, 'loja ' + JSON.stringify(c[0]) + ': a venda repara o campo para { dia: hoje, vendasHoje: 1 }, ficou ' + JSON.stringify(e.loja));
  });
  { // lojaEstado repara em memória
    [{ dia: 5, vendasHoje: -3 }, { dia: 'lixo', vendasHoje: 'x' }, { dia: D, vendasHoje: 1.5 }].forEach(function (l) {
      g0.cx.__e = { loja: l };
      const r = g0.json('(lojaEstado(__e), __e.loja)');
      ok(r.dia === (l.dia === D ? D : null) && r.vendasHoje === 0, 'lojaEstado repara ' + JSON.stringify(l) + ' -> ' + JSON.stringify(r));
    });
  }
  { // vendasHoje 2 num dia válido: continua
    const e0 = base({ loja: { dia: D, vendasHoje: 2 } }); const { r, e } = vender(e0, D);
    ok(r.ok && e.loja.vendasHoje === 3, '2 vendas guardadas hoje: a próxima é a 3.ª');
  }
  // ---------------- 7. O fundo pelo tempo ----------------
  {
    const cond = function (o) { return Object.assign({ disponivel: true, ceu: 'sol', granizo: false, tempC: 20, ventoKmh: 10 }, o); };
    const fundo = function (c) { g0.cx.__t = c; return g0.ev('lojaFundoPara(__t)'); };
    ok(fundo(cond({ ceu: 'chuva' })) === FUNDOS.chuva, 'chuva -> lojas_casas.jpg');
    ok(fundo(cond({ ceu: 'trovoada' })) === FUNDOS.trovoada, 'trovoada -> lojas_casas_janelas_abertas_2.jpg');
    ok(fundo(cond({ ceu: 'trovoada', granizo: true })) === FUNDOS.trovoada, 'granizo -> lojas_casas_janelas_abertas_2.jpg');
    ok(fundo(cond({ ceu: 'chuva', granizo: true })) === FUNDOS.trovoada, 'granizo com qualquer céu -> janelas abertas');
    ['sol', 'noite', 'nevoeiro', 'vento', 'frio', 'calor', 'xyz', null].forEach(function (ceu) { ok(fundo(cond({ ceu: ceu })) === FUNDOS.sol, 'céu ' + ceu + ' -> casa_loja_meio_da_vinha_4.jpg'); });
    ok(fundo({ disponivel: false }) === FUNDOS.sol && fundo(null) === FUNDOS.sol && fundo(undefined) === FUNDOS.sol && fundo({}) === FUNDOS.sol && fundo('chuva') === FUNDOS.sol && fundo(cond({ disponivel: 'sim', ceu: 'chuva' })) === FUNDOS.sol, 'tempo indisponível ou estranho -> sol');
    // pelo ?tempo= e sem tempo
    [['chuva', 'chuva'], ['trovoada', 'trovoada'], ['granizo', 'trovoada'], ['sol', 'sol'], ['nevoeiro', 'sol'], ['calor', 'sol'], ['noite', 'sol']].forEach(function (p) {
      const g = abrir('?tempo=' + p[0]);
      ok(g.ev('fundoTempoLoja()') === FUNDOS[p[1]], '?tempo=' + p[0] + ' -> fundo ' + p[1] + ', deu ' + g.ev('fundoTempoLoja()'));
    });
    ok(abrir('').ev('fundoTempoLoja()') === FUNDOS.sol, 'sem tempo (indisponível) -> sol');
    // renderLoja desenha com esse fundo
    const g = abrir('?tempo=chuva'); g.ev('state.reputacao = 1200; state.adega.bagaceira = 2;'); g.ev('renderLoja()');
    ok(g.json('__fundos').pop() === FUNDOS.chuva, 'renderLoja usa o fundo do tempo (chuva)');
  }
  // ---------------- 8. Nível 7, jogador antigo ----------------
  {
    const g = abrir('');
    ok(g.ev('NIVEL_NECESSARIO_POR_ECRA.loja') === 7 && g.ev('NIVEL_NECESSARIO_POR_ECRA.estrada') === 7, 'a Loja abre no nível 7, como a Estrada');
    const abre = function (rep, antigo) { g.ev('state.reputacao = ' + rep + '; state.acesso.jogadorAntigo = ' + antigo + ';'); return g.ev("ecraDesbloqueado('loja')"); };
    ok(abre(999, false) === false && abre(0, false) === false, 'abaixo do nível 7 (999 de Reputação) a Loja não abre');
    ok(abre(1000, false) === true && abre(5000, false) === true, 'no nível 7 (1000) e acima a Loja abre');
    ok(abre(10, true) === true, 'jogador antigo abre como nos outros ecrãs novos');
    // linha na Quinta
    g.ev('state.acesso.jogadorAntigo = false; state.reputacao = 999;'); g.ev('atualizarLinhaLojaQuinta()');
    ok(g.el('loja-linha-container').innerHTML === '', 'nível 6: sem linha da Loja na Quinta');
    g.ev('state.reputacao = 1000;'); g.ev('atualizarLinhaLojaQuinta()');
    ok(/onclick="goTo\('loja'\)"/.test(g.el('loja-linha-container').innerHTML) && g.el('loja-linha-container').innerHTML.indexOf('A Loja: vende bagaceira por Reputação') !== -1, 'nível 7: linha na Quinta que abre a Loja');
  }
  // ---------------- 9. O ecrã e o clique (só o clique grava) ----------------
  {
    const g = abrir('', Date.parse('2026-10-09T12:00:00Z'));
    g.ev('state.reputacao = 1200; state.uvas = 77; state.adega.bagaceira = 4; state.loja = { dia: null, vendasHoje: 0 };');
    const antes = g.ev('JSON.stringify(state)');
    const gr0 = g.gravacoes.length;
    g.ev('renderLoja()');
    let h = g.el('loja-container').innerHTML;
    ok(g.ev('JSON.stringify(state)') === antes && g.gravacoes.length === gr0, 'desenhar o ecrã não altera nem grava');
    ok(h.indexOf('Bagaceiras: 4 · Vendas hoje: 0/3') !== -1 && h.indexOf('Vender 1 bagaceira (+1 Reputação)') !== -1 && h.indexOf('loja-botao" onclick="lojaVenderClique()" disabled') === -1 && h.indexOf('+1 de Reputação. Até 3 por dia') !== -1, 'o ecrã mostra as bagaceiras, as vendas de hoje, o limite, a intro e o botão ativo');
    const g1 = g.gravacoes.length;
    g.ev('lojaVenderClique()');
    h = g.el('loja-container').innerHTML;
    ok(g.ev('state.adega.bagaceira') === 3 && g.ev('state.reputacao') === 1201 && g.ev('state.uvas') === 77 && g.gravacoes.length === g1 + 1, 'clique: vende 1, +1 de Reputação, grava, sem tocar nas uvas');
    ok(h.indexOf('Vendeste 1 bagaceira. +1 de Reputação.') !== -1 && h.indexOf('Bagaceiras: 3 · Vendas hoje: 1/3') !== -1 && g.json('__sons').indexOf('objetivoCumprido') !== -1, 'depois da venda: mensagem, contadores novos e som');
    ok(g.json('__falas').pop() === 'Negócio feito! A Quinta agradece.', 'a fala do YoshiCat depois de vender');
    const g2 = g.gravacoes.length;
    g.ev('lojaVenderClique()');
    ok(g.ev('state.adega.bagaceira') === 3 && g.gravacoes.length === g2, 'duplo clique (2.º toque no mesmo instante): ignorado, sem gastar nem gravar');
    g.ir(g.relogio.t + 600); g.ev('lojaVenderClique()');
    ok(g.ev('state.adega.bagaceira') === 2 && g.ev('state.loja.vendasHoje') === 2, 'um toque depois do intervalo vende a 2.ª');
    g.ir(g.relogio.t + 600); g.ev('lojaVenderClique()');
    g.ir(g.relogio.t + 600);
    const g3 = g.gravacoes.length;
    g.ev('lojaVenderClique()');
    h = g.el('loja-container').innerHTML;
    ok(g.ev('state.loja.vendasHoje') === 3 && g.ev('state.adega.bagaceira') === 1 && g.gravacoes.length === g3, 'no limite (3 vendas) o clique recusa sem gravar');
    ok(/loja-botao" onclick="lojaVenderClique\(\)" disabled/.test(h) && h.indexOf('Hoje já vendeste 3. Volta amanhã.') !== -1, 'no limite o botão fica apagado e diz "Hoje já vendeste 3. Volta amanhã."');
    g.ev('state.loja = { dia: null, vendasHoje: 0 }; state.adega.bagaceira = 0; renderLoja()');
    h = g.el('loja-container').innerHTML;
    ok(/loja-botao" onclick="lojaVenderClique\(\)" disabled/.test(h) && h.indexOf('Não tens bagaceira para vender. Faz mais no Alambique, na Adega.') !== -1, 'sem bagaceira o botão fica apagado e diz como arranjar');
    ['en', 'es'].forEach(function (l) {
      g.ev('currentLang = ' + JSON.stringify(l) + '; state.adega.bagaceira = 2; state.loja = { dia: null, vendasHoje: 0 }; renderLoja()');
      const x = g.el('loja-container').innerHTML;
      ok(x.indexOf(l === 'en' ? 'Sell 1 pomace spirit (+1 Reputation)' : 'Vender 1 aguardiente de orujo (+1 de Reputación)') !== -1, l + ': o botão está traduzido');
    });
  }
  // ---------------- 10. Estado novo, saves antigos, nuvem ----------------
  {
    const g = abrir('');
    ok(JSON.stringify(g.json('defaultState().loja')) === '{"dia":null,"vendasHoje":0}', 'defaultState: loja = { dia: null, vendasHoje: 0 }');
    const antigo = g.json('mergeDeep(defaultState(), { reputacao: 500, adega: { bagaco: 2, aguardente: 3, bagaceira: 6, cooldowns: {}, lote: null, historico: [] } })');
    ok(antigo.loja.dia === null && antigo.loja.vendasHoje === 0 && antigo.adega.bagaceira === 6 && antigo.reputacao === 500, 'save antigo (sem loja): ganha o campo por omissão e o resto fica igual');
    const comLoja = g.json('mergeDeep(defaultState(), { loja: { dia: "2026-10-09", vendasHoje: 2 } })');
    ok(comLoja.loja.dia === '2026-10-09' && comLoja.loja.vendasHoje === 2, 'save com loja: mantém-se');
    const velho = g.json('mergeDeep({ reputacao: 0 }, { reputacao: 3, loja: { dia: "2026-10-09", vendasHoje: 1 } })');
    ok(velho.loja.vendasHoje === 1, 'versão antiga a abrir um estado com loja: o campo não se perde');
    ok(!/loja/i.test(fs.readFileSync(path.join(RAIZ, 'js', 'nuvem.js'), 'utf8')), 'nuvem.js não foi tocado (nenhuma junta fala da loja)');
  }
  // ---------------- 11. Textos ----------------
  {
    const T = g0.json('TRANSLATIONS');
    const chaves = ['loja.title', 'loja.linha', 'loja.desc', 'loja.estado', 'loja.btn', 'loja.ok', 'loja.semBagaceira', 'loja.limite', 'loja.fala', 'loja.erro'];
    ['pt', 'en', 'es'].forEach(function (l) {
      chaves.forEach(function (k) { ok(typeof T[l][k] === 'string' && T[l][k].trim() !== '', l + ': falta ' + k); });
      ok(/\{rep\}/.test(T[l]['loja.desc']) && /\{n\}/.test(T[l]['loja.desc']) && /\{n\}/.test(T[l]['loja.limite']) && /\{v\}/.test(T[l]['loja.estado']) && /\{max\}/.test(T[l]['loja.estado']) && /\{rep\}/.test(T[l]['loja.btn']) && /\{rep\}/.test(T[l]['loja.ok']), l + ': os marcadores {rep}, {n}, {v}, {max} estão nos textos certos');
      ok(!/€|euro|dinheiro|money|dinero|preço|price|precio|mercado|market|feira|fair|DOP|IGP|lei\b|law|legal/i.test(chaves.map(function (k) { return T[l][k]; }).join(' ')), l + ': os textos da Loja não afirmam preços, mercados nem factos');
      ok(!/\d/.test(T[l]['loja.fala'] + T[l]['loja.semBagaceira'] + T[l]['loja.erro']), l + ': falas e mensagens sem números');
    });
    ok(/pomace spirit/.test(T.en['loja.btn']) && /aguardiente de orujo/.test(T.es['loja.btn']) && /bagaceira/.test(T.pt['loja.btn']), 'PT "bagaceira", EN "pomace spirit", ES "aguardiente de orujo"');
    const lk = function (l) { return Object.keys(T[l]).filter(function (k) { return /^loja\./.test(k); }).sort().join(); };
    ok(lk('pt') === lk('en') && lk('en') === lk('es') && lk('pt').split(',').length === chaves.length, 'as 3 línguas têm as mesmas ' + chaves.length + ' chaves loja.*');
    ok(Object.keys(T.pt).length === Object.keys(T.en).length && Object.keys(T.en).length === Object.keys(T.es).length, 'as 3 línguas têm o mesmo número de chaves');
    ok(new Set(['pt', 'en', 'es'].map(function (l) { return T[l]['loja.fala']; })).size === 3, 'a fala é própria em cada língua');
  }
  // ---------------- 12. Ligações (main.js, index.html), imagens, regras puras ----------------
  {
    const main = semCom(fontes['main.js']);
    ok(/loja:\s*\{\s*src:\s*'assets\/ecras\/casa_loja_meio_da_vinha_4\.jpg'\s*\}/.test(main), 'FUNDO_DOS_ECRAS.loja = o fundo de sol (reserva)');
    ok(/loja:\s*'quinta'/.test(main) && /if \(screen === 'loja'\) renderLoja\(\)/.test(main) && /atualizarLinhaLojaQuinta/.test(main), 'main.js: ecrã de voltar, goTo e linha da Quinta ligados');
    ok(/atualizarLinhaLojaQuinta/.test(fontes['niveis.js'] || fs.readFileSync(path.join(RAIZ, 'js', 'niveis.js'), 'utf8')), 'niveis.js refaz a linha da Loja ao subir de nível');
    const html = fontes['index.html'];
    ok(/id="screen-loja"/.test(html) && /id="loja-container"/.test(html) && /id="loja-linha-container"/.test(html) && /#screen-loja\.content/.test(html), 'index.html tem o ecrã, o contentor, a linha da Quinta e a classe do jogo-cheio');
    const pos = function (f) { return html.indexOf('<script src="js/' + f + '.js'); };
    ok(pos('loja') > pos('alambique') && pos('loja') > pos('tempo') && pos('loja') < pos('main'), 'index.html: loja.js depois do alambique.js e do tempo.js e antes do main.js');
    ok(!/loja|Loja/.test(semCom(fontes['estrada.js'])), 'estrada.js não foi tocado (a Loja não parte a Estrada)');
    const L = semCom(fs.readFileSync(path.join(RAIZ, 'js', 'loja.js'), 'utf8'));
    const regras = ['lojaPodeVender', 'lojaVender', 'lojaFundoPara', 'lojaEstado', 'lojaVendasDeHoje'].map(function (f) { return g0.ev(f + '.toString()'); }).join('\n');
    ok(!/Math\.random|Date\.now|new Date|saveState|localStorage|document\./.test(regras), 'as regras da Loja são puras (sem relógio, sorteio, gravação nem DOM)');
    ok((L.match(/saveState\(/g) || []).length === 1 && /function lojaVenderClique[\s\S]*saveState\(state\)/.test(L), 'só o clique (lojaVenderClique) grava, uma vez');
    ok((L.match(/Date\.now\(/g) || []).length === 1 && /function lojaVenderClique[\s\S]*Date\.now\(\)/.test(L), 'o único Date.now é o do duplo clique');
    ok(!/state\.(uvas|gotas|garrafas)\s*(-=|\+=|=[^=])|\.bagaco\s*(-=|\+=)|\.aguardente\s*(-=|\+=)|\.garrafas/.test(L), 'loja.js não mexe em uvas, Gotas, garrafas, Bagaço nem aguardente vínica');
    // imagens
    const orig = path.join(RAIZ, 'imagens_JOGO_TELEGRAM');
    ['lojas_casas.jpg', 'lojas_casas_janelas_abertas_2.jpg', 'casa_loja_meio_da_vinha_4.jpg'].forEach(function (f) {
      const dst = path.join(RAIZ, 'assets', 'ecras', f);
      ok(fs.existsSync(dst), 'assets/ecras/' + f + ' existe');
      if (fs.existsSync(dst)) {
        const b = fs.readFileSync(dst);
        ok(b[0] === 0xff && b[1] === 0xd8, f + ' é um JPEG');
        let w = 0, hh = 0;
        for (let i = 2; i < b.length - 9;) { if (b[i] !== 0xff) { i++; continue; } const m = b[i + 1]; if (m >= 0xc0 && m <= 0xc2) { hh = b.readUInt16BE(i + 5); w = b.readUInt16BE(i + 7); break; } i += 2 + b.readUInt16BE(i + 2); }
        ok(w === 714 && hh === 1280, f + ' tem 714x1280, tem ' + w + 'x' + hh);
        ok(b.length <= 250 * 1024, f + ' não devia pesar mais de 250 KB (pesa ' + b.length + ')');
        if (fs.existsSync(path.join(orig, f))) ok(crypto.createHash('md5').update(b).digest('hex') === crypto.createHash('md5').update(fs.readFileSync(path.join(orig, f))).digest('hex'), f + ' é cópia exata do original');
      }
      if (fs.existsSync(orig)) ok(fs.existsSync(path.join(orig, f)), 'o original imagens_JOGO_TELEGRAM/' + f + ' continua no sítio');
    });
    ok(!fs.existsSync(path.join(RAIZ, 'assets', 'ecras', 'caminho_lojas_casa_trabalhadores_3.jpg')), 'a 4.ª imagem (caminho_lojas_casa_trabalhadores_3) não foi copiada');
    const creditos = fs.readFileSync(path.join(RAIZ, 'CREDITOS.md'), 'utf8');
    ['lojas_casas.jpg', 'lojas_casas_janelas_abertas_2.jpg', 'casa_loja_meio_da_vinha_4.jpg'].forEach(function (f) { ok(new RegExp('\\| `assets/ecras/' + f.replace(/\./g, '\\.') + '` \\|[^\\n]*origem a confirmar pelo Nuno').test(creditos), 'CREDITOS.md lista ' + f + ' (origem a confirmar pelo Nuno)'); });
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
  ['vender dá +2 de Reputação', 'loja.js', 'reputacaoPorBagaceira: 1,', 'reputacaoPorBagaceira: 2,'],
  ['vender não gasta bagaceira', 'loja.js', '  a.bagaceira -= 1;\n', ''],
  ['vender gasta 2 bagaceiras', 'loja.js', '  a.bagaceira -= 1;\n', '  a.bagaceira -= 2;\n'],
  ['vender gasta uvas', 'loja.js', '  a.bagaceira -= 1;\n', '  a.bagaceira -= 1; estado.uvas -= 1;\n'],
  ['vender gasta Bagaço', 'loja.js', '  a.bagaceira -= 1;\n', '  a.bagaceira -= 1; a.bagaco -= 1;\n'],
  ['vender dá Reputação mesmo sem bagaceira', 'loja.js', "  if (bag < 1) return recusa('sem_bagaceira', vendas, bag);", ''],
  ['o limite é 4', 'loja.js', 'vendasPorDia: 3,', 'vendasPorDia: 4,'],
  ['o limite não se aplica', 'loja.js', "  if (vendas >= limite) return recusa('limite', vendas, bag);", ''],
  ['o dia seguinte nunca repõe', 'loja.js', 'if (dia === null || diaLisboaMudou(hoje, dia)) return 0;', 'if (dia === null) return 0;'],
  ['a data atrás repõe (!==)', 'loja.js', 'if (dia === null || diaLisboaMudou(hoje, dia)) return 0;', 'if (dia === null || dia !== hoje) return 0;'],
  ['o dia guardado recua com a data atrás', 'loja.js', '  l.dia = dia;', '  l.dia = hoje;'],
  ['sem teto de 2 dias (3 dias à frente não repõe)', 'loja.js', 'if (dia === null || diaLisboaMudou(hoje, dia)) return 0;', 'if (dia === null || hoje > dia) return 0;'],
  ['o campo não é reparado', 'loja.js', "  if (typeof l.dia !== 'string' || !LOJA_DIA_REGEX.test(l.dia)) l.dia = null;\n  l.vendasHoje = lojaInteiro(l.vendasHoje);", ''],
  ['vendasHoje negativo aceite', 'loja.js', "return typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= Number.MAX_SAFE_INTEGER ? n : 0;", "return typeof n === 'number' && Number.isInteger(n) ? n : 0;"],
  ['a bagaceira lida sem sanear (negativa conta)', 'loja.js', 'const bag = a ? alambiqueNumero(a.bagaceira) : 0;', 'const bag = a ? Number(a.bagaceira) || 0 : 0;'],
  ['recusar repara/altera o estado', 'loja.js', "  if (!p.ok) return { ok: false,", "  lojaEstado(estado); if (!p.ok) return { ok: false,"],
  ['dia inválido aceite', 'loja.js', "|| !LOJA_DIA_REGEX.test(hoje) || diaLisboaPartes(hoje) === null) return recusa('dia_invalido');", ") return recusa('dia_invalido');"],
  ['a chuva usa o fundo do sol', 'loja.js', "chuva: 'assets/ecras/lojas_casas.jpg',", "chuva: 'assets/ecras/casa_loja_meio_da_vinha_4.jpg',"],
  ['a trovoada usa o fundo da chuva', 'loja.js', "trovoada: 'assets/ecras/lojas_casas_janelas_abertas_2.jpg'", "trovoada: 'assets/ecras/lojas_casas.jpg'"],
  ['o granizo não conta', 'loja.js', "if (tempo.granizo === true || tempo.ceu === 'trovoada') return F.trovoada;", "if (tempo.ceu === 'trovoada') return F.trovoada;"],
  ['a trovoada não conta (só o granizo)', 'loja.js', "if (tempo.granizo === true || tempo.ceu === 'trovoada') return F.trovoada;", "if (tempo.granizo === true) return F.trovoada;"],
  ['a chuva não conta', 'loja.js', "  if (tempo.ceu === 'chuva') return F.chuva;\n", ''],
  ['tempo indisponível rebenta', 'loja.js', "if (!tempo || typeof tempo !== 'object' || tempo.disponivel !== true) return F.sol;", ''],
  ['o ecrã não usa o fundo do tempo', 'loja.js', "definirFundo('foto', fundoTempoLoja());", "definirFundo('foto', LOJA_CONFIG.fundos.sol);"],
  ['abre no nível 6', 'niveis.js', '  loja: 7,\n', '  loja: 6,\n'],
  ['sem duplo clique', 'loja.js', 'if (agora - lojaUltimoCliqueMs < LOJA_ENTRE_CLIQUES_MS) return;', ''],
  ['o clique grava duas vezes', 'loja.js', '      saveState(state);\n      updateStatsDisplays();\n      lojaResultado', '      saveState(state); saveState(state);\n      updateStatsDisplays();\n      lojaResultado'],
  ['o clique grava mesmo recusando', 'loja.js', '    const r = lojaVender(state, lojaDiaDeHoje());\n    if (r.ok) {', '    const r = lojaVender(state, lojaDiaDeHoje());\n    saveState(state);\n    if (r.ok) {'],
  ['a regra usa o relógio', 'loja.js', 'function lojaVendasDeHoje(estado, hoje) {', 'function lojaVendasDeHoje(estado, hoje) {\n  void Date.now();'],
  ['o estado por omissão perde o campo', 'state.js', '    loja: {\n      dia: null,\n      vendasHoje: 0\n    },\n', ''],
  ['texto em falta (EN)', 'i18n.js', "    'loja.btn': 'Sell 1 pomace spirit (+{rep} Reputation)',\n", ''],
  ['texto afirma um preço', 'i18n.js', "'Deal done! The Quinta says thanks.'", "'Deal done! At the market price of 5 euro.'"],
  ['rótulo ES errado', 'i18n.js', "'Vender 1 aguardiente de orujo (+{rep} de Reputación)'", "'Vender 1 aguardiente (+{rep} de Reputación)'"],
  ['o ecrã da Loja sai do index.html', 'index.html', '<div id="screen-loja" class="screen content">', '<div id="screen-xloja" class="screen content">'],
  ['a linha da Quinta sai do main.js', 'main.js', "    if (typeof atualizarLinhaLojaQuinta === 'function') atualizarLinhaLojaQuinta();\n", ''],
  ['o goTo não abre a Loja', 'main.js', "  if (screen === 'loja') renderLoja();", ''],
  ['a Loja deixa de acender o botão da Quinta', 'main.js', "  loja: 'quinta'", "  loja: 'vinha'"]
];
MUTACOES.forEach(function (m) {
  const f = mutar(m[1], m[2], m[3]);
  if (!f) return;
  let apanhada;
  try { apanhada = suite(f).length > 0; } catch (e) { apanhada = true; if (process.env.LOJA_DEBUG) console.log('(mutação que rebenta: ' + m[0] + ': ' + e.message.split('\n')[0] + ')'); }
  if (!apanhada) falhas.push('MUTAÇÃO NÃO APANHADA: ' + m[0]);
});

if (falhas.length) {
  falhas.slice(0, 40).forEach(function (m) { console.log('FALHA: ' + m); });
  console.log(falhas.length + ' falha(s)');
  process.exit(1);
}
console.log('OK (' + MUTACOES.length + ' mutações apanhadas)');
