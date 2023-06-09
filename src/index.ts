import { v4 as uuidv4 } from "uuid";

import { BridgeRepository } from "./@types/repositories/bridge";

import { Request } from "./@types/infra/request";
import { Response } from "./@types/infra/response";
import { SubscribedTopic, UseCaseTopics } from "./@types/infra/topics";

import { logger, LogLevel } from "./infra/logs/logger";

import { CallbackStorage } from "./infra/http/callback-storage";

import { KafkaClient, KafkaMessaging } from "./infra/messaging";

import { BaseValidator } from "./infra/validations/base";

class Bridge implements BridgeRepository {
  private kafkaClient: KafkaClient;
  private kafkaMessaging: KafkaMessaging;
  private callbackStorage = new CallbackStorage();

  constructor(
    private readonly origin: string,
    private readonly kafkaConfig: {
      clientId: string;
      brokers: string[];
      sasl?: {
        mechanism: "scram-sha-512";
        username: string;
        password: string;
      };
      ssl?: boolean;
    },
    private readonly groupId: string,
    private readonly subscribedTopics: SubscribedTopic[],
    private readonly logLevel: LogLevel,
    private readonly useCaseTopics?: UseCaseTopics,
    private readonly subscribedOrigin?: string
  ) {
    logger.setLogLevel(this.logLevel);

    logger.log("Initializing bridge...");

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
      subscribedOrigin ?? origin,
      this.subscribedTopics
    );
  }

  public async connect(): Promise<void> {
    logger.log("Syncing topics...");

    await this.kafkaMessaging.syncTopics();

    logger.log("Connecting to Kafka...");

    await this.kafkaMessaging.connect();

    await this.kafkaMessaging.consumer.run({
      eachMessage: async ({ topic, message }) => {
        if (!message.value) return;

        topic = topic.split(".")[1];

        logger.log(
          `Received Message on topic <${topic}>: ${message.value.toString()}`,
          LogLevel.DEBUG
        );

        await this.process(topic, JSON.parse(message.value.toString()));
      }
    });
  }

  private async process(topic: string, message: Request): Promise<void> {
    if (message.callback) await this.processRequest(topic, message);
    else this.processCallback(topic, message);
  }

  private async processRequest(topic: string, message: Request): Promise<void> {
    if (!this.useCaseTopics) return;

    const { hash, payload, origin, callback, callbackTopic } = message;

    logger.log(`Received message on topic <${topic}>`);

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

        logger.log(`Sent message to ${origin} on topic <${topic}>`);
        logger.log(`Message: ${JSON.stringify(response)}`, LogLevel.DEBUG);
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

  private processCallback(topic: string, message: Request): void {
    const { hash, payload, origin } = message;

    const record = this.callbackStorage.get(hash);

    if (!record) return;

    logger.log(`Received message from ${origin} on topic <${topic}>`);

    this.callbackStorage.remove(hash);

    record.resolve(payload);
  }

  public async dispatch<T, Y>(topic: string, payload: T): Promise<Response<Y>> {
    return new Promise((resolve, reject) => {
      try {
        const hash = uuidv4();

        this.callbackStorage.add<Y>(hash, resolve);

        const message: Request<T> = {
          hash,
          payload,
          origin: this.subscribedOrigin ?? this.origin,
          callback: true
        };

        this.kafkaMessaging.producer.send({
          topic,
          messages: [{ value: JSON.stringify(message) }]
        });

        const microservice = topic.split(".")[0];
        const messageTopic = topic.split(".")[1];

        logger.log(
          `Sent message to ${microservice} on topic <${messageTopic}>`
        );
        logger.log(`Message: ${JSON.stringify(message)}`, LogLevel.DEBUG);
      } catch (error) {
        logger.log(
          `Error while sending message to ${topic}: ${
            (error as Error).message ?? String(error)
          }`
        );

        reject(error);
      }
    });
  }
}

export { Bridge, Request as BridgeRequest, Response as BridgeResponse };
