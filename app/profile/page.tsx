import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

interface Props {
  searchParams: Promise<{
    success?: string;
  }>;
}

export default async function ProfilePage({ searchParams }: Props) {
  const { success } = await searchParams;

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
  });

  if (!user) {
    redirect("/login");
  }

  async function updateProfile(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      redirect("/login");
    }

    const name = (formData.get("name") as string)?.trim();
    const phone = (formData.get("phone") as string)?.trim();
    const image = (formData.get("image") as string)?.trim();

    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        name: name || null,
        phone: phone || null,
        image: image || null,
      },
    });

    redirect("/profile?success=updated");
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-[#B11226] px-6 py-12 text-white">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold">Meu perfil</h1>
          <p className="mt-2 text-white/90">
            Atualize suas informações de conta
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-10">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          {success === "updated" ? (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              Perfil atualizado com sucesso.
            </div>
          ) : null}

          <form action={updateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nome
              </label>
              <input
                type="text"
                name="name"
                defaultValue={user.name ?? ""}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                E-mail
              </label>
              <input
                type="email"
                value={user.email ?? ""}
                disabled
                className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Telefone
              </label>
              <input
                type="text"
                name="phone"
                defaultValue={user.phone ?? ""}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                URL da imagem
              </label>
              <input
                type="text"
                name="image"
                defaultValue={user.image ?? ""}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="https://..."
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-gray-900 px-4 py-3 font-semibold text-white"
            >
              Salvar alterações
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/change-password"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Alterar senha
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
