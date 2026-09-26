// ---------------------------------------------------------------------
// MOTOR DAS FESTAS — festas sazonais ligadas à data real de Portugal.
//
// Para acrescentar uma festa nova no futuro: basta acrescentar uma nova
// entrada a FESTAS_CONFIG (datas, imagens, textos, prémios) — o resto
// do motor (deteção pela data, faixa na Quinta, tarefas "uma vez por
// dia", dia grande a dobrar os prémios) já funciona sozinho.
//
// Para testar: acrescenta ?festa=saomartinho ao endereço para simular
// estar dentro da festa, e ?festa=saomartinho&dia=11 para simular o
// dia grande. Funciona junto com ?estacao= e ?tempo=.
// ---------------------------------------------------------------------

const FESTAS_CONFIG = [
  {
    id: 'saomartinho',
    // Datas sempre pelo calendário de Portugal (mês 0 = janeiro).
    inicio: { mes: 10, dia: 8 },      // 8 de novembro
    fim: { mes: 10, dia: 14 },        // 14 de novembro
    diaGrande: { mes: 10, dia: 11 },  // 11 de novembro
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
    recompensas: {
      castanhas: { uvasMin: 6, uvasMax: 12, gotasMin: 6, gotasMax: 12, repMin: 3, repMax: 6 },
      // Verão de São Martinho (sol real durante a festa): bónus nas castanhas.
      castanhasBonusVerao: 1.5,
      jeropiga: { custoGotas: 50, custoAguardente: 1, reputacao: 25 },
      prova: { reputacao: 8 },
      // No dia grande, os prémios em pontos contam a dobrar.
      multiplicadorDiaGrande: 2
    }
  }
];

// -----------------------------------------------------------------
// DETEÇÃO DA FESTA PELA DATA REAL (com atalhos de teste)
// -----------------------------------------------------------------

function dataAtualFesta() {
  const d = new Date();
  return { mes: d.getMonth(), dia: d.getDate() };
}

function valorDataFesta(o) {
  return o.mes * 100 + o.dia;
}

function festaAtivaPelaDataReal() {
  const hoje = valorDataFesta(dataAtualFesta());
  return FESTAS_CONFIG.find(function (f) {
    return hoje >= valorDataFesta(f.inicio) && hoje <= valorDataFesta(f.fim);
  }) || null;
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

function festaAtual() {
  return festaForcadaNoEndereco() || festaAtivaPelaDataReal();
}

function estaNoDiaGrandeFesta(festa) {
  if (!festa) return false;
  if (festaForcadaNoEndereco()) {
    const diaForcado = diaForcadoNoEndereco();
    return diaForcado !== null && diaForcado === festa.diaGrande.dia;
  }
  const hoje = dataAtualFesta();
  return hoje.mes === festa.diaGrande.mes && hoje.dia === festa.diaGrande.dia;
}

// -----------------------------------------------------------------
// TAREFAS "UMA VEZ POR DIA" — mesma ideia do state.tempo (js/tempo.js),
// mas genérica para qualquer festa/tarefa, para uma festa nova não
// precisar de mexer em js/state.js.
// -----------------------------------------------------------------

function chaveTarefaFesta(festaId, tarefa) {
  return festaId + '_' + tarefa;
}

function festaJaFezTarefaHoje(festaId, tarefa) {
  return state.festas.tarefasDia[chaveTarefaFesta(festaId, tarefa)] === diaLocalDeHoje();
}

function festaRegistarTarefaHoje(festaId, tarefa) {
  state.festas.tarefasDia[chaveTarefaFesta(festaId, tarefa)] = diaLocalDeHoje();
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
      btnCastanhas: '🌰 Assar Castanhas',
      btnJeropiga: '🍇 Fazer Jeropiga',
      btnProva: '🍷 Provar o Vinho Novo',
      btnVoltar: '⬅ Voltar',

      castanhasTitulo: 'O Assador de Castanhas',
      castanhasSubtitulo: 'O Chizo ajuda-te a defender o assador',
      castanhasCenas: [
        { situacao: 'O Fygmo cheira o fumo das castanhas a assar e aproxima-se, faca e garfo já na mão.', opcoes: ['Tapar o assador com a tampa de ferro', 'Oferecer-lhe uma castanha, a sorrir', 'Fingir que não o viu'], correta: 0 },
        { situacao: 'O Fygmo2 rasteja por baixo do banco, de olho nas castanhas mais douradas.', opcoes: ['Cantar-lhe uma canção de embalar', 'Chamar o Chizo com um assobio', 'Ir buscar mais lenha para a fogueira'], correta: 1 },
        { situacao: 'Os dois porcos combinam um plano em surdina: um distrai, o outro rouba.', opcoes: ['Virar as costas para ir buscar mais castanhas', 'Pôr o Chizo mesmo ao pé do assador', 'Ler-lhes uma história para os acalmar'], correta: 1 },
        { situacao: 'O cheiro das castanhas atrai também um bando de pardais, além dos porcos.', opcoes: ['Espantar só os pardais e esquecer os porcos', 'Pôr uma rede à volta do assador', 'Assobiar bem alto para o Chizo acordar'], correta: 2 }
      ],
      castanhasVitoria: 'O Chizo acorda a tempo e ladra! O Fygmo e o Fygmo2 fogem a correr, de mãos a abanar — as castanhas estão salvas.',
      castanhasDerrota: 'Tarde demais... o Fygmo e o Fygmo2 fogem com um cartucho de castanhas quentes.',
      castanhasBonusVerao: ' Com este sol de São Martinho, o assador rendeu ainda mais castanhas!',

      jeropigaTitulo: 'A Jeropiga de São Martinho',
      jeropigaFalta: 'Ainda falta mosto ou aguardente para a jeropiga. Prensa mais Uvas e destila mais Bagaço no Alambique.',
      jeropigaJaFeitaHoje: 'Já fizeste jeropiga hoje. Volta amanhã para fazer mais.',
      jeropigaSucesso: 'O mosto encontra a aguardente e nasce a jeropiga — doce, forte, cor de mel. Fica pronta uma garrafa de Edição São Martinho.',

      provaTitulo: 'A Prova do Vinho Novo',
      provaJaFeitaHoje: 'Já provaste o vinho hoje. Volta amanhã para provar mais.',
      provaSemVinho: 'Ainda não há vinho a descansar na Cave. Fortifica um lote na Adega para teres o que provar no próximo São Martinho.',
      provaComVinho: 'Quando o YoshiCat chega à Cave, os Fygmos já lá estão, copo na mão, a provar o vinho novo sem pedir licença!'
    },
    en: {
      faixa: "It's St. Martin's Day on the Farm!",
      titulo: "St. Martin's Day on the Farm",
      subtitulo: 'From November 8 to 14, with the big day on the 11th.',
      diaGrandeAviso: "Today is St. Martin's Day! Prizes count double.",
      veraoAviso: "It's St. Martin's summer! ☀️",
      tarefaFeitaHoje: 'already done today',
      btnCastanhas: '🌰 Roast Chestnuts',
      btnJeropiga: '🍇 Make Jeropiga',
      btnProva: '🍷 Taste the New Wine',
      btnVoltar: '⬅ Back',

      castanhasTitulo: 'The Chestnut Roaster',
      castanhasSubtitulo: 'Chizo helps you defend the roaster',
      castanhasCenas: [
        { situacao: 'Fygmo smells the smoke of the roasting chestnuts and creeps closer, fork and knife already in paw.', opcoes: ['Cover the roaster with the iron lid', 'Offer him a chestnut, smiling', 'Pretend not to see him'], correta: 0 },
        { situacao: 'Fygmo2 crawls under the bench, eyeing the goldenest chestnuts.', opcoes: ['Sing him a lullaby', 'Call Chizo with a whistle', 'Go fetch more firewood'], correta: 1 },
        { situacao: 'The two pigs hatch a quiet plan: one distracts, the other steals.', opcoes: ['Turn your back to fetch more chestnuts', 'Bring Chizo right next to the roaster', 'Read them a story to calm them down'], correta: 1 },
        { situacao: 'The smell of chestnuts also draws a flock of sparrows, on top of the pigs.', opcoes: ['Shoo only the sparrows away and forget the pigs', 'Put a net around the roaster', 'Whistle loudly for Chizo to wake up'], correta: 2 }
      ],
      castanhasVitoria: 'Chizo wakes up just in time and barks! Fygmo and Fygmo2 run off empty-handed — the chestnuts are safe.',
      castanhasDerrota: 'Too late... Fygmo and Fygmo2 escape with a bag of warm chestnuts.',
      castanhasBonusVerao: " With this St. Martin's summer sun, the roaster yielded even more chestnuts!",

      jeropigaTitulo: "St. Martin's Jeropiga",
      jeropigaFalta: "You still need more must or grape spirit for the jeropiga. Press more Grapes and distil more Pomace in the Still.",
      jeropigaJaFeitaHoje: "You've already made jeropiga today. Come back tomorrow to make more.",
      jeropigaSucesso: 'The must meets the grape spirit and jeropiga is born — sweet, strong, honey-coloured. A St. Martin Edition bottle is ready.',

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
      btnCastanhas: '🌰 Asar Castañas',
      btnJeropiga: '🍇 Hacer Jeropiga',
      btnProva: '🍷 Probar el Vino Nuevo',
      btnVoltar: '⬅ Volver',

      castanhasTitulo: 'El Asador de Castañas',
      castanhasSubtitulo: 'El Chizo te ayuda a defender el asador',
      castanhasCenas: [
        { situacao: 'El Fygmo huele el humo de las castañas asándose y se acerca, con tenedor y cuchillo ya en la pata.', opcoes: ['Tapar el asador con la tapa de hierro', 'Ofrecerle una castaña, sonriendo', 'Fingir que no lo has visto'], correta: 0 },
        { situacao: 'El Fygmo2 se arrastra bajo el banco, con la mirada puesta en las castañas más doradas.', opcoes: ['Cantarle una canción de cuna', 'Llamar al Chizo con un silbido', 'Ir a buscar más leña para la hoguera'], correta: 1 },
        { situacao: 'Los dos cerdos traman un plan en voz baja: uno distrae, el otro roba.', opcoes: ['Dar la espalda para ir a buscar más castañas', 'Poner al Chizo justo al lado del asador', 'Leerles un cuento para calmarlos'], correta: 1 },
        { situacao: 'El olor de las castañas también atrae a una bandada de gorriones, además de los cerdos.', opcoes: ['Espantar solo a los gorriones y olvidarse de los cerdos', 'Poner una red alrededor del asador', 'Silbar bien fuerte para que el Chizo despierte'], correta: 2 }
      ],
      castanhasVitoria: '¡El Chizo se despierta a tiempo y ladra! El Fygmo y el Fygmo2 huyen corriendo con las patas vacías — las castañas están a salvo.',
      castanhasDerrota: 'Demasiado tarde... el Fygmo y el Fygmo2 escapan con un cucurucho de castañas calientes.',
      castanhasBonusVerao: ' ¡Con este sol del veranillo de San Martín, el asador rindió todavía más castañas!',

      jeropigaTitulo: 'La Jeropiga de San Martín',
      jeropigaFalta: 'Todavía falta mosto o aguardiente para la jeropiga. Prensa más Uvas y destila más Orujo en el Alambique.',
      jeropigaJaFeitaHoje: 'Ya has hecho jeropiga hoy. Vuelve mañana para hacer más.',
      jeropigaSucesso: 'El mosto se encuentra con el aguardiente y nace la jeropiga — dulce, fuerte, color de miel. Queda lista una botella de Edición San Martín.',

      provaTitulo: 'La Prueba del Vino Nuevo',
      provaJaFeitaHoje: 'Ya has probado el vino hoy. Vuelve mañana para probar más.',
      provaSemVinho: 'Todavía no hay vino reposando en la Bodega. Fortifica un lote en la Bodega de vinificación para tener algo que probar en el próximo San Martín.',
      provaComVinho: '¡Cuando el YoshiCat llega a la Bodega, los Fygmos ya están allí, copa en pata, probando el vino nuevo sin pedir permiso!'
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
  if (!festa) {
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
let festaNovaEntradaHtml = '';

function botaoFesta(tarefa, label, feita, sufixoFeita) {
  return '<button class="btn btn-primary" ' + (feita ? 'disabled' : '') +
    ' onclick="iniciarTarefaFesta(\'' + tarefa + '\')">' + label +
    (feita ? '<span class="cooldown-suffix"> (' + sufixoFeita + ')</span>' : '') +
    '</button>';
}

function enterFesta() {
  festaMensagemAtual = '';
  festaNovaEntradaHtml = '';
  const festa = festaAtual();
  if (festa) {
    festaNovaEntradaHtml = encyclopediaUnlockHtml(desbloquearEntradaEnciclopedia('lendaSaoMartinho'));
    if (festaNovaEntradaHtml) saveState(state);
  }
  renderFestaHub();
}

function renderFestaHub() {
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
  if (diaGrande) avisos += '<p class="game-subtitle">' + S.diaGrandeAviso + '</p>';
  if (ehVerao) avisos += '<p class="game-subtitle">' + S.veraoAviso + '</p>';

  const botoesHtml =
    botaoFesta('castanhas', S.btnCastanhas, festaJaFezTarefaHoje(festa.id, 'castanhas'), S.tarefaFeitaHoje) +
    botaoFesta('jeropiga', S.btnJeropiga, festaJaFezTarefaHoje(festa.id, 'jeropiga'), S.tarefaFeitaHoje) +
    botaoFesta('prova', S.btnProva, festaJaFezTarefaHoje(festa.id, 'prova'), S.tarefaFeitaHoje);

  container.innerHTML =
    '<h2>' + S.titulo + '</h2>' +
    '<p class="game-subtitle">' + S.subtitulo + '</p>' +
    avisos +
    '<p class="game-result">' + festaMensagemAtual + '</p>' +
    festaNovaEntradaHtml +
    '<div class="action-list">' + botoesHtml + '</div>';

  definirFundo('foto', diaGrande ? festa.imagens.diaGrande : festa.imagens.faixa);
}

function iniciarTarefaFesta(tarefa) {
  const festa = festaAtual();
  if (!festa) return;
  festaMensagemAtual = '';
  festaNovaEntradaHtml = '';
  if (tarefa === 'castanhas') iniciarCastanhas(festa);
  else if (tarefa === 'jeropiga') fazerJeropiga(festa);
  else if (tarefa === 'prova') provarVinhoNovo(festa);
}

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
    '<h2>' + S.castanhasTitulo + '</h2>' +
    '<p class="game-subtitle">' + S.castanhasSubtitulo + '</p>' +
    '<p class="game-question">' + cena.situacao + '</p>' +
    '<div class="choice-list">' +
    cena.opcoes.map(function (op, i) {
      return '<button class="btn btn-secondary" onclick="responderCastanha(' + i + ')">' + op + '</button>';
    }).join('') +
    '</div>';

  definirFundo('foto', festa.imagens.castanhasRoubo);
}

function responderCastanha(i) {
  const festa = castanhasFestaAtual;
  const S = fStr(festa.id);
  const cena = S.castanhasCenas[castanhasCenaIndex];
  const venceu = i === cena.correta;

  festaRegistarTarefaHoje(festa.id, 'castanhas');

  const diaGrande = estaNoDiaGrandeFesta(festa);
  const tempo = tempoAtual();
  const ehVerao = tempo.disponivel && tempo.ceu === 'sol';
  const magustoDesbloqueado = desbloquearEntradaEnciclopedia('magusto');
  let mensagem;
  let fotoResultado;

  if (venceu) {
    const r = festa.recompensas.castanhas;
    let uvasGanhas = randInt(r.uvasMin, r.uvasMax);
    let gotasGanhas = randInt(r.gotasMin, r.gotasMax);
    let repGanha = randInt(r.repMin, r.repMax);

    if (ehVerao) {
      uvasGanhas = Math.round(uvasGanhas * festa.recompensas.castanhasBonusVerao);
      gotasGanhas = Math.round(gotasGanhas * festa.recompensas.castanhasBonusVerao);
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
  const container = document.getElementById('festa-container');
  const S = fStr(castanhasFestaAtual.id);
  container.innerHTML =
    '<h2>' + S.castanhasTitulo + '</h2>' +
    '<p class="game-question">' + mensagem + '</p>' +
    encyclopediaUnlockHtml(magustoDesbloqueado) +
    '<button class="btn btn-primary" onclick="renderFestaHub()">' + S.btnVoltar + '</button>';
  definirFundo('foto', foto);
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

  const custo = festa.recompensas.jeropiga;
  if (state.gotas < custo.custoGotas || state.adega.aguardente < custo.custoAguardente) {
    festaMensagemAtual = S.jeropigaFalta;
    renderFestaHub();
    return;
  }

  state.gotas -= custo.custoGotas;
  state.adega.aguardente -= custo.custoAguardente;
  state.garrafas += 1;
  const diaGrande = estaNoDiaGrandeFesta(festa);
  const repGanha = custo.reputacao * (diaGrande ? festa.recompensas.multiplicadorDiaGrande : 1);
  state.reputacao += repGanha;
  state.ultimaGarrafaData = new Date().toLocaleDateString(localeAtual());
  state.adega.historico.push({ data: state.ultimaGarrafaData, estacao: estacaoAtual(), diasDescanso: 0, festa: festa.id });
  festaRegistarTarefaHoje(festa.id, 'jeropiga');

  const novaEntrada = encyclopediaUnlockHtml(desbloquearEntradaEnciclopedia('jeropiga'));

  saveState(state);
  updateStatsDisplays();

  container.innerHTML =
    '<h2>' + S.jeropigaTitulo + '</h2>' +
    '<p class="game-question">' + S.jeropigaSucesso + ' (+1 ' + t('stat.garrafas') + ', +' + repGanha + ' ' + t('stat.reputacao') + ')</p>' +
    novaEntrada +
    '<button class="btn btn-primary" onclick="renderFestaHub()">' + S.btnVoltar + '</button>';
  definirFundo('foto', festa.imagens.jeropiga);
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
  const diaGrande = estaNoDiaGrandeFesta(festa);
  const repGanha = festa.recompensas.prova.reputacao * (diaGrande ? festa.recompensas.multiplicadorDiaGrande : 1);
  state.reputacao += repGanha;

  saveState(state);
  updateStatsDisplays();

  container.innerHTML =
    '<h2>' + S.provaTitulo + '</h2>' +
    '<p class="game-question">' + S.provaComVinho + ' (+' + repGanha + ' ' + t('stat.reputacao') + ')</p>' +
    '<button class="btn btn-primary" onclick="renderFestaHub()">' + S.btnVoltar + '</button>';
  definirFundo('foto', festa.imagens.prova);
}
