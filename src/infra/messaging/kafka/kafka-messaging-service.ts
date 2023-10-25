import { KafkaConsumer } from "./consumer";
import { KafkaProducer } from "./producer";
import { SubscribedTopic } from "../../../@types/infra/topics";

class KafkaMessagingService {
  private consumer: KafkaConsumer;
  private producer: KafkaProducer;

  constructor(
    kafka: any,
    private readonly groupId: string,
    private readonly subscribedOrigin: string,
    private readonly subscribedTopics: SubscribedTopic[],
    private readonly multipleConsumers: boolean
  ) {
    this.consumer = new KafkaConsumer(kafka, groupId, subscribedTopics.map(topic => topic.name));
    this.producer = new KafkaProducer(kafka);
  }

  public async syncTopics(): Promise<void> {
    for (const topic of this.subscribedTopics) {
      await this.consumer.subscribe({ topic: topic.name, fromBeginning: topic.fromBeginning });
    }
  }

  public async connect(): Promise<void> {
    await this.consumer.connect();
    await this.producer.connect();
  }

  public getProducer(): KafkaProducer {
    return this.producer;
  }
}

export { KafkaMessagingService };
