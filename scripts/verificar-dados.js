#!/usr/bin/env node
// Validador genérico do CONTEÚDO do jogo (visitas, níveis, histórias, capítulos e objetivos), para
// as entradas de hoje e para as que um dia vierem da pasta dados/ (ver dados/LEIAME.md). Corre o
// state.js, o i18n.js, o niveis.js, o personagens.js, o historia.js, o capitulos.js, o objetivos.js e
// o visitas.js REAIS, mais o js/dados.js e os ficheiros de dados/ (como no index.html), num ambiente
// simulado (módulo vm; ver scripts/_jogo-vm.js), sem browser nem conta real, e só LÊ: não altera nada.
//
// FALHA (código 1) com erros a sério: ids repetidos ou com formato errado, falta uma língua, condição
// ou critério desconhecido, personagem que não existe, imagem ou som que não existem, limiares de
// nível fora de ordem, nível sem nome, história ou capítulo.
// AVISA (não falha) o que é só estilo: os caracteres < > & (podem partir os cartões que montam HTML
// sem escapar), dados pessoais ou segredos (emails, links, chat_id, workers.dev) e textos
// "[por escrever]". Nas entradas que vieram da pasta dados/ (as que o dadosAcrescentar() aceitou) os
// avisos de estilo são sempre falhas. Com --estrito valem como falhas também no conteúdo de origem.
//
// Uso: node scripts/verificar-dados.js [--estrito]
// JS_DIR=pasta  lê os js/ de outra pasta (uma cópia), para provar que os testes apanham o que se estraga.
// DADOS_DIR=pasta  lê os ficheiros de dados de outra pasta (uma cópia, com entradas de teste).
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { abrirJogo } = require('./_jogo-vm');

const RAIZ = path.join(__dirname, '..');
const JS_DIR = process.env.JS_DIR || path.join(RAIZ, 'js');
const DADOS_DIR = process.env.DADOS_DIR || path.join(RAIZ, 'dados');
const ESTRITO = process.argv.indexOf('--estrito') !== -1;
const LINGUAS = ['pt', 'en', 'es'];
const FORMATO_ID = /^[a-z0-9_]+$/;
const TIPOS_CRITERIO = ['numero', 'booleano', 'contarChaves', 'temChaves', 'contarLista', 'coresColecao', 'algumaEntrada'];
// Tipos de condição de uma visita (ver visitaCondicaoOk em js/visitas.js).
const TIPOS_CONDICAO_VISITA = ['estacao', 'fase', 'festa', 'garrafa', 'cave'];
const POR_ESCREVER = '[por escrever]';

const faltas = [];
const avisos = [];
function falta(onde, o) { faltas.push(onde + ': ' + o); }
function aviso(onde, o) { avisos.push(onde + ': ' + o); }
function temTexto(v) { return typeof v === 'string' && v.trim() !== ''; }

function carregarJogo() {
  const jogo = abrirJogo({ jsDir: JS_DIR, dadosDir: DADOS_DIR, explorar: true });
  // const de topo não ficam como propriedades do contexto: lêem-se por expressão (e copiam-se em JSON,
  // o que também tira as funções das entradas dos objetivos).
  return JSON.parse(jogo.ev(
    'JSON.stringify({ TRANSLATIONS: TRANSLATIONS, VISITAS: VISITAS, VISITAS_PERSONAGENS: VISITAS_PERSONAGENS,' +
    ' NIVEIS_CONFIG: NIVEIS_CONFIG, NIVEL_NECESSARIO_POR_ECRA: NIVEL_NECESSARIO_POR_ECRA,' +
    ' HISTORIA_INTRO: HISTORIA_INTRO, HISTORIA_NIVEIS: HISTORIA_NIVEIS,' +
    ' ENCICLOPEDIA: ENCYCLOPEDIA_ENTRIES,' +
    ' CAPITULOS_CONFIG: CAPITULOS_CONFIG, CAPITULOS_STRINGS: CAPITULOS_STRINGS, PERSONAGENS_CARAS: PERSONAGENS_CARAS,' +
    ' OBJETIVOS: { A: OBJETIVOS_POOL_A.map(function (o) { return { id: o.id, texto: o.texto }; }),' +
    ' B: OBJETIVOS_POOL_B.map(function (o) { return { id: o.id, texto: o.texto }; }),' +
    ' C: OBJETIVOS_GRUPO_C.map(function (o) { return { id: o.id, texto: o.texto }; }) },' +
    ' NOVAS: typeof DADOS_ACRESCENTADOS === "undefined" ? {} : DADOS_ACRESCENTADOS,' +
    ' ESTADO: defaultState() })'));
}

// Os valores possíveis de estação e de fase da videira vêm das tabelas de js/estacoes.js.
function tabelaDe(nome) {
  const src = fs.readFileSync(path.join(JS_DIR, 'estacoes.js'), 'utf8');
  const m = new RegExp('const ' + nome + ' = (\\[[^\\]]*\\])').exec(src);
  if (!m) throw new Error('js/estacoes.js sem a tabela ' + nome);
  return Array.from(new Set(vm.runInNewContext(m[1])));
}

// ----- Regras de estilo dos textos (avisos; com --estrito, falhas) -----
// entradaNova: a entrada que se está a ver veio de dados/ (então o estilo é sempre uma falha).
let entradaNova = false;
function estilo(onde, o) {
  if (ESTRITO || entradaNova) falta(onde, o); else aviso(onde, o);
}
function verTexto(onde, rotulo, texto) {
  if (typeof texto !== 'string') return;
  const local = onde + ' (' + rotulo + ')';
  const c = texto.match(/[<>&]/g);
  if (c) estilo(local, 'tem o caracter ' + Array.from(new Set(c)).join(' ') + ' (pode partir os cartões que montam HTML): "' + texto + '"');
  if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(texto)) estilo(local, 'parece ter um email: "' + texto + '"');
  if (/https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|pt|es|io|dev|app|me|xyz)\b/i.test(texto)) estilo(local, 'parece ter um link ou endereço: "' + texto + '"');
  if (/chat[_ -]?id/i.test(texto) || /\b\d{6,}\b/.test(texto)) estilo(local, 'parece ter um chat_id ou número comprido: "' + texto + '"');
  if (texto.indexOf(POR_ESCREVER) !== -1) aviso(local, 'ainda é "' + POR_ESCREVER + '"');
}

function main() {
  const J = carregarJogo();
  const tr = J.TRANSLATIONS;
  const ESTACOES = tabelaDe('ESTACAO_DO_MES');
  const FASES = tabelaDe('FASE_REAL_DO_MES');
  const resumo = [];
  function ehNova(tipo, id) { return ((J.NOVAS || {})[tipo] || []).some(function (x) { return x.id === id; }); }

  // Texto { pt, en, es } dentro da entrada: as 3 línguas, não vazias.
  function texto3(onde, rotulo, obj) {
    LINGUAS.forEach(function (l) {
      if (!obj || typeof obj !== 'object' || !temTexto(obj[l])) { falta(onde, 'falta ' + rotulo + ' em ' + l); return; }
      verTexto(onde, rotulo + ' ' + l, obj[l]);
    });
  }
  // Chave do js/i18n.js: as 3 línguas, não vazias.
  function chave3(onde, rotulo, k) {
    LINGUAS.forEach(function (l) {
      const v = tr[l] && tr[l][k];
      if (!temTexto(v)) { falta(onde, 'falta ' + rotulo + ' "' + k + '" em ' + l); return; }
      verTexto(onde, rotulo + ' ' + l, v);
    });
  }
  // Texto na entrada OU chave no i18n.js (como nas PRs 165 e 166).
  function texto3OuChave(onde, rotulo, texto, k) {
    if (texto) texto3(onde, rotulo, texto);
    else if (k) chave3(onde, rotulo, k);
    else falta(onde, 'falta ' + rotulo + ' (texto na entrada ou chave no i18n.js)');
  }
  function idsUnicos(tipo, ids) {
    const vistos = {};
    ids.forEach(function (id) {
      if (typeof id !== 'string' || !FORMATO_ID.test(id)) falta(tipo, 'o id "' + id + '" devia ter só a-z, 0-9 e _');
      if (vistos[id]) falta(tipo, 'o id "' + id + '" está repetido');
      vistos[id] = true;
    });
  }
  function existeEmDisco(onde, rotulo, caminho) {
    if (!temTexto(caminho) || !fs.existsSync(path.join(RAIZ, caminho))) falta(onde, 'o ' + rotulo + ' "' + caminho + '" não existe');
  }

  // ----- Personagens e visitas -----
  {
    idsUnicos('Personagens das visitas', J.VISITAS_PERSONAGENS.map(function (p) { return p.id; }));
    J.VISITAS_PERSONAGENS.forEach(function (p) {
      texto3('Personagem ' + p.id, 'o nome', p.nome);
      texto3('Personagem ' + p.id, 'o papel', p.papel);
    });
    idsUnicos('Visitas', J.VISITAS.map(function (v) { return v.id; }));
    const personagens = J.VISITAS_PERSONAGENS.map(function (p) { return p.id; });
    J.VISITAS.forEach(function (v) {
      const onde = 'Visita ' + v.id;
      entradaNova = ehNova('visitas', v.id);
      if (personagens.indexOf(v.personagem) === -1) falta(onde, 'a personagem "' + v.personagem + '" não existe em VISITAS_PERSONAGENS');
      if (!Number.isInteger(v.reputacao) || v.reputacao < 1 || v.reputacao > 3) falta(onde, 'a reputacao devia ser um inteiro de 1 a 3, é ' + v.reputacao);
      texto3(onde, 'o texto', v.texto);
      const c = v.condicao;
      if (c === null || c === undefined) return;
      if (typeof c !== 'object' || TIPOS_CONDICAO_VISITA.indexOf(c.tipo) === -1) {
        falta(onde, 'a condição "' + (c && c.tipo) + '" não é de um tipo conhecido (' + TIPOS_CONDICAO_VISITA.join(', ') + ')');
      } else if (c.tipo === 'estacao' && ESTACOES.indexOf(c.valor) === -1) {
        falta(onde, 'a estação "' + c.valor + '" não existe (' + ESTACOES.join(', ') + ')');
      } else if (c.tipo === 'fase') {
        if (!Array.isArray(c.valores) || c.valores.length === 0) falta(onde, 'a condição fase precisa de uma lista "valores"');
        else c.valores.forEach(function (f) { if (FASES.indexOf(f) === -1) falta(onde, 'a fase "' + f + '" não existe (' + FASES.join(', ') + ')'); });
      }
    });
    entradaNova = false;
    resumo.push(J.VISITAS.length + ' visitas');
  }

  // ----- Níveis -----
  const N = J.NIVEIS_CONFIG.length;
  {
    let anterior = null;
    J.NIVEIS_CONFIG.forEach(function (nivel, i) {
      const n = i + 1;
      const onde = 'Nível ' + n;
      entradaNova = ehNova('niveis', nivel.id);
      if (!Number.isInteger(nivel.min) || nivel.min < 0) falta(onde, 'o limiar (min) devia ser um inteiro >= 0, é ' + nivel.min);
      else if (n === 1 && nivel.min !== 0) falta(onde, 'o nível 1 devia começar em 0, começa em ' + nivel.min);
      else if (anterior !== null && nivel.min <= anterior) falta(onde, 'o limiar ' + nivel.min + ' devia ser maior que o do nível anterior (' + anterior + ')');
      if (Number.isInteger(nivel.min)) anterior = nivel.min;
      texto3OuChave(onde, 'o nome', nivel.nome, nivel.nomeKey);
      if (n >= 2) {
        const h = J.HISTORIA_NIVEIS[n];
        if (!Array.isArray(h) || h.length === 0) falta(onde, 'falta a história (entrada em HISTORIA_NIVEIS)');
      }
      if (!J.CAPITULOS_CONFIG.some(function (c) { return c.nivel === n; })) falta(onde, 'falta um capítulo em CAPITULOS_CONFIG');
    });
    entradaNova = false;
    Object.keys(J.NIVEL_NECESSARIO_POR_ECRA).forEach(function (ecra) {
      const v = J.NIVEL_NECESSARIO_POR_ECRA[ecra];
      if (!Number.isInteger(v) || v < 1 || v > N) falta('Ecrã ' + ecra, 'o nível necessário (' + v + ') devia ir de 1 a ' + N);
    });
    resumo.push(N + ' níveis');
  }

  // ----- Histórias -----
  {
    function falas(onde, lista) {
      if (!Array.isArray(lista)) { falta(onde, 'devia ser uma lista de falas'); return; }
      lista.forEach(function (fala, i) {
        const o = onde + ' (fala ' + (i + 1) + ')';
        texto3OuChave(o, 'o texto', fala.texto, fala.chave);
        if (fala.foto !== undefined) existeEmDisco(o, 'ficheiro da imagem (foto)', fala.foto);
        if (fala.som !== undefined) existeEmDisco(o, 'ficheiro do som', fala.som);
      });
    }
    falas('História da introdução', J.HISTORIA_INTRO);
    let total = 0;
    Object.keys(J.HISTORIA_NIVEIS).forEach(function (n) {
      if (!/^\d+$/.test(n) || Number(n) < 2) falta('História', 'a chave "' + n + '" devia ser um número de nível a partir do 2');
      else if (Number(n) > N) aviso('História do nível ' + n, 'não há nível ' + n + ' em NIVEIS_CONFIG (só ' + N + ')');
      entradaNova = ((J.NOVAS || {}).historias || []).some(function (h) { return String(h.nivel) === n; });
      falas('História do nível ' + n, J.HISTORIA_NIVEIS[n]);
      entradaNova = false;
      total += Array.isArray(J.HISTORIA_NIVEIS[n]) ? J.HISTORIA_NIVEIS[n].length : 0;
    });
    resumo.push(total + ' falas de história');
  }

  // ----- Enciclopédia (as histórias de js/explorar.js e as que vierem de dados/enciclopedia.js) -----
  {
    const E = J.ENCICLOPEDIA;
    LINGUAS.forEach(function (l) { if (!Array.isArray(E[l])) falta('Enciclopédia', 'falta a lista em ' + l); });
    if (LINGUAS.every(function (l) { return Array.isArray(E[l]); })) {
      // Os ids de hoje têm maiúsculas (ex.: vindimasMaisCedo) e continuam válidos; só os que vêm de dados/ têm de ser a-z, 0-9 e _.
      LINGUAS.forEach(function (l) {
        const vistos = {};
        E[l].forEach(function (e) {
          if (!temTexto(e.id)) falta('Enciclopédia (' + l + ')', 'uma entrada sem id');
          else if (vistos[e.id]) falta('Enciclopédia (' + l + ')', 'o id "' + e.id + '" está repetido');
          else if (ehNova('enciclopedia', e.id) && !FORMATO_ID.test(e.id)) falta('Enciclopédia (' + l + ')', 'o id "' + e.id + '" devia ter só a-z, 0-9 e _');
          vistos[e.id] = true;
        });
      });
      const idsPt = E.pt.map(function (e) { return e.id; });
      LINGUAS.slice(1).forEach(function (l) {
        if (E[l].map(function (e) { return e.id; }).join() !== idsPt.join()) falta('Enciclopédia', 'os ids de ' + l + ' (e a sua ordem) não são os mesmos de pt');
      });
      LINGUAS.forEach(function (l) {
        E[l].forEach(function (e) {
          const onde = 'Enciclopédia ' + e.id + ' (' + l + ')';
          entradaNova = ehNova('enciclopedia', e.id);
          if (!temTexto(e.titulo)) falta(onde, 'falta o título'); else verTexto(onde, 'título', e.titulo);
          if (!temTexto(e.texto)) falta(onde, 'falta o texto'); else verTexto(onde, 'texto', e.texto);
          if (e.nivelMinimo !== undefined && (!Number.isInteger(e.nivelMinimo) || e.nivelMinimo < 1)) falta(onde, 'o nivelMinimo devia ser um inteiro a partir do 1, é ' + e.nivelMinimo);
          if (entradaNova && !Number.isInteger(e.nivelMinimo)) falta(onde, 'uma entrada vinda de dados/ precisa de nivelMinimo');
          if (e.imagem !== undefined) {
            if (entradaNova && !/^assets\/[A-Za-z0-9_\-\/.]+$/.test(e.imagem)) falta(onde, 'a imagem "' + e.imagem + '" devia ser um caminho de assets/');
            existeEmDisco(onde, 'ficheiro da imagem', e.imagem);
          }
          if (e.meses !== undefined && (!Array.isArray(e.meses) || e.meses.length === 0 || !e.meses.every(function (n) { return Number.isInteger(n) && n >= 1 && n <= 12; }))) falta(onde, 'os meses deviam ser uma lista de números de 1 a 12');
          if (e.estacao !== undefined && ESTACOES.indexOf(e.estacao) === -1) falta(onde, 'a estação "' + e.estacao + '" não existe (' + ESTACOES.join(', ') + ')');
        });
      });
      // As opcionais têm de ser iguais nas 3 línguas (menos o título e o texto).
      E.pt.forEach(function (e, i) {
        LINGUAS.slice(1).forEach(function (l) {
          const o = E[l][i];
          if (!o) return;
          ['nivelMinimo', 'imagem', 'estacao', 'manual', 'meses'].forEach(function (k) {
            if (JSON.stringify(e[k]) !== JSON.stringify(o[k])) falta('Enciclopédia ' + e.id, 'o campo "' + k + '" devia ser igual em pt e ' + l);
          });
        });
      });
      entradaNova = false;
      resumo.push(E.pt.length + ' histórias da enciclopédia');
    }
  }

  // ----- Capítulos -----
  {
    idsUnicos('Capítulos', J.CAPITULOS_CONFIG.map(function (c) { return c.id; }));
    function caminhoNoEstado(caminho) {
      const partes = String(caminho).split('.');
      let v = J.ESTADO;
      for (let i = 0; i < partes.length; i++) {
        if (v === null || typeof v !== 'object' || !Object.prototype.hasOwnProperty.call(v, partes[i])) return { existe: false, primeiroOk: i > 0 };
        v = v[partes[i]];
      }
      return { existe: true };
    }
    J.CAPITULOS_CONFIG.forEach(function (c) {
      const onde = 'Capítulo ' + c.id;
      entradaNova = ehNova('capitulos', c.id);
      if (!Number.isInteger(c.nivel) || c.nivel < 1 || c.nivel > N) falta(onde, 'o nível (' + c.nivel + ') devia ir de 1 a ' + N);
      if (c.falante && !Object.prototype.hasOwnProperty.call(J.PERSONAGENS_CARAS, c.falante)) falta(onde, 'o falante "' + c.falante + '" não existe em PERSONAGENS_CARAS');
      LINGUAS.forEach(function (l) {
        const s = (J.CAPITULOS_STRINGS[l] || {})[c.id] || {};
        if (c.titulo) { /* validado abaixo */ } else if (!temTexto(s.titulo)) falta(onde, 'falta o título em ' + l);
        else verTexto(onde, 'título ' + l, s.titulo);
        if (c.objetivo) { /* validado abaixo */ } else if (!temTexto(s.objetivo)) falta(onde, 'falta o objetivo em ' + l);
        else verTexto(onde, 'objetivo ' + l, s.objetivo);
      });
      if (c.titulo) texto3(onde, 'o título', c.titulo);
      if (c.objetivo) texto3(onde, 'o objetivo', c.objetivo);
      texto3OuChave(onde, 'a conclusão', c.conclusao, 'capitulo.' + c.id + '.conclusao');
      if (!Array.isArray(c.criterio) || c.criterio.length === 0) { falta(onde, 'falta o critério (lista de alternativas)'); return; }
      c.criterio.forEach(function (a, i) {
        const o = onde + ' (critério ' + (i + 1) + ')';
        if (TIPOS_CRITERIO.indexOf(a.tipo) === -1) { falta(o, 'o tipo "' + a.tipo + '" não é conhecido (' + TIPOS_CRITERIO.join(', ') + ')'); return; }
        if (a.tipo !== 'coresColecao') {
          if (!temTexto(a.caminho)) falta(o, 'falta o caminho no estado');
          else {
            const r = caminhoNoEstado(a.caminho);
            if (!r.existe && !r.primeiroOk) falta(o, 'o caminho "' + a.caminho + '" não existe no estado inicial (nem o primeiro nome)');
            else if (!r.existe) aviso(o, 'o caminho "' + a.caminho + '" ainda não existe no estado inicial (só aparece depois, ao jogar)');
          }
        }
        if (a.tipo === 'temChaves') {
          if (!Array.isArray(a.chaves) || a.chaves.length === 0 || !a.chaves.every(temTexto)) falta(o, 'temChaves precisa de uma lista "chaves" de textos');
        } else if (a.tipo !== 'booleano') {
          if (!(typeof a.alvo === 'number' && a.alvo > 0) && a.alvo !== 'totalEnciclopedia') falta(o, 'falta o alvo (número maior que 0)');
        }
        if (a.tipo === 'algumaEntrada' && !temTexto(a.campo)) falta(o, 'algumaEntrada precisa do "campo"');
      });
    });
    entradaNova = false;
    resumo.push(J.CAPITULOS_CONFIG.length + ' capítulos');
  }

  // ----- Objetivos -----
  {
    const todos = J.OBJETIVOS.A.concat(J.OBJETIVOS.B).concat(J.OBJETIVOS.C);
    idsUnicos('Objetivos', todos.map(function (o) { return o.id; }));
    todos.forEach(function (o) { texto3OuChave('Objetivo ' + o.id, 'o texto', o.texto, 'objetivo.' + o.id); });
    resumo.push(todos.length + ' objetivos');
  }

  const deDados = Object.keys(J.NOVAS || {}).reduce(function (t, k) { return t + J.NOVAS[k].length; }, 0);
  resumo.push(deDados + ' entradas vindas de dados/');
  console.log('Verificado' + (ESTRITO ? ' (estrito)' : '') + ': ' + resumo.join(', '));
  if (avisos.length > 0) {
    console.log('Avisos (não falham' + ') ' + avisos.length + ':');
    avisos.forEach(function (a) { console.log(' - ' + a); });
  }
  if (faltas.length === 0) {
    console.log('OK');
    process.exit(0);
  }
  console.log('Falta:');
  faltas.forEach(function (f) { console.log(' - ' + f); });
  process.exit(1);
}

try {
  main();
} catch (e) {
  console.log('Erro ao ler o jogo: ' + e.message);
  process.exit(1);
}
