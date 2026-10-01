"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Search, List, SlidersHorizontal, MapPin,
  X, ArrowRight, Layers, Navigation,
} from "lucide-react";
import { api, formatRwf } from "../../lib/api";
import { MapboxClient } from "./mapbox-client";

const LISTING_TYPES = [
  { key: "RENT",       label: "Rent" },
  { key: "SALE",       label: "Buy" },
  { key: "SHORT_STAY", label: "Stay" },
] as const;

export default function MapPage() {
  const [items, setItems]           = useState<any[]>([]);
  const [q, setQ]                   = useState("");
  const [loading, setLoading]       = useState(true);
  const [listingType, setType]      = useState("RENT");
  const [showPanel, setShowPanel]   = useState(true);
  const [activeId, setActiveId]     = useState<string | undefined>();

  const load = useCallback(async (type: string) => {
    setLoading(true);
    try {
      const x = await api<any>(`/search?listingType=${type}&limit=60`);
      setItems(x.items || []);
    } catch {
      /* no-op */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(listingType); }, [listingType, load]);

  const visible = items.filter(x =>
    !q ||
    String(x.property.title).toLowerCase().includes(q.toLowerCase()) ||
    String(x.property.district).toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="map-fullpage">
      {/* ── Floating top bar ── */}
      <div className="map-topbar">
        <div className="map-topbar-inner">
          {/* Left: brand + search */}
          <div className="map-topbar-left">
            <div className="map-topbar-brand">
              <MapPin size={16} />
              <span>Explore Map</span>
            </div>
            <div className="map-search-wrap">
              <Search size={14} className="map-search-icon" />
              <input
                className="map-search-input"
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search by title or district…"
              />
              {q && (
                <button className="map-search-clear" onClick={() => setQ("")}>
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Center: listing type chips */}
          <div className="map-type-chips">
            {LISTING_TYPES.map(({ key, label }) => (
              <button
                key={key}
                className={`chip ${listingType === key ? "active" : ""}`}
                onClick={() => setType(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Right: actions */}
          <div className="map-topbar-right">
            <div className="map-count-badge">
              {loading ? (
                <span className="map-loading-dot" />
              ) : (
                <MapPin size={12} />
              )}
              <span>{loading ? "Loading…" : `${visible.length} listings`}</span>
            </div>
            <button
              className={`btn ghost map-panel-toggle ${showPanel ? "active" : ""}`}
              onClick={() => setShowPanel(p => !p)}
            >
              <List size={15} />
              <span className="map-panel-label">List</span>
            </button>
            <Link href="/search" className="btn ghost flex items-center gap-1.5" style={{ fontSize: 13 }}>
              <SlidersHorizontal size={14} /> Filters
            </Link>
          </div>
        </div>
      </div>

      {/* ── Map + Side panel ── */}
      <div className={`map-stage ${showPanel ? "map-stage-split" : ""}`}>
        {/* Map */}
        <div className="map-canvas">
          <MapboxClient
            items={visible}
            activeId={activeId}
            onMarkerSelect={setActiveId}
          />

          {/* Floating controls */}
          <div className="map-fab-group">
            <button
              className="map-fab"
              onClick={() => setShowPanel(p => !p)}
              aria-label="Toggle list panel"
            >
              <Layers size={18} />
            </button>
          </div>
        </div>

        {/* Side panel */}
        {showPanel && (
          <div className="map-side-panel">
            <div className="map-side-head">
              <h2 className="text-base font-[800] tracking-[-0.02em]">
                {loading ? "Loading listings…" : `${visible.length} results`}
              </h2>
              <Link href="/search" className="text-[var(--color-primary)] text-xs font-[700] flex items-center gap-1 hover:underline">
                Advanced search <ArrowRight size={11} />
              </Link>
            </div>

            <div className="map-side-list">
              {loading && (
                <div className="flex flex-col gap-2 p-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="card-row animate-shimmer" style={{ height: 72 }} />
                  ))}
                </div>
              )}

              {!loading && visible.length === 0 && (
                <div className="empty m-4">
                  <Navigation size={24} className="mx-auto mb-2 text-[var(--color-fg-subtle)]" />
                  <p className="text-sm">No listings match your search in this area.</p>
                  <button className="btn ghost mt-3" style={{ fontSize: 12 }} onClick={() => setQ("")}>
                    Clear filter
                  </button>
                </div>
              )}

              {!loading && visible.map((x: any) => (
                <Link
                  key={x.listing.id}
                  href={`/properties/${x.property.id}`}
                  className={`map-listing-row ${activeId === x.property.id ? "map-listing-row-active" : ""}`}
                  onMouseEnter={() => setActiveId(x.property.id)}
                  onMouseLeave={() => setActiveId(undefined)}
                >
                  <div className="map-listing-img">
                    {x.property.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={x.property.coverImage} alt={x.property.title} className="map-listing-thumb" />
                    ) : (
                      <div className="map-listing-thumb-placeholder">
                        <MapPin size={18} className="text-[var(--color-fg-subtle)]" />
                      </div>
                    )}
                  </div>
                  <div className="map-listing-info">
                    <div className="map-listing-title">{x.property.title}</div>
                    <div className="map-listing-district">
                      <MapPin size={10} /> {x.property.district || "Rwanda"}
                    </div>
                    <div className="map-listing-price">{formatRwf(x.listing.priceMinor)}</div>
                  </div>
                  <ArrowRight size={14} className="map-listing-arrow" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
