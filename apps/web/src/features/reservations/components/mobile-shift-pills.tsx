"use client";

import { cn } from "@/lib/utils";

interface MobileShiftPillsProps {
  selectedShift: 'mañana' | 'tarde';
  onShiftChange: (shift: 'mañana' | 'tarde') => void;
}

export function MobileShiftPills({ selectedShift, onShiftChange }: MobileShiftPillsProps) {
  return (
    <div className="flex gap-2 px-4 pb-3">
      <button
        onClick={() => onShiftChange('mañana')}
        className={cn(
          "px-4 py-1.5 rounded-full text-sm font-medium border transition-all",
          selectedShift === 'mañana'
            ? "bg-foreground text-background border-foreground"
            : "border-border text-muted-foreground"
        )}
      >
        Mañana
      </button>
      <button
        onClick={() => onShiftChange('tarde')}
        className={cn(
          "px-4 py-1.5 rounded-full text-sm font-medium border transition-all",
          selectedShift === 'tarde'
            ? "bg-foreground text-background border-foreground"
            : "border-border text-muted-foreground"
        )}
      >
        Tarde
      </button>
    </div>
  );
}
