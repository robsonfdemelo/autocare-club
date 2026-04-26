import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";
import { slugify } from "../../../../../lib/slugify";
import EditRevisionServiceForm from "../edit/edit-revision-service-form";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditRevisionServicePage({ params }: Props) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  const { id } = await params;

  const service = await prisma.revisionService.findUnique({
    where: { id },
  });

  if (!service) {
    redirect("/admin/revision-services");
  }

  const workshops = await prisma.workshop.findMany({
    orderBy: {
      name: "asc",
    },
  });

  async function updateRevisionService(formData: FormData) {
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
    const isActive = formData.get("isActive") === "true";

    if (!name || !workshopId || !mileageTarget || !priceDirect || !priceClub) {
      redirect(`/admin/revision-services/${id}/edit`);
    }

    await prisma.revisionService.update({
      where: { id },
      data: {
        name,
        slug,
        workshopId,
        mileageTarget,
        monthInterval,
        priceDirect,
        priceClub,
        isActive,
      },
    });

    redirect("/admin/revision-services");
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-[#B11226] px-6 py-12 text-white">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold">Editar revisão</h1>
          <p className="mt-2 text-white/90">
            Atualize os dados da revisão
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-10">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <EditRevisionServiceForm
            service={{
              id: service.id,
              name: service.name,
              workshopId: service.workshopId,
              mileageTarget: service.mileageTarget,
              monthInterval: service.monthInterval,
              priceDirect: service.priceDirect.toString(),
              priceClub: service.priceClub.toString(),
              isActive: service.isActive,
            }}
            workshops={workshops}
            updateRevisionService={updateRevisionService}
          />
        </div>
      </section>
    </main>
  );
}