# Project Context - Flip v2

## Domain Glossary

### Core Entities
- **Institution (IE)**: The top-level tenant. All data belongs to an institution.
- **Resource**: A physical item in the inventory (e.g., Laptop, Projector).
- **Category**: A classification of resources (e.g., Equipos Portátiles, Periféricos).
- **Template**: A reusable definition for a resource (e.g., "HP Laptop 15").
- **Reservation**: A pedagogical booking for a resource or space.
- **Loan**: A physical check-out/check-in of a resource.
- **Incident**: A reported damage or maintenance issue.
- **Staff**: A user with institutional responsibilities.
- **Pedagogical Hour**: A standard unit of time for reservations in a school.

### Roles
- **IE_ADMIN**: Full control over an institution.
- **STAFF**: Inventory and loan management.
- **TEACHER**: Making reservations and borrowing items.
- **SUPER_ADMIN**: Platform-level management.

## Architecture Patterns

### Unified Next.js Monolith
- **Seams**: Located at `src/lib/repositories` (persistence) and `src/lib/services` (business logic).
- **Modules**:
    - **Inventory Module**: Resource management, categories, and templates.
    - **Reservation Module**: Scheduling and space allocation.
    - **Loan Module**: Check-out/in workflow.
    - **User Module**: Auth and profile management.
- **Leverage**: Provided by the `Drizzle ORM` adapters and `TanStack Query` hooks.

## External Integrations
- **Neon**: PostgreSQL database.
- **Better Auth**: Authentication provider.
- **Vercel**: Deployment platform.
- **MINEDU**: External institution database (for onboarding).
