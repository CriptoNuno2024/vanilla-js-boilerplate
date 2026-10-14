// Worker do bot do Telegram do YoshiCat.
// Só fica registado quem escrever /ligar (chat_id + avisos_ligados na D1).
// /parar e /apagar apagam o registo. O despertador (Cron) envia um aviso diário às 10h de Lisboa,
// em lotes de até 25 pessoas por execução, e nunca duas vezes no mesmo dia (ultimo_aviso_dia).

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

// Quantas pessoas recebem o aviso em cada execução do despertador (ver "Limite do plano grátis" no README).
const TAMANHO_LOTE = 25;

// Hora (0-23), dia da semana (segunda = 1 ... domingo = 7) e data (AAAA-MM-DD) em Lisboa.
// Usa o fuso "Europe/Lisbon", por isso a mudança de hora é tratada sozinha.
function horaELisboa(data) {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Lisbon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(data);
  const valor = (tipo) => partes.find((p) => p.type === tipo).value;
  const hora = Number(valor("hour"));
  const diaSemana = DIAS_SEMANA[valor("weekday")];
  const hoje = `${valor("year")}-${valor("month")}-${valor("day")}`;
  return { hora, diaSemana, hoje };
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

// Envia um aviso e verifica a resposta do Telegram. Faz 1 pedido externo.
// Devolve "enviado" (o Telegram aceitou), "bloqueado" (403: a pessoa bloqueou o bot, o registo
// vai ser apagado) ou "falhou" (qualquer outro erro: a pessoa volta a ser tentada na execução seguinte).
async function enviarAviso(env, chatId, texto) {
  try {
    const resposta = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: texto }),
    });
    if (resposta.status === 403) return "bloqueado";
    if (!resposta.ok) {
      console.error("O Telegram recusou um aviso");
      return "falhou";
    }
    return "enviado";
  } catch {
    console.error("Falha ao enviar um aviso");
    return "falhou";
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
  // Despertador: corre de 5 em 5 minutos (ver "triggers" no wrangler.jsonc).
  // Só envia quando são 10h em Lisboa; em cada execução avisa até TAMANHO_LOTE pessoas que ainda não
  // foram avisadas hoje. Pedidos externos por execução: 1 (procurar) + até 25 (Telegram) + 1 (batch, +1 se for repetido) = no máximo 28.
  async scheduled(event, env, ctx) {
    const { hora, diaSemana, hoje } = horaELisboa(new Date());
    if (hora !== 10) return;

    let destinatarios;
    try {
      const resultado = await env.DB.prepare(
        "SELECT chat_id FROM utilizadores WHERE avisos_ligados = 1 AND (ultimo_aviso_dia IS NULL OR ultimo_aviso_dia <> ?) LIMIT ?"
      )
        .bind(hoje, TAMANHO_LOTE)
        .all();
      destinatarios = resultado.results;
    } catch {
      console.error("Erro na base de dados ao procurar destinatários");
      return;
    }
    if (!destinatarios || destinatarios.length === 0) return;

    const texto = textoDoDia(diaSemana);
    const alteracoes = [];
    for (const { chat_id } of destinatarios) {
      const estado = await enviarAviso(env, chat_id, texto);
      if (estado === "enviado") {
        alteracoes.push(
          env.DB.prepare("UPDATE utilizadores SET ultimo_aviso_dia = ? WHERE chat_id = ?").bind(hoje, chat_id)
        );
      } else if (estado === "bloqueado") {
        alteracoes.push(env.DB.prepare("DELETE FROM utilizadores WHERE chat_id = ?").bind(chat_id));
      }
      // "falhou": não se marca nada, por isso a pessoa volta a ser tentada na execução seguinte.
    }
    if (alteracoes.length === 0) return;

    // Uma só operação em lote (1 pedido à D1) para marcar quem recebeu e apagar quem bloqueou o bot.
    // Se falhar, tenta mais uma vez; senão estas pessoas voltariam a receber o aviso na execução seguinte.
    for (let tentativa = 1; tentativa <= 2; tentativa++) {
      try {
        await env.DB.batch(alteracoes);
        return;
      } catch {
        console.error("Erro na base de dados ao marcar os avisos enviados");
      }
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
