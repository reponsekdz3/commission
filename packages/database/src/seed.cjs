const { Client } = require("pg");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required to seed the database");

  const seedPassword = process.env.SEED_PASSWORD;
  if (!seedPassword || seedPassword.length < 16) throw new Error("SEED_PASSWORD (>=16 chars) is required for deterministic seeding");
  const client = new Client({ connectionString: url });
  await client.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      "INSERT INTO users(id,email,phone,password_hash,full_name,locale,mfa_enabled) VALUES " +
      "('11111111-1111-1111-1111-111111111111','landlord@imizi.rw','+250780000001',crypt('ChangeMe!2026',gen_salt('bf',12)),'Uwase Keza','rw',false)," +
      "('22222222-2222-2222-2222-222222222222','tenant@imizi.rw','+250780000002',crypt('ChangeMe!2026',gen_salt('bf',12)),'Mugisha Eric','en',false)," +
      "('33333333-3333-3333-3333-333333333333','admin@imizi.rw','+250780000003',crypt('ChangeMe!2026',gen_salt('bf',12)),'Imizi Admin','en',false)," +
      "('44444444-4444-4444-4444-444444444444','agent@imizi.rw','+250780000004',crypt('ChangeMe!2026',gen_salt('bf',12)),'Iradukunda Aline','fr',false) " +
      "ON CONFLICT(id) DO UPDATE SET full_name=EXCLUDED.full_name,locale=EXCLUDED.locale",
      [seedPassword],
    );

    await client.query(
      "INSERT INTO user_roles(user_id,role) VALUES " +
      "('11111111-1111-1111-1111-111111111111','LANDLORD')," +
      "('11111111-1111-1111-1111-111111111111','USER')," +
      "('22222222-2222-2222-2222-222222222222','TENANT')," +
      "('22222222-2222-2222-2222-222222222222','USER')," +
      "('33333333-3333-3333-3333-333333333333','SUPER_ADMIN')," +
      "('44444444-4444-4444-4444-444444444444','AGENT')," +
      "('44444444-4444-4444-4444-444444444444','AGENCY_ADMIN') " +
      "ON CONFLICT DO NOTHING",
    );

    await client.query(
      "INSERT INTO organizations(id,name,slug,kind,verification_status) VALUES('55555555-5555-5555-5555-555555555555','Kigali Prime Agency','kigali-prime','AGENCY','VERIFIED') " +
      "ON CONFLICT(id) DO NOTHING",
    );
    await client.query(
      "INSERT INTO organization_members(organization_id,user_id,role) VALUES " +
      "('55555555-5555-5555-5555-555555555555','44444444-4444-4444-4444-444444444444','AGENCY_ADMIN') " +
      "ON CONFLICT DO NOTHING",
    );
    await client.query("UPDATE users SET organization_id='55555555-5555-5555-5555-555555555555' WHERE id='44444444-4444-4444-4444-444444444444'");

    const properties = [
      {
        id:"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", title:"Modern House in Kigali",
        description:"Light-filled 3 bedroom family house in Kicukiro with parking, fibre internet, and a walled garden.",
        type:"HOUSE", district:"Kicukiro", province:"Kigali", sector:"Kagarama",
        lat:-1.978,lng:30.112,bedrooms:3,bathrooms:2,parking:2,
        amenities:["water","electricity","internet","security","parking","furnished"],
        listing:"RENT",price:900000
      },
      {
        id:"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", title:"Apartment Building A",
        description:"Five-unit walk-up in Gacuriro. Independently metered units with parking and security.",
        type:"APARTMENT_BUILDING", district:"Gasabo", province:"Kigali", sector:"Gacuriro",
        lat:-1.905,lng:30.114,bedrooms:null,bathrooms:null,parking:null,
        amenities:["water","electricity","security","parking"],
        listing:"RENT",price:650000
      },
      {
        id:"cccccccc-cccc-cccc-cccc-cccccccccccc", title:"Lake-view villa near Rubavu",
        description:"Weekend villa with garden and generator backup near Lake Kivu.",
        type:"VILLA", district:"Rubavu", province:"Western",
        lat:-1.702,lng:29.256,bedrooms:4,bathrooms:3,parking:3,
        amenities:["water","electricity","security","parking"],
        listing:"SHORT_STAY",price:180000
      },
      {
        id:"dddddddd-dddd-dddd-dddd-dddddddddddd", title:"Warehouse Kishenyi industrial",
        description:"1,200 sqm warehouse with truck access and 24h security.",
        type:"WAREHOUSE",district:"Gasabo",province:"Kigali",
        lat:-1.93,lng:30.14,area:1200,amenities:["security","electricity","parking"],
        listing:"RENT",price:3200000
      },
      {
        id:"eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee", title:"Residential Plot in Musanze",
        description:"Residential land with road access near Musanze.",
        type:"LAND",district:"Musanze",province:"Northern",
        lat:-1.4998,lng:29.635,area:800,amenities:[],
        listing:"SALE",price:45000000
      }
    ];

    const images = [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&w=1600",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&w=1600",
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&w=1600"
    ];

    for (const p of properties) {
      await client.query(
        "INSERT INTO properties(id,owner_id,organization_id,title,description,property_type,status,country_code,verification_status,risk_level,risk_score,bedrooms,bathrooms,parking,area_value,area_unit,published_at) " +
        "VALUES($1,'11111111-1111-1111-1111-111111111111',$2,$3,$4,$5,'PUBLISHED','RW',$6,'LOW',4,$7,$8,$9,$10,'SQM',now()) " +
        "ON CONFLICT(id) DO UPDATE SET title=EXCLUDED.title,description=EXCLUDED.description,updated_at=now(),status='PUBLISHED'",
        [p.id,p.id==="bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb" ? "55555555-5555-5555-5555-555555555555" : null,p.title,p.description,p.type,p.id==="eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee" ? "UNVERIFIED" : "VERIFIED",p.bedrooms ?? null,p.bathrooms ?? null,p.parking ?? null,p.area ?? null],
      );

      await client.query(
        "INSERT INTO property_locations(property_id,country_code,province,district,sector,geom) VALUES($1,'RW',$2,$3,$4,ST_SetSRID(ST_MakePoint($5,$6),4326)::geography) " +
        "ON CONFLICT(property_id) DO UPDATE SET province=EXCLUDED.province,district=EXCLUDED.district,sector=EXCLUDED.sector,geom=EXCLUDED.geom",
        [p.id,p.province,p.district,p.sector ?? null,p.lng,p.lat],
      );

      await client.query("DELETE FROM property_amenities WHERE property_id=$1",[p.id]);
      for (const amenity of p.amenities) await client.query("INSERT INTO property_amenities(property_id,amenity) VALUES($1,$2)",[p.id,amenity]);

      await client.query("DELETE FROM property_media WHERE property_id=$1",[p.id]);
      for (let i=0;i<images.length;i++) {
        await client.query(
          "INSERT INTO property_media(id,property_id,kind,storage_key,sort_order) VALUES(gen_random_uuid(),$1,'PHOTO',$2,$3)",
          [p.id,images[i],i],
        );
      }

      const existingListing = await client.query(
        "SELECT id FROM property_listings WHERE property_id=$1 AND listing_type=$2 ORDER BY created_at LIMIT 1",
        [p.id,p.listing],
      );
      let listingId;
      if (existingListing.rows[0]) {
        listingId=existingListing.rows[0].id;
        await client.query("UPDATE property_listings SET status='ACTIVE',available_from=now(),updated_at=now() WHERE id=$1",[listingId]);
        await client.query("UPDATE property_prices SET amount_minor=$2,effective_to=NULL WHERE listing_id=$1 AND effective_to IS NULL",[listingId,p.price]);
      } else {
        const listing = await client.query(
          "INSERT INTO property_listings(id,property_id,listing_type,status,available_from) VALUES(gen_random_uuid(),$1,$2,'ACTIVE',now()) RETURNING id",
          [p.id,p.listing],
        );
        listingId=listing.rows[0].id;
        await client.query(
          "INSERT INTO property_prices(listing_id,amount_minor,currency,period) VALUES($1,$2,'RWF',$3)",
          [listingId,p.price,p.listing==="RENT"?"MONTH":p.listing==="SHORT_STAY"?"NIGHT":null],
        );
      }
      await client.query(
        "INSERT INTO background_jobs(name,payload) SELECT 'search.index', $2::jsonb WHERE NOT EXISTS (SELECT 1 FROM background_jobs WHERE name='search.index' AND payload->>'listingId'=$1 AND status IN ('PENDING','RUNNING'))",
        [String(listingId),JSON.stringify({listingId:String(listingId)})],
      );
    }

    await client.query("DELETE FROM saved_searches WHERE user_id='22222222-2222-2222-2222-222222222222' AND name='Kicukiro 2-3 bed under 900k'");
    await client.query(
      "INSERT INTO saved_searches(id,user_id,name,criteria,notify) VALUES(gen_random_uuid(),'22222222-2222-2222-2222-222222222222','Kicukiro 2-3 bed under 900k',$1::jsonb,true)",
      [JSON.stringify({district:"Kicukiro",bedroomsMin:2,maxPriceMinor:900000,listingType:"RENT"})],
    );

    await client.query("COMMIT");
    console.log("Seeded Imizi PostgreSQL database");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
