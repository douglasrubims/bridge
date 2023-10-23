## Bridge

###### A Bridge to a microservices network mesh that supports promises.

#### Install

`npm i douglasrubims/bridge#V0.1.8` || `yarn add douglasrubims/bridge#V0.1.8`

#### Example

```ts
import { Bridge, BridgeResponse, BridgeUseCaseTopics } from "bridge";
import { SubscribedTopic } from "bridge/src/@types/infra/topics";
import Joi from "joi";

function helloWorld({ name }: { name: string }): Promise<BridgeResponse> {
  console.log(`Hello world, ${name}!`);

  return {
    success: true,
    message: "Hello world executed successfully."
  };
}

const helloWorldJoiVSchema = (data: Record<string, unknown>) =>
  Joi.object({
    name: Joi.string().required().label("Name")
  }).validateAsync(data, {
    abortEarly: true
  });

// received messages will reach the usecase function automatically
const TOPICS: BridgeUseCaseTopics = {
  "hello-world": {
    useCase: helloWorld,
    validation: helloWorldJoiVSchema
  }
};

class App {
  private bridge: Bridge;

  constructor() {
    const subscribedTopics: SubscribedTopic[] = Object.keys(TOPICS).map(
      topic => ({
        name: topic,
        numPartitions: TOPICS[topic].numPartitions
      })
    );

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
      "microservice-name", // origin (microservice name)
      kafkaConfig, // kafka server config
      "microservice-name-t1", // kafka groupId
      subscribedTopics, // topics that your microservice will listen
      0, // Log Level: 0 = INFO | 1 = DEBUG
      TOPICS, // consumer topics (optional) -> your microservice usecases
      undefined, // send message as other microservice name {String} (optional) -> useful to debug microservices
      5 // number of messages consumed by topic concurrently (optional)
    );

    // Example that another microservice sends a request
    const response = await this.bridge.dispatch(
      "microservice-name.hello-world", // format: microservice-name.topic-name
      { name: "Douglas Rubim" } // your payload
    );

    console.log(response);
    // {
    //   success: true,
    //   message: "Hello world executed successfully."
    // }

    // on the microservice console:
    // Hello world, Douglas Rubim.
  }
}

const app = new App();

app.start();
```
