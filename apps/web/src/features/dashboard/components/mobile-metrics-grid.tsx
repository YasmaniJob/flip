"use client";

import Link from "next/link";
import { Calendar, Package, HandCoins, Users, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  href: string;
  color: "blue" | "green" | "amber" | "purple";
}

function MetricCard({ label, value, icon: Icon, href, color }: MetricCardProps) {
  const colorClasses = {
    blue: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400",
    green: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400",
    purple: "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400",
  };

  return (
    <Link href={href} className="block">
      <div className="bg-card border border-border/60 rounded-xl p-4 hover:border-[#185FA5]/30 transition-colors">
        <div className="flex items-start justify-between mb-3">
          <div className={cn("p-2 rounded-lg", colorClasses[color])}>
            <Icon className="h-5 w-5" strokeWidth={2} />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
        </div>
      </div>
    </Link>
  );
}

interface MobileMetricsGridProps {
  stats?: {
    weekReservations?: number;
    totalResources?: number;
    activeLoans?: number;
    totalStaff?: number;
  };
}

export function MobileMetricsGrid({ stats }: MobileMetricsGridProps) {
  return (
    <div className="lg:hidden px-4 pb-4">
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Reservas semana"
          value={stats?.weekReservations ?? "—"}
          icon={Calendar}
          href="/reservations"
          color="blue"
        />
        <MetricCard
          label="Equipos inventario"
          value={stats?.totalResources ?? "—"}
          icon={Package}
          href="/inventory"
          color="green"
        />
        <MetricCard
          label="Préstamos activos"
          value={stats?.activeLoans ?? "—"}
          icon={HandCoins}
          href="/loans"
          color="amber"
        />
        <MetricCard
          label="Docentes staff"
          value={stats?.totalStaff ?? "—"}
          icon={Users}
          href="/staff"
          color="purple"
        />
      </div>
    </div>
  );
}
