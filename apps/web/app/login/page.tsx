"use client";
import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Lock, Mail, ShieldCheck } from "lucide-react";
import { api } from "../../lib/api";
import { Input, Button } from "../../components/ui";

const schema = z.object({
  identifier: z.string().min(1),
  password:   z.string().min(1),
  mfaCode:    z.string().optional(),
});
type F = z.infer<typeof schema>;

export default function Login() {
  const [msg, setMsg] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<F>({
    resolver: zodResolver(schema),
  });

  async function submit(v: F) {
    try {
      const d = await api<{ accessToken: string; refreshToken: string; user: unknown }>(
        "/auth/login", { method: "POST", body: JSON.stringify(v) }
      );
      localStorage.setItem("imizi_token",   d.accessToken);
      localStorage.setItem("imizi_refresh",  d.refreshToken);
      localStorage.setItem("imizi_user",     JSON.stringify(d.user));
      location.href = "/dashboard";
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Sign in failed");
    }
  }

  return (
    <div className="min-h-[calc(100vh-73px)] grid lg:grid-cols-2">
      {/* Left: brand panel */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, var(--color-primary-deep), #0a7352)" }}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #34D399, transparent 70%)" }} />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #FBBF24, transparent 70%)" }} />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              <Building2 size={20} className="text-white" />
            </span>
            <span className="font-[family-name:var(--font-display)] text-xl font-[900] tracking-[.14em] text-white">
              IMIZI
            </span>
          </div>
          <h2 className="text-4xl font-[900] tracking-[-0.06em] text-white leading-tight mb-4">
            Rwanda&apos;s most connected property platform.
          </h2>
          <p className="text-white/70 text-[15px] leading-relaxed max-w-sm">
            Search verified homes, book viewings, make offers, pay securely and manage your portfolio — all from one account.
          </p>
        </div>

        <div className="relative z-10 flex flex-col gap-3">
          {["Verified listings", "Secure payments in RWF", "Real-time bookings", "Owner dashboard"].map(f => (
            <div key={f} className="flex items-center gap-3">
              <ShieldCheck size={16} className="text-emerald-300 flex-shrink-0" />
              <span className="text-white/80 text-sm font-[600]">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[420px]">
          <div className="mb-8">
            <div className="eyebrow mb-3">Secure account</div>
            <h1 className="text-[clamp(2rem,5vw,2.8rem)] font-[900] tracking-[-0.06em] mb-2">
              Welcome back.
            </h1>
            <p className="text-[var(--color-fg-muted)] text-sm leading-relaxed">
              Access your saved homes, bookings, messages and property workspace.
            </p>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit(submit)}>
            <div className="field-group">
              <label className="field-label flex items-center gap-2">
                <Mail size={13} /> Email or phone
              </label>
              <Input autoComplete="username" {...register("identifier")} error={errors.identifier?.message} />
            </div>
            <div className="field-group">
              <label className="field-label flex items-center gap-2">
                <Lock size={13} /> Password
              </label>
              <Input type="password" autoComplete="current-password" {...register("password")} error={errors.password?.message} />
            </div>
            <div className="field-group">
              <label className="field-label">MFA code <span className="text-[var(--color-fg-subtle)]">(optional)</span></label>
              <Input inputMode="numeric" {...register("mfaCode")} />
            </div>

            {msg && (
              <div className="alert alert-error flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5">⚠️</span>
                <span>{msg}</span>
              </div>
            )}

            <Button disabled={isSubmitting} className="w-full justify-center mt-1" style={{ minHeight: 48, fontSize: 15 }}>
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 flex justify-between text-sm border-t border-[var(--color-border)] pt-5">
            <Link className="text-[var(--color-fg-muted)] hover:text-[var(--color-primary)] transition-colors" href="/forgot">
              Forgot password?
            </Link>
            <Link className="font-[700] text-[var(--color-primary)] hover:underline" href="/register">
              Create account →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
