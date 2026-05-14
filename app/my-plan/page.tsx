import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

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

  const totalSavings = completedAppointments.reduce((total, appointment) => {
    const directPrice = Number(appointment.revisionService.priceDirect);
    const clubPrice = Number(appointment.revisionService.priceClub);

    return total + (directPrice - clubPrice);
  }, 0);

  const availablePackages = await prisma.planPackage.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      revisionsQty: "asc",
    },
  });

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-[#B11226] px-6 py-12 text-white">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-4xl font-bold">Meu Plano</h1>
          <p className="mt-2 text-white/90">
            Acompanhe seu pacote de revisões e consulte seu saldo disponível
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10">
        {userPlan ? (
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">Plano atual</p>

              <h2 className="mt-2 text-3xl font-bold text-gray-900">
                {userPlan.planPackage.name}
              </h2>

              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-gray-500">Status:</span>

                <span
                  className={`rounded-full px-3 py-1 text-sm font-bold ${
                    userPlan.status === "ACTIVE"
                      ? "bg-green-100 text-green-700"
                      : userPlan.status === "CANCELED"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  {userPlan.status === "ACTIVE"
                    ? "Ativo"
                    : userPlan.status === "CANCELED"
                      ? "Cancelado"
                      : "Expirado"}
                </span>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-500">Revisões contratadas</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {userPlan.totalRevisions}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-500">Revisões usadas</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {userPlan.usedRevisions}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-500">Saldo disponível</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {userPlan.availableBalance}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-500">Carência até</p>
                <p className="mt-2 text-lg font-bold text-gray-900">
                  {new Date(userPlan.graceUntil).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-500">Revisões concluídas</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {completedAppointments.length}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-500">Economia total</p>
                <p className="mt-2 text-3xl font-bold text-green-700">
                  R$ {totalSavings.toFixed(2).replace(".", ",")}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <p className="text-sm text-gray-500">
                  Próxima revisão sugerida
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {completedAppointments.length < userPlan.totalRevisions
                    ? `${completedAppointments.length + 1}ª revisão do plano`
                    : "Plano finalizado"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900">
                Detalhes do pacote
              </h3>

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
              <h3 className="text-xl font-bold text-gray-900">
                Histórico de revisões concluídas
              </h3>

              {completedAppointments.length === 0 ? (
                <p className="mt-4 text-sm text-gray-600">
                  Nenhuma revisão do plano foi concluída ainda.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
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
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="font-bold text-gray-900">
                              {appointment.revisionService.name}
                            </p>

                            <p className="mt-1 text-sm text-gray-600">
                              {appointment.workshop.name} •{" "}
                              {appointment.workshop.city} -{" "}
                              {appointment.workshop.state}
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                              Concluída em{" "}
                              {new Date(
                                appointment.appointmentDate,
                              ).toLocaleDateString("pt-BR")}
                            </p>

                            <p className="mt-1 text-sm font-semibold text-green-700">
                              Economia: R$ {saving.toFixed(2).replace(".", ",")}
                            </p>
                          </div>

                          <span className="w-fit rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                            Concluída
                          </span>
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
                className="rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white transition hover:bg-black"
              >
                Ver meus agendamentos
              </Link>

              <Link
                href="/workshops"
                className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-100"
              >
                Explorar oficinas
              </Link>

              <Link
                href="/plans"
                className="rounded-lg bg-[#B11226] px-5 py-3 font-semibold text-white transition hover:opacity-90"
              >
                Trocar ou contratar plano
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900">
                Você ainda não possui um plano ativo
              </h2>

              <p className="mt-3 text-gray-600">
                Escolha um pacote do myRiseCare para começar a acompanhar suas
                revisões com mais previsibilidade.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {availablePackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="rounded-2xl bg-white p-6 shadow-sm"
                >
                  <p className="text-sm text-gray-500">Pacote</p>

                  <h3 className="mt-2 text-2xl font-bold text-gray-900">
                    {pkg.name}
                  </h3>

                  <div className="mt-4 space-y-2 text-sm text-gray-600">
                    <p>
                      <span className="font-semibold text-gray-900">
                        {pkg.revisionsQty}
                      </span>{" "}
                      revisões
                    </p>

                    <p>
                      <span className="font-semibold text-gray-900">
                        {pkg.discountPct}%
                      </span>{" "}
                      de desconto
                    </p>

                    <p>
                      <span className="font-semibold text-gray-900">
                        {pkg.graceDays} dias
                      </span>{" "}
                      de carência
                    </p>
                  </div>

                  <Link
                    href="/plans"
                    className="mt-6 block rounded-lg bg-[#B11226] px-5 py-3 text-center font-semibold text-white"
                  >
                    Contratar plano
                  </Link>
                </div>
              ))}
            </div>

            <Link
              href="/workshops"
              className="inline-block rounded-lg bg-[#B11226] px-5 py-3 font-semibold text-white transition hover:opacity-90"
            >
              Ver oficinas
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
