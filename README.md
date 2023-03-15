# Bridge

Bridge is a communication interface between microservices with kafkajs and express.js.

## Install

Command: `npm i https://github.com/douglasrubims/Bridge` or `yarn add https://github.com/douglasrubims/Bridge`

## Example

```ts
import { Bridge } from "bridge";

const TOPICS = {
  "topic-name": {
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

    this.bridge = new Bridge(
      "microservice-name", // origin
      kafkaConfig, // kafka config
      "micro-t1", // kafka groupId
      topics: TOPICS // topics object
    );
  }
}

const app = new App();

app.start();
```
