// ---------------------------------------------------------------------
// A ESTRADA (Nível 7) — ecrã SÓ DE LEITURA (PR 4): os 3 vizinhos, o bem que dá cada um,
// quantos tens na Despensa e uma fala do dia. Sem trocas, sem custos (uvas), sem
// Reputação e sem gravar: este ficheiro só lê state e os dados de js/estrada-dados.js e
// js/despensa.js (despensaQuantos). As trocas ficam para um PR seguinte.
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

function estradaCartaoHtml(v, dia) {
  const bem = ESTRADA_BENS.filter(function (b) { return b.id === v.bem; })[0] || null;
  const fala = estradaFalaDoDia(v, dia);
  const nome = cadernoEscapar(estradaTexto(v.nome));
  const cena = 'assets/ecras/estrada_' + { dona_amelia: 'amelia', sr_joaquim: 'joaquim', tomas: 'tomas' }[v.id] + '.jpg';
  const cara = v.caraPendente === false && v.cara
    ? '<img class="estrada-cara" src="' + cadernoEscapar(v.cara) + '" alt="" decoding="async">'
    : '';
  return '<div class="estrada-cartao">' +
    '<div class="estrada-cena">' +
      '<img class="estrada-foto" src="' + cena + '" alt="" decoding="async" loading="lazy" style="object-position: center ' + (v.id === 'sr_joaquim' ? '22%' : '28%') + '">' +
      cara +
    '</div>' +
    '<div class="estrada-texto">' +
      '<p class="estrada-nome">' + nome + ' · <span class="estrada-papel">' + cadernoEscapar(estradaTexto(v.papel)) + '</span></p>' +
      (bem ? '<p>' + cadernoEscapar(t('estrada.da').replace('{bem}', estradaTexto(bem.nome))) + '</p>' : '') +
      '<p>' + t('estrada.naDespensa').replace('{n}', despensaQuantos(state, v.bem)) + '</p>' +
      (fala ? '<p class="estrada-fala">«' + cadernoEscapar(estradaTexto(fala.texto)) + '»</p>' : '') +
    '</div>' +
  '</div>';
}

function renderEstrada() {
  const container = document.getElementById('estrada-container');
  if (!container) return;
  let dia = '';
  try { dia = diaLisboaDeHoje(); } catch (e) { dia = ''; }

  container.innerHTML =
    '<div class="topcard">' +
      '<p class="mini-title" data-i18n="estrada.title"></p>' +
    '</div>' +
    '<div class="scroll-panel estrada-lista">' +
      ESTRADA_VIZINHOS.map(function (v) { return estradaCartaoHtml(v, dia); }).join('') +
      '<p class="estrada-aviso" data-i18n="estrada.emBreve"></p>' +
    '</div>' +
    '<div class="action-panel">' +
      '<button type="button" class="btn-pill pill-main pill-grande" onclick="voltarEcraAnterior()" data-i18n="nav.voltar"></button>' +
    '</div>';

  atualizarDialogo('', '');
  applyTranslations();
}
