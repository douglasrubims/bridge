export interface Request<T = any> {
  hash: string;
  payload: T;
  origin: string;
  request: boolean;
  callback?: boolean;
  callbackTopic?: string;
}
