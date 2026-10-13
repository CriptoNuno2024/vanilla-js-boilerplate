#!/usr/bin/env node
// Verifica as entradas de festas da Enciclopédia (js/explorar.js, ENCYCLOPEDIA_ENTRIES): 'consoada' e 'boloRei' (Natal), 'entrudo' e 'caretos' (Carnaval).
// Só LÊ js/, corre-os num ambiente simulado (vm): nunca toca em browser, Telegram nem conta real.
//
//   (a) as 3 línguas (pt, en, es) têm exatamente as mesmas entradas, pela mesma ordem, sem ids repetidos (30 hoje)
//   (b) as duas entradas existem nas 3 línguas, com o título e o texto pedidos palavra por palavra (os textos estão escritos
//       à mão neste ficheiro, de propósito, para não dependerem do código que se verifica)
//   (c) são manuais (o Explorar nunca as oferece), sem imagem, sem meses e sem estação
//   (d) o Explorar não as oferece (entradasBloqueadas() nunca as devolve) e desbloquear-se uma só vez conta 1 de conhecimento
//   (e) o «Sábio» (js/conquistas.js) e a medalha do Perfil (tituloEspecialDesbloqueado()) passam a exigir as 30 entradas
//   (f) os desbloqueios (festas do Natal e do Carnaval e as tarefas do bolo-rei e do quem está mascarado) estão ligados em js/festas.js (a prova de comportamento está em verificar-festas.js)
// No fim corre mutações: estraga js/explorar.js de propósito e confirma que este teste dá por isso.
//
// Uso: node scripts/verificar-enciclopedia-natal.js
// Sai com código 0 se estiver tudo OK e 1 se alguma verificação falhar.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const EXPLORAR_JS = fs.readFileSync(path.join(RAIZ, 'js', 'explorar.js'), 'utf8');
const CONQUISTAS_JS = fs.readFileSync(path.join(RAIZ, 'js', 'conquistas.js'), 'utf8');
const FESTAS_JS = fs.readFileSync(path.join(RAIZ, 'js', 'festas.js'), 'utf8');
const TOTAL = 30;

const PEDIDO = {
  pt: {
    consoada: ['A Consoada', 'A consoada é a ceia da noite de 24 de dezembro, em que a família se reúne à mesa. O nome vem do latim consolata, «consolada». O prato mais típico é o bacalhau cozido com batatas e couves (em algumas zonas do Norte, o polvo), e as sobremesas são as rabanadas, os filhós e a aletria. Depois, há quem vá à Missa do Galo. O Chizo instala-se debaixo da mesa, à espera do que cair.'],
    boloRei: ['O Bolo-Rei', 'O bolo-rei é um bolo doce e redondo, cheio de frutas cristalizadas e frutos secos, que se come do Natal ao Dia de Reis, a 6 de janeiro. Chegou a Portugal no século XIX, vindo de França, e foi a Confeitaria Nacional, em Lisboa, que o introduziu. Tradicionalmente levava uma fava escondida: quem a encontrasse pagava o bolo seguinte. Um cálice de Moscatel de Setúbal, doce e com notas de mel e damasco seco, costuma acompanhar as sobremesas de Natal.'],
    entrudo: ['O Entrudo e o Carnaval', 'O Carnaval é a festa que vem mesmo antes da Quaresma, por isso cai sempre numa terça-feira, 47 dias antes da Páscoa. Em Portugal chamava-se Entrudo, que quer dizer «entrada» na Quaresma, e já se falava dele no século XIII. Antigamente brincava-se com água, farinha e ovos. Na Península de Setúbal, em Sesimbra, o Carnaval fecha com o Enterro do Bacalhau. Quem não se fantasia é o Chizo, que só aceita um laço.'],
    caretos: ['Os Caretos de Podence', 'Em Podence, em Trás-os-Montes, os caretos saem à rua no Entrudo com fatos de franjas de lã coloridas, máscaras de metal e chocalhos à cintura. Correm e saltam pela aldeia e «chocalham» quem apanham. É uma festa de despedida do inverno, e a UNESCO reconheceu-a como Património Cultural Imaterial da Humanidade em 2019. As máscaras do Fygmo e do Fygmo2 são só de brincadeira, e nem sempre convencem.']
  },
  en: {
    consoada: ['The Consoada', 'The consoada is the family supper on the night of 24 December. The word comes from the Latin consolata, "consoled". The most traditional dish is boiled salt cod with potatoes and cabbage (in some parts of the north, octopus), and dessert means rabanadas (a Portuguese take on French toast), filhós (fried dough) and aletria (sweet vermicelli pudding). Afterwards, some go to the Missa do Galo, the midnight mass. Chizo settles under the table, waiting for whatever falls.'],
    boloRei: ['The Bolo-Rei (King Cake)', 'The bolo-rei is a round, sweet cake full of candied fruit and dried nuts, eaten from Christmas to Epiphany on 6 January. It reached Portugal in the 19th century from France, introduced by Confeitaria Nacional in Lisbon. Traditionally it hid a dried fava bean: whoever found it paid for the next cake. A glass of Setúbal Moscatel, sweet with notes of honey and dried apricot, is a good match for Christmas desserts.'],
    entrudo: ['Carnival and the Entrudo', 'Carnival is the feast that comes right before Lent, so it always falls on a Tuesday, 47 days before Easter. In Portugal it was called the Entrudo, meaning the "entry" into Lent, and it is mentioned as far back as the 13th century. In the old days, people played with water, flour and eggs. On the Setúbal Peninsula, in Sesimbra, Carnival ends with the Enterro do Bacalhau, the "Burial of the Cod". The one who never dresses up is Chizo, who only accepts a bow.'],
    caretos: ['The Caretos of Podence', 'In Podence, in Trás-os-Montes, the caretos take to the streets at the Entrudo in suits with colourful wool fringes, metal masks and bells at the waist. They run and leap through the village and "shake their bells" at whoever they catch. It is a farewell to winter, and UNESCO recognised it as Intangible Cultural Heritage of Humanity in 2019. The masks of Fygmo and Fygmo2 are only for fun, and they don\'t always fool anyone.']
  },
  es: {
    consoada: ['La Consoada', 'La consoada es la cena de la noche del 24 de diciembre, en la que la familia se reúne a la mesa. El nombre viene del latín consolata, «consolada». El plato más típico es el bacalao cocido con patatas y col (en algunas zonas del norte, el pulpo), y de postre hay rabanadas, filhós (masa frita) y aletria (pudin dulce de fideos). Después, algunos van a la Misa del Gallo. Chizo se acomoda debajo de la mesa, esperando lo que caiga.'],
    boloRei: ['El Bolo-Rei (roscón de Reyes portugués)', 'El bolo-rei es un bizcocho dulce y redondo, lleno de fruta confitada y frutos secos, que se come desde Navidad hasta el Día de Reyes, el 6 de enero. Llegó a Portugal en el siglo XIX desde Francia, y fue la Confeitaria Nacional, en Lisboa, quien lo introdujo. Tradicionalmente llevaba un haba escondida: quien la encontraba pagaba el siguiente bolo. Una copa de Moscatel de Setúbal, dulce y con notas de miel y orejón, suele acompañar los postres navideños.'],
    entrudo: ['El Entrudo y el Carnaval', 'El Carnaval es la fiesta que llega justo antes de la Cuaresma, por eso cae siempre en martes, 47 días antes de la Pascua. En Portugal se llamaba Entrudo, que significa «entrada» en la Cuaresma, y ya se hablaba de él en el siglo XIII. Antiguamente se jugaba con agua, harina y huevos. En la Península de Setúbal, en Sesimbra, el Carnaval se cierra con el Enterro do Bacalhau, el «Entierro del Bacalao». Quien no se disfraza es Chizo, que solo acepta un lazo.'],
    caretos: ['Los Caretos de Podence', 'En Podence, en Trás-os-Montes, los caretos salen a la calle en el Entrudo con trajes de flecos de lana de colores, máscaras de metal y cascabeles en la cintura. Corren y saltan por el pueblo y «hacen sonar los cascabeles» a quien atrapan. Es una fiesta de despedida del invierno, y la UNESCO la reconoció como Patrimonio Cultural Inmaterial de la Humanidad en 2019. Las máscaras de Fygmo y Fygmo2 son solo de broma, y no siempre convencen.']
  }
};
const LINGUAS = ['pt', 'en', 'es'];
const IDS_NATAL = ['consoada', 'boloRei', 'entrudo', 'caretos']; // as 4 entradas de festas (Natal e Carnaval)

function J(x) { return JSON.stringify(x); }

function abrir(explorarJs, conquistasJs) {
  const sandbox = {
    console: { log() {}, warn() {}, error() {} },
    currentLang: 'pt',
    state: { conhecimento: 0, encyclopedia: { unlocked: [] }, objetivos: {} },
    estacaoAtual: function () { return 'inverno'; },
    faseRealAtual: function () { return 'repouso'; },
    t: function (k) { return k; }
  };
  const ctx = vm.createContext(sandbox);
  vm.runInContext(explorarJs, ctx, { filename: 'explorar.js' });
  vm.runInContext(conquistasJs, ctx, { filename: 'conquistas.js' });
  return { ev: function (c) { return vm.runInContext(c, ctx); }, json: function (c) { return JSON.parse(vm.runInContext('JSON.stringify(' + c + ')', ctx)); } };
}

function correr(explorarJs, festasJs) {
  const falhas = [];
  function ok(cond, msg) { if (!cond) falhas.push(msg); }
  let g;
  try { g = abrir(explorarJs, CONQUISTAS_JS); } catch (e) { return ['js/explorar.js não carrega: ' + e.message]; }

  // (a) as mesmas entradas nas 3 línguas
  const ids = {};
  LINGUAS.forEach(function (l) { ids[l] = g.json('ENCYCLOPEDIA_ENTRIES.' + l + '.map(function (e) { return e.id; })'); });
  LINGUAS.forEach(function (l) {
    ok(ids[l].length === TOTAL, '(a) ' + l + ': devia ter ' + TOTAL + ' entradas, tem ' + ids[l].length);
    ok(new Set(ids[l]).size === ids[l].length, '(a) ' + l + ': há ids repetidos');
    ok(J(ids[l]) === J(ids.pt), '(a) ' + l + ': devia ter os mesmos ids que o pt, pela mesma ordem: ' + ids[l].join());
  });

  // (b) e (c) os textos pedidos, palavra por palavra, e a forma da entrada
  LINGUAS.forEach(function (l) {
    IDS_NATAL.forEach(function (id) {
      const e = g.json('ENCYCLOPEDIA_ENTRIES.' + l + '.filter(function (x) { return x.id === ' + J(id) + '; })');
      ok(e.length === 1, '(b) ' + l + ': devia haver exatamente uma entrada ' + id + ', há ' + e.length);
      if (e.length !== 1) return;
      ok(e[0].titulo === PEDIDO[l][id][0], '(b) ' + l + '/' + id + ': título diferente do pedido: ' + e[0].titulo);
      ok(e[0].texto === PEDIDO[l][id][1], '(b) ' + l + '/' + id + ': texto diferente do pedido');
      ok(e[0].manual === true, '(c) ' + l + '/' + id + ': devia ter manual: true');
      ['imagem', 'meses', 'estacao'].forEach(function (k) { ok(!Object.prototype.hasOwnProperty.call(e[0], k), '(c) ' + l + '/' + id + ': não devia ter ' + k); });
      ok(Object.keys(e[0]).sort().join() === 'id,manual,texto,titulo', '(c) ' + l + '/' + id + ': campos a mais ou a menos: ' + Object.keys(e[0]).join());
    });
  });

  // (d) o Explorar nunca as oferece; desbloquear conta uma vez
  LINGUAS.forEach(function (l) {
    g.ev('currentLang = ' + J(l) + '; state.encyclopedia.unlocked = [];');
    const oferecidas = g.json('entradasBloqueadas().map(function (e) { return e.id; })');
    IDS_NATAL.forEach(function (id) { ok(oferecidas.indexOf(id) === -1, '(d) ' + l + ': o Explorar não devia oferecer ' + id); });
  });
  g.ev("currentLang = 'pt'; state.encyclopedia.unlocked = []; state.conhecimento = 0;");
  IDS_NATAL.forEach(function (id, i) {
    const e1 = g.json('desbloquearEntradaEnciclopedia(' + J(id) + ')');
    ok(e1 && e1.id === id && e1.titulo === PEDIDO.pt[id][0], '(d) desbloquear ' + id + ' devia devolver a entrada no idioma atual');
    ok(g.ev('desbloquearEntradaEnciclopedia(' + J(id) + ')') === null, '(d) desbloquear ' + id + ' outra vez devia devolver null');
    ok(g.ev('state.conhecimento') === i + 1 && g.json('state.encyclopedia.unlocked').filter(function (x) { return x === id; }).length === 1, '(d) ' + id + ': conta uma só vez');
  });
  g.ev("currentLang = 'en';");
  ok(g.json('desbloquearEntradaEnciclopedia("origem")') !== null && g.json('state.encyclopedia.unlocked').length === IDS_NATAL.length + 1, '(d) o desbloqueio funciona noutra língua');

  // (e) «Sábio» e medalha exigem as 28
  const sabio = function () { return g.json('CONQUISTAS_CONFIG.filter(function (c) { return c.id === "sabio"; })[0].cumprida()'); };
  const todas = g.json('ENCYCLOPEDIA_ENTRIES.pt.map(function (e) { return e.id; })');
  const antigas = todas.filter(function (id) { return IDS_NATAL.indexOf(id) === -1; });
  g.ev('state.encyclopedia.unlocked = ' + J(antigas));
  ok(antigas.length === TOTAL - 4 && sabio() === false && g.ev('tituloEspecialDesbloqueado()') === false, '(e) com as ' + (TOTAL - 4) + ' de antes já não chega para o «Sábio» nem para a medalha');
  g.ev('state.encyclopedia.unlocked = ' + J(antigas.concat(['consoada', 'boloRei', 'entrudo'])));
  ok(sabio() === false && g.ev('tituloEspecialDesbloqueado()') === false, '(e) com 29 ainda não chega');
  g.ev('state.encyclopedia.unlocked = ' + J(todas));
  ok(sabio() === true && g.ev('tituloEspecialDesbloqueado()') === true, '(e) com as 30 o «Sábio» e a medalha voltam');

  // (f) ligação dos desbloqueios em js/festas.js
  const f = vm.createContext({ console: { log() {} } });
  try {
    vm.runInContext(festasJs.split('function festaAtual')[0].replace(/^[\s\S]*?(const FESTAS_CONFIG)/, '$1') + '\nthis.__cfg = FESTAS_CONFIG;', f);
    const cfg = f.__cfg || [];
    const festa = function (id) { return cfg.filter(function (x) { return x.id === id; })[0]; };
    const tarefa = function (f, id) { return f && f.tarefas.filter(function (t) { return t.id === id; })[0]; };
    const natal = festa('natal'), carnaval = festa('carnaval');
    ok(natal && natal.entradaEnciclopedia === 'consoada', '(f) a festa do Natal devia abrir a consoada ao entrar');
    ok(tarefa(natal, 'boloRei') && tarefa(natal, 'boloRei').entradaEnciclopedia === 'boloRei', '(f) a tarefa do bolo-rei devia abrir o boloRei');
    ok(carnaval && carnaval.entradaEnciclopedia === 'entrudo', '(f) a festa do Carnaval devia abrir o entrudo ao entrar');
    ok(tarefa(carnaval, 'quemEstaMascarado') && tarefa(carnaval, 'quemEstaMascarado').entradaEnciclopedia === 'caretos', '(f) a tarefa quemEstaMascarado devia abrir os caretos');
    ok(cfg.filter(function (x) { return x.id !== 'saomartinho' && x.id !== 'natal' && x.id !== 'carnaval' && x.entradaEnciclopedia; }).length === 0, '(f) as outras festas (Páscoa, ...) não abrem entradas');
    ok(cfg.every(function (x) { return x.tarefas.every(function (t) { return !t.entradaEnciclopedia || (x.id === 'natal' && t.id === 'boloRei') || (x.id === 'carnaval' && t.id === 'quemEstaMascarado'); }); }), '(f) só o bolo-rei e o quem está mascarado abrem uma entrada (o corso, as fantasias, a consoada e os doces não)');
  } catch (e) { ok(false, '(f) FESTAS_CONFIG não carrega: ' + e.message); }
  return falhas;
}

// ---------------------------------------------------------------- corrida a sério
const falhasReais = correr(EXPLORAR_JS, FESTAS_JS);
falhasReais.slice(0, 40).forEach(function (m) { console.log('FALHA: ' + m); });
if (falhasReais.length > 40) console.log('... e mais ' + (falhasReais.length - 40) + ' falhas');
let falhou = falhasReais.length;

// ---------------------------------------------------------------- mutações
function trocar(fonte, de, para) {
  if (fonte.split(de).length < 2) return null;
  return fonte.replace(de, para);
}
// Posição dos blocos de cada língua em explorar.js.
const inicio = { pt: EXPLORAR_JS.indexOf('  pt: ['), en: EXPLORAR_JS.indexOf('  en: ['), es: EXPLORAR_JS.indexOf('  es: [') };
const fimBlocos = { pt: inicio.en, en: inicio.es, es: EXPLORAR_JS.indexOf('\n};', inicio.es) };
function noBloco(l, fn) {
  const bloco = EXPLORAR_JS.slice(inicio[l], fimBlocos[l]);
  const novo = fn(bloco);
  return novo === null ? null : EXPLORAR_JS.slice(0, inicio[l]) + novo + EXPLORAR_JS.slice(fimBlocos[l]);
}
const mutacoes = []; // [nome, explorarJs, festasJs]
LINGUAS.forEach(function (l) {
  IDS_NATAL.forEach(function (id) {
    // falta a entrada nessa língua
    mutacoes.push(['falta a entrada ' + id + ' em ' + l, noBloco(l, function (b) {
      const re = new RegExp("\\n    \\{ id: '" + id + "', manual: true,[^\\n]*\\},?(?=\\n)");
      return re.test(b) ? b.replace(re, '').replace(/,(\s*)$/, '$1') : null;
    }), FESTAS_JS]);
    // uma palavra do texto muda
    mutacoes.push(['uma palavra do texto de ' + id + ' em ' + l + ' muda', noBloco(l, function (b) {
      const texto = PEDIDO[l][id][1].replace(/'/g, "\\'"); // no código, os apóstrofos vão escapados (texto com aspas duplas e apóstrofo)
      const i = b.indexOf(texto);
      return i === -1 ? null : b.replace(texto, texto.replace(/ (\S+)\.$/, ' outra.'));
    }), FESTAS_JS]);
    // o título muda
    mutacoes.push(['o título de ' + id + ' em ' + l + ' muda', noBloco(l, function (b) { return trocar(b, "titulo: '" + PEDIDO[l][id][0].replace(/'/g, "\\'") + "'", "titulo: 'Outro'"); }), FESTAS_JS]);
    // deixa de ser manual / ganha imagem, meses ou estação
    mutacoes.push(['a entrada ' + id + ' em ' + l + ' deixa de ser manual', noBloco(l, function (b) { return trocar(b, "{ id: '" + id + "', manual: true,", "{ id: '" + id + "',"); }), FESTAS_JS]);
    mutacoes.push(['a entrada ' + id + ' em ' + l + ' ganha uma imagem', noBloco(l, function (b) { return trocar(b, "{ id: '" + id + "', manual: true,", "{ id: '" + id + "', manual: true, imagem: 'assets/ecras/x.jpg',"); }), FESTAS_JS]);
    mutacoes.push(['a entrada ' + id + ' em ' + l + ' ganha estação', noBloco(l, function (b) { return trocar(b, "{ id: '" + id + "', manual: true,", "{ id: '" + id + "', manual: true, estacao: 'inverno',"); }), FESTAS_JS]);
    mutacoes.push(['a entrada ' + id + ' em ' + l + ' ganha meses', noBloco(l, function (b) { return trocar(b, "{ id: '" + id + "', manual: true,", "{ id: '" + id + "', manual: true, meses: [12],"); }), FESTAS_JS]);
  });
  // ids trocados entre línguas (a ordem deixa de bater)
  [['consoada', 'boloRei'], ['entrudo', 'caretos'], ['boloRei', 'entrudo']].forEach(function (par) {
    // duas entradas vizinhas trocam de ordem (os ids deixam de bater com as outras línguas)
    mutacoes.push(['as entradas ' + par.join(' e ') + ' trocam de ordem em ' + l, noBloco(l, function (b) {
      const linhas = b.split('\n');
      const pos = par.map(function (id) { return linhas.findIndex(function (x) { return x.indexOf("{ id: '" + id + "',") === 4; }); });
      if (pos[0] === -1 || pos[1] === -1) return null;
      const virgula = pos.map(function (k) { return /,$/.test(linhas[k]); });
      const corpo = pos.map(function (k) { return linhas[k].replace(/,$/, ''); });
      linhas[pos[0]] = corpo[1] + (virgula[0] ? ',' : '');
      linhas[pos[1]] = corpo[0] + (virgula[1] ? ',' : '');
      return linhas.join('\n');
    }), FESTAS_JS]);
  });
});
mutacoes.push(['o Explorar passa a oferecer entradas manuais', trocar(EXPLORAR_JS, 'if (e.manual) return false;', ''), FESTAS_JS]);
mutacoes.push(['o desbloqueio conta duas vezes', trocar(EXPLORAR_JS, 'state.conhecimento += 1;', 'state.conhecimento += 2;'), FESTAS_JS]);
mutacoes.push(['a medalha deixa de contar as novas', trocar(EXPLORAR_JS, 'return state.encyclopedia.unlocked.length >= encyclopediaEntries().length;', 'return state.encyclopedia.unlocked.length >= encyclopediaEntries().length - 2;'), FESTAS_JS]);
mutacoes.push(['o Natal deixa de abrir a consoada (festas.js)', EXPLORAR_JS, trocar(FESTAS_JS, "    entradaEnciclopedia: 'consoada',\n", '')]);
mutacoes.push(['o bolo-rei deixa de abrir o boloRei (festas.js)', EXPLORAR_JS, trocar(FESTAS_JS, " entradaEnciclopedia: 'boloRei',", '')]);
mutacoes.push(['o Carnaval deixa de abrir o entrudo (festas.js)', EXPLORAR_JS, trocar(FESTAS_JS, "    entradaEnciclopedia: 'entrudo',\n", '')]);
mutacoes.push(['os caretos deixam de abrir (festas.js)', EXPLORAR_JS, trocar(FESTAS_JS, " entradaEnciclopedia: 'caretos',", '')]);
mutacoes.push(['a Páscoa passa a abrir uma entrada (festas.js)', EXPLORAR_JS, trocar(FESTAS_JS, "    id: 'pascoa',\n", "    id: 'pascoa',\n    entradaEnciclopedia: 'entrudo',\n")]);
mutacoes.push(['o corso passa a abrir uma entrada (festas.js)', EXPLORAR_JS, trocar(FESTAS_JS, "btn: 'btnCorso',", "btn: 'btnCorso', entradaEnciclopedia: 'caretos',")]);

let apanhadas = 0;
mutacoes.forEach(function (m) {
  if (m[1] === null || m[2] === null) { console.log('FALHA: mutação impossível (texto não encontrado): ' + m[0]); falhou++; return; }
  const f = correr(m[1], m[2]);
  if (f.length === 0) { console.log('FALHA: mutação não apanhada: ' + m[0]); falhou++; } else apanhadas++;
});

console.log(falhou === 0 ? 'OK (' + apanhadas + ' mutações apanhadas)' : falhou + ' FALHA(S)');
process.exit(falhou === 0 ? 0 : 1);
