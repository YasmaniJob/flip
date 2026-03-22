/**
 * Script para importar datos reales del padrón de instituciones educativas del MINEDU
 * 
 * Uso:
 *   pnpm run import:minedu
 *   pnpm run import:minedu -- --nivel=primaria
 *   pnpm run import:minedu -- --solo-activas
 *   pnpm run import:minedu -- --limpiar
 * 
 * Requisitos:
 *   - Archivo Excel/CSV del MINEDU en: data/ies_curadas.csv
 */

import * as XLSX from 'xlsx';
import { db } from '../src/lib/db';
import { educationInstitutionsMinedu } from '../src/lib/db/schema';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

// Configuración
const CONFIG = {
  dataFile: path.join(__dirname, '../../data/ies_curadas.csv'), // Archivo en la raíz del proyecto
  batchSize: 1000, // Insertar en lotes de 1000
  logFile: path.join(__dirname, '../data/import-log.txt'),
};

// Argumentos de línea de comandos
const args = process.argv.slice(2);
const options = {
  nivel: args.find(a => a.startsWith('--nivel='))?.split('=')[1]?.toLowerCase(),
  soloActivas: args.includes('--solo-activas'),
  limpiar: args.includes('--limpiar'),
  actualizar: args.includes('--actualizar'),
  eliminarObsoletas: args.includes('--eliminar-obsoletas'),
};

interface MinedRow {
  cod_mod?: string;
  codigo_modular?: string;
  anexo?: string;
  nombre_ie?: string;
  nombre?: string;
  nivel?: string;
  nivel_modalidad?: string;
  gestion?: string;
  tipo_gestion?: string;
  departamento?: string;
  dpto?: string;
  provincia?: string;
  prov?: string;
  distrito?: string;
  dist?: string;
  direccion?: string;
  dir?: string;
  estado?: string;
  [key: string]: any;
}

interface InstitutionData {
  codigoModular: string;
  nombre: string;
  nivel: string;
  tipoGestion: string | null;
  departamento: string | null;
  provincia: string | null;
  distrito: string | null;
  direccion: string | null;
  estado: string;
}

// Función para normalizar texto
function normalizeText(text: string | undefined | null): string | null {
  if (!text) return null;
  return text
    .toString()
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
}

// Función para extraer datos de una fila
function extractInstitutionData(row: MinedRow): InstitutionData | null {
  // Extraer código modular (puede tener diferentes nombres de columna)
  const codigoModular = (
    row.cod_mod ||
    row.codigo_modular ||
    row.CODIGO_MODULAR ||
    row.COD_MOD ||
    ''
  ).toString().trim();

  // Validar código modular (debe ser 7 dígitos)
  if (!/^\d{7}$/.test(codigoModular)) {
    return null;
  }

  // Extraer nombre
  const nombre = normalizeText(
    row.nombre_ie || row.nombre || row.NOMBRE_IE || row.NOMBRE
  );
  if (!nombre) return null;

  // Extraer nivel
  let nivel = normalizeText(
    row.nivel || row.nivel_modalidad || row.NIVEL || row.NIVEL_MODALIDAD
  );
  if (!nivel) return null;

  // Normalizar nivel (solo Primaria o Secundaria)
  if (nivel.includes('PRIMARIA')) {
    nivel = 'Primaria';
  } else if (nivel.includes('SECUNDARIA')) {
    nivel = 'Secundaria';
  } else {
    // Ignorar otros niveles (Inicial, Superior, etc.)
    return null;
  }

  // Filtrar por nivel si se especificó
  if (options.nivel) {
    if (options.nivel === 'primaria' && nivel !== 'Primaria') return null;
    if (options.nivel === 'secundaria' && nivel !== 'Secundaria') return null;
  }

  // Extraer tipo de gestión
  let tipoGestion = normalizeText(
    row.gestion || row.tipo_gestion || row.GESTION || row.TIPO_GESTION
  );
  if (tipoGestion) {
    if (tipoGestion.includes('PUBLICA') || tipoGestion.includes('PÚBLICA')) {
      tipoGestion = 'Pública';
    } else if (tipoGestion.includes('PRIVADA')) {
      tipoGestion = 'Privada';
    }
  }

  // Extraer ubicación
  const departamento = normalizeText(
    row.departamento || row.dpto || row.DEPARTAMENTO || row.DPTO
  );
  const provincia = normalizeText(
    row.provincia || row.prov || row.PROVINCIA || row.PROV
  );
  const distrito = normalizeText(
    row.distrito || row.dist || row.DISTRITO || row.DIST
  );
  const direccion = normalizeText(
    row.direccion || row.dir || row.DIRECCION || row.DIR
  );

  // Extraer estado
  let estado = normalizeText(row.estado || row.ESTADO) || 'ACTIVO';
  if (estado.includes('ACTIV')) {
    estado = 'Activo';
  } else if (estado.includes('INACTIV')) {
    estado = 'Inactivo';
  }

  // Filtrar solo activas si se especificó
  if (options.soloActivas && estado !== 'Activo') {
    return null;
  }

  return {
    codigoModular,
    nombre,
    nivel,
    tipoGestion,
    departamento,
    provincia,
    distrito,
    direccion,
    estado,
  };
}

// Función para leer archivo Excel/CSV
function readDataFile(): InstitutionData[] {
  console.log(`📖 Leyendo archivo: ${CONFIG.dataFile}`);

  if (!fs.existsSync(CONFIG.dataFile)) {
    throw new Error(
      `❌ Archivo no encontrado: ${CONFIG.dataFile}\n` +
      `   Verifica que el archivo exista en la carpeta data/`
    );
  }

  let rawData: MinedRow[] = [];
  const fileExt = path.extname(CONFIG.dataFile).toLowerCase();

  if (fileExt === '.csv') {
    // Leer archivo CSV
    const fileContent = fs.readFileSync(CONFIG.dataFile, 'utf-8');
    const workbook = XLSX.read(fileContent, { type: 'string' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    rawData = XLSX.utils.sheet_to_json(worksheet);
  } else {
    // Leer archivo Excel
    const workbook = XLSX.readFile(CONFIG.dataFile);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    rawData = XLSX.utils.sheet_to_json(worksheet);
  }

  console.log(`📊 Filas leídas: ${rawData.length}`);

  const institutions: InstitutionData[] = [];
  const errors: string[] = [];

  for (let i = 0; i < rawData.length; i++) {
    try {
      const institution = extractInstitutionData(rawData[i]);
      if (institution) {
        institutions.push(institution);
      }
    } catch (error) {
      errors.push(`Fila ${i + 2}: ${error}`);
    }
  }

  console.log(`✅ Instituciones válidas: ${institutions.length}`);
  if (errors.length > 0) {
    console.log(`⚠️  Errores: ${errors.length}`);
    if (errors.length <= 10) {
      errors.forEach(e => console.log(`   ${e}`));
    }
  }

  return institutions;
}

// Función para insertar en lotes
async function insertBatch(institutions: InstitutionData[]) {
  const total = institutions.length;
  let inserted = 0;
  let updated = 0;
  let errors = 0;

  console.log(`\n📥 Insertando ${total} instituciones en lotes de ${CONFIG.batchSize}...`);

  for (let i = 0; i < total; i += CONFIG.batchSize) {
    const batch = institutions.slice(i, i + CONFIG.batchSize);
    const batchNum = Math.floor(i / CONFIG.batchSize) + 1;
    const totalBatches = Math.ceil(total / CONFIG.batchSize);

    try {
      if (options.actualizar) {
        // Modo actualización: insertar o actualizar
        for (const inst of batch) {
          try {
            await db
              .insert(educationInstitutionsMinedu)
              .values(inst)
              .onConflictDoUpdate({
                target: educationInstitutionsMinedu.codigoModular,
                set: {
                  nombre: inst.nombre,
                  nivel: inst.nivel,
                  tipoGestion: inst.tipoGestion,
                  departamento: inst.departamento,
                  provincia: inst.provincia,
                  distrito: inst.distrito,
                  direccion: inst.direccion,
                  estado: inst.estado,
                },
              });
            updated++;
          } catch (error) {
            errors++;
          }
        }
      } else {
        // Modo inserción normal
        await db.insert(educationInstitutionsMinedu).values(batch);
        inserted += batch.length;
      }

      const progress = Math.round(((i + batch.length) / total) * 100);
      console.log(
        `   Lote ${batchNum}/${totalBatches} - ${progress}% completado`
      );
    } catch (error: any) {
      console.error(`   ❌ Error en lote ${batchNum}:`, error.message);
      errors += batch.length;
    }
  }

  return { inserted, updated, errors };
}

// Función principal
async function main() {
  console.log('🚀 Iniciando importación de datos del MINEDU\n');
  console.log('Opciones:');
  console.log(`  - Nivel: ${options.nivel || 'todos'}`);
  console.log(`  - Solo activas: ${options.soloActivas ? 'sí' : 'no'}`);
  console.log(`  - Limpiar tabla: ${options.limpiar ? 'sí' : 'no'}`);
  console.log(`  - Modo actualización: ${options.actualizar ? 'sí' : 'no'}`);
  console.log('');

  try {
    // Limpiar tabla si se especificó
    if (options.limpiar) {
      console.log('🗑️  Limpiando tabla...');
      await db.delete(educationInstitutionsMinedu);
      console.log('✅ Tabla limpiada\n');
    }

    // Leer datos del archivo
    const institutions = readDataFile();

    if (institutions.length === 0) {
      console.log('⚠️  No hay instituciones para importar');
      process.exit(0);
    }

    // Insertar datos
    const { inserted, updated, errors } = await insertBatch(institutions);

    // Resumen
    console.log('\n📊 Resumen de importación:');
    console.log(`   Total procesadas: ${institutions.length}`);
    if (options.actualizar) {
      console.log(`   Actualizadas: ${updated}`);
    } else {
      console.log(`   Insertadas: ${inserted}`);
    }
    if (errors > 0) {
      console.log(`   Errores: ${errors}`);
    }

    // Estadísticas finales
    console.log('\n📈 Estadísticas de la base de datos:');
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(educationInstitutionsMinedu);
    console.log(`   Total de instituciones: ${totalResult.count}`);

    const byNivel = await db
      .select({
        nivel: educationInstitutionsMinedu.nivel,
        count: sql<number>`count(*)`,
      })
      .from(educationInstitutionsMinedu)
      .groupBy(educationInstitutionsMinedu.nivel);

    console.log('   Por nivel:');
    byNivel.forEach(({ nivel, count }) => {
      console.log(`     - ${nivel}: ${count}`);
    });

    console.log('\n✅ Importación completada exitosamente');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error en importación:', error.message);
    process.exit(1);
  }
}

main();
