const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  throw new Error(
    "Brakuje zmiennej DATABASE_URL w Render Environment."
  );
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function initializeDatabase() {
  const client = await pool.connect();

  try {
    console.log("✅ Połączono z PostgreSQL.");

    await client.query(`
      CREATE TABLE IF NOT EXISTS matches (
        id SERIAL PRIMARY KEY,
        match_id VARCHAR(100) UNIQUE NOT NULL,
        event_name VARCHAR(50),
        map_name VARCHAR(100),
        team1_name VARCHAR(100),
        team2_name VARCHAR(100),
        team1_score INTEGER NOT NULL DEFAULT 0,
        team2_score INTEGER NOT NULL DEFAULT 0,
        winner_name VARCHAR(100),
        match_data JSONB NOT NULL,
        finished_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    console.log("✅ Tabela matches jest gotowa.");
  } catch (error) {
    console.error(
      "❌ Błąd inicjalizacji bazy danych:",
      error
    );

    throw error;
  } finally {
    client.release();
  }
}

async function testConnection() {
  await initializeDatabase();
}

async function saveMatch(data = {}) {
  const matchId = String(
    data.matchid ?? data.match_id ?? "unknown"
  );

  if (matchId === "unknown") {
    throw new Error(
      "Nie można zapisać meczu bez matchid."
    );
  }

  const team1 = data.team1 || {};
  const team2 = data.team2 || {};

  const team1Name =
    team1.name || team1.team || "Team 1";

  const team2Name =
    team2.name || team2.team || "Team 2";

  const team1Score = Number(team1.score || 0);
  const team2Score = Number(team2.score || 0);

  let winnerName = null;

  if (team1Score > team2Score) {
    winnerName = team1Name;
  } else if (team2Score > team1Score) {
    winnerName = team2Name;
  }

  await pool.query(
    `
      INSERT INTO matches (
        match_id,
        event_name,
        map_name,
        team1_name,
        team2_name,
        team1_score,
        team2_score,
        winner_name,
        match_data,
        finished_at
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, NOW()
      )
      ON CONFLICT (match_id)
      DO UPDATE SET
        event_name = EXCLUDED.event_name,
        map_name = EXCLUDED.map_name,
        team1_name = EXCLUDED.team1_name,
        team2_name = EXCLUDED.team2_name,
        team1_score = EXCLUDED.team1_score,
        team2_score = EXCLUDED.team2_score,
        winner_name = EXCLUDED.winner_name,
        match_data = EXCLUDED.match_data,
        finished_at = NOW();
    `,
    [
      matchId,
      data.event || null,
      data.map || data.map_name || null,
      team1Name,
      team2Name,
      team1Score,
      team2Score,
      winnerName,
      data
    ]
  );

  console.log(`✅ Zapisano mecz ${matchId} w bazie.`);
}

async function getLastMatch() {
  const result = await pool.query(`
    SELECT match_data
    FROM matches
    ORDER BY finished_at DESC
    LIMIT 1;
  `);

  return result.rows[0]?.match_data || null;
}
async function getMatchHistory(limit = 5) {
  const result = await pool.query(
    `
      SELECT
        match_id,
        map_name,
        team1_name,
        team2_name,
        team1_score,
        team2_score,
        winner_name,
        finished_at
      FROM matches
      ORDER BY finished_at DESC
      LIMIT $1;
    `,
    [limit]
  );

  return result.rows;
}
module.exports = {
  pool,
  initializeDatabase,
  testConnection,
  saveMatch,
  getLastMatch,
  getMatchHistory
};