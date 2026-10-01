"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2, Mail, ArrowRight, ArrowLeft, Sparkles, ShieldCheck,
} from "lucide-react";
import { api } from "../../lib/api";
import { Input, Button } from "../../components/ui";

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      await api("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
      router.push("/verify?email=" + encodeURIComponent(email));
    } catch (x) {
      setMsg(x instanceof Error ? x.message : "Request failed");
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
            <span>Secure account recovery</span>
          </div>
          <h2 className="auth-brand-h2">
            Locked out?{" "}
            <span className="auth-brand-h2-accent">We have you covered.</span>
          </h2>
          <p className="auth-brand-lead">
            We will email a short-lived recovery code so you can set a new password and get back to your workspace.
          </p>
          <div className="auth-features">
            {[
              "Time-limited six-digit recovery codes",
              "Works with the same production account",
              "Encrypted end-to-end password reset",
            ].map(label => (
              <div key={label} className="auth-feature-row">
                <div className="auth-feature-icon"><ShieldCheck size={13} /></div>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="auth-social-proof">
          <div className="auth-proof-item"><strong>6</strong><span>Digit code</span></div>
          <div className="auth-proof-item"><strong>Fast</strong><span>Email delivery</span></div>
          <div className="auth-proof-item"><strong>Safe</strong><span>OTP verified</span></div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-inner">
          <div className="auth-mobile-logo">
            <div className="auth-logo auth-logo-sm"><Building2 size={18} /></div>
            <span className="auth-brand-name">IMIZI</span>
          </div>

          <div className="auth-form-head">
            <div className="eyebrow mb-2">Account recovery</div>
            <h1 className="auth-form-title">Reset password.</h1>
            <p className="auth-form-sub">
              Enter the email on your Imizi account. We will send a time-limited six-digit recovery code.
            </p>
          </div>

          <form className="auth-form" onSubmit={submit} noValidate>
            <div className="field-group">
              <label className="field-label"><Mail size={13} /> Email address</label>
              <Input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            {msg && (
              <div className="alert alert-error flex items-start gap-2">
                <span className="flex-shrink-0">⚠️</span>
                <span>{msg}</span>
              </div>
            )}

            <Button disabled={busy || !email} className="auth-submit-btn">
              {busy ? <span className="auth-spinner" /> : <>Send recovery code <ArrowRight size={16} /></>}
            </Button>
          </form>

          <div className="auth-divider"><span>Remembered it?</span></div>
          <Link href="/login" className="auth-register-cta">
            <ArrowLeft size={15} /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
