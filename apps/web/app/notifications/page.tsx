"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../../lib/api";
import Link from "next/link";

type Notification = {
  id: string;
  type?: string;
  title?: string;
  body?: string;
  message?: string;
  read_at?: string | null;
  readAt?: string | null;
  createdAt?: string;
  data?: {
    bookingId?: string;
    propertyId?: string;
    threadId?: string;
    conversationId?: string;
  };
};

function notifLink(n: Notification): string | null {
  const d = n.data ?? {};
  if (d.bookingId) return `/bookings`;
  if (d.propertyId) return `/properties/${d.propertyId}`;
  if (d.threadId || d.conversationId) return `/messages`;
  return null;
}

const TYPE_ICON: Record<string, string> = {
  BOOKING_CREATED: "📅",
  BOOKING_CONFIRMED: "✅",
  BOOKING_CANCELLED: "❌",
  PAYMENT_RECEIVED: "💰",
  MESSAGE_RECEIVED: "💬",
  OFFER_RECEIVED: "🏷️",
  OFFER_ACCEPTED: "🎉",
  SAVED_SEARCH_MATCH: "🔔",
  VIEWING_CONFIRMED: "👁️",
  SYSTEM: "ℹ️",
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

  const unreadCount = notifications.filter((n) => !n.read_at && !n.readAt).length;

  return (
    <main className="wrap section">
      <div className="sectionHead">
        <div>
          <div className="eyebrow">Updates</div>
          <h1>
            Notifications
            {unreadCount > 0 && (
              <span
                className="ml-3 text-base font-semibold px-2 py-0.5 rounded-full"
                style={{ background: "var(--color-primary)", color: "var(--color-primary-fg)" }}
              >
                {unreadCount} new
              </span>
            )}
          </h1>
          <p className="muted">
            Account-backed notifications from bookings, messages, saved searches and platform
            activity. Auto-refreshes every 30 s.
          </p>
        </div>
        <button
          className="btn ghost"
          onClick={() => void readAll.mutate()}
          disabled={readAll.isPending || unreadCount === 0}
        >
          {readAll.isPending ? "Marking…" : "Mark all read"}
        </button>
      </div>

      {isError && (
        <div className="notice error mt-4">
          {error instanceof Error ? error.message : "Unable to load notifications"} ·{" "}
          <Link href="/login">Sign in</Link>
        </div>
      )}

      {isLoading ? (
        <div className="list mt-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="row animate-pulse">
              <div className="flex-1">
                <div className="h-4 bg-[var(--color-surface-3)] rounded w-56 mb-2" />
                <div className="h-3 bg-[var(--color-surface-3)] rounded w-40" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length ? (
        <div className="list mt-6">
          {notifications.map((n) => {
            const isRead = !!(n.read_at || n.readAt);
            const href = notifLink(n);
            const icon = TYPE_ICON[n.type ?? ""] ?? "🔔";

            const content = (
              <div
                className={"row " + (!isRead ? "ring-1 ring-[var(--color-primary)]/30" : "")}
                key={n.id}
                style={{ cursor: href ? "pointer" : "default", opacity: isRead ? 0.72 : 1 }}
                onClick={() => {
                  if (!isRead) void readOne.mutate(n.id);
                }}
              >
                <span style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 20, lineHeight: 1 }}>{icon}</span>
                  <span>
                    <b>{n.title ?? n.type ?? "Notification"}</b>
                    <br />
                    <small className="muted">{n.body ?? n.message ?? ""}</small>
                    {n.createdAt && (
                      <>
                        <br />
                        <small className="muted" style={{ fontSize: 11 }}>
                          {new Intl.DateTimeFormat("en-RW", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(n.createdAt))}
                        </small>
                      </>
                    )}
                  </span>
                </span>
                <span className="muted" style={{ flexShrink: 0, fontSize: 12 }}>
                  {isRead ? "Read" : "New"}
                </span>
              </div>
            );

            return href ? (
              <Link href={href} key={n.id} style={{ display: "contents" }}>
                {content}
              </Link>
            ) : (
              <div key={n.id}>{content}</div>
            );
          })}
        </div>
      ) : (
        !isError && (
          <div className="empty mt-6">
            <h3>No notifications yet</h3>
            <p>Booking updates, messages and search matches will appear here.</p>
          </div>
        )
      )}
    </main>
  );
}
