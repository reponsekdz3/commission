"use client";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Columns3, Plus, Trash2, ShieldCheck } from "lucide-react";
import { api, formatRwf } from "../../lib/api";
import { useCompareStore } from "../../components/compare-store";

const rows = ["price", "bedrooms", "bathrooms", "parking", "verified", "district", "propertyType", "area"];
const LABELS: Record<string, string> = {
  price: "Price",
  bedrooms: "Bedrooms",
  bathrooms: "Bathrooms",
  parking: "Parking",
  verified: "Verification",
  district: "District",
  propertyType: "Type",
  area: "Area",
};

function cell(i: any, row: string) {
  if (row === "price") return formatRwf(i.listing.priceMinor);
  if (row === "bedrooms") return String(i.property.bedrooms ?? "—");
  if (row === "bathrooms") return String(i.property.bathrooms ?? "—");
  if (row === "parking") return String(i.property.parking ?? "—");
  if (row === "verified") return i.property.verificationStatus === "VERIFIED" ? "Verified" : "—";
  if (row === "district") return i.property.district;
  if (row === "propertyType") return i.property.propertyType;
  if (row === "area") return String((i.property.areaValue ?? "—") + " " + (i.property.areaUnit || ""));
  return "—";
}

export default function ComparePage() {
  const router = useRouter();
  const items = useCompareStore(s => s.items);
  const remove = useCompareStore(s => s.remove);
  const clear = useCompareStore(s => s.clear);
  const ids = useMemo(() => items.map(x => x.id).join(","), [items]);
  const q = useQuery({
    queryKey: ["compare", ids],
    queryFn: () => api<any[]>("/compare" + (ids ? "?ids=" + encodeURIComponent(ids) : "")),
    staleTime: 30000,
  });
  useEffect(() => { if (!items.length) void q.refetch(); }, [items.length]);

  return (
    <main className="wrap section">
      <div className="sectionHead">
        <div>
          <div className="eyebrow mb-2">Decision workspace</div>
          <h1 className="page-heading">Compare properties.</h1>
          <p className="page-sub">
            Selected homes are loaded again from the live backend so every attribute stays current.
          </p>
        </div>
        <div className="actions">
          {items.length > 0 && (
            <button className="btn ghost" onClick={clear}>
              <Trash2 size={14} /> Clear
            </button>
          )}
          <button className="btn" onClick={() => router.push("/search")}>
            <Plus size={14} /> Add properties
          </button>
        </div>
      </div>

      {q.isPending ? (
        <div className="panel animate-shimmer" style={{ minHeight: 220 }} />
      ) : q.isError ? (
        <div className="alert alert-error mt-4">
          {q.error instanceof Error ? q.error.message : "Unable to load comparison"}
        </div>
      ) : q.data?.length ? (
        <div className="compare-wrap mt-6">
          <table className="compare-table">
            <thead>
              <tr>
                <th>Attribute</th>
                {q.data.map((i: any) => (
                  <th key={i.listing.id}>
                    <div className="compare-head-title">{i.property.title}</div>
                    <button className="chip" onClick={() => remove(i.property.id)}>Remove</button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row}>
                  <td className="compare-attr">{LABELS[row] || row}</td>
                  {q.data.map((i: any) => (
                    <td key={i.listing.id + row}>
                      {row === "verified" && i.property.verificationStatus === "VERIFIED" ? (
                        <span className="badge badge-green inline-flex items-center gap-1">
                          <ShieldCheck size={12} /> Verified
                        </span>
                      ) : (
                        cell(i, row)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty mt-6">
          <Columns3 size={32} className="mx-auto mb-3 text-[var(--color-fg-subtle)]" />
          <h3>No properties selected</h3>
          <p>Add properties from search using the compare control.</p>
          <button className="btn mt-4" onClick={() => router.push("/search")}>Browse properties</button>
        </div>
      )}
    </main>
  );
}
