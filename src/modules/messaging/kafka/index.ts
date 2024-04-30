import type { RedisOptions } from "ioredis";
import {
  CompressionTypes,
  type Consumer,
  Kafka,
  type KafkaConfig,
  type Producer
} from "kafkajs";
import { v4 as uuidv4 } from "uuid";

import type { Request, Response } from "../../../@types";
import type {
  SubscribedTopic,
  UseCaseTopics
} from "../../../@types/modules/messaging/kafka";
import type { CallbackOptionsProps } from "../../../@types/modules/messaging/kafka";
import type { UpstashConfig } from "../../../@types/modules/messaging/upstash";
import { LogLevel, Logger } from "../../../shared/logs";
import { CallbackStorage } from "../../storage/callback-storage";
import { RedisCallbackStorage } from "../../storage/redis";
import { BaseValidator } from "../../validation/base";
import { UpstashClient } from "../upstash";
import { KafkaConsumer } from "./consumer";
import { KafkaProducer } from "./producer";

class KafkaMessaging {
  private kafka: Kafka;
  private kafkaConsumers: KafkaConsumer[];
  private kafkaProducer: KafkaProducer;
  private logger = Logger.getInstance();
  private redisCallbackStorage?: RedisCallbackStorage;
  private callbackStorage = new CallbackStorage();

  constructor(
    private readonly kafkaConfig: KafkaConfig,
    private readonly groupId: string,
    private readonly origin: string,
    private readonly subscribedTopics: SubscribedTopic[],
    private readonly useCaseTopics?: UseCaseTopics,
    private readonly partitionsConsumedConcurrently?: number,
    private readonly redisOptions?: RedisOptions,
    private readonly upstashConfig?: UpstashConfig
  ) {
    this.kafka = new Kafka(this.kafkaConfig);

    const commonConsumerTopics = this.subscribedTopics.filter(
      topic => !topic.separatedConsumer
    );

    const separatedConsumerTopics = this.subscribedTopics.filter(
      topic => topic.separatedConsumer
    );

    this.kafkaProducer = new KafkaProducer(this.kafka);

    this.kafkaConsumers = [];

    if (commonConsumerTopics.length)
      this.kafkaConsumers.push(
        new KafkaConsumer(
          this.kafka,
          this.groupId,
          commonConsumerTopics.map(topic => `${this.origin}.${topic.name}`)
        )
      );

    if (separatedConsumerTopics.length)
      for (let i = 0; i < separatedConsumerTopics.length; i++)
        this.kafkaConsumers.push(
          new KafkaConsumer(
            this.kafka,
            `${this.groupId}-${separatedConsumerTopics[i].name}`,
            [`${this.origin}.${separatedConsumerTopics[i].name}`]
          )
        );

    if (this.redisOptions)
      this.redisCallbackStorage = new RedisCallbackStorage(this.redisOptions);
  }

  private async syncTopics(): Promise<void> {
    await this.kafka.admin().connect();

    const topicsMetadata = await this.kafka.admin().fetchTopicMetadata();

    const findTopic = (topicName: string) =>
      this.subscribedTopics.find(
        subscribedTopic => `${this.origin}${subscribedTopic.name}` === topicName
      );

    const topicsToModify = topicsMetadata.topics.filter(topicMetadata => {
      const numPartitions = findTopic(topicMetadata.name)?.numPartitions;

      return numPartitions && topicMetadata.partitions.length < numPartitions;
    });

    if (topicsToModify.length) {
      this.logger.log(
        `Modifying partitions for topics: ${topicsToModify
          .map(topicMetadata => topicMetadata.name)
          .join(", ")}`
      );

      const topicPartitions = topicsToModify
        .map(topicMetadata => {
          const topic = findTopic(topicMetadata.name);

          if (!topic) return;

          return {
            topic: topicMetadata.name,
            count: topic.numPartitions - topicMetadata.partitions.length
          };
        })
        .filter(Boolean) as {
        topic: string;
        count: number;
      }[];

      await this.kafka.admin().createPartitions({
        validateOnly: false,
        timeout: 5000,
        topicPartitions
      });
    }

    const topicsToCreate = this.subscribedTopics
      .filter(
        topic =>
          !topicsMetadata.topics.find(
            topicMetadata =>
              topicMetadata.name === `${this.origin}.${topic.name}`
          )
      )
      .filter(
        (topic, index, self) =>
          index ===
          self.findIndex(
            t => `${this.origin}.${t.name}` === `${this.origin}.${topic.name}`
          )
      );

    if (topicsToCreate.length) {
      this.logger.log(
        `Creating topics: ${topicsToCreate
          .map(topic => `${this.origin}.${topic.name}`)
          .join(", ")}`
      );

      await this.kafka.admin().createTopics({
        topics: topicsToCreate.map(topic => ({
          topic: `${this.origin}.${topic.name}`,
          numPartitions: topic.numPartitions ?? -1,
          replicationFactor: -1,
          configEntries: [
            {
              name: "cleanup.policy",
              value: "delete"
            }
          ]
        }))
      });
    }

    await this.kafka.admin().disconnect();
  }

  private get consumers(): Consumer[] {
    return this.kafkaConsumers.map(consumer => consumer.getInstance());
  }

  private get producer(): Producer {
    return this.kafkaProducer.getInstance();
  }

  public async connect(): Promise<void> {
    this.logger.log("Syncing topics...");

    if (this.upstashConfig)
      await new UpstashClient(
        this.upstashConfig,
        this.origin,
        this.subscribedTopics
      ).syncTopics();
    else await this.syncTopics();

    this.logger.log("Connecting to Kafka...");

    await Promise.all([
      this.kafkaProducer.connect(),
      ...this.kafkaConsumers.map(consumer => consumer.connect())
    ]);

    await Promise.all(
      this.consumers.map(consumer =>
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
          partitionsConsumedConcurrently:
            this.partitionsConsumedConcurrently ?? 1
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

        await this.producer.sendBatch({
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
          origin: this.origin,
          request: true,
          callback: callbackOptions.callback,
          callbackTopic: callbackOptions.callbackTopic
        };

        this.producer
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

export { KafkaMessaging };
