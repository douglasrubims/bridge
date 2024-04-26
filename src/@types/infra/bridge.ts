import type { RedisOptions } from "ioredis";
import type { KafkaConfig } from "kafkajs";

import type { LogLevel } from "../../infra/logs/logger";
import type { SubscribedTopic, UseCaseTopics } from "./topics";
import type { UpstashConfig } from "./upstash";

export interface BridgeOptions {
  origin: string;
  groupId: string;
  kafkaConfig: KafkaConfig;
  subscribedTopics: SubscribedTopic[];
  logLevel: LogLevel;
  useCaseTopics?: UseCaseTopics;
  subscribedOrigin?: string;
  partitionsConsumedConcurrently?: number;
  redisConfig?: RedisOptions;
  upstashConfig?: UpstashConfig;
}
