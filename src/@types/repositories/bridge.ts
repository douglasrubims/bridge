import type { Response } from "../infra/response";

export interface CallbackOptionsProps {
  callback: boolean;
  callbackTopic?: string;
}

export interface BridgeRepository {
  connect(): Promise<void>;
  dispatch<T, Y>(
    topic: string,
    payload: T,
    callbackOptions: CallbackOptionsProps
  ): Promise<Response<Y>>;
}
