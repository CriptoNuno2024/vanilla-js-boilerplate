#!/usr/bin/env node
// Ambiente de vento e grilos (ficheiros que JÁ estavam em assets/sons, agora comprimidos; nenhum ficheiro novo).
// Corre js/tempo.js, js/som.js, js/estacoes.js e js/state.js REAIS em vm, com um AudioContext simulado que sabe que fontes
// de áudio estão a tocar e com que ficheiro. O que se verifica:
//   - qual ambiente toca em cada tempo e hora (céu de dia 'sol' / 'noite') e estação: chuva e trovoada mandam (chuva.mp3 /
//     chuva_sempreritmo.mp3); depois vento forte (vento_grama_alta.mp3); noite de verão (prado_grilos_ras.mp3); dia calmo
//     (vento_arvores_passaros.mp3, mais baixo que o vento forte); nevoeiro, noite fora do verão e tempo indisponível: nada;
//   - nunca dois ambientes ao mesmo tempo (só uma fonte ativa) e em ciclo; vento e grilos entram e saem com fade, a chuva não;
//   - só ao ar livre (Quinta e Vinha): em qualquer ecrã interior (Adega, Cave, Proteger, Lagar, Câmara, Loja...) nada liga,
//     mesmo que o tempo chegue depois de o jogador sair; sair de um ecrã pára (goTo, js/main.js);
//   - o interruptor "Som" do Perfil manda (desligado = nada; desligar a meio pára);
//   - só tempo.js liga estes ficheiros; só main.js (Quinta) e vinha.js (enterVinha) chamam atualizarAmbienteExterior;
//   - os 3 ficheiros existem, são MP3 mono a 64 kbps com o peso certo (os grilos num ciclo de 70 s), o vento_feito_a_mao
//     fica como estava e assets/sons continua com 14 ficheiros.
// Depois ESTRAGA as regras de propósito (mutantes). Uso: node scripts/verificar-ambiente-vento.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const LER = function (f) { return fs.readFileSync(path.join(RAIZ, f), 'utf8'); };
const FICHEIROS = ['state.js', 'estacoes.js', 'tempo.js', 'som.js'];
const OUTROS = ['main.js', 'vinha.js', 'garrafa.js', 'proteger.js', 'lagar.js', 'camara.js', 'loja.js', 'roxo.js', 'festas.js', 'estrada.js'];
const FONTES = {};
FICHEIROS.concat(OUTROS).forEach(function (f) { FONTES[f] = LER('js/' + f); });
const SONS = 'assets/sons/';
const CHUVA = SONS + 'chuva.mp3', CHUVA_FORTE = SONS + 'chuva_sempreritmo.mp3';
const VENTO = SONS + 'vento_grama_alta.mp3', CALMO = SONS + 'vento_arvores_passaros.mp3', GRILOS = SONS + 'prado_grilos_ras.mp3';
const EXTERIORES = ['screen-quinta', 'screen-vinha'];
const INTERIORES = ['screen-garrafa', 'screen-engarrafar', 'screen-proteger', 'screen-lagar', 'screen-camara', 'screen-loja', 'screen-roxo',
  'screen-estrada', 'screen-explorar', 'screen-festa', 'screen-perfil', 'screen-colecao', 'screen-caderno', 'screen-enciclopedia',
  'screen-conquistas', 'screen-garrafas', 'screen-home'];

// Cabeçalho do 1.º frame MP3 (MPEG-1 Layer III): { mono, kbps } ou null.
function cabecalhoMp3(buf) {
  let i = 0;
  if (buf.slice(0, 3).toString('latin1') === 'ID3') i = 10 + (((buf[6] & 0x7f) << 21) | ((buf[7] & 0x7f) << 14) | ((buf[8] & 0x7f) << 7) | (buf[9] & 0x7f));
  for (; i < buf.length - 4; i++) {
    if (buf[i] === 0xff && (buf[i + 1] & 0xe0) === 0xe0) {
      const versao = (buf[i + 1] >> 3) & 3, camada = (buf[i + 1] >> 1) & 3, br = buf[i + 2] >> 4;
      if (versao !== 3 || camada !== 1 || br === 0 || br === 15) continue;
      return { mono: ((buf[i + 3] >> 6) & 3) === 3, kbps: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320][br] };
    }
  }
  return null;
}

async function suite(fontes) {
  const falhas = [];
  function ok(cond, msg) { if (!cond) falhas.push(msg); }
  const igual = function (a, b) { return JSON.stringify(a) === JSON.stringify(b); };

  // Um jogo com o som real e fontes de áudio simuladas.
  function abrir(pesquisa) {
    const fontesAudio = [];
    let ecra = 'screen-quinta';
    const sb = {
      console: { log() {}, warn() {}, error() {} },
      localStorage: { getItem: function () { return null; }, setItem: function () {}, removeItem: function () {} },
      location: { search: pesquisa || '' }, URLSearchParams: URLSearchParams, Intl: Intl,
      document: {
        hidden: false, querySelectorAll: function () { return []; },
        querySelector: function (s) { return s === '.screen.active' ? { id: ecra } : null; },
        addEventListener: function () {}, getElementById: function () { return null; }
      },
      setTimeout: function () { return 1; }, clearTimeout: function () {}, Image: function () {}
    };
    sb.window = sb; sb.addEventListener = function () {}; sb.Telegram = { WebApp: {} };
    sb.AudioContext = function () {
      const param = function () { return { value: 1, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, cancelScheduledValues() {} }; };
      const node = function () { return { connect() {}, start() {}, stop() {}, frequency: param(), gain: param(), type: '' }; };
      const ctx = {
        state: 'running', currentTime: 0, sampleRate: 8000, destination: {},
        resume: function () { return Promise.resolve(); }, suspend: function () { return Promise.resolve(); },
        createGain: node, createBiquadFilter: node, createOscillator: node,
        createBuffer: function () { return { getChannelData: function () { return new Float32Array(1); } }; },
        createBufferSource: function () {
          const f = { buffer: null, loop: false, comecou: false, parou: false, saiEm: null, gain: null,
            connect() {}, start() { f.comecou = true; }, stop(quando) { if (quando === undefined) f.parou = true; else f.saiEm = quando; } };
          fontesAudio.push(f);
          return f;
        }
      };
      return ctx;
    };
    const cx = vm.createContext(sb);
    FICHEIROS.forEach(function (f) { vm.runInContext(fontes[f], cx, { filename: f }); });
    vm.runInContext(`
      somCarregarFicheiro = function (c) { return Promise.resolve({ caminho: c }); };
      state.som = true;
      somCriarContextoSePreciso();
    `, cx);
    const g = { cx: cx };
    g.ev = function (c) { return vm.runInContext(c, cx); };
    g.ecra = function (e) { ecra = e; };
    g.tempo = function (tempC, ventoKmh, ceu, estacao) {
      g.ev('_tempoAtual = condicaoDeTeste(' + tempC + ', ' + ventoKmh + ', ' + JSON.stringify(ceu) + '); estacaoAtual = function () { return ' + JSON.stringify(estacao || 'outono') + '; };');
    };
    // Fontes que estão a tocar de verdade (começaram e ninguém as mandou parar nem agendou a saída = não estão a sair em fundo).
    g.ativos = function () { return fontesAudio.filter(function (f) { return f.comecou && !f.parou && f.saiEm === null; }); };
    g.todasQuePodemSoar = function () { return fontesAudio.filter(function (f) { return f.comecou && !f.parou; }); };
    g.ligar = async function () { g.ev('atualizarAmbienteExterior()'); await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };
    g.ouve = function () { return g.ativos().map(function (f) { return f.buffer && f.buffer.caminho; }); };
    g.volume = function () { return g.ev('somGainAmbiente.gain.value'); };
    return g;
  }

  // ---------------- 1. Qual ambiente toca em cada tempo, hora e estação ----------------
  // [tempC, ventoKmh, céu, estação, ficheiro esperado ou null]
  const ESTACOES = ['inverno', 'primavera', 'verao', 'outono'];
  const CASOS = [];
  ESTACOES.forEach(function (e) {
    CASOS.push([20, 10, 'sol', e, CALMO]);            // dia calmo
    CASOS.push([33, 10, 'sol', e, CALMO]);            // calor forte, sem chuva nem vento forte: dia calmo
    CASOS.push([1, 10, 'sol', e, CALMO]);             // frio forte, idem
    CASOS.push([20, 39, 'sol', e, CALMO]);            // 39 km/h ainda não é vento forte
    CASOS.push([20, 40, 'sol', e, VENTO]);            // 40 km/h é vento forte
    CASOS.push([18, 45, 'sol', e, VENTO]);
    CASOS.push([16, 15, 'chuva', e, CHUVA]);
    CASOS.push([16, 60, 'chuva', e, CHUVA]);          // chuva manda sobre o vento forte
    CASOS.push([20, 20, 'trovoada', e, CHUVA_FORTE]);
    CASOS.push([20, 60, 'trovoada', e, CHUVA_FORTE]); // trovoada manda sobre o vento forte
    CASOS.push([14, 10, 'nevoeiro', e, null]);        // nevoeiro: nada
    CASOS.push([14, 60, 'nevoeiro', e, VENTO]);       // nevoeiro com vento forte: vento
    CASOS.push([14, 5, 'noite', e, e === 'verao' ? GRILOS : null]);   // noite: grilos só no verão
    CASOS.push([14, 60, 'noite', e, VENTO]);          // noite de vento forte: vento, não grilos
  });
  for (const c of CASOS) {
    const g = abrir(); g.tempo(c[0], c[1], c[2], c[3]);
    for (const e of EXTERIORES) {
      g.ecra(e); await g.ligar();
      const esperado = c[4] ? [c[4]] : [];
      ok(igual(g.ouve(), esperado), e + ' com ' + c[2] + ' ' + c[0] + '°C ' + c[1] + ' km/h no ' + c[3] + ': devia tocar ' + JSON.stringify(esperado) + ', tocou ' + JSON.stringify(g.ouve()));
      ok(g.todasQuePodemSoar().length <= 1, 'nunca dois ambientes: ' + g.todasQuePodemSoar().length + ' fontes');
      if (c[4]) ok(g.todasQuePodemSoar()[0].loop === true, 'o ambiente devia tocar em ciclo');
      break; // um ecrã exterior por caso (a Vinha tem o seu teste abaixo)
    }
  }
  { // Tempo indisponível (sem internet): nada, mesmo no verão à noite
    const g = abrir(); g.ev('estacaoAtual = function () { return "verao"; };'); await g.ligar(); ok(igual(g.ouve(), []), 'tempo indisponível: nada devia tocar');
  }
  { // Os tempos de teste do próprio jogo (?tempo=), com ?estacao=verao
    const T = { sol: CALMO, calor: CALMO, frio: CALMO, vento: VENTO, chuva: CHUVA, trovoada: CHUVA_FORTE, granizo: CHUVA_FORTE, nevoeiro: null, noite: GRILOS };
    for (const k of Object.keys(T)) {
      const g = abrir('?tempo=' + k + '&estacao=verao'); await g.ligar();
      ok(igual(g.ouve(), T[k] ? [T[k]] : []), '?tempo=' + k + '&estacao=verao devia tocar ' + T[k] + ', tocou ' + JSON.stringify(g.ouve()));
    }
    const g = abrir('?tempo=noite&estacao=inverno'); await g.ligar(); ok(igual(g.ouve(), []), '?tempo=noite no inverno: sem grilos');
  }
  { // Dia e noite vêm do is_day da Open-Meteo (classificarCeu), e a chuva à noite continua chuva
    const g = abrir();
    ok(g.ev('classificarCeu(0, 1)') === 'sol' && g.ev('classificarCeu(0, 0)') === 'noite' && g.ev('classificarCeu(61, 0)') === 'chuva', 'classificarCeu: 0/dia = sol, 0/noite = noite, chuva de noite = chuva');
  }

  // ---------------- 2. Volumes e fades ----------------
  { // ambienteDoTempo é pura: lê só o que recebe
    const g = abrir();
    const a = function (t, e) { return g.ev('JSON.stringify(ambienteDoTempo(' + JSON.stringify(t) + ', ' + JSON.stringify(e) + '))'); };
    const base = { disponivel: true, ventoForte: false, ceu: 'sol' };
    const forte = JSON.parse(a(Object.assign({}, base, { ventoForte: true }), 'outono'));
    const calmo = JSON.parse(a(base, 'outono'));
    const grilos = JSON.parse(a(Object.assign({}, base, { ceu: 'noite' }), 'verao'));
    const chuva = JSON.parse(a(Object.assign({}, base, { ceu: 'chuva' }), 'verao'));
    const trov = JSON.parse(a(Object.assign({}, base, { ceu: 'trovoada' }), 'verao'));
    ok(calmo.volume < forte.volume, 'dia calmo devia ser mais baixo do que o vento forte (' + calmo.volume + ' contra ' + forte.volume + ')');
    ok(forte.volume > 0 && forte.volume <= 1 && grilos.volume > 0 && grilos.volume <= 1, 'volumes entre 0 e 1 (o vento tem rajadas altas, não se passa de 1)');
    ok(chuva.volume === 0.12 && trov.volume === 0.18 && chuva.fade === null && trov.fade === null, 'a chuva fica como estava (0,12 e 0,18, sem fade)');
    [forte, calmo, grilos].forEach(function (x) { ok(x.fade && x.fade.entrarS > 0 && x.fade.sairS > 0, 'vento, dia calmo e grilos entram e saem com fade'); });
    ok(a({ disponivel: false, ceu: 'sol' }, 'verao') === 'null' && a(null, 'verao') === 'null', 'sem tempo: sem ambiente');
  }
  { // O volume e o fade chegam ao mecanismo de ambiente
    const g = abrir(); g.tempo(20, 45, 'sol', 'outono'); await g.ligar();
    const forte = g.volume();
    const h = abrir(); h.tempo(20, 10, 'sol', 'outono'); await h.ligar();
    ok(h.volume() < forte, 'o volume do dia calmo (' + h.volume() + ') devia ser menor do que o do vento (' + forte + ')');
    ok(g.ev('somSairAmbienteS') > 0, 'o vento devia sair com fade');
    const c = abrir(); c.tempo(16, 15, 'chuva', 'outono'); await c.ligar();
    ok(c.ev('somSairAmbienteS') === 0 && c.volume() === 0.12, 'a chuva continua sem fade e a 0,12');
  }

  // ---------------- 3. Só ao ar livre ----------------
  for (const e of INTERIORES) {
    const g = abrir(); g.tempo(20, 45, 'sol', 'verao'); g.ecra(e); await g.ligar();
    ok(g.todasQuePodemSoar().length === 0, e + ': dentro de casa nada devia tocar, tocou ' + JSON.stringify(g.ouve()));
    const n = abrir(); n.tempo(14, 5, 'noite', 'verao'); n.ecra(e); await n.ligar();
    ok(n.todasQuePodemSoar().length === 0, e + ': nem grilos de noite de verão');
    const c = abrir(); c.tempo(16, 15, 'chuva', 'verao'); c.ecra(e); await c.ligar();
    ok(c.todasQuePodemSoar().length === 0, e + ': nem a chuva chega depois de se sair do ecrã exterior');
  }
  { // Sair da Quinta para dentro de casa pára o ambiente (goTo chama pararSomAmbiente); e o tempo a chegar tarde não o religa
    const g = abrir(); g.tempo(20, 45, 'sol', 'outono'); g.ecra('screen-quinta'); await g.ligar();
    ok(igual(g.ouve(), [VENTO]), 'Quinta com vento forte: devia tocar o vento');
    g.ecra('screen-proteger'); g.ev('pararSomAmbiente()');
    ok(g.ativos().length === 0, 'ao sair da Quinta o ambiente devia parar');
    await g.ligar();
    ok(g.ativos().length === 0, 'o tempo a chegar tarde, já no Proteger, não devia ligar nada');
  }
  { // Quinta -> Vinha com o mesmo tempo: volta a ligar o mesmo, um só
    const g = abrir(); g.tempo(20, 10, 'sol', 'outono'); g.ecra('screen-quinta'); await g.ligar();
    g.ecra('screen-vinha'); g.ev('pararSomAmbiente()'); await g.ligar();
    ok(igual(g.ouve(), [CALMO]), 'Vinha com dia calmo: devia tocar o dia calmo, tocou ' + JSON.stringify(g.ouve()));
  }

  // ---------------- 4. Um só de cada vez ----------------
  { // O tempo muda de vento para dia calmo, para chuva e para nevoeiro: sempre um só ativo; nevoeiro pára tudo
    const g = abrir(); g.ecra('screen-quinta');
    const seq = [[20, 45, 'sol', VENTO], [20, 10, 'sol', CALMO], [16, 15, 'chuva', CHUVA], [20, 45, 'sol', VENTO], [14, 5, 'noite', 'verao-grilos'], [14, 10, 'nevoeiro', null]];
    for (const s of seq) {
      if (s[3] === 'verao-grilos') { g.tempo(s[0], s[1], s[2], 'verao'); await g.ligar(); ok(igual(g.ouve(), [GRILOS]), 'noite de verão: grilos'); }
      else { g.tempo(s[0], s[1], s[2], 'outono'); await g.ligar(); ok(igual(g.ouve(), s[3] ? [s[3]] : []), 'a seguir a ' + JSON.stringify(s) + ' devia tocar ' + s[3] + ', tocou ' + JSON.stringify(g.ouve())); }
      ok(g.ativos().length <= 1, 'nunca dois ambientes ativos');
    }
  }
  { // Chamar duas vezes seguidas (Quinta, depois o tempo a chegar) não repete nem duplica
    const g = abrir(); g.tempo(20, 45, 'sol', 'outono'); await g.ligar(); await g.ligar();
    ok(g.todasQuePodemSoar().length === 1, 'chamar duas vezes não devia criar uma 2.ª fonte, há ' + g.todasQuePodemSoar().length);
  }

  // ---------------- 5. O "Som" do Perfil ----------------
  { const g = abrir(); g.ev('state.som = false;'); g.tempo(20, 45, 'sol', 'outono'); await g.ligar(); ok(g.todasQuePodemSoar().length === 0, 'Som desligado: nada devia tocar'); }
  { const g = abrir(); g.ev('state.som = false;'); g.tempo(14, 5, 'noite', 'verao'); await g.ligar(); ok(g.todasQuePodemSoar().length === 0, 'Som desligado: nem grilos'); }
  { // Desligar o Som a meio pára logo (sem fade)
    const g = abrir(); g.tempo(20, 10, 'sol', 'outono'); await g.ligar(); ok(g.ativos().length === 1, 'devia estar a tocar');
    g.ev('state.som = false; somAplicarInterruptor(false);');
    ok(g.todasQuePodemSoar().length === 0, 'desligar o Som devia parar o ambiente logo');
  }

  // ---------------- 6. Quem liga o quê (código) ----------------
  Object.keys(fontes).forEach(function (f) {
    const usa = /vento_grama_alta|vento_arvores_passaros|prado_grilos_ras/.test(fontes[f]);
    ok(usa === (f === 'tempo.js'), 'só js/tempo.js devia nomear os ficheiros de vento e grilos (' + f + (usa ? ' nomeia' : '') + ')');
    const chama = /atualizarAmbienteExterior\(\)/.test(fontes[f].replace(/function atualizarAmbienteExterior\(\)/, ''));
    ok(chama === (f === 'main.js' || f === 'vinha.js'), 'atualizarAmbienteExterior() só devia ser chamada em main.js e vinha.js (' + f + ')');
  });
  ok(/if \(screen === 'quinta'\) \{[\s\S]*?atualizarAmbienteExterior\(\);[\s\S]*?\n  \}\n\n  filaPrepararAbertura/.test(fontes['main.js']), 'main.js: o ambiente só se liga dentro do bloco da Quinta');
  ok(/if \(idAnterior && idAnterior !== screen\) pararSomAmbiente\(\);/.test(fontes['main.js']), 'main.js: sair de um ecrã devia parar o ambiente (goTo)');
  ok(/function enterVinha\(\) \{[\s\S]*?atualizarAmbienteExterior\(\);[\s\S]*?\n\}/.test(fontes['vinha.js']), 'vinha.js: enterVinha liga o ambiente');
  ok(!/atualizarAmbienteChuva/.test(fontes['main.js'] + fontes['vinha.js'] + fontes['tempo.js']), 'o nome antigo atualizarAmbienteChuva já não devia existir');
  ok(/const SOM_TEMPO_ECRAS_EXTERIORES = \['screen-quinta', 'screen-vinha'\];/.test(fontes['tempo.js']), 'os ecrãs exteriores são só a Quinta e a Vinha');

  // ---------------- 7. Os ficheiros ----------------
  const peso = function (f) { return fs.statSync(path.join(RAIZ, SONS + f)).size; };
  const PESOS = { 'prado_grilos_ras.mp3': [500000, 620000, 69, 71], 'vento_grama_alta.mp3': [600000, 720000, 84, 87], 'vento_arvores_passaros.mp3': [800000, 930000, 110, 113] };
  Object.keys(PESOS).forEach(function (f) {
    ok(fs.existsSync(path.join(RAIZ, SONS + f)), f + ' devia existir');
    if (!fs.existsSync(path.join(RAIZ, SONS + f))) return;
    const p = PESOS[f], b = fs.readFileSync(path.join(RAIZ, SONS + f)), h = cabecalhoMp3(b);
    ok(peso(f) >= p[0] && peso(f) <= p[1], f + ' devia pesar entre ' + p[0] + ' e ' + p[1] + ' bytes, pesa ' + peso(f));
    ok(h && h.mono && h.kbps === 64, f + ' devia ser MP3 mono a 64 kbps, é ' + JSON.stringify(h));
    const seg = peso(f) / 8000; // 64 kbps = 8000 bytes por segundo
    ok(seg >= p[2] && seg <= p[3], f + ' devia durar cerca de ' + p[2] + ' a ' + p[3] + ' s, dura ' + seg.toFixed(1));
  });
  ok(peso('vento_feito_a_mao.mp3') === 3579968, 'vento_feito_a_mao.mp3 devia ficar como estava (sem uso)');
  ok(fs.readdirSync(path.join(RAIZ, 'assets/sons')).length === 14, 'assets/sons devia continuar com 14 ficheiros');
  return falhas;
}

(async function () {
  let falhou = 0;
  const base = await suite(FONTES);
  base.forEach(function (m) { console.log('FALHA: ' + m); falhou++; });

  // ---------------- Mutantes ----------------
  const M = function (f, a, b, nome) { return { f: f, a: a, b: b, nome: nome }; };
  const MUTANTES = [
    M('tempo.js', "volume: 0.45, fade: SOM_TEMPO_FADE }", "volume: 0.95, fade: SOM_TEMPO_FADE }", 'Dia calmo mais alto do que o vento'),
    M('tempo.js', "volume: 0.9, fade", "volume: 1.8, fade", 'Vento acima de 1 (clipping)'),
    M('tempo.js', "  if (!ecraExteriorAtivo()) return;\n", "", 'O ambiente liga-se em qualquer ecrã'),
    M('tempo.js', "['screen-quinta', 'screen-vinha']", "['screen-quinta', 'screen-vinha', 'screen-garrafa']", 'A Adega conta como ao ar livre'),
    M('tempo.js', "['screen-quinta', 'screen-vinha']", "['screen-quinta', 'screen-vinha', 'screen-proteger']", 'O Proteger conta como ao ar livre'),
    M('tempo.js', "  if (tempo.ceu === 'trovoada') return", "  if (tempo.ventoForte === true) return { caminho: SOM_TEMPO_VENTO_FORTE, volume: 0.9, fade: SOM_TEMPO_FADE };\n  if (tempo.ceu === 'trovoada') return", 'O vento manda sobre a trovoada'),
    M('tempo.js', "  if (tempo.ceu === 'chuva') return", "  if (tempo.ventoForte === true) return { caminho: SOM_TEMPO_VENTO_FORTE, volume: 0.9, fade: SOM_TEMPO_FADE };\n  if (tempo.ceu === 'chuva') return", 'O vento manda sobre a chuva'),
    M('tempo.js', "estacao === 'verao' ? {", "true ? {", 'Grilos em qualquer estação'),
    M('tempo.js', "estacao === 'verao' ? {", "estacao !== 'inverno' ? {", 'Grilos também na primavera e no outono'),
    M('tempo.js', "tempo.ceu === 'sol') return { caminho: SOM_TEMPO_DIA_CALMO", "tempo.ceu !== 'trovoada') return { caminho: SOM_TEMPO_DIA_CALMO", 'Dia calmo também no nevoeiro'),
    M('tempo.js', "  if (tempo.ventoForte === true) return { caminho: SOM_TEMPO_VENTO_FORTE, volume: 0.9, fade: SOM_TEMPO_FADE };\n  if (tempo.ceu === 'noite')", "  if (tempo.ceu === 'noite')", 'Sem vento forte'),
    M('tempo.js', "const SOM_TEMPO_VENTO_FORTE = 'assets/sons/vento_grama_alta.mp3';", "const SOM_TEMPO_VENTO_FORTE = 'assets/sons/vento_arvores_passaros.mp3';", 'Vento forte com o ficheiro do dia calmo'),
    M('tempo.js', "const SOM_TEMPO_DIA_CALMO = 'assets/sons/vento_arvores_passaros.mp3';", "const SOM_TEMPO_DIA_CALMO = 'assets/sons/vento_feito_a_mao.mp3';", 'Dia calmo com o vento feito à mão'),
    M('tempo.js', "const SOM_TEMPO_GRILOS = 'assets/sons/prado_grilos_ras.mp3';", "const SOM_TEMPO_GRILOS = 'assets/sons/vento_feito_a_mao.mp3';", 'Grilos com o ficheiro errado'),
    M('tempo.js', "const SOM_TEMPO_FADE = { entrarS: 2, sairS: 1.5 };", "const SOM_TEMPO_FADE = { entrarS: 0, sairS: 0 };", 'Vento e grilos sem fade'),
    M('tempo.js', "volume: 0.12, fade: null }", "volume: 0.12, fade: SOM_TEMPO_FADE }", 'Chuva com fade'),
    M('tempo.js', "volume: 0.18, fade: null }", "volume: 0.3, fade: null }", 'Trovoada com outro volume'),
    M('tempo.js', "  else pararSomAmbiente();\n}", "}", 'Nevoeiro deixa o ambiente anterior a tocar'),
    M('tempo.js', "if (!tempo || tempo.disponivel !== true) return null;", "if (!tempo) return null;", 'Tempo indisponível conta como disponível'),
    M('tempo.js', "  if (a) iniciarSomAmbiente(a.caminho, a.volume, a.fade || undefined);", "  if (a) iniciarSomAmbiente(a.caminho, a.volume, a.fade || undefined); if (a && a.caminho === SOM_TEMPO_VENTO_FORTE) iniciarSomAmbiente(SOM_TEMPO_GRILOS, 0.18, a.fade);", 'Vento e grilos juntos'),
    M('som.js', "    pararSomAmbiente(true);\n    if (somCtx) somCtx.suspend();", "    if (somCtx) somCtx.suspend();", 'Desligar o Som não pára o ambiente'),
    M('som.js', ["function somPodeTocar() {\n  return !!(state.som && somCtx && somGainMestre);", "function iniciarSomAmbiente(caminho, volume, desvanecer) {\n  if (!state.som) return;"],
      ["function somPodeTocar() {\n  return !!(somCtx && somGainMestre);", "function iniciarSomAmbiente(caminho, volume, desvanecer) {"], 'Ignora o Som desligado'),
    M('main.js', "if (idAnterior && idAnterior !== screen) pararSomAmbiente();", "", 'Sair de um ecrã não pára o ambiente'),
    M('vinha.js', "    atualizarAmbienteExterior();", "    atualizarAmbienteExterior(); /* ligado */ iniciarSomAmbiente('assets/sons/prado_grilos_ras.mp3', 0.2);", 'Vinha nomeia os grilos'),
    M('garrafa.js', "function enterEngarrafar() {\n  engarrafarResultado = null;", "function enterEngarrafar() {\n  engarrafarResultado = null;\n  atualizarAmbienteExterior();", 'A página da garrafa liga o ambiente de fora'),
    M('proteger.js', "function startProteger(continuando) {", "function startProteger(continuando) {\n  atualizarAmbienteExterior();", 'O Proteger liga o ambiente de fora'),
    M('lagar.js', "function renderLagar() {", "function renderLagar() {\n  atualizarAmbienteExterior();", 'O Lagar liga o ambiente de fora')
  ];
  for (const m of MUTANTES) {
    const src = FONTES[m.f];
    const as = [].concat(m.a), bs = [].concat(m.b);
    if (as.some(function (a) { return src.split(a).length < 2; })) { console.log('FALHA: mutante "' + m.nome + '": a âncora já não existe em js/' + m.f); falhou++; continue; }
    let novo = src;
    as.forEach(function (a, i) { novo = novo.replace(a, function () { return bs[i]; }); });
    const fontes = Object.assign({}, FONTES); fontes[m.f] = novo;
    let r;
    try { r = await suite(fontes); } catch (e) { r = ['rebentou: ' + e.message]; }
    if (r.length === 0) { console.log('FALHA: o mutante "' + m.nome + '" passou nos testes'); falhou++; }
  }

  console.log(falhou === 0 ? 'OK (' + MUTANTES.length + ' mutações apanhadas)' : falhou + ' FALHA(S)');
  process.exit(falhou === 0 ? 0 : 1);
})();
