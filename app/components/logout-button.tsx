'use client'

import { signOut } from 'next-auth/react'

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
    >
      Sair
    </button>
  )
}