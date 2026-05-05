# Comandos para Actualización de API Clients

**Fecha**: 2026-03-21  
**Objetivo**: Actualizar referencias de `/api/v1/` a `/api/` en módulos migrados

---

## OPCIÓN 1: Búsqueda y Reemplazo Manual (RECOMENDADO)

### Paso 1: Buscar todas las referencias

```bash
# Buscar en todos los archivos
grep -rn "/api/v1/" apps/web/src/

# Buscar solo en módulos migrados
grep -rn "/api/v1/loans" apps/web/src/
grep -rn "/api/v1/classroom-reservations" apps/web/src/
grep -rn "/api/v1/meetings" apps/web/src/
grep -rn "/api/v1/institutions" apps/web/src/
```

### Paso 2: Reemplazar en cada archivo

**Usar el editor de código (VS Code, etc.) con búsqueda y reemplazo**:

1. Abrir búsqueda global: `Ctrl+Shift+F` (Windows) o `Cmd+Shift+F` (Mac)
2. Buscar: `/api/v1/(loans|classroom-reservations|meetings|institutions)`
3. Habilitar regex: Clic en `.*` en la barra de búsqueda
4. Reemplazar: `/api/$1`
5. Revisar cada cambio antes de aplicar
6. Aplicar cambios uno por uno

---

## OPCIÓN 2: Sed (Linux/Mac/Git Bash)

### Reemplazo Automático

```bash
# Loans
find apps/web/src -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's|/api/v1/loans|/api/loans|g'

# Reservations
find apps/web/src -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's|/api/v1/classroom-reservations|/api/classroom-reservations|g'

# Meetings
find apps/web/src -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's|/api/v1/meetings|/api/meetings|g'

# Institutions
find apps/web/src -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i 's|/api/v1/institutions|/api/institutions|g'
```

**Nota para Mac**: Usar `sed -i ''` en lugar de `sed -i`

```bash
# Mac version
find apps/web/src -type f -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's|/api/v1/loans|/api/loans|g'
```

---

## OPCIÓN 3: PowerShell (Windows)

### Reemplazo Automático

```powershell
# Loans
Get-ChildItem -Path "apps\web\src" -Recurse -Include *.ts,*.tsx | ForEach-Object {
    (Get-Content $_.FullName) -replace '/api/v1/loans', '/api/loans' | Set-Content $_.FullName
}

# Reservations
Get-ChildItem -Path "apps\web\src" -Recurse -Include *.ts,*.tsx | ForEach-Object {
    (Get-Content $_.FullName) -replace '/api/v1/classroom-reservations', '/api/classroom-reservations' | Set-Content $_.FullName
}

# Meetings
Get-ChildItem -Path "apps\web\src" -Recurse -Include *.ts,*.tsx | ForEach-Object {
    (Get-Content $_.FullName) -replace '/api/v1/meetings', '/api/meetings' | Set-Content $_.FullName
}

# Institutions
Get-ChildItem -Path "apps\web\src" -Recurse -Include *.ts,*.tsx | ForEach-Object {
    (Get-Content $_.FullName) -replace '/api/v1/institutions', '/api/institutions' | Set-Content $_.FullName
}
```

---

## OPCIÓN 4: Node.js Script

### Crear script de reemplazo

**Archivo**: `scripts/update-api-paths.js`

```javascript
const fs = require('fs');
const path = require('path');

const replacements = [
    { from: /\/api\/v1\/loans/g, to: '/api/loans' },
    { from: /\/api\/v1\/classroom-reservations/g, to: '/api/classroom-reservations' },
    { from: /\/api\/v1\/meetings/g, to: '/api/meetings' },
    { from: /\/api\/v1\/institutions/g, to: '/api/institutions' },
];

function updateFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    replacements.forEach(({ from, to }) => {
        if (from.test(content)) {
            content = content.replace(from, to);
            modified = true;
        }
    });

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Updated: ${filePath}`);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            walkDir(filePath);
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            updateFile(filePath);
        }
    });
}

console.log('🔄 Updating API paths...\n');
walkDir('apps/web/src');
console.log('\n✅ Done!');
```

### Ejecutar script

```bash
node scripts/update-api-paths.js
```

---

## VERIFICACIÓN POST-CAMBIO

### Paso 1: Verificar que NO queden referencias antiguas

```bash
# Debe retornar 0 matches para módulos migrados
grep -r "/api/v1/loans" apps/web/src/
grep -r "/api/v1/classroom-reservations" apps/web/src/
grep -r "/api/v1/meetings" apps/web/src/
grep -r "/api/v1/institutions" apps/web/src/
```

### Paso 2: Verificar que SÍ queden referencias de módulos no migrados

```bash
# Debe retornar matches (estos NO deben cambiar)
grep -r "/api/v1/dashboard" apps/web/src/
grep -r "/api/v1/users" apps/web/src/
grep -r "/api/v1/pedagogical-hours" apps/web/src/
```

### Paso 3: Verificar TypeScript

```bash
cd apps/web
npx tsc --noEmit
```

**Resultado esperado**: 0 errores de TypeScript

---

## TESTING MANUAL

### Paso 1: Iniciar servidor de desarrollo

```bash
cd apps/web
npm run dev
```

### Paso 2: Probar cada módulo

#### Loans
1. Ir a `/loans`
2. Crear un préstamo
3. Aprobar/rechazar préstamo
4. Devolver préstamo

#### Reservations
1. Ir a `/reservations`
2. Ver calendario
3. Crear reserva
4. Marcar asistencia

#### Meetings
1. Ir a `/meetings`
2. Crear reunión
3. Agregar tarea

#### Institutions
1. Logout
2. Hacer onboarding
3. Buscar institución MINEDU
4. Completar onboarding
5. Verificar branding

---

## ROLLBACK (Si algo sale mal)

### Opción 1: Git

```bash
# Ver cambios
git diff

# Descartar cambios
git checkout -- apps/web/src/

# O revertir commit
git revert HEAD
```

### Opción 2: Backup manual

```bash
# Antes de hacer cambios
cp -r apps/web/src apps/web/src.backup

# Si algo sale mal
rm -rf apps/web/src
mv apps/web/src.backup apps/web/src
```

---

## CHECKLIST FINAL

### Antes de hacer cambios
- [ ] Hacer commit de cambios actuales
- [ ] Crear backup de `apps/web/src/`
- [ ] Leer documentos de análisis

### Durante los cambios
- [ ] Actualizar 14 archivos
- [ ] Verificar con grep (0 matches)
- [ ] Ejecutar `npx tsc --noEmit`

### Después de los cambios
- [ ] Testing manual de cada módulo
- [ ] Verificar auth funciona
- [ ] Verificar multi-tenancy
- [ ] Hacer commit con mensaje descriptivo

### Cleanup (después de testing exitoso)
- [ ] Eliminar `NEXT_PUBLIC_API_URL` de `.env.local`
- [ ] Eliminar rewrite `/api/v1/*` de `next.config.ts`
- [ ] Actualizar `MIGRATION_COMPLETE.md`
- [ ] Eliminar backup

---

## MENSAJE DE COMMIT SUGERIDO

```
feat: actualizar API clients a endpoints migrados

- Cambiar /api/v1/loans → /api/loans
- Cambiar /api/v1/classroom-reservations → /api/classroom-reservations
- Cambiar /api/v1/meetings → /api/meetings
- Cambiar /api/v1/institutions → /api/institutions

Archivos modificados: 14
Módulos afectados: Loans, Reservations, Meetings, Institutions

Relacionado: Fase 7 - Integración Frontend-API
```

---

## NOTAS IMPORTANTES

1. **NO cambiar** archivos de módulos no migrados:
   - `dashboard.api.ts`
   - `use-academic-defaults.ts`
   - `use-pedagogical-hours.ts`
   - Referencias a `/api/v1/users` en `settings-client.tsx`

2. **Mantener** rewrite de `/api/auth/*` en `next.config.ts`

3. **Probar** en desarrollo antes de hacer commit

4. **Documentar** cualquier problema encontrado

---

## AYUDA

Si encuentras errores:

1. **Error 404**: Verificar que el endpoint existe en `apps/web/src/app/api/`
2. **Error 401**: Verificar que Better Auth funciona
3. **Error 403**: Verificar permisos y multi-tenancy
4. **Error 500**: Revisar logs del servidor

**Logs del servidor**:
```bash
# Terminal donde corre npm run dev
# Buscar errores en rojo
```

**Network tab en DevTools**:
```
1. Abrir DevTools (F12)
2. Ir a Network tab
3. Hacer la acción que falla
4. Ver request/response
```

---

**Recomendación**: Usar OPCIÓN 1 (búsqueda y reemplazo manual en el editor) para tener control total sobre los cambios.
