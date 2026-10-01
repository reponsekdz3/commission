"use client";
import { useFavorites } from "../../hooks/use-favorites";
import Link from "next/link";
import { Heart, ArrowRight, Home } from "lucide-react";
import { EmptyState } from "../../components/empty-state";

export default function Favorites() {
  const { data: items = [], isLoading, isError, error } = useFavorites();

  return (
    <main className="wrap section">
      {/* Header */}
      <div className="mb-8">
        <div className="eyebrow mb-2">Shortlist</div>
        <h1 className="text-[clamp(2rem,5vw,3.2rem)] font-[900] tracking-[-0.05em] leading-tight mb-2">
          Saved properties.
        </h1>
        <p className="text-[var(--color-fg-muted)] text-[15px]">
          Your account-backed shortlist syncs across all your devices.
        </p>
      </div>

      {isError && (
        <div className="alert alert-error mb-6 flex items-center gap-2">
          <span>{error instanceof Error ? error.message : "Could not load saved properties"}</span>
          <Link href="/login" className="ml-auto font-[700] underline flex-shrink-0">Sign in →</Link>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="card animate-shimmer" style={{ height: 280 }} />
          ))}
        </div>
      ) : items.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map(x => {
            const pid = (x as any).propertyId || (x as any).id;
            const title = (x as any).title || (x as any).property?.title || pid;
            const district = (x as any).district || (x as any).property?.district;
            const media = (x as any).property?.media;
            const priceMinor = (x as any).property?.listings?.[0]?.priceMinor;
            return (
              <Link
                key={pid}
                href={"/properties/" + pid}
                className="card block group"
              >
                <div className="relative overflow-hidden aspect-[4/3] bg-[var(--color-surface-3)]">
                  {media?.[0]?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={media[0].url}
                      alt={title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center flex-col gap-2 text-[var(--color-fg-muted)]">
                      <Home size={28} />
                      <span className="text-xs">No media</span>
                    </div>
                  )}
                  <span className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90">
                    <Heart size={15} fill="var(--color-primary)" className="text-[var(--color-primary)]" />
                  </span>
                </div>
                <div className="cardBody">
                  {priceMinor && (
                    <div className="price mb-1">
                      {new Intl.NumberFormat("en-RW", { style: "currency", currency: "RWF", maximumFractionDigits: 0 }).format(priceMinor)}
                    </div>
                  )}
                  <div className="font-[700] leading-tight line-clamp-2 mb-1">{title}</div>
                  {district && <div className="meta">{district}</div>}
                  <div className="flex items-center gap-1 mt-3 text-[var(--color-primary)] text-xs font-[700]">
                    View property <ArrowRight size={12} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        !isError && (
          <EmptyState
            kind="saved"
            title="No saved properties yet"
            description="Save listings from search results to build your shortlist."
            action={
              <Link className="btn" href="/search">
                Explore properties
              </Link>
            }
          />
        )
      )}
    </main>
  );
}
