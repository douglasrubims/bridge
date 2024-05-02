import type { Request, Response } from "express";

import type {
  Response as BridgeResponse,
  ExpressRequest
} from "../../../@types";
import type { UseCaseTopics } from "../../../@types/modules/messaging/express";
import { LogLevel, Logger } from "../../../shared/logs";
import { BaseValidator } from "../../validation/base";

class ExpressController {
  private logger = Logger.getInstance();

  public handleRequest(useCaseTopics: UseCaseTopics) {
    return async (
      req: Request<unknown, unknown, ExpressRequest>,
      res: Response
    ): Promise<Response> => {
      try {
        const { topic, payload } = req.body;

        this.logger.log(`Received request on topic: ${topic}`);
        this.logger.log(
          `Payload: ${JSON.stringify(payload, null, 2)}`,
          LogLevel.DEBUG
        );

        const useCaseTopic = useCaseTopics[topic];

        const validator = new BaseValidator(useCaseTopic.validation);

        const validation = await validator.validate(payload);

        let response: BridgeResponse = {
          success: false,
          message: "Invalid payload",
          data: { errors: validation?.errors }
        };

        if (validation.isValid) response = await useCaseTopic.useCase(payload);

        this.logger.log(
          `Response: ${JSON.stringify(response, null, 2)}`,
          LogLevel.DEBUG
        );

        return res.json(response);
      } catch (error) {
        console.log(error);

        return res.status(400).json({
          success: false,
          message: "Internal server error",
          data: error
        });
      }
    };
  }
}

export { ExpressController };
