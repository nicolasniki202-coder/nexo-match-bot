const express = require("express");
const {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  MessageFlags
} = require("discord.js");

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

client.once(Events.ClientReady, readyClient => {
  console.log(`Nexo Match Bot zalogowany jako ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

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
    throw new Error(`Nie znaleziono kanału o ID ${CHANNEL_ID}.`);
  }

  if (!channel.isTextBased()) {
    throw new Error(`Kanał ${CHANNEL_ID} nie jest kanałem tekstowym.`);
  }

  return channel;
}

function getTeamScore(team) {
  return Number(team?.score || 0);
}

app.post("/", async (req, res) => {
  const data = req.body;

  console.log("Webhook MatchZy:");
  console.log(JSON.stringify(data, null, 2));

  res.sendStatus(200);

  try {
    if (!client.isReady()) {
      console.log("Discord nie jest jeszcze gotowy. Pomijam event.");
      return;
    }

    const channel = await getMatchChannel();

    console.log(
      `Wysyłam wiadomość na kanał: ${channel.name} (${channel.id})`
    );

    if (data.event === "going_live") {
      currentMatch = data;

      console.log("Próba wysłania embeda LIVE...");

      await channel.send({
        embeds: [buildLiveEmbed(data)]
      });

      console.log("Embed LIVE wysłany.");
      return;
    }

    if (data.event === "round_end") {
      currentMatch = data;

      const score1 = getTeamScore(data.team1);
      const score2 = getTeamScore(data.team2);

      console.log(`Aktualny wynik: ${score1}:${score2}`);

      if (score1 >= 13 || score2 >= 13) {
        lastMatch = data;
        currentMatch = null;

        console.log("Próba wysłania embeda z wynikiem...");

        await channel.send({
          embeds: [buildResultEmbed(data)]
        });

        console.log("Embed z wynikiem wysłany.");
      }

      return;
    }

    if (
      data.event === "map_end" ||
      data.event === "match_end" ||
      data.event === "series_end"
    ) {
      lastMatch = data;
      currentMatch = null;

      console.log("Próba wysłania embeda z wynikiem końcowym...");

      await channel.send({
        embeds: [buildResultEmbed(data)]
      });

      console.log("Embed z wynikiem końcowym wysłany.");
      return;
    }

    console.log(`Event ${data.event || "brak"} nie wymaga wiadomości.`);
  } catch (error) {
    console.error("Błąd obsługi webhooka MatchZy:", error);
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
    lastMatch: Boolean(lastMatch)
  });
});

app.listen(PORT, () => {
  console.log(`Serwer HTTP działa na porcie ${PORT}`);
});

client.login(TOKEN).catch(error => {
  console.error("Nie udało się zalogować bota do Discorda:", error);
  process.exit(1);
});
