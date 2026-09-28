// ---------------------------------------------------------------------
// NÍVEIS DA QUINTA — calculados a partir da Reputação total (ver
// state.reputacao em js/state.js). A Reputação nunca é gasta em
// nenhum sítio do jogo, só somada — por isso o nível nunca desce.
//
// Para mudar os limiares ou os nomes: muda só NIVEIS_CONFIG abaixo. Os
// nomes ficam em js/i18n.js (chaves nivel.nome.1 a nivel.nome.6).
// ---------------------------------------------------------------------

const NIVEIS_CONFIG = [
  { min: 0, nomeKey: 'nivel.nome.1' },
  { min: 15, nomeKey: 'nivel.nome.2' },
  { min: 50, nomeKey: 'nivel.nome.3' },
  { min: 120, nomeKey: 'nivel.nome.4' },
  { min: 300, nomeKey: 'nivel.nome.5' },
  { min: 600, nomeKey: 'nivel.nome.6' }
];

// Índice 1-based (nível 1 a 6) — o último cujo limiar já foi atingido.
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
    saveState(state);
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
}

// Chamada só quando se entra na Quinta (ver goTo() em js/main.js) — se o
// nível calculado agora for maior do que o último mostrado, avisa com
// um balão (usa o nome final, mesmo que se tenha subido mais do que um
// nível de uma vez) e vibra.
function verificarSubidaNivel() {
  const nivelAtual = nivelPelaReputacao(state.reputacao);
  if (nivelAtual <= state.niveis.nivelMostrado) return;

  state.niveis.nivelMostrado = nivelAtual;
  saveState(state);

  const info = NIVEIS_CONFIG[nivelAtual - 1];
  mostrarFalas(t('nivel.subiuMsg').replace('{n}', nivelAtual).replace('{nome}', t(info.nomeKey)), 'YoshiCat');
  vibrar('sucesso');
}
