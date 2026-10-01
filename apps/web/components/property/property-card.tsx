"use client";
import { CheckCircle, Heart, GitCompareArrows, Share2, Images, MapPin, BedDouble, Bath, Ruler } from "lucide-react";
import { AppImage } from "../app-image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TiltCard } from "../motion/tilt-card";
import { SpotlightCard } from "../motion/spotlight-card";
import { formatRwf } from "../../lib/api";
import { TransitionLink } from "../transition-link";
import { useCompareStore } from "../compare-store";
import { trackEvent } from "../../lib/analytics";
import { useFavorites, useSaveFavorite } from "../../hooks/use-favorites";

const TYPE_LABELS: Record<string, string> = {
  HOUSE: "House", APARTMENT: "Apartment", APARTMENT_BUILDING: "Apt Building",
  VILLA: "Villa", LAND: "Land", SHOP: "Shop", WAREHOUSE: "Warehouse",
  OFFICE: "Office", COMMERCIAL: "Commercial",
};

export function PropertyCard({ item, variant = "default" }: { item: any; variant?: "default" | "compact" | "large" }) {
  const p = item.property ?? item;
  const l = item.listing ?? p.listings?.[0];
  const media = p.media ?? [];
  const { data: favorites = [] } = useFavorites();
  const save = useSaveFavorite();
  const [localSaved, setLocalSaved] = useState(false);
  const saved = localSaved || favorites.some((x: any) => x.propertyId === p.id);
  const compare = useCompareStore(s => s.toggle);

  useEffect(() => setLocalSaved(favorites.some((x: any) => x.propertyId === p.id)), [favorites, p.id]);

  const doSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await save.mutateAsync(p.id);
      trackEvent(saved ? "property_unsaved" : "property_saved", { property_id: p.id });
      setLocalSaved(!saved);
      toast(saved ? "Removed from saved" : "Saved to your account");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Sign in to save properties");
    }
  };

  const doShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    const url = window.location.origin + "/properties/" + p.id;
    try {
      if (navigator.share) await navigator.share({ title: p.title || "Imizi property", url });
      else { await navigator.clipboard.writeText(url); toast("Property link copied"); }
      trackEvent("property_shared", { property_id: p.id });
    } catch {}
  };

  const typeLabel = TYPE_LABELS[p.propertyType] ?? p.propertyType;

  return (
    <TiltCard className={variant === "compact" ? "" : "h-full"}>
      <SpotlightCard className="h-full">
        <TransitionLink href={"/properties/" + p.id} className="card block h-full">
          {/* Image area */}
          <div className={`relative overflow-hidden ${variant === "large" ? "aspect-[16/10]" : "aspect-[4/3]"}`}>
            {media[0]?.url
              ? <AppImage src={media[0].url} alt={p.title || "Property"} fill sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 ease-[var(--ease-out)] hover:scale-[1.04]"
                  style={{ viewTransitionName: "property-image-" + p.id }} />
              : <div className="grid h-full w-full place-items-center bg-[var(--color-surface-3)] text-sm text-[var(--color-fg-muted)]">No media</div>
            }
            {/* Top badges row */}
            <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
              <div className="flex gap-1 flex-wrap">
                {p.verificationStatus === "VERIFIED" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-emerald-800 shadow-sm">
                    <CheckCircle size={12} /> Verified
                  </span>
                )}
                {typeLabel && (
                  <span className="inline-flex items-center rounded-full bg-black/60 px-2.5 py-1 text-xs font-bold text-white">{typeLabel}</span>
                )}
              </div>
              <div className="flex gap-1.5">
                <button type="button" aria-label="Share property"
                  className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-slate-800 shadow-sm hover:bg-white transition-colors"
                  onClick={doShare}><Share2 size={15} /></button>
                <button type="button" aria-label={saved ? "Remove saved" : "Save property"}
                  className={`grid h-9 w-9 place-items-center rounded-full shadow-sm transition-all ${saved ? "bg-[var(--color-primary)] text-white" : "bg-white/90 text-slate-800 hover:bg-white"}`}
                  onClick={doSave} disabled={save.isPending}><Heart size={16} fill={saved ? "currentColor" : "none"} /></button>
              </div>
            </div>
            {/* Media count */}
            {media.length > 0 && (
              <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-1.5 text-xs font-bold text-white">
                <Images size={12} />{media.length}
              </span>
            )}
            {/* Compare button */}
            <button type="button" aria-label="Compare"
              className="absolute bottom-3 right-3 inline-flex h-8 items-center gap-1 rounded-full bg-white/90 px-3 text-xs font-bold text-slate-800 shadow-sm hover:bg-white transition-colors"
              onClick={e => { e.preventDefault(); compare({ id: p.id, title: p.title, price: l ? formatRwf(l.priceMinor) : "POA", image: media[0]?.url }); }}>
              <GitCompareArrows size={13} /> Compare
            </button>
          </div>

          {/* Card body */}
          <div className="cardBody flex flex-col gap-2">
            {/* Price */}
            <div className="flex items-baseline justify-between gap-2 mt-1">
              <div className="price">
                {l ? formatRwf(l.priceMinor) : <span className="text-[var(--color-fg-muted)]">Price on request</span>}
                {l?.listingType === "RENT" && <span className="text-sm font-normal text-[var(--color-fg-muted)]"> /mo</span>}
                {l?.listingType === "SHORT_STAY" && <span className="text-sm font-normal text-[var(--color-fg-muted)]"> /night</span>}
              </div>
            </div>
            {/* Title */}
            <div className="font-bold leading-tight line-clamp-2" style={{ viewTransitionName: "property-title-" + p.id }}>{p.title}</div>
            {/* Location */}
            <div className="meta flex items-center gap-1 text-xs">
              <MapPin size={11} className="flex-shrink-0" />
              <span className="truncate">{[p.sector, p.district].filter(Boolean).join(", ") || "Rwanda"}</span>
            </div>
            {/* Specs row */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-semibold text-[var(--color-fg-muted)] border-t border-[var(--color-border)]">
              {p.bedrooms != null && <span className="flex items-center gap-1"><BedDouble size={12} />{p.bedrooms} bd</span>}
              {p.bathrooms != null && <span className="flex items-center gap-1"><Bath size={12} />{p.bathrooms} ba</span>}
              {p.areaValue != null && <span className="flex items-center gap-1"><Ruler size={12} />{p.areaValue} {p.areaUnit || "sqm"}</span>}
            </div>
          </div>
        </TransitionLink>
      </SpotlightCard>
    </TiltCard>
  );
}
