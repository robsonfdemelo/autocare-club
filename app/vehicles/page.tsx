import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

interface Props {
  searchParams: Promise<{
    success?: string;
    error?: string;
    mode?: string;
    editId?: string;
  }>;
}

function formatDate(date?: Date | null) {
  if (!date) {
    return "-";
  }

  return new Date(date).toLocaleDateString("pt-BR");
}

function formatMileage(value: number) {
  return `${value.toLocaleString("pt-BR")} km`;
}

async function getValidUserId() {
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

  return user.id;
}

async function createVehicle(formData: FormData) {
  "use server";

  const userId = await getValidUserId();

  const brand = String(formData.get("brand") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();
  const yearValue = String(formData.get("year") ?? "").trim();
  const plate = String(formData.get("plate") ?? "").trim().toUpperCase();
  const currentMileageValue = String(
    formData.get("currentMileage") ?? "",
  ).trim();
  const purchaseDateValue = String(formData.get("purchaseDate") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!brand || !model || !currentMileageValue) {
    redirect("/vehicles?mode=new&error=required");
  }

  const currentMileage = Number(currentMileageValue);
  const year = yearValue ? Number(yearValue) : null;

  if (!Number.isFinite(currentMileage) || currentMileage < 0) {
    redirect("/vehicles?mode=new&error=invalid-mileage");
  }

  if (year && (!Number.isFinite(year) || year < 1900)) {
    redirect("/vehicles?mode=new&error=invalid-year");
  }

  await prisma.vehicle.create({
    data: {
      userId,
      brand,
      model,
      year,
      plate: plate || null,
      currentMileage,
      purchaseDate: purchaseDateValue ? new Date(purchaseDateValue) : null,
      notes: notes || null,
    },
  });

  redirect("/vehicles?success=created");
}

async function updateVehicle(formData: FormData) {
  "use server";

  const userId = await getValidUserId();

  const vehicleId = String(formData.get("vehicleId") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();
  const yearValue = String(formData.get("year") ?? "").trim();
  const plate = String(formData.get("plate") ?? "").trim().toUpperCase();
  const currentMileageValue = String(
    formData.get("currentMileage") ?? "",
  ).trim();
  const purchaseDateValue = String(formData.get("purchaseDate") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!vehicleId) {
    redirect("/vehicles?error=not-found");
  }

  if (!brand || !model || !currentMileageValue) {
    redirect(`/vehicles?editId=${vehicleId}&error=required`);
  }

  const currentMileage = Number(currentMileageValue);
  const year = yearValue ? Number(yearValue) : null;

  if (!Number.isFinite(currentMileage) || currentMileage < 0) {
    redirect(`/vehicles?editId=${vehicleId}&error=invalid-mileage`);
  }

  if (year && (!Number.isFinite(year) || year < 1900)) {
    redirect(`/vehicles?editId=${vehicleId}&error=invalid-year`);
  }

  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id: vehicleId,
      userId,
    },
  });

  if (!vehicle) {
    redirect("/vehicles?error=not-found");
  }

  await prisma.vehicle.update({
    where: {
      id: vehicle.id,
    },
    data: {
      brand,
      model,
      year,
      plate: plate || null,
      currentMileage,
      purchaseDate: purchaseDateValue ? new Date(purchaseDateValue) : null,
      notes: notes || null,
    },
  });

  redirect("/vehicles?success=updated");
}

async function deleteVehicle(formData: FormData) {
  "use server";

  const userId = await getValidUserId();

  const vehicleId = String(formData.get("vehicleId") ?? "").trim();

  if (!vehicleId) {
    redirect("/vehicles");
  }

  const vehicle = await prisma.vehicle.findFirst({
    where: {
      id: vehicleId,
      userId,
    },
  });

  if (!vehicle) {
    redirect("/vehicles?error=not-found");
  }

  const hasLinks = await prisma.vehicle.findFirst({
    where: {
      id: vehicle.id,
      OR: [
        {
          appointments: {
            some: {},
          },
        },
        {
          userPlans: {
            some: {},
          },
        },
      ],
    },
  });

  if (hasLinks) {
    redirect("/vehicles?error=vehicle-linked");
  }

  await prisma.vehicle.delete({
    where: {
      id: vehicle.id,
    },
  });

  redirect("/vehicles?success=deleted");
}

function formatDateInput(date?: Date | null) {
  if (!date) {
    return "";
  }

  return new Date(date).toISOString().split("T")[0];
}

export default async function VehiclesPage({ searchParams }: Props) {
  const { success, error, mode, editId } = await searchParams;

  const userId = await getValidUserId();

  const vehicles = await prisma.vehicle.findMany({
    where: {
      userId,
    },
    include: {
      userPlans: {
        include: {
          planPackage: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
      appointments: {
        include: {
          revisionService: true,
          workshop: true,
        },
        orderBy: {
          appointmentDate: "desc",
        },
        take: 3,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const editingVehicle = editId
    ? vehicles.find((vehicle) => vehicle.id === editId)
    : null;

  const isCreating = mode === "new";
  const showForm = isCreating || !!editingVehicle;

  const successMessage =
    success === "created"
      ? "Veículo cadastrado com sucesso."
      : success === "updated"
        ? "Veículo atualizado com sucesso."
        : success === "deleted"
          ? "Veículo removido com sucesso."
          : "";

  const errorMessage =
    error === "required"
      ? "Preencha os campos obrigatórios."
      : error === "invalid-mileage"
        ? "Informe uma quilometragem válida."
        : error === "invalid-year"
          ? "Informe um ano válido."
          : error === "not-found"
            ? "Veículo não encontrado."
            : error === "vehicle-linked"
              ? "Este veículo já está vinculado a um plano ou agendamento e não pode ser removido."
              : "";

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-[#B11226] px-6 py-12 text-white">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-4xl font-bold">Meus veículos</h1>

          <p className="mt-2 text-white/90">
            Cadastre seus veículos para acompanhar revisões por quilometragem e
            tempo
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        {successMessage ? (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800 shadow-sm">
            <p className="font-medium">{successMessage}</p>
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 shadow-sm">
            <p className="font-medium">{errorMessage}</p>
          </div>
        ) : null}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Veículos cadastrados
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              Gerencie os veículos vinculados à sua conta.
            </p>
          </div>

          {!showForm ? (
            <Link
              href="/vehicles?mode=new"
              className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Novo veículo
            </Link>
          ) : (
            <Link
              href="/vehicles"
              className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Cancelar
            </Link>
          )}
        </div>

        {showForm ? (
          <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900">
              {editingVehicle ? "Editar veículo" : "Cadastrar veículo"}
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              Essas informações serão usadas para planejar as próximas revisões.
            </p>

            <form
              action={editingVehicle ? updateVehicle : createVehicle}
              className="mt-6 grid gap-4 md:grid-cols-2"
            >
              {editingVehicle ? (
                <input
                  type="hidden"
                  name="vehicleId"
                  value={editingVehicle.id}
                />
              ) : null}

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Marca
                </label>

                <input
                  name="brand"
                  defaultValue={editingVehicle?.brand ?? "Honda"}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Modelo
                </label>

                <input
                  name="model"
                  defaultValue={editingVehicle?.model ?? ""}
                  placeholder="Ex: Civic"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Ano
                </label>

                <input
                  name="year"
                  type="number"
                  defaultValue={editingVehicle?.year ?? ""}
                  placeholder="Ex: 2016"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Placa
                </label>

                <input
                  name="plate"
                  defaultValue={editingVehicle?.plate ?? ""}
                  placeholder="Ex: ABC-1234"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm uppercase outline-none transition focus:border-gray-900"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Quilometragem atual
                </label>

                <input
                  name="currentMileage"
                  type="number"
                  min="0"
                  defaultValue={editingVehicle?.currentMileage ?? ""}
                  placeholder="Ex: 52000"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Data da compra
                </label>

                <input
                  name="purchaseDate"
                  type="date"
                  defaultValue={formatDateInput(editingVehicle?.purchaseDate)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  Observações
                </label>

                <textarea
                  name="notes"
                  defaultValue={editingVehicle?.notes ?? ""}
                  placeholder="Ex: veículo comprado recentemente, revisão anterior feita fora da concessionária..."
                  className="min-h-24 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900"
                />
              </div>

              <div className="flex flex-wrap gap-3 md:col-span-2">
                <button
                  type="submit"
                  className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  {editingVehicle ? "Salvar alterações" : "Salvar veículo"}
                </button>

                <Link
                  href="/vehicles"
                  className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                >
                  Cancelar
                </Link>
              </div>
            </form>
          </div>
        ) : null}

        {vehicles.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">
              Nenhum veículo cadastrado
            </h2>

            <p className="mt-2 text-gray-600">
              Cadastre seu primeiro veículo para começar a planejar suas
              revisões.
            </p>

            <Link
              href="/vehicles?mode=new"
              className="mt-5 inline-block rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Novo veículo
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {vehicles.map((vehicle) => {
              const currentPlan = vehicle.userPlans[0];

              return (
                <article
                  key={vehicle.id}
                  className="rounded-2xl bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                        Veículo
                      </p>

                      <h2 className="mt-1 text-2xl font-bold text-gray-900">
                        {vehicle.brand} {vehicle.model}
                      </h2>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {vehicle.year ? (
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                            Ano {vehicle.year}
                          </span>
                        ) : null}

                        {vehicle.plate ? (
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                            Placa {vehicle.plate}
                          </span>
                        ) : null}

                        {currentPlan ? (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                            Plano vinculado
                          </span>
                        ) : (
                          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                            Sem plano vinculado
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[360px]">
                      <div className="rounded-xl bg-gray-50 p-4">
                        <p className="text-xs text-gray-500">KM atual</p>

                        <p className="mt-1 text-xl font-bold text-gray-900">
                          {formatMileage(vehicle.currentMileage)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-gray-50 p-4">
                        <p className="text-xs text-gray-500">Data da compra</p>

                        <p className="mt-1 text-xl font-bold text-gray-900">
                          {formatDate(vehicle.purchaseDate)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {vehicle.notes ? (
                    <div className="mt-5 rounded-xl border border-gray-200 p-4">
                      <p className="text-xs text-gray-500">Observações</p>

                      <p className="mt-1 text-sm text-gray-700">
                        {vehicle.notes}
                      </p>
                    </div>
                  ) : null}

                  {currentPlan ? (
                    <div className="mt-5 rounded-xl border border-gray-200 p-4">
                      <p className="text-xs text-gray-500">Plano vinculado</p>

                      <p className="mt-1 font-semibold text-gray-900">
                        {currentPlan.planPackage.name}
                      </p>

                      <p className="mt-1 text-sm text-gray-600">
                        KM inicial do plano:{" "}
                        {currentPlan.initialMileage !== null &&
                        currentPlan.initialMileage !== undefined
                          ? formatMileage(currentPlan.initialMileage)
                          : "-"}
                      </p>
                    </div>
                  ) : null}

                  {vehicle.appointments.length > 0 ? (
                    <div className="mt-5 rounded-xl border border-gray-200 p-4">
                      <h3 className="font-semibold text-gray-900">
                        Últimos agendamentos
                      </h3>

                      <div className="mt-3 space-y-3">
                        {vehicle.appointments.map((appointment) => (
                          <div
                            key={appointment.id}
                            className="rounded-lg bg-gray-50 p-3 text-sm"
                          >
                            <p className="font-semibold text-gray-900">
                              {appointment.revisionService.name}
                            </p>

                            <p className="text-gray-500">
                              {appointment.workshop.name} •{" "}
                              {formatDate(appointment.appointmentDate)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href={`/vehicles?editId=${vehicle.id}`}
                      className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                    >
                      Editar
                    </Link>

                    <Link
                      href="/plans"
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                    >
                      Ver planos
                    </Link>

                    <Link
                      href="/workshops"
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                    >
                      Agendar revisão
                    </Link>

                    <form action={deleteVehicle}>
                      <input
                        type="hidden"
                        name="vehicleId"
                        value={vehicle.id}
                      />

                      <button
                        type="submit"
                        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                      >
                        Excluir
                      </button>
                    </form>
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