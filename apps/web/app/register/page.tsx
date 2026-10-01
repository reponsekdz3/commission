"use client";
import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Mail, Phone, User, Lock, CheckCircle, ShieldCheck } from "lucide-react";
import { api } from "../../lib/api";
import { Input, Button } from "../../components/ui";

const s = z.object({
  fullName: z.string().min(2),
  email:    z.string().email(),
  phone:    z.string().regex(/^\+?[0-9]{10,20}$/, "Use a valid phone number"),
  password: z.string().min(10, "Password must be at least 10 characters"),
});
type F = z.infer<typeof s>;

export default function Register() {
  const [message, setMessage] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<F>({
    resolver: zodResolver(s),
  });

  const submit = async (v: F) => {
    try {
      await api("/auth/register", { method: "POST", body: JSON.stringify(v) });
      setMessage("Account created. Sign in to continue.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Registration failed");
    }
  };

  const isSuccess = message.startsWith("Account created");

  return (
    <div className="min-h-[calc(100vh-73px)] grid lg:grid-cols-2">
      {/* Left panel */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, var(--color-primary-deep), #0a7352)" }}
      >
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #34D399, transparent 70%)" }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <Building2 size={20} className="text-white" />
            </span>
            <span className="font-[family-name:var(--font-display)] text-xl font-[900] tracking-[.14em] text-white">IMIZI</span>
          </div>
          <h2 className="text-4xl font-[900] tracking-[-0.06em] text-white leading-tight mb-4">
            One account. Unlimited property possibilities.
          </h2>
          <p className="text-white/70 text-[15px] leading-relaxed max-w-sm">
            Free to join. Search and shortlist immediately. Booking, offers and payments activate once you&apos;re in.
          </p>
        </div>
        <div className="relative z-10 flex flex-col gap-3">
          {["Free to create & browse", "Verified listings only", "Secure RWF payments", "Cross-device sync"].map(f => (
            <div key={f} className="flex items-center gap-3">
              <ShieldCheck size={16} className="text-emerald-300 flex-shrink-0" />
              <span className="text-white/80 text-sm font-[600]">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[460px]">
          <div className="mb-8">
            <div className="eyebrow mb-3">Join Imizi</div>
            <h1 className="text-[clamp(2rem,5vw,2.8rem)] font-[900] tracking-[-0.06em] mb-2">
              Create your account.
            </h1>
            <p className="text-[var(--color-fg-muted)] text-sm leading-relaxed">
              Search, save, book and manage properties across Rwanda from one account.
            </p>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit(submit)}>
            <div className="field-group">
              <label className="field-label flex items-center gap-2"><User size={13} /> Full name</label>
              <Input {...register("fullName")} error={errors.fullName?.message} />
            </div>
            <div className="field-group">
              <label className="field-label flex items-center gap-2"><Mail size={13} /> Email</label>
              <Input type="email" {...register("email")} error={errors.email?.message} />
            </div>
            <div className="field-group">
              <label className="field-label flex items-center gap-2"><Phone size={13} /> Phone</label>
              <Input placeholder="+250…" {...register("phone")} error={errors.phone?.message} />
            </div>
            <div className="field-group">
              <label className="field-label flex items-center gap-2"><Lock size={13} /> Password</label>
              <Input type="password" {...register("password")} error={errors.password?.message} />
              <span className="field-hint">Minimum 10 characters</span>
            </div>

            {message && (
              <div className={`alert ${isSuccess ? "alert-info flex items-center gap-2" : "alert-error"}`}>
                {isSuccess && <CheckCircle size={16} className="flex-shrink-0" />}
                {message}
                {isSuccess && (
                  <Link href="/login" className="ml-auto font-[700] underline">Sign in →</Link>
                )}
              </div>
            )}

            {!isSuccess && (
              <Button disabled={isSubmitting} className="w-full justify-center mt-1" style={{ minHeight: 48, fontSize: 15 }}>
                {isSubmitting ? "Creating account…" : "Create account"}
              </Button>
            )}
          </form>

          <p className="mt-6 text-sm text-center text-[var(--color-fg-muted)] border-t border-[var(--color-border)] pt-5">
            Already have an account?{" "}
            <Link href="/login" className="font-[700] text-[var(--color-primary)] hover:underline">Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
