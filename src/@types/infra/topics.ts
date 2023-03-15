import { Response } from "./response";

export interface Topic {
  useCase: (payload: any) => Promise<Response>;
  validation: any;
}

export interface Topics {
  [key: string]: Topic;
}
