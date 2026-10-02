"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../../lib/api";

type MaintenanceRequest = {
  id: string;
  title: string;
  description?: string;
  status?: string;
  propertyId?: string;
  property?: { id?: string; title?: string };
  createdAt?: string;
  updatedAt?: string;
};

type OwnedProperty = { id: string; title: string; district?: string };

const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CANCELLED"];

const STATUS_COLOR: Record<string, string> = {
  OPEN: "var(--color-warning, #F59E0B)",
  IN_PROGRESS: "var(--color-primary)",
  RESOLVED: "var(--color-success)",
  CANCELLED: "var(--color-muted)",
};

export default function Maintenance() {
  const qc = useQueryClient();
  const [f, setF] = useState({ propertyId: "", title: "", description: "" });
  const [filter, setFilter] = useState("ALL");

  const { data: requests = [], isLoading, isError, error } = useQuery<MaintenanceRequest[]>({
    queryKey: ["maintenance"],
    queryFn: () => authApi<MaintenanceRequest[]>("/maintenance"),
    staleTime: 30_000,
  });

  const { data: properties = [] } = useQuery<OwnedProperty[]>({
    queryKey: ["owned-properties"],
    queryFn: () => authApi<OwnedProperty[]>("/properties/owned"),
    staleTime: 300_000,
  });

  const create = useMutation({
    mutationFn: () =>
      authApi("/maintenance", {
        method: "POST",
        body: JSON.stringify(f),
      }),
    onSuccess: () => {
      setF({ propertyId: "", title: "", description: "" });
      qc.invalidateQueries({ queryKey: ["maintenance"] });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      authApi(`/maintenance/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maintenance"] }),
  });

  const filtered =
    filter === "ALL" ? requests : requests.filter((r) => r.status === filter);

  return (
    <main className="wrap section">
      <div className="sectionHead">
        <div>
          <div className="eyebrow mb-2">Property operations</div>
          <h1 className="page-heading">Maintenance.</h1>
          <p className="page-sub">
            Create and track property maintenance requests. Status transitions are persisted
            and visible to all parties.
          </p>
        </div>
      </div>

      {(isError || create.isError || update.isError) && (
        <div className="notice error mt-4">
          {(isError ? error : create.isError ? create.error : update.error) instanceof Error
            ? ((isError ? error : create.isError ? create.error : update.error) as Error).message
            : "An error occurred"}
        </div>
      )}

      <div className="two mt-6">
        {/* Create form */}
        <form
          className="panel formGrid"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <div>
            <div className="eyebrow">New request</div>
            <h2>Report an issue</h2>
          </div>

          {/* Property selector — driven from the API */}
          {properties.length > 0 ? (
            <select
              className="field"
              required
              value={f.propertyId}
              onChange={(e) => setF({ ...f, propertyId: e.target.value })}
            >
              <option value="">Select a property</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}{p.district ? ` · ${p.district}` : ""}
                </option>
              ))}
            </select>
          ) : (
            <input
              className="field"
              placeholder="Property ID"
              required
              value={f.propertyId}
              onChange={(e) => setF({ ...f, propertyId: e.target.value })}
            />
          )}

          <input
            className="field"
            placeholder="Issue title"
            required
            value={f.title}
            onChange={(e) => setF({ ...f, title: e.target.value })}
          />
          <textarea
            className="field"
            placeholder="Describe the issue in detail…"
            required
            rows={4}
            value={f.description}
            onChange={(e) => setF({ ...f, description: e.target.value })}
          />
          <button
            className="btn"
            disabled={create.isPending || !f.propertyId || !f.title || !f.description}
          >
            {create.isPending ? "Creating…" : "Create request"}
          </button>
          {create.isSuccess && (
            <div className="notice" style={{ color: "var(--color-success)" }}>
              Request created successfully.
            </div>
          )}
        </form>

        {/* Request list */}
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {["ALL", ...STATUSES].map((s) => (
              <button
                key={s}
                className={"chip " + (filter === s ? "active" : "")}
                onClick={() => setFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="list">
              {[1, 2].map((i) => (
                <div key={i} className="row animate-pulse">
                  <div className="h-4 bg-[var(--color-surface-3)] rounded w-48" />
                </div>
              ))}
            </div>
          ) : filtered.length ? (
            <div className="list">
              {filtered.map((m) => (
                <div className="row" key={m.id} style={{ flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span>
                      <b>{m.title}</b>
                      <br />
                      <small className="muted">
                        {m.property?.title ?? (m.propertyId ? `Property ${m.propertyId.slice(0, 8)}` : "—")}
                      </small>
                      {m.description && (
                        <>
                          <br />
                          <small className="muted">{m.description}</small>
                        </>
                      )}
                    </span>
                    <span
                      className="pill"
                      style={{ color: STATUS_COLOR[m.status ?? ""] ?? "inherit", flexShrink: 0 }}
                    >
                      {m.status ?? "—"}
                    </span>
                  </div>
                  <div className="actions">
                    {STATUSES.filter((s) => s !== m.status).map((s) => (
                      <button
                        key={s}
                        className="btn ghost"
                        style={{ fontSize: 12, padding: "4px 10px" }}
                        disabled={update.isPending}
                        onClick={() => void update.mutate({ id: m.id, status: s })}
                      >
                        {s.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !isError && (
              <div className="empty">
                <h3>No maintenance requests</h3>
                <p>Create a request using the form.</p>
              </div>
            )
          )}
        </div>
      </div>
    </main>
  );
}
