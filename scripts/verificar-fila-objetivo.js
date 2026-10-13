#!/usr/bin/env node
// A fila de botões (Vinha, Adega, Festa) desliza até ao botão do objetivo do dia, só ao abrir o ecrã.
// Carrega SÓ os blocos "fila-pastilhas" (js/main.js) e "mapa-botoes" (js/objetivos.js) e as regras do relógio (js/tempo.js) num
// ambiente simulado (vm) com uma fila falsa que faz as contas de layout (larguras reais medidas no Chromium 360x640, fila de
// 340 px, setas de 44 px, espaçadores de 12/56 px). Não há browser nem conta real.
//
// A. Objetivo com botão escondido, cortado ou tapado pela seta -> a fila desliza e o botão fica INTEIRO à vista (e a seta da
//    esquerda aparece); botão já inteiro -> não desliza; sem objetivo para o ecrã (nenhum, cumprido, de outro ecrã, de outro
//    dia, Proteger/Explorar) -> não desliza.
// B. Casos do mapa: Adega (fortificar, engarrafar, alambique com 2 botões), Vinha (compostagem, estacas, frio, vigiar, colher
//    mais largo do que a fila, 2 objetivos), Festa (tarefas por fazer; as já feitas não contam).
// C. Depois de um clique, do relógio ou de voltar de uma tarefa (a fila é redesenhada) a posição que o jogador deixou mantém-se,
//    e a fila não volta a deslizar sozinha; ao abrir o ecrã de novo recomeça do princípio e desliza outra vez.
// D. "Reduzir movimento": sem animação. E. O mapa objetivo -> botão, os data-acao dos botões e o gancho no goTo().
//
// Depois de passar, aplica "mutações" (estraga cada regra de propósito) e confirma que o teste as apanha.
// Uso: node scripts/verificar-fila-objetivo.js     Sai com 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { regrasDoRelogio } = require('./_regras-tempo');

const RAIZ = path.join(__dirname, '..');
const FONTES = {};
['main.js', 'objetivos.js', 'vinha.js', 'garrafa.js', 'festas.js', 'tempo.js'].forEach(function (f) { FONTES[f] = fs.readFileSync(path.join(RAIZ, 'js', f), 'utf8'); });
const HOJE = '2026-10-10';

function bloco(src, nome) {
  const a = src.indexOf('// >>> ' + nome), b = src.indexOf('// <<< ' + nome);
  if (a === -1 || b === -1 || b < a) throw new Error('sem o bloco ' + nome);
  return src.slice(a, b);
}

// Larguras (px) dos botões, medidas no Chromium 360x640 em português.
const LAYOUTS = {
  adegaSemLote: { acoes: ['prensar', 'destilarVinho', 'destilarBagaco', 'fortificar'], larguras: [90, 130, 141, 109] },
  adegaLotePronto: { acoes: ['prensar', 'destilarVinho', 'destilarBagaco', 'engarrafar'], larguras: [90, 130, 141, 109] },
  vinhaPronta: { acoes: ['colher', 'compostagem'], larguras: [272, 111] },
  vinhaPreparadaVento: { acoes: ['ervas', 'plantar', 'compostagem', 'repararEstacas'], larguras: [77, 82, 111, 89] },
  vinhaCrescendoVento: { acoes: ['regar', 'adubar', 'ervas', 'compostagem', 'repararEstacas'], larguras: [79, 89, 77, 111, 89] },
  vinhaCrescendoFrio: { acoes: ['regar', 'adubar', 'ervas', 'compostagem', 'protegerFrio'], larguras: [79, 89, 77, 111, 89] },
  vinhaCrescendoChuva: { acoes: ['regar', 'adubar', 'ervas', 'compostagem', 'vigiar'], larguras: [79, 89, 77, 111, 160] },
  festa: { acoes: ['castanhas', 'jeropiga', 'prova'], larguras: [140, 130, 172] },
  adegaBotaoLargo: { acoes: ['prensar', 'fortificar'], larguras: [100, 285] }
};
const ID_FILA = { vinha: 'vinha-pill-scroll', garrafa: 'adega-pill-scroll', festa: 'festa-pill-scroll' };

function suite(fontes) {
  const falhas = [];
  function ok(cond, msg) { if (!cond) falhas.push(msg); }

  function abrirAmbiente(opcoes) {
    opcoes = opcoes || {};
    const doc = { filas: {}, fonts: undefined };
    const raf = [];
    const sb = {
      console: { log() {}, warn() {}, error() {} },
      document: doc,
      setTimeout: function (f) { raf.push(f); return 1; },
      state: { objetivos: { dia: HOJE, lista: [] } },
      FEITO: { reduzido: !!opcoes.reduzido }
    };
    doc.getElementById = function (id) { return doc.filas[id] || null; };
    sb.window = { addEventListener: function () {}, requestAnimationFrame: function (f) { raf.push(f); }, matchMedia: function () { return { matches: sb.FEITO.reduzido }; } };
    const cx = vm.createContext(sb);
    vm.runInContext(regrasDoRelogio(), cx);
    vm.runInContext('function diaLisboaDeHoje() { return "' + HOJE + '"; }', cx);
    vm.runInContext(bloco(fontes['main.js'], 'fila-pastilhas'), cx, { filename: 'main.js(fila)' });
    vm.runInContext(bloco(fontes['objetivos.js'], 'mapa-botoes'), cx, { filename: 'objetivos.js(mapa)' });
    const A = { cx: cx, doc: doc, raf: raf, filas: doc.filas };
    A.ev = function (c) { return vm.runInContext(c, cx); };
    A.json = function (c) { return JSON.parse(vm.runInContext('JSON.stringify(' + c + ')', cx)); };
    A.objetivos = function (lista, dia) { sb.state.objetivos = { dia: dia === undefined ? HOJE : dia, lista: lista.map(function (id) { return typeof id === 'string' ? { id: id, cumprido: false } : id; }) }; };
    A.flushRaf = function () { while (raf.length) raf.shift()(); };
    A.state = sb.state;
    return A;
  }

  // Uma fila falsa com layout: 340 px, espaçadores (12/56 px, mudam com as setas), botões lado a lado com 8 px de intervalo.
  function criarFila(A, id, layout, opcoes) {
    opcoes = opcoes || {};
    const margens = { esq: 12, dir: 12 };
    const oculto = { esq: true, dir: true };
    const ouvintes = [];
    const chamadasScrollTo = [];
    const CW = 340, ESQ = 10, GAP = 8;
    let scroll = 0;
    let pendente = false;
    const total = function () { return margens.esq + layout.larguras.reduce(function (a, b) { return a + b; }, 0) + GAP * (layout.larguras.length - 1) + margens.dir; };
    const classList = function (chave) { return { contains: function (c) { return c === 'oculto' && oculto[chave]; }, toggle: function (c, f) { if (c === 'oculto') oculto[chave] = !!f; } }; };
    const setaEsq = { classList: classList('esq'), getBoundingClientRect: function () { return { left: ESQ, right: ESQ + 44 }; } };
    const setaDir = { classList: classList('dir'), getBoundingClientRect: function () { return { left: ESQ + CW - 44, right: ESQ + CW }; } };
    const wrap = { querySelector: function (s) { return s === '.pill-arrow-left' ? setaEsq : s === '.pill-arrow-right' ? setaDir : (s.indexOf('fade-left') !== -1 ? { classList: classList('esq') } : s.indexOf('fade-right') !== -1 ? { classList: classList('dir') } : null); } };
    let off = 0;
    const botoes = layout.acoes.map(function (acao, i) {
      const largura = layout.larguras[i], deslocamento = off;
      off += largura + GAP;
      return {
        disabled: (opcoes.desativados || []).indexOf(acao) !== -1,
        getAttribute: function (a) { return a === 'data-acao' ? acao : null; },
        getBoundingClientRect: function () { const l = ESQ + margens.esq + deslocamento - fila.scrollLeft; return { left: l, right: l + largura, width: largura }; },
        acao: acao
      };
    });
    const fila = {
      id: id, botoes: botoes, chamadasScrollTo: chamadasScrollTo, ouvintes: ouvintes, margens: margens, oculto: oculto,
      clientWidth: opcoes.larguraZero ? 0 : CW,
      style: { scrollBehavior: '', vars: {}, setProperty: function (k, v) { this.vars[k] = String(v); if (k === '--pastilhas-margem-esq') margens.esq = parseFloat(v); if (k === '--pastilhas-margem-dir') margens.dir = parseFloat(v); }, getPropertyValue: function (k) { return this.vars[k] || ''; } },
      get scrollWidth() { return total(); },
      // como o browser: o scroll nunca passa do fim (se a fila encolhe, o scroll encolhe com ela)
      get scrollLeft() { return Math.min(scroll, Math.max(0, total() - CW)); },
      set scrollLeft(v) { const max = Math.max(0, total() - CW); const novo = Math.min(Math.max(0, v), max); if (novo !== scroll) { scroll = novo; pendente = true; } },
      getBoundingClientRect: function () { return { left: ESQ, right: ESQ + CW }; },
      closest: function () { return wrap; },
      querySelectorAll: function () { return botoes; },
      addEventListener: function (ev, fn) { if (ev === 'scroll') ouvintes.push(fn); },
      // Como o browser: o alvo é limitado ao máximo do momento da chamada e a animação passa por vários passos, cada um com o seu
      // evento "scroll" (que muda os espaçadores das pontas, e com eles o máximo).
      scrollTo: function (o) {
        chamadasScrollTo.push(o);
        const alvo = Math.min(Math.max(0, o.left), Math.max(0, total() - CW));
        if (o.behavior !== 'smooth') { this.scrollLeft = alvo; return; }
        const ini = this.scrollLeft;
        [0.25, 0.5, 0.75, 1].forEach(function (f) { fila.scrollLeft = ini + (alvo - ini) * f; fila.dispararScroll(); });
      },
      // o browser dispara o evento "scroll" depois; aqui só quando o teste manda
      dispararScroll: function () { if (!pendente) return; pendente = false; ouvintes.slice().forEach(function (f) { f(); }); },
      // a posição do botão "acao" relativamente à janela livre: espaço até às setas visíveis
      janela: function () { return { esq: oculto.esq ? ESQ : ESQ + 44, dir: oculto.dir ? ESQ + CW : ESQ + CW - 44 }; },
      botao: function (acao) { return botoes.filter(function (b) { return b.acao === acao; })[0]; },
      inteiro: function (acao) { const j = fila.janela(), r = fila.botao(acao).getBoundingClientRect(); return r.left >= j.esq - 0.5 && r.right <= j.dir + 0.5; },
      folgaDireita: function (acao) { const j = fila.janela(), r = fila.botao(acao).getBoundingClientRect(); return j.dir - r.right; }
    };
    return fila;
  }

  // O mesmo que renderVinha/renderAdega/renderFestaHub fazem: construirFilaPastilhas (que vê a fila antiga) -> substitui -> configurar.
  function desenhar(A, ecra, layout, opcoes) {
    const id = ID_FILA[ecra];
    A.ev('construirFilaPastilhas(' + JSON.stringify(id) + ', "", "k")');
    const fila = criarFila(A, id, layout, opcoes);
    A.filas[id] = fila;
    A.ev('configurarFilaPastilhas(' + JSON.stringify(id) + ')');
    return fila;
  }
  // Abrir o ecrã: goTo() chama filaPrepararAbertura(ecra) e depois desenha; o frame seguinte faz o deslize.
  function abrir(A, ecra, layout, objetivos, opcoes) {
    A.objetivos(objetivos || []);
    A.ev('filaPrepararAbertura(' + JSON.stringify(ecra) + ')');
    const fila = desenhar(A, ecra, layout, opcoes);
    const inicial = fila.scrollLeft;
    A.flushRaf();
    const setaEsqAntesDoEvento = fila.oculto.esq; // o browser só dispara o evento "scroll" depois
    fila.dispararScroll();
    return { fila: fila, inicial: inicial, desliza: fila.chamadasScrollTo.length, setaEsqAntesDoEvento: setaEsqAntesDoEvento };
  }
  const objDe = function (id) { return { id: id, cumprido: false }; };

  // ---------------- N. A regra pura do passo ----------------
  {
    const A = abrirAmbiente();
    const p = function (le, ld, be, bd) { return A.ev('filaPassoParaMostrar(' + [le, ld, be, bd].join(',') + ')'); };
    ok(p(0, 300, 10, 100) === 0 && p(0, 300, 0, 300) === 0 && p(0, 300, -0.4, 299.6) === 0, 'passo: botão inteiro dentro da janela (e dentro de 0,5 px) = 0');
    ok(p(0, 300, 250, 350) === 58, 'passo: cortado à direita = quanto falta mais a folga de 8 px (58)');
    ok(p(0, 300, 400, 480) === 188, 'passo: todo fora, à direita');
    ok(p(50, 300, 20, 90) === -38, 'passo: cortado à esquerda = negativo, com a folga');
    ok(p(0, 300, 0, 400) === null && p(0, 100, 0, 101) === null, 'passo: botão mais largo do que a janela = null (não se mexe)');
    ok(p(0, 100, 0, 100) === 0, 'passo: botão com a largura exata da janela cabe');
  }

  // ---------------- A/B. Quando desliza ----------------
  {
    // Adega sem lote, Fortificar (escondido)
    let A = abrirAmbiente();
    let r = abrir(A, 'garrafa', LAYOUTS.adegaSemLote, ['adega_fortificar']);
    ok(r.inicial === 0 && !r.fila.inteiro('fortificar') === false, 'Adega sem lote: Fortificar acaba inteiro à vista');
    ok(r.desliza === 1 && r.fila.chamadasScrollTo[0].behavior === 'smooth' && r.fila.chamadasScrollTo[0].left > 0, 'Adega sem lote + objetivo Fortificar: a fila desliza (uma vez, com animação)');
    ok(r.fila.oculto.esq === false && r.fila.inteiro('fortificar'), 'depois de deslizar a seta da esquerda aparece e o botão está inteiro à vista (fora das setas)');
    ok(r.fila.folgaDireita('fortificar') >= 8, 'o botão não fica colado à borda (folga de pelo menos 8 px, deu ' + r.fila.folgaDireita('fortificar') + ')');
    // Adega com lote pronto, Engarrafar
    A = abrirAmbiente(); r = abrir(A, 'garrafa', LAYOUTS.adegaLotePronto, ['adega_engarrafar']);
    ok(r.desliza === 1 && r.fila.inteiro('engarrafar'), 'Adega com lote pronto + objetivo Engarrafar: desliza e o botão fica inteiro');
    // Prensar já visível: não mexe
    A = abrirAmbiente(); r = abrir(A, 'garrafa', LAYOUTS.adegaSemLote, ['adega_prensar']);
    ok(r.desliza === 0 && r.fila.scrollLeft === 0 && r.fila.oculto.esq === true, 'Adega + objetivo Prensar (já à vista): a fila não mexe');
    // Alambique: Destilar vinho visível, bagaço cortado -> não mexe; vinho apagado -> desliza para o bagaço
    A = abrirAmbiente(); r = abrir(A, 'garrafa', LAYOUTS.adegaSemLote, ['adega_alambique']);
    ok(r.desliza === 0, 'Alambique: com Destilar vinho à vista (o objetivo serve com qualquer dos dois) a fila não mexe');
    A = abrirAmbiente(); r = abrir(A, 'garrafa', LAYOUTS.adegaSemLote, ['adega_alambique'], { desativados: ['destilarVinho'] });
    ok(r.desliza === 1 && r.fila.inteiro('destilarBagaco'), 'Alambique: com Destilar vinho apagado desliza até Destilar bagaço (um botão apagado não conta)');
    A = abrirAmbiente(); r = abrir(A, 'garrafa', LAYOUTS.adegaSemLote, ['adega_alambique'], { desativados: ['destilarVinho', 'destilarBagaco'] });
    ok(r.desliza === 0, 'Alambique com os dois botões apagados: não mexe');
    // Sem objetivo para este ecrã
    [['nenhum objetivo', []], ['objetivo cumprido', [{ id: 'adega_fortificar', cumprido: true }]], ['objetivo de outro ecrã (Vinha)', ['vinha_regar']], ['Proteger', ['proteger_vencer']], ['Explorar', ['explorar_descobrir']], ['id desconhecido', ['xpto']]].forEach(function (c) {
      A = abrirAmbiente(); r = abrir(A, 'garrafa', LAYOUTS.adegaSemLote, c[1]);
      ok(r.desliza === 0 && r.fila.scrollLeft === 0, 'Adega sem objetivo para o ecrã (' + c[0] + '): a fila fica como hoje');
    });
    // Objetivos de outro dia
    A = abrirAmbiente(); A.objetivos(['adega_fortificar'], '2026-10-09'); A.ev('filaPrepararAbertura("garrafa")'); let f = desenhar(A, 'garrafa', LAYOUTS.adegaSemLote); A.flushRaf();
    ok(f.chamadasScrollTo.length === 0, 'objetivos de ontem (jogo aberto a passar da meia-noite): não contam');
    A = abrirAmbiente(); A.objetivos(['adega_fortificar'], '2026-10-11'); A.ev('filaPrepararAbertura("garrafa")'); f = desenhar(A, 'garrafa', LAYOUTS.adegaSemLote); A.flushRaf();
    ok(f.chamadasScrollTo.length === 1, 'data do aparelho atrás (dia guardado 1 dia à frente): os objetivos ainda contam');
    A = abrirAmbiente(); A.state.objetivos = null; A.ev('filaPrepararAbertura("garrafa")'); f = desenhar(A, 'garrafa', LAYOUTS.adegaSemLote); A.flushRaf();
    ok(f.chamadasScrollTo.length === 0, 'estado dos objetivos em falta: não rebenta nem desliza');
    A = abrirAmbiente(); A.state.objetivos = { dia: HOJE, lista: 'x' }; A.ev('filaPrepararAbertura("garrafa")'); f = desenhar(A, 'garrafa', LAYOUTS.adegaSemLote); A.flushRaf();
    ok(f.chamadasScrollTo.length === 0, 'lista de objetivos inválida: não rebenta nem desliza');

    // Vinha
    A = abrirAmbiente(); r = abrir(A, 'vinha', LAYOUTS.vinhaPronta, ['vinha_compostagem']);
    ok(r.desliza === 1 && r.fila.inteiro('compostagem'), 'Vinha pronta + Compostar (escondido): desliza e fica inteiro');
    A = abrirAmbiente(); r = abrir(A, 'vinha', LAYOUTS.vinhaPronta, ['vinha_colher']);
    ok(r.desliza === 0 && r.fila.scrollLeft === 0, 'Colher (outono) é mais largo do que a janela livre da fila (272 px, o máximo do CSS): nunca ficaria inteiro, por isso não mexe');
    A = abrirAmbiente(); r = abrir(A, 'vinha', LAYOUTS.vinhaPreparadaVento, ['vinha_compostagem']);
    ok(r.desliza === 1 && r.fila.inteiro('compostagem'), 'Compostar tapado pela seta (sob a seta): desliza até ficar inteiro');
    A = abrirAmbiente(); r = abrir(A, 'vinha', LAYOUTS.vinhaCrescendoVento, ['tempo_vento']);
    ok(r.desliza === 1 && r.fila.inteiro('repararEstacas'), 'Estacas (vento): desliza e fica inteiro');
    A = abrirAmbiente(); r = abrir(A, 'vinha', LAYOUTS.vinhaCrescendoFrio, ['tempo_frio']);
    ok(r.desliza === 1 && r.fila.inteiro('protegerFrio'), 'Frio: desliza e fica inteiro');
    A = abrirAmbiente(); r = abrir(A, 'vinha', LAYOUTS.vinhaCrescendoChuva, ['tempo_vigiar']);
    ok(r.desliza === 1 && r.fila.inteiro('vigiar'), 'Vigiar a vinha: desliza e fica inteiro');
    A = abrirAmbiente(); r = abrir(A, 'vinha', LAYOUTS.vinhaCrescendoChuva, ['tempo_chuva']);
    ok(r.desliza === 0, 'tempo_chuva é o Regar, que já está à vista: não mexe');
    A = abrirAmbiente(); r = abrir(A, 'vinha', LAYOUTS.vinhaCrescendoChuva, ['vinha_regar', 'vinha_adubar']);
    ok(r.desliza === 0, 'Regar e Adubar (à vista): não mexe');
    A = abrirAmbiente(); r = abrir(A, 'vinha', LAYOUTS.vinhaCrescendoVento, ['vinha_regar', 'tempo_vento']);
    ok(r.desliza === 1 && r.fila.inteiro('repararEstacas'), 'dois objetivos (Regar à vista, Estacas escondido): desliza para o que está escondido');
    A = abrirAmbiente(); r = abrir(A, 'vinha', LAYOUTS.vinhaCrescendoVento, [{ id: 'tempo_vento', cumprido: true }, 'vinha_regar']);
    ok(r.desliza === 0, 'o objetivo das Estacas já cumprido não conta (fica o do Regar, à vista)');
    A = abrirAmbiente(); r = abrir(A, 'vinha', LAYOUTS.vinhaCrescendoVento, ['vinha_cavar']);
    ok(r.desliza === 0, 'objetivo cujo botão nem está na fila (Cavar com a vinha a crescer): não mexe');

    A = abrirAmbiente(); r = abrir(A, 'vinha', LAYOUTS.vinhaCrescendoVento, ['vinha_cavar', 'tempo_vento']);
    ok(r.desliza === 1 && r.fila.inteiro('repararEstacas'), 'o 1.º objetivo não tem botão nesta fila (Cavar): passa ao seguinte (Estacas, escondido) e desliza');
    A = abrirAmbiente(); r = abrir(A, 'garrafa', LAYOUTS.adegaBotaoLargo, ['adega_fortificar']);
    ok(r.desliza === 0 && r.fila.scrollLeft === 0, 'botão tão largo que as setas o taparam em qualquer posição: não desliza (só desliza se o botão ficar mesmo inteiro)');

    // Festa: as tarefas por fazer
    A = abrirAmbiente(); r = abrir(A, 'festa', LAYOUTS.festa, ['festa_tarefa']);
    ok(r.desliza === 0, 'Festa com as 3 tarefas por fazer (as 2 primeiras à vista): não mexe');
    A = abrirAmbiente(); r = abrir(A, 'festa', LAYOUTS.festa, ['festa_tarefa'], { desativados: ['castanhas', 'jeropiga'] });
    ok(r.desliza === 1 && r.fila.inteiro('prova'), 'Festa com só a 3.ª tarefa por fazer (escondida): desliza e fica inteira');
    A = abrirAmbiente(); r = abrir(A, 'festa', LAYOUTS.festa, ['festa_tarefa'], { desativados: ['castanhas', 'jeropiga', 'prova'] });
    ok(r.desliza === 0, 'Festa com as 3 tarefas já feitas: não mexe');
    A = abrirAmbiente(); r = abrir(A, 'festa', LAYOUTS.festa, ['festa_tarefa'], { desativados: ['castanhas'] });
    ok(r.desliza === 0, 'Festa com a 1.ª feita e a 2.ª à vista: não mexe');
    // ecrã com a fila ainda sem tamanho (escondido): não mede nada
    A = abrirAmbiente(); r = abrir(A, 'garrafa', LAYOUTS.adegaSemLote, ['adega_fortificar'], { larguraZero: true });
    ok(r.desliza === 0, 'fila sem tamanho (ecrã escondido): não desliza');
  }

  // ---------------- C. Redesenhos: a posição que o jogador deixou ----------------
  {
    let A = abrirAmbiente();
    let r = abrir(A, 'garrafa', LAYOUTS.adegaSemLote, ['adega_fortificar']);
    const destino = r.fila.scrollLeft;
    ok(destino > 0, 'premissa: a fila deslizou');
    // o jogador carrega num botão: o ecrã redesenha-se
    let nova = desenhar(A, 'garrafa', LAYOUTS.adegaSemLote);
    A.flushRaf(); nova.dispararScroll();
    ok(nova.scrollLeft === destino && nova.chamadasScrollTo.length === 0, 'depois de um clique/redesenho a fila fica onde estava (não volta ao princípio nem desliza outra vez) ' + nova.scrollLeft + ' vs ' + destino);
    ok(nova.oculto.esq === false, 'e a seta da esquerda continua à vista');
    // o jogador volta ao princípio à mão e o ecrã redesenha-se: fica no princípio
    nova.scrollLeft = 0; nova.dispararScroll();
    let n2 = desenhar(A, 'garrafa', LAYOUTS.adegaSemLote); A.flushRaf(); n2.dispararScroll();
    ok(n2.scrollLeft === 0 && n2.chamadasScrollTo.length === 0, 'se o jogador deixou a fila no princípio, o redesenho NÃO a manda deslizar outra vez');
    // posição a meio
    n2.scrollLeft = 120; n2.dispararScroll();
    let n3 = desenhar(A, 'garrafa', LAYOUTS.adegaSemLote); A.flushRaf();
    ok(n3.scrollLeft === 120 && n3.chamadasScrollTo.length === 0, 'posição a meio mantém-se no redesenho (120 px)');
    // voltar de uma tarefa da Festa: a fila nem existia no ecrã (o contentor tinha o resultado da tarefa)
    n3.scrollLeft = 90; n3.dispararScroll();
    A.filas[ID_FILA.garrafa] = null;
    let n4 = desenhar(A, 'garrafa', LAYOUTS.adegaSemLote); A.flushRaf();
    ok(n4.scrollLeft === 90, 'quando a fila antiga já não está no ecrã (ex.: voltar de uma tarefa da Festa) usa a última posição guardada (90 px)');
    // a fila antiga está escondida (largura 0, scrollLeft a 0): não estraga a posição guardada
    n4.scrollLeft = 60; n4.dispararScroll();
    A.filas[ID_FILA.garrafa].clientWidth = 0; A.filas[ID_FILA.garrafa].scrollLeft; // escondida
    A.filas[ID_FILA.garrafa]._lido = 0;
    const escondida = A.filas[ID_FILA.garrafa];
    Object.defineProperty(escondida, 'scrollLeft', { get: function () { return 0; }, set: function () {} });
    let n5 = desenhar(A, 'garrafa', LAYOUTS.adegaSemLote); A.flushRaf();
    ok(n5.scrollLeft === 60, 'uma fila antiga escondida (largura 0) não apaga a posição guardada (60 px)');
    // dois redesenhos seguidos antes do frame: o 2.º não guarda a posição "0" da fila acabada de desenhar
    n5.scrollLeft = 75; n5.dispararScroll();
    desenhar(A, 'garrafa', LAYOUTS.adegaSemLote);
    let n6 = desenhar(A, 'garrafa', LAYOUTS.adegaSemLote); A.flushRaf();
    ok(n6.scrollLeft === 75, 'dois redesenhos seguidos (antes do frame) não perdem a posição do jogador (75 px)');
    // abrir o ecrã outra vez: esquece a posição e desliza de novo, a partir do princípio
    let B = abrirAmbiente();
    const primeira = abrir(B, 'garrafa', LAYOUTS.adegaSemLote, ['adega_fortificar']);
    primeira.fila.scrollLeft = 30; primeira.fila.dispararScroll();
    B.ev('filaPrepararAbertura("garrafa")');
    const reaberta = desenhar(B, 'garrafa', LAYOUTS.adegaSemLote);
    ok(reaberta.scrollLeft === 0, 'ao abrir o ecrã outra vez a fila recomeça do princípio (não herda a posição da visita anterior)');
    B.flushRaf(); reaberta.dispararScroll();
    ok(reaberta.chamadasScrollTo.length === 1 && reaberta.inteiro('fortificar'), 'ao abrir o ecrã outra vez desliza de novo ao objetivo');
    // reabrir sem nada para mostrar: o redesenho seguinte não repõe uma posição velha da visita anterior
    let E = abrirAmbiente();
    const v1 = abrir(E, 'garrafa', LAYOUTS.adegaSemLote, ['adega_fortificar']);
    v1.fila.scrollLeft = 120; v1.fila.dispararScroll();
    E.objetivos([]); E.ev('filaPrepararAbertura("garrafa")');
    const v2 = desenhar(E, 'garrafa', LAYOUTS.adegaSemLote); E.flushRaf(); v2.dispararScroll();
    E.filas[ID_FILA.garrafa] = null; // (como ao voltar de uma tarefa: a fila antiga já não está no ecrã e não se lê a sua posição)
    const v3 = desenhar(E, 'garrafa', LAYOUTS.adegaSemLote); E.flushRaf(); v3.dispararScroll();
    ok(v2.scrollLeft === 0 && v3.scrollLeft === 0, 'ecrã reaberto sem objetivo: a fila fica no princípio, e o redesenho seguinte não lhe repõe a posição da visita anterior (120 px)');
    // o objetivo cumprido antes do redesenho não faz deslizar nada ao abrir
    let C = abrirAmbiente();
    const c1 = abrir(C, 'garrafa', LAYOUTS.adegaSemLote, [{ id: 'adega_fortificar', cumprido: true }]);
    ok(c1.desliza === 0, 'objetivo cumprido ao abrir: não desliza');
    // só a fila do ecrã aberto desliza
    let D = abrirAmbiente(); D.objetivos(['adega_fortificar', 'vinha_compostagem']);
    D.ev('filaPrepararAbertura("garrafa")');
    const fa = desenhar(D, 'garrafa', LAYOUTS.adegaSemLote);
    const fv = desenhar(D, 'vinha', LAYOUTS.vinhaPronta); // um redesenho da Vinha (ex.: o relógio) com a Adega a abrir
    D.flushRaf();
    ok(fa.chamadasScrollTo.length === 1 && fv.chamadasScrollTo.length === 0, 'só a fila do ecrã que abriu desliza (a Vinha, que só se redesenhou, não)');
  }

  // ---------------- D. Reduzir movimento ----------------
  {
    const A = abrirAmbiente({ reduzido: true });
    const r = abrir(A, 'garrafa', LAYOUTS.adegaSemLote, ['adega_fortificar']);
    ok(r.fila.scrollLeft > 0 && r.fila.chamadasScrollTo.length === 0 && r.fila.inteiro('fortificar'), '"reduzir movimento": a fila salta para o botão, sem animação (sem scrollTo suave)');
    ok(r.fila.oculto.esq === false && r.setaEsqAntesDoEvento === false, '"reduzir movimento": a seta da esquerda aparece logo, sem esperar pelo evento de scroll');
    const B = abrirAmbiente({ reduzido: false });
    const s = abrir(B, 'garrafa', LAYOUTS.adegaSemLote, ['adega_fortificar']);
    ok(s.fila.chamadasScrollTo.length === 1 && s.fila.chamadasScrollTo[0].behavior === 'smooth', 'sem "reduzir movimento": desliza com animação');
  }

  // ---------------- E. O mapa, os botões e o gancho ----------------
  {
    const A = abrirAmbiente();
    const mapa = A.json('OBJETIVO_BOTOES_POR_ECRA');
    const esperado = {
      vinha: { vinha_cavar: ['cavar'], vinha_plantar: ['plantar'], vinha_ervas: ['ervas'], vinha_regar: ['regar'], vinha_adubar: ['adubar'], vinha_compostagem: ['compostagem'], vinha_colher: ['colher'], tempo_chuva: ['regar'], tempo_vento: ['repararEstacas'], tempo_frio: ['protegerFrio'], tempo_vigiar: ['vigiar'] },
      garrafa: { adega_prensar: ['prensar'], adega_alambique: ['destilarVinho', 'destilarBagaco'], adega_fortificar: ['fortificar'], adega_engarrafar: ['engarrafar'] },
      festa: { festa_tarefa: ['*'] }
    };
    ok(JSON.stringify(mapa) === JSON.stringify(esperado), 'o mapa objetivo -> botão é o do estudo');
    // cada objetivo do jogo está no mapa, ou é de um ecrã sem fila
    const obj = fontes['objetivos.js'];
    const ids = {};
    (obj.match(/id: '([a-z_]+)'/g) || []).forEach(function (m) { ids[m.slice(5, -1)] = true; });
    (obj.match(/lista\.push\('([a-z_]+)'\)/g) || []).forEach(function (m) { ids[m.slice(12, -2)] = true; });
    const noMapa = {}; Object.keys(esperado).forEach(function (e) { Object.keys(esperado[e]).forEach(function (k) { noMapa[k] = true; }); });
    const semFila = ['proteger_vencer', 'explorar_descobrir'];
    const faltam = Object.keys(ids).filter(function (k) { return !noMapa[k] && semFila.indexOf(k) === -1 && /^(vinha|adega|tempo|festa|proteger|explorar)_/.test(k); });
    ok(faltam.length === 0 && Object.keys(ids).length >= 17, 'todos os objetivos do jogo estão no mapa ou são de um ecrã sem fila (faltam: ' + faltam.join(', ') + '; encontrados ' + Object.keys(ids).length + ')');
    // cada botão do mapa existe nos ficheiros que os desenham, com data-acao
    const vinha = fontes['vinha.js'], garrafa = fontes['garrafa.js'], festas = fontes['festas.js'];
    Object.keys(esperado.vinha).forEach(function (k) { esperado.vinha[k].forEach(function (a) { ok(new RegExp("botaoVinha\\('" + a + "'").test(vinha), 'vinha.js desenha o botão ' + a); }); });
    Object.keys(esperado.garrafa).forEach(function (k) { esperado.garrafa[k].forEach(function (a) { ok(new RegExp("botaoAdega\\('" + a + "'").test(garrafa), 'garrafa.js desenha o botão ' + a); }); });
    ok(/<button class="btn-pill" data-acao="' \+ actionKey \+ '"/.test(vinha), 'botaoVinha põe o data-acao no botão');
    ok(/<button class="btn-pill" data-acao="' \+ acao \+ '"/.test(garrafa), 'botaoAdega põe o data-acao no botão');
    ok(/<button class="btn-pill" data-acao="' \+ tarefa \+ '"/.test(festas), 'botaoFesta põe o data-acao no botão');
    // o gancho no goTo(), antes de desenhar os ecrãs
    const main = fontes['main.js'];
    const g = main.indexOf('filaPrepararAbertura(screen);'), e = main.indexOf("if (screen === 'vinha') enterVinha();");
    ok(g !== -1 && e !== -1 && g < e, 'goTo() chama filaPrepararAbertura(screen) antes de desenhar os ecrãs');
    ok((main.match(/function filaPrepararAbertura\(/g) || []).length === 1 && (main.match(/\n\s+filaPrepararAbertura\(screen\);/g) || []).length === 1, 'filaPrepararAbertura é definida uma vez e só é chamada no goTo');
    ok(/construirFilaPastilhas\('vinha-pill-scroll'/.test(vinha) && /construirFilaPastilhas\('adega-pill-scroll'/.test(garrafa) && /construirFilaPastilhas\('festa-pill-scroll'/.test(festas), 'as 3 filas continuam a usar o construirFilaPastilhas');
    // pura: não altera o estado e devolve cópias
    A.objetivos(['vinha_regar', { id: 'vinha_cavar', cumprido: true }, 'tempo_vento']);
    const antes = JSON.stringify(A.state);
    const p = A.json("objetivosBotoesDoEcra(state, 'vinha', '" + HOJE + "')");
    ok(JSON.stringify(A.state) === antes && JSON.stringify(p) === JSON.stringify([{ id: 'vinha_regar', acoes: ['regar'] }, { id: 'tempo_vento', acoes: ['repararEstacas'] }]), 'objetivosBotoesDoEcra só lê (o estado fica igual) e dá os pendentes por ordem');
    A.ev("objetivosBotoesDoEcra(state, 'vinha', '" + HOJE + "')[0].acoes.push('x')");
    ok(A.json('OBJETIVO_BOTOES_POR_ECRA.vinha.vinha_regar').length === 1, 'o resultado são cópias (mexer nelas não estraga o mapa)');
    ok(A.json("objetivosBotoesDoEcra(state, 'proteger', '" + HOJE + "')").length === 0 && A.json("objetivosBotoesDoEcra(state, 'vinha', 'lixo')").length === 0 && A.json("objetivosBotoesDoEcra(null, 'vinha', '" + HOJE + "')").length === 0, 'ecrã sem fila, dia inválido ou estado null: lista vazia');
  }

  return falhas;
}

const falhas = suite(FONTES);

function mutar(ficheiro, de, para) {
  if (FONTES[ficheiro].indexOf(de) === -1) { falhas.push('mutação impossível (texto não encontrado em ' + ficheiro + '): ' + de); return null; }
  const f = Object.assign({}, FONTES);
  f[ficheiro] = FONTES[ficheiro].split(de).join(para);
  return f;
}
const MUTACOES = [
  ['nunca desliza', 'main.js', 'if (filaDeslizarParaBotao(fila, alvos[0])) return true;', 'if (false) return true;'],
  ['conta objetivos já cumpridos', 'objetivos.js', 'if (!x || x.cumprido === true || !Object.prototype', 'if (!x || !Object.prototype'],
  ['conta objetivos de outro dia', 'objetivos.js', 'if (diaLisboaPartes(hoje) === null || diaLisboaMudou(hoje, o.dia)) return [];', 'if (diaLisboaPartes(hoje) === null) return [];'],
  ['Alambique sem o Destilar bagaço', 'objetivos.js', "adega_alambique: ['destilarVinho', 'destilarBagaco']", "adega_alambique: ['destilarVinho']"],
  ['Fortificar aponta para o Prensar', 'objetivos.js', "adega_fortificar: ['fortificar']", "adega_fortificar: ['prensar']"],
  ['tempo_chuva aponta para o Cavar', 'objetivos.js', "tempo_chuva: ['regar']", "tempo_chuva: ['cavar']"],
  ['botões apagados contam como alvo', 'main.js', 'return !b.disabled && acao !== null', 'return acao !== null'],
  ['a posição do jogador não é reposta', 'main.js', 'filaPosicionarSemAnimar(fila, FILA_PASTILHAS_POSICAO[idContentor]);', ''],
  ['a posição não é guardada ao deslizar à mão', 'main.js', 'FILA_PASTILHAS_POSICAO[idContentor] = fila.scrollLeft; // a posição que o jogador deixou', ''],
  ['o redesenho volta a deslizar (o deslize nunca fica gasto)', 'main.js', '      FILAS_PARA_ABRIR.delete(idContentor);\n      filaDeslizarAoObjetivo(fila);', '      filaDeslizarAoObjetivo(fila);'],
  ['ao abrir não esquece as posições', 'main.js', "Object.keys(FILA_PASTILHAS_POSICAO).forEach(function (k) { delete FILA_PASTILHAS_POSICAO[k]; });", ''],
  ['ao abrir não marca a fila para deslizar', 'main.js', 'if (FILA_ECRA_POR_ID[id] === ecra) FILAS_PARA_ABRIR.add(id);', ''],
  ['marca todas as filas ao abrir um ecrã', 'main.js', 'if (FILA_ECRA_POR_ID[id] === ecra) FILAS_PARA_ABRIR.add(id);', 'FILAS_PARA_ABRIR.add(id);'],
  ['guarda a posição da fila da visita anterior', 'main.js', 'if (FILAS_PARA_ABRIR.has(idContentor)) return;\n  const velha', 'const velha'],
  ['guarda a posição de uma fila escondida', 'main.js', 'if (velha && !velha._filaPendente && velha.clientWidth > 0) FILA_PASTILHAS_POSICAO', 'if (velha && !velha._filaPendente) FILA_PASTILHAS_POSICAO'],
  ['guarda a posição de uma fila ainda por ajustar', 'main.js', 'if (velha && !velha._filaPendente && velha.clientWidth > 0) FILA_PASTILHAS_POSICAO', 'if (velha && velha.clientWidth > 0) FILA_PASTILHAS_POSICAO'],
  ['ignora "reduzir movimento"', 'main.js', 'if (filaMovimentoReduzido()) {', 'if (false) {'],
  ['deslizar sem animação', 'main.js', "fila.scrollTo({ left: alvo, behavior: 'smooth' });", "fila.scrollTo({ left: alvo, behavior: 'instant' });"],
  ['não prepara os espaçadores antes de deslizar', 'main.js', '  filaPrepararMargens(fila);\n  // No fim', '  // No fim'],
  ['ignora a seta da direita', 'main.js', "if (setaDir && !setaDir.classList.contains('oculto')) dir = Math.min(dir, setaDir.getBoundingClientRect().left);", ''],
  ['ignora a seta da esquerda', 'main.js', "if (setaEsq && !setaEsq.classList.contains('oculto')) esq = Math.max(esq, setaEsq.getBoundingClientRect().right);", ''],
  ['sem folga ao deslizar', 'main.js', 'return btnDir - limDir + FILA_FOLGA_PX;', 'return btnDir - limDir;'],
  ['botão mais largo do que a fila também desliza', 'main.js', 'if (btnDir - btnEsq > limDir - limEsq) return null;', ''],
  ['desliza mesmo que o botão não fique inteiro', 'main.js', 'if (!inteiro || destino === original) return false;', 'if (destino === original) return false;'],
  ['desliza mesmo sem tamanho', 'main.js', 'if (!fila || !(fila.clientWidth > 0)) return false;', 'if (!fila) return false;'],
  ['deslize antes do ecrã estar desenhado (sem esperar pelo frame)', 'main.js', '  fila._filaPendente = true;\n  filaAgendarAjuste(idContentor);', '  if (FILAS_PARA_ABRIR.has(idContentor)) { FILAS_PARA_ABRIR.delete(idContentor); filaDeslizarAoObjetivo(fila); }'],
  ['só tenta o primeiro objetivo', 'main.js', 'if (alvos.length === 0) continue;', 'if (alvos.length === 0) return false;'],
  ['a seta não é atualizada depois de deslizar', 'main.js', "  atualizarSetasDaFila(id);\n  return true;\n}", '  return true;\n}'],
  ['o botão da Vinha perde o data-acao', 'vinha.js', "'<button class=\"btn-pill\" data-acao=\"' + actionKey + '\" '", "'<button class=\"btn-pill\" '"],
  ['o botão da Adega perde o data-acao', 'garrafa.js', "'<button class=\"btn-pill\" data-acao=\"' + acao + '\" '", "'<button class=\"btn-pill\" '"],
  ['o botão da Festa perde o data-acao', 'festas.js', "'<button class=\"btn-pill\" data-acao=\"' + tarefa + '\" '", "'<button class=\"btn-pill\" '"],
  ['o goTo deixa de preparar a abertura', 'main.js', '  filaPrepararAbertura(screen); // a fila de botões', '  // a fila de botões']
];
MUTACOES.forEach(function (m) {
  const f = mutar(m[1], m[2], m[3]);
  if (!f) return;
  let apanhada;
  try { apanhada = suite(f).length > 0; } catch (e) { apanhada = true; }
  if (!apanhada) falhas.push('MUTAÇÃO NÃO APANHADA: ' + m[0]);
});

if (falhas.length) {
  falhas.forEach(function (m) { console.log('FALHA: ' + m); });
  console.log(falhas.length + ' falha(s)');
  process.exit(1);
}
console.log('OK (' + MUTACOES.length + ' mutações apanhadas)');
