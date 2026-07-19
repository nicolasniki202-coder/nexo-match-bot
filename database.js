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

async function testConnection() {
  try {
    const client = await pool.connect();

    console.log("✅ Połączono z PostgreSQL.");

    client.release();
  } catch (error) {
    console.error(
      "❌ Nie udało się połączyć z PostgreSQL:"
    );

    console.error(error);
  }
}

module.exports = {
  pool,
  testConnection
};