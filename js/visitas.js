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
//   nivelPelaReputacao(state.reputacao)  1 a 10 (js/niveis.js)
//   estacaoAtual()                       'inverno' | 'primavera' | 'verao' | 'outono' (js/estacoes.js)
//   faseRealAtual()                      'repouso' | 'choro' | 'rebentacao' | 'floracao' |
//                                        'vingamento' | 'pintor' | 'vindima' | 'fimVindima' |
//                                        'quedaFolha' (js/estacoes.js)
//   festaAtual() é o São Martinho        festaAtiva (js/festas.js; o texto da visita é dessa festa)
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
//   { tipo: 'festa' }            festaAtiva (o São Martinho está aberto)
//   { tipo: 'garrafa' }          garrafaQueMaisDescansou() >= 1 (1 dia ou mais a descansar)
//   { tipo: 'cave' }             caveReservaAberta()
const VISITAS_FASES_VINDIMA = ['vindima', 'fimVindima'];
const VISITAS_TEXTO_POR_ESCREVER = { pt: VISITAS_POR_ESCREVER, en: VISITAS_POR_ESCREVER, es: VISITAS_POR_ESCREVER };

// Os ids são estáveis e iguais nas 3 línguas.
const VISITAS = [
  { id: 'valentim_1', personagem: 'valentim', reputacao: 2, condicao: { tipo: 'estacao', valor: 'inverno' }, texto: { pt: 'A poda é uma conversa com a videira: corta-se o que ela já não precisa de dizer.', en: 'Pruning is a conversation with the vine: you cut away what it no longer needs to say.', es: 'Podar es una conversación con la vid: se corta lo que ya no necesita decir.' } },
  { id: 'valentim_2', personagem: 'valentim', reputacao: 1, condicao: { tipo: 'estacao', valor: 'primavera' }, texto: { pt: 'Quando a videira chora no fim do inverno, eu paro e ouço. Dizem que é só seiva. Dizem.', en: 'When the vine weeps at the end of winter, I stop and listen. They say it\'s just sap. They say.', es: 'Cuando la vid llora a finales del invierno, me paro a escucharla. Dicen que es solo savia. Dicen.' } },
  { id: 'valentim_3', personagem: 'valentim', reputacao: 3, condicao: { tipo: 'fase', valores: VISITAS_FASES_VINDIMA }, texto: { pt: 'Nas minhas cepas é à mão. Não é teimosia: é conversa.', en: 'On my vines it\'s by hand. It\'s not stubbornness: it\'s conversation.', es: 'En mis cepas se hace a mano. No es terquedad: es conversación.' } },
  { id: 'valentim_4', personagem: 'valentim', reputacao: 1, condicao: null, texto: { pt: 'Quarenta anos de Moscatel e ainda me enganam com o primeiro gole.', en: 'Forty years of Moscatel and the first sip still fools me.', es: 'Cuarenta años de Moscatel y el primer trago todavía me engaña.' } },
  { id: 'marisa_1', personagem: 'marisa', reputacao: 2, condicao: { tipo: 'fase', valores: VISITAS_FASES_VINDIMA }, texto: { pt: 'Apanhámos cedo. A máquina ia à frente e o Sr. Valentim atrás, a resmungar. Correu bem.', en: 'We picked early. The machine went ahead and Mr. Valentim behind it, grumbling. It went well.', es: 'Vendimiamos temprano. La máquina iba delante y el Sr. Valentim detrás, refunfuñando. Salió bien.' } },
  { id: 'marisa_2', personagem: 'marisa', reputacao: 1, condicao: { tipo: 'fase', valores: VISITAS_FASES_VINDIMA }, texto: { pt: 'Dizem que à mão sabe melhor. Eu digo que a uva chega ao lagar sem se cansar de esperar.', en: 'They say it tastes better by hand. I say the grapes reach the winery without getting tired of waiting.', es: 'Dicen que a mano sabe mejor. Yo digo que la uva llega al lagar sin cansarse de esperar.' } },
  { id: 'marisa_3', personagem: 'marisa', reputacao: 1, condicao: { tipo: 'estacao', valor: 'primavera' }, texto: { pt: 'Primavera é atar ramos e tirar ervas. Pouco glamour, muita vinha.', en: 'Spring is tying shoots and pulling weeds. Not much glamour, a lot of vineyard.', es: 'La primavera es atar brotes y quitar hierbas. Poco glamur, mucho viñedo.' } },
  { id: 'marisa_4', personagem: 'marisa', reputacao: 2, condicao: null, texto: { pt: 'Eu sou do tempo dos tratores, o Sr. Valentim do tempo dos burros. Entendemo-nos ao almoço.', en: 'I\'m from the tractor era, Mr. Valentim from the donkey era. We get along at lunch.', es: 'Yo soy de la época de los tractores, el Sr. Valentim de la de los burros. Nos entendemos en el almuerzo.' } },
  { id: 'henrique_1', personagem: 'henrique', reputacao: 2, condicao: { tipo: 'festa' }, texto: { pt: 'São Martinho: castanhas, jeropiga e um dilema ético sobre quantas castanhas é decente comer.', en: 'St. Martin\'s Day: chestnuts, jeropiga and an ethical dilemma about how many chestnuts it is decent to eat.', es: 'San Martín: castañas, jeropiga y un dilema ético sobre cuántas castañas es decente comer.' } },
  { id: 'henrique_2', personagem: 'henrique', reputacao: 3, condicao: { tipo: 'garrafa' }, texto: { pt: 'Notas de mel, um sopro de laranja e uma ligeira desconfiança. A última é minha.', en: 'Notes of honey, a breath of orange and a slight suspicion. The last one is mine.', es: 'Notas de miel, un soplo de naranja y una ligera sospecha. La última es mía.' } },
  { id: 'henrique_3', personagem: 'henrique', reputacao: 1, condicao: null, texto: { pt: 'Provar é uma arte. Cuspir é uma tragédia. Faço as duas com elegância.', en: 'Tasting is an art. Spitting is a tragedy. I do both with elegance.', es: 'Catar es un arte. Escupir es una tragedia. Hago ambas con elegancia.' } },
  { id: 'henrique_4', personagem: 'henrique', reputacao: 2, condicao: { tipo: 'cave' }, texto: { pt: 'Ouvi dizer que dois porcos tentaram a tua Reserva. Têm bom gosto e péssimo método.', en: 'I hear two pigs tried your Reserve. Good taste, terrible method.', es: 'He oído que dos cerdos intentaron llevarse tu Reserva. Tienen buen gusto y un método pésimo.' } }
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
  // O texto da visita 'festa' (henrique_1) é do São Martinho: com o Natal aberto não conta como festa ativa.
  try { const f = festaAtual(); c.festaAtiva = f !== null && f.id === 'saomartinho'; } catch (e) {}
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

// O dia da visita: o de hoje, ou o guardado se for posterior (data do aparelho
// atrás), para a visita já feita não voltar a pagar nem a ser escolhida de novo.
function visitaDiaEfetivo() {
  const h = visitasEstado().hoje;
  return diaLisboaEfetivo(diaLisboaDeHoje(), h && typeof h === 'object' ? h.dia : null);
}

// Resolve a visita de hoje sem gravar: { visita, feita, nova } (nova = escolhida agora,
// ainda não guardada em state.visitas.hoje) ou { visita: null }.
function visitaResolverHoje() {
  const v = visitasEstado();
  const hoje = visitaDiaEfetivo();
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
    visitasEstado().hoje = { dia: visitaDiaEfetivo(), id: r.visita.id, feita: false };
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
  const dia = visitaDiaEfetivo();
  const v = visitasEstado();
  v.hoje = { dia: dia, id: r.visita.id, feita: true };
  v.feitas[r.visita.id] = dia;
  state.reputacao += r.visita.reputacao;
  saveState(state);
  return { ok: true, visita: r.visita };
}

// ---------------------------------------------------------------------
// UM COPO DE BAGACEIRA À VISITA. A partir do nível 4 (o das visitas), depois de tocar na linha da
// visita de hoje, pode-se oferecer 1 bagaceira (state.adega.bagaceira, a da Loja e do Alambique):
// gasta 1, dá +VISITAS_BAGACEIRA_REPUTACAO de Reputação, e só 1 copo por dia no total (não por
// visita). O "já ofereci hoje" vive em state.visitas.hoje.bagaceiraDia (o dia de Lisboa da
// oferta): como "hoje" é substituído quando o dia muda, repõe-se sozinho com a visita nova; não há
// campo novo no estado. Sem bagaceira o botão aparece desativado e nada se gasta. Não usa a
// Despensa nem a Estrada: ao nível 7 convive com o "Oferecer" de bens (cada um com o seu limite).
// As funções de regras são puras (estado e dia 'AAAA-MM-DD' por parâmetro); só o clique grava.
// O Chizo nunca recebe o copo: só há falas para as três visitas.
// Falas de agradecimento: só humor e simpatia (um copo, uma vez, com graça).
// ---------------------------------------------------------------------

const VISITAS_BAGACEIRA_REPUTACAO = 1;

const VISITAS_BAGACEIRA_FALAS = {
  valentim: { pt: 'Um copo, só um: o resto da conversa deixo-o à videira. Obrigado.', en: 'One glass, just one: I\'ll leave the rest of the conversation to the vine. Thank you.', es: 'Un vaso, solo uno: el resto de la conversación se lo dejo a la vid. Gracias.' },
  marisa: { pt: 'Para mim? Que simpatia! Um brinde à vinha e depois é voltar ao trabalho.', en: 'For me? How kind! A toast to the vineyard, and then it\'s back to work.', es: '¿Para mí? ¡Qué amable! Un brindis por el viñedo y luego, a trabajar.' },
  henrique: { pt: 'Boa cor, bom perfume e um anfitrião generoso. Aprovo os três.', en: 'Good colour, good nose and a generous host. I approve of all three.', es: 'Buen color, buen aroma y un anfitrión generoso. Apruebo los tres.' }
};

// Pode-se oferecer agora? Só lê (não repara nem altera nada). `dia` é o dia (Lisboa) efetivo.
// Devolve { ok, motivo, personagem }, motivo null | 'nivel' | 'sem_visita' | 'nao_tocada' | 'ja_hoje' | 'sem_bagaceira'.
function visitaBagaceiraPode(estado, dia) {
  const recusa = function (motivo) { return { ok: false, motivo: motivo, personagem: null }; };
  if (!estado || typeof estado !== 'object' || typeof dia !== 'string') return recusa('sem_visita');
  let nivel = 0;
  try { nivel = nivelPelaReputacao(estado.reputacao); } catch (e) {}
  if (!(nivel >= VISITAS_NIVEL_MINIMO)) return recusa('nivel');
  const vs = estado.visitas;
  const h = vs && typeof vs === 'object' ? vs.hoje : null;
  if (!h || typeof h !== 'object' || h.dia !== dia) return recusa('sem_visita');
  const visita = visitaPorId(h.id);
  if (!visita) return recusa('sem_visita');
  if (h.feita !== true) return recusa('nao_tocada');
  if (h.bagaceiraDia === dia) return { ok: false, motivo: 'ja_hoje', personagem: visita.personagem };
  const a = estado.adega;
  if (!a || typeof a !== 'object' || alambiqueNumero(a.bagaceira) < 1) return { ok: false, motivo: 'sem_bagaceira', personagem: visita.personagem };
  return { ok: true, motivo: null, personagem: visita.personagem };
}

// Oferece 1 copo: valida tudo antes de alterar (recusar nunca altera nada). Se ok: gasta 1
// bagaceira, soma a Reputação e marca o dia. Não grava (quem chama grava).
// Devolve { ok, motivo, personagem, reputacaoGanha }.
function visitaBagaceiraOferecer(estado, dia) {
  const p = visitaBagaceiraPode(estado, dia);
  if (!p.ok) return { ok: false, motivo: p.motivo, personagem: p.personagem, reputacaoGanha: 0 };
  alambiqueEstado(estado).bagaceira -= 1;
  estado.reputacao = (typeof estado.reputacao === 'number' && Number.isFinite(estado.reputacao) ? estado.reputacao : 0) + VISITAS_BAGACEIRA_REPUTACAO;
  estado.visitas.hoje.bagaceiraDia = dia;
  return { ok: true, motivo: null, personagem: p.personagem, reputacaoGanha: VISITAS_BAGACEIRA_REPUTACAO };
}

// Só em memória: a oferta feita (para mostrar o agradecimento) até se sair da app.
let visitaBagaceiraResultado = null; // { dia, personagem }

// O que se vê por baixo da linha da visita (só lê; '' se não houver nada a mostrar): o agradecimento
// logo a seguir à oferta, a linha "já ofereceste hoje", ou o botão (desativado e com a frase do
// Alambique se faltar bagaceira). Só com a visita de hoje já tocada e fora do modo de teste.
function visitaBagaceiraHtml() {
  if (visitaEmModoTeste()) return '';
  const r = visitaResolverHoje();
  if (!r.visita || r.nova || r.feita !== true || visitaTextoPorEscrever(r.visita)) return '';
  const dia = visitaDiaEfetivo();
  const res = visitaBagaceiraResultado;
  if (res && res.dia === dia && res.personagem === r.visita.personagem) {
    const fala = VISITAS_BAGACEIRA_FALAS[res.personagem];
    return '<div class="mini-bloco"><div class="oferta-resultado">' +
      '<p>' + cadernoEscapar(t('bagaceira.ofereceste').replace('{nome}', t('oferta.a.' + res.personagem))) + '</p>' +
      '<p>' + t('oferta.rep').replace('{n}', VISITAS_BAGACEIRA_REPUTACAO) + '</p>' +
      (fala ? '<p class="oferta-fala">«' + cadernoEscapar(fala[currentLang] || fala.pt) + '»</p>' : '') +
    '</div></div>';
  }
  const p = visitaBagaceiraPode(state, dia);
  if (p.motivo === 'ja_hoje') return '<div class="mini-bloco"><p class="oferta-linha">' + t('bagaceira.jaHoje') + '</p></div>';
  if (p.motivo === 'sem_bagaceira') {
    return '<div class="mini-bloco"><button type="button" class="btn-pill pill-main oferta-botao" disabled>' + t('bagaceira.btn') + '</button>' +
      '<p class="oferta-linha">' + t('bagaceira.sem') + '</p></div>';
  }
  if (!p.ok) return '';
  return '<div class="mini-bloco"><button type="button" class="btn-pill pill-main oferta-botao" onclick="visitaBagaceiraClique()">' + t('bagaceira.btn') + '</button></div>';
}

// O ÚNICO sítio que oferece e grava. Oferece e, se correu bem, grava UMA vez e atualiza a barra de
// cima. Se recusou, não grava. O toque duplo é travado pelo próprio limite (a marca do dia).
function visitaBagaceiraClique() {
  if (!visitaEmModoTeste()) {
    const dia = visitaDiaEfetivo();
    const r = visitaBagaceiraOferecer(state, dia);
    if (r.ok) {
      saveState(state);
      visitaBagaceiraResultado = { dia: dia, personagem: r.personagem };
      vibrar('sucesso');
      tocarSom('objetivoCumprido');
      updateStatsDisplays();
    }
  }
  if (typeof atualizarCartaoNivelQuinta === 'function') atualizarCartaoNivelQuinta();
  if (typeof atualizarResumoQuinta === 'function') atualizarResumoQuinta();
  atualizarLinhaVisitaQuinta();
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
    '</div>' +
    // Oferecer um bem da Despensa a esta visita (Estrada, nível 7): ver estradaOfertaHtml() em js/estrada.js.
    (function () { try { return typeof estradaOfertaHtml === 'function' ? estradaOfertaHtml() : ''; } catch (e) { return ''; } })() +
    // O copo de bagaceira (nível 4): ver visitaBagaceiraHtml() acima. Não depende da Despensa nem da Estrada.
    (function () { try { return visitaBagaceiraHtml(); } catch (e) { return ''; } })();
}

function visitaLinhaToque() {
  const r = visitaParaLinha();
  if (!r.visita) { atualizarLinhaVisitaQuinta(); return; }
  const fala = visitaFalaDe(r.visita);
  mostrarFalas([{ texto: fala.texto, personagem: r.visita.personagem }], fala.nome);
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
