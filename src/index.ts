import type {
  BridgeOptions,
  ExpressRequest,
  KafkaRequest,
  Response
} from "./@types";
import { ExpressHandler } from "./modules/http/express";
import { KafkaMessaging } from "./modules/messaging/kafka";
import { Logger } from "./shared/logs";

class Bridge {
  private expressHandler?: ExpressHandler;
  private kafkaMessaging?: KafkaMessaging;
  private logger = Logger.getInstance();

  constructor(private readonly options: BridgeOptions) {
    const { microserviceName, logLevel, express, kafka } = this.options;

    this.logger.setOrigin(microserviceName);
    this.logger.setLogLevel(logLevel);

    this.logger.log("Initializing bridge...");

    if (express)
      this.expressHandler = new ExpressHandler(
        express.secretToken,
        express.useCaseTopics
      );

    if (kafka)
      this.kafkaMessaging = new KafkaMessaging(
        kafka.kafkaConfig,
        kafka.groupId,
        String(kafka.subscribedOrigin ?? microserviceName).toLowerCase(),
        kafka.subscribedTopics,
        kafka.useCaseTopics,
        kafka.partitionsConsumedConcurrently,
        kafka.redisConfig
      );
  }

  async connect(): Promise<void> {
    if (this.kafkaMessaging) await this.kafkaMessaging.connect();
  }

  get kafka(): KafkaMessaging {
    if (!this.kafkaMessaging)
      throw new Error("Kafka messaging is not initialized");

    return this.kafkaMessaging;
  }

  get express(): ExpressHandler {
    if (!this.expressHandler)
      throw new Error("Express router is not initialized");

    return this.expressHandler;
  }
}

export {
  Bridge,
  type ExpressRequest as BridgeExpressRequest,
  type KafkaRequest as BridgeKafkaRequest,
  type Response as BridgeResponse
};
