"use client";

import { useEffect,useState } from "react";
import Link from "next/link";
import { formatRwf } from "../../lib/api";

const API=process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export default function AdminPage(){
  const [data,setData]=useState<any>(null);
  const [moderation,setModeration]=useState<any>(null);
  const [error,setError]=useState("");
  useEffect(()=>{
    const token=localStorage.getItem("imizi_token");
    if(!token){setError("Sign in with an admin account.");return;}
    const h={authorization:`Bearer ${token}`};
    Promise.all([
      fetch(API+"/admin/overview",{headers:h}).then(async r=>{const j=await r.json();if(!r.ok)throw new Error(j.message??j.error??"Forbidden");return j;}),
      fetch(API+"/admin/moderation",{headers:h}).then(async r=>{const j=await r.json();if(!r.ok)throw new Error(j.message??j.error??"Forbidden");return j;}),
    ]).then(([overview,queue])=>{setData(overview);setModeration(queue);}).catch(e=>setError(String(e)));
  },[]);
  return (
    <main className="wrap" style={{paddingTop:28}}>
      <div className="split"><div><h1>Admin control center</h1><p className="muted">Users · properties · bookings · payments · verification · fraud · audit.</p></div><Link href="/dashboard">Dashboard</Link></div>
      {error && <div className="panel">{error}</div>}
      {data && <div className="stats">
        <div className="stat"><div className="muted">Users</div><strong>{data.users}</strong></div>
        <div className="stat"><div className="muted">Properties</div><strong>{data.properties}</strong></div>
        <div className="stat"><div className="muted">Listings</div><strong>{data.listings}</strong></div>
        <div className="stat"><div className="muted">Bookings</div><strong>{data.bookings}</strong></div>
        <div className="stat"><div className="muted">Paid volume</div><strong>{formatRwf(data.paidVolume ?? 0)}</strong></div>
        <div className="stat"><div className="muted">Fraud cases</div><strong>{data.fraud}</strong></div>
      </div>}
      {moderation && <div className="grid" style={{marginTop:28}}>
        <div className="panel"><h3>Verification queue</h3><p>{moderation.verifications?.filter((x:any)=>x.status==="UNDER_REVIEW").length ?? 0} pending</p></div>
        <div className="panel"><h3>Fraud</h3><p>{moderation.fraud?.length ?? 0} cases</p></div>
        <div className="panel"><h3>Reports</h3><p>{moderation.reports?.length ?? 0} reports</p></div>
      </div>}
    </main>
  );
}
