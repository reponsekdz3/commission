"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import confetti from "canvas-confetti";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { authApi } from "../../lib/api";
import { trackEvent } from "../../lib/analytics";
import { Button, Input, Progress } from "../../components/ui";

export const dynamic = "force-dynamic";

const schema = z.object({
  provider: z.enum(["MTN_MOMO", "FLUTTERWAVE", "CARD"]),
  msisdn: z.string().optional(),
});
type Form = z.infer<typeof schema>;

function PaymentsContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const [step, setStep] = useState(1);
  const [result, setResult] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string>("");
  const [confirmed, setConfirmed] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { provider: "MTN_MOMO" },
  });

  const provider = watch("provider");

  async function submit(v: Form) {
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    setBusy(true);
    trackEvent("payment_start", { provider: v.provider });
    try {
      const bookingId = sp.get("bookingId");
      if (!bookingId) throw new Error("A bookingId is required.");
      const r = await authApi<{ id?: string; status?: string; checkoutUrl?: string }>(
        "/payments/intents",
        {
          method: "POST",
          body: JSON.stringify({
            bookingId,
            provider: v.provider,
            msisdn: v.msisdn,
            idempotencyKey: crypto.randomUUID(),
          }),
        }
      );
      setResult(
        r.status === "SUCCEEDED"
          ? "Payment confirmed"
          : r.checkoutUrl
          ? "Continue in the secure provider checkout"
          : "Payment request created"
      );
      setCheckoutUrl(r.checkoutUrl || "");
      setStep(4);
      if (r.checkoutUrl) {
        setTimeout(() => window.location.assign(r.checkoutUrl!), 500);
        return;
      }
      if (r.id) {
        for (let i = 0; i < 8; i++) {
          await new Promise((resolve) => setTimeout(resolve, 2500));
          try {
            const s = await authApi<{ status?: string }>("/payments/" + r.id + "/status", {
              method: "POST",
            });
            if (s.status === "SUCCEEDED") {
              setConfirmed(true);
              trackEvent("payment_complete", { provider: v.provider });
              setResult("Payment confirmed");
              confetti({ particleCount: 120, spread: 75, origin: { y: 0.6 } });
              setTimeout(() => router.push("/payments/" + r.id + "/receipt"), 900);
              break;
            }
            if (s.status === "FAILED" || s.status === "EXPIRED") {
              setResult("Payment was not completed.");
              break;
            }
          } catch {}
        }
      }
    } catch (e) {
      setResult(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="wrap section max-w-2xl">
      <div className="eyebrow">Secure checkout</div>
      <h1>Complete payment</h1>
      <Progress value={step * 25} />
      <div className="mt-6 panel">
        {step === 1 && (
          <div className="space-y-3">
            <h2>Choose method</h2>
            {["MTN_MOMO", "FLUTTERWAVE", "CARD"].map((x) => (
              <label
                key={x}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--color-border)] p-4"
              >
                <input type="radio" value={x} {...register("provider")} />
                <span className="font-bold">
                  {x === "MTN_MOMO" ? "MTN MoMo" : x === "FLUTTERWAVE" ? "Flutterwave" : "Card"}
                </span>
              </label>
            ))}
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <h2>Details</h2>
            {provider === "MTN_MOMO" && (
              <Input
                label="MoMo number"
                {...register("msisdn")}
                error={errors.msisdn?.message}
              />
            )}
            <p className="muted">
              Provider credentials and payment secrets stay on the backend.
            </p>
          </div>
        )}
        {step === 3 && (
          <div>
            <h2>Review</h2>
            <p className="muted">
              Method: {provider}. Confirm to create the payment intent using the existing API contract.
            </p>
          </div>
        )}
        {step === 4 && (
          <div
            className={
              "rounded-xl p-8 text-center " + (confirmed ? "" : "bg-[var(--color-surface-3)]")
            }
            style={
              confirmed
                ? { background: "var(--grad-cta)", color: "var(--color-primary-fg)" }
                : undefined
            }
          >
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--color-primary)]/10 text-3xl">
              {confirmed ? "✓" : "…"}
            </div>
            <h2>{confirmed ? "Payment confirmed" : "Payment processing"}</h2>
            <p>{result}</p>
            {checkoutUrl && (
              <p className="mt-3 text-sm">Redirecting to the secure payment provider…</p>
            )}
          </div>
        )}
        {step < 4 && (
          <div className="mt-6 flex justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
            >
              Back
            </Button>
            <Button onClick={handleSubmit(submit)} disabled={busy}>
              {busy ? "Processing…" : step === 3 ? "Confirm payment" : "Continue"}
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function Payments() {
  return (
    <Suspense fallback={<main className="wrap section max-w-2xl"><div className="notice">Loading checkout…</div></main>}>
      <PaymentsContent />
    </Suspense>
  );
}