'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMyInstitution } from '@/features/institutions/hooks/use-my-institution';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Copy, ExternalLink, Loader2, MonitorPlay, Save, Check, Globe, ShieldCheck, Mail, AlertCircle, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBrandColor } from '@/components/brand-color-provider';

export function DiagnosticConfigTab() {
  const { data: institution } = useMyInstitution();
  const { brandColor, logoUrl, institutionName } = useBrandColor();
  const [isSaving, setIsSaving] = useState(false);
  
  const [config, setConfig] = useState({
    diagnosticEnabled: false,
    diagnosticRequiresApproval: true,
    diagnosticCustomMessage: '',
    publicUrl: '',
  });
  
  const { data: fetchConfig, isLoading: isQueryLoading, refetch } = useQuery({
    queryKey: ['diagnostic-config', institution?.id],
    queryFn: async () => {
      const res = await fetch(`/api/institutions/${institution?.id}/diagnostic/config`);
      if (!res.ok) throw new Error('Error al cargar configuración');
      return res.json();
    },
    enabled: !!institution?.id,
  });

  useEffect(() => {
    if (fetchConfig) {
      setConfig({
        diagnosticEnabled: fetchConfig.diagnosticEnabled ?? false,
        diagnosticRequiresApproval: fetchConfig.diagnosticRequiresApproval ?? true,
        diagnosticCustomMessage: fetchConfig.diagnosticCustomMessage ?? '',
        publicUrl: fetchConfig.publicUrl ?? '',
      });
    }
  }, [fetchConfig]);
  
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
        toast.success('Configuración guardada exitosamente');
        refetch();
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
    if (!config.publicUrl) return;
    navigator.clipboard.writeText(config.publicUrl);
    toast.success('URL pública copiada al portapapeles');
  };
  
  if (isQueryLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs font-black uppercase tracking-widest">Cargando Preferencias...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-8 pb-10">
      {/* Header and Save Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-border pb-6">
        <div>
          <h2 className="text-xl font-black tracking-tighter text-foreground uppercase">Ajustes Generales</h2>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-primary hover:bg-primary/90 text-white rounded-md shadow-none font-black uppercase tracking-widest text-[11px] h-9 px-6"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5 mr-2" />
            )}
            Guardar Cambios
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Controls */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Master Switch Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4 text-primary" />
              <h3 className="text-[11px] font-black uppercase tracking-widest text-foreground">Disponibilidad del Módulo</h3>
            </div>
            
            <div className={cn(
              "border rounded-lg p-5 transition-all shadow-none flex flex-col gap-4",
              config.diagnosticEnabled ? "border-primary/50 bg-primary/5" : "border-border bg-background"
            )}>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <Label htmlFor="enabled" className={cn(
                    "text-sm font-black uppercase tracking-tight block",
                    config.diagnosticEnabled ? "text-primary" : "text-foreground"
                  )}>
                    {config.diagnosticEnabled ? 'Diagnóstico Activo' : 'Diagnóstico Apagado'}
                  </Label>
                  <p className="text-[12px] text-muted-foreground font-medium leading-snug">
                    {config.diagnosticEnabled 
                      ? "El portal público está abierto recibiendo respuestas."
                      : "Apaga el diagnóstico para congelar las estadísticas o cuando haya terminado la ventana de evaluación."}
                  </p>
                </div>
                <Switch
                  id="enabled"
                  checked={config.diagnosticEnabled}
                  onCheckedChange={(checked) => setConfig({ ...config, diagnosticEnabled: checked })}
                  className="data-[state=checked]:bg-primary h-5 w-9 [&_span]:h-4 [&_span]:w-4 [&_span]:data-[state=checked]:translate-x-4 shrink-0 mt-1"
                />
              </div>

              {config.diagnosticEnabled && config.publicUrl && (
                <div className="pt-4 mt-2 border-t border-primary/10 flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary/70">Enlace Público para Docentes</Label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        value={config.publicUrl}
                        readOnly
                        className="font-mono text-[11px] h-9 bg-background/50 border-primary/20 shadow-none pr-10 focus-visible:ring-primary/20"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={copyUrl}
                        className="absolute right-0 top-0 h-9 w-9 text-primary hover:bg-primary/10 hover:text-primary rounded-l-none"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => window.open(config.publicUrl, '_blank')}
                      className="h-9 w-9 border-primary/20 text-primary hover:bg-primary/10 hover:text-primary shrink-0 transition-colors shadow-none"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Security & Access Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <h3 className="text-[11px] font-black uppercase tracking-widest text-foreground">Gobernanza de Datos</h3>
            </div>
            
            <div className="border border-border rounded-lg bg-background p-5 shadow-none hover:border-border/80 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <Label htmlFor="approval" className="text-[13px] font-bold tracking-tight block text-foreground">
                    Modo "Aprobación Requerida"
                  </Label>
                  <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                    Si se desactiva, cualquier persona con el enlace aparecerá automáticamente en las métricas institucionales pudiendo alterar las estadísticas. Se recomienda mantener activo para auditar manualmente nuevos perfiles.
                  </p>
                </div>
                <Switch
                  id="approval"
                  checked={config.diagnosticRequiresApproval}
                  onCheckedChange={(checked) => setConfig({ ...config, diagnosticRequiresApproval: checked })}
                  className="data-[state=checked]:bg-primary h-5 w-9 [&_span]:h-4 [&_span]:w-4 [&_span]:data-[state=checked]:translate-x-4 shrink-0 mt-1"
                />
              </div>
            </div>
          </section>

          {/* Custom Message Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-4 h-4 text-primary" />
              <h3 className="text-[11px] font-black uppercase tracking-widest text-foreground">Mensaje Institucional</h3>
            </div>
            
            <div className="space-y-3">
              <Textarea
                placeholder="Ej: Estimado equipo de la IE San Juan, este diagnóstico nos ayudará a planificar nuestras capacitaciones..."
                value={config.diagnosticCustomMessage || ''}
                onChange={(e) => setConfig({ ...config, diagnosticCustomMessage: e.target.value })}
                className="min-h-[140px] text-sm rounded-lg border-border focus:ring-4 focus:ring-primary/5 focus:border-primary/50 bg-background shadow-none font-medium placeholder:text-muted-foreground/40 transition-all resize-none block w-full outline-none"
                maxLength={300}
              />
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Se mostrará en la portada del formulario
                </p>
                <p className={cn(
                  "text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 transition-colors",
                  (config.diagnosticCustomMessage || '').length >= 280 && "text-orange-500",
                  (config.diagnosticCustomMessage || '').length === 300 && "text-rose-500"
                )}>
                  {(config.diagnosticCustomMessage || '').length} / 300
                </p>
              </div>
            </div>
          </section>

        </div>

        {/* Right Column - Live Preview */}
        <div className="lg:col-span-7">
          <div className="sticky top-6">
            <div className="flex items-center gap-2 mb-4">
              <MonitorPlay className="w-4 h-4 text-primary" />
              <h3 className="text-[11px] font-black uppercase tracking-widest text-foreground">Previsualización en Vivo</h3>
            </div>
            
            <div className="w-full aspect-[4/3] max-h-[500px] border border-border rounded-xl bg-muted/20 overflow-hidden flex flex-col relative">
              {/* Browser Chrome Header */}
              <div className="h-10 border-b border-border bg-card/60 flex items-center px-4 gap-2 shrink-0">
                <div className="flex gap-1.5">
                   <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                   <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                   <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                </div>
                <div className="mx-auto bg-background border border-border/60 rounded-full h-6 px-6 flex items-center justify-center min-w-[200px] max-w-xs shadow-sm">
                   <p className="text-[10px] text-muted-foreground font-mono truncate">
                     flip.org.pe/ie/{institution?.slug || 'demo'}
                   </p>
                </div>
              </div>

              {/* Fake Landing Content */}
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden bg-background">
                {/* Decorative background matching standard flip theme */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-primary/5 blur-3xl" style={{ backgroundColor: brandColor ? `${brandColor}15` : undefined }} />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-primary/5 blur-3xl animate-pulse" style={{ backgroundColor: brandColor ? `${brandColor}15` : undefined }} />

                <div className="relative z-10 w-full max-w-sm mx-auto flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
                  {/* Fake Institutional Logo */}
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="h-14 w-auto object-contain mb-8 rounded-sm shadow-sm border border-border/50 bg-white" />
                  ) : (
                    <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-8 border border-primary/20 text-primary" style={{ backgroundColor: brandColor ? `${brandColor}15` : undefined, borderColor: brandColor ? `${brandColor}30` : undefined, color: brandColor || undefined }}>
                      <Building2 className="h-6 w-6" />
                    </div>
                  )}

                  {/* Institution Name Fake Header */}
                  <h1 className="text-2xl font-black tracking-tighter text-foreground mb-3 leading-tight uppercase">
                    Diagnóstico de<br/>Habilidades Digitales
                  </h1>
                  
                  <div className="h-1 w-12 bg-primary rounded-full mb-6 mx-auto" style={{ backgroundColor: brandColor || undefined }}></div>

                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                    {institutionName || 'Nuestra Institución'}
                  </p>

                  {/* The actual injected message */}
                  <div className="bg-muted/30 border border-border/50 p-4 rounded-xl w-full mb-8 relative">
                    <div className="absolute -left-2 top-4 text-primary opacity-20" style={{ color: brandColor || undefined }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 11L8 15H11V18H5V15L7 11H5V6H10V11ZM20 11L18 15H21V18H15V15L17 11H15V6H20V11Z" fill="currentColor"/>
                      </svg>
                    </div>
                    <p className={cn(
                      "text-[13px] font-medium leading-relaxed italic relative z-10",
                      config.diagnosticCustomMessage ? "text-foreground" : "text-muted-foreground/60"
                    )}>
                      {config.diagnosticCustomMessage || "Aquí aparecerá tu mensaje personalizado dando la bienvenida e indicando el propósito de la evaluación al equipo docente..."}
                    </p>
                  </div>

                  {/* Fake Start Button */}
                  <Button disabled className="w-full opacity-100 bg-primary text-white shadow-md font-black uppercase tracking-widest h-12 rounded-lg" style={{ backgroundColor: brandColor || undefined }}>
                    Iniciar Diagnóstico
                  </Button>
                  
                  <p className="text-[10px] text-muted-foreground font-bold flex items-center mt-4">
                    <ShieldCheck className="w-3 h-3 mr-1" /> Análisis Anónimo y Seguro
                  </p>
                </div>
              </div>
            </div>
            
            <p className="text-[10px] text-muted-foreground/60 text-center mt-3 font-medium uppercase tracking-widest">
              Vista previa referencial en escritorio
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
