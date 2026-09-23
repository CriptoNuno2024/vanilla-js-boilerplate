// ---------------------------------------------------------------------
// PROTEGER A QUINTA (3 estilos de mini-jogo, escolhidos à sorte)
//
// Ecrã mantido tal como estava — apenas relocado para o seu próprio
// ficheiro para organizar o código.
// ---------------------------------------------------------------------

const QUICK_CHOICE_SCENARIOS = [
  { pergunta: 'Qual destes é um inimigo da vinha?', opcoes: ['Traça-da-uva', 'Joaninha', 'Andorinha'], correta: 0 },
  { pergunta: 'O que ajuda a proteger as uvas do calor excessivo?', opcoes: ['Sombra das folhas', 'Regar com água salgada', 'Cortar todos os ramos'], correta: 0 },
  { pergunta: 'Qual destes fungos pode atacar a vinha?', opcoes: ['Oídio', 'Cogumelo-do-campo', 'Fungo-do-pão'], correta: 0 },
  { pergunta: 'Qual destas aves ajuda a controlar pragas na vinha?', opcoes: ['Pinguim', 'Andorinha', 'Avestruz'], correta: 1 },
  { pergunta: 'O que NÃO se deve fazer numa vinha saudável?', opcoes: ['Podar no tempo certo', 'Deixar ervas competirem sem controlo', 'Vigiar as folhas'], correta: 1 }
];

const LOCAL_ICONS = ['🌳', '🛖', '🚜', '🌾'];

let currentQuickChoice = null;
let currentPigIndex = -1;
let rpsState = { playerScore: 0, compScore: 0, round: 0 };

function startProteger() {
  const tipos = ['quick', 'pigs', 'rps'];
  const tipo = tipos[randInt(0, tipos.length - 1)];
  if (tipo === 'quick') renderQuickChoice();
  else if (tipo === 'pigs') renderPigs();
  else {
    rpsState = { playerScore: 0, compScore: 0, round: 0 };
    renderRPS();
  }
}

function renderQuickChoice() {
  currentQuickChoice = QUICK_CHOICE_SCENARIOS[randInt(0, QUICK_CHOICE_SCENARIOS.length - 1)];
  const container = document.getElementById('proteger-container');
  container.innerHTML =
    '<h2>Proteger a Quinta</h2>' +
    '<p class="game-subtitle">Escolha Rápida</p>' +
    '<p class="game-question">' + currentQuickChoice.pergunta + '</p>' +
    '<div class="choice-list">' +
    currentQuickChoice.opcoes.map((op, i) =>
      '<button class="btn btn-secondary" onclick="responderQuickChoice(' + i + ')">' + op + '</button>'
    ).join('') +
    '</div>';
}

function responderQuickChoice(i) {
  finishProteger(i === currentQuickChoice.correta);
}

function renderPigs() {
  currentPigIndex = randInt(0, LOCAL_ICONS.length - 1);
  const container = document.getElementById('proteger-container');
  container.innerHTML =
    '<h2>Proteger a Quinta</h2>' +
    '<p class="game-subtitle">Onde estão os porcos?</p>' +
    '<p class="game-question">Os porcos fugiram e andam a comer as uvas! Escolhe o esconderijo certo.</p>' +
    '<div class="options-grid">' +
    LOCAL_ICONS.map((icon, i) =>
      '<div class="option-card" onclick="responderPigs(' + i + ')">' + icon + '</div>'
    ).join('') +
    '</div>';
}

function responderPigs(i) {
  finishProteger(i === currentPigIndex);
}

function emojiRPS(jogada) {
  return jogada === 'pedra' ? '🪨' : jogada === 'papel' ? '📄' : '✂️';
}

function labelResultado(resultado) {
  return resultado === 'ganhou' ? 'Ganhaste a ronda!' : resultado === 'perdeu' ? 'Perdeste a ronda.' : 'Empate.';
}

function renderRPS(ultimaJogada, ultimaComp, ultimoResultado) {
  const container = document.getElementById('proteger-container');
  const historico = ultimaJogada
    ? '<p class="game-result">Tu: ' + emojiRPS(ultimaJogada) + '  ·  YoshiCat: ' + emojiRPS(ultimaComp) + '<br>' + labelResultado(ultimoResultado) + '</p>'
    : '';

  container.innerHTML =
    '<h2>Proteger a Quinta</h2>' +
    '<p class="game-subtitle">Pedra, Papel ou Tesoura (melhor de 3)</p>' +
    '<p class="game-question">Placar: Tu ' + rpsState.playerScore + ' — ' + rpsState.compScore + ' YoshiCat</p>' +
    historico +
    '<div class="rps-row">' +
    '<button class="rps-btn" onclick="playRPS(\'pedra\')">🪨</button>' +
    '<button class="rps-btn" onclick="playRPS(\'papel\')">📄</button>' +
    '<button class="rps-btn" onclick="playRPS(\'tesoura\')">✂️</button>' +
    '</div>';
}

function playRPS(escolha) {
  const opcoes = ['pedra', 'papel', 'tesoura'];
  const comp = opcoes[randInt(0, 2)];
  let resultado;

  if (escolha === comp) {
    resultado = 'empate';
  } else if (
    (escolha === 'pedra' && comp === 'tesoura') ||
    (escolha === 'papel' && comp === 'pedra') ||
    (escolha === 'tesoura' && comp === 'papel')
  ) {
    resultado = 'ganhou';
    rpsState.playerScore++;
  } else {
    resultado = 'perdeu';
    rpsState.compScore++;
  }

  rpsState.round++;

  if (rpsState.playerScore === 2 || rpsState.compScore === 2) {
    const venceu = rpsState.playerScore === 2;
    renderRPS(escolha, comp, resultado);
    setTimeout(() => finishProteger(venceu), 900);
  } else {
    renderRPS(escolha, comp, resultado);
  }
}

function finishProteger(venceu) {
  if (venceu) {
    const uvasGanhas = randInt(6, 12);
    const gotasGanhas = randInt(6, 12);
    const repGanha = randInt(2, 5);

    state.uvas += uvasGanhas;
    state.gotas += gotasGanhas;
    state.reputacao += repGanha;
    saveState(state);
    updateStatsDisplays();

    showResultProteger(true, uvasGanhas, gotasGanhas, repGanha);
  } else {
    showResultProteger(false);
  }
}

function showResultProteger(venceu, uvas, gotas, rep) {
  const container = document.getElementById('proteger-container');
  container.innerHTML =
    '<h2>' + (venceu ? 'A Quinta está protegida!' : 'Desta vez não correu bem...') + '</h2>' +
    '<p class="game-question">' +
    (venceu
      ? '+' + uvas + ' Uvas, +' + gotas + ' Gotas, +' + rep + ' Reputação'
      : 'A vinha sofreu um pequeno dano. Tenta outra vez para a proteger.') +
    '</p>' +
    '<button class="btn btn-primary" onclick="startProteger()">Jogar Novamente</button>';
}
