# YoshiCat bot (Telegram)

Etapa 2 — registo de utilizadores. Este Worker da Cloudflare fala com quem escrever ao bot no Telegram e guarda se essa pessoa quer receber avisos.

## O que faz

- Num pedido `GET`, mostra apenas `YoshiCat bot ativo` (serve para confirmar que o Worker está no ar).
- Num pedido `POST` (o Telegram a avisar de uma mensagem nova), verifica primeiro o cabeçalho secreto do webhook. Se não bater certo, recusa.
- Só trata conversas privadas. Grupos e o resto são ignorados.
- Cada mensagem recebida regista a pessoa na base de dados (se já estiver registada, não muda as suas preferências).
- Responde sempre `200` ao Telegram, para ele não repetir o pedido. Se a base de dados falhar, o bot responde "Tive um problema, tenta daqui a pouco." e regista só uma mensagem genérica, sem dados de ninguém.

## Comandos

- `/parar` — desliga os avisos.
- `/ligar` — liga os avisos.
- `/estado` — diz se os avisos estão ligados ou desligados.
- Qualquer outra mensagem (incluindo `/start`) — responde "Olá, guardião! 🐱🍇" com uma linha a explicar `/parar` e `/ligar`.

Os comandos funcionam também com o nome do bot (por exemplo `/parar@nome_do_bot`) e em maiúsculas ou minúsculas.

## Base de dados

Usa a base de dados D1 `yoshicat-db` (ligação `DB` no `wrangler.jsonc`). A tabela `utilizadores` está descrita em `schema.sql` (só documentação; já foi criada à mão na Cloudflare). Guarda apenas:

- o número da conversa (`chat_id`);
- se os avisos estão ligados (`avisos_ligados`);
- as datas de criação e de última atualização.

Não guarda nomes, textos de mensagens nem mais nada.

## Segredos

Este bot precisa de dois segredos:

- `BOT_TOKEN` — o token do bot, dado pelo Telegram (BotFather).
- `WEBHOOK_SECRET` — uma palavra-passe escolhida por nós, para confirmar que quem chama o Worker é mesmo o Telegram.

**Estes valores nunca devem aparecer no código nem em ficheiros do repositório.** Configuram-se apenas no cofre de segredos da Cloudflare (`wrangler secret put` ou painel). Nunca são escritos em logs nem em respostas.

Esta etapa não faz deploy nem liga o webhook ao Telegram.
