const express = require("express");

const {
  Client,
  Events,
  GatewayIntentBits
} = require("discord.js");

const { onReady } = require("./events/ready");
const {
  onInteractionCreate
} = require("./events/interactionCreate");

const {
  getMatchId,
  createLiveMessage,
  updateLiveMessage,
  finishLiveMessage
} = require("./services/webhookService");

const matchStore = require("./utils/matchStore");

const {
  buildLiveEmbed
} = require("./utils/embeds/liveEmbed");

const {
  buildResultEmbed
} = require("./utils/embeds/resultEmbed");

const { saveMatch } = require("./database");

const app = express();

app.use(express.json());

const TOKEN = process.env.DISCORD_TOKEN;
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const PORT = process.env.PORT || 3000;

const requiredVariables = {
  DISCORD_TOKEN: TOKEN,
  DISCORD_CHANNEL_ID: CHANNEL_ID,
  DISCORD_CLIENT_ID: CLIENT_ID,
  DISCORD_GUILD_ID: GUILD_ID
};

for (const [name, value] of Object.entries(requiredVariables)) {
  if (!value) {
    console.error(`Brak zmiennej środowiskowej ${name}.`);
    process.exit(1);
  }
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

let currentMatch = null;
let lastMatch = null;
let lastFinishedMatchId = null;

/*
 * GOTOWOŚĆ BOTA
 */
client.once(Events.ClientReady, async readyClient => {
  try {
    await onReady(readyClient);
  } catch (error) {
    console.error(
      "Błąd podczas uruchamiania bota:",
      error
    );
  }
});

/*
 * KOMENDY DISCORDA
 */
client.on(Events.InteractionCreate, async interaction => {
  try {
    await onInteractionCreate(interaction, lastMatch);
  } catch (error) {
    console.error(
      "Błąd podczas obsługi komendy Discord:",
      error
    );

    const response = {
      content:
        "❌ Wystąpił błąd podczas wykonywania komendy.",
      ephemeral: true
    };

    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(response);
      } else {
        await interaction.reply(response);
      }
    } catch (replyError) {
      console.error(
        "Nie udało się wysłać informacji o błędzie:",
        replyError
      );
    }
  }
});

/*
 * POBIERANIE KANAŁU MECZOWEGO
 */
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

/*
 * WEBHOOK MATCHZY
 */
app.post("/", async (req, res) => {
  const data = req.body;

  console.log("Webhook MatchZy:");
  console.log(JSON.stringify(data, null, 2));

  /*
   * MatchZy od razu dostaje odpowiedź 200,
   * a bot obsługuje event dalej.
   */
  res.sendStatus(200);

  try {
    if (!client.isReady()) {
      console.log(
        "Discord nie jest jeszcze gotowy. Pomijam event."
      );

      return;
    }

    if (!data || typeof data !== "object") {
      console.log("Webhook nie zawiera poprawnych danych.");
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

      await createLiveMessage(
        channel,
        data,
        matchStore,
        buildLiveEmbed
      );

      return;
    }

    /*
     * KONIEC RUNDY
     */
    if (data.event === "round_end") {
      currentMatch = data;

      matchStore.update(data);

      const score1 = Number(data.team1?.score || 0);
      const score2 = Number(data.team2?.score || 0);

      console.log(
        `Aktualny wynik meczu: ${score1}:${score2}`
      );

      await updateLiveMessage(
        channel,
        data,
        matchStore,
        buildLiveEmbed
      );

      return;
    }

    /*
     * KONIEC MAPY LUB MECZU
     */
    if (
      data.event === "map_end" ||
      data.event === "match_end" ||
      data.event === "series_end"
    ) {
      const matchId = getMatchId(data);

      /*
       * MatchZy może wysłać kilka eventów końcowych.
       * Wynik jednego meczu obsługujemy tylko raz.
       */
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

      await finishLiveMessage(
  channel,
  data,
  matchStore,
  buildResultEmbed
);

await saveMatch(data);

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

/*
 * STRONA GŁÓWNA
 */
app.get("/", (req, res) => {
  res
    .status(200)
    .send("Nexo Match Bot 3.0 działa!");
});

/*
 * STATUS BOTA
 */
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    version: "3.0.0-alpha",
    discordReady: client.isReady(),
    channelId: CHANNEL_ID,
    currentMatch: Boolean(currentMatch),
    lastMatch: Boolean(lastMatch),
    matchStoreActive: matchStore.hasLiveMatch(),
    liveMessage: matchStore.getMessage()
  });
});

/*
 * START SERWERA HTTP
 */
app.listen(PORT, () => {
  console.log(
    `Serwer HTTP działa na porcie ${PORT}`
  );
});

/*
 * LOGOWANIE BOTA
 */
client.login(TOKEN).catch(error => {
  console.error(
    "Nie udało się zalogować bota do Discorda:",
    error
  );

  process.exit(1);
});