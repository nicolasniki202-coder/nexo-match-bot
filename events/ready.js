const { registerCommands } = require("../services/discordService");
const { testConnection } = require("../database");

async function onReady(client) {
  console.log(
    `Nexo Match Bot zalogowany jako ${client.user.tag}`
  );

  await testConnection();

  await registerCommands();
}

module.exports = {
  onReady
};