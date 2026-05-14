"use client";

import { useState } from "react";

type CheckoutButtonProps = {
  planId: string;
  value: number;
};

export default function CheckoutButton({ planId, value }: CheckoutButtonProps) {
  const [cpf, setCpf] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  async function handleCheckout() {
    const cleanCpf = cpf.replace(/\D/g, "");

    if (cleanCpf.length !== 11 && cleanCpf.length !== 14) {
      alert("Informe um CPF ou CNPJ válido.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/asaas/create-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        planId,
        cpf: cleanCpf,
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
    <div className="mt-6 space-y-3">
      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-700">
          CPF
        </label>

        <input
          type="text"
          value={cpf}
          onChange={(event) => setCpf(event.target.value)}
          placeholder="Digite seu CPF"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900"
        />
      </div>

      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className="block w-full rounded-lg bg-gray-900 px-4 py-3 text-center font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? "Gerando cobrança..." : `Contratar por R$ ${value.toFixed(2).replace(".", ",")}`}
      </button>

      {paymentUrl ? (
        <a
          href={paymentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-lg bg-green-600 px-4 py-3 text-center font-semibold text-white transition hover:bg-green-700"
        >
          Pagar com PIX
        </a>
      ) : null}
    </div>
  );
}