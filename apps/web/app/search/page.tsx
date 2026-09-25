import Link from "next/link";
import { api, formatRwf } from "../../lib/api";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
  const data = await api<{ items: any[] }>(`/search?${qs.toString()}`);
  return (
    <main className="wrap" style={{ paddingTop: 28 }}>
      <h1>Search</h1>
      <form className="searchbox" action="/search">
        <input name="q" defaultValue={params.q} placeholder="house near Kigali with 3 bedrooms under 1 million" />
        <select name="listingType" defaultValue={params.listingType ?? "RENT"}>
          <option value="RENT">Rent</option>
          <option value="SALE">Buy</option>
          <option value="SHORT_STAY">Short stay</option>
        </select>
        <input name="maxPriceMinor" placeholder="Max RWF" defaultValue={params.maxPriceMinor} />
        <button>Apply</button>
      </form>
      <p className="muted">{data.items.length} ranked results · OpenSearch index with PostgreSQL/PostGIS fallback</p>
      <div className="grid">
        {data.items.map((item: any) => (
          <Link key={item.listing.id} href={`/properties/${item.property.id}`} className="card">
            <img src={item.property.media[0]?.url} alt="" />
            <div className="meta">
              <div className="badge">Score {(item.score * 100).toFixed(0)}</div>
              <strong>{item.property.title}</strong>
              <div className="muted">{item.property.district}</div>
              <div className="price">{formatRwf(item.listing.priceMinor)}</div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
