# Roles y Permisos del Sistema Flip

Este documento describe la jerarquía de roles y permisos implementados en el sistema.

## 📋 Jerarquía de Roles

### 1. SuperAdmin (`isSuperAdmin: true`)
**Descripción:** Dueño de la plataforma Flip (equipo de desarrollo/soporte)

**Permisos:**
- ✅ **CERO restricciones** en todo el sistema
- ✅ Acceso a todas las instituciones
- ✅ Puede gestionar cualquier dato de cualquier institución
- ✅ Puede crear/eliminar instituciones
- ✅ Soporte técnico y mantenimiento de la plataforma

**Uso:** Solo para administración de la plataforma y soporte técnico

---

### 2. Admin (`role: 'admin'`)
**Descripción:** Cliente que compró el SaaS (Director/Administrador de la institución educativa)

**Permisos:**
- ✅ **CERO restricciones** en su institución
- ✅ Gestión completa de configuración del sistema:
  - Crear/modificar/eliminar aulas
  - Configurar horarios pedagógicos
  - Gestionar grados y secciones
  - Configurar áreas curriculares
- ✅ Gestión de usuarios:
  - Crear/modificar/eliminar usuarios PIP y Docentes
  - Asignar roles PIP y Docente
- ✅ Gestión de inventario:
  - Crear/modificar/eliminar categorías
  - Gestionar recursos
  - Aprobar/rechazar préstamos
- ✅ Gestión de reservas:
  - Crear/modificar/cancelar cualquier reserva
  - Reprogramar reservas
  - Ver todas las reservas
- ✅ Reportes y estadísticas:
  - Acceso completo a todos los reportes
  - Exportar datos
- ❌ **NO puede:**
  - Crear otros usuarios Admin
  - Crear usuarios SuperAdmin

**Uso:** Administración completa de la institución educativa

---

### 3. PIP - Promotor de Innovación Pedagógica (`role: 'pip'`)
**Descripción:** Coordinador del Aula de Innovación Pedagógica (anteriormente DAIP)

**Permisos:**
- ✅ Gestión de inventario:
  - Ver/crear/modificar recursos
  - Aprobar/rechazar préstamos
  - Registrar devoluciones
  - Reportar daños
- ✅ Gestión de reservas:
  - Ver todas las reservas
  - Cancelar cualquier reserva
  - Reprogramar reservas
  - Marcar asistencia
- ✅ Reportes:
  - Ver reportes de uso del AIP
  - Estadísticas de préstamos
  - Reportes de reservas
- ❌ **NO puede:**
  - Modificar configuración del sistema (aulas, horarios, grados)
  - Crear/eliminar usuarios
  - Modificar configuración institucional

**Uso:** Gestión operativa del Aula de Innovación Pedagógica

---

### 4. Docente (`role: 'docente'`)
**Descripción:** Profesor de la institución educativa

**Permisos:**
- ✅ Reservas:
  - Crear sus propias reservas del AIP
  - Ver sus reservas
  - Cancelar sus propias reservas
  - Reprogramar sus propias reservas
- ✅ Préstamos:
  - Solicitar préstamos de recursos
  - Ver sus préstamos activos
  - Devolver recursos prestados
- ✅ Perfil:
  - Ver/editar su información personal
- ❌ **NO puede:**
  - Ver/modificar reservas de otros docentes
  - Aprobar/rechazar préstamos
  - Gestionar inventario
  - Acceder a configuración del sistema
  - Ver reportes institucionales

**Uso:** Uso básico del sistema para enseñanza

---

## 🔐 Matriz de Permisos

| Funcionalidad | SuperAdmin | Admin | PIP | Docente |
|--------------|------------|-------|-----|---------|
| **Configuración del Sistema** |
| Gestionar aulas | ✅ | ✅ | ❌ | ❌ |
| Gestionar horarios pedagógicos | ✅ | ✅ | ❌ | ❌ |
| Gestionar grados/secciones | ✅ | ✅ | ❌ | ❌ |
| Gestionar áreas curriculares | ✅ | ✅ | ❌ | ❌ |
| **Usuarios** |
| Crear/eliminar usuarios | ✅ | ✅ | ❌ | ❌ |
| Crear usuarios Admin | ✅ | ❌ | ❌ | ❌ |
| Crear usuarios PIP/Docente | ✅ | ✅ | ❌ | ❌ |
| Ver lista de usuarios | ✅ | ✅ | ✅ | ❌ |
| **Inventario** |
| Gestionar categorías | ✅ | ✅ | ✅ | ❌ |
| Gestionar recursos | ✅ | ✅ | ✅ | ❌ |
| Aprobar préstamos | ✅ | ✅ | ✅ | ❌ |
| Solicitar préstamos | ✅ | ✅ | ✅ | ✅ |
| **Reservas** |
| Crear reservas | ✅ | ✅ | ✅ | ✅ |
| Ver todas las reservas | ✅ | ✅ | ✅ | ❌ |
| Cancelar cualquier reserva | ✅ | ✅ | ✅ | ❌ |
| Cancelar propias reservas | ✅ | ✅ | ✅ | ✅ |
| Reprogramar cualquier reserva | ✅ | ✅ | ✅ | ❌ |
| **Reportes** |
| Ver todos los reportes | ✅ | ✅ | ✅ | ❌ |
| Exportar datos | ✅ | ✅ | ✅ | ❌ |

---

## 🔄 Cambios Recientes

### Migración 0010: DAIP → PIP (2024)
- Se renombró el rol de "DAIP" (Docente de Aula de Innovación Pedagógica) a "PIP" (Promotor de Innovación Pedagógica)
- Todos los usuarios con rol `daip` fueron actualizados automáticamente a `pip`
- Los permisos se mantienen idénticos

---

## 💡 Notas de Implementación

### Backend
- Los permisos se validan usando `PermissionsHelper` en `apps/api/src/common/helpers/permissions.helper.ts`
- Cada comando/controlador verifica permisos antes de ejecutar operaciones
- SuperAdmin y Admin tienen acceso completo sin restricciones

### Frontend
- El hook `useUserRole()` proporciona información del rol actual
- Los componentes deben ocultar/deshabilitar funcionalidades según el rol
- Las validaciones del backend son la fuente de verdad (no confiar solo en el frontend)

### Base de Datos
- Campo `role` en tabla `users`: 'admin', 'pip', 'docente'
- Campo `isSuperAdmin` en tabla `users`: boolean
- Campo `role` en tabla `staff`: 'admin', 'pip', 'docente'
