"use client";

import { useState } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export default function LoginPage() {
  const [identifier,setIdentifier]=useState("tenant@imizi.rw");
  const [password,setPassword]=useState("ChangeMe!2026");
  const [out,setOut]=useState("");
  const [loading,setLoading]=useState(false);

  async function submit(e:React.FormEvent){
    e.preventDefault(); setLoading(true); setOut("");
    try{
      const res=await fetch(API+"/auth/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({identifier,password})});
      const json=await res.json();
      if(!res.ok||!json.accessToken){setOut(json.message ?? json.error ?? "Login failed");return;}
      localStorage.setItem("imizi_token",json.accessToken);
      localStorage.setItem("imizi_refresh",json.refreshToken);
      localStorage.setItem("imizi_user",JSON.stringify(json.user));
      setOut(`Signed in as ${json.user.fullName}`);
      window.location.href="/dashboard";
    }catch(error){setOut(String(error));}
    finally{setLoading(false);}
  }

  return (
    <main className="wrap" style={{maxWidth:480,paddingTop:48}}>
      <h1>Sign in</h1>
      <p className="muted">Use your own account. Demo accounts exist only for development.</p>
      <form onSubmit={submit} className="panel">
        <input value={identifier} onChange={e=>setIdentifier(e.target.value)} placeholder="Email or phone" style={{width:"100%",padding:12,marginBottom:8}} />
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" style={{width:"100%",padding:12,marginBottom:8}} />
        <button className="btn" type="submit" disabled={loading}>{loading?"Signing in…":"Continue"}</button>
        <p className="muted">{out}</p>
      </form>
      <p className="muted"><Link href="/">← Back home</Link></p>
    </main>
  );
}
