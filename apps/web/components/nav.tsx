import Link from "next/link";

export function Nav() {
  return (
    <header className="wrap nav">
      <Link className="brand" href="/">Imizi</Link>
      <nav>
        <Link href="/search?listingType=RENT">Rent</Link>
        <Link href="/search?listingType=SALE">Buy</Link>
        <Link href="/search?propertyType=LAND">Land</Link>
        <Link href="/map">Map</Link>
        <Link href="/compare">Compare</Link>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/login">Sign in</Link>
      </nav>
    </header>
  );
}
