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

  async function subscribePlan(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      redirect("/login");
    }

    const packageId = formData.get("packageId") as string;

    if (!packageId) {
      redirect("/my-plan");
    }

    const selectedPackage = await prisma.planPackage.findUnique({
      where: {
        id: packageId,
      },
    });

    if (!selectedPackage || !selectedPackage.isActive) {
      redirect("/my-plan");
    }

    const now = new Date();
    const graceUntil = new Date(now);
    graceUntil.setDate(graceUntil.getDate() + selectedPackage.graceDays);

    await prisma.userPlan.upsert({
      where: {
        userId: session.user.id,
      },
      update: {
        planPackageId: selectedPackage.id,
        status: "ACTIVE",
        totalRevisions: selectedPackage.revisionsQty,
        usedRevisions: 0,
        availableBalance: selectedPackage.revisionsQty,
        graceUntil,
        startedAt: now,
        expiresAt: null,
      },
      create: {
        userId: session.user.id,
        planPackageId: selectedPackage.id,
        status: "ACTIVE",
        totalRevisions: selectedPackage.revisionsQty,
        usedRevisions: 0,
        availableBalance: selectedPackage.revisionsQty,
        graceUntil,
        startedAt: now,
      },
    });

    redirect("/my-plan?success=plan-created");
  }

  const userPlan = await prisma.userPlan.findUnique({
    where: {
      userId: session.user.id,
    },
    include: {
      planPackage: true,
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
              <p className="mt-2 text-gray-600">
                : Status:{" "}
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
              </p>
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
                Escolha um pacote do AutoCare Club para começar a acompanhar
                suas revisões com mais previsibilidade.
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

                  <form action={subscribePlan} className="mt-6">
                    <input type="hidden" name="packageId" value={pkg.id} />
                    <button
                      type="submit"
                      className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black"
                    >
                      Contratar plano
                    </button>
                  </form>
                  <Link
                    href="/plans"
                    className="rounded-lg bg-[#B11226] px-5 py-3 font-semibold text-white"
                  >
                    Trocar ou contratar plano
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
