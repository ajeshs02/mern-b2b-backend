import { config } from "./app.config";

export const redisConfig = {
  /**
   * Full Upstash Redis URL (rediss://default:<token>@<db>.upstash.io:6379)
   */
  url: config.REDIS_URL,
  /**
   * TTL for cached keys (default to 300 seconds if not set)
   */
  ttl: parseInt(config.REDIS_TTL, 10) || 300,
};
