// Worker do bot do Telegram do YoshiCat.
// Etapa 1: só responde "Olá" a quem escrever ao bot.

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

      const atualizacao = await request.json();
      const mensagem = atualizacao.message;

      if (mensagem && mensagem.chat && mensagem.chat.id) {
        await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: mensagem.chat.id,
            text: "Olá, guardião! 🐱🍇",
          }),
        });
      }

      return new Response("OK", { status: 200 });
    }

    return new Response("Método não suportado", { status: 405 });
  },
};
