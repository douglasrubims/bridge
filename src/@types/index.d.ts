import { Bridge } from "..";

import { LogLevel } from "../shared/logs";

import { Request } from ".";
import { Response } from ".";
import { UseCaseTopics } from "./modules/messaging/kafka";

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
