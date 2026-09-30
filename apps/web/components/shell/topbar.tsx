"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Map, Heart, MessageCircle, Building2 } from "lucide-react";
import { ThemeToggle } from "../theme-toggle";
import { CommandPalette } from "./command-palette";
import { NotificationsBell } from "./notifications-bell";
import { UserMenu } from "./user-menu";

export function Topbar() {
  const [u, setU] = useState<{ fullName?: string } | null>(null);

  useEffect(() => {
    try { setU(JSON.parse(localStorage.getItem("imizi_user") || "null")); } catch {}
  }, []);

  return (
    <header className="nav wrap">
      <Link className="brand brandModern" href="/">
        <span className="brandMark"><Building2 size={16} /></span>
        <span className="brandName">IMIZI</span>
        <span className="brandCountry">RW</span>
      </Link>
      <nav aria-label="Primary">
        <Link href="/search"><Search size={15} />Discover</Link>
        <Link href="/map"><Map size={15} />Map</Link>
        <Link href="/compare"><Heart size={15} />Compare</Link>
        <Link href="/messages"><MessageCircle size={15} />Inbox</Link>
        <CommandPalette />
        <ThemeToggle />
        <NotificationsBell />
        {u ? <UserMenu user={u} /> : <Link className="navCta" href="/login">Sign in</Link>}
        <Link className="navCta hidden sm:inline-flex" href="/manage"><Plus size={16} />List property</Link>
      </nav>
    </header>
  );
}