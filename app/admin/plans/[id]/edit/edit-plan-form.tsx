"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

type DecimalLike = {
  toString: () => string;
};

type PlanFormData = {
  id: string;
  name: string;
  revisionsQty: number;
  discountPct: number;
  graceDays: number;
  price: DecimalLike | number | string;
  isActive: boolean;
};

type EditPlanFormProps = {
  plan: PlanFormData;
  updatePlan: (formData: FormData) => Promise<void>;
};

export default function EditPlanForm({
  plan,
  updatePlan,
}: EditPlanFormProps) {
  const [name, setName] = useState(plan.name);
  const [revisionsQty, setRevisionsQty] = useState(String(plan.revisionsQty));
  const [discountPct, setDiscountPct] = useState(String(plan.discountPct));
  const [graceDays, setGraceDays] = useState(String(plan.graceDays));
  const [price, setPrice] = useState(String(plan.price));
  const [isActive, setIsActive] = useState(plan.isActive);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!name || !revisionsQty) {
      setError("Preencha os campos obrigatórios.");
      return;
    }

    setLoading(true);

    const formData = new FormData(event.currentTarget);
    formData.set("isActive", isActive ? "true" : "false");

    await updatePlan(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <input type="hidden" name="id" value={plan.id} />

      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-700">
          Nome do plano
        </label>

        <input
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-700">
          Preço
        </label>

        <input
          name="price"
          type="number"
          step="0.01"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-700">
          Quantidade de revisões
        </label>

        <input
          name="revisionsQty"
          type="number"
          value={revisionsQty}
          onChange={(event) => setRevisionsQty(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-700">
          Desconto (%)
        </label>

        <input
          name="discountPct"
          type="number"
          value={discountPct}
          onChange={(event) => setDiscountPct(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-700">
          Carência (dias)
        </label>

        <input
          name="graceDays"
          type="number"
          value={graceDays}
          onChange={(event) => setGraceDays(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(event) => setIsActive(event.target.checked)}
        />

        Plano ativo
      </label>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Salvando..." : "Salvar alterações"}
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