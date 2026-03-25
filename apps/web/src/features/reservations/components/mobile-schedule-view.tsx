"use client";

import { cn } from "@/lib/utils";
import { ReservationSlot } from "@/features/reservations/api/reservations.api";
import { Check } from "lucide-react";

interface MobileScheduleViewProps {
  pedagogicalHours: any[];
  selectedDate: Date;
  slotMap: Map<string, ReservationSlot>;
  onSlotClick: (slot: ReservationSlot | null, hourId: string) => void;
  selectedSlots: { date: Date; pedagogicalHourId: string }[];
}

export function MobileScheduleView({ 
  pedagogicalHours, 
  selectedDate,
  slotMap,
  onSlotClick,
  selectedSlots
}: MobileScheduleViewProps) {
  const dateKey = selectedDate.toDateString();

  const isSlotSelected = (hourId: string) => {
    return selectedSlots.some(
      s => s.date.toDateString() === dateKey && s.pedagogicalHourId === hourId
    );
  };

  const getBlockColor = (type: string) => {
    switch (type) {
      case 'class':
        return {
          bg: 'rgba(24, 95, 165, 0.08)',
          border: '#185FA5',
          text: 'text-[#185FA5]'
        };
      case 'workshop':
        return {
          bg: 'rgba(34, 197, 94, 0.08)',
          border: '#22c55e',
          text: 'text-emerald-600'
        };
      case 'management':
        return {
          bg: 'rgba(251, 146, 60, 0.08)',
          border: '#fb923c',
          text: 'text-amber-600'
        };
      default:
        return {
          bg: 'rgba(148, 163, 184, 0.08)',
          border: '#94a3b8',
          text: 'text-slate-600'
        };
    }
  };

  return (
    <div className="px-4 space-y-2">
      {pedagogicalHours.map((hour) => {
        const key = `${dateKey}-${hour.id}`;
        const slot = slotMap.get(key);

        if (hour.isBreak) {
          return (
            <div key={hour.id} className="py-3 text-center">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Receso
              </span>
            </div>
          );
        }

        if (slot) {
          const colors = getBlockColor(slot.type);
          
          return (
            <button
              key={hour.id}
              onClick={() => onSlotClick(slot, hour.id)}
              className="w-full flex items-start gap-3 p-3 rounded-lg transition-all active:scale-[0.98]"
              style={{
                background: colors.bg,
                borderLeft: `3px solid ${colors.border}`
              }}
            >
              <div className="flex-1 text-left">
                <p className="text-xs font-semibold text-foreground mb-0.5">
                  {slot.title || hour.name}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {slot.staff?.name || 'Sin asignar'} • {hour.startTime} - {hour.endTime}
                </p>
                {slot.grade && (
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                    {slot.grade.name} {slot.section?.name}
                  </p>
                )}
              </div>
            </button>
          );
        }

        return (
          <button
            key={hour.id}
            onClick={() => onSlotClick(null, hour.id)}
            className={cn(
              "w-full flex items-center justify-between p-3 rounded-lg border transition-colors active:scale-[0.98] relative",
              isSlotSelected(hour.id)
                ? "border-primary bg-primary/10"
                : "border-border/40 bg-background hover:bg-muted/30"
            )}
          >
            <div className="text-left flex-1">
              <p className="text-xs font-medium text-muted-foreground">
                {hour.name}
              </p>
              <p className="text-[11px] text-muted-foreground/60">
                {hour.startTime} - {hour.endTime}
              </p>
            </div>
            {isSlotSelected(hour.id) ? (
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary">
                <Check className="w-4 h-4 text-primary-foreground" />
              </div>
            ) : (
              <span className="text-xs text-muted-foreground/40 font-medium">
                Disponible
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
