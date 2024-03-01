import { ValidationSchema } from "../../infra/validations/validation-schema";
import { Response } from "./response";

export interface SubscribedTopic {
  name: string;
  numPartitions: number;
  separatedConsumer?: boolean;
}

export interface UseCaseTopic {
  useCase: (payload: unknown) => Promise<Response>;
  validation: ValidationSchema;
  numPartitions?: number;
  separatedConsumer?: boolean;
}

export interface UseCaseTopics {
  [key: string]: UseCaseTopic;
}
