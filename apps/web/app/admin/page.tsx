"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi, formatRwf, shortDate } from "../../lib/api";
import Link from "next/link";

type AdminOverview = {
  users?: { total?: number; verified?: number; active?: number };
  properties?: { total?: number; published?: number; pending?: number };
  bookings?: { total?: number; confirmed?: number; revenue?: number };
  payments?: { total?: number; succeeded?: number; failed?: number };
  [key: string]: unknown;
};

type AdminUser = {
  id: string;
  fullName?: string;
  email?: string;
  phone?: string;
  roles?: string[];
  status?: string;
  createdAt?: string;
};

type AdminProperty = {
  id: string;
  title?: string;
  district?: string;
  status?: string;
  verificationStatus?: string;
  createdAt?: string;
};

type ModerationCase = {
  id: string;
  kind?: string;
  status?: string;
  subject_type?: string;
  subject_id?: string;
  created_at?: string;
};

type AuditEntry = {
  id: string;
  action?: string;
  userId?: string;
  resourceType?: string;
  resourceId?: string;
  createdAt?: string;
};

type TabKey = "overview" | "users" | "properties" | "moderation" | "audit";

export default function Admin() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabKey>("overview");

  const overview = useQuery<AdminOverview>({
    queryKey: ["admin", "overview"],
    queryFn: () => authApi<AdminOverview>("/admin/overview"),
    staleTime: 60_000,
  });

  const users = useQuery<AdminUser[]>({
    queryKey: ["admin", "users"],
    queryFn: () => authApi<AdminUser[]>("/admin/users"),
    enabled: tab === "users",
    staleTime: 30_000,
  });

  const properties = useQuery<AdminProperty[]>({
    queryKey: ["admin", "properties"],
    queryFn: () => authApi<AdminProperty[]>("/admin/properties"),
    enabled: tab === "properties",
    staleTime: 30_000,
  });

  const moderation = useQuery<ModerationCase[]>({
    queryKey: ["admin", "moderation"],
    queryFn: () => authApi<ModerationCase[]>("/admin/moderation"),
    enabled: tab === "moderation",
    staleTime: 30_000,
  });

  const audit = useQuery<AuditEntry[]>({
    queryKey: ["admin", "audit"],
    queryFn: () => authApi<AuditEntry[]>("/admin/audit"),
    enabled: tab === "audit",
    staleTime: 30_000,
  });

  const moderationAction = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      authApi(`/moderation/${id}/${action}`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "moderation"] }),
  });

  const tabs: { key: TabKey; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "users", label: "Users" },
    { key: "properties", label: "Properties" },
    { key: "moderation", label: "Moderation" },
    { key: "audit", label: "Audit log" },
  ];

  const activeError = overview.error ?? users.error ?? properties.error ?? moderation.error ?? audit.error;

  return (
    <main className="wrap section">
      <div className="sectionHead">
        <div>
          <div className="eyebrow">Platform control</div>
          <h1>Admin console</h1>
          <p className="muted">Protected platform administration. Admin or Moderator role required.</p>
        </div>
        <button
          className="btn ghost"
          onClick={() => qc.invalidateQueries({ queryKey: ["admin"] })}
        >
          ↻ Refresh
        </button>
      </div>

      {activeError && (
        <div className="notice error mt-4">
          {activeError instanceof Error ? activeError.message : "Access denied or server error"} ·{" "}
          <Link href="/login">Sign in with admin credentials</Link>
        </div>
      )}

      {/* Tab bar */}
      <div className="mt-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={"btn " + (tab === t.key ? "" : "ghost")}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === "overview" && (
        <div className="mt-6">
          {overview.isLoading && <div className="notice">Loading platform metrics…</div>}
          {overview.data && (
            <>
              <div className="stats">
                {[
                  ["Total users", overview.data.users?.total ?? "—"],
                  ["Published properties", overview.data.properties?.published ?? "—"],
                  ["Total bookings", overview.data.bookings?.total ?? "—"],
                  ["Revenue", overview.data.bookings?.revenue != null ? formatRwf(overview.data.bookings.revenue) : "—"],
                  ["Payments succeeded", overview.data.payments?.succeeded ?? "—"],
                ].map(([label, value]) => (
                  <div className="stat" key={String(label)}>
                    <span className="muted">{label}</span>
                    <b>{String(value)}</b>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-3">
                <div className="panel">
                  <div className="eyebrow">Users</div>
                  <h2>{overview.data.users?.total ?? 0}</h2>
                  <p className="muted">
                    {overview.data.users?.verified ?? 0} verified ·{" "}
                    {overview.data.users?.active ?? 0} active
                  </p>
                  <button className="btn ghost mt-3" onClick={() => setTab("users")}>
                    View all users →
                  </button>
                </div>
                <div className="panel">
                  <div className="eyebrow">Properties</div>
                  <h2>{overview.data.properties?.total ?? 0}</h2>
                  <p className="muted">
                    {overview.data.properties?.published ?? 0} published ·{" "}
                    {overview.data.properties?.pending ?? 0} pending
                  </p>
                  <button className="btn ghost mt-3" onClick={() => setTab("properties")}>
                    View all properties →
                  </button>
                </div>
                <div className="panel">
                  <div className="eyebrow">Moderation</div>
                  <p className="muted">Review flagged content and verification requests.</p>
                  <button className="btn ghost mt-3" onClick={() => setTab("moderation")}>
                    Open queue →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* USERS */}
      {tab === "users" && (
        <div className="mt-6">
          {users.isLoading && <div className="notice">Loading users…</div>}
          {users.data && (
            <div className="list">
              {users.data.map((u) => (
                <div className="row" key={u.id}>
                  <span>
                    <b>{u.fullName ?? "—"}</b>
                    <br />
                    <small className="muted">
                      {u.email ?? u.phone ?? "—"} ·{" "}
                      {(u.roles ?? []).join(", ") || "USER"} ·{" "}
                      {u.status ?? "—"}
                    </small>
                    {u.createdAt && (
                      <>
                        <br />
                        <small className="muted" style={{ fontSize: 11 }}>
                          Joined {shortDate(u.createdAt)}
                        </small>
                      </>
                    )}
                  </span>
                  <span className="pill">{u.status ?? "active"}</span>
                </div>
              ))}
              {!users.data.length && (
                <div className="empty">No users returned by the admin API.</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* PROPERTIES */}
      {tab === "properties" && (
        <div className="mt-6">
          {properties.isLoading && <div className="notice">Loading properties…</div>}
          {properties.data && (
            <div className="list">
              {properties.data.map((p) => (
                <div className="row" key={p.id}>
                  <span>
                    <b>
                      <Link href={`/properties/${p.id}`} className="font-bold">
                        {p.title ?? p.id}
                      </Link>
                    </b>
                    <br />
                    <small className="muted">
                      {p.district ?? "—"} · {p.status ?? "—"} · {p.verificationStatus ?? "—"}
                    </small>
                  </span>
                  <div className="actions">
                    <span className="pill">{p.verificationStatus ?? "—"}</span>
                    <Link href={`/properties/${p.id}`} className="btn ghost" style={{ fontSize: 13 }}>
                      View →
                    </Link>
                  </div>
                </div>
              ))}
              {!properties.data.length && (
                <div className="empty">No properties returned by the admin API.</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODERATION */}
      {tab === "moderation" && (
        <div className="mt-6">
          {moderation.isLoading && <div className="notice">Loading moderation queue…</div>}
          {moderation.data && (
            <div className="list">
              {moderation.data.map((m) => (
                <div className="row" key={m.id} style={{ flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
                  <span>
                    <b>{m.kind ?? "Case"}</b>
                    <br />
                    <small className="muted">
                      {m.subject_type ?? "—"}:{String(m.subject_id ?? "—").slice(0, 10)} ·{" "}
                      {m.created_at ? shortDate(m.created_at) : "—"}
                    </small>
                  </span>
                  <div className="actions">
                    <span className="pill">{m.status ?? "—"}</span>
                    {m.status === "PENDING" && (
                      <>
                        <button
                          className="btn"
                          style={{ fontSize: 13 }}
                          disabled={moderationAction.isPending}
                          onClick={() => void moderationAction.mutate({ id: m.id, action: "approve" })}
                        >
                          Approve
                        </button>
                        <button
                          className="btn ghost"
                          style={{ fontSize: 13 }}
                          disabled={moderationAction.isPending}
                          onClick={() => void moderationAction.mutate({ id: m.id, action: "reject" })}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {!moderation.data.length && (
                <div className="empty">No cases in the moderation queue.</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* AUDIT */}
      {tab === "audit" && (
        <div className="mt-6">
          {audit.isLoading && <div className="notice">Loading audit log…</div>}
          {audit.data && (
            <div className="list">
              {audit.data.map((a) => (
                <div className="row" key={a.id}>
                  <span>
                    <b>{a.action ?? "—"}</b>
                    <br />
                    <small className="muted">
                      {a.resourceType ?? "—"}:{String(a.resourceId ?? "—").slice(0, 10)} ·
                      User {String(a.userId ?? "—").slice(0, 8)}
                    </small>
                    {a.createdAt && (
                      <>
                        <br />
                        <small className="muted" style={{ fontSize: 11 }}>
                          {new Intl.DateTimeFormat("en-RW", {
                            dateStyle: "short",
                            timeStyle: "short",
                          }).format(new Date(a.createdAt))}
                        </small>
                      </>
                    )}
                  </span>
                </div>
              ))}
              {!audit.data.length && (
                <div className="empty">No audit entries returned.</div>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
