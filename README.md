# Bridge: Simplifying Microservices Communication

## Overview

**Bridge** is a powerful tool designed to seamlessly connect microservices in a network mesh, enabling efficient communication and data exchange. Our focus is on simplicity and reliability, ensuring your microservices can easily make promises and fulfill them.

## Getting Started

### Installation

You can quickly add Bridge to your project using either npm or yarn. Choose the command that corresponds to your package manager:

- Using npm:
  ```
  npm i douglasrubims/bridge#V0.2.1
  ```
- Using yarn:
  ```
  yarn add douglasrubims/bridge#V0.2.1
  ```

### Quick Example

Let's dive into a simple example to get a feel for how Bridge works.

#### Step 1: Import and Setup

First, import the necessary components from Bridge:

```typescript
import { Bridge, BridgeResponse, BridgeUseCaseTopics } from "bridge";
import { SubscribedTopic } from "bridge/src/@types/infra/topics";
import Joi from "joi";
```

#### Step 2: Define a Function

Create a function like `helloWorld` which will handle your requests. This function will log a message and return a promise:

```typescript
function helloWorld({ name }: { name: string }): Promise<BridgeResponse> {
  console.log(`Hello world, ${name}!`);

  return {
    success: true,
    message: "Hello world executed successfully."
  };
}
```

#### Step 3: Set Up Validation

Use Joi to validate your data schemas:

```typescript
const helloWorldJoiVSchema = (data: Record<string, unknown>) =>
  Joi.object({
    name: Joi.string().required().label("Name")
  }).validateAsync(data, { abortEarly: true });
```

#### Step 4: Configure Topics

Configure the topics that your microservice will listen to:

```typescript
const TOPICS: BridgeUseCaseTopics = {
  "hello-world": {
    useCase: helloWorld,
    validation: helloWorldJoiVSchema
  }
};
```

#### Step 5: Initialize and Use Bridge

Create your application class, initialize Bridge with your configuration, and demonstrate sending a message:

```typescript
class App {
  private bridge: Bridge;

  constructor() {
    // [Insert your configuration setup here, including Kafka config]

    // Example of dispatching a request
    const response = await this.bridge.dispatch(
      "microservice-name.hello-world",
      { name: "Douglas Rubim" }
    );

    console.log(response); // Expected output
  }

  // Start your application
  start() {
    // [Your startup logic here]
  }
}

const app = new App();
app.start();
```

## Next Steps

You're now ready to integrate Bridge into your microservices architecture! Explore the full capabilities of Bridge to enhance your application's communication and data handling.
