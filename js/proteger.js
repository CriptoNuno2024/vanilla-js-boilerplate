// ---------------------------------------------------------------------
// PROTEGER A QUINTA (3 estilos de mini-jogo, escolhidos à sorte)
//
// Personagens (nomes próprios, não traduzidos):
// - Fygmo  — porco malhado, mais velho, o "cérebro" (mapas, binóculos).
// - Fygmo2 — porco branco, mais novo, o "executor" (monóculo, arromba
//            fechaduras, age de noite).
// - Chizo  — o cão de guarda do YoshiCat, dorme perto da adega.
//
// Todo o texto do ecrã está em PT/EN/ES via PROTEGER_STRINGS[currentLang].
// A mecânica de cada estilo (e a opção/turno correto) é a mesma nas 3
// línguas — só o texto muda.
// ---------------------------------------------------------------------

const PROTEGER_STRINGS = {
  pt: {
    titulo: 'Proteger a Quinta',
    fechaduraSubtitulo: 'A Fechadura da Reserva Especial',
    disfarcesSubtitulo: 'Onde se escondem os disfarces de uva?',
    disfarcesIntro: 'Um dos montes de uvas ali à frente... não parece bem certo.',
    monteLabel: 'Monte',
    chizoSubtitulo: 'Acorda o Chizo a tempo',
    chizoExplicacao: 'Os porcos aproximam-se sozinhos. Acorda o Chizo no momento certo: nem cedo demais, nem tarde demais! Toca quando ouvires os passos junto à porta.',
    chizoComecar: 'Começar',
    iscoSubtitulo: 'Um isco para os porcos?',
    iscoPergunta: 'O bagaço de uva é ração: ponho um punhado no caminho e vejo quem aparece. Gasta 1 bagaço.',
    iscoBotao: 'Pôr isco (-1 bagaço)',
    iscoSem: 'Seguir sem isco',
    iscoFala: function (porco) { return porco ? 'O isco já chamou o ' + porco + '. Vem aí.' : 'O cheiro do bagaço já passou de focinho em focinho. Vem aí gente.'; },
    chizoBotao: 'Acordar o Chizo!',
    protegida: 'A Quinta está protegida!',
    naoCorreuBem: 'Desta vez não correu bem...',
    jogarNovamente: 'Jogar Novamente',
    tentarOutraVez: 'Tentar Outra Vez',
    fechadura: [
      { situacao: 'O Fygmo2 tira o monóculo e mede a fechadura da Reserva Especial milimetricamente, à procura do ponto fraco.', opcoes: ['Trocar a fechadura por um cadeado reforçado', 'Ir embora e voltar amanhã', 'Gritar "quem está aí?" às escuras'], correta: 0 },
      { situacao: 'Um barulho de metal ecoa na cave — o Fygmo2 está a testar picos diferentes na fechadura.', opcoes: ['Ir dormir, deve ser só o vento', 'Colocar uma tranca extra na porta', 'Abrir a porta para ver quem é'], correta: 1 },
      { situacao: 'O Fygmo, escondido nas escadas da cave, aponta o binóculo e faz sinal ao Fygmo2 para avançar.', opcoes: ['Acender as luzes da adega de repente', 'Fechar os olhos e esperar que passe', 'Chamar o Fygmo pelo nome, a rir'], correta: 0 },
      { situacao: 'De monóculo posto, o Fygmo2 encosta o ouvido à fechadura da Reserva Especial para ouvir as engrenagens.', opcoes: ['Distraí-lo com um balde a cair ruidosamente', 'Deixar-lhe uma nota simpática', 'Ignorar e voltar a dormir'], correta: 0 }
    ],
    // Sem a Cave de Reserva aberta (ver caveReservaAberta() em js/garrafa.js) a Fechadura fala da adega.
    fechaduraSubtituloSemCave: 'A Fechadura da Adega',
    fechaduraSituacoesSemCave: [
      'O Fygmo2 tira o monóculo e mede a fechadura da adega, milimetricamente, à procura do ponto fraco.',
      'Um barulho de metal ecoa na adega — o Fygmo2 está a testar picos diferentes na fechadura.',
      'O Fygmo, escondido atrás dos barris da adega, aponta o binóculo e faz sinal ao Fygmo2 para avançar.',
      'De monóculo posto, o Fygmo2 encosta o ouvido à fechadura da adega para ouvir as engrenagens.'
    ],
    fechaduraVitoriaSemCave: 'O Fygmo2 desiste, guarda o monóculo e foge pela vinha fora — a adega está a salvo.',
    fechaduraVitoria: 'O Fygmo2 desiste, guarda o monóculo e foge pela vinha fora — a Reserva Especial está a salvo.',
    fechaduraDerrota: 'Tarde demais… o Fygmo2 abre a fechadura, tropeça num barril e foge sem levar nada.',
    fechaduraReservaFygmo: 'Hmpf… a Reserva safou-se. Mas já lhe sentimos o cheiro!',
    fechaduraReservaFygmo2: 'Ha! Por um focinho… a Reserva Especial ainda lá está. Voltamos!',
    fechaduraDerrotaGarrafa: 'O Fygmo2 foge de patas vazias. A tua Reserva {cor} continua a salvo na Cave.',
    fechaduraReservaFygmoCor: 'Hmpf… a tua Reserva {cor} safou-se. Mas já lhe sentimos o cheiro!',
    fechaduraReservaFygmo2Cor: 'Ha! Uma Reserva {cor} destas não se desperdiça. Da próxima é nossa!',
    fechaduraReservaFygmoCobre: 'Hmpf… a Reserva Cobre safou-se. A mais escura da Cave… ainda vamos a ela!',
    fechaduraReservaFygmo2Cobre: 'Ha! A Reserva Cobre é a mais rara da Cave. Da próxima é nossa!',
    disfarceVitoria: function (porco) { return 'Debaixo das folhas estava o ' + porco + ', apanhado em flagrante a tentar fugir com a colheita!'; },
    disfarceDerrota: function (porco) { return 'Era só uva a sério… O ' + porco + ' foge a rir, de cesto vazio e orgulho cheio.'; },
    chizoTurnos: [
      'O Fygmo e o Fygmo2 aproximam-se devagar da adega, escondidos entre as sombras...',
      'O Fygmo faz sinal ao Fygmo2 para avançarem mais um pouco...',
      'Já se ouvem os passos deles junto à porta da adega...',
      'O Fygmo já está a abrir a porta da adega!'
    ],
    chizoVitoria: 'O Chizo acorda a tempo e ladra! O Fygmo e o Fygmo2 fogem a correr, de mãos a abanar.',
    chizoCedo: 'Falso alarme: o Chizo volta a dormir. Os porcos riem-se, mas não levam nada.',
    chizoTarde: 'Tarde demais… os porcos já se foram. Ficaram só as pegadas.'
  },

  en: {
    titulo: 'Protect the Farm',
    fechaduraSubtitulo: 'The Special Reserve Lock',
    disfarcesSubtitulo: 'Where are the grape disguises hiding?',
    disfarcesIntro: "One of the grape piles up ahead... doesn't look quite right.",
    monteLabel: 'Pile',
    chizoSubtitulo: 'Wake Chizo in time',
    chizoExplicacao: 'The pigs are creeping closer on their own. Wake Chizo at the right moment: not too early, not too late! Tap when you hear the footsteps by the door.',
    chizoComecar: 'Start',
    iscoSubtitulo: 'Bait for the pigs?',
    iscoPergunta: 'Grape pomace is animal feed: I\'ll leave a handful on the path and see who shows up. Costs 1 pomace.',
    iscoBotao: 'Set the bait (-1 pomace)',
    iscoSem: 'Carry on without bait',
    iscoFala: function (porco) { return porco ? 'The bait has already caught ' + porco + "'s attention. Here he comes." : 'The smell of pomace is already going from snout to snout. Company is coming.'; },
    chizoBotao: 'Wake Chizo!',
    protegida: 'The Farm is protected!',
    naoCorreuBem: "It didn't go well this time...",
    jogarNovamente: 'Play Again',
    tentarOutraVez: 'Try Again',
    fechadura: [
      { situacao: 'Fygmo2 pulls out his monocle and measures the Special Reserve lock millimeter by millimeter, looking for a weak spot.', opcoes: ['Swap the lock for a reinforced padlock', 'Walk away and come back tomorrow', 'Shout "who\'s there?" into the dark'], correta: 0 },
      { situacao: 'A metallic clatter echoes through the cellar — Fygmo2 is trying different picks on the lock.', opcoes: ['Go back to sleep, it must be the wind', 'Add an extra bolt to the door', 'Open the door to see who it is'], correta: 1 },
      { situacao: 'Hidden on the cellar stairs, Fygmo raises his binoculars and signals Fygmo2 to move forward.', opcoes: ['Suddenly turn on the cellar lights', 'Close your eyes and hope it passes', "Call out Fygmo's name, laughing"], correta: 0 },
      { situacao: 'Monocle in place, Fygmo2 presses his ear against the Special Reserve lock to listen to the gears.', opcoes: ['Distract him with a noisy falling bucket', 'Leave him a friendly note', 'Ignore it and go back to sleep'], correta: 0 }
    ],
    // Sem a Cave de Reserva aberta (ver caveReservaAberta() em js/garrafa.js) a Fechadura fala da adega.
    fechaduraSubtituloSemCave: 'The Winery Lock',
    fechaduraSituacoesSemCave: [
      'Fygmo2 pulls out his monocle and measures the winery lock millimeter by millimeter, looking for a weak spot.',
      'A metallic clatter echoes through the winery — Fygmo2 is trying different picks on the lock.',
      'Hidden behind the winery barrels, Fygmo raises his binoculars and signals Fygmo2 to move forward.',
      'Monocle in place, Fygmo2 presses his ear against the winery lock to listen to the gears.'
    ],
    fechaduraVitoriaSemCave: 'Fygmo2 gives up, puts away his monocle and flees across the vineyard — the winery is safe.',
    fechaduraVitoria: 'Fygmo2 gives up, puts away his monocle and flees across the vineyard — the Special Reserve is safe.',
    fechaduraDerrota: 'Too late… Fygmo2 opens the lock, trips over a barrel and runs off empty-handed.',
    fechaduraReservaFygmo: 'Hmpf… the Reserve is safe. But we can smell it already!',
    fechaduraReservaFygmo2: 'Ha! By a nose… the Special Reserve is still there. We\'ll be back!',
    fechaduraDerrotaGarrafa: 'Fygmo2 flees empty-handed. Your {cor} Reserve is still safe in the Cellar.',
    fechaduraReservaFygmoCor: 'Hmpf… your {cor} Reserve is safe. But we can smell it already!',
    fechaduraReservaFygmo2Cor: 'Ha! That {cor} Reserve won\'t go to waste. Next time it\'s ours!',
    fechaduraReservaFygmoCobre: 'Hmpf… the Copper Reserve is safe. The darkest in the Cellar… we\'ll get to it yet!',
    fechaduraReservaFygmo2Cobre: 'Ha! The Copper Reserve is the rarest in the Cellar. Next time it\'s ours!',
    disfarceVitoria: function (porco) { return 'Under the leaves was ' + porco + ', caught red-handed trying to escape with the harvest!'; },
    disfarceDerrota: function (porco) { return 'It was real grapes after all… ' + porco + ' runs off laughing, basket empty and pride full.'; },
    chizoTurnos: [
      'Fygmo and Fygmo2 creep slowly toward the cellar, hidden among the shadows...',
      'Fygmo signals Fygmo2 to move forward a little more...',
      'You can already hear their footsteps by the cellar door...',
      'Fygmo is already opening the cellar door!'
    ],
    chizoVitoria: 'Chizo wakes up just in time and barks! Fygmo and Fygmo2 run off empty-handed.',
    chizoCedo: 'False alarm: Chizo goes back to sleep. The pigs laugh, but they take nothing.',
    chizoTarde: 'Too late… the pigs are gone. Only the footprints remain.'
  },

  es: {
    titulo: 'Proteger la Quinta',
    fechaduraSubtitulo: 'La Cerradura de la Reserva Especial',
    disfarcesSubtitulo: '¿Dónde se esconden los disfraces de uva?',
    disfarcesIntro: 'Uno de los montones de uvas ahí delante... no parece muy normal.',
    monteLabel: 'Montón',
    chizoSubtitulo: 'Despierta a Chizo a tiempo',
    chizoExplicacao: 'Los cerdos se acercan solos. Despierta a Chizo en el momento justo: ¡ni demasiado pronto, ni demasiado tarde! Toca cuando oigas los pasos junto a la puerta.',
    chizoComecar: 'Empezar',
    iscoSubtitulo: '¿Un cebo para los cerdos?',
    iscoPergunta: 'El orujo de uva es pienso: dejo un puñado en el camino y veo quién aparece. Gasta 1 orujo.',
    iscoBotao: 'Poner cebo (-1 orujo)',
    iscoSem: 'Seguir sin cebo',
    iscoFala: function (porco) { return porco ? 'El cebo ya llamó al ' + porco + '. Ahí viene.' : 'El olor del orujo ya pasa de hocico en hocico. Viene gente.'; },
    chizoBotao: '¡Despertar a Chizo!',
    protegida: '¡La Quinta está protegida!',
    naoCorreuBem: 'Esta vez no salió bien...',
    jogarNovamente: 'Jugar de Nuevo',
    tentarOutraVez: 'Intentar de Nuevo',
    fechadura: [
      { situacao: 'El Fygmo2 saca el monóculo y mide la cerradura de la Reserva Especial al milímetro, buscando el punto débil.', opcoes: ['Cambiar la cerradura por un candado reforzado', 'Irte y volver mañana', 'Gritar "¿quién anda ahí?" a oscuras'], correta: 0 },
      { situacao: 'Un ruido metálico resuena en la bodega — el Fygmo2 está probando ganzúas distintas en la cerradura.', opcoes: ['Irte a dormir, debe de ser el viento', 'Poner un cerrojo extra en la puerta', 'Abrir la puerta para ver quién es'], correta: 1 },
      { situacao: 'Escondido en las escaleras de la bodega, el Fygmo apunta los prismáticos y hace señas al Fygmo2 para que avance.', opcoes: ['Encender de repente las luces de la bodega', 'Cerrar los ojos y esperar que pase', 'Llamar al Fygmo por su nombre, riendo'], correta: 0 },
      { situacao: 'Con el monóculo puesto, el Fygmo2 pega la oreja a la cerradura de la Reserva Especial para escuchar los engranajes.', opcoes: ['Distraerlo con un cubo que cae haciendo ruido', 'Dejarle una nota simpática', 'Ignorarlo y volver a dormir'], correta: 0 }
    ],
    // Sem a Cave de Reserva aberta (ver caveReservaAberta() em js/garrafa.js) a Fechadura fala da adega.
    fechaduraSubtituloSemCave: 'La Cerradura de la Bodega',
    fechaduraSituacoesSemCave: [
      'El Fygmo2 saca el monóculo y mide la cerradura de la bodega al milímetro, buscando el punto débil.',
      'Un ruido metálico resuena en la bodega — el Fygmo2 está probando ganzúas distintas en la cerradura.',
      'Escondido detrás de los barriles de la bodega, el Fygmo apunta los prismáticos y hace señas al Fygmo2 para que avance.',
      'Con el monóculo puesto, el Fygmo2 pega la oreja a la cerradura de la bodega para escuchar los engranajes.'
    ],
    fechaduraVitoriaSemCave: 'El Fygmo2 se rinde, guarda el monóculo y huye por el viñedo — la bodega está a salvo.',
    fechaduraVitoria: 'El Fygmo2 se rinde, guarda el monóculo y huye por el viñedo — la Reserva Especial está a salvo.',
    fechaduraDerrota: 'Demasiado tarde… el Fygmo2 abre la cerradura, tropieza con un barril y huye sin llevarse nada.',
    fechaduraReservaFygmo: 'Hmpf… la Reserva se salvó. ¡Pero ya le olemos!',
    fechaduraReservaFygmo2: '¡Ja! Por un hocico… la Reserva Especial sigue ahí. ¡Volveremos!',
    fechaduraDerrotaGarrafa: 'El Fygmo2 huye con las manos vacías. Tu Reserva {cor} sigue a salvo en la Bodega.',
    fechaduraReservaFygmoCor: 'Hmpf… tu Reserva {cor} se salvó. ¡Pero ya le olemos!',
    fechaduraReservaFygmo2Cor: '¡Ja! Una Reserva {cor} así no se desperdicia. ¡A la próxima es nuestra!',
    fechaduraReservaFygmoCobre: 'Hmpf… la Reserva Cobre se salvó. La más oscura de la Bodega… ¡aún vamos a por ella!',
    fechaduraReservaFygmo2Cobre: '¡Ja! La Reserva Cobre es la más rara de la Bodega. ¡A la próxima es nuestra!',
    disfarceVitoria: function (porco) { return '¡Debajo de las hojas estaba el ' + porco + ', atrapado con las manos en la masa intentando huir con la cosecha!'; },
    disfarceDerrota: function (porco) { return 'Era solo uva de verdad… El ' + porco + ' huye riendo, con el cesto vacío y el orgullo lleno.'; },
    chizoTurnos: [
      'Fygmo y Fygmo2 se acercan despacio a la bodega, escondidos entre las sombras...',
      'Fygmo le hace una señal a Fygmo2 para que avance un poco más...',
      'Ya se oyen sus pasos junto a la puerta de la bodega...',
      '¡Fygmo ya está abriendo la puerta de la bodega!'
    ],
    chizoVitoria: '¡Chizo se despierta a tiempo y ladra! Fygmo y Fygmo2 huyen corriendo con las manos vacías.',
    chizoCedo: 'Falsa alarma: Chizo vuelve a dormirse. Los cerdos se ríen, pero no se llevan nada.',
    chizoTarde: 'Demasiado tarde… los cerdos ya se han ido. Solo quedan las huellas.'
  }
};

function pStr() {
  return PROTEGER_STRINGS[currentLang] || PROTEGER_STRINGS.pt;
}

// Fundo de cada momento do Proteger.
const PROTEGER_FUNDOS = {
  // 'contain' em vez do corte normal ao centro: nesta foto o YoshiCat e
  // o porco ficam nas pontas, e um corte ao centro quase não os mostra
  // (ver definirFundo() em js/main.js). Já era assim antes do Bocado 1.
  disfarces: { src: 'assets/ecras/apontar_esquerda.jpg', size: 'contain' },
  fechadura: { src: 'assets/ecras/adega_juntos.jpg', pos: 'right top' },
  chizo: { src: 'assets/ecras/chizo_vinha.jpg' }
};
const PROTEGER_FUNDO_VITORIA = 'assets/ecras/yoshi_cat_festejar_vitoria.jpg';
// Derrota: cada estilo tem a sua própria imagem (o Chizo já tem imagem
// própria; os outros 2 continuam a partilhar a mesma de sempre).
const PROTEGER_FUNDO_DERROTA = 'assets/ecras/yoshi_cat_cruzados_derrota_3.jpg';
const PROTEGER_FUNDO_DERROTA_CHIZO = 'assets/ecras/chizo_lenco.jpg';

// Guarda qual foi o último estilo jogado, só para showResultProteger()
// saber que imagem de derrota mostrar.
let ultimoTipoProteger = null;

// -----------------------------------------------------------------
// ESTAÇÕES DO ANO (Parte C): não há um mecanismo de "hoje não há
// ataque" — cada vez que se entra em Proteger aparece sempre um dos
// 3 jogos. Por isso a estação muda antes é QUAL jogo é mais provável:
//   Inverno: sem uvas maduras, os porcos vão sempre à Fechadura da
//            reserva (só há isso para roubar).
//   Verão e Outono: uvas maduras, os jogos das uvas (Disfarces e
//            Chizo) ficam bem mais prováveis do que a Fechadura.
//   Primavera: ainda não há uvas que valham a pena, a Fechadura fica
//            mais provável e os jogos das uvas menos.
// -----------------------------------------------------------------
const PESOS_PROTEGER_POR_ESTACAO = {
  inverno: { fechadura: 1, disfarces: 0, chizo: 0 },
  primavera: { fechadura: 0.5, disfarces: 0.25, chizo: 0.25 },
  verao: { fechadura: 0.15, disfarces: 0.425, chizo: 0.425 },
  outono: { fechadura: 0.15, disfarces: 0.425, chizo: 0.425 }
};

// -----------------------------------------------------------------
// GARRAFA ESCURA NA FECHADURA (só visual e narrativo, nada é gravado):
// com a Cave de Reserva aberta e a garrafa que mais descansou com 3 dias ou
// mais (Âmbar ou Cobre), a Fechadura aparece mais vezes, mostra essa garrafa
// no cartão do topo e as falas dos porcos nomeiam a cor. Perder nunca tira nada.
// Para testar: ?garrafaescura=3 (Âmbar) ou ?garrafaescura=4 (Cobre) força só a
// apresentação, sem tocar no estado nem no histórico. Funciona com ?estacao=.
// As funções de garrafa.js (carrega a seguir) só são usadas quando existem.
// -----------------------------------------------------------------
const PROTEGER_GARRAFA_ESCURA_DIAS = 3;

function garrafaEscuraForcadaNoEndereco() {
  let valor = null;
  try { valor = new URLSearchParams(location.search).get('garrafaescura'); } catch (e) { return null; }
  const n = Number(valor);
  return (valor !== null && (n === 3 || n === 4)) ? n : null;
}

// A garrafa escura do jogador ({ imagem, nomeKey, dias }) ou null.
function garrafaEscuraProteger() {
  if (typeof garrafaPorDias !== 'function') return null;
  let dias = garrafaEscuraForcadaNoEndereco();
  if (dias === null) {
    if (typeof caveReservaAberta !== 'function' || !caveReservaAberta()) return null;
    if (typeof garrafaQueMaisDescansou !== 'function') return null;
    dias = garrafaQueMaisDescansou();
  }
  if (typeof dias !== 'number' || !isFinite(dias) || dias < PROTEGER_GARRAFA_ESCURA_DIAS) return null;
  return garrafaPorDias(dias);
}

// Miniatura + legenda ("Âmbar · 3 dias") para o cartão do topo; vazio sem garrafa
// escura. A foto só entra na página quando a Fechadura abre (nada pré-carregado).
function garrafaEscuraMiniaturaHtml() {
  const g = garrafaEscuraProteger();
  if (!g || typeof garrafaLegenda !== 'function') return '';
  return '<div class="proteger-garrafa">' +
    '<img class="proteger-garrafa-foto" src="' + g.imagem + '" alt="">' +
    '<span class="proteger-garrafa-nome">' + garrafaLegenda(g) + '</span>' +
  '</div>';
}

function corDaGarrafaEscura(g) {
  return t(g.nomeKey);
}

// Com uma garrafa escura (Âmbar ou Cobre, ver garrafaEscuraProteger() abaixo)
// a Fechadura sai pelo menos com este peso (no inverno continua 1); os outros
// dois jogos repartem o resto na mesma proporção que já tinham.
const PROTEGER_PESO_FECHADURA_COM_GARRAFA = 0.45;

// Função pura: pesos dos 3 jogos numa estação, com ou sem garrafa escura.
function pesosProtegerPara(estacao, temGarrafaEscura) {
  const base = PESOS_PROTEGER_POR_ESTACAO[estacao];
  if (!temGarrafaEscura) return base;
  const fechadura = Math.max(base.fechadura, PROTEGER_PESO_FECHADURA_COM_GARRAFA);
  const outros = base.disfarces + base.chizo;
  if (fechadura === base.fechadura || outros <= 0) return base;
  const escala = (1 - fechadura) / outros;
  return { fechadura: fechadura, disfarces: base.disfarces * escala, chizo: base.chizo * escala };
}

// A pista do dia (js/assaltos.js) decide o minijogo só na 1.ª ronda de cada
// visita (as rondas extra do tempo mantêm o sorteio).
// Índice da pista de hoje: com ?pista= no endereço é 0; senão só depois da meia
// taça de hoje (índice = feitas - 1). null = sem pista. Só lê: não grava nada.
function protegerPistaIndice() {
  try {
    if (typeof assaltosAlvoForcadoNoEndereco === 'function' && assaltosAlvoForcadoNoEndereco()) return 0;
    const feitas = typeof rondaChizoFeitasHoje === 'function' ? rondaChizoFeitasHoje() : 0;
    return feitas >= 1 ? Math.min(feitas, 2) - 1 : null;
  } catch (e) { return null; }
}

// Isco desta visita, só em memória (ver protegerIscoResponder()): em modo de teste
// (?pista=) nunca se grava nem se gasta nada.
let protegerIscoTeste = false;      // "Pôr isco" tocado em modo de teste
let protegerIscoPendente = null;    // índice da pista à espera da resposta, ou null
let protegerIscoNaRonda = false;    // a ronda atual é a 1.ª e tem isco posto
let protegerPorcoIsco = null;       // 'Fygmo' | 'Fygmo2' | null: o porco chamado pelo isco

function protegerEmModoTeste() {
  return typeof assaltosAlvoForcadoNoEndereco === 'function' && !!assaltosAlvoForcadoNoEndereco();
}

// Há isco para a pista de hoje (posto agora em teste, ou gravado em state.proteger.isco)?
function protegerIscoPostoAgora(indice) {
  if (protegerEmModoTeste()) return protegerIscoTeste;
  return !!iscoAlvoFixado(state.proteger && state.proteger.isco, diaLisboaDeHoje(), indice);
}

// Devolve 'fechadura' | 'disfarces' | 'chizo' ou null (= sorteio de hoje).
// Precedência do alvo: ?pista= > isco fixado > cálculo ao vivo (alvoParaProteger).
function tipoProtegerPelaPista() {
  protegerIscoNaRonda = false;
  protegerPorcoIsco = null;
  try {
    if (protegerRondaAtual !== 1) return null;
    if (typeof alvoParaProteger !== 'function' || typeof tipoDeProtegerPelaPista !== 'function') return null;
    const indice = protegerPistaIndice();
    if (indice === null) return null;
    const alvo = alvoParaProteger(indice, state.proteger && state.proteger.isco, diaLisboaDeHoje());
    if (protegerIscoPostoAgora(indice)) {
      protegerIscoNaRonda = true;
      protegerPorcoIsco = porcoDoAlvo(alvo);
    }
    const tipo = tipoDeProtegerPelaPista(alvo);
    return (tipo === 'fechadura' || tipo === 'disfarces' || tipo === 'chizo') ? tipo : null;
  } catch (e) { return null; }
}

// Primeira fala da ronda: com isco, o balão nomeia o porco chamado antes da
// fala de sempre (só texto).
function protegerFalaInicio(texto) {
  if (protegerIscoNaRonda) mostrarFalas([pStr().iscoFala(protegerPorcoIsco), texto], 'YoshiCat');
  else atualizarDialogo(texto, 'YoshiCat');
}

// Passo "Pôr isco?" antes da 1.ª ronda de cada visita: só com pista que tenha
// minijogo, com bagaço e sem registo para este dia e este índice. Nada se gasta até se tocar numa pílula.
// Devolve o índice da pista a perguntar, ou null (não se pergunta).
function protegerIscoPerguntarAgora() {
  try {
    if (typeof iscoPerguntar !== 'function') return null;
    const indice = protegerPistaIndice();
    if (indice === null) return null;
    const bagaco = state.adega && state.adega.bagaco;
    const isco = protegerEmModoTeste() ? null : (state.proteger && state.proteger.isco);
    if (!iscoPerguntar(isco, diaLisboaDeHoje(), indice, bagaco)) return null;
    // Só se pergunta quando a pista leva a um minijogo (cave, vinha, nevoeiro,
    // trovoada); com 'adega' ou alvo desconhecido a ronda segue sem passo.
    const alvo = alvoParaProteger(indice, isco, diaLisboaDeHoje());
    return tipoDeProtegerPelaPista(alvo) !== null ? indice : null;
  } catch (e) { return null; }
}

function renderIscoPergunta(indice) {
  protegerIscoPendente = indice;
  const S = pStr();
  const container = document.getElementById('proteger-container');
  container.innerHTML =
    protegerTopcardHtml(S, S.iscoSubtitulo, '<p class="mini-sub">' + t('adega.recursoBagaco') + ' ' + state.adega.bagaco + '</p>') +
    '<div class="action-panel"><div class="choice-stack">' +
      '<button type="button" class="btn-choice" onclick="protegerIscoResponder(true)">' + S.iscoBotao + '</button>' +
      '<button type="button" class="btn-choice" onclick="protegerIscoResponder(false)">' + S.iscoSem + '</button>' +
    '</div></div>';
  definirFundo('foto', PROTEGER_FUNDOS.chizo.src, PROTEGER_FUNDOS.chizo.pos);
  atualizarDialogo(S.iscoPergunta, 'YoshiCat');
}

// "Pôr isco": 1 bagaço e o registo { dia, indice, alvo } no MESMO saveState.
// "Seguir sem isco": registo com alvo null (não volta a perguntar). Nunca gasta
// duas vezes. Em modo de teste (?pista=) não grava nem gasta nada.
function protegerIscoResponder(poe) {
  const indice = protegerIscoPendente;
  if (indice === null) return; // já respondido (toque duplo)
  protegerIscoPendente = null;
  if (protegerEmModoTeste()) {
    protegerIscoTeste = !!poe;
  } else {
    const hoje = diaLisboaDeHoje();
    if (!iscoDoDia(state.proteger.isco, hoje, indice)) {
      const poeMesmo = !!poe && state.adega.bagaco >= 1;
      if (poeMesmo) state.adega.bagaco -= 1;
      state.proteger.isco = { dia: hoje, indice: indice, alvo: poeMesmo ? alvoDosPorcosDoDia(indice) : null };
      saveState(state);
    }
  }
  iniciarRondaProteger();
}

function escolherTipoProteger() {
  const daPista = tipoProtegerPelaPista();
  if (daPista) return daPista;
  const pesos = pesosProtegerPara(estacaoAtual(), !!garrafaEscuraProteger());
  const entradas = Object.keys(pesos).filter(function (tipo) { return pesos[tipo] > 0; });
  const total = entradas.reduce(function (soma, tipo) { return soma + pesos[tipo]; }, 0);
  let r = Math.random() * total;
  for (let i = 0; i < entradas.length; i++) {
    if (r < pesos[entradas[i]]) return entradas[i];
    r -= pesos[entradas[i]];
  }
  return entradas[entradas.length - 1];
}

// -----------------------------------------------------------------
// TEMPO REAL DE SETÚBAL (ver js/tempo.js): nevoeiro e trovoada tornam
// os porcos mais atrevidos — aparecem mais vezes seguidas na mesma
// visita ao Proteger, antes do ecrã de resultado final. Perder uma
// ronda termina a sessão como já acontecia (nunca há perda extra); os
// números ficam em TEMPO_CONFIG.vantagens.rondasExtraProteger.
// -----------------------------------------------------------------
let protegerRondaAtual = 1;
let protegerRondasTotal = 1;
let protegerRecompensaAcumulada = { uvas: 0, gotas: 0, rep: 0 };
let protegerAvisoTexto = '';

// -----------------------------------------------------------------
// LIMITE DIÁRIO DE PRÉMIOS — só as 2 primeiras vitórias de cada dia
// (dia em Lisboa, ver diaLisboaDeHoje() em js/tempo.js) dão Uvas, Gotas
// e Reputação. Depois disso o jogador pode continuar a jogar em "modo
// treino": ganha ou perde à mesma, só sem prémio nenhum.
// -----------------------------------------------------------------
const PROTEGER_VITORIAS_COM_PREMIO_POR_DIA = 2;

function garantirDiaProtegerAtualizado() {
  const hoje = diaLisboaDeHoje();
  if (state.proteger.diaVitoriasLisboa !== hoje) {
    state.proteger.diaVitoriasLisboa = hoje;
    state.proteger.vitoriasComPremioHoje = 0;
  }
}

function vitoriasProtegerComPremioRestantesHoje() {
  garantirDiaProtegerAtualizado();
  return Math.max(0, PROTEGER_VITORIAS_COM_PREMIO_POR_DIA - state.proteger.vitoriasComPremioHoje);
}

function rondasProtegerPorTempo() {
  const tempo = tempoAtual();
  const extra = tempo.disponivel ? (TEMPO_CONFIG.vantagens.rondasExtraProteger[tempo.ceu] || 0) : 0;
  return 1 + extra;
}

function avisoTempoProteger() {
  const tempo = tempoAtual();
  if (!tempo.disponivel) return '';
  if (tempo.ceu === 'trovoada') return t('tempo.avisoTrovoadaProteger');
  if (tempo.ceu === 'nevoeiro') return t('tempo.avisoNevoeiroProteger');
  return '';
}

// Cartão pequeno do topo (título + subtítulo do estilo atual + aviso do
// tempo, se houver, + um indicador extra opcional — ver
// chizoIndicadorHtml()) — igual em qualquer um dos 3 estilos do Proteger.
function protegerTopcardHtml(S, subtitulo, indicadorHtml) {
  return '<div class="topcard">' +
    '<p class="mini-title">' + S.titulo + '</p>' +
    '<p class="mini-sub">' + subtitulo + '</p>' +
    (protegerAvisoTexto ? '<p class="mini-sub">' + protegerAvisoTexto + '</p>' : '') +
    (indicadorHtml || '') +
  '</div>';
}

function startProteger(continuando) {
  if (!continuando) {
    protegerRondaAtual = 1;
    protegerRondasTotal = rondasProtegerPorTempo();
    protegerRecompensaAcumulada = { uvas: 0, gotas: 0, rep: 0 };
    protegerAvisoTexto = avisoTempoProteger();
    if (vitoriasProtegerComPremioRestantesHoje() === 0) {
      protegerAvisoTexto = protegerAvisoTexto ? (protegerAvisoTexto + ' ' + t('proteger.modoTreino')) : t('proteger.modoTreino');
    }
  }
  if (!continuando) {
    protegerIscoTeste = false;
    protegerIscoPendente = null;
    const indiceIsco = protegerIscoPerguntarAgora();
    if (indiceIsco !== null) { renderIscoPergunta(indiceIsco); return; }
  }
  iniciarRondaProteger();
}

function iniciarRondaProteger() {
  tocarSomFicheiro('assets/sons/porco_grunhir.mp3', 0.7);
  const tipo = escolherTipoProteger();
  if (tipo === 'fechadura') renderFechadura();
  else if (tipo === 'disfarces') renderDisfarces();
  else iniciarChizo();
}

// -----------------------------------------------------------------
// ESTILO 1 — "A Fechadura da Reserva Especial"
// (mecânica: escolha rápida entre 3 opções, 1 correta)
// -----------------------------------------------------------------

let currentFechaduraIndex = -1;
const PROTEGER_FECHADURA_CENAS_POR_PORCO = { Fygmo: [2], Fygmo2: [0, 1, 3] };

// Sem a Cave de Reserva aberta a Fechadura fala da adega (chaves ...SemCave em PROTEGER_STRINGS).
function fechaduraSemCave() {
  return !(typeof caveReservaAberta === 'function' && caveReservaAberta());
}

function renderFechadura() {
  ultimoTipoProteger = 'fechadura';
  const S = pStr();
  currentFechaduraIndex = randInt(0, S.fechadura.length - 1);
  // Com isco, a cena é do porco chamado (as cenas 0, 1 e 3 são do Fygmo2 e a 2 do
  // Fygmo, nas 3 línguas); só muda qual cena sai, nunca as opções nem a correta.
  if (protegerPorcoIsco) {
    const deste = PROTEGER_FECHADURA_CENAS_POR_PORCO[protegerPorcoIsco].filter(function (i) { return i < S.fechadura.length; });
    if (deste.length) currentFechaduraIndex = deste[randInt(0, deste.length - 1)];
  }
  const cena = S.fechadura[currentFechaduraIndex];
  const semCave = fechaduraSemCave();

  const container = document.getElementById('proteger-container');
  container.innerHTML =
    protegerTopcardHtml(S, semCave ? S.fechaduraSubtituloSemCave : S.fechaduraSubtitulo, garrafaEscuraMiniaturaHtml()) +
    '<div class="action-panel"><div class="choice-stack">' +
    cena.opcoes.map((op, i) =>
      '<button type="button" class="btn-choice" onclick="responderFechadura(' + i + ')">' + op + '</button>'
    ).join('') +
    '</div></div>';

  definirFundo('foto', PROTEGER_FUNDOS.fechadura.src, PROTEGER_FUNDOS.fechadura.pos);
  protegerFalaInicio(semCave ? S.fechaduraSituacoesSemCave[currentFechaduraIndex] : cena.situacao);
}

function responderFechadura(i) {
  const S = pStr();
  const cena = S.fechadura[currentFechaduraIndex];
  const venceu = i === cena.correta;
  // Garrafa escura em vista: a derrota não pode sugerir que ela se perdeu.
  const g = garrafaEscuraProteger();
  const derrota = g ? S.fechaduraDerrotaGarrafa.replace('{cor}', corDaGarrafaEscura(g)) : S.fechaduraDerrota;
  finishProteger(venceu, venceu ? (fechaduraSemCave() ? S.fechaduraVitoriaSemCave : S.fechaduraVitoria) : derrota);
}

// -----------------------------------------------------------------
// ESTILO 2 — "Onde se escondem os disfarces de uva?"
// (mecânica: 4 opções, 1 correta)
// -----------------------------------------------------------------

let currentDisfarceIndex = -1;
let currentDisfarcePorco = 'Fygmo';

// Ícone simples de traço para os montes de uvas (substitui o emoji 🍇).
const PROTEGER_UVA_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><circle cx="8" cy="15" r="2.8"></circle><circle cx="14" cy="17" r="2.8"></circle><circle cx="10" cy="10" r="2.8"></circle><circle cx="16" cy="12" r="2.8"></circle><path d="M11 4v3"></path><path d="M11 4c1.3-1.3 2.8-1.7 4.3-1.5"></path></svg>';

function renderDisfarces() {
  ultimoTipoProteger = 'disfarces';
  const S = pStr();
  currentDisfarceIndex = randInt(0, 3);
  currentDisfarcePorco = protegerPorcoIsco || (randInt(0, 1) === 0 ? 'Fygmo' : 'Fygmo2');

  const container = document.getElementById('proteger-container');
  container.innerHTML =
    protegerTopcardHtml(S, S.disfarcesSubtitulo) +
    '<div class="action-panel"><div class="grid-2x2">' +
    [0, 1, 2, 3].map(function (i) {
      return '<button type="button" class="btn-tile" onclick="responderDisfarce(' + i + ')">' + PROTEGER_UVA_SVG + '<span>' + S.monteLabel + ' ' + (i + 1) + '</span></button>';
    }).join('') +
    '</div></div>';

  definirFundo('foto', PROTEGER_FUNDOS.disfarces.src, PROTEGER_FUNDOS.disfarces.pos, PROTEGER_FUNDOS.disfarces.size);
  protegerFalaInicio(S.disfarcesIntro);
}

function responderDisfarce(i) {
  const S = pStr();
  const venceu = i === currentDisfarceIndex;
  const mensagem = venceu ? S.disfarceVitoria(currentDisfarcePorco) : S.disfarceDerrota(currentDisfarcePorco);
  finishProteger(venceu, mensagem);
}

// -----------------------------------------------------------------
// ESTILO 3 — "Não acordes o Chizo"
// (mecânica nova: jogo de tempo/reação por turnos)
// -----------------------------------------------------------------

const CHIZO_TOTAL_TURNOS = 4;
const CHIZO_TURNO_CORRETO = CHIZO_TOTAL_TURNOS - 2; // penúltimo turno
const CHIZO_DURACAO_TURNO_MS = 2200;

// Duração real de assets/sons/porco_grunhir.mp3 (medida no ficheiro,
// ~1489ms) — quando há mais do que uma ronda na mesma visita (nevoeiro/
// trovoada), o grunhido do porco da ronda seguinte começa mesmo a seguir
// ao ladrar do Chizo desta ronda (ver finishProteger() -> startProteger()
// abaixo), por isso o ladrar tem de esperar que o grunhido acabe.
const SOM_DURACAO_PORCO_GRUNHIR_MS = 1490;
// Pausa curta entre o grunhido do porco acabar e o Chizo começar a
// ladrar, para os dois sons não se sobreporem e o jogador ouvir os dois.
const SOM_ATRASO_CAO_MS = 300;

let chizoTurnoAtual = 0;
let chizoTimerId = null;
let chizoSessao = 0;
let chizoResolvido = false;
// Id só da RONDA de Chizo (distinto de chizoSessao, que também sobe ao
// sair do ecrã Proteger — ver pararTemporizadorProteger() abaixo). Sobe
// só em comecarChizo(), quando uma ronda nova arranca a sério, para o
// ladrar atrasado (ver alertarChizo() abaixo) não ser cancelado só por
// se ter saído do ecrã Proteger depois de já ter ganho.
let chizoRondaId = 0;

// Cancela qualquer relógio do Chizo a correr — chamado quando se
// sai do Proteger pela barra de baixo a meio do minijogo (ver
// LIMPEZA_AO_SAIR_POR_ECRA em js/main.js). Sair conta como desistir:
// sem penalização, só pára o relógio.
function pararTemporizadorProteger() {
  if (chizoTimerId) { clearTimeout(chizoTimerId); chizoTimerId = null; }
  chizoResolvido = true;
  chizoSessao++;
}

// Ícone simples de traço para o Chizo (substitui o emoji 🐶).
const PROTEGER_CAO_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M4 10c0-2 1.5-3 3-3l1.5 2h7L17 7c1.5 0 3 1 3 3v4c0 3-2.5 5-5 5h-6c-2.5 0-5-2-5-5v-4z"></path><path d="M8 19v2"></path><path d="M16 19v2"></path></svg>';

// Indicador pequeno no cartão do topo: quão perto os porcos estão (uma
// pegada 🐾 acesa por passo já andado, de CHIZO_TOTAL_TURNOS).
function chizoIndicadorHtml(turno) {
  let pontos = '';
  for (let i = 0; i < CHIZO_TOTAL_TURNOS; i++) {
    pontos += '<span class="passo' + (i <= turno ? ' ativo' : '') + '">🐾</span>';
  }
  return '<div class="passos-indicador">' + pontos + '</div>';
}

// O minijogo não começa sozinho: primeiro explica o desafio no balão e
// espera um toque em "Começar" (comecarChizo()) — só aí é que o
// relógio arranca de facto.
function iniciarChizo() {
  ultimoTipoProteger = 'chizo';
  pararTemporizadorProteger();
  chizoTurnoAtual = 0;

  const S = pStr();
  const container = document.getElementById('proteger-container');
  container.innerHTML =
    protegerTopcardHtml(S, S.chizoSubtitulo, chizoIndicadorHtml(-1)) +
    '<div class="action-panel"><button type="button" class="btn-pill pill-main pill-grande" onclick="comecarChizo()">' + S.chizoComecar + '</button></div>';

  definirFundo('foto', PROTEGER_FUNDOS.chizo.src, PROTEGER_FUNDOS.chizo.pos);
  protegerFalaInicio(S.chizoExplicacao);
}

function comecarChizo() {
  chizoSessao++;
  chizoRondaId++;
  const minhaSessao = chizoSessao;
  chizoTurnoAtual = 0;
  chizoResolvido = false;

  renderChizo();
  agendarProximoTurnoChizo(minhaSessao);
}

function agendarProximoTurnoChizo(minhaSessao) {
  chizoTimerId = setTimeout(function () {
    if (minhaSessao !== chizoSessao || chizoResolvido) return;

    chizoTurnoAtual++;
    if (chizoTurnoAtual >= CHIZO_TOTAL_TURNOS) {
      chizoResolvido = true;
      finishProteger(false, pStr().chizoTarde);
      return;
    }

    renderChizo();
    agendarProximoTurnoChizo(minhaSessao);
  }, CHIZO_DURACAO_TURNO_MS);
}

function renderChizo() {
  vibrar('leve'); // toque leve no início de cada passo (respeita o interruptor do Perfil)
  const S = pStr();
  const container = document.getElementById('proteger-container');
  container.innerHTML =
    protegerTopcardHtml(S, S.chizoSubtitulo, chizoIndicadorHtml(chizoTurnoAtual)) +
    '<div class="action-panel"><button type="button" class="btn-pill pill-main pill-grande" onclick="alertarChizo()">' + PROTEGER_CAO_SVG + ' <span>' + S.chizoBotao + '</span></button></div>';

  definirFundo('foto', PROTEGER_FUNDOS.chizo.src, PROTEGER_FUNDOS.chizo.pos);
  // Exceção às falas sem temporizador (ver mostrarFalas() em
  // js/main.js): dentro do minijogo com tempo, cada passo substitui a
  // mensagem na hora, sem esperar por nenhum toque.
  atualizarDialogo(S.chizoTurnos[chizoTurnoAtual], 'YoshiCat');
}

function alertarChizo() {
  if (chizoResolvido) return;
  chizoResolvido = true;
  if (chizoTimerId) clearTimeout(chizoTimerId);

  const S = pStr();
  if (chizoTurnoAtual === CHIZO_TURNO_CORRETO) {
    // O grunhido do porco da ronda seguinte pode arrancar já a seguir
    // (ver finishProteger() -> startProteger() abaixo) — só se ouve bem
    // se o ladrar esperar que esse grunhido acabe (ver constantes acima).
    // Usa chizoRondaId (só sobe em comecarChizo(), não ao sair do ecrã
    // Proteger) para só cancelar este ladrar se entretanto arrancou
    // mesmo uma ronda nova de Chizo — nunca só por se ter saído do
    // ecrã depois de já ter ganho.
    const minhaRonda = chizoRondaId;
    setTimeout(function () {
      if (minhaRonda !== chizoRondaId) return; // já começou uma ronda nova de Chizo
      tocarSomFicheiro('assets/sons/chizo_ladrar.mp3', 0.7);
    }, SOM_DURACAO_PORCO_GRUNHIR_MS + SOM_ATRASO_CAO_MS);
    finishProteger(true, S.chizoVitoria);
  } else if (chizoTurnoAtual < CHIZO_TURNO_CORRETO) {
    finishProteger(false, S.chizoCedo);
  } else {
    finishProteger(false, S.chizoTarde);
  }
}

// -----------------------------------------------------------------
// RESULTADO COMUM AOS 3 ESTILOS
// -----------------------------------------------------------------

function finishProteger(venceu, mensagem) {
  if (venceu) {
    const ganhaPremio = vitoriasProtegerComPremioRestantesHoje() > 0;
    let uvasGanhas = 0, gotasGanhas = 0, repGanha = 0;

    if (ganhaPremio) {
      uvasGanhas = randInt(6, 12);
      gotasGanhas = randInt(6, 12);
      repGanha = randInt(2, 5);

      state.uvas += uvasGanhas;
      state.gotas += gotasGanhas;
      state.reputacao += repGanha;
      state.proteger.vitoriasComPremioHoje += 1;
      if (typeof marcarObjetivoCumprido === 'function') marcarObjetivoCumprido('proteger_vencer');
    }
    saveState(state);
    updateStatsDisplays();

    protegerRecompensaAcumulada.uvas += uvasGanhas;
    protegerRecompensaAcumulada.gotas += gotasGanhas;
    protegerRecompensaAcumulada.rep += repGanha;

    // Nevoeiro/trovoada: mais um porco aparece nesta mesma visita, sem
    // passar pelo ecrã de resultado (ver rondasProtegerPorTempo acima).
    if (protegerRondaAtual < protegerRondasTotal) {
      protegerRondaAtual++;
      startProteger(true);
      return;
    }

    showResultProteger(true, protegerRecompensaAcumulada.uvas, protegerRecompensaAcumulada.gotas, protegerRecompensaAcumulada.rep, mensagem, ganhaPremio);
  } else {
    showResultProteger(false, 0, 0, 0, mensagem);
  }
}

function showResultProteger(venceu, uvas, gotas, rep, mensagem, ganhaPremio) {
  vibrar(venceu ? 'sucesso' : 'erro');
  tocarSom(venceu ? 'protegerVitoria' : 'protegerDerrota');

  const S = pStr();
  const container = document.getElementById('proteger-container');

  // Ganhou: fica só o resultado no balão (a história, depois a
  // recompensa — toca para ver a segunda) e sai-se pela barra de
  // baixo, sem botão nenhum. Perdeu: fica um botão para tentar outra
  // vez, com nome próprio (já não "Jogar Novamente").
  // Logo a seguir ao resultado fala o porco: ganhou = Fygmo (perde),
  // perdeu = Fygmo2 (ganha). É só uma fala, não mexe em nada do estado.
  // Na Fechadura, com a Cave de Reserva aberta, o porco fala da Reserva
  // Especial (só texto; caveReservaAberta() só lê o estado, ver js/garrafa.js).
  const daReserva = ultimoTipoProteger === 'fechadura' && typeof caveReservaAberta === 'function' && caveReservaAberta();
  // Com garrafa escura (só na Fechadura), a fala nomeia a cor; a Cobre, a mais rara, tem um par próprio.
  const g = ultimoTipoProteger === 'fechadura' ? garrafaEscuraProteger() : null;
  const cobre = !!g && g.nomeKey === 'adega.garrafaCobre';
  const cor = g ? corDaGarrafaEscura(g) : '';
  const falaFygmo = g ? (cobre ? S.fechaduraReservaFygmoCobre : S.fechaduraReservaFygmoCor.replace('{cor}', cor))
    : (daReserva ? S.fechaduraReservaFygmo : t('proteger.fala.fygmoPerde'));
  const falaFygmo2 = g ? (cobre ? S.fechaduraReservaFygmo2Cobre : S.fechaduraReservaFygmo2Cor.replace('{cor}', cor))
    : (daReserva ? S.fechaduraReservaFygmo2 : t('proteger.fala.fygmo2Ganha'));
  // Com isco (e um porco chamado), é esse porco quem fala, ganhe ou perca.
  const falas = [mensagem, venceu
    ? { texto: falaFygmo, falante: protegerPorcoIsco || 'Fygmo' }
    : { texto: falaFygmo2, falante: protegerPorcoIsco || 'Fygmo2' }];
  if (venceu && ganhaPremio) {
    falas.push('+' + uvas + ' ' + t('stat.uvas') + ', +' + gotas + ' ' + t('stat.gotas') + ', +' + rep + ' ' + t('stat.reputacao'));
  } else if (venceu && !ganhaPremio) {
    falas.push(t('proteger.modoTreinoResultado'));
  }

  container.innerHTML =
    protegerTopcardHtml(S, venceu ? S.protegida : S.naoCorreuBem, ultimoTipoProteger === 'fechadura' ? garrafaEscuraMiniaturaHtml() : '') +
    (venceu ? '' : '<div class="action-panel"><button type="button" class="btn-pill pill-main pill-grande" onclick="startProteger()">' + S.tentarOutraVez + '</button></div>');

  const derrotaSrc = ultimoTipoProteger === 'chizo' ? PROTEGER_FUNDO_DERROTA_CHIZO : PROTEGER_FUNDO_DERROTA;
  definirFundo('foto', venceu ? PROTEGER_FUNDO_VITORIA : derrotaSrc);
  mostrarFalas(falas, 'YoshiCat');
}
