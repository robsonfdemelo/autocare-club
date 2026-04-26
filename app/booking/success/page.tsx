import Link from "next/link";

interface Props {
  searchParams: Promise<{
    workshop?: string;
    service?: string;
    date?: string;
    paymentMode?: string;
  }>;
}

export default async function BookingSuccessPage({ searchParams }: Props) {
  const { workshop, service, date, paymentMode } = await searchParams;

  const formattedDate = date
    ? new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR")
    : "-";

  const formattedPayment =
    paymentMode === "CLUB"
      ? "AutoCare Club"
      : paymentMode === "DIRECT"
        ? "Direto"
        : "-";

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-[#B11226] px-6 py-12 text-white">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold">Agendamento confirmado</h1>
          <p className="mt-2 text-white/90">
            Sua revisão foi agendada com sucesso.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-10">
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
            ✅
          </div>

          <h2 className="mt-4 text-center text-2xl font-bold text-gray-900">
            Tudo certo!
          </h2>

          <p className="mt-3 text-center text-gray-600">
            Seu agendamento foi registrado no sistema.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Oficina</p>
              <p className="text-lg font-semibold text-gray-900">
                {workshop ?? "-"}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Revisão</p>
              <p className="text-lg font-semibold text-gray-900">
                {service ?? "-"}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Data agendada</p>
              <p className="text-lg font-semibold text-gray-900">
                {formattedDate}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Forma de pagamento</p>
              <p className="text-lg font-semibold text-gray-900">
                {formattedPayment}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/appointments"
              className="rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white transition hover:bg-black"
            >
              Ver meus agendamentos
            </Link>

            <Link
              href="/workshops"
              className="rounded-lg border border-gray-300 px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Voltar para oficinas
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
