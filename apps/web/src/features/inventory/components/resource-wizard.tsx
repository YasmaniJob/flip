"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { WizardStep1 } from "./wizard-step-1";
import { BottomSheet } from "@/components/mobile/bottom-sheet";

interface ResourceWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (params?: {
    categoryId: string;
    templateId: string;
    templateName: string;
    templateIcon?: string;
  }) => void;
}

export interface WizardData {
  mode: "individual" | "batch";
  templateId?: string;
}

export function ResourceWizard({
  open,
  onOpenChange,
  onSuccess,
}: ResourceWizardProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wizardData] = useState<Partial<WizardData>>({
    mode: "individual",
  });

  const handleSuccess = (params?: {
    categoryId: string;
    templateId: string;
    templateName: string;
    templateIcon?: string;
  }) => {
    onSuccess?.(params);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <>
      {/* Mobile: Bottom Sheet */}
      <BottomSheet
        open={open}
        onClose={handleCancel}
        title="Nuevo Recurso"
        maxHeight="90vh"
      >
        <WizardStep1
          data={wizardData}
          onNext={handleSuccess}
          onCancel={handleCancel}
          isMobile={true}
        />
      </BottomSheet>

      {/* Desktop: Dialog */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton={false}
          className={cn(
            "p-0 gap-0 overflow-hidden bg-transparent border-none shadow-none transition-all duration-300 hidden lg:block",
            isFullscreen
              ? "max-w-none w-screen h-screen rounded-none"
              : "sm:max-w-[1020px] w-[95vw] h-[85vh] rounded-none",
          )}
        >
          <DialogTitle className="sr-only">
            Configurar Subcategorías
          </DialogTitle>
          <WizardStep1
            data={wizardData}
            onNext={handleSuccess}
            onCancel={handleCancel}
            isFullscreen={isFullscreen}
            onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
            isMobile={false}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
