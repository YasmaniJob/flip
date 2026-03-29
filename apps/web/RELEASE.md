# Guía de Releases

## Flujo de Trabajo para Nuevas Versiones

### 1. Actualizar la versión

Usa npm version para actualizar automáticamente el `package.json`:

```bash
# Para correcciones (0.0.1 → 0.0.2)
npm version patch

# Para nuevas funcionalidades (0.0.1 → 0.1.0)
npm version minor

# Para cambios mayores (0.0.1 → 1.0.0)
npm version major
```

### 2. Crear el changelog

Ejecuta el script interactivo:

```bash
cd apps/web
pnpm run release:changelog
```

El script te pedirá:
- Título de la versión (ej: "Optimización de Rendimiento")
- Lista de mejoras (una por línea, Enter vacío para terminar)
- Lista de correcciones (una por línea, Enter vacío para terminar)

El script automáticamente:
- Lee la versión del `package.json`
- Inserta el changelog en Turso
- Calcula el `sortOrder` basado en la versión

### 3. Commit y push

```bash
git add .
git commit -m "release: v0.0.2"
git push
```

### 4. Deploy automático

- Vercel detecta el push y despliega automáticamente
- La app mostrará la nueva versión en sidebar, drawer y páginas de auth
- La landing mostrará el nuevo changelog desde Turso

## Sincronización Automática

La versión se sincroniza automáticamente en:

**App (apps/web):**
- Sidebar (desktop)
- Mobile drawer
- Páginas de autenticación (login, register, forgot-password, reset-password)

**Landing (apps/landing-astro):**
- Página `/changelog` lee directamente de Turso

**Fuente única de verdad:**
- `apps/web/package.json` → campo `version`
- Variable de entorno: `NEXT_PUBLIC_APP_VERSION`
- Tabla Turso: `changelog`

## Notas

- La versión en la UI se actualiza automáticamente en cada build
- No necesitas editar manualmente ningún archivo de componentes
- El changelog en la landing se actualiza inmediatamente después de ejecutar el script
