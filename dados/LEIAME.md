# Pasta de dados

Esta pasta é para juntar conteúdo novo ao jogo (visitas, níveis, histórias, capítulos e objetivos) escrito **só como dados**, sem mexer no código. Quem escreve é o Nuno, com o Claude.ai, e um dia o «Mestre da Quinta».

**O jogo lê esta pasta.** Carrega os 5 ficheiros pela ordem do `index.html`, a seguir às listas que alimentam e antes do `main.js`, e cada entrada entra na lista certa através de `dadosAcrescentar` (`js/dados.js`). **Hoje só `dados/visitas.js` tem uma entrada real (a visita `marisa_5`); os outros 4 ficheiros só têm comentários.**

| Ficheiro | O que lá vai | Estado |
|---|---|---|
| `dados/visitas.js` | visitas novas | suportado (já tem `marisa_5`) |
| `dados/niveis.js` | níveis novos | suportado (ainda sem entradas) |
| `dados/historias.js` | histórias de nível novas | suportado (ainda sem entradas) |
| `dados/capitulos.js` | capítulos novos | suportado (ainda sem entradas) |
| `dados/objetivos.js` | objetivos diários | **ainda NÃO suportado** (cada objetivo precisa de uma regra no código); o ficheiro só tem comentários |

Cada entrada acrescenta-se com `dadosAcrescentar('visitas', { ... })` (`js/dados.js`). Uma entrada **mal escrita é ignorada** e o jogo avisa na consola (`[dados] ... ignorada: motivo`); nunca parte o arranque e nunca substitui uma entrada que já existe.

Forma de cada tipo (os textos são sempre `{ pt, en, es }`):

- visita: `{ id, personagem, reputacao (1 a 3), condicao (ou null), texto }`
- nível: `{ id, min, nome }` (o `min` tem de ser maior que o do último nível)
- história: `{ id, nivel (a partir do 2), falas: [ { texto, foto, som } ] }`
- capítulo: `{ id, nivel, criterio: [ ... ], titulo, objetivo, conclusao, falante }`

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
- `scripts/verificar-dados-carregar.js` prova que entradas mal escritas são ignoradas, que uma entrada existente nunca é substituída e que as 12 visitas de origem ficam iguais.

### A ter em conta quando houver um nível 11 a sério

Observações do ensaio (não falham; o jogo não foi alterado por causa delas):

- **Nível sem história não mostra mensagem de subida.** Só o cartão muda. Por isso um nível novo traz sempre a sua história (o validador já o exige).
- **`?capitulo=N` só aceita 1 a 10.** Não dá para ver a celebração de um capítulo 11 com o modo de teste.
- **A celebração de um capítulo não olha ao nível.** Se o critério já estiver cumprido, celebra-o mesmo num nível mais baixo (só o cartão respeita o nível).
- **`nivelMostrado` pode ficar a 11 sem o pacote.** Se o pacote deixar de existir, o estado guardado fica com um nível que o jogo já não tem; se mais tarde entrar OUTRO nível 11, a sua história não aparece a quem já o «viu».

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
