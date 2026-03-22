/**
 * Default categories seeded for all new institutions
 * 
 * These categories are automatically created when a new institution
 * is registered during the onboarding process.
 * 
 * @constant
 */
export const DEFAULT_CATEGORIES = [
    { name: 'Equipos Portátiles', icon: '💻', color: '#0052CC' },
    { name: 'Componentes PC', icon: '🖥️', color: '#0747A6' },
    { name: 'Displays y Multimedia', icon: '📺', color: '#0065FF' },
    { name: 'Cables y Conectores', icon: '🔌', color: '#4C9AFF' },
    { name: 'Periféricos', icon: '🎧', color: '#2684FF' },
    { name: 'Red e Infraestructura', icon: '📡', color: '#00B8D9' },
    { name: 'Almacenamiento', icon: '💾', color: '#36B37E' },
    { name: 'Protección Eléctrica', icon: '🔋', color: '#FFAB00' },
    { name: 'Mobiliario', icon: '🪑', color: '#BF2600' },
    { name: 'Software y Licencias', icon: '💿', color: '#6554C0' },
    { name: 'Streaming y Producción', icon: '🎬', color: '#FF5630' },
    { name: 'Kits Educativos', icon: '🤖', color: '#36B37E' },
    { name: 'Presentación', icon: '📍', color: '#00875A' },
    { name: 'Seguridad Física', icon: '🔒', color: '#FF8B00' },
    { name: 'Mantenimiento', icon: '🧰', color: '#505F79' },
] as const;

export type DefaultCategory = typeof DEFAULT_CATEGORIES[number];
