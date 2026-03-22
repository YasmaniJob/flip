# Lista de Roles del Sistema Flip

## Roles Disponibles

El sistema Flip maneja **4 roles** con diferentes niveles de acceso:

### 1. SuperAdmin
- **Valor en BD**: `isSuperAdmin: true` (campo booleano separado)
- **Constante**: `ROLES.SUPERADMIN` = `'superadmin'`
- **Descripción**: Propietario de la plataforma (equipo Flip)
- **Permisos**: Sin restricciones en toda la plataforma
- **Puede crear**: Otros SuperAdmins

### 2. Admin
- **Valor en BD**: `role: 'admin'`
- **Constante**: `ROLES.ADMIN` = `'admin'`
- **Descripción**: Cliente que compró el SaaS (Director de institución)
- **Permisos**: Sin restricciones en su institución
- **Puede crear**: PIP y Docentes
- **NO puede crear**: Admins ni SuperAdmins
### 3. PIP (Promotor de Innovación Pedagógica)
- **Valor en BD**: `role: 'pip'`
- **Constante**: `ROLES.PIP` = `'pip'`
- **Descripción**: Coordinador del Aula de Innovación (antes DAIP)
- **Permisos**: Gestión de inventario, préstamos y reservaciones
- **NO puede**: Gestionar personal ni configuración del sistema

### 4. Docente
- **Valor en BD**: `role: 'docente'`
- **Constante**: `ROLES.DOCENTE` = `'docente'`
- **Descripción**: Profesor regular
- **Permisos**: Solicitar préstamos y crear reservaciones propias
- **NO puede**: Aprobar préstamos ni gestionar inventario

## Cambios Estructurales Realizados

### 1. Paquete Shared (`packages/shared`)
✅ Actualizado `USER_ROLES` en `src/constants/index.ts`:
```typescript
export const USER_ROLES = {
    SUPERADMIN: 'superadmin',
    ADMIN: 'admin',
    PIP: 'pip',           // ← AGREGADO
    DOCENTE: 'docente',
} as const;
```

✅ Actualizado `createStaffSchema` en `src/validators/index.ts`:
```typescript
role: z.enum(['docente', 'pip', 'admin', 'superadmin']).default('docente')
```

### 2. Frontend (`apps/web`)
✅ Actualizado hook `useUserRole()` en `src/hooks/use-user-role.ts`:
```typescript
return {
    role,
    isPending,
    isSuperAdmin: role === ROLES.SUPERADMIN,
    isAdmin: role === ROLES.ADMIN || role === ROLES.SUPERADMIN,
    isPIP: role === ROLES.PIP,        // ← AGREGADO
    isTeacher: role === ROLES.DOCENTE,
    user: session?.user as any,
};
```

✅ Actualizado `add-staff-dialog.tsx`:
- Botón "PIP" visible para todos los usuarios autorizados
- Botón "Superadmin" solo visible para SuperAdmins

✅ Actualizado `import-staff-dialog.tsx`:
- Plantilla de ejemplo incluye rol PIP
- Parser reconoce rol 'pip'

✅ Actualizado `staff-list.tsx`:
- Función `roleLabel()` muestra "PIP" correctamente

### 3. Backend (`apps/api`)
✅ Actualizado `staff.controller.ts`:
- Validación: Solo SuperAdmin puede crear/asignar rol SuperAdmin
- Lanza `ForbiddenException` si Admin intenta crear SuperAdmin

✅ Actualizado `permissions.helper.ts`:
- Método `isPIP()` para verificar rol PIP
- Métodos de permisos usan `isPIP()` en lugar de `isDAIP()`

### 4. Base de Datos
✅ Migración `0010_rename_daip_to_pip.sql` ejecutada:
```sql
UPDATE users SET role = 'pip' WHERE role = 'daip';
UPDATE staff SET role = 'pip' WHERE role = 'daip';
```

## Validaciones Implementadas

### Frontend
- Botones "Admin" y "Superadmin" ocultos para usuarios que no son SuperAdmin
- Selector de roles para Admin muestra solo: Docente, PIP
- Selector de roles para SuperAdmin muestra: Docente, PIP, Admin, Superadmin

### Backend
- Endpoint `POST /staff`: Rechaza creación de Admin/SuperAdmin por no-SuperAdmin
- Endpoint `POST /staff/bulk`: Rechaza importación con Admin/SuperAdmin por no-SuperAdmin
- Endpoint `PATCH /staff/:id`: Rechaza asignación de rol Admin/SuperAdmin por no-SuperAdmin
- Mensaje de error: "Solo el SuperAdmin puede crear usuarios Admin o SuperAdmin"

## Uso en Código

### Frontend
```typescript
import { useUserRole } from '@/hooks/use-user-role';

const { isSuperAdmin, isAdmin, isPIP, isTeacher, role } = useUserRole();

if (isSuperAdmin) {
  // Mostrar todas las opciones
}

if (isAdmin) {
  // Mostrar opciones de administración
}

if (isPIP) {
  // Mostrar gestión de inventario y préstamos
}
```

### Backend
```typescript
import { PermissionsHelper } from '@/common/helpers/permissions.helper';

const user = { userId, role, isSuperAdmin, institutionId };

if (PermissionsHelper.hasFullPermissions(user)) {
  // SuperAdmin o Admin
}

if (PermissionsHelper.isPIP(user)) {
  // PIP
}

if (PermissionsHelper.canManageInventory(user)) {
  // SuperAdmin, Admin o PIP
}
```

## Resumen de Permisos

| Acción | SuperAdmin | Admin | PIP | Docente |
|--------|-----------|-------|-----|---------|
| Crear SuperAdmins | ✅ | ❌ | ❌ | ❌ |
| Crear Admins | ✅ | ❌ | ❌ | ❌ |
| Crear PIP/Docentes | ✅ | ✅ | ❌ | ❌ |
| Configurar sistema | ✅ | ✅ | ❌ | ❌ |
| Gestionar inventario | ✅ | ✅ | ✅ | ❌ |
| Aprobar préstamos | ✅ | ✅ | ✅ | ❌ |
| Gestionar reservaciones | ✅ | ✅ | ✅ | Solo propias |
| Ver reportes | ✅ | ✅ | ✅ | ❌ |

## Archivos Modificados

### Paquete Shared
- `packages/shared/src/constants/index.ts`
- `packages/shared/src/validators/index.ts`
- `packages/shared/dist/*` (compilados)

### Frontend
- `apps/web/src/hooks/use-user-role.ts`
- `apps/web/src/features/staff/components/add-staff-dialog.tsx`
- `apps/web/src/features/staff/components/import-staff-dialog.tsx`
- `apps/web/src/features/staff/components/staff-list.tsx` (ya tenía PIP)

### Backend
- `apps/api/src/modules/staff/staff.controller.ts`
- `apps/api/src/common/helpers/permissions.helper.ts` (ya tenía PIP)

### Base de Datos
- `apps/api/drizzle/0010_rename_daip_to_pip.sql` (ejecutada)

### Documentación
- `docs/ROLES_Y_PERMISOS.md` (ya actualizado)
- `docs/LISTA_ROLES_SISTEMA.md` (este archivo)
