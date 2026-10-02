"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2, Lock, Mail, ShieldCheck, Eye, EyeOff,
  ArrowRight, Sparkles, MapPin, TrendingUp, Users,
} from "lucide-react";
import { api, signInSession } from "../../lib/api";
import { Input, Button } from "../../components/ui";

const schema = z.object({
  identifier: z.string().min(1, "Email or phone is required"),
  password:   z.string().min(1, "Password is required"),
  mfaCode:    z.string().optional(),
});
type F = z.infer<typeof schema>;

const FEATURES = [
  { icon: MapPin,      label: "Canonical Rwanda location catalog" },
  { icon: ShieldCheck, label: "Secure RWF-first payment integrations" },
  { icon: TrendingUp,  label: "Realtime booking and owner analytics" },
  { icon: Users,       label: "Persisted messaging and notifications" },
];

const SOCIAL_PROOF = [
  { stat: "RW", label: "Rwanda-first" },
  { stat: "RWF", label: "Native pricing" },
  { stat: "LIVE", label: "Backend data" },
];

export default function Login() {
  const [msg, setMsg] = useState("");
  const [info, setInfo] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showMfa, setShowMfa] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<F>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    try {
      if (new URLSearchParams(window.location.search).get("reset") === "1") {
        setInfo("Password updated. Sign in with your new password.");
      }
      const last = localStorage.getItem("imizi_last_identifier");
      if (last) setValue("identifier", last);
    } catch { /* ignore */ }
  }, [setValue]);

  async function submit(v: F) {
    setMsg("");
    try {
      localStorage.setItem("imizi_last_identifier", v.identifier.trim());
      const payload: Record<string, string> = {
        identifier: v.identifier.trim(),
        password: v.password,
      };
      if (v.mfaCode && /^\d{6}$/.test(v.mfaCode)) payload.mfaCode = v.mfaCode;
      const d = await api<{ accessToken: string; user: unknown }>(
        "/auth/login",
        { method: "POST", headers: { "X-Imizi-Client": "web" }, body: JSON.stringify(payload) }
      );
      await signInSession(d.accessToken,d.user);
      location.href = "/dashboard";
    } catch (e) {
      const text = e instanceof Error ? e.message : "Sign in failed. Please try again.";
      if (/mfa|multi-factor|authenticator/i.test(text)) setShowMfa(true);
      setMsg(text);
    }
  }

  return (
    <div className="auth-page">
      {/* ── Left: Brand Panel ── */}
      <div className="auth-brand-panel">
        {/* Decorative orbs */}
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />

        {/* Logo */}
        <div className="auth-brand-top">
          <div className="auth-logo">
            <Building2 size={22} />
          </div>
          <span className="auth-brand-name">IMIZI</span>
          <span className="auth-brand-tag">Rwanda</span>
        </div>

        {/* Headline */}
        <div className="auth-brand-body">
          <div className="auth-eyebrow-pill">
            <Sparkles size={11} />
            <span>Rwanda-first property platform</span>
          </div>
          <h2 className="auth-brand-h2">
            Your next home is{" "}
            <span className="auth-brand-h2-accent">one click away.</span>
          </h2>
          <p className="auth-brand-lead">
            Search, shortlist, book viewings, make offers and pay securely — all from one trusted account.
          </p>

          {/* Feature list */}
          <div className="auth-features">
            {FEATURES.map(({ icon: Icon, label }) => (
              <div key={label} className="auth-feature-row">
                <div className="auth-feature-icon">
                  <Icon size={13} />
                </div>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Social proof strip */}
        <div className="auth-social-proof">
          {SOCIAL_PROOF.map(({ stat, label }) => (
            <div key={label} className="auth-proof-item">
              <strong>{stat}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: Form Panel ── */}
      <div className="auth-form-panel">
        <div className="auth-form-inner">
          {/* Mobile logo (only shows < lg) */}
          <div className="auth-mobile-logo">
            <div className="auth-logo auth-logo-sm">
              <Building2 size={18} />
            </div>
            <span className="auth-brand-name">IMIZI</span>
          </div>

          {/* Heading */}
          <div className="auth-form-head">
            <div className="eyebrow mb-2">Secure account access</div>
            <h1 className="auth-form-title">Welcome back.</h1>
            <p className="auth-form-sub">
              Access your saved homes, bookings, messages and property workspace.
            </p>
          </div>

          {/* Form */}
          <form className="auth-form" onSubmit={handleSubmit(submit)} noValidate>
            {/* Email / phone */}
            <div className="field-group">
              <label className="field-label">
                <Mail size={13} />
                Email or phone number
              </label>
              <Input
                autoComplete="username"
                placeholder="name@example.com or +250…"
                {...register("identifier")}
                error={errors.identifier?.message}
              />
            </div>

            {/* Password */}
            <div className="field-group">
              <div className="auth-label-row">
                <label className="field-label">
                  <Lock size={13} />
                  Password
                </label>
                <Link href="/forgot" className="auth-forgot-link">
                  Forgot password?
                </Link>
              </div>
              <div className="auth-pw-wrap">
                <Input
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Your password"
                  {...register("password")}
                  error={errors.password?.message}
                />
                <button
                  type="button"
                  className="auth-pw-toggle"
                  onClick={() => setShowPw(p => !p)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* MFA toggle */}
            <div className="auth-mfa-toggle">
              <button
                type="button"
                className="auth-mfa-btn"
                onClick={() => setShowMfa(p => !p)}
              >
                <ShieldCheck size={13} />
                {showMfa ? "Hide" : "I have an"} MFA code
              </button>
            </div>

            {showMfa && (
              <div className="field-group auth-mfa-field">
                <label className="field-label">
                  <ShieldCheck size={13} />
                  Authenticator code
                </label>
                <Input
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit code"
                  {...register("mfaCode")}
                />
              </div>
            )}

            {/* Error */}
            {msg && (
              <div className="alert alert-error flex items-start gap-2">
                <span className="flex-shrink-0">⚠️</span>
                <span>{msg}</span>
              </div>
            )}

            {/* Submit */}
            <Button
              disabled={isSubmitting}
              className="auth-submit-btn"
            >
              {isSubmitting ? (
                <span className="auth-spinner" />
              ) : (
                <>Sign in <ArrowRight size={16} /></>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="auth-divider">
            <span>New to Imizi?</span>
          </div>

          {/* Register CTA */}
          <Link href="/register" className="auth-register-cta">
            Create a free account
            <ArrowRight size={15} />
          </Link>

          <p className="auth-legal">
            By signing in you agree to our{" "}
            <Link href="/legal/terms">Terms of Service</Link> and{" "}
            <Link href="/legal/privacy">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
