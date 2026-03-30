'use client';

import { useState, useEffect } from 'react';
import { useMyInstitution } from '@/features/institutions/hooks/use-my-institution';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Copy, ExternalLink, Loader2 } from 'lucide-react';

export function DiagnosticConfigTab() {
  const { data: institution } = useMyInstitution();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [config, setConfig] = useState({
    diagnosticEnabled: false,
    diagnosticRequiresApproval: true,
    diagnosticCustomMessage: '',
    publicUrl: '',
  });
  
  useEffect(() => {
    if (institution) {
      loadConfig();
    }
  }, [institution]);
  
  const loadConfig = async () => {
    if (!institution) return;
    
    setIsLoading(true);
    try {
      const res = await fetch(`/api/institutions/${institution.id}/diagnostic/config`);
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Error loading config:', error);
      toast.error('Error al cargar configuración');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSave = async () => {
    if (!institution) return;
    
    setIsSaving(true);
    try {
      const res = await fetch(`/api/institutions/${institution.id}/diagnostic/config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagnosticEnabled: config.diagnosticEnabled,
          diagnosticRequiresApproval: config.diagnosticRequiresApproval,
          diagnosticCustomMessage: config.diagnosticCustomMessage || null,
        }),
      });
      
      if (res.ok) {
        toast.success('Configuración guardada');
        loadConfig();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Error al guardar');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Error al guardar configuración');
    } finally {
      setIsSaving(false);
    }
  };
  
  const copyUrl = () => {
    navigator.clipboard.writeText(config.publicUrl);
    toast.success('URL copiada al portapapeles');
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Enable/Disable */}
      <Card>
        <CardHeader>
          <CardTitle>Estado del Módulo</CardTitle>
          <CardDescription>
            Activa o desactiva el diagnóstico para tu institución
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enabled">Módulo de Diagnóstico</Label>
              <p className="text-sm text-gray-500">
                Permite que los docentes accedan al diagnóstico público
              </p>
            </div>
            <Switch
              id="enabled"
              checked={config.diagnosticEnabled}
              onCheckedChange={(checked) =>
                setConfig({ ...config, diagnosticEnabled: checked })
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="approval">Requiere Aprobación</Label>
              <p className="text-sm text-gray-500">
                Los docentes nuevos quedarán pendientes de aprobación
              </p>
            </div>
            <Switch
              id="approval"
              checked={config.diagnosticRequiresApproval}
              onCheckedChange={(checked) =>
                setConfig({ ...config, diagnosticRequiresApproval: checked })
              }
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Public URL */}
      {config.diagnosticEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>Enlace Público</CardTitle>
            <CardDescription>
              Comparte este enlace con tus docentes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={config.publicUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyUrl}
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.open(config.publicUrl, '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Custom Message */}
      <Card>
        <CardHeader>
          <CardTitle>Mensaje Personalizado</CardTitle>
          <CardDescription>
            Mensaje opcional que se mostrará en la landing del diagnóstico
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Ej: Bienvenido al diagnóstico de habilidades digitales de nuestra institución..."
            value={config.diagnosticCustomMessage}
            onChange={(e) =>
              setConfig({ ...config, diagnosticCustomMessage: e.target.value })
            }
            rows={4}
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-2">
            {config.diagnosticCustomMessage.length}/500 caracteres
          </p>
        </CardContent>
      </Card>
      
      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="gap-2"
        >
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          Guardar Cambios
        </Button>
      </div>
    </div>
  );
}
