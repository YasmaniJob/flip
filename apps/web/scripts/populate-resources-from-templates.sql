-- Script para crear recursos individuales basados en las plantillas existentes
-- Esto poblará la tabla 'resources' con 3 recursos por cada template

-- PASO 1: Verificar templates existentes
-- SELECT id, name, category_id FROM resource_templates WHERE institution_id = '4ad8cd67-5049-498e-b6c6-2593c84e6aea';

-- PASO 2: Crear recursos individuales (3 por cada template)
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
    stock,
    attributes,
    maintenance_progress,
    maintenance_state,
    created_at
)
SELECT 
    gen_random_uuid() as id,
    '4ad8cd67-5049-498e-b6c6-2593c84e6aea' as institution_id,
    rt.name || ' #' || row_num as name,
    CASE 
        WHEN row_num = 1 THEN 'disponible'
        WHEN row_num = 2 THEN 'disponible'
        WHEN row_num = 3 THEN 'prestado'
        ELSE 'disponible'
    END as status,
    'bueno' as condition,
    NULL as internal_id, -- Se generará automáticamente por el trigger/sequence
    'SN-' || UPPER(SUBSTRING(MD5(RANDOM()::text || rt.id || row_num::text) FROM 1 FOR 10)) as serial_number,
    rt.category_id,
    rt.id as template_id,
    CASE 
        WHEN rt.name ILIKE '%laptop%' OR rt.name ILIKE '%computadora%' THEN 'HP'
        WHEN rt.name ILIKE '%tablet%' THEN 'Samsung'
        WHEN rt.name ILIKE '%chromebook%' THEN 'Acer'
        WHEN rt.name ILIKE '%proyector%' THEN 'Epson'
        WHEN rt.name ILIKE '%televisor%' OR rt.name ILIKE '%tv%' THEN 'LG'
        WHEN rt.name ILIKE '%monitor%' THEN 'Dell'
        WHEN rt.name ILIKE '%mouse%' THEN 'Logitech'
        WHEN rt.name ILIKE '%teclado%' THEN 'Logitech'
        WHEN rt.name ILIKE '%auricular%' THEN 'Sony'
        WHEN rt.name ILIKE '%webcam%' THEN 'Logitech'
        WHEN rt.name ILIKE '%switch%' THEN 'Cisco'
        WHEN rt.name ILIKE '%router%' THEN 'TP-Link'
        WHEN rt.name ILIKE '%access%' OR rt.name ILIKE '%punto%' THEN 'Ubiquiti'
        WHEN rt.name ILIKE '%disco%' THEN 'Seagate'
        WHEN rt.name ILIKE '%usb%' OR rt.name ILIKE '%memoria%' THEN 'Kingston'
        WHEN rt.name ILIKE '%ups%' THEN 'APC'
        WHEN rt.name ILIKE '%regleta%' THEN 'Belkin'
        WHEN rt.name ILIKE '%estabilizador%' THEN 'Forza'
        WHEN rt.name ILIKE '%silla%' THEN 'Steelcase'
        WHEN rt.name ILIKE '%mesa%' THEN 'IKEA'
        WHEN rt.name ILIKE '%estante%' THEN 'IKEA'
        WHEN rt.name ILIKE '%microfono%' OR rt.name ILIKE '%micrófono%' THEN 'Shure'
        WHEN rt.name ILIKE '%parlante%' THEN 'JBL'
        WHEN rt.name ILIKE '%amplificador%' THEN 'Yamaha'
        WHEN rt.name ILIKE '%robot%' THEN 'LEGO'
        WHEN rt.name ILIKE '%impresora%' AND rt.name ILIKE '%3d%' THEN 'Creality'
        WHEN rt.name ILIKE '%drone%' THEN 'DJI'
        WHEN rt.name ILIKE '%herramienta%' THEN 'Stanley'
        WHEN rt.name ILIKE '%limpieza%' THEN 'Genérico'
        ELSE 'Estándar'
    END as brand,
    CASE 
        WHEN rt.name ILIKE '%laptop%' THEN 'ProBook 450 G8'
        WHEN rt.name ILIKE '%tablet%' THEN 'Galaxy Tab A8'
        WHEN rt.name ILIKE '%chromebook%' THEN 'CB314'
        WHEN rt.name ILIKE '%proyector%' THEN 'PowerLite X49'
        WHEN rt.name ILIKE '%televisor%' THEN '43" Smart TV'
        WHEN rt.name ILIKE '%monitor%' THEN 'P2422H 24"'
        WHEN rt.name ILIKE '%mouse%' THEN 'M185 Wireless'
        WHEN rt.name ILIKE '%teclado%' THEN 'K120'
        WHEN rt.name ILIKE '%auricular%' THEN 'WH-CH510'
        WHEN rt.name ILIKE '%webcam%' THEN 'C920 HD'
        WHEN rt.name ILIKE '%switch%' THEN 'SG108-8 Port'
        WHEN rt.name ILIKE '%router%' THEN 'Archer C6'
        WHEN rt.name ILIKE '%access%' THEN 'UAP-AC-LITE'
        WHEN rt.name ILIKE '%disco%' THEN 'Backup Plus 1TB'
        WHEN rt.name ILIKE '%usb%' THEN 'DataTraveler 32GB'
        WHEN rt.name ILIKE '%ups%' THEN 'Back-UPS 600VA'
        WHEN rt.name ILIKE '%regleta%' THEN '6 Outlets'
        WHEN rt.name ILIKE '%estabilizador%' THEN '1000VA'
        WHEN rt.name ILIKE '%impresora%' AND rt.name ILIKE '%3d%' THEN 'Ender 3 V2'
        WHEN rt.name ILIKE '%drone%' THEN 'Mini 2'
        ELSE 'Modelo Estándar'
    END as model,
    'Recurso creado automáticamente desde plantilla' as notes,
    1 as stock,
    '{}' as attributes,
    0 as maintenance_progress,
    NULL as maintenance_state,
    NOW() as created_at
FROM 
    resource_templates rt
    CROSS JOIN generate_series(1, 3) as row_num
WHERE 
    rt.institution_id = '4ad8cd67-5049-498e-b6c6-2593c84e6aea';

-- PASO 3: Verificar los recursos creados
SELECT 
    COUNT(*) as total_resources_created
FROM resources 
WHERE institution_id = '4ad8cd67-5049-498e-b6c6-2593c84e6aea';

-- PASO 4: Ver resumen por template
SELECT 
    rt.name as template_name,
    c.name as category_name,
    COUNT(r.id) as resource_count,
    SUM(CASE WHEN r.status = 'disponible' THEN 1 ELSE 0 END) as disponible,
    SUM(CASE WHEN r.status = 'prestado' THEN 1 ELSE 0 END) as prestado,
    SUM(CASE WHEN r.status = 'mantenimiento' THEN 1 ELSE 0 END) as mantenimiento,
    SUM(CASE WHEN r.status = 'baja' THEN 1 ELSE 0 END) as baja
FROM resource_templates rt
LEFT JOIN categories c ON c.id = rt.category_id
LEFT JOIN resources r ON r.template_id = rt.id
WHERE rt.institution_id = '4ad8cd67-5049-498e-b6c6-2593c84e6aea'
GROUP BY rt.id, rt.name, c.name
ORDER BY c.name, rt.name;
