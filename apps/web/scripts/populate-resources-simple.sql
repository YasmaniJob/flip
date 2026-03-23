-- Script simplificado para crear recursos desde templates
-- Ejecuta esto en tu consola de Neon

-- Crear 3 recursos por cada template existente
DO $$
DECLARE
    template_record RECORD;
    i INTEGER;
    new_resource_id TEXT;
    new_serial TEXT;
BEGIN
    FOR template_record IN 
        SELECT id, name, category_id 
        FROM resource_templates 
        WHERE institution_id = '4ad8cd67-5049-498e-b6c6-2593c84e6aea'
    LOOP
        FOR i IN 1..3 LOOP
            new_resource_id := gen_random_uuid()::text;
            new_serial := 'SN-' || UPPER(SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 10));
            
            INSERT INTO resources (
                id,
                institution_id,
                name,
                status,
                condition,
                serial_number,
                category_id,
                template_id,
                brand,
                model,
                notes,
                stock,
                attributes,
                maintenance_progress,
                created_at
            ) VALUES (
                new_resource_id,
                '4ad8cd67-5049-498e-b6c6-2593c84e6aea',
                template_record.name || ' #' || i,
                CASE WHEN i = 3 THEN 'prestado' ELSE 'disponible' END,
                'bueno',
                new_serial,
                template_record.category_id,
                template_record.id,
                'Marca Genérica',
                'Modelo Estándar',
                'Recurso creado automáticamente',
                1,
                '{}',
                0,
                NOW()
            );
        END LOOP;
    END LOOP;
END $$;

-- Verificar
SELECT COUNT(*) as total FROM resources WHERE institution_id = '4ad8cd67-5049-498e-b6c6-2593c84e6aea';
