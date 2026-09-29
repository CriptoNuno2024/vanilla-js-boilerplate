# YoshiCat bot (Telegram)

Etapas 2 e 3 — registo de utilizadores e despertador diário. Este Worker da Cloudflare fala com quem escrever ao bot no Telegram e guarda se essa pessoa quer receber avisos.

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

## Despertador (Cron)

O Worker acorda sozinho de hora a hora (às 00:00, 01:00, 02:00... em hora UTC, definido em `triggers` no `wrangler.jsonc`). Cada vez que acorda, vê que horas são em Lisboa (o fuso "Europe/Lisbon", por isso a mudança de hora de verão/inverno é tratada sozinha):

- Se **não** forem 10h em Lisboa, não faz nada e volta a dormir.
- Se forem 10h, envia um aviso a quem tem os avisos ligados (até 40 pessoas por execução, por causa do limite de 50 pedidos externos do plano grátis).
- O texto muda com o dia da semana: 7 textos, da segunda-feira (1.º) ao domingo (7.º).
- Se alguém tiver bloqueado o bot (o Telegram responde 403), os avisos dessa pessoa ficam desligados automaticamente.

Antes de abrir o bot a mais pessoas é preciso enviar em lotes e marcar quem já foi avisado hoje.

### /testeaviso

Comando de teste, não aparece na mensagem de ajuda. Envia o texto do dia só a quem o escreveu, a qualquer hora, sem mexer em mais ninguém. **Remover ou proteger antes de abrir a outras pessoas.**

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
