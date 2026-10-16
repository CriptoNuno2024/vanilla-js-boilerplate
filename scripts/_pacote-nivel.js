// Auxiliar dos verificar-nivel-N.js (não é um teste): prova um PACOTE DE NÍVEL REAL que vive só como dados (dados/niveis.js,
// historias.js, enciclopedia.js e capitulos.js) com o jogo real (js/ e dados/) no ambiente simulado (módulo vm, scripts/_jogo-vm.js),
// em pt, en e es, e só LÊ: nada fica gravado. É o molde de scripts/verificar-nivel-13.js com tudo o que muda de nível para nível
// (limiar, nome, foto, falas, ids, textos, capítulo, grupos anteriores de nivelMinimo) vindo de um "spec"; os níveis seguintes
// (N+1, ...) não o partem (tudo é tolerante a níveis que venham depois).
//
// spec = {
//   nivel          N, o número do nível (>= 12)
//   limiares       limiares dos níveis 1 a N: [0, 15, ..., minimo]
//   nome, nomeAnt  { pt, en, es } do nível N e do nível N - 1
//   foto           'assets/ecras/xxx.jpg' (ou .png; na fala 1); fotoRaiz: nome do ficheiro que NÃO pode existir na raiz do repositório
//   fotosExtra     (opcional) { numeroDaFala: 'assets/ecras/yyy.jpg' } fotos noutras falas (a raiz também não pode ter cópia); sem isto só a fala 1 leva foto
//   falas          4 textos { pt, en, es }
//   ids, enc, cap  os 3 ids das entradas, os textos { titulo, texto } de cada uma e o capítulo { titulo, objetivo, conclusao }
//   grupos         os ids das entradas dos pacotes anteriores (nivelMinimo 11, 12, ..., N - 1): [[...], [...], ...]
// }
//
// Prova (como em verificar-nivel-11/12/13.js):
//  (a) o limiar dá o nível N e limiar - 1 ainda o N - 1; o nome do nível;
//  (b) a subida ao N mostra as 4 falas (textos exatos), com a foto da fala 1 (e as de fotosExtra) que existe, as outras falas sem foto, e nenhuma com som;
//  (c) a história do N não aparece ao subir ao N - 1 nem ficando nele;
//  (d) as 3 entradas não existem para o nível N - 1 (nem se desbloqueiam, nem aparecem) e existem no N (textos exatos, nivelMinimo N,
//      sem imagem); no N o Explorar entrega os grupos todos com nivelMinimo ainda por abrir antes de qualquer outra e, com os
//      anteriores abertos, só os que faltam; no N - 1 nunca as do N;
//  (e) o capítulo N só está ativo no nível N, cumpre-se e celebra uma só vez com as 3 desbloqueadas;
//  (f) no nível N - 1 com o capítulo N - 1 cumprido o cartão aponta para o capítulo do nível N;
//  (g) nenhum NaN, undefined ou null; ecrãs trancados e jogador antigo certos; o modo de teste ?capitulo=N;
//  (h) o estado guardado só tem ids e o jogo carrega bem se o pacote do N deixasse de existir (e não repete nada se voltar);
//  (i) o jogo até ao nível N - 1 fica igual.
//
// JS_DIR=pasta  DADOS_DIR=pasta  correm sobre outra versão dos js/ ou dos dados/ (para provar que o teste apanha o que se estraga).
const fs = require('fs');
const os = require('os');
const path = require('path');
const { abrirJogo } = require('./_jogo-vm');

const RAIZ = path.join(__dirname, '..');
const JS_DIR = process.env.JS_DIR || path.join(RAIZ, 'js');
const DADOS_DIR = process.env.DADOS_DIR || path.join(RAIZ, 'dados');
const LINGUAS = ['pt', 'en', 'es'];
const ENTRADAS_ORIGEM = 32; // as histórias da Enciclopédia de origem

function correr(spec) {
  const N = spec.nivel, M = N - 1;
  const LIMIARES = spec.limiares;
  const MINIMO = LIMIARES[N - 1];
  const REP_M = MINIMO - 1, REP_N = MINIMO;
  const IDS = spec.ids, ENC = spec.enc, CAP = spec.cap, FALAS = spec.falas, NOME = spec.nome, NOME_ANT = spec.nomeAnt, FOTO = spec.foto;
  const FOTOS_EXTRA = spec.fotosExtra || {}; // fala (1 a 4) -> foto, além da fala 1
  const FOTOS_TODAS = [FOTO].concat(Object.keys(FOTOS_EXTRA).map(function (k) { return FOTOS_EXTRA[k]; }));
  const GRUPOS = spec.grupos; // grupos anteriores de nivelMinimo
  const TODOS_ANT = GRUPOS.reduce(function (t, g) { return t.concat(g); }, []);
  const ATE_M = ENTRADAS_ORIGEM + 3 * GRUPOS.length; // entradas visíveis no nível M
  const ATE_N = ATE_M + 3;
  const FALAS_ANT = 27 + 4 * (M - 10); // falas dos níveis 2 a M numa subida de 1 a M
  let falhas = 0;
  function ok(cond, msg) { if (!cond) { falhas++; console.log('FALHA: ' + msg); } }
  function js(o) { return JSON.stringify(o); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function nivelEsperado(rep) { let n = 1; LIMIARES.forEach(function (m, i) { if (rep >= m) n = i + 1; }); return n; }
  // Quantas entradas da Enciclopédia vê um jogador do nível n (cada pacote de nível 11, 12, ... junta 3).
  function entradasNoNivel(n) { return ENTRADAS_ORIGEM + 3 * Math.max(0, Math.min(n, M) - 10); }

  // Abre o jogo REAL com a pasta dados/ (ou outra) e os ganchos de teste.
  function abrir(opcoes) {
    const o = opcoes || {};
    const avisos = [];
    const g = abrirJogo({ jsDir: JS_DIR, dadosDir: o.dadosDir === undefined ? DADOS_DIR : o.dadosDir, explorar: true, ecraReal: true, estadoGuardado: o.estadoGuardado, aoAvisar: function (m) { avisos.push(m); } });
    g.avisos = avisos;
    g.ev(`
      var FALAS = []; var dialogoFila = []; var TIMEOUTS = [];
      mostrarFalas = function (m, n) { var l = Array.isArray(m) ? m : [m]; FALAS.push({ m: l, n: n }); dialogoFila = l; document.getElementById('app-dialogue').hidden = false; };
      setTimeout = function (f) { TIMEOUTS.push(f); return TIMEOUTS.length; };
      clearTimeout = function () {};
      document.querySelector = function () { return { id: 'screen-quinta' }; };
      function mostrarNovaEntrada() {} function atualizarDialogo() {}
      function faseRealAtual() { return 'repouso'; }
    `);
    return g;
  }
  // Reputação, nível já mostrado, capítulos concluídos (os de nível <= ate; por omissão até ao N - 1) e a Enciclopédia à escolha.
  function preparar(g, rep, nivelMostrado, abertas, ate) {
    g.ev(`
      state.acesso.jogadorAntigo = false; state.reputacao = ${rep}; state.niveis.nivelMostrado = ${nivelMostrado};
      state.encyclopedia.unlocked = ${js(abertas || [])}; state.conhecimento = 0;
      state.capitulos.iniciado = true; state.capitulos.celebradosMigrado = true;
      CAPITULOS_CONFIG.forEach(function (c) { var feito = c.nivel <= ${ate === undefined ? M : ate}; state.capitulos.concluidos[c.id] = feito; state.capitulos.celebrados[c.id] = feito; });
      delete state.capitulos.concluidos.cap${N}; delete state.capitulos.celebrados.cap${N};
      FALAS.length = 0; TIMEOUTS.length = 0;
    `);
  }
  function lingua(g, l) { g.ev("currentLang = '" + l + "';"); }
  function html(g, id) { return g.el(id).innerHTML; }
  function limpo(texto, onde) { ok(!/NaN|undefined|null|Infinity/.test(texto), onde + ': tem NaN, undefined, null ou Infinity: ' + String(texto).slice(0, 200)); }
  function semente(g, s) {
    g.ev(`
      var _rng = (function (a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })(${s});
      randInt = function (a, b) { return a + Math.floor(_rng() * (b - a + 1)); };
    `);
  }
  function idsAbertos(g) { return g.ev('state.encyclopedia.unlocked.slice()'); }
  // Uma cópia da pasta dados/ SEM os pacotes do nível "desde" para cima (simula um pacote que deixou de existir, e os seguintes
  // também): corta as chamadas nivel_N, historia_N e capN com N >= desde e as entradas de enciclopédia com nivelMinimo >= desde.
  function dadosSem(desde) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nivel' + N + '-'));
    fs.readdirSync(DADOS_DIR).filter(function (f) { return /\.js$/.test(f); }).forEach(function (f) {
      const partes = fs.readFileSync(path.join(DADOS_DIR, f), 'utf8').split(/\n(?=dadosAcrescentar\()/);
      const ficam = partes.filter(function (p) {
        if (p.indexOf('dadosAcrescentar(') !== 0) return true;
        const id = /\bid: '([a-z0-9_]+)'/.exec(p);
        const porId = id && /^(?:nivel_|historia_|cap)(\d+)$/.exec(id[1]);
        if (porId && Number(porId[1]) >= desde) return false;
        const nm = /\bnivelMinimo: (\d+)/.exec(p);
        return !(nm && Number(nm[1]) >= desde);
      });
      fs.writeFileSync(path.join(dir, f), ficam.join('\n'));
    });
    return dir;
  }
  const entradaVisivel = function (g, id) { return g.ev('encyclopediaEntries().some(function (e) { return e.id === ' + js(id) + '; })'); };

  // =====================================================================
  // (i) O jogo até ao nível M fica igual; o pacote é só o que se espera
  // =====================================================================
  {
    const base = abrir({ dadosDir: null });
    const semN = abrir({ dadosDir: dadosSem(N) });
    const g = abrir();
    const historias = Array.from({ length: M - 1 }, function (_, i) { return i + 2; }); // 2 a M
    ok(g.avisos.length === 0, '(i) carregar o jogo com dados/ não devia avisar nada: ' + g.avisos);
    ok(g.ev('NIVEIS_CONFIG.length') >= N && g.ev('CAPITULOS_CONFIG.length') >= N && Object.keys(g.ev('HISTORIA_NIVEIS')).join().indexOf(historias.concat([N]).join()) === 0, '(i) pelo menos ' + N + ' níveis, ' + N + ' capítulos e histórias dos níveis 2 a ' + N);
    ok(semN.ev('NIVEIS_CONFIG.length') === M && semN.ev('CAPITULOS_CONFIG.length') === M && semN.ev('ENCYCLOPEDIA_ENTRIES.pt.length') === ATE_M, '(i) preparação: sem o pacote do ' + N + ' o jogo tem ' + M + ' níveis, ' + M + ' capítulos e ' + ATE_M + ' entradas');
    ok(g.ev('JSON.stringify(NIVEIS_CONFIG.slice(0, ' + M + '))') === semN.ev('JSON.stringify(NIVEIS_CONFIG)'), '(i) os níveis 1 a ' + M + ' ficam iguais');
    ok(g.ev('JSON.stringify(CAPITULOS_CONFIG.slice(0, ' + M + '))') === semN.ev('JSON.stringify(CAPITULOS_CONFIG)'), '(i) os capítulos 1 a ' + M + ' ficam iguais');
    const hs = '[' + historias.join(',') + '].map(function (n) { return HISTORIA_NIVEIS[n]; })';
    ok(g.ev('JSON.stringify(' + hs + ')') === semN.ev('JSON.stringify(' + hs + ')'), '(i) as histórias dos níveis 2 a ' + M + ' ficam iguais');
    LINGUAS.forEach(function (l) {
      ok(g.ev('JSON.stringify(ENCYCLOPEDIA_ENTRIES.' + l + '.slice(0, ' + ATE_M + '))') === semN.ev('JSON.stringify(ENCYCLOPEDIA_ENTRIES.' + l + ')'), '(i) as ' + ATE_M + ' entradas anteriores ficam iguais (' + l + ')');
    });
    ok(g.ev('JSON.stringify(ENCYCLOPEDIA_ENTRIES.pt.slice(0, ' + ENTRADAS_ORIGEM + '))') === base.ev('JSON.stringify(ENCYCLOPEDIA_ENTRIES.pt)'), '(i) as ' + ENTRADAS_ORIGEM + ' entradas de origem ficam iguais ao jogo sem dados/');
    ok(g.ev('Math.max.apply(null, Object.keys(NIVEL_NECESSARIO_POR_ECRA).map(function (k) { return NIVEL_NECESSARIO_POR_ECRA[k]; }))') === 10, '(i) nenhum ecrã novo: o mais alto continua a abrir no nível 10');
    ok(g.ev('NIVEIS_CONFIG[' + M + '].id') === 'nivel_' + N && g.ev('NIVEIS_CONFIG[' + M + '].min') === MINIMO && g.ev('CAPITULOS_CONFIG[' + M + '].id') === 'cap' + N && g.ev('CAPITULOS_CONFIG[' + M + '].nivel') === N, '(i) nivel_' + N + ' (' + MINIMO + ') e cap' + N + ' (nível ' + N + ')');
    const novas = g.ev('DADOS_ACRESCENTADOS.enciclopedia.map(function (e) { return e.id; })');
    ok(JSON.stringify(novas.slice(TODOS_ANT.length, TODOS_ANT.length + 3)) === JSON.stringify(IDS) && JSON.stringify(g.ev('ENCYCLOPEDIA_ENTRIES.pt.slice(' + ATE_M + ', ' + ATE_N + ').map(function (e) { return e.id; })')) === JSON.stringify(IDS), '(i) as 3 entradas, por esta ordem, logo a seguir às anteriores: ' + IDS);
    ok(g.ev('JSON.stringify(CAPITULOS_CONFIG[' + M + '].criterio)') === js([{ tipo: 'temIds', caminho: 'encyclopedia.unlocked', ids: IDS }]), '(i) o critério do cap' + N + ' é temIds nos 3 ids: ' + g.ev('JSON.stringify(CAPITULOS_CONFIG[' + M + '].criterio)'));
    ok(fs.existsSync(path.join(RAIZ, FOTO)), '(i) a foto da fala 1 existe em ' + FOTO);
    ok(!fs.existsSync(path.join(RAIZ, spec.fotoRaiz)), '(i) não devia haver cópia da foto na raiz do repositório');
    FOTOS_TODAS.forEach(function (f) {
      ok(fs.existsSync(path.join(RAIZ, f)), '(i) a foto existe em ' + f);
      ok(!fs.existsSync(path.join(RAIZ, path.basename(f))), '(i) não devia haver cópia de ' + path.basename(f) + ' na raiz do repositório');
    });
    ok(g.ev('HISTORIA_NIVEIS[' + N + '].length') === 4, '(i) a história do ' + N + ' tem 4 falas');
  }

  LINGUAS.forEach(function (l) {
    const L = ' [' + l + ']';

    // ===================================================================
    // (a) O nível
    // ===================================================================
    {
      const g = abrir(); lingua(g, l);
      ok(g.ev('nivelPelaReputacao(' + REP_M + ')') === M && g.ev('nivelPelaReputacao(' + REP_N + ')') === N && g.ev('nivelPelaReputacao(' + (REP_N + 1) + ')') === N && g.ev('nivelPelaReputacao(' + LIMIARES[M - 1] + ')') === M, '(a) ' + REP_M + ' dá o nível ' + M + ' e ' + REP_N + ' dá o ' + N + L);
      ok(g.ev('nivelNome(NIVEIS_CONFIG[' + M + '])') === NOME[l], '(a) o nome do nível ' + N + ' é «' + NOME[l] + '»' + L + ': ' + g.ev('nivelNome(NIVEIS_CONFIG[' + M + '])'));
    }

    // ===================================================================
    // (b) e (c) A história: a subida ao N mostra as 4 falas; a do N não aparece ao subir ao N - 1
    // ===================================================================
    {
      const g = abrir(); lingua(g, l);
      preparar(g, LIMIARES[M - 1], M - 1);
      ok(g.ev('verificarSubidaNivel()') === true && g.ev('FALAS.length') === 1 && g.ev('FALAS[0].m.length') === 4, '(c) subir ao ' + M + ' mostra as 4 falas do nível ' + M + L);
      const fM = g.ev('JSON.stringify(FALAS)');
      ok(FALAS.every(function (f) { return fM.indexOf(f[l]) === -1; }) && FOTOS_TODAS.every(function (f) { return fM.indexOf(path.basename(f, path.extname(f))) === -1; }), '(c) a história do ' + N + ' não aparece ao subir ao ' + M + L);
      preparar(g, REP_M, M);
      ok(g.ev('verificarSubidaNivel()') === false && g.ev('FALAS.length') === 0, '(c) com ' + REP_M + ' (nível ' + M + ') não se mostra a história do ' + N + L);
      preparar(g, REP_N, M);
      ok(g.ev('verificarSubidaNivel()') === true, '(b) subir ao ' + N + ' devolve true' + L);
      ok(g.ev('state.niveis.nivelMostrado') === N, '(b) o nível mostrado passa a ' + N + L);
      ok(g.ev('FALAS.length') === 1 && g.ev('FALAS[0].n') === 'YoshiCat' && g.ev('FALAS[0].m.length') === 4, '(b) uma só fila de 4 falas, do YoshiCat' + L);
      const falas = g.ev('JSON.parse(JSON.stringify(FALAS[0].m))');
      falas.forEach(function (f, i) { ok(f.texto === FALAS[i][l], '(b) fala ' + (i + 1) + ' com o texto exato em ' + l + ': ' + f.texto); });
      ok(falas[0].foto === FOTO && fs.existsSync(path.join(RAIZ, falas[0].foto)), '(b) a fala 1 leva a foto ' + FOTO + ' e ela existe' + L);
      falas.forEach(function (f, i) {
        if (i === 0) return;
        const esperada = FOTOS_EXTRA[i + 1];
        ok(f.foto === esperada && (esperada === undefined || fs.existsSync(path.join(RAIZ, f.foto))), '(b) a fala ' + (i + 1) + (esperada ? ' leva a foto ' + esperada + ' e ela existe' : ' não leva foto') + L);
      });
      ok(falas.every(function (f) { return f.som === undefined; }), '(b) nenhuma fala leva som (as falas não têm volume)' + L);
      limpo(js(falas), '(b) falas' + L);
      g.ev('FALAS.length = 0; mostrarHistoriaSubidaNivel(1, ' + N + ');');
      const todas = g.ev('JSON.parse(JSON.stringify(FALAS[0].m))');
      ok(todas.length === FALAS_ANT + 4 && todas[FALAS_ANT].texto === FALAS[0][l] && todas[FALAS_ANT + 3].texto === FALAS[3][l], '(b) de 1 a ' + N + ' vêm as ' + FALAS_ANT + ' falas de 2 a ' + M + ' e as 4 do ' + N + ' no fim' + L);
    }

    // ===================================================================
    // (d) As 3 entradas: nada no nível M; no N existem e o Explorar entrega-as primeiro (com todos os grupos de nivelMinimo)
    // ===================================================================
    {
      const g = abrir(); lingua(g, l);
      preparar(g, REP_M, M);
      ok(g.ev('encyclopediaEntries().length') === ATE_M && IDS.every(function (id) { return entradaVisivel(g, id) === false; }), '(d) no nível ' + M + ' só há as ' + ATE_M + ' anteriores' + L);
      g.ev('renderEnciclopedia();');
      let h = html(g, 'enciclopedia-container');
      ok((h.match(/encyclopedia-card/g) || []).length === ATE_M && h.indexOf('0 / ' + ATE_M) !== -1, '(d) nível ' + M + ': a Enciclopédia tem ' + ATE_M + ' cartões, nenhum do pacote novo' + L);
      ok(IDS.every(function (id) { return h.indexOf(esc(ENC[id].titulo[l])) === -1; }), '(d) nível ' + M + ': nenhum título do pacote novo' + L);
      ok(IDS.every(function (id) { return g.ev('desbloquearEntradaEnciclopedia(' + js(id) + ')') === null; }) && idsAbertos(g).length === 0, '(d) nível ' + M + ': não se desbloqueiam, por ação nenhuma' + L);
      semente(g, 11);
      for (let i = 0; i < 80; i++) g.ev('enterExplorar();');
      ok(IDS.every(function (id) { return idsAbertos(g).indexOf(id) === -1; }), '(d) nível ' + M + ': o Explorar nunca as entrega (80 cliques)' + L);
      ok(TODOS_ANT.every(function (id) { return idsAbertos(g).indexOf(id) !== -1; }), '(d) nível ' + M + ': mas entrega as dos grupos anteriores' + L);

      // nível N: existem, com os textos exatos
      preparar(g, REP_N, N);
      ok(g.ev('encyclopediaEntries().length') === ATE_N, '(d) nível ' + N + ': ' + ATE_N + ' entradas' + L);
      IDS.forEach(function (id) {
        const e = g.ev('encyclopediaEntries().filter(function (e) { return e.id === ' + js(id) + '; })[0]');
        ok(e && e.titulo === ENC[id].titulo[l] && e.texto === ENC[id].texto[l] && e.nivelMinimo === N && e.imagem === undefined, '(d) ' + id + ': título e texto exatos, nível mínimo ' + N + ', sem imagem' + L);
      });
      g.ev('renderEnciclopedia();');
      h = html(g, 'enciclopedia-container');
      ok((h.match(/encyclopedia-card/g) || []).length === ATE_N && h.indexOf('0 / ' + ATE_N) !== -1, '(d) nível ' + N + ': a Enciclopédia tem ' + ATE_N + ' cartões (as 3 novas bloqueadas) e 0 / ' + ATE_N + L);
      preparar(g, REP_N, N, IDS);
      g.ev('renderEnciclopedia();');
      h = html(g, 'enciclopedia-container');
      ok(IDS.every(function (id) { return h.indexOf('<h3>' + esc(ENC[id].titulo[l]) + '</h3>') !== -1 && h.indexOf('<p>' + esc(ENC[id].texto[l]) + '</p>') !== -1; }), '(d) nível ' + N + ': abertas, mostram o título e o texto (escapados)' + L);
      ok(h.indexOf('3 / ' + ATE_N) !== -1 && h.indexOf('<img') === -1, '(d) nível ' + N + ': 3 / ' + ATE_N + ' e sem imagens' + L);
      limpo(h, '(d) Enciclopédia' + L);
    }
    {
      // Grupos de nivelMinimo (11, 12, ..., N): saem todos os ainda por abrir (por qualquer ordem) antes de qualquer outra; com os
      // grupos anteriores abertos, só os que faltam.
      for (let aberto = 0; aberto <= GRUPOS.length; aberto++) {
        const jaAbertas = GRUPOS.slice(0, aberto).reduce(function (t, g) { return t.concat(g); }, []);
        const faltam = TODOS_ANT.filter(function (id) { return jaAbertas.indexOf(id) === -1; }).concat(IDS);
        const sementes = aberto === 0 ? 25 : 8;
        for (let s = 1; s <= sementes; s++) {
          const g = abrir(); lingua(g, l);
          preparar(g, REP_N, N, jaAbertas); semente(g, s * 7 + aberto * 101 + (l === 'pt' ? 0 : l === 'en' ? 1 : 2));
          const saidas = [];
          for (let i = 0; i < faltam.length + 3; i++) { g.ev('enterExplorar();'); const a = idsAbertos(g); saidas.push(a[a.length - 1]); }
          ok(saidas.slice(0, faltam.length).slice().sort().join() === faltam.slice().sort().join(), '(d) ' + aberto + ' grupos anteriores abertos, semente ' + s + L + ': as ' + faltam.length + ' primeiras entregas são as que faltam: ' + saidas.slice(0, faltam.length));
          ok(saidas.slice(faltam.length).every(function (id) { return faltam.indexOf(id) === -1 && jaAbertas.indexOf(id) === -1; }) && new Set(saidas).size === saidas.length, '(d) ' + aberto + ' grupos anteriores abertos, semente ' + s + L + ': depois só as outras, sem repetir');
        }
      }
    }

    // ===================================================================
    // (e) e (f) O capítulo N
    // ===================================================================
    {
      const g = abrir(); lingua(g, l);
      const ui = g.ev("cStr('ui')");
      // (f) nível M com os capítulos 1 a M cumpridos: o cartão aponta para o capítulo do nível N
      preparar(g, REP_M, M);
      g.ev('atualizarCapituloQuinta();');
      const cM = html(g, 'capitulo-container');
      ok(cM.indexOf(ui.proximo.replace('{n}', N)) !== -1 && cM.indexOf(ui.todos) === -1, '(f) nível ' + M + ' com o cap' + M + ' cumprido: «' + ui.proximo.replace('{n}', N) + '», não «' + ui.todos + '»' + L + ': ' + cM);
      ok(cM.indexOf(esc(CAP.titulo[l])) === -1, '(f) nível ' + M + ': o capítulo ' + N + ' ainda não está ativo (título escondido)' + L);
      limpo(cM, '(f) cartão do capítulo no nível ' + M + L);
      // (e) nível N: ativo
      preparar(g, REP_N, N);
      g.ev('atualizarCapituloQuinta();');
      const cN = html(g, 'capitulo-container');
      ok(cN.indexOf(esc(CAP.titulo[l])) !== -1 && cN.indexOf(esc(CAP.objetivo[l])) !== -1 && cN.indexOf('0 / 3') !== -1, '(e) nível ' + N + ': o cartão mostra o título, o objetivo e 0 / 3' + L + ': ' + cN);
      limpo(cN, '(e) cartão do capítulo no nível ' + N + L);
      ok(g.ev("cStr('cap" + N + "').titulo") === CAP.titulo[l] && g.ev("cStr('cap" + N + "').objetivo") === CAP.objetivo[l], '(e) título e objetivo do cap' + N + ' exatos' + L);
      // com o cap M por cumprir, o cartão continua no cap M (o primeiro por cumprir)
      preparar(g, REP_N, N, [], M - 1);
      g.ev('atualizarCapituloQuinta();');
      const cartaoAntes = html(g, 'capitulo-container');
      ok(cartaoAntes.indexOf(ui.rotulo + ' ' + M + ' · ') !== -1 && cartaoAntes.indexOf(esc(CAP.titulo[l])) === -1, '(e) com o cap' + M + ' por cumprir, o cartão mostra o cap' + M + ' (e não o cap' + N + ')' + L + ': ' + cartaoAntes);
      preparar(g, REP_N, N, [IDS[1]]);
      g.ev('atualizarCapituloQuinta();');
      ok(html(g, 'capitulo-container').indexOf('1 / 3') !== -1, '(e) com 1 das 3: 1 / 3' + L);
      ok(g.ev('capitulosAvaliarCelebracao()') === false && g.ev('FALAS.length') === 0, '(e) com 1 das 3 não celebra' + L);
      g.ev('state.encyclopedia.unlocked.push(' + js(IDS[0]) + ');');
      g.ev('atualizarCapituloQuinta();');
      ok(html(g, 'capitulo-container').indexOf('2 / 3') !== -1 && g.ev('capitulosAvaliarCelebracao()') === false, '(e) com 2 das 3: 2 / 3, não celebra' + L);
      g.ev('state.encyclopedia.unlocked.push(' + js(IDS[2]) + ');');
      ok(g.ev('capitulosAvaliarCelebracao()') === true, '(e) com as 3 celebra' + L);
      ok(g.ev('FALAS.length') === 1 && g.ev('FALAS[0].m[0]') === CAP.conclusao[l], '(e) a conclusão exata em ' + l + L + ': ' + g.ev('FALAS[0].m[0]'));
      ok(g.ev('capitulosAvaliarCelebracao()') === true && g.ev('FALAS.length') === 1 && g.ev('TIMEOUTS.length') === 1, '(e) com a festa pendente não agenda outra' + L);
      g.ev('TIMEOUTS[0]();');
      ok(g.ev('state.capitulos.concluidos.cap' + N) === true && g.ev('state.capitulos.celebrados.cap' + N) === true, '(e) depois da confirmação fica concluído e celebrado' + L);
      ok(g.ev('capitulosAvaliarCelebracao()') === false && g.ev('FALAS.length') === 1, '(e) só celebra uma vez' + L);
      g.ev('atualizarCapituloQuinta();');
      const seguinte = g.ev("CAPITULOS_CONFIG.filter(function (c) { return state.capitulos.concluidos[c.id] !== true; }).map(function (c) { return c.nivel; })[0]");
      const cartaoFim = html(g, 'capitulo-container');
      ok(seguinte === undefined ? cartaoFim.indexOf(ui.todos) !== -1 : cartaoFim.indexOf(ui.proximo.replace('{n}', seguinte)) !== -1, '(e) cumprido o cap' + N + ', o cartão diz ' + (seguinte === undefined ? 'que estão todos cumpridos' : 'o próximo capítulo no nível ' + seguinte) + L + ': ' + cartaoFim);
      // Pelo Explorar de ponta a ponta, com todos os grupos anteriores abertos: 3 cliques cumprem o capítulo N
      const g2 = abrir(); lingua(g2, l);
      preparar(g2, REP_N, N, TODOS_ANT); semente(g2, 99);
      for (let i = 0; i < 3; i++) g2.ev('enterExplorar();');
      ok(g2.ev('capitulosAvaliarCelebracao()') === true && g2.ev('FALAS[0].m[0]') === CAP.conclusao[l], '(e) 3 cliques no Explorar chegam para cumprir o capítulo ' + N + L);
    }

    // ===================================================================
    // (g) Sem NaN/undefined/null; ecrãs trancados e jogador antigo
    // ===================================================================
    {
      const g = abrir(); lingua(g, l);
      const ecras = Object.keys(g.ev('NIVEL_NECESSARIO_POR_ECRA'));
      // Reputações à volta de cada limiar, e uma acima do último (sem chegar a um nível seguinte, que ainda não existe aqui).
      const REPS = [0, 1].concat(LIMIARES.slice(1).reduce(function (t, m) { return t.concat([m - 1, m, m + 1]); }, []), [MINIMO + 300]);
      REPS.forEach(function (rep) {
        const n = nivelEsperado(rep);
        const onde = 'reputação ' + rep + L;
        preparar(g, rep, n);
        ok(g.ev('nivelPelaReputacao(state.reputacao)') === n, '(g) o nível devia ser ' + n + ' com ' + onde);
        g.ev('atualizarCartaoNivelQuinta(); atualizarResumoQuinta(); atualizarCapituloQuinta();');
        const h = html(g, 'nivel-container');
        limpo(h, '(g) cartão do nível, ' + onde);
        limpo(html(g, 'capitulo-container'), '(g) cartão do capítulo, ' + onde);
        limpo(g.el('quinta-resumo-linha').textContent, '(g) resumo, ' + onde);
        ok(h.indexOf(g.ev("t('nivel.label')") + ' ' + n + ' · ') !== -1, '(g) o cartão diz o nível ' + n + ' com ' + onde + ': ' + h);
        if (n < N) {
          const prox = LIMIARES[n];
          const pct = Math.round(Math.min(rep, prox) / prox * 100);
          ok(h.indexOf('width:' + pct + '%') !== -1 && h.indexOf(Math.min(rep, prox) + ' / ' + prox) !== -1, '(g) a barra está a ' + pct + '% (' + Math.min(rep, prox) + ' / ' + prox + ') com ' + onde + ': ' + h);
          if (n === M) ok(h.indexOf(esc(NOME_ANT[l])) !== -1, '(g) no nível ' + M + ' o cartão mostra o seu nome «' + NOME_ANT[l] + '»' + L);
        } else {
          ok(h.indexOf(esc(NOME[l])) !== -1, '(g) no nível ' + N + ' o cartão mostra «' + NOME[l] + '» com ' + onde + ': ' + h);
          // Com um nível seguinte em dados/ a barra vai até ao seu limiar; sem ele o N é o máximo e a barra está cheia.
          const proxN = g.ev('NIVEIS_CONFIG.length > ' + N + ' ? NIVEIS_CONFIG[' + N + '].min : null');
          if (proxN === null) ok(h.indexOf('width:100%') !== -1 && h.indexOf(g.ev("t('nivel.maximo')")) !== -1, '(g) sem nível ' + (N + 1) + ', o ' + N + ' é o máximo e a barra está cheia com ' + onde + ': ' + h);
          else ok(h.indexOf('width:' + Math.round(Math.min(rep, proxN) / proxN * 100) + '%') !== -1 && h.indexOf(rep + ' / ' + proxN) !== -1, '(g) no nível ' + N + ' a barra vai até ao nível seguinte (' + proxN + ') com ' + onde + ': ' + h);
        }
        ecras.forEach(function (e) {
          const preciso = g.ev('NIVEL_NECESSARIO_POR_ECRA.' + e);
          ok(g.ev("ecraDesbloqueado('" + e + "')") === (n >= preciso), '(g) o ecrã ' + e + ' (nível ' + preciso + ') devia estar ' + (n >= preciso ? 'aberto' : 'trancado') + ' com ' + onde);
          if (n < preciso) {
            g.ev('FALAS.length = 0; mostrarMensagemTrancada(' + js(e) + ');');
            const msg = g.ev('FALAS[0].m[0]');
            limpo(msg, '(g) mensagem do ecrã ' + e + ' trancado, ' + onde);
            ok(msg.indexOf(String(LIMIARES[preciso - 1] - rep)) !== -1, '(g) a mensagem do ecrã ' + e + ' diz quanto falta com ' + onde + ': ' + msg);
          }
        });
        g.ev('state.acesso.jogadorAntigo = true;');
        ecras.forEach(function (e) { ok(g.ev("ecraDesbloqueado('" + e + "')") === true, '(g) jogador antigo: o ecrã ' + e + ' aberto com ' + onde); });
        // O jogador antigo não salta o nível mínimo das histórias novas.
        if (n < N) ok(g.ev('encyclopediaEntries().length') === entradasNoNivel(n), '(g) jogador antigo abaixo do ' + N + ': continua sem as 3 novas com ' + onde);
        g.ev('state.acesso.jogadorAntigo = false;');
      });
      // O modo de teste ?capitulo=N mostra a celebração do capN (e continua a aceitar os anteriores).
      const tN = abrir(); lingua(tN, l);
      [String(N), 'cap' + N].forEach(function (v) { tN.ev("location.search = '?capitulo=" + v + "';"); ok((tN.ev('capitulosParametrosTeste()') || {}).id === 'cap' + N, '(g) ?capitulo=' + v + ' é válido' + L); });
      [1, 5, 10, 11, M].forEach(function (n) { tN.ev("location.search = '?capitulo=" + n + "';"); ok((tN.ev('capitulosParametrosTeste()') || {}).id === 'cap' + n, '(g) ?capitulo=' + n + ' continua válido' + L); });
      ['99', '0', '0' + N, '1a', '100', 'cap_' + N, ''].forEach(function (v) { tN.ev("location.search = '?capitulo=" + v + "';"); ok(tN.ev('capitulosParametrosTeste()') === null, '(g) ?capitulo=' + v + ' não é válido' + L); });
      tN.ev("location.search = '?capitulo=" + N + "';");
      preparar(tN, 100, 1);
      ok(tN.ev('capitulosCelebracaoDeTeste()') === true && tN.ev('FALAS[FALAS.length - 1].m[0]') === CAP.conclusao[l], '(g) o modo de teste ?capitulo=' + N + ' mostra a conclusão do cap' + N + L);
    }
  });

  // =====================================================================
  // (h) O estado guardado só tem ids; o jogo carrega bem sem o pacote do N; e se voltar nada se repete
  // =====================================================================
  {
    const a = abrir(); lingua(a, 'pt');
    preparar(a, REP_N, M, TODOS_ANT);
    a.ev('verificarSubidaNivel();');
    semente(a, 5);
    for (let i = 0; i < 3; i++) a.ev('enterExplorar();');
    a.ev('capitulosAvaliarCelebracao(); TIMEOUTS.forEach(function (f) { f(); }); saveState(state);');
    const salvo = a.guardado.yoshicat_quinta_state_v2;
    ok(typeof salvo === 'string' && salvo.length > 100, '(h) o jogo A gravou o estado');
    const estado = JSON.parse(salvo);
    ok(IDS.every(function (id) { return estado.encyclopedia.unlocked.indexOf(id) !== -1; }) && estado.niveis.nivelMostrado === N && estado.capitulos.concluidos['cap' + N] === true && estado.capitulos.celebrados['cap' + N] === true, '(h) o estado guarda os 3 ids, o nível mostrado ' + N + ' e o cap' + N + ' concluído e celebrado');
    const textos = [].concat(LINGUAS.map(function (l) { return NOME[l]; }), FALAS.map(function (f) { return f.pt; }), FALAS.map(function (f) { return f.en; }), FALAS.map(function (f) { return f.es; }));
    IDS.forEach(function (id) { LINGUAS.forEach(function (l) { textos.push(ENC[id].titulo[l], ENC[id].texto[l]); }); });
    LINGUAS.forEach(function (l) { textos.push(CAP.titulo[l], CAP.objetivo[l], CAP.conclusao[l]); });
    ok(textos.every(function (t) { return salvo.indexOf(t) === -1; }), '(h) o estado guardado não leva nenhum texto do pacote (só ids)');
    ok(FOTOS_TODAS.every(function (f) { return salvo.indexOf(path.basename(f)) === -1; }) && salvo.indexOf('nivelMinimo') === -1, '(h) nem a foto nem o nível mínimo');

    // Jogo B: o pacote do nível N deixou de existir (os anteriores ficam).
    const b = abrir({ dadosDir: dadosSem(N), estadoGuardado: salvo });
    lingua(b, 'pt');
    b.ev('state.reputacao = ' + (REP_N + 50) + ';');
    let erro = null;
    try { b.ev('atualizarCartaoNivelQuinta(); atualizarResumoQuinta(); atualizarCapituloQuinta(); renderEnciclopedia(); enterExplorar();'); } catch (e) { erro = e.message; }
    ok(erro === null, '(h) o jogo B (sem o pacote do ' + N + ') desenha o cartão do nível, do capítulo, a Enciclopédia e o Explorar sem erro: ' + erro);
    const hb = html(b, 'nivel-container') + html(b, 'capitulo-container') + html(b, 'enciclopedia-container') + html(b, 'explorar-container') + b.el('quinta-resumo-linha').textContent;
    limpo(hb, '(h) jogo B');
    ok(b.ev('nivelPelaReputacao(state.reputacao)') === M && html(b, 'nivel-container').indexOf(b.ev("t('nivel.maximo')")) !== -1, '(h) sem o pacote do ' + N + ' o jogador é do nível ' + M + ' (o máximo) e continua a jogar');
    ok(IDS.every(function (id) { return b.ev('state.encyclopedia.unlocked.indexOf(' + js(id) + ')') !== -1; }) && b.ev('state.capitulos.concluidos.cap' + N) === true, '(h) os ids soltos continuam guardados (nunca se apagam)');
    ok(html(b, 'enciclopedia-container').indexOf('/ ' + ATE_M) !== -1 && IDS.every(function (id) { return entradaVisivel(b, id) === false; }), '(h) sem o pacote do ' + N + ' os ids soltos não contam nos totais (x / ' + ATE_M + ')');
    b.ev('state.reputacao += 10; saveState(state);');
    ok(b.ev('verificarSubidaNivel()') === false && b.ev('state.reputacao') === REP_N + 60, '(h) o jogador B continua a ganhar Reputação sem subir');
    ['proteger', 'garrafa', 'explorar', 'colecao', 'estrada', 'lagar', 'camara', 'roxo', 'loja'].forEach(function (e) { ok(b.ev("ecraDesbloqueado('" + e + "')") === true, '(h) jogo B: o ecrã ' + e + ' aberto'); });

    // Jogo C: o pacote volta com o mesmo estado. Nada se repete.
    const c = abrir({ estadoGuardado: salvo }); lingua(c, 'pt');
    ok(c.ev('NIVEIS_CONFIG.length') >= N && c.ev('nivelPelaReputacao(state.reputacao)') === N, '(h) com o pacote de volta, o jogador é outra vez do nível ' + N);
    ok(c.ev('verificarSubidaNivel()') === false && c.ev('FALAS.length') === 0, '(h) a história do ' + N + ' não se repete');
    ok(c.ev('capitulosAvaliarCelebracao()') === false, '(h) o capítulo ' + N + ' não celebra outra vez');
    ok(IDS.every(function (id) { return c.ev('desbloquearEntradaEnciclopedia(' + js(id) + ')') === null; }), '(h) as 3 já abertas não se abrem outra vez');
    c.ev('renderEnciclopedia();');
    ok(html(c, 'enciclopedia-container').indexOf('<h3>' + esc(ENC[IDS[2]].titulo.pt) + '</h3>') !== -1, '(h) com o pacote de volta, as histórias aparecem abertas');
  }

  if (falhas) { console.log(falhas + ' falha(s)'); process.exit(1); }
  console.log('OK');
}

module.exports = { correr };
