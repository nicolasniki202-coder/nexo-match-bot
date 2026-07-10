const express = require("express");
const {
  Client,
  Collection,
  Events,
  GatewayIntentBits
} = require("discord.js");

const app = express();
app.use(express.json());

const TOKEN = process.env.DISCORD_TOKEN;
const PORT = process.env.PORT || 3000;

if (!TOKEN) {
  console.error("Brak zmiennej DISCORD_TOKEN.");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();

client.once(Events.ClientReady, readyClient => {
  console.log(`Nexo Match Bot zalogowany jako ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  try {
    if (interaction.commandName === "ping") {
      await interaction.reply({
        content: "🏓 Nexo Match Bot działa!",
        ephemeral: true
      });
    }
  } catch (error) {
    console.error("Błąd obsługi komendy:", error);

    const response = {
      content: "❌ Wystąpił błąd podczas wykonywania komendy.",
      ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(response);
    } else {
      await interaction.reply(response);
    }
  }
});

app.get("/", (req, res) => {
  res.status(200).send("Nexo Match Bot v2 działa!");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    discordReady: client.isReady()
  });
});

app.listen(PORT, () => {
  console.log(`Serwer HTTP działa na porcie ${PORT}`);
});

client.login(TOKEN);
