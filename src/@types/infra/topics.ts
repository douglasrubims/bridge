import { Response } from "./response";

export interface UseCaseTopic {
  useCase: (payload: any) => Promise<Response>;
  validation: any;
}

export interface UseCaseTopics {
  [key: string]: UseCaseTopic;
}
