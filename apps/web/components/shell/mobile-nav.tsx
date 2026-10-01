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

  return (
    <nav
      aria-label="Mobile navigation"
      className="
        fixed bottom-0 left-0 right-0 z-40
        grid grid-cols-5
        border-t border-[var(--color-border)]
        bg-[var(--color-glass)]
        backdrop-blur-xl
        pb-[env(safe-area-inset-bottom)]
        md:hidden
      "
    >
      {ITEMS.map(({ href, label, Icon }) => {
        const active = pathname === href || (href !== "/" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={`
              flex min-h-[56px] flex-col items-center justify-center gap-[3px]
              px-1 py-2 text-[10px] font-[700] transition-colors duration-150
              ${active
                ? "text-[var(--color-primary)]"
                : "text-[var(--color-fg-subtle)] hover:text-[var(--color-fg-muted)]"}
            `}
          >
            <span className={`
              flex h-[28px] w-[28px] items-center justify-center rounded-[8px] transition-all duration-150
              ${active ? "bg-[var(--color-primary-soft)] scale-110" : ""}
            `}>
              <Icon size={active ? 20 : 18} strokeWidth={active ? 2.5 : 2} />
            </span>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
