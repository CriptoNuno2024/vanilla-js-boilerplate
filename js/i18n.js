// ---------------------------------------------------------------------
// TRADUÇÃO DA INTERFACE (Português / English / Español)
//
// Só a estrutura principal do jogo é traduzida (títulos de ecrãs, nomes
// de botões, nomes dos recursos). As histórias da Enciclopédia e as
// frases de "flavor text" da Vinha mantêm-se em português.
//
// O "Proteger a Quinta" não é traduzido por pedido explícito de manter
// esse ecrã exatamente como está (o seu conteúdo é gerado sem
// atributos data-i18n).
// ---------------------------------------------------------------------

const TRANSLATIONS = {
  pt: {
    'home.title': 'YoshiCat e a Quinta do Moscatel',
    'home.subtitle': 'Protege a vinha. Faz o melhor Moscatel.',
    'home.btnEntrar': 'Entrar na Quinta',
    'home.btnLingua': 'Escolher Língua',

    'hub.title': 'A Quinta do Moscatel',
    'hub.btnVinha': '🌱 Tratar a Vinha',
    'hub.btnProteger': '🛡️ Proteger a Quinta',
    'hub.btnGarrafa': '🍾 Criar Garrafa',
    'hub.btnExplorar': '📖 Explorar',
    'hub.btnPerfil': '👤 Perfil',
    'hub.btnSair': '⬅ Sair da Quinta',

    'nav.voltarQuinta': '⬅ Voltar à Quinta',
    'nav.voltar': '⬅ Voltar',

    'stat.uvas': 'Uvas',
    'stat.gotas': 'Gotas',
    'stat.reputacao': 'Reputação',
    'stat.garrafas': 'Garrafas',
    'stat.conhecimento': 'Conhecimento',

    'vinha.title': 'A Vinha',
    'vinha.recursoResiduos': 'Resíduos',
    'vinha.recursoAdubo': 'Adubo',
    'vinha.cuidadoLabel': 'Cuidado',
    'vinha.btnCavar': 'Cavar a Terra',
    'vinha.btnErvas': 'Eliminar Ervas Daninhas',
    'vinha.btnPlantar': 'Plantar',
    'vinha.btnRegar': 'Regar',
    'vinha.btnAdubar': 'Adubar',
    'vinha.btnCompostar': 'Compostagem',
    'vinha.btnColher': 'Colher (Vindima)',
    'vinha.fase.preparar.nome': 'Terra por preparar',
    'vinha.fase.preparar.desc': 'A terra está em pousio, pronta a ser revolvida antes de uma nova plantação.',
    'vinha.fase.preparada.nome': 'Terra preparada',
    'vinha.fase.preparada.desc': 'O solo foi cavado e arejado. É hora de limpar ervas e plantar novos bacelos.',
    'vinha.fase.crescendo.nome': 'Plantada, a crescer',
    'vinha.fase.crescendo.desc': 'Os bacelos estão a crescer. Rega, aduba e protege as videiras até estarem prontas.',
    'vinha.fase.pronta.nome': 'Pronta para a vindima',
    'vinha.fase.pronta.desc': 'Os cachos estão maduros e doces. Está na hora da vindima.',
    'vinha.msgCooldown': 'Ainda não podes fazer isso. Tenta novamente daqui a {tempo}.',
    'vinha.msgPrecisaAdubo': 'Precisas de Adubo Orgânico. Usa a Compostagem para o produzir.',
    'vinha.msgFaltamResiduos': 'Ainda não tens Resíduos Orgânicos suficientes.',

    // Poda (tarefa extra, só no inverno — ver REGRAS_PODA em js/vinha.js)
    'vinha.btnPodar': 'Podar',
    'vinha.podaJaFeita': 'já feita',
    'vinha.msgPodaPrecisaPlantada': 'Ainda não há nada plantado para podar. Planta primeiro a vinha.',
    'vinha.bonusPodaAtivo': 'Vinha podada: próxima vindima +{pct}% uvas',

    // Estações do ano — vantagens junto aos botões (Parte A)
    'vinha.bonusCuidado': '(+50% cuidado)',
    'vinha.bonusAdubo': '(+50% adubo)',
    'vinha.bonusColheita': '(+50% uvas e reputação)',

    // Estações do ano — dicas próprias de cada ação com vantagem
    'vinha.dica.plantar.primavera': 'É primavera, a altura certa para plantar: os novos bacelos de Moscatel Graúdo pegam com mais força nesta estação.',
    'vinha.dica.ervas.primavera': 'Na primavera as ervas daninhas crescem depressa — arrancá-las agora dá um impulso extra às videiras.',
    'vinha.dica.regar.verao': 'No calor do verão, a água é ainda mais preciosa: a vinha da Arrábida agradece cada rega.',
    'vinha.dica.colher.outono': 'É outono, mês da vindima: os cachos maduros de Moscatel são colhidos à mão, cacho a cacho.',
    'vinha.dica.compostagem.inverno': 'No inverno, os resíduos da poda enchem o composto: uma boa altura para transformá-los em adubo rico.',

    // Estações do ano — a fase verdadeira da videira (Parte B)
    'vinha.faseRealLabel': 'Na vinha real, agora:',
    'vinha.faseReal.repouso': 'repouso — a videira descansa e é tempo de poda',
    'vinha.faseReal.choro': 'o choro — a videira acorda e pinga seiva',
    'vinha.faseReal.rebentacao': 'a rebentação — nascem os primeiros rebentos e folhas',
    'vinha.faseReal.floracao': 'a floração — a videira dá pequenas flores',
    'vinha.faseReal.vingamento': 'o vingamento — as flores dão lugar aos bagos',
    'vinha.faseReal.pintor': 'o pintor — os bagos amolecem e ganham cor',
    'vinha.faseReal.vindima': 'a vindima — as uvas estão doces e prontas',
    'vinha.faseReal.fimVindima': 'fim da vindima — as folhas começam a amarelar',
    'vinha.faseReal.quedaFolha': 'a queda da folha — a videira prepara-se para descansar',

    'garrafa.msgGotasInsuficientes': 'Ainda não tens Gotas de Moscatel suficientes. Precisas de 100.',

    // Estações do ano — nome e frase curta de cada uma (Parte A)
    'estacao.inverno': 'Inverno',
    'estacao.primavera': 'Primavera',
    'estacao.verao': 'Verão',
    'estacao.outono': 'Outono',
    'estacao.frase.inverno': 'tempo de poda',
    'estacao.frase.primavera': 'a vinha desperta',
    'estacao.frase.verao': 'os bagos ganham cor',
    'estacao.frase.outono': 'época de vindima',

    'explorar.title': 'Explorar',
    'explorar.subtitleNova': 'Nova entrada desbloqueada!',
    'explorar.tudoDesbloqueado': 'Já desbloqueaste todo o conhecimento sobre o Moscatel de Setúbal!',
    'explorar.nadaNestaEstacao': 'Já sabes tudo o que esta estação tem para ensinar. Volta noutra altura do ano para descobrires mais.',
    'explorar.btnVerEnciclopedia': 'Ver Enciclopédia',

    'enciclopedia.title': 'Enciclopédia do Moscatel',
    'enciclopedia.bloqueado': 'Por desbloquear.',

    'garrafa.title': 'Criar Garrafa',
    'garrafa.descricao': 'São precisas 100 Gotas de Moscatel para criar 1 Garrafa (+30 Reputação).',
    'garrafa.btnCriar': 'Criar Garrafa',
    'garrafa.btnSeguinte': 'Seguinte',
    'garrafa.btnContinuar': 'Continuar',
    'garrafa.resultadoTitulo': 'Garrafa Criada!',
    'garrafa.passo1': 'As uvas de Moscatel são prensadas à mão, e o mosto doce e perfumado começa a escorrer da prensa.',
    'garrafa.passo2': 'A fermentação é interrompida com aguardente vínica, preservando a doçura natural. O mosto é mexido para que as películas fiquem em contacto — a maceração pelicular liberta os aromas florais e frutados do Moscatel.',
    'garrafa.passo3': 'O vinho repousa em barris de madeira, onde ganha, com o tempo, cor âmbar e notas de mel e frutos secos.',
    'garrafa.passo4': 'O vinho é finalmente engarrafado, pronto para continuar a evoluir e revelar todo o seu carácter.',

    // A Adega (capítulo novo, dentro de "Criar Garrafa")
    'adega.recursoBagaco': 'Bagaço',
    'adega.recursoAguardente': 'Aguardente',
    'adega.btnPrensar': 'Prensar',
    'adega.btnAlambique': 'Alambique',
    'adega.btnFortificar': 'Fortificar',
    'adega.btnEngarrafar': 'Engarrafar',
    'adega.flavorAlambique': 'O bagaço vai ao alambique de cobre e, lentamente, transforma-se em aguardente.',
    'adega.caveTitulo': 'Descansar na Cave',
    'adega.caveDescansado': 'Já descansou: {tempo}',
    'adega.caveReputacaoPrevista': 'Reputação se engarrafares agora: +{valor}',
    'adega.msgFaltaUvasPrensar': 'Precisas de pelo menos {n} Uvas para prensar.',
    'adega.msgFaltaBagacoAlambique': 'Precisas de pelo menos {n} de Bagaço para o alambique.',
    'adega.msgFaltaFortificar': 'Precisas de 100 Gotas de Moscatel e 1 Aguardente para fortificar.',
    'adega.msgJaHaLote': 'Já tens um lote a descansar na Cave. Tens de o engarrafar primeiro.',
    'adega.msgAindaNaoPode': 'O vinho ainda precisa de descansar pelo menos {dias} dia(s).',
    'adega.resultadoPrensar': '+{gotas} Gotas de Moscatel, +{bagaco} Bagaço',
    'adega.resultadoAlambique': '+1 Aguardente',
    'adega.resultadoFortificar': 'O lote começou a descansar na Cave.',
    'adega.resultadoEngarrafar': '+1 Garrafa, +{rep} Reputação',

    'perfil.title': 'Perfil',
    'perfil.galeriaTitulo': 'Garrafas de Moscatel',
    'perfil.btnEnciclopedia': 'Ver Enciclopédia',
    'perfil.titulo.guardiao': 'Guardião da História do Moscatel',
    'perfil.semGarrafas': 'Ainda não criaste nenhuma garrafa.',
    'perfil.ultimaLabel': 'última',

    'lingua.title': 'Escolher Língua',
    'lingua.subtitle': 'Escolhe o idioma da interface.',
    'lingua.pt': '🇵🇹 Português',
    'lingua.en': '🇬🇧 English',
    'lingua.es': '🇪🇸 Español',
    'lingua.confirmado': 'Idioma alterado.'
  },

  en: {
    'home.title': 'YoshiCat and the Moscatel Farm',
    'home.subtitle': 'Protect the vineyard. Make the best Moscatel.',
    'home.btnEntrar': 'Enter the Farm',
    'home.btnLingua': 'Choose Language',

    'hub.title': 'The Moscatel Farm',
    'hub.btnVinha': '🌱 Tend the Vineyard',
    'hub.btnProteger': '🛡️ Protect the Farm',
    'hub.btnGarrafa': '🍾 Make a Bottle',
    'hub.btnExplorar': '📖 Explore',
    'hub.btnPerfil': '👤 Profile',
    'hub.btnSair': '⬅ Leave the Farm',

    'nav.voltarQuinta': '⬅ Back to the Farm',
    'nav.voltar': '⬅ Back',

    'stat.uvas': 'Grapes',
    'stat.gotas': 'Drops',
    'stat.reputacao': 'Reputation',
    'stat.garrafas': 'Bottles',
    'stat.conhecimento': 'Knowledge',

    'vinha.title': 'The Vineyard',
    'vinha.recursoResiduos': 'Organic Waste',
    'vinha.recursoAdubo': 'Compost',
    'vinha.cuidadoLabel': 'Care',
    'vinha.btnCavar': 'Till the Soil',
    'vinha.btnErvas': 'Remove Weeds',
    'vinha.btnPlantar': 'Plant',
    'vinha.btnRegar': 'Water',
    'vinha.btnAdubar': 'Fertilize',
    'vinha.btnCompostar': 'Composting',
    'vinha.btnColher': 'Harvest',
    'vinha.fase.preparar.nome': 'Soil not yet prepared',
    'vinha.fase.preparar.desc': 'The land lies fallow, ready to be tilled before a new planting.',
    'vinha.fase.preparada.nome': 'Soil prepared',
    'vinha.fase.preparada.desc': 'The soil has been tilled and aerated. Time to clear weeds and plant new vines.',
    'vinha.fase.crescendo.nome': 'Planted, growing',
    'vinha.fase.crescendo.desc': 'The vines are growing. Water, fertilize and protect them until they are ready.',
    'vinha.fase.pronta.nome': 'Ready for harvest',
    'vinha.fase.pronta.desc': "The bunches are ripe and sweet. It's time to harvest.",
    'vinha.msgCooldown': "You can't do that yet. Try again in {tempo}.",
    'vinha.msgPrecisaAdubo': 'You need Compost. Use Composting to produce it.',
    'vinha.msgFaltamResiduos': "You don't have enough Organic Waste yet.",

    'vinha.btnPodar': 'Prune',
    'vinha.podaJaFeita': 'already done',
    'vinha.msgPodaPrecisaPlantada': "There's nothing planted yet to prune. Plant the vineyard first.",
    'vinha.bonusPodaAtivo': 'Vineyard pruned: next harvest +{pct}% grapes',

    'vinha.bonusCuidado': '(+50% care)',
    'vinha.bonusAdubo': '(+50% compost)',
    'vinha.bonusColheita': '(+50% grapes and reputation)',

    'vinha.dica.plantar.primavera': "It's spring, the right time to plant: young Moscatel Graúdo vine cuttings take root more easily this season.",
    'vinha.dica.ervas.primavera': 'In spring weeds grow fast — pulling them now gives the vines an extra boost.',
    'vinha.dica.regar.verao': 'In the summer heat, water is even more precious: the Arrábida vineyard is grateful for every watering.',
    'vinha.dica.colher.outono': "It's autumn, harvest time: the ripe Moscatel bunches are picked by hand, one by one.",
    'vinha.dica.compostagem.inverno': 'In winter, pruning waste fills up the compost — a good time to turn it into rich fertiliser.',

    'vinha.faseRealLabel': 'Right now, in the real vineyard:',
    'vinha.faseReal.repouso': "dormancy — the vine rests, and it's pruning time",
    'vinha.faseReal.choro': 'the weeping — the vine wakes up and drips sap',
    'vinha.faseReal.rebentacao': 'budbreak — the first shoots and leaves appear',
    'vinha.faseReal.floracao': 'flowering — the vine produces small flowers',
    'vinha.faseReal.vingamento': 'fruit set — the flowers give way to berries',
    'vinha.faseReal.pintor': 'véraison — the berries soften and take on colour',
    'vinha.faseReal.vindima': 'harvest time — the grapes are sweet and ready',
    'vinha.faseReal.fimVindima': 'end of harvest — the leaves start to turn yellow',
    'vinha.faseReal.quedaFolha': 'leaf fall — the vine prepares to rest',

    'garrafa.msgGotasInsuficientes': "You don't have enough Moscatel Drops yet. You need 100.",

    'estacao.inverno': 'Winter',
    'estacao.primavera': 'Spring',
    'estacao.verao': 'Summer',
    'estacao.outono': 'Autumn',
    'estacao.frase.inverno': 'pruning time',
    'estacao.frase.primavera': 'the vineyard awakens',
    'estacao.frase.verao': 'the berries take on colour',
    'estacao.frase.outono': 'harvest time',

    'explorar.title': 'Explore',
    'explorar.subtitleNova': 'New entry unlocked!',
    'explorar.tudoDesbloqueado': "You've unlocked all the knowledge about Setúbal Moscatel!",
    'explorar.nadaNestaEstacao': "You already know everything this season has to teach. Come back at another time of year to discover more.",
    'explorar.btnVerEnciclopedia': 'View Encyclopedia',

    'enciclopedia.title': 'Moscatel Encyclopedia',
    'enciclopedia.bloqueado': 'Not yet unlocked.',

    'garrafa.title': 'Make a Bottle',
    'garrafa.descricao': 'You need 100 Moscatel Drops to make 1 Bottle (+30 Reputation).',
    'garrafa.btnCriar': 'Make a Bottle',
    'garrafa.btnSeguinte': 'Next',
    'garrafa.btnContinuar': 'Continue',
    'garrafa.resultadoTitulo': 'Bottle Made!',
    'garrafa.passo1': 'The Moscatel grapes are pressed by hand, and the sweet, fragrant must starts to flow from the press.',
    'garrafa.passo2': 'Fermentation is stopped with grape brandy, preserving the natural sweetness. The must is stirred to keep the skins in contact — skin maceration releases the floral and fruity aromas of Moscatel.',
    'garrafa.passo3': 'The wine rests in wooden barrels, where over time it takes on an amber colour and notes of honey and dried fruit.',
    'garrafa.passo4': 'The wine is finally bottled, ready to keep evolving and reveal its full character.',

    'adega.recursoBagaco': 'Pomace',
    'adega.recursoAguardente': 'Brandy',
    'adega.btnPrensar': 'Press',
    'adega.btnAlambique': 'Still',
    'adega.btnFortificar': 'Fortify',
    'adega.btnEngarrafar': 'Bottle',
    'adega.flavorAlambique': 'The pomace goes into the copper still and slowly turns into grape brandy.',
    'adega.caveTitulo': 'Resting in the Cellar',
    'adega.caveDescansado': 'Rested so far: {tempo}',
    'adega.caveReputacaoPrevista': 'Reputation if bottled now: +{valor}',
    'adega.msgFaltaUvasPrensar': 'You need at least {n} Grapes to press.',
    'adega.msgFaltaBagacoAlambique': 'You need at least {n} Pomace for the still.',
    'adega.msgFaltaFortificar': 'You need 100 Moscatel Drops and 1 Brandy to fortify.',
    'adega.msgJaHaLote': 'You already have a batch resting in the cellar. Bottle it first.',
    'adega.msgAindaNaoPode': 'The wine still needs to rest at least {dias} day(s).',
    'adega.resultadoPrensar': '+{gotas} Moscatel Drops, +{bagaco} Pomace',
    'adega.resultadoAlambique': '+1 Brandy',
    'adega.resultadoFortificar': 'The batch has started resting in the cellar.',
    'adega.resultadoEngarrafar': '+1 Bottle, +{rep} Reputation',

    'perfil.title': 'Profile',
    'perfil.galeriaTitulo': 'Moscatel Bottles',
    'perfil.btnEnciclopedia': 'View Encyclopedia',
    'perfil.titulo.guardiao': 'Guardian of Moscatel History',
    'perfil.semGarrafas': "You haven't made any bottles yet.",
    'perfil.ultimaLabel': 'latest',

    'lingua.title': 'Choose Language',
    'lingua.subtitle': 'Choose the interface language.',
    'lingua.pt': '🇵🇹 Português',
    'lingua.en': '🇬🇧 English',
    'lingua.es': '🇪🇸 Español',
    'lingua.confirmado': 'Language changed.'
  },

  es: {
    'home.title': 'YoshiCat y la Quinta del Moscatel',
    'home.subtitle': 'Protege el viñedo. Haz el mejor Moscatel.',
    'home.btnEntrar': 'Entrar en la Quinta',
    'home.btnLingua': 'Elegir Idioma',

    'hub.title': 'La Quinta del Moscatel',
    'hub.btnVinha': '🌱 Cuidar el Viñedo',
    'hub.btnProteger': '🛡️ Proteger la Quinta',
    'hub.btnGarrafa': '🍾 Crear Botella',
    'hub.btnExplorar': '📖 Explorar',
    'hub.btnPerfil': '👤 Perfil',
    'hub.btnSair': '⬅ Salir de la Quinta',

    'nav.voltarQuinta': '⬅ Volver a la Quinta',
    'nav.voltar': '⬅ Volver',

    'stat.uvas': 'Uvas',
    'stat.gotas': 'Gotas',
    'stat.reputacao': 'Reputación',
    'stat.garrafas': 'Botellas',
    'stat.conhecimento': 'Conocimiento',

    'vinha.title': 'El Viñedo',
    'vinha.recursoResiduos': 'Residuos',
    'vinha.recursoAdubo': 'Abono',
    'vinha.cuidadoLabel': 'Cuidado',
    'vinha.btnCavar': 'Cavar la Tierra',
    'vinha.btnErvas': 'Eliminar Malas Hierbas',
    'vinha.btnPlantar': 'Plantar',
    'vinha.btnRegar': 'Regar',
    'vinha.btnAdubar': 'Abonar',
    'vinha.btnCompostar': 'Compostaje',
    'vinha.btnColher': 'Cosechar (Vendimia)',
    'vinha.fase.preparar.nome': 'Tierra sin preparar',
    'vinha.fase.preparar.desc': 'La tierra está en barbecho, lista para ser removida antes de una nueva plantación.',
    'vinha.fase.preparada.nome': 'Tierra preparada',
    'vinha.fase.preparada.desc': 'El suelo ha sido removido y aireado. Es hora de limpiar malas hierbas y plantar nuevos esquejes.',
    'vinha.fase.crescendo.nome': 'Plantada, creciendo',
    'vinha.fase.crescendo.desc': 'Las vides están creciendo. Riega, abona y protégelas hasta que estén listas.',
    'vinha.fase.pronta.nome': 'Lista para la vendimia',
    'vinha.fase.pronta.desc': 'Los racimos están maduros y dulces. Es hora de la vendimia.',
    'vinha.msgCooldown': 'Todavía no puedes hacer eso. Vuelve a intentarlo dentro de {tempo}.',
    'vinha.msgPrecisaAdubo': 'Necesitas Abono. Usa el Compostaje para producirlo.',
    'vinha.msgFaltamResiduos': 'Todavía no tienes suficientes Residuos.',

    'vinha.btnPodar': 'Podar',
    'vinha.podaJaFeita': 'ya hecha',
    'vinha.msgPodaPrecisaPlantada': 'Todavía no hay nada plantado para podar. Planta primero el viñedo.',
    'vinha.bonusPodaAtivo': 'Viñedo podado: la próxima vendimia +{pct}% uvas',

    'vinha.bonusCuidado': '(+50% cuidado)',
    'vinha.bonusAdubo': '(+50% abono)',
    'vinha.bonusColheita': '(+50% uvas y reputación)',

    'vinha.dica.plantar.primavera': 'Es primavera, el momento adecuado para plantar: los nuevos esquejes de Moscatel Graúdo arraigan con más fuerza en esta estación.',
    'vinha.dica.ervas.primavera': 'En primavera las malas hierbas crecen deprisa: arrancarlas ahora da un impulso extra a las vides.',
    'vinha.dica.regar.verao': 'En el calor del verano, el agua es aún más preciosa: el viñedo de Arrábida agradece cada riego.',
    'vinha.dica.colher.outono': 'Es otoño, mes de la vendimia: los racimos maduros de Moscatel se recogen a mano, uno a uno.',
    'vinha.dica.compostagem.inverno': 'En invierno, los residuos de la poda llenan el compost: un buen momento para convertirlos en abono rico.',

    'vinha.faseRealLabel': 'Ahora mismo, en el viñedo real:',
    'vinha.faseReal.repouso': 'reposo — la vid descansa y es tiempo de poda',
    'vinha.faseReal.choro': 'el lloro — la vid despierta y gotea savia',
    'vinha.faseReal.rebentacao': 'la brotación — nacen los primeros brotes y hojas',
    'vinha.faseReal.floracao': 'la floración — la vid da pequeñas flores',
    'vinha.faseReal.vingamento': 'el cuajado — las flores dan paso a las bayas',
    'vinha.faseReal.pintor': 'el envero — las bayas se ablandan y cogen color',
    'vinha.faseReal.vindima': 'la vendimia — las uvas están dulces y listas',
    'vinha.faseReal.fimVindima': 'fin de la vendimia — las hojas empiezan a amarillear',
    'vinha.faseReal.quedaFolha': 'la caída de la hoja — la vid se prepara para descansar',

    'garrafa.msgGotasInsuficientes': 'Todavía no tienes suficientes Gotas de Moscatel. Necesitas 100.',

    'estacao.inverno': 'Invierno',
    'estacao.primavera': 'Primavera',
    'estacao.verao': 'Verano',
    'estacao.outono': 'Otoño',
    'estacao.frase.inverno': 'tiempo de poda',
    'estacao.frase.primavera': 'el viñedo despierta',
    'estacao.frase.verao': 'las bayas cogen color',
    'estacao.frase.outono': 'época de vendimia',

    'explorar.title': 'Explorar',
    'explorar.subtitleNova': '¡Nueva entrada desbloqueada!',
    'explorar.tudoDesbloqueado': '¡Ya has desbloqueado todo el conocimiento sobre el Moscatel de Setúbal!',
    'explorar.nadaNestaEstacao': 'Ya sabes todo lo que esta estación tiene para enseñar. Vuelve en otra época del año para descubrir más.',
    'explorar.btnVerEnciclopedia': 'Ver Enciclopedia',

    'enciclopedia.title': 'Enciclopedia del Moscatel',
    'enciclopedia.bloqueado': 'Por desbloquear.',

    'garrafa.title': 'Crear Botella',
    'garrafa.descricao': 'Se necesitan 100 Gotas de Moscatel para crear 1 Botella (+30 Reputación).',
    'garrafa.btnCriar': 'Crear Botella',
    'garrafa.btnSeguinte': 'Siguiente',
    'garrafa.btnContinuar': 'Continuar',
    'garrafa.resultadoTitulo': '¡Botella Creada!',
    'garrafa.passo1': 'Las uvas de Moscatel se prensan a mano, y el mosto dulce y perfumado empieza a brotar de la prensa.',
    'garrafa.passo2': 'La fermentación se detiene con aguardiente vínico, conservando el dulzor natural. El mosto se remueve para que los hollejos sigan en contacto: la maceración pelicular libera los aromas florales y afrutados del Moscatel.',
    'garrafa.passo3': 'El vino reposa en barricas de madera, donde con el tiempo adquiere un color ámbar y notas de miel y frutos secos.',
    'garrafa.passo4': 'El vino se embotella por fin, listo para seguir evolucionando y revelar todo su carácter.',

    'adega.recursoBagaco': 'Orujo',
    'adega.recursoAguardente': 'Aguardiente',
    'adega.btnPrensar': 'Prensar',
    'adega.btnAlambique': 'Alambique',
    'adega.btnFortificar': 'Fortificar',
    'adega.btnEngarrafar': 'Embotellar',
    'adega.flavorAlambique': 'El orujo va al alambique de cobre y, lentamente, se transforma en aguardiente.',
    'adega.caveTitulo': 'Reposar en la Bodega',
    'adega.caveDescansado': 'Ya ha reposado: {tempo}',
    'adega.caveReputacaoPrevista': 'Reputación si embotellas ahora: +{valor}',
    'adega.msgFaltaUvasPrensar': 'Necesitas al menos {n} Uvas para prensar.',
    'adega.msgFaltaBagacoAlambique': 'Necesitas al menos {n} de Orujo para el alambique.',
    'adega.msgFaltaFortificar': 'Necesitas 100 Gotas de Moscatel y 1 Aguardiente para fortificar.',
    'adega.msgJaHaLote': 'Ya tienes un lote reposando en la Bodega. Tienes que embotellarlo primero.',
    'adega.msgAindaNaoPode': 'El vino todavía necesita reposar al menos {dias} día(s).',
    'adega.resultadoPrensar': '+{gotas} Gotas de Moscatel, +{bagaco} Orujo',
    'adega.resultadoAlambique': '+1 Aguardiente',
    'adega.resultadoFortificar': 'El lote ha empezado a reposar en la Bodega.',
    'adega.resultadoEngarrafar': '+1 Botella, +{rep} Reputación',

    'perfil.title': 'Perfil',
    'perfil.galeriaTitulo': 'Botellas de Moscatel',
    'perfil.btnEnciclopedia': 'Ver Enciclopedia',
    'perfil.titulo.guardiao': 'Guardián de la Historia del Moscatel',
    'perfil.semGarrafas': 'Todavía no has creado ninguna botella.',
    'perfil.ultimaLabel': 'última',

    'lingua.title': 'Elegir Idioma',
    'lingua.subtitle': 'Elige el idioma de la interfaz.',
    'lingua.pt': '🇵🇹 Português',
    'lingua.en': '🇬🇧 English',
    'lingua.es': '🇪🇸 Español',
    'lingua.confirmado': 'Idioma cambiado.'
  }
};

let currentLang = (state.lang && TRANSLATIONS[state.lang]) ? state.lang : 'pt';

function t(key) {
  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.pt;
  return dict[key] !== undefined ? dict[key] : (TRANSLATIONS.pt[key] !== undefined ? TRANSLATIONS.pt[key] : key);
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
}

const LOCALE_DO_IDIOMA = { pt: 'pt-PT', en: 'en-GB', es: 'es-ES' };

function localeAtual() {
  return LOCALE_DO_IDIOMA[currentLang] || 'pt-PT';
}

function setLanguage(lang) {
  if (!TRANSLATIONS[lang]) return;
  currentLang = lang;
  state.lang = lang;
  saveState(state);
  applyTranslations();
}

function selecionarLingua(lang) {
  setLanguage(lang);
  showMessage(t('lingua.confirmado'));
  goTo('home');
}

function renderLinguaScreen() {
  applyTranslations();
}
