import Link from "next/link";
import { AppImage } from "../components/app-image";
import { api, formatRwf } from "../lib/api";
import { MapPin, BedDouble, Bath, CheckCircle, ArrowRight, Search, Map, Building2, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

type R = { items: any[] };

const TYPE_LABELS: Record<string, string> = {
  HOUSE: "House", APARTMENT: "Apartment", APARTMENT_BUILDING: "Apt Building",
  VILLA: "Villa", LAND: "Land", SHOP: "Shop", WAREHOUSE: "Warehouse",
};

export default async function Home() {
  let data: R = { items: [] };
  try { data = await api<R>("/search?listingType=RENT&limit=8"); } catch {}
  let districts: { id: string; name: string }[] = [];
  try { districts = await api<{ id: string; name: string }[]>("/locations/rwanda?level=DISTRICT"); } catch { districts = []; }

  return (
    <main className="homePage">
      {/* ── Hero ── */}
      <section className="wrap homeHero">
        <div className="heroGlow heroGlowOne" />
        <div className="heroGlow heroGlowTwo" />
        <div style={{ maxWidth: 860 }}>
          <div className="heroEyebrow" style={{ marginBottom: 20 }}>
            <span className="statusDot" />
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".1em", color: "var(--color-fg-muted)" }}>RWANDA&apos;S PROPERTY MARKETPLACE</span>
          </div>
          <h1 style={{ fontSize: "clamp(3.2rem,7.5vw,7rem)", fontWeight: 900, letterSpacing: "-.065em", lineHeight: 1.02, margin: "0 0 18px" }}>
            Find a place that fits your life.
          </h1>
          <p className="lead" style={{ marginBottom: 32 }}>
            Search verified homes, land and commercial spaces across Rwanda. Book viewings, make offers, pay securely and manage your property from one connected platform.
          </p>

          {/* Search bar */}
          <form className="searchbox" action="/search">
            <input className="field" name="q" placeholder='Try "3 bedroom near Kigali CBD"' aria-label="Search properties" />
            <select className="field" name="listingType" defaultValue="RENT">
              <option value="RENT">For rent</option>
              <option value="SALE">For sale</option>
              <option value="SHORT_STAY">Short stay</option>
            </select>
            <select className="field" name="propertyType" defaultValue="">
              <option value="">Any type</option>
              <option value="HOUSE">House</option>
              <option value="APARTMENT">Apartment</option>
              <option value="VILLA">Villa</option>
              <option value="LAND">Land</option>
              <option value="SHOP">Shop</option>
            </select>
            <button className="btn" style={{ whiteSpace: "nowrap" }}>Search <ArrowRight size={16} /></button>
          </form>

          {/* Quick category chips */}
          <div className="chipRow" style={{ marginTop: 18 }}>
            {[
              ["All rentals", "/search?listingType=RENT"],
              ["Buy property", "/search?listingType=SALE"],
              ["Short stay", "/search?listingType=SHORT_STAY"],
              ["Land", "/search?propertyType=LAND"],
              ["Commercial", "/search?propertyType=COMMERCIAL"],
              ["Verified only", "/search?verifiedOnly=true"],
            ].map(([label, href]) => (
              <Link key={label} href={href} className="chip">{label}</Link>
            ))}
          </div>

          {/* Trust stats */}
          <div className="heroStats" style={{ marginTop: 28 }}>
            <span><CheckCircle size={14} style={{ color: "var(--color-primary)" }} /> <strong>Verified listings</strong></span>
            <span><Map size={14} style={{ color: "var(--color-primary)" }} /> <strong>Live map search</strong></span>
            <span><TrendingUp size={14} style={{ color: "var(--color-primary)" }} /> <strong>Real bookings &amp; payments</strong></span>
            <span><Building2 size={14} style={{ color: "var(--color-primary)" }} /> <strong>RWF native pricing</strong></span>
          </div>
        </div>
      </section>

      {/* ── Quick actions ── */}
      <section className="wrap" style={{ paddingBottom: 10 }}>
        <div className="quickActions">
          {[
            { icon: "🔍", label: "Discover", sub: "Search all listings", href: "/search", accent: false },
            { icon: "🗺️", label: "Live map", sub: "Map-based search", href: "/map", accent: false },
            { icon: "📋", label: "List property", sub: "Reach thousands", href: "/manage", accent: true },
            { icon: "📊", label: "Dashboard", sub: "Manage your portfolio", href: "/dashboard", accent: false },
          ].map(item => (
            <Link key={item.label} href={item.href} className={"quickAction " + (item.accent ? "accent" : "")}>
              <span>{item.icon}</span>
              <strong style={{ fontSize: 14, fontWeight: 900 }}>{item.label}</strong>
              <small>{item.sub}</small>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Districts ── */}
      {districts.length > 0 && (
        <section className="wrap section" style={{ paddingTop: 48, paddingBottom: 24 }}>
          <div className="sectionLabel" style={{ marginBottom: 20 }}>
            <div>
              <div className="eyebrow">Explore Rwanda</div>
              <h2 style={{ margin: "6px 0 0" }}>Search by district</h2>
            </div>
            <Link href="/map" className="btn ghost">Open live map <ArrowRight size={14} /></Link>
          </div>
          <div className="districtRail">
            {districts.slice(0, 12).map(d => (
              <Link key={d.id} href={"/search?district=" + encodeURIComponent(d.name)} className="districtCard">
                <span><MapPin size={16} /></span>
                <strong style={{ fontWeight: 800, fontSize: 14 }}>{d.name}</strong>
                <small>Browse listings</small>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Featured listings ── */}
      <section className="wrap section">
        <div className="sectionHead" style={{ marginBottom: 8 }}>
          <div>
            <div className="eyebrow">Live inventory</div>
            <h2 style={{ margin: "6px 0 4px" }}>Featured homes</h2>
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>Real results returned by the backend search engine.</p>
          </div>
          <Link href="/search" className="btn ghost">View all listings <ArrowRight size={14} /></Link>
        </div>

        {data.items.length > 0 ? (
          <div className="grid">
            {data.items.map((x: any) => (
              <Link className="card block" href={"/properties/" + x.property.id} key={x.listing.id}>
                <div style={{ position: "relative", aspectRatio: "4/3", overflow: "hidden" }}>
                  {x.property.media?.[0]?.url
                    ? <AppImage className="cardImg" src={x.property.media[0].url} alt={x.property.title} fill sizes="(max-width:768px) 100vw, 25vw" style={{ objectFit: "cover" }} />
                    : <div className="cardImg" style={{ background: "var(--color-surface-3)", display: "grid", placeItems: "center", color: "var(--color-fg-muted)", fontSize: 13 }}>No media</div>
                  }
                  {x.property.verificationStatus === "VERIFIED" && (
                    <span style={{ position: "absolute", top: 10, left: 10, display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,.9)", borderRadius: 999, padding: "4px 9px", fontSize: 11, fontWeight: 800, color: "#065f46" }}>
                      <CheckCircle size={12} /> Verified
                    </span>
                  )}
                  {x.property.propertyType && (
                    <span style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,.65)", borderRadius: 999, padding: "4px 9px", fontSize: 11, fontWeight: 800, color: "#fff" }}>
                      {TYPE_LABELS[x.property.propertyType] ?? x.property.propertyType}
                    </span>
                  )}
                </div>
                <div className="cardBody">
                  <div className="price">{formatRwf(x.listing.priceMinor)}<span className="muted" style={{ fontSize: 13, fontWeight: 600 }}>{x.listing.listingType === "RENT" ? " /mo" : x.listing.listingType === "SHORT_STAY" ? " /night" : ""}</span></div>
                  <div style={{ fontWeight: 800, marginTop: 6, lineHeight: 1.3 }} className="line-clamp-2">{x.property.title}</div>
                  <div className="meta" style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={11} />{x.property.district}</div>
                  <div className="meta" style={{ display: "flex", gap: 12, marginTop: 6, borderTop: "1px solid var(--color-border)", paddingTop: 8 }}>
                    {x.property.bedrooms != null && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><BedDouble size={12} />{x.property.bedrooms}</span>}
                    {x.property.bathrooms != null && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Bath size={12} />{x.property.bathrooms}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty" style={{ marginTop: 24 }}>
            <Search size={32} style={{ color: "var(--color-fg-subtle)", margin: "0 auto 12px", display: "block" }} />
            <h3 style={{ margin: "0 0 8px" }}>No live listings yet</h3>
            <p style={{ margin: "0 0 20px", color: "var(--color-fg-muted)" }}>The API returned no published active inventory right now.</p>
            <Link className="btn" href="/manage">List a property</Link>
          </div>
        )}
      </section>

      {/* ── For seekers / owners CTA ── */}
      <section className="wrap section" style={{ paddingTop: 0 }}>
        <div className="trustPanel">
          <div>
            <div className="eyebrow">One platform</div>
            <h2 style={{ fontSize: "clamp(1.6rem,4vw,2.6rem)", letterSpacing: "-.04em" }}>From discovery to keys — and beyond.</h2>
          </div>
          <div className="trustItems">
            {["Search & compare", "Book viewings", "Make offers", "Pay securely", "Sign leases", "Manage maintenance"].map(x => (
              <span key={x}>{x}</span>
            ))}
          </div>
        </div>
        <div className="two" style={{ gap: 16 }}>
          <div className="panel featurePanel">
            <div className="eyebrow">For seekers</div>
            <h2 style={{ fontSize: "clamp(1.4rem,3vw,2rem)", letterSpacing: "-.04em", margin: "10px 0 8px" }}>From discovery to keys.</h2>
            <p className="muted">Search, compare, save, message owners, request a viewing, book and pay — all connected to one account.</p>
            <div className="featureSteps">
              {["Search", "Save", "View", "Book", "Pay"].map(s => <span key={s}>{s}</span>)}
            </div>
            <div className="actions" style={{ marginTop: 16 }}>
              <Link className="btn" href="/search">Start exploring</Link>
              <Link className="btn ghost" href="/compare">Compare homes</Link>
            </div>
          </div>
          <div className="panel featurePanel owner">
            <div className="eyebrow">For owners</div>
            <h2 style={{ fontSize: "clamp(1.4rem,3vw,2rem)", letterSpacing: "-.04em", margin: "10px 0 8px" }}>Operate your portfolio.</h2>
            <p className="muted">Create listings, publish when eligible, track bookings, leases, maintenance, payments and performance.</p>
            <div className="featureSteps">
              {["List", "Verify", "Publish", "Earn", "Track"].map(s => <span key={s}>{s}</span>)}
            </div>
            <div className="actions" style={{ marginTop: 16 }}>
              <Link className="btn" href="/dashboard">Open dashboard</Link>
              <Link className="btn ghost" href="/manage">List a property</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="wrap footer">
        <strong>IMIZI</strong> · Property discovery, transactions and operations · Rwanda ·{" "}
        <Link href="/legal">Legal &amp; privacy</Link>
      </footer>
    </main>
  );
}
