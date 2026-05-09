import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";

export async function POST(req: Request) {
  const apiKey = process.env.ASAAS_API_KEY;
  const baseUrl = process.env.ASAAS_BASE_URL;

  if (!apiKey || !baseUrl) {
    return NextResponse.json(
      { error: "ASAAS_API_KEY ou ASAAS_BASE_URL não configurado no .env" },
      { status: 500 },
    );
  }

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Usuário não autenticado" },
      { status: 401 },
    );
  }

  const body = await req.json();
  const { name, email, cpf, value, planId } = body;

  if (!name || !email || !cpf || !value || !planId) {
    return NextResponse.json(
      { error: "Dados obrigatórios não enviados" },
      { status: 400 },
    );
  }

  const plan = await prisma.planPackage.findUnique({
    where: {
      id: planId,
    },
  });

  if (!plan || !plan.isActive) {
    return NextResponse.json(
      { error: "Plano inválido ou inativo" },
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
      name,
      email,
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
      billingType: "PIX",
      value,
      dueDate: new Date().toISOString().split("T")[0],
      description: `Assinatura ${plan.name}`,
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
      billingType: payment.billingType ?? "PIX",
    },
  });

  return NextResponse.json(payment);
}