# Design Document - Flip v2 Platform

## Status
- **Status**: Approved
- **Owner**: Development Team
- **Reviewers**: Yasmani, Antigravity
- **Last Updated**: 2026-05-04

## Overview
Flip v2 is a comprehensive inventory and reservation management platform designed specifically for educational institutions (IE). It solves the problem of equipment tracking, pedagogical space booking, and maintenance management in a multi-tenant environment.

## Design Goals
- **Multi-tenancy**: Strict data isolation between institutions.
- **Scalability**: Capable of handling thousands of resources and users.
- **User Experience**: Fast, responsive, and utilitarian interface (Jira-inspired).
- **Integrity**: Audit trails for every physical movement of resources.

## Proposed Architecture

### Core Principles
- **Clean Architecture**: Separation of concerns into Domain, Application, and Infrastructure layers within the Next.js `src/` directory.
- **Feature-Sliced Design (FSD)**: Vertical organization of logic by business features (`src/features/`).
- **Server Actions & API Routes**: Efficient data handling using Next.js native capabilities.

### Tech Stack
- **Architecture**: Unified Next.js 15 Architecture (Monolith).
- **Frontend/Backend**: Next.js 15 (App Router) for both UI and API logic.
- **Database**: PostgreSQL (Neon) with Drizzle ORM.
- **Auth**: Better Auth integrated as Next.js middleware.

### Data Models
- **Institutions**: Root entity for multi-tenancy.
- **Resources**: Physical assets (Laptops, Projectors, etc.) with sequential IDs (e.g., LAP-001).
- **Reservations**: Pedagogical space and resource bookings.
- **Loans**: Physical check-out and check-in workflow.
- **Staff**: Institutional user profiles with roles (IE_ADMIN, STAFF, TEACHER).

## Design Decisions

### 1. Jira-inspired "Flat" UI
- **Decision**: Avoid depth, shadows, and rounded corners. Use crisp borders and high-density layouts.
- **Rationale**: Increases information density and focuses on utility rather than decoration, consistent with professional administrative tools.

### 2. Sequential Internal IDs
- **Decision**: Generate human-readable IDs (e.g., AUD-01) per institution/category.
- **Rationale**: Facilitates physical identification in the field by teachers and staff without relying on database UUIDs.

### 3. Dual-path Responsiveness
- **Decision**: Use a Desktop Modal strategy for large screens and a Full-page Wizard strategy for mobiles.
- **Rationale**: Optimizes complex workflows (like reservations) for the specific constraints of touch vs. pointer devices.

## Implementation Status
- [x] Multi-tenant Core
- [x] Inventory Management
- [x] Institutional Onboarding
- [x] Responsive Reservations Dialog
- [/] Incident Management (In progress)
- [/] Advanced Audit Logs (In progress)

## Testing Strategy
- **Unit Tests**: Vitest for business logic.
- **E2E**: Playwright for critical flows (Onboarding, Reservations).
- **Linting**: ESLint and @google/design.md for documentation.

## Security & Privacy
- **AIsolation**: Every DB query is scoped with `institutionId`.
- **RBAC**: Role-based access control (SUPER_ADMIN -> IE_ADMIN -> STAFF -> TEACHER).
