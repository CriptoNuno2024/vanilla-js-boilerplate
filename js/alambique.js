// ---------------------------------------------------------------------
// O ALAMBIQUE COM DOIS PRODUTOS — as regras PURAS (a Adega, em js/garrafa.js, só desenha e chama; só o clique grava).
//
//   Destilar vinho   10 Gotas de Moscatel  -> +1 Aguardente vínica (state.adega.aguardente, o campo de sempre)
//   Destilar bagaço   3 Bagaço             -> +1 Bagaceira         (state.adega.bagaceira, campo novo, 0 por omissão)
//
// Os dois partilham o MESMO cooldown 'alambique' (state.adega.cooldowns.alambique). A aguardente VÍNICA (de vinho, como
// diz a Enciclopédia) é a do Fortificar e da jeropiga; a bagaceira (do bagaço) só serve, por agora, à jeropiga, e aí
// gasta-se PRIMEIRO a bagaceira e só depois a vínica (como a Compostagem gasta Resíduos antes do Bagaço).
// Sem uvas em nenhum custo. Quem já tinha aguardente (feita de bagaço) fica com o mesmo valor, agora vínica; a bagaceira começa a 0.
//
// Nada aqui lê o relógio nem sorteia nem grava: o "agora" e o cooldown chegam por argumento. Recusar nunca altera nada.
// ---------------------------------------------------------------------

const ALAMBIQUE_CONFIG = {
  gotasVinho: 10,        // Gotas gastas em "Destilar vinho"
  bagacoBagaceira: 3     // Bagaço gasto em "Destilar bagaço"
};

// Inteiro >= 0, ou 0 (negativo, em falta, texto, NaN...).
function alambiqueNumero(n) {
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

// Repara em memória state.adega.bagaceira (e o resto do que o Alambique toca). Devolve state.adega ou null.
function alambiqueEstado(estado) {
  if (!estado || typeof estado !== 'object') return null;
  const a = estado.adega;
  if (!a || typeof a !== 'object' || Array.isArray(a)) return null;
  a.bagaceira = alambiqueNumero(a.bagaceira);
  return a;
}

// Há alguma destilação possível (objetivo "Usa o Alambique" nunca impossível: Bagaço OU Gotas chegam)?
function alambiquePodeDestilar(estado) {
  if (!estado || typeof estado !== 'object') return false;
  const a = estado.adega && typeof estado.adega === 'object' ? estado.adega : {};
  return alambiqueNumero(a.bagaco) >= ALAMBIQUE_CONFIG.bagacoBagaceira || alambiqueNumero(estado.gotas) >= ALAMBIQUE_CONFIG.gotasVinho;
}

// Milissegundos que faltam para o cooldown acabar (0 = livre). Um carimbo no futuro conta como "agora" (relógio errado).
function alambiqueRestanteMs(estado, agora, cooldownMs) {
  const cd = estado && estado.adega && estado.adega.cooldowns && typeof estado.adega.cooldowns === 'object' ? estado.adega.cooldowns : null;
  const ultima = cd ? Number(cd.alambique) : NaN;
  if (!Number.isFinite(ultima) || ultima <= 0) return 0;
  return Math.max(0, cooldownMs - (agora - Math.min(ultima, agora)));
}

// Destila. tipo 'vinho' ou 'bagaco'. Devolve { ok, motivo, produto, restanteMs }:
//   motivo null | 'tipo_invalido' | 'estado_invalido' | 'parametros_invalidos' | 'cooldown' | 'faltam_gotas' | 'faltam_bagaco'
//   produto 'vinica' (aguardente vínica) | 'bagaceira' quando ok
// Em caso de sucesso gasta, soma e regista o cooldown (agora) NUM SÓ passo: um segundo clique no mesmo instante cai em
// 'cooldown' (duplo clique). Recusar não altera nada.
function alambiqueDestilar(estado, tipo, agora, cooldownMs) {
  const recusa = function (motivo, extra) { return Object.assign({ ok: false, motivo: motivo, produto: null, restanteMs: 0 }, extra || {}); };
  if (tipo !== 'vinho' && tipo !== 'bagaco') return recusa('tipo_invalido');
  if (!Number.isFinite(agora) || !Number.isFinite(cooldownMs) || cooldownMs < 0) return recusa('parametros_invalidos');
  const a = alambiqueEstado(estado);
  if (!a) return recusa('estado_invalido');
  const restante = alambiqueRestanteMs(estado, agora, cooldownMs);
  if (restante > 0) return recusa('cooldown', { restanteMs: restante });

  if (tipo === 'vinho') {
    const gotas = alambiqueNumero(estado.gotas);
    if (gotas < ALAMBIQUE_CONFIG.gotasVinho) return recusa('faltam_gotas');
    estado.gotas = gotas - ALAMBIQUE_CONFIG.gotasVinho;
    a.aguardente = alambiqueNumero(a.aguardente) + 1;
  } else {
    const bagaco = alambiqueNumero(a.bagaco);
    if (bagaco < ALAMBIQUE_CONFIG.bagacoBagaceira) return recusa('faltam_bagaco');
    a.bagaco = bagaco - ALAMBIQUE_CONFIG.bagacoBagaceira;
    a.bagaceira += 1;
  }
  if (!a.cooldowns || typeof a.cooldowns !== 'object' || Array.isArray(a.cooldowns)) a.cooldowns = {};
  a.cooldowns.alambique = agora;
  return { ok: true, motivo: null, produto: tipo === 'vinho' ? 'vinica' : 'bagaceira', restanteMs: 0 };
}

// Jeropiga de São Martinho: pede n aguardentes (festas.js: custoAguardente). Aceita Bagaceira OU Aguardente vínica e
// gasta PRIMEIRO a bagaceira. Devolve { ok, fonte }: fonte 'bagaceira' | 'vinica' | null. Recusar (nenhuma chega) não altera nada.
function alambiqueGastarParaJeropiga(estado, n) {
  const a = alambiqueEstado(estado);
  const pedido = Number.isInteger(n) && n >= 1 ? n : 1;
  if (!a) return { ok: false, fonte: null };
  if (a.bagaceira >= pedido) { a.bagaceira -= pedido; return { ok: true, fonte: 'bagaceira' }; }
  const vinica = alambiqueNumero(a.aguardente);
  if (vinica >= pedido) { a.aguardente = vinica - pedido; return { ok: true, fonte: 'vinica' }; }
  return { ok: false, fonte: null };
}

// Só lê: há com que fazer a jeropiga (para o botão)? Mesmo critério de alambiqueGastarParaJeropiga.
function alambiqueTemParaJeropiga(estado, n) {
  const a = estado && estado.adega && typeof estado.adega === 'object' ? estado.adega : null;
  if (!a) return false;
  const pedido = Number.isInteger(n) && n >= 1 ? n : 1;
  return alambiqueNumero(a.bagaceira) >= pedido || alambiqueNumero(a.aguardente) >= pedido;
}
