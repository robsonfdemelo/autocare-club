import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "../../lib/auth";
import LogoutButton from "./logout-button";

export default async function Header() {
  const session = await getServerSession(authOptions);

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo-myrisecare.jpeg"
              alt="myRiseCare"
              width={240}
              height={70}
              priority
              className="h-14 w-auto object-contain"
            />
          </Link>

          {session?.user ? (
            <div className="md:hidden">
              <LogoutButton />
            </div>
          ) : null}
        </div>

        <nav className="flex max-w-full flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-700 md:justify-end">
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
                Agendamentos
              </Link>

              <Link href="/vehicles" className="hover:text-[#B11226]">
                Veículos
              </Link>

              <Link href="/my-plan" className="hover:text-[#B11226]">
                Plano
              </Link>

              {session.user.role === "ADMIN" ? (
                <Link href="/admin" className="hover:text-[#B11226]">
                  Admin
                </Link>
              ) : null}

              <Link href="/profile" className="hover:text-[#B11226]">
                Perfil
              </Link>

              <span className="hidden text-gray-600 lg:inline">
                Olá, {session.user.name ?? session.user.email}
              </span>

              <div className="hidden md:block">
                <LogoutButton />
              </div>
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