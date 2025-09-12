const { Client } = require("pg");

const client = new Client({
  host: "localhost",
  port: 5432,
  database: "vibe_coding_notes",
  user: "username",
  password: "password",
});

async function testConnection() {
  try {
    console.log("Testing PostgreSQL connection...");
    await client.connect();
    console.log("✅ Connected to PostgreSQL");

    const result = await client.query("SELECT COUNT(*) FROM users");
    console.log("✅ User count:", result.rows[0].count);

    const noteResult = await client.query("SELECT COUNT(*) FROM notes");
    console.log("✅ Note count:", noteResult.rows[0].count);
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
  } finally {
    await client.end();
  }
}

testConnection();
