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

export default async function BookingPage({ searchParams }: Props) {
  const { workshopSlug, serviceId, error } = await searchParams;

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (!workshopSlug || !serviceId) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold">Agendamento</h1>
          <p className="mt-2 text-gray-600">Dados da revisão não informados.</p>
        </div>
      </main>
    );
  }

  const workshop = await prisma.workshop.findUnique({
    where: { slug: workshopSlug },
  });

  const service = await prisma.revisionService.findUnique({
    where: { id: serviceId },
  });

  if (!workshop || !service) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold">Agendamento</h1>
          <p className="mt-2 text-gray-600">
            Oficina ou revisão não encontrada.
          </p>
        </div>
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

    const appointmentDate = formData.get("appointmentDate") as string;
    const paymentMode = formData.get("paymentMode") as "DIRECT" | "CLUB";
    const notes = (formData.get("notes") as string) || "";

    if (!appointmentDate) {
      redirect(
        `/booking?workshopSlug=${workshop.slug}&serviceId=${service.id}&error=data-obrigatoria`,
      );
    }

    const selectedDate = new Date(`${appointmentDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      redirect(
        `/booking?workshopSlug=${workshop.slug}&serviceId=${service.id}&error=data-passada`,
      );
    }

    if (paymentMode === "CLUB") {
      const userPlan = await prisma.userPlan.findUnique({
        where: {
          userId: session.user.id,
        },
      });

      if (!userPlan || userPlan.status !== "ACTIVE") {
        redirect(
          `/booking?workshopSlug=${workshop.slug}&serviceId=${service.id}&error=plano-inexistente`,
        );
      }

      if (userPlan.availableBalance <= 0) {
        redirect(
          `/booking?workshopSlug=${workshop.slug}&serviceId=${service.id}&error=saldo-insuficiente`,
        );
      }

      const graceUntil = new Date(userPlan.graceUntil);
      graceUntil.setHours(0, 0, 0, 0);

      if (today < graceUntil) {
        redirect(
          `/booking?workshopSlug=${workshop.slug}&serviceId=${service.id}&error=carencia-ativa`,
        );
      }

      await prisma.appointment.create({
        data: {
          appointmentDate: selectedDate,
          paymentMode,
          usedPlan: true,
          notes,
          userId: session.user.id,
          workshopId: workshop.id,
          revisionServiceId: service.id,
          userPlanId: userPlan.id,
        },
      });
    } else {
      await prisma.appointment.create({
        data: {
          appointmentDate: selectedDate,
          paymentMode: "DIRECT",
          usedPlan: false,
          notes,
          userId: session.user.id,
          workshopId: workshop.id,
          revisionServiceId: service.id,
          userPlanId: null,
        },
      });
    }

    redirect("/appointments?success=booking-created");
  }

  const userPlan = await prisma.userPlan.findUnique({
    where: {
      userId: session.user.id,
    },
    include: {
      planPackage: true,
    },
  });

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
    clubMessage = `Seu plano está em carência até ${graceUntilDate.toLocaleDateString("pt-BR")}.`;
  }

  const errorMessage =
    error === "data-passada"
      ? "Não é permitido agendar uma data passada."
      : error === "data-obrigatoria"
        ? "Informe a data da revisão."
        : error === "plano-inexistente"
          ? "Você não possui um plano ativo para usar o AutoCare Club."
          : error === "saldo-insuficiente"
            ? "Seu plano não possui saldo disponível."
            : error === "carencia-ativa"
              ? "Seu plano ainda está em período de carência."
              : "";

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-[#B11226] px-6 py-12 text-white">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold">Agendar revisão</h1>
          <p className="mt-2 text-white/90">
            {workshop.name} • {service.name}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-10">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900">Resumo</h2>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Oficina</p>
              <p className="text-lg font-semibold text-gray-900">
                {workshop.name}
              </p>
              <p className="text-sm text-gray-600">
                {workshop.city} - {workshop.state}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Revisão</p>
              <p className="text-lg font-semibold text-gray-900">
                {service.name}
              </p>
              <p className="text-sm text-gray-600">
                {service.mileageTarget.toLocaleString("pt-BR")} km ou{" "}
                {service.monthInterval} meses
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Preço direto</p>
              <p className="text-2xl font-bold text-gray-900">
                R$ {Number(service.priceDirect).toFixed(2).replace(".", ",")}
              </p>
            </div>

            <div className="rounded-xl bg-[#B11226] p-4 text-white">
              <p className="text-sm text-white/80">Preço AutoCare Club</p>
              <p className="text-2xl font-bold">
                R$ {Number(service.priceClub).toFixed(2).replace(".", ",")}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-gray-50 p-4">
            <p className="text-sm text-gray-500">Seu plano atual</p>

            {userPlan ? (
              <div className="mt-2 space-y-1">
                <p className="font-semibold text-gray-900">
                  {userPlan.planPackage.name}
                </p>
                <p className="text-sm text-gray-600">
                  Saldo disponível: {userPlan.availableBalance}
                </p>
                <p className="text-sm text-gray-600">
                  Carência até:{" "}
                  {new Date(userPlan.graceUntil).toLocaleDateString("pt-BR")}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-600">
                Você não possui plano ativo.
              </p>
            )}
          </div>

          {!canUseClub && clubMessage ? (
            <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
              {clubMessage}
            </div>
          ) : null}

          <form action={createAppointment} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Data da revisão
              </label>
              <input
                type="date"
                name="appointmentDate"
                min={todayMin}
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Forma de pagamento
              </label>
              <select
                name="paymentMode"
                defaultValue="DIRECT"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              >
                <option value="DIRECT">Direto</option>
                <option value="CLUB" disabled={!canUseClub}>
                  AutoCare Club {!canUseClub ? "(indisponível)" : ""}
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Observações
              </label>
              <textarea
                name="notes"
                rows={4}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="Ex.: prefiro atendimento pela manhã"
              />
            </div>

            {errorMessage ? (
              <p className="text-sm font-medium text-red-600">{errorMessage}</p>
            ) : null}

            <button
              type="submit"
              className="w-full rounded-lg bg-gray-900 px-4 py-3 font-semibold text-white"
            >
              Confirmar agendamento
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
