# Parte 2 Completada: Bottom Nav con Botón Central Condicional

## Archivos Modificados
- `apps/web/src/components/mobile/bottom-nav.tsx` - Actualizado con botón central condicional
- `apps/web/src/app/(dashboard)/layout.tsx` - Lógica para mostrar/ocultar botón central

## Características Implementadas
✅ Bottom nav con 5 items: Inicio | Inventario | [Centro] | Reservas | Personal
✅ Botón central condicional:
  - Se muestra en: Inventario, Reservaciones, Loans
  - Se oculta en: Dashboard, Personal (5to item "Préstamos" aparece en su lugar)
✅ Botón central elevado: 46x46px, rounded-[14px], border 3.5px
✅ Botón central con -mt-5 para elevación visual
✅ Color principal: #185FA5
✅ Safe area support: paddingBottom con env(safe-area-inset-bottom)
✅ Item activo destacado en azul con strokeWidth 2.5
✅ Evento personalizado 'mobile-center-button-click' para cada página

## Diseño del Botón Central
- Tamaño: 46x46px
- Border radius: 14px
- Background: #185FA5
- Border: 3.5px solid background
- Elevación: -mt-5 (20px arriba)
- Ícono: Plus (24x24px) en blanco
- Label: "Nuevo" (10px, muted-foreground)

## Comando para commit:
```bash
git add apps/web/src/components/mobile/bottom-nav.tsx
git add apps/web/src/app/(dashboard)/layout.tsx
git commit -m "feat: conditional center button in bottom nav - Part 2

- Updated BottomNav with conditional center button logic
- Center button shows in Inventario, Reservaciones, Loans
- Center button hidden in Dashboard and Personal (5th item appears)
- Button specs: 46x46px, rounded-[14px], border 3.5px
- Elevated with -mt-5 for visual prominence
- Safe area support with env(safe-area-inset-bottom)
- Dispatches 'mobile-center-button-click' event for page handling
- Active items highlighted in blue (#185FA5)

Mobile only (lg:hidden), desktop unchanged."
```

## Para probar:
1. Navegar a Dashboard → Ver 5 items normales (sin botón central)
2. Navegar a Inventario → Ver botón central "Nuevo" elevado
3. Navegar a Reservaciones → Ver botón central "Nuevo" elevado
4. Navegar a Personal → Ver 5 items normales (sin botón central)
5. Verificar que el botón central esté elevado visualmente
6. Verificar safe area en iPhone (notch)

## Próximos Pasos (Parte 3)
- Página de Reservas móvil con pills Mañana/Tarde
- Grid de días de la semana
- Bloques de reserva con colores por tipo
- Bottom sheet para nueva reserva
