// ---------------------------------------------------------------------
// A HISTÓRIA DA QUINTA — contada nos balões já existentes (ver
// mostrarFalas() em js/main.js), à medida que se sobe de nível. Cada
// fala pode trazer a sua própria foto (ver {texto, foto, pos} em
// mostrarFalas()) — ao fechar a última fala de uma história com foto, o
// fundo volta à imagem normal do ecrã onde o jogador está (ver
// restaurarFundoDoEcraAtual() em js/main.js).
//
// Só jogadores NOVOS veem a intro e a história de cada nível "ao vivo"
// (jogadores antigos já têm tudo aberto — ver ecraDesbloqueado() em
// js/niveis.js); mas mostrarHistoriaSubidaNivel() em si não distingue
// isso, é só chamada uma vez a menos para quem já era antigo (ver
// verificarSubidaNivel()).
// ---------------------------------------------------------------------

// Fala inicial — só na primeira entrada na Quinta de um jogador novo
// (ver mostrarHistoriaIntro() abaixo). Usa a foto normal da Quinta, já
// ativa nesse momento — não muda de fundo.
const HISTORIA_INTRO = [
  { chave: 'historia.intro.1' },
  { chave: 'historia.intro.2' }
];

// Por nível (2 a 10): cada fala pode trazer a sua própria foto — a que
// não tiver "foto" mantém a última que já estava a mostrar-se.
const HISTORIA_NIVEIS = {
  2: [
    { chave: 'historia.nivel2.1', foto: 'assets/ecras/chizo_porta_casa.jpg', som: 'assets/sons/chizo_ladrar.mp3' },
    { chave: 'historia.nivel2.2' },
    { chave: 'historia.nivel2.3' }
  ],
  3: [
    { chave: 'historia.nivel3.1', foto: 'assets/ecras/adega_abandonada.jpg' },
    { chave: 'historia.nivel3.2', foto: 'assets/ecras/adega_prensa.jpg' },
    { chave: 'historia.nivel3.3' }
  ],
  4: [
    { chave: 'historia.nivel4.1', foto: 'assets/ecras/cimo_da_colina_apontar.jpg' },
    { chave: 'historia.nivel4.2' },
    { chave: 'historia.nivel4.3' }
  ],
  5: [
    { chave: 'historia.nivel5.1', foto: 'assets/vinha/barril.jpg' },
    { chave: 'historia.nivel5.2' },
    { chave: 'historia.nivel5.3' }
  ],
  6: [
    { chave: 'historia.nivel6.1' },
    { chave: 'historia.nivel6.2' },
    { chave: 'historia.nivel6.3' }
  ],
  7: [
    { chave: 'historia.nivel7.1', foto: 'assets/mapa/mapa_quinta.jpg' },
    { chave: 'historia.nivel7.2' },
    { chave: 'historia.nivel7.3' }
  ],
  8: [
    { chave: 'historia.nivel8.1', foto: 'assets/ecras/festa_vindima_todos_juntos.jpg' },
    { chave: 'historia.nivel8.2' },
    { chave: 'historia.nivel8.3' }
  ],
  9: [
    { chave: 'historia.nivel9.1', foto: 'assets/vinha/barril_dourado.jpg' },
    { chave: 'historia.nivel9.2', foto: 'assets/ecras/sao_martinho_prova.jpg' },
    { chave: 'historia.nivel9.3', foto: 'assets/ecras/yoshi_cat_fala_das_uvas.jpg' }
  ],
  10: [
    { chave: 'historia.nivel10.1', foto: 'assets/ecras/cimo_da_colina_apontar.jpg' },
    { chave: 'historia.nivel10.2', foto: 'assets/mapa/mapa_quinta.jpg' },
    { chave: 'historia.nivel10.3', foto: 'assets/ecras/perfil_yoshi_cat_e_chizo.jpg' }
  ]
};

// Traduz uma lista de { chave, foto, pos } em { texto, foto, pos },
// pronta para mostrarFalas() (ver js/main.js).
function traduzirFalasHistoria(lista) {
  return lista.map(function (f) {
    return { texto: t(f.chave), foto: f.foto, pos: f.pos, som: f.som };
  });
}

// Mostra a intro uma única vez — só na primeira vez de sempre que um
// jogador NOVO entra na Quinta (ver goTo() em js/main.js). Jogadores
// antigos nunca a veem.
// Devolve true se mostrou a intro agora, false se não.
function mostrarHistoriaIntro() {
  if (state.acesso.jogadorAntigo || state.acesso.introMostrada) return false;
  state.acesso.introMostrada = true;
  saveState(state);
  mostrarFalas(traduzirFalasHistoria(HISTORIA_INTRO), 'YoshiCat');
  return true;
}

// Junta a história de TODOS os níveis passados entre nivelAntigo (não
// incluído) e nivelNovo (incluído), por ordem — ex.: subir do Nível 1
// para o 4 de uma vez mostra a história do 2, depois do 3, depois do 4,
// tudo na mesma fila de balões (ver verificarSubidaNivel() em
// js/niveis.js).
function mostrarHistoriaSubidaNivel(nivelAntigo, nivelNovo) {
  let falas = [];
  for (let n = nivelAntigo + 1; n <= nivelNovo; n++) {
    if (HISTORIA_NIVEIS[n]) falas = falas.concat(HISTORIA_NIVEIS[n]);
  }
  if (falas.length === 0) return;
  mostrarFalas(traduzirFalasHistoria(falas), 'YoshiCat');
}
