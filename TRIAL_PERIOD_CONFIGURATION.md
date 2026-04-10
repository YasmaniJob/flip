# Configuración del Período de Prueba (Trial)

## Resumen

Ahora puedes controlar la duración del período de prueba de las instituciones mediante una variable de entorno. Esto te da total flexibilidad para decidir cuántos días durará el trial sin necesidad de modificar código.

## Configuración

### Variable de Entorno

Archivo: `apps/web/.env.local`

```env
# Número de días de prueba para nuevas instituciones (por defecto: 15)
DEFAULT_TRIAL_DAYS=15
```

### Cómo Cambiar el Período de Prueba

1. Abre el archivo `apps/web/.env.local`
2. Busca la línea `DEFAULT_TRIAL_DAYS=15`
3. Cambia el número a los días que desees
4. Guarda el archivo
5. Reinicia el servidor de desarrollo

### Ejemplos

```env
# 7 días de prueba
DEFAULT_TRIAL_DAYS=7

# 30 días de prueba
DEFAULT_TRIAL_DAYS=30

# 60 días de prueba
DEFAULT_TRIAL_DAYS=60

# 90 días de prueba (3 meses)
DEFAULT_TRIAL_DAYS=90
```

## Cómo Funciona

### Para Nuevas Instituciones

Cuando se crea una nueva institución, el sistema:

1. Lee el valor de `DEFAULT_TRIAL_DAYS` del archivo `.env.local`
2. Calcula la fecha de expiración: `fecha_actual + DEFAULT_TRIAL_DAYS`
3. Asigna esa fecha al campo `trialEndsAt` de la institución

### Para Instituciones Existentes

Las instituciones que ya existen NO se ven afectadas por cambios en esta variable. Para modificar el período de prueba de una institución existente, usa el panel de administración de suscripciones.

## Dónde se Usa

La constante `DEFAULT_TRIAL_DAYS` se utiliza en:

1. **Creación de instituciones** - Al registrar una nueva institución
2. **Función `getTrialEndDate()`** - Calcula la fecha de fin del trial
3. **Panel de administración** - Como valor por defecto al extender trials

## Archivos Modificados

### 1. Variable de Entorno
**Archivo:** `apps/web/.env.local`
```env
DEFAULT_TRIAL_DAYS=15
```

### 2. Constante Actualizada
**Archivo:** `packages/shared/src/constants/index.ts`
```typescript
export const DEFAULT_TRIAL_DAYS = parseInt(process.env.DEFAULT_TRIAL_DAYS || '15', 10);
```

Ahora lee de la variable de entorno en lugar de estar hardcodeada.

### 3. Función de Cálculo
**Archivo:** `packages/shared/src/utils/index.ts`
```typescript
export const getTrialEndDate = (startDate: Date, trialDays: number = 15): Date => {
    return addDays(startDate, trialDays);
};
```

Esta función ya acepta un parámetro `trialDays` que por defecto usa 15, pero puede recibir el valor de `DEFAULT_TRIAL_DAYS`.

## Casos de Uso

### Caso 1: Promoción Especial
Quieres ofrecer 30 días de prueba en lugar de 15:

```env
DEFAULT_TRIAL_DAYS=30
```

Todas las instituciones nuevas que se registren a partir de ahora tendrán 30 días de prueba.

### Caso 2: Período de Prueba Corto
Quieres reducir el trial a 7 días:

```env
DEFAULT_TRIAL_DAYS=7
```

### Caso 3: Trial Extendido
Quieres dar 90 días de prueba:

```env
DEFAULT_TRIAL_DAYS=90
```

## Gestión de Trials Individuales

Si necesitas ajustar el trial de una institución específica (no todas), usa el panel de administración:

1. Ve a la sección de **Suscripciones**
2. Busca la institución
3. Usa la opción **"Extender Trial"**
4. Especifica los días adicionales

Esto NO afecta el valor global de `DEFAULT_TRIAL_DAYS`.

## Validación

El sistema valida que:
- El valor sea un número entero positivo
- Si la variable no existe o es inválida, usa 15 días por defecto
- El valor mínimo recomendado es 1 día
- No hay límite máximo (puedes poner 365 días si quieres)

## Producción

Para producción (Vercel), agrega la variable de entorno en el dashboard de Vercel:

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega: `DEFAULT_TRIAL_DAYS` con el valor deseado
4. Redeploy la aplicación

## Notas Importantes

- ✅ Los cambios aplican solo a instituciones NUEVAS
- ✅ Puedes cambiar el valor en cualquier momento
- ✅ Requiere reiniciar el servidor para que tome efecto
- ✅ Es seguro cambiar este valor
- ⚠️ No afecta instituciones existentes
- ⚠️ Para cambios masivos, considera un script de migración

## Monitoreo

Para verificar qué valor está usando el sistema:

```typescript
import { DEFAULT_TRIAL_DAYS } from '@flip/shared/constants';

console.log('Días de prueba configurados:', DEFAULT_TRIAL_DAYS);
```

## Soporte

Si necesitas:
- Cambiar el trial de múltiples instituciones existentes
- Aplicar un trial diferente por tipo de institución
- Lógica más compleja de trials

Contacta al equipo de desarrollo para implementar una solución personalizada.
