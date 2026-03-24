import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flip - Sistema de Gestión para AIP",
  description: "Gestiona tu Aula de Innovación Pedagógica de forma inteligente",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
