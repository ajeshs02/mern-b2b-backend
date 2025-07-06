import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { randomBytes } from "crypto";

// Destructure some format utilities from Winston
const { combine, timestamp, printf, json } = winston.format;

//  Generate a random log ID (helps to trace a log across services)
const generateLogId = () => randomBytes(8).toString("hex");

// Set a custom timestamp format
const timestampFormat = "YYYY-MM-DD HH:mm:ss";

//  Create a Winston logger instance
const logger = winston.createLogger({
  // Set the minimum level of messages to log
  level: process.env.NODE_ENV === "production" ? "info" : "debug",

  // Define how logs are formatted
  format: combine(
    timestamp({ format: timestampFormat }), // Add timestamp to each log
    json(), // Convert log to JSON
    printf(({ timestamp, level, message, ...meta }) => {
      return (
        JSON.stringify(
          {
            logId: generateLogId(), // Unique ID for each log
            timestamp, // Timestamp of log
            level, // Log level (info, error, etc.)
            message, // Log message
            meta,
          },
          null,
          2
        ) + "\n\n"
      );
    })
  ),

  // Where to send logs
  transports: [
    // Print to console
    new winston.transports.Console({
      format: combine(
        winston.format.colorize({ all: true }), // 🎨 Add colors
        printf(({ timestamp, level, message, ...meta }) => {
          return `[${timestamp}] ${level}: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""
          }`;
        })
      ),
    }),

    // Save logs to daily rotated files in logs/ folder
    new DailyRotateFile({
      filename: "logs/app-%DATE%.log", // e.g., app-2025-07-06.log
      datePattern: "YYYY-MM-DD", // Daily rotation
      // datePattern: "YYYY-MM-DD-HH-mm", // Rotate every minute
      maxSize: "10m", // Rotate if file > 10MB
      maxFiles: "14d", // Keep logs for 14 days
    }),
  ],
});

export default logger;

/**
 * Utility to hide sensitive fields from logs
 * e.g., password becomes "*****"
 */
export const redactSensitiveData = (data: any) => {
  const SENSITIVE_KEYS = ["password", "newPassword", "oldPassword"];
  if (typeof data !== "object" || data === null) return data;

  return JSON.parse(
    JSON.stringify(data, (key, value) =>
      SENSITIVE_KEYS.includes(key) ? "*****" : value
    )
  );
};
