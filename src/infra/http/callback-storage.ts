import {
  Request as ExpressRequest,
  Response as ExpressResponse
} from "express";

import { Response } from "../../@types/infra/response";

export interface CallbackProps<T extends ExpressRequest = any> {
  hash: string;
  request?: ExpressRequest;
  response?: ExpressResponse;
  callback?: (
    payload: Response,
    request: T,
    response: ExpressResponse
  ) => Promise<ExpressResponse | undefined>;
  callbackTopic?: string;
}

class CallbackStorage {
  private requests: CallbackProps[] = [];

  add<T>(
    hash: string,
    request?: ExpressRequest,
    response?: ExpressResponse,
    callback?: (
      payload: Response,
      request?: T,
      response?: ExpressResponse
    ) => Promise<ExpressResponse | undefined>,
    callbackTopic?: string
  ) {
    this.requests.push({ hash, request, response, callback, callbackTopic });
  }

  get(hash: string) {
    return this.requests.find(request => request.hash === hash);
  }

  remove(hash: string) {
    this.requests = this.requests.filter(request => request.hash !== hash);
  }
}

export { CallbackStorage };
