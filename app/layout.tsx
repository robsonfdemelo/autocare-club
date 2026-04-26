import "./globals.css";
import Header from "./components/header";
import { Providers } from "./providers";

export const metadata = {
  title: "AutoCare Club",
  description: "Revisões planejadas. Preços previsíveis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50 text-gray-900">
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
