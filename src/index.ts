import type { BridgeOptions } from "./@types";
import { Request, Response } from "./@types";
import { KafkaMessaging } from "./modules/messaging/kafka";
import { Logger } from "./shared/logs";

class Bridge {
  private kafkaMessaging?: KafkaMessaging;
  private logger = Logger.getInstance();

  constructor(private readonly options: BridgeOptions) {
    const { microserviceName, logLevel, kafka } = this.options;

    this.logger.setOrigin(microserviceName);
    this.logger.setLogLevel(logLevel);

    this.logger.log("Initializing bridge...");

    if (kafka)
      this.kafkaMessaging = new KafkaMessaging(
        kafka.kafkaConfig,
        kafka.groupId,
        String(kafka.subscribedOrigin ?? microserviceName).toLowerCase(),
        kafka.subscribedTopics,
        kafka.useCaseTopics,
        kafka.partitionsConsumedConcurrently,
        kafka.redisConfig,
        kafka.upstashConfig
      );
  }

  async connect() {
    if (this.kafkaMessaging) await this.kafkaMessaging.connect();
  }

  get kafka() {
    return this.kafkaMessaging;
  }
}

export { Bridge, Request as BridgeRequest, Response as BridgeResponse };
