import { redirect } from 'next/navigation'
import Link from 'next/link'
import { compare, hash } from 'bcryptjs'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../lib/auth'
import { prisma } from '../../lib/prisma'

interface Props {
  searchParams: Promise<{
    error?: string
    success?: string
  }>
}

export default async function ChangePasswordPage({ searchParams }: Props) {
  const { error, success } = await searchParams

  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
  })

  if (!user) {
    redirect('/login')
  }

  async function changePassword(formData: FormData) {
    'use server'

    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      redirect('/login')
    }

    const currentPassword = (formData.get('currentPassword') as string)?.trim()
    const newPassword = (formData.get('newPassword') as string)?.trim()
    const confirmPassword = (formData.get('confirmPassword') as string)?.trim()

    if (!currentPassword || !newPassword || !confirmPassword) {
      redirect('/change-password?error=missing-fields')
    }

    if (newPassword.length < 6) {
      redirect('/change-password?error=password-too-short')
    }

    if (newPassword !== confirmPassword) {
      redirect('/change-password?error=password-mismatch')
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
    })

    if (!user || !user.password) {
      redirect('/change-password?error=user-not-found')
    }

    const passwordMatch = await compare(currentPassword, user.password)

    if (!passwordMatch) {
      redirect('/change-password?error=invalid-current-password')
    }

    const hashedPassword = await hash(newPassword, 10)

    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        password: hashedPassword,
      },
    })

    redirect('/change-password?success=updated')
  }

  const errorMessage =
    error === 'missing-fields'
      ? 'Preencha todos os campos.'
      : error === 'password-too-short'
      ? 'A nova senha deve ter pelo menos 6 caracteres.'
      : error === 'password-mismatch'
      ? 'A confirmação da nova senha não confere.'
      : error === 'invalid-current-password'
      ? 'A senha atual está incorreta.'
      : error === 'user-not-found'
      ? 'Usuário não encontrado.'
      : ''

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-[#B11226] px-6 py-12 text-white">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold">Alterar senha</h1>
          <p className="mt-2 text-white/90">
            Atualize sua senha de acesso com segurança
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-10">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          {success === 'updated' ? (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              Senha alterada com sucesso.
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <form action={changePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Senha atual
              </label>
              <input
                type="password"
                name="currentPassword"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nova senha
              </label>
              <input
                type="password"
                name="newPassword"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Mínimo de 6 caracteres.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Confirmar nova senha
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
              Salvar nova senha
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/profile"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Voltar ao perfil
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}