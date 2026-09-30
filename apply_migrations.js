const {Client} = require('pg');
const fs = require('fs');
const path = require('path');

const url = process.env.DATABASE_URL || "postgresql://imizi:imizi_dev@localhost:5433/imizi?schema=public";

async function main() {
  const c = new Client({connectionString: url});
  await c.connect();
  
  const sqlDir = path.join(__dirname, 'packages/database/sql');
  const files = ['002a_production_integrity.sql', '002b_production_persistence.sql'];
  
  for(const file of files) {
    const applied = await c.query("SELECT 1 FROM schema_migrations WHERE version = $1", [file]);
    if(applied.rowCount) {
      console.log('Already applied:', file);
      continue;
    }
    const sql = fs.readFileSync(path.join(sqlDir, file), 'utf8');
    await c.query('BEGIN');
    try {
      await c.query(sql);
      await c.query("INSERT INTO schema_migrations(version) VALUES ($1)", [file]);
      await c.query('COMMIT');
      console.log('Applied:', file);
    } catch(err) {
      await c.query('ROLLBACK');
      throw err;
    }
  }
  
  console.log('Done');
  await c.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});