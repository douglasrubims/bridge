import { Kafka } from "kafkajs";

class KafkaClient {
  private kafka: Kafka;

  constructor(
    private readonly clientId: string,
    private readonly brokers: string[],
    private readonly sasl: {
      mechanism: "scram-sha-512";
      username: string;
      password: string;
    },
    private readonly ssl: boolean
  ) {
    this.kafka = new Kafka({
      clientId: this.clientId,
      brokers: this.brokers,
      sasl: this.sasl,
      ssl: this.ssl
    });
  }

  public getInstance() {
    return this.kafka;
  }
}

export { KafkaClient };
