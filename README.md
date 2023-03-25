# Bridge

Bridge is a communication interface between microservices with kafkajs and express.js.

## Install

Command: `npm i https://github.com/douglasrubims/Bridge` or `yarn add https://github.com/douglasrubims/Bridge`

## Example

```ts
import { Bridge, UseCaseTopics } from "bridge";

// Received messages will come to use case function automatically
const TOPICS: UseCaseTopics = {
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

    const microservices = Object.keys(TOPICS);

    const topics = microservices.reduce(
      (acc: string[], microservice: string) => {
        return [...acc, ...TOPICS[microservice]];
      },
      []
    );

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
    this.bridge.dispatch(
      "destiny.hello-world", // microservice.topic
      { helloworld: "Hello world!" } // your payload
      // request, // required to callback function with express.js (optional)
      // response, // required to callback function with express.js (optional)
      // callback, // execute on receive a callback response on `origin.topic` -> (payload, req, res) => Promise<void> (optional)
      // "callback-topic" // topic that will send callback (optional)
    );
  }
}

const app = new App();

app.start();
```
