// ---------------------------------------------------------------------
// LIVRO DE CONQUISTAS — só mostra (versão pequena).
//
// Cada conquista é um DADO em CONQUISTAS_CONFIG: id, chaves de texto e
// "cumprida", uma função que só LÊ o state. Não há prémios, Reputação,
// balões, vibração, som, campos novos no state nem gravação: o estado de
// cada conquista calcula-se sempre a partir do progresso que já existe.
//
// Para acrescentar uma conquista: põe mais uma linha aqui e os dois
// textos (nome e descrição) em js/i18n.js. O "n / total" do Perfil e a
// lista do ecrã contam a partir desta lista.
//
// NOTA: as entradas de state.adega.historico não distinguem uma estação
// real de uma forçada por ?estacao= (nem um descanso forçado por ?dias=),
// por isso estes testes também contam como progresso nas "Quatro estações"
// e na "Paciência". Só se resolve guardando essa marca no state.
// ---------------------------------------------------------------------

const CONQUISTAS_ESTACOES = ['inverno', 'primavera', 'verao', 'outono'];

function conquistasHistorico() {
  const h = state.adega && state.adega.historico;
  return Array.isArray(h) ? h : [];
}

function conquistasDesbloqueadas() {
  const u = state.encyclopedia && state.encyclopedia.unlocked;
  return Array.isArray(u) ? u.length : 0;
}

function conquistasTotalEnciclopedia() {
  return (typeof ENCYCLOPEDIA_ENTRIES !== 'undefined' && ENCYCLOPEDIA_ENTRIES.pt) ? ENCYCLOPEDIA_ENTRIES.pt.length : 0;
}

function conquistasSelos() {
  return (state.objetivos && Number(state.objetivos.selosTotal)) || 0;
}

function conquistasCapitulosConcluidos() {
  const c = state.capitulos && state.capitulos.concluidos;
  return (c && typeof c === 'object') ? Object.keys(c).length : 0;
}

function conquistasEstacoesFeitas() {
  const vistas = {};
  conquistasHistorico().forEach(function (e) {
    if (e && CONQUISTAS_ESTACOES.indexOf(e.estacao) !== -1) vistas[e.estacao] = true;
  });
  return Object.keys(vistas).length;
}

const CONQUISTAS_CONFIG = [
  { id: 'primeira_garrafa', nomeKey: 'conquista.primeira_garrafa.nome', descKey: 'conquista.primeira_garrafa.desc',
    cumprida: function () { return state.garrafas >= 1; } },
  { id: 'cinco_garrafas', nomeKey: 'conquista.cinco_garrafas.nome', descKey: 'conquista.cinco_garrafas.desc',
    cumprida: function () { return state.garrafas >= 5; } },
  { id: 'dez_garrafas', nomeKey: 'conquista.dez_garrafas.nome', descKey: 'conquista.dez_garrafas.desc',
    cumprida: function () { return state.garrafas >= 10; } },
  { id: 'paciencia', nomeKey: 'conquista.paciencia.nome', descKey: 'conquista.paciencia.desc',
    cumprida: function () {
      return conquistasHistorico().some(function (e) { return e && e.diasDescanso >= 3; });
    } },
  { id: 'quatro_estacoes', nomeKey: 'conquista.quatro_estacoes.nome', descKey: 'conquista.quatro_estacoes.desc',
    cumprida: function () { return conquistasEstacoesFeitas() >= CONQUISTAS_ESTACOES.length; } },
  { id: 'curioso', nomeKey: 'conquista.curioso.nome', descKey: 'conquista.curioso.desc',
    cumprida: function () { return conquistasDesbloqueadas() >= 6; } },
  { id: 'sabio', nomeKey: 'conquista.sabio.nome', descKey: 'conquista.sabio.desc',
    cumprida: function () {
      const total = conquistasTotalEnciclopedia();
      return total > 0 && conquistasDesbloqueadas() >= total;
    } },
  { id: 'primeiro_selo', nomeKey: 'conquista.primeiro_selo.nome', descKey: 'conquista.primeiro_selo.desc',
    cumprida: function () { return conquistasSelos() >= 1; } },
  { id: 'cinco_selos', nomeKey: 'conquista.cinco_selos.nome', descKey: 'conquista.cinco_selos.desc',
    cumprida: function () { return conquistasSelos() >= 5; } },
  { id: 'meio_caminho', nomeKey: 'conquista.meio_caminho.nome', descKey: 'conquista.meio_caminho.desc',
    cumprida: function () { return conquistasCapitulosConcluidos() >= 3; } },
  { id: 'quinta_completa', nomeKey: 'conquista.quinta_completa.nome', descKey: 'conquista.quinta_completa.desc',
    cumprida: function () {
      return CAPITULOS_CONFIG.length > 0 && conquistasCapitulosConcluidos() >= CAPITULOS_CONFIG.length;
    } },
  // Calculado pela Reputação (nunca por state.niveis.nivelMostrado).
  { id: 'casa_do_moscatel', nomeKey: 'conquista.casa_do_moscatel.nome', descKey: 'conquista.casa_do_moscatel.desc',
    cumprida: function () { return nivelPelaReputacao(state.reputacao) >= 6; } }
];

function conquistasCumpridas() {
  return CONQUISTAS_CONFIG.filter(function (c) { return c.cumprida(); }).length;
}

// "n / total" do mosaico do Perfil.
function conquistasResumo() {
  return conquistasCumpridas() + ' / ' + CONQUISTAS_CONFIG.length;
}

function renderConquistas() {
  const container = document.getElementById('conquistas-container');
  const cardsHtml = CONQUISTAS_CONFIG.map(function (c) {
    const feita = c.cumprida();
    return '<div class="encyclopedia-card' + (feita ? '' : ' locked') + '">' +
      '<h3>' + t(c.nomeKey) + '</h3>' +
      '<p>' + t(c.descKey) + '</p>' +
      '<p><strong>' + t(feita ? 'conquistas.cumprida' : 'conquistas.porFazer') + '</strong></p>' +
    '</div>';
  }).join('');

  container.innerHTML =
    '<div class="topcard">' +
      '<p class="mini-title" data-i18n="conquistas.title"></p>' +
      '<p class="mini-sub">' + conquistasResumo() + '</p>' +
    '</div>' +
    '<div class="scroll-panel encyclopedia-grid">' + cardsHtml + '</div>' +
    '<div class="action-panel">' +
      '<button type="button" class="btn-pill pill-main pill-grande" onclick="voltarEcraAnterior()" data-i18n="nav.voltar"></button>' +
    '</div>';

  atualizarDialogo('', '');
  applyTranslations();
}
