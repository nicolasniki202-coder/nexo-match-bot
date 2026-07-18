const { EmbedBuilder } = require("discord.js");
const maps = require("../maps");

function getTeamName(team, fallback) {
  return team?.name || team?.team || fallback;
}

function getTeamScore(team) {
  const score = Number(team?.score);

  return Number.isFinite(score) ? score : 0;
}

function getMapKey(data) {
  return data?.map || data?.map_name || data?.mapName || null;
}

function getMap(data) {
  const mapKey = getMapKey(data);

  if (mapKey && maps[mapKey]) {
    return maps[mapKey];
  }

  return {
    name: mapKey || `Mapa nr ${data?.map_number ?? 0}`,
    image: null
  };
}

function buildLiveEmbed(data = {}) {
  const team1 = data.team1 || {};
  const team2 = data.team2 || {};

  const team1Name = getTeamName(team1, "Team 1");
  const team2Name = getTeamName(team2, "Team 2");

  const score1 = getTeamScore(team1);
  const score2 = getTeamScore(team2);

  const completedRounds = score1 + score2;
  const map = getMap(data);

  const embed = new EmbedBuilder()
    .setColor(0xff3b30)
    .setAuthor({
      name: "🏆 Nexo Esports"
    })
    .setTitle("🔴 MECZ NA ŻYWO")
    .setDescription(
      `## 🔵 ${score1}  —  ${score2} 🟠\n` +
      `**${team1Name}**  **${team2Name}**`
    )
    .addFields(
      {
        name: "🗺️ Mapa",
        value: map.name,
        inline: true
      },
      {
        name: "🎯 Rozegrane rundy",
        value: String(completedRounds),
        inline: true
      },
      {
        name: "🆔 Match ID",
        value: String(data.matchid ?? "brak"),
        inline: true
      },
      {
        name: "📡 Status",
        value: "🔴 LIVE — wynik aktualizowany automatycznie",
        inline: false
      }
    )
    .setFooter({
      text: "Nexo Esports • MatchZy Live Score"
    })
    .setTimestamp();

  if (map.image) {
    embed.setImage(map.image);
  }

  return embed;
}

module.exports = {
  buildLiveEmbed
};