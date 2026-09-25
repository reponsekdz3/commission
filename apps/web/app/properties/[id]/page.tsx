import { api, formatRwf } from "../../../lib/api";
import { BookingPanel } from "./booking-panel";

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await api<any>(`/properties/${id}`);
  const nearby = await api<any[]>(`/maps/nearby?lat=${property.latitude}&lng=${property.longitude}`);
  const listing = property.listings?.[0];
  return (
    <main className="wrap" style={{ paddingTop: 20 }}>
      <div className="gallery">
        <img src={property.media?.[0]?.url} alt="" />
        <div>
          {property.media?.slice(1, 3).map((m: any) => (
            <img key={m.id} src={m.url} alt="" style={{ height: 206, marginBottom: 8, objectFit: "cover", width: "100%" }} />
          ))}
        </div>
      </div>
      <p className="muted">{property.media?.length ?? 0} photos · Video · 360°</p>
      <div className="split">
        <article>
          <div className="badge">{property.verificationStatus === "VERIFIED" ? "Verified property" : "Unverified"} · Owner verified when the evidence trail is complete — this badge is not a legal title guarantee.</div>
          <h1>{property.title}</h1>
          <p>{property.district}, {property.province}</p>
          <h2>{listing ? formatRwf(listing.priceMinor) : ""} {listing?.listingType === "RENT" ? "/ month" : ""}</h2>
          <p>{property.bedrooms ?? "—"} Bedrooms · {property.bathrooms ?? "—"} Bathrooms · {property.parking ?? "—"} Parking</p>
          <p>{property.amenities?.map((a: string) => `${a} ✓`).join("   ")}</p>
          <h3>Description</h3>
          <p>{property.description}</p>
          <h3>Location</h3>
          <p>{property.sector} · {property.district} · {property.province} · {property.countryCode}</p>
          <h3>Nearby</h3>
          <ul>
            {nearby.slice(0, 5).map((p: any) => (
              <li key={p.id}>{p.name} · {p.distanceMeters}m</li>
            ))}
          </ul>
          {property.units?.length > 0 && (
            <>
              <h3>Units</h3>
              <p>{property.units.map((u: any) => u.label).join(", ")}</p>
            </>
          )}
          {property.listings?.length > 1 && (
            <>
              <h3>Listings on this property</h3>
              {property.listings.map((l: any) => (
                <p key={l.id}>{l.listingType}: {formatRwf(l.priceMinor)}</p>
              ))}
            </>
          )}
        </article>
        <aside className="panel">
          <h3>Owner</h3>
          <p className="muted">Chat, call, book a viewing, or start a rental. Payments are confirmed by the provider webhook, not the phone.</p>
          {listing && <BookingPanel listingId={listing.id} propertyId={property.id} listingType={listing.listingType} landlordId={property.ownerId} />}
        </aside>
      </div>
    </main>
  );
}
