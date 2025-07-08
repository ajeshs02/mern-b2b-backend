import { createClient } from "redis";
import { redisConfig } from "../config/redis.config";
import logger from "../utils/logger";
import dns from "dns";

// Build connection URL (rediss:// enables TLS automatically)
const redisUrl = redisConfig.tls
  ? `rediss://${redisConfig.username}:${redisConfig.password}@${redisConfig.host}:${redisConfig.port}`
  : `redis://${redisConfig.host}:${redisConfig.port}`;

const client = createClient({
  url: redisUrl,
});

client.on("connect", () => {
  logger.info(`✅ Redis connecting to ${redisUrl}...`);
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
    logger.info("🌐 Performing DNS lookup for Redis host...");
    dns.lookup(redisConfig.host, { family: 4 }, (err, address, family) => {
      if (err) {
        logger.error(`❌ DNS Lookup Failed: ${err.message}`);
      } else {
        logger.info(`🌐 DNS Lookup Success: ${address} (IPv${family})`);
      }
    });

    await client.connect();

    if (client.isReady) {
      logger.info("✅ Redis connection established and ready");
    } else {
      logger.warn("⚠️ Redis client is not ready after connect()");
    }

    // Test SET/GET
    await client.set("test:connection", "success");
    const result = await client.get("test:connection");
    logger.info(`📝 Redis test key value: ${result}`);
  } catch (error) {
    logger.error(
      "❌ Failed to connect to Redis. Continuing without Redis.",
      error
    );
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
