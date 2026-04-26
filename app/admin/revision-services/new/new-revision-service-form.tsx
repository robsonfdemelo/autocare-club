"use client";

import Link from "next/link";

export default function NewRevisionServiceForm({
  createRevisionService,
  workshops,
}: any) {
  return (
    <form action={createRevisionService} className="grid gap-4 md:grid-cols-2">
      
      <input
        name="name"
        placeholder="Nome da revisão (ex: Revisão 10.000 km)"
        required
        className="rounded-lg border px-3 py-2"
      />

      <select
        name="workshopId"
        required
        className="rounded-lg border px-3 py-2"
      >
        <option value="">Selecione a oficina</option>
        {workshops.map((w: any) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>

      <input
        name="mileageTarget"
        placeholder="KM (ex: 10000)"
        type="number"
        required
        className="rounded-lg border px-3 py-2"
      />

      <input
        name="monthInterval"
        placeholder="Meses (ex: 12)"
        type="number"
        className="rounded-lg border px-3 py-2"
      />

      <input
        name="priceDirect"
        placeholder="Preço direto (ex: 650)"
        type="number"
        step="0.01"
        required
        className="rounded-lg border px-3 py-2"
      />

      <input
        name="priceClub"
        placeholder="Preço clube (ex: 520)"
        type="number"
        step="0.01"
        className="rounded-lg border px-3 py-2"
      />

      <div className="flex gap-3 md:col-span-2">
        <button
          type="submit"
          className="rounded-lg bg-gray-900 px-5 py-3 text-white"
        >
          Salvar revisão
        </button>

        <Link
          href="/admin/revision-services"
          className="border px-5 py-3 rounded-lg"
        >
          Voltar
        </Link>
      </div>
    </form>
  );
}