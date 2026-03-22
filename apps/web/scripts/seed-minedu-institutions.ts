/**
 * Script para poblar la tabla education_institutions_minedu con datos de ejemplo
 * Basado en instituciones educativas reales del Perú
 */

import { db } from '../src/lib/db';
import { educationInstitutionsMinedu } from '../src/lib/db/schema';

const sampleInstitutions = [
  // LIMA
  { codigoModular: '0234567', nombre: 'I.E. 1024 Julio C. Tello', nivel: 'Primaria', tipoGestion: 'Pública', departamento: 'Lima', provincia: 'Lima', distrito: 'La Victoria', direccion: 'Av. Iquitos 1234', estado: 'Activo' },
  { codigoModular: '0234568', nombre: 'I.E. 1025 María Parado de Bellido', nivel: 'Primaria', tipoGestion: 'Pública', departamento: 'Lima', provincia: 'Lima', distrito: 'Rímac', direccion: 'Jr. Trujillo 567', estado: 'Activo' },
  { codigoModular: '0234569', nombre: 'I.E. Alfonso Ugarte', nivel: 'Secundaria', tipoGestion: 'Pública', departamento: 'Lima', provincia: 'Lima', distrito: 'San Isidro', direccion: 'Av. Arequipa 2345', estado: 'Activo' },
  { codigoModular: '0234570', nombre: 'I.E. Melitón Carvajal', nivel: 'Secundaria', tipoGestion: 'Pública', departamento: 'Lima', provincia: 'Lima', distrito: 'Lince', direccion: 'Av. Petit Thouars 890', estado: 'Activo' },
  { codigoModular: '0234571', nombre: 'Colegio San Agustín', nivel: 'Secundaria', tipoGestion: 'Privada', departamento: 'Lima', provincia: 'Lima', distrito: 'San Isidro', direccion: 'Av. Javier Prado 1234', estado: 'Activo' },
  { codigoModular: '0234572', nombre: 'I.E. 1026 Juana Alarco de Dammert', nivel: 'Primaria', tipoGestion: 'Pública', departamento: 'Lima', provincia: 'Lima', distrito: 'Miraflores', direccion: 'Av. Larco 456', estado: 'Activo' },
  { codigoModular: '0234573', nombre: 'I.E. Ricardo Palma', nivel: 'Secundaria', tipoGestion: 'Pública', departamento: 'Lima', provincia: 'Lima', distrito: 'Surquillo', direccion: 'Av. Angamos 789', estado: 'Activo' },
  { codigoModular: '0234574', nombre: 'I.E. 1027 José Olaya Balandra', nivel: 'Primaria', tipoGestion: 'Pública', departamento: 'Lima', provincia: 'Callao', distrito: 'Callao', direccion: 'Av. Colonial 234', estado: 'Activo' },
  { codigoModular: '0234575', nombre: 'I.E. Nuestra Señora de Guadalupe', nivel: 'Secundaria', tipoGestion: 'Pública', departamento: 'Lima', provincia: 'Lima', distrito: 'Cercado de Lima', direccion: 'Jr. Huancavelica 456', estado: 'Activo' },
  { codigoModular: '0234576', nombre: 'I.E. 1028 San Martín de Porres', nivel: 'Primaria', tipoGestion: 'Pública', departamento: 'Lima', provincia: 'Lima', distrito: 'San Martín de Porres', direccion: 'Av. Perú 678', estado: 'Activo' },

  // AREQUIPA
  { codigoModular: '0334567', nombre: 'I.E. 40001 Víctor Andrés Belaúnde', nivel: 'Primaria', tipoGestion: 'Pública', departamento: 'Arequipa', provincia: 'Arequipa', distrito: 'Arequipa', direccion: 'Calle Mercaderes 123', estado: 'Activo' },
  { codigoModular: '0334568', nombre: 'I.E. Independencia Americana', nivel: 'Secundaria', tipoGestion: 'Pública', departamento: 'Arequipa', provincia: 'Arequipa', distrito: 'Arequipa', direccion: 'Av. Ejército 456', estado: 'Activo' },
  { codigoModular: '0334569', nombre: 'I.E. 40002 San Juan Bautista', nivel: 'Primaria', tipoGestion: 'Pública', departamento: 'Arequipa', provincia: 'Arequipa', distrito: 'Cayma', direccion: 'Calle Bolognesi 789', estado: 'Activo' },
  { codigoModular: '0334570', nombre: 'Colegio San José', nivel: 'Secundaria', tipoGestion: 'Privada', departamento: 'Arequipa', provincia: 'Arequipa', distrito: 'Yanahuara', direccion: 'Av. Lima 234', estado: 'Activo' },
  { codigoModular: '0334571', nombre: 'I.E. 40003 Mariano Melgar', nivel: 'Primaria', tipoGestion: 'Pública', departamento: 'Arequipa', provincia: 'Camaná', distrito: 'Camaná', direccion: 'Jr. 28 de Julio 567', estado: 'Activo' },

  // CUSCO
  { codigoModular: '0434567', nombre: 'I.E. 50001 Educandas', nivel: 'Primaria', tipoGestion: 'Pública', departamento: 'Cusco', provincia: 'Cusco', distrito: 'Cusco', direccion: 'Av. de la Cultura 123', estado: 'Activo' },
  { codigoModular: '0434568', nombre: 'I.E. Ciencias', nivel: 'Secundaria', tipoGestion: 'Pública', departamento: 'Cusco', provincia: 'Cusco', distrito: 'Cusco', direccion: 'Av. Tullumayo 456', estado: 'Activo' },
  { codigoModular: '0434569', nombre: 'I.E. 50002 Túpac Amaru', nivel: 'Primaria', tipoGestion: 'Pública', departamento: 'Cusco', provincia: 'Cusco', distrito: 'Wanchaq', direccion: 'Av. Huáscar 789', estado: 'Activo' },
  { codigoModular: '0434570', nombre: 'I.E. Inca Garcilaso de la Vega', nivel: 'Secundaria', tipoGestion: 'Pública', departamento: 'Cusco', provincia: 'Cusco', distrito: 'Cusco', direccion: 'Calle Matara 234', estado: 'Activo' },
  { codigoModular: '0434571', nombre: 'I.E. 50003 Humberto Luna', nivel: 'Primaria', tipoGestion: 'Pública', departamento: 'Cusco', provincia: 'Urubamba', distrito: 'Urubamba', direccion: 'Jr. Bolívar 567', estado: 'Activo' },

  // PIURA
  { codigoModular: '0534567', nombre: 'I.E. 14001 Nuestra Señora de Fátima', nivel: 'Primaria', tipoGestion: 'Pública', departamento: 'Piura', provincia: 'Piura', distrito: 'Piura', direccion: 'Av. Grau 123', estado: 'Activo' },
  { codigoModular: '0534568', nombre: 'I.E. San Miguel', nivel: 'Secundaria', tipoGestion: 'Pública', departamento: 'Piura', provincia: 'Piura', distrito: 'Piura', direccion: 'Av. Sánchez Cerro 456', estado: 'Activo' },
  { codigoModular: '0534569', nombre: 'I.E. 14002 Almirante Miguel Grau', nivel: 'Primaria', tipoGestion: 'Pública', departamento: 'Piura', provincia: 'Piura', distrito: 'Castilla', direccion: 'Calle Tacna 789', estado: 'Activo' },
  { codigoModular: '0534570', nombre: 'I.E. San José de Tarbes', nivel: 'Secundaria', tipoGestion: 'Privada', departamento: 'Piura', provincia: 'Piura', distrito: 'Piura', direccion: 'Av. Loreto 234', estado: 'Activo' },
  { codigoModular: '0534571', nombre: 'I.E. 14003 Ignacio Merino', nivel: 'Primaria', tipoGestion: 'Pública', departamento: 'Piura', provincia: 'Sullana', distrito: 'Sullana', direccion: 'Jr. Lima 567', estado: 'Activo' },

  // LA LIBERTAD
  { codigoModular: '0634567', nombre: 'I.E. 80001 Rafael Narváez Cadenillas', nivel: 'Primaria', tipoGestion: 'Pública', departamento: 'La Libertad', provincia: 'Trujillo', distrito: 'Trujillo', direccion: 'Av. España 123', estado: 'Activo' },
  { codigoModular: '0634568', nombre: 'I.E. San Juan', nivel: 'Secundaria', tipoGestion: 'Pública', departamento: 'La Libertad', provincia: 'Trujillo', distrito: 'Trujillo', direccion: 'Jr. Pizarro 456', estado: 'Activo' },
  { codigoModular: '0634569', nombre: 'I.E. 80002 José Faustino Sánchez Carrión', nivel: 'Primaria', tipoGestion: 'Pública', departamento: 'La Libertad', provincia: 'Trujillo', distrito: 'La Esperanza', direccion: 'Av. Industrial 789', estado: 'Activo' },
  { codigoModular: '0634570', nombre: 'Colegio Seminario San Carlos y San Marcelo', nivel: 'Secundaria', tipoGestion: 'Privada', departamento: 'La Libertad', provincia: 'Trujillo', distrito: 'Trujillo', direccion: 'Jr. Independencia 234', estado: 'Activo' },
  { codigoModular: '0634571', nombre: 'I.E. 80003 Víctor Larco Herrera', nivel: 'Primaria', tipoGestion: 'Pública', departamento: 'La Libertad', provincia: 'Trujillo', distrito: 'Víctor Larco', direccion: 'Av. Larco 567', estado: 'Activo' },

  // CAJAMARCA
  { codigoModular: '0734567', nombre: 'I.E. 82001 San Ramón', nivel: 'Primaria', tipoGestion: 'Pública', departamento: 'Cajamarca', provincia: 'Cajamarca', distrito: 'Cajamarca', direccion: 'Jr. Apurímac 123', estado: 'Activo' },
  { codigoModular: '0734568', nombre: 'I.E. Santa Teresita', nivel: 'Secundaria', tipoGestion: 'Privada', departamento: 'Cajamarca', provincia: 'Cajamarca', distrito: 'Cajamarca', direccion: 'Jr. Amazonas 456', estado: 'Activo' },
  { codigoModular: '0734569', nombre: 'I.E. 82002 Juan XXIII', nivel: 'Primaria', tipoGestion: 'Pública', departamento: 'Cajamarca', provincia: 'Cajamarca', distrito: 'Baños del Inca', direccion: 'Av. Perú 789', estado: 'Activo' },
  { codigoModular: '0734570', nombre: 'I.E. San Marcelino Champagnat', nivel: 'Secundaria', tipoGestion: 'Privada', departamento: 'Cajamarca', provincia: 'Cajamarca', distrito: 'Cajamarca', direccion: 'Jr. Junín 234', estado: 'Activo' },

  // PUNO
  { codigoModular: '0834567', nombre: 'I.E. 70001 Huajsapata', nivel: 'Primaria', tipoGestion: 'Pública', departamento: 'Puno', provincia: 'Puno', distrito: 'Puno', direccion: 'Jr. Deustua 123', estado: 'Activo' },
  { codigoModular: '0834568', nombre: 'I.E. San Carlos', nivel: 'Secundaria', tipoGestion: 'Pública', departamento: 'Puno', provincia: 'Puno', distrito: 'Puno', direccion: 'Jr. Arequipa 456', estado: 'Activo' },
  { codigoModular: '0834569', nombre: 'I.E. 70002 María Auxiliadora', nivel: 'Primaria', tipoGestion: 'Pública', departamento: 'Puno', provincia: 'Puno', distrito: 'Puno', direccion: 'Av. El Sol 789', estado: 'Activo' },
  { codigoModular: '0834570', nombre: 'I.E. Glorioso Comercio 32', nivel: 'Secundaria', tipoGestion: 'Pública', departamento: 'Puno', provincia: 'Puno', distrito: 'Puno', direccion: 'Jr. Lima 234', estado: 'Activo' },

  // JUNÍN
  { codigoModular: '0934567', nombre: 'I.E. 30001 San Juan Bosco', nivel: 'Primaria', tipoGestion: 'Pública', departamento: 'Junín', provincia: 'Huancayo', distrito: 'Huancayo', direccion: 'Av. Ferrocarril 123', estado: 'Activo' },
  { codigoModular: '0934568', nombre: 'I.E. Santa Isabel', nivel: 'Secundaria', tipoGestion: 'Pública', departamento: 'Junín', provincia: 'Huancayo', distrito: 'Huancayo', direccion: 'Jr. Real 456', estado: 'Activo' },
  { codigoModular: '0934569', nombre: 'I.E. 30002 Mariscal Castilla', nivel: 'Primaria', tipoGestion: 'Pública', departamento: 'Junín', provincia: 'Huancayo', distrito: 'El Tambo', direccion: 'Av. Huancavelica 789', estado: 'Activo' },
  { codigoModular: '0934570', nombre: 'Colegio Salesiano Santa Rosa', nivel: 'Secundaria', tipoGestion: 'Privada', departamento: 'Junín', provincia: 'Huancayo', distrito: 'Huancayo', direccion: 'Jr. Puno 234', estado: 'Activo' },

  // ICA
  { codigoModular: '1034567', nombre: 'I.E. 22001 San Luis Gonzaga', nivel: 'Primaria', tipoGestion: 'Pública', departamento: 'Ica', provincia: 'Ica', distrito: 'Ica', direccion: 'Av. Grau 123', estado: 'Activo' },
  { codigoModular: '1034568', nombre: 'I.E. Abraham Valdelomar', nivel: 'Secundaria', tipoGestion: 'Pública', departamento: 'Ica', provincia: 'Ica', distrito: 'Ica', direccion: 'Av. Municipalidad 456', estado: 'Activo' },
  { codigoModular: '1034569', nombre: 'I.E. 22002 Nuestra Señora de Lourdes', nivel: 'Primaria', tipoGestion: 'Pública', departamento: 'Ica', provincia: 'Chincha', distrito: 'Chincha Alta', direccion: 'Jr. Bolívar 789', estado: 'Activo' },
  { codigoModular: '1034570', nombre: 'I.E. San José', nivel: 'Secundaria', tipoGestion: 'Privada', departamento: 'Ica', provincia: 'Ica', distrito: 'Ica', direccion: 'Av. Ayabaca 234', estado: 'Activo' },

  // LAMBAYEQUE
  { codigoModular: '1134567', nombre: 'I.E. 10001 San José', nivel: 'Primaria', tipoGestion: 'Pública', departamento: 'Lambayeque', provincia: 'Chiclayo', distrito: 'Chiclayo', direccion: 'Av. Balta 123', estado: 'Activo' },
  { codigoModular: '1134568', nombre: 'I.E. San José', nivel: 'Secundaria', tipoGestion: 'Pública', departamento: 'Lambayeque', provincia: 'Chiclayo', distrito: 'Chiclayo', direccion: 'Jr. Elías Aguirre 456', estado: 'Activo' },
  { codigoModular: '1134569', nombre: 'I.E. 10002 Pedro Ruiz Gallo', nivel: 'Primaria', tipoGestion: 'Pública', departamento: 'Lambayeque', provincia: 'Chiclayo', distrito: 'José Leonardo Ortiz', direccion: 'Av. Bolognesi 789', estado: 'Activo' },
  { codigoModular: '1134570', nombre: 'Colegio San Agustín', nivel: 'Secundaria', tipoGestion: 'Privada', departamento: 'Lambayeque', provincia: 'Chiclayo', distrito: 'Chiclayo', direccion: 'Av. Luis Gonzales 234', estado: 'Activo' },
];

async function seed() {
  try {
    console.log('🌱 Iniciando seed de instituciones MINEDU...');

    // Insertar instituciones
    await db.insert(educationInstitutionsMinedu).values(sampleInstitutions);

    console.log(`✅ Se insertaron ${sampleInstitutions.length} instituciones educativas`);
    console.log('✅ Seed completado exitosamente');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
}

seed();
