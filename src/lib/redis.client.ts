import Redis, { RedisOptions } from "ioredis";
import { redisConfig } from "../config/redis.config";
import logger from "../utils/logger";
import dns from "dns";

export const redisOptions: RedisOptions = {
  host: redisConfig.host,
  port: redisConfig.port,
  password: redisConfig.password,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    logger.info(`Redis reconnecting in ${delay}ms...`);
    return delay;
  },
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  lazyConnect: true, // Important: Don't auto-connect
  tls: redisConfig.tls ? {} : undefined,
};

const redis = new Redis(redisOptions);

redis.on("connect", () => {
  logger.info(`✅ Redis connected to ${redisConfig.host}:${redisConfig.port}`);
});

redis.on("ready", () => {
  logger.info("✅ Redis client ready to use");
});

redis.on("error", (err) => {
  logger.error(`❌ Redis client error: ${err.message}`);
});

redis.on("end", () => {
  logger.info("🔌 Redis connection closed");
});

// Export both the client and connection function
export default redis;

// Explicit connection function
export const connectRedis = async (): Promise<void> => {
  try {
    logger.info("🌐 Performing DNS lookup for Redis host...");
    dns.lookup(redisConfig.host, (err, address, family) => {
      if (err) {
        logger.error(
          `❌ DNS Lookup Failed for ${redisConfig.host}: ${err.message}`
        );
      } else {
        logger.info(`🌐 DNS Lookup Success: ${address} (IPv${family})`);
      }
    });

    await redis.connect();
    await redis.ping();
    logger.info("🚀 Redis connection established and tested");
  } catch (error) {
    logger.error("❌ Redis unavailable. Continuing without Redis.");
  }
};

export const disconnectRedis = async (): Promise<void> => {
  try {
    await redis.quit();
    logger.info("🔌 Redis disconnected gracefully");
  } catch (error) {
    logger.error("❌ Error disconnecting Redis:", error);
  }
};
