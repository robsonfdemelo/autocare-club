import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-[#B11226] px-6 py-12 text-white">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-4xl font-bold">Administração</h1>
          <p className="mt-2 text-white/90">
            Gerencie oficinas, revisões, planos e agendamentos
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <Link
            href="/admin/workshops"
            className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <h2 className="text-xl font-bold text-gray-900">Oficinas</h2>
            <p className="mt-2 text-sm text-gray-600">
              Cadastrar, editar e excluir oficinas
            </p>
          </Link>

          <Link
            href="/admin/revision-services"
            className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <h2 className="text-xl font-bold text-gray-900">Revisões</h2>
            <p className="mt-2 text-sm text-gray-600">
              Cadastrar, editar e excluir revisões
            </p>
          </Link>

          <Link
            href="/admin/plans"
            className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <h2 className="text-xl font-bold text-gray-900">Planos</h2>
            <p className="mt-2 text-sm text-gray-600">
              Cadastrar, editar e gerenciar planos
            </p>
          </Link>

          <div className="rounded-2xl bg-white p-6 shadow-sm opacity-60">
            <h2 className="text-xl font-bold text-gray-900">Agendamentos</h2>
            <p className="mt-2 text-sm text-gray-600">Em breve</p>
          </div>
        </div>
      </section>
    </main>
  );
}
