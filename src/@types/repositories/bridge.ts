import { Response } from "../infra/response";

export interface BridgeRepository {
  dispatch<T, Y>(
    topic: string,
    payload: T,
    callback: boolean
  ): Promise<Response<Y>>;
}
