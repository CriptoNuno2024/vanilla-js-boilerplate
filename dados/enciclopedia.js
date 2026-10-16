// Ficheiro de dados — ver dados/LEIAME.md. Cada entrada acrescenta-se com dadosAcrescentar('enciclopedia', { ... }) (js/dados.js).
// Aqui vão as HISTÓRIAS NOVAS DA ENCICLOPÉDIA: { id, titulo: { pt, en, es }, texto: { pt, en, es }, nivelMinimo (inteiro >= 1),
// imagem (opcional, caminho que exista em assets/), meses (opcional), estacao (opcional), manual (opcional, true) }.
// A entrada só existe para o jogador a partir do nível "nivelMinimo" e, depois, sai primeiro no Explorar (prioridade). O id não pode repetir nenhum id da Enciclopédia.

// Nível 11, "Moscatel da Arrábida": as 3 histórias que o capítulo 11 (dados/capitulos.js) pede. Sem imagem.
dadosAcrescentar('enciclopedia', {
  id: 'arrabida_biosfera',
  nivelMinimo: 11,
  titulo: { pt: 'A Arrábida, Reserva da Biosfera', en: 'The Arrábida, a Biosphere Reserve', es: 'La Arrábida, Reserva de la Biosfera' },
  texto: {
    pt: 'A 27 de setembro de 2025, a UNESCO reconheceu a Arrábida como Reserva da Biosfera, a 13.ª de Portugal. O pedido foi feito pelos municípios de Setúbal, Palmela e Sesimbra, com o ICNF.',
    en: "On 27 September 2025, UNESCO recognised the Arrábida as a Biosphere Reserve, the 13th in Portugal. The application was made by the municipalities of Setúbal, Palmela and Sesimbra, together with the ICNF (Portugal's nature conservation institute).",
    es: 'El 27 de septiembre de 2025, la UNESCO reconoció la Arrábida como Reserva de la Biosfera, la 13.ª de Portugal. La candidatura la presentaron los municipios de Setúbal, Palmela y Sesimbra, junto con el ICNF (el instituto de conservación de la naturaleza de Portugal).'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'arrabida_plantas',
  nivelMinimo: 11,
  titulo: { pt: 'Um Jardim de 1400 Plantas', en: 'A Garden of 1,400 Plants', es: 'Un Jardín de 1400 Plantas' },
  texto: {
    pt: 'Na Arrábida vivem mais de 1400 espécies de plantas, cerca de 40% da flora de Portugal. Setenta delas são raras ou endémicas.',
    en: "Over 1,400 plant species live in the Arrábida, about 40% of Portugal's flora. Seventy of them are rare or endemic.",
    es: 'En la Arrábida viven más de 1400 especies de plantas, cerca del 40% de la flora de Portugal. Setenta de ellas son raras o endémicas.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'arrabida_mar',
  nivelMinimo: 11,
  titulo: { pt: 'Da Serra ao Mar', en: 'From Sierra to Sea', es: 'De la Sierra al Mar' },
  texto: {
    pt: 'A reserva junta a serra e o mar: cerca de 200 espécies de vertebrados e mais de 2000 espécies marinhas. A pesca artesanal, a oliveira e o Moscatel de Setúbal fazem parte desta paisagem.',
    en: 'The reserve joins sierra and sea: about 200 vertebrate species and over 2,000 marine species. Artisanal fishing, the olive tree and Moscatel de Setúbal are part of this landscape.',
    es: 'La reserva une sierra y mar: unas 200 especies de vertebrados y más de 2000 especies marinas. La pesca artesanal, el olivo y el Moscatel de Setúbal forman parte de este paisaje.'
  }
});

// Nível 12, «Moscatel do Sado»: as 3 histórias que o capítulo 12 (dados/capitulos.js) pede. Sem imagem.
dadosAcrescentar('enciclopedia', {
  id: 'sado_reserva',
  nivelMinimo: 12,
  titulo: { pt: 'Uma Reserva Entre o Rio e o Mar', en: 'A Reserve Between River and Sea', es: 'Una Reserva Entre el Río y el Mar' },
  texto: {
    pt: 'A Reserva Natural do Estuário do Sado foi criada em 1980. A 8 de maio de 1996, foi reconhecida como zona húmida de importância internacional (Ramsar).',
    en: 'The Sado Estuary Nature Reserve was created in 1980. On 8 May 1996, it was recognised as a wetland of international importance (Ramsar).',
    es: 'La Reserva Natural del Estuario del Sado se creó en 1980. El 8 de mayo de 1996 fue reconocida como humedal de importancia internacional (Ramsar).'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'sado_golfinhos',
  nivelMinimo: 12,
  titulo: { pt: 'Os Golfinhos do Sado', en: 'The Dolphins of the Sado', es: 'Los Delfines del Sado' },
  texto: {
    pt: 'No estuário vive uma comunidade residente de golfinhos-roazes, que ali fica todo o ano. É acompanhada por cientistas desde pelo menos 1981.',
    en: 'A resident community of bottlenose dolphins lives in the estuary all year round. Scientists have followed it since at least 1981.',
    es: 'En el estuario vive una comunidad residente de delfines mulares, que permanece allí todo el año. Los científicos la siguen desde al menos 1981.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'sado_troia',
  nivelMinimo: 12,
  titulo: { pt: 'O Peixe Salgado de Tróia', en: 'The Salted Fish of Tróia', es: 'El Pescado Salado de Tróia' },
  texto: {
    pt: 'Em Tróia, mesmo em frente a Setúbal, os romanos preparavam peixe salgado e garum, um molho de peixe. O local foi ocupado até ao século VI.',
    en: 'At Tróia, right across from Setúbal, the Romans prepared salted fish and garum, a fish sauce. The site was occupied until the 6th century.',
    es: 'En Tróia, justo frente a Setúbal, los romanos preparaban pescado salado y garum, una salsa de pescado. El lugar estuvo ocupado hasta el siglo VI.'
  }
});

// Nível 13, «Moscatel de Palmela»: as 3 histórias que o capítulo 13 (dados/capitulos.js) pede. Sem imagem.
dadosAcrescentar('enciclopedia', {
  id: 'palmela_castelo',
  nivelMinimo: 13,
  titulo: { pt: 'O Castelo de Palmela', en: 'Palmela Castle', es: 'El Castillo de Palmela' },
  texto: {
    pt: 'O castelo de Palmela foi tomado aos mouros no século XII e entregue depois à Ordem de Santiago. O antigo convento é hoje uma pousada.',
    en: 'Palmela castle was taken from the Moors in the 12th century and later given to the Order of Santiago. The old convent is now an inn.',
    es: 'El castillo de Palmela fue tomado a los moros en el siglo XII y entregado después a la Orden de Santiago. El antiguo convento es hoy una posada.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'palmela_capelo',
  nivelMinimo: 13,
  titulo: { pt: 'Hermenegildo Capelo', en: 'Hermenegildo Capelo', es: 'Hermenegildo Capelo' },
  texto: {
    pt: 'Hermenegildo Capelo nasceu em Palmela, em 1841. Foi explorador e, com Roberto Ivens, atravessou África de Angola a Moçambique.',
    en: 'Hermenegildo Capelo was born in Palmela in 1841. He was an explorer and, with Roberto Ivens, crossed Africa from Angola to Mozambique.',
    es: 'Hermenegildo Capelo nació en Palmela en 1841. Fue explorador y, con Roberto Ivens, atravesó África de Angola a Mozambique.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'palmela_castelao',
  nivelMinimo: 13,
  titulo: { pt: 'O Castelão de Palmela', en: 'The Castelão of Palmela', es: 'El Castelão de Palmela' },
  texto: {
    pt: 'Os vinhos tintos da DOC Palmela, reconhecida em 2009, levam pelo menos 67% de uva Castelão.',
    en: 'Red wines of the Palmela DOC, recognised in 2009, contain at least 67% Castelão grapes.',
    es: 'Los vinos tintos de la DOC Palmela, reconocida en 2009, llevan al menos un 67% de uva Castelão.'
  }
});

// Nível 14, «Moscatel de Azeitão»: as 3 histórias que o capítulo 14 (dados/capitulos.js) pede. Sem imagem.
dadosAcrescentar('enciclopedia', {
  id: 'azeitao_queijo',
  nivelMinimo: 14,
  titulo: { pt: 'O Queijo de Azeitão', en: 'Azeitão Cheese', es: 'El Queso de Azeitão' },
  texto: {
    pt: 'O Queijo de Azeitão é feito com leite de ovelha em Palmela, Sesimbra e Setúbal. Tem pasta mole e amanteigada e é DOP, ou seja, tem nome protegido.',
    en: "Azeitão Cheese is made with sheep's milk in Palmela, Sesimbra and Setúbal. It has a soft, buttery paste and is a PDO, which means its name is protected.",
    es: 'El Queso de Azeitão se hace con leche de oveja en Palmela, Sesimbra y Setúbal. Tiene pasta blanda y mantecosa y es DOP, es decir, su nombre está protegido.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'azeitao_adega',
  nivelMinimo: 14,
  titulo: { pt: 'Uma Adega de 1834', en: 'A Cellar from 1834', es: 'Una Bodega de 1834' },
  texto: {
    pt: 'Em Vila Nogueira de Azeitão, a casa José Maria da Fonseca foi fundada em 1834. Nas suas adegas ainda descansam moscatéis com mais de cem anos.',
    en: 'In Vila Nogueira de Azeitão, the house of José Maria da Fonseca was founded in 1834. In its cellars, Moscatel wines over a hundred years old still rest.',
    es: 'En Vila Nogueira de Azeitão, la casa José Maria da Fonseca se fundó en 1834. En sus bodegas todavía reposan moscateles de más de cien años.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'azeitao_palacio',
  nivelMinimo: 14,
  titulo: { pt: 'O Palácio dos Duques de Aveiro', en: 'The Palace of the Dukes of Aveiro', es: 'El Palacio de los Duques de Aveiro' },
  texto: {
    pt: 'Em Vila Nogueira de Azeitão fica o Palácio dos Duques de Aveiro. É um palácio renascentista, no chamado estilo chão português.',
    en: 'In Vila Nogueira de Azeitão stands the Palace of the Dukes of Aveiro. It is a Renaissance palace, in the so-called "plain Portuguese" style.',
    es: 'En Vila Nogueira de Azeitão se encuentra el Palacio de los Duques de Aveiro. Es un palacio renacentista, en el llamado estilo "chão" portugués.'
  }
});

// Nível 15, «Moscatel de Sesimbra»: as 3 histórias que o capítulo 15 (dados/capitulos.js) pede. Sem imagem.
dadosAcrescentar('enciclopedia', {
  id: 'sesimbra_castelo',
  nivelMinimo: 15,
  titulo: { pt: 'Castelo de Sesimbra', en: 'Sesimbra Castle', es: 'Castillo de Sesimbra' },
  texto: {
    pt: 'Fortificação de origem islâmica, conquistada em 1165 por D. Afonso Henriques e entregue mais tarde à Ordem de Santiago.',
    en: 'A fortress of Islamic origin, taken in 1165 by Afonso Henriques and later handed over to the Order of Santiago.',
    es: 'Fortaleza de origen islámico, conquistada en 1165 por Afonso Henriques y entregada más tarde a la Orden de Santiago.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'sesimbra_vila',
  nivelMinimo: 15,
  titulo: { pt: 'A vila desce ao mar', en: 'The town comes down to the sea', es: 'La villa baja al mar' },
  texto: {
    pt: 'A partir do século XV, a pesca e a construção naval levaram os habitantes do castelo para a baía, onde nasceu a vila de hoje.',
    en: "From the 15th century on, fishing and shipbuilding drew the people of the castle down to the bay, where today's town was born.",
    es: 'A partir del siglo XV, la pesca y la construcción naval llevaron a los habitantes del castillo hasta la bahía, donde nació la villa de hoy.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'sesimbra_espichel',
  nivelMinimo: 15,
  titulo: { pt: 'Cabo Espichel', en: 'Cape Espichel', es: 'Cabo Espichel' },
  texto: {
    pt: 'O culto à Senhora do Cabo remonta a 1410. A igreja atual foi construída entre 1701 e 1707.',
    en: 'Worship of Our Lady of the Cape dates back to 1410. The present church was built between 1701 and 1707.',
    es: 'El culto a Nuestra Señora del Cabo se remonta a 1410. La iglesia actual se construyó entre 1701 y 1707.'
  }
});

// Nível 16, «Moscatel de Setúbal»: as 3 histórias que o capítulo 16 (dados/capitulos.js) pede. Sem imagem.
dadosAcrescentar('enciclopedia', {
  id: 'setubal_forte',
  nivelMinimo: 16,
  titulo: { pt: 'Forte de São Filipe', en: 'São Filipe Fort', es: 'Fuerte de São Filipe' },
  texto: {
    pt: 'Fortaleza do século XVI, construída no tempo de Filipe II de Espanha, que também foi rei de Portugal, para defender Setúbal dos piratas. Domina o estuário do Sado.',
    en: 'A 16th-century fortress, built in the time of Philip II of Spain, who was also king of Portugal, to defend Setúbal from pirates. It overlooks the Sado estuary.',
    es: 'Fortaleza del siglo XVI, construida en tiempos de Felipe II de España, que también fue rey de Portugal, para defender Setúbal de los piratas. Domina el estuario del Sado.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'setubal_roxo',
  nivelMinimo: 16,
  titulo: { pt: 'A uva que quase se perdeu', en: 'The Grape That Was Almost Lost', es: 'La uva que casi se perdió' },
  texto: {
    pt: 'O Moscatel Roxo é uma casta rara, de uvas rosadas, usada há muito nos vinhos de Setúbal. Chegou a estar perto da extinção, mas foi replantada e volta a dar moscatéis premiados.',
    en: "Moscatel Roxo is a rare grape with pink berries, used for a long time in Setúbal's wines. It came close to extinction, but it was replanted and is again making award-winning moscatels.",
    es: 'La Moscatel Roxo es una variedad rara, de uvas rosadas, usada desde hace mucho en los vinos de Setúbal. Estuvo cerca de la extinción, pero se replantó y vuelve a dar moscateles premiados.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'setubal_familias',
  nivelMinimo: 16,
  titulo: { pt: 'Famílias do Moscatel', en: 'Moscatel Families', es: 'Familias del Moscatel' },
  texto: {
    pt: 'Na Península de Setúbal há produtores familiares que fazem moscatéis há mais de cem anos. A Venâncio da Costa Lima, por exemplo, produz-os desde 1914.',
    en: 'On the Setúbal Peninsula there are family producers who have been making moscatel for over a hundred years. Venâncio da Costa Lima, for example, has produced it since 1914.',
    es: 'En la Península de Setúbal hay productores familiares que elaboran moscatel desde hace más de cien años. Venâncio da Costa Lima, por ejemplo, lo produce desde 1914.'
  }
});

// Nível 17, «Moscatel de Alcácer» (o sal do Sado): as 3 histórias que o capítulo 17 (dados/capitulos.js) pede. Sem imagem.
dadosAcrescentar('enciclopedia', {
  id: 'sal_alcacer',
  nivelMinimo: 17,
  titulo: { pt: 'Alcácer do Sal', en: 'Alcácer do Sal', es: 'Alcácer do Sal' },
  texto: {
    pt: 'Os romanos chamavam-lhe Salacia. Com os árabes passou a Alcácer e, mais tarde, a Alcácer do Sal, por ter sido um grande centro de produção de sal.',
    en: 'The Romans called it Salacia. Under the Arabs it became Alcácer and, later, Alcácer do Sal, because it was a great salt-producing centre.',
    es: 'Los romanos la llamaban Salacia. Con los árabes pasó a Alcácer y, más tarde, a Alcácer do Sal, por haber sido un gran centro de producción de sal.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'sal_setubal',
  nivelMinimo: 17,
  titulo: { pt: 'O sal de Setúbal', en: "Setúbal's Salt", es: 'La sal de Setúbal' },
  texto: {
    pt: 'Nos séculos XVI e XVII, Setúbal foi o principal centro de produção e exportação de sal do país, sobretudo para o Norte da Europa. No fim do século XVII havia navios holandeses a carregar sal no seu porto.',
    en: 'In the 16th and 17th centuries, Setúbal was the country\'s main salt-producing and exporting centre, mainly to Northern Europe. At the end of the 17th century, Dutch ships were loading salt in its port.',
    es: 'En los siglos XVI y XVII, Setúbal fue el principal centro de producción y exportación de sal del país, sobre todo hacia el norte de Europa. A finales del siglo XVII había barcos holandeses cargando sal en su puerto.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'sal_redura',
  nivelMinimo: 17,
  titulo: { pt: 'A redura', en: 'The Redura', es: 'La redura' },
  texto: {
    pt: 'A colheita do sal chama-se redura. No século XIX, as salinas do Sado foram perdendo para as do Tejo, mas ainda hoje se faz sal tradicional no estuário do Sado.',
    en: 'The salt harvest is called the redura. In the 19th century, the Sado salt pans lost ground to those of the Tagus, but traditional salt is still made in the Sado estuary today.',
    es: 'La cosecha de la sal se llama redura. En el siglo XIX, las salinas del Sado fueron perdiendo frente a las del Tajo, pero todavía hoy se hace sal tradicional en el estuario del Sado.'
  }
});

// Nível 18, «Moscatel da Comporta» (o arroz do Sado): as 3 histórias que o capítulo 18 (dados/capitulos.js) pede. Sem imagem.
dadosAcrescentar('enciclopedia', {
  id: 'arroz_arrozais',
  nivelMinimo: 18,
  titulo: { pt: 'Os arrozais do Sado', en: "The Sado's Rice Paddies", es: 'Los arrozales del Sado' },
  texto: {
    pt: 'O arroz cultiva-se em campos planos, regados por alagamento. Em Portugal há três grandes zonas: os estuários do Sado, do Tejo e do Mondego.',
    en: 'Rice grows on flat fields, watered by flooding. In Portugal there are three main areas: the Sado, Tagus and Mondego estuaries.',
    es: 'El arroz se cultiva en campos llanos, regados por inundación. En Portugal hay tres grandes zonas: los estuarios del Sado, del Tajo y del Mondego.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'arroz_carolino',
  nivelMinimo: 18,
  titulo: { pt: 'O arroz carolino', en: 'Carolino Rice', es: 'El arroz carolino' },
  texto: {
    pt: 'O carolino é um arroz português de grão redondo, muito usado na cozinha tradicional porque absorve bem os sabores. Faz o arroz de marisco, o de tamboril e o malandro.',
    en: 'Carolino is a Portuguese round-grain rice, widely used in traditional cooking because it absorbs flavours well. It makes seafood rice, monkfish rice and arroz malandro.',
    es: 'El carolino es un arroz portugués de grano redondo, muy usado en la cocina tradicional porque absorbe bien los sabores. Con él se hacen el arroz de marisco, el de rape y el malandro.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'arroz_consumo',
  nivelMinimo: 18,
  titulo: { pt: 'Maiores comedores de arroz', en: "Europe's Biggest Rice Eaters", es: 'Los mayores comedores de arroz de Europa' },
  texto: {
    pt: 'Portugal é o país europeu que mais arroz come por pessoa, muito acima de qualquer outro.',
    en: 'Portugal is the European country that eats the most rice per person, far more than any other.',
    es: 'Portugal es el país europeo que más arroz come por persona, muy por encima de cualquier otro.'
  }
});

// Nível 19, «Moscatel do Montado» (o sobreiro e a cortiça): as 3 histórias que o capítulo 19 (dados/capitulos.js) pede. Sem imagem.
dadosAcrescentar('enciclopedia', {
  id: 'sobreiro_cortica',
  nivelMinimo: 19,
  titulo: { pt: 'O sobreiro e a cortiça', en: 'The Cork Oak and Cork', es: 'El alcornoque y el corcho' },
  texto: {
    pt: 'O sobreiro é a Árvore Nacional de Portugal desde 2011 e é protegido por lei. A cortiça só se tira pela primeira vez aos 25 anos e depois de nove em nove anos, sem matar a árvore.',
    en: "The cork oak has been Portugal's National Tree since 2011 and is protected by law. Cork can only be taken for the first time at 25 years old and then every nine years, without killing the tree.",
    es: 'El alcornoque es el Árbol Nacional de Portugal desde 2011 y está protegido por ley. El corcho solo se extrae por primera vez a los 25 años y después cada nueve años, sin matar al árbol.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'sobreiro_assobiador',
  nivelMinimo: 19,
  titulo: { pt: 'O Assobiador', en: 'The Assobiador', es: 'El Assobiador' },
  texto: {
    pt: 'Em Águas de Moura, em Palmela, vive o Assobiador, o sobreiro mais produtivo do mundo. Numa só colheita deu cortiça para 100 mil rolhas.',
    en: "In Águas de Moura, in Palmela, lives the Assobiador, the world's most productive cork oak. In a single harvest it gave enough cork for 100,000 stoppers.",
    es: 'En Águas de Moura, en Palmela, vive el Assobiador, el alcornoque más productivo del mundo. En una sola cosecha dio corcho para 100 000 tapones.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'sobreiro_rolha',
  nivelMinimo: 19,
  titulo: { pt: 'A rolha', en: 'The Stopper', es: 'El tapón' },
  texto: {
    pt: 'A cortiça fecha a maioria das garrafas de vinho do mundo, e as rolhas são mais de 70% do que Portugal exporta em cortiça.',
    en: "Cork seals most of the world's wine bottles, and stoppers make up over 70% of what Portugal exports in cork.",
    es: 'El corcho cierra la mayoría de las botellas de vino del mundo, y los tapones son más del 70 % de lo que Portugal exporta en corcho.'
  }
});

// Nível 20, «Moscatel do Poeta» (Bocage): as 3 histórias que o capítulo 20 (dados/capitulos.js) pede. Sem imagem.
dadosAcrescentar('enciclopedia', {
  id: 'bocage_poeta',
  nivelMinimo: 20,
  titulo: { pt: 'Bocage, o poeta de Setúbal', en: 'Bocage, the Poet of Setúbal', es: 'Bocage, el poeta de Setúbal' },
  texto: {
    pt: 'Manuel Maria Barbosa du Bocage nasceu em Setúbal em 1765. Saiu de casa aos 16 anos para estudar em Lisboa e tornou-se um dos grandes sonetistas da língua portuguesa. Morreu em Lisboa em 1805.',
    en: 'Manuel Maria Barbosa du Bocage was born in Setúbal in 1765. He left home at 16 to study in Lisbon and became one of the great sonnet writers of the Portuguese language. He died in Lisbon in 1805.',
    es: 'Manuel Maria Barbosa du Bocage nació en Setúbal en 1765. Salió de casa a los 16 años para estudiar en Lisboa y se convirtió en uno de los grandes sonetistas de la lengua portuguesa. Murió en Lisboa en 1805.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'bocage_casa',
  nivelMinimo: 20,
  titulo: { pt: 'A Casa Bocage', en: 'Casa Bocage', es: 'La Casa Bocage' },
  texto: {
    pt: 'Em Setúbal, a Casa Bocage é uma casa-museu com uma biblioteca sobre a vida e a obra do poeta e com o arquivo fotográfico da cidade.',
    en: "In Setúbal, Casa Bocage is a house-museum with a library on the poet's life and work and the city's photographic archive.",
    es: 'En Setúbal, la Casa Bocage es una casa-museo con una biblioteca sobre la vida y la obra del poeta y el archivo fotográfico de la ciudad.'
  }
});

dadosAcrescentar('enciclopedia', {
  id: 'bocage_dia',
  nivelMinimo: 20,
  titulo: { pt: '15 de setembro', en: '15 September', es: '15 de septiembre' },
  texto: {
    pt: '15 de setembro é o dia do nascimento de Bocage e feriado municipal em Setúbal.',
    en: '15 September is the day Bocage was born and a municipal holiday in Setúbal.',
    es: 'El 15 de septiembre es el día del nacimiento de Bocage y fiesta municipal en Setúbal.'
  }
});
