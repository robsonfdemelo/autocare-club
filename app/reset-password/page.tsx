import Link from "next/link";
import { redirect } from "next/navigation";
import crypto from "crypto";
import { Resend } from "resend";

import { prisma } from "../../lib/prisma";

interface Props {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
}

function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000"
  );
}

async function sendPasswordResetEmail(email: string, token: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "onboarding@resend.dev";

  if (!apiKey) {
    throw new Error("RESEND_API_KEY não configurada.");
  }

  const resend = new Resend(apiKey);
  const resetUrl = `${getAppUrl()}/reset-password?token=${token}`;

  await resend.emails.send({
    from,
    to: email,
    subject: "Redefinição de senha - myRiseCare",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Redefinição de senha</h2>
        <p>Recebemos uma solicitação para redefinir sua senha no myRiseCare.</p>
        <p>Clique no botão abaixo para criar uma nova senha:</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;background:#111827;color:#ffffff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:bold;">
            Redefinir senha
          </a>
        </p>
        <p>Este link expira em 1 hora.</p>
        <p>Se você não solicitou essa alteração, ignore este e-mail.</p>
      </div>
    `,
  });
}

async function requestPasswordReset(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    redirect("/forgot-password?error=missing");
  }

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    redirect("/forgot-password?success=true");
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date();

  expiry.setHours(expiry.getHours() + 1);

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      resetToken: token,
      resetTokenExpiry: expiry,
    },
  });

  try {
    await sendPasswordResetEmail(email, token);
  } catch (error) {
    console.error("Erro ao enviar e-mail de redefinição de senha:", error);
    redirect("/forgot-password?error=email");
  }

  redirect("/forgot-password?success=true");
}

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const { success, error } = await searchParams;

  const successMessage =
    success === "true"
      ? "Se o e-mail estiver cadastrado, enviaremos um link para redefinir sua senha."
      : "";

  const errorMessage =
    error === "missing"
      ? "Informe seu e-mail."
      : error === "email"
        ? "Não foi possível enviar o e-mail agora. Tente novamente em alguns minutos."
        : "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">
          Esqueci minha senha
        </h1>

        <p className="mt-2 text-sm text-gray-600">
          Informe seu e-mail para receber o link de redefinição de senha.
        </p>

        {successMessage ? (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {successMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <form action={requestPasswordReset} className="mt-5 space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Digite seu e-mail"
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-gray-900"
          />

          <button
            type="submit"
            className="w-full rounded-lg bg-gray-900 px-4 py-3 font-semibold text-white transition hover:bg-gray-800"
          >
            Recuperar senha
          </button>
        </form>

        <Link
          href="/login"
          className="mt-4 inline-block text-sm font-semibold text-gray-600 hover:text-[#B11226]"
        >
          Voltar para login
        </Link>
      </div>
    </main>
  );
}