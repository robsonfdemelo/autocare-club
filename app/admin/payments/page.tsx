import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

function getStatusLabel(status: string) {
  const normalizedStatus = status.toUpperCase();

  if (
    normalizedStatus === "RECEIVED" ||
    normalizedStatus === "CONFIRMED" ||
    normalizedStatus === "PAYMENT_RECEIVED" ||
    normalizedStatus === "PAYMENT_CONFIRMED"
  ) {
    return "Pago";
  }

  if (
    normalizedStatus === "PENDING" ||
    normalizedStatus === "AWAITING_PAYMENT"
  ) {
    return "Pendente";
  }

  if (
    normalizedStatus === "OVERDUE" ||
    normalizedStatus === "PAYMENT_OVERDUE"
  ) {
    return "Vencido";
  }

  if (
    normalizedStatus === "CANCELED" ||
    normalizedStatus === "PAYMENT_DELETED"
  ) {
    return "Cancelado";
  }

  return status;
}

function getStatusClass(status: string) {
  const normalizedStatus = status.toUpperCase();

  if (
    normalizedStatus === "RECEIVED" ||
    normalizedStatus === "CONFIRMED" ||
    normalizedStatus === "PAYMENT_RECEIVED" ||
    normalizedStatus === "PAYMENT_CONFIRMED"
  ) {
    return "bg-green-100 text-green-700";
  }

  if (
    normalizedStatus === "PENDING" ||
    normalizedStatus === "AWAITING_PAYMENT"
  ) {
    return "bg-yellow-100 text-yellow-700";
  }

  if (
    normalizedStatus === "OVERDUE" ||
    normalizedStatus === "PAYMENT_OVERDUE"
  ) {
    return "bg-red-100 text-red-700";
  }

  if (
    normalizedStatus === "CANCELED" ||
    normalizedStatus === "PAYMENT_DELETED"
  ) {
    return "bg-gray-100 text-gray-700";
  }

  return "bg-blue-100 text-blue-700";
}

function isPaidStatus(status: string) {
  const normalizedStatus = status.toUpperCase();

  return (
    normalizedStatus === "RECEIVED" ||
    normalizedStatus === "CONFIRMED" ||
    normalizedStatus === "PAYMENT_RECEIVED" ||
    normalizedStatus === "PAYMENT_CONFIRMED"
  );
}

function isPendingStatus(status: string) {
  const normalizedStatus = status.toUpperCase();

  return (
    normalizedStatus === "PENDING" ||
    normalizedStatus === "AWAITING_PAYMENT"
  );
}

export default async function AdminPaymentsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  const payments = await prisma.payment.findMany({
    include: {
      user: true,
      planPackage: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalPaid = payments
    .filter((payment) => isPaidStatus(payment.status))
    .reduce((total, payment) => total + Number(payment.value), 0);

  const totalPending = payments
    .filter((payment) => isPendingStatus(payment.status))
    .reduce((total, payment) => total + Number(payment.value), 0);

  const paidCount = payments.filter((payment) =>
    isPaidStatus(payment.status),
  ).length;

  const pendingCount = payments.filter((payment) =>
    isPendingStatus(payment.status),
  ).length;

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-[#B11226] px-6 py-12 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-white/80">
            Administração
          </p>

          <h1 className="mt-2 text-4xl font-bold">Financeiro</h1>

          <p className="mt-2 text-white/90">
            Acompanhe cobranças, pagamentos e ativações de planos
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6">
          <Link
            href="/admin"
            className="text-sm font-semibold text-[#B11226] hover:underline"
          >
            ← Voltar para administração
          </Link>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total recebido</p>

            <p className="mt-2 text-2xl font-bold text-green-700">
              R$ {totalPaid.toFixed(2).replace(".", ",")}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total pendente</p>

            <p className="mt-2 text-2xl font-bold text-yellow-700">
              R$ {totalPending.toFixed(2).replace(".", ",")}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Pagamentos pagos</p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {paidCount}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Pagamentos pendentes</p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {pendingCount}
            </p>
          </div>
        </div>

        {payments.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-gray-600">
              Nenhum pagamento encontrado até o momento.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead className="bg-gray-100 text-sm text-gray-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Cliente</th>
                    <th className="px-4 py-3 font-semibold">Plano</th>
                    <th className="px-4 py-3 font-semibold">Valor</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Forma</th>
                    <th className="px-4 py-3 font-semibold">Data</th>
                    <th className="px-4 py-3 font-semibold">Asaas</th>
                    <th className="px-4 py-3 font-semibold">Ação</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 text-sm">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="align-top">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-gray-900">
                          {payment.user.name ?? "Cliente sem nome"}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {payment.user.email}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-gray-700">
                        {payment.planPackage.name}
                      </td>

                      <td className="px-4 py-4 font-semibold text-gray-900">
                        R$ {Number(payment.value).toFixed(2).replace(".", ",")}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                            payment.status,
                          )}`}
                        >
                          {getStatusLabel(payment.status)}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-gray-700">
                        {payment.billingType}
                      </td>

                      <td className="px-4 py-4 text-gray-700">
                        {new Date(payment.createdAt).toLocaleDateString(
                          "pt-BR",
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <p className="max-w-[160px] truncate text-xs text-gray-500">
                          {payment.asaasPaymentId}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        {payment.invoiceUrl ? (
                          <a
                            href={payment.invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-gray-800"
                          >
                            Abrir cobrança
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">
                            Sem link
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}