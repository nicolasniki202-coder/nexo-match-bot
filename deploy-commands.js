const {
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error(
    "Brakuje DISCORD_TOKEN, DISCORD_CLIENT_ID lub DISCORD_GUILD_ID."
  );
  process.exit(1);
}

const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Sprawdza, czy Nexo Match Bot działa.")
    .toJSON(),

  new SlashCommandBuilder()
    .setName("live")
    .setDescription("Pokazuje aktualnie trwający mecz.")
    .toJSON()
];

const rest = new REST({ version: "10" }).setToken(TOKEN);

async function deployCommands() {
  try {
    console.log("Rejestrowanie komend Discord...");

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log("Komendy /ping i /live zostały zarejestrowane.");
  } catch (error) {
    console.error("Nie udało się zarejestrować komend:", error);
    process.exit(1);
  }
}

deployCommands();