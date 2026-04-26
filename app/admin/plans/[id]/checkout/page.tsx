import { redirect } from "next/navigation";
import { prisma } from "../../../../../lib/prisma";

export default async function CheckoutPage({
  params,
}: {
  params: { id: string };
}) {
  const plan = await prisma.planPackage.findUnique({
    where: { id: params.id },
  });

  if (!plan) {
    redirect("/plans");
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-[#B11226] px-6 py-12 text-white">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold">Checkout</h1>
          <p className="mt-2 text-white/90">
            Confirme seu plano antes do pagamento
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-6 py-10">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">{plan.name}</h2>

          <p className="mt-4 text-3xl font-bold text-[#B11226]">
            R$ {Number(plan.price).toFixed(2).replace(".", ",")}
          </p>

          <div className="mt-6 space-y-2 text-gray-700">
            <p>{plan.revisionsQty} revisões inclusas</p>
            <p>{plan.discountPct}% de desconto</p>
            <p>Carência de {plan.graceDays} dias</p>
          </div>

          <div className="mt-8 space-y-3">
            <button className="w-full rounded-lg bg-green-600 px-4 py-3 font-semibold text-white">
              Pagar com PIX
            </button>

            <button className="w-full rounded-lg bg-gray-900 px-4 py-3 font-semibold text-white">
              Pagar com cartão
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}