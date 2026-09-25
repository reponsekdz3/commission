"use client";

import { useEffect,useState } from "react";
import Link from "next/link";
import { formatRwf } from "../../lib/api";

const API=process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export default function DashboardPage(){
  const [data,setData]=useState<any>(null);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(true);
  const [user,setUser]=useState<any>(null);

  useEffect(()=>{
    try{
      const raw=localStorage.getItem("imizi_user");if(raw)setUser(JSON.parse(raw));
    }catch{}
    const token=localStorage.getItem("imizi_token");
    if(!token){setError("Please sign in first.");setLoading(false);return;}
    fetch(API+"/analytics/landlord",{headers:{authorization:`Bearer ${token}`}})
      .then(async r=>{const j=await r.json();if(!r.ok)throw new Error(j.message??"Unauthorized");return j;})
      .then(setData)
      .catch(e=>setError(String(e)))
      .finally(()=>setLoading(false));
  },[]);

  if(loading)return <main className="wrap" style={{paddingTop:28}}><p>Loading dashboard…</p></main>;

  return (
    <main className="wrap" style={{paddingTop:28}}>
      <div className="split">
        <div>
          <h1>Owner / operations</h1>
          <p className="muted">{user?.fullName ?? "Account"} · {user?.roles?.join(", ") ?? ""}</p>
        </div>
        <div style={{textAlign:"right"}}>
          <Link className="btn" href="/admin">Admin</Link>
        </div>
      </div>
      {error && <div className="panel">{error} <Link href="/login">Sign in</Link></div>}
      {data && <div className="stats">
        <div className="stat"><div className="muted">Properties</div><strong>{data.properties}</strong></div>
        <div className="stat"><div className="muted">Active</div><strong>{data.active}</strong></div>
        <div className="stat"><div className="muted">Views</div><strong>{data.views}</strong></div>
        <div className="stat"><div className="muted">Bookings</div><strong>{data.bookings}</strong></div>
        <div className="stat"><div className="muted">Revenue</div><strong>{formatRwf(data.revenue ?? 0)}</strong></div>
      </div>}
      <p className="muted" style={{marginTop:24}}>Property operations are backed by PostgreSQL in production.</p>
    </main>
  );
}
