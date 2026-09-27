const { Client } = require("pg");
const { syncRwandaLocations } = require("./locations.cjs");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    await client.query("BEGIN");
    const counts = await syncRwandaLocations(client);
    await client.query("COMMIT");
    console.log("Rwanda administrative locations synchronized", counts);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}
main().catch(error => { console.error(error); process.exit(1); });
