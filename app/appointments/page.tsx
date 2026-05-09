import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

interface Props {
  searchParams: Promise<{
    success?: string;
    status?: string;
  }>;
}

export default async function AppointmentsPage({ searchParams }: Props) {
  const { success, status } = await searchParams;

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  async function cancelAppointment(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      redirect("/login");
    }

    const appointmentId = formData.get("appointmentId") as string;

    if (!appointmentId) {
      return;
    }

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        userId: session.user.id,
      },
      include: {
        userPlan: true,
      },
    });

    if (!appointment) {
      redirect("/appointments");
    }

    if (appointment.status === "CANCELED") {
      redirect("/appointments");
    }

    if (
      appointment.usedPlan &&
      appointment.userPlanId &&
      appointment.status === "COMPLETED"
    ) {
      await prisma.$transaction([
        prisma.appointment.update({
          where: {
            id: appointment.id,
          },
          data: {
            status: "CANCELED",
          },
        }),
        prisma.userPlan.update({
          where: {
            id: appointment.userPlanId,
          },
          data: {
            usedRevisions: {
              decrement: 1,
            },
            availableBalance: {
              increment: 1,
            },
          },
        }),
      ]);
    } else {
      await prisma.appointment.update({
        where: {
          id: appointment.id,
        },
        data: {
          status: "CANCELED",
        },
      });
    }

    redirect("/appointments?success=booking-canceled");
  }

  const normalizedStatus =
    status === "SCHEDULED" || status === "CANCELED" ? status : undefined;

  const appointments = await prisma.appointment.findMany({
    where: {
      userId: session.user.id,
      ...(normalizedStatus ? { status: normalizedStatus } : {}),
    },
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
      appointmentDate: "asc",
    },
  });

  const successMessage =
    success === "booking-created"
      ? "Agendamento realizado com sucesso."
      : success === "booking-canceled"
        ? "Agendamento cancelado com sucesso."
        : "";

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-[#B11226] px-6 py-12 text-white">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-4xl font-bold">Meus agendamentos</h1>
          <p className="mt-2 text-white/90">
            Acompanhe as revisões agendadas no AutoCare Club
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10">
        {successMessage ? (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800 shadow-sm">
            <p className="font-medium">{successMessage}</p>
          </div>
        ) : null}

        <div className="mb-6 flex flex-wrap gap-3">
          <Link
            href="/appointments"
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              !normalizedStatus
                ? "bg-gray-900 text-white"
                : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Todos
          </Link>

          <Link
            href="/appointments?status=SCHEDULED"
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              normalizedStatus === "SCHEDULED"
                ? "bg-gray-900 text-white"
                : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Agendados
          </Link>

          <Link
            href="/appointments?status=CANCELED"
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              normalizedStatus === "CANCELED"
                ? "bg-gray-900 text-white"
                : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Cancelados
          </Link>
        </div>

        {appointments.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-gray-600">Nenhum agendamento encontrado.</p>

            <Link
              href="/workshops"
              className="mt-4 inline-block rounded-lg bg-gray-900 px-4 py-2 text-white"
            >
              Ver oficinas
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="rounded-2xl bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {appointment.revisionService.name}
                    </h2>

                    <p className="mt-1 text-gray-600">
                      {appointment.workshop.name} • {appointment.workshop.city}{" "}
                      - {appointment.workshop.state}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Cliente: {appointment.user.name ?? appointment.user.email}
                    </p>

                    {appointment.usedPlan ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                          Plano utilizado
                        </span>

                        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                          {appointment.userPlan?.planPackage?.name ??
                            "AutoCare Club"}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${
                        appointment.status === "CANCELED"
                          ? "bg-red-100 text-red-700"
                          : "bg-[#B11226]/10 text-[#B11226]"
                      }`}
                    >
                      {appointment.status === "SCHEDULED"
                        ? "Agendado"
                        : appointment.status === "CANCELED"
                          ? "Cancelado"
                          : appointment.status}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${
                        appointment.paymentMode === "CLUB"
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {appointment.paymentMode === "CLUB"
                        ? "AutoCare Club"
                        : "Direto"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Data</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(appointment.appointmentDate).toLocaleDateString(
                        "pt-BR",
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Pagamento</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {appointment.paymentMode === "CLUB"
                        ? "AutoCare Club"
                        : "Direto"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Consumo do plano</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {appointment.usedPlan ? "Sim" : "Não"}
                    </p>
                  </div>
                </div>

                {appointment.notes ? (
                  <div className="mt-4 rounded-xl border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">Observações</p>
                    <p className="mt-1 text-gray-700">{appointment.notes}</p>
                  </div>
                ) : null}

                {appointment.status !== "CANCELED" ? (
                  <form action={cancelAppointment} className="mt-4">
                    <input
                      type="hidden"
                      name="appointmentId"
                      value={appointment.id}
                    />
                    <button
                      type="submit"
                      className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                    >
                      Cancelar agendamento
                    </button>
                  </form>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
