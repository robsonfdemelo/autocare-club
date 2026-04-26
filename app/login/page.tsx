"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");

  const [email, setEmail] = useState("teste@autocareclub.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("E-mail ou senha inválidos.");
      return;
    }

    window.location.href = "/appointments";
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-[#B11226] px-6 py-12 text-white">
        <div className="mx-auto max-w-xl">
          <h1 className="text-4xl font-bold">Entrar</h1>
          <p className="mt-2 text-white/90">
            Acesse sua conta do AutoCare Club
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-xl px-6 py-10">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          {success === "registered" ? (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              Cadastro realizado com sucesso. Agora é só entrar.
            </div>
          ) : null}

          {success === "password-reset" ? (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              Senha redefinida com sucesso. Faça login com sua nova senha.
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                E-mail
              </label>
              <input
                type="email"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <input
                type="password"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gray-900 px-4 py-3 font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <p>
              Ainda não tem conta?{" "}
              <Link href="/register" className="font-semibold text-[#B11226]">
                Criar conta
              </Link>
            </p>
            <Link
              href="/forgot-password"
              className="font-semibold text-[#B11226]"
            >
              Esqueci minha senha
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
