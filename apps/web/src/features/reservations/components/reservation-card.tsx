import type { FC, DragEvent } from "react";
import { memo } from "react";
import { cn } from "@/lib/utils";
import { BookOpen, Check, ShieldCheck, Users } from "lucide-react";
import { ReservationSlot } from "../api/reservations.api";
import { ReservationPopover } from "./reservation-popover";

interface ReservationCardProps {
  slot: ReservationSlot;
  isToday: boolean;
  isLive: boolean;
  canDrag: boolean;
  isAdmin: boolean;
  onDragStart: (e: DragEvent, slot: ReservationSlot) => void;
  onDragEnd: () => void;
  onSelectReservation?: (id: string) => void;
  isDraggingSelection?: boolean;
}

export const ReservationCard: FC<ReservationCardProps> = memo(
  ({
    slot,
    isToday,
    isLive,
    canDrag,
    isAdmin,
    onDragStart,
    onDragEnd,
    onSelectReservation,
    isDraggingSelection,
  }) => {
    const isWorkshop = slot.type === "workshop";
    const isInstitutional = !slot.grade && !slot.section;

    const commonClasses = cn(
      "rounded-2xl px-4 py-3 h-full transition-all border border-transparent flex flex-col justify-center min-h-[68px] relative overflow-hidden group/card shadow-none",
      isDraggingSelection && "opacity-20 scale-95",
      canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-default",
    );

    if (isWorkshop) {
      return (
        <div
          draggable={canDrag}
          onDragStart={(e) => onDragStart(e, slot)}
          onDragEnd={onDragEnd}
          onClick={() =>
            isAdmin &&
            slot.reservationMainId &&
            onSelectReservation?.(slot.reservationMainId)
          }
          className={cn(
            commonClasses,
            isLive
              ? "bg-orange-500/10 border-orange-500/30"
              : isToday
                ? "bg-orange-500/[0.04] border-orange-500/10 hover:bg-orange-500/[0.08]"
                : "bg-orange-50/40 border-slate-100 hover:bg-orange-50/60",
          )}
        >
          <div className="flex items-start gap-3">
            <div className="bg-orange-500/10 p-2 rounded-xl shrink-0 group-hover/card:scale-110 transition-transform">
              <Users className="w-4 h-4 text-orange-500" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-foreground truncate leading-tight tracking-tight">
                  {slot.title || "Taller"}
                </span>
                {isLive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse shrink-0" />
                )}
              </div>
              <span className="text-[10px] font-black text-orange-600/60 truncate mt-1 uppercase tracking-widest">
                {slot.staff?.name}
              </span>
            </div>
          </div>
        </div>
      );
    }

    const cardStyles = slot.attended
      ? isLive
        ? "bg-emerald-500/10 border-emerald-500/30"
        : "bg-emerald-50/50 text-emerald-700 border-emerald-100/50 hover:bg-emerald-50"
      : isInstitutional
        ? isLive
          ? "bg-slate-200/80 border-slate-300"
          : "bg-slate-100/40 text-slate-600 border-slate-200 hover:bg-slate-100/60"
        : isLive
          ? "bg-primary/10 border-primary/30"
          : isToday
            ? "bg-primary/[0.04] border-primary/10 hover:bg-primary/[0.08]"
            : "bg-slate-50/30 text-foreground border-slate-100 hover:bg-slate-50/60";

    return (
      <div
        draggable={canDrag}
        onDragStart={(e) => onDragStart(e, slot)}
        onDragEnd={onDragEnd}
        className={cn("h-full", isDraggingSelection && "opacity-40")}
      >
        <ReservationPopover slot={slot}>
          <div className={cn(commonClasses, cardStyles)}>
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "p-2 rounded-xl shrink-0 border border-transparent transition-transform group-hover/card:scale-110",
                  slot.attended
                    ? "bg-emerald-500/10 text-emerald-600"
                    : isInstitutional
                      ? "bg-slate-200/50 text-slate-600"
                      : "bg-primary/10 text-primary transition-all",
                )}
              >
                {slot.attended ? (
                  <Check className="w-4 h-4 font-black" />
                ) : isInstitutional ? (
                  <ShieldCheck className="w-4 h-4" />
                ) : (
                  <BookOpen className="w-4 h-4" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-sm font-black truncate leading-tight tracking-tight",
                      slot.attended ? "text-emerald-900" : "text-foreground",
                    )}
                  >
                    {slot.staff?.name}
                  </span>
                  {isLive && (
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full animate-pulse shrink-0",
                        isInstitutional
                          ? "bg-slate-400"
                          : slot.attended
                            ? "bg-emerald-500"
                            : "bg-primary",
                      )}
                    />
                  )}
                </div>

                {!isInstitutional ? (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] font-black text-muted-foreground/50 truncate uppercase tracking-widest leading-none">
                      {slot.grade?.name} {slot.section?.name}
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] font-black text-muted-foreground/50 truncate mt-1 uppercase tracking-widest leading-none">
                    GESTIÓN
                  </span>
                )}
              </div>
            </div>
          </div>
        </ReservationPopover>
      </div>
    );
  },
);

ReservationCard.displayName = "ReservationCard";
