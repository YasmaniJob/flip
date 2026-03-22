import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

import * as fs from 'fs';
import { parse } from 'csv-parse/sync';
import { db } from '../database.module';
import { educationInstitutionsMinedu } from '../schema';

async function seedInstitutions() {
    console.log('🏫 Starting institution import...');

    const csvPath = 'E:/Aplicaciones/flip-v2/data/ies_curadas.csv';

    if (!fs.existsSync(csvPath)) {
        console.error('❌ CSV file not found:', csvPath);
        process.exit(1);
    }

    console.log('📄 Reading CSV file...');
    // Remove BOM if present
    let csvContent = fs.readFileSync(csvPath, 'utf-8');
    if (csvContent.charCodeAt(0) === 0xFEFF) {
        csvContent = csvContent.slice(1);
        console.log('📎 Removed BOM character');
    }

    console.log('🔍 Parsing CSV...');
    const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
    }) as Record<string, string>[];

    console.log(`📊 Found ${records.length} records`);

    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await db.delete(educationInstitutionsMinedu);

    // Insert in batches
    const batchSize = 500;
    let inserted = 0;

    for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);

        const values = batch
            .filter(record => record.codigo_modular?.trim())
            .map(record => ({
                codigoModular: record.codigo_modular.trim(),
                nombre: record.nombre?.trim() || 'Sin nombre',
                nivel: record.nivel?.trim() || 'No especificado',
                tipoGestion: record.tipo_gestion?.trim() || null,
                departamento: record.departamento?.trim() || null,
                provincia: record.provincia?.trim() || null,
                distrito: record.distrito?.trim() || null,
                direccion: record.direccion?.trim() || null,
                estado: record.estado?.trim() || 'Activo',
            }));

        if (values.length > 0) {
            await db.insert(educationInstitutionsMinedu).values(values);
            inserted += values.length;
        }

        if (i % 5000 === 0 || i + batchSize >= records.length) {
            console.log(`✅ Inserted ${inserted}/${records.length} (${Math.round(inserted / records.length * 100)}%)`);
        }
    }

    console.log(`🎉 Import complete! Total: ${inserted} institutions`);
    process.exit(0);
}

seedInstitutions().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
