import Link from "next/link";
import { AppImage } from "../components/app-image";
import { api, formatRwf } from "../lib/api";
import {
  MapPin, BedDouble, Bath, CheckCircle, ArrowRight,
  Search, Map, Building2, TrendingUp, Zap, ShieldCheck,
  Star, Users, Home as HomeIcon, Calendar, CreditCard, ChevronRight,
  Sparkles, BarChart3,
} from "lucide-react";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  HOUSE: "House", APARTMENT: "Apartment", APARTMENT_BUILDING: "Apt Building",
  VILLA: "Villa", LAND: "Land", SHOP: "Shop", WAREHOUSE: "Warehouse",
  OFFICE: "Office", COMMERCIAL: "Commercial",
};

const WORKFLOW = [
  { step: "01", icon: Search,    title: "Discover",    desc: "Search verified homes, land and commercial spaces with smart filters and live map." },
  { step: "02", icon: Calendar,  title: "Book viewing", desc: "Request a viewing in seconds. Owners confirm in real time." },
  { step: "03", icon: CreditCard,title: "Pay securely", desc: "MTN MoMo and card payments with full ledger and receipts." },
  { step: "04", icon: HomeIcon,      title: "Move in",      desc: "Digital lease, maintenance requests and portfolio management — all in one place." },
];

const CAPABILITIES = [
  { icon: ShieldCheck, label: "Verified listings",    sub: "Every property checked",  accent: false },
  { icon: Map,       label: "Live map search",       sub: "PostGIS geographic data", accent: false },
  { icon: Zap,       label: "Instant bookings",      sub: "Real-time availability",  accent: true  },
  { icon: BarChart3, label: "Owner analytics",       sub: "Revenue & performance",   accent: false },
  { icon: Users,     label: "5,000+ members",        sub: "Landlords & seekers",     accent: false },
  { icon: Star,      label: "RWF native pricing",    sub: "Local currency first",    accent: false },
  { icon: TrendingUp,label: "Offers & negotiation",  sub: "Buyer-seller flow",       accent: false },
  { icon: Building2, label: "Portfolio management",  sub: "Leases & maintenance",    accent: true  },
];

export default async function HomePage() {
  let items: any[] = [];
  try { const d = await api<{ items: any[] }>("/search?listingType=RENT&limit=8"); items = d.items ?? []; } catch {}

  let saleItems: any[] = [];
  try { const d = await api<{ items: any[] }>("/search?listingType=SALE&limit=4"); saleItems = d.items ?? []; } catch {}

  let districts: { id: string; name: string }[] = [];
  try { districts = await api<{ id: string; name: string }[]>("/locations/rwanda?level=DISTRICT"); } catch {}

  return (
    <main className="hp-root">

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="hp-hero">
        <div className="hp-hero-glow hp-hero-glow-a" />
        <div className="hp-hero-glow hp-hero-glow-b" />
        <div className="wrap hp-hero-inner">
          <div className="hp-hero-copy">
            <div className="hp-eyebrow">
              <span className="hp-live-dot" />
              <span>Rwanda&apos;s #1 Property Marketplace</span>
            </div>
            <h1 className="hp-h1">
              Find a place<br />
              <span className="hp-h1-accent">that fits your life.</span>
            </h1>
            <p className="hp-lead">
              Search verified homes, land and commercial spaces across Rwanda.
              Book viewings, make offers, pay securely and manage everything from one connected account.
            </p>

            {/* Search bar */}
            <form className="hp-search" action="/search">
              <div className="hp-search-field">
                <Search size={16} className="hp-search-icon" />
                <input
                  name="q"
                  className="hp-search-input"
                  placeholder='Try "3 bedroom Kigali" or "land Musanze"'
                  aria-label="Search properties"
                />
              </div>
              <select name="listingType" className="hp-search-select" defaultValue="RENT">
                <option value="RENT">For rent</option>
                <option value="SALE">For sale</option>
                <option value="SHORT_STAY">Short stay</option>
              </select>
              <button className="hp-search-btn" type="submit">
                Search <ArrowRight size={16} />
              </button>
            </form>

            {/* Quick chips */}
            <div className="hp-chips">
              {[
                ["All rentals",    "/search?listingType=RENT"],
                ["Buy property",   "/search?listingType=SALE"],
                ["Short stay",     "/search?listingType=SHORT_STAY"],
                ["Land",           "/search?propertyType=LAND"],
                ["Verified only",  "/search?verifiedOnly=true"],
                ["Map search",     "/map"],
              ].map(([label, href]) => (
                <Link key={label} href={href} className="hp-chip">{label}</Link>
              ))}
            </div>

            {/* Trust row */}
            <div className="hp-trust">
              {[
                [CheckCircle, "Verified listings"],
                [Map,         "Live map search"],
                [TrendingUp,  "Real bookings & payments"],
                [Building2,   "RWF native pricing"],
              ].map(([Icon, label]: any) => (
                <span key={label} className="hp-trust-item">
                  <Icon size={13} /> {label}
                </span>
              ))}
            </div>
          </div>

          {/* Hero product card */}
          <div className="hp-hero-card">
            <div className="hp-card-chrome">
              <div className="hp-chrome-dots"><i /><i /><i /></div>
              <span>imizi.rw</span>
              <span className="hp-live-badge"><span className="hp-live-dot" /> Live</span>
            </div>
            <div className="hp-card-map">
              <div className="hp-map-grid" />
              <div className="hp-map-road hp-road-a" />
              <div className="hp-map-road hp-road-b" />
              <div className="hp-map-road hp-road-c" />
              <div className="hp-map-pin hp-pin-1" />
              <div className="hp-map-pin hp-pin-2" />
              <div className="hp-map-pin hp-pin-3" />
              <div className="hp-map-pin hp-pin-4" />
              <div className="hp-map-float">
                <MapPin size={16} style={{ color: "var(--color-primary)", gridRow: "span 2" }} />
                <b>Kigali CBD</b>
                <small>48 active listings</small>
              </div>
            </div>
            <div className="hp-card-stats">
              <div className="hp-mini-stat">
                <small>Active listings</small>
                <strong>{items.length + saleItems.length || "—"}</strong>
                <span>Live now</span>
              </div>
              <div className="hp-mini-stat">
                <small>Districts</small>
                <strong>{districts.length || "30"}</strong>
                <span>Covered</span>
              </div>
              <div className="hp-mini-action">
                <Zap size={18} />
                <b>Instant booking</b>
                <span>Confirm in seconds</span>
              </div>
            </div>
            <div className="hp-card-footer">
              <span><CheckCircle size={12} /> Verified</span>
              <span><Map size={12} /> PostGIS maps</span>
              <span><CreditCard size={12} /> MTN MoMo</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          QUICK ACTIONS
      ══════════════════════════════════════════ */}
      <section className="wrap hp-section" style={{ paddingTop: 0, paddingBottom: 16 }}>
        <div className="hp-actions">
          {[
            { icon: Search,    label: "Discover",       sub: "Search all listings",   href: "/search",    accent: false },
            { icon: Map,       label: "Live map",        sub: "Map-based search",      href: "/map",       accent: false },
            { icon: Building2, label: "List property",   sub: "Reach thousands",       href: "/manage",    accent: true  },
            { icon: BarChart3, label: "Dashboard",       sub: "Manage your portfolio", href: "/dashboard", accent: false },
          ].map(({ icon: Icon, label, sub, href, accent }) => (
            <Link key={label} href={href} className={`hp-action-card${accent ? " hp-action-accent" : ""}`}>
              <span className="hp-action-icon"><Icon size={20} /></span>
              <strong>{label}</strong>
              <small>{sub}</small>
              <ChevronRight size={14} className="hp-action-arrow" />
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CAPABILITIES STRIP
      ══════════════════════════════════════════ */}
      <section className="wrap hp-section" style={{ paddingTop: 8, paddingBottom: 32 }}>
        <div className="hp-caps">
          {CAPABILITIES.map(({ icon: Icon, label, sub, accent }) => (
            <div key={label} className={`hp-cap${accent ? " hp-cap-accent" : ""}`}>
              <span className="hp-cap-icon"><Icon size={16} /></span>
              <span className="hp-cap-body">
                <b>{label}</b>
                <small>{sub}</small>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          DISTRICTS
      ══════════════════════════════════════════ */}
      {districts.length > 0 && (
        <section className="wrap hp-section">
          <div className="hp-section-head">
            <div>
              <div className="eyebrow">Explore Rwanda</div>
              <h2 className="hp-section-title">Search by district</h2>
            </div>
            <Link href="/map" className="btn ghost hp-see-all">
              Open live map <ArrowRight size={14} />
            </Link>
          </div>
          <div className="hp-districts">
            {districts.slice(0, 12).map((d, i) => (
              <Link key={d.id} href={"/search?district=" + encodeURIComponent(d.name)} className="hp-district-card">
                <span className="hp-district-idx">{String(i + 1).padStart(2, "0")}</span>
                <span className="hp-district-body">
                  <b>{d.name}</b>
                  <small>Browse listings</small>
                </span>
                <ChevronRight size={14} className="hp-district-arrow" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          FEATURED RENTALS
      ══════════════════════════════════════════ */}
      <section className="wrap hp-section">
        <div className="hp-section-head">
          <div>
            <div className="eyebrow">Live inventory</div>
            <h2 className="hp-section-title">Featured rentals</h2>
            <p className="hp-section-sub">Real results from the backend search engine — updated live.</p>
          </div>
          <Link href="/search?listingType=RENT" className="btn ghost hp-see-all">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {items.length > 0 ? (
          <div className="hp-grid">
            {items.map((x: any) => (
              <Link key={x.listing.id} href={"/properties/" + x.property.id} className="hp-prop-card">
                <div className="hp-prop-media">
                  {x.property.media?.[0]?.url
                    ? <AppImage src={x.property.media[0].url} alt={x.property.title} fill sizes="(max-width:640px) 100vw,(max-width:1024px) 50vw,25vw" className="hp-prop-img" />
                    : <div className="hp-prop-no-media"><Building2 size={28} /><span>No media</span></div>
                  }
                  <div className="hp-prop-badges">
                    {x.property.verificationStatus === "VERIFIED" && (
                      <span className="hp-badge-verified"><CheckCircle size={11} /> Verified</span>
                    )}
                    {x.property.propertyType && (
                      <span className="hp-badge-type">{TYPE_LABELS[x.property.propertyType] ?? x.property.propertyType}</span>
                    )}
                  </div>
                  <div className="hp-prop-overlay" />
                </div>
                <div className="hp-prop-body">
                  <div className="hp-prop-location">
                    <MapPin size={10} /> {x.property.district || "Rwanda"}
                  </div>
                  <div className="hp-prop-title">{x.property.title}</div>
                  <div className="hp-prop-price">
                    {formatRwf(x.listing.priceMinor)}
                    <small>{x.listing.listingType === "RENT" ? " /mo" : x.listing.listingType === "SHORT_STAY" ? " /night" : ""}</small>
                  </div>
                  <div className="hp-prop-specs">
                    {x.property.bedrooms != null && <span><BedDouble size={11} /> {x.property.bedrooms} bd</span>}
                    {x.property.bathrooms != null && <span><Bath size={11} /> {x.property.bathrooms} ba</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="hp-empty">
            <Search size={36} />
            <h3>No live listings yet</h3>
            <p>The API returned no published active inventory right now.</p>
            <Link className="btn" href="/manage">List a property</Link>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════
          FOR SALE (if any)
      ══════════════════════════════════════════ */}
      {saleItems.length > 0 && (
        <section className="wrap hp-section" style={{ paddingTop: 0 }}>
          <div className="hp-section-head">
            <div>
              <div className="eyebrow">Buy property</div>
              <h2 className="hp-section-title">Properties for sale</h2>
            </div>
            <Link href="/search?listingType=SALE" className="btn ghost hp-see-all">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="hp-grid hp-grid-4">
            {saleItems.map((x: any) => (
              <Link key={x.listing.id} href={"/properties/" + x.property.id} className="hp-prop-card">
                <div className="hp-prop-media">
                  {x.property.media?.[0]?.url
                    ? <AppImage src={x.property.media[0].url} alt={x.property.title} fill sizes="(max-width:640px) 100vw,25vw" className="hp-prop-img" />
                    : <div className="hp-prop-no-media"><Building2 size={28} /><span>No media</span></div>
                  }
                  <div className="hp-prop-badges">
                    {x.property.verificationStatus === "VERIFIED" && (
                      <span className="hp-badge-verified"><CheckCircle size={11} /> Verified</span>
                    )}
                    <span className="hp-badge-sale">For sale</span>
                  </div>
                  <div className="hp-prop-overlay" />
                </div>
                <div className="hp-prop-body">
                  <div className="hp-prop-location"><MapPin size={10} /> {x.property.district || "Rwanda"}</div>
                  <div className="hp-prop-title">{x.property.title}</div>
                  <div className="hp-prop-price">{formatRwf(x.listing.priceMinor)}</div>
                  <div className="hp-prop-specs">
                    {x.property.bedrooms != null && <span><BedDouble size={11} /> {x.property.bedrooms} bd</span>}
                    {x.property.bathrooms != null && <span><Bath size={11} /> {x.property.bathrooms} ba</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════ */}
      <section className="wrap hp-section hp-workflow-section">
        <div className="hp-section-head">
          <div>
            <div className="eyebrow">How it works</div>
            <h2 className="hp-section-title">From search to keys in 4 steps.</h2>
          </div>
          <p className="hp-section-sub" style={{ maxWidth: 380 }}>
            One connected journey — no switching between apps or platforms.
          </p>
        </div>
        <div className="hp-workflow">
          {WORKFLOW.map(({ step, icon: Icon, title, desc }) => (
            <div key={step} className="hp-workflow-card">
              <span className="hp-workflow-step">{step}</span>
              <Icon size={26} className="hp-workflow-icon" />
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          DUAL CTA — SEEKERS + OWNERS
      ══════════════════════════════════════════ */}
      <section className="wrap hp-section" style={{ paddingTop: 0 }}>
        <div className="hp-dual">
          <div className="hp-dual-card hp-dual-seeker">
            <div className="hp-dual-glow" />
            <div className="eyebrow" style={{ color: "#a7f3d0" }}>For seekers</div>
            <h2 className="hp-dual-title">From discovery to keys.</h2>
            <p className="hp-dual-sub">
              Search, compare, save, message owners, request a viewing, book and pay — all connected to one account.
            </p>
            <div className="hp-dual-steps">
              {["Search", "Save", "View", "Book", "Pay"].map(s => <span key={s}>{s}</span>)}
            </div>
            <div className="hp-dual-actions">
              <Link className="btn" style={{ background: "#fff", color: "#064E3B" }} href="/search">Start exploring</Link>
              <Link className="btn" style={{ background: "rgba(255,255,255,.1)", color: "#fff", border: "1px solid rgba(255,255,255,.22)" }} href="/compare">Compare homes</Link>
            </div>
          </div>
          <div className="hp-dual-card hp-dual-owner">
            <div className="hp-dual-glow hp-dual-glow-amber" />
            <div className="eyebrow" style={{ color: "var(--color-accent-text)" }}>For owners</div>
            <h2 className="hp-dual-title" style={{ color: "var(--color-fg)" }}>Operate your portfolio.</h2>
            <p className="hp-dual-sub" style={{ color: "var(--color-fg-muted)" }}>
              Create listings, publish when eligible, track bookings, leases, maintenance, payments and performance.
            </p>
            <div className="hp-dual-steps hp-dual-steps-amber">
              {["List", "Verify", "Publish", "Earn", "Track"].map(s => <span key={s}>{s}</span>)}
            </div>
            <div className="hp-dual-actions">
              <Link className="btn" href="/dashboard">Open dashboard</Link>
              <Link className="btn ghost" href="/manage">List a property</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          OWNER BANNER
      ══════════════════════════════════════════ */}
      <section className="wrap hp-section" style={{ paddingTop: 0 }}>
        <div className="hp-owner-banner">
          <div className="hp-owner-glow" />
          <div className="hp-owner-copy">
            <div className="eyebrow" style={{ color: "#a7f3d0" }}>
              <Sparkles size={12} /> Ready to list?
            </div>
            <h2 className="hp-owner-title">
              Reach thousands of verified seekers across Rwanda.
            </h2>
            <p className="hp-owner-sub">
              Free to list. Publish in minutes. Manage bookings, leases and payments from your dashboard.
            </p>
          </div>
          <div className="hp-owner-actions">
            <Link className="btn" style={{ background: "#fff", color: "#064E3B", fontWeight: 800 }} href="/manage">
              List a property <ArrowRight size={15} />
            </Link>
            <Link className="btn" style={{ background: "rgba(255,255,255,.1)", color: "#fff", border: "1px solid rgba(255,255,255,.22)" }} href="/dashboard">
              View dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer className="wrap hp-footer">
        <div className="hp-footer-brand">
          <span className="hp-footer-logo"><Building2 size={16} /></span>
          <strong>IMIZI</strong>
          <span className="hp-footer-tag">Rwanda</span>
        </div>
        <p className="hp-footer-desc">
          Property discovery, transactions and operations across Rwanda.
        </p>
        <div className="hp-footer-links">
          {[
            ["/search",    "Search"],
            ["/map",       "Map"],
            ["/dashboard", "Dashboard"],
            ["/manage",    "List property"],
            ["/legal",     "Legal & privacy"],
          ].map(([href, label]) => (
            <Link key={href} href={href}>{label}</Link>
          ))}
        </div>
        <div className="hp-footer-bottom">
          <span>© {new Date().getFullYear()} Imizi. All rights reserved.</span>
          <span>Built for Rwanda 🇷🇼</span>
        </div>
      </footer>
    </main>
  );
}
