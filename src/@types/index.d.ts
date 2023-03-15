import { BridgeRepository } from "./repositories/bridge";

import { Request } from "./infra/request";
import { Response } from "./infra/response";
import { Topics } from "./infra/topics";

declare global {
  namespace Express {
    interface Request {
      bridge: BridgeRepository;
    }
  }
}

export {
  BridgeRepository as Bridge,
  Request as BridgeRequest,
  Response as BridgeResponse,
  Topics as BridgeTopics
};
