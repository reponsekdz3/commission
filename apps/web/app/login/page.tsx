"use client";

import { useState } from "react";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("tenant@imizi.rw");
  const [password, setPassword] = useState("ChangeMe!2026");
  const [out, setOut] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("http://localhost:4000/api/v1/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });
    const json = await res.json();
    if (json.accessToken) {
      localStorage.setItem("imizi_token", json.accessToken);
      setOut(`Signed in as ${json.user.fullName} (${json.user.roles.join(", ")})`);
    } else setOut(JSON.stringify(json));
  }
  return (
    <main className="wrap" style={{ maxWidth: 480, paddingTop: 48 }}>
      <h1>Sign in</h1>
      <p className="muted">Demo accounts: tenant@imizi.rw, landlord@imizi.rw, admin@imizi.rw, agent@imizi.rw — password ChangeMe!2026</p>
      <form onSubmit={submit} className="panel">
        <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} style={{ width: "100%", padding: 12, marginBottom: 8 }} />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", padding: 12, marginBottom: 8 }} />
        <button className="btn" type="submit">Continue</button>
        <p>{out}</p>
      </form>
    </main>
  );
}
