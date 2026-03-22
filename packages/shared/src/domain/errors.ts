/**
 * Domain Errors - Custom error types for domain-specific failures
 */

export abstract class DomainError extends Error {
    abstract readonly code: string;

    constructor(message: string) {
        super(message);
        this.name = this.constructor.name;
    }
}

// ============================================
// NOT FOUND ERRORS
// ============================================
export class ResourceNotFoundError extends DomainError {
    readonly code = 'RESOURCE_NOT_FOUND';

    constructor(resourceId: string) {
        super(`Resource with ID ${resourceId} not found`);
    }
}

export class CategoryNotFoundError extends DomainError {
    readonly code = 'CATEGORY_NOT_FOUND';

    constructor(categoryId: string) {
        super(`Category with ID ${categoryId} not found`);
    }
}

export class InstitutionNotFoundError extends DomainError {
    readonly code = 'INSTITUTION_NOT_FOUND';

    constructor(institutionId: string) {
        super(`Institution with ID ${institutionId} not found`);
    }
}

export class StaffNotFoundError extends DomainError {
    readonly code = 'STAFF_NOT_FOUND';

    constructor(staffId: string) {
        super(`Staff member with ID ${staffId} not found`);
    }
}

// ============================================
// VALIDATION ERRORS
// ============================================
export class InvalidEmailError extends DomainError {
    readonly code = 'INVALID_EMAIL';

    constructor(email: string) {
        super(`Invalid email format: ${email}`);
    }
}

export class InvalidDNIError extends DomainError {
    readonly code = 'INVALID_DNI';

    constructor(dni: string) {
        super(`Invalid DNI format: ${dni}. Must be 8 digits.`);
    }
}

export class InvalidInternalIdError extends DomainError {
    readonly code = 'INVALID_INTERNAL_ID';

    constructor(internalId: string) {
        super(`Invalid internal ID format: ${internalId}. Expected format: XXX-000`);
    }
}

// ============================================
// BUSINESS RULE ERRORS
// ============================================
export class ResourceAlreadyLoanedError extends DomainError {
    readonly code = 'RESOURCE_ALREADY_LOANED';

    constructor(resourceId: string) {
        super(`Resource ${resourceId} is already loaned and cannot be loaned again`);
    }
}

export class CategoryHasResourcesError extends DomainError {
    readonly code = 'CATEGORY_HAS_RESOURCES';

    constructor(categoryId: string, resourceCount: number) {
        super(`Cannot delete category ${categoryId}: ${resourceCount} resources are using it`);
    }
}

export class DuplicateCategoryNameError extends DomainError {
    readonly code = 'DUPLICATE_CATEGORY_NAME';

    constructor(name: string) {
        super(`A category with name "${name}" already exists in this institution`);
    }
}

export class UnauthorizedInstitutionAccessError extends DomainError {
    readonly code = 'UNAUTHORIZED_INSTITUTION_ACCESS';

    constructor() {
        super('You do not have access to this institution');
    }
}
