'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function DiagnosticResultsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resultados y Estadísticas</CardTitle>
        <CardDescription>
          Visualiza los resultados del diagnóstico
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">
          Próximamente: Dashboard de resultados y estadísticas
        </p>
      </CardContent>
    </Card>
  );
}
