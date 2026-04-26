"use client";

import Link from "next/link";
import { useState } from "react";

export default function NewPlanForm({
  createPlan,
}: {
  createPlan: (formData: FormData) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [revisionsQty, setRevisionsQty] = useState("");
  const [discountPct, setDiscountPct] = useState("");
  const [graceDays, setGraceDays] = useState("30");
  const [price, setPrice] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!name || !revisionsQty || !price) {
      setError("Preencha os campos obrigatórios.");
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("isActive", isActive ? "true" : "false");

    await createPlan(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Nome do plano
        </label>
        <input
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Plano 3 revisões"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Preço
        </label>
        <input
          name="price"
          type="number"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Ex: 99.90"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Quantidade de revisões
        </label>
        <input
          name="revisionsQty"
          type="number"
          value={revisionsQty}
          onChange={(e) => setRevisionsQty(e.target.value)}
          placeholder="Ex: 3"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Desconto (%)
        </label>
        <input
          name="discountPct"
          type="number"
          value={discountPct}
          onChange={(e) => setDiscountPct(e.target.value)}
          placeholder="Ex: 5"
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Carência em dias
        </label>
        <input
          name="graceDays"
          type="number"
          value={graceDays}
          onChange={(e) => setGraceDays(e.target.value)}
          placeholder="Ex: 30"
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      <label className="flex items-center gap-3 rounded-lg border border-gray-300 px-3 py-2 md:col-span-2">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4"
        />
        <span className="text-sm font-medium text-gray-700">Plano ativo</span>
      </label>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 md:col-span-2">
          {error}
        </div>
      ) : null}

      <div className="flex gap-3 md:col-span-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Salvando..." : "Salvar plano"}
        </button>

        <Link
          href="/admin/plans"
          className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-100"
        >
          Voltar
        </Link>
      </div>
    </form>
  );
}