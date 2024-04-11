import { Consumer, Kafka } from "kafkajs";

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
      sessionTimeout: 6000,
      heartbeatInterval: 3000,
      retry: {
        retries: Infinity
      }
    });
  }

  public async connect() {
    await this.consumer.connect();

    await this.consumer.subscribe({
      topics: this.topics,
      fromBeginning: false
    });
  }

  public getInstance() {
    return this.consumer;
  }
}

export { KafkaConsumer };
