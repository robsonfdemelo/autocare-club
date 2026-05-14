"use client";

import Link from "next/link";

type WorkshopOption = {
  id: string;
  name: string;
};

type NewRevisionServiceFormProps = {
  createRevisionService: (formData: FormData) => Promise<void>;
  workshops: WorkshopOption[];
};

export default function NewRevisionServiceForm({
  createRevisionService,
  workshops,
}: NewRevisionServiceFormProps) {
  return (
    <form action={createRevisionService} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-700">
          Nome da revisão
        </label>

        <input
          name="name"
          placeholder="Ex: Revisão 10.000 km"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-700">
          Oficina
        </label>

        <select
          name="workshopId"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
          defaultValue=""
        >
          <option value="" disabled>
            Selecione a oficina
          </option>

          {workshops.map((workshop) => (
            <option key={workshop.id} value={workshop.id}>
              {workshop.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-700">
          Quilometragem
        </label>

        <input
          name="mileageTarget"
          type="number"
          placeholder="Ex: 10000"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-700">
          Intervalo em meses
        </label>

        <input
          name="monthInterval"
          type="number"
          placeholder="Ex: 12"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-700">
          Preço direto
        </label>

        <input
          name="priceDirect"
          type="number"
          step="0.01"
          placeholder="Ex: 536.06"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-700">
          Preço AutoCare Club
        </label>

        <input
          name="priceClub"
          type="number"
          step="0.01"
          placeholder="Ex: 419.40"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white"
        >
          Salvar revisão
        </button>

        <Link
          href="/admin/revision-services"
          className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-100"
        >
          Voltar
        </Link>
      </div>
    </form>
  );
}