import { api, formatRwf } from "../../lib/api";

export default async function DashboardPage() {
  const landlord = await api<any>("/analytics/landlord", {
    headers: { authorization: "Bearer demo" },
  }).catch(() => null);
  const recs = await api<any[]>("/recommendations");
  return (
    <main className="wrap" style={{ paddingTop: 28 }}>
      <h1>Owner / operations</h1>
      <p className="muted">Sign in as landlord@imizi.rw for live counts. Public recommendations still hydrate this page.</p>
      <div className="stats">
        <div className="stat"><div className="muted">Properties</div><strong>{landlord?.properties ?? "—"}</strong></div>
        <div className="stat"><div className="muted">Active</div><strong>{landlord?.active ?? "—"}</strong></div>
        <div className="stat"><div className="muted">Views</div><strong>{landlord?.views ?? "—"}</strong></div>
        <div className="stat"><div className="muted">Revenue</div><strong>{landlord ? formatRwf(landlord.revenue) : "—"}</strong></div>
      </div>
      <h2 style={{ marginTop: 36 }}>Recommended for you</h2>
      <div className="grid">
        {recs.map((item: any) => (
          <div className="card" key={item.id}>
            <div className="meta">
              <strong>{item.property?.title ?? item.id}</strong>
              <div className="muted">{item.district} · {item.propertyType}</div>
              <div>{formatRwf(item.priceMinor)}</div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
