import { Response } from "./response";

export interface Request<T = any> {
  hash: string;
  payload: Response<T>;
  origin: string;
  callback?: boolean;
  callbackTopic?: string;
}
