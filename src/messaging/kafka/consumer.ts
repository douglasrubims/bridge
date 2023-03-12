import { Kafka, Consumer } from "kafkajs";

class KafkaConsumer {
  private consumer: Consumer;

  constructor(
    private readonly kafka: Kafka,
    private readonly groupId: string,
    private readonly topics: string[]
  ) {
    this.consumer = this.kafka.consumer({
      groupId: this.groupId,
      allowAutoTopicCreation: true
    });
  }

  public async connect() {
    await this.consumer.connect();
    await this.consumer.subscribe({ topics: this.topics });
  }

  public getInstance() {
    return this.consumer;
  }
}

export { KafkaConsumer };
