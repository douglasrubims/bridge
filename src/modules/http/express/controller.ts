import type { Request, Response } from "express";

import type {
  Response as BridgeResponse,
  ExpressRequest
} from "../../../@types";
import type { UseCaseTopics } from "../../../@types/modules/messaging/express";
import { BaseValidator } from "../../validation/base";

class ExpressController {
  constructor(private readonly useCaseTopics: UseCaseTopics) {}

  public async handleRequest(
    req: Request<unknown, unknown, ExpressRequest>,
    res: Response
  ): Promise<Response> {
    try {
      const { topic, payload } = req.body;

      const useCaseTopic = this.useCaseTopics[topic];

      const validator = new BaseValidator(useCaseTopic.validation);

      const validation = await validator.validate(payload);

      let response: BridgeResponse = {
        success: false,
        message: "Invalid payload",
        data: { errors: validation?.errors }
      };

      if (validation.isValid) response = await useCaseTopic.useCase(payload);

      return res.json(response);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Internal server error",
        data: error
      });
    }
  }
}

export { ExpressController };
