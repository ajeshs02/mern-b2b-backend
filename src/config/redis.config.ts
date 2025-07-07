import { config } from "./app.config";

export const redisConfig = {
  host: config.REDIS_HOST,
  port: parseInt(config.REDIS_PORT, 10),
  password: config.REDIS_PASSWORD || undefined,
  ttl: parseInt(config.REDIS_TTL, 10),
  tls: config.REDIS_TLS === "true",
};
