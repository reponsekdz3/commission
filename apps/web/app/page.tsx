import Link from "next/link";
import { api, formatRwf } from "../lib/api";

type SearchResponse = {
  items: Array<{
    score: number;
    distanceMeters?: number;
    listing: { id: string; listingType: string; priceMinor: number; currency: string };
    property: {
      id: string;
      title: string;
      district: string;
      bedrooms?: number;
      bathrooms?: number;
      parking?: number;
      verificationStatus: string;
      media: Array<{ url: string }>;
      amenities: string[];
    };
  }>;
};

export default async function HomePage() {
  const nearby = await api<SearchResponse>("/search?listingType=RENT&limit=8");
  return (
    <main>
      <section className="wrap hero">
        <p className="badge">Rwanda · RWF · Kinyarwanda / English / French</p>
        <h1>Where do you want to live?</h1>
        <p>
          Search verified homes, land, and commercial space. Book viewings, rent with MoMo, message owners, and run the building after the keys change hands.
        </p>
        <form className="searchbox" action="/search">
          <input name="q" placeholder="3 bedroom near Kicukiro" />
          <select name="listingType" defaultValue="RENT">
            <option value="RENT">Rent</option>
            <option value="SALE">Buy</option>
            <option value="SHORT_STAY">Short stay</option>
          </select>
          <select name="district" defaultValue="">
            <option value="">All districts</option>
            <option>Kicukiro</option>
            <option>Gasabo</option>
            <option>Nyarugenge</option>
            <option>Musanze</option>
            <option>Rubavu</option>
            <option>Huye</option>
          </select>
          <button type="submit">Search</button>
        </form>
        <div className="modes">
          <Link href="/map">See on map →</Link>
        </div>
      </section>
      <section className="wrap">
        <h2>Nearby properties</h2>
        <div className="grid">
          {nearby.items.map((item) => (
            <Link key={item.listing.id} href={`/properties/${item.property.id}`} className="card">
              <img src={item.property.media[0]?.url} alt="" />
              <div className="meta">
                <div className="badge">{item.property.verificationStatus === "VERIFIED" ? "Verified" : "Listed"}</div>
                <strong>{item.property.title}</strong>
                <div className="muted">{item.property.district} · {item.property.bedrooms ?? "—"} bed · {item.property.bathrooms ?? "—"} bath</div>
                <div className="price">{formatRwf(item.listing.priceMinor)}{item.listing.listingType === "RENT" ? "/month" : ""}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <footer className="wrap">
        <div>Imizi is a property operating system, not a classifieds wall.</div>
        <div><Link href="/legal/privacy">Privacy</Link> · <Link href="/legal/terms">Terms</Link> · Currency always stored with ISO code.</div>
      </footer>
    </main>
  );
}
