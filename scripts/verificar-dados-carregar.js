#!/usr/bin/env node
// A "caixa de correio" dadosAcrescentar(tipo, entrada) de js/dados.js e a pasta dados/:
// 1) uma entrada boa é acrescentada à lista certa (visitas, níveis, histórias, capítulos) e o jogo usa-a;
// 2) entradas más (id repetido, id mal formado, tipo desconhecido, não-objeto, campos em falta, tipo
//    "objetivos" ainda não suportado) são IGNORADAS com um console.warn, sem lançar erro e sem mudar nada;
// 3) uma entrada que já existe nunca é substituída;
// 4) o index.html carrega o dados.js e os 6 ficheiros de dados/ depois das listas e antes do main.js, e
//    os ficheiros de dados/ só trazem o que está combinado: a visita marisa_5 e os pacotes dos níveis 11 e 12 (nível,
//    história, 3 histórias da Enciclopédia e capítulo cada); objetivos.js só tem comentários; as listas de origem ficam iguais.
// As entradas de teste vivem só no ambiente simulado (módulo vm); nada fica no jogo.
//
// Uso: node scripts/verificar-dados-carregar.js
// JS_DIR=pasta  INDEX_HTML=ficheiro  corre sobre outra versão dos js/ ou do index.html (para provar que
//   os testes apanham o que se estraga).
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.
const fs = require('fs');
const path = require('path');
const { abrirJogo, FICHEIROS_DE_DADOS } = require('./_jogo-vm');

const RAIZ = path.join(__dirname, '..');
const JS_DIR = process.env.JS_DIR || path.join(RAIZ, 'js');
const INDEX_HTML = process.env.INDEX_HTML || path.join(RAIZ, 'index.html');
let falhas = 0;
function ok(cond, msg) { if (!cond) { falhas++; console.log('FALHA: ' + msg); } }

const avisos = [];
// As secções 0 a 5 correm sobre o jogo de origem (dadosDir: null = sem a pasta dados/), para provarem a caixa de correio
// sem se misturarem com a visita real de dados/visitas.js; a secção 0b e a 6 tratam da pasta dados/.
const jogo = abrirJogo({ jsDir: JS_DIR, dadosDir: null, aoAvisar: function (m) { avisos.push(m); } });
const ev = jogo.ev;
function js(obj) { return JSON.stringify(obj); }
function acrescentar(tipo, entrada) { return ev('dadosAcrescentar(' + js(tipo) + ', ' + js(entrada) + ')'); }
function estado() {
  return js([ev('VISITAS.length'), ev('NIVEIS_CONFIG.length'), Object.keys(ev('HISTORIA_NIVEIS')).join(), ev('CAPITULOS_CONFIG.length'),
    ev('OBJETIVOS_GRUPO_C.length'), ev('DADOS_ACRESCENTADOS')]);
}
// Esta entrada deve ser ignorada: devolve false, avisa na consola e não muda nada.
function ignorada(tipo, entrada, porque) {
  const antes = estado();
  const n = avisos.length;
  let r;
  try { r = acrescentar(tipo, entrada); } catch (e) { ok(false, porque + ': lançou erro (' + e.message + ')'); return; }
  ok(r === false, porque + ': devia devolver false');
  ok(avisos.length === n + 1 && avisos[n].indexOf('[dados]') === 0, porque + ': devia fazer um console.warn');
  ok(estado() === antes, porque + ': não devia mudar nada');
}

const TEXTO = function (pt) { return { pt: pt, en: pt + ' (en)', es: pt + ' (es)' }; };

// ----- 0. Ponto de partida: o jogo de origem (sem a pasta dados/) não acrescenta nada -----
{
  ok(avisos.length === 0, 'carregar o jogo de origem não devia avisar nada: ' + avisos);
  ok(ev('DADOS_ACRESCENTADOS.visitas.length + DADOS_ACRESCENTADOS.niveis.length + DADOS_ACRESCENTADOS.historias.length + DADOS_ACRESCENTADOS.capitulos.length + DADOS_ACRESCENTADOS.objetivos.length') === 0, 'dados/ devia estar vazio');
  ok(ev('VISITAS.length') === 12 && ev('NIVEIS_CONFIG.length') === 10 && ev('CAPITULOS_CONFIG.length') === 10 && ev('OBJETIVOS_GRUPO_C.length') === 5, 'o jogo devia ter as listas de sempre (12 visitas, 10 níveis, 10 capítulos, 5 do Grupo C)');
  ok(Object.keys(ev('HISTORIA_NIVEIS')).join() === '2,3,4,5,6,7,8,9,10', 'o jogo devia ter as histórias dos níveis 2 a 10');
}

// O que dados/ traz de verdade, ficheiro a ficheiro (os ids pela ordem em que aparecem): a visita marisa_5 e os pacotes dos
// níveis 11 («Moscatel da Arrábida») e 12 («Moscatel do Sado»), cada um com nível, história, 3 histórias da Enciclopédia e
// capítulo. Os outros testes de dados (verificar-nivel-11.js, verificar-nivel-12.js, verificar-enciclopedia-dados.js) provam
// o conteúdo; aqui prova-se que nada mais entra por dados/ (cada nível novo acrescenta aqui os seus ids).
const IDS_ARRABIDA = ['arrabida_biosfera', 'arrabida_plantas', 'arrabida_mar'];
const IDS_SADO = ['sado_reserva', 'sado_golfinhos', 'sado_troia'];
const ESPERADO_EM_DADOS = {
  'visitas.js': ['marisa_5'], 'niveis.js': ['nivel_11', 'nivel_12'], 'historias.js': ['historia_11', 'historia_12'], 'capitulos.js': ['cap11', 'cap12'],
  'objetivos.js': [], 'enciclopedia.js': IDS_ARRABIDA.concat(IDS_SADO)
};

// ----- 0b. Com a pasta dados/ real: só a visita marisa_5 e o pacote do nível 11 vêm de lá; o jogo de origem fica igual -----
{
  const avisos2 = [];
  const real = abrirJogo({ jsDir: JS_DIR, explorar: true, aoAvisar: function (m) { avisos2.push(m); } });
  ok(avisos2.length === 0, 'carregar o jogo com a pasta dados/ não devia avisar nada: ' + avisos2);
  const idsDe = function (tipo) { return real.ev('DADOS_ACRESCENTADOS.' + tipo + '.map(function (v) { return v.id; }).join()'); };
  ok(idsDe('visitas') === 'marisa_5', 'de dados/ só devia vir a visita marisa_5: ' + idsDe('visitas'));
  ok(idsDe('niveis') === 'nivel_11,nivel_12' && idsDe('historias') === 'historia_11,historia_12' && idsDe('capitulos') === 'cap11,cap12', 'de dados/ só deviam vir os pacotes dos níveis 11 e 12 (nivel_11/12, historia_11/12, cap11/12)');
  ok(idsDe('enciclopedia') === IDS_ARRABIDA.concat(IDS_SADO).join(), 'de dados/ só deviam vir as 3 histórias da Arrábida e as 3 do Sado, por esta ordem: ' + idsDe('enciclopedia'));
  ok(idsDe('objetivos') === '', 'dados/ não devia trazer objetivos');
  ok(real.ev('VISITAS.length') === 13 && real.ev('NIVEIS_CONFIG.length') === 12 && real.ev('CAPITULOS_CONFIG.length') === 12 && real.ev('OBJETIVOS_GRUPO_C.length') === 5, 'com dados/ devia haver 13 visitas, 12 níveis, 12 capítulos e os 5 do Grupo C');
  ok(Object.keys(real.ev('HISTORIA_NIVEIS')).join() === '2,3,4,5,6,7,8,9,10,11,12' && real.ev('ENCYCLOPEDIA_ENTRIES.pt.length') === 38, 'com dados/ devia haver histórias dos níveis 2 a 12 e 38 entradas da Enciclopédia');
  ok(real.ev('JSON.stringify(VISITAS.slice(0, 12))') === ev('JSON.stringify(VISITAS)'), 'as 12 visitas de origem (e a sua ordem) deviam ficar iguais com dados/');
  ok(real.ev('JSON.stringify(NIVEIS_CONFIG.slice(0, 10))') === ev('JSON.stringify(NIVEIS_CONFIG)'), 'os 10 níveis de origem deviam ficar iguais com dados/');
  ok(real.ev('JSON.stringify(CAPITULOS_CONFIG.slice(0, 10))') === ev('JSON.stringify(CAPITULOS_CONFIG)'), 'os 10 capítulos de origem deviam ficar iguais com dados/');
  ok(real.ev('JSON.stringify([2,3,4,5,6,7,8,9,10].map(function (n) { return HISTORIA_NIVEIS[n]; }))') === ev('JSON.stringify([2,3,4,5,6,7,8,9,10].map(function (n) { return HISTORIA_NIVEIS[n]; }))'), 'as histórias dos níveis 2 a 10 deviam ficar iguais com dados/');
  ok(real.ev('VISITAS[12].id') === 'marisa_5' && real.ev('NIVEIS_CONFIG[10].id') === 'nivel_11' && real.ev('NIVEIS_CONFIG[11].id') === 'nivel_12' && real.ev('CAPITULOS_CONFIG[10].id') === 'cap11' && real.ev('CAPITULOS_CONFIG[11].id') === 'cap12', 'as entradas de dados/ ficam no fim das listas, por ordem');
}

// ----- 1. Visitas -----
{
  const boa = { id: 'valentim_teste', personagem: 'valentim', reputacao: 2, condicao: { tipo: 'estacao', valor: 'inverno' }, texto: TEXTO('Olá') };
  ok(acrescentar('visitas', boa) === true, 'visita boa: devia entrar');
  ok(ev('VISITAS.length') === 13 && ev("visitaPorId('valentim_teste').texto.en") === 'Olá (en)', 'visita boa: devia ficar em VISITAS e achar-se por id');
  ok(ev("escolherVisitaDoDia([], { nivel: 4, estacao: 'inverno', fase: 'repouso', festaAtiva: false, caveAberta: false, garrafaDias: null }, '2026-01-05')") !== undefined, 'a escolha da visita do dia devia continuar a funcionar');
  ok(ev("visitaCondicaoOk(visitaPorId('valentim_teste'), { nivel: 4, estacao: 'inverno' })") === true, 'a condição da visita nova devia funcionar');
  ok(acrescentar('visitas', { id: 'sem_condicao_teste', personagem: 'marisa', reputacao: 1, texto: TEXTO('Sem condição') }) === true, 'visita sem condicao: devia entrar');
  ok(ev("visitaPorId('sem_condicao_teste').condicao") === null, 'visita sem condicao: devia ficar com condicao null');
  ignorada('visitas', boa, 'visita: id repetido (já acrescentado)');
  const original = ev("JSON.stringify(visitaPorId('valentim_1'))");
  ignorada('visitas', { id: 'valentim_1', personagem: 'valentim', reputacao: 3, condicao: null, texto: TEXTO('Outra') }, 'visita: id de uma visita que já existe no jogo');
  ok(ev("JSON.stringify(visitaPorId('valentim_1'))") === original, 'visita: a que já existia não devia mudar');
  ignorada('visitas', { id: 'Valentim-9', personagem: 'valentim', reputacao: 1, texto: TEXTO('x') }, 'visita: id mal formado (maiúscula e hífen)');
  ignorada('visitas', { id: 'com espaco', personagem: 'valentim', reputacao: 1, texto: TEXTO('x') }, 'visita: id com espaço');
  ignorada('visitas', { id: '', personagem: 'valentim', reputacao: 1, texto: TEXTO('x') }, 'visita: id vazio');
  ignorada('visitas', { personagem: 'valentim', reputacao: 1, texto: TEXTO('x') }, 'visita: sem id');
  ignorada('visitas', { id: 'sem_personagem_t', personagem: 'ninguem', reputacao: 1, texto: TEXTO('x') }, 'visita: personagem que não existe');
  ignorada('visitas', { id: 'reputacao_t', personagem: 'valentim', reputacao: 9, texto: TEXTO('x') }, 'visita: reputacao fora de 1 a 3');
  ignorada('visitas', { id: 'sem_es_t', personagem: 'valentim', reputacao: 1, texto: { pt: 'a', en: 'b' } }, 'visita: falta o es');
  ignorada('visitas', { id: 'sem_texto_t', personagem: 'valentim', reputacao: 1 }, 'visita: sem texto');
  ignorada('visitas', { id: 'condicao_t', personagem: 'valentim', reputacao: 1, condicao: { tipo: 'lua' }, texto: TEXTO('x') }, 'visita: condição de tipo desconhecido');
}

// ----- 2. Níveis -----
{
  const boa = { id: 'nivel_teste', min: 3600, nome: TEXTO('Teste') };
  ok(acrescentar('niveis', boa) === true, 'nível bom: devia entrar');
  ok(ev('NIVEIS_CONFIG.length') === 11 && ev('nivelPelaReputacao(3600)') === 11 && ev('nivelPelaReputacao(3599)') === 10, 'nível bom: devia ser o nível 11 a partir de 3600');
  ok(ev("(function () { currentLang = 'en'; return nivelNome(NIVEIS_CONFIG[10]); })()") === 'Teste (en)', 'nível bom: o nome devia vir da entrada');
  ignorada('niveis', boa, 'nível: id repetido');
  ignorada('niveis', { id: 'nivel_baixo_t', min: 3000, nome: TEXTO('x') }, 'nível: limiar que não sobe');
  ignorada('niveis', { id: 'nivel_igual_t', min: 3600, nome: TEXTO('x') }, 'nível: limiar igual ao do último');
  ignorada('niveis', { id: 'nivel_sem_nome', min: 4000 }, 'nível: sem nome');
  ignorada('niveis', { id: 'nivel_sem_en', min: 4000, nome: { pt: 'a', es: 'b' } }, 'nível: falta o en');
  ignorada('niveis', { id: 'nivel_chave_t', min: 4000, nomeKey: 'nivel.nome.nao_existe' }, 'nível: nomeKey que não existe');
  ignorada('niveis', { id: 'nivel_min_t', min: '4000', nome: TEXTO('x') }, 'nível: limiar que não é número');
  ok(acrescentar('niveis', { id: 'nivel_chave_ok', min: 4000, nomeKey: 'nivel.nome.1' }) === true, 'nível com nomeKey que existe: devia entrar');
}

// ----- 3. Histórias -----
{
  const boa = { id: 'historia_teste', nivel: 11, falas: [{ texto: TEXTO('Fala 1'), foto: 'assets/mapa/mapa_quinta.jpg' }, { chave: 'historia.nivel2.2' }] };
  ok(acrescentar('historias', boa) === true, 'história boa: devia entrar');
  ok(ev('HISTORIA_NIVEIS[11].length') === 2, 'história boa: devia ficar em HISTORIA_NIVEIS[11]');
  ok(ev("(function () { currentLang = 'es'; return traduzirFalasHistoria(HISTORIA_NIVEIS[11])[0].texto; })()") === 'Fala 1 (es)', 'história boa: a fala devia vir da entrada');
  ok(ev('traduzirFalasHistoria(HISTORIA_NIVEIS[11])[1].texto') === ev("t('historia.nivel2.2')"), 'história boa: a fala com chave devia vir do i18n.js');
  ignorada('historias', boa, 'história: id repetido');
  const nivel5 = ev('JSON.stringify(HISTORIA_NIVEIS[5])');
  ignorada('historias', { id: 'historia_5_t', nivel: 5, falas: [{ texto: TEXTO('x') }] }, 'história: nível que já tem história');
  ok(ev('JSON.stringify(HISTORIA_NIVEIS[5])') === nivel5, 'história: a do nível 5 não devia mudar');
  ignorada('historias', { id: 'historia_1_t', nivel: 1, falas: [{ texto: TEXTO('x') }] }, 'história: nível 1');
  ignorada('historias', { id: 'historia_vazia_t', nivel: 12, falas: [] }, 'história: sem falas');
  ignorada('historias', { id: 'historia_semfalas_t', nivel: 12 }, 'história: sem lista de falas');
  ignorada('historias', { id: 'historia_chave_t', nivel: 12, falas: [{ chave: 'historia.nao_existe' }] }, 'história: chave que não existe');
  ignorada('historias', { id: 'historia_fala_t', nivel: 12, falas: ['texto solto'] }, 'história: fala que não é objeto');
  ignorada('historias', { id: 'historia_en_t', nivel: 12, falas: [{ texto: { pt: 'a', es: 'b' } }] }, 'história: fala sem en');
}

// ----- 4. Capítulos -----
{
  const boa = {
    id: 'cap_teste', nivel: 11, criterio: [{ tipo: 'numero', caminho: 'garrafas', alvo: 1 }],
    titulo: TEXTO('Título'), objetivo: TEXTO('Objetivo'), conclusao: TEXTO('Conclusão')
  };
  ok(acrescentar('capitulos', boa) === true, 'capítulo bom: devia entrar');
  ok(ev('CAPITULOS_CONFIG.length') === 11, 'capítulo bom: devia ficar em CAPITULOS_CONFIG');
  ok(ev("(function () { currentLang = 'en'; return cStr('cap_teste').titulo + '|' + cStr('cap_teste').objetivo + '|' + capituloConclusao('cap_teste'); })()") === 'Título (en)|Objetivo (en)|Conclusão (en)', 'capítulo bom: os textos deviam vir da entrada');
  ok(ev("capitulosLerCriterio(CAPITULOS_CONFIG[10]).total") === 1, 'capítulo bom: o critério devia ler-se');
  ignorada('capitulos', boa, 'capítulo: id repetido');
  const cap1 = ev('JSON.stringify(CAPITULOS_CONFIG[0])');
  ignorada('capitulos', { id: 'cap1', nivel: 1, criterio: boa.criterio, titulo: TEXTO('x'), objetivo: TEXTO('x'), conclusao: TEXTO('x') }, 'capítulo: id de um que já existe no jogo');
  ok(ev('JSON.stringify(CAPITULOS_CONFIG[0])') === cap1, 'capítulo: o cap1 não devia mudar');
  ignorada('capitulos', { id: 'cap_tipo_t', nivel: 11, criterio: [{ tipo: 'magia', caminho: 'garrafas', alvo: 1 }], titulo: TEXTO('x'), objetivo: TEXTO('x'), conclusao: TEXTO('x') }, 'capítulo: tipo de critério desconhecido');
  ignorada('capitulos', { id: 'cap_caminho_t', nivel: 11, criterio: [{ tipo: 'numero', alvo: 1 }], titulo: TEXTO('x'), objetivo: TEXTO('x'), conclusao: TEXTO('x') }, 'capítulo: critério sem caminho');
  ignorada('capitulos', { id: 'cap_alvo_t', nivel: 11, criterio: [{ tipo: 'numero', caminho: 'garrafas', alvo: 0 }], titulo: TEXTO('x'), objetivo: TEXTO('x'), conclusao: TEXTO('x') }, 'capítulo: alvo 0');
  ignorada('capitulos', { id: 'cap_criterio_t', nivel: 11, criterio: [], titulo: TEXTO('x'), objetivo: TEXTO('x'), conclusao: TEXTO('x') }, 'capítulo: critério vazio');
  ignorada('capitulos', { id: 'cap_es_t', nivel: 11, criterio: boa.criterio, titulo: TEXTO('x'), objetivo: TEXTO('x'), conclusao: { pt: 'a', en: 'b' } }, 'capítulo: falta o es na conclusão');
  ignorada('capitulos', { id: 'cap_falante_t', nivel: 11, falante: 'Ninguem', criterio: boa.criterio, titulo: TEXTO('x'), objetivo: TEXTO('x'), conclusao: TEXTO('x') }, 'capítulo: falante que não existe');
  ignorada('capitulos', { id: 'cap_nivel_t', nivel: 'onze', criterio: boa.criterio, titulo: TEXTO('x'), objetivo: TEXTO('x'), conclusao: TEXTO('x') }, 'capítulo: nível que não é número');
  ok(acrescentar('capitulos', { id: 'cap_falante_ok', nivel: 11, falante: 'Chizo', criterio: [{ tipo: 'temChaves', caminho: 'despensa.recebidos', chaves: ['a'] }], titulo: TEXTO('x'), objetivo: TEXTO('x'), conclusao: TEXTO('x') }) === true, 'capítulo com falante que existe e temChaves: devia entrar');
}

// ----- 5. Tipos desconhecidos, objetivos e entradas que não são objetos -----
{
  ignorada('objetivos', { id: 'objetivo_teste', texto: TEXTO('x') }, 'objetivos: ainda não suportado');
  ok(avisos[avisos.length - 1].indexOf('ainda não é suportado') !== -1, 'objetivos: o aviso devia dizer que ainda não é suportado: ' + avisos[avisos.length - 1]);
  ignorada('mestre', { id: 'x_teste' }, 'tipo desconhecido');
  ignorada('VISITAS', { id: 'x_teste' }, 'tipo desconhecido (nome da lista)');
  ignorada(undefined, { id: 'x_teste' }, 'tipo em falta');
  [null, undefined, 5, 'texto', true, [], [1, 2]].forEach(function (e, i) {
    const antes = estado(); const n = avisos.length;
    let r; try { r = ev('dadosAcrescentar("visitas", ' + (e === undefined ? 'undefined' : js(e)) + ')'); } catch (x) { ok(false, 'não-objeto ' + i + ': lançou erro'); return; }
    ok(r === false && avisos.length === n + 1 && estado() === antes, 'não-objeto ' + i + ' (' + js(e) + '): devia ser ignorado com aviso e sem mudar nada');
  });
  // Entrada impossível de ler (uma propriedade que lança erro): ignora-se, sem partir.
  const antes = estado();
  let r2; try { r2 = ev('dadosAcrescentar("visitas", Object.defineProperty({}, "id", { get: function () { throw new Error("boom"); } }))'); } catch (x) { ok(false, 'entrada ilegível: lançou erro'); }
  ok(r2 === false && estado() === antes, 'entrada ilegível: devia ser ignorada');
  let r3; try { r3 = ev('dadosAcrescentar(Object.create(null), { id: "x_teste" })'); } catch (x) { ok(false, 'tipo ilegível: lançou erro'); }
  ok(r3 === false, 'tipo ilegível: devia ser ignorado');
}

// ----- 6. index.html: ordem dos scripts; e dados/ só com comentários -----
{
  const html = fs.readFileSync(INDEX_HTML, 'utf8');
  const pos = function (f) { return html.indexOf('<script src="' + f + '?v='); };
  ok(/<script src="js\/dados\.js\?v=\d+"><\/script>/.test(html), 'index.html devia carregar js/dados.js (com ?v=)');
  const listas = ['js/niveis.js', 'js/historia.js', 'js/objetivos.js', 'js/capitulos.js', 'js/visitas.js'];
  listas.forEach(function (f) { ok(pos(f) !== -1 && pos(f) < pos('js/dados.js'), f + ' devia carregar ANTES de js/dados.js'); });
  ok(pos('js/dados.js') < pos('js/main.js') && pos('js/main.js') !== -1, 'js/dados.js devia carregar ANTES de js/main.js');
  let anterior = pos('js/dados.js');
  FICHEIROS_DE_DADOS.forEach(function (f) {
    const p = pos('dados/' + f);
    ok(p !== -1, 'index.html devia carregar dados/' + f + ' (com ?v=)');
    ok(p > anterior, 'dados/' + f + ' devia carregar a seguir ao anterior, na ordem visitas, niveis, historias, capitulos, objetivos');
    ok(p < pos('js/main.js'), 'dados/' + f + ' devia carregar ANTES de js/main.js');
    anterior = p;
  });
  const naPasta = fs.readdirSync(path.join(RAIZ, 'dados')).filter(function (f) { return /\.js$/.test(f); }).sort().join();
  ok(naPasta === FICHEIROS_DE_DADOS.slice().sort().join(), 'a pasta dados/ devia ter só os 6 ficheiros de dados (.js): ' + naPasta);
  FICHEIROS_DE_DADOS.forEach(function (f) {
    const codigo = fs.readFileSync(path.join(RAIZ, 'dados', f), 'utf8').replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();
    const esperados = ESPERADO_EM_DADOS[f];
    ok(Array.isArray(esperados), 'dados/' + f + ': falta dizer o que devia ter neste teste');
    // Cada ficheiro tem só as chamadas esperadas, pela ordem, e mais nada fora delas.
    const pedacos = codigo.split('dadosAcrescentar(').slice(1);
    const ids = pedacos.map(function (p) { const m = /\bid: '([a-z0-9_]+)'/.exec(p); return m ? m[1] : '?'; });
    ok(ids.join() === (esperados || []).join(), 'dados/' + f + ' devia ter só as entradas ' + JSON.stringify(esperados) + ', tem ' + JSON.stringify(ids));
    ok(codigo === '' || /^dadosAcrescentar\(/.test(codigo), 'dados/' + f + ' devia começar numa chamada dadosAcrescentar: ' + codigo.slice(0, 60));
  });
  // O dados.js não toca em mais nada do jogo: só as 4 listas, pelo dadosAcrescentar.
  const src = fs.readFileSync(path.join(JS_DIR, 'dados.js'), 'utf8');
  ok(!/saveState|localStorage|state\.|Math\.random|Date\.now/.test(src), 'js/dados.js não devia ler nem gravar o estado do jogo');
}

if (falhas) { console.log(falhas + ' falha(s)'); process.exit(1); }
console.log('OK');
