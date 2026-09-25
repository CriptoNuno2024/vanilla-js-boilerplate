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
    { id: 'quedaFolha', estacao: 'outono', titulo: 'A Queda da Folha', texto: 'Em novembro as folhas amarelam e caem, e a videira prepara-se para descansar.' }
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
    { id: 'quedaFolha', estacao: 'outono', titulo: 'Leaf Fall', texto: 'In November the leaves turn yellow and fall, and the vine prepares to rest.' }
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
    { id: 'quedaFolha', estacao: 'outono', titulo: 'La Caída de la Hoja', texto: 'En noviembre las hojas amarillean y caen, y la vid se prepara para descansar.' }
  ]
};

// As entradas são guardadas por id (independente da língua), para que
// o progresso desbloqueado se mantenha ao trocar de idioma.
function encyclopediaEntries() {
  return ENCYCLOPEDIA_ENTRIES[currentLang] || ENCYCLOPEDIA_ENTRIES.pt;
}

// Entradas ainda por desbloquear E disponíveis AGORA (uma entrada com
// estação própria só entra nesta lista durante a sua estação — ver
// Parte D das estações do ano).
function entradasBloqueadas() {
  const estacao = estacaoAtual();
  return encyclopediaEntries().filter(function (e) {
    if (state.encyclopedia.unlocked.indexOf(e.id) !== -1) return false;
    if (e.estacao && e.estacao !== estacao) return false;
    return true;
  });
}

function tituloEspecialDesbloqueado() {
  return state.encyclopedia.unlocked.length >= encyclopediaEntries().length;
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
      return '<div class="encyclopedia-card"><h3>' + e.titulo + '</h3><p>' + e.texto + '</p></div>';
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
