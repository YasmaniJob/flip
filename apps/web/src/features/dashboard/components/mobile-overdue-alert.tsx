"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";

interface MobileOverdueAlertProps {
  count: number;
}

export function MobileOverdueAlert({ count }: MobileOverdueAlertProps) {
  if (count === 0) return null;

  return (
    <div className="lg:hidden px-4 pb-4">
      <Link href="/loans?filter=overdue">
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 flex items-start gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg shrink-0">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-amber-900 dark:text-amber-100 mb-1">
              Préstamos que vencen hoy
            </h3>
            <p className="text-xs text-amber-800 dark:text-amber-200">
              {count} {count === 1 ? "préstamo vence" : "préstamos vencen"} hoy. Toca para ver detalles.
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}
