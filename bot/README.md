# YoshiCat bot (Telegram)

Etapa 1 — o "Olá". Este Worker da Cloudflare responde a quem escrever ao bot no Telegram:

- Num pedido `GET`, mostra apenas o texto `YoshiCat bot ativo` (serve para confirmar que o Worker está no ar).
- Num pedido `POST` (é o Telegram a avisar de uma mensagem nova), o Worker verifica primeiro se o pedido é mesmo do Telegram, através do cabeçalho secreto do webhook. Se estiver tudo certo, responde na mesma conversa com "Olá, guardião! 🐱🍇".

## Segredos

Este bot precisa de dois segredos para funcionar:

- `BOT_TOKEN` — o token do bot, dado pelo Telegram (BotFather).
- `WEBHOOK_SECRET` — uma palavra-passe escolhida por nós, para confirmar que quem chama o Worker é mesmo o Telegram.

**Estes dois valores nunca devem aparecer no código nem em nenhum ficheiro do repositório.** Configuram-se apenas no cofre de segredos da Cloudflare (com o comando `wrangler secret put`, ou no painel da Cloudflare). O `wrangler.jsonc` não contém nenhum destes valores de propósito.

Esta etapa não faz deploy nem liga o webhook ao Telegram — é só o código base.
