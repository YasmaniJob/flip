# 🚨 INSTRUCCIONES URGENTES: Instalar Dependencias

**Error actual**: `Module not found: Can't resolve 'drizzle-orm'`  
**Causa**: Las dependencias están en `package.json` pero NO están instaladas en `node_modules`  
**Solución**: Ejecutar `pnpm install`

---

## ⚡ SOLUCIÓN RÁPIDA (3 pasos)

### Paso 1: Detener el servidor

Si el servidor está corriendo, deténlo:
- Presiona `Ctrl + C` en la terminal donde corre `npm run dev`

### Paso 2: Instalar dependencias

Ejecuta este comando en la raíz del proyecto:

```bash
pnpm install
```

**Tiempo estimado**: 1-2 minutos

### Paso 3: Reiniciar el servidor

```bash
cd apps/web
npm run dev
```

---

## 📋 COMANDOS COMPLETOS (copiar y pegar)

### Opción A: Desde la raíz del proyecto

```bash
# Detener servidor (Ctrl + C si está corriendo)

# Instalar dependencias
pnpm install

# Iniciar servidor
cd apps/web
npm run dev
```

### Opción B: Solo en apps/web

```bash
# Detener servidor (Ctrl + C si está corriendo)

# Ir a apps/web
cd apps/web

# Instalar dependencias
pnpm install

# Iniciar servidor
npm run dev
```

---

## ✅ VERIFICACIÓN

Después de ejecutar `pnpm install`, deberías ver:

1. **Instalación exitosa**:
   ```
   Progress: resolved X, reused Y, downloaded Z, added W
   Done in Xs
   ```

2. **Dependencias instaladas**:
   - `node_modules/drizzle-orm/` debe existir
   - `node_modules/pg/` debe existir

3. **Servidor inicia sin errores**:
   ```
   ▲ Next.js 15.3.0
   - Local:        http://localhost:3000
   ✓ Ready in Xs
   ```

---

## 🔍 DEPENDENCIAS QUE SE INSTALARÁN

### Runtime (dependencies)
- ✅ `drizzle-orm@^0.36.4` - ORM para PostgreSQL
- ✅ `pg@^8.13.1` - Cliente de PostgreSQL

### Desarrollo (devDependencies)
- ✅ `@types/pg@^8.11.10` - Tipos de TypeScript para pg
- ✅ `drizzle-kit@^0.30.1` - CLI para migraciones

---

## ❌ SI EL ERROR PERSISTE

### Verificar que las dependencias se instalaron

```bash
# Verificar drizzle-orm
ls node_modules/drizzle-orm

# Verificar pg
ls node_modules/pg
```

### Limpiar cache y reinstalar

```bash
# Limpiar cache de pnpm
pnpm store prune

# Eliminar node_modules
rm -rf node_modules

# Reinstalar
pnpm install
```

### Verificar versión de pnpm

```bash
pnpm --version
```

Debe ser `9.15.0` o superior.

---

## 📝 NOTAS IMPORTANTES

### ¿Por qué este error?

Durante la migración, actualicé el `package.json` con las dependencias necesarias, pero estas solo se agregan al archivo. Para que estén disponibles en el código, debes ejecutar `pnpm install` para descargarlas e instalarlas en `node_modules`.

### ¿Es normal este error?

Sí, es completamente normal. Cada vez que se agregan nuevas dependencias al `package.json`, debes ejecutar `pnpm install` para instalarlas.

### ¿Afecta a otros archivos?

Sí, todos los route handlers (61 archivos) usan `drizzle-orm`, por lo que ninguno funcionará hasta que instales las dependencias.

---

## 🎯 RESUMEN

1. ✅ Las dependencias YA están en `package.json`
2. ❌ Las dependencias NO están en `node_modules`
3. ⏳ Necesitas ejecutar `pnpm install`
4. ✅ Después de instalar, todo funcionará

---

## 🚀 SIGUIENTE PASO

Una vez que el servidor inicie sin errores, podrás proceder con el testing manual de los 29 tests identificados.

---

**Creado por**: Kiro AI Assistant  
**Fecha**: 21 de marzo de 2026  
**Prioridad**: 🚨 URGENTE - Ejecutar `pnpm install` ahora
