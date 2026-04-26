import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const apiKey = process.env.ASAAS_API_KEY;
  const baseUrl = process.env.ASAAS_BASE_URL;

  console.log("ASAAS_API_KEY existe:", Boolean(apiKey));
  console.log("ASAAS_BASE_URL:", baseUrl);

  if (!apiKey || !baseUrl) {
    return NextResponse.json(
      { error: "ASAAS_API_KEY ou ASAAS_BASE_URL não configurado no .env" },
      { status: 500 },
    );
  }

  const body = await req.json();
  const { name, email, cpf, value } = body;

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
    }),
  });

  const payment = await paymentRes.json();

  if (!paymentRes.ok) {
    return NextResponse.json(payment, { status: paymentRes.status });
  }

  return NextResponse.json(payment);
}