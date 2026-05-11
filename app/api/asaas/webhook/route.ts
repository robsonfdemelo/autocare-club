import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function POST(req: Request) {
  const token = req.headers.get("asaas-access-token");

  if (token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  const body = await req.json();

  const event = body.event;
  const payment = body.payment;

  if (!payment?.id) {
    return NextResponse.json({ ok: true });
  }

  await prisma.payment.updateMany({
    where: {
      asaasPaymentId: payment.id,
    },
    data: {
      status: payment.status ?? event,
    },
  });

  if (event !== "PAYMENT_RECEIVED" && event !== "PAYMENT_CONFIRMED") {
    return NextResponse.json({ ok: true });
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
  graceUntil.setDate(graceUntil.getDate() + localPayment.planPackage.graceDays);

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

  return NextResponse.json({ ok: true });
}