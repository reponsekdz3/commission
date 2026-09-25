const fs = require("fs");
const path = require("path");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("DATABASE_URL missing — skipped SQL apply. Schema lives in sql/001_init.sql");
    return;
  }
  let Client;
  try {
    ({ Client } = require("pg"));
  } catch {
    console.log("pg not installed — skipped live migrate");
    return;
  }
  const sql = fs.readFileSync(path.join(__dirname, "../sql/001_init.sql"), "utf8");
  const client = new Client({ connectionString: url });
  await client.connect();
  await client.query(sql);
  await client.end();
  console.log("Applied PostGIS schema");
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 0;
});
