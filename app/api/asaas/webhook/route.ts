import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("WEBHOOK ASAAS:");
    console.log(JSON.stringify(body, null, 2));

    const webhookToken = req.headers.get("asaas-access-token");

    if (
      webhookToken !== process.env.ASAAS_WEBHOOK_TOKEN
    ) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 },
      );
    }

    const event = body.event;

    if (event === "PAYMENT_RECEIVED") {
      console.log("Pagamento recebido");
    }

    if (event === "PAYMENT_CONFIRMED") {
      console.log("Pagamento confirmado");
    }

    if (event === "PAYMENT_OVERDUE") {
      console.log("Pagamento vencido");
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Erro webhook" },
      { status: 500 },
    );
  }
}