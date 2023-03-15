import { Bridge } from "../";

declare global {
  namespace Express {
    interface Request {
      bridge: Bridge;
    }
  }
}

export {};
