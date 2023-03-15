import { Bridge } from "../";
import * as Types from "./";

declare global {
  namespace Express {
    interface Request {
      bridge: Bridge;
    }
  }
}

declare module "bridge" {
  export { Bridge, Types };
}
