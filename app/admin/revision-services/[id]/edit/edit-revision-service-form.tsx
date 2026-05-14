"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

type DecimalLike = {
  toString: () => string;
};

type WorkshopOption = {
  id: string;
  name: string;
};

type RevisionServiceFormData = {
  id: string;
  name: string;
  workshopId: string;
  mileageTarget: number;
  monthInterval: number;
  priceDirect: DecimalLike | number | string;
  priceClub: DecimalLike | number | string;
  isActive: boolean;
};

type EditRevisionServiceFormProps = {
  service: RevisionServiceFormData;
  workshops: WorkshopOption[];
  updateRevisionService: (formData: FormData) => Promise<void>;
};

export default function EditRevisionServiceForm({
  service,
  workshops,
  updateRevisionService,
}: EditRevisionServiceFormProps) {
  const [name, setName] = useState(service.name);
  const [workshopId, setWorkshopId] = useState(service.workshopId);
  const [mileageTarget, setMileageTarget] = useState(
    String(service.mileageTarget),
  );
  const [monthInterval, setMonthInterval] = useState(
    String(service.monthInterval),
  );
  const [priceDirect, setPriceDirect] = useState(String(service.priceDirect));
  const [priceClub, setPriceClub] = useState(String(service.priceClub));
  const [isActive, setIsActive] = useState(service.isActive);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (
      !name ||
      !workshopId ||
      !mileageTarget ||
      !monthInterval ||
      !priceDirect ||
      !priceClub
    ) {
      setError("Preencha os campos obrigatórios.");
      return;
    }

    setLoading(true);

    const formData = new FormData(event.currentTarget);
    formData.set("isActive", isActive ? "true" : "false");

    await updateRevisionService(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-700">
          Nome da revisão
        </label>

        <input
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
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
          value={workshopId}
          onChange={(event) => setWorkshopId(event.target.value)}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        >
          <option value="">Selecione a oficina</option>

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
          value={mileageTarget}
          onChange={(event) => setMileageTarget(event.target.value)}
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
          value={monthInterval}
          onChange={(event) => setMonthInterval(event.target.value)}
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
          value={priceDirect}
          onChange={(event) => setPriceDirect(event.target.value)}
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
          value={priceClub}
          onChange={(event) => setPriceClub(event.target.value)}
          placeholder="Ex: 419.40"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(event) => setIsActive(event.target.checked)}
          className="h-4 w-4"
        />

        Revisão ativa
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
          href="/admin/revision-services"
          className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-100"
        >
          Voltar
        </Link>
      </div>
    </form>
  );
}