"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2, Mail, Phone, User, Lock, CheckCircle,
  ShieldCheck, Eye, EyeOff, ArrowRight, Sparkles,
  Check, X,
} from "lucide-react";
import { api } from "../../lib/api";
import { Input, Button } from "../../components/ui";

const s = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email:    z.string().email("Enter a valid email address"),
  phone:    z.string().regex(/^\+?[0-9]{10,20}$/, "Use a valid phone number (+250…)"),
  password: z.string().min(10, "Password must be at least 10 characters"),
});
type F = z.infer<typeof s>;

const PERKS = [
  "Free to create & browse listings",
  "Verified properties only",
  "Secure RWF, USD & more payments",
  "Cross-device sync & notifications",
  "Real-time booking management",
];

function PasswordStrength({ pw }: { pw: string }) {
  const checks = useMemo(() => [
    { label: "10+ characters",       pass: pw.length >= 10 },
    { label: "Uppercase letter",      pass: /[A-Z]/.test(pw) },
    { label: "Lowercase letter",      pass: /[a-z]/.test(pw) },
    { label: "Number",                pass: /[0-9]/.test(pw) },
  ], [pw]);

  const score = checks.filter(c => c.pass).length;
  const levels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "var(--color-danger)", "var(--color-accent)", "var(--color-info)", "var(--color-success)"];

  if (!pw) return null;

  return (
    <div className="auth-pw-strength">
      <div className="auth-pw-bars">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="auth-pw-bar"
            style={{ background: i <= score ? colors[score] : "var(--color-border)" }}
          />
        ))}
        <span style={{ color: colors[score], fontSize: 11, fontWeight: 800 }}>{levels[score]}</span>
      </div>
      <div className="auth-pw-checks">
        {checks.map(({ label, pass }) => (
          <span key={label} className={`auth-pw-check ${pass ? "pass" : ""}`}>
            {pass ? <Check size={10} /> : <X size={10} />}
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Register() {
  const [message, setMessage] = useState("");
  const [showPw, setShowPw] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<F>({
    resolver: zodResolver(s),
  });

  const watchedPw = watch("password", "");

  const submit = async (v: F) => {
    setMessage("");
    try {
      await api("/auth/register", { method: "POST", headers: {"X-Imizi-Session":"cookie"}, body: JSON.stringify(v) });
      setMessage("Account created. Sign in to continue.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Registration failed. Please try again.");
    }
  };

  const isSuccess = message.startsWith("Account created");

  return (
    <div className="auth-page">
      {/* ── Left: Brand Panel ── */}
      <div className="auth-brand-panel">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />

        <div className="auth-brand-top">
          <div className="auth-logo">
            <Building2 size={22} />
          </div>
          <span className="auth-brand-name">IMIZI</span>
          <span className="auth-brand-tag">Rwanda</span>
        </div>

        <div className="auth-brand-body">
          <div className="auth-eyebrow-pill">
            <Sparkles size={11} />
            <span>Free to join — no credit card needed</span>
          </div>
          <h2 className="auth-brand-h2">
            One account.{" "}
            <span className="auth-brand-h2-accent">Unlimited possibilities.</span>
          </h2>
          <p className="auth-brand-lead">
            Create one account for property discovery, saved homes, messaging, bookings, payments and property operations.
          </p>

          <div className="auth-features">
            {PERKS.map(p => (
              <div key={p} className="auth-feature-row">
                <div className="auth-feature-icon">
                  <ShieldCheck size={13} />
                </div>
                <span>{p}</span>
              </div>
            ))}
          </div>
        </div>


      </div>

      {/* ── Right: Form Panel ── */}
      <div className="auth-form-panel">
        <div className="auth-form-inner">
          {/* Mobile logo */}
          <div className="auth-mobile-logo">
            <div className="auth-logo auth-logo-sm">
              <Building2 size={18} />
            </div>
            <span className="auth-brand-name">IMIZI</span>
          </div>

          <div className="auth-form-head">
            <div className="eyebrow mb-2">Join Imizi</div>
            <h1 className="auth-form-title">Create your account.</h1>
            <p className="auth-form-sub">
              Search, save, book and manage properties across Rwanda — free forever.
            </p>
          </div>

          {/* Success state */}
          {isSuccess ? (
            <div className="auth-success-card">
              <div className="auth-success-icon">
                <CheckCircle size={32} />
              </div>
              <h3>Account created!</h3>
              <p>Your account is ready. Sign in to start exploring properties.</p>
              <Link href="/login" className="auth-submit-btn" style={{ textAlign: "center" }}>
                Go to sign in <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit(submit)} noValidate>
              {/* Full name */}
              <div className="field-group">
                <label className="field-label">
                  <User size={13} />
                  Full name
                </label>
                <Input
                  placeholder="Jean-Pierre Habimana"
                  autoComplete="name"
                  {...register("fullName")}
                  error={errors.fullName?.message}
                />
              </div>

              {/* Email */}
              <div className="field-group">
                <label className="field-label">
                  <Mail size={13} />
                  Email address
                </label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...register("email")}
                  error={errors.email?.message}
                />
              </div>

              {/* Phone */}
              <div className="field-group">
                <label className="field-label">
                  <Phone size={13} />
                  Phone number
                </label>
                <Input
                  placeholder="+250 7XX XXX XXX"
                  inputMode="tel"
                  autoComplete="tel"
                  {...register("phone")}
                  error={errors.phone?.message}
                />
              </div>

              {/* Password */}
              <div className="field-group">
                <label className="field-label">
                  <Lock size={13} />
                  Password
                </label>
                <div className="auth-pw-wrap">
                  <Input
                    type={showPw ? "text" : "password"}
                    placeholder="Min. 10 characters"
                    autoComplete="new-password"
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
                <PasswordStrength pw={watchedPw} />
              </div>

              {message && !isSuccess && (
                <div className="alert alert-error flex items-start gap-2">
                  <span className="flex-shrink-0">⚠️</span>
                  <span>{message}</span>
                </div>
              )}

              <Button disabled={isSubmitting} className="auth-submit-btn">
                {isSubmitting ? (
                  <span className="auth-spinner" />
                ) : (
                  <>Create free account <ArrowRight size={16} /></>
                )}
              </Button>

              <p className="auth-legal">
                By creating an account you agree to our{" "}
                <Link href="/legal/terms">Terms of Service</Link> and{" "}
                <Link href="/legal/privacy">Privacy Policy</Link>.
              </p>
            </form>
          )}

          {/* Sign in link */}
          {!isSuccess && (
            <>
              <div className="auth-divider">
                <span>Already have an account?</span>
              </div>
              <Link href="/login" className="auth-register-cta">
                Sign in instead
                <ArrowRight size={15} />
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
