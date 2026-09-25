"use client";

import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export function BookingPanel({
  listingId,
  propertyId,
  listingType,
  landlordId,
}: {
  listingId: string;
  propertyId: string;
  listingType: string;
  landlordId?: string;
}) {
  const [quote, setQuote] = useState<any>(null);
  const [result, setResult] = useState("");
  const [startDate, setStartDate] = useState("2026-10-01");
  const [endDate, setEndDate] = useState("2026-11-01");
  const [offer, setOffer] = useState("105000000");

  async function authed(path: string, init?: RequestInit) {
    const token = localStorage.getItem("imizi_token");
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
    });
    return res.json();
  }

  async function loadQuote() {
    const q = await fetch(`${API}/bookings/quote`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ listingId, startDate, endDate }),
    }).then((r) => r.json());
    setQuote(q);
    return q;
  }

  async function bookAndPay() {
    await loadQuote();
    const booking = await authed("/bookings", {
      method: "POST",
      body: JSON.stringify({
        listingId,
        startDate,
        endDate,
        guests: 1,
        idempotencyKey: `web-${Date.now()}`,
      }),
    });
    if (booking.message || booking.error) {
      setResult(JSON.stringify(booking));
      return;
    }
    const pay = await authed("/payments/intents", {
      method: "POST",
      body: JSON.stringify({
        bookingId: booking.booking.id,
        provider: "MTN_MOMO",
        msisdn: "+250780000002",
        idempotencyKey: `pay-${Date.now()}`,
      }),
    });
    setResult(`Booking ${booking.booking.status} → payment ${pay.status}. Server is the authority, not this phone.`);
  }

  async function chat() {
    const msg = await authed("/messages", {
      method: "POST",
      body: JSON.stringify({
        propertyId,
        recipientId: landlordId,
        body: "I'm interested in this property. When can we view?",
      }),
    });
    setResult(msg.id ? "Message sent to owner." : JSON.stringify(msg));
  }

  async function viewing() {
    const slots = await authed(`/viewings/slots/${listingId}`);
    const open = (Array.isArray(slots) ? slots : []).find((s: any) => s.available);
    if (!open) {
      setResult("No Saturday slots left.");
      return;
    }
    const booked = await authed("/viewings", {
      method: "POST",
      body: JSON.stringify({ listingId, slotStart: open.slotStart }),
    });
    setResult(booked.id ? `Viewing requested ${open.slotStart}` : JSON.stringify(booked));
  }

  async function sendOffer() {
    const created = await authed("/offers", {
      method: "POST",
      body: JSON.stringify({ listingId, amountMinor: Number(offer), currency: "RWF" }),
    });
    setResult(created.id ? `Offer ${created.status} for ${offer} RWF` : JSON.stringify(created));
  }

  return (
    <div>
      <label className="muted">Start</label>
      <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 8 }} />
      <label className="muted">End</label>
      <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 8 }} />
      <button className="btn" onClick={bookAndPay} style={{ width: "100%", marginBottom: 8 }}>
        {listingType === "SALE" ? "Start purchase flow" : "Rent / Pay with MoMo"}
      </button>
      <button className="btn" style={{ width: "100%", background: "#1b1612", marginBottom: 8 }} onClick={viewing}>
        Book viewing
      </button>
      <button className="btn" style={{ width: "100%", background: "#b85c38", marginBottom: 8 }} onClick={chat}>
        Chat owner
      </button>
      {listingType === "SALE" && (
        <>
          <input value={offer} onChange={(e) => setOffer(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 8 }} />
          <button className="btn" style={{ width: "100%" }} onClick={sendOffer}>
            Submit offer
          </button>
        </>
      )}
      {quote && (
        <div className="muted" style={{ marginTop: 12 }}>
          Base {quote.base.amountMinor} {quote.base.currency}<br />
          Deposit {quote.deposit.amountMinor}<br />
          Service fee {quote.serviceFee.amountMinor}<br />
          <strong>Total {quote.total.amountMinor} {quote.total.currency}</strong>
        </div>
      )}
      <p className="muted">{result}</p>
    </div>
  );
}
