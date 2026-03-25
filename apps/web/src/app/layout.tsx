import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { BrandColorProvider } from "@/components/brand-color-provider";
import { QueryProvider } from "@/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import { Toaster as SileoToaster } from "sileo";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Flip - Gestión de Inventario",
  description:
    "Sistema de gestión de inventario y préstamos para instituciones educativas",
  manifest: "/manifest.json",
  themeColor: "#185FA5",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Flip",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

// Script to prevent flash of wrong theme
const themeScript = `
(function() {
    const saved = localStorage.getItem('theme');
    const theme = saved || 'light';
    if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.add(prefersDark ? 'dark' : 'light');
    } else {
        document.documentElement.classList.add(theme);
    }
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${nunito.variable} font-sans antialiased bg-background`}>
        <QueryProvider>
          <ThemeProvider>
            <BrandColorProvider>
              {children}
              <Toaster />
              <SileoToaster position="top-center" theme="system" />
            </BrandColorProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
