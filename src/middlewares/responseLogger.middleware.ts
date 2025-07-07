import { Request, Response, NextFunction } from "express";
import logger, { redactSensitiveData } from "../utils/logger";

/**
 * Middleware to automatically log every API request & response
 */
const responseLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now(); // ⏱️ Record when request started
  const originalSend = res.send; // Save original res.send method

  //  Override res.send
  res.send = function (body: any): Response {
    const duration = (Date.now() - start) / 1000;

    // Log request & response details
    logger.info(`Request Completed`, {
      request: {
        method: req.method, // GET, POST, etc.
        url: req.originalUrl, // Full URL
        params: req.params, // Route params
        // query: req.query, // Query string
        body: redactSensitiveData(req.body), // Request payload (redacted)
        // headers: req.headers, // Request headers
        // ip: req.ip, // Client IP
      },
      response: {
        statusCode: res.statusCode, // HTTP status
        body: redactSensitiveData(body), // Response payload (redacted)
        duration: `${duration}s`, // Time taken to process request
      },
    });

    // Call original res.send to actually send response
    return originalSend.call(this, body);
  };

  // Continue to next middleware or route
  next();
};

export default responseLogger;
