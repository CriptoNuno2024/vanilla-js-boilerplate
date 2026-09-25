// ---------------------------------------------------------------------
// ESTAÇÕES DO ANO — sempre pelo calendário de Portugal (a Quinta é em
// Setúbal), seja qual for o país ou fuso horário do jogador:
//   Inverno   = dezembro, janeiro, fevereiro
//   Primavera = março, abril, maio
//   Verão     = junho, julho, agosto
//   Outono    = setembro, outubro, novembro
//
// Para testar: acrescenta ?estacao=inverno (ou primavera / verao /
// outono) ao endereço. Sem isso, usa a data real do telemóvel.
//
// Uma estação forçada assume o primeiro mês dela (dezembro, março,
// junho ou setembro) para tudo o que depende do mês exato — por isso
// o verão forçado mostra sempre "o vingamento" (o de junho) e não
// chega a mostrar "o pintor" (julho/agosto), por exemplo.
// ---------------------------------------------------------------------

// Índice = Date().getMonth() (0 = janeiro ... 11 = dezembro)
const ESTACAO_DO_MES = [
  'inverno', 'inverno', 'primavera', 'primavera', 'primavera', 'verao',
  'verao', 'verao', 'outono', 'outono', 'outono', 'inverno'
];

// Fase verdadeira da videira em cada mês (Parte B)
const FASE_REAL_DO_MES = [
  'repouso', 'repouso', 'choro', 'rebentacao', 'floracao', 'vingamento',
  'pintor', 'pintor', 'vindima', 'fimVindima', 'quedaFolha', 'repouso'
];

// Mês representativo de cada estação, só usado quando é forçada pelo
// endereço (?estacao=...), já que aí não há um dia real do mês a usar.
const MES_DA_ESTACAO_FORCADA = { inverno: 11, primavera: 2, verao: 5, outono: 8 };

function mesForcadoNoEndereco() {
  const estacao = new URLSearchParams(location.search).get('estacao');
  return MES_DA_ESTACAO_FORCADA.hasOwnProperty(estacao) ? MES_DA_ESTACAO_FORCADA[estacao] : null;
}

function mesAtual() {
  const forcado = mesForcadoNoEndereco();
  return forcado !== null ? forcado : new Date().getMonth();
}

function estacaoAtual() {
  return ESTACAO_DO_MES[mesAtual()];
}

function faseRealAtual() {
  return FASE_REAL_DO_MES[mesAtual()];
}

// Nome do mês no idioma atual, tal como o browser o traduz (evita ter
// de traduzir 12 nomes de mês à mão em 3 línguas).
function nomeMesAtual() {
  const nome = new Date(2024, mesAtual(), 1).toLocaleDateString(localeAtual(), { month: 'long' });
  return nome.charAt(0).toUpperCase() + nome.slice(1);
}

// Linha do Menu da Quinta, ex: "Outono · Setembro — época de vindima"
function atualizarLinhaEstacaoQuinta() {
  const el = document.getElementById('estacao-linha');
  if (!el) return;
  const estacao = estacaoAtual();
  el.textContent = t('estacao.' + estacao) + ' · ' + nomeMesAtual() + ' — ' + t('estacao.frase.' + estacao);
}
