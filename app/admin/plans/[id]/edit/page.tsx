import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";
import EditPlanForm from "./edit-plan-form";

export default async function EditPlanPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  const { id } = await params;

  const plan = await prisma.planPackage.findUnique({
    where: { id },
  });

  if (!plan) {
    redirect("/admin/plans");
  }

  async function updatePlan(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      redirect("/login");
    }

    if (session.user.role !== "ADMIN") {
      redirect("/");
    }

    const planId = formData.get("id") as string;
    const name = (formData.get("name") as string)?.trim();
    const revisionsQty = Number(formData.get("revisionsQty"));
    const discountPct = Number(formData.get("discountPct"));
    const graceDays = Number(formData.get("graceDays"));
    const price = Number(formData.get("price"));
    const isActive = formData.get("isActive") === "true";

    if (!planId || !name || !revisionsQty) {
      redirect(`/admin/plans/${id}/edit`);
    }

    await prisma.planPackage.update({
      where: { id: planId },
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
          <h1 className="text-4xl font-bold">Editar plano</h1>
          <p className="mt-2 text-white/90">Atualize os dados do plano</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-10">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <EditPlanForm plan={plan} updatePlan={updatePlan} />
        </div>
      </section>
    </main>
  );
}