"use client";

import { useEffect } from "react";
import { useBrandColor } from "@/components/brand-color-provider";
import { getBrandColor } from "@/lib/brand-color";

interface BrandingData {
  brandColor: string;
  institutionName?: string;
  logoUrl?: string | null;
}

export function useAuthBranding() {
  const { brandColor, institutionName, logoUrl } = useBrandColor();

  const brand = getBrandColor(brandColor);

  useEffect(() => {
    const institutionId = localStorage.getItem("flip:last-institution-id");
    if (institutionId) {
      fetch(`/api/institutions/public/branding?id=${institutionId}`)
        .then((res) => res.json())
        .then((data: BrandingData) => {
          if (data.brandColor) {
            document.documentElement.style.setProperty(
              "--primary",
              data.brandColor,
            );
            document.documentElement.style.setProperty(
              "--brand-color",
              data.brandColor,
            );
          }
        })
        .catch(() => {});
    }
  }, []);

  return {
    brand,
    institutionName,
    logoUrl,
  };
}
