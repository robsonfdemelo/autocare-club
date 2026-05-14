import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "../../lib/auth";

const cards = [
  {
    title: "Oficinas",
    description: "Cadastrar, editar e excluir oficinas",
    href: "/admin/workshops",
  },
  {
    title: "Revisões",
    description: "Cadastrar, editar e excluir revisões",
    href: "/admin/revision-services",
  },
  {
    title: "Planos",
    description: "Cadastrar, editar e gerenciar planos",
    href: "/admin/plans",
  },
  {
    title: "Agendamentos",
    description: "Concluir revisões e controlar consumo de saldo",
    href: "/admin/appointments",
  },
  {
    title: "Financeiro",
    description: "Acompanhar cobranças, pagamentos e ativações",
    href: "/admin/payments",
  },
  {
    title: "Clientes e planos",
    description: "Consultar saldo, carência e histórico dos clientes",
    href: "/admin/customers",
  },
];

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
        <div className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-bold">Administração</h1>

          <p className="mt-2 text-white/90">
            Gerencie oficinas, revisões, planos, agendamentos, pagamentos e
            clientes
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-10 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <h2 className="text-2xl font-bold text-gray-900">
              {card.title}
            </h2>

            <p className="mt-2 text-gray-600">{card.description}</p>

            <span className="mt-6 inline-block rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
              Acessar
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
}