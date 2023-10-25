import { Kafka, Consumer, Producer } from "kafkajs";

import { KafkaClient } from "./kafka";
import { KafkaConsumer } from "./kafka/consumer";
import { KafkaProducer } from "./kafka/producer";

import { SubscribedTopic } from "../../@types/infra/topics";

import { Logger } from "../logs/logger";

class KafkaMessaging {
  private kafkaConsumers: KafkaConsumer[];
  private kafkaProducer: KafkaProducer;
  private logger = Logger.getInstance();

  constructor(
    private readonly kafka: Kafka,
    private readonly groupId: string,
    private readonly origin: string,
    private readonly subscribedTopics: SubscribedTopic[]
  ) {
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
  }

  public async syncTopics(): Promise<void> {
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

      await this.kafka.admin().createPartitions({
        validateOnly: false,
        timeout: 5000,
        topicPartitions: topicsToModify.map(topicMetadata => ({
          topic: topicMetadata.name,
          count:
            findTopic(topicMetadata.name)?.numPartitions! -
            topicMetadata.partitions.length
        }))
      });
    }

    const topicsToCreate = this.subscribedTopics.filter(
      topic =>
        !topicsMetadata.topics.find(
          topicMetadata => topicMetadata.name === `${this.origin}.${topic.name}`
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

  public async connect(): Promise<void> {
    await Promise.all([
      this.kafkaProducer.connect(),
      ...this.kafkaConsumers.map(consumer => consumer.connect())
    ]);
  }

  public get consumers(): Consumer[] {
    return this.kafkaConsumers.map(consumer => consumer.getInstance());
  }

  public get producer(): Producer {
    return this.kafkaProducer.getInstance();
  }
}

export { KafkaClient, KafkaMessaging };
