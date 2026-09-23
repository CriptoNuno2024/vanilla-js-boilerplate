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

    'garrafa.msgGotasInsuficientes': 'Ainda não tens Gotas de Moscatel suficientes. Precisas de 100.',

    'explorar.title': 'Explorar',
    'explorar.subtitleNova': 'Nova entrada desbloqueada!',
    'explorar.tudoDesbloqueado': 'Já desbloqueaste todo o conhecimento sobre o Moscatel de Setúbal!',
    'explorar.btnVerEnciclopedia': 'Ver Enciclopédia',

    'enciclopedia.title': 'Enciclopédia do Moscatel',
    'enciclopedia.bloqueado': 'Por desbloquear.',

    'garrafa.title': 'Criar Garrafa',
    'garrafa.descricao': 'São precisas 100 Gotas de Moscatel para criar 1 Garrafa (+30 Reputação).',
    'garrafa.btnCriar': 'Criar Garrafa',
    'garrafa.btnSeguinte': 'Seguinte',
    'garrafa.btnContinuar': 'Continuar',
    'garrafa.resultadoTitulo': 'Garrafa Criada!',

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

    'garrafa.msgGotasInsuficientes': "You don't have enough Moscatel Drops yet. You need 100.",

    'explorar.title': 'Explore',
    'explorar.subtitleNova': 'New entry unlocked!',
    'explorar.tudoDesbloqueado': "You've unlocked all the knowledge about Setúbal Moscatel!",
    'explorar.btnVerEnciclopedia': 'View Encyclopedia',

    'enciclopedia.title': 'Moscatel Encyclopedia',
    'enciclopedia.bloqueado': 'Not yet unlocked.',

    'garrafa.title': 'Make a Bottle',
    'garrafa.descricao': 'You need 100 Moscatel Drops to make 1 Bottle (+30 Reputation).',
    'garrafa.btnCriar': 'Make a Bottle',
    'garrafa.btnSeguinte': 'Next',
    'garrafa.btnContinuar': 'Continue',
    'garrafa.resultadoTitulo': 'Bottle Made!',

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

    'garrafa.msgGotasInsuficientes': 'Todavía no tienes suficientes Gotas de Moscatel. Necesitas 100.',

    'explorar.title': 'Explorar',
    'explorar.subtitleNova': '¡Nueva entrada desbloqueada!',
    'explorar.tudoDesbloqueado': '¡Ya has desbloqueado todo el conocimiento sobre el Moscatel de Setúbal!',
    'explorar.btnVerEnciclopedia': 'Ver Enciclopedia',

    'enciclopedia.title': 'Enciclopedia del Moscatel',
    'enciclopedia.bloqueado': 'Por desbloquear.',

    'garrafa.title': 'Crear Botella',
    'garrafa.descricao': 'Se necesitan 100 Gotas de Moscatel para crear 1 Botella (+30 Reputación).',
    'garrafa.btnCriar': 'Crear Botella',
    'garrafa.btnSeguinte': 'Siguiente',
    'garrafa.btnContinuar': 'Continuar',
    'garrafa.resultadoTitulo': '¡Botella Creada!',

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
