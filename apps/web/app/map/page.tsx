import Link from "next/link";
import { api, formatRwf } from "../../lib/api";

export default async function MapPage() {
  const data = await api<{ items: any[] }>("/search?listingType=RENT&limit=20");
  return (
    <main className="wrap" style={{ paddingTop: 24 }}>
      <h1>Map view</h1>
      <p className="muted">Search this area uses bounding-box filters. Pins are projected from WGS84 coordinates.</p>
      <div className="map">
        {data.items.map((item: any, i: number) => (
          <Link
            key={item.listing.id}
            href={`/properties/${item.property.id}`}
            className="pin"
            style={{
              left: `${20 + ((item.property.longitude + 30.2) / 0.6) * 60}%`,
              top: `${20 + ((item.property.latitude + 2.1) / 0.8) * 60}%`,
              background: i % 2 ? "#b85c38" : "#1f4d3a",
            }}
            title={item.property.title}
          />
        ))}
        <div style={{ position: "absolute", left: 16, top: 16, background: "white", padding: "8px 12px" }}>
          Search this area
        </div>
      </div>
      <div className="grid">
        {data.items.slice(0, 4).map((item: any) => (
          <Link key={item.listing.id} className="card" href={`/properties/${item.property.id}`}>
            <div className="meta">
              <strong>{item.property.title}</strong>
              <div>{formatRwf(item.listing.priceMinor)}</div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
