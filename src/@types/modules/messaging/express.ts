import type { Response } from "../../";
import type { ValidationSchema } from "../../../modules/validation/validation-schema";

export interface UseCaseTopic {
  useCase: (payload: any) => Promise<Response>;
  validation: ValidationSchema;
}

export interface UseCaseTopics {
  [key: string]: UseCaseTopic;
}
