const { Client } = require("pg");

const BASE = "https://moegis.environment.gov.rw/server/rest/services/Hosted/Administrative_boundaries/FeatureServer";
const LAYERS = [
  { id: 0, level: "DISTRICT", fields: ["province","province_id","district","district_id"] },
  { id: 1, level: "SECTOR", fields: ["province","province_id","district","district_id","sector","sector_id"] },
  { id: 2, level: "CELL", fields: ["province","province_id","district","district_id","sector","sector_id","cell","cell_id"] },
  { id: 3, level: "VILLAGE", fields: ["province","province_id","district","district_id","sector","sector_id","cell","cell_id","village","village_id"] },
];

const norm = value => String(value ?? "").trim().toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"");

async function fetchLayer(layer) {
  const rows = [];
  const pageSize = 1800;
  for (let offset = 0;;) {
    const params = new URLSearchParams({
      where: "1=1",
      outFields: layer.fields.join(","),
      returnGeometry: "false",
      resultOffset: String(offset),
      resultRecordCount: String(pageSize),
      orderByFields: "objectid",
      f: "json",
    });
    const response = await fetch(`${BASE}/${layer.id}/query?${params}`, { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(`Rwanda admin source HTTP ${response.status}`);
    const body = await response.json();
    if (body.error) throw new Error(body.error.message || "Rwanda admin source error");
    rows.push(...(body.features || []).map(x => x.attributes));
    if (!(body.exceededTransferLimit || (body.features || []).length === pageSize)) break;
    offset += (body.features || []).length;
  }
  return rows;
}

async function upsertBatch(client, level, records, source = "NISR_2022") {
  for (let offset = 0; offset < records.length; offset += 500) {
    const chunk = records.slice(offset, offset + 500);
    const values = [];
    const placeholders = [];
    for (let i = 0; i < chunk.length; i++) {
      const base = i * 7;
      placeholders.push("($" + (base + 1) + ",$" + (base + 2) + ",$" + (base + 3) + ",$" + (base + 4) + ",$" + (base + 5) + ",$" + (base + 6) + ",$" + (base + 7) + "::jsonb)");
      values.push(level, String(chunk[i].code), chunk[i].parentId || null, String(chunk[i].name), norm(chunk[i].name), source, JSON.stringify(chunk[i].metadata || {}));
    }
    await client.query(
      "INSERT INTO rwanda_admin_units(level,code,parent_id,name,normalized_name,source,metadata) VALUES " + placeholders.join(",") +
      " ON CONFLICT(level,code) DO UPDATE SET parent_id=EXCLUDED.parent_id,name=EXCLUDED.name,normalized_name=EXCLUDED.normalized_name,metadata=EXCLUDED.metadata,active=true,updated_at=now()",
      values,
    );
  }
  const codes = records.map(r => String(r.code));
  const result = await client.query("SELECT id,code FROM rwanda_admin_units WHERE level=$1 AND code=ANY($2::text[])", [level, codes]);
  return new Map(result.rows.map(r => [String(r.code), r.id]));
}

async function syncRwandaLocations(client) {
  await client.query("DELETE FROM rwanda_admin_units WHERE source='LOCAL_DEVELOPMENT_FALLBACK'");
  const [districts, sectors, cells, villages] = await Promise.all(LAYERS.map(fetchLayer));
  const provinces = new Map();
  for (const r of districts) provinces.set(String(r.province_id), { code: r.province_id, name: r.province });

  const provinceIds = await upsertBatch(client, "PROVINCE", Array.from(provinces.values()).map(p => ({
    code: p.code, name: p.name, parentId: null, metadata: { sourceLayer: "district" }
  })));
  const districtIds = await upsertBatch(client, "DISTRICT", districts.map(r => ({
    code: r.district_id, name: r.district, parentId: provinceIds.get(String(r.province_id)), metadata: r
  })));
  const sectorIds = await upsertBatch(client, "SECTOR", sectors.map(r => ({
    code: r.sector_id, name: r.sector, parentId: districtIds.get(String(r.district_id)), metadata: r
  })));
  const cellIds = await upsertBatch(client, "CELL", cells.map(r => ({
    code: r.cell_id, name: r.cell, parentId: sectorIds.get(String(r.sector_id)), metadata: r
  })));
  await upsertBatch(client, "VILLAGE", villages.map(r => ({
    code: r.village_id, name: r.village, parentId: cellIds.get(String(r.cell_id)), metadata: r
  })));

  return {
    provinces: provinces.size,
    districts: districts.length,
    sectors: sectors.length,
    cells: cells.length,
    villages: villages.length,
  };
}


const FALLBACK_PROVINCES = [
  { code: "RW-KIGALI", name: "Kigali" },
  { code: "RW-N", name: "Northern" },
  { code: "RW-S", name: "Southern" },
  { code: "RW-W", name: "Western" },
  { code: "RW-E", name: "Eastern" },
];

const FALLBACK_DISTRICTS = [
  ["RW-KIGALI-GASABO","Gasabo","RW-KIGALI"],
  ["RW-KIGALI-KICUKIRO","Kicukiro","RW-KIGALI"],
  ["RW-KIGALI-NYARUGENGE","Nyarugenge","RW-KIGALI"],
  ["RW-N-BURERA","Burera","RW-N"],
  ["RW-N-GAKENKE","Gakenke","RW-N"],
  ["RW-N-GICUMBI","Gicumbi","RW-N"],
  ["RW-N-MUSANZE","Musanze","RW-N"],
  ["RW-N-RULINDO","Rulindo","RW-N"],
  ["RW-S-GISAGARA","Gisagara","RW-S"],
  ["RW-S-HUYE","Huye","RW-S"],
  ["RW-S-KAMONYI","Kamonyi","RW-S"],
  ["RW-S-MUHANGA","Muhanga","RW-S"],
  ["RW-S-NYAMAGABE","Nyamagabe","RW-S"],
  ["RW-S-NYANZA","Nyanza","RW-S"],
  ["RW-S-NYARUGURU","Nyaruguru","RW-S"],
  ["RW-S-RUHANGO","Ruhango","RW-S"],
  ["RW-W-KARONGI","Karongi","RW-W"],
  ["RW-W-NGORORERO","Ngororero","RW-W"],
  ["RW-W-NYABIHU","Nyabihu","RW-W"],
  ["RW-W-NYAMASHEKE","Nyamasheke","RW-W"],
  ["RW-W-RUBAVU","Rubavu","RW-W"],
  ["RW-W-RUSIZI","Rusizi","RW-W"],
  ["RW-W-RUTSIRO","Rutsiro","RW-W"],
  ["RW-E-BUGESERA","Bugesera","RW-E"],
  ["RW-E-GATSIBO","Gatsibo","RW-E"],
  ["RW-E-KAYONZA","Kayonza","RW-E"],
  ["RW-E-KIREHE","Kirehe","RW-E"],
  ["RW-E-NGOMA","Ngoma","RW-E"],
  ["RW-E-NYAGATARE","Nyagatare","RW-E"],
  ["RW-E-RWAMAGANA","Rwamagana","RW-E"],
];

const FALLBACK_SECTORS = [
  ["RW-KIGALI-KICUKIRO-KAGARAMA","Kagarama","RW-KIGALI-KICUKIRO"],
  ["RW-KIGALI-GASABO-GACURIRO","Gacuriro","RW-KIGALI-GASABO"],
];

async function seedLocalRwandaHierarchy(client) {
  const source = "LOCAL_DEVELOPMENT_FALLBACK";
  const provinceIds = await upsertBatch(
    client,
    "PROVINCE",
    FALLBACK_PROVINCES.map((p) => ({ code: p.code, name: p.name, parentId: null, metadata: { source: "local-development-fallback" } })),
    source,
  );
  const districtIds = await upsertBatch(
    client,
    "DISTRICT",
    FALLBACK_DISTRICTS.map(([code, name, provinceCode]) => ({
      code,
      name,
      parentId: provinceIds.get(provinceCode) || null,
      metadata: { provinceCode, source: "local-development-fallback" },
    })),
    source,
  );
  await upsertBatch(
    client,
    "SECTOR",
    FALLBACK_SECTORS.map(([code, name, districtCode]) => ({
      code,
      name,
      parentId: districtIds.get(districtCode) || null,
      metadata: { districtCode, source: "local-development-fallback" },
    })),
    source,
  );
  return {
    provinces: FALLBACK_PROVINCES.length,
    districts: FALLBACK_DISTRICTS.length,
    sectors: FALLBACK_SECTORS.length,
    cells: 0,
    villages: 0,
    source,
  };
}

module.exports = { syncRwandaLocations, seedLocalRwandaHierarchy };
