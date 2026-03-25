# Fix: Bug de Zona Horaria en Calendario de Reservas

## Problema

Las reservas aparecían en el día incorrecto en el calendario. Por ejemplo:
- Reserva guardada para: Jueves 26 de marzo
- Aparecía en calendario: Miércoles 25 de marzo

## Causa Raíz

El problema estaba en cómo se parseaban las fechas en `reservaciones-client.tsx`:

```typescript
// ❌ CÓDIGO ANTERIOR (INCORRECTO)
const dateKey = new Date(slot.date).toDateString();
```

Cuando se crea un `new Date()` desde un string ISO como `"2026-03-26T00:00:00.000Z"`:
- JavaScript lo interpreta como UTC medianoche (00:00 UTC)
- En zonas horarias negativas (ej: UTC-5, UTC-6), esto se convierte al día anterior
- Ejemplo: `2026-03-26T00:00:00.000Z` en UTC-5 = `2026-03-25T19:00:00` (día anterior)

## Solución

Parsear la fecha manualmente sin conversión de zona horaria:

```typescript
// ✅ CÓDIGO NUEVO (CORRECTO)
const dateStr = slot.date.split('T')[0]; // "2026-03-26"
const [year, month, day] = dateStr.split('-').map(Number);
const localDate = new Date(year, month - 1, day); // Crea fecha en zona horaria local
const dateKey = localDate.toDateString();
```

## Cambios Realizados

### Archivo: `apps/web/src/app/(dashboard)/reservaciones/reservaciones-client.tsx`

**Líneas 130-147** - Función `slotMap`:

```typescript
const slotMap = useMemo(() => {
    const map = new Map<string, ReservationSlot>();
    if (!slots) return map;
    
    slots.forEach(slot => {
        if (slot.classroomId === selectedClassroomId) {
            // Parsear fecha sin conversión de zona horaria
            // Extraer solo la parte de fecha del ISO string (YYYY-MM-DD)
            const dateStr = slot.date.split('T')[0];
            const [year, month, day] = dateStr.split('-').map(Number);
            // Crear fecha en zona horaria local sin conversión UTC
            const localDate = new Date(year, month - 1, day);
            const dateKey = localDate.toDateString();
            map.set(`${dateKey}-${slot.pedagogicalHour.id}`, slot);
        }
    });
    
    return map;
}, [slots, selectedClassroomId]);
```

## Resultado

Ahora las reservas aparecen en el día correcto en el calendario, coincidiendo con lo que muestra el modal de reprogramación.

## Lecciones Aprendidas

1. **Nunca usar `new Date(isoString)` para fechas sin hora**: Siempre causa problemas de zona horaria
2. **Parsear manualmente fechas YYYY-MM-DD**: Usar `new Date(year, month-1, day)` para fechas locales
3. **Consistencia**: Asegurar que todas las partes del código usen el mismo método de parseo

## Testing

Para verificar el fix:
1. Crear una reserva para un día específico
2. Verificar que aparezca en el mismo día en el calendario
3. Abrir modal de reprogramación y confirmar que el día "Actual" coincide con el calendario
