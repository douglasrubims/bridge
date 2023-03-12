export interface ValidationSchema {
  handle(data: Record<string, unknown>): Promise<{
    isValid: boolean;
    errors: string[];
  }>;
}
