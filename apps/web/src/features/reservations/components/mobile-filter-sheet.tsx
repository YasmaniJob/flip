"use client";

import { cn } from "@/lib/utils";
import { X, Check } from "lucide-react";

interface MobileFilterSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  options: Array<{ id: string; name: string }>;
  selectedId: string;
  onSelect: (id: string) => void;
}

export function MobileFilterSheet({
  open,
  onClose,
  title,
  options,
  selectedId,
  onSelect
}: MobileFilterSheetProps) {
  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 bg-black/30 z-[60] transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        className={cn(
          "lg:hidden fixed bottom-0 left-0 right-0 bg-card z-[60] transition-transform duration-300 ease-out shadow-2xl rounded-t-[20px] max-h-[70vh] overflow-y-auto",
          open ? "translate-y-0" : "translate-y-full"
        )}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-9 h-1 rounded-full bg-muted-foreground/20" />
        </div>

        {/* Header */}
        <div className="px-4 pb-3 border-b border-border/40 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Options List */}
        <div className="p-2">
          {options.map((option) => {
            const isSelected = option.id === selectedId;
            
            return (
              <button
                key={option.id}
                onClick={() => {
                  onSelect(option.id);
                  onClose();
                }}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors",
                  isSelected
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted text-foreground"
                )}
              >
                <span className="text-sm font-medium">{option.name}</span>
                {isSelected && <Check className="h-5 w-5" />}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
