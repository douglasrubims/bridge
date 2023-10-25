import { Request, Response } from "../../@types/infra";
import { UseCaseTopics } from "../../@types/infra/topics";
import { ILogger } from "../logs/logger";

class MessageProcessor {
  constructor(
    private readonly useCaseTopics: UseCaseTopics,
    private readonly logger: ILogger
  ) {}

  public async processRequest(topic: string, message: Request): Promise<void> {
    if (!this.useCaseTopics) return;

    const { hash, payload, origin, callback, callbackTopic } = message;

    this.logger.log(`Received message on topic <${topic}>`);

    const validation = await this.validatePayload(topic, payload);

    let response: Response = {
      success: false,
      message: "Invalid payload",
      data: { errors: validation?.errors }
    };

    try {
      if (validation?.isValid)
        response = await this.useCaseTopics[topic].useCase(payload);
    } catch (error) {
      response = {
        success: false,
        message: (error as Error).message || String(error) || "Unknown error"
      };
    }

    return response;
  }

  public processCallback(topic: string, message: Request): void {
    const { hash, payload, origin } = message;

    this.logger.log(`Received message from ${origin} on topic <${topic}>`);

    return;
  }

  private async validatePayload(
    topic: string,
    payload: any
  ): Promise<
    | {
        isValid: boolean;
        errors: string[];
      }
    | undefined
  > {
    if (!this.useCaseTopics) return;

    const { validation } = this.useCaseTopics[topic];

    const validator = new BaseValidator(validation);

    return await validator.validate(payload);
  }
}

export { MessageProcessor };
