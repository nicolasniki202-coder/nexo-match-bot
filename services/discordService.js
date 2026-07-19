const {
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Sprawdza, czy Nexo Match Bot działa.")
    .toJSON(),

  new SlashCommandBuilder()
    .setName("live")
    .setDescription("Pokazuje aktualnie trwający mecz.")
    .toJSON(),

  new SlashCommandBuilder()
    .setName("lastmatch")
    .setDescription("Pokazuje ostatnio zakończony mecz.")
    .toJSON()
];

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(TOKEN);

  console.log("Rejestrowanie komend Discord...");

  await rest.put(
    Routes.applicationGuildCommands(
      CLIENT_ID,
      GUILD_ID
    ),
    {
      body: commands
    }
  );

  console.log(
    "Komendy /ping, /live i /lastmatch zostały zarejestrowane."
  );
}

module.exports = {
  registerCommands
};