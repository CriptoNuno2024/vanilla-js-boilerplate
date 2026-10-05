// ---------------------------------------------------------------------
// SOM (efeitos curtos, sem música) — Web Audio API.
//
// Regra dos telemóveis: um AudioContext só pode começar (ou sair de
// "suspended") depois de um toque a sério do jogador — por isso o
// contexto só é criado dentro do primeiro clique/toque real, nunca ao
// carregar o jogo (ver somDesbloquearAoPrimeiroToque() abaixo).
//
// Respeita sempre o interruptor "Som" do Perfil (state.som, ligado por
// omissão — ver js/state.js e js/perfil.js): se estiver desligado, esta
// peça inteira fica muda e nunca cria nada.
//
// Esconder a app (trocar de separador, minimizar o Telegram, apagar o
// ecrã) pausa tudo; ao voltar, só retoma se "Som" continuar ligado.
// ---------------------------------------------------------------------

let somCtx = null;
let somGainMestre = null;
let somGainAmbiente = null;
let somFonteAmbiente = null;
let somCaminhoAmbienteAtual = null;
let somGainFonteAmbiente = null; // só existe quando o ambiente atual tem desvanecimento
let somSairAmbienteS = 0;        // segundos de desvanecimento ao parar esse ambiente (0 = pára logo)
const somFicheirosCache = {}; // caminho -> Promise<AudioBuffer|null>, para nunca descarregar o mesmo ficheiro duas vezes

function somCriarContextoSePreciso() {
  if (somCtx) return;
  const AudioContextClasse = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClasse) return; // navegador sem Web Audio API: o som nunca toca, sem rebentar o resto do jogo
  somCtx = new AudioContextClasse();
  somGainMestre = somCtx.createGain();
  somGainMestre.gain.value = 1;
  somGainMestre.connect(somCtx.destination);
  somGainAmbiente = somCtx.createGain();
  somGainAmbiente.gain.value = 0.15; // volume baixo por omissão (ex.: chuva de fundo — Parte B)
  somGainAmbiente.connect(somGainMestre);
}

function somPodeTocar() {
  return !!(state.som && somCtx && somGainMestre);
}

function somDesbloquearAoPrimeiroToque() {
  if (!state.som) return;
  somCriarContextoSePreciso();
  if (somCtx && somCtx.state === 'suspended') somCtx.resume();
}
document.addEventListener('pointerdown', somDesbloquearAoPrimeiroToque, { once: true });

document.addEventListener('visibilitychange', function () {
  if (!somCtx) return;
  if (document.hidden) {
    somCtx.suspend();
  } else if (state.som) {
    somCtx.resume();
  }
});

// Chamada pelo interruptor "Som" do Perfil (ver alternarSom() em
// js/perfil.js) — desligar pára logo o ambiente e suspende o contexto;
// ligar cria o contexto se ainda não existir (o próprio toque no
// interruptor já conta como o toque real do jogador) e retoma.
function somAplicarInterruptor(ligada) {
  if (!ligada) {
    pararSomAmbiente(true);
    if (somCtx) somCtx.suspend();
    return;
  }
  somCriarContextoSePreciso();
  if (somCtx && somCtx.state === 'suspended') somCtx.resume();
}

// ---------------------------------------------------------------------
// SONS SINTETIZADOS — curtos (menos de 1 segundo), sem ficheiros.
// ---------------------------------------------------------------------

function somTocarTom(freq, inicioOffset, duracao, tipoOnda, volume) {
  const t0 = somCtx.currentTime + (inicioOffset || 0);
  const osc = somCtx.createOscillator();
  osc.type = tipoOnda || 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  const gain = somCtx.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duracao);
  osc.connect(gain);
  gain.connect(somGainMestre);
  osc.start(t0);
  osc.stop(t0 + duracao + 0.05);
}

// "Pop!" de rolha (Engarrafar na Adega) — um estouro curto de ruído
// filtrado, não um tom, para soar mesmo a rolha e não a um "bip".
function somTocarEstouro() {
  const t0 = somCtx.currentTime;
  const duracao = 0.12;
  const amostras = Math.floor(somCtx.sampleRate * duracao);
  const buffer = somCtx.createBuffer(1, amostras, somCtx.sampleRate);
  const dados = buffer.getChannelData(0);
  for (let i = 0; i < amostras; i++) {
    dados[i] = (Math.random() * 2 - 1) * (1 - i / amostras); // ruído branco a apagar-se
  }
  const fonte = somCtx.createBufferSource();
  fonte.buffer = buffer;
  const filtro = somCtx.createBiquadFilter();
  filtro.type = 'bandpass';
  filtro.frequency.setValueAtTime(1200, t0);
  filtro.frequency.exponentialRampToValueAtTime(400, t0 + duracao);
  const gain = somCtx.createGain();
  gain.gain.setValueAtTime(0.3, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duracao);
  fonte.connect(filtro);
  filtro.connect(gain);
  gain.connect(somGainMestre);
  fonte.start(t0);
}

// Ruído filtrado curto (terra, água, rangido): ruído branco ou "castanho"
// (mais grave) passado por um filtro cuja frequência desliza de freqIni
// para freqFim. Menos de 0,3 s; volume baixo.
function somTocarRuidoFiltrado(inicioOffset, duracao, tipoFiltro, freqIni, freqFim, volume, castanho) {
  const t0 = somCtx.currentTime + (inicioOffset || 0);
  const amostras = Math.floor(somCtx.sampleRate * duracao);
  const buffer = somCtx.createBuffer(1, amostras, somCtx.sampleRate);
  const dados = buffer.getChannelData(0);
  let ultimo = 0;
  for (let i = 0; i < amostras; i++) {
    const branco = Math.random() * 2 - 1;
    if (castanho) {
      ultimo = (ultimo + 0.02 * branco) / 1.02; // ruído castanho: só graves
      dados[i] = ultimo * 3.5;
    } else {
      dados[i] = branco;
    }
  }
  const fonte = somCtx.createBufferSource();
  fonte.buffer = buffer;
  const filtro = somCtx.createBiquadFilter();
  filtro.type = tipoFiltro;
  filtro.frequency.setValueAtTime(freqIni, t0);
  filtro.frequency.exponentialRampToValueAtTime(freqFim, t0 + duracao);
  const gain = somCtx.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duracao);
  fonte.connect(filtro);
  filtro.connect(gain);
  gain.connect(somGainMestre);
  fonte.start(t0);
}

// Tom grave que desce devagar (parte do rangido da prensa).
function somTocarTomDescendente(freqIni, freqFim, duracao, volume) {
  const t0 = somCtx.currentTime;
  const osc = somCtx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freqIni, t0);
  osc.frequency.exponentialRampToValueAtTime(freqFim, t0 + duracao);
  const gain = somCtx.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duracao);
  osc.connect(gain);
  gain.connect(somGainMestre);
  osc.start(t0);
  osc.stop(t0 + duracao + 0.02);
}

// Botão de área trancada (cadeado) — som abafado curto (tom grave
// passado por um filtro passa-baixo), nunca irritante.
function somTocarAbafado() {
  const t0 = somCtx.currentTime;
  const duracao = 0.1;
  const osc = somCtx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(140, t0);
  const filtro = somCtx.createBiquadFilter();
  filtro.type = 'lowpass';
  filtro.frequency.setValueAtTime(300, t0);
  const gain = somCtx.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(0.18, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duracao);
  osc.connect(filtro);
  filtro.connect(gain);
  gain.connect(somGainMestre);
  osc.start(t0);
  osc.stop(t0 + duracao + 0.05);
}

const SOM_EFEITOS = {
  // Objetivo do "Hoje na Quinta" cumprido — "ding" suave.
  objetivoCumprido: function () { somTocarTom(880, 0, 0.18, 'sine', 0.2); },
  // Subir de nível — sino/acorde alegre (3 notas a subir).
  subiuNivel: function () {
    somTocarTom(523.25, 0, 0.15, 'triangle', 0.22);
    somTocarTom(659.25, 0.1, 0.15, 'triangle', 0.22);
    somTocarTom(783.99, 0.2, 0.3, 'triangle', 0.24);
  },
  // Vitória no Proteger — pequena fanfarra de 3 notas.
  protegerVitoria: function () {
    somTocarTom(523.25, 0, 0.12, 'square', 0.18);
    somTocarTom(659.25, 0.12, 0.12, 'square', 0.18);
    somTocarTom(1046.5, 0.24, 0.25, 'square', 0.2);
  },
  // Derrota no Proteger — duas notas a descer, suaves.
  protegerDerrota: function () {
    somTocarTom(392, 0, 0.2, 'sine', 0.18);
    somTocarTom(293.66, 0.18, 0.3, 'sine', 0.16);
  },
  // Engarrafar na Adega — "pop!" de rolha.
  engarrafarPop: function () { somTocarEstouro(); },
  // Botão de área trancada (cadeado) — som abafado curto.
  ecraTrancado: function () { somTocarAbafado(); },
  // Os sons seguintes são todos curtos (menos de 0,3 s) e mais baixos que o
  // "objetivoCumprido" (volume máximo 0,15 contra 0,2).
  // Cavar na Vinha — "tchuf" de terra: ruído castanho grave a ficar mais grave.
  cavar: function () { somTocarRuidoFiltrado(0, 0.22, 'lowpass', 600, 120, 0.15, true); },
  // Regar na Vinha — fio de água (ruído passa-banda) e 3 pingos a descer.
  regar: function () {
    somTocarRuidoFiltrado(0, 0.26, 'bandpass', 2500, 1500, 0.05, false);
    somTocarTom(1300, 0, 0.07, 'sine', 0.1);
    somTocarTom(1050, 0.08, 0.07, 'sine', 0.1);
    somTocarTom(820, 0.16, 0.08, 'sine', 0.1);
  },
  // Colher na Vinha — "tchic" de tesoura e 2 notas rápidas a subir.
  colher: function () {
    somTocarRuidoFiltrado(0, 0.04, 'bandpass', 3500, 3000, 0.1, false);
    somTocarTom(784, 0.04, 0.09, 'triangle', 0.13);
    somTocarTom(1174.66, 0.12, 0.12, 'triangle', 0.13);
  },
  // Prensar na Adega — rangido: tom grave a descer devagar + ruído grave.
  prensar: function () {
    somTocarTomDescendente(170, 70, 0.27, 0.14);
    somTocarRuidoFiltrado(0, 0.27, 'bandpass', 500, 200, 0.07, false);
  },
  // Nova entrada da Enciclopédia (cartão "Nova entrada!") — 2 notas a subir,
  // como uma página a virar.
  novaEntrada: function () {
    somTocarTom(659.25, 0, 0.1, 'triangle', 0.12);
    somTocarTom(880, 0.09, 0.14, 'triangle', 0.12);
  }
};

function tocarSom(nome) {
  if (!somPodeTocar()) return;
  const efeito = SOM_EFEITOS[nome];
  if (efeito) efeito();
}

// ---------------------------------------------------------------------
// FICHEIROS DE SOM — preparado para a Parte B (cão, porcos, chuva,
// trovão). Cada ficheiro só é descarregado na primeira vez que é
// preciso; depois fica em cache para as próximas vezes.
// ---------------------------------------------------------------------

function somCarregarFicheiro(caminho) {
  if (!somFicheirosCache[caminho]) {
    somFicheirosCache[caminho] = fetch(caminho)
      .then(function (resposta) { return resposta.arrayBuffer(); })
      .then(function (dados) { return somCtx.decodeAudioData(dados); })
      .catch(function () {
        delete somFicheirosCache[caminho];
        return null;
      });
  }
  return somFicheirosCache[caminho];
}

function tocarSomFicheiro(caminho, volume) {
  if (!somPodeTocar()) return;
  somCarregarFicheiro(caminho).then(function (buffer) {
    if (!buffer || !somPodeTocar()) return;
    const fonte = somCtx.createBufferSource();
    fonte.buffer = buffer;
    const gain = somCtx.createGain();
    gain.gain.value = volume == null ? 1 : volume;
    fonte.connect(gain);
    gain.connect(somGainMestre);
    fonte.start();
  });
}

// ---------------------------------------------------------------------
// SOM DE AMBIENTE EM CICLO (ex.: chuva) — volume baixo, só um de cada
// vez. Para sozinho ao desligar o som (somAplicarInterruptor acima) ou
// ao mudar de ecrã (ver pararSomAmbiente() chamado em goTo(),
// js/main.js), quando fizer sentido a Parte B ligar isto a algum ecrã.
//
// Desvanecimento OPCIONAL: iniciarSomAmbiente(caminho, volume, { entrarS,
// sairS }) entra em fundo durante entrarS segundos e, mais tarde, quando
// pararSomAmbiente() é chamado sem argumentos (ex.: por goTo()), sai em
// fundo durante sairS segundos. Sem o 3.º argumento (chuva, trovoada)
// nada muda: entra e pára de repente, como sempre.
// ---------------------------------------------------------------------

function iniciarSomAmbiente(caminho, volume, desvanecer) {
  if (!state.som) return;
  // Com desvanecimento, chamar outra vez enquanto o mesmo som ainda está a
  // carregar também não o repete (idempotente).
  if (somCaminhoAmbienteAtual === caminho && (somFonteAmbiente || desvanecer)) return; // já a tocar este
  pararSomAmbiente();
  somCriarContextoSePreciso();
  if (!somPodeTocar()) return;
  somCaminhoAmbienteAtual = caminho;
  somCarregarFicheiro(caminho).then(function (buffer) {
    if (!buffer || somCaminhoAmbienteAtual !== caminho || !somPodeTocar()) return;
    if (volume != null) somGainAmbiente.gain.value = volume;
    const fonte = somCtx.createBufferSource();
    fonte.buffer = buffer;
    fonte.loop = true;
    if (desvanecer && (desvanecer.entrarS > 0 || desvanecer.sairS > 0)) {
      const ganho = somCtx.createGain();
      const t0 = somCtx.currentTime;
      ganho.gain.setValueAtTime(0, t0);
      ganho.gain.linearRampToValueAtTime(1, t0 + (desvanecer.entrarS > 0 ? desvanecer.entrarS : 0.01));
      fonte.connect(ganho);
      ganho.connect(somGainAmbiente);
      somGainFonteAmbiente = ganho;
      somSairAmbienteS = desvanecer.sairS > 0 ? desvanecer.sairS : 0;
    } else {
      fonte.connect(somGainAmbiente);
      somGainFonteAmbiente = null;
      somSairAmbienteS = 0;
    }
    fonte.start();
    somFonteAmbiente = fonte;
  });
}

// instantaneo = true ignora o desvanecimento de saída (ex.: ao desligar "Som").
function pararSomAmbiente(instantaneo) {
  somCaminhoAmbienteAtual = null;
  if (somFonteAmbiente) {
    const fonte = somFonteAmbiente;
    const ganho = somGainFonteAmbiente;
    const sair = somSairAmbienteS;
    somFonteAmbiente = null;
    somGainFonteAmbiente = null;
    somSairAmbienteS = 0;
    if (ganho && sair > 0 && !instantaneo && somCtx) {
      const t0 = somCtx.currentTime;
      ganho.gain.cancelScheduledValues(t0);
      ganho.gain.setValueAtTime(ganho.gain.value, t0);
      ganho.gain.linearRampToValueAtTime(0, t0 + sair);
      try { fonte.stop(t0 + sair + 0.05); } catch (e) { /* já tinha parado sozinho */ }
    } else {
      try { fonte.stop(); } catch (e) { /* já tinha parado sozinho */ }
    }
  }
}
