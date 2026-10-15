// ---------------------------------------------------------------------
// DADOS NOVOS — a "caixa de correio" do jogo para conteúdo escrito só
// como dados (ver dados/LEIAME.md). Os ficheiros de dados/ chamam
// dadosAcrescentar(tipo, entrada); a entrada é conferida e, se estiver
// bem, entra no fim da lista certa (VISITAS, NIVEIS_CONFIG,
// HISTORIA_NIVEIS, CAPITULOS_CONFIG, ENCYCLOPEDIA_ENTRIES).
//
// Regras:
//   - Nunca lança erro nem parte o arranque: uma entrada má é IGNORADA e
//     avisa na consola (console.warn) com o motivo.
//   - Nunca substitui nem muda uma entrada que já existe: só acrescenta.
//   - Carrega DEPOIS dos ficheiros que definem as listas (niveis.js,
//     historia.js, capitulos.js, visitas.js, explorar.js) e ANTES de js/main.js.
//
// Tipos: 'visitas', 'niveis', 'historias', 'capitulos' e 'enciclopedia'. 'objetivos' ainda
// NÃO é suportado: cada objetivo precisa de uma regra no código
// (elegivel() em js/objetivos.js) e o objetivos.js gera os do dia ao
// carregar, antes de este ficheiro correr.
//
// Entradas (todos os textos são { pt, en, es }, as 3 línguas escritas):
//   visitas:   { id, personagem, reputacao (1 a 3), condicao (ou null), texto }
//   niveis:    { id, min (maior que o do último nível), nome  OU  nomeKey }
//   historias: { id, nivel (a partir do 2, ainda sem história),
//                falas: [ { texto  OU  chave, foto, som, pos } ] }
//   capitulos: { id, nivel, criterio: [ ... ], titulo, objetivo, conclusao, falante }
//   enciclopedia: { id, titulo, texto, nivelMinimo (inteiro >= 1), imagem (caminho em assets/, opcional),
//                   meses (lista de 1 a 12, opcional), estacao (opcional), manual (true, opcional) }
//                 entra nas 3 línguas de ENCYCLOPEDIA_ENTRIES (js/explorar.js); só existe para o jogador
//                 a partir do nível "nivelMinimo" (ver encyclopediaEntries em js/explorar.js).
// ---------------------------------------------------------------------

const DADOS_TIPOS = ['visitas', 'niveis', 'historias', 'capitulos', 'enciclopedia', 'objetivos'];
const DADOS_LINGUAS = ['pt', 'en', 'es'];
const DADOS_FORMATO_ID = /^[a-z0-9_]+$/;
const DADOS_CONDICOES_VISITA = ['estacao', 'fase', 'festa', 'garrafa', 'cave'];
const DADOS_ESTACOES = ['inverno', 'primavera', 'verao', 'outono'];
// A imagem de uma entrada da enciclopédia: um ficheiro de assets/ (sem "..", sem aspas, sem http:// nem javascript:).
const DADOS_FORMATO_IMAGEM = /^assets\/[A-Za-z0-9_\-\/.]+\.(jpg|jpeg|png|webp|gif)$/;
const DADOS_CRITERIOS = ['numero', 'booleano', 'contarChaves', 'temChaves', 'temIds', 'contarLista', 'coresColecao', 'algumaEntrada'];
// Um id de uma lista de ids de um critério (temIds): letras, números e _ (os ids da Enciclopédia de hoje têm maiúsculas).
const DADOS_FORMATO_ID_CRITERIO = /^[A-Za-z0-9_]+$/;

// O que já entrou por aqui: { id } por tipo (e { id, nivel } nas histórias). Serve para os
// testes e para o validador (scripts/verificar-dados.js) saberem o que veio de dados/.
const DADOS_ACRESCENTADOS = { visitas: [], niveis: [], historias: [], capitulos: [], enciclopedia: [], objetivos: [] };

function dadosAvisar(tipo, entrada, motivo) {
  let nome = '?';
  let id = '?';
  try { nome = String(tipo); } catch (e) { /* tipo ilegível */ }
  try { if (entrada && typeof entrada === 'object' && typeof entrada.id === 'string') id = entrada.id; } catch (e) { /* entrada ilegível */ }
  try { console.warn('[dados] ' + nome + ' "' + id + '" ignorada: ' + motivo); } catch (e) { /* sem consola */ }
}

function dadosTemTexto(v) { return typeof v === 'string' && v.trim() !== ''; }
function dadosEObjeto(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

// Texto { pt, en, es }: as 3 línguas, não vazias. Devolve o motivo, ou null se está bem.
function dadosMotivoTexto3(texto, rotulo) {
  if (!dadosEObjeto(texto)) return 'falta ' + rotulo + ' ({ pt, en, es })';
  for (let i = 0; i < DADOS_LINGUAS.length; i++) {
    if (!dadosTemTexto(texto[DADOS_LINGUAS[i]])) return 'falta ' + rotulo + ' em ' + DADOS_LINGUAS[i];
  }
  return null;
}

// Chave de js/i18n.js escrita nas 3 línguas.
function dadosChaveExiste(chave) {
  if (!dadosTemTexto(chave) || typeof TRANSLATIONS === 'undefined') return false;
  for (let i = 0; i < DADOS_LINGUAS.length; i++) {
    const dict = TRANSLATIONS[DADOS_LINGUAS[i]];
    if (!dict || !dadosTemTexto(dict[chave])) return false;
  }
  return true;
}

function dadosJaTemId(lista, id) {
  return lista.some(function (x) { return x && x.id === id; });
}

// --- Um conferidor por tipo: devolve o motivo para ignorar, ou null se a entrada está boa. ---

function dadosMotivoVisita(e) {
  if (typeof VISITAS === 'undefined' || typeof VISITAS_PERSONAGENS === 'undefined') return 'o jogo ainda não tem a lista VISITAS (ordem dos scripts)';
  if (dadosJaTemId(VISITAS, e.id)) return 'já existe uma visita com este id';
  if (!VISITAS_PERSONAGENS.some(function (p) { return p.id === e.personagem; })) return 'a personagem "' + e.personagem + '" não existe';
  if (!Number.isInteger(e.reputacao) || e.reputacao < 1 || e.reputacao > 3) return 'a reputacao devia ser um inteiro de 1 a 3';
  const m = dadosMotivoTexto3(e.texto, 'o texto');
  if (m) return m;
  const c = e.condicao;
  if (c === undefined || c === null) return null;
  if (!dadosEObjeto(c) || DADOS_CONDICOES_VISITA.indexOf(c.tipo) === -1) return 'a condição não é de um tipo conhecido (' + DADOS_CONDICOES_VISITA.join(', ') + ')';
  if (c.tipo === 'estacao' && !dadosTemTexto(c.valor)) return 'a condição estacao precisa de "valor"';
  if (c.tipo === 'fase' && (!Array.isArray(c.valores) || c.valores.length === 0 || !c.valores.every(dadosTemTexto))) return 'a condição fase precisa de uma lista "valores"';
  return null;
}

function dadosMotivoNivel(e) {
  if (typeof NIVEIS_CONFIG === 'undefined') return 'o jogo ainda não tem a lista NIVEIS_CONFIG (ordem dos scripts)';
  if (dadosJaTemId(NIVEIS_CONFIG, e.id)) return 'já existe um nível com este id';
  const ultimo = NIVEIS_CONFIG[NIVEIS_CONFIG.length - 1];
  if (!Number.isInteger(e.min) || (ultimo && e.min <= ultimo.min)) return 'o limiar (min) devia ser um inteiro maior que o do último nível (' + (ultimo ? ultimo.min : 0) + ')';
  if (e.nome !== undefined) return dadosMotivoTexto3(e.nome, 'o nome');
  if (!dadosChaveExiste(e.nomeKey)) return 'falta o nome ({ pt, en, es }) ou uma nomeKey que exista no i18n.js nas 3 línguas';
  return null;
}

function dadosMotivoFala(f) {
  if (!dadosEObjeto(f)) return 'uma fala não é um objeto';
  if (f.texto !== undefined) {
    const m = dadosMotivoTexto3(f.texto, 'o texto da fala');
    if (m) return m;
  } else if (!dadosChaveExiste(f.chave)) {
    return 'uma fala precisa de texto ({ pt, en, es }) ou de uma chave que exista no i18n.js nas 3 línguas';
  }
  if (f.foto !== undefined && !dadosTemTexto(f.foto)) return 'a foto de uma fala devia ser um caminho';
  if (f.som !== undefined && !dadosTemTexto(f.som)) return 'o som de uma fala devia ser um caminho';
  return null;
}

function dadosMotivoHistoria(e) {
  if (typeof HISTORIA_NIVEIS === 'undefined') return 'o jogo ainda não tem a lista HISTORIA_NIVEIS (ordem dos scripts)';
  if (!Number.isInteger(e.nivel) || e.nivel < 2) return 'o nível devia ser um inteiro a partir do 2';
  if (Object.prototype.hasOwnProperty.call(HISTORIA_NIVEIS, e.nivel)) return 'o nível ' + e.nivel + ' já tem história';
  if (!Array.isArray(e.falas) || e.falas.length === 0) return 'falta a lista de falas';
  for (let i = 0; i < e.falas.length; i++) {
    const m = dadosMotivoFala(e.falas[i]);
    if (m) return m;
  }
  return null;
}

function dadosMotivoCriterio(a) {
  if (!dadosEObjeto(a) || DADOS_CRITERIOS.indexOf(a.tipo) === -1) return 'um critério não é de um tipo conhecido (' + DADOS_CRITERIOS.join(', ') + ')';
  if (a.tipo !== 'coresColecao' && !dadosTemTexto(a.caminho)) return 'um critério precisa do "caminho" no estado';
  if (a.tipo === 'temChaves') {
    if (!Array.isArray(a.chaves) || a.chaves.length === 0 || !a.chaves.every(dadosTemTexto)) return 'temChaves precisa de uma lista "chaves" de textos';
  } else if (a.tipo === 'temIds') {
    if (!Array.isArray(a.ids) || a.ids.length === 0 || !a.ids.every(function (id) { return typeof id === 'string' && DADOS_FORMATO_ID_CRITERIO.test(id); })) return 'temIds precisa de uma lista "ids" de textos (letras, números e _)';
    if (a.ids.some(function (id, i) { return a.ids.indexOf(id) !== i; })) return 'temIds tem ids repetidos';
  } else if (a.tipo !== 'booleano' && !(typeof a.alvo === 'number' && a.alvo > 0) && a.alvo !== 'totalEnciclopedia') {
    return 'um critério precisa do "alvo" (número maior que 0)';
  }
  if (a.tipo === 'algumaEntrada' && !dadosTemTexto(a.campo)) return 'algumaEntrada precisa do "campo"';
  return null;
}

function dadosMotivoCapitulo(e) {
  if (typeof CAPITULOS_CONFIG === 'undefined') return 'o jogo ainda não tem a lista CAPITULOS_CONFIG (ordem dos scripts)';
  if (dadosJaTemId(CAPITULOS_CONFIG, e.id)) return 'já existe um capítulo com este id';
  if (!Number.isInteger(e.nivel) || e.nivel < 1) return 'o nível devia ser um inteiro a partir do 1';
  if (!Array.isArray(e.criterio) || e.criterio.length === 0) return 'falta o critério (lista de alternativas)';
  for (let i = 0; i < e.criterio.length; i++) {
    const m = dadosMotivoCriterio(e.criterio[i]);
    if (m) return m;
  }
  const textos = ['titulo', 'objetivo', 'conclusao'];
  for (let i = 0; i < textos.length; i++) {
    const m = dadosMotivoTexto3(e[textos[i]], textos[i]);
    if (m) return m;
  }
  if (e.falante !== undefined && (typeof PERSONAGENS_CARAS === 'undefined' || !Object.prototype.hasOwnProperty.call(PERSONAGENS_CARAS, e.falante))) return 'o falante "' + e.falante + '" não existe em PERSONAGENS_CARAS';
  return null;
}

function dadosMotivoEnciclopedia(e) {
  if (typeof ENCYCLOPEDIA_ENTRIES === 'undefined' || !DADOS_LINGUAS.every(function (l) { return Array.isArray(ENCYCLOPEDIA_ENTRIES[l]); })) return 'o jogo ainda não tem a lista ENCYCLOPEDIA_ENTRIES (ordem dos scripts)';
  // O id novo não pode repetir nenhum id que exista, em NENHUMA das línguas.
  if (DADOS_LINGUAS.some(function (l) { return dadosJaTemId(ENCYCLOPEDIA_ENTRIES[l], e.id); })) return 'já existe uma entrada da enciclopédia com este id';
  let m = dadosMotivoTexto3(e.titulo, 'o título');
  if (m) return m;
  m = dadosMotivoTexto3(e.texto, 'o texto');
  if (m) return m;
  if (!Number.isInteger(e.nivelMinimo) || e.nivelMinimo < 1) return 'o nivelMinimo devia ser um inteiro a partir do 1';
  if (e.imagem !== undefined && !(typeof e.imagem === 'string' && DADOS_FORMATO_IMAGEM.test(e.imagem) && e.imagem.indexOf('..') === -1)) return 'a imagem devia ser um caminho de assets/ (ex.: assets/ecras/ficheiro.jpg)';
  if (e.meses !== undefined && (!Array.isArray(e.meses) || e.meses.length === 0 || !e.meses.every(function (n) { return Number.isInteger(n) && n >= 1 && n <= 12; }))) return 'os meses deviam ser uma lista de números de 1 a 12';
  if (e.estacao !== undefined && DADOS_ESTACOES.indexOf(e.estacao) === -1) return 'a estacao devia ser uma de ' + DADOS_ESTACOES.join(', ');
  if (e.manual !== undefined && e.manual !== true) return 'manual, se existir, devia ser true';
  return null;
}

// --- Cada tipo copia só os campos que conhece (o resto da entrada fica de fora). ---

function dadosInserirVisita(e) {
  VISITAS.push({ id: e.id, personagem: e.personagem, reputacao: e.reputacao, condicao: e.condicao || null, texto: e.texto });
}

function dadosInserirNivel(e) {
  const nivel = { id: e.id, min: e.min };
  if (e.nome !== undefined) nivel.nome = e.nome; else nivel.nomeKey = e.nomeKey;
  NIVEIS_CONFIG.push(nivel);
}

function dadosInserirHistoria(e) {
  HISTORIA_NIVEIS[e.nivel] = e.falas.map(function (f) {
    const fala = {};
    if (f.texto !== undefined) fala.texto = f.texto; else fala.chave = f.chave;
    if (f.foto !== undefined) fala.foto = f.foto;
    if (f.som !== undefined) fala.som = f.som;
    if (f.pos !== undefined) fala.pos = f.pos;
    return fala;
  });
}

function dadosInserirCapitulo(e) {
  const c = { id: e.id, nivel: e.nivel, criterio: e.criterio, titulo: e.titulo, objetivo: e.objetivo, conclusao: e.conclusao };
  if (e.falante !== undefined) c.falante = e.falante;
  CAPITULOS_CONFIG.push(c);
}

// A entrada entra nas 3 línguas, com o mesmo id e os mesmos campos opcionais (cada língua com o seu título e texto).
function dadosInserirEnciclopedia(e) {
  DADOS_LINGUAS.forEach(function (l) {
    const nova = { id: e.id };
    if (e.meses !== undefined) nova.meses = e.meses.slice();
    if (e.estacao !== undefined) nova.estacao = e.estacao;
    if (e.manual !== undefined) nova.manual = true;
    if (e.imagem !== undefined) nova.imagem = e.imagem;
    nova.titulo = e.titulo[l];
    nova.texto = e.texto[l];
    nova.nivelMinimo = e.nivelMinimo;
    ENCYCLOPEDIA_ENTRIES[l].push(nova);
  });
}

const DADOS_CONFERIDORES = { visitas: dadosMotivoVisita, niveis: dadosMotivoNivel, historias: dadosMotivoHistoria, capitulos: dadosMotivoCapitulo, enciclopedia: dadosMotivoEnciclopedia };
const DADOS_INSERTORES = { visitas: dadosInserirVisita, niveis: dadosInserirNivel, historias: dadosInserirHistoria, capitulos: dadosInserirCapitulo, enciclopedia: dadosInserirEnciclopedia };

// Acrescenta UMA entrada. Devolve true se entrou, false se foi ignorada (com um console.warn
// a dizer porquê). Nunca lança erro.
function dadosAcrescentar(tipo, entrada) {
  try {
    if (DADOS_TIPOS.indexOf(tipo) === -1) { dadosAvisar(tipo, entrada, 'tipo desconhecido (' + DADOS_TIPOS.join(', ') + ')'); return false; }
    if (tipo === 'objetivos') { dadosAvisar(tipo, entrada, 'o tipo "objetivos" ainda não é suportado'); return false; }
    if (!dadosEObjeto(entrada)) { dadosAvisar(tipo, entrada, 'a entrada não é um objeto'); return false; }
    if (!dadosTemTexto(entrada.id)) { dadosAvisar(tipo, entrada, 'falta o id'); return false; }
    if (!DADOS_FORMATO_ID.test(entrada.id)) { dadosAvisar(tipo, entrada, 'o id devia ter só a-z, 0-9 e _'); return false; }
    if (DADOS_ACRESCENTADOS[tipo].some(function (x) { return x.id === entrada.id; })) { dadosAvisar(tipo, entrada, 'este id já foi acrescentado'); return false; }
    const motivo = DADOS_CONFERIDORES[tipo](entrada);
    if (motivo) { dadosAvisar(tipo, entrada, motivo); return false; }
    DADOS_INSERTORES[tipo](entrada);
    DADOS_ACRESCENTADOS[tipo].push(tipo === 'historias' ? { id: entrada.id, nivel: entrada.nivel } : { id: entrada.id });
    return true;
  } catch (e) {
    dadosAvisar(tipo, entrada, 'erro inesperado');
    return false;
  }
}
