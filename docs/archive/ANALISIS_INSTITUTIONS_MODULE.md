# 📋 Análisis Completo: Módulo Institutions

**Fecha:** 21 de marzo de 2026  
**Complejidad:** 🔴 CRÍTICA (Onboarding, Multi-tenancy, Seeding automático)

---

## ⚠️ IMPORTANCIA CRÍTICA

Este módulo es el **más crítico del sistema** porque:
1. Gestiona el **onboarding** de nuevos usuarios e instituciones
2. Establece el **multi-tenancy** (asignación de institutionId)
3. Realiza **seeding automático** de categorías y templates
4. Asigna **roles iniciales** (superadmin/admin)
5. Gestiona la **búsqueda MINEDU** (tabla local con 100k+ registros)
6. Controla **branding** (logo, color) de instituciones

---

## 🎯 Endpoints del Módulo (8 total)

### 1. POST /api/institutions/onboard
**Método:** POST  
**Ruta:** `/institutions/onboard`  
**Roles:** Autenticado (cualquier usuario sin institutionId)  
**Body:**
```typescript
{
  codigoModular: string;      // Código oficial MINEDU o generado manualmente
  nivel: string;              // 'Primaria' | 'Secundaria' | 'Ambos'
  nombre?: string;            // Solo si isManual=true
  departamento?: string;      // Solo si isManual=true
  provincia?: string;         // Solo si isManual=true
  distrito?: string;          // Solo si isManual=true
  isManual?: boolean;         // true = creación manual, false = lookup MINEDU
}
```

**Lógica especial (CRÍTICA):**
1. Buscar institución existente por `codigoModular`
2. Si NO existe:
   - Si `isManual=true`: usar datos del body
   - Si `isManual=false`: buscar en tabla `educationInstitutionsMinedu`
   - Crear institución con trial de 15 días
   - **AUTO-SEED:** Crear 15 categorías default
   - **AUTO-SEED:** Crear templates por categoría (total ~70 templates)
3. Contar usuarios en la institución
4. Asignar rol:
   - Primer usuario en institución → `role='superadmin'`
   - Usuarios subsecuentes → `role='admin'`
5. Asignar `isSuperAdmin=true` solo si:
   - Es el primer usuario del sistema completo, O
   - Ya tenía `isSuperAdmin=true` previamente
6. Actualizar user: `institutionId`, `role`, `isSuperAdmin`

---

### 2. GET /api/institutions/search
**Método:** GET  
**Ruta:** `/institutions/search`  
**Roles:** Público (no requiere auth)  
**Query params:**
```typescript
{
  q?: string;           // Búsqueda por nombre o código
  nivel?: string;       // 'Primaria' | 'Secundaria'
  departamento?: string;
  provincia?: string;
  distrito?: string;
  limit?: string;       // Default 20, max 100
  offset?: string;      // Default 0
}
```

**Lógica especial:**
- Búsqueda en tabla local `educationInstitutionsMinedu`
- Multi-word search: cada palabra debe coincidir con nombre O código
- Filtros acumulativos con `AND`
- Paginación con total count
- Ordenamiento alfabético por nombre

---

### 3. GET /api/institutions/departamentos
**Método:** GET  
**Ruta:** `/institutions/departamentos`  
**Roles:** Público (no requiere auth)  
**Lógica:** Retorna lista única de departamentos desde `educationInstitutionsMinedu`

---

### 4. GET /api/institutions/provincias
**Método:** GET  
**Ruta:** `/institutions/provincias`  
**Roles:** Público (no requiere auth)  
**Query params:**
```typescript
{
  departamento: string; // Requerido
}
```
**Lógica:** Retorna provincias filtradas por departamento

---

### 5. GET /api/institutions/distritos
**Método:** GET  
**Ruta:** `/institutions/distritos`  
**Roles:** Público (no requiere auth)  
**Query params:**
```typescript
{
  departamento: string; // Requerido
  provincia: string;    // Requerido
}
```
**Lógica:** Retorna distritos filtrados por departamento y provincia

---

### 6. GET /api/institutions/my-institution
**Método:** GET  
**Ruta:** `/institutions/my-institution`  
**Roles:** Autenticado (requireAuth)  
**Lógica:** Retorna institución del usuario actual (user.institutionId)

---

### 7. GET /api/institutions/public/branding
**Método:** GET  
**Ruta:** `/institutions/public/branding`  
**Roles:** Público (no requiere auth)  
**Query params:**
```typescript
{
  id: string; // institutionId
}
```
**Lógica:** Retorna branding público (brandColor, name, logoUrl) desde `settings`

---

### 8. POST /api/institutions/my-institution/brand
**Método:** POST  
**Ruta:** `/institutions/my-institution/brand`  
**Roles:** Autenticado (requireAuth)  
**Body:**
```typescript
{
  brandColor?: string;  // Hex color
  logoUrl?: string;     // URL de logo
}
```
**Lógica:** Actualiza branding en `settings` de la institución del usuario

---

## 🔥 Flujo Detallado: onboardUser()

### Paso 1: Buscar Institución Existente
```typescript
const institution = await db.query.institutions.findFirst({
  where: eq(institutions.codigoModular, codigoModular)
});
```

### Paso 2: Si NO existe, crear institución

#### 2A. Determinar datos según modo
**Si isManual=true:**
```typescript
name = data.nombre || "Institución sin nombre";
location = {
  departamento: data.departamento,
  provincia: data.provincia,
  distrito: data.distrito
};
```

**Si isManual=false (lookup MINEDU):**
```typescript
const minedu = await db.query.educationInstitutionsMinedu.findFirst({
  where: eq(educationInstitutionsMinedu.codigoModular, codigoModular)
});

if (!minedu) {
  throw new Error("Institución no encontrada en registro MINEDU");
}

name = minedu.nombre;
location = {
  departamento: minedu.departamento,
  provincia: minedu.provincia,
  distrito: minedu.distrito,
  direccion: minedu.direccion
};
```

#### 2B. Generar slug
```typescript
const slug = name
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/(^-|-$)/g, "")
  + "-" + Math.random().toString(36).substring(2, 7);
```

#### 2C. Calcular trial
```typescript
const trialDays = 15;
const trialEndsAt = new Date();
trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);
```

#### 2D. Insertar institución
```typescript
const [newInst] = await db.insert(institutions).values({
  id: crypto.randomUUID(),
  codigoModular: codigoModular,
  name: name,
  slug: slug,
  nivel: nivel,
  subscriptionStatus: "trial",
  trialEndsAt: trialEndsAt,
  settings: {
    location: location
  }
}).returning();
```

### Paso 3: AUTO-SEED Categorías y Templates

#### 3A. Importar constantes
```typescript
const { DEFAULT_CATEGORIES } = await import("../categories/constants/default-categories.const");
const { DEFAULT_TEMPLATES } = await import("../resource-templates/constants/default-templates.const");
```

#### 3B. Loop de categorías (15 categorías)
```typescript
for (const cat of DEFAULT_CATEGORIES) {
  const newCat = await createCategoryCommand.execute({
    institutionId: institution.id,
    name: cat.name,
    icon: cat.icon,
    color: cat.color
  });

  // 3C. Loop de templates por categoría (~70 templates total)
  const defaultTemplatesForCat = DEFAULT_TEMPLATES[cat.name];
  if (defaultTemplatesForCat) {
    for (const temp of defaultTemplatesForCat) {
      await resourceTemplatesService.create(institution.id, {
        categoryId: newCat.id,
        name: temp.name,
        icon: temp.icon,
        isDefault: true,
        sortOrder: 0
      });
    }
  }
}
```

### Paso 4: Asignar Rol al Usuario

#### 4A. Contar usuarios en institución
```typescript
const userCountResult = await db
  .select({ count: sql<number>`count(*)` })
  .from(users)
  .where(eq(users.institutionId, institution.id));

const isFirstUserInInstitution = Number(userCountResult[0].count) === 0;
```

#### 4B. Contar usuarios totales en sistema
```typescript
const totalUsersResult = await db
  .select({ count: sql<number>`count(*)` })
  .from(users);

const isFirstUserInSystem = Number(totalUsersResult[0].count) === 1;
```

#### 4C. Obtener usuario actual
```typescript
const currentUser = await db.query.users.findFirst({
  where: eq(users.id, userId)
});
```

#### 4D. Determinar rol y superadmin
```typescript
const assignedRole = isFirstUserInInstitution ? "superadmin" : "admin";
const shouldBeSuperAdmin = isFirstUserInSystem || currentUser?.isSuperAdmin === true;
```

#### 4E. Actualizar usuario
```typescript
await db.update(users).set({
  institutionId: institution.id,
  role: assignedRole,
  isSuperAdmin: shouldBeSuperAdmin
}).where(eq(users.id, userId));
```

### Paso 5: Retornar institución
```typescript
return institution;
```

---

## 🗄️ Búsqueda MINEDU: Tabla Local

### ¿Es API externa o datos locales?
**RESPUESTA:** Tabla local en PostgreSQL

### Tabla: `education_institutions_minedu`
```typescript
{
  codigoModular: string (PK);     // Código oficial MINEDU
  nombre: string;                 // Nombre de la institución
  nivel: string;                  // 'Primaria' | 'Secundaria'
  tipoGestion: string;            // 'Pública' | 'Privada'
  departamento: string;
  provincia: string;
  distrito: string;
  direccion: string;
  estado: string;                 // Default 'Activo'
}
```

### Índices
- `idx_ie_minedu_nivel` en `nivel`
- `idx_ie_minedu_departamento` en `departamento`
- `idx_ie_minedu_nombre` en `nombre`

### Seeding
- Archivo: `apps/api/src/database/seeds/seed-institutions.ts`
- Fuente: CSV con datos MINEDU
- Estimado: 100,000+ registros

---

## 📦 Constantes: DEFAULT_CATEGORIES (15 categorías)

```typescript
[
  { name: 'Equipos Portátiles', icon: '💻', color: '#0052CC' },
  { name: 'Componentes PC', icon: '🖥️', color: '#0747A6' },
  { name: 'Displays y Multimedia', icon: '📺', color: '#0065FF' },
  { name: 'Cables y Conectores', icon: '🔌', color: '#4C9AFF' },
  { name: 'Periféricos', icon: '🎧', color: '#2684FF' },
  { name: 'Red e Infraestructura', icon: '📡', color: '#00B8D9' },
  { name: 'Almacenamiento', icon: '💾', color: '#36B37E' },
  { name: 'Protección Eléctrica', icon: '🔋', color: '#FFAB00' },
  { name: 'Mobiliario', icon: '🪑', color: '#BF2600' },
  { name: 'Software y Licencias', icon: '💿', color: '#6554C0' },
  { name: 'Streaming y Producción', icon: '🎬', color: '#FF5630' },
  { name: 'Kits Educativos', icon: '🤖', color: '#36B37E' },
  { name: 'Presentación', icon: '📍', color: '#00875A' },
  { name: 'Seguridad Física', icon: '🔒', color: '#FF8B00' },
  { name: 'Mantenimiento', icon: '🧰', color: '#505F79' },
]
```

---

## 📦 Constantes: DEFAULT_TEMPLATES (~70 templates)

Templates agrupados por categoría. Ejemplos:

**Mantenimiento:** Herramientas, Repuestos, Limpieza, Insumos, Otros  
**Equipos Portátiles:** Laptop, Tablet, Chromebook  
**Componentes PC:** Monitor, Teclado, Mouse, CPU  
**Periféricos:** Audífonos, Micrófono, Cámara Web, Parlantes  
**Cables y Conectores:** HDMI, VGA, USB, Red (RJ45), Alimentación  
**Displays y Multimedia:** Proyector, Televisor, Pizarra Interactiva, Pantalla  
**Red e Infraestructura:** Router, Switch, Access Point, Servidor, Firewall  
**Almacenamiento:** Disco Duro, SSD Externo, Memoria USB, NAS  
**Protección Eléctrica:** UPS, Estabilizador, Regleta Multicontacto  
**Mobiliario:** Escritorio, Silla, Archivador, Mesa, Pizarra  
**Software y Licencias:** Sistema Operativo, Antivirus, Diseño Gráfico, Paquete de Ofimática  
**Streaming y Producción:** Capturadora, Iluminación, Consola de Audio  
**Kits Educativos:** Kit de Robótica, Microscopio, Material de Laboratorio  
**Presentación:** Puntero Láser, Papelógrafo, Atril  
**Seguridad Física:** Cámara de Seguridad, Lector Biométrico, Alarma

---

## 🔑 Puntos Críticos

### 1. Transacción Completa en Onboard
**PROBLEMA:** Onboard crea institución + 15 categorías + ~70 templates  
**SOLUCIÓN:** Usar `db.transaction()` para garantizar atomicidad

### 2. Manejo de Errores en Seeding
**PROBLEMA:** Si falla el seeding, la institución queda sin categorías  
**SOLUCIÓN:** Try-catch en seeding, log error pero NO fallar onboard

### 3. Preservar isSuperAdmin
**PROBLEMA:** No sobrescribir `isSuperAdmin=true` existente  
**SOLUCIÓN:** Leer usuario actual antes de actualizar

### 4. Búsqueda Multi-palabra
**PROBLEMA:** "San Juan" debe buscar ambas palabras  
**SOLUCIÓN:** Split por espacios, cada palabra con `OR` en nombre/código

### 5. Slug Único
**PROBLEMA:** Nombres duplicados generan slugs duplicados  
**SOLUCIÓN:** Agregar sufijo random de 5 caracteres

### 6. Trial de 15 días
**PROBLEMA:** Calcular fecha correctamente  
**SOLUCIÓN:** `new Date()` + `setDate(getDate() + 15)`

### 7. Settings como JSONB
**PROBLEMA:** Actualizar branding sin perder otros settings  
**SOLUCIÓN:** Spread operator: `{ ...currentSettings, brandColor, logoUrl }`

### 8. Endpoints Públicos
**PROBLEMA:** Search, departamentos, provincias, distritos, branding son públicos  
**SOLUCIÓN:** NO usar `requireAuth()` en estos endpoints

---

## 📝 Archivos a Crear

### Constantes (2 archivos)
1. `lib/constants/default-categories.ts` - Copiar desde NestJS
2. `lib/constants/default-templates.ts` - Copiar desde NestJS

### Esquemas Zod (1 archivo)
3. `lib/validations/schemas/institutions.ts`
   - onboardSchema
   - searchQuerySchema
   - updateBrandSchema

### Route Handlers (8 archivos)
4. `app/api/institutions/onboard/route.ts` (POST)
5. `app/api/institutions/search/route.ts` (GET)
6. `app/api/institutions/departamentos/route.ts` (GET)
7. `app/api/institutions/provincias/route.ts` (GET)
8. `app/api/institutions/distritos/route.ts` (GET)
9. `app/api/institutions/my-institution/route.ts` (GET)
10. `app/api/institutions/public/branding/route.ts` (GET)
11. `app/api/institutions/my-institution/brand/route.ts` (POST)

**Total:** 11 archivos

---

## ⚠️ Validaciones Importantes

### Onboard
1. ✅ Usuario NO debe tener `institutionId` ya asignado
2. ✅ Si `isManual=false`, validar que existe en MINEDU
3. ✅ Si `isManual=true`, validar que `nombre` esté presente
4. ✅ Validar que `nivel` sea válido
5. ✅ Garantizar atomicidad con transacción
6. ✅ Log errores de seeding sin fallar onboard

### Search
1. ✅ Limit máximo 100
2. ✅ Offset default 0
3. ✅ Retornar total count para paginación

### Branding
1. ✅ Validar que usuario tenga `institutionId`
2. ✅ Preservar otros campos en `settings`
3. ✅ Permitir null para resetear branding

---

## 🧪 Testing Crítico

### Onboard
1. ✅ Crear institución nueva (MINEDU lookup)
2. ✅ Crear institución nueva (manual)
3. ✅ Unirse a institución existente
4. ✅ Primer usuario → role='superadmin'
5. ✅ Segundo usuario → role='admin'
6. ✅ Verificar seeding de 15 categorías
7. ✅ Verificar seeding de ~70 templates
8. ✅ Verificar trial de 15 días
9. ✅ Preservar isSuperAdmin existente

### Search
1. ✅ Búsqueda por nombre
2. ✅ Búsqueda por código
3. ✅ Búsqueda multi-palabra
4. ✅ Filtros combinados
5. ✅ Paginación

### Branding
1. ✅ Actualizar brandColor
2. ✅ Actualizar logoUrl
3. ✅ Actualizar ambos
4. ✅ Resetear con null
5. ✅ Preservar otros settings

---

## 📚 Referencias

- Controller: `apps/api/src/institutions/institutions.controller.ts`
- Service: `apps/api/src/institutions/institutions.service.ts`
- Constantes: `apps/api/src/categories/constants/default-categories.const.ts`
- Templates: `apps/api/src/resource-templates/constants/default-templates.const.ts`
- Schema: `apps/web/src/lib/db/schema.ts` (educationInstitutionsMinedu, institutions)
- Seeding: `apps/api/src/database/seeds/seed-institutions.ts`

---

## 🚨 ADVERTENCIAS FINALES

1. **NO simplificar el seeding:** Debe crear TODAS las categorías y templates
2. **NO omitir la transacción:** Onboard debe ser atómico
3. **NO fallar onboard si falla seeding:** Log error pero continuar
4. **NO sobrescribir isSuperAdmin:** Preservar valor existente
5. **NO usar requireAuth en endpoints públicos:** Search, departamentos, etc.
6. **NO olvidar el sufijo random en slug:** Evitar duplicados
7. **NO perder settings existentes:** Usar spread operator en branding

