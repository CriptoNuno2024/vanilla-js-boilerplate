// ---------------------------------------------------------------------
// TEMPO REAL DE SETÚBAL — Open-Meteo (grátis, sem chave)
//
// Vai buscar o estado do céu, a temperatura e o vento em Setúbal (um
// pedido bem-sucedido vale 20 minutos, uma falha só 5 — ver TEMPO_CONFIG;
// entretanto a resposta fica em localStorage). Se não houver internet ou
// o serviço falhar, o jogo continua normalmente, só com a estação (ver
// js/estacoes.js) — nunca mostra erros ao jogador.
//
// Para testar: acrescenta ?tempo=sol (ou chuva / calor / nevoeiro /
// trovoada / vento / frio / noite) ao endereço. Funciona junto com
// ?estacao=. Para ver o arco-íris da Quinta sem esperar: ?arcoiris=1.
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
  // Quanto tempo vale o último resultado antes de se pedir outra vez (só
  // na próxima entrada na Quinta ou na Vinha — não há relógio nenhum).
  cacheSucessoMs: 20 * 60 * 1000, // pedido bem-sucedido
  cacheFalhaMs: 5 * 60 * 1000,    // pedido falhado: tenta de novo mais cedo

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
  // Arco-íris: sol agora + chuva vista nas últimas janelaChuvaMs.
  arcoIris: { janelaChuvaMs: 6 * 60 * 60 * 1000, gotas: 3, imagem: 'assets/ecras/arco_iris.jpg' },

  imagens: {
    chuva: 'assets/ecras/tempo_chuva.jpg',
    calor: 'assets/ecras/calor.jpg',
    nevoeiro: 'assets/ecras/nevoeiro_1.jpg',
    trovoada: 'assets/ecras/trovoada_chizo.jpg',
    vento: 'assets/ecras/vento.jpg',
    // Frio forte: fundo da Vinha (YoshiCat e Chizo) e foto depois da tarefa Frio.
    frio: 'assets/ecras/yoshi_cat_e_chizo_geada.jpg',
    repararEstacas: 'assets/ecras/tempestade.jpg',
    protegerFrio: 'assets/ecras/yoshi_cat_geada.jpg'
  }
};

const TEMPO_CACHE_KEY = 'yoshicat_tempo_cache_v1';
const TEMPO_FETCH_TIMEOUT_MS = 8000;

// Códigos do tempo (WMO) devolvidos pela Open-Meteo, agrupados no céu
// que nos interessa. Códigos não listados (ex: neve, rara em Setúbal)
// caem em 'sol' (de dia) ou 'noite' (de noite) por omissão.
const TEMPO_CEU_POR_WEATHERCODE = {
  45: 'nevoeiro', 48: 'nevoeiro',
  51: 'chuva', 53: 'chuva', 55: 'chuva', 56: 'chuva', 57: 'chuva',
  61: 'chuva', 63: 'chuva', 65: 'chuva', 66: 'chuva', 67: 'chuva',
  80: 'chuva', 81: 'chuva', 82: 'chuva',
  95: 'trovoada', 96: 'trovoada', 99: 'trovoada'
};

// isDay vem do campo is_day da Open-Meteo (1 = dia, 0 = noite). Só
// distingue "noite" quando o código não é nenhum dos de cima (chuva,
// nevoeiro, trovoada continuam iguais de dia ou de noite).
function classificarCeu(weathercode, isDay) {
  const ceu = TEMPO_CEU_POR_WEATHERCODE[weathercode];
  if (ceu) return ceu;
  return isDay === 0 ? 'noite' : 'sol';
}

// Dia em Lisboa (fuso Europe/Lisbon) em "YYYY-MM-DD", independente do
// fuso horário do telemóvel do jogador — usado só pelos objetivos
// diários "Hoje na Quinta" (ver js/objetivos.js) e pelo limite diário
// de vitórias com prémio no Proteger (ver js/proteger.js), pelas tarefas
// do dia (chuva, Estacas, Proteger do Frio, arco-íris, festas), pelo mês
// da estação, pelo ano do inverno e pelas festas: tudo usa o calendário de
// Lisboa e não o do telemóvel.
function diaLisboaDeHoje() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Lisbon',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

// ---------------------------------------------------------------------
// >>> regras-relogio (scripts/_regras-tempo.js carrega só este bloco)
// RELÓGIO ERRADO — regras puras, as únicas do jogo (Vinha, Adega, Ronda do
// Chizo, objetivos, Proteger e Visitas usam estas). Só carimbos no futuro são
// corrigidos; o resto do que está guardado nunca é alterado.
// ---------------------------------------------------------------------

// Partes de um dia "AAAA-MM-DD" (data real do calendário): { ano, mes (0 a 11), dia } ou
// null se o texto não for uma data válida. Pura: o dia passa como argumento.
function diaLisboaPartes(texto) {
  if (typeof texto !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (!m) return null;
  const ano = Number(m[1]), mes = Number(m[2]) - 1, dia = Number(m[3]);
  const d = new Date(Date.UTC(ano, mes, dia));
  if (d.getUTCFullYear() !== ano || d.getUTCMonth() !== mes || d.getUTCDate() !== dia) return null;
  return { ano: ano, mes: mes, dia: dia };
}

// Quantos dias há de a até b (positivo se b é depois de a); null se algum não for uma data válida.
function diasEntreDiasLisboa(a, b) {
  const pa = diaLisboaPartes(a), pb = diaLisboaPartes(b);
  if (!pa || !pb) return null;
  return Math.round((Date.UTC(pb.ano, pb.mes, pb.dia) - Date.UTC(pa.ano, pa.mes, pa.dia)) / 86400000);
}

// Até quantos dias à frente de hoje um dia guardado ainda conta como "o dia de hoje" (data
// do aparelho adiantada que voltou ao normal). Mais do que isto repõe, para não congelar meses.
var DIAS_FUTURO_MAXIMO = 2; // var: o bloco também é injetado nos testes (scripts/_regras-tempo.js)

// O dia de hoje já passou o dia guardado? Só então o estado do dia se repõe. Repõe quando o
// guardado falta ou é inválido (jogo novo, save antigo, formato diferente) ou quando está
// MAIS de DIAS_FUTURO_MAXIMO dias à frente de hoje; hoje igual ou ANTERIOR ao guardado
// (data atrás), até esse limite, não repõe.
function diaLisboaMudou(hoje, guardado) {
  if (diaLisboaPartes(hoje) === null) return false;
  const dif = diasEntreDiasLisboa(hoje, guardado);
  if (dif === null) return true;
  return dif < 0 || dif > DIAS_FUTURO_MAXIMO;
}

// O dia a usar como "hoje" para um estado do dia: o guardado se for posterior ao de hoje
// mas dentro do limite (data atrás), senão o de hoje.
function diaLisboaEfetivo(hoje, guardado) {
  const dif = diasEntreDiasLisboa(hoje, guardado);
  return dif !== null && dif > 0 && dif <= DIAS_FUTURO_MAXIMO ? guardado : hoje;
}

// Lê o carimbo obj[chave] já limitado a "agora". Se estava no futuro, escreve "agora" no
// lugar dele (só carimbos no futuro; os normais nunca são tocados) e grava, porque só
// ler o mínimo nunca deixaria o tempo avançar: o cooldown ficaria sempre inteiro.
function carimboCorrigirFuturo(obj, chave, agora) {
  if (!obj || typeof obj !== 'object') return undefined;
  const valor = obj[chave];
  const n = Number(valor);
  if (!Number.isFinite(n) || !(n > agora)) return valor;
  obj[chave] = agora;
  try { if (typeof saveState === 'function' && typeof state !== 'undefined') saveState(state); } catch (e) { /* só em memória */ }
  return agora;
}
// <<< regras-relogio

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

// ?tempo=sol|chuva|calor|nevoeiro|trovoada|vento|frio|noite — só para testar.
const TEMPO_FORCADO_POR_PARAM = {
  sol: function () { return condicaoDeTeste(20, 10, 'sol'); },
  chuva: function () { return condicaoDeTeste(16, 15, 'chuva'); },
  calor: function () { return condicaoDeTeste(33, 10, 'sol'); },
  nevoeiro: function () { return condicaoDeTeste(14, 10, 'nevoeiro'); },
  trovoada: function () { return condicaoDeTeste(20, 20, 'trovoada'); },
  vento: function () { return condicaoDeTeste(18, 45, 'sol'); },
  frio: function () { return condicaoDeTeste(1, 10, 'sol'); },
  noite: function () { return condicaoDeTeste(14, 5, 'noite'); }
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

// A entrada guardada tem dados de tempo utilizáveis? (ok e campos válidos)
function tempoCacheComDados(cache) {
  return !!cache && typeof cache === 'object' && cache.ok === true &&
    Number.isFinite(cache.tempC) && Number.isFinite(cache.ventoKmh) && typeof cache.ceu === 'string';
}

// Hora (ms) em que a cache viu chuva pela última vez, ou null.
function chuvaEmDaCache(cache) {
  return cache && typeof cache === 'object' && Number.isFinite(cache.chuvaEm) ? cache.chuvaEm : null;
}

// A cache ainda vale (não é preciso pedir outra vez)? Função pura: recebe
// a entrada e a hora (Date.now()). Sucesso vale cacheSucessoMs, falha
// cacheFalhaMs. Vazia, inválida ou com hora no futuro (relógio do
// aparelho errado) conta como expirada. O formato da entrada não mudou
// ({ fetchedAt, ok, ... }), por isso cache antiga continua a servir: só
// é avaliada pelos prazos novos.
function tempoCacheValida(cache, agora) {
  if (!cache || typeof cache !== 'object') return false;
  const idade = agora - cache.fetchedAt;
  if (!Number.isFinite(idade) || idade < 0) return false;
  return idade < (cache.ok === true ? TEMPO_CONFIG.cacheSucessoMs : TEMPO_CONFIG.cacheFalhaMs);
}

// Vai buscar o tempo à Open-Meteo, respeitando os prazos da cache
// (guardada em TEMPO_CACHE_KEY, ver tempoCacheValida). Nunca lança erro
// para fora: se falhar, o jogo fica só sem a linha do tempo real.
async function garantirTempoAtualizado() {
  if (tempoForcadoNoEndereco()) { // em teste, nunca pede à API
    return;
  }

  const cache = carregarTempoCache();
  const agora = Date.now();

  if (tempoCacheValida(cache, agora)) {
    _tempoAtual = cache.ok ? condicaoDeTeste(cache.tempC, cache.ventoKmh, cache.ceu) : (cache.stale || condicaoIndisponivel());
    return;
  }

  // Enquanto o pedido novo não chega, continua a mostrar os dados
  // antigos (se existirem) em vez de esconder a linha sem razão.
  if (tempoCacheComDados(cache)) _tempoAtual = condicaoDeTeste(cache.tempC, cache.ventoKmh, cache.ceu);

  try {
    const controlador = new AbortController();
    const timeoutId = setTimeout(function () { controlador.abort(); }, TEMPO_FETCH_TIMEOUT_MS);
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + TEMPO_CONFIG.latitude +
      '&longitude=' + TEMPO_CONFIG.longitude +
      '&current=temperature_2m,wind_speed_10m,weather_code,is_day&timezone=Europe%2FLisbon';
    const resposta = await fetch(url, { signal: controlador.signal });
    clearTimeout(timeoutId);
    if (!resposta.ok) throw new Error('resposta não ok');
    const dados = await resposta.json();
    const tempC = dados.current.temperature_2m;
    const ventoKmh = dados.current.wind_speed_10m;
    const ceu = classificarCeu(dados.current.weather_code, dados.current.is_day);

    _tempoAtual = condicaoDeTeste(tempC, ventoKmh, ceu);
    // chuvaEm: última vez que se viu chuva (para o arco-íris); mantém-se entre pedidos.
    guardarTempoCache({ fetchedAt: agora, ok: true, tempC: tempC, ventoKmh: ventoKmh, ceu: ceu, chuvaEm: ceu === 'chuva' ? agora : chuvaEmDaCache(cache) });
  } catch (e) {
    // Sem internet ou serviço em baixo: mantém os dados antigos (se
    // havia) e não volta a tentar antes de passarem cacheFalhaMs.
    guardarTempoCache({ fetchedAt: agora, ok: false, chuvaEm: chuvaEmDaCache(cache), stale: tempoCacheComDados(cache) ? condicaoDeTeste(cache.tempC, cache.ventoKmh, cache.ceu) : null });
    if (!tempoCacheComDados(cache)) _tempoAtual = condicaoIndisponivel();
  }
}

function tempoAtual() {
  return tempoForcadoNoEndereco() || _tempoAtual;
}

const TEMPO_ICONE_POR_CEU = { sol: '☀️', chuva: '🌧️', nevoeiro: '🌫️', trovoada: '⛈️', noite: '🌙' };

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

// ---------------------------------------------------------------------
// SOM DO TEMPO (ver js/som.js) — chuva de ambiente na Quinta e na Vinha
// (ver goTo() em js/main.js e enterVinha() em js/vinha.js), e um trovão
// ao entrar num desses dois ecrãs quando o tempo real for trovoada.
// Nunca toca nada se "Som" estiver desligado (ver somPodeTocar() em
// js/som.js) — essas funções já ficam mudas sozinhas nesse caso.
// ---------------------------------------------------------------------
const SOM_TEMPO_CHUVA_NORMAL = 'assets/sons/chuva.mp3';
const SOM_TEMPO_CHUVA_FORTE = 'assets/sons/chuva_sempreritmo.mp3';
const SOM_TEMPO_TROVOES = ['assets/sons/trovao_1.mp3', 'assets/sons/trovao_2_forte.mp3'];

// Liga ou desliga o ambiente de chuva consoante o tempo real: chuva
// forte/tempestade em trovoada, chuva normal em chuva, nada nos outros
// tempos (ver pararSomAmbiente()).
function atualizarAmbienteChuva() {
  const tempo = tempoAtual();
  if (tempo.disponivel && tempo.ceu === 'trovoada') {
    iniciarSomAmbiente(SOM_TEMPO_CHUVA_FORTE, 0.18);
  } else if (tempo.disponivel && tempo.ceu === 'chuva') {
    iniciarSomAmbiente(SOM_TEMPO_CHUVA_NORMAL, 0.12);
  } else {
    pararSomAmbiente();
  }
}

// Só chamada ao entrar na Quinta/Vinha (nunca num refresco periódico) —
// toca um dos dois trovões, escolhido ao calhas, uma única vez.
function tocarTrovaoSeTrovoada() {
  const tempo = tempoAtual();
  if (!tempo.disponivel || tempo.ceu !== 'trovoada') return;
  const escolhido = SOM_TEMPO_TROVOES[randInt(0, SOM_TEMPO_TROVOES.length - 1)];
  tocarSomFicheiro(escolhido, 0.6);
}

// ---------------------------------------------------------------------
// ARCO-ÍRIS NA QUINTA — sol agora e chuva na verificação guardada nas
// últimas 6 h: uma vez por dia (state.tempo.arcoirisDia), ao entrar na
// Quinta (ver goTo() em js/main.js), +3 gotas. Sem dados do tempo, nada.
// ?arcoiris=1 mostra o aviso sempre, sem gravar nem pagar (só teste).
// ---------------------------------------------------------------------

// Função pura: há arco-íris com este céu, esta cache e esta hora?
function arcoIrisCondicoes(ceu, cache, agora) {
  if (ceu !== 'sol') return false;
  const chuvaEm = chuvaEmDaCache(cache);
  if (chuvaEm === null) return false;
  const idade = agora - chuvaEm;
  return idade >= 0 && idade <= TEMPO_CONFIG.arcoIris.janelaChuvaMs;
}

// Devolve true se mostrou o aviso. Não mostra por cima de outra fala.
function arcoIrisAvaliar() {
  const teste = new URLSearchParams(location.search).get('arcoiris') === '1';
  const balao = document.getElementById('app-dialogue');
  if (balao && !balao.hidden) return false;
  if (!teste) {
    const tempo = tempoAtual();
    if (!tempo.disponivel || state.tempo.arcoirisDia === diaLisboaDeHoje()) return false;
    if (!arcoIrisCondicoes(tempo.ceu, carregarTempoCache(), Date.now())) return false;
    state.tempo.arcoirisDia = diaLisboaDeHoje();
    state.gotas += TEMPO_CONFIG.arcoIris.gotas;
    saveState(state);
    updateStatsDisplays();
  }
  const foto = TEMPO_CONFIG.arcoIris.imagem;
  mostrarFalas([
    { texto: t('tempo.arcoirisFala'), foto: foto },
    { texto: t('tempo.arcoirisGotas'), foto: foto }
  ], 'YoshiCat');
  return true;
}

garantirTempoAtualizado().then(atualizarLinhaTempoQuinta);
