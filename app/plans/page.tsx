import { prisma } from "../../lib/prisma";
import CheckoutButton from "./checkout-button";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getPlanHighlights(revisionsQty: number) {
  const common = [
    "Preço fixo no pacote contratado",
    "Proteção contra reajustes futuros",
    "Uso após período de carência",
    "Acompanhamento pelo Meu Plano",
  ];

  if (revisionsQty === 3) {
    return [
      "3 revisões planejadas",
      "Ideal para quem comprou o veículo recentemente",
      "Economia inicial no pacote pré-pago",
      ...common,
    ];
  }

  if (revisionsQty === 4) {
    return [
      "4 revisões planejadas",
      "Mais equilíbrio entre custo e cobertura",
      "Desconto progressivo maior que o plano inicial",
      ...common,
    ];
  }

  if (revisionsQty === 5) {
    return [
      "5 revisões planejadas",
      "Mais previsibilidade para longo prazo",
      "Indicado para quem deseja manter revisões organizadas",
      ...common,
    ];
  }

  if (revisionsQty === 6) {
    return [
      "6 revisões planejadas",
      "Maior cobertura do myRiseCare",
      "Maior desconto progressivo do pacote",
      ...common,
    ];
  }

  return common;
}

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
      <section className="bg-[#B11226] px-6 py-14 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">
            myRiseCare
          </p>

          <h1 className="mt-3 text-4xl font-bold">Planos myRiseCare</h1>

          <p className="mt-3 max-w-2xl text-white/90">
            Escolha um pacote de revisões pré-pagas, mantenha preço fixo e
            acompanhe seu saldo de revisões com mais previsibilidade.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">
              Revisões programadas
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              Revisões planejadas conforme quilometragem e tempo, considerando
              intervalo de até 10.000 km ou 12 meses.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">
              Cobertura preventiva
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              Apoio para revisão de óleo, fluidos, filtros, velas, freios e
              demais itens previstos no plano de manutenção.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">
              Mais previsibilidade
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              Pacote pré-pago com preço definido, saldo disponível e histórico
              de utilização no Meu Plano.
            </p>
          </div>
        </div>

        {plans.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">
              Nenhum plano disponível
            </h2>

            <p className="mt-2 text-gray-600">
              No momento não há pacotes ativos para contratação.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {plans.map((plan) => {
              const value = Number(plan.price);
              const highlights = getPlanHighlights(plan.revisionsQty);

              return (
                <article
                  key={plan.id}
                  className="flex flex-col rounded-2xl bg-white p-6 shadow-sm"
                >
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                      Pacote pré-pago
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-gray-900">
                      {plan.name}
                    </h2>

                    <p className="mt-4 text-3xl font-bold text-[#B11226]">
                      {formatCurrency(value)}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Pagamento por assinatura
                    </p>
                  </div>

                  <div className="mt-5 rounded-xl bg-gray-50 p-4">
                    <p className="text-sm font-bold text-gray-900">
                      O plano inclui
                    </p>

                    <ul className="mt-3 space-y-2 text-sm text-gray-700">
                      {highlights.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="text-[#B11226]">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-5 grid gap-3 text-sm text-gray-700">
                    <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                      <span>Revisões inclusas</span>
                      <strong>{plan.revisionsQty}</strong>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                      <span>Desconto</span>
                      <strong>{plan.discountPct}%</strong>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                      <span>Carência</span>
                      <strong>{plan.graceDays} dias</strong>
                    </div>
                  </div>

                  <div className="mt-6">
                    <CheckoutButton planId={plan.id} value={value} />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}