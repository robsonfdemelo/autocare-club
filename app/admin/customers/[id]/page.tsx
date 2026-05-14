import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

interface Props {
  params: Promise<{
    id: string;
  }>;
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

function getPlanStatusLabel(status?: string) {
  if (status === "ACTIVE") {
    return "Ativo";
  }

  if (status === "CANCELED") {
    return "Cancelado";
  }

  if (status === "EXPIRED") {
    return "Expirado";
  }

  return status ?? "-";
}

function getPlanStatusClass(status?: string) {
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

function getAppointmentStatusLabel(status: string) {
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

function getAppointmentStatusClass(status: string) {
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

function getPaymentStatusLabel(status: string) {
  const normalizedStatus = status.toUpperCase();

  if (
    normalizedStatus === "RECEIVED" ||
    normalizedStatus === "CONFIRMED" ||
    normalizedStatus === "PAYMENT_RECEIVED" ||
    normalizedStatus === "PAYMENT_CONFIRMED"
  ) {
    return "Pago";
  }

  if (
    normalizedStatus === "PENDING" ||
    normalizedStatus === "AWAITING_PAYMENT"
  ) {
    return "Pendente";
  }

  if (
    normalizedStatus === "OVERDUE" ||
    normalizedStatus === "PAYMENT_OVERDUE"
  ) {
    return "Vencido";
  }

  if (
    normalizedStatus === "CANCELED" ||
    normalizedStatus === "PAYMENT_DELETED"
  ) {
    return "Cancelado";
  }

  return status;
}

function getPaymentStatusClass(status: string) {
  const normalizedStatus = status.toUpperCase();

  if (
    normalizedStatus === "RECEIVED" ||
    normalizedStatus === "CONFIRMED" ||
    normalizedStatus === "PAYMENT_RECEIVED" ||
    normalizedStatus === "PAYMENT_CONFIRMED"
  ) {
    return "bg-green-100 text-green-700";
  }

  if (
    normalizedStatus === "PENDING" ||
    normalizedStatus === "AWAITING_PAYMENT"
  ) {
    return "bg-yellow-100 text-yellow-700";
  }

  if (
    normalizedStatus === "OVERDUE" ||
    normalizedStatus === "PAYMENT_OVERDUE"
  ) {
    return "bg-red-100 text-red-700";
  }

  if (
    normalizedStatus === "CANCELED" ||
    normalizedStatus === "PAYMENT_DELETED"
  ) {
    return "bg-gray-100 text-gray-700";
  }

  return "bg-blue-100 text-blue-700";
}

export default async function AdminCustomerDetailsPage({ params }: Props) {
  const { id } = await params;

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  const customer = await prisma.user.findUnique({
    where: {
      id,
    },
    include: {
      userPlan: {
        include: {
          planPackage: true,
        },
      },
      payments: {
        include: {
          planPackage: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      appointments: {
        include: {
          workshop: true,
          revisionService: true,
          userPlan: {
            include: {
              planPackage: true,
            },
          },
        },
        orderBy: {
          appointmentDate: "desc",
        },
      },
    },
  });

  if (!customer) {
    notFound();
  }

  const completedAppointments = customer.appointments.filter(
    (appointment) => appointment.status === "COMPLETED",
  );

  const scheduledAppointments = customer.appointments.filter(
    (appointment) => appointment.status === "SCHEDULED",
  );

  const canceledAppointments = customer.appointments.filter(
    (appointment) => appointment.status === "CANCELED",
  );

  const planAppointments = customer.appointments.filter(
    (appointment) => appointment.usedPlan,
  );

  const totalPaid = customer.payments
    .filter((payment) => {
      const status = payment.status.toUpperCase();

      return (
        status === "RECEIVED" ||
        status === "CONFIRMED" ||
        status === "PAYMENT_RECEIVED" ||
        status === "PAYMENT_CONFIRMED"
      );
    })
    .reduce((total, payment) => total + Number(payment.value), 0);

  const totalSavings = completedAppointments
    .filter((appointment) => appointment.usedPlan)
    .reduce((total, appointment) => {
      const directPrice = Number(appointment.revisionService.priceDirect);
      const clubPrice = Number(appointment.revisionService.priceClub);

      return total + (directPrice - clubPrice);
    }, 0);

  const userPlan = customer.userPlan;

  const usedPercentage =
    userPlan && userPlan.totalRevisions > 0
      ? Math.round((userPlan.usedRevisions / userPlan.totalRevisions) * 100)
      : 0;

  const today = new Date();

  const isInGracePeriod = userPlan
    ? new Date(userPlan.graceUntil) > today
    : false;

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-[#B11226] px-6 py-12 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-white/80">
            Administração
          </p>

          <h1 className="mt-2 text-4xl font-bold">Detalhes do cliente</h1>

          <p className="mt-2 text-white/90">
            Consulte plano, pagamentos e agendamentos do cliente
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex flex-wrap gap-3">
          <Link
            href="/admin/customers"
            className="text-sm font-semibold text-[#B11226] hover:underline"
          >
            ← Voltar para clientes e planos
          </Link>

          <Link
            href={`/admin/appointments?userId=${customer.id}`}
            className="text-sm font-semibold text-gray-600 hover:underline"
          >
            Ver agendamentos filtrados
          </Link>
        </div>

        <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Cliente
              </p>

              <h2 className="mt-1 text-3xl font-bold text-gray-900">
                {customer.name ?? "Cliente sem nome"}
              </h2>

              <div className="mt-3 space-y-1 text-sm text-gray-600">
                <p>{customer.email}</p>

                {customer.phone ? <p>{customer.phone}</p> : null}

                <p>Cadastrado em {formatDate(customer.createdAt)}</p>
              </div>
            </div>

            <span className="w-fit rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
              {customer.role === "ADMIN" ? "Administrador" : "Cliente"}
            </span>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Agendamentos</p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {customer.appointments.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Concluídos</p>

            <p className="mt-2 text-2xl font-bold text-green-700">
              {completedAppointments.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total pago</p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {formatCurrency(totalPaid)}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Economia estimada</p>

            <p className="mt-2 text-2xl font-bold text-[#B11226]">
              {formatCurrency(totalSavings)}
            </p>
          </div>
        </div>

        {userPlan ? (
          <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Plano atual
                </p>

                <h2 className="mt-1 text-2xl font-bold text-gray-900">
                  {userPlan.planPackage.name}
                </h2>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-semibold ${getPlanStatusClass(
                      userPlan.status,
                    )}`}
                  >
                    {getPlanStatusLabel(userPlan.status)}
                  </span>

                  {isInGracePeriod ? (
                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-700">
                      Em carência
                    </span>
                  ) : null}
                </div>
              </div>

              <Link
                href={`/admin/appointments?userId=${customer.id}`}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Ver agendamentos do plano
              </Link>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Total contratado</p>

                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {userPlan.totalRevisions}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Usadas</p>

                <p className="mt-2 text-2xl font-bold text-[#B11226]">
                  {userPlan.usedRevisions}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Saldo</p>

                <p className="mt-2 text-2xl font-bold text-green-700">
                  {userPlan.availableBalance}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Valor do plano</p>

                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {formatCurrency(Number(userPlan.planPackage.price))}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-sm text-gray-500">
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

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Início</p>

                <p className="mt-1 font-semibold text-gray-900">
                  {formatDate(userPlan.startedAt)}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Carência até</p>

                <p className="mt-1 font-semibold text-gray-900">
                  {formatDate(userPlan.graceUntil)}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Expiração</p>

                <p className="mt-1 font-semibold text-gray-900">
                  {formatDate(userPlan.expiresAt)}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Revisões do plano</p>

                <p className="mt-1 font-semibold text-gray-900">
                  {planAppointments.length}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-8 rounded-2xl border border-yellow-200 bg-yellow-50 p-5 text-yellow-800 shadow-sm">
            <h2 className="text-lg font-bold">Cliente sem plano ativo</h2>

            <p className="mt-1 text-sm">
              Este cliente ainda não possui plano vinculado.
            </p>
          </div>
        )}

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Agendados</p>

            <p className="mt-2 text-2xl font-bold text-blue-700">
              {scheduledAppointments.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Concluídos</p>

            <p className="mt-2 text-2xl font-bold text-green-700">
              {completedAppointments.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Cancelados</p>

            <p className="mt-2 text-2xl font-bold text-red-700">
              {canceledAppointments.length}
            </p>
          </div>
        </div>

        <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">Pagamentos</h2>

          {customer.payments.length === 0 ? (
            <p className="mt-4 text-gray-600">
              Nenhum pagamento encontrado para este cliente.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Plano</th>
                    <th className="px-4 py-3 font-semibold">Valor</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Forma</th>
                    <th className="px-4 py-3 font-semibold">Data</th>
                    <th className="px-4 py-3 font-semibold">Ação</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {customer.payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-4 py-4 text-gray-700">
                        {payment.planPackage.name}
                      </td>

                      <td className="px-4 py-4 font-semibold text-gray-900">
                        {formatCurrency(Number(payment.value))}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getPaymentStatusClass(
                            payment.status,
                          )}`}
                        >
                          {getPaymentStatusLabel(payment.status)}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-gray-700">
                        {payment.billingType}
                      </td>

                      <td className="px-4 py-4 text-gray-700">
                        {formatDate(payment.createdAt)}
                      </td>

                      <td className="px-4 py-4">
                        {payment.invoiceUrl ? (
                          <a
                            href={payment.invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-gray-800"
                          >
                            Abrir cobrança
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">
                            Sem link
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">Agendamentos</h2>

          {customer.appointments.length === 0 ? (
            <p className="mt-4 text-gray-600">
              Nenhum agendamento encontrado para este cliente.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {customer.appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {appointment.revisionService.name}
                      </h3>

                      <p className="mt-1 text-sm text-gray-600">
                        {appointment.workshop.name} •{" "}
                        {appointment.workshop.city} -{" "}
                        {appointment.workshop.state}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Data: {formatDate(appointment.appointmentDate)}
                      </p>

                      {appointment.notes ? (
                        <p className="mt-1 text-sm text-gray-500">
                          Observação: {appointment.notes}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getAppointmentStatusClass(
                          appointment.status,
                        )}`}
                      >
                        {getAppointmentStatusLabel(appointment.status)}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          appointment.paymentMode === "CLUB"
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {appointment.paymentMode === "CLUB"
                          ? "myRiseCare"
                          : "Direto"}
                      </span>

                      {appointment.usedPlan ? (
                        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                          Plano usado
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}