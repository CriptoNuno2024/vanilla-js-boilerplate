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
    chizoSubtitulo: 'Não acordes o Chizo',
    chizoBotao: '🐶 Alertar o Chizo!',
    protegida: 'A Quinta está protegida!',
    naoCorreuBem: 'Desta vez não correu bem...',
    jogarNovamente: 'Jogar Novamente',
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
      'Estão quase a meio caminho da porta da adega...',
      'Só mais um passo e chegam à porta!'
    ],
    chizoVitoria: 'O Chizo acorda a tempo e ladra! O Fygmo e o Fygmo2 fogem a correr, de mãos a abanar.',
    chizoCedo: 'Falso alarme — o Chizo mal abre um olho e volta a adormecer. O Fygmo e o Fygmo2 continuam a aproximar-se.',
    chizoTarde: 'Tarde demais... o Fygmo e o Fygmo2 já fugiram com parte da colheita.'
  },

  en: {
    titulo: 'Protect the Farm',
    fechaduraSubtitulo: 'The Special Reserve Lock',
    disfarcesSubtitulo: 'Where are the grape disguises hiding?',
    disfarcesIntro: "One of the grape piles up ahead... doesn't look quite right.",
    monteLabel: 'Pile',
    chizoSubtitulo: "Don't wake up Chizo",
    chizoBotao: '🐶 Alert Chizo!',
    protegida: 'The Farm is protected!',
    naoCorreuBem: "It didn't go well this time...",
    jogarNovamente: 'Play Again',
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
      "They're almost halfway to the cellar door...",
      'Just one more step and they reach the door!'
    ],
    chizoVitoria: 'Chizo wakes up just in time and barks! Fygmo and Fygmo2 run off empty-handed.',
    chizoCedo: 'False alarm — Chizo barely opens one eye and falls back asleep. Fygmo and Fygmo2 keep creeping closer.',
    chizoTarde: 'Too late... Fygmo and Fygmo2 have already fled with part of the harvest.'
  },

  es: {
    titulo: 'Proteger la Quinta',
    fechaduraSubtitulo: 'La Cerradura de la Reserva Especial',
    disfarcesSubtitulo: '¿Dónde se esconden los disfraces de uva?',
    disfarcesIntro: 'Uno de los montones de uvas ahí delante... no parece muy normal.',
    monteLabel: 'Montón',
    chizoSubtitulo: 'No despiertes al Chizo',
    chizoBotao: '🐶 ¡Alertar al Chizo!',
    protegida: '¡La Quinta está protegida!',
    naoCorreuBem: 'Esta vez no salió bien...',
    jogarNovamente: 'Jugar de Nuevo',
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
      'El Fygmo y el Fygmo2 se acercan despacio a la bodega, escondidos entre las sombras...',
      'El Fygmo le hace una señal al Fygmo2 para que avance un poco más...',
      'Ya están casi a mitad de camino de la puerta de la bodega...',
      '¡Un paso más y llegan a la puerta!'
    ],
    chizoVitoria: '¡El Chizo se despierta a tiempo y ladra! El Fygmo y el Fygmo2 huyen corriendo con las manos vacías.',
    chizoCedo: 'Falsa alarma — el Chizo apenas abre un ojo y vuelve a dormirse. El Fygmo y el Fygmo2 siguen acercándose.',
    chizoTarde: 'Demasiado tarde... el Fygmo y el Fygmo2 ya han huido con parte de la cosecha.'
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

function startProteger() {
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
    '<h2>' + S.titulo + '</h2>' +
    '<p class="game-subtitle">' + S.fechaduraSubtitulo + '</p>' +
    '<p class="game-question">' + cena.situacao + '</p>' +
    '<div class="choice-list">' +
    cena.opcoes.map((op, i) =>
      '<button class="btn btn-secondary" onclick="responderFechadura(' + i + ')">' + op + '</button>'
    ).join('') +
    '</div>';

  definirFundo('foto', PROTEGER_FUNDOS.fechadura.src, PROTEGER_FUNDOS.fechadura.pos);
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

function renderDisfarces() {
  ultimoTipoProteger = 'disfarces';
  const S = pStr();
  currentDisfarceIndex = randInt(0, 3);
  currentDisfarcePorco = randInt(0, 1) === 0 ? 'Fygmo' : 'Fygmo2';

  const container = document.getElementById('proteger-container');
  container.innerHTML =
    '<h2>' + S.titulo + '</h2>' +
    '<p class="game-subtitle">' + S.disfarcesSubtitulo + '</p>' +
    '<p class="game-question">' + S.disfarcesIntro + '</p>' +
    '<div class="options-grid">' +
    [0, 1, 2, 3].map(function (i) {
      return '<div class="option-card" onclick="responderDisfarce(' + i + ')">🍇<div class="option-label">' + S.monteLabel + ' ' + (i + 1) + '</div></div>';
    }).join('') +
    '</div>';

  definirFundo('foto', PROTEGER_FUNDOS.disfarces.src, PROTEGER_FUNDOS.disfarces.pos);
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

function iniciarChizo() {
  ultimoTipoProteger = 'chizo';
  chizoSessao++;
  const minhaSessao = chizoSessao;
  chizoTurnoAtual = 0;
  chizoResolvido = false;
  if (chizoTimerId) clearTimeout(chizoTimerId);

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
    '<h2>' + S.titulo + '</h2>' +
    '<p class="game-subtitle">' + S.chizoSubtitulo + '</p>' +
    '<p class="game-question">' + S.chizoTurnos[chizoTurnoAtual] + '</p>' +
    '<button class="btn btn-primary" onclick="alertarChizo()">' + S.chizoBotao + '</button>';

  definirFundo('foto', PROTEGER_FUNDOS.chizo.src, PROTEGER_FUNDOS.chizo.pos);
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
    const uvasGanhas = randInt(6, 12);
    const gotasGanhas = randInt(6, 12);
    const repGanha = randInt(2, 5);

    state.uvas += uvasGanhas;
    state.gotas += gotasGanhas;
    state.reputacao += repGanha;
    saveState(state);
    updateStatsDisplays();

    showResultProteger(true, uvasGanhas, gotasGanhas, repGanha, mensagem);
  } else {
    showResultProteger(false, 0, 0, 0, mensagem);
  }
}

function showResultProteger(venceu, uvas, gotas, rep, mensagem) {
  const S = pStr();
  const container = document.getElementById('proteger-container');
  container.innerHTML =
    '<h2>' + (venceu ? S.protegida : S.naoCorreuBem) + '</h2>' +
    '<p class="game-question">' + mensagem + '</p>' +
    (venceu ? '<p class="game-result">+' + uvas + ' ' + t('stat.uvas') + ', +' + gotas + ' ' + t('stat.gotas') + ', +' + rep + ' ' + t('stat.reputacao') + '</p>' : '') +
    '<button class="btn btn-primary" onclick="startProteger()">' + S.jogarNovamente + '</button>';

  const derrotaSrc = ultimoTipoProteger === 'chizo' ? PROTEGER_FUNDO_DERROTA_CHIZO : PROTEGER_FUNDO_DERROTA;
  definirFundo('foto', venceu ? PROTEGER_FUNDO_VITORIA : derrotaSrc);
}
