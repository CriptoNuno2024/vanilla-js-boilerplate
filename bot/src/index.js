// Worker do bot do Telegram do YoshiCat.
// Só fica registado quem escrever /ligar (chat_id + avisos_ligados na D1).
// /parar e /apagar apagam o registo. O despertador (Cron) envia um aviso diário às 10h de Lisboa.

const MSG_ERRO = "Tive um problema, tenta daqui a pouco.";
const MSG_AJUDA =
  "Olá, guardião! 🐱🍇\nUsa /ligar para receber um aviso diário da Quinta e /parar para o desligar. /estado mostra como estão os avisos. /apagar remove o teu registo.";

// Textos do aviso diário: segunda-feira = 1.º ... domingo = 7.º.
const TEXTOS_AVISO = [
  "Bom dia! 🍇 A Quinta do Moscatel já acordou. O YoshiCat está à tua espera!\nPara parar: /parar",
  "O Chizo já andou a ladrar pela vinha. Vens ver se está tudo em ordem? 🐶\nPara parar: /parar",
  "Pausa das 10h? Uma voltinha pela Quinta faz bem. 🌿\nPara parar: /parar",
  "As videiras têm sede! Vem ver como vai a Quinta. 💧\nPara parar: /parar",
  "O YoshiCat deixou-te um recado na Quinta. Passa por lá! 🐱\nPara parar: /parar",
  "O sol está bom para as uvas hoje. ☀️ Vem espreitar!\nPara parar: /parar",
  "Um cafezinho e cinco minutos na Quinta? 🍇\nPara parar: /parar",
];

const DIAS_SEMANA = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

// Hora (0-23) e dia da semana (segunda = 1 ... domingo = 7) em Lisboa.
// Usa o fuso "Europe/Lisbon", por isso a mudança de hora é tratada sozinha.
function horaELisboa(data) {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Lisbon",
    hour: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(data);
  const hora = Number(partes.find((p) => p.type === "hour").value);
  const diaSemana = DIAS_SEMANA[partes.find((p) => p.type === "weekday").value];
  return { hora, diaSemana };
}

function textoDoDia(diaSemana) {
  return TEXTOS_AVISO[diaSemana - 1] ?? TEXTOS_AVISO[0];
}

// Compara o segredo recebido com o esperado em tempo constante:
// faz o hash SHA-256 de ambos (tamanho fixo) e compara com timingSafeEqual.
async function segredoValido(recebido, esperado) {
  const codificador = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", codificador.encode(recebido ?? "")),
    crypto.subtle.digest("SHA-256", codificador.encode(esperado)),
  ]);
  return crypto.subtle.timingSafeEqual(a, b);
}

// Envia um aviso e verifica a resposta do Telegram.
// Se responder 403 (a pessoa bloqueou o bot), apaga o registo dessa pessoa.
async function enviarAviso(env, chatId, texto) {
  try {
    const resposta = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: texto }),
    });
    if (resposta.status === 403) {
      await env.DB.prepare(
        "DELETE FROM utilizadores WHERE chat_id = ?"
      )
        .bind(chatId)
        .run();
    } else if (!resposta.ok) {
      console.error("O Telegram recusou um aviso");
    }
  } catch {
    console.error("Falha ao enviar um aviso");
  }
}

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
    // Todas as queries usam sempre o chat_id de quem enviou a mensagem (nunca um valor do texto).
    const comando = lerComando(mensagem.text);

    if (comando === "/ligar") {
      // Único ponto onde alguém fica registado.
      await env.DB.prepare(
        "INSERT INTO utilizadores (chat_id, avisos_ligados) VALUES (?, 1) ON CONFLICT(chat_id) DO UPDATE SET avisos_ligados = 1, atualizado_em = datetime('now')"
      )
        .bind(chatId)
        .run();
      resposta =
        "Feito! Os avisos ficaram ligados. Vais receber um aviso por dia, por volta das 10h. Para os desligar, usa /parar.";
    } else if (comando === "/parar") {
      await env.DB.prepare("DELETE FROM utilizadores WHERE chat_id = ?").bind(chatId).run();
      resposta =
        "Feito! Os avisos ficaram desligados e o teu registo foi apagado. Para os voltar a ligar, usa /ligar.";
    } else if (comando === "/apagar") {
      await env.DB.prepare("DELETE FROM utilizadores WHERE chat_id = ?").bind(chatId).run();
      resposta =
        "Feito! Apaguei o teu registo do nosso servidor. O progresso do jogo fica só no teu telemóvel e na tua conta do Telegram. Para receber avisos outra vez, usa /ligar.";
    } else if (comando === "/estado") {
      // Só lê; não grava nada.
      const linha = await env.DB.prepare(
        "SELECT avisos_ligados FROM utilizadores WHERE chat_id = ?"
      )
        .bind(chatId)
        .first();
      resposta =
        linha && linha.avisos_ligados === 1
          ? "Os avisos estão ligados. Usa /parar para os desligar."
          : "Os avisos estão desligados. Usa /ligar para os ligar.";
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
  // Despertador: corre de hora a hora (ver "triggers" no wrangler.jsonc).
  async scheduled(event, env, ctx) {
    const { hora, diaSemana } = horaELisboa(new Date());
    if (hora !== 10) return;

    let destinatarios;
    try {
      // O plano grátis permite 50 pedidos externos por execução, por isso limitamos a 40.
      // O envio em lotes (marcar quem já foi avisado hoje) fica para antes de abrir a outras pessoas.
      const resultado = await env.DB.prepare(
        "SELECT chat_id FROM utilizadores WHERE avisos_ligados = 1 LIMIT 40"
      ).all();
      destinatarios = resultado.results;
    } catch {
      console.error("Erro na base de dados ao procurar destinatários");
      return;
    }

    const texto = textoDoDia(diaSemana);
    for (const { chat_id } of destinatarios) {
      await enviarAviso(env, chat_id, texto);
    }
  },

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
      if (!(await segredoValido(secretRecebido, env.WEBHOOK_SECRET))) {
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
