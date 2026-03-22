import { PipeTransform, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ZodSchema } from 'zod';

export class ZodValidationPipe implements PipeTransform {
    constructor(private schema: ZodSchema) { }

    transform(value: unknown, metadata: ArgumentMetadata) {
        if (metadata.type !== 'body') return value;

        try {
            return this.schema.parse(value);
        } catch (error) {
            throw new BadRequestException(error);
        }
    }
}
