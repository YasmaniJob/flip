# Lazy Registration - Implementación

## Contexto
Sistema de registro automático para docentes que ya están registrados en la tabla `staff` por el administrador.

## Flujo Implementado

### 1. Admin registra staff
El administrador crea registros en la tabla `staff` con:
- Nombre
- Email
- DNI
- Área
- Role
- Institution ID

### 2. Docente intenta login por primera vez
El docente ingresa:
- Email: su correo registrado
- Password: su DNI (8+ caracteres)

### 3. Sistema procesa el login

#### Paso 1: Intento de login normal
```typescript
const result = await signIn.email({ email, password });
```

Si el usuario ya tiene cuenta → Login exitoso ✅

#### Paso 2: Si falla, intenta Lazy Registration
```typescript
POST /api/auth/lazy-register
Body: { email, dni: password }
```

El endpoint:
1. Busca en `staff` con `email + dni`
2. Si no existe → Error 404 "No encontrado"
3. Si existe pero ya tiene cuenta → Error 409 "Usuario ya existe"
4. Si existe y no tiene cuenta → Crea cuenta con Better Auth
5. Actualiza el campo `dni` en la tabla `users`

#### Paso 3: Login automático después de crear cuenta
```typescript
const loginResult = await signIn.email({ email, password });
```

### 4. Mensajes de error contextuales

| Caso | Status | Mensaje |
|------|--------|---------|
| Staff no encontrado | 404 | "No se encontró un registro de personal con ese correo y DNI. Contacta al administrador." |
| Usuario ya existe | 409 | "Ya tienes una cuenta. Usa tu contraseña (no tu DNI) para iniciar sesión." |
| Credenciales incorrectas | 401 | "Las credenciales no coinciden. Por favor, revisa tu correo y contraseña." |
| Error de red | 500 | "Problema de conexión. Revisa tu conexión a internet." |

## Archivos Modificados

### 1. `/api/auth/lazy-register/route.ts` (NUEVO)
Endpoint que maneja la creación automática de cuentas.

**Validación con Zod:**
```typescript
const lazyRegisterSchema = z.object({
  email: z.string().email(),
  dni: z.string().min(8),
});
```

**Lógica:**
- Busca en `staff` con `email + dni`
- Verifica que no exista en `users`
- Crea cuenta con `auth.api.signUpEmail()`
- Actualiza campo `dni` manualmente

### 2. `/app/(auth)/login/page.tsx` (MODIFICADO)
Login form con fallback a lazy registration.

**Flujo:**
1. Intenta login normal
2. Si falla → Intenta lazy register
3. Si lazy register exitoso → Login automático
4. Muestra mensajes contextuales según el error

## Seguridad

✅ Validación con Zod en el endpoint
✅ Verificación de email + DNI en la tabla `staff`
✅ Prevención de duplicados (check en `users`)
✅ Hashing de contraseña manejado por Better Auth
✅ Mensajes de error que no revelan información sensible

## Testing

### Caso 1: Primer login de docente registrado
1. Admin crea staff con email `docente@escuela.pe` y DNI `12345678`
2. Docente va a `/login`
3. Ingresa email `docente@escuela.pe` y password `12345678`
4. Sistema crea cuenta automáticamente
5. Login exitoso → Redirige a `/dashboard`

### Caso 2: Docente no registrado
1. Usuario intenta login con email no registrado en `staff`
2. Sistema muestra: "No se encontró un registro de personal..."

### Caso 3: Docente con cuenta existente
1. Docente ya tiene cuenta pero intenta usar DNI como password
2. Sistema muestra: "Ya tienes una cuenta. Usa tu contraseña..."

### Caso 4: Login normal (no primera vez)
1. Docente con cuenta existente usa su password correcto
2. Login exitoso sin pasar por lazy registration

## Notas Técnicas

- Better Auth maneja el hashing de contraseñas automáticamente
- El campo `dni` se actualiza manualmente porque no está en `additionalFields`
- El endpoint usa `auth.api.signUpEmail()` para mantener consistencia con Better Auth
- No se modifica la configuración de Better Auth en `auth/index.ts`
- Compatible con el flujo de email verification (actualmente deshabilitado)

## Próximos Pasos (Opcional)

- [ ] Agregar rate limiting al endpoint `/api/auth/lazy-register`
- [ ] Logging de intentos de lazy registration para auditoría
- [ ] Notificación al admin cuando un docente crea su cuenta
- [ ] Permitir que el docente cambie su contraseña después del primer login
