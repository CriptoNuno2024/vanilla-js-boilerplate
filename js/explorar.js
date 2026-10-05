// ---------------------------------------------------------------------
// EXPLORAR + ENCICLOPÉDIA DO MOSCATEL
//
// Cada clique em "Explorar" (a partir da Quinta) desbloqueia UMA
// entrada nova, escolhida ao acaso entre as que faltam. As entradas
// desbloqueadas ficam guardadas para sempre (por id, independente da
// língua) e visíveis na Enciclopédia, no idioma atual.
// ---------------------------------------------------------------------

const ENCYCLOPEDIA_ENTRIES = {
  pt: [
    { id: 'origem', titulo: 'As Origens do Moscatel', texto: 'Dizem os mais velhos que a fama do Moscatel de Setúbal vem do século XIV, quando o rei Ricardo II de Inglaterra o importava com frequência.' },
    { id: 'terroir', titulo: 'A Terra da Arrábida', texto: 'Muitas vinhas de Moscatel de Setúbal crescem em colinas de argila e calcário, na Serra da Arrábida, perto de Azeitão.' },
    { id: 'secagem', titulo: 'O Moscatel que Regressava', texto: 'Antigamente, barris de Moscatel iam de navio até terras distantes e voltavam. A viagem, entre o sol e o balanço do mar, melhorava o vinho: nasceu o Torna-Viagem.' },
    { id: 'estagio', titulo: 'O Estágio em Cascos de Carvalho', texto: 'O segredo de um bom Moscatel está na paciência: o vinho repousa em cascos de carvalho durante anos, ganhando notas de mel, frutos secos e passas à medida que envelhece.' },
    { id: 'reconhecimento', titulo: 'Entre os Grandes Generosos de Portugal', texto: 'O Moscatel de Setúbal conta-se entre os grandes vinhos generosos de Portugal, ao lado do Porto, do Madeira e do Carcavelos.' },
    { id: 'protecao', titulo: 'Cuidar da Vinha Todos os Dias', texto: 'Aprendeste com os antigos vinhateiros que proteger a vinha é tão importante como colhê-la — sem cuidado diário, nem a melhor terra dá bom vinho.' },
    { id: 'vindima', titulo: 'A Vindima', texto: 'Na vindima, apanham-se os cachos de Moscatel quando estão no ponto certo. Há quem ainda os corte um a um, à mão, e há quem use máquinas.' },
    { id: 'poda', titulo: 'A Poda da Vinha', texto: 'No inverno, com a videira em repouso, faz-se a poda: cortam-se os ramos em excesso para concentrar a força da planta nos cachos que vão nascer na próxima estação.' },
    { id: 'aguardente', titulo: 'A Aguardente Vínica', texto: 'A fortificação do Moscatel é feita juntando aguardente vínica ao mosto em fermentação. O álcool interrompe o processo e preserva o açúcar natural da uva, dando ao vinho a sua doçura característica.' },
    { id: 'regiao', titulo: 'A Região Demarcada de Setúbal', texto: 'A demarcação do Moscatel de Setúbal começou em 1907 e é uma das denominações de origem mais antigas de Portugal.' },
    { id: 'repousoInverno', estacao: 'inverno', titulo: 'O Repouso da Videira', texto: 'No inverno a videira está sem folhas e descansa. É nesta fase de repouso que se faz a poda.' },
    { id: 'choroVideira', estacao: 'primavera', titulo: 'O Choro da Videira', texto: 'No fim do inverno ou início da primavera, depois da poda, a videira «chora»: pingam gotas de seiva dos cortes. É o sinal de que acordou do repouso.' },
    { id: 'floracao', estacao: 'primavera', titulo: 'A Floração', texto: 'Em maio e junho a videira floresce, durante cerca de dez dias. De cada flor que vinga nasce um bago de uva.' },
    { id: 'pintor', estacao: 'verao', titulo: 'O Pintor', texto: 'Em julho e agosto surge o «pintor»: as uvas começam a amadurecer. Nas castas brancas, como o Moscatel Graúdo, a película torna-se translúcida.' },
    { id: 'epocaVindima', estacao: 'outono', titulo: 'A Época da Vindima', texto: 'É a colheita das uvas, feita quando estão doces no ponto certo. Na Península de Setúbal, o Moscatel colhe-se sobretudo em setembro.' },
    { id: 'quedaFolha', estacao: 'outono', titulo: 'A Queda da Folha', texto: 'Em novembro as folhas amarelam e caem, e a videira prepara-se para descansar.' },
    { id: 'bagacoAlambique', manual: true, titulo: 'O Bagaço e o Alambique', texto: 'Depois de prensar as uvas, sobra o bagaço: as cascas e as grainhas. Numa quinta tradicional, o bagaço vai ao alambique, uma caldeira de cobre, onde se destila e se faz aguardente. Nada se desperdiça.' },
    { id: 'aguardenteAdega', manual: true, titulo: 'A Aguardente', texto: 'No Moscatel de Setúbal junta-se aguardente ao mosto para parar a fermentação. Assim o vinho guarda parte do açúcar natural da uva e fica doce e mais forte.' },
    { id: 'curtimenta', manual: true, titulo: 'A Curtimenta', texto: 'Depois de fortificado, o Moscatel fica em contacto com as cascas das uvas durante meses. É esta curtimenta que lhe dá o seu aroma intenso.' },
    { id: 'lendaSaoMartinho', manual: true, titulo: 'A Lenda de São Martinho', texto: 'Contam que Martinho, um soldado romano, viajava num dia de frio cortante quando encontrou um pobre a tremer à beira do caminho. Sem hesitar, cortou a sua capa ao meio com a espada e deu-lhe metade. Nessa noite, diz a lenda, o tempo mudou: o sol voltou e os dias aqueceram por uns tempos — é o chamado "verão de São Martinho". O YoshiCat gosta de pensar que, algures naquela capa cortada, ainda havia lugar para uma castanha assada.' },
    { id: 'jeropiga', manual: true, titulo: 'A Jeropiga', texto: 'A jeropiga é um licor doce e antigo, feito juntando aguardente ao mosto de uva ainda a fermentar — tal como no Moscatel fortificado, mas de forma mais rápida e caseira. É tradição em muitas quintas portuguesas fazê-la por esta altura do ano, a tempo do magusto de São Martinho.' },
    { id: 'magusto', manual: true, imagem: 'assets/ecras/enciclopedia_magusto.jpg', titulo: 'O Magusto', texto: 'O magusto é a festa das castanhas assadas, celebrada por volta de São Martinho, a 11 de novembro. As famílias reúnem-se à volta da fogueira para assar castanhas e provar o vinho novo — e nem os porcos Fygmo e Fygmo2 resistem ao cheiro.' }
  ],
  en: [
    { id: 'origem', titulo: 'The Origins of Moscatel', texto: "The elders say Setúbal Moscatel's fame goes back to the 14th century, when King Richard II of England imported it frequently." },
    { id: 'terroir', titulo: 'The Land of Arrábida', texto: 'Many Setúbal Moscatel vineyards grow on clay and limestone hills in the Serra da Arrábida, near Azeitão.' },
    { id: 'secagem', titulo: 'The Moscatel That Came Back', texto: 'In the past, barrels of Moscatel sailed to distant lands and came back. The voyage, between the sun and the rocking of the sea, improved the wine: the Torna-Viagem was born.' },
    { id: 'estagio', titulo: 'Aging in Oak Casks', texto: 'The secret of a good Moscatel is patience: the wine rests in oak casks for years, gaining notes of honey, dried fruit and raisins as it ages.' },
    { id: 'reconhecimento', titulo: "Among Portugal's Great Fortified Wines", texto: "Setúbal Moscatel ranks among Portugal's great fortified wines, alongside Port, Madeira and Carcavelos." },
    { id: 'protecao', titulo: 'Caring for the Vineyard Every Day', texto: 'You learned from the old vine-growers that protecting the vineyard matters as much as harvesting it — without daily care, not even the best soil makes good wine.' },
    { id: 'vindima', titulo: 'The Harvest', texto: 'At harvest, Moscatel bunches are picked when they are at the right point. Some still cut them one by one, by hand, and some use machines.' },
    { id: 'poda', titulo: 'Pruning the Vineyard', texto: 'In winter, while the vine rests, pruning takes place: excess branches are cut back so the plant channels its strength into the bunches that will grow next season.' },
    { id: 'aguardente', titulo: 'Wine Spirit Fortification', texto: "Moscatel is fortified by adding wine spirit (aguardente vínica) to the fermenting must. The alcohol halts the process and preserves the grape's natural sugar, giving the wine its characteristic sweetness." },
    { id: 'regiao', titulo: 'The Setúbal Demarcated Region', texto: 'The demarcation of Setúbal Moscatel began in 1907 and is one of the oldest denominations of origin in Portugal.' },
    { id: 'repousoInverno', estacao: 'inverno', titulo: 'Vine Dormancy', texto: 'In winter the vine is bare of leaves and rests. It is in this resting phase that pruning is done.' },
    { id: 'choroVideira', estacao: 'primavera', titulo: "The Vine's Tears", texto: 'At the end of winter or the start of spring, after pruning, the vine "weeps": drops of sap drip from the cuts. It is the sign that it has woken from its rest.' },
    { id: 'floracao', estacao: 'primavera', titulo: 'Flowering', texto: 'In May and June the vine flowers, for about ten days. Each flower that sets becomes a grape berry.' },
    { id: 'pintor', estacao: 'verao', titulo: 'The Painter', texto: 'In July and August the "painter" (pintor) appears: the grapes begin to ripen. In white varieties, such as Moscatel Graúdo, the skin becomes translucent.' },
    { id: 'epocaVindima', estacao: 'outono', titulo: 'The Harvest Season', texto: "This is when the grapes are picked, once they're perfectly sweet. In the Setúbal Peninsula, Moscatel is mostly harvested in September." },
    { id: 'quedaFolha', estacao: 'outono', titulo: 'Leaf Fall', texto: 'In November the leaves turn yellow and fall, and the vine prepares to rest.' },
    { id: 'bagacoAlambique', manual: true, titulo: 'The Pomace and the Still', texto: "After the grapes are pressed, the pomace is left over: the skins and seeds. On a traditional farm, the pomace goes to the still, a copper kettle, where it's distilled into grape spirit. Nothing goes to waste." },
    { id: 'aguardenteAdega', manual: true, titulo: 'The Grape Spirit', texto: "In Setúbal Moscatel, grape spirit is added to the must to stop fermentation. This way the wine keeps part of the grape's natural sugar and turns out sweet and stronger." },
    { id: 'curtimenta', manual: true, titulo: 'Skin Contact Ageing', texto: 'Once fortified, the Moscatel stays in contact with the grape skins for months. This skin contact is what gives it its intense aroma.' },
    { id: 'lendaSaoMartinho', manual: true, titulo: 'The Legend of St. Martin', texto: 'They say Martin, a Roman soldier, was travelling on a bitterly cold day when he found a poor man shivering by the roadside. Without hesitating, he cut his cloak in half with his sword and gave him one part. That night, legend says, the weather changed: the sun came back and the days warmed up for a while — the origin of "St. Martin\'s summer" (an Indian summer). YoshiCat likes to think that somewhere in that cut cloak, there was still room for a roasted chestnut.' },
    { id: 'jeropiga', manual: true, titulo: 'Jeropiga', texto: 'Jeropiga is a sweet, old-fashioned liqueur made by adding grape spirit to grape must while it is still fermenting — much like fortified Moscatel, but quicker and more homemade. Many Portuguese farms make it around this time of year, in time for the St. Martin\'s chestnut roast.' },
    { id: 'magusto', manual: true, imagem: 'assets/ecras/enciclopedia_magusto.jpg', titulo: 'The Magusto', texto: "The magusto is the chestnut-roasting feast celebrated around St. Martin's Day, on 11 November. Families gather round the bonfire to roast chestnuts and taste the new wine — not even Fygmo and Fygmo2 can resist the smell." }
  ],
  es: [
    { id: 'origem', titulo: 'Los Orígenes del Moscatel', texto: 'Dicen los más viejos que la fama del Moscatel de Setúbal viene del siglo XIV, cuando el rey Ricardo II de Inglaterra lo importaba con frecuencia.' },
    { id: 'terroir', titulo: 'La Tierra de Arrábida', texto: 'Muchos viñedos de Moscatel de Setúbal crecen en colinas de arcilla y caliza, en la Sierra de la Arrábida, cerca de Azeitão.' },
    { id: 'secagem', titulo: 'El Moscatel que Regresaba', texto: 'Antiguamente, barricas de Moscatel viajaban en barco hasta tierras lejanas y regresaban. El viaje, entre el sol y el vaivén del mar, mejoraba el vino: así nació el Torna-Viagem.' },
    { id: 'estagio', titulo: 'La Crianza en Toneles de Roble', texto: 'El secreto de un buen Moscatel está en la paciencia: el vino reposa en toneles de roble durante años, ganando notas de miel, frutos secos y pasas a medida que envejece.' },
    { id: 'reconhecimento', titulo: 'Entre los Grandes Generosos de Portugal', texto: 'El Moscatel de Setúbal se cuenta entre los grandes vinos generosos de Portugal, junto al Oporto, el Madeira y el Carcavelos.' },
    { id: 'protecao', titulo: 'Cuidar el Viñedo Todos los Días', texto: 'Aprendiste de los antiguos viticultores que proteger el viñedo es tan importante como cosecharlo — sin cuidado diario, ni la mejor tierra da buen vino.' },
    { id: 'vindima', titulo: 'La Vendimia', texto: 'En la vendimia se recogen los racimos de Moscatel cuando están en su punto. Hay quien todavía los corta uno a uno, a mano, y hay quien usa máquinas.' },
    { id: 'poda', titulo: 'La Poda del Viñedo', texto: 'En invierno, con la vid en reposo, se hace la poda: se cortan las ramas en exceso para concentrar la fuerza de la planta en los racimos que nacerán en la próxima temporada.' },
    { id: 'aguardente', titulo: 'El Aguardiente Vínico', texto: 'La fortificación del Moscatel se hace añadiendo aguardiente vínico al mosto en fermentación. El alcohol detiene el proceso y preserva el azúcar natural de la uva, dando al vino su característico dulzor.' },
    { id: 'regiao', titulo: 'La Región Demarcada de Setúbal', texto: 'La demarcación del Moscatel de Setúbal comenzó en 1907 y es una de las denominaciones de origen más antiguas de Portugal.' },
    { id: 'repousoInverno', estacao: 'inverno', titulo: 'El Reposo de la Vid', texto: 'En invierno la vid está sin hojas y descansa. Es en esta fase de reposo cuando se hace la poda.' },
    { id: 'choroVideira', estacao: 'primavera', titulo: 'El Lloro de la Vid', texto: 'A finales del invierno o a principios de la primavera, después de la poda, la vid «llora»: gotean gotas de savia de los cortes. Es la señal de que ha despertado del reposo.' },
    { id: 'floracao', estacao: 'primavera', titulo: 'La Floración', texto: 'En mayo y junio la vid florece, durante unos diez días. De cada flor que cuaja nace una baya de uva.' },
    { id: 'pintor', estacao: 'verao', titulo: 'El Pintor', texto: 'En julio y agosto aparece el «pintor»: las uvas empiezan a madurar. En las castas blancas, como el Moscatel Graúdo, la película se vuelve translúcida.' },
    { id: 'epocaVindima', estacao: 'outono', titulo: 'La Época de la Vendimia', texto: 'Es la recogida de las uvas, hecha cuando están dulces en su punto justo. En la Península de Setúbal, el Moscatel se vendimia sobre todo en septiembre.' },
    { id: 'quedaFolha', estacao: 'outono', titulo: 'La Caída de la Hoja', texto: 'En noviembre las hojas amarillean y caen, y la vid se prepara para descansar.' },
    { id: 'bagacoAlambique', manual: true, titulo: 'El Orujo y el Alambique', texto: 'Después de prensar las uvas, sobra el orujo: las pieles y las pepitas. En una quinta tradicional, el orujo va al alambique, una caldera de cobre, donde se destila y se hace aguardiente. Nada se desperdicia.' },
    { id: 'aguardenteAdega', manual: true, titulo: 'El Aguardiente', texto: 'En el Moscatel de Setúbal se añade aguardiente al mosto para detener la fermentación. Así el vino conserva parte del azúcar natural de la uva y queda dulce y más fuerte.' },
    { id: 'curtimenta', manual: true, titulo: 'La Crianza con Hollejos', texto: 'Después de fortificado, el Moscatel permanece en contacto con los hollejos de la uva durante meses. Es esta crianza la que le da su aroma intenso.' },
    { id: 'lendaSaoMartinho', manual: true, titulo: 'La Leyenda de San Martín', texto: 'Cuentan que Martín, un soldado romano, viajaba en un día de frío cortante cuando encontró a un pobre temblando junto al camino. Sin dudarlo, cortó su capa por la mitad con la espada y le dio una parte. Esa noche, dice la leyenda, el tiempo cambió: volvió el sol y los días se calentaron durante unos días — es el llamado "veranillo de San Martín". Al YoshiCat le gusta pensar que, en algún lugar de aquella capa cortada, todavía cabía una castaña asada.' },
    { id: 'jeropiga', manual: true, titulo: 'La Jeropiga', texto: 'La jeropiga es un licor dulce y antiguo, hecho añadiendo aguardiente al mosto de uva todavía en fermentación — igual que en el Moscatel fortificado, pero de forma más rápida y casera. Es tradición en muchas quintas portuguesas hacerla por esta época del año, a tiempo para el magosto de San Martín.' },
    { id: 'magusto', manual: true, imagem: 'assets/ecras/enciclopedia_magusto.jpg', titulo: 'El Magosto', texto: 'El magosto es la fiesta de las castañas asadas, celebrada en torno a San Martín, el 11 de noviembre. Las familias se reúnen alrededor de la hoguera para asar castañas y probar el vino nuevo — y ni los cerdos Fygmo y Fygmo2 resisten el olor.' }
  ]
};

// As entradas são guardadas por id (independente da língua), para que
// o progresso desbloqueado se mantenha ao trocar de idioma.
function encyclopediaEntries() {
  return ENCYCLOPEDIA_ENTRIES[currentLang] || ENCYCLOPEDIA_ENTRIES.pt;
}

// Entradas ainda por desbloquear E disponíveis AGORA pelo Explorar (uma
// entrada com estação própria só entra nesta lista durante a sua
// estação — ver Parte D das estações do ano; uma entrada "manual" nunca
// entra aqui, só se desbloqueia por uma ação específica — ver a Adega
// em js/garrafa.js).
function entradasBloqueadas() {
  const estacao = estacaoAtual();
  return encyclopediaEntries().filter(function (e) {
    if (state.encyclopedia.unlocked.indexOf(e.id) !== -1) return false;
    if (e.manual) return false;
    if (e.estacao && e.estacao !== estacao) return false;
    return true;
  });
}

function tituloEspecialDesbloqueado() {
  return state.encyclopedia.unlocked.length >= encyclopediaEntries().length;
}

// Desbloqueia uma entrada por uma ação do jogo (não pelo Explorar), ex:
// usar o Alambique pela primeira vez. Não faz nada e devolve null se já
// estava desbloqueada; caso contrário devolve a entrada (já no idioma
// atual), para quem chamou poder mostrar uma pequena notícia.
// NOTA: quem chamar isto ainda tem de fazer saveState(state) a seguir.
function desbloquearEntradaEnciclopedia(id) {
  if (state.encyclopedia.unlocked.indexOf(id) !== -1) return null;
  state.encyclopedia.unlocked.push(id);
  state.conhecimento += 1;
  const entrada = encyclopediaEntries().filter(function (e) { return e.id === id; })[0];
  return entrada || null;
}

function explorarTopcardHtml() {
  return '<div class="topcard"><p class="mini-title" data-i18n="explorar.title"></p></div>';
}

function enterExplorar() {
  const container = document.getElementById('explorar-container');
  const bloqueadas = entradasBloqueadas();

  // Já sabe tudo o que existe, para sempre (mesmo contando as entradas
  // de estação que só aparecem 3 meses por ano).
  if (state.encyclopedia.unlocked.length >= encyclopediaEntries().length) {
    container.innerHTML = explorarTopcardHtml();
    applyTranslations();
    mostrarNovaEntrada(null);
    atualizarDialogo(t('explorar.tudoDesbloqueado'), 'YoshiCat');
    return;
  }

  // Ainda há entradas por descobrir, mas nenhuma disponível nesta
  // estação — voltam a aparecer quando a estação certa chegar.
  if (bloqueadas.length === 0) {
    container.innerHTML = explorarTopcardHtml();
    applyTranslations();
    mostrarNovaEntrada(null);
    atualizarDialogo(t('explorar.nadaNestaEstacao'), 'YoshiCat');
    return;
  }

  const nova = bloqueadas[randInt(0, bloqueadas.length - 1)];
  state.encyclopedia.unlocked.push(nova.id);
  state.conhecimento += 1;
  if (typeof marcarObjetivoCumprido === 'function') marcarObjetivoCumprido('explorar_descobrir');
  saveState(state);
  updateStatsDisplays();

  container.innerHTML = explorarTopcardHtml();
  applyTranslations();
  mostrarNovaEntrada(nova);
  atualizarDialogo('', '');
}

function renderEnciclopedia() {
  const container = document.getElementById('enciclopedia-container');
  const entradas = encyclopediaEntries();

  // Desbloqueadas primeiro, bloqueadas ("???") no fim — dentro de cada
  // grupo mantém-se a ordem de sempre (sort é estável).
  const entradasOrdenadas = entradas.slice().sort(function (a, b) {
    const aDesbloqueada = state.encyclopedia.unlocked.indexOf(a.id) !== -1;
    const bDesbloqueada = state.encyclopedia.unlocked.indexOf(b.id) !== -1;
    if (aDesbloqueada === bDesbloqueada) return 0;
    return aDesbloqueada ? -1 : 1;
  });

  const cardsHtml = entradasOrdenadas.map(function (e) {
    const desbloqueada = state.encyclopedia.unlocked.indexOf(e.id) !== -1;
    if (desbloqueada) {
      const imagemHtml = e.imagem ? '<img src="' + e.imagem + '" alt="">' : '';
      return '<div class="encyclopedia-card">' + imagemHtml + '<h3>' + e.titulo + '</h3><p>' + e.texto + '</p></div>';
    }
    // Uma entrada de estação mostra qual é, em vez de "???", para o
    // jogador saber que tem de voltar ao Explorar nessa altura do ano.
    const titulo = e.estacao ? t('estacao.' + e.estacao) : '???';
    return '<div class="encyclopedia-card locked"><h3>' + titulo + '</h3><p data-i18n="enciclopedia.bloqueado"></p></div>';
  }).join('');

  container.innerHTML =
    '<div class="topcard">' +
      '<p class="mini-title" data-i18n="enciclopedia.title"></p>' +
      '<p class="mini-sub">' + state.encyclopedia.unlocked.length + ' / ' + entradas.length + '</p>' +
    '</div>' +
    '<div class="scroll-panel encyclopedia-grid">' + cardsHtml + '</div>';

  atualizarDialogo('', '');
  applyTranslations();
}
