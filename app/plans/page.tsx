import Link from "next/link";
import { prisma } from "../../lib/prisma";
import CheckoutButton from "./checkout-button";

export default async function PlansPage() {
  const plans = await prisma.planPackage.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      revisionsQty: "asc",
    },
  });

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-[#B11226] px-6 py-12 text-white">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-bold">Planos AutoCare Club</h1>
          <p className="mt-2 text-white/90">
            Escolha um plano e economize nas suas revisões
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        {plans.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-gray-600">Nenhum plano disponível no momento.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.id}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <h2 className="text-2xl font-bold text-gray-900">
                  {plan.name}
                </h2>

                <p className="mt-4 text-3xl font-bold text-[#B11226]">
                  R$ {Number(plan.price).toFixed(2).replace(".", ",")}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Pagamento por assinatura
                </p>

                <div className="mt-6 space-y-3 text-sm text-gray-700">
                  <p>{plan.revisionsQty} revisões inclusas</p>
                  <p>{plan.discountPct}% de desconto</p>
                  <p>Carência de {plan.graceDays} dias</p>
                </div>
                <CheckoutButton
                  name="Robson Ferreira"
                  email="robson.ferreiramelo@gmail.com"
                  value={Number(plan.price)}
                />
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
