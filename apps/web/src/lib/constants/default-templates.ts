/**
 * Default resource templates seeded for each category
 * 
 * These templates are automatically created when a new institution
 * is registered during the onboarding process.
 * 
 * @constant
 */
export const DEFAULT_TEMPLATES: Record<string, { name: string; icon: string }[]> = {
  'Equipos de Cómputo y CRT': [
    { name: 'Laptop', icon: '💻' },
    { name: 'Tableta MINEDU', icon: '📱' },
    { name: 'Computadora de Escritorio', icon: '🖥️' },
    { name: 'Servidor Escolar', icon: '🗄️' },
  ],
  'Multimedia y Audiovisuales': [
    { name: 'Proyector Multimedia', icon: '📽️' },
    { name: 'Ecran / Pantalla', icon: '🖼️' },
    { name: 'Pizarra Interactiva', icon: '📟' },
    { name: 'Televisor / Smart TV', icon: '📺' },
    { name: 'Equipo de Sonido', icon: '🔊' },
    { name: 'Micrófono / Megáfono', icon: '🎤' },
  ],
  'Periféricos y Accesorios': [
    { name: 'Teclado', icon: '⌨️' },
    { name: 'Mouse', icon: '🖱️' },
    { name: 'Audífonos con Micrófono', icon: '🎧' },
    { name: 'Cámara Web', icon: '📷' },
    { name: 'Disco Duro Externo', icon: '💾' },
    { name: 'Memoria USB', icon: '🔌' },
  ],
  'Cables, Conectores y Energía': [
    { name: 'Extensión Eléctrica', icon: '🔌' },
    { name: 'Cable de Poder', icon: '⚡' },
    { name: 'Cable de Red (RJ45)', icon: '🌐' },
    { name: 'Cable de Video (HDMI/VGA)', icon: '🖥️' },
    { name: 'Estabilizador', icon: '⚡' },
    { name: 'UPS', icon: '🔋' },
  ],
  'Redes y Conectividad': [
    { name: 'Router / Módem', icon: '📡' },
    { name: 'Switch', icon: '🔀' },
    { name: 'Access Point', icon: '📶' },
    { name: 'Gabinete / Rack', icon: '🗄️' },
  ],
  'Kits Educativos y Robótica': [
    { name: 'Kit de Robótica', icon: '🤖' },
    { name: 'Material Base 10', icon: '🧊' },
    { name: 'Kit de Ciencias', icon: '🔬' },
    { name: 'Globo Terráqueo', icon: '🌍' },
  ],
  'Mobiliario Escolar': [
    { name: 'Carpeta Unipersonal', icon: '🪑' },
    { name: 'Silla', icon: '🪑' },
    { name: 'Escritorio', icon: '🪞' },
    { name: 'Estante / Armario', icon: '🗄️' },
    { name: 'Pizarra Acrílica', icon: '📝' },
  ],
};
