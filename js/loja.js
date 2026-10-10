// ---------------------------------------------------------------------
// A LOJA DA QUINTA (Nível 7, o mesmo da Estrada) — vender bagaceira por Reputação.
//
// A bagaceira (state.adega.bagaceira, ver js/alambique.js) sobra a quem destila muito bagaço e só servia à jeropiga e ao Sr.
// Armindo. Na Loja vende-se 1 bagaceira de cada vez por LOJA_CONFIG.reputacaoPorBagaceira de Reputação, até
// LOJA_CONFIG.vendasPorDia vendas por dia (dia em Lisboa). Sem uvas, sem moeda nova, sem compras: só Reputação (os "pontos" do
// jogo), pelo caminho de sempre (estado.reputacao += n; os níveis reagem em verificarSubidaNivel() ao entrar na Quinta).
// Não se vendem garrafas nem Bagaço.
//
// state.loja (ver defaultState() em js/state.js):
//   dia         'AAAA-MM-DD' (Lisboa) a que se referem as vendas de hoje; null = nunca vendeu
//   vendasHoje  quantas vendas já fez nesse dia
// NÃO se junta na nuvem: segue o estado inteiro que ganhar, como state.camara, state.lagar, state.reserva e state.despensa.
//
// As vendas repõem-se pelas regras do relógio de js/tempo.js: diaLisboaMudou(hoje, dia). Dia igual ou anterior ao guardado (data do
// aparelho atrás), até DIAS_FUTURO_MAXIMO dias à frente, mantém as vendas (nada se repõe); mais do que isso, ou dia em falta ou
// inválido, repõe. As regras (lojaPodeVender, lojaVender, lojaFundoPara) são puras: o dia e o tempo chegam por argumento, nada
// lê o relógio nem sorteia, nada grava (quem chama grava, uma só vez, no clique).
// ---------------------------------------------------------------------

const LOJA_CONFIG = {
  vendasPorDia: 3,            // bagaceiras que se podem vender por dia
  reputacaoPorBagaceira: 1,   // Reputação por cada bagaceira vendida
  // Fundos (imagens que já existem em assets/ecras): o do tempo real, como a Vinha (ver fundoTempoLoja()).
  fundos: {
    sol: 'assets/ecras/casa_loja_meio_da_vinha_4.jpg',
    chuva: 'assets/ecras/lojas_casas.jpg',
    trovoada: 'assets/ecras/lojas_casas_janelas_abertas_2.jpg'
  }
};

const LOJA_DIA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function lojaInteiro(n) {
  return typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= Number.MAX_SAFE_INTEGER ? n : 0;
}

// Repara state.loja em memória (uma nuvem ou um save estranho podem trazer null ou outro tipo).
function lojaEstado(estado) {
  let l = estado.loja;
  if (!l || typeof l !== 'object' || Array.isArray(l)) l = estado.loja = { dia: null, vendasHoje: 0 };
  if (typeof l.dia !== 'string' || !LOJA_DIA_REGEX.test(l.dia)) l.dia = null;
  l.vendasHoje = lojaInteiro(l.vendasHoje);
  return l;
}

// Vendas de "hoje", só lendo: 0 se as vendas guardadas já são de outro dia (diaLisboaMudou), senão as guardadas.
function lojaVendasDeHoje(estado, hoje) {
  const l = estado && estado.loja && typeof estado.loja === 'object' && !Array.isArray(estado.loja) ? estado.loja : null;
  const dia = l && typeof l.dia === 'string' && LOJA_DIA_REGEX.test(l.dia) ? l.dia : null;
  if (dia === null || diaLisboaMudou(hoje, dia)) return 0;
  return lojaInteiro(l.vendasHoje);
}

// Só lê. Devolve { ok, motivo, vendasHoje, limite, bagaceiras }:
//   motivo null | 'estado_invalido' | 'dia_invalido' | 'limite' | 'sem_bagaceira'
// A bagaceira lê-se como alambiqueNumero (negativa, em falta ou texto contam 0) sem reparar nada. Nunca altera o estado.
function lojaPodeVender(estado, hoje) {
  const limite = LOJA_CONFIG.vendasPorDia;
  const recusa = function (motivo, vendas, bag) { return { ok: false, motivo: motivo, vendasHoje: vendas || 0, limite: limite, bagaceiras: bag || 0 }; };
  if (!estado || typeof estado !== 'object') return recusa('estado_invalido');
  if (typeof hoje !== 'string' || !LOJA_DIA_REGEX.test(hoje) || diaLisboaPartes(hoje) === null) return recusa('dia_invalido');
  const vendas = lojaVendasDeHoje(estado, hoje);
  const a = estado.adega && typeof estado.adega === 'object' && !Array.isArray(estado.adega) ? estado.adega : null;
  const bag = a ? alambiqueNumero(a.bagaceira) : 0;
  if (vendas >= limite) return recusa('limite', vendas, bag);
  if (bag < 1) return recusa('sem_bagaceira', vendas, bag);
  return { ok: true, motivo: null, vendasHoje: vendas, limite: limite, bagaceiras: bag };
}

// Vende 1 bagaceira no dia "hoje". Valida tudo antes de alterar (lojaPodeVender); recusar nunca altera nada.
// Se ok: gasta 1 bagaceira (alambiqueEstado repara o campo em memória), soma a Reputação e regista a venda. O dia guardado é o
// efetivo (diaLisboaEfetivo): com a data do aparelho atrás nunca recua, e um dia guardado a mais de DIAS_FUTURO_MAXIMO à frente
// passa a hoje. Devolve { ok, motivo, reputacaoGanha, vendasHoje, restam }. Não grava (quem chama grava).
function lojaVender(estado, hoje) {
  const p = lojaPodeVender(estado, hoje);
  if (!p.ok) return { ok: false, motivo: p.motivo, reputacaoGanha: 0, vendasHoje: p.vendasHoje, restam: Math.max(0, p.limite - p.vendasHoje) };
  const a = alambiqueEstado(estado);
  const l = lojaEstado(estado);
  const dia = diaLisboaEfetivo(hoje, l.dia);
  a.bagaceira -= 1;
  const rep = LOJA_CONFIG.reputacaoPorBagaceira;
  estado.reputacao = (typeof estado.reputacao === 'number' && Number.isFinite(estado.reputacao) ? estado.reputacao : 0) + rep;
  l.dia = dia;
  l.vendasHoje = p.vendasHoje + 1;
  return { ok: true, motivo: null, reputacaoGanha: rep, vendasHoje: l.vendasHoje, restam: Math.max(0, LOJA_CONFIG.vendasPorDia - l.vendasHoje) };
}

// O fundo da Loja para uma condição do tempo (a de tempoAtual(), js/tempo.js). Pura. Granizo ou trovoada -> janelas abertas;
// chuva -> à chuva; todos os outros casos e tempo indisponível ou estranho -> sol.
function lojaFundoPara(tempo) {
  const F = LOJA_CONFIG.fundos;
  if (!tempo || typeof tempo !== 'object' || tempo.disponivel !== true) return F.sol;
  if (tempo.granizo === true || tempo.ceu === 'trovoada') return F.trovoada;
  if (tempo.ceu === 'chuva') return F.chuva;
  return F.sol;
}

// Como fundoTempoVinha() (js/vinha.js): lê o tempo real (ou o do ?tempo=) e escolhe a imagem.
function fundoTempoLoja() {
  return lojaFundoPara(tempoAtual());
}

// ---------------------------------------------------------------------
// ECRÃ E LINHA DA QUINTA
// ---------------------------------------------------------------------

// Só em memória: o resultado da última venda, para mostrar o agradecimento até se sair do ecrã.
let lojaResultado = null; // { rep } ou null
let lojaOcupado = false;
let lojaUltimoCliqueMs = -Infinity;
const LOJA_ENTRE_CLIQUES_MS = 500; // duplo clique: um 2.º toque antes disto é ignorado (cada venda é válida, mas ninguém vende duas sem querer)

function lojaDiaDeHoje() {
  return diaLisboaDeHoje();
}

// Linha no cartão da Quinta, só com o ecrã desbloqueado (como a da Estrada e a da Cepa Roxa).
function atualizarLinhaLojaQuinta() {
  const container = document.getElementById('loja-linha-container');
  if (!container) return;
  if (typeof ecraDesbloqueado !== 'function' || !ecraDesbloqueado('loja')) { container.innerHTML = ''; return; }
  container.innerHTML =
    '<div class="mini-bloco">' +
      '<button type="button" class="visita-linha" onclick="goTo(\'loja\')">' + t('loja.linha') + '</button>' +
    '</div>';
}

// O que o ecrã diz por baixo da descrição (só lê).
function lojaTextoEstado(p) {
  if (p.motivo === 'limite') return t('loja.limite').replace('{n}', p.limite);
  if (p.motivo === 'sem_bagaceira') return t('loja.semBagaceira');
  return '';
}

function lojaDesenhar() {
  const container = document.getElementById('loja-container');
  if (!container) return;
  const p = lojaPodeVender(state, lojaDiaDeHoje());
  const cfg = LOJA_CONFIG;
  const estadoTexto = lojaTextoEstado(p);

  container.innerHTML =
    '<div class="topcard">' +
      '<p class="mini-title" data-i18n="loja.title"></p>' +
      '<p class="mini-sub">' + t('loja.estado').replace('{n}', p.bagaceiras).replace('{v}', p.vendasHoje).replace('{max}', p.limite) + '</p>' +
    '</div>' +
    '<div class="action-panel loja-painel">' +
      '<div class="loja-info">' +
        '<p>' + t('loja.desc').replace('{rep}', cfg.reputacaoPorBagaceira).replace('{n}', cfg.vendasPorDia) + '</p>' +
        (lojaResultado ? '<p class="loja-ok">' + t('loja.ok').replace('{rep}', lojaResultado.rep) + '</p>' : '') +
        (estadoTexto ? '<p>' + estadoTexto + '</p>' : '') +
      '</div>' +
      '<button type="button" class="btn-pill pill-main loja-botao" onclick="lojaVenderClique()"' + (p.ok ? '' : ' disabled') + '>' +
        t('loja.btn').replace('{rep}', cfg.reputacaoPorBagaceira) + '</button>' +
      '<button type="button" class="btn-ghost" onclick="voltarEcraAnterior()" data-i18n="nav.voltar"></button>' +
    '</div>';

  // Fundo pelo tempo, como a Vinha (a entrada de FUNDO_DOS_ECRAS em js/main.js é só o de reserva).
  definirFundo('foto', fundoTempoLoja());

  if (lojaResultado) atualizarDialogo(t('loja.fala'), 'YoshiCat');
  else atualizarDialogo('', '');
  applyTranslations();
}

// Ao entrar no ecrã (ver goTo() em js/main.js): esquece o resultado da visita anterior.
function renderLoja() {
  lojaResultado = null;
  lojaDesenhar();
}

// O ÚNICO sítio que vende e grava. Toque no botão: desativa-o logo, ignora um 2.º toque quase seguido (duplo clique), vende
// (lojaVender) e, se correu bem, grava UMA vez e atualiza a barra de cima. Se recusou, não grava. É o único sítio que lê o relógio
// (só para o duplo clique): as regras são puras.
function lojaVenderClique() {
  if (lojaOcupado) return;
  const agora = Date.now();
  if (agora - lojaUltimoCliqueMs < LOJA_ENTRE_CLIQUES_MS) return;
  lojaUltimoCliqueMs = agora;
  lojaOcupado = true;
  try {
    const botao = document.querySelector('.loja-botao');
    if (botao) botao.disabled = true;
    const r = lojaVender(state, lojaDiaDeHoje());
    if (r.ok) {
      saveState(state);
      updateStatsDisplays();
      lojaResultado = { rep: r.reputacaoGanha };
      if (typeof vibrar === 'function') vibrar('sucesso');
      if (typeof tocarSom === 'function') tocarSom('objetivoCumprido');
    } else {
      lojaResultado = null;
    }
  } finally {
    lojaOcupado = false;
  }
  lojaDesenhar();
}
