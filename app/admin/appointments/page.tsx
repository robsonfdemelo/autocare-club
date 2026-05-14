import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

interface Props {
  searchParams: Promise<{
    userId?: string;
    status?: string;
    success?: string;
    error?: string;
  }>;
}

function buildAdminAppointmentsUrl(params: {
  userId?: string;
  status?: string;
  success?: string;
  error?: string;
}) {
  const searchParams = new URLSearchParams();

  if (params.userId) {
    searchParams.set("userId", params.userId);
  }

  if (params.status) {
    searchParams.set("status", params.status);
  }

  if (params.success) {
    searchParams.set("success", params.success);
  }

  if (params.error) {
    searchParams.set("error", params.error);
  }

  const query = searchParams.toString();

  return query ? `/admin/appointments?${query}` : "/admin/appointments";
}

function getStatusLabel(status: string) {
  if (status === "SCHEDULED") {
    return "Agendado";
  }

  if (status === "COMPLETED") {
    return "Concluído";
  }

  if (status === "CANCELED") {
    return "Cancelado";
  }

  return status;
}

function getStatusClass(status: string) {
  if (status === "SCHEDULED") {
    return "bg-blue-100 text-blue-700";
  }

  if (status === "COMPLETED") {
    return "bg-green-100 text-green-700";
  }

  if (status === "CANCELED") {
    return "bg-red-100 text-red-700";
  }

  return "bg-gray-100 text-gray-700";
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("pt-BR");
}

async function completeAppointment(formData: FormData) {
  "use server";

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  const appointmentId = formData.get("appointmentId") as string;
  const userId = formData.get("userId") as string | null;
  const status = formData.get("status") as string | null;

  const baseRedirect = buildAdminAppointmentsUrl({
    userId: userId || undefined,
    status: status || undefined,
  });

  if (!appointmentId) {
    redirect(baseRedirect);
  }

  const appointment = await prisma.appointment.findUnique({
    where: {
      id: appointmentId,
    },
    include: {
      userPlan: true,
    },
  });

  if (!appointment) {
    redirect(baseRedirect);
  }

  if (appointment.status === "COMPLETED") {
    redirect(
      buildAdminAppointmentsUrl({
        userId: userId || undefined,
        status: status || undefined,
        error: "already-completed",
      }),
    );
  }

  if (appointment.status === "CANCELED") {
    redirect(
      buildAdminAppointmentsUrl({
        userId: userId || undefined,
        status: status || undefined,
        error: "already-canceled",
      }),
    );
  }

  if (appointment.usedPlan && appointment.userPlanId && appointment.userPlan) {
    if (appointment.userPlan.availableBalance <= 0) {
      redirect(
        buildAdminAppointmentsUrl({
          userId: userId || undefined,
          status: status || undefined,
          error: "saldo-insuficiente",
        }),
      );
    }

    const now = new Date();
    const shouldExpirePlan = appointment.userPlan.availableBalance <= 1;

    await prisma.$transaction([
      prisma.appointment.update({
        where: {
          id: appointment.id,
        },
        data: {
          status: "COMPLETED",
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
          ...(shouldExpirePlan
            ? {
                status: "EXPIRED",
                expiresAt: now,
              }
            : {}),
        },
      }),
    ]);
  } else {
    await prisma.appointment.update({
      where: {
        id: appointment.id,
      },
      data: {
        status: "COMPLETED",
      },
    });
  }

  redirect(
    buildAdminAppointmentsUrl({
      userId: userId || undefined,
      status: status || undefined,
      success: "completed",
    }),
  );
}

export default async function AdminAppointmentsPage({ searchParams }: Props) {
  const { userId, status, success, error } = await searchParams;

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  const normalizedStatus =
    status === "SCHEDULED" ||
    status === "COMPLETED" ||
    status === "CANCELED"
      ? status
      : undefined;

  const selectedUser = userId
    ? await prisma.user.findUnique({
        where: {
          id: userId,
        },
      })
    : null;

  const appointments = await prisma.appointment.findMany({
    where: {
      ...(userId ? { userId } : {}),
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
    success === "completed" ? "Serviço concluído com sucesso." : "";

  const errorMessage =
    error === "saldo-insuficiente"
      ? "Não foi possível concluir: o plano do cliente não possui saldo disponível."
      : error === "already-completed"
        ? "Esse agendamento já estava concluído."
        : error === "already-canceled"
          ? "Não é possível concluir um agendamento cancelado."
          : "";

  const allUrl = buildAdminAppointmentsUrl({
    userId: userId || undefined,
  });

  const scheduledUrl = buildAdminAppointmentsUrl({
    userId: userId || undefined,
    status: "SCHEDULED",
  });

  const completedUrl = buildAdminAppointmentsUrl({
    userId: userId || undefined,
    status: "COMPLETED",
  });

  const canceledUrl = buildAdminAppointmentsUrl({
    userId: userId || undefined,
    status: "CANCELED",
  });

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-[#B11226] px-6 py-12 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-white/80">
            Administração
          </p>

          <h1 className="mt-2 text-4xl font-bold">Agendamentos</h1>

          <p className="mt-2 text-white/90">
            Gerencie, conclua serviços e controle o consumo dos planos
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex flex-wrap gap-3">
          <Link
            href="/admin"
            className="text-sm font-semibold text-[#B11226] hover:underline"
          >
            ← Voltar para administração
          </Link>

          {userId ? (
            <Link
              href="/admin/appointments"
              className="text-sm font-semibold text-gray-600 hover:underline"
            >
              Limpar filtro de cliente
            </Link>
          ) : null}
        </div>

        {selectedUser ? (
          <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-800 shadow-sm">
            <p className="font-semibold">
              Filtrando agendamentos do cliente:
            </p>

            <p className="mt-1">
              {selectedUser.name ?? "Cliente sem nome"} • {selectedUser.email}
            </p>
          </div>
        ) : null}

        {successMessage ? (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800 shadow-sm">
            <p className="font-medium">{successMessage}</p>
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 shadow-sm">
            <p className="font-medium">{errorMessage}</p>
          </div>
        ) : null}

        <div className="mb-6 flex flex-wrap gap-3">
          <Link
            href={allUrl}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              !normalizedStatus
                ? "bg-gray-900 text-white"
                : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Todos
          </Link>

          <Link
            href={scheduledUrl}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              normalizedStatus === "SCHEDULED"
                ? "bg-gray-900 text-white"
                : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Agendados
          </Link>

          <Link
            href={completedUrl}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              normalizedStatus === "COMPLETED"
                ? "bg-gray-900 text-white"
                : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
            }`}
          >
            Concluídos
          </Link>

          <Link
            href={canceledUrl}
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
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <article
                key={appointment.id}
                className="rounded-2xl bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {appointment.revisionService.name}
                    </h2>

                    <p className="mt-1 text-gray-600">
                      {appointment.workshop.name} • {appointment.workshop.city}{" "}
                      - {appointment.workshop.state}
                    </p>

                    <p className="mt-2 text-sm text-gray-500">
                      Cliente:{" "}
                      <span className="font-semibold text-gray-700">
                        {appointment.user.name ?? appointment.user.email}
                      </span>
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Data: {formatDate(appointment.appointmentDate)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusClass(
                        appointment.status,
                      )}`}
                    >
                      {getStatusLabel(appointment.status)}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${
                        appointment.paymentMode === "CLUB"
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {appointment.paymentMode === "CLUB"
                        ? "myRiseCare"
                        : "Direto"}
                    </span>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-4">
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs text-gray-500">Pagamento</p>

                    <p className="mt-1 font-semibold text-gray-900">
                      {appointment.paymentMode === "CLUB"
                        ? "Plano"
                        : "Direto"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs text-gray-500">Plano utilizado</p>

                    <p className="mt-1 font-semibold text-gray-900">
                      {appointment.usedPlan ? "Sim" : "Não"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs text-gray-500">Pacote</p>

                    <p className="mt-1 font-semibold text-gray-900">
                      {appointment.userPlan?.planPackage?.name ?? "-"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs text-gray-500">Saldo atual</p>

                    <p className="mt-1 font-semibold text-gray-900">
                      {appointment.userPlan
                        ? appointment.userPlan.availableBalance
                        : "-"}
                    </p>
                  </div>
                </div>

                {appointment.notes ? (
                  <div className="mt-4 rounded-xl border border-gray-200 p-4">
                    <p className="text-xs text-gray-500">Observações</p>

                    <p className="mt-1 text-sm text-gray-700">
                      {appointment.notes}
                    </p>
                  </div>
                ) : null}

                {appointment.status === "SCHEDULED" ? (
                  <form action={completeAppointment} className="mt-5">
                    <input
                      type="hidden"
                      name="appointmentId"
                      value={appointment.id}
                    />

                    {userId ? (
                      <input type="hidden" name="userId" value={userId} />
                    ) : null}

                    {normalizedStatus ? (
                      <input
                        type="hidden"
                        name="status"
                        value={normalizedStatus}
                      />
                    ) : null}

                    <button
                      type="submit"
                      className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                    >
                      Concluir serviço
                    </button>
                  </form>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}