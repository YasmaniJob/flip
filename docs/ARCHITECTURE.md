# Arquitectura de Software - Flip v2

Este documento describe la arquitectura de alto nivel y los patrones de diseño implementados en Flip v2.

## 🏗️ Principios Generales

*   **Clean Architecture:** Separación estricta de responsabilidades en capas concéntricas (Domain, Application, Infrastructure).
*   **Hexagonal (Ports & Adapters):** El núcleo de la aplicación se aísla del mundo exterior mediante interfaces (Puertos).
*   **Feature-Sliced Design (Frontend):** Organización vertical por funcionalidades de negocio.
*   **Atomic Design (UI):** Construcción de interfaces a partir de componentes pequeños y reutilizables.

## 🔙 Backend (NestJS)

La aplicación sigue una estructura modular basada en Clean Architecture.

### Estructura de Directorios (`apps/api/src/`)

```
src/
├── core/                        # 🔵 CAPA DE DOMINIO (Reglas de Negocio)
│   ├── domain/                  # Entidades y Value Objects puros
│   │   ├── entities/            # e.g., resource.entity.ts
│   │   └── value-objects/       # e.g., internal-id.vo.ts
│   └── ports/                   # 🔷 PUERTOS (Interfaces)
│       ├── inbound/             # Casos de Uso (Inputs)
│       └── outbound/            # Repositorios (Outputs)
├── application/                 # 🟢 CAPA DE APLICACIÓN (Casos de Uso)
│   ├── use-cases/               # Orquestación de lógica (Commands/Queries)
│   │   └── resources/           # e.g., create-resource.command.ts
├── infrastructure/              # 🟠 CAPA DE INFRAESTRUCTURA (Detalles)
│   ├── persistence/             # Implementación de Repositorios (Drizzle)
│   ├── http/                    # Controladores REST
│   └── external/                # Servicios de terceros (Brevo, Minedu)
└── modules/                     # 🟣 MÓDULOS DE INYECCIÓN (Wiring)
```

### Patrones Clave
1.  **Inversión de Dependencias:** Los casos de uso dependen de interfaces (`IResourceRepository`), no de implementaciones concretas (`DrizzleResourceRepository`).
2.  **Rich Domain Model:** Las entidades encapsulan lógica de negocio y validación.
3.  **Value Objects:** Objetos inmutables para conceptos con reglas propias (`InternalId`, `InstitutionId`).

## 🖥️ Frontend (Next.js)

El frontend utiliza Feature-Sliced Design para escalar features complejas y Atomic Design para la UI.

### Estructura (`apps/web/src/`)
```
src/
├── components/                  # 🧱 UI KIT (Atomic Design)
│   ├── atoms/                   # Botones, Inputs, Iconos
│   ├── molecules/               # Campos de formulario, Tarjetas simples
│   └── organisms/               # Tablas complejas, Wizard steps
├── features/                    # 📦 FEATURES (Lógica de Negocio)
│   ├── inventory/               # Módulo de Inventario
│   │   ├── api/                 # Servicios API (categories.api.ts)
│   │   ├── components/          # Componentes específicos del dominio
│   │   └── hooks/               # Custom Hooks (useCategories)
├── app/                         # 🌐 RUTAS (Next.js App Router)
```

## 🗃️ Base de Datos (PostgreSQL + Drizzle)
*   **Atomic Sequences:** Generación de IDs secuenciales por institución y categoría (`category_sequences`).
*   **Optimized Schema:** Uso de `cuid2` para IDs primarios y secuencias legibles (`AUD-001`) para usuarios.

## ✅ Testing
*   **Unit Testing:** Pruebas aisladas para Casos de Uso (mocking de repositorios).
*   **Integration Testing:** (En configuración) Validación de adaptadores de persistencia con base de datos real.
