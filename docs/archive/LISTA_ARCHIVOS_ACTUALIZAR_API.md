# Lista de Archivos a Actualizar: /api/v1/ → /api/

**Fecha**: 2026-03-21  
**Total de archivos**: 15

---

## CATEGORIZACIÓN POR MÓDULO

### 1. MÓDULOS MIGRADOS (Prioridad ALTA - Actualizar YA)

#### 1.1 Loans (Préstamos)
- **Archivo**: `apps/web/src/features/loans/api/loans.api.ts`
- **Rutas a cambiar**:
  - `/api/v1/loans` → `/api/loans`
  - `/api/v1/loans/${id}/approve` → `/api/loans/${id}/approve`
  - `/api/v1/loans/${id}/reject` → `/api/loans/${id}/reject`
- **Líneas**: 36, 51, 64, 76

#### 1.2 Reservations (Reservas de Aulas)
- **Archivo**: `apps/web/src/features/reservations/api/reservations.api.ts`
- **Rutas a cambiar**:
  - `const BASE_URL = '/api/v1/classroom-reservations'` → `const BASE_URL = '/api/classroom-reservations'`
- **Líneas**: 70
- **Nota**: Cambiar solo la constante, todas las rutas usan `BASE_URL`

#### 1.3 Meetings (Reuniones)
- **Archivo**: `apps/web/src/features/meetings/api/meetings.api.ts`
- **Rutas a cambiar**:
  - `/api/v1/meetings` → `/api/meetings`
  - `/api/v1/meetings/${id}` → `/api/meetings/${id}`
  - `/api/v1/meetings/${meetingId}/tasks` → `/api/meetings/${meetingId}/tasks`
  - `/api/v1/meetings/tasks/${taskId}` → `/api/meetings/tasks/${taskId}`
- **Líneas**: 60, 64, 68, 76, 83, 91, 99

#### 1.4 Institutions (Instituciones)
- **Archivos**:
  1. `apps/web/src/app/(onboarding)/onboarding/page.tsx`
     - `/api/v1/institutions/onboard` → `/api/institutions/onboard`
     - **Línea**: 58
  
  2. `apps/web/src/app/(onboarding)/onboarding/components/StepInstitucion.tsx`
     - `/api/v1/institutions/departamentos` → `/api/institutions/departamentos`
     - `/api/v1/institutions/provincias` → `/api/institutions/provincias`
     - `/api/v1/institutions/distritos` → `/api/institutions/distritos`
     - `/api/v1/institutions/search` → `/api/institutions/search`
     - **Líneas**: 44, 54, 65, 84
  
  3. `apps/web/src/lib/use-auth-branding.ts`
     - `/api/v1/institutions/public/branding` → `/api/institutions/public/branding`
     - **Línea**: 21
  
  4. `apps/web/src/components/sidebar.tsx`
     - `/api/v1/institutions/my-institution` → `/api/institutions/my-institution`
     - **Línea**: 460
  
  5. `apps/web/src/components/brand-color-provider.tsx`
     - `/api/v1/institutions/my-institution` → `/api/institutions/my-institution`
     - **Línea**: 68
  
  6. `apps/web/src/app/(dashboard)/settings/areas/page.tsx`
     - `/api/v1/institutions/my-institution` → `/api/institutions/my-institution`
     - **Línea**: 15
  
  7. `apps/web/src/app/(dashboard)/settings/settings-client.tsx`
     - `/api/v1/institutions/my-institution` → `/api/institutions/my-institution`
     - `/api/v1/institutions/my-institution/brand` → `/api/institutions/my-institution/brand`
     - **Líneas**: 67, 83
  
  8. `apps/web/src/app/(dashboard)/settings/grados/page.tsx`
     - `/api/v1/institutions/my-institution` → `/api/institutions/my-institution`
     - **Línea**: 15
  
  9. `apps/web/src/app/(dashboard)/layout.tsx`
     - `/api/v1/institutions/my-institution` → `/api/institutions/my-institution`
     - **Línea**: 40
  
  10. `apps/web/src/app/(dashboard)/dashboard/page.tsx`
      - `/api/v1/institutions/my-institution` → `/api/institutions/my-institution`
      - **Línea**: 28

---

### 2. MÓDULOS NO MIGRADOS (Prioridad BAJA - Dejar como está)

#### 2.1 Dashboard
- **Archivo**: `apps/web/src/features/dashboard/api/dashboard.api.ts`
- **Rutas**:
  - `/api/v1/dashboard/super-stats`
  - `/api/v1/dashboard/institution-stats`
- **Líneas**: 32, 37
- **Acción**: NO CAMBIAR (módulo no migrado aún)

#### 2.2 Users (Configuración de Usuario)
- **Archivo**: `apps/web/src/app/(dashboard)/settings/settings-client.tsx`
- **Rutas**:
  - `/api/v1/users/me/settings`
  - `/api/v1/users/me`
  - `/api/v1/users/me/password`
- **Líneas**: 131, 156, 200, 240
- **Acción**: NO CAMBIAR (módulo no migrado aún)

- **Archivo**: `apps/web/src/hooks/use-academic-defaults.ts`
- **Rutas**:
  - `/api/v1/users/me/settings`
- **Línea**: 19
- **Acción**: NO CAMBIAR (módulo no migrado aún)

#### 2.3 Pedagogical Hours (Horarios Pedagógicos)
- **Archivo**: `apps/web/src/features/settings/hooks/use-pedagogical-hours.ts`
- **Rutas**:
  - `/api/v1/pedagogical-hours`
  - `/api/v1/pedagogical-hours/${id}`
- **Líneas**: 19, 31, 50, 69
- **Acción**: NO CAMBIAR (módulo no migrado aún)

---

## RESUMEN DE CAMBIOS

### Archivos a Modificar (Prioridad ALTA): 14

1. ✅ `apps/web/src/features/loans/api/loans.api.ts`
2. ✅ `apps/web/src/features/reservations/api/reservations.api.ts`
3. ✅ `apps/web/src/features/meetings/api/meetings.api.ts`
4. ✅ `apps/web/src/app/(onboarding)/onboarding/page.tsx`
5. ✅ `apps/web/src/app/(onboarding)/onboarding/components/StepInstitucion.tsx`
6. ✅ `apps/web/src/lib/use-auth-branding.ts`
7. ✅ `apps/web/src/components/sidebar.tsx`
8. ✅ `apps/web/src/components/brand-color-provider.tsx`
9. ✅ `apps/web/src/app/(dashboard)/settings/areas/page.tsx`
10. ✅ `apps/web/src/app/(dashboard)/settings/settings-client.tsx` (solo institutions)
11. ✅ `apps/web/src/app/(dashboard)/settings/grados/page.tsx`
12. ✅ `apps/web/src/app/(dashboard)/layout.tsx`
13. ✅ `apps/web/src/app/(dashboard)/dashboard/page.tsx`

### Archivos a NO Modificar (Prioridad BAJA): 3

1. ❌ `apps/web/src/features/dashboard/api/dashboard.api.ts`
2. ❌ `apps/web/src/app/(dashboard)/settings/settings-client.tsx` (solo users)
3. ❌ `apps/web/src/hooks/use-academic-defaults.ts`
4. ❌ `apps/web/src/features/settings/hooks/use-pedagogical-hours.ts`

---

## ESTRATEGIA DE ACTUALIZACIÓN

### Paso 1: Actualizar API Clients (3 archivos)
Estos son los más críticos porque contienen toda la lógica de llamadas:

```bash
apps/web/src/features/loans/api/loans.api.ts
apps/web/src/features/reservations/api/reservations.api.ts
apps/web/src/features/meetings/api/meetings.api.ts
```

### Paso 2: Actualizar Onboarding (2 archivos)
Crítico para nuevos usuarios:

```bash
apps/web/src/app/(onboarding)/onboarding/page.tsx
apps/web/src/app/(onboarding)/onboarding/components/StepInstitucion.tsx
```

### Paso 3: Actualizar Branding (2 archivos)
Afecta la UI global:

```bash
apps/web/src/lib/use-auth-branding.ts
apps/web/src/components/brand-color-provider.tsx
```

### Paso 4: Actualizar Settings y Dashboard (6 archivos)
Menos crítico pero necesario:

```bash
apps/web/src/components/sidebar.tsx
apps/web/src/app/(dashboard)/settings/areas/page.tsx
apps/web/src/app/(dashboard)/settings/settings-client.tsx
apps/web/src/app/(dashboard)/settings/grados/page.tsx
apps/web/src/app/(dashboard)/layout.tsx
apps/web/src/app/(dashboard)/dashboard/page.tsx
```

---

## PATRÓN DE REEMPLAZO

### Búsqueda y Reemplazo Global (Regex)

```regex
# Buscar
/api/v1/(loans|classroom-reservations|meetings|institutions)

# Reemplazar
/api/$1
```

### Verificación Post-Cambio

```bash
# Verificar que NO queden referencias a módulos migrados
grep -r "/api/v1/loans" apps/web/src/
grep -r "/api/v1/classroom-reservations" apps/web/src/
grep -r "/api/v1/meetings" apps/web/src/
grep -r "/api/v1/institutions" apps/web/src/

# Resultado esperado: 0 matches
```

---

## TESTING CHECKLIST

Después de actualizar, probar:

### Loans
- [ ] Listar préstamos
- [ ] Crear préstamo
- [ ] Aprobar préstamo
- [ ] Rechazar préstamo

### Reservations
- [ ] Ver calendario de reservas
- [ ] Crear reserva
- [ ] Cancelar reserva
- [ ] Marcar asistencia

### Meetings
- [ ] Listar reuniones
- [ ] Crear reunión
- [ ] Eliminar reunión
- [ ] Crear tarea de reunión

### Institutions
- [ ] Onboarding completo
- [ ] Buscar institución MINEDU
- [ ] Ver branding
- [ ] Actualizar branding
- [ ] Ver mi institución

---

## NOTAS IMPORTANTES

1. **NO tocar** archivos de módulos no migrados (dashboard, users, pedagogical-hours)
2. **Verificar** que Better Auth siga funcionando después de los cambios
3. **Probar** en desarrollo antes de hacer commit
4. **Documentar** cualquier problema encontrado
5. **Mantener** el rewrite de `/api/v1/*` en `next.config.ts` como fallback temporal

---

## SIGUIENTE FASE

Una vez completada esta actualización:

1. Testing manual completo
2. Testing en staging
3. Si todo funciona, eliminar:
   - Variable `NEXT_PUBLIC_API_URL` de `.env.local`
   - Rewrite `/api/v1/*` de `next.config.ts` (excepto `/api/auth/*`)
4. Documentar en `MIGRATION_COMPLETE.md`
