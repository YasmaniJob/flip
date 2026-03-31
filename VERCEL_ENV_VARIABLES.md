# Variables de Entorno para Vercel - Módulo de Diagnóstico

## 📋 Variables Requeridas

Agrega estas variables de entorno en tu proyecto de Vercel:

### Feature Flags - Módulo de Diagnóstico

#### Client-side (NEXT_PUBLIC_)
Estas variables son accesibles desde el navegador:

```bash
NEXT_PUBLIC_FEATURE_DIAGNOSTIC_ENABLED=true
NEXT_PUBLIC_FEATURE_DIAGNOSTIC_PUBLIC_QUIZ=true
NEXT_PUBLIC_FEATURE_DIAGNOSTIC_ADMIN_PANEL=true
NEXT_PUBLIC_FEATURE_DIAGNOSTIC_STAFF_INTEGRATION=true
```

#### Server-side
Estas variables solo son accesibles desde el servidor:

```bash
FEATURE_DIAGNOSTIC_ENABLED=true
FEATURE_DIAGNOSTIC_PUBLIC_QUIZ=true
FEATURE_DIAGNOSTIC_ADMIN_PANEL=true
FEATURE_DIAGNOSTIC_STAFF_INTEGRATION=true
```

---

## 🚀 Cómo Agregar en Vercel

### Opción 1: Desde el Dashboard de Vercel

1. Ve a tu proyecto en Vercel: https://vercel.com/dashboard
2. Selecciona tu proyecto (flip-v2)
3. Ve a **Settings** → **Environment Variables**
4. Agrega cada variable una por una:
   - **Key**: Nombre de la variable (ej: `FEATURE_DIAGNOSTIC_ENABLED`)
   - **Value**: `true`
   - **Environment**: Selecciona `Production`, `Preview`, y `Development`
5. Click en **Save**
6. Repite para todas las variables

### Opción 2: Desde Vercel CLI

```bash
# Instalar Vercel CLI si no lo tienes
npm i -g vercel

# Login
vercel login

# Agregar variables (ejecutar desde la raíz del proyecto)
vercel env add NEXT_PUBLIC_FEATURE_DIAGNOSTIC_ENABLED production
# Cuando te pregunte el valor, escribe: true

vercel env add NEXT_PUBLIC_FEATURE_DIAGNOSTIC_PUBLIC_QUIZ production
# Valor: true

vercel env add NEXT_PUBLIC_FEATURE_DIAGNOSTIC_ADMIN_PANEL production
# Valor: true

vercel env add NEXT_PUBLIC_FEATURE_DIAGNOSTIC_STAFF_INTEGRATION production
# Valor: true

vercel env add FEATURE_DIAGNOSTIC_ENABLED production
# Valor: true

vercel env add FEATURE_DIAGNOSTIC_PUBLIC_QUIZ production
# Valor: true

vercel env add FEATURE_DIAGNOSTIC_ADMIN_PANEL production
# Valor: true

vercel env add FEATURE_DIAGNOSTIC_STAFF_INTEGRATION production
# Valor: true
```

---

## 🔄 Después de Agregar las Variables

### 1. Redeploy
Después de agregar las variables, necesitas hacer un redeploy:

**Opción A - Desde Dashboard:**
- Ve a **Deployments**
- Click en los 3 puntos del último deployment
- Click en **Redeploy**

**Opción B - Desde CLI:**
```bash
vercel --prod
```

**Opción C - Push a Git:**
```bash
git commit --allow-empty -m "trigger redeploy"
git push origin master
```

### 2. Verificar
Una vez que el deployment termine:
1. Ve a `/settings/diagnostico`
2. Deberías ver el panel completo en lugar del mensaje de error

---

## 📝 Descripción de los Feature Flags

### Client-side Flags (NEXT_PUBLIC_)

| Variable | Descripción | Usado en |
|----------|-------------|----------|
| `NEXT_PUBLIC_FEATURE_DIAGNOSTIC_ENABLED` | Habilita el módulo completo | Componentes cliente |
| `NEXT_PUBLIC_FEATURE_DIAGNOSTIC_PUBLIC_QUIZ` | Habilita el quiz público | `/ie/[slug]/diagnostic` |
| `NEXT_PUBLIC_FEATURE_DIAGNOSTIC_ADMIN_PANEL` | Habilita el panel admin | `/settings/diagnostico` |
| `NEXT_PUBLIC_FEATURE_DIAGNOSTIC_STAFF_INTEGRATION` | Habilita integración con staff | Aprobación de docentes |

### Server-side Flags

| Variable | Descripción | Usado en |
|----------|-------------|----------|
| `FEATURE_DIAGNOSTIC_ENABLED` | Habilita APIs del módulo | Todos los endpoints |
| `FEATURE_DIAGNOSTIC_PUBLIC_QUIZ` | Habilita APIs públicas | `/api/diagnostic/*` |
| `FEATURE_DIAGNOSTIC_ADMIN_PANEL` | Habilita APIs admin | `/api/institutions/[id]/diagnostic/*` |
| `FEATURE_DIAGNOSTIC_STAFF_INTEGRATION` | Habilita creación de staff | Endpoint de aprobación |

---

## 🔐 Otras Variables Importantes

Asegúrate de que también tengas estas variables configuradas en Vercel:

### URLs de la Aplicación
```bash
NEXT_PUBLIC_APP_URL=https://tudominio.vercel.app
BETTER_AUTH_URL=https://tudominio.vercel.app
```

**IMPORTANTE**: En desarrollo local, usa:
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
BETTER_AUTH_URL=http://localhost:3000
```

### Base de Datos
```bash
DATABASE_URL=postgresql://...
```

### Autenticación
```bash
BETTER_AUTH_SECRET=your-secret-key
```

### Email (si usas notificaciones)
```bash
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@tudominio.com
```

---

## ⚠️ Troubleshooting

### El panel sigue sin aparecer después del redeploy

1. **Verifica que las variables estén en Production:**
   - Ve a Settings → Environment Variables
   - Asegúrate de que cada variable tenga el checkbox de "Production" marcado

2. **Verifica el código en el componente:**
   ```typescript
   // apps/web/src/app/(dashboard)/settings/diagnostico/diagnostico-client.tsx
   const diagnosticEnabled = process.env.NEXT_PUBLIC_FEATURE_DIAGNOSTIC_ADMIN_PANEL === 'true';
   ```

3. **Verifica los logs de Vercel:**
   - Ve a Deployments → Click en el último deployment
   - Ve a "Runtime Logs"
   - Busca errores relacionados con el diagnóstico

4. **Limpia la caché:**
   ```bash
   # En Vercel Dashboard
   Settings → General → Clear Cache
   ```

### Error 503 en las APIs

Si ves error 503 al llamar a las APIs del diagnóstico:
- Verifica que las variables **sin** `NEXT_PUBLIC_` estén configuradas
- Estas son las que usa el servidor para verificar los feature flags

---

## 📊 Verificación Rápida

Después del deployment, verifica que todo funcione:

### 1. Panel Admin
```
URL: https://tudominio.com/settings/diagnostico
Esperado: Ver el panel con 4 tabs (Config, Cuestionario, Pendientes, Resultados)
```

### 2. API de Configuración
```bash
curl https://tudominio.com/api/institutions/[id]/diagnostic/config \
  -H "Authorization: Bearer YOUR_TOKEN"

# Esperado: JSON con la configuración
```

### 3. Quiz Público
```
URL: https://tudominio.com/ie/[slug]/diagnostic
Esperado: Ver la landing page del diagnóstico
```

---

## 🎯 Checklist de Deployment

- [ ] Agregar las 8 variables de entorno en Vercel
- [ ] Verificar que estén en "Production"
- [ ] Hacer redeploy del proyecto
- [ ] Esperar a que termine el deployment
- [ ] Verificar que `/settings/diagnostico` funcione
- [ ] Verificar que el quiz público funcione
- [ ] Probar crear una pregunta personalizada
- [ ] Probar aprobar un docente pendiente

---

## 📞 Soporte

Si después de seguir estos pasos el módulo sigue sin funcionar:

1. Revisa los logs de Vercel
2. Verifica que las migraciones de base de datos estén aplicadas
3. Verifica que el seed de preguntas base esté ejecutado
4. Contacta al equipo de desarrollo

---

**Última actualización**: 30 de marzo de 2026
