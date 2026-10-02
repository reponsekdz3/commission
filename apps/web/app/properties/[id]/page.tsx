import type { Metadata } from "next";
import { api, formatRwf } from "../../../lib/api";
import { PropertyGallery, AmenityList, PropertyMap } from "../../../components/property";
import { BookingPanel } from "../../../components/property/booking-panel";
import { ImmersiveTour } from "../../../components/immersive-tour";
import { TransitionLink } from "../../../components/transition-link";
import DOMPurify from "isomorphic-dompurify";
import { MapPin, BedDouble, Bath, Car, Maximize2, ShieldCheck, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

type Media = { id: string; url: string; kind?: string };
type Property = {
  id: string; title: string; description?: string; propertyType?: string;
  verificationStatus?: string; sector?: string; district?: string;
  province?: string; countryCode?: string; bedrooms?: number; bathrooms?: number;
  parking?: number; areaValue?: number; areaUnit?: string; amenities?: string[];
  latitude?: number; longitude?: number; media?: Media[];
  listings?: { id: string; priceMinor: number; listingType: string }[];
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    const p = await api<Property>("/properties/" + id);
    return {
      title: p.title,
      description: p.description?.replace(/<[^>]+>/g, " ").slice(0, 160),
      openGraph: {
        title: p.title,
        description: p.description?.replace(/<[^>]+>/g, " ").slice(0, 160),
        images: [{ url: "/properties/" + id + "/opengraph-image", width: 1200, height: 630, alt: p.title }],
      },
    };
  } catch { return { title: "Property" }; }
}

export default async function Property({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let p: Property;
  try { p = await api<Property>("/properties/" + id); }
  catch (e) {
    return (
      <main className="wrap section">
        <div className="notice error">{e instanceof Error ? e.message : "Property unavailable"}</div>
      </main>
    );
  }

  const l = p.listings?.[0];
  const media = (p.media ?? []).filter((m): m is Media => Boolean(m.url));

  const SPECS = [
    { icon: BedDouble, label: "Beds",    val: p.bedrooms },
    { icon: Bath,      label: "Baths",   val: p.bathrooms },
    { icon: Car,       label: "Parking", val: p.parking },
    { icon: Maximize2, label: "Area",    val: p.areaValue != null ? `${p.areaValue} ${p.areaUnit ?? ""}`.trim() : undefined },
  ];

  return (
    <main className="print-page">
      {/* Back */}
      <div className="wrap" style={{ paddingTop: 20 }}>
        <TransitionLink href="/search" className="breadcrumb-modern print-hidden">
          <ArrowLeft size={14} /> Back to search
        </TransitionLink>
      </div>

      {/* Gallery */}
      <div className="wrap" style={{ marginTop: 16 }}>
        <PropertyGallery media={media} transitionId={p.id} />
      </div>

      {/* Body */}
      <div className="wrap layout">
        {/* ── Article ── */}
        <article>
          {/* Badges */}
          <div className="row-gap" style={{ marginTop: 8 }}>
            <span className={`badge ${p.verificationStatus === "VERIFIED" ? "badge-green" : "badge-gray"}`}>
              {p.verificationStatus === "VERIFIED" ? <><ShieldCheck size={11} /> Verified</> : "Listed"}
            </span>
            {p.propertyType && <span className="badge badge-gray">{p.propertyType}</span>}
          </div>

          {/* Title */}
          <h1
            className="page-heading"
            style={{ marginTop: 14, marginBottom: 8, viewTransitionName: "property-title-" + p.id } as React.CSSProperties}
          >
            {p.title}
          </h1>

          {/* Location */}
          <div className="row-gap" style={{ color: "var(--color-fg-muted)", fontSize: 14, marginBottom: 20 }}>
            <MapPin size={14} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
            <span>{[p.sector, p.district, p.province, p.countryCode].filter(Boolean).join(", ")}</span>
          </div>

          {/* Specs */}
          <div className="spec-grid">
            {SPECS.map(({ icon: Icon, label, val }) => (
              <div key={label} className="spec-item">
                <div className="spec-icon"><Icon size={20} style={{ color: "var(--color-primary)", margin: "0 auto" }} /></div>
                <div className="spec-val">{String(val ?? "—")}</div>
                <div className="spec-lbl">{label}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          <section className="section" style={{ paddingTop: 28, paddingBottom: 28 }}>
            <h2 style={{ fontSize: "clamp(1.4rem,2.5vw,1.9rem)", fontWeight: 900, letterSpacing: "-.04em", marginBottom: 14 }}>Overview</h2>
            <div
              className="prose"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(p.description || "<p>Property details are available from the live listing.</p>") }}
            />
          </section>

          {/* Amenities */}
          {(p.amenities?.length ?? 0) > 0 && (
            <section className="section" style={{ paddingTop: 0, paddingBottom: 28 }}>
              <h2 style={{ fontSize: "clamp(1.4rem,2.5vw,1.9rem)", fontWeight: 900, letterSpacing: "-.04em", marginBottom: 14 }}>Amenities</h2>
              <AmenityList items={p.amenities ?? []} />
            </section>
          )}

          {/* 360 tour */}
          {media.some(m => m.kind === "TOUR_360") && (
            <ImmersiveTour media={media.filter(m => m.kind === "TOUR_360")} />
          )}

          {/* Map */}
          <section className="section" style={{ paddingTop: 0, paddingBottom: 28 }}>
            <h2 style={{ fontSize: "clamp(1.4rem,2.5vw,1.9rem)", fontWeight: 900, letterSpacing: "-.04em", marginBottom: 14 }}>Location</h2>
            {Number.isFinite(Number(p.latitude)) && Number.isFinite(Number(p.longitude))
              ? <PropertyMap lat={Number(p.latitude)} lng={Number(p.longitude)} />
              : <div className="empty">Location coordinates are not available.</div>
            }
          </section>
        </article>

        {/* ── Aside ── */}
        <aside className="print-hidden">
          <div className="booking-card">
            <div className="eyebrow" style={{ marginBottom: 8 }}>Take the next step</div>
            <div className="booking-price">
              {l ? formatRwf(l.priceMinor) : "Price on request"}
              {l?.listingType === "RENT" && <small> / month</small>}
            </div>
            {l
              ? <div style={{ marginTop: 20 }}><BookingPanel listingId={l.id} /></div>
              : <p className="muted" style={{ marginTop: 14, fontSize: 14 }}>Contact the listing owner for current pricing.</p>
            }
          </div>
        </aside>
      </div>

      {/* Mobile sticky bar */}
      <div className="bottomBar print-hidden">
        <strong style={{ fontSize: 18, fontWeight: 900 }}>
          {l ? formatRwf(l.priceMinor) : "Price on request"}
        </strong>
        {l && (
          <a className="btn" href={"/booking/new?listingId=" + l.id} style={{ minWidth: 120, justifyContent: "center" }}>
            Book now
          </a>
        )}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org", "@type": "RealEstateListing",
            name: p.title, description: p.description,
            url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000") + "/properties/" + p.id,
            address: { "@type": "PostalAddress", addressLocality: p.district, addressRegion: p.province, addressCountry: p.countryCode || "RW" },
            ...(Number.isFinite(Number(p.latitude)) && Number.isFinite(Number(p.longitude))
              ? { geo: { "@type": "GeoCoordinates", latitude: p.latitude, longitude: p.longitude } }
              : {}),
          }),
        }}
      />
    </main>
  );
}
