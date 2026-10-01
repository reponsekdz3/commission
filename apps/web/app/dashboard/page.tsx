"use client";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
} from "recharts";
import {
  TrendingUp, Home, Eye, CalendarDays, Plus, MessageCircle,
  ArrowUpRight, BarChart3, Zap, RefreshCw, ExternalLink,
  Building, ChevronRight,
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

const STAT_META = [
  { key: "properties", label: "Properties",  icon: Home,        color: "var(--color-primary)",  bg: "var(--color-primary-soft)",  delta: "Total portfolio" },
  { key: "active",     label: "Active",       icon: Zap,         color: "var(--color-success)",  bg: "#dcfce7",                    delta: "Live listings" },
  { key: "views",      label: "Total views",  icon: Eye,         color: "var(--color-info)",     bg: "#e0f2fe",                    delta: "All time" },
  { key: "bookings",   label: "Bookings",     icon: CalendarDays,color: "var(--color-accent)",   bg: "var(--color-accent-soft)",   delta: "Confirmed" },
] as const;

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="dash-chart-tooltip">
      <div className="dash-chart-tooltip-label">{label}</div>
      <div className="dash-chart-tooltip-value">{formatRwf(payload[0]?.value || 0)}</div>
    </div>
  );
}

export default function Dashboard() {
  const { data: queryData, isLoading, error, refetch, isFetching } = useQuery({
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

  const data     = queryData?.analytics ?? null;
  const props    = queryData?.properties ?? [];
  const bookings = queryData?.bookings ?? [];
  const err      = error instanceof Error ? error.message : "";
  const chart    = useMemo(() => data?.revenueSeries || [], [data]);

  return (
    <main className="wrap section">
      {/* ── Header ── */}
      <Reveal>
        <div className="dash-header">
          <div className="dash-header-left">
            <div className="eyebrow mb-2">Owner workspace</div>
            <h1 className="page-heading">Your portfolio.</h1>
            <p className="page-sub">
              Real-time analytics, property activity and transaction performance — all in one command center.
            </p>
          </div>
          <div className="dash-header-actions">
            <Link className="btn flex items-center gap-2" href="/manage">
              <Plus size={15} /> New listing
            </Link>
            <Link className="btn ghost flex items-center gap-2" href="/messages">
              <MessageCircle size={15} /> Messages
            </Link>
            <button
              className="btn ghost dash-refresh-btn"
              onClick={() => void refetch()}
              disabled={isFetching}
              aria-label="Refresh dashboard"
            >
              <RefreshCw size={15} className={isFetching ? "dash-spin" : ""} />
            </button>
          </div>
        </div>
      </Reveal>

      {/* ── Skeleton ── */}
      {isLoading && (
        <div className="stats-grid mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="stat-card animate-shimmer" style={{ height: 130 }} />
          ))}
        </div>
      )}

      {err && (
        <div className="alert alert-error mb-6 flex items-center gap-2">
          <span>⚠️</span> {err}
        </div>
      )}

      {/* ── Stats grid ── */}
      {data && (
        <Reveal>
          <div className="stats-grid mb-8">
            {STAT_META.map(({ key, label, icon: Icon, color, bg, delta }) => {
              const value = (data as Record<string, number | undefined>)[key] ?? 0;
              return (
                <div key={key} className="stat-card dash-stat-card">
                  <div className="dash-stat-head">
                    <span className="stat-label">{label}</span>
                    <span className="dash-stat-icon" style={{ background: bg, color }}>
                      <Icon size={17} />
                    </span>
                  </div>
                  <div className="stat-value" style={{ color }}>
                    <Counter value={value} />
                  </div>
                  <div className="stat-delta up">{delta}</div>
                </div>
              );
            })}
          </div>
        </Reveal>
      )}

      {/* ── Chart + Occupancy ── */}
      <Reveal>
        <div className="dash-chart-row mb-8">
          {/* Revenue chart */}
          <section className="panel dash-chart-panel">
            <div className="dash-chart-head">
              <div>
                <div className="eyebrow mb-1">Performance</div>
                <h2 className="text-xl font-[800] tracking-[-0.03em]">Revenue overview</h2>
              </div>
              <div className="dash-revenue-total">
                <span className="dash-revenue-label">Total</span>
                <strong>{formatRwf(data?.revenue || 0)}</strong>
              </div>
            </div>
            <div className="dash-chart-area">
              {chart.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chart} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"   stopColor="var(--color-primary)" stopOpacity={0.3} />
                        <stop offset="95%"  stopColor="var(--color-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "var(--color-fg-muted)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={v => formatRwf(v).replace("RWF", "").trim()}
                      tick={{ fontSize: 10, fill: "var(--color-fg-muted)" }}
                      axisLine={false}
                      tickLine={false}
                      width={60}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="var(--color-primary)"
                      strokeWidth={2.5}
                      fill="url(#revGrad)"
                      dot={false}
                      activeDot={{ r: 5, fill: "var(--color-primary)", stroke: "var(--color-bg)", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty h-full flex flex-col items-center justify-center gap-2">
                  <BarChart3 size={32} className="text-[var(--color-fg-subtle)]" />
                  <p className="text-sm">Revenue data appears once bookings are paid.</p>
                </div>
              )}
            </div>
          </section>

          {/* Portfolio health */}
          <section className="panel dash-health-panel">
            <div className="eyebrow mb-1">Portfolio</div>
            <h2 className="text-xl font-[800] tracking-[-0.03em] mb-6">Health snapshot</h2>

            <div className="dash-health-ring-wrap">
              <div className="dash-health-ring">
                <div className="dash-health-ring-inner">
                  <span className="dash-health-big">{data?.bookings || 0}</span>
                  <span className="dash-health-sub">bookings</span>
                </div>
              </div>
            </div>

            <div className="dash-health-metrics">
              {[
                { label: "Active listings", value: data?.active  || 0, color: "var(--color-success)" },
                { label: "Total views",     value: data?.views   || 0, color: "var(--color-info)" },
                { label: "Properties",      value: data?.properties || 0, color: "var(--color-primary)" },
              ].map(({ label, value, color }) => (
                <div key={label} className="dash-health-metric">
                  <span className="dash-health-metric-label">{label}</span>
                  <span className="dash-health-metric-value" style={{ color }}>{value}</span>
                </div>
              ))}
            </div>

            <Link href="/workspace" className="btn ghost w-full flex items-center justify-center gap-2 mt-4" style={{ fontSize: 13 }}>
              <Building size={14} /> Full workspace
            </Link>
          </section>
        </div>
      </Reveal>

      {/* ── Properties + Bookings ── */}
      <Reveal>
        <div className="dash-lists-row">
          {/* Properties */}
          <section className="dash-list-section">
            <div className="dash-list-head">
              <h2 className="text-lg font-[800] tracking-[-0.03em]">Your properties</h2>
              <Link href="/manage" className="dash-list-link">
                Manage <ArrowUpRight size={13} />
              </Link>
            </div>

            {isLoading && (
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map(i => <div key={i} className="card-row animate-shimmer" style={{ height: 68 }} />)}
              </div>
            )}

            {!isLoading && props.length > 0 && (
              <div className="flex flex-col gap-2">
                {props.slice(0, 8).map(p => (
                  <Link key={p.id} href={"/properties/" + p.id} className="card-row group dash-prop-row">
                    <div className="dash-prop-left">
                      <span className="dash-prop-icon">
                        <Home size={16} />
                      </span>
                      <div className="min-w-0">
                        <div className="font-[700] text-sm truncate group-hover:text-[var(--color-primary)] transition-colors">
                          {p.title}
                        </div>
                        <div className="text-xs text-[var(--color-fg-muted)] mt-0.5 truncate">
                          {p.district || "Rwanda"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`badge ${STATUS_COLORS[p.status || ""] || "badge-gray"}`}>
                        {p.status}
                      </span>
                      <ChevronRight size={14} className="text-[var(--color-fg-subtle)] group-hover:text-[var(--color-primary)] transition-colors" />
                    </div>
                  </Link>
                ))}
                {props.length > 8 && (
                  <Link href="/manage" className="dash-show-more">
                    +{props.length - 8} more properties <ExternalLink size={11} />
                  </Link>
                )}
              </div>
            )}

            {!isLoading && props.length === 0 && (
              <div className="empty">
                <Home size={28} className="text-[var(--color-fg-subtle)] mb-3 mx-auto" />
                <h3 className="text-base font-[800] mb-1">No properties yet</h3>
                <p className="text-sm text-[var(--color-fg-muted)] mb-4">
                  Create your first listing and start receiving bookings.
                </p>
                <Link href="/manage" className="btn">
                  <Plus size={14} /> Create listing
                </Link>
              </div>
            )}
          </section>

          {/* Bookings */}
          <section className="dash-list-section">
            <div className="dash-list-head">
              <h2 className="text-lg font-[800] tracking-[-0.03em]">Recent bookings</h2>
              <Link href="/bookings" className="dash-list-link">
                View all <ArrowUpRight size={13} />
              </Link>
            </div>

            {isLoading && (
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map(i => <div key={i} className="card-row animate-shimmer" style={{ height: 68 }} />)}
              </div>
            )}

            {!isLoading && bookings.length > 0 && (
              <div className="flex flex-col gap-2">
                {bookings.slice(0, 8).map(b => (
                  <div key={b.id} className="card-row dash-booking-row">
                    <div className="dash-prop-left">
                      <span className="dash-booking-icon">
                        <CalendarDays size={16} />
                      </span>
                      <div className="min-w-0">
                        <div className="font-[700] text-sm font-[family-name:var(--font-mono)]">
                          #{b.id.slice(0, 8)}
                        </div>
                        <div className="text-xs text-[var(--color-fg-muted)] mt-0.5">
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
            )}

            {!isLoading && bookings.length === 0 && (
              <div className="empty">
                <CalendarDays size={28} className="text-[var(--color-fg-subtle)] mb-3 mx-auto" />
                <h3 className="text-base font-[800] mb-1">No bookings yet</h3>
                <p className="text-sm text-[var(--color-fg-muted)]">
                  Reservations will appear here in real time once tenants book.
                </p>
              </div>
            )}
          </section>
        </div>
      </Reveal>

      {/* ── Quick action cards ── */}
      <Reveal>
        <div className="dash-quick-actions">
          {[
            { href: "/manage",       icon: Plus,           label: "New listing",    sub: "Add a property to your portfolio",  accent: false },
            { href: "/messages",     icon: MessageCircle,  label: "Messages",       sub: "Reply to inquiries & offers",       accent: false },
            { href: "/bookings",     icon: CalendarDays,   label: "All bookings",   sub: "Manage viewings and stays",         accent: false },
            { href: "/workspace",    icon: TrendingUp,     label: "Workspace",      sub: "Detailed performance reports",      accent: true },
          ].map(({ href, icon: Icon, label, sub, accent }) => (
            <Link key={href} href={href} className={`dash-quick-card ${accent ? "dash-quick-card-accent" : ""}`}>
              <span className={`dash-quick-icon ${accent ? "accent" : ""}`}>
                <Icon size={20} />
              </span>
              <div>
                <div className="dash-quick-label">{label}</div>
                <div className="dash-quick-sub">{sub}</div>
              </div>
              <ChevronRight size={16} className="dash-quick-arrow" />
            </Link>
          ))}
        </div>
      </Reveal>
    </main>
  );
}
