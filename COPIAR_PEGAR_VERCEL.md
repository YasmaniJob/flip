# 📋 Variables de Entorno - Copiar y Pegar en Vercel

## 🎯 Instrucciones

En Vercel Dashboard → Settings → Environment Variables, agrega estas 6 variables:

---

## 1️⃣ DATABASE_URL

**Name:**
```
DATABASE_URL
```

**Value:**
```
postgresql://neondb_owner:npg_kgcCKJuwpF63@ep-jolly-wave-acz30twt-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**Environment:** Production, Preview, Development

---

## 2️⃣ TURSO_DATABASE_URL

**Name:**
```
TURSO_DATABASE_URL
```

**Value:**
```
libsql://flip-v2-yasmanijob.aws-us-east-1.turso.io
```

**Environment:** Production, Preview, Development

---

## 3️⃣ TURSO_AUTH_TOKEN

**Name:**
```
TURSO_AUTH_TOKEN
```

**Value:**
```
eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzQxNDQxNDksImlkIjoiMDE5ZDEzMzMtNzgwMS03Zjk0LTlhOGYtMDEyYTAxNWQxODhiIiwicmlkIjoiM2VhOGNmOTctNjM3NC00NjhjLTkxYzItMmYxYzUxM2IxNDQ2In0.zZdG69K6hhya1dc3B3eWWFpX6dImIxGUQ2uQjj9kISbXGoirD-4ZHbqBq3v1hqKPA-iGKb5f_BBqNlFxjBoGAQ
```

**Environment:** Production, Preview, Development

---

## 4️⃣ BETTER_AUTH_SECRET

**Name:**
```
BETTER_AUTH_SECRET
```

**Value:**
```
4quRwA5VPAYmkvBkUWC4fsmQITeyypueF4b8yLKBp18=
```

**Environment:** Production, Preview, Development

---

## 5️⃣ NEXT_PUBLIC_APP_URL

**Name:**
```
NEXT_PUBLIC_APP_URL
```

**Value (temporal - actualizar después del deploy):**
```
https://flip-v2.vercel.app
```

**Environment:** Production, Preview, Development

⚠️ **IMPORTANTE:** Después del primer deploy, actualiza este valor con la URL real que Vercel te asigne.

---

## 6️⃣ NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION

**Name:**
```
NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION
```

**Value:**
```
false
```

**Environment:** Production, Preview, Development

---

## ✅ Checklist

Después de agregar todas las variables:

- [ ] 6 variables agregadas en Vercel
- [ ] Todas con Environment: Production, Preview, Development
- [ ] Click en "Deploy" o "Redeploy"
- [ ] Esperar ~5 minutos
- [ ] Copiar URL de Vercel
- [ ] Actualizar NEXT_PUBLIC_APP_URL con la URL real
- [ ] Redeploy

---

## 🔄 Actualizar NEXT_PUBLIC_APP_URL después del deploy

1. Copia la URL que Vercel te da (ej: `flip-abc123.vercel.app`)
2. Ve a Settings → Environment Variables
3. Busca `NEXT_PUBLIC_APP_URL`
4. Click en los 3 puntos → Edit
5. Cambia el valor a: `https://tu-url-real.vercel.app`
6. Save
7. Ve a Deployments → Click en los 3 puntos del último deploy → Redeploy

---

## 📝 Notas

- Todas las variables son obligatorias
- `NEXT_PUBLIC_*` son visibles en el cliente
- Las demás son secretas (solo servidor)
- El token de Turso es válido y funcional
- El secret de Better Auth ya está generado
- La URL de Neon usa conexión pooled (mejor performance)

---

**¡Listo para copiar y pegar! 🚀**
