"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { Button, Slider, Switch } from "../ui";
import { api } from "../../lib/api";

const PROPERTY_TYPES = [
  { value: "", label: "Any type" },
  { value: "HOUSE", label: "House" },
  { value: "APARTMENT", label: "Apartment" },
  { value: "APARTMENT_BUILDING", label: "Apartment Building" },
  { value: "VILLA", label: "Villa" },
  { value: "LAND", label: "Land" },
  { value: "SHOP", label: "Shop" },
  { value: "WAREHOUSE", label: "Warehouse" },
  { value: "OFFICE", label: "Office" },
  { value: "COMMERCIAL", label: "Commercial" },
];

export function PropertyFilters() {
  const router = useRouter(), pathname = usePathname(), params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [maxPrice, setMaxPrice] = useState(Number(params.get("maxPriceMinor") || 5_000_000));
  const [beds, setBeds] = useState(Number(params.get("bedroomsMin") || 0));
  const [verified, setVerified] = useState(params.get("verifiedOnly") === "true");
  const [propType, setPropType] = useState(params.get("propertyType") || "");
  const [district, setDistrict] = useState(params.get("district") || "");
  const [districts, setDistricts] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    api<{ id: string; name: string }[]>("/locations/rwanda?level=DISTRICT")
      .then(setDistricts)
      .catch(() => {});
  }, []);

  function apply(next: { maxPrice?: number; beds?: number; verified?: boolean; propType?: string; district?: string } = {}) {
    const p = new URLSearchParams(params.toString());
    const max = next.maxPrice ?? maxPrice;
    const b = next.beds ?? beds;
    const v = next.verified ?? verified;
    const pt = next.propType !== undefined ? next.propType : propType;
    const d = next.district !== undefined ? next.district : district;
    if (max > 0 && max < 5_000_000) p.set("maxPriceMinor", String(Math.round(max))); else p.delete("maxPriceMinor");
    if (b > 0) p.set("bedroomsMin", String(b)); else p.delete("bedroomsMin");
    if (v) p.set("verifiedOnly", "true"); else p.delete("verifiedOnly");
    if (pt) p.set("propertyType", pt); else p.delete("propertyType");
    if (d) p.set("district", d); else p.delete("district");
    router.replace(pathname + (p.toString() ? "?" + p.toString() : ""), { scroll: false });
  }

  function clear() {
    setMaxPrice(5_000_000); setBeds(0); setVerified(false); setPropType(""); setDistrict("");
    const p = new URLSearchParams(params.toString());
    ["maxPriceMinor", "bedroomsMin", "verifiedOnly", "propertyType", "district"].forEach(k => p.delete(k));
    router.replace(pathname + (p.toString() ? "?" + p.toString() : ""), { scroll: false });
  }

  const hasFilters = beds > 0 || maxPrice < 5_000_000 || verified || propType || district;
  const fmt = (n: number) => new Intl.NumberFormat("en-RW", { style: "currency", currency: "RWF", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-glass)] shadow-[var(--shadow-2)] backdrop-blur-xl overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 p-3">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(x => !x)} aria-expanded={open}>
          <SlidersHorizontal size={15} />
          {open ? "Hide filters" : "Filters"}
          <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </Button>
        {propType && <span className="badge badge-blue">{PROPERTY_TYPES.find(t => t.value === propType)?.label ?? propType}</span>}
        {district && <span className="badge badge-green">{district}</span>}
        {beds > 0 && <span className="badge badge-gray">{beds}+ beds</span>}
        {maxPrice < 5_000_000 && <span className="badge badge-gray">{fmt(maxPrice)} max</span>}
        {verified && <span className="badge badge-green"><Check size={11} /> Verified</span>}
        {hasFilters && (
          <button type="button" className="badge badge-gray hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)] transition-colors" onClick={clear}>
            <X size={11} /> Clear all
          </button>
        )}
      </div>
      {open && (
        <div id="property-filter-panel" className="grid gap-6 border-t border-[var(--color-border)] p-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {/* Property Type */}
          <div className="field-group">
            <label className="field-label">Property type</label>
            <select
              className="select-field"
              value={propType}
              onChange={e => { setPropType(e.target.value); apply({ propType: e.target.value }); }}
            >
              {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          {/* District */}
          <div className="field-group">
            <label className="field-label">District</label>
            <select
              className="select-field"
              value={district}
              onChange={e => { setDistrict(e.target.value); apply({ district: e.target.value }); }}
            >
              <option value="">All districts</option>
              {districts.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
          </div>
          {/* Bedrooms */}
          <fieldset className="min-w-0">
            <legend className="field-label">Min bedrooms</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {[0, 1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button"
                  className={"chip " + (beds === n ? "active" : "")}
                  onClick={() => { setBeds(n); apply({ beds: n }); }}>
                  {n === 0 ? "Any" : n + "+"}
                </button>
              ))}
            </div>
          </fieldset>
          {/* Price */}
          <div className="field-group">
            <label className="field-label">Max price</label>
            <Slider min={100_000} max={5_000_000} step={50_000} value={[maxPrice]}
              onValueChange={(v: number[]) => setMaxPrice(v[0] ?? maxPrice)}
              onValueCommit={(v: number[]) => apply({ maxPrice: v[0] ?? maxPrice })} />
            <span className="field-hint mt-2">{fmt(maxPrice)}</span>
          </div>
          {/* Verified */}
          <label className="field-group flex-row items-center gap-3 cursor-pointer">
            <Switch checked={verified} onCheckedChange={v => { setVerified(v); apply({ verified: v }); }} />
            <div>
              <div className="field-label">Verified only</div>
              <div className="field-hint">RDB-verified listings</div>
            </div>
          </label>
        </div>
      )}
    </div>
  );
}
