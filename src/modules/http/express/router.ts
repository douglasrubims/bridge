import { Router } from "express";

import type { UseCaseTopics } from "../../../@types/modules/messaging/express";
import { ExpressController } from "./controller";
import { ExpressMiddleware } from "./middleware";

class ExpressRouter {
  private expressRouter: Router;
  private expressMiddleware: ExpressMiddleware;
  private expressController: ExpressController;

  constructor(
    private readonly secretToken: string,
    private readonly useCaseTopics: UseCaseTopics
  ) {
    this.expressRouter = Router();

    this.expressMiddleware = new ExpressMiddleware(this.secretToken);
    this.expressController = new ExpressController(this.useCaseTopics);

    this.initializeRoute();
  }

  private initializeRoute(): void {
    this.expressRouter.post(
      "/bridge",
      this.expressMiddleware.verifyToken,
      this.expressController.handleRequest
    );
  }

  get router(): Router {
    return this.expressRouter;
  }
}

export { ExpressRouter };
