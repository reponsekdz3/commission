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

export const dynamic = "force-dynamic";

function SearchContent() {
  const params = useSearchParams(),
    router = useRouter(),
    pathname = usePathname();
  const q = params.toString();
  const { data, isLoading, isError, error } = useProperties(q);
  const items = useMemo(() => data?.items ?? [], [data]);
  const listRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string>();
  useEffect(() => {
    trackEvent("search", { query: q });
  }, [q]);

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
      (entries) => {
        const visible = entries
          .filter((x) => x.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const id = (visible.target as HTMLElement).dataset.propertyId;
          if (id) setActiveId(id);
        }
      },
      { root, rootMargin: "-45% 0px -45%", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [items]);

  return (
    <main className="searchSplit">
      <section className="searchList" ref={listRef}>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <div className="eyebrow">Discovery engine</div>
            <h1 className="text-4xl font-extrabold md:text-5xl">Find your next property.</h1>
            <p className="muted max-w-2xl">
              Live Rwanda inventory with backend search, map context and verified listings.
            </p>
          </div>
          <Link href="/map" className="btn ghost">
            Map
          </Link>
        </div>
        <PropertyFilters />
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {["RENT", "SALE", "SHORT_STAY"].map((x) => (
            <Link
              key={x}
              href={"/search?listingType=" + x}
              className={"chip " + (params.get("listingType") === x ? "active" : "")}
            >
              {x === "RENT" ? "Rent" : x === "SALE" ? "Buy" : "Short stay"}
            </Link>
          ))}
          <SavedSearchChip />
        </div>
        {isError && (
          <div className="notice error mt-4">
            {error instanceof Error ? error.message : "Search failed"}
          </div>
        )}
        <div className="sectionLabel mt-5">
          <span>
            <b>{items.length}</b> live results
          </span>
          <span className="muted">Rwanda</span>
        </div>
        {isLoading ? (
          <div className="grid [grid-template-columns:repeat(auto-fill,minmax(250px,1fr))]">
            {[1, 2, 3, 4].map((i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </div>
        ) : items.length ? (
          <div className="grid [grid-template-columns:repeat(auto-fill,minmax(250px,1fr))]">
            {items.map((item: SearchItem) => (
              <div
                key={item.listing.id}
                data-property-id={item.property.id}
                className={
                  activeId === item.property.id
                    ? "[&_.card]:ring-2 [&_.card]:ring-[var(--color-accent)]"
                    : ""
                }
              >
                <PropertyCard item={item} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            kind="search"
            title="No properties match"
            description="The live backend returned no listings for these filters."
            action={
              <Link href="/search" className="btn">
                Reset search
              </Link>
            }
          />
        )}
      </section>
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
            <div className="grid [grid-template-columns:repeat(auto-fill,minmax(250px,1fr))]">
              {[1, 2, 3, 4].map((i) => (
                <PropertyCardSkeleton key={i} />
              ))}
            </div>
          </section>
        </main>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
