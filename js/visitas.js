// ---------------------------------------------------------------------
// VISITAS À QUINTA — dados e funções puras (PR 1: base invisível).
//
// Três personagens visitam a Quinta: o Sr. Valentim (enólogo, o mais velho), a
// Marisa (trabalhadora da vindima) e o Dr. Henrique (provador). Cada um tem 4
// visitas (12 no total), com uma condição opcional ligada ao jogo (estação, fase
// da vinha, festa, Cave, garrafa a descansar) e uma "reputacao" de 1 a 3.
//
// NADA chama estas funções ainda: sem ecrã, sem estado, sem nuvem. Os textos são
// provisórios ("[por escrever]" em todas as línguas) até serem escritos e
// aprovados; `node scripts/verificar-visitas.js --final` falha enquanto restar
// essa marca. As funções são puras: tudo vem por parâmetro (nada de Math.random
// nem de Date.now aqui dentro).
//
// Leituras do jogo de onde virá o contexto (só lidas, nunca alteradas):
//   nivelPelaReputacao(state.reputacao)  1 a 6 (js/niveis.js)
//   estacaoAtual()                       'inverno' | 'primavera' | 'verao' | 'outono' (js/estacoes.js)
//   faseRealAtual()                      'repouso' | 'choro' | 'rebentacao' | 'floracao' |
//                                        'vingamento' | 'pintor' | 'vindima' | 'fimVindima' |
//                                        'quedaFolha' (js/estacoes.js)
//   festaAtual() !== null                festaAtiva (js/festas.js; objeto da festa ou null)
//   caveReservaAberta()                  caveAberta (boolean; js/garrafa.js)
//   garrafaQueMaisDescansou()            garrafaDias: inteiro >= 1, ou null sem dados (js/garrafa.js)
// ---------------------------------------------------------------------

const VISITAS_POR_ESCREVER = '[por escrever]';
const VISITAS_NIVEL_MINIMO = 4;
// Em média 1 dia em cada VISITAS_UM_DIA_EM_N fica sem visita (decidido pelo hash do dia).
const VISITAS_UM_DIA_EM_N = 4;

const VISITAS_PERSONAGENS = [
  { id: 'valentim',
    nome: { pt: 'Sr. Valentim', en: 'Mr. Valentim', es: 'Sr. Valentim' },
    papel: { pt: 'enólogo', en: 'winemaker', es: 'enólogo' } },
  { id: 'marisa',
    nome: { pt: 'Marisa', en: 'Marisa', es: 'Marisa' },
    papel: { pt: 'trabalhadora da vindima', en: 'grape-harvest worker', es: 'trabajadora de la vendimia' } },
  { id: 'henrique',
    nome: { pt: 'Dr. Henrique', en: 'Dr. Henrique', es: 'Dr. Henrique' },
    papel: { pt: 'provador', en: 'taster', es: 'catador' } }
];

// Condições (null = sem condição):
//   { tipo: 'estacao', valor }   estacaoAtual() === valor
//   { tipo: 'fase', valores }    faseRealAtual() é um dos valores
//   { tipo: 'festa' }            festaAtual() !== null
//   { tipo: 'garrafa' }          garrafaQueMaisDescansou() >= 1 (1 dia ou mais a descansar)
//   { tipo: 'cave' }             caveReservaAberta()
const VISITAS_FASES_VINDIMA = ['vindima', 'fimVindima'];
const VISITAS_TEXTO_POR_ESCREVER = { pt: VISITAS_POR_ESCREVER, en: VISITAS_POR_ESCREVER, es: VISITAS_POR_ESCREVER };

// Os ids são estáveis e iguais nas 3 línguas.
const VISITAS = [
  { id: 'valentim_1', personagem: 'valentim', reputacao: 2, condicao: { tipo: 'estacao', valor: 'inverno' }, texto: VISITAS_TEXTO_POR_ESCREVER },
  { id: 'valentim_2', personagem: 'valentim', reputacao: 1, condicao: { tipo: 'estacao', valor: 'primavera' }, texto: VISITAS_TEXTO_POR_ESCREVER },
  { id: 'valentim_3', personagem: 'valentim', reputacao: 3, condicao: { tipo: 'fase', valores: VISITAS_FASES_VINDIMA }, texto: VISITAS_TEXTO_POR_ESCREVER },
  { id: 'valentim_4', personagem: 'valentim', reputacao: 1, condicao: null, texto: VISITAS_TEXTO_POR_ESCREVER },
  { id: 'marisa_1', personagem: 'marisa', reputacao: 2, condicao: { tipo: 'fase', valores: VISITAS_FASES_VINDIMA }, texto: VISITAS_TEXTO_POR_ESCREVER },
  { id: 'marisa_2', personagem: 'marisa', reputacao: 1, condicao: { tipo: 'fase', valores: VISITAS_FASES_VINDIMA }, texto: VISITAS_TEXTO_POR_ESCREVER },
  { id: 'marisa_3', personagem: 'marisa', reputacao: 1, condicao: { tipo: 'estacao', valor: 'primavera' }, texto: VISITAS_TEXTO_POR_ESCREVER },
  { id: 'marisa_4', personagem: 'marisa', reputacao: 2, condicao: null, texto: VISITAS_TEXTO_POR_ESCREVER },
  { id: 'henrique_1', personagem: 'henrique', reputacao: 2, condicao: { tipo: 'festa' }, texto: VISITAS_TEXTO_POR_ESCREVER },
  { id: 'henrique_2', personagem: 'henrique', reputacao: 3, condicao: { tipo: 'garrafa' }, texto: VISITAS_TEXTO_POR_ESCREVER },
  { id: 'henrique_3', personagem: 'henrique', reputacao: 1, condicao: null, texto: VISITAS_TEXTO_POR_ESCREVER },
  { id: 'henrique_4', personagem: 'henrique', reputacao: 2, condicao: { tipo: 'cave' }, texto: VISITAS_TEXTO_POR_ESCREVER }
];

// Mesmo tipo de hash do cadernoHash() (js/caderno.js), com sementes próprias.
function visitasHash(semente) {
  let h = 0;
  for (let i = 0; i < semente.length; i++) h = (h * 31 + semente.charCodeAt(i)) >>> 0;
  return h;
}

// A visita pode acontecer neste contexto?
//   contexto = { nivel, estacao, fase, festaAtiva, caveAberta, garrafaDias }
// Só há visitas a partir do nível 4 (abaixo, sempre falso).
function visitaCondicaoOk(visita, contexto) {
  if (!visita || !contexto) return false;
  if (!(contexto.nivel >= VISITAS_NIVEL_MINIMO)) return false;
  const c = visita.condicao;
  if (!c) return true;
  if (c.tipo === 'estacao') return contexto.estacao === c.valor;
  if (c.tipo === 'fase') return c.valores.indexOf(contexto.fase) !== -1;
  if (c.tipo === 'festa') return contexto.festaAtiva === true;
  if (c.tipo === 'garrafa') return typeof contexto.garrafaDias === 'number' && contexto.garrafaDias >= 1;
  if (c.tipo === 'cave') return contexto.caveAberta === true;
  return false; // condição desconhecida: nunca
}

// Visita do dia: { visita } ou { visita: null }. Pura e estável para o mesmo
// (feitasIds, contexto, diaLisboa 'AAAA-MM-DD').
//   feitasIds  ids já feitos: lista, ou um mapa idVisita -> qualquer coisa
// Regras: no máximo 1 por dia; cerca de 1 dia em 4 sem visita (hash do dia);
// só entre as que cumprem as condições e ainda não estão feitas, preferindo as COM
// condição às sem condição; se todas as possíveis já foram feitas, voltam a ser
// oferecidas (ciclo) em vez de ficar sem nada.
function escolherVisitaDoDia(feitasIds, contexto, diaLisboa) {
  const feitas = {};
  if (Array.isArray(feitasIds)) feitasIds.forEach(function (id) { feitas[id] = true; });
  else if (feitasIds && typeof feitasIds === 'object') Object.keys(feitasIds).forEach(function (id) { feitas[id] = true; });

  if (!contexto || !(contexto.nivel >= VISITAS_NIVEL_MINIMO)) return { visita: null };
  if (visitasHash(diaLisboa + '#visita#dia') % VISITAS_UM_DIA_EM_N === 0) return { visita: null };

  const possiveis = VISITAS.filter(function (v) { return visitaCondicaoOk(v, contexto); });
  if (possiveis.length === 0) return { visita: null };

  const novas = possiveis.filter(function (v) { return feitas[v.id] !== true; });
  const base = novas.length > 0 ? novas : possiveis; // tudo feito: ciclo
  const comCondicao = base.filter(function (v) { return v.condicao !== null; });
  const candidatas = comCondicao.length > 0 ? comCondicao : base;
  return { visita: candidatas[visitasHash(diaLisboa + '#visita#escolha') % candidatas.length] };
}
