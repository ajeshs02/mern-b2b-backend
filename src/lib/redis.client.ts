import { createClient } from "redis";
import { redisConfig } from "../config/redis.config";
import logger from "../utils/logger";

// Create Redis client with Upstash URL
const client = createClient({
  url: redisConfig.url,
});

client.on("connect", () => {
  logger.info(`Redis connecting to ${redisConfig.url}...`);
});

client.on("ready", () => {
  logger.info("🚀 Redis client ready to use");
});

client.on("error", (err) => {
  logger.error(`❌ Redis client error: ${err.message}`);
});

client.on("end", () => {
  logger.warn("🔌 Redis connection closed");
});

export default client;

export const connectRedis = async (): Promise<void> => {
  try {
    await client.connect();

    if (client.isReady) {
      logger.info("Redis connection established and ready");
    } else {
      logger.warn("⚠️ Redis client is not ready after connect()");
    }

    // Test SET/GET
    await client.set("test:connection", "success");
    const result = await client.get("test:connection");
    logger.info(`📝 Redis test key value: ${result}`);
  } catch (error) {
    logger.error("❌ Failed to connect to Upstash Redis:", error);
  }
};

export const disconnectRedis = async (): Promise<void> => {
  try {
    await client.quit();
    logger.info("🔌 Redis disconnected gracefully");
  } catch (error) {
    logger.error("❌ Error disconnecting Redis:", error);
  }
};
