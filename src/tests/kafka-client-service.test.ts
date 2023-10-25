import { Kafka } from "kafkajs";
import { KafkaClientService } from "../../src/infra/messaging/kafka/kafka-client-service";

jest.mock("kafkajs");

describe("KafkaClientService", () => {
  let kafkaClientService: KafkaClientService;
  const clientId = "test-client";
  const brokers = ["broker1", "broker2"];
  const sasl = {
    mechanism: "scram-sha-512",
    username: "username",
    password: "password"
  };
  const ssl = true;

  beforeEach(() => {
    (Kafka as jest.Mock).mockClear();
    kafkaClientService = new KafkaClientService(clientId, brokers, sasl, ssl);
  });

  it("should create a new KafkaClientService instance", () => {
    expect(kafkaClientService).toBeInstanceOf(KafkaClientService);
    expect(Kafka).toHaveBeenCalledWith({
      clientId,
      brokers,
      sasl,
      ssl
    });
  });

  it("should return the correct Kafka instance", () => {
    const kafkaInstance = kafkaClientService.getKafkaInstance();
    expect(kafkaInstance).toBeInstanceOf(Kafka);
  });
});
