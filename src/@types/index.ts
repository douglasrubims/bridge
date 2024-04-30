import type { RedisOptions } from "ioredis";
import type { KafkaConfig } from "kafkajs";

import type { LogLevel } from "../shared/logs";
import type { SubscribedTopic, UseCaseTopics } from "./modules/messaging/kafka";
import type { UpstashConfig } from "./modules/messaging/upstash";

export interface BridgeOptions {
  microserviceName: string;
  logLevel: LogLevel;
  kafka?: {
    groupId: string;
    kafkaConfig: KafkaConfig;
    subscribedTopics: SubscribedTopic[];
    useCaseTopics?: UseCaseTopics;
    subscribedOrigin?: string;
    partitionsConsumedConcurrently?: number;
    redisConfig?: RedisOptions;
    upstashConfig?: UpstashConfig;
  };
}

export interface Request<T = any> {
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
