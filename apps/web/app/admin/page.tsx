"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
const API=process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
type Tab="overview"|"users"|"properties"|"moderation"|"audit";
async function load(path:string,token:string){const r=await fetch(API+path,{headers:{authorization:`Bearer ${token}`},cache:"no-store"});const b=await r.json().catch(()=>null);if(!r.ok)throw new Error(b?.message??b?.error??`Request failed: ${r.status}`);return b;}
export default function AdminPage(){
  const [tab,setTab]=useState<Tab>("overview"); const [data,setData]=useState<any>(null); const [error,setError]=useState("");
  const token=useMemo(()=>typeof window==="undefined"?"":localStorage.getItem("imizi_token")??"",[]);
  useEffect(()=>{if(!token){setError("Admin authentication required.");return;}let cancelled=false;setData(null);setError("");load(`/admin/${tab}`,token).then(v=>{if(!cancelled)setData(v)}).catch(e=>{if(!cancelled)setError(String(e))});return()=>{cancelled=true}},[tab,token]);
  return <main className="wrap" style={{paddingTop:28,paddingBottom:60}}>
    <div className="split"><div><span className="badge">ADMIN CONTROL CENTER</span><h1>Imizi operations</h1><p className="muted">Moderation, verification, fraud, users, properties and audit visibility.</p></div><div style={{textAlign:"right"}}><Link className="btn" href="/dashboard">Back to dashboard</Link></div></div>
    <div className="modes" style={{flexWrap:"wrap"}}>{(["overview","users","properties","moderation","audit"] as Tab[]).map(i=><button key={i} onClick={()=>setTab(i)} aria-pressed={tab===i}>{i.toUpperCase()}</button>)}</div>
    {error&&<div className="panel" style={{marginTop:18}}>{error} <Link href="/login">Sign in</Link></div>}
    {!error&&!data&&<div className="panel" style={{marginTop:18}}>Loading {tab}…</div>}
    {data&&tab==="overview"&&<section style={{marginTop:18}} className="stats">{Object.entries(data).slice(0,12).map(([k,v])=><div className="stat" key={k}><div className="muted">{k}</div><strong>{String(v)}</strong></div>)}</section>}
    {data&&tab==="users"&&<section className="panel" style={{marginTop:18,overflowX:"auto"}}><table className="table"><thead><tr><th>User</th><th>Status</th><th>Roles</th></tr></thead><tbody>{(data as any[]).map((u:any)=><tr key={u.id}><td>{u.full_name}<br/><span className="muted">{u.email}</span></td><td>{u.status}</td><td>{(u.roles??[]).join(", ")}</td></tr>)}</tbody></table></section>}
    {data&&tab==="properties"&&<section className="grid">{(data as any[]).map((p:any)=><article className="card" key={p?.id}><div className="meta"><span className="badge">{p?.verificationStatus??"UNVERIFIED"}</span><h3>{p?.title}</h3><p className="muted">{p?.district}, {p?.province}</p><p>{p?.propertyType} · {p?.status}</p><Link className="btn" href={`/properties/${p?.id}`}>Open</Link></div></article>)}</section>}
    {data&&tab==="moderation"&&<section style={{marginTop:18}} className="split"><div className="panel"><h3>Fraud cases</h3><pre style={{whiteSpace:"pre-wrap",overflowX:"auto"}}>{JSON.stringify(data.fraud,null,2)}</pre></div><div className="panel"><h3>Verification + reports</h3><pre style={{whiteSpace:"pre-wrap",overflowX:"auto"}}>{JSON.stringify({verifications:data.verifications,reports:data.reports},null,2)}</pre></div></section>}
    {data&&tab==="audit"&&<section className="panel" style={{marginTop:18,overflowX:"auto"}}><table className="table"><thead><tr><th>When</th><th>Action</th><th>Subject</th><th>Actor</th></tr></thead><tbody>{(data as any[]).map((r:any)=><tr key={r.id}><td>{new Date(r.created_at).toLocaleString()}</td><td>{r.action}</td><td>{r.subject_type}:{r.subject_id}</td><td>{r.actor_id??"system"}</td></tr>)}</tbody></table></section>}
  </main>;
}