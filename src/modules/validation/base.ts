import type { ValidationSchema } from "./validation-schema";

export class BaseValidator {
  constructor(private readonly schema: ValidationSchema) {}

  async validate(data: Record<string, unknown>): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    return await this.schema.handle(data);
  }
}
