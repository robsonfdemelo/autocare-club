import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "../lib/auth";
import { prisma } from "../lib/prisma";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  const [nextAppointment, appointmentsCount, vehiclesCount] = await (async () => {
    try {
      if (!session?.user?.id) {
        return [null, 0, 0] as const;
      }

      const [appointment, totalAppointments, totalVehicles] =
        await prisma.$transaction([
          prisma.appointment.findFirst({
            where: {
              userId: session.user.id,
              status: "SCHEDULED",
            },
            include: {
              workshop: true,
              revisionService: true,
              vehicle: true,
            },
            orderBy: {
              appointmentDate: "asc",
            },
          }),
          prisma.appointment.count({
            where: {
              userId: session.user.id,
            },
          }),
          prisma.vehicle.count({
            where: {
              userId: session.user.id,
            },
          }),
        ]);

      return [appointment, totalAppointments, totalVehicles] as const;
    } catch {
      return [null, 0, 0] as const;
    }
  })();

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-[#B11226] text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
              myRiseCare
            </p>

            <h1 className="mt-4 text-5xl font-bold leading-tight">
              Revisões planejadas com preço previsível
            </h1>

            <p className="mt-5 max-w-xl text-lg text-white/90">
              Compre pacotes de revisões antecipadamente, acompanhe seu saldo,
              cadastre seus veículos e agende serviços com mais controle.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/workshops"
                className="rounded-lg bg-white px-5 py-3 font-semibold text-[#B11226] transition hover:bg-gray-100"
              >
                Ver oficinas
              </Link>

              <Link
                href="/plans"
                className="rounded-lg border border-white px-5 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Ver planos
              </Link>

              {!session?.user ? (
                <Link
                  href="/register"
                  className="rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white transition hover:bg-black"
                >
                  Criar conta
                </Link>
              ) : (
                <Link
                  href="/vehicles"
                  className="rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white transition hover:bg-black"
                >
                  Meus veículos
                </Link>
              )}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 text-gray-900 shadow-lg">
            <p className="text-sm font-medium text-gray-500">
              {session?.user ? "Resumo da sua conta" : "Comece agora"}
            </p>

            {session?.user ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Usuário</p>

                  <p className="text-xl font-bold text-gray-900">
                    {session.user.name ?? session.user.email}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Agendamentos</p>

                    <p className="text-3xl font-bold text-gray-900">
                      {appointmentsCount}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-sm text-gray-500">Veículos</p>

                    <p className="text-3xl font-bold text-gray-900">
                      {vehiclesCount}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Próxima revisão</p>

                  {nextAppointment ? (
                    <>
                      <p className="text-lg font-bold text-gray-900">
                        {nextAppointment.revisionService.name}
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        {nextAppointment.workshop.name}
                      </p>

                      {nextAppointment.vehicle ? (
                        <p className="mt-1 text-sm text-gray-600">
                          {nextAppointment.vehicle.brand}{" "}
                          {nextAppointment.vehicle.model}
                        </p>
                      ) : null}

                      <p className="mt-1 text-sm text-gray-500">
                        {new Date(
                          nextAppointment.appointmentDate,
                        ).toLocaleDateString("pt-BR")}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Nenhum agendamento ativo no momento.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">1. Crie sua conta</p>

                  <p className="mt-1 font-semibold text-gray-900">
                    Cadastre-se para acessar seus planos e agendamentos
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">
                    2. Cadastre seu veículo
                  </p>

                  <p className="mt-1 font-semibold text-gray-900">
                    Informe modelo, ano e quilometragem atual
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">
                    3. Agende sua revisão
                  </p>

                  <p className="mt-1 font-semibold text-gray-900">
                    Escolha a oficina, a revisão e a forma de pagamento
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="text-3xl font-bold text-gray-900">
          Vantagens do myRiseCare
        </h2>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900">💰 Economia</h3>

            <p className="mt-3 text-gray-600">
              Pacotes de 3 a 6 revisões com descontos progressivos de até 15%.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900">📅 Planejamento</h3>

            <p className="mt-3 text-gray-600">
              Organize suas revisões por quilometragem, período e saldo
              disponível.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900">🚗 Conveniência</h3>

            <p className="mt-3 text-gray-600">
              Cadastre seus veículos, agende rapidamente e acompanhe tudo pelo
              sistema.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="text-3xl font-bold text-gray-900">Como funciona</h2>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900">
                1. Cadastre-se
              </h3>

              <p className="mt-3 text-gray-600">
                Crie sua conta para acessar seu painel, veículos, planos e
                agendamentos.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900">
                2. Escolha o plano
              </h3>

              <p className="mt-3 text-gray-600">
                Contrate revisões pré-pagas com preço fixo e saldo para uso
                futuro.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900">
                3. Agende online
              </h3>

              <p className="mt-3 text-gray-600">
                Selecione oficina, veículo, data e acompanhe o histórico na sua
                conta.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="rounded-3xl bg-gray-900 px-8 py-10 text-white">
          <h2 className="text-3xl font-bold">
            Pronto para cuidar melhor do seu veículo?
          </h2>

          <p className="mt-3 max-w-2xl text-white/80">
            Acesse as oficinas, consulte revisões disponíveis, cadastre seus
            veículos e mantenha seus serviços organizados em um só lugar.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/workshops"
              className="rounded-lg bg-white px-5 py-3 font-semibold text-gray-900 transition hover:bg-gray-100"
            >
              Explorar oficinas
            </Link>

            <Link
              href="/plans"
              className="rounded-lg border border-white px-5 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Ver planos
            </Link>

            {!session?.user ? (
              <Link
                href="/login"
                className="rounded-lg border border-white px-5 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Entrar
              </Link>
            ) : (
              <Link
                href="/appointments"
                className="rounded-lg border border-white px-5 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Ver meus agendamentos
              </Link>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}