// ---------------------------------------------------------------------
// ESTADO DO JOGO (persistido em localStorage)
//
// NOTA / FUTURO: neste momento todo o progresso (Uvas, Gotas, Reputação,
// Garrafas, Conhecimento, estado da Vinha, Enciclopédia, etc.) é
// guardado apenas no localStorage do browser do jogador. Quando existir
// um backend/API real, as funções loadState() e saveState() abaixo
// devem passar a fazer GET/POST a essa API (ex.: fetch('/api/estado'))
// em vez de ler/escrever no localStorage, para que o progresso fique
// guardado no servidor e seja possível mostrar um ranking partilhado
// entre todos os jogadores.
// ---------------------------------------------------------------------

// Ligação ao Telegram — criada aqui (o primeiro ficheiro a carregar)
// para que js/nuvem.js a possa usar já. tg.ready()/tg.expand() continuam
// a ser chamados em js/main.js, como antes.
const tg = window.Telegram.WebApp;

const STORAGE_KEY = 'yoshicat_quinta_state_v2';

function defaultState() {
  return {
    uvas: 0,
    gotas: 0,
    reputacao: 0,
    garrafas: 0,
    conhecimento: 0,
    lang: 'pt',
    // Interruptor "Vibração" no Perfil (ver js/perfil.js) — ligado por
    // omissão. Só controla se vibrar() (js/main.js) chega a chamar o
    // HapticFeedback do Telegram; fora do Telegram não tem efeito nenhum.
    vibracao: true,
    ultimaGarrafaData: null,
    // Data/hora (Date.now()) da última vez que o progresso foi gravado
    // neste aparelho — usada por js/nuvem.js para saber se o localStorage
    // ou o CloudStorage do Telegram têm a versão mais recente.
    ultimaGravacaoEm: 0,
    encyclopedia: {
      unlocked: []
    },
    vinha: {
      fase: 'preparar', // preparar -> preparada -> crescendo -> pronta -> (colher) -> preparar
      pontosCuidado: 0,
      residuos: 0,
      adubo: 0,
      cooldowns: {},
      // Poda (ver REGRAS_PODA em js/vinha.js): invernoPodado guarda o
      // id do último inverno em que já se podou (ex: "2026-2027"), e
      // bonusPoda fica true até ser gasto na próxima vindima.
      invernoPodado: null,
      bonusPoda: false
    },
    // Capítulo da Adega (ver js/garrafa.js). Tudo novo, só acrescentado
    // ao estado — nenhum campo antigo (uvas, gotas, garrafas,
    // reputacao, ultimaGarrafaData, ...) foi tocado ou renomeado.
    adega: {
      bagaco: 0,
      aguardente: 0,
      cooldowns: {},
      lote: null,       // { iniciadoEm: <timestamp> } enquanto um lote descansa na Cave, ou null
      historico: []     // uma entrada por garrafa: { data, estacao, diasDescanso }
    },
    // Tempo real de Setúbal (ver js/tempo.js). Guarda só o dia local
    // (ex: "2026-01-15") em que cada tarefa/efeito ligado ao tempo já
    // aconteceu, para as tarefas extra ficarem "uma vez por dia".
    tempo: {
      chuvaRegouDia: null,
      estacasDia: null,
      frioDia: null
    },
    // Festas (ver js/festas.js). tarefasDia guarda, por "idDaFesta_tarefa"
    // (ex: "saomartinho_castanhas"), o dia local em que essa tarefa já foi
    // feita — assim uma festa nova só precisa de ser acrescentada à lista
    // FESTAS_CONFIG, sem mexer aqui.
    festas: {
      tarefasDia: {}
    },
    // Limite diário de vitórias com prémio no Proteger (ver js/proteger.js
    // e diaLisboaDeHoje() em js/tempo.js — usa sempre o dia em Lisboa,
    // independente do fuso do jogador).
    proteger: {
      diaVitoriasLisboa: null,
      vitoriasComPremioHoje: 0
    },
    // Níveis da Quinta (ver js/niveis.js), calculados a partir da
    // Reputação total. nivelMostrado: null significa "ainda por decidir" —
    // a primeira vez que o jogo corre (mesmo para quem já tinha
    // progresso), calcula-se o nível real e guarda-se aqui sem mostrar
    // nenhum balão, para nunca "spammar" subidas de nível antigas.
    niveis: {
      nivelMostrado: null
    },
    // Objetivos diários "Hoje na Quinta" (ver js/objetivos.js). dia usa
    // sempre o dia em Lisboa. selosTotal nunca desce, mesmo que um dia
    // fique incompleto.
    objetivos: {
      dia: null,
      lista: [],
      bonusDiaDado: false,
      selosTotal: 0
    }
  };
}

// Combina o estado guardado com o estado por omissão, campo a campo,
// para que novos campos introduzidos no jogo não se percam nem quebrem
// saves antigos.
function mergeDeep(base, saved) {
  const result = Array.isArray(base) ? base.slice() : Object.assign({}, base);
  for (const key in saved) {
    const baseVal = base[key];
    const savedVal = saved[key];
    if (savedVal && typeof savedVal === 'object' && !Array.isArray(savedVal) && baseVal && typeof baseVal === 'object') {
      result[key] = mergeDeep(baseVal, savedVal);
    } else {
      result[key] = savedVal;
    }
  }
  return result;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return mergeDeep(defaultState(), JSON.parse(raw));
  } catch (e) {
    return defaultState();
  }
}

function saveState(s) {
  s.ultimaGravacaoEm = Date.now();
  // FUTURO: substituir esta linha por uma chamada à API (ver nota acima).
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  // Guarda também na nuvem do Telegram (js/nuvem.js) — nunca substitui o
  // localStorage acima, só acrescenta uma segunda cópia de segurança.
  nuvemGuardarEstadoComAtraso(s);
}

let state = loadState();

function updateStatsDisplays() {
  document.querySelectorAll('.val-uvas').forEach(function (el) { el.textContent = state.uvas; });
  document.querySelectorAll('.val-gotas').forEach(function (el) { el.textContent = state.gotas; });
  document.querySelectorAll('.val-reputacao').forEach(function (el) { el.textContent = state.reputacao; });
  document.querySelectorAll('.val-garrafas').forEach(function (el) { el.textContent = state.garrafas; });
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
