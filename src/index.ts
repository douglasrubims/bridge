import { Request } from "./@types/request";
import { Response } from "./@types/response";
import { Topics } from "./@types/topics";

import { KafkaClient, KafkaMessaging } from "./messaging";

import { BaseValidator } from "./validations/base";

class Bridge {
  private kafkaClient: KafkaClient;
  private kafkaMessaging: KafkaMessaging;

  constructor(
    private readonly origin: string,
    private readonly kafkaConfig: {
      clientId: string;
      brokers: string[];
      sasl: {
        mechanism: "scram-sha-512";
        username: string;
        password: string;
      };
      ssl: boolean;
    },
    private readonly groupId: string,
    private readonly topics: Topics
  ) {
    this.kafkaClient = new KafkaClient(
      this.kafkaConfig.clientId,
      this.kafkaConfig.brokers,
      this.kafkaConfig.sasl,
      this.kafkaConfig.ssl
    );

    const kafka = this.kafkaClient.getInstance();

    this.kafkaMessaging = new KafkaMessaging(
      kafka,
      this.groupId,
      Object.keys(this.topics as object).map(topic => `${origin}.${topic}`)
    );
  }

  public async connect(): Promise<void> {
    await this.kafkaMessaging.connect();

    await this.kafkaMessaging.consumer.run({
      eachMessage: async ({ topic, message }) => {
        if (!message.value) return;

        topic = topic.split(".")[1];

        await this.process(topic, JSON.parse(message.value.toString()));
      }
    });
  }

  private async process(topic: string, message: Request): Promise<void> {
    const { hash, payload, origin, callback, callbackTopic } = message;

    const validation = await this.validatePayload(topic, payload);

    let response: Response = {
      success: false,
      message: "Invalid payload",
      data: { errors: validation.errors }
    };

    try {
      if (validation.isValid)
        response = await this.topics[topic].useCase(payload);
    } catch (error) {
      response = {
        success: false,
        message: (error as Error).message || "Unknown error"
      };
    } finally {
      if (callback) {
        if (callbackTopic) topic = callbackTopic;

        await this.kafkaMessaging.producer.send({
          topic: `goldcare.${topic}`,
          messages: [
            {
              value: JSON.stringify({
                hash,
                payload: response,
                origin: this.origin,
                callback: false
              })
            }
          ]
        });
      }
    }
  }

  private async validatePayload(topic: string, payload: any) {
    const { validation } = this.topics[topic];

    const validator = new BaseValidator(validation);

    return await validator.validate(payload);
  }
}

export { Bridge };
