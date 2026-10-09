// ---------------------------------------------------------------------
// SEGUIR O BARRIL — a regra PURA do mini-jogo do Proteger quando a pista do dia é a Adega (a cena e os
// toques estão em js/proteger.js). Os porcos trocam os 3 barris de sítio e o jogador segue o do aguardente.
//
// A sequência sai toda de uma SEMENTE (texto) que chega por argumento: nada aqui lê o relógio nem sorteia, e
// o desenho nunca decide o resultado (vence quem toca na posição que barrilPosicaoFinal() calcula).
//
// Posições 0 a 2 (esquerda, meio, direita). Cada troca é [a, b] com a < b e a diferente de b: os barris que
// estão nessas duas posições trocam entre si.
//
//   barrilSequencia(semente, trocas?)  { marcado, trocas: [[a, b], ...], final }
//       marcado  posição inicial do barril do aguardente (0 a 2)
//       final    posição dele depois de todas as trocas
//       trocas   BARRIL_CONFIG.trocasMin ou trocasMax (ou o número pedido, de 1 a 8); a 1.ª troca mexe sempre
//                no barril marcado e nunca se repete a mesma troca seguida (cancelava-se)
//   barrilPosicaoFinal(marcado, trocas)  onde fica o barril marcado depois de aplicar as trocas
//   barrilAcertou(sequencia, toque)      true só se toque (0 a 2) é a posição final; calcula a partir das
//                                        trocas, nunca confia no campo "final"
// ---------------------------------------------------------------------

const BARRIL_CONFIG = {
  posicoes: 3,
  trocasMin: 3,
  trocasMax: 4,
  marcaMs: 1500,   // quanto tempo o barril do aguardente aparece marcado
  trocaMs: 500,    // duração de cada troca (a transição CSS)
  pausaMs: 150     // pausa entre trocas
};

// Gerador simples e determinístico (xorshift32) semeado por um texto.
function barrilGerador(semente) {
  const texto = String(semente);
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) { h ^= texto.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  let x = h || 1;
  const seguinte = function () {
    x ^= x << 13; x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5; x >>>= 0;
    return x;
  };
  for (let i = 0; i < 4; i++) seguinte(); // aquece: sementes parecidas não dão sequências parecidas
  return seguinte;
}

function barrilPosicaoFinal(marcado, trocas) {
  let p = marcado;
  (Array.isArray(trocas) ? trocas : []).forEach(function (t) {
    if (!Array.isArray(t)) return;
    if (p === t[0]) p = t[1];
    else if (p === t[1]) p = t[0];
  });
  return p;
}

function barrilSequencia(semente, trocas) {
  const rnd = barrilGerador(semente);
  const n = BARRIL_CONFIG.posicoes;
  const marcado = rnd() % n;
  const total = Number.isInteger(trocas) && trocas >= 1 && trocas <= 8
    ? trocas
    : BARRIL_CONFIG.trocasMin + (rnd() % (BARRIL_CONFIG.trocasMax - BARRIL_CONFIG.trocasMin + 1));
  const lista = [];
  let atual = marcado; // posição do barril marcado antes de cada troca
  for (let i = 0; i < total; i++) {
    let a, b;
    const anterior = lista[i - 1];
    do {
      if (i === 0) {
        a = atual;
        b = (atual + 1 + (rnd() % (n - 1))) % n; // uma das outras duas posições
      } else {
        a = rnd() % n;
        b = (a + 1 + (rnd() % (n - 1))) % n;
      }
    } while (anterior && Math.min(a, b) === anterior[0] && Math.max(a, b) === anterior[1]);
    const troca = [Math.min(a, b), Math.max(a, b)];
    lista.push(troca);
    if (atual === troca[0]) atual = troca[1];
    else if (atual === troca[1]) atual = troca[0];
  }
  return { marcado: marcado, trocas: lista, final: barrilPosicaoFinal(marcado, lista) };
}

function barrilAcertou(sequencia, toque) {
  if (!sequencia || typeof sequencia !== 'object') return false;
  if (!Number.isInteger(toque) || toque < 0 || toque >= BARRIL_CONFIG.posicoes) return false;
  if (!Number.isInteger(sequencia.marcado) || sequencia.marcado < 0 || sequencia.marcado >= BARRIL_CONFIG.posicoes) return false;
  return toque === barrilPosicaoFinal(sequencia.marcado, sequencia.trocas);
}
