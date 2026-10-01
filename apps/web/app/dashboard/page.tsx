"use client";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import {
  TrendingUp, Home, Eye, CalendarDays, Plus,
  MessageCircle, ArrowUpRight,
} from "lucide-react";
import { authApi, formatRwf } from "../../lib/api";
import { Counter } from "../../components/motion/counter";
import { Reveal } from "../../components/motion/reveal";

type Analytics = {
  properties?: number; active?: number; views?: number; bookings?: number;
  revenue?: number; revenueSeries?: { date: string; value: number }[];
};

const STATUS_COLORS: Record<string, string> = {
  PUBLISHED: "badge-green", DRAFT: "badge-gray", ARCHIVED: "badge-amber",
  CONFIRMED: "badge-green", PENDING: "badge-amber", PAYMENT_PENDING: "badge-amber",
  CANCELLED: "badge-red", COMPLETED: "badge-gray",
};

export default function Dashboard() {
  const { data: queryData, isLoading, error } = useQuery({
    queryKey: ["dashboard", "landlord"],
    queryFn: async () => {
      const [analytics, properties, bookings] = await Promise.all([
        authApi<Analytics>("/analytics/landlord"),
        authApi<{ id: string; title: string; district?: string; status?: string }[]>("/properties/owned"),
        authApi<{ id: string; status: string; startDate: string; endDate: string }[]>("/bookings"),
      ]);
      return { analytics, properties: properties || [], bookings: bookings || [] };
    },
    staleTime: 300_000,
  });

  const data    = queryData?.analytics ?? null;
  const props   = queryData?.properties ?? [];
  const bookings = queryData?.bookings ?? [];
  const err     = error instanceof Error ? error.message : "";
  const chart   = useMemo(() => data?.revenueSeries || [], [data]);

  const STATS = [
    { label: "Properties", value: data?.properties || 0, icon: Home,        delta: "Portfolio size",   color: "var(--color-primary)" },
    { label: "Active",     value: data?.active     || 0, icon: TrendingUp,   delta: "Live listings",   color: "var(--color-success)" },
    { label: "Views",      value: data?.views      || 0, icon: Eye,          delta: "Total views",     color: "var(--color-info)" },
    { label: "Bookings",   value: data?.bookings   || 0, icon: CalendarDays, delta: "All time",        color: "var(--color-accent)" },
  ];

  return (
    <main className="wrap section">
      {/* Header */}
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
          <div>
            <div className="eyebrow mb-2">Owner workspace</div>
            <h1 className="text-[clamp(2rem,5vw,3.2rem)] font-[900] tracking-[-0.05em] leading-tight mb-2">
              Good to see you.
            </h1>
            <p className="text-[var(--color-fg-muted)] text-[15px] max-w-xl">
              Your portfolio, activity and transaction performance in one command center.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            <Link className="btn flex items-center gap-2" href="/manage">
              <Plus size={15} /> New listing
            </Link>
            <Link className="btn ghost flex items-center gap-2" href="/messages">
              <MessageCircle size={15} /> Messages
            </Link>
          </div>
        </div>
      </Reveal>

      {isLoading && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-8">
          {[1,2,3,4].map(i => (
            <div key={i} className="stat-card animate-shimmer h-32" />
          ))}
        </div>
      )}

      {err && <div className="alert alert-error mb-6">{err}</div>}

      {/* Stats grid */}
      {data && (
        <Reveal>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-8">
            {STATS.map(({ label, value, icon: Icon, delta, color }) => (
              <div key={label} className="stat-card">
                <div className="flex items-center justify-between">
                  <span className="stat-label">{label}</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ background: color + "18", color }}>
                    <Icon size={17} />
                  </span>
                </div>
                <div className="stat-value">
                  <Counter value={value} />
                </div>
                <div className="stat-delta up text-xs mt-1">{delta}</div>
              </div>
            ))}
          </div>
        </Reveal>
      )}

      {/* Chart + Occupancy */}
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr] mb-8">
        <section className="panel">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="eyebrow mb-1">Performance</div>
              <h2 className="text-xl font-[800] tracking-[-0.03em]">Revenue</h2>
            </div>
            <strong className="font-[family-name:var(--font-mono)] text-xl font-[800] tabular-nums text-[var(--color-fg)]">
              {formatRwf(data?.revenue || 0)}
            </strong>
          </div>
          <div className="h-64">
            {chart.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="var(--color-primary)" stopOpacity=".35" />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0"   />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-glass)", border: "1px solid var(--color-border)",
                      borderRadius: 12, backdropFilter: "blur(12px)",
                    }}
                    formatter={(v) => [formatRwf(Number(v) || 0), "Revenue"]}
                  />
                  <Area type="monotone" dataKey="value" stroke="var(--color-primary)"
                    fill="url(#rev)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty h-full flex flex-col items-center justify-center gap-2">
                <TrendingUp size={28} className="text-[var(--color-fg-subtle)]" />
                <p className="text-sm">Revenue data will appear once bookings are paid.</p>
              </div>
            )}
          </div>
        </section>

        <section className="panel flex flex-col">
          <div className="eyebrow mb-1">Occupancy</div>
          <h2 className="text-xl font-[800] tracking-[-0.03em] mb-6">Portfolio health</h2>
          <div className="flex-1 flex items-center justify-center">
            <div
              className="flex h-44 w-44 items-center justify-center rounded-full"
              style={{ border: "18px solid var(--color-primary)", boxShadow: "var(--shadow-glow-primary)" }}
            >
              <div className="text-center">
                <div className="font-[family-name:var(--font-display)] text-4xl font-[900]">
                  {data?.bookings || 0}
                </div>
                <div className="muted text-xs font-[700] mt-1">bookings</div>
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-2 text-sm">
            {[
              ["Active listings", data?.active || 0, "var(--color-success)"],
              ["Total views",     data?.views   || 0, "var(--color-info)"],
            ].map(([label, value, color]) => (
              <div key={String(label)} className="flex items-center justify-between">
                <span className="text-[var(--color-fg-muted)]">{label}</span>
                <span className="font-[800] font-[family-name:var(--font-mono)]"
                  style={{ color: String(color) }}>{String(value)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Properties + Bookings */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-[800] tracking-[-0.03em]">Your properties</h2>
            <Link href="/manage" className="text-[var(--color-primary)] text-sm font-[700] hover:underline flex items-center gap-1">
              Manager <ArrowUpRight size={13} />
            </Link>
          </div>
          {props.length ? (
            <div className="flex flex-col gap-2">
              {props.slice(0, 8).map(p => (
                <Link
                  key={p.id}
                  href={"/properties/" + p.id}
                  className="card-row group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                      <Home size={16} />
                    </span>
                    <div className="min-w-0">
                      <div className="font-[700] text-sm truncate">{p.title}</div>
                      <div className="text-xs text-[var(--color-fg-muted)] truncate">
                        {p.district} · {p.status}
                      </div>
                    </div>
                  </div>
                  <span className={`badge ${STATUS_COLORS[p.status || ""] || "badge-gray"} flex-shrink-0`}>
                    {p.status}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty">
              <Home size={24} className="text-[var(--color-fg-subtle)] mb-2 mx-auto" />
              <h3 className="text-base font-[800] mb-1">No properties yet</h3>
              <Link href="/manage" className="btn mt-3">Create your first listing</Link>
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-[800] tracking-[-0.03em]">Recent bookings</h2>
            <Link href="/bookings" className="text-[var(--color-primary)] text-sm font-[700] hover:underline flex items-center gap-1">
              View all <ArrowUpRight size={13} />
            </Link>
          </div>
          {bookings.length ? (
            <div className="flex flex-col gap-2">
              {bookings.slice(0, 8).map(b => (
                <div key={b.id} className="card-row">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent-text)]">
                      <CalendarDays size={16} />
                    </span>
                    <div className="min-w-0">
                      <div className="font-[700] text-sm font-[family-name:var(--font-mono)]">
                        #{b.id.slice(0, 8)}
                      </div>
                      <div className="text-xs text-[var(--color-fg-muted)]">
                        {b.startDate} → {b.endDate}
                      </div>
                    </div>
                  </div>
                  <span className={`badge ${STATUS_COLORS[b.status] || "badge-gray"} flex-shrink-0`}>
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">
              <CalendarDays size={24} className="text-[var(--color-fg-subtle)] mb-2 mx-auto" />
              <h3 className="text-base font-[800] mb-1">No bookings yet</h3>
              <p className="text-sm text-[var(--color-fg-muted)]">Reservations will appear here in real time.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
