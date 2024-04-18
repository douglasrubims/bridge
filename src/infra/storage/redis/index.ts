import Redis, { type RedisOptions } from "ioredis";

import type { Response } from "../../../@types/infra/response";
import type { CallbackProps } from "../callback-storage";

const CHUNK_SIZE = 900 * 1024; // 900KB

class RedisCallbackStorage {
  private client: Redis;

  constructor(options: RedisOptions) {
    this.client = new Redis(options);
  }

  async get(key: string): Promise<CallbackProps | undefined> {
    let value = await this.client.get(key);

    if (!value) return;

    if (value.startsWith("CHUNKED:")) {
      const chunkCount = Number(value.split(":")[1]);
      value = "";

      for (let i = 0; i < chunkCount; i++) {
        const chunk = await this.client.get(`${key}:CHUNK:${i}`);

        if (!chunk) return;

        value += chunk;
      }
    }

    return JSON.parse(value);
  }

  async add<T>(
    key: string,
    value: (value: Response<T> | PromiseLike<Response<T>>) => void,
    expirationInSeconds = 24 * 60 * 60 // 1 day
  ): Promise<void> {
    const stringValue = JSON.stringify(value);
    const bufferValue = Buffer.from(stringValue);

    if (bufferValue.length > CHUNK_SIZE) {
      const chunkCount = Math.ceil(bufferValue.length / CHUNK_SIZE);

      for (let i = 0; i < chunkCount; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, bufferValue.length);
        const chunk = bufferValue.slice(start, end).toString();

        await this.client.set(
          `${key}:CHUNK:${i}`,
          chunk,
          "EX",
          expirationInSeconds
        );
      }

      await this.client.set(
        key,
        `CHUNKED:${chunkCount}`,
        "EX",
        expirationInSeconds
      );
    } else await this.client.set(key, stringValue, "EX", expirationInSeconds);
  }

  async remove(key: string): Promise<boolean> {
    const result = await this.client.del(key);

    return result > 0;
  }
}

export { RedisCallbackStorage };
