import { Kafka, Producer } from "kafkajs";

class KafkaProducer {
  private producer: Producer;

  constructor(private readonly kafka: Kafka) {
    this.producer = this.kafka.producer();
  }

  public async connect() {
    await this.producer.connect();
  }

  public getInstance() {
    return this.producer;
  }
}

export { KafkaProducer };
