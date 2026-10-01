"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Map, ArrowRight } from "lucide-react";
import { api, formatRwf } from "../../lib/api";
import { MapboxClient } from "./mapbox-client";

export default function MapPage() {
  const [items, setItems] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<any>("/search?listingType=RENT&limit=50")
      .then(x => setItems(x.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const visible = items.filter(x =>
    !q || String(x.property.title).toLowerCase().includes(q.toLowerCase()) ||
    String(x.property.district).toLowerCase().includes(q.toLowerCase())
  );

  return (
    <main className="wrap section">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <div className="eyebrow mb-2">Geospatial discovery</div>
          <h1 className="text-[clamp(2rem,5vw,3.2rem)] font-[900] tracking-[-0.05em] leading-tight mb-2">
            Property map.
          </h1>
          <p className="text-[var(--color-fg-muted)] text-[15px]">
            Live listing coordinates sourced from the real search API, rendered with Mapbox.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-fg-muted)]" />
            <input
              className="field pl-9"
              style={{ minWidth: 220 }}
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Filter listings…"
            />
          </div>
          <Link href="/search" className="btn ghost flex items-center gap-1.5">
            <Map size={14} /> List view
          </Link>
        </div>
      </div>

      {/* Map */}
      <div className="map-container mb-6" style={{ height: 560 }}>
        <MapboxClient items={visible} />
        {loading && (
          <div className="map-control" style={{ top: 12, left: 12 }}>
            <span className="spinner" style={{ width: 14, height: 14 }} /> Loading map data…
          </div>
        )}
        {!loading && (
          <div className="map-control" style={{ top: 12, left: 12 }}>
            <span className="font-[700]">{visible.length}</span>{" "}
            <span className="text-[var(--color-fg-muted)]">listings</span>
          </div>
        )}
      </div>

      {/* Property list below map */}
      {visible.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-[800] tracking-[-0.03em]">Nearby listings</h2>
            <Link href="/search" className="text-[var(--color-primary)] text-sm font-[700] hover:underline flex items-center gap-1">
              Search with filters <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {visible.slice(0, 12).map((x: any) => (
              <Link
                key={x.listing.id}
                href={`/properties/${x.property.id}`}
                className="card-row group"
              >
                <div className="min-w-0">
                  <div className="font-[700] text-sm truncate group-hover:text-[var(--color-primary)] transition-colors">
                    {x.property.title}
                  </div>
                  <div className="text-xs text-[var(--color-fg-muted)] mt-0.5">{x.property.district}</div>
                  <div className="font-[800] text-sm mt-1">{formatRwf(x.listing.priceMinor)}</div>
                </div>
                <ArrowRight size={16} className="text-[var(--color-fg-subtle)] flex-shrink-0 group-hover:text-[var(--color-primary)] transition-colors" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
