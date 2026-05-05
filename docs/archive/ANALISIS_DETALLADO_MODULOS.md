# 🔍 Análisis Detallado de Módulos - Backend NestJS

## 📋 Tabla de Contenidos
1. [Guards y Autorización](#guards)
2. [Validaciones](#validaciones)
3. [Lógica de Negocio Compleja](#logica-compleja)
4. [Dependencias entre Módulos](#dependencias)

---

## 🔐 1. GUARDS Y AUTORIZACIÓN {#guards}

### AuthGuard
**Ubicación:** `apps/api/src/auth/auth.guard.ts`
**Función:** Valida sesión con Better Auth
```typescript
// Extrae session de headers
// Valida que session.user existe
// Inyecta user y session en request
// Lanza UnauthorizedException si falla
```

### RolesGuard
**Ubicación:** `apps/api/src/auth/roles.guard.ts`
**Función:** Valida roles usando Reflector
```typescript
// Lee metadata @Roles() del endpoint
// Compara con user.role del request
// Permite acceso si rol coincide
```

### Decoradores Personalizados
- **@Roles(...roles)**: Define roles permitidos
- **@CurrentTenant()**: Extrae institutionId, lanza error si falta
- **@CurrentInstitution()**: Alias de CurrentTenant

**Migración a Next.js:**
- Crear middleware de autenticación
- Usar Better Auth API directamente
- Helpers para validación de roles
- Context para institutionId

---

## ✅ 2. VALIDACIONES {#validaciones}

### Con class-validator (DTOs)
