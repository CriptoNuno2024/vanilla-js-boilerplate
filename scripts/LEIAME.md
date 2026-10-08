# Verificação dos níveis

Corre antes de cada PR, na pasta do projeto: `node scripts/verificar-niveis.js`
Imprime `OK` (código 0) ou a lista do que falta, por nível e chave (código 1).
Só lê os ficheiros de `js/`; não altera nada e não precisa de instalar nada.

# Cartão "Nova entrada!"

`node scripts/verificar-cartao-entrada.js` — teste puro: abaixo do Nível 4 não há cartão, no Nível 4 ou mais há, e o jogador antigo vê sempre o cartão. Imprime `OK` (código 0) ou o que falhou (código 1).

# Curiosidades da Ronda por época

`node scripts/verificar-ronda-curiosidades.js` — teste puro: em outubro a 'poda' nunca é escolhida e a 'vindima' pode ser; em janeiro o contrário; nos outros meses nenhuma das duas; as candidatas nunca ficam a 0. Imprime `OK` (código 0) ou o que falhou (código 1).

# Ronda do Chizo a meio ao mudar o dia

`node scripts/verificar-ronda-pendente.js` — com state.js, niveis.js, ronda.js, objetivos.js e nuvem.js reais em vm: uma ronda mandada num dia paga na 1.ª visita do dia seguinte, uma só vez (+2 Reputação, +2 gotas, uvas iguais) e conta como a 1.ª do dia novo; passa a meia-noite (23:50 → 00:30), 3 dias seguidos a abrir uma vez, vários dias sem abrir (1 pagamento), relógio a recuar antes e depois de pagar, dados inválidos ou antigos repostos, limite de 2 por dia e espera de 4 h, estado de ontem vindo da nuvem, e `ronda.js` antes de `objetivos.js` no index.html. `RONDA_JS=ficheiro` / `OBJETIVOS_JS=ficheiro` testam outras versões (provas negativas). Imprime `OK` (código 0) ou o que falhou (código 1).

# Página do Caderno na vitória do Proteger

`node scripts/verificar-caderno-vitoria.js` — fluxo em vm: vitória com prémio na ronda 1 e pista dá 1 página (data de Lisboa), sem duplicar; treino, perda, ronda extra, ?pista=, nível < 3, adega e Cave fechada não dão; alvo completo dá só a fala; o resto do estado não muda.

# Visitas à Quinta

`node scripts/verificar-visitas.js [--final]` — dados e funções puras de js/visitas.js (a linha no cartão da Quinta usa-as): abaixo do nível 4 nunca há visita; 60 dias × contextos respeitam as condições; no máximo 1 por dia; estável; reputação 1 a 3; sem repetir até esgotar as possíveis (depois ciclo: sai a feita há mais tempo e nunca a do dia anterior, simulado em 40 dias); ~1 em 4 dias sem visita. `--final` falha enquanto houver "[por escrever]" (36 textos hoje). `VISITAS_JS=ficheiro` testa outra versão do ficheiro.

`node scripts/verificar-visitas-estado.js` — estado e pagamento das Visitas com o state.js, niveis.js e visitas.js reais em vm: conta antiga carrega, nível < 4 nunca grava, a visita de hoje é estável e repõe-se, o pagamento é único (toque duplo) e exato, o modo de teste não grava nem paga, o resto do estado fica igual, sem repetir até esgotar. `VISITAS_JS=ficheiro` testa outra versão de js/visitas.js.

# Nota do nível 6 e Coleção

`node scripts/verificar-colecao.js` — também o capítulo 6 «A Coleção» (0 a 4 cores, nota null, garrafas anteriores à nota, festa, cap6 já concluído, textos); `state.niveis.garrafasAoNivel6` e `colecaoGarrafasNovas` / `colecaoCoresFeitas` (js/garrafa.js), com state.js, niveis.js e garrafa.js reais em vm: campo null por omissão e na migração; carimbo ao entrar na Quinta já no nível 6 (e na subida 5 → 6); carimbo no Engarrafar com a garrafa a contar; nunca muda depois de escrito; cada cor detetada; garrafas de festa não contam; lista vazia com o campo null.

# Estrada (vizinhos e bens, só dados)

`node scripts/verificar-estrada.js [--final]` — dados de js/estrada-dados.js e o ecrã js/estrada.js: 4 vizinhos (Dona Amélia, Sr. Joaquim, Tomás e Sr. Armindo) com 3 falas e a fala de troca em pt/en/es, 4 bens (queijo, sal, mel e choco do Sado) com nome nas 3 línguas, o pedido do dia de cada vizinho, a ordem de empate das ofertas (queijo, mel, sal, choco) e 12 falas de oferta (3 visitas x 4 bens), a cena de cada vizinho (ESTRADA_CENAS em js/estrada.js e o ficheiro em assets/ecras), cada fala com facto tem "fonte" (só as fontes e endereços aprovados) ou "semFacto: true", a troca provisória sem gotas, e que nada usa estes dados fora de js/despensa.js e js/estrada.js. Se uma cara tem caraPendente: false, o ficheiro tem de existir; se for true, pode faltar. `--final` falha enquanto houver "[por escrever]". `ESTRADA_JS=ficheiro` testa outra versão.

# Despensa da Estrada (estado e funções puras, sem uso)

`node scripts/verificar-despensa.js` — `state.despensa` em js/state.js e as funções de js/despensa.js (ainda não carregado pelo jogo), com state.js, estrada-dados.js e despensa.js reais em vm: campo vazio por omissão; save antigo e estado da nuvem ganham-no vazio (mergeDeep, sem migração); "Apagar o meu progresso" leva o estado inteiro; 1.ª troca (primeiraVez), 2.ª no mesmo dia com o mesmo vizinho recusada, outro vizinho aceite, dia novo reinicia `hoje`; entrega (`despensaRegistarEntrega`) com stock aceite, sem stock (`sem_stock`) e com n inválido (0, negativo, fração) ou bem inexistente recusada sem alterar nada, a quantidade (recebidos menos entregues) nunca abaixo de 0, e save antigo ganha também `entregues` vazio; ids e dias inválidos recusados sem alterar nada; o estado só sobe (400 trocas); estado estranho é reparado; despensa.js é puro (sem Math.random, Date.now, gravação, Reputação nem uvas) e nada mais no jogo (index.html e restantes JS) o usa (exceção: o capítulo 7 em js/capitulos.js só lê o caminho 'despensa.recebidos', e os textos dizem "Despensa"). `DESPENSA_JS=ficheiro` testa outra versão de js/despensa.js.

# Nível 7 (nível, capítulo 7 e conquistas)

`node scripts/verificar-nivel7.js` — NIVEIS_CONFIG com 7 níveis (limiar 1000, sem tranca de ecrã nova), cap7 (critério `temChaves`: queijo, sal e mel pelos ids em `despensa.recebidos`, lido como 0 / 3 mesmo com a despensa vazia ou estranha; queijo + sal + um 4.º bem de teste NÃO cumpre, uma chave a 0 ou que não é número não conta, quem já concluiu o cap7 não perde nada e o capítulo 7 não trava a subida de nível; `CAPITULOS_JS=ficheiro` testa outra versão para provar que o critério antigo falha), "Quinta completa" que só conta os capítulos de nível 6 ou menos (quem tinha os 6 não a perde), "Boa vizinhança" ligada ao cap7 e o total de 14 conquistas, com state.js, niveis.js, capitulos.js, conquistas.js, estrada-dados.js e despensa.js reais em vm. Os textos e a história do nível 7 nas 3 línguas são verificados por `verificar-niveis.js`.
