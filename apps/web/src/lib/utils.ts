import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function formatResourceId(internalId?: string | null): string {
  if (!internalId) return '';
  // Extract numeric part and pad to 2 digits (e.g. COM-007 -> 07)
  const numericPart = internalId.replace(/\D/g, '');
  if (!numericPart) return internalId;
  return String(parseInt(numericPart, 10)).padStart(2, '0');
}
