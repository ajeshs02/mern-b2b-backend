import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "cookie-session";
import { config } from "./config/app.config";
import connectDatabase from "./config/database.config";
import { asyncHandler } from "./middlewares/asyncHandler.middleware";
import { NotFoundException } from "./utils/appError";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import passport from "passport";
import "./config/passport.config";
import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/user.route";
import isAuthenticated from "./middlewares/isAuthenticated.middleware";
import workspaceRoutes from "./routes/workspace.route";
import memberRoutes from "./routes/member.route";
import projectRoutes from "./routes/project.route";
import taskRoutes from "./routes/task.route";
import responseLogger from "./middlewares/responseLogger.middleware";
import logger from "./utils/logger";
import globalCache from "./middlewares/globalCache.middleware";
import { connectRedis, disconnectRedis } from "./lib/redis.client";

const app = express();

const BASE_PATH = config.BASE_PATH;

// allow reverse proxy (to fix render authentication issue)
app.set("trust proxy", 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add response logging middleware
app.use(responseLogger);

app.use(
  cors({
    origin: config.FRONTEND_ORIGIN,
    credentials: true,
  })
);

app.use(
  session({
    name: "session",
    keys: [config.SESSION_SECRET],
    maxAge: 24 * 60 * 60 * 1000,
    secure: config.NODE_ENV === "production",
    httpOnly: true,
    sameSite: config.NODE_ENV === "production" ? "none" : "lax",
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Add global cache
app.use(globalCache);

app.use(`${BASE_PATH}/auth`, authRoutes);
app.use(`${BASE_PATH}/user`, isAuthenticated, userRoutes);
app.use(`${BASE_PATH}/workspace`, isAuthenticated, workspaceRoutes);
app.use(`${BASE_PATH}/member`, isAuthenticated, memberRoutes);
app.use(`${BASE_PATH}/project`, isAuthenticated, projectRoutes);
app.use(`${BASE_PATH}/task`, isAuthenticated, taskRoutes);

app.get("/healthz", (req, res) => {
  res.status(200).send("OK");
});

app.use(
  `${BASE_PATH}/*`,
  asyncHandler(async (req, res) => {
    throw new NotFoundException("404 : API not found");
  })
);

app.use(errorHandler);

(async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Connect to Redis
    await connectRedis();

    // Start Express server
    const server = app.listen(config.PORT, () => {
      logger.info(
        `🚀 Server running on port ${config.PORT} in ${config.NODE_ENV}`
      );
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log("🛑 Shutting down...");
      await disconnectRedis();
      server.close(() => {
        console.log("🌙 Server closed");
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
})();
