import { Kafka, KafkaConfig } from "kafkajs";

class KafkaClient {
  private kafka: Kafka;

  constructor(
    private readonly clientId: string,
    private readonly brokers: string[],
    private readonly ssl: boolean,
    private readonly sasl?: {
      mechanism: "scram-sha-512";
      username: string;
      password: string;
    }
  ) {
    const options: KafkaConfig = {
      clientId: this.clientId,
      brokers: this.brokers,
      ssl: this.ssl
    };

    if (this.sasl) options.sasl = this.sasl;

    this.kafka = new Kafka(options);
  }

  public getInstance() {
    return this.kafka;
  }
}

export { KafkaClient };
