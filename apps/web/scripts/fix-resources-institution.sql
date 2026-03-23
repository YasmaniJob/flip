-- Script para arreglar resources sin institution_id
-- Ejecuta esto en tu base de datos Neon

-- 1. Ver las instituciones disponibles
SELECT id, name FROM institutions LIMIT 5;

-- 2. Ver recursos sin institution_id
SELECT id, name, category_id, institution_id 
FROM resources 
WHERE institution_id IS NULL;

-- 3. Actualizar recursos con el institution_id correcto
-- IMPORTANTE: Reemplaza 'TU_INSTITUTION_ID_AQUI' con el ID real de tu institución del paso 1
UPDATE resources 
SET institution_id = 'TU_INSTITUTION_ID_AQUI'
WHERE institution_id IS NULL;

-- 4. Verificar que se actualizaron correctamente
SELECT id, name, category_id, institution_id 
FROM resources 
LIMIT 10;
