function getMvp(team1 = {}, team2 = {}) {
  const players = [
    ...(team1.players || []),
    ...(team2.players || [])
  ];

  if (players.length === 0) {
    return {
      name: "Brak danych",
      steamid: null,
      kills: 0,
      deaths: 0,
      assists: 0,
      damage: 0,
      adr: 0,
      headshots: 0,
      score: 0,
      mvp: 0
    };
  }

  const sortedPlayers = [...players].sort((a, b) => {
    const scoreA = Number(a.stats?.score || 0);
    const scoreB = Number(b.stats?.score || 0);

    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }

    const killsA = Number(a.stats?.kills || 0);
    const killsB = Number(b.stats?.kills || 0);

    if (killsB !== killsA) {
      return killsB - killsA;
    }

    const deathsA = Number(a.stats?.deaths || 0);
    const deathsB = Number(b.stats?.deaths || 0);

    return deathsA - deathsB;
  });

  const player = sortedPlayers[0];
  const stats = player.stats || {};

  const damage = Number(stats.damage || 0);
  const roundsPlayed = Number(stats.rounds_played || 0);

  return {
    name: player.name || "Nieznany gracz",
    steamid: player.steamid || null,
    kills: Number(stats.kills || 0),
    deaths: Number(stats.deaths || 0),
    assists: Number(stats.assists || 0),
    damage,
    adr: roundsPlayed > 0
      ? Math.round(damage / roundsPlayed)
      : 0,
    headshots: Number(stats.headshot_kills || 0),
    score: Number(stats.score || 0),
    mvp: Number(stats.mvp || 0)
  };
}

module.exports = {
  getMvp
};
