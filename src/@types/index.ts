import type { RedisOptions } from "ioredis";
import type { KafkaConfig } from "kafkajs";

import type { LogLevel } from "../shared/logs";
import type { UseCaseTopics as ExpressUseCaseTopics } from "./modules/messaging/express";
import type {
  UseCaseTopics as KafkaUseCaseTopics,
  SubscribedTopic
} from "./modules/messaging/kafka";
import type { UpstashConfig } from "./modules/messaging/upstash";

export interface BridgeOptions {
  microserviceName: string;
  logLevel: LogLevel;
  express?: {
    secretToken: string;
    useCaseTopics: ExpressUseCaseTopics;
  };
  kafka?: {
    groupId: string;
    kafkaConfig: KafkaConfig;
    subscribedTopics: SubscribedTopic[];
    useCaseTopics?: KafkaUseCaseTopics;
    subscribedOrigin?: string;
    partitionsConsumedConcurrently?: number;
    redisConfig?: RedisOptions;
    upstashConfig?: UpstashConfig;
  };
}

export interface ExpressRequest<T = any> {
  topic: string;
  payload: T;
}

export interface KafkaRequest<T = any> {
  hash: string;
  payload: T;
  origin: string;
  request: boolean;
  callback?: boolean;
  callbackTopic?: string;
}

export interface Response<T = any> {
  success: boolean;
  message: string;
  data?: T;
}
