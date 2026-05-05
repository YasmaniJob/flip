/**
 * Default categories seeded for all new institutions
 * 
 * These categories are automatically created when a new institution
 * is registered during the onboarding process.
 * 
 * @constant
 */
export const DEFAULT_CATEGORIES = [
  { name: 'Equipos de Cómputo y CRT', icon: '💻', color: '#0052CC' },
  { name: 'Multimedia y Audiovisuales', icon: '📺', color: '#0065FF' },
  { name: 'Periféricos y Accesorios', icon: '🖱️', color: '#2684FF' },
  { name: 'Cables, Conectores y Energía', icon: '🔌', color: '#4C9AFF' },
  { name: 'Redes y Conectividad', icon: '📡', color: '#00B8D9' },
  { name: 'Kits Educativos y Robótica', icon: '🤖', color: '#36B37E' },
  { name: 'Mobiliario Escolar', icon: '🪑', color: '#BF2600' },
] as const;

export type DefaultCategory = typeof DEFAULT_CATEGORIES[number];
