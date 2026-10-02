"use client";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MapboxClient } from "../map/mapbox-client";
import { PropertyCard } from "../../components/property/property-card";
import { PropertyFilters } from "../../components/property/property-filters";
import { useProperties, type SearchItem } from "../../hooks/use-properties";
import { PropertyCardSkeleton } from "../../components/ui";
import { SavedSearchChip } from "../../components/saved-search-chip";
import { EmptyState } from "../../components/empty-state";
import { trackEvent } from "../../lib/analytics";
import { Map, SlidersHorizontal, LayoutGrid } from "lucide-react";

function SearchContent() {
  const params   = useSearchParams();
  const router   = useRouter();
  const pathname = usePathname();
  const q        = params.toString();

  const { data, isLoading, isError, error } = useProperties(q);
  const items    = useMemo(() => data?.items ?? [], [data]);
  const listRef  = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId]   = useState<string>();
  const [showFilters, setFilters] = useState(false);

  useEffect(() => { trackEvent("search", { query: q }); }, [q]);

  const onBoundsChange = useCallback(
    (b: { north: number; south: number; east: number; west: number }) => {
      const p = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(b)) p.set(k, v.toFixed(6));
      router.replace(pathname + "?" + p.toString(), { scroll: false });
    },
    [params, pathname, router]
  );

  const scrollToProperty = useCallback((id: string) => {
    setActiveId(id);
    listRef.current
      ?.querySelector<HTMLElement>('[data-property-id="' + CSS.escape(id) + '"]')
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  useEffect(() => {
    const root = listRef.current;
    if (!root || !items.length) return;
    const nodes = [...root.querySelectorAll<HTMLElement>("[data-property-id]")];
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(x => x.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const id = (visible.target as HTMLElement).dataset.propertyId;
          if (id) setActiveId(id);
        }
      },
      { root, rootMargin: "-45% 0px -45%", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    nodes.forEach(node => observer.observe(node));
    return () => observer.disconnect();
  }, [items]);

  const currentType = params.get("listingType");

  return (
    <main className="searchSplit" style={{animationName:'fadeIn',animationDuration:'.4s',animationFillMode:'both'}}>
      {/* ── List side ── */}
      <section className="searchList" ref={listRef}>
        {/* Header */}
        <div className="search-list-head" style={{animationName:'slideInLeft',animationDuration:'.5s',animationFillMode:'both'}}>
          <div>
            <div className="eyebrow mb-1">Discovery engine</div>
            <h1 className="search-title">Find your next property.</h1>
            <p className="search-sub">
              Live Rwanda inventory — verified listings with maps and real-time availability.
            </p>
          </div>
          <div className="search-head-actions">
            <button
              className={`btn ghost flex items-center gap-2 ${showFilters ? "" : ""}`}
              onClick={() => setFilters(p => !p)}
              style={{ fontSize: 13 }}
            >
              <SlidersHorizontal size={14} />
              Filters
            </button>
            <Link href="/map" className="btn ghost flex items-center gap-2" style={{ fontSize: 13 }}>
              <Map size={14} /> Map only
            </Link>
          </div>
        </div>

        {/* Listing type tabs */}
        <div className="search-type-bar" style={{animationName:'slideInLeft',animationDuration:'.4s',animationDelay:'.1s',animationFillMode:'both'}}>
          <div className="search-type-chips">
            {[
              { key: null,          label: "All" },
              { key: "RENT",        label: "Rent" },
              { key: "SALE",        label: "Buy" },
              { key: "SHORT_STAY",  label: "Short stay" },
            ].map(({ key, label }) => (
              <Link
                key={label}
                href={key ? `/search?listingType=${key}` : "/search"}
                className={`chip ${currentType === key || (!currentType && !key) ? "active" : ""}`}
              >
                {label}
              </Link>
            ))}
            <SavedSearchChip />
          </div>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="search-filters-panel" style={{animationName:'slideInUp',animationDuration:'.3s',animationFillMode:'both'}}>
            <PropertyFilters />
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="alert alert-error mt-4">
            {error instanceof Error ? error.message : "Search failed"}
          </div>
        )}

        {/* Results count */}
        <div className="search-results-bar">
          <div className="search-results-count">
            <strong>{isLoading ? "…" : items.length}</strong>
            <span>live results</span>
            <span className="search-results-region">· Rwanda</span>
          </div>
          <div className="flex items-center gap-2">
            <LayoutGrid size={15} className="text-[var(--color-fg-muted)]" />
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="search-grid">
            {[1, 2, 3, 4, 5, 6].map(i => <PropertyCardSkeleton key={i} />)}
          </div>
        ) : items.length ? (
          <div className="search-grid" style={{animationName:'fadeInUp',animationDuration:'.4s',animationFillMode:'both'}}>
            {items.map((item: SearchItem) => (
              <div
                key={item.listing.id}
                data-property-id={item.property.id}
                className={activeId === item.property.id
                  ? "[&_.card]:ring-2 [&_.card]:ring-[var(--color-accent)] [&_.card]:shadow-md"
                  : ""}
              >
                <PropertyCard item={item} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            kind="search"
            title="No properties match"
            description="The live backend returned no listings for these filters. Try resetting or broadening your search."
            action={<Link href="/search" className="btn">Reset search</Link>}
          />
        )}
      </section>

      {/* ── Map side ── */}
      <aside className="searchMap">
        <MapboxClient
          items={items}
          activeId={activeId}
          onMarkerSelect={scrollToProperty}
          onBoundsChange={onBoundsChange}
        />
      </aside>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <main className="searchSplit">
          <section className="searchList">
            <div className="search-grid mt-6">
              {[1, 2, 3, 4, 5, 6].map(i => <PropertyCardSkeleton key={i} />)}
            </div>
          </section>
        </main>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
