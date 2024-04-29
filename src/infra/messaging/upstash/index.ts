import axios, { type AxiosInstance } from "axios";

import type { SubscribedTopic } from "../../../@types/infra/topics";
import type {
  KafkaTopicDetails,
  UpstashConfig
} from "../../../@types/infra/upstash";
import { Logger } from "../../logs/logger";

class UpstashClient {
  private readonly api: AxiosInstance;
  private logger = Logger.getInstance();

  constructor(
    private readonly upstashConfig: UpstashConfig,
    private readonly origin: string,
    private readonly subscribedTopics: SubscribedTopic[]
  ) {
    this.api = axios.create({
      baseURL: "https://api.upstash.com/v2/kafka",
      headers: { Authorization: `Bearer ${this.upstashConfig.token}` }
    });
  }

  async syncTopics(): Promise<void> {
    try {
      const responseTopics = await this.api.get<KafkaTopicDetails[]>(
        `/topics/${this.upstashConfig.clusterId}`
      );

      const topics = responseTopics.data;

      const toAdd = this.subscribedTopics.filter(
        subscribedTopic =>
          !topics.find(
            topic =>
              topic.topic_name === `${this.origin}.${subscribedTopic.name}`
          )
      );

      this.logger.log(
        `Creating topics: ${toAdd.map(topic => topic.name).join(", ")}`
      );

      for (const topic of toAdd) {
        await this.api.post("/topic", {
          name: `${this.origin}.${topic.name}`,
          partitions: topic.numPartitions,
          retention_time: 604800000,
          retention_size: 268435456,
          max_message_size: 10485760,
          cleanup_policy: "delete",
          clusterId: this.upstashConfig.clusterId
        });
      }

      this.logger.log("Topics created successfully");
    } catch (error) {
      this.logger.log((error as Error).message);
    }
  }
}

export { UpstashClient };
