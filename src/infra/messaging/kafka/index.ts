import { Kafka, KafkaConfig } from "kafkajs";

class KafkaClient {
  private kafka: Kafka;

  constructor(options: KafkaConfig) {
    this.kafka = new Kafka(options);
  }

  public getInstance() {
    return this.kafka;
  }
}

export { KafkaClient };
