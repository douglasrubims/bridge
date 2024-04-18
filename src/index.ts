import type { RedisOptions } from "ioredis";
import { CompressionTypes, type KafkaConfig } from "kafkajs";
import { v4 as uuidv4 } from "uuid";

import { Request } from "./@types/infra/request";
import { Response } from "./@types/infra/response";
import type { SubscribedTopic, UseCaseTopics } from "./@types/infra/topics";
import type {
  BridgeRepository,
  CallbackOptionsProps
} from "./@types/repositories/bridge";
import { LogLevel, Logger } from "./infra/logs/logger";
import { KafkaClient, KafkaMessaging } from "./infra/messaging";
import { CallbackStorage } from "./infra/storage/callback-storage";
import { RedisCallbackStorage } from "./infra/storage/redis";
import { BaseValidator } from "./infra/validations/base";

class Bridge implements BridgeRepository {
  private kafkaClient: KafkaClient;
  private kafkaMessaging: KafkaMessaging;
  private redisCallbackStorage?: RedisCallbackStorage;
  private callbackStorage = new CallbackStorage();
  private logger = Logger.getInstance();

  constructor(
    private readonly origin: string,
    private readonly kafkaConfig: KafkaConfig,
    private readonly groupId: string,
    private readonly subscribedTopics: SubscribedTopic[],
    private readonly logLevel: LogLevel,
    private readonly useCaseTopics?: UseCaseTopics,
    private readonly subscribedOrigin?: string,
    private readonly partitionsConsumedConcurrently = 1,
    private readonly redisOptions?: RedisOptions
  ) {
    this.logger.setOrigin(this.origin);
    this.logger.setLogLevel(this.logLevel);

    this.logger.log("Initializing bridge...");

    this.kafkaClient = new KafkaClient(this.kafkaConfig);

    const kafka = this.kafkaClient.getInstance();

    this.kafkaMessaging = new KafkaMessaging(
      kafka,
      this.groupId,
      subscribedOrigin ?? origin,
      this.subscribedTopics
    );

    if (this.redisOptions)
      this.redisCallbackStorage = new RedisCallbackStorage(this.redisOptions);
  }

  public async connect(): Promise<void> {
    this.logger.log("Syncing topics...");

    await this.kafkaMessaging.syncTopics();

    this.logger.log("Connecting to Kafka...");

    await this.kafkaMessaging.connect();

    await Promise.all(
      this.kafkaMessaging.consumers.map(consumer =>
        consumer.run({
          eachMessage: async ({ topic, message }) => {
            if (!message.value) return;

            topic = topic.split(".")[1];

            this.logger.log(
              `Received Message on topic <${topic}>: ${message.value.toString()}`,
              LogLevel.DEBUG
            );

            await this.process(topic, JSON.parse(message.value.toString()));
          },
          partitionsConsumedConcurrently: this.partitionsConsumedConcurrently
        })
      )
    );
  }

  private async process(topic: string, message: Request): Promise<void> {
    if (message.request) await this.processRequest(topic, message);
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
        message: (error as Error).message || String(error) || "Unknown error"
      };
    } finally {
      if (callback) {
        const realCallbackTopic = callbackTopic ? callbackTopic : topic;

        await this.kafkaMessaging.producer.sendBatch({
          compression: CompressionTypes.GZIP,
          topicMessages: [
            {
              topic: `${origin}.${realCallbackTopic}`,
              messages: [
                {
                  value: JSON.stringify({
                    hash,
                    payload: response,
                    origin: this.origin,
                    request: false,
                    callback: false
                  })
                }
              ]
            }
          ]
        });

        this.logger.log(`Sent message to ${origin} on topic <${topic}>`);
        this.logger.log(`Message: ${JSON.stringify(response)}`, LogLevel.DEBUG);
      }
    }
  }

  private async validatePayload(
    topic: string,
    payload: Record<string, unknown>
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
  ): Promise<void> {
    const { hash, payload, origin } = message;

    const storage = this.redisCallbackStorage ?? this.callbackStorage;

    const record = await storage.get(hash);

    if (!record) return;

    this.logger.log(`Received message from ${origin} on topic <${topic}>`);

    storage.remove(hash);

    record.resolve(payload);
  }

  public async dispatch<T, Y>(
    topic: string,
    payload: T,
    callbackOptions: CallbackOptionsProps = {
      callback: true,
      callbackTopic: undefined
    }
  ): Promise<Response<Y>> {
    return new Promise((resolve, reject) => {
      try {
        const hash = uuidv4();

        const message: Request<T> = {
          hash,
          payload,
          origin: this.subscribedOrigin ?? this.origin,
          request: true,
          callback: callbackOptions.callback,
          callbackTopic: callbackOptions.callbackTopic
        };

        this.kafkaMessaging.producer
          .sendBatch({
            compression: CompressionTypes.GZIP,
            topicMessages: [
              {
                topic,
                messages: [{ value: JSON.stringify(message) }]
              }
            ]
          })
          .then(() => {
            if (callbackOptions.callback)
              (this.redisCallbackStorage ?? this.callbackStorage).add<Y>(
                hash,
                resolve
              );
            else resolve({ success: true, message: "Message sent" });

            const microservice = topic.split(".")[0];
            const messageTopic = topic.split(".")[1];

            this.logger.log(
              `Sent message to ${microservice} on topic <${messageTopic}>`
            );
            this.logger.log(
              `Message: ${JSON.stringify(message)}`,
              LogLevel.DEBUG
            );
          })
          .catch(error => {
            throw error;
          });
      } catch (error) {
        this.logger.log(
          `Error sending message to ${topic}: ${
            (error as Error).message ?? String(error)
          }`
        );

        reject(error);
      }
    });
  }
}

export { Bridge, Request as BridgeRequest, Response as BridgeResponse };
