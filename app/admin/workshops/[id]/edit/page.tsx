import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";
import EditWorkshopForm from "./edit-workshop-form";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditWorkshopPage({ params }: Props) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  const { id } = await params;

  const workshop = await prisma.workshop.findUnique({
    where: { id },
  });

  if (!workshop) {
    redirect("/admin/workshops");
  }

  async function updateWorkshop(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      redirect("/login");
    }

    if (session.user.role !== "ADMIN") {
      redirect("/");
    }

    const name = (formData.get("name") as string)?.trim();
    const slug = (formData.get("slug") as string)?.trim();
    const description = (formData.get("description") as string)?.trim();
    const imageUrl = (formData.get("imageUrl") as string)?.trim();
    const phone = (formData.get("phone") as string)?.trim();
    const whatsapp = (formData.get("whatsapp") as string)?.trim();
    const email = (formData.get("email") as string)?.trim();
    const address = (formData.get("address") as string)?.trim();
    const city = (formData.get("city") as string)?.trim();
    const state = (formData.get("state") as string)?.trim();
    const zipCode = (formData.get("zipCode") as string)?.trim();

    if (!name || !slug || !imageUrl || !address || !city || !state) {
      redirect(`/admin/workshops/${id}/edit`);
    }

    await prisma.workshop.update({
      where: { id },
      data: {
        name,
        slug,
        description: description || null,
        imageUrl,
        phone: phone || null,
        whatsapp: whatsapp || null,
        email: email || null,
        address,
        city,
        state,
        zipCode: zipCode || null,
      },
    });

    redirect("/admin/workshops");
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-[#B11226] px-6 py-12 text-white">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold">Editar oficina</h1>
          <p className="mt-2 text-white/90">Atualize os dados da oficina</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-10">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <EditWorkshopForm
            workshop={{
              id: workshop.id,
              name: workshop.name,
              slug: workshop.slug,
              imageUrl: workshop.imageUrl,
              phone: workshop.phone,
              whatsapp: workshop.whatsapp,
              email: workshop.email,
              address: workshop.address,
              city: workshop.city,
              state: workshop.state,
              zipCode: workshop.zipCode,
              description: workshop.description,
            }}
            updateWorkshop={updateWorkshop}
          />
        </div>
      </section>
    </main>
  );
}