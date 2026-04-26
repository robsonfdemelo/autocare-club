import { redirect } from 'next/navigation'
import { prisma } from '../../lib/prisma'
import { hash } from 'bcryptjs'

interface Props {
  searchParams: Promise<{
    token?: string
    error?: string
  }>
}

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token, error } = await searchParams

  if (!token) {
    redirect('/login')
  }

  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
    },
  })

  if (!user || !user.resetTokenExpiry || new Date() > user.resetTokenExpiry) {
    redirect('/login')
  }

  async function handleReset(formData: FormData) {
    'use server'

    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (!password || !confirmPassword) {
      redirect(`/reset-password?token=${token}&error=missing`)
    }

    if (password.length < 6) {
      redirect(`/reset-password?token=${token}&error=short`)
    }

    if (password !== confirmPassword) {
      redirect(`/reset-password?token=${token}&error=match`)
    }

    const freshUser = await prisma.user.findFirst({
      where: {
        resetToken: token,
      },
    })

    if (!freshUser || !freshUser.resetTokenExpiry || new Date() > freshUser.resetTokenExpiry) {
      redirect('/login')
    }

    const hashed = await hash(password, 10)

    await prisma.user.update({
      where: { id: freshUser.id },
      data: {
        password: hashed,
        resetToken: null,
        resetTokenExpiry: null,
      },
    })

    redirect('/login?success=password-reset')
  }

  const errorMessage =
    error === 'missing'
      ? 'Preencha todos os campos.'
      : error === 'short'
      ? 'Senha muito curta.'
      : error === 'match'
      ? 'Senhas não coincidem.'
      : ''

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Nova senha</h1>

        {errorMessage ? (
          <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
        ) : null}

        <form action={handleReset} className="mt-4 space-y-4">
          <input
            type="password"
            name="password"
            placeholder="Nova senha"
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirmar senha"
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          />

          <button className="w-full rounded-lg bg-gray-900 py-2 text-white">
            Salvar nova senha
          </button>
        </form>
      </div>
    </main>
  )
}