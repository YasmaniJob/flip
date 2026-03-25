"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAYS_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

interface MobileWeekStripProps {
  weekDates: Date[];
  currentWeekStart: Date;
  onNavigate: (direction: "prev" | "next") => void;
}

export function MobileWeekStrip({ weekDates, currentWeekStart, onNavigate }: MobileWeekStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayDateString = new Date().toDateString();

  // Auto-scroll to today on mount
  useEffect(() => {
    const todayIndex = weekDates.findIndex(d => d.toDateString() === todayDateString);
    if (todayIndex !== -1 && scrollRef.current) {
      const dayWidth = 72; // approximate width of each day
      scrollRef.current.scrollLeft = todayIndex * dayWidth - 40;
    }
  }, [weekDates, todayDateString]);

  return (
    <div className="lg:hidden sticky top-0 z-30 bg-card border-b border-border/40">
      {/* Week Navigation */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/20">
        <button
          onClick={() => onNavigate("prev")}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Semana anterior"
        >
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        
        <div className="text-center">
          <p className="text-xs font-semibold text-foreground">
            {currentWeekStart.toLocaleDateString("es-ES", { day: "numeric", month: "short" })} -{" "}
            {weekDates[5]?.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>

        <button
          onClick={() => onNavigate("next")}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          aria-label="Semana siguiente"
        >
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* Days Strip */}
      <div 
        ref={scrollRef}
        className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide"
      >
        {weekDates.map((date, i) => {
          const isToday = date.toDateString() === todayDateString;
          return (
            <div
              key={i}
              className={cn(
                "flex flex-col items-center justify-center min-w-[64px] py-2 px-3 rounded-xl transition-colors",
                isToday
                  ? "bg-[#185FA5] text-white"
                  : "bg-muted/50 text-muted-foreground"
              )}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wide">
                {WEEKDAYS_SHORT[i]}
              </span>
              <span className={cn(
                "text-2xl font-bold mt-1",
                isToday && "text-white"
              )}>
                {date.getDate()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
