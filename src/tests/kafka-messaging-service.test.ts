import { KafkaMessagingService } from "../../src/infra/messaging/kafka/kafka-messaging-service";
import { KafkaConsumer } from "../../src/infra/messaging/kafka/consumer";
import { KafkaProducer } from "../../src/infra/messaging/kafka/producer";

jest.mock("../../src/infra/messaging/kafka/consumer");
jest.mock("../../src/infra/messaging/kafka/producer");

describe("KafkaMessagingService", () => {
  let kafkaMessagingService: KafkaMessagingService;
  const groupId = "test-group";
  const subscribedOrigin = "test-origin";
  const subscribedTopics = [{ name: "topic1", fromBeginning: true }];
  const multipleConsumers = true;
  const kafka = {};

  beforeEach(() => {
    (KafkaConsumer as jest.Mock).mockClear();
    (KafkaProducer as jest.Mock).mockClear();
    kafkaMessagingService = new KafkaMessagingService(
      kafka,
      groupId,
      subscribedOrigin,
      subscribedTopics,
      multipleConsumers
    );
  });

  it("should create a new KafkaMessagingService instance", () => {
    expect(kafkaMessagingService).toBeInstanceOf(KafkaMessagingService);
    expect(KafkaConsumer).toHaveBeenCalledWith(
      kafka,
      groupId,
      subscribedTopics.map(topic => topic.name)
    );
    expect(KafkaProducer).toHaveBeenCalledWith(kafka);
  });

  it("should subscribe to all topics", async () => {
    const mockSubscribe = jest.fn();
    KafkaConsumer.prototype.subscribe = mockSubscribe;

    await kafkaMessagingService.syncTopics();

    expect(mockSubscribe).toHaveBeenCalledTimes(subscribedTopics.length);
    for (const topic of subscribedTopics) {
      expect(mockSubscribe).toHaveBeenCalledWith({
        topic: topic.name,
        fromBeginning: topic.fromBeginning
      });
    }
  });

  it("should connect the consumer and producer", async () => {
    const mockConnect = jest.fn();
    KafkaConsumer.prototype.connect = mockConnect;
    KafkaProducer.prototype.connect = mockConnect;

    await kafkaMessagingService.connect();

    expect(mockConnect).toHaveBeenCalledTimes(2);
  });

  it("should return the producer instance", () => {
    const producer = kafkaMessagingService.getProducer();

    expect(producer).toBeInstanceOf(KafkaProducer);
  });
});
