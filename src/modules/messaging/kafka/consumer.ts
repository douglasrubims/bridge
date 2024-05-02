import type { Consumer, Kafka } from "kafkajs";

class KafkaConsumer {
  private consumer: Consumer;

  constructor(
    private readonly kafka: Kafka,
    private readonly groupId: string,
    private readonly topics: string[]
  ) {
    this.consumer = this.kafka.consumer({
      groupId: this.groupId,
      allowAutoTopicCreation: true,
      retry: {
        retries: Number.POSITIVE_INFINITY
      }
    });
  }

  public async connect(): Promise<void> {
    await this.consumer.connect();

    await this.consumer.subscribe({
      topics: this.topics,
      fromBeginning: false
    });
  }

  public getInstance(): Consumer {
    return this.consumer;
  }
}

export { KafkaConsumer };
