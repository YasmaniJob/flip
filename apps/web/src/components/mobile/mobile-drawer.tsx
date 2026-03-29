"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Package,
  HandCoins,
  Calendar,
  Users as UsersIcon,
  Settings,
  X,
  Users,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const menuItems = [
    { href: "/dashboard", icon: Home, label: "Dashboard" },
    { href: "/inventario", icon: Package, label: "Inventario" },
    { href: "/loans", icon: HandCoins, label: "Préstamos" },
    { href: "/reservaciones", icon: Calendar, label: "Reservas" },
    { href: "/reuniones", icon: Users, label: "Reuniones" },
    { href: "/personal", icon: UsersIcon, label: "Personal" },
    { href: "/settings", icon: Settings, label: "Configuración" },
  ];

  const userInitials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 bg-black/60 z-50 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "lg:hidden fixed top-0 left-0 bottom-0 w-[280px] bg-card z-50 transition-transform duration-300 ease-out shadow-2xl",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-[#185FA5] text-white text-sm font-semibold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">
                {session?.user?.name || "Usuario"}
              </span>
              <span className="text-xs text-muted-foreground">
                {session?.user?.role === "admin" ? "Administrador" : "Docente"}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex flex-col p-2">
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors group",
                  isActive
                    ? "bg-[#185FA5]/10 text-[#185FA5]"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    isActive ? "text-[#185FA5]" : "text-muted-foreground group-hover:text-foreground"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={cn("text-sm font-medium flex-1", isActive && "font-semibold")}>
                  {item.label}
                </span>
                {isActive && (
                  <ChevronRight className="h-4 w-4 text-[#185FA5]" strokeWidth={2.5} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/40">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Flip v{APP_VERSION}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {session?.user?.institution?.name || "Sin institución"}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
