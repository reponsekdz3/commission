"use client";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi, formatRwf, shortDate } from "../../lib/api";

type Lease = {
  id: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  rentAmountMinor?: number;
  currency?: string;
  tenant_signature_hash?: string;
  landlord_signature_hash?: string;
  property?: { id?: string; title?: string; district?: string };
  tenantId?: string;
  landlordId?: string;
};

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "var(--color-muted)",
  PENDING_SIGNATURE: "var(--color-warning, #F59E0B)",
  ACTIVE: "var(--color-success)",
  COMPLETED: "var(--color-primary)",
  TERMINATED: "var(--color-danger)",
};

export default function Leases() {
  const qc = useQueryClient();

  const { data: leases = [], isLoading, isError, error } = useQuery<Lease[]>({
    queryKey: ["leases"],
    queryFn: () => authApi<Lease[]>("/leases"),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const sign = useMutation({
    mutationFn: (id: string) => authApi(`/leases/${id}/sign`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leases"] }),
  });

  return (
    <main className="wrap section">
      <div className="sectionHead">
        <div>
          <div className="eyebrow mb-2">Rental lifecycle</div>
          <h1 className="page-heading">Leases.</h1>
          <p className="page-sub">
            Sign and manage tenancy agreements from the live lease service. Each party signs independently
            with their authenticated account.
          </p>
        </div>
      </div>

      {isError && (
        <div className="notice error mt-4">
          {error instanceof Error ? error.message : "Unable to load leases"}
        </div>
      )}

      {sign.isError && (
        <div className="notice error mt-4">
          {sign.error instanceof Error ? sign.error.message : "Signing failed"}
        </div>
      )}

      {isLoading ? (
        <div className="list mt-6">
          {[1, 2].map((i) => (
            <div key={i} className="row animate-pulse">
              <div className="flex-1">
                <div className="h-4 bg-[var(--color-surface-3)] rounded w-48 mb-2" />
                <div className="h-3 bg-[var(--color-surface-3)] rounded w-32" />
              </div>
            </div>
          ))}
        </div>
      ) : leases.length ? (
        <>
          {/* Summary bar */}
          <div className="stats mt-4">
            {[
              ["Total", leases.length],
              ["Active", leases.filter((l) => l.status === "ACTIVE").length],
              ["Pending signature", leases.filter((l) => l.status === "PENDING_SIGNATURE").length],
            ].map(([label, value]) => (
              <div className="stat" key={String(label)}>
                <span className="muted">{label}</span>
                <b>{value}</b>
              </div>
            ))}
          </div>

          <div className="list mt-6">
            {leases.map((l) => (
              <div className="row" key={l.id}>
                <span style={{ flex: 1 }}>
                  <b>{l.property?.title ?? `Lease ${l.id.slice(0, 10)}…`}</b>
                  <br />
                  <small className="muted">
                    {l.startDate ? shortDate(l.startDate) : "—"}
                    {l.endDate ? ` → ${shortDate(l.endDate)}` : ""}
                    {l.rentAmountMinor ? ` · ${formatRwf(l.rentAmountMinor)}/mo` : ""}
                  </small>
                  <br />
                  <small className="muted">
                    Tenant signed: {l.tenant_signature_hash ? "✓" : "Pending"} ·{" "}
                    Landlord signed: {l.landlord_signature_hash ? "✓" : "Pending"}
                  </small>
                </span>
                <div className="actions">
                  <span
                    className="pill"
                    style={{ color: STATUS_COLOR[l.status ?? ""] ?? "inherit" }}
                  >
                    {l.status ?? "—"}
                  </span>
                  {l.status !== "COMPLETED" && l.status !== "TERMINATED" && (
                    <button
                      className="btn"
                      style={{ fontSize: 13, padding: "6px 14px" }}
                      disabled={sign.isPending}
                      onClick={() => void sign.mutate(l.id)}
                    >
                      {sign.isPending && sign.variables === l.id ? "Signing…" : "Sign"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        !isError && (
          <div className="empty mt-6">
            <h3>No leases yet</h3>
            <p>Your tenancy agreements will appear here once created by the backend.</p>
          </div>
        )
      )}
    </main>
  );
}
