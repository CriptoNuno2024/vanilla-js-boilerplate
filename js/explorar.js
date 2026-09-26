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
    { id: 'origem', titulo: 'As Origens do Moscatel', texto: 'Dizem os mais velhos da Quinta que o Moscatel de Setúbal nasceu há mais de 500 anos, quando os primeiros bacelos de Moscatel Graúdo chegaram à península vindos de terras distantes.' },
    { id: 'terroir', titulo: 'A Terra da Arrábida', texto: 'A vinha da Quinta cresce em solos de argila e calcário, virada a poente — a mesma exposição que torna os Moscatéis de Setúbal tão doces e aromáticos.' },
    { id: 'secagem', titulo: 'O Sol Antes do Lagar', texto: 'Depois da vindima, os cachos mais generosos ficam a secar ao sol, concentrando o açúcar antes de seguirem para o lagar. É esse cuidado que dá ao Moscatel o seu perfume inconfundível.' },
    { id: 'estagio', titulo: 'O Estágio em Cascos de Carvalho', texto: 'O segredo de um bom Moscatel está na paciência: o vinho repousa em cascos de carvalho durante anos, ganhando notas de mel, frutos secos e passas à medida que envelhece.' },
    { id: 'reconhecimento', titulo: 'Um Vinho Reconhecido no Mundo', texto: 'Setúbal é uma das poucas regiões do mundo reconhecida pela qualidade excecional dos seus vinhos moscatel, ao lado de nomes como o Rütherglen australiano.' },
    { id: 'protecao', titulo: 'Cuidar da Vinha Todos os Dias', texto: 'YoshiCat aprendeu com os antigos vinhateiros que proteger a vinha é tão importante como colhê-la — sem cuidado diário, nem a melhor terra dá bom vinho.' },
    { id: 'vindima', titulo: 'A Vindima Manual', texto: 'Na Região Demarcada de Setúbal, a vindima é ainda feita à mão: os cachos são cortados um a um e colocados em cestos, para chegarem inteiros e intactos ao lagar.' },
    { id: 'poda', titulo: 'A Poda da Vinha', texto: 'No inverno, com a videira em repouso, faz-se a poda: corta-se os ramos em excesso para concentrar a força da planta nos cachos que vão nascer na próxima estação.' },
    { id: 'aguardente', titulo: 'A Aguardente Vínica', texto: 'A fortificação do Moscatel é feita juntando aguardente vínica ao mosto em fermentação. O álcool interrompe o processo e preserva o açúcar natural da uva, dando ao vinho o seu característico doçor.' },
    { id: 'regiao', titulo: 'A Região Demarcada de Setúbal', texto: 'A Região Demarcada de Setúbal é uma das mais antigas do mundo com denominação de origem, criada para proteger e garantir a autenticidade dos vinhos produzidos nesta península.' },
    { id: 'repousoInverno', estacao: 'inverno', titulo: 'O Repouso da Videira', texto: 'No inverno a videira perde as folhas e descansa. A seiva quase para de correr, e é por isso que esta é a altura certa para a poda.' },
    { id: 'choroVideira', estacao: 'primavera', titulo: 'O Choro da Videira', texto: 'Em março, depois da poda, a videira "chora": pingam gotas de seiva dos cortes. É o sinal de que acordou do inverno.' },
    { id: 'floracao', estacao: 'primavera', titulo: 'A Floração', texto: 'Em maio a videira dá flores pequenas e verdes, quase invisíveis. De cada flor que vinga nasce um bago de uva.' },
    { id: 'pintor', estacao: 'verao', titulo: 'O Pintor', texto: 'Em julho e agosto os bagos amolecem e mudam de cor. No Moscatel, passam de verde a dourado.' },
    { id: 'epocaVindima', estacao: 'outono', titulo: 'A Vindima', texto: 'É a colheita das uvas, feita quando estão doces no ponto certo. Na Península de Setúbal, o Moscatel colhe-se entre o fim do verão e setembro.' },
    { id: 'quedaFolha', estacao: 'outono', titulo: 'A Queda da Folha', texto: 'Em novembro as folhas amarelam e caem, e a videira prepara-se para descansar.' },
    { id: 'bagacoAlambique', manual: true, titulo: 'O Bagaço e o Alambique', texto: 'Depois de prensar as uvas, sobra o bagaço: as cascas e as grainhas. Numa quinta tradicional, o bagaço vai ao alambique, uma caldeira de cobre, onde se destila e se faz aguardente. Nada se desperdiça.' },
    { id: 'aguardenteAdega', manual: true, titulo: 'A Aguardente', texto: 'No Moscatel de Setúbal junta-se aguardente ao mosto para parar a fermentação. Assim o vinho guarda parte do açúcar natural da uva e fica doce e mais forte.' },
    { id: 'curtimenta', manual: true, titulo: 'A Curtimenta', texto: 'Depois de fortificado, o Moscatel fica em contacto com as cascas das uvas durante meses. É esta curtimenta que lhe dá o seu aroma intenso.' },
    { id: 'lendaSaoMartinho', manual: true, titulo: 'A Lenda de São Martinho', texto: 'Contam que Martinho, um soldado romano, viajava num dia de frio cortante quando encontrou um pobre a tremer à beira do caminho. Sem hesitar, cortou a sua capa ao meio com a espada e deu-lhe metade. Nessa noite, diz a lenda, o tempo mudou: o sol voltou e os dias aqueceram por uns tempos — é o chamado "verão de São Martinho". O YoshiCat gosta de pensar que, algures naquela capa cortada, ainda havia lugar para uma castanha assada.' },
    { id: 'jeropiga', manual: true, titulo: 'A Jeropiga', texto: 'A jeropiga é um licor doce e antigo, feito juntando aguardente ao mosto de uva ainda a fermentar — tal como no Moscatel fortificado, mas de forma mais rápida e caseira. É tradição em muitas quintas portuguesas fazê-la por esta altura do ano, a tempo do magusto de São Martinho.' },
    { id: 'magusto', manual: true, imagem: 'assets/ecras/enciclopedia_magusto.jpg', titulo: 'O Magusto', texto: 'O magusto é a festa das castanhas assadas, celebrada por volta de São Martinho, a 11 de novembro. As famílias reúnem-se à volta da fogueira para assar castanhas e provar o vinho novo — e nem os porcos Fygmo e Fygmo2 resistem ao cheiro.' }
  ],
  en: [
    { id: 'origem', titulo: 'The Origins of Moscatel', texto: 'The elders of the Farm say that Setúbal Moscatel was born more than 500 years ago, when the first Moscatel Graúdo vine cuttings arrived on the peninsula from distant lands.' },
    { id: 'terroir', titulo: 'The Land of Arrábida', texto: "The Farm's vineyard grows in clay and limestone soils, facing west — the same exposure that makes Setúbal Moscatels so sweet and aromatic." },
    { id: 'secagem', titulo: 'Sun Before the Press', texto: 'After the harvest, the finest bunches are left to dry in the sun, concentrating their sugar before heading to the press. That care is what gives Moscatel its unmistakable perfume.' },
    { id: 'estagio', titulo: 'Aging in Oak Casks', texto: 'The secret of a good Moscatel is patience: the wine rests in oak casks for years, gaining notes of honey, dried fruit and raisins as it ages.' },
    { id: 'reconhecimento', titulo: 'A Wine Recognized Worldwide', texto: "Setúbal is one of the few regions in the world recognized for the exceptional quality of its moscatel wines, alongside names like Australia's Rutherglen." },
    { id: 'protecao', titulo: 'Caring for the Vineyard Every Day', texto: 'YoshiCat learned from the old vine-growers that protecting the vineyard matters as much as harvesting it — without daily care, not even the best soil makes good wine.' },
    { id: 'vindima', titulo: 'The Manual Harvest', texto: 'In the Setúbal Demarcated Region, the harvest is still done by hand: bunches are cut one by one and placed in baskets, so they arrive whole and undamaged at the press.' },
    { id: 'poda', titulo: 'Pruning the Vineyard', texto: 'In winter, while the vine rests, pruning takes place: excess branches are cut back so the plant channels its strength into the bunches that will grow next season.' },
    { id: 'aguardente', titulo: 'Wine Spirit Fortification', texto: "Moscatel is fortified by adding wine spirit (aguardente vínica) to the fermenting must. The alcohol halts the process and preserves the grape's natural sugar, giving the wine its characteristic sweetness." },
    { id: 'regiao', titulo: 'The Setúbal Demarcated Region', texto: 'The Setúbal Demarcated Region is one of the oldest denomination-of-origin regions in the world, created to protect and guarantee the authenticity of the wines produced on this peninsula.' },
    { id: 'repousoInverno', estacao: 'inverno', titulo: 'Vine Dormancy', texto: "In winter the vine loses its leaves and rests. The sap almost stops flowing, which is why this is the right time for pruning." },
    { id: 'choroVideira', estacao: 'primavera', titulo: "The Vine's Tears", texto: 'In March, after pruning, the vine "weeps": drops of sap seep from the cuts. It\'s the sign that it has woken from winter.' },
    { id: 'floracao', estacao: 'primavera', titulo: 'Flowering', texto: 'In May the vine produces tiny, greenish flowers, almost invisible. Each flower that sets becomes a grape berry.' },
    { id: 'pintor', estacao: 'verao', titulo: 'The Painter', texto: 'In July and August the berries soften and change colour. In Moscatel, they turn from green to gold.' },
    { id: 'epocaVindima', estacao: 'outono', titulo: 'The Harvest', texto: "This is when the grapes are picked, once they're perfectly sweet. In the Setúbal Peninsula, Moscatel is harvested from late summer into September." },
    { id: 'quedaFolha', estacao: 'outono', titulo: 'Leaf Fall', texto: 'In November the leaves turn yellow and fall, and the vine prepares to rest.' },
    { id: 'bagacoAlambique', manual: true, titulo: 'The Pomace and the Still', texto: "After the grapes are pressed, the pomace is left over: the skins and seeds. On a traditional farm, the pomace goes to the still, a copper kettle, where it's distilled into grape spirit. Nothing goes to waste." },
    { id: 'aguardenteAdega', manual: true, titulo: 'The Grape Spirit', texto: "In Setúbal Moscatel, grape spirit is added to the must to stop fermentation. This way the wine keeps part of the grape's natural sugar and turns out sweet and stronger." },
    { id: 'curtimenta', manual: true, titulo: 'Skin Contact Ageing', texto: 'Once fortified, the Moscatel stays in contact with the grape skins for months. This skin contact is what gives it its intense aroma.' },
    { id: 'lendaSaoMartinho', manual: true, titulo: 'The Legend of St. Martin', texto: 'They say Martin, a Roman soldier, was travelling on a bitterly cold day when he found a poor man shivering by the roadside. Without hesitating, he cut his cloak in half with his sword and gave him one part. That night, legend says, the weather changed: the sun came back and the days warmed up for a while — the origin of "St. Martin\'s summer" (an Indian summer). YoshiCat likes to think that somewhere in that cut cloak, there was still room for a roasted chestnut.' },
    { id: 'jeropiga', manual: true, titulo: 'Jeropiga', texto: 'Jeropiga is a sweet, old-fashioned liqueur made by adding grape spirit to grape must while it is still fermenting — much like fortified Moscatel, but quicker and more homemade. Many Portuguese farms make it around this time of year, in time for the St. Martin\'s chestnut roast.' },
    { id: 'magusto', manual: true, imagem: 'assets/ecras/enciclopedia_magusto.jpg', titulo: 'The Magusto', texto: "The magusto is the chestnut-roasting feast celebrated around St. Martin's Day, on 11 November. Families gather round the bonfire to roast chestnuts and taste the new wine — not even Fygmo and Fygmo2 can resist the smell." }
  ],
  es: [
    { id: 'origem', titulo: 'Los Orígenes del Moscatel', texto: 'Los más viejos de la Quinta cuentan que el Moscatel de Setúbal nació hace más de 500 años, cuando los primeros esquejes de Moscatel Graúdo llegaron a la península desde tierras lejanas.' },
    { id: 'terroir', titulo: 'La Tierra de Arrábida', texto: 'El viñedo de la Quinta crece en suelos de arcilla y caliza, orientado al poniente — la misma exposición que hace que los Moscateles de Setúbal sean tan dulces y aromáticos.' },
    { id: 'secagem', titulo: 'El Sol Antes del Lagar', texto: 'Después de la vendimia, los racimos más generosos se dejan secar al sol, concentrando el azúcar antes de pasar al lagar. Ese cuidado es lo que le da al Moscatel su perfume inconfundible.' },
    { id: 'estagio', titulo: 'La Crianza en Toneles de Roble', texto: 'El secreto de un buen Moscatel está en la paciencia: el vino reposa en toneles de roble durante años, ganando notas de miel, frutos secos y pasas a medida que envejece.' },
    { id: 'reconhecimento', titulo: 'Un Vino Reconocido en el Mundo', texto: 'Setúbal es una de las pocas regiones del mundo reconocida por la calidad excepcional de sus vinos moscatel, junto a nombres como el Rutherglen australiano.' },
    { id: 'protecao', titulo: 'Cuidar el Viñedo Todos los Días', texto: 'YoshiCat aprendió de los antiguos viticultores que proteger el viñedo es tan importante como cosecharlo — sin cuidado diario, ni la mejor tierra da buen vino.' },
    { id: 'vindima', titulo: 'La Vendimia Manual', texto: 'En la Región Demarcada de Setúbal, la vendimia todavía se hace a mano: los racimos se cortan uno a uno y se colocan en cestos, para llegar enteros e intactos al lagar.' },
    { id: 'poda', titulo: 'La Poda del Viñedo', texto: 'En invierno, con la vid en reposo, se hace la poda: se cortan las ramas en exceso para concentrar la fuerza de la planta en los racimos que nacerán en la próxima temporada.' },
    { id: 'aguardente', titulo: 'El Aguardiente Vínico', texto: 'La fortificación del Moscatel se hace añadiendo aguardiente vínico al mosto en fermentación. El alcohol detiene el proceso y preserva el azúcar natural de la uva, dando al vino su característico dulzor.' },
    { id: 'regiao', titulo: 'La Región Demarcada de Setúbal', texto: 'La Región Demarcada de Setúbal es una de las más antiguas del mundo con denominación de origen, creada para proteger y garantizar la autenticidad de los vinos producidos en esta península.' },
    { id: 'repousoInverno', estacao: 'inverno', titulo: 'El Reposo de la Vid', texto: 'En invierno la vid pierde las hojas y descansa. La savia casi deja de correr, y por eso es el momento adecuado para la poda.' },
    { id: 'choroVideira', estacao: 'primavera', titulo: 'El Lloro de la Vid', texto: 'En marzo, después de la poda, la vid "llora": gotean gotas de savia de los cortes. Es la señal de que ha despertado del invierno.' },
    { id: 'floracao', estacao: 'primavera', titulo: 'La Floración', texto: 'En mayo la vid da flores pequeñas y verdes, casi invisibles. De cada flor que cuaja nace una baya de uva.' },
    { id: 'pintor', estacao: 'verao', titulo: 'El Pintor', texto: 'En julio y agosto las bayas se ablandan y cambian de color. En el Moscatel, pasan de verde a dorado.' },
    { id: 'epocaVindima', estacao: 'outono', titulo: 'La Vendimia', texto: 'Es la recogida de las uvas, hecha cuando están dulces en su punto justo. En la Península de Setúbal, el Moscatel se vendimia entre el fin del verano y septiembre.' },
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

// HTML da pequena notícia "nova entrada desbloqueada", igual à do
// Explorar — usado pela Adega quando uma ação desbloqueia uma entrada.
function encyclopediaUnlockHtml(entrada) {
  if (!entrada) return '';
  return '<p class="game-subtitle" data-i18n="explorar.subtitleNova"></p>' +
    '<div class="story-box"><strong>' + entrada.titulo + '</strong><br><br>' + entrada.texto + '</div>';
}

function enterExplorar() {
  const container = document.getElementById('explorar-container');
  const bloqueadas = entradasBloqueadas();

  // Já sabe tudo o que existe, para sempre (mesmo contando as entradas
  // de estação que só aparecem 3 meses por ano).
  if (state.encyclopedia.unlocked.length >= encyclopediaEntries().length) {
    container.innerHTML =
      '<h2 data-i18n="explorar.title"></h2>' +
      '<div class="story-box" data-i18n="explorar.tudoDesbloqueado"></div>' +
      '<button class="btn btn-primary" onclick="goTo(\'enciclopedia\')" data-i18n="explorar.btnVerEnciclopedia"></button>';
    applyTranslations();
    return;
  }

  // Ainda há entradas por descobrir, mas nenhuma disponível nesta
  // estação — voltam a aparecer quando a estação certa chegar.
  if (bloqueadas.length === 0) {
    container.innerHTML =
      '<h2 data-i18n="explorar.title"></h2>' +
      '<div class="story-box" data-i18n="explorar.nadaNestaEstacao"></div>' +
      '<button class="btn btn-primary" onclick="goTo(\'enciclopedia\')" data-i18n="explorar.btnVerEnciclopedia"></button>';
    applyTranslations();
    return;
  }

  const nova = bloqueadas[randInt(0, bloqueadas.length - 1)];
  state.encyclopedia.unlocked.push(nova.id);
  state.conhecimento += 1;
  saveState(state);
  updateStatsDisplays();

  container.innerHTML =
    '<h2 data-i18n="explorar.title"></h2>' +
    '<p class="game-subtitle" data-i18n="explorar.subtitleNova"></p>' +
    '<div class="story-box"><strong>' + nova.titulo + '</strong><br><br>' + nova.texto + '</div>' +
    '<button class="btn btn-primary" onclick="goTo(\'enciclopedia\')" data-i18n="explorar.btnVerEnciclopedia"></button>';

  applyTranslations();
}

function renderEnciclopedia() {
  const container = document.getElementById('enciclopedia-container');
  const entradas = encyclopediaEntries();

  const cardsHtml = entradas.map(function (e) {
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
    '<h2 data-i18n="enciclopedia.title"></h2>' +
    '<p class="info-text">' + state.encyclopedia.unlocked.length + ' / ' + entradas.length + '</p>' +
    '<div class="encyclopedia-grid">' + cardsHtml + '</div>';

  applyTranslations();
}
