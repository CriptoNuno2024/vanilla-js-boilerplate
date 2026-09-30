// ---------------------------------------------------------------------
// CAPÍTULOS DA QUINTA — motor (sem nada visível no ecrã).
//
// Um capítulo por nível (1 a 6), escritos como DADOS em CAPITULOS_CONFIG
// (estilo FESTAS_CONFIG em js/festas.js). Cada capítulo tem um critério
// verificável só com contadores que já existem no estado (ver
// js/state.js). Os capítulos nunca travam a subida de nível: os níveis
// continuam só pela Reputação (ver js/niveis.js).
//
// Este ficheiro só tem: os dados, um leitor de critérios e a avaliação
// SILENCIOSA (abaixo). Não há avaliação normal, balões, selos nem ecrã.
//
// "criterio" é uma LISTA de alternativas: basta uma ser verdadeira. Cada
// alternativa é { tipo, caminho, alvo[, campo] }:
//   numero         — o campo numérico em "caminho" é >= alvo
//   booleano       — o campo em "caminho" é true
//   contarChaves   — o objeto em "caminho" tem pelo menos "alvo" chaves
//   contarLista    — a lista em "caminho" tem pelo menos "alvo" elementos
//   algumaEntrada  — alguma entrada da lista em "caminho" tem campo >= alvo
// "alvo" pode ser um número ou o nome de um alvo calculado (ver
// capitulosResolverAlvo()).
// ---------------------------------------------------------------------

const CAPITULOS_CONFIG = [
  { id: 'cap1', nivel: 1, criterio: [{ tipo: 'contarChaves', caminho: 'vinha.primeirosPassos', alvo: 4 }] },
  {
    id: 'cap2',
    nivel: 2,
    criterio: [
      { tipo: 'booleano', caminho: 'vinha.primeirosPassos.colher' },
      { tipo: 'numero', caminho: 'garrafas', alvo: 1 }
    ]
  },
  { id: 'cap3', nivel: 3, criterio: [{ tipo: 'numero', caminho: 'garrafas', alvo: 1 }] },
  { id: 'cap4', nivel: 4, criterio: [{ tipo: 'contarLista', caminho: 'encyclopedia.unlocked', alvo: 6 }] },
  { id: 'cap5', nivel: 5, criterio: [{ tipo: 'algumaEntrada', caminho: 'adega.historico', campo: 'diasDescanso', alvo: 3 }] },
  { id: 'cap6', nivel: 6, criterio: [{ tipo: 'contarLista', caminho: 'encyclopedia.unlocked', alvo: 'totalEnciclopedia' }] }
];

// Alvos que não são um número fixo. "totalEnciclopedia" lê o tamanho da
// Enciclopédia (js/explorar.js), para continuar certo se entrarem entradas
// novas.
function capitulosResolverAlvo(alvo) {
  if (typeof alvo === 'number') return alvo;
  if (alvo === 'totalEnciclopedia') {
    return (typeof ENCYCLOPEDIA_ENTRIES !== 'undefined' && ENCYCLOPEDIA_ENTRIES.pt) ? ENCYCLOPEDIA_ENTRIES.pt.length : Infinity;
  }
  return Infinity;
}

function capitulosValorNoEstado(caminho) {
  let v = state;
  const partes = caminho.split('.');
  for (let i = 0; i < partes.length; i++) {
    if (v === null || v === undefined) return undefined;
    v = v[partes[i]];
  }
  return v;
}

// Lê UMA alternativa. Devolve { atual, total, cumprido }.
function capitulosLerAlternativa(c) {
  const valor = capitulosValorNoEstado(c.caminho);
  const total = c.tipo === 'booleano' ? 1 : capitulosResolverAlvo(c.alvo);
  let atual = 0;

  if (c.tipo === 'numero') {
    atual = typeof valor === 'number' ? valor : 0;
  } else if (c.tipo === 'booleano') {
    atual = valor === true ? 1 : 0;
  } else if (c.tipo === 'contarChaves') {
    atual = (valor && typeof valor === 'object') ? Object.keys(valor).length : 0;
  } else if (c.tipo === 'contarLista') {
    atual = Array.isArray(valor) ? valor.length : 0;
  } else if (c.tipo === 'algumaEntrada') {
    const lista = Array.isArray(valor) ? valor : [];
    lista.forEach(function (e) {
      if (e && typeof e[c.campo] === 'number' && e[c.campo] > atual) atual = e[c.campo];
    });
  }

  return { atual: Math.min(atual, total), total: total, cumprido: atual >= total };
}

// Lê um capítulo: cumprido se QUALQUER alternativa for verdadeira; senão
// devolve a alternativa mais adiantada (para uma barra de progresso).
function capitulosLerCriterio(capitulo) {
  let melhor = null;
  for (let i = 0; i < capitulo.criterio.length; i++) {
    const r = capitulosLerAlternativa(capitulo.criterio[i]);
    if (r.cumprido) return r;
    if (!melhor || (r.atual / r.total) > (melhor.atual / melhor.total)) melhor = r;
  }
  return melhor || { atual: 0, total: 1, cumprido: false };
}

// AVALIAÇÃO SILENCIOSA — corre uma só vez por jogo (enquanto
// state.capitulos.iniciado for false): todo o capítulo cujo critério já
// é verdadeiro fica em concluidos, SEM balão, vibração nem selo, e sem
// olhar ao nível. Depois fica iniciado = true. Só mexe no estado em
// memória: não grava nada (o saveState() da 1.ª ação real leva tudo).
// Chamada ao abrir o jogo (no fim deste ficheiro) e outra vez depois de
// a nuvem do Telegram ser juntada (ver nuvemSincronizarAoAbrir() em
// js/nuvem.js), porque a cópia da nuvem pode ser antiga e não trazer
// "capitulos".
function capitulosAvaliarEmSilencio() {
  if (!state.capitulos || typeof state.capitulos !== 'object') state.capitulos = { iniciado: false, concluidos: {} };
  const cap = state.capitulos;
  if (cap.iniciado) return;
  if (!cap.concluidos || typeof cap.concluidos !== 'object') cap.concluidos = {};

  CAPITULOS_CONFIG.forEach(function (c) {
    if (capitulosLerCriterio(c).cumprido) cap.concluidos[c.id] = true;
  });
  cap.iniciado = true;
}

capitulosAvaliarEmSilencio();
