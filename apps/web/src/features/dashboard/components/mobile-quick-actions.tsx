"use client";

import Link from "next/link";
import { Plus, Search, Calendar, Package, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionProps {
  label: string;
  icon: LucideIcon;
  href: string;
  color: "blue" | "green" | "purple" | "amber";
}

function QuickAction({ label, icon: Icon, href, color }: QuickActionProps) {
  const colorClasses = {
    blue: "bg-blue-500 hover:bg-blue-600",
    green: "bg-emerald-500 hover:bg-emerald-600",
    purple: "bg-purple-500 hover:bg-purple-600",
    amber: "bg-amber-500 hover:bg-amber-600",
  };

  return (
    <Link href={href}>
      <div className="flex flex-col items-center gap-2">
        <div className={cn(
          "h-14 w-14 rounded-2xl flex items-center justify-center text-white transition-colors shadow-sm",
          colorClasses[color]
        )}>
          <Icon className="h-6 w-6" strokeWidth={2} />
        </div>
        <span className="text-xs font-medium text-foreground text-center">
          {label}
        </span>
      </div>
    </Link>
  );
}

export function MobileQuickActions() {
  return (
    <div className="lg:hidden px-4 pb-4">
      <h2 className="text-sm font-bold text-foreground mb-3">Acciones rápidas</h2>
      <div className="grid grid-cols-4 gap-4">
        <QuickAction
          label="Nuevo préstamo"
          icon={Plus}
          href="/loans/new"
          color="blue"
        />
        <QuickAction
          label="Buscar equipo"
          icon={Search}
          href="/inventario"
          color="green"
        />
        <QuickAction
          label="Reservar aula"
          icon={Calendar}
          href="/reservaciones"
          color="purple"
        />
        <QuickAction
          label="Ver inventario"
          icon={Package}
          href="/inventario"
          color="amber"
        />
      </div>
    </div>
  );
}
