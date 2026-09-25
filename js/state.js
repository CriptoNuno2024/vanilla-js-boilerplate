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

const STORAGE_KEY = 'yoshicat_quinta_state_v2';

function defaultState() {
  return {
    uvas: 0,
    gotas: 0,
    reputacao: 0,
    garrafas: 0,
    conhecimento: 0,
    lang: 'pt',
    ultimaGarrafaData: null,
    encyclopedia: {
      unlocked: []
    },
    vinha: {
      fase: 'preparar', // preparar -> preparada -> crescendo -> pronta -> (colher) -> preparar
      pontosCuidado: 0,
      residuos: 0,
      adubo: 0,
      cooldowns: {}
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
  // FUTURO: substituir esta linha por uma chamada à API (ver nota acima).
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
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
