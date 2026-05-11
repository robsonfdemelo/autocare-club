import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/prisma'

export default async function AdminAppointmentsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/')
  }

  async function completeAppointment(formData: FormData) {
    'use server'

    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      redirect('/login')
    }

    if (session.user.role !== 'ADMIN') {
      redirect('/')
    }

    const appointmentId = formData.get('appointmentId') as string

    if (!appointmentId) {
      return
    }

    const appointment = await prisma.appointment.findUnique({
      where: {
        id: appointmentId,
      },
      include: {
        userPlan: true,
      },
    })

    if (!appointment) {
      redirect('/admin/appointments')
    }

    if (appointment.status === 'COMPLETED') {
      redirect('/admin/appointments')
    }

    if (appointment.status === 'CANCELED') {
      redirect('/admin/appointments')
    }

    if (appointment.usedPlan && appointment.userPlanId && appointment.userPlan) {
      if (appointment.userPlan.availableBalance <= 0) {
        redirect('/admin/appointments?error=saldo-insuficiente')
      }

      await prisma.$transaction([
        prisma.appointment.update({
          where: {
            id: appointment.id,
          },
          data: {
            status: 'COMPLETED',
          },
        }),

        prisma.userPlan.update({
          where: {
            id: appointment.userPlanId,
          },
          data: {
            usedRevisions: {
              increment: 1,
            },
            availableBalance: {
              decrement: 1,
            },
          },
        }),
      ])
    } else {
      await prisma.appointment.update({
        where: {
          id: appointment.id,
        },
        data: {
          status: 'COMPLETED',
        },
      })
    }

    redirect('/admin/appointments?success=completed')
  }

  const appointments = await prisma.appointment.findMany({
    include: {
      workshop: true,
      revisionService: true,
      user: true,
      userPlan: {
        include: {
          planPackage: true,
        },
      },
    },
    orderBy: {
      appointmentDate: 'asc',
    },
  })

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-[#B11226] px-6 py-12 text-white">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-bold">Admin • Agendamentos</h1>
          <p className="mt-2 text-white/90">
            Gerencie, conclua serviços e controle o consumo dos planos
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        {appointments.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-gray-600">Nenhum agendamento encontrado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="rounded-2xl bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {appointment.revisionService.name}
                    </h2>

                    <p className="mt-1 text-gray-600">
                      {appointment.workshop.name} • {appointment.workshop.city} -{' '}
                      {appointment.workshop.state}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Cliente: {appointment.user.name ?? appointment.user.email}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Data:{' '}
                      {new Date(appointment.appointmentDate).toLocaleDateString(
                        'pt-BR',
                      )}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          appointment.paymentMode === 'CLUB'
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {appointment.paymentMode === 'CLUB'
                          ? 'myRiseCare'
                          : 'Direto'}
                      </span>

                      {appointment.usedPlan ? (
                        <>
                          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                            Plano utilizado
                          </span>

                          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                            {appointment.userPlan?.planPackage?.name ?? 'Plano'}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-col items-start gap-3 md:items-end">
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${
                        appointment.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-700'
                          : appointment.status === 'CANCELED'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {appointment.status === 'SCHEDULED'
                        ? 'Agendado'
                        : appointment.status === 'COMPLETED'
                          ? 'Concluído'
                          : 'Cancelado'}
                    </span>

                    {appointment.status === 'SCHEDULED' ? (
                      <form action={completeAppointment}>
                        <input
                          type="hidden"
                          name="appointmentId"
                          value={appointment.id}
                        />

                        <button
                          type="submit"
                          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                        >
                          Concluir serviço
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}