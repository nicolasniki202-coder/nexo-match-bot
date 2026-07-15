const express = require("express");
const {
  Client,
  Collection,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  MessageFlags
} = require("discord.js");

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

function getTeamName(team, fallback) {
  return team?.name || fallback;
}

function getTeamScore(team) {
  return Number(team?.score || 0);
}

function getMvp(team1 = {}, team2 = {}) {
  const players = [...(team1.players || []), ...(team2.players || [])];

  if (players.length === 0) {
    return {
      name: "Brak danych",
      kills: 0,
      deaths: 0,
      score: 0,
      mvp: 0
    };
  }

  players.sort((a, b) => {
    const scoreA = Number(a.stats?.score || 0);
    const scoreB = Number(b.stats?.score || 0);

    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }

    const killsA = Number(a.stats?.kills || 0);
    const killsB = Number(b.stats?.kills || 0);

    return killsB - killsA;
  });

  const player = players[0];

  return {
    name: player.name || "Nieznany gracz",
    kills: Number(player.stats?.kills || 0),
    deaths: Number(player.stats?.deaths || 0),
    score: Number(player.stats?.score || 0),
    mvp: Number(player.stats?.mvp || 0)
  };
}

function buildLiveEmbed(data) {
  const team1 = data.team1 || {};
  const team2 = data.team2 || {};

  return new EmbedBuilder()
    .setColor(0xffcc00)
    .setAuthor({ name: "🏆 Nexo Esports" })
    .setTitle("🔥 Mecz wystartował")
    .addFields(
      {
        name: "🗺️ Mapa",
        value: data.map || `Mapa nr ${data.map_number ?? 0}`,
        inline: true
      },
      {
        name: "🆔 Match ID",
        value: String(data.matchid ?? "brak"),
        inline: true
      },
      {
        name: "⚔️ Drużyny",
        value:
          `${getTeamName(team1, "Team 1")} vs ` +
          `${getTeamName(team2, "Team 2")}`,
        inline: false
      }
    )
    .setFooter({ text: "Nexo Esports • LIVE" })
    .setTimestamp();
}

function buildResultEmbed(data) {
  const team1 = data.team1 || {};
  const team2 = data.team2 || {};

  const score1 = getTeamScore(team1);
  const score2 = getTeamScore(team2);

  const winner =
    score1 > score2
      ? getTeamName(team1, "Team 1")
      : score2 > score1
        ? getTeamName(team2, "Team 2")
        : "Remis";

  const mvp = getMvp(team1, team2);

  return new EmbedBuilder()
    .setColor(0x00d26a)
    .setAuthor({ name: "🏆 Nexo Esports" })
    .setTitle("🏁 Mecz zakończony")
    .addFields(
      {
        name: "🗺️ Mapa",
        value: data.map || `Mapa nr ${data.map_number ?? 0}`,
        inline: true
      },
      {
        name: "🥇 Zwycięzca",
        value: winner,
        inline: true
      },
      {
        name: "📊 Wynik",
        value:
          `**${getTeamName(team1, "Team 1")} ${score1} : ` +
          `${score2} ${getTeamName(team2, "Team 2")}**`,
        inline: false
      },
      {
        name: "⭐ MVP",
        value:
          `**${mvp.name}**\n` +
          `${mvp.kills} K • ${mvp.deaths} D • ` +
          `${mvp.mvp} MVP • ${mvp.score} pkt`,
        inline: false
      }
    )
    .setFooter({ text: "Nexo Esports • MatchZy" })
    .setTimestamp();
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
