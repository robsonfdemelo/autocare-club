import Link from 'next/link'
import { prisma } from '../../../lib/prisma'

interface Props {
  params: Promise<{
    slug: string
  }>
}

export default async function WorkshopDetails({ params }: Props) {
  const { slug } = await params

  const workshop = await prisma.workshop.findUnique({
    where: {
      slug,
    },
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
  })

  if (!workshop) {
    return <div>Oficina não encontrada</div>
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-[#B11226] px-6 py-12 text-white">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-bold">{workshop.name}</h1>
          <p className="mt-2 text-white/90">
            {workshop.city} - {workshop.state}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <h2 className="mb-6 text-2xl font-bold">Revisões disponíveis</h2>

        <div className="grid gap-6 md:grid-cols-2">
          {workshop.revisionServices.map((service) => (
            <div
              key={service.id}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <h3 className="text-xl font-bold text-gray-900">
                {service.name}
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                {service.mileageTarget.toLocaleString('pt-BR')} km ou{' '}
                {service.monthInterval} meses
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-gray-100 p-3">
                  <p className="text-xs text-gray-500">Direto</p>
                  <p className="text-lg font-bold">
                    R$ {Number(service.priceDirect).toFixed(2).replace('.', ',')}
                  </p>
                </div>

                <div className="rounded-lg bg-[#B11226] p-3 text-white">
                  <p className="text-xs text-white/80">AutoCare Club</p>
                  <p className="text-lg font-bold">
                    R$ {Number(service.priceClub).toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>

              <Link
                href={`/booking?workshopSlug=${workshop.slug}&serviceId=${service.id}`}
                className="mt-5 block w-full rounded-lg bg-gray-900 px-4 py-2 text-center text-white"
              >
                Agendar revisão
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}