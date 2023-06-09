# Bridge

Bridge is a communication interface between microservices with kafkajs with promise support.

## Install

Command: `npm i douglasrubims/bridge` or `yarn add douglasrubims/bridge`

## Example

```ts
import { Bridge, UseCaseTopics } from "bridge";

// Received messages will come to use case function automatically
const businessRules: UseCaseTopics = {
  "microservice.topic-name": {
    useCase: yourFunctionHere,
    validation: yourJoiSchemaHere
  }
};

class App {
  private bridge: Bridge;

  constructor() {
    const kafkaConfig = {
      brokers: [process.env.KAFKA_BROKER],
      sasl: {
        mechanism: "scram-sha-512",
        username: process.env.KAFKA_USER,
        password: process.env.KAFKA_PASS
      },
      ssl: true
    };

    const topics = Object.keys(businessRules);

    const topics = topics.reduce((acc: string[], microservice: string) => {
      return [...acc, ...businessRules[microservice]];
    }, []);

    this.bridge = new Bridge(
      "microservice-name", // origin
      kafkaConfig, // kafka config
      "micro-t1", // kafka groupId
      topics, // topics object
      logLevel, // 0 = INFO | 1 = DEBUG
      TOPICS, // consumer topics (optional)
      "other-microservice-name" // send message as other microservice name (optional)
    );

    // Send messages
    const response = await this.bridge.dispatch(
      "destiny.hello-world", // microservice.topic
      { helloworld: "Hello world!" } // your payload
    );
  }
}

const app = new App();

app.start();
```
