"use client";

import { useState } from "react";

export default function CheckoutButton({
  name,
  email,
  value,
}: {
  name: string;
  email: string;
  value: number;
}) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);

    const res = await fetch("/api/asaas/create-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        cpf: "34860234898",
        value,
      }),
    });

    const data = await res.json();

    console.log(data);

    setLoading(false);

    if (!res.ok) {
      alert("Erro ao criar cobrança.");
      return;
    }

    alert("Cobrança criada! Veja o console.");
  }

  return (
    <button
      type="button"
      onClick={handleCheckout}
      disabled={loading}
      className="mt-6 block w-full rounded-lg bg-gray-900 px-4 py-3 text-center font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
    >
      {loading ? "Gerando cobrança..." : "Contratar plano"}
    </button>
  );
}
