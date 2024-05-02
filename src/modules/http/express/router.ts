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

    this.expressMiddleware = new ExpressMiddleware();
    this.expressController = new ExpressController();

    this.initializeRoute();
  }

  private initializeRoute(): void {
    this.expressRouter.post(
      "/bridge",
      this.expressMiddleware.verifyToken(this.secretToken),
      this.expressController.handleRequest(this.useCaseTopics)
    );
  }

  get router(): Router {
    return this.expressRouter;
  }
}

export { ExpressRouter };
