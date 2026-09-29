// Worker do bot do Telegram do YoshiCat.
// Etapa 2: regista quem fala com o bot (D1) e permite ligar/desligar os avisos.

const MSG_ERRO = "Tive um problema, tenta daqui a pouco.";
const MSG_AJUDA =
  "Olá, guardião! 🐱🍇\nUsa /parar para desligar os avisos e /ligar para os voltar a ligar.";

async function enviarMensagem(env, chatId, texto) {
  try {
    await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: texto }),
    });
  } catch {
    console.error("Falha ao enviar mensagem ao Telegram");
  }
}

// Extrai o comando ("/parar", "/parar@nome_do_bot", "/PARAR"...) em minúsculas; devolve "" se não for comando.
function lerComando(texto) {
  if (typeof texto !== "string" || !texto.startsWith("/")) return "";
  const primeira = texto.trim().split(/\s+/)[0];
  return primeira.split("@")[0].toLowerCase();
}

async function tratarMensagem(env, mensagem) {
  const chatId = mensagem.chat.id;
  let resposta;

  try {
    // Regista o utilizador; se já existe, não mexe em avisos_ligados.
    await env.DB.prepare(
      "INSERT INTO utilizadores (chat_id) VALUES (?) ON CONFLICT(chat_id) DO UPDATE SET atualizado_em = datetime('now')"
    )
      .bind(chatId)
      .run();

    const comando = lerComando(mensagem.text);

    if (comando === "/parar") {
      await env.DB.prepare(
        "UPDATE utilizadores SET avisos_ligados = 0, atualizado_em = datetime('now') WHERE chat_id = ?"
      )
        .bind(chatId)
        .run();
      resposta = "Feito! Os avisos ficaram desligados. Para os voltar a ligar, usa /ligar.";
    } else if (comando === "/ligar") {
      await env.DB.prepare(
        "UPDATE utilizadores SET avisos_ligados = 1, atualizado_em = datetime('now') WHERE chat_id = ?"
      )
        .bind(chatId)
        .run();
      resposta = "Feito! Os avisos ficaram ligados. Para os desligar, usa /parar.";
    } else if (comando === "/estado") {
      const linha = await env.DB.prepare(
        "SELECT avisos_ligados FROM utilizadores WHERE chat_id = ?"
      )
        .bind(chatId)
        .first();
      resposta =
        linha && linha.avisos_ligados === 0
          ? "Os avisos estão desligados. Usa /ligar para os ligar."
          : "Os avisos estão ligados. Usa /parar para os desligar.";
    } else {
      resposta = MSG_AJUDA;
    }
  } catch {
    // Mensagem genérica: sem dados do utilizador nem detalhes do erro.
    console.error("Erro na base de dados");
    resposta = MSG_ERRO;
  }

  await enviarMensagem(env, chatId, resposta);
}

export default {
  async fetch(request, env) {
    // Os segredos têm de estar sempre configurados; sem eles o bot não pode funcionar.
    if (!env.BOT_TOKEN || !env.WEBHOOK_SECRET) {
      return new Response(
        "Erro de configuração: falta BOT_TOKEN ou WEBHOOK_SECRET no cofre da Cloudflare.",
        { status: 500 }
      );
    }

    if (request.method === "GET") {
      return new Response("YoshiCat bot ativo");
    }

    if (request.method === "POST") {
      // O Telegram envia este cabeçalho com o segredo do webhook; se não bater certo, rejeitamos o pedido.
      const secretRecebido = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
      if (secretRecebido !== env.WEBHOOK_SECRET) {
        return new Response("Acesso negado", { status: 403 });
      }

      let atualizacao;
      try {
        atualizacao = await request.json();
      } catch {
        return new Response("OK", { status: 200 });
      }

      const mensagem = atualizacao && atualizacao.message;
      if (
        mensagem &&
        mensagem.chat &&
        mensagem.chat.type === "private" &&
        Number.isSafeInteger(mensagem.chat.id)
      ) {
        await tratarMensagem(env, mensagem);
      }

      // Devolvemos sempre 200 para o Telegram não repetir o pedido.
      return new Response("OK", { status: 200 });
    }

    return new Response("Método não suportado", { status: 405 });
  },
};
