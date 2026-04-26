"use client";

import Link from "next/link";
import { useState } from "react";

export default function EditPlanForm({
  plan,
  updatePlan,
}: {
  plan: any;
  updatePlan: (formData: FormData) => Promise<void>;
}) {
  const [name, setName] = useState(plan.name);
  const [revisionsQty, setRevisionsQty] = useState(String(plan.revisionsQty));
  const [discountPct, setDiscountPct] = useState(String(plan.discountPct));
  const [graceDays, setGraceDays] = useState(String(plan.graceDays));
  const [price, setPrice] = useState(String(plan.price));
  const [isActive, setIsActive] = useState(plan.isActive);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!name || !revisionsQty) {
      setError("Preencha os campos obrigatórios.");
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("isActive", isActive ? "true" : "false");

    await updatePlan(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
      <input type="hidden" name="id" value={plan.id} />

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Nome do plano
        </label>
        <input
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
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
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Carência (dias)
        </label>
        <input
          name="graceDays"
          type="number"
          value={graceDays}
          onChange={(e) => setGraceDays(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      <label className="flex items-center gap-3 rounded-lg border border-gray-300 px-3 py-2 md:col-span-2">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        <span>Plano ativo</span>
      </label>

      {error && (
        <div className="md:col-span-2 text-sm text-red-600">{error}</div>
      )}

      <div className="flex gap-3 md:col-span-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-gray-900 px-5 py-3 text-white"
        >
          {loading ? "Salvando..." : "Salvar alterações"}
        </button>

        <Link
          href="/admin/plans"
          className="rounded-lg border px-5 py-3"
        >
          Voltar
        </Link>
      </div>
    </form>
  );
}