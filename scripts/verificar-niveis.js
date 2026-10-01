#!/usr/bin/env node
// Verifica, ANTES de cada PR, se falta texto, história ou capítulo para
// algum nível (e textos das conquistas). Só LÊ os ficheiros de js/ — corre-os
// num ambiente simulado (módulo vm), sem browser e sem alterar nada.
//
// Uso: node scripts/verificar-niveis.js
// Sai com código 0 se estiver tudo OK e 1 se faltar alguma coisa.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const LINGUAS = ['pt', 'en', 'es'];
// Ordem de carga como no index.html (só os ficheiros de que isto precisa).
const FICHEIROS = ['state.js', 'i18n.js', 'niveis.js', 'capitulos.js', 'historia.js', 'conquistas.js', 'personagens.js'];

function carregarJogo() {
  const guardado = {};
  const sandbox = {
    console: { log() {}, warn() {}, error() {} },
    localStorage: {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(guardado, k) ? guardado[k] : null; },
      setItem: function (k, v) { guardado[k] = String(v); },
      removeItem: function (k) { delete guardado[k]; }
    },
    location: { search: '' },
    URLSearchParams: URLSearchParams,
    document: { querySelectorAll: function () { return []; }, getElementById: function () { return null; } },
    setTimeout: function () {},
    Image: function () {},
    Date: Date
  };
  sandbox.window = sandbox;
  sandbox.Telegram = { WebApp: {} };
  const ctx = vm.createContext(sandbox);
  FICHEIROS.forEach(function (f) {
    vm.runInContext(fs.readFileSync(path.join(RAIZ, 'js', f), 'utf8'), ctx, { filename: 'js/' + f });
  });
  // const de topo não ficam como propriedades do contexto: lêem-se por expressão.
  return vm.runInContext(
    '({ TRANSLATIONS: TRANSLATIONS, NIVEIS_CONFIG: NIVEIS_CONFIG, HISTORIA_NIVEIS: HISTORIA_NIVEIS,' +
    ' CAPITULOS_CONFIG: CAPITULOS_CONFIG, CAPITULOS_STRINGS: CAPITULOS_STRINGS,' +
    ' NIVEL_NECESSARIO_POR_ECRA: NIVEL_NECESSARIO_POR_ECRA, CONQUISTAS_CONFIG: CONQUISTAS_CONFIG, PERSONAGENS_CARAS: PERSONAGENS_CARAS })', ctx);
}

const faltas = [];
function falta(onde, o) { faltas.push(onde + ': falta ' + o); }
const avisos = [];
const LIMITE_CONCLUSAO = 90; // caracteres que cabem no balão sem esticar

function temTexto(valor) { return typeof valor === 'string' && valor.trim() !== ''; }

function main() {
  const J = carregarJogo();
  const tr = J.TRANSLATIONS;

  function chave(onde, k, linguas) {
    (linguas || LINGUAS).forEach(function (l) {
      if (!tr[l] || !temTexto(tr[l][k])) falta(onde, 'a chave "' + k + '" em ' + l);
    });
  }

  J.NIVEIS_CONFIG.forEach(function (nivel, i) {
    const n = i + 1;
    const onde = 'Nível ' + n;

    // a) nome do nível
    chave(onde, nivel.nomeKey);

    // b) história (do nível 2 em diante)
    if (n >= 2) {
      const historia = J.HISTORIA_NIVEIS[n];
      if (!Array.isArray(historia) || historia.length === 0) {
        falta(onde, 'a história (entrada em HISTORIA_NIVEIS)');
      } else {
        historia.forEach(function (fala) { chave(onde + ' (história)', fala.chave); });
      }
    }

    // c) pelo menos um capítulo, com título, objetivo e conclusão
    const capitulos = J.CAPITULOS_CONFIG.filter(function (c) { return c.nivel === n; });
    if (capitulos.length === 0) falta(onde, 'um capítulo em CAPITULOS_CONFIG');
    capitulos.forEach(function (c) {
      // d') o falante do capítulo (opcional) tem de existir em PERSONAGENS_CARAS
      if (c.falante && !Object.prototype.hasOwnProperty.call(J.PERSONAGENS_CARAS, c.falante)) {
        falta(onde + ' (capítulo ' + c.id + ')', 'a personagem "' + c.falante + '" em PERSONAGENS_CARAS (falante do capítulo)');
      }
      LINGUAS.forEach(function (l) {
        const s = (J.CAPITULOS_STRINGS[l] || {})[c.id] || {};
        if (!temTexto(s.titulo)) falta(onde + ' (capítulo ' + c.id + ')', 'o título em ' + l);
        if (!temTexto(s.objetivo)) falta(onde + ' (capítulo ' + c.id + ')', 'o objetivo em ' + l);
      });
      chave(onde + ' (capítulo ' + c.id + ')', 'capitulo.' + c.id + '.conclusao');
      // AVISO (não falha): o balão de fala mostra ~2 linhas de texto (ver
      // .dialogue-msg em index.html); acima de 90 caracteres estica para cima
      // e tapa mais da cena.
      LINGUAS.forEach(function (l) {
        const k = 'capitulo.' + c.id + '.conclusao';
        const texto = tr[l] && tr[l][k];
        if (temTexto(texto) && texto.length > LIMITE_CONCLUSAO) {
          avisos.push(onde + ' (capítulo ' + c.id + '): a conclusão "' + k + '" em ' + l + ' tem ' + texto.length + ' caracteres (limite ' + LIMITE_CONCLUSAO + ')');
        }
      });
    });
  });

  // d) nenhum ecrã exige um nível que não existe
  const ultimo = J.NIVEIS_CONFIG.length;
  Object.keys(J.NIVEL_NECESSARIO_POR_ECRA).forEach(function (ecra) {
    const exigido = J.NIVEL_NECESSARIO_POR_ECRA[ecra];
    if (exigido > ultimo) falta('Ecrã "' + ecra + '"', 'o nível ' + exigido + ' (o último nível é o ' + ultimo + ')');
  });

  // e) textos das conquistas
  J.CONQUISTAS_CONFIG.forEach(function (c) {
    chave('Conquista ' + c.id, c.nomeKey);
    chave('Conquista ' + c.id, c.descKey);
  });

  // f) cada cara de PERSONAGENS_CARAS existe como ficheiro em disco
  Object.keys(J.PERSONAGENS_CARAS).forEach(function (nome) {
    const ficheiro = J.PERSONAGENS_CARAS[nome];
    if (!fs.existsSync(path.join(RAIZ, ficheiro))) falta('Personagem ' + nome, 'o ficheiro "' + ficheiro + '"');
  });

  // g) Cave de Reserva: textos novos (pt, en, es) e as duas imagens
  ['adega.reservaTitulo', 'adega.reservaTexto1', 'adega.reservaTexto2',
   'adega.reservaMaisDescansou', 'adega.reservaMaisDescansouUm'].forEach(function (k) { chave('Cave de Reserva', k); });
  ['assets/vinha/barril_dourado.jpg', 'assets/vinha/barril.jpg'].forEach(function (f) {
    if (!fs.existsSync(path.join(RAIZ, f))) falta('Cave de Reserva', 'o ficheiro "' + f + '"');
  });

  // h) falas dos porcos no fim do Proteger: textos em pt/en/es (aviso se > 90
  // caracteres) e os dois falantes em PERSONAGENS_CARAS
  ['proteger.fala.fygmoPerde', 'proteger.fala.fygmo2Ganha'].forEach(function (k) {
    chave('Proteger (falas dos porcos)', k);
    LINGUAS.forEach(function (l) {
      const texto = tr[l] && tr[l][k];
      if (temTexto(texto) && texto.length > LIMITE_CONCLUSAO) {
        avisos.push('Proteger: "' + k + '" em ' + l + ' tem ' + texto.length + ' caracteres (limite ' + LIMITE_CONCLUSAO + ')');
      }
    });
  });
  ['Fygmo', 'Fygmo2'].forEach(function (nome) {
    if (!Object.prototype.hasOwnProperty.call(J.PERSONAGENS_CARAS, nome)) falta('Proteger (falas dos porcos)', 'a personagem "' + nome + '" em PERSONAGENS_CARAS');
  });

  // i) Prateleira da Coleção (Nível 6): textos em pt, en e es
  ['adega.colecaoTitulo', 'adega.colecaoVazia', 'adega.colecaoDias1', 'adega.colecaoDias2',
   'adega.colecaoDias3', 'adega.colecaoSaoMartinho'].forEach(function (k) { chave('Prateleira da Coleção', k); });

  // j) Ponto certo da vindima: etiqueta e dica em pt, en e es (dica <= 90 caracteres)
  ['vinha.bonusVindima', 'vinha.dica.colher.pontoCerto'].forEach(function (k) {
    chave('Ponto certo da vindima', k);
    LINGUAS.forEach(function (l) {
      const texto = tr[l] && tr[l][k];
      if (temTexto(texto) && texto.length > LIMITE_CONCLUSAO) {
        avisos.push('Vindima: "' + k + '" em ' + l + ' tem ' + texto.length + ' caracteres (limite ' + LIMITE_CONCLUSAO + ')');
      }
    });
  });

  if (avisos.length > 0) {
    console.log('Avisos (não falham):');
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
