import { NextResponse } from "next/server";

import { prisma } from "../../../../lib/prisma";

const paidEvents = ["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"];
const paidStatuses = ["RECEIVED", "CONFIRMED"];

export async function POST(req: Request) {
  const token = req.headers.get("asaas-access-token");

  if (token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  const body = await req.json();
  const event = String(body.event ?? "");
  const payment = body.payment;

  if (!payment?.id) {
    return NextResponse.json({ ok: true });
  }

  const paymentStatus = String(payment.status ?? event);
  const isPaidEvent = paidEvents.includes(event);

  const paymentUpdateData: {
    status: string;
    value?: number;
    invoiceUrl?: string | null;
    billingType?: string;
  } = {
    status: paymentStatus,
  };

  if (payment.value !== undefined && payment.value !== null) {
    paymentUpdateData.value = Number(payment.value);
  }

  if (payment.invoiceUrl !== undefined) {
    paymentUpdateData.invoiceUrl = payment.invoiceUrl ?? null;
  }

  if (payment.billingType) {
    paymentUpdateData.billingType = payment.billingType;
  }

  if (!isPaidEvent) {
    await prisma.payment.updateMany({
      where: {
        asaasPaymentId: payment.id,
        status: {
          notIn: paidStatuses,
        },
      },
      data: paymentUpdateData,
    });

    return NextResponse.json({ ok: true });
  }

  const updatedPayment = await prisma.payment.updateMany({
    where: {
      asaasPaymentId: payment.id,
      status: {
        notIn: paidStatuses,
      },
    },
    data: paymentUpdateData,
  });

  if (updatedPayment.count === 0) {
    return NextResponse.json({ ok: true, duplicated: true });
  }

  const localPayment = await prisma.payment.findUnique({
    where: {
      asaasPaymentId: payment.id,
    },
    include: {
      planPackage: true,
    },
  });

  if (!localPayment) {
    return NextResponse.json({ ok: true });
  }

  const now = new Date();
  const graceUntil = new Date(now);
  graceUntil.setDate(
    graceUntil.getDate() + localPayment.planPackage.graceDays,
  );

  await prisma.userPlan.upsert({
    where: {
      userId: localPayment.userId,
    },
    update: {
      planPackageId: localPayment.planPackageId,
      status: "ACTIVE",
      totalRevisions: localPayment.planPackage.revisionsQty,
      usedRevisions: 0,
      availableBalance: localPayment.planPackage.revisionsQty,
      graceUntil,
      startedAt: now,
      expiresAt: null,
    },
    create: {
      userId: localPayment.userId,
      planPackageId: localPayment.planPackageId,
      status: "ACTIVE",
      totalRevisions: localPayment.planPackage.revisionsQty,
      usedRevisions: 0,
      availableBalance: localPayment.planPackage.revisionsQty,
      graceUntil,
      startedAt: now,
    },
  });

  return NextResponse.json({ ok: true, activated: true });
}