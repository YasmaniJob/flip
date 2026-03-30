"use client";

import { useState, useEffect, useMemo } from "react";
import { X, ChevronRight, ChevronLeft, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStaff, useRecurrentStaff } from "@/features/staff/hooks/use-staff";
import { useConfigLoadout } from "@/features/settings/hooks/use-config-loadout";
import { useCreateReservation } from "../hooks/use-reservations";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "sonner";

interface MobileReservationWizardProps {
  open: boolean;
  onClose: () => void;
  selectedSlots: { date: Date; pedagogicalHourId: string }[];
  classroomId: string;
  onSuccess?: () => void;
}

type Step = 1 | 2;
type Purpose = "class" | "workshop" | "management";

const PURPOSE_OPTIONS = [
  { value: "class" as Purpose, label: "Sesión de Clase", icon: "📚" },
  { value: "workshop" as Purpose, label: "Proyecto / Taller", icon: "🔧" },
  { value: "management" as Purpose, label: "Gestión y Otros", icon: "📋" },
];

export function MobileReservationWizard({
  open,
  onClose,
  selectedSlots,
  classroomId,
  onSuccess,
}: MobileReservationWizardProps) {
  const [step, setStep] = useState<Step>(1);
  const [staffSearch, setStaffSearch] = useState("");
  const debouncedSearch = useDebounce(staffSearch, 300);
  
  // Form state
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [selectedStaffName, setSelectedStaffName] = useState<string>("");
  const [purpose, setPurpose] = useState<Purpose>("class");
  const [gradeId, setGradeId] = useState<string>("");
  const [sectionId, setSectionId] = useState<string>("");
  const [curricularAreaId, setCurricularAreaId] = useState<string>("");
  const [activityPurpose, setActivityPurpose] = useState<string>("");

  // Data hooks
  const { staff } = useStaff({ search: debouncedSearch, limit: 20, includeAdmins: true });
  const { data: recurrentStaff } = useRecurrentStaff(6);

  // Unified Data Loadout
  const { data: config, isLoading: isLoadingConfig } = useConfigLoadout();
  
  // Extracted from loadout
  const grades = config?.grades;
  const curricularAreas = config?.curricularAreas;

  // Local filter for sections
  const sections = useMemo(() => {
    if (!config?.sections || !gradeId) return [];
    return config.sections.filter(s => s.gradeId === gradeId);
  }, [config?.sections, gradeId]);
  
  const createMutation = useCreateReservation();

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setStep(1);
      setStaffSearch("");
      setSelectedStaffId("");
      setSelectedStaffName("");
      setPurpose("class");
      setGradeId("");
      setSectionId("");
      setCurricularAreaId("");
      setActivityPurpose("");
      
      // Hide bottom nav when modal opens
      window.dispatchEvent(new CustomEvent('hide-bottom-nav'));
    } else {
      // Show bottom nav when modal closes
      window.dispatchEvent(new CustomEvent('show-bottom-nav'));
    }
  }, [open]);

  const handleNext = () => {
    if (step === 1 && selectedStaffId && purpose) {
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const handleSubmit = async () => {
    if (!selectedStaffId || !classroomId) {
      toast.error("Faltan datos requeridos");
      return;
    }

    const reservationType = purpose === "management" ? undefined : purpose;

    const reservationData = {
      staffId: selectedStaffId,
      classroomId,
      ...(reservationType && { type: reservationType }),
      slots: selectedSlots.map(slot => ({
        date: slot.date.toISOString().split('T')[0],
        pedagogicalHourId: slot.pedagogicalHourId,
      })),
      ...(gradeId && { gradeId }),
      ...(sectionId && { sectionId }),
      ...(curricularAreaId && { curricularAreaId }),
      ...(activityPurpose && { purpose: activityPurpose }),
    };

    try {
      await createMutation.mutateAsync(reservationData);
      toast.success("Reserva creada exitosamente");
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Error al crear la reserva");
    }
  };

  const canProceed = step === 1 ? (selectedStaffId && purpose) : true;

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="lg:hidden fixed inset-0 bg-black/50 z-[69]"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="lg:hidden fixed inset-0 z-[70] flex flex-col bg-background">
        {/* Header */}
        <div className="flex-shrink-0 px-4 py-4 border-b border-border bg-card">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold">Nueva Reserva</h2>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-muted rounded-lg"
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Progress */}
          <div className="flex items-center gap-2">
            <div className={cn("flex-1 h-1 rounded-full", step >= 1 ? "bg-primary" : "bg-muted")} />
            <div className={cn("flex-1 h-1 rounded-full", step >= 2 ? "bg-primary" : "bg-muted")} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Paso {step} de 2</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Contexto Pedagógico</h3>
              
              {/* Responsible */}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-2">
                  Responsable *
                </label>
                
                {/* Selected Staff Display */}
                {selectedStaffName ? (
                  <div className="px-4 py-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between">
                    <span className="text-sm font-medium">{selectedStaffName}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStaffId("");
                        setSelectedStaffName("");
                      }}
                      className="text-primary hover:text-primary/80"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Buscar docente..."
                        value={staffSearch}
                        onChange={(e) => setStaffSearch(e.target.value)}
                        autoComplete="off"
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    
                    {/* Search Results */}
                    {staffSearch && (
                      <div className="mt-2">
                        {staff && staff.length > 0 ? (
                          <div className="border border-border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                            {staff.map((member) => (
                              <button
                                key={member.id}
                                type="button"
                                onClick={() => {
                                  setSelectedStaffId(member.id);
                                  setSelectedStaffName(member.name);
                                  setStaffSearch("");
                                }}
                                className="w-full px-4 py-2.5 text-left hover:bg-muted transition-colors border-b border-border last:border-b-0"
                              >
                                <p className="text-sm font-medium">{member.name}</p>
                                {member.email && <p className="text-xs text-muted-foreground">{member.email}</p>}
                              </button>
                            ))}
                          </div>
                        ) : debouncedSearch ? (
                          <p className="text-sm text-muted-foreground px-4 py-2">No se encontraron docentes</p>
                        ) : (
                          <p className="text-sm text-muted-foreground px-4 py-2">Buscando...</p>
                        )}
                      </div>
                    )}
                    
                    {/* Frequent Staff */}
                    {!staffSearch && recurrentStaff && recurrentStaff.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Docentes Frecuentes</p>
                        <div className="space-y-2">
                          {recurrentStaff.map((member) => (
                            <button
                              key={member.id}
                              type="button"
                              onClick={() => {
                                setSelectedStaffId(member.id);
                                setSelectedStaffName(member.name);
                              }}
                              className="w-full px-4 py-2.5 text-left bg-muted/50 hover:bg-muted rounded-lg transition-colors"
                            >
                              <p className="text-sm font-medium">{member.name}</p>
                              {member.email && <p className="text-xs text-muted-foreground">{member.email}</p>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Purpose */}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-2">
                  Propósito Pedagógico *
                </label>
                <div className="space-y-2">
                  {PURPOSE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPurpose(option.value)}
                      className={cn(
                        "w-full px-4 py-3 rounded-lg border text-left flex items-center gap-3",
                        purpose === option.value
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background hover:bg-muted"
                      )}
                    >
                      <span className="text-2xl">{option.icon}</span>
                      <span className="text-sm font-medium flex-1">{option.label}</span>
                      {purpose === option.value && <Check className="h-5 w-5 text-primary" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Detalles de la Reserva</h3>
              
              {/* Curricular Area */}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-2">Área Curricular</label>
                <select
                  disabled={isLoadingConfig}
                  value={curricularAreaId}
                  onChange={(e) => setCurricularAreaId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">{isLoadingConfig ? "Cargando..." : "Seleccionar área"}</option>
                  {curricularAreas?.map((area) => (
                    <option key={area.id} value={area.id}>{area.name}</option>
                  ))}
                </select>
              </div>

              {/* Grade */}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-2">Grado</label>
                <select
                  disabled={isLoadingConfig}
                  value={gradeId}
                  onChange={(e) => {
                    setGradeId(e.target.value);
                    setSectionId("");
                  }}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">{isLoadingConfig ? "Cargando..." : "Seleccionar grado"}</option>
                  {grades?.map((grade) => (
                    <option key={grade.id} value={grade.id}>{grade.name}</option>
                  ))}
                </select>
              </div>

              {/* Section */}
              {gradeId && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-2">Sección</label>
                  <select
                    value={sectionId}
                    onChange={(e) => setSectionId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Seleccionar sección</option>
                    {sections?.map((section) => (
                      <option key={section.id} value={section.id}>{section.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Activity Purpose */}
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-2">Propósito de la Actividad</label>
                <textarea
                  value={activityPurpose}
                  onChange={(e) => setActivityPurpose(e.target.value)}
                  placeholder="Describe el objetivo de esta reserva..."
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-border bg-card" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
          {step === 1 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed}
              className={cn(
                "w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2",
                canProceed
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 py-3 rounded-lg font-semibold text-sm bg-muted hover:bg-muted/80 flex items-center justify-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Atrás
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={createMutation.isPending}
                className="flex-1 py-3 rounded-lg font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {createMutation.isPending ? "Creando..." : "Crear Reserva"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
