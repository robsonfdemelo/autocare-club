"use client";

import Link from "next/link";
import { useState } from "react";
import ImageUpload from "../../../../components/image-upload";
import { slugify } from "../../../../../lib/slugify";

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

export default function EditWorkshopForm({ workshop, updateWorkshop }: any) {
  const [name, setName] = useState(workshop.name);
  const [slug, setSlug] = useState(workshop.slug);
  const [imageUrl, setImageUrl] = useState(workshop.imageUrl || "");
  const [phone, setPhone] = useState(maskPhone(workshop.phone ?? ""));
  const [whatsapp, setWhatsapp] = useState(maskPhone(workshop.whatsapp ?? ""));
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
      const data = await response.json();

      if (!data.erro) {
        setAddress(data.logradouro || "");
        setCity(data.localidade || "");
        setState(data.uf || "");
      }
    } finally {
      setLoadingCep(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!name || !slug || !imageUrl || !address || !city || !state) {
      setError("Preencha os campos obrigatórios e envie uma imagem.");
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("imageUrl", imageUrl);

    await updateWorkshop(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
      <input
        name="name"
        value={name}
        onChange={(e) => handleNameChange(e.target.value)}
        placeholder="Nome da oficina"
        required
        className="rounded-lg border border-gray-300 px-3 py-2"
      />

      <input
        name="slug"
        value={slug}
        onChange={(e) => setSlug(slugify(e.target.value))}
        placeholder="Link da oficina"
        required
        className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2"
      />

      <div className="md:col-span-2">
        <ImageUpload value={imageUrl} onChange={setImageUrl} />
      </div>

      <input
        name="phone"
        value={phone}
        onChange={(e) => setPhone(maskPhone(e.target.value))}
        placeholder="Telefone"
        className="rounded-lg border border-gray-300 px-3 py-2"
      />

      <input
        name="whatsapp"
        value={whatsapp}
        onChange={(e) => setWhatsapp(maskPhone(e.target.value))}
        placeholder="WhatsApp"
        className="rounded-lg border border-gray-300 px-3 py-2"
      />

      <input
        name="email"
        type="email"
        defaultValue={workshop.email ?? ""}
        placeholder="E-mail"
        className="rounded-lg border border-gray-300 px-3 py-2 md:col-span-2"
      />

      <input
        name="zipCode"
        value={zipCode}
        onChange={(e) => handleCepChange(e.target.value)}
        placeholder="CEP"
        className="rounded-lg border border-gray-300 px-3 py-2"
      />

      {loadingCep ? (
        <p className="self-center text-sm text-gray-500">Buscando CEP...</p>
      ) : (
        <div />
      )}

      <input
        name="address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Endereço"
        required
        className="rounded-lg border border-gray-300 px-3 py-2 md:col-span-2"
      />

      <input
        name="city"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="Cidade"
        required
        className="rounded-lg border border-gray-300 px-3 py-2"
      />

      <input
        name="state"
        value={state}
        onChange={(e) => setState(e.target.value)}
        placeholder="Estado"
        required
        className="rounded-lg border border-gray-300 px-3 py-2"
      />

      <textarea
        name="description"
        defaultValue={workshop.description ?? ""}
        placeholder="Descrição"
        rows={4}
        className="rounded-lg border border-gray-300 px-3 py-2 md:col-span-2"
      />

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