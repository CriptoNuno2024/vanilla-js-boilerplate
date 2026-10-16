// Ficheiro de dados — ver dados/LEIAME.md. Cada entrada acrescenta-se com dadosAcrescentar('historias', { ... }) (js/dados.js).
// Aqui vão as HISTÓRIAS de nível novas: { id, nivel (a partir do 2), falas: [ { texto: { pt, en, es }, foto, som } ] }.
// As imagens e os sons têm de existir em assets/.

// Nível 11: a foto da fala 1 está em assets/ecras/. A fala 1 NÃO leva som: o som pedido (vento_arvores_passaros.mp3) dura
// cerca de 112 s, tocaria a volume 1 (as falas não têm volume) e não pára com a história (ver o relatório da PR).
dadosAcrescentar('historias', {
  id: 'historia_11',
  nivel: 11,
  falas: [
    {
      foto: 'assets/ecras/arrabida_colina.jpg',
      texto: {
        pt: 'Já ninguém fala só da Quinta: fala-se da terra inteira. Do alto da colina, o YoshiCat olha a Serra da Arrábida ao longe, com o mar do outro lado.',
        en: 'Nobody talks only about the Quinta anymore: people talk about the whole land. From the top of the hill, YoshiCat gazes at the Serra da Arrábida in the distance, with the sea on the other side.',
        es: 'Ya nadie habla solo de la Quinta: se habla de toda la tierra. Desde lo alto de la colina, YoshiCat mira la Sierra de la Arrábida a lo lejos, con el mar al otro lado.'
      }
    },
    {
      texto: {
        pt: 'A serra guarda mato mediterrânico, pinhais, grutas e um mar cheio de vida. Tem mais de 1400 espécies de plantas: cerca de 40% de toda a flora de Portugal.',
        en: "The sierra holds Mediterranean scrubland, pine forests, caves and a sea full of life. It has over 1,400 plant species: about 40% of all of Portugal's flora.",
        es: 'La sierra guarda matorral mediterráneo, pinares, cuevas y un mar lleno de vida. Tiene más de 1400 especies de plantas: cerca del 40% de toda la flora de Portugal.'
      }
    },
    {
      texto: {
        pt: 'Em setembro de 2025, a UNESCO fez da Arrábida uma Reserva da Biosfera. E é aqui, entre a serra e o mar, que também nasce o Moscatel de Setúbal.',
        en: 'In September 2025, UNESCO made the Arrábida a Biosphere Reserve. And it is here, between the sierra and the sea, that Moscatel de Setúbal is also born.',
        es: 'En septiembre de 2025, la UNESCO hizo de la Arrábida una Reserva de la Biosfera. Y es aquí, entre la sierra y el mar, donde también nace el Moscatel de Setúbal.'
      }
    },
    {
      texto: {
        pt: 'Abriu: novas histórias da Arrábida na Enciclopédia.',
        en: 'Unlocked: new stories about the Arrábida in the Encyclopedia.',
        es: 'Se abrió: nuevas historias de la Arrábida en la Enciclopedia.'
      }
    }
  ]
});

// Nível 12 («Moscatel do Sado»): a foto da fala 1 está em assets/ecras/; nenhuma fala leva som (as falas não têm volume).
dadosAcrescentar('historias', {
  id: 'historia_12',
  nivel: 12,
  falas: [
    {
      foto: 'assets/ecras/sado_estuario.jpg',
      texto: {
        pt: 'Do alto da colina, vê-se o rio Sado a abrir-se para o mar. A Quinta já é conhecida, mas o YoshiCat quer ir mais longe: descer até à água.',
        en: 'From the top of the hill, you can see the Sado river opening out to the sea. The Quinta is already well known, but YoshiCat wants to go further: down to the water.',
        es: 'Desde lo alto de la colina se ve el río Sado abriéndose al mar. La Quinta ya es conocida, pero YoshiCat quiere ir más lejos: bajar hasta el agua.'
      }
    },
    {
      texto: {
        pt: 'O estuário do Sado é Reserva Natural desde 1980. Em 1996 passou a Zona Húmida de Importância Internacional (Convenção de Ramsar), e recebe flamingos.',
        en: 'The Sado estuary has been a Nature Reserve since 1980. In 1996 it became a Wetland of International Importance (Ramsar Convention), and it is visited by flamingos.',
        es: 'El estuario del Sado es Reserva Natural desde 1980. En 1996 pasó a ser Humedal de Importancia Internacional (Convenio de Ramsar), y recibe flamencos.'
      }
    },
    {
      texto: {
        pt: 'Aqui vive uma pequena comunidade de golfinhos que fica no estuário todo o ano. Os cientistas acompanham-nos há mais de 40 anos.',
        en: 'A small community of dolphins lives here, staying in the estuary all year round. Scientists have followed them for over 40 years.',
        es: 'Aquí vive una pequeña comunidad de delfines que permanece en el estuario todo el año. Los científicos los siguen desde hace más de 40 años.'
      }
    },
    {
      texto: {
        pt: 'Abriu: novas histórias do Sado na Enciclopédia.',
        en: 'Unlocked: new stories about the Sado in the Encyclopedia.',
        es: 'Se abrió: nuevas historias del Sado en la Enciclopedia.'
      }
    }
  ]
});

// Nível 13 («Moscatel de Palmela»): a foto da fala 1 está em assets/ecras/; nenhuma fala leva som (as falas não têm volume).
dadosAcrescentar('historias', {
  id: 'historia_13',
  nivel: 13,
  falas: [
    {
      foto: 'assets/ecras/palmela_castelo.jpg',
      texto: {
        pt: 'Do alto do castelo de Palmela vê-se a terra toda: vinhas e mar. O YoshiCat sobe a colina para ver até onde chega a sua Quinta.',
        en: 'From the top of Palmela castle you can see the whole land: vineyards and sea. YoshiCat climbs the hill to see how far his Quinta reaches.',
        es: 'Desde lo alto del castillo de Palmela se ve toda la tierra: viñedos y mar. YoshiCat sube la colina para ver hasta dónde llega su Quinta.'
      }
    },
    {
      texto: {
        pt: 'O castelo foi tomado aos mouros no século XII. Mais tarde foi entregue à Ordem de Santiago, no tempo de D. Sancho I. Hoje, o antigo convento é uma pousada.',
        en: 'The castle was taken from the Moors in the 12th century. Later it was given to the Order of Santiago, in the time of King Sancho I. Today, the old convent is an inn.',
        es: 'El castillo fue tomado a los moros en el siglo XII. Más tarde fue entregado a la Orden de Santiago, en tiempos de Sancho I. Hoy, el antiguo convento es una posada.'
      }
    },
    {
      texto: {
        pt: 'Palmela é também terra de gente que foi longe. Hermenegildo Capelo nasceu aqui em 1841 e atravessou África, de Angola a Moçambique, com Roberto Ivens.',
        en: 'Palmela is also a land of people who went far. Hermenegildo Capelo was born here in 1841 and crossed Africa, from Angola to Mozambique, with Roberto Ivens.',
        es: 'Palmela es también tierra de gente que llegó lejos. Hermenegildo Capelo nació aquí en 1841 y atravesó África, de Angola a Mozambique, con Roberto Ivens.'
      }
    },
    {
      texto: {
        pt: 'Abriu: novas histórias de Palmela na Enciclopédia.',
        en: 'Unlocked: new stories about Palmela in the Encyclopedia.',
        es: 'Se abrió: nuevas historias de Palmela en la Enciclopedia.'
      }
    }
  ]
});

// Nível 14 («Moscatel de Azeitão»): a foto da fala 1 está em assets/ecras/; nenhuma fala leva som (as falas não têm volume).
dadosAcrescentar('historias', {
  id: 'historia_14',
  nivel: 14,
  falas: [
    {
      foto: 'assets/ecras/azeitao_vila.jpg',
      texto: {
        pt: 'Ao pé da Serra da Arrábida fica Azeitão, terra de queijo, vinho e palácios. O YoshiCat vem ver como se vive e se trabalha por aqui.',
        en: 'At the foot of the Serra da Arrábida lies Azeitão, a land of cheese, wine and palaces. YoshiCat comes to see how people live and work here.',
        es: 'Al pie de la Sierra de la Arrábida está Azeitão, tierra de queso, vino y palacios. YoshiCat viene a ver cómo se vive y se trabaja por aquí.'
      }
    },
    {
      texto: {
        pt: 'O Queijo de Azeitão é feito com leite de ovelha, na Península de Setúbal. Tem pasta mole e amanteigada, e o nome está protegido: é DOP.',
        en: "Azeitão Cheese is made with sheep's milk on the Setúbal Peninsula. It has a soft, buttery paste, and its name is protected: it is a PDO.",
        es: 'El Queso de Azeitão se hace con leche de oveja, en la Península de Setúbal. Tiene pasta blanda y mantecosa, y su nombre está protegido: es DOP.'
      }
    },
    {
      texto: {
        pt: 'Em Azeitão há uma casa de vinhos fundada em 1834. Nas suas adegas ainda descansam moscatéis com mais de cem anos.',
        en: 'In Azeitão there is a wine house founded in 1834. In its cellars, Moscatel wines over a hundred years old still rest.',
        es: 'En Azeitão hay una casa de vinos fundada en 1834. En sus bodegas todavía reposan moscateles de más de cien años.'
      }
    },
    {
      texto: {
        pt: 'Abriu: novas histórias de Azeitão na Enciclopédia.',
        en: 'Unlocked: new stories about Azeitão in the Encyclopedia.',
        es: 'Se abrió: nuevas historias de Azeitão en la Enciclopedia.'
      }
    }
  ]
});

// Nível 15 («Moscatel de Sesimbra»): as fotos das falas 1 e 3 estão em assets/ecras/; nenhuma fala leva som (as falas não têm volume).
dadosAcrescentar('historias', {
  id: 'historia_15',
  nivel: 15,
  falas: [
    {
      foto: 'assets/ecras/sesimbra_vila.jpg',
      texto: {
        pt: 'Chegámos a Sesimbra. Lá em cima, o castelo olha o mar desde que os mouros o ergueram.',
        en: "We've arrived in Sesimbra. Up there, the castle has watched over the sea since the Moors built it.",
        es: 'Hemos llegado a Sesimbra. Allá arriba, el castillo mira al mar desde que lo levantaron los moros.'
      }
    },
    {
      texto: {
        pt: 'D. Afonso Henriques tomou-o em 1165. Durante séculos, a vila viveu toda lá dentro, entre muralhas.',
        en: 'Afonso Henriques took it in 1165. For centuries, the whole town lived up there, inside the walls.',
        es: 'Afonso Henriques lo tomó en 1165. Durante siglos, la villa vivió toda allí dentro, entre murallas.'
      }
    },
    {
      foto: 'assets/ecras/sesimbra_porto.jpg',
      texto: {
        pt: 'Mas o mar chamava. A partir do século XV, as pessoas desceram até à baía para pescar e construir barcos.',
        en: 'But the sea was calling. From the 15th century on, people came down to the bay to fish and build boats.',
        es: 'Pero el mar llamaba. A partir del siglo XV, la gente bajó hasta la bahía para pescar y construir barcos.'
      }
    },
    {
      texto: {
        pt: 'E ainda hoje há quem parta de madrugada. A vila mudou de sítio, mas nunca deixou o mar.',
        en: 'And still today some set out before dawn. The town changed place, but it never left the sea.',
        es: 'Y aún hoy hay quien sale de madrugada. La villa cambió de sitio, pero nunca dejó el mar.'
      }
    }
  ]
});

// Nível 16 («Moscatel de Setúbal»): as fotos das falas 1 e 3 estão em assets/ecras/; nenhuma fala leva som (as falas não têm volume).
dadosAcrescentar('historias', {
  id: 'historia_16',
  nivel: 16,
  falas: [
    {
      foto: 'assets/ecras/yoshicat_sado_mirar.png',
      texto: {
        pt: 'Chegámos a Setúbal. Do alto do forte vê-se o rio Sado e, ao fundo, a península de Tróia.',
        en: "We've arrived in Setúbal. From the top of the fort you can see the Sado river and, far off, the Tróia peninsula.",
        es: 'Hemos llegado a Setúbal. Desde lo alto del fuerte se ven el río Sado y, al fondo, la península de Tróia.'
      }
    },
    {
      texto: {
        pt: 'O Forte de São Filipe foi construído no século XVI, no tempo de Filipe II de Espanha, para defender a cidade dos piratas.',
        en: 'São Filipe Fort was built in the 16th century, in the time of Philip II of Spain, to defend the city from pirates.',
        es: 'El Fuerte de São Filipe se construyó en el siglo XVI, en tiempos de Felipe II de España, para defender la ciudad de los piratas.'
      }
    },
    {
      foto: 'assets/ecras/yoshicat_binoculos_sado.png',
      texto: {
        pt: 'Cá em baixo, os produtores da península ajudaram a salvar uma uva rara que esteve quase a desaparecer: o Moscatel Roxo.',
        en: 'Down below, the growers of the peninsula helped save a rare grape that was almost lost: the Moscatel Roxo.',
        es: 'Allá abajo, los productores de la península ayudaron a salvar una uva rara que casi desapareció: la Moscatel Roxo.'
      }
    },
    {
      texto: {
        pt: 'Hoje volta a dar vinhos premiados. Há coisas que quase se perdem, mas a terra guarda.',
        en: 'Today it makes award-winning wines again. Some things almost get lost, but the land keeps them.',
        es: 'Hoy vuelve a dar vinos premiados. Hay cosas que casi se pierden, pero la tierra las guarda.'
      }
    }
  ]
});

// Nível 17 («Moscatel de Alcácer», o sal do Sado): as fotos das falas 1 (PNG) e 3 (JPG) estão em assets/ecras/; nenhuma fala leva som (as falas não têm volume).
dadosAcrescentar('historias', {
  id: 'historia_17',
  nivel: 17,
  falas: [
    {
      foto: 'assets/ecras/sado_por_do_sol.png',
      texto: {
        pt: 'Voltámos ao Sado, agora às salinas. Aqui o sol, o vento e a água fazem o sal.',
        en: "We're back on the Sado, now at the salt pans. Here the sun, the wind and the water make the salt.",
        es: 'Volvimos al Sado, ahora a las salinas. Aquí el sol, el viento y el agua hacen la sal.'
      }
    },
    {
      texto: {
        pt: 'Foi com sal que Setúbal ganhou fama. Nos séculos XVI e XVII, era o maior centro de sal do país.',
        en: "Salt made Setúbal famous. In the 16th and 17th centuries, it was the country's biggest salt centre.",
        es: 'Con la sal Setúbal ganó fama. En los siglos XVI y XVII, era el mayor centro de sal del país.'
      }
    },
    {
      foto: 'assets/ecras/sado_navio.jpg',
      texto: {
        pt: 'Navios do Norte da Europa vinham buscá-lo, e os salineiros colhiam-no na redura.',
        en: 'Ships from Northern Europe came to fetch it, and the salt workers gathered it at the redura.',
        es: 'Barcos del norte de Europa venían a buscarla, y los salineros la recogían en la redura.'
      }
    },
    {
      texto: {
        pt: 'Hoje há menos salinas, mas ainda se faz sal no estuário do Sado.',
        en: 'Today there are fewer salt pans, but salt is still made in the Sado estuary.',
        es: 'Hoy hay menos salinas, pero todavía se hace sal en el estuario del Sado.'
      }
    }
  ]
});

// Nível 18 («Moscatel da Comporta», o arroz do Sado): as fotos das falas 1 e 3 estão em assets/ecras/; nenhuma fala leva som (as falas não têm volume).
dadosAcrescentar('historias', {
  id: 'historia_18',
  nivel: 18,
  falas: [
    {
      foto: 'assets/ecras/yoshi_nos_arrozais.jpg',
      texto: {
        pt: 'Chegámos à Comporta, entre o mar e o Sado. Aqui a água desenha os campos de arroz.',
        en: "We've arrived in Comporta, between the sea and the Sado. Here the water draws the rice fields.",
        es: 'Hemos llegado a la Comporta, entre el mar y el Sado. Aquí el agua dibuja los campos de arroz.'
      }
    },
    {
      texto: {
        pt: 'O arroz cultiva-se em terrenos planos, regados por alagamento. Em Portugal, sobretudo no Sado, no Tejo e no Mondego.',
        en: 'Rice grows on flat land, watered by flooding. In Portugal, mostly along the Sado, the Tagus and the Mondego.',
        es: 'El arroz se cultiva en terrenos llanos, regados por inundación. En Portugal, sobre todo en el Sado, el Tajo y el Mondego.'
      }
    },
    {
      foto: 'assets/ecras/yoshi_a_mesa.jpg',
      texto: {
        pt: 'Cuidados pelos produtores do vale do Sado, estes campos dão o arroz da nossa mesa. E nós comemos mais arroz do que qualquer outro país europeu.',
        en: 'Looked after by the growers of the Sado valley, these fields give us the rice on our table. And we eat more rice than any other European country.',
        es: 'Cuidados por los productores del valle del Sado, estos campos dan el arroz de nuestra mesa. Y comemos más arroz que cualquier otro país europeo.'
      }
    },
    {
      texto: {
        pt: 'Arroz de marisco, de tamboril ou malandro: cada prato pode guardar um bocadinho do Sado.',
        en: 'Seafood rice, monkfish rice or arroz malandro: every dish can hold a little bit of the Sado.',
        es: 'Arroz de marisco, de rape o malandro: cada plato puede guardar un poquito del Sado.'
      }
    }
  ]
});
