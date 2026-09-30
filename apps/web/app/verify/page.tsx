"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input, Button } from "../../components/ui";
import { api } from "../../lib/api";

export const dynamic = "force-dynamic";

function VerifyContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const [email] = useState(sp.get("email") || "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, code, password }),
      });
      router.push("/login?reset=1");
    } catch (x) {
      setMsg(x instanceof Error ? x.message : "Password reset failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="wrap form">
      <div className="eyebrow">Verification</div>
      <h1>Choose a new password</h1>
      <p className="muted">
        Enter the six-digit code sent to {email || "your email"} and set a new password.
      </p>
      <form className="formGrid" onSubmit={submit}>
        <Input
          label="Recovery code"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          required
        />
        <Input
          label="New password"
          type="password"
          minLength={10}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {msg && <div className="notice error">{msg}</div>}
        <Button disabled={busy || code.length !== 6 || password.length < 10}>
          {busy ? "Resetting…" : "Reset password"}
        </Button>
      </form>
    </main>
  );
}

export default function Verify() {
  return (
    <Suspense
      fallback={
        <main className="wrap form">
          <div className="notice">Loading verification…</div>
        </main>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
