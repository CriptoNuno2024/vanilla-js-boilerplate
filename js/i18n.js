// ---------------------------------------------------------------------
// TRADUÇÃO DA INTERFACE (Português / English / Español)
//
// Só a estrutura principal do jogo é traduzida (títulos de ecrãs, nomes
// de botões, nomes dos recursos, incluindo as frases de "flavor text"
// da Vinha — ver vinha.dica.*). As histórias da Enciclopédia mantêm-se
// em português.
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
    'hub.btnPerfil': '👤 Perfil',
    'hub.btnSair': '⬅ Sair da Quinta',

    'nav.voltarQuinta': '⬅ Voltar à Quinta',
    'nav.voltar': '⬅ Voltar',

    // Barra de navegação de baixo (só na Quinta e na Vinha, por agora)
    'topbar.perfil': 'Perfil',
    'nav.vinha': 'Vinha',
    'nav.proteger': 'Proteger',
    'nav.quinta': 'Quinta',
    'nav.adega': 'Adega',
    'nav.explorar': 'Explorar',
    'vinha.verMaisTarefas': 'Ver mais trabalhos',

    'stat.uvas': 'Uvas',
    'stat.gotas': 'Gotas',
    'stat.reputacao': 'Reputação',
    'stat.garrafas': 'Garrafas',
    'stat.conhecimento': 'Conhecimento',

    // Níveis da Quinta (ver js/niveis.js) — calculados a partir da
    // Reputação total.
    'nivel.label': 'Nível',
    'nivel.proximoLabel': 'Próximo:',
    'nivel.maximo': 'Nível máximo atingido!',
    'nivel.subiuMsg': 'Subiste ao Nível {n} · {nome}!',
    'nivel.nome.1': 'Quinta Esquecida',
    'nivel.nome.2': 'Quinta Vigiada',
    'nivel.nome.3': 'Quinta Produtora',
    'nivel.nome.4': 'Quinta Conhecida',
    'nivel.nome.5': 'Quinta Afamada',
    'nivel.nome.6': 'Casa do Moscatel',

    // "Hoje na Quinta" — 3 objetivos diários (ver js/objetivos.js).
    'objetivos.titulo': 'Hoje na Quinta',
    'objetivos.resumoLabel': 'Hoje',
    'objetivos.bonusLinha': 'Completar os 3 dá +{bonus} Reputação e +1 selo do dia.',
    'objetivos.selosLabel': 'Selos:',
    'objetivo.vinha_cavar': 'Cava a terra da Vinha.',
    'objetivo.vinha_plantar': 'Planta novos bacelos na Vinha.',
    'objetivo.vinha_ervas': 'Arranca as ervas daninhas da Vinha.',
    'objetivo.vinha_regar': 'Rega a Vinha.',
    'objetivo.vinha_adubar': 'Aduba a Vinha.',
    'objetivo.vinha_compostagem': 'Faz Compostagem na Vinha.',
    'objetivo.vinha_colher': 'Colhe a Vinha.',
    'objetivo.adega_prensar': 'Prensa Uvas na Adega.',
    'objetivo.adega_alambique': 'Usa o Alambique na Adega.',
    'objetivo.adega_fortificar': 'Fortifica um lote na Adega.',
    'objetivo.adega_engarrafar': 'Engarrafa o vinho da Cave.',
    'objetivo.proteger_vencer': 'Vence um desafio em Proteger a Quinta.',
    'objetivo.explorar_descobrir': 'Descobre uma entrada nova em Explorar.',
    'objetivo.festa_tarefa': 'Completa uma tarefa da festa de hoje.',
    'objetivo.tempo_chuva': 'Aproveita a chuva de hoje para regar a Vinha.',
    'objetivo.tempo_vento': 'Repara as estacas por causa do vento forte.',
    'objetivo.tempo_frio': 'Protege a Vinha do frio forte de hoje.',

    // Limite diário de prémios no Proteger (ver js/proteger.js).
    'proteger.modoTreino': 'O Chizo já está de guarda. Volta amanhã para mais prémios!',
    'proteger.modoTreinoResultado': 'Sem prémio — modo treino.',

    // Áreas por Nível (ver js/niveis.js) e "Primeiros Passos" na Vinha
    // (ver js/vinha.js).
    'acesso.trancado': 'Abre no Nível {n} · {nome} — faltam {faltam} de Reputação.',
    'vinha.primeiroPassoMsg': 'Primeiros passos na Vinha! (+{n} Reputação)',
    'vinha.subiuNivelAviso': 'A Quinta subiu de nível! Volta à Quinta.',

    // A história da Quinta (ver js/historia.js) — contada nos balões à
    // medida que se sobe de nível. Só jogadores novos a veem "ao vivo".
    'historia.intro.1': 'A Quinta do Moscatel está esquecida há muitos anos. O mato tomou conta dos caminhos e as videiras crescem sozinhas.',
    'historia.intro.2': 'Sou o YoshiCat. Vim devolver a vida a esta Quinta. Vou começar pela Vinha.',
    'historia.nivel2.1': 'Esta noite ouviram-se grunhidos entre as videiras… O Fygmo e o Fygmo2 descobriram que a Quinta voltou a ter uvas.',
    'historia.nivel2.2': 'Mas de manhã alguém estava à porta: um Rafeiro do Alentejo, de lenço vermelho. Chama-se Chizo, e decidiu ficar.',
    'historia.nivel2.3': 'Abriu: Proteger a Quinta.',
    'historia.nivel3.1': 'As primeiras uvas já enchem os cestos. Na velha adega, a prensa ainda range… mas funciona.',
    'historia.nivel3.2': 'Está na hora de fazer o primeiro Moscatel de Setúbal da Quinta.',
    'historia.nivel3.3': 'Abriu: a Adega.',
    'historia.nivel4.1': 'Já se fala da Quinta na vila. O YoshiCat sobe à colina e olha em volta: a Arrábida, o Sado, vinhas até perder de vista.',
    'historia.nivel4.2': 'Há tanto para descobrir nesta terra… e chegou o primeiro convite para as festas!',
    'historia.nivel4.3': 'Abriu: Explorar, a Enciclopédia e as Festas.',
    'historia.nivel5.1': 'O nosso Moscatel já corre de mesa em mesa. Os mais velhos da terra dizem que o melhor é o que descansa mais tempo na cave…',
    'historia.nivel5.2': '…mas os porcos também sabem disso.',
    'historia.nivel5.3': 'Em breve: a Cave de Reserva.',
    'historia.nivel6.1': 'Já ninguém lhe chama Quinta Esquecida. Agora é a Casa do Moscatel.',
    'historia.nivel6.2': 'Mas o YoshiCat sabe que esta terra guarda histórias muito mais antigas… e esta foi só a primeira.',
    'historia.nivel6.3': 'Em breve: as Garrafas de Coleção.',

    // Cartão pequeno no topo da Vinha ("Vinha · Setembro / Fase: Vindima")
    'vinha.faseLabel': 'Fase',
    'vinha.faseCurta.preparar': 'Preparação',
    'vinha.faseCurta.preparada': 'Plantação',
    'vinha.faseCurta.crescendo': 'Crescimento',
    'vinha.faseCurta.pronta': 'Vindima',

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

    // Nomes curtos, só para caber nas pastilhas da Vinha (ver botaoVinha()
    // em js/vinha.js) — o nome completo acima continua a existir e pode
    // ser usado noutro sítio (ex: mensagens).
    'vinha.pillCavar': 'Cavar',
    'vinha.pillErvas': 'Ervas',
    'vinha.pillPlantar': 'Plantar',
    'vinha.pillRegar': 'Regar',
    'vinha.pillAdubar': 'Adubar',
    'vinha.pillCompostar': 'Compostar',
    'vinha.pillColher': 'Colher',
    'vinha.pillPodar': 'Podar',
    'vinha.pillRepararEstacas': 'Estacas',
    'vinha.pillProtegerFrio': 'Frio',
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

    // Tarefas extra do tempo real (tarefa extra, só quando o tempo em
    // Setúbal está favorável — ver js/tempo.js). Nunca castigam: se não
    // forem feitas, não há perda nenhuma.
    'vinha.btnRepararEstacas': 'Reparar as Estacas',
    'vinha.btnProtegerFrio': 'Proteger do Frio',
    'vinha.tarefaFeitaHoje': 'já feita hoje',
    'vinha.msgRepararEstacas': 'O vento forte soltou algumas estacas da vinha — foram reparadas a tempo.',
    'vinha.msgProtegerFrio': 'As videiras foram protegidas do frio intenso desta noite.',

    // Estações do ano — vantagens junto aos botões (Parte A)
    'vinha.bonusCuidado': '(+50% cuidado)',
    'vinha.bonusAdubo': '(+50% adubo)',
    'vinha.bonusColheita': '(+50% uvas e reputação)',

    // Frase de sabor mostrada no balão depois de cada ação da Vinha
    // (ver VINHA_FLAVOR em js/vinha.js) — fora da estação de bónus.
    'vinha.dica.cavar': 'Revolver a terra areja as raízes e prepara o solo para uma nova plantação.',
    'vinha.dica.plantar': 'Os novos bacelos de Moscatel Graúdo são plantados com cuidado, em filas viradas a poente.',
    'vinha.dica.ervas': 'As ervas daninhas competem pela água e pelos nutrientes que a videira precisa.',
    'vinha.dica.regar': 'A vinha da Arrábida agradece a água nas tardes mais quentes de verão.',
    'vinha.dica.adubar': 'O adubo orgânico devolve à terra o que a vinha consumiu na estação anterior.',
    'vinha.dica.compostagem': 'Os resíduos da poda e das ervas arrancadas transformam-se, com tempo, em adubo rico para a vinha.',
    'vinha.dica.colher': 'A vindima é feita à mão, cacho a cacho, para não danificar os bagos maduros de Moscatel.',

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

    // Tempo real de Setúbal (Open-Meteo, ver js/tempo.js). Para testar:
    // ?tempo=sol|chuva|calor|nevoeiro|trovoada|vento|frio|noite
    'tempo.agoraLabel': 'Setúbal agora:',
    'tempo.ceu.sol': 'Sol',
    'tempo.ceu.noite': 'Céu limpo',
    'tempo.ceu.chuva': 'Chuva',
    'tempo.ceu.nevoeiro': 'Nevoeiro',
    'tempo.ceu.trovoada': 'Trovoada',
    'tempo.msgChuvaRegou': 'A chuva regou por ti.',
    'tempo.avisoTrovoadaProteger': 'O Chizo escondeu-se com medo dos trovões.',
    'tempo.avisoNevoeiroProteger': 'O nevoeiro esconde os porcos — aparecem mais vezes.',

    'explorar.title': 'Explorar',
    'explorar.subtitleNova': 'Nova entrada desbloqueada!',
    'explorar.novaEntradaCurta': 'Nova entrada!',
    'explorar.btnLer': 'Ler',
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
    'perfil.btnSairInicio': 'Sair para o Início',
    'perfil.vibracao': 'Vibração',
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
    'hub.btnPerfil': '👤 Profile',
    'hub.btnSair': '⬅ Leave the Farm',

    'nav.voltarQuinta': '⬅ Back to the Farm',
    'nav.voltar': '⬅ Back',

    'topbar.perfil': 'Profile',
    'nav.vinha': 'Vineyard',
    'nav.proteger': 'Protect',
    'nav.quinta': 'Farm',
    'nav.adega': 'Winery',
    'nav.explorar': 'Explore',
    'vinha.verMaisTarefas': 'See more tasks',

    'stat.uvas': 'Grapes',
    'stat.gotas': 'Drops',
    'stat.reputacao': 'Reputation',
    'stat.garrafas': 'Bottles',
    'stat.conhecimento': 'Knowledge',

    'nivel.label': 'Level',
    'nivel.proximoLabel': 'Next:',
    'nivel.maximo': 'Maximum level reached!',
    'nivel.subiuMsg': 'You reached Level {n} · {nome}!',
    'nivel.nome.1': 'Forgotten Farm',
    'nivel.nome.2': 'Watched Farm',
    'nivel.nome.3': 'Producing Farm',
    'nivel.nome.4': 'Known Farm',
    'nivel.nome.5': 'Famous Farm',
    'nivel.nome.6': 'House of Moscatel',

    'objetivos.titulo': 'Today on the Farm',
    'objetivos.resumoLabel': 'Today',
    'objetivos.bonusLinha': 'Completing all 3 gives +{bonus} Reputation and +1 daily seal.',
    'objetivos.selosLabel': 'Seals:',
    'objetivo.vinha_cavar': "Dig the Vineyard's soil.",
    'objetivo.vinha_plantar': 'Plant new vines in the Vineyard.',
    'objetivo.vinha_ervas': 'Pull the weeds in the Vineyard.',
    'objetivo.vinha_regar': 'Water the Vineyard.',
    'objetivo.vinha_adubar': 'Fertilize the Vineyard.',
    'objetivo.vinha_compostagem': 'Do some Composting in the Vineyard.',
    'objetivo.vinha_colher': 'Harvest the Vineyard.',
    'objetivo.adega_prensar': 'Press Grapes in the Winery.',
    'objetivo.adega_alambique': 'Use the Still in the Winery.',
    'objetivo.adega_fortificar': 'Fortify a batch in the Winery.',
    'objetivo.adega_engarrafar': 'Bottle the wine from the Cellar.',
    'objetivo.proteger_vencer': 'Win a challenge in Protect the Farm.',
    'objetivo.explorar_descobrir': 'Discover a new entry in Explore.',
    'objetivo.festa_tarefa': "Complete one of today's festival tasks.",
    'objetivo.tempo_chuva': "Make the most of today's rain to water the Vineyard.",
    'objetivo.tempo_vento': "Repair the stakes because of today's strong wind.",
    'objetivo.tempo_frio': "Protect the Vineyard from today's hard frost.",

    'proteger.modoTreino': 'Chizo is already on guard. Come back tomorrow for more prizes!',
    'proteger.modoTreinoResultado': 'No prize — training mode.',

    'acesso.trancado': 'Unlocks at Level {n} · {nome} — {faltam} more Reputation needed.',
    'vinha.primeiroPassoMsg': 'First steps in the Vineyard! (+{n} Reputation)',
    'vinha.subiuNivelAviso': 'The Farm leveled up! Head back to the Farm.',

    'historia.intro.1': 'The Moscatel Farm has been forgotten for many years. Weeds have taken over the paths, and the vines grow wild on their own.',
    'historia.intro.2': "I'm YoshiCat. I came to bring this Farm back to life. I'll start with the Vineyard.",
    'historia.nivel2.1': 'Grunts were heard among the vines last night... Fygmo and Fygmo2 found out the Farm has grapes again.',
    'historia.nivel2.2': "But by morning, someone was at the door: an Alentejo Mastiff with a red bandana. His name is Chizo, and he's decided to stay.",
    'historia.nivel2.3': 'Unlocked: Protect the Farm.',
    'historia.nivel3.1': 'The first grapes already fill the baskets. In the old winery, the press still creaks... but it works.',
    'historia.nivel3.2': "It's time to make the Farm's first Setúbal Moscatel.",
    'historia.nivel3.3': 'Unlocked: the Winery.',
    'historia.nivel4.1': 'Word of the Farm is spreading in the village. YoshiCat climbs the hill and looks around: the Arrábida, the Sado, vineyards as far as the eye can see.',
    'historia.nivel4.2': "There's so much to discover in this land... and the first invitation to the festivals has arrived!",
    'historia.nivel4.3': 'Unlocked: Explore, the Encyclopedia and the Festivals.',
    'historia.nivel5.1': 'Our Moscatel is already going from table to table. The old-timers say the best is the one that rests longest in the cellar...',
    'historia.nivel5.2': '...but the pigs know that too.',
    'historia.nivel5.3': 'Coming soon: the Reserve Cellar.',
    'historia.nivel6.1': 'No one calls it the Forgotten Farm anymore. Now it\'s the House of Moscatel.',
    'historia.nivel6.2': 'But YoshiCat knows this land holds much older stories... and this was only the first.',
    'historia.nivel6.3': "Coming soon: the Collector's Bottles.",

    'vinha.faseLabel': 'Phase',
    'vinha.faseCurta.preparar': 'Preparation',
    'vinha.faseCurta.preparada': 'Planting',
    'vinha.faseCurta.crescendo': 'Growing',
    'vinha.faseCurta.pronta': 'Harvest',

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

    'vinha.pillCavar': 'Till',
    'vinha.pillErvas': 'Weeds',
    'vinha.pillPlantar': 'Plant',
    'vinha.pillRegar': 'Water',
    'vinha.pillAdubar': 'Fertilize',
    'vinha.pillCompostar': 'Compost',
    'vinha.pillColher': 'Harvest',
    'vinha.pillPodar': 'Prune',
    'vinha.pillRepararEstacas': 'Stakes',
    'vinha.pillProtegerFrio': 'Cold',

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

    // Real-weather extra tasks (extra task, only when Setúbal's weather
    // is favorable — see js/tempo.js). Never punish: skipping one costs
    // nothing.
    'vinha.btnRepararEstacas': 'Repair the Stakes',
    'vinha.btnProtegerFrio': 'Protect from the Cold',
    'vinha.tarefaFeitaHoje': 'already done today',
    'vinha.msgRepararEstacas': 'The strong wind loosened some of the vineyard stakes — they were repaired in time.',
    'vinha.msgProtegerFrio': "The vines were protected from tonight's intense cold.",

    'vinha.bonusCuidado': '(+50% care)',
    'vinha.bonusAdubo': '(+50% compost)',
    'vinha.bonusColheita': '(+50% grapes and reputation)',

    'vinha.dica.cavar': 'Turning the soil airs out the roots and readies the ground for a new planting.',
    'vinha.dica.plantar': 'The new Moscatel Graúdo cuttings are planted with care, in rows facing west.',
    'vinha.dica.ervas': 'Weeds compete for the water and nutrients the vine needs.',
    'vinha.dica.regar': 'The Arrábida vineyard is grateful for the water on the hottest summer afternoons.',
    'vinha.dica.adubar': 'The organic compost returns to the soil what the vineyard used up last season.',
    'vinha.dica.compostagem': 'Pruning waste and pulled weeds turn, over time, into rich compost for the vineyard.',
    'vinha.dica.colher': 'The harvest is done by hand, bunch by bunch, so the ripe Moscatel grapes are not damaged.',

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

    // Real-time Setúbal weather (Open-Meteo, see js/tempo.js). To test:
    // ?tempo=sol|chuva|calor|nevoeiro|trovoada|vento|frio|noite
    'tempo.agoraLabel': 'Setúbal now:',
    'tempo.ceu.sol': 'Sunny',
    'tempo.ceu.noite': 'Clear sky',
    'tempo.ceu.chuva': 'Rain',
    'tempo.ceu.nevoeiro': 'Fog',
    'tempo.ceu.trovoada': 'Thunderstorm',
    'tempo.msgChuvaRegou': 'The rain watered it for you.',
    'tempo.avisoTrovoadaProteger': 'Chizo hid, scared of the thunder.',
    'tempo.avisoNevoeiroProteger': 'The fog hides the pigs — they show up more often.',

    'explorar.title': 'Explore',
    'explorar.subtitleNova': 'New entry unlocked!',
    'explorar.novaEntradaCurta': 'New entry!',
    'explorar.btnLer': 'Read',
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
    'perfil.btnSairInicio': 'Exit to the Start Screen',
    'perfil.vibracao': 'Vibration',
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
    'hub.btnPerfil': '👤 Perfil',
    'hub.btnSair': '⬅ Salir de la Quinta',

    'nav.voltarQuinta': '⬅ Volver a la Quinta',
    'nav.voltar': '⬅ Volver',

    'topbar.perfil': 'Perfil',
    'nav.vinha': 'Viñedo',
    'nav.proteger': 'Proteger',
    'nav.quinta': 'Quinta',
    'nav.adega': 'Bodega',
    'nav.explorar': 'Explorar',
    'vinha.verMaisTarefas': 'Ver más tareas',

    'stat.uvas': 'Uvas',
    'stat.gotas': 'Gotas',
    'stat.reputacao': 'Reputación',
    'stat.garrafas': 'Botellas',
    'stat.conhecimento': 'Conocimiento',

    'nivel.label': 'Nivel',
    'nivel.proximoLabel': 'Próximo:',
    'nivel.maximo': '¡Nivel máximo alcanzado!',
    'nivel.subiuMsg': '¡Subiste al Nivel {n} · {nome}!',
    'nivel.nome.1': 'Quinta Olvidada',
    'nivel.nome.2': 'Quinta Vigilada',
    'nivel.nome.3': 'Quinta Productora',
    'nivel.nome.4': 'Quinta Conocida',
    'nivel.nome.5': 'Quinta Afamada',
    'nivel.nome.6': 'Casa del Moscatel',

    'objetivos.titulo': 'Hoy en la Quinta',
    'objetivos.resumoLabel': 'Hoy',
    'objetivos.bonusLinha': 'Completar los 3 da +{bonus} Reputación y +1 sello del día.',
    'objetivos.selosLabel': 'Sellos:',
    'objetivo.vinha_cavar': 'Cava la tierra del Viñedo.',
    'objetivo.vinha_plantar': 'Planta nuevos esquejes en el Viñedo.',
    'objetivo.vinha_ervas': 'Arranca las malas hierbas del Viñedo.',
    'objetivo.vinha_regar': 'Riega el Viñedo.',
    'objetivo.vinha_adubar': 'Abona el Viñedo.',
    'objetivo.vinha_compostagem': 'Haz Compostaje en el Viñedo.',
    'objetivo.vinha_colher': 'Cosecha el Viñedo.',
    'objetivo.adega_prensar': 'Prensa Uvas en la Bodega.',
    'objetivo.adega_alambique': 'Usa el Alambique en la Bodega.',
    'objetivo.adega_fortificar': 'Fortifica un lote en la Bodega.',
    'objetivo.adega_engarrafar': 'Embotella el vino de la Bodega de reposo.',
    'objetivo.proteger_vencer': 'Gana un desafío en Proteger la Quinta.',
    'objetivo.explorar_descobrir': 'Descubre una entrada nueva en Explorar.',
    'objetivo.festa_tarefa': 'Completa una tarea de la fiesta de hoy.',
    'objetivo.tempo_chuva': 'Aprovecha la lluvia de hoy para regar el Viñedo.',
    'objetivo.tempo_vento': 'Repara las estacas por el viento fuerte de hoy.',
    'objetivo.tempo_frio': 'Protege el Viñedo del frío fuerte de hoy.',

    'proteger.modoTreino': 'El Chizo ya está de guardia. ¡Vuelve mañana para más premios!',
    'proteger.modoTreinoResultado': 'Sin premio — modo entrenamiento.',

    'acesso.trancado': 'Se abre en el Nivel {n} · {nome} — faltan {faltam} de Reputación.',
    'vinha.primeiroPassoMsg': '¡Primeros pasos en el Viñedo! (+{n} Reputación)',
    'vinha.subiuNivelAviso': '¡La Quinta subió de nivel! Vuelve a la Quinta.',

    'historia.intro.1': 'La Quinta del Moscatel lleva muchos años olvidada. La maleza se ha apoderado de los caminos y las vides crecen solas.',
    'historia.intro.2': 'Soy el YoshiCat. Vine a devolverle la vida a esta Quinta. Voy a empezar por el Viñedo.',
    'historia.nivel2.1': 'Esta noche se oyeron gruñidos entre las vides… El Fygmo y el Fygmo2 descubrieron que la Quinta volvió a tener uvas.',
    'historia.nivel2.2': 'Pero por la mañana había alguien en la puerta: un Mastín del Alentejo, con un pañuelo rojo. Se llama Chizo, y decidió quedarse.',
    'historia.nivel2.3': 'Se abrió: Proteger la Quinta.',
    'historia.nivel3.1': 'Las primeras uvas ya llenan los cestos. En la vieja bodega, la prensa todavía cruje… pero funciona.',
    'historia.nivel3.2': 'Es hora de hacer el primer Moscatel de Setúbal de la Quinta.',
    'historia.nivel3.3': 'Se abrió: la Bodega.',
    'historia.nivel4.1': 'Ya se habla de la Quinta en el pueblo. El YoshiCat sube a la colina y mira alrededor: la Arrábida, el Sado, viñedos hasta donde alcanza la vista.',
    'historia.nivel4.2': 'Hay tanto por descubrir en esta tierra… ¡y llegó la primera invitación para las fiestas!',
    'historia.nivel4.3': 'Se abrió: Explorar, la Enciclopedia y las Fiestas.',
    'historia.nivel5.1': 'Nuestro Moscatel ya corre de mesa en mesa. Los más viejos de la tierra dicen que el mejor es el que reposa más tiempo en la bodega…',
    'historia.nivel5.2': '…pero los cerdos también lo saben.',
    'historia.nivel5.3': 'Próximamente: la Bodega de Reserva.',
    'historia.nivel6.1': 'Ya nadie la llama Quinta Olvidada. Ahora es la Casa del Moscatel.',
    'historia.nivel6.2': 'Pero el YoshiCat sabe que esta tierra guarda historias mucho más antiguas… y esta fue solo la primera.',
    'historia.nivel6.3': 'Próximamente: las Botellas de Colección.',

    'vinha.faseLabel': 'Fase',
    'vinha.faseCurta.preparar': 'Preparación',
    'vinha.faseCurta.preparada': 'Plantación',
    'vinha.faseCurta.crescendo': 'Crecimiento',
    'vinha.faseCurta.pronta': 'Vendimia',

    'vinha.title': 'El Viñedo',
    'vinha.recursoResiduos': 'Residuos',
    'vinha.recursoAdubo': 'Abono',
    'vinha.cuidadoLabel': 'Cuidados',
    'vinha.btnCavar': 'Cavar la Tierra',
    'vinha.btnErvas': 'Eliminar Malas Hierbas',
    'vinha.btnPlantar': 'Plantar',
    'vinha.btnRegar': 'Regar',
    'vinha.btnAdubar': 'Abonar',
    'vinha.btnCompostar': 'Compostaje',
    'vinha.btnColher': 'Cosechar (Vendimia)',

    'vinha.pillCavar': 'Cavar',
    'vinha.pillErvas': 'Hierbas',
    'vinha.pillPlantar': 'Plantar',
    'vinha.pillRegar': 'Regar',
    'vinha.pillAdubar': 'Abonar',
    'vinha.pillCompostar': 'Compostar',
    'vinha.pillColher': 'Cosechar',
    'vinha.pillPodar': 'Podar',
    'vinha.pillRepararEstacas': 'Estacas',
    'vinha.pillProtegerFrio': 'Frío',

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

    // Tareas extra del tiempo real (tarea extra, solo cuando el tiempo
    // en Setúbal es favorable — ver js/tempo.js). Nunca castigan: si no
    // se hacen, no hay ninguna pérdida.
    'vinha.btnRepararEstacas': 'Reparar las Estacas',
    'vinha.btnProtegerFrio': 'Proteger del Frío',
    'vinha.tarefaFeitaHoje': 'ya hecho hoy',
    'vinha.msgRepararEstacas': 'El viento fuerte soltó algunas estacas del viñedo — se repararon a tiempo.',
    'vinha.msgProtegerFrio': 'Las cepas fueron protegidas del frío intenso de esta noche.',

    'vinha.bonusCuidado': '(+50% cuidado)',
    'vinha.bonusAdubo': '(+50% abono)',
    'vinha.bonusColheita': '(+50% uvas y reputación)',

    'vinha.dica.cavar': 'Remover la tierra airea las raíces y prepara el suelo para una nueva plantación.',
    'vinha.dica.plantar': 'Los nuevos esquejes de Moscatel Graúdo se plantan con cuidado, en filas orientadas al poniente.',
    'vinha.dica.ervas': 'Las malas hierbas compiten por el agua y los nutrientes que necesita la vid.',
    'vinha.dica.regar': 'El viñedo de Arrábida agradece el agua en las tardes más calurosas del verano.',
    'vinha.dica.adubar': 'El abono orgánico devuelve a la tierra lo que el viñedo consumió en la estación anterior.',
    'vinha.dica.compostagem': 'Los residuos de la poda y las malas hierbas arrancadas se convierten, con el tiempo, en abono rico para el viñedo.',
    'vinha.dica.colher': 'La vendimia se hace a mano, racimo a racimo, para no dañar los granos maduros de Moscatel.',

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

    // Tiempo real de Setúbal (Open-Meteo, ver js/tempo.js). Para probar:
    // ?tempo=sol|chuva|calor|nevoeiro|trovoada|vento|frio|noite
    'tempo.agoraLabel': 'Setúbal ahora:',
    'tempo.ceu.sol': 'Sol',
    'tempo.ceu.noite': 'Cielo despejado',
    'tempo.ceu.chuva': 'Lluvia',
    'tempo.ceu.nevoeiro': 'Niebla',
    'tempo.ceu.trovoada': 'Tormenta',
    'tempo.msgChuvaRegou': 'La lluvia la regó por ti.',
    'tempo.avisoTrovoadaProteger': 'El Chizo se escondió, asustado por los truenos.',
    'tempo.avisoNevoeiroProteger': 'La niebla esconde a los cerdos — aparecen más veces.',

    'explorar.title': 'Explorar',
    'explorar.subtitleNova': '¡Nueva entrada desbloqueada!',
    'explorar.novaEntradaCurta': '¡Nueva entrada!',
    'explorar.btnLer': 'Leer',
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
    'perfil.btnSairInicio': 'Salir al Inicio',
    'perfil.vibracao': 'Vibración',
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
  document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
    el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
  });
  document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
    el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
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
  // Nomes com tamanhos diferentes por língua podem mudar se uma fila de
  // pastilhas (ver js/main.js) ainda cabe toda ou passa a precisar de setas.
  if (typeof atualizarTodasAsFilasDePastilhas === 'function') atualizarTodasAsFilasDePastilhas();
}

function selecionarLingua(lang) {
  setLanguage(lang);
  showMessage(t('lingua.confirmado'));
  goTo('home');
}

function renderLinguaScreen() {
  applyTranslations();
}
