import { Kafka } from "kafkajs";
import { KafkaClient } from "./kafka";
import { KafkaConsumer } from "./kafka/consumer";
import { KafkaProducer } from "./kafka/producer";

class Bridge {
  private kafkaConsumer: KafkaConsumer;
  private kafkaProducer: KafkaProducer;

  constructor(
    private readonly kafka: Kafka,
    private readonly groupId: string,
    private readonly topics: string[]
  ) {
    this.kafkaConsumer = new KafkaConsumer(
      this.kafka,
      this.groupId,
      this.topics
    );
    this.kafkaProducer = new KafkaProducer(this.kafka);
  }

  public get consumer(): KafkaConsumer {
    return this.kafkaConsumer;
  }

  public get producer(): KafkaProducer {
    return this.kafkaProducer;
  }
}

export { KafkaClient, Bridge };
