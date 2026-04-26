"use client";

import { useState } from "react";

export default function ImageUpload({
  value,
  onChange,
}: {
  value?: string;
  onChange: (url: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [openPreview, setOpenPreview] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload(file: File) {
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        setError("Não foi possível enviar a imagem.");
        return;
      }

      onChange(data.url);
    } catch {
      setError("Erro ao enviar imagem.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {value ? (
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setOpenPreview(true)}
            className="overflow-hidden rounded-xl border border-gray-300 bg-gray-50"
          >
            <img
              src={value}
              alt="Preview da imagem"
              className="h-24 w-32 object-cover"
            />
          </button>

          <div>
            <p className="text-sm font-medium text-gray-700">
              Imagem enviada
            </p>

            <button
              type="button"
              onClick={() => setOpenPreview(true)}
              className="mt-1 text-sm font-semibold text-[#B11226]"
            >
              Ver preview
            </button>
          </div>
        </div>
      ) : null}

      <label className="inline-flex cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100">
        {loading ? "Enviando..." : "Escolher imagem"}

        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={loading}
          onChange={(e) => {
            const file = e.target.files?.[0];

            if (file) {
              handleUpload(file);
            }
          }}
        />
      </label>

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : null}

      {openPreview && value ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                Preview da imagem
              </h2>

              <button
                type="button"
                onClick={() => setOpenPreview(false)}
                className="rounded-lg border border-gray-300 px-3 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                Fechar
              </button>
            </div>

            <img
              src={value}
              alt="Preview da imagem"
              className="max-h-[70vh] w-full rounded-xl object-contain"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}