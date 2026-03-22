export const DEFAULT_BRAND_COLOR = "#0052cc";

export function getBrandColor(color: string | null | undefined): string {
  return color || DEFAULT_BRAND_COLOR;
}
