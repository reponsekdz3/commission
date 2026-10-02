"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Home, BarChart3, CalendarDays, Tag, FileText,
  Wrench, MessageCircle, Bell, Shield, RefreshCw,
  ArrowUpRight, Building2, CheckCircle,
} from "lucide-react";
import { authApi, formatRwf, shortDate } from "../../lib/api";

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Super admin", ADMIN: "Administrator", MODERATOR: "Moderator",
  VERIFICATION_AGENT: "Verification", FINANCE_ADMIN: "Finance",
  AGENCY_ADMIN: "Agency admin", AGENT: "Agent", PROPERTY_MANAGER: "Property manager",
  LANDLORD: "Landlord", SELLER: "Seller", TENANT: "Tenant", BUYER: "Buyer", USER: "Customer",
};

const NAV_ITEMS = [
  { href: "/dashboard",     label: "Portfolio",            icon: BarChart3 },
  { href: "/manage",        label: "Properties & listings", icon: Home },
  { href: "/bookings",      label: "Bookings",             icon: CalendarDays },
  { href: "/offers",        label: "Offers",               icon: Tag },
  { href: "/leases",        label: "Leases",               icon: FileText },
  { href: "/maintenance",   label: "Maintenance",          icon: Wrench },
  { href: "/messages",      label: "Messages",             icon: MessageCircle },
  { href: "/notifications", label: "Notifications",        icon: Bell },
  { href: "/admin",         label: "Admin console",        icon: Shield },
] as const;

export default function Workspace() {
  const [u, setU]       = useState<any>();
  const [d, setD]       = useState<any>();
  const [err, setErr]   = useState("");
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    try {
      const x = JSON.parse(sessionStorage.getItem("imizi_user") || "null");
      setU(x);
      if (!x) return;
      load(x);
    } catch (e: any) { setErr(e.message); }
  }, []);

  async function load(x: any) {
    setBusy(true);
    try {
      const roles: string[] = x.roles || [];
      const ops     = roles.some(r => ["LANDLORD","SELLER","AGENT","AGENCY_ADMIN","PROPERTY_MANAGER","ADMIN","SUPER_ADMIN"].includes(r));
      const admin   = roles.some(r => ["ADMIN","SUPER_ADMIN","MODERATOR"].includes(r));
      const verify  = roles.some(r => ["VERIFICATION_AGENT","ADMIN","SUPER_ADMIN"].includes(r));
      const finance = roles.some(r => ["FINANCE_ADMIN","SUPER_ADMIN"].includes(r));
      const results: any = await Promise.all([
        ops     ? authApi("/analytics/landlord") : Promise.resolve(null),
        ops     ? authApi("/properties/owned")   : Promise.resolve([]),
        authApi("/bookings"),
        authApi("/offers"),
        authApi("/notifications"),
        admin   ? authApi("/admin/overview")     : Promise.resolve(null),
        verify  ? authApi("/verification")       : Promise.resolve([]),
        finance ? authApi("/analytics/platform") : Promise.resolve(null),
      ]);
      setD({
        analytics: results[0], properties: results[1], bookings: results[2],
        offers: results[3], notifications: results[4], admin: results[5],
        verifications: results[6], platform: results[7],
      });
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  if (!u) {
    return (
      <main className="wrap section flex items-center justify-center min-h-[60vh]">
        <div className="panel max-w-md w-full text-center p-10">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] mx-auto mb-6">
            <Building2 size={28} />
          </div>
          <div className="eyebrow mb-3">Secure workspace</div>
          <h1 className="text-3xl font-[900] tracking-[-0.05em] mb-3">Sign in to your workspace.</h1>
          <p className="text-[var(--color-fg-muted)] mb-8">Your role determines the operations available to you.</p>
          <Link className="btn w-full justify-center" href="/login">Sign in</Link>
        </div>
      </main>
    );
  }

  const roles: string[] = u.roles || [];
  const initials = (u.fullName || "U").split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
  const unread = (d?.notifications || []).filter((n: any) => !n.read_at && !n.readAt).length;

  const STATS = [
    ["Properties", d?.analytics?.properties ?? d?.properties?.length ?? 0, "var(--color-primary)"],
    ["Active",     d?.analytics?.active ?? "—",                            "var(--color-success)"],
    ["Bookings",   d?.analytics?.bookings ?? d?.bookings?.length ?? 0,     "var(--color-accent)"],
    ["Offers",     d?.offers?.length ?? 0,                                 "var(--color-info)"],
    ["Unread",     unread,                                                  "var(--color-danger)"],
  ] as const;

  return (
    <main className="wrap section">
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="workspace-aside flex flex-col gap-4">
          {/* Profile card */}
          <div className="panel p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-fg)] font-[900] text-lg">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="font-[800] text-sm truncate">{u.fullName}</div>
                <div className="text-xs text-[var(--color-fg-muted)] truncate">{u.email || u.phone}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {roles.map(r => (
                <span key={r} className="badge badge-green text-[10px]">{roleLabels[r] || r}</span>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="panel p-2">
            <nav className="flex flex-col gap-0.5">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-[600] text-[var(--color-fg-soft)] transition-colors hover:bg-[var(--color-surface-3)] hover:text-[var(--color-primary)]">
                  <Icon size={16} className="flex-shrink-0" />
                  {label}
                  {label === "Notifications" && unread > 0 && (
                    <span className="ml-auto badge badge-red text-[9px]">{unread}</span>
                  )}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <section>
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="eyebrow mb-2">Role-aware operations</div>
              <h1 className="text-[clamp(2rem,4vw,2.8rem)] font-[900] tracking-[-0.05em] leading-tight mb-1">
                Workspace.
              </h1>
              <p className="text-[var(--color-fg-muted)] text-sm">Real-time operational data from the production API.</p>
            </div>
            <button className="btn ghost flex items-center gap-2" onClick={() => load(u)}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {err && <div className="alert alert-error mb-4">{err}</div>}

          {busy ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {[1,2,3,4,5].map(i => <div key={i} className="stat-card animate-shimmer h-24" />)}
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                {STATS.map(([label, value, color]) => (
                  <div key={label} className="stat-card">
                    <span className="stat-label">{label}</span>
                    <div className="stat-value font-[family-name:var(--font-mono)]" style={{ color }}>
                      {String(value)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Analytics panel */}
              {d?.analytics && (
                <div className="panel mb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="eyebrow mb-1">Portfolio</div>
                      <div className="text-2xl font-[900] font-[family-name:var(--font-mono)] tracking-[-0.04em]">
                        {formatRwf(d.analytics.revenue || 0)}
                      </div>
                      <div className="text-sm text-[var(--color-fg-muted)] mt-1">
                        Recorded revenue · {d.analytics.views || 0} views
                      </div>
                    </div>
                    <Link href="/dashboard" className="btn ghost flex items-center gap-1.5 text-sm">
                      Analytics <ArrowUpRight size={13} />
                    </Link>
                  </div>
                </div>
              )}

              {/* Bookings + Offers grid */}
              <div className="grid gap-4 sm:grid-cols-2 mb-4">
                <div className="panel">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-[800] text-sm">Recent bookings</span>
                    <Link href="/bookings" className="text-[var(--color-primary)] text-xs font-[700] hover:underline">View all →</Link>
                  </div>
                  <div className="flex flex-col gap-2">
                    {(d?.bookings || []).slice(0, 4).map((b: any) => (
                      <div key={b.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="text-[var(--color-fg-muted)] text-xs">{b.startDate} → {b.endDate}</span>
                        <span className="badge badge-gray">{b.status}</span>
                      </div>
                    ))}
                    {!d?.bookings?.length && <p className="text-sm text-[var(--color-fg-muted)]">No bookings yet.</p>}
                  </div>
                </div>
                <div className="panel">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-[800] text-sm">Offers</span>
                    <Link href="/offers" className="text-[var(--color-primary)] text-xs font-[700] hover:underline">View all →</Link>
                  </div>
                  <div className="flex flex-col gap-2">
                    {(d?.offers || []).slice(0, 4).map((o: any) => (
                      <div key={o.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="font-[700]">{formatRwf(o.amount_minor ?? o.amountMinor)}</span>
                        <span className="badge badge-amber">{o.status}</span>
                      </div>
                    ))}
                    {!d?.offers?.length && <p className="text-sm text-[var(--color-fg-muted)]">No offers yet.</p>}
                  </div>
                </div>
              </div>

              {/* Admin panel */}
              {d?.admin && (
                <div className="panel mb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="eyebrow mb-1">Administration</div>
                      <h2 className="text-xl font-[800] tracking-[-0.03em]">Platform controls</h2>
                      <p className="text-sm text-[var(--color-fg-muted)] mt-2 max-w-lg">
                        Users, properties, moderation, audit and risk controls via protected admin APIs.
                      </p>
                    </div>
                    <Link className="btn" href="/admin">Admin console</Link>
                  </div>
                </div>
              )}

              {/* Verification queue */}
              {d?.verifications?.length > 0 && (
                <div className="panel">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="eyebrow mb-1">Verification queue</div>
                      <h2 className="text-xl font-[800]">{d.verifications.length} cases</h2>
                    </div>
                    <Link href="/admin" className="btn ghost flex items-center gap-1.5">
                      <CheckCircle size={14} /> Review
                    </Link>
                  </div>
                  <div className="flex flex-col gap-2">
                    {d.verifications.slice(0, 6).map((v: any) => (
                      <div key={v.id} className="card-row">
                        <div className="min-w-0">
                          <div className="font-[700] text-sm">{v.kind}</div>
                          <div className="text-xs text-[var(--color-fg-muted)]">
                            {v.subject_type}:{String(v.subject_id).slice(0, 8)} · {shortDate(v.created_at)}
                          </div>
                        </div>
                        <span className="badge badge-amber flex-shrink-0">{v.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
