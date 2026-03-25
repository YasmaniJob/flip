"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface MobileDashboardHeaderProps {
  userName: string;
  institutionName?: string;
}

export function MobileDashboardHeader({ userName, institutionName }: MobileDashboardHeaderProps) {
  const now = new Date();
  const hour = now.getHours();
  
  const greeting = 
    hour < 12 ? "Buenos días" :
    hour < 19 ? "Buenas tardes" :
    "Buenas noches";

  const firstName = userName?.split(" ")[0] || "Usuario";
  const userInitials = userName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <div className="lg:hidden px-4 pt-6 pb-4">
      {/* Greeting */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground mb-1">
            {greeting}, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {format(now, "EEEE, d 'de' MMMM", { locale: es })}
          </p>
        </div>
        <Avatar className="h-12 w-12">
          <AvatarFallback className="bg-[#185FA5] text-white text-sm font-semibold">
            {userInitials}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Institution Badge */}
      {institutionName && (
        <div className="inline-flex items-center gap-2 px-3 py-2 bg-card border border-border/60 rounded-lg">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-foreground truncate max-w-[250px]">
            {institutionName}
          </span>
        </div>
      )}
    </div>
  );
}
