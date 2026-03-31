'use client';

import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { DiagnosticPDFDocument } from './diagnostic-pdf-document';
import type { DiagnosticLevel } from '../types';

interface DiagnosticPDFGeneratorProps {
  userName: string;
  institutionName: string;
  institutionLogo?: string | null;
  educationalLevel?: string;
  province?: string;
  level: DiagnosticLevel;
  overallScore: number;
  completedAt: string;
  categoryScores: Record<string, number>;
  categoryNames: Record<string, string>;
  year?: number;
}

export function DiagnosticPDFGenerator(props: DiagnosticPDFGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const currentYear = props.year || new Date().getFullYear();

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    try {
      // Por ahora, no usar el logo (CORS issue con URLs externas)
      // En el futuro se puede implementar un proxy o subir logos al servidor
      const blob = await pdf(
        <DiagnosticPDFDocument {...props} institutionLogo={null} />
      ).toBlob();
      
      // Crear URL y descargar con año en el nombre
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `diagnostico-${props.userName.toLowerCase().replace(/\s+/g, '-')}-${currentYear}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generando PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleDownloadPDF}
      disabled={isGenerating}
      variant="default"
      size="lg"
      className="w-full font-black uppercase tracking-widest text-xs"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Generando Informe...
        </>
      ) : (
        <>
          <Download className="w-5 h-5 mr-2" />
          Descargar Informe (PDF)
        </>
      )}
    </Button>
  );
}
