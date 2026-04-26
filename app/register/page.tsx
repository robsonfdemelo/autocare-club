import { redirect } from 'next/navigation'
import Link from 'next/link'
import { hash } from 'bcryptjs'
import { prisma } from '../../lib/prisma'

interface Props {
  searchParams: Promise<{
    error?: string
  }>
}

export default async function RegisterPage({ searchParams }: Props) {
  const { error } = await searchParams

  async function registerUser(formData: FormData) {
    'use server'

    const name = (formData.get('name') as string)?.trim()
    const email = (formData.get('email') as string)?.trim().toLowerCase()
    const password = (formData.get('password') as string)?.trim()
    const confirmPassword = (formData.get('confirmPassword') as string)?.trim()

    if (!name || !email || !password || !confirmPassword) {
      redirect('/register?error=missing-fields')
    }

    if (password.length < 6) {
      redirect('/register?error=password-too-short')
    }

    if (password !== confirmPassword) {
      redirect('/register?error=password-mismatch')
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      redirect('/register?error=email-already-exists')
    }

    const hashedPassword = await hash(password, 10)

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

    redirect('/login?success=registered')
  }

  const errorMessage =
    error === 'missing-fields'
      ? 'Preencha todos os campos.'
      : error === 'email-already-exists'
      ? 'Já existe uma conta com esse e-mail.'
      : error === 'password-mismatch'
      ? 'As senhas não coincidem.'
      : error === 'password-too-short'
      ? 'A senha deve ter pelo menos 6 caracteres.'
      : ''

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-[#B11226] px-6 py-12 text-white">
        <div className="mx-auto max-w-xl">
          <h1 className="text-4xl font-bold">Criar conta</h1>
          <p className="mt-2 text-white/90">
            Cadastre-se para agendar e acompanhar suas revisões
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-xl px-6 py-10">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          {errorMessage ? (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <form action={registerUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nome
              </label>
              <input
                type="text"
                name="name"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                E-mail
              </label>
              <input
                type="email"
                name="email"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <input
                type="password"
                name="password"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Mínimo de 6 caracteres.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Confirmar senha
              </label>
              <input
                type="password"
                name="confirmPassword"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-gray-900 px-4 py-3 font-semibold text-white"
            >
              Criar conta
            </button>
          </form>

          <p className="mt-4 text-sm text-gray-600">
            Já tem conta?{' '}
            <Link href="/login" className="font-semibold text-[#B11226]">
              Entrar
            </Link>
          </p>
        </div>
      </section>
    </main>
  )
}