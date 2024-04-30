import type { Response } from "../../";
import type { ValidationSchema } from "../../../modules/validation/validation-schema";

export interface CallbackOptionsProps {
  callback: boolean;
  callbackTopic?: string;
}

export interface SubscribedTopic {
  name: string;
  numPartitions: number;
  separatedConsumer?: boolean;
}

export interface UseCaseTopic {
  useCase: (payload: any) => Promise<Response>;
  validation: ValidationSchema;
  numPartitions?: number;
  separatedConsumer?: boolean;
}

export interface UseCaseTopics {
  [key: string]: UseCaseTopic;
}
