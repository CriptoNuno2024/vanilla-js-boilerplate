// ---------------------------------------------------------------------
// NÍVEIS DA QUINTA — calculados a partir da Reputação total (ver
// state.reputacao em js/state.js). A Reputação nunca é gasta em
// nenhum sítio do jogo, só somada — por isso o nível nunca desce.
//
// Para mudar os limiares ou os nomes: muda só NIVEIS_CONFIG abaixo. Os
// nomes ficam em js/i18n.js (chaves nivel.nome.1 a nivel.nome.10).
// ---------------------------------------------------------------------

const NIVEIS_CONFIG = [
  { min: 0, nomeKey: 'nivel.nome.1' },
  { min: 15, nomeKey: 'nivel.nome.2' },
  { min: 50, nomeKey: 'nivel.nome.3' },
  { min: 120, nomeKey: 'nivel.nome.4' },
  { min: 300, nomeKey: 'nivel.nome.5' },
  { min: 600, nomeKey: 'nivel.nome.6' },
  { min: 1000, nomeKey: 'nivel.nome.7' },
  { min: 1500, nomeKey: 'nivel.nome.8' },
  { min: 2100, nomeKey: 'nivel.nome.9' },
  { min: 2800, nomeKey: 'nivel.nome.10' }
];

// Índice 1-based (nível 1 a 10) — o último cujo limiar já foi atingido.
function nivelPelaReputacao(reputacao) {
  let nivel = 1;
  for (let i = 0; i < NIVEIS_CONFIG.length; i++) {
    if (reputacao >= NIVEIS_CONFIG[i].min) nivel = i + 1;
  }
  return nivel;
}

// A primeira vez que o jogo corre depois desta atualização — mesmo
// para quem já tinha progresso guardado — decide-se o nível real a
// partir da Reputação já existente, sem mostrar nenhum balão. A partir
// daqui, só se avisa quando o nível SUBIR (ver verificarSubidaNivel()).
function iniciarNivelSeNecessario() {
  if (state.niveis.nivelMostrado === null) {
    state.niveis.nivelMostrado = nivelPelaReputacao(state.reputacao);
    // Sem gravação nem progresso (ex.: depois de apagar): fica só em memória
    // e grava-se com a 1.ª ação real (ver gerarObjetivosDoDia em js/objetivos.js).
    if (state.ultimaGravacaoEm || temProgressoExistente()) saveState(state);
  }
}
iniciarNivelSeNecessario();

// Cartão do Nível, dentro do topcard da Quinta (ver #nivel-container em
// index.html) — só desenha, nunca decide se subiu (ver
// verificarSubidaNivel() abaixo).
function atualizarCartaoNivelQuinta() {
  const container = document.getElementById('nivel-container');
  if (!container) return;

  const nivelAtual = nivelPelaReputacao(state.reputacao);
  const infoAtual = NIVEIS_CONFIG[nivelAtual - 1];
  const proximo = NIVEIS_CONFIG[nivelAtual]; // undefined no último nível

  let progressoHtml;
  if (proximo) {
    const valor = Math.min(state.reputacao, proximo.min);
    const pct = Math.round((valor / proximo.min) * 100);
    progressoHtml =
      '<div class="nivel-barra"><div class="nivel-barra-cheio" style="width:' + pct + '%"></div></div>' +
      '<p class="mini-sub">' + valor + ' / ' + proximo.min + ' · ' + t('nivel.proximoLabel') + ' ' + t(proximo.nomeKey) + '</p>';
  } else {
    progressoHtml =
      '<div class="nivel-barra"><div class="nivel-barra-cheio" style="width:100%"></div></div>' +
      '<p class="mini-sub">' + t('nivel.maximo') + '</p>';
  }

  container.innerHTML =
    '<div class="mini-bloco">' +
      '<p class="mini-bloco-titulo">' + t('nivel.label') + ' ' + nivelAtual + ' · ' + t(infoAtual.nomeKey) + '</p>' +
      progressoHtml +
    '</div>';
  // A linha da Estrada depende do nível: acompanha o cartão (ver js/estrada.js).
  if (typeof atualizarLinhaEstradaQuinta === 'function') atualizarLinhaEstradaQuinta();
  if (typeof atualizarLinhaLagarQuinta === 'function') atualizarLinhaLagarQuinta();
  if (typeof atualizarLinhaCamaraQuinta === 'function') atualizarLinhaCamaraQuinta();
  if (typeof atualizarLinhaRoxoQuinta === 'function') atualizarLinhaRoxoQuinta();
}

// Guarda quantas garrafas já existem em state.adega.historico no momento
// de chegar ao nível 6 — só se ainda for null, e nunca volta a mudar. Não
// grava: quem chama grava. Devolve true se escreveu. `tamanho` opcional: o
// Engarrafar passa o tamanho ANTES de a garrafa nova entrar no historico.
function carimbarGarrafasAoNivel6(tamanho) {
  if (state.niveis.garrafasAoNivel6 !== null && state.niveis.garrafasAoNivel6 !== undefined) return false;
  if (typeof tamanho !== 'number') {
    tamanho = Array.isArray(state.adega && state.adega.historico) ? state.adega.historico.length : 0;
  }
  state.niveis.garrafasAoNivel6 = tamanho;
  return true;
}

// Chamada só quando se entra na Quinta (ver goTo() em js/main.js) — se o
// nível calculado agora for maior do que o último mostrado, mostra a
// história desse(s) nível(eis) (ver mostrarHistoriaSubidaNivel() em
// js/historia.js — junta a história de TODOS os níveis passados, por
// ordem, se se tiver subido mais do que um de uma vez) e vibra.
// Devolve true se mostrou história/balão, false se não (ver
// capitulosAvaliarCelebracao() em js/capitulos.js, que espera pela visita
// seguinte quando isto devolve true).
function verificarSubidaNivel() {
  const nivelAntigo = state.niveis.nivelMostrado;
  const nivelAtual = nivelPelaReputacao(state.reputacao);
  // Nota invisível (ver carimbarGarrafasAoNivel6): também apanha quem já está
  // no nível 6 sem nota. Se o nível não subiu, grava-se aqui; se subiu, o
  // saveState() mais abaixo já grava.
  const carimbou = nivelAtual >= 6 && carimbarGarrafasAoNivel6();
  if (nivelAtual <= nivelAntigo) {
    if (carimbou) saveState(state);
    return false;
  }

  state.niveis.nivelMostrado = nivelAtual;
  saveState(state);

  if (typeof mostrarHistoriaSubidaNivel === 'function') {
    mostrarHistoriaSubidaNivel(nivelAntigo, nivelAtual);
  } else {
    const info = NIVEIS_CONFIG[nivelAtual - 1];
    mostrarFalas(t('nivel.subiuMsg').replace('{n}', nivelAtual).replace('{nome}', t(info.nomeKey)), 'YoshiCat');
  }
  vibrar('sucesso');
  tocarSom('subiuNivel');
  return true;
}

// ---------------------------------------------------------------------
// ÁREAS POR NÍVEL — a Vinha e a Quinta (o hub) estão sempre abertas;
// estes são os outros ecrãs, e o nível mínimo para cada um. Um jogador
// ANTIGO (ver state.acesso.jogadorAntigo, js/state.js) ignora sempre
// esta tabela — nunca perde acesso ao que já tinha.
// ---------------------------------------------------------------------
const NIVEL_NECESSARIO_POR_ECRA = {
  proteger: 2,
  garrafa: 3,
  caderno: 3,
  explorar: 4,
  enciclopedia: 4,
  festa: 4,
  colecao: 6,
  garrafas: 6,
  estrada: 7,
  lagar: 8,
  camara: 9,
  roxo: 10
};

function ecraDesbloqueado(screen) {
  if (state.acesso.jogadorAntigo) return true;
  const nivelPreciso = NIVEL_NECESSARIO_POR_ECRA[screen];
  if (!nivelPreciso) return true; // ecrã sem tranca (Vinha, Quinta, Perfil, Língua, Capa)
  return nivelPelaReputacao(state.reputacao) >= nivelPreciso;
}

// Decide se o cartão "Nova entrada!" (ver mostrarNovaEntrada() em
// js/main.js) aparece: só com uma entrada para mostrar E com a
// Enciclopédia já aberta — senão o botão "Ler" levava a "Abre no Nível 4".
// A entrada continua desbloqueada em state.encyclopedia.unlocked.
function cartaoNovaEntradaVisivel(entrada) {
  return !!entrada && ecraDesbloqueado('enciclopedia');
}

// Mensagem ao tocar num ecrã ainda trancado (ver goTo() em js/main.js),
// ex.: "Abre no Nível 3 · Quinta Produtora — faltam 12 de Reputação."
function mostrarMensagemTrancada(screen) {
  const nivelPreciso = NIVEL_NECESSARIO_POR_ECRA[screen];
  if (!nivelPreciso) return;
  const info = NIVEIS_CONFIG[nivelPreciso - 1];
  const faltam = Math.max(0, info.min - state.reputacao);
  mostrarFalas(
    t('acesso.trancado')
      .replace('{n}', nivelPreciso)
      .replace('{nome}', t(info.nomeKey))
      .replace('{faltam}', faltam),
    'YoshiCat'
  );
  vibrar('leve');
  tocarSom('ecraTrancado');
}
