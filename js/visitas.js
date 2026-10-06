// ---------------------------------------------------------------------
// VISITAS À QUINTA — dados e funções puras (PR 1: base invisível).
//
// Três personagens visitam a Quinta: o Sr. Valentim (enólogo, o mais velho), a
// Marisa (trabalhadora da vindima) e o Dr. Henrique (provador). Cada um tem 4
// visitas (12 no total), com uma condição opcional ligada ao jogo (estação, fase
// da vinha, festa, Cave, garrafa a descansar) e uma "reputacao" de 1 a 3.
//
// As funções de dados e de escolha são puras; as do meio do ficheiro (PR 2) leem e gravam
// state.visitas (ver js/state.js) e as do fim (PR 3) desenham a linha no cartão da Quinta.
// Os textos são
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
// condição às sem condição; se todas as possíveis já foram feitas, volta a ser
// oferecida a feita há mais tempo (ciclo), em vez de ficar sem nada.
function escolherVisitaDoDia(feitasIds, contexto, diaLisboa) {
  const feitas = {}; // idVisita -> data 'AAAA-MM-DD' (true se não houver data)
  if (Array.isArray(feitasIds)) feitasIds.forEach(function (id) { feitas[id] = true; });
  else if (feitasIds && typeof feitasIds === 'object') Object.keys(feitasIds).forEach(function (id) { feitas[id] = feitasIds[id]; });

  if (!contexto || !(contexto.nivel >= VISITAS_NIVEL_MINIMO)) return { visita: null };
  if (visitasHash(diaLisboa + '#visita#dia') % VISITAS_UM_DIA_EM_N === 0) return { visita: null };

  const possiveis = VISITAS.filter(function (v) { return visitaCondicaoOk(v, contexto); });
  if (possiveis.length === 0) return { visita: null };

  const novas = possiveis.filter(function (v) { return feitas[v.id] === undefined; });
  if (novas.length > 0) {
    // Ainda há por fazer: preferem-se as COM condição às sem condição.
    const comCondicao = novas.filter(function (v) { return v.condicao !== null; });
    const candidatas = comCondicao.length > 0 ? comCondicao : novas;
    return { visita: candidatas[visitasHash(diaLisboa + '#visita#escolha') % candidatas.length] };
  }

  // Tudo feito: ciclo. Escolhe a feita há mais tempo (a data mais antiga em feitas); o
  // hash do dia só desempata. Como a feita ontem tem a data mais recente, com 2 ou mais
  // possíveis nunca repete a visita de ontem. Uma lista de ids não traz datas: empatam todas.
  const dataDe = function (v) { return typeof feitas[v.id] === 'string' ? feitas[v.id] : ''; };
  const maisAntiga = possiveis.reduce(function (min, v) { return dataDe(v) < min ? dataDe(v) : min; }, dataDe(possiveis[0]));
  const empatadas = possiveis.filter(function (v) { return dataDe(v) === maisAntiga; });
  return { visita: empatadas[visitasHash(diaLisboa + '#visita#escolha') % empatadas.length] };
}

// ---------------------------------------------------------------------
// ESTADO E PAGAMENTO (PR 2).
// state.visitas = { feitas: { idVisita: 'AAAA-MM-DD' }, hoje: { dia, id, feita } | null }.
// A Reputação só sobe, e só por visitaFazerHoje(). Em modo de teste (parâmetros de
// endereço) nada se grava nem se paga. Quem chamar ainda tem de refrescar o ecrã
// (updateStatsDisplays); a subida de nível é detetada depois por verificarSubidaNivel()
// ao entrar na Quinta, como com qualquer outra Reputação.
// ---------------------------------------------------------------------

// Parâmetros de teste do endereço que existem no jogo (+ ?visita=, reservado para esta).
const VISITAS_PARAMETROS_TESTE = ['estacao', 'festa', 'dia', 'dias', 'pista', 'tempo', 'pedido',
  'capitulo', 'falante', 'garrafaescura', 'nuvem', 'demora', 'convites', 'visita'];

function visitaEmModoTeste() {
  try {
    const params = new URLSearchParams(location.search);
    return VISITAS_PARAMETROS_TESTE.some(function (p) { return params.has(p); });
  } catch (e) { return false; }
}

// Contexto atual a partir das leituras do jogo; cada uma isolada: se falhar, esse
// campo fica nulo ou falso (nunca rebenta).
function visitaContextoAtual() {
  const c = { nivel: null, estacao: null, fase: null, festaAtiva: false, caveAberta: false, garrafaDias: null };
  try { c.nivel = nivelPelaReputacao(state.reputacao); } catch (e) {}
  try { c.estacao = estacaoAtual(); } catch (e) {}
  try { c.fase = faseRealAtual(); } catch (e) {}
  try { c.festaAtiva = festaAtual() !== null; } catch (e) {}
  try { c.caveAberta = caveReservaAberta() === true; } catch (e) {}
  try { c.garrafaDias = garrafaQueMaisDescansou(); } catch (e) {}
  return c;
}

// state.visitas com a forma certa (uma nuvem ou um save estranho podem trazer
// null ou outro tipo). Repara só em memória; grava-se com o próximo saveState.
function visitasEstado() {
  let v = state.visitas;
  if (!v || typeof v !== 'object' || Array.isArray(v)) v = state.visitas = { feitas: {}, hoje: null };
  if (!v.feitas || typeof v.feitas !== 'object' || Array.isArray(v.feitas)) v.feitas = {};
  if (v.hoje === undefined || (v.hoje !== null && (typeof v.hoje !== 'object' || Array.isArray(v.hoje)))) v.hoje = null;
  return v;
}

function visitaPorId(id) {
  return VISITAS.filter(function (x) { return x.id === id; })[0] || null;
}

// Resolve a visita de hoje sem gravar: { visita, feita, nova } (nova = escolhida agora,
// ainda não guardada em state.visitas.hoje) ou { visita: null }.
function visitaResolverHoje() {
  const v = visitasEstado();
  const hoje = diaLisboaDeHoje();
  const nivel = (function () { try { return nivelPelaReputacao(state.reputacao); } catch (e) { return 0; } })();
  if (!(nivel >= VISITAS_NIVEL_MINIMO)) return { visita: null };

  const h = v.hoje;
  if (h && h.dia === hoje) {
    const guardada = visitaPorId(h.id);
    if (guardada) return { visita: guardada, feita: h.feita === true, nova: false };
  }
  const r = escolherVisitaDoDia(v.feitas, visitaContextoAtual(), hoje);
  return r.visita ? { visita: r.visita, feita: false, nova: true } : { visita: null };
}

// A visita de hoje: { visita, feita } ou { visita: null }. Se state.visitas.hoje já é
// de hoje (dia de Lisboa), usa-se (estável mesmo que o contexto mude durante o dia).
// Senão escolhe com escolherVisitaDoDia() e, havendo visita e não sendo modo de teste,
// guarda hoje = { dia, id, feita: false } com um saveState.
function visitaDeHoje() {
  const r = visitaResolverHoje();
  if (!r.visita) return { visita: null };
  if (r.nova && !visitaEmModoTeste()) {
    visitasEstado().hoje = { dia: diaLisboaDeHoje(), id: r.visita.id, feita: false };
    saveState(state);
  }
  return { visita: r.visita, feita: r.feita };
}

// Faz a visita de hoje: marca feita, regista em feitas, soma visita.reputacao e grava
// UMA vez (tudo junto, mesmo que a visita ainda não estivesse guardada). { ok: true,
// visita } ou { ok: false }. Idempotente (hoje.feita); em modo de teste não grava nem paga.
function visitaFazerHoje() {
  if (visitaEmModoTeste()) return { ok: false };
  const r = visitaResolverHoje();
  if (!r.visita || r.feita) return { ok: false };
  const dia = diaLisboaDeHoje();
  const v = visitasEstado();
  v.hoje = { dia: dia, id: r.visita.id, feita: true };
  v.feitas[r.visita.id] = dia;
  state.reputacao += r.visita.reputacao;
  saveState(state);
  return { ok: true, visita: r.visita };
}

// ---------------------------------------------------------------------
// LINHA NO CARTÃO DA QUINTA (PR 3). "Hoje: {nome} está na Quinta", só a partir do
// nível 4, sem balão automático: ao tocar mostra a fala da visita e, na 1.ª vez, paga.
// Se o texto da visita ainda for "[por escrever]" (em qualquer língua) a linha não
// aparece e nada se grava. Teste: ?visita=id mostra a linha com essa visita (ignora
// época, condição, nível e "[por escrever]"); não grava nem paga.
// ---------------------------------------------------------------------

function visitaPersonagemPorId(id) {
  return VISITAS_PERSONAGENS.filter(function (p) { return p.id === id; })[0] || null;
}

function visitaTextoPorEscrever(visita) {
  return ['pt', 'en', 'es'].some(function (l) { return !visita.texto[l] || String(visita.texto[l]).indexOf(VISITAS_POR_ESCREVER) !== -1; });
}

// ?visita=id com um dos ids das visitas, ou null.
function visitaDeTeste() {
  try {
    const id = new URLSearchParams(location.search).get('visita');
    return id ? visitaPorId(id) : null;
  } catch (e) { return null; }
}

// O que a linha mostra: { visita, feita } ou { visita: null }. Só lê; só grava (via
// visitaDeHoje) quando há mesmo uma linha a mostrar.
function visitaParaLinha() {
  const teste = visitaDeTeste();
  if (teste) return { visita: teste, feita: false };
  const r = visitaResolverHoje();
  if (!r.visita || visitaTextoPorEscrever(r.visita)) return { visita: null };
  return visitaDeHoje();
}

function visitaFalaDe(visita) {
  const p = visitaPersonagemPorId(visita.personagem);
  const nome = p ? (p.nome[currentLang] || p.nome.pt) : '';
  return { nome: nome, texto: visita.texto[currentLang] || visita.texto.pt };
}

function atualizarLinhaVisitaQuinta() {
  const container = document.getElementById('visita-container');
  if (!container) return;
  let r;
  try { r = visitaParaLinha(); } catch (e) { r = { visita: null }; }
  if (!r.visita) { container.innerHTML = ''; return; }
  const texto = t('visita.linha').replace('{nome}', t('visita.nome.' + r.visita.personagem));
  container.innerHTML =
    '<div class="mini-bloco">' +
      '<button type="button" class="visita-linha' + (r.feita ? ' feita' : '') + '" onclick="visitaLinhaToque()">' +
        texto + (r.feita ? ' ✓' : '') +
      '</button>' +
    '</div>';
}

function visitaLinhaToque() {
  const r = visitaParaLinha();
  if (!r.visita) { atualizarLinhaVisitaQuinta(); return; }
  const fala = visitaFalaDe(r.visita);
  mostrarFalas([fala.texto], fala.nome);
  const pago = visitaFazerHoje();
  if (pago.ok) {
    vibrar('sucesso');
    tocarSom('objetivoCumprido');
    updateStatsDisplays();
    if (typeof atualizarCartaoNivelQuinta === 'function') atualizarCartaoNivelQuinta();
    if (typeof atualizarResumoQuinta === 'function') atualizarResumoQuinta();
    atualizarLinhaVisitaQuinta();
  }
}
