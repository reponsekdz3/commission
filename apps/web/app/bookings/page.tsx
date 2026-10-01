"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Search, CreditCard, X as XIcon } from "lucide-react";
import { authApi, formatRwf, shortDate } from "../../lib/api";

type Booking = {
  id: string; status: string; startDate: string; endDate: string;
  amountMinor?: number; currency?: string; guests?: number;
  property?: { id?: string; title?: string; district?: string };
  listing?: { id?: string; priceMinor?: number; listingType?: string };
};

const STATUS_BADGE: Record<string, string> = {
  CONFIRMED: "badge-green", PAYMENT_PENDING: "badge-amber", PENDING: "badge-amber",
  CANCELLED: "badge-red",  COMPLETED: "badge-gray",
};
const STATUS_COLOR: Record<string, string> = {
  CONFIRMED: "var(--color-success)",  PAYMENT_PENDING: "var(--color-warning, #F59E0B)",
  PENDING: "var(--color-primary)",    CANCELLED: "var(--color-danger)",
  COMPLETED: "var(--color-fg-muted)",
};

export default function Bookings() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("ALL");

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

  const statuses = ["ALL", ...Array.from(new Set(bookings.map(b => b.status)))];
  const filtered = filter === "ALL" ? bookings : bookings.filter(b => b.status === filter);

  const SUMMARY = [
    ["Total",            bookings.length,                                                    "var(--color-fg)"],
    ["Confirmed",        bookings.filter(b => b.status === "CONFIRMED").length,              "var(--color-success)"],
    ["Awaiting payment", bookings.filter(b => b.status === "PAYMENT_PENDING").length,        "var(--color-warning,#F59E0B)"],
    ["Cancelled",        bookings.filter(b => b.status === "CANCELLED").length,              "var(--color-danger)"],
  ] as const;

  return (
    <main className="wrap section">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <div className="eyebrow mb-2">Transactions</div>
          <h1 className="text-[clamp(2rem,5vw,3.2rem)] font-[900] tracking-[-0.05em] leading-tight mb-2">
            Bookings.
          </h1>
          <p className="text-[var(--color-fg-muted)] text-[15px]">
            Track upcoming and historical reservations from the live booking service.
          </p>
        </div>
        <Link href="/search" className="btn ghost flex-shrink-0 flex items-center gap-2">
          <Search size={15} /> Browse properties
        </Link>
      </div>

      {isError && (
        <div className="alert alert-error mb-6 flex items-center gap-2">
          {error instanceof Error ? error.message : "Unable to load bookings"}
          <Link href="/login" className="ml-auto font-[700] underline">Sign in →</Link>
        </div>
      )}

      {/* Summary stats */}
      {!isLoading && bookings.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {SUMMARY.map(([label, value, color]) => (
            <div key={label} className="stat-card">
              <span className="stat-label">{label}</span>
              <div className="stat-value font-[family-name:var(--font-mono)]" style={{ color }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {statuses.map(s => (
          <button
            key={s}
            className={"chip " + (filter === s ? "active" : "")}
            onClick={() => setFilter(s)}
          >
            {s === "ALL" ? "All bookings" : s.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Booking list */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3].map(i => (
            <div key={i} className="card-row animate-shimmer h-[72px]" />
          ))}
        </div>
      ) : filtered.length ? (
        <div className="flex flex-col gap-3">
          {filtered.map(b => (
            <div
              key={b.id}
              className="panel flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5"
              style={{ borderLeft: `3px solid ${STATUS_COLOR[b.status] ?? "var(--color-border)"}` }}
            >
              <div className="flex items-start gap-4 min-w-0">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                  style={{ background: (STATUS_COLOR[b.status] ?? "var(--color-primary)") + "18",
                           color: STATUS_COLOR[b.status] ?? "var(--color-primary)" }}>
                  <CalendarDays size={18} />
                </span>
                <div className="min-w-0">
                  <div className="font-[800] text-sm mb-0.5">
                    {b.property?.title ?? `Booking #${b.id.slice(0, 10)}`}
                  </div>
                  <div className="text-xs text-[var(--color-fg-muted)] flex flex-wrap gap-2">
                    <span>{shortDate(b.startDate)} → {shortDate(b.endDate)}</span>
                    {b.property?.district && <span>· {b.property.district}</span>}
                    {b.amountMinor && <span className="font-[700]">· {formatRwf(b.amountMinor)}</span>}
                    {b.guests && <span>· {b.guests} guest{b.guests > 1 ? "s" : ""}</span>}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                <span className={`badge ${STATUS_BADGE[b.status] ?? "badge-gray"}`}>
                  {b.status.replace(/_/g, " ")}
                </span>
                {b.status === "PAYMENT_PENDING" && (
                  <Link href={`/payments?bookingId=${b.id}`} className="btn flex items-center gap-1.5"
                    style={{ fontSize: 12, padding: "6px 14px" }}>
                    <CreditCard size={13} /> Pay now
                  </Link>
                )}
                {["PENDING","CONFIRMED","PAYMENT_PENDING"].includes(b.status) && (
                  <button
                    className="btn ghost flex items-center gap-1.5"
                    style={{ fontSize: 12, padding: "6px 14px" }}
                    disabled={cancel.isPending}
                    onClick={() => void cancel.mutate(b.id)}
                  >
                    <XIcon size={13} />
                    {cancel.isPending && cancel.variables === b.id ? "Cancelling…" : "Cancel"}
                  </button>
                )}
                {b.property?.id && (
                  <Link href={`/properties/${b.property.id}`}
                    className="text-[var(--color-primary)] text-xs font-[700] hover:underline">
                    View →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty mt-4">
          <CalendarDays size={32} className="text-[var(--color-fg-subtle)] mb-3 mx-auto" />
          <h3>No bookings yet</h3>
          <p>Created reservations will appear here in real time.</p>
          <Link className="btn mt-4" href="/search">Find a property</Link>
        </div>
      )}

      {cancel.isError && (
        <div className="alert alert-error mt-4">
          {cancel.error instanceof Error ? cancel.error.message : "Cancellation failed"}
        </div>
      )}
    </main>
  );
}
