"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2, Search, Map, Heart, MessageCircle,
  Plus, Menu, X,
} from "lucide-react";
import { ThemeToggle } from "../theme-toggle";
import { CommandPalette } from "./command-palette";
import { NotificationsBell } from "./notifications-bell";
import { UserMenu } from "./user-menu";
import { restoreSession } from "../../lib/api";

const NAV_LINKS = [
  { href: "/search",   label: "Discover",    icon: Search },
  { href: "/map",      label: "Map",         icon: Map },
  { href: "/compare",  label: "Compare",     icon: Heart },
  { href: "/messages", label: "Inbox",       icon: MessageCircle },
] as const;

export function Topbar() {
  const pathname = usePathname();
  const [u, setU] = useState<{ fullName?: string; email?: string } | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const hideOnAuth = ["/login", "/register", "/forgot", "/verify"].some(
    p => pathname === p || pathname.startsWith(p + "/")
  );

  useEffect(() => {
    try { setU(JSON.parse(sessionStorage.getItem("imizi_user") || localStorage.getItem("imizi_user") || "null")); } catch {}
    void restoreSession().then(() => {
      try { setU(JSON.parse(sessionStorage.getItem("imizi_user") || "null")); } catch {}
    });
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // close mobile menu on route change
  useEffect(() => setMobileOpen(false), [pathname]);

  if (hideOnAuth) return null;

  return (
    <>
      <header
        role="banner"
        className={`
          nav wrap transition-shadow duration-300
          ${scrolled ? "shadow-[var(--shadow-2)]" : ""}
        `}
      >
        {/* ── Brand ── */}
        <Link href="/" aria-label="Imizi home" className="flex items-center gap-2 no-underline flex-shrink-0">
          <span className="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-[10px] bg-[var(--color-primary)] text-[var(--color-primary-fg)] shadow-[var(--shadow-glow-primary)]">
            <Building2 size={17} />
          </span>
          <span className="font-[family-name:var(--font-display)] text-[17px] font-[900] tracking-[.12em] text-[var(--color-primary)]">
            IMIZI
          </span>
          <span className="hidden sm:inline-flex items-center rounded-full bg-[var(--color-primary-soft)] px-[7px] py-[3px] font-[family-name:var(--font-mono)] text-[9px] font-[700] text-[var(--color-primary)]">
            RW
          </span>
        </Link>

        {/* ── Desktop nav ── */}
        <nav aria-label="Primary navigation" className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`
                  navBtn relative flex items-center gap-[6px]
                  ${active ? "text-[var(--color-primary)] bg-[var(--color-primary-soft)]" : ""}
                `}
              >
                <Icon size={14} aria-hidden />
                {label}
                {active && (
                  <span className="absolute -bottom-[1px] left-3 right-3 h-[2px] rounded-full bg-[var(--color-primary)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── Right controls ── */}
        <div className="flex items-center gap-1.5">
          <div className="hidden lg:flex items-center gap-1.5">
            <CommandPalette />
            <ThemeToggle />
            <NotificationsBell />
          </div>

          {u ? (
            <UserMenu user={u} />
          ) : (
            <Link href="/login" className="navCta hidden sm:inline-flex" style={{ marginLeft: 4 }}>
              Sign in
            </Link>
          )}

          <Link
            href="/manage"
            className="navCta hidden sm:inline-flex items-center gap-[6px]"
            style={{ marginLeft: 4 }}
          >
            <Plus size={14} aria-hidden /> List property
          </Link>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden navBtn"
            onClick={() => setMobileOpen(v => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div
          className="
            lg:hidden fixed inset-x-0 top-[72px] z-40
            border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]
            p-4 shadow-[var(--shadow-3)] backdrop-blur-xl
          "
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`
                    flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-[700] transition-colors
                    ${active
                      ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                      : "text-[var(--color-fg-soft)] hover:bg-[var(--color-surface-3)]"}
                  `}
                >
                  <Icon size={18} aria-hidden />
                  {label}
                </Link>
              );
            })}
            <div className="mt-2 flex items-center gap-2 border-t border-[var(--color-border)] pt-3">
              <ThemeToggle />
              <NotificationsBell />
              {!u && (
                <Link href="/login" className="btn flex-1 justify-center text-center">
                  Sign in
                </Link>
              )}
              <Link href="/manage" className="btn flex-1 justify-center text-center gap-[5px]">
                <Plus size={14} /> List
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
