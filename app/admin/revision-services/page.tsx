import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import DeleteButton from "../../components/delete-button";

export default async function AdminRevisionServicesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  async function deleteRevisionService(formData: FormData) {
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

    await prisma.revisionService.deleteMany({
      where: { id },
    });

    revalidatePath("/admin/revision-services");
    redirect("/admin/revision-services");
  }

  const services = await prisma.revisionService.findMany({
    include: {
      workshop: true,
    },
    orderBy: [
      {
        workshop: {
          name: "asc",
        },
      },
      {
        mileageTarget: "asc",
      },
    ],
  });

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-[#B11226] px-6 py-12 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">Admin • Revisões</h1>
            <p className="mt-2 text-white/90">
              Gerencie as revisões disponíveis por oficina
            </p>
          </div>

          <Link
            href="/admin/revision-services/new"
            className="rounded-lg bg-white px-4 py-2 font-semibold text-[#B11226]"
          >
            Nova revisão
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10">
        {services.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-gray-600">Nenhuma revisão cadastrada.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {services.map((service) => (
              <div
                key={service.id}
                className="rounded-2xl bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold text-gray-900">
                        {service.name}
                      </h2>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          service.isActive
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {service.isActive ? "Ativa" : "Inativa"}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-gray-600">
                      {service.workshop.name}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {service.mileageTarget.toLocaleString("pt-BR")} km •{" "}
                      {service.monthInterval} meses
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-800">
                        Direto: R$ {Number(service.priceDirect).toFixed(2).replace(".", ",")}
                      </span>

                      <span className="rounded-lg bg-[#B11226] px-3 py-2 text-sm font-semibold text-white">
                        AutoCare Club: R$ {Number(service.priceClub).toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/revision-services/${service.id}/edit`}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                    >
                      Editar
                    </Link>

                    <form action={deleteRevisionService}>
                      <input type="hidden" name="id" value={service.id} />
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