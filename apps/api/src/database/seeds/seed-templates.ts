import { db } from '../index';
import { resourceTemplates, categories } from '../schema';
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';

/**
 * Seed common resource templates for each category
 * Run with: pnpm tsx apps/api/src/database/seeds/seed-templates.ts
 */

const TEMPLATES_BY_CATEGORY = {
    'Equipos Portátiles': [
        { name: 'Laptop', icon: '💻', defaultBrand: 'HP', defaultModel: 'ProBook' },
        { name: 'Chromebook', icon: '🌐', defaultBrand: 'Lenovo', defaultModel: '' },
        { name: 'Tablet', icon: '📱', defaultBrand: 'Samsung', defaultModel: 'Galaxy Tab' },
        { name: 'iPad', icon: '🍎', defaultBrand: 'Apple', defaultModel: '' },
        { name: 'MacBook', icon: '💻', defaultBrand: 'Apple', defaultModel: '' },
    ],
    'Componentes PC': [
        { name: 'Monitor', icon: '🖥️', defaultBrand: 'LG', defaultModel: '' },
        { name: 'Teclado', icon: '⌨️', defaultBrand: 'Logitech', defaultModel: '' },
        { name: 'Mouse', icon: '🖱️', defaultBrand: 'Logitech', defaultModel: '' },
        { name: 'CPU/Torre', icon: '🏢', defaultBrand: 'Dell', defaultModel: '' },
        { name: 'Placa Madre', icon: '🔧', defaultBrand: 'ASUS', defaultModel: '' },
        { name: 'RAM', icon: '💾', defaultBrand: 'Kingston', defaultModel: '' },
        { name: 'Disco Duro', icon: '💿', defaultBrand: 'Seagate', defaultModel: '' },
    ],
    'Displays y Multimedia': [
        { name: 'Televisor', icon: '📺', defaultBrand: 'LG', defaultModel: '' },
        { name: 'Proyector', icon: '📽️', defaultBrand: 'Epson', defaultModel: '' },
        { name: 'Pantalla Interactiva', icon: '🖥️', defaultBrand: 'Samsung', defaultModel: '' },
        { name: 'Parlantes', icon: '🔊', defaultBrand: 'Logitech', defaultModel: '' },
    ],
    'Cables y Conectores': [
        { name: 'Cable HDMI', icon: '🔌', defaultBrand: '', defaultModel: '' },
        { name: 'Cable VGA', icon: '🔌', defaultBrand: '', defaultModel: '' },
        { name: 'Cable USB', icon: '🔌', defaultBrand: '', defaultModel: '' },
        { name: 'Cable Red (Ethernet)', icon: '🔌', defaultBrand: '', defaultModel: '' },
        { name: 'Adaptador', icon: '🔌', defaultBrand: '', defaultModel: '' },
        { name: 'Extensión Eléctrica', icon: '🔌', defaultBrand: '', defaultModel: '' },
    ],
    'Periféricos': [
        { name: 'Audífonos', icon: '🎧', defaultBrand: 'Logitech', defaultModel: '' },
        { name: 'Micrófono', icon: '🎤', defaultBrand: 'Blue', defaultModel: 'Yeti' },
        { name: 'Webcam', icon: '📷', defaultBrand: 'Logitech', defaultModel: 'C920' },
        { name: 'Impresora', icon: '🖨️', defaultBrand: 'HP', defaultModel: '' },
        { name: 'Escáner', icon: '📠', defaultBrand: 'Canon', defaultModel: '' },
        { name: 'Trackpad', icon: '🖱️', defaultBrand: 'Apple', defaultModel: '' },
    ],
    'Red e Infraestructura': [
        { name: 'Router', icon: '📡', defaultBrand: 'TP-Link', defaultModel: '' },
        { name: 'Switch', icon: '🔀', defaultBrand: 'TP-Link', defaultModel: '' },
        { name: 'Access Point', icon: '📶', defaultBrand: 'Ubiquiti', defaultModel: '' },
        { name: 'Módem', icon: '📡', defaultBrand: 'Huawei', defaultModel: '' },
        { name: 'Rack', icon: '🗄️', defaultBrand: '', defaultModel: '' },
    ],
    'Almacenamiento': [
        { name: 'Disco Duro Externo', icon: '💾', defaultBrand: 'Seagate', defaultModel: '' },
        { name: 'SSD Externo', icon: '💾', defaultBrand: 'Samsung', defaultModel: '' },
        { name: 'USB Flash Drive', icon: '🔑', defaultBrand: 'SanDisk', defaultModel: '' },
        { name: 'Tarjeta SD', icon: '💳', defaultBrand: 'SanDisk', defaultModel: '' },
        { name: 'NAS', icon: '🗄️', defaultBrand: 'Synology', defaultModel: '' },
    ],
    'Protección Eléctrica': [
        { name: 'UPS', icon: '🔋', defaultBrand: 'APC', defaultModel: '' },
        { name: 'Regulador de Voltaje', icon: '⚡', defaultBrand: 'Forza', defaultModel: '' },
        { name: 'Supresor de Picos', icon: '🔋', defaultBrand: 'Belkin', defaultModel: '' },
        { name: 'Estabilizador', icon: '⚡', defaultBrand: 'CDP', defaultModel: '' },
    ],
    'Mobiliario': [
        { name: 'Silla', icon: '🪑', defaultBrand: '', defaultModel: '' },
        { name: 'Mesa', icon: '🪑', defaultBrand: '', defaultModel: '' },
        { name: 'Escritorio', icon: '🪑', defaultBrand: '', defaultModel: '' },
        { name: 'Estante', icon: '📚', defaultBrand: '', defaultModel: '' },
        { name: 'Pizarra', icon: '📋', defaultBrand: '', defaultModel: '' },
        { name: 'Archivador', icon: '🗄️', defaultBrand: '', defaultModel: '' },
    ],
    'Software y Licencias': [
        { name: 'Microsoft Office', icon: '💿', defaultBrand: 'Microsoft', defaultModel: '' },
        { name: 'Windows', icon: '🪟', defaultBrand: 'Microsoft', defaultModel: '' },
        { name: 'Antivirus', icon: '🛡️', defaultBrand: 'Kaspersky', defaultModel: '' },
        { name: 'Adobe Creative Suite', icon: '🎨', defaultBrand: 'Adobe', defaultModel: '' },
        { name: 'AutoCAD', icon: '📐', defaultBrand: 'Autodesk', defaultModel: '' },
    ],
    'Streaming y Producción': [
        { name: 'Cámara de Video', icon: '📹', defaultBrand: 'Sony', defaultModel: '' },
        { name: 'Trípode', icon: '📷', defaultBrand: 'Manfrotto', defaultModel: '' },
        { name: 'Luces LED', icon: '💡', defaultBrand: 'Neewer', defaultModel: '' },
        { name: 'Micrófono de Solapa', icon: '🎙️', defaultBrand: 'Rode', defaultModel: '' },
        { name: 'Green Screen', icon: '🎬', defaultBrand: '', defaultModel: '' },
    ],
    'Kits Educativos': [
        { name: 'Arduino Kit', icon: '🤖', defaultBrand: 'Arduino', defaultModel: 'Uno' },
        { name: 'Raspberry Pi', icon: '🍓', defaultBrand: 'Raspberry', defaultModel: 'Pi 4' },
        { name: 'Lego Mindstorms', icon: '🧱', defaultBrand: 'LEGO', defaultModel: '' },
        { name: 'Kit de Robótica', icon: '🤖', defaultBrand: '', defaultModel: '' },
        { name: 'Kit de Electrónica', icon: '⚡', defaultBrand: '', defaultModel: '' },
    ],
    'Presentación': [
        { name: 'Puntero Láser', icon: '📍', defaultBrand: 'Logitech', defaultModel: '' },
        { name: 'Control Remoto', icon: '🎮', defaultBrand: '', defaultModel: '' },
        { name: 'Atril', icon: '📋', defaultBrand: '', defaultModel: '' },
        { name: 'Micrófono Inalámbrico', icon: '🎤', defaultBrand: 'Shure', defaultModel: '' },
    ],
    'Seguridad Física': [
        { name: 'Cámara de Seguridad', icon: '📹', defaultBrand: 'Hikvision', defaultModel: '' },
        { name: 'Candado Kensington', icon: '🔒', defaultBrand: 'Kensington', defaultModel: '' },
        { name: 'Gabinete con Llave', icon: '🗄️', defaultBrand: '', defaultModel: '' },
        { name: 'Sistema de Alarma', icon: '🚨', defaultBrand: '', defaultModel: '' },
    ],
    'Mantenimiento': [
        { name: 'Kit de Herramientas', icon: '🧰', defaultBrand: '', defaultModel: '' },
        { name: 'Aire Comprimido', icon: '💨', defaultBrand: '', defaultModel: '' },
        { name: 'Limpiador de Pantallas', icon: '🧼', defaultBrand: '', defaultModel: '' },
        { name: 'Pasta Térmica', icon: '🧪', defaultBrand: 'Arctic', defaultModel: '' },
        { name: 'Multímetro', icon: '⚡', defaultBrand: 'Fluke', defaultModel: '' },
    ],
};

async function main() {
    console.log('🌱 Starting resource templates seeding...\n');

    try {
        // Get all institutions
        const institutions = await db.query.institutions.findMany();

        if (institutions.length === 0) {
            console.error('❌ No institutions found.');
            process.exit(1);
        }

        let totalInserted = 0;

        for (const institution of institutions) {
            console.log(`📌 Seeding for institution: ${institution.name}\n`);

            // Get all categories for this institution
            const institutionCategories = await db.query.categories.findMany({
                where: (categories, { eq }) => eq(categories.institutionId, institution.id),
            });

            for (const category of institutionCategories) {
                const templates = TEMPLATES_BY_CATEGORY[category.name as keyof typeof TEMPLATES_BY_CATEGORY];

                if (!templates) {
                    continue; // Skip categories without templates
                }

                console.log(`  📂 ${category.icon} ${category.name}`);

                // Get existing templates
                const existing = await db.query.resourceTemplates.findMany({
                    where: (resourceTemplates, { and, eq }) => and(
                        eq(resourceTemplates.categoryId, category.id),
                        eq(resourceTemplates.institutionId, institution.id),
                    ),
                });

                const existingNames = new Set(existing.map(t => t.name));

                for (const template of templates) {
                    if (existingNames.has(template.name)) {
                        console.log(`     ⊘ ${template.name} - ya existe`);
                        continue;
                    }

                    await db.insert(resourceTemplates).values({
                        id: randomUUID(),
                        institutionId: institution.id,
                        categoryId: category.id,
                        name: template.name,
                        icon: template.icon,
                        defaultBrand: template.defaultBrand || null,
                        defaultModel: template.defaultModel || null,
                        isDefault: true,
                        sortOrder: 0,
                    });

                    console.log(`     ✓ ${template.icon} ${template.name}`);
                    totalInserted++;
                }

                console.log('');
            }
        }

        console.log(`✅ Seed completed!`);
        console.log(`   Total templates insertados: ${totalInserted}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error during seeding:', error);
        process.exit(1);
    }
}

main();
