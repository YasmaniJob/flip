import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Flip - Gestión Inteligente de Recursos Educativos",
  description: "Optimiza el inventario, préstamos y reuniones de tu institución educativa con Flip. La herramienta definitiva para docentes y coordinadores.",
  keywords: ["gestión de inventario", "préstamos de equipos", "coordinación escolar", "recursos educativos", "AIP"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className={`${inter.variable} font-sans antialiased min-h-screen bg-background text-foreground`}>
        {children}
      </body>
    </html>
  );
}
