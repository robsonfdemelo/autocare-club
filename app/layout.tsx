import './globals.css'

export const metadata = {
  title: 'AutoCare Club',
  description: 'Revisões planejadas. Preços previsíveis.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}