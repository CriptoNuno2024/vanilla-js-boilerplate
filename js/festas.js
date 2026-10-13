// ---------------------------------------------------------------------
// MOTOR DAS FESTAS — festas sazonais ligadas à data real de Portugal.
//
// Para acrescentar uma festa nova no futuro: acrescenta uma entrada a
// FESTAS_CONFIG (datas, imagens, tarefas, prémios) e os textos a
// FESTAS_STRINGS. Cada tarefa tem { id, onde, regra, btn, premio }:
//   id     o nome da tarefa (a chave do "uma vez por dia" e do objetivo do dia)
//   onde   'festa' = o botão aparece no ecrã da festa
//   regra  uma das regras de FESTAS_REGRAS (ver abaixo)
//   btn    a chave do texto do botão em FESTAS_STRINGS
//   premio os valores da tarefa (cada regra lê os seus)
// O resto do motor (deteção pela data, faixa na Quinta, tarefas "uma vez
// por dia", dia grande a dobrar os prémios, objetivo do dia) lê só isto.
//
// Datas: uma festa tem datas FIXAS (inicio, fim, diaGrande como { mes, dia },
// mês 0 = janeiro) OU uma data MÓVEL, no lugar das três:
//   movel: { base: 'pascoa', inicioDias, fimDias, diaGrandeDias }
// são deslocamentos em dias contados a partir do Domingo de Páscoa do ano
// (negativos = antes). O motor resolve-os para o ano do dia que recebe
// (festaJanela). Janelas que atravessem o fim do ano não são suportadas.
//
// Para testar: acrescenta ?festa=saomartinho (ou ?festa=natal) ao endereço
// para simular estar dentro da festa, e ?festa=saomartinho&dia=11 (ou
// ?festa=natal&dia=25) para simular o dia grande. Funciona junto com
// ?estacao= e ?tempo=.
// ---------------------------------------------------------------------

const FESTAS_CONFIG = [
  {
    id: 'saomartinho',
    // Datas sempre pelo calendário de Portugal (mês 0 = janeiro).
    inicio: { mes: 10, dia: 8 },      // 8 de novembro
    fim: { mes: 10, dia: 14 },        // 14 de novembro
    diaGrande: { mes: 10, dia: 11 },  // 11 de novembro
    // Entrada da Enciclopédia que abre ao entrar na festa (sem este campo, nenhuma).
    entradaEnciclopedia: 'lendaSaoMartinho',
    imagens: {
      diaGrande: 'assets/ecras/sao_martinho_dia11.jpg',
      faixa: 'assets/ecras/sao_martinho_festa.jpg',
      castanhasRoubo: 'assets/ecras/sao_martinho_roubo.jpg',
      castanhasVitoria: 'assets/ecras/sao_martinho_castanhas.jpg',
      castanhasFuga: 'assets/ecras/sao_martinho_fuga.jpg',
      jeropiga: 'assets/ecras/sao_martinho_jeropiga.jpg',
      prova: 'assets/ecras/sao_martinho_prova.jpg',
      verao: 'assets/ecras/sao_martinho_verao.jpg'
    },
    // Todos os valores dos prémios ficam aqui, fáceis de mudar. Estão
    // equilibrados com os valores que já existem no Proteger (uvas e
    // gotas 6-12, reputação 2-5) e na Adega (fortificar/engarrafar
    // dão dezenas de Reputação).
    tarefas: [
      // Verão de São Martinho (sol real durante a festa): bónus nas castanhas.
      { id: 'castanhas', onde: 'festa', regra: 'cena_sorteada', btn: 'btnCastanhas',
        premio: { uvasMin: 6, uvasMax: 12, gotasMin: 6, gotasMax: 12, repMin: 3, repMax: 6, bonusVerao: 1.5 } },
      { id: 'jeropiga', onde: 'festa', regra: 'jeropiga', btn: 'btnJeropiga',
        premio: { custoGotas: 50, custoAguardente: 1, reputacao: 25 } },
      { id: 'prova', onde: 'festa', regra: 'prova', btn: 'btnProva',
        premio: { reputacao: 8 } }
    ],
    recompensas: {
      // No dia grande, os prémios em pontos contam a dobrar.
      multiplicadorDiaGrande: 2
    }
  },
  {
    id: 'natal',
    inicio: { mes: 11, dia: 20 },     // 20 de dezembro
    fim: { mes: 11, dia: 26 },        // 26 de dezembro
    diaGrande: { mes: 11, dia: 25 },  // 25 de dezembro
    // Entrada da Enciclopédia que abre ao entrar na festa.
    entradaEnciclopedia: 'consoada',
    imagens: {
      diaGrande: 'assets/ecras/natal_dia25.jpg',
      faixa: 'assets/ecras/natal_festa.jpg',
      consoada: 'assets/ecras/natal_festa.jpg',
      doces: 'assets/ecras/natal_festa.jpg',
      boloRei: 'assets/ecras/natal_festa.jpg'
    },
    // O Natal só dá Reputação (que sobe o nível e nunca se gasta) e só gasta Gotas, nunca Uvas.
    // Valores da mesma ordem das tarefas do São Martinho: a prova (8, sem custo) e as castanhas
    // (3 a 6) para a consoada e o bolo-rei; a jeropiga (25 por 50 Gotas, Aguardente e garrafa)
    // para os doces (12 por 30 Gotas, sem Aguardente nem garrafa).
    tarefas: [
      { id: 'consoada', onde: 'festa', regra: 'oferta', btn: 'btnConsoada',
        premio: { reputacao: 5 } },
      { id: 'doces', onde: 'festa', regra: 'gastar_gotas', btn: 'btnDoces',
        premio: { custoGotas: 30, reputacao: 12 } },
      // entradaEnciclopedia (opcional, numa tarefa): abre ao responder à cena, ganhe ou perca (como o Magusto).
      { id: 'boloRei', onde: 'festa', regra: 'cena_do_dia', btn: 'btnBoloRei', entradaEnciclopedia: 'boloRei',
        premio: { reputacao: 6 } }
    ],
    recompensas: {
      multiplicadorDiaGrande: 2
    }
  },
  {
    id: 'carnaval',
    // Data móvel: de sábado a terça-feira de Carnaval (Páscoa menos 50 a menos 47 dias; o dia grande é a terça).
    movel: { base: 'pascoa', inicioDias: -50, fimDias: -47, diaGrandeDias: -47 },
    imagens: {
      diaGrande: 'assets/ecras/carnaval_dia_grande.jpg',
      faixa: 'assets/ecras/carnaval_festa.jpg',
      corso: 'assets/ecras/carnaval_festa.jpg',
      fantasias: 'assets/ecras/carnaval_festa.jpg',
      quemEstaMascarado: 'assets/ecras/carnaval_festa.jpg'
    },
    // Como o Natal: só dá Reputação (que sobe o nível e nunca se gasta) e só gasta Gotas, nunca Uvas.
    // Os mesmos valores do Natal: corso = consoada, fantasias = doces, quem está mascarado = bolo-rei.
    tarefas: [
      { id: 'corso', onde: 'festa', regra: 'oferta', btn: 'btnCorso',
        premio: { reputacao: 5 } },
      { id: 'fantasias', onde: 'festa', regra: 'gastar_gotas', btn: 'btnFantasias',
        premio: { custoGotas: 30, reputacao: 12 } },
      { id: 'quemEstaMascarado', onde: 'festa', regra: 'cena_do_dia', btn: 'btnQuemEstaMascarado',
        premio: { reputacao: 6 } }
    ],
    recompensas: {
      multiplicadorDiaGrande: 2
    }
  },
  {
    id: 'pascoa',
    // Data móvel: da Sexta-feira Santa ao Domingo de Páscoa (Páscoa menos 2 a 0 dias; o dia grande é o domingo).
    movel: { base: 'pascoa', inicioDias: -2, fimDias: 0, diaGrandeDias: 0 },
    imagens: {
      diaGrande: 'assets/ecras/pascoa_dia_grande.jpg',
      faixa: 'assets/ecras/pascoa_festa.jpg',
      folar: 'assets/ecras/pascoa_festa.jpg',
      amendoas: 'assets/ecras/pascoa_festa.jpg',
      ovos: 'assets/ecras/pascoa_festa.jpg'
    },
    // Como o Natal e o Carnaval: só dá Reputação (que sobe o nível e nunca se gasta) e só gasta Gotas, nunca Uvas.
    // Os mesmos valores: folar = corso = consoada, amêndoas = fantasias = doces, os ovos = quem está mascarado = bolo-rei.
    tarefas: [
      { id: 'folar', onde: 'festa', regra: 'oferta', btn: 'btnFolar',
        premio: { reputacao: 5 } },
      { id: 'amendoas', onde: 'festa', regra: 'gastar_gotas', btn: 'btnAmendoas',
        premio: { custoGotas: 30, reputacao: 12 } },
      { id: 'ovos', onde: 'festa', regra: 'cena_do_dia', btn: 'btnOvos',
        premio: { reputacao: 6 } }
    ],
    recompensas: {
      multiplicadorDiaGrande: 2
    }
  }
];

// -----------------------------------------------------------------
// DATAS: REGRAS PURAS (sem relógio nem estado: o dia vem sempre por
// argumento, "AAAA-MM-DD" no calendário de Lisboa). Reaproveitam
// diaLisboaPartes de js/tempo.js; as contas de dias usam Date.UTC, por
// isso a mudança de hora e o fuso do aparelho não as afetam.
// -----------------------------------------------------------------

// Formata ano, mês (1 a 12) e dia como "AAAA-MM-DD"; null se o ano não tiver 4 algarismos.
function festaFormatarDia(ano, mes, dia) {
  if (!Number.isInteger(ano) || ano < 1000 || ano > 9999) return null;
  return ano + '-' + String(mes).padStart(2, '0') + '-' + String(dia).padStart(2, '0');
}

// Domingo de Páscoa do ano (calendário gregoriano), "AAAA-MM-DD". Algoritmo de Meeus/Jones/Butcher.
// Só para anos inteiros de 1583 a 9999 (o calendário gregoriano só existe desde 1582); senão null.
function pascoaDoAno(ano) {
  if (!Number.isInteger(ano) || ano < 1583 || ano > 9999) return null;
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return festaFormatarDia(ano, mes, dia);
}

// Soma n dias (inteiro, positivo ou negativo) a um dia "AAAA-MM-DD"; null se o dia ou n forem inválidos.
function diaSomarDias(dia, n) {
  const p = diaLisboaPartes(dia);
  if (p === null || !Number.isInteger(n)) return null;
  const r = new Date(Date.UTC(p.ano, p.mes, p.dia) + n * 86400000);
  return festaFormatarDia(r.getUTCFullYear(), r.getUTCMonth() + 1, r.getUTCDate());
}

// A janela da festa no ano "ano": { inicio, fim, diaGrande } em "AAAA-MM-DD", ou null se a festa não
// se consegue resolver (data inválida, base desconhecida). Datas fixas: mês e dia da configuração.
// Data móvel: deslocamentos em dias a partir da Páscoa desse ano.
function festaJanela(festa, ano) {
  if (!festa || !Number.isInteger(ano)) return null;
  let j;
  if (festa.movel) {
    const m = festa.movel;
    if (m.base !== 'pascoa') return null;
    const pascoa = pascoaDoAno(ano);
    if (pascoa === null) return null;
    j = { inicio: diaSomarDias(pascoa, m.inicioDias), fim: diaSomarDias(pascoa, m.fimDias), diaGrande: diaSomarDias(pascoa, m.diaGrandeDias) };
  } else {
    const fixo = function (o) { return o ? festaFormatarDia(ano, o.mes + 1, o.dia) : null; };
    j = { inicio: fixo(festa.inicio), fim: fixo(festa.fim), diaGrande: fixo(festa.diaGrande) };
    // Datas que não existem (ex.: 30 de fevereiro) não abrem a festa.
    ['inicio', 'fim', 'diaGrande'].forEach(function (k) { if (diaLisboaPartes(j[k]) === null) j[k] = null; });
  }
  return j.inicio === null || j.fim === null || j.diaGrande === null ? null : j;
}

// A festa está aberta neste dia? (de inicio a fim, inclusive; as datas "AAAA-MM-DD" ordenam como texto)
function festaAbertaNoDia(festa, dia) {
  const p = diaLisboaPartes(dia);
  if (p === null) return false;
  const j = festaJanela(festa, p.ano);
  return j !== null && dia >= j.inicio && dia <= j.fim;
}

// É o dia grande da festa neste dia?
function festaDiaGrandeNoDia(festa, dia) {
  const p = diaLisboaPartes(dia);
  if (p === null) return false;
  const j = festaJanela(festa, p.ano);
  return j !== null && dia === j.diaGrande;
}

// -----------------------------------------------------------------
// DETEÇÃO DA FESTA PELA DATA REAL (com atalhos de teste)
// -----------------------------------------------------------------

// O dia de hoje: sempre o de Lisboa, não o do telemóvel.
function festaDiaDeHoje() {
  return diaLisboaDeHoje();
}

// A festa aberta neste dia (por omissão, hoje em Lisboa), ou null. O dia vem por argumento para se poder testar.
function festaAtivaPelaDataReal(dia) {
  const d = dia === undefined ? festaDiaDeHoje() : dia;
  return FESTAS_CONFIG.find(function (f) { return festaAbertaNoDia(f, d); }) || null;
}

// ?festa=saomartinho — simula estar dentro da festa (só para testar).
function festaForcadaNoEndereco() {
  const id = new URLSearchParams(location.search).get('festa');
  return FESTAS_CONFIG.find(function (f) { return f.id === id; }) || null;
}

// ?dia=11 — só faz sentido junto com ?festa=, para simular o dia grande.
function diaForcadoNoEndereco() {
  const valor = new URLSearchParams(location.search).get('dia');
  if (valor === null) return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

function festaAtual(dia) {
  return festaForcadaNoEndereco() || festaAtivaPelaDataReal(dia);
}

// É o dia grande? Por omissão, hoje em Lisboa. Com ?festa=...&dia=N no endereço (só para testar), N é comparado
// com o número do dia grande da festa (no ano de hoje).
function estaNoDiaGrandeFesta(festa, dia) {
  if (!festa) return false;
  const hoje = dia === undefined ? festaDiaDeHoje() : dia;
  if (festaForcadaNoEndereco()) {
    const diaForcado = diaForcadoNoEndereco();
    const p = diaLisboaPartes(hoje);
    const j = p === null ? null : festaJanela(festa, p.ano);
    const grande = j === null ? null : diaLisboaPartes(j.diaGrande);
    return diaForcado !== null && grande !== null && diaForcado === grande.dia;
  }
  return festaDiaGrandeNoDia(festa, hoje);
}

// -----------------------------------------------------------------
// TAREFAS "UMA VEZ POR DIA" — mesma ideia do state.tempo (js/tempo.js),
// mas genérica para qualquer festa/tarefa, para uma festa nova não
// precisar de mexer em js/state.js.
//
// Relógio: as mesmas regras de js/tempo.js (diaLisboaMudou, com o teto
// DIAS_FUTURO_MAXIMO). Com a data do aparelho atrás (até ao teto), a
// tarefa já feita continua feita; mais do que isso à frente, repõe-se.
// As regras puras recebem o estado e o dia ("AAAA-MM-DD") por argumento.
// -----------------------------------------------------------------

function chaveTarefaFesta(festaId, tarefa) {
  return festaId + '_' + tarefa;
}

// state.festas com a forma certa (uma nuvem ou um save estranho podem trazer null
// ou outro tipo): repara só em memória e devolve tarefasDia.
function festasTarefasDia(estado) {
  if (!estado.festas || typeof estado.festas !== 'object' || Array.isArray(estado.festas)) estado.festas = { tarefasDia: {} };
  if (!estado.festas.tarefasDia || typeof estado.festas.tarefasDia !== 'object' || Array.isArray(estado.festas.tarefasDia)) estado.festas.tarefasDia = {};
  return estado.festas.tarefasDia;
}

// A tarefa já foi feita "hoje"? Sem um "hoje" válido, conta como feita (nada se ganha e nada se perde).
function festaJaFez(estado, festaId, tarefa, hoje) {
  if (diaLisboaPartes(hoje) === null) return true;
  const guardado = festasTarefasDia(estado)[chaveTarefaFesta(festaId, tarefa)];
  return !diaLisboaMudou(hoje, guardado);
}

function festaRegistarFez(estado, festaId, tarefa, hoje) {
  if (diaLisboaPartes(hoje) === null) return;
  festasTarefasDia(estado)[chaveTarefaFesta(festaId, tarefa)] = hoje;
}

function festaJaFezTarefaHoje(festaId, tarefa) {
  return festaJaFez(state, festaId, tarefa, diaLisboaDeHoje());
}

function festaRegistarTarefaHoje(festaId, tarefa) {
  festaRegistarFez(state, festaId, tarefa, diaLisboaDeHoje());
}

// As tarefas da festa que se fazem no ecrã da festa (lista da configuração).
function festaTarefas(festa) {
  if (!festa || !Array.isArray(festa.tarefas)) return [];
  return festa.tarefas.filter(function (x) { return x && x.onde === 'festa'; });
}

function festaTarefa(festa, id) {
  return festaTarefas(festa).filter(function (x) { return x.id === id; })[0] || null;
}

// Ainda há alguma tarefa desta festa por fazer hoje? (o objetivo do dia, js/objetivos.js)
function festaTemTarefaPorFazerHoje(festa) {
  return festaTarefas(festa).some(function (x) { return !festaJaFezTarefaHoje(festa.id, x.id); });
}

// -----------------------------------------------------------------
// REGRAS PURAS DAS TAREFAS DE REPUTAÇÃO (Natal): sem relógio nem sorteio,
// o dia e o estado vêm por argumento; nada grava (quem chama grava).
//   oferta        sem custo: dá a Reputação
//   gastar_gotas  gasta custoGotas Gotas (nunca Uvas) e dá a Reputação; sem Gotas não gasta nem marca o dia
//   cena_do_dia   cena de 3 opções: acertar dá a Reputação, falhar não custa nada (e gasta a tentativa do dia)
// -----------------------------------------------------------------

const FESTAS_REGRAS_PURAS = ['oferta', 'gastar_gotas', 'cena_do_dia'];

// Que cena sai neste dia (0 a n - 1): estável o dia todo, igual em qualquer aparelho, sem sorteio
// (o mesmo molde de lagarAssaltoCena em js/lagar.js, com semente própria).
function festaCenaDoDia(festaId, tarefaId, dia, n) {
  if (typeof dia !== 'string' || !Number.isInteger(n) || n <= 0) return 0;
  const semente = dia + '#' + festaId + '#' + tarefaId;
  let h = 0;
  for (let i = 0; i < semente.length; i++) h = (h * 31 + semente.charCodeAt(i)) >>> 0;
  return h % n;
}

// Devolve { ok, motivo, rep, gotasGastas, venceu }; motivo null | 'estado_invalido' | 'dia_invalido' |
// 'tarefa_invalida' | 'ja_hoje' | 'faltam_gotas' | 'resultado_invalido'. Recusar nunca altera nada.
// opcoes: { diaGrande: true/false, venceu: true/false (só na cena_do_dia) }.
function festaResolverTarefa(estado, festa, tarefa, hoje, opcoes) {
  const recusa = function (motivo) { return { ok: false, motivo: motivo, rep: 0, gotasGastas: 0, venceu: false }; };
  if (!estado || typeof estado !== 'object') return recusa('estado_invalido');
  if (diaLisboaPartes(hoje) === null) return recusa('dia_invalido');
  if (!festa || !tarefa || !tarefa.premio || FESTAS_REGRAS_PURAS.indexOf(tarefa.regra) === -1) return recusa('tarefa_invalida');
  if (festaJaFez(estado, festa.id, tarefa.id, hoje)) return recusa('ja_hoje');
  const op = opcoes || {};
  const p = tarefa.premio;
  const mult = op.diaGrande === true ? festa.recompensas.multiplicadorDiaGrande : 1;
  let gotasGastas = 0;
  let venceu = true;

  if (tarefa.regra === 'gastar_gotas') {
    const gotas = typeof estado.gotas === 'number' && Number.isFinite(estado.gotas) ? estado.gotas : 0;
    if (gotas < p.custoGotas) return recusa('faltam_gotas');
    gotasGastas = p.custoGotas;
  } else if (tarefa.regra === 'cena_do_dia') {
    if (op.venceu !== true && op.venceu !== false) return recusa('resultado_invalido');
    venceu = op.venceu;
  }

  const rep = venceu ? p.reputacao * mult : 0;
  estado.gotas = (typeof estado.gotas === 'number' && Number.isFinite(estado.gotas) ? estado.gotas : 0) - gotasGastas;
  estado.reputacao = (typeof estado.reputacao === 'number' && Number.isFinite(estado.reputacao) ? estado.reputacao : 0) + rep;
  festaRegistarFez(estado, festa.id, tarefa.id, hoje);
  return { ok: true, motivo: null, rep: rep, gotasGastas: gotasGastas, venceu: venceu };
}

// -----------------------------------------------------------------
// TEXTOS (PT / EN / ES)
// -----------------------------------------------------------------

const FESTAS_STRINGS = {
  saomartinho: {
    pt: {
      faixa: 'É São Martinho na Quinta!',
      titulo: 'São Martinho na Quinta',
      subtitulo: 'De 8 a 14 de novembro, com o dia grande a 11.',
      diaGrandeAviso: 'Hoje é o dia de São Martinho! Os prémios contam a dobrar.',
      veraoAviso: 'Está verão de São Martinho! ☀️',
      tarefaFeitaHoje: 'já feita hoje',
      btnCastanhas: 'Assar Castanhas',
      btnJeropiga: 'Fazer Jeropiga',
      btnProva: 'Provar o Vinho Novo',
      btnVoltar: 'Voltar',

      castanhasTitulo: 'O Assador de Castanhas',
      castanhasSubtitulo: 'O Chizo ajuda-te a defender o assador',
      castanhasCenas: [
        { situacao: 'O assador está ao rubro e a primeira dúzia já abriu a casca. Do outro lado do muro, o Fygmo finge que vem só aquecer as mãos, mas não tira os olhos do tabuleiro.', opcoes: ['Tapar o assador com a tampa antes que chegue', 'Oferecer-lhe um copo de água-pé e puxar conversa', 'Fingir que não o vês e continuar a descascar'], correta: 0 },
        { situacao: 'O Fygmo2 rasteja por baixo do banco, de olho nas castanhas mais douradas, com o ar de quem só procura uma moeda caída.', opcoes: ['Ir buscar lenha, que a fogueira está a baixar', 'Chamar o Chizo com um assobio curto e seco', 'Pousar o tabuleiro no muro, fora do alcance'], correta: 1 },
        { situacao: 'Os dois porcos cochicham à parte: um distrai, o outro rouba. Já ensaiaram, vê-se.', opcoes: ['Virar as costas um instante para buscar castanhas', 'Pôr o Chizo mesmo ao pé do assador, a vigiar', 'Vigiar só o que distrai; o outro que desista'], correta: 1 },
        { situacao: 'O cheiro das castanhas atrai um bando de pardais, e os porcos aproveitam a confusão.', opcoes: ['Espantar só os pardais, que fazem mais barulho', 'Pôr uma rede grande à volta de todo o assador', 'Assobiar alto para acordar o Chizo da soneca'], correta: 2 }
      ],
      castanhasVitoria: 'O Chizo ladra uma vez e o Fygmo e o Fygmo2 recuam de mãos a abanar: as castanhas ficam todas no tabuleiro.',
      castanhasDerrota: 'Tarde demais: o Fygmo e o Fygmo2 fogem com um cartucho de castanhas ainda a fumegar, a soprar nos dedos. Há castanhas que valem a queimadura.',
      castanhasBonusVerao: ' Com este sol de São Martinho, o assador rendeu ainda mais castanhas!',

      jeropigaTitulo: 'A Jeropiga de São Martinho',
      jeropigaFalta: 'Ainda falta mosto ou aguardente para a jeropiga. Prensa mais Uvas e destila mais no Alambique.',
      jeropigaJaFeitaHoje: 'Já fizeste jeropiga hoje. Volta amanhã para fazer mais.',
      jeropigaSucesso: 'O mosto encontra a aguardente e nasce a jeropiga — doce, forte, cor de mel. Fica pronta uma garrafa de Edição São Martinho.',

      provaTitulo: 'A Prova do Vinho Novo',
      provaJaFeitaHoje: 'Já provaste o vinho hoje. Volta amanhã para provar mais.',
      provaSemVinho: 'Ainda não há vinho a descansar na Cave. Fortifica um lote na Adega para teres o que provar no próximo São Martinho.',
      provaComVinho: 'Quando o YoshiCat chega à Cave, os Fygmos já lá estão, copo na mão, a provar o vinho novo sem pedir licença!'
    },
    en: {
      faixa: "It's St. Martin's Day on the Quinta!",
      titulo: "St. Martin's Day on the Quinta",
      subtitulo: 'From November 8 to 14, with the big day on the 11th.',
      diaGrandeAviso: "Today is St. Martin's Day! Prizes count double.",
      veraoAviso: "It's St. Martin's summer! ☀️",
      tarefaFeitaHoje: 'already done today',
      btnCastanhas: 'Roast Chestnuts',
      btnJeropiga: 'Make Jeropiga',
      btnProva: 'Taste the New Wine',
      btnVoltar: 'Back',

      castanhasTitulo: 'The Chestnut Roaster',
      castanhasSubtitulo: 'Chizo helps you defend the roaster',
      castanhasCenas: [
        { situacao: 'The roaster is red-hot and the first dozen have already split their shells. On the other side of the wall, Fygmo pretends he only came to warm his hands, but his eyes never leave the tray.', opcoes: ['Put the lid on the roaster before he gets close', 'Offer him a glass of água-pé and strike up a chat', 'Pretend you don\'t see him and keep peeling'], correta: 0 },
        { situacao: 'Fygmo2 crawls under the bench, eyeing the most golden chestnuts, with the air of someone merely looking for a dropped coin.', opcoes: ['Fetch more firewood, the fire is getting low', 'Call Chizo over with a short, dry whistle', 'Set the tray on the wall, out of his reach'], correta: 1 },
        { situacao: 'The two pigs whisper off to one side: one distracts, the other steals. They\'ve rehearsed it, you can tell.', opcoes: ['Turn your back a moment to fetch more chestnuts', 'Put Chizo right next to the roaster, on watch', 'Watch only the distracter; the other will give up'], correta: 1 },
        { situacao: 'The smell of the chestnuts draws a flock of sparrows, and the pigs take advantage of the confusion.', opcoes: ['Shoo only the sparrows, they make the most noise', 'Put a big net all the way around the roaster', 'Whistle loudly to wake Chizo from his nap'], correta: 2 }
      ],
      castanhasVitoria: 'Chizo barks once and Fygmo and Fygmo2 back off empty-handed: every chestnut stays on the tray.',
      castanhasDerrota: 'Too late: Fygmo and Fygmo2 flee with a paper cone of chestnuts still steaming, blowing on their fingers. Some chestnuts are worth the burn.',
      castanhasBonusVerao: " With this St. Martin's summer sun, the roaster yielded even more chestnuts!",

      jeropigaTitulo: "St. Martin's Jeropiga",
      jeropigaFalta: "You still need more must or spirit for the jeropiga. Press more Grapes and distil more in the Still.",
      jeropigaJaFeitaHoje: "You've already made jeropiga today. Come back tomorrow to make more.",
      jeropigaSucesso: 'The must meets the spirit and jeropiga is born — sweet, strong, honey-coloured. A St. Martin Edition bottle is ready.',

      provaTitulo: 'Tasting the New Wine',
      provaJaFeitaHoje: "You've already tasted the wine today. Come back tomorrow to taste more.",
      provaSemVinho: 'There is no wine resting in the Cellar yet. Fortify a batch in the Winery to have something to taste next St. Martin\'s Day.',
      provaComVinho: 'When YoshiCat reaches the Cellar, the Fygmos are already there, glass in paw, tasting the new wine without asking!'
    },
    es: {
      faixa: '¡Es San Martín en la Quinta!',
      titulo: 'San Martín en la Quinta',
      subtitulo: 'Del 8 al 14 de noviembre, con el día grande el 11.',
      diaGrandeAviso: '¡Hoy es el día de San Martín! Los premios cuentan el doble.',
      veraoAviso: '¡Está el veranillo de San Martín! ☀️',
      tarefaFeitaHoje: 'ya hecha hoy',
      btnCastanhas: 'Asar Castañas',
      btnJeropiga: 'Hacer Jeropiga',
      btnProva: 'Probar el Vino Nuevo',
      btnVoltar: 'Volver',

      castanhasTitulo: 'El Asador de Castañas',
      castanhasSubtitulo: 'El Chizo te ayuda a defender el asador',
      castanhasCenas: [
        { situacao: 'El asador está al rojo y la primera docena ya ha abierto la cáscara. Al otro lado del muro, el Fygmo finge que solo viene a calentarse las manos, pero no le quita los ojos a la bandeja.', opcoes: ['Tapar el asador con la tapa antes de que llegue', 'Ofrecerle un vaso de aguapié y darle conversación', 'Hacer como que no lo ves y seguir pelando'], correta: 0 },
        { situacao: 'El Fygmo2 se arrastra bajo el banco, con la mirada puesta en las castañas más doradas y el aire de quien solo busca una moneda caída.', opcoes: ['Ir a por leña, que el fuego está bajando', 'Llamar al Chizo con un silbido corto y seco', 'Dejar la bandeja en el muro, fuera de su alcance'], correta: 1 },
        { situacao: 'Los dos cerdos cuchichean aparte: uno distrae, el otro roba. Lo han ensayado, se nota.', opcoes: ['Darles la espalda un momento para ir a por castañas', 'Poner al Chizo junto al asador, de vigilancia', 'Vigilar solo al que distrae; el otro desistirá'], correta: 1 },
        { situacao: 'El olor de las castañas atrae a una bandada de gorriones, y los cerdos aprovechan la confusión.', opcoes: ['Espantar solo a los gorriones, que hacen más ruido', 'Poner una red grande alrededor de todo el asador', 'Silbar fuerte para despertar al Chizo dormido'], correta: 2 }
      ],
      castanhasVitoria: 'El Chizo ladra una vez y el Fygmo y el Fygmo2 retroceden con las manos vacías: todas las castañas se quedan en la bandeja.',
      castanhasDerrota: 'Demasiado tarde: el Fygmo y el Fygmo2 huyen con un cucurucho de castañas aún humeantes, soplándose los dedos. Hay castañas que valen la quemadura.',
      castanhasBonusVerao: ' ¡Con este sol del veranillo de San Martín, el asador rindió todavía más castañas!',

      jeropigaTitulo: 'La Jeropiga de San Martín',
      jeropigaFalta: 'Todavía falta mosto o aguardiente para la jeropiga. Prensa más Uvas y destila más en el Alambique.',
      jeropigaJaFeitaHoje: 'Ya has hecho jeropiga hoy. Vuelve mañana para hacer más.',
      jeropigaSucesso: 'El mosto se encuentra con el aguardiente y nace la jeropiga — dulce, fuerte, color de miel. Queda lista una botella de Edición San Martín.',

      provaTitulo: 'La Prueba del Vino Nuevo',
      provaJaFeitaHoje: 'Ya has probado el vino hoy. Vuelve mañana para probar más.',
      provaSemVinho: 'Todavía no hay vino reposando en la Cava. Fortifica un lote en la Bodega de vinificación para tener algo que probar en el próximo San Martín.',
      provaComVinho: '¡Cuando el YoshiCat llega a la Cava, los Fygmos ya están allí, copa en pata, probando el vino nuevo sin pedir permiso!'
    }
  },
  natal: {
    pt: {
      faixa: 'É Natal na Quinta!',
      titulo: 'Natal na Quinta',
      subtitulo: 'Uma semana de Natal, com o dia grande no dia de Natal.',
      diaGrandeAviso: 'Hoje é dia de Natal! Os prémios contam a dobrar.',
      tarefaFeitaHoje: 'já feita hoje',
      btnConsoada: 'A Consoada',
      btnDoces: 'Doces da Quinta',
      btnBoloRei: 'O Bolo-Rei',
      btnVoltar: 'Voltar',

      consoadaTitulo: 'A Consoada na Quinta',
      consoadaJaFeitaHoje: 'Já puseste a mesa hoje. A consoada de amanhã só amanhã.',
      consoadaSucesso: 'A mesa da consoada está posta e ninguém se lembra de contar as cadeiras. O YoshiCat senta-se, o Chizo instala-se por baixo da mesa à espera do que cair, e a Quinta fica com mais calor.',

      docesTitulo: 'Os Doces da Quinta',
      docesJaFeitaHoje: 'Já fizeste doces hoje. Os de amanhã ficam para amanhã.',
      docesFalta: 'Ainda faltam Gotas para os doces. Junta mais e volta cá.',
      docesSucesso: 'A cozinha da Quinta cheira a Natal: rabanadas a dourar, filhós a levantar. O Fygmo e o Fygmo2 juram que só passaram por ali para "provar a qualidade".',

      boloReiTitulo: 'O Bolo-Rei',
      boloReiSubtitulo: 'O Fygmo e o Fygmo2 andam a rondar o bolo',
      boloReiJaFeitaHoje: 'Hoje o bolo-rei já foi defendido. Amanhã há outra ronda.',
      boloReiCenas: [
        { situacao: 'O bolo-rei arrefece na mesa da consoada. O Fygmo e o Fygmo2 contemplam-no com o respeito de quem já escolheu a fatia.', opcoes: ['Pedir-lhes que esperem pela meia-noite, como manda a tradição', 'Cobrir o bolo com um pano e deixar o Chizo a vigiar', 'Servir já uma fatia grande a cada um, para encerrar o assunto'], correta: 1 },
        { situacao: 'O Fygmo2 sobe para uma cadeira e estica o focinho para o bolo-rei, com o ar de quem só veio ver se está bem cozinhado.', opcoes: ['Pôr o bolo em cima do armário, onde a cadeira não chega', 'Explicar-lhe que o bolo-rei é só depois da Missa do Galo', 'Afastar a cadeira devagar, com ele ainda lá em cima'], correta: 0 },
        { situacao: 'O Fygmo puxa conversa sobre o preço do bacalhau enquanto o Fygmo2 contorna a mesa, pé ante pé, rumo ao bolo.', opcoes: ['Responder com paciência, que o bacalhau é assunto sério', 'Esconder o bolo debaixo do casaco e sair de fininho', 'Chamar o Chizo para tomar conta do bolo e da mesa toda'], correta: 2 }
      ],
      boloReiVitoria: 'O bolo-rei fica a salvo. O Fygmo e o Fygmo2 olham para as migalhas que não existem, suspiram e prometem portar-se bem até ao Dia de Reis.',
      boloReiDerrota: 'Tarde demais: o Fygmo e o Fygmo2 já vão a caminho da mata, uma fatia cada. Quem encontrar a fava paga o próximo bolo-rei. Nada se perdeu.'
    },
    en: {
      faixa: "It's Christmas on the Quinta!",
      titulo: 'Christmas on the Quinta',
      subtitulo: 'A week of Christmas, with the big day on Christmas Day.',
      diaGrandeAviso: 'Today is Christmas Day! Prizes count double.',
      tarefaFeitaHoje: 'already done today',
      btnConsoada: 'The Consoada',
      btnDoces: 'Quinta Sweets',
      btnBoloRei: 'The Bolo-Rei',
      btnVoltar: 'Back',

      consoadaTitulo: 'The Consoada on the Quinta',
      consoadaJaFeitaHoje: "You've already set the table today. Tomorrow's consoada is for tomorrow.",
      consoadaSucesso: 'The consoada table is set and nobody remembers to count the chairs. YoshiCat sits down, Chizo settles under the table waiting for whatever falls, and the Quinta feels warmer.',

      docesTitulo: 'The Quinta Sweets',
      docesJaFeitaHoje: "You've already made sweets today. Tomorrow's will wait until tomorrow.",
      docesFalta: 'You still need more Drops for the sweets. Gather some more and come back.',
      docesSucesso: 'The Quinta kitchen smells of Christmas: rabanadas turning golden, filhós rising. Fygmo and Fygmo2 swear they only dropped by to "check the quality".',

      boloReiTitulo: 'The Bolo-Rei',
      boloReiSubtitulo: 'Fygmo and Fygmo2 are circling the cake',
      boloReiJaFeitaHoje: "Today the bolo-rei has already been defended. Tomorrow there's another round.",
      boloReiCenas: [
        { situacao: 'The bolo-rei is cooling on the consoada table. Fygmo and Fygmo2 contemplate it with the respect of those who have already picked their slice.', opcoes: ['Ask them to wait until midnight, as tradition demands', 'Cover the cake with a cloth and leave Chizo on watch', 'Serve each of them a big slice right now, to close the matter'], correta: 1 },
        { situacao: 'Fygmo2 climbs onto a chair and stretches his snout towards the bolo-rei, looking like he only came to check it is properly baked.', opcoes: ['Put the cake on the cupboard, where no chair reaches', 'Explain that bolo-rei is only for after Midnight Mass', 'Slowly pull the chair away, with him still up there'], correta: 0 },
        { situacao: 'Fygmo strikes up a chat about the price of salt cod while Fygmo2 circles the table, tiptoeing towards the cake.', opcoes: ['Answer patiently, since salt cod is serious business', 'Hide the cake under your coat and slip away quietly', 'Call Chizo to guard the cake and the whole table'], correta: 2 }
      ],
      boloReiVitoria: 'The bolo-rei stays safe. Fygmo and Fygmo2 look at the crumbs that do not exist, sigh and promise to behave until Three Kings Day.',
      boloReiDerrota: 'Too late: Fygmo and Fygmo2 are already on their way to the woods, a slice each. Whoever finds the fava pays for the next bolo-rei. Nothing was lost.'
    },
    es: {
      faixa: '¡Es Navidad en la Quinta!',
      titulo: 'Navidad en la Quinta',
      subtitulo: 'Una semana de Navidad, con el día grande el día de Navidad.',
      diaGrandeAviso: '¡Hoy es día de Navidad! Los premios cuentan el doble.',
      tarefaFeitaHoje: 'ya hecha hoy',
      btnConsoada: 'La Consoada',
      btnDoces: 'Dulces de la Quinta',
      btnBoloRei: 'El Bolo-Rei',
      btnVoltar: 'Volver',

      consoadaTitulo: 'La Consoada en la Quinta',
      consoadaJaFeitaHoje: 'Ya has puesto la mesa hoy. La consoada de mañana, mañana.',
      consoadaSucesso: 'La mesa de la consoada está puesta y a nadie se le ocurre contar las sillas. El YoshiCat se sienta, el Chizo se acomoda debajo de la mesa esperando lo que caiga, y la Quinta se vuelve más cálida.',

      docesTitulo: 'Los Dulces de la Quinta',
      docesJaFeitaHoje: 'Ya has hecho dulces hoy. Los de mañana, para mañana.',
      docesFalta: 'Todavía faltan Gotas para los dulces. Junta más y vuelve.',
      docesSucesso: 'La cocina de la Quinta huele a Navidad: rabanadas dorándose, filhós creciendo. El Fygmo y el Fygmo2 juran que solo pasaron por allí para "comprobar la calidad".',

      boloReiTitulo: 'El Bolo-Rei',
      boloReiSubtitulo: 'El Fygmo y el Fygmo2 rondan el bizcocho',
      boloReiJaFeitaHoje: 'Hoy el bolo-rei ya ha sido defendido. Mañana hay otra ronda.',
      boloReiCenas: [
        { situacao: 'El bolo-rei se enfría en la mesa de la consoada. El Fygmo y el Fygmo2 lo contemplan con el respeto de quien ya ha elegido su porción.', opcoes: ['Pedirles que esperen a la medianoche, como manda la tradición', 'Tapar el bolo con un paño y dejar al Chizo vigilando', 'Servir ya una porción grande a cada uno, para cerrar el asunto'], correta: 1 },
        { situacao: 'El Fygmo2 se sube a una silla y estira el hocico hacia el bolo-rei, con aire de quien solo viene a ver si está bien cocido.', opcoes: ['Poner el bolo encima del armario, donde la silla no llega', 'Explicarle que el bolo-rei es solo después de la Misa del Gallo', 'Apartar la silla despacio, con él todavía allí arriba'], correta: 0 },
        { situacao: 'El Fygmo da conversación sobre el precio del bacalao mientras el Fygmo2 rodea la mesa de puntillas, rumbo al bolo.', opcoes: ['Responder con paciencia, que el bacalao es cosa seria', 'Esconder el bolo bajo el abrigo y marcharse con disimulo', 'Llamar al Chizo para que cuide del bolo y de la mesa'], correta: 2 }
      ],
      boloReiVitoria: 'El bolo-rei queda a salvo. El Fygmo y el Fygmo2 miran las migas que no hay, suspiran y prometen portarse bien hasta el Día de Reyes.',
      boloReiDerrota: 'Demasiado tarde: el Fygmo y el Fygmo2 ya van camino del monte, una porción cada uno. Quien encuentre el haba paga el próximo bolo-rei. No se perdió nada.'
    }
  },
  carnaval: {
    pt: {
      faixa: 'É Carnaval na Quinta!',
      titulo: 'Carnaval na Quinta',
      subtitulo: 'Uns dias de Carnaval, com o dia grande na terça-feira.',
      diaGrandeAviso: 'Hoje é terça-feira de Carnaval! Os prémios contam a dobrar.',
      tarefaFeitaHoje: 'já feita hoje',
      btnCorso: 'O Corso',
      btnFantasias: 'As Fantasias',
      btnQuemEstaMascarado: 'Quem Está Mascarado?',
      btnVoltar: 'Voltar',

      corsoTitulo: 'O Corso na Quinta',
      corsoJaFeitaHoje: 'Já houve corso hoje. O de amanhã só amanhã.',
      corsoSucesso: 'O corso passa pela Quinta em grande festa: carros enfeitados, música e confetes até nas orelhas do Chizo. O YoshiCat desfila de cabeça erguida e a Quinta fica com fama de foliona.',

      fantasiasTitulo: 'As Fantasias',
      fantasiasJaFeitaHoje: 'Já tens fantasias para hoje. As de amanhã ficam para amanhã.',
      fantasiasFalta: 'Ainda faltam Gotas para as fantasias. Junta mais e volta cá.',
      fantasiasSucesso: 'Máscaras, penas, lantejoulas e muita cola: as fantasias ficam prontas! O Chizo recusa-se a usar chapéu, mas aceita um laço.',

      quemEstaMascaradoTitulo: 'Quem Está Mascarado?',
      quemEstaMascaradoSubtitulo: 'O Fygmo e o Fygmo2 vieram de máscara',
      quemEstaMascaradoJaFeitaHoje: 'Hoje já descobriste os mascarados. Amanhã há mais disfarces.',
      quemEstaMascaradoCenas: [
        { situacao: 'Um mascarado de capa comprida rodeia a mesa dos doces, com umas orelhas cor-de-rosa a espreitar do capuz e um passo muito pouco convincente.', opcoes: ['Cumprimentá-lo com cerimónia e oferecer-lhe um lugar à mesa', 'Reconhecer o Fygmo pelas orelhas e mandar largar os doces', 'Elogiar o disfarce e deixá-lo servir-se, que é Carnaval'], correta: 1 },
        { situacao: 'Dois mascarados tentam entrar no corso fingindo ser um só: o Fygmo às cavalitas do Fygmo2, com um sobretudo comprido por cima.', opcoes: ['Aplaudir o cavalheiro de duas cabeças, tão misterioso', 'Fechar o portão do corso para ninguém mais entrar', 'Contar as orelhas e convidá-los a desfilar à vista'], correta: 2 },
        { situacao: 'O Fygmo2 pôs uma máscara de gato e mia baixinho atrás do YoshiCat, a ver se lhe leva o chapéu.', opcoes: ['Virar-te de repente e dizer «Boa noite, Fygmo2»', 'Miar de volta e deixar-lhe o chapéu, por cortesia', 'Fugir, que um gato desconhecido é mau sinal'], correta: 0 }
      ],
      quemEstaMascaradoVitoria: 'Descobertos. O Fygmo e o Fygmo2 tiram a máscara, riem-se e prometem comportar-se até à Quarta-feira de Cinzas. O corso segue, agora com todos à vista.',
      quemEstaMascaradoDerrota: 'Desta vez o mascarado safou-se a assobiar, de capa ao vento. Ninguém leva a mal: é Carnaval, e nada se perdeu.'
    },
    en: {
      faixa: "It's Carnival on the Quinta!",
      titulo: 'Carnival on the Quinta',
      subtitulo: 'A few days of Carnival, with the big day on Tuesday.',
      diaGrandeAviso: "Today is Carnival Tuesday! Prizes count double.",
      tarefaFeitaHoje: 'already done today',
      btnCorso: 'The Corso',
      btnFantasias: 'The Costumes',
      btnQuemEstaMascarado: 'Who Is Masked?',
      btnVoltar: 'Back',

      corsoTitulo: 'The Corso on the Quinta',
      corsoJaFeitaHoje: "There has already been a corso today. Tomorrow's is for tomorrow.",
      corsoSucesso: "The corso parades through the Quinta in great style: decorated floats, music, and confetti even in Chizo's ears. YoshiCat marches with his head held high and the Quinta earns a reputation as a party place.",

      fantasiasTitulo: 'The Costumes',
      fantasiasJaFeitaHoje: "You already have costumes for today. Tomorrow's will wait until tomorrow.",
      fantasiasFalta: 'You still need more Drops for the costumes. Gather some more and come back.',
      fantasiasSucesso: 'Masks, feathers, sequins and plenty of glue: the costumes are ready! Chizo refuses to wear a hat, but accepts a bow.',

      quemEstaMascaradoTitulo: 'Who Is Masked?',
      quemEstaMascaradoSubtitulo: 'Fygmo and Fygmo2 have come in masks',
      quemEstaMascaradoJaFeitaHoje: "Today you have already unmasked them. Tomorrow brings more disguises.",
      quemEstaMascaradoCenas: [
        { situacao: 'A masked figure in a long cape circles the sweets table, pink ears poking out of the hood and a very unconvincing stride.', opcoes: ['Greet them with ceremony and offer them a seat at the table', 'Recognise Fygmo by the ears and tell him to drop the sweets', 'Praise the costume and let them help themselves, it is Carnival'], correta: 1 },
        { situacao: 'Two masked figures try to join the corso pretending to be one: Fygmo riding on the back of Fygmo2, with a long overcoat over both.', opcoes: ['Applaud the two-headed gentleman, so very mysterious', 'Shut the corso gate so that nobody else gets in', 'Count the ears and invite them to parade openly'], correta: 2 },
        { situacao: 'Fygmo2 has put on a cat mask and meows softly behind YoshiCat, hoping to lift his hat.', opcoes: ['Turn around and say "Good evening, Fygmo2"', 'Meow back and let him keep the hat, out of courtesy', 'Run away: an unknown cat is a very bad omen'], correta: 0 }
      ],
      quemEstaMascaradoVitoria: 'Found out. Fygmo and Fygmo2 take off their masks, laugh and promise to behave until Ash Wednesday. The corso carries on, now with everyone in plain sight.',
      quemEstaMascaradoDerrota: 'This time the masked one got away whistling, cape in the wind. Nobody minds: it is Carnival, and nothing was lost.'
    },
    es: {
      faixa: '¡Es Carnaval en la Quinta!',
      titulo: 'Carnaval en la Quinta',
      subtitulo: 'Unos días de Carnaval, con el día grande el martes.',
      diaGrandeAviso: '¡Hoy es martes de Carnaval! Los premios cuentan el doble.',
      tarefaFeitaHoje: 'ya hecha hoy',
      btnCorso: 'El Corso',
      btnFantasias: 'Los Disfraces',
      btnQuemEstaMascarado: '¿Quién Va Enmascarado?',
      btnVoltar: 'Volver',

      corsoTitulo: 'El Corso en la Quinta',
      corsoJaFeitaHoje: 'Ya hubo corso hoy. El de mañana, mañana.',
      corsoSucesso: 'El corso desfila por la Quinta a lo grande: carrozas adornadas, música y confeti hasta en las orejas del Chizo. El YoshiCat desfila con la cabeza bien alta y la Quinta se gana fama de juerguista.',

      fantasiasTitulo: 'Los Disfraces',
      fantasiasJaFeitaHoje: 'Ya tienes disfraces para hoy. Los de mañana, para mañana.',
      fantasiasFalta: 'Todavía faltan Gotas para los disfraces. Junta más y vuelve.',
      fantasiasSucesso: 'Máscaras, plumas, lentejuelas y mucho pegamento: ¡los disfraces están listos! El Chizo se niega a ponerse sombrero, pero acepta un lazo.',

      quemEstaMascaradoTitulo: '¿Quién Va Enmascarado?',
      quemEstaMascaradoSubtitulo: 'El Fygmo y el Fygmo2 han venido con máscara',
      quemEstaMascaradoJaFeitaHoje: 'Hoy ya has descubierto a los enmascarados. Mañana habrá más disfraces.',
      quemEstaMascaradoCenas: [
        { situacao: 'Un enmascarado de capa larga ronda la mesa de los dulces, con unas orejas rosadas asomando por la capucha y un paso muy poco convincente.', opcoes: ['Saludarlo con mucha ceremonia y ofrecerle un sitio en la mesa', 'Reconocer al Fygmo por las orejas y mandarle soltar los dulces', 'Elogiar el disfraz y dejar que se sirva, que estamos en Carnaval'], correta: 1 },
        { situacao: 'Dos enmascarados intentan entrar en el corso haciéndose pasar por uno solo: el Fygmo a caballito del Fygmo2, con un abrigo largo por encima.', opcoes: ['Aplaudir al distinguido caballero de dos cabezas, tan misterioso', 'Cerrar el portón del corso para que nadie más pueda entrar', 'Contar las orejas e invitarlos a desfilar a la vista'], correta: 2 },
        { situacao: 'El Fygmo2 se ha puesto una máscara de gato y maúlla bajito detrás del YoshiCat, a ver si le quita el sombrero.', opcoes: ['Girarte de golpe y decir «Buenas noches, Fygmo2»', 'Maullar de vuelta y dejarle el sombrero, por cortesía', 'Huir, que un gato desconocido es mala señal'], correta: 0 }
      ],
      quemEstaMascaradoVitoria: 'Descubiertos. El Fygmo y el Fygmo2 se quitan la máscara, se ríen y prometen portarse bien hasta el Miércoles de Ceniza. El corso sigue, ahora con todos a la vista.',
      quemEstaMascaradoDerrota: 'Esta vez el enmascarado se escapó silbando, con la capa al viento. Nadie se lo toma a mal: es Carnaval, y no se perdió nada.'
    }
  },
  pascoa: {
    pt: {
      faixa: 'É Páscoa na Quinta!',
      titulo: 'Páscoa na Quinta',
      subtitulo: 'Uns dias de Páscoa, com o dia grande no domingo.',
      diaGrandeAviso: 'Hoje é domingo de Páscoa! Os prémios contam a dobrar.',
      tarefaFeitaHoje: 'já feita hoje',
      btnFolar: 'Folar',
      btnAmendoas: 'Amêndoas',
      btnOvos: 'Os Ovos',
      btnVoltar: 'Voltar',

      folarTitulo: 'O Folar',
      folarJaFeitaHoje: 'Hoje já houve folar. O de amanhã só amanhã.',
      folarSucesso: 'O folar sai do forno quentinho e cheiroso. O YoshiCat corta fatias para todos, e até o Chizo espera pela sua.',

      amendoasTitulo: 'As Amêndoas',
      amendoasJaFeitaHoje: 'Já tens amêndoas para hoje. As de amanhã ficam para amanhã.',
      amendoasFalta: 'Ainda faltam Gotas para as amêndoas. Junta mais e volta cá.',
      amendoasSucesso: 'As amêndoas ficam prontas, doces e estaladiças, em saquinhos atados com fita. O YoshiCat prova uma e o Fygmo2 jura que não viu nada.',

      ovosTitulo: 'Os Ovos',
      ovosSubtitulo: 'Onde está o ovo?',
      ovosJaFeitaHoje: 'Hoje já encontraste o ovo. Amanhã há outro esconderijo.',
      ovosCenas: [
        { situacao: 'O YoshiCat escondeu o ovo onde o focinho do Fygmo não chega: bem no alto, fora do alcance de qualquer porco com ambições.', opcoes: ['No cesto do pátio, escondido debaixo de um pano', 'No alto da prateleira, atrás dos tachos de cobre', 'Debaixo da mesa, que ninguém procura onde se come'], correta: 1 },
        { situacao: 'O Fygmo2 finge que dorme e não sabe de nada. Mas o YoshiCat viu o ovo num sítio macio e quente, onde as galinhas têm autoridade.', opcoes: ['No balde da água, onde ninguém olharia', 'No muro de pedra do pátio, ao sol da manhã', 'Na palha do galinheiro, ainda morna'], correta: 2 },
        { situacao: 'O Chizo não levanta o focinho do chão e abana a cauda: o ovo está onde o ar cheira a folar acabado de sair do forno.', opcoes: ['Junto ao forno, onde o folar ainda fumega', 'Junto ao poço, onde só cheira a musgo', 'Junto à horta, onde cheira a terra e couves'], correta: 0 }
      ],
      ovosVitoria: 'Ovo encontrado. O Fygmo e o Fygmo2 suspiram, juram que só passavam por ali e o ovo volta para a mesa, ao lado do folar.',
      ovosDerrota: 'Desta vez enganaste-te e o ovo mudou de dono. Nada se perdeu: amanhã há outro esconderijo.'
    },
    en: {
      faixa: 'It\'s Easter on the Quinta!',
      titulo: 'Easter on the Quinta',
      subtitulo: 'A few days of Easter, with the big day on Sunday.',
      diaGrandeAviso: 'Today is Easter Sunday! Prizes count double.',
      tarefaFeitaHoje: 'already done today',
      btnFolar: 'Folar',
      btnAmendoas: 'Almonds',
      btnOvos: 'The Eggs',
      btnVoltar: 'Back',

      folarTitulo: 'The Folar',
      folarJaFeitaHoje: 'There has already been folar today. Tomorrow\'s is for tomorrow.',
      folarSucesso: 'The folar comes out of the oven warm and fragrant. YoshiCat cuts slices for everyone, and even Chizo waits patiently for his.',

      amendoasTitulo: 'The Almonds',
      amendoasJaFeitaHoje: 'You already have almonds for today. Tomorrow\'s will wait until tomorrow.',
      amendoasFalta: 'You still need more Drops for the almonds. Gather some more and come back.',
      amendoasSucesso: 'The almonds are ready, sweet and crunchy, in little bags tied with ribbon. YoshiCat tries one and Fygmo2 swears he saw nothing.',

      ovosTitulo: 'The Eggs',
      ovosSubtitulo: 'Where is the egg?',
      ovosJaFeitaHoje: 'Today you have already found the egg. Tomorrow there is another hiding place.',
      ovosCenas: [
        { situacao: 'YoshiCat hid the egg where Fygmo\'s snout cannot reach: way up high, out of range of any pig with ambitions.', opcoes: ['In the patio basket, hidden under a cloth', 'On the high shelf, behind the copper pots', 'Under the table, where nobody looks while eating'], correta: 1 },
        { situacao: 'Fygmo2 pretends to sleep and knows nothing. But YoshiCat saw the egg somewhere soft and warm, where the hens are in charge.', opcoes: ['In the water bucket, where nobody would look', 'On the stone wall, in the morning sun', 'In the straw of the henhouse, still warm'], correta: 2 },
        { situacao: 'Chizo will not lift his nose from the ground and wags his tail: the egg is where the air smells of folar fresh from the oven.', opcoes: ['Next to the oven, where the folar still steams', 'Next to the well, where it only smells of moss', 'Next to the garden, where it smells of soil and cabbages'], correta: 0 }
      ],
      ovosVitoria: 'Egg found. Fygmo and Fygmo2 sigh, swear they were only passing by, and the egg goes back on the table, next to the folar.',
      ovosDerrota: 'This time you got it wrong and the egg changed owners. Nothing was lost: tomorrow there is another hiding place.'
    },
    es: {
      faixa: '¡Es Pascua en la Quinta!',
      titulo: 'Pascua en la Quinta',
      subtitulo: 'Unos días de Pascua, con el día grande el domingo.',
      diaGrandeAviso: '¡Hoy es Domingo de Pascua! Los premios cuentan el doble.',
      tarefaFeitaHoje: 'ya hecha hoy',
      btnFolar: 'Folar',
      btnAmendoas: 'Almendras',
      btnOvos: 'Los Huevos',
      btnVoltar: 'Volver',

      folarTitulo: 'El Folar',
      folarJaFeitaHoje: 'Ya hubo folar hoy. El de mañana, mañana.',
      folarSucesso: 'El folar sale del horno calentito y oloroso. El YoshiCat corta porciones para todos, y hasta el Chizo espera la suya.',

      amendoasTitulo: 'Las Almendras',
      amendoasJaFeitaHoje: 'Ya tienes almendras para hoy. Las de mañana, para mañana.',
      amendoasFalta: 'Todavía faltan Gotas para las almendras. Junta más y vuelve.',
      amendoasSucesso: 'Las almendras están listas, dulces y crujientes, en bolsitas atadas con lazo. El YoshiCat prueba una y el Fygmo2 jura que no vio nada.',

      ovosTitulo: 'Los Huevos',
      ovosSubtitulo: '¿Dónde está el huevo?',
      ovosJaFeitaHoje: 'Hoy ya has encontrado el huevo. Mañana hay otro escondite.',
      ovosCenas: [
        { situacao: 'El YoshiCat escondió el huevo donde el hocico del Fygmo no llega: bien en lo alto, fuera del alcance de cualquier cerdo con ambiciones.', opcoes: ['En el cesto del patio, escondido bajo un paño', 'En lo alto del estante, tras las ollas de cobre', 'Debajo de la mesa, donde nadie busca mientras come'], correta: 1 },
        { situacao: 'El Fygmo2 finge dormir y no sabe nada. Pero el YoshiCat vio el huevo en un sitio blando y caliente, donde las gallinas mandan.', opcoes: ['En el cubo del agua, donde nadie miraría', 'En el muro del patio, al sol de la mañana', 'En la paja del gallinero, todavía tibia'], correta: 2 },
        { situacao: 'El Chizo no levanta el hocico del suelo y mueve la cola: el huevo está donde el aire huele a folar recién salido del horno.', opcoes: ['Junto al horno, donde el folar aún humea', 'Junto al pozo, donde solo huele a musgo', 'Junto al huerto, donde huele a tierra y a coles'], correta: 0 }
      ],
      ovosVitoria: 'Huevo encontrado. El Fygmo y el Fygmo2 suspiran, juran que solo pasaban por allí y el huevo vuelve a la mesa, junto al folar.',
      ovosDerrota: 'Esta vez te has equivocado y el huevo cambió de dueño. No se perdió nada: mañana hay otro escondite.'
    }
  }
};

function fStr(festaId) {
  const dict = FESTAS_STRINGS[festaId];
  return (dict && (dict[currentLang] || dict.pt)) || {};
}

// -----------------------------------------------------------------
// FAIXA NO ECRÃ DA QUINTA (ver goTo() em js/main.js)
// -----------------------------------------------------------------

function atualizarFaixaFesta() {
  const el = document.getElementById('festa-faixa');
  if (!el) return;
  const festa = festaAtual();
  // A faixa só aparece a partir do Nível 4 para jogadores novos (ver
  // ecraDesbloqueado() em js/niveis.js); jogadores antigos (ver
  // state.acesso.jogadorAntigo em js/state.js) veem-na sempre.
  if (!festa || (typeof ecraDesbloqueado === 'function' && !ecraDesbloqueado('festa'))) {
    el.style.display = 'none';
    el.textContent = '';
    return;
  }
  el.style.display = 'block';
  el.textContent = fStr(festa.id).faixa;
}

// -----------------------------------------------------------------
// ECRÃ DA FESTA
// -----------------------------------------------------------------

let festaMensagemAtual = '';
let festaNovaEntrada = null;

// ---------------------------------------------------------------------
// SONS DE SÃO MARTINHO (ficheiros de assets/sons, mono 64 kbps; só as castanhas e a Prova, que são do São Martinho):
//   fogueira      ambiente em ciclo (24 s) na cena das castanhas, a 0,35 com fade (um nível médio perto da chuva e dos grilos:
//                 -40 dB); pára ao responder (resultado), ao voltar ao menu da festa e ao sair do ecrã (goTo pára o ambiente)
//   assobio       0,7: nas castanhas ganhas em que a opção certa é assobiar (a 2.ª e a 4.ª cenas, nas 3 línguas: "Chamar o Chizo
//                 com um assobio", "Assobiar alto para acordar o Chizo"); o Chizo ladra a seguir, só quando o assobio acaba
//   tilintar      0,6: a Prova do Vinho Novo, só com vinho na Cave ("copo na mão")
// Nas outras cenas ganhas o Chizo ladra logo (castanhasVitoria). Falhar fica em silêncio. Se o "ding" do objetivo do dia vai
// tocar, só ele toca (festaSomTarefa). Os ficheiros curtos são pedidos ao entrar na festa.
// ---------------------------------------------------------------------
const FESTA_SONS = {
  fogueira: { ficheiro: 'assets/sons/fogueira.mp3', volume: 0.35, fade: { entrarS: 1.5, sairS: 1.0 } },
  assobio: { ficheiro: 'assets/sons/assobio_chizo.mp3', volume: 0.7 },
  tilintar: { ficheiro: 'assets/sons/tilintar_copos.mp3', volume: 0.6 },
  // Índices (0 a 3) das cenas das castanhas cuja opção CERTA é assobiar; iguais em PT, EN e ES (o teste confere pelo texto).
  assobioCenas: [1, 3]
};

function festaEcraAtivo() {
  const ativo = document.querySelector('.screen.active');
  return !ativo || ativo.id === 'screen-festa'; // sem ecrã conhecido, conta como ativo
}

// O Chizo ladra a seguir ao assobio, quando este acaba (nunca por cima); se entretanto se saiu do ecrã da festa, não ladra.
function festaLadrarSeAindaAqui() {
  if (festaEcraAtivo() && typeof tocarSomChizoLadrar === 'function') tocarSomChizoLadrar();
}

// O som de uma cena das castanhas ganha: assobio e depois o ladrar (cenas de assobiar), ou só o ladrar.
function festaSomCastanhasVitoria(cenaIndex) {
  if (FESTA_SONS.assobioCenas.indexOf(cenaIndex) !== -1 && typeof tocarSomFicheiro === 'function') {
    tocarSomFicheiro(FESTA_SONS.assobio.ficheiro, FESTA_SONS.assobio.volume, festaLadrarSeAindaAqui);
  } else if (typeof tocarSomChizoLadrar === 'function') {
    tocarSomChizoLadrar();
  }
}

function festaSomProva() {
  if (typeof tocarSomFicheiro !== 'function') return;
  tocarSomFicheiro(FESTA_SONS.tilintar.ficheiro, FESTA_SONS.tilintar.volume);
}

function festaIniciarFogueira() {
  if (typeof iniciarSomAmbiente === 'function') iniciarSomAmbiente(FESTA_SONS.fogueira.ficheiro, FESTA_SONS.fogueira.volume, FESTA_SONS.fogueira.fade);
}

function festaPararFogueira() {
  if (typeof pararSomAmbiente === 'function') pararSomAmbiente();
}

// Ao entrar na festa de São Martinho, com o "Som" a poder tocar: pede já os 3 sons curtos (assobio, tilintar, ladrar).
function festaPreCarregarSons(festa) {
  if (!festa || festa.id !== 'saomartinho') return;
  if (typeof somPodeTocar !== 'function' || !somPodeTocar() || typeof somCarregarFicheiro !== 'function') return;
  [FESTA_SONS.assobio.ficheiro, FESTA_SONS.tilintar.ficheiro, typeof SOM_CHIZO_LADRAR === 'string' ? SOM_CHIZO_LADRAR : 'assets/sons/chizo_ladrar.mp3']
    .forEach(function (c) { somCarregarFicheiro(c); });
}

// Marca a tarefa da festa no objetivo do dia e dá o som da tarefa: um só, o "objetivoCumprido" (o "ding" do
// objetivo, se vai tocar, ou o da ação). Falhar uma cena (ok = false) cumpre o objetivo na mesma, mas sem som.
// tocarAcao (opcional): o som próprio da ação (as castanhas ganhas, a Prova), em vez do "ding" genérico, mas nunca por cima do "ding"
// do objetivo do dia, que tem prioridade.
function festaSomTarefa(ok, tocarAcao) {
  const ding = typeof marcarObjetivoCumprido === 'function' && marcarObjetivoCumprido('festa_tarefa', { semSom: !ok }) === true;
  if (!ok || ding) return;
  if (typeof tocarAcao === 'function') tocarAcao();
  else tocarSom('objetivoCumprido');
}

function botaoFesta(tarefa, label, feita, sufixoFeita) {
  return '<button class="btn-pill" data-acao="' + tarefa + '" ' + (feita ? 'disabled' : '') +
    ' onclick="iniciarTarefaFesta(\'' + tarefa + '\')"><span>' + label + '</span>' +
    (feita ? '<span class="cooldown-suffix"> (' + sufixoFeita + ')</span>' : '') +
    '</button>';
}

// Cartão pequeno do topo da Festa (título + subtítulo + avisos do
// dia grande / verão da festa, se houver).
function festaTopcardHtml(S, subtitulo, extraHtml) {
  return '<div class="topcard"><p class="mini-title">' + S.titulo + '</p><p class="mini-sub">' + subtitulo + '</p>' + (extraHtml || '') + '</div>';
}

function enterFesta() {
  festaMensagemAtual = '';
  festaNovaEntrada = null;
  const festa = festaAtual();
  if (festa) {
    if (festa.entradaEnciclopedia) {
      festaNovaEntrada = desbloquearEntradaEnciclopedia(festa.entradaEnciclopedia);
      if (festaNovaEntrada) saveState(state);
    }
  }
  renderFestaHub();
  festaPreCarregarSons(festa);
}

function renderFestaHub() {
  festaPararFogueira(); // voltar ao menu da festa: a fogueira das castanhas acaba
  const container = document.getElementById('festa-container');
  const festa = festaAtual();

  if (!festa) {
    // Segurança: só se chega aqui pela faixa da Quinta, que só aparece
    // com uma festa ativa. Volta à Quinta sem mostrar um ecrã vazio.
    goTo('quinta');
    return;
  }

  const S = fStr(festa.id);
  const diaGrande = estaNoDiaGrandeFesta(festa);
  const tempo = tempoAtual();
  const ehVerao = tempo.disponivel && tempo.ceu === 'sol';

  let avisos = '';
  if (diaGrande) avisos += '<p class="mini-sub">' + S.diaGrandeAviso + '</p>';
  if (ehVerao && S.veraoAviso) avisos += '<p class="mini-sub">' + S.veraoAviso + '</p>';

  const botoesHtml = festaTarefas(festa).map(function (tarefa) {
    return botaoFesta(tarefa.id, S[tarefa.btn], festaJaFezTarefaHoje(festa.id, tarefa.id), S.tarefaFeitaHoje);
  }).join('');

  container.innerHTML =
    festaTopcardHtml(S, S.subtitulo, avisos) +
    construirFilaPastilhas('festa-pill-scroll', botoesHtml, 'vinha.verMaisTarefas');

  definirFundo('foto', diaGrande ? festa.imagens.diaGrande : festa.imagens.faixa);

  marcarPastilhaPrincipal(container);
  configurarFilaPastilhas('festa-pill-scroll');
  mostrarNovaEntrada(festaNovaEntrada);
  atualizarDialogo(festaMensagemAtual, 'YoshiCat');
}

function iniciarTarefaFesta(tarefa) {
  const festa = festaAtual();
  if (!festa) return;
  festaMensagemAtual = '';
  festaNovaEntrada = null;
  const cfg = festaTarefa(festa, tarefa);
  if (!cfg) return;
  const regra = FESTAS_REGRAS[cfg.regra];
  if (regra) regra(festa, cfg);
}

// As regras que o ecrã sabe executar (a "regra" de cada tarefa em FESTAS_CONFIG). Cada uma recebe (festa, tarefa).
const FESTAS_REGRAS = {
  cena_sorteada: function (festa) { iniciarCastanhas(festa); },
  jeropiga: function (festa) { fazerJeropiga(festa); },
  prova: function (festa) { provarVinhoNovo(festa); },
  oferta: function (festa, tarefa) { festaTarefaSimples(festa, tarefa); },
  gastar_gotas: function (festa, tarefa) { festaTarefaSimples(festa, tarefa); },
  cena_do_dia: function (festa, tarefa) { festaIniciarCenaDoDia(festa, tarefa); }
};

// -----------------------------------------------------------------
// TAREFA 1 — ASSAR CASTANHAS (reaproveita o mini-jogo do Proteger:
// uma cena com 3 opções, 1 correta)
// -----------------------------------------------------------------

let castanhasFestaAtual = null;
let castanhasCenaIndex = -1;

function iniciarCastanhas(festa) {
  if (festaJaFezTarefaHoje(festa.id, 'castanhas')) { renderFestaHub(); return; }
  castanhasFestaAtual = festa;
  const S = fStr(festa.id);
  castanhasCenaIndex = randInt(0, S.castanhasCenas.length - 1);
  const cena = S.castanhasCenas[castanhasCenaIndex];

  const container = document.getElementById('festa-container');
  container.innerHTML =
    '<div class="topcard"><p class="mini-title">' + S.castanhasTitulo + '</p><p class="mini-sub">' + S.castanhasSubtitulo + '</p></div>' +
    '<div class="action-panel"><div class="choice-stack">' +
    cena.opcoes.map(function (op, i) {
      return '<button type="button" class="btn-choice" onclick="responderCastanha(' + i + ')">' + op + '</button>';
    }).join('') +
    '</div></div>';

  definirFundo('foto', festa.imagens.castanhasRoubo);
  atualizarDialogo(cena.situacao, 'YoshiCat');
  festaIniciarFogueira(); // o Assador a crepitar, só durante a cena
}

function responderCastanha(i) {
  const festa = castanhasFestaAtual;
  const S = fStr(festa.id);
  const cena = S.castanhasCenas[castanhasCenaIndex];
  const venceu = i === cena.correta;

  festaRegistarTarefaHoje(festa.id, 'castanhas');
  festaSomTarefa(venceu, venceu ? function () { festaSomCastanhasVitoria(castanhasCenaIndex); } : null);

  const diaGrande = estaNoDiaGrandeFesta(festa);
  const tempo = tempoAtual();
  const ehVerao = tempo.disponivel && tempo.ceu === 'sol';
  const magustoDesbloqueado = desbloquearEntradaEnciclopedia('magusto');
  let mensagem;
  let fotoResultado;

  if (venceu) {
    const r = festaTarefa(festa, 'castanhas').premio;
    let uvasGanhas = randInt(r.uvasMin, r.uvasMax);
    let gotasGanhas = randInt(r.gotasMin, r.gotasMax);
    let repGanha = randInt(r.repMin, r.repMax);

    if (ehVerao) {
      uvasGanhas = Math.round(uvasGanhas * r.bonusVerao);
      gotasGanhas = Math.round(gotasGanhas * r.bonusVerao);
    }
    if (diaGrande) {
      uvasGanhas *= festa.recompensas.multiplicadorDiaGrande;
      gotasGanhas *= festa.recompensas.multiplicadorDiaGrande;
      repGanha *= festa.recompensas.multiplicadorDiaGrande;
    }

    state.uvas += uvasGanhas;
    state.gotas += gotasGanhas;
    state.reputacao += repGanha;

    mensagem = S.castanhasVitoria +
      ' (+' + uvasGanhas + ' ' + t('stat.uvas') + ', +' + gotasGanhas + ' ' + t('stat.gotas') + ', +' + repGanha + ' ' + t('stat.reputacao') + ')' +
      (ehVerao ? ' ' + S.veraoAviso + S.castanhasBonusVerao : '');
    // Chuva não muda nada (nem castigo, nem bónus) — só o sol dá o
    // bónus e a foto do "verão de São Martinho".
    fotoResultado = ehVerao ? festa.imagens.verao : festa.imagens.castanhasVitoria;
  } else {
    mensagem = S.castanhasDerrota;
    fotoResultado = festa.imagens.castanhasFuga;
  }

  saveState(state);
  updateStatsDisplays();
  mostrarResultadoCastanhas(mensagem, fotoResultado, magustoDesbloqueado);
}

function mostrarResultadoCastanhas(mensagem, foto, magustoDesbloqueado) {
  festaPararFogueira(); // o resultado final: a fogueira sai em fundo
  const container = document.getElementById('festa-container');
  const S = fStr(castanhasFestaAtual.id);
  container.innerHTML =
    '<div class="topcard"><p class="mini-title">' + S.castanhasTitulo + '</p></div>' +
    '<div class="action-panel"><button type="button" class="btn-pill pill-main pill-grande" onclick="renderFestaHub()">' + S.btnVoltar + '</button></div>';
  definirFundo('foto', foto);
  mostrarNovaEntrada(magustoDesbloqueado);
  atualizarDialogo(mensagem, 'YoshiCat');
}

// -----------------------------------------------------------------
// TAREFA 2 — FAZER JEROPIGA (na Adega, uma vez por dia)
// -----------------------------------------------------------------

function fazerJeropiga(festa) {
  const S = fStr(festa.id);
  const container = document.getElementById('festa-container');

  if (festaJaFezTarefaHoje(festa.id, 'jeropiga')) {
    festaMensagemAtual = S.jeropigaJaFeitaHoje;
    renderFestaHub();
    return;
  }

  const custo = festaTarefa(festa, 'jeropiga').premio;
  // Pede 1 aguardente: aceita Bagaceira OU Aguardente vínica e gasta primeiro a bagaceira (ver js/alambique.js).
  if (state.gotas < custo.custoGotas || !alambiqueTemParaJeropiga(state, custo.custoAguardente)) {
    festaMensagemAtual = S.jeropigaFalta;
    renderFestaHub();
    return;
  }

  state.gotas -= custo.custoGotas;
  alambiqueGastarParaJeropiga(state, custo.custoAguardente);
  state.garrafas += 1;
  const diaGrande = estaNoDiaGrandeFesta(festa);
  const repGanha = custo.reputacao * (diaGrande ? festa.recompensas.multiplicadorDiaGrande : 1);
  state.reputacao += repGanha;
  state.ultimaGarrafaData = new Date().toLocaleDateString(localeAtual());
  state.adega.historico.push({ data: state.ultimaGarrafaData, estacao: estacaoAtual(), diasDescanso: 0, festa: festa.id });
  festaRegistarTarefaHoje(festa.id, 'jeropiga');
  festaSomTarefa(true);

  const novaEntrada = desbloquearEntradaEnciclopedia('jeropiga');

  saveState(state);
  updateStatsDisplays();

  container.innerHTML =
    '<div class="topcard"><p class="mini-title">' + S.jeropigaTitulo + '</p></div>' +
    '<div class="action-panel"><button type="button" class="btn-pill pill-main pill-grande" onclick="renderFestaHub()">' + S.btnVoltar + '</button></div>';
  definirFundo('foto', festa.imagens.jeropiga);
  mostrarNovaEntrada(novaEntrada);
  atualizarDialogo(S.jeropigaSucesso + ' (+1 ' + t('stat.garrafas') + ', +' + repGanha + ' ' + t('stat.reputacao') + ')', 'YoshiCat');
}

// -----------------------------------------------------------------
// TAREFA 3 — PROVAR O VINHO NOVO (na Cave, uma vez por dia)
// -----------------------------------------------------------------

function provarVinhoNovo(festa) {
  const S = fStr(festa.id);
  const container = document.getElementById('festa-container');

  if (festaJaFezTarefaHoje(festa.id, 'prova')) {
    festaMensagemAtual = S.provaJaFeitaHoje;
    renderFestaHub();
    return;
  }

  if (!state.adega.lote) {
    festaMensagemAtual = S.provaSemVinho;
    renderFestaHub();
    return;
  }

  festaRegistarTarefaHoje(festa.id, 'prova');
  festaSomTarefa(true, festaSomProva); // o tilintar (só com vinho na Cave, já verificado acima), em vez do "ding" genérico
  const diaGrande = estaNoDiaGrandeFesta(festa);
  const repGanha = festaTarefa(festa, 'prova').premio.reputacao * (diaGrande ? festa.recompensas.multiplicadorDiaGrande : 1);
  state.reputacao += repGanha;

  saveState(state);
  updateStatsDisplays();

  container.innerHTML =
    '<div class="topcard"><p class="mini-title">' + S.provaTitulo + '</p></div>' +
    '<div class="action-panel"><button type="button" class="btn-pill pill-main pill-grande" onclick="renderFestaHub()">' + S.btnVoltar + '</button></div>';
  definirFundo('foto', festa.imagens.prova);
  atualizarDialogo(S.provaComVinho + ' (+' + repGanha + ' ' + t('stat.reputacao') + ')', 'YoshiCat');
}

// -----------------------------------------------------------------
// TAREFAS DE REPUTAÇÃO (Natal): a consoada, os doces e o bolo-rei.
// As contas são as regras puras de cima (festaResolverTarefa); aqui só se
// mostra o ecrã e se grava UMA vez. Textos: S[tarefa.id + 'Titulo'], etc.
// -----------------------------------------------------------------

function festaMostrarResultado(festa, tarefa, mensagem, foto, novaEntrada) {
  const S = fStr(festa.id);
  const container = document.getElementById('festa-container');
  container.innerHTML =
    '<div class="topcard"><p class="mini-title">' + S[tarefa.id + 'Titulo'] + '</p></div>' +
    '<div class="action-panel"><button type="button" class="btn-pill pill-main pill-grande" onclick="renderFestaHub()">' + S.btnVoltar + '</button></div>';
  definirFundo('foto', foto);
  if (novaEntrada) mostrarNovaEntrada(novaEntrada); // mesmo aviso de entrada nova das outras festas
  atualizarDialogo(mensagem, 'YoshiCat');
}

// Consoada (oferta) e Doces (gastar_gotas): um toque, resolve e grava.
function festaTarefaSimples(festa, tarefa) {
  const S = fStr(festa.id);
  const r = festaResolverTarefa(state, festa, tarefa, diaLisboaDeHoje(), { diaGrande: estaNoDiaGrandeFesta(festa) });
  if (!r.ok) {
    if (r.motivo === 'ja_hoje') festaMensagemAtual = S[tarefa.id + 'JaFeitaHoje'];
    else if (r.motivo === 'faltam_gotas') festaMensagemAtual = S[tarefa.id + 'Falta'];
    renderFestaHub();
    return;
  }
  festaSomTarefa(true);
  saveState(state);
  updateStatsDisplays();
  festaMostrarResultado(festa, tarefa,
    S[tarefa.id + 'Sucesso'] + ' (' + (r.gotasGastas ? '-' + r.gotasGastas + ' ' + t('stat.gotas') + ', ' : '') + '+' + r.rep + ' ' + t('stat.reputacao') + ')',
    festa.imagens[tarefa.id]);
}

// Bolo-rei (cena_do_dia): a cena e a opção certa são fixas por dia (sem sorteio).
let festaCenaAtual = null; // { festa, tarefa, cena } enquanto a cena espera resposta

function festaIniciarCenaDoDia(festa, tarefa) {
  if (festaJaFezTarefaHoje(festa.id, tarefa.id)) { renderFestaHub(); return; }
  const S = fStr(festa.id);
  const cenas = S[tarefa.id + 'Cenas'];
  const cena = cenas[festaCenaDoDia(festa.id, tarefa.id, diaLisboaDeHoje(), cenas.length)];
  festaCenaAtual = { festa: festa, tarefa: tarefa, cena: cena };

  const container = document.getElementById('festa-container');
  container.innerHTML =
    '<div class="topcard"><p class="mini-title">' + S[tarefa.id + 'Titulo'] + '</p><p class="mini-sub">' + S[tarefa.id + 'Subtitulo'] + '</p></div>' +
    '<div class="action-panel"><div class="choice-stack">' +
    cena.opcoes.map(function (op, i) {
      return '<button type="button" class="btn-choice" onclick="festaResponderCenaDoDia(' + i + ')">' + op + '</button>';
    }).join('') +
    '</div></div>';
  definirFundo('foto', festa.imagens[tarefa.id]);
  atualizarDialogo(cena.situacao, 'YoshiCat');
}

function festaResponderCenaDoDia(i) {
  const atual = festaCenaAtual;
  if (!atual) return; // toque duplo ou cena já respondida
  festaCenaAtual = null;
  const festa = atual.festa;
  const tarefa = atual.tarefa;
  const S = fStr(festa.id);
  const r = festaResolverTarefa(state, festa, tarefa, diaLisboaDeHoje(), { diaGrande: estaNoDiaGrandeFesta(festa), venceu: i === atual.cena.correta });
  if (!r.ok) { renderFestaHub(); return; }
  festaSomTarefa(r.venceu);
  const novaEntrada = tarefa.entradaEnciclopedia ? desbloquearEntradaEnciclopedia(tarefa.entradaEnciclopedia) : null;
  saveState(state);
  updateStatsDisplays();
  festaMostrarResultado(festa, tarefa,
    r.venceu ? S[tarefa.id + 'Vitoria'] + ' (+' + r.rep + ' ' + t('stat.reputacao') + ')' : S[tarefa.id + 'Derrota'],
    festa.imagens[tarefa.id], novaEntrada);
}
