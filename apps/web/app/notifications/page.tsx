"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../../lib/api";
import Link from "next/link";
import { CheckCheck, Bell, ExternalLink } from "lucide-react";

type Notification = {
  id: string; type?: string; title?: string; body?: string; message?: string;
  read_at?: string | null; readAt?: string | null; createdAt?: string;
  data?: { bookingId?: string; propertyId?: string; threadId?: string; conversationId?: string };
};

function notifLink(n: Notification): string | null {
  const d = n.data ?? {};
  if (d.bookingId)                 return "/bookings";
  if (d.propertyId)                return `/properties/${d.propertyId}`;
  if (d.threadId || d.conversationId) return "/messages";
  return null;
}

const TYPE_ICON: Record<string, string> = {
  BOOKING_CREATED: "📅", BOOKING_CONFIRMED: "✅", BOOKING_CANCELLED: "❌",
  PAYMENT_RECEIVED: "💰", MESSAGE_RECEIVED: "💬", OFFER_RECEIVED: "🏷️",
  OFFER_ACCEPTED: "🎉", SAVED_SEARCH_MATCH: "🔔", VIEWING_CONFIRMED: "👁️", SYSTEM: "ℹ️",
};

export default function Notifications() {
  const qc = useQueryClient();

  const { data: notifications = [], isLoading, isError, error } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: () => authApi<Notification[]>("/notifications"),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const readAll = useMutation({
    mutationFn: () => authApi("/notifications/read-all", { method: "PATCH" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const readOne = useMutation({
    mutationFn: (id: string) => authApi(`/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unreadCount = notifications.filter(n => !n.read_at && !n.readAt).length;

  return (
    <main className="wrap section">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <div className="eyebrow mb-2">Updates</div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-[clamp(2rem,5vw,3.2rem)] font-[900] tracking-[-0.05em] leading-tight">
              Notifications.
            </h1>
            {unreadCount > 0 && (
              <span className="badge badge-green text-sm">{unreadCount} new</span>
            )}
          </div>
          <p className="text-[var(--color-fg-muted)] text-[15px]">
            Booking updates, messages, search matches and platform activity. Auto-refreshes every 30 s.
          </p>
        </div>
        <button
          className="btn ghost flex items-center gap-2 flex-shrink-0"
          onClick={() => void readAll.mutate()}
          disabled={readAll.isPending || unreadCount === 0}
        >
          <CheckCheck size={15} />
          {readAll.isPending ? "Marking…" : "Mark all read"}
        </button>
      </div>

      {isError && (
        <div className="alert alert-error mb-6 flex items-center gap-2">
          {error instanceof Error ? error.message : "Unable to load notifications"}
          <Link href="/login" className="ml-auto font-[700] underline">Sign in →</Link>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="panel animate-shimmer h-[76px]" />
          ))}
        </div>
      ) : notifications.length ? (
        <div className="flex flex-col gap-2">
          {notifications.map(n => {
            const isRead = !!(n.read_at || n.readAt);
            const href = notifLink(n);
            const icon = TYPE_ICON[n.type ?? ""] ?? "🔔";
            const formattedDate = n.createdAt
              ? new Intl.DateTimeFormat("en-RW", { dateStyle: "medium", timeStyle: "short" })
                  .format(new Date(n.createdAt))
              : null;

            const inner = (
              <div
                className={`
                  panel flex items-start gap-4 p-4 cursor-pointer transition-all
                  ${!isRead ? "border-[var(--color-primary)] shadow-[0_0_0_1px_var(--color-primary)]/20" : "opacity-75"}
                `}
                onClick={() => { if (!isRead) void readOne.mutate(n.id); }}
              >
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface-3)] text-xl leading-none">
                  {icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-[700] text-sm leading-tight">
                      {n.title ?? n.type ?? "Notification"}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!isRead && <span className="badge badge-green">New</span>}
                      {href && <ExternalLink size={13} className="text-[var(--color-fg-subtle)]" />}
                    </div>
                  </div>
                  {(n.body || n.message) && (
                    <p className="text-xs text-[var(--color-fg-muted)] mt-1 leading-relaxed">
                      {n.body ?? n.message}
                    </p>
                  )}
                  {formattedDate && (
                    <span className="text-[10px] text-[var(--color-fg-subtle)] font-[family-name:var(--font-mono)] mt-1 block">
                      {formattedDate}
                    </span>
                  )}
                </div>
              </div>
            );

            return href ? (
              <Link href={href} key={n.id} style={{ display: "contents" }}>{inner}</Link>
            ) : (
              <div key={n.id}>{inner}</div>
            );
          })}
        </div>
      ) : (
        !isError && (
          <div className="empty mt-4">
            <Bell size={32} className="text-[var(--color-fg-subtle)] mb-3 mx-auto" />
            <h3>No notifications yet</h3>
            <p>Booking updates, messages and search matches will appear here.</p>
          </div>
        )
      )}
    </main>
  );
}
