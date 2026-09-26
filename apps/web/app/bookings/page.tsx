"use client";
import { useEffect, useState } from "react";
import { authApi } from "../../lib/api";
export default function Bookings(){
  const [items,setItems]=useState<any[]>([]); const [error,setError]=useState("");
  async function load(){try{setItems(await authApi<any[]>("/bookings"))}catch(e:any){setError(e.message)}}
  useEffect(()=>{void load()},[]);
  async function cancel(id:string){try{await authApi("/bookings/"+id+"/cancel",{method:"POST"});await load()}catch(e:any){setError(e.message)}}
  return <main className="wrap section">
    <div className="eyebrow">Transactions</div><h1>Bookings</h1>
    <p className="muted">Track upcoming and historical reservations from the live booking service.</p>
    {error&&<div className="notice error">{error}</div>}
    <div className="list">{items.map(b=><div className="row" key={b.id}>
      <span><b>Booking {String(b.id).slice(0,10)}…</b><br/><small className="muted">{b.startDate} → {b.endDate}</small></span>
      <div className="actions"><span className="pill">{b.status}</span>{b.status!=="CANCELLED"&&<button className="btn ghost" onClick={()=>void cancel(b.id)}>Cancel</button>}</div>
    </div>)}</div>
    {!items.length&&!error&&<div className="empty"><h3>No bookings yet</h3><p>Created reservations will appear here.</p></div>}
  </main>;
}