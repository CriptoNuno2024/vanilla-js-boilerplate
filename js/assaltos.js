// ---------------------------------------------------------------------
// AVISO DOS ASSALTOS — a PISTA do dia dos porcos, dita pelo Chizo depois
// da meia taça (ver rondaChizoFalasObrigado() em js/ronda.js). Só texto:
// sem estado novo, sem prémios, nada é gravado.
//
// alvoDosPorcosDoDia(indice) devolve 'vinha', 'adega', 'cave', 'nevoeiro'
// ou 'trovoada'. indice é o nº da ronda do dia (0 ou 1, antes de somar).
//   1) Trovoada ou nevoeiro reais (tempoAtual() disponível) vencem tudo.
//   2) Senão, por peso: adega (1, sempre); vinha (1, no verão, e no outono
//      só em vindima/fimVindima, ou seja setembro e outubro); cave (1, e 2
//      no inverno, só com garrafa escura, ver garrafaEscuraProteger()).
//   3) Escolha estável: o mesmo dia e índice dão sempre o mesmo alvo.
//   4) Qualquer leitura em falta ou a falhar: cai para 'adega'.
// Para testar: ?pista=vinha|adega|cave|nevoeiro|trovoada força o alvo.
// O 2.º argumento (leituras) existe só para testes em node.
// ---------------------------------------------------------------------

const ASSALTOS_ALVOS = ['vinha', 'adega', 'cave', 'nevoeiro', 'trovoada'];

// Mesmo hash da curiosidade da Ronda (rondaChizoCuriosidade em js/ronda.js).
function assaltosHash(dia, indice) {
  const semente = dia + '#pista#' + indice;
  let h = 0;
  for (let i = 0; i < semente.length; i++) h = (h * 31 + semente.charCodeAt(i)) >>> 0;
  return h;
}

function assaltosAlvoForcadoNoEndereco() {
  let valor;
  try { valor = new URLSearchParams(location.search).get('pista'); } catch (e) { return null; }
  return ASSALTOS_ALVOS.indexOf(valor) !== -1 ? valor : null;
}

// Leituras do jogo; cada uma isolada, para uma falhar sem estragar as outras.
function assaltosLeituras() {
  const l = { dia: '', estacao: null, fase: null, ceu: null, garrafaEscura: false, forcado: null };
  try { l.forcado = assaltosAlvoForcadoNoEndereco(); } catch (e) {}
  try { if (typeof diaLisboaDeHoje === 'function') l.dia = diaLisboaDeHoje(); } catch (e) {}
  try { if (typeof estacaoAtual === 'function') l.estacao = estacaoAtual(); } catch (e) {}
  try { if (typeof faseRealAtual === 'function') l.fase = faseRealAtual(); } catch (e) {}
  try {
    if (typeof tempoAtual === 'function') {
      const tempo = tempoAtual();
      if (tempo && tempo.disponivel) l.ceu = tempo.ceu;
    }
  } catch (e) {}
  try { if (typeof garrafaEscuraProteger === 'function') l.garrafaEscura = garrafaEscuraProteger() !== null; } catch (e) {}
  return l;
}

function alvoDosPorcosDoDia(indice, leituras) {
  const l = leituras || assaltosLeituras();
  if (l.forcado) return l.forcado;
  if (l.ceu === 'trovoada' || l.ceu === 'nevoeiro') return l.ceu;

  const pesos = [['adega', 1]];
  if (l.estacao === 'verao' || (l.estacao === 'outono' && (l.fase === 'vindima' || l.fase === 'fimVindima'))) {
    pesos.push(['vinha', 1]);
  }
  if (l.garrafaEscura) pesos.push(['cave', l.estacao === 'inverno' ? 2 : 1]);

  const total = pesos.reduce(function (soma, p) { return soma + p[1]; }, 0);
  let r = assaltosHash(l.dia, indice) % total;
  for (let i = 0; i < pesos.length; i++) {
    if (r < pesos[i][1]) return pesos[i][0];
    r -= pesos[i][1];
  }
  return 'adega';
}

// Chave i18n 'ronda.pista.<alvo>.<1 ou 2>'; a variante sai do mesmo hash.
function textoDaPista(alvo, indice, leituras) {
  let dia = '';
  try { dia = (leituras || assaltosLeituras()).dia; } catch (e) {}
  const variante = ((assaltosHash(dia, indice) >>> 8) % 2) + 1;
  return 'ronda.pista.' + alvo + '.' + variante;
}
