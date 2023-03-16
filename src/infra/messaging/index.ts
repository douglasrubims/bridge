import { Kafka, Consumer, Producer } from "kafkajs";
import { KafkaClient } from "./kafka";
import { KafkaConsumer } from "./kafka/consumer";
import { KafkaProducer } from "./kafka/producer";

class KafkaMessaging {
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
    console.log(1, this.topics);
  }

  public async connect(): Promise<void> {
    await this.consumer.connect();
    await this.producer.connect();
  }

  public get consumer(): Consumer {
    return this.kafkaConsumer.getInstance();
  }

  public get producer(): Producer {
    return this.kafkaProducer.getInstance();
  }
}

export { KafkaClient, KafkaMessaging };
