import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

function formatDate(date?: Date | null) {
  if (!date) {
    return "-";
  }

  return new Date(date).toLocaleDateString("pt-BR");
}

function formatCurrency(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
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

export default async function MyPlanPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userPlan = await prisma.userPlan.findUnique({
    where: {
      userId: session.user.id,
    },
    include: {
      planPackage: true,
    },
  });

  const completedAppointments = await prisma.appointment.findMany({
    where: {
      userId: session.user.id,
      status: "COMPLETED",
      usedPlan: true,
    },
    include: {
      workshop: true,
      revisionService: true,
    },
    orderBy: {
      appointmentDate: "desc",
    },
  });

  const nextPlanAppointment = await prisma.appointment.findFirst({
    where: {
      userId: session.user.id,
      status: "SCHEDULED",
      usedPlan: true,
    },
    include: {
      workshop: true,
      revisionService: true,
    },
    orderBy: {
      appointmentDate: "asc",
    },
  });

  const availablePackages = await prisma.planPackage.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      revisionsQty: "asc",
    },
  });

  const totalSavings = completedAppointments.reduce((total, appointment) => {
    const directPrice = Number(appointment.revisionService.priceDirect);
    const clubPrice = Number(appointment.revisionService.priceClub);

    return total + (directPrice - clubPrice);
  }, 0);

  const today = new Date();

  const isInGracePeriod = userPlan
    ? new Date(userPlan.graceUntil) > today
    : false;

  const hasActivePlan = userPlan?.status === "ACTIVE";
  const hasAvailableBalance = userPlan ? userPlan.availableBalance > 0 : false;
  const canUsePlan = hasActivePlan && hasAvailableBalance && !isInGracePeriod;

  const usedPercentage =
    userPlan && userPlan.totalRevisions > 0
      ? Math.round((userPlan.usedRevisions / userPlan.totalRevisions) * 100)
      : 0;

  const nextRevisionLabel =
    userPlan && userPlan.availableBalance > 0
      ? `${userPlan.usedRevisions + 1}ª revisão do plano`
      : "Plano finalizado";

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-[#B11226] px-6 py-12 text-white">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-bold">Meu Plano</h1>

          <p className="mt-2 text-white/90">
            Acompanhe seu pacote de revisões, saldo disponível e histórico de
            uso
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        {userPlan ? (
          <div className="space-y-6">
            {userPlan.status === "EXPIRED" || userPlan.availableBalance <= 0 ? (
              <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5 text-yellow-800 shadow-sm">
                <h2 className="text-lg font-bold">
                  Seu plano foi finalizado
                </h2>

                <p className="mt-1 text-sm">
                  Você já utilizou todas as revisões disponíveis neste pacote.
                  Para continuar usando os benefícios do myRiseCare, contrate um
                  novo plano.
                </p>

                <Link
                  href="/plans"
                  className="mt-4 inline-block rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Contratar novo plano
                </Link>
              </div>
            ) : null}

            {userPlan.status === "CANCELED" ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800 shadow-sm">
                <h2 className="text-lg font-bold">Plano cancelado</h2>

                <p className="mt-1 text-sm">
                  Este plano não está mais disponível para uso. Contrate um novo
                  pacote para voltar a agendar revisões com saldo.
                </p>

                <Link
                  href="/plans"
                  className="mt-4 inline-block rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Ver planos disponíveis
                </Link>
              </div>
            ) : null}

            {isInGracePeriod && userPlan.status === "ACTIVE" ? (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 text-blue-800 shadow-sm">
                <h2 className="text-lg font-bold">Plano em carência</h2>

                <p className="mt-1 text-sm">
                  Seu plano está ativo, mas só poderá ser utilizado após{" "}
                  <strong>{formatDate(userPlan.graceUntil)}</strong>.
                </p>
              </div>
            ) : null}

            {canUsePlan ? (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-green-800 shadow-sm">
                <h2 className="text-lg font-bold">Plano disponível para uso</h2>

                <p className="mt-1 text-sm">
                  Você possui saldo disponível para agendar revisões usando seu
                  pacote myRiseCare.
                </p>

                <Link
                  href="/workshops"
                  className="mt-4 inline-block rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Agendar revisão
                </Link>
              </div>
            ) : null}

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                    Plano atual
                  </p>

                  <h2 className="mt-1 text-3xl font-bold text-gray-900">
                    {userPlan.planPackage.name}
                  </h2>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusClass(
                        userPlan.status,
                      )}`}
                    >
                      {getStatusLabel(userPlan.status)}
                    </span>

                    {isInGracePeriod ? (
                      <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-700">
                        Em carência
                      </span>
                    ) : null}
                  </div>
                </div>

                <Link
                  href="/plans"
                  className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                >
                  Trocar ou contratar plano
                </Link>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-4">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">
                    Revisões contratadas
                  </p>

                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {userPlan.totalRevisions}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Revisões usadas</p>

                  <p className="mt-2 text-2xl font-bold text-[#B11226]">
                    {userPlan.usedRevisions}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Saldo disponível</p>

                  <p className="mt-2 text-2xl font-bold text-green-700">
                    {userPlan.availableBalance}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Economia total</p>

                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {formatCurrency(totalSavings)}
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
                  <p className="text-sm text-gray-500">Início do plano</p>

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
                  <p className="text-sm text-gray-500">
                    Próxima revisão sugerida
                  </p>

                  <p className="mt-1 font-semibold text-gray-900">
                    {nextRevisionLabel}
                  </p>
                </div>
              </div>
            </div>

            {nextPlanAppointment ? (
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900">
                  Próximo agendamento pelo plano
                </h2>

                <div className="mt-4 rounded-xl border border-gray-200 p-4">
                  <p className="font-semibold text-gray-900">
                    {nextPlanAppointment.revisionService.name}
                  </p>

                  <p className="mt-1 text-sm text-gray-600">
                    {nextPlanAppointment.workshop.name} •{" "}
                    {nextPlanAppointment.workshop.city} -{" "}
                    {nextPlanAppointment.workshop.state}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    Data: {formatDate(nextPlanAppointment.appointmentDate)}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900">
                Detalhes do pacote
              </h2>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">
                    Quantidade de revisões
                  </p>

                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {userPlan.planPackage.revisionsQty}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Desconto</p>

                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {userPlan.planPackage.discountPct}%
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Carência</p>

                  <p className="mt-1 text-lg font-semibold text-gray-900">
                    {userPlan.planPackage.graceDays} dias
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900">
                Histórico de revisões concluídas
              </h2>

              {completedAppointments.length === 0 ? (
                <p className="mt-4 text-gray-600">
                  Nenhuma revisão do plano foi concluída ainda.
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {completedAppointments.map((appointment) => {
                    const directPrice = Number(
                      appointment.revisionService.priceDirect,
                    );
                    const clubPrice = Number(
                      appointment.revisionService.priceClub,
                    );
                    const saving = directPrice - clubPrice;

                    return (
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
                              Concluída em{" "}
                              {formatDate(appointment.appointmentDate)}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                              Concluída
                            </span>

                            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                              Economia: {formatCurrency(saving)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/appointments"
                className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Ver meus agendamentos
              </Link>

              <Link
                href="/workshops"
                className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
              >
                Explorar oficinas
              </Link>

              <Link
                href="/plans"
                className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
              >
                Ver planos
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900">
                Você ainda não possui um plano
              </h2>

              <p className="mt-2 text-gray-600">
                Escolha um pacote do myRiseCare para começar a acompanhar suas
                revisões com mais previsibilidade.
              </p>

              <Link
                href="/plans"
                className="mt-5 inline-block rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Ver planos disponíveis
              </Link>
            </div>

            {availablePackages.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-3">
                {availablePackages.map((pkg) => (
                  <article
                    key={pkg.id}
                    className="rounded-2xl bg-white p-6 shadow-sm"
                  >
                    <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                      Pacote
                    </p>

                    <h3 className="mt-1 text-xl font-bold text-gray-900">
                      {pkg.name}
                    </h3>

                    <p className="mt-4 text-2xl font-bold text-[#B11226]">
                      {formatCurrency(Number(pkg.price))}
                    </p>

                    <div className="mt-4 space-y-2 text-sm text-gray-600">
                      <p>{pkg.revisionsQty} revisões</p>
                      <p>{pkg.discountPct}% de desconto</p>
                      <p>{pkg.graceDays} dias de carência</p>
                    </div>

                    <Link
                      href="/plans"
                      className="mt-5 block rounded-lg bg-gray-900 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-gray-800"
                    >
                      Contratar plano
                    </Link>
                  </article>
                ))}
              </div>
            ) : null}

            <Link
              href="/workshops"
              className="inline-block rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Ver oficinas
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}