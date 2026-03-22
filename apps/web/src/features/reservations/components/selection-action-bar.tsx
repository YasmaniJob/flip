import type { FC } from "react";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Check, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectionActionBarProps {
  selectedIds: string[];
  onConfirm: () => void;
  onClear: () => void;
  isPending: boolean;
  isAdmin: boolean;
}

export const SelectionActionBar: FC<SelectionActionBarProps> = memo(
  ({ selectedIds, onConfirm, onClear, isPending, isAdmin }) => {
    if (selectedIds.length === 0 || !isAdmin) return null;

    return (
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8 fade-in duration-500">
        <div className="bg-white/90 backdrop-blur-xl border border-primary/20 px-3 py-2.5 flex items-center gap-4 rounded-[2rem] min-w-[320px]">
          {/* Selection Count Pill */}
          <div className="flex items-center gap-3 pl-3 pr-5 py-2 bg-primary/10 rounded-full border border-primary/10">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-black text-white animate-in zoom-in-50 duration-300">
              {selectedIds.length}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.15em] text-primary leading-none">
                Horas seleccionadas
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pr-1 ml-auto">
            <Button
              size="icon"
              variant="ghost"
              onClick={onClear}
              disabled={isPending}
              className="h-10 w-10 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200"
            >
              <X className="w-4 h-4" />
            </Button>

            <Button
              size="sm"
              onClick={onConfirm}
              disabled={isPending}
              className={cn(
                "h-11 px-8 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden",
                "bg-primary text-white hover:bg-primary/90 border border-primary/20",
                "hover:translate-x-1 active:translate-x-0",
              )}
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Confirmar
            </Button>
          </div>
        </div>
      </div>
    );
  },
);

SelectionActionBar.displayName = "SelectionActionBar";
