import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

type BillingType = "PIX" | "CREDIT_CARD";

export async function POST(req: Request) {
  const apiKey = process.env.ASAAS_API_KEY;
  const baseUrl = process.env.ASAAS_BASE_URL;

  if (!apiKey || !baseUrl) {
    return NextResponse.json(
      { error: "ASAAS_API_KEY ou ASAAS_BASE_URL não configurado." },
      { status: 500 },
    );
  }

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Usuário não autenticado." },
      { status: 401 },
    );
  }

  const body = await req.json();

  const planId = String(body.planId ?? "").trim();
  const cpf = String(body.cpf ?? "").replace(/\D/g, "");
  const billingType = String(body.billingType ?? "PIX") as BillingType;

  if (!planId || !cpf) {
    return NextResponse.json(
      { error: "Plano e CPF são obrigatórios." },
      { status: 400 },
    );
  }

  if (cpf.length !== 11 && cpf.length !== 14) {
    return NextResponse.json(
      { error: "CPF/CNPJ inválido." },
      { status: 400 },
    );
  }

  if (billingType !== "PIX" && billingType !== "CREDIT_CARD") {
    return NextResponse.json(
      { error: "Forma de pagamento inválida." },
      { status: 400 },
    );
  }

  const [plan, user] = await Promise.all([
    prisma.planPackage.findUnique({
      where: {
        id: planId,
      },
    }),
    prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
    }),
  ]);

  if (!plan || !plan.isActive) {
    return NextResponse.json(
      { error: "Plano inválido ou inativo." },
      { status: 400 },
    );
  }

  if (!user?.email) {
    return NextResponse.json(
      { error: "Usuário sem e-mail cadastrado." },
      { status: 400 },
    );
  }

  const value = Number(plan.price);

  if (!value || value <= 0) {
    return NextResponse.json(
      { error: "Plano sem valor válido configurado." },
      { status: 400 },
    );
  }

  const headers = {
    "Content-Type": "application/json",
    access_token: apiKey,
  };

  const customerRes = await fetch(`${baseUrl}/customers`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: user.name ?? user.email,
      email: user.email,
      cpfCnpj: cpf,
    }),
  });

  const customer = await customerRes.json();

  if (!customerRes.ok) {
    return NextResponse.json(customer, { status: customerRes.status });
  }

  const paymentRes = await fetch(`${baseUrl}/payments`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      customer: customer.id,
      billingType,
      value,
      dueDate: new Date().toISOString().split("T")[0],
      description: `Plano ${plan.name}`,
      externalReference: `${session.user.id}:${plan.id}`,
    }),
  });

  const payment = await paymentRes.json();

  if (!paymentRes.ok) {
    return NextResponse.json(payment, { status: paymentRes.status });
  }

  await prisma.payment.create({
    data: {
      userId: session.user.id,
      planPackageId: plan.id,
      asaasPaymentId: payment.id,
      status: payment.status ?? "PENDING",
      value: Number(payment.value ?? value),
      invoiceUrl: payment.invoiceUrl ?? null,
      billingType: payment.billingType ?? billingType,
    },
  });

  return NextResponse.json(payment);
}