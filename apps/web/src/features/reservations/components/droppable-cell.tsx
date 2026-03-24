import type { FC, DragEvent, ReactNode } from "react";
import { memo } from "react";
import { cn } from "@/lib/utils";

interface DroppableCellProps {
  isLast: boolean;
  isToday: boolean;
  isSelected: boolean;
  onClick: () => void;
  onDrop: (e: DragEvent) => void;
  children?: ReactNode;
}

export const DroppableCell: FC<DroppableCellProps> = memo(
  ({ isLast, isToday, isSelected, onClick, onDrop, children }) => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    };

    return (
      <td
        onClick={onClick}
        onDragOver={handleDragOver}
        onDrop={onDrop}
        className={cn(
          "p-2 transition-all relative group h-[82px] select-none",
          !isLast && "border-r border-border/50",
          "border-t border-border/50",
          isToday && "bg-primary/[0.015]",
          isSelected && "bg-primary/[0.04]",
          !isSelected && "hover:bg-muted/20 cursor-pointer",
        )}
      >
        {isSelected && (
          <div className="absolute inset-x-2 inset-y-2 flex items-center justify-center pointer-events-none p-1 animate-in zoom-in-95 fade-in duration-200">
            <div className="bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl border border-primary/10">
              SELECCIONADO
            </div>
          </div>
        )}

        {/* Visual Hover Indicator (No Box) */}
        {!isSelected && (
          <div className="absolute inset-2 rounded-2xl border-2 border-dashed border-primary/0 opacity-0 group-hover:opacity-10 transition-all pointer-events-none" />
        )}

        {children}
      </td>
    );
  },
);

DroppableCell.displayName = "DroppableCell";
