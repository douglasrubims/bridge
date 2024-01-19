import { Kafka, KafkaConfig } from "kafkajs";

class KafkaClient {
  private kafka: Kafka;

  constructor(
    private readonly clientId: string,
    private readonly brokers: string[],
    private readonly sasl?: {
      mechanism: "scram-sha-512";
      username: string;
      password: string;
    },
    private readonly ssl?: boolean
  ) {
    const options: KafkaConfig = {
      clientId: this.clientId,
      brokers: this.brokers,
      ssl: this.ssl ?? false,
      retry: {
        initialRetryTime: 100,
        retries: Infinity,
        maxRetryTime: 5000,
        factor: 0.2,
        multiplier: 2
      }
    };

    if (this.sasl) options.sasl = this.sasl;

    this.kafka = new Kafka(options);
  }

  public getInstance() {
    return this.kafka;
  }
}

export { KafkaClient };
