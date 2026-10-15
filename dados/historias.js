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
