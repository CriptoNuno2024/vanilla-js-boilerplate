// ---------------------------------------------------------------------
// PROTEGER A QUINTA (3 estilos de mini-jogo, escolhidos à sorte)
//
// Personagens (nomes próprios, não traduzidos):
// - Fygmo  — porco malhado, mais velho, o "cérebro" (mapas, binóculos).
// - Fygmo2 — porco branco, mais novo, o "executor" (monóculo, arromba
//            fechaduras, age de noite).
// - Chizo  — o cão de guarda do YoshiCat, dorme perto da adega.
//
// Todo o texto do ecrã está em PT/EN/ES via PROTEGER_STRINGS[currentLang].
// A mecânica de cada estilo (e a opção/turno correto) é a mesma nas 3
// línguas — só o texto muda.
// ---------------------------------------------------------------------

const PROTEGER_STRINGS = {
  pt: {
    titulo: 'Proteger a Quinta',
    fechaduraSubtitulo: 'A Fechadura da Reserva Especial',
    disfarcesSubtitulo: 'Onde se escondem os disfarces de uva?',
    disfarcesIntro: 'Um dos montes de uvas ali à frente... não parece bem certo.',
    monteLabel: 'Monte',
    chizoSubtitulo: 'Acorda o Chizo a tempo',
    chizoExplicacao: 'Os porcos aproximam-se sozinhos. Acorda o Chizo no momento certo: nem cedo demais, nem tarde demais!',
    chizoComecar: 'Começar',
    chizoBotao: 'Acordar o Chizo!',
    protegida: 'A Quinta está protegida!',
    naoCorreuBem: 'Desta vez não correu bem...',
    jogarNovamente: 'Jogar Novamente',
    tentarOutraVez: 'Tentar Outra Vez',
    fechadura: [
      { situacao: 'O Fygmo2 tira o monóculo e mede a fechadura da Reserva Especial milimetricamente, à procura do ponto fraco.', opcoes: ['Trocar a fechadura por um cadeado reforçado', 'Ir embora e voltar amanhã', 'Gritar "quem está aí?" às escuras'], correta: 0 },
      { situacao: 'Um barulho de metal ecoa na cave — o Fygmo2 está a testar picos diferentes na fechadura.', opcoes: ['Ir dormir, deve ser só o vento', 'Colocar uma tranca extra na porta', 'Abrir a porta para ver quem é'], correta: 1 },
      { situacao: 'O Fygmo, escondido nas escadas da cave, aponta o binóculo e faz sinal ao Fygmo2 para avançar.', opcoes: ['Acender as luzes da adega de repente', 'Fechar os olhos e esperar que passe', 'Chamar o Fygmo pelo nome, a rir'], correta: 0 },
      { situacao: 'De monóculo posto, o Fygmo2 encosta o ouvido à fechadura da Reserva Especial para ouvir as engrenagens.', opcoes: ['Distraí-lo com um balde a cair ruidosamente', 'Deixar-lhe uma nota simpática', 'Ignorar e voltar a dormir'], correta: 0 }
    ],
    fechaduraVitoria: 'O Fygmo2 desiste, guarda o monóculo e foge pela vinha fora — a Reserva Especial está a salvo.',
    fechaduraDerrota: 'Tarde demais... o Fygmo2 força a fechadura e escapa com uma garrafa da Reserva Especial.',
    disfarceVitoria: function (porco) { return 'Debaixo das folhas estava o ' + porco + ', apanhado em flagrante a tentar fugir com a colheita!'; },
    disfarceDerrota: function (porco) { return 'Era só uva a sério... enquanto isso, o ' + porco + ' escapa com um cesto cheio.'; },
    chizoTurnos: [
      'O Fygmo e o Fygmo2 aproximam-se devagar da adega, escondidos entre as sombras...',
      'O Fygmo faz sinal ao Fygmo2 para avançarem mais um pouco...',
      'Já se ouvem os passos deles junto à porta da adega...',
      'O Fygmo já está a abrir a porta da adega!'
    ],
    chizoVitoria: 'O Chizo acorda a tempo e ladra! O Fygmo e o Fygmo2 fogem a correr, de mãos a abanar.',
    chizoCedo: 'Falso alarme — o Chizo mal abre um olho e volta a adormecer. Os porcos esperam que ele ressone e fogem com parte da colheita.',
    chizoTarde: 'Tarde demais... o Fygmo e o Fygmo2 já fugiram com parte da colheita.'
  },

  en: {
    titulo: 'Protect the Farm',
    fechaduraSubtitulo: 'The Special Reserve Lock',
    disfarcesSubtitulo: 'Where are the grape disguises hiding?',
    disfarcesIntro: "One of the grape piles up ahead... doesn't look quite right.",
    monteLabel: 'Pile',
    chizoSubtitulo: 'Wake Chizo in time',
    chizoExplicacao: 'The pigs are creeping closer on their own. Wake Chizo at the right moment: not too early, not too late!',
    chizoComecar: 'Start',
    chizoBotao: 'Wake Chizo!',
    protegida: 'The Farm is protected!',
    naoCorreuBem: "It didn't go well this time...",
    jogarNovamente: 'Play Again',
    tentarOutraVez: 'Try Again',
    fechadura: [
      { situacao: 'Fygmo2 pulls out his monocle and measures the Special Reserve lock millimeter by millimeter, looking for a weak spot.', opcoes: ['Swap the lock for a reinforced padlock', 'Walk away and come back tomorrow', 'Shout "who\'s there?" into the dark'], correta: 0 },
      { situacao: 'A metallic clatter echoes through the cellar — Fygmo2 is trying different picks on the lock.', opcoes: ['Go back to sleep, it must be the wind', 'Add an extra bolt to the door', 'Open the door to see who it is'], correta: 1 },
      { situacao: 'Hidden on the cellar stairs, Fygmo raises his binoculars and signals Fygmo2 to move forward.', opcoes: ['Suddenly turn on the cellar lights', 'Close your eyes and hope it passes', "Call out Fygmo's name, laughing"], correta: 0 },
      { situacao: 'Monocle in place, Fygmo2 presses his ear against the Special Reserve lock to listen to the gears.', opcoes: ['Distract him with a noisy falling bucket', 'Leave him a friendly note', 'Ignore it and go back to sleep'], correta: 0 }
    ],
    fechaduraVitoria: 'Fygmo2 gives up, puts away his monocle and flees across the vineyard — the Special Reserve is safe.',
    fechaduraDerrota: 'Too late... Fygmo2 forces the lock and escapes with a bottle from the Special Reserve.',
    disfarceVitoria: function (porco) { return 'Under the leaves was ' + porco + ', caught red-handed trying to escape with the harvest!'; },
    disfarceDerrota: function (porco) { return 'It was real grapes after all... meanwhile, ' + porco + ' escapes with a full basket.'; },
    chizoTurnos: [
      'Fygmo and Fygmo2 creep slowly toward the cellar, hidden among the shadows...',
      'Fygmo signals Fygmo2 to move forward a little more...',
      'You can already hear their footsteps by the cellar door...',
      'Fygmo is already opening the cellar door!'
    ],
    chizoVitoria: 'Chizo wakes up just in time and barks! Fygmo and Fygmo2 run off empty-handed.',
    chizoCedo: 'False alarm — Chizo barely opens one eye and falls back asleep. The pigs wait for him to snore and run off with part of the harvest.',
    chizoTarde: 'Too late... Fygmo and Fygmo2 have already fled with part of the harvest.'
  },

  es: {
    titulo: 'Proteger la Quinta',
    fechaduraSubtitulo: 'La Cerradura de la Reserva Especial',
    disfarcesSubtitulo: '¿Dónde se esconden los disfraces de uva?',
    disfarcesIntro: 'Uno de los montones de uvas ahí delante... no parece muy normal.',
    monteLabel: 'Montón',
    chizoSubtitulo: 'Despierta a Chizo a tiempo',
    chizoExplicacao: 'Los cerdos se acercan solos. Despierta a Chizo en el momento justo: ¡ni demasiado pronto, ni demasiado tarde!',
    chizoComecar: 'Empezar',
    chizoBotao: '¡Despertar a Chizo!',
    protegida: '¡La Quinta está protegida!',
    naoCorreuBem: 'Esta vez no salió bien...',
    jogarNovamente: 'Jugar de Nuevo',
    tentarOutraVez: 'Intentar de Nuevo',
    fechadura: [
      { situacao: 'El Fygmo2 saca el monóculo y mide la cerradura de la Reserva Especial al milímetro, buscando el punto débil.', opcoes: ['Cambiar la cerradura por un candado reforzado', 'Irte y volver mañana', 'Gritar "¿quién anda ahí?" a oscuras'], correta: 0 },
      { situacao: 'Un ruido metálico resuena en la bodega — el Fygmo2 está probando ganzúas distintas en la cerradura.', opcoes: ['Irte a dormir, debe de ser el viento', 'Poner un cerrojo extra en la puerta', 'Abrir la puerta para ver quién es'], correta: 1 },
      { situacao: 'Escondido en las escaleras de la bodega, el Fygmo apunta los prismáticos y hace señas al Fygmo2 para que avance.', opcoes: ['Encender de repente las luces de la bodega', 'Cerrar los ojos y esperar que pase', 'Llamar al Fygmo por su nombre, riendo'], correta: 0 },
      { situacao: 'Con el monóculo puesto, el Fygmo2 pega la oreja a la cerradura de la Reserva Especial para escuchar los engranajes.', opcoes: ['Distraerlo con un cubo que cae haciendo ruido', 'Dejarle una nota simpática', 'Ignorarlo y volver a dormir'], correta: 0 }
    ],
    fechaduraVitoria: 'El Fygmo2 se rinde, guarda el monóculo y huye por el viñedo — la Reserva Especial está a salvo.',
    fechaduraDerrota: 'Demasiado tarde... el Fygmo2 fuerza la cerradura y escapa con una botella de la Reserva Especial.',
    disfarceVitoria: function (porco) { return '¡Debajo de las hojas estaba el ' + porco + ', atrapado con las manos en la masa intentando huir con la cosecha!'; },
    disfarceDerrota: function (porco) { return 'Era solo uva de verdad... mientras tanto, el ' + porco + ' escapa con un cesto lleno.'; },
    chizoTurnos: [
      'Fygmo y Fygmo2 se acercan despacio a la bodega, escondidos entre las sombras...',
      'Fygmo le hace una señal a Fygmo2 para que avance un poco más...',
      'Ya se oyen sus pasos junto a la puerta de la bodega...',
      '¡Fygmo ya está abriendo la puerta de la bodega!'
    ],
    chizoVitoria: '¡Chizo se despierta a tiempo y ladra! Fygmo y Fygmo2 huyen corriendo con las manos vacías.',
    chizoCedo: 'Falsa alarma — Chizo apenas abre un ojo y vuelve a dormirse. Los cerdos esperan a que ronque y huyen con parte de la cosecha.',
    chizoTarde: 'Demasiado tarde... Fygmo y Fygmo2 ya han huido con parte de la cosecha.'
  }
};

function pStr() {
  return PROTEGER_STRINGS[currentLang] || PROTEGER_STRINGS.pt;
}

// Fundo de cada momento do Proteger.
const PROTEGER_FUNDOS = {
  disfarces: { src: 'assets/ecras/apontar_esquerda.jpg' },
  fechadura: { src: 'assets/ecras/adega_juntos.jpg', pos: 'right top' },
  chizo: { src: 'assets/ecras/chizo_vinha.jpg' }
};
const PROTEGER_FUNDO_VITORIA = 'assets/ecras/yoshi_cat_festejar_vitoria.jpg';
// Derrota: cada estilo tem a sua própria imagem (o Chizo já tem imagem
// própria; os outros 2 continuam a partilhar a mesma de sempre).
const PROTEGER_FUNDO_DERROTA = 'assets/ecras/yoshi_cat_cruzados_derrota_3.jpg';
const PROTEGER_FUNDO_DERROTA_CHIZO = 'assets/ecras/chizo_lenco.jpg';

// Guarda qual foi o último estilo jogado, só para showResultProteger()
// saber que imagem de derrota mostrar.
let ultimoTipoProteger = null;

// -----------------------------------------------------------------
// ESTAÇÕES DO ANO (Parte C): não há um mecanismo de "hoje não há
// ataque" — cada vez que se entra em Proteger aparece sempre um dos
// 3 jogos. Por isso a estação muda antes é QUAL jogo é mais provável:
//   Inverno: sem uvas maduras, os porcos vão sempre à Fechadura da
//            reserva (só há isso para roubar).
//   Verão e Outono: uvas maduras, os jogos das uvas (Disfarces e
//            Chizo) ficam bem mais prováveis do que a Fechadura.
//   Primavera: ainda não há uvas que valham a pena, a Fechadura fica
//            mais provável e os jogos das uvas menos.
// -----------------------------------------------------------------
const PESOS_PROTEGER_POR_ESTACAO = {
  inverno: { fechadura: 1, disfarces: 0, chizo: 0 },
  primavera: { fechadura: 0.5, disfarces: 0.25, chizo: 0.25 },
  verao: { fechadura: 0.15, disfarces: 0.425, chizo: 0.425 },
  outono: { fechadura: 0.15, disfarces: 0.425, chizo: 0.425 }
};

function escolherTipoProteger() {
  const pesos = PESOS_PROTEGER_POR_ESTACAO[estacaoAtual()];
  const entradas = Object.keys(pesos).filter(function (tipo) { return pesos[tipo] > 0; });
  const total = entradas.reduce(function (soma, tipo) { return soma + pesos[tipo]; }, 0);
  let r = Math.random() * total;
  for (let i = 0; i < entradas.length; i++) {
    if (r < pesos[entradas[i]]) return entradas[i];
    r -= pesos[entradas[i]];
  }
  return entradas[entradas.length - 1];
}

// -----------------------------------------------------------------
// TEMPO REAL DE SETÚBAL (ver js/tempo.js): nevoeiro e trovoada tornam
// os porcos mais atrevidos — aparecem mais vezes seguidas na mesma
// visita ao Proteger, antes do ecrã de resultado final. Perder uma
// ronda termina a sessão como já acontecia (nunca há perda extra); os
// números ficam em TEMPO_CONFIG.vantagens.rondasExtraProteger.
// -----------------------------------------------------------------
let protegerRondaAtual = 1;
let protegerRondasTotal = 1;
let protegerRecompensaAcumulada = { uvas: 0, gotas: 0, rep: 0 };
let protegerAvisoTexto = '';

// -----------------------------------------------------------------
// LIMITE DIÁRIO DE PRÉMIOS — só as 2 primeiras vitórias de cada dia
// (dia em Lisboa, ver diaLisboaDeHoje() em js/tempo.js) dão Uvas, Gotas
// e Reputação. Depois disso o jogador pode continuar a jogar em "modo
// treino": ganha ou perde à mesma, só sem prémio nenhum.
// -----------------------------------------------------------------
const PROTEGER_VITORIAS_COM_PREMIO_POR_DIA = 2;

function garantirDiaProtegerAtualizado() {
  const hoje = diaLisboaDeHoje();
  if (state.proteger.diaVitoriasLisboa !== hoje) {
    state.proteger.diaVitoriasLisboa = hoje;
    state.proteger.vitoriasComPremioHoje = 0;
  }
}

function vitoriasProtegerComPremioRestantesHoje() {
  garantirDiaProtegerAtualizado();
  return Math.max(0, PROTEGER_VITORIAS_COM_PREMIO_POR_DIA - state.proteger.vitoriasComPremioHoje);
}

function rondasProtegerPorTempo() {
  const tempo = tempoAtual();
  const extra = tempo.disponivel ? (TEMPO_CONFIG.vantagens.rondasExtraProteger[tempo.ceu] || 0) : 0;
  return 1 + extra;
}

function avisoTempoProteger() {
  const tempo = tempoAtual();
  if (!tempo.disponivel) return '';
  if (tempo.ceu === 'trovoada') return t('tempo.avisoTrovoadaProteger');
  if (tempo.ceu === 'nevoeiro') return t('tempo.avisoNevoeiroProteger');
  return '';
}

// Cartão pequeno do topo (título + subtítulo do estilo atual + aviso do
// tempo, se houver, + um indicador extra opcional — ver
// chizoIndicadorHtml()) — igual em qualquer um dos 3 estilos do Proteger.
function protegerTopcardHtml(S, subtitulo, indicadorHtml) {
  return '<div class="topcard">' +
    '<p class="mini-title">' + S.titulo + '</p>' +
    '<p class="mini-sub">' + subtitulo + '</p>' +
    (protegerAvisoTexto ? '<p class="mini-sub">' + protegerAvisoTexto + '</p>' : '') +
    (indicadorHtml || '') +
  '</div>';
}

function startProteger(continuando) {
  if (!continuando) {
    protegerRondaAtual = 1;
    protegerRondasTotal = rondasProtegerPorTempo();
    protegerRecompensaAcumulada = { uvas: 0, gotas: 0, rep: 0 };
    protegerAvisoTexto = avisoTempoProteger();
    if (vitoriasProtegerComPremioRestantesHoje() === 0) {
      protegerAvisoTexto = protegerAvisoTexto ? (protegerAvisoTexto + ' ' + t('proteger.modoTreino')) : t('proteger.modoTreino');
    }
  }
  const tipo = escolherTipoProteger();
  if (tipo === 'fechadura') renderFechadura();
  else if (tipo === 'disfarces') renderDisfarces();
  else iniciarChizo();
}

// -----------------------------------------------------------------
// ESTILO 1 — "A Fechadura da Reserva Especial"
// (mecânica: escolha rápida entre 3 opções, 1 correta)
// -----------------------------------------------------------------

let currentFechaduraIndex = -1;

function renderFechadura() {
  ultimoTipoProteger = 'fechadura';
  const S = pStr();
  currentFechaduraIndex = randInt(0, S.fechadura.length - 1);
  const cena = S.fechadura[currentFechaduraIndex];

  const container = document.getElementById('proteger-container');
  container.innerHTML =
    protegerTopcardHtml(S, S.fechaduraSubtitulo) +
    '<div class="action-panel"><div class="choice-stack">' +
    cena.opcoes.map((op, i) =>
      '<button type="button" class="btn-choice" onclick="responderFechadura(' + i + ')">' + op + '</button>'
    ).join('') +
    '</div></div>';

  definirFundo('foto', PROTEGER_FUNDOS.fechadura.src, PROTEGER_FUNDOS.fechadura.pos);
  atualizarDialogo(cena.situacao, 'YoshiCat');
}

function responderFechadura(i) {
  const S = pStr();
  const cena = S.fechadura[currentFechaduraIndex];
  const venceu = i === cena.correta;
  finishProteger(venceu, venceu ? S.fechaduraVitoria : S.fechaduraDerrota);
}

// -----------------------------------------------------------------
// ESTILO 2 — "Onde se escondem os disfarces de uva?"
// (mecânica: 4 opções, 1 correta)
// -----------------------------------------------------------------

let currentDisfarceIndex = -1;
let currentDisfarcePorco = 'Fygmo';

// Ícone simples de traço para os montes de uvas (substitui o emoji 🍇).
const PROTEGER_UVA_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><circle cx="8" cy="15" r="2.8"></circle><circle cx="14" cy="17" r="2.8"></circle><circle cx="10" cy="10" r="2.8"></circle><circle cx="16" cy="12" r="2.8"></circle><path d="M11 4v3"></path><path d="M11 4c1.3-1.3 2.8-1.7 4.3-1.5"></path></svg>';

function renderDisfarces() {
  ultimoTipoProteger = 'disfarces';
  const S = pStr();
  currentDisfarceIndex = randInt(0, 3);
  currentDisfarcePorco = randInt(0, 1) === 0 ? 'Fygmo' : 'Fygmo2';

  const container = document.getElementById('proteger-container');
  container.innerHTML =
    protegerTopcardHtml(S, S.disfarcesSubtitulo) +
    '<div class="action-panel"><div class="grid-2x2">' +
    [0, 1, 2, 3].map(function (i) {
      return '<button type="button" class="btn-tile" onclick="responderDisfarce(' + i + ')">' + PROTEGER_UVA_SVG + '<span>' + S.monteLabel + ' ' + (i + 1) + '</span></button>';
    }).join('') +
    '</div></div>';

  definirFundo('foto', PROTEGER_FUNDOS.disfarces.src, PROTEGER_FUNDOS.disfarces.pos);
  atualizarDialogo(S.disfarcesIntro, 'YoshiCat');
}

function responderDisfarce(i) {
  const S = pStr();
  const venceu = i === currentDisfarceIndex;
  const mensagem = venceu ? S.disfarceVitoria(currentDisfarcePorco) : S.disfarceDerrota(currentDisfarcePorco);
  finishProteger(venceu, mensagem);
}

// -----------------------------------------------------------------
// ESTILO 3 — "Não acordes o Chizo"
// (mecânica nova: jogo de tempo/reação por turnos)
// -----------------------------------------------------------------

const CHIZO_TOTAL_TURNOS = 4;
const CHIZO_TURNO_CORRETO = CHIZO_TOTAL_TURNOS - 2; // penúltimo turno
const CHIZO_DURACAO_TURNO_MS = 2200;

let chizoTurnoAtual = 0;
let chizoTimerId = null;
let chizoSessao = 0;
let chizoResolvido = false;

// Cancela qualquer relógio do Chizo a correr — chamado quando se
// sai do Proteger pela barra de baixo a meio do minijogo (ver
// LIMPEZA_AO_SAIR_POR_ECRA em js/main.js). Sair conta como desistir:
// sem penalização, só pára o relógio.
function pararTemporizadorProteger() {
  if (chizoTimerId) { clearTimeout(chizoTimerId); chizoTimerId = null; }
  chizoResolvido = true;
  chizoSessao++;
}

// Ícone simples de traço para o Chizo (substitui o emoji 🐶).
const PROTEGER_CAO_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M4 10c0-2 1.5-3 3-3l1.5 2h7L17 7c1.5 0 3 1 3 3v4c0 3-2.5 5-5 5h-6c-2.5 0-5-2-5-5v-4z"></path><path d="M8 19v2"></path><path d="M16 19v2"></path></svg>';

// Indicador pequeno no cartão do topo: quão perto os porcos estão (um
// pontinho aceso por passo já andado, de CHIZO_TOTAL_TURNOS).
function chizoIndicadorHtml(turno) {
  let pontos = '';
  for (let i = 0; i < CHIZO_TOTAL_TURNOS; i++) {
    pontos += '<span class="passo' + (i <= turno ? ' ativo' : '') + '"></span>';
  }
  return '<div class="passos-indicador">' + pontos + '</div>';
}

// O minijogo não começa sozinho: primeiro explica o desafio no balão e
// espera um toque em "Começar" (comecarChizo()) — só aí é que o
// relógio arranca de facto.
function iniciarChizo() {
  ultimoTipoProteger = 'chizo';
  pararTemporizadorProteger();
  chizoTurnoAtual = 0;

  const S = pStr();
  const container = document.getElementById('proteger-container');
  container.innerHTML =
    protegerTopcardHtml(S, S.chizoSubtitulo, chizoIndicadorHtml(-1)) +
    '<div class="action-panel"><button type="button" class="btn-pill pill-main pill-grande" onclick="comecarChizo()">' + S.chizoComecar + '</button></div>';

  definirFundo('foto', PROTEGER_FUNDOS.chizo.src, PROTEGER_FUNDOS.chizo.pos);
  atualizarDialogo(S.chizoExplicacao, 'YoshiCat');
}

function comecarChizo() {
  chizoSessao++;
  const minhaSessao = chizoSessao;
  chizoTurnoAtual = 0;
  chizoResolvido = false;

  renderChizo();
  agendarProximoTurnoChizo(minhaSessao);
}

function agendarProximoTurnoChizo(minhaSessao) {
  chizoTimerId = setTimeout(function () {
    if (minhaSessao !== chizoSessao || chizoResolvido) return;

    chizoTurnoAtual++;
    if (chizoTurnoAtual >= CHIZO_TOTAL_TURNOS) {
      chizoResolvido = true;
      finishProteger(false, pStr().chizoTarde);
      return;
    }

    renderChizo();
    agendarProximoTurnoChizo(minhaSessao);
  }, CHIZO_DURACAO_TURNO_MS);
}

function renderChizo() {
  const S = pStr();
  const container = document.getElementById('proteger-container');
  container.innerHTML =
    protegerTopcardHtml(S, S.chizoSubtitulo, chizoIndicadorHtml(chizoTurnoAtual)) +
    '<div class="action-panel"><button type="button" class="btn-pill pill-main pill-grande" onclick="alertarChizo()">' + PROTEGER_CAO_SVG + ' <span>' + S.chizoBotao + '</span></button></div>';

  definirFundo('foto', PROTEGER_FUNDOS.chizo.src, PROTEGER_FUNDOS.chizo.pos);
  // Exceção às falas sem temporizador (ver mostrarFalas() em
  // js/main.js): dentro do minijogo com tempo, cada passo substitui a
  // mensagem na hora, sem esperar por nenhum toque.
  atualizarDialogo(S.chizoTurnos[chizoTurnoAtual], 'YoshiCat');
}

function alertarChizo() {
  if (chizoResolvido) return;
  chizoResolvido = true;
  if (chizoTimerId) clearTimeout(chizoTimerId);

  const S = pStr();
  if (chizoTurnoAtual === CHIZO_TURNO_CORRETO) {
    finishProteger(true, S.chizoVitoria);
  } else if (chizoTurnoAtual < CHIZO_TURNO_CORRETO) {
    finishProteger(false, S.chizoCedo);
  } else {
    finishProteger(false, S.chizoTarde);
  }
}

// -----------------------------------------------------------------
// RESULTADO COMUM AOS 3 ESTILOS
// -----------------------------------------------------------------

function finishProteger(venceu, mensagem) {
  if (venceu) {
    const ganhaPremio = vitoriasProtegerComPremioRestantesHoje() > 0;
    let uvasGanhas = 0, gotasGanhas = 0, repGanha = 0;

    if (ganhaPremio) {
      uvasGanhas = randInt(6, 12);
      gotasGanhas = randInt(6, 12);
      repGanha = randInt(2, 5);

      state.uvas += uvasGanhas;
      state.gotas += gotasGanhas;
      state.reputacao += repGanha;
      state.proteger.vitoriasComPremioHoje += 1;
      if (typeof marcarObjetivoCumprido === 'function') marcarObjetivoCumprido('proteger_vencer');
    }
    saveState(state);
    updateStatsDisplays();

    protegerRecompensaAcumulada.uvas += uvasGanhas;
    protegerRecompensaAcumulada.gotas += gotasGanhas;
    protegerRecompensaAcumulada.rep += repGanha;

    // Nevoeiro/trovoada: mais um porco aparece nesta mesma visita, sem
    // passar pelo ecrã de resultado (ver rondasProtegerPorTempo acima).
    if (protegerRondaAtual < protegerRondasTotal) {
      protegerRondaAtual++;
      startProteger(true);
      return;
    }

    showResultProteger(true, protegerRecompensaAcumulada.uvas, protegerRecompensaAcumulada.gotas, protegerRecompensaAcumulada.rep, mensagem, ganhaPremio);
  } else {
    showResultProteger(false, 0, 0, 0, mensagem);
  }
}

function showResultProteger(venceu, uvas, gotas, rep, mensagem, ganhaPremio) {
  vibrar(venceu ? 'sucesso' : 'erro');

  const S = pStr();
  const container = document.getElementById('proteger-container');

  // Ganhou: fica só o resultado no balão (a história, depois a
  // recompensa — toca para ver a segunda) e sai-se pela barra de
  // baixo, sem botão nenhum. Perdeu: fica um botão para tentar outra
  // vez, com nome próprio (já não "Jogar Novamente").
  const falas = [mensagem];
  if (venceu && ganhaPremio) {
    falas.push('+' + uvas + ' ' + t('stat.uvas') + ', +' + gotas + ' ' + t('stat.gotas') + ', +' + rep + ' ' + t('stat.reputacao'));
  } else if (venceu && !ganhaPremio) {
    falas.push(t('proteger.modoTreinoResultado'));
  }

  container.innerHTML =
    protegerTopcardHtml(S, venceu ? S.protegida : S.naoCorreuBem) +
    (venceu ? '' : '<div class="action-panel"><button type="button" class="btn-pill pill-main pill-grande" onclick="startProteger()">' + S.tentarOutraVez + '</button></div>');

  const derrotaSrc = ultimoTipoProteger === 'chizo' ? PROTEGER_FUNDO_DERROTA_CHIZO : PROTEGER_FUNDO_DERROTA;
  definirFundo('foto', venceu ? PROTEGER_FUNDO_VITORIA : derrotaSrc);
  mostrarFalas(falas, 'YoshiCat');
}
