"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2, Lock, ShieldCheck, ArrowRight, ArrowLeft, Sparkles, KeyRound,
} from "lucide-react";
import { Input, Button } from "../../components/ui";
import { api } from "../../lib/api";

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
    setMsg("");
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
    <div className="auth-page">
      <div className="auth-brand-panel">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />

        <div className="auth-brand-top">
          <div className="auth-logo"><Building2 size={22} /></div>
          <span className="auth-brand-name">IMIZI</span>
          <span className="auth-brand-tag">Rwanda</span>
        </div>

        <div className="auth-brand-body">
          <div className="auth-eyebrow-pill">
            <Sparkles size={11} />
            <span>OTP verification</span>
          </div>
          <h2 className="auth-brand-h2">
            Almost there.{" "}
            <span className="auth-brand-h2-accent">Set a new password.</span>
          </h2>
          <p className="auth-brand-lead">
            Enter the six-digit code we sent and choose a strong password to secure your account again.
          </p>
          <div className="auth-features">
            {[
              "Code expires for security",
              "Minimum 10-character password",
              "Immediate return to sign in",
            ].map(label => (
              <div key={label} className="auth-feature-row">
                <div className="auth-feature-icon"><ShieldCheck size={13} /></div>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="auth-social-proof">
          <div className="auth-proof-item"><strong>OTP</strong><span>Verified</span></div>
          <div className="auth-proof-item"><strong>10+</strong><span>Char password</span></div>
          <div className="auth-proof-item"><strong>Instant</strong><span>Access restore</span></div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-inner">
          <div className="auth-mobile-logo">
            <div className="auth-logo auth-logo-sm"><Building2 size={18} /></div>
            <span className="auth-brand-name">IMIZI</span>
          </div>

          <div className="auth-form-head">
            <div className="eyebrow mb-2">Verification</div>
            <h1 className="auth-form-title">Choose a new password.</h1>
            <p className="auth-form-sub">
              Enter the six-digit code sent to {email || "your email"} and set a new password.
            </p>
          </div>

          <form className="auth-form" onSubmit={submit} noValidate>
            <div className="field-group">
              <label className="field-label"><KeyRound size={13} /> Recovery code</label>
              <Input
                inputMode="numeric"
                maxLength={6}
                placeholder="6-digit code"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
                required
              />
            </div>

            <div className="field-group">
              <label className="field-label"><Lock size={13} /> New password</label>
              <Input
                type="password"
                minLength={10}
                autoComplete="new-password"
                placeholder="Min. 10 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {msg && (
              <div className="alert alert-error flex items-start gap-2">
                <span className="flex-shrink-0">⚠️</span>
                <span>{msg}</span>
              </div>
            )}

            <Button
              disabled={busy || code.length !== 6 || password.length < 10}
              className="auth-submit-btn"
            >
              {busy ? <span className="auth-spinner" /> : <>Reset password <ArrowRight size={16} /></>}
            </Button>
          </form>

          <div className="auth-divider"><span>Need a new code?</span></div>
          <Link href="/forgot" className="auth-register-cta">
            <ArrowLeft size={15} /> Request another code
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Verify() {
  return (
    <Suspense
      fallback={
        <div className="auth-page">
          <div className="auth-form-panel" style={{ gridColumn: "1 / -1" }}>
            <div className="auth-form-inner">
              <div className="alert alert-info">Loading verification…</div>
            </div>
          </div>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
