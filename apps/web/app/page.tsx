import Link from "next/link";
import { Search, MapPinned, Heart, Plus, ShieldCheck, ArrowUpRight, Building2, KeyRound, CreditCard, MessageCircle, Sparkles, ChevronRight } from "lucide-react";
import { AppImage } from "../components/app-image";
import { api, formatRwf } from "../lib/api";

export const dynamic = "force-dynamic";

type Listing = {
  listing: { id: string; priceMinor: number; listingType: string };
  property: {
    id: string;
    title: string;
    district?: string;
    bedrooms?: number;
    bathrooms?: number;
    verificationStatus?: string;
    media?: { url: string }[];
  };
};

type District = { id: string; name: string };

export default async function Home() {
  let data: { items: Listing[] } = { items: [] };
  let districts: District[] = [];
  try { data = await api<{ items: Listing[] }>("/search?listingType=RENT&limit=8"); } catch {}
  try { districts = await api<District[]>("/locations/rwanda?level=DISTRICT"); } catch {}

  const liveCount = data.items.length;
  const featured = data.items.slice(0, 4);
  const locationCards = districts.slice(0, 12);

  return (
    <main className="homePage">
      <section className="homeHero">
        <div className="heroGlow heroGlowOne" />
        <div className="heroGlow heroGlowTwo" />
        <div className="wrap heroGrid">
          <div className="heroCopy">
            <div className="eyebrow heroEyebrow"><span className="statusDot" /> Rwanda property, connected</div>
            <h1>Find the <span>right place</span>. Then do everything from one account.</h1>
            <p className="lead">
              Discover homes, land and commercial property across Rwanda. Search by location, compare listings,
              message owners, request viewings, book and pay securely.
            </p>

            <form className="heroSearchCard" action="/search">
              <div className="heroSearchInput">
                <Search size={19} />
                <input name="q" placeholder="Search Kigali, house, 3 bedrooms…" aria-label="Search properties" />
              </div>
              <select name="listingType" defaultValue="RENT" aria-label="Listing type">
                <option value="RENT">Rent</option>
                <option value="SALE">Buy</option>
                <option value="SHORT_STAY">Short stay</option>
              </select>
              <button className="heroSearchButton" type="submit"><Search size={18} /> Search</button>
            </form>

            <div className="heroQuickLinks">
              <Link href="/search?listingType=RENT" className="heroQuick active">Rent</Link>
              <Link href="/search?listingType=SALE" className="heroQuick">Buy</Link>
              <Link href="/search?listingType=SHORT_STAY" className="heroQuick">Short stay</Link>
              <Link href="/search?propertyType=LAND" className="heroQuick">Land</Link>
              <Link href="/search?propertyType=SHOP" className="heroQuick">Commercial</Link>
            </div>

            <div className="heroProof">
              <div><ShieldCheck size={16} /><span><b>Verification</b><small>Built into listings</small></span></div>
              <div><MapPinned size={16} /><span><b>Map-first</b><small>Search by area</small></span></div>
              <div><CreditCard size={16} /><span><b>RWF ready</b><small>Payments connected</small></span></div>
            </div>
          </div>

          <div className="heroProductCard">
            <div className="productChrome">
              <div className="chromeDots"><i /><i /><i /></div>
              <span>IMIZI / LIVE MARKET</span>
              <span className="liveBadge"><span className="statusDot" /> Live</span>
            </div>
            <div className="marketVisual">
              <div className="visualMap">
                <div className="mapGrid" />
                <div className="mapRoad roadA" /><div className="mapRoad roadB" /><div className="mapRoad roadC" />
                <span className="mapPin pin1" /><span className="mapPin pin2" /><span className="mapPin pin3" /><span className="mapPin pin4" />
                <div className="mapFloating"><MapPinned size={15} /><b>Explore Rwanda</b><small>Map + live listings</small></div>
              </div>
              <div className="visualSide">
                <div className="miniStat"><small>Live results</small><strong>{liveCount || "—"}</strong><span>backend search</span></div>
                <div className="miniStat"><small>Currency</small><strong>RWF</strong><span>Rwanda native</span></div>
                <div className="miniAction"><Sparkles size={16} /><b>Smart discovery</b><span>Location · price · availability</span></div>
              </div>
            </div>
            <div className="productFooter">
              <span><ShieldCheck size={15} /> Verification</span>
              <span><MessageCircle size={15} /> Messaging</span>
              <span><CreditCard size={15} /> Payments</span>
            </div>
          </div>
        </div>
      </section>

      <section className="wrap capabilityStrip">
        <Link href="/search" className="capability"><span className="capIcon"><Search size={18} /></span><span><b>Discover</b><small>Powerful filters & search</small></span><ChevronRight size={16} /></Link>
        <Link href="/map" className="capability"><span className="capIcon"><MapPinned size={18} /></span><span><b>Explore on map</b><small>Location-aware inventory</small></span><ChevronRight size={16} /></Link>
        <Link href="/messages" className="capability"><span className="capIcon"><MessageCircle size={18} /></span><span><b>Talk directly</b><small>Owner & agent messaging</small></span><ChevronRight size={16} /></Link>
        <Link href="/manage" className="capability"><span className="capIcon accent"><Plus size={18} /></span><span><b>List property</b><small>Manage your portfolio</small></span><ChevronRight size={16} /></Link>
      </section>

      <section className="wrap section homeSection">
        <div className="sectionHeadingModern">
          <div><div className="eyebrow">Rwanda at a glance</div><h2>Start with a location.</h2><p className="muted">Jump into the real location hierarchy used by the platform.</p></div>
          <Link href="/map" className="textLink">Open live map <ArrowUpRight size={16} /></Link>
        </div>
        <div className="locationGrid">
          {locationCards.map((district, index) => (
            <Link href={"/search?district=" + encodeURIComponent(district.name)} className="locationCard" key={district.id}>
              <span className="locationIndex">{String(index + 1).padStart(2, "0")}</span>
              <span><b>{district.name}</b><small>Explore listings</small></span>
              <ArrowUpRight size={15} />
            </Link>
          ))}
        </div>
      </section>

      <section className="wrap section homeSection">
        <div className="sectionHeadingModern">
          <div><div className="eyebrow">Live inventory</div><h2>Homes people can act on.</h2><p className="muted">These cards are rendered from the backend search service, not hard-coded demo records.</p></div>
          <Link href="/search" className="textLink">View all <ArrowUpRight size={16} /></Link>
        </div>
        {featured.length ? (
          <div className="modernPropertyGrid">
            {featured.map((item) => (
              <Link className="modernPropertyCard" href={"/properties/" + item.property.id} key={item.listing.id}>
                <div className="modernPropertyMedia">
                  {item.property.media?.[0]?.url
                    ? <AppImage className="cardImg" src={item.property.media[0].url} alt={item.property.title} width={720} height={480} sizes="(max-width: 900px) 50vw, 25vw" />
                    : <div className="mediaGradient"><Building2 size={32} /><span>Property media</span></div>}
                  <span className="propertyTypeBadge">{item.property.verificationStatus === "VERIFIED" ? "Verified" : "Published"}</span>
                  <span className="propertySave"><Heart size={16} /></span>
                </div>
                <div className="modernPropertyBody">
                  <div className="propertyLocation"><MapPinned size={13} /> {item.property.district || "Rwanda"}</div>
                  <h3>{item.property.title}</h3>
                  <div className="propertyMeta"><span>{item.property.bedrooms ?? "—"} beds</span><span>{item.property.bathrooms ?? "—"} baths</span><span>{item.listing.listingType === "RENT" ? "Monthly" : "For sale"}</span></div>
                  <div className="propertyBottom"><strong>{formatRwf(item.listing.priceMinor)}</strong><ArrowUpRight size={17} /></div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty modernEmpty"><Building2 size={30} /><h3>Inventory is ready for your first listings.</h3><p>The backend is connected, but it currently returned no published active rental inventory.</p><Link className="btn" href="/manage"><Plus size={16} /> Create a listing</Link></div>
        )}
      </section>

      <section className="wrap section homeSection">
        <div className="workflowHeader">
          <div><div className="eyebrow">One connected workflow</div><h2>From search to keys.</h2></div>
          <p className="muted">Every step is designed around the same property, user and transaction context.</p>
        </div>
        <div className="workflowGrid">
          <Link href="/search" className="workflowCard"><span>01</span><Search size={21} /><h3>Discover</h3><p>Filter by listing type, price, location, amenities and availability.</p></Link>
          <Link href="/compare" className="workflowCard"><span>02</span><Heart size={21} /><h3>Compare</h3><p>Save properties, compare options and keep your shortlist organized.</p></Link>
          <Link href="/messages" className="workflowCard"><span>03</span><MessageCircle size={21} /><h3>Connect</h3><p>Message owners and agents and keep conversations tied to real listings.</p></Link>
          <Link href="/bookings" className="workflowCard"><span>04</span><KeyRound size={21} /><h3>Book & pay</h3><p>Move from booking intent into connected payment and confirmation flows.</p></Link>
        </div>
      </section>

      <section className="wrap ownerBanner">
        <div><div className="eyebrow">For owners, landlords & agencies</div><h2>Turn property into an operating workspace.</h2><p>List, verify, publish, track bookings, leases, maintenance and payments from the same platform.</p></div>
        <div className="ownerActions"><Link href="/manage" className="btn"><Plus size={17} /> List a property</Link><Link href="/dashboard" className="btn ghost">Open workspace <ArrowUpRight size={16} /></Link></div>
      </section>

      <footer className="wrap footer modernFooter"><div><strong>IMIZI</strong><span>Rwanda property marketplace</span></div><div><Link href="/legal">Legal & privacy</Link><Link href="/search">Discover</Link><Link href="/map">Map</Link></div></footer>
    </main>
  );
}