import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

interface Props {
  searchParams: Promise<{
    workshopSlug?: string;
    serviceId?: string;
    error?: string;
  }>;
}

function formatCurrency(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function formatMileage(value: number) {
  return `${value.toLocaleString("pt-BR")} km`;
}

function formatDate(date?: Date | null) {
  if (!date) {
    return "-";
  }

  return new Date(date).toLocaleDateString("pt-BR");
}

function buildBookingUrl(params: {
  workshopSlug: string;
  serviceId: string;
  error?: string;
}) {
  const searchParams = new URLSearchParams();

  searchParams.set("workshopSlug", params.workshopSlug);
  searchParams.set("serviceId", params.serviceId);

  if (params.error) {
    searchParams.set("error", params.error);
  }

  return `/booking?${searchParams.toString()}`;
}

export default async function BookingPage({ searchParams }: Props) {
  const { workshopSlug, serviceId, error } = await searchParams;

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (!workshopSlug || !serviceId) {
    return (
      <main className="min-h-screen bg-gray-50">
        <section className="mx-auto max-w-4xl px-6 py-10">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">Agendamento</h1>

            <p className="mt-2 text-gray-600">
              Dados da revisão não informados.
            </p>

            <Link
              href="/workshops"
              className="mt-5 inline-block rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white"
            >
              Ver oficinas
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const workshop = await prisma.workshop.findUnique({
    where: {
      slug: workshopSlug,
    },
  });

  const service = await prisma.revisionService.findUnique({
    where: {
      id: serviceId,
    },
  });

  if (!workshop || !service) {
    return (
      <main className="min-h-screen bg-gray-50">
        <section className="mx-auto max-w-4xl px-6 py-10">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">Agendamento</h1>

            <p className="mt-2 text-gray-600">
              Oficina ou revisão não encontrada.
            </p>

            <Link
              href="/workshops"
              className="mt-5 inline-block rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white"
            >
              Ver oficinas
            </Link>
          </div>
        </section>
      </main>
    );
  }

  async function createAppointment(formData: FormData) {
    "use server";

    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      redirect("/login");
    }

    if (!workshop || !service) {
      throw new Error("Dados inválidos");
    }

    const appointmentDate = String(
      formData.get("appointmentDate") ?? "",
    ).trim();
    const vehicleId = String(formData.get("vehicleId") ?? "").trim();
    const paymentMode = formData.get("paymentMode") as "DIRECT" | "CLUB";
    const notes = String(formData.get("notes") ?? "").trim();

    const baseUrl = buildBookingUrl({
      workshopSlug: workshop.slug,
      serviceId: service.id,
    });

    if (!appointmentDate) {
      redirect(`${baseUrl}&error=data-obrigatoria`);
    }

    if (!vehicleId) {
      redirect(`${baseUrl}&error=veiculo-obrigatorio`);
    }

    const selectedDate = new Date(`${appointmentDate}T00:00:00`);
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      redirect(`${baseUrl}&error=data-passada`);
    }

    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        userId: session.user.id,
      },
    });

    if (!vehicle) {
      redirect(`${baseUrl}&error=veiculo-invalido`);
    }

    if (paymentMode === "CLUB") {
      const userPlan = await prisma.userPlan.findUnique({
        where: {
          userId: session.user.id,
        },
      });

      if (!userPlan || userPlan.status !== "ACTIVE") {
        redirect(`${baseUrl}&error=plano-inexistente`);
      }

      if (userPlan.availableBalance <= 0) {
        redirect(`${baseUrl}&error=saldo-insuficiente`);
      }

      const graceUntil = new Date(userPlan.graceUntil);

      graceUntil.setHours(0, 0, 0, 0);

      if (today < graceUntil) {
        redirect(`${baseUrl}&error=carencia-ativa`);
      }

      if (userPlan.vehicleId && userPlan.vehicleId !== vehicle.id) {
        redirect(`${baseUrl}&error=plano-outro-veiculo`);
      }

      await prisma.$transaction([
        prisma.appointment.create({
          data: {
            appointmentDate: selectedDate,
            paymentMode,
            usedPlan: true,
            notes: notes || null,
            userId: session.user.id,
            workshopId: workshop.id,
            revisionServiceId: service.id,
            userPlanId: userPlan.id,
            vehicleId: vehicle.id,
          },
        }),
        prisma.userPlan.update({
          where: {
            id: userPlan.id,
          },
          data: {
            vehicleId: userPlan.vehicleId ?? vehicle.id,
            initialMileage: userPlan.initialMileage ?? vehicle.currentMileage,
          },
        }),
      ]);
    } else {
      await prisma.appointment.create({
        data: {
          appointmentDate: selectedDate,
          paymentMode: "DIRECT",
          usedPlan: false,
          notes: notes || null,
          userId: session.user.id,
          workshopId: workshop.id,
          revisionServiceId: service.id,
          userPlanId: null,
          vehicleId: vehicle.id,
        },
      });
    }

    redirect("/appointments?success=booking-created");
  }

  const [userPlan, vehicles] = await Promise.all([
    prisma.userPlan.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        planPackage: true,
        vehicle: true,
      },
    }),
    prisma.vehicle.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  const todayMin = new Date().toISOString().split("T")[0];
  const currentDate = new Date();

  currentDate.setHours(0, 0, 0, 0);

  const graceUntilDate = userPlan ? new Date(userPlan.graceUntil) : null;

  if (graceUntilDate) {
    graceUntilDate.setHours(0, 0, 0, 0);
  }

  const hasActivePlan = !!userPlan && userPlan.status === "ACTIVE";
  const hasBalance = !!userPlan && userPlan.availableBalance > 0;
  const graceExpired = !!graceUntilDate && currentDate >= graceUntilDate;
  const canUseClub = hasActivePlan && hasBalance && graceExpired;

  let clubMessage = "";

  if (!userPlan || userPlan.status !== "ACTIVE") {
    clubMessage = "Você não possui um plano ativo.";
  } else if (userPlan.availableBalance <= 0) {
    clubMessage = "Seu plano não possui saldo disponível.";
  } else if (graceUntilDate && currentDate < graceUntilDate) {
    clubMessage = `Seu plano está em carência até ${formatDate(graceUntilDate)}.`;
  }

  const errorMessage =
    error === "data-passada"
      ? "Não é permitido agendar uma data passada."
      : error === "data-obrigatoria"
        ? "Informe a data da revisão."
        : error === "veiculo-obrigatorio"
          ? "Selecione um veículo para continuar."
          : error === "veiculo-invalido"
            ? "O veículo selecionado não foi encontrado."
            : error === "plano-inexistente"
              ? "Você não possui um plano ativo para usar o myRiseCare."
              : error === "saldo-insuficiente"
                ? "Seu plano não possui saldo disponível."
                : error === "carencia-ativa"
                  ? "Seu plano ainda está em período de carência."
                  : error === "plano-outro-veiculo"
                    ? "Seu plano já está vinculado a outro veículo."
                    : "";

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-[#B11226] px-6 py-12 text-white">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-4xl font-bold">Agendar revisão</h1>

          <p className="mt-2 text-white/90">
            {workshop.name} • {service.name}
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-6 py-10 md:grid-cols-[1fr_360px]">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">
            Dados do agendamento
          </h2>

          {vehicles.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-5 text-yellow-800">
              <h3 className="font-bold">Cadastre um veículo primeiro</h3>

              <p className="mt-1 text-sm">
                Para agendar uma revisão, precisamos saber qual veículo será
                atendido.
              </p>

              <Link
                href="/vehicles"
                className="mt-4 inline-block rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white"
              >
                Cadastrar veículo
              </Link>
            </div>
          ) : (
            <form action={createAppointment} className="mt-6 space-y-5">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Veículo
                </label>

                <select
                  name="vehicleId"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900"
                  defaultValue={userPlan?.vehicleId ?? ""}
                >
                  <option value="">Selecione o veículo</option>

                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.brand} {vehicle.model}
                      {vehicle.year ? ` ${vehicle.year}` : ""} •{" "}
                      {formatMileage(vehicle.currentMileage)}
                      {vehicle.plate ? ` • ${vehicle.plate}` : ""}
                    </option>
                  ))}
                </select>

                {userPlan?.vehicle ? (
                  <p className="mt-2 text-xs text-gray-500">
                    Seu plano está vinculado ao veículo{" "}
                    <strong>
                      {userPlan.vehicle.brand} {userPlan.vehicle.model}
                    </strong>
                    .
                  </p>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Data da revisão
                </label>

                <input
                  name="appointmentDate"
                  type="date"
                  min={todayMin}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Forma de pagamento
                </label>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-300 p-4">
                    <input
                      type="radio"
                      name="paymentMode"
                      value="DIRECT"
                      defaultChecked
                    />

                    <span>
                      <strong className="block text-gray-900">Direto</strong>
                      <span className="text-sm text-gray-500">
                        {formatCurrency(Number(service.priceDirect))}
                      </span>
                    </span>
                  </label>

                  <label
                    className={`flex items-center gap-3 rounded-xl border p-4 ${
                      canUseClub
                        ? "cursor-pointer border-gray-300"
                        : "cursor-not-allowed border-gray-200 bg-gray-50 opacity-60"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMode"
                      value="CLUB"
                      disabled={!canUseClub}
                    />

                    <span>
                      <strong className="block text-gray-900">
                        myRiseCare
                      </strong>
                      <span className="text-sm text-gray-500">
                        {formatCurrency(Number(service.priceClub))}
                      </span>
                    </span>
                  </label>
                </div>

                {!canUseClub && clubMessage ? (
                  <p className="mt-2 text-sm text-yellow-700">
                    {clubMessage}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Observações
                </label>

                <textarea
                  name="notes"
                  placeholder="Ex: verificar ruído, trocar filtro, revisão preventiva..."
                  className="min-h-28 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900"
                />
              </div>

              {errorMessage ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                  {errorMessage}
                </div>
              ) : null}

              <button
                type="submit"
                className="w-full rounded-lg bg-gray-900 px-4 py-3 font-semibold text-white transition hover:bg-gray-800"
              >
                Confirmar agendamento
              </button>
            </form>
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">Resumo</h2>

            <div className="mt-4 space-y-4 text-sm">
              <div>
                <p className="text-gray-500">Oficina</p>

                <p className="font-semibold text-gray-900">{workshop.name}</p>

                <p className="text-gray-600">
                  {workshop.city} - {workshop.state}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Revisão</p>

                <p className="font-semibold text-gray-900">{service.name}</p>

                <p className="text-gray-600">
                  {service.mileageTarget.toLocaleString("pt-BR")} km ou{" "}
                  {service.monthInterval} meses
                </p>
              </div>

              <div>
                <p className="text-gray-500">Preço direto</p>

                <p className="font-semibold text-gray-900">
                  {formatCurrency(Number(service.priceDirect))}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Preço myRiseCare</p>

                <p className="font-semibold text-[#B11226]">
                  {formatCurrency(Number(service.priceClub))}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">
              Seu plano atual
            </h2>

            {userPlan ? (
              <div className="mt-4 space-y-3 text-sm">
                <p className="font-semibold text-gray-900">
                  {userPlan.planPackage.name}
                </p>

                <p className="text-gray-600">
                  Saldo disponível:{" "}
                  <span className="font-semibold">
                    {userPlan.availableBalance}
                  </span>
                </p>

                <p className="text-gray-600">
                  Carência até:{" "}
                  <span className="font-semibold">
                    {formatDate(userPlan.graceUntil)}
                  </span>
                </p>

                {userPlan.initialMileage !== null &&
                userPlan.initialMileage !== undefined ? (
                  <p className="text-gray-600">
                    KM inicial:{" "}
                    <span className="font-semibold">
                      {formatMileage(userPlan.initialMileage)}
                    </span>
                  </p>
                ) : null}

                {userPlan.vehicle ? (
                  <p className="text-gray-600">
                    Veículo:{" "}
                    <span className="font-semibold">
                      {userPlan.vehicle.brand} {userPlan.vehicle.model}
                    </span>
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  Você ainda não possui plano ativo.
                </p>

                <Link
                  href="/plans"
                  className="mt-4 inline-block rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
                >
                  Ver planos
                </Link>
              </div>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}