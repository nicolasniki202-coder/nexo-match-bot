const { EmbedBuilder } = require("discord.js");

function getTeamName(team, fallback) {
  return team?.name || fallback;
}

function buildLiveEmbed(data = {}) {
  const team1 = data.team1 || {};
  const team2 = data.team2 || {};

  return new EmbedBuilder()
    .setColor(0xffcc00)
    .setAuthor({ name: "🏆 Nexo Esports" })
    .setTitle("🔥 Mecz wystartował")
    .setDescription("━━━━━━━━━━━━━━━━━━━━━━")
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
          `**${getTeamName(team1, "Team 1")}**\n` +
          `🆚\n` +
          `**${getTeamName(team2, "Team 2")}**`,
        inline: false
      },
      {
        name: "📡 Status",
        value: "🔴 LIVE",
        inline: false
      }
    )
    .setFooter({ text: "Nexo Esports • MatchZy" })
    .setTimestamp();
}

module.exports = {
  buildLiveEmbed
};
