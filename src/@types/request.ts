export interface Request<T = any> {
  hash: string;
  payload: T;
  origin: string;
  callback?: boolean;
  callbackTopic?: string;
}
