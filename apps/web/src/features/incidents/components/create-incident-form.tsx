"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateIncident } from "../hooks/use-incidents";
import { createIncidentSchema, type CreateIncidentInput } from "../schemas";
import { toast } from "sonner";
import type { IncidentType, IncidentPriority } from "../types";

const typeOptions: { value: IncidentType; label: string; description: string }[] = [
  { 
    value: "recursos", 
    label: "Recursos/Equipos", 
    description: "Problemas con equipos, materiales o recursos del inventario" 
  },
  { 
    value: "infraestructura", 
    label: "Infraestructura", 
    description: "Daños en instalaciones, aulas, laboratorios, etc." 
  },
  { 
    value: "servicios", 
    label: "Servicios", 
    description: "Problemas con servicios básicos (agua, luz, internet, etc.)" 
  },
  { 
    value: "seguridad", 
    label: "Seguridad", 
    description: "Incidentes relacionados con la seguridad de la institución" 
  },
  { 
    value: "otros", 
    label: "Otros", 
    description: "Otros tipos de incidencias no clasificadas" 
  },
];

const priorityOptions: { value: IncidentPriority; label: string; description: string }[] = [
  { 
    value: "baja", 
    label: "Baja", 
    description: "Puede esperar, no afecta operaciones críticas" 
  },
  { 
    value: "media", 
    label: "Media", 
    description: "Requiere atención pronto, afecta algunas operaciones" 
  },
  { 
    value: "alta", 
    label: "Alta", 
    description: "Requiere atención urgente, afecta operaciones importantes" 
  },
  { 
    value: "critica", 
    label: "Crítica", 
    description: "Requiere atención inmediata, afecta operaciones críticas" 
  },
];

export function CreateIncidentForm() {
  const router = useRouter();
  const createIncident = useCreateIncident();
  const [selectedType, setSelectedType] = useState<IncidentType | "">("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateIncidentInput>({
    resolver: zodResolver(createIncidentSchema),
  });

  const type = watch("type");

  const onSubmit = async (data: CreateIncidentInput) => {
    try {
      const result = await createIncident.mutateAsync(data);
      toast.success("Incidencia creada correctamente");
      router.push(`/incidencias/${result.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al crear la incidencia");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
          Título <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          {...register("title")}
          placeholder="Ej: Proyector del aula 201 no enciende"
          className="h-10 rounded-none border-border"
        />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
          Descripción <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Describe el problema con el mayor detalle posible..."
          className="min-h-[120px] rounded-none border-border resize-none"
        />
        {errors.description && (
          <p className="text-xs text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Type */}
      <div className="space-y-2">
        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
          Tipo de Incidencia <span className="text-destructive">*</span>
        </Label>
        <Select
          value={type}
          onValueChange={(value) => {
            setValue("type", value as IncidentType);
            setSelectedType(value as IncidentType);
          }}
        >
          <SelectTrigger className="h-10 rounded-none border-border">
            <SelectValue placeholder="Selecciona el tipo de incidencia" />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex flex-col">
                  <span className="font-medium">{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.type && (
          <p className="text-xs text-destructive">{errors.type.message}</p>
        )}
      </div>

      {/* Priority */}
      <div className="space-y-2">
        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
          Prioridad <span className="text-destructive">*</span>
        </Label>
        <Select
          onValueChange={(value) => setValue("priority", value as IncidentPriority)}
        >
          <SelectTrigger className="h-10 rounded-none border-border">
            <SelectValue placeholder="Selecciona la prioridad" />
          </SelectTrigger>
          <SelectContent>
            {priorityOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex flex-col">
                  <span className="font-medium">{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.priority && (
          <p className="text-xs text-destructive">{errors.priority.message}</p>
        )}
      </div>

      {/* Location (for infraestructura/servicios) */}
      {(type === "infraestructura" || type === "servicios") && (
        <div className="space-y-2">
          <Label htmlFor="location" className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
            Ubicación
          </Label>
          <Input
            id="location"
            {...register("location")}
            placeholder="Ej: Aula 201, Laboratorio de Ciencias, Patio principal"
            className="h-10 rounded-none border-border"
          />
          {errors.location && (
            <p className="text-xs text-destructive">{errors.location.message}</p>
          )}
        </div>
      )}

      {/* Resource ID (for recursos type) */}
      {type === "recursos" && (
        <div className="space-y-2">
          <Label htmlFor="resourceId" className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
            Recurso Afectado <span className="text-destructive">*</span>
          </Label>
          <Input
            id="resourceId"
            {...register("resourceId")}
            placeholder="ID del recurso (implementar selector)"
            className="h-10 rounded-none border-border"
          />
          {errors.resourceId && (
            <p className="text-xs text-destructive">{errors.resourceId.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Selecciona el recurso del inventario que presenta el problema
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="rounded-none border-border"
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="rounded-none"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Crear Incidencia
        </Button>
      </div>
    </form>
  );
}
