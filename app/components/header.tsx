import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "../../lib/auth";
import LogoutButton from "./logout-button";

export default async function Header() {
  const session = await getServerSession(authOptions);

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-bold text-[#B11226]">
          myRiseCare
        </Link>

        <nav className="flex items-center gap-4 text-sm text-gray-700">
          <Link href="/" className="hover:text-[#B11226]">
            Home
          </Link>

          <Link href="/workshops" className="hover:text-[#B11226]">
            Oficinas
          </Link>

          <Link href="/plans" className="hover:text-[#B11226]">
            Planos
          </Link>

          {session?.user ? (
            <>
              <Link href="/appointments" className="hover:text-[#B11226]">
                Meus agendamentos
              </Link>

              <Link href="/vehicles" className="hover:text-[#B11226]">
                Meus veículos
              </Link>

              <Link href="/my-plan" className="hover:text-[#B11226]">
                Meu plano
              </Link>

              {session.user.role === "ADMIN" ? (
                <Link href="/admin" className="hover:text-[#B11226]">
                  Admin
                </Link>
              ) : null}

              <Link href="/profile" className="hover:text-[#B11226]">
                Meu perfil
              </Link>

              <span className="text-gray-600">
                Olá, {session.user.name ?? session.user.email}
              </span>

              <LogoutButton />
            </>
          ) : (
            <Link href="/login" className="hover:text-[#B11226]">
              Entrar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}