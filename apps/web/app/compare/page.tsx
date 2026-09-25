import { api, formatRwf } from "../../lib/api";

export default async function ComparePage() {
  const data = await api<{ items: any[] }>("/search?limit=4");
  const rows = ["price", "bedrooms", "bathrooms", "parking", "verified", "district"];
  return (
    <main className="wrap" style={{ paddingTop: 24 }}>
      <h1>Compare up to 4 homes</h1>
      <table className="table">
        <thead>
          <tr>
            <th></th>
            {data.items.map((i: any) => (
              <th key={i.listing.id}>{i.property.title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row}>
              <td>{row}</td>
              {data.items.map((i: any) => (
                <td key={i.listing.id + row}>
                  {row === "price" && formatRwf(i.listing.priceMinor)}
                  {row === "bedrooms" && i.property.bedrooms}
                  {row === "bathrooms" && i.property.bathrooms}
                  {row === "parking" && i.property.parking}
                  {row === "verified" && (i.property.verificationStatus === "VERIFIED" ? "✓" : "—")}
                  {row === "district" && i.property.district}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
