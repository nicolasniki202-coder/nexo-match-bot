const express = require("express");

const {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  MessageFlags
} = require("discord.js");

const matchStore = require("./utils/matchStore");
const { buildLiveEmbed } = require("./utils/embeds/liveEmbed");
const { buildResultEmbed } = require("./utils/embeds/resultEmbed");

const app = express();
app.use(express.json());

const TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const PORT = process.env.PORT || 3000;

if (!TOKEN) {
  console.error("Brak zmiennej DISCORD_TOKEN.");
  process.exit(1);
}

if (!CHANNEL_ID) {
  console.error("Brak zmiennej DISCORD_CHANNEL_ID.");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

let currentMatch = null;
let lastMatch = null;
let lastFinishedMatchId = null;

client.once(Events.ClientReady, readyClient => {
  console.log(
    `Nexo Match Bot zalogowany jako ${readyClient.user.tag}`
  );
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  try {
    if (interaction.commandName === "ping") {
      await interaction.reply({
        content: "🏓 Nexo Match Bot działa!",
        flags: MessageFlags.Ephemeral
      });
    }
  } catch (error) {
    console.error("Błąd obsługi komendy:", error);

    const response = {
      content: "❌ Wystąpił błąd podczas wykonywania komendy.",
      flags: MessageFlags.Ephemeral
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(response);
    } else {
      await interaction.reply(response);
    }
  }
});

async function getMatchChannel() {
  const channel = await client.channels.fetch(CHANNEL_ID);

  if (!channel) {
    throw new Error(
      `Nie znaleziono kanału o ID ${CHANNEL_ID}.`
    );
  }

  if (!channel.isTextBased()) {
    throw new Error(
      `Kanał ${CHANNEL_ID} nie jest kanałem tekstowym.`
    );
  }

  return channel;
}

function getMatchId(data) {
  return String(data?.matchid ?? "unknown");
}

async function createLiveMessage(channel, data) {
  const message = await channel.send({
    embeds: [buildLiveEmbed(data)]
  });

  matchStore.setMessage(channel.id, message.id);

  console.log(
    `Utworzono wiadomość LIVE. ID: ${message.id}`
  );

  return message;
}

async function updateLiveMessage(channel, data) {
  const storedMessage = matchStore.getMessage();
  const messageId = storedMessage?.messageId;

  if (!messageId) {
    console.log(
      "Brak zapisanej wiadomości LIVE. Tworzę nową."
    );

    return createLiveMessage(channel, data);
  }

  try {
    const message = await channel.messages.fetch(messageId);

    await message.edit({
      embeds: [buildLiveEmbed(data)]
    });

    console.log(
      `Zaktualizowano wiadomość LIVE. ID: ${messageId}`
    );

    return message;
  } catch (error) {
    console.error(
      "Nie udało się edytować wiadomości LIVE. Tworzę nową:",
      error.message
    );

    return createLiveMessage(channel, data);
  }
}

async function finishLiveMessage(channel, data) {
  const storedMessage = matchStore.getMessage();
  const messageId = storedMessage?.messageId;

  if (!messageId) {
    console.log(
      "Brak wiadomości LIVE. Wysyłam osobne podsumowanie."
    );

    await channel.send({
      embeds: [buildResultEmbed(data)]
    });

    return;
  }

  try {
    const message = await channel.messages.fetch(messageId);

    await message.edit({
      embeds: [buildResultEmbed(data)]
    });

    console.log(
      `Wiadomość LIVE zmieniona w wynik końcowy. ID: ${messageId}`
    );
  } catch (error) {
    console.error(
      "Nie udało się zmienić wiadomości LIVE w wynik końcowy:",
      error.message
    );

    await channel.send({
      embeds: [buildResultEmbed(data)]
    });
  }
}

app.post("/", async (req, res) => {
  const data = req.body;

  console.log("Webhook MatchZy:");
  console.log(JSON.stringify(data, null, 2));

  res.sendStatus(200);

  try {
    if (!client.isReady()) {
      console.log(
        "Discord nie jest jeszcze gotowy. Pomijam event."
      );
      return;
    }

    const channel = await getMatchChannel();

    console.log(
      `Obsługuję event na kanale: ${channel.name} (${channel.id})`
    );

    /*
     * START MECZU
     */
    if (data.event === "going_live") {
      currentMatch = data;
      lastFinishedMatchId = null;

      matchStore.start(data);

      console.log("Rozpoczęto nowy mecz.");

      await createLiveMessage(channel, data);

      return;
    }

    /*
     * KONIEC RUNDY — EDYCJA TEJ SAMEJ WIADOMOŚCI
     */
    if (data.event === "round_end") {
      currentMatch = data;
      matchStore.update(data);

      const score1 = Number(data.team1?.score || 0);
      const score2 = Number(data.team2?.score || 0);

      console.log(
        `Aktualny wynik meczu: ${score1}:${score2}`
      );

      await updateLiveMessage(channel, data);

      return;
    }

    /*
     * KONIEC MECZU LUB MAPY
     */
    if (
      data.event === "map_end" ||
      data.event === "match_end" ||
      data.event === "series_end"
    ) {
      const matchId = getMatchId(data);

      if (lastFinishedMatchId === matchId) {
        console.log(
          `Wynik meczu ${matchId} został już obsłużony.`
        );
        return;
      }

      lastFinishedMatchId = matchId;
      lastMatch = data;
      currentMatch = null;

      console.log(
        "Zmieniam wiadomość LIVE w podsumowanie meczu..."
      );

      await finishLiveMessage(channel, data);

      matchStore.finish();

      console.log("Mecz został zakończony.");

      return;
    }

    console.log(
      `Event ${data.event || "brak"} nie wymaga wiadomości.`
    );
  } catch (error) {
    console.error(
      "Błąd obsługi webhooka MatchZy:",
      error
    );
  }
});

app.get("/", (req, res) => {
  res.status(200).send("Nexo Match Bot v2 działa!");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    discordReady: client.isReady(),
    channelId: CHANNEL_ID,
    currentMatch: Boolean(currentMatch),
    lastMatch: Boolean(lastMatch),
    matchStoreActive: matchStore.hasLiveMatch(),
    liveMessage: matchStore.getMessage()
  });
});

app.listen(PORT, () => {
  console.log(`Serwer HTTP działa na porcie ${PORT}`);
});

client.login(TOKEN).catch(error => {
  console.error(
    "Nie udało się zalogować bota do Discorda:",
    error
  );

  process.exit(1);
});