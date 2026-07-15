const { EmbedBuilder } = require("discord.js");
const { getMvp } = require("../utils/mvp");

function getTeamName(team, fallback) {
  return team?.name || fallback;
}

function getTeamScore(team) {
  return Number(team?.score || 0);
}

function buildResultEmbed(data = {}) {
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
    .setDescription("━━━━━━━━━━━━━━━━━━━━━━")
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
        value: `**${score1} : ${score2}**`,
        inline: false
      },
      {
        name: "⭐ MVP",
        value:
          `**${mvp.name}**\n` +
          `🔫 ${mvp.kills} K | ☠️ ${mvp.deaths} D\n` +
          `🏅 ${mvp.mvp} MVP | 🎯 ${mvp.score} Score\n` +
          `💥 ADR ${mvp.adr}`,
        inline: false
      }
    )
    .setFooter({ text: "Nexo Esports • MatchZy" })
    .setTimestamp();
}

module.exports = {
  buildResultEmbed
};
