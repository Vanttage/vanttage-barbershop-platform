import type { Metadata } from "next";
import { Syne, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/providers";

const syne = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vanttage - Gestión de Barberías",
  description:
    "Plataforma SaaS para gestionar barberias con reservas, clientes y automatizaciones.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${syne.variable} ${inter.variable}`}>
      <body className="bg-zinc-950 text-zinc-100 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
