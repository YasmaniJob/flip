"use client";

import { Package, HandCoins, Calendar, Users, LucideIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  type: "loan" | "reservation" | "inventory" | "staff";
  title: string;
  description: string;
  timestamp: Date;
  user?: string;
}

interface ActivityItemProps {
  activity: Activity;
}

function ActivityItem({ activity }: ActivityItemProps) {
  const iconMap: Record<Activity["type"], { icon: LucideIcon; color: string }> = {
    loan: { icon: HandCoins, color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30" },
    reservation: { icon: Calendar, color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30" },
    inventory: { icon: Package, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30" },
    staff: { icon: Users, color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30" },
  };

  const { icon: Icon, color } = iconMap[activity.type];
  const timeAgo = formatDistanceToNow(activity.timestamp, { addSuffix: true, locale: es });

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/40 last:border-0">
      <div className={cn("p-2 rounded-lg shrink-0", color)}>
        <Icon className="h-4 w-4" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground mb-0.5">
          {activity.title}
        </p>
        <p className="text-xs text-muted-foreground mb-1">
          {activity.description}
        </p>
        <p className="text-[10px] text-muted-foreground/60">
          {timeAgo}
        </p>
      </div>
    </div>
  );
}

interface MobileRecentActivityProps {
  activities?: Activity[];
}

export function MobileRecentActivity({ activities = [] }: MobileRecentActivityProps) {
  const displayActivities = activities.slice(0, 5);

  return (
    <div className="lg:hidden px-4 pb-6">
      <h2 className="text-sm font-bold text-foreground mb-3">Actividad reciente</h2>
      <div className="bg-card border border-border/60 rounded-xl p-4">
        {displayActivities.length > 0 ? (
          displayActivities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))
        ) : (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <span className="text-3xl mb-3 opacity-80">🌱</span>
            <p className="text-sm font-bold text-foreground">Aún no hay actividad</p>
            <p className="text-xs font-medium text-muted-foreground mt-1 max-w-[220px]">
              Tu espacio está listo. Aquí aparecerán tus préstamos, reservas o movimientos de inventario.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
