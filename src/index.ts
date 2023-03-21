import {
  Request as ExpressRequest,
  Response as ExpressResponse,
  NextFunction as ExpressNextFunction
} from "express";
import { v4 as uuidv4 } from "uuid";

import { BridgeRepository } from "./@types/repositories/bridge";

import { Request } from "./@types/infra/request";
import { Response } from "./@types/infra/response";
import { UseCaseTopics } from "./@types/infra/topics";

import { Logger } from "./shared/utils/logger";

import { CallbackStorage } from "./infra/http/callback-storage";

import { KafkaClient, KafkaMessaging } from "./infra/messaging";

import { BaseValidator } from "./infra/validations/base";

class Bridge implements BridgeRepository {
  private logger: Logger;
  private kafkaClient: KafkaClient;
  private kafkaMessaging: KafkaMessaging;
  private callbackStorage = new CallbackStorage();

  constructor(
    private readonly origin: string,
    private readonly kafkaConfig: {
      clientId: string;
      brokers: string[];
      sasl: {
        mechanism: "scram-sha-512";
        username: string;
        password: string;
      };
      ssl: boolean;
    },
    private readonly groupId: string,
    private readonly subscribedTopics: string[],
    private readonly useCaseTopics?: UseCaseTopics,
    private readonly subscribedOrigin?: string
  ) {
    this.logger = new Logger(origin);

    this.logger.log("Initializing bridge...");

    this.kafkaClient = new KafkaClient(
      this.kafkaConfig.clientId,
      this.kafkaConfig.brokers,
      this.kafkaConfig.sasl,
      this.kafkaConfig.ssl
    );

    const kafka = this.kafkaClient.getInstance();

    this.kafkaMessaging = new KafkaMessaging(
      kafka,
      this.groupId,
      this.subscribedTopics.map(
        topic => `${subscribedOrigin ?? origin}.${topic}`
      )
    );
  }

  public async middleware(
    req: ExpressRequest,
    _res: ExpressResponse,
    next: ExpressNextFunction
  ): Promise<void> {
    req.bridge = this;

    next();
  }

  public async connect(): Promise<void> {
    this.logger.log("Connecting to Kafka...");

    await this.kafkaMessaging.connect();

    await this.kafkaMessaging.consumer.run({
      eachMessage: async ({ topic, message }) => {
        if (!message.value) return;

        topic = topic.split(".")[1];

        await this.process(topic, JSON.parse(message.value.toString()));
      }
    });
  }

  private async process(topic: string, message: Request): Promise<void> {
    if (message.callback) await this.processRequest(topic, message);
    else await this.processCallback(topic, message);
  }

  private async processRequest(topic: string, message: Request): Promise<void> {
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
        message: (error as Error).message || "Unknown error"
      };
    } finally {
      if (callback) {
        if (callbackTopic) topic = callbackTopic;

        await this.kafkaMessaging.producer.send({
          topic: `${origin}.${topic}`,
          messages: [
            {
              value: JSON.stringify({
                hash,
                payload: response,
                origin: this.origin,
                callback: false
              })
            }
          ]
        });

        this.logger.log(`Sent message to ${origin} on topic <${topic}>`);
      }
    }
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

  private async processCallback(
    topic: string,
    message: Request
  ): Promise<ExpressResponse | undefined> {
    const { hash, payload, origin, callback, callbackTopic } = message;

    const record = this.callbackStorage.get(hash);

    if (!record) return;

    this.logger.log(`Received message from ${origin} on topic <${topic}>`);

    this.callbackStorage.remove(hash);

    if (!record.request || !record.response) return;

    if (!record.callback) return record.response.json(payload);

    if (!payload.success) return record.response.status(500).json(payload);

    return await record.callback(payload, record.request, record.response);
  }

  public async dispatch<T, Y>(
    topic: string,
    payload: T | Response<T>,
    request?: ExpressRequest,
    response?: ExpressResponse,
    callback?: (
      payload: Response,
      request?: Y,
      response?: ExpressResponse
    ) => Promise<ExpressResponse | undefined>,
    callbackTopic?: string
  ): Promise<void> {
    const hash = uuidv4();

    this.callbackStorage.add<Y>(
      hash,
      request,
      response,
      callback,
      callbackTopic
    );

    const message: Request<T> = {
      hash,
      payload,
      origin: this.subscribedOrigin ?? this.origin,
      callback: !!(request && response),
      callbackTopic
    };

    this.kafkaMessaging.producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }]
    });

    const microservice = topic.split(".")[0];
    const messageTopic = topic.split(".")[1];

    this.logger.log(
      `Sent message to ${microservice} on topic <${
        callbackTopic ?? messageTopic
      }>`
    );
  }
}

export { Bridge, Request as BridgeRequest, Response as BridgeResponse };
