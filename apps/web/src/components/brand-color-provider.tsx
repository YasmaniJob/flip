"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useSession } from "@/lib/auth-client";
import { useMyInstitution } from "@/features/institutions/hooks/use-my-institution";

interface BrandColorContextType {
  brandColor: string;
  setBrandColor: (color: string) => void;
  isLoading: boolean;
  institutionName?: string;
  logoUrl?: string | null;
}

const BrandColorContext = createContext<BrandColorContextType>({
  brandColor: "",
  setBrandColor: () => {},
  isLoading: true,
});

const LOCALSTORAGE_KEY = "flip:last-institution-brand";

export function useBrandColor() {
  return useContext(BrandColorContext);
}

function getStoredBrand() {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(LOCALSTORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function setStoredBrand(data: {
  brandColor?: string;
  institutionName?: string;
  logoUrl?: string | null;
}) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export function BrandColorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const { data: institution, isLoading: isLoadingInstitution } = useMyInstitution();
  const [brandColor, setBrandColorState] = useState<string>("");
  const [institutionName, setInstitutionName] = useState<string>();
  const [logoUrl, setLogoUrl] = useState<string | null>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      const user = session.user as any;
      if (user.institutionId && institution) {
        const color = institution?.brandColor;
        const name = institution?.name;
        const logo = institution?.logo;

        setBrandColorState(color || "");
        setInstitutionName(name);
        setLogoUrl(logo);

        setStoredBrand({
          brandColor: color,
          institutionName: name,
          logoUrl: logo,
        });
        setIsLoading(false);
      } else if (!isLoadingInstitution) {
        setIsLoading(false);
      }
    } else {
      const stored = getStoredBrand();
      if (stored) {
        setBrandColorState(stored.brandColor || "");
        setInstitutionName(stored.institutionName);
        setLogoUrl(stored.logoUrl);
      }
      setIsLoading(false);
    }
  }, [session?.user, institution, isLoadingInstitution]);

  useEffect(() => {
    if (brandColor) {
      document.documentElement.style.setProperty("--primary", brandColor);
      document.documentElement.style.setProperty(
        "--primary-foreground",
        "#ffffff",
      );
      document.documentElement.style.setProperty("--ring", brandColor);
      document.documentElement.style.setProperty(
        "--sidebar-primary",
        brandColor,
      );
      document.documentElement.style.setProperty(
        "--sidebar-primary-foreground",
        "#ffffff",
      );
      document.documentElement.style.setProperty("--chart-1", brandColor);
      document.documentElement.style.setProperty("--brand-color", brandColor);
    } else {
      document.documentElement.style.removeProperty("--primary");
      document.documentElement.style.removeProperty("--primary-foreground");
      document.documentElement.style.removeProperty("--ring");
      document.documentElement.style.removeProperty("--sidebar-primary");
      document.documentElement.style.removeProperty(
        "--sidebar-primary-foreground",
      );
      document.documentElement.style.removeProperty("--chart-1");
      document.documentElement.style.removeProperty("--brand-color");
    }
  }, [brandColor]);

  const setBrandColor = useCallback((color: string) => {
    setBrandColorState(color);

    if (color) {
      document.documentElement.style.setProperty("--primary", color);
      document.documentElement.style.setProperty(
        "--primary-foreground",
        "#ffffff",
      );
      document.documentElement.style.setProperty("--ring", color);
      document.documentElement.style.setProperty("--sidebar-primary", color);
      document.documentElement.style.setProperty(
        "--sidebar-primary-foreground",
        "#ffffff",
      );
      document.documentElement.style.setProperty("--chart-1", color);
      document.documentElement.style.setProperty("--brand-color", color);
    } else {
      document.documentElement.style.removeProperty("--primary");
      document.documentElement.style.removeProperty("--primary-foreground");
      document.documentElement.style.removeProperty("--ring");
      document.documentElement.style.removeProperty("--sidebar-primary");
      document.documentElement.style.removeProperty(
        "--sidebar-primary-foreground",
      );
      document.documentElement.style.removeProperty("--chart-1");
      document.documentElement.style.removeProperty("--brand-color");
    }
  }, []);

  return (
    <BrandColorContext.Provider
      value={{ brandColor, setBrandColor, isLoading, institutionName, logoUrl }}
    >
      {children}
    </BrandColorContext.Provider>
  );
}
