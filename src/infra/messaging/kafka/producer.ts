import { Kafka, Producer, CompressionTypes, CompressionCodecs } from "kafkajs";
import LZ4 from "kafkajs-lz4";

CompressionCodecs[CompressionTypes.LZ4] = new LZ4().codec;

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
