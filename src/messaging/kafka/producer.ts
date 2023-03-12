import { Kafka } from "kafkajs";

class KafkaProducer {
  constructor(private readonly kafka: Kafka) {}

  public async connect() {
    const producer = this.kafka.producer();
    await producer.connect();
    return producer;
  }
}

export { KafkaProducer };
