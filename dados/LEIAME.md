# Pasta de dados

Esta pasta é para juntar conteúdo novo ao jogo (visitas, níveis, histórias, capítulos e objetivos) escrito **só como dados**, sem mexer no código. Quem escreve é o Nuno, com o Claude.ai, e um dia o «Mestre da Quinta».

**Por agora os 5 ficheiros estão vazios (só têm comentários) e o jogo não ganha nada.** O jogo já os carrega, pela ordem do `index.html`, a seguir às listas que alimentam e antes do `main.js`:

| Ficheiro | O que lá vai | Estado |
|---|---|---|
| `dados/visitas.js` | visitas novas | suportado |
| `dados/niveis.js` | níveis novos | suportado |
| `dados/historias.js` | histórias de nível novas | suportado |
| `dados/capitulos.js` | capítulos novos | suportado |
| `dados/objetivos.js` | objetivos diários | **ainda não suportado** (cada objetivo precisa de uma regra no código) |

Cada entrada acrescenta-se com `dadosAcrescentar('visitas', { ... })` (`js/dados.js`). Uma entrada **mal escrita é ignorada** e o jogo avisa na consola (`[dados] ... ignorada: motivo`); nunca parte o arranque e nunca substitui uma entrada que já existe.

Forma de cada tipo (os textos são sempre `{ pt, en, es }`):

- visita: `{ id, personagem, reputacao (1 a 3), condicao (ou null), texto }`
- nível: `{ id, min, nome }` (o `min` tem de ser maior que o do último nível)
- história: `{ id, nivel (a partir do 2), falas: [ { texto, foto, som } ] }`
- capítulo: `{ id, nivel, criterio: [ ... ], titulo, objetivo, conclusao, falante }`

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
3. **Sem `<`, `>` nem `&`** nos textos: alguns cartões montam o ecrã com HTML e estes caracteres podem partir tudo. Escreve «e» em vez de «&».
4. **Sem dados pessoais nem segredos** nos textos: nada de emails, links, endereços, `chat_id`, nome real ou morada.
5. **Imagens e sons**: os ficheiros têm de existir em `assets/` (e ser enviados ao repositório à parte). O caminho tem de estar certo.
6. **Visitas**: a personagem tem de existir, `reputacao` é um número de 1 a 3, e a condição é de um tipo que o jogo conhece (`estacao`, `fase`, `festa`, `garrafa`, `cave`) com um valor válido (as 4 estações; as fases da videira).
7. **Níveis**: o limiar (`min`) tem de ser maior que o do nível anterior. Um nível novo traz sempre o pacote completo: **nome, história e capítulo**.
8. **Capítulos**: o critério é de um tipo conhecido (`numero`, `booleano`, `contarChaves`, `temChaves`, `contarLista`, `coresColecao`, `algumaEntrada`) e lê um caminho que **já existe** no estado do jogo.

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
