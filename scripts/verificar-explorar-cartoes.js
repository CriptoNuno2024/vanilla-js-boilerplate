#!/usr/bin/env node
// O Explorar com cartões de foto (js/explorar.js). Carrega state.js, i18n.js, estacoes.js, niveis.js e explorar.js reais num
// ambiente simulado (vm), sem browser nem conta real, e confirma:
//  A. Cartões por nível: antes do 7 só a Enciclopédia; 7 Estrada e Loja; 8 + Lagar; 9 + Câmara; 10 + Cepa Roxa; jogador antigo vê todos,
//     sempre pela ordem Enciclopédia, Estrada, Loja, Lagar, Câmara, Cepa Roxa. Cada cartão leva a foto, o nome, a frase e um botão goTo.
//  B. O cartão da Enciclopédia está SEMPRE no topo: com entrada nova ("Nova entrada!" e Ler), sem nada novo e com tudo descoberto
//     (botão "Ver Enciclopédia", com as mensagens de sempre). Só com a Enciclopédia aberta (nível 4).
//  C. Entrar continua a desbloquear UMA entrada (conhecimento +1, objetivo "explorar", UMA gravação); sem nada novo não grava nem paga;
//     nunca toca em uvas, gotas nem Reputação.
//  D. As 6 fotos de assets/explorar/ existem (JPEG 640x340, até 60 KB), os originais continuam em assets/ e camera_.jpg e cepa_roxa.jpg
//     saíram da raiz (ficam em assets/ecras/); os outros ficheiros da raiz não mudam.
//  E. Na Quinta saíram as linhas de Estrada, Loja, Lagar, Câmara e Cepa Roxa; a linha da Visita e o "Oferecer {bem}" ficam.
//  F. Voltar nesses ecrãs: a barra de baixo acende "Explorar". Textos novos em PT, EN e ES; as chaves *.linha antigas saíram.
//
// Depois de passar, aplica "mutações" (estraga cada regra de propósito) e confirma que o teste as apanha.
// Uso: node scripts/verificar-explorar-cartoes.js     Sai com 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const FICHEIROS = ['state.js', 'tempo.js', 'estacoes.js', 'i18n.js', 'niveis.js', 'explorar.js', 'main.js', 'estrada.js', 'visitas.js', 'loja.js', 'lagar.js', 'camara.js', 'roxo.js'];
const FONTES = {};
FICHEIROS.forEach(function (f) { FONTES[f] = fs.readFileSync(path.join(RAIZ, 'js', f), 'utf8'); });
FONTES['index.html'] = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');

const SITIOS = ['estrada', 'loja', 'lagar', 'camara', 'roxo'];
const NIVEL_DO_SITIO = { estrada: 7, loja: 7, lagar: 8, camara: 9, roxo: 10 };
const TITULOS = { estrada: 'estrada.title', loja: 'loja.title', lagar: 'lagar.title', camara: 'camara.title', roxo: 'roxo.title' };

// Dimensões de um JPEG (marcador SOFn).
function dimensoesJpeg(ficheiro) {
  const b = fs.readFileSync(ficheiro);
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const m = b[i + 1];
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
    i += 2 + b.readUInt16BE(i + 2);
  }
  return null;
}

function suite(fontes) {
  const falhas = [];
  function ok(cond, msg) { if (!cond) falhas.push(msg); }

  function abrir() {
    const guardado = {};
    const reg = { html: '' };
    const sb = {
      console: { log() {}, warn() {}, error() {} },
      localStorage: {
        getItem: function (k) { return Object.prototype.hasOwnProperty.call(guardado, k) ? guardado[k] : null; },
        setItem: function (k, v) { guardado[k] = String(v); },
        removeItem: function (k) { delete guardado[k]; }
      },
      location: { search: '' }, URLSearchParams: URLSearchParams, Intl: Intl,
      document: {
        documentElement: {}, querySelectorAll: function () { return []; }, querySelector: function () { return null; }, addEventListener: function () {},
        getElementById: function (id) { return id === 'explorar-container' ? { set innerHTML(v) { reg.html = v; }, get innerHTML() { return reg.html; } } : null; }
      },
      setTimeout: function () { return 1; }, clearTimeout: function () {}, Image: function () {}
    };
    sb.window = sb;
    sb.addEventListener = function () {};
    sb.Telegram = { WebApp: {} };
    const cx = vm.createContext(sb);
    vm.runInContext(`
      var SAVES = 0, OBJ = [], SONS = [], NOVAS = [], FALAS = [], PAGAR = 0;
      function randInt(a) { return a; }
      function mostrarFalas() {} function vibrar() {} function tocarSom(n) { SONS.push(n); } function updateStatsDisplays() {}
      function atualizarDialogo(m) { FALAS.push(m); } function definirFundo() {} function reposicionarFlutuantes() {}
      function mostrarNovaEntrada(e) { NOVAS.push(e); }
    `, cx);
    // Os ficheiros reais mais pequenos; main.js e os ecrãs só são lidos como texto (não correm).
    ['state.js', 'tempo.js', 'estacoes.js', 'i18n.js', 'niveis.js', 'explorar.js'].forEach(function (f) { vm.runInContext(fontes[f], cx, { filename: f }); });
    vm.runInContext(`
      var _saveReal = saveState; saveState = function (s) { SAVES++; return _saveReal(s); };
      marcarObjetivoCumprido = function (id) { OBJ.push(id); };
      goTo = function () {};
    `, cx);
    return {
      cx: cx,
      ev: function (c) { return vm.runInContext(c, cx); },
      html: function () { return reg.html; }
    };
  }

  const g = abrir();
  const repDoNivel = function (n) { return g.ev('NIVEIS_CONFIG[' + (n - 1) + '].min'); };
  const novoJogador = function (rep) { g.ev('state.acesso.jogadorAntigo = false; state.reputacao = ' + rep + '; state.encyclopedia.unlocked = []; state.conhecimento = 0; SAVES = 0; OBJ = []; SONS = []; NOVAS = []; FALAS = [];'); };
  const ordemDosCartoes = function () {
    const h = g.html();
    const r = []; const re = /data-sitio="([a-z]+)"/g; let m;
    while ((m = re.exec(h)) !== null) r.push(m[1]);
    return r;
  };

  // ---------------- A. Cartões por nível ----------------
  ok(JSON.stringify(g.ev('EXPLORAR_SITIOS.map(function (x) { return x.id; })')) === JSON.stringify(SITIOS), 'os sítios são Estrada, Loja, Lagar, Câmara e Cepa Roxa, por esta ordem');
  const casos = [
    [4, ['enciclopedia']], [5, ['enciclopedia']], [6, ['enciclopedia']],
    [7, ['enciclopedia', 'estrada', 'loja']], [8, ['enciclopedia', 'estrada', 'loja', 'lagar']],
    [9, ['enciclopedia', 'estrada', 'loja', 'lagar', 'camara']], [10, ['enciclopedia', 'estrada', 'loja', 'lagar', 'camara', 'roxo']]
  ];
  casos.forEach(function (c) {
    novoJogador(repDoNivel(c[0]));
    g.ev('enterExplorar()');
    ok(JSON.stringify(ordemDosCartoes()) === JSON.stringify(c[1]), 'nível ' + c[0] + ': cartões ' + JSON.stringify(c[1]) + ' (saiu ' + JSON.stringify(ordemDosCartoes()) + ')');
  });
  g.ev('state.acesso.jogadorAntigo = true; state.reputacao = 0; enterExplorar()');
  ok(JSON.stringify(ordemDosCartoes()) === JSON.stringify(['enciclopedia'].concat(SITIOS)), 'jogador antigo (nível 1) vê todos os cartões');

  novoJogador(repDoNivel(10));
  g.ev('enterExplorar()');
  const h10 = g.html();
  SITIOS.forEach(function (s) {
    const i = h10.indexOf('data-sitio="' + s + '"');
    const bloco = h10.slice(i, h10.indexOf('</button>', i));
    ok(bloco.indexOf('src="assets/explorar/' + s + '.jpg"') !== -1 && bloco.indexOf('class="explorar-foto"') !== -1, s + ': foto de assets/explorar/' + s + '.jpg');
    ok(bloco.indexOf("onclick=\"goTo('" + s + "')\"") !== -1, s + ': o botão faz goTo para o ecrã');
    ok(bloco.indexOf(g.ev('t("' + TITULOS[s] + '")')) !== -1 && bloco.indexOf(g.ev('t("explorar.sitio.' + s + '")')) !== -1 && bloco.indexOf(g.ev('t("explorar.btnIr")')) !== -1, s + ': nome, frase e botão em texto da língua atual');
    ok(/width="640" height="340"/.test(bloco), s + ': a foto declara 640x340 (a altura certa antes de carregar)');
  });
  ok(/class="scroll-panel explorar-lista"/.test(h10), 'os cartões vão numa lista que desliza (.explorar-lista)');

  // ---------------- B. O cartão da Enciclopédia está sempre lá ----------------
  const total = g.ev('encyclopediaEntries().length');
  novoJogador(repDoNivel(4));
  g.ev('enterExplorar()');
  let h = g.html();
  const iE = h.indexOf('data-sitio="enciclopedia"');
  ok(iE !== -1 && h.indexOf('assets/explorar/enciclopedia.jpg') !== -1, 'nível 4: o cartão da Enciclopédia tem a foto assets/explorar/enciclopedia.jpg');
  ok(iE < (h.indexOf('data-sitio="estrada"') === -1 ? Infinity : h.indexOf('data-sitio="estrada"')), 'o cartão da Enciclopédia vem primeiro (no topo)');
  ok(h.indexOf('Nova entrada!') !== -1 && h.indexOf('>Ler</button>') !== -1 && h.indexOf('Ver Enciclopédia') === -1, 'com entrada nova: "Nova entrada!" e o botão Ler');
  ok(h.indexOf("goTo('enciclopedia')") !== -1, 'o botão da Enciclopédia faz goTo("enciclopedia")');
  ok(g.ev('NOVAS.length') === 1 && g.ev('NOVAS[0]') === null, 'o cartão flutuante "Nova entrada!" fica escondido (o aviso está dentro do cartão da lista)');
  ok(g.ev('SONS.indexOf("novaEntrada")') !== -1, 'o som de "nova entrada" toca com a entrada nova');
  ok(g.ev('FALAS.every(function (m) { return m === ""; })'), 'sem balão de fala por cima dos cartões');
  // Nada novo nesta estação (todas as disponíveis já desbloqueadas)
  novoJogador(repDoNivel(4));
  g.ev('var _eb = entradasBloqueadas; entradasBloqueadas = function () { return []; }; enterExplorar(); entradasBloqueadas = _eb;');
  h = g.html();
  ok(h.indexOf('data-sitio="enciclopedia"') !== -1 && h.indexOf('Nova entrada!') === -1 && h.indexOf('Ver Enciclopédia') !== -1 && h.indexOf('>Ler</button>') === -1, 'sem nada novo: o cartão da Enciclopédia continua lá, com "Ver Enciclopédia"');
  ok(h.indexOf(g.ev('t("explorar.nadaNestaEstacao")')) !== -1 && h.indexOf("goTo('enciclopedia')") !== -1, 'sem nada novo nesta estação: a mensagem de sempre dentro do cartão e o caminho para a Enciclopédia');
  ok(g.ev('SAVES') === 0 && g.ev('OBJ.length') === 0 && g.ev('state.conhecimento') === 0 && g.ev('SONS.length') === 0, 'sem nada novo: não grava, não marca objetivo, não soma conhecimento nem toca som');
  // Tudo descoberto
  novoJogador(repDoNivel(10));
  g.ev('state.encyclopedia.unlocked = encyclopediaEntries().map(function (e) { return e.id; }); enterExplorar()');
  h = g.html();
  ok(h.indexOf('Ver Enciclopédia') !== -1 && h.indexOf(g.ev('t("explorar.tudoDesbloqueado")')) !== -1 && h.indexOf(total + ' / ' + total) !== -1, 'tudo descoberto: mensagem de sempre, ' + total + ' / ' + total + ' e "Ver Enciclopédia"');
  ok(ordemDosCartoes().length === 6, 'tudo descoberto: os cartões dos sítios continuam lá');
  ok(g.ev('SAVES') === 0, 'tudo descoberto: não grava');
  // Línguas
  ['en', 'es'].forEach(function (l) {
    novoJogador(repDoNivel(4));
    g.ev('state.lang = "' + l + '"; currentLang = "' + l + '"; enterExplorar()');
    ok(g.html().indexOf(g.ev('TRANSLATIONS.' + l + '["explorar.btnLer"]')) !== -1 && g.html().indexOf(g.ev('TRANSLATIONS.' + l + '["explorar.novaEntradaCurta"]')) !== -1, l + ': o cartão da Enciclopédia usa os textos da língua');
  });
  g.ev('state.lang = "pt"; currentLang = "pt";');

  // ---------------- C. Entrar continua a desbloquear UMA entrada ----------------
  novoJogador(repDoNivel(10));
  g.ev('state.uvas = 100; state.gotas = 50; var _rep0 = state.reputacao; enterExplorar()');
  ok(g.ev('state.encyclopedia.unlocked.length') === 1 && g.ev('state.conhecimento') === 1, 'entrar desbloqueia UMA entrada e soma 1 de conhecimento');
  ok(g.ev('SAVES') === 1 && JSON.stringify(g.ev('OBJ')) === JSON.stringify(['explorar_descobrir']), 'entrar grava UMA vez e marca o objetivo "explorar_descobrir"');
  ok(g.ev('state.uvas') === 100 && g.ev('state.gotas') === 50 && g.ev('state.reputacao') === g.ev('_rep0'), 'nada custa nem paga uvas, gotas ou Reputação');
  g.ev('SAVES = 0; OBJ = []; var _u = state.encyclopedia.unlocked.length; var _html = JSON.stringify(state.uvas); void 0');
  g.ev('goTo = function () { throw new Error("os cartões não podem navegar ao desenhar"); }; enterExplorar()');
  ok(g.ev('state.encyclopedia.unlocked.length') === 2, 'cada nova entrada no Explorar desbloqueia mais uma');
  ok(g.ev('typeof explorarSitiosVisiveis') === 'function' && !/saveState|state\.uvas|state\.gotas|state\.reputacao/.test((function () { const s = fontes['explorar.js']; const a = s.indexOf('const EXPLORAR_SITIOS'); const b = s.indexOf('function enterExplorar'); return s.slice(a, b); })()), 'o desenho dos cartões só lê: sem gravar nem mexer em uvas, gotas ou Reputação');

  // ---------------- D. Fotos ----------------
  ['estrada', 'loja', 'lagar', 'camara', 'roxo', 'enciclopedia'].forEach(function (k) {
    const f = path.join(RAIZ, 'assets', 'explorar', k + '.jpg');
    const existe = fs.existsSync(f);
    ok(existe, 'assets/explorar/' + k + '.jpg existe');
    if (!existe) return;
    const d = dimensoesJpeg(f);
    ok(d && d.w === 640 && d.h === 340, k + '.jpg tem 640x340 (tem ' + (d ? d.w + 'x' + d.h : '?') + ')');
    ok(fs.statSync(f).size <= 60 * 1024, k + '.jpg pesa no máximo 60 KB (pesa ' + Math.round(fs.statSync(f).size / 1024) + ' KB)');
  });
  ['assets/ecras/camera_.jpg', 'assets/ecras/cepa_roxa.jpg', 'assets/ecras/enciclopedia.jpg', 'assets/ecras/casa_loja_meio_da_vinha_4.jpg', 'assets/ecras/festa_vindima_pessoas.jpg', 'imagens_JOGO_TELEGRAM/caminho_lojas_casa_trabalhadores_3.jpg'].forEach(function (f) {
    ok(fs.existsSync(path.join(RAIZ, f)), 'o original continua em ' + f);
  });
  ['camera_.jpg', 'camera_3.png', 'camera_reuniao.jpg', 'cepa_roxa.jpg'].forEach(function (f) { ok(!fs.existsSync(path.join(RAIZ, f)), f + ' já não está na raiz (sem duplicados da Câmara nem da Cepa Roxa)'); });
  ok(fs.existsSync(path.join(RAIZ, 'assets/ecras/camera_.jpg')) && fs.statSync(path.join(RAIZ, 'assets/ecras/camera_.jpg')).size <= 250 * 1024, 'assets/ecras/camera_.jpg (a versão final em JPEG) pesa no máximo 250 KB');
  ['moscatel_roxo_com_uvas.jpg', 'barril.jpg', 'Yoshi_Cat.jpg'].forEach(function (f) { ok(fs.existsSync(path.join(RAIZ, f)), f + ' fica na raiz (próximo PR)'); });
  const cred = fs.readFileSync(path.join(RAIZ, 'CREDITOS.md'), 'utf8');
  ok(/camera_\.jpg/.test(cred) && /cepa_roxa\.jpg/.test(cred), 'CREDITOS.md fala de camera_.jpg e cepa_roxa.jpg');

  // ---------------- E. A Quinta ----------------
  const html = fontes['index.html'];
  SITIOS.forEach(function (s) {
    ok(html.indexOf(s + '-linha-container') === -1, 'index.html já não tem ' + s + '-linha-container');
    const f = fontes[s + '.js'];
    ok(f.indexOf('atualizarLinha' + s.charAt(0).toUpperCase() + s.slice(1) + 'Quinta') === -1, s + '.js já não desenha a linha na Quinta');
  });
  ok(html.indexOf('id="visita-container"') !== -1 && /function atualizarLinhaVisitaQuinta\(/.test(fontes['visitas.js']) && /atualizarLinhaVisitaQuinta\(\)/.test(fontes['main.js']), 'a linha da Visita continua na Quinta (contentor, função e chamada em goTo)');
  ok(/function estradaOfertaHtml\(/.test(fontes['estrada.js']) && /estradaOfertaHtml\(\)/.test(fontes['visitas.js']), 'o "Oferecer {bem}" continua por baixo da linha da Visita');
  ok(!/Linha(Estrada|Loja|Lagar|Camara|Roxo)Quinta/.test(fontes['main.js'] + fontes['niveis.js']), 'main.js e niveis.js já não refazem as linhas dos 5 sítios');

  // ---------------- F. Barra de baixo e textos ----------------
  SITIOS.forEach(function (s) {
    ok(new RegExp('\\b' + s + ":\\s*'explorar'").test(fontes['main.js']), 'a barra de baixo acende "Explorar" no ecrã ' + s);
  });
  ok(/caderno:\s*'quinta'/.test(fontes['main.js']) && /festa:\s*'quinta'/.test(fontes['main.js']), 'Caderno e Festa continuam a acender a Quinta');
  ['pt', 'en', 'es'].forEach(function (l) {
    ['explorar.btnIr', 'explorar.sitio.estrada', 'explorar.sitio.loja', 'explorar.sitio.lagar', 'explorar.sitio.camara', 'explorar.sitio.roxo', 'explorar.btnVerEnciclopedia'].forEach(function (k) {
      const v = g.ev('TRANSLATIONS.' + l + '["' + k + '"]');
      ok(typeof v === 'string' && v.trim() !== '', 'falta ' + k + ' em ' + l);
    });
    SITIOS.forEach(function (s) { ok(g.ev('TRANSLATIONS.' + l + '["' + s + '.linha"]') === undefined, l + ': a chave ' + s + '.linha já não existe'); });
  });
  ok(/explorar\.js\?v=/.test(html) && /i18n\.js\?v=/.test(html), 'index.html carrega explorar.js e i18n.js');
  return falhas;
}

const base = suite(FONTES);
if (base.length > 0) {
  base.forEach(function (f) { console.log('FALHA: ' + f); });
  console.log(base.length + ' FALHA(S)');
  process.exit(1);
}

// Mutações: estraga cada regra e confirma que o teste a apanha.
const MUTACOES = [
  ['os sítios aparecem em qualquer nível', 'explorar.js', "return typeof ecraDesbloqueado !== 'function' || ecraDesbloqueado(x.ecra);", 'return true;'],
  ['o cartão da Enciclopédia só aparece com entrada nova', 'explorar.js', "(enciclopediaAberta ? explorarCartaoEnciclopediaHtml(nova, mensagem) : '')", "(enciclopediaAberta && nova ? explorarCartaoEnciclopediaHtml(nova, mensagem) : '')"],
  ['o botão da Enciclopédia diz sempre Ler', 'explorar.js', "t(nova ? 'explorar.btnLer' : 'explorar.btnVerEnciclopedia')", "t('explorar.btnLer')"],
  ['o objetivo "explorar" deixa de contar', 'explorar.js', "marcarObjetivoCumprido('explorar_descobrir')", "void 0"],
  ['entrar deixa de gravar', 'explorar.js', '    saveState(state);\n    updateStatsDisplays();', '    updateStatsDisplays();'],
  ['entrar gasta uvas', 'explorar.js', '    state.conhecimento += 1;\n    if (typeof marcar', '    state.conhecimento += 1; state.uvas -= 1;\n    if (typeof marcar'],
  ['os sítios trocam de ordem', 'explorar.js', "{ id: 'loja', ecra: 'loja'", "{ id: 'xloja', ecra: 'loja'"],
  ['a Câmara abre a Loja', 'explorar.js', "{ id: 'camara', ecra: 'camara'", "{ id: 'camara', ecra: 'loja'"],
  ['a linha da Estrada volta à Quinta', 'index.html', '<div id="visita-container"></div>', '<div id="visita-container"></div>\n        <div id="estrada-linha-container"></div>'],
  ['a barra acende a Quinta na Loja', 'main.js', "  loja: 'explorar'", "  loja: 'quinta'"],
  ['falta o texto da Câmara em ES', 'i18n.js', "    'explorar.sitio.camara': 'Cata con el Dr. Henrique',\n", ''],
  ['a linha da Visita sai da Quinta', 'index.html', '<div id="visita-container"></div>', '']
];
let falhou = false;
MUTACOES.forEach(function (m) {
  const f = Object.assign({}, FONTES);
  if (f[m[1]].indexOf(m[2]) === -1) { console.log('MUTAÇÃO NÃO APLICÁVEL: ' + m[0]); falhou = true; return; }
  f[m[1]] = f[m[1]].replace(m[2], m[3]);
  let r;
  try { r = suite(f); } catch (e) { r = ['erro: ' + e.message]; }
  if (r.length === 0) { console.log('MUTAÇÃO NÃO APANHADA: ' + m[0]); falhou = true; }
});
if (falhou) process.exit(1);
console.log('OK (' + MUTACOES.length + ' mutações apanhadas)');
