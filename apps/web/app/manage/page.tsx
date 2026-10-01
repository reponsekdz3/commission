"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, RefreshCw, Home, ArrowLeft, Eye } from "lucide-react";
import { authApi } from "../../lib/api";
import { PropertyMediaUploader } from "../../components/media-uploader";
import { RwandaLocationPicker } from "../../components/rwanda-location-picker";
import { PropertyDescriptionEditor } from "../../components/property-description-editor";
import { EmptyState } from "../../components/empty-state";

const TYPES = ["HOUSE","APARTMENT","APARTMENT_BUILDING","VILLA","STUDIO","OFFICE","SHOP","WAREHOUSE","LAND","MIXED_USE"];

const STATUS_BADGE: Record<string, string> = {
  PUBLISHED: "badge-green", DRAFT: "badge-gray", PENDING_REVIEW: "badge-amber",
  BLOCKED: "badge-red", ARCHIVED: "badge-gray",
};

export default function Manage() {
  const [items, setItems] = useState<any[]>([]);
  const [err, setErr]     = useState("");
  const [busy, setBusy]   = useState(false);
  const [f, setF] = useState<any>({
    title:"", description:"", propertyType:"HOUSE",
    province:"", district:"", sector:"", cell:"", village:"",
    provinceId:"", districtId:"", sectorId:"", cellId:"", villageId:"",
    latitude:"", longitude:"",
    bedrooms:"", bathrooms:"", parking:"0", areaValue:"", areaUnit:"SQM", amenities:"",
  });
  const [l, setL] = useState<any>({
    propertyId:"", listingType:"RENT", priceMinor:"", currency:"RWF",
    availableFrom: new Date().toISOString().slice(0, 16),
  });

  async function load() {
    try { setItems(await authApi<any[]>("/properties/owned")); }
    catch (e: any) { setErr(e.message); }
  }
  useEffect(() => { void load(); }, []);

  const set = (k: string, v: string) => setF((x: any) => ({ ...x, [k]: v }));

  async function create(e: any) {
    e.preventDefault();
    if (!f.latitude || !f.longitude || !f.provinceId || !f.districtId || !f.sectorId || !f.cellId) {
      setErr("Province, District, Sector, Cell and exact map coordinates are required."); return;
    }
    setBusy(true); setErr("");
    try {
      const p = await authApi<any>("/properties", { method: "POST", body: JSON.stringify({
        ...f, latitude: Number(f.latitude), longitude: Number(f.longitude),
        bedrooms: Number(f.bedrooms), bathrooms: Number(f.bathrooms), parking: Number(f.parking),
        areaValue: f.areaValue ? Number(f.areaValue) : undefined,
        amenities: f.amenities.split(",").map((x: string) => x.trim()).filter(Boolean),
      }) });
      setItems(x => [p, ...x]);
      setL((x: any) => ({ ...x, propertyId: p.id }));
      setErr("Property created. Continue with a listing.");
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  async function listing(e: any) {
    e.preventDefault(); setBusy(true);
    try {
      await authApi("/listings", { method: "POST", body: JSON.stringify({
        ...l, priceMinor: Number(l.priceMinor),
        availableFrom: new Date(l.availableFrom).toISOString(),
      }) });
      await load(); setErr("Listing created successfully.");
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  async function publish(id: string) {
    try { await authApi("/properties/" + id + "/publish", { method: "POST" }); await load(); }
    catch (e: any) { setErr(e.message); }
  }

  return (
    <main className="wrap section">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <div className="eyebrow mb-2">Inventory studio</div>
          <h1 className="text-[clamp(2rem,5vw,3.2rem)] font-[900] tracking-[-0.05em] leading-tight mb-2">
            List &amp; operate property.
          </h1>
          <p className="text-[var(--color-fg-muted)] text-[15px] max-w-xl">
            Create real property records, rich descriptions, price inventory and publish through backend-controlled rules.
          </p>
        </div>
        <Link href="/dashboard" className="btn ghost flex items-center gap-2 flex-shrink-0">
          <ArrowLeft size={15} /> Dashboard
        </Link>
      </div>

      {err && (
        <div className={`alert ${err.includes("created") || err.includes("successfully") ? "alert-info" : "alert-error"} mb-6`}>
          {err}
        </div>
      )}

      {/* Create forms */}
      <div className="grid gap-6 lg:grid-cols-2 mb-10">
        {/* Step 1: Property */}
        <form className="panel flex flex-col gap-5" onSubmit={create}>
          <div>
            <div className="eyebrow mb-1">Step 01</div>
            <h2 className="text-xl font-[800] tracking-[-0.03em]">Property details</h2>
            <p className="text-sm text-[var(--color-fg-muted)] mt-1">Create the base property record.</p>
          </div>

          <div className="field-group">
            <label className="field-label">Property title</label>
            <input className="field" placeholder="e.g. Modern house in Kicukiro" value={f.title} onChange={e => set("title", e.target.value)} required />
          </div>

          <div className="field-group">
            <label className="field-label">Description</label>
            <PropertyDescriptionEditor value={f.description} onChange={(v: any) => set("description", v)} />
          </div>

          <div className="field-group">
            <label className="field-label">Property type</label>
            <select className="field" value={f.propertyType} onChange={e => set("propertyType", e.target.value)}>
              {TYPES.map(x => <option key={x}>{x}</option>)}
            </select>
          </div>

          <div className="field-group">
            <label className="field-label">Rwanda location</label>
            <RwandaLocationPicker value={f} onChange={(v: any) => setF((x: any) => ({ ...x, ...v }))} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="field-group">
              <label className="field-label">Latitude</label>
              <input className="field" type="number" step="any" placeholder="-1.94" value={f.latitude} onChange={e => set("latitude", e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">Longitude</label>
              <input className="field" type="number" step="any" placeholder="30.06" value={f.longitude} onChange={e => set("longitude", e.target.value)} />
            </div>
            <div className="field-group">
              <label className="field-label">Area (sqm)</label>
              <input className="field" placeholder="120" value={f.areaValue} onChange={e => set("areaValue", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[["Bedrooms","bedrooms"],["Bathrooms","bathrooms"],["Parking","parking"]].map(([label, key]) => (
              <div key={key} className="field-group">
                <label className="field-label">{label}</label>
                <input className="field" type="number" min="0" value={f[key]} onChange={e => set(key, e.target.value)} />
              </div>
            ))}
          </div>

          <div className="field-group">
            <label className="field-label">Amenities</label>
            <input className="field" placeholder="Parking, Water, Security, Generator" value={f.amenities} onChange={e => set("amenities", e.target.value)} />
            <span className="field-hint">Comma-separated</span>
          </div>

          <button className="btn flex items-center gap-2 justify-center" disabled={busy}>
            {busy ? "Saving…" : <><Plus size={15} /> Create property</>}
          </button>
        </form>

        {/* Step 2: Listing */}
        <form className="panel flex flex-col gap-5" onSubmit={listing}>
          <div>
            <div className="eyebrow mb-1">Step 02</div>
            <h2 className="text-xl font-[800] tracking-[-0.03em]">Pricing &amp; availability</h2>
            <p className="text-sm text-[var(--color-fg-muted)] mt-1">Create a listing on an existing property.</p>
          </div>

          <div className="field-group">
            <label className="field-label">Property</label>
            <select className="field" value={l.propertyId} onChange={e => setL((x: any) => ({ ...x, propertyId: e.target.value }))}>
              <option value="">Select property</option>
              {items.map(p => <option value={p.id} key={p.id}>{p.title}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="field-group">
              <label className="field-label">Listing type</label>
              <select className="field" value={l.listingType} onChange={e => setL((x: any) => ({ ...x, listingType: e.target.value }))}>
                <option>RENT</option><option>SALE</option><option>SHORT_STAY</option>
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Currency</label>
              <select className="field" value={l.currency} onChange={e => setL((x: any) => ({ ...x, currency: e.target.value }))}>
                <option>RWF</option><option>USD</option><option>KES</option><option>UGX</option><option>TZS</option>
              </select>
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">Price (minor units, e.g. 900000 = 900,000 RWF)</label>
            <input className="field" type="number" min="1" value={l.priceMinor} required
              onChange={e => setL((x: any) => ({ ...x, priceMinor: e.target.value }))} />
          </div>

          <div className="field-group">
            <label className="field-label">Available from</label>
            <input className="field" type="datetime-local" value={l.availableFrom}
              onChange={e => setL((x: any) => ({ ...x, availableFrom: e.target.value }))} />
          </div>

          <button className="btn flex items-center gap-2 justify-center" disabled={!l.propertyId || busy}>
            {busy ? "Saving…" : <><Plus size={15} /> Create listing</>}
          </button>

          <div className="panel" style={{ background: "var(--color-primary-soft)", borderColor: "var(--color-primary)" }}>
            <div className="font-[800] text-sm mb-1">Publishing rule</div>
            <p className="text-xs text-[var(--color-fg-muted)]">
              Verification, moderation and publish state remain backend-controlled. Use the Publish button in your inventory.
            </p>
          </div>
        </form>
      </div>

      {/* Inventory */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="eyebrow mb-1">Portfolio</div>
            <h2 className="text-xl font-[800] tracking-[-0.03em]">Your inventory</h2>
          </div>
          <button className="btn ghost flex items-center gap-2" onClick={() => void load()}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {items.length ? (
          <div className="flex flex-col gap-3">
            {items.map(p => (
              <div key={p.id} className="panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                    <Home size={18} />
                  </span>
                  <div className="min-w-0">
                    <Link href={"/properties/" + p.id} className="font-[800] text-sm hover:text-[var(--color-primary)] transition-colors">
                      {p.title}
                    </Link>
                    <div className="text-xs text-[var(--color-fg-muted)] mt-0.5">
                      {p.district} · {p.verificationStatus}
                    </div>
                    {p.listings?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {p.listings.map((x: any) => (
                          <span key={x.id} className="badge badge-gray text-[10px]">
                            {x.listingType} · {x.priceMinor?.toLocaleString()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                  <span className={`badge ${STATUS_BADGE[p.status] || "badge-gray"}`}>{p.status}</span>
                  <PropertyMediaUploader propertyId={p.id} />
                  <button className="btn ghost flex items-center gap-1.5 text-sm" onClick={() => void publish(p.id)}>
                    <Eye size={13} /> Publish
                  </button>
                  <Link href={"/properties/" + p.id} className="btn ghost flex items-center gap-1.5 text-sm">
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            kind="listings"
            title="No owned properties"
            description="The backend returned no inventory for this account."
          />
        )}
      </section>
    </main>
  );
}
