'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function DiagnosticQuestionsTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Preguntas</CardTitle>
        <CardDescription>
          Administra las preguntas del diagnóstico
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">
          Próximamente: Gestión de preguntas personalizadas
        </p>
      </CardContent>
    </Card>
  );
}
