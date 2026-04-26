import Link from "next/link";
import { prisma } from "../../lib/prisma";

interface Props {
  searchParams: Promise<{
    q?: string;
  }>;
}

export default async function WorkshopsPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const search = q?.trim() ?? "";

  const workshops = await prisma.workshop.findMany({
    where: search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              city: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              state: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }
      : undefined,
    orderBy: {
      name: "asc",
    },
  });

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-[#B11226] px-6 py-12 text-white">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-bold">Oficinas</h1>
          <p className="mt-2 text-white/90">
            Escolha uma oficina e veja as revisões disponíveis
          </p>

          <form className="mt-6 max-w-xl">
            <div className="flex gap-2">
              <input
                type="text"
                name="q"
                defaultValue={search}
                placeholder="Buscar por oficina, cidade ou estado"
                className="w-full rounded-lg border border-white/20 bg-white px-4 py-3 text-gray-900 outline-none"
              />
              <button
                type="submit"
                className="rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white transition hover:bg-black"
              >
                Buscar
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        {workshops.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
            <p className="text-gray-600">
              {search
                ? `Nenhuma oficina encontrada para "${search}".`
                : "Nenhuma oficina cadastrada."}
            </p>

            {search ? (
              <Link
                href="/workshops"
                className="mt-4 inline-block rounded-lg bg-gray-900 px-4 py-2 text-white"
              >
                Limpar busca
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="grid justify-items-center gap-6 md:grid-cols-2 xl:grid-cols-3">
            {workshops.map((workshop) => (
              <article
                key={workshop.id}
                className="w-full max-w-sm overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="h-48 w-full overflow-hidden bg-gray-200">
                  <img
                    src={workshop.imageUrl}
                    alt={workshop.name}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>

                <div className="p-5">
                  <h2 className="text-xl font-bold text-gray-900">
                    {workshop.name}
                  </h2>

                  <p className="text-sm text-gray-600">
                    {workshop.city} - {workshop.state}
                  </p>

                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/workshops/${workshop.slug}`}
                      className="flex-1 rounded-lg bg-gray-900 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-black"
                    >
                      Ver detalhes
                    </Link>

                    <a
                      href={`https://wa.me/${workshop.whatsapp ?? ""}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
