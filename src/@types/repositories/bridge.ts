import { Response } from "../infra/response";

export interface BridgeRepository {
  dispatch<T>(
    topic: string,
    payload: T | Response<T>,
    callback: boolean
  ): Promise<unknown>;
}
