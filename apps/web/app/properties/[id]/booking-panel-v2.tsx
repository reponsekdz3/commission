"use client";

import { useState } from "react";

const API=process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export function BookingPanel({listingId,propertyId,listingType,landlordId}:{listingId:string;propertyId:string;listingType:string;landlordId?:string;}){
  const [quote,setQuote]=useState<any>(null);
  const [result,setResult]=useState("");
  const [startDate,setStartDate]=useState(()=>new Date(Date.now()+86400000).toISOString().slice(0,10));
  const [endDate,setEndDate]=useState(()=>new Date(Date.now()+30*86400000).toISOString().slice(0,10));
  const [msisdn,setMsisdn]=useState("+250780000002");
  const [offer,setOffer]=useState("105000000");
  const [provider,setProvider]=useState("FLUTTERWAVE");

  async function request(path:string,init:RequestInit={}){
    const token=localStorage.getItem("imizi_token");
    if(!token){setResult("Please sign in first.");throw new Error("auth_required");}
    const res=await fetch(API+path,{...init,headers:{"content-type":"application/json",authorization:`Bearer ${token}`,...(init.headers??{})}});
    const json=await res.json();
    if(!res.ok)throw new Error(json.message??json.error??`API ${res.status}`);
    return json;
  }

  async function loadQuote(){
    const res=await fetch(API+"/bookings/quote",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({listingId,startDate,endDate})});
    const q=await res.json();if(!res.ok){setResult(q.message??"Quote failed");return null;}
    setQuote(q);return q;
  }

  async function bookAndPay(){
    try{
      if(listingType==="SALE"){setResult("For-sale properties use an offer flow, not a rental booking.");return;}
      const q=await loadQuote();if(!q)return;
      const booking=await request("/bookings",{method:"POST",body:JSON.stringify({listingId,startDate,endDate,guests:1,idempotencyKey:`web-booking-${listingId}-${startDate}-${endDate}`})});
      const pay=await request("/payments/intents",{method:"POST",body:JSON.stringify({bookingId:booking.booking.id,provider,msisdn:provider==="MTN_MOMO"?msisdn:undefined,idempotencyKey:"web-payment-"+booking.booking.id})});
      if(pay.checkoutUrl)window.location.href=pay.checkoutUrl;
      else setResult("Booking "+booking.booking.status+" → payment "+pay.status+". Complete the provider prompt, then query payment status.");
    }catch(e){setResult(String(e));}
  }

  async function chat(){try{const msg=await request("/messages",{method:"POST",body:JSON.stringify({propertyId,recipientId:landlordId,body:"I'm interested in this property. When can we view?"})});setResult(msg.id?"Message sent to owner.":JSON.stringify(msg));}catch(e){setResult(String(e));}}
  async function viewing(){try{const slots=await request(`/viewings/slots/${listingId}`);const open=(Array.isArray(slots)?slots:[]).find((s:any)=>s.available);if(!open){setResult("No viewing slots available.");return;}const booked=await request("/viewings",{method:"POST",body:JSON.stringify({listingId,slotStart:open.slotStart})});setResult(booked.id?`Viewing requested ${open.slotStart}`:JSON.stringify(booked));}catch(e){setResult(String(e));}}
  async function sendOffer(){try{const created=await request("/offers",{method:"POST",body:JSON.stringify({listingId,amountMinor:Number(offer),currency:"RWF"})});setResult(created.id?`Offer ${created.status} for ${offer} RWF`:JSON.stringify(created));}catch(e){setResult(String(e));}}

  return <div>
    {listingType!=="SALE"&&<>
      <label className="muted">Start</label>
      <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={{width:"100%",padding:8,marginBottom:8}}/>
      <label className="muted">End</label>
      <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} style={{width:"100%",padding:8,marginBottom:8}}/>
      <select value={provider} onChange={e=>setProvider(e.target.value)} style={{width:"100%",padding:8,marginBottom:8}}><option value="FLUTTERWAVE">Card / Mobile Money checkout</option><option value="MTN_MOMO">MTN MoMo direct</option><option value="CARD">Card checkout</option></select>
      {provider==="MTN_MOMO"&&<input value={msisdn} onChange={e=>setMsisdn(e.target.value)} placeholder="MTN MoMo phone" style={{width:"100%",padding:8,marginBottom:8}}/>}
      <button className="btn" onClick={bookAndPay} style={{width:"100%",marginBottom:8}}>Rent / Pay with MoMo</button>
    </>}
    <button className="btn" style={{width:"100%",background:"#1b1612",marginBottom:8}} onClick={viewing}>Book viewing</button>
    <button className="btn" style={{width:"100%",background:"#b85c38",marginBottom:8}} onClick={chat}>Chat owner</button>
    {listingType==="SALE"&&<>
      <input value={offer} onChange={e=>setOffer(e.target.value)} style={{width:"100%",padding:8,marginBottom:8}}/>
      <button className="btn" style={{width:"100%"}} onClick={sendOffer}>Submit offer</button>
    </>}
    {quote&&<div className="muted" style={{marginTop:12}}>Base {quote.base.amountMinor} {quote.base.currency}<br/>Deposit {quote.deposit.amountMinor}<br/>Service fee {quote.serviceFee.amountMinor}<br/><strong>Total {quote.total.amountMinor} {quote.total.currency}</strong></div>}
    <p className="muted">{result}</p>
  </div>;
}
