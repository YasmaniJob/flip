-- Script para crear recursos individuales basados en las plantillas existentes
-- Esto poblará la tabla 'resources' con recursos de ejemplo

-- Primero, verificamos las plantillas existentes
-- SELECT id, name, category_id FROM resource_templates WHERE institution_id = '4ad8cd67-5049-498e-b6c6-2593c84e6aea';

-- Crear recursos individuales para cada plantilla
-- Ajusta los IDs de las plantillas según lo que devuelva la consulta anterior

-- Ejemplo: Si tienes una plantilla "Laptop" con ID 'template-laptop-id'
-- Crea 3 laptops individuales:

INSERT INTO resources (
    id,
    institution_id,
    name,
    status,
    condition,
    internal_id,
    serial_number,
    category_id,
    template_id,
    brand,
    model,
    notes,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid() as id,
    '4ad8cd67-5049-498e-b6c6-2593c84e6aea' as institution_id,
    rt.name as name,
    CASE 
        WHEN row_num = 1 THEN 'disponible'
        WHEN row_num = 2 THEN 'disponible'
        WHEN row_num = 3 THEN 'prestado'
        ELSE 'disponible'
    END as status,
    'bueno' as condition,
    'REC-' || LPAD((ROW_NUMBER() OVER ())::text, 4, '0') as internal_id,
    'SN-' || UPPER(SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 8)) as serial_number,
    rt.category_id,
    rt.id as template_id,
    CASE 
        WHEN rt.name ILIKE '%laptop%' THEN 'HP'
        WHEN rt.name ILIKE '%tablet%' THEN 'Samsung'
        WHEN rt.name ILIKE '%proyector%' THEN 'Epson'
        WHEN rt.name ILIKE '%monitor%' THEN 'Dell'
        WHEN rt.name ILIKE '%mouse%' THEN 'Logitech'
        WHEN rt.name ILIKE '%teclado%' THEN 'Logitech'
        WHEN rt.name ILIKE '%router%' THEN 'TP-Link'
        WHEN rt.name ILIKE '%switch%' THEN 'Cisco'
        ELSE 'Genérico'
    END as brand,
    CASE 
        WHEN rt.name ILIKE '%laptop%' THEN 'ProBook 450'
        WHEN rt.name ILIKE '%tablet%' THEN 'Galaxy Tab A8'
        WHEN rt.name ILIKE '%proyector%' THEN 'PowerLite X49'
        WHEN rt.name ILIKE '%monitor%' THEN 'P2422H'
        WHEN rt.name ILIKE '%mouse%' THEN 'M185'
        WHEN rt.name ILIKE '%teclado%' THEN 'K120'
        WHEN rt.name ILIKE '%router%' THEN 'Archer C6'
        WHEN rt.name ILIKE '%switch%' THEN 'SG108'
        ELSE 'Estándar'
    END as model,
    'Recurso creado automáticamente para pruebas' as notes,
    NOW() as created_at,
    NOW() as updated_at
FROM 
    resource_templates rt,
    generate_series(1, 3) as row_num  -- Crea 3 recursos por cada plantilla
WHERE 
    rt.institution_id = '4ad8cd67-5049-498e-b6c6-2593c84e6aea';

-- Verificar los recursos creados
-- SELECT COUNT(*) as total_resources FROM resources WHERE institution_id = '4ad8cd67-5049-498e-b6c6-2593c84e6aea';

-- Ver los recursos agrupados por plantilla
-- SELECT 
--     rt.name as template_name,
--     COUNT(r.id) as resource_count,
--     SUM(CASE WHEN r.status = 'disponible' THEN 1 ELSE 0 END) as disponible,
--     SUM(CASE WHEN r.status = 'prestado' THEN 1 ELSE 0 END) as prestado
-- FROM resource_templates rt
-- LEFT JOIN resources r ON r.template_id = rt.id
-- WHERE rt.institution_id = '4ad8cd67-5049-498e-b6c6-2593c84e6aea'
-- GROUP BY rt.id, rt.name
-- ORDER BY rt.name;
