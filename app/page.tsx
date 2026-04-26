import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";
import { prisma } from "../lib/prisma";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  const nextAppointment = session?.user?.id
    ? await prisma.appointment.findFirst({
        where: {
          userId: session.user.id,
          status: "SCHEDULED",
        },
        include: {
          workshop: true,
          revisionService: true,
        },
        orderBy: {
          appointmentDate: "asc",
        },
      })
    : null;

  const appointmentsCount = session?.user?.id
    ? await prisma.appointment.count({
        where: {
          userId: session.user.id,
        },
      })
    : 0;

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-[#B11226] text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
              AutoCare Club
            </p>

            <h1 className="mt-4 text-5xl font-bold leading-tight">
              Revisões planejadas com preço previsível
            </h1>

            <p className="mt-5 max-w-xl text-lg text-white/90">
              Encontre oficinas, agende revisões, acompanhe seus serviços e
              tenha mais controle sobre a manutenção do seu veículo.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/workshops"
                className="rounded-lg bg-white px-5 py-3 font-semibold text-[#B11226] transition hover:bg-gray-100"
              >
                Ver oficinas
              </Link>

              <Link
                href="/appointments"
                className="rounded-lg border border-white px-5 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Meus agendamentos
              </Link>

              {!session?.user ? (
                <Link
                  href="/register"
                  className="rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white transition hover:bg-black"
                >
                  Criar conta
                </Link>
              ) : null}
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

                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Total de agendamentos</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {appointmentsCount}
                  </p>
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
                    Cadastre-se para acessar seus agendamentos
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">2. Escolha a oficina</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    Veja revisões e compare os preços
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">3. Agende sua revisão</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    Confirme a data e acompanhe tudo na sua área
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="text-3xl font-bold text-gray-900">
          Vantagens do AutoCare Club
        </h2>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900">💰 Economia</h3>
            <p className="mt-3 text-gray-600">
              Até 15% de desconto em revisões programadas.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900">📅 Planejamento</h3>
            <p className="mt-3 text-gray-600">
              Organize suas revisões com mais previsibilidade e praticidade.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900">🚗 Conveniência</h3>
            <p className="mt-3 text-gray-600">
              Agende rapidamente e acompanhe tudo pelo sistema.
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
                Crie sua conta para acessar seu painel e seus agendamentos.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900">
                2. Escolha a revisão
              </h3>
              <p className="mt-3 text-gray-600">
                Encontre a oficina ideal e veja as revisões disponíveis.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900">
                3. Agende online
              </h3>
              <p className="mt-3 text-gray-600">
                Selecione a data, confirme e acompanhe tudo na sua conta.
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
            Acesse as oficinas, consulte revisões disponíveis e mantenha seus
            serviços organizados em um só lugar.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/workshops"
              className="rounded-lg bg-white px-5 py-3 font-semibold text-gray-900 transition hover:bg-gray-100"
            >
              Explorar oficinas
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
