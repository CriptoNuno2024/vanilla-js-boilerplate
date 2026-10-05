// ---------------------------------------------------------------------
// CADERNO DOS FYGMOS — estrutura e dados (PR A) e ecrã só de leitura (PR B, no fim do ficheiro).
//
// O Caderno é o caderno de PLANOS dos porcos: depois de travar um assalto o
// YoshiCat encontra uma página rasgada escrita pelo Fygmo ou pelo Fygmo2. Cada
// página liga a um ALVO do dia (ver ASSALTOS_ALVOS em js/assaltos.js).
//
// Os dados e escolherPaginaCaderno() são puros; as páginas ganham-se na vitória do Proteger
// (cadernoDarPaginaDaVitoria(), chamada por finishProteger em js/proteger.js). O estado
// vive em state.caderno = { paginas: { idPagina: 'AAAA-MM-DD' (Lisboa) } } (ver
// js/state.js) e a nuvem junta-o por união (nuvemJuntarCaderno em js/nuvem.js).
//
// Os textos (título e corpo, PT/EN/ES) são os finais aprovados.
// `node scripts/verificar-caderno.js --final` falha se restar "[por escrever]".
// ---------------------------------------------------------------------

const CADERNO_ALVOS = ['vinha', 'adega', 'cave', 'nevoeiro', 'trovoada'];

// Por alvo: 2 comuns + 1 rara (15 páginas). Os ids são estáveis (é o que se
// grava no estado) e iguais nas 3 línguas. Autor: 'Fygmo' (o mais velho, de
// boina) ou 'Fygmo2' (o mais novo, de monóculo).
const CADERNO_PAGINAS = [
  { id: 'vinha_1', alvo: 'vinha', raridade: 'comum', autor: 'Fygmo',
    pt: { titulo: 'Plano da Vinha, versão 7',
      corpo: '1. Entrar pela fila das cepas mais velhas: dizem que dão as uvas mais doces. 2. Não pisar o arame. 3. Não acordar o cão. 4. Se o cão acordar, dizer que viemos só ver a paisagem.' },
    en: { titulo: 'Vineyard Plan, version 7',
      corpo: '1. Go in through the row of the oldest vines: they say the grapes are sweeter there. 2. Don\'t step on the wire. 3. Don\'t wake the dog. 4. If the dog wakes up, say we only came to see the view.' },
    es: { titulo: 'Plan del Viñedo, versión 7',
      corpo: '1. Entrar por la fila de las cepas más viejas: dicen que dan las uvas más dulces. 2. No pisar el alambre. 3. No despertar al perro. 4. Si el perro despierta, decir que solo veníamos a ver el paisaje.' } },
  { id: 'vinha_2', alvo: 'vinha', raridade: 'comum', autor: 'Fygmo',
    pt: { titulo: 'Disfarce de monte de uvas',
      corpo: 'Problema: o gato olha sempre para o monte. Solução: ficar mais parado do que o monte. Nota: o monte não respira. Aprender com o monte.' },
    en: { titulo: 'Grape Pile Disguise',
      corpo: 'Problem: the cat always looks at the pile. Solution: stay stiller than the pile. Note: the pile doesn\'t breathe. Learn from the pile.' },
    es: { titulo: 'Disfraz de montón de uvas',
      corpo: 'Problema: el gato siempre mira el montón. Solución: quedarse más quieto que el montón. Nota: el montón no respira. Aprender del montón.' } },
  { id: 'vinha_rara', alvo: 'vinha', raridade: 'rara', autor: 'Fygmo',
    pt: { titulo: 'Balanço do ano',
      corpo: 'Cachos roubados: 3. Cachos devolvidos por engano: 0. Vezes que o cão nos viu: todas. Conclusão: o plano está a correr bem.' },
    en: { titulo: 'Year in Review',
      corpo: 'Bunches stolen: 3. Bunches returned by mistake: 0. Times the dog saw us: all of them. Conclusion: the plan is going well.' },
    es: { titulo: 'Balance del año',
      corpo: 'Racimos robados: 3. Racimos devueltos por error: 0. Veces que el perro nos vio: todas. Conclusión: el plan va muy bien.' } },
  { id: 'adega_1', alvo: 'adega', raridade: 'comum', autor: 'Fygmo',
    pt: { titulo: 'Plano da Adega',
      corpo: '1. Trocar os barris de sítio: o gato conta-os, mas não os conhece. 2. Ficar com o do cheiro mais forte. 3. Dizer que é inspeção. 4. Se perguntarem, a ideia foi do Fygmo2.' },
    en: { titulo: 'Winery Plan',
      corpo: '1. Move the barrels around: the cat counts them but doesn\'t know them. 2. Keep the one with the strongest smell. 3. Say it\'s an inspection. 4. If anyone asks, it was Fygmo2\'s idea.' },
    es: { titulo: 'Plan de la Bodega',
      corpo: '1. Cambiar los barriles de sitio: el gato los cuenta, pero no los conoce. 2. Quedarse con el del olor más fuerte. 3. Decir que es una inspección. 4. Si preguntan, la idea fue de Fygmo2.' } },
  { id: 'adega_2', alvo: 'adega', raridade: 'comum', autor: 'Fygmo',
    pt: { titulo: 'Nota sobre a aguardente',
      corpo: 'A aguardente é a alma do Moscatel. A alma, repara. Não é do gato nem do cão. Ficou ali sem dono. Alguém tem de tomar conta dela.' },
    en: { titulo: 'A Note on the Brandy',
      corpo: 'Brandy is the soul of Moscatel. The soul, mind you. It belongs to neither the cat nor the dog. It was left there with no owner. Someone has to look after it.' },
    es: { titulo: 'Nota sobre el aguardiente',
      corpo: 'El aguardiente es el alma del Moscatel. El alma, ojo. No es del gato ni del perro. Quedó allí sin dueño. Alguien tiene que ocuparse de ella.' } },
  { id: 'adega_rara', alvo: 'adega', raridade: 'rara', autor: 'Fygmo',
    pt: { titulo: 'Carta que não seguiu',
      corpo: 'Caro YoshiCat: o barril foi devolvido. Pesava menos do que quando o levámos. Não perguntes. Cumprimentos, F. e F2. P.S.: a boina não tem nada a ver com isto.' },
    en: { titulo: 'A Letter That Never Went',
      corpo: 'Dear YoshiCat: the barrel has been returned. It weighed less than when we took it. Don\'t ask. Regards, F. and F2. P.S.: the beret has nothing to do with this.' },
    es: { titulo: 'La carta que no salió',
      corpo: 'Querido YoshiCat: el barril ha sido devuelto. Pesaba menos que cuando nos lo llevamos. No preguntes. Saludos, F. y F2. P.D.: la boina no tiene nada que ver con esto.' } },
  { id: 'cave_1', alvo: 'cave', raridade: 'comum', autor: 'Fygmo2',
    pt: { titulo: 'Nota da Cave',
      corpo: 'Já medi a fechadura com o monóculo. Dá-me três minutos e um palito. Se o gato aparecer, finge que és um barril.' },
    en: { titulo: 'Note from the Cave',
      corpo: 'I\'ve measured the lock with my monocle. Give me three minutes and a toothpick. If the cat shows up, pretend to be a barrel.' },
    es: { titulo: 'Nota de la Reserva',
      corpo: 'Ya medí la cerradura con el monóculo. Dame tres minutos y un palillo. Si aparece el gato, haz como que eres un barril.' } },
  { id: 'cave_2', alvo: 'cave', raridade: 'comum', autor: 'Fygmo2',
    pt: { titulo: 'Reserva Especial: observações',
      corpo: 'Trancas: três. Cães: um. Gatos: um. Probabilidade de sucesso: educadamente baixa. Avançamos mesmo assim, por princípio.' },
    en: { titulo: 'Special Reserve: observations',
      corpo: 'Locks: three. Dogs: one. Cats: one. Chance of success: politely low. We go ahead anyway, on principle.' },
    es: { titulo: 'Reserva Especial: observaciones',
      corpo: 'Cerrojos: tres. Perros: uno. Gatos: uno. Probabilidad de éxito: educadamente baja. Seguimos adelante igualmente, por principio.' } },
  { id: 'cave_rara', alvo: 'cave', raridade: 'rara', autor: 'Fygmo2',
    pt: { titulo: 'Degustação por antecipação',
      corpo: 'Já decidi como vou provar a Reserva: devagar, dedo mindinho no ar, monóculo no sítio. O Fygmo diz que vai beber do gargalo. Discutimos. Nenhum de nós a provou.' },
    en: { titulo: 'Tasting in Advance',
      corpo: 'I\'ve already decided how I\'ll taste the Reserve: slowly, pinky raised, monocle in place. Fygmo says he\'ll drink from the neck. We argued. Neither of us has tasted it.' },
    es: { titulo: 'Cata anticipada',
      corpo: 'Ya he decidido cómo probaré la Reserva: despacio, con el meñique en alto y el monóculo en su sitio. Fygmo dice que beberá del gollete. Discutimos. Ninguno de los dos la ha probado.' } },
  { id: 'nevoeiro_1', alvo: 'nevoeiro', raridade: 'comum', autor: 'Fygmo2',
    pt: { titulo: 'Plano do Nevoeiro',
      corpo: 'O nevoeiro é nosso aliado: ninguém vê ninguém, incluindo nós. Combinámos um assobio para nos reconhecermos. O Fygmo não sabe assobiar. Combinámos uma tosse.' },
    en: { titulo: 'Fog Plan',
      corpo: 'The fog is our ally: nobody sees anybody, ourselves included. We agreed on a whistle to recognise each other. Fygmo can\'t whistle. We agreed on a cough.' },
    es: { titulo: 'Plan de la Niebla',
      corpo: 'La niebla es nuestra aliada: nadie ve a nadie, nosotros incluidos. Acordamos un silbido para reconocernos. Fygmo no sabe silbar. Acordamos una tos.' } },
  { id: 'nevoeiro_2', alvo: 'nevoeiro', raridade: 'comum', autor: 'Fygmo2',
    pt: { titulo: 'O cão',
      corpo: 'O cão dorme melhor no nevoeiro. Estudei o fenómeno. Não sei explicar, sei aproveitar. Passos de lã. Respirar menos.' },
    en: { titulo: 'The Dog',
      corpo: 'The dog sleeps better in the fog. I studied the phenomenon. I can\'t explain it, I can exploit it. Wool steps. Breathe less.' },
    es: { titulo: 'El perro',
      corpo: 'El perro duerme mejor con niebla. Estudié el fenómeno. No sé explicarlo, sé aprovecharlo. Pasos de lana. Respirar menos.' } },
  { id: 'nevoeiro_rara', alvo: 'nevoeiro', raridade: 'rara', autor: 'Fygmo2',
    pt: { titulo: 'Mapa da Quinta (incompleto)',
      corpo: 'Ali há uma coisa. Acolá há outra. Ao centro há algo grande que pode ser a adega ou o cão. Em caso de dúvida, não pisar.' },
    en: { titulo: 'Map of the Farm (incomplete)',
      corpo: 'Over there is a thing. Over here is another. In the middle is something big that could be the winery or the dog. When in doubt, don\'t step.' },
    es: { titulo: 'Mapa de la Quinta (incompleto)',
      corpo: 'Ahí hay una cosa. Allá hay otra. En el centro hay algo grande que puede ser la bodega o el perro. En caso de duda, no pisar.' } },
  { id: 'trovoada_1', alvo: 'trovoada', raridade: 'comum', autor: 'Fygmo',
    pt: { titulo: 'Plano da Trovoada',
      corpo: 'O cão tem medo de trovoada. Aproveitar. Entre o relâmpago e o trovão, contar até três. Se o gato aparecer com o relâmpago, ficar quieto como um cesto.' },
    en: { titulo: 'Thunderstorm Plan',
      corpo: 'The dog is afraid of thunderstorms. Take advantage. Between the lightning and the thunder, count to three. If the cat appears in the lightning, stay still as a basket.' },
    es: { titulo: 'Plan de la Tormenta',
      corpo: 'El perro le tiene miedo a las tormentas. Aprovechar. Entre el relámpago y el trueno, contar hasta tres. Si el gato aparece con el relámpago, quedarse quieto como un cesto.' } },
  { id: 'trovoada_2', alvo: 'trovoada', raridade: 'comum', autor: 'Fygmo',
    pt: { titulo: 'Nota de campo',
      corpo: 'Chuva: muita. Cestos: vários. Cão: debaixo da cama, dizem. Gato: sozinho a vigiar. Conclusão: hoje é o nosso dia. Escrevo isto debaixo de uma lona.' },
    en: { titulo: 'Field Note',
      corpo: 'Rain: lots. Baskets: several. Dog: under the bed, they say. Cat: watching alone. Conclusion: today is our day. I\'m writing this under a tarp.' },
    es: { titulo: 'Nota de campo',
      corpo: 'Lluvia: mucha. Cestos: varios. Perro: debajo de la cama, dicen. Gato: vigilando solo. Conclusión: hoy es nuestro día. Escribo esto bajo una lona.' } },
  { id: 'trovoada_rara', alvo: 'trovoada', raridade: 'rara', autor: 'Fygmo',
    pt: { titulo: 'Trovão, 3.ª tentativa',
      corpo: 'Hoje o trovão assustou-me a mim. Ninguém viu. Se perguntarem, foi um estalo da boina. Registo oficial: o Fygmo não tem medo de nada, exceto de trovões e de um certo cão.' },
    en: { titulo: 'Thunder, 3rd Attempt',
      corpo: 'Today the thunder scared me. Nobody saw. If anyone asks, it was a crack in my beret. Official record: Fygmo is afraid of nothing, except thunder and a certain dog.' },
    es: { titulo: 'Trueno, tercer intento',
      corpo: 'Hoy el trueno me asustó a mí. Nadie lo vio. Si preguntan, fue un chasquido de la boina. Registro oficial: Fygmo no le teme a nada, salvo a los truenos y a cierto perro.' } }
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

// Dá a página de uma vitória (PR C): escolhe com escolherPaginaCaderno() e grava
// state.caderno.paginas[id] = hoje (dia de Lisboa), sem tocar em mais nada do
// estado; o saveState é de quem chama (o da vitória, em finishProteger). A chave é o
// id: nunca duplica nem muda a data de uma página que já existe.
// Devolve { pagina, completo } como escolherPaginaCaderno().
function cadernoDarPaginaDaVitoria(alvo, houveIsco, indice) {
  if (!state.caderno || typeof state.caderno.paginas !== 'object' || state.caderno.paginas === null) {
    state.caderno = { paginas: {} };
  }
  const hoje = diaLisboaDeHoje();
  const caveAberta = typeof caveReservaAberta === 'function' && caveReservaAberta();
  const r = escolherPaginaCaderno(alvo, state.caderno.paginas, hoje, indice, !!houveIsco, caveAberta);
  if (r.pagina && !Object.prototype.hasOwnProperty.call(state.caderno.paginas, r.pagina.id)) {
    state.caderno.paginas[r.pagina.id] = hoje;
  }
  return r;
}

// ---------------------------------------------------------------------
// ECRÃ DO CADERNO (PR B: só leitura). Aberto a partir do cartão "Caderno n / 15"
// do Perfil, no molde do Livro de Conquistas (renderConquistas em js/conquistas.js).
// Só LÊ state.caderno.paginas; quem escreve nele é o PR C.
// ---------------------------------------------------------------------

// Páginas ganhas = chaves de state.caderno.paginas que existem em CADERNO_PAGINAS
// (ids desconhecidos, p.ex. vindos de uma versão futura, não contam: sempre n / 15).
function cadernoPaginasGanhas() {
  const mapa = (state && state.caderno && state.caderno.paginas) || {};
  return CADERNO_PAGINAS.filter(function (p) {
    return Object.prototype.hasOwnProperty.call(mapa, p.id);
  });
}

// "n / 15" do mosaico do Perfil e do topcard.
function cadernoResumo() {
  return cadernoPaginasGanhas().length + ' / ' + CADERNO_PAGINAS.length;
}

function cadernoEscapar(texto) {
  return String(texto).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderCaderno() {
  const container = document.getElementById('caderno-container');
  const ganhas = cadernoPaginasGanhas();
  const ganhasIds = {};
  ganhas.forEach(function (p) { ganhasIds[p.id] = true; });
  // As da cave por ganhar (e enquanto não há Cave) mostram-se como as outras: "???".
  const porGanhar = CADERNO_PAGINAS.filter(function (p) { return !ganhasIds[p.id]; });

  const cartaoGanho = function (p) {
    const texto = p[currentLang] || p.pt;
    return '<div class="encyclopedia-card">' +
      '<h3>' + cadernoEscapar(texto.titulo) + '</h3>' +
      '<p><em>' + t('caderno.autorLabel') + ' ' + cadernoEscapar(p.autor) + '</em></p>' +
      '<p>' + cadernoEscapar(texto.corpo) + '</p>' +
    '</div>';
  };
  const cartaoPorGanhar = function () {
    return '<div class="encyclopedia-card locked"><h3>' + t('caderno.porGanhar') + '</h3></div>';
  };

  const vazioHtml = ganhas.length === 0 ? '<p class="info-text" style="grid-column: 1 / -1">' + t('caderno.vazio') + '</p>' : '';

  container.innerHTML =
    '<div class="topcard">' +
      '<p class="mini-title" data-i18n="caderno.title"></p>' +
      '<p class="mini-sub">' + cadernoResumo() + ' · ' + t('caderno.subtitulo') + '</p>' +
    '</div>' +
    '<div class="scroll-panel encyclopedia-grid">' +
      vazioHtml +
      ganhas.map(cartaoGanho).join('') +
      porGanhar.map(cartaoPorGanhar).join('') +
    '</div>' +
    '<div class="action-panel">' +
      '<button type="button" class="btn-pill pill-main pill-grande" onclick="voltarEcraAnterior()" data-i18n="nav.voltar"></button>' +
    '</div>';

  atualizarDialogo('', '');
  applyTranslations();
}
