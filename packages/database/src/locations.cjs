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

async function upsert(client, level, code, name, parentId, metadata) {
  const result = await client.query(
    "INSERT INTO rwanda_admin_units(level,code,parent_id,name,normalized_name,source,metadata) VALUES($1,$2,$3,$4,$5,'NISR_2022',$6::jsonb) " +
    "ON CONFLICT(level,code) DO UPDATE SET parent_id=EXCLUDED.parent_id,name=EXCLUDED.name,normalized_name=EXCLUDED.normalized_name,metadata=EXCLUDED.metadata,active=true,updated_at=now() RETURNING id",
    [level, String(code), parentId, String(name), norm(name), JSON.stringify(metadata || {})],
  );
  return result.rows[0].id;
}

async function syncRwandaLocations(client) {
  const [districts, sectors, cells, villages] = await Promise.all(LAYERS.map(fetchLayer));
  const provinces = new Map();
  for (const r of districts) provinces.set(String(r.province_id), { code:r.province_id, name:r.province });
  const provinceIds = new Map();
  for (const p of provinces.values()) provinceIds.set(String(p.code), await upsert(client,"PROVINCE",p.code,p.name,null,{sourceLayer:"district"}));

  const districtIds = new Map();
  for (const r of districts) {
    const id = await upsert(client,"DISTRICT",r.district_id,r.district,provinceIds.get(String(r.province_id)),r);
    districtIds.set(String(r.district_id),id);
  }
  const sectorIds = new Map();
  for (const r of sectors) {
    const id = await upsert(client,"SECTOR",r.sector_id,r.sector,districtIds.get(String(r.district_id)),r);
    sectorIds.set(String(r.sector_id),id);
  }
  const cellIds = new Map();
  for (const r of cells) {
    const id = await upsert(client,"CELL",r.cell_id,r.cell,sectorIds.get(String(r.sector_id)),r);
    cellIds.set(String(r.cell_id),id);
  }
  for (const r of villages) {
    await upsert(client,"VILLAGE",r.village_id,r.village,cellIds.get(String(r.cell_id)),r);
  }

  await client.query(
    "UPDATE rwanda_admin_units SET active=false,updated_at=now() WHERE source='NISR_2022' AND id NOT IN (" +
    "SELECT id FROM rwanda_admin_units WHERE source='NISR_2022')",
  );
  return { provinces:provinces.size, districts:districts.length, sectors:sectors.length, cells:cells.length, villages:villages.length };
}

module.exports = { syncRwandaLocations };
