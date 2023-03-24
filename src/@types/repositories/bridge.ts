import {
  Request as ExpressRequest,
  Response as ExpressResponse,
  NextFunction as ExpressNextFunction
} from "express";

import { Response } from "../infra/response";

export interface BridgeRepository {
  dispatch<T, Y>(
    topic: string,
    payload: Response<T>,
    request?: ExpressRequest,
    response?: ExpressResponse,
    callback?: (
      payload: Response,
      request?: Y,
      response?: ExpressResponse
    ) => Promise<ExpressResponse | undefined>,
    callbackTopic?: string
  ): Promise<void>;
}
