'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Settings, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export function TrialConfigCard() {
  const [trialDays, setTrialDays] = useState<number>(15);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar configuración actual
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch('/api/admin/config/trial');
        if (res.ok) {
          const data = await res.json();
          setTrialDays(data.trialDays || 15);
        }
      } catch (error) {
        console.error('Error loading trial config:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadConfig();
  }, []);

  const handleSave = async () => {
    if (trialDays < 1 || trialDays > 365) {
      toast.error('Los días deben estar entre 1 y 365');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/config/trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trialDays }),
      });

      if (res.ok) {
        toast.success('Configuración guardada exitosamente');
      } else {
        throw new Error('Error al guardar');
      }
    } catch (error) {
      toast.error('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setTrialDays(15);
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="h-10 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 border-border bg-card">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-black uppercase tracking-widest text-foreground">
            Configuración de Período de Prueba
          </h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="trialDays" className="text-xs font-bold text-muted-foreground">
            Días de prueba para nuevas instituciones
          </Label>
          <div className="flex items-center gap-3">
            <Input
              id="trialDays"
              type="number"
              min={1}
              max={365}
              value={trialDays}
              onChange={(e) => setTrialDays(parseInt(e.target.value) || 15)}
              className="max-w-[120px] h-10 text-center font-mono text-lg font-bold"
            />
            <span className="text-sm text-muted-foreground font-medium">días</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Este valor se aplicará a todas las instituciones que se registren a partir de ahora.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="h-9 px-4 text-xs font-black uppercase tracking-widest"
          >
            {isSaving ? (
              <>Guardando...</>
            ) : (
              <>
                <Save className="w-3.5 h-3.5 mr-2" />
                Guardar
              </>
            )}
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            className="h-9 px-4 text-xs font-black uppercase tracking-widest"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-2" />
            Restablecer (15 días)
          </Button>
        </div>

        <div className="bg-muted/30 border border-border/50 p-3 rounded-lg mt-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-bold text-foreground">Nota:</span> Este cambio solo afecta a las instituciones nuevas. 
            Para modificar el trial de instituciones existentes, usa la opción "Extender Trial" en cada institución.
          </p>
        </div>
      </div>
    </Card>
  );
}
