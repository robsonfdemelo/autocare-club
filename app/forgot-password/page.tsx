import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '../../lib/prisma'
import crypto from 'crypto'

export default function ForgotPasswordPage() {
  async function handleRequest(formData: FormData) {
    'use server'

    const email = (formData.get('email') as string)?.trim().toLowerCase()

    if (!email) {
      redirect('/forgot-password?error=missing')
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      redirect('/forgot-password?success=true')
    }

    const token = crypto.randomBytes(32).toString('hex')

    const expiry = new Date()
    expiry.setHours(expiry.getHours() + 1)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry,
      },
    })

    redirect(`/reset-password?token=${token}`)
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">
          Esqueci minha senha
        </h1>

        <form action={handleRequest} className="mt-4 space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Seu e-mail"
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
            required
          />

          <button className="w-full rounded-lg bg-gray-900 py-2 text-white">
            Recuperar senha
          </button>
        </form>

        <Link href="/login" className="mt-4 block text-sm text-gray-600">
          Voltar para login
        </Link>
      </div>
    </main>
  )
}