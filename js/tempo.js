// ---------------------------------------------------------------------
// TEMPO REAL DE SETÚBAL — Open-Meteo (grátis, sem chave)
//
// Vai buscar o estado do céu, a temperatura e o vento em Setúbal, no
// máximo uma vez por hora (guarda a resposta entretanto em
// localStorage). Se não houver internet ou o serviço falhar, o jogo
// continua normalmente, só com a estação (ver js/estacoes.js) — nunca
// mostra erros ao jogador.
//
// Para testar: acrescenta ?tempo=sol (ou chuva / calor / nevoeiro /
// trovoada / vento / frio) ao endereço. Funciona junto com ?estacao=.
//
// ===================================================================
// TEMPO_CONFIG — tudo o que rege o tempo está só aqui: limites,
// vantagens e imagens. Para trocar um limite, uma percentagem, ou
// passar a uma versão com risco (em vez de só vantagens), muda só
// este bloco — o resto do código nunca tem estes números espalhados.
// ===================================================================
const TEMPO_CONFIG = {
  latitude: 38.52,
  longitude: -8.89,
  intervaloMinimoMs: 60 * 60 * 1000, // no máximo 1 pedido por hora

  limites: {
    calorForteC: 30,   // acima disto conta como calor forte
    frioForteC: 3,     // abaixo disto conta como frio forte
    ventoForteKmh: 40  // a partir disto conta como vento forte
  },

  vantagens: {
    // Regar em calor forte dá cerca de +50% de cuidado.
    calorMultiplicadorRegar: 1.5,
    // Nevoeiro e trovoada: os porcos "atacam mais vezes" no Proteger —
    // rondas extra, uma seguida à outra, na mesma visita.
    rondasExtraProteger: { nevoeiro: 1, trovoada: 1 }
  },

  // Todas em assets/ecras, recorte ao centro (mesma regra de caixa de
  // imagem que o resto do jogo já usa, via definirFundo('foto', src)).
  imagens: {
    chuva: 'assets/ecras/tempo_chuva.jpg',
    calor: 'assets/ecras/calor.jpg',
    nevoeiro: 'assets/ecras/nevoeiro_1.jpg',
    trovoada: 'assets/ecras/trovoada_chizo.jpg',
    vento: 'assets/ecras/vento.jpg',
    repararEstacas: 'assets/ecras/tempestade.jpg',
    protegerFrio: 'assets/ecras/proteger.jpg'
  }
};

const TEMPO_CACHE_KEY = 'yoshicat_tempo_cache_v1';
const TEMPO_FETCH_TIMEOUT_MS = 8000;

// Códigos do tempo (WMO) devolvidos pela Open-Meteo, agrupados no céu
// que nos interessa. Códigos não listados (ex: neve, rara em Setúbal)
// caem em 'sol' por omissão.
const TEMPO_CEU_POR_WEATHERCODE = {
  45: 'nevoeiro', 48: 'nevoeiro',
  51: 'chuva', 53: 'chuva', 55: 'chuva', 56: 'chuva', 57: 'chuva',
  61: 'chuva', 63: 'chuva', 65: 'chuva', 66: 'chuva', 67: 'chuva',
  80: 'chuva', 81: 'chuva', 82: 'chuva',
  95: 'trovoada', 96: 'trovoada', 99: 'trovoada'
};

function classificarCeu(weathercode) {
  return TEMPO_CEU_POR_WEATHERCODE[weathercode] || 'sol';
}

// Dia local do jogador em "YYYY-MM-DD", só para guardar "já feito hoje"
// (chuva a regar sozinha, Reparar as Estacas, Proteger do Frio).
function diaLocalDeHoje() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function condicaoDeTeste(tempC, ventoKmh, ceu) {
  return {
    ceu: ceu,
    tempC: tempC,
    ventoKmh: ventoKmh,
    calorForte: tempC > TEMPO_CONFIG.limites.calorForteC,
    frioForte: tempC < TEMPO_CONFIG.limites.frioForteC,
    ventoForte: ventoKmh >= TEMPO_CONFIG.limites.ventoForteKmh,
    disponivel: true
  };
}

// ?tempo=sol|chuva|calor|nevoeiro|trovoada|vento|frio — só para testar.
const TEMPO_FORCADO_POR_PARAM = {
  sol: function () { return condicaoDeTeste(20, 10, 'sol'); },
  chuva: function () { return condicaoDeTeste(16, 15, 'chuva'); },
  calor: function () { return condicaoDeTeste(33, 10, 'sol'); },
  nevoeiro: function () { return condicaoDeTeste(14, 10, 'nevoeiro'); },
  trovoada: function () { return condicaoDeTeste(20, 20, 'trovoada'); },
  vento: function () { return condicaoDeTeste(18, 45, 'sol'); },
  frio: function () { return condicaoDeTeste(1, 10, 'sol'); }
};

let _tempoForcadoCache; // undefined = ainda não calculado; null = sem forçar

function tempoForcadoNoEndereco() {
  if (_tempoForcadoCache !== undefined) return _tempoForcadoCache;
  const valor = new URLSearchParams(location.search).get('tempo');
  const gerador = TEMPO_FORCADO_POR_PARAM[valor];
  _tempoForcadoCache = gerador ? gerador() : null;
  return _tempoForcadoCache;
}

// Estado em memória, atualizado a partir do cache/pedido à Open-Meteo.
let _tempoAtual = { disponivel: false };

function condicaoIndisponivel() {
  return { ceu: null, tempC: null, ventoKmh: null, calorForte: false, frioForte: false, ventoForte: false, disponivel: false };
}

function carregarTempoCache() {
  try {
    const raw = localStorage.getItem(TEMPO_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function guardarTempoCache(cache) {
  try {
    localStorage.setItem(TEMPO_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    // localStorage indisponível — sem cache, sem problema.
  }
}

// Vai buscar o tempo à Open-Meteo, respeitando o limite de 1x/hora
// (guardado em TEMPO_CACHE_KEY). Nunca lança erro para fora: se
// falhar, o jogo fica só sem a linha do tempo real.
async function garantirTempoAtualizado() {
  if (tempoForcadoNoEndereco()) return; // em teste, nunca pede à API

  const cache = carregarTempoCache();
  const agora = Date.now();

  if (cache && (agora - cache.fetchedAt) < TEMPO_CONFIG.intervaloMinimoMs) {
    _tempoAtual = cache.ok ? condicaoDeTeste(cache.tempC, cache.ventoKmh, cache.ceu) : (cache.stale || condicaoIndisponivel());
    return;
  }

  // Enquanto o pedido novo não chega, continua a mostrar os dados
  // antigos (se existirem) em vez de esconder a linha sem razão.
  if (cache && cache.ok) _tempoAtual = condicaoDeTeste(cache.tempC, cache.ventoKmh, cache.ceu);

  try {
    const controlador = new AbortController();
    const timeoutId = setTimeout(function () { controlador.abort(); }, TEMPO_FETCH_TIMEOUT_MS);
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + TEMPO_CONFIG.latitude +
      '&longitude=' + TEMPO_CONFIG.longitude +
      '&current=temperature_2m,wind_speed_10m,weather_code&timezone=Europe%2FLisbon';
    const resposta = await fetch(url, { signal: controlador.signal });
    clearTimeout(timeoutId);
    if (!resposta.ok) throw new Error('resposta não ok');
    const dados = await resposta.json();
    const tempC = dados.current.temperature_2m;
    const ventoKmh = dados.current.wind_speed_10m;
    const ceu = classificarCeu(dados.current.weather_code);

    _tempoAtual = condicaoDeTeste(tempC, ventoKmh, ceu);
    guardarTempoCache({ fetchedAt: agora, ok: true, tempC: tempC, ventoKmh: ventoKmh, ceu: ceu });
  } catch (e) {
    // Sem internet ou serviço em baixo: mantém os dados antigos (se
    // havia) e não volta a tentar antes da próxima hora.
    guardarTempoCache({ fetchedAt: agora, ok: false, stale: (cache && cache.ok) ? condicaoDeTeste(cache.tempC, cache.ventoKmh, cache.ceu) : null });
    if (!cache || !cache.ok) _tempoAtual = condicaoIndisponivel();
  }
}

function tempoAtual() {
  return tempoForcadoNoEndereco() || _tempoAtual;
}

const TEMPO_ICONE_POR_CEU = { sol: '☀️', chuva: '🌧️', nevoeiro: '🌫️', trovoada: '⛈️' };

// Linha do Menu da Quinta, ex: "Setúbal agora: 🌧️ Chuva, 16 °C".
// Fica vazia (sem mostrar nada) se ainda não há dados disponíveis.
function atualizarLinhaTempoQuinta() {
  const el = document.getElementById('tempo-linha');
  if (!el) return;
  const tempo = tempoAtual();
  if (!tempo.disponivel) {
    el.textContent = '';
    return;
  }
  const icone = TEMPO_ICONE_POR_CEU[tempo.ceu] || '';
  el.textContent = t('tempo.agoraLabel') + ' ' + icone + ' ' + t('tempo.ceu.' + tempo.ceu) + ', ' + Math.round(tempo.tempC) + ' °C';
}

garantirTempoAtualizado().then(atualizarLinhaTempoQuinta);
