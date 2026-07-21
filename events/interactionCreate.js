const {
  EmbedBuilder,
  MessageFlags
} = require("discord.js");

const {
  getMatchHistory
} = require("../database");

const matchStore = require("../utils/matchStore");

const {
  buildLiveEmbed
} = require("../utils/embeds/liveEmbed");

const {
  buildResultEmbed
} = require("../utils/embeds/resultEmbed");

function formatMatchDate(date) {
  if (!date) {
    return "Brak daty";
  }

  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Warsaw"
  }).format(new Date(date));
}

function buildHistoryEmbed(matches) {
  const embed = new EmbedBuilder()
    .setTitle("🏆 Historia meczów Nexo Esports")
    .setDescription(
      "Pięć ostatnich zakończonych meczów zapisanych w bazie."
    )
    .setTimestamp()
    .setFooter({
      text: "Nexo Match Bot 3.0"
    });

  matches.forEach((match, index) => {
    const mapName =
      match.map_name || "Nieznana mapa";

    const team1Name =
      match.team1_name || "Team 1";

    const team2Name =
      match.team2_name || "Team 2";

    const team1Score =
      Number(match.team1_score || 0);

    const team2Score =
      Number(match.team2_score || 0);

    const winner =
      match.winner_name || "Brak rozstrzygnięcia";

    const matchDate =
      formatMatchDate(match.finished_at);

    embed.addFields({
      name: `${index + 1}. 🗺️ ${mapName}`,
      value:
        `**${team1Name}** ${team1Score} : ${team2Score} **${team2Name}**\n` +
        `🏅 Zwycięzca: **${winner}**\n` +
        `📅 ${matchDate}`
    });
  });

  return embed;
}

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

    return;
  }

  if (interaction.commandName === "history") {
    const matches = await getMatchHistory(5);

    if (!matches.length) {
      await interaction.reply({
        content:
          "⚪ Brak zapisanych meczów w historii.",
        flags: MessageFlags.Ephemeral
      });

      return;
    }

    await interaction.reply({
      embeds: [buildHistoryEmbed(matches)],
      flags: MessageFlags.Ephemeral
    });

    return;
  }
}

module.exports = {
  onInteractionCreate
};