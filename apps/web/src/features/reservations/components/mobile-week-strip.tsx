"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface MobileWeekStripProps {
  currentWeekStart: Date;
  onNavigate: (direction: 'prev' | 'next') => void;
  weekDates: Date[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const WEEKDAYS_SHORT = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];

export function MobileWeekStrip({ 
  currentWeekStart, 
  onNavigate, 
  weekDates,
  selectedDate,
  onDateSelect
}: MobileWeekStripProps) {
  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 5);

  const todayDateString = new Date().toDateString();

  return (
    <div className="px-4 pb-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => onNavigate('prev')}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        
        <span className="text-sm font-semibold text-foreground">
          {format(currentWeekStart, "d MMM", { locale: es })} - {format(weekEnd, "d MMM yyyy", { locale: es })}
        </span>
        
        <button
          onClick={() => onNavigate('next')}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Days Grid */}
      <div className="flex rounded-xl overflow-hidden border border-border">
        {weekDates.map((date, index) => {
          const isActive = date.toDateString() === selectedDate.toDateString();
          const isToday = date.toDateString() === todayDateString;
          const hasEvents = false; // TODO: Check if date has reservations

          return (
            <button
              key={index}
              onClick={() => onDateSelect(date)}
              className={cn(
                "flex-1 flex flex-col items-center py-2 gap-1 border-r border-border last:border-r-0 transition-colors",
                isActive ? "bg-primary" : "bg-background hover:bg-muted/50"
              )}
            >
              <span className={cn(
                "text-[9px] uppercase font-medium",
                isActive ? "text-primary-foreground/70" : "text-muted-foreground"
              )}>
                {WEEKDAYS_SHORT[index]}
              </span>
              <span className={cn(
                "text-[15px] font-semibold",
                isActive ? "text-primary-foreground" : isToday ? "text-primary" : "text-foreground"
              )}>
                {date.getDate()}
              </span>
              {hasEvents && !isActive && (
                <div className="w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
