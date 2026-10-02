"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Heart, MessageCircle, User } from "lucide-react";

const ITEMS = [
  { href: "/",          label: "Home",    Icon: Home },
  { href: "/search",    label: "Search",  Icon: Search },
  { href: "/favorites", label: "Saved",   Icon: Heart },
  { href: "/messages",  label: "Inbox",   Icon: MessageCircle },
  { href: "/workspace", label: "Account", Icon: User },
] as const;

export function MobileNav() {
  const pathname = usePathname();
  const hide = ["/login", "/register", "/forgot", "/verify"].some(
    p => pathname === p || pathname.startsWith(p + "/")
  );
  if (hide) return null;

  return (
    <nav
      aria-label="Mobile navigation"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        display: "grid",
        gridTemplateColumns: "repeat(5,1fr)",
        borderTop: "1px solid var(--color-border)",
        background: "var(--color-glass)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        paddingBottom: "env(safe-area-inset-bottom,0px)",
      }}
      className="lg:hidden"
    >
      {ITEMS.map(({ href, label, Icon }) => {
        const active = pathname === href || (href !== "/" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              minHeight: 56,
              padding: "8px 4px",
              fontSize: 10,
              fontWeight: 700,
              color: active ? "var(--color-primary)" : "var(--color-fg-subtle)",
              textDecoration: "none",
              transition: "color .15s",
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 28,
                borderRadius: 8,
                background: active ? "var(--color-primary-soft)" : "transparent",
                transform: active ? "scale(1.1)" : "scale(1)",
                transition: "all .15s",
              }}
            >
              <Icon size={active ? 20 : 18} strokeWidth={active ? 2.5 : 2} />
            </span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
