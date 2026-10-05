# Verificação dos níveis

Corre antes de cada PR, na pasta do projeto: `node scripts/verificar-niveis.js`
Imprime `OK` (código 0) ou a lista do que falta, por nível e chave (código 1).
Só lê os ficheiros de `js/`; não altera nada e não precisa de instalar nada.

# Cartão "Nova entrada!"

`node scripts/verificar-cartao-entrada.js` — teste puro: abaixo do Nível 4 não há cartão, no Nível 4 ou mais há, e o jogador antigo vê sempre o cartão. Imprime `OK` (código 0) ou o que falhou (código 1).

# Curiosidades da Ronda por época

`node scripts/verificar-ronda-curiosidades.js` — teste puro: em outubro a 'poda' nunca é escolhida e a 'vindima' pode ser; em janeiro o contrário; nos outros meses nenhuma das duas; as candidatas nunca ficam a 0. Imprime `OK` (código 0) ou o que falhou (código 1).
