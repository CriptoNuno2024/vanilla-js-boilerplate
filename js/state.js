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

// Ligada enquanto o Perfil está a apagar o progresso (ver perfilApagarTudo()
// em js/perfil.js): com isto a true, saveState() e a nuvem não gravam nada.
let apagando = false;

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
    // Interruptor "Som" no Perfil (ver js/perfil.js e js/som.js) — ligado
    // por omissão, tal como a Vibração. Só controla os efeitos sonoros
    // (nunca música); se estiver desligado, js/som.js não toca nada.
    som: true,
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
      bonusPoda: false,
      // "Primeiros passos" (ver premiarPrimeiroPasso() em js/vinha.js):
      // cada ação da Vinha só dá o prémio de estreia uma vez, para
      // sempre — ex.: { cavar: true, regar: true, ... }.
      primeirosPassos: {}
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
      frioDia: null,
      // Arco-íris na Quinta (sol depois de chuva): dia local da última vez. null = nunca.
      arcoirisDia: null
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
      vitoriasComPremioHoje: 0,
      // Isco do Proteger (ver js/proteger.js e iscoDoDia() em js/assaltos.js): null
      // ou { dia: 'AAAA-MM-DD' de Lisboa, indice: 0 ou 1 (índice da pista), alvo: o
      // alvo fixado, ou null se o jogador recusou o isco }.
      isco: null
    },
    // Níveis da Quinta (ver js/niveis.js), calculados a partir da
    // Reputação total. nivelMostrado: null significa "ainda por decidir" —
    // a primeira vez que o jogo corre (mesmo para quem já tinha
    // progresso), calcula-se o nível real e guarda-se aqui sem mostrar
    // nenhum balão, para nunca "spammar" subidas de nível antigas.
    // garrafasAoNivel6: nota invisível — quantas garrafas já havia em
    // state.adega.historico quando se chegou ao nível 6 (null até lá; escreve-se
    // uma só vez, ver carimbarGarrafasAoNivel6() em js/niveis.js). Fica aqui e
    // não em state.capitulos (a nuvem reescreve essa parte com chaves fixas).
    niveis: {
      nivelMostrado: null,
      garrafasAoNivel6: null
    },
    // Objetivos diários "Hoje na Quinta" (ver js/objetivos.js). dia usa
    // sempre o dia em Lisboa. selosTotal nunca desce, mesmo que um dia
    // fique incompleto.
    objetivos: {
      dia: null,
      lista: [],
      bonusDiaDado: false,
      selosTotal: 0,
      // Ronda do Chizo (ver js/ronda.js): faz parte do estado do dia, por isso
      // é reposta com os objetivos à meia-noite de Lisboa. feitas: rondas já
      // concluídas hoje (0 a 2); saidaEm/fimEm: timestamps enquanto o Chizo
      // está em ronda, senão null; ultimoFimEm: fim da última ronda concluída.
      ronda: { feitas: 0, saidaEm: null, fimEm: null, ultimoFimEm: null }
    },
    // Áreas por nível (ver js/niveis.js). jogadorAntigo: null = ainda por
    // decidir; vira true/false na primeira vez que corre este código (ver
    // avaliarJogadorAntigo() abaixo) e, uma vez true, nunca mais volta a
    // false — um jogador antigo nunca perde acesso ao que já tinha.
    // introMostrada impede repetir a história de abertura (só jogador novo).
    acesso: {
      jogadorAntigo: null,
      introMostrada: false
    },
    // Capítulos da Quinta (ver js/capitulos.js). concluidos: { idDoCapitulo:
    // true } — só sobe, nunca desce. iniciado: false até à primeira
    // avaliação (ver capitulosAvaliarEmSilencio()), que marca em silêncio o
    // que já estiver cumprido. celebrados: { idDoCapitulo: true } — capítulos
    // cujo balão de conclusão já foi mostrado (ou que já estavam cumpridos
    // na migração); só sobe, nunca desce. celebradosMigrado: true depois de
    // a migração única ter marcado o que já estava cumprido como celebrado.
    capitulos: {
      iniciado: false,
      concluidos: {},
      celebrados: {},
      celebradosMigrado: false
    },
    // Caderno dos Fygmos (ver js/caderno.js): páginas ganhas, idPagina ->
    // 'AAAA-MM-DD' (dia em Lisboa em que se ganhou). A nuvem junta-as por união.
    caderno: {
      paginas: {}
    },
    // Visitas à Quinta (ver js/visitas.js). feitas: { idVisita: 'AAAA-MM-DD' } (dia em
    // Lisboa da última vez que se fez); hoje: { dia, id, feita } com a visita escolhida
    // para o dia, ou null. NÃO se junta na nuvem: segue o estado inteiro que ganhar,
    // junto da Reputação (ver nuvemTratarLeitura() em js/nuvem.js).
    visitas: {
      feitas: {},
      hoje: null
    },
    // Despensa da Estrada (Nível 7, ver js/despensa.js; ainda sem uso no jogo). recebidos:
    // quantas unidades de cada bem já recebeu (só sobe). entregues: quantas unidades de cada
    // bem já entregou (só sobe; o que tem agora é recebidos menos entregues). primeiraTroca: para cada bem, o dia
    // (Lisboa, 'AAAA-MM-DD') da 1.ª troca. hoje: o dia (Lisboa) e os vizinhos com quem já
    // trocou nesse dia, { dia, feitas: { idVizinho: true } }. NÃO se junta na nuvem: segue o
    // estado inteiro que ganhar, como state.visitas.
    despensa: {
      recebidos: {},
      entregues: {},
      primeiraTroca: {},
      hoje: { dia: null, feitas: {} }
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
  if (apagando) return;
  // O carimbo só muda por ação do jogador (arranque.jogadorTocou) ou se ainda
  // não existe (0: jogador antigo sem carimbo). As gravações de arranque (ver
  // objetivos.js e niveis.js) guardam o conteúdo SEM o mudar, para um estado
  // antigo não parecer o mais recente a js/nuvem.js (nuvemSincronizarAoAbrir).
  if (arranque.jogadorTocou || !s.ultimaGravacaoEm) s.ultimaGravacaoEm = Date.now();
  // FUTURO: substituir esta linha por uma chamada à API (ver nota acima).
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  // Guarda também na nuvem do Telegram (js/nuvem.js) — nunca substitui o
  // localStorage acima, só acrescenta uma segunda cópia de segurança.
  // Enquanto a cópia da nuvem não foi lida (ver "arranque" abaixo), NÃO se
  // envia nada: um estado antigo, carimbado "agora", podia sobrepor-se à
  // cópia boa. Uma gravação feita depois de o jogador ter tocado no ecrã
  // conta como ação real (marca arranque.acaoReal).
  if (arranque.jogadorTocou) arranque.acaoReal = true;
  if (!nuvemPodeEnviar()) { arranque.adiada = true; return; }
  nuvemGuardarEstadoComAtraso(s);
}

let state = loadState();

// SINCRONIZAÇÃO SEGURA AO ABRIR — só em memória (nunca no state). Guarda o
// carimbo e a Reputação do local ANTES de qualquer gravação de arranque (ver
// objetivos.js e niveis.js, que gravam logo ao abrir e carimbam "agora").
// js/nuvem.js usa isto em nuvemSincronizarAoAbrir() para comparar com a nuvem.
const arranque = {
  localEm: state.ultimaGravacaoEm || 0,
  localRep: typeof state.reputacao === 'number' ? state.reputacao : 0,
  abertoEm: Date.now(),
  jogadorTocou: false, // true a partir do 1.º toque no ecrã
  acaoReal: false,     // true se se gravou depois de um toque (não é gravação de arranque)
  respondeu: false,    // a leitura da nuvem respondeu (ou não há nuvem)
  passou8s: false,     // passaram 8 s sem resposta (conta como erro de leitura)
  nuvemErro: false,    // a última leitura da nuvem falhou (nada é enviado nem trocado; ver nuvemTratarLeitura())
  nuvemEstatus: null,  // estatuto da última leitura: 'ok', 'vazio' ou 'erro' (só diagnóstico)
  adiada: false,       // houve gravações que não foram enviadas à nuvem
  // Diagnóstico temporário (ver perfilDiagArranque() em js/perfil.js)
  nuvemEm: null, nuvemRep: null, ganhou: null, respostaMs: null, primeiraGravacaoEm: null
};
if (typeof document.addEventListener === 'function') document.addEventListener('pointerdown', function () { arranque.jogadorTocou = true; }, true);

// Pode enviar-se à nuvem? Só depois de uma leitura bem-sucedida (ou de não haver
// nuvem / ser uma conta nova): nunca "às cegas", nem passados 8 s sem resposta.
function nuvemPodeEnviar() {
  return arranque.respondeu;
}

// ---------------------------------------------------------------------
// JOGADOR ANTIGO vs JOGADOR NOVO (ver Áreas por Nível em js/niveis.js)
//
// Um jogador antigo (já jogava antes desta atualização) fica com tudo
// aberto, para nunca perder acesso ao que já tinha; as trancas por nível
// só valem para quem começa do zero a partir de agora.
//
// Não basta olhar para o campo "acesso" existir ou não — ele É novo,
// por isso um jogador antigo (que ainda não tem esse campo) e alguém
// mesmo a abrir o jogo por instantes antes da 1ª gravação ficam com o
// mesmo aspeto depois de mergeDeep() preencher os valores por omissão.
// Por isso decide-se pelo PROGRESSO em si: se já existir qualquer sinal
// de jogo (Reputação, Uvas, Gotas, Garrafas, alguma entrada da
// Enciclopédia, ou a Vinha fora da fase inicial), é um jogador antigo.
//
// Isto corre logo aqui (cobre quem não usa CloudStorage) E outra vez
// depois de js/nuvem.js juntar o progresso da nuvem do Telegram (ver
// nuvemSincronizarAoAbrir() em js/nuvem.js) — um veterano num aparelho
// novo, ou com a memória do telemóvel limpa, só tem o progresso dele de
// volta depois dessa sincronização, por isso não pode ficar decidido
// "novo" para sempre antes disso acontecer.
// ---------------------------------------------------------------------
function temProgressoExistente() {
  return state.reputacao > 0 || state.uvas > 0 || state.gotas > 0 || state.garrafas > 0 ||
    state.encyclopedia.unlocked.length > 0 || state.vinha.fase !== 'preparar';
}

function avaliarJogadorAntigo() {
  if (state.acesso.jogadorAntigo !== null) return; // já decidido (antigo ou novo): não se reavalia
  const antigo = temProgressoExistente();
  if (antigo !== state.acesso.jogadorAntigo) {
    state.acesso.jogadorAntigo = antigo;
    // "Novo" (false) não se grava: reavalia-se a cada abertura, e assim abrir
    // o jogo sem progresso não cria estado no localStorage.
    if (!antigo) return;
    // Grava só no localStorage (não saveState()): esta primeira chamada
    // corre ainda dentro deste ficheiro, antes de js/nuvem.js carregar —
    // nuvemGuardarEstadoComAtraso() ainda não existe. A 2ª chamada (ver
    // nuvemSincronizarAoAbrir() em js/nuvem.js) já corre depois de tudo
    // carregado e usa saveState() normalmente.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}
avaliarJogadorAntigo();

function updateStatsDisplays() {
  document.querySelectorAll('.val-uvas').forEach(function (el) { el.textContent = state.uvas; });
  document.querySelectorAll('.val-gotas').forEach(function (el) { el.textContent = state.gotas; });
  document.querySelectorAll('.val-reputacao').forEach(function (el) { el.textContent = state.reputacao; });
  document.querySelectorAll('.val-garrafas').forEach(function (el) { el.textContent = state.garrafas; });
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
