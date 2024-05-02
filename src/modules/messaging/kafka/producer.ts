import type { Kafka, Producer } from "kafkajs";

class KafkaProducer {
  private producer: Producer;

  constructor(private readonly kafka: Kafka) {
    this.producer = this.kafka.producer();
  }

  public async connect(): Promise<void> {
    await this.producer.connect();
  }

  public getInstance(): Producer {
    return this.producer;
  }
}

export { KafkaProducer };
