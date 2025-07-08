import { NextFunction, Request, Response } from "express";
import logger from "../utils/logger";
import redis from "../lib/redis.client";
import { redisConfig } from "../config/redis.config";

// List of route prefixes to skip caching (e.g., auth, )
const SKIP_CACHE_PATHS = ["/api/auth"];

/**
 * CachedResponse defines the structure of the data stored in Redis.
 */
interface CachedResponse {
  status: number; // HTTP status code (e.g., 200, 404)
  body: any; // The full JSON response body
}

/**
 * Global Cache Middleware
 * ----------------------------------------------------------------------------
 * Features:
 * ✅ Automatically caches all GET responses (status + body)
 * ✅ Adds 'X-Cache' header (HIT or MISS) for easy debugging
 * ✅ Flushes entire cache on any data mutation (POST, PUT, DELETE, PATCH)
 *
 *
 * Why?
 * - Keeps controllers clean and unaware of caching
 * - Provides a simple global caching strategy for small/medium apps
 * - Makes API responses consistent whether served from cache or DB
 *
 * Limitations:
 * ❗ Flushes all cached keys on any mutation (not suitable for large-scale apps)
 * ❗ Does not support per-route cache control or selective invalidation
 * ----------------------------------------------------------------------------
 */
const globalCache = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const method = req.method.toUpperCase();
  const cacheKey = req.originalUrl;

  //  Skip caching for certain routes
  if (SKIP_CACHE_PATHS.some((path) => req.originalUrl.startsWith(path))) {
    logger.info(`⏭️ Cache BYPASS for ${req.originalUrl}`);
    return next();
  }

  try {
    // Cache GET responses
    if (method === "GET") {
      const cached = await redis.get(cacheKey);

      if (cached) {
        // Cache HIT: Serve cached response
        const cachedData: CachedResponse = JSON.parse(cached);
        logger.info(`⚡ Cache HIT: ${cacheKey}`);

        res
          .set("X-Cache", "HIT") // Add header for debugging
          .status(cachedData.status || 200)
          .json(cachedData.body);
        return;
      }

      // Cache MISS: Intercept controller's res.json to store fresh response
      const originalJson = res.json.bind(res);
      const originalStatus = res.status.bind(res);
      let statusCode = 200;

      // Capture HTTP status code
      res.status = (code: number) => {
        statusCode = code;
        return originalStatus(code);
      };

      // Capture JSON response and store in Redis
      res.json = (body: any) => {
        res.set("X-Cache", "MISS"); // Add header for debugging

        // Cache only successful responses (2xx)
        if (statusCode >= 200 && statusCode < 300) {
          redis.set(cacheKey, JSON.stringify({ status: statusCode, body }));
          logger.info(`✅ Cache SET: ${cacheKey} (${statusCode})`);
        }

        return originalJson(body);
      };
    }

    // Clear cache on mutations (POST, PUT, DELETE, PATCH)
    if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
      await redis.flushdb();
      logger.info(`🔥 Redis cache FLUSHED due to ${method} ${req.originalUrl}`);
    }
  } catch (err) {
    // Log Redis errors but do not block the request
    logger.error(`❌ Redis cache middleware error:`, err);
  }

  // Continue to the next middleware/controller
  next();
};

export default globalCache;
