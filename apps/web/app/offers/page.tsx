"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi, formatRwf, shortDate } from "../../lib/api";
import Link from "next/link";

type Offer = {
  id: string;
  status?: string;
  amountMinor?: number;
  amount_minor?: number;
  currency?: string;
  listingId?: string;
  listing_id?: string;
  propertyTitle?: string;
  createdAt?: string;
  expiresAt?: string;
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: "var(--color-primary)",
  ACCEPTED: "var(--color-success)",
  REJECTED: "var(--color-danger)",
  WITHDRAWN: "var(--color-muted)",
  COUNTERED: "var(--color-warning, #F59E0B)",
  EXPIRED: "var(--color-muted)",
};

export default function Offers() {
  const qc = useQueryClient();

  const { data: offers = [], isLoading, isError, error } = useQuery<Offer[]>({
    queryKey: ["offers"],
    queryFn: () => authApi<Offer[]>("/offers"),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const decide = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      authApi(`/offers/${id}/respond`, { method: "POST", body: JSON.stringify({ action }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["offers"] }),
  });

  const pending = offers.filter((o) => String(o.status ?? "").includes("PENDING"));
  const resolved = offers.filter((o) => !String(o.status ?? "").includes("PENDING"));

  return (
    <main className="wrap section">
      <div className="sectionHead">
        <div>
          <div className="eyebrow">Negotiation</div>
          <h1>Offers</h1>
          <p className="muted">
            Submitted and received offers on property listings. Respond to incoming offers
            or track the status of offers you have submitted.
          </p>
        </div>
        <button
          className="btn ghost"
          onClick={() => qc.invalidateQueries({ queryKey: ["offers"] })}
        >
          ↻ Refresh
        </button>
      </div>

      {isError && (
        <div className="notice error mt-4">
          {error instanceof Error ? error.message : "Unable to load offers"} ·{" "}
          <Link href="/login">Sign in</Link>
        </div>
      )}

      {decide.isError && (
        <div className="notice error mt-4">
          {decide.error instanceof Error ? decide.error.message : "Action failed"}
        </div>
      )}

      {isLoading ? (
        <div className="list mt-6">
          {[1, 2].map((i) => (
            <div key={i} className="row animate-pulse">
              <div className="h-4 bg-[var(--color-surface-3)] rounded w-48" />
            </div>
          ))}
        </div>
      ) : offers.length ? (
        <>
          {pending.length > 0 && (
            <section className="mt-6">
              <h2>Awaiting response</h2>
              <div className="list mt-3">
                {pending.map((o) => (
                  <div className="row" key={o.id}>
                    <span>
                      <b>{formatRwf(o.amountMinor ?? o.amount_minor ?? 0)}</b>
                      <br />
                      <small className="muted">
                        Listing {String(o.listingId ?? o.listing_id ?? "—").slice(0, 10)}
                        {o.propertyTitle ? ` · ${o.propertyTitle}` : ""}
                        {o.createdAt ? ` · ${shortDate(o.createdAt)}` : ""}
                        {o.expiresAt ? ` · Expires ${shortDate(o.expiresAt)}` : ""}
                      </small>
                    </span>
                    <div className="actions">
                      <span
                        className="pill"
                        style={{ color: STATUS_COLOR[o.status ?? ""] ?? "inherit" }}
                      >
                        {o.status}
                      </span>
                      <button
                        className="btn"
                        style={{ fontSize: 13, padding: "6px 14px" }}
                        disabled={decide.isPending}
                        onClick={() => void decide.mutate({ id: o.id, action: "ACCEPT" })}
                      >
                        Accept
                      </button>
                      <button
                        className="btn ghost"
                        style={{ fontSize: 13, padding: "6px 14px" }}
                        disabled={decide.isPending}
                        onClick={() => void decide.mutate({ id: o.id, action: "REJECT" })}
                      >
                        Reject
                      </button>
                      <button
                        className="btn ghost"
                        style={{ fontSize: 13, padding: "6px 14px", color: "var(--color-muted)" }}
                        disabled={decide.isPending}
                        onClick={() => void decide.mutate({ id: o.id, action: "WITHDRAW" })}
                      >
                        Withdraw
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {resolved.length > 0 && (
            <section className="mt-6">
              <h2>Resolved</h2>
              <div className="list mt-3">
                {resolved.map((o) => (
                  <div className="row" key={o.id} style={{ opacity: 0.8 }}>
                    <span>
                      <b>{formatRwf(o.amountMinor ?? o.amount_minor ?? 0)}</b>
                      <br />
                      <small className="muted">
                        Listing {String(o.listingId ?? o.listing_id ?? "—").slice(0, 10)}
                        {o.createdAt ? ` · ${shortDate(o.createdAt)}` : ""}
                      </small>
                    </span>
                    <span
                      className="pill"
                      style={{ color: STATUS_COLOR[o.status ?? ""] ?? "inherit" }}
                    >
                      {o.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        !isError && (
          <div className="empty mt-6">
            <h3>No offers yet</h3>
            <p>
              Submit offers from a property listing page or they will appear here when
              you receive them.
            </p>
            <Link className="btn mt-4" href="/search">
              Browse properties
            </Link>
          </div>
        )
      )}
    </main>
  );
}
