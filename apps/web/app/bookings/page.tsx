"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi, formatRwf, shortDate } from "../../lib/api";

type Booking = {
  id: string;
  status: string;
  startDate: string;
  endDate: string;
  amountMinor?: number;
  currency?: string;
  guests?: number;
  property?: { id?: string; title?: string; district?: string };
  listing?: { id?: string; priceMinor?: number; listingType?: string };
};

const STATUS_COLOR: Record<string, string> = {
  CONFIRMED: "var(--color-success)",
  PAYMENT_PENDING: "var(--color-warning, #F59E0B)",
  PENDING: "var(--color-primary)",
  CANCELLED: "var(--color-danger)",
  COMPLETED: "var(--color-muted)",
};

export default function Bookings() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("ALL");

  const { data: bookings = [], isLoading, isError, error } = useQuery<Booking[]>({
    queryKey: ["bookings"],
    queryFn: () => authApi<Booking[]>("/bookings"),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const cancel = useMutation({
    mutationFn: (id: string) => authApi(`/bookings/${id}/cancel`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookings"] }),
  });

  const statuses = ["ALL", ...Array.from(new Set(bookings.map((b) => b.status)))];
  const filtered = filter === "ALL" ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <main className="wrap section">
      <div className="sectionHead">
        <div>
          <div className="eyebrow">Transactions</div>
          <h1>Bookings</h1>
          <p className="muted">Track upcoming and historical reservations from the live booking service.</p>
        </div>
        <Link href="/search" className="btn ghost">Browse properties</Link>
      </div>

      {isError && (
        <div className="notice error mt-4">
          {error instanceof Error ? error.message : "Unable to load bookings"} ·{" "}
          <Link href="/login">Sign in</Link>
        </div>
      )}

      {/* Status filter chips */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {statuses.map((s) => (
          <button
            key={s}
            className={"chip " + (filter === s ? "active" : "")}
            onClick={() => setFilter(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Stats row */}
      {!isLoading && bookings.length > 0 && (
        <div className="stats mt-4">
          {[
            ["Total", bookings.length],
            ["Confirmed", bookings.filter((b) => b.status === "CONFIRMED").length],
            ["Pending payment", bookings.filter((b) => b.status === "PAYMENT_PENDING").length],
            ["Cancelled", bookings.filter((b) => b.status === "CANCELLED").length],
          ].map(([label, value]) => (
            <div className="stat" key={String(label)}>
              <span className="muted">{label}</span>
              <b>{value}</b>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="list mt-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="row animate-pulse">
              <span className="h-4 bg-[var(--color-surface-3)] rounded w-48" />
              <span className="h-4 bg-[var(--color-surface-3)] rounded w-20" />
            </div>
          ))}
        </div>
      ) : filtered.length ? (
        <div className="list mt-6">
          {filtered.map((b) => (
            <div className="row" key={b.id}>
              <span>
                <b>
                  {b.property?.title ?? `Booking ${b.id.slice(0, 10)}…`}
                </b>
                <br />
                <small className="muted">
                  {shortDate(b.startDate)} → {shortDate(b.endDate)}
                  {b.property?.district ? ` · ${b.property.district}` : ""}
                  {b.amountMinor ? ` · ${formatRwf(b.amountMinor)}` : ""}
                  {b.guests ? ` · ${b.guests} guest${b.guests > 1 ? "s" : ""}` : ""}
                </small>
              </span>
              <div className="actions">
                <span
                  className="pill"
                  style={{ color: STATUS_COLOR[b.status] ?? "inherit" }}
                >
                  {b.status}
                </span>
                {b.status === "PAYMENT_PENDING" && (
                  <Link
                    href={`/payments?bookingId=${b.id}`}
                    className="btn"
                    style={{ fontSize: 13, padding: "6px 14px" }}
                  >
                    Pay now
                  </Link>
                )}
                {["PENDING", "CONFIRMED", "PAYMENT_PENDING"].includes(b.status) && (
                  <button
                    className="btn ghost"
                    style={{ fontSize: 13, padding: "6px 14px" }}
                    disabled={cancel.isPending}
                    onClick={() => void cancel.mutate(b.id)}
                  >
                    {cancel.isPending && cancel.variables === b.id ? "Cancelling…" : "Cancel"}
                  </button>
                )}
                {b.property?.id && (
                  <Link
                    href={`/properties/${b.property.id}`}
                    className="muted"
                    style={{ fontSize: 13 }}
                  >
                    View →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty mt-6">
          <h3>No bookings yet</h3>
          <p>Created reservations will appear here in real time.</p>
          <Link className="btn mt-4" href="/search">
            Find a property
          </Link>
        </div>
      )}

      {cancel.isError && (
        <div className="notice error mt-4">
          {cancel.error instanceof Error ? cancel.error.message : "Cancellation failed"}
        </div>
      )}
    </main>
  );
}