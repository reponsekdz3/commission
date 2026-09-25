const fs = require("fs");
const path = require("path");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required to run database migrations");

  const { Client } = require("pg");
  const sqlDir = path.join(__dirname, "../sql");
  const files = fs
    .readdirSync(sqlDir)
    .filter((name) => /^\d+_.*\.sql$/.test(name))
    .sort();

  const client = new Client({ connectionString: url });
  await client.connect();

  try {
    await client.query("CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())");

    for (const file of files) {
      const applied = await client.query("SELECT 1 FROM schema_migrations WHERE version = $1", [file]);
      if (applied.rowCount) continue;

      const sql = fs.readFileSync(path.join(sqlDir, file), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations(version) VALUES ($1)", [file]);
        await client.query("COMMIT");
        console.log(`Applied ${file}`);
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      }
    }
  } finally {
    await client.end();
  }

  console.log("Database migrations complete");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
