import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { revalidatePath } from "next/cache";
import DeleteButton from "../../components/delete-button";

export default async function AdminPlansPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  async function deletePlan(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      redirect("/login");
    }

    if (session.user.role !== "ADMIN") {
      redirect("/");
    }

    const id = formData.get("id") as string;

    if (!id) return;

    await prisma.planPackage.deleteMany({
      where: { id },
    });

    revalidatePath("/admin/plans");
    redirect("/admin/plans");
  }

  const plans = await prisma.planPackage.findMany({
    orderBy: {
      revisionsQty: "asc",
    },
  });

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-[#B11226] px-6 py-12 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">Admin • Planos</h1>
            <p className="mt-2 text-white/90">
              Gerencie os pacotes de revisões do AutoCare Club
            </p>
          </div>

          <Link
            href="/admin/plans/new"
            className="rounded-lg bg-white px-4 py-2 font-semibold text-[#B11226]"
          >
            Novo plano
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10">
        {plans.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-gray-600">Nenhum plano cadastrado.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map((plan) => (
              <div key={plan.id} className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold text-gray-900">
                        {plan.name}
                      </h2>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          plan.isActive
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {plan.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {plan.revisionsQty} revisões • {plan.discountPct}% de
                      desconto
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      R$ {Number(plan.price).toFixed(2).replace(".", ",")}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Carência: {plan.graceDays} dias
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/plans/${plan.id}/edit`}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                    >
                      Editar
                    </Link>
                    <form action={deletePlan}>
                      <input type="hidden" name="id" value={plan.id} />
                      <DeleteButton />
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
