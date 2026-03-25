"use client";

import { cn } from "@/lib/utils";
import { Shift } from "../../../app/(dashboard)/reservaciones/reservaciones-client";

interface MobileShiftSelectorProps {
  selectedShift: Shift;
  onShiftChange: (shift: Shift) => void;
}

export function MobileShiftSelector({ selectedShift, onShiftChange }: MobileShiftSelectorProps) {
  return (
    <div className="lg:hidden px-4 pt-4 pb-3">
      <div className="inline-flex bg-muted/50 rounded-full p-1 gap-1">
        <button
          onClick={() => onShiftChange("mañana")}
          className={cn(
            "px-6 py-2 rounded-full text-sm font-semibold transition-all",
            selectedShift === "mañana"
              ? "bg-[#185FA5] text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Mañana
        </button>
        <button
          onClick={() => onShiftChange("tarde")}
          className={cn(
            "px-6 py-2 rounded-full text-sm font-semibold transition-all",
            selectedShift === "tarde"
              ? "bg-[#185FA5] text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Tarde
        </button>
      </div>
    </div>
  );
}
