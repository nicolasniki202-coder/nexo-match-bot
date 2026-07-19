const {
  MessageFlags
} = require("discord.js");

const matchStore = require("../utils/matchStore");
const {
  buildLiveEmbed
} = require("../utils/embeds/liveEmbed");
const {
  buildResultEmbed
} = require("../utils/embeds/resultEmbed");

async function onInteractionCreate(interaction, lastMatch) {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  if (interaction.commandName === "ping") {
    await interaction.reply({
      content: "🏓 Nexo Match Bot działa!",
      flags: MessageFlags.Ephemeral
    });

    return;
  }

  if (interaction.commandName === "live") {
    const liveMatch = matchStore.getMatch();

    if (!liveMatch) {
      await interaction.reply({
        content: "⚪ Aktualnie nie trwa żaden mecz.",
        flags: MessageFlags.Ephemeral
      });

      return;
    }

    await interaction.reply({
      embeds: [buildLiveEmbed(liveMatch)],
      flags: MessageFlags.Ephemeral
    });

    return;
  }

  if (interaction.commandName === "lastmatch") {
    if (!lastMatch) {
      await interaction.reply({
        content:
          "⚪ Nie rozegrano jeszcze żadnego meczu.",
        flags: MessageFlags.Ephemeral
      });

      return;
    }

    await interaction.reply({
      embeds: [buildResultEmbed(lastMatch)],
      flags: MessageFlags.Ephemeral
    });
  }
}

module.exports = {
  onInteractionCreate
};