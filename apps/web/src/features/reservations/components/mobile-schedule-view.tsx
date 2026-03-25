"use client";

import { cn } from "@/lib/utils";
import { ReservationSlot } from "../api/reservations.api";
import { Clock } from "lucide-react";

interface MobileScheduleViewProps {
  pedagogicalHours: Array<{
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    isBreak?: boolean;
  }>;
  weekDates: Date[];
  slotMap: Map<string, ReservationSlot>;
  onSlotClick: (slot: ReservationSlot | null, date: Date, hourId: string) => void;
}

export function MobileScheduleView({
  pedagogicalHours,
  weekDates,
  slotMap,
  onSlotClick,
}: MobileScheduleViewProps) {
  const todayDateString = new Date().toDateString();

  return (
    <div className="lg:hidden px-4 pb-20">
      {pedagogicalHours.map((hour) => {
        if (hour.isBreak) {
          return (
            <div key={hour.id} className="py-2 text-center">
              <span className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider">
                Receso
              </span>
            </div>
          );
        }

        return (
          <div key={hour.id} className="mb-4">
            {/* Hour Header */}
            <div className="flex items-center gap-2 mb-2 px-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-bold text-foreground uppercase tracking-wide">
                {hour.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {hour.startTime} - {hour.endTime}
              </span>
            </div>

            {/* Days for this hour */}
            <div className="grid grid-cols-3 gap-2">
              {weekDates.map((date, i) => {
                const dateKey = date.toDateString();
                const key = `${dateKey}-${hour.id}`;
                const slot = slotMap.get(key);
                const isToday = dateKey === todayDateString;

                if (slot) {
                  const typeColors = {
                    class: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50 text-blue-900 dark:text-blue-100",
                    workshop: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-900 dark:text-emerald-100",
                  };

                  const colorClass = typeColors[slot.type || "class"] || "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-100";

                  return (
                    <button
                      key={i}
                      onClick={() => onSlotClick(slot, date, hour.id)}
                      className={cn(
                        "p-3 rounded-lg border text-left transition-all min-h-[80px] flex flex-col justify-between",
                        colorClass,
                        isToday && "ring-2 ring-[#185FA5] ring-offset-2"
                      )}
                    >
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide opacity-60 mb-1">
                          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][i]} {date.getDate()}
                        </p>
                        <p className="text-xs font-bold line-clamp-2">
                          {slot.title || slot.purpose || "Reservado"}
                        </p>
                      </div>
                      {slot.staff && (
                        <p className="text-[10px] opacity-70 truncate mt-1">
                          {slot.staff.name}
                        </p>
                      )}
                    </button>
                  );
                }

                return (
                  <button
                    key={i}
                    onClick={() => onSlotClick(null, date, hour.id)}
                    className={cn(
                      "p-3 rounded-lg border border-border/60 bg-card text-left transition-all min-h-[80px] flex flex-col justify-between hover:border-[#185FA5]/30",
                      isToday && "ring-2 ring-[#185FA5]/20 ring-offset-2"
                    )}
                  >
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][i]} {date.getDate()}
                      </p>
                      <p className="text-xs text-muted-foreground/60">
                        Disponible
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
