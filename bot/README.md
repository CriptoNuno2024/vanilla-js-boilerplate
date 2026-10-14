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

O Worker acorda sozinho de 5 em 5 minutos (às :00, :05, :10... em hora UTC, definido em `triggers` no `wrangler.jsonc`). Cada vez que acorda, vê que horas são em Lisboa (o fuso "Europe/Lisbon", por isso a mudança de hora de verão/inverno é tratada sozinha):

- Se **não** forem 10h em Lisboa, não faz nada e volta a dormir (nem consulta a base de dados).
- Se forem 10h, calcula a data de hoje em Lisboa (`AAAA-MM-DD`) e procura **até 25 pessoas** com os avisos ligados que **ainda não foram avisadas hoje** (`ultimo_aviso_dia` vazio ou diferente de hoje).
- Envia o aviso a cada uma e, no fim, marca `ultimo_aviso_dia` = hoje **só em quem recebeu**, tudo de uma vez numa única operação em lote (`DB.batch`).
- Na execução seguinte (5 minutos depois) apanha as próximas 25, e assim por diante até ninguém faltar. Ninguém recebe duas vezes no mesmo dia, mesmo havendo 12 execuções na hora das 10h.
- Se um envio falhar (rede, erro do Telegram...), essa pessoa **não** é marcada e volta a ser tentada na execução seguinte, ainda dentro das 10h.
- Se alguém tiver bloqueado o bot (o Telegram responde 403), o registo dessa pessoa é apagado automaticamente (no mesmo lote do fim da execução).
- O texto muda com o dia da semana: 7 textos, da segunda-feira (1.º) ao domingo (7.º). Cada texto termina com "Para parar: /parar".

### Limite do plano grátis (conta feita)

O plano grátis permite **50 pedidos externos por execução**, e contam tanto os envios ao Telegram como as consultas à D1. A conta, no pior caso:

| Pedido | Quantos |
| --- | --- |
| Procurar quem falta avisar (`SELECT`) | 1 |
| Envios ao Telegram (`sendMessage`), no máximo 25 pessoas | 25 |
| Marcar quem recebeu e apagar quem bloqueou o bot (um só `DB.batch`) | 1 |
| Repetição do lote, só se o primeiro falhar | 1 |
| **Total máximo** | **28** |

Sobra margem (22 pedidos) mesmo que a D1 falhe. Cada pessoa gasta no máximo 1 envio, e quem recebe ou bloqueia só entra uma vez no lote, por isso o total nunca passa de 1 + 25 + 2 = 28. Quando já ninguém falta avisar, a execução gasta só 1 pedido.

**Capacidade:** 25 pessoas por execução × 12 execuções na hora das 10h (às 10:00, 10:05 ... 10:55) = **300 pessoas por dia**. Para passar disso é preciso subir o tamanho do lote (sem passar dos 50 pedidos: o lote máximo seguro ronda as 45 pessoas, ou seja 540 por dia) ou pagar o plano que tem mais pedidos.

Limites conhecidos: se alguém usar `/parar` (ou `/apagar`) e voltar a usar `/ligar` na própria hora das 10h, depois de já ter recebido o aviso, o registo é novo (sem data) e pode receber o aviso outra vez nesse dia. Se uma execução não acabar antes da seguinte (5 minutos), as duas podiam enviar à mesma pessoa; com 25 envios seguidos isso não costuma acontecer.

## Base de dados

Usa a base de dados D1 `yoshicat-db` (ligação `DB` no `wrangler.jsonc`). A tabela `utilizadores` está descrita em `schema.sql` (só documentação; já foi criada à mão na Cloudflare). Guarda apenas:

- o número da conversa (`chat_id`);
- se os avisos estão ligados (`avisos_ligados`, sempre 1 enquanto o registo existir);
- as datas de criação e de última atualização;
- o dia do último aviso enviado (`ultimo_aviso_dia`, data de Lisboa `AAAA-MM-DD`; vazio enquanto ainda não recebeu nenhum). É a única coisa guardada para o envio em lotes.

**Passo manual (uma só vez, ANTES de publicar esta versão do Worker):** a tabela já existe, por isso a coluna nova tem de ser acrescentada à mão, na consola da D1 (Cloudflare → D1 → `yoshicat-db` → Console):

```sql
ALTER TABLE utilizadores ADD COLUMN ultimo_aviso_dia TEXT;
```

Se o Worker novo for publicado antes disto, a procura de destinatários falha (coluna inexistente), o erro fica registado e ninguém recebe o aviso até a coluna existir.

Só existe linha para quem escreveu `/ligar`, e é apagada com `/parar`, `/apagar` ou se a pessoa bloquear o bot. Não guarda nomes, textos de mensagens nem mais nada.

## Segredos

Este bot precisa de dois segredos:

- `BOT_TOKEN` — o token do bot, dado pelo Telegram (BotFather).
- `WEBHOOK_SECRET` — uma palavra-passe escolhida por nós, para confirmar que quem chama o Worker é mesmo o Telegram.

**Estes valores nunca devem aparecer no código nem em ficheiros do repositório.** Configuram-se apenas no cofre de segredos da Cloudflare (`wrangler secret put` ou painel). Nunca são escritos em logs nem em respostas.

Esta etapa não faz deploy nem liga o webhook ao Telegram.
