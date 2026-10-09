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
  const variante = (((assaltosHash(dia, indice) >>> 8) + indice) % 2) + 1;
  return 'ronda.pista.' + alvo + '.' + variante;
}

// Minijogo do Proteger que segue a pista: cave -> 'fechadura', vinha ->
// 'disfarces', trovoada -> 'disfarces' (o Chizo tem medo e o jogador vigia
// sozinho), nevoeiro -> 'chizo' (Acorda o Chizo), adega -> 'barril' (Seguir o
// barril, ver js/barril.js). Valor desconhecido -> null (o Proteger usa o
// sorteio de sempre, ver escolherTipoProteger()).
function tipoDeProtegerPelaPista(alvo) {
  if (alvo === 'adega') return 'barril';
  if (alvo === 'cave') return 'fechadura';
  if (alvo === 'vinha' || alvo === 'trovoada') return 'disfarces';
  if (alvo === 'nevoeiro') return 'chizo';
  return null;
}

// -----------------------------------------------------------------
// ISCO (ver js/proteger.js): antes da 1.ª ronda do Proteger o jogador pode pôr
// 1 bagaço de isco para a pista de hoje. Registo em state.proteger.isco:
// { dia: 'AAAA-MM-DD' (Lisboa), indice: 0 ou 1 (o índice da pista), alvo: o
// alvo fixado, ou null se recusou }. Funções puras, para testar em node.
// -----------------------------------------------------------------

// O registo vale para este dia e este índice?
function iscoDoDia(isco, hoje, indice) {
  return !!isco && typeof isco === 'object' && isco.dia === hoje && isco.indice === indice;
}

// O alvo fixado pelo isco (só se o registo é de hoje, deste índice e tem alvo
// válido), ou null.
function iscoAlvoFixado(isco, hoje, indice) {
  if (!iscoDoDia(isco, hoje, indice)) return null;
  return ASSALTOS_ALVOS.indexOf(isco.alvo) !== -1 ? isco.alvo : null;
}

// Pergunta-se "Pôr isco?" só com pista (índice 0 ou 1), com bagaço e se ainda
// não há registo (posto ou recusado) para este dia e este índice.
function iscoPerguntar(isco, hoje, indice, bagaco) {
  if (indice !== 0 && indice !== 1) return false;
  if (!(bagaco >= 1)) return false;
  return !iscoDoDia(isco, hoje, indice);
}

// Alvo a seguir no Proteger: ?pista= no endereço > isco fixado (mesmo dia e
// índice) > cálculo ao vivo (alvoDosPorcosDoDia).
function alvoParaProteger(indice, isco, hoje, leituras) {
  const l = leituras || assaltosLeituras();
  if (l.forcado) return l.forcado;
  const fixado = iscoAlvoFixado(isco, hoje != null ? hoje : l.dia, indice);
  if (fixado) return fixado;
  return alvoDosPorcosDoDia(indice, l);
}

// O porco que o isco chama (as pistas nomeiam o Fygmo2 na Cave e o Fygmo na
// Vinha); null nos outros alvos, que não nomeiam nenhum.
function porcoDoAlvo(alvo) {
  if (alvo === 'cave') return 'Fygmo2';
  if (alvo === 'vinha') return 'Fygmo';
  return null;
}
