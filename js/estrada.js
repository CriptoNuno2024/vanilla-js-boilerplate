// ---------------------------------------------------------------------
// A ESTRADA (Nível 7): os 3 vizinhos, o bem que dá cada um, quantos tens na Despensa, uma fala
// do dia e (PR 5B) o botão "Trocar". As regras e as contas estão em js/despensa.js
// (despensaTrocar) e js/estrada-dados.js (ESTRADA_TROCA); aqui só se mostra e se clica.
//
// O DESENHO NUNCA GRAVA nem altera nada: o estado de cada cartão (o que o botão faz, ou porque
// está apagado) calcula-se só a ler. Só o clique (estradaTrocarClique) chama despensaTrocar e
// grava, UMA vez, se a troca correr bem.
//
// Abre-se a partir da Quinta (linha no cartão, só com o ecrã desbloqueado: ver
// ecraDesbloqueado('estrada') em js/niveis.js; um jogador antigo vê-a sempre).
// ---------------------------------------------------------------------

// Mesmo tipo de hash do cadernoHash() (js/caderno.js) e do visitasHash() (js/visitas.js).
function estradaHash(semente) {
  let h = 0;
  for (let i = 0; i < semente.length; i++) h = (h * 31 + semente.charCodeAt(i)) >>> 0;
  return h;
}

// Só falas com fonte ou "semFacto" (as falas de troca ficam de fora: ainda não há trocas).
function estradaFalasValidas(vizinho) {
  return (vizinho.falas || []).filter(function (f) {
    return f && f.texto && ((Array.isArray(f.fonte) && f.fonte.length > 0) || f.semFacto === true);
  });
}

// A fala do dia de um vizinho: escolhida pelo hash do dia de Lisboa e do id do vizinho,
// por isso é a mesma o dia todo e muda de um dia para o outro. Sem relógio, devolve a 1.ª.
function estradaFalaDoDia(vizinho, diaLisboa) {
  const falas = estradaFalasValidas(vizinho);
  if (falas.length === 0) return null;
  const dia = typeof diaLisboa === 'string' ? diaLisboa : '';
  return falas[estradaHash(dia + ':' + vizinho.id) % falas.length];
}

function estradaTexto(objeto) {
  return objeto ? (objeto[currentLang] || objeto.pt || '') : '';
}

// Linha no cartão da Quinta, só com o ecrã desbloqueado.
function atualizarLinhaEstradaQuinta() {
  const container = document.getElementById('estrada-linha-container');
  if (!container) return;
  if (typeof ecraDesbloqueado !== 'function' || !ecraDesbloqueado('estrada')) { container.innerHTML = ''; return; }
  container.innerHTML =
    '<div class="mini-bloco">' +
      '<button type="button" class="visita-linha" onclick="goTo(\'estrada\')">' + t('estrada.linha') + '</button>' +
    '</div>';
}

// O que o cartão mostra, calculado SÓ A LER (nunca chama despensaTrocar nem altera o estado), pela mesma
// ordem das validações de despensaTrocar (js/despensa.js). Devolve
//   { acao: 'garrafa' | 'uvas' | 'sal', motivo: null | 'dia_anterior' | 'ja_hoje' | 'teto_dia' |
//     'prateleira_cheia' | 'faltam_uvas', primeiraVez, pedido }
// "acao" é o pagamento que o botão faria; "motivo" não nulo = botão apagado.
function estradaEstadoCartao(estado, v, dia) {
  const T = ESTRADA_TROCA;
  const d = estado && estado.despensa && typeof estado.despensa === 'object' ? estado.despensa : null;
  const tem = function (obj, k) { return !!obj && typeof obj === 'object' && Object.prototype.hasOwnProperty.call(obj, k); };
  const primeiraVez = !(d && tem(d.primeiraTroca, v.bem) && /^\d{4}-\d{2}-\d{2}$/.test(String(d.primeiraTroca[v.bem])));
  const pedido = despensaPedidoDoDia(v, dia);
  let acao = 'uvas';
  if (primeiraVez && despensaGarrafasDisponiveis(estado) >= 1) acao = 'garrafa';
  else if (!primeiraVez && pedido === 'sal_sado' && despensaQuantos(estado, 'sal_sado') >= 1) acao = 'sal';

  const ultimo = despensaUltimoDiaRegistado(estado);
  const feitas = d && d.hoje && typeof d.hoje === 'object' && d.hoje.dia === dia && d.hoje.feitas && typeof d.hoje.feitas === 'object' && !Array.isArray(d.hoje.feitas) ? d.hoje.feitas : {};
  const uvas = estado && typeof estado.uvas === 'number' && Number.isFinite(estado.uvas) ? estado.uvas : 0;
  let motivo = null;
  if (ultimo !== null && dia < ultimo) motivo = 'dia_anterior';
  else if (tem(feitas, v.id)) motivo = 'ja_hoje';
  else if (Object.keys(feitas).length >= T.trocasPorDiaTeto) motivo = 'teto_dia';
  else if (despensaQuantos(estado, v.bem) >= T.prateleiraMaxima) motivo = 'prateleira_cheia';
  else if (acao === 'uvas' && uvas - T.custoUvas < T.uvasMinimasDepoisDaTroca) motivo = 'faltam_uvas';
  return { acao: acao, motivo: motivo, primeiraVez: primeiraVez, pedido: pedido };
}

function estradaTextoMotivo(motivo) {
  const T = ESTRADA_TROCA;
  if (motivo === 'ja_hoje') return t('estrada.jaHoje');
  if (motivo === 'teto_dia') return t('estrada.tetoDia').replace('{n}', T.trocasPorDiaTeto);
  if (motivo === 'prateleira_cheia') return t('estrada.prateleira').replace('{n}', T.prateleiraMaxima);
  if (motivo === 'faltam_uvas') return t('estrada.faltamUvas').replace('{n}', T.custoUvas + T.uvasMinimasDepoisDaTroca);
  if (motivo === 'dia_anterior') return t('estrada.relogio');
  return t('estrada.erro');
}

// Só em memória (nada se grava): o resultado da última troca, mostrado no cartão desse vizinho até se
// sair do ecrã. Guardam-se códigos, nunca textos, para o desenho acompanhar a língua.
let estradaResultado = null; // { vizinho, pagou, uvasGastas, bem, reputacaoGanha, primeiraVez } ou { vizinho, erro: true }
let estradaOcupado = false;

function estradaDiaDeHoje() {
  try { return diaLisboaDeHoje(); } catch (e) { return ''; }
}

function estradaResultadoHtml(v, bem) {
  const r = estradaResultado;
  if (!r || r.vizinho !== v.id) return '';
  if (r.erro) return '<p class="estrada-resultado">' + t('estrada.erro') + '</p>';
  const nomeBem = bem ? estradaTexto(bem.nome) : '';
  let pagamento = '';
  if (r.pagou === 'garrafa') pagamento = t('estrada.levouGarrafa');
  else if (r.pagou === 'sal') pagamento = t('estrada.pagouSal');
  else pagamento = t('estrada.pagouUvas').replace('{n}', r.uvasGastas);
  return '<div class="estrada-resultado">' +
    '<p>' + cadernoEscapar(t('estrada.recebeste').replace('{bem}', nomeBem)) + '</p>' +
    '<p>' + pagamento + '</p>' +
    (r.primeiraVez ? '<p>' + t('estrada.repPrimeira').replace('{n}', r.reputacaoGanha) + '</p>' : '') +
    (v.troca && v.troca.texto ? '<p class="estrada-fala">«' + cadernoEscapar(estradaTexto(v.troca.texto)) + '»</p>' : '') +
  '</div>';
}

function estradaCartaoHtml(v, dia) {
  const bem = ESTRADA_BENS.filter(function (b) { return b.id === v.bem; })[0] || null;
  const fala = estradaFalaDoDia(v, dia);
  const nome = cadernoEscapar(estradaTexto(v.nome));
  const cena = 'assets/ecras/estrada_' + { dona_amelia: 'amelia', sr_joaquim: 'joaquim', tomas: 'tomas' }[v.id] + '.jpg';
  const cara = v.caraPendente === false && v.cara
    ? '<img class="estrada-cara" src="' + cadernoEscapar(v.cara) + '" alt="" decoding="async">'
    : '';
  const e = estradaEstadoCartao(state, v, dia);
  const T = ESTRADA_TROCA;
  const rotulo = e.acao === 'garrafa' ? t('estrada.btnGarrafa')
    : e.acao === 'sal' ? t('estrada.btnSal')
    : t('estrada.btnUvas').replace('{n}', T.custoUvas);
  // Só a Dona Amélia pede sal (ver ESTRADA_PEDIDOS): a linha só aparece nas trocas repetidas, quando ela pede sal hoje
  // e o botão está ativo (com o botão apagado, a linha do motivo basta).
  let linhaPedido = '';
  if (!e.primeiraVez && e.pedido === 'sal_sado' && !e.motivo) {
    linhaPedido = '<p class="estrada-estado">' + t(e.acao === 'sal' ? 'estrada.pedeSalTem' : 'estrada.pedeSalNao').replace('{n}', T.custoUvas) + '</p>';
  }
  return '<div class="estrada-cartao">' +
    '<div class="estrada-cena">' +
      '<img class="estrada-foto" src="' + cena + '" alt="" decoding="async" loading="lazy" style="object-position: center ' + (v.id === 'sr_joaquim' ? '22%' : '28%') + '">' +
      cara +
    '</div>' +
    '<div class="estrada-texto">' +
      '<p class="estrada-nome">' + nome + ' · <span class="estrada-papel">' + cadernoEscapar(estradaTexto(v.papel)) + '</span></p>' +
      (bem ? '<p>' + cadernoEscapar(t('estrada.da').replace('{bem}', estradaTexto(bem.nome))) + '</p>' : '') +
      '<p>' + t('estrada.naDespensa').replace('{n}', despensaQuantos(state, v.bem)) + '</p>' +
      linhaPedido +
      '<button type="button" class="btn-pill pill-main estrada-botao" data-vizinho="' + v.id + '" onclick="estradaTrocarClique(\'' + v.id + '\')"' + (e.motivo ? ' disabled' : '') + '>' + rotulo + '</button>' +
      (e.motivo ? '<p class="estrada-estado">' + estradaTextoMotivo(e.motivo) + '</p>' : '') +
      estradaResultadoHtml(v, bem) +
      (fala ? '<p class="estrada-fala">«' + cadernoEscapar(estradaTexto(fala.texto)) + '»</p>' : '') +
    '</div>' +
  '</div>';
}

// Desenha o ecrã (sem gravar nem alterar nada).
function estradaDesenhar() {
  const container = document.getElementById('estrada-container');
  if (!container) return;
  const dia = estradaDiaDeHoje();

  container.innerHTML =
    '<div class="topcard">' +
      '<p class="mini-title" data-i18n="estrada.title"></p>' +
    '</div>' +
    '<div class="scroll-panel estrada-lista">' +
      ESTRADA_VIZINHOS.map(function (v) { return estradaCartaoHtml(v, dia); }).join('') +
      '<p class="estrada-aviso">' + t('estrada.garrafasLevar').replace('{n}', despensaGarrafasDisponiveis(state)) + '</p>' +
    '</div>' +
    '<div class="action-panel">' +
      '<button type="button" class="btn-pill pill-main pill-grande" onclick="voltarEcraAnterior()" data-i18n="nav.voltar"></button>' +
    '</div>';

  atualizarDialogo('', '');
  applyTranslations();
}

// Ao entrar no ecrã (ver goTo() em js/main.js): esquece o resultado da visita anterior.
function renderEstrada() {
  estradaResultado = null;
  estradaDesenhar();
}

// O ÚNICO sítio que troca e grava. Toque no botão: desativa-o logo (clique duplo), faz a troca de hoje
// (despensaTrocar) e, se correu bem, grava UMA vez e atualiza a barra de cima (updateStatsDisplays, a
// mesma função que as outras ações usam depois de mudar uvas ou Reputação). Se recusou, não grava.
function estradaTrocarClique(vizinhoId) {
  if (estradaOcupado) return;
  estradaOcupado = true;
  try {
    const botao = document.querySelector('.estrada-botao[data-vizinho="' + vizinhoId + '"]');
    if (botao) botao.disabled = true;
    const r = despensaTrocar(state, vizinhoId, estradaDiaDeHoje());
    if (r.ok) {
      saveState(state);
      updateStatsDisplays();
      estradaResultado = { vizinho: vizinhoId, pagou: r.pagou, uvasGastas: r.uvasGastas, bem: r.bem, reputacaoGanha: r.reputacaoGanha, primeiraVez: r.primeiraVez };
    } else {
      // Recusada: nada mudou. O cartão mostra o motivo que calcula sozinho; só um motivo inesperado dá erro.
      const esperado = ['dia_anterior', 'ja_hoje', 'teto_dia', 'prateleira_cheia', 'faltam_uvas'].indexOf(r.motivo) !== -1;
      estradaResultado = esperado ? null : { vizinho: vizinhoId, erro: true };
    }
  } finally {
    estradaOcupado = false;
  }
  estradaDesenhar();
}
