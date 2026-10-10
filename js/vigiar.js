// ---------------------------------------------------------------------
// VIGIAR A VINHA — doenças e pragas, só como "sinal" e como aprendizagem (sem perdas, sem custos).
//
// Quando o tempo dá um sinal, a Vinha ganha a tarefa "Vigiar a vinha", uma vez por dia (dia de Lisboa), ao lado das do
// vento e do frio. Vigiar não custa nada (nem uvas), não dá uvas e não dá pontos de cuidado: dá uma ficha na Enciclopédia
// (manual: true) e conta como o objetivo do dia "tempo_vigiar" (Grupo C, js/objetivos.js, os mesmos pontos do tempo_frio).
// Ignorar o sinal não faz perder nada.
//
// Sinal (vigiarSinal, pura): 'mildio', 'oidio' ou null.
//   - nunca no inverno, nem com tempo indisponível ou estranho;
//   - 'mildio': céu de chuva ou nevoeiro agora, OU chuva vista nas últimas 24 h (tempo.chuvaEm, da cache do tempo);
//   - 'oidio': calor forte (tempo.calorForte) sem os sinais do míldio. Se os dois se aplicarem, o míldio ganha.
// Fichas: "O Míldio" e "O Oídio" na 1.ª vigia com esse sinal; "A Eutipiose" na 3.ª vigia (em dias diferentes).
//
// state.tempo.vigiarDia  'AAAA-MM-DD' (Lisboa) da última vigia; null = nunca
// state.tempo.vigiarDias quantos dias diferentes já vigiou (só sobe; reparado em memória)
// NÃO se juntam na nuvem: como o resto de state.tempo, seguem o estado inteiro que ganhar.
//
// Relógio: a mesma regra de js/tempo.js (diaLisboaMudou/diaLisboaEfetivo). Data do aparelho atrás (até DIAS_FUTURO_MAXIMO)
// continua a contar "já vigiaste hoje" e o dia guardado nunca recua; mais do que isso à frente, ou dia em falta ou inválido,
// repõe. As regras são puras: o dia, o tempo e a hora chegam por argumento, nada lê o relógio nem sorteia, nada grava
// (quem chama grava, uma só vez, no clique).
//
// Nomes em inglês e espanhol das fichas: a rever por nativo (EN: Downy Mildew, Powdery Mildew, Eutypa Dieback;
// ES: El Mildiu, El Oídio, La Eutipiosis).
// ---------------------------------------------------------------------

const VIGIAR_CONFIG = {
  janelaChuvaMs: 24 * 60 * 60 * 1000, // chuva vista nas últimas 24 h conta como sinal de míldio
  vigiasParaEutipiose: 3,             // dias diferentes de vigia até à ficha da eutipiose
  estacoes: ['primavera', 'verao', 'outono'],
  // Imagens (assets/ecras): "sinal" é o fundo da Vinha enquanto há sinal por vigiar; "depois" a foto depois de vigiar.
  imagens: {
    mildio: { sinal: 'assets/ecras/doencas_e_pragas.jpg', depois: 'assets/ecras/doencas_e_pragas_2.jpg' },
    oidio: { sinal: 'assets/ecras/pragas_sol.jpg', depois: 'assets/ecras/pragas_sol_2.jpg' }
  },
  // Ids das entradas da Enciclopédia (js/explorar.js).
  fichas: { mildio: 'mildio', oidio: 'oidio', eutipiose: 'eutipiose' }
};

const VIGIAR_DIA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function vigiarInteiro(n) {
  return typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= Number.MAX_SAFE_INTEGER ? n : 0;
}

function vigiarDiaValido(d) {
  return typeof d === 'string' && VIGIAR_DIA_REGEX.test(d) && diaLisboaPartes(d) !== null;
}

// Houve chuva nas últimas 24 h? Hora no futuro (relógio do aparelho atrás) ou inválida não conta.
function vigiarChuvaRecente(chuvaEm, agora) {
  if (typeof chuvaEm !== 'number' || typeof agora !== 'number' || !Number.isFinite(chuvaEm) || !Number.isFinite(agora)) return false;
  const idade = agora - chuvaEm;
  return idade >= 0 && idade <= VIGIAR_CONFIG.janelaChuvaMs;
}

// 'mildio' | 'oidio' | null. Só lê.
function vigiarSinal(tempo, estacao, agora) {
  if (VIGIAR_CONFIG.estacoes.indexOf(estacao) === -1) return null; // inverno, ou estação estranha
  if (!tempo || typeof tempo !== 'object' || tempo.disponivel !== true) return null;
  if (tempo.ceu === 'chuva' || tempo.ceu === 'nevoeiro' || vigiarChuvaRecente(tempo.chuvaEm, agora)) return 'mildio';
  if (tempo.calorForte === true) return 'oidio';
  return null;
}

// Repara state.tempo em memória (um save ou uma nuvem estranhos podem trazer outro tipo).
function vigiarEstado(estado) {
  let t = estado.tempo;
  if (!t || typeof t !== 'object' || Array.isArray(t)) t = estado.tempo = {};
  if (!vigiarDiaValido(t.vigiarDia)) t.vigiarDia = null;
  t.vigiarDias = vigiarInteiro(t.vigiarDias);
  return t;
}

// Já vigiou "hoje"? Só lê. Dia em falta ou inválido: não. Dia anterior a hoje: não (dia novo). Igual ou à frente de hoje
// (data atrás) dentro do limite: sim. Mais do que isso à frente: não (diaLisboaMudou).
function vigiarFeitoHoje(estado, hoje) {
  const t = estado && estado.tempo && typeof estado.tempo === 'object' && !Array.isArray(estado.tempo) ? estado.tempo : null;
  if (!t || !vigiarDiaValido(t.vigiarDia) || !vigiarDiaValido(hoje)) return false;
  return !diaLisboaMudou(hoje, t.vigiarDia);
}

// Só lê. Devolve { ok, motivo, sinal }; motivo null | 'estado_invalido' | 'dia_invalido' | 'sem_sinal' | 'ja_hoje'.
function vigiarPodeVigiar(estado, tempo, estacao, hoje, agora) {
  const recusa = function (motivo, sinal) { return { ok: false, motivo: motivo, sinal: sinal || null }; };
  if (!estado || typeof estado !== 'object') return recusa('estado_invalido');
  if (!vigiarDiaValido(hoje)) return recusa('dia_invalido');
  const sinal = vigiarSinal(tempo, estacao, agora);
  if (sinal === null) return recusa('sem_sinal');
  if (vigiarFeitoHoje(estado, hoje)) return recusa('ja_hoje', sinal);
  return { ok: true, motivo: null, sinal: sinal };
}

// Vigia: regista o dia (o efetivo, que nunca recua) e sobe o contador. Devolve { ok, motivo, sinal, dias, fichas }, onde
// fichas são os ids das fichas a desbloquear (as que ainda não estão em estado.encyclopedia.unlocked); quem chama
// desbloqueia com desbloquearEntradaEnciclopedia. Recusar não altera nada. Não grava.
function vigiar(estado, tempo, estacao, hoje, agora) {
  const p = vigiarPodeVigiar(estado, tempo, estacao, hoje, agora);
  if (!p.ok) return { ok: false, motivo: p.motivo, sinal: p.sinal, dias: 0, fichas: [] };
  const t = vigiarEstado(estado);
  t.vigiarDia = diaLisboaEfetivo(hoje, t.vigiarDia);
  t.vigiarDias = Math.min(Number.MAX_SAFE_INTEGER, t.vigiarDias + 1);
  const abertas = estado.encyclopedia && Array.isArray(estado.encyclopedia.unlocked) ? estado.encyclopedia.unlocked : [];
  const fichas = [];
  const F = VIGIAR_CONFIG.fichas;
  if (abertas.indexOf(F[p.sinal]) === -1) fichas.push(F[p.sinal]);
  if (t.vigiarDias >= VIGIAR_CONFIG.vigiasParaEutipiose && abertas.indexOf(F.eutipiose) === -1) fichas.push(F.eutipiose);
  return { ok: true, motivo: null, sinal: p.sinal, dias: t.vigiarDias, fichas: fichas };
}

// Imagem para o sinal: antes de vigiar a "sinal", depois a variante _2. Sem sinal, null.
function vigiarImagem(sinal, feito) {
  const i = VIGIAR_CONFIG.imagens[sinal === 'mildio' || sinal === 'oidio' ? sinal : ''];
  return i ? (feito ? i.depois : i.sinal) : null;
}

// ---------------------------------------------------------------------
// Ligação ao jogo (Vinha e objetivos)
// ---------------------------------------------------------------------

// O tempo de agora com a chuva vista na cache (chuvaEm) juntada. Só lê.
function vigiarTempoAgora() {
  let chuvaEm = null;
  try { chuvaEm = chuvaEmDaCache(carregarTempoCache()); } catch (e) { chuvaEm = null; }
  return Object.assign({}, tempoAtual(), { chuvaEm: chuvaEm });
}

// Sinal de agora (para a Vinha e para os objetivos). Só lê.
function vigiarSinalAgora() {
  return vigiarSinal(vigiarTempoAgora(), estacaoAtual(), Date.now());
}

function vigiarJaFezHoje() {
  return vigiarFeitoHoje(state, diaLisboaDeHoje());
}

// Aviso de sinal para o diálogo do YoshiCat na Vinha: só com sinal e ainda por vigiar.
function vigiarAviso() {
  const s = vigiarSinalAgora();
  return s !== null && !vigiarJaFezHoje() ? t('vigiar.aviso.' + s) : '';
}

// Fundo da Vinha com sinal por vigiar. Não tapa as condições mais raras (trovoada, vento forte, frio forte), que já têm o seu fundo.
function vigiarFundoSinal() {
  const tempo = tempoAtual();
  if (tempo.ceu === 'trovoada' || tempo.ventoForte || tempo.frioForte) return null;
  const s = vigiarSinalAgora();
  return s !== null && !vigiarJaFezHoje() ? vigiarImagem(s, false) : null;
}

let vigiarOcupado = false;
let vigiarUltimoCliqueMs = -Infinity;
const VIGIAR_ENTRE_CLIQUES_MS = 500;

// O clique em "Vigiar a vinha" (chamado por executarAcaoVinha). Grava uma só vez; recusar não altera nem grava.
function vigiarExecutar() {
  if (vigiarOcupado) return;
  const agora = Date.now();
  if (agora - vigiarUltimoCliqueMs < VIGIAR_ENTRE_CLIQUES_MS) return;
  vigiarUltimoCliqueMs = agora;
  vigiarOcupado = true;
  try {
    const r = vigiar(state, vigiarTempoAgora(), estacaoAtual(), diaLisboaDeHoje(), agora);
    if (!r.ok) {
      if (r.motivo === 'ja_hoje') vinhaMensagemAtual = t('vigiar.jaHoje');
      renderVinha();
      return;
    }
    let primeira = null;
    r.fichas.forEach(function (id) {
      const entrada = desbloquearEntradaEnciclopedia(id);
      if (entrada && !primeira) primeira = entrada;
    });
    vinhaNovaEntrada = primeira;
    vinhaFotoAtual = vigiarImagem(r.sinal, true);
    vinhaMensagemAtual = t('vigiar.fala.' + r.sinal) + ' ' + (primeira ? t('vigiar.resultadoFicha').replace('{ficha}', primeira.titulo) : t('vigiar.resultado'));
    if (typeof marcarObjetivoCumprido === 'function') marcarObjetivoCumprido('tempo_vigiar');
    saveState(state);
    updateStatsDisplays();
    renderVinha();
  } finally {
    vigiarOcupado = false;
  }
}
