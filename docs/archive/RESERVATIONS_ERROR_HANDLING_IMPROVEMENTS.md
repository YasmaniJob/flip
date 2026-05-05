# 🔧 MEJORAS EN MANEJO DE ERRORES - RESERVATIONS API

## 📋 Cambios Implementados

Se mejoró el manejo de errores en el módulo de reservaciones para proporcionar mejor feedback al usuario y facilitar el debugging.

### Archivos Modificados

1. `apps/web/src/features/reservations/api/reservations.api.ts`
2. `apps/web/src/features/reservations/hooks/use-reservations.ts`

---

## 🔍 Cambio 1: Mejora en `handleResponse` (API)

### Problema Original
```typescript
// ❌ ANTES: Error silencioso cuando el servidor devuelve respuesta no-JSON
const error = await res.json().catch(() => ({}));
const errorMessage = error.message || error.error || `Error ${res.status}: ${res.statusText}`;
```

**Problemas:**
- Si `res.json()` falla, devuelve `{}` vacío
- El mensaje de error podría ser `undefined` si `res.statusText` está vacío
- Log poco detallado para debugging

### Solución Implementada
```typescript
// ✅ DESPUÉS: Manejo robusto de errores con fallbacks
const error = await res.json().catch(() => null);

// Construir mensaje de error con fallbacks
const errorMessage = error?.message || error?.error || `Error ${res.status}: ${res.statusText || 'Error desconocido'}`;

// Log más detallado para debugging
console.error('[Reservations API] Error:', {
    url: res.url,
    status: res.status,
    statusText: res.statusText,
    errorBody: error,
});
```

**Mejoras:**
- ✅ Usa `null` en lugar de `{}` cuando el JSON falla (más explícito)
- ✅ Fallback a "Error desconocido" si `statusText` está vacío
- ✅ Log estructurado con toda la información relevante
- ✅ Incluye `errorBody` completo para debugging

---

## 🔍 Cambio 2: Manejo de Errores en Hooks de Queries

### Problema Original
```typescript
// ❌ ANTES: Queries sin manejo de errores
export function useReservationsByDateRange(...) {
    return useQuery({
        queryKey: ...,
        queryFn: ...,
        // Sin onError - errores silenciosos
    });
}
```

**Problemas:**
- Errores no se muestran al usuario
- No hay feedback visual cuando falla la carga
- Difícil de debuggear

### Solución Implementada

Se agregó manejo de errores a TODOS los hooks de queries:

```typescript
// ✅ DESPUÉS: Queries con manejo de errores y reintentos
export function useReservationsByDateRange(...) {
    return useQuery({
        queryKey: ...,
        queryFn: ...,
        retry: 2, // Reintentar 2 veces antes de fallar
        onError: (error) => {
            handleApiError(error, 'No se pudieron cargar las reservas');
        },
    });
}
```

**Hooks actualizados:**
1. ✅ `useReservationsByDateRange` - "No se pudieron cargar las reservas"
2. ✅ `useMyTodayReservations` - "No se pudieron cargar tus reservas de hoy"
3. ✅ `useReservationAttendance` - "No se pudo cargar la asistencia"
4. ✅ `useReservationTasks` - "No se pudieron cargar los acuerdos"

**Mejoras:**
- ✅ Toast de error visible al usuario
- ✅ Reintentos automáticos (2 intentos)
- ✅ Mensajes de error específicos por contexto
- ✅ Usa el sistema centralizado `handleApiError`

---

## 🎯 Hooks de Mutations (Ya estaban correctos)

Los siguientes hooks YA tenían manejo de errores correcto:

✅ `useCreateReservation`
✅ `useCancelReservation`
✅ `useCancelSlot`
✅ `useMarkAttendance`
✅ `useRescheduleSlot`
✅ `useRescheduleBlock`
✅ `useAddReservationAttendee`
✅ `useBulkUpdateReservationAttendance`
✅ `useRemoveReservationAttendee`
✅ `useCreateReservationTask`
✅ `useUpdateReservationTask`
✅ `useDeleteReservationTask`

Todos usan:
- `onSuccess` con `showSuccess()` para feedback positivo
- `onError` con `handleApiError()` para feedback de errores

---

## 🧪 Cómo Probar

### Escenario 1: Error de Red
1. Desconecta el internet
2. Intenta cargar reservaciones
3. **Resultado esperado:** Toast de error "No se pudieron cargar las reservas"

### Escenario 2: Error 500 del Servidor
1. Simula un error 500 en el backend
2. Intenta crear una reserva
3. **Resultado esperado:** 
   - Toast de error con mensaje del servidor
   - Log detallado en consola con URL, status, y body

### Escenario 3: Respuesta No-JSON
1. Configura el servidor para devolver HTML en lugar de JSON
2. Intenta cualquier operación
3. **Resultado esperado:**
   - Toast de error "Error 500: Error desconocido"
   - Log en consola: `errorBody: null`

### Escenario 4: Error 404
1. Intenta acceder a un recurso inexistente
2. **Resultado esperado:**
   - Toast de error con mensaje específico
   - Log: `status: 404, statusText: "Not Found"`

---

## 📊 Flujo de Manejo de Errores

```
┌─────────────────────────────────────────────────────────────┐
│ Usuario ejecuta acción (ej: crear reserva)                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Hook llama a ReservationsApi.create()                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ fetch() hace request al servidor                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    ¿Respuesta OK?
                    /          \
                  SÍ            NO
                  ↓              ↓
        ┌──────────────┐  ┌──────────────────────────────┐
        │ Parsear JSON │  │ handleResponse detecta error │
        │ Retornar data│  │ 1. Intenta parsear JSON      │
        └──────────────┘  │ 2. Si falla, usa null        │
                          │ 3. Construye mensaje         │
                          │ 4. Log detallado             │
                          │ 5. throw Error()             │
                          └──────────────────────────────┘
                                      ↓
                          ┌──────────────────────────────┐
                          │ Hook.onError() captura error │
                          │ - handleApiError()           │
                          │ - Toast de error visible     │
                          └──────────────────────────────┘
                                      ↓
                          ┌──────────────────────────────┐
                          │ Usuario ve feedback          │
                          │ - Toast rojo con mensaje     │
                          │ - Puede reintentar           │
                          └──────────────────────────────┘
```

---

## 🔧 Sistema de Error Handling Centralizado

El proyecto usa un sistema centralizado en `@/lib/error-handler`:

```typescript
// Función para manejar errores de API
handleApiError(error: unknown, fallbackMessage: string): void

// Función para mostrar éxito
showSuccess(message: string): void
```

**Ventajas:**
- ✅ Consistencia en toda la aplicación
- ✅ Fácil de mantener y actualizar
- ✅ Mensajes de error uniformes
- ✅ Logging centralizado

---

## 📝 Notas Importantes

1. **Reintentos:** Todos los queries ahora reintentan 2 veces antes de mostrar error
2. **Logging:** Todos los errores se loguean en consola con contexto completo
3. **UX:** El usuario siempre recibe feedback visual (toast)
4. **Debugging:** Los logs incluyen URL, status, statusText y errorBody completo
5. **Fallbacks:** Múltiples niveles de fallback para mensajes de error

---

## ✅ Checklist de Verificación

Antes de considerar completo, verifica:

- [x] `handleResponse` maneja respuestas no-JSON correctamente
- [x] Todos los hooks de queries tienen `onError`
- [x] Todos los hooks de mutations tienen `onError` (ya estaban)
- [x] Mensajes de error son específicos y útiles
- [x] Logs incluyen toda la información necesaria
- [x] No hay errores de TypeScript
- [x] Sistema de reintentos configurado
- [x] Usa el sistema centralizado de error handling

---

## 🚀 Próximos Pasos

1. Probar en local con diferentes escenarios de error
2. Verificar que los toasts se muestran correctamente
3. Revisar logs en consola para debugging
4. Si todo funciona, hacer commit y push
