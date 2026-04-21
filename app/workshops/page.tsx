import { prisma } from '../../lib/prisma'

export default async function WorkshopsPage() {
  const workshops = await prisma.workshop.findMany({
    include: {
      revisionServices: {
        where: {
          isActive: true,
        },
        orderBy: {
          mileageTarget: 'asc',
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  })

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-[#B11226] px-6 py-12 text-white">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-bold">Oficinas</h1>
          <p className="mt-2 text-white/90">
            Escolha uma oficina e veja as revisões disponíveis
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {workshops.map((workshop) => (
            <article
              key={workshop.id}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="h-44 w-full bg-gray-200">
                <img
                  src={workshop.imageUrl}
                  alt={workshop.name}
                  className="h-full w-full object-cover"
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
                  <a
                    href={`/workshops/${workshop.slug}`}
                    className="flex-1 rounded-lg bg-gray-900 px-4 py-2 text-center text-sm font-semibold text-white"
                  >
                    Ver detalhes
                  </a>

                  <a
                    href={`https://wa.me/${workshop.whatsapp ?? ''}`}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-700"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}