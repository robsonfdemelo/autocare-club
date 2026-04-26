import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import DeleteButton from "../../components/delete-button";

export default async function AdminWorkshopsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  async function deleteWorkshop(formData: FormData) {
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

    await prisma.workshop.deleteMany({
      where: { id },
    });

    revalidatePath("/admin/workshops");
    redirect("/admin/workshops");
  }

  const workshops = await prisma.workshop.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-[#B11226] px-6 py-12 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">Admin • Oficinas</h1>
            <p className="mt-2 text-white/90">
              Gerencie as oficinas cadastradas no sistema
            </p>
          </div>

          <Link
            href="/admin/workshops/new"
            className="rounded-lg bg-white px-4 py-2 font-semibold text-[#B11226]"
          >
            Nova oficina
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10">
        {workshops.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-gray-600">Nenhuma oficina cadastrada.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {workshops.map((workshop) => (
              <div
                key={workshop.id}
                className="rounded-2xl bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={workshop.imageUrl}
                      alt={workshop.name}
                      className="h-16 w-20 rounded-xl object-cover"
                    />

                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {workshop.name}
                      </h2>

                      <p className="mt-1 text-sm text-gray-600">
                        {workshop.city} - {workshop.state}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Slug: {workshop.slug}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/workshops/${workshop.id}/edit`}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                    >
                      Editar
                    </Link>

                    <form action={deleteWorkshop}>
                      <input type="hidden" name="id" value={workshop.id} />
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
