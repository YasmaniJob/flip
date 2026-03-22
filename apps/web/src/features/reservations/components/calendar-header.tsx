import type { FC } from "react";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarHeaderProps {
  currentWeekStart: Date;
  weekEnd: Date;
  navigateWeek: (direction: "prev" | "next") => void;
  isCurrentWeek: boolean;
  isFetching: boolean;
}

export const CalendarHeader: FC<CalendarHeaderProps> = memo(
  ({ currentWeekStart, weekEnd, navigateWeek, isCurrentWeek, isFetching }) => {
    return (
      <div
        className={cn(
          "flex items-center justify-between px-6 py-4 border-b border-border shrink-0 bg-muted/10 transition-opacity",
          isFetching && "opacity-50 pointer-events-none",
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateWeek("prev")}
          className="rounded-md h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent shadow-none"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-3">
          <span
            className={cn(
              "text-[11px] font-black uppercase tracking-widest transition-colors",
              isCurrentWeek ? "text-primary" : "text-muted-foreground",
            )}
          >
            {currentWeekStart.toLocaleDateString("es-PE", {
              month: "long",
              day: "numeric",
            })}
            {" - "}
            {weekEnd.toLocaleDateString("es-PE", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          {isCurrentWeek && (
            <span className="text-[9px] font-black uppercase tracking-widest bg-primary text-primary-foreground px-2 py-1 rounded border border-primary/20">
              Esta Semana
            </span>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateWeek("next")}
          className="rounded-md h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent shadow-none"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  },
);

CalendarHeader.displayName = "CalendarHeader";
