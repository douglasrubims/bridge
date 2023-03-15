import { Bridge } from "..";

import { Request } from "./infra/request";
import { Response } from "./infra/response";
import { Topics } from "./infra/topics";

declare global {
  namespace Express {
    interface Request {
      bridge: Bridge;
    }
  }
}

export {
  Bridge,
  Request as BridgeRequest,
  Response as BridgeResponse,
  Topics as BridgeTopics
};
