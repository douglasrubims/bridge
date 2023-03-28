import { Kafka, Consumer, Producer } from "kafkajs";
import { KafkaClient } from "./kafka";
import { KafkaConsumer } from "./kafka/consumer";
import { KafkaProducer } from "./kafka/producer";

class KafkaMessaging {
  private kafkaConsumer: KafkaConsumer;
  private kafkaProducer: KafkaProducer;

  constructor(
    private readonly kafka: Kafka,
    private readonly groupId: string,
    private readonly topics: string[]
  ) {
    this.kafkaConsumer = new KafkaConsumer(
      this.kafka,
      this.groupId,
      this.topics
    );
    this.kafkaProducer = new KafkaProducer(this.kafka);
  }

  public async syncTopics(): Promise<void> {
    const topics = await this.kafka.admin().listTopics();

    const topicsToCreate = this.topics.filter(topic => !topics.includes(topic));

    await this.kafka.admin().createTopics({
      topics: topicsToCreate.map(topic => ({
        topic,
        numPartitions: 1,
        replicationFactor: 1,
        configEntries: [
          {
            name: "cleanup.policy",
            value: "delete"
          }
        ]
      }))
    });
  }

  public async connect(): Promise<void> {
    await Promise.all([
      this.kafkaConsumer.connect(),
      this.kafkaProducer.connect()
    ]);
  }

  public get consumer(): Consumer {
    return this.kafkaConsumer.getInstance();
  }

  public get producer(): Producer {
    return this.kafkaProducer.getInstance();
  }
}

export { KafkaClient, KafkaMessaging };
