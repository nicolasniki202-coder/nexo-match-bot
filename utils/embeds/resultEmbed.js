const { EmbedBuilder } = require("discord.js");
const { getMvp } = require("../mvp");
const maps = require("../maps");

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

  const mapKey = data.map || `de_map${data.map_number ?? 0}`;

  const map = maps[mapKey] || {
    name: data.map || `Mapa nr ${data.map_number ?? 0}`,
    image: null
  };

  const embed = new EmbedBuilder()
    .setColor(0x00d26a)
    .setAuthor({ name: "🏆 Nexo Esports" })
    .setTitle("🏁 Mecz zakończony")
    .setDescription("━━━━━━━━━━━━━━━━━━━━━━")
    .addFields(
      {
        name: "🗺️ Mapa",
        value: map.name,
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
          `🔵 **${getTeamName(team1, "Team 1")} ${score1}**\n` +
          `🟠 **${getTeamName(team2, "Team 2")} ${score2}**`,
        inline: false
      },
      {
        name: "⭐ MVP",
        value:
          `**${mvp.name}**\n` +
          `🔫 ${mvp.kills} K | ☠️ ${mvp.deaths} D\n` +
          `🤝 ${mvp.assists ?? 0} A | 🏅 ${mvp.mvp} MVP\n` +
          `🎯 ${mvp.score} Score | 💥 ${mvp.adr ?? 0} ADR`,
        inline: false
      }
    )
    .setFooter({ text: "Nexo Esports • MatchZy" })
    .setTimestamp();

  if (map.image) {
    embed.setThumbnail(map.image);
  }

  return embed;
}

module.exports = {
  buildResultEmbed
};
