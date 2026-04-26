import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import NewPlanForm from "../new/new-plan-form";

export default async function NewPlanPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  async function createPlan(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      redirect("/login");
    }

    if (session.user.role !== "ADMIN") {
      redirect("/");
    }

    const name = (formData.get("name") as string)?.trim();
    const revisionsQty = Number(formData.get("revisionsQty"));
    const discountPct = Number(formData.get("discountPct"));
    const graceDays = Number(formData.get("graceDays"));
    const price = Number(formData.get("price"));
    const isActive = formData.get("isActive") === "true";

    if (!name || !revisionsQty || price < 0) {
      redirect("/admin/plans/new");
    }

    await prisma.planPackage.create({
      data: {
        name,
        revisionsQty,
        discountPct,
        graceDays,
        price,
        isActive,
      },
    });

    redirect("/admin/plans");
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-[#B11226] px-6 py-12 text-white">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold">Novo plano</h1>
          <p className="mt-2 text-white/90">
            Cadastre um novo pacote de revisões
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-10">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <NewPlanForm createPlan={createPlan} />
        </div>
      </section>
    </main>
  );
}
