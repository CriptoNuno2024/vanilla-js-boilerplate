# Pasta de dados

Esta pasta é para juntar conteúdo novo ao jogo (visitas, níveis, histórias, capítulos, histórias da Enciclopédia e objetivos) escrito **só como dados**, sem mexer no código. Quem escreve é o Nuno, com o Claude.ai, e um dia o «Mestre da Quinta».

**O jogo lê esta pasta.** Carrega os 6 ficheiros pela ordem do `index.html`, a seguir às listas que alimentam (incluindo o `js/explorar.js`, da Enciclopédia) e antes do `main.js`, e cada entrada entra na lista certa através de `dadosAcrescentar` (`js/dados.js`). **Hoje `dados/` traz a visita `marisa_5` e os pacotes dos níveis 11, «Moscatel da Arrábida», e 12, «Moscatel do Sado» (cada um com nível, história, 3 histórias da Enciclopédia e capítulo); só `dados/objetivos.js` tem apenas comentários.**

| Ficheiro | O que lá vai | Estado |
|---|---|---|
| `dados/visitas.js` | visitas novas | suportado (já tem `marisa_5`) |
| `dados/niveis.js` | níveis novos | suportado (já tem `nivel_11`, 3650, e `nivel_12`, 4550) |
| `dados/historias.js` | histórias de nível novas | suportado (já tem `historia_11` e `historia_12`) |
| `dados/capitulos.js` | capítulos novos | suportado (já tem `cap11` e `cap12`) |
| `dados/enciclopedia.js` | histórias novas da Enciclopédia, com nível mínimo | suportado (já tem `arrabida_biosfera`, `arrabida_plantas`, `arrabida_mar`, `sado_reserva`, `sado_golfinhos` e `sado_troia`) |
| `dados/objetivos.js` | objetivos diários | **ainda NÃO suportado** (cada objetivo precisa de uma regra no código); o ficheiro só tem comentários |

Cada entrada acrescenta-se com `dadosAcrescentar('visitas', { ... })` (`js/dados.js`). Uma entrada **mal escrita é ignorada** e o jogo avisa na consola (`[dados] ... ignorada: motivo`); nunca parte o arranque e nunca substitui uma entrada que já existe.

Forma de cada tipo (os textos são sempre `{ pt, en, es }`):

- visita: `{ id, personagem, reputacao (1 a 3), condicao (ou null), texto }`
- nível: `{ id, min, nome }` (o `min` tem de ser maior que o do último nível)
- história: `{ id, nivel (a partir do 2), falas: [ { texto, foto, som } ] }`
- capítulo: `{ id, nivel, criterio: [ ... ], titulo, objetivo, conclusao, falante }`
- enciclopédia: `{ id, titulo, texto, nivelMinimo (inteiro a partir do 1), imagem (opcional), meses (opcional), estacao (opcional), manual (opcional, true) }`: entra nas 3 línguas de `ENCYCLOPEDIA_ENTRIES` (`js/explorar.js`)

## Como se acrescenta uma entrada

1. **Escrever** a entrada no ficheiro certo de `dados/` com `dadosAcrescentar`, a seguir ao que já lá está. Exemplo (a visita `marisa_5`, em `dados/visitas.js`):

   ```js
   dadosAcrescentar('visitas', {
     id: 'marisa_5',
     personagem: 'marisa',
     reputacao: 1,
     condicao: { tipo: 'fase', valores: ['quedaFolha'] },
     texto: { pt: '...', en: '...', es: '...' }
   });
   ```

2. **Conferir**: `node scripts/verificar-dados.js --estrito` tem de dar `OK`.
3. **Subir o `?v=`** desse ficheiro no `index.html` (ex.: `dados/visitas.js?v=2` passa a `?v=3`), para os aparelhos não ficarem com a versão antiga em cache.
4. **Abrir a PR.**

## O que já está testado

- Um ensaio geral (`scripts/verificar-piloto-nivel.js`) mete um pacote de teste completo (nível 11 + história + capítulo) por `dadosAcrescentar`, só no ambiente simulado, e vê o jogo inteiro a funcionar com ele nas 3 línguas.
- Os textos com `<b>`, `&`, aspas e plicas saem escapados nos cartões (nível e capítulo).
- O estado guardado só tem ids, e carrega bem se o pacote deixar de existir.
- `scripts/verificar-nivel-12.js` prova o nível 12 real da mesma maneira (4550 dá o nível 12, a história de 4 falas com a foto que existe e sem som, as 3 entradas só no nível 12, os dois grupos de `nivelMinimo` no Explorar, o capítulo 12, estado só com ids e o jogo a carregar se o pacote do 12 deixasse de existir) e que o jogo até ao nível 11 fica igual.
- `scripts/verificar-nivel-11.js` prova o nível 11 real de ponta a ponta, em pt, en e es (3650 dá o nível 11, a história de 4 falas com a foto que existe, as 3 entradas só no nível 11 e primeiro no Explorar, o capítulo 11, ecrãs trancados, estado só com ids e jogo a carregar se o pacote deixasse de existir) e que o jogo de origem fica igual.
- `scripts/verificar-capitulo-enciclopedia.js` prova o critério `temIds` (só cumpre com todos os ids, progresso «x / n», defensivo, celebra uma só vez), a prioridade das histórias com `nivelMinimo` no Explorar (e que sem elas o sorteio é igual ao de sempre) e a validação do `temIds` no jogo e em `verificar-dados.js`.
- `scripts/verificar-enciclopedia-dados.js` prova as histórias novas da Enciclopédia com nível mínimo (uma de nível 11 não aparece nem se desbloqueia no nível 4, os totais não a contam, o texto sai escapado, o estado só guarda ids e as entradas de hoje ficam idênticas).
- `scripts/verificar-dados-carregar.js` prova que entradas mal escritas são ignoradas, que uma entrada existente nunca é substituída e que as 12 visitas de origem ficam iguais.

### A ter em conta quando houver um nível 11 a sério

Observações do ensaio (não falham; o jogo não foi alterado por causa delas):

- **Nível sem história não mostra mensagem de subida.** Só o cartão muda. Por isso um nível novo traz sempre a sua história (o validador já o exige).
- **`?capitulo=N`** (resolvido) aceita agora qualquer capítulo que exista (`?capitulo=11` ou `?capitulo=cap11` mostra a celebração do capítulo 11); 1 a 10 ficam como estavam.
- **A celebração de um capítulo não olha ao nível.** Se o critério já estiver cumprido, celebra-o mesmo num nível mais baixo (só o cartão respeita o nível).
- **`nivelMostrado` pode ficar a 11 sem o pacote.** Se o pacote deixar de existir, o estado guardado fica com um nível que o jogo já não tem; se mais tarde entrar OUTRO nível 11, a sua história não aparece a quem já o «viu».

## O nível 11, «Moscatel da Arrábida» (o primeiro nível vindo de dados/)

- `dados/niveis.js`: `nivel_11`, a partir de **3650** de Reputação (o 10 acaba em 2800).
- `dados/historias.js`: `historia_11`, 4 falas. A 1.ª leva a foto `assets/ecras/arrabida_colina.jpg`. **Nenhuma leva som**: o som pensado (`vento_arvores_passaros.mp3`) é um ambiente de cerca de 112 s que, numa fala, tocaria a volume 1 (as falas não têm volume) e sem parar com a história. Para ter som numa fala é preciso primeiro um campo de volume (e uma forma de o parar) em `js/main.js`.
- `dados/enciclopedia.js`: `arrabida_biosfera`, `arrabida_plantas` e `arrabida_mar` (nível mínimo 11, sem imagem).
- `dados/capitulos.js`: `cap11` «A Serra e o Mar», critério `temIds` nessas 3 entradas (cumpre-se ao abri-las pelo Explorar, que as entrega primeiro).
- Quem está abaixo do nível 11 não vê nada disto (nem as entradas, nem o capítulo); o modo de teste `?capitulo=11` mostra a celebração do capítulo.

## O nível 12, «Moscatel do Sado» (Parte 2, A Terra)

Mesmo molde do nível 11:

- `dados/niveis.js`: `nivel_12`, a partir de **4550** de Reputação.
- `dados/historias.js`: `historia_12`, 4 falas. A 1.ª leva a foto `assets/ecras/sado_estuario.jpg`; nenhuma leva som.
- `dados/enciclopedia.js`: `sado_reserva`, `sado_golfinhos` e `sado_troia` (nível mínimo 12, sem imagem).
- `dados/capitulos.js`: `cap12` «O Rio e os Golfinhos», critério `temIds` nessas 3 entradas.
- **Dois grupos de `nivelMinimo` (11 e 12).** A prioridade do Explorar junta num só grupo todas as entradas com `nivelMinimo` que já estão disponíveis e por abrir: no nível 12, as da Arrábida ainda por abrir e as do Sado saem **todas** (as 6, por ordem aleatória) antes de qualquer entrada de hoje. Uma entrada de um nível mais baixo não passa à frente de uma de um nível mais alto. Abaixo do nível 12 o jogador não vê as do Sado.

## Histórias da Enciclopédia (`dados/enciclopedia.js`)

```js
dadosAcrescentar('enciclopedia', {
  id: 'cultura_exemplo',
  titulo: { pt: '...', en: '...', es: '...' },
  texto: { pt: '...', en: '...', es: '...' },
  nivelMinimo: 11,
  imagem: 'assets/ecras/enciclopedia_exemplo.jpg'   // opcional, tem de existir
});
```

- **Nível mínimo.** Até o jogador chegar a esse nível (o da Reputação) a entrada **não existe** para ele: não sai no sorteio do Explorar, não se desbloqueia (nem por uma ação do jogo), não aparece na Enciclopédia (nem como cartão «???»), não conta nos totais («3 / 32»), nos capítulos, na medalha Guardião nem na conquista Sábio, e não sai na curiosidade da Ronda do Chizo. A mensagem «já desbloqueaste todo o conhecimento» só conta as entradas disponíveis para o nível dele. Um jogador antigo **não** ultrapassa o nível mínimo (é conteúdo, não um ecrã trancado).
- **Ids.** `a-z`, `0-9` e `_`. O id novo não pode repetir nenhum id da Enciclopédia, em nenhuma língua. As entradas de hoje (`vindimasMaisCedo`, `boloRei`, ...) têm maiúsculas e continuam como estão.
- **Imagem.** Um caminho `assets/...` (jpg, jpeg, png, webp ou gif) que exista; o ficheiro é enviado ao repositório à parte.
- **Texto.** Título e texto são sempre escapados no ecrã (um `<b>` aparece como texto), mas o validador continua a recusar `< > &` nas entradas novas.
- **Prioridade no Explorar.** As entradas com `nivelMinimo` que já estão disponíveis, por abrir e da época (estação) saem **primeiro**: o Explorar sorteia só entre elas até estarem todas abertas, e só depois entre as restantes. As entradas de hoje não têm `nivelMinimo`, por isso sem entradas novas o sorteio é exatamente o de sempre.
- **Ligar um capítulo às histórias.** O critério `temIds` de um capítulo (`{ tipo: 'temIds', caminho: 'encyclopedia.unlocked', ids: ['...', '...', '...'] }`) cumpre-se quando **todos** os ids estão na lista e mostra o progresso «x / n» no cartão. Num caminho da Enciclopédia, cada id tem de ser uma entrada que exista (o validador confere). Um capítulo com `ids` em falta, vazios ou mal escritos é ignorado pelo jogo. Cuidado: se houver mais entradas com `nivelMinimo` do que as do capítulo, o Explorar entrega-as por ordem aleatória, por isso o capítulo pode demorar mais cliques.
- **Os outros campos** (`meses`, `estacao`, `manual`) fazem o mesmo que nas entradas de hoje: `estacao` limita o Explorar a essa estação, `manual` tira a entrada do sorteio (só se desbloqueia por uma ação), `meses` só serve à Ronda do Chizo.
- **Estado do jogador.** Só guarda o id. Se uma entrada deixar de existir o jogo carrega na mesma e o id solto não conta nos totais. **Nunca apagar um id publicado** (regra de ouro abaixo).

## Como se confere

```
node scripts/verificar-dados.js
```

Dá `OK` ou lista o que está mal. Nas entradas que vêm desta pasta, `< > &`, dados pessoais e afins são **falhas**; no conteúdo que já existia são só avisos (e com `--estrito` também falham):

```
node scripts/verificar-dados.js --estrito
```

E para provar que o jogo carrega e ignora bem as entradas:

```
node scripts/verificar-dados-carregar.js
```

## Regras de uma entrada

1. **Id**: só letras minúsculas `a-z`, números `0-9` e `_` (ex.: `valentim_5`). Tem de ser único dentro do seu tipo.
2. **Texto nas 3 línguas**: `{ pt: '...', en: '...', es: '...' }`, nenhuma vazia. Pode também vir de uma chave do `js/i18n.js`, mas nas 3 línguas.
3. **Sem `<`, `>` nem `&`** nos textos. Os cartões do jogo (objetivos, capítulos, nome do nível) já escapam o texto antes de o meter no ecrã, por isso um destes caracteres não o parte, mas o validador continua a recusá-los nas entradas novas: escreve «e» em vez de «&». As aspas são normais.
4. **Sem dados pessoais nem segredos** nos textos: nada de emails, links, endereços, `chat_id`, nome real ou morada.
5. **Imagens e sons**: os ficheiros têm de existir em `assets/` (e ser enviados ao repositório à parte). O caminho tem de estar certo.
6. **Visitas**: a personagem tem de existir, `reputacao` é um número de 1 a 3, e a condição é de um tipo que o jogo conhece (`estacao`, `fase`, `festa`, `garrafa`, `cave`) com um valor válido (as 4 estações; as fases da videira).
7. **Níveis**: o limiar (`min`) tem de ser maior que o do nível anterior. Um nível novo traz sempre o pacote completo: **nome, história e capítulo**.
8. **Capítulos**: o critério é de um tipo conhecido (`numero`, `booleano`, `contarChaves`, `temChaves`, `temIds`, `contarLista`, `coresColecao`, `algumaEntrada`) e lê um caminho que **já existe** no estado do jogo.

## Duas regras de ouro

- **Nunca apagar nem renomear um id já publicado. Só acrescentar.** O progresso dos jogadores (e a nuvem) guarda ids; mudar um deixa o progresso solto.
- **Dados só depois de o código que os lê estar mesclado e publicado.** Um aparelho com o código antigo não sabe ler campos novos.

## O que NÃO dá só com dados

Continua a precisar de código (e de uma PR com testes):

- uma **ação nova** no jogo;
- um **som ou animação novos**;
- uma **personagem nova com cara** (as caras estão em `js/personagens.js`);
- um **ecrã novo**;
- uma **festa nova** (têm cenas e regras);
- um **campo novo no estado** do jogo (contadores, registos do dia, etc.).
