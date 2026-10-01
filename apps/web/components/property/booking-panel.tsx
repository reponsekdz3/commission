"use client";
import { Calendar, Users, ArrowRight } from "lucide-react";
import { Magnetic } from "../motion/magnetic";
import { Button } from "../ui";
import Link from "next/link";

export function BookingPanel({ listingId }: { listingId: string }) {
  return (
    <div className="booking-card">
      <p className="section-title" style={{ marginBottom: 16 }}>Request a viewing or book</p>
      <div className="form-grid">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div className="field-group">
            <label className="field-label" htmlFor="bp-start"><Calendar size={13} style={{ display: "inline", marginRight: 4 }} />Check-in</label>
            <input id="bp-start" className="field" type="date" style={{ marginTop: 4 }} />
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="bp-end"><Calendar size={13} style={{ display: "inline", marginRight: 4 }} />Check-out</label>
            <input id="bp-end" className="field" type="date" style={{ marginTop: 4 }} />
          </div>
        </div>
        <div className="field-group">
          <label className="field-label" htmlFor="bp-guests"><Users size={13} style={{ display: "inline", marginRight: 4 }} />Guests</label>
          <input id="bp-guests" className="field" type="number" min="1" defaultValue="1" style={{ marginTop: 4 }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "8px 0", borderTop: "1px solid var(--color-border)" }}>
          <span className="muted">Estimated total</span>
          <strong>Calculated at checkout</strong>
        </div>
        <Magnetic>
          <Button asChild className="w-full" style={{ justifyContent: "center", gap: 8 }}>
            <Link href={"/booking/new?listingId=" + listingId}>
              Continue to booking <ArrowRight size={16} />
            </Link>
          </Button>
        </Magnetic>
        <div style={{ display: "flex", gap: 8 }}>
          <Button asChild variant="ghost" style={{ flex: 1, justifyContent: "center", fontSize: 13 }}>
            <Link href={"/offers/new?listingId=" + listingId}>Make an offer</Link>
          </Button>
          <Button asChild variant="ghost" style={{ flex: 1, justifyContent: "center", fontSize: 13 }}>
            <Link href={"/viewings/new?listingId=" + listingId}>Request viewing</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
