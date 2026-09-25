const { Client } = require("pg");

async function main(){
  const url=process.env.DATABASE_URL;if(!url)throw new Error("DATABASE_URL is required");
  const client=new Client({connectionString:url});await client.connect();
  try{
    const checks=[
      ["users",await client.query("SELECT COUNT(*)::int count FROM users")],
      ["properties",await client.query("SELECT COUNT(*)::int count FROM properties")],
      ["listings",await client.query("SELECT COUNT(*)::int count FROM property_listings")],
      ["locations",await client.query("SELECT COUNT(*)::int count FROM property_locations")],
      ["postgis",await client.query("SELECT PostGIS_Version() version")],
      ["jobs",await client.query("SELECT COUNT(*)::int count FROM background_jobs")],
    ];
    const [users,properties,listings,locations]=checks.slice(0,4).map(([,r])=>Number(r.rows[0].count));
    if(users<4)throw new Error("Seed smoke failed: expected demo users");
    if(properties<5)throw new Error("Seed smoke failed: expected demo properties");
    if(listings<5)throw new Error("Seed smoke failed: expected demo listings");
    if(locations!==properties)throw new Error("Seed smoke failed: every property must have a PostGIS location");
    const geo=await client.query("SELECT ST_DWithin(geom,ST_SetSRID(ST_MakePoint(30.112,-1.978),4326)::geography,5000) AS nearby FROM property_locations ORDER BY nearby DESC LIMIT 1");
    if(!geo.rows[0])throw new Error("PostGIS smoke failed");
    console.log(JSON.stringify({users,properties,listings,locations,postgis:checks[4][1].rows[0].version,jobs:checks[5][1].rows[0].count,geo:geo.rows[0].nearby}));
  }finally{await client.end();}
}
main().catch(e=>{console.error(e);process.exit(1);});
