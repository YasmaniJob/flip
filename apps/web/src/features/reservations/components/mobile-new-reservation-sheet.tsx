"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/mobile/bottom-sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Chip {
  id: string;
  label: string;
}

interface MobileNewReservationSheetProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: {
    purpose: string;
    curricularAreaId?: string;
    gradeId?: string;
    sectionId?: string;
  }) => void;
  curricularAreas?: Chip[];
  grades?: Chip[];
  sections?: Chip[];
}

export function MobileNewReservationSheet({
  open,
  onClose,
  onConfirm,
  curricularAreas = [],
  grades = [],
  sections = [],
}: MobileNewReservationSheetProps) {
  const [purpose, setPurpose] = useState("");
  const [selectedArea, setSelectedArea] = useState<string>();
  const [selectedGrade, setSelectedGrade] = useState<string>();
  const [selectedSection, setSelectedSection] = useState<string>();

  const purposes = [
    { id: "clase", label: "Sesión de clase" },
    { id: "taller", label: "Taller/Proyecto" },
    { id: "reunion", label: "Reunión" },
    { id: "evaluacion", label: "Evaluación" },
    { id: "otro", label: "Otro" },
  ];

  const handleConfirm = () => {
    onConfirm({
      purpose,
      curricularAreaId: selectedArea,
      gradeId: selectedGrade,
      sectionId: selectedSection,
    });
    handleReset();
  };

  const handleReset = () => {
    setPurpose("");
    setSelectedArea(undefined);
    setSelectedGrade(undefined);
    setSelectedSection(undefined);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={handleClose} title="Nueva reserva">
      <div className="p-4 space-y-6">
        {/* Purpose */}
        <div>
          <label className="text-sm font-semibold text-foreground mb-2 block">
            Propósito
          </label>
          <div className="flex flex-wrap gap-2">
            {purposes.map((p) => (
              <button
                key={p.id}
                onClick={() => setPurpose(p.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all border-2",
                  purpose === p.id
                    ? "bg-[#185FA5] text-white border-[#185FA5]"
                    : "bg-card text-foreground border-border hover:border-[#185FA5]/30"
                )}
              >
                {purpose === p.id && <Check className="inline h-4 w-4 mr-1" />}
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Curricular Area */}
        {curricularAreas.length > 0 && (
          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">
              Área curricular
            </label>
            <div className="flex flex-wrap gap-2">
              {curricularAreas.map((area) => (
                <button
                  key={area.id}
                  onClick={() => setSelectedArea(area.id)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all border-2",
                    selectedArea === area.id
                      ? "bg-[#185FA5] text-white border-[#185FA5]"
                      : "bg-card text-foreground border-border hover:border-[#185FA5]/30"
                  )}
                >
                  {selectedArea === area.id && <Check className="inline h-4 w-4 mr-1" />}
                  {area.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Grade */}
        {grades.length > 0 && (
          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">
              Grado
            </label>
            <div className="flex flex-wrap gap-2">
              {grades.map((grade) => (
                <button
                  key={grade.id}
                  onClick={() => setSelectedGrade(grade.id)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all border-2",
                    selectedGrade === grade.id
                      ? "bg-[#185FA5] text-white border-[#185FA5]"
                      : "bg-card text-foreground border-border hover:border-[#185FA5]/30"
                  )}
                >
                  {selectedGrade === grade.id && <Check className="inline h-4 w-4 mr-1" />}
                  {grade.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Section */}
        {sections.length > 0 && (
          <div>
            <label className="text-sm font-semibold text-foreground mb-2 block">
              Sección
            </label>
            <div className="flex flex-wrap gap-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setSelectedSection(section.id)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all border-2",
                    selectedSection === section.id
                      ? "bg-[#185FA5] text-white border-[#185FA5]"
                      : "bg-card text-foreground border-border hover:border-[#185FA5]/30"
                  )}
                >
                  {selectedSection === section.id && <Check className="inline h-4 w-4 mr-1" />}
                  {section.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!purpose}
            className="flex-1 bg-[#185FA5] hover:bg-[#185FA5]/90"
          >
            Confirmar reserva
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
