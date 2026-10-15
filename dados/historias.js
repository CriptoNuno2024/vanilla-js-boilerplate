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
