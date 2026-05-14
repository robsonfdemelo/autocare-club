"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import ImageUpload from "../../../../components/image-upload";
import { slugify } from "../../../../../lib/slugify";

type WorkshopFormData = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl: string;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  address: string;
  city: string;
  state: string;
  zipCode?: string | null;
};

type EditWorkshopFormProps = {
  workshop: WorkshopFormData;
  updateWorkshop: (formData: FormData) => Promise<void>;
};

type ViaCepResponse = {
  erro?: boolean;
  logradouro?: string;
  localidade?: string;
  uf?: string;
};

function maskPhone(value: string) {
  return value
    .replace(/\D/g, "")
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .slice(0, 15);
}

function maskCep(value: string) {
  return value
    .replace(/\D/g, "")
    .replace(/^(\d{5})(\d)/, "$1-$2")
    .slice(0, 9);
}

export default function EditWorkshopForm({
  workshop,
  updateWorkshop,
}: EditWorkshopFormProps) {
  const [name, setName] = useState(workshop.name);
  const [slug, setSlug] = useState(workshop.slug);
  const [description, setDescription] = useState(workshop.description ?? "");
  const [imageUrl, setImageUrl] = useState(workshop.imageUrl || "");
  const [phone, setPhone] = useState(maskPhone(workshop.phone ?? ""));
  const [whatsapp, setWhatsapp] = useState(maskPhone(workshop.whatsapp ?? ""));
  const [email, setEmail] = useState(workshop.email ?? "");
  const [zipCode, setZipCode] = useState(maskCep(workshop.zipCode ?? ""));
  const [address, setAddress] = useState(workshop.address ?? "");
  const [city, setCity] = useState(workshop.city ?? "");
  const [state, setState] = useState(workshop.state ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    setSlug(slugify(value));
  }

  async function handleCepChange(value: string) {
    const maskedCep = maskCep(value);

    setZipCode(maskedCep);

    const onlyNumbers = maskedCep.replace(/\D/g, "");

    if (onlyNumbers.length !== 8) {
      return;
    }

    setLoadingCep(true);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${onlyNumbers}/json/`);
      const data = (await response.json()) as ViaCepResponse;

      if (!data.erro) {
        setAddress(data.logradouro || "");
        setCity(data.localidade || "");
        setState(data.uf || "");
      }
    } finally {
      setLoadingCep(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!name || !slug || !imageUrl || !address || !city || !state) {
      setError("Preencha os campos obrigatórios e envie uma imagem.");
      return;
    }

    setLoading(true);

    const formData = new FormData(event.currentTarget);
    formData.set("imageUrl", imageUrl);

    await updateWorkshop(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl bg-white p-6 shadow-sm md:grid-cols-2">
      <input
        name="name"
        value={name}
        onChange={(event) => handleNameChange(event.target.value)}
        placeholder="Nome da oficina"
        required
        className="rounded-lg border border-gray-300 px-3 py-2"
      />

      <input
        name="slug"
        value={slug}
        onChange={(event) => setSlug(slugify(event.target.value))}
        placeholder="Link da oficina"
        required
        className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2"
      />

      <input
        name="phone"
        value={phone}
        onChange={(event) => setPhone(maskPhone(event.target.value))}
        placeholder="Telefone"
        className="rounded-lg border border-gray-300 px-3 py-2"
      />

      <input
        name="whatsapp"
        value={whatsapp}
        onChange={(event) => setWhatsapp(maskPhone(event.target.value))}
        placeholder="WhatsApp"
        className="rounded-lg border border-gray-300 px-3 py-2"
      />

      <input
        name="email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="E-mail"
        className="rounded-lg border border-gray-300 px-3 py-2 md:col-span-2"
      />

      <textarea
        name="description"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Descrição da oficina"
        className="min-h-28 rounded-lg border border-gray-300 px-3 py-2 md:col-span-2"
      />

      <input
        name="zipCode"
        value={zipCode}
        onChange={(event) => handleCepChange(event.target.value)}
        placeholder="CEP"
        className="rounded-lg border border-gray-300 px-3 py-2"
      />

      {loadingCep ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          Buscando CEP...
        </div>
      ) : (
        <div />
      )}

      <input
        name="address"
        value={address}
        onChange={(event) => setAddress(event.target.value)}
        placeholder="Endereço"
        required
        className="rounded-lg border border-gray-300 px-3 py-2 md:col-span-2"
      />

      <input
        name="city"
        value={city}
        onChange={(event) => setCity(event.target.value)}
        placeholder="Cidade"
        required
        className="rounded-lg border border-gray-300 px-3 py-2"
      />

      <input
        name="state"
        value={state}
        onChange={(event) => setState(event.target.value)}
        placeholder="Estado"
        required
        className="rounded-lg border border-gray-300 px-3 py-2"
      />

      <div className="md:col-span-2">
        <ImageUpload value={imageUrl} onChange={setImageUrl} />
      </div>

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
          {loading ? "Salvando..." : "Salvar alterações"}
        </button>

        <Link
          href="/admin/workshops"
          className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-100"
        >
          Voltar
        </Link>
      </div>
    </form>
  );
}