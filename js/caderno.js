// ---------------------------------------------------------------------
// CADERNO DOS FYGMOS — estrutura e dados (PR A: sem ecrã e sem efeito no jogo).
//
// O Caderno é o caderno de PLANOS dos porcos: depois de travar um assalto o
// YoshiCat encontra uma página rasgada escrita pelo Fygmo ou pelo Fygmo2. Cada
// página liga a um ALVO do dia (ver ASSALTOS_ALVOS em js/assaltos.js).
//
// Este ficheiro só tem dados e funções puras; ainda NINGUÉM o chama. O estado
// vive em state.caderno = { paginas: { idPagina: 'AAAA-MM-DD' (Lisboa) } } (ver
// js/state.js) e a nuvem junta-o por união (nuvemJuntarCaderno em js/nuvem.js).
//
// Os textos são provisórios: "[por escrever]" em todas as línguas, até serem
// escritos e aprovados. `node scripts/verificar-caderno.js --final` falha
// enquanto restar essa marca.
// ---------------------------------------------------------------------

const CADERNO_POR_ESCREVER = '[por escrever]';
const PLACEHOLDER_TEXTO = { titulo: CADERNO_POR_ESCREVER, corpo: CADERNO_POR_ESCREVER };

const CADERNO_ALVOS = ['vinha', 'adega', 'cave', 'nevoeiro', 'trovoada'];

// Por alvo: 2 comuns + 1 rara (15 páginas). Os ids são estáveis (é o que se
// grava no estado) e iguais nas 3 línguas. Autor: 'Fygmo' (o mais velho, de
// boina) ou 'Fygmo2' (o mais novo, de monóculo).
const CADERNO_PAGINAS = [
  { id: 'vinha_1', alvo: 'vinha', raridade: 'comum', autor: 'Fygmo',
    pt: PLACEHOLDER_TEXTO, en: PLACEHOLDER_TEXTO, es: PLACEHOLDER_TEXTO },
  { id: 'vinha_2', alvo: 'vinha', raridade: 'comum', autor: 'Fygmo',
    pt: PLACEHOLDER_TEXTO, en: PLACEHOLDER_TEXTO, es: PLACEHOLDER_TEXTO },
  { id: 'vinha_rara', alvo: 'vinha', raridade: 'rara', autor: 'Fygmo',
    pt: PLACEHOLDER_TEXTO, en: PLACEHOLDER_TEXTO, es: PLACEHOLDER_TEXTO },
  { id: 'adega_1', alvo: 'adega', raridade: 'comum', autor: 'Fygmo',
    pt: PLACEHOLDER_TEXTO, en: PLACEHOLDER_TEXTO, es: PLACEHOLDER_TEXTO },
  { id: 'adega_2', alvo: 'adega', raridade: 'comum', autor: 'Fygmo',
    pt: PLACEHOLDER_TEXTO, en: PLACEHOLDER_TEXTO, es: PLACEHOLDER_TEXTO },
  { id: 'adega_rara', alvo: 'adega', raridade: 'rara', autor: 'Fygmo',
    pt: PLACEHOLDER_TEXTO, en: PLACEHOLDER_TEXTO, es: PLACEHOLDER_TEXTO },
  { id: 'cave_1', alvo: 'cave', raridade: 'comum', autor: 'Fygmo2',
    pt: PLACEHOLDER_TEXTO, en: PLACEHOLDER_TEXTO, es: PLACEHOLDER_TEXTO },
  { id: 'cave_2', alvo: 'cave', raridade: 'comum', autor: 'Fygmo2',
    pt: PLACEHOLDER_TEXTO, en: PLACEHOLDER_TEXTO, es: PLACEHOLDER_TEXTO },
  { id: 'cave_rara', alvo: 'cave', raridade: 'rara', autor: 'Fygmo2',
    pt: PLACEHOLDER_TEXTO, en: PLACEHOLDER_TEXTO, es: PLACEHOLDER_TEXTO },
  { id: 'nevoeiro_1', alvo: 'nevoeiro', raridade: 'comum', autor: 'Fygmo2',
    pt: PLACEHOLDER_TEXTO, en: PLACEHOLDER_TEXTO, es: PLACEHOLDER_TEXTO },
  { id: 'nevoeiro_2', alvo: 'nevoeiro', raridade: 'comum', autor: 'Fygmo2',
    pt: PLACEHOLDER_TEXTO, en: PLACEHOLDER_TEXTO, es: PLACEHOLDER_TEXTO },
  { id: 'nevoeiro_rara', alvo: 'nevoeiro', raridade: 'rara', autor: 'Fygmo2',
    pt: PLACEHOLDER_TEXTO, en: PLACEHOLDER_TEXTO, es: PLACEHOLDER_TEXTO },
  { id: 'trovoada_1', alvo: 'trovoada', raridade: 'comum', autor: 'Fygmo',
    pt: PLACEHOLDER_TEXTO, en: PLACEHOLDER_TEXTO, es: PLACEHOLDER_TEXTO },
  { id: 'trovoada_2', alvo: 'trovoada', raridade: 'comum', autor: 'Fygmo',
    pt: PLACEHOLDER_TEXTO, en: PLACEHOLDER_TEXTO, es: PLACEHOLDER_TEXTO },
  { id: 'trovoada_rara', alvo: 'trovoada', raridade: 'rara', autor: 'Fygmo',
    pt: PLACEHOLDER_TEXTO, en: PLACEHOLDER_TEXTO, es: PLACEHOLDER_TEXTO }
];

// Chance (em %) de a página sorteada ser rara, sem e com isco na ronda.
const CADERNO_CHANCE_RARA = 15;
const CADERNO_CHANCE_RARA_COM_ISCO = 40;

// Mesmo tipo de hash do assaltosHash() (js/assaltos.js), mas com semente própria.
function cadernoHash(semente) {
  let h = 0;
  for (let i = 0; i < semente.length; i++) h = (h * 31 + semente.charCodeAt(i)) >>> 0;
  return h;
}

// Escolhe a página a dar numa vitória. Pura: o mesmo (hoje, indice, alvo) e os
// mesmos argumentos dão sempre a mesma resposta.
//   alvo       'vinha' | 'adega' | 'cave' | 'nevoeiro' | 'trovoada'
//   tenhoIds   ids que o jogador já tem: lista, ou o mapa state.caderno.paginas
//   hoje       'AAAA-MM-DD' (Lisboa); indice: índice da pista (0 ou 1)
//   houveIsco  true se a ronda teve isco (raras mais prováveis)
//   caveAberta true se tem a Cave de Reserva (as páginas da cave só então entram)
// Devolve { pagina, completo }:
//   pagina    a página nova, ou null se não há nenhuma para dar;
//   completo  true só se o alvo tem páginas disponíveis e o jogador já as tem
//             todas (alvo desconhecido ou cave fechada: pagina null, completo false).
function escolherPaginaCaderno(alvo, tenhoIds, hoje, indice, houveIsco, caveAberta) {
  const tenho = {};
  if (Array.isArray(tenhoIds)) tenhoIds.forEach(function (id) { tenho[id] = true; });
  else if (tenhoIds && typeof tenhoIds === 'object') Object.keys(tenhoIds).forEach(function (id) { tenho[id] = true; });

  const pool = CADERNO_PAGINAS.filter(function (p) {
    return p.alvo === alvo && (p.alvo !== 'cave' || !!caveAberta);
  });
  if (pool.length === 0) return { pagina: null, completo: false };

  const novas = pool.filter(function (p) { return tenho[p.id] !== true; });
  if (novas.length === 0) return { pagina: null, completo: true };

  const semente = hoje + '#caderno#' + indice;
  const limite = houveIsco ? CADERNO_CHANCE_RARA_COM_ISCO : CADERNO_CHANCE_RARA;
  const querRara = (cadernoHash(semente) % 100) < limite;
  const doTipo = function (raridade) { return novas.filter(function (p) { return p.raridade === raridade; }); };
  let candidatas = doTipo(querRara ? 'rara' : 'comum');
  if (candidatas.length === 0) candidatas = doTipo(querRara ? 'comum' : 'rara');

  const pagina = candidatas[cadernoHash(semente + '#pagina') % candidatas.length];
  return { pagina: pagina, completo: false };
}
