// ---------------------------------------------------------------------
// GUARDAR O PROGRESSO NA CONTA DO TELEGRAM (CloudStorage)
//
// Até agora o progresso vivia só no localStorage do telemóvel: se o
// jogador trocasse de aparelho, perdia tudo. Este ficheiro acrescenta
// uma segunda cópia na nuvem do Telegram (tg.CloudStorage), sem nunca
// deixar de escrever no localStorage:
//
//   - saveState() (js/state.js) continua a escrever sempre no
//     localStorage, e agora também pede a este ficheiro para escrever
//     na nuvem.
//   - Ao abrir o jogo, nuvemSincronizarAoAbrir() (chamada no fim deste
//     ficheiro) compara a data/hora da última gravação local com a da
//     nuvem e fica com a mais recente. Se a nuvem estiver vazia mas o
//     aparelho já tiver progresso, copia-o para a nuvem.
//   - Se o CloudStorage não existir (jogo aberto num navegador normal,
//     fora do Telegram) ou falhar por qualquer razão, o jogo continua a
//     funcionar só com o localStorage, sem mostrar erros ao jogador.
//
// O CloudStorage do Telegram só guarda até 4096 caracteres por chave e
// até 1024 chaves (ver documentação oficial do Telegram Web Apps) — por
// isso o progresso é partido em pedaços mais pequenos (ver
// NUVEM_TAMANHO_PARTE), com uma chave extra a dizer quantos pedaços há.
//
// PARA TESTAR EM LOCALHOST (onde não há Telegram a sério): acrescenta
// ?nuvem=teste ao endereço. Isto troca o CloudStorage verdadeiro por uma
// cópia de teste guardada num canto à parte do localStorage — nunca se
// mistura com o progresso real nem com a nuvem verdadeira. Com
// ?nuvem=teste dá para: jogar um pouco, fechar a aba, voltar a abrir com
// o mesmo ?nuvem=teste, e confirmar que o progresso volta tal como
// ficou (inclui apagar o localStorage a seguir a gravar, só para provar
// que veio da "nuvem" de teste e não do localStorage).
// ---------------------------------------------------------------------

const NUVEM_CHAVE_META = 'yc_state_meta';
const NUVEM_CHAVE_PREFIXO_PARTE = 'yc_state_parte_';
const NUVEM_TAMANHO_PARTE = 3000; // margem de segurança abaixo do limite de 4096 do CloudStorage
const NUVEM_MAX_PARTES = 20;      // até 60 000 caracteres de progresso — bem acima do que o jogo usa hoje
const NUVEM_ATRASO_GRAVACAO_MS = 800; // agrupa gravações seguidas (ex: vários toques rápidos) numa só
const NUVEM_ESPERA_LEITURA_MS = 8000;  // sem resposta da nuvem ao abrir passados 8 s: conta como erro de leitura
const NUVEM_RELEITURAS_ERRO_MS = [15000, 60000, 300000]; // depois de um erro: nova leitura aos 15 s, 60 s e 5 min (máximo 3)
const NUVEM_CONFIRMAR_VAZIO_MS = 10000; // nuvem vazia e progresso no aparelho: 2.ª leitura 10 s depois, antes de copiar

function nuvemModoTeste() {
  return new URLSearchParams(location.search).get('nuvem') === 'teste';
}

// CloudStorage "de mentira" para testar em localhost: mesma forma do
// CloudStorage verdadeiro (setItem/getItem/getItems/getKeys/removeItem/
// removeItems, todos com callback(erro, resultado)), mas guardada à
// parte no localStorage, com um prefixo próprio.
const NUVEM_FAKE_PREFIXO = 'yc_cloud_teste_';

const nuvemFalsa = {
  setItem: function (chave, valor, cb) {
    try { localStorage.setItem(NUVEM_FAKE_PREFIXO + chave, valor); if (cb) cb(null, true); }
    catch (e) { if (cb) cb(e); }
  },
  getItem: function (chave, cb) {
    try { const v = localStorage.getItem(NUVEM_FAKE_PREFIXO + chave); if (cb) cb(null, v === null ? '' : v); }
    catch (e) { if (cb) cb(e); }
  },
  getItems: function (chaves, cb) {
    try {
      const valores = {};
      chaves.forEach(function (c) {
        const v = localStorage.getItem(NUVEM_FAKE_PREFIXO + c);
        valores[c] = v === null ? '' : v;
      });
      if (cb) cb(null, valores);
    } catch (e) { if (cb) cb(e); }
  },
  getKeys: function (cb) {
    try {
      const chaves = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.indexOf(NUVEM_FAKE_PREFIXO) === 0) chaves.push(k.slice(NUVEM_FAKE_PREFIXO.length));
      }
      if (cb) cb(null, chaves);
    } catch (e) { if (cb) cb(e); }
  },
  removeItem: function (chave, cb) {
    try { localStorage.removeItem(NUVEM_FAKE_PREFIXO + chave); if (cb) cb(null, true); }
    catch (e) { if (cb) cb(e); }
  },
  removeItems: function (chaves, cb) {
    try { chaves.forEach(function (c) { localStorage.removeItem(NUVEM_FAKE_PREFIXO + c); }); if (cb) cb(null, true); }
    catch (e) { if (cb) cb(e); }
  }
};

// Nuvem "avariada", só com ?nuvem=erro: tudo devolve erro. Com
// &demora=1 os callbacks nunca respondem (para provar o tempo limite).
// Serve para testar o "Apagar o meu progresso" quando a nuvem falha.
function nuvemModoErro() {
  return new URLSearchParams(location.search).get('nuvem') === 'erro';
}

function nuvemFazerAvariada() {
  const semResposta = new URLSearchParams(location.search).get('demora') === '1';
  function avaria() {
    const cb = arguments[arguments.length - 1];
    if (semResposta || typeof cb !== 'function') return;
    cb(new Error('nuvem de teste avariada'));
  }
  return { setItem: avaria, getItem: avaria, getItems: avaria, getKeys: avaria, removeItem: avaria, removeItems: avaria };
}

const nuvemAvariada = nuvemFazerAvariada();

// Devolve o CloudStorage a usar, ou null se não houver nenhum disponível
// (fora do Telegram e sem ?nuvem=teste) — nesse caso o jogo fica só com
// o localStorage, tal como acontecia antes deste ficheiro existir.
function nuvemStorage() {
  if (nuvemModoErro()) return nuvemAvariada;
  if (nuvemModoTeste()) return nuvemFalsa;
  const dentroDoTelegram = tg && tg.initDataUnsafe && Object.keys(tg.initDataUnsafe).length > 0;
  if (dentroDoTelegram && tg.CloudStorage) return tg.CloudStorage;
  return null;
}

function nuvemPartirEmPedacos(texto) {
  const pedacos = [];
  for (let i = 0; i < texto.length; i += NUVEM_TAMANHO_PARTE) pedacos.push(texto.slice(i, i + NUVEM_TAMANHO_PARTE));
  return pedacos.length ? pedacos : [''];
}

// DIAGNÓSTICO DA GRAVAÇÃO — só mostra e verifica, nunca decide qual cópia
// ganha. ok: null antes da 1.ª gravação desta sessão, true/false depois;
// em: hora (ms) da última gravação CONFIRMADA; erro: null, 'gravacao',
// 'verificacao' ou 'tamanho'. Sem dados do jogador. Mostrado no Perfil
// (ver nuvemTextoEstado() e renderPerfil() em js/perfil.js).
const nuvemEstado = { ok: null, em: 0, erro: null };
let _nuvemSeqGravacao = 0; // só a gravação mais recente atualiza nuvemEstado

function nuvemTextoEstado() {
  if (!nuvemStorage()) return t('perfil.nuvemIndisponivel');
  if (nuvemEstado.ok === true) {
    const d = new Date(nuvemEstado.em);
    const hora = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    return t('perfil.nuvemOk').replace('{hora}', hora);
  }
  if (nuvemEstado.ok === false) return t('perfil.nuvemFalhou');
  return t('perfil.nuvemSemGravacao');
}

function nuvemAtualizarLinhaPerfil() {
  const el = document.getElementById('perfil-nuvem-estado');
  if (el) el.textContent = nuvemTextoEstado();
}

// Lê de volta o meta e as partes UMA vez e compara o carimbo, o número de
// partes e o tamanho total com o que se gravou. callback(true/false).
function nuvemVerificarGravacao(storage, meta, tamanhoTotal, chaves, callback) {
  storage.getItem(NUVEM_CHAVE_META, function (erro, metaTexto) {
    if (erro || !metaTexto) { callback(false); return; }
    let lido;
    try { lido = JSON.parse(metaTexto); } catch (e) { callback(false); return; }
    if (!lido || lido.atualizadoEm !== meta.atualizadoEm || lido.partes !== meta.partes) { callback(false); return; }
    storage.getItems(chaves, function (erroPartes, valores) {
      if (erroPartes || !valores) { callback(false); return; }
      const total = chaves.reduce(function (soma, c) { return soma + (valores[c] || '').length; }, 0);
      callback(total === tamanhoTotal);
    });
  });
}

// Guarda o estado completo na nuvem, partido em pedaços. Nunca lança
// erro para fora: se a nuvem falhar ou não existir, callback(false) —
// o localStorage já foi gravado à parte, em saveState() (js/state.js).
// O resultado (e a verificação) fica em nuvemEstado.
function nuvemGuardarEstado(s, callback) {
  if (apagando) { if (callback) callback(false); return; }
  const storage = nuvemStorage();
  if (!storage) { if (callback) callback(false); return; }

  const seq = ++_nuvemSeqGravacao;
  function concluir(ok, erro) {
    if (seq === _nuvemSeqGravacao) {
      nuvemEstado.ok = ok;
      nuvemEstado.erro = ok ? null : erro;
      if (ok) nuvemEstado.em = Date.now();
      if (ok && !arranque.primeiraGravacaoEm) arranque.primeiraGravacaoEm = Date.now(); // DIAGNOSTICO TEMPORARIO - remover
      if (!ok && typeof console !== 'undefined' && console.warn) {
        console.warn(erro === 'verificacao' ? 'Nuvem: a gravação não coincide com a leitura de volta.'
          : erro === 'tamanho' ? 'Nuvem: estado demasiado grande para gravar.'
          : 'Nuvem: a gravação falhou.');
      }
      nuvemAtualizarLinhaPerfil();
    }
    if (callback) callback(ok);
  }

  const texto = JSON.stringify(s);
  const pedacos = nuvemPartirEmPedacos(texto);

  if (pedacos.length > NUVEM_MAX_PARTES) {
    // Progresso ficou grande demais para a nuvem — não arrisca gravar
    // só metade; o localStorage continua a funcionar normalmente.
    concluir(false, 'tamanho');
    return;
  }

  const meta = { partes: pedacos.length, atualizadoEm: s.ultimaGravacaoEm || Date.now() };

  storage.setItem(NUVEM_CHAVE_META, JSON.stringify(meta), function (erroMeta) {
    if (apagando) { if (callback) callback(false); return; }
    if (erroMeta) { concluir(false, 'gravacao'); return; }

    let restantes = pedacos.length;
    let falhou = false;
    pedacos.forEach(function (pedaco, i) {
      storage.setItem(NUVEM_CHAVE_PREFIXO_PARTE + i, pedaco, function (erroParte) {
        if (erroParte) falhou = true;
        restantes -= 1;
        if (restantes !== 0) return;
        if (falhou) { concluir(false, 'gravacao'); return; }
        const chaves = pedacos.map(function (_, j) { return NUVEM_CHAVE_PREFIXO_PARTE + j; });
        nuvemVerificarGravacao(storage, meta, texto.length, chaves, function (coincide) {
          concluir(coincide, 'verificacao');
        });
      });
    });
  });
}

// Agrupa várias chamadas seguidas (ex: o jogador toca em vários botões
// num segundo) numa só gravação na nuvem, para não pedir demasiadas
// vezes seguidas ao CloudStorage do Telegram.
let _nuvemTimerGravacao = null;
let _nuvemEstadoPendente = null;
function nuvemGuardarEstadoComAtraso(s) {
  if (apagando) return;
  if (_nuvemTimerGravacao) clearTimeout(_nuvemTimerGravacao);
  _nuvemEstadoPendente = s;
  _nuvemTimerGravacao = setTimeout(function () {
    _nuvemTimerGravacao = null;
    _nuvemEstadoPendente = null;
    nuvemGuardarEstado(s);
  }, NUVEM_ATRASO_GRAVACAO_MS);
}

// Grava já, sem esperar pelos 800 ms, quando a página fica escondida ou
// fecha. Só se houver alteração por gravar (temporizador pendente); cancela
// esse temporizador para não gravar duas vezes.
function nuvemGravarJa() {
  if (!_nuvemTimerGravacao || !_nuvemEstadoPendente) return;
  clearTimeout(_nuvemTimerGravacao);
  _nuvemTimerGravacao = null;
  const s = _nuvemEstadoPendente;
  _nuvemEstadoPendente = null;
  nuvemGuardarEstado(s);
}

document.addEventListener('visibilitychange', function () {
  if (document.visibilityState === 'hidden') nuvemGravarJa();
});
window.addEventListener('pagehide', nuvemGravarJa);

// Lê o estado guardado na nuvem. Chama callback(estado, estatus):
//   'ok'    -> estado lido (com ultimaGravacaoEm vindo da chave de metadados,
//              não do próprio JSON do estado);
//   'vazio' -> o getItem do meta respondeu SEM erro e veio vazio: não há nada guardado;
//   'erro'  -> qualquer outra coisa (erro do CloudStorage, JSON mau, meta sem
//              partes, parte em falta ou truncada, sem CloudStorage). Nunca é
//              "vazio": quem chama não pode gravar por cima por causa de um erro.
function nuvemLerEstado(callback) {
  const storage = nuvemStorage();
  if (!storage) { callback(null, 'erro'); return; }

  storage.getItem(NUVEM_CHAVE_META, function (erro, metaTexto) {
    if (erro) { callback(null, 'erro'); return; }
    if (metaTexto === '' || metaTexto === null || metaTexto === undefined) { callback(null, 'vazio'); return; }
    if (typeof metaTexto !== 'string') { callback(null, 'erro'); return; }

    let meta;
    try { meta = JSON.parse(metaTexto); } catch (e) { callback(null, 'erro'); return; }
    if (!meta || !Number.isInteger(meta.partes) || meta.partes < 1 || meta.partes > NUVEM_MAX_PARTES) { callback(null, 'erro'); return; }

    const chaves = [];
    for (let i = 0; i < meta.partes; i++) chaves.push(NUVEM_CHAVE_PREFIXO_PARTE + i);

    storage.getItems(chaves, function (erroPartes, valores) {
      if (erroPartes || !valores) { callback(null, 'erro'); return; }
      try {
        const partes = chaves.map(function (c) { return valores[c]; });
        // Uma parte em falta ou vazia nunca é válida (cada parte tem pelo menos 1 carácter).
        if (partes.some(function (x) { return typeof x !== 'string' || x === ''; })) { callback(null, 'erro'); return; }
        const estado = JSON.parse(partes.join(''));
        if (!estado || typeof estado !== 'object' || Array.isArray(estado)) { callback(null, 'erro'); return; }
        estado.ultimaGravacaoEm = meta.atualizadoEm;
        callback(estado, 'ok');
      } catch (e) {
        callback(null, 'erro');
      }
    });
  });
}

// -----------------------------------------------------------------
// SINCRONIZAÇÃO AO ABRIR O JOGO
// -----------------------------------------------------------------

// Refresca só o que pode ter mudado com a sincronização (pontos,
// textos, faixas). Nunca chama goTo() nem funções "entrar no ecrã X",
// para não reiniciar minijogos ou temporizadores que já estivessem a
// decorrer no ecrã atual.
function nuvemAtualizarEcraAposSync() {
  updateStatsDisplays();
  applyTranslations();
  if (typeof atualizarLinhaEstacaoQuinta === 'function') atualizarLinhaEstacaoQuinta();
  if (typeof atualizarLinhaTempoQuinta === 'function') atualizarLinhaTempoQuinta();
  if (typeof atualizarFaixaFesta === 'function') atualizarFaixaFesta();
  const ativo = document.querySelector('.screen.active');
  if (!ativo) return;
  if (ativo.id === 'screen-perfil' && typeof renderPerfil === 'function') renderPerfil();
  if (ativo.id === 'screen-enciclopedia' && typeof renderEnciclopedia === 'function') renderEnciclopedia();
}

// Junta state.capitulos de dois estados por UNIÃO: concluidos e celebrados
// só sobem (chave a chave); iniciado e celebradosMigrado ficam true se
// algum dos lados for true. Devolve um objeto novo.
function nuvemJuntarCapitulos(a, b) {
  const x = (a && typeof a === 'object') ? a : {};
  const y = (b && typeof b === 'object') ? b : {};
  return {
    iniciado: x.iniciado === true || y.iniciado === true,
    concluidos: Object.assign({}, x.concluidos, y.concluidos),
    celebrados: Object.assign({}, x.celebrados, y.celebrados),
    celebradosMigrado: x.celebradosMigrado === true || y.celebradosMigrado === true
  };
}

// Leitura da nuvem ao abrir (ver nuvemTratarLeitura() para o que se faz com
// cada estatuto). Só enquanto arranque.respondeu for false: uma leitura bem
// sucedida (ou conta nova sem progresso) é que liberta o envio (nuvemPodeEnviar()).
let _nuvemALer = false;
let _nuvemTimerReleitura = null;
let _nuvemReleiturasFeitas = 0;

function nuvemLerParaSincronizar(confirmandoVazio) {
  if (apagando || arranque.respondeu || _nuvemALer) return;
  _nuvemALer = true;
  let respondida = false;
  // Sem resposta passados 8 s conta como erro (uma resposta tardia é ignorada:
  // a releitura trata disso).
  const limite = setTimeout(function () {
    if (respondida) return;
    respondida = true;
    _nuvemALer = false;
    arranque.passou8s = true;
    nuvemTratarLeitura(null, 'erro', confirmandoVazio);
  }, NUVEM_ESPERA_LEITURA_MS);

  nuvemLerEstado(function (estadoNuvem, estatus) {
    if (respondida) return;
    respondida = true;
    clearTimeout(limite);
    _nuvemALer = false;
    nuvemTratarLeitura(estadoNuvem, estatus, confirmandoVazio);
  });
}

function nuvemAgendarReleitura() {
  if (_nuvemTimerReleitura || _nuvemReleiturasFeitas >= NUVEM_RELEITURAS_ERRO_MS.length) return;
  const espera = NUVEM_RELEITURAS_ERRO_MS[_nuvemReleiturasFeitas++];
  _nuvemTimerReleitura = setTimeout(function () {
    _nuvemTimerReleitura = null;
    nuvemLerParaSincronizar(false);
  }, espera);
}

function nuvemTratarLeitura(estadoNuvem, estatus, confirmandoVazio) {
  if (apagando) return; // a apagar o progresso: não repor nada
  arranque.nuvemEstatus = estatus;

  if (estatus === 'erro') {
    // Erro NÃO é "nuvem vazia": não grava nada, não troca o estado, não liberta
    // o envio. O jogo segue com o local (já gravado no aparelho) e tenta ler outra vez.
    arranque.nuvemErro = true;
    arranque.ganhou = 'erro (fica o local)';
    nuvemAgendarReleitura();
    nuvemAtualizarDiagPerfil();
    return;
  }

  arranque.nuvemErro = false;

  if (estatus === 'vazio') {
    const temProgresso = !!state.ultimaGravacaoEm || (typeof temProgressoExistente === 'function' && temProgressoExistente());
    if (!temProgresso) { // conta nova: nada a copiar, sem esperas
      arranque.respondeu = true;
      arranque.respostaMs = Date.now() - arranque.abertoEm;
      arranque.ganhou = 'sem nuvem';
      arranque.adiada = false;
      nuvemAtualizarDiagPerfil();
      return;
    }
    if (!confirmandoVazio) {
      // Pode ser uma resposta vazia passageira: só copia o local depois de uma
      // 2.ª leitura, uns 10 s depois, a confirmar que continua vazio.
      arranque.nuvemEstatus = 'vazio (a confirmar)';
      arranque.ganhou = 'a confirmar vazio';
      setTimeout(function () { nuvemLerParaSincronizar(true); }, NUVEM_CONFIRMAR_VAZIO_MS);
      nuvemAtualizarDiagPerfil();
      return;
    }
    arranque.respondeu = true;
    arranque.respostaMs = Date.now() - arranque.abertoEm;
    arranque.ganhou = 'sem nuvem';
    arranque.adiada = false;
    nuvemGuardarEstado(state); // vazio confirmado: copia o local para a nuvem
    nuvemAtualizarDiagPerfil();
    return;
  }

  // estatus === 'ok'
  arranque.respondeu = true;
  arranque.respostaMs = Date.now() - arranque.abertoEm;

  // O local conta com o carimbo de ANTES das gravações de arranque, a não ser
  // que o jogador tenha feito uma ação real antes de a nuvem responder: aí o
  // local é mesmo o mais recente.
  const localEm = arranque.acaoReal ? (state.ultimaGravacaoEm || 0) : arranque.localEm;
  const nuvemEm = estadoNuvem.ultimaGravacaoEm || 0;
  arranque.nuvemEm = nuvemEm;
  arranque.nuvemRep = estadoNuvem.reputacao;

  // Rede de segurança: a Reputação só sobe (nada a subtrai), por isso uma nuvem
  // com mais Reputação do que o local tem mais progresso, mesmo que o carimbo
  // local seja mais recente.
  const repLocal = Number.isFinite(state.reputacao) ? state.reputacao : 0;
  const repNuvem = Number.isFinite(estadoNuvem.reputacao) ? estadoNuvem.reputacao : 0;
  const nuvemTemMaisReputacao = repNuvem > repLocal;

  if (localEm >= nuvemEm && !nuvemTemMaisReputacao) {
    arranque.ganhou = 'local';
    // Capítulos: o que a nuvem tiver a mais (outro aparelho) entra por união.
    const juntos = nuvemJuntarCapitulos(state.capitulos, estadoNuvem.capitulos);
    const mudou = JSON.stringify(juntos) !== JSON.stringify(state.capitulos);
    if (mudou) state.capitulos = juntos;
    const havia = arranque.adiada;
    arranque.adiada = false;
    if (localEm > nuvemEm || mudou || havia) nuvemGuardarEstado(state); // UMA só gravação: alinha a nuvem com o local, que é mais recente
    nuvemAtualizarDiagPerfil();
    return;
  }

  // A nuvem tem progresso mais recente (ex: o jogador jogou noutro
  // aparelho) ou mais Reputação: usa-a, guarda-a também no localStorage deste
  // aparelho, e refresca o ecrã atual com os novos valores. O que ficou retido
  // (estado antigo de arranque) nunca é enviado.
  arranque.ganhou = (localEm >= nuvemEm) ? 'nuvem (mais reputação)' : 'nuvem';
  arranque.adiada = false;
  const capitulosLocais = state.capitulos;
  state = mergeDeep(defaultState(), estadoNuvem);
  state.capitulos = nuvemJuntarCapitulos(capitulosLocais, state.capitulos);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  // Só agora (progresso local + nuvem já juntos) é que se pode
  // confirmar com segurança se é um jogador antigo — ver
  // avaliarJogadorAntigo() em js/state.js. Sem isto, um veterano num
  // aparelho novo (ou com a memória limpa) só teria o seu progresso de
  // volta neste momento, e sem este novo despiste ficaria trancado como
  // se fosse um jogador novo.
  if (typeof avaliarJogadorAntigo === 'function') avaliarJogadorAntigo();
  if (typeof capitulosAvaliarEmSilencio === 'function') capitulosAvaliarEmSilencio();
  // O que é do dia (objetivos e Ronda do Chizo) volta a ser decidido sobre o
  // estado adotado: se o "dia" dele for de ontem, gera objetivos novos e repõe a ronda.
  if (typeof garantirObjetivosDoDia === 'function') garantirObjetivosDoDia();
  nuvemAtualizarEcraAposSync();
  nuvemRefazerQuinta();
  nuvemAtualizarDiagPerfil();
}

function nuvemSincronizarAoAbrir() {
  if (!nuvemStorage()) { // fora do Telegram (e sem ?nuvem=teste): só localStorage, como já era
    arranque.respondeu = true;
    arranque.ganhou = 'sem nuvem';
    return;
  }

  // Ao voltar a ficar visível, se a leitura falhou, tenta outra vez já.
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible' || arranque.respondeu || !arranque.nuvemErro) return;
    if (_nuvemTimerReleitura) { clearTimeout(_nuvemTimerReleitura); _nuvemTimerReleitura = null; }
    nuvemLerParaSincronizar(false);
  });

  nuvemLerParaSincronizar(false);
}

// Se o ecrã ativo for a Quinta, refaz os cartões que dependem do estado
// (nível, capítulo, objetivos, resumo) e o pedido da Ronda do Chizo, que
// pode ter sido mostrado com o estado antigo.
function nuvemRefazerQuinta() {
  const ativo = document.querySelector('.screen.active');
  if (!ativo || ativo.id !== 'screen-quinta') return;
  if (typeof atualizarCartaoNivelQuinta === 'function') atualizarCartaoNivelQuinta();
  if (typeof atualizarCapituloQuinta === 'function') atualizarCapituloQuinta();
  if (typeof atualizarCartaoObjetivosQuinta === 'function') atualizarCartaoObjetivosQuinta();
  if (typeof atualizarResumoQuinta === 'function') atualizarResumoQuinta();
  if (typeof rondaChizoEsconderCartao === 'function') {
    const cartao = document.getElementById('app-pedido');
    if (cartao && !cartao.hidden) {
      rondaChizoEsconderCartao();
      if (typeof mostrarFalas === 'function') mostrarFalas([]); // tira o balão do pedido velho
    }
    const balao = document.getElementById('app-dialogue');
    if (balao && balao.hidden && typeof rondaChizoAvaliar === 'function') rondaChizoAvaliar();
  }
}

// DIAGNOSTICO TEMPORARIO - remover (junto com perfilDiagArranque() em js/perfil.js)
function nuvemAtualizarDiagPerfil() {
  if (typeof perfilDiagArranque === 'function') perfilDiagArranque();
}

// -----------------------------------------------------------------
// APAGAR O PROGRESSO (botão do Perfil, ver js/perfil.js)
// -----------------------------------------------------------------

const NUVEM_LIMITE_APAGAR_MS = 8000; // tempo máximo de cada chamada à nuvem ao apagar
const NUVEM_PREFIXO_APAGAR = 'yc_state_'; // apanha o meta e todas as partes (também as órfãs)

// Cancela a gravação na nuvem que estiver agendada (o temporizador de
// 800 ms). A bandeira "apagando" é ligada por quem chama.
function nuvemCancelarGravacaoPendente() {
  if (_nuvemTimerGravacao) clearTimeout(_nuvemTimerGravacao);
  _nuvemTimerGravacao = null;
  _nuvemEstadoPendente = null;
}

// Nuvem a usar ao apagar: a de teste/erro (se pedido no endereço), ou a
// do Telegram se existir e for da versão 6.9 ou mais recente (a primeira
// com getKeys/removeItems). Sem nuvem devolve null.
function nuvemStorageParaApagar() {
  const s = nuvemStorage();
  if (!s) return null;
  if (nuvemModoTeste() || nuvemModoErro()) return s;
  if (typeof tg.isVersionAtLeast === 'function' && tg.isVersionAtLeast('6.9')) return s;
  return null;
}

// Chama fn(cb) e garante UMA só resposta a cb(erro, resultado): se o
// Telegram não responder dentro do limite, responde com erro.
function nuvemComLimite(fn, cb) {
  let respondeu = false;
  const timer = setTimeout(function () {
    if (respondeu) return;
    respondeu = true;
    cb(new Error('tempo esgotado'));
  }, NUVEM_LIMITE_APAGAR_MS);
  try {
    fn(function (erro, resultado) {
      if (respondeu) return;
      respondeu = true;
      clearTimeout(timer);
      cb(erro, resultado);
    });
  } catch (e) {
    if (respondeu) return;
    respondeu = true;
    clearTimeout(timer);
    cb(e);
  }
}

// Apaga da nuvem todas as chaves "yc_state_*". callback(true) se correu
// bem (ou se não há nuvem); callback(false) se deu erro ou não respondeu.
function nuvemApagarTudo(callback) {
  const storage = nuvemStorageParaApagar();
  if (!storage) { callback(true); return; }

  nuvemComLimite(function (cb) { storage.getKeys(cb); }, function (erroChaves, chaves) {
    if (erroChaves || !Array.isArray(chaves)) { callback(false); return; }
    const aApagar = chaves.filter(function (c) { return String(c).indexOf(NUVEM_PREFIXO_APAGAR) === 0; });
    if (aApagar.length === 0) { callback(true); return; }

    nuvemComLimite(function (cb) { storage.removeItems(aApagar, cb); }, function (erroApagar) {
      callback(!erroApagar);
    });
  });
}

nuvemSincronizarAoAbrir();
