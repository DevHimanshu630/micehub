"use client";

import { useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { formatINR } from "@/lib/format";
import { createPaymentOrder, verifyPayment } from "../payment-actions";

// Minimal type for the global Razorpay checkout object that checkout.js injects.
type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { email?: string; name?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: { ondismiss?: () => void };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => {
      open: () => void;
    };
  }
}

export function PayButton({
  bookingId,
  advanceRupees,
  plannerEmail,
}: {
  bookingId: string;
  advanceRupees: number;
  plannerEmail: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"idle" | "creating" | "verifying">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handlePay() {
    setError(null);
    setBusy("creating");

    const result = await createPaymentOrder(bookingId);
    if (!result.ok) {
      setBusy("idle");
      setError(result.error);
      return;
    }

    if (!window.Razorpay) {
      setBusy("idle");
      setError("Razorpay SDK didn't load. Please refresh and try again.");
      return;
    }

    const checkout = new window.Razorpay({
      key: result.keyId,
      amount: result.amountPaise,
      currency: result.currency,
      name: "MICEHub",
      description: "Booking advance payment",
      order_id: result.orderId,
      prefill: { email: plannerEmail },
      notes: { bookingId },
      theme: { color: "#4f46e5" },
      modal: {
        ondismiss: () => {
          setBusy("idle");
        },
      },
      handler: async (response) => {
        setBusy("verifying");
        const verify = await verifyPayment({
          bookingId,
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
        if (!verify.ok) {
          setBusy("idle");
          setError(verify.error);
          return;
        }
        router.refresh();
      },
    });

    checkout.open();
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />
      <button
        type="button"
        onClick={handlePay}
        disabled={busy !== "idle"}
        className="mt-4 rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy === "creating"
          ? "Opening Razorpay..."
          : busy === "verifying"
            ? "Confirming payment..."
            : `Pay ${formatINR(advanceRupees)} advance`}
      </button>
      {error ? (
        <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{error}</p>
      ) : null}
      <p className="mt-2 text-xs text-slate-500">
        Test cards: 4111 1111 1111 1111 · any future expiry · any CVV.
      </p>
    </>
  );
}
