"use client";

import { useState } from "react";

type CheckoutButtonProps = {
  planId: string;
  value: number;
};

type BillingType = "PIX" | "CREDIT_CARD";

export default function CheckoutButton({ planId, value }: CheckoutButtonProps) {
  const [cpf, setCpf] = useState("");
  const [billingType, setBillingType] = useState<BillingType>("PIX");
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  async function handleCheckout() {
    const cleanCpf = cpf.replace(/\D/g, "");

    if (cleanCpf.length !== 11 && cleanCpf.length !== 14) {
      alert("Informe um CPF ou CNPJ válido.");
      return;
    }

    setLoading(true);
    setPaymentUrl(null);

    const res = await fetch("/api/asaas/create-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        planId,
        cpf: cleanCpf,
        billingType,
      }),
    });

    const data = await res.json();

    setLoading(false);

    if (!res.ok) {
      alert(data?.error || data?.errors?.[0]?.description || "Erro ao criar cobrança.");
      return;
    }

    setPaymentUrl(data.invoiceUrl);
  }

  const paymentLabel =
    billingType === "PIX" ? "PIX" : "cartão de crédito";

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

      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-700">
          Forma de pagamento
        </label>

        <select
          value={billingType}
          onChange={(event) =>
            setBillingType(event.target.value as BillingType)
          }
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900"
        >
          <option value="PIX">PIX</option>
          <option value="CREDIT_CARD">Cartão de crédito</option>
        </select>
      </div>

      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className="block w-full rounded-lg bg-gray-900 px-4 py-3 text-center font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
      >
        {loading
          ? "Gerando cobrança..."
          : `Contratar por R$ ${value.toFixed(2).replace(".", ",")}`}
      </button>

      {paymentUrl ? (
        <div className="space-y-2">
          <a
            href={paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`block w-full rounded-lg px-4 py-3 text-center font-semibold text-white transition ${
              billingType === "PIX"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {billingType === "PIX"
              ? "Abrir cobrança PIX"
              : "Abrir cobrança no cartão"}
          </a>

          <p className="text-xs text-gray-500">
            Após a confirmação do pagamento via {paymentLabel}, seu plano será
            ativado automaticamente.
          </p>
        </div>
      ) : null}
    </div>
  );
}