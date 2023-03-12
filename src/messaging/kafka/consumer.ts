import { Kafka } from "kafkajs";

class KafkaConsumer {
  constructor(
    private readonly kafka: Kafka,
    private readonly groupId: string,
    private readonly topics: string[]
  ) {}

  public async connect() {
    const consumer = this.kafka.consumer({ groupId: this.groupId });
    await consumer.connect();
    await consumer.subscribe({ topics: this.topics });
    return consumer;
  }
}

export { KafkaConsumer };
