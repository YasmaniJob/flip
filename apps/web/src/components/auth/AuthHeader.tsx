import Image from "next/image";
import { GraduationCap } from "lucide-react";
import { getBrandColor } from "@/lib/brand-color";

interface AuthHeaderProps {
  title?: string;
  subtitle?: string;
  logoUrl?: string | null;
  brandColor?: string;
}

export function AuthHeader({
  title = "Flip",
  subtitle = "Sistema de Gestión y Préstamos",
  logoUrl,
  brandColor,
}: AuthHeaderProps) {
  const color = getBrandColor(brandColor);

  return (
    <div className="flex flex-col items-center mb-10 text-center animate-in fade-in slide-in-from-top-4 duration-700">
      <div
        className="h-14 w-14 rounded-lg flex items-center justify-center mb-4 shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-transform hover:scale-105"
        style={{ backgroundColor: color }}
      >
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={title}
            width={48}
            height={48}
            className="h-full w-full object-contain"
            style={{ border: "none" }}
            unoptimized
          />
        ) : (
          <GraduationCap className="h-8 w-8 text-white" strokeWidth={2} />
        )}
      </div>
      <h1 className="text-xl font-bold tracking-tight text-foreground mb-1">
        {logoUrl ? subtitle : title}
      </h1>
      <p className="text-[13px] font-medium text-muted-foreground/80 leading-relaxed max-w-[200px]">
        {subtitle}
      </p>
    </div>
  );
}
