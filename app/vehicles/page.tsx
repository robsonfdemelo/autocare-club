import Image from "next/image";
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

const MIN_VEHICLE_YEAR = 1970;
const MAX_VEHICLE_YEAR = 2026;

const VEHICLE_YEARS = Array.from(
  { length: MAX_VEHICLE_YEAR - MIN_VEHICLE_YEAR + 1 },
  (_, index) => MAX_VEHICLE_YEAR - index,
);

function formatDate(date?: Date | null) {
  if (!date) {
    return "-";
  }

  return new Date(date).toLocaleDateString("pt-BR");
}

function formatDateInput(date?: Date | null) {
  if (!date) {
    return "";
  }

  return new Date(date).toISOString().split("T")[0];
}

function formatMileage(value: number) {
  return `${value.toLocaleString("pt-BR")} km`;
}

function getVehicleImage(vehicle: { brand: string; model: string }) {
  const text = `${vehicle.brand} ${vehicle.model}`.toLowerCase();

  if (text.includes("accord")) {
    return "/honda_accord.jpg";
  }

  if (text.includes("city")) {
    return "/honda_city.jpg";
  }

  if (text.includes("civic") || text.includes("lxr")) {
    return "/honda_civic.jpg";
  }

  if (text.includes("crv") || text.includes("cr-v")) {
    return "/honda_crv.jpg";
  }

  if (text.includes("fit")) {
    return "/honda_fit.jpg";
  }

  if (text.includes("hrv") || text.includes("hr-v")) {
    return "/honda_hrv.jpg";
  }

  if (text.includes("wrv") || text.includes("wr-v")) {
    return "/honda_wrv.jpg";
  }

  return "/honda_civic.jpg";
}

async function getCurrentUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return user;
}

async function resolveVehicleOwner(formData: FormData) {
  const currentUser = await getCurrentUser();

  if (currentUser.role !== "ADMIN") {
    return {
      currentUser,
      ownerUserId: currentUser.id,
    };
  }

  const ownerUserId = String(formData.get("ownerUserId") ?? "").trim();

  if (!ownerUserId) {
    redirect("/vehicles?mode=new&error=owner-required");
  }

  const owner = await prisma.user.findUnique({
    where: {
      id: ownerUserId,
    },
    select: {
      id: true,
    },
  });

  if (!owner) {
    redirect("/vehicles?mode=new&error=owner-not-found");
  }

  return {
    currentUser,
    ownerUserId: owner.id,
  };
}

async function createVehicle(formData: FormData) {
  "use server";

  const { ownerUserId } = await resolveVehicleOwner(formData);

  const brand = String(formData.get("brand") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();
  const yearValue = String(formData.get("year") ?? "").trim();
  const plate = String(formData.get("plate") ?? "")
    .trim()
    .toUpperCase();
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

  if (
    year &&
    (!Number.isFinite(year) ||
      year < MIN_VEHICLE_YEAR ||
      year > MAX_VEHICLE_YEAR)
  ) {
    redirect("/vehicles?mode=new&error=invalid-year");
  }

  await prisma.vehicle.create({
    data: {
      userId: ownerUserId,
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

  const currentUser = await getCurrentUser();

  const vehicleId = String(formData.get("vehicleId") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();
  const yearValue = String(formData.get("year") ?? "").trim();
  const plate = String(formData.get("plate") ?? "")
    .trim()
    .toUpperCase();
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

  if (
    year &&
    (!Number.isFinite(year) ||
      year < MIN_VEHICLE_YEAR ||
      year > MAX_VEHICLE_YEAR)
  ) {
    redirect(`/vehicles?editId=${vehicleId}&error=invalid-year`);
  }

  const vehicle = await prisma.vehicle.findFirst({
    where:
      currentUser.role === "ADMIN"
        ? {
            id: vehicleId,
          }
        : {
            id: vehicleId,
            userId: currentUser.id,
          },
  });

  if (!vehicle) {
    redirect("/vehicles?error=not-found");
  }

  let ownerUserId = vehicle.userId;

  if (currentUser.role === "ADMIN") {
    const selectedOwnerUserId = String(
      formData.get("ownerUserId") ?? "",
    ).trim();

    if (!selectedOwnerUserId) {
      redirect(`/vehicles?editId=${vehicleId}&error=owner-required`);
    }

    const owner = await prisma.user.findUnique({
      where: {
        id: selectedOwnerUserId,
      },
      select: {
        id: true,
      },
    });

    if (!owner) {
      redirect(`/vehicles?editId=${vehicleId}&error=owner-not-found`);
    }

    ownerUserId = owner.id;
  }

  await prisma.vehicle.update({
    where: {
      id: vehicle.id,
    },
    data: {
      userId: ownerUserId,
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

  const currentUser = await getCurrentUser();

  const vehicleId = String(formData.get("vehicleId") ?? "").trim();

  if (!vehicleId) {
    redirect("/vehicles");
  }

  const vehicle = await prisma.vehicle.findFirst({
    where:
      currentUser.role === "ADMIN"
        ? {
            id: vehicleId,
          }
        : {
            id: vehicleId,
            userId: currentUser.id,
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

export default async function VehiclesPage({ searchParams }: Props) {
  const { success, error, mode, editId } = await searchParams;

  const currentUser = await getCurrentUser();
  const isAdmin = currentUser.role === "ADMIN";

  const customers = isAdmin
    ? await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
        },
        orderBy: [
          {
            name: "asc",
          },
          {
            email: "asc",
          },
        ],
      })
    : [];

  const vehicles = await prisma.vehicle.findMany({
    where: isAdmin
      ? {}
      : {
          userId: currentUser.id,
        },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
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

  const selectedOwnerId = editingVehicle?.userId ?? currentUser.id;

  const selectedOwner = isAdmin
    ? customers.find((customer) => customer.id === selectedOwnerId)
    : currentUser;

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
          ? `Informe um ano entre ${MIN_VEHICLE_YEAR} e ${MAX_VEHICLE_YEAR}.`
          : error === "owner-required"
            ? "Selecione o cliente dono do veículo."
            : error === "owner-not-found"
              ? "Cliente não encontrado."
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
            {isAdmin
              ? "Acompanhe todos os veículos cadastrados e seus respectivos clientes"
              : "Cadastre seus veículos para acompanhar revisões por quilometragem e tempo"}
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
              {isAdmin
                ? "Visualize todos os veículos e identifique o cliente responsável."
                : "Gerencie os veículos vinculados à sua conta."}
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

            {selectedOwner ? (
              <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                <p className="font-semibold">Cliente vinculado</p>

                <p className="mt-1">
                  Este veículo será vinculado a{" "}
                  <span className="font-bold">
                    {selectedOwner.name ?? selectedOwner.email}
                  </span>
                  .
                </p>
              </div>
            ) : null}

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

              {isAdmin ? (
                <div className="md:col-span-2">
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Cliente dono do veículo
                  </label>

                  <select
                    name="ownerUserId"
                    defaultValue={selectedOwnerId}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900"
                  >
                    <option value="">Selecione o cliente</option>

                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name
                          ? `${customer.name} - ${customer.email}`
                          : customer.email}
                      </option>
                    ))}
                  </select>
                </div>
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

                <select
                  name="year"
                  defaultValue={editingVehicle?.year ?? ""}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-gray-900"
                >
                  <option value="">Selecione o ano</option>

                  {VEHICLE_YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
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
              {isAdmin
                ? "Nenhum cliente possui veículo cadastrado no momento."
                : "Cadastre seu primeiro veículo para começar a planejar suas revisões."}
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
            {vehicles.map((vehicle, index) => {
              const currentPlan = vehicle.userPlans[0];
              const vehicleImage = getVehicleImage(vehicle);

              return (
                <article
                  key={vehicle.id}
                  className="rounded-2xl bg-white p-6 shadow-sm"
                >
                  <div className="grid gap-6 lg:grid-cols-[170px_1fr]">
                    <div className="flex h-32 items-center justify-center overflow-hidden rounded-2xl bg-white p-3 ring-1 ring-gray-100">
                      <Image
                        src={vehicleImage}
                        alt={`${vehicle.brand} ${vehicle.model}`}
                        width={320}
                        height={200}
                        priority={index === 0}
                        className="max-h-full w-full object-contain"
                      />
                    </div>

                    <div>
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                            Veículo
                          </p>

                          <h2 className="mt-1 text-2xl font-bold text-gray-900">
                            {vehicle.brand} {vehicle.model}
                          </h2>

                          <p className="mt-1 text-sm text-gray-500">
                            Cliente:{" "}
                            <span className="font-semibold text-gray-700">
                              {vehicle.user.name ?? vehicle.user.email}
                            </span>
                          </p>

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
                            <p className="text-xs text-gray-500">
                              Data da compra
                            </p>

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
                          <p className="text-xs text-gray-500">
                            Plano vinculado
                          </p>

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
                    </div>
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