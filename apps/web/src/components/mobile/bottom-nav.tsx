"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, Plus, Calendar, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  showCenterButton?: boolean;
  onCenterButtonClick?: () => void;
}

export function BottomNav({ showCenterButton = false, onCenterButtonClick }: BottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", icon: Home, label: "Inicio" },
    { href: "/inventory", icon: Package, label: "Inventario" },
    ...(showCenterButton ? [{ href: "#", icon: Plus, label: "Nuevo", isCenter: true }] : []),
    { href: "/reservations", icon: Calendar, label: "Reservas" },
    { href: "/staff", icon: Users, label: "Personal" },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border/40 safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item, index) => {
          const isActive = pathname.startsWith(item.href) && item.href !== "#";
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <button
                key={item.href}
                onClick={onCenterButtonClick}
                className="flex flex-col items-center justify-center relative -mt-8"
                aria-label={item.label}
              >
                <div className="w-14 h-14 rounded-[14px] bg-[#185FA5] flex items-center justify-center shadow-lg border-[3px] border-background">
                  <Icon className="h-6 w-6 text-white" strokeWidth={2.5} />
                </div>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[64px] h-full transition-colors",
                isActive
                  ? "text-[#185FA5]"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={item.label}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className={cn(
                "text-[10px] font-medium",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
