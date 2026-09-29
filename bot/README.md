# YoshiCat bot (Telegram)

Avisos diários por Telegram, com registo só para quem o pedir. Este Worker da Cloudflare fala com quem escrever ao bot no Telegram e envia um aviso por dia a quem pedir com `/ligar`.

## O que faz

- Num pedido `GET`, mostra apenas `YoshiCat bot ativo` (serve para confirmar que o Worker está no ar).
- Num pedido `POST` (o Telegram a avisar de uma mensagem nova), verifica primeiro o cabeçalho secreto do webhook, com uma comparação de tempo constante. Se faltar ou não bater certo, responde `403` e não faz mais nada.
- Só trata conversas privadas. Grupos e o resto são ignorados.
- **Ninguém fica registado só por escrever ao bot.** O registo só acontece com o comando `/ligar`.
- Responde sempre `200` ao Telegram, para ele não repetir o pedido. Se a base de dados falhar, o bot responde "Tive um problema, tenta daqui a pouco." e regista só uma mensagem genérica, sem dados de ninguém.

## Comandos

- `/ligar` — regista a pessoa e liga os avisos (um por dia, por volta das 10h).
- `/parar` — desliga os avisos e apaga o registo.
- `/apagar` — apaga o registo do nosso servidor (o progresso do jogo fica só no telemóvel e na conta do Telegram).
- `/estado` — diz se os avisos estão ligados ou desligados (só lê, não grava nada).
- Qualquer outra mensagem (incluindo `/start`) — responde "Olá, guardião! 🐱🍇" com uma explicação curta dos comandos. Não regista ninguém.

Os comandos funcionam também com o nome do bot (por exemplo `/parar@nome_do_bot`) e em maiúsculas ou minúsculas. Todos atuam sempre e só sobre a conversa de quem enviou a mensagem.

## Despertador (Cron)

O Worker acorda sozinho de hora a hora (às 00:00, 01:00, 02:00... em hora UTC, definido em `triggers` no `wrangler.jsonc`). Cada vez que acorda, vê que horas são em Lisboa (o fuso "Europe/Lisbon", por isso a mudança de hora de verão/inverno é tratada sozinha):

- Se **não** forem 10h em Lisboa, não faz nada e volta a dormir.
- Se forem 10h, envia um aviso a quem está registado com os avisos ligados (até 40 pessoas por execução, por causa do limite de 50 pedidos externos do plano grátis).
- O texto muda com o dia da semana: 7 textos, da segunda-feira (1.º) ao domingo (7.º).
- Cada texto termina com "Para parar: /parar".
- Se alguém tiver bloqueado o bot (o Telegram responde 403), o registo dessa pessoa é apagado automaticamente.

Antes de abrir o bot a mais pessoas é preciso enviar em lotes e marcar quem já foi avisado hoje.

## Base de dados

Usa a base de dados D1 `yoshicat-db` (ligação `DB` no `wrangler.jsonc`). A tabela `utilizadores` está descrita em `schema.sql` (só documentação; já foi criada à mão na Cloudflare). Guarda apenas:

- o número da conversa (`chat_id`);
- se os avisos estão ligados (`avisos_ligados`, sempre 1 enquanto o registo existir);
- as datas de criação e de última atualização.

Só existe linha para quem escreveu `/ligar`, e é apagada com `/parar`, `/apagar` ou se a pessoa bloquear o bot. Não guarda nomes, textos de mensagens nem mais nada.

## Segredos

Este bot precisa de dois segredos:

- `BOT_TOKEN` — o token do bot, dado pelo Telegram (BotFather).
- `WEBHOOK_SECRET` — uma palavra-passe escolhida por nós, para confirmar que quem chama o Worker é mesmo o Telegram.

**Estes valores nunca devem aparecer no código nem em ficheiros do repositório.** Configuram-se apenas no cofre de segredos da Cloudflare (`wrangler secret put` ou painel). Nunca são escritos em logs nem em respostas.

Esta etapa não faz deploy nem liga o webhook ao Telegram.
