import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

interface Props {
  searchParams: Promise<{
    status?: string;
    q?: string;
  }>;
}

function getStatusLabel(status: string) {
  if (status === "ACTIVE") {
    return "Ativo";
  }

  if (status === "CANCELED") {
    return "Cancelado";
  }

  if (status === "EXPIRED") {
    return "Expirado";
  }

  return status;
}

function getStatusClass(status: string) {
  if (status === "ACTIVE") {
    return "bg-green-100 text-green-700";
  }

  if (status === "CANCELED") {
    return "bg-red-100 text-red-700";
  }

  if (status === "EXPIRED") {
    return "bg-gray-100 text-gray-700";
  }

  return "bg-blue-100 text-blue-700";
}

function formatDate(date?: Date | null) {
  if (!date) {
    return "-";
  }

  return new Date(date).toLocaleDateString("pt-BR");
}

function formatCurrency(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

export default async function AdminCustomersPage({ searchParams }: Props) {
  const { status, q } = await searchParams;

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  const normalizedStatus =
    status === "ACTIVE" || status === "CANCELED" || status === "EXPIRED"
      ? status
      : undefined;

  const search = q?.trim();

  const userPlans = await prisma.userPlan.findMany({
    where: {
      ...(normalizedStatus ? { status: normalizedStatus } : {}),
      ...(search
        ? {
            user: {
              OR: [
                {
                  name: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  email: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              ],
            },
          }
        : {}),
    },
    include: {
      user: true,
      planPackage: true,
      appointments: {
        include: {
          workshop: true,
          revisionService: true,
        },
        orderBy: {
          appointmentDate: "desc",
        },
        take: 3,
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const activePlans = userPlans.filter(
    (userPlan) => userPlan.status === "ACTIVE",
  );

  const totalAvailableBalance = activePlans.reduce(
    (total, userPlan) => total + userPlan.availableBalance,
    0,
  );

  const totalUsedRevisions = userPlans.reduce(
    (total, userPlan) => total + userPlan.usedRevisions,
    0,
  );

  const totalContractedRevisions = userPlans.reduce(
    (total, userPlan) => total + userPlan.totalRevisions,
    0,
  );

  const today = new Date();

  const plansInGracePeriod = activePlans.filter(
    (userPlan) => new Date(userPlan.graceUntil) > today,
  ).length;

  const querySuffix = search ? `&q=${encodeURIComponent(search)}` : "";

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-[#B11226] px-6 py-12 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-white/80">
            Administração
          </p>

          <h1 className="mt-2 text-4xl font-bold">Clientes e planos</h1>

          <p className="mt-2 text-white/90">
            Acompanhe clientes com plano ativo, saldo disponível e revisões
            utilizadas
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6">
          <Link
            href="/admin"
            className="text-sm font-semibold text-[#B11226] hover:underline"
          >
            ← Voltar para administração
          </Link>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Planos encontrados</p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {userPlans.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Planos ativos</p>

            <p className="mt-2 text-2xl font-bold text-green-700">
              {activePlans.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Saldo disponível</p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {totalAvailableBalance}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Em carência</p>

            <p className="mt-2 text-2xl font-bold text-yellow-700">
              {plansInGracePeriod}
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
          <form className="grid gap-4 md:grid-cols-[1fr_auto]">
            <input
              name="q"
              defaultValue={search ?? ""}
              placeholder="Buscar por nome ou e-mail do cliente"
              className="rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900"
            />

            <button
              type="submit"
              className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Buscar
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={
                search
                  ? `/admin/customers?q=${encodeURIComponent(search)}`
                  : "/admin/customers"
              }
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                !normalizedStatus
                  ? "bg-gray-900 text-white"
                  : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Todos
            </Link>

            <Link
              href={`/admin/customers?status=ACTIVE${querySuffix}`}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                normalizedStatus === "ACTIVE"
                  ? "bg-gray-900 text-white"
                  : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Ativos
            </Link>

            <Link
              href={`/admin/customers?status=CANCELED${querySuffix}`}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                normalizedStatus === "CANCELED"
                  ? "bg-gray-900 text-white"
                  : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Cancelados
            </Link>

            <Link
              href={`/admin/customers?status=EXPIRED${querySuffix}`}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                normalizedStatus === "EXPIRED"
                  ? "bg-gray-900 text-white"
                  : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Expirados
            </Link>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Revisões contratadas</p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {totalContractedRevisions}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Revisões utilizadas</p>

            <p className="mt-2 text-2xl font-bold text-[#B11226]">
              {totalUsedRevisions}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Saldo restante geral</p>

            <p className="mt-2 text-2xl font-bold text-green-700">
              {totalAvailableBalance}
            </p>
          </div>
        </div>

        {userPlans.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-gray-600">
              Nenhum cliente com plano encontrado.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {userPlans.map((userPlan) => {
              const usedPercentage =
                userPlan.totalRevisions > 0
                  ? Math.round(
                      (userPlan.usedRevisions / userPlan.totalRevisions) * 100,
                    )
                  : 0;

              const isInGracePeriod = new Date(userPlan.graceUntil) > today;

              return (
                <article
                  key={userPlan.id}
                  className="rounded-2xl bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-2xl font-bold text-gray-900">
                          {userPlan.user.name ?? "Cliente sem nome"}
                        </h2>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                            userPlan.status,
                          )}`}
                        >
                          {getStatusLabel(userPlan.status)}
                        </span>

                        {isInGracePeriod ? (
                          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                            Em carência
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-1 text-sm text-gray-500">
                        {userPlan.user.email}
                      </p>

                      {userPlan.user.phone ? (
                        <p className="mt-1 text-sm text-gray-500">
                          {userPlan.user.phone}
                        </p>
                      ) : null}

                      <p className="mt-3 text-sm text-gray-700">
                        Plano:{" "}
                        <span className="font-semibold">
                          {userPlan.planPackage.name}
                        </span>
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
                      <div className="rounded-xl bg-gray-50 p-4">
                        <p className="text-xs text-gray-500">Saldo</p>

                        <p className="mt-1 text-xl font-bold text-green-700">
                          {userPlan.availableBalance}
                        </p>
                      </div>

                      <div className="rounded-xl bg-gray-50 p-4">
                        <p className="text-xs text-gray-500">Usadas</p>

                        <p className="mt-1 text-xl font-bold text-[#B11226]">
                          {userPlan.usedRevisions}
                        </p>
                      </div>

                      <div className="rounded-xl bg-gray-50 p-4">
                        <p className="text-xs text-gray-500">Total</p>

                        <p className="mt-1 text-xl font-bold text-gray-900">
                          {userPlan.totalRevisions}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
                      <span>Consumo do plano</span>
                      <span>{usedPercentage}% utilizado</span>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-[#B11226]"
                        style={{ width: `${Math.min(usedPercentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-4">
                    <div className="rounded-xl border border-gray-200 p-4">
                      <p className="text-xs text-gray-500">Início</p>

                      <p className="mt-1 font-semibold text-gray-900">
                        {formatDate(userPlan.startedAt)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 p-4">
                      <p className="text-xs text-gray-500">Fim da carência</p>

                      <p className="mt-1 font-semibold text-gray-900">
                        {formatDate(userPlan.graceUntil)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 p-4">
                      <p className="text-xs text-gray-500">Expiração</p>

                      <p className="mt-1 font-semibold text-gray-900">
                        {formatDate(userPlan.expiresAt)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-gray-200 p-4">
                      <p className="text-xs text-gray-500">Valor do plano</p>

                      <p className="mt-1 font-semibold text-gray-900">
                        {formatCurrency(Number(userPlan.planPackage.price))}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl border border-gray-200 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">
                        Últimos agendamentos
                      </h3>

                      <div className="flex flex-wrap gap-3">
                        <Link
                          href={`/admin/customers/${userPlan.userId}`}
                          className="text-sm font-semibold text-[#B11226] hover:underline"
                        >
                          Ver detalhes
                        </Link>

                        <Link
                          href={`/admin/appointments?userId=${userPlan.userId}`}
                          className="text-sm font-semibold text-gray-600 hover:underline"
                        >
                          Ver agendamentos
                        </Link>
                      </div>
                    </div>

                    {userPlan.appointments.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        Nenhum agendamento vinculado a este plano.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {userPlan.appointments.map((appointment) => (
                          <div
                            key={appointment.id}
                            className="grid gap-2 rounded-lg bg-gray-50 p-3 text-sm md:grid-cols-[1fr_auto]"
                          >
                            <div>
                              <p className="font-semibold text-gray-900">
                                {appointment.revisionService.name}
                              </p>

                              <p className="text-gray-500">
                                {appointment.workshop.name} •{" "}
                                {formatDate(appointment.appointmentDate)}
                              </p>
                            </div>

                            <span
                              className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                                appointment.status === "COMPLETED"
                                  ? "bg-green-100 text-green-700"
                                  : appointment.status === "CANCELED"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {appointment.status === "COMPLETED"
                                ? "Concluído"
                                : appointment.status === "CANCELED"
                                  ? "Cancelado"
                                  : "Agendado"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
