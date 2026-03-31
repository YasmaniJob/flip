-- ============================================
-- Script de Limpieza de Datos de Ejemplo
-- ============================================
-- 
-- PROPÓSITO: Eliminar todos los datos de ejemplo/prueba
-- MANTIENE: Estructura de tablas, índices, constraints
-- PRESERVA: Preguntas y categorías estándar del diagnóstico
--
-- PRECAUCIÓN: Este script eliminará TODOS los datos.
-- Asegúrate de tener un backup antes de ejecutar.
--
-- CÓMO USAR EN NEON:
-- 1. Ve a tu proyecto en Neon Console
-- 2. Abre el SQL Editor
-- 3. Copia y pega este script completo
-- 4. Ejecuta (Run)
--
-- ============================================

BEGIN;

-- Mostrar conteo antes de la limpieza
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'CONTEO DE REGISTROS ANTES DE LA LIMPIEZA';
    RAISE NOTICE '============================================';
    
    SELECT COUNT(*) INTO v_count FROM institutions;
    RAISE NOTICE 'institutions: %', v_count;
    
    SELECT COUNT(*) INTO v_count FROM users;
    RAISE NOTICE 'users: %', v_count;
    
    SELECT COUNT(*) INTO v_count FROM staff;
    RAISE NOTICE 'staff: %', v_count;
    
    SELECT COUNT(*) INTO v_count FROM resources;
    RAISE NOTICE 'resources: %', v_count;
    
    SELECT COUNT(*) INTO v_count FROM loans;
    RAISE NOTICE 'loans: %', v_count;
    
    SELECT COUNT(*) INTO v_count FROM classroom_reservations;
    RAISE NOTICE 'classroom_reservations: %', v_count;
    
    SELECT COUNT(*) INTO v_count FROM diagnostic_sessions;
    RAISE NOTICE 'diagnostic_sessions: %', v_count;
    
    SELECT COUNT(*) INTO v_count FROM diagnostic_responses;
    RAISE NOTICE 'diagnostic_responses: %', v_count;
    
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
END $$;

-- ============================================
-- ELIMINAR DATOS EN ORDEN DE DEPENDENCIAS
-- (De hijos a padres)
-- ============================================

-- 1. DIAGNÓSTICO - Respuestas
DELETE FROM diagnostic_responses;

-- 2. DIAGNÓSTICO - Sesiones
DELETE FROM diagnostic_sessions;

-- 3. DIAGNÓSTICO - Preguntas personalizadas (mantener estándar)
DELETE FROM diagnostic_questions WHERE institution_id IS NOT NULL;

-- 4. DIAGNÓSTICO - Categorías personalizadas (mantener estándar)
DELETE FROM diagnostic_categories WHERE institution_id IS NOT NULL;

-- 5. RESERVACIONES - Tareas y asistencia
DELETE FROM reservation_tasks;
DELETE FROM reservation_attendance;

-- 6. RESERVACIONES - Slots
DELETE FROM reservation_slots;

-- 7. RESERVACIONES - Reservaciones
DELETE FROM classroom_reservations;

-- 8. REUNIONES - Tareas y asistencia
DELETE FROM meeting_tasks;
DELETE FROM meeting_attendance;

-- 9. REUNIONES
DELETE FROM meetings;

-- 10. PRÉSTAMOS - Recursos
DELETE FROM loan_resources;

-- 11. PRÉSTAMOS
DELETE FROM loans;

-- 12. RECURSOS
DELETE FROM resources;
DELETE FROM resource_templates;

-- 13. ESTRUCTURA ACADÉMICA
DELETE FROM sections;
DELETE FROM grades;
DELETE FROM curricular_areas;
DELETE FROM pedagogical_hours;
DELETE FROM classrooms;

-- 14. PERSONAL
DELETE FROM staff;

-- 15. CATEGORÍAS DE INVENTARIO
DELETE FROM categories;
DELETE FROM category_sequences;

-- 16. AUTENTICACIÓN
DELETE FROM verification;
DELETE FROM accounts;
DELETE FROM sessions;
DELETE FROM users;

-- 17. INSTITUCIONES
DELETE FROM subscription_history;
DELETE FROM institutions;

-- ============================================
-- VERIFICAR LIMPIEZA
-- ============================================

DO $$
DECLARE
    v_count INTEGER;
    v_standard_categories INTEGER;
    v_standard_questions INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'CONTEO DE REGISTROS DESPUÉS DE LA LIMPIEZA';
    RAISE NOTICE '============================================';
    
    SELECT COUNT(*) INTO v_count FROM institutions;
    RAISE NOTICE 'institutions: %', v_count;
    
    SELECT COUNT(*) INTO v_count FROM users;
    RAISE NOTICE 'users: %', v_count;
    
    SELECT COUNT(*) INTO v_count FROM staff;
    RAISE NOTICE 'staff: %', v_count;
    
    SELECT COUNT(*) INTO v_count FROM resources;
    RAISE NOTICE 'resources: %', v_count;
    
    SELECT COUNT(*) INTO v_count FROM loans;
    RAISE NOTICE 'loans: %', v_count;
    
    SELECT COUNT(*) INTO v_count FROM classroom_reservations;
    RAISE NOTICE 'classroom_reservations: %', v_count;
    
    SELECT COUNT(*) INTO v_count FROM diagnostic_sessions;
    RAISE NOTICE 'diagnostic_sessions: %', v_count;
    
    SELECT COUNT(*) INTO v_count FROM diagnostic_responses;
    RAISE NOTICE 'diagnostic_responses: %', v_count;
    
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE 'DATOS ESTÁNDAR PRESERVADOS';
    RAISE NOTICE '============================================';
    
    SELECT COUNT(*) INTO v_standard_categories 
    FROM diagnostic_categories 
    WHERE institution_id IS NULL;
    RAISE NOTICE 'Categorías estándar: %', v_standard_categories;
    
    SELECT COUNT(*) INTO v_standard_questions 
    FROM diagnostic_questions 
    WHERE institution_id IS NULL;
    RAISE NOTICE 'Preguntas estándar: %', v_standard_questions;
    
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ LIMPIEZA COMPLETADA EXITOSAMENTE';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'NOTAS:';
    RAISE NOTICE '- La estructura de la base de datos se mantuvo intacta';
    RAISE NOTICE '- Todos los índices y constraints siguen activos';
    RAISE NOTICE '- Las preguntas y categorías estándar se preservaron';
    RAISE NOTICE '- La base de datos está lista para datos de producción';
    RAISE NOTICE '';
END $$;

COMMIT;

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
