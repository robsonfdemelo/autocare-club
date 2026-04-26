import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { slugify } from "../../../../lib/slugify";
import NewRevisionServiceForm from "../new/new-revision-service-form";

export default async function NewRevisionServicePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  const workshops = await prisma.workshop.findMany({
    orderBy: { name: "asc" },
  });

  async function createRevisionService(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      redirect("/login");
    }

    if (session.user.role !== "ADMIN") {
      redirect("/");
    }

    const name = (formData.get("name") as string)?.trim();
    const slug = slugify(name);
    const workshopId = formData.get("workshopId") as string;
    const mileageTarget = Number(formData.get("mileageTarget"));
    const monthInterval = Number(formData.get("monthInterval"));
    const priceDirect = Number(formData.get("priceDirect"));
    const priceClub = Number(formData.get("priceClub"));

    if (!name || !workshopId || !mileageTarget || !priceDirect) {
      redirect("/admin/revision-services/new");
    }

    await prisma.revisionService.create({
      data: {
        name,
        slug,
        workshopId,
        mileageTarget,
        monthInterval: monthInterval || 0,
        priceDirect,
        priceClub: priceClub || 0,
        isActive: true,
      },
    });
    redirect("/admin/revision-services");
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-[#B11226] px-6 py-12 text-white">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold">Nova revisão</h1>
          <p className="mt-2 text-white/90">
            Cadastre uma nova revisão para uma oficina
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-10">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <NewRevisionServiceForm
            createRevisionService={createRevisionService}
            workshops={workshops}
          />
        </div>
      </section>
    </main>
  );
}
