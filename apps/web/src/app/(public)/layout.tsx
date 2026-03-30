import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Flip - Diagnóstico de Habilidades Digitales',
  description: 'Descubre tu nivel de competencia digital',
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
