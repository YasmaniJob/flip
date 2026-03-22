"use client";

import Image from "next/image";
import { Building2 } from "lucide-react";

interface InstitutionHeaderProps {
  name: string;
  nivel: string;
  logoUrl?: string | null;
  brandColor: string;
  collapsed?: boolean;
}

export function InstitutionHeader({
  name,
  nivel,
  logoUrl,
  brandColor,
  collapsed = false,
}: InstitutionHeaderProps) {
  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1 py-3">
        {logoUrl ? (
          <div className="h-10 w-10 rounded-lg overflow-hidden bg-white p-1">
            <Image
              src={logoUrl}
              alt={name}
              width={36}
              height={36}
              className="h-full w-full object-contain"
              unoptimized
            />
          </div>
        ) : (
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${brandColor}15` }}
          >
            <Building2 className="h-5 w-5" style={{ color: brandColor }} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-3 py-3">
      {logoUrl ? (
        <div className="h-11 w-11 rounded-lg overflow-hidden bg-white p-1 border border-border/50 shrink-0">
          <Image
            src={logoUrl}
            alt={name}
            width={44}
            height={44}
            className="h-full w-full object-contain"
            unoptimized
          />
        </div>
      ) : (
        <div
          className="h-11 w-11 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${brandColor}15` }}
        >
          <Building2 className="h-6 w-6" style={{ color: brandColor }} />
        </div>
      )}
      <div className="flex-1 min-w-0 overflow-hidden">
        <p
          className="text-sm font-bold text-sidebar-foreground truncate leading-tight"
          title={name}
        >
          {name}
        </p>
        <span
          className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide mt-1"
          style={{
            backgroundColor: `${brandColor}15`,
            color: brandColor,
          }}
        >
          {nivel}
        </span>
      </div>
    </div>
  );
}
