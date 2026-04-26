"use client";

export default function DeleteButton() {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!confirm("Tem certeza que deseja excluir esta oficina?")) {
          e.preventDefault();
        }
      }}
      className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
    >
      Excluir
    </button>
  );
}