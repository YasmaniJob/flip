'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function DiagnosticPendingTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Docentes Pendientes</CardTitle>
        <CardDescription>
          Aprueba docentes que completaron el diagnóstico
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">
          Próximamente: Lista de docentes pendientes de aprobación
        </p>
      </CardContent>
    </Card>
  );
}
