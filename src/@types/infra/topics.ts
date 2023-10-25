import { Response } from "./response";

export interface SubscribedTopic {
  name: string;
  numPartitions?: number;
  separatedConsumer?: boolean;
}

export interface UseCaseTopic {
  useCase: (payload: any) => Promise<Response>;
  validation: any;
  numPartitions?: number;
}

export interface UseCaseTopics {
  [key: string]: UseCaseTopic;
}
