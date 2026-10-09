# YoshiCat e a Quinta do Moscatel

Um jogo para o Telegram (Mini App) feito só com JavaScript, HTML e CSS, sem bibliotecas nem passo de compilação. O YoshiCat, um gato de chapéu de cowboy, devolve a vida à Quinta do Moscatel, em Setúbal: planta a vinha, faz Moscatel na adega e defende a quinta dos porcos Fygmo e Fygmo2, com a ajuda do cão Chizo. Está em português, inglês e espanhol.

## Como se joga

Trabalha a **Vinha**, faz vinho na **Adega**, protege a quinta no **Proteger** e descobre coisas no **Explorar**. Tudo isso dá Reputação, e a Reputação faz subir de nível e abre ecrãs novos. Há objetivos diários ("Hoje na Quinta"), festas ligadas à data real (São Martinho), visitas à Quinta, e o tempo real de Setúbal (Open-Meteo) e a estação do ano mudam algumas coisas.

## Os 10 níveis

| Nível | Nome | Reputação |
|---|---|---|
| 1 | Quinta Esquecida | 0 |
| 2 | Quinta Vigiada | 15 |
| 3 | Quinta Produtora | 50 |
| 4 | Quinta Conhecida | 120 |
| 5 | Quinta Afamada | 300 |
| 6 | Casa do Moscatel | 600 |
| 7 | Quinta de Boa Vizinhança | 1000 |
| 8 | Quinta de Portas Abertas | 1500 |
| 9 | Câmara de Provadores | 2100 |
| 10 | Moscatel Roxo | 2800 |

Cada nível tem a sua história, um capítulo e (do 7 em diante) um ecrã próprio: A Estrada (7), O Lagar (8), A Câmara (9) e A Cepa Roxa (10). Os limiares e os nomes estão em `js/niveis.js` e em `js/i18n.js`.

## Correr o jogo

Basta servir a pasta como ficheiros estáticos, por exemplo `python3 -m http.server`, e abrir `index.html` no browser. Fora do Telegram o progresso fica só no `localStorage`; dentro do Telegram guarda também uma segunda cópia na nuvem do Telegram (`js/nuvem.js`). Alguns atalhos de teste, que se acrescentam ao endereço, estão descritos nos comentários dos ficheiros: `?estacao=`, `?tempo=`, `?festa=`, `?pista=`, `?capitulo=`, `?visita=` e `?arcoiris=1`.

## Verificações (scripts)

Os scripts em `scripts/` só leem os ficheiros de `js/` e correm-nos num ambiente simulado em Node, sem browser nem conta real e sem instalar nada. Antes de cada alteração, corre-os todos:

```
for f in scripts/verificar-*.js; do node "$f" || echo "FALHOU $f"; done
```

Cada um imprime `OK` ou o que falhou. O que cada um verifica está em `scripts/LEIAME.md`.

## A pasta `js/`

Os ficheiros carregam pela ordem do `index.html` (`state.js` e `i18n.js` primeiro, `main.js` por último).

| Ficheiro | O que tem |
|---|---|
| `state.js` | O estado do jogo e a gravação em `localStorage` |
| `nuvem.js` | A segunda cópia do progresso na nuvem do Telegram |
| `i18n.js` | Todos os textos do jogo em português, inglês e espanhol |
| `main.js` | Arranque, navegação entre ecrãs, balão de fala e fundos |
| `som.js`, `personagens.js` | Efeitos sonoros curtos e as caras de quem fala |
| `niveis.js`, `historia.js`, `capitulos.js`, `conquistas.js` | Níveis, a história de cada nível, capítulos e Livro de Conquistas |
| `objetivos.js`, `ronda.js`, `visitas.js` | Objetivos diários, Ronda do Chizo e visitas à Quinta |
| `vinha.js`, `garrafa.js` | A Vinha e a Adega (garrafas, Cave, Coleção) |
| `proteger.js`, `assaltos.js`, `caderno.js` | O Proteger, a pista dos assaltos e o Caderno dos Fygmos |
| `explorar.js` | Explorar e Enciclopédia do Moscatel |
| `estacoes.js`, `tempo.js`, `festas.js` | Estação do ano, tempo real de Setúbal e festas |
| `estrada-dados.js`, `estrada.js`, `despensa.js` | A Estrada, os vizinhos e a Despensa |
| `lagar.js`, `camara.js`, `roxo.js` | Os ecrãs dos níveis 8, 9 e 10 |
| `perfil.js` | O Perfil |

As imagens, sons e letras estão em `assets/` (ver `CREDITOS.md`). A pasta `bot/` tem o bot do Telegram que envia um aviso por dia, a quem o pedir (ver `bot/README.md`).

## Atenção ao `?v=` no `index.html`

Cada `<script src="js/...?v=N">` do `index.html` tem um número de versão que serve para o browser não usar uma cópia antiga em cache. **Sempre que editares um ficheiro de `js/`, sobe o `?v=` desse ficheiro no `index.html`.** Se não o fizeres, quem já abriu o jogo pode continuar a ver a versão antiga.

## Origem

Nasceu do modelo vanilla-js-boilerplate (Telegram Mini Apps), com licença MIT (ver `LICENSE`).
