// ---------------------------------------------------------------------
// CAPÍTULOS DA QUINTA — motor (sem nada visível no ecrã).
//
// Um capítulo por nível (1 a 6), escritos como DADOS em CAPITULOS_CONFIG
// (estilo FESTAS_CONFIG em js/festas.js). Cada capítulo tem um critério
// verificável só com contadores que já existem no estado (ver
// js/state.js). Os capítulos nunca travam a subida de nível: os níveis
// continuam só pela Reputação (ver js/niveis.js).
//
// Este ficheiro tem: os dados, um leitor de critérios, a avaliação
// SILENCIOSA (migração única) e a CELEBRAÇÃO de cada capítulo cumprido
// (uma só vez, um por visita à Quinta). Sem selos, Reputação nem trancas.
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
//
// "falante" (opcional) é quem diz a conclusão no balão: um nome de
// PERSONAGENS_CARAS (js/personagens.js). Sem ele fala o YoshiCat.
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
  { id: 'cap5', nivel: 5, falante: 'Chizo', criterio: [{ tipo: 'algumaEntrada', caminho: 'adega.historico', campo: 'diasDescanso', alvo: 3 }] },
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
  if (!state.capitulos || typeof state.capitulos !== 'object') state.capitulos = { iniciado: false, concluidos: {}, celebrados: {}, celebradosMigrado: false };
  const cap = state.capitulos;
  if (!cap.concluidos || typeof cap.concluidos !== 'object') cap.concluidos = {};
  if (!cap.celebrados || typeof cap.celebrados !== 'object') cap.celebrados = {};
  if (cap.iniciado && cap.celebradosMigrado) return;

  // Migração única: o que já está cumprido conta como concluído E
  // celebrado (sem balão). "celebradosMigrado" é a marca de que isto já
  // correu; depois disso nunca mais se marca em silêncio.
  CAPITULOS_CONFIG.forEach(function (c) {
    if (cap.concluidos[c.id] === true || capitulosLerCriterio(c).cumprido) {
      cap.concluidos[c.id] = true;
      cap.celebrados[c.id] = true;
    }
  });
  cap.iniciado = true;
  cap.celebradosMigrado = true;
}

// -----------------------------------------------------------------
// TEXTOS DOS CAPÍTULOS (só o título e o objetivo de cada um) e cartão
// do capítulo atual no ecrã da Quinta (ver #capitulo-container em
// index.html). "ui" tem os textos soltos do cartão.
// -----------------------------------------------------------------

const CAPITULOS_STRINGS = {
  pt: {
    ui: { rotulo: 'Capítulo', proximo: 'Próximo capítulo no Nível {n}', todos: 'Todos os capítulos cumpridos' },
    cap1: { titulo: 'Devolver a vida à Vinha', objetivo: 'Faz 4 tarefas diferentes na Vinha.' },
    cap2: { titulo: 'Guardiões da Colheita', objetivo: 'Faz a 1.ª colheita.' },
    cap3: { titulo: 'O primeiro Moscatel', objetivo: 'Faz a primeira garrafa.' },
    cap4: { titulo: 'O convite da vila', objetivo: 'Descobre 6 entradas da Enciclopédia.' },
    cap5: { titulo: 'O que descansa mais tempo', objetivo: 'Deixa uma garrafa descansar 3 dias ou mais na Cave.' },
    cap6: { titulo: 'Histórias mais antigas', objetivo: 'Descobre todas as entradas da Enciclopédia.' }
  },
  en: {
    ui: { rotulo: 'Chapter', proximo: 'Next chapter at Level {n}', todos: 'All chapters completed' },
    cap1: { titulo: 'Bringing the Vineyard back to life', objetivo: 'Do 4 different tasks in the Vineyard.' },
    cap2: { titulo: 'Guardians of the Harvest', objetivo: 'Bring in your first harvest.' },
    cap3: { titulo: 'The first Moscatel', objetivo: 'Make your first bottle.' },
    cap4: { titulo: "The village's invitation", objetivo: 'Discover 6 Encyclopedia entries.' },
    cap5: { titulo: 'What rests the longest', objetivo: 'Let a bottle rest in the Cellar for 3 days or more.' },
    cap6: { titulo: 'Older stories', objetivo: 'Discover every Encyclopedia entry.' }
  },
  es: {
    ui: { rotulo: 'Capítulo', proximo: 'Próximo capítulo en el Nivel {n}', todos: 'Todos los capítulos cumplidos' },
    cap1: { titulo: 'Devolver la vida al Viñedo', objetivo: 'Haz 4 tareas distintas en el Viñedo.' },
    cap2: { titulo: 'Guardianes de la Cosecha', objetivo: 'Haz tu primera cosecha.' },
    cap3: { titulo: 'El primer Moscatel', objetivo: 'Haz tu primera botella.' },
    cap4: { titulo: 'La invitación de la villa', objetivo: 'Descubre 6 entradas de la Enciclopedia.' },
    cap5: { titulo: 'Lo que más reposa', objetivo: 'Deja reposar una botella 3 días o más en la Cava.' },
    cap6: { titulo: 'Historias más antiguas', objetivo: 'Descubre todas las entradas de la Enciclopedia.' }
  }
};

// Como fStr() em js/festas.js: os textos do capítulo "id" (ou "ui") no
// idioma atual, com o português como reserva.
function cStr(id) {
  const dict = CAPITULOS_STRINGS[currentLang] || CAPITULOS_STRINGS.pt;
  return dict[id] || CAPITULOS_STRINGS.pt[id] || {};
}

// CELEBRAÇÃO — chamada em goTo() ao entrar na Quinta (js/main.js), depois
// da história de nível, e só se esta não apareceu nessa visita. Celebra no
// máximo UM capítulo (o mais baixo cumprido e ainda não celebrado): mostra o
// balão e vibra/toca, mas só MARCA concluidos + celebrados (e grava) depois
// de o balão ter ficado visível CAPITULOS_CONFIRMAR_MS seguidos no ecrã da
// Quinta. Se o jogador sair antes (goTo cancela, ver
// capitulosCancelarCelebracaoPendente()), nada se marca e a festa repete na
// visita seguinte. Devolve true se celebrou (ou já havia uma pendente).
const CAPITULOS_CONFIRMAR_MS = 3000;
let _capitulosPendente = null; // { id, texto, timeoutId } enquanto a festa espera pela confirmação

function capitulosCancelarCelebracaoPendente() {
  if (!_capitulosPendente) return;
  clearTimeout(_capitulosPendente.timeoutId);
  _capitulosPendente = null;
}

function capitulosConfirmarCelebracao(id, texto) {
  _capitulosPendente = null;
  const ecra = document.querySelector('.screen.active');
  const bolha = document.getElementById('app-dialogue');
  const aindaVisivel = ecra && ecra.id === 'screen-quinta' && bolha && !bolha.hidden &&
    typeof dialogoFila !== 'undefined' && dialogoFila[0] === texto;
  if (!aindaVisivel) return;
  const cap = state.capitulos;
  cap.concluidos[id] = true;
  cap.celebrados[id] = true;
  saveState(state);
  atualizarCapituloQuinta();
}

function capitulosAvaliarCelebracao() {
  if (!state.capitulos || typeof state.capitulos !== 'object') return false;
  const cap = state.capitulos;
  // Sem a migração feita, nunca celebrar (evita balões retroativos).
  if (!cap.celebradosMigrado) return false;
  if (!cap.concluidos || typeof cap.concluidos !== 'object') cap.concluidos = {};
  if (!cap.celebrados || typeof cap.celebrados !== 'object') cap.celebrados = {};
  if (_capitulosPendente) return true; // já há uma festa à espera: nunca agendar outra

  // No máximo UM por visita: o mais baixo cumprido e ainda não celebrado.
  const c = CAPITULOS_CONFIG.filter(function (x) {
    return cap.celebrados[x.id] !== true && capitulosLerCriterio(x).cumprido;
  })[0];
  if (!c) return false;

  const texto = t('capitulo.' + c.id + '.conclusao');
  mostrarFalas([texto], c.falante || 'YoshiCat');
  vibrar('sucesso');
  tocarSom('objetivoCumprido');
  _capitulosPendente = {
    id: c.id,
    texto: texto,
    timeoutId: setTimeout(function () { capitulosConfirmarCelebracao(c.id, texto); }, CAPITULOS_CONFIRMAR_MS)
  };
  return true;
}

// MODO DE TESTE (só ver a celebração, sem cumprir o capítulo): abre o jogo
// com ?capitulo=3 (ou cap3) e, se quiseres ver a cara de outra personagem
// no balão, &falante=Chizo (só nomes de PERSONAGENS_CARAS; senão fala quem o
// capítulo define em CAPITULOS_CONFIG, ou o YoshiCat).
// Mostra UMA vez por carregamento da página, mesmo que haja intro ou
// história de nível nessa visita. NÃO ESCREVE NADA: nada de saveState,
// state.capitulos, nuvem nem localStorage (mostrarFalas, vibrar e tocarSom
// só mexem no ecrã). Chamada em goTo() ao entrar na Quinta (js/main.js).
let _capitulosTesteMostrado = false;

function capitulosParametrosTeste() {
  let params;
  try { params = new URLSearchParams(location.search); } catch (e) { return null; }
  const m = /^(?:cap)?([1-6])$/i.exec(params.get('capitulo') || '');
  if (!m) return null;
  const id = 'cap' + m[1];
  if (!CAPITULOS_CONFIG.some(function (x) { return x.id === id; })) return null;
  // ?falante= (só nomes de PERSONAGENS_CARAS) vence; sem ele (ou se for
  // inválido) fala quem o capítulo define em CAPITULOS_CONFIG, ou o YoshiCat.
  const f = params.get('falante');
  const doCapitulo = CAPITULOS_CONFIG.filter(function (x) { return x.id === id; })[0].falante;
  const falante = (f && typeof caraDoPersonagem === 'function' && caraDoPersonagem(f)) ? f : (doCapitulo || 'YoshiCat');
  return { id: id, falante: falante };
}

// Devolve true se mostrou a celebração de teste nesta chamada.
function capitulosCelebracaoDeTeste() {
  if (_capitulosTesteMostrado) return false;
  const teste = capitulosParametrosTeste();
  if (!teste) return false;
  _capitulosTesteMostrado = true;
  mostrarFalas([t('capitulo.' + teste.id + '.conclusao')], teste.falante);
  vibrar('sucesso');
  tocarSom('objetivoCumprido');
  return true;
}

// Cumprido se já está em concluidos OU o critério é verdadeiro agora.
// Só lê: nunca marca nada no estado (quem marca é a avaliação, ver acima).
function capituloEstaCumprido(c) {
  const concluidos = (state.capitulos && state.capitulos.concluidos) || {};
  return concluidos[c.id] === true || capitulosLerCriterio(c).cumprido;
}

// Cartão do capítulo atual, dentro do topcard da Quinta (ver
// #capitulo-container em index.html). Mostra o primeiro capítulo não
// cumprido cujo nível já foi atingido; sem nenhum, diz qual é o próximo
// (ou que já estão todos). Só desenha: não grava nem marca nada.
function atualizarCapituloQuinta() {
  const container = document.getElementById('capitulo-container');
  if (!container) return;

  const ui = cStr('ui');
  const nivelAtual = nivelPelaReputacao(state.reputacao);
  const porCumprir = CAPITULOS_CONFIG.filter(function (c) { return !capituloEstaCumprido(c); });
  const atual = porCumprir.filter(function (c) { return c.nivel <= nivelAtual; })[0];

  let conteudo;
  if (atual) {
    const s = cStr(atual.id);
    const r = capitulosLerCriterio(atual);
    const pct = (isFinite(r.total) && r.total > 0) ? Math.round((r.atual / r.total) * 100) : 0;
    conteudo =
      '<p class="mini-bloco-titulo">' + ui.rotulo + ' ' + atual.nivel + ' · ' + s.titulo + '</p>' +
      '<div class="nivel-barra"><div class="nivel-barra-cheio" style="width:' + pct + '%"></div></div>' +
      '<p class="objetivo-linha">· ' + s.objetivo + '</p>' +
      '<p class="mini-sub">' + r.atual + ' / ' + (isFinite(r.total) ? r.total : '?') + '</p>';
  } else if (porCumprir.length > 0) {
    conteudo = '<p class="mini-bloco-titulo">' + ui.proximo.replace('{n}', porCumprir[0].nivel) + '</p>';
  } else {
    conteudo = '<p class="mini-bloco-titulo">' + ui.todos + '</p>';
  }

  container.innerHTML = '<div class="mini-bloco">' + conteudo + '</div>';
}

capitulosAvaliarEmSilencio();
