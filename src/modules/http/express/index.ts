import axios from "axios";
import type { Router } from "express";
import jwt from "jsonwebtoken";

import type { ExpressRequest, Response } from "../../../@types";
import type { UseCaseTopics } from "../../../@types/modules/messaging/express";
import { Logger } from "../../../shared/logs";
import { ExpressRouter } from "./router";

class ExpressHandler {
  private expressRouter: ExpressRouter;
  private logger = Logger.getInstance();

  constructor(
    private readonly secretToken: string,
    private readonly useCaseTopics: UseCaseTopics
  ) {
    this.expressRouter = new ExpressRouter(
      this.secretToken,
      this.useCaseTopics
    );
  }

  get router(): Router {
    return this.expressRouter.router;
  }

  public async dispatch<Input, Output>(
    hostUrl: string,
    topic: string,
    payload: Input
  ): Promise<Response<Output>> {
    const request: ExpressRequest<Input> = {
      topic,
      payload
    };

    this.logger.log(
      `Requesting to ${hostUrl} on ${topic}: ${JSON.stringify(request)}`
    );

    const token = jwt.sign({}, this.secretToken, {
      expiresIn: 300
    });

    const response = await axios.post<Response<Output>>(
      `${hostUrl}/bridge`,
      request,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return response.data;
  }
}

export { ExpressHandler };
