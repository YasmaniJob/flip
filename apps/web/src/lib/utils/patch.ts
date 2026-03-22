/**
 * Construye un objeto de patch para updates parciales.
 * 
 * REGLA CRÍTICA:
 * - Excluye campos undefined (no se envían al DB)
 * - Permite null explícitamente (null ES un valor válido)
 * 
 * Ejemplo:
 * buildPartialUpdate({ name: 'Laptop', maintenanceState: null, brand: undefined })
 * → { name: 'Laptop', maintenanceState: null }
 * 
 * Esto permite que maintenanceState: null limpie el campo en la DB.
 */
export function buildPartialUpdate<T extends Record<string, unknown>>(
  data: T
): Partial<T> {
  return Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  ) as Partial<T>;
}
