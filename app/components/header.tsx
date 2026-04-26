import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import LogoutButton from "./logout-button";

export default async function Header() {
  const session = await getServerSession(authOptions);

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold text-[#B11226]">
          AutoCare Club
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href="/"
            className="text-sm font-medium text-gray-700 hover:text-[#B11226]"
          >
            Home
          </Link>

          <Link
            href="/workshops"
            className="text-sm font-medium text-gray-700 hover:text-[#B11226]"
          >
            Oficinas
          </Link>

          <Link
            href="/appointments"
            className="text-sm font-medium text-gray-700 hover:text-[#B11226]"
          >
            Meus agendamentos
          </Link>

          <Link
            href="/my-plan"
            className="text-sm font-medium text-gray-700 hover:text-[#B11226]"
          >
            Meu plano
          </Link>

          {session?.user?.role === "ADMIN" ? (
            <Link
              href="/admin"
              className="text-sm font-medium text-gray-700 hover:text-[#B11226]"
            >
              Admin
            </Link>
          ) : null}

          {session?.user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="text-sm font-medium text-gray-700 hover:text-[#B11226]"
              >
                Meu perfil
              </Link>

              <span className="text-sm text-gray-600">
                Olá, {session.user.name ?? session.user.email}
              </span>

              <LogoutButton />
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Entrar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
