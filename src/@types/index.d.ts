import { Bridge } from "..";

import { LogLevel } from "../shared/utils/logger";

import { Request } from "./infra/request";
import { Response } from "./infra/response";
import { UseCaseTopics } from "./infra/topics";

declare global {
  namespace Express {
    interface Request {
      bridge: Bridge;
    }
  }
}

export {
  Bridge,
  LogLevel,
  Request as BridgeRequest,
  Response as BridgeResponse,
  UseCaseTopics as BridgeUseCaseTopics
};
