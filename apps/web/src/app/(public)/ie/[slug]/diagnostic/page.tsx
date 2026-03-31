import { Metadata } from 'next';
import { getCachedDiagnosticConfig } from '@/features/diagnostic/lib/diagnostic-config';
import { DiagnosticClient } from './DiagnosticClient';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const config = await getCachedDiagnosticConfig(slug) as any;
  
  if (!config || config.disabled) {
    return {
      title: 'Diagnóstico no disponible | Flip',
    };
  }

  return {
    title: `Diagnóstico Digital - ${config.institutionName}`,
    description: config.customMessage || `Participa en el diagnóstico de habilidades digitales de ${config.institutionName}.`,
    openGraph: {
      title: `Diagnóstico Digital - ${config.institutionName}`,
      description: `Evalúa tus competencias digitales en el sistema Flip.`,
      images: config.institutionLogo ? [{ url: config.institutionLogo }] : [],
    },
  };
}

export default async function DiagnosticPage({ params }: Props) {
  const { slug } = await params;
  const config = await getCachedDiagnosticConfig(slug) as any;

  if (!config) {
    notFound();
  }

  if (config.disabled) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-center">
        <div className="max-w-md space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">Módulo no Disponible</h1>
          <p className="text-gray-600">
            El diagnóstico no está habilitado actualmente para esta institución.
          </p>
        </div>
      </div>
    );
  }

  return <DiagnosticClient initialConfig={config} slug={slug} />;
}
