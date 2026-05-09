"use client";

import { useState } from "react";

export default function CheckoutButton({
  planId,
  name,
  email,
  value,
}: {
  planId: string;
  name: string;
  email: string;
  value: number;
}) {
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);

    const res = await fetch("/api/asaas/create-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        planId,
        name,
        email,
        cpf: "34860234898",
        value,
      }),
    });

    const data = await res.json();

    setLoading(false);

    if (!res.ok) {
      alert(data?.error || "Erro ao criar cobrança.");
      return;
    }

    setPaymentUrl(data.invoiceUrl);
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className="block w-full rounded-lg bg-gray-900 px-4 py-3 text-center font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? "Gerando cobrança..." : "Contratar plano"}
      </button>

      {paymentUrl ? (
        <a
          href={paymentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 block w-full rounded-lg bg-green-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-green-700"
        >
          Pagar com PIX
        </a>
      ) : null}
    </div>
  );
}