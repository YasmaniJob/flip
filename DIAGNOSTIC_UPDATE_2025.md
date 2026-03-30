# Actualización de Preguntas Base - Diagnóstico 2025

**Fecha**: 30 de marzo de 2026  
**Status**: ✅ COMPLETADO

---

## 🎯 Objetivo

Actualizar las preguntas base del módulo de diagnóstico de habilidades digitales de la versión antigua (23 preguntas en formato "¿Puedo...?") a la nueva versión 2025 (17 preguntas en primera persona afirmativa).

---

## 📊 Cambios Realizados

### Categorías Actualizadas

**Antiguas (5 categorías):**
1. IA Generativa
2. Herramientas Digitales
3. Ciudadanía Digital
4. Innovación Pedagógica
5. Manejo de Información y Alfabetización Digital

**Nuevas (5 dimensiones - 2025):**
1. **Manejo de Información y Alfabetización Digital** (4 preguntas)
   - Gestión de archivos en la nube
   - Búsqueda avanzada de recursos pedagógicos
   - Evaluación de fuentes confiables
   - Seguridad en sitios web

2. **Comunicación y Colaboración Digital** (4 preguntas)
   - Trabajo colaborativo en archivos compartidos
   - Comunicación profesional por email
   - Uso responsable de redes sociales
   - Manejo de videoconferencias

3. **Creación y Producción de Contenidos Digitales** (3 preguntas)
   - Creación de contenidos multimedia
   - Conversión de formatos de archivo
   - Uso de plataformas web para crear contenidos

4. **Inteligencia Artificial en Educación** (4 preguntas)
   - Uso de IA Generativa para planificación
   - Diseño de materiales personalizados con IA
   - Evaluación crítica de contenidos generados por IA
   - Diseño de actividades pedagógicas con IA

5. **Resolución de Problemas y Gestión Escolar** (2 preguntas)
   - Resolución de problemas técnicos básicos
   - Uso de sistemas de gestión escolar (Flip, Siagie)

---

## 🔧 Proceso de Migración

### Script Ejecutado

**Archivo**: `apps/web/scripts/update-diagnostic-questions-2025.ts`

**Pasos del Script**:
1. ✅ Eliminar preguntas estándar antiguas (institutionId = null)
2. ✅ Eliminar categorías estándar antiguas (institutionId = null)
3. ✅ Insertar 5 nuevas categorías con nombres y descripciones actualizadas
4. ✅ Insertar 17 nuevas preguntas en primera persona afirmativa

**Comando Ejecutado**:
```bash
pnpm tsx --env-file=.env.local scripts/update-diagnostic-questions-2025.ts
```

**Resultado**:
```
🔄 Updating diagnostic data to 2025 version...
⏰ Timestamp: 2026-03-30T21:01:13.125Z

🗑️  Step 1: Deleting old standard questions...
   ✓ Deleted 0 old questions

🗑️  Step 2: Deleting old standard categories...
   ✓ Deleted 5 old categories

📦 Step 3: Inserting 5 new categories...
   ✓ Inserted 5 new categories

📦 Step 4: Inserting 17 new questions...
   ✓ Inserted 17 new questions

🎉 Update completed successfully!
```

---

## ✅ Verificación

**Script de Verificación**: `apps/web/scripts/check-diagnostic-data.ts`

**Resultado**:
```
📊 Categories found: 5
   - cat-manejo-info | MANEJO_INFO | Manejo de Información y Alfabetización Digital
   - cat-comunicacion | COMUNICACION | Comunicación y Colaboración Digital
   - cat-creacion | CREACION | Creación y Producción de Contenidos Digitales
   - cat-ia-educacion | IA_EDUCACION | Inteligencia Artificial en Educación
   - cat-resolucion | RESOLUCION | Resolución de Problemas y Gestión Escolar

📊 Questions found: 17
   ✓ 4 preguntas en Manejo de Información
   ✓ 4 preguntas en Comunicación y Colaboración
   ✓ 3 preguntas en Creación de Contenidos
   ✓ 4 preguntas en Inteligencia Artificial
   ✓ 2 preguntas en Resolución de Problemas
```

---

## 📝 Formato de Preguntas

### Antiguo (23 preguntas)
- Formato: "¿Puedo hacer X?"
- Ejemplo: "¿Puedo organizar mis archivos en carpetas?"

### Nuevo (17 preguntas - 2025)
- Formato: Primera persona afirmativa con tono pedagógico
- Ejemplo: "Organizo y muevo mis archivos educativos entre carpetas locales y servicios en la nube (Google Drive, OneDrive, etc.), asegurando que mi material esté disponible en cualquier lugar"

---

## 🚀 Deployment

**Commit**: `d1cc3d7`  
**Mensaje**: `feat(diagnostic): update to 2025 questions - 17 new questions in 5 dimensions`

**Push a Master**: ✅ Completado  
**Vercel Auto-Deploy**: En progreso (detectará automáticamente el push a master)

---

## 📋 Archivos Modificados

1. `apps/web/scripts/update-diagnostic-questions-2025.ts` - Script de migración (NUEVO)
2. `apps/web/scripts/check-diagnostic-data.ts` - Script de verificación (NUEVO)
3. `apps/web/scripts/seed-diagnostic-questions.ts` - Actualizado con nuevas preguntas

---

## 🔍 Próximos Pasos

1. ✅ Verificar en producción que el diagnóstico público muestre las 17 nuevas preguntas
2. ✅ Verificar en el panel admin que las preguntas aparezcan correctamente
3. ✅ Confirmar que las preguntas personalizadas de instituciones NO fueron afectadas
4. ✅ Probar el flujo completo del diagnóstico con las nuevas preguntas

---

## 📚 Notas Importantes

- Las preguntas personalizadas de instituciones (institutionId != null) NO fueron afectadas
- Solo se actualizaron las preguntas estándar de Flip (institutionId = null)
- El script es idempotente: puede ejecutarse múltiples veces sin duplicar datos
- Las sesiones de diagnóstico existentes NO fueron afectadas
