/**
 * Value Objects - Inmutable domain primitives
 * These encapsulate validation rules and behavior for domain concepts
 */

// ============================================
// INSTITUTION ID
// ============================================
export class InstitutionId {
    private readonly _value: string;

    private constructor(value: string) {
        this._value = value;
    }

    static create(value: string): InstitutionId {
        if (!value || value.trim().length === 0) {
            throw new Error('InstitutionId cannot be empty');
        }
        return new InstitutionId(value.trim());
    }

    static fromString(value: string): InstitutionId {
        return InstitutionId.create(value);
    }

    get value(): string {
        return this._value;
    }

    equals(other: InstitutionId): boolean {
        return this._value === other._value;
    }

    toString(): string {
        return this._value;
    }
}

// ============================================
// INTERNAL ID (Resource identifier like MON-001)
// ============================================
export class InternalId {
    private readonly _prefix: string;
    private readonly _number: number;

    private constructor(prefix: string, number: number) {
        this._prefix = prefix;
        this._number = number;
    }

    static create(prefix: string, number: number): InternalId {
        if (!prefix || prefix.length < 2 || prefix.length > 5) {
            throw new Error('Prefix must be 2-5 characters');
        }
        if (number < 1 || number > 99999) {
            throw new Error('Number must be between 1 and 99999');
        }
        return new InternalId(prefix.toUpperCase(), number);
    }

    static fromString(value: string): InternalId {
        const match = value.match(/^([A-Z]{2,5})-(\d{3,5})$/);
        if (!match) {
            throw new Error(`Invalid internal ID format: ${value}`);
        }
        return new InternalId(match[1], parseInt(match[2], 10));
    }

    static generatePrefix(categoryName: string): string {
        return categoryName
            .replace(/[^a-zA-Z]/g, '')
            .substring(0, 3)
            .toUpperCase() || 'REC';
    }

    get prefix(): string {
        return this._prefix;
    }

    get number(): number {
        return this._number;
    }

    toString(): string {
        return `${this._prefix}-${String(this._number).padStart(3, '0')}`;
    }

    equals(other: InternalId): boolean {
        return this._prefix === other._prefix && this._number === other._number;
    }
}

// ============================================
// EMAIL
// ============================================
export class Email {
    private readonly _value: string;

    private constructor(value: string) {
        this._value = value;
    }

    static create(value: string): Email {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const normalized = value.trim().toLowerCase();

        if (!emailRegex.test(normalized)) {
            throw new Error(`Invalid email format: ${value}`);
        }

        return new Email(normalized);
    }

    static fromString(value: string): Email {
        return Email.create(value);
    }

    get value(): string {
        return this._value;
    }

    get domain(): string {
        return this._value.split('@')[1];
    }

    equals(other: Email): boolean {
        return this._value === other._value;
    }

    toString(): string {
        return this._value;
    }
}

// ============================================
// DNI (Peruvian ID number)
// ============================================
export class DNI {
    private readonly _value: string;

    private constructor(value: string) {
        this._value = value;
    }

    static create(value: string): DNI {
        const cleaned = value.replace(/\D/g, '');

        if (cleaned.length !== 8) {
            throw new Error('DNI must be 8 digits');
        }

        return new DNI(cleaned);
    }

    static isValid(value: string): boolean {
        try {
            DNI.create(value);
            return true;
        } catch {
            return false;
        }
    }

    get value(): string {
        return this._value;
    }

    toString(): string {
        return this._value;
    }

    equals(other: DNI): boolean {
        return this._value === other._value;
    }
}
